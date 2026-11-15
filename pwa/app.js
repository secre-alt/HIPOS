import {initLanguage,translate} from './i18n.js';
import {updateChallenge,rememberGuide,dailyChallenge,refreshWeekly,weekSummary} from './engagement.js';
import {weekCardBlob} from './summary-card.js';
import {initTextSize} from './textsize.js';
import {avatarEditor,avatarClick,refreshAvatars,syncUnlocks} from './avatar.js';
import {buddySay,tapBuddy,applyMood,animate,sparkle,buzz,sound,giveTreat,syncStickers,earnedKeys,stats,stickerBook,initBuddySettings} from './buddy-fx.js';
import {sortGame,fitGame,sortClick,sortPointerDown,sortPointerMove,sortPointerUp} from './sortgame.js';
import {answerQuiz,nextQuestion,restartQuiz,updateHabit,localDay,checklist} from './activities.js';
import {home,selectWaste,reuseArt,wasteArt} from './home.js';
import {revealOnScroll,initScrollEffects} from './motion.js';
import {guideTools,guideCards,setGuideFilter,applyGuideFilter} from './guide.js';
import QRCode from 'qrcode';
import jsQR from 'jsqr';
import {categories,areas,statuses,decodeReport,createReport,addImport,escapeHTML as e,pinHash,buildBackup,parseBackup,reportsToCsv} from './core.js';
import {prevention,reuse,waste} from './content.js';

