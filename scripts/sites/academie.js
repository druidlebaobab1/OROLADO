// orolado.net — « OROLADO Academy » : leçons, lexique, erreurs à éviter, par où commencer. 11 langues.
'use strict';
const { esc } = require('./coquille.js');

const DEMO = 'https://www.orolado.com/?utm_source=orolado-net&utm_medium=site';

const site = {
  id: 'academie',
  origin: 'https://orolado.net',
  langs: ['en', 'fr', 'es', 'pt', 'ar', 'tr', 'de', 'ru', 'id', 'vi', 'hi'],
  themeColor: '#10132A',
  category: 'EducationalApplication',
  logo: '<svg class="logo" viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="8" fill="#6C8CFF"/><path d="M6 13l10-5 10 5-10 5z" fill="#fff"/><path d="M10 15.5v5c3.5 2.5 8.5 2.5 12 0v-5" fill="none" stroke="#fff" stroke-width="2"/></svg>',
  favicon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="8" fill="#6C8CFF"/><path d="M6 13l10-5 10 5-10 5z" fill="#fff"/><path d="M10 15.5v5c3.5 2.5 8.5 2.5 12 0v-5" fill="none" stroke="#fff" stroke-width="2"/></svg>'
};

site.css = `
*{box-sizing:border-box;margin:0;padding:0}
html,body{height:100%;background:#10132A;color:#E9ECFA;font-family:system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif;-webkit-text-size-adjust:100%}
body{overflow:hidden}
.sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}
.app{height:100vh;height:100dvh;display:flex;flex-direction:column;max-width:600px;margin:0 auto;padding:env(safe-area-inset-top) 0 env(safe-area-inset-bottom)}
.top{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:12px 16px 8px}
.brand{display:flex;align-items:center;gap:9px;font-size:17px}
.logo{width:30px;height:30px;flex-shrink:0}
.lang select{background:#191D3D;color:#E9ECFA;border:1px solid #2B3163;border-radius:10px;padding:7px 8px;font:inherit;font-size:13px}
.main{flex:1;min-height:0;position:relative}
.panel{position:absolute;inset:0;padding:6px 16px 12px;display:none;flex-direction:column;gap:10px;overflow-y:auto;-webkit-overflow-scrolling:touch}
.panel.on{display:flex}
h1,h2{font-size:19px;font-weight:800;color:#9FB4FF}
.lessons{display:grid;gap:8px}
.lcard{display:flex;gap:12px;align-items:center;background:#171B3A;border:1px solid #262C5C;border-radius:14px;padding:11px 12px;text-align:start;color:inherit;font:inherit;cursor:pointer;width:100%}
.lnum{width:34px;height:34px;border-radius:10px;background:#6C8CFF;color:#fff;font-weight:900;display:grid;place-items:center;flex-shrink:0}
.lcard b{display:block;font-size:15px}
.lcard span{display:block;font-size:12.5px;color:#A7AED6;margin-top:2px}
.lesson{display:none;flex-direction:column;gap:10px}
.lesson.on{display:flex}
.back{align-self:flex-start;background:none;border:1px solid #2B3163;color:#C9D2FF;border-radius:10px;padding:7px 12px;font:inherit;font-size:13px;cursor:pointer}
.lesson p{color:#D3D8F2;font-size:15px;line-height:1.6}
.key{background:#1B2150;border-inline-start:4px solid #6C8CFF;border-radius:10px;padding:10px 12px;font-size:14px;line-height:1.5}
.key b{color:#9FB4FF;display:block;margin-bottom:3px;font-size:12px;text-transform:uppercase;letter-spacing:.5px}
.nav2{display:flex;justify-content:space-between;gap:8px;margin-top:4px}
.nav2 button{flex:1}
.search{background:#191D3D;border:1px solid #2B3163;border-radius:12px;color:#fff;font:inherit;font-size:15px;padding:10px 12px;width:100%}
dl{display:grid;gap:7px}
.gl{background:#171B3A;border:1px solid #262C5C;border-radius:12px;padding:9px 12px}
.gl dt{font-weight:800;color:#C9D2FF;font-size:14.5px}
.gl dd{color:#BAC1E4;font-size:13.5px;line-height:1.45;margin-top:2px}
.err{display:flex;gap:10px;background:#171B3A;border:1px solid #262C5C;border-radius:12px;padding:10px 12px}
.err i{font-style:normal;color:#FF7A7A;font-weight:900;flex-shrink:0}
.err b{display:block;font-size:14.5px}
.err span{display:block;color:#BAC1E4;font-size:13.5px;line-height:1.45;margin-top:2px}
.step{display:flex;gap:12px;align-items:flex-start;background:#171B3A;border:1px solid #262C5C;border-radius:14px;padding:12px}
.step b{display:block;font-size:15px}
.step span{display:block;color:#BAC1E4;font-size:13.5px;line-height:1.45;margin-top:2px}
.btn{border:0;border-radius:14px;min-height:50px;font:inherit;font-size:16px;font-weight:800;cursor:pointer;display:flex;align-items:center;justify-content:center;text-align:center;text-decoration:none;padding:0 14px}
.blue{background:#6C8CFF;color:#fff}
.ghost{background:transparent;border:1px solid #2B3163;color:#E9ECFA}
.warn{color:#9AA2CC;font-size:12.5px;line-height:1.45}
.tabs{display:grid;grid-template-columns:repeat(4,1fr);border-top:1px solid #262C5C;background:#0D1024}
.tabs button{background:none;border:0;color:#7C84B3;font:inherit;font-size:11.5px;font-weight:700;padding:8px 2px 10px;display:flex;flex-direction:column;align-items:center;gap:3px;cursor:pointer}
.tabs svg{width:22px;height:22px}
.tabs button.on{color:#9FB4FF}
`;

