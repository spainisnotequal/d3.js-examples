import * as d3 from "https://unpkg.com/d3?module";
import { rollup } from "https://unpkg.com/d3-array?module";

const svg = d3
  .select("#chart-div")
  .append("svg")
  .attr("width", 960)
  .attr("height", 600);

const tickDuration = 500;

const top_n = 12;
const height = 600;
const width = 960;

const margin = {
  top: 80,
  right: 0,
  bottom: 5,
  left: 0,
};

const barPadding = (height - (margin.bottom + margin.top)) / (top_n * 5);

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

const year = 2000;

// get the data
d3.csv("./data/category-brands.csv", d3.autoType).then((data) => {
  console.log("data:", data);

  const names = new Set(data.map((d) => d.name));
  console.log("names:", names);

  const datevalues = Array.from(
    rollup(
      data,
      ([d]) => d.value,
      (d) => Date.parse(d.date), // coerce dates to integer
      (d) => d.name
    )
  )
    .map(([date, data]) => [new Date(date), data]) // convert date back to a Date object
    .sort(([a], [b]) => d3.ascending(a, b));

  console.log("datevalues:", datevalues);

  const numberOfBrands = 12;

  function rank(value) {
    const data = Array.from(names, (name) => ({ name, value: value(name) }));
    data.sort((a, b) => d3.descending(a.value, b.value));
    for (let i = 0; i < data.length; ++i)
      data[i].rank = Math.min(numberOfBrands, i);
    return data;
  }
  console.log(
    "ranked brandas of the first dataset:",
    rank((name) => datevalues[0][1].get(name))
  );
});
