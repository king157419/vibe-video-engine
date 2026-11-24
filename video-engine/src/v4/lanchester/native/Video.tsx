import React from 'react';
import {AbsoluteFill, Audio, Img, staticFile, useCurrentFrame} from 'remotion';
import {Backdrop, ChapterLabel, FONT_ZH, FONT_EN, FONT_EN_IT, GlowCanvas, Subtitles, TitleCard, clamp, dot, haze, line, ring, smooth, win, ensureV4Fonts} from '../../kit';
import {chapters, meta, subs} from './data';

const GOLD='#f2b56b', BLUE='#75bde8', TEXT='#e6e8e8';
const p=(t:number,a:number,b:number)=>smooth(clamp((t-a)/(b-a)));
const mix=(a:number,b:number,k:number)=>a+(b-a)*k;
const weight=(n:number,i:number)=>clamp(n-i);
const continuous=(k:number)=>{
 const s=clamp(k)*Math.atanh(.8);
 const b=4*Math.cosh(s)-5*Math.sinh(s);
 return [5*Math.cosh(s)-4*Math.sinh(s),b<1e-8?0:b];
};
const numeral=(text:string,top=685,size=50,color=TEXT,opacity=1):React.ReactNode=><div style={{position:'absolute',top,left:0,right:0,textAlign:'center',fontFamily:FONT_ZH,fontSize:size,fontWeight:350,letterSpacing:'.13em',color,opacity}}>{text}</div>;

function teams(g:CanvasRenderingContext2D,t:number,a:number,b:number,spread=1,shoot=true){
 const drift=Math.sin(t*.22)*22;
 const lx=650+drift,rx=1270+drift;
 for(let side=0;side<2;side++){
  const n=side?b:a, slots=side?4:5;
  for(let i=0;i<slots;i++){
   const k=weight(n,i);if(k<.001)continue;
   const home=side?0:p(.45-b,0,.45);
   const angle=i/3*Math.PI*2-Math.PI/2;
   const y=mix(450+(i-(slots-1)/2)*83*spread,450+Math.sin(angle)*150,home);
   const x=side?rx:mix(lx,960+Math.cos(angle)*170,home);
   haze(g,x,y,95,side?BLUE:GOLD,.11*k);
   dot(g,x,y,38+Math.sin(t*1.5+i)*2,side?BLUE:GOLD,k*.98,.23);
   ring(g,x,y,40+Math.sin(t+i)*4,side?BLUE:GOLD,1,.12*k);
   if(shoot&&a>0&&b>0){
    const focusing=!side&&t>=34.1&&t<40.4;
    const targetY=focusing?325:450+(Math.floor(t*.8+i)%Math.ceil(side?a:b)-((side?5:4)-1)/2)*83*spread;
    const q=(t*.58+i*.17)%1;
    const pts:[number,number][]=[[x,y],[mix(x,side?lx:rx,q),mix(y,targetY,q)]];
    line(g,pts,side?BLUE:GOLD,focusing?2.1:1.3,(focusing?.28:.12)*k);
    dot(g,pts[1][0],pts[1][1],9,side?BLUE:GOLD,.55*k);
   }
  }
 }
}

function squares(g:CanvasRenderingContext2D,t:number){
 const unfold=p(t,53.5,60.3);
 const k=p(t,60.3,66), shrink=p(t,70.8,77.8);
 for(let side=0;side<2;side++){
  const n=side?4:5;
  for(let y=0;y<n;y++)for(let x=0;x<n;x++){
   const idx=y*n+x;
   const keep=side?1-k:(idx<16?1-k:1);
   const oldX=mix((side?1270:650)+Math.sin(t*.22)*22,(side?1225:695)+(x-(n-1)/2)*40,unfold);
   const oldY=mix(450+(y-(n-1)/2)*83,455+(y-(n-1)/2)*40,unfold);
   const regroup=side?0:k;
   const ox=mix(oldX,960+((idx-16)%3-1)*58,regroup);
   const oy=mix(oldY,455+(Math.floor((idx-16)/3)-1)*58,regroup);
   const tx=800+(idx%3)*160,ty=450;
   const xx=mix(ox,tx,shrink), yy=mix(oy,ty,shrink);
   dot(g,xx,yy,mix(30,15,unfold)+(shrink*13),side?BLUE:GOLD,mix(.9/n,.75,unfold)*keep);
  }
 }
}

function resultField(g:CanvasRenderingContext2D,t:number){
 const collapse=p(t,105.2,111.8);
 if(collapse>0)for(let i=0;i<3;i++)dot(g,800+i*160,450,32,GOLD,collapse);
}

