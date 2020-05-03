import * as d3 from "https://unpkg.com/d3?module";

/* ---------------------- */
/* CONFIGURE PLOT OPTIONS */
/* ---------------------- */

// change data each 250 miliseconds
const duration = 250;

// only use the top 12 companies
const n = 12;

// interpolation constant to animate rank changes more quickly, improving readability
const k = 10;

/* ---------------------- */
/* DEFINE PLOT DIMENSIONS */
/* ---------------------- */

const margin = {
  top: 16,
  right: 6,
  bottom: 6,
  left: 0,
};
const barSize = 48;
const height = margin.top + barSize * n + margin.bottom;

/* --------- */
/* READ DATA */
/* --------- */

d3.csv("../data/category-brands.csv", d3.autoType).then((data) => {
  // inspect first 10 records
  data.splice(0, 10).map((d) => {
    console.log("date:", d.date);
    console.log("name:", d.name);
    console.log("category:", d.category);
    console.log("value:", d.value);
    console.log("-----");
  });

  // process the data before using it
  // data.map((d) => {
  //   d.value = Number(d.value);
  //   d.value = isNaN(d.value) ? 0 : d.value;
  //   d.lastValue = Number(d.lastValue);
  //   d.year = Number(d.year);
  //   d.colour = d3.hsl(Math.random() * 360, 0.75, 0.75);
  // });

  // /* ----- */
  // /* COLOR */
  // /* ----- */

  // const color = () => {
  //   const scale = d3.scaleOrdinal(d3.schemeTableau10);
  //   if (data.some((d) => d.category !== undefined)) {
  //     const categoryByName = new Map(data.map((d) => [d.name, d.category]));
  //     scale.domain(Array.from(categoryByName.values()));
  //     return (d) => scale(categoryByName.get(d.name));
  //   }
  //   return (d) => scale(d.name);
  // };

  // /* -------- */
  // /* POSITION */
  // /* -------- */

  // const x = d3.scaleLinear([0, 1], [margin.left, width - margin.right]);
  // const y = d3
  //   .scaleBand()
  //   .domain(d3.range(n + 1))
  //   .rangeRound([margin.top, margin.top + barSize * (n + 1 + 0.1)])
  //   .padding(0.1);
});
