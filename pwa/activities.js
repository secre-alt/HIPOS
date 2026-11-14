import {escapeHTML as e} from './core.js';
import {recordChecklist,refreshWeekly} from './engagement.js';
import {celebrate} from './motion.js';

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
function progress(checked){return `${checked.filter(Boolean).length} of ${habits.length} actions completed today${checked.every(Boolean)?' · Ready for today':''}`;}
export function updateHabit(input){
  const panel=input.closest('.daily-panel');
  if(panel.dataset.day!==localDay()){
    panel.outerHTML=checklist();
    document.querySelector('#daily-progress').textContent='A new day has started. Choose your reminders for today.';
    return;
  }
  try{
    const daily=readDaily(),index=Number(input.dataset.habit),previous=JSON.parse(localStorage.getItem(checklistKey)||'null');
    daily.checked[index]=input.checked;
    localStorage.setItem(checklistKey,JSON.stringify(daily));
    document.querySelector('#daily-progress').textContent=progress(daily.checked);
    const wasAll=previous?.day===daily.day&&Array.isArray(previous.checked)&&previous.checked.length===habits.length&&previous.checked.every(v=>v===true);
    if(daily.checked.every(Boolean)&&!wasAll)celebrate();
    try{recordChecklist(daily.checked,previous);refreshWeekly();}catch{document.querySelector('#daily-progress').append(' · Checklist saved, but weekly history could not be updated.');}
  }catch{
    input.checked=!input.checked;
    document.querySelector('#daily-progress').textContent='Could not save your change. Browser storage may be unavailable. Try again.';
  }
}

