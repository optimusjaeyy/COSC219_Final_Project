import { fetchMangaById } from "./api.js";
import { getTitle, setStatus } from "./utils.js";
import {
  addToShelf,
  removeFromShelf,
  findShelf,
  SHELF_NAMES,
} from "./storage.js";

// ----  Page elements ----
const detailEl = document.querySelector("#detail");
const titleEl = document.querySelector("#detail-title");
const coverEl = document.querySelector("#detail-cover");
const scoreEl = document.querySelector("#detail-score");
const languageEl = document.querySelector("#detail-language");
const seriesStatusEl = document.querySelector("#detail-status");
const chaptersEl = document.querySelector("#detail-chapters");
const genresEl = document.querySelector("#detail-genres");
const descriptionEl = document.querySelector("#detail-description");
const authorEl = document.querySelector("#detail-author");
// Shelf elements
const shelfSection = document.querySelector("#shelf-section");
const shelfSelect = document.querySelector("#shelf-select");
const shelfStatusEl = document.querySelector("#shelf-status");
let currentSeries = null; // will set once the series has loaded

// ---- Read the id from the URL ----
const params = new URLSearchParams(location.search);
const id = Number(params.get("id"));

// ---- Lookup for the original language ----
const LANGUAGES = {
  JP: "Japanese",
  KR: "Korean",
  CN: "Chinese",
};

// ---- Fill the page with one series ----
function renderDetail(series) {
  const name = getTitle(series);

  document.title = `${name} | Manga Shelf`;
  titleEl.textContent = name;

  coverEl.src = series.coverImage.large;
  coverEl.alt = `Cover page of ${name}`;

  scoreEl.textContent =
    series.averageScore > 0
      ? `${series.averageScore} / 100`
      : "No score available";

  languageEl.textContent = LANGUAGES[series.countryOfOrigin] ?? "Unknown";

  // ?. and ?? [] stops it from crashing when a series has no staff
  const credits = series.staff?.edges ?? [];
  authorEl.textContent = credits.length
    ? credits.map((c) => `${c.node.name.full} (${c.role})`).join(", ")
    : "Not listed";

  seriesStatusEl.textContent = series.status;

  if (series.chapters != null) {
    chaptersEl.textContent = series.chapters;
  } else if (series.status === "RELEASING") {
    chaptersEl.textContent = "Ongoing";
  } else {
    chaptersEl.textContent = "Not listed";
  }

  genresEl.textContent = series.genres.length
    ? series.genres.join(", ")
    : "None listed";

  descriptionEl.textContent = series.description || "No description available.";
}

// ---- Load and show the right state ----
async function loadDetail() {
  if (!(Number.isInteger(id) && id > 0)) {
    setStatus("No series selected.");
    return;
  }
  setStatus("Loading...");

  try {
    const series = await fetchMangaById(id);
    renderDetail(series);
    currentSeries = series;
    renderShelfControl(series);
    detailEl.hidden = false; // show the article
    setStatus(""); // clear "Loading..."
  } catch (error) {
    // error state
    setStatus(`Something went wrong: ${error.message}`);
  }
}
function renderShelfControl(series) {
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

  shelfSelect.append(none, ...options);
  shelfSelect.value = findShelf(series.id) ?? "";
  shelfSection.hidden = false;
}

shelfSelect.addEventListener("change", () => {
  if (currentSeries === null) return;

  const chosen = shelfSelect.value;

  // "" means "Not saved", so remove. Otherwise save to the chosen shelf.
  const saved =
    chosen === ""
      ? removeFromShelf(currentSeries.id)
      : addToShelf(chosen, currentSeries);

  if (!saved) {
    // put the dropdown back to what is actually stored
    shelfSelect.value = findShelf(currentSeries.id) ?? "";
    shelfStatusEl.textContent =
      "Couldn't save. Storage may be full or blocked.";
    return;
  }

  shelfStatusEl.textContent =
    chosen === "" ? "Removed from your shelves." : `Saved to ${chosen}.`;
});

loadDetail();
