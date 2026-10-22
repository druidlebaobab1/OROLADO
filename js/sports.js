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
      myCoupon: 'Ticket de paris', clearAll: 'Tout supprimer', confirmClear: 'Sûr ? Touche encore', comboT: 'Combiné :', combo: 'tous tes choix doivent être gagnants. Les cotes se multiplient.', singleT: 'Simple :', single: 'un seul choix.', totalOdd: 'Cote totale', see: 'Voir', minNote: 'Mise minimum 0,10 $', done: 'Pari enregistré !', cont: 'Continuer', emptySlip: 'Ton coupon est vide. Touche une cote pour commencer.',
      betsTab: 'Paris', guestMine: 'Crée ton compte pour parier : tous tes paris s’afficheront ici, avec leur résultat.', guestBtn: 'Créer mon compte', seeBets: 'Voir les paris', stakeL: 'Mise', oddL: 'Cote', potL: 'Gain possible', wonL: 'Gagné', lostL: 'Perdu', voidL: 'Remboursé', loading: 'Un instant…',
      all: 'Tous', drawCode: 'N', sport: { foot: 'Football', basket: 'Basket', boxe: 'Boxe', tennis: 'Tennis', mma: 'MMA', event: 'Prédictions', crypto: 'Crypto', politique: 'Politique', autre: 'Sport' } },
    en: { none: 'No match right now. Big matches are coming here soon.', coupon: 'Bet slip', sel: '{n} selection(s)', odd: 'Odds', stake: 'Stake', pot: 'Potential win', bet: 'Place bet', clear: 'Clear',
      placed: '✅ Bet placed! Potential win: ${p}', mine: 'My bets', noBets: 'No bet yet.', open: 'Open', won: 'Won', lost: 'Lost', void: 'Void',
      closed: 'Betting closed', result: 'Result', starts: 'Starts', today: 'Today', tomorrow: 'Tomorrow', draw: 'Draw', max10: 'Maximum 50 matches in a slip.',
      e_min: 'Minimum stake $0.10.', e_max: 'Stake too high for this match.', e_maxWin: 'Win too high: lower the stake.', e_closed: 'This match has already started.', e_insufficient: 'Insufficient balance.', e_unavailable: 'Unavailable, try again.', e_param: 'Invalid slip.', e_login: 'Log in to bet.', e_busy: 'One moment…', e_suspended: 'Account suspended.',
      guestBet: '🔒 Sign up to bet (it’s free)',
      myCoupon: 'My bet slip', clearAll: 'Remove all', confirmClear: 'Sure? Tap again', comboT: 'Multiple:', combo: 'all your picks must win. The odds multiply.', singleT: 'Single:', single: 'one pick.', totalOdd: 'Total odds', see: 'Open', minNote: 'Minimum stake $0.10', done: 'Bet placed!', cont: 'Continue', emptySlip: 'Your bet slip is empty. Tap an odd to start.',
      betsTab: 'Bets', guestMine: 'Create your account to bet: all your bets will show here, with their result.', guestBtn: 'Create my account', seeBets: 'See the bets', stakeL: 'Stake', oddL: 'Odds', potL: 'Potential win', wonL: 'Won', lostL: 'Lost', voidL: 'Refunded', loading: 'One moment…',
      all: 'All', drawCode: 'X', sport: { foot: 'Football', basket: 'Basketball', boxe: 'Boxing', tennis: 'Tennis', mma: 'MMA', event: 'Predictions', crypto: 'Crypto', politique: 'Politics', autre: 'Sport' } }
  };
  T.zh = Object.assign({}, T.en, { none: '暂无比赛，重大赛事即将上线。', coupon: '投注单', sel: '已选 {n} 场', odd: '赔率', stake: '投注', pot: '可赢', bet: '确认投注', clear: '清空',
    guestBet: '🔒 注册后即可投注（免费）',
    myCoupon: '我的投注单', clearAll: '全部删除', confirmClear: '确定？再点一次', comboT: '串关：', combo: '所有选择都必须赢，赔率相乘。', singleT: '单关：', single: '只有一个选择。', totalOdd: '总赔率', see: '查看', minNote: '最低投注 0.10 美元', done: '投注成功！', cont: '继续', emptySlip: '投注单是空的，点击赔率开始。',
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
  function trT(e) { var l = lg(); return (l !== 'fr' && e.i18n && e.i18n[l]) || e.title; }
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
    en: { results: 'Results', inPlay: 'In play', oddsChg: 'Odds updated', sending: 'Sending…', qOnly: 'Predictions: single bets only.', e_single: 'Predictions are single bets only: they can’t be combined.', e_corr: 'These picks are linked: they can’t be in the same slip.', e_cap: 'Limit reached on this choice: lower your stake.', more: 'Show more', singleX: 'One pick: your win = stake × odds.', balL: 'Balance', depL: 'Top up', errBal: 'Not enough balance for this stake.', e_odds: 'Odds have changed: check your slip and confirm again.', tabS: 'Single', tabC: 'Multiple', mkt3: 'Match result (1X2)', mkt2: 'Winner', mktQ: 'Prediction', clrSt: 'Clear', maxL: 'Max', setT: 'Bet slip settings', accT: 'If the odds change', accAny: 'Accept any change', accUp: 'Accept higher odds only', accNone: 'Always ask me', keepT: 'Keep selections after placing', qkT: 'Quick stakes', okL: 'OK', eachL: 'Stake per bet', totSt: 'Total stake', placeN: 'Place {n} bets', placeB: 'Place bet', doneN: '{n} bets placed!', partial: '{ok} of {n} bets placed', singleN: 'One bet per selection, each with its own stake.' },
    fr: { results: 'Résultats', inPlay: 'En jeu', oddsChg: 'Cotes mises à jour', sending: 'Envoi…', qOnly: 'Prédiction : pari simple uniquement.', e_single: 'Les prédictions se jouent seules : pas de combiné.', e_corr: 'Ces choix sont liés : pas dans le même coupon.', e_cap: 'Limite atteinte sur ce choix : baisse la mise.', more: 'Afficher plus', singleX: 'Un seul choix : gain = mise × cote.', balL: 'Solde', depL: 'Recharger', errBal: 'Solde insuffisant pour cette mise.', e_odds: 'Les cotes ont changé : vérifie ton ticket puis confirme.', tabS: 'Simple', tabC: 'Combiné', mkt3: 'Résultat du match (1X2)', mkt2: 'Vainqueur', mktQ: 'Prédiction', clrSt: 'Effacer', maxL: 'Max', setT: 'Réglages du ticket', accT: 'Si la cote change', accAny: 'Accepter tous les changements', accUp: 'Accepter seulement les hausses', accNone: 'Toujours me demander', keepT: 'Garder les sélections après le pari', qkT: 'Montants rapides', okL: 'OK', eachL: 'Mise par pari', totSt: 'Mise totale', placeN: 'Placer {n} paris', placeB: 'Placer le pari', doneN: '{n} paris enregistrés !', partial: '{ok} sur {n} paris enregistrés', singleN: 'Un pari par sélection, chacun avec sa mise.' },
    es: { results: 'Resultados', inPlay: 'En juego', oddsChg: 'Cuotas actualizadas', sending: 'Enviando…', qOnly: 'Predicciones: solo apuesta simple.', e_single: 'Las predicciones son solo apuestas simples: no se combinan.', e_corr: 'Estas selecciones están relacionadas: no pueden ir en el mismo boleto.', e_cap: 'Límite alcanzado en esta opción: baja la apuesta.', more: 'Ver más', singleX: 'Una sola selección: ganancia = apuesta × cuota.', balL: 'Saldo', depL: 'Recargar', errBal: 'Saldo insuficiente para esta apuesta.', e_odds: 'Las cuotas han cambiado: revisa tu boleto y confirma.', tabS: 'Simple', tabC: 'Combinada', mkt3: 'Resultado (1X2)', mkt2: 'Ganador', mktQ: 'Predicción', clrSt: 'Borrar', maxL: 'Máx', setT: 'Ajustes del boleto', accT: 'Si la cuota cambia', accAny: 'Aceptar cualquier cambio', accUp: 'Aceptar solo si sube', accNone: 'Preguntarme siempre', keepT: 'Mantener selecciones tras apostar', qkT: 'Importes rápidos', okL: 'OK', eachL: 'Apuesta por selección', totSt: 'Apuesta total', placeN: 'Hacer {n} apuestas', placeB: 'Hacer apuesta', doneN: '¡{n} apuestas realizadas!', partial: '{ok} de {n} apuestas realizadas', singleN: 'Una apuesta por selección, cada una con su importe.' },
    pt: { results: 'Resultados', inPlay: 'Em jogo', oddsChg: 'Odds atualizadas', sending: 'Enviando…', qOnly: 'Previsões: só aposta simples.', e_single: 'Previsões são só apostas simples: não podem ser combinadas.', e_corr: 'Essas escolhas estão ligadas: não podem ficar no mesmo bilhete.', e_cap: 'Limite atingido nesta opção: diminua a aposta.', more: 'Ver mais', singleX: 'Uma só escolha: ganho = aposta × odd.', balL: 'Saldo', depL: 'Recarregar', errBal: 'Saldo insuficiente para esta aposta.', e_odds: 'As odds mudaram: confira seu bilhete e confirme.', tabS: 'Simples', tabC: 'Múltipla', mkt3: 'Resultado (1X2)', mkt2: 'Vencedor', mktQ: 'Previsão', clrSt: 'Limpar', maxL: 'Máx', setT: 'Ajustes do bilhete', accT: 'Se a odd mudar', accAny: 'Aceitar qualquer mudança', accUp: 'Aceitar só se subir', accNone: 'Sempre me perguntar', keepT: 'Manter seleções após apostar', qkT: 'Valores rápidos', okL: 'OK', eachL: 'Aposta por seleção', totSt: 'Aposta total', placeN: 'Fazer {n} apostas', placeB: 'Fazer aposta', doneN: '{n} apostas feitas!', partial: '{ok} de {n} apostas feitas', singleN: 'Uma aposta por seleção, cada uma com seu valor.' },
    ar: { results: 'النتائج', inPlay: 'جارٍ الآن', oddsChg: 'تم تحديث الاحتمالات', sending: 'جارٍ الإرسال…', qOnly: 'التوقعات: رهان فردي فقط.', e_single: 'التوقعات رهانات فردية فقط: لا يمكن دمجها.', e_corr: 'هذه الاختيارات مترابطة: لا يمكن وضعها في نفس القسيمة.', e_cap: 'تم بلوغ الحد لهذا الاختيار: خفّض المبلغ.', more: 'عرض المزيد', singleX: 'اختيار واحد: الربح = المبلغ × الاحتمال.', balL: 'الرصيد', depL: 'شحن', errBal: 'الرصيد غير كافٍ لهذا المبلغ.', e_odds: 'تغيرت الاحتمالات: راجع قسيمتك ثم أكّد.', tabS: 'فردي', tabC: 'مركّب', mkt3: 'نتيجة المباراة (1X2)', mkt2: 'الفائز', mktQ: 'توقع', clrSt: 'مسح', maxL: 'الحد الأقصى', setT: 'إعدادات القسيمة', accT: 'إذا تغيّر الاحتمال', accAny: 'قبول أي تغيير', accUp: 'قبول الارتفاع فقط', accNone: 'اسألني دائمًا', keepT: 'الإبقاء على الاختيارات بعد الرهان', qkT: 'مبالغ سريعة', okL: 'موافق', eachL: 'المبلغ لكل رهان', totSt: 'المبلغ الإجمالي', placeN: 'ضع {n} رهانات', placeB: 'ضع الرهان', doneN: 'تم تسجيل {n} رهانات!', partial: 'تم تسجيل {ok} من {n} رهانات', singleN: 'رهان لكل اختيار، ولكل رهان مبلغه.' },
    tr: { results: 'Sonuçlar', inPlay: 'Oynanıyor', oddsChg: 'Oranlar güncellendi', sending: 'Gönderiliyor…', qOnly: 'Tahminler: yalnızca tekli bahis.', e_single: 'Tahminler yalnızca tekli bahistir: kombine yapılamaz.', e_corr: 'Bu seçimler bağlantılı: aynı kupona eklenemez.', e_cap: 'Bu seçimde limite ulaşıldı: bahsi düşür.', more: 'Daha fazla', singleX: 'Tek seçim: kazanç = bahis × oran.', balL: 'Bakiye', depL: 'Yükle', errBal: 'Bu bahis için bakiye yetersiz.', e_odds: 'Oranlar değişti: kuponunu kontrol edip onayla.', tabS: 'Tekli', tabC: 'Kombine', mkt3: 'Maç sonucu (1X2)', mkt2: 'Kazanan', mktQ: 'Tahmin', clrSt: 'Temizle', maxL: 'Maks', setT: 'Kupon ayarları', accT: 'Oran değişirse', accAny: 'Her değişikliği kabul et', accUp: 'Sadece yükselişi kabul et', accNone: 'Her zaman sor', keepT: 'Bahisten sonra seçimleri koru', qkT: 'Hızlı tutarlar', okL: 'Tamam', eachL: 'Bahis başına tutar', totSt: 'Toplam tutar', placeN: '{n} bahis yap', placeB: 'Bahis yap', doneN: '{n} bahis alındı!', partial: '{n} bahisten {ok} tanesi alındı', singleN: 'Her seçim için ayrı bahis, her biri kendi tutarıyla.' },
    vi: { results: 'Kết quả', inPlay: 'Đang diễn ra', oddsChg: 'Tỷ lệ đã cập nhật', sending: 'Đang gửi…', qOnly: 'Dự đoán: chỉ cược đơn.', e_single: 'Dự đoán chỉ được cược đơn: không thể cược xiên.', e_corr: 'Các lựa chọn này liên quan nhau: không thể chung một phiếu.', e_cap: 'Đã đạt giới hạn cho lựa chọn này: hãy giảm tiền cược.', more: 'Xem thêm', singleX: 'Một lựa chọn: tiền thắng = tiền cược × tỷ lệ.', balL: 'Số dư', depL: 'Nạp tiền', errBal: 'Số dư không đủ cho mức cược này.', e_odds: 'Tỷ lệ đã thay đổi: kiểm tra phiếu rồi xác nhận lại.', tabS: 'Đơn', tabC: 'Xiên', mkt3: 'Kết quả trận (1X2)', mkt2: 'Đội thắng', mktQ: 'Dự đoán', clrSt: 'Xóa', maxL: 'Tối đa', setT: 'Cài đặt phiếu cược', accT: 'Nếu tỷ lệ thay đổi', accAny: 'Chấp nhận mọi thay đổi', accUp: 'Chỉ chấp nhận khi tăng', accNone: 'Luôn hỏi tôi', keepT: 'Giữ lựa chọn sau khi cược', qkT: 'Số tiền nhanh', okL: 'OK', eachL: 'Tiền cược mỗi vé', totSt: 'Tổng tiền cược', placeN: 'Đặt {n} cược', placeB: 'Đặt cược', doneN: 'Đã đặt {n} cược!', partial: 'Đã đặt {ok}/{n} cược', singleN: 'Mỗi lựa chọn một cược, mỗi cược một số tiền.' },
    id: { results: 'Hasil', inPlay: 'Berlangsung', oddsChg: 'Odds diperbarui', sending: 'Mengirim…', qOnly: 'Prediksi: hanya taruhan tunggal.', e_single: 'Prediksi hanya taruhan tunggal: tidak bisa digabung.', e_corr: 'Pilihan ini saling terkait: tidak bisa dalam satu slip.', e_cap: 'Batas tercapai untuk pilihan ini: kurangi taruhan.', more: 'Lihat lagi', singleX: 'Satu pilihan: kemenangan = taruhan × odds.', balL: 'Saldo', depL: 'Isi saldo', errBal: 'Saldo tidak cukup untuk taruhan ini.', e_odds: 'Odds berubah: periksa slip lalu konfirmasi lagi.', tabS: 'Tunggal', tabC: 'Kombinasi', mkt3: 'Hasil laga (1X2)', mkt2: 'Pemenang', mktQ: 'Prediksi', clrSt: 'Hapus', maxL: 'Maks', setT: 'Pengaturan slip', accT: 'Jika odds berubah', accAny: 'Terima semua perubahan', accUp: 'Terima jika naik saja', accNone: 'Selalu tanya saya', keepT: 'Simpan pilihan setelah taruhan', qkT: 'Nominal cepat', okL: 'OK', eachL: 'Taruhan per pilihan', totSt: 'Total taruhan', placeN: 'Pasang {n} taruhan', placeB: 'Pasang taruhan', doneN: '{n} taruhan terpasang!', partial: '{ok} dari {n} taruhan terpasang', singleN: 'Satu taruhan per pilihan, masing-masing dengan nominalnya.' },
    ru: { results: 'Результаты', inPlay: 'Идёт игра', oddsChg: 'Коэффициенты обновлены', sending: 'Отправка…', qOnly: 'Прогнозы: только одиночная ставка.', e_single: 'Прогнозы — только одиночные ставки, без экспресса.', e_corr: 'Эти исходы связаны: их нельзя ставить в один купон.', e_cap: 'Лимит по этому исходу исчерпан: уменьшите ставку.', more: 'Показать ещё', singleX: 'Один исход: выигрыш = ставка × коэффициент.', balL: 'Баланс', depL: 'Пополнить', errBal: 'Недостаточно средств для этой ставки.', e_odds: 'Коэффициенты изменились: проверьте купон и подтвердите.', tabS: 'Ординар', tabC: 'Экспресс', mkt3: 'Исход матча (1X2)', mkt2: 'Победитель', mktQ: 'Прогноз', clrSt: 'Очистить', maxL: 'Макс', setT: 'Настройки купона', accT: 'Если коэффициент изменится', accAny: 'Принимать любые изменения', accUp: 'Принимать только повышение', accNone: 'Всегда спрашивать', keepT: 'Сохранять выбор после ставки', qkT: 'Быстрые суммы', okL: 'OK', eachL: 'Ставка на каждый', totSt: 'Общая ставка', placeN: 'Сделать {n} ставки', placeB: 'Сделать ставку', doneN: 'Принято ставок: {n}!', partial: 'Принято {ok} из {n}', singleN: 'Отдельная ставка на каждый исход, у каждой своя сумма.' },
    de: { results: 'Ergebnisse', inPlay: 'Läuft', oddsChg: 'Quoten aktualisiert', sending: 'Wird gesendet…', qOnly: 'Prognosen: nur Einzelwette.', e_single: 'Prognosen nur als Einzelwette: keine Kombi möglich.', e_corr: 'Diese Tipps hängen zusammen: nicht im selben Wettschein.', e_cap: 'Limit für diese Auswahl erreicht: Einsatz senken.', more: 'Mehr anzeigen', singleX: 'Ein Tipp: Gewinn = Einsatz × Quote.', balL: 'Guthaben', depL: 'Aufladen', errBal: 'Guthaben reicht für diesen Einsatz nicht.', e_odds: 'Quoten haben sich geändert: Wettschein prüfen und bestätigen.', tabS: 'Einzel', tabC: 'Kombi', mkt3: 'Spielergebnis (1X2)', mkt2: 'Sieger', mktQ: 'Prognose', clrSt: 'Löschen', maxL: 'Max', setT: 'Wettschein-Einstellungen', accT: 'Wenn sich die Quote ändert', accAny: 'Alle Änderungen annehmen', accUp: 'Nur höhere Quoten annehmen', accNone: 'Immer nachfragen', keepT: 'Auswahl nach der Wette behalten', qkT: 'Schnellbeträge', okL: 'OK', eachL: 'Einsatz pro Wette', totSt: 'Gesamteinsatz', placeN: '{n} Wetten platzieren', placeB: 'Wette platzieren', doneN: '{n} Wetten platziert!', partial: '{ok} von {n} Wetten platziert', singleN: 'Eine Wette pro Tipp, jede mit eigenem Einsatz.' },
    hi: { results: 'नतीजे', inPlay: 'जारी है', oddsChg: 'ऑड्स अपडेट हुए', sending: 'भेजा जा रहा है…', qOnly: 'भविष्यवाणी: सिर्फ़ एकल दांव।', e_single: 'भविष्यवाणियाँ सिर्फ़ एकल दांव हैं: इन्हें जोड़ा नहीं जा सकता।', e_corr: 'ये चुनाव आपस में जुड़े हैं: एक ही स्लिप में नहीं रख सकते।', e_cap: 'इस विकल्प की सीमा पूरी हो गई: दांव कम करें।', more: 'और देखें', singleX: 'एक चुनाव: जीत = दांव × ऑड्स।', balL: 'बैलेंस', depL: 'रिचार्ज', errBal: 'इस दांव के लिए बैलेंस कम है।', e_odds: 'ऑड्स बदल गए: अपनी स्लिप देखें और फिर पुष्टि करें।', tabS: 'सिंगल', tabC: 'मल्टीपल', mkt3: 'मैच नतीजा (1X2)', mkt2: 'विजेता', mktQ: 'भविष्यवाणी', clrSt: 'हटाएँ', maxL: 'अधिकतम', setT: 'स्लिप सेटिंग', accT: 'ऑड्स बदलें तो', accAny: 'हर बदलाव मानें', accUp: 'सिर्फ़ बढ़ने पर मानें', accNone: 'हमेशा पूछें', keepT: 'दांव के बाद चुनाव रखें', qkT: 'तेज़ रकम', okL: 'ठीक', eachL: 'हर दांव की रकम', totSt: 'कुल रकम', placeN: '{n} दांव लगाएँ', placeB: 'दांव लगाएँ', doneN: '{n} दांव लग गए!', partial: '{n} में से {ok} दांव लगे', singleN: 'हर चुनाव पर अलग दांव, हर एक की अपनी रकम।' },
    zh: { results: '结果', inPlay: '进行中', oddsChg: '赔率已更新', sending: '发送中…', qOnly: '预测：仅限单关。', e_single: '预测只能单关投注，不能串关。', e_corr: '这些选择相互关联，不能放在同一投注单。', e_cap: '该选项已达上限，请降低投注额。', more: '显示更多', singleX: '单个选择：可赢 = 投注 × 赔率。', balL: '余额', depL: '充值', errBal: '余额不足以支付此投注。', e_odds: '赔率已变化：请检查投注单后再确认。', tabS: '单关', tabC: '串关', mkt3: '全场赛果 (1X2)', mkt2: '胜者', mktQ: '预测', clrSt: '清除', maxL: '最大', setT: '投注单设置', accT: '赔率变化时', accAny: '接受任何变化', accUp: '仅接受上升', accNone: '每次都询问我', keepT: '投注后保留选项', qkT: '快捷金额', okL: '确定', eachL: '每注金额', totSt: '总投注额', placeN: '投注 {n} 注', placeB: '确认投注', doneN: '已投注 {n} 注！', partial: '已投注 {ok}/{n} 注', singleN: '每个选择单独一注，各自金额。' }
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
      if (s.sb) { if (!s.closed && n >= s.ko) { s.closed = true; chg = true; } s.l = sbOutL(s.mk, s.k, s.h.n, s.a.n); return; } // 2026-10-22 : choix SB (pas dans spList)
      var e = evById(s.ev), o = e && e.opts.filter(function (z) { return z.k === s.k; })[0];
      if (!e || !o || !e.open || n >= e.start) { if (!s.closed) { s.closed = true; chg = true; } return; }
      if (Math.abs(o.odd - s.odd) > 1e-9) { s.odd = o.odd; s.chg = true; chg = true; }
      s.t = trT(e); s.l = trO(o.label);
    });
    return chg;
  }

  var lastList = null, lastJson = '', fetching = null;
  async function paint(container, c) {
    box = container; ctx = c || {};
    if (!box) return;
    box.classList.add('sp2');
    if ((lastBet || lastBets) && view === 'slip') { lastBet = null; lastBets = null; view = lv(); }
    if (sbOn && sbAuto && view === 'list') view = 'foot';
    if (pendCode) { var pc = pendCode; pendCode = ''; loadCode(pc); }
    sbProbe(container);
    // v2763 (propriétaire) : Paris s'affiche TOUT DE SUITE (dernière liste gardée en mémoire), puis se met à jour en silence
    // v2844 (propriétaire) : comme Cadeaux — si la même liste est déjà affichée, on ne reconstruit rien (plus d'« éclair »)
    var sig0 = (lastJson || '') + '|' + view + '|' + (document.documentElement.lang || '');
    if (lastList && view === 'list' && box.dataset.sig === sig0 && box.querySelector('.sp2-list')) { events = lastList; syncSlip(); }
    else if (lastList) { events = lastList; syncSlip(); render(); }
    else if (view === 'list') { box.innerHTML = tabs() + skeleton(); bindTabs(); }
    else render();
    var r = await fetchList();
    if (box !== container || !box.isConnected) return;
    if (!r) { if (!lastList) { events = []; if (view === 'list') render(); } return; }
    var same = lastJson === JSON.stringify(r);
    lastList = r; lastJson = JSON.stringify(r);
    events = r;
    var chg = syncSlip();
    if (view === 'list' && (!same || !box.querySelector('.sp2-list') || box.querySelector('.sp2-skel'))) render(); // la liste arrive : on remplace le squelette de chargement
    else if (view === 'slip' && chg && !sending && !lastBet) { render(); if (ctx.toast) ctx.toast(XX().oddsChg, 'info'); }
    if (!ctx.guest && mineCache === null) loadMine().then(function (m) { if (m) { mineCache = m; paintBadge(); } });
  }
  // 2026-10-22 : paris automatiques visibles pour ce joueur ? (sbList ok) — sinon Paris reste exactement comme avant
  function sbProbe(container) {
    var was = sbOn;
    sbLoad(true).then(function () {
      if (!box || box !== container || !box.isConnected || !box.classList.contains('sp2') || sending) return;
      if (sbOn) {
        if (sbAuto && view === 'list') { view = 'foot'; render(); }
        else if (view === 'foot') { if ($('sbBody')) paintFoot(); else render(); }
        else if (was !== true && (view === 'list' || view === 'mine')) render(); // onglets Football · Actualité · Mes paris
      } else if (sbOn === false && was !== false) {
        if (view === 'foot' || view === 'match') view = 'list';
        if (view !== 'slip' && was === true) render();
        else if (view === 'list' && !box.querySelector('.sp2-list')) render();
      }
    });
  }
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
  // le pack de langue (ar, ru, de…) arrive un peu après : on redessine les textes de la page Paris s'il est ouvert
  document.addEventListener('oro:livepack', function () { if (box && box.isConnected && box.classList.contains('sp2') && !sending && view !== 'slip' && (events.length || view === 'mine')) render(); });
  // pré-chargement discret, 4 s après l'ouverture du site (une seule petite lecture)
  // 2026-10-19 (propriétaire : « Paris : les logos arrivent en éclats au 1er clic ») : la liste ET les logos des équipes
  // sont chargés en avance, en silence (le 1er clic sur Paris affiche tout d'un coup).
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
  setTimeout(function () { if (D6.Api && D6.Api.post) { fetchList().then(function (r) { if (r) { lastList = r; lastJson = JSON.stringify(r); warmLogos(lastJson); } }); sbFetch(0); } }, 1500);

  // v2765 (propriétaire) : deux onglets en HAUT de la page — « Paris » (les matchs) et « Mes paris » (mes reçus)
  var view = 'list', mineCache = null;
  function openCount() { return (mineCache || []).filter(function (b) { return b.status === 'open'; }).length; }
  function tabs() {
    var x = X(), n = openCount();
    if (sbOn) { // 2026-10-22 : paris automatiques visibles → Football · Actualité · Mes paris
      var s = SX();
      return '<div class="sp2-tabs sb-tabs" role="tablist"><button type="button" role="tab" data-sv="foot" class="' + (isSbView() ? 'on' : '') + '">' + sico('foot') + '<span class="fit">' + esc(s.foot) + '</span></button>' +
        (events.some(isQev) ? '<button type="button" role="tab" data-sv="list" class="' + (view === 'list' ? 'on' : '') + '">' + SBIC.news + '<span class="fit">' + esc(s.news) + '</span></button>' : '') + // Actualité : seulement s'il y a des prédictions
        '<button type="button" role="tab" data-sv="mine" class="' + (view === 'mine' ? 'on' : '') + '"><span class="fit">' + esc(x.mine) + '</span>' + (n ? '<i class="sp2-badge">' + n + '</i>' : '') + '</button></div>';
    }
    return '<div class="sp2-tabs" role="tablist"><button type="button" role="tab" data-sv="list" class="' + (view !== 'mine' ? 'on' : '') + '"><span class="fit">' + esc(x.betsTab) + '</span></button>' +
      '<button type="button" role="tab" data-sv="mine" class="' + (view === 'mine' ? 'on' : '') + '"><span class="fit">' + esc(x.mine) + '</span>' + (n ? '<i class="sp2-badge">' + n + '</i>' : '') + '</button></div>';
  }
  function paintBadge() {
    var b = box && box.querySelector('.sp2-tabs [data-sv="mine"]'); if (!b) return;
    var i = b.querySelector('.sp2-badge'), n = openCount();
    if (!n) { if (i) i.remove(); return; }
    if (!i) { i = document.createElement('i'); i.className = 'sp2-badge'; b.appendChild(i); }
    i.textContent = String(n); fitEl(b.querySelector('.fit'));
  }
  function layoutVars() {
    // les onglets restent collés sous l'en-tête fixe (sa hauteur change : visiteur / connecté) ; bords alignés sur la marge de la page
    try {
      var tp = document.querySelector('#casinoModal .cs-top'), mb = box.closest('.modal-box');
      if (tp) box.style.setProperty('--sp-top', Math.max(40, tp.offsetHeight - 6) + 'px');
      if (mb) { var cs = getComputedStyle(mb); box.style.setProperty('--sp2-px', (parseFloat(cs.paddingLeft) || 14) + 'px'); box.style.setProperty('--sp2-pb', (parseFloat(cs.paddingBottom) || 18) + 'px'); }
      // 2026-10-21 : la barre du ticket et le bloc de mise restent AU-DESSUS du bas réellement visible (barre de Safari,
      // bande du bas de l'appli iPhone) : si la page descend plus bas que ce qui se voit, on les remonte d'autant
      var ae = document.activeElement, typing = ae && /^(INPUT|TEXTAREA|SELECT)$/.test(ae.tagName || '');
      if (mb && !typing) { // (clavier ouvert : rien ne bouge)
        var vv = window.visualViewport, vis = window.innerHeight || 0;
        if (vv && vv.height > 200) vis = Math.min(vis, vv.height + (vv.offsetTop || 0));
        var ih = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--ios-site-h')) || 0;
        var app = document.documentElement.classList.contains('ios-app');
        if (app && ih > 200) vis = Math.min(vis, ih);
        // propriétaire (iPhone Safari) : la barre du ticket montait très haut avec un grand bloc noir dessous quand on
        // choisissait un match → dans le navigateur, plus de remontée (Safari place déjà la fenêtre au-dessus de sa barre) ;
        // seulement dans l'appli iPhone installée (bande du bas).
        var lift = app ? Math.max(0, Math.min(140, Math.round(mb.getBoundingClientRect().bottom - vis))) : 0;
        box.style.setProperty('--sp2-lift', lift + 'px');
      }
    } catch (e) { /* ignore */ }
  }
  (function () {
    var t = 0, again = function () { clearTimeout(t); t = setTimeout(function () { if (box && box.isConnected && box.classList.contains('sp2')) layoutVars(); }, 120); };
    window.addEventListener('resize', again);
    if (window.visualViewport) window.visualViewport.addEventListener('resize', again);
  })();
  function bindTabs() {
    layoutVars();
    box.querySelectorAll('.sp2-tabs [data-sv]').forEach(function (b) { b.addEventListener('click', function () { var v = b.getAttribute('data-sv'); sbAuto = false; if (v === view) return; if (v === 'foot' || v === 'list') listView = v; view = v; render(); var mb = box.closest('.modal-box'); if (mb) mb.scrollTop = 0; }); });
  }
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
    var lgAll = e.league ? trW(e.league) : '', cut = lgAll.indexOf(' · '), lgName = cut > 0 ? lgAll.slice(0, cut) : lgAll, note = cut > 0 ? lgAll.slice(cut + 3) : '';
    return '<article class="sp2-ev' + (q ? ' sp2-isq' : '') + (ins ? ' sp2-ins' : '') + (e.open ? '' : ' shut') + (settled ? ' done' : '') + '" data-card="' + esc(e.id) + '">' +
      '<div class="sp2-meta"><span class="sp2-lg">' + sico(qKind(e)) + '<span class="fit">' + esc(lgName || (x.sport[qKind(e)] || x.sport.autre)) + '</span></span>' + chip + '</div>' +
      head + (note ? '<p class="sp2-note"><span class="fit">' + esc(note) + '</span></p>' : '') + '<div class="sp2-odds n' + e.opts.length + '">' + opts + '</div></article>';
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
  function renderList() {
    var x = XX(), evs = sbOn ? events.filter(isQev) : events; // 2026-10-22 : Actualité = prédictions seulement (les matchs sont dans Football)
    if (!evs.length) { box.innerHTML = tabs() + empty(x.none); bindTabs(); fitAll(box); return; }
    // colonnes de la grille calculées AVANT le dessin (même règle que css/sports2.css : cartes de 330 px au moins, 10 px d'écart)
    var bw = box.clientWidth || 0; if (bw > 0) gridCols = Math.max(1, Math.floor((bw + 10) / 340));
    var items = feed(evs, gridCols);
    // en-tête de jour : seulement les matchs (une prédiction glissée entre deux matchs ne change pas de jour)
    var key = function (it) { return it.res ? 'res' : it.tail ? 'q' : it.ins ? null : new Date(it.e.start * 1000).toDateString(); };
    var cnt = {}, cur = '';
    items.forEach(function (it) { var k = key(it); if (k) cur = k; if (!it.ins) cnt[cur] = (cnt[cur] || 0) + 1; });
    var list = document.createElement('div'), last = '', fresh = [], keep = {};
    list.className = 'sp2-list';
    items.forEach(function (it) {
      var k = key(it), e = it.e;
      if (k && k !== last) { last = k; list.insertAdjacentHTML('beforeend', '<h4 class="sp2-day' + (k === 'q' ? ' sp2-dq' : '') + '"><span class="fit">' + esc(k === 'res' ? x.results : k === 'q' ? x.sport.event : dayLabel(e.start)) + '</span><i>' + cnt[k] + '</i></h4>'); }
      keep[e.id] = 1;
      list.appendChild(cardEl(e, it.ins, fresh));
    });
    Object.keys(cardCache).forEach(function (id) { if (!keep[id]) delete cardCache[id]; });
    box.innerHTML = tabs();
    box.appendChild(list);
    var bar = slipBar(); if (bar) box.insertAdjacentHTML('beforeend', bar);
    var gc = 1; try { gc = Math.max(1, getComputedStyle(list).gridTemplateColumns.split(' ').filter(Boolean).length); } catch (e) { /* ignore */ }
    if (gc !== gridCols) { gridCols = gc; renderList(); return; } // (rare) mêmes cartes gardées : rien ne saute à l'écran
    list.addEventListener('click', function (ev) { var b = ev.target.closest && ev.target.closest('.sp2-o'); if (b && !b.disabled) pick(b); });
    bindTabs(); bindSlip();
    // textes élastiques : toute la page si la largeur a changé, sinon seulement les cartes neuves (moins de travail, rien ne bouge)
    var w = box.clientWidth || 0;
    if (w !== fitW) { fitW = w; fitAll(box); }
    else { fitAll(box.querySelector('.sp2-tabs')); list.querySelectorAll('.sp2-day').forEach(fitAll); fresh.forEach(fitAll); fitAll($('spSbar')); }
    startTick();
  }
  // toucher une cote : on l'ajoute / l'enlève du coupon SANS redessiner toute la liste (rapide, la page ne saute pas)
  function pick(b) {
    var x = X(), ev = b.getAttribute('data-ev'), k = b.getAttribute('data-k'), e = evById(ev);
    if (!e || !e.open || nowS() >= e.start) return;
    var o = e.opts.filter(function (z) { return z.k === k; })[0]; if (!o) return;
    var had = inSlip(ev, k), n0 = slip.length;
    if (!had && !slip.some(function (s) { return s.ev === ev; }) && slip.length >= 50) { if (ctx.toast) ctx.toast(x.max10); return; } // 2026-10-21 : 50 matchs (avant 10)
    // v2810 : une prédiction se joue SEULE ; deux choix liés (même groupe : même match, même actif…) jamais dans le même coupon
    if (!had) {
      var xx = XX(), others = slip.filter(function (s) { return s.ev !== ev; }).map(function (s) { return evById(s.ev) || { q: !!s.q, grp: s.grp || [] }; });
      var isQ = function (z) { return !!(z && (z.q || EVK[z.sport])); }, g = e.grp || [];
      if (others.length && (isQ(e) || others.some(isQ))) { if (ctx.toast) ctx.toast(xx.e_single, 'info'); return; }
      if (others.some(function (z) { return (z.grp || []).some(function (y) { return g.indexOf(y) > -1; }); })) { if (ctx.toast) ctx.toast(xx.e_corr, 'info'); return; }
    }
    slip = slip.filter(function (s) { return s.ev !== ev; }); // un seul choix par match
    if (!had) slip.push({ ev: ev, k: k, odd: o.odd, t: trT(e), l: trO(o.label), q: !!(e.q || EVK[e.sport]), grp: e.grp || [] });
    var c = b.closest('.sp2-ev');
    if (c) c.querySelectorAll('.sp2-o').forEach(function (z) { var on = inSlip(ev, z.getAttribute('data-k')); z.classList.toggle('on', on); z.setAttribute('aria-pressed', String(on)); });
    paintBar(slip.length > n0);
  }

  /* v2766 (propriétaire) — COUPON comme les grands sites : une barre en bas « Coupon · n choix · cote » qui s'ouvre en
     GRANDE PAGE. v2798 : la barre reste collée en bas de l'écran pendant qu'on fait défiler les matchs. */
  var lastBet = null, clearArm = 0, sending = false;
  function guestNote() { var x = X(); if (D6.App && D6.App.toast) D6.App.toast(x.guestBet, 'info'); }
  function slipBar() {
    if (!slip.length || (view !== 'list' && view !== 'foot' && view !== 'match')) return '';
    var x = X();
    return '<button type="button" class="sp2-bar" id="spSbar"><span class="sp2-bar-n">' + slip.length + '</span><span class="sp2-bar-t"><b class="fit">' + esc(x.coupon) + '</b><small class="fit">' + esc(fmt(x.sel, { n: slip.length })) + '</small></span>' +
      '<span class="sp2-bar-o"><small class="fit">' + esc(x.totalOdd) + '</small><b>' + totalOdd().toFixed(2) + '</b></span><em class="sp2-bar-go">' + IC.back + '</em></button>';
  }
  function paintBar(bump) {
    var old = $('spSbar'); if (old) old.remove();
    var html = slipBar(); if (!html || !box) return;
    box.insertAdjacentHTML('beforeend', html);
    var nb = $('spSbar'); bindSlip(); fitAll(nb);
    if (bump && nb) nb.classList.add('bump');
  }
  function bindSlip() {
    var b = $('spSbar'); if (b) b.addEventListener('click', function () { if (view === 'foot' || view === 'match') listView = 'foot'; else if (view === 'list') listView = 'list'; view = 'slip'; render(); sbAfterSlipOpen(); });
  }

  // ---------- compte à rebours (un seul minuteur, arrêté dès qu'on quitte la page) ----------
  var tick = 0;
  function startTick() {
    clearInterval(tick);
    tick = setInterval(function () {
      if (!box || !box.isConnected || !box.classList.contains('sp2')) { clearInterval(tick); tick = 0; return; }
      var n = nowS(), x = XX();
      box.querySelectorAll('[data-ts]').forEach(function (el) {
        var s = +el.getAttribute('data-ts') - n, sp = el.querySelector('span');
        if (s <= 0) {
          el.removeAttribute('data-ts'); el.classList.add('gone'); el.classList.remove('soon'); setTx(sp, x.inPlay);
          var c = el.closest('[data-card]');
          if (c) { c.classList.add('shut'); c.querySelectorAll('.sp2-o').forEach(function (b) { b.disabled = true; }); var e = evById(c.getAttribute('data-card')); if (e) e.open = false; }
          return;
        }
        el.classList.toggle('soon', s < 3600); setTx(sp, cd(s));
      });
      if (view === 'slip' && !sending && !lastBet && slip.some(function (s) { var e = evById(s.ev); return !s.closed && (s.sb ? n >= s.ko : e && n >= e.start); })) { syncSlip(); render(); }
    }, 20000);
  }

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
      return '<div class="sp2-bs r-' + esc(r) + '"><i class="sp2-ri">' + ic + '</i><div class="sp2-bst"><small class="fit" dir="auto">' + esc(s.t) + '</small><b class="fit" dir="auto">' + esc(sbOutL(s.mk, s.k, tm[0], tm[1])) + '</b><small class="fit sb-bsm" dir="auto">' + esc(sbMkName(s.mk, tm[0], tm[1])) + '</small></div><em>' + Number(s.odd).toFixed(2) + '</em></div>';
    }
    return '<div class="sp2-bs r-' + esc(r) + '"><i class="sp2-ri">' + ic + '</i><div class="sp2-bst">' + linesHtml(e ? trT(e) : s.t, 'small', right ? 20 : 34, true) + '<b class="fit" dir="auto">' + esc(trO(s.l)) + '</b></div>' + right + '<em>' + Number(s.odd).toFixed(2) + '</em></div>';
  }
  /* 2026-10-21 (propriétaire : « Mes paris : chaque pari tout ouvert, pas pro ») — une LIGNE compacte par pari, comme les
     grands sites : état, type (« Combiné · 3 »), date, les choix sur une ligne, mise · cote · gain. Toucher la ligne l'ouvre
     (chaque sélection avec son résultat, numéro, « Voir le reçu »). 30 paris affichés, puis « Afficher plus ». */
  var rcOpen = {}, rcLimit = 30;
  function receipts(bets) {
    var x = XX();
    if (!bets.length) return empty(x.noBets, x.seeBets, null, 'list');
    var ST = { open: x.open, won: x.wonL, lost: x.lostL, void: x.voidL };
    var html = bets.slice(0, rcLimit).map(function (bt, bi) {
      var st = bt.status || 'open', id = String(bt.id || ''), on = !!rcOpen[id];
      var big = st === 'won' ? '+' + money(bt.win) : st === 'lost' ? '−' + money(bt.stake) : money(st === 'void' ? bt.stake : bt.pot);
      var lab = st === 'won' ? x.wonL : st === 'lost' ? x.lostL : st === 'void' ? x.voidL : x.potL;
      var multi = bt.sel.length > 1, kind = multi ? x.rcCombo + ' · ' + bt.sel.length : x.rcSingle;
      var s0 = bt.sel[0] || { t: '', l: '' }, e0 = evByTitle(s0.t);
      var sum = multi ? bt.sel.map(function (s) { return esc(selLbl(s)); }).join('<i> · </i>')
        : '<b>' + esc(selLbl(s0)) + '</b><i> · </i>' + esc(e0 ? trT(e0) : s0.t);
      return '<div class="sp2-bet st-' + esc(st) + (on ? ' on' : '') + '" data-rc="' + bi + '" data-id="' + esc(id) + '">' +
        '<button type="button" class="sp2-bhd" aria-expanded="' + on + '">' +
          '<span class="sp2-bh"><em class="sp2-pill"><span class="fit">' + esc(ST[st] || st) + '</span></em><span class="fit sp2-kind">' + esc(kind) + '</span><small class="fit">' + esc(bt.at ? when2(bt.at) : '') + '</small></span>' +
          '<span class="sp2-bsum" dir="auto">' + sum + '</span>' +
          '<span class="sp2-bf"><span><small class="fit">' + esc(x.stakeL) + '</small><b class="fit">' + money(bt.stake) + '</b></span><span><small class="fit">' + esc(x.oddL) + '</small><b class="fit">' + Number(bt.odd).toFixed(2) + '</b></span>' +
          '<span class="big"><small class="fit">' + esc(lab) + '</small><b class="fit">' + big + '</b></span><i class="sp2-chev">' + IC.back + '</i></span></button>' +
        (on ? rcBody(bt) : '') + '</div>';
    }).join('');
    if (bets.length > rcLimit) html += '<button type="button" class="sp2-more" id="spMore"><span class="fit">' + esc(x.more) + ' (' + (bets.length - rcLimit) + ')</span></button>';
    return html;
  }
  function rcBody(bt) {
    var x = XX();
    return '<div class="sp2-bx">' + bt.sel.map(selRow).join('') +
      '<div class="sp2-bid"><span class="fit">#' + esc(String(bt.id || '').slice(-8).toUpperCase()) + '</span><button type="button" class="sp2-rcv" data-rcv="1"><span class="fit">' + esc(x.rcSee) + '</span>' + IC.back + '</button></div></div>';
  }
  async function renderMine() {
    var x = XX();
    if (ctx.guest) {
      box.innerHTML = tabs() + empty(x.guestMine, x.guestBtn, 'spMineSign');
      bindTabs(); fitAll(box); if ($('spMineSign')) $('spMineSign').addEventListener('click', function () { if (ctx.signup) ctx.signup(); });
      return;
    }
    box.innerHTML = tabs() + mineBar() + '<div class="sp2-bets" id="spRcs">' + (mineCache ? receipts(shown = filt(mineCache)) : '<div class="sp2-bet sp2-skel"><i></i><i></i><i></i></div><div class="sp2-bet sp2-skel"><i></i><i></i><i></i></div>') + '</div>';
    bindTabs(); bindRc(); bindMine(); fitAll(box); startTick();
    var r = await loadMine();
    if (view !== 'mine' || !$('spRcs')) return;
    if (r) { mineCache = r; paintMine(); paintBadge(); }
    else if (!mineCache) $('spRcs').innerHTML = '<p class="sp2-none fit">' + esc(x.e_unavailable) + '</p>';
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
    box.querySelectorAll('.sp2-cta[data-sv]').forEach(function (b) { b.addEventListener('click', function () { view = lv(); render(); }); });
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
    el.innerHTML = '<div class="sp-rcpt-card ' + esc(st) + '" role="dialog" aria-modal="true">' +
      '<div class="sp-rcpt-top"><img src="icons/logo-ring.svg" alt=""><div><b>OROLADO</b><small>orolado.com</small></div><span>' + esc(x.rcTitle) + '</span></div>' +
      '<div class="sp-rcpt-st"><em class="' + esc(st) + '">' + esc(stTxt) + '</em><small>' + esc(bigLab) + '</small><strong>' + big + ' $</strong></div>' +
      '<div class="sp-rcpt-cut"></div>' +
      '<div class="sp-rcpt-sels"><p class="sp-rcpt-k">' + esc(bt.sel.length > 1 ? x.rcCombo : x.rcSingle) + ' · ' + bt.sel.length + '</p>' + bt.sel.map(function (s) {
        return '<div class="sp-rcpt-s ' + (s.r || 'open') + '">' + (ICO[s.r] || '<i class="op">•</i>') + '<span><small>' + esc(s.t) + '</small><b>' + esc(s.mk ? selLbl(s) : s.l) + '</b></span><em>' + Number(s.odd).toFixed(2) + '</em></div>';
      }).join('') + '</div>' +
      '<div class="sp-rcpt-rows"><p><span>' + esc(x.stakeL) + '</span><b>' + m2(bt.stake) + ' $</b></p><p><span>' + esc(x.totalOdd) + '</span><b>' + Number(bt.odd).toFixed(2) + '</b></p>' +
      '<p><span>' + esc(x.potL) + '</span><b>' + m2(bt.pot) + ' $</b></p><p><span>' + esc(x.rcDate) + '</span><b>' + dt + '</b></p><p><span>' + esc(x.rcNo) + '</span><b class="mono">' + esc(no) + '</b></p></div>' +
      '<div class="sp-rcpt-bars" aria-hidden="true">' + bars + '</div><p class="sp-rcpt-foot">orolado.com</p>' +
      '<div class="sp-rcpt-btns"><button type="button" class="sp-rcpt-share">' + (D6.ReceiptIcon ? '<span class="sp-rcpt-dli">' + D6.ReceiptIcon + '</span>' : '') + esc((D6.Receipt && D6.Receipt.dlLabel && D6.Receipt.dlLabel()) || x.rcShare) + '</button><button type="button" class="sp-rcpt-close">' + esc(x.rcClose) + '</button></div></div>';
    document.body.appendChild(el);
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
  function render() {
    if (box) box.dataset.sig = (lastJson || '') + '|' + view + '|' + (document.documentElement.lang || '');
    if (!box) return;
    box.classList.add('sp2');
    if (view === 'mine') { renderMine(); return; }
    if (view === 'slip') { renderSlip(); return; }
    if ((view === 'foot' || view === 'match') && sbOn === false) view = 'list';
    if (view === 'foot') { renderFoot(); return; }
    if (view === 'match') { renderMatch(); return; }
    renderList();
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
  function accMode() { return 'none'; }
  function keepSel() { return false; }
  function mode() { return slip.length < 2 ? 'single' : 'combo'; }
  function cur() { return '$'; } // monnaie affichée (la monnaie locale viendra ici)
  function qtxt(v) { return (v % 1 ? m2(v) : String(v)) + ' ' + cur(); }
  function mkt(e) { var x = XX(); if (!e) return ''; if (e.q || EVK[e.sport]) return x.mktQ; return e.opts && e.opts.length === 3 ? x.mkt3 : x.mkt2; }
  function stOf() { return stake; }
  function slipHead() {
    var x = XX();
    return '<div class="sp2-sh"><span class="sp2-sh-ic">' + IC.slip + '</span><b class="fit">' + esc(x.coupon) + '</b>' +
      (slip.length && !lastBet && !lastBets ? '<i class="sp2-badge">' + slip.length + '</i>' +
        '<button type="button" class="sp2-clear" id="spCpClear">' + IC.trash + '<span class="fit">' + esc(x.clearAll) + '</span></button>' : '') + '</div>';
  }
  function backToList() { lastBet = null; lastBets = null; view = lv(); render(); }
  function slipTop() { try { var mb = box.closest('.modal-box'); if (mb) mb.scrollTop = 0; } catch (e) { /* ignore */ } }
  function renderDone() {
    var x = XX(), bs = lastBets || [lastBet], one = bs.length === 1, lb = bs[0];
    var tst = bs.reduce(function (a, b) { return a + b.stake; }, 0), tpot = bs.reduce(function (a, b) { return a + b.pot; }, 0);
    box.innerHTML = '<div class="sp2-page sp2-donep">' + slipHead() + '<div class="sp2-done"><span class="sp2-done-ok">' + IC.ok + '</span><b class="fit sp2-done-t">' + esc(one ? x.done : fmt(x.doneN, { n: bs.length })) + '</b>' +
      '<div class="sp2-done-c"><p><span class="fit">' + esc(one ? x.stakeL : x.totSt) + '</span><b class="fit">' + money(tst) + '</b></p>' + (one ? '<p><span class="fit">' + esc(x.oddL) + '</span><b class="fit">' + Number(lb.odd).toFixed(2) + '</b></p>' : '') +
      '<p class="win"><span class="fit">' + esc(x.potL) + '</span><b class="fit">' + money(tpot) + '</b></p></div>' +
      (one ? '<small class="sp2-done-id fit">#' + esc(String(lb.id || '').slice(-8).toUpperCase()) + '</small>' : '') +
      '<div class="sp2-done-b">' + (one ? '<button type="button" class="sp2-cta" id="spSeeRc"><span class="fit">' + esc(x.rcSee) + '</span></button>' : '') +
      '<div><button type="button" class="sp2-cta2" id="spSeeMine"><span class="fit">' + esc(x.mine) + '</span></button><button type="button" class="sp2-cta2" id="spCont"><span class="fit">' + esc(x.cont) + '</span></button></div></div></div></div>';
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
      box.innerHTML = '<div class="sp2-page">' + slipHead() + empty(x.emptySlip, x.seeBets, 'spCont') + (sbOn ? '<div class="sb-code sb-load"><p class="sb-mkt"><span class="fit">' + esc(SX().loadCode) + '</span></p>' + codeRow() + '</div>' : '') + '</div>';
      slipTop(); fitAll(box); bindCodeRow(box);
      $('spCont').addEventListener('click', backToList);
      return;
    }
    var md = mode(), each = false, odd = totalOdd();
    var expl = '<div class="sp2-type-t sp2-expl">' + linesHtml(cap1(md === 'combo' ? x.combo : slip.length > 1 ? x.singleN : (slip[0].q ? x.qOnly : x.singleX)), 'span', 40) + '</div>';
    var list = '<div class="sp2-sels" id="spSels">' + slip.map(function (z, i) {
      var e = z.sb ? null : evById(z.ev), st = stOf(z);
      return '<div class="sp2-sel' + (z.closed ? ' closed' : '') + (z.chg ? ' chg' : '') + '"><div class="sp2-sel-r"><span class="sp2-sel-ic">' + sico(z.sb ? 'foot' : e ? qKind(e) : 'autre') + '</span>' +
        '<div class="sp2-sel-t"><b class="fit" dir="auto">' + esc(z.closed ? x.closed : z.l) + '</b>' + linesHtml(e ? trT(e) : z.t, 'small', 44, true) + '<small class="sp2-mkt fit" dir="auto">' + esc(z.sb ? sbMkName(z.mk, z.h.n, z.a.n) : mkt(e)) + '</small></div>' +
        '<em>' + (z.closed ? IC.lock : Number(z.odd).toFixed(2)) + '</em><button type="button" class="sp2-x" data-i="' + i + '" aria-label="×">' + IC.x + '</button></div>' +
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
    box.innerHTML = '<div class="sp2-page sp2-slip ' + md + '">' + slipHead() + expl + list + (sbOn ? '<div class="sb-code" id="sbCode">' + codeBox() + '</div>' : '') + stk + '</div>';
    slipTop(); fitAll(box); startTick(); if (sbOn) bindCodeBox();
    slip.forEach(function (z) { z.chg = false; });
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
  /* Retour d'un cran (flèche ‹ de la page et bouton retour du téléphone, via js/casino.js) : reçu ouvert → fermé ;
     réglages du ticket → fermés ; ticket ou « Mes paris » → liste des matchs. Renvoie true si Paris a géré le retour. */
  function back() {
    var rc = document.getElementById('spRcpt');
    if (rc) { rc.classList.remove('on'); setTimeout(function () { rc.remove(); }, 220); return true; }
    if (!box || !box.isConnected || !box.classList.contains('sp2')) return false;
    if (view === 'slip') { if (!sending) { lastBet = null; lastBets = null; view = lv(); render(); } return true; }
    if (view === 'match') { view = 'foot'; render(); return true; }
    if (view === 'mine') { view = lv(); render(); var mb = box.closest('.modal-box'); if (mb) mb.scrollTop = 0; return true; }
    return false;
  }
  // pendant l'envoi : tout est bloqué (pas de double pari, pas de choix retiré en route)
  function busy(on) {
    var g = $('spGo'), x = XX(); if (!g) return;
    g.disabled = on; g.classList.toggle('wait', on);
    setTx($('spGoT'), on ? x.sending : mode() === 'single' && slip.length > 1 ? fmt(x.placeN, { n: slip.length }) : x.placeB);
    box.querySelectorAll('.sp2-page button:not(#spGo), .sp2-page input').forEach(function (b) { b.disabled = on; });
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
    sending = false;
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
    if (why === 'odds' && failR && Array.isArray(failR.odds)) failR.odds.forEach(function (o) { slip.forEach(function (z) { if (z.ev === o.ev && z.k === o.k && Math.abs(z.odd - o.odd) > 1e-9) { z.odd = +o.odd; z.chg = true; } }); }); // nouvelles cotes du serveur
    if ((why === 'odds' || why === 'closed') && slip.some(function (z) { return z.sb; })) await sbRefreshSlip();
    if (why === 'odds' || why === 'closed') { var l = await fetchList(); if (l) { lastList = events = l; lastJson = JSON.stringify(l); syncSlip(); } }
    if (view === 'slip') render();
    if (ctx.toast) ctx.toast((okBets.length ? fmt(x.partial, { ok: okBets.length, n: jobs.length }) + ' · ' : '') + (x['e_' + why] || x.e_unavailable));
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
    fr: ['Football', 'Actualité', 'Top', 'Aujourd’hui', 'Demain', 'Après-demain', 'Favoris', 'Équipe ou championnat', 'Aucun match pour ce choix.', 'Touche ☆ sur un championnat ou un match pour le retrouver ici.',
      'Règles : 90 min + arrêts de jeu (sans prolongation ni tirs au but) · paris fermés au coup d’envoi · match reporté et pas joué sous 48 h : remboursé.', 'Principaux', 'Buts', 'Mi-temps', 'Score exact', 'Handicap', 'Combinés', 'Défense',
      'Partager / Code', 'Code du coupon', 'Copier', 'Copié !', 'Charger un code', 'Charger', 'Code inconnu ou expiré.', '{n} choix ignoré(s) : match commencé ou fermé.', '{n} choix pas encore disponible(s) pour toi.', 'Coupon chargé : {n} choix.', 'Valable 7 jours · la cote du moment est prise au pari', 'Ex. : K7M2QX',
      'Plus de {x}', 'Moins de {x}', 'Oui', 'Non', 'Impair', 'Pair', 'Nul', '1re mi-temps', '2e mi-temps', 'Égalité',
      'Résultat du match', 'Double chance', 'Remboursé si nul', 'Total de buts', 'Les deux équipes marquent', 'Buts de {t}', 'Total de buts pair / impair', '{t} n’encaisse pas de but', '{t} gagne sans encaisser', 'Handicap (3 issues)', 'Handicap asiatique', 'Résultat à la mi-temps', '1re mi-temps : total de buts', '1re mi-temps : les deux marquent', 'Résultat de la 2e mi-temps', 'Mi-temps / fin du match', 'Score exact', 'Résultat + les deux marquent', 'Résultat + total de buts', 'Nombre exact de buts', 'Mi-temps avec le plus de buts', 'Un instant…', 'Paris fermés pour ce match.', '1re mi-temps : double chance', '2e mi-temps : double chance', '2e mi-temps : les deux marquent', '1re mi-temps : score exact', '1re mi-temps : buts pair / impair', '2e mi-temps : buts pair / impair', '2e mi-temps : total de buts', '1re mi-temps : buts de {t}', '1re mi-temps : handicap asiatique'],
    en: ['Football', 'News', 'Top', 'Today', 'Tomorrow', 'Day after', 'Favourites', 'Team or league', 'No match for this choice.', 'Tap ☆ on a league or a match to find it here.',
      'Rules: 90 min + stoppage time (no extra time or penalties) · betting closes at kick-off · match postponed and not played within 48 h: refunded.', 'Main', 'Goals', 'Halves', 'Correct score', 'Handicap', 'Combos', 'Defence',
      'Share / Code', 'Booking code', 'Copy', 'Copied!', 'Load a code', 'Load', 'Unknown or expired code.', '{n} pick(s) skipped: match started or closed.', '{n} pick(s) not available to you yet.', 'Slip loaded: {n} pick(s).', 'Valid 7 days · the current odds apply when you bet', 'E.g. K7M2QX',
      'Over {x}', 'Under {x}', 'Yes', 'No', 'Odd', 'Even', 'Draw', '1st half', '2nd half', 'Equal',
      'Match result', 'Double chance', 'Draw no bet', 'Total goals', 'Both teams to score', '{t} goals', 'Total goals odd / even', '{t} clean sheet', '{t} to win to nil', 'Handicap (3-way)', 'Asian handicap', 'Half-time result', '1st half: total goals', '1st half: both teams to score', '2nd half result', 'Half-time / full-time', 'Correct score', 'Result + both teams to score', 'Result + total goals', 'Exact total goals', 'Highest scoring half', 'One moment…', 'Betting closed for this match.', '1st half: double chance', '2nd half: double chance', '2nd half: both teams to score', '1st half: correct score', '1st half: goals odd / even', '2nd half: goals odd / even', '2nd half: total goals', '1st half: {t} goals', '1st half: Asian handicap'],
    es: ['Fútbol', 'Actualidad', 'Top', 'Hoy', 'Mañana', 'Pasado mañana', 'Favoritos', 'Equipo o liga', 'Ningún partido para esta opción.', 'Toca ☆ en una liga o un partido para encontrarlo aquí.',
      'Reglas: 90 min + descuento (sin prórroga ni penaltis) · apuestas cerradas al inicio · partido aplazado y no jugado en 48 h: reembolso.', 'Principales', 'Goles', 'Mitades', 'Resultado exacto', 'Hándicap', 'Combinadas', 'Defensa',
      'Compartir / Código', 'Código de cupón', 'Copiar', '¡Copiado!', 'Cargar un código', 'Cargar', 'Código desconocido o caducado.', '{n} selección(es) omitida(s): partido empezado o cerrado.', '{n} selección(es) aún no disponible(s) para ti.', 'Cupón cargado: {n} selección(es).', 'Válido 7 días · se aplica la cuota del momento', 'Ej.: K7M2QX',
      'Más de {x}', 'Menos de {x}', 'Sí', 'No', 'Impar', 'Par', 'Empate', '1.ª parte', '2.ª parte', 'Igual',
      'Resultado del partido', 'Doble oportunidad', 'Empate no válido', 'Total de goles', 'Ambos equipos marcan', 'Goles de {t}', 'Total de goles par / impar', '{t} portería a cero', '{t} gana sin encajar', 'Hándicap (3 opciones)', 'Hándicap asiático', 'Resultado al descanso', '1.ª parte: total de goles', '1.ª parte: ambos marcan', 'Resultado 2.ª parte', 'Descanso / final', 'Resultado exacto', 'Resultado + ambos marcan', 'Resultado + total de goles', 'Número exacto de goles', 'Parte con más goles', 'Un momento…', 'Apuestas cerradas para este partido.', '1.ª parte: doble oportunidad', '2.ª parte: doble oportunidad', '2.ª parte: ambos marcan', '1.ª parte: resultado exacto', '1.ª parte: goles par / impar', '2.ª parte: goles par / impar', '2.ª parte: total de goles', '1.ª parte: goles de {t}', '1.ª parte: hándicap asiático'],
    pt: ['Futebol', 'Atualidade', 'Top', 'Hoje', 'Amanhã', 'Depois de amanhã', 'Favoritos', 'Time ou liga', 'Nenhum jogo para esta opção.', 'Toque em ☆ numa liga ou num jogo para encontrá-lo aqui.',
      'Regras: 90 min + acréscimos (sem prorrogação nem pênaltis) · apostas fechadas no início · jogo adiado e não disputado em 48 h: reembolso.', 'Principais', 'Gols', 'Tempos', 'Placar exato', 'Handicap', 'Combinadas', 'Defesa',
      'Partilhar / Código', 'Código do bilhete', 'Copiar', 'Copiado!', 'Carregar um código', 'Carregar', 'Código desconhecido ou expirado.', '{n} seleção(ões) ignorada(s): jogo iniciado ou fechado.', '{n} seleção(ões) ainda indisponível(is) para você.', 'Bilhete carregado: {n} seleção(ões).', 'Válido 7 dias · vale a odd do momento', 'Ex.: K7M2QX',
      'Mais de {x}', 'Menos de {x}', 'Sim', 'Não', 'Ímpar', 'Par', 'Empate', '1.º tempo', '2.º tempo', 'Igual',
      'Resultado do jogo', 'Dupla chance', 'Empate anula', 'Total de gols', 'Ambas marcam', 'Gols de {t}', 'Total de gols par / ímpar', '{t} não sofre gol', '{t} vence sem sofrer gol', 'Handicap (3 resultados)', 'Handicap asiático', 'Resultado ao intervalo', '1.º tempo: total de gols', '1.º tempo: ambas marcam', 'Resultado do 2.º tempo', 'Intervalo / final', 'Placar exato', 'Resultado + ambas marcam', 'Resultado + total de gols', 'Número exato de gols', 'Tempo com mais gols', 'Um momento…', 'Apostas fechadas para este jogo.', '1.º tempo: dupla chance', '2.º tempo: dupla chance', '2.º tempo: ambas marcam', '1.º tempo: placar exato', '1.º tempo: gols par / ímpar', '2.º tempo: gols par / ímpar', '2.º tempo: total de gols', '1.º tempo: gols de {t}', '1.º tempo: handicap asiático'],
    ar: ['كرة القدم', 'الأحداث', 'الأبرز', 'اليوم', 'غدًا', 'بعد غد', 'المفضلة', 'فريق أو دوري', 'لا توجد مباراة لهذا الاختيار.', 'اضغط ☆ على دوري أو مباراة لتجدها هنا.',
      'القواعد: 90 دقيقة + الوقت بدل الضائع (بدون أشواط إضافية أو ركلات ترجيح) · تُغلق الرهانات عند انطلاق المباراة · مباراة مؤجلة ولم تُلعب خلال 48 ساعة: استرداد.', 'الرئيسية', 'الأهداف', 'الأشواط', 'النتيجة الصحيحة', 'الهانديكاب', 'مركّبة', 'الدفاع',
      'مشاركة / رمز', 'رمز القسيمة', 'نسخ', 'تم النسخ!', 'تحميل رمز', 'تحميل', 'رمز غير معروف أو منتهي.', 'تم تجاهل {n} اختيار: المباراة بدأت أو أُغلقت.', '{n} اختيار غير متاح لك بعد.', 'تم تحميل القسيمة: {n} اختيار.', 'صالح 7 أيام · تُطبّق الاحتمالات الحالية عند الرهان', 'مثال: K7M2QX',
      'أكثر من {x}', 'أقل من {x}', 'نعم', 'لا', 'فردي', 'زوجي', 'تعادل', 'الشوط الأول', 'الشوط الثاني', 'متساوٍ',
      'نتيجة المباراة', 'فرصة مزدوجة', 'التعادل يلغي الرهان', 'مجموع الأهداف', 'كلا الفريقين يسجل', 'أهداف {t}', 'مجموع الأهداف فردي / زوجي', '{t} بشباك نظيفة', '{t} يفوز بشباك نظيفة', 'هانديكاب (3 نتائج)', 'هانديكاب آسيوي', 'نتيجة الشوط الأول', 'الشوط الأول: مجموع الأهداف', 'الشوط الأول: كلا الفريقين يسجل', 'نتيجة الشوط الثاني', 'الشوط الأول / نهاية المباراة', 'النتيجة الصحيحة', 'النتيجة + كلا الفريقين يسجل', 'النتيجة + مجموع الأهداف', 'العدد الدقيق للأهداف', 'الشوط الأكثر أهدافًا', 'لحظة…', 'الرهانات مغلقة لهذه المباراة.', 'الشوط الأول: فرصة مزدوجة', 'الشوط الثاني: فرصة مزدوجة', 'الشوط الثاني: كلا الفريقين يسجل', 'الشوط الأول: النتيجة الصحيحة', 'الشوط الأول: أهداف فردي / زوجي', 'الشوط الثاني: أهداف فردي / زوجي', 'الشوط الثاني: مجموع الأهداف', 'الشوط الأول: أهداف {t}', 'الشوط الأول: هانديكاب آسيوي'],
    tr: ['Futbol', 'Gündem', 'Öne çıkan', 'Bugün', 'Yarın', 'Öbür gün', 'Favoriler', 'Takım veya lig', 'Bu seçim için maç yok.', 'Burada görmek için bir lig veya maçta ☆ simgesine dokun.',
      'Kurallar: 90 dk + uzatma dakikaları (uzatma devresi ve penaltı yok) · bahisler başlama düdüğünde kapanır · ertelenip 48 saatte oynanmayan maç: iade.', 'Ana', 'Goller', 'Devreler', 'Doğru skor', 'Handikap', 'Kombine', 'Savunma',
      'Paylaş / Kod', 'Kupon kodu', 'Kopyala', 'Kopyalandı!', 'Kod yükle', 'Yükle', 'Bilinmeyen veya süresi dolmuş kod.', '{n} seçim atlandı: maç başladı veya kapandı.', '{n} seçim henüz sana açık değil.', 'Kupon yüklendi: {n} seçim.', '7 gün geçerli · bahiste güncel oran geçerlidir', 'Örn.: K7M2QX',
      '{x} üst', '{x} alt', 'Evet', 'Hayır', 'Tek', 'Çift', 'Beraberlik', '1. yarı', '2. yarı', 'Eşit',
      'Maç sonucu', 'Çifte şans', 'Beraberlikte iade', 'Toplam gol', 'Karşılıklı gol', '{t} golleri', 'Toplam gol tek / çift', '{t} gol yemez', '{t} gol yemeden kazanır', 'Handikap (3 sonuç)', 'Asya handikapı', 'İlk yarı sonucu', '1. yarı: toplam gol', '1. yarı: karşılıklı gol', '2. yarı sonucu', 'İlk yarı / maç sonu', 'Doğru skor', 'Sonuç + karşılıklı gol', 'Sonuç + toplam gol', 'Tam gol sayısı', 'En çok gol olan yarı', 'Bir saniye…', 'Bu maç için bahisler kapandı.', '1. yarı: çifte şans', '2. yarı: çifte şans', '2. yarı: karşılıklı gol', '1. yarı: doğru skor', '1. yarı: gol tek / çift', '2. yarı: gol tek / çift', '2. yarı: toplam gol', '1. yarı: {t} golleri', '1. yarı: Asya handikapı'],
    vi: ['Bóng đá', 'Thời sự', 'Nổi bật', 'Hôm nay', 'Ngày mai', 'Ngày kia', 'Yêu thích', 'Đội hoặc giải đấu', 'Không có trận nào cho lựa chọn này.', 'Chạm ☆ trên một giải hoặc trận đấu để tìm lại ở đây.',
      'Luật: 90 phút + bù giờ (không tính hiệp phụ, luân lưu) · đóng cược khi bóng lăn · trận hoãn và không đá trong 48 giờ: hoàn tiền.', 'Chính', 'Bàn thắng', 'Hiệp', 'Tỷ số chính xác', 'Chấp', 'Kết hợp', 'Phòng ngự',
      'Chia sẻ / Mã', 'Mã phiếu cược', 'Sao chép', 'Đã sao chép!', 'Nhập mã', 'Tải', 'Mã không tồn tại hoặc đã hết hạn.', 'Bỏ qua {n} lựa chọn: trận đã bắt đầu hoặc đã đóng.', '{n} lựa chọn chưa mở cho bạn.', 'Đã tải phiếu: {n} lựa chọn.', 'Hiệu lực 7 ngày · áp dụng tỷ lệ hiện tại khi cược', 'VD: K7M2QX',
      'Tài {x}', 'Xỉu {x}', 'Có', 'Không', 'Lẻ', 'Chẵn', 'Hòa', 'Hiệp 1', 'Hiệp 2', 'Bằng nhau',
      'Kết quả trận', 'Cơ hội kép', 'Hòa hoàn tiền', 'Tổng bàn thắng', 'Cả hai đội ghi bàn', 'Bàn thắng của {t}', 'Tổng bàn chẵn / lẻ', '{t} giữ sạch lưới', '{t} thắng và sạch lưới', 'Chấp châu Âu (3 cửa)', 'Chấp châu Á', 'Kết quả hiệp 1', 'Hiệp 1: tổng bàn thắng', 'Hiệp 1: cả hai đội ghi bàn', 'Kết quả hiệp 2', 'Hiệp 1 / cả trận', 'Tỷ số chính xác', 'Kết quả + cả hai ghi bàn', 'Kết quả + tổng bàn', 'Số bàn thắng chính xác', 'Hiệp nhiều bàn hơn', 'Chờ chút…', 'Đã đóng cược trận này.', 'Hiệp 1: cơ hội kép', 'Hiệp 2: cơ hội kép', 'Hiệp 2: cả hai đội ghi bàn', 'Hiệp 1: tỷ số chính xác', 'Hiệp 1: bàn chẵn / lẻ', 'Hiệp 2: bàn chẵn / lẻ', 'Hiệp 2: tổng bàn thắng', 'Hiệp 1: bàn thắng của {t}', 'Hiệp 1: chấp châu Á'],
    id: ['Sepak bola', 'Aktual', 'Teratas', 'Hari ini', 'Besok', 'Lusa', 'Favorit', 'Tim atau liga', 'Tidak ada laga untuk pilihan ini.', 'Ketuk ☆ pada liga atau laga untuk menemukannya di sini.',
      'Aturan: 90 menit + injury time (tanpa perpanjangan & adu penalti) · taruhan ditutup saat kick-off · laga ditunda dan tidak dimainkan dalam 48 jam: uang kembali.', 'Utama', 'Gol', 'Babak', 'Skor tepat', 'Handicap', 'Kombinasi', 'Pertahanan',
      'Bagikan / Kode', 'Kode kupon', 'Salin', 'Disalin!', 'Muat kode', 'Muat', 'Kode tidak dikenal atau kedaluwarsa.', '{n} pilihan dilewati: laga sudah mulai atau ditutup.', '{n} pilihan belum tersedia untukmu.', 'Kupon dimuat: {n} pilihan.', 'Berlaku 7 hari · odds saat ini yang berlaku', 'Mis.: K7M2QX',
      'Over {x}', 'Under {x}', 'Ya', 'Tidak', 'Ganjil', 'Genap', 'Seri', 'Babak 1', 'Babak 2', 'Sama',
      'Hasil laga', 'Peluang ganda', 'Seri uang kembali', 'Total gol', 'Kedua tim mencetak gol', 'Gol {t}', 'Total gol ganjil / genap', '{t} tanpa kebobolan', '{t} menang tanpa kebobolan', 'Handicap (3 hasil)', 'Handicap Asia', 'Hasil babak 1', 'Babak 1: total gol', 'Babak 1: kedua tim cetak gol', 'Hasil babak 2', 'Babak 1 / akhir laga', 'Skor tepat', 'Hasil + kedua tim cetak gol', 'Hasil + total gol', 'Jumlah gol tepat', 'Babak dengan gol terbanyak', 'Sebentar…', 'Taruhan ditutup untuk laga ini.', 'Babak 1: peluang ganda', 'Babak 2: peluang ganda', 'Babak 2: kedua tim cetak gol', 'Babak 1: skor tepat', 'Babak 1: gol ganjil / genap', 'Babak 2: gol ganjil / genap', 'Babak 2: total gol', 'Babak 1: gol {t}', 'Babak 1: handicap Asia'],
    ru: ['Футбол', 'События', 'Топ', 'Сегодня', 'Завтра', 'Послезавтра', 'Избранное', 'Команда или лига', 'Нет матчей для этого выбора.', 'Нажмите ☆ у лиги или матча, чтобы найти его здесь.',
      'Правила: 90 мин + добавленное время (без овертайма и пенальти) · приём ставок до начала матча · матч перенесён и не сыгран за 48 ч: возврат.', 'Главные', 'Голы', 'Таймы', 'Точный счёт', 'Фора', 'Комбо', 'Защита',
      'Поделиться / Код', 'Код купона', 'Копировать', 'Скопировано!', 'Загрузить код', 'Загрузить', 'Неизвестный или истёкший код.', 'Пропущено выборов: {n} (матч начался или закрыт).', 'Пока недоступно для вас: {n}.', 'Купон загружен: {n}.', 'Действует 7 дней · при ставке берётся текущий коэффициент', 'Напр.: K7M2QX',
      'Больше {x}', 'Меньше {x}', 'Да', 'Нет', 'Нечёт', 'Чёт', 'Ничья', '1-й тайм', '2-й тайм', 'Поровну',
      'Исход матча', 'Двойной шанс', 'Ничья — возврат', 'Тотал голов', 'Обе забьют', 'Голы: {t}', 'Тотал чёт / нечёт', '{t} — сухой матч', '{t} победит всухую', 'Фора (3 исхода)', 'Азиатская фора', 'Исход 1-го тайма', '1-й тайм: тотал голов', '1-й тайм: обе забьют', 'Исход 2-го тайма', 'Тайм / матч', 'Точный счёт', 'Исход + обе забьют', 'Исход + тотал', 'Точное число голов', 'Самый результативный тайм', 'Минутку…', 'Ставки на этот матч закрыты.', '1-й тайм: двойной шанс', '2-й тайм: двойной шанс', '2-й тайм: обе забьют', '1-й тайм: точный счёт', '1-й тайм: тотал чёт / нечёт', '2-й тайм: тотал чёт / нечёт', '2-й тайм: тотал голов', '1-й тайм: голы: {t}', '1-й тайм: азиатская фора'],
    de: ['Fußball', 'Aktuelles', 'Top', 'Heute', 'Morgen', 'Übermorgen', 'Favoriten', 'Team oder Liga', 'Kein Spiel für diese Auswahl.', 'Tippe ☆ bei einer Liga oder einem Spiel, um es hier zu finden.',
      'Regeln: 90 Min. + Nachspielzeit (ohne Verlängerung und Elfmeterschießen) · Wetten schließen beim Anpfiff · verlegtes Spiel, nicht binnen 48 Std. gespielt: Erstattung.', 'Haupt', 'Tore', 'Halbzeiten', 'Genaues Ergebnis', 'Handicap', 'Kombis', 'Defensive',
      'Teilen / Code', 'Wettschein-Code', 'Kopieren', 'Kopiert!', 'Code laden', 'Laden', 'Code unbekannt oder abgelaufen.', '{n} Tipp(s) übersprungen: Spiel begonnen oder geschlossen.', '{n} Tipp(s) für dich noch nicht verfügbar.', 'Wettschein geladen: {n} Tipp(s).', '7 Tage gültig · es gilt die aktuelle Quote', 'Z. B. K7M2QX',
      'Über {x}', 'Unter {x}', 'Ja', 'Nein', 'Ungerade', 'Gerade', 'Remis', '1. Halbzeit', '2. Halbzeit', 'Gleich',
      'Spielergebnis', 'Doppelte Chance', 'Remis = Erstattung', 'Tore gesamt', 'Beide Teams treffen', 'Tore {t}', 'Tore gerade / ungerade', '{t} ohne Gegentor', '{t} gewinnt zu null', 'Handicap (3-Weg)', 'Asiatisches Handicap', 'Halbzeitergebnis', '1. Halbzeit: Tore gesamt', '1. Halbzeit: beide treffen', 'Ergebnis 2. Halbzeit', 'Halbzeit / Endstand', 'Genaues Ergebnis', 'Ergebnis + beide treffen', 'Ergebnis + Tore gesamt', 'Genaue Toranzahl', 'Torreichste Halbzeit', 'Einen Moment…', 'Wetten für dieses Spiel geschlossen.', '1. Halbzeit: doppelte Chance', '2. Halbzeit: doppelte Chance', '2. Halbzeit: beide treffen', '1. Halbzeit: genaues Ergebnis', '1. Halbzeit: Tore gerade / ungerade', '2. Halbzeit: Tore gerade / ungerade', '2. Halbzeit: Tore gesamt', '1. Halbzeit: Tore {t}', '1. Halbzeit: asiatisches Handicap'],
    zh: ['足球', '热点', '热门', '今天', '明天', '后天', '收藏', '球队或联赛', '此选项暂无比赛。', '点击联赛或比赛上的 ☆，即可在这里找到。',
      '规则：90 分钟 + 补时（不含加时和点球）· 开赛即停止投注 · 比赛延期且 48 小时内未进行：退款。', '主要', '进球', '半场', '正确比分', '让球', '组合', '防守',
      '分享 / 代码', '投注单代码', '复制', '已复制！', '载入代码', '载入', '代码不存在或已过期。', '已跳过 {n} 项：比赛已开始或已关闭。', '{n} 项暂未对你开放。', '投注单已载入：{n} 项。', '7 天有效 · 投注时按当前赔率', '例：K7M2QX',
      '大于 {x}', '小于 {x}', '是', '否', '单', '双', '平局', '上半场', '下半场', '相同',
      '全场赛果', '双重机会', '平局退款', '总进球', '双方进球', '{t} 进球数', '总进球单双', '{t} 零失球', '{t} 零封取胜', '让球（三项）', '亚洲让球', '半场赛果', '上半场：总进球', '上半场：双方进球', '下半场赛果', '半场 / 全场', '正确比分', '赛果 + 双方进球', '赛果 + 总进球', '准确进球数', '进球最多的半场', '请稍候…', '本场比赛已停止投注。', '上半场：双重机会', '下半场：双重机会', '下半场：双方进球', '上半场：正确比分', '上半场：进球单双', '下半场：进球单双', '下半场：总进球', '上半场：{t} 进球数', '上半场：亚洲让球'],
    hi: ['फ़ुटबॉल', 'ताज़ा', 'टॉप', 'आज', 'कल', 'परसों', 'पसंदीदा', 'टीम या लीग', 'इस विकल्प के लिए कोई मैच नहीं।', 'यहाँ पाने के लिए लीग या मैच पर ☆ दबाएँ।',
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
  var sbOn = null, sbAuto = true, listView = 'foot', sbDay = 'top', sbQ = '', sbData = {}, sbOpen = {}, sbMid = '', sbM = null, sbGrp = { main: 1, goals: 1 };
  var sbCode = null, sbCodeRow = false, sbPrev = {}, sbFlash = {}, pendCode = '';
  function lv() { return sbOn ? listView : 'list'; }
  function isSbView() { return view === 'foot' || view === 'match'; }
  function sbToast(m, k) { if (ctx && ctx.toast) ctx.toast(m, k || 'info'); else if (D6.App && D6.App.toast) D6.App.toast(m, k || 'info'); }
  function favs() { try { var f = JSON.parse(localStorage.getItem('oro_sb_fav') || '{}') || {}; return { l: Array.isArray(f.l) ? f.l : [], f: Array.isArray(f.f) ? f.f : [] }; } catch (e) { return { l: [], f: [] }; } }
  function favToggle(kind, id) {
    var f = favs(), a = f[kind], i = a.indexOf(id);
    if (i > -1) a.splice(i, 1); else { a.push(id); if (a.length > 300) a.shift(); }
    try { localStorage.setItem('oro_sb_fav', JSON.stringify(f)); } catch (e) { /* ignore */ }
    return i < 0;
  }
  function tzMin() { return -new Date().getTimezoneOffset(); }
  // une journée (0 / 1 / 2) : gardée 60 s ; false = refusé par le serveur (pas visible pour ce joueur) ; null = réseau
  function sbFetch(day, force) {
    var c = sbData[day] || (sbData[day] = {});
    if (c.p) return c.p;
    if (c.r && !force && Date.now() - c.at < 60000) return Promise.resolve(c.r);
    c.p = (async function () {
      var r = null;
      try { r = await D6.Api.post('sbList', { day: day, tz: tzMin() }, 15000); } catch (e) { r = null; }
      c.p = null;
      if (r && r.ok) { sbOn = true; sbNote(c.r, r); c.r = r; c.at = Date.now(); return r; }
      if (r && r.ok === false && !r.rate && r.reason !== 'busy') { sbOn = false; sbData = {}; return false; }
      return null;
    })();
    return c.p;
  }
  function sbNeed() { return sbQ || sbDay === 'top' || sbDay === 'fav' ? [0, 1, 2] : [sbDay]; }
  function sbLoad(force) { return Promise.all(sbNeed().map(function (d) { return sbFetch(d, force); })); }
  // cotes qui bougent (comme bet365) : vert ▲ si elle monte, rouge ▼ si elle baisse, pendant 3 s
  function sbNote(oldR, r) {
    var now = Date.now();
    (r.fx || []).forEach(function (f) {
      ((f.o && f.o.o) || []).forEach(function (o) {
        var key = 'sb:' + f.id + ':1x2|' + o[0], p = sbPrev[key];
        if (p != null && Math.abs(p - o[1]) > 1e-9) sbFlash[key] = { d: o[1] > p ? 'up' : 'dn', t: now };
        sbPrev[key] = o[1];
      });
    });
  }
  function sbFl(key) { var f = sbFlash[key]; if (!f) return ''; if (Date.now() - f.t > 3000) { delete sbFlash[key]; return ''; } return ' fl-' + f.d; }
  function sbFlashEnd() { setTimeout(function () { if (box) box.querySelectorAll('.fl-up,.fl-dn').forEach(function (b) { b.classList.remove('fl-up', 'fl-dn'); }); }, 3100); }
  function sbFx(fid) {
    if (sbM && sbM.fx && sbM.fx.id === fid) return sbM.fx;
    for (var d in sbData) { var r = sbData[d] && sbData[d].r; if (r) for (var i = 0; i < r.fx.length; i++) if (r.fx[i].id === fid) return r.fx[i]; }
    return null;
  }
  function sbLg(id) { for (var d in sbData) { var r = sbData[d] && sbData[d].r; if (r) for (var i = 0; i < r.lg.length; i++) if (r.lg[i].id === id) return r.lg[i]; } return null; }

  // ---------- libellés des marchés (12 langues) à partir de mk / k ----------
  function numL(v) { var n = Number(v); return isFinite(n) ? n.toLocaleString(loc(), { maximumFractionDigits: 2 }) : String(v); }
  function sgn(v) { var n = Number(v); return (n > 0 ? '+' : n < 0 ? '−' : '') + numL(Math.abs(n)); }
  function mkParts(mk) { mk = String(mk || ''); var i = mk.indexOf(':'); return i < 0 ? [mk, ''] : [mk.slice(0, i), mk.slice(i + 1)]; }
  function sbMkName(mk, h, a) {
    var x = SX(), f = mkParts(mk)[0];
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
      case '1x2': case 'ht1x2': case '2h1x2': case 'dnb': return one(k);
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
    if (s && s.mk) { var tm = teams(s.t) || [s.t, '']; var o = sbOutL(s.mk, s.k, tm[0], tm[1]); return mkParts(s.mk)[0] === '1x2' ? o : sbMkName(s.mk, tm[0], tm[1]) + sep() + o; }
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

  // ---------- page Football ----------
  function sbTool() {
    var x = SX(), ch = [['top', x.top], [0, x.today], [1, x.tomorrow], [2, x.after]];
    return '<div class="sb-tool"><div class="sb-chips" role="tablist">' + ch.map(function (c) { return '<button type="button" data-day="' + c[0] + '" class="' + (String(sbDay) === String(c[0]) && !sbQ ? 'on' : '') + '" style="flex-grow:' + (String(c[1]).length + 4) + '"><span class="fit">' + esc(c[1]) + '</span></button>'; }).join('') +
      '<button type="button" data-day="fav" class="sb-favc' + (sbDay === 'fav' && !sbQ ? ' on' : '') + '" aria-label="' + esc(x.fav) + '"><span>★</span></button></div>' +
      '<div class="sb-srch"><label class="sb-q">' + SBIC.search + '<input id="sbQ" type="search" enterkeyhint="search" autocomplete="off" placeholder="' + esc(x.search) + '" value="' + esc(sbQ) + '"></label>' +
      '</div></div>';
  }
  function codeRow() {
    var x = SX();
    return '<div class="sb-crow"><input id="sbCodeIn" maxlength="8" autocapitalize="characters" autocomplete="off" spellcheck="false" placeholder="' + esc(x.codePh) + '" aria-label="' + esc(x.loadCode) + '"><button type="button" id="sbCodeGo"><span class="fit">' + esc(x.load) + '</span></button></div>';
  }
  function bindCodeRow(root) {
    var go = root.querySelector('#sbCodeGo'), inp = root.querySelector('#sbCodeIn');
    if (!go || !inp) return;
    var run = function () { if (inp.value.trim()) loadCode(inp.value); };
    go.addEventListener('click', run);
    inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); run(); } });
    inp.addEventListener('input', function () { var v = inp.value.toUpperCase().replace(/[^A-Z0-9]/g, ''); if (v !== inp.value) inp.value = v; });
  }
  // une rangée de puces : toutes à la même taille de texte (la plus petite après ajustement) — plus net
  function sameSize(list) {
    var min = 99; list.forEach(function (el) { min = Math.min(min, parseFloat(getComputedStyle(el).fontSize) || 99); });
    if (min < 99) list.forEach(function (el) { el.style.fontSize = min + 'px'; });
  }
  function renderFoot() {
    box.innerHTML = tabs() + sbTool() + '<div id="sbBody" class="sb-body"></div>';
    var bar = slipBar(); if (bar) box.insertAdjacentHTML('beforeend', bar);
    bindTabs(); bindSlip(); fitAll(box); sameSize(box.querySelectorAll('.sb-chips .fit'));
    box.querySelectorAll('.sb-chips [data-day]').forEach(function (b) {
      b.addEventListener('click', function () {
        var d = b.getAttribute('data-day'); sbDay = /^\d$/.test(d) ? +d : d; sbQ = '';
        var q = $('sbQ'); if (q) q.value = '';
        box.querySelectorAll('.sb-chips [data-day]').forEach(function (z) { z.classList.toggle('on', z === b); });
        paintFoot();
      });
    });
    var q = $('sbQ'), qt = 0;
    if (q) q.addEventListener('input', function () { clearTimeout(qt); qt = setTimeout(function () { sbQ = q.value.trim(); box.querySelectorAll('.sb-chips [data-day]').forEach(function (z) { z.classList.toggle('on', !sbQ && String(sbDay) === z.getAttribute('data-day')); }); paintFoot(); }, 180); });
    $('sbCodeT').addEventListener('click', function () {
      sbCodeRow = !sbCodeRow; this.classList.toggle('on', sbCodeRow);
      var t = box.querySelector('.sb-tool'), old = t.querySelector('.sb-crow');
      if (old) old.remove(); else { t.insertAdjacentHTML('beforeend', codeRow()); bindCodeRow(t); fitAll(t.querySelector('.sb-crow')); var i = $('sbCodeIn'); if (i) i.focus(); }
    });
    bindCodeRow(box.querySelector('.sb-tool'));
    $('sbBody').addEventListener('click', footClick);
    paintFoot();
    startTick();
  }
  function paintFoot() {
    var body = $('sbBody'); if (!body) return;
    var days = sbNeed(), rs = days.map(function (d) { return sbData[d] && sbData[d].r; });
    if (rs.some(function (r) { return !r; })) {
      if (!body.firstChild) body.innerHTML = skeleton();
      sbLoad().then(function (out) {
        if (!box || !box.isConnected || view !== 'foot' || !$('sbBody')) return;
        if (out.some(function (r) { return r === false; })) { view = 'list'; render(); return; }
        if (out.every(function (r) { return r; })) paintFoot(); else $('sbBody').innerHTML = empty(XX().e_unavailable);
      });
      return;
    }
    body.innerHTML = footHtml(rs);
    fitAll(body); sbFlashEnd();
  }
  function footHtml(rs) {
    var x = SX(), fv = favs(), lgs = {}, all = [], seen = {}, q = normS(sbQ);
    rs.forEach(function (r) { r.lg.forEach(function (l) { lgs[l.id] = l; }); r.fx.forEach(function (f) { if (!seen[f.id]) { seen[f.id] = 1; all.push(f); } }); });
    var n = nowS(), fx = all.filter(function (f) { return f.ts > n; });
    if (q) fx = fx.filter(function (f) { var l = lgs[f.lg] || {}; return normS(f.h.n + ' ' + f.a.n + ' ' + l.n + ' ' + l.c).indexOf(q) > -1; });
    else if (sbDay === 'fav') fx = fx.filter(function (f) { return fv.l.indexOf(f.lg) > -1 || fv.f.indexOf(f.id) > -1; });
    else if (sbDay === 'top') { var tp = fx.filter(function (f) { return (lgs[f.lg] || {}).p < 100 || fv.l.indexOf(f.lg) > -1; }); if (tp.length) fx = tp; }
    if (!fx.length) return '<p class="sb-none"><span>' + esc(sbDay === 'fav' && !q ? x.noFav : x.noMatch) + '</span></p>';
    fx.sort(function (a, b) { return a.ts - b.ts || (a.id < b.id ? -1 : 1); });
    // jours (en-tête propre) → championnats (favoris, puis les grands, puis pays / nom) → matchs par heure
    var byDay = [], dk = {};
    fx.forEach(function (f) { var d = new Date(f.ts * 1000).toDateString(); if (!dk[d]) { dk[d] = { t: f.ts, f: [] }; byDay.push(dk[d]); } dk[d].f.push(f); });
    var many = fx.length > 40, out = '';
    byDay.forEach(function (D) {
      var g = {}, order = [];
      D.f.forEach(function (f) { if (!g[f.lg]) { g[f.lg] = []; order.push(f.lg); } g[f.lg].push(f); });
      order.sort(function (a, b) {
        var A = lgs[a] || { p: 100, c: '', n: '' }, B = lgs[b] || { p: 100, c: '', n: '' }, fa = fv.l.indexOf(a) > -1 ? 0 : 1, fb = fv.l.indexOf(b) > -1 ? 0 : 1;
        return fa - fb || A.p - B.p || String(A.c).localeCompare(String(B.c)) || String(A.n).localeCompare(String(B.n));
      });
      out += '<h4 class="sp2-day sb-dayh"><span class="fit">' + esc(dayHead(D.t)) + '</span><i>' + D.f.length + '</i></h4>';
      order.forEach(function (id) {
        var l = lgs[id] || { id: id, n: '', c: '', f: '', p: 100 }, isF = fv.l.indexOf(id) > -1, key = D.t ? new Date(D.t * 1000).toDateString() + '|' + id : id;
        var open = sbOpen[key] != null ? sbOpen[key] : (!!q || isF || l.p < 100 || sbDay === 'fav' || !many || order.length <= 3);
        out += '<section class="sb-lg' + (open ? ' on' : '') + '" data-lgk="' + esc(key) + '"><div class="sb-lgh" role="button" tabindex="0" data-lgt="' + esc(key) + '" aria-expanded="' + open + '">' +
          (l.f ? '<img class="sb-flag" src="' + esc(l.f) + '" alt="" loading="lazy" onerror="this.style.visibility=\'hidden\'">' : logoImg(l.lo, 'sb-flag')) +
          '<span class="sb-lgn"><b class="fit">' + esc(l.n) + '</b><small class="fit">' + esc(l.c) + '</small></span><i class="sb-cnt">' + g[id].length + '</i>' +
          '<button type="button" class="sb-star' + (isF ? ' on' : '') + '" data-fl="' + id + '" aria-label="' + esc(x.fav) + '" aria-pressed="' + isF + '">' + (isF ? '★' : '☆') + '</button><i class="sb-chev">' + SBIC.chev + '</i></div>' +
          (open ? '<div class="sb-cols" aria-hidden="true"><span></span><span></span><span>1</span><span>X</span><span>2</span><span></span></div>' + g[id].map(rowHtml).join('') : '') + '</section>';
      });
    });
    return out;
  }
  function rowHtml(f) {
    var o = (f.o && f.o.o) || [], by = {}; o.forEach(function (z) { by[z[0]] = z[1]; });
    var btn = function (k) {
      var ev = 'sb:' + f.id + ':1x2', v = by[k];
      if (v == null) return '<span class="sb-ob off">—</span>';
      var on = inSlip(ev, k), fl = sbFl(ev + '|' + k);
      return '<button type="button" class="sb-ob' + (on ? ' on' : '') + fl + '" data-ev="' + ev + '" data-k="' + k + '" data-odd="' + v + '" aria-pressed="' + on + '"><b>' + Number(v).toFixed(2) + '</b></button>';
    };
    var more = Math.max(0, (f.n || 0) - 1);
    return '<div class="sb-row" data-fx="' + esc(f.id) + '"><div class="sb-t" data-open="' + esc(f.id) + '"><b>' + esc(hm24(f.ts)) + '</b></div>' +
      '<div class="sb-tms" data-open="' + esc(f.id) + '" role="button" tabindex="0"><p>' + logoImg(f.h.lo, 'sb-lo') + '<span dir="auto">' + esc(f.h.n) + '</span></p><p>' + logoImg(f.a.lo, 'sb-lo') + '<span dir="auto">' + esc(f.a.n) + '</span></p></div>' +
      btn('H') + btn('D') + btn('A') + '<button type="button" class="sb-more" dir="ltr" data-open="' + esc(f.id) + '" aria-label="+' + more + '">' + '›' + '</button></div>';
  }
  function footClick(ev) {
    var t = ev.target;
    var st = t.closest('[data-fl]');
    if (st) { ev.stopPropagation(); var id = +st.getAttribute('data-fl'), on = favToggle('l', id); st.classList.toggle('on', on); st.textContent = on ? '★' : '☆'; st.setAttribute('aria-pressed', String(on)); if (sbDay === 'fav' || sbDay === 'top') paintFoot(); return; }
    var ob = t.closest('.sb-ob[data-ev]'); if (ob) { sbPick(ob); return; }
    var op = t.closest('[data-open]'); if (op) { openMatch(op.getAttribute('data-open')); return; }
    var lh = t.closest('[data-lgt]');
    if (lh) { var k = lh.getAttribute('data-lgt'), sec = lh.parentNode, on2 = !sec.classList.contains('on'); sbOpen[k] = on2; paintFoot(); }
  }
  // toucher une cote SB : ajoutée / retirée du ticket sans redessiner la page (un seul choix par match)
  function sbPick(b) {
    var x = X(), xx = XX(), ev = b.getAttribute('data-ev'), k = b.getAttribute('data-k'), odd = +b.getAttribute('data-odd');
    var m = /^sb:(foot:\d+):(.+)$/.exec(ev || ''); if (!m) return;
    var fid = m[1], mk = m[2], f = sbFx(fid);
    if (!f || nowS() >= f.ts) { sbToast(SX().closedM); return; }
    var had = inSlip(ev, k), n0 = slip.length;
    if (!had) {
      if (slip.some(function (s) { return s.q; })) { sbToast(xx.e_single); return; }
      if (slip.length >= 50 && !slip.some(function (s) { return s.fx === fid; })) { sbToast(x.max10); return; }
    }
    slip = slip.filter(function (s) { return s.fx !== fid; });
    if (!had) slip.push({ ev: ev, k: k, odd: odd, sb: 1, mk: mk, fx: fid, ko: f.ts, t: f.h.n + ' - ' + f.a.n, h: f.h, a: f.a, grp: ['fx:' + fid], q: false, l: sbOutL(mk, k, f.h.n, f.a.n) });
    box.querySelectorAll('[data-ev^="sb:' + fid + ':"]').forEach(function (z) { var on = inSlip(z.getAttribute('data-ev'), z.getAttribute('data-k')); z.classList.toggle('on', on); z.setAttribute('aria-pressed', String(on)); });
    sbCode = null;
    paintBar(slip.length > n0);
  }

  // ---------- page d'un match ----------
  var GRP = [['main', 'gMain'], ['goals', 'gGoals'], ['half', 'gHalf'], ['cs', 'gCs'], ['hcp', 'gHcp'], ['combo', 'gCombo'], ['def', 'gDef']];
  function grpOf(mk) {
    var f = mkParts(mk)[0];
    if (f === '1x2' || f === 'dc' || f === 'dnb' || f === 'btts' || mk === 'ou:2.5') return 'main';
    if (f === 'ou' || f === 'tth' || f === 'tta' || f === 'oe' || f === 'eg') return 'goals';
    if (f === 'cs' || f === 'htcs') return 'cs';
    if (f === 'ah' || f === 'eh' || f === 'htah') return 'hcp';
    if (/^(ht|2h)/.test(f) || f === 'hsh') return 'half'; // 1re / 2e mi-temps (ht1x2, htdc, htou, httth, 2hou, 2hbtts, htft…)
    if (f === 'rbtts' || f === 'rou') return 'combo';
    return 'def';
  }
  function openMatch(fid) {
    sbMid = fid; sbM = null; view = 'match'; render();
    var mb = box.closest('.modal-box'); if (mb) mb.scrollTop = 0;
    (async function () {
      var r = null;
      try { r = await D6.Api.post('sbMatch', { id: fid }, 15000); } catch (e) { r = null; }
      if (sbMid !== fid || view !== 'match' || !box || !box.isConnected) return;
      if (r && r.ok) {
        var now = Date.now();
        (r.mk || []).forEach(function (m) { (m.o || []).forEach(function (o) { var key = 'sb:' + fid + ':' + m.mk + '|' + o[0], p = sbPrev[key]; if (p != null && Math.abs(p - o[1]) > 1e-9) sbFlash[key] = { d: o[1] > p ? 'up' : 'dn', t: now }; sbPrev[key] = o[1]; }); });
        sbM = r;
      } else sbM = { ok: false, reason: r ? r.reason : 'unavailable' };
      render();
    })();
  }
  function matchHead(f, l) {
    var x = SX(), xx = XX(), fv = favs(), isF = fv.f.indexOf(f.id) > -1, s = f.ts - nowS();
    var when = cap1(dshort(f.ts)) + ' · ' + hm24(f.ts);
    return '<div class="sb-mh"><div class="sb-mhl">' + (l && l.f ? '<img class="sb-flag" src="' + esc(l.f) + '" alt="" onerror="this.style.visibility=\'hidden\'">' : '') +
      '<span class="fit">' + esc(l ? (l.c ? l.c + ' · ' : '') + l.n : '') + '</span>' +
      '<button type="button" class="sb-star' + (isF ? ' on' : '') + '" id="sbFavM" aria-label="' + esc(x.fav) + '" aria-pressed="' + isF + '">' + (isF ? '★' : '☆') + '</button></div>' +
      '<div class="sb-mht"><div class="sb-mtm">' + logoImg(f.h.lo, 'sb-mlo') + '<b class="fit" dir="auto">' + esc(f.h.n) + '</b></div>' +
      '<div class="sb-mmid"><b class="fit">' + esc(hm24(f.ts)) + '</b>' + (s > 0 && s < 86400 ? '<em class="sp2-chip cd' + (s < 3600 ? ' soon' : '') + '" data-ts="' + f.ts + '">' + IC.clock + '<span class="fit">' + esc(cd(s)) + '</span></em>' : s <= 0 ? '<em class="sp2-chip shut">' + IC.lock + '<span class="fit">' + esc(xx.closed) + '</span></em>' : '') + '</div>' +
      '<div class="sb-mtm">' + logoImg(f.a.lo, 'sb-mlo') + '<b class="fit" dir="auto">' + esc(f.a.n) + '</b></div></div>' +
      '<p class="sb-mwhen"><span class="fit">' + esc(when) + '</span></p>' +
      // emplacement du « match tracker » en direct (étape 3 : mini terrain, score, minute, stats, « BUT ! ») — vide avant-match
      '<div class="sb-trk" id="sbTrk" data-fx="' + esc(f.id) + '" hidden></div></div>';
  }
  function renderMatch() {
    var x = SX(), xx = XX(), r = sbM, f = (r && r.fx) || sbFx(sbMid);
    var lgo = f ? sbLg(f.lg) : null;
    if (r && r.fx && !lgo) lgo = { n: r.fx.lgn || '', c: r.fx.c || '', f: '' };
    var html = tabs() + '<div class="sb-mp"><button type="button" class="sb-back" id="sbBack">' + IC.back + '<span class="fit">' + esc(x.foot) + '</span></button>';
    if (!f) html += r ? empty(r.reason === 'closed' ? x.closedM : xx.e_unavailable) : skeleton();
    else {
      html += matchHead(f, lgo);
      if (!r) html += '<div class="sb-g sp2-skel"><i></i><i></i><i></i></div>';
      else if (!r.ok || !(r.mk || []).length) html += '<p class="sb-none"><span>' + esc(x.closedM) + '</span></p>';
      else {
        var by = {}; r.mk.forEach(function (m) { (by[grpOf(m.mk)] = by[grpOf(m.mk)] || []).push(m); });
        GRP.forEach(function (g) {
          var ms = by[g[0]]; if (!ms) return;
          var on = !!sbGrp[g[0]];
          html += '<section class="sb-g' + (on ? ' on' : '') + '"><button type="button" class="sb-gh" data-g="' + g[0] + '" aria-expanded="' + on + '"><b class="fit">' + esc(x[g[1]]) + '</b><i class="sb-cnt">' + ms.length + '</i><i class="sb-chev">' + SBIC.chev + '</i></button>' +
            (on ? '<div class="sb-gb">' + mkBlocks(ms, f) + '</div>' : '') + '</section>';
        });
      }
      html += '<p class="sb-rules"><span>' + esc(x.rules) + '</span></p>';
    }
    box.innerHTML = html + '</div>';
    var bar = slipBar(); if (bar) box.insertAdjacentHTML('beforeend', bar);
    bindTabs(); bindSlip(); fitAll(box); startTick(); sbFlashEnd();
    $('sbBack').addEventListener('click', function () { view = 'foot'; render(); });
    var fm = $('sbFavM'); if (fm && f) fm.addEventListener('click', function () { var on = favToggle('f', f.id); fm.classList.toggle('on', on); fm.textContent = on ? '★' : '☆'; fm.setAttribute('aria-pressed', String(on)); });
    var mp = box.querySelector('.sb-mp');
    mp.addEventListener('click', function (ev) {
      var b = ev.target.closest('.sb-ob[data-ev]'); if (b) { sbPick(b); return; }
      var gh = ev.target.closest('[data-g]'); if (gh) { var g = gh.getAttribute('data-g'); sbGrp[g] = !sbGrp[g]; renderMatch(); }
    });
  }
  // codes courts des marchés à 3 issues (comme les grands sites) : 1 · X · 2, 1X · 12 · X2 ; sinon le libellé normal
  function shortL(mk, k, h, a) {
    var C = { H: '1', D: 'X', A: '2', HD: '1X', HA: '12', DA: 'X2' };
    return C[k] || sbOutL(mk, k, h, a);
  }
  // marchés d'un groupe : une famille à lignes (buts 0,5 … 5,5, handicaps) = UN bloc avec une rangée par ligne
  function mkBlocks(ms, f) {
    var blocks = [], byF = {};
    ms.forEach(function (m) { var fam = mkParts(m.mk)[0], key = mkParts(m.mk)[1] !== '' ? fam : m.mk; if (!byF[key]) { byF[key] = { fam: fam, m: [] }; blocks.push(byF[key]); } byF[key].m.push(m); });
    return blocks.map(function (B) {
      return '<div class="sb-mk"><p class="sb-mkt"><span class="fit" dir="auto">' + esc(sbMkName(B.m[0].mk, f.h.n, f.a.n)) + '</span></p>' + B.m.map(function (m) {
        // colonnes selon la longueur des libellés (noms d'équipes longs : 2 ou 1 colonne, jamais de texte coupé)
        var n = (m.o || []).length, ml = 0;
        (m.o || []).forEach(function (o) { ml = Math.max(ml, sbOutL(m.mk, o[0], f.h.n, f.a.n).length); });
        var cols = n % 3 === 0 ? 3 : ml <= 17 ? 2 : 1, sh = n % 3 === 0 && ml > 15; // 2026-10-22 (propriétaire) : 1 · X · 2 toujours sur une ligne
        return '<div class="sb-oo c' + cols + '">' + (m.o || []).map(function (o) {
          var ev = 'sb:' + f.id + ':' + m.mk, on = inSlip(ev, o[0]), fl = sbFl(ev + '|' + o[0]);
          return '<button type="button" class="sb-ob sb-ob2' + (on ? ' on' : '') + fl + '" data-ev="' + esc(ev) + '" data-k="' + esc(o[0]) + '" data-odd="' + o[1] + '" aria-pressed="' + on + '"' + (m.s ? ' disabled' : '') + '>' +
            '<span class="fit" dir="auto">' + esc(sh ? shortL(m.mk, o[0], f.h.n, f.a.n) : sbOutL(m.mk, o[0], f.h.n, f.a.n)) + '</span><b>' + (m.s ? IC.lock : Number(o[1]).toFixed(2)) + '</b></button>';
        }).join('') + '</div>';
      }).join('') + '</div>';
    }).join('');
  }

  // ---------- code de coupon ----------
  function slipSig() { return slip.map(function (s) { return s.ev + '|' + s.k; }).join(','); }
  function codeLink(c) { return 'https://orolado.com/?code=' + c; }
  function codeBox() {
    var x = SX();
    if (sbCode && sbCode.sig === slipSig()) {
      return '<div class="sb-cp1"><span class="fit">' + esc(x.codeT) + '</span><b dir="ltr">' + esc(sbCode.code) + '</b>' +
        '<button type="button" id="sbCopy"><span class="fit">' + esc(x.copy) + '</span></button><button type="button" id="sbCodeX" aria-label="✕">✕</button></div>';
    }
    return '<button type="button" class="sb-shb" id="sbShare">' + SBIC.share + '<span class="fit">' + esc(x.share) + '</span></button>';
  }
  function bindCodeBox() {
    var x = SX(), sh = $('sbShare'), cp = $('sbCopy'), cx = $('sbCodeX');
    if (cx) cx.addEventListener('click', function () { sbCode = null; var w = $('sbCode'); if (w) { w.innerHTML = codeBox(); fitAll(w); bindCodeBox(); } });
    if (sh) sh.addEventListener('click', async function () {
      if (sh.disabled) return; sh.disabled = true;
      var r = null;
      try { r = await D6.Api.post('sbCodeSave', { sel: slip.map(function (s) { return { ev: s.ev, k: s.k }; }) }, 15000); } catch (e) { r = null; }
      sh.disabled = false;
      if (!r || !r.ok) { var xx = XX(); sbToast(r && r.reason ? (xx['e_' + r.reason] || xx.e_unavailable) : xx.e_unavailable, 'err'); return; }
      sbCode = { code: r.code, sig: slipSig() };
      var w = $('sbCode'); if (w) { w.innerHTML = codeBox(); fitAll(w); bindCodeBox(); }
    });
    if (cp) cp.addEventListener('click', function () {
      var link = codeLink(sbCode ? sbCode.code : ''), done = function () { sbToast(x.copied, 'ok'); };
      try { if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(link).then(done, function () { fallback(); }); return; } } catch (e) { /* ignore */ }
      fallback();
      function fallback() { try { var ta = document.createElement('textarea'); ta.value = link; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove(); done(); } catch (e) { /* ignore */ } }
    });
  }
  function fromServer(s) {
    if (s.mk) return { ev: s.ev, k: s.k, odd: +s.odd, sb: 1, mk: s.mk, fx: s.fx, ko: s.ko, t: s.t, h: s.h, a: s.a, grp: ['fx:' + s.fx], q: false, l: sbOutL(s.mk, s.k, s.h.n, s.a.n) };
    return { ev: s.ev, k: s.k, odd: +s.odd, t: s.t, l: trO(s.l), q: !!s.q, grp: s.grp || [], ko: s.ko };
  }
  async function loadCode(code) {
    var x = SX(), xx = XX();
    code = String(code || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (!/^[A-Z2-9]{6}$/.test(code)) { sbToast(x.codeBad, 'err'); return false; }
    var r = null;
    try { r = await D6.Api.post('sbCodeLoad', { code: code }, 15000); } catch (e) { r = null; }
    if (!r || !r.ok) { sbToast(r && r.reason === 'nocode' ? x.codeBad : xx.e_unavailable, 'err'); return false; }
    slip = (r.sel || []).map(fromServer); lastBet = null; lastBets = null; sbCodeRow = false;
    sbCode = r.skip || r.hidden ? null : { code: code, sig: slipSig() };
    var msg = [fmt(x.codeLoaded, { n: slip.length })];
    if (r.skip) msg.push(fmt(x.codeSkip, { n: r.skip }));
    if (r.hidden) msg.push(fmt(x.codeHidden, { n: r.hidden }));
    sbToast(msg.join(' '), slip.length ? 'ok' : 'info');
    if (box && box.isConnected && box.classList.contains('sp2')) { view = 'slip'; render(); }
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
      if (!c) { if (!s.closed) { s.closed = true; chg = true; } return; }
      if (Math.abs(c.odd - s.odd) > 1e-9) { s.odd = +c.odd; s.chg = true; chg = true; }
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

  D6.Sports = { paint: paint, receipt: showReceipt, back: back, code: loadCode };
})(window.D6 = window.D6 || {});