export const questionBank=[
  {title:'A clean, dry paper wrapper',correct:0,explanation:'Clean, dry, nonhazardous paper can be stored briefly in an optional dry-waste pouch, then taken to an approved recycling or disposal arrangement.',guide:'carry'},
  {title:'Leftover food from lunch',correct:1,explanation:'Food scraps do not belong in a dry-waste pouch. Ask school staff for the approved handling procedure.',guide:'classify'},
  {title:'A broken piece of glass',correct:1,explanation:'Do not touch, collect, or store sharp waste. Inform authorized school staff.',guide:'classify'},
  {title:'A clean, dry snack wrapper',correct:0,explanation:'Only clean, dry, nonhazardous wrappers can be stored briefly in a dry-waste pouch before authorized disposal.',guide:'carry'},
  {title:'A used tissue after lunch',correct:1,explanation:'Used tissues and hygiene waste stay out of a dry-waste pouch. Follow school-approved sanitary procedures.',guide:'classify'},
  {title:'An empty, clean, dry bottle',correct:0,explanation:'Reuse where practical. Otherwise take it to an approved recycling or disposal arrangement.',guide:'reuse'},
  {title:'A wrapper with wet food on it',correct:1,explanation:'Wet or contaminated items are unsuitable for a dry-waste pouch. Ask staff for approved handling.',guide:'classify'},
  {title:'Clean, dry notebook paper',correct:0,explanation:'Reuse clean paper where practical. Keep it dry and use an approved recycling or disposal arrangement.',guide:'reuse'},
  {title:'An unknown chemical container',correct:1,explanation:'Do not touch, collect, or store chemical waste. Inform authorized school staff.',guide:'classify'},
];
const quizKey='hipos.quiz.v2';
let session=null,quizError='';
export function makeSession(previous=[],random=Math.random){
  let ids=questionBank.map((_,i)=>i);
  for(let i=ids.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[ids[i],ids[j]]=[ids[j],ids[i]];}
  // Prefer fresh questions; the bank has enough for consecutive nonoverlapping sets.
  ids=[...ids.filter(id=>!previous.includes(id)),...ids.filter(id=>previous.includes(id))].slice(0,3);
  return {ids,answers:[],position:0};
}
export function validSession(s){
  return s&&Array.isArray(s.ids)&&s.ids.length===3&&new Set(s.ids).size===3&&s.ids.every(id=>Number.isInteger(id)&&id>=0&&id<questionBank.length)&&Array.isArray(s.answers)&&s.answers.length<=3&&s.answers.every(a=>a===0||a===1)&&Number.isInteger(s.position)&&s.position>=0&&s.position<=3&&(s.position===3?s.answers.length===3:s.answers.length===s.position||s.answers.length===s.position+1);
}
function saveQuiz(){
  try{localStorage.setItem(quizKey,JSON.stringify(session));quizError='';}catch{quizError='Quiz progress could not be saved. You can continue, but reloading may lose it.';}
}
function loadQuiz(){
  if(session)return;
  try{const saved=JSON.parse(localStorage.getItem(quizKey)||'null');session=validSession(saved)?saved:makeSession();if(!validSession(saved))saveQuiz();}
  catch{session=makeSession();quizError='Quiz progress could not be read. A new quiz is available.';}
}
function score(){return session.answers.reduce((total,answer,i)=>total+Number(answer===questionBank[session.ids[i]].correct),0);}
export function quiz(){
  loadQuiz();
  return `<section class="quiz-panel card" aria-labelledby="quiz-heading"><h2 id="quiz-heading">A quick sorting check</h2><p>Three questions. Learn why each item belongs where it does.</p><div id="quiz-content">${quizContent()}</div><p id="quiz-storage" role="status">${e(quizError)}</p></section>`;
}
function quizContent(){
  if(session.position===3)return `<h3 tabindex="-1" id="quiz-summary">${score()} of 3 correct</h3><p>Clean, dry and nonhazardous only. Ask authorized staff about unsuitable waste.</p><p>Keep learning with the handling guide.</p><a class="button-link secondary" href="#${questionBank[session.ids[0]].guide}">Review a related guide</a><div class="actions"><button data-quiz-restart>Try again</button></div>`;
  const q=questionBank[session.ids[session.position]],answered=session.answers.length>session.position;
  return `<p class="quiz-step">Question ${session.position+1} of 3</p><h3 id="quiz-question" tabindex="-1">${e(q.title)}</h3><div class="quiz-options" role="group" aria-labelledby="quiz-question"><button class="secondary" data-answer="0" ${answered?'disabled':''}>Suitable if clean and dry</button><button class="secondary" data-answer="1" ${answered?'disabled':''}>Keep out of the pouch</button></div><div id="quiz-feedback" role="status" aria-live="polite" aria-atomic="true">${answered?answerFeedback(q):''}</div><button data-quiz-next ${answered?'':'hidden'}>${session.position===2?'See results':'Next question'}</button>`;
}
function answerFeedback(q){return `<p><strong>${session.answers[session.position]===q.correct?'Correct.':'Let’s check that.'}</strong> ${e(q.explanation)}</p>`;}
export function answerQuiz(button){
  if(session.position===3||session.answers.length>session.position)return;
  const answer=Number(button.dataset.answer);if(answer!==0&&answer!==1)return;
  session.answers.push(answer);saveQuiz();
  document.querySelectorAll('[data-answer]').forEach(el=>{el.disabled=true;});
  document.querySelector('#quiz-feedback').innerHTML=answerFeedback(questionBank[session.ids[session.position]]);
  document.querySelector('[data-quiz-next]').hidden=false;
  document.querySelector('#quiz-storage').textContent=quizError;
}
export function nextQuestion(){
  if(session.position===3||session.answers.length<=session.position)return;
  session.position++;saveQuiz();
  document.querySelector('#quiz-content').innerHTML=quizContent();
  document.querySelector('#quiz-storage').textContent=quizError;
  document.querySelector(session.position===3?'#quiz-summary':'#quiz-question').focus();
}
export function restartQuiz(){
  session=makeSession(session?.ids);saveQuiz();
  document.querySelector('.quiz-panel').outerHTML=quiz();document.querySelector('#quiz-question').focus();
}
