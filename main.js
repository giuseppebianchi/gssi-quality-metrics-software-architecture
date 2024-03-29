import "./style.css";
import * as d3 from "d3";

const nodesTooltipContentLabels = ["evidence"];
const linksTooltipContentLabels = ["evidence"];
const groups = [
  { value: 1, label: "Metric" },
  { value: 2, label: "QualityAttributes" },
  { value: 3, label: "QualityCharacteristic" },
];

// Legend config
const legendItemSize = 12;
const legendSpacing = 10;
const xOffset = 20; //150;
const yOffset = 20; // 100;

const width = window.innerWidth,
  height = window.innerHeight,
  MIN_SCALE = 0.3,
  MAX_SCALE = 3;

const renderTooltipContent = (d, labels) => {
  return labels.map((t) => d[t] && `<span>${t}:</span> ${d[t]} <br>`).join("");
};

// create a tooltip
const Tooltip = d3
  .select("#container")
  .append("div")
  .attr("class", "tooltip")
  .style("opacity", 0)
  .style("background-color", "white")
  .style("border", "solid")
  .style("border-width", "2px")
  .style("border-radius", "5px")
  .style("padding", "5px");

// Three function that change the tooltip when user hover / move / leave a cell
const mouseover = function (d) {
  Tooltip.style("opacity", 1);
};
const mousemove = function (d) {
  if (d.fx || d.fy) return;
  Tooltip.html(renderTooltipContent(d, nodesTooltipContentLabels))
    .style("left", d3.event.pageX + 20 + "px")
    .style("top", d3.event.pageY + 10 + "px");
};
const linksMousemove = function (d) {
  Tooltip.html(renderTooltipContent(d, linksTooltipContentLabels))
    .style("left", d3.event.pageX + 20 + "px")
    .style("top", d3.event.pageY + 10 + "px");
};
const mouseleave = function (d) {
  Tooltip.style("opacity", 0);
};

const zoom = d3
  .zoom()
  .on("zoom", function (e) {
    svg.attr("transform", d3.event.transform);
  })
  .scaleExtent([MIN_SCALE, MAX_SCALE]);

const svg = d3
  .select("#container")
  .append("svg")
  .attr("width", "100%")
  .attr("height", "100%")
  .call(zoom)
  .append("g");

const color = d3.scaleOrdinal(d3.schemeCategory20);

const simulation = d3
  .forceSimulation()
  .velocityDecay(0.8)
  .alphaTarget(0.3)
  .force("collide", d3.forceCollide().radius(20))
  .force(
    "link",
    d3
      .forceLink()
      .distance(75)
      .id(function (d) {
        return d.id;
      })
  )
  .force("charge", d3.forceManyBody().strength(-500).distanceMin(30))
  .force("center", d3.forceCenter(width / 2, height / 2))
  .force("y", d3.forceY(0))
  .force("x", d3.forceX(0));

d3.json(`data.json`, function (error, graph) {
  if (error) throw error;

  const link = svg
    .append("g")
    .attr("class", "links")
    .selectAll("line")
    .data(graph.links)
    .enter()
    .append("line")
    .attr("stroke-width", function (d) {
      if (d.importance != null) {
        return d.importance / 50 + 1.5;
      } else {
        return 1.5;
      }
    })
    .on("mouseover", mouseover)
    .on("mousemove", linksMousemove)
    .on("mouseleave", mouseleave);

  const node = svg
    .append("g")
    .attr("class", "nodes")
    .selectAll("g")
    .data(graph.nodes)
    .enter()
    .append("g");

  const circles = node
    .append("circle")
    .attr("r", 5)
    .attr("fill", function (d) {
      return color(d.group);
    })
    .attr("r", function (d) {
      if (d.importance != null) {
        return (d.importance / 100) * 10;
      } else {
        return 10;
      }
    })
    .attr("class", "circle")
    .style("fill", "69b3a2")
    .attr("stroke", "#69b3a2")
    .attr("stroke-width", 3)
    //.attr("fill-opacity", .4)
    .on("mouseover", mouseover)
    .on("mousemove", mousemove)
    .on("mouseleave", mouseleave);

  // Create a drag handler and append it to the node object instead
  const drag_handler = d3
    .drag()
    .on("start", dragstarted)
    .on("drag", dragged)
    .on("end", dragended);

  drag_handler(node);

  const labels = node
    .append("text")
    .text(function (d) {
      return d.id;
    })
    .attr("x", 15)
    .attr("y", 3);

  // node.append("title")
  //     .text(function(d) { return d.id; });

  simulation.nodes(graph.nodes).on("tick", ticked);

  simulation.force("link").links(graph.links);

  function ticked() {
    link
      .attr("x1", function (d) {
        return d.source.x;
      })
      .attr("y1", function (d) {
        return d.source.y;
      })
      .attr("x2", function (d) {
        return d.target.x;
      })
      .attr("y2", function (d) {
        return d.target.y;
      });

    node.attr("transform", function (d) {
      return "translate(" + d.x + "," + d.y + ")";
    });
  }

  //Initialize legend
  const legend = d3
    .select("#legend")
    .append("svg")
    .style(
      "height",
      yOffset * 2 +
        groups.length * (legendItemSize + legendSpacing) -
        legendSpacing
    )
    .selectAll(".legendItem")
    .data(groups);

  //Create legend items
  legend
    .enter()
    .append("rect")
    .attr("class", "legendItem")
    .attr("width", legendItemSize)
    .attr("height", legendItemSize)
    .style("fill", (d) => color(d.value))
    .attr("transform", (d, i) => {
      var x = xOffset;
      var y = yOffset + (legendItemSize + legendSpacing) * i;
      return `translate(${x}, ${y})`;
    });

  //Create legend labels
  legend
    .enter()
    .append("text")
    .attr("x", xOffset + legendItemSize + 5)
    .attr("y", (d, i) => yOffset + (legendItemSize + legendSpacing) * i + 11)
    .text((d) => d.label)
    .style("font-size", 14);
});

function dragstarted(d) {
  Tooltip.style("opacity", 0);
  d.fx = d.x;
  d.fy = d.y;
}

function dragged(d) {
  Tooltip.style("opacity", 0);
  d.fx = d3.event.x;
  d.fy = d3.event.y;
}

function dragended(d) {
  if (!d3.event.active) simulation.restart();
  d.fx = null;
  d.fy = null;
}

d3.selection.prototype.moveToFront = function () {
  return this.each(function () {
    this.parentNode.appendChild(this);
  });
};
