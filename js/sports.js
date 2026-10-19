/* v2690 — PARIS SPORTIFS (dans le Casino) : matchs créés par l'admin avec ses cotes, COUPON d'1 à 10 matchs
   (les cotes se multiplient), dès 0,10 $, argent réel. Le serveur vérifie tout (api.php spList / spBet / spMine). */
(function (D6) {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var T = {
    fr: { none: 'Pas encore de prédiction. Les prochaines questions arrivent bientôt ici.', coupon: 'Ticket de paris', sel: '{n} sélection(s)', odd: 'Cote', stake: 'Mise', pot: 'Gain possible', bet: 'Parier', clear: 'Vider',
      placed: '✅ Pari enregistré · gain possible {p} $', mine: 'Mes paris', noBets: 'Aucun pari pour l’instant.', open: 'En cours', won: 'Gagné', lost: 'Perdu', void: 'Annulé',
      closed: 'Paris fermés', result: 'Résultat', starts: 'Début', today: 'Aujourd’hui', tomorrow: 'Demain', draw: 'Nul', max10: '10 matchs au maximum dans un coupon.',
      e_min: 'Mise minimum 0,10 $.', e_max: 'Mise trop élevée pour ce match.', e_maxWin: 'Gain trop élevé : baisse la mise.', e_closed: 'Ce match a déjà commencé.', e_insufficient: 'Solde insuffisant.', e_unavailable: 'Indisponible, réessaie.', e_param: 'Coupon invalide.', e_login: 'Connecte-toi pour parier.', e_busy: 'Un instant…', e_suspended: 'Compte suspendu.',
      guestBet: '🔒 Inscris-toi pour parier (c’est gratuit)',
      myCoupon: 'Ticket de paris', clearAll: 'Tout supprimer', confirmClear: 'Sûr ? Touche encore', comboT: 'Combiné :', combo: 'tous tes choix doivent être gagnants. Les cotes se multiplient.', singleT: 'Simple :', single: 'un seul choix.', totalOdd: 'Cote totale', see: 'Voir', minNote: 'Mise minimum 0,10 $', done: 'Pari enregistré !', cont: 'Continuer', emptySlip: 'Ton coupon est vide. Touche une cote pour commencer.',
      betsTab: 'Paris', guestMine: 'Crée ton compte pour parier : tous tes paris s’afficheront ici, avec leur résultat.', guestBtn: 'Créer mon compte', seeBets: 'Voir les paris', stakeL: 'Mise', oddL: 'Cote', potL: 'Gain possible', wonL: 'Gagné', lostL: 'Perdu', voidL: 'Remboursé', loading: 'Un instant…',
      all: 'Tous', drawCode: 'N', sport: { foot: 'Football', basket: 'Basket', boxe: 'Boxe', tennis: 'Tennis', mma: 'MMA', event: 'Prédictions', crypto: 'Crypto', politique: 'Politique', autre: 'Sport' } },
    en: { none: 'No match right now. Big matches are coming here soon.', coupon: 'Bet slip', sel: '{n} selection(s)', odd: 'Odds', stake: 'Stake', pot: 'Potential win', bet: 'Place bet', clear: 'Clear',
      placed: '✅ Bet placed! Potential win: ${p}', mine: 'My bets', noBets: 'No bet yet.', open: 'Open', won: 'Won', lost: 'Lost', void: 'Void',
      closed: 'Betting closed', result: 'Result', starts: 'Starts', today: 'Today', tomorrow: 'Tomorrow', draw: 'Draw', max10: 'Maximum 10 matches in a slip.',
      e_min: 'Minimum stake $0.10.', e_max: 'Stake too high for this match.', e_maxWin: 'Win too high: lower the stake.', e_closed: 'This match has already started.', e_insufficient: 'Insufficient balance.', e_unavailable: 'Unavailable, try again.', e_param: 'Invalid slip.', e_login: 'Log in to bet.', e_busy: 'One moment…', e_suspended: 'Account suspended.',
      guestBet: '🔒 Sign up to bet (it’s free)',
      myCoupon: 'My bet slip', clearAll: 'Remove all', confirmClear: 'Sure? Tap again', comboT: 'Multiple:', combo: 'all your picks must win. The odds multiply.', singleT: 'Single:', single: 'one pick.', totalOdd: 'Total odds', see: 'Open', minNote: 'Minimum stake $0.10', done: 'Bet placed!', cont: 'Continue', emptySlip: 'Your bet slip is empty. Tap an odd to start.',
      betsTab: 'Bets', guestMine: 'Create your account to bet: all your bets will show here, with their result.', guestBtn: 'Create my account', seeBets: 'See the bets', stakeL: 'Stake', oddL: 'Odds', potL: 'Potential win', wonL: 'Won', lostL: 'Lost', voidL: 'Refunded', loading: 'One moment…',
      all: 'All', drawCode: 'X', sport: { foot: 'Football', basket: 'Basketball', boxe: 'Boxing', tennis: 'Tennis', mma: 'MMA', event: 'Predictions', crypto: 'Crypto', politique: 'Politics', autre: 'Sport' } }
  };
  T.zh = Object.assign({}, T.en, { none: '暂无比赛，重大赛事即将上线。', coupon: '投注单', sel: '已选 {n} 场', odd: '赔率', stake: '投注', pot: '可赢', bet: '确认投注', clear: '清空',
    guestBet: '🔒 注册后即可投注（免费）',
    myCoupon: '我的投注单', clearAll: '全部删除', confirmClear: '确定？再点一次', comboT: '串关：', combo: '所有选择都必须赢，赔率相乘。', singleT: '单关：', single: '只有一个选择。', totalOdd: '总赔率', see: '查看', minNote: '最低投注 1 美元', done: '投注成功！', cont: '继续', emptySlip: '投注单是空的，点击赔率开始。',
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
    'derby basque': { en: 'Basque derby', es: 'derbi vasco', pt: 'dérbi basco', ar: 'ديربي الباسك', tr: 'Bask derbisi', vi: 'derby xứ Basque', id: 'derby Basque', ru: 'баскское дерби', de: 'Baskenderby', hi: 'बास्क डर्बी', zh: '巴斯克德比' }
  };
  function lg() { return (document.documentElement.lang || 'fr').slice(0, 2); }
  function trW(t) { var l = lg(); if (l === 'fr' || !t) return t; Object.keys(LGW).forEach(function (k) { if (LGW[k][l] && t.indexOf(k) > -1) t = t.split(k).join(LGW[k][l]); }); return t; }
  function trT(e) { var l = lg(); return (l !== 'fr' && e.i18n && e.i18n[l]) || e.title; }
  function trO(lbl) { var l = lg(); return l !== 'fr' && LGW[lbl] && LGW[lbl][l] ? LGW[lbl][l] : lbl; }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function fmt(s, o) { return String(s).replace(/\{(\w+)\}/g, function (m, k) { return o[k] != null ? o[k] : m; }); }
  function m2(v) { return (Number(v) || 0).toFixed(2); }
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
    if (/^img\/teams\/[a-z0-9-]+\.png$/.test(lg)) return '<img class="' + cls + '" src="' + lg + '" alt="" loading="lazy">';
    if (/^[a-f0-9]{16}$/.test(lg)) return '<img class="' + cls + '" src="sp-logo.php?k=' + lg + '" alt="" loading="lazy">';
    return '';
  }
  function crest(n, lg, sp) {
    if (lg && /^img\/teams\//.test(lg)) return logoHtml(lg, 'sp-crest sp-logo');
    if (lg && /^[a-f0-9]{16}$/.test(lg)) return '<img class="sp-crest sp-logo" src="sp-logo.php?k=' + lg + '" alt="" loading="lazy" onerror="this.style.visibility=\'hidden\'">'; // v2713 : vrai logo
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
    en: { results: 'Results', inPlay: 'In play', oddsChg: 'Odds updated', sending: 'Sending…' },
    fr: { results: 'Résultats', inPlay: 'En jeu', oddsChg: 'Cotes mises à jour', sending: 'Envoi…' },
    es: { results: 'Resultados', inPlay: 'En juego', oddsChg: 'Cuotas actualizadas', sending: 'Enviando…' },
    pt: { results: 'Resultados', inPlay: 'Em jogo', oddsChg: 'Odds atualizadas', sending: 'Enviando…' },
    ar: { results: 'النتائج', inPlay: 'جارٍ الآن', oddsChg: 'تم تحديث الاحتمالات', sending: 'جارٍ الإرسال…' },
    tr: { results: 'Sonuçlar', inPlay: 'Oynanıyor', oddsChg: 'Oranlar güncellendi', sending: 'Gönderiliyor…' },
    vi: { results: 'Kết quả', inPlay: 'Đang diễn ra', oddsChg: 'Tỷ lệ đã cập nhật', sending: 'Đang gửi…' },
    id: { results: 'Hasil', inPlay: 'Berlangsung', oddsChg: 'Odds diperbarui', sending: 'Mengirim…' },
    ru: { results: 'Результаты', inPlay: 'Идёт игра', oddsChg: 'Коэффициенты обновлены', sending: 'Отправка…' },
    de: { results: 'Ergebnisse', inPlay: 'Läuft', oddsChg: 'Quoten aktualisiert', sending: 'Wird gesendet…' },
    hi: { results: 'नतीजे', inPlay: 'जारी है', oddsChg: 'ऑड्स अपडेट हुए', sending: 'भेजा जा रहा है…' },
    zh: { results: '结果', inPlay: '进行中', oddsChg: '赔率已更新', sending: '发送中…' }
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
    if (lastBet && view === 'slip') { lastBet = null; view = 'list'; }
    // v2763 (propriétaire) : Paris s'affiche TOUT DE SUITE (dernière liste gardée en mémoire), puis se met à jour en silence
    if (lastList) { events = lastList; syncSlip(); render(); }
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
  setTimeout(function () { if (D6.Api && D6.Api.post) fetchList().then(function (r) { if (r) { lastList = r; lastJson = JSON.stringify(r); } }); }, 4000);

  // v2765 (propriétaire) : deux onglets en HAUT de la page — « Paris » (les matchs) et « Mes paris » (mes reçus)
  var view = 'list', mineCache = null;
  function openCount() { return (mineCache || []).filter(function (b) { return b.status === 'open'; }).length; }
  function tabs() {
    var x = X(), n = openCount();
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
    } catch (e) { /* ignore */ }
  }
  function bindTabs() {
    layoutVars();
    box.querySelectorAll('.sp2-tabs [data-sv]').forEach(function (b) { b.addEventListener('click', function () { var v = b.getAttribute('data-sv'); if (v === view) return; view = v; render(); var mb = box.closest('.modal-box'); if (mb) mb.scrollTop = 0; }); });
  }
  function skeleton() { var s = ''; for (var i = 0; i < 4; i++) s += '<div class="sp2-ev sp2-skel"><i></i><i></i><i></i></div>'; return '<div class="sp2-list">' + s + '</div>'; }
  function empty(msg, btn, id, sv) {
    return '<div class="sp2-empty"><span class="sp2-empty-ball">' + CRYSTAL + '</span><div class="sp2-empty-t">' + linesHtml(msg, 'b', 30) + '</div>' +
      (btn ? '<button type="button" class="sp2-cta"' + (id ? ' id="' + id + '"' : '') + (sv ? ' data-sv="' + sv + '"' : '') + '><span class="fit">' + esc(btn) + '</span></button>' : '') + '</div>';
  }

  // ---------- liste des matchs ----------
  function timeChip(e) {
    var x = XX();
    if (e.status === 'settled') return '<em class="sp2-chip res">' + IC.ok + '<span class="fit">' + esc(x.result) + '</span></em>';
    if (!e.open) return '<em class="sp2-chip shut">' + IC.lock + '<span class="fit">' + esc(x.closed) + '</span></em>';
    var s = e.start - nowS();
    if (s < 86400) return '<em class="sp2-chip cd' + (s < 3600 ? ' soon' : '') + '" data-ts="' + e.start + '">' + IC.clock + '<span class="fit">' + cd(s) + '</span></em>';
    return '<em class="sp2-chip">' + IC.cal + '<span class="fit">' + esc(when2(e.start)) + '</span></em>';
  }
  function card(e) {
    var x = XX(), q = !!EVK[e.sport], tm = q ? null : teams(e.title), settled = e.status === 'settled', three = e.opts.length === 3;
    var opts = e.opts.map(function (o, i) {
      var on = inSlip(e.id, o.k), win = settled && e.result === o.k, lose = settled && e.result && e.result !== 'void' && e.result !== o.k;
      var lbl = trO(o.label);
      if (three && i === 1 && /^(nul|draw|x|n|match nul)$/i.test(String(o.label).trim())) lbl = x.draw;
      return '<button type="button" class="sp2-o' + (on ? ' on' : '') + (win ? ' win' : '') + (lose ? ' lose' : '') + '" data-ev="' + esc(e.id) + '" data-k="' + esc(o.k) + '" aria-pressed="' + on + '"' + (e.open ? '' : ' disabled') + '>' +
        '<span class="fit" dir="auto">' + esc(lbl) + '</span><b>' + (win ? IC.ok : '') + Number(o.odd).toFixed(2) + '</b></button>';
    }).join('');
    var head;
    if (tm) {
      head = '<div class="sp2-match"><div class="sp2-tm">' + crest(tm[0], (e.logos || [])[0], e.sport) + '<span class="sp2-tn">' + '<span class="fit">' + esc(tm[0]) + '</span>' + '</span></div>' +
        '<div class="sp2-mid"><b class="fit">' + esc(hm(e.start)) + '</b><small class="fit">' + esc(dayLabel(e.start)) + '</small></div>' +
        '<div class="sp2-tm">' + crest(tm[1], (e.logos || [])[1], e.sport) + '<span class="sp2-tn">' + '<span class="fit">' + esc(tm[1]) + '</span>' + '</span></div></div>';
    } else {
      var img = q ? logoHtml((e.logos || [])[0] || '', 'sp2-qimg') : '';
      if (!img) img = '<span class="sp2-qimg sp2-qico">' + sico(qKind(e)) + '</span>';
      head = '<div class="sp2-q">' + img + '<div class="sp2-qt">' + linesHtml(trT(e), 'b', 40, true) + '</div></div>';
    }
    var chip = tm && e.open && e.start - nowS() >= 86400 ? '' : timeChip(e);
    // « Ligue 1 · nul = remboursé » : le nom de la ligue en haut, la petite règle (« nul = remboursé ») en dessous des équipes
    var lgAll = e.league ? trW(e.league) : '', cut = lgAll.indexOf(' · '), lgName = cut > 0 ? lgAll.slice(0, cut) : lgAll, note = cut > 0 ? lgAll.slice(cut + 3) : '';
    return '<article class="sp2-ev' + (e.open ? '' : ' shut') + (settled ? ' done' : '') + '" data-card="' + esc(e.id) + '">' +
      '<div class="sp2-meta"><span class="sp2-lg">' + sico(qKind(e)) + '<span class="fit">' + esc(lgName || (x.sport[qKind(e)] || x.sport.autre)) + '</span></span>' + chip + '</div>' +
      head + (note ? '<p class="sp2-note"><span class="fit">' + esc(note) + '</span></p>' : '') + '<div class="sp2-odds n' + e.opts.length + '">' + opts + '</div></article>';
  }
  function renderList() {
    var x = XX();
    if (!events.length) { box.innerHTML = tabs() + empty(x.none); bindTabs(); fitAll(box); return; }
    var key = function (e) { return e.status === 'settled' ? 'res' : new Date(e.start * 1000).toDateString(); };
    var cnt = {}; events.forEach(function (e) { cnt[key(e)] = (cnt[key(e)] || 0) + 1; });
    var html = '', last = '';
    events.forEach(function (e) {
      var k = key(e);
      if (k !== last) { last = k; html += '<h4 class="sp2-day"><span class="fit">' + esc(k === 'res' ? x.results : dayLabel(e.start)) + '</span><i>' + cnt[k] + '</i></h4>'; }
      html += card(e);
    });
    box.innerHTML = tabs() + '<div class="sp2-list">' + html + '</div>' + slipBar();
    box.querySelector('.sp2-list').addEventListener('click', function (ev) { var b = ev.target.closest && ev.target.closest('.sp2-o'); if (b && !b.disabled) pick(b); });
    bindTabs(); bindSlip(); fitAll(box); startTick();
  }
  // toucher une cote : on l'ajoute / l'enlève du coupon SANS redessiner toute la liste (rapide, la page ne saute pas)
  function pick(b) {
    var x = X(), ev = b.getAttribute('data-ev'), k = b.getAttribute('data-k'), e = evById(ev);
    if (!e || !e.open || nowS() >= e.start) return;
    var o = e.opts.filter(function (z) { return z.k === k; })[0]; if (!o) return;
    var had = inSlip(ev, k), n0 = slip.length;
    if (!had && !slip.some(function (s) { return s.ev === ev; }) && slip.length >= 10) { if (ctx.toast) ctx.toast(x.max10); return; }
    slip = slip.filter(function (s) { return s.ev !== ev; }); // un seul choix par match
    if (!had) slip.push({ ev: ev, k: k, odd: o.odd, t: trT(e), l: trO(o.label) });
    var c = b.closest('.sp2-ev');
    if (c) c.querySelectorAll('.sp2-o').forEach(function (z) { var on = inSlip(ev, z.getAttribute('data-k')); z.classList.toggle('on', on); z.setAttribute('aria-pressed', String(on)); });
    paintBar(slip.length > n0);
  }

  /* v2766 (propriétaire) — COUPON comme les grands sites : une barre en bas « Coupon · n choix · cote » qui s'ouvre en
     GRANDE PAGE. v2798 : la barre reste collée en bas de l'écran pendant qu'on fait défiler les matchs. */
  var lastBet = null, clearArm = 0, sending = false;
  function guestNote() { var x = X(); if (D6.App && D6.App.toast) D6.App.toast(x.guestBet, 'info'); }
  function slipBar() {
    if (!slip.length || view !== 'list') return '';
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
    var b = $('spSbar'); if (b) b.addEventListener('click', function () { view = 'slip'; render(); });
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
      if (view === 'slip' && !sending && !lastBet && slip.some(function (s) { var e = evById(s.ev); return !s.closed && e && n >= e.start; })) { syncSlip(); render(); }
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
    return '<div class="sp2-bs r-' + esc(r) + '"><i class="sp2-ri">' + ic + '</i><div class="sp2-bst">' + linesHtml(e ? trT(e) : s.t, 'small', right ? 20 : 34, true) + '<b class="fit" dir="auto">' + esc(trO(s.l)) + '</b></div>' + right + '<em>' + Number(s.odd).toFixed(2) + '</em></div>';
  }
  function receipts(bets) {
    var x = XX();
    if (!bets.length) return empty(x.noBets, x.seeBets, null, 'list');
    var ST = { open: x.open, won: x.wonL, lost: x.lostL, void: x.voidL };
    return bets.map(function (bt, bi) {
      var st = bt.status || 'open';
      var big = st === 'won' ? '+' + money(bt.win) : st === 'lost' ? '−' + money(bt.stake) : money(st === 'void' ? bt.stake : bt.pot);
      var lab = st === 'won' ? x.wonL : st === 'lost' ? x.lostL : st === 'void' ? x.voidL : x.potL;
      var kind = bt.sel.length > 1 ? x.rcCombo + ' · ' + bt.sel.length : x.rcSingle;
      return '<div class="sp2-bet st-' + esc(st) + '" data-rc="' + bi + '" role="button" tabindex="0">' +
        '<div class="sp2-bh"><em class="sp2-pill"><span class="fit">' + esc(ST[st] || st) + '</span></em><span class="fit sp2-kind">' + esc(kind) + '</span><small class="fit">' + esc(bt.at ? when2(bt.at) : '') + '</small></div>' +
        bt.sel.map(selRow).join('') +
        '<div class="sp2-bf"><span><small class="fit">' + esc(x.stakeL) + '</small><b class="fit">' + money(bt.stake) + '</b></span><span><small class="fit">' + esc(x.oddL) + '</small><b class="fit">' + Number(bt.odd).toFixed(2) + '</b></span>' +
        '<span class="big"><small class="fit">' + esc(lab) + '</small><b class="fit">' + big + '</b></span></div>' +
        '<div class="sp2-bid"><span class="fit">#' + esc(String(bt.id || '').slice(-8).toUpperCase()) + '</span><em class="fit">' + esc(x.rcOpen) + ' ›</em></div></div>';
    }).join('');
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
    box.querySelectorAll('.sp2-cta[data-sv]').forEach(function (b) { b.addEventListener('click', function () { view = 'list'; render(); }); });
    box.querySelectorAll('.sp2-bet[data-rc]').forEach(function (c) {
      var go = function () { var bt = (shown && shown.length ? shown : (mineCache || []))[+c.getAttribute('data-rc')]; if (bt) showReceipt(bt); };
      c.addEventListener('click', go);
      c.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
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
        return '<div class="sp-rcpt-s ' + (s.r || 'open') + '">' + (ICO[s.r] || '<i class="op">•</i>') + '<span><small>' + esc(s.t) + '</small><b>' + esc(s.l) + '</b></span><em>' + Number(s.odd).toFixed(2) + '</em></div>';
      }).join('') + '</div>' +
      '<div class="sp-rcpt-rows"><p><span>' + esc(x.stakeL) + '</span><b>' + m2(bt.stake) + ' $</b></p><p><span>' + esc(x.totalOdd) + '</span><b>' + Number(bt.odd).toFixed(2) + '</b></p>' +
      '<p><span>' + esc(x.potL) + '</span><b>' + m2(bt.pot) + ' $</b></p><p><span>' + esc(x.rcDate) + '</span><b>' + dt + '</b></p><p><span>' + esc(x.rcNo) + '</span><b class="mono">' + esc(no) + '</b></p></div>' +
      '<div class="sp-rcpt-bars" aria-hidden="true">' + bars + '</div><p class="sp-rcpt-foot">orolado.com</p>' +
      '<div class="sp-rcpt-btns"><button type="button" class="sp-rcpt-share">' + (D6.ReceiptIcon ? '<span class="sp-rcpt-dli">' + D6.ReceiptIcon + '</span>' : '') + esc(x.rcShare) + '</button><button type="button" class="sp-rcpt-close">' + esc(x.rcClose) + '</button></div></div>';
    document.body.appendChild(el);
    requestAnimationFrame(function () { requestAnimationFrame(function () { el.classList.add('on'); }); });
    var close = function () { el.classList.remove('on'); setTimeout(function () { el.remove(); }, 220); };
    el.addEventListener('click', function (e) { if (e.target === el) close(); });
    el.querySelector('.sp-rcpt-close').addEventListener('click', close);
    el.querySelector('.sp-rcpt-share').addEventListener('click', function () {
      // v2790 (propriétaire) : le reçu devient une IMAGE aux couleurs OROLADO (WhatsApp, Partager, Télécharger)
      if (D6.Receipt && D6.Receipt.bet) { close(); D6.Receipt.bet(bt, x); return; }
      var txt = 'OROLADO · ' + x.rcTitle + ' ' + no + '\n' + bt.sel.map(function (s) { return '• ' + s.t + ' — ' + s.l + ' (' + Number(s.odd).toFixed(2) + ')'; }).join('\n') +
        '\n' + x.stakeL + ' ' + m2(bt.stake) + ' $ · ' + x.totalOdd + ' ' + Number(bt.odd).toFixed(2) + ' · ' + stTxt + '\nhttps://orolado.com';
      try { if (navigator.share) { navigator.share({ text: txt }).catch(function () { /* ignore */ }); return; } } catch (e) { /* ignore */ }
      try { navigator.clipboard.writeText(txt); if (ctx && ctx.toast) ctx.toast('✓'); } catch (e) { /* ignore */ }
    });
  }
  function render() {
    if (!box) return;
    box.classList.add('sp2');
    if (view === 'mine') { renderMine(); return; }
    if (view === 'slip') { renderSlip(); return; }
    renderList();
  }

  // ---------- COUPON (grande page) : choix, cote totale, terminal de mise du casino, gain possible, « Parier » ----------
  var QUICK = [1, 5, 10, 50];
  function stepOf(v, up) { return up ? (v < 1 ? 0.1 : v < 10 ? 1 : v < 100 ? 5 : 50) : (v <= 1 ? 0.1 : v <= 10 ? 1 : v <= 100 ? 5 : 50); }
  // la page du coupon tient dans l'écran (seule la liste des choix défile s'il y en a beaucoup)
  function fitPage() {
    try {
      var mb = box.closest('.modal-box'); if (!mb) return;
      mb.scrollTop = 0;
      var top = box.getBoundingClientRect().top - mb.getBoundingClientRect().top + mb.scrollTop;
      var pb = parseFloat(getComputedStyle(mb).paddingBottom) || 18;
      box.style.setProperty('--sp2-h', Math.max(300, Math.floor(mb.clientHeight - top - pb)) + 'px');
    } catch (e) { /* ignore */ }
  }
  function slipHead() {
    var x = X();
    return '<div class="sp2-sh"><button type="button" class="sp2-back" id="spCpBack" aria-label="‹">' + IC.back + '</button><b class="fit">' + esc(x.myCoupon) + '</b>' +
      (slip.length && !lastBet ? '<i class="sp2-badge">' + slip.length + '</i><button type="button" class="sp2-clear" id="spCpClear">' + IC.trash + '<span class="fit">' + esc(x.clearAll) + '</span></button>' : '') + '</div>';
  }
  function backToList() { lastBet = null; view = 'list'; render(); }
  function renderSlip() {
    var x = XX();
    layoutVars();
    if (lastBet) {
      var lb = lastBet;
      box.innerHTML = '<div class="sp2-page sp2-donep">' + slipHead() + '<div class="sp2-done"><span class="sp2-done-ok">' + IC.ok + '</span><b class="fit sp2-done-t">' + esc(x.done) + '</b>' +
        '<div class="sp2-done-c"><p><span class="fit">' + esc(x.stakeL) + '</span><b class="fit">' + money(lb.stake) + '</b></p><p><span class="fit">' + esc(x.oddL) + '</span><b class="fit">' + Number(lb.odd).toFixed(2) + '</b></p>' +
        '<p class="win"><span class="fit">' + esc(x.potL) + '</span><b class="fit">' + money(lb.pot) + '</b></p></div>' +
        '<small class="sp2-done-id fit">#' + esc(String(lb.id || '').slice(-8).toUpperCase()) + '</small>' +
        '<div class="sp2-done-b"><button type="button" class="sp2-cta" id="spSeeRc"><span class="fit">' + esc(x.rcSee) + '</span></button>' +
        '<div><button type="button" class="sp2-cta2" id="spSeeMine"><span class="fit">' + esc(x.mine) + '</span></button><button type="button" class="sp2-cta2" id="spCont"><span class="fit">' + esc(x.cont) + '</span></button></div></div></div></div>';
      fitPage(); fitAll(box);
      $('spSeeRc').addEventListener('click', function () { showReceipt(lb); });
      $('spCpBack').addEventListener('click', backToList);
      $('spSeeMine').addEventListener('click', function () { lastBet = null; view = 'mine'; render(); });
      $('spCont').addEventListener('click', backToList);
      return;
    }
    if (!slip.length) {
      box.innerHTML = '<div class="sp2-page">' + slipHead() + empty(x.emptySlip, x.seeBets, 'spCont') + '</div>';
      fitPage(); fitAll(box);
      $('spCpBack').addEventListener('click', backToList);
      $('spCont').addEventListener('click', backToList);
      return;
    }
    var odd = totalOdd(), multi = slip.length > 1, anyClosed = slip.some(function (z) { return z.closed; });
    var type = '<div class="sp2-type ' + (multi ? 'combo' : 'single') + '"><em><span class="fit">' + esc(multi ? x.rcCombo : x.rcSingle) + '</span></em>' +
      (multi ? '<div class="sp2-type-t">' + linesHtml(x.combo, 'span', 30) + '</div>' : '<div class="sp2-type-t"><span class="fit">' + esc(x.single) + '</span></div>') + '</div>';
    var list = '<div class="sp2-sels" id="spSels">' + slip.map(function (z, i) {
      var e = evById(z.ev);
      return '<div class="sp2-sel' + (z.closed ? ' closed' : '') + (z.chg ? ' chg' : '') + '"><span class="sp2-sel-ic">' + sico(e ? qKind(e) : 'autre') + '</span>' +
        '<div class="sp2-sel-t"><small class="fit" dir="auto">' + esc(e ? trT(e) : z.t) + '</small><b class="fit" dir="auto">' + esc(z.closed ? x.closed : z.l) + '</b></div>' +
        '<em>' + (z.closed ? IC.lock : Number(z.odd).toFixed(2)) + '</em><button type="button" class="sp2-x" data-i="' + i + '" aria-label="×">' + IC.x + '</button></div>';
    }).join('') + '</div>';
    var tot = '<div class="sp2-tot"><div><small class="fit">' + esc(x.totalOdd) + '</small><b class="fit" id="spOdd">' + odd.toFixed(2) + '</b></div>' +
      '<div class="win"><small class="fit">' + esc(x.potL) + '</small><b class="fit" id="spPot">' + money(stake * odd) + '</b></div></div>';
    var term = '<div class="cs-panel cg-panel sp2-term"><div class="cg-term"><div class="cg-tl">' +
      '<div class="cg-amt"><button type="button" class="cg-step" data-sk="dn" aria-label="−"><svg viewBox="0 0 24 24"><path d="M6 12h12"/></svg></button>' +
      '<label class="cg-in"><input id="spStake" inputmode="decimal" autocomplete="off" value="' + m2(stake) + '" aria-label="' + esc(x.stakeL) + '">' +
      '<button type="button" class="cg-clr" data-sk="clr" aria-label="0.10"><svg viewBox="0 0 24 24"><path d="M8 8l8 8M16 8l-8 8"/></svg></button></label>' +
      '<button type="button" class="cg-step" data-sk="up" aria-label="+"><svg viewBox="0 0 24 24"><path d="M6 12h12M12 6v12"/></svg></button></div>' +
      '<div class="cg-quick">' + QUICK.map(function (v) { return '<button type="button" data-q="' + v + '">' + v + '</button>'; }).join('') + '</div></div>' +
      '<button type="button" class="cs-go cg-go sp2-go' + (ctx.guest ? ' cash' : '') + '" id="spGo"><span class="fit" id="spGoT">' + esc(ctx.guest ? x.guestBtn : x.bet) + '</span>' +
      (ctx.guest ? '' : '<small class="fit" id="spGoAmt">' + money(stake) + '</small>') + '</button></div></div>';
    box.innerHTML = '<div class="sp2-page">' + slipHead() + type + (ctx.guest ? '<p class="sp2-guest"><span class="fit">' + esc(x.guestBet) + '</span></p>' : '') + list + tot + term + '</div>';
    fitPage(); fitAll(box); startTick();
    slip.forEach(function (z) { z.chg = false; });
    $('spCpBack').addEventListener('click', function () { if (sending) return; view = 'list'; render(); });
    $('spCpClear').addEventListener('click', function () {
      if (sending) return;
      var bt = this;
      if (Date.now() - clearArm > 3000) { clearArm = Date.now(); setTx(bt.querySelector('span'), x.confirmClear); bt.classList.add('arm'); return; }
      clearArm = 0; slip = []; view = 'list'; render();
    });
    box.querySelectorAll('.sp2-x').forEach(function (bt) { bt.addEventListener('click', function () { if (sending) return; slip.splice(+bt.getAttribute('data-i'), 1); if (!slip.length) view = 'list'; render(); }); });
    var inp = $('spStake');
    var upd = function () {
      setTx($('spPot'), money(stake * totalOdd()));
      if ($('spGoAmt')) setTx($('spGoAmt'), money(stake));
    };
    var save = function () { try { localStorage.setItem('oro_sp_stake', String(stake)); } catch (e) { /* ignore */ } };
    var set = function (v) { v = Math.round((Number(v) || 0) * 100) / 100; if (!(v >= 0.1)) v = 0.1; if (v > 100000) v = 100000; stake = v; inp.value = m2(v); save(); upd(); };
    inp.addEventListener('input', function () { var v = parseFloat(String(inp.value).replace(',', '.')); if (!(v > 0)) return; stake = Math.round(v * 100) / 100; save(); upd(); });
    inp.addEventListener('change', function () { set(String(inp.value).replace(',', '.')); });
    inp.addEventListener('focus', function () { try { inp.select(); } catch (e) { /* ignore */ } });
    box.querySelectorAll('.sp2-term [data-sk]').forEach(function (b) {
      b.addEventListener('click', function (e) {
        e.preventDefault(); if (sending) return;
        var k = b.getAttribute('data-sk');
        if (k === 'clr') set(0.1); else if (k === 'up') set(stake + stepOf(stake, true)); else set(stake - stepOf(stake, false));
      });
    });
    box.querySelectorAll('.sp2-term .cg-quick [data-q]').forEach(function (b) { b.addEventListener('click', function () { if (!sending) set(+b.getAttribute('data-q')); }); });
    if (sending) busy(true);
    $('spGo').addEventListener('click', place);
  }
  // pendant l'envoi : tout est bloqué (pas de double pari, pas de choix retiré en route)
  function busy(on) {
    var g = $('spGo'), x = XX(); if (!g) return;
    g.disabled = on; g.classList.toggle('wait', on);
    setTx($('spGoT'), on ? x.sending : x.bet);
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
  async function place() {
    var x = XX();
    if (ctx.guest) { guestNote(); if (ctx.signup) ctx.signup(); return; }
    if (sending || !slip.length) return;
    if (slip.some(function (z) { return z.closed; })) { if (ctx.toast) ctx.toast(x.e_closed); return; }
    if (stake < 0.1) { if (ctx.toast) ctx.toast(x.e_min); return; }
    sending = true; busy(true);
    var st = stake, sel = slip.map(function (z) { return { ev: z.ev, k: z.k }; });
    var titles = slip.map(function (z) { var e = evById(z.ev); return e ? e.title : ''; }).sort().join('|');
    var known = {}; (mineCache || []).forEach(function (b) { known[b.id] = 1; });
    var sentAt = nowS(), r = null;
    try { r = await D6.Api.post('spBet', { mode: 'real', stake: st, sel: sel }, 20000); } catch (e) { r = null; }
    if (!r) { var found = await recover(sentAt, st, titles, known); if (found) r = { ok: true, bet: found, bal: null }; }
    sending = false;
    if (!box || !box.isConnected) { if (r && r.ok) { slip = []; mineCache = null; } return; }
    if (!r || !r.ok) {
      busy(false);
      var why = (r && r.reason) || 'unavailable';
      if (why === 'maxWin' && r.maxStake > 0) { stake = Math.max(0.1, r.maxStake); try { localStorage.setItem('oro_sp_stake', String(stake)); } catch (e) { /* ignore */ } render(); }
      if (why === 'closed') { var l = await fetchList(); if (l) { lastList = events = l; lastJson = JSON.stringify(l); syncSlip(); if (view === 'slip') render(); } }
      if (ctx.toast) ctx.toast(x['e_' + why] || x.e_unavailable);
      return;
    }
    if (ctx.afterPlay) ctx.afterPlay({ mode: (r.bet && r.bet.mode) || 'real', bal: r.bal, win: 0, stake: r.bet.stake });
    slip = []; lastBet = r.bet;
    if (mineCache) mineCache = [r.bet].concat(mineCache.filter(function (b) { return b.id !== r.bet.id; }));
    if (view === 'slip') render();
  }
  D6.Sports = { paint: paint, receipt: showReceipt };
})(window.D6 = window.D6 || {});
