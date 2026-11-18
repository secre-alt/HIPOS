// Games hub: every game is reached from one "Games" item in the main menu and from the Games page.
// Add a new game here (and its route in app.js) instead of adding another menu item.
import {gameLogo} from './game-art.js';
import {CHARACTERS,isLocked,renderAvatar,currentConfig} from './avatar.js';
export const gamePages = ["games", "sort", "compost", "hazard", "garden"];
const games = [
  ["sort", "01 / Sort", "Pouch or staff?", "Six quick items. Drag each one to where it belongs.", "Play the sorting game →"],
  ["compost", "02 / Catch", "Catch the compost", "Move the basket and catch only the scraps that can be composted.", "Try Compost Catch →"],
  ["hazard", "03 / Spot", "Safe or Stay Away", "Eight quick items. Is it safe for the pouch, or ask staff?", "Play Safe or Stay Away →"],
  ["garden", "04 / Grow", "Tend your garden", "Your care grows nine flowers. Nothing wilts.", "Visit the Buddy garden →"],
];
// Progress shown on each game card: rounds played, and flowers in bloom for the garden.
const metaLine=(id,progress={})=>id==='garden'?`${progress.blooms||0} of 9 flowers in bloom`:(progress[id]||0)>0?`Rounds played: ${progress[id]}`:'Not played yet';
// Buddies still to earn, with how to earn them; hidden once everything is unlocked.
const rewards = () => {
  const locked = CHARACTERS.filter((c) => isLocked(c));
  if (!locked.length) return '';
  return `<section class="card games-rewards" aria-labelledby="rewards-heading"><h2 id="rewards-heading">Buddies to unlock</h2><ul>${locked.map((c) => `<li><span class="rewards-art" aria-hidden="true">${renderAvatar({ ...currentConfig(), character: c.id, color: 0, accessory: 'none' }, { size: 56, decorative: true, teaser: true })}</span><span><strong>${c.name}</strong><span class="rewards-hint">${c.hint}</span></span></li>`).join('')}</ul></section>`;
};
export const gamesPage = (progress = {}) =>
  `<div class="home-guides games-grid">${games
    .map(([id, number, title, body, action]) => `<a class="card card-link arcade-card arcade-${id}" href="#${id}"><div class="arcade-preview">${gameLogo(id)}</div><span class="guide-number">${number}</span><h3>${title}</h3><p>${body}</p><span class="arcade-meta">${metaLine(id,progress)}</span><span class="guide-link">${action}</span></a>`)
    .join("")}</div>${rewards()}`;
// Shown on the Sorting game, Compost Catch and Buddy garden pages.
export const gamesBack = () => '<p class="sort-promo"><a class="button-link secondary" href="#games">← All games</a></p>';
// Follow the same order as the hub, with the hub as the start and finish.
export function gameNavigation(page) {
  const index = games.findIndex(([id]) => id === page);
  if (index < 0) return '';
  const previous = index === 0 ? 'games' : games[index - 1][0];
  const next = index === games.length - 1 ? 'games' : games[index + 1][0];
  const backLabels = { games: 'Back to All games', sort: 'Back to Sorting game', compost: 'Back to Compost Catch', hazard: 'Back to Safe or Stay Away' };
  const nextLabels = { compost: 'Proceed to Compost Catch', hazard: 'Proceed to Safe or Stay Away', garden: 'Proceed to Buddy garden', games: 'All games' };
  return `<div class="sort-promo game-pagination" role="navigation" aria-label="Game navigation"><a class="button-link secondary" href="#${previous}"><span aria-hidden="true">&larr;</span><span>${backLabels[previous]}</span></a><a class="button-link secondary game-proceed" href="#${next}"><span>${nextLabels[next]}</span><span aria-hidden="true">&rarr;</span></a></div>`;
}
// Home page entry point.
export const gamesStrip = () =>
  '<section class="concern-strip games-strip" aria-labelledby="games-strip-heading"><div><h2 id="games-strip-heading">Need a short break?</h2><p>Sort items, catch compost, spot hazards, or tend your Buddy garden.</p></div><a class="button-link secondary" href="#games">Play games</a></section>';
