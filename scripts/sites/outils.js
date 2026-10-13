// orolado.org — « OROLADO Tools » : entraînement à la prédiction + calculateurs (gains, risque). 11 langues.
'use strict';
const { esc } = require('./coquille.js');

const DEMO = 'https://www.orolado.com/?utm_source=orolado-org&utm_medium=site';

const site = {
  id: 'outils',
  origin: 'https://orolado.org',
  langs: ['en', 'fr', 'es', 'pt', 'ar', 'tr', 'de', 'ru', 'id', 'vi', 'hi'],
  themeColor: '#0B1020',
  category: 'FinanceApplication',
  logo: '<svg class="logo" viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="8" fill="#F5C542"/><path d="M7 22l6-7 4 4 8-9" fill="none" stroke="#0B1020" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  favicon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="8" fill="#F5C542"/><path d="M7 22l6-7 4 4 8-9" fill="none" stroke="#0B1020" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>'
};

site.css = `
*{box-sizing:border-box;margin:0;padding:0}
html,body{height:100%;background:#0B1020;color:#E8ECF5;font-family:system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif;-webkit-text-size-adjust:100%}
body{overflow:hidden}
.sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}
.app{height:100vh;height:100dvh;display:flex;flex-direction:column;max-width:560px;margin:0 auto;padding:env(safe-area-inset-top) 0 env(safe-area-inset-bottom)}
.top{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:12px 16px 8px}
.brand{display:flex;align-items:center;gap:9px;font-size:17px;letter-spacing:.2px}
.logo{width:30px;height:30px;flex-shrink:0}
.lang select{background:#151C33;color:#E8ECF5;border:1px solid #26304F;border-radius:10px;padding:7px 8px;font:inherit;font-size:13px}
.main{flex:1;min-height:0;position:relative}
.panel{position:absolute;inset:0;padding:6px 16px 10px;display:none;flex-direction:column;gap:10px;overflow-y:auto}
.panel.on{display:flex}
h1,h2{font-size:19px;font-weight:800;color:#F5C542}
.sub{color:#A9B3CC;font-size:14px;margin-top:-4px}
.chartBox{position:relative;flex:1;min-height:170px;background:linear-gradient(180deg,#111832,#0D1328);border:1px solid #1E2745;border-radius:16px;overflow:hidden}
canvas{position:absolute;inset:0;width:100%;height:100%}
.hud{display:flex;justify-content:space-between;font-size:14px;color:#A9B3CC}
.hud b{color:#E8ECF5}
.msg{min-height:22px;text-align:center;font-weight:800;font-size:16px}
.msg.ok{color:#16C784}.msg.ko{color:#EA3943}
.btns{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.btn{border:0;border-radius:14px;min-height:54px;font:inherit;font-size:17px;font-weight:800;cursor:pointer;color:#fff}
.btn:disabled{opacity:.5}
.up{background:#16C784}.dn{background:#EA3943}
.gold{background:#F5C542;color:#0B1020}
.ghost{background:transparent;border:1px solid #33406A;color:#E8ECF5}
a.btn{display:flex;align-items:center;justify-content:center;text-align:center;text-decoration:none;padding:0 12px}
.res{display:none;flex-direction:column;gap:10px;align-items:stretch;text-align:center}
.res.on{display:flex}
.big{font-size:44px;font-weight:900;color:#F5C542}
.res p{color:#C5CDE0;font-size:14px;line-height:1.45}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
label.f{display:flex;flex-direction:column;gap:6px;font-size:13px;color:#A9B3CC}
label.f input{background:#151C33;border:1px solid #26304F;border-radius:12px;color:#fff;font:inherit;font-size:18px;font-weight:700;padding:10px 12px;width:100%}
input[type=range]{width:100%;accent-color:#F5C542}
.card{background:#121A33;border:1px solid #1E2745;border-radius:14px;padding:12px 14px;display:flex;justify-content:space-between;align-items:center;gap:10px}
.card span{color:#A9B3CC;font-size:13px}
.card b{font-size:19px;white-space:nowrap}
.pos{color:#16C784}.neg{color:#EA3943}.gl{color:#F5C542}
.note{color:#8C97B3;font-size:12.5px;line-height:1.45}
.about p{color:#C5CDE0;font-size:14.5px;line-height:1.55}
.warn{border-left:3px solid #F5C542;padding-left:10px}
.tabs{display:grid;grid-template-columns:repeat(4,1fr);border-top:1px solid #1E2745;background:#0D1328}
.tabs button{background:none;border:0;color:#7F8AA8;font:inherit;font-size:11.5px;font-weight:700;padding:8px 2px 10px;display:flex;flex-direction:column;align-items:center;gap:3px;cursor:pointer}
.tabs svg{width:22px;height:22px}
.tabs button.on{color:#F5C542}
@media (max-height:640px){.chartBox{min-height:130px}.btn{min-height:48px}h1,h2{font-size:17px}}
`;

