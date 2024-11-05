const apiKey = '802ee322c8121a46593708eaee31a51d';
let selectedGenres = [];

// Event listener for genre buttons
document.querySelectorAll('.genre-btn').forEach(button => {
    button.addEventListener('click', (event) => {
        const genreId = event.target.getAttribute('data-genre');
        
        // Toggle genre selection
        if (selectedGenres.includes(genreId)) {
            selectedGenres = selectedGenres.filter(id => id !== genreId);
            event.target.classList.remove('selected');
        } else {
            selectedGenres.push(genreId);
            event.target.classList.add('selected');
        }
        console.log('Selected Genres:', selectedGenres); // Log selected genres
    });
});

// Function to fetch movies with selected filters
async function fetchMovies() {
    let url = `https://api.themoviedb.org/3/discover/movie?api_key=${apiKey}&language=en-US&sort_by=${document.getElementById('sortSelect').value}&page=1`;

    if (selectedGenres.length > 0) {
        console.log('Selected Genres for API:', selectedGenres); // Log selected genres
        url += `&with_genres=${selectedGenres.join(',')}`;
    } else {
        console.log('No genres selected');
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

    console.log('Fetching URL:', url); // Log the final URL
    try {
        const response = await fetch(url);
        if (response.ok) {
            const data = await response.json();
            displayMovies(data.results);
        } else {
            console.error('API Error:', response.statusText);
            displayError('Unable to fetch movies. Please try again later.');
        }
    } catch (error) {
        console.error('Fetch error:', error);
        displayError('Unable to fetch movies. Please check your network connection.');
    }
}

// Function to display movies
function displayMovies(movies) {
    const movieContainer = document.getElementById('movieContainer');
    movieContainer.innerHTML = ''; // Clear previous results

    if (movies.length === 0) {
        movieContainer.innerHTML = '<p>No movies found.</p>';
        return;
    }

    movies.forEach(movie => {
        const movieCard = document.createElement('div');
        movieCard.classList.add('movie-card');
        
        const movieImage = document.createElement('img');
        movieImage.src = movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : 'placeholder.jpg';
        movieImage.alt = movie.title;

        const movieTitle = document.createElement('div');
        movieTitle.classList.add('movie-title');
        movieTitle.textContent = movie.title;

        const movieYear = document.createElement('div');
        movieYear.classList.add('movie-year');
        movieYear.textContent = `Year: ${new Date(movie.release_date).getFullYear()}`;

        movieCard.appendChild(movieImage);
        movieCard.appendChild(movieTitle);
        movieCard.appendChild(movieYear);
        movieContainer.appendChild(movieCard);
    });
}

// Function to display error messages
function displayError(message) {
    const movieContainer = document.getElementById('movieContainer');
    movieContainer.innerHTML = `<p class="error">${message}</p>`;
}

// Event listener for the apply filters button
document.getElementById('applyFilters').addEventListener('click', fetchMovies);
