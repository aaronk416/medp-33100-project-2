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

    // Default to comedy genre (genre ID 35)
    const comedyMovies = movies.filter(movie => movie.genre_ids.includes(35));

    const decadeMovies = {};
    comedyMovies.forEach((movie) => {
        const decade = Math.floor(Number(movie.release_date.split('-')[0]) / 10) * 10; // Group by decade
        if (!decadeMovies[decade]) {
            decadeMovies[decade] = [];
        }
        decadeMovies[decade].push(movie);
    });

    const chartData = [];
    Object.keys(decadeMovies).forEach((decade) => {
        decadeMovies[decade].forEach((movie) => {
            chartData.push({
                decade: decade,
                year: movie.release_date.split('-')[0],
                rating: movie.vote_average,
            });
        });
    });

    const xScale = d3.scaleBand().range([0, 600]).padding(0.1);
    const yScale = d3.scaleLinear().range([400, 0]);

    const svg = d3.select('#ratingsChart').attr('width', 800).attr('height', 400);

    xScale.domain(chartData.map(d => d.decade));
    yScale.domain([0, 10]);

    svg.selectAll('*').remove(); // Clear previous chart

    // Add axes
    svg.append('g')
        .attr('transform', 'translate(0, 400)')
        .call(d3.axisBottom(xScale));

    svg.append('g').call(d3.axisLeft(yScale));

    // Plot data as circles
    const dots = svg.selectAll('circle').data(chartData);

    dots.enter()
        .append('circle')
        .attr('cx', d => xScale(d.decade) + 30)
        .attr('cy', d => yScale(d.rating))
        .attr('r', 5)
        .attr('fill', 'blue')
        .merge(dots)
        .transition()
        .duration(500)
        .attr('cx', d => xScale(d.decade) + 30)
        .attr('cy', d => yScale(d.rating));

    dots.exit().remove();
}

// Initial movie load (with comedy genre as default)
async function initialLoad() {
    const movies = await fetchMovies();
    displayMovies(movies);
    updateChart(movies);  // Default to comedy genre on first load
}

initialLoad();  // Run the initial load to display default data

// Default data for chart (e.g., comedy genre movies)
const defaultChartData = [
    { decade: 2000, rating: 6.8 },
    { decade: 2010, rating: 7.2 },
    { decade: 2020, rating: 7.5 }
];

// Set up the chart initially with default data
function setupChart(data) {
    const svg = d3.select('#ratingsChart')
        .attr('width', 800)
        .attr('height', 400);

    const xScale = d3.scaleBand().range([0, 600]).padding(0.1);
    const yScale = d3.scaleLinear().range([400, 0]);

    // Set domain for x and y scales
    xScale.domain(data.map(d => d.decade));
    yScale.domain([0, 10]);

    // Clear previous chart content
    svg.selectAll('*').remove();

    // Add axes
    svg.append('g')
        .attr('transform', 'translate(0, 400)')
        .call(d3.axisBottom(xScale));

    svg.append('g').call(d3.axisLeft(yScale));

    // Plot data as circles
    const dots = svg.selectAll('circle').data(data);

    dots.enter()
        .append('circle')
        .attr('cx', d => xScale(d.decade) + 30)
        .attr('cy', d => yScale(d.rating))
        .attr('r', 5)
        .attr('fill', 'blue')
        .merge(dots)
        .transition()
        .duration(500)
        .attr('cx', d => xScale(d.decade) + 30)
        .attr('cy', d => yScale(d.rating));

    dots.exit().remove();
}

// Button click handler to apply filters to the chart
document.getElementById('applyChartFilters').addEventListener('click', () => {
    // Get the filter values (for example, user might want to filter by decade or rating)
    const selectedDecade = document.getElementById('decadeSelect').value;
    const selectedRating = document.getElementById('ratingSelect').value;

    // Example: Update the chart data based on selected filters
    let filteredData = defaultChartData.filter(d => {
        const decadeMatch = selectedDecade ? d.decade === parseInt(selectedDecade) : true;
        const ratingMatch = selectedRating ? d.rating >= parseFloat(selectedRating) : true;
        return decadeMatch && ratingMatch;
    });

    // Update the chart with filtered data
    setupChart(filteredData);
});

// Initial chart load with default data
setupChart(defaultChartData);

