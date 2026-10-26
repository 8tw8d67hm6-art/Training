const LBL={run:'Run',bike:'Bike',pool:'Pool swim',sea:'Sea swim',gym:'Gym',core:'Core',padel:'Padel',other:'Other'};
'use strict';
const KEY='trainingPlanner.v1',DAYS=['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'],SLOTS=['Morning','Lunch','Evening'];
const BASE={'Walk':['#a3e635','other',30],'Easy Run':['#60a5fa','run',40],'Key Run':['#2563eb','run',50],'Long Run':['#1e3a8a','run',90],'Bike':['#f59e0b','bike',45],'Long Ride':['#b45309','bike',120],'Pool Swim':['#06b6d4','pool',40],'Sea Swim':['#0e7490','sea',40],'Padel':['#ec4899','padel',60],'Core':['#f43f5e','core',20],'Legs in Gym':['#a855f7','gym',45],'Upper in Gym':['#7c3aed','gym',45],'Rest':['#94a3b8','rest',0],'Coffee':['#78350f','other',0]};
const PAL=['#ec4899','#14b8a6','#ef4444','#84cc16','#f97316'];
const $=id=>document.getElementById(id);
function iso(d){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
function monday(d){d=new Date(d.getFullYear(),d.getMonth(),d.getDate());d.setDate(d.getDate()-((d.getDay()+6)%7));return d;}
function addDays(s,n){const [y,m,d]=s.split('-').map(Number);return iso(new Date(y,m-1,d+n));}
function fmt(s){const [y,m,d]=s.split('-').map(Number);return new Date(y,m-1,d).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'});}
function blank(){return{days:DAYS.map((_,i)=>({loc:i<5?'office':null,slots:SLOTS.map(()=>null),notes:''}))};}
function s(t,n){return{type:t,mins:null,note:n||''};}
function example(){const w=blank(),d=w.days;
 d[0].slots=[s('Walk'),s('Legs in Gym'),s('Easy Run')];
 d[1].loc='home';d[1].slots=[s('Upper in Gym'),s('Bike'),null];
 d[2].loc='home';d[2].slots=[s('Upper in Gym'),s('Key Run'),s('Bike')];
 d[3].slots=[s('Coffee'),s('Legs in Gym'),s('Pool Swim')];
 d[4].slots=[s('Easy Run'),s('Upper in Gym','or Swim'),null];
 d[5].slots=[s('Long Run'),null,null];d[6].slots=[s('Long Ride'),null,null];return w;}
let st;try{st=JSON.parse(localStorage.getItem(KEY));}catch(e){}
if(!st||!st.weeks)st={weeks:{'2026-10-26':example()},custom:[],current:null};
st.current=st.current||(st.weeks[iso(monday(new Date()))]?iso(monday(new Date())):'2026-10-26');
function save(){try{localStorage.setItem(KEY,JSON.stringify(st));}catch(e){alert('Could not save – please export a backup.');}}
function types(){const t={...BASE};(st.custom||[]).forEach((c,i)=>t[c]=[PAL[i%PAL.length],'other',30]);return t;}
function week(){return st.weeks[st.current];}
function render(){const T=types(),w=week();$('wkLabel').textContent='w/c '+fmt(st.current);const m=$('days');m.innerHTML='';
 if(!w){m.innerHTML='<div class="card">No plan for this week yet. Tap “New week”.</div>';}
 else w.days.forEach((d,di)=>{const el=document.createElement('div');el.className='day';
  const date=fmt(addDays(st.current,di)).replace(/ \d{4}$/,'');
  el.innerHTML='<div class="dh"><span>'+DAYS[di]+' <small>'+date+'</small></span>'+(di<5?'<button class="tog '+d.loc+'">'+(d.loc==='home'?'Home':'Office')+'</button>':'')+'</div>';
  if(di<5)el.querySelector('.tog').onclick=()=>{d.loc=d.loc==='home'?'office':'home';save();render();};
  SLOTS.forEach((sn,si)=>{const v=d.slots[si],r=document.createElement('div');r.className='slot';
   if(v){r.style.borderLeftColor=(T[v.type]||['#64748b'])[0];r.style.background=(T[v.type]||['#64748b'])[0]+'22';}
   r.innerHTML='<b>'+sn+'</b><span>'+(v?esc(v.type)+(v.mins?' · '+v.mins+' min':'')+(v.note?' <small>('+esc(v.note)+')</small>':''):'<small>Tap to add</small>')+'</span>';
   r.onclick=()=>edit(di,si);el.appendChild(r);});
  const ta=document.createElement('textarea');ta.placeholder='Notes';ta.value=d.notes||'';ta.oninput=()=>{d.notes=ta.value;save();};el.appendChild(ta);m.appendChild(el);});
 summary();chart();}
function esc(x){return String(x).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));}
function stats(w){const T=types(),o={mins:0,run:0,bike:0,pool:0,sea:0,gym:0,core:0,padel:0,other:0,count:0,counts:{}};if(!w)return o;
 w.days.forEach(d=>d.slots.forEach(v=>{if(!v)return;const t=T[v.type]||['','other',30];if(t[1]==='rest')return;
  const mn=v.mins!=null&&v.mins!==''?Number(v.mins):t[2];o.mins+=mn;o[t[1]]+=mn;o.count++;o.counts[v.type]=(o.counts[v.type]||0)+1;}));return o;}
