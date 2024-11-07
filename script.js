const apiKey = '802ee322c8121a46593708eaee31a51d';

let selectedGenres = ['35']; // Comedy genre ID

// Handle genre button clicks
document.querySelectorAll('.genre-btn').forEach(button => {
    button.addEventListener('click', (event) => {
        const genreId = event.target.getAttribute('data-genre');
        if (selectedGenres.includes(genreId)) {
            selectedGenres = selectedGenres.filter(id => id !== genreId);
            event.target.classList.remove('selected');
        } else {
            selectedGenres.push(genreId);
            event.target.classList.add('selected');
        }
        fetchAndDisplayMovies();  // Update the movie display and chart when a genre is selected
    });
});

// Fetch movies from TMDb API
async function fetchMovies() {
    let url = `https://api.themoviedb.org/3/discover/movie?api_key=${apiKey}&language=en-US&sort_by=${document.getElementById('sortSelect').value}&page=1`;

    if (selectedGenres.length > 0) {
        url += `&with_genres=${selectedGenres.join(',')}`;
    }

    const language = document.getElementById('languageSelect').value;
    if (language) {
        url += `&with_original_language=${language}`;
    }

    const releaseYearStart = document.getElementById('releaseYearStart').value;
    const releaseYearEnd = document.getElementById('releaseYearEnd').value;
    if (releaseYearStart) {
        url += `&primary_release_date.gte=${releaseYearStart}-01-01`;
    }
    if (releaseYearEnd) {
        url += `&primary_release_date.lte=${releaseYearEnd}-12-31`;
    }

    const runtimeStart = document.getElementById('runtimeStart').value;
    const runtimeEnd = document.getElementById('runtimeEnd').value;
    if (runtimeStart) {
        url += `&with_runtime.gte=${runtimeStart}`;
    }
    if (runtimeEnd) {
        url += `&with_runtime.lte=${runtimeEnd}`;
    }

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Failed to fetch movies');
        }
        const data = await response.json();
        return data.results;
    } catch (error) {
        console.error(error);
        return [];
    }
}

// Display movies in grid
function displayMovies(movies) {
    const container = document.getElementById('movieContainer');
    container.innerHTML = '';

    if (movies.length === 0) {
        container.innerHTML = '<p class="error">No movies found with the selected filters.</p>';
        return;
    }

    movies.forEach(movie => {
        const movieCard = document.createElement('div');
        movieCard.classList.add('movie-card');

        const imgSrc = movie.poster_path
            ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
            : 'https://via.placeholder.com/500x750?text=No+Image';

        movieCard.innerHTML = `
            <img src="${imgSrc}" alt="${movie.title}">
            <div class="movie-title">${movie.title}</div>
            <div class="movie-year">${movie.release_date.split('-')[0]}</div>
        `;
        container.appendChild(movieCard);
    });
}

// Handle apply filters button click
document.getElementById('applyFilters').addEventListener('click', async () => {
    const loadingIndicator = document.getElementById('loading');
    if (loadingIndicator) {
        loadingIndicator.style.display = 'block'; // Show loading indicator
    }
    const movies = await fetchMovies();
    if (loadingIndicator) {
        loadingIndicator.style.display = 'none'; // Hide loading indicator after fetching
    }
    displayMovies(movies);
    updateChart(movies); // Update the chart with filtered movies
});


// Chart section logic
async function updateChart(movies = []) {
    if (movies.length === 0) {
        movies = await fetchMovies();  // Fetch data if no movies are passed
    }

    // Filter for comedy movies (genre ID 35)
    const comedyMovies = movies.filter(movie => movie.genre_ids.includes(35));

    // Group movies by release year
    const moviesByYear = {};
    comedyMovies.forEach((movie) => {
        const year = movie.release_date.split('-')[0]; // Extract the release year
        if (!moviesByYear[year]) {
            moviesByYear[year] = 0;
        }
        moviesByYear[year]++;
    });

    const chartData = Object.keys(moviesByYear).map((year) => ({
        year: year,
        count: moviesByYear[year],
    }));

    // Create xScale and yScale
    const xScale = d3.scaleBand().range([0, 600]).padding(0.1);
    const yScale = d3.scaleLinear().range([400, 0]);

    const svg = d3.select('#ratingsChart').attr('width', 800).attr('height', 450); // Increased height for titles

    xScale.domain(chartData.map(d => d.year));
    yScale.domain([0, d3.max(chartData, d => d.count)]);

    svg.selectAll('*').remove(); // Clear previous chart

    // Add Chart Title
    svg.append('text')
        .attr('x', 200)
        .attr('y', 60)
        .attr('text-anchor', 'middle')
        .style('font-size', '16px')
        .style('font-weight', 'bold')
        .text('Number of Comedy Movies Released');

    // Add X-axis title
    svg.append('text')
        .attr('x', 400)
        .attr('y', 440)
        .attr('text-anchor', 'middle')
        .style('font-size', '12px')
        .text('Year');

    // Add Y-axis title
    svg.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('x', -200)
        .attr('y', 20)
        .attr('text-anchor', 'middle')
        .style('font-size', '12px')
        .text('Number of Movies');

    // Add X-axis
    svg.append('g')
        .attr('transform', 'translate(0, 400)')
        .call(d3.axisBottom(xScale));

    // Add Y-axis with custom tick formatting (multiples of 5)
    svg.append('g')
        .call(d3.axisLeft(yScale).ticks(d3.max(chartData, d => d.count) / 5));

    // Plot bars (representing number of movies per year)
    const bars = svg.selectAll('rect').data(chartData);

    bars.enter()
        .append('rect')
        .attr('x', d => xScale(d.year))
        .attr('y', d => yScale(d.count))
        .attr('width', xScale.bandwidth())
        .attr('height', d => 400 - yScale(d.count))
        .attr('fill', 'blue')
        .merge(bars)
        .transition()
        .duration(500)
        .attr('x', d => xScale(d.year))
        .attr('y', d => yScale(d.count))
        .attr('width', xScale.bandwidth())
        .attr('height', d => 400 - yScale(d.count));

    bars.exit().remove();
}
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
