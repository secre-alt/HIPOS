import {dailyChallenge,weekly,recentGuides,schoolSection} from './engagement.js';
import {waste} from './content.js';
import {escapeHTML as e} from './core.js';
import {checklist,quiz} from './activities.js';

// Interface direction informed by unslop by Damir Sokolovsky, CC BY 4.0.
// https://heydamir.design/unslop
const drawings=[
  '<path d="M25 12h30l16 16v52H25z" fill="#faf8ed"/><path d="M55 12v16h16M35 42h26M35 52h26M35 62h18"/>',
  '<path d="m18 28 12-8 12 5 12-5 12 5 12-5-6 17 6 31-12 8-12-5-12 5-12-5-12 5 6-31z" fill="#dfc58c"/><path d="M35 39h26v23H35M29 29l-3 38M68 29l3 38"/>',
  '<path d="M39 12h18v15l9 13v35q0 7-7 7H37q-7 0-7-7V40l9-13z" fill="#d9e5d3"/><path d="M39 20h18M31 48h34v18H31M40 12h16"/>',
  '<path d="M23 54q25 36 50 0z" fill="#e3b18f"/><path d="M35 49q-10-18 4-25 8 13-4 25M51 48q-1-23 18-23-1 20-18 23" fill="#a9bd87"/><path d="m37 64 21 1M44 39l4 15"/>',
  '<path d="m20 38 17-18 18 13 20-8-2 48-37 8-16-19z" fill="#f5f2e9"/><path d="m37 20 5 34 31 19M20 38l22 16-6 27M55 33l-5 13"/>',
  '<path d="m48 14 35 62H13z" fill="#efdbbd"/><path d="M48 35v18M48 63v2" stroke-width="4"/>',
];
const captions=['Paper','Wrapper','Bottle','Food scraps','Used tissues','Hazardous items'];
const heroArt=`<svg class="hero-deco" viewBox="0 0 400 400" fill="none" aria-hidden="true" focusable="false"><circle cx="200" cy="200" r="168" stroke="#ffffff22" stroke-width="2" stroke-dasharray="4 10"/><circle cx="200" cy="200" r="118" fill="#ffffff10"/><g class="orbit"><circle cx="200" cy="32" r="14" fill="#b9f26b"/><circle cx="368" cy="200" r="10" fill="#ffd36b"/><circle cx="82" cy="319" r="12" fill="#9fc9f5"/></g><g class="float"><path d="M200 108c-52 10-78 54-70 108 4 28 24 50 50 58 4-34 16-66 40-92-26 8-44 28-52 52-8-50 6-92 32-126Z" fill="#b9f26b"/><path d="M200 108c58 8 92 56 78 116-8 34-40 56-72 54-6-44-4-120-6-170Z" fill="#6fd08c"/><path d="M200 112c0 60 2 130 8 200" stroke="#0c3126" stroke-width="5" stroke-linecap="round"/></g><g class="float b"><path d="M96 150a110 110 0 0 1 70-62m0 0-4 26m4-26-26-4" stroke="#fff" stroke-opacity=".7" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/></g><g class="float c"><path d="M304 250a110 110 0 0 1-70 62m0 0 4-26m-4 26 26 4" stroke="#fff" stroke-opacity=".7" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/></g></svg>`;
export function home(){
  return `<section class="home-intro"><p class="eyebrow">Your school-day waste guide</p><h1>A little care.<br><span class="hl">Less waste.</span></h1><p>Start with what’s in your hand. Find out how to handle it safely.</p><a class="home-report" href="#reports" aria-label="Report a Concern">Report a Concern &rarr;</a>${heroArt}</section>
  <section class="waste-checker" aria-labelledby="checker-heading"><div class="checker-heading"><div><h2 id="checker-heading">What are you throwing away?</h2><p>Choose an item to check the guidance</p></div><a href="#classify">Check Waste Type</a></div>
  <div class="waste-choices">${waste.map(([title],i)=>`<button class="waste-choice" data-waste="${i}" aria-label="${e(title)}" aria-pressed="false" aria-controls="waste-result"><span class="item-art"><svg viewBox="0 0 96 96" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${drawings[i]}</svg></span><span>${captions[i]}</span></button>`).join('')}</div>
  <div id="waste-result" class="waste-result" role="status" aria-live="polite" aria-atomic="true"><p>Select an item above. Guidance will appear here.</p></div></section>
  ${activities()}${recentGuides()}<section class="home-next" aria-labelledby="next-heading"><h2 id="next-heading">Make the next choice easier</h2><div class="home-guides"><a class="card card-link" href="#prevent"><span class="guide-number">01 / Prevent</span><h3>Less packaging, less to carry</h3><p>A little planning before your next snack or drink.</p><span class="guide-link">Prevent Waste →</span></a><a class="card card-link" href="#reuse"><span class="guide-number">02 / Reuse</span><h3>Bring it. Use it again.</h3><p>Your own bottle, lunchbox, or utensils, where permitted.</p><span class="guide-link">Explore reuse →</span></a><a class="card card-link" href="#carry"><span class="guide-number">03 / Carry out</span><h3>Know what can come with you</h3><p>Clean, dry, nonhazardous waste only. A pouch is optional.</p><span class="guide-link">Read the guide →</span></a></div></section>
  ${weekly()}${schoolSection()}<section class="concern-strip"><div><h2>Something needs attention?</h2><p>Save a concern on this device and choose when to share it.</p></div><a class="button-link secondary" href="#reports">Record a concern</a></section><p class="note">School project prototype. Reusable canteen services: <strong>Requires school approval</strong>.</p>`;
}
export function selectWaste(button){
  const item=waste[Number(button.dataset.waste)];
  if(!item)return;
  document.querySelectorAll('[data-waste]').forEach(el=>el.setAttribute('aria-pressed',String(el===button)));
  const [title,suitable,body]=item,result=document.querySelector('#waste-result');
  result.classList.toggle('needs-care',!suitable);
  result.innerHTML=`<span class="result-label">${suitable?'Suitable only if clean, dry and nonhazardous':'Keep out of your dry-waste pouch'}</span><h3>${e(title)}</h3><p>${e(body)}</p><a href="#carry">Read the safe carry-out guide →</a>`;
}

export function activities(){return `<div class="home-activities">${dailyChallenge()}${quiz()}${checklist()}</div>`;}

const reuseDrawings=[drawings[2],'<rect x="14" y="34" width="68" height="44" rx="12" fill="#dfc58c"/><rect x="12" y="28" width="72" height="14" rx="6" fill="#efdfba"/><path d="M41 29v49h14V29M34 28v-8h28v8"/>','<path d="M27 14v23m-8-23v15q0 10 8 10t8-10V14M27 39v43M65 14q-15 0-15 17t15 17q15 0 15-17T65 14M65 48v34" fill="#d9e5d3"/>'];
export function reuseArt(index){return index<3?`<svg class="reuse-art" viewBox="0 0 96 96" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${reuseDrawings[index]}</svg>`:'';}
export function wasteArt(index){return `<svg class="waste-guide-art" viewBox="0 0 96 96" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${drawings[index]}</svg>`;}