function summary(){const o=stats(week());const h=x=>(x/60).toFixed(1)+' h';
 $('summary').innerHTML='<h2>This week</h2><table><tr><td>Sessions</td><td>'+o.count+'</td></tr><tr><td>Total time*</td><td>'+h(o.mins)+'</td></tr>'+
 Object.keys(LBL).map(k=>'<tr><td>'+LBL[k]+'</td><td>'+h(o[k])+'</td></tr>').join('')+'</table><p><small>'+
 Object.entries(o.counts).map(([k,v])=>esc(k)+' ×'+v).join(', ')+'</small></p><p><small>*Uses typical durations where none entered.</small></p>';}
function chart(){const c=$('chart'),x=c.getContext('2d'),W=c.width=c.clientWidth*2||600,H=c.height=360;x.clearRect(0,0,W,H);
 const ks=Object.keys(st.weeks).sort().slice(-10),cols={run:'#2563eb',bike:'#f59e0b',pool:'#06b6d4',sea:'#0e7490',gym:'#7c3aed',core:'#f43f5e',padel:'#ec4899',other:'#a3e635'};
 const data=ks.map(k=>stats(st.weeks[k])),mx=Math.max(60,...data.map(d=>d.mins)),bw=W/Math.max(ks.length,1);
 x.font='22px sans-serif';data.forEach((d,i)=>{let y=H-40;Object.keys(cols).forEach(k=>{const hh=d[k]/mx*(H-80);x.fillStyle=cols[k];x.fillRect(i*bw+bw*.15,y-hh,bw*.7,hh);y-=hh;});
  x.fillStyle='#0f172a';x.fillText(fmt(ks[i]).slice(0,6),i*bw+bw*.1,H-10);x.fillText(Math.round(d.mins/60*10)/10+'h',i*bw+bw*.2,y-6);});}
let cur;function edit(di,si){cur=[di,si];const v=week().days[di].slots[si],sel=$('dType');
 sel.innerHTML=Object.keys(types()).map(t=>'<option>'+esc(t)+'</option>').join('')+'<option value="__other">Other…</option>';
 sel.value=v?v.type:'Easy Run';$('dMin').value=v&&v.mins!=null?v.mins:'';$('dNote').value=v?v.note:'';$('otherWrap').hidden=true;$('dOther').value='';
 $('dTitle').textContent=DAYS[di]+' – '+SLOTS[si];$('dlg').showModal();}
$('dType').onchange=()=>{$('otherWrap').hidden=$('dType').value!=='__other';};
$('dlg').addEventListener('close',()=>{const r=$('dlg').returnValue,[di,si]=cur,d=week().days[di];
 if(r==='clear')d.slots[si]=null;
 if(r==='save'){let t=$('dType').value;if(t==='__other'){t=$('dOther').value.trim();if(!t)return;if(!types()[t])st.custom.push(t);}
  const mn=$('dMin').value;d.slots[si]={type:t,mins:mn===''?null:Number(mn),note:$('dNote').value.trim()};}
 save();render();});
$('prev').onclick=()=>{st.current=addDays(st.current,-7);save();render();};
$('next').onclick=()=>{st.current=addDays(st.current,7);save();render();};
$('newWeek').onclick=()=>{if(week()&&!confirm('Replace this week’s plan?'))return;
 const prev=st.weeks[addDays(st.current,-7)];st.weeks[st.current]=prev&&confirm('Copy last week’s plan? (Cancel = start blank)')?JSON.parse(JSON.stringify(prev)):blank();save();render();};
$('exp').onclick=()=>{const b=new Blob([JSON.stringify(st,null,1)],{type:'application/json'}),a=document.createElement('a');
 a.href=URL.createObjectURL(b);a.download='training-backup-'+iso(new Date())+'.json';document.body.appendChild(a);a.click();a.remove();};
$('imp').onchange=e=>{const f=e.target.files[0];if(!f)return;f.text().then(t=>{const d=JSON.parse(t);if(!d.weeks)throw 0;
 if(confirm('Replace all saved weeks with this backup?')){st=d;st.custom=st.custom||[];save();render();}}).catch(()=>alert('That file isn’t a valid backup.'));e.target.value='';};
window.addEventListener('resize',chart);render();
if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js');
