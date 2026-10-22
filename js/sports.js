/* v2690 — PARIS SPORTIFS (dans le Casino) : matchs créés par l'admin avec ses cotes, COUPON d'1 à 10 matchs
   (les cotes se multiplient), dès 0,10 $, argent réel. Le serveur vérifie tout (api.php spList / spBet / spMine). */
(function (D6) {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var T = {
    fr: { none: 'Pas encore de prédiction. Les prochaines questions arrivent bientôt ici.', coupon: 'Ticket de paris', sel: '{n} sélection(s)', odd: 'Cote', stake: 'Mise', pot: 'Gain possible', bet: 'Parier', clear: 'Vider',
      placed: '✅ Pari enregistré · gain possible {p} $', mine: 'Mes paris', noBets: 'Aucun pari pour l’instant.', open: 'En cours', won: 'Gagné', lost: 'Perdu', void: 'Annulé',
      closed: 'Paris fermés', result: 'Résultat', starts: 'Début', today: 'Aujourd’hui', tomorrow: 'Demain', draw: 'Nul', max10: '50 matchs au maximum dans un coupon.',
      e_min: 'Mise minimum 0,10 $.', e_max: 'Mise trop élevée pour ce match.', e_maxWin: 'Gain trop élevé : baisse la mise.', e_closed: 'Ce match a déjà commencé.', e_insufficient: 'Solde insuffisant.', e_unavailable: 'Indisponible, réessaie.', e_param: 'Coupon invalide.', e_login: 'Connecte-toi pour parier.', e_busy: 'Un instant…', e_suspended: 'Compte suspendu.',
      guestBet: '🔒 Inscris-toi pour parier (c’est gratuit)',
      myCoupon: 'Ticket de paris', clearAll: 'Tout supprimer', confirmClear: 'Sûr ? Touche encore', comboT: 'Combiné :', combo: 'tous tes choix doivent être gagnants. Les cotes se multiplient.', singleT: 'Simple :', single: 'un seul choix.', totalOdd: 'Cote totale', see: 'Voir', minNote: 'Mise minimum 0,10 $', done: 'Pari enregistré !', cont: 'Fermer', emptySlip: 'Ton coupon est vide. Touche une cote pour commencer.',
      betsTab: 'Paris', guestMine: 'Crée ton compte pour parier : tous tes paris s’afficheront ici, avec leur résultat.', guestBtn: 'Créer mon compte', seeBets: 'Voir les paris', stakeL: 'Mise', oddL: 'Cote', potL: 'Gain possible', wonL: 'Gagné', lostL: 'Perdu', voidL: 'Remboursé', loading: 'Un instant…',
      all: 'Tous', drawCode: 'N', sport: { foot: 'Football', basket: 'Basket', boxe: 'Boxe', tennis: 'Tennis', mma: 'MMA', event: 'Prédictions', crypto: 'Crypto', politique: 'Politique', autre: 'Sport' } },
    en: { none: 'No match right now. Big matches are coming here soon.', coupon: 'Bet slip', sel: '{n} selection(s)', odd: 'Odds', stake: 'Stake', pot: 'Potential win', bet: 'Place bet', clear: 'Clear',
      placed: '✅ Bet placed! Potential win: ${p}', mine: 'My bets', noBets: 'No bet yet.', open: 'Open', won: 'Won', lost: 'Lost', void: 'Void',
      closed: 'Betting closed', result: 'Result', starts: 'Starts', today: 'Today', tomorrow: 'Tomorrow', draw: 'Draw', max10: 'Maximum 50 matches in a slip.',
      e_min: 'Minimum stake $0.10.', e_max: 'Stake too high for this match.', e_maxWin: 'Win too high: lower the stake.', e_closed: 'This match has already started.', e_insufficient: 'Insufficient balance.', e_unavailable: 'Unavailable, try again.', e_param: 'Invalid slip.', e_login: 'Log in to bet.', e_busy: 'One moment…', e_suspended: 'Account suspended.',
      guestBet: '🔒 Sign up to bet (it’s free)',
      myCoupon: 'My bet slip', clearAll: 'Remove all', confirmClear: 'Sure? Tap again', comboT: 'Multiple:', combo: 'all your picks must win. The odds multiply.', singleT: 'Single:', single: 'one pick.', totalOdd: 'Total odds', see: 'Open', minNote: 'Minimum stake $0.10', done: 'Bet placed!', cont: 'Close', emptySlip: 'Your bet slip is empty. Tap an odd to start.',
      betsTab: 'Bets', guestMine: 'Create your account to bet: all your bets will show here, with their result.', guestBtn: 'Create my account', seeBets: 'See the bets', stakeL: 'Stake', oddL: 'Odds', potL: 'Potential win', wonL: 'Won', lostL: 'Lost', voidL: 'Refunded', loading: 'One moment…',
      all: 'All', drawCode: 'X', sport: { foot: 'Football', basket: 'Basketball', boxe: 'Boxing', tennis: 'Tennis', mma: 'MMA', event: 'Predictions', crypto: 'Crypto', politique: 'Politics', autre: 'Sport' } }
  };
  T.zh = Object.assign({}, T.en, { none: '暂无比赛，重大赛事即将上线。', coupon: '投注单', sel: '已选 {n} 场', odd: '赔率', stake: '投注', pot: '可赢', bet: '确认投注', clear: '清空',
    guestBet: '🔒 注册后即可投注（免费）',
    myCoupon: '我的投注单', clearAll: '全部删除', confirmClear: '确定？再点一次', comboT: '串关：', combo: '所有选择都必须赢，赔率相乘。', singleT: '单关：', single: '只有一个选择。', totalOdd: '总赔率', see: '查看', minNote: '最低投注 0.10 美元', done: '投注成功！', cont: '关闭', emptySlip: '投注单是空的，点击赔率开始。',
    betsTab: '投注', guestMine: '注册后即可投注：你的所有投注和结果都会显示在这里。', guestBtn: '创建账户', seeBets: '查看投注', stakeL: '投注', oddL: '赔率', potL: '可赢', wonL: '已赢', lostL: '输', voidL: '已退款', loading: '请稍候…',
    placed: '✅ 投注成功！可赢：{p} 美元', mine: '我的投注', noBets: '暂无投注。', open: '进行中', won: '赢', lost: '输', void: '取消', closed: '已停止投注', result: '结果', starts: '开始', today: '今天', tomorrow: '明天', draw: '平局',
    sport: { foot: '足球', basket: '篮球', boxe: '拳击', tennis: '网球', mma: '综合格斗', event: '预测', crypto: '加密货币', politique: '政治', autre: '体育' } });
  (D6.LIVE_T = D6.LIVE_T || {}).sports = T;
  // v2779 : textes du reçu de pari (12 langues)
  var RC = {
    fr: { rcTitle: 'Reçu de pari', rcPaid: 'Gain payé', rcLostTxt: 'Pari perdu', rcBack: 'Mise remboursée', rcSingle: 'Pari simple', rcCombo: 'Pari combiné', rcDate: 'Date', rcNo: 'Reçu n°', rcShare: 'Télécharger / Partager', rcClose: 'Fermer', rcOpen: 'Reçu', rcSee: 'Voir le reçu' },
    en: { rcTitle: 'Bet receipt', rcPaid: 'Paid out', rcLostTxt: 'Bet lost', rcBack: 'Stake refunded', rcSingle: 'Single bet', rcCombo: 'Multiple bet', rcDate: 'Date', rcNo: 'Receipt no.', rcShare: 'Download / Share', rcClose: 'Close', rcOpen: 'Receipt', rcSee: 'See receipt' },
    es: { rcTitle: 'Recibo de apuesta', rcPaid: 'Ganancia pagada', rcLostTxt: 'Apuesta perdida', rcBack: 'Apuesta reembolsada', rcSingle: 'Apuesta simple', rcCombo: 'Apuesta combinada', rcDate: 'Fecha', rcNo: 'Recibo n.º', rcShare: 'Descargar / Compartir', rcClose: 'Cerrar', rcOpen: 'Recibo', rcSee: 'Ver recibo' },
    pt: { rcTitle: 'Recibo da aposta', rcPaid: 'Ganho pago', rcLostTxt: 'Aposta perdida', rcBack: 'Aposta reembolsada', rcSingle: 'Aposta simples', rcCombo: 'Aposta múltipla', rcDate: 'Data', rcNo: 'Recibo nº', rcShare: 'Baixar / Compartilhar', rcClose: 'Fechar', rcOpen: 'Recibo', rcSee: 'Ver recibo' },
    ar: { rcTitle: 'إيصال الرهان', rcPaid: 'تم دفع الربح', rcLostTxt: 'رهان خاسر', rcBack: 'تم رد المبلغ', rcSingle: 'رهان فردي', rcCombo: 'رهان مركّب', rcDate: 'التاريخ', rcNo: 'رقم الإيصال', rcShare: 'تنزيل / مشاركة', rcClose: 'إغلاق', rcOpen: 'الإيصال', rcSee: 'عرض الإيصال' },
    tr: { rcTitle: 'Bahis makbuzu', rcPaid: 'Ödenen kazanç', rcLostTxt: 'Bahis kaybedildi', rcBack: 'Bahis iade edildi', rcSingle: 'Tekli bahis', rcCombo: 'Kombine bahis', rcDate: 'Tarih', rcNo: 'Makbuz no', rcShare: 'İndir / Paylaş', rcClose: 'Kapat', rcOpen: 'Makbuz', rcSee: 'Makbuzu gör' },
    vi: { rcTitle: 'Biên nhận cược', rcPaid: 'Đã trả thưởng', rcLostTxt: 'Cược thua', rcBack: 'Đã hoàn tiền cược', rcSingle: 'Cược đơn', rcCombo: 'Cược xiên', rcDate: 'Ngày', rcNo: 'Biên nhận số', rcShare: 'Tải / Chia sẻ', rcClose: 'Đóng', rcOpen: 'Biên nhận', rcSee: 'Xem biên nhận' },
    id: { rcTitle: 'Struk taruhan', rcPaid: 'Kemenangan dibayar', rcLostTxt: 'Taruhan kalah', rcBack: 'Taruhan dikembalikan', rcSingle: 'Taruhan tunggal', rcCombo: 'Taruhan kombinasi', rcDate: 'Tanggal', rcNo: 'Struk no.', rcShare: 'Unduh / Bagikan', rcClose: 'Tutup', rcOpen: 'Struk', rcSee: 'Lihat struk' },
    ru: { rcTitle: 'Чек ставки', rcPaid: 'Выигрыш выплачен', rcLostTxt: 'Ставка проиграна', rcBack: 'Ставка возвращена', rcSingle: 'Одиночная ставка', rcCombo: 'Экспресс', rcDate: 'Дата', rcNo: 'Чек №', rcShare: 'Скачать / Поделиться', rcClose: 'Закрыть', rcOpen: 'Чек', rcSee: 'Открыть чек' },
    de: { rcTitle: 'Wettbeleg', rcPaid: 'Gewinn ausgezahlt', rcLostTxt: 'Wette verloren', rcBack: 'Einsatz erstattet', rcSingle: 'Einzelwette', rcCombo: 'Kombiwette', rcDate: 'Datum', rcNo: 'Beleg-Nr.', rcShare: 'Laden / Teilen', rcClose: 'Schließen', rcOpen: 'Beleg', rcSee: 'Beleg ansehen' },
    zh: { rcTitle: '投注凭证', rcPaid: '已派彩', rcLostTxt: '投注未中', rcBack: '投注已退还', rcSingle: '单关', rcCombo: '串关', rcDate: '日期', rcNo: '凭证编号', rcShare: '下载 / 分享', rcClose: '关闭', rcOpen: '凭证', rcSee: '查看凭证' },
    hi: { rcTitle: 'दांव रसीद', rcPaid: 'जीत का भुगतान', rcLostTxt: 'दांव हारा', rcBack: 'दांव वापस', rcSingle: 'एकल दांव', rcCombo: 'संयुक्त दांव', rcDate: 'तारीख', rcNo: 'रसीद सं.', rcShare: 'डाउनलोड / शेयर', rcClose: 'बंद करें', rcOpen: 'रसीद', rcSee: 'रसीद देखें' }
  };

  // v2790 (propriétaire) : textes des filtres de « Mes paris » (12 langues)
  (function () { var F = {"fr":["Tous","En cours","Gagnés","Perdus","Remboursés","Toute la période","Aujourd’hui","7 derniers jours","Ce mois-ci","Cette année","Un jour précis","Aucun pari pour ce choix."],"en":["All","Open","Won","Lost","Refunded","All time","Today","Last 7 days","This month","This year","A specific day","No bet for this choice."],"es":["Todas","En curso","Ganadas","Perdidas","Reembolsadas","Todo","Hoy","Últimos 7 días","Este mes","Este año","Un día concreto","Ninguna apuesta para esta opción."],"pt":["Todas","Em curso","Ganhas","Perdidas","Reembolsadas","Todo o período","Hoje","Últimos 7 dias","Este mês","Este ano","Um dia específico","Nenhuma aposta para esta opção."],"ar":["الكل","جارية","رابحة","خاسرة","مستردة","كل الفترة","اليوم","آخر 7 أيام","هذا الشهر","هذه السنة","يوم محدد","لا يوجد رهان لهذا الاختيار."],"tr":["Tümü","Açık","Kazanan","Kaybeden","İade","Tüm zamanlar","Bugün","Son 7 gün","Bu ay","Bu yıl","Belirli bir gün","Bu seçim için bahis yok."],"vi":["Tất cả","Đang chờ","Thắng","Thua","Hoàn tiền","Mọi thời gian","Hôm nay","7 ngày qua","Tháng này","Năm nay","Một ngày cụ thể","Không có cược nào."],"id":["Semua","Berjalan","Menang","Kalah","Dikembalikan","Semua waktu","Hari ini","7 hari terakhir","Bulan ini","Tahun ini","Hari tertentu","Tidak ada taruhan untuk pilihan ini."],"ru":["Все","Открытые","Выигрыш","Проигрыш","Возврат","Всё время","Сегодня","7 дней","Этот месяц","Этот год","Конкретный день","Нет ставок."],"de":["Alle","Offen","Gewonnen","Verloren","Erstattet","Gesamter Zeitraum","Heute","Letzte 7 Tage","Dieser Monat","Dieses Jahr","Bestimmter Tag","Keine Wette für diese Auswahl."],"zh":["全部","进行中","已赢","已输","已退款","全部时间","今天","近 7 天","本月","今年","指定日期","没有符合条件的投注。"],"hi":["सभी","जारी","जीते","हारे","वापस","पूरा समय","आज","पिछले 7 दिन","इस महीने","इस साल","एक खास दिन","इस विकल्प के लिए कोई दांव नहीं।"]}, K = ["fAll","fOpen","fWon","fLost","fVoid","pAll","pToday","p7","pMonth","pYear","pDay","fNone"];
    Object.keys(F).forEach(function (l) { RC[l] = RC[l] || {}; K.forEach(function (k, i) { RC[l][k] = F[l][i]; }); }); })();
  function X() { var l = (document.documentElement.lang || 'fr').slice(0, 2); return Object.assign({}, T.en, RC.en, T[l] || {}, RC[l] || {}); }
  // v2789 (propriétaire) : les textes des événements dans la langue du joueur (compétitions, « nul = remboursé », Oui / Non, questions)
  var LGW = {
    'Ligue des champions': { en: 'Champions League', es: 'Liga de Campeones', pt: 'Liga dos Campeões', ar: 'دوري أبطال أوروبا', tr: 'Şampiyonlar Ligi', vi: 'Champions League', id: 'Liga Champions', ru: 'Лига чемпионов', de: 'Champions League', hi: 'चैंपियंस लीग', zh: '欧冠' },
    'nul = remboursé': { en: 'draw = refund', es: 'empate = reembolso', pt: 'empate = reembolso', ar: 'التعادل = استرداد', tr: 'beraberlik = iade', vi: 'hòa = hoàn tiền', id: 'seri = uang kembali', ru: 'ничья = возврат', de: 'Remis = Erstattung', hi: 'ड्रॉ = रिफंड', zh: '平局退款' },
    'match d’ouverture': { en: 'opening game', es: 'partido inaugural', pt: 'jogo de abertura', ar: 'مباراة الافتتاح', tr: 'açılış maçı', vi: 'trận mở màn', id: 'laga pembuka', ru: 'матч открытия', de: 'Eröffnungsspiel', hi: 'उद्घाटन मैच', zh: '揭幕战' },
    'titre poids plumes': { en: 'featherweight title', es: 'título pluma', pt: 'título peso-pena', ar: 'لقب وزن الريشة', tr: 'tüy siklet unvanı', vi: 'đai hạng lông', id: 'gelar kelas bulu', ru: 'титул в полулёгком весе', de: 'Federgewichtstitel', hi: 'फेदरवेट खिताब', zh: '羽量级金腰带' },
    'prix Coinbase': { en: 'Coinbase price', es: 'precio Coinbase', pt: 'preço Coinbase', ar: 'سعر Coinbase', tr: 'Coinbase fiyatı', vi: 'giá Coinbase', id: 'harga Coinbase', ru: 'цена Coinbase', de: 'Coinbase-Kurs', hi: 'Coinbase कीमत', zh: 'Coinbase 价格' },
    'Oui': { en: 'Yes', es: 'Sí', pt: 'Sim', ar: 'نعم', tr: 'Evet', vi: 'Có', id: 'Ya', ru: 'Да', de: 'Ja', hi: 'हाँ', zh: '是' },
    'Non': { en: 'No', es: 'No', pt: 'Não', ar: 'لا', tr: 'Hayır', vi: 'Không', id: 'Tidak', ru: 'Нет', de: 'Nein', hi: 'नहीं', zh: '否' },
    // v2807 : nouvelles compétitions / catégories
    'Formule 1': { en: 'Formula 1', es: 'Fórmula 1', pt: 'Fórmula 1', ar: 'فورمولا 1', tr: 'Formula 1', vi: 'Công thức 1', id: 'Formula 1', ru: 'Формула-1', de: 'Formel 1', hi: 'फ़ॉर्मूला 1', zh: 'F1 一级方程式' },
    'duel': { en: 'head-to-head', es: 'duelo', pt: 'duelo', ar: 'مواجهة', tr: 'düello', vi: 'đối đầu', id: 'duel', ru: 'дуэль', de: 'Duell', hi: 'मुकाबला', zh: '对决' },
    'Bourse de New York': { en: 'New York Stock Exchange', es: 'Bolsa de Nueva York', pt: 'Bolsa de Nova York', ar: 'بورصة نيويورك', tr: 'New York Borsası', vi: 'Chứng khoán New York', id: 'Bursa New York', ru: 'Нью-Йоркская биржа', de: 'New Yorker Börse', hi: 'न्यूयॉर्क शेयर बाज़ार', zh: '纽约股市' },
    'résultats Nvidia': { en: 'Nvidia earnings', es: 'resultados de Nvidia', pt: 'resultados da Nvidia', ar: 'نتائج إنفيديا', tr: 'Nvidia bilançosu', vi: 'KQKD Nvidia', id: 'laporan Nvidia', ru: 'отчёт Nvidia', de: 'Nvidia-Zahlen', hi: 'Nvidia नतीजे', zh: '英伟达财报' },
    'Or · prix LBMA': { en: 'Gold · LBMA price', es: 'Oro · precio LBMA', pt: 'Ouro · preço LBMA', ar: 'الذهب · سعر LBMA', tr: 'Altın · LBMA fiyatı', vi: 'Vàng · giá LBMA', id: 'Emas · harga LBMA', ru: 'Золото · цена LBMA', de: 'Gold · LBMA-Preis', hi: 'सोना · LBMA कीमत', zh: '黄金 · LBMA 价格' },
    'Box-office USA': { en: 'US box office', es: 'Taquilla EE. UU.', pt: 'Bilheteria EUA', ar: 'شباك التذاكر الأمريكي', tr: 'ABD gişesi', vi: 'Phòng vé Mỹ', id: 'Box office AS', ru: 'Кассовые сборы США', de: 'US-Kinokasse', hi: 'US बॉक्स ऑफ़िस', zh: '北美票房' },
    'cinéma': { en: 'movies', es: 'cine', pt: 'cinema', ar: 'سينما', tr: 'sinema', vi: 'điện ảnh', id: 'film', ru: 'кино', de: 'Kino', hi: 'सिनेमा', zh: '电影' },
    // 2026-10-21 : 4e série
    'Ligue Europa': { en: 'Europa League', es: 'Liga Europa', pt: 'Liga Europa', ar: 'الدوري الأوروبي', tr: 'Avrupa Ligi', vi: 'Europa League', id: 'Liga Europa', ru: 'Лига Европы', de: 'Europa League', hi: 'यूरोपा लीग', zh: '欧联' },
    'total de points': { en: 'total points', es: 'puntos totales', pt: 'pontos totais', ar: 'مجموع النقاط', tr: 'toplam sayı', vi: 'tổng điểm', id: 'total poin', ru: 'тотал очков', de: 'Gesamtpunkte', hi: 'कुल अंक', zh: '总分' },
    'derby basque': { en: 'Basque derby', es: 'derbi vasco', pt: 'dérbi basco', ar: 'ديربي الباسك', tr: 'Bask derbisi', vi: 'derby xứ Basque', id: 'derby Basque', ru: 'баскское дерби', de: 'Baskenderby', hi: 'बास्क डर्बी', zh: '巴斯克德比' }
  };
  function lg() { return (document.documentElement.lang || 'fr').slice(0, 2); }
  function trW(t) { var l = lg(); if (l === 'fr' || !t) return t; Object.keys(LGW).forEach(function (k) { if (LGW[k][l] && t.indexOf(k) > -1) t = t.split(k).join(LGW[k][l]); }); return t; }
  function trT(e) { var l = lg(); if (e && e.pred) return l === 'fr' ? e.title : ((e.i18n && (e.i18n[l] || e.i18n.en)) || e.title); return (l !== 'fr' && e.i18n && e.i18n[l]) || e.title; } // Predict : français, sinon anglais (sinon français)
  function trOp(e, o) { return e && e.pred ? (lg() === 'fr' ? o.label : (o.en || o.label)) : trO(o.label); }
  function trO(lbl) { var l = lg(); return l !== 'fr' && LGW[lbl] && LGW[lbl][l] ? LGW[lbl][l] : lbl; }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function fmt(s, o) { return String(s).replace(/\{(\w+)\}/g, function (m, k) { return o[k] != null ? o[k] : m; }); }
  function m2(v) { return (Number(v) || 0).toFixed(2); }
  // case de mise : « 1 » et pas « 1.00 » (propriétaire : les zéros trompent) ; « 1.5 », « 0.8 » gardent leurs décimales utiles
  function sv(v) { return String(Math.round((Number(v) || 0) * 100) / 100); }
  // v2696 : petites icônes de sport dessinées (plus d'émojis)
  var SICO = {
    foot: '<circle cx="12" cy="12" r="9" fill="#fff"/><path d="M12 7.5l3.2 2.3-1.2 3.8h-4l-1.2-3.8z" fill="#111"/><path d="M12 7.5V3.3M15.2 9.8l3.9-1.3M14 13.6l2.4 3.4M10 13.6l-2.4 3.4M8.8 9.8L4.9 8.5" stroke="#111" stroke-width="1.2"/>',
    basket: '<circle cx="12" cy="12" r="9" fill="#F97316"/><path d="M3 12h18M12 3v18M5.6 5.6c3.6 3.6 3.6 9.2 0 12.8M18.4 5.6c-3.6 3.6-3.6 9.2 0 12.8" stroke="#7C2D12" stroke-width="1.3" fill="none"/>',
    boxe: '<path d="M6 10c0-4 3-6 7-6s6 2.5 6 6v4c0 2-1.5 3.5-3.5 3.5H9.5C7.5 17.5 6 16 6 14z" fill="#DC2626"/><rect x="7" y="17.5" width="10" height="3.5" rx="1" fill="#fff"/><path d="M10 9c1.5-1 3.5-1 5 0" stroke="#fff" stroke-width="1.2" opacity=".7" fill="none"/>',
    tennis: '<circle cx="12" cy="12" r="9" fill="#D9F99D"/><path d="M5 6c3 3 3 9 0 12M19 6c-3 3-3 9 0 12" stroke="#fff" stroke-width="1.6" fill="none"/>',
    mma: '<path d="M5 9c0-3 2.5-5 6-5h2c3.5 0 6 2 6 5v5c0 2-1.5 3.5-3.5 3.5h-7C6.5 17.5 5 16 5 14z" fill="#111827"/><path d="M8 8.5h8M8 11h8" stroke="#FACC15" stroke-width="1.3"/><rect x="7" y="17.5" width="10" height="3.5" rx="1" fill="#FACC15"/>',
    autre: '<path d="M7 4h10v4c0 3-2 5.5-5 5.5S7 11 7 8zM9.5 13.5h5v2.5h-5zM7 18h10v2.5H7z" fill="#FACC15"/>',
    // v2706 : événements
    event: '<rect x="3.5" y="5" width="17" height="15.5" rx="2.5" fill="#fff"/><path d="M3.5 7.5a2.5 2.5 0 0 1 2.5-2.5h12a2.5 2.5 0 0 1 2.5 2.5V10h-17z" fill="#EF4444"/><path d="M8 3.2v3.6M16 3.2v3.6" stroke="#334155" stroke-width="1.8" stroke-linecap="round"/><path d="M12 11.6l1.3 2.6 2.9.4-2.1 2 .5 2.8-2.6-1.4-2.6 1.4.5-2.8-2.1-2 2.9-.4z" fill="#F59E0B"/>',
    crypto: '<circle cx="12" cy="12" r="9.5" fill="#F7931A"/><path d="M10 7.2v9.6M12.4 7.2V6M12.4 18v-1.2M9 7.6h4.3c1.5 0 2.5.9 2.5 2.1s-1 2.1-2.5 2.1H9.6m0 0h4.2c1.7 0 2.7.9 2.7 2.2s-1 2.2-2.7 2.2H9" stroke="#fff" stroke-width="1.7" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
    politique: '<path d="M4 11h16v9.5H4z" fill="#3B82F6"/><path d="M4 11h16v2.5H4z" fill="#1D4ED8"/><rect x="8" y="3.5" width="8" height="9.5" rx="1" fill="#fff" transform="rotate(-8 12 8)"/><path d="M9.6 8.3l1.6 1.6 3.2-3.4" stroke="#16A34A" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/><rect x="9" y="11" width="6" height="1.4" rx=".7" fill="#0F172A"/>'
  };
  var CRYSTAL = '<svg viewBox="0 0 64 60" aria-hidden="true"><defs><radialGradient id="spCrG" cx="36%" cy="30%" r="75%"><stop offset="0" stop-color="#fff" stop-opacity=".7"/><stop offset=".55" stop-color="#C4B5FD" stop-opacity=".25"/><stop offset="1" stop-color="#8B5CF6" stop-opacity=".12"/></radialGradient></defs><path d="M19 55l4-8h18l4 8z" fill="rgba(139,92,246,.14)" stroke="#A78BFA" stroke-width="2.4" stroke-linejoin="round"/><circle cx="32" cy="26" r="19" fill="url(#spCrG)" stroke="#A78BFA" stroke-width="2.6"/><path d="M22 17a12 12 0 0 1 7-4" stroke="#fff" stroke-width="2.6" stroke-linecap="round" fill="none"/><path d="M37.5 24l1.4 3 3.2.4-2.4 2.2.6 3.2-2.8-1.6-2.8 1.6.6-3.2-2.4-2.2 3.2-.4z" fill="#A78BFA"/></svg>';
  var EVK = { event: 1, crypto: 1, politique: 1 }; // questions (pas d'équipes) : on montre le texte de chaque réponse
  // v2734 : une seule catégorie « Prédictions » (boule de cristal) pour toutes les questions
  SICO.event = '<circle cx="12" cy="10.5" r="7.5" fill="#8B5CF6"/><circle cx="9.5" cy="8" r="2.4" fill="#fff" opacity=".55"/><path d="M14 13l.8 1.6 1.7.2-1.3 1.2.3 1.7-1.5-.8-1.5.8.3-1.7-1.3-1.2 1.7-.2z" fill="#FDE68A"/><path d="M6 19h12l-1.5-2.4h-9z" fill="#B45309"/><rect x="5" y="19" width="14" height="2.6" rx="1" fill="#92400E"/>';
  // v2759 (propriétaire) : un VRAI ballon de foot bien dessiné (pentagone noir au centre + 5 morceaux sur les bords)
  var BALL = (function () {
    var P = function (cx, cy, r, rot) { var s = ''; for (var i = 0; i < 5; i++) { var a = (rot + i * 72) * Math.PI / 180; s += (i ? 'L' : 'M') + (cx + r * Math.cos(a)).toFixed(2) + ' ' + (cy + r * Math.sin(a)).toFixed(2); } return s + 'Z'; };
    var g = '', seams = '';
    for (var i = 0; i < 5; i++) {
      var a = (-90 + i * 72) * Math.PI / 180, ox = 12 + 10.3 * Math.cos(a), oy = 12 + 10.3 * Math.sin(a);
      g += '<path d="' + P(ox, oy, 3.1, -54 + i * 72) + '"/>';
      seams += 'M' + (12 + 3.9 * Math.cos(a)).toFixed(2) + ' ' + (12 + 3.9 * Math.sin(a)).toFixed(2) + 'L' + (12 + 7.3 * Math.cos(a)).toFixed(2) + ' ' + (12 + 7.3 * Math.sin(a)).toFixed(2);
      var b1 = (-90 + i * 72 - 24) * Math.PI / 180, b2 = (-90 + i * 72 + 24) * Math.PI / 180;
      seams += 'M' + (12 + 7.3 * Math.cos(a)).toFixed(2) + ' ' + (12 + 7.3 * Math.sin(a)).toFixed(2) + 'L' + (12 + 8.4 * Math.cos(b1)).toFixed(2) + ' ' + (12 + 8.4 * Math.sin(b1)).toFixed(2);
      seams += 'M' + (12 + 7.3 * Math.cos(a)).toFixed(2) + ' ' + (12 + 7.3 * Math.sin(a)).toFixed(2) + 'L' + (12 + 8.4 * Math.cos(b2)).toFixed(2) + ' ' + (12 + 8.4 * Math.sin(b2)).toFixed(2);
    }
    return '<defs><radialGradient id="spBallG" cx="38%" cy="32%" r="75%"><stop offset="0" stop-color="#fff"/><stop offset=".7" stop-color="#EEF0F6"/><stop offset="1" stop-color="#C9CEDC"/></radialGradient><clipPath id="spBallC"><circle cx="12" cy="12" r="10.6"/></clipPath></defs>' +
      '<circle cx="12" cy="12" r="10.6" fill="url(#spBallG)"/><g clip-path="url(#spBallC)" fill="#1F2433">' + '<path d="' + P(12, 12, 3.9, -90) + '"/>' + g + '</g>' +
      '<path d="' + seams + '" stroke="#9AA1B4" stroke-width=".7" stroke-linecap="round" fill="none" clip-path="url(#spBallC)"/><circle cx="12" cy="12" r="10.6" fill="none" stroke="rgba(15,23,42,.35)" stroke-width=".8"/>';
  })();
  SICO.foot = BALL;
  // 2026-10-22 : petites icônes des autres sports (même style : dessinées, pas d'émojis)
  SICO.hockey = '<path d="M4.5 3.5l7.2 12.6h6.6a1.7 1.7 0 0 1 0 3.4h-8.6L2.6 4.6z" fill="#93C5FD"/><path d="M11.7 16.1h6.6a1.7 1.7 0 0 1 0 3.4h-8.6" fill="#1D4ED8"/><ellipse cx="18.5" cy="9" rx="3.4" ry="1.5" fill="#111827"/><rect x="15.1" y="7.5" width="6.8" height="1.5" fill="#111827"/><ellipse cx="18.5" cy="7.5" rx="3.4" ry="1.5" fill="#374151"/>';
  SICO.handball = '<circle cx="12" cy="12" r="9" fill="#FDE047"/><path d="M4 9.2c4.5 1.3 11.5 1.3 16 0M4 14.8c4.5-1.3 11.5-1.3 16 0M12 3c-2.2 5-2.2 13 0 18" stroke="#A16207" stroke-width="1.2" fill="none"/>';
  SICO.volley = '<circle cx="12" cy="12" r="9" fill="#fff"/><path d="M12 3.2c.2 4.8 3 7.9 8.1 9.4M12 12c-3.9 1.8-5.8 4.7-6.1 8M12 12C10.6 8 7.6 5.5 3.5 5.6" stroke="#2563EB" stroke-width="1.7" fill="none"/><circle cx="12" cy="12" r="9" fill="none" stroke="#94A3B8" stroke-width=".8"/>';
  SICO.rugby = '<ellipse cx="12" cy="12" rx="10" ry="6" transform="rotate(-35 12 12)" fill="#B45309"/><path d="M8.6 15.4l6.8-6.8M10.1 12.5l1.4 1.4M11.6 11l1.4 1.4M13.1 9.5l1.4 1.4" stroke="#fff" stroke-width="1.1"/>';
  SICO.amfoot = '<ellipse cx="12" cy="12" rx="10" ry="6" transform="rotate(-35 12 12)" fill="#7C2D12"/><path d="M5.6 13.7l2.2 2.2M16.2 5.9l2.2 2.2M9.2 14.8l5.6-5.6M10.4 12.2l1.4 1.4M12 10.6l1.4 1.4" stroke="#fff" stroke-width="1.1"/>';
  SICO.afl = '<ellipse cx="12" cy="12" rx="10" ry="6.4" transform="rotate(-35 12 12)" fill="#DC2626"/><path d="M8.6 15.4l6.8-6.8" stroke="#fff" stroke-width="1.2"/><path d="M10.1 12.5l1.4 1.4M11.6 11l1.4 1.4M13.1 9.5l1.4 1.4" stroke="#fff" stroke-width="1"/>';
  SICO.baseball = '<circle cx="12" cy="12" r="9" fill="#fff"/><path d="M6.5 5.4c2.6 3.6 2.6 9.6 0 13.2M17.5 5.4c-2.6 3.6-2.6 9.6 0 13.2" stroke="#DC2626" stroke-width="1.3" fill="none" stroke-dasharray="1.6 1.2"/><circle cx="12" cy="12" r="9" fill="none" stroke="#94A3B8" stroke-width=".8"/>';
  // la catégorie d'une question vient de son image : ballon = Football, Bitcoin = Crypto, drapeau / urne = Politique
  function qKind(e) {
    if (!EVK[e.sport]) return e.sport || 'autre';
    var l = (e.logos || [])[0] || '';
    return l === 'q:ball' ? 'foot' : /^q:(btc|eth|sol|xrp|doge)$/.test(l) ? 'crypto' : (l === 'q:us' || l === 'q:vote') ? 'politique' : l === 'q:race' ? 'autre' : 'event';
  }
  function sico(k) { return '<svg class="sp-ico" viewBox="0 0 24 24" aria-hidden="true">' + (SICO[k] || SICO.autre) + '</svg>'; }
  var CREST = ['#2563EB', '#DC2626', '#16A34A', '#F59E0B', '#7C3AED', '#0891B2', '#DB2777', '#EA580C'];
  // v2755 : images des questions (Bitcoin, drapeau des États-Unis, ballon, urne…) et logos rangés dans le site
  var QIMG = {
    btc: '<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="16" fill="#F7931A"/><g transform="rotate(14 16 16)"><path d="M12.2 9.4h5.2c2.1 0 3.6 1.1 3.6 2.9 0 1.3-.8 2.2-1.9 2.5 1.5.3 2.5 1.3 2.5 2.9 0 2.1-1.7 3.3-4 3.3h-5.4zm2.5 2v3.2h2.5c1 0 1.6-.6 1.6-1.6s-.6-1.6-1.6-1.6zm0 5.2v3.4h2.8c1.1 0 1.8-.6 1.8-1.7s-.7-1.7-1.8-1.7z" fill="#fff"/><path d="M14 7.6v2M16.4 7.6v2M14 21v2M16.4 21v2" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/></g></svg>',
    us: '<svg viewBox="0 0 38 26"><rect width="38" height="26" rx="3" fill="#fff"/><g fill="#DC2626"><rect y="0" width="38" height="2"/><rect y="4" width="38" height="2"/><rect y="8" width="38" height="2"/><rect y="12" width="38" height="2"/><rect y="16" width="38" height="2"/><rect y="20" width="38" height="2"/><rect y="24" width="38" height="2"/></g><rect width="17" height="14" fill="#1E3A8A"/><g fill="#fff">' + (function () { var s = ''; for (var r = 0; r < 4; r++) for (var c = 0; c < 5; c++) s += '<circle cx="' + (2 + c * 3.2 + (r % 2) * 1.6) + '" cy="' + (2 + r * 3.2) + '" r=".7"/>'; return s; })() + '</g></svg>',
    ball: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#fff" stroke="#CBD5E1"/><path d="M12 6.5l3.6 2.6-1.4 4.3H9.8L8.4 9.1z" fill="#111"/><path d="M12 6.5V2M15.6 9.1l4.3-1.4M14.2 13.4l2.7 3.6M9.8 13.4l-2.7 3.6M8.4 9.1L4.1 7.7" stroke="#111" stroke-width="1.2"/></svg>',
    vote: '<svg viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="10" rx="2" fill="#3B82F6"/><rect x="7" y="3" width="10" height="11" rx="1" fill="#fff" transform="rotate(-8 12 8)"/><path d="M9.5 8.3l1.6 1.6 3.2-3.4" stroke="#16A34A" stroke-width="1.6" fill="none"/></svg>'
  };
  QIMG.ball = '<svg viewBox="0 0 24 24">' + BALL + '</svg>';
  // v2807 : images dessinées des nouvelles questions (crypto, F1, Ballon d'Or, cinéma, Bourse, or) — SVG maison, légers
  QIMG.eth = '<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="16" fill="#627EEA"/><path d="M16 4.5v8.6l7.2 3.2z" fill="#fff" opacity=".6"/><path d="M16 4.5L8.8 16.3l7.2-3.2z" fill="#fff"/><path d="M16 22v5.5l7.2-10z" fill="#fff" opacity=".6"/><path d="M16 27.5V22l-7.2-4.5z" fill="#fff"/><path d="M16 20.6l7.2-4.3-7.2-3.2z" fill="#fff" opacity=".25"/><path d="M8.8 16.3l7.2 4.3v-7.5z" fill="#fff" opacity=".6"/></svg>';
  QIMG.sol = '<svg viewBox="0 0 32 32"><defs><linearGradient id="spSolG" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#9945FF"/><stop offset="1" stop-color="#14F195"/></linearGradient></defs><circle cx="16" cy="16" r="16" fill="#111827"/><g fill="url(#spSolG)"><path d="M10.3 20.2h13.2l-2.4 2.6H7.9z"/><path d="M10.3 9.2h13.2l-2.4 2.6H7.9z"/><path d="M21.1 14.7H7.9l2.4 2.6h13.2z"/></g></svg>';
  QIMG.xrp = '<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="16" fill="#23292F"/><path d="M8.5 8.5h2.6l3.3 3.3a2.3 2.3 0 0 0 3.2 0l3.3-3.3h2.6l-4.6 4.6a4.3 4.3 0 0 1-5.8 0zM8.5 23.5h2.6l3.3-3.3a2.3 2.3 0 0 1 3.2 0l3.3 3.3h2.6l-4.6-4.6a4.3 4.3 0 0 0-5.8 0z" fill="#fff"/></svg>';
  QIMG.doge = '<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="16" fill="#C2A633"/><path d="M12.2 9.3h4.4c4 0 6.4 2.6 6.4 6.7s-2.4 6.7-6.4 6.7h-4.4zm2.6 2.3v8.8h1.8c2.4 0 3.8-1.6 3.8-4.4s-1.4-4.4-3.8-4.4z" fill="#fff"/><path d="M10.2 15h6.8v2h-6.8z" fill="#fff"/></svg>';
  QIMG.race = '<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="16" fill="#E10600"/><path d="M10 7.5v18" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/><g transform="translate(10.9 8.2)"><rect width="12" height="9" rx="1" fill="#fff"/>' + (function () { var s = ''; for (var r = 0; r < 3; r++) for (var c = 0; c < 4; c++) if ((r + c) % 2) s += '<rect x="' + c * 3 + '" y="' + r * 3 + '" width="3" height="3" fill="#111"/>'; return s; })() + '</g></svg>';
  QIMG.trophy = '<svg viewBox="0 0 32 32"><defs><radialGradient id="spGoldB" cx="38%" cy="32%" r="70%"><stop offset="0" stop-color="#FFF4C2"/><stop offset=".45" stop-color="#F5C542"/><stop offset="1" stop-color="#A86B0C"/></radialGradient></defs><path d="M11 25.5h10l1.4 4H9.6z" fill="#7A4A06"/><circle cx="16" cy="14" r="11.5" fill="url(#spGoldB)"/><path d="M16 8.6l3.6 2.6-1.4 4.2h-4.4l-1.4-4.2zM16 8.6V3M19.6 11.2l5.2-1.8M18.2 15.4l3.4 4.4M13.8 15.4l-3.4 4.4M12.4 11.2L7.2 9.4" stroke="#9A6408" stroke-width="1" fill="none" opacity=".75"/></svg>';
  QIMG.film = '<svg viewBox="0 0 32 32"><rect x="4" y="12" width="24" height="15" rx="2" fill="#1F2937"/><path d="M4 9.5l22.6-5.3.8 3.4L4.8 12.9z" fill="#F8FAFC"/><path d="M8 8.6l2.2 3.2M13.5 7.3l2.2 3.2M19 6l2.2 3.2" stroke="#1F2937" stroke-width="2.2"/><path d="M13.5 16.2v7l6-3.5z" fill="#FBBF24"/></svg>';
  QIMG.chart = '<svg viewBox="0 0 32 32"><rect width="32" height="32" rx="8" fill="#0F2A1E"/><path d="M6 25h21" stroke="#3F6B55" stroke-width="1.2"/><path d="M6 21.5l5.5-5 4.5 3.5 5-7 5 3.5" stroke="#22C55E" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M22 9.5h4.5V14" stroke="#22C55E" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  QIMG.gold = '<svg viewBox="0 0 32 32"><defs><linearGradient id="spGoldI" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FDE68A"/><stop offset="1" stop-color="#C98A0B"/></linearGradient></defs><g stroke="#8A5A05" stroke-width=".8" fill="url(#spGoldI)"><path d="M3.5 26.5l2.6-6.5h8.4l2.6 6.5z"/><path d="M14.9 26.5l2.6-6.5h8.4l2.6 6.5z"/><path d="M9.2 19.3l2.6-6.5h8.4l2.6 6.5z"/></g><path d="M12.6 14.2h5.4" stroke="#FFF7D6" stroke-width="1" opacity=".8"/></svg>';
  function logoHtml(lg, cls) {
    if (!lg) return '';
    if (/^q:[a-z]+$/.test(lg)) return QIMG[lg.slice(2)] ? '<span class="' + cls + ' sp-qsvg">' + QIMG[lg.slice(2)] + '</span>' : '';
    if (/^img\/teams\/[a-z0-9-]+\.png$/.test(lg)) return '<img class="' + cls + '" src="' + lg + '" alt="">';
    if (/^[a-f0-9]{16}$/.test(lg)) return '<img class="' + cls + '" src="sp-logo.php?k=' + lg + '" alt="">';
    return '';
  }
  function crest(n, lg, sp) {
    // 2026-10-21 : taille fixée dans la balise (aucun saut à l'arrivée de l'image) ; plus de « loading=lazy » (le logo apparaissait
    // en retard pendant le défilement) — les logos sont déjà préchargés (warmLogos)
    if (lg && /^img\/teams\/[a-z0-9-]+\.png$/.test(lg)) return '<img class="sp-crest sp-logo" src="' + lg + '" alt="" width="44" height="44" decoding="async">';
    if (lg && /^[a-f0-9]{16}$/.test(lg)) return '<img class="sp-crest sp-logo" src="sp-logo.php?k=' + lg + '" alt="" width="44" height="44" decoding="async" onerror="this.style.visibility=\'hidden\'">'; // v2713 : vrai logo
    var h = 0; String(n || '').split('').forEach(function (c) { h = (h * 31 + c.charCodeAt(0)) % 997; });
    // v2807 : combat / tennis sans photo → pastille avec l'icône du sport (gant, balle) au lieu d'une simple lettre
    if (sp === 'mma' || sp === 'boxe' || sp === 'tennis') return '<i class="sp-crest sp-crest-ico" style="--cc:' + CREST[h % CREST.length] + '">' + sico(sp) + '</i>';
    return '<i class="sp-crest" style="--cc:' + CREST[h % CREST.length] + '">' + esc(String(n || '?').trim().charAt(0).toUpperCase()) + '</i>'; }
  // « Équipe A - Équipe B » / « A vs B » → deux lignes ; sinon le titre tel quel
  function teams(t) { var m = String(t || '').split(/\s+(?:-|–|—|vs\.?|VS|contre)\s+/); return m.length === 2 ? m : null; }
  /* v2798 (propriétaire) — PARIS façon grande appli de paris (1xBet / Betway / Bet365) aux couleurs OROLADO (violet
     nuit, or) : matchs groupés par jour, compte à rebours, grosses cotes nettes, COUPON avec le même terminal de mise que
     le casino (− montant + et montants rapides), « Mes paris » avec couleurs d'état. Textes sur UNE ligne qui rapetissent.
     Styles : css/sports2.css (chargé ici si la page ne l'a pas déjà). Le serveur et les formats de données ne changent pas. */
  var flt = 'all';
  var ctx = null, events = [], slip = [], stake = 1, box = null;
  try { stake = Math.max(0.1, +(localStorage.getItem('oro_sp_stake') || 1)); } catch (e) { /* ignore */ }
  (function () {
    try {
      if (document.querySelector('link[href*="sports2.css"]')) return;
      var v = ((document.currentScript && /[?&]v=(\d+)/.exec(document.currentScript.src)) || [])[1] || '2798';
      var l = document.createElement('link'); l.rel = 'stylesheet'; l.href = 'css/sports2.css?v=' + v; document.head.appendChild(l);
    } catch (e) { /* ignore */ }
  })();
  // nouveaux petits textes (12 langues)
  var NT = {
    en: { results: 'Results', inPlay: 'In play', oddsChg: 'Odds updated', sending: 'Sending…', qOnly: 'Predictions: single bets only.', e_single: 'Predictions are single bets only: they can’t be combined.', e_corr: 'These picks are linked: they can’t be in the same slip.', e_cap: 'Limit reached on this choice: lower your stake.', more: 'Show more', singleX: 'One pick: your win = stake × odds.', balL: 'Balance', depL: 'Top up', errBal: 'Not enough balance for this stake.', e_odds: 'Odds have changed: check your slip and confirm again.', tabS: 'Single', tabC: 'Multiple', mkt3: 'Match result (1X2)', mkt2: 'Winner', mktQ: 'Prediction', clrSt: 'Clear', maxL: 'Max', setT: 'Bet slip settings', accT: 'If the odds change', accAny: 'Accept any change', accUp: 'Accept higher odds only', accNone: 'Always ask me', keepT: 'Keep selections after placing', qkT: 'Quick stakes', okL: 'OK', eachL: 'Stake per bet', totSt: 'Total stake', placeN: 'Place {n} bets', placeB: 'Place bet', doneN: '{n} bets placed!', partial: '{ok} of {n} bets placed', singleN: 'One bet per selection, each with its own stake.', refused: 'Bet refused' },
    fr: { results: 'Résultats', inPlay: 'En jeu', oddsChg: 'Cotes mises à jour', sending: 'Envoi…', qOnly: 'Prédiction : pari simple uniquement.', e_single: 'Les prédictions se jouent seules : pas de combiné.', e_corr: 'Ces choix sont liés : pas dans le même coupon.', e_cap: 'Limite atteinte sur ce choix : baisse la mise.', more: 'Afficher plus', singleX: 'Un seul choix : gain = mise × cote.', balL: 'Solde', depL: 'Recharger', errBal: 'Solde insuffisant pour cette mise.', e_odds: 'Les cotes ont changé : vérifie ton ticket puis confirme.', tabS: 'Simple', tabC: 'Combiné', mkt3: 'Résultat du match (1X2)', mkt2: 'Vainqueur', mktQ: 'Prédiction', clrSt: 'Effacer', maxL: 'Max', setT: 'Réglages du ticket', accT: 'Si la cote change', accAny: 'Accepter tous les changements', accUp: 'Accepter seulement les hausses', accNone: 'Toujours me demander', keepT: 'Garder les sélections après le pari', qkT: 'Montants rapides', okL: 'OK', eachL: 'Mise par pari', totSt: 'Mise totale', placeN: 'Placer {n} paris', placeB: 'Placer le pari', doneN: '{n} paris enregistrés !', partial: '{ok} sur {n} paris enregistrés', singleN: 'Un pari par sélection, chacun avec sa mise.', refused: 'Pari refusé' },
    es: { results: 'Resultados', inPlay: 'En juego', oddsChg: 'Cuotas actualizadas', sending: 'Enviando…', qOnly: 'Predicciones: solo apuesta simple.', e_single: 'Las predicciones son solo apuestas simples: no se combinan.', e_corr: 'Estas selecciones están relacionadas: no pueden ir en el mismo boleto.', e_cap: 'Límite alcanzado en esta opción: baja la apuesta.', more: 'Ver más', singleX: 'Una sola selección: ganancia = apuesta × cuota.', balL: 'Saldo', depL: 'Recargar', errBal: 'Saldo insuficiente para esta apuesta.', e_odds: 'Las cuotas han cambiado: revisa tu boleto y confirma.', tabS: 'Simple', tabC: 'Combinada', mkt3: 'Resultado (1X2)', mkt2: 'Ganador', mktQ: 'Predicción', clrSt: 'Borrar', maxL: 'Máx', setT: 'Ajustes del boleto', accT: 'Si la cuota cambia', accAny: 'Aceptar cualquier cambio', accUp: 'Aceptar solo si sube', accNone: 'Preguntarme siempre', keepT: 'Mantener selecciones tras apostar', qkT: 'Importes rápidos', okL: 'OK', eachL: 'Apuesta por selección', totSt: 'Apuesta total', placeN: 'Hacer {n} apuestas', placeB: 'Hacer apuesta', doneN: '¡{n} apuestas realizadas!', partial: '{ok} de {n} apuestas realizadas', singleN: 'Una apuesta por selección, cada una con su importe.', refused: 'Apuesta rechazada' },
    pt: { results: 'Resultados', inPlay: 'Em jogo', oddsChg: 'Odds atualizadas', sending: 'Enviando…', qOnly: 'Previsões: só aposta simples.', e_single: 'Previsões são só apostas simples: não podem ser combinadas.', e_corr: 'Essas escolhas estão ligadas: não podem ficar no mesmo bilhete.', e_cap: 'Limite atingido nesta opção: diminua a aposta.', more: 'Ver mais', singleX: 'Uma só escolha: ganho = aposta × odd.', balL: 'Saldo', depL: 'Recarregar', errBal: 'Saldo insuficiente para esta aposta.', e_odds: 'As odds mudaram: confira seu bilhete e confirme.', tabS: 'Simples', tabC: 'Múltipla', mkt3: 'Resultado (1X2)', mkt2: 'Vencedor', mktQ: 'Previsão', clrSt: 'Limpar', maxL: 'Máx', setT: 'Ajustes do bilhete', accT: 'Se a odd mudar', accAny: 'Aceitar qualquer mudança', accUp: 'Aceitar só se subir', accNone: 'Sempre me perguntar', keepT: 'Manter seleções após apostar', qkT: 'Valores rápidos', okL: 'OK', eachL: 'Aposta por seleção', totSt: 'Aposta total', placeN: 'Fazer {n} apostas', placeB: 'Fazer aposta', doneN: '{n} apostas feitas!', partial: '{ok} de {n} apostas feitas', singleN: 'Uma aposta por seleção, cada uma com seu valor.', refused: 'Aposta recusada' },
    ar: { results: 'النتائج', inPlay: 'جارٍ الآن', oddsChg: 'تم تحديث الاحتمالات', sending: 'جارٍ الإرسال…', qOnly: 'التوقعات: رهان فردي فقط.', e_single: 'التوقعات رهانات فردية فقط: لا يمكن دمجها.', e_corr: 'هذه الاختيارات مترابطة: لا يمكن وضعها في نفس القسيمة.', e_cap: 'تم بلوغ الحد لهذا الاختيار: خفّض المبلغ.', more: 'عرض المزيد', singleX: 'اختيار واحد: الربح = المبلغ × الاحتمال.', balL: 'الرصيد', depL: 'شحن', errBal: 'الرصيد غير كافٍ لهذا المبلغ.', e_odds: 'تغيرت الاحتمالات: راجع قسيمتك ثم أكّد.', tabS: 'فردي', tabC: 'مركّب', mkt3: 'نتيجة المباراة (1X2)', mkt2: 'الفائز', mktQ: 'توقع', clrSt: 'مسح', maxL: 'الحد الأقصى', setT: 'إعدادات القسيمة', accT: 'إذا تغيّر الاحتمال', accAny: 'قبول أي تغيير', accUp: 'قبول الارتفاع فقط', accNone: 'اسألني دائمًا', keepT: 'الإبقاء على الاختيارات بعد الرهان', qkT: 'مبالغ سريعة', okL: 'موافق', eachL: 'المبلغ لكل رهان', totSt: 'المبلغ الإجمالي', placeN: 'ضع {n} رهانات', placeB: 'ضع الرهان', doneN: 'تم تسجيل {n} رهانات!', partial: 'تم تسجيل {ok} من {n} رهانات', singleN: 'رهان لكل اختيار، ولكل رهان مبلغه.', refused: 'تم رفض الرهان' },
    tr: { results: 'Sonuçlar', inPlay: 'Oynanıyor', oddsChg: 'Oranlar güncellendi', sending: 'Gönderiliyor…', qOnly: 'Tahminler: yalnızca tekli bahis.', e_single: 'Tahminler yalnızca tekli bahistir: kombine yapılamaz.', e_corr: 'Bu seçimler bağlantılı: aynı kupona eklenemez.', e_cap: 'Bu seçimde limite ulaşıldı: bahsi düşür.', more: 'Daha fazla', singleX: 'Tek seçim: kazanç = bahis × oran.', balL: 'Bakiye', depL: 'Yükle', errBal: 'Bu bahis için bakiye yetersiz.', e_odds: 'Oranlar değişti: kuponunu kontrol edip onayla.', tabS: 'Tekli', tabC: 'Kombine', mkt3: 'Maç sonucu (1X2)', mkt2: 'Kazanan', mktQ: 'Tahmin', clrSt: 'Temizle', maxL: 'Maks', setT: 'Kupon ayarları', accT: 'Oran değişirse', accAny: 'Her değişikliği kabul et', accUp: 'Sadece yükselişi kabul et', accNone: 'Her zaman sor', keepT: 'Bahisten sonra seçimleri koru', qkT: 'Hızlı tutarlar', okL: 'Tamam', eachL: 'Bahis başına tutar', totSt: 'Toplam tutar', placeN: '{n} bahis yap', placeB: 'Bahis yap', doneN: '{n} bahis alındı!', partial: '{n} bahisten {ok} tanesi alındı', singleN: 'Her seçim için ayrı bahis, her biri kendi tutarıyla.', refused: 'Bahis reddedildi' },
    vi: { results: 'Kết quả', inPlay: 'Đang diễn ra', oddsChg: 'Tỷ lệ đã cập nhật', sending: 'Đang gửi…', qOnly: 'Dự đoán: chỉ cược đơn.', e_single: 'Dự đoán chỉ được cược đơn: không thể cược xiên.', e_corr: 'Các lựa chọn này liên quan nhau: không thể chung một phiếu.', e_cap: 'Đã đạt giới hạn cho lựa chọn này: hãy giảm tiền cược.', more: 'Xem thêm', singleX: 'Một lựa chọn: tiền thắng = tiền cược × tỷ lệ.', balL: 'Số dư', depL: 'Nạp tiền', errBal: 'Số dư không đủ cho mức cược này.', e_odds: 'Tỷ lệ đã thay đổi: kiểm tra phiếu rồi xác nhận lại.', tabS: 'Đơn', tabC: 'Xiên', mkt3: 'Kết quả trận (1X2)', mkt2: 'Đội thắng', mktQ: 'Dự đoán', clrSt: 'Xóa', maxL: 'Tối đa', setT: 'Cài đặt phiếu cược', accT: 'Nếu tỷ lệ thay đổi', accAny: 'Chấp nhận mọi thay đổi', accUp: 'Chỉ chấp nhận khi tăng', accNone: 'Luôn hỏi tôi', keepT: 'Giữ lựa chọn sau khi cược', qkT: 'Số tiền nhanh', okL: 'OK', eachL: 'Tiền cược mỗi vé', totSt: 'Tổng tiền cược', placeN: 'Đặt {n} cược', placeB: 'Đặt cược', doneN: 'Đã đặt {n} cược!', partial: 'Đã đặt {ok}/{n} cược', singleN: 'Mỗi lựa chọn một cược, mỗi cược một số tiền.', refused: 'Cược bị từ chối' },
    id: { results: 'Hasil', inPlay: 'Berlangsung', oddsChg: 'Odds diperbarui', sending: 'Mengirim…', qOnly: 'Prediksi: hanya taruhan tunggal.', e_single: 'Prediksi hanya taruhan tunggal: tidak bisa digabung.', e_corr: 'Pilihan ini saling terkait: tidak bisa dalam satu slip.', e_cap: 'Batas tercapai untuk pilihan ini: kurangi taruhan.', more: 'Lihat lagi', singleX: 'Satu pilihan: kemenangan = taruhan × odds.', balL: 'Saldo', depL: 'Isi saldo', errBal: 'Saldo tidak cukup untuk taruhan ini.', e_odds: 'Odds berubah: periksa slip lalu konfirmasi lagi.', tabS: 'Tunggal', tabC: 'Kombinasi', mkt3: 'Hasil laga (1X2)', mkt2: 'Pemenang', mktQ: 'Prediksi', clrSt: 'Hapus', maxL: 'Maks', setT: 'Pengaturan slip', accT: 'Jika odds berubah', accAny: 'Terima semua perubahan', accUp: 'Terima jika naik saja', accNone: 'Selalu tanya saya', keepT: 'Simpan pilihan setelah taruhan', qkT: 'Nominal cepat', okL: 'OK', eachL: 'Taruhan per pilihan', totSt: 'Total taruhan', placeN: 'Pasang {n} taruhan', placeB: 'Pasang taruhan', doneN: '{n} taruhan terpasang!', partial: '{ok} dari {n} taruhan terpasang', singleN: 'Satu taruhan per pilihan, masing-masing dengan nominalnya.', refused: 'Taruhan ditolak' },
    ru: { results: 'Результаты', inPlay: 'Идёт игра', oddsChg: 'Коэффициенты обновлены', sending: 'Отправка…', qOnly: 'Прогнозы: только одиночная ставка.', e_single: 'Прогнозы — только одиночные ставки, без экспресса.', e_corr: 'Эти исходы связаны: их нельзя ставить в один купон.', e_cap: 'Лимит по этому исходу исчерпан: уменьшите ставку.', more: 'Показать ещё', singleX: 'Один исход: выигрыш = ставка × коэффициент.', balL: 'Баланс', depL: 'Пополнить', errBal: 'Недостаточно средств для этой ставки.', e_odds: 'Коэффициенты изменились: проверьте купон и подтвердите.', tabS: 'Ординар', tabC: 'Экспресс', mkt3: 'Исход матча (1X2)', mkt2: 'Победитель', mktQ: 'Прогноз', clrSt: 'Очистить', maxL: 'Макс', setT: 'Настройки купона', accT: 'Если коэффициент изменится', accAny: 'Принимать любые изменения', accUp: 'Принимать только повышение', accNone: 'Всегда спрашивать', keepT: 'Сохранять выбор после ставки', qkT: 'Быстрые суммы', okL: 'OK', eachL: 'Ставка на каждый', totSt: 'Общая ставка', placeN: 'Сделать {n} ставки', placeB: 'Сделать ставку', doneN: 'Принято ставок: {n}!', partial: 'Принято {ok} из {n}', singleN: 'Отдельная ставка на каждый исход, у каждой своя сумма.', refused: 'Ставка отклонена' },
    de: { results: 'Ergebnisse', inPlay: 'Läuft', oddsChg: 'Quoten aktualisiert', sending: 'Wird gesendet…', qOnly: 'Prognosen: nur Einzelwette.', e_single: 'Prognosen nur als Einzelwette: keine Kombi möglich.', e_corr: 'Diese Tipps hängen zusammen: nicht im selben Wettschein.', e_cap: 'Limit für diese Auswahl erreicht: Einsatz senken.', more: 'Mehr anzeigen', singleX: 'Ein Tipp: Gewinn = Einsatz × Quote.', balL: 'Guthaben', depL: 'Aufladen', errBal: 'Guthaben reicht für diesen Einsatz nicht.', e_odds: 'Quoten haben sich geändert: Wettschein prüfen und bestätigen.', tabS: 'Einzel', tabC: 'Kombi', mkt3: 'Spielergebnis (1X2)', mkt2: 'Sieger', mktQ: 'Prognose', clrSt: 'Löschen', maxL: 'Max', setT: 'Wettschein-Einstellungen', accT: 'Wenn sich die Quote ändert', accAny: 'Alle Änderungen annehmen', accUp: 'Nur höhere Quoten annehmen', accNone: 'Immer nachfragen', keepT: 'Auswahl nach der Wette behalten', qkT: 'Schnellbeträge', okL: 'OK', eachL: 'Einsatz pro Wette', totSt: 'Gesamteinsatz', placeN: '{n} Wetten platzieren', placeB: 'Wette platzieren', doneN: '{n} Wetten platziert!', partial: '{ok} von {n} Wetten platziert', singleN: 'Eine Wette pro Tipp, jede mit eigenem Einsatz.', refused: 'Wette abgelehnt' },
    hi: { results: 'नतीजे', inPlay: 'जारी है', oddsChg: 'ऑड्स अपडेट हुए', sending: 'भेजा जा रहा है…', qOnly: 'भविष्यवाणी: सिर्फ़ एकल दांव।', e_single: 'भविष्यवाणियाँ सिर्फ़ एकल दांव हैं: इन्हें जोड़ा नहीं जा सकता।', e_corr: 'ये चुनाव आपस में जुड़े हैं: एक ही स्लिप में नहीं रख सकते।', e_cap: 'इस विकल्प की सीमा पूरी हो गई: दांव कम करें।', more: 'और देखें', singleX: 'एक चुनाव: जीत = दांव × ऑड्स।', balL: 'बैलेंस', depL: 'रिचार्ज', errBal: 'इस दांव के लिए बैलेंस कम है।', e_odds: 'ऑड्स बदल गए: अपनी स्लिप देखें और फिर पुष्टि करें।', tabS: 'सिंगल', tabC: 'मल्टीपल', mkt3: 'मैच नतीजा (1X2)', mkt2: 'विजेता', mktQ: 'भविष्यवाणी', clrSt: 'हटाएँ', maxL: 'अधिकतम', setT: 'स्लिप सेटिंग', accT: 'ऑड्स बदलें तो', accAny: 'हर बदलाव मानें', accUp: 'सिर्फ़ बढ़ने पर मानें', accNone: 'हमेशा पूछें', keepT: 'दांव के बाद चुनाव रखें', qkT: 'तेज़ रकम', okL: 'ठीक', eachL: 'हर दांव की रकम', totSt: 'कुल रकम', placeN: '{n} दांव लगाएँ', placeB: 'दांव लगाएँ', doneN: '{n} दांव लग गए!', partial: '{n} में से {ok} दांव लगे', singleN: 'हर चुनाव पर अलग दांव, हर एक की अपनी रकम।', refused: 'दांव अस्वीकार हुआ' },
    zh: { results: '结果', inPlay: '进行中', oddsChg: '赔率已更新', sending: '发送中…', qOnly: '预测：仅限单关。', e_single: '预测只能单关投注，不能串关。', e_corr: '这些选择相互关联，不能放在同一投注单。', e_cap: '该选项已达上限，请降低投注额。', more: '显示更多', singleX: '单个选择：可赢 = 投注 × 赔率。', balL: '余额', depL: '充值', errBal: '余额不足以支付此投注。', e_odds: '赔率已变化：请检查投注单后再确认。', tabS: '单关', tabC: '串关', mkt3: '全场赛果 (1X2)', mkt2: '胜者', mktQ: '预测', clrSt: '清除', maxL: '最大', setT: '投注单设置', accT: '赔率变化时', accAny: '接受任何变化', accUp: '仅接受上升', accNone: '每次都询问我', keepT: '投注后保留选项', qkT: '快捷金额', okL: '确定', eachL: '每注金额', totSt: '总投注额', placeN: '投注 {n} 注', placeB: '确认投注', doneN: '已投注 {n} 注！', partial: '已投注 {ok}/{n} 注', singleN: '每个选择单独一注，各自金额。', refused: '投注被拒绝' }
  };
  function XX() { var l = lg(); return Object.assign(X(), NT.en, NT[l] || {}); }
  // petites icônes
  var IC = {
    clock: '<svg class="sp2-i" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
    lock: '<svg class="sp2-i" viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>',
    ok: '<svg class="sp2-i" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
    cal: '<svg class="sp2-i" viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="5" width="16" height="15" rx="2.5"/><path d="M4 10h16M9 3v4M15 3v4"/></svg>',
    x: '<svg class="sp2-i" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7l10 10M17 7L7 17"/></svg>',
    back: '<svg class="sp2-i sp2-flip" viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>',
    slip: '<svg class="sp2-i" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6"/></svg>',
    gear: '<svg class="sp2-i" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
    clock2: '',
    trash: '<svg class="sp2-i" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13"/></svg>'
  };
  function loc() { var l = lg(); return l === 'ar' ? 'ar-u-nu-latn' : l; }
  function when(t) {
    var x = X(), d = new Date(t * 1000), now = new Date(), tm = new Date(now.getTime() + 86400000);
    var hm = d.toLocaleTimeString(loc(), { hour: '2-digit', minute: '2-digit' });
    if (d.toDateString() === now.toDateString()) return x.today + ' · ' + hm;
    if (d.toDateString() === tm.toDateString()) return x.tomorrow + ' · ' + hm;
    return d.toLocaleDateString(loc(), { weekday: 'short', day: 'numeric', month: 'short' }) + ' · ' + hm;
  }
  function hm(t) { return new Date(t * 1000).toLocaleTimeString(loc(), { hour: '2-digit', minute: '2-digit' }); }
  function dayLabel(t) {
    var x = X(), d = new Date(t * 1000), now = new Date(), tm = new Date(now.getTime() + 86400000);
    if (d.toDateString() === now.toDateString()) return x.today;
    if (d.toDateString() === tm.toDateString()) return x.tomorrow;
    return d.toLocaleDateString(loc(), { weekday: 'short', day: 'numeric', month: 'short' });
  }
  function nowS() { return Date.now() / 1000; }
  function ufmt(u, v) { try { return new Intl.NumberFormat(loc(), { style: 'unit', unit: u, unitDisplay: 'narrow' }).format(v); } catch (e) { return v + { day: 'd', hour: 'h', minute: 'm' }[u]; } }
  // compte à rebours court : « 2h 15m », « 3d 4h », « 12m » (unités de la langue du joueur)
  function cd(sec) {
    sec = Math.max(0, sec);
    var d = Math.floor(sec / 86400), h = Math.floor(sec % 86400 / 3600), m = Math.floor(sec % 3600 / 60);
    var s = d ? ufmt('day', d) + ' ' + ufmt('hour', h) : h ? ufmt('hour', h) + ' ' + ufmt('minute', m) : ufmt('minute', Math.max(1, m));
    return s.replace(/\s/g, ' ');
  }
  // une longue phrase → 2 (ou 3) lignes équilibrées, chacune sur UNE ligne élastique (jamais de retour à la ligne automatique)
  function split2(t, min) {
    t = String(t || '').trim(); if (t.length < (min || 26)) return [t];
    var mid = t.length / 2, best = -1, bd = 1e9;
    for (var i = 1; i < t.length - 1; i++) {
      var c = t.charAt(i), pen;
      if (c === ' ' && /\d/.test(t.charAt(i - 1)) && /[\d$€%]/.test(t.charAt(i + 1))) continue; // v2807 : « 4 200 $ » jamais coupé en deux lignes
      if (c === ' ') pen = Math.abs(i - mid) - (/[.!?:;,،]/.test(t.charAt(i - 1)) ? t.length * 0.18 : 0);
      else if (/[，。、！？：；]/.test(c)) pen = Math.abs(i + 1 - mid) - t.length * 0.18;
      else continue;
      if (pen < bd) { bd = pen; best = c === ' ' ? i : i + 1; }
    }
    if (best < 0) { if (/\s/.test(t)) return [t]; best = Math.round(mid); }
    return [t.slice(0, best).trim(), t.slice(best).trim()].filter(Boolean);
  }
  function lines(t, max) { var mn = max && max < 26 ? max : 26, out = []; split2(t, mn).forEach(function (p) { if (p.length > (max || 34)) out = out.concat(split2(p, mn)); else out.push(p); }); return out; }
  function linesHtml(t, tag, max, auto) { return lines(t, max).map(function (p) { return '<' + tag + ' class="fit"' + (auto ? ' dir="auto"' : '') + '>' + esc(p) + '</' + tag + '>'; }).join(''); }
  // textes élastiques (même règle que le casino : D6.CasinoKit.fitEl)
  function fitEl(el) {
    var K = D6.CasinoKit; if (K && K.fitEl) { K.fitEl(el); return; }
    if (!el || !el.isConnected) return;
    el.style.fontSize = '';
    var fs = parseFloat(getComputedStyle(el).fontSize) || 14, min = Math.max(7, fs * 0.5), n = 0;
    while (el.scrollWidth > el.clientWidth + 1 && fs > min && n++ < 30) { fs = Math.max(min, fs * 0.93); el.style.fontSize = fs.toFixed(1) + 'px'; }
  }
  function fitAll(root) { if (root) root.querySelectorAll('.fit').forEach(fitEl); }
  function setTx(el, t) { if (el && el.textContent !== t) { el.textContent = t; fitEl(el); } }
  function inSlip(ev, k) { return slip.some(function (s) { return s.ev === ev && s.k === k; }); }
  function totalOdd() { return Math.floor(slip.reduce(function (a, s) { return a * s.odd; }, 1) * 100 + 1e-6) / 100; } // v2765 : 2,30 reste 2,30
  function evById(id) { for (var i = 0; i < events.length; i++) if (events[i].id === id) return events[i]; return null; }
  function evByTitle(t) { for (var i = 0; i < events.length; i++) if (events[i].title === t) return events[i]; return null; }
  function money(v) { return m2(v) + ' $'; }
  // le coupon suit la liste : match fermé → marqué « Paris fermés » ; cote changée par l'admin → nouvelle cote affichée
  function syncSlip() {
    var chg = false, n = nowS();
    slip.forEach(function (s) {
      if (s.sb) { if (!s.closed && !s.lv && n >= s.ko) { s.closed = true; chg = true; } s.l = sbOutL(s.mk, s.k, s.h.n, s.a.n); return; } // 2026-10-22 : choix SB (pas dans spList)
      var e = evById(s.ev), o = e && e.opts.filter(function (z) { return z.k === s.k; })[0];
      if (!e || !o || !e.open || n >= e.start) { if (!s.closed) { s.closed = true; chg = true; } return; }
      if (Math.abs(o.odd - s.odd) > 1e-9) { s.odd = o.odd; s.chg = true; chg = true; }
      if (!!e.susp !== !!s.susp) { s.susp = !!e.susp; chg = true; } // Predict crypto : prix introuvable → suspendu (cadenas)
      s.t = trT(e); s.l = trOp(e, o);
    });
    return chg;
  }

  var lastList = null, lastJson = '', fetching = null;
  function fetchList() {
    if (fetching) return fetching;
    fetching = (async function () {
      var r = null;
      try { r = await D6.Api.post('spList', {}, 15000); } catch (e) { r = null; }
      fetching = null;
      return r && r.ok ? (r.events || []) : null;
    })();
    return fetching;
  }
  var mining = null;
  function loadMine() {
    if (mining) return mining;
    mining = (async function () {
      var r = null;
      try { r = await D6.Api.post('spMine', {}, 15000); } catch (e) { r = null; }
      mining = null;
      return r && r.ok ? (r.bets || []) : null;
    })();
    return mining;
  }
  var warmKeep = [];
  function warmLogos(json) {
    try {
      var seen = {}, m, re = /"(img\/teams\/[a-z0-9-]+\.png|[a-f0-9]{16})"/g, n = 0;
      while ((m = re.exec(json)) && n < 80) {
        var u = m[1].charAt(0) === 'i' ? m[1] : 'sp-logo.php?k=' + m[1];
        if (seen[u]) continue; seen[u] = 1; n++;
        var im = new Image(); im.decoding = 'async'; im.src = u;
        // v2855 : logos gardés en mémoire ET décodés à l'avance (plus de logos qui « arrivent » à l'ouverture de Paris)
        warmKeep.push(im); if (im.decode) im.decode().catch(function () {});
      }
    } catch (e) { /* ignore */ }
  }
  setTimeout(function () { if (D6.Api && D6.Api.post) { fetchList().then(function (r) { if (r) { lastList = r; lastJson = JSON.stringify(r); warmLogos(lastJson); } }); sbFetch('all'); } }, 1500);
  (function () {
    var t = 0, again = function () { clearTimeout(t); t = setTimeout(function () { if (box && box.isConnected && box.classList.contains('sp2')) layoutVars(); }, 120); };
    window.addEventListener('resize', again);
    if (window.visualViewport) window.visualViewport.addEventListener('resize', again);
  })();
  function skeleton() { var s = ''; for (var i = 0; i < 4; i++) s += '<div class="sp2-ev sp2-skel"><i></i><i></i><i></i></div>'; return '<div class="sp2-list">' + s + '</div>'; }
  function empty(msg, btn, id, sv) {
    return '<div class="sp2-empty"><span class="sp2-empty-ball">' + CRYSTAL + '</span><div class="sp2-empty-t">' + linesHtml(msg, 'b', 30) + '</div>' +
      (btn ? '<button type="button" class="sp2-cta"' + (id ? ' id="' + id + '"' : '') + (sv ? ' data-sv="' + sv + '"' : '') + '><span class="fit">' + esc(btn) + '</span></button>' : '') + '</div>';
  }

  // ---------- liste des matchs ----------
  // bare = true : la « forme » de la carte seulement (sans cotes, sans compte à rebours, sans choix du coupon) — sert à savoir
  // si une carte déjà dessinée peut être GARDÉE telle quelle (logos jamais recréés) ; les cotes / minutes sont mises à jour sur place.
  function timeChip(e, bare) {
    var x = XX();
    if (e.status === 'settled') return '<em class="sp2-chip res">' + IC.ok + '<span class="fit">' + esc(x.result) + '</span></em>';
    if (!e.open) return '<em class="sp2-chip shut">' + IC.lock + '<span class="fit">' + esc(x.closed) + '</span></em>';
    var s = e.start - nowS();
    if (s < 86400) return '<em class="sp2-chip cd' + (s < 3600 && !bare ? ' soon' : '') + '" data-ts="' + e.start + '">' + IC.clock + '<span class="fit">' + (bare ? '' : cd(s)) + '</span></em>';
    return '<em class="sp2-chip">' + IC.cal + '<span class="fit">' + esc(when2(e.start)) + '</span></em>';
  }
  function card(e, ins, bare) {
    var x = XX(), q = !!EVK[e.sport], tm = q ? null : teams(e.title), settled = e.status === 'settled', three = e.opts.length === 3;
    var opts = e.opts.map(function (o, i) {
      var on = !bare && inSlip(e.id, o.k), win = settled && e.result === o.k, lose = settled && e.result && e.result !== 'void' && e.result !== o.k;
      var lbl = trO(o.label);
      if (three && i === 1 && /^(nul|draw|x|n|match nul)$/i.test(String(o.label).trim())) lbl = x.draw;
      return '<button type="button" class="sp2-o' + (on ? ' on' : '') + (win ? ' win' : '') + (lose ? ' lose' : '') + '" data-ev="' + esc(e.id) + '" data-k="' + esc(o.k) + '" aria-pressed="' + on + '"' + (e.open ? '' : ' disabled') + '>' +
        '<span class="fit" dir="auto">' + esc(lbl) + '</span><b>' + (win ? IC.ok : '') + '<i class="sp2-ov">' + (bare ? '' : Number(o.odd).toFixed(2)) + '</i></b></button>';
    }).join('');
    var head;
    if (tm) {
      head = '<div class="sp2-match"><div class="sp2-tm">' + crest(tm[0], (e.logos || [])[0], e.sport) + '<span class="sp2-tn">' + linesHtml(tm[0], 'span', 20) + '</span></div>' +
        '<div class="sp2-mid"><b class="fit">' + esc(hm(e.start)) + '</b><small class="fit">' + esc(dayLabel(e.start)) + '</small></div>' +
        '<div class="sp2-tm">' + crest(tm[1], (e.logos || [])[1], e.sport) + '<span class="sp2-tn">' + linesHtml(tm[1], 'span', 20) + '</span></div></div>';
    } else {
      var img = q ? logoHtml((e.logos || [])[0] || '', 'sp2-qimg') : '';
      if (!img) img = '<span class="sp2-qimg sp2-qico">' + sico(qKind(e)) + '</span>';
      head = '<div class="sp2-q">' + img + '<div class="sp2-qt">' + linesHtml(trT(e), 'b', 40, true) + '</div></div>';
    }
    var chip = tm && e.open && e.start - nowS() >= 86400 ? '' : timeChip(e, bare);
    // « Ligue 1 · nul = remboursé » : le nom de la ligue en haut, la petite règle (« nul = remboursé ») en dessous des équipes
    var lgAll = e.league ? trW(e.league) : '', cut = lgAll.indexOf(' · '), lgName = cut > 0 ? lgAll.slice(0, cut) : lgAll; // (propriétaire : plus de petite règle « nul = remboursé »)
    return '<article class="sp2-ev' + (q ? ' sp2-isq' : '') + (ins ? ' sp2-ins' : '') + (e.open ? '' : ' shut') + (settled ? ' done' : '') + '" data-card="' + esc(e.id) + '">' +
      '<div class="sp2-meta"><span class="sp2-lg">' + sico(qKind(e)) + '<span class="fit">' + esc(lgName || (x.sport[qKind(e)] || x.sport.autre)) + '</span></span>' + chip + '</div>' +
      head + '<div class="sp2-odds n' + e.opts.length + '">' + opts + '</div></article>';
  }
  // v2830 (propriétaire) : matchs et prédictions MÉLANGÉS dès le haut de la liste (une question toutes les 2–3 rencontres),
  // les prédictions qui ferment le plus tôt d'abord, jamais deux fois le même sujet à la suite (Bitcoin, F1, Bourse…).
  function isQev(e) { return !!(e && (e.q || EVK[e.sport])); }
  function qTopic(e) { var g = (e.grp || []).filter(function (z) { return /^asset:/.test(z); })[0]; return g || (e.logos || [])[0] || e.league || e.id; }
  var gridCols = 1; // colonnes de la grille (ordinateur / TV : 2–3) — sert à boucher les trous en fin de journée
  function feed(list, cols) {
    var live = [], res = [], M = [], Q = [];
    list.forEach(function (e) { (e.status === 'settled' ? res : live).push(e); });
    live.forEach(function (e) { (isQev(e) ? Q : M).push(e); });
    if (!M.length || !Q.length) return live.map(function (e) { return { e: e }; }).concat(res.map(function (e) { return { e: e, res: 1 }; }));
    var qs = [], pool = Q.slice(), lastT = '';
    while (pool.length) {
      var j = 0;
      for (var i = 0; i < Math.min(pool.length, 6); i++) if (qTopic(pool[i]) !== lastT) { j = i; break; }
      var q = pool.splice(j, 1)[0]; lastT = qTopic(q); qs.push(q);
    }
    // écarts 2 puis 3 (3 puis 4 s'il y a peu de questions) : sur ordinateur, les questions ne tombent pas toujours dans la même colonne
    var gaps = M.length / qs.length >= 4 ? [3, 4] : [2, 3], out = [], qi = 0, n = 0, gi = 0, grp = null, groups = [];
    M.forEach(function (e) { var k = new Date(e.start * 1000).toDateString(); if (!grp || grp.k !== k) groups.push(grp = { k: k, m: [] }); grp.m.push(e); });
    groups.forEach(function (g) {
      var arr = [];
      g.m.forEach(function (e) {
        arr.push({ e: e });
        if (++n >= gaps[gi % 2] && qi < qs.length) { arr.push({ e: qs[qi++], ins: 1 }); n = 0; gi++; }
      });
      // plusieurs colonnes : une journée finit sur une rangée pleine (une prédiction de plus plutôt qu'un trou)
      if (cols > 1) while (arr.length % cols && qi < qs.length) { arr.push({ e: qs[qi++], ins: 1 }); n = 0; }
      out = out.concat(arr);
    });
    while (qi < qs.length) out.push({ e: qs[qi++], tail: 1 });
    return out.concat(res.map(function (e) { return { e: e, res: 1 }; }));
  }
  /* 2026-10-21 (propriétaire : « les logos n'arrêtent pas de bouger, de revenir ») — chaque carte de match déjà dessinée est
     GARDÉE (mêmes éléments, mêmes images décodées) : en revenant sur Paris, à l'arrivée d'une nouvelle liste, au retour du
     coupon ou de « Mes paris », seules les cotes et les minutes changent sur place. Une carte n'est refaite que si sa forme
     change (match fermé, résultat, autre langue). Avant : toute la liste (et tous les logos) était recréée à chaque fois. */
  var cardCache = {}, fitW = 0;
  function patchCard(el, e) {
    var x = XX(), n = nowS();
    e.opts.forEach(function (o) {
      var b = el.querySelector('.sp2-o[data-k="' + o.k + '"]'); if (!b) return;
      var v = b.querySelector('.sp2-ov'), t = Number(o.odd).toFixed(2);
      if (v && v.textContent !== t) v.textContent = t;
      var on = inSlip(e.id, o.k); b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on));
    });
    var c = el.querySelector('.sp2-chip[data-ts]');
    if (c) { var s = +c.getAttribute('data-ts') - n; c.classList.toggle('soon', s < 3600); var sp = c.querySelector('span'); var tx = s > 0 ? cd(s) : x.inPlay; if (sp && sp.textContent !== tx) sp.textContent = tx; }
  }
  function cardEl(e, ins, fresh) {
    var sig = card(e, ins, true), c = cardCache[e.id];
    if (c && c.sig === sig) { patchCard(c.el, e); return c.el; }
    var t = document.createElement('div'); t.innerHTML = card(e, ins, false);
    var el = t.firstElementChild; cardCache[e.id] = { sig: sig, el: el }; fresh.push(el);
    return el;
  }
  // toucher une cote : on l'ajoute / l'enlève du coupon SANS redessiner toute la liste (rapide, la page ne saute pas)
  function pick(b) {
    var x = X(), ev = b.getAttribute('data-ev'), k = b.getAttribute('data-k'), e = evById(ev);
    if (!e || !e.open || e.susp || nowS() >= e.start) return;
    var o = e.opts.filter(function (z) { return z.k === k; })[0]; if (!o) return;
    var had = inSlip(ev, k), n0 = slip.length;
    if (!had && !slip.some(function (s) { return s.ev === ev; }) && slip.length >= 1000) { if (ctx.toast) ctx.toast(x.max10); return; } // 2026-10-21 : 50 matchs (avant 10)
    // v2810 : une prédiction se joue SEULE ; deux choix liés (même groupe : même match, même actif…) jamais dans le même coupon
    if (!had) {
      var xx = XX(), others = slip.filter(function (s) { return s.ev !== ev; }).map(function (s) { return evById(s.ev) || { q: !!s.q, grp: s.grp || [] }; });
      var isQ = function (z) { return !!(z && (z.q || EVK[z.sport])); }, g = e.grp || [];
      if (others.length && (isQ(e) || others.some(isQ))) { if (ctx.toast) ctx.toast(xx.e_single, 'info'); return; }
      if (others.some(function (z) { return (z.grp || []).some(function (y) { return g.indexOf(y) > -1; }); })) { if (ctx.toast) ctx.toast(xx.e_corr, 'info'); return; }
    }
    slip = slip.filter(function (s) { return s.ev !== ev; }); // un seul choix par match
    if (!had) slip.push({ ev: ev, k: k, odd: o.odd, t: trT(e), l: trOp(e, o), q: !!(e.q || EVK[e.sport]), grp: e.grp || [] });
    // (toutes les cotes de cet événement à l'écran)
    (box || document).querySelectorAll('.sp2-o[data-ev="' + ev + '"]').forEach(function (z) { var on = inSlip(ev, z.getAttribute('data-k')); z.classList.toggle('on', on); z.setAttribute('aria-pressed', String(on)); });
    paintBar(slip.length > n0);
  }

  var lastBet = null, clearArm = 0, sending = false;
  function guestNote() { var x = X(); if (D6.App && D6.App.toast) D6.App.toast(x.guestBet, 'info'); }
  // ---------- MES PARIS ----------
  function when2(t) { var d = new Date(t * 1000); return d.toLocaleDateString(loc(), { day: 'numeric', month: 'short' }) + ' · ' + d.toLocaleTimeString(loc(), { hour: '2-digit', minute: '2-digit' }); }
  function selRow(s) {
    var x = XX(), r = s.r || 'open', e = evByTitle(s.t), right = '';
    if (r === 'open' && e) {
      if (e.open && e.start > nowS()) right = '<span class="sp2-cd' + (e.start - nowS() < 3600 ? ' soon' : '') + '" data-ts="' + e.start + '">' + IC.clock + '<span class="fit">' + cd(e.start - nowS()) + '</span></span>';
      else if (e.status !== 'settled') right = '<span class="sp2-cd gone"><span class="fit">' + esc(x.inPlay) + '</span></span>';
    }
    var ic = r === 'won' ? IC.ok : r === 'lost' ? IC.x : r === 'void' ? '↺' : '';
    if (s.mk) { // 2026-10-22 : choix SB → choix en gras, match · marché en petit (traduits depuis mk / k)
      var tm = teams(s.t) || [s.t, ''];
      return '<div class="sp2-bs r-' + esc(r) + '"><i class="sp2-ri">' + ic + '</i><div class="sp2-bst"><small class="fit" dir="auto">' + esc(s.t) + '</small><b class="fit" dir="auto">' + esc(sbOutL(s.mk, s.k, tm[0], tm[1])) + '</b><small class="fit sb-bsm" dir="auto">' + esc(sbMkName(s.mk, tm[0], tm[1], spOf(s))) + '</small></div><em>' + Number(s.odd).toFixed(2) + '</em></div>';
    }
    return '<div class="sp2-bs r-' + esc(r) + '"><i class="sp2-ri">' + ic + '</i><div class="sp2-bst">' + linesHtml(e ? trT(e) : s.t, 'small', right ? 20 : 34, true) + '<b class="fit" dir="auto">' + esc(trO(s.l)) + '</b></div>' + right + '<em>' + Number(s.odd).toFixed(2) + '</em></div>';
  }
  /* 2026-10-21 (propriétaire : « Mes paris : chaque pari tout ouvert, pas pro ») — une LIGNE compacte par pari, comme les
     grands sites : état, type (« Combiné · 3 »), date, les choix sur une ligne, mise · cote · gain. Toucher la ligne l'ouvre
     (chaque sélection avec son résultat, numéro, « Voir le reçu »). 30 paris affichés, puis « Afficher plus ». */
  var rcOpen = {}, rcLimit = 30;
  function rcBody(bt) {
    var x = XX();
    return '<div class="sp2-bx">' + bt.sel.map(selRow).join('') +
      '<div class="sp2-bid"><span class="fit">#' + esc(String(bt.id || '').slice(-8).toUpperCase()) + '</span><button type="button" class="sp2-rcv" data-rcv="1"><span class="fit">' + esc(x.rcSee) + '</span>' + IC.back + '</button></div></div>';
  }
  /* v2790 (propriétaire) — MES PARIS : recherche par état (en cours, gagnés, perdus, remboursés) et par période
     (aujourd'hui, 7 jours, ce mois, cette année, un jour précis). Tout se fait sur le téléphone, la liste ne recharge pas. */
  var MF = { st: 'all', per: 'all', day: '' }, shown = [];
  function filt(list, anySt) {
    var now = new Date(), d0 = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() / 1000;
    var from = MF.per === 'today' ? d0 : MF.per === '7' ? d0 - 6 * 86400 : MF.per === 'month' ? new Date(now.getFullYear(), now.getMonth(), 1).getTime() / 1000 : MF.per === 'year' ? new Date(now.getFullYear(), 0, 1).getTime() / 1000 : 0;
    var dayFrom = 0, dayTo = 0;
    if (MF.per === 'day' && MF.day) { var p = MF.day.split('-'); dayFrom = new Date(+p[0], +p[1] - 1, +p[2]).getTime() / 1000; dayTo = dayFrom + 86400; }
    return (list || []).filter(function (b) {
      if (!anySt && MF.st !== 'all' && b.status !== MF.st) return false;
      if (from && b.at < from) return false;
      if (dayFrom && (b.at < dayFrom || b.at >= dayTo)) return false;
      return true;
    });
  }
  function counts() { var c = { all: 0, open: 0, won: 0, lost: 0, void: 0 }; filt(mineCache || [], true).forEach(function (b) { c.all++; c[b.status] = (c[b.status] || 0) + 1; }); return c; }
  function mineBar() {
    var x = X(), st = [['all', x.fAll], ['open', x.fOpen], ['won', x.fWon], ['lost', x.fLost], ['void', x.fVoid]], c = counts();
    var per = [['all', x.pAll], ['today', x.pToday], ['7', x.p7], ['month', x.pMonth], ['year', x.pYear], ['day', x.pDay]];
    return '<div class="sp2-mf"><div class="sp2-st">' + st.map(function (o) { return '<button type="button" data-mst="' + o[0] + '" class="st-' + o[0] + (MF.st === o[0] ? ' on' : '') + '" style="flex-grow:' + (String(o[1]).length + 3) + '"><b>' + (mineCache ? c[o[0]] || 0 : '·') + '</b><span class="fit">' + esc(o[1]) + '</span></button>'; }).join('') + '</div>' +
      '<div class="sp2-per"><label class="sp2-selw">' + IC.cal + '<select id="spMfPer" aria-label="' + esc(x.pAll) + '">' + per.map(function (o) { return '<option value="' + o[0] + '"' + (MF.per === o[0] ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join('') + '</select></label>' +
      '<input type="date" id="spMfDay" value="' + esc(MF.day) + '"' + (MF.per === 'day' ? '' : ' hidden') + '></div></div>';
  }
  function paintMine() {
    if (!$('spRcs')) return;
    var x = X(), c = counts(); shown = filt(mineCache);
    box.querySelectorAll('[data-mst]').forEach(function (b) { var n = b.querySelector('b'); if (n) n.textContent = String(c[b.getAttribute('data-mst')] || 0); });
    $('spRcs').innerHTML = shown.length || !(mineCache && mineCache.length) ? receipts(shown) : '<p class="sp2-none"><span class="fit">' + esc(x.fNone) + '</span></p>';
    bindRc(); fitAll($('spRcs'));
  }
  function bindMine() {
    box.querySelectorAll('[data-mst]').forEach(function (b) { b.addEventListener('click', function () { MF.st = b.getAttribute('data-mst'); box.querySelectorAll('[data-mst]').forEach(function (z) { z.classList.toggle('on', z === b); }); paintMine(); }); });
    var sel = $('spMfPer'), day = $('spMfDay');
    if (sel) sel.addEventListener('change', function () { MF.per = sel.value; if (day) day.hidden = MF.per !== 'day'; if (MF.per === 'day' && day && !day.value) { var n = new Date(); day.value = n.getFullYear() + '-' + String(n.getMonth() + 1).padStart(2, '0') + '-' + String(n.getDate()).padStart(2, '0'); MF.day = day.value; } paintMine(); });
    if (day) day.addEventListener('change', function () { MF.day = day.value; paintMine(); });
  }
  function bindRc() {
    var rcs = $('spRcs'); if (!rcs || rcs.dataset.bound) return;
    rcs.dataset.bound = '1';
    rcs.addEventListener('click', function (ev) {
      var t = ev.target;
      if (t.closest('#spMore')) { rcLimit += 30; paintMine(); return; }
      var c = t.closest('.sp2-bet[data-rc]'); if (!c) return;
      var bt = (shown && shown.length ? shown : (mineCache || []))[+c.getAttribute('data-rc')]; if (!bt) return;
      if (t.closest('[data-rcv]')) { showReceipt(bt); return; }
      if (!t.closest('.sp2-bhd')) return;
      // ouvrir / fermer la ligne sur place (les autres lignes ne bougent pas)
      var id = String(bt.id || ''), on = !rcOpen[id], hd = c.querySelector('.sp2-bhd');
      if (on) rcOpen[id] = 1; else delete rcOpen[id];
      c.classList.toggle('on', on); if (hd) hd.setAttribute('aria-expanded', String(on));
      var bx = c.querySelector('.sp2-bx');
      if (on && !bx) { c.insertAdjacentHTML('beforeend', rcBody(bt)); fitAll(c.querySelector('.sp2-bx')); }
      else if (!on && bx) bx.remove();
    });
  }
  /* v2779 (propriétaire) — LE REÇU D'UN PARI, comme un vrai ticket : en-tête OROLADO.com, état (en cours / gagné / perdu /
     remboursé), le montant en grand, chaque match avec son résultat, mise, cote, gain, date et numéro du reçu. */
  function showReceipt(bt) {
    var x = X(), old = document.getElementById('spRcpt'); if (old) old.remove();
    var st = bt.status || 'open';
    var stTxt = { open: x.open, won: x.wonL, lost: x.lostL, void: x.voidL }[st] || st;
    var big = st === 'won' ? m2(bt.win) : st === 'lost' ? m2(0) : st === 'void' ? m2(bt.stake) : m2(bt.pot);
    var bigLab = st === 'won' ? x.rcPaid : st === 'lost' ? x.rcLostTxt : st === 'void' ? x.rcBack : x.potL;
    var ICO = { won: '<i class="ok">✓</i>', lost: '<i class="ko">✕</i>', void: '<i class="vd">↺</i>' };
    var no = String(bt.id || '').slice(-10).toUpperCase();
    var d = new Date((bt.at || 0) * 1000), pad = function (n) { return (n < 10 ? '0' : '') + n; };
    var dt = pad(d.getDate()) + '/' + pad(d.getMonth() + 1) + '/' + d.getFullYear() + ' · ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
    var bars = ''; for (var i = 0; i < 34; i++) { var c = no.charCodeAt(i % (no.length || 1)) || 7; bars += '<b style="width:' + (1 + (c + i) % 3) + 'px"></b>'; }
    var el = document.createElement('div');
    el.id = 'spRcpt'; el.className = 'sp-rcpt';
    var nS = bt.sel.length;
    el.innerHTML = '<div class="sp-rcpt-card ' + esc(st) + (nS > 5 ? ' dn' : '') + (nS > 15 ? ' dn2' : '') + '" role="dialog" aria-modal="true">' +
      '<div class="sp-rcpt-top"><img src="icons/logo-ring.svg" alt=""><div><b>OROLADO</b><small>orolado.com</small></div><span>' + esc(x.rcTitle) + '</span></div>' +
      '<div class="sp-rcpt-st"><em class="' + esc(st) + '">' + esc(stTxt) + '</em><small>' + esc(bigLab) + '</small><strong>' + big + ' $</strong></div>' +
      '<div class="sp-rcpt-cut"></div>' +
      '<div class="sp-rcpt-sels"><p class="sp-rcpt-k">' + esc(bt.sel.length > 1 ? x.rcCombo : x.rcSingle) + ' · ' + bt.sel.length + '</p>' + bt.sel.map(function (s) {
        return '<div class="sp-rcpt-s ' + (s.r || 'open') + '">' + (ICO[s.r] || '<i class="op">•</i>') + '<span><small>' + esc(s.t) + '</small><b>' + esc(s.mk ? selLbl(s) : s.l) + '</b></span><em>' + Number(s.odd).toFixed(2) + '</em></div>';
      }).join('') + '</div>' +
      '<div class="sp-rcpt-rows"><p><span>' + esc(x.stakeL) + '</span><b>' + m2(bt.stake) + ' $</b></p><p><span>' + esc(x.totalOdd) + '</span><b>' + Number(bt.odd).toFixed(2) + '</b></p>' +
      '<p><span>' + esc(x.potL) + '</span><b>' + m2(bt.pot) + ' $</b></p><p><span>' + esc(x.rcDate) + '</span><b>' + dt + '</b></p><p><span>' + esc(x.rcNo) + '</span><b class="mono">' + esc(no) + '</b></p></div>' +
      '<div class="sp-rcpt-bars" aria-hidden="true">' + bars + '</div><p class="sp-rcpt-foot">orolado.com</p>' +
      '<div class="sp-rcpt-btns"><button type="button" class="sp-rcpt-share">' + (D6.ReceiptIcon ? '<span class="sp-rcpt-dli">' + D6.ReceiptIcon + '</span>' : '') + esc((D6.Receipt && D6.Receipt.dlLabel && D6.Receipt.dlLabel()) || x.rcShare) + '</button><button type="button" class="sp-rcpt-close" data-back="1">' + esc(x.rcClose) + '</button></div></div>';
    // dans Paris : le reçu est posé DANS la fenêtre du casino (le bouton retour du téléphone le ferme, sans fermer Paris)
    var host = box && box.isConnected && box.closest('#casinoModal') ? box.closest('#casinoModal') : document.body;
    host.appendChild(el);
    try { if (D6.Receipt && D6.Receipt.prepBet) D6.Receipt.prepBet(bt.sel.some(function (s) { return s.mk; }) ? Object.assign({}, bt, { sel: bt.sel.map(function (s) { return s.mk ? Object.assign({}, s, { l: selLbl(s) }) : s; }) }) : bt, x); } catch (eP) { /* ignore */ }
    requestAnimationFrame(function () { requestAnimationFrame(function () { el.classList.add('on'); }); });
    var close = function () { el.classList.remove('on'); setTimeout(function () { el.remove(); }, 220); };
    el.addEventListener('click', function (e) { if (e.target === el) close(); });
    el.querySelector('.sp-rcpt-close').addEventListener('click', close);
    el.querySelector('.sp-rcpt-share').addEventListener('click', function () {
      // 2026-10-21 (propriétaire) : un seul reçu, le BLANC → « Télécharger » enregistre son image (Android : fichier ;
      // iPhone : « Enregistrer l'image » dans la galerie). Plus de reçu noir ni WhatsApp / Partager ici.
      if (D6.Receipt && D6.Receipt.saveBet) { D6.Receipt.saveBet(); return; }
      var txt = 'OROLADO · ' + x.rcTitle + ' ' + no + '\n' + bt.sel.map(function (s) { return '• ' + s.t + ' — ' + s.l + ' (' + Number(s.odd).toFixed(2) + ')'; }).join('\n') +
        '\n' + x.stakeL + ' ' + m2(bt.stake) + ' $ · ' + x.totalOdd + ' ' + Number(bt.odd).toFixed(2) + ' · ' + stTxt + '\nhttps://orolado.com';
      try { if (navigator.share) { navigator.share({ text: txt }).catch(function () { /* ignore */ }); return; } } catch (e) { /* ignore */ }
      try { navigator.clipboard.writeText(txt); if (ctx && ctx.toast) ctx.toast('✓'); } catch (e) { /* ignore */ }
    });
  }

  /* ---------- TICKET DE PARIS ----------
     2026-10-21 (propriétaire : « un VRAI ticket de pro, comme 1xBet, Melbet, Betway, Premier Bet ») — même organisation que
     les grands : onglets Simple / Combiné (Simple = une mise par sélection, un pari par sélection ; Combiné = une seule mise,
     les cotes se multiplient), une ligne par sélection (choix, match, type de pari, cote, ×), « Tout effacer » en haut,
     case de mise avec « effacer », 4 places rapides en bas (3 montants que le joueur change lui-même + Max = son solde),
     solde affiché, réglages du ticket (⚙ : changements de cotes « tout accepter / seulement les hausses / toujours demander »,
     « garder les sélections après le pari », montants rapides), cote totale, gain possible, grand bouton « Placer le pari »,
     erreurs claires (mise > solde, mise minimum). Même serveur (spBet) : la cote affichée part avec chaque choix. */
  function curBal() { try { var b = ctx.bal ? ctx.bal() : null; return b == null || !isFinite(+b) ? null : +b; } catch (e) { return null; } }
  function lsGet(k, d) { try { var v = localStorage.getItem(k); return v == null ? d : v; } catch (e) { return d; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* ignore */ } }
  var lastBets = null; // (plusieurs paris d'un coup : plus utilisé, gardé pour l'écran « paris enregistrés »)
  /* 2026-10-21 (propriétaire : « on a trop compliqué ») : comme avant — 1 match = pari simple, 2 matchs ou plus = combiné
     automatique dans UN coupon, UNE seule mise ; montants rapides fixes 5 / 10 / 25 / Max ; plus de réglages (⚙) :
     la cote affichée part toujours avec le pari (acc = « none ») et le serveur refuse si elle a changé (« cotes changées »). */
  var QK = [5, 10, 25];
  function qk() { return QK.slice(); }
  function keepSel() { return false; }
  function mode() { return slip.length < 2 ? 'single' : 'combo'; }
  function cur() { return '$'; } // monnaie affichée (la monnaie locale viendra ici)
  function qtxt(v) { return (v % 1 ? m2(v) : String(v)) + ' ' + cur(); }
  function mkt(e) { var x = XX(); if (!e) return ''; if (e.q || EVK[e.sport]) return x.mktQ; return e.opts && e.opts.length === 3 ? x.mkt3 : x.mkt2; }
  function stOf() { return stake; }
  function slipTop() { try { var mb = box.closest('.modal-box'); if (mb) mb.scrollTop = 0; } catch (e) { /* ignore */ } }
  function renderDone() {
    var x = XX(), bs = lastBets || [lastBet], one = bs.length === 1, lb = bs[0];
    var tst = bs.reduce(function (a, b) { return a + b.stake; }, 0), tpot = bs.reduce(function (a, b) { return a + b.pot; }, 0);
    shell('<div class="sp2-page sp2-donep">' + slipHead() + '<div class="sp2-done"><span class="sp2-done-ok">' + IC.ok + '</span><b class="fit sp2-done-t">' + esc(one ? x.done : fmt(x.doneN, { n: bs.length })) + '</b>' +
      '<div class="sp2-done-c"><p><span class="fit">' + esc(one ? x.stakeL : x.totSt) + '</span><b class="fit">' + money(tst) + '</b></p>' + (one ? '<p><span class="fit">' + esc(x.oddL) + '</span><b class="fit">' + Number(lb.odd).toFixed(2) + '</b></p>' : '') +
      '<p class="win"><span class="fit">' + esc(x.potL) + '</span><b class="fit">' + money(tpot) + '</b></p></div>' +
      (one ? '<small class="sp2-done-id fit">#' + esc(String(lb.id || '').slice(-8).toUpperCase()) + '</small>' : '') +
      '<div class="sp2-done-b">' + (one ? '<button type="button" class="sp2-cta" id="spSeeRc"><span class="fit">' + esc(x.rcSee) + '</span></button>' : '') +
      '<div><button type="button" class="sp2-cta2" id="spSeeMine"><span class="fit">' + esc(x.mine) + '</span></button><button type="button" class="sp2-cta2" id="spCont"><span class="fit">' + esc(x.cont) + '</span></button></div></div></div></div>');
    slipTop(); fitAll(box);
    if ($('spSeeRc')) $('spSeeRc').addEventListener('click', function () { showReceipt(lb); });
    $('spSeeMine').addEventListener('click', function () { lastBet = null; lastBets = null; view = 'mine'; render(); });
    $('spCont').addEventListener('click', backToList);
  }
  function renderSlip() {
    var x = XX();
    layoutVars();
    if (lastBet || lastBets) { renderDone(); return; }
    if (!slip.length) {
      shell('<div class="sp2-page">' + slipHead() + empty(x.emptySlip, x.seeBets, 'spCont') + (sbOn !== false ? '<div class="sb-code sb-load"><p class="sb-mkt"><span>' + esc(SX().loadCode) + '</span></p>' + codeRow() + '</div>' : '') + '</div>');
      slipTop(); fitAll(box); bindCodeRow(box);
      $('spCont').addEventListener('click', backToList);
      return;
    }
    var md = mode(), each = false, odd = totalOdd();
    var expl = '<div class="sp2-type-t sp2-expl">' + linesHtml(cap1(md === 'combo' ? x.combo : slip.length > 1 ? x.singleN : (slip[0].q ? x.qOnly : x.singleX)), 'span', 40) + '</div>';
    var list = '<div class="sp2-sels" id="spSels">' + slip.map(function (z, i) {
      var e = z.sb ? null : evById(z.ev), st = stOf(z);
      return '<div class="sp2-sel' + (z.closed || z.susp ? ' closed' : '') + (z.chg ? ' chg' : '') + '"><div class="sp2-sel-r"><span class="sp2-sel-ic">' + sico(z.sb ? spIco(spOf(z)) : e ? qKind(e) : 'autre') + '</span>' +
        '<div class="sp2-sel-t"><b class="fit" dir="auto">' + esc(z.closed ? x.closed : z.susp ? NX().susp : z.l) + '</b>' + linesHtml(e ? trT(e) : z.t, 'small', 44, true) + '<small class="sp2-mkt fit" dir="auto">' + esc((z.lv ? NX().nLive + ' · ' : '') + (z.sb ? sbMkName(z.mk, z.h.n, z.a.n, spOf(z)) : mkt(e))) + '</small></div>' +
        '<em' + (z.chg && z.prev ? ' class="' + (z.odd > z.prev ? 'up' : 'dn') + '"' : '') + '>' + (z.closed || z.susp ? IC.lock : (z.chg && z.prev ? '<s>' + Number(z.prev).toFixed(2) + '</s>' : '') + Number(z.odd).toFixed(2)) + '</em><button type="button" class="sp2-x" data-i="' + i + '" aria-label="×">' + IC.x + '</button></div>' +
        (each ? '<div class="sp2-ss"><label class="sp2-inw sm"><input data-st="' + i + '" inputmode="decimal" autocomplete="off" value="' + (st > 0 ? m2(st) : '') + '" aria-label="' + esc(x.stakeL) + '"><em>' + cur() + '</em></label>' +
          '<span class="sp2-ssw"><small class="fit">' + esc(x.potL) + '</small><b class="fit" data-pw="' + i + '">' + money(sp2Pot(st, z.odd)) + '</b></span></div>' : '') + '</div>';
    }).join('') + '</div>';
    var guestBtn = String(x.guestBet || '').replace(/^🔒\s*/, '').trim(); // « 🔒 Inscris-toi pour parier (c'est gratuit) » sans le cadenas
    var bal = ctx.guest ? null : curBal(), q = qk(), main = each ? (slip.every(function (z) { return stOf(z) === stOf(slip[0]); }) ? stOf(slip[0]) : 0) : stake;
    var stk = '<div class="sp2-stk">' +
      '<div class="sp2-amt"><label class="sp2-inw" for="spStake"><span class="sp2-inl"><span class="fit">' + esc(each ? x.eachL : x.stakeL) + '</span></span><span class="sp2-inv"><input id="spStake" inputmode="decimal" autocomplete="off" enterkeyhint="done" value="' + (main > 0 ? sv(main) : '') + '" placeholder="0" aria-label="' + esc(x.stakeL) + '"><em>' + cur() + '</em></span></label><button type="button" class="sp2-pm plus" id="spPlus" aria-label="+"><svg viewBox="0 0 24 24"><path d="M6 12h12M12 6v12"/></svg></button>' +
        '<button type="button" class="sp2-clr" id="spClr"><svg viewBox="0 0 24 24"><path d="M8 8l8 8M16 8l-8 8"/></svg><span class="fit">' + esc(x.clrSt) + '</span></button></div>' +
      '<div class="sp2-qk4">' + q.map(function (v) { return '<button type="button" data-q="' + v + '"><span class="fit">' + esc(qtxt(v)) + '</span></button>'; }).join('') +
        '<button type="button" data-q="max" class="mx"><span class="fit">' + esc(x.maxL) + '</span></button></div>' +
      (bal == null ? '' : '<div class="sp2-balr" id="spBalR"><span class="fit" id="spBalT">' + esc(x.balL + (lg() === 'fr' ? ' : ' : ': ')) + money(bal) + '</span></div>') +
      '<p class="sp2-err" id="spErr" hidden><span class="fit" id="spErrT"></span></p>' +
      '<div class="sp2-sum">' + (each ? '<p><span class="fit">' + esc(x.totSt) + '</span><b id="spTot"></b></p>' : '<p><span class="fit">' + esc(x.totalOdd) + '</span><b id="spOdd">' + odd.toFixed(2) + '</b></p>') +
        '<p class="win"><span class="fit">' + esc(x.potL) + '</span><b id="spPot"></b></p></div>' +
      '<button type="button" class="sp2-place' + (ctx.guest ? ' guest' : '') + '" id="spGo"><span class="fit" id="spGoT">' + esc(ctx.guest ? guestBtn || x.guestBtn : each ? fmt(x.placeN, { n: slip.length }) : x.placeB) + '</span>' +
        '</button>' + // propriétaire : « Placer le pari » seul, sans le montant dans le bouton
      '<p class="sp2-min"><span class="fit">' + esc(x.minNote) + '</span></p></div>';
    var cb = sbOn ? codeBox(false) : '';
    shell('<div class="sp2-page sp2-slip ' + md + '">' + slipHead() + expl + list + (cb ? '<div class="sb-code" id="sbCode">' + cb + '</div>' : '') +
      (sbOn !== false ? '<details class="pz-ldc"><summary>' + esc(SX().loadCode) + '</summary>' + codeRow() + '</details>' : '') + stk + '</div>');
    slipTop(); fitAll(box); startTick(); if (cb) bindCodeBox(); bindCodeRow(box);
    slip.forEach(function (z) { z.chg = false; z.prev = 0; });
    $('spCpClear').addEventListener('click', function () {
      if (sending) return;
      var bt = this;
      if (Date.now() - clearArm > 3000) { clearArm = Date.now(); setTx(bt.querySelector('span'), x.confirmClear); bt.classList.add('arm'); return; }
      clearArm = 0; slip = []; render(); // propriétaire : on reste sur le ticket (vide), pas de saut
    });
    box.querySelectorAll('.sp2-x').forEach(function (bt) { bt.addEventListener('click', function () { if (sending) return; slip.splice(+bt.getAttribute('data-i'), 1); render(); }); });
    var inp = $('spStake');
    var total = function () { return each ? slip.reduce(function (a, z) { return a + stOf(z); }, 0) : stake; };
    var upd = function () {
      var t = Math.round(total() * 100) / 100;
      var pot = each ? slip.reduce(function (a, z) { return a + sp2Pot(stOf(z), z.odd); }, 0) : sp2Pot(stake, totalOdd());
      setTx($('spPot'), money(pot));
      if ($('spTot')) setTx($('spTot'), money(t));
      if ($('spGoAmt')) setTx($('spGoAmt'), money(t));
      if (each) slip.forEach(function (z, i) { var w = box.querySelector('[data-pw="' + i + '"]'); if (w) setTx(w, money(sp2Pot(stOf(z), z.odd))); });
      // erreurs claires : mise minimum, mise plus grande que le solde (bouton Recharger mis en avant)
      var b = curBal(), low = !ctx.guest && (each ? slip.some(function (z) { return stOf(z) < 0.1 - 1e-9; }) : stake < 0.1 - 1e-9);
      var over = !ctx.guest && !low && b != null && t > b + 1e-9, msg = low ? x.minNote : over ? x.errBal : '';
      if ($('spErr')) { $('spErr').hidden = !msg; if (msg) { setTx($('spErrT'), msg); } }
      var sk = box.querySelector('.sp2-stk'); sk.classList.toggle('over', over); sk.classList.toggle('bad', !!msg);
      if ($('spBalT') && b != null) setTx($('spBalT'), x.balL + (lg() === 'fr' ? ' : ' : ': ') + money(b));
    };
    var num = function (s) { var v = parseFloat(String(s).replace(',', '.')); return v > 0 ? Math.round(v * 100) / 100 : 0; };
    var setAll = function (v, write) {
      v = Math.max(0, Math.round((Number(v) || 0) * 100) / 100);
      if (each) { slip.forEach(function (z) { z.st = v; }); box.querySelectorAll('[data-st]').forEach(function (i) { i.value = v > 0 ? m2(v) : ''; }); }
      else { stake = v; if (v >= 0.1) lsSet('oro_sp_stake', String(v)); }
      if (write) inp.value = v > 0 ? sv(v) : '';
      upd();
    };
    inp.addEventListener('input', function () { setAll(num(inp.value), false); });
    inp.addEventListener('change', function () { setAll(num(inp.value), true); });
    inp.addEventListener('focus', function () { try { inp.select(); } catch (e) { /* ignore */ } });
    inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); inp.blur(); } });
    box.querySelectorAll('[data-st]').forEach(function (i) {
      var z = slip[+i.getAttribute('data-st')];
      i.addEventListener('input', function () { z.st = num(i.value); inp.value = ''; upd(); });
      i.addEventListener('change', function () { z.st = num(i.value); i.value = z.st > 0 ? m2(z.st) : ''; upd(); });
      i.addEventListener('focus', function () { try { i.select(); } catch (e) { /* ignore */ } });
    });
    $('spClr').addEventListener('click', function () { if (!sending) setAll(0, true); });
    // 2026-10-21 (propriétaire : « un bouton + pour ajouter des petits montants, de plus en plus vite, sans taper au
    // clavier ») : + par petits pas (0.10 $ au début, puis plus grands quand la mise grandit) ;
    // doigt gardé appuyé = ça continue et ça accélère.
    var stepOf = function (v) { return v < 1 ? 0.1 : v < 5 ? 0.5 : v < 20 ? 1 : v < 100 ? 5 : v < 500 ? 10 : 50; };
    var curSt = function () { return each ? (num(inp.value) || stOf(slip[0])) : stake; };
    var bump = function (dir) {
      if (sending) return;
      var v = curSt(), n;
      if (dir > 0) n = v < 0.1 ? 0.1 : v + stepOf(v);
      else { n = v - stepOf(Math.max(0, v - 0.001)); if (n < 0.1) n = 0.1; }
      n = Math.round(n * 100) / 100;
      var bl = curBal();
      if (dir > 0 && bl != null && !ctx.guest) { var cap = Math.floor(bl / (each ? slip.length : 1) * 100 + 1e-6) / 100; if (cap >= 0.1 && n > cap) n = cap; }
      setAll(n, true);
    };
    [['spPlus', 1]].forEach(function (pr) { // propriétaire : pas de « − » (« Effacer » suffit)
      var bt = $(pr[0]); if (!bt) return;
      var tm = 0, iv = 0, gap = 0, down = false;
      var stop = function () { down = false; clearTimeout(tm); clearTimeout(iv); };
      var rep = function () { if (!down) return; bump(pr[1]); gap = Math.max(45, gap * 0.82); iv = setTimeout(rep, gap); };
      bt.addEventListener('pointerdown', function (e) { if (e.button > 0) return; e.preventDefault(); down = true; bump(pr[1]); gap = 170; tm = setTimeout(rep, 420); });
      ['pointerup', 'pointerleave', 'pointercancel', 'blur'].forEach(function (ev) { bt.addEventListener(ev, stop); });
      bt.addEventListener('click', function (e) { if (e.detail === 0) bump(pr[1]); }); // clavier
      bt.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    });
    box.querySelectorAll('.sp2-qk4 [data-q]').forEach(function (b) {
      b.addEventListener('click', function () {
        if (sending) return;
        var v = b.getAttribute('data-q');
        if (v === 'max') { var bl = curBal(); if (bl == null) return; v = Math.floor(bl / (each ? slip.length : 1) * 100 + 1e-6) / 100; }
        setAll(+v, true);
      });
    });
    upd();
    if (sending) busy(true);
    $('spGo').addEventListener('click', place);
  }
  function cap1(t) { t = String(t || ''); return t.charAt(0).toUpperCase() + t.slice(1); }
  // gain possible affiché = celui que le serveur enregistrera (mise × cote, arrondi au cent INFÉRIEUR, comme sp_floor2)
  function sp2Pot(st, odd) { return Math.floor(st * odd * 100 + 1e-6) / 100; }
  /* 2026-10-22 (propriétaire : « sur iPhone la petite roue a l'air figée, les joueurs touchent encore ») — pendant l'envoi,
     une barre claire se remplit DANS le bouton, de gauche à droite, sur la durée de l'acceptation (direct ≈ 5 s + relecture ;
     avant-match ≈ 1,5 s), avec un reflet qui passe en continu (transform seulement : fluide sur iPhone). Bouton désactivé :
     un 2e toucher n'envoie jamais un 2e pari (sending + disabled). Fin : barre pleine, « ✓ » ou « ✕ Pari refusé » un instant. */
  var sendT0 = 0, sendDur = 0;
  function busy(on) {
    var g = $('spGo'), x = XX(); if (!g) return;
    var live = slip.some(function (z) { return z.lv; });
    g.disabled = on; g.classList.toggle('wait', on); g.setAttribute('aria-busy', on ? 'true' : 'false');
    var p = g.querySelector('.sp2-prog');
    if (on) {
      if (!sendT0) { sendT0 = Date.now(); sendDur = live ? 6500 : 1600; }
      if (!p) { p = document.createElement('i'); p.className = 'sp2-prog'; p.setAttribute('aria-hidden', 'true'); p.innerHTML = '<i></i>'; g.insertBefore(p, g.firstChild); }
      // bouton refait pendant l'envoi (cotes qui bougent) : la barre reprend où elle en était. En ligne et « important » :
      // elle bouge aussi en mode léger (html.oro-lite, retenu 7 jours sur un téléphone lent : c'est ce qui figeait la roue).
      p.style.setProperty('animation', 'sp2Fill ' + sendDur + 'ms cubic-bezier(.25,.3,.6,1) ' + (-Math.min(sendDur, Date.now() - sendT0)) + 'ms 1 normal both running', 'important');
      p.firstChild.style.setProperty('animation', 'sp2Sweep 1.3s linear 0s infinite normal none running', 'important');
    } else { if (p) p.remove(); sendT0 = 0; g.classList.remove('okd', 'kod'); }
    setTx($('spGoT'), on ? (live ? NX().liveWait : x.sending) : mode() === 'single' && slip.length > 1 ? fmt(x.placeN, { n: slip.length }) : x.placeB);
    box.querySelectorAll('.sp2-page button:not(#spGo), .sp2-page input').forEach(function (b) { b.disabled = on; });
  }
  // fin de l'envoi : barre pleine + « ✓ Pari enregistré ! » (≈ 0,35 s) ou « ✕ Pari refusé » (≈ 0,7 s) ; le bouton reste désactivé
  function busyEnd(ok) {
    var g = $('spGo'), x = XX(); if (!g) return Promise.resolve();
    var p = g.querySelector('.sp2-prog');
    if (p) { try { p.style.transform = getComputedStyle(p).transform; p.style.setProperty('animation', 'none', 'important'); void p.offsetWidth; p.style.setProperty('transition', 'transform .2s ease-out', 'important'); p.style.transform = 'scaleX(1)'; } catch (e) { /* ignore */ } }
    g.classList.add(ok ? 'okd' : 'kod');
    setTx($('spGoT'), ok ? '✓ ' + String(x.done || '').replace(/\s*[!！]$/, '') : '✕ ' + x.refused);
    return new Promise(function (res) { setTimeout(res, ok ? 350 : 700); });
  }
  // pas de réponse (réseau coupé, délai dépassé) : on regarde si le pari a quand même été enregistré avant de dire « échec »
  async function recover(sentAt, st, titles, known) {
    var m = await loadMine(); if (!m) return null;
    mineCache = m;
    return m.filter(function (b) {
      return !known[b.id] && b.at >= sentAt - 120 && Math.abs(b.stake - st) < 0.005 && b.sel.map(function (s) { return s.t; }).sort().join('|') === titles;
    })[0] || null;
  }
  // un coupon envoyé au serveur (combiné = toutes les sélections ; simple = une sélection). Renvoie la réponse (ou celle retrouvée).
  async function send1(zs, st) {
    var sel = zs.map(function (z) { return { ev: z.ev, k: z.k, odd: z.odd }; });
    var titles = zs.map(function (z) { var e = evById(z.ev); return e ? e.title : z.sb ? z.t : ''; }).sort().join('|');
    var known = {}; (mineCache || []).forEach(function (b) { known[b.id] = 1; });
    var sentAt = nowS(), r = null;
    // 2026-10-21 : les cotes AFFICHÉES partent avec le pari, et le réglage du joueur pour les changements de cotes (acc)
    try { r = await D6.Api.post('spBet', { mode: 'real', stake: st, sel: sel, acc: accMode() }, 20000); } catch (e) { r = null; }
    if (!r) { var found = await recover(sentAt, st, titles, known); if (found) r = { ok: true, bet: found, bal: null }; }
    return r;
  }
  async function place() {
    var x = XX();
    if (ctx.guest) { guestNote(); if (ctx.signup) ctx.signup(); return; }
    if (sending || !slip.length) return;
    if (slip.some(function (z) { return z.closed; })) { if (ctx.toast) ctx.toast(x.e_closed); return; }
    if (slip.some(function (z) { return z.susp; })) { if (ctx.toast) ctx.toast(NX().e_susp); return; }
    var each = mode() === 'single' && slip.length > 1;
    var jobs = each ? slip.map(function (z) { return { zs: [z], st: stOf(z) }; }) : [{ zs: slip.slice(), st: stake }];
    if (jobs.some(function (j) { return j.st < 0.1 - 1e-9; })) { if (ctx.toast) ctx.toast(x.e_min); return; }
    var tot = jobs.reduce(function (a, j) { return a + j.st; }, 0), b0 = curBal();
    if (b0 != null && tot > b0 + 1e-9) { if (ctx.toast) ctx.toast(x.errBal); if (ctx.deposit) ctx.deposit(); return; }
    sending = true; busy(true);
    var okBets = [], fails = [], lastR = null, failR = null;
    for (var i = 0; i < jobs.length; i++) {
      var r = await send1(jobs[i].zs, jobs[i].st);
      if (r && r.ok) { okBets.push(r.bet); lastR = r; jobs[i].done = true; } else { fails.push((r && r.reason) || 'unavailable'); failR = r; }
      if (r && r.reason === 'odds') break; // cotes changées : on s'arrête, le joueur revoit son ticket
    }
    if (box && box.isConnected) await busyEnd(!fails.length);
    sending = false; sendT0 = 0;
    if (!box || !box.isConnected) { if (okBets.length && !keepSel()) { slip = []; mineCache = null; } return; }
    if (okBets.length) {
      if (ctx.afterPlay) ctx.afterPlay({ mode: 'real', bal: lastR.bal, win: 0, stake: okBets.reduce(function (a, b) { return a + b.stake; }, 0) });
      if (mineCache) { var ids = {}; okBets.forEach(function (b) { ids[b.id] = 1; }); mineCache = okBets.slice().reverse().concat(mineCache.filter(function (b) { return !ids[b.id]; })); }
      // sélections jouées retirées du ticket (sauf « garder les sélections ») ; celles qui ont échoué restent
      if (!keepSel()) slip = slip.filter(function (z) { return !jobs.some(function (j) { return j.done && j.zs.indexOf(z) > -1; }); });
    }
    if (!fails.length) {
      if (okBets.length === 1) lastBet = okBets[0]; else lastBets = okBets;
      if (view === 'slip') render();
      return;
    }
    var why = fails[fails.length - 1];
    if ((why === 'maxWin' || why === 'cap') && failR && failR.maxStake >= 0.1) { var ms = Math.max(0.1, failR.maxStake); if (each) slip.forEach(function (z) { if (z.st == null || z.st > ms) z.st = ms; }); else { stake = ms; lsSet('oro_sp_stake', String(ms)); } }
    if (why === 'odds' && failR && Array.isArray(failR.odds)) failR.odds.forEach(function (o) { slip.forEach(function (z) { if (z.ev === o.ev && z.k === o.k && Math.abs(z.odd - o.odd) > 1e-9) { z.prev = z.odd; z.odd = +o.odd; z.chg = true; } }); }); // nouvelles cotes du serveur
    if ((why === 'odds' || why === 'closed' || why === 'susp') && slip.some(function (z) { return z.sb; })) await sbRefreshSlip();
    if (why === 'odds' || why === 'closed') { var l = await fetchList(); if (l) { lastList = events = l; lastJson = JSON.stringify(l); syncSlip(); } }
    if (view === 'slip') render();
    if (ctx.toast) ctx.toast((okBets.length ? fmt(x.partial, { ok: okBets.length, n: jobs.length }) + ' · ' : '') + (x['e_' + why] || NX()['e_' + why] || x.e_unavailable));
  }
  /* ==========================================================================================================
     2026-10-22 (étape 2) — PARIS AUTOMATIQUES (sb_lib.php, api.php sbList / sbMatch / sbCodeSave / sbCodeLoad) :
     FOOTBALL avant-match façon bet365 (sombre, dense, rapide, clair). Visible seulement quand sbList répond ok (admin, puis
     tout le monde quand le propriétaire allume « Public ») ; sinon Paris reste EXACTEMENT comme avant (onglets Paris / Mes paris).
     Onglets : Football · Actualité (l'ancienne liste spList, inchangée) · Mes paris. Football : Top / Aujourd'hui / Demain /
     Après-demain / ★ Favoris + recherche (équipe, championnat, pays) ; championnats par pays (drapeau), les grands d'abord,
     les autres repliés ; ligne de match = heure, équipes + logos, cotes 1 · X · 2, « +N » → page du match (tous les marchés
     en groupes repliables). Cotes qui bougent : vert ▲ / rouge ▼ (3 s). Choix : {ev:'sb:foot:<id>:<mk>', k, odd} ; un seul
     choix par match. Libellés traduits (12 langues) à partir de mk / k. CODE DE COUPON : « Partager / Code » dans le ticket,
     « Charger un code » (visiteur aussi), lien https://orolado.com/?code=XXXXXX qui ouvre Paris avec le ticket chargé.
     ========================================================================================================== */
  var SBK = ['foot', 'news', 'top', 'today', 'tomorrow', 'after', 'fav', 'search', 'noMatch', 'noFav', 'rules', 'gMain', 'gGoals', 'gHalf', 'gCs', 'gHcp', 'gCombo', 'gDef',
    'share', 'codeT', 'copy', 'copied', 'loadCode', 'load', 'codeBad', 'codeSkip', 'codeHidden', 'codeLoaded', 'valid7', 'codePh',
    'over', 'under', 'yes', 'no', 'odd', 'even', 'draw', 'h1', 'h2', 'eq',
    'm1x2', 'mdc', 'mdnb', 'mou', 'mbtts', 'mtt', 'moe', 'mcs0', 'mwn', 'meh', 'mah', 'mht1x2', 'mhtou', 'mhtbtts', 'm2h1x2', 'mhtft', 'mcs', 'mrbtts', 'mrou', 'meg', 'mhsh', 'loading', 'closedM',
    'mhtdc', 'm2hdc', 'm2hbtts', 'mhtcs', 'mhtoe', 'm2hoe', 'm2hou', 'mhttt', 'mhtah'];
  var SBL = {
    fr: ['Football', 'Actualité', 'Top', 'Aujourd’hui', 'Demain', 'Après-demain', 'Favoris', 'Rechercher', 'Aucun match pour ce choix.', 'Touche ☆ sur un championnat ou un match pour le retrouver ici.',
      'Règles : 90 min + arrêts de jeu (sans prolongation ni tirs au but) · paris fermés au coup d’envoi · match reporté et pas joué sous 48 h : remboursé.', 'Principaux', 'Buts', 'Mi-temps', 'Score exact', 'Handicap', 'Combinés', 'Défense',
      'Partager / Code', 'Code du coupon', 'Copier', 'Copié !', 'Charger un code', 'Charger', 'Code inconnu ou expiré.', '{n} choix ignoré(s) : match commencé ou fermé.', '{n} choix pas encore disponible(s) pour toi.', 'Coupon chargé : {n} choix.', 'Valable 7 jours · la cote du moment est prise au pari', 'Ex. : K7M2QX',
      'Plus de {x}', 'Moins de {x}', 'Oui', 'Non', 'Impair', 'Pair', 'Nul', '1re mi-temps', '2e mi-temps', 'Égalité',
      'Résultat du match', 'Double chance', 'Remboursé si nul', 'Total de buts', 'Les deux équipes marquent', 'Buts de {t}', 'Total de buts pair / impair', '{t} n’encaisse pas de but', '{t} gagne sans encaisser', 'Handicap (3 issues)', 'Handicap asiatique', 'Résultat à la mi-temps', '1re mi-temps : total de buts', '1re mi-temps : les deux marquent', 'Résultat de la 2e mi-temps', 'Mi-temps / fin du match', 'Score exact', 'Résultat + les deux marquent', 'Résultat + total de buts', 'Nombre exact de buts', 'Mi-temps avec le plus de buts', 'Un instant…', 'Paris fermés pour ce match.', '1re mi-temps : double chance', '2e mi-temps : double chance', '2e mi-temps : les deux marquent', '1re mi-temps : score exact', '1re mi-temps : buts pair / impair', '2e mi-temps : buts pair / impair', '2e mi-temps : total de buts', '1re mi-temps : buts de {t}', '1re mi-temps : handicap asiatique'],
    en: ['Football', 'News', 'Top', 'Today', 'Tomorrow', 'Day after', 'Favourites', 'Search', 'No match for this choice.', 'Tap ☆ on a league or a match to find it here.',
      'Rules: 90 min + stoppage time (no extra time or penalties) · betting closes at kick-off · match postponed and not played within 48 h: refunded.', 'Main', 'Goals', 'Halves', 'Correct score', 'Handicap', 'Combos', 'Defence',
      'Share / Code', 'Booking code', 'Copy', 'Copied!', 'Load a code', 'Load', 'Unknown or expired code.', '{n} pick(s) skipped: match started or closed.', '{n} pick(s) not available to you yet.', 'Slip loaded: {n} pick(s).', 'Valid 7 days · the current odds apply when you bet', 'E.g. K7M2QX',
      'Over {x}', 'Under {x}', 'Yes', 'No', 'Odd', 'Even', 'Draw', '1st half', '2nd half', 'Equal',
      'Match result', 'Double chance', 'Draw no bet', 'Total goals', 'Both teams to score', '{t} goals', 'Total goals odd / even', '{t} clean sheet', '{t} to win to nil', 'Handicap (3-way)', 'Asian handicap', 'Half-time result', '1st half: total goals', '1st half: both teams to score', '2nd half result', 'Half-time / full-time', 'Correct score', 'Result + both teams to score', 'Result + total goals', 'Exact total goals', 'Highest scoring half', 'One moment…', 'Betting closed for this match.', '1st half: double chance', '2nd half: double chance', '2nd half: both teams to score', '1st half: correct score', '1st half: goals odd / even', '2nd half: goals odd / even', '2nd half: total goals', '1st half: {t} goals', '1st half: Asian handicap'],
    es: ['Fútbol', 'Actualidad', 'Top', 'Hoy', 'Mañana', 'Pasado mañana', 'Favoritos', 'Buscar', 'Ningún partido para esta opción.', 'Toca ☆ en una liga o un partido para encontrarlo aquí.',
      'Reglas: 90 min + descuento (sin prórroga ni penaltis) · apuestas cerradas al inicio · partido aplazado y no jugado en 48 h: reembolso.', 'Principales', 'Goles', 'Mitades', 'Resultado exacto', 'Hándicap', 'Combinadas', 'Defensa',
      'Compartir / Código', 'Código de cupón', 'Copiar', '¡Copiado!', 'Cargar un código', 'Cargar', 'Código desconocido o caducado.', '{n} selección(es) omitida(s): partido empezado o cerrado.', '{n} selección(es) aún no disponible(s) para ti.', 'Cupón cargado: {n} selección(es).', 'Válido 7 días · se aplica la cuota del momento', 'Ej.: K7M2QX',
      'Más de {x}', 'Menos de {x}', 'Sí', 'No', 'Impar', 'Par', 'Empate', '1.ª parte', '2.ª parte', 'Igual',
      'Resultado del partido', 'Doble oportunidad', 'Empate no válido', 'Total de goles', 'Ambos equipos marcan', 'Goles de {t}', 'Total de goles par / impar', '{t} portería a cero', '{t} gana sin encajar', 'Hándicap (3 opciones)', 'Hándicap asiático', 'Resultado al descanso', '1.ª parte: total de goles', '1.ª parte: ambos marcan', 'Resultado 2.ª parte', 'Descanso / final', 'Resultado exacto', 'Resultado + ambos marcan', 'Resultado + total de goles', 'Número exacto de goles', 'Parte con más goles', 'Un momento…', 'Apuestas cerradas para este partido.', '1.ª parte: doble oportunidad', '2.ª parte: doble oportunidad', '2.ª parte: ambos marcan', '1.ª parte: resultado exacto', '1.ª parte: goles par / impar', '2.ª parte: goles par / impar', '2.ª parte: total de goles', '1.ª parte: goles de {t}', '1.ª parte: hándicap asiático'],
    pt: ['Futebol', 'Atualidade', 'Top', 'Hoje', 'Amanhã', 'Depois de amanhã', 'Favoritos', 'Pesquisar', 'Nenhum jogo para esta opção.', 'Toque em ☆ numa liga ou num jogo para encontrá-lo aqui.',
      'Regras: 90 min + acréscimos (sem prorrogação nem pênaltis) · apostas fechadas no início · jogo adiado e não disputado em 48 h: reembolso.', 'Principais', 'Gols', 'Tempos', 'Placar exato', 'Handicap', 'Combinadas', 'Defesa',
      'Partilhar / Código', 'Código do bilhete', 'Copiar', 'Copiado!', 'Carregar um código', 'Carregar', 'Código desconhecido ou expirado.', '{n} seleção(ões) ignorada(s): jogo iniciado ou fechado.', '{n} seleção(ões) ainda indisponível(is) para você.', 'Bilhete carregado: {n} seleção(ões).', 'Válido 7 dias · vale a odd do momento', 'Ex.: K7M2QX',
      'Mais de {x}', 'Menos de {x}', 'Sim', 'Não', 'Ímpar', 'Par', 'Empate', '1.º tempo', '2.º tempo', 'Igual',
      'Resultado do jogo', 'Dupla chance', 'Empate anula', 'Total de gols', 'Ambas marcam', 'Gols de {t}', 'Total de gols par / ímpar', '{t} não sofre gol', '{t} vence sem sofrer gol', 'Handicap (3 resultados)', 'Handicap asiático', 'Resultado ao intervalo', '1.º tempo: total de gols', '1.º tempo: ambas marcam', 'Resultado do 2.º tempo', 'Intervalo / final', 'Placar exato', 'Resultado + ambas marcam', 'Resultado + total de gols', 'Número exato de gols', 'Tempo com mais gols', 'Um momento…', 'Apostas fechadas para este jogo.', '1.º tempo: dupla chance', '2.º tempo: dupla chance', '2.º tempo: ambas marcam', '1.º tempo: placar exato', '1.º tempo: gols par / ímpar', '2.º tempo: gols par / ímpar', '2.º tempo: total de gols', '1.º tempo: gols de {t}', '1.º tempo: handicap asiático'],
    ar: ['كرة القدم', 'الأحداث', 'الأبرز', 'اليوم', 'غدًا', 'بعد غد', 'المفضلة', 'بحث', 'لا توجد مباراة لهذا الاختيار.', 'اضغط ☆ على دوري أو مباراة لتجدها هنا.',
      'القواعد: 90 دقيقة + الوقت بدل الضائع (بدون أشواط إضافية أو ركلات ترجيح) · تُغلق الرهانات عند انطلاق المباراة · مباراة مؤجلة ولم تُلعب خلال 48 ساعة: استرداد.', 'الرئيسية', 'الأهداف', 'الأشواط', 'النتيجة الصحيحة', 'الهانديكاب', 'مركّبة', 'الدفاع',
      'مشاركة / رمز', 'رمز القسيمة', 'نسخ', 'تم النسخ!', 'تحميل رمز', 'تحميل', 'رمز غير معروف أو منتهي.', 'تم تجاهل {n} اختيار: المباراة بدأت أو أُغلقت.', '{n} اختيار غير متاح لك بعد.', 'تم تحميل القسيمة: {n} اختيار.', 'صالح 7 أيام · تُطبّق الاحتمالات الحالية عند الرهان', 'مثال: K7M2QX',
      'أكثر من {x}', 'أقل من {x}', 'نعم', 'لا', 'فردي', 'زوجي', 'تعادل', 'الشوط الأول', 'الشوط الثاني', 'متساوٍ',
      'نتيجة المباراة', 'فرصة مزدوجة', 'التعادل يلغي الرهان', 'مجموع الأهداف', 'كلا الفريقين يسجل', 'أهداف {t}', 'مجموع الأهداف فردي / زوجي', '{t} بشباك نظيفة', '{t} يفوز بشباك نظيفة', 'هانديكاب (3 نتائج)', 'هانديكاب آسيوي', 'نتيجة الشوط الأول', 'الشوط الأول: مجموع الأهداف', 'الشوط الأول: كلا الفريقين يسجل', 'نتيجة الشوط الثاني', 'الشوط الأول / نهاية المباراة', 'النتيجة الصحيحة', 'النتيجة + كلا الفريقين يسجل', 'النتيجة + مجموع الأهداف', 'العدد الدقيق للأهداف', 'الشوط الأكثر أهدافًا', 'لحظة…', 'الرهانات مغلقة لهذه المباراة.', 'الشوط الأول: فرصة مزدوجة', 'الشوط الثاني: فرصة مزدوجة', 'الشوط الثاني: كلا الفريقين يسجل', 'الشوط الأول: النتيجة الصحيحة', 'الشوط الأول: أهداف فردي / زوجي', 'الشوط الثاني: أهداف فردي / زوجي', 'الشوط الثاني: مجموع الأهداف', 'الشوط الأول: أهداف {t}', 'الشوط الأول: هانديكاب آسيوي'],
    tr: ['Futbol', 'Gündem', 'Öne çıkan', 'Bugün', 'Yarın', 'Öbür gün', 'Favoriler', 'Ara', 'Bu seçim için maç yok.', 'Burada görmek için bir lig veya maçta ☆ simgesine dokun.',
      'Kurallar: 90 dk + uzatma dakikaları (uzatma devresi ve penaltı yok) · bahisler başlama düdüğünde kapanır · ertelenip 48 saatte oynanmayan maç: iade.', 'Ana', 'Goller', 'Devreler', 'Doğru skor', 'Handikap', 'Kombine', 'Savunma',
      'Paylaş / Kod', 'Kupon kodu', 'Kopyala', 'Kopyalandı!', 'Kod yükle', 'Yükle', 'Bilinmeyen veya süresi dolmuş kod.', '{n} seçim atlandı: maç başladı veya kapandı.', '{n} seçim henüz sana açık değil.', 'Kupon yüklendi: {n} seçim.', '7 gün geçerli · bahiste güncel oran geçerlidir', 'Örn.: K7M2QX',
      '{x} üst', '{x} alt', 'Evet', 'Hayır', 'Tek', 'Çift', 'Beraberlik', '1. yarı', '2. yarı', 'Eşit',
      'Maç sonucu', 'Çifte şans', 'Beraberlikte iade', 'Toplam gol', 'Karşılıklı gol', '{t} golleri', 'Toplam gol tek / çift', '{t} gol yemez', '{t} gol yemeden kazanır', 'Handikap (3 sonuç)', 'Asya handikapı', 'İlk yarı sonucu', '1. yarı: toplam gol', '1. yarı: karşılıklı gol', '2. yarı sonucu', 'İlk yarı / maç sonu', 'Doğru skor', 'Sonuç + karşılıklı gol', 'Sonuç + toplam gol', 'Tam gol sayısı', 'En çok gol olan yarı', 'Bir saniye…', 'Bu maç için bahisler kapandı.', '1. yarı: çifte şans', '2. yarı: çifte şans', '2. yarı: karşılıklı gol', '1. yarı: doğru skor', '1. yarı: gol tek / çift', '2. yarı: gol tek / çift', '2. yarı: toplam gol', '1. yarı: {t} golleri', '1. yarı: Asya handikapı'],
    vi: ['Bóng đá', 'Thời sự', 'Nổi bật', 'Hôm nay', 'Ngày mai', 'Ngày kia', 'Yêu thích', 'Tìm kiếm', 'Không có trận nào cho lựa chọn này.', 'Chạm ☆ trên một giải hoặc trận đấu để tìm lại ở đây.',
      'Luật: 90 phút + bù giờ (không tính hiệp phụ, luân lưu) · đóng cược khi bóng lăn · trận hoãn và không đá trong 48 giờ: hoàn tiền.', 'Chính', 'Bàn thắng', 'Hiệp', 'Tỷ số chính xác', 'Chấp', 'Kết hợp', 'Phòng ngự',
      'Chia sẻ / Mã', 'Mã phiếu cược', 'Sao chép', 'Đã sao chép!', 'Nhập mã', 'Tải', 'Mã không tồn tại hoặc đã hết hạn.', 'Bỏ qua {n} lựa chọn: trận đã bắt đầu hoặc đã đóng.', '{n} lựa chọn chưa mở cho bạn.', 'Đã tải phiếu: {n} lựa chọn.', 'Hiệu lực 7 ngày · áp dụng tỷ lệ hiện tại khi cược', 'VD: K7M2QX',
      'Tài {x}', 'Xỉu {x}', 'Có', 'Không', 'Lẻ', 'Chẵn', 'Hòa', 'Hiệp 1', 'Hiệp 2', 'Bằng nhau',
      'Kết quả trận', 'Cơ hội kép', 'Hòa hoàn tiền', 'Tổng bàn thắng', 'Cả hai đội ghi bàn', 'Bàn thắng của {t}', 'Tổng bàn chẵn / lẻ', '{t} giữ sạch lưới', '{t} thắng và sạch lưới', 'Chấp châu Âu (3 cửa)', 'Chấp châu Á', 'Kết quả hiệp 1', 'Hiệp 1: tổng bàn thắng', 'Hiệp 1: cả hai đội ghi bàn', 'Kết quả hiệp 2', 'Hiệp 1 / cả trận', 'Tỷ số chính xác', 'Kết quả + cả hai ghi bàn', 'Kết quả + tổng bàn', 'Số bàn thắng chính xác', 'Hiệp nhiều bàn hơn', 'Chờ chút…', 'Đã đóng cược trận này.', 'Hiệp 1: cơ hội kép', 'Hiệp 2: cơ hội kép', 'Hiệp 2: cả hai đội ghi bàn', 'Hiệp 1: tỷ số chính xác', 'Hiệp 1: bàn chẵn / lẻ', 'Hiệp 2: bàn chẵn / lẻ', 'Hiệp 2: tổng bàn thắng', 'Hiệp 1: bàn thắng của {t}', 'Hiệp 1: chấp châu Á'],
    id: ['Sepak bola', 'Aktual', 'Teratas', 'Hari ini', 'Besok', 'Lusa', 'Favorit', 'Cari', 'Tidak ada laga untuk pilihan ini.', 'Ketuk ☆ pada liga atau laga untuk menemukannya di sini.',
      'Aturan: 90 menit + injury time (tanpa perpanjangan & adu penalti) · taruhan ditutup saat kick-off · laga ditunda dan tidak dimainkan dalam 48 jam: uang kembali.', 'Utama', 'Gol', 'Babak', 'Skor tepat', 'Handicap', 'Kombinasi', 'Pertahanan',
      'Bagikan / Kode', 'Kode kupon', 'Salin', 'Disalin!', 'Muat kode', 'Muat', 'Kode tidak dikenal atau kedaluwarsa.', '{n} pilihan dilewati: laga sudah mulai atau ditutup.', '{n} pilihan belum tersedia untukmu.', 'Kupon dimuat: {n} pilihan.', 'Berlaku 7 hari · odds saat ini yang berlaku', 'Mis.: K7M2QX',
      'Over {x}', 'Under {x}', 'Ya', 'Tidak', 'Ganjil', 'Genap', 'Seri', 'Babak 1', 'Babak 2', 'Sama',
      'Hasil laga', 'Peluang ganda', 'Seri uang kembali', 'Total gol', 'Kedua tim mencetak gol', 'Gol {t}', 'Total gol ganjil / genap', '{t} tanpa kebobolan', '{t} menang tanpa kebobolan', 'Handicap (3 hasil)', 'Handicap Asia', 'Hasil babak 1', 'Babak 1: total gol', 'Babak 1: kedua tim cetak gol', 'Hasil babak 2', 'Babak 1 / akhir laga', 'Skor tepat', 'Hasil + kedua tim cetak gol', 'Hasil + total gol', 'Jumlah gol tepat', 'Babak dengan gol terbanyak', 'Sebentar…', 'Taruhan ditutup untuk laga ini.', 'Babak 1: peluang ganda', 'Babak 2: peluang ganda', 'Babak 2: kedua tim cetak gol', 'Babak 1: skor tepat', 'Babak 1: gol ganjil / genap', 'Babak 2: gol ganjil / genap', 'Babak 2: total gol', 'Babak 1: gol {t}', 'Babak 1: handicap Asia'],
    ru: ['Футбол', 'События', 'Топ', 'Сегодня', 'Завтра', 'Послезавтра', 'Избранное', 'Поиск', 'Нет матчей для этого выбора.', 'Нажмите ☆ у лиги или матча, чтобы найти его здесь.',
      'Правила: 90 мин + добавленное время (без овертайма и пенальти) · приём ставок до начала матча · матч перенесён и не сыгран за 48 ч: возврат.', 'Главные', 'Голы', 'Таймы', 'Точный счёт', 'Фора', 'Комбо', 'Защита',
      'Поделиться / Код', 'Код купона', 'Копировать', 'Скопировано!', 'Загрузить код', 'Загрузить', 'Неизвестный или истёкший код.', 'Пропущено выборов: {n} (матч начался или закрыт).', 'Пока недоступно для вас: {n}.', 'Купон загружен: {n}.', 'Действует 7 дней · при ставке берётся текущий коэффициент', 'Напр.: K7M2QX',
      'Больше {x}', 'Меньше {x}', 'Да', 'Нет', 'Нечёт', 'Чёт', 'Ничья', '1-й тайм', '2-й тайм', 'Поровну',
      'Исход матча', 'Двойной шанс', 'Ничья — возврат', 'Тотал голов', 'Обе забьют', 'Голы: {t}', 'Тотал чёт / нечёт', '{t} — сухой матч', '{t} победит всухую', 'Фора (3 исхода)', 'Азиатская фора', 'Исход 1-го тайма', '1-й тайм: тотал голов', '1-й тайм: обе забьют', 'Исход 2-го тайма', 'Тайм / матч', 'Точный счёт', 'Исход + обе забьют', 'Исход + тотал', 'Точное число голов', 'Самый результативный тайм', 'Минутку…', 'Ставки на этот матч закрыты.', '1-й тайм: двойной шанс', '2-й тайм: двойной шанс', '2-й тайм: обе забьют', '1-й тайм: точный счёт', '1-й тайм: тотал чёт / нечёт', '2-й тайм: тотал чёт / нечёт', '2-й тайм: тотал голов', '1-й тайм: голы: {t}', '1-й тайм: азиатская фора'],
    de: ['Fußball', 'Aktuelles', 'Top', 'Heute', 'Morgen', 'Übermorgen', 'Favoriten', 'Suchen', 'Kein Spiel für diese Auswahl.', 'Tippe ☆ bei einer Liga oder einem Spiel, um es hier zu finden.',
      'Regeln: 90 Min. + Nachspielzeit (ohne Verlängerung und Elfmeterschießen) · Wetten schließen beim Anpfiff · verlegtes Spiel, nicht binnen 48 Std. gespielt: Erstattung.', 'Haupt', 'Tore', 'Halbzeiten', 'Genaues Ergebnis', 'Handicap', 'Kombis', 'Defensive',
      'Teilen / Code', 'Wettschein-Code', 'Kopieren', 'Kopiert!', 'Code laden', 'Laden', 'Code unbekannt oder abgelaufen.', '{n} Tipp(s) übersprungen: Spiel begonnen oder geschlossen.', '{n} Tipp(s) für dich noch nicht verfügbar.', 'Wettschein geladen: {n} Tipp(s).', '7 Tage gültig · es gilt die aktuelle Quote', 'Z. B. K7M2QX',
      'Über {x}', 'Unter {x}', 'Ja', 'Nein', 'Ungerade', 'Gerade', 'Remis', '1. Halbzeit', '2. Halbzeit', 'Gleich',
      'Spielergebnis', 'Doppelte Chance', 'Remis = Erstattung', 'Tore gesamt', 'Beide Teams treffen', 'Tore {t}', 'Tore gerade / ungerade', '{t} ohne Gegentor', '{t} gewinnt zu null', 'Handicap (3-Weg)', 'Asiatisches Handicap', 'Halbzeitergebnis', '1. Halbzeit: Tore gesamt', '1. Halbzeit: beide treffen', 'Ergebnis 2. Halbzeit', 'Halbzeit / Endstand', 'Genaues Ergebnis', 'Ergebnis + beide treffen', 'Ergebnis + Tore gesamt', 'Genaue Toranzahl', 'Torreichste Halbzeit', 'Einen Moment…', 'Wetten für dieses Spiel geschlossen.', '1. Halbzeit: doppelte Chance', '2. Halbzeit: doppelte Chance', '2. Halbzeit: beide treffen', '1. Halbzeit: genaues Ergebnis', '1. Halbzeit: Tore gerade / ungerade', '2. Halbzeit: Tore gerade / ungerade', '2. Halbzeit: Tore gesamt', '1. Halbzeit: Tore {t}', '1. Halbzeit: asiatisches Handicap'],
    zh: ['足球', '热点', '热门', '今天', '明天', '后天', '收藏', '搜索', '此选项暂无比赛。', '点击联赛或比赛上的 ☆，即可在这里找到。',
      '规则：90 分钟 + 补时（不含加时和点球）· 开赛即停止投注 · 比赛延期且 48 小时内未进行：退款。', '主要', '进球', '半场', '正确比分', '让球', '组合', '防守',
      '分享 / 代码', '投注单代码', '复制', '已复制！', '载入代码', '载入', '代码不存在或已过期。', '已跳过 {n} 项：比赛已开始或已关闭。', '{n} 项暂未对你开放。', '投注单已载入：{n} 项。', '7 天有效 · 投注时按当前赔率', '例：K7M2QX',
      '大于 {x}', '小于 {x}', '是', '否', '单', '双', '平局', '上半场', '下半场', '相同',
      '全场赛果', '双重机会', '平局退款', '总进球', '双方进球', '{t} 进球数', '总进球单双', '{t} 零失球', '{t} 零封取胜', '让球（三项）', '亚洲让球', '半场赛果', '上半场：总进球', '上半场：双方进球', '下半场赛果', '半场 / 全场', '正确比分', '赛果 + 双方进球', '赛果 + 总进球', '准确进球数', '进球最多的半场', '请稍候…', '本场比赛已停止投注。', '上半场：双重机会', '下半场：双重机会', '下半场：双方进球', '上半场：正确比分', '上半场：进球单双', '下半场：进球单双', '下半场：总进球', '上半场：{t} 进球数', '上半场：亚洲让球'],
    hi: ['फ़ुटबॉल', 'ताज़ा', 'टॉप', 'आज', 'कल', 'परसों', 'पसंदीदा', 'खोजें', 'इस विकल्प के लिए कोई मैच नहीं।', 'यहाँ पाने के लिए लीग या मैच पर ☆ दबाएँ।',
      'नियम: 90 मिनट + इंजरी टाइम (एक्स्ट्रा टाइम और पेनल्टी नहीं) · किक-ऑफ़ पर दांव बंद · मैच टला और 48 घंटे में नहीं खेला गया: रिफंड।', 'मुख्य', 'गोल', 'हाफ़', 'सटीक स्कोर', 'हैंडीकैप', 'कॉम्बो', 'डिफ़ेंस',
      'शेयर / कोड', 'कूपन कोड', 'कॉपी', 'कॉपी हो गया!', 'कोड लोड करें', 'लोड', 'अज्ञात या समाप्त कोड।', '{n} चयन छोड़े गए: मैच शुरू या बंद।', '{n} चयन अभी आपके लिए उपलब्ध नहीं।', 'कूपन लोड हुआ: {n} चयन।', '7 दिन मान्य · दांव पर मौजूदा ऑड्स लागू', 'उदा.: K7M2QX',
      '{x} से ज़्यादा', '{x} से कम', 'हाँ', 'नहीं', 'विषम', 'सम', 'ड्रॉ', 'पहला हाफ़', 'दूसरा हाफ़', 'बराबर',
      'मैच का नतीजा', 'डबल चांस', 'ड्रॉ पर रिफंड', 'कुल गोल', 'दोनों टीमें गोल करेंगी', '{t} के गोल', 'कुल गोल सम / विषम', '{t} क्लीन शीट', '{t} बिना गोल खाए जीतेगी', 'हैंडीकैप (3 नतीजे)', 'एशियन हैंडीकैप', 'हाफ़-टाइम नतीजा', 'पहला हाफ़: कुल गोल', 'पहला हाफ़: दोनों गोल करेंगी', 'दूसरे हाफ़ का नतीजा', 'हाफ़-टाइम / फ़ुल-टाइम', 'सटीक स्कोर', 'नतीजा + दोनों गोल करेंगी', 'नतीजा + कुल गोल', 'सटीक गोल संख्या', 'सबसे ज़्यादा गोल वाला हाफ़', 'एक पल…', 'इस मैच पर दांव बंद हैं।', 'पहला हाफ़: डबल चांस', 'दूसरा हाफ़: डबल चांस', 'दूसरा हाफ़: दोनों गोल करेंगी', 'पहला हाफ़: सटीक स्कोर', 'पहला हाफ़: गोल सम / विषम', 'दूसरा हाफ़: गोल सम / विषम', 'दूसरा हाफ़: कुल गोल', 'पहला हाफ़: {t} के गोल', 'पहला हाफ़: एशियन हैंडीकैप']
  };
  function SX() { var a = SBL[lg()] || SBL.en, o = {}; SBK.forEach(function (k, i) { o[k] = a[i] != null ? a[i] : SBL.en[i]; }); return o; }
  var SBIC = {
    news: '<svg class="sp-ico" viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="5" width="14" height="14.5" rx="2" fill="#E2E8F0"/><path d="M17.5 9h3v8.5a2 2 0 0 1-2 2h-1z" fill="#94A3B8"/><rect x="6" y="7.6" width="9" height="3.4" rx=".8" fill="#EF4444"/><path d="M6 13.4h9M6 16.4h6" stroke="#475569" stroke-width="1.4" stroke-linecap="round"/></svg>',
    search: '<svg class="sp2-i" viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/></svg>',
    tick: '<svg class="sp2-i" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8.5h16v3a2 2 0 0 0 0 4v3H4v-3a2 2 0 0 0 0-4z"/><path d="M10 8.5v10" stroke-dasharray="2 2"/></svg>',
    share: '<svg class="sp2-i" viewBox="0 0 24 24" aria-hidden="true"><circle cx="17.5" cy="5.5" r="2.5"/><circle cx="6.5" cy="12" r="2.5"/><circle cx="17.5" cy="18.5" r="2.5"/><path d="M8.7 10.8l6.6-4M8.7 13.2l6.6 4"/></svg>',
    chev: '<svg class="sp2-i" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 10l4 4 4-4"/></svg>',
    wa: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2.5a9.4 9.4 0 0 0-8.1 14.2L2.6 21.5l4.9-1.3A9.4 9.4 0 1 0 12 2.5zm5.5 13.3c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .1-3.3-.8-2.7-1.1-4.5-3.9-4.6-4.1-.1-.2-1.1-1.5-1.1-2.8s.7-2 1-2.3c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.2.1.4 0 .5l-.3.5-.4.4c-.1.1-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.3 2.4 1.5.3.1.5.1.6-.1l.9-1.1c.2-.3.4-.2.6-.1l1.9.9c.3.1.5.2.5.3.1.2.1.7-.1 1.2z"/></svg>'
  };
  /* 2026-10-22 — PARIS v2 : petits textes de la nouvelle interface (barre du bas, direct, résultats…), 12 langues */
  var NBK = ['nHome', 'nLive', 'nSlip', 'nMine', 'nMenu', 'live', 'seeAll', 'soon', 'topM', 'allM', 'inX', 'hour', 'fromH', 'startsIn', 'ht', 'ft', 'goal', 'red', 'endM',
    'tEv', 'tSt', 'noEv', 'noLive', 'susp', 'e_susp', 'share', 'code', 'back', 'sports', 'rulesT', 'liveWait', 'poss', 'shots', 'shotsOn', 'corners', 'yellow', 'reds', 'attacks',
    'dangerous', 'pen', 'og', 'var', 'sub', 'kick', 'results', 'yday', 'dbef', 'htS', 'noRes', 'guestMineS', 'ftS'];
  var NBL = {
    fr: ['Populaire', 'Direct', 'Coupon', 'Mes paris', 'Menu', 'En direct', 'Tout voir', 'Commence bientôt', 'Top matchs', 'Tous les matchs', 'Dans {x}', 'Heure', 'Dès {h}', 'Commence dans', 'Mi-temps', 'Terminé', 'BUT !', 'Carton rouge', 'Fin du match',
      'Événements', 'Statistiques', 'Pas encore d’événement.', 'Aucun match en direct pour l’instant.', 'Suspendu', 'Cotes suspendues (but ou action en cours) : réessaie dans un instant.', 'Partager le code', 'Code', 'Retour', 'Sports', 'Règles', 'Validation en direct…',
      'Possession', 'Tirs', 'Tirs cadrés', 'Corners', 'Cartons jaunes', 'Cartons rouges', 'Attaques', 'Attaques dangereuses', 'pen.', 'c.s.c.', 'VAR', 'Remplacement', 'Coup d’envoi', 'Résultats', 'Hier', 'Avant-hier', 'MT', 'Aucun résultat pour ce jour.',
      'Inscris-toi pour parier et retrouver tes paris ici.', 'Fin'],
    en: ['Popular', 'Live', 'Bet slip', 'My bets', 'Menu', 'Live now', 'See all', 'Starting soon', 'Top matches', 'All matches', 'In {x}', 'Hour', 'From {h}', 'Starts in', 'Half-time', 'Finished', 'GOAL!', 'Red card', 'Full time',
      'Events', 'Statistics', 'No event yet.', 'No live match right now.', 'Suspended', 'Odds suspended (goal or action in progress): try again in a moment.', 'Share code', 'Code', 'Back', 'Sports', 'Rules', 'Live check…',
      'Possession', 'Shots', 'Shots on target', 'Corners', 'Yellow cards', 'Red cards', 'Attacks', 'Dangerous attacks', 'pen.', 'o.g.', 'VAR', 'Substitution', 'Kick-off', 'Results', 'Yesterday', '2 days ago', 'HT', 'No result for this day.',
      'Sign up to bet and find your bets here.', 'FT'],
    es: ['Popular', 'En vivo', 'Boleto', 'Mis apuestas', 'Menú', 'En vivo ahora', 'Ver todo', 'Empieza pronto', 'Partidos top', 'Todos los partidos', 'En {x}', 'Hora', 'Desde {h}', 'Empieza en', 'Descanso', 'Terminado', '¡GOL!', 'Tarjeta roja', 'Final del partido',
      'Eventos', 'Estadísticas', 'Aún no hay eventos.', 'Ningún partido en vivo ahora.', 'Suspendido', 'Cuotas suspendidas (gol o jugada en curso): inténtalo en un momento.', 'Compartir código', 'Código', 'Volver', 'Deportes', 'Reglas', 'Validación en vivo…',
      'Posesión', 'Tiros', 'Tiros a puerta', 'Córners', 'Tarjetas amarillas', 'Tarjetas rojas', 'Ataques', 'Ataques peligrosos', 'pen.', 'p.p.', 'VAR', 'Cambio', 'Saque inicial', 'Resultados', 'Ayer', 'Anteayer', 'Desc.', 'Ningún resultado para este día.',
      'Regístrate para apostar y ver tus apuestas aquí.', 'Fin'],
    pt: ['Popular', 'Ao vivo', 'Bilhete', 'Minhas apostas', 'Menu', 'Ao vivo agora', 'Ver tudo', 'Começa em breve', 'Jogos top', 'Todos os jogos', 'Em {x}', 'Hora', 'A partir das {h}', 'Começa em', 'Intervalo', 'Encerrado', 'GOL!', 'Cartão vermelho', 'Fim de jogo',
      'Eventos', 'Estatísticas', 'Ainda sem eventos.', 'Nenhum jogo ao vivo agora.', 'Suspenso', 'Odds suspensas (gol ou lance em andamento): tente de novo em instantes.', 'Partilhar código', 'Código', 'Voltar', 'Esportes', 'Regras', 'Validação ao vivo…',
      'Posse de bola', 'Chutes', 'Chutes no gol', 'Escanteios', 'Cartões amarelos', 'Cartões vermelhos', 'Ataques', 'Ataques perigosos', 'pên.', 'g.c.', 'VAR', 'Substituição', 'Pontapé inicial', 'Resultados', 'Ontem', 'Anteontem', 'Int.', 'Nenhum resultado para este dia.',
      'Cadastre-se para apostar e ver suas apostas aqui.', 'Fim'],
    ar: ['الأكثر شعبية', 'مباشر', 'القسيمة', 'رهاناتي', 'القائمة', 'مباشر الآن', 'عرض الكل', 'تبدأ قريبًا', 'أبرز المباريات', 'كل المباريات', 'خلال {x}', 'الساعة', 'من {h}', 'تبدأ خلال', 'استراحة', 'انتهت', 'هدف!', 'بطاقة حمراء', 'نهاية المباراة',
      'الأحداث', 'الإحصائيات', 'لا أحداث بعد.', 'لا توجد مباراة مباشرة الآن.', 'معلّق', 'الاحتمالات معلّقة (هدف أو هجمة جارية): أعد المحاولة بعد لحظة.', 'مشاركة الرمز', 'الرمز', 'رجوع', 'الرياضات', 'القواعد', 'تحقق مباشر…',
      'الاستحواذ', 'التسديدات', 'تسديدات على المرمى', 'الركنيات', 'بطاقات صفراء', 'بطاقات حمراء', 'الهجمات', 'هجمات خطيرة', 'جزاء', 'عكسي', 'VAR', 'تبديل', 'انطلاق المباراة', 'النتائج', 'أمس', 'أول أمس', 'ش1', 'لا توجد نتائج لهذا اليوم.',
      'سجّل لتراهن وتجد رهاناتك هنا.', 'انتهت'],
    tr: ['Popüler', 'Canlı', 'Kupon', 'Bahislerim', 'Menü', 'Şimdi canlı', 'Tümünü gör', 'Yakında başlıyor', 'Önemli maçlar', 'Tüm maçlar', '{x} içinde', 'Saat', '{h} sonrası', 'Başlamasına', 'Devre arası', 'Bitti', 'GOL!', 'Kırmızı kart', 'Maç sonu',
      'Olaylar', 'İstatistikler', 'Henüz olay yok.', 'Şu an canlı maç yok.', 'Askıda', 'Oranlar askıda (gol veya pozisyon var): birazdan tekrar dene.', 'Kodu paylaş', 'Kod', 'Geri', 'Sporlar', 'Kurallar', 'Canlı kontrol…',
      'Topla oynama', 'Şut', 'İsabetli şut', 'Korner', 'Sarı kart', 'Kırmızı kart', 'Atak', 'Tehlikeli atak', 'pen.', 'k.k.', 'VAR', 'Oyuncu değişikliği', 'Başlama', 'Sonuçlar', 'Dün', 'Önceki gün', 'İY', 'Bu gün için sonuç yok.',
      'Bahis yapmak ve bahislerini burada görmek için kaydol.', 'MS'],
    vi: ['Phổ biến', 'Trực tiếp', 'Phiếu cược', 'Cược của tôi', 'Menu', 'Đang diễn ra', 'Xem tất cả', 'Sắp bắt đầu', 'Trận nổi bật', 'Tất cả trận', 'Trong {x}', 'Giờ', 'Từ {h}', 'Bắt đầu sau', 'Nghỉ giữa hiệp', 'Kết thúc', 'VÀO!', 'Thẻ đỏ', 'Hết trận',
      'Diễn biến', 'Thống kê', 'Chưa có diễn biến.', 'Hiện không có trận trực tiếp.', 'Tạm khóa', 'Tỷ lệ tạm khóa (có bàn thắng hoặc tình huống): thử lại sau giây lát.', 'Chia sẻ mã', 'Mã', 'Quay lại', 'Môn thể thao', 'Luật', 'Đang xác nhận…',
      'Kiểm soát bóng', 'Sút', 'Sút trúng đích', 'Phạt góc', 'Thẻ vàng', 'Thẻ đỏ', 'Tấn công', 'Tấn công nguy hiểm', 'pen', 'phản lưới', 'VAR', 'Thay người', 'Giờ bóng lăn', 'Kết quả', 'Hôm qua', 'Hôm kia', 'H1', 'Không có kết quả cho ngày này.',
      'Đăng ký để đặt cược và xem cược của bạn tại đây.', 'KT'],
    id: ['Populer', 'Live', 'Kupon', 'Taruhanku', 'Menu', 'Live sekarang', 'Lihat semua', 'Segera dimulai', 'Laga top', 'Semua laga', 'Dalam {x}', 'Jam', 'Mulai {h}', 'Mulai dalam', 'Turun minum', 'Selesai', 'GOL!', 'Kartu merah', 'Laga selesai',
      'Kejadian', 'Statistik', 'Belum ada kejadian.', 'Tidak ada laga live saat ini.', 'Ditangguhkan', 'Odds ditangguhkan (gol atau aksi berlangsung): coba lagi sebentar.', 'Bagikan kode', 'Kode', 'Kembali', 'Olahraga', 'Aturan', 'Validasi live…',
      'Penguasaan bola', 'Tembakan', 'Tepat sasaran', 'Sepak pojok', 'Kartu kuning', 'Kartu merah', 'Serangan', 'Serangan berbahaya', 'pen.', 'b.d.', 'VAR', 'Pergantian', 'Kick-off', 'Hasil', 'Kemarin', 'Kemarin lusa', 'Bbk 1', 'Tidak ada hasil untuk hari ini.',
      'Daftar untuk bertaruh dan melihat taruhanmu di sini.', 'Sls'],
    ru: ['Популярное', 'Live', 'Купон', 'Мои ставки', 'Меню', 'Сейчас в эфире', 'Все', 'Скоро начало', 'Топ-матчи', 'Все матчи', 'Через {x}', 'Час', 'С {h}', 'Начало через', 'Перерыв', 'Завершён', 'ГОЛ!', 'Красная карточка', 'Конец матча',
      'События', 'Статистика', 'Пока нет событий.', 'Сейчас нет матчей в эфире.', 'Приостановлено', 'Коэффициенты приостановлены (гол или опасный момент): попробуйте чуть позже.', 'Поделиться кодом', 'Код', 'Назад', 'Виды спорта', 'Правила', 'Проверка live…',
      'Владение', 'Удары', 'Удары в створ', 'Угловые', 'Жёлтые карточки', 'Красные карточки', 'Атаки', 'Опасные атаки', 'пен.', 'автогол', 'VAR', 'Замена', 'Начало матча', 'Результаты', 'Вчера', 'Позавчера', '1-й т.', 'Нет результатов за этот день.',
      'Зарегистрируйтесь, чтобы делать ставки и видеть их здесь.', 'Кон.'],
    de: ['Beliebt', 'Live', 'Wettschein', 'Meine Wetten', 'Menü', 'Jetzt live', 'Alle', 'Beginnt bald', 'Top-Spiele', 'Alle Spiele', 'In {x}', 'Uhrzeit', 'Ab {h}', 'Beginnt in', 'Halbzeit', 'Beendet', 'TOR!', 'Rote Karte', 'Spielende',
      'Ereignisse', 'Statistiken', 'Noch keine Ereignisse.', 'Gerade kein Live-Spiel.', 'Gesperrt', 'Quoten gesperrt (Tor oder Aktion läuft): gleich noch einmal versuchen.', 'Code teilen', 'Code', 'Zurück', 'Sportarten', 'Regeln', 'Live-Prüfung…',
      'Ballbesitz', 'Schüsse', 'Schüsse aufs Tor', 'Ecken', 'Gelbe Karten', 'Rote Karten', 'Angriffe', 'Gefährliche Angriffe', 'Elfm.', 'ET', 'VAR', 'Wechsel', 'Anstoß', 'Ergebnisse', 'Gestern', 'Vorgestern', 'HZ', 'Keine Ergebnisse für diesen Tag.',
      'Registriere dich, um zu wetten und deine Wetten hier zu sehen.', 'Ende'],
    zh: ['热门', '直播', '投注单', '我的投注', '菜单', '正在直播', '查看全部', '即将开始', '焦点赛事', '全部比赛', '{x}内', '时间', '{h} 起', '距开赛', '中场休息', '已结束', '进球！', '红牌', '全场结束',
      '事件', '技术统计', '暂无事件。', '当前没有直播比赛。', '暂停', '赔率暂停（进球或进攻中）：请稍后再试。', '分享代码', '代码', '返回', '运动项目', '规则', '直播确认中…',
      '控球率', '射门', '射正', '角球', '黄牌', '红牌', '进攻', '危险进攻', '点球', '乌龙', 'VAR', '换人', '开球', '赛果', '昨天', '前天', '半场', '这一天没有赛果。',
      '注册后即可投注，并在这里查看你的投注。', '完场'],
    hi: ['लोकप्रिय', 'लाइव', 'कूपन', 'मेरे दांव', 'मेनू', 'अभी लाइव', 'सभी देखें', 'जल्द शुरू', 'टॉप मैच', 'सभी मैच', '{x} में', 'समय', '{h} से', 'शुरू होने में', 'हाफ़-टाइम', 'समाप्त', 'गोल!', 'लाल कार्ड', 'मैच समाप्त',
      'घटनाएँ', 'आँकड़े', 'अभी कोई घटना नहीं।', 'अभी कोई लाइव मैच नहीं।', 'निलंबित', 'ऑड्स निलंबित (गोल या हमला जारी): थोड़ी देर में फिर कोशिश करें।', 'कोड शेयर करें', 'कोड', 'वापस', 'खेल', 'नियम', 'लाइव जाँच…',
      'कब्ज़ा', 'शॉट', 'निशाने पर शॉट', 'कॉर्नर', 'पीले कार्ड', 'लाल कार्ड', 'हमले', 'ख़तरनाक हमले', 'पेन.', 'आत्मघाती', 'VAR', 'बदलाव', 'किक-ऑफ़', 'नतीजे', 'कल', 'परसों', 'हाफ़', 'इस दिन का कोई नतीजा नहीं।',
      'दांव लगाने और अपने दांव यहाँ देखने के लिए साइन अप करें।', 'ख़त्म']
  };
  function NX() { var a = NBL[lg()] || NBL.en, o = {}; NBK.forEach(function (k, i) { o[k] = a[i] != null ? a[i] : NBL.en[i]; }); return o; }
  // noms des sports (le serveur envoie un code : foot, basket, hockey…)
  var SPN = {
    basket: { fr: 'Basket', en: 'Basketball', es: 'Baloncesto', pt: 'Basquete', ar: 'كرة السلة', tr: 'Basketbol', vi: 'Bóng rổ', id: 'Bola basket', ru: 'Баскетбол', de: 'Basketball', zh: '篮球', hi: 'बास्केटबॉल' },
    hockey: { fr: 'Hockey', en: 'Ice hockey', es: 'Hockey', pt: 'Hóquei', ar: 'هوكي الجليد', tr: 'Buz hokeyi', vi: 'Khúc côn cầu', id: 'Hoki es', ru: 'Хоккей', de: 'Eishockey', zh: '冰球', hi: 'आइस हॉकी' },
    handball: { fr: 'Handball', en: 'Handball', es: 'Balonmano', pt: 'Handebol', ar: 'كرة اليد', tr: 'Hentbol', vi: 'Bóng ném', id: 'Bola tangan', ru: 'Гандбол', de: 'Handball', zh: '手球', hi: 'हैंडबॉल' },
    volley: { fr: 'Volley', en: 'Volleyball', es: 'Voleibol', pt: 'Vôlei', ar: 'الكرة الطائرة', tr: 'Voleybol', vi: 'Bóng chuyền', id: 'Bola voli', ru: 'Волейбол', de: 'Volleyball', zh: '排球', hi: 'वॉलीबॉल' },
    rugby: { fr: 'Rugby', en: 'Rugby', es: 'Rugby', pt: 'Rúgbi', ar: 'الرغبي', tr: 'Ragbi', vi: 'Bóng bầu dục', id: 'Rugbi', ru: 'Регби', de: 'Rugby', zh: '橄榄球', hi: 'रग्बी' },
    baseball: { fr: 'Baseball', en: 'Baseball', es: 'Béisbol', pt: 'Beisebol', ar: 'البيسبول', tr: 'Beyzbol', vi: 'Bóng chày', id: 'Bisbol', ru: 'Бейсбол', de: 'Baseball', zh: '棒球', hi: 'बेसबॉल' }
  };
  SPN.basketball = SPN.basket; SPN.volleyball = SPN.volley;
  // 2026-10-22 : textes des autres sports (12 langues) dans js/i18n-src.js (clés sb*) ; repli anglais si la traduction manque
  function T18(k, fb) { try { var v = D6.I18N && D6.I18N.t ? D6.I18N.t(k) : ''; return v && v !== k ? v : fb; } catch (e) { return fb; } }
  var SPN18 = { amfoot: ['sbSpAmfoot', 'Am. football'], afl: ['sbSpAfl', 'AFL'], mma: ['sbSpMma', 'MMA'] };
  function spName(s) { if (s.s === 'foot') return SX().foot; if (SPN18[s.s]) return T18(SPN18[s.s][0], SPN18[s.s][1]); var t = SPN[s.s]; return (t && (t[lg()] || t.en)) || s.n || s.s; }
  function spIco(s) { s = s === 'basketball' ? 'basket' : s === 'volleyball' ? 'volley' : s; return SICO[s] && !EVK[s] ? s : 'autre'; }
  // sport d'un match / choix / pari : « basket:7001 », « sb:basket:7001:12 », {sp}, {fx} ; football par défaut
  function spOf(o) {
    if (!o) return 'foot';
    if (typeof o === 'string') { var m = /^(?:sb:)?([a-z]+):\d/.exec(o); return m ? m[1] : 'foot'; }
    return o.sp || spOf(o.fx || o.id || o.ev || '');
  }
  function sbToast(m, k) { if (ctx && ctx.toast) ctx.toast(m, k || 'info'); else if (D6.App && D6.App.toast) D6.App.toast(m, k || 'info'); }
  function favs() { try { var f = JSON.parse(localStorage.getItem('oro_sb_fav') || '{}') || {}; return { l: Array.isArray(f.l) ? f.l : [], f: Array.isArray(f.f) ? f.f : [] }; } catch (e) { return { l: [], f: [] }; } }
  function favToggle(kind, id) {
    var f = favs(), a = f[kind], i = a.indexOf(id);
    if (i > -1) a.splice(i, 1); else { a.push(id); if (a.length > 300) a.shift(); }
    try { localStorage.setItem('oro_sb_fav', JSON.stringify(f)); } catch (e) { /* ignore */ }
    return i < 0;
  }
  function tzMin() { return -new Date().getTimezoneOffset(); }
  // ---------- libellés des marchés (12 langues) à partir de mk / k ----------
  function numL(v) { var n = Number(v); return isFinite(n) ? n.toLocaleString(loc(), { maximumFractionDigits: 2 }) : String(v); }
  function sgn(v) { var n = Number(v); return (n > 0 ? '+' : n < 0 ? '−' : '') + numL(Math.abs(n)); }
  function mkParts(mk) { mk = String(mk || ''); var i = mk.indexOf(':'); return i < 0 ? [mk, ''] : [mk.slice(0, i), mk.slice(i + 1)]; }
  function sbMkName(mk, h, a, sp) {
    var x = SX(), f = mkParts(mk)[0];
    if (sp && sp !== 'foot') { // autres sports : 12 (prolongation comprise), 1x2 (temps réglementaire), total, handicap
      if (f === '12') return sp === 'mma' ? T18('sbM12mma', 'Fight winner') : T18('sbM12', 'Winner (incl. overtime)');
      if (f === '1x2') return T18('sbM1x2reg', '1X2 (regular time)');
      if (f === 'ou') return sp === 'baseball' ? T18('sbMtotRuns', 'Total runs') : sp === 'hockey' || sp === 'handball' ? T18('sbMtotGoals', 'Total goals') : T18('sbMtotPts', 'Total points');
      if (f === 'ah') return sp === 'volley' ? T18('sbMhcpSets', 'Set handicap') : T18('sbMhcp', 'Handicap');
    }
    var N = { '1x2': x.m1x2, dc: x.mdc, dnb: x.mdnb, ou: x.mou, btts: x.mbtts, tth: fmt(x.mtt, { t: h }), tta: fmt(x.mtt, { t: a }), oe: x.moe, csh: fmt(x.mcs0, { t: h }), csa: fmt(x.mcs0, { t: a }),
      wnh: fmt(x.mwn, { t: h }), wna: fmt(x.mwn, { t: a }), eh: x.meh, ah: x.mah, ht1x2: x.mht1x2, htou: x.mhtou, htbtts: x.mhtbtts, '2h1x2': x.m2h1x2, htft: x.mhtft, cs: x.mcs, rbtts: x.mrbtts, rou: x.mrou, eg: x.meg, hsh: x.mhsh,
      htdc: x.mhtdc, '2hdc': x.m2hdc, '2hbtts': x.m2hbtts, htcs: x.mhtcs, htoe: x.mhtoe, '2hoe': x.m2hoe, '2hou': x.m2hou, httth: fmt(x.mhttt, { t: h }), httta: fmt(x.mhttt, { t: a }), htah: x.mhtah };
    return N[f] || String(mk);
  }
  function sbOutL(mk, k, h, a) {
    var x = SX(), p = mkParts(mk), f = p[0], ln = p[1], q;
    var one = function (c) { return c === 'H' ? h : c === 'A' ? a : c === 'D' ? x.draw : c; };
    var ou = function (c) { return fmt(c === 'O' ? x.over : x.under, { x: numL(ln) }); };
    var yn = function (c) { return c === 'Y' ? x.yes : x.no; };
    k = String(k);
    switch (f) {
      case '1x2': case 'ht1x2': case '2h1x2': case 'dnb': case '12': return one(k);
      case 'eh': return (k === 'D' ? x.draw : one(k)) + ' (' + sgn(k === 'A' ? -ln : +ln) + ')';
      case 'ah': case 'htah': return one(k) + ' ' + sgn(k === 'A' ? -ln : +ln);
      case 'dc': case 'htdc': case '2hdc': return { HD: h + ' / ' + x.draw, HA: h + ' / ' + a, DA: x.draw + ' / ' + a }[k] || k;
      case 'ou': case 'tth': case 'tta': case 'htou': case '2hou': case 'httth': case 'httta': return ou(k);
      case 'oe': case 'htoe': case '2hoe': return k === 'O' ? x.odd : x.even;
      case 'btts': case 'htbtts': case '2hbtts': case 'csh': case 'csa': case 'wnh': case 'wna': return yn(k);
      case 'htcs': return k.replace(':', ' - ');
      case 'htft': q = k.split('/'); return q.length === 2 ? one(q[0]) + ' / ' + one(q[1]) : k;
      case 'rbtts': q = k.split('/'); return q.length === 2 ? one(q[0]) + ' + ' + yn(q[1]) : k;
      case 'rou': q = k.split('/'); return q.length === 2 ? one(q[0]) + ' + ' + ou(q[1]) : k;
      case 'cs': return k.replace(':', ' - ');
      case 'hsh': return k === '1' ? x.h1 : k === '2' ? x.h2 : x.eq;
    }
    return k;
  }
  function sep() { return lg() === 'fr' ? ' : ' : ': '; }
  // choix d'un pari (Mes paris, reçus, ticket) : traduit si mk / k sont là, sinon l'ancien libellé (inchangé)
  function selLbl(s) {
    if (s && s.mk) { var tm = teams(s.t) || [s.t, ''], sp = spOf(s), f = mkParts(s.mk)[0]; var o = sbOutL(s.mk, s.k, tm[0], tm[1]); return (f === '1x2' && sp === 'foot') || f === '12' ? o : sbMkName(s.mk, tm[0], tm[1], sp) + sep() + o; }
    return trO(s ? s.l : '');
  }

  // ---------- dates : « Aujourd'hui · jeu. 22 oct. », heures locales du joueur ----------
  // heure locale du joueur sur 24 h (« 20:45 », jamais « 08:45 PM » qui ne tient pas dans la colonne)
  function hm24(t) { try { return new Date(t * 1000).toLocaleTimeString(loc(), { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }); } catch (e) { return hm(t); } }
  function dshort(t) { return new Date(t * 1000).toLocaleDateString(loc(), { weekday: 'short', day: 'numeric', month: 'short' }); }
  function dayHead(t) {
    var x = SX(), d = new Date(t * 1000), n = new Date(), k = Math.round((new Date(d.getFullYear(), d.getMonth(), d.getDate()) - new Date(n.getFullYear(), n.getMonth(), n.getDate())) / 86400000);
    var rel = k === 0 ? x.today : k === 1 ? x.tomorrow : k === 2 ? x.after : '';
    return rel ? rel + ' · ' + dshort(t) : cap1(dshort(t));
  }
  function logoImg(u, cls) { return u && /^https:\/\//.test(u) ? '<img class="' + cls + '" src="' + esc(u) + '" alt="" loading="lazy" decoding="async" onerror="this.style.visibility=\'hidden\'">' : '<i class="' + cls + ' sb-nolo"></i>'; }
  function normS(s) { try { return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase(); } catch (e) { return String(s || '').toLowerCase(); } }
  // ---------- code de coupon ----------
  function slipSig() { return slip.map(function (s) { return s.ev + '|' + s.k; }).join(','); }
  function codeLink(c) { return 'https://orolado.com/?code=' + c; }
  /* ======================================================================================================================
     2026-10-22 (propriétaire : « quand on touche Paris, ça doit ouvrir un MONDE : un vrai site de paris, calme, simple, pro »)
     PARIS v2 — barre du bas comme les grandes applis : Populaire · Direct · Coupon (au centre) · Mes paris · Menu.
     Populaire : sports, périodes (dans 30 min, 1 h, 2 h, 3 h, aujourd'hui, demain, après-demain, heure), recherche, direct,
     « commence bientôt », grands championnats (repliables). Page d'un match : en-tête (équipes, heure + compte à rebours ;
     en direct : score, minute, statistiques, événements, bandeaux « BUT ! »), marchés par groupes, cartes repliables,
     1 · X · 2 toujours sur UNE ligne. Les cotes changent SUR PLACE (vert ▲ / rouge ▼), rien ne saute, la page garde sa
     position. JAMAIS un match sans cotes. Chaque écran a son retour (flèche ‹, bouton retour du téléphone). Visiteur :
     tout se visite comme un membre (coupon compris) ; seul « Placer le pari » / « Mes paris » demande l'inscription.
     ====================================================================================================================== */
  var view = 'home', mineCache = null;
  var sbOn = null, liveOn = null, liveCnt = -1, sbSports = [], sport = 'foot', per = 'all', hourF = -1, sbQ = '', sbData = {}, sbOpen = {};
  var sbMid = '', sbM = null, mGrp = 'main', mkOpen = {}, trkTab = '', matchFrom = 'home', slipFrom = 'home', resDay = 0, resData = {};
  var liveData = null, livePend = null, scrollMem = {}, sbCode = null, pendCode = '';
  function lv() { return 'home'; }
  function mbox() { return box ? box.closest('.modal-box') : null; }
  function alive() {
    if (!box || !box.isConnected || !box.classList.contains('sp2')) return false;
    var m = box.closest('#casinoModal'); return !m || m.classList.contains('active');
  }
  function hasQ() { return events.some(function (e) { return isQev(e) && !e.pred; }); } // (les prédictions Predict ont leur propre puce)
  function liveShown() { return liveOn === true || (liveOn === null && liveCnt > 0); }
  function liveFx() { return liveData ? (liveData.r.fx || []).filter(function (f) { return f.o && f.o.o && f.o.o.length; }) : []; }
  function liveN() { return liveData ? liveFx().filter(function (f) { return !f.end; }).length : Math.max(0, liveCnt); }

  // ---------- coque de la page : contenu + barre du bas ----------
  var NAVI = {
    home: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.8c.7 3.2-1.4 5-2.9 6.8C7.7 11.2 7 12.6 7 14.4a5 5 0 0 0 10 0c0-2.3-1.3-3.9-2.2-4.9-.3 1.4-1 2.2-1.9 2.5.5-2.9.3-6.5-.9-9.2z"/></svg>',
    live: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="2.6"/><path d="M8.2 8.2a5.4 5.4 0 0 0 0 7.6M15.8 8.2a5.4 5.4 0 0 1 0 7.6M5.3 5.3a9.5 9.5 0 0 0 0 13.4M18.7 5.3a9.5 9.5 0 0 1 0 13.4"/></svg>',
    slip: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7.5h16v3a1.8 1.8 0 0 0 0 3.6v3H4v-3a1.8 1.8 0 0 0 0-3.6z"/><path d="M9.5 7.5v9.6" stroke-dasharray="1.8 1.8"/></svg>',
    mine: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3"/><path d="M4.5 4.5v3h3"/><path d="M12 8v4.2l2.8 1.8"/></svg>',
    menu: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="6.6" height="6.6" rx="1.8"/><rect x="13.4" y="4" width="6.6" height="6.6" rx="1.8"/><rect x="4" y="13.4" width="6.6" height="6.6" rx="1.8"/><rect x="13.4" y="13.4" width="6.6" height="6.6" rx="1.8"/></svg>'
  };
  function navOn(v) { return v === 'match' ? (matchFrom === 'live' ? 'live' : matchFrom === 'menu' || matchFrom === 'results' ? 'menu' : 'home') : v === 'news' || v === 'pred' ? 'home' : v === 'results' ? 'menu' : v; }
  function navHtml() {
    var n = NX(), on = navOn(view), items = [['home', n.nHome]];
    if (liveShown()) items.push(['live', n.nLive]);
    items.push(['slip', n.nSlip], ['mine', n.nMine], ['menu', n.nMenu]);
    return '<nav class="pz-nav sp2-tabs n' + items.length + '" id="pzNav">' + items.map(function (it) {
      var k = it[0], c = k === 'slip';
      return '<button type="button" data-sv="' + k + '" class="' + (on === k ? 'on' : '') + (c ? ' pz-cpn' : '') + '"' + (on === k ? ' aria-current="page"' : '') + '>' +
        (c ? '<span class="pz-cpc">' + NAVI.slip + '<i class="pz-n" id="pzSlipN"' + (slip.length ? '' : ' hidden') + '>' + slip.length + '</i></span>'
          : '<span class="pz-ni">' + NAVI[k] + (k === 'live' ? '<i class="pz-ld"></i>' : '') + '</span>') +
        '<span class="fit">' + esc(it[1]) + '</span></button>';
    }).join('') + '</nav>';
  }
  function paintNav(bump) {
    var nv = $('pzNav'); if (!nv || !box || !box.contains(nv)) return;
    if (!!nv.querySelector('[data-sv="live"]') !== liveShown()) { nv.outerHTML = navHtml(); fitAll($('pzNav')); return; }
    var n = $('pzSlipN'); if (n) { n.hidden = !slip.length; n.textContent = String(slip.length); }
    if (bump) { var c = nv.querySelector('.pz-cpc'); if (c) { c.classList.remove('bump'); void c.offsetWidth; c.classList.add('bump'); } }
  }
  function paintBar(bump) { paintNav(bump); } // (ancien nom, appelé par la liste « Actualité »)
  function bar(title, extra, sub) {
    // 2026-10-22 (propriétaire : « UN seul bouton retour ») : plus de flèche ‹ ici, la flèche du haut (casino) recule d'un cran
    return '<div class="pz-bar">' +
      '<span class="pz-bt"><b dir="auto">' + esc(title) + '</b>' + (sub ? '<small dir="auto">' + esc(sub) + '</small>' : '') + '</span>' + (extra || '') + '</div>';
  }
  function shell(inner) {
    closeSheet(true);
    box.innerHTML = '<div class="pz-page pz-v-' + view + '">' + inner + '</div>' + navHtml();
    box.dataset.pzv = view;
    bindBox(); layoutVars(); fitAll($('pzNav')); startTick();
  }
  function layoutVars() {
    // en-tête du casino collé en haut (sa hauteur change : visiteur / connecté) ; la page remplit l'écran (barre du bas en bas)
    try {
      var tp = document.querySelector('#casinoModal .cs-top'), mb = mbox();
      if (tp) box.style.setProperty('--sp-top', Math.max(40, tp.offsetHeight - 6) + 'px');
      if (!mb) return;
      var cs = getComputedStyle(mb), pb = parseFloat(cs.paddingBottom) || 18;
      box.style.setProperty('--sp2-px', (parseFloat(cs.paddingLeft) || 14) + 'px'); box.style.setProperty('--sp2-pb', pb + 'px');
      var ae = document.activeElement, typing = ae && /^(INPUT|TEXTAREA|SELECT)$/.test(ae.tagName || '');
      if (!typing) {
        // appli iPhone installée : la bande du bas n'est pas dessinable → la barre du bas remonte d'autant (Safari / Android : rien)
        var vv = window.visualViewport, vis = window.innerHeight || 0;
        if (vv && vv.height > 200) vis = Math.min(vis, vv.height + (vv.offsetTop || 0));
        var ih = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--ios-site-h')) || 0;
        var app = document.documentElement.classList.contains('ios-app');
        if (app && ih > 200) vis = Math.min(vis, ih);
        var lift = app ? Math.max(0, Math.min(140, Math.round(mb.getBoundingClientRect().bottom - vis))) : 0;
        box.style.setProperty('--sp2-lift', lift + 'px');
        var top = box.getBoundingClientRect().top - mb.getBoundingClientRect().top + mb.scrollTop;
        box.style.minHeight = Math.max(0, Math.round(mb.clientHeight - top - pb - lift)) + 'px';
      }
    } catch (e) { /* ignore */ }
  }
  // changer d'écran (barre du bas, liens) ; la position de la liste est gardée pour le retour
  function go(v) {
    if (!box) return;
    if (sending && view === 'slip') return;
    var mb = mbox();
    if (v === view && v !== 'slip') { if (mb) mb.scrollTop = 0; if (v === 'home' && (per !== 'all' || sbQ || hourF >= 0 || sport !== 'foot')) { per = 'all'; sbQ = ''; hourF = -1; sport = 'foot'; render(); } return; }
    if (mb) scrollMem[view] = mb.scrollTop;
    if (v === 'slip') { if (view !== 'slip') slipFrom = view; lastBet = null; lastBets = null; }
    view = v; render();
    if (mb) mb.scrollTop = v === 'home' || v === 'live' || v === 'mine' ? (scrollMem[v] || 0) : (v === 'match' ? (scrollMem['m:' + sbMid] || 0) : 0);
    if (v === 'slip') sbAfterSlipOpen();
    schedule();
  }
  /* Retour d'un cran (flèche du haut du casino = le SEUL bouton retour, bouton retour du téléphone) : reçu → fermé ; match → liste
     d'où l'on vient ; coupon → écran d'avant ; Résultats → Menu ; autre écran → Populaire. Populaire : Paris se ferme. */
  function back() {
    var rc = document.getElementById('spRcpt');
    if (rc) { rc.classList.remove('on'); setTimeout(function () { rc.remove(); }, 220); return true; }
    if (!alive()) return false;
    if (closeSheet()) return true;
    if (sending) return true;
    if (view === 'match') { go(matchFrom && matchFrom !== 'match' ? matchFrom : 'home'); return true; }
    if (view === 'slip') { go(slipFrom && slipFrom !== 'slip' ? slipFrom : 'home'); return true; }
    if (view === 'results') { go('menu'); return true; }
    if (view !== 'home') { go('home'); return true; }
    // Populaire filtré (période, recherche, autre sport) : on revient d'abord à Populaire tel qu'à l'ouverture
    if (per !== 'all' || sbQ || hourF >= 0 || sport !== 'foot') { go('home'); return true; }
    return false;
  }
  function render() {
    if (!box) return;
    box.classList.add('sp2');
    if (view === 'mine') { renderMine(); return; }
    if (view === 'slip') { renderSlip(); return; }
    if (view === 'menu') { renderMenu(); return; }
    if (view === 'results') { renderResults(); return; }
    if (view === 'news') { renderList(); return; }
    if (view === 'pred') { renderPred(); return; }
    if (view === 'live') { if (liveOn === false) view = 'home'; else { renderLive(); return; } }
    if (view === 'match') { if (sbMid) { renderMatch(); return; } view = 'home'; }
    view = 'home'; renderHome();
  }
  async function paint(container, c) {
    box = container; ctx = c || {};
    if (!box) return;
    box.classList.add('sp2');
    if ((lastBet || lastBets) && view === 'slip') { lastBet = null; lastBets = null; view = slipFrom === 'slip' ? 'home' : slipFrom; }
    if (view === 'match' && !sbMid) view = 'home';
    if (lastList) events = lastList;
    syncSlip();
    if (pendCode) { var pc = pendCode; pendCode = ''; loadCode(pc); }
    render();
    sbProbe(container);
    liveProbe();
    var r = await fetchList();
    if (box !== container || !alive()) return;
    if (r) {
      var same = lastJson === JSON.stringify(r);
      var hadQ = hasQ();
      lastList = events = r; lastJson = JSON.stringify(r);
      var chg = syncSlip();
      if (!same && (view === 'news' || view === 'pred' || (view === 'home' && sbOn !== true))) render();
      else if (view === 'home' && hadQ !== hasQ()) render();
      else if (view === 'slip' && chg && !sending && !lastBet) { render(); sbToast(XX().oddsChg); }
    } else if (!lastList && view === 'home' && sbOn === false) { events = []; render(); }
    schedule();
  }
  // paris automatiques visibles pour ce joueur ? (sbList ok) — sinon l'ancienne liste (questions et matchs de l'admin)
  function sbProbe(container) {
    var was = sbOn;
    sbLoad(true).then(function () {
      if (!alive() || box !== container || sending) return;
      if (sbOn !== was) { if (view === 'home' || view === 'menu' || ((view === 'live' || view === 'match') && sbOn === false)) render(); else paintNav(); }
      else if (view === 'home') paintHome();
    });
  }
  // DIRECT : sbLive (barre « Direct » cachée si le serveur ne le propose pas : refus « off » / action inconnue)
  function liveProbe(force) {
    if (sbOn === false || liveOn === false) return Promise.resolve(null);
    if (livePend) return livePend;
    if (!force && liveData && Date.now() - liveData.at < 4000) return Promise.resolve(liveData.r);
    livePend = (async function () {
      var r = null;
      try { r = await D6.Api.post('sbLive', {}, 12000); } catch (e) { r = null; }
      livePend = null;
      if (r && r.ok && Array.isArray(r.fx)) {
        var was = liveShown(); liveOn = true;
        r.fx = r.fx.filter(function (f) { return f && f.id && f.h && f.a; });
        r.lg = Array.isArray(r.lg) ? r.lg : [];
        liveData = { r: r, at: Date.now() };
        r.fx.forEach(function (f) { noteLive(f, 'list'); });
        if (was !== liveShown()) paintNav();
        return r;
      }
      if (r && r.ok === false && !r.rate && r.reason !== 'busy') {
        var w2 = liveShown(); liveOn = false; liveData = null;
        if (w2 && alive()) { if (view === 'live') go('home'); else paintNav(); }
      }
      return null;
    })();
    return livePend;
  }
  // une journée (0 / 1 / 2) d'un sport : gardée 60 s ; false = refusé (pas visible pour ce joueur) ; null = réseau
  // « Tout », recherche, favoris : une seule lecture (tous les jours, J … J+14) ; un jour : ce jour ; périodes courtes : J et J+1
  function needDays() { if (sbQ || per === 'fav' || per === 'all' || per === 'top') return ['all']; var m = /^d(\d{1,2})$/.exec(per); if (m && +m[1] <= 14) return [+m[1]]; return [0, 1]; }
  function sbFetch(day, force, sp) {
    sp = sp || sport;
    var key = sp + '|' + day, c = sbData[key] || (sbData[key] = {});
    if (c.p) return c.p;
    if (c.r && !force && Date.now() - c.at < 60000) return Promise.resolve(c.r);
    c.p = (async function () {
      var r = null;
      try { r = await D6.Api.post('sbList', { day: day, tz: tzMin(), sport: sp }, 15000); } catch (e) { r = null; }
      c.p = null;
      if (r && r.ok) {
        sbOn = true;
        if (Array.isArray(r.sports) && r.sports.length) {
          sbSports = r.sports.filter(function (s) { return s && /^[a-z]{2,16}$/.test(String(s.s || '')); });
          var fl = r.sports.filter(function (s) { return s.s === 'foot'; })[0];
          if (fl && +fl.live === -1) { liveOn = false; liveData = null; } else if (fl && isFinite(+fl.live)) liveCnt = +fl.live;
        }
        // jamais un match sans cotes ; jamais un match d'un autre sport (ancien serveur : football seulement)
        r.fx = (r.fx || []).filter(function (f) { return f && String(f.id || '').indexOf(sp + ':') === 0 && f.o && f.o.o && f.o.o.length && f.h && f.a; });
        r.lg = Array.isArray(r.lg) ? r.lg : [];
        c.r = r; c.at = Date.now(); return r;
      }
      if (r && r.ok === false && !r.rate && r.reason !== 'busy') { sbOn = false; sbData = {}; return false; }
      return null;
    })();
    return c.p;
  }
  function sbLoad(force) { return Promise.all(needDays().map(function (d) { return sbFetch(d, force); })); }
  function sbFx(fid) {
    if (sbM && sbM.fx && sbM.fx.id === fid) return sbM.fx;
    if (liveData) for (var j = 0; j < liveData.r.fx.length; j++) if (liveData.r.fx[j].id === fid) return liveData.r.fx[j];
    for (var d in sbData) { var r = sbData[d] && sbData[d].r; if (r) for (var i = 0; i < r.fx.length; i++) if (r.fx[i].id === fid) return r.fx[i]; }
    return null;
  }
  function sbLg(id, sp) {
    // 2026-10-22 : les numéros de compétitions se répètent d'un sport à l'autre (NBA = 12, football 12…) → cherchés dans SON sport
    sp = sp || 'foot';
    var all = []; for (var d in sbData) if (sbData[d] && sbData[d].r && d.indexOf(sp + '|') === 0) all.push(sbData[d].r.lg);
    if (sp === 'foot') {
      if (liveData) all.push(liveData.r.lg);
      for (var k in resData) if (resData[k] && resData[k].r) all.push(resData[k].r.lg || []);
    }
    for (var a = 0; a < all.length; a++) for (var i = 0; i < all[a].length; i++) if (all[a][i].id === id) return all[a][i];
    return null;
  }
  // ---------- petits morceaux communs ----------
  var LOCK = '<svg class="sp2-i" viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>';
  // drapeau du pays ; compétitions internationales (Ligue des champions, Europa…, pays « World » sans drapeau) : logo de la compétition
  function lgImg(l) {
    if (l && l.f && /^https:\/\//.test(l.f)) return '<img class="pz-flag" src="' + esc(l.f) + '" alt="" width="18" height="13" loading="lazy" decoding="async" onerror="this.style.visibility=\'hidden\'">';
    if (l && l.lo && /^https:\/\//.test(l.lo)) return '<img class="pz-flag pz-lglo" src="' + esc(l.lo) + '" alt="" width="18" height="18" loading="lazy" decoding="async" onerror="this.style.visibility=\'hidden\'">';
    return '<i class="pz-flag pz-noflag"></i>';
  }
  function tlogo(u, cls) { return u && /^https:\/\//.test(u) ? '<img class="' + cls + '" src="' + esc(u) + '" alt="" loading="lazy" decoding="async" onerror="this.style.visibility=\'hidden\'">' : '<i class="' + cls + ' pz-nolo"></i>'; }
  function dur(u, v) { try { return new Intl.NumberFormat(loc(), { style: 'unit', unit: u, unitDisplay: 'short' }).format(v).replace(/\s/g, ' '); } catch (e) { return v + (u === 'hour' ? ' h' : ' min'); } }
  function clock(sec) { sec = Math.max(0, Math.floor(sec)); var h = Math.floor(sec / 3600), m = Math.floor(sec % 3600 / 60), s = sec % 60, p = function (v) { return (v < 10 ? '0' : '') + v; }; return (h ? p(h) + ':' : '') + p(m) + ':' + p(s); }
  function inTxt(s) { return fmt(NX().inX, { x: s >= 3600 ? dur('hour', Math.floor(s / 3600)) + (Math.floor(s % 3600 / 60) ? ' ' + dur('minute', Math.floor(s % 3600 / 60)) : '') : dur('minute', Math.max(1, Math.ceil(s / 60))) }); }
  function inShort(s) { var h = Math.floor(s / 3600), m = Math.max(1, Math.ceil(s % 3600 / 60)); if (m === 60) { h++; m = 0; } return h ? h + ' h ' + (m < 10 ? '0' : '') + m : dur('minute', m); }
  function scTxt(f) { var s = f.sc || [0, 0]; return (+s[0] || 0) + ' - ' + (+s[1] || 0); }
  function minTxt(f, sh) { var n = NX(); if (f.end || f.st === 'FT' || f.st === 'AET' || f.st === 'PEN') return sh ? n.ftS : n.ft; if (f.st === 'HT') return sh ? n.htS : n.ht; return f.m != null && f.m !== '' ? f.m + '’' : n.nLive; }
  function skelRows() { var lk = '<span class="pz-ob lk na"><i class="pz-lki">' + LOCK + '</i></span>', s = ''; for (var i = 0; i < 6; i++) s += '<div class="pz-row pz-skel"><i></i><i></i><div class="pz-ro">' + lk + lk + lk + '</div></div>'; return '<div class="pz-lg">' + s + '</div>'; }
  function oddsBy(f) { var by = {}; ((f.o && f.o.o) || []).forEach(function (z) { by[z[0]] = z[1]; }); return by; }
  // bouton de cote : (libellé à gauche) cote à droite ; cadenas quand c'est suspendu
  function obtn(ev, k, v, lbl, susp) {
    // 2026-10-22 (propriétaire : « les cotes ne disparaissent jamais ») : choix indisponible → même bouton, cadenas, dans sa colonne
    if (v == null) return '<button type="button" class="pz-ob lk na' + (lbl != null ? ' pz-ob2' : '') + '" data-ev="' + esc(ev) + '" data-k="' + esc(k) + '" data-odd="" aria-pressed="false" disabled>' +
      (lbl != null ? '<span class="pz-ol" dir="auto">' + esc(lbl) + '</span>' : '') + '<b class="pz-ov"></b><i class="pz-lki">' + LOCK + '</i></button>';
    var on = inSlip(ev, k);
    return '<button type="button" class="pz-ob' + (lbl != null ? ' pz-ob2' : '') + (on ? ' on' : '') + (susp ? ' lk' : '') + '" data-ev="' + esc(ev) + '" data-k="' + esc(k) + '" data-odd="' + v + '" aria-pressed="' + on + '"' + (susp ? ' disabled' : '') + '>' +
      (lbl != null ? '<span class="pz-ol" dir="auto">' + esc(lbl) + '</span>' : '') + '<b class="pz-ov">' + Number(v).toFixed(2) + '</b><i class="pz-lki">' + LOCK + '</i></button>';
  }
  // jeux complets de choix par famille de marché : un choix absent garde sa place (cadenas)
  var FULLK = { '1x2': 'H D A', eh: 'H D A', ht1x2: 'H D A', '2h1x2': 'H D A', dc: 'HD HA DA', htdc: 'HD HA DA', '2hdc': 'HD HA DA', dnb: 'H A', ah: 'H A', htah: 'H A', '12': 'H A',
    ou: 'O U', tth: 'O U', tta: 'O U', htou: 'O U', '2hou': 'O U', httth: 'O U', httta: 'O U', oe: 'O E', htoe: 'O E', '2hoe': 'O E', btts: 'Y N', htbtts: 'Y N', '2hbtts': 'Y N', csh: 'Y N', csa: 'Y N', wnh: 'Y N', wna: 'Y N' };
  function fullO(mk, o) {
    var f = FULLK[mkParts(mk)[0]]; o = o || []; if (!f) return o;
    var ks = f.split(' '), by = {};
    if (!o.every(function (z) { return ks.indexOf(String(z[0])) > -1; })) return o;
    o.forEach(function (z) { by[z[0]] = z; });
    return ks.map(function (k) { return by[k] || [k, null]; });
  }
  // ligne d'un match : heure (ou minute du direct) · équipes en entier (2 lignes au besoin) · 1 · X · 2 · flèche
  function rowHtml(f, o) {
    o = o || {};
    var lv = !!f.live, by = oddsBy(f), mk = (f.o && f.o.mk) || '1x2', two = mk === '12', ev = 'sb:' + f.id + ':' + mk, susp = lv && (f.susp || f.end), sc = f.sc || [0, 0];
    var tcol = lv ? '<div class="pz-rt lv" data-open="' + esc(f.id) + '"><b class="pz-min">' + esc(minTxt(f, 1)) + '</b></div>'
      : '<div class="pz-rt" data-open="' + esc(f.id) + '"><b dir="ltr">' + esc(hm24(f.ts)) + '</b>' + (o.when ? '<small class="fit pz-wh">' + esc(o.when) + '</small>' : '') +
        (o.soon && f.ts - nowS() < 7200 ? '<small class="pz-in" data-in="' + f.ts + '">' + esc(inShort(f.ts - nowS())) + '</small>' : '') + '</div>';
    var l = o.lg ? sbLg(f.lg, spOf(f)) : null;
    return '<div class="pz-row' + (lv ? ' lv' : '') + '" data-fx="' + esc(f.id) + '">' + tcol +
      '<div class="pz-rn" data-open="' + esc(f.id) + '">' + (l ? '<small class="pz-rl">' + lgImg(l) + '<span dir="auto">' + esc(l.n) + '</span></small>' : '') +
        '<p><span dir="auto">' + esc(f.h.n) + '</span>' + (lv ? '<b class="pz-sc">' + (+sc[0] || 0) + '</b>' : '') + '</p>' +
        '<p><span dir="auto">' + esc(f.a.n) + '</span>' + (lv ? '<b class="pz-sc">' + (+sc[1] || 0) + '</b>' : '') + '</p></div>' +
      '<div class="pz-ro">' + obtn(ev, 'H', by.H, null, susp) + (two ? '<span class="pz-ob off" aria-hidden="true"></span>' : obtn(ev, 'D', by.D, null, susp)) + obtn(ev, 'A', by.A, null, susp) + '</div>' +
      '<span class="pz-rc" data-open="' + esc(f.id) + '" aria-hidden="true">' + SBIC.chev + '</span></div>';
  }
  // un championnat (repliable) : drapeau, nom, pays en petit ; 1 · X · 2 au-dessus des colonnes de cotes
  function lgSection(key, l, list, open, rowOpt, fixed) { // fixed : toujours ouvert, sans flèche (« Tout »)
    var two = list.every(function (f) { return f.o && f.o.mk === '12'; });
    if (fixed) open = true;
    return '<section class="pz-lg' + (open ? ' on' : '') + '" data-lgk="' + esc(key) + '">' + (fixed ? '<div class="pz-lgh">' : '<button type="button" class="pz-lgh" data-lgt="' + esc(key) + '" aria-expanded="' + open + '">') + lgImg(l) +
      '<span class="pz-lgn"><b dir="auto">' + esc(l.n || '') + '</b>' + (l.c ? '<small dir="auto">' + esc(l.c) + '</small>' : '') + '</span>' +
      '<span class="pz-cols" aria-hidden="true"><i>1</i><i>' + (two ? '' : 'X') + '</i><i>2</i></span>' + (fixed ? '</div>' : '<i class="pz-chev">' + SBIC.chev + '</i></button>') +
      '<div class="pz-lgb">' + list.map(function (f) { return rowHtml(f, rowOpt); }).join('') + '</div></section>';
  }
  // GRANDS matchs (« Top ») : grandes compétitions + au moins un grand club ; sélections : Côte d'Ivoire / Sénégal partout, grandes nations en compétition internationale
  var BIGC = /\b(real madrid|barcelona|atletico madrid|manchester city|manchester united|liverpool|arsenal|chelsea|tottenham|newcastle|bayern|borussia dortmund|dortmund|bayer leverkusen|leverkusen|rb leipzig|paris saint germain|psg|marseille|lyon|monaco|lille|juventus|inter|ac milan|milan|napoli|as roma|roma|lazio|atalanta|benfica|fc porto|porto|sporting cp|ajax|psv|feyenoord|galatasaray|fenerbahce|besiktas|celtic|rangers|al hilal|al nassr|al ahly|zamalek|esperance|wydad|raja|mamelodi sundowns|tp mazembe|asec mimosas|flamengo|palmeiras|boca juniors|river plate)\b/;
  var BIGN = /\b(ivory coast|cote d ivoire|senegal)\b/, BIGW = /\b(france|brazil|argentina|spain|england|germany|portugal|italy|netherlands|belgium|morocco|nigeria|cameroon|egypt|algeria|ghana|mali|tunisia)\b/;
  function isBig(f) {
    if (spOf(f) !== 'foot') return (+(sbLg(f.lg, spOf(f)) || {}).p || 100) <= 20; // autres sports : grandes compétitions (NBA, NHL, NFL…)
    var l = sbLg(f.lg) || {}, h = normS(f.h.n).replace(/[^a-z0-9]+/g, ' '), a = normS(f.a.n).replace(/[^a-z0-9]+/g, ' '), t = ' ' + h + ' | ' + a + ' ';
    if (BIGN.test(t)) return true; // Côte d'Ivoire, Sénégal : toujours
    var p = +l.p || 100, intl = /qualif|world cup|friendl|nations|africa cup|euro|copa|olymp/i.test(String(l.n || ''));
    if (intl && BIGW.test(t)) return true;
    return p <= 20 && BIGC.test(t);
  }
  function whenShort(t) { var d = new Date(t * 1000), o = Math.round((new Date(d).setHours(12, 0, 0, 0) - new Date().setHours(12, 0, 0, 0)) / 864e5); return o === 0 ? '' : o === 1 ? SX().tomorrow : cap1(d.toLocaleDateString(loc(), { weekday: 'short', day: 'numeric' })); } // aujourd'hui : l'heure suffit
  // jours → championnats (favoris, grands d'abord) → matchs ; renvoie la liste des blocs (dessinés par paquets)
  function dayBlocks(fx, lgs, opt) {
    opt = opt || {};
    var fv = favs(), out = [], byDay = [], dk = {}, many = fx.length > 40;
    fx.forEach(function (f) { var d = new Date(f.ts * 1000).toDateString(); if (!dk[d]) { dk[d] = { t: f.ts, f: [] }; byDay.push(dk[d]); } dk[d].f.push(f); });
    byDay.forEach(function (D) {
      if (byDay.length > 1 || opt.dayHead) out.push('<h4 class="pz-day"><span dir="auto">' + esc(dayHead(D.t)) + '</span></h4>');
      var g = {}, order = [];
      D.f.forEach(function (f) { if (!g[f.lg]) { g[f.lg] = []; order.push(f.lg); } g[f.lg].push(f); });
      order.sort(function (a, b) {
        var A = lgs[a] || { p: 100, c: '', n: '' }, B = lgs[b] || { p: 100, c: '', n: '' }, fa = fv.l.indexOf(a) > -1 ? 0 : 1, fb = fv.l.indexOf(b) > -1 ? 0 : 1;
        return fa - fb || (A.p || 100) - (B.p || 100) || String(A.c).localeCompare(String(B.c)) || String(A.n).localeCompare(String(B.n));
      });
      order.forEach(function (id, i) {
        var l = lgs[id] || { id: id, n: '', c: '', f: '', p: 100 }, key = (opt.k || '') + new Date(D.t * 1000).toDateString() + '|' + id;
        var open = sbOpen[key] != null ? sbOpen[key] : (!!sbQ || !many || (l.p || 100) < 100 || fv.l.indexOf(id) > -1 || i < 4);
        out.push(lgSection(key, l, g[id], open, opt.row, opt.fixed));
      });
    });
    return out;
  }
  function lgMap(rs) { var m = {}; rs.forEach(function (r) { (r.lg || []).forEach(function (l) { m[l.id] = l; }); }); return m; }

  // ---------- POPULAIRE ----------
  function sportsRow() {
    var sl = sbSports.length ? sbSports : [{ s: 'foot', n: 'Football' }];
    var html = sl.map(function (s) { return '<button type="button" data-sp="' + esc(s.s) + '" class="' + (sport === s.s && view !== 'news' && view !== 'pred' ? 'on' : '') + '">' + sico(spIco(s.s)) + '<span dir="auto">' + esc(spName(s)) + '</span></button>' + (s.s === 'foot' ? predChip() : ''); }).join('');
    if (html.indexOf('data-sp="pred"') < 0) html = predChip() + html; // (Football absent : Predict en tête)
    if (hasQ()) html += '<button type="button" data-sp="news" class="' + (view === 'news' ? 'on' : '') + '">' + SBIC.news + '<span>' + esc(SX().news) + '</span></button>';
    return '<div class="pz-sports pz-hs">' + html + '</div>';
  }
  /* 2026-10-22 (propriétaire) — périodes : Top · Dans 30 min · 1 h · 2 h · 3 h · 6 h · 12 h · Aujourd'hui · Demain · Après-demain ·
     « 📅 Date » (petite feuille : les jours suivants qui ont des matchs, avec leur nombre). Plus de sélecteur « Heure ». */
  var DATEW = { fr: ['Date', '{n} matchs', '1 match', 'Tout'], en: ['Date', '{n} matches', '1 match', 'All'], es: ['Fecha', '{n} partidos', '1 partido', 'Todo'], pt: ['Data', '{n} jogos', '1 jogo', 'Tudo'],
    ar: ['التاريخ', '{n} مباراة', 'مباراة واحدة', 'الكل'], tr: ['Tarih', '{n} maç', '1 maç', 'Tümü'], vi: ['Ngày', '{n} trận', '1 trận', 'Tất cả'], id: ['Tanggal', '{n} laga', '1 laga', 'Semua'],
    ru: ['Дата', 'Матчей: {n}', '1 матч', 'Все'], de: ['Datum', '{n} Spiele', '1 Spiel', 'Alle'], zh: ['日期', '{n} 场比赛', '1 场比赛', '全部'], hi: ['तारीख', '{n} मैच', '1 मैच', 'सभी'] };
  function DW() { return DATEW[lg()] || DATEW.en; }
  function dayName(i) { var x = SX(); if (i === 0) return x.today; if (i === 1) return x.tomorrow; if (i === 2) return x.after; try { return cap1(offDate(i).toLocaleDateString(loc(), { weekday: 'short', day: 'numeric', month: 'short' })); } catch (e) { return isoDay(offDate(i)); } }
  function persHtml() {
    var x = SX(), n = NX(), fv = favs(), w = DW(), dm = /^d([3-9]|1[0-4])$/.exec(per);
    var P = [['all', w[3]], ['d0', x.today], ['top', x.top], ['d1', x.tomorrow], ['d2', x.after], ['m30', fmt(n.inX, { x: dur('minute', 30) })], ['h1', dur('hour', 1)], ['h2', dur('hour', 2)], ['h3', dur('hour', 3)], ['h6', dur('hour', 6)], ['h12', dur('hour', 12)]];
    return P.map(function (p) { return '<button type="button" data-per="' + p[0] + '" class="' + (per === p[0] && !sbQ && view === 'home' ? 'on' : '') + '"><span>' + esc(p[1]) + '</span></button>'; }).join('') +
      '<button type="button" class="pz-datec' + (dm && !sbQ && view === 'home' ? ' on' : '') + '" data-dsheet="1" aria-haspopup="dialog">' + IC.cal + '<span dir="auto">' + esc(dm && !sbQ ? dayName(+dm[1]) : w[0]) + '</span></button>' +
      (fv.l.length || fv.f.length ? '<button type="button" data-per="fav" class="pz-favc' + (per === 'fav' && !sbQ && view === 'home' ? ' on' : '') + '" aria-label="' + esc(x.fav) + '"><span>★ ' + esc(x.fav) + '</span></button>' : '');
  }
  // « 📅 Date » : petite feuille dans la page (jamais un menu natif) — jours 0…7 du joueur avec le nombre de matchs
  var dayCnt = null;
  function sheetRows() {
    var w = DW(), c = dayCnt && dayCnt.sp === sport ? dayCnt.c : null, h = '';
    if (!c) return '<div class="pz-shr pz-skel"></div><div class="pz-shr pz-skel"></div><div class="pz-shr pz-skel"></div>';
    for (var i = 3; i < c.length && i <= 14; i++) {
      var k = +c[i] || 0; if (!k) continue;
      h += '<button type="button" class="pz-shr' + (per === 'd' + i && !sbQ ? ' on' : '') + '" data-per="d' + i + '"><span dir="auto">' + esc(dayName(i)) + '</span>' + (k > 0 ? '<em dir="auto">' + esc(k === 1 ? w[2] : fmt(w[1], { n: k })) + '</em>' : '') + '</button>';
    }
    return h || '<p class="pz-none">' + esc(SX().noMatch) + '</p>';
  }
  function openSheet() {
    closeSheet(true);
    var el = document.createElement('div'); el.className = 'pz-sheet'; el.id = 'pzSheet';
    el.innerHTML = '<div class="pz-shb" data-shx="1"></div><div class="pz-shc" role="dialog" aria-modal="true"><div class="pz-shh"><b>' + IC.cal + '<span dir="auto">' + esc(DW()[0]) + '</span></b><button type="button" class="pz-shx" data-shx="1" aria-label="✕">' + IC.x + '</button></div><div class="pz-shl" id="pzShL">' + sheetRows() + '</div></div>';
    box.appendChild(el);
    requestAnimationFrame(function () { requestAnimationFrame(function () { el.classList.add('on'); }); });
    if (!dayCnt || dayCnt.sp !== sport || Date.now() - dayCnt.at > 120000) {
      var sp = sport;
      D6.Api.post('sbList', { day: 0, tz: tzMin(), sport: sp, cnt: 1 }, 15000).then(function (r) {
        if (r && r.ok && Array.isArray(r.days)) { dayCnt = { sp: sp, c: r.days, at: Date.now() }; var l = $('pzShL'); if (l && sport === sp) l.innerHTML = sheetRows(); }
      }).catch(function () {});
    }
  }
  function closeSheet(now) { var el = $('pzSheet'); if (!el) return false; if (now) { el.remove(); return true; } el.classList.remove('on'); setTimeout(function () { el.remove(); }, 200); return true; }
  /* 2026-10-22 (propriétaire : « rien ne bouge, comme les grands sites ») — UN SEUL haut de page pour Football, Predict, les
     autres sports et Actualité : barre de recherche, rangée des sports, rangée des périodes (Predict : ses catégories, même
     hauteur, même place). Changer de puce ne remplace QUE la liste dessous (#pzBody) : l'en-tête n'est jamais redessiné,
     la page ne saute pas ; si la liste était déjà défilée, elle repart de son haut (l'en-tête reste à sa place). */
  function topView(v) { return v === 'home' || v === 'pred' || v === 'news'; }
  function hasTop() { var pg = box && box.querySelector(':scope > .pz-page'); return !!(pg && $('pzQ') && $('pzPers') && $('pzBody') && /\bpz-v-(home|pred|news)\b/.test(pg.className)); }
  function row2Html() { return view === 'pred' ? pcatHtml() : persHtml(); }
  function renderTop() {
    if (hasTop()) { swapTop(); return; }
    var x = SX();
    shell('<div class="pz-home' + (view === 'pred' ? ' pz-pred' : '') + '"><label class="pz-q">' + SBIC.search + '<input id="pzQ" type="search" enterkeyhint="search" autocomplete="off" placeholder="' + esc(x.search) + '" value="' + esc(qRaw) + '">' +
      '<button type="button" class="pz-qx" id="pzQx" aria-label="✕"' + (qRaw ? '' : ' hidden') + '>' + IC.x + '</button></label>' +
      sportsRow() + '<div class="pz-pers pz-hs' + (view === 'pred' ? ' pd-cats' : '') + '" id="pzPers">' + row2Html() + '</div><div id="pzBody" class="pz-body"></div></div>');
    bindQ();
    keepOn($('pzPers')); keepOn(box.querySelector('.pz-sports'));
    paintBody();
  }
  // même haut de page, autre puce : on ne change que l'état des puces, la 2e rangée et la liste
  function swapTop() {
    closeSheet(true);
    var pg = box.querySelector(':scope > .pz-page'), hm = pg.querySelector('.pz-home'), pr = $('pzPers');
    pg.className = 'pz-page pz-v-' + view; box.dataset.pzv = view;
    if (!sbQ && normS(qRaw).trim().length >= 2) { qRaw = ''; var qi = $('pzQ'), qx = $('pzQx'); if (qi) qi.value = ''; if (qx) qx.hidden = true; } // recherche fermée ailleurs (Populaire, Favoris)
    if (hm) hm.classList.toggle('pz-pred', view === 'pred');
    paintSports();
    var h2 = row2Html(), pd = view === 'pred';
    if (pr.classList.contains('pd-cats') !== pd || pr.innerHTML !== h2) { pr.classList.toggle('pd-cats', pd); pr.scrollLeft = 0; pr.innerHTML = h2; keepOn(pr); }
    var b = $('pzBody'); if (b) { b.dataset.sig = ''; if (b._io) { b._io.disconnect(); b._io = null; } }
    paintNav();
    paintBody();
    fitAll(pr);
  }
  // rangée des sports : seules les puces changent d'état (sa position de défilement est gardée) ; redessinée si la liste a changé
  function paintSports() {
    var row = box.querySelector('.pz-home > .pz-sports'); if (!row) return;
    var t = document.createElement('div'); t.innerHTML = sportsRow();
    var nw = t.firstElementChild, keys = function (r) { return [].map.call(r.querySelectorAll('[data-sp]'), function (z) { return z.getAttribute('data-sp'); }).join(','); };
    if (keys(nw) !== keys(row)) { var sl = row.scrollLeft; row.innerHTML = nw.innerHTML; row.scrollLeft = sl; keepOn(row); return; }
    [].forEach.call(row.querySelectorAll('[data-sp]'), function (z, i) { var on = nw.querySelectorAll('[data-sp]')[i].classList.contains('on'); z.classList.toggle('on', on); });
  }
  function paintBody() {
    if (sbQ) { paintSearch(); return; }
    if (view === 'pred') paintPredBody(); else if (view === 'news') renderList(); else paintHome();
  }
  // position de la liste : si elle était défilée (en-tête des puces collé en haut), elle repart de son haut ; sinon rien ne bouge
  function listTop() {
    var mb = mbox(), sp = box && box.querySelector('.pz-home > .pz-sports'), pr = $('pzPers'); if (!mb || !sp || !pr) return;
    var R = mb.getBoundingClientRect(), lim = Math.round(sp.getBoundingClientRect().bottom - R.top + mb.scrollTop + 8 - (parseFloat(getComputedStyle(pr).top) || 0));
    if (mb.scrollTop > lim) mb.scrollTop = Math.max(0, lim);
  }
  // une puce du haut (sport, Predict, Actualité, période, catégorie) : la recherche se ferme, l'en-tête reste, la liste change
  function topGo(v) {
    if (qRaw) setQ('');
    if (!topView(view) || !hasTop()) { go(v); return; }
    view = v; swapTop(); listTop(); schedule();
  }
  /* ---------- RECHERCHE UNIVERSELLE (2026-10-22, propriétaire) — une seule barre, sur toutes les puces : matchs de football
     (équipes, championnats, pays), des autres sports (lus à la demande, gardés 60 s) ET prédictions Predict (question, choix,
     catégorie). Dès 2 lettres, 150 ms après la frappe, sans accents ni majuscules ; résultats groupés (Matchs · Predict).
     ✕ : la vue d'avant revient (même position). */
  var qRaw = '', qMem = -1, qTried = {};
  function setQ(v) {
    var q = $('pzQ'), x = $('pzQx');
    if (q && q.value !== v) q.value = v;
    qRaw = v; if (x) x.hidden = !v;
    onQ(v.trim());
  }
  function onQ(v) {
    var nq = normS(v).replace(/\s+/g, ' ').trim().length >= 2 ? v : '';
    if (nq === sbQ) return;
    var mb = mbox(), was = !!sbQ;
    if (!was && nq && mb) qMem = mb.scrollTop;
    sbQ = nq;
    var b = $('pzBody'); if (b) b.dataset.sig = '';
    paintBody();
    if (!sbQ && was && mb && qMem >= 0) { mb.scrollTop = qMem; qMem = -1; } else if (sbQ) listTop();
  }
  function bindQ() {
    var q = $('pzQ'), qt = 0; if (!q || q._b) return; q._b = 1;
    q.addEventListener('input', function () { var x = $('pzQx'); qRaw = q.value; if (x) x.hidden = !q.value; clearTimeout(qt); qt = setTimeout(function () { onQ(q.value.trim()); }, 150); });
    q.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); q.blur(); } if (e.key === 'Escape') { e.preventDefault(); setQ(''); q.blur(); } });
  }
  function qWords() { return normS(sbQ).replace(/[^a-z0-9\u0080-￿]+/g, ' ').trim().split(' ').filter(Boolean); }
  function qHit(hay, w) { hay = normS(hay).replace(/[^a-z0-9\u0080-￿]+/g, ' '); return w.every(function (t) { return hay.indexOf(t) > -1; }); }
  function srchFx(w) {
    var out = [], seen = {}, n = nowS(), pend = false;
    var sl = sbOn === false ? [] : (sbSports.length ? sbSports : [{ s: 'foot' }]);
    sl.forEach(function (s) {
      var c = sbData[s.s + '|all'];
      if ((!c || !c.r || Date.now() - c.at > 60000) && !(c && c.p) && Date.now() - (qTried[s.s] || 0) > 30000) {
        qTried[s.s] = Date.now();
        sbFetch('all', false, s.s).then(function () { if (alive() && sbQ && topView(view)) { var b = $('pzBody'); if (b) b.dataset.sig = ''; paintSearch(); } });
      }
      if (c && c.p && !c.r) pend = true;
    });
    var add = function (f) { if (!f || seen[f.id] || !f.h || !f.a) return; seen[f.id] = 1; var sp = spOf(f), l = sbLg(f.lg, sp) || {}, sn = spName({ s: sp });
      if (qHit(f.h.n + ' ' + f.a.n + ' ' + (l.n || '') + ' ' + (l.c || '') + ' ' + sn + ' ' + sp, w)) out.push(f); };
    liveFx().forEach(function (f) { if (!f.end) add(f); });
    for (var k in sbData) { var r = sbData[k] && sbData[k].r; if (r) r.fx.forEach(function (f) { if (f.ts > n) add(f); }); }
    out.sort(function (a, b) { return (b.live ? 1 : 0) - (a.live ? 1 : 0) || a.ts - b.ts || (a.id < b.id ? -1 : 1); });
    return { fx: out, pend: pend };
  }
  function srchPred(w) {
    return predEvs().filter(function (e) {
      var i = e.i18n || {}, h = [e.title, pcatName(e.cat), e.cat, PT('predName')];
      for (var k in i) h.push(i[k]);
      e.opts.forEach(function (o) { h.push(o.label, o.en || ''); });
      return qHit(h.join(' '), w);
    }).sort(function (a, b) { return a.start - b.start; });
  }
  function paintSearch() {
    var body = $('pzBody'); if (!body || !sbQ) return;
    var w = qWords(), F = srchFx(w), P = srchPred(w), fx = F.fx.slice(0, 40), pd = P.slice(0, 20);
    var sig = ['q', sbQ, lg(), fx.map(function (f) { return f.id; }).join(','), pd.map(function (e) { return e.id + (e.susp ? 's' : ''); }).join(','), F.pend ? 1 : 0].join('|');
    if (body.dataset.sig === sig) { patchAll(body); return; }
    body.dataset.sig = sig;
    if (body._io) { body._io.disconnect(); body._io = null; }
    var h = '';
    if (fx.length || F.pend) h += '<section class="pz-blk pz-sr"><div class="pz-bh"><b>' + esc(PT('pqMatches')) + '<em>' + F.fx.length + '</em></b></div><div class="pz-lgb">' +
      fx.map(function (f) { return rowHtml(f, { lg: 1, when: f.live ? '' : whenShort(f.ts), soon: 1 }); }).join('') + (F.pend && !fx.length ? skelRows() : '') + '</div></section>';
    if (pd.length) h += '<section class="pz-blk pz-sr pd-srb"><div class="pz-bh"><b>' + PRED_IC + '<span dir="ltr">' + esc(PT('predName')) + '</span><em>' + P.length + '</em></b></div><div class="pd-srl">' +
      pd.map(function (e) {
        return '<div class="pd-sr" data-card="' + esc(e.id) + '"><button type="button" class="pd-srh" data-pdgo="' + esc(e.id) + '"><span class="pd-cat c-' + esc(e.cat) + '"><i class="pd-dot"></i><span dir="auto">' + esc(pcatName(e.cat)) + '</span></span>' +
          '<span class="pd-srt" dir="auto">' + esc(nb(trT(e))) + '</span>' + SBIC.chev + '</button>' + pdOpts(e) + '</div>';
      }).join('') + '</div></section>';
    if (!h) h = '<p class="pz-none">' + esc(PT('pqNone')) + '</p>';
    body.innerHTML = h;
    fitAll(body);
  }
  // un résultat Predict : la carte s'ouvre dans Predict, amenée sous l'en-tête et soulignée un instant
  function openPredCard(id) {
    var e = evById(id); if (e && e.cat && pcat !== 'all' && pcat !== e.cat) pcat = 'all';
    topGo('pred');
    var c = box && box.querySelector('.pd-list [data-card="' + id + '"]'), mb = mbox(), pr = $('pzPers');
    if (!c || !mb) return;
    var top = c.getBoundingClientRect().top - (pr ? pr.getBoundingClientRect().bottom : mb.getBoundingClientRect().top) - 10;
    mb.scrollTop = Math.max(0, mb.scrollTop + top);
    c.classList.remove('pd-hl'); void c.offsetWidth; c.classList.add('pd-hl');
    setTimeout(function () { c.classList.remove('pd-hl'); }, 2200);
  }
  function renderHome() {
    if (sbOn === false) { renderList(); return; } // paris automatiques invisibles pour ce joueur : l'ancienne liste
    renderTop();
  }
  // la puce choisie reste visible dans sa rangée (ex. « Mar. 27 oct. » au bout de la rangée)
  function keepOn(row) { var on = row && row.querySelector('.on'); if (!on || row.scrollWidth <= row.clientWidth) return; var a = on.getBoundingClientRect(), r = row.getBoundingClientRect(); if (a.left < r.left || a.right > r.right) row.scrollLeft += (a.left + a.width / 2) - (r.left + r.width / 2); }
  function paintPers() { var p = $('pzPers'); if (p) { p.innerHTML = persHtml(); keepOn(p); } }
  function homeFx(rs) {
    var all = [], seen = {}, n = nowS(), q = normS(sbQ), fv = favs(), lgs = lgMap(rs);
    rs.forEach(function (r) { r.fx.forEach(function (f) { if (!seen[f.id] && f.ts > n) { seen[f.id] = 1; all.push(f); } }); });
    if (q) all = all.filter(function (f) { var l = lgs[f.lg] || {}; return normS(f.h.n + ' ' + f.a.n + ' ' + (l.n || '') + ' ' + (l.c || '')).indexOf(q) > -1; });
    else if (per === 'fav') all = all.filter(function (f) { return fv.l.indexOf(f.lg) > -1 || fv.f.indexOf(f.id) > -1; });
    else if (/^(m30|h\d+)$/.test(per)) { var lim = n + (per === 'm30' ? 1800 : +per.slice(1) * 3600); all = all.filter(function (f) { return f.ts <= lim; }); }
    all.sort(function (a, b) { return a.ts - b.ts || (a.id < b.id ? -1 : 1); });
    return { fx: all, lgs: lgs };
  }
  function paintHome() {
    var body = $('pzBody'); if (!body || view !== 'home') return;
    if (sbQ) { paintSearch(); return; } // recherche universelle (matchs + Predict)
    var days = needDays(), rs = days.map(function (d) { var c = sbData[sport + '|' + d]; return c && c.r; });
    if (rs.some(function (r) { return !r; })) {
      if (!body.firstChild) body.innerHTML = skelRows();
      sbLoad().then(function (out) {
        if (!alive() || view !== 'home' || !$('pzBody')) return;
        if (sbOn === false) { render(); return; }
        if (out.every(function (r) { return r; })) paintHome(); else if (!$('pzBody').querySelector('.pz-row:not(.pz-skel)')) $('pzBody').innerHTML = empty(XX().e_unavailable);
      });
      return;
    }
    var H = homeFx(rs), top = per === 'top' && !sbQ, allP = per === 'all' && !sbQ, lf = (top || allP) && sport === 'foot' && liveShown() ? liveFx().filter(function (f) { return !f.end; }) : [];
    var sig = [sport, per, hourF, sbQ, lg(), H.fx.map(function (f) { return f.id; }).join(','), lf.map(function (f) { return f.id; }).join(','), JSON.stringify(sbOpen)].join('|');
    if (body.dataset.sig === sig) { patchAll(body); return; }
    body.dataset.sig = sig;
    var blocks = [];
    if (top) { // 2026-10-22 (propriétaire) : « Top » = seulement les GRANDS matchs (grands clubs, classiques, derbys, Côte d'Ivoire / Sénégal), 20 au plus
      var n = NX(), x = SX(), big = lf.filter(isBig).concat(H.fx.filter(isBig)).slice(0, 20);
      if (!big.length && sport !== 'foot') big = H.fx.slice(0, 10); // autres sports sans grande compétition ce jour-là : les plus proches
      blocks = big.length ? ['<section class="pz-blk pz-btop"><div class="pz-bh"><b>★ ' + esc(n.topM) + '</b></div><div class="pz-lgb">' + big.map(function (f) { return rowHtml(f, { lg: 1, when: f.live ? '' : whenShort(f.ts), soon: 1 }); }).join('') + '</div></section>'] : ['<p class="pz-none">' + esc(x.noMatch) + '</p>'];
    } else {
      if (allP && lf.length) { // « Tout » : le direct d'abord (3 matchs), puis tous les matchs, jour par jour, championnat par championnat
        var n2 = NX(), ls2 = lf.slice().sort(function (a, b) { var A = sbLg(a.lg) || {}, B = sbLg(b.lg) || {}; return (A.p || 100) - (B.p || 100); }).slice(0, 3);
        blocks.push('<section class="pz-blk pz-blive"><div class="pz-bh"><b><i class="pz-ld"></i>' + esc(n2.live) + '<em>' + liveN() + '</em></b><button type="button" class="pz-more" data-go="live"><span>' + esc(n2.seeAll) + '</span>' + SBIC.chev + '</button></div>' +
          '<div class="pz-lgb">' + ls2.map(function (f) { return rowHtml(f, { lg: 1 }); }).join('') + '</div></section>');
      }
      blocks = blocks.concat(H.fx.length ? dayBlocks(H.fx, H.lgs, { dayHead: /^d\d+$/.test(per) || allP, fixed: allP }) : ['<p class="pz-none">' + esc(per === 'fav' && !sbQ ? SX().noFav : SX().noMatch) + '</p>']);
    }
    putBlocks(body, blocks);
  }
  // dessin par paquets : les 10 premiers blocs tout de suite, la suite quand on approche du bas (listes longues = rapides)
  function putBlocks(body, blocks) {
    var first = blocks.slice(0, 10), rest = blocks.slice(10);
    body.innerHTML = first.join('') + (rest.length ? '<i class="pz-more-s"></i>' : '');
    body.querySelectorAll('.pz-wh').forEach(fitEl); // « Demain » jamais coupé en deux
    if (body._io) { body._io.disconnect(); body._io = null; }
    if (rest.length && 'IntersectionObserver' in window) {
      var s = body.querySelector('.pz-more-s');
      body._io = new IntersectionObserver(function (en) {
        if (!en.some(function (e) { return e.isIntersecting; })) return;
        var part = rest.splice(0, 10), mark = body.querySelector('.pz-more-s');
        if (mark) mark.insertAdjacentHTML('beforebegin', part.join(''));
        body.querySelectorAll('.pz-wh').forEach(fitEl);
        if (!rest.length) { if (mark) mark.remove(); body._io.disconnect(); body._io = null; }
      }, { root: mbox(), rootMargin: '900px 0px' });
      body._io.observe(s);
    } else if (rest.length) body.insertAdjacentHTML('beforeend', rest.join(''));
  }

  // ---------- DIRECT ----------
  function renderLive() {
    var n = NX();
    shell(bar(n.live) + '<div id="pzLive" class="pz-body"></div>');
    paintLive();
    if (!liveData || Date.now() - liveData.at > 4000) liveProbe(true).then(function () { if (view === 'live') paintLive(); });
  }
  function paintLive() {
    var el = $('pzLive'); if (!el || view !== 'live') return;
    if (!liveData) { if (!el.firstChild) el.innerHTML = skelRows(); return; }
    var fx = liveFx(), sig = lg() + '|' + fx.map(function (f) { return f.id + (f.end ? 'e' : ''); }).join(',') + '|' + JSON.stringify(sbOpen);
    if (el.dataset.sig === sig) { patchAll(el); return; }
    el.dataset.sig = sig;
    if (!fx.length) {
      var c0 = sbData['foot|0'], soon = c0 && c0.r ? c0.r.fx.filter(function (f) { return f.ts > nowS() && f.ts - nowS() <= 7200; }).slice(0, 6) : [];
      el.innerHTML = '<p class="pz-none">' + esc(NX().noLive) + '</p>' + (soon.length ? '<section class="pz-blk"><div class="pz-bh"><b>' + esc(NX().soon) + '</b></div><div class="pz-lgb">' + soon.map(function (f) { return rowHtml(f, { lg: 1, soon: 1 }); }).join('') + '</div></section>' : '');
      return;
    }
    var lgs = {}; (liveData.r.lg || []).forEach(function (l) { lgs[l.id] = l; });
    var g = {}, order = [];
    fx.forEach(function (f) { if (!g[f.lg]) { g[f.lg] = []; order.push(f.lg); } g[f.lg].push(f); });
    order.sort(function (a, b) { return ((lgs[a] || {}).p || 100) - ((lgs[b] || {}).p || 100); });
    el.innerHTML = order.map(function (id) { var key = 'live|' + id; return lgSection(key, lgs[id] || { n: '' }, g[id], sbOpen[key] != null ? sbOpen[key] : true); }).join('');
  }

  // ---------- RÉSULTATS : 7 jours en puces (Aujourd'hui · Hier · Avant-hier · …) + calendrier (30 jours) ----------
  function dayOff(d) { var a = new Date(); a.setHours(12, 0, 0, 0); var b = new Date(d.getTime()); b.setHours(12, 0, 0, 0); return Math.round((b - a) / 864e5); }
  function offDate(o) { var d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() + o); return d; }
  function isoDay(d) { var p = function (v) { return (v < 10 ? '0' : '') + v; }; return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()); }
  function resLbl(o) { var n = NX(), x = SX(); if (o === 0) return x.today; if (o === -1) return n.yday; if (o === -2) return n.dbef; try { return cap1(offDate(o).toLocaleDateString(loc(), { weekday: 'short', day: 'numeric' })); } catch (e) { return isoDay(offDate(o)); } }
  function resChips() {
    var h = '', x = X();
    for (var o = 0; o >= -6; o--) h += '<button type="button" data-res="' + o + '" class="' + (resDay === o ? 'on' : '') + '"><span dir="auto">' + esc(resLbl(o)) + '</span></button>';
    var far = resDay < -6;
    return h + '<label class="pz-hr pz-rcal' + (far ? ' on' : '') + '">' + IC.cal + '<span dir="auto">' + esc(far ? cap1(offDate(resDay).toLocaleDateString(loc(), { day: 'numeric', month: 'short' })) : x.pDay) + '</span>' +
      '<input type="date" id="pzResCal" aria-label="' + esc(x.pDay) + '" min="' + isoDay(offDate(-29)) + '" max="' + isoDay(offDate(0)) + '" value="' + isoDay(offDate(resDay)) + '"></label>';
  }
  function renderResults() {
    var n = NX();
    shell(bar(n.results) + '<div class="pz-pers pz-hs" id="pzResD">' + resChips() + '</div><div id="pzRes" class="pz-body"></div>');
    paintResults();
  }
  var resPoll = 0;
  function paintResults() {
    var el = $('pzRes'); if (!el) return;
    var cd = $('pzResD'); if (cd) { cd.innerHTML = resChips(); var on = cd.querySelector('.on'); if (on && on.scrollIntoView && cd.scrollWidth > cd.clientWidth) { var r1 = on.getBoundingClientRect(), r2 = cd.getBoundingClientRect(); if (r1.left < r2.left || r1.right > r2.right) cd.scrollLeft += (r1.left + r1.width / 2) - (r2.left + r2.width / 2); } }
    var day = resDay, c = resData[day];
    if (!c || Date.now() - c.at > 60000 || (c.r && c.r.pending)) {
      if (!c || !c.r || !c.r.fx.length) el.innerHTML = skelRows();
      (async function () {
        var r = null;
        try { r = await D6.Api.post('sbResults', { day: day, tz: tzMin() }, 15000); } catch (e) { r = null; }
        if (r && r.ok) { r.fx = (r.fx || []).filter(function (f) { return f && f.h && f.a && Array.isArray(f.ft); }); resData[day] = { r: r, at: Date.now(), tries: ((resData[day] || {}).tries || 0) + 1 }; }
        else if (!resData[day]) resData[day] = { r: null, at: Date.now() - 50000 };
        if (view === 'results' && resDay === day) {
          paintResults2();
          // jour lu par le serveur juste après la réponse : on redemande quelques secondes après (au plus 5 fois)
          clearTimeout(resPoll);
          if (r && r.ok && r.pending && resData[day].tries < 6) resPoll = setTimeout(function () { if (view === 'results' && resDay === day) paintResults(); }, 4000);
        }
      })();
      if (!c || !c.r || !c.r.fx.length) return;
    }
    paintResults2();
  }
  function paintResults2() {
    var el = $('pzRes'), c = resData[resDay]; if (!el || !c) return;
    if (!c.r) { el.innerHTML = '<p class="pz-none">' + esc(XX().e_unavailable) + '</p>'; return; }
    var r = c.r, n = NX();
    if (!r.fx.length) { el.innerHTML = r.pending ? skelRows() : '<p class="pz-none">' + esc(n.noRes) + '</p>'; return; }
    var lgs = {}; (r.lg || []).forEach(function (l) { lgs[l.id] = l; });
    var g = {}, order = [];
    r.fx.forEach(function (f) { if (!g[f.lg]) { g[f.lg] = []; order.push(f.lg); } g[f.lg].push(f); });
    order.sort(function (a, b) { return ((lgs[a] || {}).p || 100) - ((lgs[b] || {}).p || 100); });
    putBlocks(el, order.map(function (id) {
      var l = lgs[id] || { n: '' };
      return '<section class="pz-lg on pz-reslg"><div class="pz-lgh">' + lgImg(l) + '<span class="pz-lgn"><b dir="auto">' + esc(l.n || '') + '</b>' + (l.c ? '<small dir="auto">' + esc(l.c) + '</small>' : '') + '</span></div><div class="pz-lgb">' +
        g[id].map(function (f) {
          var w = f.ft[0] > f.ft[1] ? 'h' : f.ft[1] > f.ft[0] ? 'a' : '';
          return '<div class="pz-row pz-rres"><div class="pz-rt"><b dir="ltr">' + esc(hm24(f.ts)) + '</b><small>' + esc(n.ftS || n.ft) + '</small></div><div class="pz-rn">' +
            '<p class="' + (w === 'h' ? 'w' : '') + '">' + tlogo(f.h.lo, 'pz-tlo') + '<span dir="auto">' + esc(f.h.n) + '</span><b class="pz-sc">' + f.ft[0] + '</b></p>' +
            '<p class="' + (w === 'a' ? 'w' : '') + '">' + tlogo(f.a.lo, 'pz-tlo') + '<span dir="auto">' + esc(f.a.n) + '</span><b class="pz-sc">' + f.ft[1] + '</b></p></div>' +
            (f.ht ? '<small class="pz-ht" dir="ltr">' + esc(n.htS) + ' ' + f.ht[0] + '-' + f.ht[1] + '</small>' : '<i></i>') + '</div>';
        }).join('') + '</div></section>';
    }));
  }

  // ---------- MENU ----------
  function accMode() { var a = lsGet('oro_sp_acc', 'none'); return a === 'up' || a === 'any' ? a : 'none'; }
  function renderMenu() {
    var n = NX(), x = SX(), xx = XX(), acc = accMode();
    var sl = sbSports.length ? sbSports : [{ s: 'foot', n: 'Football' }];
    var sp = sbOn ? sl.map(function (s) { return '<button type="button" data-sp="' + esc(s.s) + '">' + sico(spIco(s.s)) + '<span dir="auto">' + esc(spName(s)) + '</span></button>' + (s.s === 'foot' ? predChip().replace(' on"', '"') : ''); }).join('') : ''; // 2026-10-22 : Predict aussi dans le Menu
    if (hasQ() && sbOn) sp += '<button type="button" data-sp="news">' + SBIC.news + '<span>' + esc(x.news) + '</span></button>';
    var row = function (act, ico, t) { return '<button type="button" class="pz-mrow" data-menu="' + act + '"><span class="pz-mi">' + ico + '</span><span class="pz-mt" dir="auto">' + esc(t) + '</span>' + SBIC.chev + '</button>'; };
    var html = bar(n.nMenu) + '<div class="pz-menu">' +
      (sp ? '<div class="pz-sports pz-hs">' + sp + '</div>' : '') + // 2026-10-22 (propriétaire) : sans le titre « Sports »
      // 2026-10-22 (propriétaire) : menu utile et court — Sports, Direct, Résultats, Mes paris, Favoris, Charger un code, Si la cote change
      '<div class="pz-mcard">' + (sbOn && liveShown() ? row('live', NAVI.live, n.nLive) : '') + (sbOn ? row('res', IC.ok, n.results) : '') + row('mine', NAVI.mine, n.nMine) + (sbOn ? row('fav', '<b class="pz-mstar">★</b>', x.fav) : '') + '</div>' +
      (sbOn ? '<div class="pz-mcard pz-mcode"><p class="pz-mt2">' + esc(x.loadCode) + '</p>' + codeRow() +
        (slip.some(function (s) { return s.sb; }) ? '<div class="sb-code" id="sbCode">' + codeBox(true) + '</div>' : '') + '</div>' : '') +
      '<div class="pz-mcard"><p class="pz-mt2">' + esc(xx.accT) + '</p>' + [['none', xx.accNone], ['up', xx.accUp], ['any', xx.accAny]].map(function (o) {
        return '<label class="pz-rad"><input type="radio" name="pzAcc" value="' + o[0] + '"' + (acc === o[0] ? ' checked' : '') + '><i></i><span dir="auto">' + esc(o[1]) + '</span></label>'; }).join('') + '</div></div>'; // (propriétaire : aucune règle écrite dans Paris)
    shell(html);
    bindCodeRow(box); if (sbOn) bindCodeBox();
    box.querySelectorAll('input[name="pzAcc"]').forEach(function (i) { i.addEventListener('change', function () { if (i.checked) lsSet('oro_sp_acc', i.value); }); });
  }
  function menuAct(a) {
    if (a === 'res') { go('results'); return; }
    if (a === 'mine') { go('mine'); return; }
    if (a === 'live') { go('live'); return; }
    if (a === 'fav') { per = 'fav'; sbQ = ''; sport = 'foot'; go('home'); }
  }

  // ---------- ACTUALITÉ (questions : crypto, politique, événements) / ancienne liste quand les paris automatiques sont invisibles ----------
  function renderList() {
    var x = XX(), news = view === 'news';
    if (news && !hasTop()) { renderTop(); return; } // Actualité : même haut de page que Football / Predict (liste dans #pzBody)
    var body = news ? $('pzBody') : null;
    if (body && sbQ) { paintSearch(); return; }
    var evs = sbOn ? events.filter(function (e) { return isQev(e) && !e.pred; }) : events; // jamais les anciens matchs de l'admin en double (ils sont dans Football) ; Predict a sa page
    var head = '';
    if (body) body.dataset.sig = '';
    if (!evs.length) { if (body) body.innerHTML = empty(x.none); else shell(head + (sbOn === null && !lastList ? skeleton() : empty(x.none))); fitAll(box); return; }
    var bw = box.clientWidth || 0; if (bw > 0) gridCols = Math.max(1, Math.floor((bw + 10) / 340));
    var items = feed(evs, gridCols);
    var key = function (it) { return it.res ? 'res' : it.tail ? 'q' : it.ins ? null : new Date(it.e.start * 1000).toDateString(); };
    var list = document.createElement('div'), last = '', fresh = [], keep = {};
    list.className = 'sp2-list';
    items.forEach(function (it) {
      var k = key(it), e = it.e;
      if (k && k !== last) { last = k; list.insertAdjacentHTML('beforeend', '<h4 class="sp2-day' + (k === 'q' ? ' sp2-dq' : '') + '"><span class="fit">' + esc(k === 'res' ? x.results : k === 'q' ? x.sport.event : dayLabel(e.start)) + '</span></h4>'); }
      keep[e.id] = 1;
      list.appendChild(cardEl(e, it.ins, fresh));
    });
    Object.keys(cardCache).forEach(function (id) { if (!keep[id]) delete cardCache[id]; });
    if (body) { body.innerHTML = ''; body.appendChild(list); }
    else { shell(head + '<i id="pzListAt"></i>'); var at = $('pzListAt'); at.parentNode.replaceChild(list, at); }
    list.addEventListener('click', function (ev) { var b = ev.target.closest && ev.target.closest('.sp2-o'); if (b && !b.disabled) pick(b); });
    fitAll(box); startTick();
  }
  /* ---------- PREDICT (2026-10-22, propriétaire) — prédictions façon Polymarket / Kalshi : crypto, politique, économie,
     divertissement, sport, tech, monde. Puce spéciale juste après Football ; catégories ; carte = question entière (jamais
     coupée), compte à rebours, explication courte, prix actuel pour la crypto (lu par NOTRE serveur, predPrice), GRANDS boutons
     de choix en rangées de 2–3, petit lien vers la source. Tout est sur la carte (pas de fiche, pas de flèche). Nom : clé i18n predName. */
  var PCATS = ['crypto', 'politique', 'economie', 'divertissement', 'sport', 'tech', 'monde'];
  var PCK = { all: 'predAll', crypto: 'predCrypto', politique: 'predPol', economie: 'predEco', divertissement: 'predEnt', sport: 'predSport', tech: 'predTech', monde: 'predWorld' };
  var PEN = { predName: 'Predict', predAll: 'All', predCrypto: 'Crypto', predPol: 'Politics', predEco: 'Economy', predEnt: 'Entertainment', predSport: 'Sport', predTech: 'Tech', predWorld: 'World',
    predNone: 'No predictions right now. New ones are coming soon.', predSrc: 'Official source', predNow: 'Current price', pqMatches: 'Matches', pqNone: 'No results.' };
  function PT(k) { return T18(k, PEN[k] || k); }
  var pcat = 'all';
  // petit signe : un œil / cristal avec une étincelle (animée doucement par la feuille de style)
  var PRED_IC = '<svg class="sp-ico pd-ic" viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id="pdIcG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FDE68A"/><stop offset="1" stop-color="#D97706"/></linearGradient></defs>' +
    '<path d="M2.6 12.4C5 8.1 8.3 6 12 6s7 2.1 9.4 6.4c-2.4 4.3-5.7 6.4-9.4 6.4s-7-2.1-9.4-6.4z" fill="none" stroke="url(#pdIcG)" stroke-width="1.7" stroke-linejoin="round"/>' +
    '<circle cx="12" cy="12.4" r="3.3" fill="url(#pdIcG)"/><circle cx="10.9" cy="11.3" r="1" fill="#1B1442" opacity=".55"/>' +
    '<path class="pd-sp" d="M19.2 2.2l.6 1.6 1.6.6-1.6.6-.6 1.6-.6-1.6-1.6-.6 1.6-.6z" fill="#FDE68A"/></svg>';
  function predEvs() { return events.filter(function (e) { return e.pred && e.open; }); }
  function predChip() {
    if (!predEvs().length) return '';
    return '<button type="button" data-sp="pred" class="pd-chip' + (view === 'pred' ? ' on' : '') + '">' + PRED_IC + '<span dir="ltr">' + esc(PT('predName')) + '</span></button>';
  }
  function pcatName(c) { return PT(PCK[c] || 'predWorld'); }
  // nom de l'actif (« Bitcoin »), jamais le code de la paire (BTC/USDT)
  var ASSETN = { BTC: 'Bitcoin', ETH: 'Ethereum', SOL: 'Solana', XRP: 'XRP', BNB: 'BNB', DOGE: 'Dogecoin', ADA: 'Cardano', LINK: 'Chainlink', LTC: 'Litecoin', TON: 'Toncoin', AVAX: 'Avalanche', DOT: 'Polkadot', TRX: 'TRON', SHIB: 'Shiba Inu', PAXG: 'PAXG', EUR: 'EUR' };
  function assetName(a) {
    var m = /^([A-Z0-9]+?)(USDT|USDC|FDUSD|BUSD|USD)$/.exec(a || ''), q = /^([A-Z0-9]+?)(BTC|ETH|BNB)$/.exec(a || '');
    if (m) return m[1] === 'EUR' ? 'EUR/USD' : ASSETN[m[1]] || m[1];
    return q ? q[1] + '/' + q[2] : a;
  }
  // nombres jamais coupés en fin de ligne (« 2 200 $ », « 12 h », « 85 000 $ »)
  function nb(s) { return String(s).replace(/(\d) (?=\d{3}\b)/g, '$1\u00a0').replace(/(\d) (?=[$%€h]\b|[$%€])/g, '$1\u00a0').replace(/ (?=[?!:;»])/g, '\u00a0'); }
  function pdOpts(e) {
    var n = e.opts.length, cols = n === 2 || n === 4 ? 2 : 3, lk = !!e.susp;
    return '<div class="sp2-odds pd-o pd-c' + cols + '">' + e.opts.map(function (o) {
      var on = inSlip(e.id, o.k);
      return '<button type="button" class="sp2-o pd-b' + (on ? ' on' : '') + (lk ? ' pd-lk' : '') + '" data-ev="' + esc(e.id) + '" data-k="' + esc(o.k) + '" aria-pressed="' + on + '"' + (e.open && !lk ? '' : ' disabled') + '>' +
        '<span dir="auto">' + esc(nb(trOp(e, o))) + '</span><b>' + (lk ? IC.lock : '<i class="sp2-ov">' + Number(o.odd).toFixed(2) + '</i>') + '</b></button>';
    }).join('') + '</div>';
  }
  function predCard(e) {
    var l = lg(), d = e.desc ? (l === 'fr' ? e.desc.fr || e.desc.en : e.desc.en || e.desc.fr) : '', s = e.start - nowS();
    return '<article class="sp2-ev pd-ev' + (e.open ? '' : ' shut') + '" data-card="' + esc(e.id) + '">' +
      '<div class="pd-top"><span class="pd-cat c-' + esc(e.cat) + '"><i class="pd-dot"></i><span dir="auto">' + esc(pcatName(e.cat)) + '</span></span>' +
      '<span class="pd-cd' + (s < 3600 ? ' soon' : '') + '">' + IC.clock + '<b data-pcd="' + e.start + '">' + esc(pcdTxt(s)) + '</b></span></div>' +
      (/^[a-f0-9]{16}$/.test(e.img || '') ? '<div class="pd-hd"><img class="pd-im" src="sp-logo.php?k=' + e.img + '" alt="" loading="lazy" decoding="async"><p class="pd-t" dir="auto">' + esc(nb(trT(e))) + '</p></div>' : '<p class="pd-t" dir="auto">' + esc(nb(trT(e))) + '</p>') +
      (d ? '<p class="pd-d" dir="auto">' + esc(nb(d)) + '</p>' : '') +
      (e.asset ? '<p class="pd-px"><span dir="auto">' + esc(PT('predNow')) + '</span><i aria-hidden="true">·</i><bdi>' + esc(assetName(e.asset)) + '</bdi> <b dir="ltr" data-px="' + esc(e.asset) + '">' + (pdPx[e.asset] ? pxCur(e.asset, pdPx[e.asset]) : '…') + '</b></p>' : '') +
      pdOpts(e) + '</article>'; // (propriétaire, 2026-10-22 : plus de lien vers la source sur la carte — l'admin la garde)
  }
  function predSorted() { return predEvs().sort(function (a, b) { return (b.auto ? 1 : 0) - (a.auto ? 1 : 0) || a.start - b.start; }); } // priorité : réglées automatiquement (crypto)
  function pcatHtml() {
    var cnt = {}; predEvs().forEach(function (e) { cnt[e.cat] = (cnt[e.cat] || 0) + 1; });
    if (pcat !== 'all' && !cnt[pcat]) pcat = 'all';
    return ['all'].concat(PCATS.filter(function (c) { return cnt[c]; })).map(function (c) {
      return '<button type="button" data-pcat="' + c + '" class="' + (pcat === c ? 'on' : '') + '"><span dir="auto">' + esc(pcatName(c)) + '</span></button>';
    }).join('');
  }
  // Predict : même haut de page que Football (recherche, sports, puis les catégories à la place des périodes)
  function renderPred() { renderTop(); }
  function paintPredBody() {
    var body = $('pzBody'); if (!body || view !== 'pred') return;
    var all = predSorted(), list = pcat === 'all' ? all : all.filter(function (e) { return e.cat === pcat; });
    body.dataset.sig = '';
    body.innerHTML = list.length ? '<div class="sp2-list pd-list">' + list.map(predCard).join('') + '</div>' : empty(PT('predNone'));
    fitAll(body); startTick(); pdPxLoad();
  }
  function pxTxt(v) { var n = Number(v); return n >= 100 ? n.toLocaleString(loc(), { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : n.toLocaleString(loc(), { maximumFractionDigits: n >= 1 ? 4 : 6 }); }
  // compte à rebours jusqu'à la fermeture : « 2 j 04:12:33 » (jours dans la langue du joueur), puis « 04:12:33 »
  function pcdTxt(s) { if (s <= 0) return XX().closed; var d = Math.floor(s / 86400); return (d ? '\u2068' + ufmt('day', d) + '\u2069 ' : '') + '\u2066' + clock(s % 86400) + '\u2069'; } // (isolés : bon ordre aussi en arabe)
  // prix ACTUEL des actifs crypto : lu par NOTRE serveur (predPrice, gardé 30 s), relu toutes les 30 s seulement quand Predict est à l'écran
  var pdPx = {}, pdPxT = 0;
  // « 82 171,90 $ » (fr), « $82,171.90 » (en)… : le dollar à la place de la langue du joueur ; ETH/BTC : en BTC
  function pxCur(a, v) {
    var m = /(USDT|USDC|FDUSD|BUSD|USD)$/.exec(a || ''), q = /^[A-Z0-9]+?(BTC|ETH|BNB|EUR)$/.exec(a || ''), n = Number(v);
    if (!m) return pxTxt(v) + (q ? ' ' + q[1] : '');
    try { return n.toLocaleString(loc(), { style: 'currency', currency: 'USD', currencyDisplay: 'narrowSymbol', minimumFractionDigits: n >= 100 ? 2 : 0, maximumFractionDigits: n >= 100 ? 2 : n >= 1 ? 4 : 6 }).replace(/\u202f/g, '\u00a0'); } catch (e) { return '$' + pxTxt(v); }
  }
  function pdPxPaint() { if (!box) return; box.querySelectorAll('[data-px]').forEach(function (el) { var a = el.getAttribute('data-px'), v = pdPx[a]; var tx = v ? pxCur(a, v) : '…'; if (el.textContent !== tx) el.textContent = tx; }); }
  function pdPxLoad() {
    clearTimeout(pdPxT); pdPxT = 0;
    if (!alive() || view !== 'pred') return;
    if (!document.hidden) {
      var as = {}; predEvs().forEach(function (e) { if (e.asset) as[e.asset] = 1; });
      Object.keys(as).slice(0, 20).forEach(function (a) {
        if (D6.Api && D6.Api.post) D6.Api.post('predPrice', { asset: a }, 10000).then(function (r) { if (r && r.ok && r.px > 0) { pdPx[a] = +r.px; pdPxPaint(); } }).catch(function () {});
      });
    }
    pdPxT = setTimeout(pdPxLoad, 30000);
  }
  // ---------- PAGE D'UN MATCH ----------
  var GRP = [['main', 'gMain'], ['goals', 'gGoals'], ['tot', 'gTot'], ['half', 'gHalf'], ['hcp', 'gHcp'], ['cs', 'gCs'], ['combo', 'gCombo']];
  function grpOf(mk, sp) {
    var f = mkParts(mk)[0];
    if (sp && sp !== 'foot') return f === 'ou' ? 'tot' : f === 'ah' ? 'hcp' : 'main'; // autres sports : Principaux · Totaux · Handicap
    if (f === '1x2' || f === 'dc' || f === 'dnb' || f === 'btts' || f === '12' || mk === 'ou:2.5') return 'main';
    if (f === 'cs' || f === 'htcs') return 'cs';
    if (f === 'ah' || f === 'eh' || f === 'htah') return 'hcp';
    if (/^(ht|2h)/.test(f) || f === 'hsh') return 'half';
    if (f === 'rbtts' || f === 'rou') return 'combo';
    return 'goals'; // buts, équipes, défense (n'encaisse pas, gagne sans encaisser)
  }
  function openMatch(fid) {
    var mb = mbox();
    if (view !== 'match') { matchFrom = view; if (mb) scrollMem[view] = mb.scrollTop; }
    sbMid = fid; sbM = null; mGrp = 'main'; trkTab = ''; view = 'match'; render();
    if (mb) mb.scrollTop = 0;
    loadMatch(fid, true);
    schedule();
  }
  async function loadMatch(fid, first) {
    var r = null;
    try { r = await D6.Api.post('sbMatch', { id: fid }, 15000); } catch (e) { r = null; }
    if (sbMid !== fid || view !== 'match' || !alive()) return;
    if (r && r.ok && r.fx) { r.mk = Array.isArray(r.mk) ? r.mk.filter(function (m) { return m && m.mk && Array.isArray(m.o) && m.o.length; }) : []; noteLive(r.fx, 'match'); sbM = r; }
    else if (first || !sbM) sbM = { ok: false, reason: r ? r.reason : 'unavailable' };
    else return; // erreur passagère : on garde ce qui est affiché
    paintMatch();
    if (sbM && sbM.ok && sbM.fx && sbM.fx.live) statsTick(fid, sbM.fx);
  }
  function curFx() { return (sbM && sbM.fx) || sbFx(sbMid); }
  /* 2026-10-22 (propriétaire : « sous les logos c'est vide ») — statistiques du match en direct (sbStats), page ouverte :
     au plus toutes les 30 s (le serveur garde 60 s par match), 8 s si une lecture est en cours ; jamais bloquant. */
  var STX = { fid: '', st: null, busy: false, next: 0 };
  function statsTick(fid, f) {
    if (!f || !f.live || f.end) return;
    if (STX.fid !== fid) STX = { fid: fid, st: null, busy: false, next: 0 };
    if (STX.busy || Date.now() < STX.next || !alive() || document.hidden) return;
    STX.busy = true;
    D6.Api.post('sbStats', { id: fid }, 15000).then(function (r) {
      if (STX.fid !== fid) return;
      STX.busy = false;
      if (r && r.ok) { if (r.stats && typeof r.stats === 'object') STX.st = r.stats; STX.next = Date.now() + (r.pend ? 8000 : 30000); }
      else STX.next = Date.now() + 60000;
      if (view === 'match' && sbMid === fid && sbM && sbM.ok && sbM.fx && sbM.fx.live) tvSync(curFx(), sbM);
    }).catch(function () { if (STX.fid === fid) { STX.busy = false; STX.next = Date.now() + 60000; } });
  }
  function liveStats(f, trk) {
    var st = trk && trk.stats && typeof trk.stats === 'object' && !Array.isArray(trk.stats) ? trk.stats : null;
    var sx = f && STX.fid === f.id && STX.st ? STX.st : null;
    if (!sx) return st;
    // sbMatch (relu toutes les quelques secondes) garde la main ; sbStats complète ce qui manque (fautes, arrêts…) et les cartons
    var o = Object.assign({}, sx, st || {});
    ['yellow', 'red'].forEach(function (k) { if (Array.isArray(sx[k]) && Array.isArray(o[k])) o[k] = [Math.max(+o[k][0] || 0, +sx[k][0] || 0), Math.max(+o[k][1] || 0, +sx[k][1] || 0)]; });
    return o;
  }
  function renderMatch() {
    var f = curFx(), l = f ? (sbLg(f.lg, spOf(f)) || (sbM && sbM.fx ? { n: sbM.fx.lgn || '', c: sbM.fx.c || '', f: '' } : null)) : null;
    var fv = favs(), isF = f && fv.f.indexOf(f.id) > -1;
    var star = f ? '<button type="button" class="pz-star' + (isF ? ' on' : '') + '" data-fav="' + esc(f.id) + '" aria-pressed="' + !!isF + '" aria-label="' + esc(SX().fav) + '">' + (isF ? '★' : '☆') + '</button>' : '';
    shell(bar(l && l.n ? l.n : spName({ s: f ? spOf(f) : 'foot' }), star, l && l.c ? l.c : '') + '<div id="pzMh"></div><div id="pzTrk"></div><div class="pz-gch pz-hs" id="pzG"></div><div id="pzMk" class="pz-mks"></div>'); // (propriétaire : aucune règle écrite dans la page du match)
    paintMatch();
  }
  function paintMatch() {
    if (view !== 'match' || !$('pzMk')) return;
    var f = curFx(), r = sbM, x = SX(), xx = XX();
    var mh = $('pzMh'), tk = $('pzTrk'), gc = $('pzG'), mk = $('pzMk');
    if (!f) { mh.innerHTML = ''; mk.innerHTML = r ? '<p class="pz-none">' + esc(r.reason === 'closed' ? x.closedM : xx.e_unavailable) + '</p>' : skelRows(); return; }
    // en-tête : refait seulement si sa forme change (avant-match ↔ direct) ; score / minute changés sur place
    var hs = f.id + '|' + (f.live ? 1 : 0) + '|' + lg();
    if (mh.dataset.sig !== hs) { mh.dataset.sig = hs; mh.innerHTML = f.live ? tvHtml(f) : mhHtml(f); if (f.live) { TV.fid = ''; bindTv(); } }
    else if (f.live) {
      var sc = $('pzSc'), mi = $('pzMinT'), t = scTxt(f);
      if (sc && sc.textContent !== t) { sc.textContent = t; sc.classList.remove('pop'); void sc.offsetWidth; sc.classList.add('pop'); }
      if (mi && mi.textContent !== minTxt(f)) mi.textContent = minTxt(f);
      var mm = $('pzMin'); if (mm) mm.classList.toggle('end', !!(f.end || f.st === 'FT'));
      mh.querySelectorAll('[data-rc]').forEach(function (e) { var v = +((f.rc || [0, 0])[+e.getAttribute('data-rc')] || 0); e.hidden = !v; });
    }
    // direct : la mini télé (terrain simulé + infos) remplace les onglets Statistiques / Événements
    if (f.live) tvSync(f, r && r.ok ? r : null);
    if (tk.firstChild) tk.innerHTML = '';
    if (!r) { // chargement : le 1 · X · 2 de la liste (ou des cadenas), jamais vide
      if (!mk.firstChild) { var m0 = f.o && f.o.o && f.o.o.length ? f.o : { mk: '1x2', o: [] }; mk.innerHTML = mkCards([{ mk: m0.mk || '1x2', o: m0.o, s: f.live && (f.susp || f.end) ? 1 : 0 }], f); mk.dataset.sig = ''; }
      return;
    }
    // le résultat du match (1 · X · 2) toujours là en football, cadenas si le marché manque
    if (r.ok && /^foot:/.test(f.id) && !r.mk.some(function (m) { return m.mk === '1x2'; }) && (r.mk.length || f.live)) r.mk.unshift({ mk: '1x2', o: [], s: 1 });
    if (!r.ok || !r.mk.length) { gc.innerHTML = ''; mk.innerHTML = '<p class="pz-none">' + esc(f.live ? NX().susp : x.closedM) + '</p>'; mk.dataset.sig = ''; return; }
    var by = {}, fsp = spOf(f); r.mk.forEach(function (m) { var g = grpOf(m.mk, fsp); (by[g] = by[g] || []).push(m); });
    var gs = GRP.filter(function (g) { return by[g[0]]; });
    if (!by[mGrp]) mGrp = gs[0][0];
    var gsig = gs.map(function (g) { return g[0]; }).join(',') + '|' + mGrp + '|' + lg();
    if (gc.dataset.sig !== gsig) {
      gc.dataset.sig = gsig;
      gc.innerHTML = gs.length > 1 ? gs.map(function (g) { return '<button type="button" data-g="' + g[0] + '" class="' + (g[0] === mGrp ? 'on' : '') + '"><span>' + esc(g[0] === 'tot' ? T18('sbGTot', 'Totals') : x[g[1]]) + '</span></button>'; }).join('') : '';
      gc.hidden = gs.length < 2;
      var gon = gc.querySelector('.on'); // la puce choisie reste visible dans sa rangée
      if (gon && gc.scrollWidth > gc.clientWidth) { var gr = gon.getBoundingClientRect(), cr = gc.getBoundingClientRect(); if (gr.left < cr.left || gr.right > cr.right) gc.scrollLeft += (gr.left + gr.width / 2) - (cr.left + cr.width / 2); }
    }
    var msig = mGrp + '|' + by[mGrp].map(function (m) { return m.mk + ':' + fullO(m.mk, m.o).map(function (o) { return o[0]; }).join('.'); }).join(',') + '|' + lg();
    if (mk.dataset.sig !== msig) { mk.dataset.sig = msig; mk.innerHTML = mkCards(by[mGrp], f); }
    else patchAll(mk);
  }
  function mhHtml(f) {
    var n = NX(), live = !!f.live, s = f.ts - nowS(), rc = f.rc || [0, 0];
    var card = function (i) { return '<i class="pz-card r" data-rc="' + i + '"' + (+rc[i] ? '' : ' hidden') + '></i>'; };
    var mid = live ? '<b class="pz-msc" id="pzSc" dir="ltr">' + esc(scTxt(f)) + '</b><em class="pz-mmin' + (f.end || f.st === 'FT' ? ' end' : '') + '" id="pzMin"><i class="pz-ld"></i><span id="pzMinT">' + esc(minTxt(f)) + '</span></em>'
      : '<b class="pz-mtime" dir="ltr">' + esc(hm24(f.ts)) + '</b><small dir="auto">' + esc(cap1(dshort(f.ts))) + '</small>' +
        (s > 0 && s < 86400 ? '<em class="pz-mcd"><small dir="auto">' + esc(n.startsIn) + '</small><b data-cd="' + f.ts + '" dir="ltr">' + clock(s) + '</b></em>' : '');
    return '<div class="pz-mh' + (live ? ' lv' : '') + '"><div class="pz-mtm">' + tlogo(f.h.lo, 'pz-mlo') + '<b dir="auto">' + esc(f.h.n) + (live ? card(0) : '') + '</b></div>' +
      '<div class="pz-mmid">' + mid + '</div><div class="pz-mtm">' + tlogo(f.a.lo, 'pz-mlo') + '<b dir="auto">' + esc(f.a.n) + (live ? card(1) : '') + '</b></div></div>';
  }
  function trkHtml(r) {
    var t = r.trk || {}, n = NX(), st = t.stats && typeof t.stats === 'object' && !Array.isArray(t.stats) ? t.stats : null, ev = Array.isArray(t.events) ? t.events.filter(function (e) { return e && e.type; }) : [];
    var K = [['poss', n.poss, '%'], ['shots', n.shots], ['shotsOn', n.shotsOn], ['corners', n.corners], ['attacks', n.attacks], ['dangerous', n.dangerous], ['yellow', n.yellow], ['red', n.reds]];
    var rows = st ? K.filter(function (k) { return Array.isArray(st[k[0]]); }) : [];
    if (!rows.length && !ev.length) return '';
    var tab = trkTab || (rows.length ? 'st' : 'ev');
    if (tab === 'st' && !rows.length) tab = 'ev';
    var head = '<div class="pz-seg"><button type="button" data-trk="st" class="' + (tab === 'st' ? 'on' : '') + '"' + (rows.length ? '' : ' disabled') + '><span>' + esc(n.tSt) + '</span></button>' +
      '<button type="button" data-trk="ev" class="' + (tab === 'ev' ? 'on' : '') + '"><span>' + esc(n.tEv) + '</span></button></div>';
    var body;
    if (tab === 'st') body = rows.map(function (k) {
      var h = +st[k[0]][0] || 0, a = +st[k[0]][1] || 0, tot = h + a, ph = tot ? h / tot * 100 : 50, u = k[2] || '';
      return '<div class="pz-stt"><p><b dir="ltr">' + h + u + '</b><span dir="auto">' + esc(k[1]) + '</span><b dir="ltr">' + a + u + '</b></p><i class="pz-sbar"><i style="width:' + ph.toFixed(1) + '%"></i><i style="width:' + (100 - ph).toFixed(1) + '%"></i></i></div>';
    }).join('');
    else body = ev.length ? ev.slice(-10).reverse().map(function (e) {
      var ic = e.type === 'goal' ? '<span class="pz-evb">⚽</span>' : e.type === 'card' ? '<i class="pz-card ' + (e.detail === 'red' ? 'r' : 'y') + '"></i>' : e.type === 'subst' ? '<svg class="pz-evs" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4v14M3.5 14.5L7 18l3.5-3.5M17 20V6M13.5 9.5L17 6l3.5 3.5"/></svg>' : '<b class="pz-var">VAR</b>';
      var det = e.type === 'goal' && e.detail === 'pen' ? ' (' + n.pen + ')' : e.type === 'goal' && e.detail === 'og' ? ' (' + n.og + ')' : e.type === 'var' && e.detail ? ' · ' + e.detail : '';
      var who = (e.player || (e.type === 'subst' ? n.sub : '')) + det;
      return '<div class="pz-ev ' + (e.team === 'a' ? 'a' : 'h') + '"><em dir="ltr">' + (+e.t || 0) + (+e.x ? '+' + (+e.x) : '') + '’</em>' + ic + '<span dir="auto">' + esc(who) + '</span></div>';
    }).join('') : '<p class="pz-none">' + esc(n.noEv) + '</p>';
    return '<div class="pz-trk">' + head + '<div class="pz-trkb ' + tab + '">' + body + '</div></div>';
  }
  /* 2026-10-22 (propriétaire) — DIRECT « mini télé » : petits textes (12 langues) */
  var TVK = ['att', 'dang', 'cor', 'card', 'el', 'h1', 'h2', 'pitch', 'info', 'fouls', 'offs', 'saves'];
  var TVL = {
    fr: ['ATTAQUE', 'ATTAQUE DANGEREUSE', 'CORNER', 'CARTON', 'Temps écoulé', '1re mi-temps', '2e mi-temps', 'Diffusion', 'Informations', 'Fautes', 'Hors-jeu', 'Arrêts'],
    en: ['ATTACK', 'DANGEROUS ATTACK', 'CORNER', 'CARD', 'Time played', '1st half', '2nd half', 'Live view', 'Information', 'Fouls', 'Offsides', 'Saves'],
    es: ['ATAQUE', 'ATAQUE PELIGROSO', 'CÓRNER', 'TARJETA', 'Tiempo jugado', '1.ª parte', '2.ª parte', 'Transmisión', 'Información', 'Faltas', 'Fueras de juego', 'Paradas'],
    pt: ['ATAQUE', 'ATAQUE PERIGOSO', 'ESCANTEIO', 'CARTÃO', 'Tempo de jogo', '1.º tempo', '2.º tempo', 'Transmissão', 'Informações', 'Faltas', 'Impedimentos', 'Defesas'],
    ar: ['هجمة', 'هجمة خطيرة', 'ركنية', 'بطاقة', 'الوقت المنقضي', 'الشوط الأول', 'الشوط الثاني', 'البث', 'معلومات', 'الأخطاء', 'التسلل', 'التصديات'],
    tr: ['ATAK', 'TEHLİKELİ ATAK', 'KORNER', 'KART', 'Geçen süre', '1. yarı', '2. yarı', 'Yayın', 'Bilgi', 'Faul', 'Ofsayt', 'Kurtarış'],
    vi: ['TẤN CÔNG', 'TẤN CÔNG NGUY HIỂM', 'PHẠT GÓC', 'THẺ PHẠT', 'Thời gian', 'Hiệp 1', 'Hiệp 2', 'Trực tiếp', 'Thông tin', 'Phạm lỗi', 'Việt vị', 'Cứu thua'],
    id: ['SERANGAN', 'SERANGAN BERBAHAYA', 'SEPAK POJOK', 'KARTU', 'Waktu berjalan', 'Babak 1', 'Babak 2', 'Siaran', 'Informasi', 'Pelanggaran', 'Offside', 'Penyelamatan'],
    ru: ['АТАКА', 'ОПАСНАЯ АТАКА', 'УГЛОВОЙ', 'КАРТОЧКА', 'Прошло времени', '1-й тайм', '2-й тайм', 'Трансляция', 'Информация', 'Фолы', 'Офсайды', 'Сейвы'],
    de: ['ANGRIFF', 'GEFÄHRLICHER ANGRIFF', 'ECKE', 'KARTE', 'Gespielte Zeit', '1. Halbzeit', '2. Halbzeit', 'Live-Ansicht', 'Infos', 'Fouls', 'Abseits', 'Paraden'],
    zh: ['进攻', '危险进攻', '角球', '出牌', '比赛时间', '上半场', '下半场', '直播', '信息', '犯规', '越位', '扑救'],
    hi: ['हमला', 'ख़तरनाक हमला', 'कॉर्नर', 'कार्ड', 'खेला गया समय', 'पहला हाफ़', 'दूसरा हाफ़', 'प्रसारण', 'जानकारी', 'फ़ाउल', 'ऑफ़साइड', 'बचाव']
  };
  function TX() { var a = TVL[lg()] || TVL.en, o = {}; TVK.forEach(function (k, i) { o[k] = a[i] != null ? a[i] : TVL.en[i]; }); return o; }
  /* 2026-10-22 (propriétaire, références des grandes applis) — DIRECT : « MINI TÉLÉ » à 2 volets (glisser, points dessous).
     Volet 1 « Terrain » : petit terrain dessiné, noms + score + horloge qui tourne ; entre les vrais événements, le jeu est
     SIMULÉ (possession, attaque, attaque dangereuse, du côté de l'équipe qui a le ballon, au prorata de la possession quand on
     l'a) ; un vrai changement (but, carton, remplacement, VAR, corner en plus dans les statistiques) joue SON animation, telle
     quelle — jamais un but / carton / corner inventé. Volet 2 « Infos » : logos, score, temps écoulé, période (score de la
     mi-temps), derniers événements, petites statistiques. Petit (≈ 180 px de haut sur téléphone) : les cotes restent juste dessous. */
  var TV = { fid: '', q: [], hold: 0, side: 'h', mode: 0, seen: {}, cor: null, sc: null, poss: 0.5, base: null, iv: 0, f: null, pane: 0 };
  // terrain 240 × 110 : pelouse rayée, lignes, buts avec filets (cages à l'intérieur du dessin : le ballon reste dedans)
  var PF = { x0: 12, x1: 228, y0: 6, y1: 104, w: 240, h: 110 };
  var PITCH = '<svg class="pz-pl" viewBox="0 0 240 110" preserveAspectRatio="none" aria-hidden="true"><defs><pattern id="pzNet" width="2.4" height="2.4" patternUnits="userSpaceOnUse"><path d="M0 0L2.4 2.4M2.4 0L0 2.4" stroke="rgba(255,255,255,.55)" stroke-width=".35"/></pattern></defs>' +
    '<rect width="240" height="110" fill="#3B8A37"/><rect x="12" y="6" width="21.6" height="98" fill="#4FA84A"/><rect x="33" y="6" width="21.6" height="98" fill="#469C42"/><rect x="55" y="6" width="21.6" height="98" fill="#4FA84A"/><rect x="76" y="6" width="21.6" height="98" fill="#469C42"/><rect x="98" y="6" width="21.6" height="98" fill="#4FA84A"/><rect x="120" y="6" width="21.6" height="98" fill="#469C42"/><rect x="141" y="6" width="21.6" height="98" fill="#4FA84A"/><rect x="163" y="6" width="21.6" height="98" fill="#469C42"/><rect x="184" y="6" width="21.6" height="98" fill="#4FA84A"/><rect x="206" y="6" width="21.6" height="98" fill="#469C42"/>' +
    '<g fill="none" stroke="rgba(255,255,255,.85)" stroke-width="1"><rect x="12" y="6" width="216" height="98"/><path d="M120 6v98"/><ellipse cx="120" cy="55" rx="13" ry="13"/>' +
    '<rect x="12" y="30" width="27" height="50"/><rect x="12" y="44" width="9" height="22"/><rect x="201" y="30" width="27" height="50"/><rect x="219" y="44" width="9" height="22"/>' +
    '<path d="M39 47a9 9 0 0 1 0 16M201 47a9 9 0 0 0 0 16"/></g><circle cx="120" cy="55" r="1.1" fill="#fff"/><circle cx="30" cy="55" r=".9" fill="#fff"/><circle cx="210" cy="55" r=".9" fill="#fff"/>' +
    '<rect x="5" y="47" width="7" height="16" fill="url(#pzNet)" stroke="#fff" stroke-width=".9"/><rect x="228" y="47" width="7" height="16" fill="url(#pzNet)" stroke="#fff" stroke-width=".9"/></svg>';
  // maillot (petite icône) pour l'en-tête
  function shirt(c) { return '<svg class="pz-shirt" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 3.5 4 5.6 2.3 10l3.2 1.6V20.5h13V11.6l3.2-1.6L20 5.6 16 3.5c-.6 1.6-2.2 2.6-4 2.6S8.6 5.1 8 3.5z" fill="' + c + '" stroke="rgba(0,0,0,.35)" stroke-width=".8"/></svg>'; }
  function scTxt2(f) { var s = f.sc || [0, 0]; return (+s[0] || 0) + ' : ' + (+s[1] || 0); }
  function evKey(e) { return [e.t, e.x, e.type, e.team, e.detail, e.player].join('|'); }
  function evIco(e) { return e.type === 'goal' ? '⚽' : e.type === 'card' ? (e.detail === 'red' ? '🟥' : '🟨') : e.type === 'subst' ? '🔁' : e.type === 'corner' ? '⛳' : 'VAR'; }
  function tvMin(f) { var n = NX(); if (f.end || f.st === 'FT' || f.st === 'AET' || f.st === 'PEN') return n.ftS; if (f.st === 'HT') return '45:00'; return null; } // 2026-10-22 (propriétaire) : à la mi-temps, l'heure du match (45:00), pas « MT »
  function tvClockTxt() {
    var f = TV.f; if (!f) return '';
    var t = tvMin(f); if (t) return t;
    if (!TV.base) return f.m != null ? (f.m < 10 ? '0' : '') + f.m + ':00' : '';
    var s = TV.base.m * 60 + Math.min(119, Math.floor((Date.now() - TV.base.at) / 1000)), p = function (v) { return (v < 10 ? '0' : '') + v; };
    return p(Math.floor(s / 60)) + ':' + p(s % 60);
  }
  function tvPeriod(f) {
    var x = TX(), n = NX(), st = String(f.st || '');
    var per = st === '1H' ? x.h1 : st === '2H' ? x.h2 : st === 'HT' ? n.ht : (f.end || st === 'FT') ? n.endM : '';
    var h1 = Array.isArray(f.ht) ? [+f.ht[0] || 0, +f.ht[1] || 0] : null, sc = [+(f.sc || [])[0] || 0, +(f.sc || [])[1] || 0];
    var ht = h1 && st !== '1H' ? ' (' + h1[0] + '-' + h1[1] + (st === 'HT' ? '' : ', ' + Math.max(0, sc[0] - h1[0]) + '-' + Math.max(0, sc[1] - h1[1])) + ')' : '';
    return per + ht;
  }
  function tvHtml(f) {
    var x = TX(), n = NX(), rc = f.rc || [0, 0];
    var card = function (i) { return '<i class="pz-card r" data-rc="' + i + '"' + (+rc[i] ? '' : ' hidden') + '></i>'; };
    return '<div class="pz-tv" id="pzTv"><div class="pz-tvseg" id="pzTvSeg" role="tablist"><button type="button" role="tab" data-tvp="0" class="on" aria-selected="true"><span dir="auto">' + esc(x.pitch) + '</span></button>' +
        '<button type="button" role="tab" data-tvp="1" aria-selected="false"><span dir="auto">' + esc(x.info) + '</span></button></div><div class="pz-tvs" id="pzTvs">' +
      '<section class="pz-tvp pz-tv1" aria-label="' + esc(x.pitch) + '"><div class="pz-tvh" dir="ltr"><b class="pz-tvn h">' + shirt('#22C55E') + '<span dir="auto">' + esc(f.h.n) + '</span>' + card(0) + '</b>' +
        '<span class="pz-tvsc"><b id="pzSc" dir="ltr">' + esc(scTxt(f)) + '</b><em dir="ltr"><svg class="pz-clki" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></svg><span id="pzClk"></span></em></span><b class="pz-tvn a">' + card(1) + '<span dir="auto">' + esc(f.a.n) + '</span>' + shirt('#F8FAFC') + '</b></div>' +
        '<div class="pz-pitch" id="pzPitch" dir="ltr">' + PITCH + '<i class="pz-zone" id="pzZone"></i><i class="pz-ballw" id="pzBall"><i class="pz-ball"></i></i>' +
          '<div class="pz-act" id="pzAct" hidden><small dir="auto"></small><b dir="auto"></b><em dir="auto"></em></div>' +
          '<div class="pz-gov" id="pzGov" hidden><b dir="auto"></b><small dir="auto"></small></div></div></section>' +
      '<section class="pz-tvp pz-tv2" aria-label="' + esc(x.info) + '"><div class="pz-tvi" dir="ltr">' +
        '<span class="pz-tvt">' + tlogo(f.h.lo, 'pz-tvlo') + '<b dir="auto">' + esc(f.h.n) + '</b></span>' +
        '<span class="pz-tvm"><b id="pzSc2" dir="ltr">' + esc(scTxt2(f)) + '</b><small id="pzAdd" dir="auto" hidden></small><em id="pzClk2" dir="ltr"></em><small id="pzPer" dir="auto"></small><i class="pz-mmin" id="pzMin" hidden><span id="pzMinT">' + esc(minTxt(f)) + '</span></i></span>' +
        '<span class="pz-tvt">' + tlogo(f.a.lo, 'pz-tvlo') + '<b dir="auto">' + esc(f.a.n) + '</b></span></div>' +
        '<div class="pz-tvx" id="pzTvx"></div></section></div></div>';
  }
  // à chaque lecture du match : score, horloge, infos, et les VRAIS changements mis dans la file d'animations
  function tvSync(f, r) {
    if (!$('pzTv')) return;
    var trk = (r && r.trk) || {}, ev = Array.isArray(trk.events) ? trk.events.filter(function (e) { return e && e.type; }) : [];
    var st = liveStats(f, trk);
    var sc = [+(f.sc || [])[0] || 0, +(f.sc || [])[1] || 0], cor = st && Array.isArray(st.corners) ? [+st.corners[0] || 0, +st.corners[1] || 0] : null;
    if (TV.fid !== f.id || (!TV.ready && r)) { // 1re lecture complète : les événements déjà passés ne sont pas rejoués
      TV.fid = f.id; TV.ready = !!r; TV.q = []; TV.hold = 0; TV.mode = 0; TV.seen = {}; ev.forEach(function (e) { TV.seen[evKey(e)] = 1; }); TV.cor = cor; TV.sc = sc; TV.base = null;
      TV.side = Math.random() < 0.5 ? 'h' : 'a'; TV.pane = 0;
      var last = ev[ev.length - 1]; if (last && f.m != null && +f.m - (+last.t || 0) <= 2) TV.q.push(last); // action toute récente : montrée une fois
    } else {
      var fresh = ev.filter(function (e) { return !TV.seen[evKey(e)]; });
      fresh.forEach(function (e) { TV.seen[evKey(e)] = 1; });
      [0, 1].forEach(function (i) { // but vu au score mais pas encore dans les événements : c'est un vrai but
        var tm = i ? 'a' : 'h', d = sc[i] - (TV.sc ? TV.sc[i] : sc[i]);
        if (d > 0 && !fresh.some(function (e) { return e.type === 'goal' && e.team === tm; })) for (var k = 0; k < Math.min(d, 3); k++) TV.q.push({ type: 'goal', team: tm, t: f.m });
      });
      fresh.forEach(function (e) { TV.q.push(e); });
      if (cor && TV.cor) [0, 1].forEach(function (i) { for (var k = 0; k < Math.min(3, cor[i] - TV.cor[i]); k++) TV.q.push({ type: 'corner', team: i ? 'a' : 'h', t: f.m }); });
      if (TV.q.length > 6) TV.q = TV.q.slice(-6);
      if (cor) TV.cor = cor; TV.sc = sc;
    }
    if (st && Array.isArray(st.poss)) { var ph = +st.poss[0] || 0, pa = +st.poss[1] || 0; TV.poss = ph + pa > 0 ? Math.max(0.2, Math.min(0.8, ph / (ph + pa))) : 0.5; } else TV.poss = 0.5;
    if (f.m != null && (!TV.base || TV.base.m !== +f.m)) TV.base = { m: +f.m, at: Date.now() };
    TV.f = f;
    var sc2 = $('pzSc2'); if (sc2 && sc2.textContent !== scTxt2(f)) { sc2.textContent = scTxt2(f); }
    var ad = $('pzAdd'), mx = (f.st === '1H' || f.st === '2H') && !f.end ? +f.mx || 0 : 0; if (ad) { ad.hidden = !(mx > 0); ad.textContent = mx > 0 ? '+' + mx + ' min' : ''; } // arrêts de jeu : seulement pendant une mi-temps
    var pe = $('pzPer'); if (pe) pe.textContent = tvPeriod(f);
    // ruban des derniers événements (volet 1) et infos (volet 2)
    var n = NX(), x = TX(), rec = ev.slice(-6).reverse();
    var line = function (e) { var det = e.type === 'goal' && e.detail === 'pen' ? ' (' + n.pen + ')' : e.type === 'goal' && e.detail === 'og' ? ' (' + n.og + ')' : ''; return '<span class="pz-te ' + (e.team === 'a' ? 'a' : 'h') + '"><em dir="ltr">' + (+e.t || 0) + (+e.x ? '+' + (+e.x) : '') + '’</em><i>' + evIco(e) + '</i><span dir="auto">' + esc((e.player || (e.type === 'subst' ? n.sub : e.type === 'var' ? 'VAR' : '')) + det) + '</span></span>'; };
    // statistiques du match (comme les grandes applis) : domicile à gauche, libellé au centre, extérieur à droite, fine barre
    var K = [['poss', n.poss, '%'], ['shotsOn', n.shotsOn], ['shots', n.shots], ['corners', n.corners], ['attacks', n.attacks], ['dangerous', n.dangerous],
      ['saves', x.saves], ['fouls', x.fouls], ['offsides', x.offs], ['yellow', n.yellow], ['red', n.reds]];
    var rows = st ? K.filter(function (k) { return Array.isArray(st[k[0]]); }) : [];
    var ix = (rows.length ? '<div class="pz-tvst" dir="ltr">' + rows.map(function (k) {
      var h = +st[k[0]][0] || 0, a = +st[k[0]][1] || 0, tot = h + a, p = tot ? h / tot * 100 : 50, u = k[2] || '';
      return '<p><b dir="ltr" class="' + (h > a ? 'hi' : '') + '">' + h + u + '</b><span dir="auto">' + esc(k[1]) + '</span><b dir="ltr" class="' + (a > h ? 'hi' : '') + '">' + a + u + '</b><i class="pz-sbar"><i style="width:' + p.toFixed(1) + '%"></i><i style="width:' + (100 - p).toFixed(1) + '%"></i></i></p>';
    }).join('') + '</div>' : '') + (rec.length ? '<div class="pz-tvev">' + rec.slice(0, 5).map(line).join('') + '</div>' : '');
    var tx = $('pzTvx'); if (tx && tx.dataset.h !== ix) { tx.dataset.h = ix; tx.innerHTML = ix; tvFit(); }
    tvClock();
    if (!TV.iv) { TV.iv = setInterval(tvTick, 1700); tvTick(); }
  }
  function bindTv() {
    var sc = $('pzTvs'), d = $('pzTvSeg'); if (!sc || !d) return;
    var paint = function () { var i = Math.round(sc.scrollLeft / Math.max(1, sc.clientWidth)); i = Math.abs(i) > 0 ? 1 : 0; TV.pane = i; d.querySelectorAll('[data-tvp]').forEach(function (b) { var on = +b.getAttribute('data-tvp') === i; b.classList.toggle('on', on); b.setAttribute('aria-selected', String(on)); }); tvFit(); };
    sc.addEventListener('scroll', function () { clearTimeout(sc._t); sc._t = setTimeout(paint, 60); }, { passive: true });
    d.addEventListener('click', function (ev) { var b = ev.target.closest && ev.target.closest('[data-tvp]'); if (!b) return; var i = +b.getAttribute('data-tvp'), rtl = document.documentElement.dir === 'rtl'; sc.scrollTo({ left: (rtl ? -1 : 1) * i * sc.clientWidth, behavior: 'smooth' }); d.querySelectorAll('[data-tvp]').forEach(function (z) { z.classList.toggle('on', z === b); z.setAttribute('aria-selected', String(z === b)); }); TV.pane = i; tvFit(); });
    tvFit();
  }
  /* 2026-10-22 (propriétaire : statistiques sous les logos) — la mini télé prend la hauteur du volet affiché : « Diffusion »
     reste petite (cotes juste dessous) ; « Informations » s'agrandit doucement pour montrer toutes les statistiques (rien coupé). */
  function tvFit() {
    var sc = $('pzTvs'); if (!sc) return;
    var p1 = sc.querySelector('.pz-tv1'), p2 = sc.querySelector('.pz-tv2'); if (!p1 || !p2) return;
    // 2026-10-22 (propriétaire) : « Informations » garde la MÊME taille que « Diffusion » ; les statistiques défilent dedans
    var h1 = p1.offsetHeight, h = h1;
    if (p2.style.height !== h1 + 'px') p2.style.height = h1 + 'px';
    if (sc.style.height !== h + 'px') sc.style.height = h + 'px';
  }
  function tvClock() { var t = tvClockTxt(), a = $('pzClk'), b = $('pzClk2'); if (a && a.textContent !== t) a.textContent = t; if (b && b.textContent !== t) b.textContent = t; }
  function tvShow(side, x, y, team, act, who, kind) {
    var ball = $('pzBall'), z = $('pzZone'), a = $('pzAct'), p = $('pzPitch'), gv = $('pzGov'); if (!ball || !a) return;
    x = Math.max(1.5, Math.min(98.5, x)); y = Math.max(3, Math.min(97, y));
    var bx = (PF.x0 + x / 100 * (PF.x1 - PF.x0)) / PF.w * 100, by = (PF.y0 + y / 100 * (PF.y1 - PF.y0)) / PF.h * 100;
    ball.style.left = bx.toFixed(2) + '%'; ball.style.top = by.toFixed(2) + '%';
    if (gv) { gv.hidden = kind !== 'goal'; if (kind === 'goal') { gv.children[0].textContent = act; gv.children[1].textContent = team + (who ? ' · ' + who : ''); gv.classList.remove('on'); void gv.offsetWidth; gv.classList.add('on'); } }
    if (kind === 'goal') { a.hidden = true; if (z) z.className = 'pz-zone'; return; }
    if (z) { z.className = 'pz-zone ' + (side ? (side === 'a' ? 'l' : 'r') : '') + (kind ? ' ' + kind : ''); }
    a.hidden = !act;
    a.className = 'pz-act ' + (kind || '') + (x > 50 ? ' rt' : ' lt');
    a.style.left = Math.max(4, Math.min(56, x > 50 ? x - 44 : x + 4)) + '%';
    var s = a.children; s[0].textContent = team || ''; s[1].textContent = act || ''; s[2].textContent = who || ''; s[2].hidden = !who; s[0].hidden = !team;

  }
  function tvTick() {
    if (!alive() || view !== 'match' || !$('pzPitch')) { clearInterval(TV.iv); TV.iv = 0; return; }
    var f = TV.f; if (!f) return;
    var now = Date.now(), n = NX(), x = TX(), nm = function (s) { return s === 'a' ? f.a.n : f.h.n; };
    if (now < TV.hold) return;
    var e = TV.q.shift();
    if (e) { // VRAI changement : son animation, telle quelle
      var s = e.team === 'a' ? 'a' : 'h', gx = s === 'h' ? 97 : 3, y = 50, who = e.player || '';
      if (e.type === 'goal') { TV.side = s === 'h' ? 'a' : 'h'; TV.mode = 0; tvShow(s, gx, 50, nm(s), '⚽ ' + n.goal, who, 'goal'); TV.hold = now + 3200; return; }
      if (e.type === 'corner') { tvShow(s, s === 'h' ? 98.5 : 1.5, Math.random() < 0.5 ? 3 : 97, nm(s), '⛳ ' + x.cor, '', 'cor'); TV.side = s; TV.mode = 2; TV.hold = now + 3600; return; }
      if (e.type === 'card') { tvShow(s, 50 + (s === 'h' ? -12 : 12), 45, nm(s), (e.detail === 'red' ? '🟥 ' : '🟨 ') + x.card, who, e.detail === 'red' ? 'red' : 'card'); TV.hold = now + 4200; return; }
      if (e.type === 'subst') { tvShow(s, s === 'h' ? 30 : 70, 95, nm(s), '🔁 ' + String(n.sub).toUpperCase(), who, 'sub'); TV.hold = now + 3600; return; }
      tvShow(s, 50, 50, nm(s), 'VAR', e.detail || who, 'var'); TV.hold = now + 3600; return;
    }
    var st = String(f.st || '');
    if (st === 'HT') { tvShow('', 50, 50, '', n.ht.toUpperCase(), '', 'pause'); return; }
    if (f.end || st === 'FT' || st === 'AET' || st === 'PEN') { tvShow('', 50, 50, '', n.endM.toUpperCase(), '', 'pause'); return; }
    // jeu simulé : l'équipe qui a le ballon (au prorata de la possession), possession → attaque → attaque dangereuse
    var r = Math.random();
    if (r < 0.3) { var ns = Math.random() < TV.poss ? 'h' : 'a'; if (ns !== TV.side) { TV.side = ns; TV.mode = 0; } }
    else if (r < 0.75) TV.mode = Math.min(2, TV.mode + 1);
    else TV.mode = Math.max(0, TV.mode - 1);
    if (f.susp && TV.mode === 2 && Math.random() < 0.5) TV.mode = 1;
    var R = [[44, 60], [62, 78], [80, 91]][TV.mode], bx = R[0] + Math.random() * (R[1] - R[0]), by = 14 + Math.random() * 72;
    if (TV.side === 'a') bx = 100 - bx;
    tvShow(TV.side, bx, by, nm(TV.side), [String(n.poss).toUpperCase(), x.att, x.dang][TV.mode], '', TV.mode === 2 ? 'dang' : '');
  }
  // libellés courts des marchés (1 · X · 2, 1X · 12 · X2, « 1 −1,5 »…) ; les noms des équipes sont dans la légende de la carte
  var LEG = { '1x2': 1, dc: 1, dnb: 1, eh: 1, ah: 1, ht1x2: 1, '2h1x2': 1, htdc: 1, '2hdc': 1, htah: 1, htft: 1, rbtts: 1, rou: 1, '12': 1 };
  function shortK(mk, k, h, a) {
    var p = mkParts(mk), f = p[0], ln = p[1], x = SX(), C = { H: '1', D: 'X', A: '2' }, q;
    k = String(k);
    switch (f) {
      case '1x2': case 'ht1x2': case '2h1x2': case 'dnb': case '12': return C[k] || k;
      case 'dc': case 'htdc': case '2hdc': return { HD: '1X', HA: '12', DA: 'X2' }[k] || k;
      case 'eh': return (C[k] || k) + ' (' + sgn(k === 'A' ? -ln : +ln) + ')';
      case 'ah': case 'htah': return (C[k] || k) + ' ' + sgn(k === 'A' ? -ln : +ln);
      case 'htft': return k.split('/').map(function (z) { return C[z] || z; }).join('/');
      case 'rbtts': q = k.split('/'); return (C[q[0]] || q[0]) + ' · ' + (q[1] === 'Y' ? x.yes : x.no);
      case 'rou': q = k.split('/'); return (C[q[0]] || q[0]) + ' · ' + fmt(q[1] === 'O' ? x.over : x.under, { x: numL(ln) });
      case 'eg': return k;
      case 'cs': case 'htcs': return k.replace(':', ' - ');
    }
    return sbOutL(mk, k, h, a);
  }
  function mkCards(ms, f) {
    var blocks = [], byF = {};
    ms.forEach(function (m) { var p = mkParts(m.mk), key = p[1] !== '' ? p[0] : m.mk; if (!byF[key]) { byF[key] = { key: key, fam: p[0], m: [] }; blocks.push(byF[key]); } byF[key].m.push(m); });
    return blocks.map(function (B, i) {
      var open = mkOpen[B.key] != null ? mkOpen[B.key] : (mGrp === 'main' || i < 3);
      var legend = LEG[B.fam] ? '<p class="pz-mkl"><span><b>1</b><span dir="auto">' + esc(f.h.n) + '</span></span><span><b>2</b><span dir="auto">' + esc(f.a.n) + '</span></span></p>' : '';
      var rows = B.m.map(function (m) {
        var ev = 'sb:' + f.id + ':' + m.mk, oo = fullO(m.mk, m.o), n = oo.length, s = !!m.s || !!(f.live && (f.susp || f.end));
        if (B.fam === 'cs' || B.fam === 'htcs') { // score exact : victoires 1 | nuls | victoires 2
          var col = [[], [], []];
          m.o.forEach(function (o) { var q = String(o[0]).split(':'), hh = +q[0], aa = +q[1]; col[q.length === 2 && isFinite(hh) && isFinite(aa) ? (hh > aa ? 0 : hh === aa ? 1 : 2) : 1].push(o); });
          return '<div class="pz-cs">' + col.map(function (c) { return '<div>' + c.map(function (o) { return obtn(ev, o[0], o[1], shortK(m.mk, o[0], f.h.n, f.a.n), s); }).join('') + '</div>'; }).join('') + '</div>';
        }
        var cols = n === 2 || n === 4 || n === 6 && /^(rbtts|rou)$/.test(B.fam) ? 2 : 3;
        if (n === 1) cols = 1;
        return '<div class="pz-oo c' + cols + '">' + oo.map(function (o) { return obtn(ev, o[0], o[1], shortK(m.mk, o[0], f.h.n, f.a.n), s); }).join('') + '</div>';
      }).join('');
      return '<section class="pz-mk' + (open ? ' on' : '') + '" data-mkk="' + esc(B.key) + '"><button type="button" class="pz-mkh" data-mkt="' + esc(B.key) + '" aria-expanded="' + open + '"><span dir="auto">' + esc(sbMkName(B.m[0].mk, f.h.n, f.a.n, spOf(f))) + '</span><i class="pz-chev">' + SBIC.chev + '</i></button>' +
        '<div class="pz-mkb">' + legend + rows + '</div></section>';
    }).join('');
  }

  // ---------- cotes, score, minute : mis à jour SUR PLACE (rien ne saute) ----------
  function oddMap() {
    var m = {}, s = {}, kn = {};
    var add = function (f) { if (!f || !f.o || !f.o.o) return; var ev = 'sb:' + f.id + ':' + (f.o.mk || '1x2'); kn[ev] = 1; f.o.o.forEach(function (o) { if (o[1] != null) m[ev + '|' + o[0]] = o[1]; }); if (f.live) s[ev] = !!(f.susp || f.end); };
    for (var d in sbData) { var r = sbData[d] && sbData[d].r; if (r) r.fx.forEach(add); }
    if (liveData) liveData.r.fx.forEach(add);
    if (sbM && sbM.ok && sbM.fx) {
      var fl = !!(sbM.fx.live && (sbM.fx.susp || sbM.fx.end));
      (sbM.mk || []).forEach(function (mk) { var ev = 'sb:' + sbM.fx.id + ':' + mk.mk; kn[ev] = 1; mk.o.forEach(function (o) { if (o[1] != null) m[ev + '|' + o[0]] = o[1]; }); if (sbM.fx.live) s[ev] = !!mk.s || fl; });
    }
    return { m: m, s: s, kn: kn };
  }
  function patchAll(root) {
    if (!root) return;
    var M = oddMap(), fxs = {};
    if (liveData) liveData.r.fx.forEach(function (f) { fxs[f.id] = f; });
    if (sbM && sbM.fx && sbM.fx.live) fxs[sbM.fx.id] = sbM.fx;
    root.querySelectorAll('.pz-ob[data-ev]').forEach(function (b) {
      var ev = b.getAttribute('data-ev'), key = ev + '|' + b.getAttribute('data-k'), v = M.m[key];
      if (v == null) { // ce choix n'a plus de cote : il reste à sa place, avec un cadenas
        if (M.kn[ev] && !b.classList.contains('lk')) { b.classList.add('lk'); b.disabled = true; b.classList.remove('fl-up', 'fl-dn'); } // (la dernière cote reste, grisée)
        if (M.kn[ev]) b.setAttribute('data-na', '1');
        return;
      }
      var old = +b.getAttribute('data-odd'), na = b.hasAttribute('data-na') || !old;
      b.removeAttribute('data-na'); b.classList.remove('na');
      if (na && Math.abs(old - v) > 1e-9) { b.setAttribute('data-odd', v); var o0 = b.querySelector('.pz-ov'); if (o0) o0.textContent = Number(v).toFixed(2); }
      else if (Math.abs(old - v) > 1e-9) {
        b.setAttribute('data-odd', v);
        var o = b.querySelector('.pz-ov'); if (o) o.textContent = Number(v).toFixed(2);
        b.classList.remove('fl-up', 'fl-dn'); void b.offsetWidth; b.classList.add(v > old ? 'fl-up' : 'fl-dn');
        clearTimeout(b._fl); b._fl = setTimeout(function () { b.classList.remove('fl-up', 'fl-dn'); }, 2600);
        slip.forEach(function (z) { if (z.ev + '|' + z.k === key && Math.abs(z.odd - v) > 1e-9) { z.prev = z.odd; z.odd = +v; z.chg = true; } });
      }
      var s = !!M.s[ev];
      if (s !== b.classList.contains('lk')) { b.classList.toggle('lk', s); b.disabled = s; }
    });
    root.querySelectorAll('.pz-row.lv[data-fx]').forEach(function (rw) {
      var f = fxs[rw.getAttribute('data-fx')]; if (!f) return;
      var mi = rw.querySelector('.pz-min'), t = minTxt(f, 1); if (mi && mi.textContent !== t) mi.textContent = t;
      var sc = rw.querySelectorAll('.pz-sc'), v = f.sc || [0, 0];
      [0, 1].forEach(function (i) { var e = sc[i], tx = String(+v[i] || 0); if (e && e.textContent !== tx) { e.textContent = tx; e.classList.remove('pop'); void e.offsetWidth; e.classList.add('pop'); } });
    });
  }

  // ---------- bandeaux du direct : « ⚽ BUT ! », carton rouge, mi-temps, fin du match (match regardé ou dans le coupon) ----------
  var lsc = {}, banQ = [], banOn = false;
  function watched(fid) { return (view === 'match' && sbMid === fid) || slip.some(function (s) { return s.fx === fid; }); }
  function noteLive(f) {
    if (!f || !f.live || !f.id) return;
    var sc = f.sc || [0, 0], rc = f.rc || [0, 0], p = lsc[f.id];
    var c = { h: +sc[0] || 0, a: +sc[1] || 0, rh: +rc[0] || 0, ra: +rc[1] || 0, st: String(f.st || ''), end: !!(f.end || f.st === 'FT') };
    lsc[f.id] = c;
    if (!p || !alive() || !watched(f.id) || view === 'match') return; // page du match : la mini télé le montre (rien ne couvre les cotes)
    var n = NX(), mt = f.m != null && !c.end ? ' · ' + f.m + '’' : '', s = c.h + ' - ' + c.a;
    if (c.h > p.h) banner('goal', n.goal + ' ' + f.h.n, f.h.n + ' ' + s + ' ' + f.a.n + mt);
    if (c.a > p.a) banner('goal', n.goal + ' ' + f.a.n, f.h.n + ' ' + s + ' ' + f.a.n + mt);
    if (c.rh > p.rh) banner('red', n.red, f.h.n + mt);
    if (c.ra > p.ra) banner('red', n.red, f.a.n + mt);
    if (c.st === 'HT' && p.st !== 'HT') banner('ht', n.ht, f.h.n + ' ' + s + ' ' + f.a.n);
    if (c.end && !p.end) banner('end', n.endM, f.h.n + ' ' + s + ' ' + f.a.n);
  }
  function banner(kind, t, s) { banQ.push([kind, t, s]); if (banQ.length > 4) banQ.shift(); if (!banOn) banNext(); }
  function banNext() {
    var it = banQ.shift();
    if (!it || !alive()) { banOn = false; banQ = []; return; }
    banOn = true;
    var el = document.createElement('div');
    el.className = 'pz-ban ' + it[0]; el.setAttribute('role', 'status');
    el.innerHTML = '<span class="pz-bi">' + ({ goal: '⚽', red: '<i class="pz-card r"></i>', ht: '⏸', end: '🏁' }[it[0]] || '') + '</span><span class="pz-btx"><b dir="auto">' + esc(it[1]) + '</b><small dir="auto">' + esc(it[2]) + '</small></span>';
    box.appendChild(el);
    requestAnimationFrame(function () { requestAnimationFrame(function () { el.classList.add('on'); }); });
    setTimeout(function () { el.classList.remove('on'); setTimeout(function () { el.remove(); banNext(); }, 350); }, 3800);
  }

  // ---------- toucher une cote : ajoutée / retirée du coupon sans rien redessiner (un seul choix par match) ----------
  function sbPick(b) {
    var x = X(), xx = XX(), ev = b.getAttribute('data-ev'), k = b.getAttribute('data-k'), odd = +b.getAttribute('data-odd');
    var m = /^sb:([a-z]+:\d+):(.+)$/.exec(ev || ''); if (!m) return;
    var fid = m[1], mk = m[2], f = sbFx(fid), live = !!(f && f.live);
    var had = inSlip(ev, k), n0 = slip.length;
    if (!had && (!f || (live ? (f.susp || f.end) : nowS() >= f.ts))) { sbToast(live ? NX().susp : SX().closedM); return; }
    if (!had) {
      if (slip.some(function (s) { return s.q; })) { sbToast(xx.e_single); return; }
      if (slip.length >= 1000 && !slip.some(function (s) { return s.fx === fid; })) { sbToast(x.max10); return; }
    }
    slip = slip.filter(function (s) { return s.fx !== fid; });
    if (!had) slip.push({ ev: ev, k: k, odd: odd, sb: 1, mk: mk, fx: fid, ko: f.ts, t: f.h.n + ' - ' + f.a.n, h: f.h, a: f.a, grp: ['fx:' + fid], q: false, l: sbOutL(mk, k, f.h.n, f.a.n), lv: live ? 1 : 0 });
    box.querySelectorAll('[data-ev^="sb:' + fid + ':"]').forEach(function (z) { var on = inSlip(z.getAttribute('data-ev'), z.getAttribute('data-k')); z.classList.toggle('on', on); z.setAttribute('aria-pressed', String(on)); });
    sbCode = null;
    paintNav(slip.length > n0);
  }

  // ---------- un seul écouteur pour toute la page ----------
  function bindBox() {
    if (!box || box._pz) return;
    box._pz = 1;
    box.addEventListener('click', onBoxClick);
    box.addEventListener('change', function (ev) {
      var t = ev.target;
      if (t && t.id === 'pzResCal') { var v = String(t.value || ''); if (/^\d{4}-\d{2}-\d{2}$/.test(v)) { var p = v.split('-'); resDay = Math.max(-29, Math.min(0, dayOff(new Date(+p[0], +p[1] - 1, +p[2], 12)))); paintResults(); } return; }
    });
  }
  function onBoxClick(ev) {
    var t = ev.target, b;
    if (!t || !t.closest) return;
    if ((b = t.closest('[data-back]'))) { ev.preventDefault(); back(); return; }
    if ((b = t.closest('.pz-nav [data-sv], .sp2-cta[data-sv], [data-go]'))) { var v = b.getAttribute('data-sv') || b.getAttribute('data-go'); if (v === 'list') v = 'home'; go(v); return; }
    if ((b = t.closest('.pz-ob[data-ev]'))) { if (!b.disabled) sbPick(b); return; }
    if ((b = t.closest('.pd-b[data-ev]'))) { if (!b.disabled) pick(b); return; } // choix Predict (carte ou résultat de recherche)
    if ((b = t.closest('#pzQx'))) { ev.preventDefault(); setQ(''); var qi = $('pzQ'); if (qi) qi.blur(); return; }
    if ((b = t.closest('[data-pdgo]'))) { openPredCard(b.getAttribute('data-pdgo')); return; }
    if ((b = t.closest('[data-sp]'))) {
      // 2026-10-22 (propriétaire) : l'en-tête ne bouge JAMAIS (Football, Predict, Basket…) — seule la liste dessous change
      var s = b.getAttribute('data-sp');
      if (s === 'pred' && view === 'pred' && pcat !== 'all') pcat = 'all';
      if (s !== 'news' && s !== 'pred') sport = s;
      topGo(s === 'news' || s === 'pred' ? s : 'home');
      return;
    }
    if ((b = t.closest('[data-pcat]'))) { pcat = b.getAttribute('data-pcat'); topGo('pred'); return; }
    if ((b = t.closest('[data-shx]'))) { closeSheet(); return; }
    if ((b = t.closest('[data-dsheet]'))) { openSheet(); return; }
    if ((b = t.closest('[data-per]'))) {
      per = b.getAttribute('data-per'); hourF = -1; closeSheet();
      if (view !== 'home') { topGo('home'); return; }
      if (qRaw) setQ('');
      paintPers(); paintHome(); listTop();
      return;
    }
    if ((b = t.closest('[data-lgt]'))) {
      var k = b.getAttribute('data-lgt'), sec = b.closest('.pz-lg'), on = !sec.classList.contains('on');
      sbOpen[k] = on; sec.classList.toggle('on', on); b.setAttribute('aria-expanded', String(on));
      var bd = $('pzBody') || $('pzLive'); if (bd) bd.dataset.sig = ''; // (la prochaine mise à jour garde l'état)
      return;
    }
    if ((b = t.closest('[data-g]'))) { mGrp = b.getAttribute('data-g'); var g = $('pzG'); if (g) { g.dataset.sig = ''; } var mk = $('pzMk'); if (mk) mk.dataset.sig = ''; paintMatch(); return; }
    if ((b = t.closest('[data-mkt]'))) { var kk = b.getAttribute('data-mkt'), sc = b.closest('.pz-mk'), o2 = !sc.classList.contains('on'); mkOpen[kk] = o2; sc.classList.toggle('on', o2); b.setAttribute('aria-expanded', String(o2)); return; }
    if ((b = t.closest('[data-trk]'))) { if (!b.disabled) { trkTab = b.getAttribute('data-trk'); paintMatch(); } return; }
    if ((b = t.closest('[data-fav]'))) { var id = b.getAttribute('data-fav'), f2 = favToggle('f', id); b.classList.toggle('on', f2); b.textContent = f2 ? '★' : '☆'; b.setAttribute('aria-pressed', String(f2)); return; }
    if ((b = t.closest('[data-res]'))) { resDay = +b.getAttribute('data-res'); paintResults(); return; }
    if ((b = t.closest('[data-menu]'))) { menuAct(b.getAttribute('data-menu')); return; }
    if ((b = t.closest('[data-open]'))) { openMatch(b.getAttribute('data-open')); return; }
    // toute la ligne d'un match ouvre sa page (sauf la zone des cotes) : grande cible, plus de flèche minuscule
    if ((b = t.closest('.pz-row[data-fx]')) && !t.closest('.pz-ro')) { openMatch(b.getAttribute('data-fx')); return; }
  }

  // ---------- mises à jour : direct toutes les 5 s quand on le regarde, en pause quand l'écran est caché ----------
  var pollT = 0;
  function pollDelay() {
    if (view === 'live') return 5000;
    if (view === 'match') { var f = curFx(); return f && f.live && !f.end ? 5000 : 60000; }
    if (view === 'home') return sbOn && sport === 'foot' && (per === 'top' || per === 'all') && !sbQ && liveShown() ? 15000 : 60000;
    if (view === 'slip' && slip.some(function (s) { return s.lv; })) return 10000;
    return -1;
  }
  function schedule(ms) {
    clearTimeout(pollT); pollT = 0;
    if (!alive()) return;
    var d = ms != null ? ms : pollDelay(); if (d < 0) return;
    pollT = setTimeout(pollTick, d);
  }
  async function pollTick() {
    pollT = 0;
    if (!alive() || document.hidden) return; // reprend au retour (visibilitychange)
    var v = view;
    try {
      if (v === 'live') { await liveProbe(true); if (view === 'live') paintLive(); }
      else if (v === 'match') { await loadMatch(sbMid, false); }
      else if (v === 'home' && sbOn) {
        var jobs = [sbLoad(false)];
        if ((per === 'top' || per === 'all') && sport === 'foot' && liveShown()) jobs.push(liveProbe(true));
        await Promise.all(jobs); if (view === 'home') paintHome();
      } else if (v === 'slip' && !sending && !lastBet && !lastBets) {
        await liveProbe(true);
        if (view === 'slip' && !sending && !lastBet && !lastBets) { var chg = await sbRefreshSlip(); if (chg && view === 'slip' && !sending && !lastBet && !lastBets) { render(); sbToast(XX().oddsChg); } }
      }
    } catch (e) { /* ignore */ }
    if (view === v) schedule();
  }
  document.addEventListener('visibilitychange', function () { if (!document.hidden && alive()) schedule(300); });
  // le pack de langue (ar, ru, de…) arrive un peu après : la page se redessine dans la bonne langue
  document.addEventListener('oro:livepack', function () { if (alive() && !sending && view !== 'slip') render(); });

  // ---------- un seul minuteur (comptes à rebours, « dans 25 min », matchs qui commencent) ----------
  var tick = 0, tickN = 0;
  function startTick() {
    if (tick) return;
    tick = setInterval(function () {
      if (!alive()) { clearInterval(tick); tick = 0; return; }
      var n = nowS(), x = XX();
      if (view === 'match' && TV.f) tvClock();
      box.querySelectorAll('[data-cd]').forEach(function (el) { var s = +el.getAttribute('data-cd') - n, t = s > 0 ? clock(s) : x.inPlay; if (el.textContent !== t) el.textContent = t; });
      box.querySelectorAll('[data-pcd]').forEach(function (el) { // Predict : compte à rebours jusqu'à la fermeture ; fermé → cotes grisées
        var s = +el.getAttribute('data-pcd') - n, t = pcdTxt(s); if (el.textContent !== t) el.textContent = t;
        if (s <= 0) { el.removeAttribute('data-pcd'); var c = el.closest('[data-card]'); if (c) { c.classList.add('shut'); c.querySelectorAll('.sp2-o').forEach(function (b) { b.disabled = true; }); var e = evById(c.getAttribute('data-card')); if (e) e.open = false; } }
        else el.parentNode.classList.toggle('soon', s < 3600);
      });
      if (++tickN % 20) return;
      box.querySelectorAll('[data-in]').forEach(function (el) { var s = +el.getAttribute('data-in') - n, t = s > 0 ? inShort(s) : x.inPlay; if (el.textContent !== t) el.textContent = t; });
      // match commencé : ses cotes d'avant-match se ferment
      box.querySelectorAll('.pz-row:not(.lv)[data-fx]').forEach(function (rw) { var f = sbFx(rw.getAttribute('data-fx')); if (f && !f.live && n >= f.ts) rw.querySelectorAll('.pz-ob[data-ev]').forEach(function (b) { b.disabled = true; b.classList.add('lk'); }); });
      box.querySelectorAll('[data-ts]').forEach(function (el) { // anciennes cartes (Actualité)
        var s = +el.getAttribute('data-ts') - n, sp = el.querySelector('span');
        if (s <= 0) {
          el.removeAttribute('data-ts'); el.classList.add('gone'); el.classList.remove('soon'); setTx(sp, x.inPlay);
          var c = el.closest('[data-card]');
          if (c) { c.classList.add('shut'); c.querySelectorAll('.sp2-o').forEach(function (b) { b.disabled = true; }); var e = evById(c.getAttribute('data-card')); if (e) e.open = false; }
          return;
        }
        el.classList.toggle('soon', s < 3600); setTx(sp, cd(s));
      });
      if (view === 'slip' && !sending && !lastBet && slip.some(function (s) { var e = evById(s.ev); return !s.closed && !s.lv && (s.sb ? n >= s.ko : e && n >= e.start); })) { syncSlip(); render(); }
    }, 1000);
  }
  /* 2026-10-22 (propriétaire) — MES PARIS en cartes nettes : état (couleur), type, date · heure ; le(s) choix en entier
     (choix en gras, match dessous, « Direct 1-0 · 63’ » pour un pari en direct) ; mise · cote · gain. Toucher → détail + reçu. */
  function liveTag(s) { var n = NX(), sc = Array.isArray(s.sc) ? ' ' + (+s.sc[0] || 0) + '-' + (+s.sc[1] || 0) : '', m = s.m != null && s.m !== '' ? ' · ' + s.m + '’' : ''; return n.nLive + sc + m; }
  function receipts(bets) {
    var x = XX(), n = NX();
    if (!bets.length) return empty(x.noBets, x.seeBets, null, 'home');
    var ST = { open: x.open, won: x.wonL, lost: x.lostL, void: x.voidL };
    var html = bets.slice(0, rcLimit).map(function (bt, bi) {
      var st = bt.status || 'open', id = String(bt.id || ''), on = !!rcOpen[id];
      var big = st === 'won' ? '+' + money(bt.win) : st === 'lost' ? '−' + money(bt.stake) : money(st === 'void' ? bt.stake : bt.pot);
      var lab = st === 'won' ? x.wonL : st === 'lost' ? x.lostL : st === 'void' ? x.voidL : x.potL;
      var multi = bt.sel.length > 1, kind = multi ? x.rcCombo + ' · ' + bt.sel.length : x.rcSingle;
      var show = multi ? bt.sel.slice(0, 3) : bt.sel;
      var sels = show.map(function (s) {
        var e = s.mk ? null : evByTitle(s.t);
        return '<span class="pz-bs1"><b dir="auto">' + esc(selLbl(s)) + '</b><small dir="auto">' + esc(e ? trT(e) : s.t) + (s.lv ? '</small><em class="pz-lvt">' + esc(liveTag(s)) + '</em>' : '</small>') + '</span>';
      }).join('') + (multi && bt.sel.length > 3 ? '<small class="pz-bmore">+' + (bt.sel.length - 3) + '</small>' : '');
      return '<div class="sp2-bet pz-bet st-' + esc(st) + (on ? ' on' : '') + '" data-rc="' + bi + '" data-id="' + esc(id) + '">' +
        '<button type="button" class="sp2-bhd" aria-expanded="' + on + '">' +
          '<span class="pz-b1"><em class="sp2-pill">' + esc(ST[st] || st) + '</em><span class="pz-bk2" dir="auto">' + esc(kind) + (bt.live ? ' · ' + esc(n.nLive) : '') + '</span><time dir="auto">' + esc(bt.at ? when2(bt.at) : '') + '</time></span>' +
          '<span class="pz-bsel">' + sels + '</span>' +
          '<span class="sp2-bf"><span><small class="fit">' + esc(x.stakeL) + '</small><b class="fit">' + money(bt.stake) + '</b></span><span><small class="fit">' + esc(x.oddL) + '</small><b class="fit">' + Number(bt.odd).toFixed(2) + '</b></span>' +
          '<span class="big"><small class="fit">' + esc(lab) + '</small><b class="fit">' + big + '</b></span><i class="sp2-chev">' + IC.back + '</i></span></button>' +
        (on ? rcBody(bt) : '') + '</div>';
    }).join('');
    if (bets.length > rcLimit) html += '<button type="button" class="sp2-more" id="spMore"><span class="fit">' + esc(x.more) + ' (' + (bets.length - rcLimit) + ')</span></button>';
    return html;
  }
  async function renderMine() {
    var x = XX(), n = NX();
    if (ctx.guest) { // visiteur : une petite invitation (pas de grande page bloquante)
      shell(bar(x.mine) + '<div class="pz-gst"><p dir="auto">' + esc(n.guestMineS) + '</p><button type="button" class="sp2-cta" id="spMineSign"><span class="fit">' + esc(x.guestBtn) + '</span></button></div>');
      fitAll(box); if ($('spMineSign')) $('spMineSign').addEventListener('click', function () { if (ctx.signup) ctx.signup(); });
      return;
    }
    shell(bar(x.mine) + mineBar() + '<div class="sp2-bets" id="spRcs">' + (mineCache ? receipts(shown = filt(mineCache)) : '<div class="sp2-bet sp2-skel"><i></i><i></i><i></i></div><div class="sp2-bet sp2-skel"><i></i><i></i><i></i></div>') + '</div>');
    bindRc(); bindMine(); fitAll(box);
    var r = await loadMine();
    if (view !== 'mine' || !$('spRcs')) return;
    if (r) { mineCache = r; paintMine(); }
    else if (!mineCache) $('spRcs').innerHTML = '<p class="sp2-none fit">' + esc(x.e_unavailable) + '</p>';
  }
  // ticket : en-tête = flèche retour · « Coupon » · nombre · Tout supprimer
  function slipHead() {
    var x = XX(), clr = slip.length && !lastBet && !lastBets ? '<button type="button" class="sp2-clear" id="spCpClear">' + IC.trash + '<span class="fit">' + esc(x.clearAll) + '</span></button>' : '';
    return bar(NX().nSlip + (slip.length && !lastBet && !lastBets ? ' · ' + slip.length : ''), clr);
  }
  function backToList() { lastBet = null; lastBets = null; go(slipFrom && slipFrom !== 'slip' ? slipFrom : 'home'); }
  // code de coupon : « Charger un code » (ticket vide, menu) ; « Partager le code » seulement dans le Menu (ticket sans bouton en plus)
  function codeRow() {
    var x = SX();
    return '<div class="sb-crow"><input id="sbCodeIn" maxlength="8" autocapitalize="characters" autocomplete="off" spellcheck="false" placeholder="' + esc(x.codePh) + '" aria-label="' + esc(x.loadCode) + '"><button type="button" id="sbCodeGo"><span class="fit">' + esc(x.load) + '</span></button></div>';
  }
  function bindCodeRow(root) {
    var go2 = root.querySelector('#sbCodeGo'), inp = root.querySelector('#sbCodeIn');
    if (!go2 || !inp) return;
    var run = function () { if (inp.value.trim()) loadCode(inp.value); };
    go2.addEventListener('click', run);
    inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); run(); } });
    inp.addEventListener('input', function () { var v = inp.value.toUpperCase().replace(/[^A-Z0-9]/g, ''); if (v !== inp.value) inp.value = v; });
  }
  function codeBox(withShare) {
    var x = SX(), n = NX();
    if (sbCode && sbCode.sig === slipSig()) {
      return '<div class="sb-cp1"><span>' + esc(n.code) + '</span><b dir="ltr">' + esc(sbCode.code) + '</b>' +
        '<button type="button" id="sbCopy"><span>' + esc(x.copy) + '</span></button><button type="button" id="sbCodeX" aria-label="✕">' + IC.x + '</button></div>';
    }
    return withShare ? '<button type="button" class="pz-lnk" id="sbShare">' + SBIC.share + '<span>' + esc(n.share) + '</span></button>' : '';
  }
  function bindCodeBox() {
    var x = SX(), sh = $('sbShare'), cp = $('sbCopy'), cx = $('sbCodeX'), w = $('sbCode'), share = view === 'menu';
    var redo = function () { if (w) { w.innerHTML = codeBox(share); bindCodeBox(); } };
    if (cx) cx.addEventListener('click', function () { sbCode = null; redo(); });
    if (sh) sh.addEventListener('click', async function () {
      if (sh.disabled) return; sh.disabled = true;
      var r = null;
      try { r = await D6.Api.post('sbCodeSave', { sel: slip.map(function (s) { return { ev: s.ev, k: s.k }; }) }, 15000); } catch (e) { r = null; }
      sh.disabled = false;
      if (!r || !r.ok) { var xx = XX(); sbToast(r && r.reason ? (xx['e_' + r.reason] || xx.e_unavailable) : xx.e_unavailable, 'err'); return; }
      sbCode = { code: r.code, sig: slipSig() }; redo();
    });
    if (cp) cp.addEventListener('click', function () {
      var link = codeLink(sbCode ? sbCode.code : ''), done = function () { sbToast(x.copied, 'ok'); };
      try { if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(link).then(done, function () { fallback(); }); return; } } catch (e) { /* ignore */ }
      fallback();
      function fallback() { try { var ta = document.createElement('textarea'); ta.value = link; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove(); done(); } catch (e) { /* ignore */ } }
    });
  }
  function fromServer(s) {
    if (s.mk) return { ev: s.ev, k: s.k, odd: +s.odd, sb: 1, mk: s.mk, fx: s.fx, ko: s.ko, t: s.t, h: s.h, a: s.a, grp: ['fx:' + s.fx], q: false, l: sbOutL(s.mk, s.k, s.h.n, s.a.n), lv: s.lv ? 1 : 0 };
    return { ev: s.ev, k: s.k, odd: +s.odd, t: s.t, l: trO(s.l), q: !!s.q, grp: s.grp || [], ko: s.ko };
  }
  async function loadCode(code) {
    var x = SX(), xx = XX();
    code = String(code || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (!/^[A-Z2-9]{6}$/.test(code)) { sbToast(x.codeBad, 'err'); return false; }
    var r = null;
    try { r = await D6.Api.post('sbCodeLoad', { code: code }, 15000); } catch (e) { r = null; }
    if (!r || !r.ok) { sbToast(r && r.reason === 'nocode' ? x.codeBad : xx.e_unavailable, 'err'); return false; }
    slip = (r.sel || []).map(fromServer); lastBet = null; lastBets = null;
    sbCode = r.skip || r.hidden ? null : { code: code, sig: slipSig() };
    var msg = [fmt(x.codeLoaded, { n: slip.length })];
    if (r.skip) msg.push(fmt(x.codeSkip, { n: r.skip }));
    if (r.hidden) msg.push(fmt(x.codeHidden, { n: r.hidden }));
    sbToast(msg.join(' '), slip.length ? 'ok' : 'info');
    if (alive()) { if (view !== 'slip') slipFrom = view; view = 'slip'; render(); }
    return true;
  }
  // ticket : relire les cotes SB du serveur (en entrant dans le ticket, après un refus « cotes changées » / « fermé »)
  async function sbRefreshSlip() {
    var sb = slip.filter(function (s) { return s.sb; }); if (!sb.length) return false;
    var r = null;
    try { r = await D6.Api.post('sbCodeLoad', { sel: sb.map(function (s) { return { ev: s.ev, k: s.k }; }) }, 15000); } catch (e) { r = null; }
    if (!r || !r.ok) return false;
    var cur = {}, chg = false; (r.sel || []).forEach(function (s) { cur[s.ev + '|' + s.k] = s; });
    sb.forEach(function (s) {
      var c = cur[s.ev + '|' + s.k];
      if (!c) { if (s.lv) { if (!s.susp) { s.susp = true; chg = true; } return; } if (!s.closed) { s.closed = true; chg = true; } return; } // direct : suspendu (peut revenir)
      if (s.susp) { s.susp = false; chg = true; }
      if (Math.abs(c.odd - s.odd) > 1e-9) { s.prev = s.odd; s.odd = +c.odd; s.chg = true; chg = true; }
    });
    return chg;
  }
  function sbAfterSlipOpen() {
    if (!slip.some(function (s) { return s.sb; })) return;
    sbRefreshSlip().then(function (chg) { if (chg && view === 'slip' && !sending && !lastBet && !lastBets) { render(); sbToast(XX().oddsChg); } });
  }
  // lien partagé https://orolado.com/?code=XXXXXX : Paris s'ouvre avec le ticket chargé (visiteur aussi)
  (function () {
    try {
      var p = new URLSearchParams(location.search || ''), c = String(p.get('code') || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
      if (!/^[A-Z2-9]{6}$/.test(c)) return;
      pendCode = c;
      p.delete('code');
      var qs = p.toString();
      if (history.replaceState) history.replaceState(history.state, '', location.pathname + (qs ? '?' + qs : '') + location.hash);
      var tries = 0, go = function () {
        if (D6.Casino && D6.Casino.home && D6.Api && D6.Api.post && document.readyState !== 'loading') { D6.Casino.home('sports'); return; }
        if (++tries < 40) setTimeout(go, 250);
      };
      setTimeout(go, 900);
    } catch (e) { /* ignore */ }
  })();

  D6.Sports = { paint: paint, receipt: showReceipt, back: back, code: loadCode, go: go };
})(window.D6 = window.D6 || {});
