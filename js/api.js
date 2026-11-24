// This api.js file was started with help from Claude AI and then edited by us.

// This file's only job: talk to the AniList API and hand back data.
// It does NOT touch the page (no document.querySelector, no HTML).

// 1. The address we send requests to. AniList has just ONE address
//    for everything; the "query" we send decides what data we get back.
const ANILIST_URL = "https://graphql.anilist.co";

// 2. The query for a LIST of series (browse page and suggestions).
const QUERY = `
  query ($page: Int, $perPage: Int, $search: String, $country: CountryCode, $status: MediaStatus, $genre: String) {
    Page(page: $page, perPage: $perPage) {
      pageInfo {
        currentPage
        hasNextPage
      }
      media(type: MANGA, search: $search, countryOfOrigin: $country, status: $status, genre: $genre, isAdult: false) {
        id
        title {
          romaji
          english
        }
        coverImage {
          large
        }
        averageScore
        chapters
        status
        countryOfOrigin
        genres
      }
    }
  }
`;

// 3. The query for ONE series (detail page).
const DETAIL_QUERY = `
  query ($id: Int) {
    Media(id: $id, type: MANGA, isAdult: false) {
      id
      title {
        romaji
        english
        native
      }
      coverImage {
        large
      }
      averageScore
      description(asHtml: false)
      status
      chapters
      countryOfOrigin
      genres
    }
  }
`;

// 4. Private helper (no "export"): sends ANY query and returns json.data.
//    Both functions below use it, so the fetch code is written only once.
async function request(query, variables) {
  const response = await fetch(ANILIST_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ query, variables }),
  });

  // fetch() does NOT throw on a 404 or 500, so we check manually.
  if (!response.ok) {
    throw new Error(`AniList request failed (HTTP ${response.status})`);
  }

  const json = await response.json();

  // GraphQL can reply with a good HTTP status but put errors in the body.
  if (json.errors) {
    throw new Error(json.errors[0].message);
  }

  return json.data;
}

// 5. List of series: { pageInfo, media }.
//    Options you leave out (undefined) are not sent, so no filter is applied.
export async function fetchManga({
  page = 1,
  perPage = 20,
  search,
  country,
  status,
  genre,
} = {}) {
  const data = await request(QUERY, {
    page,
    perPage,
    search,
    country,
    status,
    genre,
  });
  return data.Page;
}

// 6. One series by id: { id, title, coverImage, description, ... }
export async function fetchMangaById(id) {
  const data = await request(DETAIL_QUERY, { id });
  return data.Media;
}
