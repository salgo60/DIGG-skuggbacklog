/* ============================
   Hjälpfunktioner 2
============================ */

function niceEndpoint(name) {
  return name.replaceAll("_", " ");
}

function colorForDowntime(min) {
  if (min === 0) return "#eee";
  if (min < 5) return "#fde0dd";
  if (min < 15) return "#fcae91";
  if (min < 60) return "#fb6a4a";
  return "#cb181d";
}

/* ============================
   Tabell: Incidenter (sammanfattning)
============================ */

function renderSummaryTable(data) {
  const summary = Array.from(
    d3.rollup(
      data,
      v => ({
        incidents: v.length,
        total_min: d3.sum(v, d => d.duration_min),
        max_min: d3.max(v, d => d.duration_min)
      }),
      d => d.endpoint
    ),
    ([endpoint, s]) => ({
      endpoint,
      incidents: s.incidents,
      total_min: s.total_min,
      total_hours: (s.total_min / 60).toFixed(1),
      max_min: s.max_min.toFixed(1)
    })
  );

  const table = d3.select("#summary");
  table.html("");

  table.append("thead").append("tr")
    .selectAll("th")
    .data([
      "Tjänst",
      "Incidenter",
      "Total nertid (min)",
      "Total nertid (h)",
      "Längsta incident (min)"
    ])
    .enter()
    .append("th")
    .text(d => d);

  const rows = table.append("tbody")
    .selectAll("tr")
    .data(summary)
    .enter()
    .append("tr");

  rows.append("td").text(d => niceEndpoint(d.endpoint));
  rows.append("td").text(d => d.incidents);
  rows.append("td").text(d => d.total_min.toFixed(1));
  rows.append("td").text(d => d.total_hours);
  rows.append("td").text(d => d.max_min);
}

/* ============================
   Tabell: Incidenter över tid
============================ */

function renderIncidentsTable(data) {
  const table = d3.select("#incidents");
  table.html("");

  table.append("thead").append("tr")
    .selectAll("th")
    .data([
      "Tjänst",
      "Start",
      "Slut",
      "Varaktighet (min)",
      "Pågående"
    ])
    .enter()
    .append("th")
    .text(d => d);

  const rows = table.append("tbody")
    .selectAll("tr")
    .data(data)
    .enter()
    .append("tr");

  rows.append("td").text(d => niceEndpoint(d.endpoint));
  rows.append("td").text(d => d.start);
  rows.append("td").text(d => d.end);
  rows.append("td").text(d => d.duration_min.toFixed(1));
  rows.append("td").text(d => d.ongoing ? "Ja" : "");
}

/* ============================
   Kalender per endpoint
============================ */

function renderCalendars(data) {
  const cellSize = 14;

  const container = d3.select("#calendars");
  container.html("");

  const byEndpoint = d3.group(data, d => d.endpoint);

  for (const [endpoint, rows] of byEndpoint) {

    container.append("h3").text(niceEndpoint(endpoint));

    const svg = container.append("div")
      .attr("class", "calendar")
      .append("svg")
      .attr("width", 900)
      .attr("height", 7 * cellSize + 20);

	const days = ["Sön", "Mån", "Tis", "Ons", "Tor", "Fre", "Lör"];

	svg.selectAll("text.day")
	  .data(days)
	  .enter()
	  .append("text")
	  .attr("class", "day-label")
	  .attr("x", -6)
	  .attr("y", (_, i) => i * cellSize + cellSize - 2)
	  .attr("text-anchor", "end")
	  .text(d => d);
    svg.selectAll("rect")
      .data(rows)
      .enter()
      .append("rect")
      .attr("width", cellSize)
      .attr("height", cellSize)
      .attr("x", d =>
        d3.timeWeek.count(d3.timeYear(d.date), d.date) * cellSize
      )
      .attr("y", d => d.date.getDay() * cellSize)
      .attr("fill", d => colorForDowntime(d.downtime))
      .append("title")
      .text(d =>
        `${niceEndpoint(endpoint)}\n` +
        `${d.date.toISOString().slice(0, 10)}\n` +
        `${d.downtime.toFixed(1)} min nertid`
      );
  }
}

function renderLegend() {
  const legend = d3.select("#legend");
  legend.html("");

  const items = [
    { label: "< 5 min", color: "#fde0dd" },
    { label: "5–15 min", color: "#fcae91" },
    { label: "15–60 min", color: "#fb6a4a" },
    { label: "> 60 min", color: "#cb181d" }
  ];

  const row = legend.append("div")
    .attr("class", "legend-row");

  items.forEach(i => {
    const item = row.append("div")
      .attr("class", "legend-item");

    item.append("span")
      .attr("class", "legend-swatch")
      .style("background", i.color);

    item.append("span")
      .text(i.label);
  });
}

function renderYearBand(calendar) {
  const width = 900;
  const height = 18;
  const barHeight = height;

  const container = d3.select("#yearband");
  container.html("");

  const byEndpoint = d3.group(calendar, d => d.endpoint);

  const maxDowntime = d3.max(calendar, d => d.downtime);

  const color = d3.scaleSequential(d3.interpolateReds)
    .domain([0, maxDowntime || 1]);

  for (const [endpoint, rows] of byEndpoint) {

    container.append("div")
      .attr("class", "yearband-label")
      .text(niceEndpoint(endpoint));

    const svg = container.append("svg")
      .attr("class", "yearband")
      .attr("width", width)
      .attr("height", barHeight);

    const x = d3.scaleTime()
      .domain(d3.extent(rows, d => d.date))
      .range([0, width]);

    svg.selectAll("rect")
      .data(rows)
      .enter()
      .append("rect")
      .attr("x", d => x(d.date))
      .attr("y", 0)
      .attr("width", 6)
      .attr("height", barHeight)
      .attr("fill", d => color(d.downtime))
      .append("title")
      .text(d =>
        `${niceEndpoint(endpoint)}\n` +
        `${d.date.toISOString().slice(0,10)}\n` +
        `${d.downtime.toFixed(1)} min nertid`
      );
  }
}


function renderMonthlyBars(calendar) {
  const byMonth = d3.rollup(
    calendar,
    v => d3.sum(v, d => d.downtime),
    d => d.endpoint,
    d => d.date.toISOString().slice(0,7)
  );

  const container = d3.select("#monthlybars");

  for (const [endpoint, months] of byMonth) {
    container.append("h3").text(niceEndpoint(endpoint));

    const data = Array.from(months, ([month, downtime]) => ({
      month,
      downtime
    })).sort((a,b) => a.month.localeCompare(b.month));

    // (Här kan vi lägga full D3-bar-chart – säger till om du vill ha komplett kod)
  }
}

/* ============================
   Main: ladda allt
============================ */

Promise.all([
  d3.csv("incidents_clean.csv", d => ({
    endpoint: d.endpoint,
    start: d.start,
    end: d.end,
    duration_min: +d.duration_min,
    ongoing: d.ongoing === "True"
  })),
  d3.csv("calendar_daily.csv", d => ({
    endpoint: d.endpoint,
    date: new Date(d.date),
    downtime: +d.downtime_min
  })),
  d3.json("meta.json")
]).then(([incidents, calendar, meta]) => {

  renderSummaryTable(incidents);
  renderIncidentsTable(incidents);
  renderCalendars(calendar);
  renderLegend();
  renderYearBand(calendar);

  d3.select("#meta").text(
    `Senast uppdaterad: ${meta.generated_at} · Commit: ${meta.commit}`
  );

});
