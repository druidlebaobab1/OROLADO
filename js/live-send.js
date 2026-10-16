/* v2689 — Live : ENVOYER DE L'ARGENT À UN AMI (réel). Tout est décidé par le serveur (api.php xferStatus / xferSend,
   transfer_lib.php) : seulement l'argent de ses vrais dépôts ; l'ami reçoit un bonus à miser 2 fois. */
(function (D6) {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var T = {
    fr: { title: 'Envoyer de l’argent', sub: 'À un ami, en un instant', can: 'Tu peux envoyer jusqu’à', to: 'À quel ami ?', toPh: 'Identifiant de ton ami (OR…)', amount: 'Montant ($)',
      go: 'Continuer', confirm: 'Confirmer l’envoi', cancel: 'Annuler', sure: 'Envoyer {a} $ à {n} ?', sending: 'Envoi…', done: '✅ {a} $ envoyés à {n} !',
      rule1: '💳 Tu envoies l’argent de tes dépôts.', rule2: '🎁 Les bonus et cadeaux ne s’envoient pas.', rule3: '🔁 Ton ami doit miser 2 fois l’argent reçu avant de le retirer.',
      hist: 'Mes envois et réceptions', sent: 'Envoyé à {n}', got: 'Reçu de {n}', none: 'Aucun envoi pour l’instant.', myFriends: 'Mes amis',
      e_min: 'Minimum 1 $.', e_tooMuch: 'Montant trop élevé : tu peux envoyer jusqu’à {c} $ (l’argent de tes dépôts).', e_dayMax: 'Envoi impossible pour aujourd’hui. Réessaie demain.',
      e_self: 'Tu ne peux pas t’envoyer de l’argent.', e_notFound: 'Identifiant introuvable.', e_insufficient: 'Solde insuffisant.', e_unavailable: 'Envoi impossible pour le moment, réessaie.',
      e_busy: 'Un instant, réessaie.', e_off: 'Bientôt disponible.', e_login: 'Connecte-toi pour envoyer.', noDep: 'Fais un dépôt pour pouvoir envoyer de l’argent à tes amis.', deposit: 'Recharger' },
    en: { title: 'Send money', sub: 'To a friend, in an instant', can: 'You can send up to', to: 'Which friend?', toPh: 'Your friend’s ID (OR…)', amount: 'Amount ($)',
      go: 'Continue', confirm: 'Confirm', cancel: 'Cancel', sure: 'Send ${a} to {n}?', sending: 'Sending…', done: '✅ ${a} sent to {n}!',
      rule1: '💳 You send money from your deposits.', rule2: '🎁 Bonuses and gifts cannot be sent.', rule3: '🔁 Your friend must wager the money 2 times before withdrawing it.',
      hist: 'My transfers', sent: 'Sent to {n}', got: 'Received from {n}', none: 'No transfer yet.', myFriends: 'My friends',
      e_min: 'Minimum $1.', e_tooMuch: 'Amount too high: you can send up to ${c} (money from your deposits).', e_dayMax: 'Sending not possible today. Try again tomorrow.',
      e_self: 'You cannot send money to yourself.', e_notFound: 'ID not found.', e_insufficient: 'Insufficient balance.', e_unavailable: 'Cannot send right now, try again.',
      e_busy: 'One moment, try again.', e_off: 'Coming soon.', e_login: 'Log in to send.', noDep: 'Make a deposit to be able to send money to your friends.', deposit: 'Top up' }
  };
  T.zh = Object.assign({}, T.en, { title: '转账给好友', sub: '即时到账', can: '你最多可转', to: '转给哪位好友？', toPh: '好友 ID（OR…）', amount: '金额（$）',
    go: '继续', confirm: '确认转账', cancel: '取消', sure: '向 {n} 转账 {a} 美元？', sending: '转账中…', done: '✅ 已向 {n} 转账 {a} 美元！',
    rule1: '💳 你转出的是你的充值资金。', rule2: '🎁 奖励金和礼物不能转账。', rule3: '🔁 好友收到后需投注 2 倍才能提现。',
    hist: '我的转账记录', sent: '转给 {n}', got: '收到 {n}', none: '暂无转账。', myFriends: '我的好友',
    e_min: '最低 1 美元。', e_tooMuch: '金额过高：你最多可转 {c} 美元（你的充值资金）。', e_dayMax: '今天无法再转账，请明天再试。',
    e_self: '不能转给自己。', e_notFound: '找不到该 ID。', e_insufficient: '余额不足。', e_unavailable: '暂时无法转账，请重试。', e_busy: '请稍后再试。', e_off: '即将开放。', e_login: '请先登录。',
    noDep: '充值后即可给好友转账。', deposit: '充值' });
  (D6.LIVE_T = D6.LIVE_T || {}).send = T;
  function X() { var l = (document.documentElement.lang || 'fr').slice(0, 2); return T[l] || T.en; }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function fmt(s, o) { return String(s).replace(/\{(\w+)\}/g, function (m, k) { return o[k] != null ? o[k] : m; }); }
  function m2(v) { return (Number(v) || 0).toFixed(2); }
  function toast(m, k) { if (D6.App && D6.App.toast) D6.App.toast(m, k || 'err'); }
  async function api(a, d) { try { return await D6.Api.post(a, d || {}, 20000); } catch (e) { return null; } }
  async function live(a, d) {
    try {
      var r = await fetch('live.php', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin', cache: 'no-store',
        body: JSON.stringify(Object.assign({ action: a, token: D6.Api.token() }, d || {})) });
      return await r.json();
    } catch (e) { return null; }
  }
  var st = null, busy = false;
  async function status() { var r = await api('xferStatus'); if (r && r.ok !== false) st = r; return st; }

  async function open(box, preId) {
    var x = X();
    box.innerHTML = '<p class="ls-load">…</p>';
    var my = box._seq = (box._seq || 0) + 1;
    await status();
    if (box._seq !== my) return;
    if (!st || !st.enabled) { box.innerHTML = '<p class="lf-empty">' + esc(x.e_off) + '</p>'; return; }
    var fr = await live('friends', {});
    if (box._seq !== my) return;
    var friends = (fr && fr.ok && fr.list) ? fr.list.slice(0, 12) : [];
    box.innerHTML = '<div class="ls-card" style="--tc:' + (D6.LiveColor ? D6.LiveColor('send') : '#16A37A') + '">' +
      '<div class="ls-top"><span class="ls-ico">' + (D6.LiveIcon ? D6.LiveIcon('send') : '') + '</span><div><small>' + esc(x.can) + '</small><b>' + m2(st.can) + ' $</b></div></div>' +
      (st.can < (st.min || 1) ? '<p class="ls-nodep">' + esc(x.noDep) + '</p><button type="button" class="lgu-go" id="lsDep" style="--tc:#16A37A">' + esc(x.deposit) + '</button>' :
      '<label class="ls-l">' + esc(x.to) + '</label>' +
      (friends.length ? '<div class="ls-fr">' + friends.map(function (f) { return '<button type="button" data-id="' + esc(f.id) + '"><i>' + esc(String(f.name || '?').charAt(0).toUpperCase()) + '</i><span>' + esc(f.name) + '</span></button>'; }).join('') + '</div>' : '') +
      '<input class="ls-in" id="lsTo" maxlength="16" spellcheck="false" autocapitalize="characters" placeholder="' + esc(x.toPh) + '" value="' + esc(preId || '') + '">' +
      '<label class="ls-l">' + esc(x.amount) + '</label><input class="ls-in ls-amt" id="lsAmt" inputmode="decimal" placeholder="10">' +
      '<button type="button" class="lgu-go" id="lsGo" style="--tc:#16A37A">' + esc(x.go) + '</button><div class="ls-confirm" id="lsConf" hidden></div>') +
      '<ul class="ls-rules"><li>' + esc(x.rule1) + '</li><li>' + esc(x.rule2) + '</li><li>' + esc(x.rule3) + '</li></ul></div>' +
      '<b class="ls-h">' + esc(x.hist) + '</b><div class="ls-hist">' + hist() + '</div>';
    if ($('lsDep')) $('lsDep').addEventListener('click', function () { if (D6.Live) D6.Live.close(); if (D6.App && D6.App.openDeposit) D6.App.openDeposit(); });
    box.querySelectorAll('.ls-fr button').forEach(function (b) {
      b.addEventListener('click', function () { $('lsTo').value = b.getAttribute('data-id'); box.querySelectorAll('.ls-fr button').forEach(function (z) { z.classList.toggle('on', z === b); }); });
    });
    if ($('lsGo')) $('lsGo').addEventListener('click', function () { ask(box, friends); });
  }
  function hist() {
    var x = X(), log = (st && st.log) || [];
    if (!log.length) return '<p class="lf-empty">' + esc(x.none) + '</p>';
    return log.map(function (l) {
      var out = l.dir === 'out', d = new Date((l.at || 0) * 1000);
      return '<div class="ls-row ' + (out ? 'out' : 'in') + '"><span>' + (out ? '↗' : '↙') + '</span><div><b>' + esc(fmt(out ? x.sent : x.got, { n: l.name || l.toId || l.fromId || '' })) + '</b><small>' + d.toLocaleString() + '</small></div><em>' + (out ? '−' : '+') + m2(l.amount) + ' $</em></div>';
    }).join('');
  }
  function ask(box, friends) {
    var x = X(), id = $('lsTo').value.replace(/[^A-Za-z0-9]/g, '').toUpperCase(), a = parseFloat(String($('lsAmt').value).replace(',', '.'));
    if (id.length < 12) { toast(x.e_notFound); return; }
    if (!(a >= (st.min || 1))) { toast(x.e_min); return; }
    if (a > st.can + 1e-9) { toast(fmt(x.e_tooMuch, { c: m2(st.can) })); return; }
    var f = friends.filter(function (z) { return z.id === id; })[0], name = f ? f.name : id;
    var c = $('lsConf');
    c.hidden = false;
    c.innerHTML = '<b>' + esc(fmt(x.sure, { a: m2(a), n: name })) + '</b><small>' + esc(x.rule3) + '</small><div><button type="button" class="ls-no" id="lsNo">' + esc(x.cancel) + '</button><button type="button" class="ls-yes" id="lsYes">' + esc(x.confirm) + '</button></div>';
    $('lsGo').hidden = true;
    $('lsNo').addEventListener('click', function () { c.hidden = true; $('lsGo').hidden = false; });
    $('lsYes').addEventListener('click', async function () {
      if (busy) return;
      busy = true; this.disabled = true; this.textContent = x.sending;
      var r = await api('xferSend', { to: id, amount: a });
      busy = false;
      if (r && r.ok) {
        toast(fmt(x.done, { a: m2(r.amount), n: name }), 'ok');
        try { if (D6.App && D6.App.onRemoteAccount) D6.App.onRemoteAccount(); } catch (e) { /* ignore */ }
        open(box);
        return;
      }
      var k = 'e_' + ((r && r.reason) || 'unavailable');
      toast(fmt(x[k] || x.e_unavailable, { c: m2((r && r.can != null) ? r.can : st.can) }));
      c.hidden = true; $('lsGo').hidden = false;
    });
  }
  D6.LiveSend = { open: open, title: function () { return X().title; }, sub: function () { return X().sub; }, status: status, enabled: function () { return !!(st && st.enabled); } };
})(window.D6 = window.D6 || {});
