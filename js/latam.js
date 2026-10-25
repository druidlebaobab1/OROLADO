/* OROLADO — dépôt en monnaie locale pour l'Amérique latine (2026-10-25, propriétaire).
 * Chargé SEULEMENT quand un joueur d'Amérique latine touche « Payer par carte / Mobile Money » (rien pour les autres).
 * Le joueur : 1) copie SON adresse USDT TRC20 (la même que Dépôt crypto, OxaPay), 2) l'achète en pesos chez
 * Guardarian (Mexique : SPEI, sans compte ; Chili, Équateur… : carte) ou El Dorado (Colombie, Pérou, Argentine,
 * Bolivie, Paraguay, Rép. dominicaine, Brésil, Venezuela : Nequi, Yape, Mercado Pago, PIX, Pago Móvil…),
 * 3) le crédit arrive tout seul (même suivi que Dépôt crypto). Guide pas à pas + petite « vidéo » animée
 * dessinée ici (aucun fichier à télécharger). Ce fichier ne touche à aucun paiement : affichage seulement. */
(function () {
  'use strict';
  var D6 = window.D6 = window.D6 || {};
  var SITES = {
    G: { name: 'Guardarian', url: 'https://guardarian.com/buy-usdt', host: 'guardarian.com' },
    E: { name: 'El Dorado', url: 'https://app.eldorado.io/', host: 'app.eldorado.io' }
  };
  var C = {
    MX: { n: 'México', s: 'G', pays: ['SPEI', 'Tarjeta', 'Apple Pay'], m: 'SPEI', cur: 'MXN', spei: 1 },
    CO: { n: 'Colombia', s: 'E', pays: ['Nequi', 'Bancolombia', 'Daviplata'], m: 'Nequi', cur: 'COP', id: 'cédula' },
    PE: { n: 'Perú', s: 'E', pays: ['Yape', 'Plin', 'BCP'], m: 'Yape', cur: 'PEN', id: 'DNI' },
    AR: { n: 'Argentina', s: 'E', pays: ['Mercado Pago', 'Ualá', 'CVU'], m: 'Mercado Pago', cur: 'ARS', id: 'DNI' },
    VE: { n: 'Venezuela', s: 'E', pays: ['Pago Móvil', 'Zinli', 'Banco'], m: 'Pago Móvil', cur: 'VES', id: 'cédula' },
    BO: { n: 'Bolivia', s: 'E', pays: ['QR', 'Tigo Money', 'Banco'], m: 'QR', cur: 'BOB', id: 'CI' },
    PY: { n: 'Paraguay', s: 'E', pays: ['Transferencia', 'Tigo Money'], m: 'Transferencia', cur: 'PYG', id: 'CI' },
    DO: { n: 'Rep. Dominicana', s: 'E', pays: ['Transferencia', 'Banreservas'], m: 'Transferencia', cur: 'DOP', id: 'cédula' },
    BR: { n: 'Brasil', s: 'E', pays: ['PIX', 'Nubank', 'Banco'], m: 'PIX', cur: 'BRL', id: 'CPF' },
    CL: { n: 'Chile', s: 'G', card: 1 }, EC: { n: 'Ecuador', s: 'G', card: 1 }, GT: { n: 'Guatemala', s: 'G', card: 1 },
    CR: { n: 'Costa Rica', s: 'G', card: 1 }, HN: { n: 'Honduras', s: 'G', card: 1 }, SV: { n: 'El Salvador', s: 'G', card: 1 },
    NI: { n: 'Nicaragua', s: 'G', card: 1 }, PA: { n: 'Panamá', s: 'G', card: 1 }, UY: { n: 'Uruguay', s: 'G', card: 1 }
  };
  Object.keys(C).forEach(function (k) {
    var c = C[k];
    if (c.card) { c.pays = ['Tarjeta', 'Apple Pay', 'Google Pay']; c.m = 'Tarjeta'; c.cur = k === 'EC' || k === 'SV' || k === 'PA' ? 'USD' : ''; }
  });

  var T = {
    es: {
      dep: 'Depositar', howMuch: '¿Cuánto quieres depositar?', rec: 'Recomendado 20 $ o más: la comisión pesa menos.',
      s1t: 'Copia tu dirección OROLADO', s1p: 'Es solo tuya. Válida 24 horas.', making: 'Creando tu dirección…',
      copy: 'Copiar', copied: 'Copiado ✓', toastCopy: 'Dirección copiada', retry: 'Reintentar',
      net: 'Usa siempre la red <b>Tron (TRC-20)</b>. Otra red = dinero perdido.',
      s2tG: 'Paga en pesos con {m}', s2tGc: 'Paga con tu tarjeta', s2tE: 'Paga con {m}',
      s2pG: 'Se abre <b>Guardarian</b>. Compras <b>{a} USDT</b> y pegas tu dirección. Solo tu correo, sin crear cuenta.',
      s2pE: 'Se abre <b>El Dorado</b>. Compras <b>{a} USDT</b> con {m} y los envías a tu dirección.',
      goG: 'Pagar con {m}', goGc: 'Pagar con tarjeta', goE: 'Abrir El Dorado',
      tagG: 'Sin cuenta · sin app', tagE: 'La primera vez: registro de 2 minutos con tu {id}',
      video: 'Ver video', steps: 'Paso a paso',
      s3t: 'Listo: se acredita solo', s3p: 'Tu saldo sube solo en unos minutos. No tienes que enviar captura.',
      wait: 'Esperando tu depósito…', alt: 'Otros métodos (tarjeta, Mobile Money)',
      step: 'Paso {i} de {n}', back: 'Atrás', next: 'Siguiente', finish: 'Entendido',
      fee: 'Costo aprox.: {f}', feeE: '≈ 1,5 $ (0,49 $ P2P + 0,99 $ envío)', feeG: 'incluida en el precio de Guardarian',
      pause: 'Pausa', play: 'Ver', again: 'Ver otra vez', yourCur: 'tu moneda',
      G: [
        ['Toca «{go}»', 'Se abre <b>Guardarian</b> en tu navegador. No hay nada que descargar.', 'Si no se abre, escribe guardarian.com en tu navegador.'],
        ['Elige lo que compras', 'Arriba: <b>pagas en {cur}</b>. Abajo: <b>recibes USDT · TRC20</b>. Escribe el monto ({a} $) y toca <b>Comprar</b>.', 'Mira bien que diga <b>TRC20</b> al lado de USDT.'],
        ['Escribe tu correo', 'Pon tu correo y el código de 6 cifras que te llega. No piden teléfono.', 'Revisa también la carpeta Spam.'],
        ['Pega tu dirección OROLADO', 'En «Dirección de billetera», mantén el dedo y toca <b>Pegar</b>. Empieza con <b>T</b>.', 'Si no está copiada, vuelve a OROLADO y toca Copiar.'],
        ['Paga con {m}', '{payG}', 'A veces Guardarian pide una foto de tu identificación. Es normal y se hace una sola vez.'],
        ['Listo', 'Guardarian envía tus USDT a OROLADO. En unos minutos tu saldo sube solo.', 'Puedes cerrar Guardarian. OROLADO te avisa cuando llega.']
      ],
      payGspei: 'Guardarian te muestra una <b>CLABE</b> y el monto exacto. Abre la app de tu banco y haz la transferencia SPEI por ese monto exacto.',
      payGcard: 'Escribe los datos de tu tarjeta, o toca Apple Pay / Google Pay, y confirma.',
      E: [
        ['Crea tu cuenta (solo la 1ª vez)', 'Toca «Abrir El Dorado». Regístrate con tu correo y una foto de tu <b>{id}</b>. Tarda unos 2 minutos.', 'Después ya no hay que hacerlo otra vez.'],
        ['Ve a P2P', 'Toca <b>P2P</b> y elige: <b>tengo {cur}, quiero USDT</b>. Escribe el monto: <b>{a2} USDT</b>.', 'Compra {a2} USDT: así cubres la comisión de envío.'],
        ['Elige {m} y un vendedor', 'Elige <b>{m}</b>. Toca un vendedor con muchas ventas y buena nota (★), luego <b>Comprar USDT</b>.', 'Mira que el vendedor tenga muchas operaciones.'],
        ['Paga y toca «Pagado»', 'Paga con <b>{m}</b> a la cuenta que te muestra El Dorado. Vuelve y toca <b>Pagado</b>.', 'Paga solo a la cuenta que aparece en El Dorado.'],
        ['Envía a OROLADO', 'Cuando lleguen tus USDT: <b>Billetera → Retirar</b>. Pega tu dirección OROLADO, elige la red <b>Tron (TRC-20)</b> y confirma.', 'La red debe ser Tron (TRC-20). Otra red = dinero perdido.'],
        ['Listo', 'En unos minutos tu saldo de OROLADO sube solo.', 'La próxima vez: solo los pasos 2 a 5.']
      ],
      ui: { pay: 'Pagas', get: 'Recibes', buy: 'Comprar', mail: 'Correo', code: 'Código', cont: 'Continuar', wal: 'Dirección de billetera USDT (TRC20)', exact: 'Monto exacto', card: 'Tarjeta', paid: 'Pago recibido', sent: 'Enviado', photo: 'Foto de tu', take: 'Tomar foto', create: 'Crear cuenta', wallet: 'Billetera', have: 'Tengo', want: 'Quiero', ops: 'operaciones', payTo: 'Paga con {m} a', amount: 'Monto', paidB: 'Pagado', withdraw: 'Retirar', addr: 'Dirección', net: 'Red', confirm: 'Confirmar', mailEx: 'tu@correo.com' }
    },
    pt: {
      dep: 'Depositar', howMuch: 'Quanto você quer depositar?', rec: 'Recomendado 20 $ ou mais: a taxa pesa menos.',
      s1t: 'Copie seu endereço OROLADO', s1p: 'É só seu. Válido por 24 horas.', making: 'Criando seu endereço…',
      copy: 'Copiar', copied: 'Copiado ✓', toastCopy: 'Endereço copiado', retry: 'Tentar de novo',
      net: 'Use sempre a rede <b>Tron (TRC-20)</b>. Outra rede = dinheiro perdido.',
      s2tG: 'Pague com {m}', s2tGc: 'Pague com seu cartão', s2tE: 'Pague com {m}',
      s2pG: 'Abre a <b>Guardarian</b>. Você compra <b>{a} USDT</b> e cola seu endereço. Só seu e-mail, sem criar conta.',
      s2pE: 'Abre o <b>El Dorado</b>. Você compra <b>{a} USDT</b> com {m} e envia para o seu endereço.',
      goG: 'Pagar com {m}', goGc: 'Pagar com cartão', goE: 'Abrir El Dorado',
      tagG: 'Sem conta · sem app', tagE: 'Na 1ª vez: cadastro de 2 minutos com seu {id}',
      video: 'Ver vídeo', steps: 'Passo a passo',
      s3t: 'Pronto: crédito automático', s3p: 'Seu saldo sobe sozinho em alguns minutos. Não precisa enviar print.',
      wait: 'Aguardando seu depósito…', alt: 'Outros métodos (cartão, Mobile Money)',
      step: 'Passo {i} de {n}', back: 'Voltar', next: 'Próximo', finish: 'Entendi',
      fee: 'Custo aprox.: {f}', feeE: '≈ 1,5 $ (0,49 $ P2P + 0,99 $ envio)', feeG: 'incluída no preço da Guardarian',
      pause: 'Pausar', play: 'Ver', again: 'Ver de novo', yourCur: 'sua moeda',
      G: [
        ['Toque em «{go}»', 'A <b>Guardarian</b> abre no seu navegador. Nada para baixar.', 'Se não abrir, digite guardarian.com no navegador.'],
        ['Escolha o que comprar', 'Em cima: <b>você paga em {cur}</b>. Embaixo: <b>recebe USDT · TRC20</b>. Digite o valor ({a} $) e toque em <b>Comprar</b>.', 'Veja se aparece <b>TRC20</b> ao lado de USDT.'],
        ['Digite seu e-mail', 'Seu e-mail e o código de 6 dígitos que chega. Não pedem telefone.', 'Olhe também no Spam.'],
        ['Cole seu endereço OROLADO', 'Em «Endereço da carteira», segure o dedo e toque em <b>Colar</b>. Começa com <b>T</b>.', 'Se não estiver copiado, volte à OROLADO e toque em Copiar.'],
        ['Pague com {m}', '{payG}', 'Às vezes a Guardarian pede foto do documento. É normal, só uma vez.'],
        ['Pronto', 'A Guardarian envia seus USDT para a OROLADO. Em alguns minutos seu saldo sobe sozinho.', 'Pode fechar a Guardarian. A OROLADO avisa quando chegar.']
      ],
      payGspei: 'A Guardarian mostra os dados bancários e o valor exato. Abra o app do seu banco e transfira esse valor exato.',
      payGcard: 'Digite os dados do cartão, ou toque em Apple Pay / Google Pay, e confirme.',
      E: [
        ['Crie sua conta (só na 1ª vez)', 'Toque em «Abrir El Dorado». Cadastre-se com seu e-mail e uma foto do seu <b>{id}</b>. Leva uns 2 minutos.', 'Depois não precisa fazer de novo.'],
        ['Vá em P2P', 'Toque em <b>P2P</b> e escolha: <b>tenho {cur}, quero USDT</b>. Digite: <b>{a2} USDT</b>.', 'Compre {a2} USDT: assim cobre a taxa de envio.'],
        ['Escolha {m} e um vendedor', 'Escolha <b>{m}</b>. Toque em um vendedor com muitas vendas e boa nota (★), depois <b>Comprar USDT</b>.', 'Veja se o vendedor tem muitas operações.'],
        ['Pague e toque «Pago»', 'Pague por <b>{m}</b> para a conta mostrada no El Dorado. Volte e toque em <b>Pago</b>.', 'Pague só para a conta que aparece no El Dorado.'],
        ['Envie para a OROLADO', 'Quando os USDT chegarem: <b>Carteira → Sacar</b>. Cole seu endereço OROLADO, escolha a rede <b>Tron (TRC-20)</b> e confirme.', 'A rede deve ser Tron (TRC-20). Outra rede = dinheiro perdido.'],
        ['Pronto', 'Em alguns minutos seu saldo na OROLADO sobe sozinho.', 'Da próxima vez: só os passos 2 a 5.']
      ],
      ui: { pay: 'Você paga', get: 'Recebe', buy: 'Comprar', mail: 'E-mail', code: 'Código', cont: 'Continuar', wal: 'Endereço da carteira USDT (TRC20)', exact: 'Valor exato', card: 'Cartão', paid: 'Pagamento recebido', sent: 'Enviado', photo: 'Foto do seu', take: 'Tirar foto', create: 'Criar conta', wallet: 'Carteira', have: 'Tenho', want: 'Quero', ops: 'operações', payTo: 'Pague por {m} para', amount: 'Valor', paidB: 'Pago', withdraw: 'Sacar', addr: 'Endereço', net: 'Rede', confirm: 'Confirmar', mailEx: 'voce@email.com' }
    },
    fr: {
      dep: 'Déposer', howMuch: 'Combien veux-tu déposer ?', rec: 'Conseillé 20 $ ou plus : les frais pèsent moins.',
      s1t: 'Copie ton adresse OROLADO', s1p: 'Elle est à toi seul. Valable 24 heures.', making: 'Création de ton adresse…',
      copy: 'Copier', copied: 'Copié ✓', toastCopy: 'Adresse copiée', retry: 'Réessayer',
      net: 'Utilise toujours le réseau <b>Tron (TRC-20)</b>. Autre réseau = argent perdu.',
      s2tG: 'Paie en pesos avec {m}', s2tGc: 'Paie avec ta carte', s2tE: 'Paie avec {m}',
      s2pG: '<b>Guardarian</b> s\'ouvre. Tu achètes <b>{a} USDT</b> et tu colles ton adresse. Juste ton e-mail, sans compte.',
      s2pE: '<b>El Dorado</b> s\'ouvre. Tu achètes <b>{a} USDT</b> avec {m} et tu les envoies à ton adresse.',
      goG: 'Payer avec {m}', goGc: 'Payer par carte', goE: 'Ouvrir El Dorado',
      tagG: 'Sans compte · sans appli', tagE: '1re fois : inscription de 2 minutes avec ta {id}',
      video: 'Voir la vidéo', steps: 'Étape par étape',
      s3t: 'C\'est fini : crédit automatique', s3p: 'Ton solde monte tout seul en quelques minutes. Pas de capture à envoyer.',
      wait: 'En attente de ton dépôt…', alt: 'Autres méthodes (carte, Mobile Money)',
      step: 'Étape {i} sur {n}', back: 'Retour', next: 'Suivant', finish: 'Compris',
      fee: 'Coût environ : {f}', feeE: '≈ 1,5 $ (0,49 $ P2P + 0,99 $ envoi)', feeG: 'inclus dans le prix Guardarian',
      pause: 'Pause', play: 'Voir', again: 'Revoir', yourCur: 'ta monnaie',
      G: [
        ['Touche « {go} »', '<b>Guardarian</b> s\'ouvre dans le navigateur. Rien à télécharger.', 'Si ça ne s\'ouvre pas : tape guardarian.com dans le navigateur.'],
        ['Choisis ce que tu achètes', 'En haut : <b>tu paies en {cur}</b>. En bas : <b>tu reçois USDT · TRC20</b>. Mets le montant ({a} $) et touche <b>Acheter</b>.', 'Vérifie bien qu\'il y a <b>TRC20</b> à côté de USDT.'],
        ['Mets ton e-mail', 'Ton e-mail, puis le code à 6 chiffres reçu. Pas de téléphone demandé.', 'Regarde aussi dans les spams.'],
        ['Colle ton adresse OROLADO', 'Dans « Adresse du portefeuille », appuie longtemps puis <b>Coller</b>. Elle commence par <b>T</b>.', 'Si elle n\'est pas copiée : reviens sur OROLADO et touche Copier.'],
        ['Paie avec {m}', '{payG}', 'Parfois Guardarian demande une photo de la pièce d\'identité. C\'est normal, une seule fois.'],
        ['Fini', 'Guardarian envoie les USDT à OROLADO. En quelques minutes le solde monte tout seul.', 'Tu peux fermer Guardarian. OROLADO te prévient quand ça arrive.']
      ],
      payGspei: 'Guardarian affiche une <b>CLABE</b> (numéro de compte) et le montant exact. Ouvre l\'appli de ta banque et fais le virement SPEI de ce montant exact.',
      payGcard: 'Tape les chiffres de ta carte, ou touche Apple Pay / Google Pay, et confirme.',
      E: [
        ['Crée ton compte (1re fois seulement)', 'Touche « Ouvrir El Dorado ». Inscris-toi avec ton e-mail et une photo de ta <b>{id}</b>. Environ 2 minutes.', 'Ensuite plus besoin de le refaire.'],
        ['Va dans P2P', 'Touche <b>P2P</b> et choisis : <b>j\'ai des {cur}, je veux des USDT</b>. Mets : <b>{a2} USDT</b>.', 'Achète {a2} USDT : ça couvre les frais d\'envoi.'],
        ['Choisis {m} et un vendeur', 'Choisis <b>{m}</b>. Touche un vendeur avec beaucoup de ventes et une bonne note (★), puis <b>Acheter USDT</b>.', 'Prends un vendeur avec beaucoup d\'opérations.'],
        ['Paie et touche « Payé »', 'Paie avec <b>{m}</b> le compte affiché par El Dorado. Reviens et touche <b>Payé</b>.', 'Paie seulement le compte affiché dans El Dorado.'],
        ['Envoie à OROLADO', 'Quand les USDT arrivent : <b>Portefeuille → Retirer</b>. Colle ton adresse OROLADO, choisis le réseau <b>Tron (TRC-20)</b> et confirme.', 'Le réseau doit être Tron (TRC-20). Autre réseau = argent perdu.'],
        ['Fini', 'En quelques minutes ton solde OROLADO monte tout seul.', 'La prochaine fois : seulement les étapes 2 à 5.']
      ],
      ui: { pay: 'Tu paies', get: 'Tu reçois', buy: 'Acheter', mail: 'E-mail', code: 'Code', cont: 'Continuer', wal: 'Adresse du portefeuille USDT (TRC20)', exact: 'Montant exact', card: 'Carte', paid: 'Paiement reçu', sent: 'Envoyé', photo: 'Photo de ta', take: 'Prendre la photo', create: 'Créer le compte', wallet: 'Portefeuille', have: 'J\'ai', want: 'Je veux', ops: 'opérations', payTo: 'Paie avec {m} à', amount: 'Montant', paidB: 'Payé', withdraw: 'Retirer', addr: 'Adresse', net: 'Réseau', confirm: 'Confirmer', mailEx: 'toi@mail.com' }
    },
    en: {
      dep: 'Deposit', howMuch: 'How much do you want to deposit?', rec: 'We suggest 20 $ or more: the fee weighs less.',
      s1t: 'Copy your OROLADO address', s1p: 'It is yours only. Valid 24 hours.', making: 'Creating your address…',
      copy: 'Copy', copied: 'Copied ✓', toastCopy: 'Address copied', retry: 'Try again',
      net: 'Always use the <b>Tron (TRC-20)</b> network. Another network = money lost.',
      s2tG: 'Pay in pesos with {m}', s2tGc: 'Pay with your card', s2tE: 'Pay with {m}',
      s2pG: '<b>Guardarian</b> opens. You buy <b>{a} USDT</b> and paste your address. Just your email, no account.',
      s2pE: '<b>El Dorado</b> opens. You buy <b>{a} USDT</b> with {m} and send them to your address.',
      goG: 'Pay with {m}', goGc: 'Pay by card', goE: 'Open El Dorado',
      tagG: 'No account · no app', tagE: 'First time: 2-minute sign-up with your {id}',
      video: 'Watch video', steps: 'Step by step',
      s3t: 'Done: credited automatically', s3p: 'Your balance goes up by itself in a few minutes. No screenshot needed.',
      wait: 'Waiting for your deposit…', alt: 'Other methods (card, Mobile Money)',
      step: 'Step {i} of {n}', back: 'Back', next: 'Next', finish: 'Got it',
      fee: 'Approx. cost: {f}', feeE: '≈ 1.5 $ (0.49 $ P2P + 0.99 $ sending)', feeG: 'included in the Guardarian price',
      pause: 'Pause', play: 'Play', again: 'Watch again', yourCur: 'your currency',
      G: [
        ['Tap «{go}»', '<b>Guardarian</b> opens in your browser. Nothing to download.', 'If it does not open, type guardarian.com in your browser.'],
        ['Choose what you buy', 'Top: <b>you pay in {cur}</b>. Bottom: <b>you get USDT · TRC20</b>. Enter the amount ({a} $) and tap <b>Buy</b>.', 'Check that it says <b>TRC20</b> next to USDT.'],
        ['Enter your email', 'Your email, then the 6-digit code you receive. No phone needed.', 'Check your Spam folder too.'],
        ['Paste your OROLADO address', 'In «Wallet address», hold your finger and tap <b>Paste</b>. It starts with <b>T</b>.', 'If it is not copied, go back to OROLADO and tap Copy.'],
        ['Pay with {m}', '{payG}', 'Sometimes Guardarian asks for a photo of your ID. That is normal, only once.'],
        ['Done', 'Guardarian sends your USDT to OROLADO. In a few minutes your balance goes up by itself.', 'You can close Guardarian. OROLADO tells you when it arrives.']
      ],
      payGspei: 'Guardarian shows a <b>CLABE</b> and the exact amount. Open your bank app and send that exact amount by SPEI.',
      payGcard: 'Type your card details, or tap Apple Pay / Google Pay, and confirm.',
      E: [
        ['Create your account (first time only)', 'Tap «Open El Dorado». Sign up with your email and a photo of your <b>{id}</b>. About 2 minutes.', 'After that you never do it again.'],
        ['Go to P2P', 'Tap <b>P2P</b> and choose: <b>I have {cur}, I want USDT</b>. Enter: <b>{a2} USDT</b>.', 'Buy {a2} USDT: that covers the sending fee.'],
        ['Choose {m} and a seller', 'Choose <b>{m}</b>. Tap a seller with many sales and a good rating (★), then <b>Buy USDT</b>.', 'Pick a seller with many trades.'],
        ['Pay and tap «Paid»', 'Pay with <b>{m}</b> to the account El Dorado shows. Come back and tap <b>Paid</b>.', 'Only pay the account shown in El Dorado.'],
        ['Send to OROLADO', 'When your USDT arrive: <b>Wallet → Withdraw</b>. Paste your OROLADO address, choose the <b>Tron (TRC-20)</b> network and confirm.', 'The network must be Tron (TRC-20). Another network = money lost.'],
        ['Done', 'In a few minutes your OROLADO balance goes up by itself.', 'Next time: only steps 2 to 5.']
      ],
      ui: { pay: 'You pay', get: 'You get', buy: 'Buy', mail: 'Email', code: 'Code', cont: 'Continue', wal: 'USDT wallet address (TRC20)', exact: 'Exact amount', card: 'Card', paid: 'Payment received', sent: 'Sent', photo: 'Photo of your', take: 'Take photo', create: 'Create account', wallet: 'Wallet', have: 'I have', want: 'I want', ops: 'trades', payTo: 'Pay with {m} to', amount: 'Amount', paidB: 'Paid', withdraw: 'Withdraw', addr: 'Address', net: 'Network', confirm: 'Confirm', mailEx: 'you@mail.com' }
    }
  };
  // Mots des moyens de paiement traduits (le reste : noms propres).
  var PAYW = { Tarjeta: { pt: 'Cartão', fr: 'Carte', en: 'Card' }, Transferencia: { pt: 'Transferência', fr: 'Virement', en: 'Transfer' }, Banco: { fr: 'Banque', en: 'Bank' } };

  var st = { cc: 'MX', amt: 20, view: 'dep', step: 0, addr: '', addrErr: '', copied: false, opts: {}, demoT: 0, demoOn: false, demoI: 0 };
  var root = null;

  function lang() {
    var l = String(document.documentElement.getAttribute('data-lang') || document.documentElement.lang || 'es').slice(0, 2);
    if (T[l]) return l;
    return C[st.cc] && st.cc === 'BR' ? 'pt' : (l === 'fr' ? 'fr' : 'en');
  }
  function L() { return T[lang()]; }
  function fill(s, d) { return String(s).replace(/\{(\w+)\}/g, function (_, k) { return d[k] != null ? d[k] : ''; }); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (ch) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]; }); }
  function payWord(w) { var m = PAYW[w]; return (m && m[lang()]) || w; }
  function flag(cc) { return String.fromCodePoint(127397 + cc.charCodeAt(0), 127397 + cc.charCodeAt(1)); }
  function vars() {
    var c = C[st.cc], t = L();
    var d = { m: payWord(c.m), cur: c.cur || t.yourCur, id: c.id || 'ID', a: st.amt, a2: st.amt + 2 };
    d.go = fill(c.s === 'G' ? (c.card ? t.goGc : t.goG) : t.goE, d);
    d.payG = c.card ? t.payGcard : t.payGspei;
    return d;
  }
  function steps() { var c = C[st.cc]; return c.s === 'G' ? L().G : L().E; }
  function toast(m) { try { if (st.opts.toast) st.opts.toast(m, 'ok'); } catch (e) { /* ignore */ } }

  var CSS =
    '#oroLatam{position:fixed;inset:0;z-index:2147483000;background:#0B0E14;color:#F8FAFC;display:flex;flex-direction:column;font-family:var(--font,"Plus Jakarta Sans",system-ui,sans-serif);-webkit-font-smoothing:antialiased;padding-top:env(safe-area-inset-top,0px)}' +
    '#oroLatam *{box-sizing:border-box}' +
    '#oroLatam button{font:inherit;color:inherit;cursor:pointer}' +
    '#oroLatam .la-hd{flex:0 0 auto;display:flex;align-items:center;gap:10px;padding:10px 14px;border-bottom:1px solid #1E2638}' +
    '#oroLatam .la-hd b{flex:1;min-width:0;font-size:17px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}' +
    '#oroLatam .la-ib{width:34px;height:34px;flex:0 0 34px;border-radius:50%;background:#121722;border:1px solid #2a3247;display:grid;place-items:center;color:#cbd5e1;font-size:16px;padding:0}' +
    '#oroLatam .la-bd{flex:1 1 auto;min-height:0;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:10px 14px calc(16px + env(safe-area-inset-bottom,0px));display:flex;flex-direction:column;gap:9px}' +
    '#oroLatam .la-test{flex:0 1 150px;min-width:0;background:#1a1406;color:#fbbf24;border:1px solid #3d2d07;border-radius:8px;padding:5px 4px;font:inherit;font-size:12px;font-weight:700}' +
    '#oroLatam .la-cty{display:flex;align-items:center;gap:8px}' +
    '#oroLatam .la-cty .fl{font-size:18px;line-height:1}' +
    '#oroLatam .la-pays{display:flex;gap:5px;flex-wrap:wrap}' +
    '#oroLatam .la-pays span{background:#121722;border:1px solid #1E2638;border-radius:6px;padding:4px 8px;font-size:11.5px;font-weight:700}' +
    '#oroLatam .la-lb{font-size:12.5px;color:#94A3B8}' +
    '#oroLatam .la-chips{display:grid;grid-template-columns:repeat(4,1fr);gap:6px}' +
    '#oroLatam .la-chips button{background:#121722;border:1px solid #1E2638;border-radius:8px;padding:7px 0;font-weight:800;font-size:14px}' +
    '#oroLatam .la-chips button.on{border-color:#F59E0B;background:rgba(245,158,11,.12);color:#F59E0B}' +
    '#oroLatam .la-nt{font-size:11.5px;color:#94A3B8;line-height:1.35}' +
    '#oroLatam .la-st{background:#121722;border:1px solid #1E2638;border-radius:10px;padding:10px 11px;display:flex;gap:10px}' +
    '#oroLatam .la-st.on{border-color:#F59E0B}' +
    '#oroLatam .la-n{flex:0 0 26px;height:26px;border-radius:50%;background:#F59E0B;color:#111827;font-weight:800;display:grid;place-items:center;font-size:14px}' +
    '#oroLatam .la-st.ok .la-n{background:#10B981;color:#fff}' +
    '#oroLatam .la-c{flex:1;min-width:0}' +
    '#oroLatam .la-c h4{margin:0 0 3px;font-size:14.5px;line-height:1.25}' +
    '#oroLatam .la-c p{margin:0;font-size:12.5px;color:#94A3B8;line-height:1.35}' +
    '#oroLatam .la-c p b{color:#F8FAFC}' +
    '#oroLatam .la-adr{margin-top:7px;display:flex;gap:6px;align-items:stretch}' +
    '#oroLatam .la-adr code{flex:1;min-width:0;background:#0B0E14;border:1px dashed #3a4560;border-radius:6px;padding:8px;font-family:ui-monospace,Menlo,Consolas,monospace;font-size:11.5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#e7ecf5}' +
    '#oroLatam .la-adr code.err{white-space:normal;color:#fecdd3;font-family:inherit}' +
    '#oroLatam .la-btn{border:0;border-radius:8px;font-weight:800;font-size:13px;padding:8px 12px;white-space:nowrap}' +
    '#oroLatam .la-cp{background:#2a3247;color:#fff}' +
    '#oroLatam .la-cp.done{background:#10B981}' +
    '#oroLatam .la-cp:disabled{opacity:.5}' +
    '#oroLatam .la-warn{margin-top:7px;display:flex;gap:7px;align-items:flex-start;background:rgba(244,63,94,.12);border-radius:7px;padding:6px 8px;font-size:11.5px;line-height:1.35;color:#fecdd3}' +
    '#oroLatam .la-warn b{color:#fff}' +
    '#oroLatam .la-go{width:100%;margin-top:7px;background:#F59E0B;color:#111827;font-size:15px;padding:11px;display:flex;align-items:center;justify-content:center;gap:8px;text-decoration:none;border-radius:8px;font-weight:800;text-align:center}' +
    '#oroLatam .la-row2{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:6px}' +
    '#oroLatam .la-how{background:none;border:1px solid #2a3247;border-radius:8px;padding:8px 4px;font-weight:700;font-size:12.5px;display:flex;align-items:center;justify-content:center;gap:6px;min-width:0}' +
    '#oroLatam .la-how.vid{border-color:#F59E0B;color:#F59E0B}' +
    '#oroLatam .la-tag{display:block;margin-top:6px;font-size:11.5px;color:#F59E0B;font-weight:700}' +
    '#oroLatam .la-wait{display:flex;align-items:center;gap:8px;margin-top:6px;font-size:12.5px;color:#10B981;font-weight:700}' +
    '#oroLatam .la-dot{width:9px;height:9px;flex:0 0 9px;border-radius:50%;background:#10B981;box-shadow:0 0 0 4px rgba(16,185,129,.14);animation:laPl 1.6s ease-in-out infinite}' +
    '@keyframes laPl{50%{box-shadow:0 0 0 7px rgba(16,185,129,0)}}' +
    '#oroLatam .la-alt{background:none;border:0;text-align:center;font-size:12.5px;color:#94A3B8;text-decoration:underline;padding:4px}' +
    '#oroLatam .la-prog{display:flex;gap:4px}' +
    '#oroLatam .la-prog i{flex:1;height:4px;border-radius:2px;background:#2a3247;overflow:hidden;position:relative}' +
    '#oroLatam .la-prog i.on{background:#F59E0B}' +
    '#oroLatam .la-prog i.run::after{content:"";position:absolute;inset:0;background:#F59E0B;transform-origin:left;animation:laBar var(--d,5s) linear forwards}' +
    '@keyframes laBar{from{transform:scaleX(0)}to{transform:scaleX(1)}}' +
    '#oroLatam .la-gs{font-size:12px;color:#F59E0B;font-weight:800;letter-spacing:.04em;text-transform:uppercase}' +
    '#oroLatam .la-gt{margin:0;font-size:18px;line-height:1.25}' +
    '#oroLatam .la-gp{margin:0;font-size:13.5px;color:#cbd5e1;line-height:1.45}' +
    '#oroLatam .la-gp b{color:#F8FAFC}' +
    '#oroLatam .la-tip{background:rgba(245,158,11,.12);border-radius:8px;padding:7px 10px;font-size:12.5px;line-height:1.4;color:#fde68a}' +
    '#oroLatam .la-nav{display:flex;gap:8px;margin-top:auto}' +
    '#oroLatam .la-nav button{flex:1;border-radius:8px;padding:12px;font-weight:800;font-size:14px;border:0}' +
    '#oroLatam .la-back{background:#121722;border:1px solid #2a3247!important}' +
    '#oroLatam .la-next{background:#F59E0B;color:#111827}' +
    '#oroLatam .la-ph{align-self:center;width:100%;max-width:290px;background:#f4f6fa;color:#1f2937;border-radius:16px;border:6px solid #1f2633;padding:9px;display:flex;flex-direction:column;gap:6px;font-size:12px;box-shadow:0 10px 30px rgba(0,0,0,.35);position:relative}' +
    '#oroLatam .la-ph .bar{display:flex;align-items:center;gap:6px;font-size:10.5px;color:#64748b;border-bottom:1px solid #e2e8f0;padding-bottom:5px}' +
    '#oroLatam .la-ph .bar b{color:#0f172a;font-size:11.5px}' +
    '#oroLatam .la-ph .bar span{margin-left:auto;font-size:10px}' +
    '#oroLatam .la-ph .row{background:#fff;border:1px solid #e2e8f0;border-radius:8px;padding:6px 9px;display:flex;justify-content:space-between;align-items:center;gap:8px}' +
    '#oroLatam .la-ph .row small{display:block;color:#64748b;font-size:10px}' +
    '#oroLatam .la-ph .row strong{font-size:13.5px}' +
    '#oroLatam .la-ph .pill{background:#eef2ff;color:#3730a3;border-radius:999px;padding:3px 8px;font-size:10.5px;font-weight:700;white-space:nowrap}' +
    '#oroLatam .la-ph .pill.g{background:#dcfce7;color:#166534}' +
    '#oroLatam .la-ph .bt{background:#111827;color:#fff;border-radius:8px;text-align:center;padding:7px;font-weight:800;font-size:12.5px}' +
    '#oroLatam .la-ph .bt.y{background:#16a34a}' +
    '#oroLatam .la-ph .hl{outline:3px solid #F59E0B;outline-offset:2px;border-radius:8px;position:relative}' +
    '#oroLatam .la-ph .in{background:#fff;border:1px solid #cbd5e1;border-radius:8px;padding:6px 9px;font-family:ui-monospace,Menlo,Consolas,monospace;font-size:10.5px;color:#0f172a;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}' +
    '#oroLatam .la-ph .lbl{font-size:10.5px;color:#475569;font-weight:700}' +
    '#oroLatam .la-ph .sel{display:flex;gap:6px;flex-wrap:wrap}' +
    '#oroLatam .la-ph .sel span{border:1px solid #cbd5e1;border-radius:7px;padding:4px 8px;font-weight:700;font-size:11px;background:#fff}' +
    '#oroLatam .la-ph .sel span.on{border-color:#16a34a;background:#f0fdf4;color:#166534}' +
    '#oroLatam .la-ph .sv{display:flex;justify-content:space-between;align-items:center;background:#fff;border:1px solid #e2e8f0;border-radius:8px;padding:5px 8px;font-size:11px;gap:6px}' +
    '#oroLatam .la-ph .sv .s5{color:#f59e0b;font-weight:800}' +
    '#oroLatam .la-ph .ok{display:grid;place-items:center;gap:4px;padding:8px 0;text-align:center}' +
    '#oroLatam .la-ph .ok i{width:42px;height:42px;border-radius:50%;background:#dcfce7;color:#16a34a;display:grid;place-items:center;font-size:21px;font-weight:900;font-style:normal}' +
    // « Doigt » de la vidéo : il vient toucher l'élément entouré.
    '#oroLatam .la-fg{position:absolute;right:8%;bottom:-6px;width:30px;height:30px;border-radius:50%;background:rgba(245,158,11,.35);border:2px solid #F59E0B;pointer-events:none;animation:laTap 1.4s ease-in-out infinite}' +
    '@keyframes laTap{0%{transform:translate(18px,22px) scale(1);opacity:0}35%{transform:translate(0,0) scale(1);opacity:1}55%{transform:translate(0,0) scale(.7)}75%{transform:translate(0,0) scale(1);opacity:1}100%{opacity:0}}' +
    '#oroLatam .la-vbar{display:flex;gap:8px}' +
    '#oroLatam .la-vbar button{flex:1;border-radius:8px;padding:11px;font-weight:800;font-size:14px;border:1px solid #2a3247;background:#121722}' +
    '#oroLatam .la-vbar button.y{background:#F59E0B;color:#111827;border-color:#F59E0B}' +
    '#oroLatam .la-vcap{min-height:3.2em}' +
    '@media (max-height:700px){#oroLatam .la-bd{gap:7px;padding-top:8px}#oroLatam .la-st{padding:8px 10px}#oroLatam .la-go{padding:10px;margin-top:6px}#oroLatam .la-warn{margin-top:5px;padding:5px 8px}#oroLatam .la-adr{margin-top:5px}#oroLatam .la-adr code{padding:6px 8px}#oroLatam .la-how{padding:7px 4px}#oroLatam .la-tag{margin-top:4px}}' +
    '@media (max-height:600px){#oroLatam .la-bd{gap:6px}#oroLatam .la-c h4{font-size:13.5px;margin-bottom:2px}#oroLatam .la-hd{padding:6px 14px}#oroLatam .la-ib{width:30px;height:30px;flex-basis:30px}#oroLatam .la-nt{font-size:11px}#oroLatam .la-alt{padding:0}#oroLatam .la-c p{font-size:12px}#oroLatam .la-chips button{padding:5px 0}#oroLatam .la-lb{display:none}#oroLatam .la-gt{font-size:16px}#oroLatam .la-ph{max-width:250px;gap:5px}#oroLatam .la-hd{padding:8px 14px}}' +
    '@media (prefers-reduced-motion:reduce){#oroLatam .la-dot,#oroLatam .la-fg{animation:none}}';

  function ensureCss() {
    if (document.getElementById('oroLatamCss')) return;
    var s = document.createElement('style');
    s.id = 'oroLatamCss';
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  // Petits écrans dessinés : ce que le joueur verra sur le site de paiement à chaque étape.
  function phone(i, finger) {
    var c = C[st.cc], d = vars(), a = st.amt, u = L().ui, A = st.addr || 'TQ7mWd4k3Fh9XvB2pLwZrN8cYs1uHe6Jq';
    var F = finger ? '<i class="la-fg"></i>' : '';
    var hl = function (inner, cls) { return '<div class="hl ' + (cls || '') + '">' + inner + F + '</div>'; };
    var bar = function (s) { return '<div class="bar"><b>' + s.name + '</b><span>🔒 ' + s.host + '</span></div>'; };
    if (c.s === 'G') {
      var B = bar(SITES.G);
      var cur = c.cur || 'USD';
      var payRow = '<div class="row"><div><small>' + u.pay + '</small><strong>' + (cur === 'MXN' ? '≈ ' + Math.round(a * 19) : a) + '</strong></div><span class="pill">' + cur + '</span></div>';
      var getRow = '<div class="row"><div><small>' + u.get + '</small><strong>≈ ' + (a - 1.2).toFixed(1) + '</strong></div><span class="pill g">USDT · TRC20</span></div>';
      return [
        B + hl('<div class="bt y">' + esc(d.go) + '</div>') + '<div class="lbl" style="text-align:center">OROLADO → Guardarian</div>',
        B + payRow + hl(getRow) + '<div class="bt">' + u.buy + '</div>',
        B + '<div class="lbl">' + u.mail + '</div><div class="in">' + u.mailEx + '</div><div class="lbl">' + u.code + '</div>' + hl('<div class="in">4 8 2 9 1 7</div>') + '<div class="bt">' + u.cont + '</div>',
        B + '<div class="lbl">' + u.wal + '</div>' + hl('<div class="in">' + esc(A) + '</div>') + '<div class="bt">' + u.cont + '</div>',
        B + (c.card
          ? '<div class="sel"><span class="on">' + u.card + '</span><span>Apple Pay</span><span>Google Pay</span></div><div class="in">4152 •••• •••• 0921</div>' + hl('<div class="bt">' + a + ' $</div>')
          : '<div class="sel"><span class="on">SPEI</span><span>' + u.card + '</span></div>' + hl('<div class="row"><div><small>CLABE</small><strong style="font-size:12px;font-family:ui-monospace,Menlo,monospace">6461 8000 1234 5678 90</strong></div></div>') + '<div class="row"><div><small>' + u.exact + '</small><strong>≈ ' + Math.round(a * 19) + ' MXN</strong></div></div>'),
        B + '<div class="ok"><i>✓</i><b>' + u.paid + '</b><small style="color:#64748b">USDT → T…' + esc(A.slice(-4)) + '</small></div>'
      ][i];
    }
    var E = bar(SITES.E);
    return [
      E + '<div class="lbl">' + u.mail + '</div><div class="in">' + u.mailEx + '</div><div class="lbl">' + u.photo + ' ' + esc(c.id || 'ID') + '</div>' + hl('<div class="row"><div><small>📷</small><strong style="font-size:12px">' + u.take + '</strong></div></div>') + '<div class="bt">' + u.create + '</div>',
      E + '<div class="sel"><span>' + u.wallet + '</span>' + '<span class="on">P2P</span></div><div class="row"><div><small>' + u.have + '</small><strong>' + esc(d.cur) + '</strong></div><span class="pill">→</span><div><small>' + u.want + '</small><strong>USDT</strong></div></div>' + hl('<div class="in">' + (a + 2) + ' USDT</div>'),
      E + '<div class="sel"><span class="on">' + esc(d.m) + '</span><span>' + esc(payWord(c.pays[1] || 'Banco')) + '</span></div>' + hl('<div class="sv"><span><b>carlos_p2p</b><br><small>1.240 ' + u.ops + '</small></span><span class="s5">★ 99%</span></div>') + '<div class="sv"><span><b>ana.usdt</b><br><small>310 ' + u.ops + '</small></span><span class="s5">★ 97%</span></div><div class="bt">' + u.buy + ' USDT</div>',
      E + '<div class="row"><div><small>' + fill(u.payTo, { m: esc(d.m) }) + '</small><strong style="font-size:12px">Carlos P.</strong></div></div><div class="row"><div><small>' + u.amount + '</small><strong>' + (a + 2) + ' USDT · ' + esc(d.cur) + '</strong></div></div>' + hl('<div class="bt y">' + u.paidB + '</div>'),
      E + '<div class="sel"><span class="on">' + u.withdraw + '</span></div><div class="lbl">' + u.addr + '</div><div class="in">' + esc(A) + '</div><div class="lbl">' + u.net + '</div>' + hl('<div class="sel"><span class="on">Tron (TRC-20)</span><span>Arbitrum</span></div>') + '<div class="bt">' + u.confirm + '</div>',
      E + '<div class="ok"><i>✓</i><b>' + u.sent + '</b><small style="color:#64748b">' + a + ' USDT → T…' + esc(A.slice(-4)) + '</small></div>'
    ][i];
  }

  function head(title, back, test) {
    return '<div class="la-hd">' + (back ? '<button class="la-ib" data-act="home" aria-label="' + esc(L().back) + '">←</button>' : '') +
      '<b>' + title + '</b>' + (test || '') + '<button class="la-ib" data-act="' + (back ? 'home' : 'close') + '" aria-label="✕">✕</button></div>';
  }
  // Compte admin seulement : choisir le pays pour tester (les joueurs ne le voient pas).
  function testSel() {
    if (!st.opts.admin) return '';
    return '<select class="la-test" data-act="cty" aria-label="Test">' + Object.keys(C).map(function (k) {
      return '<option value="' + k + '"' + (k === st.cc ? ' selected' : '') + '>🧪 ' + flag(k) + ' ' + C[k].n + '</option>';
    }).join('') + '</select>';
  }

  function depHtml() {
    var c = C[st.cc], t = L(), d = vars(), site = SITES[c.s];
    var s2t = c.s === 'G' ? (c.card ? t.s2tGc : t.s2tG) : t.s2tE;
    var s2p = c.s === 'G' ? t.s2pG : t.s2pE;
    var tag = c.s === 'G' ? t.tagG : t.tagE;
    var adr = st.addrErr
      ? '<code class="err">' + esc(st.addrErr) + '</code><button class="la-btn la-cp" data-act="retry">' + t.retry + '</button>'
      : '<code>' + (st.addr ? esc(st.addr) : t.making) + '</code><button class="la-btn la-cp' + (st.copied ? ' done' : '') + '" data-act="copy"' + (st.addr ? '' : ' disabled') + '>' + (st.copied ? t.copied : t.copy) + '</button>';
    return head(t.dep, false, testSel()) + '<div class="la-bd">' +
      '<div class="la-cty"><span class="fl">' + flag(st.cc) + '</span><span class="la-pays">' + c.pays.map(function (x) { return '<span>' + esc(payWord(x)) + '</span>'; }).join('') + '</span></div>' +
      '<div class="la-lb">' + t.howMuch + '</div><div class="la-chips">' +
        [10, 20, 50, 100].map(function (a) { return '<button data-act="amt" data-a="' + a + '" class="' + (a === st.amt ? 'on' : '') + '">' + a + ' $</button>'; }).join('') +
      '</div><div class="la-nt">' + t.rec + (c.s === 'E' ? ' ' + fill(t.fee, { f: t.feeE }) : '') + '</div>' +
      '<div class="la-st ok"><div class="la-n">1</div><div class="la-c"><h4>' + t.s1t + '</h4><p>' + t.s1p + '</p>' +
        '<div class="la-adr">' + adr + '</div><div class="la-warn"><span>⚠️</span><span>' + t.net + '</span></div></div></div>' +
      '<div class="la-st on"><div class="la-n">2</div><div class="la-c"><h4>' + fill(s2t, d) + '</h4><p>' + fill(s2p, d) + '</p>' +
        '<a class="la-go" href="' + site.url + '" target="_blank" rel="noopener">' + esc(d.go) + ' →</a>' +
        '<div class="la-row2"><button class="la-how vid" data-act="video">▶ ' + t.video + '</button><button class="la-how" data-act="guide">☰ ' + t.steps + '</button></div>' +
        '<span class="la-tag">' + fill(tag, d) + '</span></div></div>' +
      '<div class="la-st"><div class="la-n">3</div><div class="la-c"><h4>' + t.s3t + '</h4>' +
        '<div class="la-wait"><span class="la-dot"></span>' + t.wait + '</div></div></div>' +
      '<button class="la-alt" data-act="alt">' + t.alt + '</button></div>';
  }

  function guideHtml(demo) {
    var t = L(), d = vars(), arr = steps(), i = demo ? st.demoI : st.step, s = arr[i], c = C[st.cc];
    var prog = arr.map(function (_, k) {
      var cls = k < i ? 'on' : (k === i ? (demo && st.demoOn ? 'run' : 'on') : '');
      return '<i class="' + cls + '"' + (demo && k === i ? ' style="--d:' + DEMO_MS / 1000 + 's"' : '') + '></i>';
    }).join('');
    var nav = demo
      ? '<div class="la-vbar"><button data-act="vtoggle">' + (st.demoOn ? '❚❚ ' + t.pause : '▶ ' + (i === arr.length - 1 ? t.again : t.play)) + '</button><button class="y" data-act="home">' + t.finish + ' ✓</button></div>'
      : '<div class="la-nav">' + (i > 0 ? '<button class="la-back" data-act="prev">← ' + t.back + '</button>' : '') +
        '<button class="la-next" data-act="next">' + (i < arr.length - 1 ? t.next + ' →' : t.finish + ' ✓') + '</button></div>';
    return head(SITES[c.s].name + ' · ' + flag(st.cc), true) + '<div class="la-bd">' +
      '<div class="la-prog">' + prog + '</div>' +
      '<div class="la-gs">' + fill(t.step, { i: i + 1, n: arr.length }) + '</div>' +
      '<div class="la-vcap"><h3 class="la-gt">' + fill(s[0], d) + '</h3></div>' +
      '<p class="la-gp">' + fill(s[1], d) + '</p>' +
      '<div class="la-ph">' + phone(i, demo) + '</div>' +
      '<div class="la-tip">💡 ' + fill(s[2], d) + '</div>' + nav + '</div>';
  }

  var DEMO_MS = 5000;
  function demoTick() {
    clearTimeout(st.demoT);
    if (!st.demoOn || st.view !== 'demo') return;
    st.demoT = setTimeout(function () {
      if (st.demoI < steps().length - 1) { st.demoI++; render(); demoTick(); }
      else { st.demoOn = false; render(); }
    }, DEMO_MS);
  }

  function render() {
    if (!root) return;
    var top = st.view === 'dep' ? root.querySelector('.la-bd') : null;
    var keep = top ? top.scrollTop : 0;
    root.innerHTML = st.view === 'guide' ? guideHtml(false) : st.view === 'demo' ? guideHtml(true) : depHtml();
    var bd = root.querySelector('.la-bd');
    if (bd && st.view === 'dep') bd.scrollTop = keep;
  }

  function loadAddr() {
    st.addrErr = '';
    if (!st.opts.invoice) return;
    Promise.resolve(st.opts.invoice(st.amt)).then(function (r) {
      if (r && r.address) st.addr = String(r.address);
      else st.addrErr = String((r && r.reason) || 'Error');
      render();
    }).catch(function () { st.addrErr = 'Error'; render(); });
  }

  function copyAddr() {
    var a = st.addr;
    if (!a) return;
    var done = function () { st.copied = true; render(); toast(L().toastCopy); };
    var fallback = function () {
      try {
        var ta = document.createElement('textarea');
        ta.value = a; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0';
        document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta);
      } catch (e) { /* ignore */ }
      done();
    };
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(a).then(done, fallback);
      else fallback();
    } catch (e2) { fallback(); }
  }

  function close() {
    clearTimeout(st.demoT);
    if (root && root.parentNode) root.parentNode.removeChild(root);
    root = null;
  }

  function onClick(e) {
    var el = e.target.closest ? e.target.closest('[data-act]') : null;
    if (!el || el.tagName === 'SELECT') return;
    var act = el.getAttribute('data-act');
    if (act === 'close') close();
    else if (act === 'home') { st.view = 'dep'; st.demoOn = false; clearTimeout(st.demoT); render(); }
    else if (act === 'amt') { st.amt = Number(el.getAttribute('data-a')) || 20; render(); }
    else if (act === 'copy') copyAddr();
    else if (act === 'retry') { st.addr = ''; render(); loadAddr(); }
    else if (act === 'guide') { st.view = 'guide'; st.step = 0; render(); }
    else if (act === 'video') { st.view = 'demo'; st.demoI = 0; st.demoOn = true; render(); demoTick(); }
    else if (act === 'vtoggle') {
      if (st.demoOn) { st.demoOn = false; clearTimeout(st.demoT); }
      else { if (st.demoI >= steps().length - 1) st.demoI = 0; st.demoOn = true; demoTick(); }
      render();
    } else if (act === 'prev') { st.step = Math.max(0, st.step - 1); render(); }
    else if (act === 'next') { if (st.step < steps().length - 1) { st.step++; render(); } else { st.view = 'dep'; render(); } }
    else if (act === 'alt') { var fb = st.opts.fallback; close(); if (fb) fb(); }
  }

  function open(opts) {
    opts = opts || {};
    ensureCss();
    close();
    st.opts = opts;
    st.cc = C[opts.cc] ? opts.cc : 'MX';
    st.amt = [10, 20, 50, 100].indexOf(Number(opts.amount)) >= 0 ? Number(opts.amount) : 20;
    st.view = 'dep'; st.step = 0; st.copied = false; st.addr = ''; st.addrErr = '';
    root = document.createElement('div');
    root.id = 'oroLatam';
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-modal', 'true');
    root.addEventListener('click', onClick);
    root.addEventListener('change', function (e) {
      if (e.target && e.target.getAttribute('data-act') === 'cty') { st.cc = e.target.value; st.view = 'dep'; render(); }
    });
    document.body.appendChild(root);
    render();
    loadAddr();
  }

  D6.Latam = {
    open: open,
    close: close,
    isOpen: function () { return !!root; },
    countries: C,
    // Crédit reçu (suivi Dépôt crypto) : on referme, l'écran « Dépôt réussi » du site est dessous.
    paid: function () { close(); }
  };
})();
