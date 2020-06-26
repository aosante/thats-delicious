import axios from 'axios';
import dompurify from 'dompurify';

const searchResultsHTML = (stores) => {
  return stores
    .map((store) => {
      return `
         <a href="/store/${store.slug}" class="search__result">
            <strong>${store.name}</strong>
         </a>
        `;
    })
    .join('');
};

const typeAhead = (search) => {
  if (!search) return;

  const searchInput = search.querySelector('input[name="search"]');
  const searchResults = search.querySelector('.search__results');

  searchInput.on('input', function () {
    if (!this.value) {
      // hide search results and return
      searchResults.style.display = 'none';
      return;
    }

    // show search results
    searchResults.style.display = 'block';

    axios
      .get(`/api/search?q=${this.value}`)
      .then((res) => {
        if (res.data.length) {
          searchResults.innerHTML = dompurify.sanitize(
            searchResultsHTML(res.data)
          );
          return;
        }
        // no results
        searchResults.innerHTML = dompurify.sanitize(
          `<div class="search__result">No results for ${this.value} :(</div>`
        );
      })
      .catch((error) => {
        console.error(error);
      });
  });

  // handle keyboard input
  searchInput.on('keyup', (e) => {
    // if they are not pressing up, down, or enter, thenw e skip it
    if (![38, 40, 13].includes(e.keyCode)) return;

    const activeClass = 'search__result--active';
    const current = search.querySelector(`.${activeClass}`);
    const items = search.querySelectorAll('.search__result');
    let next;
    // if the user presses down and there is an option currently selected, then the next one should be selected
    // if there is no next one, it will select the first item for the array of results
    if (e.keyCode === 40 && current) {
      next = current.nextElementSibling || items[0];
    } else if (e.keyCode === 40) {
      next = items[0];
    } else if (e.keyCode === 38 && current) {
      next = current.previousElementSibling || items[items.length - 1];
    } else if (e.keyCode === 38) {
      next = items[items.length - 1];
    } else if (e.keyCode === 13 && current.href) {
      // got to that stored if selected
      window.location = current.href;
      return;
    }
    if (current) current.classList.remove(activeClass);
    next.classList.add(activeClass);
  });
};

export default typeAhead;
