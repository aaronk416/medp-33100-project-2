const apiKey = "802ee322c8121a46593708eaee31a51d";
let selectedGenre = "35"; // Default to Comedy
let sortOption = "budgetAsc"; // Default sorting option

const width = 1200;
const height = 800;
const margin = { top: 20, right: 30, bottom: 40, left: 40 };

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

// Hover functions
const mouseover = function (event, d) {
  tooltip.style("opacity", 1);
};

const mousemove = function (event, d) {
  tooltip
    .html(
      `Title: ${
        d.title
      }<br>Budget: $${d.budget.toLocaleString()}<br>Revenue: $${d.revenue.toLocaleString()}`
    )
    .style("left", event.pageX + 10 + "px")
    .style("top", event.pageY - 10 + "px");
};

const mouseleave = function () {
  tooltip.transition().duration(200).style("opacity", 0);
};

// Function to filter by genre
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

// Sorting function
function sortData(data, sortOption) {
  switch (sortOption) {
    case "budgetAsc":
      return data.sort((a, b) => a.budget - b.budget);
    case "budgetDesc":
      return data.sort((a, b) => b.budget - a.budget);
    case "revenueAsc":
      return data.sort((a, b) => a.revenue - b.revenue);
    case "revenueDesc":
      return data.sort((a, b) => b.revenue - a.revenue);
    default:
      return data;
  }
}

async function fetchMovies() {
  const startYear = 1960;
  const endYear = 2020;
  const totalPages = 5;
  const allMovies = [];

  for (let page = 1; page <= totalPages; page++) {
    const url = `https://api.themoviedb.org/3/discover/movie?api_key=${apiKey}&language=en-US&primary_release_date.gte=${startYear}-01-01&primary_release_date.lte=${endYear}-12-31&with_genres=${selectedGenre}&page=${page}`;

    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
      const data = await response.json();

      // Fetch details for each movie to get both budget and revenue
      for (let movie of data.results) {
        const movieDetailsUrl = `https://api.themoviedb.org/3/movie/${movie.id}?api_key=${apiKey}&language=en-US`;
        const movieDetailsResponse = await fetch(movieDetailsUrl);
        if (!movieDetailsResponse.ok)
          throw new Error(`API Error: ${movieDetailsResponse.statusText}`);
        const movieDetails = await movieDetailsResponse.json();

        allMovies.push({
          title: movie.title,
          budget: movieDetails.budget, // Fetching budget
          revenue: movieDetails.revenue, // Fetching revenue
        });
      }
    } catch (error) {
      console.error("Fetch error:", error);
      return [];
    }
  }

  console.log(allMovies); // Log the fetched movies data
  return allMovies;
}

async function updateChart() {
  const movies = await fetchMovies();

  // Filter out movies with missing budget or revenue values
  const chartData = movies.filter(
    (movie) => movie.budget > 0 && movie.revenue > 0
  );

  console.log("Filtered Data:", chartData); // Log filtered data to check

  // Sort the data based on selected sorting option
  const sortedData = sortData(chartData, sortOption);

  console.log("Sorted Data:", sortedData); // Log the sorted data to check

  // Update scales based on sorted data
  xScale.domain([0, d3.max(sortedData, (d) => d.budget)]);
  yScale.domain([0, d3.max(sortedData, (d) => d.revenue)]);

  xAxis.call(d3.axisBottom(xScale).ticks(5).tickFormat(d3.format("$,.0f")));
  yAxis.call(d3.axisLeft(yScale).ticks(5).tickFormat(d3.format("$,.0f")));

  // Create or update the scatterplot dots
  const dots = svg.selectAll("circle").data(sortedData, (d) => d.title);

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

// Update chart when sorting option changes
document.getElementById("sortBy").addEventListener("change", (event) => {
  sortOption = event.target.value;
  updateChart();
});

updateChart();
