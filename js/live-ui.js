/* v2689 — Live : vrais logos dessinés (D6.LiveIcon), belle page « inscris-toi » par tuile (D6.LiveGuest),
   et grandes pages qu'on ferme en glissant vers le bas (téléphone). Aucune animation qui tourne en continu. */
(function (D6) {
  'use strict';
  // [haut, bas, détail] — dégradé de l'icône
  var PAL = {
    news: ['#5AB0FF', '#2457E6', '#1d3fae'], friends: ['#FF86BE', '#E0306F', '#a11d50'], groups: ['#B993FF', '#6B3BE3', '#4a24a8'],
    duel: ['#FFC95A', '#F2601C', '#a8400c'], chat: ['#4BE3C7', '#0E9A8A', '#0a6a60'], myid: ['#7FD8FF', '#3A6BF0', '#2747a8'],
    record: ['#FFE07A', '#E39417', '#9a5e06'], stats: ['#6FEA95', '#17A156', '#0d6b38'], badges: ['#FF9A6B', '#E3346A', '#a01f48'],
    gifts: ['#FF7BD9', '#8B3CFF', '#5c22b0'], learn: ['#FFC07A', '#E2572A', '#9c3a17'], quiz: ['#C79BFF', '#7B3BE6', '#5222a8'],
    wheel: ['#FFD86B', '#FF5E7E', '#b8324f'], levels: ['#7CF2E0', '#2E8CF0', '#1d5aa8'], send: ['#9BF27A', '#16A37A', '#0c6b4f'],
    target: ['#FF8A8A', '#E5334B', '#9e1c30'], invite: ['#6BEFA6', '#0F9F63', '#0a6a42'], bonus: ['#FFD86B', '#F28C1C', '#a8560c'], jauge: ['#7CE7FF', '#7B3BE6', '#4a24a8']
  };
  var G = {
    news: '<rect x="10" y="13" width="23" height="23" rx="3.5" fill="W"/><path d="M33 18h2.6a2.2 2.2 0 0 1 2.2 2.2v12.3a3.5 3.5 0 0 1-3.5 3.5H31" fill="none" stroke="W" stroke-width="2.6"/><rect x="13.5" y="17" width="16" height="3.4" rx="1.2" fill="A"/><rect x="13.5" y="23" width="7" height="7" rx="1.4" fill="A" opacity=".55"/><rect x="22.6" y="23.2" width="7" height="2" rx="1" fill="A" opacity=".6"/><rect x="22.6" y="27.4" width="7" height="2" rx="1" fill="A" opacity=".6"/><rect x="13.5" y="32" width="16" height="2" rx="1" fill="A" opacity=".45"/>',
    friends: '<circle cx="30" cy="18.5" r="5" fill="W" opacity=".72"/><path d="M22.5 34.5c.4-5.4 3.6-8.6 7.5-8.6s7.6 3.2 8 8.6z" fill="W" opacity=".72"/><circle cx="19.5" cy="19.5" r="6" fill="W"/><path d="M9 36.5c0-6.4 4.6-10.4 10.5-10.4S30 30.1 30 36.5z" fill="W"/>',
    groups: '<circle cx="13.5" cy="20" r="4.3" fill="W" opacity=".66"/><path d="M5.8 34.5c0-4.9 3.3-8 7.7-8s7.7 3.1 7.7 8z" fill="W" opacity=".66"/><circle cx="34.5" cy="20" r="4.3" fill="W" opacity=".66"/><path d="M26.8 34.5c0-4.9 3.3-8 7.7-8s7.7 3.1 7.7 8z" fill="W" opacity=".66"/><circle cx="24" cy="17.5" r="5.6" fill="W"/><path d="M14 37c0-6.1 4.4-9.8 10-9.8S34 30.9 34 37z" fill="W"/>',
    duel: '<g stroke="W" stroke-linecap="round" fill="none"><path d="M12.5 11.5l17.5 17.5" stroke-width="3.4"/><path d="M35.5 11.5L18 29" stroke-width="3.4"/><path d="M27.5 33.5l6-6M14.5 27.5l6 6" stroke-width="3"/><path d="M32.5 32.5l3.4 3.4M15.5 32.5l-3.4 3.4" stroke-width="3.2"/></g><circle cx="37.3" cy="37.3" r="2.3" fill="W"/><circle cx="10.7" cy="37.3" r="2.3" fill="W"/>',
    chat: '<path d="M12 13.5h24a3.5 3.5 0 0 1 3.5 3.5v12.5a3.5 3.5 0 0 1-3.5 3.5H22.5l-7 5.5V33H12a3.5 3.5 0 0 1-3.5-3.5V17a3.5 3.5 0 0 1 3.5-3.5z" fill="W"/><circle cx="17" cy="23.3" r="2.3" fill="A"/><circle cx="24" cy="23.3" r="2.3" fill="A"/><circle cx="31" cy="23.3" r="2.3" fill="A"/>',
    myid: '<rect x="7.5" y="12.5" width="33" height="23" rx="4" fill="W"/><circle cx="16.5" cy="21.5" r="3.7" fill="A"/><path d="M11 31c.4-3 2.6-4.9 5.5-4.9S21.6 28 22 31z" fill="A"/><rect x="25" y="18.5" width="11.5" height="2.5" rx="1.25" fill="A" opacity=".75"/><rect x="25" y="23.5" width="8" height="2.2" rx="1.1" fill="A" opacity=".5"/><rect x="25" y="28" width="10" height="2.2" rx="1.1" fill="A" opacity=".5"/>',
    record: '<path d="M16 10.5h16v8a8 8 0 0 1-16 0z" fill="W"/><path d="M16 13.5h-4.4v2.3a5 5 0 0 0 5 5M32 13.5h4.4v2.3a5 5 0 0 1-5 5" fill="none" stroke="W" stroke-width="2.6" stroke-linecap="round"/><rect x="22" y="26" width="4" height="5" fill="W"/><rect x="16" y="31" width="16" height="5.5" rx="2" fill="W"/><path d="M24 13.4l1.3 2.7 2.9.4-2.1 2 .5 2.9-2.6-1.4-2.6 1.4.5-2.9-2.1-2 2.9-.4z" fill="A"/>',
    stats: '<rect x="9.5" y="26" width="7.5" height="11" rx="2" fill="W" opacity=".78"/><rect x="20.3" y="19.5" width="7.5" height="17.5" rx="2" fill="W" opacity=".9"/><rect x="31" y="13" width="7.5" height="24" rx="2" fill="W"/><path d="M9.8 19.5l6.6-6.2 4 3.4 6.4-5.9" fill="none" stroke="W" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>',
    badges: '<path d="M15.5 8.5h6.5l4 10.5h-6.5zM32.5 8.5H26l-4 10.5h6.5z" fill="W" opacity=".7"/><circle cx="24" cy="28" r="10.3" fill="W"/><circle cx="24" cy="28" r="7.3" fill="none" stroke="A" stroke-width="1.4" opacity=".45"/><path d="M24 22.4l1.7 3.5 3.8.5-2.8 2.7.7 3.8-3.4-1.8-3.4 1.8.7-3.8-2.8-2.7 3.8-.5z" fill="A"/>',
    gifts: '<path d="M24 19.5c-2-4.6-8.2-6.6-9.7-3.5S19 19.5 24 19.5zm0 0c2-4.6 8.2-6.6 9.7-3.5S29 19.5 24 19.5z" fill="W"/><rect x="9.5" y="19.5" width="29" height="7.5" rx="2" fill="W"/><rect x="11.5" y="27" width="25" height="11" rx="2" fill="W" opacity=".9"/><rect x="22" y="19.5" width="4" height="18.5" fill="A"/>',
    learn: '<path d="M24 15.2c-3.5-2.6-8.6-3.4-14.2-2.4v21.4c5.6-1 10.7-.2 14.2 2.4z" fill="W"/><path d="M24 15.2c3.5-2.6 8.6-3.4 14.2-2.4v21.4c-5.6-1-10.7-.2-14.2 2.4z" fill="W" opacity=".8"/><path d="M13.5 18.5c2.8-.4 5.4 0 7.5 1M13.5 23c2.8-.4 5.4 0 7.5 1M13.5 27.5c2.8-.4 5.4 0 7.5 1" stroke="A" stroke-width="1.6" stroke-linecap="round" fill="none" opacity=".6"/>',
    quiz: '<path d="M24 8.5a10.2 10.2 0 0 0-6.1 18.4c1.2.9 1.9 2 1.9 3.4V32h8.4v-1.7c0-1.4.7-2.5 1.9-3.4A10.2 10.2 0 0 0 24 8.5z" fill="W"/><rect x="19.8" y="33.4" width="8.4" height="2.7" rx="1.35" fill="W"/><rect x="21" y="37.2" width="6" height="2.5" rx="1.25" fill="W"/><path d="M21 16.4a3.1 3.1 0 1 1 4.5 2.8c-1 .5-1.5 1.2-1.5 2.3v.7" fill="none" stroke="A" stroke-width="2.3" stroke-linecap="round"/><circle cx="24" cy="25.6" r="1.5" fill="A"/>',
    wheel: '<circle cx="24" cy="26" r="12.8" fill="W"/><g fill="A" opacity=".55"><path d="M24 26V13.2a12.8 12.8 0 0 1 11.1 6.4z"/><path d="M24 26l-11.1 6.4a12.8 12.8 0 0 1 0-12.8z"/><path d="M24 26v12.8a12.8 12.8 0 0 0 11.1-6.4z"/></g><circle cx="24" cy="26" r="3.2" fill="A"/><path d="M24 16.8l-3.6-7h7.2z" fill="W"/>',
    levels: '<path d="M24 8.5l3.6 7.3 8 1.2-5.8 5.6 1.4 8L24 26.8l-7.2 3.8 1.4-8-5.8-5.6 8-1.2z" fill="W"/><rect x="11" y="33.5" width="26" height="4.6" rx="2.3" fill="W" opacity=".42"/><rect x="11" y="33.5" width="15" height="4.6" rx="2.3" fill="W"/>',
    send: '<path d="M7.5 22.5l31-12.5-9.4 28-6.6-10.8z" fill="W"/><path d="M22.5 27.2l16-17.2" stroke="A" stroke-width="1.7" opacity=".5"/><circle cx="14" cy="33.5" r="6.4" fill="W"/><path d="M16 31.2c-.5-.6-1.2-.9-2-.9-1.1 0-1.9.6-1.9 1.4 0 1.9 4.2 1 4.2 3.2 0 .9-.9 1.6-2.2 1.6-.9 0-1.7-.4-2.2-1M14 29v1.3M14 36.5v1.3" fill="none" stroke="A" stroke-width="1.4" stroke-linecap="round"/>'
  };
  G.target = '<circle cx="22" cy="26" r="13" fill="W"/><circle cx="22" cy="26" r="9" fill="A" opacity=".55"/><circle cx="22" cy="26" r="5.2" fill="W"/><circle cx="22" cy="26" r="2.2" fill="A"/><path d="M23.5 24.5L35 13" stroke="A" stroke-width="2.4" stroke-linecap="round"/><path d="M33.6 8l1.3 3.8 3.8 1.3-3.4 3.4-3.8-1.3-1.3-3.8z" fill="W"/>';
  // v2760 (propriétaire) : « Invite tes amis » = deux amis + une pièce d'or (le même logo partout)
  G.invite = '<circle cx="28.5" cy="15.5" r="4.6" fill="W" opacity=".72"/><path d="M20.5 31c.4-5.2 3.6-8.3 8-8.3s7.6 3.1 8 8.3z" fill="W" opacity=".72"/><circle cx="18" cy="18" r="5.6" fill="W"/><path d="M8 35c0-6.2 4.4-10.2 10-10.2S28 28.8 28 35z" fill="W"/><circle cx="35" cy="33" r="8" fill="#FFD95A" stroke="#fff" stroke-width="2"/><path d="M37.2 30.3c-.6-.7-1.4-1-2.3-1-1.2 0-2.2.7-2.2 1.5 0 2.1 4.7 1 4.7 3.4 0 1-1 1.7-2.5 1.7-1 0-1.9-.4-2.5-1M34.9 27.6v1.6M34.9 36.4v1.6" fill="none" stroke="#9a5e06" stroke-width="1.5" stroke-linecap="round"/>';
  G.bonus = '<ellipse cx="19" cy="33.5" rx="11" ry="4" fill="W" opacity=".7"/><rect x="8" y="28" width="22" height="5.5" fill="W" opacity=".7"/><ellipse cx="19" cy="28" rx="11" ry="4" fill="W" opacity=".88"/><rect x="8" y="22.5" width="22" height="5.5" fill="W" opacity=".88"/><ellipse cx="19" cy="22.5" rx="11" ry="4" fill="W"/><path d="M19 20.6v3.8M17.1 22.5h3.8" stroke="A" stroke-width="1.5" stroke-linecap="round"/><circle cx="35.5" cy="15" r="7" fill="W"/><path d="M35.5 11.3v7.4M31.8 15h7.4" stroke="A" stroke-width="2.6" stroke-linecap="round"/>';
  G.jauge = '<path d="M9 31a15 15 0 0 1 30 0" fill="none" stroke="W" stroke-width="5" stroke-linecap="round" opacity=".42"/><path d="M9 31a15 15 0 0 1 22.5-13" fill="none" stroke="W" stroke-width="5" stroke-linecap="round"/><path d="M24 31l8-10" stroke="W" stroke-width="3" stroke-linecap="round"/><circle cx="24" cy="31" r="3.6" fill="W"/><rect x="13" y="35.5" width="22" height="3.6" rx="1.8" fill="W" opacity=".6"/>';
  // v2783 (propriétaire) : « Bonus dépôt » en verre = un paquet cadeau avec un badge %
  G.bonus2 = '<rect x="10" y="22.5" width="26" height="16.5" rx="2.6" fill="W"/><rect x="8" y="16.5" width="30" height="6.5" rx="2.2" fill="W"/><rect x="21" y="16.5" width="4" height="22.5" fill="A"/>' +
    '<path d="M23 16.5c-2-4.6-8-6.2-9.1-3.1-.9 2.7 4.1 3.4 9.1 3.1zm0 0c2-4.6 8-6.2 9.1-3.1.9 2.7-4.1 3.4-9.1 3.1z" fill="W"/>' +
    '<circle cx="37" cy="33" r="7.6" fill="W"/><circle cx="34.6" cy="30.6" r="1.5" fill="A"/><circle cx="39.4" cy="35.4" r="1.5" fill="A"/><path d="M39.6 29.8l-5.2 6.4" stroke="A" stroke-width="1.7" stroke-linecap="round"/>';
  PAL.bonus2 = ['#FFE08A', '#F59E0B', '#a8560c'];
  var n = 0;
  PAL.missions = PAL.gifts; G.missions = G.target;
  function icon(k, cls) {
    var c = PAL[k] || PAL.news, g = G[k] || G.news, id = 'li' + (++n);
    var glyph = function (w, a) { return g.replace(/="W"/g, '="' + w + '"').replace(/="A"/g, '="' + a + '"'); };
    // v2782 (propriétaire) : logo « VERRE » — transparent et léger, avec un contour lumineux et des couleurs douces
    // (même esprit que la manette et le cadeau du haut). Utilisé dans Social et Cadeaux.
    if (cls && cls.indexOf('verre') > -1) {
      var u = 'url(#' + id + 'a)';
      var body = g.replace(/fill="W"/g, 'fill="' + u + '"').replace(/stroke="W"/g, 'stroke="' + u + '"').replace(/="A"/g, '="' + c[0] + '"');
      var edge = g.replace(/fill="W"/g, 'fill="none" stroke="' + u + '" stroke-width="1.6" stroke-linejoin="round"').replace(/stroke="W"/g, 'stroke="' + u + '"').replace(/fill="A"/g, 'fill="#fff"').replace(/stroke="A"/g, 'stroke="#fff"');
      return '<svg class="li-ico li-glass ' + cls + '" viewBox="4 4 40 40" aria-hidden="true"><defs><linearGradient id="' + id + 'a" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + c[0] + '"/><stop offset="1" stop-color="' + c[1] + '"/></linearGradient>' +
        '<radialGradient id="' + id + 'h" cx="30%" cy="20%" r="60%"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs>' +
        '<g opacity=".3">' + body + '</g><g opacity=".22">' + g.replace(/fill="W"/g, 'fill="url(#' + id + 'h)"').replace(/stroke="W"/g, 'stroke="none"').replace(/="A"/g, '="none"') + '</g><g>' + edge + '</g></svg>';
    }
    // v2706 (propriétaire) : logo LIBRE (sans carreau) — le dessin lui-même en couleur, posé dans l'univers
    if (cls && cls.indexOf('free') > -1) {
      return '<svg class="li-ico ' + cls + '" viewBox="4 4 40 40" aria-hidden="true"><defs><linearGradient id="' + id + 'a" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + c[0] + '"/><stop offset="1" stop-color="' + c[1] + '"/></linearGradient></defs>' +
        '<g transform="translate(0 1.2)" opacity=".28">' + glyph('#000', '#000') + '</g>' + glyph('url(#' + id + 'a)', '#fff') + '</svg>';
    }
    return '<svg class="li-ico' + (cls ? ' ' + cls : '') + '" viewBox="0 0 48 48" aria-hidden="true"><defs>' +
      '<linearGradient id="' + id + 'a" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + c[0] + '"/><stop offset="1" stop-color="' + c[1] + '"/></linearGradient>' +
      '<radialGradient id="' + id + 'b" cx="28%" cy="12%" r="80%"><stop offset="0" stop-color="#fff" stop-opacity=".5"/><stop offset=".45" stop-color="#fff" stop-opacity=".08"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs>' +
      '<rect x="1" y="1" width="46" height="46" rx="14" fill="url(#' + id + 'a)"/><rect x="1" y="1" width="46" height="46" rx="14" fill="url(#' + id + 'b)"/>' +
      '<rect x="1.5" y="1.5" width="45" height="45" rx="13.5" fill="none" stroke="#fff" stroke-opacity=".3"/>' +
      '<g transform="translate(0 1.3)" opacity=".2">' + glyph('#000', '#000') + '</g>' + glyph('#fff', c[2]) + '</svg>';
  }
  function color(k) { return (PAL[k] || PAL.news)[1]; }

  /* ---------- Page « inscris-toi » : une par tuile, qui explique ce qu'on gagne ---------- */
  var GT = {
    fr: { btn: 'Créer mon compte gratuit', have: 'J’ai déjà un compte', free: 'Gratuit · ton identifiant reste secret',
      friends: ['Discute avec tes amis', 'Crée ton compte : tu reçois un identifiant secret et tu écris à tes amis.', ['💬 Messages privés avec tes amis', '📷 Envoie des photos', '⚔️ Défie-les en démo']],
      groups: ['Crée ton groupe', 'Crée ton groupe, invite tes amis avec un lien et discutez à plusieurs.', ['👥 Invite autant d’amis que tu veux', '🔗 Invitation par simple lien', '📷 Messages et photos']],
      duel: ['Défie tes amis', 'Invite ton ami, tradez en même temps en démo, et montre-lui que tu es le plus fort !', ['⚡ Score en direct', '🏆 Bilan de tes victoires', '🎯 Sans risque, en démo']],
      chat: ['Parle à l’équipe', 'Avec ton compte, tu écris à l’équipe et tu reçois la réponse ici.', ['💳 Aide pour tes dépôts', '💸 Aide pour tes retraits', '📷 Envoie une capture']],
      myid: ['Ton identifiant secret', 'Chaque joueur inscrit reçoit un identifiant à donner à ses amis.', ['🔒 Personne ne voit ton e-mail', '🤝 Tes amis te trouvent facilement', '🚫 Tu peux bloquer qui tu veux']],
      record: ['Tes défis', 'Gagne des duels contre tes amis et garde ton bilan.', ['🏆 Victoires et défaites', '⚔️ Revanche en un clic', '🔥 Montre qui est le meilleur']],
      quiz: ['Quiz du jour', 'Une question par jour sur le trading. Teste-toi !', ['🧠 Apprends en jouant', '📅 Nouvelle question chaque jour', '🏅 Gagne des badges']],
      stats: ['Tes statistiques', 'Suis tes progrès : trades, réussite, meilleure série.', ['📈 Ton taux de réussite', '🔥 Ta meilleure série', '⭐ Ton marché préféré']],
      badges: ['Tes badges', 'Débloque des badges en jouant et en défiant tes amis.', ['🥇 10 badges à gagner', '⚔️ Badges de défis', '📅 Badges de régularité']],
      send: ['Envoie de l’argent à tes amis', 'Avec ton compte, tu envoies l’argent de tes dépôts à un ami, en un instant.', ['⚡ Instantané', '👥 À n’importe quel ami inscrit', '🔒 Tu confirmes chaque envoi']] },
    en: { btn: 'Create my free account', have: 'I already have an account', free: 'Free · your ID stays secret',
      friends: ['Chat with your friends', 'Create your account: you get a secret ID and can write to your friends.', ['💬 Private messages', '📷 Send photos', '⚔️ Challenge them in demo']],
      groups: ['Create your group', 'Create your group, invite friends with a link and chat together.', ['👥 Invite as many friends as you want', '🔗 Invite with a simple link', '📷 Messages and photos']],
      duel: ['Challenge your friends', 'A 3, 5 or 10-minute duel in demo. Whoever wins the most wins.', ['⚡ Live score', '🏆 Your win record', '🎯 No risk, in demo']],
      chat: ['Talk to the team', 'With your account, write to the team and get the answer here.', ['💳 Help with deposits', '💸 Help with withdrawals', '📷 Send a screenshot']],
      myid: ['Your secret ID', 'Every registered player gets an ID to give to friends.', ['🔒 Nobody sees your e-mail', '🤝 Friends find you easily', '🚫 Block anyone you want']],
      record: ['Your challenges', 'Win duels against your friends and keep your record.', ['🏆 Wins and losses', '⚔️ Rematch in one tap', '🔥 Show who is the best']],
      quiz: ['Daily quiz', 'One trading question a day. Test yourself!', ['🧠 Learn while playing', '📅 A new question every day', '🏅 Earn badges']],
      stats: ['Your statistics', 'Track your progress: trades, success, best streak.', ['📈 Your success rate', '🔥 Your best streak', '⭐ Your favourite market']],
      badges: ['Your badges', 'Unlock badges by playing and challenging friends.', ['🥇 10 badges to win', '⚔️ Challenge badges', '📅 Loyalty badges']],
      send: ['Send money to your friends', 'With your account, send money from your deposits to a friend, in an instant.', ['⚡ Instant', '👥 To any registered friend', '🔒 You confirm every transfer']] }
  };
  GT.zh = Object.assign({}, GT.en, { btn: '免费创建账户', have: '我已有账户', free: '免费 · 你的 ID 保密',
    friends: ['和好友聊天', '创建账户后，你会获得专属 ID，可以给好友发消息。', ['💬 私信好友', '📷 发送照片', '⚔️ 模拟账户挑战']],
    groups: ['创建你的群组', '创建群组，用链接邀请好友，一起聊天。', ['👥 想邀请多少好友都可以', '🔗 一个链接即可邀请', '📷 消息和照片']],
    duel: ['挑战好友', '模拟账户 3、5 或 10 分钟对决，盈利最多者获胜。', ['⚡ 实时比分', '🏆 胜负记录', '🎯 模拟账户，无风险']],
    chat: ['联系团队', '有了账户，你可以给团队留言，并在这里收到回复。', ['💳 充值帮助', '💸 提现帮助', '📷 发送截图']] });
  (D6.LIVE_T = D6.LIVE_T || {}).guest = GT;
  function GX() { var l = (document.documentElement.lang || 'fr').slice(0, 2); return GT[l] || GT.en; }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function guestPage(box, k, extra) {
    var x = GX(), p = x[k] || x.friends;
    box.innerHTML = '<div class="lgu" style="--tc:' + color(k) + '"><div class="lgu-ico">' + (k === 'send' ? sendLogo('lgu-owl') : icon(k)) + '</div><b class="lgu-t">' + esc(p[0]) + '</b><p class="lgu-s">' + esc(p[1]) + '</p>' +
      '<ul class="lgu-l">' + p[2].map(function (l) { return '<li>' + esc(l) + '</li>'; }).join('') + '</ul>' +
      '<button type="button" class="lgu-go" data-a="register">' + esc(x.btn) + '</button><button type="button" class="lgu-have" data-a="login">' + esc(x.have) + '</button>' +
      (extra || '') + '<small class="lgu-free">' + esc(x.free) + '</small></div>';
    box.querySelectorAll('[data-a]').forEach(function (b) {
      b.addEventListener('click', function () {
        var a = b.getAttribute('data-a');
        if (D6.Live && D6.Live.toAuth) { D6.Live.toAuth(a); return; }
        if (D6.Live && D6.Live.close) D6.Live.close();
        if (D6.App && D6.App.showAuth) D6.App.showAuth(a);
      });
    });
  }

  /* ---------- Grandes pages (téléphone) : on les ferme en tirant vers le bas depuis le haut ---------- */
  var PAGES = ['liveModal', 'portalModal', 'financeModal', 'withdrawModal', 'depositModal', 'termsModal', 'historySheet', 'passModal', 'emailModal', 'helpModal'];
  function phone() { return window.matchMedia && window.matchMedia('(max-width:859px)').matches; }
  function bindSwipe(id) {
    var m = document.getElementById(id), box = m && m.querySelector('.modal-box');
    if (!box) return;
    var y0 = 0, dy = 0, on = false;
    box.addEventListener('touchstart', function (e) {
      if (!phone() || e.touches.length !== 1) return;
      var r = box.getBoundingClientRect(), ty = e.touches[0].clientY - r.top;
      // Seulement depuis le haut de la page (zone du titre / poignée), et si la page est tout en haut.
      // v2787 (propriétaire) : la page reste BLOQUÉE comme une vraie appli — on ne la tire vers le bas que depuis le petit
      // trait tout en haut (avant : les 86 premiers pixels → en défilant Paris, toute la page descendait et on voyait le trading dessous)
      // 2026-10-26 (propriétaire) : la zone suit la poignée (placée sous l'encoche par env(safe-area)). Avant, elle était figée
      // aux 30 premiers pixels : sur iPhone, la page part en haut de l'écran DERRIÈRE l'encoche, donc le petit trait visible
      // (≈ 50 px plus bas) tombait HORS de la zone → « on dirait que ça ne glisse pas ». Maintenant on peut tirer depuis le trait.
      var zone = 30, g = box.querySelector('.bp-grip');
      if (g && getComputedStyle(g).display !== 'none') { var gr = g.getBoundingClientRect(); if (gr.height) zone = Math.max(30, (gr.bottom - r.top) + 26); }
      if (ty > zone || box.scrollTop > 2) return;
      if (e.target.closest && e.target.closest('input,textarea,select,.lf-duelcard')) return;
      on = true; y0 = e.touches[0].clientY; dy = 0; box.style.transition = 'none';
    }, { passive: true });
    box.addEventListener('touchmove', function (e) {
      if (!on) return;
      dy = Math.max(0, e.touches[0].clientY - y0);
      box.style.setProperty('transform', 'translateY(' + dy + 'px)', 'important');
    }, { passive: true });
    function end() {
      if (!on) return;
      on = false;
      box.style.transition = 'transform .22s ease-out';
      if (dy > 110) {
        box.style.setProperty('transform', 'translateY(100%)', 'important');
        setTimeout(function () {
          var c = box.querySelector('.btn-close');
          if (c) c.click();
          box.style.removeProperty('transform'); box.style.transition = '';
        }, 210);
      } else {
        box.style.setProperty('transform', 'translateY(0)', 'important');
        setTimeout(function () { box.style.removeProperty('transform'); box.style.transition = ''; }, 230);
      }
    }
    box.addEventListener('touchend', end); box.addEventListener('touchcancel', end);
    // petite poignée visible en haut de la page
    if (!box.querySelector('.bp-grip')) { var g = document.createElement('i'); g.className = 'bp-grip'; g.setAttribute('aria-hidden', 'true'); box.insertBefore(g, box.firstChild); }
  }
  function boot() { PAGES.forEach(bindSwipe); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();

  /* ---------- Packs de langues (es, pt, ar, tr, vi, id, ru, de, hi) : js/live-i18n/<langue>.js ---------- */
  var packs = {};
  var PV = ((document.currentScript && /[?&]v=(\d+)/.exec(document.currentScript.src)) || [])[1] || '1'; // même version que ce fichier
  D6.LivePack = function (l, pack) {
    Object.keys(pack).forEach(function (k) {
      if (k === 'quiz') { if (D6.QUIZ) D6.QUIZ[l] = pack.quiz; return; }
      var t = D6.LIVE_T && D6.LIVE_T[k];
      if (!t) return;
      var m = Object.assign({}, t.en, pack[k]);
      Object.keys(t.en).forEach(function (kk) { var a = t.en[kk]; if (a && typeof a === 'object' && !Array.isArray(a) && pack[k][kk] && typeof pack[k][kk] === 'object') m[kk] = Object.assign({}, a, pack[k][kk]); });
      t[l] = m;
    });
    packs[l] = 2;
    try { document.dispatchEvent(new Event('oro:livepack')); } catch (e) { /* ignore */ }
  };
  function loadPack() {
    var l = (document.documentElement.lang || 'fr').slice(0, 2);
    if (l === 'fr' || l === 'en' || l === 'zh' || packs[l] || !/^[a-z]{2}$/.test(l)) return;
    packs[l] = 1;
    var s = document.createElement('script');
    s.src = 'js/live-i18n/' + l + '.js?v=' + PV;
    s.async = true;
    s.onerror = function () { packs[l] = 0; };
    document.head.appendChild(s);
  }
  setTimeout(loadPack, 1200);
  document.addEventListener('oro:lang', function () { setTimeout(loadPack, 50); });
  D6.BigPageSwipe = bindSwipe; // v2690 : aussi pour la page Casino (créée plus tard)
  /* v2786 (propriétaire) — LOGO DU TRANSFERT OROLADO : le hibou (tête carrée, perché sur sa branche) dans un rond orange
     ouvert ; dans l'ouverture, un grand « bec » d'envoi bien droit (comme un avion en papier), avec un petit espace. */
  var oroN = 0;
  function sendLogo(cls) {
    var id = 'osl' + (++oroN), c = 24, r = 18, rad = Math.PI / 180;
    var P = function (a, rr) { return [c + (rr || r) * Math.cos(a * rad), c + (rr || r) * Math.sin(a * rad)]; };
    var p1 = P(-67), p2 = P(-23), ap = P(-45, 28.2), d = [.7071, .7071], s = 1.7;
    var b1 = [p1[0] + d[0] * s, p1[1] + d[1] * s], b2 = [p2[0] - d[0] * s, p2[1] - d[1] * s];
    var mid = [(b1[0] + b2[0]) / 2, (b1[1] + b2[1]) / 2], f = function (p) { return p[0].toFixed(2) + ' ' + p[1].toFixed(2); };
    // sur le fond sombre du site : hibou BLANC (yeux bleu nuit) ; sur fond clair (classe « light ») : hibou bleu nuit
    var light = !!(cls && cls.indexOf('light') > -1), N = light ? '#1E1B4B' : '#FFFFFF', EY = light ? '#fff' : '#1E1B4B', PU = light ? '#1E1B4B' : '#fff';
    return '<svg class="oro-send-logo' + (cls ? ' ' + cls : '') + '" viewBox="-1 -4 53 53" aria-hidden="true"><defs><linearGradient id="' + id + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFA23A"/><stop offset="1" stop-color="#F0590B"/></linearGradient></defs>' +
      '<path d="M' + f(p1) + 'A18 18 0 1 0 ' + f(p2) + '" fill="none" stroke="url(#' + id + ')" stroke-width="4.2"/>' +
      '<path d="M' + f(b1) + 'L' + f(ap) + 'L' + f(b2) + 'Z" fill="#F57A1F" stroke="#F57A1F" stroke-width="1" stroke-linejoin="round"/>' +
      '<path d="M' + f(ap) + 'L' + f(mid) + '" stroke="#fff" stroke-width="1.1" stroke-linecap="round" opacity=".85"/>' +
      '<rect x="15" y="13.5" width="18" height="19.5" rx="7.2" fill="' + N + '"/><path d="M15.6 17l.4-5.8 4.6 3.2zM32.4 17l-.4-5.8-4.6 3.2z" fill="' + N + '"/>' +
      '<circle cx="20.2" cy="21.2" r="3.6" fill="' + EY + '"/><circle cx="27.8" cy="21.2" r="3.6" fill="' + EY + '"/><circle cx="20.2" cy="21.2" r="1.7" fill="' + PU + '"/><circle cx="27.8" cy="21.2" r="1.7" fill="' + PU + '"/>' +
      '<path d="M24 24.4l-1.6 2.2h3.2z" fill="#F0590B"/><path d="M21.4 33v2.1M26.6 33v2.1" stroke="#F0590B" stroke-width="1.1" stroke-linecap="round"/>' +
      '<path d="M14.5 35.6h19" stroke="#F0590B" stroke-width="2.2" stroke-linecap="round"/></svg>';
  }
  D6.OroSendLogo = sendLogo;
  // v3401 (propriétaire) — vrais logos 3D réalistes (fal.ai) pour le menu Social, au lieu des dessins SVG.
  var SOC_IMG = { duel: 1, news: 1, friends: 1, groups: 1, chat: 1, myid: 1, levels: 1, missions: 1, quiz: 1, record: 1, stats: 1, badges: 1, learn: 1, gifts: 1, send: 1, wheel: 1, target: 1, bonus: 1, bonus2: 1, jauge: 1, invite: 1 };
  D6.LiveIcon = function (k, cls) {
    if (SOC_IMG[k]) return '<img class="li-ico li-img' + (cls ? ' ' + cls : '') + '" src="img/social/' + k + '.webp?v=3407" alt="" loading="lazy" draggable="false">';
    return k === 'send' ? sendLogo(cls) : icon(k, cls);
  };
  D6.LiveColor = color;
  D6.LiveGuest = guestPage;
})(window.D6 = window.D6 || {});