function passage(g:CanvasRenderingContext2D,t:number){
 const q=p(t,112.5,120), dark=t>=136.5&&t<139.5?.09:1;
 const opening=mix(380,56,q);
 if(t>=136.5&&t<139.5)line(g,[[835,450],[1085,450]],GOLD,1.6,.48);
 const burst=win(t,112.5,116,.4,1.5);
 if(burst>0){haze(g,960,450,820,GOLD,.10*burst);ring(g,960,450,200+p(t,112.5,116)*780,GOLD,2,.28*burst);}
 // The glowing battlefield becomes two lanes and one shared opening.
 line(g,[[960-opening,175],[960-opening,730]],BLUE,1.4,.22*dark);
 line(g,[[960+opening,175],[960+opening,730]],GOLD,1.4,.22*dark);
 for(let i=0;i<1600;i++){
  const side=i%2;
  const row=Math.floor(i/2/50),col=Math.floor(i/2)%50;
  const xx=side?1110+col*12.7:180+col*12.7;
  const yy=235+row*29;
  const tx=side?1050+col*8:870-col*8;
  const ty=450+(row-7.5)*6;
  const a=(1-q)*.56+q*.09;
  dot(g,mix(xx,tx,q),mix(yy,ty,q)+Math.sin(t+i)*1.1,3.5,side?BLUE:GOLD,a*dark);
 }
 if(q>.1){
  const rem=p(t,139.5,145.2), a=5-4*rem,b=4-4*rem;
  for(let side=0;side<2;side++)for(let i=0;i<(side?4:5);i++){
   const k=weight(side?b:a,i);if(k<.001)continue;
   const x=side?1045+i*72:875-i*72;
   dot(g,x,450+Math.sin(t*.6+i)*4,30,side?BLUE:GOLD,k*(i===0?.92:.24)*q*dark);
  }
  if(t<139.5){
   const tt=t>=136.5?136.5:t, z=(tt*.8)%1;
   dot(g,mix(875,1045,z),450,9,GOLD,.7*q*dark);
   dot(g,mix(1045,875,z),450,9,BLUE,.7*q*dark);
  }
 }
}

