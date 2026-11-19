// Streaks and badges, computed only from the activity history already kept on this device.
// A day counts as active when at least one habit was checked or the daily challenge was completed,
// the same rule the "last seven days" strip uses.
export const isActive=entry=>Boolean(entry&&(entry.habits>0||entry.challenge==='done'));
const id=date=>`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
const addDays=(date,n)=>{const d=new Date(date.getFullYear(),date.getMonth(),date.getDate());d.setDate(d.getDate()+n);return d;};

// Consecutive active days ending today. If today is not done yet, yesterday still keeps the streak alive.
// With grace=1 one rest day inside the run is forgiven: it keeps the streak going but is not counted.
export function currentStreak(days,today=new Date(),grace=0){
  const todayDone=isActive(days[id(today)]);
  let cursor=todayDone?today:addDays(today,-1),count=0,spare=grace,rested=false;
  for(;;){
    if(isActive(days[id(cursor)])){count++;cursor=addDays(cursor,-1);continue;}
    if(count>0&&spare>0&&isActive(days[id(addDays(cursor,-1))])){spare--;rested=true;cursor=addDays(cursor,-1);continue;}
    break;
  }
  return {count,todayDone,rested};
}
// Longest run of consecutive active days in the history that is still kept.
export function bestRun(days){
  const active=Object.keys(days).filter(day=>/^\d{4}-\d{2}-\d{2}$/.test(day)&&isActive(days[day])).sort();
  let best=0,run=0,previous=null;
  for(const day of active){
    const [y,m,d]=day.split('-').map(Number),date=new Date(y,m-1,d);
    run=previous&&id(addDays(previous,1))===day?run+1:1;
    best=Math.max(best,run);previous=date;
  }
  return best;
}
export const BADGES=[
  ['first','First step','Complete your first action.'],
  ['habits','Habit hero','Check off all three habits in one day.'],
  ['streak3','Three-day streak','Be active three days in a row.'],
  ['streak7','Seven-day streak','Be active seven days in a row.'],
];
export function badges(days,best){
  const entries=Object.values(days);
  const earned={first:entries.some(isActive),habits:entries.some(entry=>entry?.habits>=3),streak3:best>=3,streak7:best>=7};
  return BADGES.map(([key,name,description])=>({key,name,description,earned:earned[key]}));
}