const ICON = {
  pred: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 18l5-6 4 3 7-9"/><path d="M16 6h4v4"/></svg>',
  gain: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 7h8M8 12h2M14 12h2M8 16h2M14 16h2"/></svg>',
  risk: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M12 8v5M12 16h.01"/></svg>',
  about: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7h.01"/></svg>'
};

function body(T) {
  return `<main class="main">
  <section class="panel on" id="p-pred">
    <h1>${esc(T.predHead)}</h1>
    <p class="sub">${esc(T.predSub)}</p>
    <div class="hud"><span>${esc(T.round)} <b id="rd">1/10</b></span><span>${esc(T.score)} <b id="sc">0</b></span></div>
    <div class="chartBox"><canvas id="cv"></canvas></div>
    <div class="msg" id="msg" aria-live="polite"></div>
    <div class="btns" id="play"><button class="btn up" id="bUp" type="button">▲ ${esc(T.up)}</button><button class="btn dn" id="bDn" type="button">▼ ${esc(T.down)}</button></div>
    <div class="res" id="res">
      <h2>${esc(T.resTitle)}</h2>
      <div class="big" id="acc">0 %</div>
      <p>${esc(T.resText)}</p>
      <button class="btn gold" id="again" type="button">${esc(T.again)}</button>
      <a class="btn ghost" href="${DEMO}" rel="noopener">${esc(T.tryReal)}</a>
    </div>
  </section>
  <section class="panel" id="p-gain">
    <h2>${esc(T.gainHead)}</h2>
    <div class="grid">
      <label class="f">${esc(T.stake)}<input id="gStake" type="number" inputmode="decimal" min="1" value="10"></label>
      <label class="f">${esc(T.payout)}<input id="gPay" type="number" inputmode="decimal" min="1" value="90"></label>
    </div>
    <div class="card"><span>${esc(T.ifWin)}</span><b class="pos" id="gWin">—</b></div>
    <div class="card"><span>${esc(T.back)}</span><b class="gl" id="gBack">—</b></div>
    <div class="card"><span>${esc(T.ifLose)}</span><b class="neg" id="gLose">—</b></div>
    <div class="card"><span>${esc(T.breakeven)}</span><b id="gBe">—</b></div>
    <p class="note">${esc(T.gainNote)}</p>
  </section>
  <section class="panel" id="p-risk">
    <h2>${esc(T.riskHead)}</h2>
    <label class="f">${esc(T.capital)}<input id="rCap" type="number" inputmode="decimal" min="1" value="100"></label>
    <label class="f">${esc(T.riskPct)} : <b id="rPctV" class="gl">2 %</b><input id="rPct" type="range" min="1" max="10" step="1" value="2"></label>
    <div class="card"><span>${esc(T.advised)}</span><b class="gl" id="rStake">—</b></div>
    <div class="card"><span>${esc(T.streak)}</span><b id="rStreak">—</b></div>
    <p class="note">${esc(T.riskNote)}</p>
  </section>
  <section class="panel about" id="p-about">
    <h2>${esc(T.aboutHead)}</h2>
    <p>${esc(T.aboutText)}</p>
    <p class="warn">${esc(T.warn)}</p>
    <a class="btn gold" href="${DEMO}" rel="noopener">${esc(T.demo)}</a>
  </section>
</main>
<nav class="tabs" aria-label="menu">
  <button type="button" class="on" data-p="p-pred">${ICON.pred}${esc(T.tabPred)}</button>
  <button type="button" data-p="p-gain">${ICON.gain}${esc(T.tabGain)}</button>
  <button type="button" data-p="p-risk">${ICON.risk}${esc(T.tabRisk)}</button>
  <button type="button" data-p="p-about">${ICON.about}${esc(T.tabAbout)}</button>
</nav>`;
}

