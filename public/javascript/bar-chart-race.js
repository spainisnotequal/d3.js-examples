import * as d3 from "https://unpkg.com/d3?module";

// start animation in 2000
const year = 2000;
// only use the top 12 companies
const top_n = 12;

// set plot dimensions and margins
const height = 600;
const width = 960;
const margin = {
  top: 80,
  right: 5,
  bottom: 5,
  left: 5,
};

// add a svg HTML element to the "chart-div" HTML element
const svg = d3
  .select("body")
  .append("svg")
  .attr("width", width)
  .attr("height", height);

// add the title, subtitle and data source
const title = svg
  .append("text")
  .attr("class", "title")
  .attr("y", 24)
  .html("18 years of Interbrand’s Top Global Brands");

const subTitle = svg
  .append("text")
  .attr("class", "subTitle")
  .attr("y", 55)
  .html("Brand value, $m");

const caption = svg
  .append("text")
  .attr("class", "caption")
  .attr("x", width)
  .attr("y", height - 5)
  .style("text-anchor", "end")
  .html("Source: Interbrand");

// get the data
d3.csv("../data/brand-values.csv", d3.autoType).then((data) => {
  // process the data before using it
  data.map((d) => {
    d.value = Number(d.value);
    d.value = isNaN(d.value) ? 0 : d.value;
    d.lastValue = Number(d.lastValue);
    d.year = Number(d.year);
    d.colour = d3.hsl(Math.random() * 360, 0.75, 0.75);
  });

  // data.map((d) => {
  //   console.log("name:", d.name);
  //   console.log("value:", d.value);
  //   console.log("year:", d.year);
  //   console.log("lastValue:", d.lastValue);
  //   console.log("rank:", d.rank);
  //   console.log("-----");
  // });

  // get some data from the start year "year" to configure some plot options
  const yearSlice = data
    .filter((d) => d.year == year && !isNaN(d.value))
    .sort((a, b) => b.value - a.value)
    .slice(0, top_n);
  yearSlice.map((d, index) => (d.rank = index));

  // set x and y axes
  const x = d3
    .scaleLinear()
    .domain([0, d3.max(yearSlice, (d) => d.value)])
    .range([margin.left, width - margin.right - 65]);

  const y = d3
    .scaleLinear()
    .domain([top_n, 0])
    .range([height - margin.bottom, margin.top]);

  const xAxis = d3
    .axisTop()
    .scale(x)
    .ticks(width > 500 ? 5 : 2)
    .tickSize(-(height - margin.top - margin.bottom))
    .tickFormat((d) => d3.format(",")(d));

  // add the x-axis to the svg element
  svg
    .append("g")
    .attr("class", "axis xAxis")
    .attr("transform", `translate(0, ${margin.top})`)
    .call(xAxis)
    .selectAll(".tick line")
    .classed("origin", (d) => d == 0);

  // add the (static) bars from the starting year "year" to the svg element
  const barPadding = (height - (margin.bottom + margin.top)) / (top_n * 5);
  svg
    .selectAll("rect.bar")
    .data(yearSlice, (d) => d.name)
    .enter()
    .append("rect")
    .attr("class", "bar")
    .attr("x", x(0) + 1)
    .attr("width", (d) => x(d.value) - x(0) - 1)
    .attr("y", (d) => y(d.rank) + 5)
    .attr("height", y(1) - y(0) - barPadding)
    .style("fill", (d) => d.colour);

  // add the companies names as labels inside the bars
  svg
    .selectAll("text.label")
    .data(yearSlice, (d) => d.name)
    .enter()
    .append("text")
    .attr("class", "label")
    .attr("x", (d) => x(d.value) - 8)
    .attr("y", (d) => y(d.rank) + 5 + (y(1) - y(0)) / 2 + 1)
    .style("text-anchor", "end")
    .html((d) => d.name);
});
