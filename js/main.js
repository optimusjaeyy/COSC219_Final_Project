import { fetchManga } from "./api.js";
// --- Page elements ----
const form = document.querySelector("#search-form");
const input = document.querySelector("#search-input");
const statusEl = document.querySelector("#status");
const resultsEl = document.querySelector("#results");
const suggestionsEl = document.querySelector("#suggestions");

let debounceTimer;

// --- Puts a message in the status element ----
function setStatus(message) {
  statusEl.textContent = message;
}

// --- Creates card for the result ----
function createCard(series) {
  // creates list
  const li = document.createElement("li");
  li.className = "card";
  li.dataset.id = series.id;

  // variable assigned to series title
  const name = getTitle(series);

  // creates heading for title
  const title = document.createElement("h2");
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
  li.append(title, coverImg, score, status);
  return li;
}

// --- Turn the array into cards and put them in the results list ----
function renderCards(mediaList) {
  const cards = mediaList.map((series) => createCard(series));
  resultsEl.replaceChildren(...cards);
}

// --- Loads the output to user---
async function loadManga(search) {
  setStatus("Loading...");
  resultsEl.replaceChildren();
  try {
    const result = await fetchManga({ search: search || undefined });

    // empty check for results
    if (result.media.length === 0) {
      setStatus("No results found. Try a different search.");
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
// --- loads title suggestions to user ---
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
// --- Getter function for title ---
function getTitle(series) {
  return series.title.english || series.title.romaji;
}

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
loadManga();
