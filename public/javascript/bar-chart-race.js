import * as d3 from "https://unpkg.com/d3?module";
import { rollup } from "https://unpkg.com/d3-array?module";

// get the data
d3.csv("./data/category-brands.csv", d3.autoType).then((data) => {
  // names
  const names = data.map((d) => d.name);
  console.log("names:", names);

  // datevalues
  const datevalues = Array.from(
    rollup(
      data,
      ([d]) => d.value,
      (d) => +d.date,
      (d) => d.name
    )
  )
    .map(([date, data]) => [new Date(date), data])
    .sort(([a], [b]) => d3.ascending(a, b));
  console.log(datevalues);
});
