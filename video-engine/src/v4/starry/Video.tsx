import React from 'react';
import {AbsoluteFill,Audio,staticFile,useCurrentFrame} from 'remotion';
import {Backdrop,ChapterLabel,GlowCanvas,FONT_ZH,FONT_EN,FONT_EN_IT,ensureV4Fonts,clamp,smooth,win,dot,haze} from '../kit';
import {DUR,FPS,subs,meta} from './data';
import {useTitlePoints} from './fontReady';
const B='#587acb', Y='#f2cc67', M='#e8e2bd';
type G=CanvasRenderingContext2D;
const p=(t:number,a:number,b:number)=>smooth(clamp((t-a)/(b-a)));
const stroke=(g:G,pts:[number,number][],c:string,w=2,a=.7)=>{g.strokeStyle=c;g.lineCap='round';g.beginPath();pts.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));for(const [width,alpha]of [[w*5,a*.055],[w*2.2,a*.13],[w,a]]){g.lineWidth=width;g.globalAlpha=alpha;g.stroke();}g.globalAlpha=1;};
const text=(g:G,s:string,x:number,y:number,size=28,c=M,a=1)=>{g.globalAlpha=a;g.font=`400 ${size}px "${FONT_ZH}"`;g.textAlign='center';g.fillStyle=c;g.fillText(s,x,y);g.globalAlpha=1;};
// Analytic seeded brush paths, deliberately illustrative rather than a Navier–Stokes simulation.
const spiral=(g:G,x:number,y:number,r:number,t:number,c:string,n=80,alpha=.8)=>{
 for(let j=0;j<n;j++){
  const u=(j+.3)/n,ang=u*13.8+t*.14,rr=r*(.10+.90*u);
  const pts:[number,number][]=[];
  for(let k=0;k<5;k++){const a=ang+k*.035;pts.push([x+rr*Math.cos(a),y+rr*.60*Math.sin(a)]);}
  stroke(g,pts,c,1.5+u*2,alpha*(.35+.65*(.5+.5*Math.sin(j*7.91))));
 }
};
const starry=(g:G,t:number,expand=1,alpha=1)=>{
 g.save();g.translate(960,470);g.scale(expand,expand);g.translate(-960,-470);g.globalAlpha=alpha;
 // One cohesive sky, not independent decorative data points.
 for(let j=0;j<13;j++){
  const pts:[number,number][]=[];
  for(let i=0;i<90;i++){const x=360+i*13.5;pts.push([x,470+j*8+48*Math.sin(x/165+j*.14+t*.025)]);}
  stroke(g,pts,j%3===0?M:B,j%3===0?1.8:2.8,alpha*.55);
 }
 spiral(g,820,410,220,t,B,150,alpha*.85);spiral(g,1190,460,135,-t,B,100,alpha*.8);
 const stars=[[480,280,18],[685,235,15],[990,265,12],[1320,275,17],[1480,360,40]];
 for(const [x,y,r]of stars){dot(g,x,y,r*(1+.05*Math.sin(t*.8+x)),Y,alpha*.6);for(let j=0;j<3;j++){g.beginPath();g.strokeStyle=Y;g.lineWidth=1.3;g.globalAlpha=alpha*.45;g.ellipse(x,y,r*(1.1+j*.24),r*(1.1+j*.24),t*.012,0,6.283);g.stroke();}}
 const hill:[number,number][]=Array.from({length:110},(_,i)=>[320+i*12,640+30*Math.sin(i*.08)+10*Math.sin(i*.21)]);
 stroke(g,hill,B,3,alpha*.55);
 const tree:[number,number][]=[[540,700],[525,550],[550,520],[520,460],[545,420],[525,350],[550,300],[575,420],[590,520],[576,590],[585,700]];
 stroke(g,tree,M,2,alpha*.55);
 for(let j=0;j<7;j++){const x=770+j*73,y=690+12*Math.sin(j);stroke(g,[[x,y+35],[x,y],[x+19,y-17],[x+38,y],[x+38,y+35]],B,2,alpha*.6);}
 g.restore();g.globalAlpha=1;
};
const coffee=(g:G,t:number,forceCup=false)=>{
 const reveal=forceCup?0:p(t,6.5,12.2);if(reveal>.01)starry(g,t,.72+.28*reveal,reveal);
 g.save();g.globalAlpha=1-reveal;
 for(let j=0;j<3;j++){g.beginPath();g.strokeStyle=B;g.lineWidth=j===0?2.3:1;g.globalAlpha=(1-reveal)*(.45-j*.10);g.ellipse(960,450,270+j*9,178+j*5,0,0,Math.PI*2);g.stroke();}
 spiral(g,960,450,236,t,M,240,1-reveal);
 const baby=p(t,1.8,4.8);spiral(g,1060,440,2+54*baby,t*1.6,Y,60,(1-reveal)*baby);
 g.restore();
};
const house=(g:G,t:number)=>{
 const grow=p(t,48,55);haze(g,960,320,150,Y,.12);
 for(let j=0;j<3;j++){g.beginPath();g.strokeStyle=Y;g.lineWidth=2;g.globalAlpha=.45;g.arc(960,280,55+j*8+3*Math.sin(t*.3),0,6.283);g.stroke();}
 stroke(g,[[765,675],[765,470],[960,390],[1155,470],[1155,675],[765,675]],Y,2.2,grow*.8);
 for(let j=0;j<4;j++){const x=830+j%2*190,y=515+Math.floor(j/2)*95;stroke(g,[[x,y],[x+65,y],[x+65,y+48],[x,y+48],[x,y]],B,2,grow*.8);}
 const separate=p(t,66,73);dot(g,890-90*separate,555,19,Y,.65);dot(g,1030+170*separate,555,19,B,.65*(1-separate*.7));
};
const field=(g:G,t:number)=>{
 const grow=p(t,34,46);
 for(let j=0;j<32;j++){const x=530+j*28;stroke(g,[[x,720],[x+16*Math.sin(t*.35+j),615-35*Math.sin(j*.8)]],j%3===0?Y:B,2,.2+.5*grow);}
 stroke(g,[[870,395],[1060,600],[1045,616],[855,411],[870,395]],M,3,.8);
 dot(g,1048,610,25,Y,.6);
};
const cascade=(g:G,t:number)=>{
 const u=p(t,110.3,116),fade=1-p(t,122,127);
 for(let j=0;j<3;j++){const x=960+(j-1)*340*u,r=(236*(1-u)+150/(1+j*.6)*u);spiral(g,x,450+10*u,r,t*(1+j*.5*u),j===0?M:B,110,(j===0?1:u)*.7*fade);if(j<2)stroke(g,[[x+165,460],[x+260,460]],M,2,.45*u*fade);}
 if(t>122){const a=p(t,122,128);spectrum(g,t,a,false);}
};
const spectrum=(g:G,t:number,a:number,luminance:boolean)=>{
 g.save();g.globalAlpha=a;
 // Computed log-log representation of k^(-5/3): straight on logarithmic axes.
 stroke(g,[[700,280],[700,660],[1330,660]],B,1.5,a*.7);
 const n=p(t,luminance?158:129, luminance?164:134),pts:[number,number][]=[];
 for(let j=0;j<=80*n;j++){const logK=j/80*1.7,logE=-5/3*logK;pts.push([730+logK*310,320-logE*100]);}
 stroke(g,pts,Y,3,a);text(g,'−5/3',1130,420,45,Y,a*n);
 text(g,luminance?'亮度谱 · 示意':'能量谱 · 示意',1010,730,21,M,a);
 text(g,luminance?'P(k)':'E(k)',645,300,22,B,a);text(g,'k',1330,700,22,B,a);
 // Temporary plain-language axis cue precedes the numerical comparison.
 text(g,'涡更小 →',1095,780,22,M,a);text(g,luminance?'明暗':'能量',630,475,24,M,a);
 spiral(g,760,705,38,t,B,28,a*.7);spiral(g,1290,705,13,t,B,18,a*.7);
 g.restore();
};
const skyToCoffee=(g:G,t:number)=>{
 const u=p(t,101,110.3);
 if(u<1)starry(g,t,1,1-u);
 spiral(g,820+140*u,410+40*u,220+16*u,t,M,240,.8);
 g.beginPath();g.strokeStyle=B;g.lineWidth=2;g.globalAlpha=.5*u;g.ellipse(960,450,270,178,0,0,Math.PI*2);g.stroke();g.globalAlpha=1;
};
const lineToSky=(g:G,t:number)=>{
 const u=p(t,136.5,143),pts:[number,number][]=[];
 for(let j=0;j<130;j++){const z=j/129,a=z*13.8+t*.14,r=220*(.1+.9*z);pts.push([(730+527*z)*(1-u)+(820+r*Math.cos(a))*u,(320+283*z)*(1-u)+(410+r*.6*Math.sin(a))*u]);}
 stroke(g,pts,Y,2.4,.8);if(u>.1)starry(g,t,.90,u);
};
const blossom=(g:G,t:number)=>{
 const grow=p(t,208,215),back=p(t,221,229);
 g.save();g.translate(960,500);g.scale(1-back*.5,1-back*.5);g.translate(-960,-500);
 for(let j=0;j<11;j++){
  const a=-Math.PI*.94+j*.18,len=260+80*Math.sin(j*2.1),ex=960+len*Math.cos(a),ey=640+len*Math.sin(a);
  const ang=j/11*13.8+t*.14,rr=70+j*16;
  const curl=(k:number):[number,number]=>[960+rr*Math.cos(ang+k*.15),450+rr*.6*Math.sin(ang+k*.15)];
  const source:[number,number][]=[[960,735],[960,640],[ex,ey]];
  stroke(g,source.map(([x,y],k)=>[x*(1-back)+curl(k)[0]*back,y*(1-back)+curl(k)[1]*back]),B,3,grow*(1-back*.8));
  for(let k=0;k<5;k++){
   const z=.65+k*.087,x=960+(ex-960)*z+23*Math.sin(k*2.4+j)+2*Math.sin(t*.5+j),y=640+(ey-640)*z+18*Math.cos(k*2.1+j);
   const bloom=p(t,208+j*.12+k*.13,211+j*.12+k*.13)*(1-back);
   for(let q=0;q<5;q++){const ang2=q*1.256+t*.012;g.fillStyle=M;g.globalAlpha=bloom*.4;g.beginPath();g.ellipse(x+8*Math.cos(ang2),y+8*Math.sin(ang2),7,4,ang2,0,6.283);g.fill();}
   dot(g,x,y,13,Y,bloom*.22);
  }
 }
 // The first bloom is already legible on the bell's exact frame at 208.0.
 // Its light becomes the branching tree; the remaining clusters open later.
 const firstBloom=1-p(t,210.5,212);
 if(firstBloom>0){
  for(let q=0;q<5;q++){const aa=q*1.256-.314;g.fillStyle=M;g.globalAlpha=.90*firstBloom;g.beginPath();g.ellipse(960+16*Math.cos(aa),600+16*Math.sin(aa),15,8,aa,0,6.283);g.fill();}
  dot(g,960,600,21,Y,.58*firstBloom);
 }
 g.globalAlpha=1;g.restore();if(back>0){g.save();g.globalAlpha=back;coffee(g,t-221,true);g.restore();}
};
export const Video:React.FC=()=>{
 ensureV4Fonts();const frame=useCurrentFrame(),t=frame/FPS;
 const titlePoints=useTitlePoints('星空的风',86,500,5,FONT_ZH,.36);
 const last=t>=DUR-2;
 const sub=subs.find(s=>t>=s.t0&&t<s.t1);
 const subA=sub?(sub.t0===0?Math.min(1,(sub.t1-t)/.35):Math.min(1,(t-sub.t0)/.35,(sub.t1-t)/.35)):0;
 const titleA=win(t,15,23,.8,1.0),silence=t>=177&&t<180;
 let sceneAlpha=1;
 for(const [a,b,c]of [[46.1,47.5,48],[72,74.5,75]])if(t>=a&&t<c)sceneAlpha=1-p(t,a,b);
 return <AbsoluteFill style={{background:'#05070c'}}>
 {!last&&<><Backdrop tint="#070a10" dust={180} drift={[-9,-4]} glow={.06} seed={1941}/>
 <GlowCanvas opacity={sceneAlpha} draw={(g)=>{
 g.save();g.translate(960,470);g.scale(1+.012*Math.sin(t*.04),1+.012*Math.sin(t*.04));g.translate(-960,-470);
 if(t<15)coffee(g,t);
 if(t>=15&&t<23){spiral(g,960,480,260,t,B,220,.25);if(titlePoints)for(let i=0;i<titlePoints.length;i+=2){const [x,y]=titlePoints[i];dot(g,960+x,438+y,2.6,Y,.45*titleA);}}
 if(t>=23&&t<48)field(g,t);
 if(t>=48&&t<75)house(g,t);
 if(t>=75&&t<101){starry(g,t, .82+.12*p(t,75,103));if(t<81)stroke(g,[[650,260],[650,720],[1260,720],[1260,260]],M,2,.4*(1-p(t,78,81)));}
 if(t>=101&&t<110.3)skyToCoffee(g,t);
 if(t>=110.3&&t<136.5)cascade(g,t);
 if(t>=136.5&&t<143)lineToSky(g,t);
 if(t>=143&&t<153.4)starry(g,t,.90);
 if(t>=153.4&&t<167)spectrum(g,t,p(t,153.4,155),true);
 if(t>=167&&t<177){starry(g,t,1+p(t,170,177)*.7);if(t<173.5){text(g,'1889   →   1941',960,730,25,M,.75);text(g,'52 年',960,785,40,Y,.9);}else{for(let j=0;j<10;j++)spiral(g,120+j*190,130+240*(j%3),130,t,Y,95,.22);}}
 if(silence){dot(g,960,430,30,Y,.75);stroke(g,[[900,430],[1020,430]],B,1,.3);}
 if(t>=180&&t<199.8){starry(g,t,.7,.6);if(t>=186.3){stroke(g,[[960,230],[960,720]],M,1,.25);}}
 if(t>=199.8&&t<208){spiral(g,960,450,270,t,B,210,.45);text(g,'夫大块噫气',960,425,45,M);text(g,'其名为风',960,505,45,Y);text(g,'《庄子 · 齐物论》',960,600,20,M,.55);}
 if(t>=208&&t<230)blossom(g,t);
 if(t>=230&&t<240){spiral(g,960,470,310,t,B,220,.25);}
 // Every bell has an explicit visible emphasis at its exact frame.
 for(const hit of meta.hits){if(hit.type!=='bell')continue;const d=t-hit.t;if(d>=0&&d<1.1){const anchors:Record<string,[number,number]>={'15':[960,435],'48':[960,280],'81.3':[820,410],'110.3':[960,450],'129.8':[730,320],'160.2':[1130,420],'208':[960,600],'230':[960,450]};const [hx,hy]=anchors[String(hit.t)]??[960,470];g.beginPath();g.strokeStyle=Y;g.globalAlpha=(1-d/1.1)*.65;g.lineWidth=1.8;g.ellipse(hx,hy,55+d*100,35+d*65,0,0,6.283);g.stroke();g.globalAlpha=1;}}
 g.restore();
 }}/>
 <ChapterLabel chapters={meta.chapters} dur={3.8}/>
 {titleA>0&&<div style={{position:'absolute',top:378,width:'100%',textAlign:'center',opacity:titleA,fontFamily:FONT_ZH}}><div style={{fontSize:86,fontWeight:500,color:'#eee9d8',letterSpacing:'.36em',paddingLeft:'.36em',opacity:p(t,15.5,17.5),textShadow:'0 0 24px #d2ac5044'}}>星空的风</div><div style={{fontSize:24,color:Y,letterSpacing:'.13em',marginTop:40}}>湍流级串 · 柯尔莫哥洛夫 · 1941</div><div style={{marginTop:18,fontSize:15,color:'#8a8f93',fontFamily:FONT_EN,letterSpacing:'.3em'}}>THE TURBULENT CASCADE</div></div>}
 {sub&&<div style={{position:'absolute',bottom:48,width:'100%',textAlign:'center',opacity:Math.max(0,subA)}}><div style={{fontFamily:FONT_ZH,fontSize:38,fontWeight:380,color:'#e6e8e8',letterSpacing:'.025em'}}>{sub.zh}</div><div style={{fontFamily:FONT_EN_IT,fontSize:23,color:'#8a8f93',marginTop:12}}>{sub.en}</div></div>}
 {t>=230&&t<240&&<div style={{position:'absolute',top:280,width:'100%',textAlign:'center',fontFamily:FONT_ZH}}><div style={{fontSize:25,color:'#b4b7bb',letterSpacing:'.2em'}}>《{meta.auction.work}》</div><div style={{fontSize:20,color:'#8a8f93',marginTop:30}}>{meta.auction.label}</div><div style={{fontSize:68,color:Y,marginTop:15}}>{meta.auction.value}</div><div style={{fontSize:24,color:'#c5c5bd',marginTop:25}}>{meta.auction.status}</div><div style={{fontSize:18,color:'#8a8f93',marginTop:22}}>{meta.auction.date}</div></div>}
 </>}
 {last&&<div style={{position:'absolute',bottom:42,width:'100%',textAlign:'center',fontFamily:FONT_EN,fontSize:17,letterSpacing:'.3em',color:'#8a8f93'}}>Opus 5.5</div>}
 <Audio src={staticFile('v4/starry/mix.wav')}/>
 </AbsoluteFill>;
};
