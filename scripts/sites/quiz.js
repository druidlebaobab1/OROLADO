// orolad0.com — « Quiz du Trader » : 15 questions, score et explications. 8 langues.
// Volontairement différent (couleurs claires, autre nom) : le titre et la description ne contiennent pas « OROLADO ».
'use strict';
const { esc } = require('./coquille.js');

const DEMO = 'https://www.orolado.com/?utm_source=quiz-orolad0&utm_medium=site';

const site = {
  id: 'quiz',
  origin: 'https://orolad0.com',
  langs: ['en', 'fr', 'es', 'pt', 'ar', 'tr', 'ru', 'id'],
  themeColor: '#0F766E',
  category: 'EducationalApplication',
  logo: '<svg class="logo" viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="16" fill="#0F766E"/><path d="M12.5 12.5a3.5 3.5 0 1 1 5 3.2c-1 .5-1.5 1.2-1.5 2.3v.5" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/><circle cx="16" cy="22.5" r="1.6" fill="#fff"/></svg>',
  favicon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><circle cx="16" cy="16" r="16" fill="#0F766E"/><path d="M12.5 12.5a3.5 3.5 0 1 1 5 3.2c-1 .5-1.5 1.2-1.5 2.3v.5" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/><circle cx="16" cy="22.5" r="1.6" fill="#fff"/></svg>'
};

site.css = `
*{box-sizing:border-box;margin:0;padding:0}
html,body{height:100%;background:#F2F8F7;color:#123532;font-family:system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif;-webkit-text-size-adjust:100%}
body{overflow:hidden}
.sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}
.app{height:100vh;height:100dvh;display:flex;flex-direction:column;max-width:560px;margin:0 auto;padding:env(safe-area-inset-top) 0 env(safe-area-inset-bottom)}
.top{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:12px 16px 8px}
.brand{display:flex;align-items:center;gap:9px;font-size:17px;color:#0F766E}
.logo{width:30px;height:30px;flex-shrink:0}
.lang select{background:#fff;color:#123532;border:1px solid #CFE3E0;border-radius:10px;padding:7px 8px;font:inherit;font-size:13px}
.main{flex:1;min-height:0;position:relative}
.screen{position:absolute;inset:0;padding:8px 16px 16px;display:none;flex-direction:column;gap:12px;overflow-y:auto}
.screen.on{display:flex}
h1{font-size:23px;font-weight:900;color:#0F3D39;line-height:1.25}
h2{font-size:18px;font-weight:800;color:#0F3D39;line-height:1.35}
.lead{color:#3E605C;font-size:15px;line-height:1.55}
.hero{flex:1;display:flex;flex-direction:column;justify-content:center;gap:16px;text-align:center}
.badge{align-self:center;background:#D8F0EC;color:#0F766E;border-radius:999px;padding:6px 14px;font-weight:800;font-size:13px}
.btn{border:0;border-radius:14px;min-height:52px;font:inherit;font-size:16px;font-weight:800;cursor:pointer;display:flex;align-items:center;justify-content:center;text-align:center;text-decoration:none;padding:0 14px}
.teal{background:#0F766E;color:#fff}
.ghost{background:#fff;border:1px solid #CFE3E0;color:#0F3D39}
.bar{height:8px;background:#DCEBE8;border-radius:99px;overflow:hidden}
.bar i{display:block;height:100%;width:0;background:#0F766E;border-radius:99px;transition:width .3s}
.meta{display:flex;justify-content:space-between;font-size:13px;color:#4D6E6A;font-weight:700}
.opts{display:grid;gap:9px}
.opt{background:#fff;border:2px solid #D3E6E3;border-radius:14px;min-height:54px;padding:10px 14px;text-align:start;font:inherit;font-size:15px;color:#123532;cursor:pointer}
.opt.good{border-color:#16A34A;background:#ECFDF3}
.opt.bad{border-color:#DC2626;background:#FEF2F2}
.opt:disabled{cursor:default}
.expl{display:none;background:#fff;border-inline-start:4px solid #0F766E;border-radius:12px;padding:10px 12px;font-size:14px;line-height:1.5;color:#2E4F4B}
.expl.on{display:block}
.expl b{display:block;margin-bottom:3px}
.expl b.ok{color:#16A34A}.expl b.ko{color:#DC2626}
.score{font-size:58px;font-weight:900;color:#0F766E;line-height:1}
.level{font-size:19px;font-weight:800;color:#0F3D39}
.warn{color:#5C7975;font-size:12.5px;line-height:1.45}
.spacer{flex:1}
`;