// Code de l'application (dans la page). T = textes de la langue. Tout est calculé dans le navigateur.
const script = `
(function(){
var L=document.documentElement.lang;
var $=function(i){return document.getElementById(i)};
var nf=function(n,d){try{return new Intl.NumberFormat(L,{minimumFractionDigits:d,maximumFractionDigits:d}).format(n)}catch(e){return n.toFixed(d)}};
var money=function(n){return '$ '+nf(n,2)};
// Onglets
var tabs=document.querySelectorAll('.tabs button');
tabs.forEach(function(b){b.addEventListener('click',function(){tabs.forEach(function(x){x.classList.toggle('on',x===b)});document.querySelectorAll('.panel').forEach(function(p){p.classList.toggle('on',p.id===b.dataset.p)});if(b.dataset.p==='p-pred')draw();});});
// --- Entraînement à la prédiction (graphique au hasard, comme un vrai marché) ---
var VIS=30,ROUNDS=10,cv=$('cv'),ctx=cv.getContext('2d'),C=[],r=0,score=0,busy=false,lo=0,hi=0;
function gauss(){var u=1-Math.random(),v=Math.random();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v)}
function newGame(){C=[];var p=1000;for(var i=0;i<VIS+ROUNDS;i++){var o=p,c=o+gauss()*3.2;var h=Math.max(o,c)+Math.abs(gauss())*1.4,l=Math.min(o,c)-Math.abs(gauss())*1.4;C.push({o:o,c:c,h:h,l:l});p=c}
lo=Infinity;hi=-Infinity;C.forEach(function(k){if(k.l<lo)lo=k.l;if(k.h>hi)hi=k.h});var pad=(hi-lo)*0.08;lo-=pad;hi+=pad;
r=0;score=0;busy=false;$('res').classList.remove('on');$('play').style.display='';$('msg').textContent='';$('msg').className='msg';hud();draw();}
function hud(){$('rd').textContent=Math.min(r+1,ROUNDS)+'/'+ROUNDS;$('sc').textContent=score}
function draw(){var w=cv.clientWidth,h=cv.clientHeight;if(!w||!h)return;var d=Math.min(2,window.devicePixelRatio||1);cv.width=w*d;cv.height=h*d;ctx.setTransform(d,0,0,d,0,0);ctx.clearRect(0,0,w,h);
var shown=C.slice(r,r+VIS),n=VIS+1,slot=(w-16)/n,y=function(v){return 8+(hi-v)/(hi-lo)*(h-16)};
ctx.strokeStyle='rgba(255,255,255,.05)';ctx.lineWidth=1;for(var g=1;g<5;g++){var gy=Math.round(h*g/5)+.5;ctx.beginPath();ctx.moveTo(0,gy);ctx.lineTo(w,gy);ctx.stroke()}
shown.forEach(function(k,i){var x=8+slot*i+slot/2,up=k.c>=k.o,col=up?'#16C784':'#EA3943';ctx.strokeStyle=col;ctx.beginPath();ctx.moveTo(x,y(k.h));ctx.lineTo(x,y(k.l));ctx.stroke();ctx.fillStyle=col;var t=y(Math.max(k.o,k.c)),b=y(Math.min(k.o,k.c));ctx.fillRect(x-slot*0.32,t,slot*0.64,Math.max(1.5,b-t))});
// emplacement de la prochaine bougie : « ? »
var nx=8+slot*VIS+slot/2,last=shown[shown.length-1];ctx.strokeStyle='rgba(245,197,66,.55)';ctx.setLineDash([4,4]);ctx.strokeRect(nx-slot*0.42,y(last.c)-18,slot*0.84,36);ctx.setLineDash([]);ctx.fillStyle='#F5C542';ctx.font='bold 14px system-ui';ctx.textAlign='center';ctx.fillText('?',nx,y(last.c)+5);}
function guess(up){if(busy||r>=ROUNDS)return;busy=true;var k=C[VIS+r],win=(k.c>=k.o)===up;if(win)score++;
var m=$('msg');m.textContent=win?T.right:T.wrong;m.className='msg '+(win?'ok':'ko');
// révèle la bougie : on décale le graphique d'un cran
r++;hud();draw();
setTimeout(function(){busy=false;if(r>=ROUNDS){$('play').style.display='none';$('acc').textContent=nf(score/ROUNDS*100,0)+' %';$('res').classList.add('on')}},650);}
$('bUp').addEventListener('click',function(){guess(true)});$('bDn').addEventListener('click',function(){guess(false)});$('again').addEventListener('click',newGame);
window.addEventListener('resize',draw);
// --- Calculateur de gains ---
function gain(){var s=Math.max(0,parseFloat($('gStake').value)||0),p=Math.max(0,parseFloat($('gPay').value)||0);
$('gWin').textContent='+ '+money(s*p/100);$('gBack').textContent=money(s+s*p/100);$('gLose').textContent='− '+money(s);$('gBe').textContent=p>0?nf(100/(1+p/100),1)+' %':'—'}
['gStake','gPay'].forEach(function(i){$(i).addEventListener('input',gain)});
// --- Gestion du risque ---
function risk(){var c=Math.max(0,parseFloat($('rCap').value)||0),q=parseFloat($('rPct').value)||1;$('rPctV').textContent=q+' %';
$('rStake').textContent=money(c*q/100);$('rStreak').textContent=String(Math.ceil(Math.log(0.5)/Math.log(1-q/100)))}
['rCap','rPct'].forEach(function(i){$(i).addEventListener('input',risk)});
newGame();gain();risk();
})();
`;