const view=document.querySelector('#view'),dialog=document.querySelector('#dialog');
const links=[['home','Home'],['prevent','Prevent'],['reuse','Reuse'],['classify','Classify'],['carry','Carry out'],['reports','My reports'],['staff','Staff review']];
const KEY='hipos.pwa.v1';
let data={reports:[],imports:[],pin:null},unlocked=false,pending=null,stream=null,cameraToken=0,installPrompt=null,offlineReady=false,busy=false,unlockAttempts=0,unlockAfter=0;
try{const saved=JSON.parse(localStorage.getItem(KEY)||'null');if(saved){if(!Array.isArray(saved.reports)||!Array.isArray(saved.imports))throw Error();data=saved;}}catch{message('Saved data could not be read. Reload or restore your browser storage before saving more reports.');busy=true;}
function message(text){document.querySelector('#notice').textContent=text;}
// Buddy extras are cosmetic rewards for activity already recorded on this device. Once unlocked they stay unlocked.
function summaryNow(){const week=weekSummary();return {...week,extra:[...earnedKeys(week),...stats().seasons.map(key=>'season-'+key)]};}
function checkBuddyUnlocks(announce=false){
  try{
    const sum=summaryNow(),fresh=syncUnlocks(sum),stickers=syncStickers(sum);applyMood(sum);
    if(!announce)return;
    if(stickers.length){buddySay(`New sticker: ${stickers.map(t=>t.name).join(', ')}!`,{delay:2200});setTimeout(()=>sound('tada'),2200);}
    if(fresh.length)message(`New buddy extra unlocked: ${fresh.map(a=>a.name).join(', ')}. Open My buddy to try it.`);
  }catch{/* activity history unavailable: nothing to unlock */}
}
const HABIT_LINES=['Bottle packed. Nice!','Lunchbox ready. Yay!','Reusable utensils. Great choice!'];
const HABIT_FED=['Yum! Bottle packed. Thanks for the treat!','Yum! Lunchbox ready. Thanks for the treat!','Yum! Reusable utensils. Thanks for the treat!'];
function onHabit(input){
  if(!input.checked)return;
  const index=Number(input.dataset.habit),fed=giveTreat(index,localDay()),all=[...document.querySelectorAll('[data-habit]')].every(x=>x.checked);
  sparkle(input,6);buzz(12);animate('hop');sound(all?'tada':'pop');
  buddySay(all?'All three done! You are a hero!':fed?HABIT_FED[index]:HABIT_LINES[index]);
  const treats=document.querySelector('.buddy-treats');if(treats)treats.textContent=`Treats shared: ${stats().treats}`;
}
function onChallenge(state){
  if(state==='done'){buddySay('Challenge complete! You are amazing!');animate('spin');sound('tada');buzz(20);}
  else if(state==='skipped')buddySay('That is okay. See you tomorrow!');
}
function onAnswer(){
  const right=document.querySelector('#quiz-feedback strong')?.textContent==='Correct.';
  buddySay(right?'Correct! Great sorting!':'Almost! Read the tip.');sound(right?'pop':'oops');if(right){buzz(10);animate('hop');}
}
function onWaste(button){
  const item=waste[Number(button.dataset.waste)];if(!item)return;
  buddySay(item[1]?'Nice! Keep it clean and dry.':'Careful! Ask school staff for this one.');animate('hop');sound('boop');
}
const PAGE_LINES={classify:'Let us sort it out!',sort:'Ready to sort? Let us play!',reuse:'Reuse is the best!',prevent:'Less waste starts here!',carry:'Clean and dry only. Remember?',avatar:'Ooh, make me look great!'};
const greeted=new Set();let firstRender=true;
function save(next){try{localStorage.setItem(KEY,JSON.stringify(next));data=next;}catch{throw Error('Could not save. Browser storage may be full or disabled. Your change was not saved.');}}
const card=(title,body,note='')=>`<article class="card"><h3>${e(title)}</h3>${body.startsWith('Requires school approval')?'<span class="approval-label">Requires school approval</span>':''}<p>${e(body)}</p>${note?`<p class="note">${e(note)}</p>`:''}</article>`;
const build=typeof __HIPOS_BUILD__!=='undefined'?__HIPOS_BUILD__:{version:'dev',date:''};
const noStaffFilter=()=>({status:'',category:'',area:''});
let staffFilter=noStaffFilter();
const staffRows=()=>data.imports.filter(r=>(!staffFilter.status||r.status===staffFilter.status)&&(!staffFilter.category||r.category===staffFilter.category)&&(!staffFilter.area||r.area===staffFilter.area));
const staffListHTML=()=>staffRows().map(r=>reportCard(r,true)).join('')||(data.imports.length?'<p class="empty">No reports match these filters.</p>':'<p class="empty">No reports imported. Scan a student’s QR to get started.</p>');
const staffCountText=()=>`Showing ${staffRows().length} of ${data.imports.length} ${data.imports.length===1?'report':'reports'}`;
const filterSelect=(key,label,all,values)=>`<div><label for="filter-${key}">${label}</label><select id="filter-${key}" data-filter="${key}"><option value="">${all}</option>${values.map(v=>`<option value="${e(v)}"${staffFilter[key]===v?' selected':''}>${e(v)}</option>`).join('')}</select></div>`;
const staffFilters=()=>`<section class="staff-filters" aria-labelledby="filter-heading"><h2 id="filter-heading">Filter reports</h2><div class="filter-grid">${filterSelect('status','Status','All statuses',statuses)}${filterSelect('category','Category','All categories',categories)}${filterSelect('area','School area','All areas',areas)}</div><p id="staff-count" class="note" role="status" aria-live="polite">${staffCountText()}</p><div class="actions"><button class="secondary" data-action="clear-filters">Clear filters</button></div><p class="note">Exports the reports shown. The file is not encrypted.</p></section>`;
function updateStaffList(){const list=document.querySelector('#staff-list'),count=document.querySelector('#staff-count');if(list)list.innerHTML=staffListHTML();if(count)count.textContent=staffCountText();}
async function exportCsv(){
  if(!unlocked)return;
  const rows=staffRows();
  if(!rows.length){message('No reports to export.');return;}
  const file=new File([reportsToCsv(rows)],`hipos-reports-${localDay()}.csv`,{type:'text/csv'});
  if(await deliverFile(file,'HIPOS reports'))message('CSV file created.');
}
const backupCard=()=>`<section class="card backup-card" aria-labelledby="backup-heading"><h2 id="backup-heading">Back up and restore</h2><p>Save your reports to a file, or load them back after clearing browser data. The file is not encrypted. Keep it private.</p><p class="note" id="storage-status" role="status"></p><div class="actions"><button class="secondary" data-action="backup">Download backup</button><button class="secondary" data-action="restore">Restore from backup</button></div><input id="restore-file" type="file" accept="application/json,.json" hidden></section>`;
let persistAsked=false;
function requestPersistence(){if(persistAsked)return;persistAsked=true;try{Promise.resolve(navigator.storage?.persist?.()).then(updateStorageStatus).catch(()=>{});}catch{/* best effort */}}
async function updateStorageStatus(){
  const el=document.querySelector('#storage-status');if(!el)return;
  let text='Storage protection can’t be checked in this browser. Back up to be safe.';
  try{if(navigator.storage?.persisted)text=(await navigator.storage.persisted())?'Storage protection is on. Your browser should keep your reports unless you clear site data.':'Storage protection is off. Your browser may clear your reports when space runs low. Back up to be safe.';}catch{/* keep the fallback text */}
  el.textContent=text;
}
async function backupReports(){
  const backup=buildBackup(data.reports);
  if(!backup.reports.length){message('No reports to back up yet.');return;}
  const file=new File([JSON.stringify(backup,null,2)],`hipos-backup-${localDay()}.json`,{type:'application/json'});
  if(await deliverFile(file,'HIPOS backup'))message('Backup file created.');
}
// On phones the share sheet lets people save straight to Files / Drive; elsewhere it is a normal download.
// Returns false when the person closed the share sheet without saving.
async function deliverFile(file,title){
  if(matchMedia('(pointer: coarse)').matches&&navigator.canShare?.({files:[file]})){
    try{await navigator.share({files:[file],title});return true;}catch(err){if(err?.name==='AbortError')return false;}
  }
  const url=URL.createObjectURL(file),a=document.createElement('a');a.href=url;a.download=file.name;document.body.append(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),10000);
  return true;
}
async function shareWeek(){
  try{
    const blob=await weekCardBlob(weekSummary());
    if(await deliverFile(new File([blob],`hipos-week-${localDay()}.png`,{type:'image/png'}),'My week with HIPOS'))message('Your week image is ready.');
  }catch{message('Could not create the image. Try again.');}
}
async function restoreReports(file){
  if(!file)return;
  if(file.size>1000000)throw Error('That file is not a HIPOS backup.');
  const result=parseBackup(await file.text(),data.reports);
  if(!result.added){message(result.duplicate||result.invalid?`Restored 0 reports.${result.duplicate?` ${result.duplicate} already on this device.`:''}${result.invalid?` ${result.invalid} could not be read.`:''}`:'No new reports found in that file.');return;}
  save({...data,reports:result.reports});requestPersistence();render();
  message(`Restored ${result.added} ${result.added===1?'report':'reports'}.${result.duplicate?` ${result.duplicate} already on this device.`:''}${result.invalid?` ${result.invalid} could not be read.`:''}`);
}
const versionCard=()=>`<article class="card version-card"><h3>App version</h3><p>HIPOS checks for updates each time you open it online. You can also check now.</p><p class="note" data-no-translate>Version ${e(build.version)}${build.date?' · '+e(build.date):''}</p><div class="actions"><button class="secondary" data-action="check-update">Check for updates</button></div></article>`;
const intro=(title,body)=>`<section class="intro"><h1>${title}</h1><p>${body}</p></section>`;
const options=items=>items.map(s=>`<option>${e(s)}</option>`).join('');
const date=t=>new Date(t).toLocaleDateString(undefined,{year:'numeric',month:'short',day:'numeric'});
function current(){const p=location.hash.slice(1)||'home';return [...links.map(x=>x[0]),'privacy','avatar','sort'].includes(p)?p:'home';}
function stopCamera(){cameraToken++;stream?.getTracks().forEach(t=>t.stop());stream=null;}
dialog.addEventListener('close',stopCamera);
function modal(html){stopCamera();document.querySelector('#dialog-body').innerHTML=html;if(!dialog.open)dialog.showModal();}
function reportCard(r,staff=false){return `<article class="card"><span class="pill">${e(staff?r.status:r.category)}</span><h3>${e(staff?r.category:r.area)}</h3><p class="report-description">${e(r.description)}</p><small>${e(r.area)} · ${e(date(r.createdAt))}</small><div class="actions">${staff?`<label>Status<select data-status="${e(r.id)}" aria-label="Status for ${e(r.description)}">${statuses.map(s=>`<option ${s===r.status?'selected':''}>${s}</option>`).join('')}</select></label>`:`<button class="secondary" data-qr="${e(r.id)}">Show QR</button>`}<button class="danger" data-delete="${e(r.id)}" data-staff="${staff}">Delete</button></div></article>`;}
function render(){if(!busy)message('');document.querySelector('#menu-toggle').setAttribute('aria-expanded','false');stopCamera();if(dialog.open)dialog.close();pending=null;const page=current();rememberGuide(page);checkBuddyUnlocks();refreshAvatars();document.querySelectorAll('.mobile-bottom-nav a').forEach(a=>{if(a.hash==='#'+page)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});document.querySelector('#nav').innerHTML=links.map(([id,label])=>`<a href="#${id}" ${id===page?'class="active" aria-current="page"':''}>${label}</a>`).join('');document.querySelector('#page-label').textContent=page==='home'?'Your daily guide':page==='avatar'?'My buddy':page==='sort'?'Sorting game':links.find(x=>x[0]===page)?.[1]||'About HIPOS';
if(page==='home')view.innerHTML=home();
if(page==='prevent')view.innerHTML=intro('Prevent it before it starts.','A little planning keeps packaging out of your school day.')+prevention.map(x=>card(...x)).join('');
if(page==='reuse')view.innerHTML=intro('Use it. Wash it. Use it again.','Personal reusables work best when school rules and safe washing come first.')+reuse.map((x,i)=>card(...x).replace('<h3>',reuseArt(i)+'<h3>')).join('');
if(page==='classify')view.innerHTML=intro('Know what you’re carrying.','Only clean, dry, nonhazardous waste belongs in a dry-waste pouch.')+'<p class="sort-promo"><a class="button-link secondary" href="#sort">Play the sorting game →</a></p>'+guideTools()+guideCards();
if(page==='carry')view.innerHTML=intro('Carry out with care','A pouch is optional. Safe handling always comes first.')+`<ol class="carry-steps"><li class="card"><div class="step-heading"><span aria-hidden="true">1</span><h2>Prevent before buying</h2></div><p>Choose less packaging where practical and buy only what you need.</p></li><li class="card"><div class="step-heading"><span aria-hidden="true">2</span><h2>Keep reusables separate</h2></div><p>Bring clean reusable containers where permitted. Keep food containers separate from waste.</p></li><li class="card"><div class="step-heading"><span aria-hidden="true">3</span><h2>Carry clean, dry waste only</h2></div><span class="pill">Clean, dry and nonhazardous only</span><p>Use a suitable existing container or an optional dry-waste pouch. Carry the waste to a lawful, approved off-campus arrangement.</p><p>Not sure what is safe to carry?</p><a class="button-link secondary" href="#classify">Check Waste Type</a></li><li class="card unsuitable-step"><div class="step-heading"><span aria-hidden="true">4</span><h2>Ask staff about unsuitable waste</h2></div><span class="pill unsafe">Keep out of your pouch or bag</span><p>Do not store wet, sanitary, sharp, chemical, or contaminated items. Do not handle hazardous waste. Follow staff-approved procedures.</p></li></ol>`;
if(page==='reports')view.innerHTML=intro('Your concerns, on your terms.','Reports stay in this browser. Showing a QR is voluntary and does not automatically submit anything.')+`<form id="report-form" class="card"><h2>Record a concern</h2><p class="muted">Use fictional examples for this prototype. Leave out names and identifying details.</p><div class="form-grid"><div><label for="category">Category</label><select id="category" name="category">${options(categories)}</select></div><div><label for="area">School area</label><select id="area" name="area">${options(areas)}</select></div></div><label for="description">What needs attention?</label><textarea id="description" name="description" aria-describedby="description-help" required minlength="5" maxlength="160" placeholder="Describe the issue without identifying anyone."></textarea><small id="description-help">5–160 characters; up to 300 UTF-8 bytes.</small><div class="actions"><button ${busy?'disabled':''}>Save on this device</button></div></form><h2>Saved reports (${data.reports.length})</h2>${data.reports.map(r=>reportCard(r)).join('')||'<section class="card empty-state"><h3>No reports saved on this device</h3><p>Noticed unclear guidance or unsafe waste? Write a concern above. It stays here until you choose to show its QR to staff.</p><button class="secondary" data-action="write-report">Write your first concern</button></section>'}${backupCard()}`;
if(!unlocked||page!=='staff')staffFilter=noStaffFilter();
if(page==='staff'){if(!unlocked)view.innerHTML=intro('Staff review','Import and review reports on this device.')+`<form id="pin-form" class="card"><h2>${data.pin?'Unlock this device':'Set a local staff PIN'}</h2><p>A local PIN helps keep the review screen private. It does not verify school employment or encrypt browser storage.</p><label for="pin">${data.pin?'PIN':'Choose a PIN (6–12 digits)'}</label><input id="pin" name="pin" type="password" inputmode="numeric" pattern="[0-9]{6,12}" minlength="6" maxlength="12" autocomplete="${data.pin?'current-password':'new-password'}" required>${data.pin?'':'<label for="confirm">Confirm PIN</label><input id="confirm" name="confirm" type="password" inputmode="numeric" pattern="[0-9]{6,12}" autocomplete="new-password" required>'}<div class="actions"><button ${busy?'disabled':''}>${data.pin?'Unlock':'Set PIN and continue'}</button></div></form>`;
else view.innerHTML=intro('A clearer picture.','Review each concern before adding it to this device.')+`<div class="actions"><button data-action="scan">Scan report QR</button><button class="secondary" data-action="manual">Paste transfer text</button>${data.imports.length?'<button class="secondary" data-action="export-csv">Export CSV</button>':''}<button class="secondary" data-action="lock">Lock staff area</button></div><div class="stats">${statuses.map(s=>`<div><strong>${data.imports.filter(r=>r.status===s).length}</strong><span>${s}</span></div>`).join('')}</div>${data.imports.length?staffFilters():''}<div id="staff-list">${staffListHTML()}</div>`;}
if(page==='avatar')view.innerHTML=intro('Meet your buddy.','Pick a character and make it yours. Your buddy stays on this device and is never part of a report.')+avatarEditor()+stickerBook();
if(page==='sort')view.innerHTML=intro('Sorting game','A quick, friendly game. Nothing is graded or sent anywhere.')+sortGame();
if(page==='privacy')view.innerHTML=intro('Private by choice. Local by default.','HIPOS is an offline-first school project prototype.')+card('Offline access','Open once online and wait for “Ready offline”. Install from the browser menu or the Install app button. On iPhone or iPad, use Safari → Share → Add to Home Screen. The first visit needs a connection; later visits use cached files.')+card('Storage and sharing','Reports and the staff PIN verifier are stored only in this browser, on this origin. Browser data can be cleared or evicted. Reports do not sync between devices. QR data is readable by anyone who scans it and is not encrypted. Back up important fictional test reports with transfer text.')+card('Your activity on this device','Daily reminders, challenges, quiz progress, recent guides, your buddy, and language choice are saved in this browser. Older weekly history is removed when you save new activity. These records are not sent to a server or shared through report QR codes. Browser storage may be cleared or unavailable.')+card('Staff access','The local PIN is a convenience lock, not school authentication. It does not encrypt stored reports. Staff mode locks when the app is hidden. Use only fictional data for testing.')+card('Permissions','The camera is used only when you start scanning. Frames are processed on this device and not uploaded. Denying permission leaves manual text import available.')+card('Moving from Android','The PWA does not automatically access an Android app’s SQLite database. HIPOS1 QR reports can be transferred individually. There is no server or automatic submission.')+card('Installation and hosting','Installation, camera access, and offline caching require HTTPS in production. Localhost is suitable for development. Use the same web address to keep access to your saved records.')+versionCard();
revealOnScroll();if(page==='reports')updateStorageStatus();
view.classList.remove('page-in');void view.offsetWidth;view.classList.add('page-in');
if(page==='sort')fitGame();
checkBuddyUnlocks();
if(!firstRender&&PAGE_LINES[page]&&!greeted.has(page)){greeted.add(page);buddySay(PAGE_LINES[page]);animate('hop');}
firstRender=false;
}
function previewImport(raw){if(!unlocked)throw Error('Unlock staff review first.');const report=decodeReport(raw);if(data.imports.some(r=>r.id===report.id))throw Error('This report has already been imported.');pending=report;modal(`<h2>Review before importing</h2><span class="pill">${e(report.category)}</span><p class="report-description">${e(report.description)}</p><p>${e(report.area)} · ${e(date(report.createdAt))}</p><p class="note">Confirm to save a copy on this device.</p><button data-action="confirm-import">Confirm import</button>`);}
async function showQR(id){
  const report=data.reports.find(r=>r.id===id);if(!report)return;
  const raw=JSON.stringify(decodeReport(JSON.stringify(report)));
  modal('<h2 id="qr-title">Preparing QR…</h2><p>Show this to staff when you choose. It has not been received or imported yet.</p><canvas id="qr" class="qr" aria-label="HIPOS report QR code" hidden></canvas><p class="note">Anyone who scans this code can read its contents.</p><label for="transfer">Transfer text (alternative to scanning)</label><textarea id="transfer" readonly></textarea>');
  const canvas=document.querySelector('#qr');document.querySelector('#transfer').value=raw;
  await QRCode.toCanvas(canvas,raw,{width:840,margin:4,errorCorrectionLevel:'M'});
  if(canvas.isConnected&&dialog.open){canvas.hidden=false;document.querySelector('#qr-title').textContent='QR ready to show';}
}
function manualImport(){
  pending=null;
  modal('<h2>Paste a HIPOS report</h2><p>Ask the student to open Show QR and copy the transfer text below their code. Nothing is imported until you confirm.</p><form id="import-form"><label for="raw">Transfer text</label><textarea id="raw" name="raw" maxlength="650" aria-describedby="dialog-error" required></textarea><div id="dialog-error" role="alert" hidden></div><button>Review report</button></form>');
}
function showImportError(error){
  pending=null;
  const duplicate=error.message==='This report has already been imported.';
  const heading=duplicate?'Already on this device':'This QR is not a valid HIPOS report';
  const detail=duplicate?'This report has already been imported. Close this dialog to review the saved copy.':'Nothing was imported. Ask the student to show the QR from My reports, or copy its complete transfer text. '+(error instanceof SyntaxError?'The transfer text is incomplete or not valid JSON.':error.message);
  const target=document.querySelector('#dialog-error')||document.querySelector('#camera-status');
  if(target){target.hidden=false;target.className='feedback error-feedback';target.setAttribute('role','alert');target.innerHTML='<strong>'+e(heading)+'</strong><p>'+e(detail)+'</p>';}
}
async function scan(){if(!unlocked)return;modal('<h2>Scan a student report</h2><p>Keep the QR inside the camera view.</p><video id="camera" autoplay playsinline muted></video><div id="camera-status" role="status">Requesting camera access…</div><div class="actions"><button class="secondary" data-action="manual">Paste transfer text instead</button></div>');const token=cameraToken;
try{if(!navigator.mediaDevices?.getUserMedia)throw Error('Camera unavailable. Use HTTPS and allow camera access, or paste transfer text.');const acquired=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'},width:{ideal:960}},audio:false});if(token!==cameraToken||!unlocked){acquired.getTracks().forEach(t=>t.stop());return;}stream=acquired;const video=document.querySelector('#camera');video.srcObject=stream;await video.play();document.querySelector('#camera-status').textContent='Scanning on this device. No images are uploaded.';const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d',{willReadFrequently:true});let last=0,lastRejected='';function frame(now){if(token!==cameraToken)return;if(now-last>180&&video.readyState>=2){last=now;canvas.width=Math.min(video.videoWidth,960);canvas.height=Math.round(video.videoHeight*canvas.width/video.videoWidth);ctx.drawImage(video,0,0,canvas.width,canvas.height);const pixels=ctx.getImageData(0,0,canvas.width,canvas.height),code=jsQR(pixels.data,pixels.width,pixels.height);if(code&&code.data!==lastRejected){try{previewImport(code.data);return;}catch(err){lastRejected=code.data;showImportError(err);}}}requestAnimationFrame(frame);}requestAnimationFrame(frame);
}catch(err){if(token===cameraToken){stopCamera();const denied=err.name==='NotAllowedError'||err.name==='PermissionDeniedError';modal('<h2>'+(denied?'Camera permission is off':'Camera unavailable')+'</h2><div class="feedback"><p>'+(denied?'Allow camera access for HIPOS in your browser’s site settings, then try again.':'Could not start the camera. Close any other camera app and try again. Camera scanning needs HTTPS or localhost.')+'</p><p>You can still import offline. Ask the student for the transfer text below their QR code, then paste it here.</p></div><div class="actions"><button data-action="manual">Paste transfer text</button><button class="secondary" data-action="retry-camera">Try camera again</button></div>');}}}
document.addEventListener('submit',async event=>{if(event.target.matches('[method=dialog]'))return;event.preventDefault();try{if(event.target.id==='report-form'){if(busy)throw Error('Storage is unavailable.');const f=new FormData(event.target),report=createReport(f.get('category'),f.get('area'),f.get('description'));save({...data,reports:[report,...data.reports]});requestPersistence();render();message('Saved on this device');document.querySelector('[data-qr]')?.focus();}if(event.target.id==='pin-form'){const button=event.target.querySelector('button');button.disabled=true;try{if(Date.now()<unlockAfter)throw Error('Too many attempts. Wait 30 seconds before trying again.');const f=new FormData(event.target),pin=f.get('pin');if(!/^\d{6,12}$/.test(pin))throw Error('Use a PIN with 6–12 digits.');if(data.pin){const hash=await pinHash(pin,data.pin.salt);if(!hash.every((b,i)=>b===data.pin.hash[i])){if(++unlockAttempts>=5){unlockAfter=Date.now()+30000;unlockAttempts=0;}throw Error('Incorrect PIN.');}}else{if(pin!==f.get('confirm'))throw Error('PINs do not match.');const salt=Array.from(crypto.getRandomValues(new Uint8Array(16)));save({...data,pin:{salt,hash:await pinHash(pin,salt)}});}if(document.hidden)throw Error('Return to the app and unlock again.');unlocked=true;unlockAttempts=0;render();message('Staff review unlocked on this device.');}finally{button.disabled=false;}}if(event.target.id==='import-form'){try{previewImport(new FormData(event.target).get('raw'));}catch(err){showImportError(err);}}}catch(err){message(err.message);if(dialog.open){const error=document.querySelector('#dialog-error');if(error)error.textContent=err.message;}}});
document.addEventListener('click',async event=>{const b=event.target.closest('button');if(!b)return;try{if(b.hasAttribute('data-challenge')){updateChallenge(b);onChallenge(b.dataset.challenge);checkBuddyUnlocks(true);}if(b.hasAttribute('data-answer')){answerQuiz(b);onAnswer();}if(b.hasAttribute('data-quiz-next'))nextQuestion();if(b.hasAttribute('data-quiz-restart'))restartQuiz();if(b.hasAttribute('data-waste')){selectWaste(b);onWaste(b);}if(b.hasAttribute('data-buddy-tap')){tapBuddy(b);checkBuddyUnlocks(true);}if(b.hasAttribute('data-sort-bin')||b.hasAttribute('data-sort-next')||b.hasAttribute('data-sort-again')){const result=sortClick(b);if(result==='finished')checkBuddyUnlocks(true);}if(b.dataset.avatarKey||b.dataset.avatarAction){avatarClick(b);applyMood();if(b.getAttribute('aria-disabled')!=='true'){animate('hop');sound('pop');}}if(b.hasAttribute('data-guide-filter'))setGuideFilter(b);if(b.dataset.qr)await showQR(b.dataset.qr);if(b.dataset.delete){if(b.dataset.staff==='true'&&!unlocked)return;const field=b.dataset.staff==='true'?'imports':'reports';if(confirm(translate('Delete this report from this device?'))){save({...data,[field]:data[field].filter(r=>r.id!==b.dataset.delete)});render();message('Report deleted.');}}switch(b.dataset.action){case'write-report':document.querySelector('#description').focus();document.querySelector('#report-form').scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});break;case'retry-camera':await scan();break;case'lock':unlocked=false;render();break;case'check-update':await manualUpdateCheck();break;case'backup':await backupReports();break;case'export-csv':await exportCsv();break;case'share-week':await shareWeek();break;case'clear-filters':if(unlocked){staffFilter=noStaffFilter();document.querySelectorAll('[data-filter]').forEach(el=>{el.value='';});updateStaffList();}break;case'restore':document.querySelector('#restore-file')?.click();break;case'scan':await scan();break;case'manual':if(unlocked)manualImport();break;case'confirm-import':if(!unlocked||!pending)throw Error('Unlock and scan again.');save({...data,imports:addImport(data.imports,pending)});render();message('Report imported');break;}}catch(err){message(err.message);}});
document.addEventListener('input',event=>{if(event.target.id==='guide-search')applyGuideFilter();});
document.addEventListener('change',event=>{if(event.target.dataset.filter){const key=event.target.dataset.filter,allowed={status:statuses,category:categories,area:areas}[key];if(unlocked&&allowed){staffFilter[key]=allowed.includes(event.target.value)?event.target.value:'';updateStaffList();}return;}if(event.target.id==='restore-file'){const input=event.target,file=input.files[0];input.value='';restoreReports(file).catch(err=>message(err.message));return;}if(event.target.hasAttribute('data-habit')){updateHabit(event.target);onHabit(event.target);checkBuddyUnlocks(true);return;}const id=event.target.dataset.status;if(!id||!unlocked)return;try{const status=event.target.value;if(!statuses.includes(status))return;save({...data,imports:data.imports.map(r=>r.id===id?{...r,status}:r)});render();message('Review status saved.');}catch(err){message(err.message);}});
const settingsDialog=document.querySelector('#settings-dialog');
document.querySelectorAll('.settings-toggle').forEach(button=>button.addEventListener('click',()=>{closeMenu();settingsDialog.showModal();}));
const menuToggle=document.querySelector('#menu-toggle');
function closeMenu(returnFocus=false){
  if(menuToggle.getAttribute('aria-expanded')!=='true')return;
  const focusWasInNav=document.querySelector('#nav').contains(document.activeElement);
  menuToggle.setAttribute('aria-expanded','false');
  if(returnFocus||focusWasInNav)menuToggle.focus({preventScroll:true});
}
menuToggle.addEventListener('click',()=>{menuToggle.setAttribute('aria-expanded',String(menuToggle.getAttribute('aria-expanded')!=='true'));});
// Close on any other tap, including empty space inside the navigation bar.
// Using click lets navigation links complete their normal activation first.
document.addEventListener('click',event=>{if(!event.target.closest('#menu-toggle'))closeMenu();});
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!dialog.open)closeMenu(true);});
window.addEventListener('scroll',()=>closeMenu(),{passive:true,capture:true});
window.addEventListener('wheel',()=>closeMenu(),{passive:true});
window.addEventListener('touchmove',()=>closeMenu(),{passive:true});
window.addEventListener('hashchange',()=>{render();view.focus();window.scrollTo({top:0,behavior:'instant'});if(current()==='sort')fitGame();});
document.addEventListener('visibilitychange',()=>{if(document.hidden){stopCamera();if(unlocked){unlocked=false;render();}}});
window.addEventListener('pagehide',stopCamera);
window.addEventListener('storage',event=>{if(event.key===KEY){unlocked=false;location.reload();}});
function connection(){document.querySelector('#connection').textContent=offlineReady?(navigator.onLine?'Ready offline':'Offline · saved on device'):(navigator.onLine?'Preparing offline access…':'Offline cache not ready');}
window.addEventListener('online',connection);window.addEventListener('offline',connection);
window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();installPrompt=event;});
async function installApp(){if(installPrompt){await installPrompt.prompt();await installPrompt.userChoice;installPrompt=null;}else modal('<h2>Install HIPOS</h2><p>On Chrome or Edge, open the browser menu and choose <strong>Install app</strong> or <strong>Add to Home screen</strong>.</p><p>On iPhone or iPad, open in Safari and choose <strong>Share → Add to Home Screen</strong>.</p><p>Open once online and wait for “Ready offline” before disconnecting.</p>');}
document.querySelector('#install').addEventListener('click',installApp);
document.querySelector('#footer-install').addEventListener('click',installApp);
window.addEventListener('appinstalled',()=>{appInstalled=true;installPrompt=null;updateInstallBanner();message('HIPOS is installed.');});
let appInstalled=false,installDismissed=false;try{installDismissed=sessionStorage.getItem('hipos.install.dismissed')==='true';}catch{}
const standalone=matchMedia('(display-mode: standalone)');
function updateInstallBanner(){const installed=appInstalled||standalone.matches||Boolean(navigator.standalone);document.querySelector('#install-banner').hidden=installDismissed||installed;document.querySelector('#footer-install').hidden=!installDismissed||installed;}
standalone.addEventListener('change',updateInstallBanner);
document.querySelector('#dismiss-install').addEventListener('click',()=>{installDismissed=true;try{sessionStorage.setItem('hipos.install.dismissed','true');}catch{}updateInstallBanner();});
updateInstallBanner();
render();refreshAvatars();connection();initLanguage();initTextSize();initBuddySettings();document.addEventListener('pointerdown',sortPointerDown);document.addEventListener('pointermove',sortPointerMove);document.addEventListener('pointerup',sortPointerUp);document.addEventListener('pointercancel',sortPointerUp);document.querySelector('#splash')?.remove();initScrollEffects();
// Update flow: a new service worker waits until the person taps "Update now" (no surprise reloads
// while they are typing a report). The first install never shows the banner or reloads.
const updateBanner=document.querySelector('#update-banner'),applyUpdate=document.querySelector('#apply-update');
let swRegistration=null,updating=false;
function showUpdate(){if(!updating)updateBanner.hidden=false;}
function trackWorker(worker){worker.addEventListener('statechange',()=>{if(worker.state==='installed'&&navigator.serviceWorker.controller)showUpdate();});}
function watchUpdates(registration){
  swRegistration=registration;
  if(registration.waiting&&navigator.serviceWorker.controller)showUpdate();
  if(registration.installing)trackWorker(registration.installing);
  registration.addEventListener('updatefound',()=>{if(registration.installing)trackWorker(registration.installing);});
}
function checkForUpdate(){if(swRegistration&&navigator.onLine)swRegistration.update().catch(()=>{});}
applyUpdate.addEventListener('click',()=>{
  const waiting=swRegistration?.waiting;
  if(!waiting){location.reload();return;}
  updating=true;applyUpdate.disabled=true;applyUpdate.textContent=translate('Updating…');
  waiting.postMessage({type:'SKIP_WAITING'});
  setTimeout(()=>location.reload(),5000);
});
async function manualUpdateCheck(){
  if(!navigator.onLine){message('Connect to the internet to check for updates.');return;}
  if(!swRegistration){message('Updates are unavailable in this browser.');return;}
  if(swRegistration.waiting){showUpdate();message('An update is ready. Tap Update now.');return;}
  message('Checking for updates…');
  try{await swRegistration.update();}catch{message('Could not check for updates. Try again.');return;}
  message(swRegistration.installing||swRegistration.waiting?'Update found. It will be ready in a moment.':'You have the latest version.');
}
document.querySelector('#dismiss-update').addEventListener('click',()=>{updateBanner.hidden=true;});
if('serviceWorker' in navigator){
  navigator.serviceWorker.addEventListener('controllerchange',()=>{if(updating)location.reload();});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)checkForUpdate();});
  window.addEventListener('online',checkForUpdate);
  setInterval(()=>{if(!document.hidden)checkForUpdate();},30*60*1000);
}
if('serviceWorker' in navigator){navigator.serviceWorker.register('./sw.js').then(registration=>{watchUpdates(registration);checkForUpdate();return navigator.serviceWorker.ready;}).then(()=>{offlineReady=true;connection();}).catch(()=>{document.querySelector('#connection').textContent='Offline setup unavailable';message('Offline setup failed. Use HTTPS or localhost and reload online.');});}else document.querySelector('#connection').textContent='Offline caching unavailable';

function refreshDay(){const panel=document.querySelector('.daily-panel');if(panel&&panel.dataset.day!==localDay()){panel.outerHTML=checklist();refreshWeekly();}const challenge=document.querySelector('.challenge-panel');if(challenge&&challenge.dataset.day!==localDay())challenge.outerHTML=dailyChallenge();}
setInterval(refreshDay,60000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)refreshDay();});
