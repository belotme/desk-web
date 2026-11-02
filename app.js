// Desk app. Data path comes from #d=… (stored in localStorage, never in this code).
(function(){const h=new URLSearchParams(location.hash.slice(1));if(h.get('d')){localStorage.desk_d=h.get('d');history.replaceState(null,'',location.pathname)}})();
const D=localStorage.desk_d;const BASE=!D?null:D.includes('/')?`https://gist.githubusercontent.com/${D}/raw/`:`d/${D}/`;
const $=s=>document.querySelector(s),app=$('#app');let tab='desk',range='LIVE',cache={},actN=30,lastOk=0,err=null;
const money=v=>v==null?'—':(v<0?'-$':'$')+Math.abs(v).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2});
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const ago=ts=>{const t=typeof ts=='number'?ts*1000:Date.parse(ts);const s=(Date.now()-t)/1000;return s<60?`${s|0}s`:s<3600?`${s/60|0}m`:`${s/3600|0}h`};
async function get(n){const r=await fetch(BASE+n+'?t='+Date.now(),{cache:'no-store'});if(!r.ok)throw Error(r.status==404?'not found':'HTTP '+r.status);return r.json()}
async function load(){if(!BASE)return render();try{const[s,c,a,ac]=await Promise.all(['state.json','chart.json','activity.json','account.json'].map(get));
 cache={state:s,chart:c,activity:a,account:ac};err=null;lastOk=Date.now()}catch(e){err=e.message}render()}
function render(){if(!BASE){app.innerHTML=`<div class="state">No desk linked.<br><span class="sub">Open the private link from Telegram (it ends in #d=…).</span></div>`;return}
 if(!cache.state){app.innerHTML=err?`<div class="state err">Can't reach the desk (${esc(err)}).<br><span class="sub">Retrying every 15s.</span></div>`:`<div class="state">Loading…</div>`;return}
 const stale=err?`<div class="sub" style="color:var(--r)">Offline · last update ${ago(lastOk/1000)} ago</div>`:'';app.innerHTML=stale+({desk,activity,account}[tab])()}
function desk(){const s=cache.state,ch=cache.chart[range]||{points:[],marks:[]};
 const cards=s.cards.map(c=>{const st=c.paused?'paused':(!c.heartbeat||Date.now()/1000-Date.parse(c.heartbeat)/1000>120)?'stale':'';let x='';
  if(c.name=='scanner')x=`<div class="sub">${c.waiting} in waiting room</div>`;
  if(c.name=='auditor'){x=`<div class="sub">${c.rejected} rejected${c.running?' · auditing '+esc(c.running):''}</div>`;if(c.last&&c.last.mint)x+=`<div class="strip" onclick="audit('${c.last.mint}')">${Array.from({length:8},(_,i)=>{const l=c.last.layers.find(l=>l.layer==i+1);return`<i class="${l?l.pass?'p':'f':''}"></i>`}).join('')}</div><div class="sub">${esc(c.last.name)}</div>`}
  if(c.name=='analyst')x=`<div class="sub">${c.mode} · last score ${c.score??'—'} / min ${c.minScore}</div>`;
  if(c.name=='executor')x=`<div class="sub">${c.lastSize&&c.lastSize[0]?'last '+money(c.lastSize[0]):'no trades yet'} · ${c.stackPct}% of stack</div>`;
  if(c.name=='risk')x=(c.lastExit?`<div class="sub">last exit: ${c.lastExit}</div>`:'')+c.pills.map(p=>`<span class="pill">${p}</span>`).join('');
  return`<div class="card"><h3>${c.name}<span class="dot ${st}"></span></h3><div class="t">${esc(c.title)}</div>${x}</div>`}).join('');
 setTimeout(()=>lineChart($('#ch'),ch.points,ch.marks,m=>m.mint&&coin(m.mint)));
 return`<div class="top"><div class="bal">${money(s.balance)}</div><span class="mode ${s.mode}">${s.mode}</span></div>
 <div class="sub"><span class="pct ${s.todayPct>=0?'up':'dn'}">${s.todayPct>=0?'+':''}${s.todayPct}% today</span> · ${s.multiplier}× · ${s.openPositions} open</div>
 <canvas id="ch"></canvas><div class="ranges">${Object.keys(cache.chart).map(r=>`<button class="${r==range?'on':''}" onclick="range='${r}';render()">${r}</button>`).join('')}</div>
 ${ch.points.length<2?'<div class="sub">No trades yet. The line starts with the first fill.</div>':''}<div class="cards">${cards}</div>`}
