// Small helpers shared by more than one page.

// Getter function for series title
export function getTitle(series) {
  return series.title.english || series.title.romaji;
}

// Outputs a message in the #status paragraph (both pages have one)
export function setStatus(message) {
  document.querySelector("#status").textContent = message;
}
