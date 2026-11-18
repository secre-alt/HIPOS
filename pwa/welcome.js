// First-run welcome: three short, skippable steps (buddy, language, first activity).
// It appears once per device. Everything stays in this browser.
import {CHARACTERS,isLocked,renderAvatar,currentConfig,setAvatar,saveNickname,refreshAvatars} from './avatar.js';

export const WELCOME_KEY='hipos.welcome.v1';

// New users only: anyone who already has buddy activity, or has seen this before, is never interrupted.
// Automated browsers skip it unless the key is set to "force", so existing checks are not blocked.
export function needsWelcome(storage,webdriver=false){
  try{
    const seen=storage.getItem(WELCOME_KEY);
    if(seen==='force')return true;
    if(seen||webdriver)return false;
    if(storage.getItem('hipos.buddy.daily')||storage.getItem('hipos.buddy.v1')||storage.getItem('hipos.avatar.v1'))return false;
    storage.setItem(WELCOME_KEY,'1');
    return true;
  }catch{return false;}
}
export function markWelcomeDone(storage){try{storage.setItem(WELCOME_KEY,'done');}catch{/* the intro simply may show again */}}

const STEPS=3;
export function showWelcome({doc=document,storage=localStorage}={}){
  if(doc.querySelector('dialog.welcome'))return;
  const dialog=doc.createElement('dialog');
  dialog.className='sort-answer-panel welcome';dialog.setAttribute('aria-labelledby','welcome-title');
  const open=CHARACTERS.filter(c=>!isLocked(c)).slice(0,4);
  let step=0,character=currentConfig().character;
  const chip=c=>`<button type="button" class="buddy-chip secondary" data-welcome-buddy="${c.id}" aria-pressed="${c.id===character}">${renderAvatar({...currentConfig(),character:c.id,color:0,accessory:'none'},{size:64,decorative:true})}<span>${c.name}</span></button>`;
  const lang=()=>doc.documentElement.lang==='fil'?'fil':'en';
  const panels=[
    ()=>`<h2 id="welcome-title">Meet your buddy</h2><p>Pick a friend to cheer you on. You can change this any time in My buddy.</p><div class="buddy-row welcome-buddies">${open.map(chip).join('')}</div><label for="welcome-name">Give your buddy a name (optional)</label><input id="welcome-name" type="text" maxlength="24" autocomplete="off" placeholder="e.g. Luna">`,
    ()=>`<h2 id="welcome-title">Choose your language</h2><p>You can switch any time in Settings.</p><div class="actions welcome-langs"><button type="button" class="secondary" data-welcome-lang="en" aria-pressed="${lang()==='en'}">English</button><button type="button" class="secondary" data-welcome-lang="fil" aria-pressed="${lang()==='fil'}">Filipino</button></div>`,
    ()=>`<h2 id="welcome-title">Try one small thing</h2><p>Everything is optional. Pick what sounds fun.</p><div class="welcome-start"><a class="button-link" href="#classify" data-welcome-go>Check what an item is</a><a class="button-link secondary" href="#sort" data-welcome-go>Play the sorting game</a><a class="button-link secondary" href="#home" data-welcome-go data-welcome-daily>Start my daily habits</a></div>`,
  ];
  const paint=()=>{
    dialog.innerHTML=`<button type="button" class="secondary sort-modal-close" data-welcome-skip aria-label="Skip intro">&times;</button><p class="welcome-step"><span>Step</span> <span data-no-translate>${step+1}</span> <span>of</span> <span data-no-translate>${STEPS}</span></p><div class="welcome-body">${panels[step]()}</div><div class="actions welcome-actions">${step>0?'<button type="button" class="secondary" data-welcome-back>Back</button>':''}<button type="button" class="secondary" data-welcome-skip>Skip intro</button>${step<STEPS-1?'<button type="button" data-welcome-next>Next</button>':''}</div>`;
    if(dialog.open)focusFirst();
  };
  const focusFirst=()=>(dialog.querySelector('.welcome-body input, .welcome-body button, .welcome-body a')||dialog.querySelector('[data-welcome-next]'))?.focus({preventScroll:true});
  const saveStep=()=>{
    if(step===0){
      const name=dialog.querySelector('#welcome-name');
      if(name?.value.trim())saveNickname(name.value);
      setAvatar({...currentConfig(),character,color:0});refreshAvatars();
    }
  };
  const finish=()=>{if(dialog.open)dialog.close();};
  dialog.addEventListener('click',event=>{
    const t=event.target.closest('button,a');if(!t)return;
    if(t.dataset.welcomeBuddy){character=t.dataset.welcomeBuddy;dialog.querySelectorAll('[data-welcome-buddy]').forEach(b=>b.setAttribute('aria-pressed',String(b===t)));}
    else if(t.dataset.welcomeLang){const select=doc.querySelector('#language');if(select){select.value=t.dataset.welcomeLang;select.dispatchEvent(new Event('change',{bubbles:true}));}paint();dialog.querySelector(`[data-welcome-lang="${t.dataset.welcomeLang}"]`)?.focus({preventScroll:true});}
    else if(t.hasAttribute('data-welcome-next')){saveStep();step++;paint();}
    else if(t.hasAttribute('data-welcome-back')){saveStep();step--;paint();}
    else if(t.hasAttribute('data-welcome-skip')){saveStep();finish();}
    else if(t.hasAttribute('data-welcome-go')){saveStep();if(t.hasAttribute('data-welcome-daily'))setTimeout(()=>doc.querySelector('#daily-heading')?.scrollIntoView({block:'center'}),150);finish();}
  });
  dialog.addEventListener('close',()=>{markWelcomeDone(storage);dialog.remove();});
  doc.body.append(dialog);paint();
  if(typeof dialog.showModal==='function')dialog.showModal();else dialog.setAttribute('open','');
  focusFirst();
}
