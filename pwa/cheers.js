// Short, original encouragement. Each event cycles without immediate repeats.
export const CHEERS={
  welcome:{motion:'hop',sound:'chime',lines:['Welcome back! Ready for a little good today?']},
  daily:{motion:'spin',sound:'win',lines:['Your daily adventure is complete! Thanks for caring!']},
  correct:{motion:'hop',sound:'star',lines:['You spotted it! Sparkle points!','Nice eye! You have got this!','Sorted like a superstar!']},
  retry:{motion:'hop',sound:'boop',lines:['Almost! Let us try the tip together.','Every try helps you learn!','Take a breath. You can try again!']},
  habit:{motion:'hop',sound:'coin',lines:['Little habit, big high five!','One small step for our school!','Packed and ready! Nice work!']},
  complete:{motion:'spin',sound:'win',lines:['You did it! Victory wiggle!','Mission complete! High five!','Look at you go, superstar!']},
  challenge:{motion:'spin',sound:'tada',lines:['Challenge cleared! Ta-da!','Your little adventure is complete!','A gold-star kind of effort!']},
  streak:{motion:'spin',sound:'star',lines:['Your streak is growing! Keep shining!','Another day, another little victory!','Look at those good habits growing!']},
  unlock:{motion:'spin',sound:'unlock',lines:['A new surprise! You earned it!','Treasure unlocked! Happy dance!','Something new for our adventure!']},
};
export function createCheerPicker(now=()=>Date.now()){
  let last=-Infinity;const indexes=new Map();
  return (kind,{preview=false}={})=>{
    const cheer=CHEERS[kind];if(!cheer||now()-last<(preview?1000:3500))return null;
    last=now();const index=(indexes.get(kind)??-1)+1;indexes.set(kind,index);
    return {...cheer,text:cheer.lines[index%cheer.lines.length]};
  };
}
