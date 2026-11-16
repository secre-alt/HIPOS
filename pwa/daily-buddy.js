const KEY='hipos.buddy.daily';
export const WELCOMES=['Welcome back! Ready for a little good today?','A new day, a new little adventure together!','Hello again, friend! Let us make today a little greener.'];
export const DAILY_CHEERS=['All your daily activities are done! Time for a happy dance!','Three habits, a challenge, and a quiz. What a day!','Your daily adventure is complete! Thanks for caring!'];
export function dailyBuddy(storage,day){
  const read=()=>{try{return JSON.parse(storage.getItem(KEY)||'null')||{};}catch{return {};}};
  const save=data=>{try{storage.setItem(KEY,JSON.stringify(data));}catch{}};
  return {
    visit(){
      const data=read();if(data.visit===day)return null;
      const returning=typeof data.visit==='string';
      const index=Number.isInteger(data.welcomeIndex)?(data.welcomeIndex+1)%WELCOMES.length:0;
      save({...data,visit:day,welcomeIndex:index});
      return returning?WELCOMES[index]:null;
    },
    quizDone(){save({...read(),quizDay:day});},
    completion(){
      const data=read();if(data.completed===day||data.quizDay!==day)return null;
      try{
        const habits=JSON.parse(storage.getItem('hipos.daily.v1')||'null');
        const activity=JSON.parse(storage.getItem('hipos.activity.v1')||'null');
        if(habits?.day!==day||habits.checked?.length!==3||!habits.checked.every(v=>v===true)||activity?.days?.[day]?.challenge!=='done')return null;
        const index=Number.isInteger(data.completeIndex)?(data.completeIndex+1)%DAILY_CHEERS.length:0;
        return DAILY_CHEERS[index];
      }catch{return null;}
    },
    celebrated(){const data=read();save({...data,completed:day,completeIndex:Number.isInteger(data.completeIndex)?(data.completeIndex+1)%DAILY_CHEERS.length:0});},
  };
}
