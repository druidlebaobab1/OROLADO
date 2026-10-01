/*
 * OROLADO — Reçus (trade réel, trade démo, dépôt, retrait, bonus).
 * L'image est dessinée sur le téléphone du joueur, seulement quand il ouvre un reçu :
 * aucune charge pour le serveur, rien de chargé au démarrage du site.
 * Boutons : WhatsApp, Partager (menu du téléphone), Télécharger (image PNG).
 */
(function () {
  'use strict';
  var D6 = window.D6 = window.D6 || {};

  var TXT = {
    fr: { trade: 'REÇU DE TRADE', demo: 'REÇU DÉMO', won: 'TRADE GAGNÉ', lost: 'TRADE PERDU', tie: 'ÉGALITÉ · MISE RENDUE', stake: 'Mise', side: 'Sens', dur: 'Durée', entry: 'Entrée', exit: 'Sortie', date: 'Date', buy: 'ACHAT ↗', sell: 'VENTE ↘', no: 'Reçu n°', demoNote: 'Compte démo · argent fictif', dep: 'DÉPÔT REÇU', wd: 'RETRAIT', bonus: 'BONUS REÇU', wa: 'WhatsApp', share: 'Partager', dl: 'Télécharger', close: 'Fermer', shareText: 'Mon trade sur orolado.com' },
    en: { trade: 'TRADE RECEIPT', demo: 'DEMO RECEIPT', won: 'TRADE WON', lost: 'TRADE LOST', tie: 'TIE · STAKE RETURNED', stake: 'Stake', side: 'Side', dur: 'Duration', entry: 'Entry', exit: 'Exit', date: 'Date', buy: 'BUY ↗', sell: 'SELL ↘', no: 'Receipt no.', demoNote: 'Demo account · virtual money', dep: 'DEPOSIT RECEIVED', wd: 'WITHDRAWAL', bonus: 'BONUS RECEIVED', wa: 'WhatsApp', share: 'Share', dl: 'Download', close: 'Close', shareText: 'My trade on orolado.com' },
    es: { trade: 'RECIBO DE OPERACIÓN', demo: 'RECIBO DEMO', won: 'OPERACIÓN GANADA', lost: 'OPERACIÓN PERDIDA', tie: 'EMPATE · APUESTA DEVUELTA', stake: 'Monto', side: 'Sentido', dur: 'Duración', entry: 'Entrada', exit: 'Salida', date: 'Fecha', buy: 'COMPRA ↗', sell: 'VENTA ↘', no: 'Recibo n.º', demoNote: 'Cuenta demo · dinero ficticio', dep: 'DEPÓSITO RECIBIDO', wd: 'RETIRO', bonus: 'BONO RECIBIDO', wa: 'WhatsApp', share: 'Compartir', dl: 'Descargar', close: 'Cerrar', shareText: 'Mi operación en orolado.com' },
    pt: { trade: 'RECIBO DE OPERAÇÃO', demo: 'RECIBO DEMO', won: 'OPERAÇÃO GANHA', lost: 'OPERAÇÃO PERDIDA', tie: 'EMPATE · VALOR DEVOLVIDO', stake: 'Valor', side: 'Direção', dur: 'Duração', entry: 'Entrada', exit: 'Saída', date: 'Data', buy: 'COMPRA ↗', sell: 'VENDA ↘', no: 'Recibo nº', demoNote: 'Conta demo · dinheiro fictício', dep: 'DEPÓSITO RECEBIDO', wd: 'SAQUE', bonus: 'BÔNUS RECEBIDO', wa: 'WhatsApp', share: 'Compartilhar', dl: 'Baixar', close: 'Fechar', shareText: 'Minha operação em orolado.com' },
    ar: { trade: 'إيصال صفقة', demo: 'إيصال تجريبي', won: 'صفقة رابحة', lost: 'صفقة خاسرة', tie: 'تعادل · تم رد المبلغ', stake: 'المبلغ', side: 'الاتجاه', dur: 'المدة', entry: 'الدخول', exit: 'الخروج', date: 'التاريخ', buy: 'شراء ↗', sell: 'بيع ↘', no: 'رقم الإيصال', demoNote: 'حساب تجريبي · أموال افتراضية', dep: 'تم استلام الإيداع', wd: 'سحب', bonus: 'تم استلام المكافأة', wa: 'واتساب', share: 'مشاركة', dl: 'تنزيل', close: 'إغلاق', shareText: 'صفقتي على orolado.com' },
    tr: { trade: 'İŞLEM MAKBUZU', demo: 'DEMO MAKBUZ', won: 'İŞLEM KAZANDI', lost: 'İŞLEM KAYBETTİ', tie: 'BERABERE · TUTAR İADE', stake: 'Tutar', side: 'Yön', dur: 'Süre', entry: 'Giriş', exit: 'Çıkış', date: 'Tarih', buy: 'AL ↗', sell: 'SAT ↘', no: 'Makbuz no', demoNote: 'Demo hesap · sanal para', dep: 'YATIRIM ALINDI', wd: 'ÇEKİM', bonus: 'BONUS ALINDI', wa: 'WhatsApp', share: 'Paylaş', dl: 'İndir', close: 'Kapat', shareText: 'orolado.com işlemim' },
    vi: { trade: 'BIÊN NHẬN GIAO DỊCH', demo: 'BIÊN NHẬN DEMO', won: 'GIAO DỊCH THẮNG', lost: 'GIAO DỊCH THUA', tie: 'HÒA · HOÀN TIỀN', stake: 'Số tiền', side: 'Hướng', dur: 'Thời gian', entry: 'Vào', exit: 'Ra', date: 'Ngày', buy: 'MUA ↗', sell: 'BÁN ↘', no: 'Biên nhận số', demoNote: 'Tài khoản demo · tiền ảo', dep: 'ĐÃ NẠP TIỀN', wd: 'RÚT TIỀN', bonus: 'ĐÃ NHẬN THƯỞNG', wa: 'WhatsApp', share: 'Chia sẻ', dl: 'Tải xuống', close: 'Đóng', shareText: 'Giao dịch của tôi trên orolado.com' },
    id: { trade: 'STRUK TRADING', demo: 'STRUK DEMO', won: 'TRADING MENANG', lost: 'TRADING KALAH', tie: 'SERI · DANA DIKEMBALIKAN', stake: 'Jumlah', side: 'Arah', dur: 'Durasi', entry: 'Masuk', exit: 'Keluar', date: 'Tanggal', buy: 'BELI ↗', sell: 'JUAL ↘', no: 'Struk no.', demoNote: 'Akun demo · uang virtual', dep: 'DEPOSIT DITERIMA', wd: 'PENARIKAN', bonus: 'BONUS DITERIMA', wa: 'WhatsApp', share: 'Bagikan', dl: 'Unduh', close: 'Tutup', shareText: 'Trading saya di orolado.com' },
    ru: { trade: 'ЧЕК СДЕЛКИ', demo: 'ДЕМО-ЧЕК', won: 'СДЕЛКА ВЫИГРАНА', lost: 'СДЕЛКА ПРОИГРАНА', tie: 'НИЧЬЯ · СТАВКА ВОЗВРАЩЕНА', stake: 'Сумма', side: 'Направление', dur: 'Длительность', entry: 'Вход', exit: 'Выход', date: 'Дата', buy: 'ПОКУПКА ↗', sell: 'ПРОДАЖА ↘', no: 'Чек №', demoNote: 'Демо-счёт · виртуальные деньги', dep: 'ДЕПОЗИТ ПОЛУЧЕН', wd: 'ВЫВОД', bonus: 'БОНУС ПОЛУЧЕН', wa: 'WhatsApp', share: 'Поделиться', dl: 'Скачать', close: 'Закрыть', shareText: 'Моя сделка на orolado.com' },
    de: { trade: 'HANDELSBELEG', demo: 'DEMO-BELEG', won: 'TRADE GEWONNEN', lost: 'TRADE VERLOREN', tie: 'UNENTSCHIEDEN · EINSATZ ZURÜCK', stake: 'Einsatz', side: 'Richtung', dur: 'Dauer', entry: 'Einstieg', exit: 'Ausstieg', date: 'Datum', buy: 'KAUF ↗', sell: 'VERKAUF ↘', no: 'Beleg-Nr.', demoNote: 'Demokonto · Spielgeld', dep: 'EINZAHLUNG ERHALTEN', wd: 'AUSZAHLUNG', bonus: 'BONUS ERHALTEN', wa: 'WhatsApp', share: 'Teilen', dl: 'Herunterladen', close: 'Schließen', shareText: 'Mein Trade auf orolado.com' },
    hi: { trade: 'ट्रेड रसीद', demo: 'डेमो रसीद', won: 'ट्रेड जीता', lost: 'ट्रेड हारा', tie: 'बराबरी · राशि वापस', stake: 'राशि', side: 'दिशा', dur: 'अवधि', entry: 'प्रवेश', exit: 'निकास', date: 'तारीख', buy: 'खरीद ↗', sell: 'बिक्री ↘', no: 'रसीद सं.', demoNote: 'डेमो खाता · वर्चुअल पैसा', dep: 'जमा प्राप्त', wd: 'निकासी', bonus: 'बोनस प्राप्त', wa: 'WhatsApp', share: 'शेयर करें', dl: 'डाउनलोड', close: 'बंद करें', shareText: 'orolado.com पर मेरा ट्रेड' }
  };
  function L() {
    var code = 'fr';
    try { code = (D6.I18N && D6.I18N.lang) || document.documentElement.lang || 'fr'; } catch (e) { /* ignore */ }
    code = String(code).slice(0, 2).toLowerCase();
    return TXT[code] || TXT.en;
  }

  var FONT = '"Plus Jakarta Sans", "Hanken Grotesk", system-ui, sans-serif';
  var MONO = 'ui-monospace, "JetBrains Mono", Menlo, Consolas, monospace';

  function money(n) {
    var v = Number(n) || 0;
    if (D6.fmtFCFA) return String(D6.fmtFCFA(Math.abs(v)));
    return Math.abs(v).toFixed(2) + ' $';
  }
  function price(n) {
    var v = Number(n);
    if (!isFinite(v) || v <= 0) return '—';
    var s = v.toFixed(2).split('.');
    return s[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + '.' + s[1];
  }
  function when(at) {
    var d = at ? new Date(at) : new Date();
    if (isNaN(d.getTime())) d = new Date();
    function p(x) { return (x < 10 ? '0' : '') + x; }
    return p(d.getDate()) + '/' + p(d.getMonth() + 1) + '/' + d.getFullYear() + ' · ' + p(d.getHours()) + ':' + p(d.getMinutes());
  }
  function durTxt(d) {
    d = Number(d) || 0;
    return d >= 60 ? (d / 60) + ' min' : d + ' s';
  }
  function publicId() {
    try {
      var u = D6.Auth && D6.Auth.current ? D6.Auth.current() : null;
      return (u && (u.publicId || u.public_id)) || '';
    } catch (e) { return ''; }
  }
  // Numéro de reçu unique : tiré de l'identifiant du trade / du paiement (jamais répété).
  function receiptNo(id, prefix) {
    var s = String(id || '');
    var h = 0;
    for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    var code = ('00000000' + h.toString(36).toUpperCase()).slice(-7);
    var pid = String(publicId() || '').replace(/^ORO-?/i, '');
    return (pid ? pid + '-' : '') + (prefix || '') + code;
  }

  function rr(g, x, y, w, h, r) {
    g.beginPath();
    g.moveTo(x + r, y);
    g.arcTo(x + w, y, x + w, y + h, r);
    g.arcTo(x + w, y + h, x, y + h, r);
    g.arcTo(x, y + h, x, y, r);
    g.arcTo(x, y, x + w, y, r);
    g.closePath();
  }
  function loadImg(src) {
    return new Promise(function (res) {
      var im = new Image();
      im.onload = function () { res(im); };
      im.onerror = function () { res(null); };
      im.src = src;
    });
  }
  var logoP = null;
  function logo() {
    if (!logoP) logoP = loadImg('icons/icon-512.png?v=r1');
    return logoP;
  }
  // Logo de la simulation : le même dessin que sur les cases du site.
  function assetIcon(assetId) {
    try {
      var svg = document.querySelector('.asset-chip[data-asset="' + assetId + '"] .asset-ico svg');
      if (!svg) return Promise.resolve(null);
      var c = svg.cloneNode(true);
      c.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      c.setAttribute('width', '96');
      c.setAttribute('height', '96');
      var col = '';
      try { col = getComputedStyle(svg.parentNode).getPropertyValue('--sig').trim(); } catch (e0) { col = ''; }
      var str = new XMLSerializer().serializeToString(c).replace(/var\(--sig[^)]*\)/g, col || '#22C55E').replace(/currentColor/g, col || '#22C55E');
      var light = /^#?(f{3}|f{6})$/i.test(String(col || '').replace(/\s/g, ''));
      return loadImg('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(str)).then(function (im) { if (im) im._light = light; return im; });
    } catch (e) { return Promise.resolve(null); }
  }
  function fontsReady() {
    try {
      if (document.fonts && document.fonts.load) {
        return Promise.all([
          document.fonts.load('800 40px "Plus Jakarta Sans"'),
          document.fonts.load('700 20px "Plus Jakarta Sans"')
        ]).catch(function () { return null; });
      }
    } catch (e) { /* ignore */ }
    return Promise.resolve();
  }

  function fitText(g, txt, maxW, size, weight, family) {
    var s = size;
    g.font = weight + ' ' + s + 'px ' + family;
    while (g.measureText(txt).width > maxW && s > 12) {
      s -= 2;
      g.font = weight + ' ' + s + 'px ' + family;
    }
    return s;
  }

  // ---------- Reçu de trade (réel : blanc + orange + vert ; démo : blanc + indigo, plus sobre) ----------
  function drawTrade(p, isDemo, icons) {
    var t = L();
    var W = 1200, H = 680;
    var cv = document.createElement('canvas');
    cv.width = W; cv.height = H;
    var g = cv.getContext('2d');
    var A = isDemo
      ? { a: '#6366F1', b: '#94A3B8', soft: '#EEF2FF', line: '#C7D2FE', lab: '#4338CA', title: '#4F46E5' }
      : { a: '#F7931A', b: '#22C55E', soft: '#FFF7ED', line: '#FED7AA', lab: '#9A3412', title: '#EA7A0C' };
    var status = String(p.status || (p.won ? 'won' : 'lost'));
    var won = status === 'won' || p.won === true;
    var tie = status === 'void' || p.voided;
    var stake = Number(p.stake) || 0;
    var mult = Number(p.payout) || 1.88;
    var net = tie ? 0 : (won ? stake * mult - stake : -stake);
    if (isFinite(Number(p.net)) && p.net !== null && p.net !== undefined && Number(p.net) !== 0) net = Number(p.net);

    // fond
    var bg = g.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, '#FFFFFF');
    bg.addColorStop(1, isDemo ? '#F5F7FF' : '#FFF8EF');
    rr(g, 0, 0, W, H, 44); g.fillStyle = bg; g.fill();
    // contour dégradé
    var bd = g.createLinearGradient(0, 0, W, H);
    bd.addColorStop(0, A.a); bd.addColorStop(1, A.b);
    g.lineWidth = 8; g.strokeStyle = bd; rr(g, 4, 4, W - 8, H - 8, 40); g.stroke();
    // reflet doux en haut à droite
    var gl = g.createRadialGradient(W - 120, 60, 10, W - 120, 60, 420);
    gl.addColorStop(0, isDemo ? 'rgba(99,102,241,0.10)' : 'rgba(247,147,26,0.13)');
    gl.addColorStop(1, 'rgba(255,255,255,0)');
    g.save(); rr(g, 8, 8, W - 16, H - 16, 36); g.clip(); g.fillStyle = gl; g.fillRect(0, 0, W, H); g.restore();

    // en-tête
    if (icons.logo) {
      g.save(); rr(g, 60, 48, 78, 78, 18); g.clip(); g.drawImage(icons.logo, 60, 48, 78, 78); g.restore();
    }
    g.textBaseline = 'middle';
    g.fillStyle = '#0F172A'; g.font = '800 46px ' + FONT;
    g.fillText('OROLADO', 158, 88);
    var wO = g.measureText('OROLADO').width;
    g.fillStyle = A.a; g.font = '800 30px ' + FONT;
    g.fillText('.com', 158 + wO + 4, 94);
    g.textAlign = 'right'; g.fillStyle = A.title; g.font = '800 24px ' + FONT;
    var head = isDemo ? t.demo : t.trade;
    if (isDemo) {
      g.font = '800 24px ' + FONT;
      var hw = g.measureText(head).width + 44;
      rr(g, W - 60 - hw, 64, hw, 48, 24);
      g.fillStyle = '#6366F1'; g.fill();
      g.fillStyle = '#FFFFFF';
      g.fillText(head, W - 82, 89);
    } else {
      g.fillText(head.split('').join(String.fromCharCode(8202)), W - 60, 88);
    }
    g.textAlign = 'left';
    g.strokeStyle = isDemo ? '#E0E7FF' : '#FDE7C8'; g.lineWidth = 2;
    g.beginPath(); g.moveTo(60, 150); g.lineTo(W - 60, 150); g.stroke();

    // colonne gauche : simulation, résultat, montant
    var name = String(p.assetName || p.assetId || '').toUpperCase();
    g.font = '800 30px ' + FONT;
    var pillW = Math.min(500, g.measureText(name).width + (icons.asset ? 100 : 56));
    rr(g, 60, 186, pillW, 64, 32);
    g.fillStyle = isDemo ? '#EEF2FF' : '#ECFDF5'; g.fill();
    g.lineWidth = 2; g.strokeStyle = isDemo ? '#C7D2FE' : '#86EFAC'; g.stroke();
    var tx = 88;
    if (icons.asset) {
      if (icons.asset._light) { g.fillStyle = '#0F172A'; g.beginPath(); g.arc(102, 218, 24, 0, Math.PI * 2); g.fill(); g.drawImage(icons.asset, 86, 202, 32, 32); }
      else g.drawImage(icons.asset, 82, 198, 40, 40);
      tx = 134;
    }
    g.fillStyle = isDemo ? '#3730A3' : '#065F46';
    g.fillText(name, tx, 219);

    var resTxt = tie ? t.tie : (won ? t.won : t.lost);
    var resCol = tie ? '#64748B' : (won ? (isDemo ? '#4F46E5' : '#16A34A') : '#E11D48');
    g.fillStyle = resCol; g.font = '800 26px ' + FONT;
    g.fillText(resTxt.split('').join(String.fromCharCode(8202)), 62, 296);
    var amt = (net > 0 ? '+' : (net < 0 ? '−' : '')) + money(net);
    fitText(g, amt, 520, 104, '800', FONT);
    if (won && !isDemo) { g.shadowColor = 'rgba(34,197,94,0.30)'; g.shadowBlur = 24; }
    g.fillText(amt, 58, 382);
    g.shadowBlur = 0;
    g.fillStyle = '#475569'; g.font = '700 28px ' + FONT;
    g.fillText(t.stake + ' ' + money(stake) + '  ·  Payout ' + Math.round((mult < 2 ? mult - 1 : mult) * 100) + ' %', 62, 462);
    if (isDemo) {
      rr(g, 60, 500, 470, 52, 26); g.fillStyle = '#EEF2FF'; g.fill();
      g.fillStyle = '#4338CA'; g.font = '700 22px ' + FONT;
      g.fillText(t.demoNote, 84, 527);
    }

    // colonne droite : petits cadres
    var cx = 640, cw = 245, chh = 100, gap = 18;
    function cell(x, y, w, label, val, col, mono) {
      rr(g, x, y, w, chh, 22);
      g.fillStyle = A.soft; g.fill();
      g.lineWidth = 2; g.strokeStyle = A.line; g.stroke();
      g.fillStyle = A.lab; g.font = '800 18px ' + FONT;
      g.fillText(label.toUpperCase(), x + 22, y + 32);
      g.fillStyle = col || '#0F172A';
      fitText(g, val, w - 44, 32, '800', mono ? MONO : FONT);
      g.fillText(val, x + 22, y + 70);
    }
    var sideTxt = p.side === 'put' ? t.sell : t.buy;
    var sideCol = p.side === 'put' ? '#E11D48' : '#16A34A';
    cell(cx, 186, cw, t.side, sideTxt, sideCol);
    cell(cx + cw + gap, 186, cw, t.dur, durTxt(p.duration));
    cell(cx, 186 + chh + gap, cw, t.entry, price(p.entryPrice), null, true);
    cell(cx + cw + gap, 186 + chh + gap, cw, t.exit, price(p.exitPrice != null ? p.exitPrice : p.closePrice), null, true);
    cell(cx, 186 + 2 * (chh + gap), cw * 2 + gap, t.date, when(p.at));

    // pied
    g.strokeStyle = isDemo ? '#E0E7FF' : '#FDE7C8'; g.lineWidth = 2;
    g.beginPath(); g.moveTo(60, 586); g.lineTo(W - 60, 586); g.stroke();
    var sg = g.createLinearGradient(60, 0, 330, 0);
    sg.addColorStop(0, A.a); sg.addColorStop(1, isDemo ? '#4F46E5' : '#16A34A');
    g.fillStyle = sg; g.font = '800 38px ' + FONT;
    g.fillText('orolado.com', 60, 630);
    g.textAlign = 'right'; g.fillStyle = '#64748B'; g.font = '700 22px ' + MONO;
    g.fillText(t.no + ' ' + receiptNo(p.id, isDemo ? 'D' : 'T'), W - 60, 630);
    g.textAlign = 'left';

    return cv;
  }

  // ---------- Petits reçus : dépôt (vert), retrait (rouge doux), bonus (or) ----------
  function drawIcon(g, kind, x, y, s) {
    g.save();
    g.translate(x, y);
    g.lineCap = 'round'; g.lineJoin = 'round';
    if (kind === 'bonus') {
      // cadeau : boîte, couvercle, ruban et nœud
      g.fillStyle = '#FFFFFF';
      rr(g, s * 0.16, s * 0.46, s * 0.68, s * 0.44, s * 0.06); g.fill();
      rr(g, s * 0.1, s * 0.32, s * 0.8, s * 0.17, s * 0.05); g.fill();
      g.fillStyle = '#B45309';
      g.fillRect(s * 0.455, s * 0.32, s * 0.09, s * 0.58);
      g.fillRect(s * 0.1, s * 0.38, s * 0.8, s * 0.05);
      g.strokeStyle = '#FFFFFF'; g.lineWidth = s * 0.07;
      g.beginPath();
      g.moveTo(s * 0.5, s * 0.32);
      g.bezierCurveTo(s * 0.3, s * 0.05, s * 0.12, s * 0.22, s * 0.32, s * 0.31);
      g.moveTo(s * 0.5, s * 0.32);
      g.bezierCurveTo(s * 0.7, s * 0.05, s * 0.88, s * 0.22, s * 0.68, s * 0.31);
      g.stroke();
    } else {
      // portefeuille + flèche (entrée pour un dépôt, sortie pour un retrait)
      g.strokeStyle = '#FFFFFF'; g.lineWidth = s * 0.08;
      rr(g, s * 0.12, s * 0.38, s * 0.76, s * 0.5, s * 0.1); g.stroke();
      g.beginPath(); g.moveTo(s * 0.62, s * 0.63); g.lineTo(s * 0.88, s * 0.63); g.stroke();
      g.fillStyle = '#FFFFFF'; g.beginPath(); g.arc(s * 0.7, s * 0.63, s * 0.04, 0, Math.PI * 2); g.fill();
      g.beginPath();
      if (kind === 'deposit') {
        g.moveTo(s * 0.4, s * 0.06); g.lineTo(s * 0.4, s * 0.5);
        g.moveTo(s * 0.26, s * 0.36); g.lineTo(s * 0.4, s * 0.5); g.lineTo(s * 0.54, s * 0.36);
      } else {
        g.moveTo(s * 0.4, s * 0.5); g.lineTo(s * 0.4, s * 0.06);
        g.moveTo(s * 0.26, s * 0.2); g.lineTo(s * 0.4, s * 0.06); g.lineTo(s * 0.54, s * 0.2);
      }
      g.stroke();
    }
    g.restore();
  }

  function drawMoney(r, icons) {
    var t = L();
    var W = 1000, H = 560;
    var cv = document.createElement('canvas');
    cv.width = W; cv.height = H;
    var g = cv.getContext('2d');
    var kind = r.kind === 'withdraw' ? 'withdraw' : (r.kind === 'bonus' ? 'bonus' : 'deposit');
    var C = kind === 'deposit' ? ['#34D399', '#059669', '#065F46']
      : (kind === 'withdraw' ? ['#FCA5A5', '#F87171', '#E0475E'] : ['#FDE68A', '#F59E0B', '#B45309']);
    var bg = g.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, C[0]); bg.addColorStop(0.55, C[1]); bg.addColorStop(1, C[2]);
    rr(g, 0, 0, W, H, 40); g.fillStyle = bg; g.fill();
    g.save(); rr(g, 0, 0, W, H, 40); g.clip();
    g.fillStyle = 'rgba(255,255,255,0.10)';
    g.beginPath(); g.arc(W - 90, 90, 260, 0, Math.PI * 2); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.07)';
    g.beginPath(); g.arc(W - 30, H + 40, 300, 0, Math.PI * 2); g.fill();
    g.restore();
    g.textBaseline = 'middle';
    if (icons.logo) { g.save(); rr(g, 54, 46, 64, 64, 16); g.clip(); g.drawImage(icons.logo, 54, 46, 64, 64); g.restore(); }
    g.fillStyle = '#FFFFFF'; g.font = '800 38px ' + FONT;
    g.fillText('OROLADO', 136, 80);
    var wO = g.measureText('OROLADO').width;
    g.font = '800 26px ' + FONT; g.fillText('.com', 136 + wO + 4, 85);
    // pastille du logo de l'opération
    rr(g, W - 166, 40, 112, 112, 30);
    g.fillStyle = 'rgba(255,255,255,0.22)'; g.fill();
    g.lineWidth = 3; g.strokeStyle = 'rgba(255,255,255,0.55)'; g.stroke();
    drawIcon(g, kind, W - 146, 58, 72);

    g.fillStyle = '#FFFFFF';
    g.shadowColor = 'rgba(0,0,0,0.22)'; g.shadowBlur = 8; g.shadowOffsetY = 2;
    var label = kind === 'deposit' ? t.dep : (kind === 'bonus' ? t.bonus : t.wd);
    if (kind === 'withdraw' && r.statusLabel) label = t.wd + ' · ' + String(r.statusLabel).toUpperCase();
    g.font = '800 28px ' + FONT;
    g.fillText(label.split('').join(String.fromCharCode(8202)), 56, 214);
    var amt = (r.amount >= 0 ? '+' : '−') + money(r.amount);
    fitText(g, amt, W - 120, 96, '800', FONT);
    g.fillText(amt, 52, 300);
    g.font = '700 28px ' + FONT; g.globalAlpha = 0.95;
    g.fillText((r.method ? r.method + '  ·  ' : '') + when(r.at), 56, 380);
    g.globalAlpha = 1;
    g.shadowBlur = 0; g.shadowOffsetY = 0; g.shadowColor = 'rgba(0,0,0,0)';
    g.strokeStyle = 'rgba(255,255,255,0.55)'; g.lineWidth = 2;
    g.beginPath(); g.moveTo(56, 456); g.lineTo(W - 56, 456); g.stroke();
    g.font = '800 34px ' + FONT; g.fillText('orolado.com', 56, 504);
    g.textAlign = 'right'; g.font = '700 20px ' + MONO; g.globalAlpha = 0.9;
    g.fillText(t.no + ' ' + receiptNo(r.ref || r.at, kind === 'deposit' ? 'D' : (kind === 'bonus' ? 'B' : 'R')), W - 56, 504);
    g.globalAlpha = 1; g.textAlign = 'left';
    return cv;
  }

  // ---------- Fenêtre du reçu ----------
  var css = '#rcptModal{position:fixed;inset:0;z-index:2147483000;display:none;align-items:center;justify-content:center;padding:14px;background:rgba(3,6,12,.78);backdrop-filter:blur(3px);-webkit-backdrop-filter:blur(3px)}' +
    '#rcptModal.on{display:flex}' +
    '#rcptModal .rc-box{position:relative;width:min(640px,100%);display:flex;flex-direction:column;gap:12px}' +
    '#rcptModal .rc-img{width:100%;height:auto;display:block;border-radius:18px;box-shadow:0 18px 50px rgba(0,0,0,.55)}' +
    '#rcptModal .rc-btns{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}' +
    '#rcptModal .rc-btn{height:48px;border-radius:14px;border:none;display:flex;align-items:center;justify-content:center;gap:8px;font:800 14px ' + FONT.replace(/"/g, "'") + ';color:#fff;cursor:pointer}' +
    '#rcptModal .rc-btn svg{width:19px;height:19px;flex:0 0 auto}' +
    '#rcptModal .rc-wa{background:linear-gradient(180deg,#34D399,#16A34A);box-shadow:0 0 12px rgba(34,197,94,.35)}' +
    '#rcptModal .rc-sh{background:linear-gradient(180deg,#60A5FA,#2563EB);box-shadow:0 0 12px rgba(37,99,235,.35)}' +
    '#rcptModal .rc-dl{background:linear-gradient(180deg,#FDBA74,#F7931A);box-shadow:0 0 12px rgba(247,147,26,.35)}' +
    '#rcptModal .rc-btn:active{transform:scale(.97);filter:brightness(1.1)}' +
    '#rcptModal .rc-x{position:absolute;top:-14px;right:-6px;width:38px;height:38px;border-radius:50%;border:1px solid rgba(56,189,248,.6);background:#0B1220;color:#E0F2FE;font-size:20px;line-height:1;cursor:pointer;box-shadow:0 0 10px rgba(56,189,248,.4)}' +
    '#rcptModal .rc-wait{color:#cbd5e1;text-align:center;font:700 14px system-ui;padding:40px 0}' +
    '.rc-open{cursor:pointer}' +
    '.rc-dlbtn{display:inline-flex;align-items:center;justify-content:center;width:30px;height:30px;border-radius:9px;border:1px solid rgba(56,189,248,.6);background:linear-gradient(180deg,rgba(56,189,248,.28),rgba(37,99,235,.18));box-shadow:0 0 8px rgba(56,189,248,.35);cursor:pointer;padding:0;vertical-align:middle}' +
    '.rc-dlbtn svg{width:15px;height:15px}' +
    'tr.rc-open:hover td,tr.rc-open:active td{background:rgba(56,189,248,.08)}' +
    '.tx-feed-row.rc-open{border:1px solid rgba(56,189,248,.18);border-radius:12px}' +
    '.tx-feed-row.rc-open:hover,.tx-feed-row.rc-open:active{border-color:rgba(56,189,248,.6);box-shadow:0 0 10px rgba(56,189,248,.2)}';
  var ICO = {
    wa: '<svg viewBox="0 0 24 24"><path fill="#fff" d="M12 2.2A9.7 9.7 0 0 0 3.7 16.9L2.4 21.6l4.8-1.3A9.7 9.7 0 1 0 12 2.2zm5.6 13.7c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.3-.7-2.8-1.1-4.6-4-4.7-4.2-.1-.2-1.1-1.5-1.1-2.9s.7-2.1 1-2.4c.3-.3.6-.3.8-.3h.6c.2 0 .4 0 .6.5l.9 2.1c.1.2.1.4 0 .6l-.4.6-.4.4c-.1.2-.3.3-.1.6.2.3.8 1.4 1.8 2.2 1.2 1.1 2.2 1.4 2.5 1.5.3.2.5.1.7-.1l.9-1.1c.2-.3.4-.2.7-.1l2 .9c.3.2.5.2.6.4.1.1.1.7-.1 1.3z"/></svg>',
    sh: '<svg viewBox="0 0 24 24"><path fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" d="M12 3v12M7.5 7.5 12 3l4.5 4.5M6 12H5a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-6a1 1 0 0 0-1-1h-1"/></svg>',
    dl: '<svg viewBox="0 0 24 24"><path fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" d="M12 4v11m0 0-4.5-4.5M12 15l4.5-4.5M5 19h14"/></svg>'
  };
  D6.ReceiptIcon = ICO.dl;

  var modal = null;
  var current = { canvas: null, name: 'orolado-recu.png' };
  var styleOn = false;
  function ensureStyle() {
    if (styleOn) return;
    styleOn = true;
    var st = document.createElement('style');
    st.textContent = css;
    (document.head || document.documentElement).appendChild(st);
  }
  ensureStyle();
  function ensureModal() {
    if (modal) return modal;
    ensureStyle();
    modal = document.createElement('div');
    modal.id = 'rcptModal';
    modal.innerHTML = '<div class="rc-box"><button type="button" class="rc-x" aria-label="close">×</button><div class="rc-body"></div>' +
      '<div class="rc-btns"><button type="button" class="rc-btn rc-wa">' + ICO.wa + '<span class="t-wa"></span></button>' +
      '<button type="button" class="rc-btn rc-sh">' + ICO.sh + '<span class="t-sh"></span></button>' +
      '<button type="button" class="rc-btn rc-dl">' + ICO.dl + '<span class="t-dl"></span></button></div></div>';
    document.body.appendChild(modal);
    modal.addEventListener('click', function (e) { if (e.target === modal) close(); });
    modal.querySelector('.rc-x').addEventListener('click', close);
    modal.querySelector('.rc-dl').addEventListener('click', function () { download(); });
    modal.querySelector('.rc-sh').addEventListener('click', function () { share(false); });
    modal.querySelector('.rc-wa').addEventListener('click', function () { share(true); });
    return modal;
  }
  function close() { if (modal) modal.classList.remove('on'); }
  function toBlob() {
    return new Promise(function (res) {
      if (!current.canvas) return res(null);
      try { current.canvas.toBlob(function (b) { res(b); }, 'image/png'); } catch (e) { res(null); }
    });
  }
  function download() {
    return toBlob().then(function (b) {
      if (!b) return;
      var url = URL.createObjectURL(b);
      var a = document.createElement('a');
      a.href = url; a.download = current.name;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
    });
  }
  function share(wa) {
    var t = L();
    return toBlob().then(function (b) {
      if (!b) return;
      var file = null;
      try { file = new File([b], current.name, { type: 'image/png' }); } catch (e) { file = null; }
      var data = { files: file ? [file] : [], text: t.shareText + ' · https://orolado.com' };
      if (file && navigator.canShare && navigator.canShare({ files: [file] }) && navigator.share) {
        // Téléphone : le menu de partage s'ouvre avec l'image (WhatsApp, Facebook, Instagram, TikTok…).
        return navigator.share(data).catch(function () { /* annulé */ });
      }
      // Ordinateur (pas de partage d'image) : on enregistre l'image et on ouvre WhatsApp avec le lien.
      return download().then(function () {
        if (wa) window.open('https://wa.me/?text=' + encodeURIComponent(data.text), '_blank', 'noopener');
        else if (navigator.share) navigator.share({ text: data.text, url: 'https://orolado.com' }).catch(function () { /* ignore */ });
      });
    });
  }
  function show(build, name) {
    var t = L();
    var m = ensureModal();
    m.querySelector('.t-wa').textContent = t.wa;
    m.querySelector('.t-sh').textContent = t.share;
    m.querySelector('.t-dl').textContent = t.dl;
    var body = m.querySelector('.rc-body');
    body.innerHTML = '<div class="rc-wait">…</div>';
    m.classList.add('on');
    return Promise.all([fontsReady(), logo()]).then(function (res) {
      return build(res[1]);
    }).then(function (cv) {
      current.canvas = cv; current.name = name;
      var img = new Image();
      img.className = 'rc-img';
      img.alt = 'OROLADO';
      img.src = cv.toDataURL('image/png');
      body.innerHTML = '';
      body.appendChild(img);
    });
  }

  D6.Receipt = {
    trade: function (p, mode) {
      if (!p) return;
      var demo = mode !== 'real';
      return show(function (lg) {
        return assetIcon(p.assetId).then(function (ai) { return drawTrade(p, demo, { logo: lg, asset: ai }); });
      }, 'orolado-' + (demo ? 'demo' : 'recu') + '-' + String(p.id || Date.now()).slice(-8) + '.png');
    },
    money: function (r) {
      if (!r) return;
      return show(function (lg) { return drawMoney(r, { logo: lg }); }, 'orolado-recu-' + (r.kind || 'op') + '.png');
    },
    _drawTrade: drawTrade,
    _drawMoney: drawMoney,
    close: close
  };
})();
