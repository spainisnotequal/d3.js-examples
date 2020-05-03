import * as d3 from "https://unpkg.com/d3?module";

// get the data
d3.csv("../data/brand-values-only-10.csv", d3.autoType).then((data) => {
  // make test with the first 10 elements
  data.map((d) => {
    console.log("name:", d.name);
    console.log("value:", d.value);
    console.log("year:", d.year);
    console.log("lastValue:", d.lastValue);
    console.log("rank:", d.rank);
    console.log("-----");
  });
});
