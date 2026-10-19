/* v2690 — CASINO OROLADO : 15 jeux, mise dès 0,10 $, même solde RÉEL que le trading (ou DÉMO ; visiteur : essai).
   Le SERVEUR tire et paie tout (api.php csPlay / csMulti / csTry, casino_lib.php) : ici on dessine seulement.
   Décor fixe ; les animations ne tournent que pendant une partie. */
(function (D6) {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var T = {
    fr: { title: 'Casino', sub: '18 jeux · dès 0,10 $', real: 'Réel', demo: 'Démo', tryM: 'Essai', bal: 'Solde', stake: 'Mise', play: 'Jouer', again: 'Rejouer',
      win: 'Gagné ! +{w} $', lose: 'Perdu', tryNote: 'Crée ton compte et recharge pour jouer en argent réel, dès 0,10 $.', signup: 'Créer mon compte', gamesTab: 'Jeux', realAcc: 'Compte réel', bet: 'Miser', gotIt: 'J’ai compris', revealAll: 'Tout découvrir', dragonN: 'Dragon', tigerN: 'Tigre', tie: 'Égalité', player: 'Joueur', banker: 'Banque', small: 'Petit', big: 'Grand', triple: 'triple', pickChest: 'Choisis un coffre', pump: 'Gonfler', pumpFirst: 'Gonfle le ballon', level: 'Pommes pourries',
      e_min: 'Mise minimum 0,10 $.', e_max: 'Mise trop élevée.', e_maxWin: 'Gain trop élevé pour cette mise : baisse la mise ou la cible.', e_insufficient: 'Solde insuffisant.', e_unavailable: 'Indisponible, réessaie.', e_busy: 'Un instant…', e_param: 'Choix invalide.', e_login: 'Connecte-toi pour jouer.', e_suspended: 'Compte suspendu.', e_closed: 'Mises fermées : attends le prochain tour.', e_already: 'Tu as déjà un pari sur ce tour.',
      deposit: 'Recharger', hist: 'Mes dernières parties', none: 'Aucune partie pour l’instant.', rules: 'Jeu responsable : joue seulement ce que tu peux te permettre de perdre.',
      g: { crash: ['Avion', 'Encaisse avant qu’il explose'], coin: ['Pile ou face', '×1,94'], dice: ['Dés', 'Choisis ta chance'], limbo: ['Cible', 'Vise jusqu’à ×1000'], wheel: ['Roue casino', 'Jusqu’à ×50'],
        race: ['Course auto', '10 voitures · en direct'], roulette: ['Roulette', 'Rouge, noir, numéro ×36'], slots: ['Machine à sous', 'Jusqu’à ×50'], plinko: ['Cascade', 'Jusqu’à ×12'], keno: ['Keno', '3 numéros · ×25'],
        scratch: ['Grattage', 'Jusqu’à ×20'], hilo: ['Hi-Lo cartes', 'Plus haut ou plus bas'], penalty: ['Penalty', 'Marque · ×1,44'], colors: ['Couleurs', 'Vert, rouge, violet'], mines: ['Mines', 'Évite les bombes'],
        jet: ['Jet Man', 'Il s’envole, encaisse !'], rocket: ['Fusée', 'Jusqu’aux étoiles'], apple: ['Verger d’or', '10 étages'],
        tower: ['La Tour', '3 portes, 1 piège'], dragon: ['Dragon Tigre', 'La plus forte carte'], baccarat: ['Baccara', 'Joueur ou Banque'], sicbo: ['Sic Bo', 'Petit ou Grand'], chests: ['Coffres', '1 trésor sur 3'], balloon: ['Ballon', 'Gonfle et encaisse'] },
      takeoff: 'Départ dans {s} s — mise maintenant', placed: 'Pari placé ✓ attends le départ', betNext: 'Miser (prochain tour)', cancel: 'Pari annulé : mise rendue', cashout: 'Encaisser', auto: 'Encaissement auto (×)', flying: 'En vol…', boom: 'Explosé à ×{x}', cashed: 'Encaissé à ×{x} : +{w} $', start: 'Décoller',
      heads: 'Pile', tails: 'Face', rock: 'Pierre', paper: 'Feuille', scissors: 'Ciseaux', you: 'Toi', rpsRule: 'Gagné ×1,91 · égalité = mise rendue', ddRule: 'Le plus grand dé gagne ×1,92 · égalité = mise rendue', tieBack: 'égalité, mise rendue', chance: 'Chance de gagner', under: 'En dessous', over: 'Au-dessus', mult: 'Gain ×{x}', target: 'Cible ×', result: 'Résultat ×{x}', roll: 'Tirage {x}',
      pickCar: 'Choisis ta voiture', red: 'Rouge', black: 'Noir', even: 'Pair', odd: 'Impair', number: 'Numéro', dozen: 'Douzaine', green: 'Vert', violet: 'Violet',
      skClear: 'Effacer la mise', lotPick: 'Choisis 1 à 10 numéros', lotRand: 'Hasard', lotClear: 'Effacer', lotHits: '{h} bon(s) sur {k}', lotPay: 'Bons numéros', lotDraw: 'Tirage', pick3: 'Choisis 3 numéros', picked: '{n}/3 choisis', hits: '{n} bon(s) numéro(s)', scratchGo: 'Gratter', aim: 'Vise un coin', left: 'Gauche', center: 'Centre', right: 'Droite', goal: 'BUT !', saved: 'Arrêté !',
      shoot: 'Choisis où tirer dans le but', hi: 'Plus haut ou égal', lo: 'Plus bas ou égal', minesN: 'Nombre de mines', next: 'Prochaine case ×{x}', open: 'Ouvre des cases…', sports: 'Paris', sportsSoon: 'Les grands matchs arrivent bientôt ici.' },
    en: { title: 'Casino', sub: '18 games · from $0.10', real: 'Real', demo: 'Demo', tryM: 'Try', bal: 'Balance', stake: 'Stake', play: 'Play', again: 'Play again',
      win: 'You win! +${w}', lose: 'Lost', tryNote: 'Create your account and top up to play for real money, from $0.10.', signup: 'Create my account', gamesTab: 'Games', realAcc: 'Real account', bet: 'Bet', gotIt: 'Got it', revealAll: 'Reveal all', dragonN: 'Dragon', tigerN: 'Tiger', tie: 'Tie', player: 'Player', banker: 'Banker', small: 'Small', big: 'Big', triple: 'triple', pickChest: 'Pick a chest', pump: 'Pump', pumpFirst: 'Pump the balloon', level: 'Rotten apples',
      e_min: 'Minimum stake $0.10.', e_max: 'Stake too high.', e_maxWin: 'Win too high for this stake: lower the stake or the target.', e_insufficient: 'Insufficient balance.', e_unavailable: 'Unavailable, try again.', e_busy: 'One moment…', e_param: 'Invalid choice.', e_login: 'Log in to play.', e_suspended: 'Account suspended.', e_closed: 'Bets closed: wait for the next round.', e_already: 'You already have a bet on this round.',
      deposit: 'Top up', hist: 'My last games', none: 'No game yet.', rules: 'Play responsibly: only stake what you can afford to lose.',
      g: { crash: ['Aviator', 'Cash out before it blows'], coin: ['Heads or tails', '×1.94'], dice: ['Dice', 'Pick your chance'], limbo: ['Target', 'Aim up to ×1000'], wheel: ['Casino wheel', 'Up to ×50'],
        race: ['Car race', '10 cars · live'], roulette: ['Roulette', 'Red, black, number ×36'], slots: ['Slot machine', 'Up to ×50'], plinko: ['Cascade', 'Up to ×12'], keno: ['Keno', '3 numbers · ×25'],
        scratch: ['Scratch card', 'Up to ×20'], hilo: ['Hi-Lo cards', 'Higher or lower'], penalty: ['Penalty', 'Score · ×1.44'], colors: ['Colours', 'Green, red, violet'], mines: ['Mines', 'Avoid the bombs'],
        jet: ['Jet Man', 'He flies, cash out!'], rocket: ['Rocket', 'To the stars'], apple: ['Golden Orchard', '10 floors'],
        tower: ['The Tower', '3 doors, 1 trap'], dragon: ['Dragon Tiger', 'Highest card'], baccarat: ['Baccarat', 'Player or Banker'], sicbo: ['Sic Bo', 'Small or Big'], chests: ['Chests', '1 treasure in 3'], balloon: ['Balloon', 'Pump and cash out'] },
      takeoff: 'Take-off in {s} s — bet now', placed: 'Bet placed ✓ wait for take-off', betNext: 'Bet (next round)', cancel: 'Bet cancelled: stake returned', cashout: 'Cash out', auto: 'Auto cash-out (×)', flying: 'Flying…', boom: 'Blew up at ×{x}', cashed: 'Cashed out at ×{x}: +${w}', start: 'Take off',
      heads: 'Heads', tails: 'Tails', rock: 'Rock', paper: 'Paper', scissors: 'Scissors', you: 'You', rpsRule: 'Win ×1.91 · tie = stake back', ddRule: 'Higher die wins ×1.92 · tie = stake back', tieBack: 'tie, stake back', chance: 'Win chance', under: 'Under', over: 'Over', mult: 'Win ×{x}', target: 'Target ×', result: 'Result ×{x}', roll: 'Roll {x}',
      pickCar: 'Pick your car', red: 'Red', black: 'Black', even: 'Even', odd: 'Odd', number: 'Number', dozen: 'Dozen', green: 'Green', violet: 'Violet',
      skClear: 'Clear stake', lotPick: 'Pick 1 to 10 numbers', lotRand: 'Random', lotClear: 'Clear', lotHits: '{h} hit(s) out of {k}', lotPay: 'Hits', lotDraw: 'Draw', pick3: 'Pick 3 numbers', picked: '{n}/3 picked', hits: '{n} number(s) hit', scratchGo: 'Scratch', aim: 'Aim a corner', left: 'Left', center: 'Centre', right: 'Right', goal: 'GOAL!', saved: 'Saved!',
      shoot: 'Pick where to shoot in the goal', hi: 'Higher or equal', lo: 'Lower or equal', minesN: 'Number of mines', next: 'Next tile ×{x}', open: 'Open tiles…', sports: 'Bets', sportsSoon: 'Big matches are coming here soon.' }
  };
  T.zh = Object.assign({}, T.en, { lotPick: '选择 1 到 10 个号码', lotRand: '随机', lotClear: '清除', lotHits: '{k} 中 {h}', lotPay: '命中', lotDraw: '开奖', title: '娱乐场', sub: '18 款游戏 · 0.10 美元起', real: '真实', demo: '模拟', tryM: '试玩', bal: '余额', stake: '投注', play: '开始', again: '再来一局',
    win: '赢了！+{w} 美元', lose: '输了', tryNote: '创建账户并充值，即可真钱游戏，0.10 美元起。', signup: '创建账户', gamesTab: '游戏', realAcc: '真实账户', bet: '投注', gotIt: '知道了', revealAll: '全部刮开', dragonN: '龙', tigerN: '虎', tie: '和', player: '闲', banker: '庄', small: '小', big: '大', triple: '围骰', pickChest: '选一个宝箱', pump: '充气', pumpFirst: '给气球充气', level: '坏苹果', deposit: '充值', hist: '最近的游戏', none: '还没有游戏记录。',
    rules: '请理性游戏，只投入你能承受损失的金额。',
    g: { crash: ['飞机', '爆炸前兑现'], coin: ['正反面', '×1.94'], dice: ['骰子', '自选胜率'], limbo: ['极限', '最高 ×1000'], wheel: ['娱乐场转盘', '最高 ×50'], race: ['赛车', '6 辆车 · ×5.7'],
      roulette: ['轮盘', '红、黑、号码 ×36'], slots: ['老虎机', '最高 ×50'], plinko: ['弹珠台', '最高 ×12'], keno: ['基诺', '3 个号码 · ×25'], scratch: ['刮刮卡', '最高 ×20'], hilo: ['猜大小', '更大还是更小'],
      penalty: ['点球', '进球 · ×1.44'], colors: ['颜色', '绿、红、紫'], mines: ['扫雷', '避开炸弹'], jet: ['喷气侠', '起飞，快兑现！'], rocket: ['火箭', '直冲星空'], apple: ['金色果园', '10 层'], tower: ['高塔', '3 扇门 1 个陷阱'], dragon: ['龙虎', '比大小'], baccarat: ['百家乐', '闲或庄'], sicbo: ['骰宝', '大或小'], chests: ['宝箱', '3 选 1'], balloon: ['气球', '充气再兑现'] },
    cashout: '兑现', start: '起飞', heads: '正面', tails: '反面', under: '小于', over: '大于', red: '红', black: '黑', even: '双', odd: '单', number: '号码', green: '绿', violet: '紫', goal: '进球！', saved: '被扑出！', shoot: '点击球门射门', hi: '更大或相等', lo: '更小或相等', sports: '竞猜', sportsSoon: '重大赛事即将上线。' });
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
    sicbo: 'Sic Bo', chests: 'Treasure', balloon: 'Balloon', penalty: 'Penalty', race: 'Racing', colors: 'Colors', darts: 'Darts', cryptox: 'Crypto Live', horses: 'Horse Race', rps: 'Rock Paper Scissors', lotto: 'Oro Lotto' };
  var SEC_T = { en: { live: 'Live games', skill: 'You’re in control', more: 'All games' }, fr: { live: 'Jeux live', skill: 'Tu contrôles', more: 'Tous les jeux' },
    es: { live: 'Juegos en vivo', skill: 'Tú controlas', more: 'Todos los juegos' }, pt: { live: 'Jogos ao vivo', skill: 'Você controla', more: 'Todos os jogos' },
    ar: { live: 'ألعاب مباشرة', skill: 'أنت تتحكم', more: 'كل الألعاب' }, tr: { live: 'Canlı oyunlar', skill: 'Kontrol sende', more: 'Tüm oyunlar' },
    vi: { live: 'Trò chơi trực tiếp', skill: 'Bạn điều khiển', more: 'Tất cả trò chơi' }, id: { live: 'Game live', skill: 'Kamu yang kendalikan', more: 'Semua game' },
    ru: { live: 'Live-игры', skill: 'Ты управляешь', more: 'Все игры' }, de: { live: 'Live-Spiele', skill: 'Du steuerst', more: 'Alle Spiele' },
    hi: { live: 'लाइव गेम्स', skill: 'आप नियंत्रित करें', more: 'सभी गेम्स' }, zh: { live: '直播游戏', skill: '由你掌控', more: '全部游戏' } };
  // v2718 : jeux EN DIRECT (même tour / même tirage pour tout le monde) → pastille « LIVE » qui clignote sous le nom
  var LIVE_GAMES = { crash: 1, jet: 1, rocket: 1, cryptox: 1, horses: 1, roulette: 1, race: 1 }; // v2792 : Racing en direct
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
  // v2706 (propriétaire) : ordre mélangé — les 3 jeux en tour commun (crash, jet, rocket) ne sont plus côte à côte
  // v2718 (propriétaire) : Keno, Cascade, Darts et Colors retirés ; Crypto Live et Horse Race ajoutés ; jeux en direct séparés
  // v2738 (propriétaire) : 24 jeux = 6 lignes de 4, bien droites ; nouveau : Rock Paper Scissors
  // v2757 (propriétaire) : les 6 jeux en direct sont répartis (un par rangée, jamais dans la même colonne)
  // v2791 (propriétaire) : Oro Lotto (loterie 1 à 10 numéros sur 40) prend la place de Rock Paper Scissors
  var ORDER = ['crash', 'mines', 'penalty', 'apple', 'slots', 'lotto', 'cryptox', 'wheel', 'dragon', 'roulette', 'dice', 'tower', 'baccarat', 'limbo', 'coin', 'jet', 'horses', 'balloon', 'sicbo', 'race', 'scratch', 'hilo', 'rocket', 'chests'];
  // v2693 (propriétaire) : la mise de départ est toujours 0,10 $ à l'ouverture du Casino.
  var S = { mode: 'real', stake: 0.1, game: '', view: 'games', bal: { real: null, demo: null }, busy: false, timer: 0 };
  function save() { /* la mise n'est plus gardée : 0,10 $ à chaque ouverture */ }
  function mode() { return 'real'; } // v2690b : argent réel seulement (pas de démo ni d'essai)
  function readBal() {
    var num = function (id) { var e = $(id); if (!e) return null; var v = parseFloat(String(e.textContent).replace(/[^0-9.]/g, '')); return isFinite(v) ? v : null; };
    // v2760 (propriétaire) : relu à CHAQUE ouverture (avant : lu une seule fois → les jeux pouvaient rester à 0 $
    // alors que le Compte réel du trading affichait le bon montant). C'est le même compte, le même argent.
    var r = num('modeRealAmt'), d = num('modeDemoAmt');
    if (r != null) S.bal.real = r;
    if (d != null) S.bal.demo = d;
  }
  /* solde au milieu de la barre, avec un petit « + » pour recharger */
  function paintBal() {
    var b = $('csBal'); if (!b) return;
    // v2757 (propriétaire) : visiteur = « Connexion » (léger) + « Inscription » (orange), comme en haut du site
    if (guest()) {
      var tl = ($('btnGoLogin') || {}).textContent || 'Connexion', tr = ($('btnGoRegister') || {}).textContent || X().signup;
      b.innerHTML = '<span class="cs-auth"><span role="button" tabindex="0" class="cs-in fit" id="csLogin">' + esc(tl) + '</span><span role="button" tabindex="0" class="cs-join fit" id="csJoin">' + esc(tr) + '</span></span>';
      b.className = 'cs-wallet cs-guestw';
      requestAnimationFrame(function () { fitEl($('csLogin')); fitEl($('csJoin')); }); // v2819 : « Connexion / Inscription » rapetissent (arabe, allemand… sur iPhone SE)
      $('csJoin').addEventListener('click', function (e) { e.stopPropagation(); signup(); });
      $('csLogin').addEventListener('click', function (e) { e.stopPropagation(); toAuth('login'); });
      return;
    }
    var md = S.adminTest ? 'demo' : 'real';
    // v2745 (propriétaire) : EXACTEMENT la carte « Compte réel » du trading (icône portefeuille verte, libellé vert, « $ » devant)
    var realLbl = (document.querySelector('#modeReal .mb-lbl') || {}).textContent || X().realAcc;
    b.innerHTML = '<span class="cw-wal" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H17a1 1 0 0 1 1 1v1.5"/><rect x="3.5" y="7.5" width="17" height="12" rx="2.6"/><path d="M20.5 11.5h-4a2 2 0 0 0 0 4h4z"/><circle cx="16.6" cy="13.5" r=".9" fill="currentColor"/></svg></span>' +
      '<span class="cw-t"><small>' + esc(S.adminTest ? 'TEST ADMIN' : realLbl) + '</small><b>$&nbsp;' + (S.bal[md] == null ? '—' : m2(S.bal[md])) + '</b></span><i class="cw-plus" aria-hidden="true">+</i>';
    b.className = 'cs-wallet cw-same ' + md;
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
  // v2807 (propriétaire) : Recharger s'ouvre PAR-DESSUS le casino (on ne ferme plus le jeu) : en fermant Recharger, on retrouve
  // le jeu là où on l'avait laissé. La fenêtre Recharger passe au-dessus de celle du casino tant qu'elle est ouverte.
  function deposit() {
    if (!(D6.App && D6.App.openDeposit)) return;
    var dm = $('depositModal'), cm = $('casinoModal');
    if (dm && cm) {
      var z = parseInt(getComputedStyle(cm).zIndex, 10) || 0, dz = parseInt(getComputedStyle(dm).zIndex, 10) || 0;
      if (dz <= z) {
        dm.style.setProperty('z-index', String(z + 1), 'important');
        // Recharger fermé : on rend sa place normale à la fenêtre (rien ne reste au-dessus)
        if (!dm._csZ && window.MutationObserver) { dm._csZ = new MutationObserver(function () { if (!dm.classList.contains('active')) dm.style.removeProperty('z-index'); }); dm._csZ.observe(dm, { attributes: true, attributeFilter: ['class'] }); }
      }
    }
    D6.App.openDeposit();
  }
  // v2762 (propriétaire) : le visiteur qui part s'inscrire depuis un jeu y REVIENT s'il touche « Retour »
  function toAuth(tab) {
    var r = { game: S.game || '', pred: !!($('casinoModal') && $('casinoModal').classList.contains('pred-only')) };
    if (D6.App && D6.App.authReturn) D6.App.authReturn(function () { if (r.pred) openPred(); else open(r.game || null, r.game ? undefined : 'games'); });
    close(); if (D6.App && D6.App.showAuth) D6.App.showAuth(tab || 'register');
  }
  function signup() { toAuth('register'); }
  async function play(game, p) {
    if (guest()) { signup(); return null; } // v2698 : une seule fenêtre (plus de message superposé à l'inscription)
    if (S.busy) return null;
    S.busy = true;
    sfx('launch', null, game);
    amb(game, true, null, { ttl: 25000, src: 'kit', fresh: 1 }); // v2851 : ambiance du jeu pendant le tirage / l'animation (fin : resultLine)
    var md = mode();
    var r = await api('csPlay', { game: game, mode: md, stake: S.stake, p: p || {} });
    S.busy = false;
    if (!r || !r.ok) { amb(game, false); err(r); return null; }
    if (r.mode === 'demo') S.adminTest = true;
    if (S.bal.real != null && r.bal == null && r.mode === 'real') S.bal.real = S.bal.real - r.stake + r.win;
    return r;
  }
  async function multi(game, act, p, quiet) {
    if (guest()) { if (!quiet) signup(); return null; }
    if (!quiet && (act === 'start' || act === 'bet')) sfx('launch', null, game);
    if (act === 'fail' && !LIVE_GAMES[game] && ambOn(game)) { sfx('crash', null, game); amb(game, false, 0, { fade: 0.15 }); } // v2851 : l'obstacle / l'erreur se SENT tout de suite
    var r = await api('csMulti', { game: game, act: act, mode: 'real', stake: S.stake, p: p || {} });
    if (!r || !r.ok) { if (!quiet) err(r); return null; }
    ambMulti(game, act, r, quiet);
    // v2832 : un bon choix (case ouverte, étage, pompe, bonne carte) = petite note qui monte ; la fin passe par resultLine
    if (!quiet && !r.done && SFX_STEP[act] && game !== 'penalty') sfx(act === 'skip' ? 'card' : 'step', { k: Number(r.k) || (r.open && r.open.length) || 1 }, game);
    if (r.mode === 'demo' && !S.adminTest) { S.adminTest = true; paintBal(); }
    if (r.mode && r.bal != null) { S.bal[r.mode] = r.bal; paintBal(); }
    return r;
  }
  /* résultat : petite bannière DANS l'écran du jeu (ne prend plus de place) */
  // v2718 (propriétaire) : le résultat arrive en NOTIFICATION dans le jeu (gain : vert « +2,50 $ » ; perte : discrète « −1,00 $ »),
  // elle reste ~2,8 s puis s'en va ; plus de ligne en bas → toute la place va au jeu.
  /* v2832 — SONS (js/sfx.js) : un seul endroit pour TOUS les jeux — gain = mélodie du jeu (plus riche si ×5, étincelles si ×25),
     perte = aucun son, vibration courte. Les jeux ajoutent leurs petits bruits (tic de roue, rouleaux…) avec K.sfx(). */
  var SFX_STEP = { open: 1, pick: 1, pump: 1, guess: 1, skip: 1 };
  function sfx(ev, a, k) { try { if (D6.Sfx) return D6.Sfx.play(ev, a, k || S.game); } catch (e) { /* ignore */ } return false; }
  // un évènement quand une valeur change (case de roue qui passe, volée, juge…) ; jamais au premier regard (arrivée en cours de tirage)
  function sfxBeat(o, slot, v, ev, a) { var key = '_sb' + slot; if (o[key] === v) return; var had = key in o; o[key] = v; if (had && v != null && v !== -1) sfx(ev, a); }
  /* v2851 — AMBIANCE + BRUITAGES D'ACTION (js/sfx.js D6.Sfx.amb) branchés ici pour TOUS les jeux :
     partie lancée (Miser / Démarrer) → ambiance du thème ; jeux d'adresse : elle suit le multiplicateur (même horloge que
     le serveur : exp(rate · t)) ; bonne case → la tension monte ; erreur / fin secrète → choc ou explosion ; encaissement →
     « cha-ching » ; fin de partie (resultLine), fermeture, autre jeu → l'ambiance s'éteint en fondu. Les jeux en direct
     (crash, tirages) pilotent leur ambiance eux-mêmes (une ligne K.amb dans leur boucle). */
  var SK1 = { spacerun: 1, flappyrock: 1, stack: 1, knifehit: 1, basket: 1, starbridge: 1 }; // fin secrète : la météorite tombe ~0,5 s après
  var SFX_LOSSFX = { mines: 1, balloon: 1 };
  function amb(k, on, i, o) { try { if (D6.Sfx && D6.Sfx.amb) return D6.Sfx.amb(k || S.game, on, i, o); } catch (e) { /* ignore */ } return false; }
  function ambOn(k) { try { var b = D6.Sfx && D6.Sfx.bed && D6.Sfx.bed(); return !!(b && b.key === k); } catch (e) { return false; } }
  function ambMulti(game, act, r, quiet) {
    try {
      if (!D6.Sfx || !D6.Sfx.amb || LIVE_GAMES[game]) { if (act === 'cash' && r.done && Number(r.win) > Number(r.stake)) sfx('cashout', null, game); return; }
      var clk = r.rate && r.t0 ? { rate: Number(r.rate), t0: Number(r.t0), off: (Number(r.now) || Date.now() / 1000) - Date.now() / 1000 } : null;
      if ((act === 'start' || act === 'bet') && !r.done) amb(game, true, clk ? null : 0.06, { src: 'kit', fresh: quiet ? 0 : 1, clk: clk, ttl: clk ? 0 : 180000, keepAuto: !clk });
      else if (act === 'state' && !r.done && clk) amb(game, true, null, { src: 'kit', clk: clk }); // partie reprise (page rechargée) / horloge recalée
      else if (SFX_STEP[act] && !r.done) amb(game, true, Math.min(1, 0.12 + (Number(r.k) || (r.open && r.open.length) || 1) / 8), { ttl: 180000 });
      if (!r.done) return;
      var won = Number(r.win) > 0;
      if (act === 'cash' && won) { sfx('cashout', null, game); amb(game, false, 0, { fade: 0.4 }); return; }
      if ((act === 'state' || act === 'cash') && !won && ambOn(game)) { // la fin secrète du serveur : choc / explosion (au moment où on la voit)
        amb(game, false, 0, { fade: 0.25 });
        if (SK1[game]) setTimeout(function () { if (S.game === game) sfx('crash', null, game); }, 520); else sfx('crash', null, game);
        return;
      }
      if (SFX_STEP[act] && !won && SFX_LOSSFX[game]) sfx('crash', null, game); // mine qui saute, ballon qui éclate
    } catch (e) { /* ignore */ }
  }
  function sfxResult(r) {
    try {
      if (!D6.Sfx) return;
      if (!LIVE_GAMES[S.game]) amb(S.game, false, 0, { fade: 0.5 });
      var w = Number(r && r.win) || 0, st = Number(r && r.stake) || 0;
      if (w > 0) D6.Sfx.win(st > 0 ? w / st : (Number(r.mult) || Number(r.out) || 2), S.game); else D6.Sfx.lose();
    } catch (e) { /* ignore */ }
  }
  function resultLine(box, r, extra) {
    sfxResult(r);
    var x = X(), host = box.querySelector('.cg-stage') || box.querySelector('.cs-stage') || box;
    var old = host.querySelectorAll('.cs-toast'); for (var i = 0; i < old.length; i++) old[i].remove();
    var win = (Number(r.win) || 0) > 0, t = document.createElement('div');
    t.className = 'cs-toast ' + (win ? 'win' : 'lose');
    // v2794 (propriétaire) : comme le trading, SANS mots — seulement le montant : gagné = « +$ 12.50 » (vert, total encaissé),
    // perdu = « +$ 0 » (rouge). Plus de fond noir ni de texte (« 3 bons sur 5 », nom du gagnant…).
    t.innerHTML = (win ? '<i class="ct-coin" aria-hidden="true"></i>' : '') + '<b dir="ltr">+$\u00a0' + (win ? m2(r.win) : '0') + '</b>'; // dir=ltr : en arabe on lit bien « +$ 0 »
    host.appendChild(t);
    requestAnimationFrame(function () { requestAnimationFrame(function () { t.classList.add('in'); }); });
    // v2805 (propriétaire : jamais rien de superposé) — pendant que la pastille est là, les petits textes du jeu qu'elle couvre
    // s'effacent (gros multiplicateur, statut…) puis reviennent quand elle part.
    var hid = [];
    try {
      var tr = t.getBoundingClientRect(), ta = tr.width * tr.height;
      host.querySelectorAll('b,strong,span,em,small,i,div,p,label').forEach(function (el) {
        if (el === t || t.contains(el) || el.contains(t) || el.childElementCount > 3 || !el.textContent.trim()) return;
        var r2 = el.getBoundingClientRect(); if (!r2.width || r2.width * r2.height > ta * 6) return;
        if (r2.right <= tr.left || r2.left >= tr.right || r2.bottom <= tr.top - 4 || r2.top >= tr.bottom + 4) return;
        if (el.style.visibility === 'hidden') return;
        el.style.visibility = 'hidden'; hid.push(el);
      });
    } catch (eHide) { /* ignore */ }
    setTimeout(function () { t.classList.remove('in'); t.classList.add('out'); }, 2800);
    setTimeout(function () { if (t.parentNode) t.remove(); hid.forEach(function (el) { el.style.visibility = ''; }); }, 3300);
    afterPlay(r);
  }

  /* ---------- page Casino ---------- */
  function ensure() {
    if ($('casinoModal')) return;
    var m = document.createElement('div');
    m.className = 'modal-backdrop'; m.id = 'casinoModal';
    m.innerHTML = '<div class="modal-box glass cs-box" role="dialog" aria-modal="true"><button type="button" class="btn-close" id="closeCasino" aria-label="Close"></button>' +
      '<div class="cs-top"><button type="button" class="cs-back" id="csBack" aria-label="Back"><svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg></button>' +
      '<button type="button" class="cs-wallet" id="csBal"></button><span class="cs-tr"><button type="button" class="cs-help" id="csHelp" aria-label="?"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 7C9.8 5.4 6.6 4.9 3 5.4v13c3.6-.5 6.8 0 9 1.6 2.2-1.6 5.4-2.1 9-1.6v-13C17.4 4.9 14.2 5.4 12 7z" fill="#FFF7E0"/><path d="M12 7v13" stroke="#B45309" stroke-width="1.5"/><path d="M5.3 9c1.9-.2 3.6 0 4.8.7M5.3 12c1.9-.2 3.6 0 4.8.7M5.3 15c1.9-.2 3.6 0 4.8.7M13.9 9.7c1.2-.7 2.9-.9 4.8-.7M13.9 12.7c1.2-.7 2.9-.9 4.8-.7M13.9 15.7c1.2-.7 2.9-.9 4.8-.7" stroke="#94A3B8" stroke-width="1.1" stroke-linecap="round" fill="none"/><path d="M3 18.4c3.6-.5 6.8 0 9 1.6 2.2-1.6 5.4-2.1 9-1.6" stroke="#B45309" stroke-width="1.5" fill="none"/></svg></button><button type="button" id="csSnd"></button></span></div>' +
      '<div id="csBody"></div><div class="cs-sheet" id="csSheet" hidden></div></div>';
    document.body.appendChild(m);
    $('closeCasino').style.setProperty('display', 'none', 'important');
    $('closeCasino').addEventListener('click', backStep);
    $('csBack').addEventListener('click', backStep);
    $('csBal').addEventListener('click', function () { deposit(); }); // v2807 : le visiteur voit aussi l'aperçu de Recharger (sûr, sans paiement)
    $('csHelp').addEventListener('click', function () { if (S.game) help(S.game); });
    if (D6.Sfx) D6.Sfx.button($('csSnd')); else $('csSnd').remove(); // v2832 : bouton du son (muet / actif)
    m.addEventListener('click', function (e) { if (e.target === m) close(); });
    if (D6.BigPageSwipe) D6.BigPageSwipe('casinoModal');
    // v2812 (round 4) : dans un jeu, la fenêtre reste calée en haut (vieux iPhone sans « overflow:clip » : la case de mise la faisait glisser)
    var mbx = m.querySelector('.modal-box'); if (mbx) mbx.addEventListener('scroll', function () { if (m.classList.contains('in-game') && mbx.scrollTop) mbx.scrollTop = 0; }, { passive: true });
    // v2812 (round 4) : casino fermé par n'importe quel chemin (glissé, retour du téléphone, autre page) → plus de jeu à rouvrir
    try { new MutationObserver(function () { if (!m.classList.contains('active')) { cgMark(null); S.pend = ''; } }).observe(m, { attributes: true, attributeFilter: ['class'] }); } catch (eMo) { /* ignore */ }
  }
  /* v2812 (propriétaire, round 4) — ACTUALISER LA PAGE : on se souvient du jeu ouvert (sessionStorage 'oro_cg' : clé du jeu ;
     '' = salle de jeux ; absent = casino fermé) ; js/back.js rouvre le même endroit après un rechargement. */
  function cgMark(k) { try { if (k == null) sessionStorage.removeItem('oro_cg'); else sessionStorage.setItem('oro_cg', k); } catch (eSs) { /* ignore */ } }
  /* v2812 (propriétaire : « je touche deux fois et ça ouvre deux jeux / ça me sort ») — UN toucher = UNE action :
     après un changement d'écran (jeu ↔ salle ↔ fermé), les touchers des 0,45 s suivants sur ‹ / ✕ / logos sont ignorés. */
  var navAt = 0;
  // horloge de l'ÉVÉNEMENT (e.timeStamp) : un 2e toucher mis en attente pendant le dessin de la salle compte à son vrai moment
  function nowOf(e) { return e && e.timeStamp > 0 && e.timeStamp < 1e11 ? e.timeStamp : performance.now(); }
  function navBusy(e, ms) { return nowOf(e) - navAt < (ms || 450); }
  function navMark() { navAt = performance.now(); }
  function backStep(e) { if (!$('csSheet').hidden) { $('csSheet').hidden = true; return; } if (navBusy(e, S.game ? 450 : 650)) return; navMark(); if (S.game) { home(); var mb = $('casinoModal').querySelector('.modal-box'); if (mb) mb.scrollTop = S.homeY || 0; } else close(); }
  // v2756 (propriétaire) : « Prédictions » ouvre SA page (sans les onglets) ; « Jeux » ouvre les 24 jeux
  function open(game, view) {
    ensure(); readBal(); loadCatalog();
    var cm0 = $('casinoModal');
    // déjà ouvert sur ce jeu (ou en train de le charger) : rien à refaire (js/back.js peut rappeler open() pendant le chargement)
    if (game && cm0.classList.contains('active') && (S.game === game || S.pend === game)) return;
    // jeu du catalogue pas encore connu (juste après le chargement de la page) : la salle s'affiche, le jeu s'ouvre dès que le catalogue arrive
    if (game && !NAMES[game] && /^[a-z][a-z0-9]{1,15}$/.test(game) && !catDone) { S.pend = game; clearTimeout(S.pendT); S.pendT = setTimeout(function () { S.pend = ''; }, 12000); }
    S.stake = 0.1;
    var pm = view === 'pred';
    if ($('casinoModal')) $('casinoModal').classList.toggle('pred-only', pm);
    if (D6.App && D6.App.openModal) D6.App.openModal('casinoModal');
    if (game && NAMES[game]) go(game); else home(pm ? 'sports' : 'games');
  }
  function openPred() { open(null, 'pred'); }
  function close() {
    stopAll(); navMark(); cgMark(null); S.pend = '';
    S.game = '';
    if (D6.App && D6.App.closeModal) D6.App.closeModal('casinoModal');
    try { if (D6.App && D6.App.refreshVault) D6.App.refreshVault(); } catch (e) { /* ignore */ }
  }
  // 2026-10-19 (propriétaire : « Space Runner : après la mise le personnage reste bloqué, on perd ») : l'animation arrêtée est
  // aussi OUBLIÉE (S.raf = 0). Avant, l'ancien numéro restait : en ouvrant un autre jeu « à toi de jouer », il croyait son
  // animation déjà lancée et ne la démarrait jamais (jeu figé pendant que la partie tournait sur le serveur).
  function stopAll() { clearInterval(S.timer); S.timer = 0; cancelAnimationFrame(S.raf || 0); S.raf = 0; clearInterval(S.idle || 0); amb('*', false, 0, { fade: 0.3 }); }
  // v2821 (propriétaire) : 3 onglets en haut, comme la page Paris — Joue toi-même · Live · Casino (on ne défile plus
  // dans 100+ jeux : chaque onglet montre sa liste).
  // v2825 (propriétaire : « Joue toi-même est plus long… même forme ») : 3 onglets de même largeur, mots courts comme les grandes plateformes.
  // 2026-10-19 (propriétaire : « Arcade ne me plaît pas ») : « Adresse » = jeux où TU joues toi-même (réflexes, adresse).
  // v2849 (propriétaire) : le 1er onglet s'appelle « Action » (avant : Adresse / Skill)
  var TAB_T = { en: { skill: 'Action', live: 'Live', more: 'Casino' }, fr: { skill: 'Action', live: 'Live', more: 'Casino' },
    es: { skill: 'Toma el control: corre, esquiva, dispara. ¡Cuanto más aguantes, más ganas!', live: 'En vivo', more: 'Casino' }, pt: { skill: 'Ação', live: 'Ao vivo', more: 'Cassino' },
    ar: { skill: 'تولَّ القيادة: اركض، راوغ، أطلق. كلما صمدت أكثر ربحت أكثر!', live: 'مباشر', more: 'كازينو' }, tr: { skill: 'Aksiyon', live: 'Canlı', more: 'Casino' },
    vi: { skill: 'Tự điều khiển: chạy, né, bắn. Trụ càng lâu, thắng càng nhiều!', live: 'Live', more: 'Casino' }, id: { skill: 'Aksi', live: 'Live', more: 'Kasino' },
    ru: { skill: 'Управляй сам: беги, уклоняйся, стреляй. Дольше держишься — больше выигрыш!', live: 'Live', more: 'Казино' }, de: { skill: 'Action', live: 'Live', more: 'Casino' },
    hi: { skill: 'कमान संभालो: दौड़ो, बचो, निशाना लगाओ। जितना टिकोगे, उतना जीतोगे!', live: 'लाइव', more: 'कैसीनो' }, zh: { skill: '动作', live: '直播', more: '娱乐场' } };
  // une ligne qui explique chaque onglet (en haut de sa grille)
  var TAB_D = {
    en: { skill: 'Take control: run, dodge, shoot. The longer you last, the more you win!', live: 'Live draws for everyone at the same time: bet before the start.', more: 'Classic casino games: pick, bet, win instantly.' },
    fr: { skill: 'Prends les commandes : cours, esquive, tire. Plus tu tiens, plus tu gagnes !', live: 'Tirages en direct pour tout le monde en même temps : parie avant le départ.', more: 'Les jeux de casino classiques : choisis, mise, gagne tout de suite.' },
    es: { skill: 'Juegas tú: tus reflejos, tu habilidad, cobras cuando quieras.', live: 'Sorteos en vivo para todos a la vez: apuesta antes del inicio.', more: 'Juegos de casino clásicos: elige, apuesta, gana al instante.' },
    pt: { skill: 'Assuma o comando: corra, desvie, atire. Quanto mais durar, mais ganha!', live: 'Sorteios ao vivo para todos ao mesmo tempo: aposte antes do início.', more: 'Jogos de cassino clássicos: escolha, aposte, ganhe na hora.' },
    ar: { skill: 'أنت من يلعب: ردود فعلك ومهارتك، واسحب متى شئت.', live: 'سحوبات مباشرة للجميع في نفس الوقت: راهن قبل البداية.', more: 'ألعاب الكازينو الكلاسيكية: اختر وراهن واربح فورًا.' },
    tr: { skill: 'Kontrol sende: koş, kaç, ateş et. Dayandıkça daha çok kazan!', live: 'Herkes için aynı anda canlı çekiliş: başlamadan bahis yap.', more: 'Klasik casino oyunları: seç, bahis yap, anında kazan.' },
    vi: { skill: 'Bạn tự chơi: phản xạ, kỹ năng, rút khi muốn.', live: 'Quay trực tiếp cho mọi người cùng lúc: cược trước khi bắt đầu.', more: 'Trò chơi casino cổ điển: chọn, cược, thắng ngay.' },
    id: { skill: 'Ambil kendali: lari, hindari, tembak. Makin lama bertahan, makin besar!', live: 'Undian langsung untuk semua sekaligus: pasang sebelum mulai.', more: 'Game kasino klasik: pilih, pasang, menang langsung.' },
    ru: { skill: 'Играешь ты: реакция, ловкость, забираешь когда хочешь.', live: 'Живые розыгрыши для всех одновременно: ставь до старта.', more: 'Классические игры казино: выбери, поставь, выиграй сразу.' },
    de: { skill: 'Übernimm das Steuer: rennen, ausweichen, schießen. Je länger, desto mehr!', live: 'Live-Ziehungen für alle gleichzeitig: setze vor dem Start.', more: 'Klassische Casinospiele: wählen, setzen, sofort gewinnen.' },
    hi: { skill: 'आप खुद खेलते हैं: आपकी फुर्ती, आपका कौशल, जब चाहें निकालें।', live: 'सबके लिए एक साथ लाइव ड्रॉ: शुरू होने से पहले दांव लगाएं।', more: 'क्लासिक कैसीनो गेम: चुनें, दांव लगाएं, तुरंत जीतें।' },
    zh: { skill: '亲自操控：奔跑、闪避、射击。坚持越久，赢得越多！', live: '所有人同时直播开奖：开始前下注。', more: '经典娱乐场游戏：选择、下注、即时赢取。' } };
  var SEC_ORDER = ['skill', 'live', 'more'];
  function curSec() { var v = ''; try { v = sessionStorage.getItem('oro_cs_tab') || ''; } catch (e) { /* ignore */ } return SEC_ORDER.indexOf(v) >= 0 ? v : 'skill'; }
  function home(view) {
    stopAll();
    S.game = ''; S.view = view || S.view || 'games';
    if ($('casinoModal') && $('casinoModal').classList.contains('active')) cgMark('');
    var x = X(), m = $('casinoModal');
    m.classList.remove('in-game'); m.removeAttribute('data-g'); $('csSheet').hidden = true; $('csHelp').hidden = true;
    paintBal();
    $('csBody').innerHTML = '<div class="cs-tabs2"><button type="button" data-v="games" class="' + (S.view === 'games' ? 'on' : '') + '">' + padIcon() + '<span>' + esc(tabWord(GAMES_WORD)) + '</span></button>' +
      '<button type="button" data-v="sports" class="' + (S.view === 'sports' ? 'on' : '') + '">' + ballIcon() + '<span>' + esc(tabWord(PRED_WORD)) + '</span></button></div><div id="csView"></div>';
    $('csBody').querySelectorAll('[data-v]').forEach(function (b) { b.addEventListener('click', function () { home(b.getAttribute('data-v')); }); });
    var v = $('csView');
    if (S.view === 'sports') {
      v.className = 'cs-sports';
      if (D6.Sports && D6.Sports.paint) D6.Sports.paint(v, { guest: guest(), signup: signup, toast: toast, afterPlay: afterPlay, stake: function () { return S.stake; } });
    } else {
      v.className = 'cs-grid';
      var tile = function (k) {
        return '<button type="button" class="cs-g" data-g="' + k + '" style="--tc:' + pal(k)[1] + '">' + gicon(k) + '<b>' + (LIVE_GAMES[k] ? '<i class="cs-onair" aria-label="live"><svg viewBox="0 0 16 12"><circle cx="8" cy="6" r="2.2"/><path d="M4.6 2.6a4.8 4.8 0 0 0 0 6.8M11.4 2.6a4.8 4.8 0 0 1 0 6.8"/></svg></i>' : '') + '<span class="fit">' + esc(name(k)) + '</span></b></button>';
      };
      // v2804 (propriétaire) : 3 listes — Live · Tu contrôles · Tous les jeux
      // v2812 (round 4) : la salle de jeux (~70 logos dessinés) est gardée telle quelle : revenir d'un jeu est instantané
      // (avant : tout redessiné à chaque retour, ~1 s sur un vieil Android → le 2e toucher passait « à travers »)
      // v2821 (propriétaire) : 3 onglets en haut — Joue toi-même · Live · Casino (chaque onglet montre sa liste)
      var all = ORDER.filter(function (k) { return GAMES[k] && NAMES[k]; }).concat(CAT.filter(function (k) { return ORDER.indexOf(k) < 0; }));
      // v2832 (propriétaire : « retire 3 des jeux de cartes qui se ressemblent ») : cachés de la salle (leurs fiches restent
      // sur le serveur : les anciennes parties se règlent et gardent leur nom).
      // + Goal (même tir au but que Penalty) et Lucky Dice (même jeu que Dice) : 72 jeux Casino = grille pleine partout
      // (4 colonnes téléphone, 6 / 8 tablette et ordinateur ; 74 forçait 5 petites colonnes et laissait un trou).
      var HIDDEN = { highcard: 1, war: 1, reddog: 1, goal: 1, luckydice: 1 };
      all = all.filter(function (k) { return !HIDDEN[k]; });
      var secOf = function (k) { return SECTION[k] || (LIVE_GAMES[k] ? 'live' : 'more'); };
      var lg = (document.documentElement.lang || 'en').slice(0, 2), TT = TAB_T[lg] || TAB_T.en;
      var bySec = {}; SEC_ORDER.forEach(function (sec) { bySec[sec] = all.filter(function (k) { return secOf(k) === sec; }); });
      // v2829 : ordre fixe des jeux « Arcade » (les catalogues arrivent dans n'importe quel ordre ; jeux voisins jamais semblables)
      var SK_POS = ['hamster', 'highway', 'jungledash', 'metrodash', 'airstrike', 'zombiesiege', 'colorjump', 'helixdrop', 'spacerun', 'flappyrock', 'stack', 'knifehit',
        'brickbreak', 'neonsnake', 'cupcake', 'princess', 'basket', 'starbridge', 'archer', 'slicer', 'chicken', 'dodge', 'dartspro', 'orbit',
        // v2850 (round 6) : les classiques que tout le monde connaît + les jeux de guerre (js/games/cat-skill6.js)
        'tankbattle', 'blockfall', 'sniper', 'merge2048', 'gunship', 'mazechomp', 'dogfight', 'bubblepop', 'gemswap', 'memoflip', 'echopads', 'pianokeys',
        'trenchdef', 'neonpong', 'commando', 'fruitcatch', 'alienwave', 'skyhopper', 'cityshield', 'meteorblast', 'beattap', 'ropeswing', 'minigolf', 'skislalom'];
      var skPos = function (k) { var i = SK_POS.indexOf(k); return i < 0 ? 999 : i; };
      bySec.skill.sort(function (a, b) { return skPos(a) - skPos(b); });
      // v2832 : ordre fixe des jeux « Casino » : deux jeux qui se ressemblent sont toujours à au moins 3 places l'un de l'autre
      var MO_POS = [
        'mines', 'penalty', 'coinpush', 'candy', 'dragon', 'limbo', 'cluster', 'plinko2', 'nails', 'golf', 'gatesgold', 'dice', 'wheel', 'safe',
        'coinlink', 'fishing', 'baccarat', 'fruitparty', 'goal', 'snakes', 'lotto', 'megaways', 'daisy', 'apple', 'pinball', 'bookstars', 'sicbo',
        'thimbles', 'cricket', 'pharaoh', 'scratch', 'tower', 'spacegems', 'teenpatti', 'fireworks', 'coin', 'wildwest', 'striker', 'colorpred',
        'jewelbox', 'aztec', 'checkers', 'keno80', 'pool', 'ocean', 'andar', 'gumball', 'dragonf', 'luckydice', 'bouquet', 'balloon', 'panda',
        'moles', 'miniroul', 'tennis', 'clover', 'hilo', 'goldpan', 'connect4', 'cosmic7', 'cups', 'craps', 'slots', 'skijump', 'chests', 'vpoker',
        'diamond', 'horseshoe', 'wheel2', 'bingo', 'jungle', 'domino', 'bowling', 'pinata',
        // casb (round 6) : tables, cartes, dés, hasard d'arcade + Comet Queen
        'cometqueen', 'blackjack', 'yatzy', 'pachinko', 'dblroul', 'tcpoker', 'derby', 'ducks', 'acerace', 'twoup', 'skeeball', 'ceelo',
        'niuniu', 'oracle', 'twinwheel', 'crownanchor', 'holdem', 'amida', 'fantan', 'shipcrew', 'clocksol', 'dreidel', 'rpsduel', 'trente',
        // casa (round 6) : 12 machines à sous (casa1) alternées avec 12 jeux instantanés (casa2/3) ; mêmes mécaniques ≥ 6 places d'écart
        'hilorun', 'scarab', 'pickbox', 'kraken', 'colorwheel', 'cherrybar', 'egghunt', 'ufo', 'flip21', 'goldtrain', 'envelope', 'koi',
        'shells', 'viking', 'ladder', 'safari', 'luckyten', 'donut', 'popdarts', 'rubymine', 'treasure', 'pumpkin', 'scratchwin', 'medusa'];
      var moPos = function (k) { var i = MO_POS.indexOf(k); return i < 0 ? 999 : i; };
      bySec.more.sort(function (a, b) { return moPos(a) - moPos(b); });
      var cur = curSec(); if (!bySec[cur].length) cur = SEC_ORDER.filter(function (x) { return bySec[x].length; })[0] || 'skill';
      v.className = 'cs-grid cs-grid3';
      var tpb = m.querySelector('.cs-top'); if (tpb) v.style.setProperty('--cs-tabs-top', Math.max(0, tpb.offsetHeight - 8) + 'px');
      // v2812 (round 4) : la salle de jeux (logos dessinés) est gardée telle quelle, par onglet : revenir d'un jeu est instantané
      // (avant : tout redessiné à chaque retour, ~1 s sur un vieil Android → le 2e toucher passait « à travers »)
      var lsig = lg + '|' + cur + '|' + all.join(',');
      S.lobs = S.lobs || {};
      var hit = S.lobs[cur];
      if (hit && hit.sig === lsig) {
        v.textContent = ''; hit.nodes.forEach(function (n) { v.appendChild(n); });
        balanceGrid(v); fitAll(v); evenNames(v);
        var box0 = m.querySelector('.modal-box'); if (box0) box0.scrollTop = 0;
        return;
      }
      var tabs = '<div class="cs-tabs" role="tablist">' + SEC_ORDER.map(function (sec) {
        return '<button type="button" class="cs-tab' + (sec === cur ? ' on' : '') + '" data-t="' + (sec === 'more' ? 'casino' : sec) + '" data-sec="' + sec + '" role="tab"><span class="fit">' + esc(TT[sec]) + '</span><i>' + bySec[sec].length + '</i></button>';
      }).join('') + '</div>';
      var TD = TAB_D[lg] || TAB_D.en;
      var html = tabs + '<div class="cs-sec cs-sec-' + cur + '"><p class="cs-sec-d fit2">' + esc(TD[cur]) + '</p><div class="cs-sec-g">' + bySec[cur].map(tile).join('') + '</div></div>';
      v.innerHTML = html;
      balanceGrid(v); fitAll(v); evenNames(v);
      v.querySelectorAll('.cs-tab').forEach(function (t) {
        t.addEventListener('click', function () {
          var sec = t.getAttribute('data-sec'); if (sec === curSec() && t.classList.contains('on')) return;
          try { sessionStorage.setItem('oro_cs_tab', sec); } catch (e) { /* ignore */ }
          home('games');
        });
      });
      v.querySelectorAll('.cs-g').forEach(function (b) { b.addEventListener('click', function (e) { if (navBusy(e) || S.game) return; navMark(); var mb = m.querySelector('.modal-box'); S.homeY = mb ? mb.scrollTop : 0; go(b.getAttribute('data-g')); }); });
      S.lobs[cur] = { sig: lsig, nodes: [].slice.call(v.children) };
    }
    var box = m.querySelector('.modal-box'); if (box) box.scrollTop = 0;
  }
  // v2757 : les 24 jeux tiennent dans l'écran, sans défiler (téléphone, iPhone, PC, télé) : la taille des logos s'adapte
  function fitGrid() {
    var v = $('csView'), m = $('casinoModal'), mb = m && m.querySelector('.modal-box');
    if (!v || !mb || v.className.indexOf('cs-grid') < 0 || v.className.indexOf('cs-grid3') >= 0 || !v.firstChild) return; // v2804 : l'accueil en 3 listes défile (beaucoup de jeux)
    v.style.removeProperty('--cs-pl');
    var cols = getComputedStyle(v).gridTemplateColumns.split(' ').length || 4, n = v.children.length, rows = Math.ceil(n / cols);
    var top = v.getBoundingClientRect().top - mb.getBoundingClientRect().top + mb.scrollTop;
    var avail = mb.clientHeight - top - 10, gap = parseFloat(getComputedStyle(v).rowGap) || 8;
    var lbl = v.querySelector('.cs-g b'), lh = lbl ? lbl.offsetHeight + 4 : 30;
    var colw = v.clientWidth / cols;
    var px = Math.floor(Math.min(colw * 0.86, (avail - gap * (rows - 1)) / rows - lh, 96));
    v.style.setProperty('--cs-pl', Math.max(34, px) + 'px');
    var over = mb.scrollHeight - mb.clientHeight; // reste un petit dépassement (marges) : on réduit encore un peu
    if (over > 0 && px > 34) v.style.setProperty('--cs-pl', Math.max(34, px - Math.ceil(over / rows) - 1) + 'px');
  }
  var lobRT = 0;
  window.addEventListener('resize', function () { if (!S.game && S.view === 'games') { fitGrid(); clearTimeout(lobRT); lobRT = setTimeout(function () { var v = $('csView'); if (!v || S.game) return; balanceGrid(v); fitAll(v); evenNames(v); }, 160); } });
  /* v2812 (propriétaire : « des trous dans les grilles ») — chaque liste de l'accueil a des rangées COMPLÈTES sur tous les écrans :
     on part du nombre de colonnes prévu par l'écran (téléphone 4, tablette/PC/télé 6, téléphone couché 8) et, si le nombre de
     jeux ne tombe pas juste, on prend le nombre de colonnes le plus proche qui tombe juste (ex. 16 jeux sur 6 → 8 ; 8 sur 6 → 8). */
  // v2812 : dans une même liste, tous les noms ont la même taille (celle du nom le plus long, déjà rapetissé par fit)
  function evenNames(v) {
    if (!v || !v.querySelectorAll) return;
    v.querySelectorAll('.cs-sec-g').forEach(function (g) {
      // taille commune = celle qui va à 80 % des noms ; les quelques noms très longs restent un peu plus petits
      var sp = [].slice.call(g.querySelectorAll('.cs-g b > span')); if (!sp.length) return;
      var fs = sp.map(function (e) { return parseFloat(getComputedStyle(e).fontSize) || 12; });
      var q = fs.slice().sort(function (a, b2) { return a - b2; })[Math.floor(fs.length * 0.2)];
      sp.forEach(function (e, i) { e.style.setProperty('font-size', Math.min(fs[i], q).toFixed(1) + 'px', 'important'); });
    });
  }
  function balanceGrid(v) {
    if (!v || !v.querySelectorAll) return;
    v.querySelectorAll('.cs-sec-g').forEach(function (g) {
      g.style.removeProperty('grid-template-columns');
      var n = g.children.length; if (!n) return;
      var base = getComputedStyle(g).gridTemplateColumns.split(' ').filter(Boolean).length || 4;
      if (n % base === 0) return;
      var lo = Math.max(3, base - 2), hi = Math.min(10, base + 2), best = 0, bd = 99;
      if (n <= hi && n >= Math.max(3, base - 2)) { best = n; bd = Math.abs(n - base); }
      for (var c = hi; c >= lo; c--) if (n % c === 0 && Math.abs(c - base) < bd) { best = c; bd = Math.abs(c - base); }
      if (!best) { // aucun nombre ne tombe juste : le moins de cases vides possible
        var hole = 99; for (var c2 = hi; c2 >= lo; c2--) { var h = (c2 - n % c2) % c2; if (h < hole) { hole = h; best = c2; } }
      }
      if (best && best !== base) g.style.setProperty('grid-template-columns', 'repeat(' + best + ',minmax(0,1fr))');
    });
  }
  // v2850 : un jeu du catalogue peut donner son nom dans les 12 langues (nm) ; sinon le nom anglais commun
  var NAMEL = {};
  function name(k) { var n = NAMEL[k], l = (document.documentElement.lang || 'en').slice(0, 2); return (n && n[l]) || NAMES[k] || k; }
  // v2747 (propriétaire) : 2e onglet = « Prédictions » (boule de cristal) — toutes les questions et tous les matchs ensemble
  var GAMES_WORD = {}; var PRED_WORD = { fr: 'Paris', en: 'Bets', es: 'Apuestas', pt: 'Apostas', ar: 'رهانات', tr: 'Bahisler', vi: 'Cược', id: 'Taruhan', ru: 'Ставки', de: 'Wetten', hi: 'दांव', zh: '投注' };
  function tabWord(m) { var l = (document.documentElement.lang || 'fr').slice(0, 2); return m[l] || m.en; }
  function ballIcon() {
    var id = 'cb' + (++gn);
    return '<svg class="cs-padico" viewBox="0 0 64 52" aria-hidden="true"><defs><radialGradient id="' + id + '" cx="36%" cy="30%" r="75%"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset=".55" stop-color="#fff" stop-opacity=".12"/><stop offset="1" stop-color="#fff" stop-opacity=".04"/></radialGradient></defs>' +
      '<path d="M19 47l4-7.5h18l4 7.5z" fill="rgba(255,255,255,.1)" stroke="#EDEBFF" stroke-width="2.4" stroke-linejoin="round"/><circle cx="32" cy="22" r="16" fill="url(#' + id + ')" stroke="#EDEBFF" stroke-width="2.6"/>' +
      '<path d="M23.5 14a10.5 10.5 0 0 1 6-3.4" stroke="#fff" stroke-width="2.4" stroke-linecap="round" fill="none" opacity=".85"/><path d="M37 20.5l1.3 2.8 3 .4-2.2 2 .6 3-2.7-1.5-2.7 1.5.6-3-2.2-2 3-.4z" fill="#fff" opacity=".9"/></svg>';
  }
  // v2742 (propriétaire) : la manette transparente violet-rose (le logo « Jeux » du bouton du haut)
  function padIcon() {
    var id = 'pd' + (++gn);
    return '<svg class="cs-padico" viewBox="0 6 64 52" aria-hidden="true"><defs><linearGradient id="' + id + '" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#A78BFA"/><stop offset="1" stop-color="#F472B6"/></linearGradient></defs>' +
      '<path d="M17 18h30c8 0 12 6 13.5 14l2 11c1.2 7-5 11-10 7l-8-7H19.5l-8 7c-5 4-11.2 0-10-7l2-11C5 24 9 18 17 18z" fill="rgba(167,139,250,.14)" stroke="url(#' + id + ')" stroke-width="3"/>' +
      '<g transform="translate(18 31)" fill="url(#' + id + ')"><rect x="-2.6" y="-7.5" width="5.2" height="15" rx="1.4"/><rect x="-7.5" y="-2.6" width="15" height="5.2" rx="1.4"/></g>' +
      '<g transform="translate(46 31)"><circle cy="-5.2" r="2.5" fill="#22C55E"/><circle cx="5.2" r="2.5" fill="#EF4444"/><circle cx="-5.2" r="2.5" fill="#3B82F6"/><circle cy="5.2" r="2.5" fill="#FACC15"/></g></svg>';
  }
  function modeSwitch() { return ''; }
  function bindMode() { /* plus de choix réel / démo */ }
  /* panneau de mise compact, en bas de l'écran */
  /* v2795 (propriétaire) — TERMINAL DE MISE comme les grands jeux (Aviator / JetX) : à gauche le montant avec « − » et « + »
     (petite croix DANS la case pour revenir à 0,10 $) et 4 montants rapides ; à droite le GRAND bouton de mise.
     Aucun mot dans le terminal. Les textes du bouton s'adaptent seuls à la place (fit). */
  var QUICK = [0.5, 1, 5, 10];
  function stakePanel(btnLabel, extra) {
    var x = X();
    return '<div class="cs-panel cg-panel">' + (extra ? '<div class="cs-extra">' + extra + '</div>' : '') +
      '<div class="cg-term"><div class="cg-tl">' +
        '<div class="cg-amt"><button type="button" class="cg-step" data-sk="dn" aria-label="−"><svg viewBox="0 0 24 24"><path d="M6 12h12"/></svg></button>' +
          '<label class="cg-in"><input id="csStake" inputmode="decimal" autocomplete="off" value="' + m2(S.stake) + '" aria-label="' + esc(x.stake) + '"></label>' +
          '<button type="button" class="cg-step" data-sk="up" aria-label="+"><svg viewBox="0 0 24 24"><path d="M6 12h12M12 6v12"/></svg></button></div>' +
        // 2026-10-19 (propriétaire) : 4 touches utiles au lieu de 0,50 / 1 / 5 / 10 : moitié, double, effacer (⌫), max.
        '<div class="cg-quick cg-ops">' +
          '<button type="button" data-op="half" aria-label="½">½</button>' +
          '<button type="button" data-op="dbl" aria-label="×2">×2</button>' +
          '<button type="button" data-op="clr" aria-label="0.10"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5h11a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H9l-6-7z"/><path d="M12 9.5l5 5M17 9.5l-5 5"/></svg></button>' +
          '<button type="button" data-op="max">MAX</button>' +
        '</div>' +
      '</div><button type="button" class="cs-go cg-go fit" id="csGo">' + esc(btnLabel || x.bet) + '</button></div></div>';
  }
  function dec() { return ['en', 'zh', 'hi', 'ar'].indexOf((document.documentElement.lang || 'fr').slice(0, 2)) >= 0 ? '.' : ','; }
  function stepOf(v, up) { return up ? (v < 1 ? 0.1 : v < 10 ? 1 : v < 100 ? 5 : 50) : (v <= 1 ? 0.1 : v <= 10 ? 1 : v <= 100 ? 5 : 50); }
  function bindStake(box) {
    var inp = $('csStake'); if (!inp) return;
    // v2818 (propriétaire : « 1000.00 déborde ») : le montant rapetisse quand il s'allonge, pour toujours se lire en entier.
    var baseFs = 0;
    var fitInp = function () {
      inp.style.removeProperty('font-size');
      if (!baseFs) baseFs = parseFloat(getComputedStyle(inp).fontSize) || 16;
      var n = String(inp.value || inp.placeholder || '').length;
      if (n > 4) inp.style.setProperty('font-size', Math.max(10, baseFs * 5.4 / n).toFixed(1) + 'px', 'important');
    };
    var set = function (v) { v = Math.max(0.1, Math.min(1000, Math.round((Number(v) || 0.1) * 100) / 100)); S.stake = v; inp.value = m2(v); fitInp(); box.dispatchEvent(new Event('stake')); };
    // v2807 (propriétaire, iPhone) : select() ne sélectionne pas sur iPhone → le montant tapé s'ajoutait derrière l'ancien
    // (« 0.105 »). Toucher la case la VIDE (l'ancien montant reste en gris) ; vide en sortant = l'ancien montant revient.
    var editing = false;
    var commit = function () {
      if (!editing) return; editing = false; inp.placeholder = '';
      var t = String(inp.value).replace(/\s/g, '').replace(',', '.').replace(/[^0-9.]/g, ''), i = t.indexOf('.');
      if (i >= 0) t = t.slice(0, i + 1) + t.slice(i + 1).replace(/\./g, '');
      if (t === '' || !isFinite(parseFloat(t))) { inp.value = m2(S.stake); fitInp(); } else set(parseFloat(t));
    };
    inp.addEventListener('focus', function () { editing = true; inp.placeholder = m2(S.stake); inp.value = ''; fitInp(); });
    // le montant tapé compte TOUT DE SUITE (sur iPhone, toucher « Miser » ne fait pas toujours sortir de la case)
    inp.addEventListener('input', function () {
      var c = String(inp.value).replace(/[^0-9.,]/g, ''); if (c !== inp.value) inp.value = c; fitInp();
      var v = parseFloat(c.replace(',', '.'));
      if (isFinite(v) && v >= 0.1) { S.stake = Math.min(1000, Math.round(v * 100) / 100); box.dispatchEvent(new Event('stake')); }
    });
    inp.addEventListener('blur', commit);
    inp.addEventListener('change', commit);
    inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); inp.blur(); } });
    // v2825 (propriétaire, iPhone : « je touche la case, le clavier ne vient pas ») : tout toucher sur la case du montant
    // (sauf la petite ✕) ouvre le clavier, même si le doigt tombe à côté des chiffres. Le focus() part dans le toucher
    // même (iOS n'ouvre le clavier que pendant le geste).
    var lab = inp.closest('.cg-in');
    if (lab) lab.addEventListener('touchend', function (e) {
      if (e.target && e.target.closest && e.target.closest('.cg-clr')) return;
      if (document.activeElement === inp) return;
      if (e.cancelable) e.preventDefault();
      try { inp.focus(); } catch (x) { /* ignore */ }
    }, { passive: false });
    box.querySelectorAll('[data-sk]').forEach(function (b) {
      b.addEventListener('click', function (e) {
        e.preventDefault();
        var k = b.getAttribute('data-sk');
        if (k === 'clr') set(0.1);
        else if (k === 'up') set(S.stake + stepOf(S.stake, true));
        else set(S.stake - stepOf(S.stake, false));
      });
    });
    box.querySelectorAll('.cg-quick [data-q]').forEach(function (b) { b.addEventListener('click', function () { set(+b.getAttribute('data-q')); }); });
    box.querySelectorAll('.cg-ops [data-op]').forEach(function (b) {
      b.addEventListener('click', function (e) {
        e.preventDefault();
        var op = b.getAttribute('data-op');
        if (op === 'half') set(S.stake / 2);
        else if (op === 'dbl') set(S.stake * 2);
        else if (op === 'clr') set(0.1);
        else { var bal = S.bal[S.adminTest ? 'demo' : 'real']; set(Math.min(1000, bal != null && bal >= 0.1 ? Math.floor(bal * 100) / 100 : 1000)); }
      });
    });
    setTimeout(fitInp, 0);
  }

  /* v2795 (propriétaire) — TEXTES ÉLASTIQUES : un texte marqué « fit » reste sur UNE ligne et rapetisse seul s'il manque
     de place (toutes les langues, tous les écrans) ; il reprend sa taille quand la place revient. */
  function fitEl(el) {
    if (!el || !el.isConnected) return;
    el.style.removeProperty('font-size');
    var fs = parseFloat(getComputedStyle(el).fontSize) || 14, min = Math.max(7, fs * 0.5), n = 0;
    // « important » : passe devant les tailles !important des feuilles de style (sinon le bouton ne rapetissait pas)
    while (el.scrollWidth > el.clientWidth + 1 && fs > min && n++ < 30) { fs = Math.max(min, fs * 0.93); el.style.setProperty('font-size', fs.toFixed(1) + 'px', 'important'); }
  }
  function fitAll(root) { (root || document).querySelectorAll('.fit').forEach(fitEl); }
  function setText(el, t) { if (!el) return; t = String(t == null ? '' : t); if (el.textContent !== t) { el.textContent = t; fitEl(el); } }
  var fitT = 0;
  window.addEventListener('resize', function () { clearTimeout(fitT); fitT = setTimeout(function () { var m = $('casinoModal'); if (m) fitAll(m); }, 120); });

  /* v2795 — chaque jeu refait vit dans son propre fichier (js/games/<jeu>.js + css/games/<jeu>.css), chargé SEULEMENT
     quand on ouvre ce jeu : le site reste léger. Sans réseau, l'ancien jeu prend le relais. */
  // jeux refaits disponibles : { clé du jeu: nom du fichier } (plusieurs jeux peuvent partager un fichier)
  var MODS = { crash: 'crash', jet: 'crash', rocket: 'crash', mines: 'mines', tower: 'tower', apple: 'apple', balloon: 'balloon',
    cryptox: 'live', horses: 'live', race: 'live', roulette: 'live', slots: 'slots', wheel: 'wheel', scratch: 'scratch', chests: 'chests', lotto: 'lotto',
    dragon: 'tables', baccarat: 'tables', sicbo: 'tables', dice: 'dice', coin: 'coin', limbo: 'limbo', hilo: 'hilo', penalty: 'penalty' };
  try { Object.assign(MODS, JSON.parse(localStorage.getItem('cg_dev_mods') || '{}')); } catch (eDm) { /* essais locaux seulement */ }
  var MOD_V = '2862'; // v2822 (round 4) : cards1 (Andar Bahar plus rapide) ; v2821 : onglets ; v2818 : montant de mise qui rapetisse
  var modState = {};
  /* v2804 (propriétaire) — CATALOGUE des nouveaux jeux : chaque groupe déclare ses jeux (js/games/cat-*.js) :
     { k: clé, name: nom, sec: 'live' | 'skill' | 'more', file: fichier du jeu, pal: [clair, foncé], icon: '<svg intérieur 64×64>' }.
     L'accueil range tout en 3 listes : Live · Tu contrôles · Tous les jeux. */
  var SECTION = {}, CAT = [];
  D6.CasinoCatalog = {
    add: function (list) {
      (list || []).forEach(function (e) {
        if (!e || !e.k || NAMES[e.k] || !/^[a-z][a-z0-9]{1,15}$/.test(e.k)) return;
        NAMES[e.k] = String(e.name || e.k); if (e.nm) NAMEL[e.k] = e.nm; MODS[e.k] = String(e.file || e.k); SECTION[e.k] = e.sec === 'live' || e.sec === 'skill' ? e.sec : 'more'; CAT.push(e.k);
        if (e.sec === 'live') LIVE_GAMES[e.k] = 1; // v2807 : pastille « en direct » sur le logo
        if (e.icon && ART.addObj) ART.addObj(e.k, e.icon, e.pal);
      });
      catRepaint();
    }
  };
  // v2812 : les 5 fichiers du catalogue arrivent l'un après l'autre → UN seul nouveau dessin de la salle (pas de saut, pas de
  // rangée à moitié vide entre deux), à la même hauteur de défilement ; un jeu demandé avant l'arrivée du catalogue s'ouvre alors.
  var catRT = 0, catDone = false, catLeft = 0;
  function catRepaint() {
    clearTimeout(catRT);
    catRT = setTimeout(function () {
      var m = $('casinoModal'); if (!m || !m.classList.contains('active')) return;
      if (S.pend && NAMES[S.pend] && !S.game) { var pk = S.pend; S.pend = ''; go(pk); return; }
      if (!S.game && S.view === 'games' && $('csView') && $('csView').className.indexOf('cs-grid') >= 0) {
        var mb = m.querySelector('.modal-box'), y = mb ? mb.scrollTop : 0;
        home('games'); if (mb) mb.scrollTop = y;
      }
    }, catDone ? 0 : 90);
  }
  // v2806 : le catalogue des nouveaux jeux (logos + noms, ~50 Ko) se charge après l'affichage du site, ou à l'ouverture du Casino
  var CAT_FILES = ['cat-skill1', 'cat-skill2', 'cat-skill4', 'cat-more1', 'cat-more2', 'cat-more3', 'cat-more4', 'cat-live2', 'cat-casb', 'cat-casa', 'cat-skill6'], catAsked = false; // v2807 : cat-more3 (Lucky Planets en direct, Star Bowling)
  function loadCatalog() {
    if (catAsked) return; catAsked = true;
    catLeft = CAT_FILES.length;
    var one = function () { if (--catLeft <= 0) { catDone = true; if (S.pend && !NAMES[S.pend]) S.pend = ''; catRepaint(); } };
    CAT_FILES.forEach(function (f) { var js = document.createElement('script'); js.src = 'js/games/' + f + '.js?v=' + MOD_V; js.async = true; js.onload = one; js.onerror = one; document.head.appendChild(js); });
  }
  (function () {
    var later = function () { if (window.requestIdleCallback) requestIdleCallback(loadCatalog, { timeout: 4000 }); else setTimeout(loadCatalog, 2000); };
    if (document.readyState === 'complete') later(); else window.addEventListener('load', later);
  })();
  function loadMod(k) {
    var f = String(MODS[k] || k).replace(/[^a-z0-9_-]/gi, '');
    if (modState[f]) return modState[f];
    modState[f] = new Promise(function (res) {
      var css = document.createElement('link'); css.rel = 'stylesheet'; css.href = 'css/games/' + f + '.css?v=' + MOD_V; document.head.appendChild(css);
      var js = document.createElement('script'); js.src = 'js/games/' + f + '.js?v=' + MOD_V; js.async = true;
      js.onload = function () { res(true); };
      js.onerror = function () { delete MODS[k]; modState[f] = null; res(false); }; // l'ancien jeu prend le relais
      document.head.appendChild(js);
    });
    return modState[f];
  }
  function go(k) {
    navMark(); S.pend = ''; cgMark(k);
    if (MODS[k] && !(GAMES[k] && GAMES[k].v2)) {
      S.game = k;
      var seq = (S.goSeq = (S.goSeq || 0) + 1);
      // v2812 : jamais d'écran noir — réseau trop lent (12 s) → message et retour à la salle de jeux
      var slow = setTimeout(function () { if (S.game === k && S.goSeq === seq && !(GAMES[k] && GAMES[k].v2)) { toast(X().e_unavailable); delete modState[String(MODS[k] || k).replace(/[^a-z0-9_-]/gi, '')]; home('games'); } }, 12000);
      loadMod(k).then(function () {
        clearTimeout(slow);
        if (S.game !== k || S.goSeq !== seq) return; // ouvert entre-temps un autre jeu / fermé : on ne dessine pas
        if (!GAMES[k]) { toast(X().e_unavailable); home('games'); return; } // nouveau jeu sans ancienne version : retour à l'accueil
        render(k);
      });
      var bd = $('csBody'); if (bd) bd.innerHTML = '<div class="cg-load"><i></i></div>';
      return;
    }
    render(k);
  }
  function render(k) {
    stopAll();
    S.game = k; cgMark(k);
    var x = X(), m = $('casinoModal');
    m.classList.add('in-game'); m.setAttribute('data-g', k); $('csSheet').hidden = true; $('csHelp').hidden = false;
    if (D6.Sfx) D6.Sfx.game(k);
    var p = pal(k);
    m.style.setProperty('--tc', p[1]); m.style.setProperty('--p1', p[0]); m.style.setProperty('--p2', p[1]);
    paintBal();
    var body = $('csBody');
    body.innerHTML = '<div class="cs-game cs-' + k + (guest() ? ' is-guest' : '') + '"></div>';
    var box = body.firstChild;
    (GAMES[k] || GAMES.coin)(box, x);
    // v2763 (propriétaire) : le VISITEUR voit « Créer mon compte » dans TOUS les jeux (les choix restent visibles,
    // la mise et « Miser » sont remplacés par l'invitation à s'inscrire)
    if (guest() && !box.querySelector('.cs-try')) {
      var pn = box.querySelector('.cs-panel');
      if (pn) { pn.classList.add('cs-guestpanel'); var nb = document.createElement('div'); nb.id = 'csNeed'; pn.appendChild(nb); needAccount(nb, x); }
    }
    // v2694 : nom du jeu sur sa propre ligne, au-dessus de la scène (ne recouvre plus rien) ; résultat en bas
    var tag = document.createElement('div'); tag.className = 'cs-gname'; tag.innerHTML = gicon(k, 'mini') + '<b>' + esc(name(k)) + '</b>';
    box.insertBefore(tag, box.firstChild);
    var mb = m.querySelector('.modal-box'); if (mb) mb.scrollTop = 0;
    decFix(box);
    tag.querySelector('b').classList.add('fit');
    requestAnimationFrame(function () { fitAll(box); if (box.isConnected && S.game === k) gameHint(k, box); });
    watchFit(box);
  }
  /* v2812 (propriétaire : « certains jeux, je ne comprends pas du tout ») — PETIT GESTE D'AIDE à l'ouverture, comme les jeux
     « Tu contrôles » : une main dorée qui tapote + une phrase courte sur ce qu'il faut faire ; elle part au premier toucher. */
  var HINT_T = {
    andar: { en: 'Pick Andar or Bahar, then Bet', fr: 'Choisis Andar ou Bahar, puis Miser', es: 'Elige Andar o Bahar y apuesta', pt: 'Escolha Andar ou Bahar e aposte', ar: 'اختر أندر أو باهر ثم راهن', tr: 'Andar veya Bahar seç, sonra bahis', vi: 'Chọn Andar hoặc Bahar rồi cược', id: 'Pilih Andar atau Bahar, lalu pasang', ru: 'Выбери Андар или Бахар и ставь', de: 'Andar oder Bahar wählen, dann setzen', hi: 'अंदर या बाहर चुनें, फिर दांव', zh: '选安达或巴哈，然后下注' },
    war: { en: 'Higher card wins: pick a side', fr: 'La plus forte gagne : choisis', es: 'Gana la carta más alta: elige', pt: 'Ganha a carta maior: escolha', ar: 'الورقة الأعلى تفوز: اختر', tr: 'Yüksek kart kazanır: seç', vi: 'Lá cao hơn thắng: chọn bên', id: 'Kartu tertinggi menang: pilih', ru: 'Старшая карта бьёт: выбирай', de: 'Höhere Karte gewinnt: wählen', hi: 'बड़ा पत्ता जीतता है: चुनें', zh: '大牌获胜：选一边' },
    highcard: { en: 'Next card: higher or lower?', fr: 'Carte suivante : plus haut ou bas ?', es: 'Siguiente carta: ¿mayor o menor?', pt: 'Próxima carta: maior ou menor?', ar: 'الورقة التالية: أعلى أم أقل؟', tr: 'Sonraki kart: yüksek mi düşük mü?', vi: 'Lá tiếp theo: cao hay thấp?', id: 'Kartu berikut: tinggi atau rendah?', ru: 'Следующая карта: выше или ниже?', de: 'Nächste Karte: höher oder tiefer?', hi: 'अगला पत्ता: ज़्यादा या कम?', zh: '下一张：大还是小？' },
    reddog: { en: 'Tap Bet: 3rd card must fall between', fr: 'Miser : la 3e carte doit tomber entre', es: 'Apuesta: la 3.ª carta debe caer entre', pt: 'Aposte: a 3.ª carta deve cair entre', ar: 'راهن: الورقة الثالثة يجب أن تقع بينهما', tr: 'Bahis: 3. kart arada olmalı', vi: 'Cược: lá thứ 3 phải nằm giữa', id: 'Pasang: kartu ke-3 harus di antara', ru: 'Ставь: 3-я карта должна лечь между', de: 'Setzen: 3. Karte muss dazwischen', hi: 'दांव: तीसरा पत्ता बीच में हो', zh: '下注：第三张须在两张之间' },
    teenpatti: { en: 'Tap Bet: a good 3-card hand pays', fr: 'Miser : une belle main de 3 cartes paie', es: 'Apuesta: una buena mano de 3 paga', pt: 'Aposte: uma boa mão de 3 paga', ar: 'راهن: يد جيدة من 3 أوراق تربح', tr: 'Bahis: iyi 3 kartlık el kazandırır', vi: 'Cược: bộ 3 lá đẹp sẽ thắng', id: 'Pasang: 3 kartu bagus menang', ru: 'Ставь: сильная рука из 3 карт платит', de: 'Setzen: gute 3-Karten-Hand zahlt', hi: 'दांव: अच्छे 3 पत्ते जिताते हैं', zh: '下注：好的三张牌赢钱' },
    vpoker: { en: 'Tap Bet: Jacks or better pays', fr: 'Miser : valets ou mieux = gain', es: 'Apuesta: jotas o más pagan', pt: 'Aposte: valetes ou mais pagam', ar: 'راهن: شباب أو أعلى تربح', tr: 'Bahis: Vale veya üstü kazanır', vi: 'Cược: đôi J trở lên thắng', id: 'Pasang: Jack ke atas menang', ru: 'Ставь: валеты и выше платят', de: 'Setzen: Buben oder besser zahlt', hi: 'दांव: जैक या बेहतर जीतता है', zh: '下注：J 对或更好赢钱' },
    thimbles: { en: 'Find the ball: pick a thimble', fr: 'Trouve la bille : choisis un dé', es: 'Encuentra la bola: elige uno', pt: 'Ache a bola: escolha um', ar: 'جد الكرة: اختر كشتبانًا', tr: 'Topu bul: bir yüksük seç', vi: 'Tìm bóng: chọn một chiếc', id: 'Cari bola: pilih satu', ru: 'Найди шарик: выбери напёрсток', de: 'Finde die Kugel: Hut wählen', hi: 'गेंद ढूंढें: एक चुनें', zh: '找小球：选一个顶针' },
    cups: { en: 'Find the ball: pick a cup', fr: 'Trouve la balle : choisis un gobelet', es: 'Encuentra la bola: elige un vaso', pt: 'Ache a bola: escolha um copo', ar: 'جد الكرة: اختر كوبًا', tr: 'Topu bul: bir bardak seç', vi: 'Tìm bóng: chọn một cốc', id: 'Cari bola: pilih gelas', ru: 'Найди шарик: выбери стакан', de: 'Finde den Ball: Becher wählen', hi: 'गेंद ढूंढें: कप चुनें', zh: '找小球：选一个杯子' },
    goal: { en: 'Pick where to shoot, then Bet', fr: 'Choisis où tirer, puis Miser', es: 'Elige dónde chutar y apuesta', pt: 'Escolha onde chutar e aposte', ar: 'اختر مكان التسديد ثم راهن', tr: 'Nereye şut seç, sonra bahis', vi: 'Chọn hướng sút rồi cược', id: 'Pilih arah tendangan, lalu pasang', ru: 'Выбери, куда бить, и ставь', de: 'Schussrichtung wählen, dann setzen', hi: 'शॉट की दिशा चुनें, फिर दांव', zh: '选射门方向，然后下注' },
    colorpred: { en: 'Pick a colour, then Bet', fr: 'Choisis une couleur, puis Miser', es: 'Elige un color y apuesta', pt: 'Escolha uma cor e aposte', ar: 'اختر لونًا ثم راهن', tr: 'Bir renk seç, sonra bahis', vi: 'Chọn màu rồi cược', id: 'Pilih warna, lalu pasang', ru: 'Выбери цвет и ставь', de: 'Farbe wählen, dann setzen', hi: 'रंग चुनें, फिर दांव', zh: '选颜色，然后下注' },
    luckydice: { en: 'Bet on the total of 2 dice', fr: 'Parie sur le total des 2 dés', es: 'Apuesta al total de 2 dados', pt: 'Aposte no total de 2 dados', ar: 'راهن على مجموع النردين', tr: '2 zarın toplamına bahis yap', vi: 'Cược tổng 2 xúc xắc', id: 'Tebak total 2 dadu', ru: 'Ставь на сумму 2 кубиков', de: 'Auf die Summe von 2 Würfeln', hi: '2 पासों के जोड़ पर दांव', zh: '押两颗骰子的总和' },
    miniroul: { en: 'Pick a number, then Bet', fr: 'Choisis un numéro, puis Miser', es: 'Elige un número y apuesta', pt: 'Escolha um número e aposte', ar: 'اختر رقمًا ثم راهن', tr: 'Bir sayı seç, sonra bahis', vi: 'Chọn số rồi cược', id: 'Pilih angka, lalu pasang', ru: 'Выбери число и ставь', de: 'Zahl wählen, dann setzen', hi: 'नंबर चुनें, फिर दांव', zh: '选号码，然后下注' },
    wheel2: { en: 'Pick a number on the wheel', fr: 'Choisis un nombre de la roue', es: 'Elige un número de la rueda', pt: 'Escolha um número da roda', ar: 'اختر رقمًا على العجلة', tr: 'Çarktan bir sayı seç', vi: 'Chọn một số trên vòng quay', id: 'Pilih angka di roda', ru: 'Выбери число на колесе', de: 'Zahl auf dem Rad wählen', hi: 'पहिये पर नंबर चुनें', zh: '选转盘上的数字' },
    plinko2: { en: 'Tap Bet to drop the ball', fr: 'Touche Miser pour lâcher la bille', es: 'Toca Apostar para soltar la bola', pt: 'Toque Apostar para soltar a bola', ar: 'اضغط راهن لإسقاط الكرة', tr: 'Topu bırakmak için Bahis', vi: 'Nhấn Cược để thả bóng', id: 'Tekan Pasang untuk jatuhkan bola', ru: 'Жми «Ставка», чтобы бросить шар', de: 'Setzen tippen: Kugel fällt', hi: 'गेंद गिराने को दांव दबाएं', zh: '点下注让球落下' },
    keno80: { en: 'Pick numbers, then Bet', fr: 'Choisis tes numéros, puis Miser', es: 'Elige números y apuesta', pt: 'Escolha números e aposte', ar: 'اختر الأرقام ثم راهن', tr: 'Sayıları seç, sonra bahis', vi: 'Chọn số rồi cược', id: 'Pilih angka, lalu pasang', ru: 'Выбери числа и ставь', de: 'Zahlen wählen, dann setzen', hi: 'नंबर चुनें, फिर दांव', zh: '选号码，然后下注' },
    bowling: { en: 'Tap Roll: more pins, bigger win', fr: 'Lancer : plus de quilles, plus de gain', es: 'Lanza: más bolos, más premio', pt: 'Lance: mais pinos, mais ganho', ar: 'ارمِ: قوارير أكثر = ربح أكبر', tr: 'At: daha çok lobut, daha çok kazanç', vi: 'Ném: càng nhiều ki càng thắng lớn', id: 'Lempar: makin banyak pin, makin besar', ru: 'Бросай: больше кеглей — больше выигрыш', de: 'Werfen: mehr Pins, mehr Gewinn', hi: 'फेंकें: ज़्यादा पिन, ज़्यादा जीत', zh: '投球：击倒越多赢越多' },
    dice: { en: 'Slide to set your chance, then Bet', fr: 'Glisse pour choisir ta chance, puis Miser', es: 'Desliza tu probabilidad y apuesta', pt: 'Deslize sua chance e aposte', ar: 'اسحب لاختيار فرصتك ثم راهن', tr: 'Şansını kaydır, sonra bahis', vi: 'Kéo để chọn tỉ lệ rồi cược', id: 'Geser peluangmu, lalu pasang', ru: 'Сдвинь шанс и ставь', de: 'Chance schieben, dann setzen', hi: 'मौका खिसकाएं, फिर दांव', zh: '滑动选择胜率，然后下注' }
  };
  var HINT_POS = { dice: 'top', plinko2: 'top', keno80: 'mid', bowling: 'mid', miniroul: 'mid', wheel2: 'mid', colorpred: 'mid' }; // sinon : en bas de la scène
  var HAND = '<svg viewBox="0 0 32 32" aria-hidden="true"><circle class="cg-hrip" cx="13" cy="9" r="6"/><path d="M13 9v11.5l-2.4-2.2a2 2 0 0 0-2.9 2.8l5.2 6.2c1 1.2 2.4 1.7 3.9 1.7h3.4a5 5 0 0 0 5-5v-6.2a2 2 0 0 0-3.4-1.4 2 2 0 0 0-3.4-1 2 2 0 0 0-3.4-.8V9a2 2 0 0 0-4 0z"/></svg>';
  function gameHint(k, box) {
    var m = HINT_T[k]; if (!m || !box) return;
    var st = box.querySelector('.cg-stage') || box.querySelector('.cs-stage'); if (!st || st.querySelector('.cg-hint')) return;
    var h = document.createElement('div'); h.className = 'cg-hint' + (HINT_POS[k] ? ' at-' + HINT_POS[k] : '');
    h.innerHTML = '<i class="cg-hhand">' + HAND + '</i><small class="fit">' + esc(m[(document.documentElement.lang || 'en').slice(0, 2)] || m.en) + '</small>';
    st.appendChild(h); fitEl(h.querySelector('small'));
    var off = function () { h.classList.add('off'); setTimeout(function () { if (h.parentNode) h.remove(); }, 400); box.removeEventListener('pointerdown', off, true); };
    box.addEventListener('pointerdown', off, true);
  }
  /* v2819 (propriétaire : « aucun texte ne dépasse, dans les 12 langues ») — FILET DE SÉCURITÉ du cadre : tout texte « fit » d'un
     jeu qui déborde (texte changé par le jeu, élément d'abord caché, police arrivée en retard…) est rapetissé ; vérifié juste
     après l'ouverture puis à chaque changement de texte (au plus ~3 fois par seconde, seulement les textes qui débordent). */
  function fitBad(root) {
    if (!root || !root.isConnected) return;
    var l = root.querySelectorAll('.fit');
    for (var i = 0; i < l.length; i++) { var e = l[i]; if (e.clientWidth > 0 && e.scrollWidth > e.clientWidth + 1) fitEl(e); }
  }
  function watchFit(box) {
    var t = 0, last = 0;
    var run = function () { t = 0; last = Date.now(); if (box.isConnected) fitBad(box); };
    [250, 900, 2000].forEach(function (ms) { setTimeout(function () { fitBad(box); }, ms); });
    if (!window.MutationObserver) return;
    var mo = new MutationObserver(function () {
      if (!box.isConnected) { mo.disconnect(); return; }
      if (!t) t = setTimeout(run, Math.max(60, 320 - (Date.now() - last)));
    });
    mo.observe(box, { childList: true, characterData: true, subtree: true, attributes: true, attributeFilter: ['class', 'hidden', 'disabled'] });
  }
  // v2789 (propriétaire) : en anglais, chinois, hindi, arabe, on écrit les gains « ×2.85 » (point), pas « ×2,85 »
  function decFix(root) {
    var l = (document.documentElement.lang || 'fr').slice(0, 2);
    if (['en', 'zh', 'hi', 'ar'].indexOf(l) < 0 || !root) return;
    try {
      var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null), n;
      while ((n = w.nextNode())) if (n.nodeValue.indexOf('×') >= 0) n.nodeValue = n.nodeValue.replace(/×(\d+),(\d+)/g, '×$1.$2');
    } catch (e) { /* ignore */ }
  }
  /* « ? » : comment on joue (une page, sans défiler) */
  function help(k) {
    var x = X(), lg = (document.documentElement.lang || 'en').slice(0, 2), mr = GAMES[k] && GAMES[k].rules;
    var r = mr ? (mr[lg] || mr.en || '') : ((RULES[lg] || RULES.en)[k] || RULES.en[k] || ''); // v2795 : un jeu refait apporte ses règles
    var sh = $('csSheet');
    sh.innerHTML = '<div class="cs-sheet-in">' + gicon(k, 'big') + '<b>' + esc(name(k)) + '</b><p>' + esc(r).replace(/\n/g, '<br>') + '</p><small>' + esc(x.rules) + '</small><button type="button" class="cs-go" id="csSheetOk">' + esc(x.gotIt) + '</button></div>';
    sh.hidden = false;
    decFix(sh);
    $('csSheetOk').addEventListener('click', function () { sh.hidden = true; });
    sh.onclick = function (e) { if (e.target === sh) sh.hidden = true; }; // toucher à côté = « J'ai compris »
  }
  // v2735 (propriétaire) : explications réécrites — 3 étapes simples par jeu (comment jouer · combien on gagne · bon à savoir)
  var RULES = {
    fr: {
      crash: '🔴 JEU EN DIRECT : tout le monde voit le même avion.\n1. Pendant le compte à rebours (5 s), choisis ta mise et touche « Miser ».\n2. L’avion décolle, le multiplicateur monte (×1,20, ×2, ×10…).\n3. Touche « Encaisser » avant que l’avion s’envole : tu gagnes mise × multiplicateur. S’il part avant, la mise est perdue.',
      jet: '🔴 JEU EN DIRECT : tout le monde voit le même Jet Man.\n1. Mise pendant le compte à rebours.\n2. Jet Man s’envole, le multiplicateur monte.\n3. Encaisse avant qu’il disparaisse : mise × multiplicateur.',
      rocket: '🔴 JEU EN DIRECT : tout le monde voit la même fusée.\n1. Mise pendant le compte à rebours.\n2. La fusée monte, le multiplicateur aussi.\n3. Encaisse avant qu’elle explose : mise × multiplicateur.',
      cryptox: '🔴 JEU EN DIRECT : un tirage toutes les 60 secondes, le même pour tout le monde.\n1. Choisis une crypto parmi les 15 (BTC, ETH, USDT…).\n2. Touche « Parier » avant la fin du compte à rebours.\n3. La roue tourne et s’arrête sur une crypto : si c’est la tienne, tu gagnes ×14,4.\nUn pari par tour.',
      horses: '🔴 JEU EN DIRECT : une course toutes les 60 secondes, la même pour tout le monde.\n1. Chaque cheval a sa COTE (favori = petite cote, outsider = grosse cote).\n2. « Gagnant » : choisis 1 cheval ; s’il arrive 1er, tu gagnes mise × sa cote.\n3. « Couplé » : choisis 2 chevaux ; s’ils arrivent 1er et 2e (dans n’importe quel ordre), tu gagnes mise × la cote du couplé.\nUn pari par course, avant le départ.',
      roulette: '🔴 JEU EN DIRECT : un tirage toutes les 40 secondes, le même pour tout le monde.\n1. Choisis : Rouge, Noir, Pair, Impair (×2), une douzaine 1-12 / 13-24 / 25-36 (×3) ou un numéro de 0 à 36 (×36).\n2. Touche « Parier » avant la fin des mises.\n3. La bille tombe sur un numéro : si ton choix est bon, tu gagnes.',
      mines: '1. Choisis le nombre de mines (1, 3, 5 ou 10) puis touche « Miser ».\n2. Ouvre des cases : chaque diamant fait monter le gain (la ligne du haut montre le gain case par case).\n3. Touche « Encaisser » quand tu veux. Une mine = mise perdue.\nPlus il y a de mines, plus chaque diamant rapporte.',
      apple: '1. Choisis le nombre de pommes pourries par étage (1 à 4) puis « Miser ».\n2. Monte étage par étage en touchant une pomme : pomme d’or = tu montes, le gain grandit (à gauche).\n3. Encaisse quand tu veux. Une pomme pourrie = mise perdue.',
      tower: '1. Touche « Miser ».\n2. À chaque étage, choisis une fenêtre sur 3 : 2 sont sûres, 1 cache un piège. Le gain de chaque étage est écrit à gauche.\n3. Encaisse quand tu veux. Le piège = mise perdue.',
      coin: '1. Choisis la pièce : Dollar ($) ou Euro (€).\n2. Touche « Miser » : la pièce tourne.\n3. Si elle tombe sur ton choix, tu gagnes ×1,94.',
      dice: '1. Choisis ton dé : ROUGE ou NOIR.\n2. Touche « Miser » : les deux dés sont lancés.\n3. Si ton dé fait le plus grand chiffre, tu gagnes ×1,92. Égalité : ta mise est rendue.',
      wheel: '1. Choisis ta mise.\n2. Touche « Miser » : la roue tourne.\n3. Le gain est la case sous la flèche : de ×0 à ×50 (les grosses cases sont rares).',
      slots: '1. Choisis ta mise et touche « Miser ».\n2. Les 3 rouleaux tournent.\n3. 3 symboles pareils = gain (voir le tableau : 3 diamants ×50, 3 « 7 » ×20, 3 cloches ×10, 3 citrons ×5, 3 cerises ×3) · 2 cerises = ×1,5.',
      limbo: '1. Choisis une cible (par exemple ×2).\n2. Touche « Miser » : un nombre est tiré.\n3. Si le nombre est au moins égal à ta cible, tu gagnes mise × cible. Plus la cible est haute, plus c’est rare.',
      scratch: '1. Touche « Miser » : tu reçois un ticket.\n2. Gratte-le avec ton doigt (ou « Tout découvrir »).\n3. 3 symboles pareils = gain (jusqu’à ×20).',
      hilo: '1. Touche « Miser » : une carte est montrée.\n2. Devine si la suivante sera plus haute ou plus basse (le gain de chaque choix est écrit sur le bouton).\n3. Chaque bonne réponse fait monter le gain. Encaisse quand tu veux ; une erreur = mise perdue.',
      dragon: '1. Choisis : Dragon, Tigre (×2) ou Égalité (×12).\n2. Une carte est donnée à chacun.\n3. La plus forte gagne. Égalité : la moitié des mises Dragon / Tigre est rendue.',
      baccarat: '1. Choisis : Joueur (×2), Banque (×1,95) ou Égalité (×9).\n2. Deux mains de cartes sont données.\n3. La main la plus proche de 9 gagne. Égalité : mises Joueur / Banque rendues.',
      sicbo: '1. Choisis Petit (total 4 à 10, en bleu) ou Grand (total 11 à 17, en rouge).\n2. Touche « Miser » : le gobelet secoue les 3 dés puis se relève.\n3. Si le total est de ton côté : ×2. Un triple (3 dés pareils) fait perdre.',
      chests: '1. Touche un des 3 coffres.\n2. Touche « Miser » : ton coffre s’ouvre.\n3. S’il contient l’or : ×2,85. Les autres s’ouvrent ensuite pour montrer où il était.',
      balloon: '1. Touche « Miser ».\n2. Appuie sur la main pour gonfler : chaque souffle fait monter le gain (en haut à gauche).\n3. Encaisse avant qu’il éclate ! S’il éclate, la mise est perdue.',
      penalty: '1. Touche « Miser ».\n2. Choisis l’endroit du but où tirer : le gardien plonge.\n3. Chaque but fait monter le gain (ligne du haut : ×1,44 → ×24,60). Encaisse quand tu veux ; un arrêt = mise perdue.',
      lotto: '1. Touche 1 à 10 numéros sur la grille (ou « Hasard »).\n2. Touche « Miser » : 10 boules sont tirées sur 40.\n3. Plus tu as de bons numéros, plus tu gagnes : le tableau au-dessus de la grille montre le gain pour chaque nombre de bons numéros (jusqu’à ×1000).',
      rps: '1. Choisis : Pierre, Feuille ou Ciseaux.\n2. Touche « Miser » : le robot OROLADO joue en même temps.\n3. Feuille bat pierre, ciseaux bat feuille, pierre bat ciseaux. Tu gagnes ×1,91 ; égalité = mise rendue.',
      race: '🔴 JEU EN DIRECT : une course toutes les 60 secondes, la même pour tout le monde.\n1. 10 voitures, chacune avec sa COTE (favorite = petite cote, outsider = grosse cote).\n2. Choisis ta voiture et touche « Parier » avant le départ.\n3. Si elle passe la ligne en 1re : mise × sa cote.',
      plinko: 'La bille tombe et rebondit jusqu’à une case : les cases du bord paient le plus (×12).',
      keno: 'Choisis 3 numéros sur 20. 5 numéros sont tirés. 1 bon = ×0,6 · 2 bons = ×3,37 · 3 bons = ×25.',
      colors: 'Un numéro de 0 à 9 sort. Vert ou Rouge : ×1,97 · Violet : ×4,7 · numéro exact : ×9,4.',
      darts: 'La fléchette part vers la cible. Centre ×20 · rouge ×5 · vert ×2 · clair ×1 · bord ×0.'
    },
    en: {
      crash: '🔴 LIVE GAME: everyone sees the same plane.\n1. During the countdown (5 s), pick your stake and tap “Bet”.\n2. The plane takes off, the multiplier rises (×1.20, ×2, ×10…).\n3. Tap “Cash out” before it flies away: you win stake × multiplier. If it leaves first, the stake is lost.',
      jet: '🔴 LIVE GAME: everyone sees the same Jet Man.\n1. Bet during the countdown.\n2. Jet Man flies, the multiplier rises.\n3. Cash out before he disappears: stake × multiplier.',
      rocket: '🔴 LIVE GAME: everyone sees the same rocket.\n1. Bet during the countdown.\n2. The rocket climbs, so does the multiplier.\n3. Cash out before it explodes: stake × multiplier.',
      cryptox: '🔴 LIVE GAME: one draw every 60 seconds, the same for everyone.\n1. Pick one of the 15 cryptos (BTC, ETH, USDT…).\n2. Tap “Place bet” before the countdown ends.\n3. The wheel spins and stops on a crypto: if it is yours, you win ×14.4.\nOne bet per round.',
      horses: '🔴 LIVE GAME: one race every 60 seconds, the same for everyone.\n1. Each horse has its ODDS (favourite = low odds, outsider = high odds).\n2. “Winner”: pick 1 horse; if it finishes 1st you win stake × its odds.\n3. “Forecast”: pick 2 horses; if they finish 1st and 2nd (any order) you win stake × the forecast odds.\nOne bet per race, before the start.',
      roulette: '🔴 LIVE GAME: one spin every 40 seconds, the same for everyone.\n1. Pick: Red, Black, Even, Odd (×2), a dozen 1-12 / 13-24 / 25-36 (×3) or a number 0 to 36 (×36).\n2. Tap “Place bet” before bets close.\n3. The ball lands on a number: if your pick is right, you win.',
      mines: '1. Pick the number of mines (1, 3, 5 or 10) then tap “Bet”.\n2. Open tiles: each diamond raises the win (the top line shows the win tile by tile).\n3. Tap “Cash out” anytime. A mine = stake lost.\nMore mines = each diamond pays more.',
      apple: '1. Pick the number of rotten apples per floor (1 to 4) then “Bet”.\n2. Climb floor by floor by tapping an apple: golden apple = you climb, the win grows (left).\n3. Cash out anytime. A rotten apple = stake lost.',
      tower: '1. Tap “Bet”.\n2. On each floor pick 1 window out of 3: 2 are safe, 1 hides a trap. Each floor’s win is written on the left.\n3. Cash out anytime. The trap = stake lost.',
      coin: '1. Pick the coin: Dollar ($) or Euro (€).\n2. Tap “Bet”: the coin flips.\n3. If it lands on your pick, you win ×1.94.',
      dice: '1. Pick your die: RED or BLACK.\n2. Tap “Bet”: both dice are rolled.\n3. If your die shows the higher number, you win ×1.92. Tie: your stake is returned.',
      wheel: '1. Pick your stake.\n2. Tap “Bet”: the wheel spins.\n3. The win is the slice under the pointer: ×0 to ×50 (big slices are rare).',
      slots: '1. Pick your stake and tap “Bet”.\n2. The 3 reels spin.\n3. 3 identical symbols = win (see the table: 3 diamonds ×50, 3 sevens ×20, 3 bells ×10, 3 lemons ×5, 3 cherries ×3) · 2 cherries = ×1.5.',
      limbo: '1. Pick a target (e.g. ×2).\n2. Tap “Bet”: a number is drawn.\n3. If it is at least your target, you win stake × target. The higher the target, the rarer.',
      scratch: '1. Tap “Bet”: you get a ticket.\n2. Scratch it with your finger (or “Reveal all”).\n3. 3 identical symbols = win (up to ×20).',
      hilo: '1. Tap “Bet”: a card is shown.\n2. Guess if the next one is higher or lower (each choice’s win is on the button).\n3. Each right guess raises the win. Cash out anytime; a wrong guess = stake lost.',
      dragon: '1. Pick: Dragon, Tiger (×2) or Tie (×12).\n2. One card is dealt to each.\n3. The higher card wins. Tie: half of Dragon / Tiger bets is returned.',
      baccarat: '1. Pick: Player (×2), Banker (×1.95) or Tie (×9).\n2. Two hands are dealt.\n3. The hand closest to 9 wins. Tie: Player / Banker bets returned.',
      sicbo: '1. Pick Small (total 4 to 10, blue) or Big (total 11 to 17, red).\n2. Tap “Bet”: the cup shakes the 3 dice then lifts.\n3. If the total is on your side: ×2. A triple (3 same dice) loses.',
      chests: '1. Tap one of the 3 chests.\n2. Tap “Bet”: your chest opens.\n3. If it holds the gold: ×2.85. The others then open to show where it was.',
      balloon: '1. Tap “Bet”.\n2. Press the hand to pump: each pump raises the win (top left).\n3. Cash out before it pops! If it pops, the stake is lost.',
      penalty: '1. Tap “Bet”.\n2. Tap the goal where you want to shoot: the keeper dives.\n3. Each goal raises the win (top line: ×1.44 → ×24.60). Cash out anytime; a save = stake lost.',
      lotto: '1. Tap 1 to 10 numbers on the grid (or “Random”).\n2. Tap “Bet”: 10 balls are drawn out of 40.\n3. The more numbers you hit, the more you win: the table above the grid shows the win for each number of hits (up to ×1000).',
      rps: '1. Pick: Rock, Paper or Scissors.\n2. Tap “Bet”: the OROLADO robot plays at the same time.\n3. Paper beats rock, scissors beats paper, rock beats scissors. You win ×1.91; tie = stake back.',
      race: '🔴 LIVE GAME: one race every 60 seconds, the same for everyone.\n1. 10 cars, each with its ODDS (favourite = low odds, outsider = high odds).\n2. Pick your car and tap “Place bet” before the start.\n3. If it crosses the line first: stake × its odds.',
      plinko: 'The ball drops and bounces into a slot: the edge slots pay the most (×12).',
      keno: 'Pick 3 numbers out of 20. 5 are drawn. 1 hit = ×0.6 · 2 hits = ×3.37 · 3 hits = ×25.',
      colors: 'A number from 0 to 9 is drawn. Green or Red: ×1.97 · Violet: ×4.7 · exact number: ×9.4.',
      darts: 'The dart flies to the board. Centre ×20 · red ×5 · green ×2 · light ×1 · edge ×0.'
    }
  };

  /* ---------- les 25 jeux (v2694 : chaque écran copie les grands : scène plein écran, sans cadre) ---------- */
  var GAMES = {};

  /* v2724 (propriétaire) : COIN FLIP = pièce DOLLAR contre pièce EURO (même calcul : 1 chance sur 2, ×1,94) */
  function moneyFace(usd) {
    var id = 'mf' + (++gn), a = usd ? ['#FFF3C4', '#F5B700', '#8A5A00'] : ['#E0F2FE', '#3B82F6', '#1E3A8A'];
    var ring = ''; if (!usd) for (var i = 0; i < 12; i++) { var an = i * 30 * Math.PI / 180; ring += '<path transform="translate(' + (100 + 62 * Math.sin(an)).toFixed(1) + ' ' + (100 - 62 * Math.cos(an)).toFixed(1) + ')" d="M0-6l1.8 3.7 4 .6-2.9 2.8.7 4L0 3.2-3.6 5.1l.7-4-2.9-2.8 4-.6z" fill="#FDE047"/>'; }
    var ticks = ''; for (var j = 0; j < 40; j++) ticks += '<rect x="99" y="5" width="2" height="8" rx="1" fill="' + a[2] + '" opacity=".5" transform="rotate(' + (j * 9) + ' 100 100)"/>';
    return '<svg viewBox="0 0 200 200"><defs><radialGradient id="' + id + '" cx="35%" cy="30%" r="80%"><stop offset="0" stop-color="' + a[0] + '"/><stop offset=".55" stop-color="' + a[1] + '"/><stop offset="1" stop-color="' + a[2] + '"/></radialGradient></defs>' +
      '<circle cx="100" cy="100" r="98" fill="url(#' + id + ')"/>' + ticks + '<circle cx="100" cy="100" r="78" fill="none" stroke="' + a[2] + '" stroke-width="4" opacity=".55"/>' + ring +
      '<text x="100" y="' + (usd ? 132 : 128) + '" text-anchor="middle" font-size="' + (usd ? 104 : 92) + '" font-weight="900" font-family="system-ui,Arial" fill="' + (usd ? '#7A4A00' : '#FFFFFF') + '" opacity=".92">' + (usd ? '$' : '€') + '</text>' +
      '<text x="100" y="172" text-anchor="middle" font-size="17" font-weight="900" letter-spacing="3" font-family="system-ui,Arial" fill="' + (usd ? '#7A4A00' : '#DBEAFE') + '">' + (usd ? 'DOLLAR' : 'EURO') + '</text></svg>';
  }
  GAMES.coin = function (box, x) {
    var side = 0;
    box.innerHTML = '<div class="cs-stage coin-stage"><div class="coin3d" id="csCoin"><i class="f">' + moneyFace(true) + '</i><i class="b">' + moneyFace(false) + '</i></div><div class="coin-lbl"><span>Dollar</span><span>Euro</span></div></div><div class="cs-res"></div>' +
      stakePanel(x.bet, '<div class="cs-seg"><button type="button" class="on" data-side="0">$ Dollar ×1,94</button><button type="button" data-side="1">€ Euro ×1,94</button></div>');
    bindStake(box);
    box.querySelectorAll('[data-side]').forEach(function (b) { b.addEventListener('click', function () { side = +b.getAttribute('data-side'); box.querySelectorAll('[data-side]').forEach(function (z) { z.classList.toggle('on', z === b); }); }); });
    var turns = 0;
    $('csGo').addEventListener('click', async function () {
      var g = this; if (g.disabled) return;
      g.disabled = true;
      var r = await play('coin', { side: side });
      if (!r) { g.disabled = false; return; }
      turns += 5; var c = $('csCoin');
      c.style.transform = 'rotateY(' + (turns * 360 + (r.view.r ? 180 : 0)) + 'deg)';
      await sleep(1300); resultLine(box, r, r.view.r ? '€ Euro' : '$ Dollar'); g.disabled = false;
    });
  };

  /* v2724 (propriétaire) : DICE = DUEL de dés. Dé ROUGE contre dé NOIR, le plus grand gagne ×1,92 ; égalité = mise rendue. */
  function duelDie(n, red) {
    var P = { 1: [[12, 12]], 2: [[7, 7], [17, 17]], 3: [[6, 6], [12, 12], [18, 18]], 4: [[7, 7], [17, 7], [7, 17], [17, 17]], 5: [[6, 6], [18, 6], [12, 12], [6, 18], [18, 18]], 6: [[7, 6], [17, 6], [7, 12], [17, 12], [7, 18], [17, 18]] }[n] || [];
    var c = red ? ['#FF7A8E', '#DC2626', '#991B1B'] : ['#6B7280', '#1F2937', '#030712'], id = 'dd' + (++gn);
    return '<svg viewBox="0 0 24 24"><defs><linearGradient id="' + id + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + c[0] + '"/><stop offset=".5" stop-color="' + c[1] + '"/><stop offset="1" stop-color="' + c[2] + '"/></linearGradient></defs>' +
      '<rect x="1" y="1" width="22" height="22" rx="5" fill="url(#' + id + ')"/><rect x="2.2" y="2.2" width="19.6" height="19.6" rx="4.2" fill="none" stroke="#fff" stroke-opacity=".28"/>' +
      P.map(function (p) { return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="2.3" fill="#fff"/>'; }).join('') + '</svg>';
  }
  GAMES.dice = function (box, x) {
    var side = 'red';
    box.innerHTML = '<div class="cs-stage dd-stage"><div class="dd-row"><div class="dd-col r"><span class="dd-die" id="csDdR">' + duelDie(6, true) + '</span><b>' + esc(x.red || 'Rouge') + '</b></div><em class="dd-vs">VS</em>' +
      '<div class="dd-col k"><span class="dd-die" id="csDdB">' + duelDie(6, false) + '</span><b>' + esc(x.black || 'Noir') + '</b></div></div><small class="cs-lbl dd-rule">' + esc(x.ddRule || 'Le plus grand dé gagne ×1,92 · égalité = mise rendue') + '</small></div><div class="cs-res"></div>' +
      stakePanel(x.bet, '<div class="cs-opts two dd-pick"><button type="button" data-d="red" class="on b-red">' + esc(x.red || 'Rouge') + '<small>×1,92</small></button><button type="button" data-d="black" class="b-black">' + esc(x.black || 'Noir') + '<small>×1,92</small></button></div>');
    bindStake(box);
    box.querySelectorAll('[data-d]').forEach(function (b) { b.addEventListener('click', function () { side = b.getAttribute('data-d'); box.querySelectorAll('[data-d]').forEach(function (z) { z.classList.toggle('on', z === b); }); }); });
    $('csGo').addEventListener('click', async function () {
      var g = this; if (g.disabled) return;
      g.disabled = true;
      var r = await play('dice', { duel: side });
      if (!r) { g.disabled = false; return; }
      var R = $('csDdR'), B = $('csDdB');
      R.className = 'dd-die roll'; B.className = 'dd-die roll';
      for (var t = 0; t < 10; t++) { R.innerHTML = duelDie(1 + Math.floor(Math.random() * 6), true); B.innerHTML = duelDie(1 + Math.floor(Math.random() * 6), false); await sleep(75); }
      R.innerHTML = duelDie(r.view.r, true); B.innerHTML = duelDie(r.view.b, false);
      R.className = 'dd-die' + (r.view.r > r.view.b ? ' top' : ''); B.className = 'dd-die' + (r.view.b > r.view.r ? ' top' : '');
      resultLine(box, r, r.view.r + ' — ' + r.view.b + (r.view.r === r.view.b ? ' · ' + (x.tieBack || 'égalité, mise rendue') : ''));
      g.disabled = false;
    });
  };

  /* v2738 (propriétaire) : ROCK PAPER SCISSORS contre le robot OROLADO — le plus simple du monde.
     Feuille bat pierre, ciseaux bat feuille, pierre bat ciseaux. Gagné ×1,91 · égalité = mise rendue. */
  GAMES.rps = function (box, x) {
    var pick = 0, nm = [x.rock || 'Pierre', x.paper || 'Feuille', x.scissors || 'Ciseaux'];
    var hand = function (i) { return ART.rps ? ART.rps(i) : ''; };
    box.innerHTML = '<div class="cs-stage rps-stage"><div class="rps-row"><div class="rps-side"><span class="rps-h" id="csRpsMe">' + hand(0) + '</span><b>' + esc(x.you || 'Toi') + '</b></div><em class="dd-vs">VS</em>' +
      '<div class="rps-side bot"><span class="rps-h" id="csRpsBot">' + hand(0) + '</span><b>🤖 OROLADO</b></div></div><small class="cs-lbl dd-rule">' + esc(x.rpsRule || 'Gagné ×1,91 · égalité = mise rendue') + '</small></div><div class="cs-res"></div>' +
      stakePanel(x.bet, '<div class="cs-opts rps-pick">' + [0, 1, 2].map(function (i) { return '<button type="button" data-p="' + i + '" class="' + (i ? '' : 'on') + '">' + hand(i) + '<small>' + esc(nm[i]) + '</small></button>'; }).join('') + '</div>');
    bindStake(box);
    box.querySelectorAll('[data-p]').forEach(function (b) { b.addEventListener('click', function () { pick = +b.getAttribute('data-p'); $('csRpsMe').innerHTML = hand(pick); box.querySelectorAll('[data-p]').forEach(function (z) { z.classList.toggle('on', z === b); }); }); });
    $('csGo').addEventListener('click', async function () {
      var g = this; if (g.disabled) return;
      g.disabled = true;
      var me = $('csRpsMe'), bot = $('csRpsBot');
      me.innerHTML = hand(0); bot.innerHTML = hand(0); me.className = 'rps-h shake'; bot.className = 'rps-h shake';
      var r = await play('rps', { pick: pick });
      if (!r) { me.className = 'rps-h'; bot.className = 'rps-h'; me.innerHTML = hand(pick); g.disabled = false; return; }
      await sleep(900);
      me.className = 'rps-h'; bot.className = 'rps-h';
      me.innerHTML = hand(r.view.me); bot.innerHTML = hand(r.view.bot);
      var win = r.mult > 1, tie = r.view.me === r.view.bot;
      me.classList.toggle('top', win); bot.classList.toggle('top', !win && !tie);
      resultLine(box, r, nm[r.view.me] + ' — ' + nm[r.view.bot] + (tie ? ' · ' + (x.tieBack || 'égalité, mise rendue') : ''));
      g.disabled = false;
    });
  };

  /* v2791 (propriétaire) — ORO LOTTO : loterie comme les grands sites (1 à 10 numéros sur 40, 10 boules tirées).
     Le tableau des gains suit le nombre de numéros choisis ; le serveur tire (casino_lib.php, CASINO_LOTTO, marge 6 %). */
  var LOTTO = { 1: [0, 3.76], 2: [0, 1.45, 6.61], 3: [0, 0, 4.25, 29.5], 4: [0, 0, 2.07, 8.03, 78], 5: [0, 0, 0, 5.92, 32.1, 422],
    6: [0, 0, 0, 3.24, 12.3, 90.8, 1000], 7: [0, 0, 0, 2.07, 6.09, 31.4, 309, 1000], 8: [0, 0, 0, 0, 5.56, 22.1, 153, 1000, 1000],
    9: [0, 0, 0, 0, 3.39, 10.9, 58.4, 546, 1000, 1000], 10: [0, 0, 0, 0, 2.35, 6.36, 27.5, 198, 1000, 1000, 1000] };
  GAMES.lotto = function (box, x) {
    var picks = [3, 11, 19, 27, 36], busy = false;
    var dot = ['en', 'zh', 'hi', 'ar'].indexOf((document.documentElement.lang || 'fr').slice(0, 2)) >= 0;
    var mx = function (v) { return '×' + (dot ? String(v) : String(v).replace('.', ',')); };
    box.innerHTML = '<div class="cs-stage lot-stage"><div class="lot-tube" id="csLotTube">' + Array.from({ length: 10 }, function () { return '<i></i>'; }).join('') + '</div>' +
      '<div class="lot-pay" id="csLotPay"></div>' +
      '<div class="lot-grid" id="csLotGrid">' + Array.from({ length: 40 }, function (_, i) { return '<button type="button" data-n="' + (i + 1) + '"><span>' + (i + 1) + '</span></button>'; }).join('') + '</div></div>' +
      stakePanel(x.bet, '<div class="lot-tools"><button type="button" id="csLotRand"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="4"/><circle cx="9" cy="9" r="1.4"/><circle cx="15" cy="15" r="1.4"/><circle cx="15" cy="9" r="1.4"/><circle cx="9" cy="15" r="1.4"/></svg>' + esc(x.lotRand || 'Random') + '</button>' +
        '<b id="csLotN"></b><button type="button" id="csLotClr">' + esc(x.lotClear || 'Clear') + '</button></div>');
    bindStake(box);
    var grid = $('csLotGrid'), tube = $('csLotTube');
    function payRow(hits) {
      var k = picks.length, row = LOTTO[k] || [], h = [];
      for (var i = 0; i < row.length; i++) if (row[i] > 0) h.push(i);
      $('csLotPay').innerHTML = k ? '<small>' + esc(x.lotPay || 'Hits') + '</small>' + h.map(function (i) { return '<span class="' + (hits === i ? 'on' : '') + '"><em>' + i + '</em><b>' + mx(row[i]) + '</b></span>'; }).join('')
        : '<small class="lot-hint">' + esc(x.lotPick || '') + '</small>';
    }
    function paint() {
      grid.querySelectorAll('[data-n]').forEach(function (b) { b.className = picks.indexOf(+b.getAttribute('data-n')) >= 0 ? 'pk' : ''; });
      $('csLotN').textContent = picks.length + ' / 10';
      payRow(-1);
    }
    function clearDraw() { tube.querySelectorAll('i').forEach(function (t) { t.className = ''; t.textContent = ''; }); }
    grid.addEventListener('click', function (e) {
      var b = e.target.closest('[data-n]'); if (!b || busy) return;
      var n = +b.getAttribute('data-n'), i = picks.indexOf(n);
      if (i >= 0) picks.splice(i, 1); else if (picks.length < 10) picks.push(n); else { toast(x.lotPick || ''); return; }
      clearDraw(); paint();
    });
    $('csLotClr').addEventListener('click', function () { if (busy) return; picks = []; clearDraw(); paint(); });
    $('csLotRand').addEventListener('click', function () {
      if (busy) return;
      var k = picks.length || 5, all = []; for (var i = 1; i <= 40; i++) all.push(i);
      for (var j = 39; j > 0; j--) { var r = Math.floor(Math.random() * (j + 1)), t = all[j]; all[j] = all[r]; all[r] = t; }
      picks = all.slice(0, k); clearDraw(); paint();
    });
    paint();
    $('csGo').addEventListener('click', async function () {
      var g = this; if (busy || g.disabled) return;
      if (!picks.length) { toast(x.lotPick || ''); return; }
      busy = true; g.disabled = true; clearDraw(); paint();
      var r = await play('lotto', { picks: picks.slice() });
      if (!r) { busy = false; g.disabled = false; return; }
      var slots = tube.querySelectorAll('i'), lite = document.documentElement.classList.contains('oro-lite');
      for (var i = 0; i < r.view.draw.length; i++) {
        var n = r.view.draw[i], hit = picks.indexOf(n) >= 0, b = grid.querySelector('[data-n="' + n + '"]');
        slots[i].textContent = n; slots[i].className = 'in ' + (hit ? 'hit' : 'miss');
        if (b) b.className = hit ? 'pk hit' : 'dr';
        await sleep(lite ? 90 : 260);
      }
      payRow(r.view.hits);
      resultLine(box, r, fmt(x.lotHits || '{h}/{k}', { h: r.view.hits, k: r.view.k }));
      busy = false; g.disabled = false;
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
  var WHEEL = [[0.5, 600], [1.2, 500], [0, 680], [1.5, 550], [0.5, 600], [2, 325], [0, 680], [1.2, 500], [0.5, 600], [3, 350], [0, 681], [1.2, 500], [0.5, 600], [5, 120], [1.5, 550], [0, 681], [0.5, 600], [1.2, 500], [2, 325], [10, 50], [50, 8]];
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
    var legend = [50, 10, 5, 3, 2, 1.5, 1.2, 0.5, 0].map(function (v) { return '<span style="--c:' + col[v] + '"><b>×' + String(v).replace('.', ',') + '</b></span>'; }).join('');
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

  // v2792 (propriétaire) : Racing n'est plus instantané — c'est un jeu EN DIRECT (DRAW_CFG.race, plus bas)

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

  /* ---------- v2718 (propriétaire) : JEUX EN DIRECT À TIRAGE — Crypto Live, Chevaux Live, Roulette Live ----------
     Le serveur tire à heure fixe (casino_lib.php casino_draw_*) : tout le monde voit le même tirage. L'animation dépend
     seulement de l'heure : arriver en plein tirage montre le bon moment. Un pari par tour ; une fois placé, c'est fini. */
  var LT = {
    fr: { win1: 'Gagnant', pair: 'Couplé', pairHint: 'Choisis 2 chevaux : 1er et 2e, dans n’importe quel ordre', odds: 'Cote', open: 'Mises ouvertes', draw: 'Tirage en cours…', next: 'Prochain tour dans {s} s', placed: 'Pari placé ✓', closed: 'Mises fermées', betOn: 'Parier', pickFirst: 'Choisis d’abord', last: 'Derniers', winner: 'Gagnant : {s}', live: 'LIVE', yours: 'Ton choix : {s}' },
    en: { win1: 'Winner', pair: 'Forecast', pairHint: 'Pick 2 horses: 1st and 2nd, in any order', odds: 'Odds', open: 'Bets open', draw: 'Drawing…', next: 'Next round in {s} s', placed: 'Bet placed ✓', closed: 'Bets closed', betOn: 'Place bet', pickFirst: 'Pick first', last: 'Last', winner: 'Winner: {s}', live: 'LIVE', yours: 'Your pick: {s}' }
  };
  function LX() { var l = (document.documentElement.lang || 'fr').slice(0, 2); return Object.assign({}, LT.en, LT[l] || {}); }
  var CRYPTOS = [['BTC', '#F7931A', '₿'], ['ETH', '#627EEA', 'Ξ'], ['USDT', '#26A17B', '₮'], ['BNB', '#F3BA2F', 'B'], ['SOL', '#9945FF', 'S'], ['XRP', '#2B3440', 'X'], ['DOGE', '#C2A633', 'Ð'], ['TON', '#0098EA', 'T'],
    ['ADA', '#0033AD', 'A'], ['TRX', '#EB0029', 'T'], ['LTC', '#345D9D', 'Ł'], ['DOT', '#E6007A', 'D'], ['AVAX', '#E84142', 'A'], ['SHIB', '#FFA409', 'S'], ['LINK', '#2A5ADA', 'L']];
  // v2749 (propriétaire) : les VRAIS logos des 15 cryptos, dessinés (on reconnaît tout de suite BTC, ETH, USDT…)
  var CRYPTO_ART = [
    '<circle cx="16" cy="16" r="16" fill="#F7931A"/><g transform="rotate(14 16 16)"><path d="M12.2 9.4h5.2c2.1 0 3.6 1.1 3.6 2.9 0 1.3-.8 2.2-1.9 2.5 1.5.3 2.5 1.3 2.5 2.9 0 2.1-1.7 3.3-4 3.3h-5.4zm2.5 2v3.2h2.5c1 0 1.6-.6 1.6-1.6s-.6-1.6-1.6-1.6zm0 5.2v3.4h2.8c1.1 0 1.8-.6 1.8-1.7s-.7-1.7-1.8-1.7z" fill="#fff"/><path d="M14 7.6v2M16.4 7.6v2M14 21v2M16.4 21v2" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/></g>',
    '<circle cx="16" cy="16" r="16" fill="#627EEA"/><path d="M16 5l-6.4 10.8L16 19.5l6.4-3.7z" fill="#fff"/><path d="M16 5v14.5l6.4-3.7z" fill="#C0CBF6"/><path d="M16 20.8l-6.4-3.7L16 27l6.4-9.9z" fill="#fff"/><path d="M16 20.8V27l6.4-9.9z" fill="#C0CBF6"/>',
    '<circle cx="16" cy="16" r="16" fill="#26A17B"/><path d="M9 8.5h14v3.4h-5.2v3c3.4.2 5.9.9 5.9 1.8s-2.5 1.6-5.9 1.8v6.3h-3.6v-6.3c-3.4-.2-5.9-.9-5.9-1.8s2.5-1.6 5.9-1.8v-3H9z" fill="#fff"/><ellipse cx="16" cy="16.7" rx="5.6" ry="1.1" fill="#26A17B"/>',
    '<circle cx="16" cy="16" r="16" fill="#F3BA2F"/><g fill="#fff"><path d="M16 7.5l2.8 2.8-2.8 2.8-2.8-2.8z"/><path d="M16 18.9l2.8 2.8-2.8 2.8-2.8-2.8z"/><path d="M10.3 13.2l2.8 2.8-2.8 2.8-2.8-2.8z"/><path d="M21.7 13.2l2.8 2.8-2.8 2.8-2.8-2.8z"/><path d="M16 13.6l2.4 2.4-2.4 2.4-2.4-2.4z"/></g>',
    '<circle cx="16" cy="16" r="16" fill="#111827"/><defs><linearGradient id="solG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#9945FF"/><stop offset="1" stop-color="#14F195"/></linearGradient></defs><g fill="url(#solG)"><path d="M10.5 10h12.5l-2 2.4H8.5z"/><path d="M8.5 14.8H21l2 2.4H10.5z"/><path d="M10.5 19.6h12.5l-2 2.4H8.5z"/></g>',
    '<circle cx="16" cy="16" r="16" fill="#23292F"/><path d="M9 9h2.6l3.1 3.1c.7.7 1.9.7 2.6 0L20.4 9H23l-4.5 4.4a3.6 3.6 0 0 1-5 0zM9 23h2.6l3.1-3.1c.7-.7 1.9-.7 2.6 0l3.1 3.1H23l-4.5-4.4a3.6 3.6 0 0 0-5 0z" fill="#fff"/>',
    '<circle cx="16" cy="16" r="16" fill="#C2A633"/><path d="M11.5 9.5h4.6c4 0 6.4 2.6 6.4 6.5s-2.4 6.5-6.4 6.5h-4.6zm2.6 2.3v8.4h1.9c2.5 0 3.8-1.6 3.8-4.2s-1.3-4.2-3.8-4.2z" fill="#fff"/><path d="M9.6 15.2h7v1.8h-7z" fill="#fff"/>',
    '<circle cx="16" cy="16" r="16" fill="#0098EA"/><path d="M9.6 10h12.8c.9 0 1.4 1 1 1.7L16 24.4 8.6 11.7c-.4-.7.1-1.7 1-1.7z" fill="none" stroke="#fff" stroke-width="2" stroke-linejoin="round"/><path d="M16 10v14" stroke="#fff" stroke-width="2"/>',
    '<circle cx="16" cy="16" r="16" fill="#0033AD"/><g fill="#fff"><circle cx="16" cy="16" r="2.2"/><circle cx="16" cy="9.2" r="1.4"/><circle cx="16" cy="22.8" r="1.4"/><circle cx="10.1" cy="12.6" r="1.4"/><circle cx="21.9" cy="12.6" r="1.4"/><circle cx="10.1" cy="19.4" r="1.4"/><circle cx="21.9" cy="19.4" r="1.4"/><circle cx="16" cy="5.6" r=".9"/><circle cx="16" cy="26.4" r=".9"/><circle cx="7" cy="10.8" r=".9"/><circle cx="25" cy="10.8" r=".9"/><circle cx="7" cy="21.2" r=".9"/><circle cx="25" cy="21.2" r=".9"/></g>',
    '<circle cx="16" cy="16" r="16" fill="#EB0029"/><path d="M8 8.5l17 3.6-9.4 12.4z" fill="none" stroke="#fff" stroke-width="1.8" stroke-linejoin="round"/><path d="M8 8.5l7.6 16 1.4-8.9 8-3.5M17 15.6L8 8.5" fill="none" stroke="#fff" stroke-width="1.4" stroke-linejoin="round"/>',
    '<circle cx="16" cy="16" r="16" fill="#345D9D"/><path d="M14.2 8h3l-1.7 7 2.6-1-.6 2.3-2.6 1-1.2 4.6h8l-.7 2.6H10.2l1.6-6.2-2.4.9.6-2.2 2.4-.9z" fill="#fff"/>',
    '<circle cx="16" cy="16" r="16" fill="#E6007A"/><g fill="#fff"><ellipse cx="16" cy="7.8" rx="3.6" ry="2.1"/><ellipse cx="16" cy="24.2" rx="3.6" ry="2.1"/><ellipse cx="8.9" cy="11.9" rx="3.6" ry="2.1" transform="rotate(-60 8.9 11.9)"/><ellipse cx="23.1" cy="11.9" rx="3.6" ry="2.1" transform="rotate(60 23.1 11.9)"/><ellipse cx="8.9" cy="20.1" rx="3.6" ry="2.1" transform="rotate(60 8.9 20.1)"/><ellipse cx="23.1" cy="20.1" rx="3.6" ry="2.1" transform="rotate(-60 23.1 20.1)"/></g>',
    '<circle cx="16" cy="16" r="16" fill="#E84142"/><path d="M15 8.3c.4-.8 1.6-.8 2 0l2.1 3.8-6.2 10.8H8.6c-.9 0-1.4-1-1-1.7zM19.6 15.6c.4-.8 1.6-.8 2 0l3.2 5.6c.4.7-.1 1.7-1 1.7h-6.4c-.9 0-1.4-1-1-1.7z" fill="#fff"/>',
    '<circle cx="16" cy="16" r="16" fill="#FFA409"/><path d="M9 8l4.2 4.2h5.6L23 8l.6 8.4c0 4-3.4 7.6-7.6 7.6s-7.6-3.6-7.6-7.6z" fill="#fff"/><circle cx="13.2" cy="16" r="1.4" fill="#B45309"/><circle cx="18.8" cy="16" r="1.4" fill="#B45309"/><path d="M14.6 19.4h2.8L16 21z" fill="#B45309"/>',
    '<circle cx="16" cy="16" r="16" fill="#2A5ADA"/><path d="M16 7l7.8 4.5v9L16 25l-7.8-4.5v-9z" fill="none" stroke="#fff" stroke-width="2.6" stroke-linejoin="round"/>'
  ];
  function cryptoSvg(i) { return '<svg viewBox="0 0 32 32" aria-hidden="true">' + (CRYPTO_ART[i] || CRYPTO_ART[0]) + '</svg>'; }
  function cCoin(i, cls) { var c = CRYPTOS[i] || CRYPTOS[0]; return '<i class="lv-coin lv-logo' + (cls ? ' ' + cls : '') + '" style="--cc:' + c[1] + '">' + cryptoSvg(i) + '</i>'; }
  var HORSE_C = ['#EF4444', '#3B82F6', '#22C55E', '#F59E0B', '#A855F7', '#EC4899', '#14B8A6', '#F97316', '#FACC15', '#E5E7EB'];
  // v2749 (propriétaire) : chaque cheval a SA robe (blanc, noir, marron, gris…) + jockey de couleur avec son numéro
  var COATS = [['#F8FAFC', '#CBD5E1', 'Blanc'], ['#1F2937', '#0B0F19', 'Noir'], ['#8B5A2B', '#5B3A1E', 'Marron'], ['#9CA3AF', '#6B7280', 'Gris'], ['#C2410C', '#7C2D12', 'Alezan'],
    ['#E9C46A', '#B7791F', 'Doré'], ['#4A2C16', '#2A170A', 'Bai foncé'], ['#E5E7EB', '#A8A29E', 'Gris clair'], ['#A16207', '#713F12', 'Bai'], ['#F5E1C8', '#C8A97E', 'Crème']];
  function silk(i) { var c = COATS[i] || COATS[0]; return '<i class="lv-silk" style="--hc:' + HORSE_C[i] + ';--coat:' + c[0] + '">' + (i + 1) + '</i>'; }
  function horseSvg(i) {
    var c = COATS[i] || COATS[0], body = c[0], dark = c[1], j = HORSE_C[i];
    return '<svg viewBox="0 0 64 42" aria-hidden="true">' +
      '<path d="M15 19C8 18 4 22 2 30c3-2 6-4 9-4" fill="' + dark + '"/>' +
      '<g class="lg-b" stroke="' + dark + '" stroke-width="3.4" stroke-linecap="round"><path d="M20 26l-6 12"/><path d="M41 25l7 11"/></g>' +
      '<g class="lg-f" stroke="' + dark + '" stroke-width="3.4" stroke-linecap="round"><path d="M25 27l3 12"/><path d="M37 26l1 12"/></g>' +
      '<path d="M14 20c0-5 6-8 16-8s14 3 15 7c1 6-4 10-15 10S14 26 14 20z" fill="' + body + '" stroke="' + dark + '" stroke-width="1"/>' +
      '<path d="M40 15c2-4 5-8 9-11l6 3c1 1 1 3 0 4l-3 3c-1 1-1 2-2 4l-4 4z" fill="' + body + '" stroke="' + dark + '" stroke-width="1"/>' +
      '<path d="M46 5c-3 2-6 6-7 10" stroke="' + dark + '" stroke-width="2.6" fill="none" stroke-linecap="round"/><circle cx="52.5" cy="7.5" r="1" fill="#111"/>' +
      '<path d="M26 16h9l-1.5-6.5h-6z" fill="' + j + '" stroke="#fff" stroke-width=".7"/><circle cx="30.5" cy="6.4" r="3.4" fill="' + j + '" stroke="#fff" stroke-width=".8"/>' +
      '<rect x="22" y="15.6" width="17" height="6.4" rx="2" fill="#fff" stroke="' + j + '" stroke-width="1.2"/>' +
      '<text x="30.5" y="21" text-anchor="middle" font-size="5.6" font-weight="900" font-family="system-ui" fill="#111">' + (i + 1) + '</text></svg>';
  }
  function rlChip(n) { return '<i class="lv-rn ' + (n === 0 ? 'z' : RL_RED.indexOf(n) >= 0 ? 'r' : 'k') + '">' + n + '</i>'; }
  // pseudo-hasard fixe par tour (même animation pour tout le monde)
  function seeded(a, b) { var x = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453; return x - Math.floor(x); }
  function easeOut(k) { return 1 - Math.pow(1 - Math.max(0, Math.min(1, k)), 3); }


  /* v2792 (propriétaire) — COTES des courses (Racing en direct, Horse Race) : le serveur les donne AVANT la fermeture des mises */
  var CAR_C = ['#EF4444', '#3B82F6', '#22C55E', '#F59E0B', '#A855F7', '#EC4899', '#14B8A6', '#F97316', '#FACC15', '#E5E7EB'];
  function oddTxt(v) { if (!v) return '—'; var t = Number(v).toFixed(2).replace(/0$/, '').replace(/\.0$/, ''); return '×' + (dec() === ',' ? t.replace('.', ',') : t); }
  function carChip(i) { return '<i class="lv-carno" style="--cc:' + CAR_C[i] + '">' + (i + 1) + '</i>'; }
  function runnerPaint(st, R, t, pre, D) {
    var tr = st.box.querySelector('.lv-track'); if (!tr) return;
    if (!st.w || st.w < 60 || (st.wAt || 0) < Date.now() - 2000) { st.w = Math.max(0, tr.clientWidth - (pre === 'lvC' ? 70 : 58)); st.wAt = Date.now(); }
    var res = R.res, e = res ? t - R.close : 0, k = Math.max(0, Math.min(1, e / D));
    for (var h = 0; h < 10; h++) {
      var p = 0;
      if (res) {
        var rank = res.order.indexOf(h), fin = 1 - rank * 0.028;
        // course lente et fluide : les coureurs se doublent, l'arrivée suit l'ordre du serveur
        var wob = (seeded(R.i, h) - 0.5) * 0.16 * Math.sin(Math.PI * k) + (seeded(R.i + 7, h) - 0.5) * 0.07 * Math.sin(Math.PI * 3 * k);
        p = Math.max(0, fin * (0.5 * k + 0.5 * k * k) + wob * (1 - k * k));
        if (e >= D) p = fin;
      }
      var el = $(pre + h); if (el) { el.style.transform = 'translateX(' + Math.round(p * st.w) + 'px)'; el.classList.toggle('run', !!res && e < D); el.classList.toggle('win', !!res && e >= D && res.order[0] === h); }
    }
  }
  function oddsPaint(box, R) {
    var o = (R && R.odds) || [];
    box.querySelectorAll('[data-o]').forEach(function (b) { b.textContent = oddTxt(o[+b.getAttribute('data-o')]); });
  }

  var DRAW_CFG = {
    cryptox: { reveal: 8, mult: '×14,4',
      stage: function () { return '<div class="lv-reel"><div class="lv-reel-win" id="lvReel">' + cCoin(0, 'big') + '</div><b class="lv-reel-t" id="lvReelT">BTC</b></div>'; },
      picks: function () { return '<div class="lv-grid g5">' + CRYPTOS.map(function (c, i) { return '<button type="button" data-s="' + i + '">' + cCoin(i) + '<small>' + c[0] + '</small></button>'; }).join('') + '</div>'; },
      label: function (s) { return (CRYPTOS[+s] || CRYPTOS[0])[0]; },
      lastChip: function (v) { return cCoin(v, 'mini'); },
      winName: function (res) { return CRYPTOS[res.n][0]; },
      paint: function (st, R, t) {
        var reel = $('lvReel'), lab = $('lvReelT'); if (!reel) return;
        var show = R.res, e = t - R.close, idx;
        if (!show) { idx = Math.floor(t * 2.2) % 15; reel.className = 'lv-reel-win idle'; }
        else {
          var S0 = 46, k = easeOut(e / 8), steps = Math.floor(S0 * k);
          idx = ((show.n - S0 + steps) % 15 + 15) % 15;
          reel.className = 'lv-reel-win' + (e >= 8 ? ' won' : ' spin');
        }
        if (st.lastIdx !== idx) { st.lastIdx = idx; reel.innerHTML = cCoin(idx, 'big'); lab.textContent = CRYPTOS[idx][0]; }
      } },
    horses: { reveal: 22,
      stage: function () { var l = ''; for (var i = 0; i < 10; i++) l += '<div class="lv-lane"><span class="lv-no">' + (i + 1) + '</span><span class="lv-horse" id="lvH' + i + '">' + horseSvg(i) + '</span></div>'; return '<div class="lv-track"><i class="lv-finish"></i>' + l + '</div>'; },
      // v2792 (propriétaire) : « Gagnant » (1 cheval, sa cote) ou « Couplé » (2 chevaux = les 2 premiers, n'importe quel ordre)
      picks: function () {
        var lx = LX(), b = ''; for (var i = 0; i < 10; i++) b += '<button type="button" data-h="' + i + '">' + silk(i) + '<small data-o="' + i + '">—</small></button>';
        return '<div class="cs-seg hr-mode"><button type="button" data-m="w" class="on">' + esc(lx.win1) + '</button><button type="button" data-m="c">' + esc(lx.pair) + '</button></div>' +
          '<div class="lv-grid g5 lv-odds" id="hrGrid">' + b + '</div><small class="hr-hint" id="hrHint" hidden>' + esc(lx.pairHint) + '</small>';
      },
      bind: function (box, setSel, locked) {
        var mode = 'w', two = [];
        var paint = function () {
          box.querySelectorAll('.hr-mode [data-m]').forEach(function (z) { z.classList.toggle('on', z.getAttribute('data-m') === mode); });
          box.querySelectorAll('[data-h]').forEach(function (z) { var h = +z.getAttribute('data-h'); z.classList.toggle('on', two.indexOf(h) >= 0); });
          var hint = $('hrHint'); if (hint) hint.hidden = mode !== 'c' || two.length === 2;
          box.classList.toggle('hr-pair', mode === 'c');
        };
        var emit = function () {
          if (mode === 'w') setSel(two.length ? 'w' + two[0] : null);
          else if (two.length === 2) { var a = Math.min(two[0], two[1]), b = Math.max(two[0], two[1]); setSel('c' + a + '-' + b); }
          else setSel(null);
          paint();
        };
        box.querySelectorAll('.hr-mode [data-m]').forEach(function (z) { z.addEventListener('click', function () { if (locked()) return; mode = z.getAttribute('data-m'); two = two.slice(0, mode === 'w' ? 1 : 2); emit(); }); });
        box.querySelectorAll('[data-h]').forEach(function (z) {
          z.addEventListener('click', function () {
            if (locked()) return;
            var h = +z.getAttribute('data-h'), i = two.indexOf(h);
            if (mode === 'w') two = [h];
            else if (i >= 0) two.splice(i, 1);
            else { two.push(h); if (two.length > 2) two.shift(); }
            emit();
          });
        });
        paint();
      },
      mark: function () { /* dessiné par bind() */ },
      onRound: function (st, R) { oddsPaint(st.box, R); },
      multOf: function (sel, R) {
        if (!R) return '';
        var m = /^w(\d)$/.exec(sel); if (m) return oddTxt(R.odds && R.odds[+m[1]]);
        m = /^c(\d)-(\d)$/.exec(sel); if (m) return oddTxt(R.pair && R.pair[m[1] + '-' + m[2]]);
        return '';
      },
      label: function (s) {
        var m = /^c(\d)-(\d)$/.exec(String(s)); if (m) return (+m[1] + 1) + ' + ' + (+m[2] + 1);
        var h = +String(s).replace('w', ''); return 'N° ' + (h + 1) + ' · ' + COATS[h][2];
      },
      lastChip: function (v) { return silk(v); },
      winName: function (res) { return 'N° ' + (res.order[0] + 1) + ' (' + COATS[res.order[0]][2] + ') · 2e N° ' + (res.order[1] + 1); },
      paint: function (st, R, t) { runnerPaint(st, R, t, 'lvH', 22); } },
    race: { reveal: 22,
      stage: function () { var l = ''; for (var i = 0; i < 10; i++) l += '<div class="lv-lane"><span class="lv-no">' + (i + 1) + '</span><span class="lv-car" id="lvC' + i + '">' + ART.car(CAR_C[i], i + 1) + '</span></div>'; return '<div class="lv-track lv-road"><i class="lv-finish"></i>' + l + '</div>'; },
      picks: function () { var b = ''; for (var i = 0; i < 10; i++) b += '<button type="button" data-s="' + i + '">' + carChip(i) + '<small data-o="' + i + '">—</small></button>'; return '<div class="lv-grid g5 lv-odds">' + b + '</div>'; },
      onRound: function (st, R) { oddsPaint(st.box, R); },
      multOf: function (sel, R) { return oddTxt(R && R.odds && R.odds[+sel]); },
      label: function (s) { return 'N° ' + (+s + 1); },
      lastChip: function (v) { return carChip(v); },
      winName: function (res) { return 'N° ' + (res.order[0] + 1); },
      paint: function (st, R, t) { runnerPaint(st, R, t, 'lvC', 22); } },
    roulette: { reveal: 8, mult: '',
      stage: function () { return '<div class="rl-big"><div class="rl-wheel" id="csRlW">' + rouletteSvg() + '</div><div class="rl-orbit" id="csRlO"><i class="rl-pearl"></i></div><div class="rl-ball" id="csRl">?</div></div>'; },
      picks: function (x) {
        var opts = [['red', x.red, '×2'], ['black', x.black, '×2'], ['even', x.even, '×2'], ['odd', x.odd, '×2'], ['d1', '1-12', '×3'], ['d2', '13-24', '×3'], ['d3', '25-36', '×3']];
        return '<div class="cs-opts rl-opts">' + opts.map(function (o) { return '<button type="button" data-s="' + o[0] + '" class="b-' + o[0] + '">' + esc(o[1]) + '<small>' + o[2] + '</small></button>'; }).join('') +
          '<label class="rl-num"><input id="csRlNum" inputmode="numeric" maxlength="2" placeholder="0-36"><small>×36</small></label></div>';
      },
      label: function (s, x) { var m = { red: x.red, black: x.black, even: x.even, odd: x.odd, d1: '1-12', d2: '13-24', d3: '25-36' }; return m[s] || ('N° ' + String(s).slice(1)); },
      lastChip: function (v) { return rlChip(v); },
      winName: function (res) { return String(res.n); },
      paint: function (st, R, t) {
        var w = $('csRlW'), orb = $('csRlO'), ball = $('csRl'); if (!w) return;
        var res = R.res, e = res ? t - R.close : 0;
        if (!res) { w.style.transform = 'rotate(' + ((t * 12) % 360) + 'deg)'; orb.style.transform = 'rotate(0deg)'; ball.className = 'rl-ball'; ball.textContent = '?'; return; }
        var k = easeOut(e / 8), wr = (R.close * 12) % 360 + 1080 * k;
        var idx = RL_ORDER.indexOf(res.n), target = idx * 360 / 37 + (R.close * 12) % 360 + 1080;
        w.style.transform = 'rotate(' + wr + 'deg)';
        orb.style.transform = 'rotate(' + (target - 1440 * (1 - k)) + 'deg)';
        if (e < 8) { ball.className = 'rl-ball spin'; ball.textContent = Math.floor(seeded(R.i, Math.floor(e * 8)) * 37); }
        else { ball.className = 'rl-ball ' + (res.n === 0 ? 'z' : RL_RED.indexOf(res.n) >= 0 ? 'r' : 'k'); ball.textContent = res.n; }
      } }
  };

  function makeDraw(game) {
    return function (box, x) {
      var cfg = DRAW_CFG[game], lx = LX();
      box.innerHTML = '<div class="cs-stage lv-stage lv-' + game + (game === 'roulette' ? ' rl-stage' : '') + '"><div class="lv-head"><span class="lv-live lv-pill"><i></i>LIVE</span><b id="lvPhase" class="fit"></b><em id="lvTime" class="fit"></em></div>' +
        '<i class="lv-bar"><b id="lvBar"></b></i><div class="lv-scene">' + cfg.stage() + '</div><div class="lv-last" id="lvLast"></div></div><div class="cs-res"></div>' +
        (guest() ? '<div id="csNeed"></div>' : stakePanel(lx.betOn, cfg.picks(x)));
      if (guest()) { needAccount($('csNeed'), x); }
      var st = { box: box }, R = null, me = null, off = 0, sel = null, first = true, shown = null, lastKey = '';
      var nowS = function () { return Date.now() / 1000 + off; };
      if (!guest()) {
        bindStake(box);
        var mark = function () { if (cfg.mark) { cfg.mark(box, sel); return; } box.querySelectorAll('[data-s]').forEach(function (z) { z.classList.toggle('on', z.getAttribute('data-s') === sel); }); };
        var locked = function () { return !!(me && !me.done && R && me.rid === R.i); };
        if (cfg.bind) cfg.bind(box, function (v) { sel = v; mark(); }, locked); // v2792 : choix sur mesure (chevaux : gagnant / couplé)
        else box.querySelectorAll('[data-s]').forEach(function (b) { b.addEventListener('click', function () { if (locked()) return; sel = b.getAttribute('data-s'); if ($('csRlNum')) $('csRlNum').value = ''; mark(); }); });
        if ($('csRlNum')) $('csRlNum').addEventListener('input', function () { var v = parseInt(this.value, 10); if (v >= 0 && v <= 36) { sel = 'n' + v; mark(); } });
        $('csGo').addEventListener('click', async function () {
          if (S.busy || !R) return;
          if (sel == null) { toast(lx.pickFirst); return; }
          S.busy = true; this.disabled = true;
          var r = await multi(game, 'bet', { sel: sel });
          S.busy = false;
          if (r) { me = r; if (r.round) R = r.round; }
        });
      }
      var showMine = function () {
        if (!me || !me.done || !me.ref || shown === me.ref || !R) return;
        // le résultat s'affiche quand l'animation du tirage est finie (pas avant)
        if (me.rid === R.i && nowS() < R.close + cfg.reveal) return;
        shown = me.ref;
        resultLine(box, me, fmt(lx.winner, { s: me.res ? cfg.winName(me.res) : '' }));
      };
      var sync = async function () {
        if (!box.isConnected || S.game !== game) return;
        var r = null;
        try { var rq = await fetch('casino-tour.php?g=' + game, { cache: 'no-store' }); r = await rq.json(); } catch (e) { r = null; }
        if (!r || !r.ok) { r = await multi(game, 'dround', null, true); if (r) r.mine = 1; }
        if (!box.isConnected || S.game !== game) return;
        S.timer = setTimeout(sync, 1000);
        if (!r || !r.round) return;
        off = r.now - Date.now() / 1000; R = r.round;
        var mine = r.mine ? r : null, open0 = me && !me.done;
        if (!guest() && !mine && (first || (open0 && R.res && R.i >= (me.rid || 0)))) {
          mine = await multi(game, 'dround', null, true);
          if (!box.isConnected || S.game !== game) return;
        }
        if (mine && mine.round) { me = mine.has ? mine : null; if (first) { first = false; if (me && me.done) shown = me.ref; } }
        var lk = (R.last || []).join(',');
        if (lk !== lastKey) { lastKey = lk; $('lvLast').innerHTML = '<small>' + esc(lx.last) + '</small>' + (R.last || []).map(function (v) { return cfg.lastChip(v); }).join(''); }
      };
      var tick = function () {
        if (!box.isConnected || S.game !== game) return;
        if (R) {
          var t = nowS(), bet = t < R.close, left;
          if (bet) { left = Math.max(0, Math.ceil(R.close - t)); setText($('lvPhase'), lx.open); setText($('lvTime'), left + '\u00a0s'); $('lvBar').style.transform = 'scaleX(' + Math.max(0, Math.min(1, (R.close - t) / R.B)) + ')'; }
          else { left = Math.max(0, Math.ceil(R.end - t)); setText($('lvPhase'), t < R.close + cfg.reveal ? lx.draw : fmt(lx.winner, { s: R.res ? cfg.winName(R.res) : '…' })); setText($('lvTime'), fmt(lx.next, { s: left }).replace(/ s$/, '\u00a0s')); $('lvBar').style.transform = 'scaleX(0)'; }
          if (!bet && !R.res) { /* le résultat arrive à la prochaine lecture */ }
          if (cfg.onRound && (st.ri !== R.i || st.oddsKey !== String(R.odds))) { st.ri = R.i; st.oddsKey = String(R.odds); cfg.onRound(st, R); }
          cfg.paint(st, R, t);
          var b = $('csGo');
          if (b) {
            var mineNow = me && me.rid === R.i;
            if (mineNow) { setText(b, lx.placed + ' · ' + cfg.label(me.sel, x)); b.disabled = true; b.classList.add('placed'); }
            else if (!bet) { setText(b, lx.closed); b.disabled = true; b.classList.remove('placed'); }
            else { var mm = sel == null ? '' : (cfg.multOf ? cfg.multOf(sel, R) : cfg.mult); setText(b, lx.betOn + (mm ? ' · ' + mm : '')); b.disabled = S.busy; b.classList.remove('placed'); }
          }
          showMine();
        }
        S.raf = requestAnimationFrame(tick);
      };
      sync(); tick();
    };
  }
  GAMES.cryptox = makeDraw('cryptox');
  GAMES.horses = makeDraw('horses');
  GAMES.race = makeDraw('race');
  GAMES.roulette = makeDraw('roulette');

  var SLOT_PAY = [['gem', '×50'], ['seven', '×20'], ['bell', '×10'], ['lemon', '×5'], ['cherry', '×3'], ['cherry2', '×1,5']];
  GAMES.slots = function (box, x) {
    // v2726 (propriétaire) : tableau clair — on VOIT les 3 symboles (ou 2 cerises) puis le gain : « 🔔🔔🔔 = ×10 »
    var pay = SLOT_PAY.map(function (p) { var two = p[0] === 'cherry2', k = two ? 'cherry' : p[0], n = two ? 2 : 3, sy = ''; for (var i = 0; i < n; i++) sy += '<em>' + ART.sym(k) + '</em>'; return '<span class="pay3"><i>' + sy + '</i><u>=</u><b>' + p[1] + '</b></span>'; }).join('');
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
    var reset = function () { pb.style.opacity = '1'; pb.style.transition = 'none'; kp.style.transition = 'none'; pb.style.transform = 'none'; kp.style.transform = 'none'; pb.offsetHeight; pb.style.transition = ''; kp.style.transition = ''; };
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
    // v2730 (propriétaire) : le ballon PART TOUT DE SUITE au toucher (plus d'attente du serveur) ; le gardien plonge dès la réponse ;
    // ensuite le ballon revient en douceur (fondu) au point de penalty, sans à-coup.
    var softReset = function () {
      pb.style.transition = 'opacity .14s'; pb.style.opacity = '0';
      kp.style.transition = 'transform .3s ease'; kp.style.transform = 'none';
      setTimeout(function () {
        pb.style.transition = 'none'; pb.style.transform = 'none';
        requestAnimationFrame(function () { requestAnimationFrame(function () { pb.style.transition = 'opacity .2s'; pb.style.opacity = '1'; }); });
      }, 160);
    };
    var shoot = async function (col, hgt) {
      if (!g || g.done || busy) return;
      busy = true;
      var w = st.clientWidth, H = st.clientHeight;
      var tx = (col - 1) * 0.2333 * w, ty = -(H * 0.86 - H * (0.205 + (hgt + 0.5) * 0.0967) - H * 0.04);
      pb.style.opacity = '1';
      pb.style.transition = 'transform .5s cubic-bezier(.2,.7,.3,1)';
      pb.style.transform = 'translate(' + tx + 'px,' + ty + 'px) scale(.42) rotate(540deg)';
      var t0 = Date.now();
      var r = await multi('penalty', 'shoot', { aim: col, h: hgt });
      if (!r) { softReset(); busy = false; return; }
      var last = (r.shots || [])[r.shots.length - 1] || [col, hgt, 1, 1], goal = !!last[3], keeperCol = last[2];
      kp.style.transition = 'transform .32s cubic-bezier(.2,.8,.3,1)';
      kp.style.transform = 'translateX(' + ((keeperCol - 1) * w * 0.22) + 'px) rotate(' + ((keeperCol - 1) * 58) + 'deg)';
      await sleep(Math.max(0, 500 - (Date.now() - t0)));
      if (!goal) { pb.style.transition = 'transform .38s ease-in'; pb.style.transform = 'translate(' + (tx * 1.1) + 'px,' + (ty + H * 0.22) + 'px) scale(.46) rotate(620deg)'; await sleep(380); }
      else { st.classList.add('net-hit'); setTimeout(function () { st.classList.remove('net-hit'); }, 450); await sleep(220); }
      busy = false;
      paint(r);
      if (r.done) resultLine(box, r, r.win > 0 ? '×' + m2(r.mult || (r.win / r.stake)) : x.saved);
      else setTimeout(function () { if (g && !g.done && !busy) softReset(); }, 420);
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
      stakePanel(x.bet, '<div class="cs-opts three"><button type="button" data-b="green" class="on b-green">' + esc(x.green) + '<small>×1,97</small></button><button type="button" data-b="violet" class="b-violet">' + esc(x.violet) + '<small>×4,7</small></button><button type="button" data-b="red" class="b-red">' + esc(x.red) + '<small>×1,97</small></button></div><div class="cs-nums">' + nums + '</div><small class="cs-lbl">' + esc(x.number) + ' ×9,4</small>');
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
    $('csSign2').addEventListener('click', function () { toAuth('register'); });
    return true;
  }

  /* --- 3 jeux « ça monte » (même calcul serveur, décor différent) : le personnage du jeu = celui du logo --- */
  var CRASH_THEME = {
    crash: { col: '#ff2d55', cls: 'th-plane', w: 78, h: 78 },
    jet: { col: '#a855f7', cls: 'th-jet', w: 70, h: 70 },
    rocket: { col: '#22d3ee', cls: 'th-rocket', w: 70, h: 70 }
  };
  function histChip(v) { return '<i class="' + (v < 2 ? 'lo' : v < 10 ? 'mid' : 'hi') + '">' + v.toFixed(2) + '×</i>'; }
  /* v2701 (propriétaire, comme Aviator) — TOUR COMMUN : tout le monde voit le même vol. Le serveur tient le tour
     (casino_lib.php casino_round_*) : ~7 s pour miser (barre de décompte), puis le vol, puis l'explosion pour tous. */
  function makeCrash(game) {
    return function (box, x) {
      var th = CRASH_THEME[game];
      var tx = function (k) { return x[k] || T.en[k] || ''; };
      var MULT = function (s) { return Math.max(1, Math.floor(Math.exp(0.08 * Math.max(0, s)) * 100) / 100); };
      var stars = ''; for (var i = 0; i < 26; i++) stars += '<circle cx="' + ((i * 137 + 31) % 300) + '" cy="' + ((i * 71 + i * i * 13 + 7) % 165) + '" r="' + (i % 3 ? 0.8 : 1.3) + '" fill="#fff" opacity="' + (0.25 + (i % 4) * 0.12) + '"/>';
      box.innerHTML = '<div class="cs-stage crash-stage ' + th.cls + '"><i class="crash-rays"></i>' +
        '<svg viewBox="0 0 300 170" preserveAspectRatio="none" class="crash-sky"><defs><linearGradient id="csAreaG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + th.col + '" stop-opacity=".55"/><stop offset="1" stop-color="' + th.col + '" stop-opacity="0"/></linearGradient></defs>' +
        stars + '<g stroke="rgba(255,255,255,.07)">' + [34, 68, 102, 136].map(function (y) { return '<path d="M0 ' + y + 'H300"/>'; }).join('') + '</g>' +
        '<path id="csArea" d="M10 160" fill="url(#csAreaG)"/><path id="csTrail" d="M10 160" fill="none" stroke="' + th.col + '" stroke-width="3.6" stroke-linecap="round"/></svg>' +
        '<span class="plane" id="csPlane" style="width:' + th.w + 'px;height:' + th.h + 'px">' + ART.obj(game) + '</span><b class="crash-n" id="csCm">1.00×</b>' +
        '<div class="crash-wait" id="csWait" hidden><small id="csWaitT"></small><i><b id="csWaitBar"></b></i></div></div><div class="cs-res"></div>' +
        (guest() ? '<div id="csNeed"></div>' : stakePanel(x.bet));
      var stage = box.querySelector('.crash-stage'), plane = $('csPlane');
      var draw = function (m, s) {
        $('csCm').textContent = m.toFixed(2) + '×';
        var px = Math.min(262, 10 + s * 18), py = Math.max(22, 160 - (m - 1) * 40);
        var st = $('csTrail').ownerSVGElement.getBoundingClientRect(), kx = st.width / 300, ky = st.height / 170;
        var d = s > 0 ? 'M10 160 Q ' + ((10 + px) / 2) + ' 160 ' + px + ' ' + py : 'M10 160';
        $('csTrail').setAttribute('d', d); $('csArea').setAttribute('d', s > 0 ? d + ' L' + px + ' 170 L10 170 Z' : 'M10 160');
        // l'avion reste toujours entier dans l'écran ; avant le départ il attend au milieu à gauche
        var X0 = Math.max(22, Math.min(st.width - th.w - 10, px * kx - th.w * 0.22)), Y0 = Math.max(34, Math.min(st.height - th.h - 10, py * ky - th.h * 0.72));
        if (s <= 0) { X0 = Math.max(22, st.width * 0.1); Y0 = Math.max(40, st.height * 0.5 - th.h * 0.5); }
        plane.style.transform = 'translate(' + X0 + 'px,' + Y0 + 'px)';
      };
      draw(1, 0);
      // v2762 (propriétaire) : le VISITEUR voit le vrai vol en direct (il ne peut pas miser : inscription d'abord)
      var watch = guest();
      if (watch) needAccount($('csNeed'), x); else bindStake(box);
      var btn = watch ? null : $('csGo'), R = null, me = null, off = 0, shown = null, first = true;
      var nowS = function () { return Date.now() / 1000 + off; };
      var showMine = function (r) {
        if (!r || !r.done || !r.ref || shown === r.ref) return;
        shown = r.ref;
        var msg = r.out > 0 ? (r.out <= 1.0001 && r.t0 > (r.now || nowS()) - 0.5 ? tx('cancel') : fmt(x.cashed, { x: Number(r.out).toFixed(2), w: m2(r.win) })) : fmt(x.boom, { x: Number(r.c || 1).toFixed(2) });
        resultLine(box, r, msg);
      };
      var sync = async function () {
        if (!box.isConnected || S.game !== game) return; // jeu fermé : on arrête
        // v2712 : l'état PUBLIC du tour vient de casino-tour.php (très léger, sans compte) ; api.php n'est appelé
        // qu'à l'ouverture et quand MA mise attend son résultat (explosion / tour suivant).
        var r = null;
        try { var rq = await fetch('casino-tour.php?g=' + game, { cache: 'no-store' }); r = await rq.json(); } catch (e) { r = null; }
        if ((!r || !r.ok) && !watch) { try { r = await multi(game, 'round', null, true); if (r) r.mine = 1; } catch (e) { r = null; } } // secours
        if (!box.isConnected || S.game !== game) return;
        S.timer = setTimeout(sync, 1000); // toujours relancé (même après une coupure réseau)
        if (r && r.round && r.round.i) {
          var open0 = me && !me.done;
          // nouveau tour (mise) : on efface le résultat du tour d'avant, sauf si j'ai un pari en cours
          if (R && r.round.i !== R.i && r.round.phase === 'bet' && !open0) { var rs = box.querySelector('.cs-res'); if (rs) { rs.className = 'cs-res'; rs.innerHTML = ''; } }
          off = r.now - Date.now() / 1000; R = r.round;
          var mine = r.mine ? r : null;
          if (!watch && !mine && (first || (open0 && (R.i > (me.rid || 0) || (R.c != null && R.i >= (me.rid || 0)))))) {
            try { mine = await multi(game, 'round', null, true); } catch (e) { mine = null; }
            if (!box.isConnected || S.game !== game) return;
          }
          if (mine && mine.round) {
            me = mine.has ? mine : null;
            if (first) { first = false; if (me && me.done) shown = me.ref; } // ancienne partie déjà vue : on ne la remontre pas
            showMine(me);
          }
        }
        if (R && nowS() >= R.t0 && R.c == null) { clearTimeout(S.timer); S.timer = setTimeout(sync, 450); } // en vol : plus souvent
      };
      var tick = function () {
        if (!box.isConnected || S.game !== game) return;
        if (R) {
          var t = nowS(), s = t - R.t0, w = $('csWait');
          if (t < R.t0) { // on mise : barre de décompte
            stage.classList.remove('flying'); plane.classList.remove('gone'); $('csCm').className = 'crash-n'; draw(1, 0);
            w.hidden = false; $('csWaitT').textContent = fmt(tx('takeoff'), { s: Math.ceil(R.t0 - t) }); $('csWaitBar').style.transform = 'scaleX(' + Math.max(0, Math.min(1, (R.t0 - t) / (R.bet || 7))) + ')';
          } else if (R.c != null) { // explosé pour tout le monde
            w.hidden = true; stage.classList.remove('flying'); plane.classList.add('gone');
            $('csCm').className = 'crash-n l'; $('csCm').textContent = Number(R.c).toFixed(2) + '×';
          } else { // en vol
            w.hidden = true; stage.classList.add('flying'); plane.classList.remove('gone'); $('csCm').className = 'crash-n'; draw(MULT(s), s);
          }
          var open = me && !me.done, inFlight = t >= R.t0 && R.c == null;
          if (!btn) { /* visiteur : il regarde seulement */ }
          else if (open && me.rid === R.i && inFlight) { btn.textContent = x.cashout + ' ' + m2(me.stake * MULT(s)) + ' $'; btn.classList.add('cash'); btn.disabled = false; }
          else if (open) { btn.textContent = tx('placed'); btn.classList.remove('cash'); btn.disabled = true; }
          else { btn.textContent = inFlight ? tx('betNext') : x.bet; btn.classList.remove('cash'); btn.disabled = false; }
        }
        S.raf = requestAnimationFrame(tick);
      };
      if (btn) btn.addEventListener('click', async function () {
        if (S.busy) return;
        S.busy = true; btn.disabled = true;
        if (me && !me.done) { var c = await multi(game, 'cash'); if (c) { me = c; showMine(c); } }
        else {
          var r = await multi(game, 'start', {});
          if (r) { me = r; box.querySelector('.cs-res').className = 'cs-res'; box.querySelector('.cs-res').innerHTML = ''; if (r.done) showMine(r); }
        }
        S.busy = false; btn.disabled = false;
      });
      sync(); tick();
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
    var mult = function (k) { return k < 1 ? 0 : Math.floor(0.94 / Math.pow((5 - lv) / 5, k) * 100) / 100; };
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
          if (k < r.k && r.picks[k] === c) { b.className = 'good'; b.innerHTML = ART.obj('apple'); }
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
    // v2726 (propriétaire) : on voit ce que rapporte chaque case trouvée (même calcul que le serveur)
    var mm = function (m, k) { var v = 0.94; for (var j = 0; j < k; j++) v *= (25 - j) / (25 - m - j); return Math.floor(v * 100) / 100; };
    var ladder = function (k0) { var s = ''; for (var k = k0 + 1; k <= k0 + 5 && k <= 25 - mines; k++) s += '<span class="' + (k === k0 + 1 ? 'nx' : '') + '"><small>' + k + '</small>×' + mm(mines, k).toFixed(2) + '</span>'; $('csMnL').innerHTML = s; };
    box.querySelector('.mn-info').insertAdjacentHTML('afterend', '<div class="mn-lad" id="csMnL"></div>');
    ladder(0);
    box.querySelectorAll('.cs-seg [data-m]').forEach(function (b) { b.addEventListener('click', function () { if (g && !g.done) return; mines = +b.getAttribute('data-m'); $('csMnN').textContent = mines; box.querySelectorAll('.cs-seg [data-m]').forEach(function (z) { z.classList.toggle('on', z === b); }); ladder(0); }); });
    var paint = function (r) {
      g = r;
      box.querySelectorAll('#csMn button').forEach(function (b) {
        var c = +b.getAttribute('data-c'); b.className = ''; b.innerHTML = '';
        if (r.open && r.open.indexOf(c) >= 0) { b.className = 'ok'; b.innerHTML = ART.sym('gem'); }
        if (r.done && r.mines && r.mines.indexOf(c) >= 0) { b.className = c === r.boom ? 'boom' : 'mine'; b.innerHTML = ART.sym('bomb'); }
      });
      if (r.done) { resultLine(box, r, r.mult ? '×' + r.mult : ''); btn.textContent = x.bet; btn.classList.remove('cash'); $('csMnInfo').textContent = ''; mines = r.m || mines; ladder(0); }
      else {
        mines = r.m || mines; ladder(r.open.length);
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
      stakePanel(x.bet, '<div class="cs-opts three"><button type="button" data-b="player" class="on b-player">' + esc(x.player) + '<small>×2</small></button><button type="button" data-b="tie" class="b-tie">' + esc(x.tie) + '<small>×9</small></button><button type="button" data-b="banker" class="b-banker">' + esc(x.banker) + '<small>×1,95</small></button></div>');
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
  /* v2725 (propriétaire) : SIC BO simple — un GOBELET doré (opaque) descend sur les 3 dés, secoue, puis se relève :
     on ne voit pas les dés changer, on découvre le résultat d'un coup. Petit (4–10) en bleu, Grand (11–17) en rouge. */
  GAMES.sicbo = function (box, x) {
    var bet = 'small';
    box.innerHTML = '<div class="cs-stage sb-stage"><div class="sb-shaker open" id="csSbSh"><i class="sb-dome"></i><div class="sb" id="csSb">' + [1, 2, 3].map(function (n) { return '<span class="die">' + dieSvg(n * 2) + '</span>'; }).join('') + '</div><i class="sb-base"></i></div><b class="sb-sum" id="csSbS"></b></div><div class="cs-res"></div>' +
      stakePanel(x.bet, '<div class="cs-opts two sb-pick"><button type="button" data-b="small" class="on sb-s">' + esc(x.small) + ' (4–10)<small>×2</small></button><button type="button" data-b="big" class="sb-g">' + esc(x.big) + ' (11–17)<small>×2</small></button></div>');
    bindStake(box);
    box.querySelectorAll('[data-b]').forEach(function (b) { b.addEventListener('click', function () { bet = b.getAttribute('data-b'); box.querySelectorAll('[data-b]').forEach(function (z) { z.classList.toggle('on', z === b); }); }); });
    $('csGo').addEventListener('click', async function () {
      var g = this; if (g.disabled) return;
      g.disabled = true;
      var sh = $('csSbSh'), d = box.querySelectorAll('#csSb .die'), sum = $('csSbS');
      sh.classList.remove('open'); sum.textContent = ''; sum.className = 'sb-sum';
      var r = await play('sicbo', { bet: bet });
      if (!r) { sh.classList.add('open'); g.disabled = false; return; }
      await sleep(380);
      sh.classList.add('shake'); await sleep(900); sh.classList.remove('shake');
      d.forEach(function (e, i) { e.innerHTML = dieSvg(r.view.dice[i]); }); // changés SOUS le gobelet
      await sleep(150); sh.classList.add('open'); await sleep(420);
      var small = r.view.sum <= 10;
      sum.textContent = r.view.sum + ' · ' + (r.view.triple ? x.triple : (small ? x.small : x.big));
      sum.className = 'sb-sum ' + (r.view.triple ? 'tr' : small ? 'sm' : 'bg');
      resultLine(box, r, r.view.sum + (r.view.triple ? ' · ' + x.triple : ''));
      g.disabled = false;
    });
  };
  /* v2725 (propriétaire) : TREASURE — le coffre choisi tremble puis S'OUVRE (couvercle qui bascule) ; s'il y a l'or, il brille
     et les pièces sautent ; les deux autres s'ouvrent ensuite pour montrer où était l'or. */
  function chestHtml() {
    return '<span class="tch"><i class="tch-glow"></i><svg class="tch-gold" viewBox="0 0 64 30"><circle cx="20" cy="20" r="7" fill="#FACC15" stroke="#B45309"/><circle cx="32" cy="15" r="8" fill="#FDE047" stroke="#B45309"/><circle cx="44" cy="20" r="7" fill="#FACC15" stroke="#B45309"/><path d="M32 2l1.5 3.4 3.7.4-2.8 2.5.8 3.6L32 10l-3.2 1.9.8-3.6-2.8-2.5 3.7-.4z" fill="#fff"/><text x="32" y="19" text-anchor="middle" font-size="8" font-weight="900" font-family="system-ui" fill="#92400E">$</text></svg>' +
      '<svg class="tch-body" viewBox="0 0 64 34"><path d="M4 2h56v26a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4z" fill="#92400E"/><path d="M4 2h56v5H4z" fill="#3B1D0A" class="tch-in"/><path d="M4 9h56" stroke="#FACC15" stroke-width="3"/><path d="M32 7v25" stroke="#FACC15" stroke-width="3" opacity=".7"/><rect x="27" y="12" width="10" height="11" rx="2" fill="#FACC15"/><circle cx="32" cy="17" r="1.8" fill="#78350F"/></svg>' +
      '<i class="tch-burst"><b></b><b></b><b></b><b></b><b></b><b></b><b></b></i><i class="tch-star">✦</i>' +
      '<svg class="tch-lid" viewBox="0 0 64 24"><path d="M4 24c0-12 7-20 16-20h24c9 0 16 8 16 20z" fill="#B45309"/><path d="M4 24h56" stroke="#FACC15" stroke-width="3"/><path d="M32 4v20" stroke="#FACC15" stroke-width="3" opacity=".7"/><path d="M12 14c4-5 10-7 16-7" stroke="#fff" stroke-width="2" opacity=".35" fill="none" stroke-linecap="round"/></svg></span>';
  }
  GAMES.chests = function (box, x) {
    var pick = 1;
    box.innerHTML = '<div class="cs-stage ch-stage"><div class="ch" id="csCh">' + [0, 1, 2].map(function (i) { return '<button type="button" data-c="' + i + '" class="' + (i === 1 ? 'on' : '') + '">' + chestHtml() + '</button>'; }).join('') + '</div><small class="cs-lbl">' + esc(x.pickChest) + ' · ×2,85</small></div><div class="cs-res"></div>' + stakePanel(x.bet);
    bindStake(box);
    var bs = box.querySelectorAll('#csCh button'), busy = false;
    var reset = function () { bs.forEach(function (z) { z.classList.remove('open', 'gold', 'shake', 'dim'); }); };
    bs.forEach(function (b) { b.addEventListener('click', function () { if (busy) return; pick = +b.getAttribute('data-c'); reset(); bs.forEach(function (z) { z.classList.toggle('on', z === b); }); }); });
    $('csGo').addEventListener('click', async function () {
      var g = this; if (g.disabled) return;
      g.disabled = true; busy = true; reset();
      var r = await play('chests', { pick: pick });
      if (!r) { g.disabled = false; busy = false; return; }
      var me = bs[r.view.pick];
      me.classList.add('shake'); await sleep(650); me.classList.remove('shake');
      me.classList.add('open'); if (r.view.gold === r.view.pick) me.classList.add('gold');
      await sleep(700);
      bs.forEach(function (b, i) { if (i !== r.view.pick) { b.classList.add('open', 'dim'); if (i === r.view.gold) b.classList.add('gold'); } });
      resultLine(box, r);
      g.disabled = false; busy = false;
    });
  };
  /* La Tour : 8 étages, 3 portes, 1 piège par étage */
  GAMES.tower = function (box, x) {
    var g = null, rows = '';
    var mult = function (k) { return k < 1 ? 0 : Math.floor(0.94 / Math.pow(2 / 3, k) * 100) / 100; };
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
    box.innerHTML = '<div class="cs-stage bl-stage"><b class="crash-n bl-m" id="csBlM">1.00×</b><div class="bl" id="csBl"><svg viewBox="0 0 100 130"><defs><radialGradient id="blG" cx="35%" cy="30%" r="70%"><stop offset="0" stop-color="#fdba74"/><stop offset=".6" stop-color="#f97316"/><stop offset="1" stop-color="#9a3412"/></radialGradient></defs><path d="M50 4c22 0 38 17 38 40 0 28-22 47-38 51-16-4-38-23-38-51C12 21 28 4 50 4z" fill="url(#blG)"/><path d="M50 4c-9 10-10 70 0 91M50 4c9 10 10 70 0 91" stroke="#9a3412" stroke-width="1.4" opacity=".3" fill="none"/><path d="M30 26c4-9 12-13 19-13" stroke="#fff" stroke-width="6" stroke-linecap="round" opacity=".75" fill="none"/><ellipse cx="32" cy="42" rx="5" ry="9" fill="#fff" opacity=".3"/><path d="M45 95l5 8 5-8z" fill="#9a3412"/><path d="M50 103c-5 7 5 12 0 19s3 6 1 8" stroke="#fff" stroke-width="1.6" fill="none"/></svg></div>' +
      (guest() ? '' : '<button type="button" class="cs-pump" id="csPump" disabled aria-label="' + esc(x.pump) + '"><svg viewBox="0 0 24 24"><path d="M9 11V5.5a1.5 1.5 0 0 1 3 0V10m0-1.5a1.5 1.5 0 0 1 3 0V11m0-1a1.5 1.5 0 0 1 3 0v4.5c0 3.6-2.5 6.5-6 6.5h-1c-2 0-3.4-.9-4.4-2.4L4 14.6a1.5 1.5 0 0 1 2.4-1.8L9 15" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></button>') +
      '</div><div class="cs-res"></div>' + (guest() ? '<div id="csNeed"></div>' : stakePanel(x.bet));
    if (guest()) { needAccount($('csNeed'), x); return; }
    bindStake(box);
    var btn = $('csGo'), pump = $('csPump'), bl = $('csBl');
    var paint = function (r) {
      g = r;
      var sc = 1 + Math.min(0.38, r.k * 0.04); // v2751 : le ballon grandit mais reste toujours dans la scène (ne cache plus la main)
      bl.style.transform = 'scale(' + sc + ')';
      $('csBlM').textContent = (r.k ? r.mult : 1).toFixed(2) + '×';
      if (r.done) {
        if (r.win > 0) $('csBlM').className = 'crash-n bl-m w'; else { bl.classList.add('pop'); $('csBlM').className = 'crash-n bl-m l'; }
        resultLine(box, r, r.win > 0 ? '×' + r.mult.toFixed(2) : '💥');
        pump.disabled = true; btn.textContent = x.bet; btn.classList.remove('cash');
      } else {
        bl.classList.remove('pop'); $('csBlM').className = 'crash-n bl-m';
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
    if (b) b.addEventListener('click', function () { openPred(); });
    var gb = $('btnGames');
    if (gb) gb.addEventListener('click', function () { open(null, 'games'); });
    // « + » au milieu de la carte Compte réel / Démo → page Recharger
    var ms = $('modeSwitcher');
    if (ms && !$('msPlus')) {
      var p = document.createElement('button'); p.type = 'button'; p.id = 'msPlus'; p.className = 'ms-plus'; p.setAttribute('aria-label', 'Recharger'); p.innerHTML = '<span>+</span>';
      p.addEventListener('click', function (e) { e.stopPropagation(); e.preventDefault(); try { if (window.oroUi && window.oroUi.deposit) window.oroUi.deposit(); else if (D6.App && D6.App.openDeposit) D6.App.openDeposit(); } catch (x) { /* ignore */ } }, true);
      ms.appendChild(p);
      // v2757 : le « + » se range au bout de « Compte réel » (côté de la séparation), dans toutes les langues
      var place = function () {
        var r = $('modeReal'), d = $('modeDemo');
        if (!r || !d || !r.offsetWidth) return;
        // v2784 (propriétaire) : « + » plus grand (presque toute la hauteur de la carte) ; le texte garde sa place → jamais collé
        var pw = p.offsetWidth || 36;
        var x = r.offsetLeft < d.offsetLeft ? r.offsetLeft + r.offsetWidth - pw - 5 : r.offsetLeft + 5;
        p.style.left = x + 'px';
        var ltr = r.offsetLeft < d.offsetLeft;
        r.style.removeProperty(ltr ? 'padding-left' : 'padding-right');
        r.style.setProperty(ltr ? 'padding-right' : 'padding-left', (pw + 12) + 'px', 'important');
      };
      // v2759 (propriétaire) : « Connexion » / « Inscription » restent dans la barre du haut (la carte Compte réel / Démo ne change pas)
      place();
      if (window.ResizeObserver) new ResizeObserver(place).observe(ms); else window.addEventListener('resize', place);
      document.addEventListener('oro:lang', function () { setTimeout(place, 60); setTimeout(place, 400); });
      document.addEventListener('oro:auth', function () { setTimeout(place, 60); });
    }
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
  // v2812 : D6.Casino.home() marche aussi casino fermé (juste après le chargement de la page) : il ouvre la salle de jeux
  function homePub(view) { var cm = $('casinoModal'); if (!cm || !cm.classList.contains('active')) { open(null, view === 'pred' ? 'pred' : (view || 'games')); if (view === 'sports') home('sports'); return; } S.pend = ''; home(view); }
  D6.Casino = { open: open, close: close, home: homePub, openPred: openPred };
  // v2795 — boîte à outils partagée par les jeux refaits (js/games/*.js)
  D6.CasinoKit = { GAMES: GAMES, MODS: MODS, S: S, X: X, LX: LX, $: $, esc: esc, fmt: fmt, m2: m2, dec: dec, sleep: sleep, toast: toast, guest: guest,
    play: play, multi: multi, resultLine: resultLine, sfx: sfx, sfxBeat: sfxBeat, amb: amb, stakePanel: stakePanel, bindStake: bindStake, needAccount: needAccount, signup: signup,
    afterPlay: afterPlay, stopAll: stopAll, fitEl: fitEl, fitAll: fitAll, setText: setText, ART: ART, pal: pal, gicon: gicon, name: name,
    seeded: seeded, easeOut: easeOut, lang: function () { return (document.documentElement.lang || 'en').slice(0, 2); },
    /* register(clé, fonction(box, x), { rules: { en: '…', fr: '…', … } }) */
    register: function (k, fn, o) { fn.v2 = 1; if (o && o.rules) fn.rules = o.rules; GAMES[k] = fn; } };
  // v2740 (propriétaire) : bouton du haut = manette + « Jeux », traduit en un seul mot dans chaque langue
  GAMES_WORD = { fr: 'Jeux', en: 'Games', es: 'Juegos', pt: 'Jogos', ar: 'ألعاب', tr: 'Oyunlar', vi: 'Trò chơi', id: 'Game', ru: 'Игры', de: 'Spiele', hi: 'गेम्स', zh: '游戏' };
  function paintGamesBtn() {
    var l = (document.documentElement.lang || 'fr').slice(0, 2), w = GAMES_WORD[l] || GAMES_WORD.en, pw = PRED_WORD[l] || PRED_WORD.en;
    var e = $('cbLbl'), b = $('btnCasino'), g = $('gamesLbl'), gb = $('btnGames');
    if (e && e.textContent !== pw) e.textContent = pw;
    if (b) b.setAttribute('aria-label', pw);
    if (g && g.textContent !== w) g.textContent = w;
    if (gb) gb.setAttribute('aria-label', w);
  }
  paintGamesBtn();
  document.addEventListener('oro:lang', paintGamesBtn);
  if (window.MutationObserver) new MutationObserver(paintGamesBtn).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
})(window.D6 = window.D6 || {});
