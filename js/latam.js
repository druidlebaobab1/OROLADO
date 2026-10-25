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
      nowB: 'Ahora', cpd: 'Dirección copiada', paste: 'Ya está copiada: pégala en {s}', paidQ: '¿Ya pagaste? Tu saldo sube solo en unos minutos. ¿Dudas? Mira el video.',
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
      nowB: 'Agora', cpd: 'Endereço copiado', paste: 'Já está copiado: cole na {s}', paidQ: 'Já pagou? Seu saldo sobe sozinho em alguns minutos. Dúvidas? Veja o vídeo.',
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
      nowB: 'Maintenant', cpd: 'Adresse copiée', paste: 'Elle est copiée : colle-la sur {s}', paidQ: 'Tu as payé ? Ton solde monte tout seul en quelques minutes. Un doute ? Regarde la vidéo.',
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
      nowB: 'Now', cpd: 'Address copied', paste: 'Already copied: paste it on {s}', paidQ: 'Paid already? Your balance goes up by itself in a few minutes. Unsure? Watch the video.',
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
  // 2026-10-25 : les 8 autres langues du site (les écrans dessinés des sites de paiement restent en anglais : T.en.ui).
  T.de = {
    nowB: 'Jetzt', cpd: 'Adresse kopiert', paste: 'Schon kopiert: bei {s} einfügen', paidQ: 'Schon bezahlt? Dein Guthaben steigt in wenigen Minuten von selbst. Unsicher? Sieh dir das Video an.',
    dep: 'Einzahlen', howMuch: 'Wie viel möchtest du einzahlen?', rec: 'Empfohlen 20 $ oder mehr: die Gebühr fällt weniger ins Gewicht.',
    s1t: 'Kopiere deine OROLADO-Adresse', s1p: 'Sie gehört nur dir. 24 Stunden gültig.', making: 'Deine Adresse wird erstellt…',
    copy: 'Kopieren', copied: 'Kopiert ✓', toastCopy: 'Adresse kopiert', retry: 'Erneut',
    net: 'Nutze immer das Netzwerk <b>Tron (TRC-20)</b>. Anderes Netzwerk = Geld verloren.',
    s2tG: 'Bezahle in Pesos mit {m}', s2tGc: 'Bezahle mit deiner Karte', s2tE: 'Bezahle mit {m}',
    s2pG: '<b>Guardarian</b> öffnet sich. Du kaufst <b>{a} USDT</b> und fügst deine Adresse ein. Nur deine E-Mail, kein Konto.',
    s2pE: '<b>El Dorado</b> öffnet sich. Du kaufst <b>{a} USDT</b> mit {m} und sendest sie an deine Adresse.',
    goG: 'Mit {m} bezahlen', goGc: 'Mit Karte bezahlen', goE: 'El Dorado öffnen',
    tagG: 'Kein Konto · keine App', tagE: 'Beim 1. Mal: 2 Minuten Anmeldung mit deinem {id}',
    video: 'Video ansehen', steps: 'Schritt für Schritt',
    s3t: 'Fertig: automatische Gutschrift', s3p: 'Dein Guthaben steigt in wenigen Minuten von selbst.',
    wait: 'Warte auf deine Einzahlung…', alt: 'Andere Methoden (Karte, Mobile Money)',
    step: 'Schritt {i} von {n}', back: 'Zurück', next: 'Weiter', finish: 'Verstanden',
    fee: 'Kosten ca.: {f}', feeE: '≈ 1,5 $ (0,49 $ P2P + 0,99 $ Versand)', feeG: 'im Guardarian-Preis enthalten',
    pause: 'Pause', play: 'Abspielen', again: 'Nochmal ansehen', yourCur: 'deine Währung',
    G: [
      ['Tippe auf «{go}»', '<b>Guardarian</b> öffnet sich im Browser. Nichts herunterladen.', 'Öffnet es sich nicht: guardarian.com im Browser eingeben.'],
      ['Wähle, was du kaufst', 'Oben: <b>du zahlst in {cur}</b>. Unten: <b>du bekommst USDT · TRC20</b>. Betrag ({a} $) eingeben und <b>Kaufen</b> tippen.', 'Prüfe, dass <b>TRC20</b> neben USDT steht.'],
      ['Gib deine E-Mail ein', 'Deine E-Mail und den 6-stelligen Code, den du bekommst. Kein Telefon nötig.', 'Sieh auch im Spam nach.'],
      ['Füge deine OROLADO-Adresse ein', 'Bei «Wallet-Adresse» Finger halten und <b>Einfügen</b> tippen. Sie beginnt mit <b>T</b>.', 'Nicht kopiert? Zurück zu OROLADO und Kopieren tippen.'],
      ['Bezahle mit {m}', '{payG}', 'Manchmal will Guardarian ein Foto deines Ausweises. Das ist normal, nur einmal.'],
      ['Fertig', 'Guardarian sendet deine USDT an OROLADO. In wenigen Minuten steigt dein Guthaben.', 'Du kannst Guardarian schließen. OROLADO sagt dir Bescheid.']
    ],
    payGspei: 'Guardarian zeigt eine <b>CLABE</b> und den genauen Betrag. Öffne deine Bank-App und überweise genau diesen Betrag per SPEI.',
    payGcard: 'Gib deine Kartendaten ein oder tippe Apple Pay / Google Pay und bestätige.',
    E: [
      ['Konto erstellen (nur beim 1. Mal)', 'Tippe «El Dorado öffnen». Melde dich mit E-Mail und einem Foto deines <b>{id}</b> an. Etwa 2 Minuten.', 'Danach nie wieder.'],
      ['Geh zu P2P', 'Tippe <b>P2P</b> und wähle: <b>ich habe {cur}, ich will USDT</b>. Eingeben: <b>{a2} USDT</b>.', 'Kaufe {a2} USDT: so ist die Versandgebühr gedeckt.'],
      ['Wähle {m} und einen Verkäufer', 'Wähle <b>{m}</b>. Tippe einen Verkäufer mit vielen Verkäufen und guter Bewertung (★), dann <b>USDT kaufen</b>.', 'Nimm einen Verkäufer mit vielen Geschäften.'],
      ['Bezahlen und «Bezahlt» tippen', 'Zahle mit <b>{m}</b> an das Konto, das El Dorado zeigt. Komm zurück und tippe <b>Bezahlt</b>.', 'Zahle nur an das Konto in El Dorado.'],
      ['An OROLADO senden', 'Wenn die USDT da sind: <b>Wallet → Auszahlen</b>. OROLADO-Adresse einfügen, Netzwerk <b>Tron (TRC-20)</b> wählen und bestätigen.', 'Das Netzwerk muss Tron (TRC-20) sein. Anderes Netzwerk = Geld verloren.'],
      ['Fertig', 'In wenigen Minuten steigt dein OROLADO-Guthaben von selbst.', 'Nächstes Mal: nur Schritte 2 bis 5.']
    ]
  };
  T.ru = {
    nowB: 'Сейчас', cpd: 'Адрес скопирован', paste: 'Уже скопирован: вставьте его в {s}', paidQ: 'Уже оплатили? Баланс сам пополнится через несколько минут. Сомневаетесь? Посмотрите видео.',
    dep: 'Пополнить', howMuch: 'Сколько вы хотите внести?', rec: 'Советуем от 20 $: комиссия заметна меньше.',
    s1t: 'Скопируйте ваш адрес OROLADO', s1p: 'Он только ваш. Действует 24 часа.', making: 'Создаём ваш адрес…',
    copy: 'Копировать', copied: 'Скопировано ✓', toastCopy: 'Адрес скопирован', retry: 'Повторить',
    net: 'Всегда сеть <b>Tron (TRC-20)</b>. Другая сеть = деньги потеряны.',
    s2tG: 'Оплатите в песо через {m}', s2tGc: 'Оплатите картой', s2tE: 'Оплатите через {m}',
    s2pG: 'Откроется <b>Guardarian</b>. Вы покупаете <b>{a} USDT</b> и вставляете свой адрес. Только e-mail, без аккаунта.',
    s2pE: 'Откроется <b>El Dorado</b>. Вы покупаете <b>{a} USDT</b> через {m} и отправляете на свой адрес.',
    goG: 'Оплатить через {m}', goGc: 'Оплатить картой', goE: 'Открыть El Dorado',
    tagG: 'Без аккаунта · без приложения', tagE: 'Первый раз: регистрация 2 минуты с вашим {id}',
    video: 'Видео', steps: 'По шагам',
    s3t: 'Готово: зачисление само', s3p: 'Баланс пополнится сам через несколько минут.',
    wait: 'Ждём ваш депозит…', alt: 'Другие способы (карта, Mobile Money)',
    step: 'Шаг {i} из {n}', back: 'Назад', next: 'Далее', finish: 'Понятно',
    fee: 'Примерно: {f}', feeE: '≈ 1,5 $ (0,49 $ P2P + 0,99 $ отправка)', feeG: 'включено в цену Guardarian',
    pause: 'Пауза', play: 'Смотреть', again: 'Ещё раз', yourCur: 'ваша валюта',
    G: [
      ['Нажмите «{go}»', '<b>Guardarian</b> откроется в браузере. Ничего не скачивать.', 'Не открылось? Введите guardarian.com в браузере.'],
      ['Выберите покупку', 'Сверху: <b>платите в {cur}</b>. Снизу: <b>получаете USDT · TRC20</b>. Введите сумму ({a} $) и нажмите <b>Купить</b>.', 'Проверьте, что рядом с USDT написано <b>TRC20</b>.'],
      ['Введите e-mail', 'Ваш e-mail и 6-значный код из письма. Телефон не нужен.', 'Проверьте и папку «Спам».'],
      ['Вставьте адрес OROLADO', 'В поле «Адрес кошелька» удерживайте палец и нажмите <b>Вставить</b>. Он начинается с <b>T</b>.', 'Не скопирован? Вернитесь в OROLADO и нажмите Копировать.'],
      ['Оплатите через {m}', '{payG}', 'Иногда Guardarian просит фото документа. Это нормально, один раз.'],
      ['Готово', 'Guardarian отправит USDT в OROLADO. Через несколько минут баланс пополнится.', 'Guardarian можно закрыть. OROLADO сообщит о зачислении.']
    ],
    payGspei: 'Guardarian покажет <b>CLABE</b> и точную сумму. Откройте приложение банка и переведите точно эту сумму через SPEI.',
    payGcard: 'Введите данные карты или нажмите Apple Pay / Google Pay и подтвердите.',
    E: [
      ['Создайте аккаунт (только 1-й раз)', 'Нажмите «Открыть El Dorado». Зарегистрируйтесь с e-mail и фото вашего <b>{id}</b>. Около 2 минут.', 'Потом больше не нужно.'],
      ['Откройте P2P', 'Нажмите <b>P2P</b> и выберите: <b>у меня {cur}, хочу USDT</b>. Введите: <b>{a2} USDT</b>.', 'Купите {a2} USDT: так покроете комиссию за отправку.'],
      ['Выберите {m} и продавца', 'Выберите <b>{m}</b>. Нажмите продавца с большим числом сделок и хорошей оценкой (★), затем <b>Купить USDT</b>.', 'Берите продавца с большим числом сделок.'],
      ['Оплатите и нажмите «Оплачено»', 'Оплатите через <b>{m}</b> на счёт из El Dorado. Вернитесь и нажмите <b>Оплачено</b>.', 'Платите только на счёт из El Dorado.'],
      ['Отправьте в OROLADO', 'Когда USDT придут: <b>Кошелёк → Вывести</b>. Вставьте адрес OROLADO, выберите сеть <b>Tron (TRC-20)</b> и подтвердите.', 'Сеть должна быть Tron (TRC-20). Другая сеть = деньги потеряны.'],
      ['Готово', 'Через несколько минут баланс OROLADO пополнится сам.', 'В следующий раз: только шаги 2–5.']
    ]
  };
  T.tr = {
    nowB: 'Şimdi', cpd: 'Adres kopyalandı', paste: 'Kopyalandı: {s} sitesine yapıştır', paidQ: 'Ödedin mi? Bakiyen birkaç dakikada kendiliğinden yükselir. Emin değil misin? Videoyu izle.',
    dep: 'Para yatır', howMuch: 'Ne kadar yatırmak istiyorsun?', rec: '20 $ ve üzeri önerilir: komisyon daha az etkiler.',
    s1t: 'OROLADO adresini kopyala', s1p: 'Sadece senin. 24 saat geçerli.', making: 'Adresin oluşturuluyor…',
    copy: 'Kopyala', copied: 'Kopyalandı ✓', toastCopy: 'Adres kopyalandı', retry: 'Tekrar dene',
    net: 'Her zaman <b>Tron (TRC-20)</b> ağını kullan. Başka ağ = para kaybı.',
    s2tG: '{m} ile peso öde', s2tGc: 'Kartınla öde', s2tE: '{m} ile öde',
    s2pG: '<b>Guardarian</b> açılır. <b>{a} USDT</b> alırsın ve adresini yapıştırırsın. Sadece e-posta, hesap yok.',
    s2pE: '<b>El Dorado</b> açılır. {m} ile <b>{a} USDT</b> alır ve adresine gönderirsin.',
    goG: '{m} ile öde', goGc: 'Kartla öde', goE: 'El Dorado\'yu aç',
    tagG: 'Hesap yok · uygulama yok', tagE: 'İlk sefer: {id} ile 2 dakikalık kayıt',
    video: 'Videoyu izle', steps: 'Adım adım',
    s3t: 'Bitti: otomatik yüklenir', s3p: 'Bakiyen birkaç dakikada kendiliğinden yükselir.',
    wait: 'Yatırımın bekleniyor…', alt: 'Diğer yöntemler (kart, Mobile Money)',
    step: 'Adım {i} / {n}', back: 'Geri', next: 'İleri', finish: 'Anladım',
    fee: 'Yaklaşık maliyet: {f}', feeE: '≈ 1,5 $ (0,49 $ P2P + 0,99 $ gönderim)', feeG: 'Guardarian fiyatına dahil',
    pause: 'Duraklat', play: 'İzle', again: 'Tekrar izle', yourCur: 'para birimin',
    G: [
      ['«{go}» düğmesine dokun', '<b>Guardarian</b> tarayıcıda açılır. İndirilecek bir şey yok.', 'Açılmazsa tarayıcıya guardarian.com yaz.'],
      ['Ne alacağını seç', 'Üstte: <b>{cur} ile ödersin</b>. Altta: <b>USDT · TRC20 alırsın</b>. Tutarı ({a} $) yaz ve <b>Satın al</b>\'a dokun.', 'USDT\'nin yanında <b>TRC20</b> yazdığını kontrol et.'],
      ['E-postanı yaz', 'E-postanı ve gelen 6 haneli kodu yaz. Telefon istenmez.', 'Spam klasörüne de bak.'],
      ['OROLADO adresini yapıştır', '«Cüzdan adresi» alanında parmağını basılı tut ve <b>Yapıştır</b>\'a dokun. <b>T</b> ile başlar.', 'Kopyalı değilse OROLADO\'ya dön ve Kopyala\'ya dokun.'],
      ['{m} ile öde', '{payG}', 'Bazen Guardarian kimlik fotoğrafı ister. Normaldir, bir kez.'],
      ['Bitti', 'Guardarian USDT\'ni OROLADO\'ya gönderir. Birkaç dakikada bakiyen yükselir.', 'Guardarian\'ı kapatabilirsin. OROLADO sana haber verir.']
    ],
    payGspei: 'Guardarian bir <b>CLABE</b> ve tam tutarı gösterir. Banka uygulamanı aç ve bu tam tutarı SPEI ile gönder.',
    payGcard: 'Kart bilgilerini yaz ya da Apple Pay / Google Pay\'e dokun ve onayla.',
    E: [
      ['Hesabını aç (sadece ilk sefer)', '«El Dorado\'yu aç»a dokun. E-posta ve <b>{id}</b> fotoğrafınla kaydol. Yaklaşık 2 dakika.', 'Sonra bir daha gerekmez.'],
      ['P2P\'ye git', '<b>P2P</b>\'ye dokun ve seç: <b>{cur} var, USDT istiyorum</b>. Yaz: <b>{a2} USDT</b>.', '{a2} USDT al: gönderim ücretini karşılar.'],
      ['{m} ve bir satıcı seç', '<b>{m}</b> seç. Çok satışı ve iyi puanı (★) olan bir satıcıya dokun, sonra <b>USDT al</b>.', 'Çok işlemi olan satıcıyı seç.'],
      ['Öde ve «Ödendi»ye dokun', 'El Dorado\'nun gösterdiği hesaba <b>{m}</b> ile öde. Geri dön ve <b>Ödendi</b>\'ye dokun.', 'Sadece El Dorado\'daki hesaba öde.'],
      ['OROLADO\'ya gönder', 'USDT gelince: <b>Cüzdan → Çek</b>. OROLADO adresini yapıştır, <b>Tron (TRC-20)</b> ağını seç ve onayla.', 'Ağ Tron (TRC-20) olmalı. Başka ağ = para kaybı.'],
      ['Bitti', 'Birkaç dakikada OROLADO bakiyen kendiliğinden yükselir.', 'Bir dahaki sefere: sadece 2–5. adımlar.']
    ]
  };
  T.vi = {
    nowB: 'Bây giờ', cpd: 'Đã sao chép địa chỉ', paste: 'Đã sao chép: dán vào {s}', paidQ: 'Đã thanh toán? Số dư tự tăng sau vài phút. Chưa rõ? Xem video.',
    dep: 'Nạp tiền', howMuch: 'Bạn muốn nạp bao nhiêu?', rec: 'Nên nạp từ 20 $: phí sẽ nhẹ hơn.',
    s1t: 'Sao chép địa chỉ OROLADO', s1p: 'Chỉ của riêng bạn. Hiệu lực 24 giờ.', making: 'Đang tạo địa chỉ…',
    copy: 'Sao chép', copied: 'Đã chép ✓', toastCopy: 'Đã sao chép địa chỉ', retry: 'Thử lại',
    net: 'Luôn dùng mạng <b>Tron (TRC-20)</b>. Mạng khác = mất tiền.',
    s2tG: 'Trả bằng peso qua {m}', s2tGc: 'Trả bằng thẻ', s2tE: 'Trả qua {m}',
    s2pG: '<b>Guardarian</b> mở ra. Bạn mua <b>{a} USDT</b> và dán địa chỉ. Chỉ cần email, không cần tài khoản.',
    s2pE: '<b>El Dorado</b> mở ra. Bạn mua <b>{a} USDT</b> qua {m} rồi gửi về địa chỉ của bạn.',
    goG: 'Trả qua {m}', goGc: 'Trả bằng thẻ', goE: 'Mở El Dorado',
    tagG: 'Không tài khoản · không ứng dụng', tagE: 'Lần đầu: đăng ký 2 phút với {id}',
    video: 'Xem video', steps: 'Từng bước',
    s3t: 'Xong: tự cộng tiền', s3p: 'Số dư tự tăng sau vài phút.',
    wait: 'Đang chờ khoản nạp…', alt: 'Cách khác (thẻ, Mobile Money)',
    step: 'Bước {i}/{n}', back: 'Quay lại', next: 'Tiếp', finish: 'Đã hiểu',
    fee: 'Phí khoảng: {f}', feeE: '≈ 1,5 $ (0,49 $ P2P + 0,99 $ gửi)', feeG: 'đã gồm trong giá Guardarian',
    pause: 'Dừng', play: 'Xem', again: 'Xem lại', yourCur: 'tiền của bạn',
    G: [
      ['Chạm «{go}»', '<b>Guardarian</b> mở trong trình duyệt. Không cần tải gì.', 'Không mở? Gõ guardarian.com vào trình duyệt.'],
      ['Chọn thứ bạn mua', 'Trên: <b>bạn trả bằng {cur}</b>. Dưới: <b>bạn nhận USDT · TRC20</b>. Nhập số tiền ({a} $) và chạm <b>Mua</b>.', 'Kiểm tra có chữ <b>TRC20</b> cạnh USDT.'],
      ['Nhập email', 'Email và mã 6 số nhận được. Không cần số điện thoại.', 'Xem cả thư mục Spam.'],
      ['Dán địa chỉ OROLADO', 'Ở ô «Địa chỉ ví», giữ ngón tay rồi chạm <b>Dán</b>. Bắt đầu bằng <b>T</b>.', 'Chưa chép? Quay lại OROLADO và chạm Sao chép.'],
      ['Trả qua {m}', '{payG}', 'Đôi khi Guardarian xin ảnh giấy tờ. Bình thường, chỉ một lần.'],
      ['Xong', 'Guardarian gửi USDT về OROLADO. Vài phút sau số dư tự tăng.', 'Có thể đóng Guardarian. OROLADO sẽ báo bạn.']
    ],
    payGspei: 'Guardarian hiện <b>CLABE</b> và số tiền chính xác. Mở app ngân hàng và chuyển SPEI đúng số tiền đó.',
    payGcard: 'Nhập thông tin thẻ, hoặc chạm Apple Pay / Google Pay, rồi xác nhận.',
    E: [
      ['Tạo tài khoản (chỉ lần đầu)', 'Chạm «Mở El Dorado». Đăng ký bằng email và ảnh <b>{id}</b>. Khoảng 2 phút.', 'Sau đó không cần làm lại.'],
      ['Vào P2P', 'Chạm <b>P2P</b> và chọn: <b>tôi có {cur}, muốn USDT</b>. Nhập: <b>{a2} USDT</b>.', 'Mua {a2} USDT để đủ phí gửi.'],
      ['Chọn {m} và người bán', 'Chọn <b>{m}</b>. Chạm người bán có nhiều giao dịch và điểm tốt (★), rồi <b>Mua USDT</b>.', 'Chọn người bán có nhiều giao dịch.'],
      ['Trả tiền và chạm «Đã trả»', 'Trả qua <b>{m}</b> vào tài khoản El Dorado hiện. Quay lại và chạm <b>Đã trả</b>.', 'Chỉ trả vào tài khoản hiện trong El Dorado.'],
      ['Gửi về OROLADO', 'Khi USDT về: <b>Ví → Rút</b>. Dán địa chỉ OROLADO, chọn mạng <b>Tron (TRC-20)</b> và xác nhận.', 'Mạng phải là Tron (TRC-20). Mạng khác = mất tiền.'],
      ['Xong', 'Vài phút sau số dư OROLADO tự tăng.', 'Lần sau: chỉ bước 2 đến 5.']
    ]
  };
  T.id = {
    nowB: 'Sekarang', cpd: 'Alamat disalin', paste: 'Sudah disalin: tempel di {s}', paidQ: 'Sudah bayar? Saldo naik sendiri dalam beberapa menit. Ragu? Tonton videonya.',
    dep: 'Setor', howMuch: 'Berapa yang ingin kamu setor?', rec: 'Disarankan 20 $ atau lebih: biaya terasa lebih ringan.',
    s1t: 'Salin alamat OROLADO-mu', s1p: 'Hanya milikmu. Berlaku 24 jam.', making: 'Membuat alamatmu…',
    copy: 'Salin', copied: 'Disalin ✓', toastCopy: 'Alamat disalin', retry: 'Coba lagi',
    net: 'Selalu pakai jaringan <b>Tron (TRC-20)</b>. Jaringan lain = uang hilang.',
    s2tG: 'Bayar peso dengan {m}', s2tGc: 'Bayar dengan kartu', s2tE: 'Bayar dengan {m}',
    s2pG: '<b>Guardarian</b> terbuka. Kamu beli <b>{a} USDT</b> dan tempel alamatmu. Cukup email, tanpa akun.',
    s2pE: '<b>El Dorado</b> terbuka. Kamu beli <b>{a} USDT</b> dengan {m} lalu kirim ke alamatmu.',
    goG: 'Bayar dengan {m}', goGc: 'Bayar dengan kartu', goE: 'Buka El Dorado',
    tagG: 'Tanpa akun · tanpa aplikasi', tagE: 'Pertama kali: daftar 2 menit dengan {id}',
    video: 'Tonton video', steps: 'Langkah demi langkah',
    s3t: 'Selesai: masuk otomatis', s3p: 'Saldo naik sendiri dalam beberapa menit.',
    wait: 'Menunggu setoranmu…', alt: 'Metode lain (kartu, Mobile Money)',
    step: 'Langkah {i} dari {n}', back: 'Kembali', next: 'Lanjut', finish: 'Mengerti',
    fee: 'Biaya kira-kira: {f}', feeE: '≈ 1,5 $ (0,49 $ P2P + 0,99 $ kirim)', feeG: 'sudah termasuk harga Guardarian',
    pause: 'Jeda', play: 'Putar', again: 'Tonton lagi', yourCur: 'mata uangmu',
    G: [
      ['Ketuk «{go}»', '<b>Guardarian</b> terbuka di browser. Tidak perlu unduh apa pun.', 'Tidak terbuka? Ketik guardarian.com di browser.'],
      ['Pilih yang kamu beli', 'Atas: <b>kamu bayar {cur}</b>. Bawah: <b>kamu terima USDT · TRC20</b>. Isi jumlah ({a} $) lalu ketuk <b>Beli</b>.', 'Pastikan ada <b>TRC20</b> di samping USDT.'],
      ['Isi email', 'Email dan kode 6 angka yang kamu terima. Tanpa nomor HP.', 'Cek juga folder Spam.'],
      ['Tempel alamat OROLADO', 'Di «Alamat dompet», tahan jari lalu ketuk <b>Tempel</b>. Diawali <b>T</b>.', 'Belum tersalin? Kembali ke OROLADO dan ketuk Salin.'],
      ['Bayar dengan {m}', '{payG}', 'Kadang Guardarian minta foto identitas. Itu normal, sekali saja.'],
      ['Selesai', 'Guardarian mengirim USDT ke OROLADO. Beberapa menit lagi saldo naik.', 'Kamu boleh tutup Guardarian. OROLADO akan memberi tahu.']
    ],
    payGspei: 'Guardarian menampilkan <b>CLABE</b> dan jumlah pasti. Buka aplikasi bank dan transfer SPEI tepat jumlah itu.',
    payGcard: 'Isi data kartu, atau ketuk Apple Pay / Google Pay, lalu konfirmasi.',
    E: [
      ['Buat akun (hanya pertama kali)', 'Ketuk «Buka El Dorado». Daftar dengan email dan foto <b>{id}</b>. Sekitar 2 menit.', 'Setelah itu tidak perlu lagi.'],
      ['Buka P2P', 'Ketuk <b>P2P</b> dan pilih: <b>saya punya {cur}, mau USDT</b>. Isi: <b>{a2} USDT</b>.', 'Beli {a2} USDT agar biaya kirim tertutup.'],
      ['Pilih {m} dan penjual', 'Pilih <b>{m}</b>. Ketuk penjual dengan banyak transaksi dan nilai bagus (★), lalu <b>Beli USDT</b>.', 'Pilih penjual dengan banyak transaksi.'],
      ['Bayar dan ketuk «Sudah bayar»', 'Bayar dengan <b>{m}</b> ke rekening yang ditampilkan El Dorado. Kembali dan ketuk <b>Sudah bayar</b>.', 'Bayar hanya ke rekening di El Dorado.'],
      ['Kirim ke OROLADO', 'Saat USDT masuk: <b>Dompet → Tarik</b>. Tempel alamat OROLADO, pilih jaringan <b>Tron (TRC-20)</b> lalu konfirmasi.', 'Jaringan harus Tron (TRC-20). Jaringan lain = uang hilang.'],
      ['Selesai', 'Beberapa menit lagi saldo OROLADO naik sendiri.', 'Lain kali: hanya langkah 2 sampai 5.']
    ]
  };
  T.ar = {
    nowB: 'الآن', cpd: 'تم نسخ العنوان', paste: 'تم النسخ: الصقه في {s}', paidQ: 'هل دفعت؟ يرتفع رصيدك تلقائياً خلال دقائق. غير متأكد؟ شاهد الفيديو.',
    dep: 'إيداع', howMuch: 'كم تريد أن تودع؟', rec: 'ننصح بـ 20 $ أو أكثر: الرسوم أخف.',
    s1t: 'انسخ عنوان OROLADO الخاص بك', s1p: 'خاص بك وحدك. صالح 24 ساعة.', making: 'جارٍ إنشاء عنوانك…',
    copy: 'نسخ', copied: 'تم النسخ ✓', toastCopy: 'تم نسخ العنوان', retry: 'إعادة المحاولة',
    net: 'استخدم دائماً شبكة <b>Tron (TRC-20)</b>. شبكة أخرى = خسارة المال.',
    s2tG: 'ادفع بالبيزو عبر {m}', s2tGc: 'ادفع ببطاقتك', s2tE: 'ادفع عبر {m}',
    s2pG: 'يفتح <b>Guardarian</b>. تشتري <b>{a} USDT</b> وتلصق عنوانك. بريدك فقط، بلا حساب.',
    s2pE: 'يفتح <b>El Dorado</b>. تشتري <b>{a} USDT</b> عبر {m} وترسلها إلى عنوانك.',
    goG: 'ادفع عبر {m}', goGc: 'ادفع بالبطاقة', goE: 'افتح El Dorado',
    tagG: 'بلا حساب · بلا تطبيق', tagE: 'أول مرة: تسجيل دقيقتين بـ {id}',
    video: 'شاهد الفيديو', steps: 'خطوة بخطوة',
    s3t: 'انتهى: يُضاف تلقائياً', s3p: 'يرتفع رصيدك تلقائياً خلال دقائق.',
    wait: 'بانتظار إيداعك…', alt: 'طرق أخرى (بطاقة، Mobile Money)',
    step: 'الخطوة {i} من {n}', back: 'رجوع', next: 'التالي', finish: 'فهمت',
    fee: 'التكلفة تقريباً: {f}', feeE: '≈ 1,5 $ (0,49 $ P2P + 0,99 $ إرسال)', feeG: 'ضمن سعر Guardarian',
    pause: 'إيقاف', play: 'تشغيل', again: 'شاهد مجدداً', yourCur: 'عملتك',
    G: [
      ['المس «{go}»', 'يفتح <b>Guardarian</b> في المتصفح. لا شيء للتنزيل.', 'إن لم يفتح: اكتب guardarian.com في المتصفح.'],
      ['اختر ما تشتريه', 'في الأعلى: <b>تدفع بـ {cur}</b>. في الأسفل: <b>تستلم USDT · TRC20</b>. اكتب المبلغ ({a} $) والمس <b>شراء</b>.', 'تأكد من وجود <b>TRC20</b> بجانب USDT.'],
      ['اكتب بريدك', 'بريدك والرمز من 6 أرقام الذي يصلك. لا حاجة للهاتف.', 'افحص مجلد الرسائل غير المرغوبة أيضاً.'],
      ['الصق عنوان OROLADO', 'في «عنوان المحفظة» اضغط مطولاً ثم المس <b>لصق</b>. يبدأ بـ <b>T</b>.', 'لم يُنسخ؟ عد إلى OROLADO والمس نسخ.'],
      ['ادفع عبر {m}', '{payG}', 'أحياناً يطلب Guardarian صورة الهوية. هذا طبيعي، مرة واحدة.'],
      ['انتهى', 'يرسل Guardarian عملات USDT إلى OROLADO. خلال دقائق يرتفع رصيدك.', 'يمكنك إغلاق Guardarian. سيخبرك OROLADO.']
    ],
    payGspei: 'يعرض Guardarian رقم <b>CLABE</b> والمبلغ الدقيق. افتح تطبيق البنك وحوّل هذا المبلغ بالضبط عبر SPEI.',
    payGcard: 'اكتب بيانات البطاقة أو المس Apple Pay / Google Pay ثم أكّد.',
    E: [
      ['أنشئ حسابك (أول مرة فقط)', 'المس «افتح El Dorado». سجّل ببريدك وصورة <b>{id}</b>. نحو دقيقتين.', 'بعدها لا حاجة لذلك مجدداً.'],
      ['اذهب إلى P2P', 'المس <b>P2P</b> واختر: <b>لدي {cur}، أريد USDT</b>. اكتب: <b>{a2} USDT</b>.', 'اشترِ {a2} USDT لتغطية رسوم الإرسال.'],
      ['اختر {m} وبائعاً', 'اختر <b>{m}</b>. المس بائعاً بمبيعات كثيرة وتقييم جيد (★)، ثم <b>شراء USDT</b>.', 'اختر بائعاً بعمليات كثيرة.'],
      ['ادفع والمس «تم الدفع»', 'ادفع عبر <b>{m}</b> إلى الحساب الذي يعرضه El Dorado. عد والمس <b>تم الدفع</b>.', 'ادفع فقط للحساب الظاهر في El Dorado.'],
      ['أرسل إلى OROLADO', 'عند وصول USDT: <b>المحفظة ← سحب</b>. الصق عنوان OROLADO واختر شبكة <b>Tron (TRC-20)</b> ثم أكّد.', 'يجب أن تكون الشبكة Tron (TRC-20). شبكة أخرى = خسارة المال.'],
      ['انتهى', 'خلال دقائق يرتفع رصيد OROLADO تلقائياً.', 'المرة القادمة: الخطوات 2 إلى 5 فقط.']
    ]
  };
  T.hi = {
    nowB: 'अभी', cpd: 'पता कॉपी हो गया', paste: 'कॉपी हो चुका: {s} में पेस्ट करें', paidQ: 'भुगतान कर दिया? कुछ मिनट में बैलेंस अपने आप बढ़ेगा। संदेह है? वीडियो देखें।',
    dep: 'जमा करें', howMuch: 'कितना जमा करना है?', rec: '20 $ या ज़्यादा सुझाया जाता है: शुल्क कम लगता है।',
    s1t: 'अपना OROLADO पता कॉपी करें', s1p: 'सिर्फ़ आपका। 24 घंटे मान्य।', making: 'आपका पता बन रहा है…',
    copy: 'कॉपी', copied: 'कॉपी ✓', toastCopy: 'पता कॉपी हुआ', retry: 'फिर कोशिश',
    net: 'हमेशा <b>Tron (TRC-20)</b> नेटवर्क चुनें। दूसरा नेटवर्क = पैसा खोया।',
    s2tG: '{m} से पेसो में भुगतान', s2tGc: 'कार्ड से भुगतान', s2tE: '{m} से भुगतान',
    s2pG: '<b>Guardarian</b> खुलेगा। आप <b>{a} USDT</b> खरीदें और अपना पता पेस्ट करें। सिर्फ़ ईमेल, खाता नहीं।',
    s2pE: '<b>El Dorado</b> खुलेगा। {m} से <b>{a} USDT</b> खरीदें और अपने पते पर भेजें।',
    goG: '{m} से भुगतान', goGc: 'कार्ड से भुगतान', goE: 'El Dorado खोलें',
    tagG: 'खाता नहीं · ऐप नहीं', tagE: 'पहली बार: {id} से 2 मिनट का रजिस्ट्रेशन',
    video: 'वीडियो देखें', steps: 'कदम दर कदम',
    s3t: 'हो गया: अपने आप जमा', s3p: 'कुछ मिनट में बैलेंस अपने आप बढ़ेगा।',
    wait: 'आपकी जमा का इंतज़ार…', alt: 'दूसरे तरीके (कार्ड, Mobile Money)',
    step: 'कदम {i} / {n}', back: 'पीछे', next: 'आगे', finish: 'समझ गया',
    fee: 'लगभग खर्च: {f}', feeE: '≈ 1,5 $ (0,49 $ P2P + 0,99 $ भेजना)', feeG: 'Guardarian की क़ीमत में शामिल',
    pause: 'रोकें', play: 'चलाएँ', again: 'फिर देखें', yourCur: 'आपकी मुद्रा',
    G: [
      ['«{go}» दबाएँ', '<b>Guardarian</b> ब्राउज़र में खुलेगा। कुछ डाउनलोड नहीं।', 'न खुले तो ब्राउज़र में guardarian.com लिखें।'],
      ['क्या ख़रीदना है चुनें', 'ऊपर: <b>आप {cur} में देंगे</b>। नीचे: <b>आपको USDT · TRC20 मिलेगा</b>। रक़म ({a} $) लिखें और <b>ख़रीदें</b> दबाएँ।', 'देखें कि USDT के पास <b>TRC20</b> लिखा हो।'],
      ['ईमेल लिखें', 'ईमेल और आया हुआ 6 अंकों का कोड। फ़ोन नहीं चाहिए।', 'स्पैम फ़ोल्डर भी देखें।'],
      ['OROLADO पता पेस्ट करें', '«वॉलेट पता» में उंगली दबाए रखें और <b>पेस्ट</b> दबाएँ। यह <b>T</b> से शुरू होता है।', 'कॉपी नहीं हुआ? OROLADO पर लौटें और कॉपी दबाएँ।'],
      ['{m} से भुगतान करें', '{payG}', 'कभी-कभी Guardarian पहचान पत्र की फ़ोटो माँगता है। यह सामान्य है, एक बार।'],
      ['हो गया', 'Guardarian आपके USDT OROLADO भेजेगा। कुछ मिनट में बैलेंस बढ़ेगा।', 'Guardarian बंद कर सकते हैं। OROLADO बताएगा।']
    ],
    payGspei: 'Guardarian एक <b>CLABE</b> और सटीक रक़म दिखाएगा। बैंक ऐप खोलें और ठीक वही रक़म SPEI से भेजें।',
    payGcard: 'कार्ड की जानकारी लिखें, या Apple Pay / Google Pay दबाएँ, और पुष्टि करें।',
    E: [
      ['खाता बनाएँ (सिर्फ़ पहली बार)', '«El Dorado खोलें» दबाएँ। ईमेल और अपने <b>{id}</b> की फ़ोटो से रजिस्टर करें। लगभग 2 मिनट।', 'उसके बाद दोबारा नहीं।'],
      ['P2P पर जाएँ', '<b>P2P</b> दबाएँ और चुनें: <b>मेरे पास {cur} है, USDT चाहिए</b>। लिखें: <b>{a2} USDT</b>।', '{a2} USDT ख़रीदें: भेजने का शुल्क पूरा होगा।'],
      ['{m} और विक्रेता चुनें', '<b>{m}</b> चुनें। ज़्यादा बिक्री और अच्छी रेटिंग (★) वाला विक्रेता दबाएँ, फिर <b>USDT ख़रीदें</b>।', 'ज़्यादा सौदों वाला विक्रेता चुनें।'],
      ['भुगतान करें और «भुगतान हुआ» दबाएँ', 'El Dorado में दिखे खाते में <b>{m}</b> से भुगतान करें। लौटकर <b>भुगतान हुआ</b> दबाएँ।', 'सिर्फ़ El Dorado में दिखे खाते में भुगतान करें।'],
      ['OROLADO को भेजें', 'USDT आने पर: <b>वॉलेट → निकालें</b>। OROLADO पता पेस्ट करें, <b>Tron (TRC-20)</b> नेटवर्क चुनें और पुष्टि करें।', 'नेटवर्क Tron (TRC-20) होना चाहिए। दूसरा नेटवर्क = पैसा खोया।'],
      ['हो गया', 'कुछ मिनट में OROLADO बैलेंस अपने आप बढ़ेगा।', 'अगली बार: सिर्फ़ कदम 2 से 5।']
    ]
  };
  T.zh = {
    nowB: '现在', cpd: '地址已复制', paste: '已复制：粘贴到 {s}', paidQ: '已付款？余额几分钟内自动到账。不确定？看视频。',
    dep: '充值', howMuch: '你想充值多少？', rec: '建议 20 $ 以上：手续费占比更小。',
    s1t: '复制你的 OROLADO 地址', s1p: '只属于你。24 小时有效。', making: '正在生成地址…',
    copy: '复制', copied: '已复制 ✓', toastCopy: '地址已复制', retry: '重试',
    net: '始终使用 <b>Tron (TRC-20)</b> 网络。其他网络 = 资金丢失。',
    s2tG: '用 {m} 支付比索', s2tGc: '用银行卡支付', s2tE: '用 {m} 支付',
    s2pG: '将打开 <b>Guardarian</b>。购买 <b>{a} USDT</b> 并粘贴你的地址。只需邮箱，无需账户。',
    s2pE: '将打开 <b>El Dorado</b>。用 {m} 购买 <b>{a} USDT</b> 并发送到你的地址。',
    goG: '用 {m} 支付', goGc: '用卡支付', goE: '打开 El Dorado',
    tagG: '无需账户 · 无需应用', tagE: '首次：用 {id} 注册 2 分钟',
    video: '看视频', steps: '分步说明',
    s3t: '完成：自动到账', s3p: '余额几分钟内自动增加。',
    wait: '等待你的充值…', alt: '其他方式（银行卡、Mobile Money）',
    step: '第 {i}/{n} 步', back: '返回', next: '下一步', finish: '明白了',
    fee: '约费用：{f}', feeE: '≈ 1.5 $（P2P 0.49 $ + 发送 0.99 $）', feeG: '已含在 Guardarian 价格中',
    pause: '暂停', play: '播放', again: '再看一次', yourCur: '你的货币',
    G: [
      ['点「{go}」', '<b>Guardarian</b> 在浏览器中打开。无需下载。', '打不开？在浏览器输入 guardarian.com。'],
      ['选择购买内容', '上方：<b>用 {cur} 支付</b>。下方：<b>收到 USDT · TRC20</b>。输入金额（{a} $）并点<b>购买</b>。', '确认 USDT 旁边写着 <b>TRC20</b>。'],
      ['输入邮箱', '输入邮箱和收到的 6 位验证码。不需要手机号。', '也看看垃圾邮件。'],
      ['粘贴 OROLADO 地址', '在「钱包地址」长按，点<b>粘贴</b>。地址以 <b>T</b> 开头。', '没复制？回到 OROLADO 点复制。'],
      ['用 {m} 支付', '{payG}', 'Guardarian 有时需要证件照片。这很正常，只需一次。'],
      ['完成', 'Guardarian 把 USDT 发送到 OROLADO。几分钟后余额增加。', '可以关闭 Guardarian。OROLADO 会通知你。']
    ],
    payGspei: 'Guardarian 会显示 <b>CLABE</b> 和准确金额。打开银行应用，用 SPEI 转账这个准确金额。',
    payGcard: '输入卡信息，或点 Apple Pay / Google Pay，然后确认。',
    E: [
      ['创建账户（仅首次）', '点「打开 El Dorado」。用邮箱和 <b>{id}</b> 照片注册。约 2 分钟。', '之后不用再做。'],
      ['进入 P2P', '点 <b>P2P</b> 并选择：<b>我有 {cur}，想要 USDT</b>。输入：<b>{a2} USDT</b>。', '买 {a2} USDT，足够支付发送费。'],
      ['选择 {m} 和卖家', '选 <b>{m}</b>。点一个成交多、评分好（★）的卖家，再点<b>购买 USDT</b>。', '选成交次数多的卖家。'],
      ['付款并点「已付款」', '用 <b>{m}</b> 付款到 El Dorado 显示的账户。回来点<b>已付款</b>。', '只付款到 El Dorado 显示的账户。'],
      ['发送到 OROLADO', 'USDT 到账后：<b>钱包 → 提取</b>。粘贴 OROLADO 地址，选择 <b>Tron (TRC-20)</b> 网络并确认。', '网络必须是 Tron (TRC-20)。其他网络 = 资金丢失。'],
      ['完成', '几分钟后 OROLADO 余额自动增加。', '下次：只需第 2 到 5 步。']
    ]
  };
  ['de', 'ru', 'tr', 'vi', 'id', 'ar', 'hi', 'zh'].forEach(function (k) { T[k].ui = T.en.ui; });
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
  function payWord(w) { var m = PAYW[w], l = lang(); return (m && (m[l] || (l !== 'es' && m.en))) || w; }
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
    '#oroLatam .la-st.cur{border-color:#F59E0B;box-shadow:0 0 0 3px rgba(245,158,11,.18),0 8px 22px rgba(0,0,0,.35)}' +
    '#oroLatam .la-st.next{opacity:.55}' +
    '#oroLatam .la-st.next .la-n{background:#2a3247;color:#cbd5e1}' +
    '#oroLatam .la-st.done{border-color:rgba(16,185,129,.45);padding-top:7px;padding-bottom:7px;align-items:center}' +
    '#oroLatam .la-c1{display:flex;align-items:center;gap:8px}' +
    '#oroLatam .la-c1 h4{margin:0;flex:1;min-width:0;color:#6EE7B7;font-size:13.5px}' +
    '#oroLatam .la-c1 code{font-family:ui-monospace,Menlo,Consolas,monospace;font-size:11px;color:#94A3B8;white-space:nowrap}' +
    '#oroLatam .la-c1 .la-cp{padding:6px 10px;font-size:12px}' +
    '#oroLatam .la-now{display:inline-block;margin-left:7px;vertical-align:2px;font-style:normal;font-size:10.5px;font-weight:900;letter-spacing:.04em;text-transform:uppercase;background:#F59E0B;color:#111827;border-radius:999px;padding:2px 7px;animation:laNow 1.8s ease-in-out infinite}' +
    '@keyframes laNow{50%{transform:scale(1.08)}}' +
    '#oroLatam .la-paste{display:block;margin-top:6px;font-size:12px;color:#fde68a;font-weight:700;text-align:center}' +
    '#oroLatam .la-how.pulse{animation:laPulse 1.6s ease-in-out infinite}' +
    '@keyframes laPulse{50%{box-shadow:0 0 0 4px rgba(245,158,11,.25)}}' +
    '#oroLatam .la-c{flex:1;min-width:0}' +
    '#oroLatam .la-c h4{margin:0 0 3px;font-size:14.5px;line-height:1.25}' +
    '#oroLatam .la-c p{margin:0;font-size:12.5px;color:#94A3B8;line-height:1.35}' +
    '#oroLatam .la-c p b{color:#F8FAFC}' +
    '#oroLatam .la-adr{margin-top:7px;display:flex;gap:6px;align-items:stretch}' +
    '#oroLatam .la-adr code,#oroLatam .la-ph .in,#oroLatam .la-c1 code{direction:ltr;unicode-bidi:isolate}' +
    '#oroLatam .la-ph{direction:ltr}' +
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
    '@media (prefers-reduced-motion:reduce){#oroLatam .la-dot,#oroLatam .la-fg,#oroLatam .la-now,#oroLatam .la-how.pulse{animation:none}}';

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
    // 2026-10-25 (propriétaire : « mieux le conduire ») : une étape à la fois — l'étape à faire brille (badge
    // « Ahora »), celle faite passe au vert et se replie, la suivante reste en retrait.
    var ph = st.went ? 3 : (st.copied ? 2 : 1);
    var cls = function (n) { return n < ph ? 'ok' : (n === ph ? 'on cur' : 'next'); };
    var now = '<em class="la-now">' + t.nowB + '</em>';
    var s1 = ph > 1
      ? '<div class="la-st ok done"><div class="la-n">✓</div><div class="la-c la-c1"><h4>' + t.cpd + '</h4><code>' + esc(st.addr.slice(0, 6) + '…' + st.addr.slice(-4)) + '</code><button class="la-btn la-cp" data-act="copy">' + t.copy + '</button></div></div>'
      : '<div class="la-st ' + cls(1) + '"><div class="la-n">1</div><div class="la-c"><h4>' + t.s1t + now + '</h4><p>' + t.s1p + '</p>' +
        '<div class="la-adr">' + adr + '</div><div class="la-warn"><span>⚠️</span><span>' + t.net + '</span></div></div></div>';
    var s3 = '<div class="la-st ' + cls(3) + '"><div class="la-n">3</div><div class="la-c"><h4>' + t.s3t + (ph === 3 ? now : '') + '</h4>' +
        (ph === 3 ? '<p>' + t.paidQ + '</p>' : '') +
        '<div class="la-wait"><span class="la-dot"></span>' + t.wait + '</div></div></div>';
    return head(t.dep, false, testSel()) + '<div class="la-bd la-p' + ph + '">' +
      '<div class="la-cty"><span class="fl">' + flag(st.cc) + '</span><span class="la-pays">' + c.pays.map(function (x) { return '<span>' + esc(payWord(x)) + '</span>'; }).join('') + '</span></div>' +
      '<div class="la-lb">' + t.howMuch + '</div><div class="la-chips">' +
        [10, 20, 50, 100].map(function (a) { return '<button data-act="amt" data-a="' + a + '" class="' + (a === st.amt ? 'on' : '') + '">' + a + ' $</button>'; }).join('') +
      '</div><div class="la-nt">' + t.rec + (c.s === 'E' ? ' ' + fill(t.fee, { f: t.feeE }) : '') + '</div>' +
      s1 +
      '<div class="la-st ' + cls(2) + '"><div class="la-n">2</div><div class="la-c"><h4>' + fill(s2t, d) + (ph === 2 ? now : '') + '</h4><p>' + fill(s2p, d) + '</p>' +
        '<a class="la-go" data-act="go" href="' + site.url + '" target="_blank" rel="noopener">' + esc(d.go) + ' →</a>' +
        (ph === 2 ? '<span class="la-paste">📋 ' + fill(t.paste, { s: site.name }) + '</span>' : '') +
        '<div class="la-row2"><button class="la-how vid' + (seenVideo() ? '' : ' pulse') + '" data-act="video">▶ ' + t.video + '</button><button class="la-how" data-act="guide">☰ ' + t.steps + '</button></div>' +
        '<span class="la-tag">' + fill(tag, d) + '</span></div></div>' +
      s3 +
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
      : '<div class="la-nav">' + (i > 0 ? '<button class="la-back" data-act="prev">' + (lang() === 'ar' ? '→ ' : '← ') + t.back + '</button>' : '') +
        '<button class="la-next" data-act="next">' + (i < arr.length - 1 ? t.next + (lang() === 'ar' ? ' ←' : ' →') : t.finish + ' ✓') + '</button></div>';
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
    root.dir = lang() === 'ar' ? 'rtl' : 'ltr';
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

  function seenVideo() { try { return localStorage.getItem('oro_la_vid') === '1'; } catch (e) { return false; } }
  // Bouton orange : copie l'adresse AVANT d'ouvrir le site (le joueur n'a plus qu'à la coller).
  function goPay() {
    if (st.addr) {
      try { if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(st.addr).catch(function () { /* ignore */ }); } catch (e) { /* ignore */ }
      if (!st.copied) toast(L().toastCopy);
      st.copied = true;
    }
    st.went = true;
    setTimeout(render, 300);
  }
  function onVisible() { if (root && !document.hidden && st.went && st.view === 'dep') render(); }

  function close() {
    document.removeEventListener('visibilitychange', onVisible);
    clearTimeout(st.demoT);
    if (root && root.parentNode) root.parentNode.removeChild(root);
    root = null;
  }

  function onClick(e) {
    var el = e.target.closest ? e.target.closest('[data-act]') : null;
    if (!el || el.tagName === 'SELECT') return;
    var act = el.getAttribute('data-act');
    if (act === 'go') { goPay(); return; }
    if (act === 'close') close();
    else if (act === 'home') { st.view = 'dep'; st.demoOn = false; clearTimeout(st.demoT); render(); }
    else if (act === 'amt') { st.amt = Number(el.getAttribute('data-a')) || 20; render(); }
    else if (act === 'copy') copyAddr();
    else if (act === 'retry') { st.addr = ''; render(); loadAddr(); }
    else if (act === 'guide') { st.view = 'guide'; st.step = 0; render(); }
    else if (act === 'video') { try { localStorage.setItem('oro_la_vid', '1'); } catch (eV) { /* ignore */ } st.view = 'demo'; st.demoI = 0; st.demoOn = true; render(); demoTick(); }
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
    st.view = 'dep'; st.step = 0; st.copied = false; st.went = false; st.addr = ''; st.addrErr = '';
    document.addEventListener('visibilitychange', onVisible);
    root = document.createElement('div');
    root.id = 'oroLatam';
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-modal', 'true');
    root.addEventListener('click', onClick);
    root.addEventListener('change', function (e) {
      if (e.target && e.target.getAttribute('data-act') === 'cty') { st.cc = e.target.value; st.view = 'dep'; st.copied = false; st.went = false; render(); }
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
