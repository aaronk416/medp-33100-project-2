const apiKey = '802ee322c8121a46593708eaee31a51d';

let selectedGenres = ['35'];

const toggleButton = document.getElementById('toggle-page');

toggleButton.addEventListener('click', () => {
    if (window.location.href.includes('index.html')) {
        window.location.href = 'data.html';
    } else {
        window.location.href = 'index.html';
    }
});

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
        fetchAndDisplayMovies();
    });
});

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
          <img src="${imgSrc}" alt="${movie.title}" class="movie-poster">
          <div class="movie-title">${movie.title}</div>
          <div class="movie-year">${movie.release_date.split('-')[0]}</div>
      `;

      movieCard.addEventListener('click', () => {
          const wikiUrl = `https://en.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(movie.title)}`;
          window.open(wikiUrl, '_blank');
      });

      container.appendChild(movieCard);
  });
}

document.getElementById('applyFilters').addEventListener('click', async () => {
    const loadingIndicator = document.getElementById('loading');
    if (loadingIndicator) {
        loadingIndicator.style.display = 'block';
    }
    const movies = await fetchMovies();
    if (loadingIndicator) {
        loadingIndicator.style.display = 'none';
    }
    displayMovies(movies);
    updateChart(movies);
});

function filterMoviesByGenre(genre) {
    const allMovies = getAllMovies();
    const filteredMovies = allMovies.filter(movie => movie.genre.includes(genre));
    displayMovies(filteredMovies);
}

document.addEventListener('DOMContentLoaded', async () => {
  selectedGenres = ['35'];

  const movies = await fetchMovies();
  displayMovies(movies);
});

document.querySelectorAll('.genre-filter-button').forEach(button => {
    button.addEventListener('click', () => {
        document.querySelectorAll('.genre-filter-button').forEach(btn => btn.classList.remove('active-filter'));
        button.classList.add('active-filter');
        const selectedGenre = button.getAttribute('data-genre');
        filterMoviesByGenre(selectedGenre);
    });
});
