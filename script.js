const apiKey = "802ee322c8121a46593708eaee31a51d";

let selectedGenres = ["35"]; // Default: Comedy genre ID

// Handle genre button clicks
document.querySelectorAll(".genre-btn").forEach((button) => {
  button.addEventListener("click", (event) => {
    const genreId = event.target.getAttribute("data-genre");
    if (selectedGenres.includes(genreId)) {
      selectedGenres = selectedGenres.filter((id) => id !== genreId);
      event.target.classList.remove("selected");
    } else {
      selectedGenres.push(genreId);
      event.target.classList.add("selected");
    }
    fetchAndDisplayMovies(); // Update the movie display and chart when a genre is selected
  });
});

// Fetch movies from TMDb API
async function fetchMovies() {
  let url = `https://api.themoviedb.org/3/discover/movie?api_key=${apiKey}&language=en-US&sort_by=${
    document.getElementById("sortSelect").value
  }&page=1`;

  if (selectedGenres.length > 0) {
    url += `&with_genres=${selectedGenres.join(",")}`;
  }

  const language = document.getElementById("languageSelect").value;
  if (language) {
    url += `&with_original_language=${language}`;
  }

  const releaseYearStart = document.getElementById("releaseYearStart").value;
  const releaseYearEnd = document.getElementById("releaseYearEnd").value;
  if (releaseYearStart) {
    url += `&primary_release_date.gte=${releaseYearStart}-01-01`;
  }
  if (releaseYearEnd) {
    url += `&primary_release_date.lte=${releaseYearEnd}-12-31`;
  }

  const runtimeStart = document.getElementById("runtimeStart").value;
  const runtimeEnd = document.getElementById("runtimeEnd").value;
  if (runtimeStart) {
    url += `&with_runtime.gte=${runtimeStart}`;
  }
  if (runtimeEnd) {
    url += `&with_runtime.lte=${runtimeEnd}`;
  }

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error("Failed to fetch movies");
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
  const container = document.getElementById("movieContainer");
  container.innerHTML = "";

  if (movies.length === 0) {
    container.innerHTML =
      '<p class="error">No movies found with the selected filters.</p>';
    return;
  }

  movies.forEach((movie) => {
    const movieCard = document.createElement("div");
    movieCard.classList.add("movie-card");

    const imgSrc = movie.poster_path
      ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
      : "https://via.placeholder.com/500x750?text=No+Image";

    movieCard.innerHTML = `
            <img src="${imgSrc}" alt="${movie.title}" class="movie-poster">
            <div class="movie-title">${movie.title}</div>
            <div class="movie-year">${movie.release_date.split("-")[0]}</div>
        `;

    // Add click event listener to open Wikipedia search
    movieCard.addEventListener("click", () => {
      const wikiUrl = `https://en.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(
        movie.title
      )}`;
      window.open(wikiUrl, "_blank");
    });

    container.appendChild(movieCard);
  });
}

// Handle apply filters button click
document.getElementById("applyFilters").addEventListener("click", async () => {
  const loadingIndicator = document.getElementById("loading");
  if (loadingIndicator) {
    loadingIndicator.style.display = "block";
  }
  const movies = await fetchMovies();
  if (loadingIndicator) {
    loadingIndicator.style.display = "none";
  }
  displayMovies(movies);
  updateChart(movies);
});

// Function to toggle between movie grid and scatterplot view
const toggleButton = document.getElementById("toggleView");
const movieContainer = document.getElementById("movieContainer");
const scatterplotContainer = document.createElement("div");
scatterplotContainer.id = "scatterplot";
document.body.appendChild(scatterplotContainer); // Append scatterplot to the body

toggleButton.addEventListener("click", () => {
  if (movieContainer.style.display === "none") {
    movieContainer.style.display = "grid";
    scatterplotContainer.style.display = "none";
    toggleButton.textContent = "Show Scatterplot";
  } else {
    movieContainer.style.display = "none";
    scatterplotContainer.style.display = "block";
    toggleButton.textContent = "Show Movie Posters";
    createScatterplot(); // Call function to create scatterplot
  }
});

// Function to create scatterplot with D3.js
function createScatterplot() {
  // Clear previous scatterplot content if exists
  d3.select("#scatterplot").selectAll("*").remove();

  // Set dimensions
  const width = 800;
  const height = 500;
  const margin = { top: 20, right: 20, bottom: 30, left: 40 };

  // Create SVG for scatterplot
  const svg = d3
    .select("#scatterplot")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // Fetch and filter movies
  fetchMovies().then((movies) => {
    if (!movies || movies.length === 0) return;

    // Set scales
    const x = d3
      .scaleLinear()
      .domain(d3.extent(movies, (d) => d.popularity))
      .range([0, width]);
    const y = d3
      .scaleLinear()
      .domain(d3.extent(movies, (d) => d.vote_average))
      .range([height, 0]);

    // Add X axis
    svg
      .append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x).ticks(10));

    // Add Y axis
    svg.append("g").call(d3.axisLeft(y).ticks(10));

    // Add scatterplot points
    svg
      .selectAll("dot")
      .data(movies)
      .enter()
      .append("circle")
      .attr("cx", (d) => x(d.popularity))
      .attr("cy", (d) => y(d.vote_average))
      .attr("r", 5)
      .style("fill", "#69b3a2")
      .on("mouseover", (event, d) => {
        // Show movie title on hover
        d3.select("#scatterplot")
          .append("div")
          .attr("class", "tooltip")
          .style("left", `${event.pageX + 5}px`)
          .style("top", `${event.pageY - 28}px`)
          .text(d.title);
      })
      .on("mouseout", () => {
        d3.select(".tooltip").remove();
      });

    // Scatterplot labels
    svg
      .append("text")
      .attr("x", width / 2)
      .attr("y", height + margin.bottom - 5)
      .style("text-anchor", "middle")
      .text("Popularity");

    svg
      .append("text")
      .attr("x", -height / 2)
      .attr("y", -margin.left + 10)
      .attr("transform", "rotate(-90)")
      .style("text-anchor", "middle")
      .text("Rating");
  });
}
