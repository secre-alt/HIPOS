// Games hub: every game is reached from one "Games" item in the main menu and from the Games page.
// Add a new game here (and its route in app.js) instead of adding another menu item.
export const gamePages = ["games", "sort", "compost", "garden"];
const games = [
  ["sort", "01 / Sort", "Pouch or staff?", "Six quick items. Drag each one to where it belongs.", "Play the sorting game →"],
  ["compost", "02 / Catch", "Catch the compost", "Move the basket and catch only the scraps that can be composted.", "Try Compost Catch →"],
  ["garden", "03 / Grow", "Tend your garden", "Your care grows nine flowers. Nothing wilts.", "Visit the Buddy garden →"],
];
export const gamesPage = () =>
  `<div class="home-guides games-grid">${games
    .map(([id, number, title, body, action]) => `<a class="card card-link" href="#${id}"><span class="guide-number">${number}</span><h3>${title}</h3><p>${body}</p><span class="guide-link">${action}</span></a>`)
    .join("")}</div>`;
// Shown on the Sorting game, Compost Catch and Buddy garden pages.
export const gamesBack = () => '<p class="sort-promo"><a class="button-link secondary" href="#games">← All games</a></p>';
// Home page entry point.
export const gamesStrip = () =>
  '<section class="concern-strip games-strip" aria-labelledby="games-strip-heading"><div><h2 id="games-strip-heading">Need a short break?</h2><p>Sort items, catch compost, or tend your Buddy garden.</p></div><a class="button-link secondary" href="#games">Play games</a></section>';
