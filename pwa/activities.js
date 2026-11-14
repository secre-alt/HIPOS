import {escapeHTML as e} from './core.js';

const checklistKey='hipos.daily.v1';
const habits=['Packed my clean bottle','Brought my lunchbox','Brought reusable utensils'];
export function localDay(now=new Date()){
  return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
}
export function readDaily(storage=localStorage,day=localDay()){
  const saved=JSON.parse(storage.getItem(checklistKey)||'null');
  return {day,checked:saved?.day===day&&Array.isArray(saved.checked)?habits.map((_,i)=>saved.checked[i]===true):habits.map(()=>false)};
}
export function checklist(){
  let daily,error='';
  try{daily=readDaily();}catch{daily={day:localDay(),checked:habits.map(()=>false)};error='Saved checklist could not be read. Changes will only be shown if they can be saved.';}
  return `<section class="daily-panel card" aria-labelledby="daily-heading" data-day="${daily.day}"><h2 id="daily-heading">Ready for your school day?</h2><p>Optional reminders, where school rules permit. Starts fresh each day on this device.</p><div class="daily-items">${habits.map((label,i)=>`<label><input type="checkbox" data-habit="${i}" ${daily.checked[i]?'checked':''}><span>${label}</span></label>`).join('')}</div><p id="daily-progress" role="status">${error||progress(daily.checked)}</p></section>`;
}
function progress(checked){return `${checked.filter(Boolean).length} of ${habits.length} actions completed today`;}
export function updateHabit(input){
  const panel=input.closest('.daily-panel');
  if(panel.dataset.day!==localDay()){
    panel.outerHTML=checklist();
    document.querySelector('#daily-progress').textContent='A new day has started. Choose your reminders for today.';
    return;
  }
  try{
    const daily=readDaily(),index=Number(input.dataset.habit);
    daily.checked[index]=input.checked;
    localStorage.setItem(checklistKey,JSON.stringify(daily));
    document.querySelector('#daily-progress').textContent=progress(daily.checked);
  }catch{
    input.checked=!input.checked;
    document.querySelector('#daily-progress').textContent='Could not save your change. Browser storage may be unavailable. Try again.';
  }
}
const questions=[
  {title:'A clean, dry paper wrapper',correct:0,explanation:'Clean, dry, nonhazardous paper can be stored briefly in an optional dry-waste pouch, then taken to an approved recycling or disposal arrangement.'},
  {title:'Leftover food from lunch',correct:1,explanation:'Food scraps do not belong in a dry-waste pouch. Ask school staff for the approved handling procedure.'},
  {title:'A broken piece of glass',correct:1,explanation:'Do not touch, collect, or store sharp waste. Inform authorized school staff.'},
];
let question=0,score=0,answered=false;
export function quiz(){
  question=0;score=0;answered=false;
  return `<section class="quiz-panel card" aria-labelledby="quiz-heading"><h2 id="quiz-heading">A quick sorting check</h2><p>Three questions. Learn why each item belongs where it does.</p><div id="quiz-content">${questionHTML()}</div></section>`;
}
function questionHTML(){
  return `<p class="quiz-step">Question ${question+1} of ${questions.length}</p><h3 id="quiz-question" tabindex="-1">${e(questions[question].title)}</h3><div class="quiz-options" role="group" aria-labelledby="quiz-question"><button class="secondary" data-answer="0">Suitable if clean and dry</button><button class="secondary" data-answer="1">Keep out of the pouch</button></div><div id="quiz-feedback" role="status" aria-live="polite" aria-atomic="true"></div><button data-quiz-next hidden>${question===questions.length-1?'See results':'Next question'}</button>`;
}
export function answerQuiz(button){
  if(answered)return;
  answered=true;
  const correct=Number(button.dataset.answer)===questions[question].correct;
  if(correct)score++;
  document.querySelectorAll('[data-answer]').forEach(el=>{el.disabled=true;});
  document.querySelector('#quiz-feedback').innerHTML=`<p><strong>${correct?'Correct.':'Let’s check that.'}</strong> ${e(questions[question].explanation)}</p>`;
  document.querySelector('[data-quiz-next]').hidden=false;
}
export function nextQuestion(){
  if(!answered)return;
  const content=document.querySelector('#quiz-content');
  if(++question===questions.length){
    content.innerHTML=`<h3 tabindex="-1" id="quiz-summary">${score} of ${questions.length} correct</h3><p>Clean, dry and nonhazardous only. Ask authorized staff about unsuitable waste.</p><button data-quiz-restart>Try again</button>`;
    document.querySelector('#quiz-summary').focus();return;
  }
  answered=false;content.innerHTML=questionHTML();document.querySelector('#quiz-question').focus();
}
export function restartQuiz(){
  document.querySelector('.quiz-panel').outerHTML=quiz();document.querySelector('#quiz-question').focus();
}
