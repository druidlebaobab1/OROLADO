(function (D6) {
  'use strict';

  var DICT = {
    fr: {
      tagline: 'Indices en FCFA. D\u00e9mo gratuite. D\u00e9p\u00f4t Mobile Money.',
      authRealPitch: 'Cr\u00e9ez votre compte ou connectez-vous en 30 secondes pour recharger votre solde et retirer vos gains r\u00e9els.',
      login: 'Connexion', register: 'Inscription', enter: 'Entrer',
      createAccount: 'Cr\u00e9er mon compte',
      idLabel: 'E-mail', idPh: 'vous@email.com',
      dial: 'Indicatif (si t\u00e9l\u00e9phone)', password: 'Mot de passe',
      forgot: 'Mot de passe oubli\u00e9 ?',
      name: 'Nom complet / Pseudo', email: 'E-mail', whatsapp: 'Num\u00e9ro de t\u00e9l\u00e9phone',
      confirmPass: 'Confirmer le mot de passe',
      age: 'J\u2019ai plus de 18 ans et j\u2019accepte les conditions d\u2019utilisation',
      resetTitle: 'R\u00e9initialiser le mot de passe', update: 'Mettre \u00e0 jour',
      demo: 'MODE VIRTUEL / D\u00c9MO', real: 'COMPTE R\u00c9EL', recharge: 'Recharger',
      modeShortDemo: 'D\u00c9MO', modeShortReal: 'R\u00c9EL',
      virtualBal: 'Solde Virtuel', realBalHint: 'Solde R\u00e9el',
      resetDemo: 'R\u00e9initialiser', secured: 'S\u00e9curis\u00e9',
      highVol: 'Haute volatilit\u00e9', lowVol: 'Basse volatilit\u00e9',
      priceNow: 'Prix actuel', pnlLive: 'P&L live',
      indMa: 'MA', indRsi: 'RSI', indBb: 'BB',
      myOrders: 'Mes ordres', community: 'Trades Communaut\u00e9 (Live)',
      seeAll: 'HISTORIQUE DES TRADES DU COMPTE R\u00c9EL',
      seeAllDemo: 'HISTORIQUE DES TRADES DU COMPTE D\u00c9MO',
      seeAllReal: 'HISTORIQUE DES TRADES DU COMPTE R\u00c9EL',
      histSheet: 'Historique des trades (Compte R\u00e9el)',
      histSheetDemo: 'Historique des trades (Compte D\u00e9mo)',
      histSheetReal: 'Historique des trades (Compte R\u00e9el)',
      estYield: 'Rendement estim\u00e9', buy: 'ACHETER', sell: 'VENDRE',
      depositTitle: 'Recharger en FCFA', credit: 'Cr\u00e9diter le solde',
      convertTitle: 'Tu as un vrai talent de trader !',
      convertCopy: 'Passe en mode R\u00e9el pour retirer tes gains en vrai argent.',
      convertBtn: 'Recharger mon compte',
      won: 'GAGNANT', expired: 'PERDANT', continue: 'CONTINUER', replay: 'CONTINUER',
      profitHud: 'PROFIT R\u00c9ALIS\u00c9 : +{amt} (Rendement +{pct}%)',
      expiredHud: 'POSITION EXPIR\u00c9E (0 FCFA)',
      install: 'Installer l\u2019application',
      installBtn: 'Installer',
      adminBtn: 'Dashboard Admin',
      verified: 'Compte v\u00e9rifi\u00e9',
      changePass: 'Changer de mot de passe',
      financeHist: 'Historique financier',
      logout: 'D\u00e9connexion',
      withdraw: 'Retirer', withdrawTitle: 'Retrait Mobile Money',
      withdrawBtn: 'RETIRER MES GAINS',
      wdAll: 'TOUT', wdAmount: 'Montant (FCFA)', wdPhone: 'Num\u00e9ro Mobile Money',
      wdName: 'Nom',
      wdBalCaption: 'Solde retirable',
      wdDelay: 'Paiement instantan\u00e9 (D\u00e9lai moyen : 5 \u00e0 15 minutes)',
      withdrawMin: 'Retrait minimum : 2 000 FCFA',
      withdrawMinErr: 'Le retrait minimum est de 2 000 FCFA.',
      wagerBlocked: 'Tu dois d\u2019abord jouer au moins 2\u00d7 le montant que tu as recharg\u00e9 avant de retirer. Encore {amt} FCFA de mises \u00e0 faire.',
      gatewayOn: 'Passerelle Mobile Money 100% active',
      maxPositions: 'Maximum 2 trades en cours',
      needAccount: 'Connecte-toi ou cr\u00e9e un compte pour continuer',
      tradeLocked: '2 trades ouverts \u2014 attends qu\u2019un trade se termine',
      lastTrades: 'Derniers trades',
      noTradesHint: 'Aucun trade pour l\u2019instant \u2014 lance un CALL ou un PUT.',
      tradeHint: 'Choisis le montant et la dur\u00e9e. Si ta pr\u00e9diction est juste \u00e0 la fin du chrono, tu r\u00e9cup\u00e8res mise + gain.',
      tradeHintAndroid: 'Anticipe la hausse ou la baisse : valide ton trade avant la fin du chrono.',
      riskLine: '',
      helpBtn: 'Aide',
      helpTitle: 'Aide & support',
      helpCopy: 'Support client prioritaire \u2014 Service d\u2019assistance disponible 24h/24 et 7j/7',
      helpSubject: 'Sujet',
      helpMessage: 'Message',
      helpSend: 'Envoyer',
      helpSent: 'Message envoy\u00e9',
      messages: 'Messages',
      metricExposure: 'Soldes r\u00e9els',
      metricNet: 'Net plateforme',
      adminSearch: 'Rechercher ORO-\u2026 / e-mail / nom / tel',
      resetDemoConfirm: 'Remet le solde D\u00c9MO \u00e0 1 000 000 FCFA. Ne touche pas au r\u00e9el.',
      adjustReason: 'Motif obligatoire',
      publicId: 'ID public',
      depositConfirm: 'VALIDER LA RECHARGE',
      depositPhone: 'Num\u00e9ro Mobile Money',
      depositAmtLabel: 'MONTANT \u00c0 RECHARGER',
      payMode: 'Modes de paiement accept\u00e9s',
      depositInstant: 'D\u00e9p\u00f4t Mobile Money. Minimum 1 000 FCFA.',
      lossStreakTip: "Besoin d'aide pour vos pr\u00e9dictions ? Activez les indicateurs MA, RSI et BB au-dessus du graphique pour analyser la tendance avant de miser !",
      depositMin: 'Minimum 1 000 FCFA',
      depositMinErr: 'Le d\u00e9p\u00f4t minimum est de 1 000 FCFA.',
      depositOk: 'D\u00e9p\u00f4t valid\u00e9 avec succ\u00e8s',
      depositSuccessTitle: 'Recharge r\u00e9ussie !',
      depositSuccessCopy: 'Votre solde a \u00e9t\u00e9 cr\u00e9dit\u00e9.',
      depositBusy: 'Paiement ouvert \u2014 le solde se mettra \u00e0 jour ici',
      depositWaitTitle: 'Paiement {op} en cours',
      depositVerifyTitle: 'Validation de votre d\u00e9p\u00f4t en cours\u2026',
      depositCredited: 'Recharge valid\u00e9e ! +{amt} ajout\u00e9s \u00e0 votre compte.',
      depositWaitCopy: 'Termine ton paiement dans l\u2019onglet ouvert, puis reviens ici et clique sur le bouton ci-dessous.',
      depositCheckBtn: 'J\u2019ai valid\u00e9 mon paiement {op}',
      depositChecking: 'V\u00e9rification aupr\u00e8s de {op}\u2026',
      depositPending: 'Paiement en attente de validation. Votre solde sera actualis\u00e9 sous peu ou contactez le support avec votre r\u00e9f\u00e9rence.',
      depositWaitClose: 'Fermer',
      showPass: 'Afficher le mot de passe',
      hidePass: 'Masquer le mot de passe',
      curPass: 'Mot de passe actuel', newPass: 'Nouveau mot de passe',
      save: 'Enregistrer',
      adminTitle: 'Super Admin Dashboard',
      metricDeposits: 'Total d\u00e9p\u00f4ts', metricWithdrawals: 'Total retraits',
      metricProfit: 'B\u00e9n\u00e9fice net', metricUsers: 'Inscrits',
      users: 'Utilisateurs', withdrawals: 'Retraits',
      approve: 'Valider', reject: 'Rejeter',
      suspect: 'SUSPECT', pending: 'En attente',
      noOrders: 'Aucun ordre pour le moment',
      noUsers: 'Aucun utilisateur',
      noWithdraw: 'Aucun retrait',
      noDeposit: 'Aucun d\u00e9p\u00f4t en attente',
      depositsPending: 'D\u00e9p\u00f4ts en attente',
      add: '+', remove: '\u2212',
      accountCreated: 'Compte cr\u00e9\u00e9',
      passUpdated: 'Mot de passe mis \u00e0 jour',
      credited: 'cr\u00e9dit\u00e9s',
      sessionInvalid: 'Session invalide',
      minStake: 'Mise minimale',
      minHint: 'Mise min : 100 FCFA',
      maxStake: 'Mise maximale',
      antibot: 'Protection anti-bot : ralentissez',
      insufficient: 'Solde insuffisant',
      installIos: 'Sur iPhone : Partager \u2192 Sur l\u2019\u00e9cran d\u2019accueil \u2192 Ajouter',
      legal: '\u00a9 2026 OROLADO.COM \u00b7 18+'
    },
    en: {
      tagline: 'Indices in CFA. Free demo. Mobile Money deposit.',
      authRealPitch: 'Create your account or sign in in 30 seconds to top up and withdraw real winnings.',
      login: 'Sign in', register: 'Sign up', enter: 'Enter',
      createAccount: 'Create my account',
      idLabel: 'Email', idPh: 'you@email.com',
      dial: 'Country code (if phone)', password: 'Password',
      forgot: 'Forgot password?',
      name: 'Full name / Nickname', email: 'Email', whatsapp: 'Phone number',
      confirmPass: 'Confirm password',
      age: 'I am over 18 and I accept the terms of use',
      resetTitle: 'Reset password', update: 'Update',
      demo: 'VIRTUAL / DEMO MODE', real: 'REAL ACCOUNT', recharge: 'Deposit',
      modeShortDemo: 'DEMO', modeShortReal: 'REAL',
      virtualBal: 'Virtual balance', realBalHint: 'Real balance',
      resetDemo: 'Reset', secured: 'Secured',
      highVol: 'High volatility', lowVol: 'Low volatility',
      priceNow: 'Current price', pnlLive: 'Live P&L',
      indMa: 'MA', indRsi: 'RSI', indBb: 'BB',
      myOrders: 'My orders', community: 'Community trades (Live)',
      seeAll: 'TRADE HISTORY — REAL ACCOUNT',
      seeAllDemo: 'TRADE HISTORY — DEMO ACCOUNT',
      seeAllReal: 'TRADE HISTORY — REAL ACCOUNT',
      histSheet: 'Trade history (Real account)',
      histSheetDemo: 'Trade history (Demo account)',
      histSheetReal: 'Trade history (Real account)',
      estYield: 'Estimated payout', buy: 'BUY', sell: 'SELL',
      depositTitle: 'Deposit in CFA', credit: 'Credit balance',
      convertTitle: 'You have a real trader talent!',
      convertCopy: 'Switch to Real mode to withdraw your gains in real money.',
      convertBtn: 'Deposit to my account',
      won: 'WIN', expired: 'LOSS', continue: 'CONTINUE', replay: 'CONTINUE',
      profitHud: 'PROFIT REALIZED : +{amt} (Yield +{pct}%)',
      expiredHud: 'POSITION EXPIRED (0 CFA)',
      install: 'Install the app',
      installBtn: 'Install',
      adminBtn: 'Admin Dashboard',
      verified: 'Verified account',
      changePass: 'Change password',
      financeHist: 'Financial history',
      logout: 'Log out',
      withdraw: 'Withdraw', withdrawTitle: 'Mobile Money withdrawal',
      withdrawBtn: 'WITHDRAW MY FUNDS',
      wdAll: 'ALL', wdAmount: 'Amount (CFA)', wdPhone: 'Mobile Money number',
      wdName: 'Name',
      wdBalCaption: 'Withdrawable balance',
      wdDelay: 'Instant payout (avg. 5–15 minutes)',
      withdrawMin: 'Minimum withdrawal: 2,000 CFA',
      withdrawMinErr: 'The minimum withdrawal is 2,000 CFA.',
      wagerBlocked: 'You must first trade at least 2\u00d7 the amount you deposited before withdrawing. Still {amt} CFA of stakes left.',
      gatewayOn: 'Mobile Money gateway 100% active',
      maxPositions: 'Maximum 2 open trades',
      needAccount: 'Sign in or create an account to continue',
      tradeLocked: '2 trades open — wait for one to finish',
      lastTrades: 'Recent trades',
      noTradesHint: 'No trades yet — place a CALL or PUT.',
      tradeHint: 'Pick amount and duration. If your prediction is right at the end of the timer, you get stake + profit.',
      tradeHintAndroid: 'Anticipate up or down: confirm your trade before the timer ends.',
      riskLine: '',
      helpBtn: 'Help',
      helpTitle: 'Help & support',
      helpCopy: 'Priority support — available 24/7',
      helpSubject: 'Subject',
      helpMessage: 'Message',
      helpSend: 'Send',
      helpSent: 'Message sent',
      messages: 'Messages',
      metricExposure: 'Real balances',
      metricNet: 'Platform net',
      adminSearch: 'Search ORO-… / email / name / phone',
      resetDemoConfirm: 'Reset DEMO balance to 1,000,000 CFA. Does not touch real.',
      adjustReason: 'Reason required',
      publicId: 'Public ID',
      depositConfirm: 'CONFIRM DEPOSIT',
      depositPhone: 'Mobile Money number',
      depositAmtLabel: 'AMOUNT TO DEPOSIT',
      payMode: 'Accepted payment methods',
      depositInstant: 'Mobile Money deposit. Minimum 1,000 CFA.',
      lossStreakTip: 'Need help with predictions? Turn on MA, RSI and BB above the chart before you trade!',
      depositMin: 'Minimum 1,000 CFA',
      depositMinErr: 'The minimum deposit is 1,000 CFA.',
      depositOk: 'Deposit confirmed',
      depositSuccessTitle: 'Deposit successful!',
      depositSuccessCopy: 'Your balance has been credited.',
      depositBusy: 'Payment opened — balance will update here',
      depositWaitTitle: '{op} payment in progress',
      depositVerifyTitle: 'Validating your deposit…',
      depositCredited: 'Deposit confirmed! +{amt} added to your account.',
      depositWaitCopy: 'Finish payment in the open tab, then come back and tap the button below.',
      depositCheckBtn: 'I confirmed my {op} payment',
      depositChecking: 'Checking with {op}…',
      depositPending: 'Payment awaiting validation. Your balance will update shortly, or contact support with your reference.',
      depositWaitClose: 'Close',
      showPass: 'Show password',
      hidePass: 'Hide password',
      curPass: 'Current password', newPass: 'New password',
      save: 'Save',
      adminTitle: 'Super Admin Dashboard',
      metricDeposits: 'Total deposits', metricWithdrawals: 'Total withdrawals',
      metricProfit: 'Net profit', metricUsers: 'Registered',
      users: 'Users', withdrawals: 'Withdrawals',
      approve: 'Approve', reject: 'Reject',
      suspect: 'SUSPECT', pending: 'Pending',
      noOrders: 'No orders yet',
      noUsers: 'No users',
      noWithdraw: 'No withdrawals',
      noDeposit: 'No pending deposits',
      depositsPending: 'Pending deposits',
      add: '+', remove: '−',
      accountCreated: 'Account created',
      passUpdated: 'Password updated',
      credited: 'credited',
      sessionInvalid: 'Invalid session',
      minStake: 'Minimum stake',
      minHint: 'Min stake: 100 CFA',
      maxStake: 'Maximum stake',
      antibot: 'Anti-bot protection: slow down',
      insufficient: 'Insufficient balance',
      installIos: 'On iPhone: Share → Add to Home Screen',
      legal: '© 2026 OROLADO.COM · 18+'
    }
  };

  /* Fallbacks secondaires : EN (UI complete) */
  DICT.es = Object.assign({}, DICT.en);
  DICT.pt = Object.assign({}, DICT.en);
  DICT.ar = Object.assign({}, DICT.en);

  var LANG_KEY = 'orolado_lang';
  var LANG_USER_KEY = 'orolado_lang_user';

  function detectLang() {
    try {
      if (localStorage.getItem(LANG_USER_KEY) === '1') {
        var saved = localStorage.getItem(LANG_KEY) || localStorage.getItem('6diablo_lang');
        if (saved && DICT[saved]) return saved;
      }
    } catch (e0) { /* ignore */ }
    var nav = String((typeof navigator !== 'undefined' && (navigator.language || navigator.userLanguage)) || 'en').toLowerCase();
    return nav.indexOf('fr') === 0 ? 'fr' : 'en';
  }

  var lang = detectLang();
  if (!DICT[lang]) lang = 'en';
  try {
    if (localStorage.getItem(LANG_USER_KEY) !== '1') {
      localStorage.setItem(LANG_KEY, lang);
    }
  } catch (e1) { /* ignore */ }

  function t(key) {
    return (DICT[lang] && DICT[lang][key]) || (DICT.fr && DICT.fr[key]) || key;
  }

  function apply() {
    document.documentElement.lang = lang === 'ar' ? 'ar' : lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      el.textContent = t(el.getAttribute('data-i18n'));
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(function (el) {
      el.setAttribute('placeholder', t(el.getAttribute('data-i18n-placeholder')));
    });
    document.querySelectorAll('.lang-btn').forEach(function (btn) {
      btn.classList.toggle('on', btn.dataset.lang === lang);
    });
    try {
      document.dispatchEvent(new CustomEvent('orolado-i18n'));
    } catch (e2) { /* ignore */ }
  }

  D6.I18N = {
    t: t,
    apply: apply,
    get lang() { return lang; },
    set: function (code) {
      if (!DICT[code]) return;
      lang = code;
      try {
        localStorage.setItem(LANG_KEY, code);
        localStorage.setItem(LANG_USER_KEY, '1');
      } catch (e3) { /* ignore */ }
      apply();
    }
  };
})(window.D6 = window.D6 || {});
