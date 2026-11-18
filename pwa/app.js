import { aboutContent } from "./about.js";
import { initToasts, noticeType } from "./toast.js";
import { carryPage, interactWithCarry } from "./carry.js";
import { initPwa } from "./pwa-runtime.js";
import { dailyBuddy } from "./daily-buddy.js";
import { initLanguage } from "./i18n.js";
import { updateChallenge, rememberGuide, dailyChallenge, refreshWeekly, weekSummary } from "./engagement.js";
import { weekCardBlob } from "./summary-card.js";
import { initTextSize } from "./textsize.js";
import { initFontStyle } from "./fontstyle.js";
import { avatarEditor, avatarClick, submitNickname, nicknameInput, resetNickname, refreshAvatars, syncUnlocks, greeting } from "./avatar.js";
import { cheersOn, cheer, celebrateUnlock, buddySay, tapBuddy, applyMood, animate, sparkle, buzz, sound, giveTreat, syncStickers, earnedKeys, stats, gardenState, carePoints, stickerBook, initBuddySettings } from "./buddy-fx.js";
import { sortGame, fitGame, sortClick, sortPointerDown, sortPointerMove, sortPointerUp } from "./sortgame.js";
import { compostGame, initCompost } from "./compost.js";
import { gardenPage, initGarden } from "./garden.js";
import { answerQuiz, nextQuestion, restartQuiz, updateHabit, localDay, checklist } from "./activities.js";
import { home, selectWaste, wasteArt } from "./home.js";
import { revealOnScroll, initScrollEffects } from "./motion.js";
import { classifyPage, interactWithClassify, setGuideFilter, applyGuideFilter, resetGuideSearch } from "./guide.js";
import { escapeHTML as e } from "./core.js";
import { waste } from "./content.js";
import { reusePage, interactWithReuse } from "./reuse.js";
import { preventPage, interactWithKit } from "./prevent.js";
import { gamePages, gamesPage, gamesBack, gameNavigation } from "./games.js";
const toasts = initToasts();
const view = document.querySelector("#view"), dialog = document.querySelector("#dialog");
view.addEventListener("click", interactWithKit);
view.addEventListener("click", interactWithReuse);
view.addEventListener("click", interactWithClassify);
view.addEventListener("click", interactWithCarry);
const links = [["home", "Home"], ["prevent", "Prevent"], ["reuse", "Reuse"], ["classify", "Classify"], ["carry", "Carry out"], ["games", "Games"]];
// Sorting game, Compost Catch and Buddy garden live under the single Games menu item.
const navId = (page) => (gamePages.includes(page) ? "games" : page);
const pageTitles = { avatar: "My buddy", sort: "Sorting game", compost: "Compost Catch", garden: "Buddy garden" };
function message(text) {
  if (text) toasts.push(text, noticeType(text));
  document.querySelector("#notice").textContent = text;
}
// Buddy extras are cosmetic rewards for activity already recorded on this device. Once unlocked they stay unlocked.
function summaryNow() {
  const week = weekSummary();
  return { ...week, extra: [...earnedKeys(week), ...stats().seasons.map((key) => "season-" + key), ...(stats().compostPerfect >= 1 ? ["compostperfect"] : [])] };
}
function gamesProgress() {
  try {
    const st = stats();
    return { sort: st.sorts, compost: st.compost, blooms: gardenState(carePoints(summaryNow())).blooms };
  } catch {
    return {};
  }
}
// Messages and pop-ups wait until a round-result modal is closed, so they never cover its buttons.
function whenResultClosed(fn) {
  const modal = document.querySelector("dialog.sort-result[open], dialog.compost-result[open]");
  if (!modal) return fn();
  let ticks = 0;
  const timer = setInterval(() => {
    if (!modal.isConnected || !modal.open || ++ticks > 400) { clearInterval(timer); fn(); }
  }, 250);
}
function checkBuddyUnlocks(announce = false) {
  try {
    const sum = summaryNow(), fresh = syncUnlocks(sum), stickers = syncStickers(sum);
    applyMood(sum);
    if (!announce) return;
    if (stickers.length) {
      message(`New sticker: ${stickers.map((t) => t.name).join(", ")}!`);
      setTimeout(() => cheer(stickers.some((t) => t.key.startsWith("streak")) ? "streak" : "unlock"), 3800);
    }
    const buddies = fresh.filter((a) => a.colors), extras = fresh.filter((a) => !a.colors);
    buddies.forEach(celebrateUnlock);
    if (buddies.length) cheer("unlock");
    if (extras.length) message(`New buddy extra unlocked: ${extras.map((a) => a.name).join(", ")}. Open My buddy to try it.`);
  } catch {
    /* activity history unavailable: nothing to unlock */
  }
}
let dailyCheerTimer;
function checkDailyCheer() {
  clearTimeout(dailyCheerTimer);
  dailyCheerTimer = setTimeout(() => {
    if (document.hidden) return;
    const buddy = dailyBuddy(localStorage, localDay()), text = buddy.completion();
    if (text && cheersOn()) {
      if (cheer("daily", { text })) buddy.celebrated();
      else checkDailyCheer();
    }
  }, 3800);
}
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) checkDailyCheer();
});
function onHabit(input) {
  if (!input.checked) {
    sound("undo");
    return;
  }
  const index = Number(input.dataset.habit);
  giveTreat(index, localDay());
  const all = [...document.querySelectorAll("[data-habit]")].every((x) => x.checked);
  sparkle(input, 6);
  buzz(12);
  cheer(all ? "complete" : "habit");
  const treats = document.querySelector(".buddy-treats");
  if (treats) treats.textContent = `Treats shared: ${stats().treats}`;
}
function onChallenge(state) {
  if (state === "done") {
    cheer("challenge");
    buzz(20);
  } else if (state === "skipped") {
    buddySay("That is okay. See you tomorrow!");
    sound("tick");
  }
}
function onAnswer() {
  const right = document.querySelector("#quiz-feedback strong")?.textContent === "Correct.";
  cheer(right ? "correct" : "retry");
  if (right) buzz(10);
}
function onWaste(button) {
  const item = waste[Number(button.dataset.waste)];
  if (!item) return;
  buddySay(item[1] ? "Nice! Keep it clean and dry." : "Careful! Ask school staff for this one.");
  animate("hop");
  sound("boop");
}
document.addEventListener("hipos-game-done", () => whenResultClosed(() => checkBuddyUnlocks(true)));
const PAGE_LINES = { games: "Pick a game!", classify: "Let us sort it out!", sort: "Ready to sort? Let us play!", compost: "Catch the compost!", garden: "Look at my flowers!", reuse: "Reuse is the best!", prevent: "Less waste starts here!", carry: "Clean and dry only. Remember?", avatar: "Ooh, make me look great!" };
const greeted = /* @__PURE__ */ new Set();
let firstRender = true;
const card = (title, body, note = "") => `<article class="card"><h3>${e(title)}</h3>${body.startsWith("Requires school approval") ? '<span class="approval-label">Requires school approval</span>' : ""}<p>${e(body)}</p>${note ? `<p class="note">${e(note)}</p>` : ""}</article>`;
const build = typeof __HIPOS_BUILD__ !== "undefined" ? __HIPOS_BUILD__ : { version: "dev", date: "" };
// On phones the share sheet lets people save straight to Files / Drive; elsewhere it is a normal download.
// Returns false when the person closed the share sheet without saving.
async function deliverFile(file, title) {
  if (matchMedia("(pointer: coarse)").matches && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title });
      return true;
    } catch (err) {
      if (err?.name === "AbortError") return false;
    }
  }
  const url = URL.createObjectURL(file), a = document.createElement("a");
  a.href = url;
  a.download = file.name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1e4);
  return true;
}
async function shareWeek() {
  try {
    const blob = await weekCardBlob(weekSummary());
    if (await deliverFile(new File([blob], `hipos-week-${localDay()}.png`, { type: "image/png" }), "My week with HIPOS")) message("Your week image is ready.");
  } catch {
    message("Could not create the image. Try again.");
  }
}
const versionCard = () => `<article class="card version-card"><h3>App version</h3><p>HIPOS checks for updates each time you open it online. You can also check now.</p><p class="note" data-no-translate>Version ${e(build.version)}${build.date ? " · " + e(build.date) : ""}</p><div class="actions"><button class="secondary" data-action="check-update">Check for updates</button></div></article>`;
const intro = (title, body) => `<section class="intro"><h1>${title}</h1><p>${body}</p></section>`;
function current() {
  const p = location.hash.slice(1) || "home";
  return [...links.map((x) => x[0]), "privacy", "avatar", "sort", "compost", "garden"].includes(p) ? p : "home";
}
function modal(html) {
  document.querySelector("#dialog-body").innerHTML = html;
  if (!dialog.open) dialog.showModal();
}
function render() {
  message("");
  closeMobileMore();
  document.querySelector("#menu-toggle").setAttribute("aria-expanded", "false");
  if (dialog.open) dialog.close();
  const page = current();
  if (gamePages.includes(page)) view.dataset.gamePage = page;
  else delete view.dataset.gamePage;
  rememberGuide(page);
  checkBuddyUnlocks();
  refreshAvatars();
  document.querySelectorAll(".mobile-bottom-nav a").forEach((a) => {
    if (a.hash === "#" + navId(page)) a.setAttribute("aria-current", "page");
    else a.removeAttribute("aria-current");
  });
  document.querySelector("#mobile-more-toggle").classList.toggle("is-current", ["carry", "games"].includes(navId(page)));
  document.querySelector("#nav").innerHTML = links.map(([id, label]) => `<a href="#${id}" ${id === navId(page) ? 'class="active" aria-current="page"' : ""}>${label}</a>`).join("");
  document.querySelector("#page-label").textContent = page === "home" ? "Your daily guide" : pageTitles[page] || links.find((x) => x[0] === page)?.[1] || "About HIPOS";
  if (page === "home") view.innerHTML = home();
  if (page === "prevent") view.innerHTML = preventPage();
  if (page === "reuse") view.innerHTML = reusePage();
  if (page === "classify") view.innerHTML = classifyPage();
  if (page === "carry") view.innerHTML = carryPage();
  if (page === "avatar") view.innerHTML = intro("Meet your buddy.", "Pick a character and make it yours. Your buddy stays on this device.") + avatarEditor() + stickerBook();
  if (page === "games") view.innerHTML = intro("Games", "Short, friendly games about waste. Nothing is graded or sent anywhere.") + gamesPage(gamesProgress());
  if (page === "sort") view.innerHTML = gamesBack() + intro("Sorting game", "A quick, friendly game. Nothing is graded or sent anywhere.") + sortGame(summaryNow()) + gameNavigation(page);
  if (page === "garden") view.innerHTML = gamesBack() + intro("Buddy garden","Your flowers grow from the care you give. Nothing wilts and nothing is sent anywhere.") + gardenPage(summaryNow()) + gameNavigation(page);
  if (page === "compost") view.innerHTML = gamesBack() + intro("Compost Catch","Catch the scraps that can be composted. Nothing is graded or sent anywhere.") + compostGame(summaryNow()) + gameNavigation(page);
  if (page === "privacy") view.innerHTML = intro("Private by choice. Local by default.", "HIPOS is an offline-first school project prototype.") + card("Offline access", "Open once online and wait for “Ready offline”. Install from the browser menu or the Install app button. On iPhone or iPad, use Safari → Share → Add to Home Screen. The first visit needs a connection; later visits use cached files.") + card("Your activity on this device", "Daily reminders, challenges, quiz progress, recent guides, your buddy, and language choice are saved in this browser. Older weekly history is removed when you save new activity. These records are not sent to a server. Browser storage may be cleared or unavailable.") + card("Installation and hosting", "Installation and offline caching require HTTPS in production. Localhost is suitable for development. Use the same web address to keep access to your saved activity.") + versionCard();
  revealOnScroll();
  view.classList.remove("page-in");
  void view.offsetWidth;
  view.classList.add("page-in");
  if (page === "sort") fitGame();
  if (page === "compost") initCompost();
  if (page === "garden") initGarden();
  checkBuddyUnlocks();
  if (!firstRender && PAGE_LINES[page] && !greeted.has(page)) {
    greeted.add(page);
    buddySay(PAGE_LINES[page]);
    animate("hop");
  }
  firstRender = false;
}
document.addEventListener("click", async (event) => {
  const b = event.target.closest("button");
  if (!b) return;
  try {
    if (b.dataset.action === "about") {
      const about = document.querySelector("#about-dialog");
      about.innerHTML = aboutContent;
      about.showModal();
      about.scrollTop = 0;
    }
    if (b.hasAttribute("data-challenge")) {
      updateChallenge(b);
      onChallenge(b.dataset.challenge);
      checkDailyCheer();
      checkBuddyUnlocks(true);
    }
    if (b.hasAttribute("data-answer")) {
      answerQuiz(b);
      onAnswer();
    }
    if (b.hasAttribute("data-quiz-next")) {
      nextQuestion();
      if (document.querySelector("#quiz-summary")) dailyBuddy(localStorage, localDay()).quizDone();
      checkDailyCheer();
    }
    if (b.hasAttribute("data-quiz-restart")) restartQuiz();
    if (b.hasAttribute("data-waste")) {
      selectWaste(b);
      onWaste(b);
    }
    if (b.hasAttribute("data-buddy-tap")) {
      tapBuddy(b);
      checkBuddyUnlocks(true);
    }
    if (b.hasAttribute("data-sort-review") || b.hasAttribute("data-sort-bin") || b.hasAttribute("data-sort-next") || b.hasAttribute("data-sort-again") || b.hasAttribute("data-sort-results") || b.hasAttribute("data-sort-restart")) {
      const result = sortClick(b);
      if (result === "finished") whenResultClosed(() => checkBuddyUnlocks(true));
    }
    if (b.id === "buddy-nickname-reset") resetNickname(b.closest("form"));
    if (b.dataset.avatarKey || b.dataset.avatarAction) {
      avatarClick(b);
      applyMood();
      if (b.getAttribute("aria-disabled") !== "true") {
        animate("hop");
        sound("pop");
      }
    }
    if (b.hasAttribute("data-guide-filter")) setGuideFilter(b);
    if (b.hasAttribute("data-guide-clear")) resetGuideSearch();
    if (b.hasAttribute("data-guide-reset")) resetGuideSearch(true);
    switch (b.dataset.action) {
      case "check-update":
        await manualUpdateCheck();
        break;
      case "share-week":
        await shareWeek();
        break;
    }
  } catch (err) {
    message(err.message);
  }
});
document.addEventListener("submit", (event) => {
  if (event.target.id === "buddy-nickname-form") {
    event.preventDefault();
    submitNickname(event.target);
  }
});
document.addEventListener("input", (event) => {
  if (event.target.id === "guide-search") applyGuideFilter();
  if (event.target.id === "buddy-nickname") nicknameInput(event.target);
});
document.addEventListener("change", (event) => {
  if (event.target.hasAttribute("data-habit")) {
    updateHabit(event.target);
    onHabit(event.target);
    checkBuddyUnlocks(true);
    checkDailyCheer();
    return;
  }
});
const settingsDialog = document.querySelector("#settings-dialog");
const settingsCategory = document.querySelector("#settings-category");
function showSettingsCategory(category) {
  settingsDialog.querySelectorAll("[data-settings-category]").forEach((button) => {
    const active = button.dataset.settingsCategory === category;
    button.setAttribute("aria-pressed", String(active));
    document.getElementById(button.getAttribute("aria-controls")).hidden = !active;
  });
  settingsCategory.value = category;
  settingsDialog.querySelector(".settings-body").scrollTop = 0;
}
settingsDialog.querySelectorAll("[data-settings-category]").forEach((button) => button.addEventListener("click", () => showSettingsCategory(button.dataset.settingsCategory)));
settingsCategory.addEventListener("change", () => showSettingsCategory(settingsCategory.value));
settingsDialog.addEventListener("click", (event) => {
  if (event.target !== settingsDialog) return;
  const bounds = settingsDialog.getBoundingClientRect();
  if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) settingsDialog.close();
});
document.querySelector(".settings-version").textContent = "Version " + build.version;
document.querySelector(".settings-buddy-link").addEventListener("click", () => settingsDialog.close());
document.querySelectorAll(".settings-toggle").forEach((button) => button.addEventListener("click", () => {
  closeMenu();
  settingsDialog.showModal();
}));
const moreToggle = document.querySelector("#mobile-more-toggle");
const morePanel = document.querySelector("#mobile-more-panel");
function closeMobileMore(returnFocus = false) {
  if (!morePanel || morePanel.hidden) return;
  const focusInside = morePanel.contains(document.activeElement);
  morePanel.hidden = true;
  moreToggle.setAttribute("aria-expanded", "false");
  if (returnFocus || focusInside) moreToggle.focus({ preventScroll: true });
}
moreToggle.addEventListener("click", () => {
  const opening = morePanel.hidden;
  closeMenu();
  morePanel.hidden = !opening;
  moreToggle.setAttribute("aria-expanded", String(opening));
});
document.addEventListener("click", event => {
  if (!event.target.closest(".mobile-more") || event.target.closest("#mobile-more-panel a")) closeMobileMore();
});
document.addEventListener("keydown", event => {
  if (event.key === "Escape" && !morePanel.hidden) { event.preventDefault(); closeMobileMore(true); }
});
document.addEventListener("focusin", event => { if (!event.target.closest(".mobile-more")) closeMobileMore(); });
window.addEventListener("resize", () => { if (innerWidth > 760) closeMobileMore(); });
const menuToggle = document.querySelector("#menu-toggle");
function closeMenu(returnFocus = false) {
  if (menuToggle.getAttribute("aria-expanded") !== "true") return;
  const focusWasInNav = document.querySelector("#nav").contains(document.activeElement);
  menuToggle.setAttribute("aria-expanded", "false");
  if (returnFocus || focusWasInNav) menuToggle.focus({ preventScroll: true });
}
menuToggle.addEventListener("click", () => {
  menuToggle.setAttribute("aria-expanded", String(menuToggle.getAttribute("aria-expanded") !== "true"));
});
// Close on any other tap, including empty space inside the navigation bar.
// Using click lets navigation links complete their normal activation first.
document.addEventListener("click", (event) => {
  if (!event.target.closest("#menu-toggle")) closeMenu();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !dialog.open) closeMenu(true);
});
window.addEventListener("scroll", () => closeMenu(), { passive: true, capture: true });
window.addEventListener("wheel", () => closeMenu(), { passive: true });
window.addEventListener("touchmove", () => closeMenu(), { passive: true });
window.addEventListener("resize", () => { if (current() === "sort") fitGame(); });
window.addEventListener("hashchange", () => {
  sound("whoosh");
  render();
  view.focus();
  window.scrollTo({ top: 0, behavior: "instant" });
  if (current() === "sort") fitGame();
});
const { manualUpdateCheck } = initPwa({ message, modal });
render();
refreshAvatars();
initLanguage();
{
  const text = dailyBuddy(localStorage, localDay()).visit();
  if (text) cheer("welcome", { text });
  else buddySay(greeting(), { ms: 5e3 });
}
checkDailyCheer();
initTextSize();
initFontStyle();
initBuddySettings();
document.addEventListener("pointerdown", sortPointerDown);
document.addEventListener("pointermove", sortPointerMove);
document.addEventListener("pointerup", sortPointerUp);
document.addEventListener("pointercancel", sortPointerUp);
document.querySelector("#splash")?.remove();
initScrollEffects();
// Repeat greetings during quiet moments without interrupting reactions or form entry.
setInterval(() => {
  if (document.hidden || document.querySelector("#buddy-say:not([hidden])") || document.querySelector("dialog[open]")) return;
  if (document.activeElement?.matches('input,textarea,select,[contenteditable="true"]')) return;
  buddySay(greeting(), { ms: 5e3 });
}, 24e3);
function refreshDay() {
  const panel = document.querySelector(".daily-panel");
  if (panel && panel.dataset.day !== localDay()) {
    panel.outerHTML = checklist();
    refreshWeekly();
  }
  const challenge = document.querySelector(".challenge-panel");
  if (challenge && challenge.dataset.day !== localDay()) challenge.outerHTML = dailyChallenge();
}
setInterval(refreshDay, 6e4);
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) refreshDay();
});
