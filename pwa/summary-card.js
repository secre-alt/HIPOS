// Draws the shareable "my week" picture on this device. Nothing is uploaded, and the picture has no
// name or personal details: just the streak, seven day dots, and any badges earned.
import {translate,getLanguage} from './i18n.js';
import {renderAvatar,currentConfig} from './avatar.js';
const FONT='ui-rounded,"SF Pro Rounded","Segoe UI Variable Display","Segoe UI",system-ui,sans-serif';
const LIME='#b9f26b',DEEP='#0b2f25';

export async function weekCardBlob(week){
  const W=1080,H=1350,canvas=document.createElement('canvas');canvas.width=W;canvas.height=H;
  const ctx=canvas.getContext('2d');if(!ctx)throw Error('Canvas unavailable');
  const locale=getLanguage()==='fil'?'fil':'en';
  const rounded=(x,y,w,h,r)=>{ctx.beginPath();if(ctx.roundRect)ctx.roundRect(x,y,w,h,r);else ctx.rect(x,y,w,h);};
  const text=(value,x,y,{size=40,weight=600,color='#fff',align='left',max=920}={})=>{ctx.font=`${weight} ${size}px ${FONT}`;ctx.fillStyle=color;ctx.textAlign=align;ctx.fillText(value,x,y,max);};

  const bg=ctx.createLinearGradient(0,0,W,H);bg.addColorStop(0,DEEP);bg.addColorStop(1,'#1b6b4c');ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);
  ctx.fillStyle='rgba(255,255,255,.07)';for(let y=60;y<H;y+=44)for(let x=60;x<W;x+=44){ctx.beginPath();ctx.arc(x,y,2,0,Math.PI*2);ctx.fill();}

  // brand
  rounded(80,70,84,84,28);ctx.fillStyle=LIME;ctx.fill();text('H',122,130,{size:56,weight:800,color:DEEP,align:'center',max:60});
  text('HIPOS',186,132,{size:58,weight:800});

  // the student's buddy (a drawing chosen on this device; never a name or photo)
  try{
    const url=URL.createObjectURL(new Blob([renderAvatar(currentConfig(),{size:240,decorative:true})],{type:'image/svg+xml;charset=utf-8'}));
    const img=new Image();img.src=url;await img.decode();
    ctx.save();rounded(840,40,170,170,40);ctx.clip();ctx.drawImage(img,840,40,170,170);ctx.restore();URL.revokeObjectURL(url);
  }catch{/* the card is still complete without the buddy */}

  // title + date range
  text(translate('My week with HIPOS'),80,310,{size:80,weight:800});
  const fmt=new Intl.DateTimeFormat(locale,{month:'short',day:'numeric'}),first=week.days[0].date,last=week.days[week.days.length-1].date;
  text(`${fmt.format(first)} – ${fmt.format(last)}`,80,376,{size:40,weight:500,color:'rgba(255,255,255,.72)'});

  // panel
  rounded(60,440,960,700,56);ctx.fillStyle='rgba(255,255,255,.1)';ctx.fill();
  text(String(week.streak.count),W/2,700,{size:270,weight:800,color:LIME,align:'center'});
  text(translate(week.streak.count===1?'day in a row':'days in a row'),W/2,780,{size:50,weight:600,align:'center'});

  // seven days
  const weekday=new Intl.DateTimeFormat(locale,{weekday:'short'}),activeDays=week.days.filter(d=>d.active).length;
  week.days.forEach((day,i)=>{
    const cx=120+i*140,cy=910;
    ctx.beginPath();ctx.arc(cx,cy,48,0,Math.PI*2);
    if(day.active){ctx.fillStyle=LIME;ctx.fill();ctx.strokeStyle=DEEP;ctx.lineWidth=9;ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();ctx.moveTo(cx-18,cy+2);ctx.lineTo(cx-4,cy+16);ctx.lineTo(cx+20,cy-14);ctx.stroke();}
    else{ctx.strokeStyle='rgba(255,255,255,.4)';ctx.lineWidth=4;ctx.stroke();}
    text(weekday.format(day.date),cx,1000,{size:32,weight:600,color:'rgba(255,255,255,.85)',align:'center',max:120});
  });
  text(translate(`${activeDays} of 7 days active`),W/2,1085,{size:44,weight:600,color:'rgba(255,255,255,.9)',align:'center'});

  // badges
  const earned=week.badges.filter(b=>b.earned).map(b=>translate(b.name));
  text(earned.length?earned.join('  •  '):translate('Every small action counts.'),W/2,1230,{size:40,weight:700,color:LIME,align:'center'});
  text(translate('Prevent · Reuse · Safely carry out'),W/2,1295,{size:32,weight:500,color:'rgba(255,255,255,.65)',align:'center'});

  return new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(Error('Could not create the image.')),'image/png'));
}
