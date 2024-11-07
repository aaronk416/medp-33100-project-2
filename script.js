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
