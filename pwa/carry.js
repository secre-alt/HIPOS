import { escapeHTML as e } from "./core.js";

const steps = [
  ["Prevent before buying", "Choose less packaging where practical and buy only what you need."],
  ["Keep reusables separate", "Bring clean reusable containers where permitted. Keep food containers separate from waste."],
  ["Carry clean, dry waste only", "Use a suitable existing container or an optional dry-waste pouch. Carry the waste to a lawful, approved off-campus arrangement."],
  ["Ask staff about unsuitable waste", "Do not store wet, sanitary, sharp, chemical, or contaminated items. Do not handle hazardous waste. Follow staff-approved procedures."]
];
const drawings = [
  '<path d="M31 34h38l6 45H25Z" fill="#f4c2a8"/><path d="M40 37V25a10 10 0 0 1 20 0v12"/>',
  '<path d="M39 29v-6q0-6 6-6h10q6 0 6 6v6"/><rect x="20" y="29" width="60" height="50" rx="13" fill="#a8d9c9"/><path d="M20 45h60"/><rect x="45" y="40" width="10" height="10" rx="3" fill="#f3d68d"/>',
  '<rect x="23" y="29" width="54" height="53" rx="14" fill="#f3d68d"/><path d="M25 40h50M35 22h30"/><circle cx="66" cy="40" r="3" fill="#a8d9c9"/>',
  '<path d="m50 18 33 61H17Z" fill="#f4c2a8"/><path d="M50 39v17M50 66v1" stroke-width="4"/>'
];
function art(index) {
  return `<svg viewBox="0 0 100 100" aria-hidden="true" focusable="false" fill="none" stroke="#254b38" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">${drawings[index]}${index < 3 ? '<circle cx="41" cy="57" r="2" fill="#254b38"/><circle cx="58" cy="57" r="2" fill="#254b38"/><path d="M45 65q5 5 10 0"/>' : ""}</svg>`;
}
export function carryPage() {
  return `<div class="carry-page prevent-page">
    <section class="prevent-hero" aria-labelledby="carry-title">
      <div class="prevent-copy"><h1 id="carry-title">Carry out with care</h1><p>A pouch is optional. Safe handling always comes first.</p></div>
      <div class="prevent-kit carry-kit"><span class="kit-ground" aria-hidden="true"></span>${[[2, "lunch"], [1, "bottle"], [3, "buddy"]].map(([index, position]) => `<button type="button" class="kit-friend kit-${position}" data-carry-tip="${index}" aria-label="${e(steps[index][0])}" aria-pressed="false">${art(index)}</button>`).join("")}<p class="kit-tip" role="status" aria-live="polite" aria-atomic="true">Tap a buddy for a little tip.</p></div>
    </section>
    <ol class="carry-steps prevent-tips">${steps.map(([title, body], index) => `<li class="card prevent-tip"><div class="prevent-art prevent-art-${index}" aria-hidden="true">${art(index)}<span class="prevent-leaf"></span></div><div class="prevent-tip-copy"><div class="carry-step-number" aria-hidden="true">${index + 1}</div><h2>${e(title)}</h2>${index > 1 ? `<span class="pill${index === 3 ? " unsafe" : ""}">${index === 2 ? "Clean, dry and nonhazardous only" : "Keep out of your pouch or bag"}</span>` : ""}<p>${e(body)}</p>${index === 2 ? '<p class="carry-question">Not sure what is safe to carry?</p><a class="button-link secondary" href="#classify">Check Waste Type</a>' : ""}</div></li>`).join("")}</ol>
  </div>`;
}
export function interactWithCarry(event) {
  const button = event.target.closest("[data-carry-tip]");
  if (!button) return;
  const index = Number(button.dataset.carryTip);
  if (![1, 2, 3].includes(index)) return;
  const kit = button.closest(".carry-kit");
  kit.dataset.active = {1: "bottle", 2: "lunch", 3: "leaf"}[index];
  kit.querySelectorAll("[data-carry-tip]").forEach((helper) => helper.setAttribute("aria-pressed", String(helper === button)));
  kit.querySelector(".kit-tip").textContent = index === 2 ? "A pouch is optional. Safe handling always comes first." : steps[index][1];
}