const ICON = {
  learn: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 5h6a3 3 0 0 1 2 1 3 3 0 0 1 2-1h6v13h-6a3 3 0 0 0-2 1 3 3 0 0 0-2-1H4z"/><path d="M12 6v13"/></svg>',
  gloss: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="6"/><path d="M20 20l-4-4"/></svg>',
  err: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 3l9 16H3z"/><path d="M12 10v4M12 17h.01"/></svg>',
  start: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 19V5l12 7z"/></svg>'
};

function body(T) {
  const cards = T.lessons.map((x, i) => `<button type="button" class="lcard" data-l="${i}"><i class="lnum">${i + 1}</i><span><b>${esc(x.t)}</b><span>${esc(x.s)}</span></span></button>`).join('');
  const lessons = T.lessons.map((x, i) => `<article class="lesson" id="les${i}"><button type="button" class="back" data-back="1">${esc(T.back)}</button><h2>${i + 1}. ${esc(x.t)}</h2>${x.p.map(p => `<p>${esc(p)}</p>`).join('')}<div class="key"><b>${esc(T.keyLabel)}</b>${esc(x.k)}</div><div class="nav2">${i > 0 ? `<button type="button" class="btn ghost" data-l="${i - 1}">← ${esc(T.prev)}</button>` : ''}${i < T.lessons.length - 1 ? `<button type="button" class="btn blue" data-l="${i + 1}">${esc(T.next)} →</button>` : `<a class="btn blue" href="${DEMO}" rel="noopener">${esc(T.cta)}</a>`}</div></article>`).join('');
  const gloss = T.gloss.map(g => `<div class="gl"><dt>${esc(g[0])}</dt><dd>${esc(g[1])}</dd></div>`).join('');
  const errs = T.errs.map((e, i) => `<div class="err"><i>${i + 1}</i><div><b>${esc(e[0])}</b><span>${esc(e[1])}</span></div></div>`).join('');
  const steps = T.steps.map((s, i) => `<div class="step"><i class="lnum">${i + 1}</i><div><b>${esc(s[0])}</b><span>${esc(s[1])}</span></div></div>`).join('');
  return `<main class="main">
  <section class="panel on" id="p-learn">
    <div id="lessonList" style="display:flex;flex-direction:column;gap:10px"><h1>${esc(T.lessonsHead)}</h1><div class="lessons">${cards}</div></div>
    ${lessons}
  </section>
  <section class="panel" id="p-gloss">
    <h2>${esc(T.glossHead)}</h2>
    <input class="search" id="q" type="search" placeholder="${esc(T.search)}" aria-label="${esc(T.search)}">
    <dl id="gl">${gloss}</dl>
  </section>
  <section class="panel" id="p-err">
    <h2>${esc(T.errHead)}</h2>
    ${errs}
  </section>
  <section class="panel" id="p-start">
    <h2>${esc(T.startHead)}</h2>
    ${steps}
    <a class="btn blue" href="${DEMO}" rel="noopener">${esc(T.cta)}</a>
    <p class="warn">${esc(T.warn)}</p>
  </section>
</main>
<nav class="tabs" aria-label="menu">
  <button type="button" class="on" data-p="p-learn">${ICON.learn}${esc(T.tabLearn)}</button>
  <button type="button" data-p="p-gloss">${ICON.gloss}${esc(T.tabGloss)}</button>
  <button type="button" data-p="p-err">${ICON.err}${esc(T.tabErr)}</button>
  <button type="button" data-p="p-start">${ICON.start}${esc(T.tabStart)}</button>
</nav>`;
}

const script = `
(function(){
var $=function(i){return document.getElementById(i)};
var tabs=document.querySelectorAll('.tabs button');
tabs.forEach(function(b){b.addEventListener('click',function(){tabs.forEach(function(x){x.classList.toggle('on',x===b)});document.querySelectorAll('.panel').forEach(function(p){p.classList.toggle('on',p.id===b.dataset.p)});});});
function show(i){$('lessonList').style.display=i<0?'flex':'none';document.querySelectorAll('.lesson').forEach(function(a){a.classList.toggle('on',a.id==='les'+i)});$('p-learn').scrollTop=0;}
document.addEventListener('click',function(e){var b=e.target.closest('[data-l]');if(b){show(+b.dataset.l);return}if(e.target.closest('[data-back]'))show(-1);});
var q=$('q');q.addEventListener('input',function(){var v=q.value.trim().toLowerCase();document.querySelectorAll('#gl .gl').forEach(function(g){g.style.display=!v||g.textContent.toLowerCase().indexOf(v)>=0?'':'none'})});
})();
`;

const TXT = require('./academie-textes.js');

module.exports = { site, body, script, TXT };
