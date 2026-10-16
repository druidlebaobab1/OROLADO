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
      deposit: 'Recharger', hist: 'Mes dernières parties', none: 'Aucune partie pour l’instant.', rules: 'Résultat tiré par le serveur OROLADO. Jeu responsable : joue ce que tu peux te permettre de perdre.',
      g: { crash: ['Avion', 'Encaisse avant qu’il explose'], coin: ['Pile ou face', '×1,94'], dice: ['Dés', 'Choisis ta chance'], limbo: ['Cible', 'Vise jusqu’à ×1000'], wheel: ['Roue casino', 'Jusqu’à ×50'],
        race: ['Course auto', '6 voitures · ×5,7'], roulette: ['Roulette', 'Rouge, noir, numéro ×36'], slots: ['Machine à sous', 'Jusqu’à ×50'], plinko: ['Cascade', 'Jusqu’à ×12'], keno: ['Keno', '3 numéros · ×25'],
        scratch: ['Grattage', 'Jusqu’à ×20'], hilo: ['Hi-Lo cartes', 'Plus haut ou plus bas'], penalty: ['Penalty', 'Marque · ×1,44'], colors: ['Couleurs', 'Vert, rouge, violet'], mines: ['Mines', 'Évite les bombes'],
        jet: ['Jet Man', 'Il s’envole, encaisse !'], rocket: ['Fusée', 'Jusqu’aux étoiles'], apple: ['Verger d’or', '10 étages'],
        tower: ['La Tour', '3 portes, 1 piège'], dragon: ['Dragon Tigre', 'La plus forte carte'], baccarat: ['Baccara', 'Joueur ou Banque'], sicbo: ['Sic Bo', 'Petit ou Grand'], chests: ['Coffres', '1 trésor sur 3'], balloon: ['Ballon', 'Gonfle et encaisse'] },
      cashout: 'Encaisser', auto: 'Encaissement auto (×)', flying: 'En vol…', boom: 'Explosé à ×{x}', cashed: 'Encaissé à ×{x} : +{w} $', start: 'Décoller',
      heads: 'Pile', tails: 'Face', chance: 'Chance de gagner', under: 'En dessous', over: 'Au-dessus', mult: 'Gain ×{x}', target: 'Cible ×', result: 'Résultat ×{x}', roll: 'Tirage {x}',
      pickCar: 'Choisis ta voiture', red: 'Rouge', black: 'Noir', even: 'Pair', odd: 'Impair', number: 'Numéro', dozen: 'Douzaine', green: 'Vert', violet: 'Violet',
      pick3: 'Choisis 3 numéros', picked: '{n}/3 choisis', hits: '{n} bon(s) numéro(s)', scratchGo: 'Gratter', aim: 'Vise un coin', left: 'Gauche', center: 'Centre', right: 'Droite', goal: 'BUT !', saved: 'Arrêté !',
      hi: 'Plus haut ou égal', lo: 'Plus bas ou égal', minesN: 'Nombre de mines', next: 'Prochaine case ×{x}', open: 'Ouvre des cases…', sports: 'Paris sportifs', sportsSoon: 'Les grands matchs arrivent bientôt ici.' },
    en: { title: 'Casino', sub: '18 games · from $0.10', real: 'Real', demo: 'Demo', tryM: 'Try', bal: 'Balance', stake: 'Stake', play: 'Play', again: 'Play again',
      win: 'You win! +${w}', lose: 'Lost', tryNote: 'Create your account and top up to play for real money, from $0.10.', signup: 'Create my account', gamesTab: 'Games', realAcc: 'Real account', bet: 'Bet', gotIt: 'Got it', revealAll: 'Reveal all', dragonN: 'Dragon', tigerN: 'Tiger', tie: 'Tie', player: 'Player', banker: 'Banker', small: 'Small', big: 'Big', triple: 'triple', pickChest: 'Pick a chest', pump: 'Pump', pumpFirst: 'Pump the balloon', level: 'Rotten apples',
      e_min: 'Minimum stake $0.10.', e_max: 'Stake too high.', e_maxWin: 'Win too high for this stake: lower the stake or the target.', e_insufficient: 'Insufficient balance.', e_unavailable: 'Unavailable, try again.', e_busy: 'One moment…', e_param: 'Invalid choice.', e_login: 'Log in to play.', e_suspended: 'Account suspended.',
      deposit: 'Top up', hist: 'My last games', none: 'No game yet.', rules: 'Result drawn by the OROLADO server. Play responsibly: only stake what you can afford to lose.',
      g: { crash: ['Aviator', 'Cash out before it blows'], coin: ['Heads or tails', '×1.94'], dice: ['Dice', 'Pick your chance'], limbo: ['Target', 'Aim up to ×1000'], wheel: ['Casino wheel', 'Up to ×50'],
        race: ['Car race', '6 cars · ×5.7'], roulette: ['Roulette', 'Red, black, number ×36'], slots: ['Slot machine', 'Up to ×50'], plinko: ['Cascade', 'Up to ×12'], keno: ['Keno', '3 numbers · ×25'],
        scratch: ['Scratch card', 'Up to ×20'], hilo: ['Hi-Lo cards', 'Higher or lower'], penalty: ['Penalty', 'Score · ×1.44'], colors: ['Colours', 'Green, red, violet'], mines: ['Mines', 'Avoid the bombs'],
        jet: ['Jet Man', 'He flies, cash out!'], rocket: ['Rocket', 'To the stars'], apple: ['Golden Orchard', '10 floors'],
        tower: ['The Tower', '3 doors, 1 trap'], dragon: ['Dragon Tiger', 'Highest card'], baccarat: ['Baccarat', 'Player or Banker'], sicbo: ['Sic Bo', 'Small or Big'], chests: ['Chests', '1 treasure in 3'], balloon: ['Balloon', 'Pump and cash out'] },
      cashout: 'Cash out', auto: 'Auto cash-out (×)', flying: 'Flying…', boom: 'Blew up at ×{x}', cashed: 'Cashed out at ×{x}: +${w}', start: 'Take off',
      heads: 'Heads', tails: 'Tails', chance: 'Win chance', under: 'Under', over: 'Over', mult: 'Win ×{x}', target: 'Target ×', result: 'Result ×{x}', roll: 'Roll {x}',
      pickCar: 'Pick your car', red: 'Red', black: 'Black', even: 'Even', odd: 'Odd', number: 'Number', dozen: 'Dozen', green: 'Green', violet: 'Violet',
      pick3: 'Pick 3 numbers', picked: '{n}/3 picked', hits: '{n} number(s) hit', scratchGo: 'Scratch', aim: 'Aim a corner', left: 'Left', center: 'Centre', right: 'Right', goal: 'GOAL!', saved: 'Saved!',
      hi: 'Higher or equal', lo: 'Lower or equal', minesN: 'Number of mines', next: 'Next tile ×{x}', open: 'Open tiles…', sports: 'Sports bets', sportsSoon: 'Big matches are coming here soon.' }
  };
  T.zh = Object.assign({}, T.en, { title: '娱乐场', sub: '18 款游戏 · 0.10 美元起', real: '真实', demo: '模拟', tryM: '试玩', bal: '余额', stake: '投注', play: '开始', again: '再来一局',
    win: '赢了！+{w} 美元', lose: '输了', tryNote: '创建账户并充值，即可真钱游戏，0.10 美元起。', signup: '创建账户', gamesTab: '游戏', realAcc: '真实账户', bet: '投注', gotIt: '知道了', revealAll: '全部刮开', dragonN: '龙', tigerN: '虎', tie: '和', player: '闲', banker: '庄', small: '小', big: '大', triple: '围骰', pickChest: '选一个宝箱', pump: '充气', pumpFirst: '给气球充气', level: '坏苹果', deposit: '充值', hist: '最近的游戏', none: '还没有游戏记录。',
    rules: '结果由 OROLADO 服务器生成。请理性游戏，只投入你能承受损失的金额。',
    g: { crash: ['飞机', '爆炸前兑现'], coin: ['正反面', '×1.94'], dice: ['骰子', '自选胜率'], limbo: ['极限', '最高 ×1000'], wheel: ['娱乐场转盘', '最高 ×50'], race: ['赛车', '6 辆车 · ×5.7'],
      roulette: ['轮盘', '红、黑、号码 ×36'], slots: ['老虎机', '最高 ×50'], plinko: ['弹珠台', '最高 ×12'], keno: ['基诺', '3 个号码 · ×25'], scratch: ['刮刮卡', '最高 ×20'], hilo: ['猜大小', '更大还是更小'],
      penalty: ['点球', '进球 · ×1.44'], colors: ['颜色', '绿、红、紫'], mines: ['扫雷', '避开炸弹'], jet: ['喷气侠', '起飞，快兑现！'], rocket: ['火箭', '直冲星空'], apple: ['金色果园', '10 层'], tower: ['高塔', '3 扇门 1 个陷阱'], dragon: ['龙虎', '比大小'], baccarat: ['百家乐', '闲或庄'], sicbo: ['骰宝', '大或小'], chests: ['宝箱', '3 选 1'], balloon: ['气球', '充气再兑现'] },
    cashout: '兑现', start: '起飞', heads: '正面', tails: '反面', under: '小于', over: '大于', red: '红', black: '黑', even: '双', odd: '单', number: '号码', green: '绿', violet: '紫', goal: '进球！', saved: '被扑出！', hi: '更大或相等', lo: '更小或相等', sports: '体育竞猜', sportsSoon: '重大赛事即将上线。' });
  (D6.LIVE_T = D6.LIVE_T || {}).casino = T;
  function X() { var l = (document.documentElement.lang || 'fr').slice(0, 2); return T[l] || T.en; }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function fmt(s, o) { return String(s).replace(/\{(\w+)\}/g, function (m, k) { return o[k] != null ? o[k] : m; }); }
  function m2(v) { return (Math.round((Number(v) || 0) * 100 + 1e-6) / 100).toFixed(2); } // même arrondi que le serveur
  function guest() { return !(D6.Api && D6.Api.token && D6.Api.token()) || document.documentElement.classList.contains('oro-guest'); }
  function toast(m, k) { if (D6.App && D6.App.toast) D6.App.toast(m, k || 'err'); }
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  /* ---------- logos des jeux (même style que Live / Cadeaux) ---------- */
  var GI = {
    crash: ['#FF8A65', '#E5334B', '<path d="M8 36c8-2 16-9 22-20" fill="none" stroke="W" stroke-width="2.6" stroke-linecap="round" stroke-dasharray="3 3" opacity=".7"/><path d="M27 13l12-3-3 12-3.3-3.3-6.2 6.2-2.4-2.4 6.2-6.2z" fill="W"/><path d="M15 31l4-1.5 1.5 4z" fill="W"/>'],
    coin: ['#FFE07A', '#E39417', '<circle cx="24" cy="24" r="14" fill="W"/><circle cx="24" cy="24" r="10.5" fill="none" stroke="A" stroke-width="1.6" opacity=".5"/><path d="M27.6 19.4c-.9-1-2.2-1.5-3.6-1.5-2 0-3.4 1-3.4 2.4 0 3.3 7.2 1.7 7.2 5.3 0 1.5-1.5 2.7-3.8 2.7-1.5 0-3-.6-3.8-1.6M24 15.5v2.4M24 28.5v2.6" fill="none" stroke="A" stroke-width="2.2" stroke-linecap="round"/>'],
    dice: ['#9B8CFF', '#5B3FD0', '<rect x="8" y="12" width="19" height="19" rx="4" fill="W" transform="rotate(-12 17.5 21.5)"/><rect x="22" y="18" width="18" height="18" rx="4" fill="W" opacity=".9"/><g fill="A"><circle cx="13.5" cy="17.5" r="1.8"/><circle cx="21" cy="25" r="1.8"/><circle cx="17.3" cy="21.3" r="1.8"/><circle cx="26.5" cy="22.5" r="1.7"/><circle cx="35.5" cy="22.5" r="1.7"/><circle cx="26.5" cy="31.5" r="1.7"/><circle cx="35.5" cy="31.5" r="1.7"/></g>'],
    limbo: ['#7CF2E0', '#2E8CF0', '<circle cx="22" cy="26" r="14" fill="W"/><circle cx="22" cy="26" r="9.5" fill="A" opacity=".55"/><circle cx="22" cy="26" r="5" fill="W"/><circle cx="22" cy="26" r="2" fill="A"/><path d="M23 25l15-15" stroke="#FFD27A" stroke-width="2.6" stroke-linecap="round"/><path d="M34 8l5 1-1 5z" fill="#FFD27A"/>'],
    wheel: ['#FFD86B', '#FF5E7E', '<circle cx="24" cy="26" r="12.8" fill="W"/><g fill="A" opacity=".55"><path d="M24 26V13.2a12.8 12.8 0 0 1 11.1 6.4z"/><path d="M24 26l-11.1 6.4a12.8 12.8 0 0 1 0-12.8z"/><path d="M24 26v12.8a12.8 12.8 0 0 0 11.1-6.4z"/></g><circle cx="24" cy="26" r="3.2" fill="A"/><path d="M24 16.8l-3.6-7h7.2z" fill="W"/>'],
    race: ['#FF6B6B', '#B91C1C', '<path d="M7 29l3-7c.6-1.4 2-2.3 3.5-2.3h15c1.3 0 2.5.7 3.2 1.8L35 26h4.5a2.5 2.5 0 0 1 2.5 2.5V31a1.5 1.5 0 0 1-1.5 1.5H8.5A1.5 1.5 0 0 1 7 31z" fill="W"/><path d="M15 22h13l2.5 4H13z" fill="A" opacity=".55"/><circle cx="15" cy="32.5" r="3.6" fill="A"/><circle cx="33" cy="32.5" r="3.6" fill="A"/><path d="M5 18h8M3 22h6" stroke="W" stroke-width="2" stroke-linecap="round" opacity=".7"/>'],
    roulette: ['#34D399', '#047857', '<circle cx="24" cy="24" r="15" fill="W"/><circle cx="24" cy="24" r="11" fill="A" opacity=".55"/><g stroke="W" stroke-width="2.2"><path d="M24 13v22M13 24h22M16.2 16.2l15.6 15.6M31.8 16.2L16.2 31.8"/></g><circle cx="24" cy="24" r="4.5" fill="W"/><circle cx="32" cy="16.5" r="2.4" fill="#FFD27A"/>'],
    slots: ['#F472B6', '#9D174D', '<rect x="7" y="11" width="34" height="27" rx="5" fill="W"/><rect x="10.5" y="16" width="8" height="15" rx="2" fill="A" opacity=".2"/><rect x="20" y="16" width="8" height="15" rx="2" fill="A" opacity=".2"/><rect x="29.5" y="16" width="8" height="15" rx="2" fill="A" opacity=".2"/><path d="M12 20h5l-3 8M21.5 20h5l-3 8M31 20h5l-3 8" fill="none" stroke="A" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"/><circle cx="43" cy="14" r="2.5" fill="W"/><path d="M43 16v8" stroke="W" stroke-width="2"/>'],
    plinko: ['#60A5FA', '#1D4ED8', '<g fill="W"><circle cx="24" cy="12" r="2"/><circle cx="19" cy="18" r="2"/><circle cx="29" cy="18" r="2"/><circle cx="14" cy="24" r="2"/><circle cx="24" cy="24" r="2"/><circle cx="34" cy="24" r="2"/><circle cx="9" cy="30" r="2"/><circle cx="19" cy="30" r="2"/><circle cx="29" cy="30" r="2"/><circle cx="39" cy="30" r="2"/></g><circle cx="21.5" cy="21" r="3" fill="#FFD27A"/><rect x="6" y="35" width="36" height="5" rx="2" fill="W" opacity=".6"/>'],
    keno: ['#FBBF24', '#B45309', '<rect x="8" y="9" width="32" height="30" rx="5" fill="W"/><g fill="A" opacity=".3"><circle cx="15" cy="16" r="3"/><circle cx="24" cy="16" r="3"/><circle cx="33" cy="16" r="3"/><circle cx="15" cy="24" r="3"/><circle cx="33" cy="24" r="3"/><circle cx="15" cy="32" r="3"/><circle cx="24" cy="32" r="3"/></g><circle cx="24" cy="24" r="3.6" fill="A"/><circle cx="33" cy="32" r="3.6" fill="A"/>'],
    scratch: ['#A78BFA', '#6D28D9', '<rect x="6" y="11" width="36" height="26" rx="4" fill="W"/><path d="M11 26c4-6 8 3 12-3s8 3 12-3" fill="none" stroke="A" stroke-width="5" stroke-linecap="round" opacity=".4"/><path d="M33 13l3 8 8-3-3 8" fill="none" stroke="#FFD27A" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>'],
    hilo: ['#F87171', '#7F1D1D', '<rect x="12" y="9" width="20" height="28" rx="3.5" fill="W" transform="rotate(-8 22 23)"/><rect x="18" y="12" width="20" height="28" rx="3.5" fill="W"/><path d="M28 19l3.5 4.5h-7zM28 33l3.5-4.5h-7z" fill="A"/>'],
    penalty: ['#4ADE80', '#15803D', '<path d="M6 30V13h36v17" fill="none" stroke="W" stroke-width="2.4"/><path d="M6 17h36M6 21h36M6 25h36M12 13v17M18 13v17M24 13v17M30 13v17M36 13v17" stroke="W" stroke-width=".8" opacity=".5"/><circle cx="24" cy="34" r="6" fill="W"/><path d="M24 30l2.6 2-1 3h-3.2l-1-3z" fill="A"/>'],
    colors: ['#C084FC', '#7E22CE', '<circle cx="16" cy="20" r="8" fill="#22C55E" stroke="#fff" stroke-width="2"/><circle cx="32" cy="20" r="8" fill="#EF4444" stroke="#fff" stroke-width="2"/><circle cx="24" cy="32" r="8" fill="#8B5CF6" stroke="#fff" stroke-width="2"/>'],
    jet: ['#C084FC', '#6D28D9', '<path d="M18 34c-2 5-1 9 2 12 1-5 2-8 2-11zM30 34c2 5 1 9-2 12-1-5-2-8-2-11z" fill="#FDE68A"/><rect x="14" y="19" width="20" height="16" rx="6" fill="W"/><circle cx="24" cy="13" r="8" fill="W"/><path d="M18 12a6 5 0 0 1 12 0v2H18z" fill="A"/><path d="M34 21l7-5" stroke="W" stroke-width="3" stroke-linecap="round"/>'],
    rocket: ['#67E8F9', '#0E7490', '<path d="M24 6c7 5 9 13 9 21v9H15v-9c0-8 2-16 9-21z" fill="W"/><circle cx="24" cy="20" r="4" fill="A"/><path d="M15 27l-5 9h5zM33 27l5 9h-5z" fill="W" opacity=".8"/><path d="M19 36c1 5 3 8 5 10 2-2 4-5 5-10z" fill="#FDBA74"/>'],
    apple: ['#86EFAC', '#15803D', '<path d="M24 15c-3-3-11-3-13 4s3 18 8 18c2 0 3-1 5-1s3 1 5 1c5 0 10-11 8-18s-10-7-13-4z" fill="W"/><path d="M24 15c0-3 2-6 5-8" stroke="W" stroke-width="2.4" fill="none"/><path d="M26 11c3-2 7-2 8 0-2 3-5 3-8 0z" fill="#FDE68A"/><path d="M18 22c-1 2-1 5 0 7" stroke="A" stroke-width="2" stroke-linecap="round" opacity=".5" fill="none"/>'],
    tower: ['#FDBA74', '#9A3412', '<path d="M16 40V18h16v22z" fill="W"/><path d="M14 18h20l-2-6H16z" fill="W" opacity=".85"/><path d="M14 12h3v-3h3v3h3v-3h2v3h3v-3h3v3h3" fill="none" stroke="W" stroke-width="2"/><rect x="21" y="30" width="6" height="10" rx="3" fill="A"/><rect x="19" y="21" width="4" height="5" rx="1" fill="A" opacity=".6"/><rect x="25" y="21" width="4" height="5" rx="1" fill="A" opacity=".6"/>'],
    dragon: ['#F87171', '#7C2D12', '<rect x="7" y="12" width="15" height="22" rx="3" fill="W" transform="rotate(-10 14.5 23)"/><rect x="26" y="12" width="15" height="22" rx="3" fill="W" transform="rotate(10 33.5 23)"/><path d="M11 20c3-3 6 0 4 3s2 5 4 3" fill="none" stroke="A" stroke-width="2" stroke-linecap="round" transform="rotate(-10 14.5 23)"/><path d="M30 18l3 3 3-3M30 26l3 3 3-3" fill="none" stroke="A" stroke-width="2" stroke-linecap="round" transform="rotate(10 33.5 23)"/><text x="24" y="44" text-anchor="middle" font-size="7" font-weight="900" fill="W">VS</text>'],
    baccarat: ['#FCD34D', '#92400E', '<rect x="9" y="10" width="17" height="24" rx="3" fill="W" transform="rotate(-12 17.5 22)"/><rect x="22" y="12" width="17" height="24" rx="3" fill="W"/><text x="30.5" y="27" text-anchor="middle" font-size="11" font-weight="900" fill="A">9</text><path d="M14 18l2 3-2 3-2-3z" fill="#e11d48" transform="rotate(-12 17.5 22)"/>'],
    sicbo: ['#A5B4FC', '#3730A3', '<rect x="6" y="17" width="15" height="15" rx="3.5" fill="W" transform="rotate(-12 13.5 24.5)"/><rect x="26" y="17" width="15" height="15" rx="3.5" fill="W" transform="rotate(10 33.5 24.5)"/><rect x="16.5" y="8" width="15" height="15" rx="3.5" fill="W"/><g fill="A"><circle cx="24" cy="15.5" r="1.8"/><circle cx="10" cy="21" r="1.6"/><circle cx="16" cy="28" r="1.6"/><circle cx="30" cy="21" r="1.6"/><circle cx="37" cy="28" r="1.6"/><circle cx="33.5" cy="24.5" r="1.6"/></g>'],
    chests: ['#FDE047', '#A16207', '<path d="M8 24h32v14a3 3 0 0 1-3 3H11a3 3 0 0 1-3-3z" fill="W"/><path d="M8 24c0-7 4-11 10-11h12c6 0 10 4 10 11z" fill="W" opacity=".85"/><path d="M8 24h32" stroke="A" stroke-width="2.4"/><rect x="21" y="25" width="6" height="7" rx="1.5" fill="A"/><circle cx="36" cy="10" r="2" fill="#fff"/><circle cx="12" cy="9" r="1.4" fill="#fff"/>'],
    balloon: ['#FDA4AF', '#BE123C', '<ellipse cx="24" cy="20" rx="11" ry="13" fill="W"/><ellipse cx="20" cy="15" rx="3" ry="4.5" fill="A" opacity=".25"/><path d="M22 33l2 3 2-3z" fill="W"/><path d="M24 36c-3 4 3 6 0 9" stroke="W" stroke-width="1.6" fill="none"/>'],
    mines: ['#94A3B8', '#334155', '<circle cx="22" cy="27" r="11" fill="W"/><path d="M29 18l4-4M33 14l2.5-1M33 14l1 2.5" stroke="W" stroke-width="2.4" stroke-linecap="round"/><circle cx="35.6" cy="11.8" r="2" fill="#FFD27A"/><circle cx="18" cy="23" r="3" fill="A" opacity=".45"/>'],
    sports: ['#38BDF8', '#0369A1', '<circle cx="24" cy="24" r="14" fill="W"/><path d="M24 15l5 3.6-1.9 5.9h-6.2L19 18.6zM24 15v-5M29 18.6l5-1.5M27.1 24.5l3 4.4M20.9 24.5l-3 4.4M19 18.6l-5-1.5" fill="A" stroke="A" stroke-width="1.4" stroke-linejoin="round"/>']
  };
  var gn = 0;
  function gicon(k) {
    var c = GI[k] || GI.coin, id = 'cg' + (++gn);
    var glyph = function (w, a) { return c[2].replace(/="W"/g, '="' + w + '"').replace(/="A"/g, '="' + a + '"'); };
    return '<svg class="cs-ico" viewBox="0 0 48 48" aria-hidden="true"><defs><linearGradient id="' + id + 'a" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + c[0] + '"/><stop offset="1" stop-color="' + c[1] + '"/></linearGradient>' +
      '<radialGradient id="' + id + 'b" cx="28%" cy="12%" r="80%"><stop offset="0" stop-color="#fff" stop-opacity=".5"/><stop offset=".45" stop-color="#fff" stop-opacity=".08"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs>' +
      '<rect x="1" y="1" width="46" height="46" rx="14" fill="url(#' + id + 'a)"/><rect x="1" y="1" width="46" height="46" rx="14" fill="url(#' + id + 'b)"/><rect x="1.5" y="1.5" width="45" height="45" rx="13.5" fill="none" stroke="#fff" stroke-opacity=".3"/>' +
      '<g transform="translate(0 1.3)" opacity=".2">' + glyph('#000', '#000') + '</g>' + glyph('#fff', c[1]) + '</svg>';
  }
  D6.CasinoIcon = gicon;
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
  /* v2691 — dessins des 3 jeux « ça monte » + pommes (vectoriels, légers) */
  function planeSvg() {
    return '<svg viewBox="0 0 58 36" aria-hidden="true"><defs><linearGradient id="pl1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff6b8a"/><stop offset="1" stop-color="#c8102e"/></linearGradient></defs>' +
      '<path d="M8 20c6-4 22-6 34-6 8 0 13 2 14 4s-5 4-13 4c-12 0-28 1-35-2z" fill="url(#pl1)"/><path d="M24 15l-9-12h7l13 12z" fill="#e11d48"/><path d="M26 22l-7 11h6l12-11z" fill="#9f1239"/>' +
      '<path d="M9 19l-6-9h5l7 8z" fill="#e11d48"/><path d="M44 16.5c3 0 6 .8 7 1.8" stroke="#bfe3ff" stroke-width="2.4" stroke-linecap="round"/><circle cx="35" cy="18" r="1.4" fill="#fff" opacity=".8"/><circle cx="30" cy="18.3" r="1.4" fill="#fff" opacity=".8"/></svg>';
  }
  function jetSvg() {
    return '<svg viewBox="0 0 44 52" aria-hidden="true"><path d="M14 34c-2 6-1 12 3 16 1-6 3-10 3-14zM26 34c2 6 1 12-3 16-1-6-3-10-3-14z" fill="#f59e0b" opacity=".9"/><path d="M15 34c-1 4 0 8 2 10 1-4 2-6 2-9zM25 34c1 4 0 8-2 10-1-4-2-6-2-9z" fill="#fde68a"/>' +
      '<rect x="10" y="17" width="20" height="18" rx="6" fill="#7c3aed"/><rect x="8" y="22" width="5" height="12" rx="2.5" fill="#6d28d9"/><rect x="27" y="22" width="5" height="12" rx="2.5" fill="#6d28d9"/>' +
      '<circle cx="20" cy="11" r="9" fill="#ede9fe"/><path d="M13 10a7 6 0 0 1 14 0v2H13z" fill="#38bdf8"/><path d="M30 19l9-6" stroke="#ede9fe" stroke-width="3.4" stroke-linecap="round"/><circle cx="40" cy="12.4" r="2.6" fill="#ede9fe"/></svg>';
  }
  function rocketSvg() {
    return '<svg viewBox="0 0 34 58" aria-hidden="true"><path d="M17 2c8 6 11 16 11 26v12H6V28C6 18 9 8 17 2z" fill="#e2e8f0"/><path d="M17 2c8 6 11 16 11 26H17z" fill="#cbd5e1"/><circle cx="17" cy="22" r="5" fill="#0ea5e9" stroke="#334155" stroke-width="2"/>' +
      '<path d="M6 30l-5 12h5zM28 30l5 12h-5z" fill="#ef4444"/><path d="M10 40h14l-2 4H12z" fill="#475569"/><path d="M12 44c1 6 3 10 5 13 2-3 4-7 5-13z" fill="#f97316"/><path d="M14 44c1 4 2 7 3 9 1-2 2-5 3-9z" fill="#fde68a"/></svg>';
  }
  function appleSvg(good) {
    return good ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 7c-2-2-7-2-8 3s2 11 5 11c1.3 0 2-.6 3-.6s1.7.6 3 .6c3 0 6-6 5-11s-6-5-8-3z" fill="#22c55e"/><path d="M12 7c0-2 1-4 3-5" stroke="#78350f" stroke-width="1.6" fill="none"/><path d="M13 5c2-1 4-1 5 0-1 2-3 2-5 0z" fill="#86efac"/></svg>'
      : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 7c-2-2-7-2-8 3s2 11 5 11c1.3 0 2-.6 3-.6s1.7.6 3 .6c3 0 6-6 5-11s-6-5-8-3z" fill="#7f1d1d"/><circle cx="9" cy="12" r="1.6" fill="#1c1917"/><circle cx="15" cy="15" r="1.2" fill="#1c1917"/><path d="M12 7c0-2 1-4 3-5" stroke="#44403c" stroke-width="1.6" fill="none"/></svg>';
  }

  /* ---------- état ---------- */
  var ORDER = ['crash', 'jet', 'rocket', 'mines', 'apple', 'tower', 'coin', 'dice', 'wheel', 'roulette', 'slots', 'plinko', 'limbo', 'keno', 'scratch', 'hilo', 'dragon', 'baccarat', 'sicbo', 'chests', 'balloon', 'penalty', 'race', 'colors'];
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
      '<button type="button" class="cs-wallet" id="csBal"></button><button type="button" class="cs-help" id="csHelp" aria-label="?">?</button></div>' +
      '<div id="csBody"></div><div class="cs-sheet" id="csSheet" hidden></div></div>';
    document.body.appendChild(m);
    $('closeCasino').style.setProperty('display', 'none', 'important');
    $('closeCasino').addEventListener('click', close);
    $('csBack').addEventListener('click', function () { if (!$('csSheet').hidden) { $('csSheet').hidden = true; return; } if (S.game) home(); else close(); });
    $('csBal').addEventListener('click', function () { if (!guest()) deposit(); });
    $('csHelp').addEventListener('click', function () { if (S.game) help(S.game); });
    m.addEventListener('click', function (e) { if (e.target === m) close(); });
    if (D6.BigPageSwipe) D6.BigPageSwipe('casinoModal');
  }
  function open(game) {
    ensure(); readBal();
    S.stake = 0.1;
    if (D6.App && D6.App.openModal) D6.App.openModal('casinoModal');
    if (game && GI[game]) go(game); else home();
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
    m.classList.remove('in-game'); $('csSheet').hidden = true; $('csHelp').hidden = true;
    paintBal();
    $('csBody').innerHTML = '<div class="cs-tabs2"><button type="button" data-v="games" class="' + (S.view === 'games' ? 'on' : '') + '">' + gicon('dice') + '<span>' + esc(x.gamesTab) + '</span></button>' +
      '<button type="button" data-v="sports" class="' + (S.view === 'sports' ? 'on' : '') + '">' + gicon('sports') + '<span>' + esc(x.sports) + '</span></button></div><div id="csView"></div>';
    $('csBody').querySelectorAll('[data-v]').forEach(function (b) { b.addEventListener('click', function () { home(b.getAttribute('data-v')); }); });
    var v = $('csView');
    if (S.view === 'sports') {
      v.className = 'cs-sports';
      if (D6.Sports && D6.Sports.paint) D6.Sports.paint(v, { guest: guest(), signup: signup, toast: toast, afterPlay: afterPlay, stake: function () { return S.stake; } });
    } else {
      v.className = 'cs-grid';
      v.innerHTML = ORDER.filter(function (k) { return GAMES[k] && GI[k]; }).map(function (k) {
        return '<button type="button" class="cs-g" data-g="' + k + '" style="--tc:' + GI[k][1] + '"><span class="cs-orb">' + gicon(k) + '</span><b>' + esc(name(k)) + '</b></button>';
      }).join('');
      v.querySelectorAll('.cs-g').forEach(function (b) { b.addEventListener('click', function () { go(b.getAttribute('data-g')); }); });
    }
    var box = m.querySelector('.modal-box'); if (box) box.scrollTop = 0;
  }
  function name(k) { var x = X(); return (x.g[k] || T.en.g[k] || [k])[0]; }
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
    m.classList.add('in-game'); $('csSheet').hidden = true; $('csHelp').hidden = false;
    paintBal();
    var body = $('csBody');
    body.innerHTML = '<div class="cs-game cs-' + k + (guest() ? ' is-guest' : '') + '" style="--tc:' + (GI[k] || GI.coin)[1] + '"></div>';
    var box = body.firstChild;
    (GAMES[k] || GAMES.coin)(box, x);
    // nom du jeu : petite étiquette dans l'écran du jeu ; résultat : bannière dans l'écran
    var st = box.querySelector('.cs-stage');
    if (st) {
      var tag = document.createElement('span'); tag.className = 'cs-gname'; tag.innerHTML = gicon(k) + '<b>' + esc(name(k)) + '</b>';
      st.insertBefore(tag, st.firstChild);
      // v2693b (propriétaire) : le résultat reste EN BAS, entre l'écran du jeu et la mise (devant le joueur)
    }
    var mb = m.querySelector('.modal-box'); if (mb) mb.scrollTop = 0;
  }
  /* « ? » : comment on joue (une page, sans défiler) */
  function help(k) {
    var x = X(), r = (RULES[(document.documentElement.lang || 'fr').slice(0, 2)] || RULES.en)[k] || RULES.en[k] || '';
    var sh = $('csSheet');
    sh.innerHTML = '<div class="cs-sheet-in"><span class="cs-orb">' + gicon(k) + '</span><b>' + esc(name(k)) + '</b><p>' + esc(r).replace(/\n/g, '<br>') + '</p><small>' + esc(x.rules) + '</small><button type="button" class="cs-go" id="csSheetOk">' + esc(x.gotIt) + '</button></div>';
    sh.hidden = false;
    $('csSheetOk').addEventListener('click', function () { sh.hidden = true; });
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
      penalty: 'Vise à gauche, au centre ou à droite. Si le gardien plonge ailleurs, c’est but : ×1,44.',
      race: 'Choisis ta voiture parmi 6. Si elle gagne la course : ×5,7.',
      colors: 'Un numéro de 0 à 9 sort. Vert ou Rouge : ×2 · Violet : ×4,5 · un numéro exact : ×9.'
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
      penalty: 'Aim left, centre or right. If the keeper dives elsewhere, it’s a goal: ×1.44.',
      race: 'Pick your car out of 6. If it wins the race: ×5.7.',
      colors: 'A number from 0 to 9 is drawn. Green or Red: ×2 · Violet: ×4.5 · exact number: ×9.'
    }
  };

  /* ---------- les 15 jeux ---------- */
  var GAMES = {};

  GAMES.coin = function (box, x) {
    var side = 0;
    box.innerHTML = '<div class="cs-stage"><div class="coin3d" id="csCoin"><i class="f">' + coinFace(true) + '</i><i class="b">' + coinFace(false) + '</i></div><div class="coin-lbl"><span>' + esc(x.heads) + '</span><span>' + esc(x.tails) + '</span></div></div><div class="cs-res"></div>' +
      stakePanel(x.bet, '<div class="cs-seg"><button type="button" class="on" data-side="0">' + esc(x.heads) + '</button><button type="button" data-side="1">' + esc(x.tails) + '</button></div>');
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
    box.innerHTML = '<div class="cs-stage dice-stage"><b class="dice-roll" id="csRoll">50.00</b><div class="dice-bar"><i id="csDiceWin"></i><em id="csDiceMark"></em></div></div><div class="cs-res"></div>' +
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
      var el = $('csRoll'), t0 = performance.now();
      await new Promise(function (res) { (function f(t) { var k = Math.min(1, (t - t0) / 600); el.textContent = (k < 1 ? Math.random() * 100 : r.view.roll).toFixed(2); if (k < 1) S.raf = requestAnimationFrame(f); else res(); })(t0); });
      $('csDiceMark').style.left = r.view.roll + '%'; $('csDiceMark').className = r.win > 0 ? 'w' : 'l';
      resultLine(box, r, fmt(x.roll, { x: r.view.roll.toFixed(2) }));
    });
  };

  GAMES.limbo = function (box, x) {
    var target = 2;
    box.innerHTML = '<div class="cs-stage limbo-stage"><b class="limbo-n" id="csLimbo">1.00×</b><small id="csLimboT"></small></div><div class="cs-res"></div>' +
      stakePanel(x.bet, '<label class="cs-lbl">' + esc(x.target) + '</label><div class="cs-stake"><input id="csTarget" inputmode="decimal" value="2.00"></div><div class="cs-chips">' + [1.5, 2, 5, 10, 100].map(function (v) { return '<button type="button" data-t="' + v + '">×' + v + '</button>'; }).join('') + '</div>');
    bindStake(box);
    var setT = function (v) { target = Math.max(1.01, Math.min(1000, Math.round((+v || 2) * 100) / 100)); $('csTarget').value = target.toFixed(2); $('csLimboT').textContent = x.target + target.toFixed(2); };
    $('csTarget').addEventListener('change', function () { setT(String(this.value).replace(',', '.')); });
    box.querySelectorAll('[data-t]').forEach(function (b) { b.addEventListener('click', function () { setT(b.getAttribute('data-t')); }); });
    setT(2);
    $('csGo').addEventListener('click', async function () {
      var r = await play('limbo', { target: target }); if (!r) return;
      var el = $('csLimbo'), t0 = performance.now(), end = Math.min(r.view.res, 100000);
      await new Promise(function (res) { (function f(t) { var k = Math.min(1, (t - t0) / 700); el.textContent = (1 + (end - 1) * (1 - Math.pow(1 - k, 3))).toFixed(2) + '×'; if (k < 1) S.raf = requestAnimationFrame(f); else res(); })(t0); });
      el.className = 'limbo-n ' + (r.win > 0 ? 'w' : 'l');
      resultLine(box, r, fmt(x.result, { x: r.view.res.toFixed(2) }));
    });
  };

  // [multiplicateur, chances sur 1000] — même table que le serveur (casino_lib.php CASINO_WHEEL) ; case dessinée à la taille de sa chance
  var WHEEL = [[0.5, 640], [1.2, 500], [0, 630], [1.5, 550], [0.5, 640], [2, 325], [0, 630], [1.2, 500], [0.5, 640], [3, 350], [0, 631], [1.2, 500], [0.5, 640], [5, 120], [1.5, 550], [0, 631], [0.5, 640], [1.2, 500], [2, 325], [10, 50], [50, 8]];
  GAMES.wheel = function (box, x) {
    var rot = 0, out = '', a0 = 0, mids = [];
    var col = { 0: '#1e2a38', 0.5: '#64748b', 1.2: '#2563eb', 1.5: '#0ea5e9', 2: '#16a34a', 3: '#f59e0b', 5: '#f97316', 10: '#e11d48', 50: '#facc15' };
    var pt = function (r, a) { a = a * Math.PI / 180; return (r * Math.sin(a)).toFixed(2) + ' ' + (-r * Math.cos(a)).toFixed(2); };
    WHEEL.forEach(function (s, i) {
      var v = s[0], sw = s[1] / 10000 * 360, a1 = a0 + sw;
      out += '<path d="M0 0 L' + pt(118, a0) + ' A118 118 0 0 1 ' + pt(118, a1) + 'Z" fill="' + col[v] + '" stroke="#0e1621" stroke-width="1.5"/>';
      mids.push(a0 + sw / 2); a0 = a1;
    });
    out = '<circle r="124" fill="#0e1621"/>' + out + '<circle r="118" fill="none" stroke="rgba(255,255,255,.18)" stroke-width="2"/>';
    var legend = [50, 10, 5, 3, 2, 1.5, 1.2, 0.5, 0].map(function (v) { return '<span style="--c:' + col[v] + '">×' + String(v).replace('.', ',') + '</span>'; }).join('');
    box.innerHTML = '<div class="cs-stage"><div class="whl2"><div class="whl2-rot" id="csWheel"><svg viewBox="-125 -125 250 250">' + out + '<circle r="22" fill="#F5B700" stroke="#0e1621" stroke-width="4"/></svg></div><i class="whl2-pin"></i></div><div class="whl-leg">' + legend + '</div></div><div class="cs-res"></div>' + stakePanel();
    bindStake(box);
    $('csGo').addEventListener('click', async function () {
      var r = await play('wheel', {}); if (!r) return;
      var c = mids[r.view.i];
      rot = rot - (rot % 360) + 360 * 5 + (360 - c);
      var w = $('csWheel'); w.style.transition = 'transform 3.6s cubic-bezier(.12,.72,.12,1)'; w.style.transform = 'rotate(' + rot + 'deg)';
      await sleep(3700); resultLine(box, r, '×' + r.mult);
    });
  };

  GAMES.race = function (box, x) {
    var car = 0, cols = ['#EF4444', '#3B82F6', '#22C55E', '#F59E0B', '#A855F7', '#EC4899'];
    var lanes = cols.map(function (c, i) { return '<div class="lane"><em>' + (i + 1) + '</em><span class="car" id="csCar' + i + '" style="--cc:' + c + '">' + carSvg(c, i + 1) + '</span></div>'; }).join('');
    box.innerHTML = '<div class="cs-stage race-stage"><div class="road">' + lanes + '<i class="finish"></i><i class="start"></i></div></div><div class="cs-res"></div>' +
      stakePanel(x.bet, '<label class="cs-lbl">' + esc(x.pickCar) + ' · ×5,7</label><div class="cs-cars">' + cols.map(function (c, i) { return '<button type="button" data-car="' + i + '" class="' + (i ? '' : 'on') + '" style="--cc:' + c + '">' + (i + 1) + '</button>'; }).join('') + '</div>');
    bindStake(box);
    box.querySelectorAll('[data-car]').forEach(function (b) { b.addEventListener('click', function () { car = +b.getAttribute('data-car'); box.querySelectorAll('[data-car]').forEach(function (z) { z.classList.toggle('on', z === b); }); }); });
    $('csGo').addEventListener('click', async function () {
      var r = await play('race', { car: car }); if (!r) return;
      for (var i = 0; i < 6; i++) { var c = $('csCar' + i); c.style.transition = 'none'; c.style.transform = 'translateX(0)'; }
      await sleep(40);
      r.view.order.forEach(function (id, pos) { var c = $('csCar' + id); c.style.transition = 'transform ' + (2.6 + pos * 0.32).toFixed(2) + 's cubic-bezier(.3,.1,.3,1)'; var dist = c.parentElement.clientWidth - c.offsetWidth - 26; c.style.transform = 'translateX(' + dist + 'px)'; });
      await sleep(2700 + 5 * 320);
      resultLine(box, r, '🏁 ' + (r.view.order[0] + 1));
    });
  };
  /* voiture de course vue de dessus (aileron, cockpit, numéro) */
  function carSvg(c, n) {
    return '<svg viewBox="0 0 64 30"><rect x="6" y="2" width="9" height="6" rx="2" fill="#111"/><rect x="6" y="22" width="9" height="6" rx="2" fill="#111"/><rect x="42" y="2" width="9" height="6" rx="2" fill="#111"/><rect x="42" y="22" width="9" height="6" rx="2" fill="#111"/>' +
      '<path d="M4 9c0-2 1.5-3 3.5-3H44c7 0 13 4 16 9-3 5-9 9-16 9H7.5C5.5 24 4 23 4 21z" fill="' + c + '"/><rect x="1" y="5" width="5" height="20" rx="1.5" fill="' + c + '" opacity=".85"/>' +
      '<path d="M30 10h8c3 0 5 2.2 5 5s-2 5-5 5h-8z" fill="#0f172a"/><path d="M32 12h5c1.6 0 2.8 1.3 2.8 3s-1.2 3-2.8 3h-5z" fill="#7dd3fc" opacity=".7"/>' +
      '<path d="M44 7l10 6" stroke="#fff" stroke-width="1.2" opacity=".5"/><circle cx="20" cy="15" r="6" fill="#fff"/><text x="20" y="18.5" text-anchor="middle" font-size="9" font-weight="900" fill="#111">' + (n || '') + '</text></svg>';
  }

  GAMES.roulette = function (box, x) {
    var bet = 'red';
    var opts = [['red', x.red, '×2'], ['black', x.black, '×2'], ['even', x.even, '×2'], ['odd', x.odd, '×2'], ['d1', '1-12', '×3'], ['d2', '13-24', '×3'], ['d3', '25-36', '×3']];
    box.innerHTML = '<div class="cs-stage"><div class="rl-ball" id="csRl">?</div></div><div class="cs-res"></div>' +
      stakePanel(x.bet, '<div class="cs-opts">' + opts.map(function (o, i) { return '<button type="button" data-b="' + o[0] + '" class="' + (i ? '' : 'on') + ' b-' + o[0] + '">' + esc(o[1]) + '<small>' + o[2] + '</small></button>'; }).join('') + '</div>' +
        '<label class="cs-lbl">' + esc(x.number) + ' (0-36) · ×36</label><div class="cs-stake"><input id="csRlNum" inputmode="numeric" placeholder="—"></div>');
    bindStake(box);
    var pick = function (b) { bet = b; box.querySelectorAll('[data-b]').forEach(function (z) { z.classList.toggle('on', z.getAttribute('data-b') === b); }); };
    box.querySelectorAll('[data-b]').forEach(function (b) { b.addEventListener('click', function () { $('csRlNum').value = ''; pick(b.getAttribute('data-b')); }); });
    $('csRlNum').addEventListener('input', function () { var v = parseInt(this.value, 10); if (v >= 0 && v <= 36) pick('n' + v); });
    $('csGo').addEventListener('click', async function () {
      var r = await play('roulette', { bet: bet }); if (!r) return;
      var el = $('csRl'); el.className = 'rl-ball spin';
      for (var i = 0; i < 14; i++) { el.textContent = Math.floor(Math.random() * 37); await sleep(60 + i * 12); }
      el.textContent = r.view.n; el.className = 'rl-ball ' + (r.view.n === 0 ? 'z' : r.view.red ? 'r' : 'k');
      resultLine(box, r);
    });
  };

  var SYM = { gem: '💎', seven: '7️⃣', bell: '🔔', lemon: '🍋', cherry: '🍒', star: '⭐' };
  GAMES.slots = function (box, x) {
    box.innerHTML = '<div class="cs-stage"><div class="slot"><span id="csR0">🍒</span><span id="csR1">💎</span><span id="csR2">7️⃣</span></div>' +
      '<div class="pay">💎💎💎 ×50 · 7️⃣7️⃣7️⃣ ×20 · 🔔🔔🔔 ×10 · 🍋🍋🍋 ×5 · 🍒🍒🍒 ×3 · 🍒🍒 ×1,5</div></div><div class="cs-res"></div>' + stakePanel();
    bindStake(box);
    var keys = Object.keys(SYM);
    $('csGo').addEventListener('click', async function () {
      var r = await play('slots', {}); if (!r) return;
      for (var t = 0; t < 12; t++) { for (var i = 0; i < 3; i++) if (t < 6 + i * 3) $('csR' + i).textContent = SYM[keys[Math.floor(Math.random() * 6)]]; else $('csR' + i).textContent = SYM[r.view.reels[i]]; await sleep(80); }
      for (var j = 0; j < 3; j++) $('csR' + j).textContent = SYM[r.view.reels[j]];
      resultLine(box, r, r.mult ? '×' + r.mult : '');
    });
  };

  var PLINKO = [12, 3, 1.4, 0.6, 0.4, 0.6, 1.4, 3, 12];
  GAMES.plinko = function (box, x) {
    var pegs = '';
    for (var row = 0; row < 8; row++) for (var c = 0; c <= row + 1; c++) pegs += '<circle cx="' + (150 + (c - (row + 1) / 2) * 30) + '" cy="' + (30 + row * 28) + '" r="3.2" fill="#c7d2fe"/>';
    var bins = PLINKO.map(function (m, i) { return '<g><rect x="' + (150 + (i - 4) * 30 - 14) + '" y="262" width="28" height="22" rx="5" fill="' + (m >= 3 ? '#EC4899' : m >= 1 ? '#F59E0B' : '#334155') + '"/><text x="' + (150 + (i - 4) * 30) + '" y="277" text-anchor="middle" font-size="9" font-weight="800" fill="#fff">' + m + '</text></g>'; }).join('');
    box.innerHTML = '<div class="cs-stage"><svg viewBox="0 0 300 290" class="plk">' + pegs + bins + '<circle id="csBall" cx="150" cy="10" r="7" fill="#FFD27A" stroke="#fff" stroke-width="2"/></svg></div><div class="cs-res"></div>' + stakePanel();
    bindStake(box);
    $('csGo').addEventListener('click', async function () {
      var r = await play('plinko', {}); if (!r) return;
      var ball = $('csBall'), pos = 0;
      ball.setAttribute('cx', 150); ball.setAttribute('cy', 10);
      for (var row = 0; row < 8; row++) { pos += r.view.path[row]; await sleep(140); ball.setAttribute('cx', 150 + (pos - (row + 1) / 2) * 30); ball.setAttribute('cy', 30 + row * 28 + 14); }
      await sleep(160); ball.setAttribute('cy', 268);
      resultLine(box, r, '×' + r.mult);
    });
  };

  GAMES.keno = function (box, x) {
    var picks = [];
    box.innerHTML = '<div class="cs-stage"><div class="keno" id="csKeno">' + Array.from({ length: 20 }, function (_, i) { return '<button type="button" data-k="' + (i + 1) + '">' + (i + 1) + '</button>'; }).join('') + '</div>' +
      '<div class="pay">1 ×0,6 · 2 ×3,5 · 3 ×25</div><small class="cs-lbl" id="csKn"></small></div><div class="cs-res"></div>' + stakePanel();
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

  var SCR = { crown: '👑', diamond: '💎', star: '⭐', clover: '🍀', coin: '🪙', heart: '❤️' };
  /* grattage : le joueur gratte avec son doigt (ou la souris) ; tout se découvre seul après quelques secondes */
  GAMES.scratch = function (box, x) {
    box.innerHTML = '<div class="cs-stage"><div class="scr-w"><div class="scr" id="csScr">' + Array.from({ length: 9 }, function () { return '<span></span>'; }).join('') + '</div><canvas class="scr-cv" id="csScrCv"></canvas></div>' +
      '<div class="pay">👑 ×20 · 💎 ×5 · ⭐ ×2 · 🍀 ×1</div></div><div class="cs-res"></div>' + stakePanel(x.bet);
    bindStake(box);
    var cv = $('csScrCv'), ctx = cv.getContext('2d'), cur = null, done = true, autoT = 0;
    var cover = function () {
      var w = cv.clientWidth, h = cv.clientHeight; cv.width = w; cv.height = h;
      var gr = ctx.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#d4d4d8'); gr.addColorStop(.5, '#a1a1aa'); gr.addColorStop(1, '#e4e4e7');
      ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = gr; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.font = '900 ' + Math.round(w / 9) + 'px system-ui'; ctx.textAlign = 'center'; ctx.fillText('OROLADO', w / 2, h / 2 + w / 30);
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
      box.querySelectorAll('.scr span').forEach(function (c, i) { c.textContent = SCR[r.view.grid[i]]; });
      cover();
      $('csGo').textContent = x.revealAll;
      clearTimeout(autoT); autoT = setTimeout(reveal, 7000); // découvert tout seul après 7 s
      var wait = setInterval(function () { if (done) { clearInterval(wait); $('csGo').textContent = x.bet; } }, 300);
    });
  };

  GAMES.penalty = function (box, x) {
    var aim = 1;
    var net = ''; for (var i = 1; i < 14; i++) net += '<path d="M' + (60 + i * 13) + ' 34V112"/>'; for (var j = 1; j < 6; j++) net += '<path d="M60 ' + (34 + j * 13) + 'H240"/>';
    var pitch = '<svg class="pitch" viewBox="0 0 300 300" preserveAspectRatio="none"><g stroke="rgba(255,255,255,.18)" stroke-width="1">' + net + '</g>' +
      '<path d="M60 112V34H240V112" fill="none" stroke="#fff" stroke-width="5" stroke-linejoin="round"/><path d="M0 112H300" stroke="rgba(255,255,255,.5)" stroke-width="2"/>' +
      '<path d="M30 300L70 112M270 300L230 112" stroke="rgba(255,255,255,.35)" stroke-width="2"/><path d="M85 185H215" stroke="rgba(255,255,255,.35)" stroke-width="2"/><circle cx="150" cy="250" r="3" fill="#fff"/>' +
      [0, 1, 2].map(function (z) { return '<rect class="pz" data-z="' + z + '" x="' + (62 + z * 59) + '" y="36" width="57" height="74" fill="rgba(255,255,255,0)"/>'; }).join('') + '</svg>';
    var keeper = '<svg viewBox="0 0 70 90"><circle cx="35" cy="14" r="10" fill="#f1c27d"/><path d="M27 10a8 6 0 0 1 16 0z" fill="#111"/><path d="M20 26h30l4 34H16z" fill="#f59e0b"/><path d="M20 28L4 16M50 28l16-12" stroke="#f59e0b" stroke-width="8" stroke-linecap="round"/><circle cx="4" cy="15" r="6" fill="#22c55e"/><circle cx="66" cy="15" r="6" fill="#22c55e"/><path d="M22 60l-4 26M48 60l4 26" stroke="#111827" stroke-width="9" stroke-linecap="round"/><text x="35" y="48" text-anchor="middle" font-size="13" font-weight="900" fill="#111">1</text></svg>';
    var ball = '<svg viewBox="0 0 34 34"><circle cx="17" cy="17" r="16" fill="#fff" stroke="#111" stroke-width="1.5"/><path d="M17 9l6 4.3-2.3 7.2h-7.4L11 13.3z" fill="#111"/><path d="M17 9V2M23 13.3l6.5-2M20.7 20.5l4 5.7M13.3 20.5l-4 5.7M11 13.3l-6.5-2" stroke="#111" stroke-width="1.4"/></svg>';
    box.innerHTML = '<div class="cs-stage pen2">' + pitch + '<span class="kp2" id="csKp">' + keeper + '</span><span class="ball2" id="csPb">' + ball + '</span><b class="pen-msg" id="csPm"></b></div><div class="cs-res"></div>' +
      stakePanel(x.bet, '<label class="cs-lbl">' + esc(x.aim) + ' · ×1,44</label><div class="cs-seg"><button type="button" data-aim="0">← ' + esc(x.left) + '</button><button type="button" data-aim="1" class="on">' + esc(x.center) + '</button><button type="button" data-aim="2">' + esc(x.right) + ' →</button></div>');
    bindStake(box);
    var setAim = function (a) { aim = a; box.querySelectorAll('[data-aim]').forEach(function (z) { z.classList.toggle('on', +z.getAttribute('data-aim') === a); }); };
    box.querySelectorAll('[data-aim]').forEach(function (b) { b.addEventListener('click', function () { setAim(+b.getAttribute('data-aim')); }); });
    box.querySelectorAll('.pz').forEach(function (z) { z.addEventListener('click', function () { setAim(+z.getAttribute('data-z')); }); });
    $('csGo').addEventListener('click', async function () {
      var r = await play('penalty', { aim: aim }); if (!r) return;
      var pb = $('csPb'), kp = $('csKp'), st = box.querySelector('.pen2'), w = st.clientWidth, h = st.clientHeight, pm = $('csPm');
      pm.className = 'pen-msg'; pb.style.transition = 'none'; kp.style.transition = 'none'; pb.style.transform = 'none'; kp.style.transform = 'none';
      await sleep(40);
      pb.style.transition = ''; kp.style.transition = '';
      var dx = (r.view.aim - 1) * w * 0.2, dy = -(h * 0.62);
      pb.style.transform = 'translate(' + dx + 'px,' + dy + 'px) scale(.62) rotate(540deg)';
      var kdx = (r.view.keeper - 1) * w * 0.2;
      kp.style.transform = 'translateX(' + kdx + 'px) rotate(' + ((r.view.keeper - 1) * 52) + 'deg)';
      await sleep(620);
      pm.textContent = r.win > 0 ? x.goal : x.saved; pm.className = 'pen-msg on';
      resultLine(box, r, r.win > 0 ? x.goal : x.saved);
    });
  };

  GAMES.colors = function (box, x) {
    var bet = 'green';
    var nums = Array.from({ length: 10 }, function (_, i) { var c = [1, 3, 7, 9].indexOf(i) >= 0 ? 'g' : [2, 4, 6, 8].indexOf(i) >= 0 ? 'r' : (i === 0 ? 'rv' : 'gv'); return '<button type="button" data-b="n' + i + '" class="cn ' + c + '">' + i + '</button>'; }).join('');
    box.innerHTML = '<div class="cs-stage"><div class="clr-ball" id="csClr">?</div></div><div class="cs-res"></div>' +
      stakePanel(x.bet, '<div class="cs-opts three"><button type="button" data-b="green" class="on b-green">' + esc(x.green) + '<small>×2</small></button><button type="button" data-b="violet" class="b-violet">' + esc(x.violet) + '<small>×4,5</small></button><button type="button" data-b="red" class="b-red">' + esc(x.red) + '<small>×2</small></button></div><div class="cs-nums">' + nums + '</div><small class="cs-lbl">' + esc(x.number) + ' ×9</small>');
    bindStake(box);
    box.querySelectorAll('[data-b]').forEach(function (b) { b.addEventListener('click', function () { bet = b.getAttribute('data-b'); box.querySelectorAll('[data-b]').forEach(function (z) { z.classList.toggle('on', z === b); }); }); });
    $('csGo').addEventListener('click', async function () {
      var r = await play('colors', { bet: bet }); if (!r) return;
      var el = $('csClr');
      for (var i = 0; i < 10; i++) { el.textContent = i; await sleep(70); }
      var n = r.view.n; el.textContent = n;
      el.className = 'clr-ball ' + ([1, 3, 7, 9].indexOf(n) >= 0 ? 'g' : [2, 4, 6, 8].indexOf(n) >= 0 ? 'r' : (n === 0 ? 'rv' : 'gv'));
      resultLine(box, r);
    });
  };

  /* --- jeux en plusieurs étapes : avion, mines, hi-lo (réel ou démo ; visiteur → inscription) --- */
  function needAccount(box, x) {
    if (!guest()) return false;
    box.innerHTML = '<div class="cs-try big"><span>' + esc(x.tryNote) + '</span><button type="button" id="csSign2">' + esc(x.signup) + '</button></div>';
    $('csSign2').addEventListener('click', function () { close(); if (D6.App && D6.App.showAuth) D6.App.showAuth('register'); });
    return true;
  }

  /* --- 3 jeux « ça monte » (même calcul serveur, décor différent) : Avion, Jet, Fusée --- */
  var CRASH_THEME = {
    crash: { col: '#ff2d55', cls: 'th-plane', sprite: function () { return planeSvg(); }, w: 78, h: 48, rot: -12 },
    jet: { col: '#a855f7', cls: 'th-jet', sprite: function () { return jetSvg(); }, w: 62, h: 74, rot: 0 },
    rocket: { col: '#22d3ee', cls: 'th-rocket', sprite: function () { return rocketSvg(); }, w: 46, h: 78, rot: 28 }
  };
  function makeCrash(game) {
    return function (box, x) {
      var th = CRASH_THEME[game], g = null, off = 0;
      var MULT = function (s) { return Math.max(1, Math.floor(Math.exp(0.08 * Math.max(0, s)) * 100) / 100); };
      var stars = ''; for (var i = 0; i < 26; i++) stars += '<circle cx="' + ((i * 137 + 31) % 300) + '" cy="' + ((i * 71 + i * i * 13 + 7) % 165) + '" r="' + (i % 3 ? 0.8 : 1.3) + '" fill="#fff" opacity="' + (0.25 + (i % 4) * 0.12) + '"/>';
      box.innerHTML = '<div class="cs-stage crash-stage ' + th.cls + '"><svg viewBox="0 0 300 170" preserveAspectRatio="none" class="crash-sky"><defs><linearGradient id="csArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + th.col + '" stop-opacity=".5"/><stop offset="1" stop-color="' + th.col + '" stop-opacity="0"/></linearGradient></defs>' +
        stars + '<g stroke="rgba(255,255,255,.05)">' + [34, 68, 102, 136].map(function (y) { return '<path d="M0 ' + y + 'H300"/>'; }).join('') + '</g>' +
        '<path id="csArea" d="M10 160" fill="url(#csArea)"/><path id="csTrail" d="M10 160" fill="none" stroke="' + th.col + '" stroke-width="3.2" stroke-linecap="round"/></svg>' +
        '<span class="plane" id="csPlane" style="width:' + th.w + 'px;height:' + th.h + 'px">' + th.sprite() + '</span><b class="crash-n" id="csCm">1.00×</b><small class="crash-hint" id="csCs"></small></div><div class="cs-res"></div>' +
        (guest() ? '<div id="csNeed"></div>' : stakePanel(x.bet, '<label class="cs-lbl">' + esc(x.auto) + '</label><div class="cs-stake"><input id="csAuto" inputmode="decimal" placeholder="—"></div>'));
      if (guest()) { needAccount($('csNeed'), x); return; }
      bindStake(box);
      var btn = $('csGo'), plane = $('csPlane');
      var draw = function (m, s) {
        $('csCm').textContent = m.toFixed(2) + '×';
        var px = Math.min(270, 10 + s * 18), py = Math.max(16, 160 - (m - 1) * 40);
        var st = $('csTrail').ownerSVGElement.getBoundingClientRect(), kx = st.width / 300, ky = st.height / 170;
        var d = 'M10 160 Q ' + ((10 + px) / 2) + ' 160 ' + px + ' ' + py;
        $('csTrail').setAttribute('d', d); $('csArea').setAttribute('d', d + ' L' + px + ' 170 L10 170 Z');
        plane.style.transform = 'translate(' + (px * kx - th.w * 0.55) + 'px,' + (py * ky - th.h * 0.75) + 'px) rotate(' + th.rot + 'deg)';
      };
      var finish = function (r) {
        stopAll(); g = r;
        if (!(r.out > 0)) { plane.classList.add('gone'); }
        $('csCm').className = 'crash-n ' + (r.out > 0 ? 'w' : 'l');
        $('csCm').textContent = (r.out > 0 ? r.out : r.c).toFixed(2) + '×';
        resultLine(box, r, r.out > 0 ? fmt(x.cashed, { x: r.out.toFixed(2), w: m2(r.win) }) : fmt(x.boom, { x: r.c.toFixed(2) }));
        btn.textContent = x.bet; btn.classList.remove('cash'); btn.disabled = false;
      };
      var fly = function (r) {
        g = r; off = r.now - Date.now() / 1000;
        plane.classList.remove('gone');
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

  /* --- Pomme de la fortune : 10 étages, 5 pommes par étage, 1 pourrie ; on encaisse quand on veut --- */
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
          if (k < r.k && r.picks[k] === c) { b.className = 'good'; b.innerHTML = appleSvg(true); }
          if (r.done && r.bad) {
            var bk = [].concat(r.bad[k]);
            if (bk.indexOf(c) >= 0 && (k <= r.k)) { b.className = (r.boom === k) ? 'rot boom' : 'rot'; b.innerHTML = appleSvg(false); }
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
    box.innerHTML = '<div class="cs-stage"><div class="mn" id="csMn">' + Array.from({ length: 25 }, function (_, i) { return '<button type="button" data-c="' + i + '"></button>'; }).join('') + '</div><small class="cs-lbl" id="csMnInfo"></small></div><div class="cs-res"></div>' +
      (guest() ? '<div id="csNeed"></div>' : stakePanel(x.bet, '<label class="cs-lbl">' + esc(x.minesN) + '</label><div class="cs-seg">' + [1, 3, 5, 10].map(function (n) { return '<button type="button" data-m="' + n + '" class="' + (n === 3 ? 'on' : '') + '">' + n + '</button>'; }).join('') + '</div>'));
    if (guest()) { needAccount($('csNeed'), x); return; }
    bindStake(box);
    var btn = $('csGo');
    box.querySelectorAll('.cs-seg [data-m]').forEach(function (b) { b.addEventListener('click', function () { if (g && !g.done) return; mines = +b.getAttribute('data-m'); box.querySelectorAll('.cs-seg [data-m]').forEach(function (z) { z.classList.toggle('on', z === b); }); }); });
    var paint = function (r) {
      g = r;
      box.querySelectorAll('#csMn button').forEach(function (b) {
        var c = +b.getAttribute('data-c'); b.className = ''; b.textContent = '';
        if (r.open && r.open.indexOf(c) >= 0) { b.className = 'ok'; b.textContent = '💎'; }
        if (r.done && r.mines && r.mines.indexOf(c) >= 0) { b.className = c === r.boom ? 'boom' : 'mine'; b.textContent = '💣'; }
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

  var CARD = ['', 'A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  GAMES.hilo = function (box, x) {
    var g = null;
    box.innerHTML = '<div class="cs-stage"><div class="hl"><span class="card" id="csCard">?</span></div><small class="cs-lbl" id="csHlInfo"></small><div class="hl-row" id="csHlRow"></div></div><div class="cs-res"></div>' +
      (guest() ? '<div id="csNeed"></div>' : '<div class="cs-opts two" id="csHlBtns" hidden><button type="button" id="csHi"></button><button type="button" id="csLo"></button></div>' + stakePanel());
    if (guest()) { needAccount($('csNeed'), x); return; }
    bindStake(box);
    var btn = $('csGo');
    var paint = function (r) {
      g = r;
      $('csCard').textContent = CARD[r.card] || '?';
      $('csHlRow').innerHTML = (r.cards || []).slice(0, -1).map(function (c) { return '<span>' + CARD[c] + '</span>'; }).join('');
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

  /* ===== v2693 — 6 nouveaux jeux ===== */
  var SUITS = ['♠', '♥', '♦', '♣'];
  function cardHtml(v, red, big) {
    var r = ['', 'A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'][v] || '?';
    var s = SUITS[(v + (red ? 1 : 0)) % 4];
    return '<span class="pc' + (big ? ' big' : '') + (s === '♥' || s === '♦' ? ' rd' : '') + '"><b>' + r + '</b><i>' + s + '</i></span>';
  }
  GAMES.dragon = function (box, x) {
    var bet = 'dragon';
    box.innerHTML = '<div class="cs-stage dt-stage"><div class="dt"><div class="dt-side d"><em>🐉</em><b>' + esc(x.dragonN) + '</b><div id="csDtD" class="dt-card">' + cardBack() + '</div></div><span class="dt-vs">VS</span><div class="dt-side t"><em>🐯</em><b>' + esc(x.tigerN) + '</b><div id="csDtT" class="dt-card">' + cardBack() + '</div></div></div></div><div class="cs-res"></div>' +
      stakePanel(x.bet, '<div class="cs-opts three"><button type="button" data-b="dragon" class="on">🐉 ' + esc(x.dragonN) + '<small>×2</small></button><button type="button" data-b="tie">' + esc(x.tie) + '<small>×12</small></button><button type="button" data-b="tiger">🐯 ' + esc(x.tigerN) + '<small>×2</small></button></div>');
    bindStake(box);
    box.querySelectorAll('[data-b]').forEach(function (b) { b.addEventListener('click', function () { bet = b.getAttribute('data-b'); box.querySelectorAll('[data-b]').forEach(function (z) { z.classList.toggle('on', z === b); }); }); });
    $('csGo').addEventListener('click', async function () {
      var r = await play('dragon', { bet: bet }); if (!r) return;
      $('csDtD').innerHTML = cardBack(); $('csDtT').innerHTML = cardBack();
      await sleep(250); $('csDtD').innerHTML = cardHtml(r.view.d, false, true);
      await sleep(450); $('csDtT').innerHTML = cardHtml(r.view.t, true, true);
      resultLine(box, r, r.view.d === r.view.t ? x.tie : '');
    });
  };
  function cardBack() { return '<span class="pc back"></span>'; }
  GAMES.baccarat = function (box, x) {
    var bet = 'player';
    box.innerHTML = '<div class="cs-stage bc-stage"><div class="bc"><div class="bc-h"><b>' + esc(x.player) + ' <i id="csBcTp"></i></b><div id="csBcP" class="bc-cards"></div></div><div class="bc-h"><b>' + esc(x.banker) + ' <i id="csBcTb"></i></b><div id="csBcB" class="bc-cards"></div></div></div></div><div class="cs-res"></div>' +
      stakePanel(x.bet, '<div class="cs-opts three"><button type="button" data-b="player" class="on">' + esc(x.player) + '<small>×1,96</small></button><button type="button" data-b="tie">' + esc(x.tie) + '<small>×9</small></button><button type="button" data-b="banker">' + esc(x.banker) + '<small>×1,92</small></button></div>');
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
    return '<svg viewBox="0 0 24 24"><rect x="1" y="1" width="22" height="22" rx="5" fill="#fff"/>' + P.map(function (p) { return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="2.2" fill="' + (n === 1 ? '#e11d48' : '#1f2937') + '"/>'; }).join('') + '</svg>';
  }
  GAMES.sicbo = function (box, x) {
    var bet = 'small';
    box.innerHTML = '<div class="cs-stage"><div class="sb" id="csSb">' + [1, 2, 3].map(function (n) { return '<span class="die">' + dieSvg(n * 2) + '</span>'; }).join('') + '</div><b class="sb-sum" id="csSbS"></b></div><div class="cs-res"></div>' +
      stakePanel(x.bet, '<div class="cs-opts two"><button type="button" data-b="small" class="on">' + esc(x.small) + ' (4–10)<small>×2</small></button><button type="button" data-b="big">' + esc(x.big) + ' (11–17)<small>×2</small></button></div>');
    bindStake(box);
    box.querySelectorAll('[data-b]').forEach(function (b) { b.addEventListener('click', function () { bet = b.getAttribute('data-b'); box.querySelectorAll('[data-b]').forEach(function (z) { z.classList.toggle('on', z === b); }); }); });
    $('csGo').addEventListener('click', async function () {
      var r = await play('sicbo', { bet: bet }); if (!r) return;
      var d = box.querySelectorAll('#csSb .die');
      for (var t = 0; t < 9; t++) { d.forEach(function (e) { e.innerHTML = dieSvg(1 + Math.floor(Math.random() * 6)); e.classList.toggle('roll'); }); await sleep(70); }
      d.forEach(function (e, i) { e.innerHTML = dieSvg(r.view.dice[i]); e.classList.remove('roll'); });
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
  GAMES.chests = function (box, x) {
    var pick = 1;
    box.innerHTML = '<div class="cs-stage"><div class="ch" id="csCh">' + [0, 1, 2].map(function (i) { return '<button type="button" data-c="' + i + '" class="' + (i === 1 ? 'on' : '') + '">' + chestSvg(false) + '</button>'; }).join('') + '</div><small class="cs-lbl">' + esc(x.pickChest) + ' · ×2,85</small></div><div class="cs-res"></div>' + stakePanel(x.bet);
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
  GAMES.tower = function (box, x) {
    var g = null, rows = '';
    var mult = function (k) { return k < 1 ? 0 : Math.floor(0.97 / Math.pow(2 / 3, k) * 100) / 100; };
    for (var r = 7; r >= 0; r--) rows += '<div class="tw-row" data-row="' + r + '"><em>×' + mult(r + 1).toFixed(2) + '</em>' + [0, 1, 2].map(function (c) { return '<button type="button" data-c="' + c + '"></button>'; }).join('') + '</div>';
    box.innerHTML = '<div class="cs-stage tw-stage"><div class="tw" id="csTw">' + rows + '</div></div><div class="cs-res"></div>' + (guest() ? '<div id="csNeed"></div>' : stakePanel(x.bet));
    if (guest()) { needAccount($('csNeed'), x); return; }
    bindStake(box);
    var btn = $('csGo');
    var paint = function (r) {
      g = r;
      box.querySelectorAll('.tw-row').forEach(function (row) {
        var k = +row.getAttribute('data-row');
        row.classList.toggle('cur', !r.done && k === r.k); row.classList.toggle('past', k < r.k);
        row.querySelectorAll('button').forEach(function (b) {
          var c = +b.getAttribute('data-c'); b.className = ''; b.textContent = '';
          if (k < r.k && r.picks[k] === c) { b.className = 'good'; b.textContent = '💎'; }
          if (r.done && r.traps && r.traps[k] === c && k <= r.k) { b.className = (r.boom === k) ? 'trap boom' : 'trap'; b.textContent = '💀'; }
        });
      });
      if (r.done) { resultLine(box, r, r.win > 0 ? '×' + mult(r.k).toFixed(2) : ''); btn.textContent = x.bet; btn.classList.remove('cash'); }
      else { btn.classList.add('cash'); btn.textContent = r.k ? x.cashout + ' ' + m2(r.stake * r.mult) + ' $' : x.open; }
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
  GAMES.balloon = function (box, x) {
    var g = null;
    box.innerHTML = '<div class="cs-stage bl-stage"><div class="bl" id="csBl"><svg viewBox="0 0 100 130"><defs><radialGradient id="blG" cx="35%" cy="30%" r="70%"><stop offset="0" stop-color="#fda4af"/><stop offset=".6" stop-color="#e11d48"/><stop offset="1" stop-color="#881337"/></radialGradient></defs><ellipse cx="50" cy="52" rx="40" ry="48" fill="url(#blG)"/><ellipse cx="36" cy="32" rx="9" ry="14" fill="#fff" opacity=".35"/><path d="M46 99l4 6 4-6z" fill="#881337"/><path d="M50 105c-4 8 6 14 0 24" stroke="#e2e8f0" stroke-width="1.5" fill="none"/></svg></div><b class="crash-n" id="csBlM">1.00×</b></div><div class="cs-res"></div>' +
      (guest() ? '<div id="csNeed"></div>' : stakePanel(x.bet, '<button type="button" class="cs-pump" id="csPump" disabled>💨 ' + esc(x.pump) + '</button>'));
    if (guest()) { needAccount($('csNeed'), x); return; }
    bindStake(box);
    var btn = $('csGo'), pump = $('csPump'), bl = $('csBl');
    var paint = function (r) {
      g = r;
      var sc = 1 + Math.min(1.2, r.k * 0.07);
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