export const LanchesterVideo: React.FC = ()=>{
 ensureV4Fonts();
 const t=useCurrentFrame()/30;
 const titleA=win(t,17.5,21.8,.7,.6);
 const silence=t>=136.5&&t<139.5;
 return <AbsoluteFill style={{background:'#090d14'}}>
  {t<172?<Backdrop tint="#090d14" dust={220} drift={[-12,-5]} glow={.035} dim={silence?.25:0} />:null}
  {t>=85.8&&t<112.5?[0,1,2,3].map(depth=><Img key={depth} src={staticFile(`v4/lanchester/native/cloud_${depth}.png`)} style={{position:'absolute',left:0,top:-10,width:1920,height:780,opacity:p(t,85.8+depth*.45,91.4+depth*.25)*(1-p(t,108,112))*(.72+.14*Math.sin(t*.6+depth)),filter:`blur(${(3-depth)*.18}px)`,mixBlendMode:'screen',transform:`perspective(2000px) rotateX(${9+2*Math.sin(t*.17)}deg) rotateZ(${Math.sin(t*.14+depth)*.8}deg) translate(${Math.sin(t*.23+depth)*(5+depth*4)}px,${Math.sin(t*.31+depth)*(2+depth*2)}px) scale(${(1+.007*depth*Math.sin(t*.18))*(1-.82*p(t,105.2,111.8))})`,transformOrigin:'50% 46%'}}/>):null}
  <GlowCanvas draw={(g)=>{
   g.save();
   if(t<17.5){const [a,b]=continuous(p(t,2,5.6));teams(g,t,a,b,1,true);}
   else if(t<22){
    for(let i=0;i<160;i++){const z=i/160*6.283;dot(g,960+Math.cos(z+t*.08)*mix(360,225,p(t,17.5,21)),470+Math.sin(z+t*.08)*120,4,GOLD,titleA*.22);}
   }
   else if(t<53.5){
    const k=t<40.4?0:p(t,40.4,59.5), [a,b]=continuous(k*.92*(1-p(t,51.5,53.5)));teams(g,t,a,b,1,true);
   }else if(t<78.9)squares(g,t);
   else if(t<85.8){const z=p(t,78.9,85.8);for(let i=0;i<5;i++){dot(g,650+i*150,450,30,GOLD,.8);if(i<4)line(g,[[650+i*150,450],[800+i*150,450]],GOLD,3,(1-z)*.7);}}
   else if(t<112.5)resultField(g,t);
   else if(t<152.8)passage(g,t);
   else if(t<165.8){
    const q=p(t,152.8,161);for(let i=0;i<10;i++){
     const a=i/10*6.283; const xx=mix(960+Math.cos(a)*420,960,q),yy=mix(450+Math.sin(a)*220,450,q);
     line(g,[[xx,yy],[960,450]],GOLD,1.3,.13);dot(g,xx,yy,16,GOLD,.55);
    }dot(g,960,450,35+q*30,GOLD,.5);
   }else if(t<172){
    const k=p(t,165.8,170);g.globalAlpha=1-p(t,170,171);teams(g,t,4+k,4,.75,false);
    const xx=mix(400,650+Math.sin(t*.22)*22,k),yy=mix(700,574.5,k);dot(g,xx,yy,38,GOLD,.98*(1-k));g.globalAlpha=1;
   }
   // Breathing haze follows the camera; even silence has unmistakable moving dust.
   if(t<172)haze(g,960+Math.sin(t*.18)*60,455,280,GOLD,.025*(silence?.15:1));
   for(const h of meta.dings){
    const age=t-h.t;
    if(age>=0&&age<.65){
     const pos:[number,number]=h.t===40.4?[1270,325]:h.t===165.8?[400,700]:[960,450];
     ring(g,pos[0],pos[1],22+age*145,h.t===40.4?BLUE:GOLD,1.4,.7*(1-age/.65));
    }
   }
   g.restore();
  }}/>
  {t<5?numeral('5 : 4',690,58,GOLD):null}
  {t>=5.6&&t<12?numeral('3',660,86,GOLD):null}
  {t<12?numeral('连续模型',780,19,'#929ca8'):null}
  {titleA>0?<TitleCard title="五打四" sub="兰彻斯特平方律 · 兰彻斯特 · 1916" en="LANCHESTER’S SQUARE LAW" p={p(t,17.5,18.5)} out={p(t,21,21.8)} y={370} size={92}/>:null}
  {t>=170&&t<172?<TitleCard title="五打四" en="FIVE AGAINST FOUR" p={p(t,170,170.7)} out={p(t,171.5,172)} y={385} size={86}/>:null}
  {t>=22&&t<33.3?numeral('同等强度 · 示意',745,19,'#929ca8'):null}
  {t>=51.5&&t<55.5?numeral('回到开局',745,19,'#929ca8'):null}
  {t>=60.3&&t<66.3?numeral('25 − 16',680,50,GOLD):null}
  {t>=66.3&&t<72.8?numeral('5² − 4² = 9',680,54,GOLD):null}
  {t>=72.8&&t<78.9?numeral('√9 = 3',680,54,GOLD):null}
  {t>=85.8&&t<92.6?numeral(`${Math.floor(p(t,85.8,91.4)*20000).toLocaleString('en-US')} 局`,775,47,GOLD):null}
  {t>=92.6&&t<99.4?numeral(`五人队胜 ${meta.open_win_pct.toFixed(1)}%`,775,42,GOLD):null}
  {t>=99.4&&t<106.2?numeral(`胜局平均 ${meta.open_survivors.toFixed(2)}`,775,42,GOLD):null}
  {t>=85.8&&t<106.2?numeral('每点1局 · 自建随机模型',850,19,'#929ca8'):null}
  {t>=139.5&&t<146?numeral('5 − 4 = 1',720,50,GOLD):null}
  {t>=146&&t<152.8?numeral(`四人队 ${(100-meta.open_win_pct).toFixed(1)}% → ${meta.choke_blue_win_pct.toFixed(1)}%`,720,42,BLUE):null}
  {t>=139.5&&t<146?numeral('连续单挑模型',790,19,'#929ca8'):null}
  {t>=146&&t<152.8?numeral('窄口随机模型 · 另20,000局',790,19,'#929ca8'):null}
  {t>=152.8&&t<165.8?numeral('《孙子兵法 · 虚实》',735,22,'#a4a6a7'):null}
  {t<172?<ChapterLabel chapters={chapters} dur={3.8}/>:null}
  {t<5?<div style={{position:'absolute',bottom:54,width:'100%',textAlign:'center',fontFamily:FONT_ZH,fontSize:38,color:TEXT,opacity:1-p(t,4.65,5)}}>{subs[0].zh}<div style={{fontFamily:FONT_EN_IT,fontSize:23,color:'#8a8f93',marginTop:6}}>{subs[0].en}</div></div>:<Subtitles subs={subs.slice(1)}/>}
  {t>=172?<div style={{position:'absolute',bottom:42,width:'100%',textAlign:'center',fontFamily:FONT_EN,fontSize:17,letterSpacing:'.3em',color:'#8a8f93'}}>Opus 5.5</div>:null}
  <Audio src={staticFile('v4/lanchester/native/mix.wav')}/>
 </AbsoluteFill>;
};
