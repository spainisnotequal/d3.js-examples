import * as d3 from "https://unpkg.com/d3?module";

// based on: https://observablehq.com/@d3/transition-end

// 1) put the code into an asynchronous anonymous function, because we are awaiting the transition to end
// 2) delete the "yield" keyword when it appears (in this example, it appears twice)
(async () => {
  const width = 400;
  const radius = 32;
  const height = radius * 3;

  const svg = d3
    .select("#svg-container")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  const circle = svg
    .append("circle")
    .attr("r", radius)
    .attr("cx", width / 2 + radius)
    .attr("cy", height / 2)
    .attr("fill", "transparent")
    .attr("stroke", "black")
    .attr("stroke-width", 2);

  svg.node();

  await circle
    .transition()
    .duration(1000)
    .ease(d3.easeBounce)
    .attr("fill", "yellow")
    .attr("cx", radius)
    .end();

  while (true) {
    svg.node();

    await circle
      .transition()
      .duration(2000)
      .attr("fill", `hsl(${Math.random() * 360},100%,50%)`)
      .attr("cx", Math.random() * (width - radius * 2) + radius)
      .end();
  }
})();
