import * as d3 from "https://unpkg.com/d3?module";

// change data each 500 miliseconds
const tickDuration = 500;

// start animation year
let year = 2015;
// stop animation year
const stopYear = 2018;

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
  .html(`${stopYear - year} years of Interbrand’s Top Global Brands`);

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
  let yearSlice = data
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

  // add the companies values as labels to the right of the bars
  svg
    .selectAll("text.valueLabel")
    .data(yearSlice, (d) => d.name)
    .enter()
    .append("text")
    .attr("class", "valueLabel")
    .attr("x", (d) => x(d.value) + 5)
    .attr("y", (d) => y(d.rank) + 5 + (y(1) - y(0)) / 2 + 1)
    .text((d) => d3.format(",.0f")(d.lastValue));

  // add the current year to the svg element
  const halo = function (text, strokeWidth) {
    text
      .select(function () {
        return this.parentNode.insertBefore(this.cloneNode(true), this);
      })
      .style("fill", "#ffffff")
      .style("stroke", "#ffffff")
      .style("stroke-width", strokeWidth)
      .style("stroke-linejoin", "round")
      .style("opacity", 1);
  };

  let yearText = svg
    .append("text")
    .attr("class", "yearText")
    .attr("x", width - margin.right)
    .attr("y", height - 25)
    .style("text-anchor", "end")
    .html(~~year)
    .call(halo, 10);

  // Animate the bars
  let ticker = d3.interval(() => {
    yearSlice = data
      .filter((d) => d.year == year && !isNaN(d.value))
      .sort((a, b) => b.value - a.value)
      .slice(0, top_n);

    yearSlice.forEach((d, i) => (d.rank = i));

    //console.log('IntervalYear: ', yearSlice);

    x.domain([0, d3.max(yearSlice, (d) => d.value)]);

    svg
      .select(".xAxis")
      .transition()
      .duration(tickDuration)
      .ease(d3.easeLinear)
      .call(xAxis);

    let bars = svg.selectAll(".bar").data(yearSlice, (d) => d.name);

    bars
      .enter()
      .append("rect")
      .attr("class", (d) => `bar ${d.name.replace(/\s/g, "_")}`)
      .attr("x", x(0) + 1)
      .attr("width", (d) => x(d.value) - x(0) - 1)
      .attr("y", () => y(top_n + 1) + 5)
      .attr("height", y(1) - y(0) - barPadding)
      .style("fill", (d) => d.colour)
      .transition()
      .duration(tickDuration)
      .ease(d3.easeLinear)
      .attr("y", (d) => y(d.rank) + 5);

    bars
      .transition()
      .duration(tickDuration)
      .ease(d3.easeLinear)
      .attr("width", (d) => x(d.value) - x(0) - 1)
      .attr("y", (d) => y(d.rank) + 5);

    bars
      .exit()
      .transition()
      .duration(tickDuration)
      .ease(d3.easeLinear)
      .attr("width", (d) => x(d.value) - x(0) - 1)
      .attr("y", () => y(top_n + 1) + 5)
      .remove();

    let labels = svg.selectAll(".label").data(yearSlice, (d) => d.name);

    labels
      .enter()
      .append("text")
      .attr("class", "label")
      .attr("x", (d) => x(d.value) - 8)
      .attr("y", () => y(top_n + 1) + 5 + (y(1) - y(0)) / 2)
      .style("text-anchor", "end")
      .html((d) => d.name)
      .transition()
      .duration(tickDuration)
      .ease(d3.easeLinear)
      .attr("y", (d) => y(d.rank) + 5 + (y(1) - y(0)) / 2 + 1);

    labels
      .transition()
      .duration(tickDuration)
      .ease(d3.easeLinear)
      .attr("x", (d) => x(d.value) - 8)
      .attr("y", (d) => y(d.rank) + 5 + (y(1) - y(0)) / 2 + 1);

    labels
      .exit()
      .transition()
      .duration(tickDuration)
      .ease(d3.easeLinear)
      .attr("x", (d) => x(d.value) - 8)
      .attr("y", () => y(top_n + 1) + 5)
      .remove();

    let valueLabels = svg
      .selectAll(".valueLabel")
      .data(yearSlice, (d) => d.name);

    valueLabels
      .enter()
      .append("text")
      .attr("class", "valueLabel")
      .attr("x", (d) => x(d.value) + 5)
      .attr("y", () => y(top_n + 1) + 5)
      .text((d) => d3.format(",.0f")(d.lastValue))
      .transition()
      .duration(tickDuration)
      .ease(d3.easeLinear)
      .attr("y", (d) => y(d.rank) + 5 + (y(1) - y(0)) / 2 + 1);

    valueLabels
      .transition()
      .duration(tickDuration)
      .ease(d3.easeLinear)
      .attr("x", (d) => x(d.value) + 5)
      .attr("y", (d) => y(d.rank) + 5 + (y(1) - y(0)) / 2 + 1)
      .tween("text", function (d) {
        let i = d3.interpolateRound(d.lastValue, d.value);
        return function (t) {
          this.textContent = d3.format(",")(i(t));
        };
      });

    valueLabels
      .exit()
      .transition()
      .duration(tickDuration)
      .ease(d3.easeLinear)
      .attr("x", (d) => x(d.value) + 5)
      .attr("y", () => y(top_n + 1) + 5)
      .remove();

    yearText.html(~~year);

    if (year == stopYear) ticker.stop();
    year = d3.format(".1f")(+year + 0.1);
  }, tickDuration);
});
