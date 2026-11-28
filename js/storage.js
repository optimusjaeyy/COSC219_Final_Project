import { getTitle } from "./utils.js";

// The localStorage key everything is saved under
const SHELVES_KEY = "mangaShelves";

// The shelves the site offers. Exported so other files
// use the same list and never retype it
export const SHELF_NAMES = ["Plan to Read", "Reading", "Completed", "Dropped"];

// The key for saving reviews from user
const REVIEWS_KEY = "mangaReviews";

// Returns a new set of shelves with every shelf empty
function emptyShelves() {
  return Object.fromEntries(SHELF_NAMES.map((name) => [name, []]));
}

// An entry is valid only if it is an object with a numeric id
const isEntry = (entry) =>
  entry && typeof entry === "object" && Number.isInteger(entry.id);

// Reads the shelves from localStorage and ALWAYS returns a usable object.
// Bad JSON resets everything, and a bad shelf or bad entry is dropped.
export function loadShelves() {
  try {
    const raw = localStorage.getItem(SHELVES_KEY);
    if (raw === null) return emptyShelves();

    const data = JSON.parse(raw);
    const shelves = emptyShelves();
    SHELF_NAMES.forEach((name) => {
      if (Array.isArray(data?.[name])) {
        shelves[name] = data[name].filter(isEntry);
      }
    });
    return shelves;
  } catch (error) {
    return emptyShelves();
  }
}

// Writes the shelves to localStorage as JSON.
// Returns true it is saved and false if it failed
export function saveShelves(shelves) {
  try {
    localStorage.setItem(SHELVES_KEY, JSON.stringify(shelves));
    return true;
  } catch (error) {
    return false;
  }
}

// Small helper function used in removeFromShelf and addToShelf.
// Removes the series with this id from EVERY shelf. It changes the
// shelves object it is given, so it returns nothing.
function removeEverywhere(shelves, id) {
  SHELF_NAMES.forEach((name) => {
    shelves[name] = shelves[name].filter((entry) => entry.id !== id);
  });
}

// Save a series onto one shelf. It is removed from any other shelf
// so a series is only ever on one shelf. Returns false for an unknown
// shelf name, otherwise whether it saved.
export function addToShelf(shelfName, series) {
  const shelves = loadShelves();
  if (!SHELF_NAMES.includes(shelfName)) return false;

  removeEverywhere(shelves, series.id);
  shelves[shelfName].push({
    id: series.id,
    title: getTitle(series),
    cover: series.coverImage.large,
  });

  return saveShelves(shelves);
}

// Remove a series from whichever shelf it is on, then saves.
export function removeFromShelf(id) {
  const shelves = loadShelves();
  removeEverywhere(shelves, id);
  return saveShelves(shelves);
}

// Checks whether a series is already saved. Returns the
// shelf name, e.g. "Reading", or null if it is not saved.
export function findShelf(id) {
  const shelves = loadShelves();

  return (
    SHELF_NAMES.find((name) =>
      shelves[name].some((entry) => entry.id === id),
    ) ?? null
  );
}

// A review is valid if the rating is a whole number 1-5 and
// the comment is a string/text
const isReview = (r) =>
  r &&
  Number.isInteger(r.rating) &&
  r.rating >= 1 &&
  r.rating <= 5 &&
  typeof r.comment === "string";

function loadAllReviews() {
  try {
    const raw = localStorage.getItem(REVIEWS_KEY);
    if (raw === null) return {};

    const data = JSON.parse(raw);

    if (!data || typeof data !== "object" || Array.isArray(data)) return {};

    return Object.fromEntries(
      Object.entries(data).filter(([id, review]) => isReview(review)),
    );
  } catch (error) {
    return {};
  }
}

function saveAllReviews(reviews) {
  try {
    localStorage.setItem(REVIEWS_KEY, JSON.stringify(reviews));
    return true;
  } catch (error) {
    return false;
  }
}

export function loadReview(id) {
  return loadAllReviews()[id] ?? null;
}

export function saveReview(id, review) {
  const reviews = loadAllReviews();
  reviews[id] = review;
  return saveAllReviews(reviews);
}

export function deleteReview(id) {
  const reviews = loadAllReviews();
  delete reviews[id];
  return saveAllReviews(reviews);
}
