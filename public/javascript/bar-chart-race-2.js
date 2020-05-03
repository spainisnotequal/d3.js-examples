import * as d3 from "https://unpkg.com/d3?module";
import * as d3Array from "https://unpkg.com/d3-array?module";

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
  // get the brand names
  const names = new Set(data.map((d) => d.name));

  // group brands (with their value) by date
  // (i.e.: make an array of {date, {{name, value}, {name, value}, ...}} objects)
  const datevalues = Array.from(
    d3Array.rollup(
      data,
      ([d]) => d.value,
      (d) => Number(d.date), // convert the date to a number
      (d) => d.name
    )
  )
    .map(([date, data]) => [new Date(date), data]) // convert the number back to a date
    .sort(([a], [b]) => d3.ascending(a, b));

  // helper function that computes the zero-based rank for each brand
  function rank(value) {
    const data = Array.from(names, (name) => ({ name, value: value(name) }));
    data.sort((a, b) => d3.descending(a.value, b.value));
    for (let i = 0; i < data.length; ++i) data[i].rank = Math.min(n, i);
    return data;
  }

  // interpolate values linearly to animate rank changes more quickly
  const keyframes = [];
  let ka, a, kb, b;
  for ([[ka, a], [kb, b]] of d3.pairs(datevalues)) {
    for (let i = 0; i < k; ++i) {
      const t = i / k;
      keyframes.push([
        new Date(ka * (1 - t) + kb * t),
        rank((name) => (a.get(name) || 0) * (1 - t) + (b.get(name) || 0) * t),
      ]);
    }
  }
  keyframes.push([new Date(kb), rank((name) => b.get(name) || 0)]);

  // deal with brands that enter and exit the top "n" companies
  const nameframes = d3Array.groups(
    keyframes.flatMap(([, data]) => data),
    (d) => d.name
  );
  // previous rank position
  const prev = new Map(
    nameframes.flatMap(([, data]) => d3.pairs(data, (a, b) => [b, a]))
  );
  // next rank position
  const next = new Map(nameframes.flatMap(([, data]) => d3.pairs(data)));

  /* -------------------------------------- */
  /* DEFINE SOME FUNCTIONS TO DRAW ELEMENTS */
  /* -------------------------------------- */

  // Previous note: the next four chart components, starting with the bars here, are implemented as functions that are passed a selection of the chart’s root SVG element

  // bars function: initializes the component, such as by adding a G element, and returns an update function which will be called repeatedly to implement transitions
  function bars(svg) {
    let bar = svg.append("g").attr("fill-opacity", 0.6).selectAll("rect");

    return ([date, data], transition) =>
      (bar = bar
        .data(data.slice(0, n), (d) => d.name)
        .join(
          (enter) =>
            enter
              .append("rect")
              .attr("fill", color)
              .attr("height", y.bandwidth())
              .attr("x", x(0))
              .attr("y", (d) => y((prev.get(d) || d).rank))
              .attr("width", (d) => x((prev.get(d) || d).value) - x(0)),
          (update) => update,
          (exit) =>
            exit
              .transition(transition)
              .remove()
              .attr("y", (d) => y((next.get(d) || d).rank))
              .attr("width", (d) => x((next.get(d) || d).value) - x(0))
        )
        .call((bar) =>
          bar
            .transition(transition)
            .attr("y", (d) => y(d.rank))
            .attr("width", (d) => x(d.value) - x(0))
        ));
  }

  // labels function: initializes the component, such as by adding a G element, and returns an update function which will be called repeatedly to draw labels
  function labels(svg) {
    let label = svg
      .append("g")
      .style("font", "bold 12px var(--sans-serif)")
      .style("font-variant-numeric", "tabular-nums")
      .attr("text-anchor", "end")
      .selectAll("text");

    return ([date, data], transition) =>
      (label = label
        .data(data.slice(0, n), (d) => d.name)
        .join(
          (enter) =>
            enter
              .append("text")
              .attr(
                "transform",
                (d) =>
                  `translate(${x((prev.get(d) || d).value)},${y(
                    (prev.get(d) || d).rank
                  )})`
              )
              .attr("y", y.bandwidth() / 2)
              .attr("x", -6)
              .attr("dy", "-0.25em")
              .text((d) => d.name)
              .call((text) =>
                text
                  .append("tspan")
                  .attr("fill-opacity", 0.7)
                  .attr("font-weight", "normal")
                  .attr("x", -6)
                  .attr("dy", "1.15em")
              ),
          (update) => update,
          (exit) =>
            exit
              .transition(transition)
              .remove()
              .attr(
                "transform",
                (d) =>
                  `translate(${x((next.get(d) || d).value)},${y(
                    (next.get(d) || d).rank
                  )})`
              )
              .call((g) =>
                g
                  .select("tspan")
                  .tween("text", (d) =>
                    textTween(d.value, (next.get(d) || d).value)
                  )
              )
        )
        .call((bar) =>
          bar
            .transition(transition)
            .attr("transform", (d) => `translate(${x(d.value)},${y(d.rank)})`)
            .call((g) =>
              g
                .select("tspan")
                .tween("text", (d) =>
                  textTween((prev.get(d) || d).value, d.value)
                )
            )
        ));
  }

  // textTween function: D3 doesn’t transition text by default, so we need a function to do it
  function textTween(a, b) {
    const i = d3.interpolateNumber(a, b);
    return function (t) {
      this.textContent = formatNumber(i(t));
    };
  }

  // function to format values as whole numbers
  const formatNumber = d3.format(",d");

  // /* ------------- */
  // /* AXIS FUCNTION */
  // /* ------------- */
  // // Our x-axis is top-anchored and slightly customized.
  // const axis = (svg) => {
  //   const g = svg.append("g").attr("transform", `translate(0,${margin.top})`);

  //   const axis = d3
  //     .axisTop(x)
  //     .ticks(width / 160)
  //     .tickSizeOuter(0)
  //     .tickSizeInner(-barSize * (n + y.padding()));

  //   return (_, transition) => {
  //     g.transition(transition).call(axis);
  //     g.select(".tick:first-of-type text").remove();
  //     g.selectAll(".tick:not(:first-of-type) line").attr("stroke", "white");
  //     g.select(".domain").remove();
  //   };
  // };

  // /* --------------- */
  // /* TICKER FUCNTION */
  // /* --------------- */
  // // The “ticker” in the bottom-right corner shows the current date
  // const ticker = (svg) => {
  //   const now = svg
  //     .append("text")
  //     .style("font", `bold ${barSize}px var(--sans-serif)`)
  //     .style("font-variant-numeric", "tabular-nums")
  //     .attr("text-anchor", "end")
  //     .attr("x", width - 6)
  //     .attr("y", margin.top + barSize * (n - 0.45))
  //     .attr("dy", "0.32em")
  //     .text(formatDate(keyframes[0][0]));

  //   return ([date], transition) => {
  //     transition.end().then(() => now.text(formatDate(date)));
  //   };
  // };

  // /* -------------------- */
  // /* FORMAT DATE FUNCTION */
  // /* -------------------- */
  // const formatDate = d3.utcFormat("%Y");

  // /* -------------- */
  // /* COLOR FUNCTION */
  // /* -------------- */

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

  /* ------------- */
  /* START DRAWING */
  /* ------------- */
});
