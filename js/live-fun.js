/* v2687 — Live : JEUX DU JOUR (démo uniquement) — Roue du jour, Quiz du jour, Mes statistiques, Mes badges.
   Tout est vérifié par le serveur (live.php : fun / wheel / quiz / mystats) : une roue et un quiz par jour,
   gains sur le solde DÉMO seulement (aucune valeur réelle). Léger : rien ne tourne quand la page est fermée. */
(function (D6) {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var WHEEL = [1000, 1000, 2000, 2000, 3000, 5000, 5000, 10000, 20000, 50000];
  var T = {
    fr: {
      wheel: ['Roue du jour', 'Un tour gratuit par jour'], quiz: ['Quiz du jour', 'Une question, 5 000 $ démo'], stats: ['Mes statistiques', 'Ta réussite en chiffres'], badges: ['Mes badges', 'Débloque-les tous'],
      spin: 'Tourner la roue', spun: 'Reviens demain pour un nouveau tour !', won: 'Bravo ! +{p} $ sur ton compte démo 🎉', wheelS: 'Gagne entre 1 000 $ et 50 000 $ de démo. Un tour par jour.',
      quizS: 'Bonne réponse = +5 000 $ sur ton compte démo.', good: 'Bonne réponse ! +5 000 $ démo 🎉', bad: 'Raté ! La bonne réponse est en vert. Reviens demain.', quizDone: 'Quiz fait aujourd’hui. Reviens demain !',
      sTrades: 'Trades', sRate: 'Réussite', sBest: 'Meilleure série', sFav: 'Marché préféré', sDuels: 'Défis gagnés', sNote: 'Calculé sur tes trades récents (démo et réel).', none: '—',
      login: 'Inscris-toi pour jouer', loginB: 'Crée ton compte gratuit pour tourner la roue, faire le quiz et gagner des badges.', loginBtn: 'Créer mon compte',
      b: { first: ['Premier pas', '1er trade'], t10: ['Lancé', '10 trades'], t100: ['Habitué', '100 trades'], streak5: ['En feu', '5 gains d’affilée'], sharp: ['Précis', '55 % de réussite (20 trades)'],
        duel: ['Champion', '1er défi gagné'], friend: ['Sociable', '1er ami'], wheel: ['Chanceux', 'Roue tournée'], quiz: ['Malin', 'Quiz réussi'], real: ['Pro', '1er trade réel'] },
      q: [
        ['Que se passe-t-il si tu touches ACHETER ?', ['Tu gagnes si le prix baisse', 'Tu gagnes si le prix finit au-dessus de la ligne', 'Tu gagnes toujours']],
        ['Quelle mise est la plus prudente ?', ['2 à 5 % de ton solde', 'Tout ton solde d’un coup', 'Le double après chaque perte']],
        ['À quoi sert le compte DÉMO ?', ['Gagner de l’argent réel', 'Retirer des gains', 'S’entraîner sans risque']],
        ['Si le prix finit exactement sur la ligne ?', ['Tu perds', 'Ta mise est rendue', 'Tu gagnes le double']],
        ['Que montrent les indicateurs MA, BB et EMA ?', ['Le solde des autres joueurs', 'L’heure', 'La tendance du marché']],
        ['Après 3 pertes d’affilée, le mieux est de…', ['Faire une pause et analyser', 'Doubler la mise', 'Tout miser']],
        ['VENDRE (PUT) gagne si le prix final est…', ['Au-dessus de la ligne', 'En dessous de la ligne', 'Égal à la ligne']],
        ['Combien de marchés propose OROLADO ?', ['3', '5', '10']],
        ['Avant de retirer, il faut avoir misé…', ['2 fois tes dépôts', '10 fois tes dépôts', 'Rien du tout']],
        ['Avec un payout de 90 %, une mise de 10 $ gagnante te rend…', ['9 $ en tout', '19 $ (10 $ + 9 $)', '90 $']],
        ['Qui peut connaître ton mot de passe ?', ['L’équipe OROLADO', 'Tes amis', 'Personne : ne le donne jamais']],
        ['Le « Défie ton ami » se joue avec…', ['De l’argent réel', 'L’argent démo', 'Des cadeaux']]
      ]
    },
    en: {
      wheel: ['Daily wheel', 'One free spin a day'], quiz: ['Daily quiz', 'One question, $5,000 demo'], stats: ['My stats', 'Your success in numbers'], badges: ['My badges', 'Unlock them all'],
      spin: 'Spin the wheel', spun: 'Come back tomorrow for a new spin!', won: 'Well done! +${p} on your demo account 🎉', wheelS: 'Win between $1,000 and $50,000 demo. One spin a day.',
      quizS: 'Right answer = +$5,000 on your demo account.', good: 'Right answer! +$5,000 demo 🎉', bad: 'Missed! The right answer is in green. Come back tomorrow.', quizDone: 'Quiz done today. Come back tomorrow!',
      sTrades: 'Trades', sRate: 'Success', sBest: 'Best streak', sFav: 'Favourite market', sDuels: 'Challenges won', sNote: 'Based on your recent trades (demo and real).', none: '—',
      login: 'Sign up to play', loginB: 'Create your free account to spin the wheel, take the quiz and earn badges.', loginBtn: 'Create my account',
      b: { first: ['First step', '1st trade'], t10: ['On a roll', '10 trades'], t100: ['Regular', '100 trades'], streak5: ['On fire', '5 wins in a row'], sharp: ['Sharp', '55% success (20 trades)'],
        duel: ['Champion', '1st challenge won'], friend: ['Social', '1st friend'], wheel: ['Lucky', 'Wheel spun'], quiz: ['Smart', 'Quiz passed'], real: ['Pro', '1st real trade'] },
      q: [
        ['What happens if you tap BUY?', ['You win if the price falls', 'You win if the price ends above the line', 'You always win']],
        ['Which stake is the most careful?', ['2 to 5% of your balance', 'Your whole balance at once', 'Double after every loss']],
        ['What is the DEMO account for?', ['Winning real money', 'Withdrawing gains', 'Practising with no risk']],
        ['If the price ends exactly on the line?', ['You lose', 'Your stake is returned', 'You win double']],
        ['What do the MA, BB and EMA indicators show?', ['Other players’ balances', 'The time', 'The market trend']],
        ['After 3 losses in a row, the best is to…', ['Take a break and analyse', 'Double your stake', 'Bet everything']],
        ['SELL (PUT) wins if the final price is…', ['Above the line', 'Below the line', 'Equal to the line']],
        ['How many markets does OROLADO offer?', ['3', '5', '10']],
        ['Before withdrawing, you must have wagered…', ['2 times your deposits', '10 times your deposits', 'Nothing at all']],
        ['With a 90% payout, a winning $10 stake gives you back…', ['$9 in total', '$19 ($10 + $9)', '$90']],
        ['Who can know your password?', ['The OROLADO team', 'Your friends', 'Nobody: never give it']],
        ['“Challenge a friend” is played with…', ['Real money', 'Demo money', 'Gifts']]
      ]
    },
    zh: {
      wheel: ['每日转盘', '每天免费转一次'], quiz: ['每日问答', '答对得 5000 美元模拟金'], stats: ['我的统计', '用数字看你的表现'], badges: ['我的徽章', '全部解锁'],
      spin: '转动转盘', spun: '明天再来转一次！', won: '恭喜！模拟账户 +{p} 美元 🎉', wheelS: '赢取 1000 至 50000 美元模拟金。每天一次。',
      quizS: '答对 = 模拟账户 +5000 美元。', good: '答对了！+5000 美元模拟金 🎉', bad: '答错了！正确答案显示为绿色。明天再来。', quizDone: '今天已答题，明天再来！',
      sTrades: '交易数', sRate: '成功率', sBest: '最长连胜', sFav: '最爱市场', sDuels: '挑战胜场', sNote: '根据你最近的交易计算（模拟与真实）。', none: '—',
      login: '注册即可参与', loginB: '免费创建账户，即可转转盘、答问答、赢取徽章。', loginBtn: '创建账户',
      b: { first: ['第一步', '首笔交易'], t10: ['起步', '10 笔交易'], t100: ['老手', '100 笔交易'], streak5: ['火力全开', '连赢 5 笔'], sharp: ['精准', '成功率 55%（20 笔）'],
        duel: ['冠军', '首次赢得挑战'], friend: ['社交达人', '第一位好友'], wheel: ['幸运儿', '转过转盘'], quiz: ['聪明', '答对问答'], real: ['专业', '首笔真实交易'] },
      q: [
        ['点击「买入」会怎样？', ['价格下跌你就赢', '价格收在线上方你就赢', '你总是赢']],
        ['哪种投注最稳妥？', ['余额的 2% 到 5%', '一次投入全部余额', '每次亏损后加倍']],
        ['模拟账户有什么用？', ['赚真钱', '提取收益', '零风险练习']],
        ['如果价格正好收在线上？', ['你输了', '退还投注额', '你赢双倍']],
        ['MA、BB、EMA 指标显示什么？', ['其他玩家的余额', '时间', '市场趋势']],
        ['连输 3 次后，最好…', ['休息一下并分析', '加倍投注', '全部押上']],
        ['「卖出」（PUT）在最终价格…时获胜', ['高于线', '低于线', '等于线']],
        ['OROLADO 提供多少个市场？', ['3', '5', '10']],
        ['提现前，你需要累计投注…', ['充值额的 2 倍', '充值额的 10 倍', '无需投注']],
        ['收益率 90% 时，10 美元投注获胜后返还…', ['共 9 美元', '19 美元（10 + 9）', '90 美元']],
        ['谁可以知道你的密码？', ['OROLADO 团队', '你的好友', '没有人：永远不要透露']],
        ['「挑战好友」使用…进行', ['真钱', '模拟资金', '礼物']]
      ]
    }
  };
  var BADGE_ICO = { first: '👣', t10: '🚀', t100: '🎖️', streak5: '🔥', sharp: '🎯', duel: '🏆', friend: '🤝', wheel: '🍀', quiz: '🧠', real: '💎' };
  function X() { var l = (document.documentElement.lang || 'fr').slice(0, 2); return T[l] || T.en; }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function nf(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' '); }
  function guest() { return document.documentElement.classList.contains('oro-guest') || !(D6.Api && D6.Api.token && D6.Api.token()); }
  async function call(action, data) {
    try {
      var r = await fetch('live.php', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin', cache: 'no-store',
        body: JSON.stringify(Object.assign({ action: action, token: (D6.Api && D6.Api.token) ? D6.Api.token() : '' }, data || {})) });
      return await r.json();
    } catch (e) { return null; }
  }
  function refreshBalance() { try { if (D6.App && D6.App.onRemoteAccount) D6.App.onRemoteAccount(); } catch (e) { /* ignore */ } }
  function loginCard(box) {
    var x = X();
    box.innerHTML = '<div class="lfun-card center"><div class="lfun-big">🎮</div><b>' + esc(x.login) + '</b><p>' + esc(x.loginB) + '</p><button type="button" class="lfun-go" id="lfunSign">' + esc(x.loginBtn) + '</button></div>';
    $('lfunSign').addEventListener('click', function () { if (D6.Live && D6.Live.close) D6.Live.close(); if (D6.App && D6.App.showAuth) D6.App.showAuth('register'); });
  }

  async function wheel(box) {
    var x = X();
    var segs = WHEEL.map(function (p, i) { return '<span class="wseg" style="transform:rotate(' + (i * 36) + 'deg)"><em>' + (p >= 1000 ? (p / 1000) + 'K' : p) + '</em></span>'; }).join('');
    box.innerHTML = '<div class="lfun-card center"><p>' + esc(x.wheelS) + '</p><div class="wheel-wrap"><div class="wheel-pin"></div><div class="wheel" id="lfunWheel">' + segs + '</div><div class="wheel-hub">🎡</div></div>' +
      '<button type="button" class="lfun-go" id="lfunSpin">' + esc(x.spin) + '</button><p class="lfun-res" id="lfunRes"></p></div>';
    var st = await call('fun', {});
    if (st && st.ok && !st.wheel) { $('lfunSpin').disabled = true; $('lfunRes').textContent = x.spun; }
    $('lfunSpin').addEventListener('click', async function () {
      var b = this; b.disabled = true;
      var r = await call('wheel', {});
      if (!r || !r.ok) { $('lfunRes').textContent = x.spun; return; }
      var w = $('lfunWheel');
      // L'aiguille est en haut : on amène le segment gagnant sous l'aiguille (5 tours + angle du segment).
      w.style.transform = 'rotate(' + (5 * 360 + (360 - r.i * 36)) + 'deg)';
      setTimeout(function () { $('lfunRes').textContent = x.won.replace('{p}', nf(r.prize)); $('lfunRes').classList.add('win'); refreshBalance(); }, 4300);
    });
  }

  async function quiz(box) {
    var x = X();
    var st = await call('fun', {});
    if (!st || !st.ok) return;
    var q = x.q[st.q % x.q.length];
    box.innerHTML = '<div class="lfun-card"><p class="lfun-sub">' + esc(x.quizS) + '</p><b class="lfun-q">' + esc(q[0]) + '</b><div class="lfun-opts">' +
      q[1].map(function (o, i) { return '<button type="button" data-i="' + i + '">' + esc(o) + '</button>'; }).join('') + '</div><p class="lfun-res" id="lfunRes"></p></div>';
    if (!st.quiz) { box.querySelectorAll('.lfun-opts button').forEach(function (b) { b.disabled = true; }); $('lfunRes').textContent = x.quizDone; return; }
    box.querySelectorAll('.lfun-opts button').forEach(function (b) {
      b.addEventListener('click', async function () {
        box.querySelectorAll('.lfun-opts button').forEach(function (z) { z.disabled = true; });
        var r = await call('quiz', { pick: +b.getAttribute('data-i') });
        if (!r || !r.ok) { $('lfunRes').textContent = x.quizDone; return; }
        var all = box.querySelectorAll('.lfun-opts button');
        if (all[r.right]) all[r.right].classList.add('ok');
        if (!r.good) b.classList.add('ko');
        $('lfunRes').textContent = r.good ? x.good : x.bad;
        $('lfunRes').classList.toggle('win', !!r.good);
        if (r.good) refreshBalance();
      });
    });
  }

  async function stats(box) {
    var x = X();
    var s = await call('mystats', {});
    if (!s || !s.ok) return;
    var card = function (v, l) { return '<div class="lfun-stat"><b>' + esc(v) + '</b><small>' + esc(l) + '</small></div>'; };
    box.innerHTML = '<div class="lfun-stats">' + card(nf(s.n), x.sTrades) + card(s.rate + ' %', x.sRate) + card(s.best, x.sBest) + card(s.fav ? s.fav.toUpperCase() : x.none, x.sFav) + card(s.duel.w, x.sDuels) + '</div><p class="lfun-note">' + esc(x.sNote) + '</p>';
  }

  async function badges(box) {
    var x = X();
    var s = await call('mystats', {});
    if (!s || !s.ok) return;
    var keys = Object.keys(x.b), got = keys.filter(function (k) { return s.badges[k]; }).length;
    box.innerHTML = '<p class="lfun-note">🏅 ' + got + ' / ' + keys.length + '</p><div class="lfun-badges">' + keys.map(function (k) {
      return '<div class="lfun-badge' + (s.badges[k] ? ' on' : '') + '"><span>' + BADGE_ICO[k] + '</span><b>' + esc(x.b[k][0]) + '</b><small>' + esc(x.b[k][1]) + '</small></div>';
    }).join('') + '</div>';
  }

  function open(kind) {
    var box = $('liveFun');
    if (!box) return;
    box.innerHTML = '';
    if (guest()) { loginCard(box); return; }
    if (kind === 'wheel') wheel(box); else if (kind === 'quiz') quiz(box); else if (kind === 'stats') stats(box); else badges(box);
  }
  D6.LiveFun = { open: open, title: function (k) { var x = X(); return x[k] ? x[k][0] : ''; }, sub: function (k) { var x = X(); return x[k] ? x[k][1] : ''; } };
})(window.D6 = window.D6 || {});