function body(T) {
  return `<main class="main">
  <section class="screen on" id="s-start">
    <div class="hero">
      <span class="badge">${esc(T.badge)}</span>
      <h1>${esc(T.startHead)}</h1>
      <p class="lead">${esc(T.startText)}</p>
      <button class="btn teal" id="go" type="button">${esc(T.startBtn)}</button>
    </div>
  </section>
  <section class="screen" id="s-q">
    <div class="meta"><span id="qn"></span><span id="qs"></span></div>
    <div class="bar"><i id="qb"></i></div>
    <h2 id="qt"></h2>
    <div class="opts" id="qo"></div>
    <div class="expl" id="qe"><b id="qr"></b><span id="qx"></span></div>
    <div class="spacer"></div>
    <button class="btn teal" id="qnext" type="button" style="display:none"></button>
  </section>
  <section class="screen" id="s-end">
    <div class="hero">
      <h2>${esc(T.resHead)}</h2>
      <div class="score" id="es">0/15</div>
      <div class="level" id="el"></div>
      <p class="lead" id="em"></p>
      <button class="btn teal" id="again" type="button">${esc(T.again)}</button>
      <a class="btn ghost" href="${DEMO}" rel="noopener">${esc(T.demo)}</a>
      <p class="warn">${esc(T.warn)}</p>
    </div>
  </section>
</main>`;
}

const script = `
(function(){
var $=function(i){return document.getElementById(i)},ALL=T.questions,Q=[],N=15,i=0,score=0;
function show(id){document.querySelectorAll('.screen').forEach(function(s){s.classList.toggle('on',s.id===id)})}
function shuffle(a){for(var k=a.length-1;k>0;k--){var j=Math.floor(Math.random()*(k+1)),t=a[k];a[k]=a[j];a[j]=t}return a}
function ask(){var q=Q[i];$('qn').textContent=T.q+' '+(i+1)+'/'+N;$('qs').textContent=T.scoreL+' '+score;$('qb').style.width=(i/N*100)+'%';$('qt').textContent=q.q;
$('qe').classList.remove('on');$('qnext').style.display='none';var box=$('qo');box.innerHTML='';
shuffle([0,1,2]).forEach(function(k){var b=document.createElement('button');b.type='button';b.className='opt';b.textContent=q.o[k];b.addEventListener('click',function(){pick(k,b)});b.dataset.k=k;box.appendChild(b)});}
function pick(k,btn){var ok=k===0;if(ok)score++;document.querySelectorAll('.opt').forEach(function(b){b.disabled=true;if(b.dataset.k==='0')b.classList.add('good')});if(!ok)btn.classList.add('bad');
var r=$('qr');r.textContent=ok?T.correct:T.incorrect;r.className=ok?'ok':'ko';$('qx').textContent=Q[i].x;$('qe').classList.add('on');$('qs').textContent=T.scoreL+' '+score;
var n=$('qnext');n.textContent=i<N-1?T.next:T.seeResult;n.style.display='flex';}
$('qnext').addEventListener('click',function(){i++;if(i<N){ask();$('s-q').scrollTop=0}else end()});
function end(){$('qb').style.width='100%';$('es').textContent=score+'/'+N;var lv=score>=12?2:score>=8?1:0;$('el').textContent=T.levels[lv];$('em').textContent=T.msgs[lv];show('s-end')}
// Chaque partie : 15 questions tirées au hasard parmi toute la banque (jamais deux fois le même quiz).
function start(){Q=shuffle(ALL.slice()).slice(0,N);i=0;score=0;show('s-q');ask()}
$('go').addEventListener('click',start);$('again').addEventListener('click',start);
})();
`;

const TXT = require('./quiz-textes.js');

module.exports = { site, body, script, TXT };
