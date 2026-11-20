import { waste, wasteKeywords, moreWaste } from "./content.js";
import { wasteArt, moreWasteArt } from "./home.js";
import { escapeHTML as e } from "./core.js";
const items = () => [...waste.map(([title, suitable, body], i) => ({ title, suitable, body, art: wasteArt(i), words: wasteKeywords[i] || "", extra: false })), ...moreWaste.map(([title, suitable, body, words], i) => ({ title, suitable, body, art: moreWasteArt(i), words, extra: true }))];
const norm = (text) => text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
// Match the Prevent and Reuse hero, using the guide's existing safety advice.
export function classifyPage() {
  const helpers = [[0, "lunch"], [2, "bottle"], [5, "buddy"]];
  return `<div class="classify-page prevent-page"><section class="prevent-hero" aria-labelledby="classify-title"><div class="prevent-copy"><h1 id="classify-title">Know what you’re carrying.</h1><p>Only clean, dry, nonhazardous waste belongs in a dry-waste pouch.</p><a class="classify-game" href="#sort">Play the sorting game →</a></div><div class="prevent-kit classify-kit"><span class="kit-ground" aria-hidden="true"></span>${helpers.map(([index, position]) => `<button type="button" class="kit-friend kit-${position}" data-classify-tip="${index}" aria-label="${e(waste[index][0])}" aria-pressed="false">${wasteArt(index).replace('class="waste-guide-art"', 'class="classify-hero-art"')}</button>`).join("")}<p class="kit-tip" role="status" aria-live="polite" aria-atomic="true">Tap a buddy for a little tip.</p></div></section>${guideTools()}<div class="classify-items">${guideCards()}</div></div>`;
}
export function interactWithClassify(event) {
  const button = event.target.closest("[data-classify-tip]");
  if (!button) return;
  const item = waste[Number(button.dataset.classifyTip)];
  if (!item) return;
  const kit = button.closest(".classify-kit");
  kit.dataset.active = {0: "lunch", 2: "bottle", 5: "leaf"}[button.dataset.classifyTip];
  kit.querySelectorAll("[data-classify-tip]").forEach((helper) => helper.setAttribute("aria-pressed", String(helper === button)));
  kit.querySelector(".kit-tip").textContent = item[2];
}
export function guideTools() {
  const total = waste.length + moreWaste.length;
  return `<section class="guide-tools" aria-label="Search and filter the waste guide"><div class="guide-search-heading"><label for="guide-search">Search the guide</label></div><div class="guide-search-row"><input id="guide-search" type="search" placeholder="Try “juice box” or “battery”" autocomplete="off" enterkeyhint="search" aria-describedby="guide-search-help"><button type="button" class="secondary" data-guide-clear>Clear search</button></div><p id="guide-search-help" class="note">Search in English or Filipino: bottle, bote, wrapper, balot.</p><div class="chips" role="group" aria-label="Filter by guidance"><button class="secondary chip" data-guide-filter="all" aria-pressed="true">All</button><button class="secondary chip" data-guide-filter="ok" aria-pressed="false">Suitable if clean and dry</button><button class="secondary chip" data-guide-filter="no" aria-pressed="false">Keep out of your pouch</button></div><p id="guide-count" class="note" role="status" aria-live="polite">${total} items</p></section>`;
}
export function guideCards() {
  return items().map(({ title, suitable, body, art, words, extra }) => `<article class="card visual-waste-card${extra ? " extra" : ""}" data-kind="${suitable ? "ok" : "no"}" data-search="${e(norm(`${title} ${body} ${words}`))}"><div class="classify-art" aria-hidden="true">${art}</div><div class="classify-item-copy"><span class="pill ${suitable ? "" : "unsafe"}">${suitable ? "Suitable if clean and dry" : "Keep out of your pouch"}</span><h3>${e(title)}</h3><p><strong>What to do</strong></p><p>${e(body)}</p></div></article>`).join("") + '<div id="guide-empty" class="feedback" hidden><p>No match. If you’re unsure, keep it out of your pouch and ask school staff.</p><button type="button" class="secondary" data-guide-reset>Reset search and filters</button></div>';
}
// "See in Waste Guide" links leave the item name here; the Waste Guide page uses it once as its search.
const PENDING_KEY = "hipos.guide.pending";
export function queueGuideSearch(title) {
  try { sessionStorage.setItem(PENDING_KEY, String(title)); } catch { /* the guide still opens */ }
}
export function applyPendingGuideSearch() {
  let title = "";
  try { title = sessionStorage.getItem(PENDING_KEY) || ""; sessionStorage.removeItem(PENDING_KEY); } catch { /* nothing queued */ }
  const input = document.querySelector("#guide-search");
  if (!title || !input) return;
  input.value = title;
  applyGuideFilter();
}
export function setGuideFilter(button) {
  document.querySelectorAll("[data-guide-filter]").forEach((el) => el.setAttribute("aria-pressed", String(el === button)));
  applyGuideFilter();
}
export function resetGuideSearch(resetFilters = false) {
  const input = document.querySelector('#guide-search');
  if (!input) return;
  input.value = '';
  if (resetFilters) document.querySelectorAll('[data-guide-filter]').forEach(el => el.setAttribute('aria-pressed', String(el.dataset.guideFilter === 'all')));
  applyGuideFilter();
  input.focus();
}
export function applyGuideFilter() {
  const input = document.querySelector("#guide-search");
  if (!input) return;
  const terms = norm(input.value).split(/\s+/).filter(Boolean), kind = document.querySelector("[data-guide-filter][aria-pressed=true]")?.dataset.guideFilter || "all";
  const cards = [...document.querySelectorAll(".visual-waste-card")];
  let shown = 0;
  for (const card of cards) {
    // Match the stored English text and keywords, plus whatever language is on screen.
    const hay = card.dataset.search + " " + norm(card.textContent);
    const match = (kind === "all" || card.dataset.kind === kind) && terms.every((term) => hay.includes(term));
    card.hidden = !match;
    if (match) shown++;
  }
  document.querySelector("#guide-count").textContent = shown === cards.length ? `${cards.length} items` : `${shown} of ${cards.length} items`;
  document.querySelector("#guide-empty").hidden = shown > 0;
}
