(function (D6) {
  'use strict';

  D6.CONFIG = {
    CURRENCY: 'USD',
    CURRENCY_CODE: 'USD',
    CURRENCY_SYMBOL: '$',
    /** Taux fixe paiement local : 1 USD = 600 FCFA (ex. 3 $ = 1 800 FCFA). */
    USD_FCFA_RATE: 600,
    DEMO_START: 1000000,
    REAL_START: 0,
    MIN_STAKE: 1,
    QUICK_STAKES: [1, 5, 10, 25, 50],
    DURATIONS: [5, 10, 30, 60, 300, 600],
    DEFAULT_DURATION: 5,
    REAL_PAYOUT: 1.9,
    ODDS_MULT: [1.9, 5, 10, 50],
    DEFAULT_ODDS: 1.9,
    PAYOUT_PCT: { '1.9': 90, '1.88': 88, '5': 500, '10': 1000, '50': 5000 },
    // Jeu équitable : aucun taux de gain programmé. Le résultat vient du prix réel du flux
    // serveur. Chances publiques (identiques démo / réel / admin, sur les 10 actifs) :
    // 2026-10-04 : payout de base 90 % (×1,90) à 50 % ; ×5 / ×10 / ×50 : 90 % rendu sur la durée (10 % pour la maison).
    FAIR_WIN_CHANCE: { '1.9': 0.50, '5': 0.18, '10': 0.09, '50': 0.018 },
    FAIR_RTP: 0.95,
    WITHDRAW_MINS: {
      usdt: 10, trx: 10, sol: 10, bnb: 10, btc: 15, eth: 15,
      wave: 5, orange: 5, mtn: 5, moov: 5, airtel: 5, opay: 5, palmpay: 5, mpesa: 5,
      gcash: 10, nequi: 10, pix: 10, picpay: 10, papara: 10, upi: 10,
      stcpay: 15, mercadopago: 10,
      payeer: 20, perfectmoney: 15,
      paypal: 30, skrill: 30, neteller: 30, card: 30, bank: 50, revolut: 30
    },
    WD_BANK_COUNTRIES: [
      { flag: '\uD83C\uDDFA\uD83C\uDDF8', name: '\u00c9tats-Unis (USA)' },
      { flag: '\uD83C\uDDE8\uD83C\uDDE6', name: 'Canada' },
      { flag: '\uD83C\uDDE7\uD83C\uDDF7', name: 'Br\u00e9sil' },
      { flag: '\uD83C\uDDE8\uD83C\uDDF4', name: 'Colombie' },
      { flag: '\uD83C\uDDE6\uD83C\uDDF7', name: 'Argentine' },
      { flag: '\uD83C\uDDEB\uD83C\uDDF7', name: 'France' },
      { flag: '\uD83C\uDDE9\uD83C\uDDEA', name: 'Allemagne' },
      { flag: '\uD83C\uDDEC\uD83C\uDDE7', name: 'Royaume-Uni' },
      { flag: '\uD83C\uDDEA\uD83C\uDDF8', name: 'Espagne' },
      { flag: '\uD83C\uDDF5\uD83C\uDDF9', name: 'Portugal' },
      { flag: '\uD83C\uDDEE\uD83C\uDDF9', name: 'Italie' },
      { flag: '\uD83C\uDDE6\uD83C\uDDEA', name: '\u00c9mirats Arabes Unis' },
      { flag: '\uD83C\uDDF8\uD83C\uDDE6', name: 'Arabie Saoudite' },
      { flag: '\uD83C\uDDF9\uD83C\uDDF7', name: 'Turquie' },
      { flag: '\uD83C\uDDF2\uD83C\uDDE6', name: 'Maroc' },
      { flag: '\uD83C\uDDEA\uD83C\uDDEC', name: '\u00c9gypte' },
      { flag: '\uD83C\uDDF3\uD83C\uDDEC', name: 'Nigeria' },
      { flag: '\uD83C\uDDEC\uD83C\uDDED', name: 'Ghana' },
      { flag: '\uD83C\uDDF0\uD83C\uDDEA', name: 'Kenya' },
      { flag: '\uD83C\uDDFF\uD83C\uDDE6', name: 'Afrique du Sud' },
      { flag: '\uD83C\uDDFA\uD83C\uDDEC', name: 'Ouganda' },
      { flag: '\uD83C\uDDF9\uD83C\uDDFF', name: 'Tanzanie' },
      { flag: '\uD83C\uDDEA\uD83C\uDDF9', name: '\u00c9thiopie' },
      { flag: '\uD83C\uDDFF\uD83C\uDDF2', name: 'Zambie' },
      { flag: '\uD83C\uDDEE\uD83C\uDDF3', name: 'Inde' },
      { flag: '\uD83C\uDDE8\uD83C\uDDF3', name: 'Chine' },
      { flag: '\uD83C\uDDEF\uD83C\uDDF5', name: 'Japon' },
      { flag: '\uD83C\uDDF0\uD83C\uDDF7', name: 'Cor\u00e9e du Sud' },
      { flag: '\uD83C\uDDF5\uD83C\uDDED', name: 'Philippines' }
    ],
    DEMO_MAX_WIN_STREAK: 0,
    MIN_ORDER_MS: 60,
    MIN_DEPOSIT: 5,
    USDT_TRC20_ADDRESS: 'TD32ZDYDvhej6MGk7ZsYC5jLKDdCoJquP1',
    MIN_WITHDRAW: 5,
    WAGER_MULTIPLIER: 2,
    MAX_OPEN: 9999,
    MAKETOU_CHECKOUT: 'https://welcome-6.mymaketou.shop/products/welcome/checkout',
    MAKETOU_PRODUCT_ID: 'dc38d82a-9074-4f73-9cca-50959ea58e94',
    BRAND: 'OROLADO',
    DOMAIN: 'orolado.com',
    ADMIN_EMAIL: 'admin@orolado.com',
    SUPABASE_URL: 'https://tubyuyxuswwzebicrhkg.supabase.co',
    // Clé anon / publishable (eyJ… ou sb_publishable_…). Pas l’URL du projet.
    SUPABASE_ANON_KEY: 'sb_publishable_zaJSnXA3yY17-I4eBXCtsw_F_-tCW1z',
    ASSETS: {
      v100: {
        id: 'v100',
        name: 'VOLATILITY',
        short: 'VOLATILITY',
        tag: 'Haute volatilité',
        chart: 'candle',
        candleThin: false,
        basePrice: 13000.42,
        tickNoise: 0.72,
        tickMs: 32,
        ticksPerCandle: 10,
        payoutMin: 1.85,
        payoutMax: 1.95,
        accent: '#22C55E',
        accentDim: '34,197,94',
        feed: 'v100'
      },
      stable: {
        id: 'stable',
        name: 'COBRA',
        short: 'COBRA',
        tag: 'Basse volatilité',
        chart: 'line',
        lineColor: '#ff2d75',
        lineWidth: 3,
        lineHalo: null,
        basePrice: 10000.00,
        tickNoise: 0.22,
        tickMs: 48,
        ticksPerCandle: 12,
        payoutMin: 1.80,
        payoutMax: 1.9,
        accent: '#E91E63',
        accentDim: '233,30,99',
        feed: 'stable'
      },
      apex500: {
        id: 'apex500',
        name: 'BAAL',
        short: 'BAAL',
        tag: 'Ultra-rapide',
        chart: 'candle',
        candleThin: false,
        basePrice: 5480.25,
        tickNoise: 0.85,
        tickMs: 240,
        ticksPerCandle: 4,
        payoutMin: 1.84,
        payoutMax: 1.94,
        accent: '#22D3EE',
        accentDim: '34,211,238',
        feed: 'apex500'
      },
      horizon50: {
        id: 'horizon50',
        name: 'ORO 999',
        short: 'ORO 999',
        tag: 'Doux et régulier',
        chart: 'line',
        lineStyle: 'smooth',
        lineColor: '#ff9800',
        lineWidth: 2.5,
        lineHalo: 'rgba(255,152,0,0.55)',
        accent: '#ff9800',
        accentDim: '255,152,0',
        basePrice: 10120.40,
        tickNoise: 0.08,
        tickMs: 56,
        ticksPerCandle: 12,
        payoutMin: 1.80,
        payoutMax: 1.9,
        accent: '#38BDF8',
        accentDim: '56,189,248',
        feed: 'horizon50'
      },
      crash300: {
        id: 'crash300',
        name: 'AZAZEL',
        short: 'AZAZEL',
        tag: 'Chutes rapides',
        chart: 'candle',
        candleThin: true,
        basePrice: 4210.55,
        tickNoise: 0.55,
        tickMs: 28,
        ticksPerCandle: 8,
        payoutMin: 1.9,
        payoutMax: 1.98,
        accent: '#B87333',
        accentDim: '184,115,51',
        feed: 'crash300'
      },
      goldtrend: {
        id: 'goldtrend',
        name: 'OROF',
        short: 'OROF',
        tag: 'Grandes vagues',
        chart: 'line',
        lineColor: '#f5a623',
        lineWidth: 2.4,
        basePrice: 7340.80,
        tickNoise: 0.42,
        tickMs: 24,
        ticksPerCandle: 12,
        payoutMin: 1.82,
        payoutMax: 1.90,
        accent: '#E8C36A',
        accentDim: '232,195,106',
        feed: 'goldtrend'
      },
      boomspike: {
        id: 'boomspike',
        // Ancien « Boom Spike » : même identifiant (historique, stats), nouvelle
        // simulation simple et régulière, tracé blanc (demande du propriétaire).
        name: 'VALAC',
        short: 'VALAC',
        tag: 'Emerald flow',
        chart: 'line',
        lineColor: '#F2F4FF',
        lineWidth: 3,
        areaRgb: '225,232,255',
        basePrice: 3890.20,
        tickNoise: 0.40,
        tickMs: 28,
        ticksPerCandle: 8,
        payoutMin: 1.9,
        payoutMax: 1.98,
        accent: '#E8ECFF',
        accentDim: '232,236,255',
        feed: 'boomspike'
      },
      nexusprime: {
        id: 'nexusprime',
        name: 'ASMODUS',
        short: 'ASMODUS',
        tag: 'Flux haute fréquence',
        chart: 'candle',
        plotTheme: 'darkPro',
        candleThin: false,
        basePrice: 8120.60,
        tickNoise: 0.55,
        tickMs: 32,
        ticksPerCandle: 8,
        payoutMin: 1.82,
        payoutMax: 1.92,
        accent: '#00E5FF',
        accentDim: '0,229,255',
        feed: 'nexusprime'
      },
      v75: {
        id: 'v75',
        name: 'ZUL',
        short: 'ZUL',
        tag: 'Vagues amples',
        chart: 'candle',
        plotTheme: 'darkPro',
        candleThin: false,
        basePrice: 8700.18,
        tickNoise: 0.22,
        tickMs: 420,
        ticksPerCandle: 6,
        payoutMin: 1.82,
        payoutMax: 1.92,
        accent: '#E53935',
        accentDim: '229,57,53',
        feed: 'v75'
      },
      titanpulse: {
        id: 'titanpulse',
        name: 'APOCALYPSE',
        short: 'APOCALYPSE',
        tag: 'Volatilité extrême',
        chart: 'candle',
        plotTheme: 'darkPro',
        candleThin: true,
        basePrice: 9560.40,
        tickNoise: 0.85,
        tickMs: 26,
        ticksPerCandle: 8,
        payoutMin: 1.86,
        payoutMax: 1.96,
        accent: '#FFFFFF',
        accentDim: '255,255,255',
        feed: 'titanpulse'
      }
    },
    COUNTRY_CODES: [
      { code: '+225', flag: '🇨🇮', name: "Côte d'Ivoire" },
      { code: '+221', flag: '🇸🇳', name: 'Sénégal' },
      { code: '+226', flag: '🇧🇫', name: 'Burkina Faso' },
      { code: '+223', flag: '🇲🇱', name: 'Mali' },
      { code: '+227', flag: '🇳🇪', name: 'Niger' },
      { code: '+228', flag: '🇹🇬', name: 'Togo' },
      { code: '+229', flag: '🇧🇯', name: 'Bénin' },
      { code: '+237', flag: '🇨🇲', name: 'Cameroun' },
      { code: '+241', flag: '🇬🇦', name: 'Gabon' },
      { code: '+242', flag: '🇨🇬', name: 'Congo' },
      { code: '+243', flag: '🇨🇩', name: 'RD Congo' },
      { code: '+224', flag: '🇬🇳', name: 'Guinée' },
      { code: '+233', flag: '🇬🇭', name: 'Ghana' },
      { code: '+234', flag: '🇳🇬', name: 'Nigeria' },
      { code: '+254', flag: '🇰🇪', name: 'Kenya' },
      { code: '+255', flag: '🇹🇿', name: 'Tanzanie' },
      { code: '+256', flag: '🇺🇬', name: 'Ouganda' },
      { code: '+250', flag: '🇷🇼', name: 'Rwanda' },
      { code: '+27', flag: '🇿🇦', name: 'Afrique du Sud' },
      { code: '+212', flag: '🇲🇦', name: 'Maroc' },
      { code: '+213', flag: '🇩🇿', name: 'Algérie' },
      { code: '+216', flag: '🇹🇳', name: 'Tunisie' },
      { code: '+20', flag: '🇪🇬', name: 'Égypte' },
      { code: '+33', flag: '🇫🇷', name: 'France' },
      { code: '+32', flag: '🇧🇪', name: 'Belgique' },
      { code: '+41', flag: '🇨🇭', name: 'Suisse' },
      { code: '+44', flag: '🇬🇧', name: 'Royaume-Uni' },
      { code: '+49', flag: '🇩🇪', name: 'Allemagne' },
      { code: '+34', flag: '🇪🇸', name: 'Espagne' },
      { code: '+39', flag: '🇮🇹', name: 'Italie' },
      { code: '+351', flag: '🇵🇹', name: 'Portugal' },
      { code: '+1', flag: '🇺🇸', name: 'USA / Canada' },
      { code: '+55', flag: '🇧🇷', name: 'Brésil' },
      { code: '+91', flag: '🇮🇳', name: 'Inde' },
      { code: '+86', flag: '🇨🇳', name: 'Chine' },
      { code: '+81', flag: '🇯🇵', name: 'Japon' },
      { code: '+82', flag: '🇰🇷', name: 'Corée du Sud' },
      { code: '+90', flag: '🇹🇷', name: 'Turquie' },
      { code: '+971', flag: '🇦🇪', name: 'Émirats' },
      { code: '+966', flag: '🇸🇦', name: 'Arabie saoudite' },
      { code: '+57', flag: '🇨🇴', name: 'Colombie' },
      { code: '+63', flag: '🇵🇭', name: 'Philippines' }
    ]
  };

  D6.roundMoney = function (n) {
    var x = Number(n);
    if (!isFinite(x)) return 0;
    return Math.round(x * 100) / 100;
  };

  /** Affichage USD : « $ 50 » si entier, « $ 1.50 » s’il y a de vrais centimes. */
  D6.fmtMoney = function (n) {
    var v = D6.roundMoney(n);
    if (!isFinite(v)) v = 0;
    var neg = v < 0;
    var abs = Math.abs(v);
    var cents = Math.round((abs - Math.floor(abs)) * 100);
    var grouped = Math.floor(abs).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    var body = cents ? (grouped + '.' + (cents < 10 ? '0' : '') + cents) : grouped;
    var out = (neg ? '-' : '') + '$\u00a0\u00a0' + body;
    // Arabe (de droite à gauche) : on isole le montant pour que « $ » reste devant.
    if (typeof document !== 'undefined' && document.documentElement && document.documentElement.dir === 'rtl') out = '\u2066' + out + '\u2069';
    return out;
  };

  /** Alias historique — toute l’UI passe par USD. */
  D6.fmtFCFA = function (n) {
    return D6.fmtMoney(n);
  };

  D6.usdToFcfa = function (usd) {
    var rate = Number((D6.CONFIG && D6.CONFIG.USD_FCFA_RATE) || 600) || 600;
    return Math.round(D6.roundMoney(usd) * rate);
  };

  D6.fmtPrice = function (n, digits) {
    var v = Number(n) || 0;
    if (Math.abs(v) >= 100000) v = ((v % 9000) + 1000);
    return v.toLocaleString('fr-FR', {
      minimumFractionDigits: digits == null ? 2 : digits,
      maximumFractionDigits: digits == null ? 2 : digits
    });
  };

  D6.uid = function () {
    return 'oro_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  };

  D6.nowIso = function () {
    return new Date().toISOString();
  };

  D6.clock = function () {
    return new Date().toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  try { Object.freeze(D6.CONFIG.ASSETS); } catch (e) { /* ignore */ }
})(window.D6 = window.D6 || {});
