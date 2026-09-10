(function (D6) {
  'use strict';

  var DICT = {
    fr: {
      tagline: 'Plateforme de trading d\u2019indices \u00b7 USD',
      authRealPitch: 'Ouvrez un compte pour acc\u00e9der au solde r\u00e9el, aux d\u00e9p\u00f4ts et aux retraits.',
      authSecure: 'Connexion chiffr\u00e9e \u00b7 vos identifiants ne transitent jamais en clair.',
      morePayouts: 'Autres',
      footerAbout: '\u00c0 propos',
      footerSecurity: 'S\u00e9curit\u00e9',
      footerSupport: 'Support',
      footerTerms: 'Conditions',
      aboutTitle: '\u00c0 propos',
      aboutBody: 'OROLADO est une plateforme de n\u00e9gociation d\u2019indices synth\u00e9tiques. Elle permet de s\u2019exercer en d\u00e9mo, puis d\u2019utiliser un compte r\u00e9el pour d\u00e9poser et retirer des fonds. Le trading comporte un risque de perte.',
      securityTitle: 'S\u00e9curit\u00e9',
      securityBody: 'Les sessions sont v\u00e9rifi\u00e9es c\u00f4t\u00e9 serveur. Les mots de passe ne sont pas stock\u00e9s en clair. L\u2019acc\u00e8s d\u2019administration n\u2019est accord\u00e9 qu\u2019apr\u00e8s authentification et contr\u00f4le du r\u00f4le. Les paiements sont trait\u00e9s par des prestataires tiers.',
      termsTitle: 'Conditions d\u2019utilisation',
      termsBody: 'L\u2019acc\u00e8s \u00e0 OROLADO est r\u00e9serv\u00e9 aux personnes majeures. Les performances pass\u00e9es, y compris en d\u00e9mo, ne pr\u00e9sagent pas des r\u00e9sultats r\u00e9els. Vous \u00eates responsable de vos d\u00e9cisions de trading.',
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
      fsEnter: 'PLEIN \u00c9CRAN',
      fsExit: 'Quitter le plein \u00e9cran',
      fsModeLabel: 'Mode immersif',
      fsExpand: 'Agrandir',
      estYield: 'Rendement estim\u00e9',
      payoutLabel: 'Payout',
      buy: 'ACHETER (CALL \u2197)', sell: 'VENDRE (PUT \u2198)',
      depositTitle: 'Recharger en USD', credit: 'Cr\u00e9diter le solde',
      convertTitle: 'Compte r\u00e9el',
      convertCopy: 'Le compte r\u00e9el permet de d\u00e9poser des fonds et d\u2019effectuer des retraits. Le mode d\u00e9mo reste disponible pour vous entra\u00eener sans argent r\u00e9el.',
      convertBtn: 'Ouvrir le compte r\u00e9el',
      won: 'GAGNANT', expired: 'PERDANT', continue: 'CONTINUER', replay: 'CONTINUER',
      profitHud: 'PROFIT R\u00c9ALIS\u00c9 : +{amt} (Rendement +{pct}%)',
      expiredHud: 'POSITION EXPIR\u00c9E ($0)',
      install: 'Installer l\u2019application',
      installBtn: 'Installer',
      adminBtn: '',
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
      withdrawMin: 'Retrait minimum : $3',
      withdrawMinErr: 'Le retrait minimum est de $3.',
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
      helpCopy: 'L\u2019\u00e9quipe support r\u00e9pond aux questions de compte, de trading et de s\u00e9curit\u00e9, 24h/24.',
      helpSubject: 'Sujet',
      helpMessage: 'Message',
      helpSend: 'Envoyer',
      helpSent: 'Message envoy\u00e9',
      messages: 'Messages',
      metricExposure: '',
      metricNet: '',
      adminSearch: '',
      resetDemoConfirm: 'Remet le solde d\u00e9mo \u00e0 $25,000. Ne modifie pas le solde r\u00e9el.',
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
      depositInstant: 'D\u00e9p\u00f4t Mobile Money. Minimum $3.',
      lossStreakTip: 'Les indicateurs MA, RSI et BB au-dessus du graphique servent \u00e0 lire la tendance avant de placer un ordre.',
      depositMin: 'Minimum $3',
      depositMinErr: 'Le d\u00e9p\u00f4t minimum est de $3.',
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
      adminTitle: '',
      metricDeposits: '', metricWithdrawals: '',
      metricProfit: '', metricUsers: '',
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
      minHint: 'Mise min : $1',
      maxStake: 'Mise maximale',
      antibot: 'Protection anti-bot : ralentissez',
      insufficient: 'Solde insuffisant',
      installIos: 'Sur iPhone : Partager \u2192 Sur l\u2019\u00e9cran d\u2019accueil \u2192 Ajouter',
      legal: '\u00a9 2026 OROLADO.COM \u00b7 18+'
    },
    en: {
      tagline: 'Synthetic index trading \u00b7 USD',
      authRealPitch: 'Open an account to access a real balance, deposits and withdrawals.',
      authSecure: 'Encrypted connection \u00b7 credentials are never sent in clear text.',
      morePayouts: 'More',
      footerAbout: 'About',
      footerSecurity: 'Security',
      footerSupport: 'Support',
      footerTerms: 'Terms',
      aboutTitle: 'About',
      aboutBody: 'OROLADO is a synthetic index trading platform. You can practise in demo, then use a real account to deposit and withdraw funds. Trading involves a risk of loss.',
      securityTitle: 'Security',
      securityBody: 'Sessions are verified on the server. Passwords are not stored in clear text. Administration access is granted only after authentication and a server-side role check. Payments are processed by third-party providers.',
      termsTitle: 'Terms of use',
      termsBody: 'OROLADO is restricted to adults. Past performance, including in demo, does not predict real results. You are responsible for your trading decisions.',
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
      fsEnter: 'FULL SCREEN',
      fsExit: 'Exit fullscreen',
      fsModeLabel: 'Immersive mode',
      fsExpand: 'Expand',
      estYield: 'Estimated payout',
      payoutLabel: 'Payout',
      buy: 'BUY (CALL \u2197)', sell: 'SELL (PUT \u2198)',
      depositTitle: 'Deposit in USD', credit: 'Credit balance',
      convertTitle: 'Real account',
      convertCopy: 'A real account lets you deposit funds and make withdrawals. Demo mode remains available for practice without real money.',
      convertBtn: 'Open real account',
      won: 'WIN', expired: 'LOSS', continue: 'CONTINUE', replay: 'CONTINUE',
      profitHud: 'PROFIT REALIZED : +{amt} (Yield +{pct}%)',
      expiredHud: 'POSITION EXPIRED ($0)',
      install: 'Install the app',
      installBtn: 'Install',
      adminBtn: '',
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
      withdrawMin: 'Minimum withdrawal: $3',
      withdrawMinErr: 'The minimum withdrawal is $3.',
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
      helpCopy: 'Support can help with account, trading and security questions, 24/7.',
      helpSubject: 'Subject',
      helpMessage: 'Message',
      helpSend: 'Send',
      helpSent: 'Message sent',
      messages: 'Messages',
      metricExposure: '',
      metricNet: '',
      adminSearch: '',
      resetDemoConfirm: 'Reset DEMO balance to $1,000,000. Does not touch real.',
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
      depositInstant: 'Mobile Money deposit. Minimum $3.',
      lossStreakTip: 'Need help with predictions? Turn on MA, RSI and BB above the chart before you trade!',
      depositMin: 'Minimum $3',
      depositMinErr: 'The minimum deposit is $3.',
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
      adminTitle: '',
      metricDeposits: '', metricWithdrawals: '',
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
      minHint: 'Min stake: $1',
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
    var pack = DICT[lang] || DICT.fr || {};
    if (Object.prototype.hasOwnProperty.call(pack, key)) return pack[key];
    if (DICT.fr && Object.prototype.hasOwnProperty.call(DICT.fr, key)) return DICT.fr[key];
    return key;
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
