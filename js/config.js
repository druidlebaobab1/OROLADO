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
    DURATIONS: [3, 10, 30, 60, 300, 600],
    DEFAULT_DURATION: 3,
    DEMO_WIN_RATE: 0.60,
    DEMO_FORCE_WINS: 0,
    REAL_WIN_RATE: 0.45,
    ADMIN_WIN_RATE: 0.85,
    REAL_PAYOUT: 1.88,
    ODDS_MULT: [1.88, 6, 11, 51],
    DEFAULT_ODDS: 1.88,
    // Profil C — utilisateurs ordinaires RÉEL (caisse) — INTANGIBLE.
    ODDS_WIN_RATE: { '1.88': 0.38, '6': 0.11, '11': 0.05, '51': 0.01 },
    // Profil A — admin (démo|réel) : inchangé.
    ODDS_WIN_RATE_FAVORABLE: { '1.88': 0.80, '6': 0.45, '11': 0.30, '51': 0.15 },
    ODDS_WIN_RATE_ADMIN_DEMO: { '1.88': 0.80, '6': 0.45, '11': 0.30, '51': 0.15 },
    // Profil B — joueurs ordinaires DÉMO uniquement (cible ~60 % à ×1.88 ; payouts élevés plus durs).
    ODDS_WIN_RATE_DEMO: { '1.88': 0.60, '6': 0.28, '11': 0.18, '51': 0.08 },
    DEMO_MAX_WIN_STREAK: 2,
    MIN_ORDER_MS: 300,
    MIN_DEPOSIT: 3,
    USDT_TRC20_ADDRESS: 'TD32ZDYDvhej6MGk7ZsYC5jLKDdCoJquP1',
    MIN_WITHDRAW: 3,
    WAGER_MULTIPLIER: 2,
    // Max 2 trades ouverts simultanés par compte (demo|real).
    MAX_OPEN: 2,
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
        name: 'VOLATILITY 100 INDEX',
        short: 'V100',
        tag: 'Haute volatilité',
        chart: 'candle',
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
        name: 'STABLE CORE INDEX',
        short: 'SCI',
        tag: 'Basse volatilité',
        chart: 'line',
        basePrice: 10000.00,
        tickNoise: 0.11,
        tickMs: 48,
        ticksPerCandle: 12,
        payoutMin: 1.80,
        payoutMax: 1.88,
        accent: '#F5C518',
        accentDim: '245,197,24',
        feed: 'stable'
      },
      v75: {
        id: 'v75',
        name: 'VOLATILITY 75 INDEX',
        short: 'V75',
        tag: 'Volatilité moyenne',
        chart: 'candle',
        plotTheme: 'darkPro',
        candleThin: true,
        trendLine: true,
        basePrice: 8700.18,
        tickNoise: 0.48,
        tickMs: 36,
        ticksPerCandle: 10,
        payoutMin: 1.82,
        payoutMax: 1.92,
        accent: '#00E676',
        accentDim: '0,230,118',
        feed: 'v75'
      },
      crash300: {
        id: 'crash300',
        name: 'CRASH 300 INDEX',
        short: 'C300',
        tag: 'Chutes rapides',
        chart: 'candle',
        basePrice: 4210.55,
        tickNoise: 0.55,
        tickMs: 28,
        ticksPerCandle: 8,
        payoutMin: 1.88,
        payoutMax: 1.98,
        accent: '#FF1744',
        accentDim: '255,23,68',
        feed: 'crash300'
      },
      boom300: {
        id: 'boom300',
        name: 'BOOM 300 INDEX',
        short: 'B300',
        tag: 'Hausses rapides',
        chart: 'candle',
        basePrice: 5890.33,
        tickNoise: 0.55,
        tickMs: 28,
        ticksPerCandle: 8,
        payoutMin: 1.88,
        payoutMax: 1.98,
        accent: '#00E676',
        accentDim: '0,230,118',
        feed: 'boom300'
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
      { code: '+33', flag: '🇫🇷', name: 'France' }
    ]
  };

  D6.roundMoney = function (n) {
    var x = Number(n);
    if (!isFinite(x)) return 0;
    return Math.round(x * 100) / 100;
  };

  /** Affichage USD entier : $1,234 (jamais de centimes). */
  D6.fmtMoney = function (n) {
    var v = Math.round(Number(n) || 0);
    if (!isFinite(v)) v = 0;
    return '$' + v.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
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
