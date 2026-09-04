(function (D6) {
  'use strict';

  D6.CONFIG = {
    CURRENCY: 'FCFA',
    CURRENCY_CODE: 'XOF',
    DEMO_START: 50000,
    REAL_START: 0,
    MIN_STAKE: 100,
    QUICK_STAKES: [500, 1000, 5000],
    DURATIONS: [10, 30, 60],
    DEFAULT_DURATION: 10,
    DEMO_WIN_RATE: 0.80,
    DEMO_FORCE_WINS: 3,
    REAL_WIN_RATE: 0.45,
    REAL_PAYOUT: 1.88,
    MIN_ORDER_MS: 300,
    MIN_DEPOSIT: 1000,
    MAKETOU_CHECKOUT: 'https://welcome-6.mymaketou.shop/products/welcome/checkout',
    MAKETOU_PRODUCT_ID: 'dc38d82a-9074-4f73-9cca-50959ea58e94',
    BRAND: 'OROLADO',
    DOMAIN: 'orolado.com',
    ADMIN_EMAIL: 'admin@orolado.com',
    ADMIN_PASSWORD: 'AdminOrolado2026!',
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
        basePrice: 13666.42,
        tickNoise: 0.72,
        tickMs: 32,
        ticksPerCandle: 10,
        payoutMin: 1.85,
        payoutMax: 1.95,
        accent: '#00E676',
        accentDim: '0,230,118'
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
        accent: '#FFD700',
        accentDim: '255,215,0'
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

  D6.fmtFCFA = function (n) {
    var v = Math.round(Number(n) || 0);
    return v.toLocaleString('fr-FR') + ' FCFA';
  };

  D6.fmtPrice = function (n, digits) {
    return (Number(n) || 0).toLocaleString('fr-FR', {
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
