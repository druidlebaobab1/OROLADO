(function (D6) {
  'use strict';

  var DICT = {
    fr: {
      tagline: 'Plateforme de trading & analyse en USD',
      authRealPitch: 'Cr\u00e9ez votre compte ou connectez-vous en 30 secondes pour recharger votre solde et retirer vos gains r\u00e9els.',
      login: 'Connexion', register: 'Inscription', enter: 'Se connecter',
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
      seeAll: 'Positions & historique (R\u00e9el)',
      seeAllDemo: 'Historique (D\u00e9mo)',
      seeAllReal: 'Positions & historique (R\u00e9el)',
      histSheet: 'Historique des trades (Compte R\u00e9el)',
      histSheetDemo: 'Historique des trades (Compte D\u00e9mo)',
      histSheetReal: 'Historique des trades (Compte R\u00e9el)',
      fsEnter: 'Plein \u00e9cran',
      fsExit: 'Quitter le plein \u00e9cran',
      fsModeLabel: 'Mode immersif',
      fsExpand: 'Agrandir',
      estYield: 'Rendement estim\u00e9',
      payoutLabel: 'Payout',
      buy: 'ACHETER (CALL \u2197)', sell: 'VENDRE (PUT \u2198)',
      depositTitle: 'Recharger en USD', credit: 'Cr\u00e9diter le solde',
      convertTitle: 'Tu as un vrai talent de trader !',
      convertCopy: 'Passe en mode R\u00e9el pour retirer tes gains en vrai argent.',
      convertBtn: 'Recharger mon compte',
      won: 'GAGNANT', expired: 'PERDANT', continue: 'CONTINUER', replay: 'CONTINUER',
      profitHud: 'PROFIT R\u00c9ALIS\u00c9 : +{amt} (Rendement +{pct}%)',
      expiredHud: 'POSITION EXPIR\u00c9E ($0.00)',
      install: 'Installer l\u2019application',
      installBtn: 'Installer',
      adminBtn: 'Dashboard Admin',
      verified: 'Compte v\u00e9rifi\u00e9',
      changePass: 'Changer de mot de passe',
      financeHist: 'Historique financier',
      logout: 'D\u00e9connexion',
      withdraw: 'Retirer des fonds', withdrawTitle: 'Retrait',
      withdrawBtn: 'RETIRER MES GAINS',
      wdAll: 'TOUT', wdAmount: 'Montant ($)', wdPhone: 'Num\u00e9ro Mobile Money',
      wdMethod: 'Mode de retrait',
      wdAccount: 'Num\u00e9ro de compte',
      wdWallet: 'Adresse de r\u00e9ception du portefeuille (Wallet)',
      wdPaypal: 'Adresse email PayPal',
      wdDestErr: 'Indiquez le compte ou l\u2019adresse de r\u00e9ception',
      wdPaypalErr: 'Adresse email PayPal invalide',
      wdName: 'Nom',
      wdBalCaption: 'Solde retirable',
      wdDelay: 'Paiement instantan\u00e9 (D\u00e9lai moyen : 5 \u00e0 15 minutes)',
      withdrawMin: 'Retrait minimum : $3.00',
      withdrawMinErr: 'Le retrait minimum est de $3.00.',
      wagerBlocked: 'Vous devez miser encore {amt} avant de pouvoir effectuer un retrait (Volume requis : x2 de votre d\u00e9p\u00f4t).',
      gatewayOn: 'Passerelle Mobile Money 100% active',
      maxPositions: 'Maximum 2 trades en cours',
      needAccount: 'Connecte-toi ou cr\u00e9e un compte pour continuer',
      tradeLocked: '2 positions ouvertes \u2014 attendez la cl\u00f4ture',
      lastTrades: 'Derniers trades',
      noTradesHint: 'Aucune position pour l\u2019instant.',
      tradeHint: '',
      tradeHintAndroid: '',
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
      resetDemoConfirm: 'Remet le solde D\u00c9MO \u00e0 $1,000,000.00. Ne touche pas au r\u00e9el.',
      adjustReason: 'Motif obligatoire',
      publicId: 'ID public',
      copyId: 'Copier',
      copied: 'Copi\u00e9',
      secTransactions: 'Transactions',
      secTrading: 'Trading',
      secSecurity: 'S\u00e9curit\u00e9',
      depositConfirm: 'VALIDER LA RECHARGE',
      depositPhone: 'Num\u00e9ro Mobile Money',
      depositAmtLabel: 'MONTANT \u00c0 RECHARGER ($)',
      payMode: 'Modes de paiement accept\u00e9s',
      depositInstant: 'D\u00e9p\u00f4t Mobile Money. Minimum $3.00.',
      lossStreakTip: "Besoin d'aide pour vos pr\u00e9dictions ? Activez les indicateurs MA, RSI et BB au-dessus du graphique pour analyser la tendance avant de miser !",
      depositMin: 'Minimum $3.00',
      depositMinErr: 'Le d\u00e9p\u00f4t minimum est de $3.00.',
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
      minHint: 'Mise min : $1.00',
      maxStake: 'Mise maximale',
      antibot: 'Protection anti-bot : ralentissez',
      insufficient: 'Solde insuffisant',
      installIos: 'Sur iPhone : Partager \u2192 Sur l\u2019\u00e9cran d\u2019accueil \u2192 Ajouter',
      legal: '\u00a9 2026 OROLADO.COM \u00b7 18+'
    },
    en: {
      tagline: 'Trading & analytics platform in USD',
      authRealPitch: 'Create your account or sign in in 30 seconds to top up and withdraw real winnings.',
      login: 'Sign in', register: 'Sign up', enter: 'Sign in',
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
      seeAll: 'Positions & history (Real)',
      seeAllDemo: 'History (Demo)',
      seeAllReal: 'Positions & history (Real)',
      histSheet: 'Trade history (Real account)',
      histSheetDemo: 'Trade history (Demo account)',
      histSheetReal: 'Trade history (Real account)',
      fsEnter: 'Fullscreen',
      fsExit: 'Exit fullscreen',
      fsModeLabel: 'Immersive mode',
      fsExpand: 'Expand',
      estYield: 'Estimated payout',
      payoutLabel: 'Payout',
      buy: 'BUY (CALL \u2197)', sell: 'SELL (PUT \u2198)',
      depositTitle: 'Deposit in USD', credit: 'Credit balance',
      convertTitle: 'You have a real trader talent!',
      convertCopy: 'Switch to Real mode to withdraw your gains in real money.',
      convertBtn: 'Deposit to my account',
      won: 'WIN', expired: 'LOSS', continue: 'CONTINUE', replay: 'CONTINUE',
      profitHud: 'PROFIT REALIZED : +{amt} (Yield +{pct}%)',
      expiredHud: 'POSITION EXPIRED ($0.00)',
      install: 'Install the app',
      installBtn: 'Install',
      adminBtn: 'Admin Dashboard',
      verified: 'Verified account',
      changePass: 'Change password',
      financeHist: 'Financial history',
      logout: 'Log out',
      withdraw: 'Withdraw funds', withdrawTitle: 'Withdraw',
      withdrawBtn: 'WITHDRAW MY FUNDS',
      wdAll: 'ALL', wdAmount: 'Amount ($)', wdPhone: 'Mobile Money number',
      wdMethod: 'Withdrawal method',
      wdAccount: 'Account number',
      wdWallet: 'Wallet receiving address',
      wdPaypal: 'PayPal email address',
      wdDestErr: 'Enter the account or receiving address',
      wdPaypalErr: 'Invalid PayPal email',
      wdName: 'Name',
      wdBalCaption: 'Withdrawable balance',
      wdDelay: 'Instant payout (avg. 5\u201315 minutes)',
      withdrawMin: 'Minimum withdrawal: $3.00',
      withdrawMinErr: 'The minimum withdrawal is $3.00.',
      wagerBlocked: 'You must still stake {amt} before withdrawing (Required volume: 2\u00d7 your deposit).',
      gatewayOn: 'Mobile Money gateway 100% active',
      maxPositions: 'Maximum 2 open trades',
      needAccount: 'Sign in or create an account to continue',
      tradeLocked: '2 open positions \u2014 wait for settlement',
      lastTrades: 'Recent trades',
      noTradesHint: 'No positions yet.',
      tradeHint: '',
      tradeHintAndroid: '',
      riskLine: '',
      helpBtn: 'Help',
      helpTitle: 'Help & support',
      helpCopy: 'Priority support \u2014 available 24/7',
      helpSubject: 'Subject',
      helpMessage: 'Message',
      helpSend: 'Send',
      helpSent: 'Message sent',
      messages: 'Messages',
      metricExposure: 'Real balances',
      metricNet: 'Platform net',
      adminSearch: 'Search ORO-\u2026 / email / name / phone',
      resetDemoConfirm: 'Reset DEMO balance to $1,000,000.00. Does not touch real.',
      adjustReason: 'Reason required',
      publicId: 'Public ID',
      copyId: 'Copy',
      copied: 'Copied',
      secTransactions: 'Transactions',
      secTrading: 'Trading',
      secSecurity: 'Security',
      depositConfirm: 'CONFIRM DEPOSIT',
      depositPhone: 'Mobile Money number',
      depositAmtLabel: 'AMOUNT TO DEPOSIT ($)',
      payMode: 'Accepted payment methods',
      depositInstant: 'Mobile Money deposit. Minimum $3.00.',
      lossStreakTip: 'Need help with predictions? Turn on MA, RSI and BB above the chart before you trade!',
      depositMin: 'Minimum $3.00',
      depositMinErr: 'The minimum deposit is $3.00.',
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
      minHint: 'Min stake: $1.00',
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
