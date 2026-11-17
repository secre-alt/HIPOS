// Games hub: every game is reached from one "Games" item in the main menu and from the Games page.
// Add a new game here (and its route in app.js) instead of adding another menu item.
import {gameLogo} from './game-art.js';
export const gamePages = ["games", "sort", "compost", "garden"];
const games = [
  ["sort", "01 / Sort", "Pouch or staff?", "Six quick items. Drag each one to where it belongs.", "Play the sorting game →"],
  ["compost", "02 / Catch", "Catch the compost", "Move the basket and catch only the scraps that can be composted.", "Try Compost Catch →"],
  ["garden", "03 / Grow", "Tend your garden", "Your care grows nine flowers. Nothing wilts.", "Visit the Buddy garden →"],
];
// Progress shown on each game card: rounds played, and flowers in bloom for the garden.
const metaLine=(id,progress={})=>id==='garden'?`${progress.blooms||0} of 9 flowers in bloom`:(progress[id]||0)>0?`Rounds played: ${progress[id]}`:'Not played yet';
export const gamesPage = (progress = {}) =>
  `<div class="home-guides games-grid">${games
    .map(([id, number, title, body, action]) => `<a class="card card-link arcade-card arcade-${id}" href="#${id}"><div class="arcade-preview">${gameLogo(id)}</div><span class="guide-number">${number}</span><h3>${title}</h3><p>${body}</p><span class="arcade-meta">${metaLine(id,progress)}</span><span class="guide-link">${action}</span></a>`)
    .join("")}</div>`;
// Shown on the Sorting game, Compost Catch and Buddy garden pages.
export const gamesBack = () => '<p class="sort-promo"><a class="button-link secondary" href="#games">← All games</a></p>';
// Follow the same order as the hub, with the hub as the start and finish.
export function gameNavigation(page) {
  const index = games.findIndex(([id]) => id === page);
  if (index < 0) return '';
  const previous = index === 0 ? 'games' : games[index - 1][0];
  const next = index === games.length - 1 ? 'games' : games[index + 1][0];
  const backLabels = { games: 'Back to All games', sort: 'Back to Sorting game', compost: 'Back to Compost Catch' };
  const nextLabels = { compost: 'Proceed to Compost Catch', garden: 'Proceed to Buddy garden', games: 'All games' };
  return `<div class="sort-promo game-pagination" role="navigation" aria-label="Game navigation"><a class="button-link secondary" href="#${previous}"><span aria-hidden="true">&larr;</span><span>${backLabels[previous]}</span></a><a class="button-link secondary game-proceed" href="#${next}"><span>${nextLabels[next]}</span><span aria-hidden="true">&rarr;</span></a></div>`;
}
// Home page entry point.
export const gamesStrip = () =>
  '<section class="concern-strip games-strip" aria-labelledby="games-strip-heading"><div><h2 id="games-strip-heading">Need a short break?</h2><p>Sort items, catch compost, or tend your Buddy garden.</p></div><a class="button-link secondary" href="#games">Play games</a></section>';