function activity(){const a=cache.activity;if(!a.length)return`<div class="state">Nothing yet tonight.<br><span class="sub">Buys, sells, stops and rejects show up here.</span></div>`;
 return a.slice(0,actN).map(r=>`<div class="row k-${r.kind}" onclick="coin('${r.mint}')"><div><div>${esc(r.title)}</div><div class="s">${esc(r.subtitle)} · ${ago(r.ts)}</div></div><div class="v">${esc(r.value)}</div></div>`).join('')+(a.length>actN?`<button class="more" onclick="actN+=30;render()">More</button>`:'')}
function account(){const a=cache.account;return`<div class="card"><h3>Mode</h3><div class="t">${a.mode}</div><div class="sub">Paper stack ${money(a.paperStack)} · stack ${money(a.stack)}</div></div>
 <div class="card" style="margin-top:10px"><h3>FOMO</h3><div class="t">@${esc(a.handle)}</div><a class="btn" href="${esc(a.profileUrl)}" target="_blank" rel="noopener">Open my FOMO profile</a><div class="sub" style="margin-top:8px">New to FOMO? <a href="${esc(a.signupUrl)}" target="_blank" rel="noopener">Sign up</a></div></div>
 <div class="card" style="margin-top:10px"><h3>Settings</h3>${Object.entries(a.settings).map(([k,v])=>`<div class="row"><div class="s">${esc(k)}</div><div class="v">${esc(v)}</div></div>`).join('')}<div class="sub" style="margin-top:8px">Change from Telegram: "set stop to -8%"</div></div>`}
function sheet(html){$('#sheet-body').innerHTML=html;$('#sheet').hidden=false}
async function coin(m){if(!m)return;sheet('<div class="state">Loading…</div>');try{const c=await get(`coin_${m}.json`);
 sheet(`<div class="t" style="font-size:20px;font-weight:700">${esc(c.name||m.slice(0,6))}</div><div class="sub">${c.price!=null?'$'+c.price.toPrecision(4):'no price'} · liq ${money(c.stats.liquidityUsd)} · top10 ${c.stats.top10Pct??'—'}% · ${c.stats.ageMin??'—'}m</div>
 <canvas id="cc"></canvas>${c.position?`<div class="row"><div class="s">Position</div><div class="v">${money(c.position.size_usd)} @ $${(+c.position.entry_price).toPrecision(4)}${c.position.pnl_usd!=null?' · '+money(c.position.pnl_usd):''}</div></div>`:''}
 <button class="more" onclick="audit('${m}')">Audit</button><a class="btn" href="${esc(c.coinUrl)}" target="_blank" rel="noopener">Open on FOMO</a>`);setTimeout(()=>candleChart($('#cc'),c.candles,c.exitLines))}
 catch(e){sheet(`<div class="state err">No detail for this coin (${esc(e.message)}).</div>`)}}
async function audit(m){try{const a=await get(`audit_${m}.json`);sheet(`<div class="t" style="font-size:18px;font-weight:700">${esc(a.name)} · audit</div>`+a.layers.map(l=>`<div class="row"><div>${l.n}. ${esc(l.name)}</div><div class="v" style="color:${l.pass===null||l.pass===undefined?'var(--mu)':l.pass?'var(--g)':'var(--r)'}">${esc(l.value)}</div></div>`).join('')+`<a class="btn" href="${esc(a.coinUrl)}" target="_blank" rel="noopener">Open on FOMO</a>`)}
 catch(e){sheet(`<div class="state err">No audit for this coin (${esc(e.message)}).</div>`)}}
document.querySelectorAll('#tabs button').forEach(b=>b.onclick=()=>{tab=b.dataset.t;document.querySelectorAll('#tabs button').forEach(x=>x.classList.toggle('on',x==b));render()});
$('#sheet').onclick=e=>{if(e.target.id=='sheet'||e.target.classList.contains('x'))$('#sheet').hidden=true};
load();setInterval(load,15000);
