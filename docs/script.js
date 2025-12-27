const cellSize = 14;
const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

Promise.all([
  d3.csv("calendar_daily.csv", d => ({
    endpoint: d.endpoint,
    date: new Date(d.date),
    downtime: +d.downtime_min
  })),
  d3.json("meta.json")
]).then(([data, meta]) => {

  // --- META ---
  d3.select("#meta").text(
    `Senast uppdaterad: ${meta.generated_at} · Commit: ${meta.commit}`
  );

  // --- GROUP BY ENDPOINT ---
  const byEndpoint = d3.group(data, d => d.endpoint);

  const container = d3.select("#calendars");

  const color = d3.scaleSequential(d3.interpolateReds)
    .domain([0, d3.max(data, d => d.downtime)]);

  for (const [endpoint, rows] of byEndpoint) {

    container.append("h3").text(endpoint.replaceAll("_", " "));

    const cal = container.append("div")
      .attr("class", "calendar");

    const svg = cal.append("svg")
      .attr("width", 900)
      .attr("height", 7 * cellSize + 20);

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
      .attr("fill", d => d.downtime > 0 ? color(d.downtime) : "#eee")
      .append("title")
      .text(d =>
        `${endpoint}\n${d.date.toISOString().slice(0,10)}\n` +
        `${d.downtime.toFixed(1)} min nertid`
      );
  }
});
