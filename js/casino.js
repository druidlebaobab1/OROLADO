/* v2690 — CASINO OROLADO : 15 jeux, mise dès 0,10 $, même solde RÉEL que le trading (ou DÉMO ; visiteur : essai).
   Le SERVEUR tire et paie tout (api.php csPlay / csMulti / csTry, casino_lib.php) : ici on dessine seulement.
   Décor fixe ; les animations ne tournent que pendant une partie. */
(function (D6) {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var T = {
    fr: { title: 'Casino', sub: '18 jeux · dès 0,10 $', real: 'Réel', demo: 'Démo', tryM: 'Essai', bal: 'Solde', stake: 'Mise', play: 'Jouer', again: 'Rejouer',
      win: 'Gagné ! +{w} $', lose: 'Perdu', tryNote: 'Crée ton compte et recharge pour jouer en argent réel, dès 0,10 $.', signup: 'Créer mon compte', gamesTab: 'Jeux', realAcc: 'Compte réel', bet: 'Miser', gotIt: 'J’ai compris', revealAll: 'Tout découvrir', dragonN: 'Dragon', tigerN: 'Tigre', tie: 'Égalité', player: 'Joueur', banker: 'Banque', small: 'Petit', big: 'Grand', triple: 'triple', pickChest: 'Choisis un coffre', pump: 'Gonfler', pumpFirst: 'Gonfle le ballon', level: 'Pommes pourries',
      e_min: 'Mise minimum 0,10 $.', e_max: 'Mise trop élevée.', e_maxWin: 'Gain trop élevé pour cette mise : baisse la mise ou la cible.', e_insufficient: 'Solde insuffisant.', e_unavailable: 'Indisponible, réessaie.', e_busy: 'Un instant…', e_param: 'Choix invalide.', e_login: 'Connecte-toi pour jouer.', e_suspended: 'Compte suspendu.',
      deposit: 'Recharger', hist: 'Mes dernières parties', none: 'Aucune partie pour l’instant.', rules: 'Jeu responsable : joue seulement ce que tu peux te permettre de perdre.',
      g: { crash: ['Avion', 'Encaisse avant qu’il explose'], coin: ['Pile ou face', '×1,94'], dice: ['Dés', 'Choisis ta chance'], limbo: ['Cible', 'Vise jusqu’à ×1000'], wheel: ['Roue casino', 'Jusqu’à ×50'],
        race: ['Course auto', '6 voitures · ×5,7'], roulette: ['Roulette', 'Rouge, noir, numéro ×36'], slots: ['Machine à sous', 'Jusqu’à ×50'], plinko: ['Cascade', 'Jusqu’à ×12'], keno: ['Keno', '3 numéros · ×25'],
        scratch: ['Grattage', 'Jusqu’à ×20'], hilo: ['Hi-Lo cartes', 'Plus haut ou plus bas'], penalty: ['Penalty', 'Marque · ×1,44'], colors: ['Couleurs', 'Vert, rouge, violet'], mines: ['Mines', 'Évite les bombes'],
        jet: ['Jet Man', 'Il s’envole, encaisse !'], rocket: ['Fusée', 'Jusqu’aux étoiles'], apple: ['Verger d’or', '10 étages'],
        tower: ['La Tour', '3 portes, 1 piège'], dragon: ['Dragon Tigre', 'La plus forte carte'], baccarat: ['Baccara', 'Joueur ou Banque'], sicbo: ['Sic Bo', 'Petit ou Grand'], chests: ['Coffres', '1 trésor sur 3'], balloon: ['Ballon', 'Gonfle et encaisse'] },
      cashout: 'Encaisser', auto: 'Encaissement auto (×)', flying: 'En vol…', boom: 'Explosé à ×{x}', cashed: 'Encaissé à ×{x} : +{w} $', start: 'Décoller',
      heads: 'Pile', tails: 'Face', chance: 'Chance de gagner', under: 'En dessous', over: 'Au-dessus', mult: 'Gain ×{x}', target: 'Cible ×', result: 'Résultat ×{x}', roll: 'Tirage {x}',
      pickCar: 'Choisis ta voiture', red: 'Rouge', black: 'Noir', even: 'Pair', odd: 'Impair', number: 'Numéro', dozen: 'Douzaine', green: 'Vert', violet: 'Violet',
      pick3: 'Choisis 3 numéros', picked: '{n}/3 choisis', hits: '{n} bon(s) numéro(s)', scratchGo: 'Gratter', aim: 'Vise un coin', left: 'Gauche', center: 'Centre', right: 'Droite', goal: 'BUT !', saved: 'Arrêté !',
      shoot: 'Touche le but pour tirer', hi: 'Plus haut ou égal', lo: 'Plus bas ou égal', minesN: 'Nombre de mines', next: 'Prochaine case ×{x}', open: 'Ouvre des cases…', sports: 'Paris sportifs', sportsSoon: 'Les grands matchs arrivent bientôt ici.' },
    en: { title: 'Casino', sub: '18 games · from $0.10', real: 'Real', demo: 'Demo', tryM: 'Try', bal: 'Balance', stake: 'Stake', play: 'Play', again: 'Play again',
      win: 'You win! +${w}', lose: 'Lost', tryNote: 'Create your account and top up to play for real money, from $0.10.', signup: 'Create my account', gamesTab: 'Games', realAcc: 'Real account', bet: 'Bet', gotIt: 'Got it', revealAll: 'Reveal all', dragonN: 'Dragon', tigerN: 'Tiger', tie: 'Tie', player: 'Player', banker: 'Banker', small: 'Small', big: 'Big', triple: 'triple', pickChest: 'Pick a chest', pump: 'Pump', pumpFirst: 'Pump the balloon', level: 'Rotten apples',
      e_min: 'Minimum stake $0.10.', e_max: 'Stake too high.', e_maxWin: 'Win too high for this stake: lower the stake or the target.', e_insufficient: 'Insufficient balance.', e_unavailable: 'Unavailable, try again.', e_busy: 'One moment…', e_param: 'Invalid choice.', e_login: 'Log in to play.', e_suspended: 'Account suspended.',
      deposit: 'Top up', hist: 'My last games', none: 'No game yet.', rules: 'Play responsibly: only stake what you can afford to lose.',
      g: { crash: ['Aviator', 'Cash out before it blows'], coin: ['Heads or tails', '×1.94'], dice: ['Dice', 'Pick your chance'], limbo: ['Target', 'Aim up to ×1000'], wheel: ['Casino wheel', 'Up to ×50'],
        race: ['Car race', '6 cars · ×5.7'], roulette: ['Roulette', 'Red, black, number ×36'], slots: ['Slot machine', 'Up to ×50'], plinko: ['Cascade', 'Up to ×12'], keno: ['Keno', '3 numbers · ×25'],
        scratch: ['Scratch card', 'Up to ×20'], hilo: ['Hi-Lo cards', 'Higher or lower'], penalty: ['Penalty', 'Score · ×1.44'], colors: ['Colours', 'Green, red, violet'], mines: ['Mines', 'Avoid the bombs'],
        jet: ['Jet Man', 'He flies, cash out!'], rocket: ['Rocket', 'To the stars'], apple: ['Golden Orchard', '10 floors'],
        tower: ['The Tower', '3 doors, 1 trap'], dragon: ['Dragon Tiger', 'Highest card'], baccarat: ['Baccarat', 'Player or Banker'], sicbo: ['Sic Bo', 'Small or Big'], chests: ['Chests', '1 treasure in 3'], balloon: ['Balloon', 'Pump and cash out'] },
      cashout: 'Cash out', auto: 'Auto cash-out (×)', flying: 'Flying…', boom: 'Blew up at ×{x}', cashed: 'Cashed out at ×{x}: +${w}', start: 'Take off',
      heads: 'Heads', tails: 'Tails', chance: 'Win chance', under: 'Under', over: 'Over', mult: 'Win ×{x}', target: 'Target ×', result: 'Result ×{x}', roll: 'Roll {x}',
      pickCar: 'Pick your car', red: 'Red', black: 'Black', even: 'Even', odd: 'Odd', number: 'Number', dozen: 'Dozen', green: 'Green', violet: 'Violet',
      pick3: 'Pick 3 numbers', picked: '{n}/3 picked', hits: '{n} number(s) hit', scratchGo: 'Scratch', aim: 'Aim a corner', left: 'Left', center: 'Centre', right: 'Right', goal: 'GOAL!', saved: 'Saved!',
      shoot: 'Tap the goal to shoot', hi: 'Higher or equal', lo: 'Lower or equal', minesN: 'Number of mines', next: 'Next tile ×{x}', open: 'Open tiles…', sports: 'Sports bets', sportsSoon: 'Big matches are coming here soon.' }
  };
  T.zh = Object.assign({}, T.en, { title: '娱乐场', sub: '18 款游戏 · 0.10 美元起', real: '真实', demo: '模拟', tryM: '试玩', bal: '余额', stake: '投注', play: '开始', again: '再来一局',
    win: '赢了！+{w} 美元', lose: '输了', tryNote: '创建账户并充值，即可真钱游戏，0.10 美元起。', signup: '创建账户', gamesTab: '游戏', realAcc: '真实账户', bet: '投注', gotIt: '知道了', revealAll: '全部刮开', dragonN: '龙', tigerN: '虎', tie: '和', player: '闲', banker: '庄', small: '小', big: '大', triple: '围骰', pickChest: '选一个宝箱', pump: '充气', pumpFirst: '给气球充气', level: '坏苹果', deposit: '充值', hist: '最近的游戏', none: '还没有游戏记录。',
    rules: '请理性游戏，只投入你能承受损失的金额。',
    g: { crash: ['飞机', '爆炸前兑现'], coin: ['正反面', '×1.94'], dice: ['骰子', '自选胜率'], limbo: ['极限', '最高 ×1000'], wheel: ['娱乐场转盘', '最高 ×50'], race: ['赛车', '6 辆车 · ×5.7'],
      roulette: ['轮盘', '红、黑、号码 ×36'], slots: ['老虎机', '最高 ×50'], plinko: ['弹珠台', '最高 ×12'], keno: ['基诺', '3 个号码 · ×25'], scratch: ['刮刮卡', '最高 ×20'], hilo: ['猜大小', '更大还是更小'],
      penalty: ['点球', '进球 · ×1.44'], colors: ['颜色', '绿、红、紫'], mines: ['扫雷', '避开炸弹'], jet: ['喷气侠', '起飞，快兑现！'], rocket: ['火箭', '直冲星空'], apple: ['金色果园', '10 层'], tower: ['高塔', '3 扇门 1 个陷阱'], dragon: ['龙虎', '比大小'], baccarat: ['百家乐', '闲或庄'], sicbo: ['骰宝', '大或小'], chests: ['宝箱', '3 选 1'], balloon: ['气球', '充气再兑现'] },
    cashout: '兑现', start: '起飞', heads: '正面', tails: '反面', under: '小于', over: '大于', red: '红', black: '黑', even: '双', odd: '单', number: '号码', green: '绿', violet: '紫', goal: '进球！', saved: '被扑出！', shoot: '点击球门射门', hi: '更大或相等', lo: '更小或相等', sports: '体育竞猜', sportsSoon: '重大赛事即将上线。' });
  (D6.LIVE_T = D6.LIVE_T || {}).casino = T;
  function X() { var l = (document.documentElement.lang || 'fr').slice(0, 2); return T[l] || T.en; }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function fmt(s, o) { return String(s).replace(/\{(\w+)\}/g, function (m, k) { return o[k] != null ? o[k] : m; }); }
  function m2(v) { return (Math.round((Number(v) || 0) * 100 + 1e-6) / 100).toFixed(2); } // même arrondi que le serveur
  function guest() { return !(D6.Api && D6.Api.token && D6.Api.token()) || document.documentElement.classList.contains('oro-guest'); }
  function toast(m, k) { if (D6.App && D6.App.toast) D6.App.toast(m, k || 'err'); }
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  /* ---------- v2694 : noms en anglais (les mêmes dans toutes les langues, à nous) + logos « planète » (js/casino-art.js) ---------- */
  var NAMES = { crash: 'Sky Rush', jet: 'Jet Man', rocket: 'Rocket', mines: 'Mines', apple: 'Golden Orchard', tower: 'Tower', plinko: 'Cascade', dice: 'Dice', limbo: 'Target',
    wheel: 'Lucky Wheel', roulette: 'Roulette', slots: 'Lucky 777', coin: 'Coin Flip', keno: 'Keno', scratch: 'Scratch Card', hilo: 'Hi-Lo', dragon: 'Dragon Tiger', baccarat: 'Baccarat',
    sicbo: 'Sic Bo', chests: 'Treasure', balloon: 'Balloon', penalty: 'Penalty', race: 'Racing', colors: 'Colors', darts: 'Darts' };
  var ART = D6.CasinoArt || { planet: function () { return ''; }, obj: function () { return ''; }, sym: function () { return ''; }, car: function () { return ''; }, PAL: {} };
  function pal(k) { return ART.PAL[k] || ART.PAL.coin || ['#ffffff', '#7c3aed']; }
  function gicon(k, cls) { return ART.planet(k, cls); }
  D6.CasinoIcon = gicon;
  var gn = 0; // compteur des dessins de la pièce (v2696b : avait disparu en v2694 → Coin Flip ne s'ouvrait plus)
  /* pièce « crypto » OROLADO (face : or, logo O ; pile : argent, circuit) */
  function coinFace(gold) {
    var a = gold ? ['#FFF3C4', '#F5B700', '#9A6A00'] : ['#F1F5F9', '#94A3B8', '#334155'];
    var id = 'cf' + (++gn);
    var ticks = ''; for (var i = 0; i < 36; i++) ticks += '<rect x="99" y="6" width="2" height="9" rx="1" fill="' + a[2] + '" opacity=".55" transform="rotate(' + (i * 10) + ' 100 100)"/>';
    return '<svg viewBox="0 0 200 200"><defs><radialGradient id="' + id + '" cx="35%" cy="30%" r="80%"><stop offset="0" stop-color="' + a[0] + '"/><stop offset=".55" stop-color="' + a[1] + '"/><stop offset="1" stop-color="' + a[2] + '"/></radialGradient></defs>' +
      '<circle cx="100" cy="100" r="98" fill="url(#' + id + ')"/>' + ticks + '<circle cx="100" cy="100" r="74" fill="none" stroke="' + a[2] + '" stroke-width="4" opacity=".6"/>' +
      (gold ? '<circle cx="100" cy="100" r="40" fill="none" stroke="' + a[2] + '" stroke-width="16"/><path d="M100 48v18M100 134v18" stroke="' + a[2] + '" stroke-width="8" stroke-linecap="round"/>'
        : '<path d="M70 100h20l10-18 10 36 10-18h20" fill="none" stroke="' + a[2] + '" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/><circle cx="70" cy="100" r="7" fill="' + a[2] + '"/><circle cx="130" cy="100" r="7" fill="' + a[2] + '"/>') + '</svg>';
  }
  /* ---------- état ---------- */
  var ORDER = ['crash', 'jet', 'rocket', 'mines', 'apple', 'tower', 'plinko', 'dice', 'limbo', 'wheel', 'roulette', 'slots', 'coin', 'keno', 'scratch', 'hilo', 'dragon', 'baccarat', 'sicbo', 'chests', 'balloon', 'penalty', 'race', 'colors', 'darts'];
  // v2693 (propriétaire) : la mise de départ est toujours 0,10 $ à l'ouverture du Casino.
  var S = { mode: 'real', stake: 0.1, game: '', view: 'games', bal: { real: null, demo: null }, busy: false, timer: 0 };
  function save() { /* la mise n'est plus gardée : 0,10 $ à chaque ouverture */ }
  function mode() { return 'real'; } // v2690b : argent réel seulement (pas de démo ni d'essai)
  function readBal() {
    var num = function (id) { var e = $(id); if (!e) return null; var v = parseFloat(String(e.textContent).replace(/[^0-9.]/g, '')); return isFinite(v) ? v : null; };
    if (S.bal.real == null) S.bal.real = num('modeRealAmt');
    if (S.bal.demo == null) S.bal.demo = num('modeDemoAmt');
  }
  /* solde au milieu de la barre, avec un petit « + » pour recharger */
  function paintBal() {
    var b = $('csBal'); if (!b) return;
    if (guest()) { b.innerHTML = '<button type="button" class="cs-join" id="csJoin">' + esc(X().signup) + '</button>'; b.className = 'cs-wallet'; $('csJoin').addEventListener('click', signup); return; }
    var md = S.adminTest ? 'demo' : 'real';
    b.innerHTML = '<span class="cw-t"><small>' + esc(S.adminTest ? 'TEST ADMIN' : X().realAcc) + '</small><b>' + (S.bal[md] == null ? '—' : m2(S.bal[md])) + ' $</b></span><i class="cw-plus" aria-hidden="true">+</i>';
    b.className = 'cs-wallet ' + md;
  }
  var vaultT = 0;
  function afterPlay(r) {
    if (r && r.mode === 'demo') S.adminTest = true;
    if (r && r.bal != null && (r.mode === 'real' || r.mode === 'demo')) { S.bal[r.mode] = r.bal; paintBal(); }
    clearTimeout(vaultT);
    vaultT = setTimeout(function () { try { if (D6.App && D6.App.refreshVault) D6.App.refreshVault(); } catch (e) { /* ignore */ } }, 2500);
  }
  async function api(a, d) { try { return await D6.Api.post(a, d, 15000); } catch (e) { return null; } }
  function err(r) { var x = X(); toast(x['e_' + ((r && r.reason) || 'unavailable')] || x.e_unavailable); if (r && r.reason === 'insufficient') deposit(); }
  function deposit() { close(); if (D6.App && D6.App.openDeposit) D6.App.openDeposit(); }
  function signup() { close(); if (D6.App && D6.App.showAuth) D6.App.showAuth('register'); }
  async function play(game, p) {
    if (guest()) { toast(X().tryNote); signup(); return null; }
    if (S.busy) return null;
    S.busy = true;
    var md = mode();
    var r = await api('csPlay', { game: game, mode: md, stake: S.stake, p: p || {} });
    S.busy = false;
    if (!r || !r.ok) { err(r); return null; }
    if (r.mode === 'demo') S.adminTest = true;
    if (S.bal.real != null && r.bal == null && r.mode === 'real') S.bal.real = S.bal.real - r.stake + r.win;
    return r;
  }
  async function multi(game, act, p, quiet) {
    if (guest()) { if (!quiet) { toast(X().tryNote); signup(); } return null; }
    var r = await api('csMulti', { game: game, act: act, mode: 'real', stake: S.stake, p: p || {} });
    if (!r || !r.ok) { if (!quiet) err(r); return null; }
    if (r.mode === 'demo' && !S.adminTest) { S.adminTest = true; paintBal(); }
    if (r.mode && r.bal != null) { S.bal[r.mode] = r.bal; paintBal(); }
    return r;
  }
  /* résultat : petite bannière DANS l'écran du jeu (ne prend plus de place) */
  function resultLine(box, r, extra) {
    var x = X(), el = box.querySelector('.cs-res');
    if (!el) return;
    el.className = 'cs-res ' + (r.win > 0 ? 'win' : 'lose');
    el.innerHTML = r.win > 0 ? '<b>+' + m2(r.win) + ' $</b>' + (extra ? '<small>' + esc(extra) + '</small>' : '') : '<b>' + esc(x.lose) + '</b>' + (extra ? '<small>' + esc(extra) + '</small>' : '');
    afterPlay(r);
  }

  /* ---------- page Casino ---------- */
  function ensure() {
    if ($('casinoModal')) return;
    var m = document.createElement('div');
    m.className = 'modal-backdrop'; m.id = 'casinoModal';
    m.innerHTML = '<div class="modal-box glass cs-box" role="dialog" aria-modal="true"><button type="button" class="btn-close" id="closeCasino" aria-label="Close"></button>' +
      '<div class="cs-top"><button type="button" class="cs-back" id="csBack" aria-label="Back"><svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg></button>' +
      '<button type="button" class="cs-wallet" id="csBal"></button><button type="button" class="cs-help" id="csHelp" aria-label="?"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 7C9.8 5.4 6.6 4.9 3 5.4v13c3.6-.5 6.8 0 9 1.6 2.2-1.6 5.4-2.1 9-1.6v-13C17.4 4.9 14.2 5.4 12 7z" fill="#FFF7E0"/><path d="M12 7v13" stroke="#B45309" stroke-width="1.5"/><path d="M5.3 9c1.9-.2 3.6 0 4.8.7M5.3 12c1.9-.2 3.6 0 4.8.7M5.3 15c1.9-.2 3.6 0 4.8.7M13.9 9.7c1.2-.7 2.9-.9 4.8-.7M13.9 12.7c1.2-.7 2.9-.9 4.8-.7M13.9 15.7c1.2-.7 2.9-.9 4.8-.7" stroke="#94A3B8" stroke-width="1.1" stroke-linecap="round" fill="none"/><path d="M3 18.4c3.6-.5 6.8 0 9 1.6 2.2-1.6 5.4-2.1 9-1.6" stroke="#B45309" stroke-width="1.5" fill="none"/></svg></button></div>' +
      '<div id="csBody"></div><div class="cs-sheet" id="csSheet" hidden></div></div>';
    document.body.appendChild(m);
    $('closeCasino').style.setProperty('display', 'none', 'important');
    $('closeCasino').addEventListener('click', backStep);
    $('csBack').addEventListener('click', backStep);
    $('csBal').addEventListener('click', function () { if (!guest()) deposit(); });
    $('csHelp').addEventListener('click', function () { if (S.game) help(S.game); });
    m.addEventListener('click', function (e) { if (e.target === m) close(); });
    if (D6.BigPageSwipe) D6.BigPageSwipe('casinoModal');
  }
  function backStep() { if (!$('csSheet').hidden) { $('csSheet').hidden = true; return; } if (S.game) { home(); var mb = $('casinoModal').querySelector('.modal-box'); if (mb) mb.scrollTop = S.homeY || 0; } else close(); }
  function open(game) {
    ensure(); readBal();
    S.stake = 0.1;
    if (D6.App && D6.App.openModal) D6.App.openModal('casinoModal');
    if (game && NAMES[game]) go(game); else home();
  }
  function close() {
    stopAll();
    S.game = '';
    if (D6.App && D6.App.closeModal) D6.App.closeModal('casinoModal');
    try { if (D6.App && D6.App.refreshVault) D6.App.refreshVault(); } catch (e) { /* ignore */ }
  }
  function stopAll() { clearInterval(S.timer); S.timer = 0; cancelAnimationFrame(S.raf || 0); clearInterval(S.idle || 0); }
  function home(view) {
    stopAll();
    S.game = ''; S.view = view || S.view || 'games';
    var x = X(), m = $('casinoModal');
    m.classList.remove('in-game'); m.removeAttribute('data-g'); $('csSheet').hidden = true; $('csHelp').hidden = true;
    paintBal();
    $('csBody').innerHTML = '<div class="cs-tabs2"><button type="button" data-v="games" class="' + (S.view === 'games' ? 'on' : '') + '">' + gicon('slots', 'sm') + '<span>' + esc(x.gamesTab) + '</span></button>' +
      '<button type="button" data-v="sports" class="' + (S.view === 'sports' ? 'on' : '') + '">' + gicon('sports', 'sm') + '<span>' + esc(x.sports) + '</span></button></div><div id="csView"></div>';
    $('csBody').querySelectorAll('[data-v]').forEach(function (b) { b.addEventListener('click', function () { home(b.getAttribute('data-v')); }); });
    var v = $('csView');
    if (S.view === 'sports') {
      v.className = 'cs-sports';
      if (D6.Sports && D6.Sports.paint) D6.Sports.paint(v, { guest: guest(), signup: signup, toast: toast, afterPlay: afterPlay, stake: function () { return S.stake; } });
    } else {
      v.className = 'cs-grid';
      v.innerHTML = ORDER.filter(function (k) { return GAMES[k] && NAMES[k]; }).map(function (k) {
        return '<button type="button" class="cs-g" data-g="' + k + '" style="--tc:' + pal(k)[1] + '">' + gicon(k) + '<b>' + esc(name(k)) + '</b></button>';
      }).join('');
      v.querySelectorAll('.cs-g').forEach(function (b) { b.addEventListener('click', function () { var mb = m.querySelector('.modal-box'); S.homeY = mb ? mb.scrollTop : 0; go(b.getAttribute('data-g')); }); });
    }
    var box = m.querySelector('.modal-box'); if (box) box.scrollTop = 0;
  }
  function name(k) { return NAMES[k] || k; }
  function modeSwitch() { return ''; }
  function bindMode() { /* plus de choix réel / démo */ }
  /* panneau de mise compact, en bas de l'écran */
  function stakePanel(btnLabel, extra) {
    var x = X();
    return '<div class="cs-panel">' + (extra ? '<div class="cs-extra">' + extra + '</div>' : '') +
      '<div class="cs-stake"><button type="button" data-s="half">½</button><input id="csStake" inputmode="decimal" value="' + m2(S.stake) + '" aria-label="' + esc(x.stake) + '"><button type="button" data-s="dbl">×2</button></div>' +
      '<div class="cs-chips">' + [0.1, 0.5, 1, 5, 10, 50].map(function (v) { return '<button type="button" data-v="' + v + '">' + (v < 1 ? m2(v) : v) + ' $</button>'; }).join('') + '</div>' +
      '<button type="button" class="cs-go" id="csGo">' + esc(btnLabel || x.bet) + '</button></div>';
  }
  function bindStake(box) {
    var inp = $('csStake');
    var set = function (v) { v = Math.max(0.1, Math.min(1000, Math.round((Number(v) || 0.1) * 100) / 100)); S.stake = v; inp.value = m2(v); box.dispatchEvent(new Event('stake')); };
    inp.addEventListener('change', function () { set(String(inp.value).replace(',', '.')); });
    box.querySelectorAll('[data-s]').forEach(function (b) { b.addEventListener('click', function () { set(b.getAttribute('data-s') === 'half' ? S.stake / 2 : S.stake * 2); }); });
    box.querySelectorAll('.cs-chips [data-v]').forEach(function (b) { b.addEventListener('click', function () { set(+b.getAttribute('data-v')); }); });
  }
  function go(k) {
    stopAll();
    S.game = k;
    var x = X(), m = $('casinoModal');
    m.classList.add('in-game'); m.setAttribute('data-g', k); $('csSheet').hidden = true; $('csHelp').hidden = false;
    var p = pal(k);
    m.style.setProperty('--tc', p[1]); m.style.setProperty('--p1', p[0]); m.style.setProperty('--p2', p[1]);
    paintBal();
    var body = $('csBody');
    body.innerHTML = '<div class="cs-game cs-' + k + (guest() ? ' is-guest' : '') + '"></div>';
    var box = body.firstChild;
    (GAMES[k] || GAMES.coin)(box, x);
    // v2694 : nom du jeu sur sa propre ligne, au-dessus de la scène (ne recouvre plus rien) ; résultat en bas
    var tag = document.createElement('div'); tag.className = 'cs-gname'; tag.innerHTML = gicon(k, 'mini') + '<b>' + esc(name(k)) + '</b>';
    box.insertBefore(tag, box.firstChild);
    var mb = m.querySelector('.modal-box'); if (mb) mb.scrollTop = 0;
  }
  /* « ? » : comment on joue (une page, sans défiler) */
  function help(k) {
    var x = X(), r = (RULES[(document.documentElement.lang || 'fr').slice(0, 2)] || RULES.en)[k] || RULES.en[k] || '';
    var sh = $('csSheet');
    sh.innerHTML = '<div class="cs-sheet-in">' + gicon(k, 'big') + '<b>' + esc(name(k)) + '</b><p>' + esc(r).replace(/\n/g, '<br>') + '</p><small>' + esc(x.rules) + '</small><button type="button" class="cs-go" id="csSheetOk">' + esc(x.gotIt) + '</button></div>';
    sh.hidden = false;
    $('csSheetOk').addEventListener('click', function () { sh.hidden = true; });
    sh.onclick = function (e) { if (e.target === sh) sh.hidden = true; }; // toucher à côté = « J'ai compris »
  }
  var RULES = {
    fr: {
      crash: 'Touche « Décoller ». Le multiplicateur monte avec l’avion. Touche « Encaisser » avant qu’il s’envole : tu gagnes ta mise × le multiplicateur. S’il s’envole avant, la mise est perdue.\nAstuce : l’encaissement auto encaisse tout seul au multiplicateur choisi.',
      jet: 'Même principe que l’avion : Jet Man s’envole, le multiplicateur monte. Encaisse avant qu’il disparaisse.',
      rocket: 'Même principe : la fusée monte vers les étoiles. Encaisse avant qu’elle explose.',
      mines: 'Choisis le nombre de mines, puis ouvre des cases. Chaque diamant fait monter le gain. Une mine et c’est perdu. Encaisse quand tu veux.',
      apple: 'Monte étage par étage en choisissant une pomme. Une pomme pourrie et c’est perdu. Plus il y a de pommes pourries, plus le gain monte vite. Encaisse quand tu veux.',
      tower: 'Monte la tour : à chaque étage, choisis une porte sur 3. Derrière une porte se cache un piège. Encaisse quand tu veux.',
      coin: 'Choisis Pile ou Face, puis lance. Si la pièce tombe sur ton choix, tu gagnes ×1,94.',
      dice: 'Choisis ta chance de gagner (plus elle est petite, plus le gain est grand) et « en dessous » ou « au-dessus ». Le dé tire un nombre de 0 à 100.',
      wheel: 'Lance la roue. Le gain est la couleur sous la flèche : ×0 à ×50. Les grosses cases sont rares.',
      roulette: 'Mise sur Rouge, Noir, Pair, Impair, une douzaine (×3) ou un numéro (×36). La bille tombe sur un numéro de 0 à 36.',
      slots: 'Lance les rouleaux. 3 symboles identiques = gros gain (jusqu’à ×50). 2 cerises = ×1,5.',
      plinko: 'La bille tombe et rebondit. Elle finit dans une case : les cases du bord paient le plus (×12).',
      limbo: 'Choisis une cible (par ex. ×2). Si le nombre tiré est au moins égal à ta cible, tu gagnes mise × cible.',
      keno: 'Choisis 3 numéros sur 20. 5 numéros sont tirés. 1 bon = ×0,6 · 2 bons = ×3,5 · 3 bons = ×25.',
      scratch: 'Gratte le ticket avec ton doigt. 3 symboles identiques = gain (jusqu’à ×20).',
      hilo: 'Une carte est montrée. Devine si la suivante sera plus haute ou plus basse. Chaque bonne réponse fait monter le gain. Encaisse quand tu veux.',
      dragon: 'Une carte pour Dragon, une pour Tigre. Mise sur celui qui aura la plus forte (×2) ou sur l’égalité (×12). En cas d’égalité, la moitié des mises Dragon / Tigre est rendue.',
      baccarat: 'Mise sur le Joueur (×1,96), la Banque (×1,92) ou l’Égalité (×9). La main la plus proche de 9 gagne. En cas d’égalité, les mises Joueur / Banque sont rendues.',
      sicbo: '3 dés sont lancés. Mise sur Petit (4 à 10) ou Grand (11 à 17) : ×2. Un triple fait perdre ces deux mises.',
      chests: '3 coffres : un seul contient le trésor. Choisis le bon coffre et tu gagnes ×2,85.',
      balloon: 'Gonfle le ballon : chaque souffle fait monter le gain. Encaisse avant qu’il éclate !',
      penalty: 'Mise, puis touche le but là où tu veux tirer. Chaque but fait monter ton gain (ligne du haut : ×1,44 → ×24,60). Encaisse quand tu veux. Si le gardien arrête le tir, la mise est perdue.',
      race: 'Choisis ta voiture parmi 6. Si elle gagne la course : ×5,7.',
      colors: 'Un numéro de 0 à 9 sort. Vert ou Rouge : ×2 · Violet : ×4,5 · un numéro exact : ×9.',
      darts: 'Touche « Miser » : la fléchette part vers la cible. Centre doré ×20 · anneau rouge ×5 · anneau vert ×2 · anneau clair ×1 · bord noir ×0.'
    },
    en: {
      crash: 'Tap “Take off”. The multiplier rises with the plane. Tap “Cash out” before it flies away: you win stake × multiplier. If it flies away first, the stake is lost.\nTip: auto cash-out cashes out at your chosen multiplier.',
      jet: 'Same as the plane: Jet Man flies, the multiplier rises. Cash out before he disappears.',
      rocket: 'Same idea: the rocket climbs to the stars. Cash out before it explodes.',
      mines: 'Pick the number of mines, then open tiles. Each diamond raises the win. A mine and you lose. Cash out anytime.',
      apple: 'Climb floor by floor by picking an apple. A rotten apple and you lose. More rotten apples = faster gains. Cash out anytime.',
      tower: 'Climb the tower: on each floor pick 1 door out of 3. One hides a trap. Cash out anytime.',
      coin: 'Pick Heads or Tails, then flip. If it lands on your pick, you win ×1.94.',
      dice: 'Pick your win chance (smaller = bigger win) and “under” or “over”. The dice rolls a number from 0 to 100.',
      wheel: 'Spin the wheel. The win is the colour under the pointer: ×0 to ×50. Big slices are rare.',
      roulette: 'Bet on Red, Black, Even, Odd, a dozen (×3) or a number (×36). The ball lands on 0 to 36.',
      slots: 'Spin the reels. 3 identical symbols = big win (up to ×50). 2 cherries = ×1.5.',
      plinko: 'The ball drops and bounces into a slot: the edge slots pay the most (×12).',
      limbo: 'Pick a target (e.g. ×2). If the drawn number is at least your target, you win stake × target.',
      keno: 'Pick 3 numbers out of 20. 5 are drawn. 1 hit = ×0.6 · 2 hits = ×3.5 · 3 hits = ×25.',
      scratch: 'Scratch the ticket with your finger. 3 identical symbols = win (up to ×20).',
      hilo: 'A card is shown. Guess if the next one is higher or lower. Each right guess raises the win. Cash out anytime.',
      dragon: 'One card for Dragon, one for Tiger. Bet on the higher one (×2) or a tie (×12). On a tie, half of Dragon / Tiger bets is returned.',
      baccarat: 'Bet on Player (×1.96), Banker (×1.92) or Tie (×9). The hand closest to 9 wins. On a tie, Player / Banker bets are returned.',
      sicbo: '3 dice are rolled. Bet Small (4–10) or Big (11–17): ×2. A triple loses both bets.',
      chests: '3 chests: only one holds the treasure. Pick it and win ×2.85.',
      balloon: 'Pump the balloon: each pump raises the win. Cash out before it pops!',
      penalty: 'Bet, then tap the goal where you want to shoot. Each goal raises your win (top line: ×1.44 → ×24.60). Cash out anytime. If the keeper saves it, the stake is lost.',
      race: 'Pick your car out of 6. If it wins the race: ×5.7.',
      colors: 'A number from 0 to 9 is drawn. Green or Red: ×2 · Violet: ×4.5 · exact number: ×9.',
      darts: 'Tap “Bet”: the dart flies to the board. Gold centre ×20 · red ring ×5 · green ring ×2 · light ring ×1 · black edge ×0.'
    }
  };

  /* ---------- les 25 jeux (v2694 : chaque écran copie les grands : scène plein écran, sans cadre) ---------- */
  var GAMES = {};

  GAMES.coin = function (box, x) {
    var side = 0;
    box.innerHTML = '<div class="cs-stage"><div class="coin3d" id="csCoin"><i class="f">' + coinFace(true) + '</i><i class="b">' + coinFace(false) + '</i></div><div class="coin-lbl"><span>' + esc(x.heads) + '</span><span>' + esc(x.tails) + '</span></div></div><div class="cs-res"></div>' +
      stakePanel(x.bet, '<div class="cs-seg"><button type="button" class="on" data-side="0">' + esc(x.heads) + ' ×1,94</button><button type="button" data-side="1">' + esc(x.tails) + ' ×1,94</button></div>');
    bindStake(box);
    box.querySelectorAll('[data-side]').forEach(function (b) { b.addEventListener('click', function () { side = +b.getAttribute('data-side'); box.querySelectorAll('[data-side]').forEach(function (z) { z.classList.toggle('on', z === b); }); }); });
    var turns = 0;
    $('csGo').addEventListener('click', async function () {
      var r = await play('coin', { side: side }); if (!r) return;
      turns += 5; var c = $('csCoin');
      c.style.transform = 'rotateY(' + (turns * 360 + (r.view.r ? 180 : 0)) + 'deg)';
      await sleep(1300); resultLine(box, r);
    });
  };

  GAMES.dice = function (box, x) {
    var chance = 50, over = false;
    box.innerHTML = '<div class="cs-stage dice-stage"><div class="dice-hero">' + ART.obj('dice') + '</div><b class="dice-roll" id="csRoll">50.00</b><div class="dice-bar"><i id="csDiceWin"></i><em id="csDiceMark"></em></div><div class="dice-scale"><span>0</span><span>25</span><span>50</span><span>75</span><span>100</span></div></div><div class="cs-res"></div>' +
      stakePanel(x.bet, '<div class="cs-seg"><button type="button" class="on" data-o="0">' + esc(x.under) + '</button><button type="button" data-o="1">' + esc(x.over) + '</button></div>' +
        '<label class="cs-lbl">' + esc(x.chance) + ' : <b id="csCh">50 %</b> · <b id="csMul"></b></label><input type="range" min="2" max="95" value="50" id="csChance" class="cs-range">');
    bindStake(box);
    var paint = function () {
      $('csCh').textContent = chance + ' %'; $('csMul').textContent = fmt(x.mult, { x: (Math.floor(97 / chance * 10000) / 10000).toFixed(2) });
      var w = $('csDiceWin'); w.style.left = over ? (100 - chance) + '%' : '0'; w.style.width = chance + '%';
    };
    $('csChance').addEventListener('input', function () { chance = +this.value; paint(); });
    box.querySelectorAll('[data-o]').forEach(function (b) { b.addEventListener('click', function () { over = b.getAttribute('data-o') === '1'; box.querySelectorAll('[data-o]').forEach(function (z) { z.classList.toggle('on', z === b); }); paint(); }); });
    paint();
    $('csGo').addEventListener('click', async function () {
      var r = await play('dice', { chance: chance, over: over ? 1 : 0 }); if (!r) return;
      var el = $('csRoll'), t0 = performance.now(), hero = box.querySelector('.dice-hero');
      if (hero) hero.classList.add('rolling');
      await new Promise(function (res) { (function f(t) { var k = Math.min(1, (t - t0) / 900); el.textContent = (k < 1 ? Math.random() * 100 : r.view.roll).toFixed(2); if (k < 1) S.raf = requestAnimationFrame(f); else res(); })(t0); });
      if (hero) hero.classList.remove('rolling');
      $('csDiceMark').style.left = r.view.roll + '%'; $('csDiceMark').className = r.win > 0 ? 'w' : 'l';
      el.className = 'dice-roll ' + (r.win > 0 ? 'w' : 'l');
      resultLine(box, r, fmt(x.roll, { x: r.view.roll.toFixed(2) }));
    });
  };

  GAMES.limbo = function (box, x) {
    var target = 2;
    box.innerHTML = '<div class="cs-stage limbo-stage"><div class="lb-target">' + ART.obj('limbo') + '</div><b class="limbo-n" id="csLimbo">1.00×</b><small id="csLimboT" class="lb-t"></small></div><div class="cs-res"></div>' +
      stakePanel(x.bet, '<label class="cs-lbl">' + esc(x.target) + '</label><div class="cs-stake"><input id="csTarget" inputmode="decimal" value="2.00"></div><div class="cs-chips">' + [1.5, 2, 5, 10, 100].map(function (v) { return '<button type="button" data-t="' + v + '">×' + v + '</button>'; }).join('') + '</div>');
    bindStake(box);
    var setT = function (v) { target = Math.max(1.01, Math.min(1000, Math.round((+v || 2) * 100) / 100)); $('csTarget').value = target.toFixed(2); $('csLimboT').textContent = x.target + target.toFixed(2); };
    $('csTarget').addEventListener('change', function () { setT(String(this.value).replace(',', '.')); });
    box.querySelectorAll('[data-t]').forEach(function (b) { b.addEventListener('click', function () { setT(b.getAttribute('data-t')); }); });
    setT(2);
    $('csGo').addEventListener('click', async function () {
      var r = await play('limbo', { target: target }); if (!r) return;
      var el = $('csLimbo'), t0 = performance.now(), end = Math.min(r.view.res, 100000);
      el.className = 'limbo-n';
      await new Promise(function (res) { (function f(t) { var k = Math.min(1, (t - t0) / 700); el.textContent = (1 + (end - 1) * (1 - Math.pow(1 - k, 3))).toFixed(2) + '×'; if (k < 1) S.raf = requestAnimationFrame(f); else res(); })(t0); });
      el.className = 'limbo-n ' + (r.win > 0 ? 'w' : 'l');
      resultLine(box, r, fmt(x.result, { x: r.view.res.toFixed(2) }));
    });
  };

  // [multiplicateur, chances sur 10 000] — même table que le serveur (casino_lib.php CASINO_WHEEL) ; case dessinée à la taille de sa chance
  var WHEEL = [[0.5, 640], [1.2, 500], [0, 630], [1.5, 550], [0.5, 640], [2, 325], [0, 630], [1.2, 500], [0.5, 640], [3, 350], [0, 631], [1.2, 500], [0.5, 640], [5, 120], [1.5, 550], [0, 631], [0.5, 640], [1.2, 500], [2, 325], [10, 50], [50, 8]];
  GAMES.wheel = function (box, x) {
    var rot = 0, out = '', a0 = 0, mids = [];
    var col = { 0: '#312e81', 0.5: '#8b5cf6', 1.2: '#2563eb', 1.5: '#06b6d4', 2: '#22c55e', 3: '#f59e0b', 5: '#f97316', 10: '#e11d48', 50: '#facc15' };
    var pt = function (r, a) { a = a * Math.PI / 180; return (r * Math.sin(a)).toFixed(2) + ' ' + (-r * Math.cos(a)).toFixed(2); };
    WHEEL.forEach(function (s) {
      var v = s[0], sw = s[1] / 10000 * 360, a1 = a0 + sw;
      out += '<path d="M0 0 L' + pt(112, a0) + ' A112 112 0 0 1 ' + pt(112, a1) + 'Z" fill="' + col[v] + '" stroke="#FDE68A" stroke-opacity=".9" stroke-width="1.6"/>';
      mids.push(a0 + sw / 2); a0 = a1;
    });
    var bulbs = ''; for (var i = 0; i < 24; i++) bulbs += '<circle cx="' + (119 * Math.sin(i * 15 * Math.PI / 180)).toFixed(1) + '" cy="' + (-119 * Math.cos(i * 15 * Math.PI / 180)).toFixed(1) + '" r="3" fill="#FFF7D6"/>';
    out = '<defs><radialGradient id="whG" cx="35%" cy="30%" r="80%"><stop offset="0" stop-color="#FFF6C8"/><stop offset=".5" stop-color="#F5B700"/><stop offset="1" stop-color="#9A6A00"/></radialGradient></defs><circle r="125" fill="url(#whG)"/>' + bulbs + out + '<circle r="112" fill="none" stroke="rgba(255,255,255,.3)" stroke-width="2"/>';
    var legend = [50, 10, 5, 3, 2, 1.5, 1.2, 0.5, 0].map(function (v) { return '<span style="--c:' + col[v] + '">' + String(v).replace('.', ',') + '</span>'; }).join('');
    box.innerHTML = '<div class="cs-stage"><div class="whl2"><div class="whl2-rot" id="csWheel"><svg viewBox="-126 -126 252 252">' + out + '<circle r="20" fill="url(#whG)" stroke="#9A6A00" stroke-width="3"/></svg></div><i class="whl2-pin" id="csWPin"></i></div><div class="whl-leg">' + legend + '</div></div><div class="cs-res"></div>' + stakePanel();
    bindStake(box);
    $('csGo').addEventListener('click', async function () {
      var r = await play('wheel', {}); if (!r) return;
      var c = mids[r.view.i];
      rot = rot - (rot % 360) + 360 * 5 + (360 - c);
      var w = $('csWheel'); w.style.transition = 'transform 3.6s cubic-bezier(.12,.72,.12,1)'; w.style.transform = 'rotate(' + rot + 'deg)';
      var pin = $('csWPin'); pin.classList.add('tick'); setTimeout(function () { pin.classList.add('slow'); }, 2200);
      await sleep(3700); pin.classList.remove('tick', 'slow'); resultLine(box, r, '×' + r.mult);
    });
  };

  GAMES.race = function (box, x) {
    var car = 0, cols = ['#EF4444', '#3B82F6', '#22C55E', '#F59E0B', '#A855F7', '#EC4899'];
    var lanes = cols.map(function (c, i) { return '<div class="lane"><span class="car" id="csCar' + i + '">' + ART.car(c, i + 1) + '</span></div>'; }).join('');
    box.innerHTML = '<div class="cs-stage race-stage"><div class="race-sky"></div><div class="road">' + lanes + '<i class="finish"></i><i class="start"></i></div><div class="race-grass"></div></div><div class="cs-res"></div>' +
      stakePanel(x.bet, '<label class="cs-lbl">' + esc(x.pickCar) + ' · ×5,7</label><div class="cs-cars">' + cols.map(function (c, i) { return '<button type="button" data-car="' + i + '" class="' + (i ? '' : 'on') + '" style="--cc:' + c + '">' + (i + 1) + '</button>'; }).join('') + '</div>');
    bindStake(box);
    box.querySelectorAll('[data-car]').forEach(function (b) { b.addEventListener('click', function () { car = +b.getAttribute('data-car'); box.querySelectorAll('[data-car]').forEach(function (z) { z.classList.toggle('on', z === b); }); }); });
    $('csGo').addEventListener('click', async function () {
      var r = await play('race', { car: car }); if (!r) return;
      for (var i = 0; i < 6; i++) { var c = $('csCar' + i); c.style.transition = 'none'; c.style.transform = 'translateX(0)'; }
      await sleep(40);
      r.view.order.forEach(function (id, pos) { var c = $('csCar' + id); c.style.transition = 'transform ' + (2.6 + pos * 0.32).toFixed(2) + 's cubic-bezier(.3,.1,.3,1)'; var dist = c.parentElement.clientWidth - c.offsetWidth - 22; c.style.transform = 'translateX(' + dist + 'px)'; });
      await sleep(2700 + 5 * 320);
      resultLine(box, r, '🏁 ' + (r.view.order[0] + 1));
    });
  };

  GAMES.roulette = function (box, x) {
    var bet = 'red', wr = 0;
    var opts = [['red', x.red, '×2'], ['black', x.black, '×2'], ['even', x.even, '×2'], ['odd', x.odd, '×2'], ['d1', '1-12', '×3'], ['d2', '13-24', '×3'], ['d3', '25-36', '×3']];
    box.innerHTML = '<div class="cs-stage rl-stage"><div class="rl-big"><div class="rl-wheel" id="csRlW">' + rouletteSvg() + '</div><div class="rl-orbit" id="csRlO"><i class="rl-pearl"></i></div><div class="rl-ball" id="csRl">?</div></div></div><div class="cs-res"></div>' +
      stakePanel(x.bet, '<div class="cs-opts rl-opts">' + opts.map(function (o, i) { return '<button type="button" data-b="' + o[0] + '" class="' + (i ? '' : 'on') + ' b-' + o[0] + '">' + esc(o[1]) + '<small>' + o[2] + '</small></button>'; }).join('') +
        '<label class="rl-num"><input id="csRlNum" inputmode="numeric" maxlength="2" placeholder="0-36"><small>×36</small></label></div>');
    bindStake(box);
    var pick = function (b) { bet = b; box.querySelectorAll('[data-b]').forEach(function (z) { z.classList.toggle('on', z.getAttribute('data-b') === b); }); };
    box.querySelectorAll('[data-b]').forEach(function (b) { b.addEventListener('click', function () { $('csRlNum').value = ''; pick(b.getAttribute('data-b')); }); });
    $('csRlNum').addEventListener('input', function () { var v = parseInt(this.value, 10); if (v >= 0 && v <= 36) pick('n' + v); });
    $('csGo').addEventListener('click', async function () {
      var r = await play('roulette', { bet: bet }); if (!r) return;
      var el = $('csRl'), w = $('csRlW'), orb = $('csRlO'); el.className = 'rl-ball spin';
      wr += 1080 + Math.floor(Math.random() * 360); w.style.transform = 'rotate(' + wr + 'deg)';
      // la bille tourne dans l'autre sens puis se pose sur la case du numéro tiré (dans la roue qui a tourné)
      var idx = RL_ORDER.indexOf(r.view.n), target = ((idx * 360 / 37 + wr) % 360 + 360) % 360;
      orb.style.transition = 'none'; orb.style.transform = 'rotate(0deg)'; orb.getBoundingClientRect();
      orb.style.transition = 'transform 2.6s cubic-bezier(.15,.7,.2,1)'; orb.style.transform = 'rotate(' + (target - 360 * 4) + 'deg)';
      for (var i = 0; i < 16; i++) { el.textContent = Math.floor(Math.random() * 37); await sleep(60 + i * 12); }
      el.textContent = r.view.n; el.className = 'rl-ball ' + (r.view.n === 0 ? 'z' : r.view.red ? 'r' : 'k');
      resultLine(box, r);
    });
  };

  // vraie roue européenne : 37 cases (0 vert), numéros écrits dans chaque case
  var RL_ORDER = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];
  var RL_RED = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
  function rouletteSvg() {
    var s = '', st = 360 / 37, pt = function (r, a) { a = a * Math.PI / 180; return (r * Math.sin(a)).toFixed(2) + ' ' + (-r * Math.cos(a)).toFixed(2); };
    RL_ORDER.forEach(function (n, i) {
      var a0 = i * st - st / 2, a1 = a0 + st, c = n === 0 ? '#16A34A' : RL_RED.indexOf(n) >= 0 ? '#DC2626' : '#111827';
      s += '<path d="M' + pt(70, a0) + ' L' + pt(112, a0) + ' A112 112 0 0 1 ' + pt(112, a1) + ' L' + pt(70, a1) + ' A70 70 0 0 0 ' + pt(70, a0) + 'Z" fill="' + c + '" stroke="#D4AF37" stroke-width=".8"/>';
      s += '<text transform="rotate(' + (i * st).toFixed(2) + ') translate(0 -99)" text-anchor="middle" dominant-baseline="middle" font-size="9.5" font-weight="900" font-family="system-ui" fill="#fff">' + n + '</text>';
    });
    var spokes = ''; for (var k = 0; k < 8; k++) spokes += '<path d="M0 0L' + pt(56, k * 45) + '" stroke="#F5D06F" stroke-width="3" stroke-linecap="round"/>';
    return '<svg viewBox="-126 -126 252 252"><defs><radialGradient id="rlWood" cx="50%" cy="50%" r="50%"><stop offset=".85" stop-color="#7C2D12"/><stop offset="1" stop-color="#431407"/></radialGradient><radialGradient id="rlCone" cx="40%" cy="35%" r="70%"><stop offset="0" stop-color="#A16207"/><stop offset="1" stop-color="#422006"/></radialGradient><radialGradient id="rlHub" cx="35%" cy="30%" r="70%"><stop offset="0" stop-color="#FFF6C8"/><stop offset=".55" stop-color="#F5B700"/><stop offset="1" stop-color="#9A6A00"/></radialGradient></defs>' +
      '<circle r="125" fill="url(#rlWood)"/><circle r="116" fill="none" stroke="#D4AF37" stroke-width="2"/>' + s + '<circle r="70" fill="url(#rlCone)" stroke="#D4AF37" stroke-width="1.5"/>' + spokes + '<circle r="24" fill="url(#rlHub)"/></svg>';
  }
  var SLOT_PAY = [['gem', '×50'], ['seven', '×20'], ['bell', '×10'], ['lemon', '×5'], ['cherry', '×3'], ['cherry2', '×1,5']];
  GAMES.slots = function (box, x) {
    var pay = SLOT_PAY.map(function (p) { var two = p[0] === 'cherry2'; return '<span><em>' + ART.sym(two ? 'cherry' : p[0]) + '</em><small>' + (two ? '×2' : '×3') + '</small><b>' + p[1] + '</b></span>'; }).join('');
    box.innerHTML = '<div class="cs-stage slot-stage"><div class="slot2"><div class="slot2-top">LUCKY 777</div><div class="slot2-win"><span id="csR0">' + ART.sym('cherry') + '</span><span id="csR1">' + ART.sym('gem') + '</span><span id="csR2">' + ART.sym('seven') + '</span></div><i class="slot2-line"></i></div>' +
      '<div class="pay2">' + pay + '</div></div><div class="cs-res"></div>' + stakePanel();
    bindStake(box);
    var keys = ['gem', 'seven', 'bell', 'lemon', 'cherry', 'star'];
    $('csGo').addEventListener('click', async function () {
      var r = await play('slots', {}); if (!r) return;
      for (var t = 0; t < 12; t++) { for (var i = 0; i < 3; i++) $('csR' + i).innerHTML = ART.sym(t < 6 + i * 3 ? keys[Math.floor(Math.random() * 6)] : r.view.reels[i]); await sleep(80); }
      for (var j = 0; j < 3; j++) $('csR' + j).innerHTML = ART.sym(r.view.reels[j]);
      box.querySelector('.slot2').classList.toggle('won', r.win > 0);
      resultLine(box, r, r.mult ? '×' + r.mult : '');
    });
  };

  var PLINKO = [12, 3, 1.4, 0.6, 0.4, 0.6, 1.4, 3, 12];
  var PLK_COL = ['#EF4444', '#F97316', '#F59E0B', '#EAB308', '#84CC16', '#EAB308', '#F59E0B', '#F97316', '#EF4444'];
  GAMES.plinko = function (box, x) {
    var pegs = '';
    for (var row = 0; row < 8; row++) for (var c = 0; c <= row + 1; c++) pegs += '<circle cx="' + (150 + (c - (row + 1) / 2) * 30) + '" cy="' + (30 + row * 28) + '" r="3.4" fill="#fff"/>';
    var bins = PLINKO.map(function (m, i) { return '<g><rect x="' + (150 + (i - 4) * 30 - 14) + '" y="262" width="28" height="22" rx="5" fill="' + PLK_COL[i] + '"/><text x="' + (150 + (i - 4) * 30) + '" y="277" text-anchor="middle" font-size="9" font-weight="900" fill="#fff">' + m + '</text></g>'; }).join('');
    box.innerHTML = '<div class="cs-stage plk-stage"><svg viewBox="0 0 300 290" class="plk"><defs><radialGradient id="plkB" cx="35%" cy="30%" r="70%"><stop offset="0" stop-color="#fff"/><stop offset=".3" stop-color="#FF7AB6"/><stop offset="1" stop-color="#BE185D"/></radialGradient></defs>' + pegs + bins + '<circle id="csBall" cx="150" cy="10" r="8" fill="url(#plkB)"/></svg></div><div class="cs-res"></div>' + stakePanel();
    bindStake(box);
    $('csGo').addEventListener('click', async function () {
      var r = await play('plinko', {}); if (!r) return;
      var ball = $('csBall'), pos = 0;
      ball.style.transition = 'none'; ball.setAttribute('cx', 150); ball.setAttribute('cy', 10); ball.getBoundingClientRect(); ball.style.transition = '';
      for (var row = 0; row < 8; row++) { pos += r.view.path[row]; await sleep(140); ball.setAttribute('cx', 150 + (pos - (row + 1) / 2) * 30); ball.setAttribute('cy', 30 + row * 28 + 14); }
      await sleep(160); ball.setAttribute('cy', 268);
      resultLine(box, r, '×' + r.mult);
      setTimeout(function () { if (!$('csBall')) return; ball.style.transition = 'none'; ball.setAttribute('cx', 150); ball.setAttribute('cy', 10); ball.getBoundingClientRect(); ball.style.transition = ''; }, 1400);
    });
  };

  GAMES.keno = function (box, x) {
    var picks = [];
    box.innerHTML = '<div class="cs-stage keno-stage"><div class="keno" id="csKeno">' + Array.from({ length: 20 }, function (_, i) { return '<button type="button" data-k="' + (i + 1) + '">' + (i + 1) + '</button>'; }).join('') + '</div>' +
      '<div class="pay2 kn"><span><small>1</small><b>×0,6</b></span><span><small>2</small><b>×3,5</b></span><span><small>3</small><b>×25</b></span></div><small class="cs-lbl" id="csKn"></small></div><div class="cs-res"></div>' + stakePanel();
    bindStake(box);
    var paint = function () { $('csKn').textContent = fmt(x.picked, { n: picks.length }); box.querySelectorAll('[data-k]').forEach(function (b) { b.className = picks.indexOf(+b.getAttribute('data-k')) >= 0 ? 'pk' : ''; }); };
    box.querySelectorAll('[data-k]').forEach(function (b) {
      b.addEventListener('click', function () { var k = +b.getAttribute('data-k'), i = picks.indexOf(k); if (i >= 0) picks.splice(i, 1); else if (picks.length < 3) picks.push(k); paint(); });
    });
    paint();
    $('csGo').addEventListener('click', async function () {
      if (picks.length !== 3) { toast(x.pick3); return; }
      var r = await play('keno', { picks: picks }); if (!r) return;
      paint();
      for (var i = 0; i < 5; i++) { var b = box.querySelector('[data-k="' + r.view.draw[i] + '"]'); b.className = picks.indexOf(r.view.draw[i]) >= 0 ? 'pk hit' : 'dr'; await sleep(220); }
      resultLine(box, r, fmt(x.hits, { n: r.view.hits }));
    });
  };

  /* grattage : le joueur gratte avec son doigt (ou la souris) ; tout se découvre seul après quelques secondes */
  GAMES.scratch = function (box, x) {
    var pay = [['crown', '×20'], ['diamond', '×5'], ['star', '×2'], ['clover', '×1']].map(function (p) { return '<span><em>' + ART.sym(p[0]) + '</em><small>×3</small><b>' + p[1] + '</b></span>'; }).join('');
    box.innerHTML = '<div class="cs-stage scr-stage"><div class="scr-ticket"><div class="scr-head">SCRATCH · OROLADO</div><div class="scr-w"><div class="scr" id="csScr">' + Array.from({ length: 9 }, function () { return '<span></span>'; }).join('') + '</div><canvas class="scr-cv" id="csScrCv"></canvas></div></div>' +
      '<div class="pay2">' + pay + '</div></div><div class="cs-res"></div>' + stakePanel(x.bet);
    bindStake(box);
    var cv = $('csScrCv'), ctx = cv.getContext('2d'), cur = null, done = true, autoT = 0;
    var cover = function () {
      var w = cv.clientWidth, h = cv.clientHeight; cv.width = w; cv.height = h;
      var gr = ctx.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#e5e7eb'); gr.addColorStop(.5, '#9ca3af'); gr.addColorStop(1, '#f3f4f6');
      ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = gr; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.font = '900 ' + Math.round(w / 10) + 'px system-ui'; ctx.textAlign = 'center'; ctx.fillText('SCRATCH', w / 2, h / 2 + w / 32);
      cv.style.opacity = '1';
    };
    var reveal = function () {
      if (done || !cur) return; done = true; clearTimeout(autoT);
      cv.style.opacity = '0';
      resultLine(box, cur, cur.mult ? '×' + cur.mult : '');
    };
    var scratchAt = function (e) {
      if (done) return;
      var rc = cv.getBoundingClientRect(), p = e.touches ? e.touches[0] : e;
      ctx.globalCompositeOperation = 'destination-out'; ctx.beginPath(); ctx.arc(p.clientX - rc.left, p.clientY - rc.top, Math.max(16, rc.width / 14), 0, Math.PI * 2); ctx.fill();
    };
    var down = false;
    cv.addEventListener('pointerdown', function (e) { down = true; scratchAt(e); });
    cv.addEventListener('pointermove', function (e) { if (down) scratchAt(e); });
    window.addEventListener('pointerup', function () { down = false; });
    cover();
    $('csGo').addEventListener('click', async function () {
      if (!done) { reveal(); return; }
      var r = await play('scratch', {}); if (!r) return;
      cur = r; done = false;
      box.querySelectorAll('.scr span').forEach(function (c, i) { c.innerHTML = ART.sym(r.view.grid[i]); });
      cover();
      $('csGo').textContent = x.revealAll;
      clearTimeout(autoT); autoT = setTimeout(reveal, 7000); // découvert tout seul après 7 s
      var wait = setInterval(function () { if (done) { clearInterval(wait); var g = $('csGo'); if (g) g.textContent = x.bet; } }, 300);
    });
  };

  /* penalty (v2695, comme Evoplay) : série de 8 tirs, la ligne du haut montre les gains (×1,44 → ×24,60) ;
     on touche l'endroit du but où l'on veut tirer (6 zones) ; chaque but fait monter le gain ; on encaisse quand on veut. */
  var PEN_LADDER = [1.44, 2.16, 3.24, 4.86, 7.29, 10.93, 16.4, 24.6];
  GAMES.penalty = function (box, x) {
    var g = null, busy = false;
    var net = ''; for (var i = 1; i < 16; i++) net += '<path d="M' + (45 + i * 13.1) + ' 62V150"/>'; for (var j = 1; j < 7; j++) net += '<path d="M45 ' + (62 + j * 12.6) + 'H255"/>';
    var scene = '<svg class="pen-scene" viewBox="0 0 300 300" preserveAspectRatio="none">' +
      '<defs><linearGradient id="penSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0B1F4D"/><stop offset="1" stop-color="#1E4FA8"/></linearGradient><linearGradient id="penGr" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#16A34A"/><stop offset="1" stop-color="#14532D"/></linearGradient></defs>' +
      '<rect width="300" height="160" fill="url(#penSky)"/><g fill="#fff" opacity=".9"><circle cx="30" cy="16" r="5"/><circle cx="270" cy="16" r="5"/></g><g fill="#fff" opacity=".16"><path d="M30 16l-30 60h60zM270 16l-30 60h60z"/></g>' +
      '<rect y="96" width="300" height="56" fill="#1E293B"/><g fill="#475569">' + Array.from({ length: 30 }, function (_, k) { return '<circle cx="' + (k * 10 + 5) + '" cy="' + (104 + (k % 3) * 7) + '" r="3.2"/>'; }).join('') + '</g>' +
      '<rect y="150" width="300" height="150" fill="url(#penGr)"/><g fill="#fff" opacity=".06"><rect y="170" width="300" height="20"/><rect y="210" width="300" height="24"/><rect y="256" width="300" height="28"/></g>' +
      '<path d="M20 300L60 150H240L280 300" fill="none" stroke="rgba(255,255,255,.55)" stroke-width="2"/><path d="M90 195H210" stroke="rgba(255,255,255,.45)" stroke-width="2"/>' +
      '<rect x="45" y="62" width="210" height="88" fill="rgba(255,255,255,.06)"/><g stroke="rgba(255,255,255,.35)" stroke-width="1">' + net + '</g>' +
      '<path d="M45 151V60H255V151" fill="none" stroke="#fff" stroke-width="5" stroke-linejoin="round"/></svg>';
    var keeper = '<svg viewBox="0 0 70 90"><circle cx="35" cy="14" r="10" fill="#f1c27d"/><path d="M27 10a8 6 0 0 1 16 0z" fill="#111"/><path d="M20 26h30l4 34H16z" fill="#f59e0b"/><path d="M20 28L4 16M50 28l16-12" stroke="#f59e0b" stroke-width="8" stroke-linecap="round"/><circle cx="4" cy="15" r="6" fill="#22c55e"/><circle cx="66" cy="15" r="6" fill="#22c55e"/><path d="M22 60l-4 26M48 60l4 26" stroke="#111827" stroke-width="9" stroke-linecap="round"/><text x="35" y="48" text-anchor="middle" font-size="13" font-weight="900" fill="#111">1</text></svg>';
    var ball = ART.obj('sports').replace('viewBox="0 0 64 64"', 'viewBox="8 8 48 48"'); // v2697 : le même beau ballon que les Paris sportifs
    // 9 zones : 3 colonnes (gauche, centre, droite) × 3 hauteurs (haut, milieu, bas)
    var zones = ''; for (var h = 0; h < 3; h++) for (var c = 0; c < 3; c++) zones += '<button type="button" class="pen-z" data-c="' + c + '" data-h="' + h + '" style="left:' + (15 + c * 23.33) + '%;top:' + (20.5 + h * 9.67) + '%" aria-label="' + (c + 1) + '"><i></i></button>';
    box.innerHTML = '<div class="pen-lad" id="csPl">' + PEN_LADDER.map(function (m, k) { return '<span data-k="' + k + '">×' + String(m).replace('.', ',') + '</span>'; }).join('') + '</div>' +
      '<div class="cs-stage pen3">' + scene + zones + '<span class="kp3" id="csKp">' + keeper + '</span><span class="ball3" id="csPb">' + ball + '</span><b class="pen-tip" id="csPt"></b></div><div class="cs-res"></div>' +
      (guest() ? '<div id="csNeed"></div>' : stakePanel(x.bet));
    if (guest()) { needAccount($('csNeed'), x); return; }
    bindStake(box);
    var btn = $('csGo'), st = box.querySelector('.pen3'), pb = $('csPb'), kp = $('csKp');
    var reset = function () { pb.style.transition = 'none'; kp.style.transition = 'none'; pb.style.transform = 'none'; kp.style.transform = 'none'; pb.offsetHeight; pb.style.transition = ''; kp.style.transition = ''; };
    var paint = function (r) {
      g = r;
      var k = r.k || 0;
      box.querySelectorAll('#csPl span').forEach(function (s, i) { s.className = i < k ? 'ok' : (i === k && !r.done ? 'cur' : ''); });
      if (r.done && !(r.win > 0) && r.boom != null) { var b = box.querySelector('#csPl span[data-k="' + r.boom + '"]'); if (b) b.className = 'miss'; }
      st.classList.toggle('live', !r.done);
      $('csPt').textContent = !r.done ? x.shoot : '';
      if (r.done) { btn.textContent = x.bet; btn.classList.remove('cash'); }
      else { btn.classList.toggle('cash', k > 0); btn.textContent = k ? x.cashout + ' ' + m2(r.stake * r.mult) + ' $' : x.shoot; box.querySelector('.cs-res').className = 'cs-res'; box.querySelector('.cs-res').innerHTML = ''; }
    };
    var shoot = async function (col, hgt) {
      if (!g || g.done || busy) return;
      busy = true;
      var r = await multi('penalty', 'shoot', { aim: col, h: hgt });
      if (!r) { busy = false; return; }
      var last = (r.shots || [])[r.shots.length - 1] || [col, hgt, 1, 1], goal = !!last[3], keeperCol = last[2];
      var w = st.clientWidth, H = st.clientHeight;
      reset(); await sleep(30);
      var tx = (0.5 - 0.5 + (col - 1) * 0.2333) * w, ty = -(H * 0.86 - H * (0.205 + (hgt + 0.5) * 0.0967) - H * 0.04);
      kp.style.transform = 'translateX(' + ((keeperCol - 1) * w * 0.22) + 'px) rotate(' + ((keeperCol - 1) * 58) + 'deg)';
      pb.style.transform = 'translate(' + tx + 'px,' + (goal ? ty : ty + H * 0.06) + 'px) scale(.42) rotate(540deg)';
      await sleep(640);
      if (!goal) { pb.style.transition = 'transform .45s ease-in'; pb.style.transform = 'translate(' + (tx * 1.1) + 'px,' + (ty + H * 0.22) + 'px) scale(.46) rotate(620deg)'; }
      else { st.classList.add('net-hit'); setTimeout(function () { st.classList.remove('net-hit'); }, 500); }
      await sleep(goal ? 300 : 500);
      busy = false;
      paint(r);
      if (r.done) resultLine(box, r, r.win > 0 ? '×' + m2(r.mult || (r.win / r.stake)) : x.saved);
      else { setTimeout(function () { if (g && !g.done && !busy) reset(); }, 500); }
    };
    box.querySelectorAll('.pen-z').forEach(function (z) { z.addEventListener('click', function () { shoot(+z.getAttribute('data-c'), +z.getAttribute('data-h')); }); });
    btn.addEventListener('click', async function () {
      if (g && !g.done) {
        if (!g.k) { toast(x.shoot, 'ok'); return; }
        var c = await multi('penalty', 'cash'); if (c) { paint(c); resultLine(box, c, '×' + m2(c.mult)); } return;
      }
      reset();
      var r = await multi('penalty', 'start'); if (r) paint(r);
    });
    multi('penalty', 'state', null, true).then(function (r) { if (r && !r.done) paint(r); });
  };

  GAMES.colors = function (box, x) {
    var bet = 'green';
    var cls = function (i) { return [1, 3, 7, 9].indexOf(i) >= 0 ? 'g' : [2, 4, 6, 8].indexOf(i) >= 0 ? 'r' : (i === 0 ? 'rv' : 'gv'); };
    var nums = Array.from({ length: 10 }, function (_, i) { return '<button type="button" data-b="n' + i + '" class="cn ' + cls(i) + '">' + i + '</button>'; }).join('');
    box.innerHTML = '<div class="cs-stage clr-stage"><div class="clr-ball" id="csClr">?</div></div><div class="cs-res"></div>' +
      stakePanel(x.bet, '<div class="cs-opts three"><button type="button" data-b="green" class="on b-green">' + esc(x.green) + '<small>×2</small></button><button type="button" data-b="violet" class="b-violet">' + esc(x.violet) + '<small>×4,5</small></button><button type="button" data-b="red" class="b-red">' + esc(x.red) + '<small>×2</small></button></div><div class="cs-nums">' + nums + '</div><small class="cs-lbl">' + esc(x.number) + ' ×9</small>');
    bindStake(box);
    box.querySelectorAll('[data-b]').forEach(function (b) { b.addEventListener('click', function () { bet = b.getAttribute('data-b'); box.querySelectorAll('[data-b]').forEach(function (z) { z.classList.toggle('on', z === b); }); }); });
    $('csGo').addEventListener('click', async function () {
      var r = await play('colors', { bet: bet }); if (!r) return;
      var el = $('csClr');
      for (var i = 0; i < 10; i++) { el.textContent = i; el.className = 'clr-ball ' + cls(i); await sleep(70); }
      var n = r.view.n; el.textContent = n;
      el.className = 'clr-ball ' + cls(n);
      resultLine(box, r);
    });
  };

  /* --- jeux en plusieurs étapes (visiteur → inscription) --- */
  function needAccount(box, x) {
    if (!guest()) return false;
    box.innerHTML = '<div class="cs-try big"><span>' + esc(x.tryNote) + '</span><button type="button" id="csSign2">' + esc(x.signup) + '</button></div>';
    $('csSign2').addEventListener('click', function () { close(); if (D6.App && D6.App.showAuth) D6.App.showAuth('register'); });
    return true;
  }

  /* --- 3 jeux « ça monte » (même calcul serveur, décor différent) : le personnage du jeu = celui du logo --- */
  var CRASH_THEME = {
    crash: { col: '#ff2d55', cls: 'th-plane', w: 78, h: 78 },
    jet: { col: '#a855f7', cls: 'th-jet', w: 70, h: 70 },
    rocket: { col: '#22d3ee', cls: 'th-rocket', w: 70, h: 70 }
  };
  function histChip(v) { return '<i class="' + (v < 2 ? 'lo' : v < 10 ? 'mid' : 'hi') + '">' + v.toFixed(2) + '×</i>'; }
  function makeCrash(game) {
    return function (box, x) {
      var th = CRASH_THEME[game], g = null, off = 0;
      S.hist = S.hist || {}; var hist = S.hist[game] = S.hist[game] || [];
      var MULT = function (s) { return Math.max(1, Math.floor(Math.exp(0.08 * Math.max(0, s)) * 100) / 100); };
      var stars = ''; for (var i = 0; i < 26; i++) stars += '<circle cx="' + ((i * 137 + 31) % 300) + '" cy="' + ((i * 71 + i * i * 13 + 7) % 165) + '" r="' + (i % 3 ? 0.8 : 1.3) + '" fill="#fff" opacity="' + (0.25 + (i % 4) * 0.12) + '"/>';
      box.innerHTML = '<div class="cs-stage crash-stage ' + th.cls + '"><i class="crash-rays"></i>' +
        '<svg viewBox="0 0 300 170" preserveAspectRatio="none" class="crash-sky"><defs><linearGradient id="csAreaG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + th.col + '" stop-opacity=".55"/><stop offset="1" stop-color="' + th.col + '" stop-opacity="0"/></linearGradient></defs>' +
        stars + '<g stroke="rgba(255,255,255,.07)">' + [34, 68, 102, 136].map(function (y) { return '<path d="M0 ' + y + 'H300"/>'; }).join('') + '</g>' +
        '<path id="csArea" d="M10 160" fill="url(#csAreaG)"/><path id="csTrail" d="M10 160" fill="none" stroke="' + th.col + '" stroke-width="3.6" stroke-linecap="round"/></svg>' +
        '<span class="plane" id="csPlane" style="width:' + th.w + 'px;height:' + th.h + 'px">' + ART.obj(game) + '</span><b class="crash-n" id="csCm">1.00×</b><small class="crash-hint" id="csCs"></small></div><div class="cs-res"></div>' +
        (guest() ? '<div id="csNeed"></div>' : stakePanel(x.bet)); // v2698 : plus de case « Encaissement auto » (incomprise, prenait la place)
      if (guest()) {
        needAccount($('csNeed'), x);
        // visiteur : le personnage attend en bas à gauche (pas coincé dans le coin du haut)
        var cst = box.querySelector('.crash-stage'), pl = $('csPlane');
        if (cst && pl) pl.style.transform = 'translate(22px,' + Math.max(40, cst.clientHeight * 0.66 - th.h * 0.5) + 'px)';
        return;
      }
      bindStake(box);
      var btn = $('csGo'), plane = $('csPlane');
      var draw = function (m, s) {
        $('csCm').textContent = m.toFixed(2) + '×';
        var px = Math.min(262, 10 + s * 18), py = Math.max(22, 160 - (m - 1) * 40);
        var st = $('csTrail').ownerSVGElement.getBoundingClientRect(), kx = st.width / 300, ky = st.height / 170;
        var d = 'M10 160 Q ' + ((10 + px) / 2) + ' 160 ' + px + ' ' + py;
        $('csTrail').setAttribute('d', d); $('csArea').setAttribute('d', d + ' L' + px + ' 170 L10 170 Z');
        // v2695 : l'avion reste toujours entier dans l'écran (jamais coupé au bord)
        var X0 = Math.max(22, Math.min(st.width - th.w - 10, px * kx - th.w * 0.22)), Y0 = Math.max(34, Math.min(st.height - th.h - 10, py * ky - th.h * 0.72));
        plane.style.transform = 'translate(' + X0 + 'px,' + Y0 + 'px)';
      };
      var finish = function (r) {
        stopAll(); g = r;
        box.querySelector('.crash-stage').classList.remove('flying');
        if (!(r.out > 0)) { plane.classList.add('gone'); }
        $('csCm').className = 'crash-n ' + (r.out > 0 ? 'w' : 'l');
        $('csCm').textContent = (r.out > 0 ? r.out : r.c).toFixed(2) + '×';
        resultLine(box, r, r.out > 0 ? fmt(x.cashed, { x: r.out.toFixed(2), w: m2(r.win) }) : fmt(x.boom, { x: r.c.toFixed(2) }));
        btn.textContent = x.bet; btn.classList.remove('cash'); btn.disabled = false;
      };
      var fly = function (r) {
        g = r; off = r.now - Date.now() / 1000;
        plane.classList.remove('gone');
        box.querySelector('.crash-stage').classList.add('flying');
        $('csCm').className = 'crash-n'; box.querySelector('.cs-res').className = 'cs-res'; box.querySelector('.cs-res').innerHTML = '';
        btn.classList.add('cash');
        var tick = function () {
          var s = Date.now() / 1000 + off - g.t0, m = MULT(s);
          draw(m, s);
          btn.textContent = x.cashout + ' ' + m2(g.stake * m) + ' $';
          S.raf = requestAnimationFrame(tick);
        };
        tick();
        S.timer = setInterval(async function () {
          var st = await multi(game, 'state', null, true);
          if (st && st.done) finish(st);
        }, 700);
      };
      btn.addEventListener('click', async function () {
        if (g && !g.done) { btn.disabled = true; var c = await multi(game, 'cash'); btn.disabled = false; if (c && c.done) finish(c); return; }
        var auto = parseFloat(String(($('csAuto') || {}).value || '').replace(',', '.'));
        var r = await multi(game, 'start', auto >= 1.01 ? { auto: auto } : {});
        if (!r) return;
        if (r.done) { finish(r); return; }
        fly(r);
      });
      draw(1, 0);
      multi(game, 'state', null, true).then(function (r) { if (r && !r.done) fly(r); });
    };
  }
  GAMES.crash = makeCrash('crash');
  GAMES.jet = makeCrash('jet');
  GAMES.rocket = makeCrash('rocket');

  /* --- Verger d'or : 10 étages, pommes d'or ; le ver = perdu ; on encaisse quand on veut --- */
  GAMES.apple = function (box, x) {
    var g = null;
    var rows = ''; for (var r = 9; r >= 0; r--) rows += '<div class="ap-row" data-row="' + r + '"><em></em>' + [0, 1, 2, 3, 4].map(function (c) { return '<button type="button" data-c="' + c + '"></button>'; }).join('') + '</div>';
    var lv = 1;
    box.innerHTML = '<div class="cs-stage ap-stage"><div class="ap" id="csAp">' + rows + '</div></div><div class="cs-res"></div>' + (guest() ? '<div id="csNeed"></div>' : stakePanel(x.bet, '<label class="cs-lbl">' + esc(x.level) + '</label><div class="cs-seg">' + [1, 2, 3, 4].map(function (n) { return '<button type="button" data-lv="' + n + '" class="' + (n === 1 ? 'on' : '') + '">' + n + '</button>'; }).join('') + '</div>'));
    if (guest()) { needAccount($('csNeed'), x); return; }
    bindStake(box);
    var btn = $('csGo');
    var mult = function (k) { return k < 1 ? 0 : Math.floor(0.97 / Math.pow((5 - lv) / 5, k) * 100) / 100; };
    var labels = function () { box.querySelectorAll('.ap-row').forEach(function (row) { var k = +row.getAttribute('data-row') + 1, v = mult(k); row.querySelector('em').textContent = '×' + (v >= 1000 ? Math.round(v) : v.toFixed(2)); }); };
    labels();
    box.querySelectorAll('[data-lv]').forEach(function (b) { b.addEventListener('click', function () { if (g && !g.done) return; lv = +b.getAttribute('data-lv'); box.querySelectorAll('[data-lv]').forEach(function (z) { z.classList.toggle('on', z === b); }); labels(); }); });
    var paint = function (r) {
      g = r;
      box.querySelectorAll('.ap-row').forEach(function (row) {
        var k = +row.getAttribute('data-row');
        row.classList.toggle('cur', !r.done && k === r.k);
        row.classList.toggle('past', k < r.k);
        row.querySelectorAll('button').forEach(function (b) {
          var c = +b.getAttribute('data-c'); b.className = ''; b.innerHTML = '';
          if (k < r.k && r.picks[k] === c) { b.className = 'good'; b.innerHTML = ART.sym('goldapple'); }
          if (r.done && r.bad) {
            var bk = [].concat(r.bad[k]);
            if (bk.indexOf(c) >= 0 && (k <= r.k)) { b.className = (r.boom === k) ? 'rot boom' : 'rot'; b.innerHTML = ART.sym('worm'); }
          }
        });
      });
      if (r.done) { resultLine(box, r, r.win > 0 ? '×' + mult(r.k).toFixed(2) : ''); btn.textContent = x.bet; btn.classList.remove('cash'); }
      else {
        btn.classList.add('cash');
        btn.textContent = r.k ? x.cashout + ' ' + m2(r.stake * r.mult) + ' $' : x.open;
        box.querySelector('.cs-res').className = 'cs-res'; box.querySelector('.cs-res').innerHTML = '';
      }
    };
    btn.addEventListener('click', async function () {
      if (g && !g.done) { if (!g.k) return; var c = await multi('apple', 'cash'); if (c) paint(c); return; }
      var r = await multi('apple', 'start', { level: lv }); if (r) { if (r.lv) { lv = r.lv; labels(); } paint(r); }
    });
    box.querySelectorAll('.ap-row button').forEach(function (b) {
      b.addEventListener('click', async function () {
        if (!g || g.done) return;
        if (+b.parentElement.getAttribute('data-row') !== g.k) return;
        var r = await multi('apple', 'pick', { cell: +b.getAttribute('data-c') }); if (r) paint(r);
      });
    });
    multi('apple', 'state', null, true).then(function (r) { if (r && !r.done) paint(r); });
  };

  GAMES.mines = function (box, x) {
    var g = null, mines = 3;
    box.innerHTML = '<div class="cs-stage mn-stage"><div class="mn-info"><span>' + esc(x.minesN) + ' <b id="csMnN">3</b></span><span id="csMnInfo"></span></div><div class="mn" id="csMn">' + Array.from({ length: 25 }, function (_, i) { return '<button type="button" data-c="' + i + '"></button>'; }).join('') + '</div></div><div class="cs-res"></div>' +
      (guest() ? '<div id="csNeed"></div>' : stakePanel(x.bet, '<div class="cs-seg">' + [1, 3, 5, 10].map(function (n) { return '<button type="button" data-m="' + n + '" class="' + (n === 3 ? 'on' : '') + '">' + n + '</button>'; }).join('') + '</div>'));
    if (guest()) { needAccount($('csNeed'), x); return; }
    bindStake(box);
    var btn = $('csGo');
    box.querySelectorAll('.cs-seg [data-m]').forEach(function (b) { b.addEventListener('click', function () { if (g && !g.done) return; mines = +b.getAttribute('data-m'); $('csMnN').textContent = mines; box.querySelectorAll('.cs-seg [data-m]').forEach(function (z) { z.classList.toggle('on', z === b); }); }); });
    var paint = function (r) {
      g = r;
      box.querySelectorAll('#csMn button').forEach(function (b) {
        var c = +b.getAttribute('data-c'); b.className = ''; b.innerHTML = '';
        if (r.open && r.open.indexOf(c) >= 0) { b.className = 'ok'; b.innerHTML = ART.sym('gem'); }
        if (r.done && r.mines && r.mines.indexOf(c) >= 0) { b.className = c === r.boom ? 'boom' : 'mine'; b.innerHTML = ART.sym('bomb'); }
      });
      if (r.done) { resultLine(box, r, r.mult ? '×' + r.mult : ''); btn.textContent = x.bet; btn.classList.remove('cash'); $('csMnInfo').textContent = ''; }
      else {
        btn.classList.add('cash');
        btn.textContent = r.open.length ? x.cashout + ' ' + m2(r.stake * r.mult) + ' $' : x.open;
        $('csMnInfo').textContent = fmt(x.next, { x: r.next.toFixed(2) });
        box.querySelector('.cs-res').className = 'cs-res'; box.querySelector('.cs-res').innerHTML = '';
      }
    };
    btn.addEventListener('click', async function () {
      if (g && !g.done) { if (!g.open.length) return; var c = await multi('mines', 'cash'); if (c) paint(c); return; }
      var r = await multi('mines', 'start', { mines: mines }); if (r) paint(r);
    });
    box.querySelectorAll('#csMn button').forEach(function (b) {
      b.addEventListener('click', async function () { if (!g || g.done) return; var r = await multi('mines', 'open', { cell: +b.getAttribute('data-c') }); if (r) paint(r); });
    });
    multi('mines', 'state', null, true).then(function (r) { if (r && !r.done) paint(r); });
  };

  var SUITS = ['♠', '♥', '♦', '♣'];
  function cardHtml(v, red, big) {
    var r = ['', 'A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'][v] || '?';
    var s = SUITS[(v + (red ? 1 : 0)) % 4];
    return '<span class="pc' + (big ? ' big' : '') + (s === '♥' || s === '♦' ? ' rd' : '') + '"><b>' + r + '</b><i>' + s + '</i></span>';
  }
  function cardBack() { return '<span class="pc back"></span>'; }
  /* Hi-Lo : table orange, grosse carte + paquet, ligne des cartes déjà sorties */
  GAMES.hilo = function (box, x) {
    var g = null;
    box.innerHTML = '<div class="cs-stage hl-stage"><div class="hl-row" id="csHlRow"></div><div class="hl"><span class="hl-deck">' + cardBack() + '</span><span id="csCard">' + cardHtml(1, false, true) + '</span></div><small class="cs-lbl" id="csHlInfo"></small></div><div class="cs-res"></div>' +
      (guest() ? '<div id="csNeed"></div>' : '<div class="cs-opts two hl-btns" id="csHlBtns" hidden><button type="button" id="csHi"></button><button type="button" id="csLo"></button></div>' + stakePanel());
    if (guest()) { needAccount($('csNeed'), x); return; }
    bindStake(box);
    var btn = $('csGo');
    var paint = function (r) {
      g = r;
      var cs = r.cards || [];
      $('csCard').innerHTML = cardHtml(r.card || 1, cs.length % 2 === 1, true);
      $('csHlRow').innerHTML = cs.slice(0, -1).slice(-7).map(function (c, i) { return cardHtml(c, i % 2 === 1, false); }).join('');
      if (r.done) {
        $('csHlBtns').hidden = true; btn.textContent = x.again; btn.classList.remove('cash');
        resultLine(box, r, r.mult > 1 ? '×' + r.mult : ''); $('csHlInfo').textContent = '';
      } else {
        $('csHlBtns').hidden = false;
        $('csHi').innerHTML = '▲ ' + esc(x.hi) + '<small>×' + r.hiMult + '</small>'; $('csLo').innerHTML = '▼ ' + esc(x.lo) + '<small>×' + r.loMult + '</small>';
        btn.textContent = r.k ? x.cashout + ' ' + m2(r.stake * r.mult) + ' $' : x.hi + ' / ' + x.lo; btn.classList.toggle('cash', r.k > 0);
        $('csHlInfo').textContent = r.k ? '×' + r.mult : '';
        box.querySelector('.cs-res').className = 'cs-res'; box.querySelector('.cs-res').innerHTML = '';
      }
    };
    $('csHi').addEventListener('click', async function () { if (g && !g.done) { var r = await multi('hilo', 'guess', { hi: 1 }); if (r) paint(r); } });
    $('csLo').addEventListener('click', async function () { if (g && !g.done) { var r = await multi('hilo', 'guess', { hi: 0 }); if (r) paint(r); } });
    btn.addEventListener('click', async function () {
      if (g && !g.done) { if (!g.k) return; var c = await multi('hilo', 'cash'); if (c) paint(c); return; }
      var r = await multi('hilo', 'start'); if (r) paint(r);
    });
    multi('hilo', 'state', null, true).then(function (r) { if (r && !r.done) paint(r); });
  };

  /* Dragon Tigre : tapis de table, côté Dragon bleu, côté Tigre orange */
  GAMES.dragon = function (box, x) {
    var bet = 'dragon';
    box.innerHTML = '<div class="cs-stage dt-stage"><div class="dt"><div class="dt-side d"><b>' + esc(x.dragonN) + '</b><div id="csDtD" class="dt-card">' + cardBack() + '</div></div><span class="dt-vs">VS</span><div class="dt-side t"><b>' + esc(x.tigerN) + '</b><div id="csDtT" class="dt-card">' + cardBack() + '</div></div></div><div class="dt-tie">' + esc(x.tie) + ' ×12</div></div><div class="cs-res"></div>' +
      stakePanel(x.bet, '<div class="cs-opts three"><button type="button" data-b="dragon" class="on b-dragon">' + esc(x.dragonN) + '<small>×2</small></button><button type="button" data-b="tie" class="b-tie">' + esc(x.tie) + '<small>×12</small></button><button type="button" data-b="tiger" class="b-tiger">' + esc(x.tigerN) + '<small>×2</small></button></div>');
    bindStake(box);
    box.querySelectorAll('[data-b]').forEach(function (b) { b.addEventListener('click', function () { bet = b.getAttribute('data-b'); box.querySelectorAll('[data-b]').forEach(function (z) { z.classList.toggle('on', z === b); }); }); });
    $('csGo').addEventListener('click', async function () {
      var r = await play('dragon', { bet: bet }); if (!r) return;
      var D = $('csDtD'), Tg = $('csDtT'); D.innerHTML = cardBack(); Tg.innerHTML = cardBack(); D.parentElement.classList.remove('won'); Tg.parentElement.classList.remove('won');
      await sleep(250); D.innerHTML = cardHtml(r.view.d, false, true);
      await sleep(450); Tg.innerHTML = cardHtml(r.view.t, true, true);
      if (r.view.d > r.view.t) D.parentElement.classList.add('won'); else if (r.view.t > r.view.d) Tg.parentElement.classList.add('won');
      resultLine(box, r, r.view.d === r.view.t ? x.tie : '');
    });
  };
  /* Baccara : tapis bleu nuit, Joueur (bleu) / Banque (rouge) */
  GAMES.baccarat = function (box, x) {
    var bet = 'player';
    box.innerHTML = '<div class="cs-stage bc-stage"><div class="bc"><div class="bc-h p"><b>' + esc(x.player) + ' <i id="csBcTp"></i></b><div id="csBcP" class="bc-cards">' + cardBack() + cardBack() + '</div></div><div class="bc-h b"><b>' + esc(x.banker) + ' <i id="csBcTb"></i></b><div id="csBcB" class="bc-cards">' + cardBack() + cardBack() + '</div></div></div></div><div class="cs-res"></div>' +
      stakePanel(x.bet, '<div class="cs-opts three"><button type="button" data-b="player" class="on b-player">' + esc(x.player) + '<small>×1,96</small></button><button type="button" data-b="tie" class="b-tie">' + esc(x.tie) + '<small>×9</small></button><button type="button" data-b="banker" class="b-banker">' + esc(x.banker) + '<small>×1,92</small></button></div>');
    bindStake(box);
    box.querySelectorAll('[data-b]').forEach(function (b) { b.addEventListener('click', function () { bet = b.getAttribute('data-b'); box.querySelectorAll('[data-b]').forEach(function (z) { z.classList.toggle('on', z === b); }); }); });
    $('csGo').addEventListener('click', async function () {
      var r = await play('baccarat', { bet: bet }); if (!r) return;
      var P = $('csBcP'), B = $('csBcB'); P.innerHTML = ''; B.innerHTML = ''; $('csBcTp').textContent = ''; $('csBcTb').textContent = '';
      var seq = [['p', 0], ['b', 0], ['p', 1], ['b', 1]];
      if (r.view.p[2]) seq.push(['p', 2]); if (r.view.b[2]) seq.push(['b', 2]);
      for (var i = 0; i < seq.length; i++) { var w = seq[i][0], c = r.view[w][seq[i][1]]; (w === 'p' ? P : B).insertAdjacentHTML('beforeend', cardHtml(c, w === 'b', false)); await sleep(260); }
      $('csBcTp').textContent = r.view.tp; $('csBcTb').textContent = r.view.tb;
      resultLine(box, r, r.view.tp + ' — ' + r.view.tb);
    });
  };
  function dieSvg(n) {
    var P = { 1: [[12, 12]], 2: [[7, 7], [17, 17]], 3: [[6, 6], [12, 12], [18, 18]], 4: [[7, 7], [17, 7], [7, 17], [17, 17]], 5: [[6, 6], [18, 6], [12, 12], [6, 18], [18, 18]], 6: [[7, 6], [17, 6], [7, 12], [17, 12], [7, 18], [17, 18]] }[n] || [];
    return '<svg viewBox="0 0 24 24"><rect x="1" y="1" width="22" height="22" rx="5" fill="#fff"/><rect x="2" y="2" width="20" height="8" rx="4" fill="#fff" opacity=".5"/>' + P.map(function (p) { return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="2.2" fill="' + (n === 1 || n === 4 ? '#e11d48' : '#1f2937') + '"/>'; }).join('') + '</svg>';
  }
  /* Sic Bo : gobelet doré, dôme en verre qui se soulève, 3 dés */
  GAMES.sicbo = function (box, x) {
    var bet = 'small';
    box.innerHTML = '<div class="cs-stage sb-stage"><div class="sb-shaker" id="csSbSh"><i class="sb-dome"></i><div class="sb" id="csSb">' + [1, 2, 3].map(function (n) { return '<span class="die">' + dieSvg(n * 2) + '</span>'; }).join('') + '</div><i class="sb-base"></i></div><b class="sb-sum" id="csSbS"></b></div><div class="cs-res"></div>' +
      stakePanel(x.bet, '<div class="cs-opts two"><button type="button" data-b="small" class="on">' + esc(x.small) + ' (4–10)<small>×2</small></button><button type="button" data-b="big">' + esc(x.big) + ' (11–17)<small>×2</small></button></div>');
    bindStake(box);
    box.querySelectorAll('[data-b]').forEach(function (b) { b.addEventListener('click', function () { bet = b.getAttribute('data-b'); box.querySelectorAll('[data-b]').forEach(function (z) { z.classList.toggle('on', z === b); }); }); });
    $('csGo').addEventListener('click', async function () {
      var r = await play('sicbo', { bet: bet }); if (!r) return;
      var sh = $('csSbSh'), d = box.querySelectorAll('#csSb .die');
      sh.classList.remove('open'); sh.classList.add('shake'); $('csSbS').textContent = '';
      for (var t = 0; t < 9; t++) { d.forEach(function (e) { e.innerHTML = dieSvg(1 + Math.floor(Math.random() * 6)); }); await sleep(80); }
      d.forEach(function (e, i) { e.innerHTML = dieSvg(r.view.dice[i]); });
      sh.classList.remove('shake'); sh.classList.add('open');
      await sleep(350);
      $('csSbS').textContent = r.view.sum + (r.view.triple ? ' · ' + x.triple : '');
      resultLine(box, r);
    });
  };
  function chestSvg(open, gold) {
    return '<svg viewBox="0 0 64 56"><path d="M6 24h52v26a4 4 0 0 1-4 4H10a4 4 0 0 1-4-4z" fill="#92400e"/><path d="M6 24h52v6H6z" fill="#78350f"/>' +
      (open ? '<path d="M8 22L14 4h36l6 18z" fill="#b45309"/>' + (gold ? '<circle cx="24" cy="24" r="6" fill="#facc15"/><circle cx="34" cy="22" r="6" fill="#fde047"/><circle cx="42" cy="25" r="5" fill="#facc15"/><path d="M30 10l2 4 4 .5-3 3 .8 4-3.8-2-3.8 2 .8-4-3-3 4-.5z" fill="#fff" opacity=".9"/>' : '<path d="M20 28h24" stroke="#1c1917" stroke-width="2" opacity=".5"/>')
        : '<path d="M6 24c0-10 6-16 14-16h24c8 0 14 6 14 16z" fill="#b45309"/>') +
      '<path d="M6 24h52" stroke="#facc15" stroke-width="3"/><path d="M32 8v46" stroke="#facc15" stroke-width="3" opacity=".7"/><rect x="27" y="26" width="10" height="10" rx="2" fill="#facc15"/></svg>';
  }
  /* Trésor : 3 coffres sur une plage */
  GAMES.chests = function (box, x) {
    var pick = 1;
    box.innerHTML = '<div class="cs-stage ch-stage"><div class="ch" id="csCh">' + [0, 1, 2].map(function (i) { return '<button type="button" data-c="' + i + '" class="' + (i === 1 ? 'on' : '') + '">' + chestSvg(false) + '</button>'; }).join('') + '</div><small class="cs-lbl">' + esc(x.pickChest) + ' · ×2,85</small></div><div class="cs-res"></div>' + stakePanel(x.bet);
    bindStake(box);
    box.querySelectorAll('#csCh button').forEach(function (b) { b.addEventListener('click', function () { pick = +b.getAttribute('data-c'); box.querySelectorAll('#csCh button').forEach(function (z) { z.classList.toggle('on', z === b); z.innerHTML = chestSvg(false); }); }); });
    $('csGo').addEventListener('click', async function () {
      var r = await play('chests', { pick: pick }); if (!r) return;
      var bs = box.querySelectorAll('#csCh button');
      bs[r.view.pick].innerHTML = chestSvg(true, r.view.gold === r.view.pick); await sleep(450);
      bs.forEach(function (b, i) { if (i !== r.view.pick) b.innerHTML = chestSvg(true, i === r.view.gold); });
      resultLine(box, r);
    });
  };
  /* La Tour : immeuble dans la ville, on monte étage par étage (3 fenêtres, 1 piège) */
  GAMES.tower = function (box, x) {
    var g = null, rows = '';
    var mult = function (k) { return k < 1 ? 0 : Math.floor(0.97 / Math.pow(2 / 3, k) * 100) / 100; };
    for (var r = 7; r >= 0; r--) rows += '<div class="tw-row" data-row="' + r + '"><em>×' + mult(r + 1).toFixed(2) + '</em>' + [0, 1, 2].map(function (c) { return '<button type="button" data-c="' + c + '"></button>'; }).join('') + '</div>';
    box.innerHTML = '<div class="cs-stage tw-stage"><i class="tw-city"></i><div class="tw" id="csTw"><i class="tw-roof"></i>' + rows + '<i class="tw-door"></i></div></div><div class="cs-res"></div>' + (guest() ? '<div id="csNeed"></div>' : stakePanel(x.bet));
    if (guest()) { needAccount($('csNeed'), x); return; }
    bindStake(box);
    var btn = $('csGo');
    var paint = function (r) {
      g = r;
      box.querySelectorAll('.tw-row').forEach(function (row) {
        var k = +row.getAttribute('data-row');
        row.classList.toggle('cur', !r.done && k === r.k); row.classList.toggle('past', k < r.k);
        row.querySelectorAll('button').forEach(function (b) {
          var c = +b.getAttribute('data-c'); b.className = ''; b.innerHTML = '';
          if (k < r.k && r.picks[k] === c) { b.className = 'good'; b.innerHTML = ART.sym('gem'); }
          if (r.done && r.traps && r.traps[k] === c && k <= r.k) { b.className = (r.boom === k) ? 'trap boom' : 'trap'; b.innerHTML = ART.sym('skull'); }
        });
      });
      if (r.done) { resultLine(box, r, r.win > 0 ? '×' + mult(r.k).toFixed(2) : ''); btn.textContent = x.bet; btn.classList.remove('cash'); }
      else { btn.classList.add('cash'); btn.textContent = r.k ? x.cashout + ' ' + m2(r.stake * r.mult) + ' $' : x.open; box.querySelector('.cs-res').className = 'cs-res'; box.querySelector('.cs-res').innerHTML = ''; }
    };
    btn.addEventListener('click', async function () {
      if (g && !g.done) { if (!g.k) return; var c = await multi('tower', 'cash'); if (c) paint(c); return; }
      var r = await multi('tower', 'start'); if (r) paint(r);
    });
    box.querySelectorAll('.tw-row button').forEach(function (b) {
      b.addEventListener('click', async function () { if (!g || g.done || +b.parentElement.getAttribute('data-row') !== g.k) return; var r = await multi('tower', 'pick', { door: +b.getAttribute('data-c') }); if (r) paint(r); });
    });
    multi('tower', 'state', null, true).then(function (r) { if (r && !r.done) paint(r); });
  };
  /* Ballon : ciel bleu, nuages, gros ballon, gros bouton rond pour gonfler */
  GAMES.balloon = function (box, x) {
    var g = null;
    box.innerHTML = '<div class="cs-stage bl-stage"><i class="bl-cloud c1"></i><i class="bl-cloud c2"></i><i class="bl-cloud c3"></i><b class="crash-n" id="csBlM">1.00×</b><div class="bl" id="csBl"><svg viewBox="0 0 100 130"><defs><radialGradient id="blG" cx="35%" cy="30%" r="70%"><stop offset="0" stop-color="#fdba74"/><stop offset=".6" stop-color="#f97316"/><stop offset="1" stop-color="#9a3412"/></radialGradient></defs><path d="M50 4c22 0 38 17 38 40 0 28-22 47-38 51-16-4-38-23-38-51C12 21 28 4 50 4z" fill="url(#blG)"/><path d="M50 4c-9 10-10 70 0 91M50 4c9 10 10 70 0 91" stroke="#9a3412" stroke-width="1.4" opacity=".3" fill="none"/><path d="M30 26c4-9 12-13 19-13" stroke="#fff" stroke-width="6" stroke-linecap="round" opacity=".75" fill="none"/><ellipse cx="32" cy="42" rx="5" ry="9" fill="#fff" opacity=".3"/><path d="M45 95l5 8 5-8z" fill="#9a3412"/><path d="M50 103c-5 7 5 12 0 19s3 6 1 8" stroke="#fff" stroke-width="1.6" fill="none"/></svg></div>' +
      (guest() ? '' : '<button type="button" class="cs-pump" id="csPump" disabled aria-label="' + esc(x.pump) + '"><svg viewBox="0 0 24 24"><path d="M9 11V5.5a1.5 1.5 0 0 1 3 0V10m0-1.5a1.5 1.5 0 0 1 3 0V11m0-1a1.5 1.5 0 0 1 3 0v4.5c0 3.6-2.5 6.5-6 6.5h-1c-2 0-3.4-.9-4.4-2.4L4 14.6a1.5 1.5 0 0 1 2.4-1.8L9 15" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></button>') +
      '</div><div class="cs-res"></div>' + (guest() ? '<div id="csNeed"></div>' : stakePanel(x.bet));
    if (guest()) { needAccount($('csNeed'), x); return; }
    bindStake(box);
    var btn = $('csGo'), pump = $('csPump'), bl = $('csBl');
    var paint = function (r) {
      g = r;
      var sc = 1 + Math.min(1.1, r.k * 0.07);
      bl.style.transform = 'scale(' + sc + ')';
      $('csBlM').textContent = (r.k ? r.mult : 1).toFixed(2) + '×';
      if (r.done) {
        if (r.win > 0) $('csBlM').className = 'crash-n w'; else { bl.classList.add('pop'); $('csBlM').className = 'crash-n l'; }
        resultLine(box, r, r.win > 0 ? '×' + r.mult.toFixed(2) : '💥');
        pump.disabled = true; btn.textContent = x.bet; btn.classList.remove('cash');
      } else {
        bl.classList.remove('pop'); $('csBlM').className = 'crash-n';
        pump.disabled = false; btn.classList.toggle('cash', r.k > 0);
        btn.textContent = r.k ? x.cashout + ' ' + m2(r.stake * r.mult) + ' $' : x.pumpFirst;
        box.querySelector('.cs-res').className = 'cs-res'; box.querySelector('.cs-res').innerHTML = '';
      }
    };
    pump.addEventListener('click', async function () { if (!g || g.done) return; pump.disabled = true; var r = await multi('balloon', 'pump'); if (r) paint(r); else pump.disabled = false; });
    btn.addEventListener('click', async function () {
      if (g && !g.done) { if (!g.k) return; var c = await multi('balloon', 'cash'); if (c) paint(c); return; }
      bl.classList.remove('pop'); bl.style.transform = 'scale(1)';
      var r = await multi('balloon', 'start'); if (r) paint(r);
    });
    multi('balloon', 'state', null, true).then(function (r) { if (r && !r.done) paint(r); });
  };
  /* Darts (25e jeu) : cible de fléchettes ; centre ×20, rouge ×5, vert ×2, clair ×1, bord ×0 — tiré par le serveur */
  var DARTS = [[20, '#FACC15', 0, 11], [5, '#DC2626', 15, 33], [2, '#16A34A', 37, 63], [1, '#F5F5DC', 67, 95], [0, '#1F2937', 99, 116]];
  GAMES.darts = function (box, x) {
    var rings = '';
    [[120, '#111827'], [96, '#F5F5DC'], [65, '#16A34A'], [35, '#DC2626'], [13, '#FACC15']].forEach(function (rg) { rings += '<circle r="' + rg[0] + '" fill="' + rg[1] + '"/>'; });
    var spokes = ''; for (var i = 0; i < 20; i++) spokes += '<path d="M0 0L' + (96 * Math.sin(i * 18 * Math.PI / 180)).toFixed(1) + ' ' + (-96 * Math.cos(i * 18 * Math.PI / 180)).toFixed(1) + '" stroke="rgba(0,0,0,.25)" stroke-width="1"/>';
    var lbl = '<g font-family="system-ui" font-weight="900" text-anchor="middle"><text y="5" font-size="11" fill="#111">×20</text><text y="-20" font-size="10" fill="#fff">×5</text><text y="-46" font-size="11" fill="#fff">×2</text><text y="-76" font-size="11" fill="#111">×1</text><text y="-103" font-size="10" fill="#94A3B8">×0</text></g>';
    box.innerHTML = '<div class="cs-stage dr-stage"><div class="dr-board"><svg viewBox="-124 -124 248 248"><circle r="124" fill="#7C2D12"/>' + rings + spokes + lbl + '</svg><span class="dr-dart" id="csDart"><svg viewBox="0 0 20 60"><path d="M10 0l2 18h-4z" fill="#CBD5E1"/><rect x="7" y="18" width="6" height="22" rx="2" fill="#334155"/><path d="M10 40l9 18-9-6-9 6z" fill="#F59E0B"/></svg></span></div></div><div class="cs-res"></div>' + stakePanel(x.bet);
    bindStake(box);
    $('csGo').addEventListener('click', async function () {
      var r = await play('darts', {}); if (!r) return;
      var z = DARTS[r.view.z] || DARTS[4], a = (r.view.a || 0) * Math.PI / 180, rad = z[2] + (z[3] - z[2]) * 0.5;
      var d = $('csDart'), board = d.parentElement, s = board.clientWidth / 248;
      d.style.transition = 'none'; d.style.transform = 'translate(-50%,0) translate(' + (board.clientWidth * 0.25) + 'px,' + (board.clientHeight * 0.7) + 'px) scale(2.2) rotate(25deg)'; d.style.opacity = '1';
      await sleep(40);
      d.style.transition = 'transform .55s cubic-bezier(.15,.75,.25,1)';
      d.style.transform = 'translate(-50%,0) translate(' + (rad * Math.sin(a) * s).toFixed(1) + 'px,' + (-rad * Math.cos(a) * s).toFixed(1) + 'px) scale(1) rotate(-8deg)';
      await sleep(560);
      board.classList.remove('hit'); board.getBoundingClientRect(); board.classList.add('hit');
      resultLine(box, r, '×' + r.mult);
    });
  };

  /* ---------- bouton « Casino » de la barre du haut ---------- */
  function boot() {
    var b = $('btnCasino');
    if (b) b.addEventListener('click', function () { open(); });
    try { if (/[?&]casino=1/.test(location.search)) setTimeout(function () { open(); }, 1500); } catch (e) { /* ignore */ }
    // seulement si la langue a VRAIMENT changé (le site renvoie cet événement aussi après une mise à jour du compte)
    var lastLang = document.documentElement.lang;
    document.addEventListener('oro:lang', function () {
      if (document.documentElement.lang === lastLang) return;
      lastLang = document.documentElement.lang;
      var m = $('casinoModal'); if (m && m.classList.contains('active') && !S.busy) { if (S.game) go(S.game); else home(); }
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
  D6.Casino = { open: open, close: close, home: home };
})(window.D6 = window.D6 || {});
