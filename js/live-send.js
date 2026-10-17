/* v2689 — Live : ENVOYER DE L'ARGENT À UN AMI (réel). Tout est décidé par le serveur (api.php xferStatus / xferSend,
   transfer_lib.php) : seulement l'argent de ses vrais dépôts ; l'ami reçoit un bonus à miser 2 fois.
   v2694 (propriétaire) : page comme les grandes applis d'envoi (Wave, PayPal) — solde à envoyer en gros, amis en ronds,
   gros montant, « 0 % de frais », résumé, écran « Envoyé ! » animé, historique classé par jour, reçu à partager.
   Plus de règles écrites en bas. */
(function (D6) {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var T = {
    fr: { title: 'Envoyer de l’argent', sub: 'À un ami, en un instant', can: 'Disponible à envoyer', to: 'À qui ?', toPh: 'Identifiant (R…) ou e-mail de ton ami', amount: 'Montant',
      go: 'Continuer', confirm: 'Envoyer maintenant', cancel: 'Modifier', sure: 'Vérifie avant d’envoyer', sending: 'Envoi…', done: '✅ {a} $ envoyés à {n} !',
      hist: 'Mes envois et réceptions', sent: 'Envoyé à {n}', got: 'Reçu de {n}', none: 'Aucun envoi pour l’instant.', myFriends: 'Mes amis',
      e_min: 'Minimum 1 $.', e_tooMuch: 'Montant trop élevé : tu peux envoyer jusqu’à {c} $.', e_dayMax: 'Envoi impossible pour aujourd’hui. Réessaie demain.',
      e_self: 'Tu ne peux pas t’envoyer de l’argent.', e_notFound: 'Identifiant introuvable.', e_insufficient: 'Solde insuffisant.', e_unavailable: 'Envoi impossible pour le moment, réessaie.',
      e_busy: 'Un instant, réessaie.', e_off: 'Bientôt disponible.', e_login: 'Connecte-toi pour envoyer.', noDep: 'Fais un dépôt pour pouvoir envoyer de l’argent à tes amis.', deposit: 'Recharger',
      fee0: '0 % de frais', sumTo: 'À', sumAmt: 'Montant', sumFee: 'Frais', sumTot: 'Total', okT: 'Envoyé !', okS: '{a} $ sont partis chez {n}', seeR: 'Voir le reçu', fin: 'Terminé',
      rT: 'Reçu de transfert', rOk: 'Réussi', rPend: 'En cours', rFrom: 'De', rTo: 'À', rId: 'Identifiant', rDate: 'Date', rRef: 'Référence', rFee: 'Frais', rSt: 'Statut',
      share: 'Partager le reçu', copied: 'Reçu copié', today: 'Aujourd’hui', yday: 'Hier', me: 'Moi' },
    en: { title: 'Send money', sub: 'To a friend, in an instant', can: 'Available to send', to: 'To whom?', toPh: 'Your friend’s ID (R…) or email', amount: 'Amount',
      go: 'Continue', confirm: 'Send now', cancel: 'Edit', sure: 'Check before sending', sending: 'Sending…', done: '✅ ${a} sent to {n}!',
      hist: 'My transfers', sent: 'Sent to {n}', got: 'Received from {n}', none: 'No transfer yet.', myFriends: 'My friends',
      e_min: 'Minimum $1.', e_tooMuch: 'Amount too high: you can send up to ${c}.', e_dayMax: 'Sending not possible today. Try again tomorrow.',
      e_self: 'You cannot send money to yourself.', e_notFound: 'ID not found.', e_insufficient: 'Insufficient balance.', e_unavailable: 'Cannot send right now, try again.',
      e_busy: 'One moment, try again.', e_off: 'Coming soon.', e_login: 'Log in to send.', noDep: 'Make a deposit to be able to send money to your friends.', deposit: 'Top up',
      fee0: '0% fees', sumTo: 'To', sumAmt: 'Amount', sumFee: 'Fees', sumTot: 'Total', okT: 'Sent!', okS: '${a} is on its way to {n}', seeR: 'View receipt', fin: 'Done',
      rT: 'Transfer receipt', rOk: 'Successful', rPend: 'Processing', rFrom: 'From', rTo: 'To', rId: 'ID', rDate: 'Date', rRef: 'Reference', rFee: 'Fees', rSt: 'Status',
      share: 'Share receipt', copied: 'Receipt copied', today: 'Today', yday: 'Yesterday', me: 'Me' }
  };
  T.zh = Object.assign({}, T.en, { title: '转账给好友', sub: '即时到账', can: '可转金额', to: '转给谁？', toPh: '好友 ID（R…）或邮箱', amount: '金额',
    go: '继续', confirm: '立即转账', cancel: '修改', sure: '转账前请确认', sending: '转账中…', done: '✅ 已向 {n} 转账 {a} 美元！',
    hist: '我的转账记录', sent: '转给 {n}', got: '收到 {n}', none: '暂无转账。', myFriends: '我的好友',
    e_min: '最低 1 美元。', e_tooMuch: '金额过高：你最多可转 {c} 美元。', e_dayMax: '今天无法再转账，请明天再试。',
    e_self: '不能转给自己。', e_notFound: '找不到该 ID。', e_insufficient: '余额不足。', e_unavailable: '暂时无法转账，请重试。', e_busy: '请稍后再试。', e_off: '即将开放。', e_login: '请先登录。',
    noDep: '充值后即可给好友转账。', deposit: '充值', fee0: '0% 手续费', sumTo: '收款人', sumAmt: '金额', sumFee: '手续费', sumTot: '合计', okT: '已转出！', okS: '{a} 美元已转给 {n}', seeR: '查看收据', fin: '完成',
    rT: '转账收据', rOk: '成功', rPend: '处理中', rFrom: '付款人', rTo: '收款人', rId: 'ID', rDate: '日期', rRef: '编号', rFee: '手续费', rSt: '状态', share: '分享收据', copied: '收据已复制', today: '今天', yday: '昨天', me: '我' });
  // « 0 % de frais » et les mots du reçu dans les autres langues du site
  var MORE = {
    es: { fee0: '0 % de comisión', can: 'Disponible para enviar', to: '¿A quién?', amount: 'Monto', go: 'Continuar', confirm: 'Enviar ahora', cancel: 'Editar', sure: 'Revisa antes de enviar', okT: '¡Enviado!', okS: '{a} $ van camino a {n}', seeR: 'Ver recibo', fin: 'Listo', rT: 'Recibo de transferencia', rOk: 'Completado', rFrom: 'De', rTo: 'Para', rDate: 'Fecha', rRef: 'Referencia', rFee: 'Comisión', rSt: 'Estado', share: 'Compartir recibo', today: 'Hoy', yday: 'Ayer', sumTo: 'Para', sumAmt: 'Monto', sumFee: 'Comisión' },
    pt: { fee0: '0 % de taxa', can: 'Disponível para enviar', to: 'Para quem?', amount: 'Valor', go: 'Continuar', confirm: 'Enviar agora', cancel: 'Editar', sure: 'Confira antes de enviar', okT: 'Enviado!', okS: '{a} $ a caminho de {n}', seeR: 'Ver recibo', fin: 'Concluir', rT: 'Recibo de transferência', rOk: 'Concluído', rFrom: 'De', rTo: 'Para', rDate: 'Data', rRef: 'Referência', rFee: 'Taxa', rSt: 'Status', share: 'Partilhar recibo', today: 'Hoje', yday: 'Ontem', sumTo: 'Para', sumAmt: 'Valor', sumFee: 'Taxa' },
    ar: { fee0: '0٪ رسوم', can: 'المتاح للإرسال', to: 'إلى من؟', amount: 'المبلغ', go: 'متابعة', confirm: 'أرسل الآن', cancel: 'تعديل', sure: 'تحقق قبل الإرسال', okT: 'تم الإرسال!', okS: '{a} $ في الطريق إلى {n}', seeR: 'عرض الإيصال', fin: 'تم', rT: 'إيصال التحويل', rOk: 'ناجح', rFrom: 'من', rTo: 'إلى', rDate: 'التاريخ', rRef: 'المرجع', rFee: 'الرسوم', rSt: 'الحالة', share: 'مشاركة الإيصال', today: 'اليوم', yday: 'أمس', sumTo: 'إلى', sumAmt: 'المبلغ', sumFee: 'الرسوم' },
    tr: { fee0: '%0 ücret', can: 'Gönderilebilir', to: 'Kime?', amount: 'Tutar', go: 'Devam', confirm: 'Şimdi gönder', cancel: 'Düzenle', sure: 'Göndermeden kontrol et', okT: 'Gönderildi!', okS: '{a} $ {n} kişisine gönderildi', seeR: 'Makbuzu gör', fin: 'Tamam', rT: 'Transfer makbuzu', rOk: 'Başarılı', rFrom: 'Gönderen', rTo: 'Alıcı', rDate: 'Tarih', rRef: 'Referans', rFee: 'Ücret', rSt: 'Durum', share: 'Makbuzu paylaş', today: 'Bugün', yday: 'Dün', sumTo: 'Alıcı', sumAmt: 'Tutar', sumFee: 'Ücret' },
    vi: { fee0: '0% phí', can: 'Có thể gửi', to: 'Gửi cho ai?', amount: 'Số tiền', go: 'Tiếp tục', confirm: 'Gửi ngay', cancel: 'Sửa', sure: 'Kiểm tra trước khi gửi', okT: 'Đã gửi!', okS: '{a} $ đang đến {n}', seeR: 'Xem biên nhận', fin: 'Xong', rT: 'Biên nhận chuyển tiền', rOk: 'Thành công', rFrom: 'Từ', rTo: 'Đến', rDate: 'Ngày', rRef: 'Mã', rFee: 'Phí', rSt: 'Trạng thái', share: 'Chia sẻ biên nhận', today: 'Hôm nay', yday: 'Hôm qua', sumTo: 'Đến', sumAmt: 'Số tiền', sumFee: 'Phí' },
    id: { fee0: '0% biaya', can: 'Bisa dikirim', to: 'Kepada siapa?', amount: 'Jumlah', go: 'Lanjut', confirm: 'Kirim sekarang', cancel: 'Ubah', sure: 'Periksa sebelum mengirim', okT: 'Terkirim!', okS: '{a} $ dikirim ke {n}', seeR: 'Lihat struk', fin: 'Selesai', rT: 'Struk transfer', rOk: 'Berhasil', rFrom: 'Dari', rTo: 'Kepada', rDate: 'Tanggal', rRef: 'Referensi', rFee: 'Biaya', rSt: 'Status', share: 'Bagikan struk', today: 'Hari ini', yday: 'Kemarin', sumTo: 'Kepada', sumAmt: 'Jumlah', sumFee: 'Biaya' },
    ru: { fee0: '0 % комиссии', can: 'Можно отправить', to: 'Кому?', amount: 'Сумма', go: 'Далее', confirm: 'Отправить', cancel: 'Изменить', sure: 'Проверьте перед отправкой', okT: 'Отправлено!', okS: '{a} $ отправлено {n}', seeR: 'Чек', fin: 'Готово', rT: 'Чек перевода', rOk: 'Успешно', rFrom: 'От', rTo: 'Кому', rDate: 'Дата', rRef: 'Номер', rFee: 'Комиссия', rSt: 'Статус', share: 'Поделиться чеком', today: 'Сегодня', yday: 'Вчера', sumTo: 'Кому', sumAmt: 'Сумма', sumFee: 'Комиссия' },
    de: { fee0: '0 % Gebühren', can: 'Verfügbar zum Senden', to: 'An wen?', amount: 'Betrag', go: 'Weiter', confirm: 'Jetzt senden', cancel: 'Ändern', sure: 'Vor dem Senden prüfen', okT: 'Gesendet!', okS: '{a} $ an {n} unterwegs', seeR: 'Beleg ansehen', fin: 'Fertig', rT: 'Überweisungsbeleg', rOk: 'Erfolgreich', rFrom: 'Von', rTo: 'An', rDate: 'Datum', rRef: 'Referenz', rFee: 'Gebühren', rSt: 'Status', share: 'Beleg teilen', today: 'Heute', yday: 'Gestern', sumTo: 'An', sumAmt: 'Betrag', sumFee: 'Gebühren' },
    hi: { fee0: '0% शुल्क', can: 'भेजने के लिए उपलब्ध', to: 'किसे?', amount: 'राशि', go: 'आगे बढ़ें', confirm: 'अभी भेजें', cancel: 'बदलें', sure: 'भेजने से पहले जाँचें', okT: 'भेज दिया!', okS: '{a} $ {n} को भेजे गए', seeR: 'रसीद देखें', fin: 'हो गया', rT: 'ट्रांसफ़र रसीद', rOk: 'सफल', rFrom: 'से', rTo: 'को', rDate: 'तारीख', rRef: 'संदर्भ', rFee: 'शुल्क', rSt: 'स्थिति', share: 'रसीद साझा करें', today: 'आज', yday: 'कल', sumTo: 'को', sumAmt: 'राशि', sumFee: 'शुल्क' }
  };
  (D6.LIVE_T = D6.LIVE_T || {}).send = T;
  function X() { var l = (document.documentElement.lang || 'fr').slice(0, 2); return Object.assign({}, T.en, MORE[l] || {}, T[l] || {}, MORE[l] || {}); }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function fmt(s, o) { return String(s).replace(/\{(\w+)\}/g, function (m, k) { return o[k] != null ? o[k] : m; }); }
  function m2(v) { return (Number(v) || 0).toFixed(2); }
  function toast(m, k) { if (D6.App && D6.App.toast) D6.App.toast(m, k || 'err'); }
  function ini(n) { return esc(String(n || '?').trim().charAt(0).toUpperCase() || '?'); }
  var AVC = ['#F97316', '#3B82F6', '#22C55E', '#A855F7', '#EC4899', '#14B8A6', '#EAB308', '#EF4444'];
  function avc(n) { var h = 0; String(n || '').split('').forEach(function (c) { h = (h * 31 + c.charCodeAt(0)) % 997; }); return AVC[h % AVC.length]; }
  function logo() { return D6.OroSendLogo ? D6.OroSendLogo('ls-logo') : (D6.LiveIcon ? D6.LiveIcon('send') : ''); } // v2786 : le hibou OROLADO
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
    var friends = (fr && fr.ok && fr.list) ? fr.list.slice(0, 20) : [];
    var noDep = st.can < (st.min || 1);
    box.innerHTML = '<div class="ls2">' +
      // v2786 (propriétaire) : carte de solde comme les grandes applis d'envoi (petit hibou, disponible, 0 % de frais)
      '<div class="ls2-card"><span class="ls2-cl">' + logo() + '</span><div class="ls2-cv"><small>' + esc(x.can) + '</small><b>' + m2(st.can) + ' <i>$</i></b></div><em class="ls2-cf">' + esc(x.fee0) + '</em></div>' +
      (noDep ? '<p class="ls2-nodep">' + esc(x.noDep) + '</p><button type="button" class="ls2-go" id="lsDep">' + esc(x.deposit) + '</button>' :
        '<div class="ls2-sec"><label>' + esc(x.to) + '</label>' +
        (friends.length ? '<div class="ls2-fr">' + friends.map(function (f) { return '<button type="button" data-id="' + esc(f.id) + '"><i style="--av:' + avc(f.name) + '">' + ini(f.name) + '</i><span>' + esc(f.name) + '</span></button>'; }).join('') + '</div>' : '') +
        '<input class="ls2-in" id="lsTo" maxlength="80" spellcheck="false" autocapitalize="off" autocomplete="off" inputmode="email" placeholder="' + esc(x.toPh) + '" value="' + esc(preId || '') + '"></div>' +
        '<div class="ls2-sec ls2-amt"><label>' + esc(x.amount) + '</label><div class="ls2-big"><input id="lsAmt" inputmode="decimal" placeholder="0"><i>$</i></div>' +
        '<div class="ls2-chips">' + [5, 10, 20, 50].map(function (v) { return '<button type="button" data-v="' + v + '">' + v + ' $</button>'; }).join('') + '<button type="button" data-v="max">MAX</button></div></div>' +
        '<button type="button" class="ls2-go" id="lsGo">' + esc(x.go) + ' <span aria-hidden="true">→</span></button>') +
      '</div><b class="ls2-h">' + esc(x.hist) + '</b><div class="ls2-hist" id="lsHist">' + hist() + '</div>' +
      '<div class="ls2-sheet" id="lsSheet" hidden></div>';
    if ($('lsDep')) $('lsDep').addEventListener('click', function () { if (D6.Live) D6.Live.close(); if (D6.App && D6.App.openDeposit) D6.App.openDeposit(); });
    box.querySelectorAll('.ls2-fr button').forEach(function (b) {
      b.addEventListener('click', function () { $('lsTo').value = b.getAttribute('data-id'); box.querySelectorAll('.ls2-fr button').forEach(function (z) { z.classList.toggle('on', z === b); }); });
    });
    box.querySelectorAll('.ls2-chips button').forEach(function (b) {
      b.addEventListener('click', function () { var v = b.getAttribute('data-v'); $('lsAmt').value = v === 'max' ? m2(st.can) : v; });
    });
    if ($('lsGo')) $('lsGo').addEventListener('click', function () { ask(box, friends); });
    bindHist(box);
  }
  function dayLabel(d) {
    var x = X(), now = new Date(), a = new Date(d.getFullYear(), d.getMonth(), d.getDate()), b = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    var diff = Math.round((b - a) / 86400000);
    return diff === 0 ? x.today : diff === 1 ? x.yday : d.toLocaleDateString(document.documentElement.lang || undefined, { day: 'numeric', month: 'long', year: 'numeric' });
  }
  function hist() {
    var x = X(), log = (st && st.log) || [];
    if (!log.length) return '<p class="lf-empty">' + esc(x.none) + '</p>';
    var out = '', last = '';
    log.forEach(function (l, i) {
      var d = new Date((l.at || 0) * 1000), day = dayLabel(d), o = l.dir === 'out', name = l.name || l.toId || l.fromId || '?';
      if (day !== last) { out += '<p class="ls2-day">' + esc(day) + '</p>'; last = day; }
      out += '<button type="button" class="ls2-row ' + (o ? 'out' : 'in') + '" data-i="' + i + '"><i style="--av:' + avc(name) + '">' + ini(name) + '<em>' + (o ? '↑' : '↓') + '</em></i>' +
        '<span><b>' + esc(fmt(o ? x.sent : x.got, { n: name })) + '</b><small>' + d.toLocaleTimeString(document.documentElement.lang || undefined, { hour: '2-digit', minute: '2-digit' }) + (l.state && l.state !== 'done' && l.state !== 'credit' ? ' · ' + esc(x.rPend) : '') + '</small></span>' +
        '<strong>' + (o ? '−' : '+') + m2(l.amount) + ' $</strong></button>';
    });
    return out;
  }
  function bindHist(box) {
    box.querySelectorAll('.ls2-row').forEach(function (b) { b.addEventListener('click', function () { receipt(box, ((st && st.log) || [])[+b.getAttribute('data-i')]); }); });
  }
  function sheet(box, html) {
    var s = box.querySelector('#lsSheet');
    s.innerHTML = '<div class="ls2-sheet-in">' + html + '</div>';
    s.hidden = false;
    s.onclick = function (e) { if (e.target === s) s.hidden = true; };
    return s;
  }
  async function ask(box, friends) {
    // v2778 (propriétaire) : l'ami se trouve par son identifiant (R…) OU son e-mail ; avant d'envoyer, on montre QUI va recevoir.
    var x = X(), raw = $('lsTo').value.trim(), a = parseFloat(String($('lsAmt').value).replace(',', '.'));
    var id = raw.indexOf('@') >= 0 ? raw.replace(/\s+/g, '').toLowerCase() : raw.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    if (id.length < 7) { toast(x.e_notFound); return; }
    if (!(a >= (st.min || 1))) { toast(x.e_min); return; }
    if (a > st.can + 1e-9) { toast(fmt(x.e_tooMuch, { c: m2(st.can) })); return; }
    var f = friends.filter(function (z) { return z.id === id; })[0], name = f ? f.name : id;
    if (!f) {
      if (ask._on) return;
      ask._on = true;
      var who = await live('find', { id: id });
      ask._on = false;
      if (!who || !who.ok || !who.peer) { toast(x[(who && who.reason === 'self') ? 'e_self' : (who && who.reason === 'findLocked') ? 'e_unavailable' : 'e_notFound'] || x.e_notFound); return; }
      id = who.peer.id; name = who.peer.name || who.peer.id; // l'e-mail n'est jamais affiché : on montre le nom et l'identifiant R…
    }
    var s = sheet(box, '<b class="ls2-st">' + esc(x.sure) + '</b>' +
      '<div class="ls2-who"><i style="--av:' + avc(name) + '">' + ini(name) + '</i><span><b>' + esc(name) + '</b><small>' + esc(id) + '</small></span></div>' +
      '<div class="ls2-lines"><p><span>' + esc(x.sumAmt) + '</span><b>' + m2(a) + ' $</b></p><p><span>' + esc(x.sumFee) + '</span><b class="g">0,00 $</b></p><p class="t"><span>' + esc(x.sumTot) + '</span><b>' + m2(a) + ' $</b></p></div>' +
      '<button type="button" class="ls2-go" id="lsYes">' + esc(x.confirm) + '</button><button type="button" class="ls2-alt" id="lsNo">' + esc(x.cancel) + '</button>');
    $('lsNo').addEventListener('click', function () { s.hidden = true; });
    $('lsYes').addEventListener('click', async function () {
      if (busy) return;
      busy = true; this.disabled = true; this.textContent = x.sending;
      var r = await api('xferSend', { to: id, amount: a });
      busy = false;
      if (r && r.ok) {
        try { if (D6.App && D6.App.onRemoteAccount) D6.App.onRemoteAccount(); } catch (e) { /* ignore */ }
        success(box, m2(r.amount || a), name, id);
        return;
      }
      var k = 'e_' + ((r && r.reason) || 'unavailable');
      toast(fmt(x[k] || x.e_unavailable, { c: m2((r && r.can != null) ? r.can : st.can) }));
      s.hidden = true;
    });
  }
  /* écran « Envoyé ! » : grande coche animée + confettis, puis reçu */
  async function success(box, amt, name, id) {
    var x = X();
    var conf = ''; for (var i = 0; i < 18; i++) conf += '<i style="--x:' + ((i * 37) % 100) + '%;--d:' + (i % 6) * 0.08 + 's;--c:' + AVC[i % AVC.length] + '"></i>';
    var ov = document.createElement('div'); ov.className = 'ls2-ok';
    ov.innerHTML = '<div class="ls2-conf">' + conf + '</div><svg class="ls2-check" viewBox="0 0 52 52"><circle cx="26" cy="26" r="24"/><path d="M15 27l7 7 15-16"/></svg>' +
      '<b>' + esc(x.okT) + '</b><span>' + esc(fmt(x.okS, { a: amt, n: name })) + '</span><strong>' + amt + ' $</strong><small>' + esc(x.fee0) + '</small>' +
      '<button type="button" class="ls2-go w" id="lsSeeR">' + esc(x.seeR) + '</button><button type="button" class="ls2-alt w" id="lsFin">' + esc(x.fin) + '</button>';
    box.appendChild(ov);
    await status();
    var entry = ((st && st.log) || []).filter(function (l) { return l.dir === 'out'; })[0] || { dir: 'out', amount: +amt, at: Date.now() / 1000, name: name, toId: id, state: 'done' };
    $('lsSeeR').addEventListener('click', function () { ov.remove(); open(box).then(function () { receipt(box, entry); }); });
    $('lsFin').addEventListener('click', function () { ov.remove(); open(box); });
  }
  /* reçu : comme les applis de paiement — coche, montant, lignes, partager */
  function receipt(box, l) {
    if (!l) return;
    var x = X(), o = l.dir === 'out', d = new Date((l.at || 0) * 1000), name = l.name || l.toId || l.fromId || '?';
    var ref = String(l.ref || '').replace(/^adm_xf_/, '').toUpperCase().slice(-12) || '—';
    var done = !l.state || l.state === 'done' || l.state === 'credit';
    var rows = [[o ? x.rTo : x.rFrom, name], [x.rId, o ? (l.toId || '—') : (l.fromId || '—')], [x.rDate, d.toLocaleString(document.documentElement.lang || undefined)], [x.rRef, ref], [x.rFee, '0,00 $'], [x.rSt, done ? x.rOk : x.rPend]];
    var s = sheet(box, '<div class="ls2-rc"><div class="ls2-rc-top"><svg class="ls2-check sm" viewBox="0 0 52 52"><circle cx="26" cy="26" r="24"/><path d="M15 27l7 7 15-16"/></svg><small>' + esc(x.rT) + '</small>' +
      '<b class="' + (o ? 'out' : 'in') + '">' + (o ? '−' : '+') + m2(l.amount) + ' $</b><span>OROLADO</span></div>' +
      '<div class="ls2-rc-rows">' + rows.map(function (r) { return '<p><span>' + esc(r[0]) + '</span><b>' + esc(r[1]) + '</b></p>'; }).join('') + '</div><i class="ls2-rc-cut"></i></div>' +
      '<button type="button" class="ls2-go" id="lsShare">' + esc(x.share) + '</button><button type="button" class="ls2-alt" id="lsClose">' + esc(x.fin) + '</button>');
    $('lsClose').addEventListener('click', function () { s.hidden = true; });
    $('lsShare').addEventListener('click', async function () {
      var txt = 'OROLADO — ' + x.rT + '\n' + (o ? '−' : '+') + m2(l.amount) + ' $\n' + rows.map(function (r) { return r[0] + ' : ' + r[1]; }).join('\n') + '\norolado.com';
      try { if (navigator.share) { await navigator.share({ title: x.rT, text: txt }); return; } } catch (e) { return; }
      try { await navigator.clipboard.writeText(txt); toast(x.copied, 'ok'); } catch (e) { /* ignore */ }
    });
  }
  D6.LiveSend = { open: open, title: function () { return X().title; }, sub: function () { return X().sub; }, status: status, enabled: function () { return !!(st && st.enabled); } };
})(window.D6 = window.D6 || {});
