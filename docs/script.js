d3.csv("calendar_daily.csv", d => ({
  endpoint: d.endpoint,
  date: new Date(d.date),
  downtime: +d.downtime_min
})).then(data => {

  const width = 900;
  const cell = 15;

  const svg = d3.select("#calendar")
    .append("svg")
    .attr("width", width)
    .attr("height", 200);

  const color = d3.scaleSequential(d3.interpolateReds)
    .domain([0, d3.max(data, d => d.downtime)]);

  svg.selectAll("rect")
    .data(data)
    .enter()
    .append("rect")
    .attr("width", cell)
    .attr("height", cell)
    .attr("x", d => d3.timeWeek.count(d3.timeYear(d.date), d.date) * cell)
    .attr("y", d => d.date.getDay() * cell)
    .attr("fill", d => d.downtime > 0 ? color(d.downtime) : "#eee")
    .append("title")
    .text(d =>
      `${d.endpoint}\n${d.date.toISOString().slice(0,10)}\n${d.downtime.toFixed(1)} min`
    );
});
