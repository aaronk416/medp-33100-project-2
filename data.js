const apiKey = "802ee322c8121a46593708eaee31a51d";
let selectedGenre = "35";

const toggleButton = document.getElementById('toggle-page');

toggleButton.addEventListener('click', () => {
    if (window.location.href.includes('index.html')) {
        window.location.href = 'data.html';
    } else {
        window.location.href = 'index.html';
    }
});

const width = 800;
const height = 600;
const margin = { top: 20, right: 30, bottom: 40, left: 100 };

const svg = d3
  .select("#chart")
  .append("svg")
  .attr("width", width)
  .attr("height", height);

const xScale = d3.scaleLinear().range([margin.left, width - margin.right]);
const yScale = d3.scaleLinear().range([height - margin.bottom, margin.top]);

const xAxis = svg
  .append("g")
  .attr("transform", `translate(0, ${height - margin.bottom})`);
const yAxis = svg.append("g").attr("transform", `translate(${margin.left}, 0)`);

// Tooltip setup
const tooltip = d3
  .select("#chart")
  .append("div")
  .style("opacity", 0)
  .attr("class", "tooltip")
  .style("background-color", "white")
  .style("border", "solid")
  .style("border-width", "1px")
  .style("border-radius", "5px")
  .style("padding", "10px");

const mouseover = function (event, d) {
  tooltip.style("opacity", 1);
};

const mousemove = function (event, d) {
  tooltip
    .html(
      `Title: ${d.title}<br>Budget: $${d.budget.toLocaleString()}<br>Revenue: $${d.revenue.toLocaleString()}`
    )
    .style("left", event.pageX + 10 + "px")
    .style("top", event.pageY - 10 + "px");
};

const mouseleave = function () {
  tooltip.transition().duration(200).style("opacity", 0);
};

document.querySelectorAll(".genre-btn").forEach((button) => {
  button.addEventListener("click", (event) => {
    selectedGenre = event.target.getAttribute("data-genre");
    document
      .querySelectorAll(".genre-btn")
      .forEach((btn) => btn.classList.remove("selected"));
    event.target.classList.add("selected");
    updateChart();
  });
});

async function fetchMovies() {
  const startYear = 1960;
  const endYear = 2024;
  const totalPages = 5;
  const allMovies = [];

  for (let page = 1; page <= totalPages; page++) {
    const url = `https://api.themoviedb.org/3/discover/movie?api_key=${apiKey}&language=en-US&primary_release_date.gte=${startYear}-01-01&primary_release_date.lte=${endYear}-12-31&with_genres=${selectedGenre}&page=${page}`;

    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
      const data = await response.json();

      for (let movie of data.results) {
        const movieDetailsUrl = `https://api.themoviedb.org/3/movie/${movie.id}?api_key=${apiKey}&language=en-US`;
        const movieDetailsResponse = await fetch(movieDetailsUrl);
        if (!movieDetailsResponse.ok)
          throw new Error(`API Error: ${movieDetailsResponse.statusText}`);
        const movieDetails = await movieDetailsResponse.json();

        allMovies.push({
          title: movie.title,
          budget: movieDetails.budget,
          revenue: movieDetails.revenue,
        });
      }
    } catch (error) {
      console.error("Fetch error:", error);
      return [];
    }
  }

  console.log(allMovies);
  return allMovies;
}

async function updateChart() {
  const movies = await fetchMovies();

  const chartData = movies.filter(
    (movie) => movie.budget > 0 && movie.revenue > 0
  );

  console.log(chartData);

  xScale.domain([0, d3.max(chartData, (d) => d.budget)]);
  yScale.domain([0, d3.max(chartData, (d) => d.revenue)]);

  xAxis.call(d3.axisBottom(xScale).ticks(5).tickFormat(d3.format("$,.0f")));
  yAxis.call(d3.axisLeft(yScale).ticks(5).tickFormat(d3.format("$,.0f")));

  const dots = svg.selectAll("circle").data(chartData, (d) => d.title);

  dots
    .enter()
    .append("circle")
    .attr("cx", (d) => xScale(d.budget))
    .attr("cy", (d) => yScale(d.revenue))
    .attr("r", 5)
    .attr("fill", "black")
    .on("mouseover", mouseover)
    .on("mousemove", mousemove)
    .on("mouseleave", mouseleave)
    .merge(dots)
    .transition()
    .duration(500)
    .attr("cx", (d) => xScale(d.budget))
    .attr("cy", (d) => yScale(d.revenue));

  dots.exit().remove();
}

updateChart();
