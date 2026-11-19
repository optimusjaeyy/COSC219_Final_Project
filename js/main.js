import { fetchManga } from "./api.js";
console.log("running");
// --- 1. Page elements ----
const form = document.querySelector("#search-form");
const input = document.querySelector("#search-input");
const statusEl = document.querySelector("#status");
const resultsEl = document.querySelector("#results");

// --- 2. Puts a message in the status element ----
function setStatus(message) {
  statusEl.textContent = message;
}

// --- 3. Creates card for the result ----
function createCard(series) {
  const li = document.createElement("li");
  li.className = "grid";
  li.dataset.id = series.id;

  const title = document.createElement("h2");
  title.className = "grid";
  title.textContent = series.title.english || series.title.romaji;

  const coverImg = document.createElement("img");
  coverImg.className = "grid";
  coverImg.src = series.coverImage.large;
  coverImg.alt = `Cover page of ${title.textContent}`;

  const score = document.createElement("p");
  score.className = "grid";
  score.textContent =
    series.averageScore > 0 ? `Score: ${series.averageScore}` : "No score yet";

  const status = document.createElement("p");
  status.className = "grid";
  status.textContent = series.status;

  // appends new created element to list
  li.append(title, coverImg, score, status);
  return li;
}
// --- 4. Turn the array into cards and put them in the results list ----
function renderCards(mediaList) {
  const cards = mediaList.map((series) => createCard(series));
  resultsEl.replaceChildren(...cards);
}

// --- 5. Loads the output to user---
async function loadManga(search) {
  setStatus("Loading...");
  resultsEl.replaceChildren();
  try {
    const result = await fetchManga({ search: search || undefined });

    // empty check for results
    if (result.media.length === 0) {
      setStatus("No results ...");
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

// --- 6. Submit listener on the form ----
form.addEventListener("submit", (event) => {
  event.preventDefault(); // Stops the page from reloading
  loadManga(input.value.trim()); // reads in the input value
});

// --- 7. Calls loadManga() once on page load so the page isn't empty ---
// To Be Decided
loadManga();
