const apiKey = '802ee322c8121a46593708eaee31a51d'; //  API key

async function fetchMovies(category) {
    const url = `https://api.themoviedb.org/3/movie/${category}?api_key=${apiKey}&language=en-US&page=1`;

    try {
        const response = await fetch(url);
        if (response.ok) {
            const data = await response.json();
            displayMovies(data.results);
        } else {
            console.error('Error fetching data:', response.statusText);
        }
    } catch (error) {
        console.error('Fetch error:', error);
    }
}

function displayMovies(movies) {
    const movieContainer = document.getElementById('movieContainer');
    movieContainer.innerHTML = ''; // Clear previous results

    movies.forEach(movie => {
        const movieCard = document.createElement('div');
        movieCard.classList.add('movie-card');
        
        const movieImage = document.createElement('img');
        movieImage.src = `https://image.tmdb.org/t/p/w500${movie.poster_path}`; //  poster
        movieImage.alt = movie.title;

        const movieTitle = document.createElement('div');
        movieTitle.classList.add('movie-title');
        movieTitle.textContent = movie.title;

        movieCard.appendChild(movieImage);
        movieCard.appendChild(movieTitle);
        movieContainer.appendChild(movieCard);
    });
}

// Event listener for the fetch button
document.getElementById('fetchButton').addEventListener('click', () => {
    const category = document.getElementById('categorySelect').value;
    fetchMovies(category);
});
