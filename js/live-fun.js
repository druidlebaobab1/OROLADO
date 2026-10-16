/* v2689 — Live : QUIZ (5 questions par jour, 50 au total), MON NIVEAU, MISSIONS DE LA SEMAINE, MES STATISTIQUES, MES BADGES.
   Tout est vérifié par le serveur (live.php : fun / quiz / mystats). Récompense = points de niveau (aucun argent :
   l'argent démo faussait le tournoi démo). Léger : rien ne tourne quand la page est fermée. */
(function (D6) {
  // v2694 : nom du marché (VOLATILITY, ZUL…) au lieu de son code interne (v100)
  function favName(id) { var a = D6.CONFIG && D6.CONFIG.ASSETS && D6.CONFIG.ASSETS[id]; return String((a && (a.short || a.name)) || id).toUpperCase(); }
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var T = {
    fr: {
      quiz: ['Quiz du jour', '5 questions, des points de niveau'], stats: ['Mes statistiques', 'Ta réussite en chiffres'], badges: ['Mes badges', 'Débloque-les tous'],
      levels: ['Mon niveau', 'Monte jusqu’au sommet'], missions: ['Missions', 'De nouveaux défis chaque semaine'],
      qOf: 'Question {i} sur {n}', good: 'Bonne réponse ! +{x} points', bad: 'Raté ! La bonne réponse est en vert. +{x} points', next: 'Question suivante', finish: 'Voir mon résultat',
      qSum: '{g} bonne(s) réponse(s) sur {n}', qSumS: 'Reviens demain pour 5 nouvelles questions !', qPts: '+{x} points de niveau',
      lvl: 'Niveau {n}', xpTo: '{x} / {t} points', xpMax: 'Niveau maximum atteint 👑', how: 'Comment gagner des points',
      h1: ['Un trade démo', '+1'], h2: ['Un trade réel', '+3'], h3: ['Une bonne réponse au quiz', '+20'], h4: ['Un défi joué / gagné', '+10 / +30'], h5: ['Un ami', '+10'], h6: ['Une mission réussie', '+50'],
      ladder: 'Tous les niveaux', you: 'toi',
      names: ['Débutant', 'Apprenti', 'Trader', 'Confirmé', 'Expert', 'Pro', 'Élite', 'Maître', 'Grand Maître', 'Légende', 'Mythique', 'Roi d’OROLADO'],
      mTitle: 'Missions de la semaine', mSub: 'Nouvelles missions chaque lundi · +{x} points chacune', mDone: 'Réussie ✓',
      m: { trades: 'Fais 20 trades', quiz: 'Réponds à 10 questions du quiz', markets: 'Joue sur 3 marchés différents', streak: 'Gagne 3 trades d’affilée' },
      sTrades: 'Trades', sRate: 'Réussite', sBest: 'Meilleure série', sFav: 'Marché préféré', sDuels: 'Défis gagnés', sQuiz: 'Bonnes réponses', sNote: 'Calculé sur tes trades récents (démo et réel).', none: '—',
      b: { first: ['Premier pas', '1er trade'], t10: ['Lancé', '10 trades'], t100: ['Habitué', '100 trades'], streak5: ['En feu', '5 gains d’affilée'], sharp: ['Précis', '55 % de réussite (20 trades)'],
        duel: ['Champion', '1er défi gagné'], friend: ['Sociable', '1er ami'], quiz: ['Malin', '1re bonne réponse'], quiz50: ['Savant', '50 bonnes réponses'], mission: ['Missionnaire', '1re mission réussie'],
        level5: ['Expert', 'Niveau 5 atteint'], real: ['Pro', '1er trade réel'] }
    },
    en: {
      quiz: ['Daily quiz', '5 questions, level points'], stats: ['My stats', 'Your success in numbers'], badges: ['My badges', 'Unlock them all'],
      levels: ['My level', 'Climb to the top'], missions: ['Missions', 'New challenges every week'],
      qOf: 'Question {i} of {n}', good: 'Right answer! +{x} points', bad: 'Missed! The right answer is in green. +{x} points', next: 'Next question', finish: 'See my result',
      qSum: '{g} right answer(s) out of {n}', qSumS: 'Come back tomorrow for 5 new questions!', qPts: '+{x} level points',
      lvl: 'Level {n}', xpTo: '{x} / {t} points', xpMax: 'Maximum level reached 👑', how: 'How to earn points',
      h1: ['A demo trade', '+1'], h2: ['A real trade', '+3'], h3: ['A right quiz answer', '+20'], h4: ['A challenge played / won', '+10 / +30'], h5: ['A friend', '+10'], h6: ['A mission completed', '+50'],
      ladder: 'All levels', you: 'you',
      names: ['Beginner', 'Apprentice', 'Trader', 'Skilled', 'Expert', 'Pro', 'Elite', 'Master', 'Grand Master', 'Legend', 'Mythic', 'King of OROLADO'],
      mTitle: 'Weekly missions', mSub: 'New missions every Monday · +{x} points each', mDone: 'Done ✓',
      m: { trades: 'Make 20 trades', quiz: 'Answer 10 quiz questions', markets: 'Play on 3 different markets', streak: 'Win 3 trades in a row' },
      sTrades: 'Trades', sRate: 'Success', sBest: 'Best streak', sFav: 'Favourite market', sDuels: 'Challenges won', sQuiz: 'Right answers', sNote: 'Based on your recent trades (demo and real).', none: '—',
      b: { first: ['First step', '1st trade'], t10: ['On a roll', '10 trades'], t100: ['Regular', '100 trades'], streak5: ['On fire', '5 wins in a row'], sharp: ['Sharp', '55% success (20 trades)'],
        duel: ['Champion', '1st challenge won'], friend: ['Social', '1st friend'], quiz: ['Smart', '1st right answer'], quiz50: ['Scholar', '50 right answers'], mission: ['On a mission', '1st mission done'],
        level5: ['Expert', 'Level 5 reached'], real: ['Pro', '1st real trade'] }
    }
  };
  T.zh = Object.assign({}, T.en, {
    quiz: ['每日问答', '5 道题，赢等级积分'], stats: ['我的统计', '用数字看你的表现'], badges: ['我的徽章', '全部解锁'], levels: ['我的等级', '登上巅峰'], missions: ['任务', '每周新挑战'],
    qOf: '第 {i} 题，共 {n} 题', good: '答对了！+{x} 积分', bad: '答错了！正确答案显示为绿色。+{x} 积分', next: '下一题', finish: '查看结果',
    qSum: '答对 {g} 题，共 {n} 题', qSumS: '明天再来答 5 道新题！', qPts: '+{x} 等级积分', lvl: '等级 {n}', xpTo: '{x} / {t} 积分', xpMax: '已达最高等级 👑', how: '如何获得积分',
    h1: ['一笔模拟交易', '+1'], h2: ['一笔真实交易', '+3'], h3: ['答对一道题', '+20'], h4: ['参加 / 赢得一次挑战', '+10 / +30'], h5: ['一位好友', '+10'], h6: ['完成一个任务', '+50'],
    ladder: '全部等级', you: '你', names: ['新手', '学徒', '交易员', '熟练', '专家', '职业', '精英', '大师', '宗师', '传奇', '神话', 'OROLADO 之王'],
    mTitle: '本周任务', mSub: '每周一更新 · 每个任务 +{x} 积分', mDone: '已完成 ✓',
    m: { trades: '完成 20 笔交易', quiz: '回答 10 道问答题', markets: '在 3 个不同市场交易', streak: '连赢 3 笔交易' },
    sTrades: '交易数', sRate: '成功率', sBest: '最长连胜', sFav: '最爱市场', sDuels: '挑战胜场', sQuiz: '答对题数', sNote: '根据你最近的交易计算（模拟与真实）。',
    b: { first: ['第一步', '首笔交易'], t10: ['起步', '10 笔交易'], t100: ['老手', '100 笔交易'], streak5: ['火力全开', '连赢 5 笔'], sharp: ['精准', '成功率 55%（20 笔）'],
      duel: ['冠军', '首次赢得挑战'], friend: ['社交达人', '第一位好友'], quiz: ['聪明', '首次答对'], quiz50: ['学霸', '答对 50 题'], mission: ['任务达人', '首次完成任务'], level5: ['专家', '达到 5 级'], real: ['专业', '首笔真实交易'] }
  });
  (D6.LIVE_T = D6.LIVE_T || {}).fun = T;
  var BADGE_ICO = { first: 'learn', t10: 'stats', t100: 'record', streak5: 'jauge', sharp: 'target', duel: 'duel', friend: 'friends', quiz: 'quiz', quiz50: 'levels', mission: 'gifts', level5: 'badges', real: 'invite' };
  function X() { var l = (document.documentElement.lang || 'fr').slice(0, 2); return T[l] || T.en; }
  function Q() { var l = (document.documentElement.lang || 'fr').slice(0, 2); return (D6.QUIZ && (D6.QUIZ[l] || D6.QUIZ.en)) || []; }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function fmt(s, o) { return String(s).replace(/\{(\w+)\}/g, function (m, k) { return o[k] != null ? o[k] : m; }); }
  function nf(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' '); }
  function ico(k) { return D6.LiveIcon ? D6.LiveIcon(k) : ''; }
  function guest() { return document.documentElement.classList.contains('oro-guest') || !(D6.Api && D6.Api.token && D6.Api.token()); }
  async function call(action, data) {
    try {
      var r = await fetch('live.php', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin', cache: 'no-store',
        body: JSON.stringify(Object.assign({ action: action, token: (D6.Api && D6.Api.token) ? D6.Api.token() : '' }, data || {})) });
      return await r.json();
    } catch (e) { return null; }
  }

  /* ---------- QUIZ ---------- */
  var qs = null, qPos = 0, qGained = 0, qGood = 0;
  async function quiz(box) {
    var my = box._seq, st = await call('fun', {});
    if (!st || !st.ok || box._seq !== my) return;
    qs = st; qGained = 0; qGood = 0;
    var done = st.quizDone || {};
    qPos = st.quizSet.findIndex(function (q) { return done[q] === undefined; });
    if (qPos < 0) { quizSummary(box, true); return; }
    st.quizSet.forEach(function (q) { if (done[q] !== undefined && done[q]) qGood++; });
    quizShow(box);
  }
  function dots() {
    var done = qs.quizDone || {};
    return '<div class="qz-dots">' + qs.quizSet.map(function (q, i) {
      var d = done[q]; return '<i class="' + (d === 1 ? 'ok' : d === 0 ? 'ko' : (i === qPos ? 'cur' : '')) + '"></i>';
    }).join('') + '</div>';
  }
  function quizShow(box) {
    var x = X(), qi = qs.quizSet[qPos], q = Q()[qi] || ['?', ['', '', '']], p = D6.QUIZ.perm(qi);
    box.innerHTML = '<div class="qz">' + dots() + '<small class="qz-of">' + esc(fmt(x.qOf, { i: qPos + 1, n: qs.quizSet.length })) + '</small>' +
      '<div class="qz-card"><span class="qz-ico">' + ico('quiz') + '</span><b class="qz-q">' + esc(q[0]) + '</b></div>' +
      '<div class="qz-opts">' + p.map(function (o, j) { return '<button type="button" data-i="' + j + '"><em>' + 'ABC'.charAt(j) + '</em><span>' + esc(q[1][o]) + '</span></button>'; }).join('') + '</div>' +
      '<p class="qz-res" id="qzRes"></p><button type="button" class="lgu-go qz-next" id="qzNext" hidden style="--tc:#7B3BE6"></button></div>';
    box.querySelectorAll('.qz-opts button').forEach(function (b) {
      b.addEventListener('click', async function () {
        box.querySelectorAll('.qz-opts button').forEach(function (z) { z.disabled = true; });
        var r = await call('quiz', { q: qi, pick: +b.getAttribute('data-i') });
        if (!r || !r.ok) { quiz(box); return; }
        var all = box.querySelectorAll('.qz-opts button');
        if (all[r.right]) all[r.right].classList.add('ok');
        if (!r.good) b.classList.add('ko');
        qs.quizDone[qi] = r.good ? 1 : 0;
        qGained += r.xp; if (r.good) qGood++;
        var res = $('qzRes'); res.textContent = fmt(r.good ? x.good : x.bad, { x: r.xp }); res.className = 'qz-res ' + (r.good ? 'win' : 'lose');
        box.querySelector('.qz-dots').outerHTML = dots();
        var nx = qs.quizSet.findIndex(function (q) { return qs.quizDone[q] === undefined; });
        var btn = $('qzNext'); btn.hidden = false; btn.textContent = nx < 0 ? x.finish : x.next;
        btn.onclick = function () { if (nx < 0) quizSummary(box, false); else { qPos = nx; quizShow(box); } };
      });
    });
  }
  function quizSummary(box, already) {
    var x = X(), n = qs.quizSet.length, g = 0;
    qs.quizSet.forEach(function (q) { if (qs.quizDone[q]) g++; });
    box.innerHTML = '<div class="qz qz-sum">' + dots() + '<span class="qz-big">' + ico('quiz') + '</span><b class="qz-t">' + esc(fmt(x.qSum, { g: g, n: n })) + '</b>' +
      (!already && qGained ? '<p class="qz-pts">' + esc(fmt(x.qPts, { x: qGained })) + '</p>' : '') + '<p class="qz-s">' + esc(x.qSumS) + '</p>' +
      '<button type="button" class="lgu-go" id="qzLvl" style="--tc:#2E8CF0">' + esc(x.levels[0]) + '</button></div>';
    $('qzLvl').addEventListener('click', function () { open('levels'); if ($('liveBarT')) $('liveBarT').textContent = x.levels[0]; });
  }

  /* ---------- NIVEAU ---------- */
  function levelCard(lv, big) {
    var x = X(), name = x.names[lv.level - 1] || '';
    return '<div class="lv-card' + (big ? ' big' : '') + '"><div class="lv-medal"><svg viewBox="0 0 100 100" aria-hidden="true"><defs><linearGradient id="lvG' + (big ? 1 : 0) + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFE9A8"/><stop offset=".55" stop-color="#F2B33D"/><stop offset="1" stop-color="#A8650A"/></linearGradient></defs>' +
      '<path d="M50 4l11 8 13-1 6 12 12 6-1 13 8 11-8 11 1 13-12 6-6 12-13-1-11 8-11-8-13 1-6-12-12-6 1-13-8-11 8-11-1-13 12-6 6-12 13 1z" fill="url(#lvG' + (big ? 1 : 0) + ')"/><circle cx="50" cy="50" r="31" fill="#1b1240" stroke="rgba(255,255,255,.35)" stroke-width="2"/></svg><b>' + lv.level + '</b></div>' +
      '<div class="lv-txt"><small>' + esc(fmt(x.lvl, { n: lv.level })) + '</small><b>' + esc(name) + '</b><div class="lv-bar"><i style="width:' + lv.pct + '%"></i></div><small>' + esc(lv.to ? fmt(x.xpTo, { x: nf(lv.xp), t: nf(lv.to) }) : x.xpMax) + '</small></div></div>';
  }
  async function levels(box) {
    var my = box._seq, s = await call('mystats', {});
    if (!s || !s.ok || box._seq !== my) return;
    var x = X(), lv = s.lv;
    var hows = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].map(function (k) { return '<li><span>' + esc(x[k][0]) + '</span><b>' + esc(x[k][1]) + '</b></li>'; }).join('');
    var ladder = x.names.map(function (n, i) {
      var cls = i + 1 < lv.level ? 'past' : (i + 1 === lv.level ? 'cur' : '');
      return '<li class="' + cls + '"><em>' + (i + 1) + '</em><span>' + esc(n) + '</span>' + (cls === 'cur' ? '<i>' + esc(x.you) + '</i>' : '') + '</li>';
    }).join('');
    box.innerHTML = levelCard(lv, true) + '<b class="lv-h">' + esc(x.how) + '</b><ul class="lv-how">' + hows + '</ul><b class="lv-h">' + esc(x.ladder) + '</b><ol class="lv-ladder">' + ladder + '</ol>';
  }

  /* ---------- MISSIONS ---------- */
  async function missions(box) {
    var my = box._seq, s = await call('mystats', {});
    if (!s || !s.ok || box._seq !== my) return;
    var x = X(), MI = { trades: 'stats', quiz: 'quiz', markets: 'target', streak: 'jauge' };
    box.innerHTML = '<div class="ms-head"><span class="ms-ico">' + ico('gifts') + '</span><div><b>' + esc(x.mTitle) + '</b><small>' + esc(fmt(x.mSub, { x: s.missionXp })) + '</small></div></div>' +
      Object.keys(s.missions).map(function (k) {
        var m = s.missions[k], pct = Math.min(100, Math.round(m.have * 100 / m.need));
        return '<div class="ms-row' + (m.done ? ' done' : '') + '"><span class="ms-i">' + ico(MI[k] || 'target') + '</span><div class="ms-t"><b>' + esc(x.m[k] || k) + '</b><div class="lv-bar"><i style="width:' + pct + '%"></i></div></div>' +
          '<em>' + (m.done ? esc(x.mDone) : m.have + '/' + m.need) + '</em></div>';
      }).join('');
  }

  /* ---------- STATISTIQUES ---------- */
  async function stats(box) {
    var my = box._seq, s = await call('mystats', {});
    if (!s || !s.ok || box._seq !== my) return;
    var x = X();
    var card = function (k, v, l) { return '<div class="lfun-stat"><span class="st-i">' + ico(k) + '</span><b>' + esc(v) + '</b><small>' + esc(l) + '</small></div>'; };
    box.innerHTML = levelCard(s.lv, false) + '<div class="lfun-stats">' + card('stats', nf(s.n), x.sTrades) + card('target', s.rate + ' %', x.sRate) + card('jauge', s.best, x.sBest) +
      card('news', s.fav ? favName(s.fav) : x.none, x.sFav) + card('duel', s.duel.w, x.sDuels) + card('quiz', s.quizOk || 0, x.sQuiz) + '</div><p class="lfun-note">' + esc(x.sNote) + '</p>';
  }

  /* ---------- BADGES ---------- */
  async function badges(box) {
    var my = box._seq, s = await call('mystats', {});
    if (!s || !s.ok || box._seq !== my) return;
    var x = X(), keys = Object.keys(x.b), got = keys.filter(function (k) { return s.badges[k]; }).length;
    box.innerHTML = '<div class="bd-head"><b>' + got + ' / ' + keys.length + '</b><div class="lv-bar"><i style="width:' + Math.round(got * 100 / keys.length) + '%"></i></div></div><div class="lfun-badges">' + keys.map(function (k) {
      return '<div class="lfun-badge' + (s.badges[k] ? ' on' : '') + '"><span class="bd-i">' + ico(BADGE_ICO[k] || 'badges') + '</span><b>' + esc(x.b[k][0]) + '</b><small>' + esc(x.b[k][1]) + '</small></div>';
    }).join('') + '</div>';
  }

  function open(kind) {
    var box = $('liveFun');
    if (!box) return;
    box.innerHTML = '';
    box._seq = (box._seq || 0) + 1; // (partagé avec live-send.js) une page plus récente remplace toujours une réponse en retard
    if (guest()) { if (D6.LiveGuest) D6.LiveGuest(box, kind === 'levels' || kind === 'missions' ? 'stats' : kind); return; }
    if (kind === 'quiz') quiz(box); else if (kind === 'stats') stats(box); else if (kind === 'levels') levels(box); else if (kind === 'missions') missions(box); else badges(box);
  }
  D6.LiveFun = { open: open, title: function (k) { var x = X(); return x[k] ? x[k][0] : ''; }, sub: function (k) { var x = X(); return x[k] ? x[k][1] : ''; } };
})(window.D6 = window.D6 || {});
