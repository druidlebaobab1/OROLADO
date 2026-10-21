/* v2900 — "You're in control" group 9 (owner request, round 5 games: racing & reflexes) — MOTO WHEELIE, DRIFT KING, HORSE JUMPER and SKATE TRICKS.
   Original names and drawings. MIXED MODE like every "You're in control" game: the multiplier follows the SERVER clock
   (×e^(rate·s), casino_ext.php 'skill', casino_ext/skill9.php rate 0.03 → ×2 after ~23 s), the gold button cashes out, a mistake
   loses (K.multi 'fail'), and the server's secret end arrives as an unavoidable event. ONE gesture per game, canvas 2D,
   sprites pre-drawn once per size, DPR ≤ 2, one RAF, pauses when hidden. Same engine as js/games/skill8.js (copied: each
   module file stands alone) + a "hold" gesture (finger down / up, Space on PC). This file only draws: the server decides and pays. */
(function (D6) {
  'use strict';
  var K = D6.CasinoKit;
  if (!K) return;
  var $ = K.$, TAU = Math.PI * 2;

  /* ------------------------------------------------------------------ texts (12 languages) */
  var C = {
    en: { go: 'Place a bet to start', bet: 'Bet', cash: 'Cash out', won: 'Cashed out', r1: 'Bet and play: the multiplier grows while you play.', r3: 'The round can also end at any random moment (like Aviator): cash out before!' },
    fr: { go: 'Placez une mise pour commencer', bet: 'Miser', cash: 'Encaisser', won: 'Encaissé', r1: 'Mise et joue : le multiplicateur monte pendant que tu joues.', r3: 'La partie peut aussi s’arrêter à tout moment, au hasard (comme Aviator) : encaisse avant !' },
    es: { go: 'Haz una apuesta para empezar', bet: 'Apostar', cash: 'Retirar', won: 'Retirado', r1: 'Apuesta y juega: el multiplicador sube mientras juegas.', r3: 'La ronda también puede terminar en cualquier momento al azar (como Aviator): ¡retira antes!' },
    pt: { go: 'Faça uma aposta para começar', bet: 'Apostar', cash: 'Sacar', won: 'Sacado', r1: 'Aposte e jogue: o multiplicador sobe enquanto você joga.', r3: 'A rodada também pode terminar a qualquer momento, ao acaso (como no Aviator): saque antes!' },
    ar: { go: 'ضع رهانًا للبدء', bet: 'راهن', cash: 'اسحب', won: 'تم السحب', r1: 'راهن والعب: يرتفع المضاعف أثناء لعبك.', r3: 'قد تنتهي الجولة أيضًا في أي لحظة عشوائية (مثل Aviator): اسحب قبلها!' },
    tr: { go: 'Başlamak için bahis yapın', bet: 'Bahis', cash: 'Çek', won: 'Çekildi', r1: 'Bahis yap ve oyna: sen oynarken çarpan yükselir.', r3: 'Tur her an rastgele de bitebilir (Aviator gibi): önce çek!' },
    vi: { go: 'Đặt cược để bắt đầu', bet: 'Cược', cash: 'Rút tiền', won: 'Đã rút', r1: 'Đặt cược và chơi: hệ số nhân tăng khi bạn chơi.', r3: 'Ván cũng có thể kết thúc ngẫu nhiên bất cứ lúc nào (như Aviator): hãy rút trước!' },
    id: { go: 'Pasang taruhan untuk mulai', bet: 'Pasang', cash: 'Tarik', won: 'Ditarik', r1: 'Pasang dan main: pengali naik selama kamu bermain.', r3: 'Ronde juga bisa berakhir kapan saja secara acak (seperti Aviator): tarik sebelumnya!' },
    ru: { go: 'Сделайте ставку, чтобы начать', bet: 'Ставка', cash: 'Забрать', won: 'Забрано', r1: 'Сделай ставку и играй: множитель растёт, пока ты играешь.', r3: 'Раунд может закончиться и в любой случайный момент (как в Aviator): забери раньше!' },
    de: { go: 'Einsatz setzen, um zu starten', bet: 'Setzen', cash: 'Auszahlen', won: 'Ausgezahlt', r1: 'Setze und spiele: Der Multiplikator steigt, während du spielst.', r3: 'Die Runde kann auch jederzeit zufällig enden (wie bei Aviator): zahle vorher aus!' },
    hi: { go: 'शुरू करने के लिए दांव लगाएँ', bet: 'दांव', cash: 'कैश आउट', won: 'कैश आउट हुआ', r1: 'दांव लगाएँ और खेलें: खेलते समय गुणक बढ़ता है।', r3: 'राउंड किसी भी समय अचानक खत्म हो सकता है (Aviator की तरह): पहले कैश आउट करें!' },
    zh: { go: '下注即可开始', bet: '下注', cash: '兑现', won: '已兑现', r1: '下注并开始：游戏进行中倍数不断上升。', r3: '回合也可能在任意随机时刻结束（如 Aviator）：请提前兑现！' }
  };
  // per game: hint (gesture), fail (mistake), end (the secret end's event), rule (step 2 of the rules), [second mistake]
  var G = {
    motowheelie: {
      en: ['Hold to lift the front wheel', 'Front wheel down!', 'Oil slick!', 'Hold your finger down to open the throttle: the front wheel rises. Release to let it come down. Keep the needle in the green zone. The front wheel touching the road, or flipping over backwards, ends the round. Speed bumps kick the bike up.', 'Flipped over!'],
      fr: ['Maintiens pour lever la roue avant', 'Roue avant au sol !', 'Flaque d’huile !', 'Garde le doigt posé pour accélérer : la roue avant se lève. Lâche pour la laisser redescendre. Garde l’aiguille dans la zone verte. La roue avant qui touche la route, ou la moto qui bascule en arrière, termine la partie. Les dos-d’âne font sauter la moto.', 'Basculé en arrière !'],
      es: ['Mantén para levantar la rueda', '¡Rueda delantera al suelo!', '¡Mancha de aceite!', 'Mantén el dedo para acelerar: la rueda delantera sube. Suelta para que baje. Mantén la aguja en la zona verde. Si la rueda delantera toca la carretera, o la moto vuelca hacia atrás, termina la ronda. Los resaltos levantan la moto.', '¡Volcaste!'],
      pt: ['Segure para empinar a roda', 'Roda da frente no chão!', 'Mancha de óleo!', 'Segure o dedo para acelerar: a roda da frente sobe. Solte para ela descer. Mantenha o ponteiro na zona verde. A roda da frente tocar a pista, ou a moto virar para trás, encerra a rodada. As lombadas jogam a moto para cima.', 'Capotou!'],
      ar: ['اضغط لرفع العجلة الأمامية', 'العجلة الأمامية على الأرض!', 'بقعة زيت!', 'أبقِ إصبعك مضغوطًا لفتح الوقود: ترتفع العجلة الأمامية. أفلت لتنزل. أبقِ المؤشر في المنطقة الخضراء. لمس العجلة الأمامية للطريق أو انقلاب الدراجة للخلف ينهي الجولة. المطبات ترفع الدراجة.', 'انقلبت!'],
      tr: ['Ön tekeri kaldırmak için bas', 'Ön teker yere değdi!', 'Yağ birikintisi!', 'Gaz vermek için parmağını basılı tut: ön teker kalkar. Bırakınca iner. İbreyi yeşil bölgede tut. Ön tekerin yola değmesi ya da motorun geriye devrilmesi turu bitirir. Kasisler motoru zıplatır.', 'Devrildin!'],
      vi: ['Giữ để nâng bánh trước', 'Bánh trước chạm đất!', 'Vũng dầu!', 'Giữ ngón tay để tăng ga: bánh trước nâng lên. Thả ra để hạ xuống. Giữ kim trong vùng xanh. Bánh trước chạm đường, hoặc xe lật ra sau, là kết thúc ván. Gờ giảm tốc làm xe bật lên.', 'Lật xe!'],
      id: ['Tahan untuk mengangkat roda depan', 'Roda depan menyentuh jalan!', 'Tumpahan oli!', 'Tahan jarimu untuk menarik gas: roda depan terangkat. Lepas agar turun. Jaga jarum di zona hijau. Roda depan menyentuh jalan, atau motor terjungkal ke belakang, mengakhiri ronde. Polisi tidur membuat motor terangkat.', 'Terjungkal!'],
      ru: ['Держи — переднее колесо вверх', 'Колесо опустилось!', 'Масляное пятно!', 'Держи палец, чтобы дать газ: переднее колесо поднимается. Отпусти — оно опускается. Держи стрелку в зелёной зоне. Переднее колесо на дороге или опрокидывание назад завершает раунд. Лежачие полицейские подбрасывают мотоцикл.', 'Перевернулся!'],
      de: ['Halten hebt das Vorderrad', 'Vorderrad unten!', 'Ölfleck!', 'Halte den Finger gedrückt, um Gas zu geben: Das Vorderrad hebt sich. Lass los, damit es sinkt. Halte die Nadel im grünen Bereich. Berührt das Vorderrad die Straße oder kippt das Motorrad nach hinten, endet die Runde. Bodenwellen heben das Motorrad an.', 'Überschlagen!'],
      hi: ['आगे का पहिया उठाने को दबाएँ', 'आगे का पहिया नीचे!', 'तेल का धब्बा!', 'गैस देने के लिए उँगली दबाए रखें: आगे का पहिया उठता है। छोड़ें तो नीचे आता है। सुई को हरे हिस्से में रखें। आगे का पहिया सड़क छू जाए या बाइक पीछे पलट जाए तो राउंड खत्म। स्पीड ब्रेकर बाइक को उछालते हैं।', 'पलट गए!'],
      zh: ['按住抬起前轮', '前轮落地了！', '油渍！', '按住手指加油门：前轮抬起。松开让它落下。让指针保持在绿色区域。前轮碰到路面，或摩托向后翻倒，本回合结束。减速带会让摩托弹起。', '向后翻倒了！']
    },
    driftking: {
      en: ['Hold to drift right, release to go left', 'Off the track!', 'Tyre blowout!', 'Your car races up a zigzag track. Hold your finger down to drift to the right, release to drift to the left: switch at every corner. The car slides a little, so turn a bit early. The track gets narrower and faster. Leaving the track ends the round.'],
      fr: ['Maintiens : à droite, lâche : à gauche', 'Sortie de piste !', 'Pneu éclaté !', 'Ta voiture fonce sur une piste en zigzag. Garde le doigt posé pour déraper à droite, lâche pour déraper à gauche : change à chaque virage. La voiture glisse un peu, tourne donc un peu avant. La piste devient plus étroite et plus rapide. Sortir de la piste termine la partie.'],
      es: ['Mantén: derecha; suelta: izquierda', '¡Fuera de pista!', '¡Reventón!', 'Tu coche corre por una pista en zigzag. Mantén el dedo para derrapar a la derecha y suelta para derrapar a la izquierda: cambia en cada curva. El coche patina un poco, así que gira un poco antes. La pista se estrecha y se acelera. Salirte de la pista termina la ronda.'],
      pt: ['Segure: direita; solte: esquerda', 'Saiu da pista!', 'Pneu estourado!', 'Seu carro corre por uma pista em zigue-zague. Segure o dedo para derrapar à direita e solte para derrapar à esquerda: troque em cada curva. O carro desliza um pouco, então vire um pouco antes. A pista fica mais estreita e rápida. Sair da pista encerra a rodada.'],
      ar: ['اضغط للانجراف يمينًا وأفلت لليسار', 'خرجت من المسار!', 'انفجر الإطار!', 'تنطلق سيارتك على مسار متعرج. أبقِ إصبعك مضغوطًا للانجراف يمينًا وأفلت للانجراف يسارًا: بدّل عند كل منعطف. السيارة تنزلق قليلًا فانعطف مبكرًا قليلًا. يضيق المسار ويزداد سرعة. الخروج من المسار ينهي الجولة.'],
      tr: ['Bas: sağa drift, bırak: sola', 'Pistten çıktın!', 'Lastik patladı!', 'Araban zikzak bir pistte yükselir. Sağa drift için parmağını basılı tut, sola drift için bırak: her virajda değiştir. Araba biraz kayar, biraz erken dön. Pist daralır ve hızlanır. Pistten çıkmak turu bitirir.'],
      vi: ['Giữ để drift phải, thả để sang trái', 'Văng khỏi đường!', 'Nổ lốp!', 'Xe của bạn lao trên đường zíc zắc. Giữ ngón tay để drift sang phải, thả ra để drift sang trái: đổi ở mỗi khúc cua. Xe trượt một chút nên hãy rẽ sớm hơn. Đường hẹp và nhanh dần. Văng khỏi đường là kết thúc ván.'],
      id: ['Tahan: drift kanan, lepas: kiri', 'Keluar lintasan!', 'Ban meletus!', 'Mobilmu melaju di lintasan zigzag. Tahan jarimu untuk drift ke kanan, lepas untuk drift ke kiri: ganti di setiap tikungan. Mobil sedikit meluncur, jadi belok sedikit lebih awal. Lintasan makin sempit dan cepat. Keluar lintasan mengakhiri ronde.'],
      ru: ['Держи — дрифт вправо, отпусти — влево', 'Вылет с трассы!', 'Лопнула шина!', 'Машина мчится по трассе-зигзагу. Держи палец — дрифт вправо, отпусти — дрифт влево: переключай на каждом повороте. Машину немного заносит, поворачивай чуть раньше. Трасса становится уже и быстрее. Вылет с трассы завершает раунд.'],
      de: ['Halten: rechts driften, loslassen: links', 'Von der Strecke!', 'Reifenplatzer!', 'Dein Auto rast eine Zickzack-Strecke hinauf. Halte den Finger gedrückt, um nach rechts zu driften, lass los, um nach links zu driften: wechsle in jeder Kurve. Das Auto rutscht etwas, lenke also etwas früher. Die Strecke wird schmaler und schneller. Verlässt du die Strecke, endet die Runde.'],
      hi: ['दबाएँ: दाएँ ड्रिफ्ट, छोड़ें: बाएँ', 'ट्रैक से बाहर!', 'टायर फटा!', 'आपकी कार टेढ़े-मेढ़े ट्रैक पर दौड़ती है। दाएँ ड्रिफ्ट के लिए उँगली दबाए रखें, बाएँ के लिए छोड़ें: हर मोड़ पर बदलें। कार थोड़ा फिसलती है, इसलिए थोड़ा पहले मुड़ें। ट्रैक पतला और तेज़ होता जाता है। ट्रैक से बाहर गए तो राउंड खत्म।'],
      zh: ['按住向右漂移，松开向左', '冲出赛道！', '爆胎了！', '你的赛车在之字形赛道上飞驰。按住手指向右漂移，松开向左漂移：每个弯道切换一次。赛车会稍微滑行，所以要提前一点转向。赛道会越来越窄、越来越快。冲出赛道，本回合结束。']
    },
    horsejump: {
      en: ['Hold to charge, release to jump', 'Knocked the fence!', 'The horse is spooked!', 'Your horse gallops by itself. Hold your finger down to charge the jump (the gauge fills), release to jump. Tall fences need a strong jump, wide water needs a long one, and the timing matters. Touching a fence or landing in the water ends the round.', 'Splash in the water!'],
      fr: ['Maintiens pour charger, lâche pour sauter', 'Barre tombée !', 'Le cheval prend peur !', 'Ton cheval galope tout seul. Garde le doigt posé pour charger le saut (la jauge se remplit), lâche pour sauter. Les hautes barres demandent un saut puissant, l’eau large un saut long, et le bon moment compte. Toucher une barre ou tomber dans l’eau termine la partie.', 'Plouf dans l’eau !'],
      es: ['Mantén para cargar, suelta para saltar', '¡Derribaste la valla!', '¡El caballo se asusta!', 'Tu caballo galopa solo. Mantén el dedo para cargar el salto (la barra se llena) y suelta para saltar. Las vallas altas piden un salto fuerte, el agua ancha uno largo, y el momento importa. Tocar una valla o caer al agua termina la ronda.', '¡Al agua!'],
      pt: ['Segure para carregar, solte para saltar', 'Derrubou a barra!', 'O cavalo se assusta!', 'Seu cavalo galopa sozinho. Segure o dedo para carregar o salto (a barra enche) e solte para saltar. Obstáculos altos pedem um salto forte, a água larga um salto longo, e o momento importa. Tocar um obstáculo ou cair na água encerra a rodada.', 'Caiu na água!'],
      ar: ['اضغط للشحن وأفلت للقفز', 'أسقطت الحاجز!', 'الحصان فزع!', 'يعدو حصانك وحده. أبقِ إصبعك مضغوطًا لشحن القفزة (يمتلئ المؤشر) وأفلت للقفز. الحواجز العالية تحتاج قفزة قوية والماء العريض قفزة طويلة، والتوقيت مهم. لمس الحاجز أو السقوط في الماء ينهي الجولة.', 'سقطت في الماء!'],
      tr: ['Doldurmak için bas, zıplamak için bırak', 'Engeli devirdin!', 'At ürktü!', 'Atın kendi dörtnala koşar. Atlayışı doldurmak için parmağını basılı tut (gösterge dolar), atlamak için bırak. Yüksek engeller güçlü, geniş su uzun bir atlayış ister; zamanlama önemlidir. Engele değmek ya da suya düşmek turu bitirir.', 'Suya düştün!'],
      vi: ['Giữ để tích lực, thả để nhảy', 'Đổ rào!', 'Ngựa hoảng sợ!', 'Ngựa tự phi nước đại. Giữ ngón tay để tích lực nhảy (thanh đầy dần), thả ra để nhảy. Rào cao cần cú nhảy mạnh, hố nước rộng cần cú nhảy xa, và thời điểm rất quan trọng. Chạm rào hoặc rơi xuống nước là kết thúc ván.', 'Rơi xuống nước!'],
      id: ['Tahan untuk mengisi, lepas untuk lompat', 'Palang jatuh!', 'Kudanya kaget!', 'Kudamu berlari sendiri. Tahan jarimu untuk mengisi lompatan (meteran terisi), lepas untuk melompat. Pagar tinggi butuh lompatan kuat, air lebar butuh lompatan jauh, dan waktunya penting. Menyentuh pagar atau jatuh ke air mengakhiri ronde.', 'Tercebur ke air!'],
      ru: ['Держи — заряд, отпусти — прыжок', 'Сбил барьер!', 'Лошадь испугалась!', 'Лошадь скачет сама. Держи палец, чтобы зарядить прыжок (шкала заполняется), отпусти — прыжок. Высокие барьеры требуют сильного прыжка, широкая вода — длинного, и момент важен. Касание барьера или падение в воду завершает раунд.', 'Плюх в воду!'],
      de: ['Halten lädt, loslassen springt', 'Stange gerissen!', 'Das Pferd scheut!', 'Dein Pferd galoppiert von selbst. Halte den Finger gedrückt, um den Sprung aufzuladen (die Anzeige füllt sich), lass los zum Springen. Hohe Hindernisse brauchen einen kräftigen Sprung, breites Wasser einen weiten, und der Zeitpunkt zählt. Berührst du ein Hindernis oder landest im Wasser, endet die Runde.', 'Platsch ins Wasser!'],
      hi: ['चार्ज करने को दबाएँ, कूदने को छोड़ें', 'बाड़ गिरा दी!', 'घोड़ा डर गया!', 'आपका घोड़ा खुद दौड़ता है। छलाँग चार्ज करने के लिए उँगली दबाए रखें (मीटर भरता है), कूदने के लिए छोड़ें। ऊँची बाड़ को ताकतवर और चौड़े पानी को लंबी छलाँग चाहिए, और समय मायने रखता है। बाड़ छूने या पानी में गिरने पर राउंड खत्म।', 'पानी में छपाक!'],
      zh: ['按住蓄力，松开起跳', '碰倒栏杆了！', '马受惊了！', '你的马会自己奔跑。按住手指为跳跃蓄力（能量条会充满），松开起跳。高栏需要有力的跳跃，宽水沟需要跳得远，时机也很重要。碰到栏杆或落入水中，本回合结束。', '掉进水里了！']
    },
    skatetricks: {
      en: ['Tap when the ring closes on the edge', 'Bail!', 'Board snapped!', 'Your skater rides the half-pipe from edge to edge. A ring shrinks on the next edge: tap the moment it closes to pop a trick. The rides get faster and the timing tighter. Missing an edge, or tapping too early, ends the round.', 'Too early!'],
      fr: ['Touche quand l’anneau se ferme sur le bord', 'Chute !', 'Planche cassée !', 'Ton skateur roule d’un bord à l’autre de la rampe. Un anneau rétrécit sur le prochain bord : touche au moment où il se ferme pour lancer une figure. Ça va de plus en plus vite et le timing se resserre. Rater un bord, ou toucher trop tôt, termine la partie.', 'Trop tôt !'],
      es: ['Toca cuando el anillo se cierre en el borde', '¡Caída!', '¡Tabla rota!', 'Tu skater recorre el half-pipe de borde a borde. Un anillo se encoge en el siguiente borde: toca justo cuando se cierre para hacer un truco. Cada vez va más rápido y el tiempo es más justo. Fallar un borde, o tocar demasiado pronto, termina la ronda.', '¡Demasiado pronto!'],
      pt: ['Toque quando o anel fechar na borda', 'Tombo!', 'Shape quebrado!', 'Seu skatista anda no half-pipe de borda a borda. Um anel encolhe na próxima borda: toque quando ele fechar para fazer uma manobra. Fica cada vez mais rápido e o tempo mais curto. Errar uma borda, ou tocar cedo demais, encerra a rodada.', 'Cedo demais!'],
      ar: ['المس عندما تنغلق الحلقة على الحافة', 'سقوط!', 'انكسر اللوح!', 'يتزلج المتزلج على المنحدر من حافة إلى أخرى. تتقلص حلقة على الحافة التالية: المس لحظة انغلاقها لتنفيذ حركة. تزداد السرعة ويضيق التوقيت. تفويت حافة أو اللمس مبكرًا جدًا ينهي الجولة.', 'مبكر جدًا!'],
      tr: ['Halka kenarda kapanınca dokun', 'Düştün!', 'Kaykay kırıldı!', 'Kaykaycın rampada kenardan kenara gider. Sonraki kenarda bir halka küçülür: figür için halka kapandığı an dokun. Gittikçe hızlanır ve zamanlama daralır. Bir kenarı kaçırmak ya da çok erken dokunmak turu bitirir.', 'Çok erken!'],
      vi: ['Chạm khi vòng khép lại ở mép', 'Té ngã!', 'Gãy ván!', 'Vận động viên trượt trên máng từ mép này sang mép kia. Một vòng tròn thu nhỏ ở mép tiếp theo: chạm đúng lúc nó khép lại để làm động tác. Ngày càng nhanh và thời điểm càng khắt khe. Lỡ một mép, hoặc chạm quá sớm, là kết thúc ván.', 'Quá sớm!'],
      id: ['Ketuk saat cincin menutup di tepi', 'Jatuh!', 'Papan patah!', 'Pemain skate meluncur di half-pipe dari tepi ke tepi. Sebuah cincin mengecil di tepi berikutnya: ketuk saat cincin menutup untuk melakukan trik. Makin cepat dan waktunya makin ketat. Melewatkan tepi, atau mengetuk terlalu cepat, mengakhiri ronde.', 'Terlalu cepat!'],
      ru: ['Тап, когда кольцо сомкнётся на краю', 'Падение!', 'Доска сломалась!', 'Скейтер катается по рампе от края до края. На следующем краю сжимается кольцо: нажми в момент, когда оно сомкнётся, — будет трюк. Всё быстрее, а тайминг всё точнее. Пропущенный край или слишком ранний тап завершает раунд.', 'Слишком рано!'],
      de: ['Tippen, wenn sich der Ring an der Kante schließt', 'Sturz!', 'Brett gebrochen!', 'Dein Skater fährt die Halfpipe von Kante zu Kante. Ein Ring schrumpft an der nächsten Kante: tippe genau, wenn er sich schließt, für einen Trick. Es wird schneller und das Timing enger. Eine verpasste Kante oder zu frühes Tippen beendet die Runde.', 'Zu früh!'],
      hi: ['किनारे पर रिंग बंद हो तब टैप करें', 'गिर गए!', 'बोर्ड टूट गया!', 'आपका स्केटर हाफ़-पाइप पर एक किनारे से दूसरे तक जाता है। अगले किनारे पर एक रिंग छोटी होती है: ट्रिक के लिए ठीक उसके बंद होने पर टैप करें। रफ़्तार बढ़ती है और समय कम होता है। किनारा छूटा, या बहुत जल्दी टैप किया, तो राउंड खत्म।', 'बहुत जल्दी!'],
      zh: ['圆环在边缘合拢时点击', '摔倒了！', '滑板断了！', '你的滑手在U型池里从一边滑到另一边。下一个边缘上会有圆环缩小：在它合拢的瞬间点击即可做出花式动作。速度越来越快，时机越来越紧。错过边缘或点得太早，本回合结束。', '太早了！']
    }
  };
  function L(key) {
    var lg = K.lang(), c = Object.assign({}, C.en, C[lg] || {}), g = (G[key][lg] || G[key].en);
    c.hint = g[0]; c.fail = g[1]; c.end = g[2]; c.fail2 = g[4] || g[1];
    return c;
  }
  function rules(key) {
    var o = {};
    Object.keys(C).forEach(function (lg) { var g = G[key][lg] || G[key].en; o[lg] = '1. ' + C[lg].r1 + '\n2. ' + g[3] + '\n3. ' + C[lg].r3; });
    return o;
  }

  /* ------------------------------------------------------------------ small drawing helpers */
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function pick(a) { return a[(Math.random() * a.length) | 0]; }
  function ease(k) { return 1 - Math.pow(1 - clamp(k, 0, 1), 3); }
  function num(v) { return Number(v).toFixed(2).replace('.', K.dec()); }
  function xm(v) { return '⁦×' + num(v) + '⁩'; }
  function money(v) { return '⁦$ ' + K.m2(v).replace('.', K.dec()) + '⁩'; }
  // pre-rendered sprite (drawn once, then drawImage: cheap on old phones)
  function mkc(w, h, dpr, fn) {
    var c = document.createElement('canvas');
    c.width = Math.max(1, Math.ceil(w * dpr)); c.height = Math.max(1, Math.ceil(h * dpr));
    var x = c.getContext('2d'); x.scale(dpr, dpr); fn(x, w, h);
    c.w = w; c.h = h;
    return c;
  }
  function lg(c, x0, y0, x1, y1, st) { var g = c.createLinearGradient(x0, y0, x1, y1); st.forEach(function (s, i) { g.addColorStop(i / (st.length - 1), s); }); return g; }
  function rg(c, x, y, r, st, fx, fy) { var g = c.createRadialGradient(x + (fx || 0), y + (fy || 0), r * 0.05, x, y, r); st.forEach(function (s, i) { g.addColorStop(i / (st.length - 1), s); }); return g; }
  function circ(c, x, y, r, fill) { c.fillStyle = fill; c.beginPath(); c.arc(x, y, Math.max(0, r), 0, TAU); c.fill(); }
  function rr(c, x, y, w, h, r) { r = Math.max(0, Math.min(r, w / 2, h / 2)); c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
  function stars(c, W, H, n, y0, y1) {
    y0 = y0 || 0; y1 = y1 || H;
    for (var i = 0; i < n; i++) {
      var r = Math.random(); c.globalAlpha = 0.25 + Math.random() * 0.75;
      c.fillStyle = r > 0.92 ? '#FDE68A' : r > 0.82 ? '#C4B5FD' : '#fff';
      var s = r > 0.96 ? 2 : r > 0.7 ? 1.3 : 0.9; c.fillRect(Math.random() * W, y0 + Math.random() * (y1 - y0), s, s);
    }
    c.globalAlpha = 1;
  }
  function poly(c, pts, fill) { c.beginPath(); c.moveTo(pts[0], pts[1]); for (var i = 2; i < pts.length; i += 2) c.lineTo(pts[i], pts[i + 1]); c.closePath(); if (fill) { c.fillStyle = fill; c.fill(); } }
  // little sparkle star (4 points)
  function spark(c, x, y, r, col) { c.fillStyle = col; c.beginPath(); c.moveTo(x, y - r); c.quadraticCurveTo(x, y, x + r, y); c.quadraticCurveTo(x, y, x, y + r); c.quadraticCurveTo(x, y, x - r, y); c.quadraticCurveTo(x, y, x, y - r); c.fill(); }

  /* hand hint: tap = finger; aim = finger on a target; lr = arrows left / right; drag = finger sliding; swipe4 = 4 arrows */
  var FINGER = '<path d="M11 21V9.5a2 2 0 0 1 4 0V16m0-2a2 2 0 0 1 4 0v2m0-1a2 2 0 0 1 4 0v5c0 4.5-3 8-7.5 8H14c-2.4 0-4-1-5.3-2.9L6 23a2 2 0 0 1 3.2-2.4L11 23"/>';
  var HAND = {
    tap: '<svg viewBox="0 0 32 32" aria-hidden="true">' + FINGER + '</svg>',
    aim: '<svg viewBox="0 0 32 32" aria-hidden="true"><circle class="sk-tg" cx="13" cy="6" r="4.5"/><path class="sk-tg" d="M13 0v3M13 9v3M7 6h3M16 6h3"/>' + FINGER + '</svg>',
    lr: '<svg viewBox="0 0 32 32" aria-hidden="true"><path class="sk-arr" d="M1 9l5-4v8zM31 9l-5-4v8z"/>' + FINGER + '</svg>',
    drag: '<svg viewBox="0 0 32 32" aria-hidden="true"><path class="sk-arr" d="M1 9l5-4v8zM31 9l-5-4v8z"/>' + FINGER + '</svg>',
    hold: '<svg viewBox="0 0 32 32" aria-hidden="true"><circle class="sk-rip" cx="13" cy="9" r="7"/>' + FINGER + '</svg>',
    swipe4: '<svg viewBox="0 0 32 32" aria-hidden="true"><path class="sk-arr" d="M1 11l4.5-3.5v7zM31 11l-4.5-3.5v7zM13 0l3.5 4h-7z"/>' + FINGER + '</svg>'
  };

  /* ------------------------------------------------------------------ shared engine (round flow + canvas loop + gestures)
     A game object: size(W, H, u, dpr, top) · reset(live) · step(dt, live) · draw(ctx) · boom() (secret end) · win() ·
     act(k, x, y) for tap / aim / lr / swipe4 · down / move / up (x, y) for drag · dbg() (read by the touch tests only). */
  function boot(key, mk, gest, hy) {
    K.register(key, function (box) {
      var l = L(key), lite = document.documentElement.classList.contains('oro-lite'), hist = [];
      try { hist = JSON.parse(localStorage.getItem('cg_' + key + '_h') || '[]').slice(0, 12); } catch (e) { hist = []; }
      box.classList.add('cg-game', 'cg-s4', 'cg-' + key);
      box.style.setProperty('--hy', (hy || 0.45) * 100 + '%');
      box.innerHTML = '<div class="cg-stage s4-st idle" id="s4St"><canvas class="s4-bg" id="s4Bg"></canvas><canvas class="s4-cv" id="s4Cv"></canvas><div class="cg-hist s4-hist" id="s4Hist"></div>' +
        '<div class="s4-hud" id="s4Hud"><b class="fit s4-m idle" id="s4M">' + xm(1) + '</b><small class="fit s4-msg" id="s4Msg"></small></div>' +
        '<div class="sk-hint g-' + gest + '" id="s4Hint"><i class="sk-hand">' + HAND[gest] + '</i><small class="fit">' + K.esc(l.hint) + '</small></div></div>' + K.stakePanel(l.bet);
      K.bindStake(box);
      var st = $('s4St'), cv = $('s4Cv'), ctx = cv.getContext('2d'), btn = $('csGo'), mEl = $('s4M'), msgEl = $('s4Msg'), hud = $('s4Hud'), hintEl = $('s4Hint'), gN = 0, nudgeT = 0;
      var W = 0, H = 0, dpr = 1, rect = null, sized = false, fadeS = null, fadeH = 0, phase = 'idle', R = null, off = 0, busy = false, playT = 0, overT = 0, last = 0, drawn = false;
      var P = [], RG = [], shake = 0, flash = 0, mShown = '';
      var bgCv = $('s4Bg'), bgOn = null;
      // v2850: immersive audio (js/sfx.js amb / play, added by the audio round): harmless if the API is not there
      var ambOn = false, ambT = 0;
      var amb = function (on, k) { if (ambOn === on && !k) return; ambOn = on; try { if (D6.Sfx && D6.Sfx.amb) D6.Sfx.amb(key, on, on ? (k || 0.45) : 0); } catch (e) { /* ignore */ } };
      var sx = function (ev, o) { try { if (D6.Sfx && D6.Sfx.amb) D6.Sfx.play(ev, o || {}, key); } catch (e) { /* ignore */ } };
      var hintOn = function (on) { hintEl.classList.toggle('off', !on); st.classList.toggle('idle', phase === 'idle'); };
      var A = {
        l: l, lite: lite, sx: sx,
        // the static background lives in its own canvas behind the scene: painted once, never redrawn each frame
        bg: function (img) { if (bgOn === img) return; bgOn = img; bgCv.width = img.width; bgCv.height = img.height; bgCv.getContext('2d').drawImage(img, 0, 0); },
        lv: function () { return Math.min(1.25, playT / 110); },            // difficulty: fair at the start, really hard after ~2 min
        live: function () { return phase === 'play'; },
        idle: function () { return phase === 'idle' || phase === 'demo'; }, // the visitor's demo round = the attract autopilot
        fail: function (why) {                                              // the player's own mistake
          if (phase !== 'play') return false;
          phase = 'failing'; sx('fail'); amb(false); say(why || l.fail, 'lost'); setBtn(l.bet, '', 'wait'); btn.disabled = true;
          sendFail(); return true;
        },
        burst: function (x, y, n, cols, sp, life, sz, grav) {
          if ((phase === 'play' || phase === 'demo') && !A._xb) K.sfx('hit'); // v2832 : un bon coup (fruit coupé, brique, pièce…) sonne ; jamais l'explosion d'une erreur
          if (lite) n = Math.ceil(n / 3);
          for (var i = 0; i < n; i++) {
            if (P.length > 160) P.shift();
            var a = Math.random() * TAU, s = sp * rnd(0.25, 1);
            P.push({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, t: 0, m: (life || 0.7) * rnd(0.5, 1.2), c: cols[i % cols.length], r: (sz || 3) * rnd(0.6, 1.3), g: grav === undefined ? 40 : grav });
          }
        },
        ring: function (x, y, r, col) { RG.push({ x: x, y: y, r: r, t: 0, c: col || '#FDE68A' }); },
        explode: function (x, y, s) {
          s = s || 1;
          A._xb = 1;
          A.burst(x, y, 34, ['#FFF7ED', '#FDE68A', '#FB923C', '#F43F5E', '#C4B5FD'], 260 * s, 0.9, 3.4 * Math.sqrt(s));
          A._xb = 0;
          A.ring(x, y, 70 * s, '#FDBA74'); shake = Math.max(shake, 0.45); flash = Math.max(flash, 0.55);
        },
        shake: function (a) { shake = Math.max(shake, a); },
        flash: function (a) { flash = Math.max(flash, a); }
      };
      var g = mk(A);
      box._s4 = g; // read-only hook for the touch tests (scripts in /tmp); nothing reads it in the app

      function say(t, cls) { K.setText(msgEl, t || ''); mEl.classList.remove('won', 'lost', 'idle'); if (cls) mEl.classList.add(cls); }
      function tx(el, s) { if (el.textContent === s) return; if (el.textContent.length !== s.length) K.setText(el, s); else el.textContent = s; }
      function setBtn(main, sub, cls) {
        btn.classList.remove('cash', 'wait');
        if (cls) btn.classList.add(cls);
        if (sub) { btn.innerHTML = '<span class="fit s4-b1"></span><span class="fit s4-b2"></span>'; K.setText(btn.firstChild, main); K.setText(btn.lastChild, sub); }
        else { btn.innerHTML = '<span class="fit cg-gol"></span>'; K.setText(btn.firstChild, main); }
      }
      function paintHist() {
        $('s4Hist').innerHTML = hist.map(function (h) { var v = Math.abs(h); return '<i class="' + (h < 0 ? 'x' : v >= 10 ? 'hi' : v >= 2 ? 'mid' : 'lo') + '">' + xm(v) + '</i>'; }).join('');
      }
      function nowS() { return Date.now() / 1000 + off; }
      function mult() { return R ? Math.max(1, Math.floor(Math.exp(R.rate * Math.max(0, nowS() - R.t0)) * 100 + 1e-9) / 100) : 1; }

      function resize() {
        if (!box.isConnected) return;
        var r = st.getBoundingClientRect(), w = Math.round(r.width), h = Math.round(r.height);
        rect = r;
        if (!w || !h || (w === W && h === H)) return;
        W = w; H = h; dpr = lite ? 1 : Math.min(2, window.devicePixelRatio || 1);
        if (W * H * dpr * dpr > 2.6e6) dpr = Math.max(1, Math.sqrt(2.6e6 / (W * H))); // TV / big screens: at most ~2.6 M pixels
        cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
        var top = hud.offsetTop + mEl.offsetHeight + Math.max(22, msgEl.offsetHeight) + 10; // below the multiplier AND the status pill
        g.size(W, H, Math.min(W, H * 0.8) / 100, dpr, top);
        fadeH = Math.round(top * 0.8);
        fadeS = mkc(W, fadeH, dpr, function (c) { var q = c.createLinearGradient(0, 0, 0, fadeH); q.addColorStop(0, 'rgba(8,6,26,.55)'); q.addColorStop(1, 'rgba(8,6,26,0)'); c.fillStyle = q; c.fillRect(0, 0, W, fadeH); });
        if (!sized) { sized = true; if (phase === 'idle') g.reset(false); }
        drawn = false;
        frame(); // the scene appears at once (no black frame while waiting for the next animation frame)
      }
      var ro = null;
      if (window.ResizeObserver) { ro = new ResizeObserver(resize); ro.observe(st); } else window.addEventListener('resize', resize);

      function frame(dt) {
        if (!W) return;
        dt = dt || 0;
        var moving = phase !== 'idle' || !lite;
        if (moving && dt) g.step(dt, phase === 'play' || phase === 'cashing');
        for (var i = P.length - 1; i >= 0; i--) { var p = P[i]; p.t += dt; if (p.t >= p.m) { P.splice(i, 1); continue; } p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.985; p.vy = p.vy * 0.985 + p.g * dt; }
        for (i = RG.length - 1; i >= 0; i--) { RG[i].t += dt; if (RG[i].t > 0.6) RG.splice(i, 1); }
        shake = Math.max(0, shake - dt * 1.4); flash = Math.max(0, flash - dt * 2.2);
        var sx = shake ? (Math.random() - 0.5) * 16 * shake : 0, sy = shake ? (Math.random() - 0.5) * 16 * shake : 0;
        ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cv.width, cv.height);
        ctx.setTransform(dpr, 0, 0, dpr, sx * dpr, sy * dpr);
        g.draw(ctx);
        if (fadeS) ctx.drawImage(fadeS, -sx, -sy, W, fadeH);
        for (i = 0; i < P.length; i++) { p = P[i]; ctx.globalAlpha = 1 - p.t / p.m; ctx.fillStyle = p.c; ctx.fillRect(p.x - p.r / 2, p.y - p.r / 2, p.r, p.r); }
        for (i = 0; i < RG.length; i++) { var q = RG[i], k = q.t / 0.6; ctx.globalAlpha = 1 - k; ctx.strokeStyle = q.c; ctx.lineWidth = 4 * (1 - k) + 1; ctx.beginPath(); ctx.arc(q.x, q.y, q.r * ease(k), 0, TAU); ctx.stroke(); }
        ctx.globalAlpha = 1;
        if (flash) { ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.globalAlpha = flash * 0.8; ctx.fillStyle = '#FFF4E0'; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
        drawn = true;
      }
      function loop(ts) {
        if (!box.isConnected) { if (ro) ro.disconnect(); amb(false); return; }
        K.S.raf = requestAnimationFrame(loop);
        if (document.hidden) { last = 0; return; }                      // paused while the tab is hidden
        var dt = last ? Math.min(0.05, (ts - last) / 1000) : 0.016; last = ts;
        if (!W) { resize(); if (!W) return; }
        if (D) demoTick(dt);                                            // visitor: a demo round plays by itself
        if (lite && phase === 'idle' && drawn && !P.length) return;      // old phones: still idle scene
        if (phase === 'play') { playT += dt; ambT += dt; if (ambT > 3) { ambT = 0; amb(true, 0.4 + 0.45 * Math.min(1, playT / 110)); } }
        if (phase === 'over') { overT -= dt; if (overT <= 0) toIdle(); }
        frame(dt);
        // multiplier + cash-out amount follow the server clock
        if (phase === 'play' || phase === 'cashing') {
          var m = mult(), s = xm(m);
          if (s !== mShown) { mShown = s; tx(mEl, s); if (phase === 'play' && btn.lastChild && btn.lastChild.className === 'fit s4-b2') tx(btn.lastChild, money(R.stake * m)); }
        }
      }

      async function start() {
        if (K.guest()) { K.signup(); return; }
        if (busy) return;
        busy = true; btn.disabled = true;
        var r = await K.multi(key, 'start');
        busy = false; btn.disabled = false;
        if (!r || !box.isConnected) return;
        if (K.afterPlay) K.afterPlay(r);
        begin(r);
      }
      function begin(r) {
        if (!W) resize();
        R = r; off = (Number(r.now) || Date.now() / 1000) - Date.now() / 1000; playT = r.resume ? Math.max(0, r.now - r.t0) : 0;
        if (r.done) { result(r); return; }
        g.reset(true); P.length = 0; RG.length = 0; gs = null;
        phase = 'play'; mShown = ''; gN = 0; box.setAttribute('data-gn', '0'); say('', ''); hintOn(false); // the hint leaves as soon as the round starts
        btn.classList.remove('sk-nudge'); st.querySelectorAll('.cs-toast').forEach(function (t) { t.remove(); });
        setBtn(l.cash, money(r.stake * mult()), 'cash'); ambT = 0; amb(true, 0.4);
        poll();
      }
      function poll() {
        clearTimeout(K.S.timer);
        K.S.timer = setTimeout(async function () {
          if (!box.isConnected || phase !== 'play') return;
          var ref = R && R.ref, r = await K.multi(key, 'state', null, true);
          if (!box.isConnected || phase !== 'play' || !R || R.ref !== ref) return;
          if (r && r.ref && r.ref !== ref) { poll(); return; }
          if (r && r.now) off = r.now - Date.now() / 1000;
          if (r && r.done) { ended(r); return; }
          poll();
        }, 700);
      }
      // the server's secret moment came: an unavoidable event, then the loss
      function ended(r) {
        phase = 'over'; overT = 99; btn.disabled = true; hintOn(false); gs = null;
        g.boom(); sx('boom'); amb(false); say(l.end, 'lost'); setBtn(l.bet, '', 'wait');
        setTimeout(function () { if (box.isConnected) result(r); }, 1500);
      }
      async function sendFail(n) {
        n = n || 0;
        var ref = R && R.ref, r = await K.multi(key, n % 2 ? 'state' : 'fail', null, true); // network trouble: alternate fail / state
        if (!box.isConnected || !R || R.ref !== ref) return;
        if (r && r.ref && r.ref !== ref) r = null;
        if (r && !r.done) { if (n % 2) r = null; }
        if (!r) {
          if (n >= 9) { phase = 'over'; overT = 1; btn.disabled = false; setBtn(l.bet); R = null; return; } // give up waiting: the server settles it anyway
          clearTimeout(K.S.timer); K.S.timer = setTimeout(function () { sendFail(n + 1); }, 1200); return;
        }
        setTimeout(function () { if (box.isConnected) result(r); }, 650);
      }
      async function cash() {
        if (phase !== 'play') return;
        phase = 'cashing'; btn.disabled = true; clearTimeout(K.S.timer);
        var r = await K.multi(key, 'cash');
        btn.disabled = false;
        if (!box.isConnected) return;
        if (!r) { if (phase === 'cashing') { phase = 'play'; poll(); } return; }
        if ((Number(r.win) || 0) > 0) { amb(false); sx('cashout'); if (g.win) g.win(); say(l.won + ' ' + xm(r.out), 'won'); tx(mEl, xm(r.out)); result(r); }
        else ended(r);
      }
      function result(r) {
        phase = 'over'; overT = 3.2; clearTimeout(K.S.timer); hintOn(false); gs = null; amb(false);
        btn.disabled = true; setTimeout(function () { if (box.isConnected) btn.disabled = false; }, 900); // a late "cash out" tap never places a new bet
        var won = (Number(r.win) || 0) > 0, v = won ? Number(r.out) || mult() : (r.why === 'end' && r.c ? Number(r.c) : mult());
        if (!won) tx(mEl, xm(Math.max(1, v)));
        hist.unshift(won ? v : -Math.max(1, v)); hist = hist.slice(0, 12);
        try { localStorage.setItem('cg_' + key + '_h', JSON.stringify(hist)); } catch (e) { /* ignore */ }
        paintHist(); setBtn(l.bet); R = null;
        K.resultLine(box, r);
      }
      function toIdle() { phase = 'idle'; g.reset(false); say('', 'idle'); tx(mEl, xm(1)); mShown = ''; drawn = false; hintOn(true); }
      // 2026-10-21 (owner) — VISITOR (not logged in): the scene looks like a real round playing by itself, calm like a video
      // (the attract autopilot dodges everything, the multiplier climbs, the game's sounds; a soft cash-out sparkle, a fade, again).
      // Never a hit or a loss. K.demo: no server, nothing saved.
      var D = null;
      function demoTick(dt) {
        var ev = D.tick(dt);
        if (ev === 'start') { phase = 'demo'; g.reset(false); P.length = 0; RG.length = 0; say('', ''); hintOn(false); mShown = ''; }
        else if (ev === 'win') { if (g.win) g.win(); say(l.won + ' ' + xm(D.m()), 'won'); }
        if (ev === 'win') { hist.unshift(D.m()); hist = hist.slice(0, 12); paintHist(); } // shown, never saved
        if (phase === 'demo' && D.state === 'run') { var s = xm(D.m()); if (s !== mShown) { mShown = s; tx(mEl, s); } }
      }

      /* ---- gestures on the WHOLE scene. tap / aim: act on the touch itself; lr / swipe4: a swipe acts as soon as the finger
         has moved ~16 px (no wait for the release), a short touch without movement = the left / right half; drag: the game
         follows the finger. No ripple: the game itself answers. ---- */
      function pt(e) { var r = rect || st.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; }
      function nudge() { // touching the scene before betting: the BET button pulses + one clear line
        if (K.guest()) return;
        say(l.go, 'idle'); btn.classList.remove('sk-nudge'); void btn.offsetWidth; btn.classList.add('sk-nudge');
        clearTimeout(nudgeT); nudgeT = setTimeout(function () { if (!box.isConnected) return; btn.classList.remove('sk-nudge'); if (phase === 'idle') say('', 'idle'); }, 1800);
      }
      function count() { gN++; box.setAttribute('data-gn', String(gN)); }
      function did(what, x, y) { if (phase !== 'play') return; count(); K.sfx('act'); g.act(what, x, y); }
      var gs = null, drg = gest === 'drag' || gest === 'hold';
      cv.addEventListener('pointerdown', function (e) {
        e.preventDefault(); rect = st.getBoundingClientRect();
        if (e.pointerType === 'mouse' && e.button) return;
        if (phase !== 'play') { if (phase === 'idle') nudge(); return; }
        try { cv.setPointerCapture(e.pointerId); } catch (x) { /* ignore */ }
        var p = pt(e);
        if (gest === 'tap' || gest === 'aim') { did('tap', p[0], p[1]); gs = null; return; } // one-tap games act on the touch itself
        if (drg) { count(); gs = { id: e.pointerId }; g.down(p[0], p[1]); return; }
        gs = { x: p[0], y: p[1], id: e.pointerId, done: false };
      });
      cv.addEventListener('pointermove', function (e) {
        if (!gs || e.pointerId !== gs.id) return;
        if (drg) {
          if (phase !== 'play') { if (g.up) g.up(); gs = null; return; }
          if (!g.move) return;
          var ev = e.getCoalescedEvents ? e.getCoalescedEvents() : null; if (!ev || !ev.length) ev = [e];
          var q = pt(ev[ev.length - 1]); g.move(q[0], q[1]); return;
        }
        if (gs.done) return;
        var p = pt(e), dx = p[0] - gs.x, dy = p[1] - gs.y, th = Math.max(14, Math.min(W, H) * 0.04);
        if (Math.abs(dx) < th && Math.abs(dy) < th) return;
        gs.done = true;
        if (gest === 'lr' && Math.abs(dy) > Math.abs(dx)) { gs.done = false; gs.x = p[0]; gs.y = p[1]; return; } // vertical slip: wait
        did(Math.abs(dx) >= Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : (dy < 0 ? 'up' : 'down'), p[0], p[1]);
      });
      var up = function (e) {
        if (!gs || e.pointerId !== gs.id) return;
        var s = gs; gs = null;
        if (drg) { if (g.up) g.up(); return; }
        if (!s.done && gest === 'lr') did(s.x < W / 2 ? 'left' : 'right', s.x, s.y); // a tap on the left / right half
        else if (!s.done && gest === 'swipe4') did('tap', s.x, s.y); // v2850: a short touch without movement = tap (rotate, …)
      };
      cv.addEventListener('pointerup', up);
      cv.addEventListener('pointercancel', function () { if (gs && drg && g.up) g.up(); gs = null; });
      cv.addEventListener('contextmenu', function (e) { e.preventDefault(); });
      // iOS Safari: no page scroll, no double-tap zoom, no long-press magnifier / callout on the scene
      var stopT = function (e) { if (e.cancelable) e.preventDefault(); };
      ['touchstart', 'touchmove', 'touchend'].forEach(function (ev) { st.addEventListener(ev, stopT, { passive: false }); });
      // keyboard (PC / TV remote): arrows, WASD, Space
      var KEYS = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down', a: 'left', d: 'right', w: 'up', s: 'down', q: 'left', z: 'up', ' ': 'up' };
      var onKey = function (e) {
        if (!box.isConnected) { document.removeEventListener('keydown', onKey); return; }
        if (phase !== 'play' || (e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName))) return;
        var k = KEYS[e.key] || KEYS[String(e.key || '').toLowerCase()];
        if (!k || (e.repeat && gest !== 'drag')) return;
        e.preventDefault();
        if (gest === 'hold') { if (!e.repeat && (k === 'up' || k === 'down')) { count(); kHeld = true; g.down(W / 2, H / 2); } return; }
        if (gest === 'drag') { if (g.key) { count(); g.key(k); } return; }
        if (gest === 'aim') { if (g.key) { count(); g.key(k); } return; }
        did(gest === 'tap' ? 'tap' : k, W / 2, H / 2);
      };
      document.addEventListener('keydown', onKey);
      // hold games (PC / TV): Space / ↑ held = finger down, released = finger up
      var kHeld = false, onKeyUp = function (e) {
        if (!box.isConnected) { document.removeEventListener('keyup', onKeyUp); return; }
        if (!kHeld) return; kHeld = false; if (g.up) g.up();
      };
      if (gest === 'hold') document.addEventListener('keyup', onKeyUp);
      btn.addEventListener('click', function () {
        try { btn.blur(); } catch (e) { /* ignore */ } // Space = jump, never a second click on this button
        if (phase === 'play') cash();
        else if (phase === 'idle' || phase === 'over') { if (phase === 'over') toIdle(); start(); }
      });

      paintHist(); setBtn(l.bet); say('', 'idle'); hintOn(true);
      D = K.demo ? K.demo(st) : null; // visitors only (null for a logged-in player)
      resize(); // draws the idle scene right away
      cancelAnimationFrame(K.S.raf || 0); K.S.raf = requestAnimationFrame(loop);
      // a round still running (page reloaded, game reopened): pick it up
      if (!K.guest()) K.multi(key, 'state', null, true).then(function (r) { if (r && !r.done && r.t0 && box.isConnected && phase === 'idle') { r.resume = 1; requestAnimationFrame(function () { begin(r); }); } });
    }, { rules: rules(key) });
  }


  /* ------------------------------------------------------------------ shared drawing for the racing games */
  function boomFx(A, x, y, s) { A.explode(x, y, s); A.sx('boom', { v: Math.min(1, s) }); }
  function limb(c, x0, y0, x1, y1, w0, w1, col) { // tapered limb with rounded ends
    var a = Math.atan2(y1 - y0, x1 - x0), nx = -Math.sin(a), ny = Math.cos(a);
    c.fillStyle = col; c.beginPath();
    c.moveTo(x0 + nx * w0 / 2, y0 + ny * w0 / 2); c.lineTo(x1 + nx * w1 / 2, y1 + ny * w1 / 2); c.lineTo(x1 - nx * w1 / 2, y1 - ny * w1 / 2); c.lineTo(x0 - nx * w0 / 2, y0 - ny * w0 / 2); c.closePath(); c.fill();
    circ(c, x0, y0, w0 / 2, col); circ(c, x1, y1, w1 / 2, col);
  }
  function puff(A, x, y, n, cols, sp, life, sz, grav) { A._xb = 1; A.burst(x, y, n, cols, sp, life, sz, grav); A._xb = 0; } // particles without the 'hit' sound
  function sdpr() { return document.documentElement.classList.contains('oro-lite') ? 1 : Math.min(2, window.devicePixelRatio || 1); }
  // a person from js/art-rig.js (pre-drawn once), feet at the bottom centre of a 1.2h × 1.12h sprite; null when the rig is missing
  function rigOne(h, o) {
    if (!D6.Rig) return null;
    return mkc(h * 1.2, h * 1.12, sdpr(), function (c) { c.translate(h * 0.6, h * 1.08); D6.Rig.draw(c, h, o); });
  }
  // a horizontal strip (pre-drawn, w wide) repeated to cover the screen, scrolled by off (parallax)
  function tile(c, img, off, y, W, h) {
    var w = img.w, x = -(((off % w) + w) % w);
    for (; x < W; x += w) c.drawImage(img, x, y, w + 1, h || img.h);
  }
  // a glossy helmet (side view, facing right) centred at (x, y), radius r
  function helmet(c, x, y, r, col, dark) {
    circ(c, x, y, r, rg(c, x - r * 0.35, y - r * 0.4, r * 1.1, ['#FFFFFF', col, dark]));
    c.fillStyle = lg(c, x, y - r * 0.3, x + r, y + r * 0.2, ['#0F172A', '#334155', '#0B1020']);
    c.beginPath(); c.moveTo(x + r * 0.1, y - r * 0.28); c.quadraticCurveTo(x + r * 1.05, y - r * 0.3, x + r * 0.98, y + r * 0.22); c.lineTo(x + r * 0.2, y + r * 0.18); c.closePath(); c.fill();
    c.fillStyle = 'rgba(255,255,255,.55)'; c.beginPath(); c.ellipse(x - r * 0.3, y - r * 0.5, r * 0.32, r * 0.14, -0.5, 0, TAU); c.fill();
  }
  // a wheel with tyre, rim and spokes turned by angle a
  function wheel(c, x, y, r, a, rim) {
    circ(c, x, y, r, '#0B0B10');
    c.strokeStyle = '#27272A'; c.lineWidth = r * 0.12; c.beginPath(); c.arc(x, y, r * 0.86, 0, TAU); c.stroke();
    circ(c, x, y, r * 0.66, rim || '#A1A1AA'); circ(c, x, y, r * 0.54, '#18181B');
    c.strokeStyle = rim || '#D4D4D8'; c.lineWidth = Math.max(1.2, r * 0.08); c.beginPath();
    for (var i = 0; i < 5; i++) { var q = a + i * TAU / 5; c.moveTo(x, y); c.lineTo(x + Math.cos(q) * r * 0.56, y + Math.sin(q) * r * 0.56); }
    c.stroke(); circ(c, x, y, r * 0.16, '#E4E4E7');
  }
  // soft ground shadow
  function shadow(c, x, y, w, h, a) { c.fillStyle = 'rgba(0,0,0,' + (a || 0.3) + ')'; c.beginPath(); c.ellipse(x, y, Math.max(1, w), Math.max(1, h), 0, 0, TAU); c.fill(); }
  // speed lines (cheap): n thin streaks moving left
  function streaks(c, W, y0, y1, t, n, sp, col) {
    c.strokeStyle = col || 'rgba(255,255,255,.18)'; c.lineWidth = 1.5; c.beginPath();
    for (var i = 0; i < n; i++) { var yy = y0 + (y1 - y0) * ((i * 0.618) % 1), xx = W - ((t * sp * (0.7 + (i % 3) * 0.3) + i * 97) % (W + 80)); c.moveTo(xx, yy); c.lineTo(xx + 30 + (i % 4) * 12, yy); }
    c.stroke();
  }

  /* ================================================================== 1. MOTO WHEELIE — hold = throttle (the front wheel rises),
     release = it comes down. Keep the pitch in the green zone of the dial; speed bumps kick the bike up, more and more. */
  boot('motowheelie', function (A) {
    var W, H, T, dpr, G, r, wb, bx, bg, sky, spr, dial, a = 0.5, w = 0, held = false, cam = 0, v = 0, t = 0, bumps = [], nextB = 0, crash = null, won = 0, oil = null, lamp, grace = 0, rot = 0;
    var LO = 0.03, HI = 1.62, G1 = 0.42, G2 = 1.22; // fail below LO / above HI (rad); green zone G1..G2
    function reset(live) {
      a = live ? 0.55 : 0.75; w = 0; held = false; crash = null; won = 0; oil = null; bumps = []; nextB = live ? 2.2 : 1.2; grace = live ? 1.2 : 0; t = 0;
    }
    function spawn(live) { var lv = live ? A.lv() : 0.2; bumps.push({ x: cam + W + 40, k: lv }); nextB = rnd(1.5, 2.8) * (1.15 - lv * 0.35); }
    return {
      size: function (ww, hh, u, d, top) {
        W = ww; H = hh; dpr = d; T = top; G = H - (H - T) * 0.2; r = clamp(Math.min((H - T) * 0.085, W * 0.055), 15, 44); wb = r * 4.3; bx = W * (W > H ? 0.33 : 0.26);
        bg = mkc(W, H, dpr, function (c) {
          c.fillStyle = lg(c, 0, 0, 0, G, ['#120B2E', '#3B1A6B', '#9D3C7A', '#F59E0B']); c.fillRect(0, 0, W, G);
          stars(c, W, H, Math.round(W * H / 5000), 0, G * 0.55);
          circ(c, W * 0.8, T + (G - T) * 0.25, Math.min(W, H) * 0.06, rg(c, W * 0.8, T + (G - T) * 0.25, Math.min(W, H) * 0.06, ['#FFF7ED', '#FDE68A', '#F59E0B']));
          c.fillStyle = lg(c, 0, G, 0, H, ['#3F3F46', '#18181B']); c.fillRect(0, G, W, H - G);
          c.fillStyle = '#52525B'; c.fillRect(0, G - 3, W, 5);
          c.fillStyle = 'rgba(255,255,255,.06)'; for (var i = 0; i < 60; i++) c.fillRect(Math.random() * W, G + 6 + Math.random() * (H - G - 6), 2, 1);
        });
        var sw = Math.max(W, 520), sh = (G - T) * 0.62;
        sky = mkc(sw, sh, dpr, function (c) { // skyline: dark towers with lit windows (tiles seamlessly)
          var x = 0; while (x < sw) {
            var bw = rnd(26, 70), bh = sh * rnd(0.35, 1); if (x + bw > sw) bw = sw - x;
            c.fillStyle = lg(c, 0, sh - bh, 0, sh, ['#2A1650', '#140A2C']); c.fillRect(x, sh - bh, bw, bh);
            c.fillStyle = 'rgba(253,230,138,.55)';
            for (var yy = sh - bh + 6; yy < sh - 6; yy += 9) for (var xx = x + 4; xx < x + bw - 5; xx += 8) if (Math.random() < 0.28) c.fillRect(xx, yy, 3, 4);
            x += bw + rnd(2, 10);
          }
        });
        sky.w = sw; sky.h = sh;
        spr = mkc(r * 5.6, r * 4.4, sdpr(), function (c) {
          c.translate(r * 1.1, r * 3.7);
          c.strokeStyle = '#A1A1AA'; c.lineWidth = r * 0.22; c.lineCap = 'round';
          c.beginPath(); c.moveTo(0, 0); c.lineTo(r * 1.5, -r * 0.55); c.stroke(); // swing arm
          c.strokeStyle = lg(c, 0, -r, 0, 0, ['#F4F4F5', '#71717A']); c.lineWidth = r * 0.2; c.beginPath(); c.moveTo(r * 3.35, -r * 1.75); c.lineTo(wb, 0); c.stroke(); // fork
          c.strokeStyle = lg(c, 0, -r, 0, 0, ['#FAFAFA', '#A1A1AA']); c.lineWidth = r * 0.2; c.beginPath(); c.moveTo(r * 1.9, -r * 0.45); c.quadraticCurveTo(r * 0.8, -r * 0.4, r * 0.15, -r * 0.85); c.stroke(); // exhaust
          c.fillStyle = '#27272A'; rr(c, r * 1.35, -r * 1.05, r * 1.25, r * 0.75, r * 0.2); c.fill(); // engine
          c.fillStyle = '#52525B'; for (var i = 0; i < 3; i++) c.fillRect(r * (1.5 + i * 0.35), -r * 0.98, r * 0.12, r * 0.6);
          poly(c, [r * 0.55, -r * 1.25, r * 1.6, -r * 1.25, r * 2.05, -r * 1.65, r * 2.95, -r * 1.7, r * 3.45, -r * 1.95, r * 3.1, -r * 1.05, r * 2.4, -r * 0.95, r * 1.5, -r * 1.05], lg(c, 0, -r * 2, 0, -r * 0.9, ['#FCA5A5', '#DC2626', '#7F1D1D'])); // fairing + tank
          c.fillStyle = 'rgba(255,255,255,.5)'; c.beginPath(); c.ellipse(r * 2.5, -r * 1.55, r * 0.45, r * 0.09, -0.08, 0, TAU); c.fill();
          c.fillStyle = '#111827'; rr(c, r * 0.5, -r * 1.48, r * 1.3, r * 0.3, r * 0.14); c.fill(); // seat
          c.fillStyle = '#FDE68A'; c.beginPath(); c.ellipse(r * 3.42, -r * 1.55, r * 0.14, r * 0.2, 0, 0, TAU); c.fill(); // headlight
          c.fillStyle = '#F87171'; c.fillRect(r * 0.45, -r * 1.4, r * 0.14, r * 0.14);
          // rider: boot on the peg, knee forward, back leaning, arms to the bars, glossy helmet
          var hip = [r * 1.2, -r * 1.62], knee = [r * 2.25, -r * 1.35], foot = [r * 1.75, -r * 0.6], sh = [r * 1.95, -r * 2.75], hand = [r * 3.05, -r * 2.05], el = [r * 2.65, -r * 2.25];
          limb(c, hip[0], hip[1], knee[0], knee[1], r * 0.62, r * 0.48, '#1E3A8A'); limb(c, knee[0], knee[1], foot[0], foot[1], r * 0.46, r * 0.36, '#1E40AF');
          c.fillStyle = '#0F172A'; rr(c, foot[0] - r * 0.25, foot[1] - r * 0.12, r * 0.6, r * 0.3, r * 0.1); c.fill();
          limb(c, hip[0], hip[1], sh[0], sh[1], r * 0.82, r * 0.78, '#E5E7EB');
          c.fillStyle = '#DC2626'; c.beginPath(); c.moveTo(hip[0] + r * 0.1, hip[1] - r * 0.3); c.lineTo(sh[0] + r * 0.2, sh[1] + r * 0.1); c.lineTo(sh[0] + r * 0.36, sh[1] + r * 0.4); c.lineTo(hip[0] + r * 0.4, hip[1] - r * 0.1); c.fill(); // jacket stripe
          limb(c, sh[0], sh[1], el[0], el[1], r * 0.36, r * 0.32, '#D1D5DB'); limb(c, el[0], el[1], hand[0], hand[1], r * 0.32, r * 0.28, '#D1D5DB');
          circ(c, hand[0], hand[1], r * 0.19, '#111827');
          c.strokeStyle = '#3F3F46'; c.lineWidth = r * 0.12; c.beginPath(); c.moveTo(r * 3.3, -r * 1.85); c.lineTo(hand[0] - r * 0.05, hand[1] - r * 0.05); c.stroke();
          helmet(c, sh[0] + r * 0.35, sh[1] - r * 0.5, r * 0.52, '#F43F5E', '#881337');
        });
        lamp = mkc(r * 1.6, (G - T) * 0.62, sdpr(), function (c, w2, h2) {
          c.fillStyle = '#27272A'; c.fillRect(w2 / 2 - 2, r * 0.3, 4, h2); c.fillRect(w2 / 2 - 2, r * 0.3, r * 0.6, 3);
          circ(c, w2 / 2 + r * 0.55, r * 0.42, r * 0.7, rg(c, w2 / 2 + r * 0.55, r * 0.42, r * 0.7, ['rgba(254,240,138,.9)', 'rgba(254,240,138,.25)', 'rgba(254,240,138,0)']));
        });
        var gr = clamp(r * 1.3, 22, 44);
        dial = mkc(gr * 2.4, gr * 1.5, sdpr(), function (c) {
          c.translate(gr * 0.25, gr * 1.3);
          c.fillStyle = 'rgba(10,6,30,.55)'; c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, gr * 1.12, -Math.PI * 0.62, 0.06); c.closePath(); c.fill();
          var arc = function (a0, a1, col) { c.strokeStyle = col; c.lineWidth = gr * 0.2; c.beginPath(); c.arc(0, 0, gr * 0.9, -a1, -a0); c.stroke(); };
          arc(0, LO + 0.02, '#F43F5E'); arc(LO + 0.02, G1, '#FBBF24'); arc(G1, G2, '#22C55E'); arc(G2, 1.45, '#FBBF24'); arc(1.45, Math.PI * 0.6, '#F43F5E');
        });
        dial.gr = gr;
        if (!crash) reset(false);
      },
      reset: function (live) { reset(live); },
      step: function (dt, live) {
        t += dt; var lv = live ? A.lv() : 0.2;
        if (won) { won += dt; v = Math.max(0, v - v * dt * 0.8); cam += v * dt; rot += v * dt / r; a = Math.max(0, a - dt * 0.8); return; }
        if (crash) {
          crash.t += dt; v = Math.max(0, v - W * 0.9 * dt); cam += v * dt; rot += v * dt / r;
          if (crash.k === 'flip') { a = Math.min(Math.PI * 0.94, a + crash.w * dt); crash.w += 4 * dt; }
          else if (crash.k === 'oil') { a = Math.max(0, a - 2 * dt); oil.sx = W * 0.3 * ease(crash.t / 1.2); oil.spin = -0.3 * ease(crash.t / 1.2); if (crash.t < 1 && Math.random() < 0.5) A.burst(bx + oil.sx, G - 2, 2, ['#FDE68A', '#FB923C'], 140, 0.3, 2.2, 300); }
          else { a = Math.max(-0.12, a - 3 * dt); if (crash.t < 0.9 && Math.random() < 0.6) A.burst(bx + wb * Math.cos(a), G - r * 0.2, 2, ['#FDE68A', '#FB923C'], 160, 0.35, 2.4, 300); }
          return;
        }
        var tv = W * (0.55 + 0.45 * lv) + 160; v += (tv - v) * Math.min(1, dt * 2); cam += v * dt; rot += v * dt / r;
        if (A.idle()) held = a < 0.86 ? (w < 1.2) : (a < 1.05 && w < -0.25); // attract mode: an autopilot rides a calm wheelie
        var n = 3, h = dt / n;
        for (var k = 0; k < n; k++) {
          var tq = (held ? 3.4 + lv * 0.6 : 0) - 2.5 * Math.cos(a) + (a > 1.35 ? (a - 1.35) * 3 : 0) - 1.6 * w;
          w += tq * h; a += w * h;
        }
        nextB -= dt; if (nextB <= 0) spawn(live);
        for (var i = bumps.length - 1; i >= 0; i--) {
          var b = bumps[i];
          if (!b.hit && b.x - cam < bx) { b.hit = 1; w += (0.8 + b.k * 1.0) * rnd(0.85, 1.15); A.shake(0.08); A.sx('tick', { v: 0.4 }); }
          if (b.x - cam < -60) bumps.splice(i, 1);
        }
        if (grace > 0) { grace -= dt; if (a < 0.25) { a = 0.25; w = Math.max(0, w); } }
        if (a < LO) {
          if (A.live()) { if (A.fail(A.l.fail)) { crash = { t: 0, k: 'nose' }; A.shake(0.35); } }
          else { a = LO; w = 1.2; }
        } else if (a > HI) {
          if (A.live()) { if (A.fail(A.l.fail2)) { crash = { t: 0, k: 'flip', w: Math.max(1, w) }; A.shake(0.3); } }
          else { a = HI; w = -0.6; }
        }
      },
      draw: function (c) {
        A.bg(bg);
        var i, sh = sky.h;
        tile(c, sky, cam * 0.12, G - sh, W);
        var lw = W * 0.55; for (var lx = -((cam * 0.5) % lw); lx < W + lamp.w; lx += lw) c.drawImage(lamp, lx, G - lamp.h, lamp.w, lamp.h);
        // lane dashes
        c.fillStyle = 'rgba(253,230,138,.75)'; var dw = r * 2.4, gap = r * 2.2, ly = G + (H - G) * 0.45;
        for (var dx = -((cam) % (dw + gap)); dx < W; dx += dw + gap) c.fillRect(dx, ly, dw, Math.max(2, r * 0.14));
        // speed bumps
        for (i = 0; i < bumps.length; i++) {
          var x = bumps[i].x - cam; if (x < -50 || x > W + 50) continue;
          c.fillStyle = '#18181B'; c.beginPath(); c.ellipse(x, G + 1, r * 0.9, r * 0.32, 0, Math.PI, TAU); c.fill();
          c.save(); c.beginPath(); c.ellipse(x, G + 1, r * 0.85, r * 0.27, 0, Math.PI, TAU); c.clip();
          for (var s = -3; s <= 3; s++) { c.fillStyle = s % 2 ? '#FACC15' : '#18181B'; c.fillRect(x + s * r * 0.26 - r * 0.13, G - r * 0.4, r * 0.26, r * 0.5); }
          c.restore();
        }
        if (oil) { c.fillStyle = 'rgba(15,10,25,.85)'; c.beginPath(); c.ellipse(oil.x - cam, G + r * 0.1, r * 2.2, r * 0.35, 0, 0, TAU); c.fill(); c.fillStyle = 'rgba(167,139,250,.35)'; c.beginPath(); c.ellipse(oil.x - cam - r * 0.4, G + r * 0.02, r * 1.1, r * 0.12, 0, 0, TAU); c.fill(); }
        streaks(c, W, T + (G - T) * 0.35, G - r * 0.5, t, 7, v * 1.4, 'rgba(255,255,255,.1)');
        // bike
        var ry = G - r, sx = 0;
        if (oil) sx = oil.sx;
        shadow(c, bx + wb * 0.5 * Math.cos(a), G + 2, wb * 0.55 * Math.max(0.4, Math.cos(a)) + r * 0.6, r * 0.18, 0.35);
        c.save(); c.translate(bx + sx, ry); c.rotate(-a + (oil ? oil.spin || 0 : 0));
        c.drawImage(spr, -r * 1.1, -r * 3.7, r * 5.6, r * 4.4);
        wheel(c, 0, 0, r, rot, '#D4D4D8'); wheel(c, wb, 0, r, rot, '#D4D4D8');
        c.restore();
        // pitch dial
        var gr = dial.gr, gx = 10, gy = T + 4;
        c.drawImage(dial, gx, gy, gr * 2.4, gr * 1.5);
        var ox = gx + gr * 0.25, oy = gy + gr * 1.3, na = -clamp(a, -0.1, 1.9);
        c.strokeStyle = '#FFFFFF'; c.lineWidth = 3; c.lineCap = 'round'; c.beginPath(); c.moveTo(ox, oy); c.lineTo(ox + Math.cos(na) * gr * 1.02, oy + Math.sin(na) * gr * 1.02); c.stroke();
        circ(c, ox, oy, 4, '#FDE68A');
      },
      down: function () { held = true; },
      move: function () { },
      up: function () { held = false; },
      boom: function () { // the secret end: an oil slick under the wheel, the bike slides away
        oil = { x: cam + bx + wb * 0.3, sx: 0, spin: 0 }; crash = { t: 0, k: 'oil' }; held = false;
        A.shake(0.3); A.sx('crash');
      },
      win: function () { won = 0.001; held = false; A.burst(bx + wb / 2, G - r * 3, 16, ['#FDE68A', '#F43F5E', '#FFFFFF'], 160, 0.6, 3); },
      dbg: function () { return { a: a, w: w, held: held, crash: crash ? crash.k : '', bumps: bumps.length, r: r, LO: LO, HI: HI, G1: G1, G2: G2 }; }
    };
  }, 'hold', 0.36);

  /* ================================================================== 2. DRIFT KING — a zigzag track seen from above. Hold = drift to
     the right, release = drift to the left. The car slides (its course lags its heading), so turn a little early. */
  boot('driftking', function (A) {
    var W, H, T, dpr, bg, tileS, car, rw, cl, pts = [], p = { x: 0, y: 0 }, hd = 0, crs = 0, tgt = -0.785, held = false, sp = 0, t = 0, dead = null, won = 0, skid = [], seg = 0, cx = 0, cy = 0, blow = null, lastDir = 1;
    var D = 0.785;
    function addSeg(live) {
      var lv = live ? A.lv() : 0.15, q = pts[pts.length - 1], dir = lastDir = -lastDir, len = rw * rnd(2.0, 4.6) * (1 - lv * 0.3);
      pts.push({ x: q.x + Math.sin(dir * D) * len, y: q.y - Math.cos(dir * D) * len, d: dir });
    }
    function reset(live) {
      pts = [{ x: 0, y: rw * 2, d: 0 }, { x: 0, y: -rw * (live ? 5 : 1.5), d: 0 }]; lastDir = Math.random() < 0.5 ? 1 : -1;
      for (var i = 0; i < 14; i++) addSeg(live);
      p.x = 0; p.y = 0; hd = crs = 0; tgt = 0; held = false; dead = null; won = 0; skid = []; seg = 0; blow = null; sp = rw * 2.6;
      cx = p.x; cy = p.y;
    }
    function segDist(i, x, y) { var a = pts[i], b = pts[i + 1], dx = b.x - a.x, dy = b.y - a.y, L = dx * dx + dy * dy, k = clamp(((x - a.x) * dx + (y - a.y) * dy) / L, 0, 1); return Math.hypot(a.x + dx * k - x, a.y + dy * k - y); }
    function near(x, y) { var best = 1e9; for (var i = Math.max(0, seg - 1); i < Math.min(pts.length - 1, seg + 3); i++) best = Math.min(best, segDist(i, x, y)); return best; }
    // the autopilot (idle scene) and the hint for tests: switch when the corner is closer than the turn needs
    function want() {
      var b = pts[seg + 1], c = pts[seg + 2]; if (!c) return held;
      var dc = Math.hypot(b.x - p.x, b.y - p.y), nd = c.d;
      if (dc < rw * 0.55 + sp * 0.12) return nd > 0;
      return pts[seg + 1].d > 0;
    }
    return {
      size: function (ww, hh, u, d, top) {
        W = ww; H = hh; dpr = d; T = top; rw = clamp(Math.min(W, H - T) * 0.2, 56, 150); cl = clamp(rw * 0.5, 26, 66);
        bg = mkc(W, H, dpr, function (c) { c.fillStyle = '#0D1A12'; c.fillRect(0, 0, W, H); });
        var ts = 160; tileS = mkc(ts, ts, dpr, function (c) {
          c.fillStyle = '#166534'; c.fillRect(0, 0, ts, ts);
          for (var i = 0; i < 70; i++) { c.fillStyle = Math.random() < 0.5 ? 'rgba(0,0,0,.12)' : 'rgba(187,247,208,.08)'; c.fillRect(Math.random() * ts, Math.random() * ts, 3, 2); }
          circ(c, 40, 46, 13, 'rgba(0,0,0,.25)'); circ(c, 36, 40, 12, rg(c, 36, 40, 12, ['#4ADE80', '#15803D', '#14532D'], -4, -4));
          circ(c, 118, 120, 10, 'rgba(0,0,0,.25)'); circ(c, 115, 115, 9, rg(c, 115, 115, 9, ['#86EFAC', '#16A34A', '#14532D'], -3, -3));
        });
        tileS.w = ts; tileS.h = ts;
        car = mkc(cl * 0.62, cl * 1.08, sdpr(), function (c, w, h) { // top view, nose up
          var bw = w * 0.82, x0 = (w - bw) / 2;
          c.fillStyle = '#0B0B10'; [[0.04, 0.16], [0.04, 0.7], [0.82, 0.16], [0.82, 0.7]].forEach(function (q) { rr(c, w * q[0], h * q[1], w * 0.16, h * 0.16, 2); c.fill(); });
          c.fillStyle = lg(c, x0, 0, x0 + bw, 0, ['#B45309', '#FACC15', '#FEF08A', '#FACC15', '#B45309']); rr(c, x0, h * 0.04, bw, h * 0.9, w * 0.3); c.fill();
          c.fillStyle = 'rgba(15,23,42,.9)'; rr(c, x0 + bw * 0.14, h * 0.28, bw * 0.72, h * 0.18, 4); c.fill(); rr(c, x0 + bw * 0.18, h * 0.62, bw * 0.64, h * 0.12, 3); c.fill();
          c.fillStyle = '#18181B'; c.fillRect(x0 + bw * 0.42, h * 0.04, bw * 0.16, h * 0.9); c.fillRect(x0 - 1, h * 0.88, bw + 2, h * 0.06);
          c.fillStyle = '#FEF9C3'; c.fillRect(x0 + bw * 0.08, h * 0.05, bw * 0.18, h * 0.03); c.fillRect(x0 + bw * 0.74, h * 0.05, bw * 0.18, h * 0.03);
          c.fillStyle = '#EF4444'; c.fillRect(x0 + bw * 0.08, h * 0.91, bw * 0.16, h * 0.025); c.fillRect(x0 + bw * 0.76, h * 0.91, bw * 0.16, h * 0.025);
          c.fillStyle = 'rgba(255,255,255,.35)'; rr(c, x0 + bw * 0.12, h * 0.1, bw * 0.2, h * 0.14, 3); c.fill();
        });
        if (!pts.length) reset(false);
      },
      reset: function (live) { reset(live); },
      step: function (dt, live) {
        t += dt; var lv = live ? A.lv() : 0.15, i;
        if (won) { won += dt; sp = Math.max(0, sp - sp * dt * 1.6); }
        else if (dead) { dead.t += dt; sp = Math.max(0, sp - rw * 4 * dt); hd += dead.spin * dt * Math.max(0, 1 - dead.t / 1.6); }
        else sp += (rw * (4.2 + 3.4 * lv) - sp) * Math.min(1, dt * 1.5);
        if (A.idle() && !dead) held = want();
        if (!dead && !won) {
          tgt = held ? D : -D;
          if (seg === 0 && p.y > pts[1].y + rw * 0.3) tgt = 0; // the straight start
          var dh = tgt - hd; hd += clamp(dh, -6 * dt, 6 * dt);
        }
        var dc = hd - crs; crs += dc * Math.min(1, dt * (dead ? 1.2 : 7.5)); // grip: the course follows the heading with a lag (the drift)
        p.x += Math.sin(crs) * sp * dt; p.y -= Math.cos(crs) * sp * dt;
        while (pts[seg + 2] && segDist(seg + 1, p.x, p.y) < segDist(seg, p.x, p.y)) seg++;
        while (pts.length < seg + 12) addSeg(live);
        if (seg > 4) { pts.splice(0, seg - 2); seg = 2; }
        // skid marks + smoke while the car slides
        var slide = Math.abs(hd - crs);
        if (sp > 1 && (slide > 0.06 || dead)) {
          for (var s = -1; s <= 1; s += 2) skid.push({ x: p.x - Math.sin(hd) * cl * 0.38 + Math.cos(hd) * s * cl * 0.24, y: p.y + Math.cos(hd) * cl * 0.38 + Math.sin(hd) * s * cl * 0.24, t: 0 });
          if (!A.lite && Math.random() < 0.35) puff(A, W / 2 - Math.sin(hd) * cl * 0.4 + (p.x - cx), T + (H - T) * 0.7 + Math.cos(hd) * cl * 0.4 + (p.y - cy), 1, ['rgba(226,232,240,.7)', 'rgba(203,213,225,.5)'], 30, 0.6, 7, -10);
        }
        for (i = skid.length - 1; i >= 0; i--) { skid[i].t += dt; if (skid[i].t > 2.2) skid.splice(i, 1); }
        if (skid.length > 240) skid.splice(0, skid.length - 240);
        cx += (p.x - cx) * Math.min(1, dt * 6); cy = p.y;
        if (!dead && !won && near(p.x, p.y) > rw / 2 + cl * 0.15) {
          if (A.live()) { if (A.fail(A.l.fail)) { dead = { t: 0, spin: (crs > 0 ? 1 : -1) * 5 }; A.shake(0.3); } }
          else reset(false);
        }
      },
      draw: function (c) {
        A.bg(bg);
        var oy = T + (H - T) * 0.7, ox = W / 2, i, X = function (x) { return x - cx + ox; }, Y = function (y) { return y - cy + oy; };
        // grass (tiled, scrolls with the camera)
        var ts = tileS.w, tx = -(((cx - ox) % ts) + ts) % ts, ty = -(((cy - oy) % ts) + ts) % ts;
        for (var gx = tx; gx < W; gx += ts) for (var gy = ty + T - ts; gy < H; gy += ts) c.drawImage(tileS, gx, gy, ts, ts);
        // track: curbs, asphalt, centre line (round joins = rounded corners)
        c.lineJoin = 'round'; c.lineCap = 'round';
        var i0 = Math.max(0, seg - 2), i1 = i0; while (i1 < pts.length - 1 && Y(pts[i1].y) > T - rw * 2) i1++;
        var path = function () { c.beginPath(); for (i = i0; i <= i1; i++) { var q = pts[i]; if (i > i0) c.lineTo(X(q.x), Y(q.y)); else c.moveTo(X(q.x), Y(q.y)); } };
        path(); c.strokeStyle = '#F8FAFC'; c.lineWidth = rw + 12; c.stroke();
        c.setLineDash([rw * 0.22, rw * 0.22]); c.strokeStyle = '#DC2626'; c.stroke(); c.setLineDash([]);
        path(); c.strokeStyle = '#2A2A33'; c.lineWidth = rw; c.stroke();
        c.setLineDash([12, 16]); path(); c.strokeStyle = 'rgba(250,250,250,.4)'; c.lineWidth = 2; c.stroke(); c.setLineDash([]);
        // skid marks
        c.fillStyle = 'rgba(0,0,0,.35)';
        for (i = 0; i < skid.length; i++) { var k = skid[i]; c.globalAlpha = Math.max(0, 0.6 - k.t * 0.27); c.fillRect(X(k.x) - 1.5, Y(k.y) - 1.5, 3, 3); }
        c.globalAlpha = 1;
        // car
        var x = X(p.x), y = Y(p.y);
        c.save(); c.translate(x + 3, y + 4); c.rotate(hd); c.fillStyle = 'rgba(0,0,0,.35)'; rr(c, -car.w * 0.42, -car.h * 0.46, car.w * 0.84, car.h * 0.92, 6); c.fill(); c.restore();
        c.save(); c.translate(x, y); c.rotate(hd); c.drawImage(car, -car.w / 2, -car.h / 2, car.w, car.h); c.restore();
        if (blow && blow.t < 1) { blow.t += 0.016; circ(c, x, y, cl * (0.3 + blow.t), 'rgba(253,186,116,' + (0.5 * (1 - blow.t)) + ')'); }
      },
      down: function () { held = true; },
      move: function () { },
      up: function () { held = false; },
      boom: function () { dead = { t: 0, spin: (Math.random() < 0.5 ? -1 : 1) * 7 }; blow = { t: 0 }; held = false; boomFx(A, W / 2, T + (H - T) * 0.7, 0.6); },
      win: function () { won = 0.001; held = false; A.burst(W / 2, T + (H - T) * 0.7, 16, ['#FDE68A', '#FACC15', '#FFFFFF'], 150, 0.6, 3); },
      dbg: function () { return { want: want() ? 1 : 0, held: held, off: near(p.x, p.y) / rw, dead: dead ? 1 : 0, sp: sp / rw, seg: seg, rw: rw }; }
    };
  }, 'hold', 0.42);

  /* ================================================================== 3. HORSE JUMPER — show jumping. Hold = charge the jump (gauge),
     release = jump: the height and the length grow with the charge. Fences (height) and water ditches (length), the timing matters. */
  function horseDraw(c, u, ph, mode, coat) { // side view facing right, hooves on y = 0; u = body length unit
    var C1 = coat || ['#C2793A', '#8A4B1F', '#5C2E10'], i;
    var bob = mode === 'run' ? Math.sin(ph * 2) * 0.03 * u : 0;
    function leg(x0, y0, ang, bend, s, far) {
      var col = far ? C1[2] : C1[1], kx = x0 + Math.sin(ang) * 0.3 * u, ky = y0 + Math.cos(ang) * 0.3 * u, a2 = ang - s * bend;
      var hx = kx + Math.sin(a2) * 0.31 * u, hy = ky + Math.cos(a2) * 0.31 * u;
      limb(c, x0, y0, kx, ky, 0.13 * u, 0.075 * u, col); limb(c, kx, ky, hx, hy, 0.065 * u, 0.05 * u, col);
      c.fillStyle = '#1C1917'; c.beginPath(); c.ellipse(hx + 0.015 * u, hy, 0.045 * u, 0.03 * u, a2 * 0.3, 0, TAU); c.fill();
      c.fillStyle = '#F5F5F4'; c.beginPath(); c.ellipse(hx, hy - 0.05 * u, 0.04 * u, 0.025 * u, 0, 0, TAU); c.fill(); // white sock
    }
    var legs = [];
    if (mode === 'jump') legs = [[0.27, 1.25, 2.2, -1, 1], [-0.28, -0.75, 0.3, 1, 1], [0.3, 1.05, 2.0, -1, 0], [-0.25, -0.9, 0.4, 1, 0]];
    else if (mode === 'rear') legs = [[0.27, 0.9, 1.6, -1, 1], [-0.28, 0.25, 0.2, 1, 1], [0.3, 1.2, 1.9, -1, 0], [-0.25, 0.1, 0.1, 1, 0]];
    else for (i = 0; i < 4; i++) {
      var front = i % 2 === 0, far = i < 2, f = ph + (front ? 0.9 : 0) + (far ? 0.35 : 0), sn = Math.sin(f);
      legs.push([front ? (far ? 0.27 : 0.3) : (far ? -0.28 : -0.25), sn * 0.55, Math.max(0, Math.cos(f)) * (front ? 1.5 : 0.9), front ? -1 : 1, far ? 1 : 0]);
    }
    var by = -0.74 * u + bob;
    legs.forEach(function (L) { if (L[4]) leg(L[0] * u, by + 0.05 * u, L[1], L[2], L[3], true); });
    // tail
    c.strokeStyle = '#2B1608'; c.lineWidth = 0.07 * u; c.lineCap = 'round'; c.beginPath(); c.moveTo(-0.46 * u, by - 0.08 * u);
    c.quadraticCurveTo(-0.7 * u, by - 0.02 * u + (mode === 'jump' ? -0.1 * u : 0), -0.66 * u, by + 0.3 * u + (mode === 'jump' ? -0.2 * u : 0)); c.stroke();
    // body
    var bodyG = lg(c, 0, by - 0.24 * u, 0, by + 0.2 * u, [C1[0], C1[1], C1[2]]);
    c.fillStyle = bodyG; c.beginPath(); c.ellipse(0, by, 0.44 * u, 0.2 * u, 0, 0, TAU); c.fill();
    circ(c, 0.3 * u, by + 0.02 * u, 0.19 * u, bodyG); circ(c, -0.3 * u, by - 0.01 * u, 0.21 * u, bodyG);
    // neck + head
    c.fillStyle = bodyG; c.beginPath(); c.moveTo(0.22 * u, by - 0.12 * u); c.lineTo(0.5 * u, by - 0.56 * u); c.lineTo(0.66 * u, by - 0.5 * u); c.lineTo(0.48 * u, by + 0.08 * u); c.closePath(); c.fill();
    c.save(); c.translate(0.62 * u, by - 0.52 * u); c.rotate(0.62);
    c.fillStyle = C1[1]; c.beginPath(); c.ellipse(0.14 * u, 0, 0.2 * u, 0.085 * u, 0, 0, TAU); c.fill();
    c.fillStyle = C1[0]; c.beginPath(); c.ellipse(0.08 * u, -0.025 * u, 0.13 * u, 0.05 * u, 0, 0, TAU); c.fill();
    circ(c, 0.31 * u, 0.02 * u, 0.012 * u, '#1C1917'); c.restore();
    c.fillStyle = C1[2]; c.beginPath(); c.moveTo(0.56 * u, by - 0.6 * u); c.lineTo(0.6 * u, by - 0.7 * u); c.lineTo(0.63 * u, by - 0.58 * u); c.fill(); // ear
    circ(c, 0.66 * u, by - 0.5 * u, 0.018 * u, '#0C0A09');
    c.strokeStyle = '#2B1608'; c.lineWidth = 0.06 * u; c.beginPath(); c.moveTo(0.53 * u, by - 0.58 * u); c.quadraticCurveTo(0.36 * u, by - 0.36 * u, 0.24 * u, by - 0.16 * u); c.stroke(); // mane
    c.strokeStyle = '#78350F'; c.lineWidth = 0.02 * u; c.beginPath(); c.moveTo(0.74 * u, by - 0.36 * u); c.lineTo(0.2 * u, by - 0.3 * u); c.stroke(); // reins
    // saddle cloth + saddle
    c.fillStyle = '#1D4ED8'; rr(c, -0.2 * u, by - 0.2 * u, 0.32 * u, 0.2 * u, 0.04 * u); c.fill(); c.fillStyle = '#FDE68A'; c.fillRect(-0.2 * u, by - 0.03 * u, 0.32 * u, 0.02 * u);
    c.fillStyle = '#3F2A14'; rr(c, -0.14 * u, by - 0.24 * u, 0.24 * u, 0.07 * u, 0.03 * u); c.fill();
    c.fillStyle = 'rgba(255,255,255,.25)'; c.beginPath(); c.ellipse(-0.05 * u, by - 0.13 * u, 0.3 * u, 0.04 * u, -0.05, 0, TAU); c.fill(); // gloss
    // jockey: boot in the stirrup, knee up, leaning forward, arms to the reins
    var hip = [-0.02 * u, by - 0.26 * u], knee = [0.14 * u, by - 0.2 * u], foot = [0.04 * u, by - 0.02 * u], sh = [0.16 * u, by - 0.56 * u], hand = [0.36 * u, by - 0.36 * u];
    limb(c, hip[0], hip[1], knee[0], knee[1], 0.11 * u, 0.09 * u, '#F5F5F4'); limb(c, knee[0], knee[1], foot[0], foot[1], 0.08 * u, 0.07 * u, '#1C1917');
    limb(c, hip[0], hip[1], sh[0], sh[1], 0.16 * u, 0.15 * u, '#DC2626');
    c.fillStyle = '#FDE68A'; c.beginPath(); c.moveTo(hip[0] + 0.02 * u, hip[1] - 0.06 * u); c.lineTo(sh[0], sh[1] + 0.04 * u); c.lineTo(sh[0] + 0.04 * u, sh[1] + 0.08 * u); c.lineTo(hip[0] + 0.06 * u, hip[1] - 0.03 * u); c.fill();
    limb(c, sh[0], sh[1], hand[0], hand[1], 0.06 * u, 0.05 * u, '#B91C1C'); circ(c, hand[0], hand[1], 0.03 * u, '#F5F5F4');
    helmet(c, sh[0] + 0.06 * u, sh[1] - 0.1 * u, 0.085 * u, '#1E293B', '#020617');
    legs.forEach(function (L) { if (!L[4]) leg(L[0] * u, by + 0.05 * u, L[1], L[2], L[3], false); });
  }
  boot('horsejump', function (A) {
    var W, H, T, dpr, bg, G, u, hx, fr = [], jf, rf, cam = 0, v = 0, t = 0, ph = 0, z = 0, vz = 0, air = false, held = false, chg = 0, obs = [], nextX = 0, dead = null, won = 0, rear = 0, gk, hmax;
    function addObs(live) {
      var lv = live ? A.lv() : 0.2, x = nextX, k;
      if (Math.random() < 0.3 + lv * 0.15) { k = { k: 'w', x: x, w: u * Math.min(1.6, rnd(0.8, 1.2 + lv * 0.4)) }; nextX = x + k.w + u * rnd(3.6, 5.2) * (1.1 - lv * 0.25); }
      else { k = { k: 'f', x: x, h: u * rnd(0.42 + lv * 0.2, 0.68 + lv * 0.25), w: u * 0.1 }; nextX = x + u * rnd(3.4, 5.0) * (1.1 - lv * 0.25); }
      obs.push(k);
    }
    function reset(live) {
      obs = []; cam = 0; nextX = (live ? W * 0.9 : W * 0.75) + u * 2; for (var i = 0; i < 4; i++) addObs(live);
      z = 0; vz = 0; air = false; held = false; chg = 0; dead = null; won = 0; rear = 0; v = u * 2.9;
    }
    function jump() { var p = clamp(chg, 0.15, 1), hgt = hmax * (0.3 + 0.7 * p); vz = Math.sqrt(2 * gk * hgt); air = true; chg = 0; A.sx('whoosh', { v: 0.4 }); }
    // where the hooves are now (world x of the hind / front hoof)
    function hoofs() { return [cam + hx - 0.3 * u, cam + hx + 0.34 * u]; }
    // the autopilot: charge as needed, release at the right distance
    function auto() {
      var o = null; for (var i = 0; i < obs.length; i++) if (obs[i].x + (obs[i].w || 0) > cam + hx - 0.2 * u) { o = obs[i]; break; }
      if (!o || air) return false;
      var need = o.k === 'f' ? clamp((o.h / hmax - 0.3) / 0.7 + 0.25, 0.3, 1) : 1, dist = o.x - (cam + hx);
      var p = clamp(need, 0.15, 1), ta = 2 * Math.sqrt(2 * hmax * (0.3 + 0.7 * p) / gk), span = v * ta;
      var launch = o.k === 'f' ? span * 0.5 + 0.05 * u : 0.48 * u;
      if (dist < launch + v * 0.05 && chg >= need - 0.04) return 'go';
      return dist < launch + v * (need / 1.1) + u * 0.3;
    }
    return {
      size: function (ww, hh, uu, d, top) {
        W = ww; H = hh; dpr = d; T = top; G = H - (H - T) * 0.2; u = clamp(Math.min((H - T) * 0.3, W * 0.19), 50, 160); hx = Math.max(u * 0.95, W * 0.2);
        hmax = u * 1.05; gk = 8 * hmax / (0.9 * 0.9);
        bg = mkc(W, H, dpr, function (c) {
          c.fillStyle = lg(c, 0, 0, 0, G, ['#1E3A8A', '#3B82F6', '#BAE6FD']); c.fillRect(0, 0, W, G);
          for (var i = 0; i < 3; i++) { var cx = W * (0.15 + i * 0.33) + rnd(-20, 20), cy = T + (0.1 + (i % 2) * 0.14) * (G - T); c.fillStyle = 'rgba(255,255,255,.75)'; c.beginPath(); c.ellipse(cx, cy, W * 0.08, W * 0.02, 0, 0, TAU); c.ellipse(cx + W * 0.04, cy - W * 0.012, W * 0.05, W * 0.02, 0, 0, TAU); c.fill(); }
          var sy = G - (G - T) * 0.32; // stands with the crowd
          c.fillStyle = lg(c, 0, sy, 0, G, ['#334155', '#1E293B']); c.fillRect(0, sy, W, G - sy);
          c.globalAlpha = 0.55; for (var ry = sy + 8; ry < G - 16; ry += 9) for (var rx = (ry / 9 % 2) * 4; rx < W; rx += 8) { c.fillStyle = pick(['#FCA5A5', '#FDE68A', '#93C5FD', '#E5E7EB', '#6EE7B7', '#D8B4FE', '#475569']); circ(c, rx + rnd(-1, 1), ry, 2.4, c.fillStyle); }
          c.globalAlpha = 1; c.fillStyle = 'rgba(15,23,42,.35)'; for (ry = sy + 12; ry < G - 14; ry += 9) c.fillRect(0, ry, W, 1.5);
          c.fillStyle = '#F8FAFC'; c.fillRect(0, G - 12, W, 4); c.fillStyle = '#E2E8F0'; for (var x = 0; x < W; x += 26) c.fillRect(x, G - 14, 3, 12);
          c.fillStyle = lg(c, 0, G - 8, 0, H, ['#65A30D', '#3F6212']); c.fillRect(0, G - 8, W, H - G + 8);
          c.fillStyle = 'rgba(0,0,0,.08)'; for (i = 0; i < 80; i++) c.fillRect(Math.random() * W, G + Math.random() * (H - G), 6, 2);
        });
        var dp = sdpr();
        fr = []; for (var i = 0; i < 10; i++) fr.push(mkc(u * 1.9, u * 1.75, dp, function (c) { c.translate(u * 0.95, u * 1.65); horseDraw(c, u, i / 10 * TAU, 'run'); }));
        jf = mkc(u * 1.9, u * 1.75, dp, function (c) { c.translate(u * 0.95, u * 1.65); horseDraw(c, u, 0, 'jump'); });
        rf = mkc(u * 1.9, u * 1.75, dp, function (c) { c.translate(u * 0.95, u * 1.65); horseDraw(c, u, 0, 'rear'); });
        if (!obs.length) reset(false);
      },
      reset: function (live) { reset(live); },
      step: function (dt, live) {
        t += dt; var lv = live ? A.lv() : 0.2, i;
        if (won) { won += dt; v = Math.max(0, v - v * dt * 1.5); }
        else if (dead) { dead.t += dt; v = Math.max(0, v - u * 5 * dt); }
        else if (rear) { rear += dt; v = Math.max(0, v - u * 8 * dt); }
        else v += (u * (2.9 + 1.4 * lv) - v) * Math.min(1, dt * 2);
        cam += v * dt; ph += dt * (6 + v / u * 1.2);
        if (A.idle() && !dead) { var a = auto(); if (a === 'go') { held = false; jump(); } else held = !!a; }
        if (held && !air && !dead && !rear) chg = Math.min(1, chg + dt / 0.7);
        if (air) { vz -= gk * dt; z += vz * dt; if (z <= 0) { z = 0; vz = 0; air = false; A.burst(hx + 0.3 * u, G, 6, ['#A3E635', '#D9F99D'], 70, 0.4, 2.4); } }
        while (obs.length < 5) addObs(live);
        for (i = obs.length - 1; i >= 0; i--) if (obs[i].x + (obs[i].w || 0) < cam - W * 0.3) obs.splice(i, 1);
        if (dead || won || rear) return;
        var hf = hoofs();
        for (i = 0; i < obs.length; i++) {
          var o = obs[i];
          if (o.k === 'f' && !o.hit && o.x > hf[0] - 0.1 * u && o.x < hf[1] + 0.05 * u && z < o.h - 0.03 * u) {
            o.hit = 1;
            if (A.live()) { if (A.fail(A.l.fail)) { dead = { t: 0, k: 'f' }; o.fall = 0.001; A.shake(0.25); } }
            else { reset(false); return; }
          }
          if (o.k === 'w' && !air && ((hf[1] > o.x + 0.05 * u && hf[1] < o.x + o.w - 0.05 * u) || (hf[0] > o.x + 0.05 * u && hf[0] < o.x + o.w - 0.05 * u))) {
            if (A.live()) { if (A.fail(A.l.fail2)) { dead = { t: 0, k: 'w' }; A.burst(hx, G, 26, ['#BFDBFE', '#60A5FA', '#FFFFFF'], 220, 0.8, 3.4, 300); A.shake(0.25); } }
            else { reset(false); return; }
          }
        }
        for (i = 0; i < obs.length; i++) if (obs[i].fall) obs[i].fall = Math.min(1, obs[i].fall + dt * 3);
      },
      draw: function (c) {
        A.bg(bg);
        var i;
        // sand track lines (scroll)
        c.fillStyle = 'rgba(255,255,255,.12)'; var sp = u * 1.6; for (var lx = -(cam % sp); lx < W; lx += sp) c.fillRect(lx, G + (H - G) * 0.5, u * 0.5, 2);
        for (i = 0; i < obs.length; i++) {
          var o = obs[i], x = o.x - cam; if (x > W + 60 || x + (o.w || 0) < -60) continue;
          if (o.k === 'w') {
            c.fillStyle = '#1E3A8A'; rr(c, x, G - 3, o.w, (H - G) * 0.5, 6); c.fill();
            c.fillStyle = lg(c, x, 0, x + o.w, 0, ['#2563EB', '#60A5FA', '#2563EB']); rr(c, x + 2, G - 2, o.w - 4, (H - G) * 0.35, 5); c.fill();
            c.fillStyle = 'rgba(255,255,255,.55)'; c.fillRect(x + o.w * 0.2 + Math.sin(t * 3) * 4, G + 3, o.w * 0.25, 2);
            c.fillStyle = '#15803D'; rr(c, x - u * 0.12, G - u * 0.16, u * 0.14, u * 0.16, u * 0.05); c.fill(); // little hedge before the water
          } else {
            var ph2 = o.h, pw = u * 0.06;
            c.fillStyle = 'rgba(0,0,0,.2)'; c.beginPath(); c.ellipse(x, G + 2, u * 0.45, u * 0.05, 0, 0, TAU); c.fill();
            c.fillStyle = lg(c, x - u * 0.36, 0, x - u * 0.28, 0, ['#FFFFFF', '#CBD5E1']); c.fillRect(x - u * 0.36, G - ph2 - u * 0.14, pw * 1.3, ph2 + u * 0.14); c.fillRect(x + u * 0.28, G - ph2 - u * 0.14, pw * 1.3, ph2 + u * 0.14);
            c.fillStyle = '#1E3A8A'; c.fillRect(x - u * 0.37, G - ph2 - u * 0.17, pw * 1.5, u * 0.05); c.fillRect(x + u * 0.27, G - ph2 - u * 0.17, pw * 1.5, u * 0.05);
            c.fillStyle = '#FDE68A'; c.beginPath(); c.moveTo(x + u * 0.3, G - ph2 - u * 0.17); c.lineTo(x + u * 0.42, G - ph2 - u * 0.24); c.lineTo(x + u * 0.3, G - ph2 - u * 0.3); c.fill();
            var nb = Math.max(1, Math.round(ph2 / (u * 0.17)));
            for (var b = 0; b < nb; b++) {
              var by = G - ph2 + b * (ph2 / nb), rot = o.fall && b === 0 ? o.fall * 0.9 : 0;
              c.save(); c.translate(x, by + (o.fall && b === 0 ? o.fall * ph2 * 0.8 : 0)); c.rotate(rot);
              for (var s = 0; s < 6; s++) { c.fillStyle = s % 2 ? '#F8FAFC' : '#DC2626'; c.fillRect(-u * 0.3 + s * u * 0.1, -u * 0.03, u * 0.1, u * 0.06); }
              c.fillStyle = 'rgba(255,255,255,.35)'; c.fillRect(-u * 0.3, -u * 0.03, u * 0.6, u * 0.015);
              c.restore();
            }
          }
        }
        // horse
        var img = rear ? rf : air ? jf : fr[Math.floor(((ph / TAU) % 1 + 1) % 1 * fr.length) % fr.length];
        if (won) img = fr[0];
        shadow(c, hx, G + 2, u * 0.55 * (1 - Math.min(0.5, z / (u * 2))), u * 0.06, 0.28);
        c.save(); c.translate(hx, G - z);
        if (air) c.rotate(clamp(-vz / (gk * 0.9) * 0.35, -0.3, 0.3));
        if (rear) c.rotate(-0.45 * ease(rear / 0.4));
        if (dead && dead.k === 'f') c.rotate(0.2 * ease(dead.t / 0.4));
        if (dead && dead.k === 'w') c.translate(0, u * 0.25 * ease(dead.t / 0.5));
        c.drawImage(img, -u * 0.95, -u * 1.65, u * 1.9, u * 1.75); c.restore();
        // charge gauge next to the horse
        if ((held || chg > 0) && !air && !dead) {
          var gx = hx - u * 0.9, gh = u * 0.9, gy = G - u * 1.3;
          c.fillStyle = 'rgba(10,6,30,.6)'; rr(c, gx - 5, gy - 5, 16, gh + 10, 8); c.fill();
          c.fillStyle = lg(c, 0, gy + gh, 0, gy, ['#22C55E', '#FACC15', '#F97316']); rr(c, gx, gy + gh * (1 - chg), 6, gh * chg, 3); c.fill();
        }
      },
      down: function () { if (!air && !dead) held = true; },
      move: function () { },
      up: function () { if (held && !air && !dead && !rear) jump(); held = false; },
      boom: function () { rear = 0.001; held = false; chg = 0; A.sx('crash'); A.shake(0.2); },
      win: function () { won = 0.001; held = false; chg = 0; A.burst(hx, G - u * 1.2, 16, ['#FDE68A', '#DC2626', '#FFFFFF'], 150, 0.6, 3); },
      dbg: function () { var a = auto(); return { auto: a === 'go' ? 2 : a ? 1 : 0, chg: chg, air: air, z: z / u, dead: dead ? dead.k : '', obs: obs.slice(0, 2).map(function (o) { return [o.k, Math.round(o.x - cam - hx), Math.round(o.h || o.w)]; }) }; }
    };
  }, 'hold', 0.45);

  /* ================================================================== 4. SKATE TRICKS — a half-pipe; the skater rides from edge to edge.
     A ring shrinks on the next edge: TAP when it closes (timing window) to pop a trick. Faster rides, tighter timing. */
  boot('skatetricks', function (A) {
    var W, H, T, dpr, bg, Gf, R, m, cx1, cx2, cyc, F, Lp, sk = null, hs, t = 0, ph = 'ride', pt0 = 0, dir = 1, Tc = 1.3, Ta = 0.62, win = 0.17, popped = false, dead = null, won = 0, snap = null, trickN = 0, airH = 0, spin = 0, nTap = 0;
    function pathAt(s) { // point + "up" rotation on the pipe, s = arc length from the left lip
      var q = Math.PI * R / 2;
      if (s <= q) { var f = Math.PI - s / R; return [cx1 + R * Math.cos(f), cyc + R * Math.sin(f), Math.atan2(-Math.cos(f), Math.sin(f))]; }
      if (s <= q + F) return [cx1 + (s - q), Gf, 0];
      var f2 = Math.PI / 2 - (s - q - F) / R; return [cx2 + R * Math.cos(f2), cyc + R * Math.sin(f2), Math.atan2(-Math.cos(f2), Math.sin(f2))];
    }
    function reset(live) { t = 0; ph = 'ride'; pt0 = live ? 0.9 : 0; dir = 1; popped = false; dead = null; won = 0; snap = null; trickN = 0; spin = 0; nTap = 0; Tc = 1.3; win = 0.17; }
    function rideK(u) { return u - 0.12 * Math.sin(TAU * u); }
    function lipT() { return ph === 'ride' ? pt0 + Tc : pt0; } // when the next edge is reached
    return {
      size: function (ww, hh, uu, d, top) {
        W = ww; H = hh; dpr = d; T = top; m = W * 0.05; Gf = H - (H - T) * 0.08; R = Math.min((H - T) * 0.46, (W - 2 * m) * 0.4); cyc = Gf - R;
        cx1 = m + R; cx2 = W - m - R; F = cx2 - cx1; Lp = Math.PI * R + F; hs = clamp(R * 0.58, 44, 140);
        bg = mkc(W, H, dpr, function (c) {
          c.fillStyle = lg(c, 0, 0, 0, H, ['#0F0A2E', '#3B0764', '#BE185D', '#FB923C']); c.fillRect(0, 0, W, H);
          stars(c, W, H, Math.round(W * H / 6000), 0, cyc * 0.6);
          circ(c, W * 0.78, T + (cyc - T) * 0.3, Math.min(W, H) * 0.07, rg(c, W * 0.78, T + (cyc - T) * 0.3, Math.min(W, H) * 0.07, ['#FFF7ED', '#FED7AA', '#FB923C'], -6, -6));
          var x0 = 0; while (x0 < W) { var bw2 = rnd(24, 60), bh2 = (cyc - T) * rnd(0.25, 0.6); c.fillStyle = '#1E0B3A'; c.fillRect(x0, cyc - R * 0.35 - bh2, bw2, bh2 + 2); c.fillStyle = 'rgba(253,224,71,.5)'; for (var yy = cyc - R * 0.35 - bh2 + 5; yy < cyc - R * 0.35 - 4; yy += 8) for (var xx = x0 + 4; xx < x0 + bw2 - 4; xx += 7) if (Math.random() < 0.25) c.fillRect(xx, yy, 3, 3); x0 += bw2 + rnd(2, 8); }
          // graffiti wall behind the ramp
          var wy = cyc - R * 0.35; c.fillStyle = lg(c, 0, wy, 0, Gf, ['#3F3F46', '#27272A']); c.fillRect(0, wy, W, Gf - wy);
          c.strokeStyle = 'rgba(0,0,0,.25)'; c.lineWidth = 1; for (var by = wy; by < Gf; by += 14) { c.beginPath(); c.moveTo(0, by); c.lineTo(W, by); c.stroke(); }
          c.lineWidth = Math.max(4, R * 0.06); c.lineCap = 'round'; c.lineJoin = 'round';
          [['#22D3EE', 0.2], ['#F472B6', 0.5], ['#A3E635', 0.78]].forEach(function (g, i) { c.strokeStyle = g[0]; c.globalAlpha = 0.32; c.beginPath(); var gx = W * g[1], gy = wy + (cyc - wy) * 0.6 + R * 0.15; c.moveTo(gx - R * 0.25, gy); c.bezierCurveTo(gx - R * 0.1, gy - R * 0.3, gx, gy + R * 0.2, gx + R * 0.12, gy - R * 0.15); c.quadraticCurveTo(gx + R * 0.3, gy - R * 0.3, gx + R * 0.28, gy + R * 0.05); c.stroke(); });
          c.globalAlpha = 1;
          // ramp: wooden surface (the pipe shape), decks, coping
          c.beginPath(); c.moveTo(0, cyc); c.lineTo(m, cyc); c.arc(cx1, cyc, R, Math.PI, Math.PI / 2, true); c.lineTo(cx2, Gf); c.arc(cx2, cyc, R, Math.PI / 2, 0, true); c.lineTo(W, cyc); c.lineTo(W, H); c.lineTo(0, H); c.closePath();
          c.fillStyle = lg(c, 0, cyc, 0, H, ['#7DD3FC', '#38BDF8', '#0369A1']); c.fill();
          c.save(); c.clip(); c.strokeStyle = 'rgba(255,255,255,.12)'; c.lineWidth = 1.5; for (var x = 0; x < W; x += R * 0.22) { c.beginPath(); c.moveTo(x, cyc); c.lineTo(x, H); c.stroke(); } c.restore();
          c.strokeStyle = '#0C4A6E'; c.lineWidth = 3; c.beginPath(); c.moveTo(m, cyc); c.arc(cx1, cyc, R, Math.PI, Math.PI / 2, true); c.lineTo(cx2, Gf); c.arc(cx2, cyc, R, Math.PI / 2, 0, true); c.stroke();
          c.fillStyle = '#334155'; c.fillRect(0, cyc - 4, m, 8); c.fillRect(W - m, cyc - 4, m, 8);
          circ(c, m, cyc, 5, rg(c, m - 1, cyc - 2, 6, ['#F8FAFC', '#94A3B8', '#475569'])); circ(c, W - m, cyc, 5, rg(c, W - m - 1, cyc - 2, 6, ['#F8FAFC', '#94A3B8', '#475569']));
          c.fillStyle = '#E2E8F0'; c.fillRect(0, cyc - 1, m - 3, 2); c.fillRect(W - m + 3, cyc - 1, m - 3, 2);
        });
        var pal = { skin: '#C68B5E', hair: '#1A1110', top: ['#F97316', '#C2410C'], bottom: ['#1E3A8A', '#172554'], shoe: '#F8FAFC' };
        sk = rigOne(hs, { view: 'side', pose: 'ready', pal: pal });
        if (!sk) sk = mkc(hs * 1.2, hs * 1.12, sdpr(), function (c) { c.translate(hs * 0.6, hs * 1.08); limb(c, -hs * 0.1, 0, 0, -hs * 0.5, hs * 0.14, hs * 0.14, '#1E3A8A'); limb(c, 0, -hs * 0.5, hs * 0.05, -hs * 0.8, hs * 0.2, hs * 0.18, '#F97316'); circ(c, hs * 0.07, -hs * 0.9, hs * 0.1, '#C68B5E'); });
      },
      reset: function (live) { reset(live); },
      step: function (dt, live) {
        t += dt; var lv = live ? A.lv() : 0.25;
        if (won) { won += dt; return; }
        if (dead || snap) { (dead || snap).t += dt; return; }
        if (ph === 'ride') {
          if (A.idle() && !popped && t > pt0 + Tc - 0.02) { popped = true; }
          if (t >= pt0 + Tc) { ph = 'air'; pt0 += Tc; airH = R * (popped ? rnd(0.5, 0.75) : 0.18); spin = popped ? (Math.random() < 0.5 ? 1 : 2) : 0; Ta = popped ? 0.62 + airH / R * 0.25 : 0.32; }
        } else if (ph === 'air') {
          if (!popped && t > pt0 + win) { // no pop at the edge: the skater slams on the coping
            if (A.live()) { if (A.fail(A.l.fail)) { dead = { t: 0, x: dir > 0 ? W - m : m }; A.shake(0.3); A.burst(dead.x, cyc, 14, ['#E2E8F0', '#F97316'], 160, 0.6, 3); } return; }
            popped = true;
          }
          if (t >= pt0 + Ta) {
            ph = 'ride'; pt0 += Ta; dir = -dir; popped = false; trickN++;
            Tc = Math.max(0.78, 1.3 - lv * 0.42); win = Math.max(0.105, 0.17 - lv * 0.05);
            A.burst(dir > 0 ? m + 6 : W - m - 6, cyc + 10, 6, ['#E0F2FE', '#FFFFFF'], 80, 0.4, 2.2);
          }
        }
      },
      draw: function (c) {
        A.bg(bg);
        var x, y, rot = 0, i;
        // timing ring on the next edge (shrinks to the coping exactly at the moment to tap)
        if (!dead && !won && !snap) {
          var lx = dir > 0 ? W - m : m, tl = lipT(), dtl = tl - t, open = ph === 'ride' ? Math.min(1, dtl / 0.9) : -1;
          if (ph === 'ride' && dtl < 0.9) {
            var rr0 = 14 + 90 * Math.max(0, open), good = Math.abs(dtl) < win;
            c.strokeStyle = good ? '#4ADE80' : '#FDE68A'; c.globalAlpha = 0.35 + 0.65 * (1 - open); c.lineWidth = good ? 5 : 3.5;
            c.beginPath(); c.arc(lx, cyc, rr0, 0, TAU); c.stroke(); c.globalAlpha = 1;
            c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = 2; c.beginPath(); c.arc(lx, cyc, 14, 0, TAU); c.stroke();
          }
          if (ph === 'air' && popped) { circ(c, lx, cyc, 16, 'rgba(74,222,128,' + Math.max(0, 0.5 - (t - pt0)) + ')'); }
        }
        if (ph === 'ride' || won) {
          var u = clamp((t - pt0) / Tc, 0, 1), s = rideK(u) * Lp; if (dir < 0) s = Lp - s; if (won) s = Lp / 2;
          var P = pathAt(s); x = P[0]; y = P[1]; rot = P[2];
        } else {
          var k = clamp((t - pt0) / Ta, 0, 1), lx2 = dir > 0 ? W - m : m;
          x = lx2 - dir * R * 0.05; y = cyc - airH * 4 * k * (1 - k); rot = dir > 0 ? -Math.PI / 2 : Math.PI / 2;
          if (spin) rot += dir * TAU * spin * ease(k) * (k < 0.9 ? 1 : 1);
        }
        if (dead) { var dk = Math.min(1, dead.t / 0.8); x = dead.x - (dir > 0 ? 1 : -1) * R * 0.5 * dk; y = cyc + R * 0.85 * dk * dk; rot = (dir > 0 ? -1 : 1) * (Math.PI / 2 + dk * 3); }
        if (snap) { var sk2 = Math.min(1, snap.t / 0.8); y += -R * 0.4 * Math.sin(sk2 * Math.PI); rot += sk2 * 4 * dir; }
        // board (under the feet, along the "up" rotation)
        c.save(); c.translate(x, y); c.rotate(rot);
        var bw = hs * 0.7;
        if (!snap) { c.fillStyle = '#1C1917'; rr(c, -bw / 2, -hs * 0.06, bw, hs * 0.05, hs * 0.025); c.fill(); c.fillStyle = '#FACC15'; c.fillRect(-bw / 2 + 4, -hs * 0.05, bw - 8, hs * 0.012); circ(c, -bw * 0.32, -hs * 0.005, hs * 0.03, '#F8FAFC'); circ(c, bw * 0.32, -hs * 0.005, hs * 0.03, '#F8FAFC'); }
        else { c.fillStyle = '#1C1917'; c.save(); c.rotate(-0.6); c.fillRect(-bw / 2, -hs * 0.06, bw / 2, hs * 0.05); c.restore(); c.save(); c.rotate(0.6); c.fillRect(0, -hs * 0.06, bw / 2, hs * 0.05); c.restore(); }
        c.scale(dir, 1); c.drawImage(sk, -sk.w / 2, -sk.h + hs * 0.02 - hs * 0.05, sk.w, sk.h);
        c.restore();
        if (ph === 'air' && spin && !dead && (t - pt0) < Ta * 0.8) { for (i = 0; i < 3; i++) spark(c, x + rnd(-hs * 0.5, hs * 0.5), y + rnd(-hs * 0.8, hs * 0.2), 4, '#FDE68A'); }
      },
      act: function () { // a tap: pop at the edge, or too early
        if (dead || won || snap) return;
        nTap++;
        if (ph === 'air') { if (!popped && t - pt0 <= win) { popped = true; airH = R * rnd(0.5, 0.75); spin = Math.random() < 0.5 ? 1 : 2; Ta = 0.62 + airH / R * 0.25; A.sx('whoosh', { v: 0.5 }); } return; }
        var dtl = pt0 + Tc - t;
        if (dtl <= win) { popped = true; A.sx('whoosh', { v: 0.5 }); return; }
        if (dtl < 0.5 && A.live()) { if (A.fail(A.l.fail2)) { dead = { t: 0, x: dir > 0 ? W - m : m }; t = pt0 + Tc; ph = 'air'; A.shake(0.25); } }
      },
      boom: function () { snap = { t: 0 }; A.shake(0.3); A.sx('crash'); },
      win: function () { won = 0.001; A.burst(W / 2, Gf - hs, 16, ['#FDE68A', '#F97316', '#FFFFFF'], 150, 0.6, 3); },
      dbg: function () { return { ph: ph, dtl: ph === 'ride' ? pt0 + Tc - t : pt0 - t, win: win, popped: popped, dead: dead ? 1 : 0, tricks: trickN }; }
    };
  }, 'tap', 0.4);
})(window.D6 = window.D6 || {});
