// tiny canvas charts: balance line with marks, and candles with exit lines
function setup(c){const d=devicePixelRatio||1,w=c.clientWidth,h=c.clientHeight;c.width=w*d;c.height=h*d;const x=c.getContext('2d');x.scale(d,d);return[x,w,h]}
function lineChart(c,pts,marks,onMark){const[x,w,h]=setup(c);if(!pts.length)return;const t0=pts[0].t,t1=Math.max(pts[pts.length-1].t,t0+1);
 let lo=Math.min(...pts.map(p=>p.v)),hi=Math.max(...pts.map(p=>p.v));if(hi-lo<1e-9){lo-=1;hi+=1}
 const X=t=>8+(w-16)*(t-t0)/(t1-t0),Y=v=>h-14-(h-28)*(v-lo)/(hi-lo);const up=pts[pts.length-1].v>=pts[0].v;
 x.strokeStyle=up?'#2bd67b':'#ff5c5c';x.lineWidth=2;x.beginPath();pts.forEach((p,i)=>i?x.lineTo(X(p.t),Y(p.v)):x.moveTo(X(p.t),Y(p.v)));x.stroke();
 const hits=[];(marks||[]).filter(m=>m.ts>=t0).forEach(m=>{let v=pts[0].v;for(const p of pts)if(p.t<=m.ts)v=p.v;const px=X(m.ts),py=Y(v);
  x.fillStyle={bought:'#e9eef4',sold:'#2bd67b',stopped:'#ff5c5c'}[m.kind]||'#8693a3';x.beginPath();x.arc(px,py,4,0,7);x.fill();hits.push([px,py,m])});
 c.onclick=e=>{const r=c.getBoundingClientRect();const h_=hits.find(([px,py])=>Math.hypot(px-(e.clientX-r.left),py-(e.clientY-r.top))<14);if(h_&&onMark)onMark(h_[2])}}
function candleChart(c,cs,lines){const[x,w,h]=setup(c);if(!cs.length)return;let lo=Math.min(...cs.map(k=>k.l)),hi=Math.max(...cs.map(k=>k.h));
 if(lines)for(const k of['stop','trail','entry'])if(lines[k]){lo=Math.min(lo,lines[k]);hi=Math.max(hi,lines[k])}if(hi-lo<1e-12){hi*=1.01;lo*=.99}
 const Y=v=>h-10-(h-20)*(v-lo)/(hi-lo),bw=Math.max(2,(w-16)/cs.length);cs.forEach((k,i)=>{const cx=8+i*bw+bw/2;x.strokeStyle=x.fillStyle=k.c>=k.o?'#2bd67b':'#ff5c5c';
 x.beginPath();x.moveTo(cx,Y(k.h));x.lineTo(cx,Y(k.l));x.stroke();x.fillRect(cx-bw*.35,Math.min(Y(k.o),Y(k.c)),bw*.7,Math.max(1,Math.abs(Y(k.o)-Y(k.c))))});
 if(lines)[['entry','#8693a3'],['stop','#ff5c5c'],['trail','#ffc94d']].forEach(([k,col])=>{if(!lines[k])return;x.setLineDash([4,4]);x.strokeStyle=col;x.beginPath();x.moveTo(0,Y(lines[k]));x.lineTo(w,Y(lines[k]));x.stroke();x.setLineDash([])})}
