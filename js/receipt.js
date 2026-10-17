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
    zh: { trade: '交易凭证', demo: '模拟凭证', won: '交易盈利', lost: '交易亏损', tie: '平局 · 退还金额', stake: '金额', side: '方向', dur: '时长', entry: '入场', exit: '出场', date: '日期', buy: '买入 ↗', sell: '卖出 ↘', no: '凭证编号', demoNote: '模拟账户 · 虚拟资金', dep: '已收到充值', wd: '提现', bonus: '已收到奖励', wa: 'WhatsApp', share: '分享', dl: '下载', close: '关闭', shareText: '我在 orolado.com 的交易' },
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
    return '$\u00a0\u00a0' + Math.abs(v).toFixed(2);
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
    // Nouveau logo rond OROLADO (sans carré) ; l'ancienne icône en secours.
    if (!logoP) logoP = loadImg('icons/logo-ring.svg?v=2656').then(function (im) { if (im) { im._ring = true; return im; } return loadImg('icons/icon-512.png?v=2656'); });
    return logoP;
  }
  // Logo de la simulation : le même dessin que sur les cases du site.
  function assetIcon(assetId) {
    try {
      // Globe du marché (planète + dessin), comme sur le site ; ancien pictogramme en secours.
      var chip = document.querySelector('.asset-chip[data-asset="' + assetId + '"]');
      var art = chip && chip.querySelector('.mk-art svg');
      if (art) return globeIcon(chip, art);
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
  function globeIcon(chip, art) {
    var cs = getComputedStyle(chip);
    var p1 = (cs.getPropertyValue('--p1') || '#C9B8FF').trim() || '#C9B8FF';
    var p2 = (cs.getPropertyValue('--p2') || '#3B1D8F').trim() || '#3B1D8F';
    var c = art.cloneNode(true);
    c.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    c.setAttribute('width', '96');
    c.setAttribute('height', '96');
    var str = new XMLSerializer().serializeToString(c);
    return loadImg('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(str)).then(function (im) {
      var cv = document.createElement('canvas');
      cv.width = 96; cv.height = 96;
      var g = cv.getContext('2d');
      var gr = g.createRadialGradient(36, 32, 4, 48, 48, 48);
      gr.addColorStop(0, p1); gr.addColorStop(0.62, p2); gr.addColorStop(1, '#07051A');
      g.fillStyle = gr; g.beginPath(); g.arc(48, 48, 47, 0, Math.PI * 2); g.fill();
      if (im) g.drawImage(im, 17, 17, 62, 62);
      return cv;
    });
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

  // ---------- Reçu de trade (format vertical, dessiné en double résolution : net partout) ----------
  var SC = 2;
  function canvasFor(W, H) {
    var cv = document.createElement('canvas');
    cv.width = W * SC; cv.height = H * SC;
    var g = cv.getContext('2d');
    g.scale(SC, SC);
    g.imageSmoothingEnabled = true;
    g.imageSmoothingQuality = 'high';
    return { cv: cv, g: g };
  }
  function spaced(s) { return String(s).split('').join(String.fromCharCode(8202)); }
  function drawLogo(g, img, x, y, s) {
    if (img && img._ring) {
      // Logo rond : posé tel quel, avec une ombre douce (plus de carré sombre derrière).
      g.save(); g.shadowColor = 'rgba(15,23,42,0.30)'; g.shadowBlur = 12; g.shadowOffsetY = 3;
      g.drawImage(img, x - s * 0.06, y - s * 0.06, s * 1.12, s * 1.12); g.restore();
      return;
    }
    g.save(); g.shadowColor = 'rgba(15,23,42,0.28)'; g.shadowBlur = 10; g.shadowOffsetY = 3;
    rr(g, x, y, s, s, s * 0.22); g.fillStyle = '#0F172A'; g.fill(); g.restore();
    if (img) { g.save(); rr(g, x, y, s, s, s * 0.22); g.clip(); g.drawImage(img, x, y, s, s); g.restore(); }
  }
  function sitePill(g, cx, cy, txtCol, fillCol, lineCol) {
    g.save();
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = '800 15px ' + FONT;
    var sw = g.measureText('orolado.com').width + 30;
    rr(g, cx - sw / 2, cy - 15, sw, 30, 15);
    g.fillStyle = fillCol; g.fill(); g.lineWidth = 1.5; g.strokeStyle = lineCol; g.stroke();
    g.fillStyle = txtCol; g.fillText('orolado.com', cx, cy + 1);
    g.restore();
  }

  function drawTrade(p, isDemo, icons) {
    var t = L();
    var W = 540;
    var A = isDemo
      ? { a: '#6366F1', b: '#94A3B8', soft: '#F1F3FF', line: '#D5DAFB', lab: '#4338CA', pillT: '#4338CA', pillF: '#EEF2FF', pillL: '#C7D2FE' }
      : { a: '#F7931A', b: '#22C55E', soft: '#FFF7ED', line: '#FCD9B0', lab: '#9A3412', pillT: '#C2410C', pillF: '#FFF1E0', pillL: '#FDBA74' };
    var status = String(p.status || (p.won ? 'won' : 'lost'));
    var won = status === 'won' || p.won === true;
    var tie = status === 'void' || p.voided;
    var stake = Number(p.stake) || 0;
    var mult = Number(p.payout) || 1.88;
    var net = tie ? 0 : (won ? stake * mult - stake : -stake);
    if (p.net !== null && p.net !== undefined && isFinite(Number(p.net)) && Number(p.net) !== 0) net = Number(p.net);

    var cellsTop = 420;
    var cellH = 70, gap = 12;
    var H = cellsTop + 3 * cellH + 2 * gap + 84;
    var c = canvasFor(W, H), g = c.g;

    var bg = g.createLinearGradient(0, 0, 0, H);
    // v2663 (propriétaire) : le reçu RÉEL a un vrai fond doré (le démo reste blanc) → on voit tout de suite la différence.
    bg.addColorStop(0, isDemo ? '#FFFFFF' : '#FFF6E2');
    if (!isDemo) bg.addColorStop(0.55, '#FFE7B8');
    bg.addColorStop(1, isDemo ? '#F4F6FF' : '#FFD992');
    g.fillStyle = bg; g.fillRect(0, 0, W, H);
    var bd = g.createLinearGradient(0, 0, W, H);
    bd.addColorStop(0, A.a); bd.addColorStop(1, A.b);
    g.lineWidth = 6; g.strokeStyle = bd; g.strokeRect(3, 3, W - 6, H - 6);
    var gl = g.createRadialGradient(W - 60, 30, 5, W - 60, 30, 260);
    gl.addColorStop(0, isDemo ? 'rgba(99,102,241,0.10)' : 'rgba(255,255,255,0.75)');
    gl.addColorStop(1, 'rgba(255,255,255,0)');
    g.save(); g.beginPath(); g.rect(6, 6, W - 12, H - 12); g.clip(); g.fillStyle = gl; g.fillRect(0, 0, W, H); g.restore();

    // en-tête : grand logo net + OROLADO.com
    g.textBaseline = 'middle'; g.textAlign = 'left';
    drawLogo(g, icons.logo, 28, 26, 72);
    g.fillStyle = '#0F172A'; g.font = '800 30px ' + FONT;
    g.fillText('OROLADO', 114, 62);
    var wO = g.measureText('OROLADO').width;
    g.fillStyle = A.a; g.font = '800 20px ' + FONT;
    g.fillText('.com', 114 + wO + 3, 66);
    g.strokeStyle = isDemo ? '#E0E7FF' : '#FDE7C8'; g.lineWidth = 1.5;
    g.beginPath(); g.moveTo(28, 122); g.lineTo(W - 28, 122); g.stroke();

    // simulation (logo + nom), centrée
    var name = String(p.assetName || p.assetId || '').toUpperCase();
    g.font = '800 19px ' + FONT;
    var nw = g.measureText(name).width;
    var pw = nw + (icons.asset ? 64 : 36);
    var px = (W - pw) / 2;
    rr(g, px, 142, pw, 42, 21);
    g.fillStyle = isDemo ? '#EEF2FF' : '#ECFDF5'; g.fill();
    g.lineWidth = 1.5; g.strokeStyle = isDemo ? '#C7D2FE' : '#86EFAC'; g.stroke();
    var tx = px + 18;
    if (icons.asset) {
      if (icons.asset._light) { g.fillStyle = '#0F172A'; g.beginPath(); g.arc(px + 30, 163, 15, 0, Math.PI * 2); g.fill(); g.drawImage(icons.asset, px + 20, 153, 20, 20); }
      else g.drawImage(icons.asset, px + 17, 150, 26, 26);
      tx = px + 52;
    }
    g.fillStyle = isDemo ? '#3730A3' : '#065F46';
    g.fillText(name, tx, 164);

    // résultat + montant
    g.textAlign = 'center';
    var resTxt = tie ? t.tie : (won ? t.won : t.lost);
    var resCol = tie ? '#64748B' : (won ? (isDemo ? '#4F46E5' : '#16A34A') : '#E11D48');
    g.fillStyle = resCol; g.font = '800 15px ' + FONT;
    g.fillText(spaced(resTxt), W / 2, 214);
    var amt = (net > 0 ? '+' : (net < 0 ? '−' : '')) + money(net);
    fitText(g, amt, W - 80, 66, '800', FONT);
    if (won && !isDemo) { g.shadowColor = 'rgba(34,197,94,0.28)'; g.shadowBlur = 16; }
    g.fillText(amt, W / 2, 266);
    g.shadowBlur = 0; g.shadowColor = 'rgba(0,0,0,0)';

    // orolado.com : bien détaché du montant
    sitePill(g, W / 2, 334, A.pillT, A.pillF, A.pillL);

    g.fillStyle = '#475569'; g.font = '700 16px ' + FONT;
    g.fillText(t.stake + ' ' + money(stake) + '  ·  Payout ' + Math.round((mult < 2 ? mult - 1 : mult) * 100) + ' %', W / 2, 382);
    if (false) {
      g.font = '700 13px ' + FONT;
      var dw = g.measureText(t.demoNote).width + 30;
      rr(g, (W - dw) / 2, 404, dw, 28, 14); g.fillStyle = '#EEF2FF'; g.fill();
      g.fillStyle = '#4338CA'; g.fillText(t.demoNote, W / 2, 419);
    }

    // petits cadres
    g.textAlign = 'left';
    var cw = (W - 56 - gap) / 2;
    function cell(x, y, w, label, val, col, mono) {
      rr(g, x, y, w, cellH, 14);
      g.fillStyle = isDemo ? A.soft : 'rgba(255,255,255,0.86)'; g.fill();
      g.lineWidth = 1.5; g.strokeStyle = A.line; g.stroke();
      g.fillStyle = A.lab; g.font = '800 11px ' + FONT;
      g.fillText(spaced(label.toUpperCase()), x + 16, y + 22);
      g.fillStyle = col || '#0F172A';
      fitText(g, val, w - 32, 21, '800', mono ? MONO : FONT);
      g.fillText(val, x + 16, y + 49);
    }
    var sideTxt = p.side === 'put' ? t.sell : t.buy;
    var sideCol = p.side === 'put' ? '#E11D48' : '#16A34A';
    var y0 = cellsTop;
    cell(28, y0, cw, t.side, sideTxt, sideCol);
    cell(28 + cw + gap, y0, cw, t.dur, durTxt(p.duration));
    cell(28, y0 + cellH + gap, cw, t.entry, price(p.entryPrice), null, true);
    cell(28 + cw + gap, y0 + cellH + gap, cw, t.exit, price(p.exitPrice != null ? p.exitPrice : p.closePrice), null, true);
    cell(28, y0 + 2 * (cellH + gap), W - 56, t.date, when(p.at));

    // pied : numéro du reçu
    var fy = y0 + 3 * cellH + 2 * gap + 22;
    g.strokeStyle = isDemo ? '#E0E7FF' : '#FDE7C8'; g.lineWidth = 1.5;
    g.beginPath(); g.moveTo(28, fy); g.lineTo(W - 28, fy); g.stroke();
    g.textAlign = 'center'; g.fillStyle = '#64748B'; g.font = '700 13px ' + MONO;
    g.fillText(t.no + ' ' + receiptNo(p.id, isDemo ? 'D' : 'T'), W / 2, fy + 32);
    g.textAlign = 'left';
    return c.cv;
  }

  // ---------- Petits reçus : dépôt (vert), retrait (rouge doux), bonus (or) ----------
  function drawIcon(g, kind, x, y, s) {
    g.save();
    g.translate(x, y);
    g.lineCap = 'round'; g.lineJoin = 'round';
    if (kind === 'bonus') {
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
    var W = 540, H = 560;
    var c = canvasFor(W, H), g = c.g;
    var kind = r.kind === 'withdraw' ? 'withdraw' : (r.kind === 'bonus' ? 'bonus' : 'deposit');
    var C = kind === 'deposit' ? ['#34D399', '#059669', '#065F46']
      : (kind === 'withdraw' ? ['#FCA5A5', '#F87171', '#E0475E'] : ['#FDE68A', '#F59E0B', '#B45309']);
    var bg = g.createLinearGradient(0, 0, W * 0.6, H);
    bg.addColorStop(0, C[0]); bg.addColorStop(0.55, C[1]); bg.addColorStop(1, C[2]);
    g.fillStyle = bg; g.fillRect(0, 0, W, H);
    g.save(); g.beginPath(); g.rect(0, 0, W, H); g.clip();
    g.fillStyle = 'rgba(255,255,255,0.10)';
    g.beginPath(); g.arc(W - 40, 60, 170, 0, Math.PI * 2); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.07)';
    g.beginPath(); g.arc(W + 10, H + 20, 200, 0, Math.PI * 2); g.fill();
    g.restore();
    g.textBaseline = 'middle'; g.textAlign = 'left';
    drawLogo(g, icons.logo, 28, 26, 72);
    g.fillStyle = '#FFFFFF'; g.font = '800 30px ' + FONT;
    g.fillText('OROLADO', 114, 62);
    var wO = g.measureText('OROLADO').width;
    g.font = '800 20px ' + FONT; g.fillText('.com', 114 + wO + 3, 66);

    // logo de l'opération, centré
    rr(g, W / 2 - 50, 136, 100, 100, 28);
    g.fillStyle = 'rgba(255,255,255,0.22)'; g.fill();
    g.lineWidth = 2; g.strokeStyle = 'rgba(255,255,255,0.6)'; g.stroke();
    drawIcon(g, kind, W / 2 - 34, 152, 68);

    g.textAlign = 'center';
    g.fillStyle = '#FFFFFF';
    g.shadowColor = 'rgba(0,0,0,0.20)'; g.shadowBlur = 6; g.shadowOffsetY = 2;
    var label = kind === 'deposit' ? t.dep : (kind === 'bonus' ? t.bonus : t.wd);
    if (kind === 'withdraw' && r.statusLabel) label = t.wd + ' · ' + String(r.statusLabel).toUpperCase();
    g.font = '800 16px ' + FONT;
    g.fillText(spaced(label), W / 2, 272);
    var amt = (r.amount >= 0 ? '+' : '−') + money(r.amount);
    fitText(g, amt, W - 80, 64, '800', FONT);
    g.fillText(amt, W / 2, 322);
    g.shadowBlur = 0; g.shadowOffsetY = 0; g.shadowColor = 'rgba(0,0,0,0)';

    sitePill(g, W / 2, 388, '#FFFFFF', 'rgba(255,255,255,0.22)', 'rgba(255,255,255,0.6)');

    g.fillStyle = '#FFFFFF';
    g.font = '700 16px ' + FONT; g.globalAlpha = 0.95;
    g.fillText((r.method ? r.method + '  ·  ' : '') + when(r.at), W / 2, 436);
    g.globalAlpha = 1;
    g.strokeStyle = 'rgba(255,255,255,0.5)'; g.lineWidth = 1.5;
    g.beginPath(); g.moveTo(28, 484); g.lineTo(W - 28, 484); g.stroke();
    g.font = '700 13px ' + MONO; g.globalAlpha = 0.92;
    g.fillText(t.no + ' ' + receiptNo(r.ref || r.at, kind === 'deposit' ? 'D' : (kind === 'bonus' ? 'B' : 'R')), W / 2, 518);
    g.globalAlpha = 1; g.textAlign = 'left';
    return c.cv;
  }

  // ---------- v2790 (propriétaire) : reçu de PARI en image, couleurs OROLADO (violet nuit + or) ----------
  // x = textes déjà traduits par sports.js ; aucune touche / aucun bouton dans l'image.
  function drawBet(bt, x, icons) {
    var W = 540;
    var sel = bt.sel || [];
    var st = bt.status || 'open';
    var SC2 = { open: '#38BDF8', won: '#22C55E', lost: '#F43F5E', void: '#CBD5E1' };
    var col = SC2[st] || '#38BDF8';
    var selTop = 448, selH = 66, selGap = 10;
    var rowsTop = selTop + sel.length * (selH + selGap) + 14;
    var rowH = 40, rows = 5;
    var H = rowsTop + rows * rowH + 120;
    var c = canvasFor(W, H), g = c.g;
    var n2 = function (v) { return (Number(v) || 0).toFixed(2); };

    var bg = g.createLinearGradient(0, 0, W * 0.4, H);
    bg.addColorStop(0, '#24104F'); bg.addColorStop(0.5, '#150A33'); bg.addColorStop(1, '#0A0620');
    g.fillStyle = bg; g.fillRect(0, 0, W, H);
    g.save(); g.beginPath(); g.rect(0, 0, W, H); g.clip();
    var gl = g.createRadialGradient(W - 70, 40, 5, W - 70, 40, 300);
    gl.addColorStop(0, 'rgba(251,191,36,0.22)'); gl.addColorStop(1, 'rgba(251,191,36,0)');
    g.fillStyle = gl; g.fillRect(0, 0, W, H);
    var gl2 = g.createRadialGradient(40, H - 40, 5, 40, H - 40, 280);
    gl2.addColorStop(0, 'rgba(139,92,246,0.25)'); gl2.addColorStop(1, 'rgba(139,92,246,0)');
    g.fillStyle = gl2; g.fillRect(0, 0, W, H);
    g.restore();
    var bd = g.createLinearGradient(0, 0, W, H);
    bd.addColorStop(0, '#FDE68A'); bd.addColorStop(0.5, '#F59E0B'); bd.addColorStop(1, '#B45309');
    g.lineWidth = 6; g.strokeStyle = bd; rr(g, 3, 3, W - 6, H - 6, 22); g.stroke();

    // en-tête
    g.textBaseline = 'middle'; g.textAlign = 'left';
    drawLogo(g, icons.logo, 28, 26, 72);
    g.fillStyle = '#FFFFFF'; g.font = '800 30px ' + FONT;
    g.fillText('OROLADO', 114, 62);
    var wO = g.measureText('OROLADO').width;
    g.fillStyle = '#FBBF24'; g.font = '800 20px ' + FONT;
    g.fillText('.com', 114 + wO + 3, 66);
    g.strokeStyle = 'rgba(251,191,36,0.35)'; g.lineWidth = 1.5;
    g.beginPath(); g.moveTo(28, 122); g.lineTo(W - 28, 122); g.stroke();

    // titre « Reçu de pari » dans une pastille dorée
    g.textAlign = 'center';
    var tt = String(x.rcTitle || '').toUpperCase();
    g.font = '800 15px ' + FONT;
    var tw = Math.min(W - 80, g.measureText(spaced(tt)).width + 40);
    rr(g, (W - tw) / 2, 140, tw, 36, 18);
    var pg = g.createLinearGradient(0, 140, 0, 176); pg.addColorStop(0, '#FDE68A'); pg.addColorStop(1, '#F59E0B');
    g.fillStyle = pg; g.fill();
    g.fillStyle = '#2A1600'; g.fillText(spaced(tt), W / 2, 159);

    // état + montant
    var stTxt = { open: x.open, won: x.wonL, lost: x.lostL, void: x.voidL }[st] || st;
    var bigLab = st === 'won' ? x.rcPaid : st === 'lost' ? x.rcLostTxt : st === 'void' ? x.rcBack : x.potL;
    var big = (st === 'won' ? n2(bt.win) : st === 'lost' ? n2(0) : st === 'void' ? n2(bt.stake) : n2(bt.pot)) + ' $';
    g.font = '800 14px ' + FONT;
    var sw = g.measureText(spaced(String(stTxt).toUpperCase())).width + 34;
    rr(g, (W - sw) / 2, 196, sw, 30, 15);
    g.fillStyle = col + '2E'; g.fill(); g.lineWidth = 1.5; g.strokeStyle = col; g.stroke();
    g.fillStyle = col; g.fillText(spaced(String(stTxt).toUpperCase()), W / 2, 212);
    g.fillStyle = 'rgba(255,255,255,0.75)'; g.font = '700 15px ' + FONT;
    g.fillText(String(bigLab || ''), W / 2, 248);
    g.fillStyle = st === 'lost' ? '#FFFFFF' : (st === 'won' ? '#4ADE80' : '#FDE68A');
    fitText(g, big, W - 80, 62, '800', FONT);
    if (st === 'won') { g.shadowColor = 'rgba(34,197,94,0.45)'; g.shadowBlur = 18; }
    g.fillText(big, W / 2, 296);
    g.shadowBlur = 0; g.shadowColor = 'rgba(0,0,0,0)';

    sitePill(g, W / 2, 352, '#FDE68A', 'rgba(251,191,36,0.14)', 'rgba(251,191,36,0.6)');

    // ligne de découpe (ticket)
    g.save(); g.setLineDash([8, 7]); g.strokeStyle = 'rgba(251,191,36,0.45)'; g.lineWidth = 2;
    g.beginPath(); g.moveTo(28, 392); g.lineTo(W - 28, 392); g.stroke(); g.restore();
    g.fillStyle = '#0A0620';
    g.beginPath(); g.arc(3, 392, 14, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.arc(W - 3, 392, 14, 0, Math.PI * 2); g.fill();

    g.textAlign = 'left';
    g.fillStyle = '#FBBF24'; g.font = '800 12px ' + FONT;
    g.fillText(spaced(String((sel.length > 1 ? x.rcCombo : x.rcSingle) + ' · ' + sel.length).toUpperCase()), 30, 424);

    // chaque choix
    var RCOL = { won: '#22C55E', lost: '#F43F5E', void: '#94A3B8' };
    sel.forEach(function (s, i) {
      var y = selTop + i * (selH + selGap);
      rr(g, 28, y, W - 56, selH, 14);
      g.fillStyle = 'rgba(255,255,255,0.06)'; g.fill();
      g.lineWidth = 1.5; g.strokeStyle = 'rgba(167,139,250,0.35)'; g.stroke();
      var rc = RCOL[s.r] || '#38BDF8';
      g.fillStyle = rc; g.beginPath(); g.arc(56, y + selH / 2, 13, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#FFFFFF'; g.textAlign = 'center'; g.font = '800 15px ' + FONT;
      g.fillText(s.r === 'won' ? '✓' : s.r === 'lost' ? '✕' : s.r === 'void' ? '↺' : '•', 56, y + selH / 2 + 1);
      g.textAlign = 'left';
      var odd = Number(s.odd).toFixed(2);
      g.font = '800 22px ' + FONT;
      var ow = g.measureText(odd).width;
      var tx = 82, maxW = W - 56 - (tx - 28) - ow - 30;
      g.fillStyle = 'rgba(255,255,255,0.62)';
      fitText(g, String(s.t || ''), maxW, 13, '700', FONT);
      g.fillText(String(s.t || ''), tx, y + 22);
      g.fillStyle = '#FFFFFF';
      fitText(g, String(s.l || ''), maxW, 18, '800', FONT);
      g.fillText(String(s.l || ''), tx, y + 45);
      g.fillStyle = '#FDE68A'; g.font = '800 22px ' + FONT; g.textAlign = 'right';
      g.fillText(odd, W - 44, y + selH / 2 + 1);
      g.textAlign = 'left';
    });

    // mise, cote, gain, date, numéro
    var d = new Date((bt.at || 0) * 1000), pad = function (k) { return (k < 10 ? '0' : '') + k; };
    var dt = pad(d.getDate()) + '/' + pad(d.getMonth() + 1) + '/' + d.getFullYear() + ' · ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
    var no = String(bt.id || '').slice(-10).toUpperCase();
    var R = [[x.stakeL, n2(bt.stake) + ' $'], [x.totalOdd, Number(bt.odd).toFixed(2)], [x.potL, n2(bt.pot) + ' $'], [x.rcDate, dt], [x.rcNo, no]];
    rr(g, 28, rowsTop, W - 56, rows * rowH + 8, 14);
    g.fillStyle = 'rgba(251,191,36,0.07)'; g.fill(); g.lineWidth = 1.5; g.strokeStyle = 'rgba(251,191,36,0.35)'; g.stroke();
    R.forEach(function (r, i) {
      var y = rowsTop + 4 + i * rowH + rowH / 2;
      if (i) { g.strokeStyle = 'rgba(255,255,255,0.08)'; g.lineWidth = 1; g.beginPath(); g.moveTo(44, y - rowH / 2); g.lineTo(W - 44, y - rowH / 2); g.stroke(); }
      g.textAlign = 'left'; g.fillStyle = 'rgba(255,255,255,0.7)'; g.font = '700 15px ' + FONT;
      g.fillText(String(r[0] || ''), 46, y);
      g.textAlign = 'right'; g.fillStyle = i === 2 ? '#FDE68A' : '#FFFFFF'; g.font = '800 16px ' + (i === 4 ? MONO : FONT);
      g.fillText(String(r[1]), W - 46, y);
    });

    // code-barres + pied
    var by = rowsTop + rows * rowH + 30, bx = 120, k = 0;
    g.fillStyle = 'rgba(255,255,255,0.85)';
    while (bx < W - 120) { var cc = no.charCodeAt(k % (no.length || 1)) || 7; var w = 1 + (cc + k) % 3; g.fillRect(bx, by, w, 34); bx += w + 2 + (cc % 2); k++; }
    g.textAlign = 'center'; g.fillStyle = '#FBBF24'; g.font = '800 15px ' + FONT;
    g.fillText('orolado.com', W / 2, by + 60);
    g.textAlign = 'left';
    return c.cv;
  }

  // ---------- Fenêtre du reçu ----------
  var css = '#rcptModal{position:fixed;inset:0;z-index:2147483000;display:none;align-items:center;justify-content:center;padding:14px;background:rgba(3,6,12,.78);backdrop-filter:blur(3px);-webkit-backdrop-filter:blur(3px)}' +
    '#rcptModal.on{display:flex}' +
    // v2465 — bouton « ‹ Retour » au-dessus du reçu (hors de l'image du reçu), style OROLADO.
    '#rcptModal .rc-back{align-self:flex-start;display:inline-flex;align-items:center;gap:6px;height:34px;padding:0 14px 0 6px;border-radius:999px;border:1px solid rgba(251,191,36,.7);cursor:pointer;' +
    'background:linear-gradient(135deg,rgba(40,28,8,.92),rgba(20,16,44,.94));color:#FFF3C4;font:800 13.5px/1 "Hanken Grotesk",system-ui,sans-serif;box-shadow:0 4px 14px rgba(0,0,0,.45),0 0 12px rgba(251,191,36,.25)}' +
    '#rcptModal .rc-back i{width:24px;height:24px;border-radius:50%;display:grid;place-items:center;background:radial-gradient(circle at 32% 28%,#FFF3C4,#F5C451 50%,#B8780C)}' +
    '#rcptModal .rc-back i svg{width:14px;height:14px;fill:none;stroke:#2A1600;stroke-width:3;stroke-linecap:round;stroke-linejoin:round}' +
    '#rcptModal .rc-back:active{transform:scale(.96)}' +
    '#rcptModal .rc-box{position:relative;width:min(380px,100%);display:flex;flex-direction:column;gap:12px}' +
    '#rcptModal .rc-img{width:100%;height:auto;max-height:70vh;object-fit:contain;display:block;border-radius:18px;box-shadow:0 18px 50px rgba(0,0,0,.55)}' +
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
    modal.innerHTML = '<div class="rc-box"><button type="button" class="rc-back"><i><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.5 6l-6 6 6 6"/></svg></i><span class="t-back"></span></button><div class="rc-body"></div>' +
      '<div class="rc-btns"><button type="button" class="rc-btn rc-wa">' + ICO.wa + '<span class="t-wa"></span></button>' +
      '<button type="button" class="rc-btn rc-sh">' + ICO.sh + '<span class="t-sh"></span></button>' +
      '<button type="button" class="rc-btn rc-dl">' + ICO.dl + '<span class="t-dl"></span></button></div></div>';
    document.body.appendChild(modal);
    modal.addEventListener('click', function (e) { if (e.target === modal) close(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
    modal.querySelector('.rc-back').addEventListener('click', function () { close(); });
    modal.querySelector('.rc-dl').addEventListener('click', function () { download(); });
    modal.querySelector('.rc-sh').addEventListener('click', function () { share(false); });
    modal.querySelector('.rc-wa').addEventListener('click', function () { openWhatsApp(); });
    return modal;
  }
  function close() { if (modal) modal.classList.remove('on'); }
  function toBlob() {
    return new Promise(function (res) {
      if (!current.canvas) return res(null);
      try { current.canvas.toBlob(function (b) { res(b); }, 'image/png'); } catch (e) { res(null); }
    });
  }
  var IOS = /iPhone|iPad|iPod/i.test(navigator.userAgent || '') || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  function fileOf(b) {
    try { return new File([b], current.name, { type: 'image/png' }); } catch (e) { return null; }
  }
  function canShareFile(file) {
    try { return !!(file && navigator.share && navigator.canShare && navigator.canShare({ files: [file] })); } catch (e) { return false; }
  }
  // L'image est préparée dès l'ouverture du reçu : le partage part tout de suite au toucher
  // (sur iPhone, un partage lancé trop tard après le toucher est refusé).
  function withBlob(fn) {
    if (current.blob) return fn(current.blob);
    return toBlob().then(function (b) { if (b) current.blob = b; return b ? fn(b) : null; });
  }
  function saveByLink(b) {
    var url = URL.createObjectURL(b);
    var a = document.createElement('a');
    a.href = url; a.download = current.name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
  }
  // Télécharger : sur iPhone, menu du téléphone avec « Enregistrer l'image » (pas de page
  // « Afficher » qui sortait du site) ; ailleurs, l'image est enregistrée directement.
  function download() {
    return withBlob(function (b) {
      var file = fileOf(b);
      if (IOS && canShareFile(file)) {
        return navigator.share({ files: [file] }).catch(function () { /* annulé */ });
      }
      saveByLink(b);
    });
  }
  // Partager : l'image seule (avec un texte en plus, « Enregistrer l'image » ne marchait pas sur iPhone).
  function share() {
    return withBlob(function (b) {
      var file = fileOf(b);
      if (canShareFile(file)) {
        return navigator.share({ files: [file] }).catch(function () { /* annulé */ });
      }
      saveByLink(b);
      if (navigator.share) navigator.share({ url: 'https://orolado.com' }).catch(function () { /* ignore */ });
    });
  }

  // WhatsApp : ouvre directement l'application WhatsApp (choix d'un contact) avec le lien du site.
  // Une page web ne peut pas joindre l'image toute seule : pour envoyer l'image ou la mettre
  // en statut, c'est « Partager » → WhatsApp.
  function openWhatsApp() {
    var txt = L().shareText + ' · https://orolado.com';
    var mobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent || '');
    if (mobile) {
      window.location.href = 'whatsapp://send?text=' + encodeURIComponent(txt);
    } else {
      window.open('https://web.whatsapp.com/send?text=' + encodeURIComponent(txt), '_blank', 'noopener');
    }
  }

  function show(build, name) {
    var t = L();
    var m = ensureModal();
    m.querySelector('.t-wa').textContent = t.wa;
    m.querySelector('.t-sh').textContent = t.share;
    m.querySelector('.t-dl').textContent = t.dl;
    var BACK = { fr: 'Retour', en: 'Back', es: 'Volver', pt: 'Voltar', ar: 'رجوع', tr: 'Geri', vi: 'Quay lại', id: 'Kembali', ru: 'Назад', de: 'Zurück', hi: 'वापस', zh: '返回' };
    var lg = (D6.I18N && D6.I18N.lang) || 'en';
    m.querySelector('.t-back').textContent = BACK[lg] || BACK.en;
    m.querySelector('.rc-back').setAttribute('aria-label', BACK[lg] || BACK.en);
    var body = m.querySelector('.rc-body');
    body.innerHTML = '<div class="rc-wait">…</div>';
    m.classList.add('on');
    return Promise.all([fontsReady(), logo()]).then(function (res) {
      return build(res[1]);
    }).then(function (cv) {
      current.canvas = cv; current.name = name; current.blob = null;
      try { cv.toBlob(function (bb) { if (current.canvas === cv) current.blob = bb; }, 'image/png'); } catch (eB) { /* ignore */ }
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
    bet: function (bt, x) {
      if (!bt) return;
      return show(function (lg) { return drawBet(bt, x || {}, { logo: lg }); }, 'orolado-pari-' + String(bt.id || Date.now()).slice(-8) + '.png');
    },
    _drawTrade: drawTrade,
    _drawMoney: drawMoney,
    close: close
  };
})();
