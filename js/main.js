import { fetchManga, fetchGenres, EXCLUDED_GENRES } from "./api.js";
import { getTitle, setStatus } from "./utils.js";
import {
  addToShelf,
  removeFromShelf,
  findShelf,
  SHELF_NAMES,
} from "./storage.js";

// --- Page elements ----
const form = document.querySelector("#search-form");
const input = document.querySelector("#search-input");
const resultsEl = document.querySelector("#results");
const suggestionsEl = document.querySelector("#suggestions");
const genreSelect = document.querySelector("#genre-filter");
const countrySelect = document.querySelector("#country-filter");
const statusSelect = document.querySelector("#status-filter");
const resetButton = document.querySelector("#reset-filters");
const shelfStatusEl = document.querySelector("#shelf-status");
const filterToggle = document.querySelector("#filter-toggle");
const filtersPanel = document.querySelector("#filters");
const loadedSeries = new Map();
let debounceTimer;

// --- Creates card for the result ----
function createCard(series) {
  // creates list
  const li = document.createElement("li");
  li.className = "card";
  li.dataset.id = series.id;

  // variable assigned to series title
  const name = getTitle(series);

  // creates heading for title
  const title = document.createElement("h3");
  title.className = "card-title";

  // creates the cover page
  const coverImg = document.createElement("img");
  coverImg.className = "card-cover";
  coverImg.src = series.coverImage.large;
  coverImg.alt = `Cover page of ${name}`;

  // creates the scoring text
  const score = document.createElement("p");
  score.className = "card-score";
  score.textContent =
    series.averageScore > 0 ? `Score: ${series.averageScore}` : "No score yet";

  // creates the manga status text
  const status = document.createElement("p");
  status.className = "card-status";
  status.textContent = series.status;

  // creates the link to detail.html
  const a = document.createElement("a");
  a.href = `detail.html?id=${series.id}`;
  a.textContent = name;
  // appends the link to the heading/title
  title.append(a);

  // appends new created element to list
  li.append(title, coverImg, score, status, createShelfControl(series));
  return li;
}

// --- Turn the array into cards and put them in the results list ----
function renderCards(mediaList) {
  mediaList.forEach((series) => loadedSeries.set(series.id, series));
  const cards = mediaList.map((series) => createCard(series));
  resultsEl.replaceChildren(...cards);
}

// --- getter function for filters ---
function getFilters() {
  return {
    search: input.value.trim() || undefined,
    country: countrySelect.value || undefined,
    status: statusSelect.value || undefined,
    genre: genreSelect.value || undefined,
  };
}

function createShelfControl(series) {
  const label = document.createElement("label");
  label.className = "visually-hidden";
  label.htmlFor = `shelf-${series.id}`;
  label.textContent = `Shelf for ${getTitle(series)}`;

  const select = document.createElement("select");
  select.className = "shelf-select";
  select.id = `shelf-${series.id}`;

  // First option means "not on any shelf"
  const none = document.createElement("option");
  none.value = "";
  none.textContent = "Not saved";

  // One option per shelf
  const options = SHELF_NAMES.map((name) => {
    const option = document.createElement("option");
    option.value = name;
    option.textContent = name;
    return option;
  });

  select.append(none, ...options);

  // show where this series is currently saved ("" if nowhere)
  select.value = findShelf(series.id) ?? "";

  const wrapper = document.createElement("div");
  wrapper.className = "shelf-control";
  wrapper.append(label, select);
  return wrapper;
}

// --- Loads the output to user ---
async function loadManga(search) {
  setStatus("Loading...");
  resultsEl.replaceChildren();
  try {
    const result = await fetchManga(getFilters());

    // empty check for results
    if (result.media.length === 0) {
      setStatus(
        "No results found. Try changing the search or removing a filter.",
      );
      return;
    }
    renderCards(result.media);
    // shows number of result output to user
    setStatus(`Showing ${result.media.length} results`);
  } catch (error) {
    // outputs error message
    setStatus(`Something went wrong: ${error.message}`);
  }
}
// --- Loads title suggestions to user ---
async function loadSuggestions(text) {
  // if text is shorter than 2 characters -> clear the suggestions and return
  if (text.length < 2) {
    suggestionsEl.replaceChildren();
    return;
  }
  try {
    const result = await fetchManga({ search: text, perPage: 5 });
    // if input.value.trim() no longer equals text -> return (stale answer)
    if (input.value.trim() !== text) {
      return;
    }
    //fill the suggestions (see below)
    const options = result.media.map((series) => {
      const option = document.createElement("option");
      option.value = getTitle(series);
      return option;
    });

    suggestionsEl.replaceChildren(...options);
  } catch (error) {
    suggestionsEl.replaceChildren();
  }
}

// --- Renders genre option to page ---
function renderGenreOptions(genres) {
  const options = genres.map((name) => {
    const option = document.createElement("option");
    option.value = name;
    option.textContent = name;
    return option;
  });

  genreSelect.append(...options);
}

// --- Loads the genre option (with sfw filter) ---
async function loadGenres() {
  try {
    const genres = await fetchGenres();
    const visible = genres.filter((name) => !EXCLUDED_GENRES.includes(name));
    renderGenreOptions(visible);
  } catch (error) {
    // fail quietly. page works without any genres, so the select stays on "Any"
  }
}

// --- Filter reset button listener ---
resetButton.addEventListener("click", () => {
  countrySelect.value = "";
  statusSelect.value = "";
  genreSelect.value = "";
  clearTimeout(debounceTimer);
  suggestionsEl.replaceChildren();
  loadManga();
});

// --- Filter toggle listener ---
filterToggle.addEventListener("click", () => {
  filtersPanel.hidden = !filtersPanel.hidden;
  filterToggle.setAttribute("aria-expanded", String(!filtersPanel.hidden));
});

// --- Filter change listener ---
form.addEventListener("change", (event) => {
  if (event.target.matches("select")) {
    loadManga();
  }
});

// --- Saves or removes a series when a card's shelf
// dropdown changes ---
resultsEl.addEventListener("change", (event) => {
  const select = event.target;
  if (!select.matches(".shelf-select")) return;

  const card = select.closest(".card");
  const series = loadedSeries.get(Number(card.dataset.id));
  if (!series) return;

  const name = getTitle(series);

  // "" means "Not saved", so remove. Otherwise save to the chosen shelf.
  const saved =
    select.value === ""
      ? removeFromShelf(series.id)
      : addToShelf(select.value, series);

  if (!saved) {
    // put the dropdown back to what is actually stored
    select.value = findShelf(series.id) ?? "";
    shelfStatusEl.textContent = `Couldn't save "${name}". Storage may be full or blocked.`;
    return;
  }

  shelfStatusEl.textContent =
    select.value === ""
      ? `Removed "${name}" from your shelves.`
      : `Saved "${name}" to ${select.value}.`;
});

// --- Input listener ---
input.addEventListener("input", () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => loadSuggestions(input.value.trim()), 300);
});

// --- Submit listener on the form ----
form.addEventListener("submit", (event) => {
  event.preventDefault(); // Stops the page from reloading
  clearTimeout(debounceTimer);
  suggestionsEl.replaceChildren();
  loadManga(input.value.trim()); // reads in the input value
});

// --- Calls loadManga() once on page load so the page isn't empty ---
await Promise.all([loadManga(), loadGenres()]);
