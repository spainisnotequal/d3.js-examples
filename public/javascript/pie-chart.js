import * as d3 from "https://unpkg.com/d3?module";

// get the data
function getDataFromCsv(url) {
  return new Promise((resolve, reject) => {
    d3.csv(url, d3.autoType)
      .then((data) => resolve(data))
      .catch((error) => reject(error));
  });
}

async function init() {
  /* ------------ */
  /* GET THE DATA */
  /* ------------ */

  const dataset = await getDataFromCsv("../data/language-use-in-india.csv");

  dataset.map((d) => {
    d.count = Number(d.count); // convert to number, just in case
    d.enabled = true; // add enabled property to track which entries are checked
  });

  /* ------------------- */
  /* DEFINE SVG ELEMENTS */
  /* ------------------- */

  // chart dimensions
  const width = 1200;
  const height = 800;
  const radius = Math.min(width, height) / 2;

  // legend dimensions
  const legendRectSize = 25; // defines the size of the colored squares in legend
  const legendSpacing = 6; // defines spacing between squares

  // define color scale
  const color = d3.scaleOrdinal(d3.schemeCategory10);

  // append a svg and a g element
  const svg = d3
    .select("#svg-container")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .append("g") // append 'g' element to the svg element
    .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")"); // center the 'g' element to the svg element

  // define the pie arc
  const arc = d3
    .arc()
    .innerRadius(0) // none for pie chart
    .outerRadius(radius); // size of overall chart

  // start and end angles of the segments
  const pie = d3
    .pie()
    .value((d) => d.count) // how to extract the numerical data from each entry in our dataset
    .sort(null); // by default, data sorts in oescending value. this will mess with our animation so we set it to null

  // define tooltip
  const tooltip = d3
    .select("#svg-container") // select element in the DOM with id 'svg-container'
    .append("div") // append a div element to the element we've selected
    .attr("class", "tooltip"); // add class 'tooltip' on the divs we just selected

  tooltip
    .append("div") // add divs to the tooltip defined above
    .attr("class", "label"); // add class 'label' on the selection

  tooltip
    .append("div") // add divs to the tooltip defined above
    .attr("class", "count"); // add class 'count' on the selection

  tooltip
    .append("div") // add divs to the tooltip defined above
    .attr("class", "percent"); // add class 'percent' on the selection

  /* ---------------- */
  /* CREATE THE CHART */
  /* ---------------- */

  const path = svg
    .selectAll("path") // select all path elements inside the svg. specifically the 'g' element. they don't exist yet but they will be created below
    .data(pie(dataset)) //associate dataset wit he path elements we're about to create. must pass through the pie function. it magically knows how to extract values and bakes it into the pie
    .enter() //creates placeholder nodes for each of the values
    .append("path") // replace placeholders with path elements
    .attr("d", arc) // define d attribute with arc function above
    .attr("fill", (d) => {
      return color(d.data.label);
    }) // use color scale to define fill of each label in dataset
    .each(function (d) {
      this._current - d;
    }); // creates a smooth animation for each track

  // mouse event handlers are attached to path so they need to come after its definition
  path.on("mouseover", function (d) {
    // when mouse enters div
    const total = d3.sum(
      dataset.map(function (d) {
        // calculate the total number of tickets in the dataset
        return d.enabled ? d.count : 0; // checking to see if the entry is enabled. if it isn't, we return 0 and cause other percentages to increase
      })
    );
    const percent = Math.round((1000 * d.data.count) / total) / 10; // calculate percent
    tooltip.select(".label").html(d.data.label); // set current label
    tooltip.select(".count").html("$" + d.data.count); // set current count
    tooltip.select(".percent").html(percent + "%"); // set percent calculated above
    tooltip.style("display", "block"); // set display
  });

  path.on("mouseout", () => {
    // when mouse leaves div
    tooltip.style("display", "none"); // hide tooltip for that element
  });

  path.on("mousemove", (d) => {
    // when mouse moves
    tooltip
      .style("top", d3.event.layerY + 10 + "px") // always 10px below the cursor
      .style("left", d3.event.layerX + 10 + "px"); // always 10px to the right of the mouse
  });

  /* ----------------- */
  /* CREATE THE LEGEND */
  /* ----------------- */
  // define legend
  const legend = svg
    .selectAll(".legend") // selecting elements with class 'legend'
    .data(color.domain()) // refers to an array of labels from our dataset
    .enter() // creates placeholder
    .append("g") // replace placeholders with g elements
    .attr("class", "legend") // each g is given a legend class
    .attr("transform", (d, i) => {
      const height = legendRectSize + legendSpacing; // height of element is the height of the colored square plus the spacing
      const offset = (height * color.domain().length) / 2; // vertical offset of the entire legend = height of a single element & half the total number of elements
      const horz = 18 * legendRectSize; // the legend is shifted to the left to make room for the text
      const vert = i * height - offset; // the top of the element is hifted up or down from the center using the offset defiend earlier and the index of the current element 'i'
      return "translate(" + horz + "," + vert + ")"; //return translation
    });

  // adding colored squares to legend
  legend
    .append("rect") // append rectangle squares to legend
    .attr("width", legendRectSize) // width of rect size is defined above
    .attr("height", legendRectSize) // height of rect size is defined above
    .style("fill", color) // each fill is passed a color
    .style("stroke", color) // each stroke is passed a color
    .on("click", (label) => {
      const rect = d3.select(this); // this refers to the colored squared just clicked
      const enabled = true; // set enabled true to default
      const totalEnabled = d3.sum(
        dataset.map((d) => {
          // can't disable all options
          return d.enabled ? 1 : 0; // return 1 for each enabled entry. and summing it up
        })
      );

      if (rect.attr("class") === "disabled") {
        // if class is disabled
        rect.attr("class", ""); // remove class disabled
      } else {
        // else
        if (totalEnabled < 2) return; // if less than two labels are flagged, exit
        rect.attr("class", "disabled"); // otherwise flag the square disabled
        enabled = false; // set enabled to false
      }

      pie.value((d) => {
        if (d.label === label) d.enabled = enabled; // if entry label matches legend label
        return d.enabled ? d.count : 0; // update enabled property and return count or 0 based on the entry's status
      });

      path = path.data(pie(dataset)); // update pie with new data

      path
        .transition() // transition of redrawn pie
        .duration(750) //
        .attrTween("d", function (d) {
          // 'd' specifies the d attribute that we'll be animating
          const interpolate = d3.interpolate(this._current, d); // this = current path element
          this._current = interpolate(0); // interpolate between current value and the new value of 'd'
          return function (t) {
            return arc(interpolate(t));
          };
        });
    });

  // adding text to legend
  legend
    .append("text")
    .attr("x", legendRectSize + legendSpacing)
    .attr("y", legendRectSize - legendSpacing)
    .text(function (d) {
      return d;
    }); // return label
}

init();
