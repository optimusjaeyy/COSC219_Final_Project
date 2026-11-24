import { fetchMangaById } from "./api.js";
import { getTitle, setStatus } from "./utils.js";

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
    series.average > 0 ? `${series.averageScore} / 100` : "No score available";

  languageEl.textContent = LANGUAGES[series.countryOfOrigin] ?? "Unknown";

  seriesStatusEl.textContent = series.status;

  chaptersEl.textContent = series.chapters ?? "Unknown";

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
    detailEl.hidden = false; // show the article
    setStatus(""); // clear "Loading..."
  } catch (error) {
    // error state
    setStatus(`Something went wrong: ${error.message}`);
  }
}

loadDetail();