const TXT = {
  fr: { title: 'OROLADO Tools — Entraînement à la prédiction en trading et calculateurs', desc: 'Entraînez-vous à lire un graphique : prédisez si la prochaine bougie monte ou descend. Calculateurs de gains et de gestion du risque, gratuits et sans inscription.', brand: 'OROLADO Tools', lang: 'Langue', tabPred: 'Prédiction', tabGain: 'Gains', tabRisk: 'Risque', tabAbout: 'À propos', predHead: 'Entraînement à la prédiction', predSub: 'La prochaine bougie va-t-elle monter ou descendre ?', up: 'Hausse', down: 'Baisse', round: 'Manche', score: 'Score', right: 'Bien vu !', wrong: 'Raté…', resTitle: 'Votre résultat', acc: 'Précision', resText: 'Ces graphiques suivent le hasard, comme les vrais marchés : personne ne gagne à chaque fois. Ce qui fait la différence, c’est la gestion de votre argent.', again: 'Rejouer', tryReal: 'Essayer sur un vrai graphique (démo gratuite)', gainHead: 'Calculateur de gains', stake: 'Mise ($)', payout: 'Taux de gain (%)', ifWin: 'Gain si vous gagnez', ifLose: 'Perte si vous perdez', back: 'Somme reçue si vous gagnez', breakeven: 'Réussite minimum pour ne pas perdre', gainNote: 'Plus le taux de gain est élevé, plus le taux de réussite nécessaire est bas.', riskHead: 'Gestion du risque', capital: 'Capital ($)', riskPct: 'Risque par trade', advised: 'Mise conseillée par trade', streak: 'Pertes de suite avant de perdre la moitié du capital', riskNote: 'Les traders prudents risquent 1 à 2 % de leur capital par trade.', aboutHead: 'À propos', aboutText: 'OROLADO Tools est un espace gratuit pour s’entraîner à lire un graphique et préparer ses trades : entraînement à la prédiction, calcul des gains et gestion du risque. Aucune inscription n’est nécessaire.', warn: 'Le trading comporte des risques de perte. Ne misez jamais plus que ce que vous pouvez vous permettre de perdre.', demo: 'Ouvrir un compte démo gratuit sur OROLADO' },
  en: { title: 'OROLADO Tools — Price Prediction Trainer & Trading Calculators', desc: 'Practise reading charts: predict whether the next candle goes up or down. Free profit and risk-management calculators, no sign-up needed.', brand: 'OROLADO Tools', lang: 'Language', tabPred: 'Prediction', tabGain: 'Profit', tabRisk: 'Risk', tabAbout: 'About', predHead: 'Prediction trainer', predSub: 'Will the next candle go up or down?', up: 'Up', down: 'Down', round: 'Round', score: 'Score', right: 'Well spotted!', wrong: 'Missed…', resTitle: 'Your result', acc: 'Accuracy', resText: 'These charts follow chance, just like real markets: nobody wins every time. What makes the difference is how you manage your money.', again: 'Play again', tryReal: 'Try it on a real chart (free demo)', gainHead: 'Profit calculator', stake: 'Stake ($)', payout: 'Payout rate (%)', ifWin: 'Profit if you win', ifLose: 'Loss if you lose', back: 'Amount received if you win', breakeven: 'Minimum win rate to break even', gainNote: 'The higher the payout rate, the lower the win rate you need.', riskHead: 'Risk management', capital: 'Capital ($)', riskPct: 'Risk per trade', advised: 'Suggested stake per trade', streak: 'Losses in a row before losing half your capital', riskNote: 'Careful traders risk 1 to 2% of their capital per trade.', aboutHead: 'About', aboutText: 'OROLADO Tools is a free space to practise reading charts and plan your trades: prediction trainer, profit calculator and risk management. No sign-up required.', warn: 'Trading involves a risk of loss. Never stake more than you can afford to lose.', demo: 'Open a free demo account on OROLADO' },
  es: { title: 'OROLADO Tools — Entrenamiento de predicción en trading y calculadoras', desc: 'Practica la lectura de gráficos: predice si la próxima vela sube o baja. Calculadoras gratuitas de ganancias y gestión del riesgo, sin registro.', brand: 'OROLADO Tools', lang: 'Idioma', tabPred: 'Predicción', tabGain: 'Ganancias', tabRisk: 'Riesgo', tabAbout: 'Acerca de', predHead: 'Entrenamiento de predicción', predSub: '¿La próxima vela subirá o bajará?', up: 'Sube', down: 'Baja', round: 'Ronda', score: 'Puntos', right: '¡Bien visto!', wrong: 'Fallaste…', resTitle: 'Tu resultado', acc: 'Precisión', resText: 'Estos gráficos siguen el azar, como los mercados reales: nadie gana siempre. Lo que marca la diferencia es cómo gestionas tu dinero.', again: 'Jugar de nuevo', tryReal: 'Probar en un gráfico real (demo gratis)', gainHead: 'Calculadora de ganancias', stake: 'Inversión ($)', payout: 'Tasa de pago (%)', ifWin: 'Ganancia si aciertas', ifLose: 'Pérdida si fallas', back: 'Importe recibido si aciertas', breakeven: 'Tasa de acierto mínima para no perder', gainNote: 'Cuanto mayor es la tasa de pago, menor es la tasa de acierto necesaria.', riskHead: 'Gestión del riesgo', capital: 'Capital ($)', riskPct: 'Riesgo por operación', advised: 'Inversión aconsejada por operación', streak: 'Pérdidas seguidas antes de perder la mitad del capital', riskNote: 'Los traders prudentes arriesgan del 1 al 2 % de su capital por operación.', aboutHead: 'Acerca de', aboutText: 'OROLADO Tools es un espacio gratuito para practicar la lectura de gráficos y preparar tus operaciones: entrenamiento de predicción, cálculo de ganancias y gestión del riesgo. No requiere registro.', warn: 'El trading implica riesgo de pérdida. Nunca inviertas más de lo que puedes permitirte perder.', demo: 'Abrir una cuenta demo gratis en OROLADO' },
  pt: { title: 'OROLADO Tools — Treino de previsão em trading e calculadoras', desc: 'Pratique a leitura de gráficos: preveja se a próxima vela sobe ou desce. Calculadoras gratuitas de ganhos e gestão de risco, sem cadastro.', brand: 'OROLADO Tools', lang: 'Idioma', tabPred: 'Previsão', tabGain: 'Ganhos', tabRisk: 'Risco', tabAbout: 'Sobre', predHead: 'Treino de previsão', predSub: 'A próxima vela vai subir ou descer?', up: 'Sobe', down: 'Desce', round: 'Rodada', score: 'Pontos', right: 'Acertou!', wrong: 'Errou…', resTitle: 'Seu resultado', acc: 'Precisão', resText: 'Estes gráficos seguem o acaso, como os mercados reais: ninguém ganha sempre. O que faz a diferença é a gestão do seu dinheiro.', again: 'Jogar de novo', tryReal: 'Testar num gráfico real (demo grátis)', gainHead: 'Calculadora de ganhos', stake: 'Valor ($)', payout: 'Taxa de retorno (%)', ifWin: 'Ganho se acertar', ifLose: 'Perda se errar', back: 'Valor recebido se acertar', breakeven: 'Taxa de acerto mínima para não perder', gainNote: 'Quanto maior a taxa de retorno, menor a taxa de acerto necessária.', riskHead: 'Gestão de risco', capital: 'Capital ($)', riskPct: 'Risco por operação', advised: 'Valor aconselhado por operação', streak: 'Perdas seguidas antes de perder metade do capital', riskNote: 'Traders prudentes arriscam de 1 a 2% do capital por operação.', aboutHead: 'Sobre', aboutText: 'OROLADO Tools é um espaço gratuito para praticar a leitura de gráficos e preparar suas operações: treino de previsão, cálculo de ganhos e gestão de risco. Sem cadastro.', warn: 'O trading envolve risco de perda. Nunca invista mais do que pode perder.', demo: 'Abrir uma conta demo grátis na OROLADO' },
  ar: { title: 'OROLADO Tools — تدريب على توقع الأسعار في التداول وحاسبات', desc: 'تدرّب على قراءة الرسم البياني: توقّع هل الشمعة التالية ستصعد أم ستهبط. حاسبات مجانية للأرباح وإدارة المخاطر، بدون تسجيل.', brand: 'OROLADO Tools', lang: 'اللغة', tabPred: 'التوقع', tabGain: 'الأرباح', tabRisk: 'المخاطر', tabAbout: 'حول', predHead: 'تدريب على التوقع', predSub: 'هل ستصعد الشمعة التالية أم ستهبط؟', up: 'صعود', down: 'هبوط', round: 'الجولة', score: 'النقاط', right: 'أحسنت!', wrong: 'خطأ…', resTitle: 'نتيجتك', acc: 'الدقة', resText: 'تتبع هذه الرسوم الصدفة، مثل الأسواق الحقيقية: لا أحد يربح في كل مرة. ما يصنع الفرق هو إدارة أموالك.', again: 'العب مجددًا', tryReal: 'جرّب على رسم بياني حقيقي (حساب تجريبي مجاني)', gainHead: 'حاسبة الأرباح', stake: 'المبلغ ($)', payout: 'نسبة العائد (%)', ifWin: 'الربح عند الفوز', ifLose: 'الخسارة عند الخسارة', back: 'المبلغ المستلم عند الفوز', breakeven: 'أدنى نسبة نجاح لعدم الخسارة', gainNote: 'كلما ارتفعت نسبة العائد، انخفضت نسبة النجاح المطلوبة.', riskHead: 'إدارة المخاطر', capital: 'رأس المال ($)', riskPct: 'المخاطرة في كل صفقة', advised: 'المبلغ المقترح لكل صفقة', streak: 'عدد الخسائر المتتالية قبل خسارة نصف رأس المال', riskNote: 'يخاطر المتداولون الحذرون بنسبة 1 إلى 2٪ من رأس مالهم في كل صفقة.', aboutHead: 'حول', aboutText: 'OROLADO Tools مساحة مجانية للتدرّب على قراءة الرسوم البيانية والتحضير لصفقاتك: تدريب على التوقع، حساب الأرباح وإدارة المخاطر. لا حاجة للتسجيل.', warn: 'ينطوي التداول على خطر الخسارة. لا تخاطر أبدًا بأكثر مما يمكنك تحمّل خسارته.', demo: 'افتح حسابًا تجريبيًا مجانيًا على OROLADO' },
  tr: { title: 'OROLADO Tools — Trading fiyat tahmini antrenmanı ve hesaplayıcılar', desc: 'Grafik okumayı çalışın: bir sonraki mumun yükselip düşeceğini tahmin edin. Ücretsiz kazanç ve risk yönetimi hesaplayıcıları, kayıt gerekmez.', brand: 'OROLADO Tools', lang: 'Dil', tabPred: 'Tahmin', tabGain: 'Kazanç', tabRisk: 'Risk', tabAbout: 'Hakkında', predHead: 'Tahmin antrenmanı', predSub: 'Bir sonraki mum yükselecek mi, düşecek mi?', up: 'Yükseliş', down: 'Düşüş', round: 'Tur', score: 'Puan', right: 'Doğru tahmin!', wrong: 'Kaçırdınız…', resTitle: 'Sonucunuz', acc: 'Doğruluk', resText: 'Bu grafikler gerçek piyasalar gibi tesadüfe göre hareket eder: kimse her seferinde kazanmaz. Farkı yaratan, paranızı nasıl yönettiğinizdir.', again: 'Tekrar oyna', tryReal: 'Gerçek bir grafikte deneyin (ücretsiz demo)', gainHead: 'Kazanç hesaplayıcı', stake: 'Tutar ($)', payout: 'Ödeme oranı (%)', ifWin: 'Kazanırsanız kâr', ifLose: 'Kaybederseniz zarar', back: 'Kazanırsanız alacağınız tutar', breakeven: 'Zarar etmemek için gereken en düşük başarı oranı', gainNote: 'Ödeme oranı ne kadar yüksekse, gereken başarı oranı o kadar düşüktür.', riskHead: 'Risk yönetimi', capital: 'Sermaye ($)', riskPct: 'İşlem başına risk', advised: 'İşlem başına önerilen tutar', streak: 'Sermayenin yarısını kaybetmeden önceki art arda kayıp sayısı', riskNote: 'Temkinli yatırımcılar işlem başına sermayelerinin %1–2’sini riske eder.', aboutHead: 'Hakkında', aboutText: 'OROLADO Tools, grafik okumayı çalışmak ve işlemlerinizi hazırlamak için ücretsiz bir alandır: tahmin antrenmanı, kazanç hesabı ve risk yönetimi. Kayıt gerekmez.', warn: 'Trading kayıp riski içerir. Kaybetmeyi göze alabileceğinizden fazlasını asla yatırmayın.', demo: 'OROLADO’da ücretsiz demo hesap açın' },
  de: { title: 'OROLADO Tools — Trading-Prognosetraining und Rechner', desc: 'Üben Sie das Lesen von Charts: Sagen Sie voraus, ob die nächste Kerze steigt oder fällt. Kostenlose Gewinn- und Risikorechner, ohne Anmeldung.', brand: 'OROLADO Tools', lang: 'Sprache', tabPred: 'Prognose', tabGain: 'Gewinn', tabRisk: 'Risiko', tabAbout: 'Über uns', predHead: 'Prognosetraining', predSub: 'Steigt oder fällt die nächste Kerze?', up: 'Steigt', down: 'Fällt', round: 'Runde', score: 'Punkte', right: 'Gut erkannt!', wrong: 'Daneben…', resTitle: 'Ihr Ergebnis', acc: 'Trefferquote', resText: 'Diese Charts folgen dem Zufall, wie echte Märkte: Niemand gewinnt jedes Mal. Den Unterschied macht Ihr Umgang mit Geld.', again: 'Nochmal spielen', tryReal: 'Auf einem echten Chart testen (kostenlose Demo)', gainHead: 'Gewinnrechner', stake: 'Einsatz ($)', payout: 'Auszahlungsquote (%)', ifWin: 'Gewinn bei Erfolg', ifLose: 'Verlust bei Misserfolg', back: 'Auszahlung bei Erfolg', breakeven: 'Mindest-Trefferquote, um nicht zu verlieren', gainNote: 'Je höher die Auszahlungsquote, desto niedriger die nötige Trefferquote.', riskHead: 'Risikomanagement', capital: 'Kapital ($)', riskPct: 'Risiko pro Trade', advised: 'Empfohlener Einsatz pro Trade', streak: 'Verluste in Folge, bis die Hälfte des Kapitals weg ist', riskNote: 'Vorsichtige Trader riskieren 1 bis 2 % ihres Kapitals pro Trade.', aboutHead: 'Über uns', aboutText: 'OROLADO Tools ist ein kostenloser Bereich, um Charts lesen zu üben und Trades vorzubereiten: Prognosetraining, Gewinnberechnung und Risikomanagement. Keine Anmeldung nötig.', warn: 'Trading birgt Verlustrisiken. Setzen Sie nie mehr ein, als Sie sich leisten können zu verlieren.', demo: 'Kostenloses Demokonto bei OROLADO eröffnen' },
  ru: { title: 'OROLADO Tools — Тренажёр прогноза цены в трейдинге и калькуляторы', desc: 'Учитесь читать график: угадайте, вырастет или упадёт следующая свеча. Бесплатные калькуляторы прибыли и управления риском, без регистрации.', brand: 'OROLADO Tools', lang: 'Язык', tabPred: 'Прогноз', tabGain: 'Прибыль', tabRisk: 'Риск', tabAbout: 'О сайте', predHead: 'Тренажёр прогноза', predSub: 'Следующая свеча вырастет или упадёт?', up: 'Рост', down: 'Падение', round: 'Раунд', score: 'Очки', right: 'Верно!', wrong: 'Мимо…', resTitle: 'Ваш результат', acc: 'Точность', resText: 'Эти графики подчиняются случайности, как и настоящие рынки: никто не выигрывает каждый раз. Разницу создаёт управление деньгами.', again: 'Сыграть ещё', tryReal: 'Попробовать на настоящем графике (бесплатное демо)', gainHead: 'Калькулятор прибыли', stake: 'Сумма ($)', payout: 'Доходность (%)', ifWin: 'Прибыль при выигрыше', ifLose: 'Убыток при проигрыше', back: 'Сумма к получению при выигрыше', breakeven: 'Минимальный процент успеха, чтобы не терять', gainNote: 'Чем выше доходность, тем ниже нужный процент успешных сделок.', riskHead: 'Управление риском', capital: 'Капитал ($)', riskPct: 'Риск на сделку', advised: 'Рекомендуемая сумма сделки', streak: 'Убытков подряд до потери половины капитала', riskNote: 'Осторожные трейдеры рискуют 1–2 % капитала в одной сделке.', aboutHead: 'О сайте', aboutText: 'OROLADO Tools — бесплатное пространство, чтобы учиться читать графики и готовить сделки: тренажёр прогноза, расчёт прибыли и управление риском. Регистрация не нужна.', warn: 'Трейдинг связан с риском потерь. Никогда не рискуйте суммой, которую не можете позволить себе потерять.', demo: 'Открыть бесплатный демо-счёт на OROLADO' },
  id: { title: 'OROLADO Tools — Latihan Prediksi Harga Trading & Kalkulator', desc: 'Latih cara membaca grafik: tebak apakah lilin berikutnya naik atau turun. Kalkulator keuntungan dan manajemen risiko gratis, tanpa daftar.', brand: 'OROLADO Tools', lang: 'Bahasa', tabPred: 'Prediksi', tabGain: 'Keuntungan', tabRisk: 'Risiko', tabAbout: 'Tentang', predHead: 'Latihan prediksi', predSub: 'Apakah lilin berikutnya akan naik atau turun?', up: 'Naik', down: 'Turun', round: 'Ronde', score: 'Skor', right: 'Tepat!', wrong: 'Meleset…', resTitle: 'Hasil Anda', acc: 'Akurasi', resText: 'Grafik ini mengikuti peluang acak, seperti pasar sungguhan: tidak ada yang selalu menang. Yang membedakan adalah cara Anda mengelola uang.', again: 'Main lagi', tryReal: 'Coba di grafik sungguhan (demo gratis)', gainHead: 'Kalkulator keuntungan', stake: 'Nominal ($)', payout: 'Tingkat pembayaran (%)', ifWin: 'Untung jika menang', ifLose: 'Rugi jika kalah', back: 'Jumlah diterima jika menang', breakeven: 'Tingkat menang minimum agar tidak rugi', gainNote: 'Semakin tinggi tingkat pembayaran, semakin rendah tingkat menang yang dibutuhkan.', riskHead: 'Manajemen risiko', capital: 'Modal ($)', riskPct: 'Risiko per transaksi', advised: 'Nominal yang disarankan per transaksi', streak: 'Kekalahan beruntun sebelum kehilangan setengah modal', riskNote: 'Trader yang berhati-hati mempertaruhkan 1–2% modal per transaksi.', aboutHead: 'Tentang', aboutText: 'OROLADO Tools adalah ruang gratis untuk berlatih membaca grafik dan menyiapkan transaksi: latihan prediksi, hitung keuntungan, dan manajemen risiko. Tanpa pendaftaran.', warn: 'Trading mengandung risiko kerugian. Jangan pernah mempertaruhkan lebih dari yang sanggup Anda rugikan.', demo: 'Buka akun demo gratis di OROLADO' },
  vi: { title: 'OROLADO Tools — Luyện dự đoán giá trong giao dịch & Công cụ tính', desc: 'Luyện đọc biểu đồ: đoán cây nến tiếp theo tăng hay giảm. Công cụ tính lợi nhuận và quản lý rủi ro miễn phí, không cần đăng ký.', brand: 'OROLADO Tools', lang: 'Ngôn ngữ', tabPred: 'Dự đoán', tabGain: 'Lợi nhuận', tabRisk: 'Rủi ro', tabAbout: 'Giới thiệu', predHead: 'Luyện dự đoán', predSub: 'Cây nến tiếp theo sẽ tăng hay giảm?', up: 'Tăng', down: 'Giảm', round: 'Vòng', score: 'Điểm', right: 'Chính xác!', wrong: 'Trượt rồi…', resTitle: 'Kết quả của bạn', acc: 'Độ chính xác', resText: 'Các biểu đồ này diễn biến ngẫu nhiên, giống thị trường thật: không ai thắng mọi lúc. Điều tạo nên khác biệt là cách bạn quản lý tiền.', again: 'Chơi lại', tryReal: 'Thử trên biểu đồ thật (demo miễn phí)', gainHead: 'Tính lợi nhuận', stake: 'Số tiền ($)', payout: 'Tỷ lệ trả thưởng (%)', ifWin: 'Lãi nếu thắng', ifLose: 'Lỗ nếu thua', back: 'Số tiền nhận được nếu thắng', breakeven: 'Tỷ lệ thắng tối thiểu để không lỗ', gainNote: 'Tỷ lệ trả thưởng càng cao, tỷ lệ thắng cần thiết càng thấp.', riskHead: 'Quản lý rủi ro', capital: 'Vốn ($)', riskPct: 'Rủi ro mỗi lệnh', advised: 'Số tiền gợi ý mỗi lệnh', streak: 'Số lần thua liên tiếp trước khi mất nửa số vốn', riskNote: 'Người giao dịch thận trọng chỉ mạo hiểm 1–2% vốn cho mỗi lệnh.', aboutHead: 'Giới thiệu', aboutText: 'OROLADO Tools là không gian miễn phí để luyện đọc biểu đồ và chuẩn bị giao dịch: luyện dự đoán, tính lợi nhuận và quản lý rủi ro. Không cần đăng ký.', warn: 'Giao dịch có rủi ro thua lỗ. Đừng bao giờ đặt nhiều hơn số tiền bạn có thể chấp nhận mất.', demo: 'Mở tài khoản demo miễn phí tại OROLADO' },
  hi: { title: 'OROLADO Tools — ट्रेडिंग मूल्य अनुमान अभ्यास और कैलकुलेटर', desc: 'चार्ट पढ़ने का अभ्यास करें: अनुमान लगाएं कि अगली कैंडल ऊपर जाएगी या नीचे। मुनाफ़े और जोखिम प्रबंधन के मुफ़्त कैलकुलेटर, बिना साइन-अप।', brand: 'OROLADO Tools', lang: 'भाषा', tabPred: 'अनुमान', tabGain: 'मुनाफ़ा', tabRisk: 'जोखिम', tabAbout: 'परिचय', predHead: 'अनुमान अभ्यास', predSub: 'अगली कैंडल ऊपर जाएगी या नीचे?', up: 'ऊपर', down: 'नीचे', round: 'राउंड', score: 'स्कोर', right: 'सही पहचाना!', wrong: 'चूक गए…', resTitle: 'आपका परिणाम', acc: 'सटीकता', resText: 'ये चार्ट असली बाज़ार की तरह संयोग पर चलते हैं: कोई भी हर बार नहीं जीतता। फ़र्क़ इस बात से पड़ता है कि आप अपने पैसे कैसे संभालते हैं।', again: 'फिर से खेलें', tryReal: 'असली चार्ट पर आज़माएं (मुफ़्त डेमो)', gainHead: 'मुनाफ़ा कैलकुलेटर', stake: 'राशि ($)', payout: 'भुगतान दर (%)', ifWin: 'जीतने पर मुनाफ़ा', ifLose: 'हारने पर नुकसान', back: 'जीतने पर मिलने वाली राशि', breakeven: 'नुकसान से बचने के लिए न्यूनतम सफलता दर', gainNote: 'भुगतान दर जितनी अधिक होगी, ज़रूरी सफलता दर उतनी कम होगी।', riskHead: 'जोखिम प्रबंधन', capital: 'पूंजी ($)', riskPct: 'प्रति ट्रेड जोखिम', advised: 'प्रति ट्रेड सुझाई गई राशि', streak: 'आधी पूंजी गंवाने से पहले लगातार हार', riskNote: 'सावधान ट्रेडर हर ट्रेड में अपनी पूंजी का 1–2% ही जोखिम में डालते हैं।', aboutHead: 'परिचय', aboutText: 'OROLADO Tools चार्ट पढ़ने का अभ्यास करने और ट्रेड की तैयारी के लिए एक मुफ़्त जगह है: अनुमान अभ्यास, मुनाफ़े की गणना और जोखिम प्रबंधन। साइन-अप की ज़रूरत नहीं।', warn: 'ट्रेडिंग में नुकसान का जोखिम होता है। उतना ही लगाएं जितना खोना आप सह सकें।', demo: 'OROLADO पर मुफ़्त डेमो खाता खोलें' }
};

module.exports = { site, body, script, TXT };
