import { loadShelves, removeFromShelf, SHELF_NAMES } from "./storage.js";
import { setStatus } from "./utils.js";
const shelvesEl = document.querySelector("#shelves");

// Builds one <li> for one saved series
function createShelfItem(entry) {
  const li = document.createElement("li");
  li.className = "shelf-item";
  li.dataset.id = entry.id;

  const a = document.createElement("a");
  a.href = `detail.html?id=${entry.id}`;

  const img = document.createElement("img");
  img.src = entry.cover;
  img.alt = "";

  const title = document.createElement("span");
  title.textContent = entry.title;

  a.append(img, title);

  const button = document.createElement("button");
  button.type = "button";
  button.className = "remove-button";
  button.textContent = "Remove";
  button.setAttribute("aria-label", `Remove ${entry.title} from shelf`);

  li.append(a, button);
  return li;
}

// Builds one <section> for one shelf: heading, then a list or an empty message
function createShelfSection(name, entries) {
  const section = document.createElement("section");

  const heading = document.createElement("h3");

  heading.textContent = `${name} (${entries.length})`;
  section.append(heading);

  if (entries.length === 0) {
    const empty = document.createElement("p");
    empty.textContent = "Nothing here yet.";
    section.append(empty);
    return section;
  }

  const list = document.createElement("ul");
  list.className = "shelf-list";
  list.append(...entries.map(createShelfItem));
  section.append(list);
  return section;
}

// --- Draws every shelf on the page ---
function renderShelves() {
  const shelves = loadShelves();
  const sections = SHELF_NAMES.map((name) =>
    createShelfSection(name, shelves[name]),
  );
  shelvesEl.replaceChildren(...sections);

  // empty state: true only if EVERY shelf has no entries
  const allEmpty = SHELF_NAMES.every((name) => shelves[name].length === 0);

  setStatus(
    allEmpty
      ? "You haven't saved anything yet. Find something on the Browse page."
      : "",
  );
}

// ONE click listener for every Remove button (event delegation)
shelvesEl.addEventListener("click", (event) => {
  const button = event.target.closest(".remove-button");
  if (!button) return;

  const id = Number(button.closest("li").dataset.id);
  const removed = removeFromShelf(id);

  if (!removed) {
    setStatus("Couldn't remove it. Storage may be blocked.");
    return;
  }
  renderShelves();
});

renderShelves();
