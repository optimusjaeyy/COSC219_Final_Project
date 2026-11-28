import { fetchMangaById } from "./api.js";
import { getTitle, setStatus } from "./utils.js";
import {
  addToShelf,
  removeFromShelf,
  findShelf,
  SHELF_NAMES,
  loadReview,
  saveReview,
  deleteReview,
} from "./storage.js";

// ---- Page elements ----
const detailEl = document.querySelector("#detail");
const titleEl = document.querySelector("#detail-title");
const coverEl = document.querySelector("#detail-cover");
const scoreEl = document.querySelector("#detail-score");
const languageEl = document.querySelector("#detail-language");
const authorEl = document.querySelector("#detail-author");
const seriesStatusEl = document.querySelector("#detail-status");
const chaptersEl = document.querySelector("#detail-chapters");
const genresEl = document.querySelector("#detail-genres");
const descriptionEl = document.querySelector("#detail-description");

// ---- Shelf elements ----
const shelfSection = document.querySelector("#shelf-section");
const shelfSelect = document.querySelector("#shelf-select");
const shelfStatusEl = document.querySelector("#shelf-status");

// ---- Review elements ----
const reviewSection = document.querySelector("#review-section");
const reviewForm = document.querySelector("#review-form");
const commentEl = document.querySelector("#review-comment");
const deleteButton = document.querySelector("#delete-review");
const reviewStatusEl = document.querySelector("#review-status");
const reviewDisplay = document.querySelector("#review-display");
const reviewDisplayRating = document.querySelector("#review-display-rating");
const reviewDisplayComment = document.querySelector("#review-display-comment");

let currentSeries = null; // set once the series has loaded

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

  // ?. and ?? [] stop it crashing when a series has no staff listed
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

// ---- Builds the shelf dropdown and shows it ----
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

  shelfSelect.replaceChildren(none, ...options);
  shelfSelect.value = findShelf(series.id) ?? "";
  shelfSection.hidden = false;
}

// ---- Fills the review form from storage (blank on a first visit) ----
function renderReviewForm(series) {
  const review = loadReview(series.id);

  if (review) {
    reviewForm.elements.rating.value = String(review.rating);
    commentEl.value = review.comment;
  }

  showSavedReview(review);
  reviewSection.hidden = false;
}

// --- Shows the saved review as text, or hides
// the box if there isn't one ---
function showSavedReview(review) {
  if (!review) {
    reviewDisplay.hidden = true;
    return;
  }
  reviewDisplayRating.textContent = `Your rating: ${review.rating} / 5`;
  reviewDisplayComment.textContent = review.comment || "No comment.";
  reviewDisplay.hidden = false;
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
    renderReviewForm(series);
    detailEl.hidden = false; // show the article
    setStatus(""); // clear "Loading..."
  } catch (error) {
    setStatus(`Something went wrong: ${error.message}`);
  }
}

// ---- Saves or removes the series when the shelf dropdown changes ----
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

// ---- Saves the rating and comment ----
reviewForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (currentSeries === null) return;

  const rating = Number(reviewForm.elements.rating.value);
  if (rating < 1) {
    reviewStatusEl.textContent = "Please choose a rating.";
    return;
  }

  const review = { rating, comment: commentEl.value.trim() };
  const saved = saveReview(currentSeries.id, review);

  if (!saved) {
    reviewStatusEl.textContent =
      "Couldn't save. Storage may be full or blocked.";
    return;
  }

  showSavedReview(review);
  reviewStatusEl.textContent = "Review saved.";
});

// ---- Deletes the saved rating and comment ----
deleteButton.addEventListener("click", () => {
  if (currentSeries === null) return;

  const deleted = deleteReview(currentSeries.id);

  if (!deleted) {
    reviewStatusEl.textContent =
      "Couldn't delete. Storage may be full or blocked.";
    return;
  }

  reviewForm.reset();
  showSavedReview(null);
  reviewStatusEl.textContent = "Review deleted.";
});

loadDetail();
