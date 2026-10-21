/* v2850 — "You're in control" group 7 (owner request, round 6: "I love war games"): TANK BATTLE (artillery duel),
   SNIPER (city at dusk, scope), GUNSHIP (attack helicopter), DOGFIGHT (jet fight over the sea), TRENCH DEFENSE, COMMANDO
   RUN (soldiers with a real run cycle), ALIEN WAVE (the marching fleet) and CITY SHIELD (missile defence).
   Shaded vehicles and soldiers with real proportions, muzzle flashes, debris, smoke. MIXED MODE like every "You're in
   control" game: the multiplier follows the SERVER clock (×e^(rate·s), casino_ext.php 'skill', rate 0.03 → ×2 after
   ~23 s), the gold button cashes out, a mistake loses (K.multi 'fail'), and the server's secret end arrives as an
   unavoidable event (air raid, artillery, missile swarm, ambush). Canvas 2D, sprites pre-drawn once per size, DPR ≤ 2,
   one RAF, pauses when hidden. Same engine as js/games/skill6.js (copied: each module file stands alone).
   This file only draws: the server decides and pays. */
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
    tankbattle: {
      en: ['Pull back to aim, release to fire', 'Your tank is hit!', 'Air raid!', 'Pull back from your tank to aim (like a slingshot) and release to fire a shell. Each enemy tank shows a reload bar: destroy it before the bar is full, or its shell hits you. Enemies come faster and closer, and the wind changes.'],
      fr: ['Tire en arrière pour viser, lâche', 'Ton char est touché !', 'Raid aérien !', 'Tire en arrière depuis ton char pour viser (comme une fronde) et lâche pour tirer un obus. Chaque char ennemi a une barre de rechargement : détruis-le avant qu’elle soit pleine, sinon son obus te touche. Les ennemis arrivent plus vite et plus près, et le vent change.'],
      es: ['Tira hacia atrás y suelta para disparar', '¡Tu tanque fue alcanzado!', '¡Ataque aéreo!', 'Tira hacia atrás desde tu tanque para apuntar (como un tirachinas) y suelta para disparar un proyectil. Cada tanque enemigo tiene una barra de recarga: destrúyelo antes de que se llene o su disparo te alcanzará. Los enemigos llegan más rápido y más cerca, y el viento cambia.'],
      pt: ['Puxe para trás e solte para atirar', 'Seu tanque foi atingido!', 'Ataque aéreo!', 'Puxe para trás a partir do seu tanque para mirar (como um estilingue) e solte para disparar. Cada tanque inimigo tem uma barra de recarga: destrua-o antes que ela encha, ou o disparo dele te atinge. Os inimigos chegam mais rápido e mais perto, e o vento muda.'],
      ar: ['اسحب للخلف للتصويب ثم أفلت', 'أُصيبت دبابتك!', 'غارة جوية!', 'اسحب للخلف من دبابتك للتصويب (مثل المقلاع) ثم أفلت لإطلاق القذيفة. لكل دبابة معادية شريط تلقيم: دمّرها قبل أن يمتلئ وإلا أصابتك قذيفتها. يأتي الأعداء أسرع وأقرب، وتتغير الرياح.'],
      tr: ['Nişan için geri çek, bırakıp ateşle', 'Tankın vuruldu!', 'Hava saldırısı!', 'Nişan almak için tankından geriye çek (sapan gibi) ve mermiyi atmak için bırak. Her düşman tankının bir dolum çubuğu var: çubuk dolmadan onu yok et, yoksa mermisi seni vurur. Düşmanlar daha hızlı ve yakın gelir, rüzgâr değişir.'],
      vi: ['Kéo lùi để ngắm, thả ra để bắn', 'Xe tăng trúng đạn!', 'Không kích!', 'Kéo lùi từ xe tăng của bạn để ngắm (như ná cao su) rồi thả ra để bắn. Mỗi xe tăng địch có thanh nạp đạn: hãy phá hủy nó trước khi thanh đầy, nếu không đạn của nó sẽ trúng bạn. Địch đến nhanh hơn, gần hơn và gió đổi hướng.'],
      id: ['Tarik ke belakang, lepas untuk menembak', 'Tankmu kena!', 'Serangan udara!', 'Tarik ke belakang dari tankmu untuk membidik (seperti ketapel) lalu lepas untuk menembak. Setiap tank musuh punya bar isi ulang: hancurkan sebelum bar penuh, atau pelurunya mengenaimu. Musuh datang makin cepat dan dekat, dan angin berubah.'],
      ru: ['Оттяни назад и отпусти — выстрел', 'Твой танк подбит!', 'Авианалёт!', 'Оттяни палец назад от танка, чтобы прицелиться (как из рогатки), и отпусти, чтобы выстрелить. У каждого вражеского танка есть шкала перезарядки: уничтожь его, пока она не заполнилась, иначе он попадёт в тебя. Враги приходят быстрее и ближе, ветер меняется.'],
      de: ['Zurückziehen, loslassen zum Feuern', 'Dein Panzer ist getroffen!', 'Luftangriff!', 'Zieh vom Panzer aus zurück, um zu zielen (wie eine Schleuder), und lass los, um zu feuern. Jeder feindliche Panzer hat einen Ladebalken: zerstöre ihn, bevor der Balken voll ist, sonst trifft dich sein Schuss. Die Feinde kommen schneller und näher, der Wind dreht.'],
      hi: ['निशाने को पीछे खींचें, छोड़ें तो फायर', 'आपका टैंक लगा!', 'हवाई हमला!', 'निशाना लगाने के लिए अपने टैंक से पीछे खींचें (गुलेल की तरह) और गोला दागने के लिए छोड़ें। हर दुश्मन टैंक पर रीलोड पट्टी है: पट्टी भरने से पहले उसे उड़ा दें, वरना उसका गोला आपको लगेगा। दुश्मन तेज़ और पास आते हैं, हवा बदलती है।'],
      zh: ['向后拉瞄准，松开开炮', '你的坦克被击中！', '空袭！', '从你的坦克向后拉动瞄准（像弹弓一样），松开即可开炮。每辆敌方坦克都有装填条：在装填条满之前摧毁它，否则它的炮弹会击中你。敌人来得越来越快、越来越近，风向也会变化。']
    },
    sniper: {
      en: ['Drag the scope, release to shoot', 'You were spotted!', 'Artillery strike!', 'Drag to move the scope (it sways a little) and release to shoot at its centre. Hit each enemy soldier before he aims at you — his red ring closes. Never shoot a civilian in white. Enemies appear faster and further away.', 'Civilian hit!'],
      fr: ['Glisse la lunette, lâche pour tirer', 'Tu as été repéré !', 'Tir d’artillerie !', 'Glisse pour déplacer la lunette (elle bouge un peu) et lâche pour tirer au centre. Touche chaque soldat ennemi avant qu’il te vise — son anneau rouge se referme. Ne tire jamais sur un civil en blanc. Les ennemis apparaissent plus vite et plus loin.', 'Civil touché !'],
      es: ['Mueve la mira, suelta para disparar', '¡Te han descubierto!', '¡Ataque de artillería!', 'Desliza para mover la mira (se mueve un poco) y suelta para disparar al centro. Alcanza a cada soldado enemigo antes de que te apunte: su anillo rojo se cierra. Nunca dispares a un civil de blanco. Los enemigos aparecen más rápido y más lejos.', '¡Civil alcanzado!'],
      pt: ['Mova a mira, solte para atirar', 'Você foi avistado!', 'Ataque de artilharia!', 'Deslize para mover a mira (ela balança um pouco) e solte para atirar no centro. Acerte cada soldado inimigo antes que ele mire em você — o anel vermelho dele se fecha. Nunca atire em um civil de branco. Os inimigos aparecem mais rápido e mais longe.', 'Civil atingido!'],
      ar: ['حرّك المنظار ثم أفلت للرمي', 'لقد كُشفت!', 'قصف مدفعي!', 'اسحب لتحريك المنظار (يهتز قليلًا) ثم أفلت لإطلاق النار على مركزه. أصب كل جندي معادٍ قبل أن يصوّب نحوك — حلقته الحمراء تنغلق. لا تطلق النار أبدًا على مدني بالأبيض. يظهر الأعداء أسرع وأبعد.', 'أصبت مدنيًا!'],
      tr: ['Dürbünü kaydır, bırakıp ateş et', 'Fark edildin!', 'Topçu atışı!', 'Dürbünü taşımak için kaydır (biraz sallanır) ve merkezine ateş etmek için bırak. Her düşman askerini sana nişan almadan vur — kırmızı halkası kapanır. Beyazlı bir sivile asla ateş etme. Düşmanlar daha hızlı ve uzakta belirir.', 'Sivil vuruldu!'],
      vi: ['Kéo ống ngắm, thả ra để bắn', 'Bạn bị phát hiện!', 'Pháo kích!', 'Kéo để di chuyển ống ngắm (hơi rung) và thả ra để bắn vào tâm. Bắn trúng từng lính địch trước khi hắn ngắm bạn — vòng đỏ của hắn khép lại. Không bao giờ bắn dân thường mặc áo trắng. Địch xuất hiện nhanh hơn và xa hơn.', 'Trúng dân thường!'],
      id: ['Geser teropong, lepas untuk menembak', 'Kamu ketahuan!', 'Serangan artileri!', 'Geser untuk menggerakkan teropong (sedikit bergoyang) lalu lepas untuk menembak ke tengahnya. Kenai setiap tentara musuh sebelum ia membidikmu — cincin merahnya menutup. Jangan pernah menembak warga sipil berbaju putih. Musuh muncul makin cepat dan jauh.', 'Warga sipil kena!'],
      ru: ['Веди прицел, отпусти — выстрел', 'Тебя заметили!', 'Артобстрел!', 'Веди пальцем прицел (он слегка качается) и отпусти, чтобы выстрелить в центр. Порази каждого вражеского солдата, пока он не прицелился — его красное кольцо сужается. Никогда не стреляй в мирного в белом. Враги появляются быстрее и дальше.', 'Попал в мирного!'],
      de: ['Zielfernrohr ziehen, loslassen', 'Du wurdest entdeckt!', 'Artillerieschlag!', 'Ziehe, um das Zielfernrohr zu bewegen (es wackelt etwas), und lass los, um in die Mitte zu schießen. Triff jeden feindlichen Soldaten, bevor er auf dich zielt — sein roter Ring schließt sich. Schieße nie auf einen Zivilisten in Weiß. Die Feinde erscheinen schneller und weiter weg.', 'Zivilist getroffen!'],
      hi: ['स्कोप खींचें, छोड़ें तो गोली', 'आप देख लिए गए!', 'तोपखाने का हमला!', 'स्कोप हिलाने के लिए खींचें (थोड़ा डोलता है) और बीच में गोली चलाने के लिए छोड़ें। हर दुश्मन सैनिक को निशाना साधने से पहले मारें — उसका लाल घेरा बंद होता है। सफ़ेद कपड़ों वाले नागरिक पर कभी गोली न चलाएँ। दुश्मन तेज़ी से और दूर दिखते हैं।', 'नागरिक को लगी!'],
      zh: ['拖动瞄准镜，松开射击', '你被发现了！', '炮火袭击！', '拖动移动瞄准镜（会轻微晃动），松开即向中心射击。在敌兵瞄准你之前击中他——他的红圈会逐渐收紧。绝不能射击穿白衣的平民。敌人出现得越来越快、越来越远。', '误伤平民！']
    },
    gunship: {
      en: ['Drag up or down to fly', 'Shot down!', 'Missile swarm!', 'Drag up or down: the helicopter follows your finger and fires by itself. Shoot the enemy helicopters and ground guns, dodge their bullets, rockets and the mountains. A single hit brings you down.'],
      fr: ['Glisse en haut ou en bas pour voler', 'Abattu !', 'Essaim de missiles !', 'Glisse vers le haut ou le bas : l’hélicoptère suit ton doigt et tire tout seul. Abats les hélicoptères ennemis et les canons au sol, évite leurs balles, leurs roquettes et les montagnes. Un seul coup te fait tomber.'],
      es: ['Desliza arriba o abajo para volar', '¡Derribado!', '¡Enjambre de misiles!', 'Desliza hacia arriba o abajo: el helicóptero sigue tu dedo y dispara solo. Derriba helicópteros enemigos y cañones de tierra, esquiva sus balas, cohetes y las montañas. Un solo impacto te derriba.'],
      pt: ['Deslize para cima ou baixo para voar', 'Abatido!', 'Enxame de mísseis!', 'Deslize para cima ou para baixo: o helicóptero segue seu dedo e atira sozinho. Derrube helicópteros inimigos e canhões no chão, desvie das balas, foguetes e montanhas. Um único tiro te derruba.'],
      ar: ['اسحب لأعلى أو لأسفل للطيران', 'أُسقطت!', 'سرب صواريخ!', 'اسحب لأعلى أو لأسفل: تتبع المروحية إصبعك وتطلق النار وحدها. أسقط المروحيات المعادية والمدافع الأرضية، وتفادَ رصاصها وصواريخها والجبال. إصابة واحدة تُسقطك.'],
      tr: ['Uçmak için yukarı ya da aşağı kaydır', 'Düşürüldün!', 'Füze sürüsü!', 'Yukarı ya da aşağı kaydır: helikopter parmağını izler ve kendisi ateş eder. Düşman helikopterlerini ve yer toplarını vur; mermilerinden, roketlerinden ve dağlardan kaç. Tek bir isabet seni düşürür.'],
      vi: ['Kéo lên hoặc xuống để bay', 'Bị bắn rơi!', 'Bầy tên lửa!', 'Kéo lên hoặc xuống: trực thăng bay theo ngón tay và tự bắn. Hạ trực thăng địch và pháo mặt đất, né đạn, rocket và núi. Chỉ một phát trúng là rơi.'],
      id: ['Geser naik atau turun untuk terbang', 'Tertembak jatuh!', 'Kawanan rudal!', 'Geser naik atau turun: helikopter mengikuti jarimu dan menembak sendiri. Tembak helikopter musuh dan meriam darat, hindari peluru, roket, dan gunung. Satu tembakan menjatuhkanmu.'],
      ru: ['Веди вверх или вниз — полёт', 'Сбит!', 'Рой ракет!', 'Веди пальцем вверх или вниз: вертолёт следует за пальцем и стреляет сам. Сбивай вражеские вертолёты и зенитки, уклоняйся от пуль, ракет и гор. Одно попадание — и ты сбит.'],
      de: ['Hoch oder runter ziehen zum Fliegen', 'Abgeschossen!', 'Raketenschwarm!', 'Ziehe nach oben oder unten: Der Hubschrauber folgt deinem Finger und feuert von selbst. Schieß feindliche Hubschrauber und Bodengeschütze ab, weiche Kugeln, Raketen und Bergen aus. Ein einziger Treffer holt dich runter.'],
      hi: ['उड़ने को ऊपर या नीचे खींचें', 'मार गिराए गए!', 'मिसाइलों का झुंड!', 'ऊपर या नीचे खींचें: हेलिकॉप्टर उँगली के पीछे चलता है और खुद फायर करता है। दुश्मन हेलिकॉप्टर और ज़मीनी तोपें गिराएँ, उनकी गोलियों, रॉकेटों और पहाड़ों से बचें। एक ही वार आपको गिरा देता है।'],
      zh: ['上下拖动控制飞行', '被击落！', '导弹群！', '上下拖动：直升机跟随手指并自动开火。击落敌方直升机和地面炮台，躲开子弹、火箭和山峰。被击中一次就会坠落。']
    },
    dogfight: {
      en: ['Drag to steer your fighter', 'Shot down!', 'Squadron ambush!', 'Drag where you want to fly: your fighter turns toward your finger and fires by itself. Get behind the enemy fighters, dodge their bullets, and turn hard when a missile warning flashes. A single hit ends the round.'],
      fr: ['Glisse pour piloter ton chasseur', 'Abattu !', 'Embuscade d’escadrille !', 'Glisse là où tu veux voler : ton chasseur tourne vers ton doigt et tire tout seul. Place-toi derrière les chasseurs ennemis, évite leurs balles, et vire fort quand l’alerte missile clignote. Un seul coup termine la partie.'],
      es: ['Desliza para pilotar tu caza', '¡Derribado!', '¡Emboscada de escuadrilla!', 'Desliza hacia donde quieras volar: tu caza gira hacia tu dedo y dispara solo. Ponte detrás de los cazas enemigos, esquiva sus balas y gira fuerte cuando parpadee la alerta de misil. Un solo impacto termina la ronda.'],
      pt: ['Deslize para pilotar seu caça', 'Abatido!', 'Emboscada de esquadrilha!', 'Deslize para onde quer voar: seu caça vira na direção do dedo e atira sozinho. Fique atrás dos caças inimigos, desvie das balas e faça curvas fechadas quando o alerta de míssil piscar. Um único tiro encerra a rodada.'],
      ar: ['اسحب لتوجيه مقاتلتك', 'أُسقطت!', 'كمين سرب!', 'اسحب إلى حيث تريد الطيران: تستدير مقاتلتك نحو إصبعك وتطلق النار وحدها. تموضع خلف مقاتلات العدو، وتفادَ رصاصها، وانعطف بقوة عندما يومض إنذار الصاروخ. إصابة واحدة تنهي الجولة.'],
      tr: ['Savaş uçağını kaydırarak yönet', 'Düşürüldün!', 'Filo pususu!', 'Uçmak istediğin yere kaydır: uçağın parmağına döner ve kendisi ateş eder. Düşman uçaklarının arkasına geç, mermilerinden kaç ve füze uyarısı yanıp sönünce sert dön. Tek bir isabet turu bitirir.'],
      vi: ['Kéo để lái tiêm kích', 'Bị bắn rơi!', 'Phi đội phục kích!', 'Kéo tới nơi bạn muốn bay: máy bay quay về phía ngón tay và tự bắn. Bám đuôi tiêm kích địch, né đạn và ngoặt gấp khi cảnh báo tên lửa nhấp nháy. Chỉ một phát trúng là kết thúc ván.'],
      id: ['Geser untuk mengemudikan jet', 'Tertembak jatuh!', 'Penyergapan skuadron!', 'Geser ke arah terbangmu: jetmu berbelok ke jari dan menembak sendiri. Posisikan diri di belakang jet musuh, hindari peluru, dan belok tajam saat peringatan rudal berkedip. Satu tembakan mengakhiri ronde.'],
      ru: ['Веди — управляй истребителем', 'Сбит!', 'Засада эскадрильи!', 'Веди пальцем туда, куда хочешь лететь: истребитель поворачивает к пальцу и стреляет сам. Заходи в хвост врагам, уклоняйся от пуль и резко поворачивай, когда мигает ракетная тревога. Одно попадание завершает раунд.'],
      de: ['Ziehen, um den Jäger zu steuern', 'Abgeschossen!', 'Staffel-Hinterhalt!', 'Ziehe dorthin, wo du hinfliegen willst: Dein Jäger dreht zu deinem Finger und feuert von selbst. Setz dich hinter die feindlichen Jäger, weiche ihren Kugeln aus und kurve scharf, wenn die Raketenwarnung blinkt. Ein Treffer beendet die Runde.'],
      hi: ['फ़ाइटर चलाने को खींचें', 'मार गिराए गए!', 'स्क्वाड्रन का घात!', 'जहाँ उड़ना है वहाँ खींचें: आपका फ़ाइटर उँगली की ओर मुड़ता है और खुद फायर करता है। दुश्मन फ़ाइटरों के पीछे जाएँ, उनकी गोलियों से बचें, और मिसाइल चेतावनी चमके तो तेज़ मुड़ें। एक ही वार राउंड खत्म करता है।'],
      zh: ['拖动驾驶你的战斗机', '被击落！', '中队伏击！', '向想飞的方向拖动：战斗机会转向手指并自动开火。绕到敌机身后，躲开子弹，导弹警报闪烁时急转弯。被击中一次，本回合结束。']
    },
    trenchdef: {
      en: ['Tap the soldiers to shoot', 'The trench is overrun!', 'Bombers overhead!', 'Enemy soldiers charge your trench: tap each one to shoot him (a short reload after each shot). Shoot the grenades in the air too. More and faster soldiers come with time. If one reaches the trench, the round ends.', 'Grenade!'],
      fr: ['Touche les soldats pour tirer', 'La tranchée est prise !', 'Bombardiers en vue !', 'Des soldats ennemis chargent ta tranchée : touche chacun pour tirer (petit rechargement après chaque tir). Abats aussi les grenades en l’air. Ils arrivent plus nombreux et plus vite avec le temps. Si l’un atteint la tranchée, la partie est finie.', 'Grenade !'],
      es: ['Toca a los soldados para disparar', '¡La trinchera cayó!', '¡Bombarderos encima!', 'Soldados enemigos cargan contra tu trinchera: toca a cada uno para disparar (breve recarga tras cada tiro). Derriba también las granadas en el aire. Llegan más y más rápido con el tiempo. Si uno alcanza la trinchera, la ronda termina.', '¡Granada!'],
      pt: ['Toque nos soldados para atirar', 'A trincheira caiu!', 'Bombardeiros acima!', 'Soldados inimigos atacam sua trincheira: toque em cada um para atirar (breve recarga após cada tiro). Acerte também as granadas no ar. Chegam mais e mais rápido com o tempo. Se um alcançar a trincheira, a rodada termina.', 'Granada!'],
      ar: ['المس الجنود لإطلاق النار', 'سقط الخندق!', 'قاذفات فوقنا!', 'يهاجم جنود العدو خندقك: المس كل جندي لإطلاق النار عليه (تلقيم قصير بعد كل طلقة). أسقط القنابل في الهواء أيضًا. يأتي المزيد وبسرعة أكبر مع الوقت. إذا وصل أحدهم إلى الخندق تنتهي الجولة.', 'قنبلة!'],
      tr: ['Ateş için askerlere dokun', 'Siper düştü!', 'Bombardıman uçakları!', 'Düşman askerleri siperine hücum ediyor: her birine ateş etmek için dokun (her atıştan sonra kısa dolum). Havadaki el bombalarını da vur. Zamanla daha çok ve daha hızlı gelirler. Biri sipere ulaşırsa tur biter.', 'El bombası!'],
      vi: ['Chạm vào lính để bắn', 'Chiến hào thất thủ!', 'Máy bay ném bom!', 'Lính địch xông vào chiến hào: chạm từng tên để bắn (nạp đạn ngắn sau mỗi phát). Bắn cả lựu đạn trên không. Địch đến đông hơn và nhanh hơn theo thời gian. Một tên chạm chiến hào là kết thúc ván.', 'Lựu đạn!'],
      id: ['Ketuk tentara untuk menembak', 'Parit jatuh!', 'Pengebom datang!', 'Tentara musuh menyerbu paritmu: ketuk setiap tentara untuk menembak (isi ulang singkat setiap tembakan). Tembak juga granat di udara. Makin lama makin banyak dan cepat. Jika satu mencapai parit, ronde berakhir.', 'Granat!'],
      ru: ['Тап по солдатам — выстрел', 'Окоп захвачен!', 'Бомбардировщики!', 'Вражеские солдаты атакуют твой окоп: нажимай на каждого, чтобы выстрелить (короткая перезарядка после выстрела). Сбивай и гранаты в воздухе. Со временем их всё больше и они быстрее. Если кто-то добежит до окопа, раунд окончен.', 'Граната!'],
      de: ['Tippe auf die Soldaten', 'Der Graben ist überrannt!', 'Bomber im Anflug!', 'Feindliche Soldaten stürmen deinen Graben: tippe jeden an, um zu schießen (kurzes Nachladen nach jedem Schuss). Schieß auch die Granaten in der Luft ab. Mit der Zeit kommen mehr und schnellere. Erreicht einer den Graben, endet die Runde.', 'Granate!'],
      hi: ['गोली के लिए सैनिकों पर टैप', 'खाई पर कब्ज़ा हो गया!', 'ऊपर बमवर्षक!', 'दुश्मन सैनिक आपकी खाई पर धावा बोलते हैं: हर एक पर टैप करके गोली चलाएँ (हर गोली के बाद थोड़ा रीलोड)। हवा में ग्रेनेड भी मार गिराएँ। समय के साथ ज़्यादा और तेज़ आते हैं। कोई खाई तक पहुँचा तो राउंड खत्म।', 'ग्रेनेड!'],
      zh: ['点击士兵射击', '战壕失守！', '轰炸机来袭！', '敌军士兵冲向你的战壕：点击每个士兵射击（每枪后短暂装弹）。也要击落空中的手榴弹。随着时间推移，敌人越来越多、越来越快。有人冲到战壕，本回合结束。', '手榴弹！']
    },
    commando: {
      en: ['Swipe up to jump · down to slide · tap to shoot', 'Hit!', 'Airstrike!', 'Your commando runs by himself. Swipe up to jump over wire and mines, swipe down to slide under barriers, tap to shoot the soldiers ahead before they fire. The run gets faster and faster. One hit ends the round.'],
      fr: ['Haut : saut · bas : glissade · touche : tir', 'Touché !', 'Frappe aérienne !', 'Ton commando court tout seul. Glisse vers le haut pour sauter les barbelés et les mines, vers le bas pour glisser sous les barrières, touche pour abattre les soldats devant avant qu’ils tirent. La course accélère sans cesse. Un seul coup termine la partie.'],
      es: ['Arriba: salto · abajo: deslizar · toca: disparo', '¡Alcanzado!', '¡Ataque aéreo!', 'Tu comando corre solo. Desliza hacia arriba para saltar alambradas y minas, hacia abajo para deslizarte bajo barreras, toca para abatir a los soldados de delante antes de que disparen. La carrera acelera sin parar. Un solo impacto termina la ronda.'],
      pt: ['Cima: pulo · baixo: deslizar · toque: tiro', 'Atingido!', 'Ataque aéreo!', 'Seu comando corre sozinho. Deslize para cima para pular arame e minas, para baixo para deslizar sob barreiras, toque para abater os soldados à frente antes que atirem. A corrida acelera sem parar. Um único tiro encerra a rodada.'],
      ar: ['أعلى: قفز · أسفل: انزلاق · لمس: إطلاق', 'أُصبت!', 'ضربة جوية!', 'يركض جندي الكوماندوز وحده. اسحب لأعلى للقفز فوق الأسلاك والألغام، ولأسفل للانزلاق تحت الحواجز، والمس لإسقاط الجنود أمامك قبل أن يطلقوا النار. يتسارع الركض باستمرار. إصابة واحدة تنهي الجولة.'],
      tr: ['Yukarı: zıpla · aşağı: kay · dokun: ateş', 'Vuruldun!', 'Hava saldırısı!', 'Komandon kendi koşar. Tel ve mayınların üstünden atlamak için yukarı, bariyerlerin altından kaymak için aşağı kaydır, öndeki askerleri ateş etmeden vurmak için dokun. Koşu giderek hızlanır. Tek isabet turu bitirir.'],
      vi: ['Vuốt lên: nhảy · xuống: trượt · chạm: bắn', 'Trúng đạn!', 'Không kích!', 'Biệt kích tự chạy. Vuốt lên để nhảy qua dây thép gai và mìn, vuốt xuống để trượt dưới rào chắn, chạm để bắn lính phía trước trước khi chúng nổ súng. Tốc độ ngày càng nhanh. Trúng một phát là kết thúc ván.'],
      id: ['Atas: lompat · bawah: meluncur · ketuk: tembak', 'Kena!', 'Serangan udara!', 'Komandomu berlari sendiri. Geser ke atas untuk melompati kawat dan ranjau, ke bawah untuk meluncur di bawah palang, ketuk untuk menembak tentara di depan sebelum mereka menembak. Lari makin cepat. Satu tembakan mengakhiri ronde.'],
      ru: ['Вверх — прыжок · вниз — подкат · тап — огонь', 'Ранен!', 'Авиаудар!', 'Твой спецназовец бежит сам. Проведи вверх, чтобы перепрыгнуть проволоку и мины, вниз — чтобы проскользнуть под барьером, нажми, чтобы снять солдат впереди, пока они не выстрелили. Бег всё быстрее. Одно попадание завершает раунд.'],
      de: ['Hoch: Sprung · runter: Rutschen · Tippen: Schuss', 'Getroffen!', 'Luftschlag!', 'Dein Kommando rennt von selbst. Wische hoch, um über Draht und Minen zu springen, runter, um unter Sperren durchzurutschen, tippe, um die Soldaten vorn zu erledigen, bevor sie schießen. Das Tempo steigt ständig. Ein Treffer beendet die Runde.'],
      hi: ['ऊपर: कूद · नीचे: फिसलन · टैप: गोली', 'लग गई!', 'हवाई हमला!', 'आपका कमांडो खुद दौड़ता है। तार और माइन पर कूदने को ऊपर, बैरियर के नीचे फिसलने को नीचे स्वाइप करें, आगे के सैनिकों को गोली चलाने से पहले मारने को टैप करें। दौड़ तेज़ होती जाती है। एक वार राउंड खत्म करता है।'],
      zh: ['上滑跳跃·下滑滑铲·点击射击', '中弹！', '空袭！', '你的突击队员会自动奔跑。上滑跳过铁丝网和地雷，下滑从路障下滑过，点击在前方士兵开火前将其击倒。奔跑速度越来越快。被击中一次，本回合结束。']
    },
    alienwave: {
      en: ['Drag to move your cannon', 'Your cannon is hit!', 'Mothership laser!', 'Drag left or right: your cannon follows your finger and fires by itself. Shoot the alien fleet before it lands and dodge the bombs. Each wave is faster. A bomb on your cannon, or an alien reaching the ground, ends the round.', 'Invasion!'],
      fr: ['Glisse pour bouger ton canon', 'Ton canon est touché !', 'Laser du vaisseau mère !', 'Glisse à gauche ou à droite : ton canon suit ton doigt et tire tout seul. Abats la flotte alien avant qu’elle se pose et évite les bombes. Chaque vague est plus rapide. Une bombe sur ton canon, ou un alien qui touche le sol, termine la partie.', 'Invasion !'],
      es: ['Desliza para mover tu cañón', '¡Tu cañón fue alcanzado!', '¡Láser de la nave nodriza!', 'Desliza a la izquierda o derecha: tu cañón sigue tu dedo y dispara solo. Derriba la flota alienígena antes de que aterrice y esquiva las bombas. Cada oleada es más rápida. Una bomba en tu cañón, o un alien que toca el suelo, termina la ronda.', '¡Invasión!'],
      pt: ['Deslize para mover seu canhão', 'Seu canhão foi atingido!', 'Laser da nave-mãe!', 'Deslize para a esquerda ou direita: seu canhão segue o dedo e atira sozinho. Derrube a frota alienígena antes que pouse e desvie das bombas. Cada onda é mais rápida. Uma bomba no canhão, ou um alien tocando o chão, encerra a rodada.', 'Invasão!'],
      ar: ['اسحب لتحريك مدفعك', 'أُصيب مدفعك!', 'ليزر السفينة الأم!', 'اسحب يسارًا أو يمينًا: يتبع مدفعك إصبعك ويطلق النار وحده. أسقط أسطول الفضائيين قبل أن يهبط وتفادَ القنابل. كل موجة أسرع. قنبلة على مدفعك أو فضائي يصل إلى الأرض ينهي الجولة.', 'غزو!'],
      tr: ['Topunu kaydırarak taşı', 'Topun vuruldu!', 'Ana gemi lazeri!', 'Sola ya da sağa kaydır: topun parmağını izler ve kendisi ateş eder. Uzaylı filosunu inmeden vur, bombalarından kaç. Her dalga daha hızlıdır. Topuna düşen bomba ya da yere ulaşan bir uzaylı turu bitirir.', 'İstila!'],
      vi: ['Kéo để di chuyển pháo', 'Pháo trúng đạn!', 'Laser phi thuyền mẹ!', 'Kéo trái hoặc phải: pháo theo ngón tay và tự bắn. Bắn hạ hạm đội người ngoài hành tinh trước khi chúng đáp xuống và né bom. Mỗi đợt nhanh hơn. Bom trúng pháo, hoặc một con chạm đất, là kết thúc ván.', 'Xâm lăng!'],
      id: ['Geser untuk menggerakkan meriam', 'Meriammu kena!', 'Laser kapal induk!', 'Geser ke kiri atau kanan: meriammu mengikuti jari dan menembak sendiri. Tembak armada alien sebelum mendarat dan hindari bomnya. Setiap gelombang lebih cepat. Bom di meriammu, atau alien yang mencapai tanah, mengakhiri ronde.', 'Invasi!'],
      ru: ['Веди — двигай пушку', 'Пушка подбита!', 'Лазер корабля-матки!', 'Веди влево или вправо: пушка следует за пальцем и стреляет сама. Сбей флот пришельцев, пока он не приземлился, и уклоняйся от бомб. Каждая волна быстрее. Бомба в пушку или пришелец у земли завершает раунд.', 'Вторжение!'],
      de: ['Ziehen, um die Kanone zu bewegen', 'Kanone getroffen!', 'Mutterschiff-Laser!', 'Ziehe nach links oder rechts: Deine Kanone folgt dem Finger und feuert von selbst. Schieß die Alienflotte ab, bevor sie landet, und weiche den Bomben aus. Jede Welle ist schneller. Eine Bombe auf die Kanone oder ein Alien am Boden beendet die Runde.', 'Invasion!'],
      hi: ['तोप चलाने को खींचें', 'आपकी तोप पर वार!', 'मदरशिप लेज़र!', 'बाएँ या दाएँ खींचें: तोप उँगली के साथ चलती है और खुद फायर करती है। एलियन बेड़े को उतरने से पहले गिराएँ और बमों से बचें। हर लहर तेज़ होती है। तोप पर बम या ज़मीन तक पहुँचा एलियन राउंड खत्म करता है।', 'आक्रमण!'],
      zh: ['拖动移动你的炮台', '炮台被击中！', '母舰激光！', '左右拖动：炮台跟随手指并自动开火。在外星舰队降落前将其击落，并躲开炸弹。每一波都更快。炸弹击中炮台，或外星人到达地面，本回合结束。', '入侵！']
    },
    cityshield: {
      en: ['Tap to fire an interceptor', 'A city is hit!', 'Mega warhead!', 'Missiles fall toward your cities: tap where to fire — the interceptor flies there and explodes, destroying the missiles in its blast. Aim ahead of them. Some missiles split. A missile hitting a city ends the round.'],
      fr: ['Touche pour lancer un intercepteur', 'Une ville est touchée !', 'Méga-ogive !', 'Des missiles tombent vers tes villes : touche où tirer — l’intercepteur y vole et explose, détruisant les missiles dans son souffle. Vise devant eux. Certains missiles se divisent. Un missile sur une ville termine la partie.'],
      es: ['Toca para lanzar un interceptor', '¡Una ciudad fue alcanzada!', '¡Megaojiva!', 'Caen misiles hacia tus ciudades: toca dónde disparar; el interceptor vuela allí y explota, destruyendo los misiles en su onda. Apunta delante de ellos. Algunos misiles se dividen. Un misil en una ciudad termina la ronda.'],
      pt: ['Toque para lançar um interceptador', 'Uma cidade foi atingida!', 'Mega-ogiva!', 'Mísseis caem sobre suas cidades: toque onde atirar — o interceptador voa até lá e explode, destruindo os mísseis na explosão. Mire à frente deles. Alguns mísseis se dividem. Um míssil numa cidade encerra a rodada.'],
      ar: ['المس لإطلاق صاروخ اعتراضي', 'أُصيبت مدينة!', 'رأس حربي عملاق!', 'تسقط الصواريخ نحو مدنك: المس مكان الإطلاق — يطير الصاروخ الاعتراضي إليه وينفجر مدمرًا الصواريخ في انفجاره. صوّب أمامها. بعض الصواريخ تنقسم. صاروخ يصيب مدينة ينهي الجولة.'],
      tr: ['Önleyici atmak için dokun', 'Bir şehir vuruldu!', 'Dev savaş başlığı!', 'Füzeler şehirlerine düşüyor: atış noktasına dokun — önleyici oraya uçar ve patlar, patlamadaki füzeleri yok eder. Önlerine nişan al. Bazı füzeler bölünür. Bir şehre isabet eden füze turu bitirir.'],
      vi: ['Chạm để bắn tên lửa đánh chặn', 'Một thành phố trúng đòn!', 'Đầu đạn khổng lồ!', 'Tên lửa rơi về các thành phố: chạm nơi muốn bắn — tên lửa đánh chặn bay tới đó và nổ, phá hủy tên lửa trong vụ nổ. Hãy ngắm phía trước chúng. Một số tên lửa tách đôi. Tên lửa trúng thành phố là kết thúc ván.'],
      id: ['Ketuk untuk menembak pencegat', 'Sebuah kota kena!', 'Hulu ledak raksasa!', 'Rudal jatuh ke kota-kotamu: ketuk tempat menembak — pencegat terbang ke sana dan meledak, menghancurkan rudal dalam ledakannya. Bidik di depan rudal. Beberapa rudal terpecah. Rudal yang mengenai kota mengakhiri ronde.'],
      ru: ['Тап — пуск перехватчика', 'Город поражён!', 'Мега-боеголовка!', 'Ракеты падают на твои города: нажми, куда стрелять — перехватчик летит туда и взрывается, уничтожая ракеты во взрыве. Целься с упреждением. Некоторые ракеты разделяются. Попадание в город завершает раунд.'],
      de: ['Tippen: Abfangrakete abfeuern', 'Eine Stadt ist getroffen!', 'Mega-Sprengkopf!', 'Raketen fallen auf deine Städte: tippe, wohin geschossen wird — die Abfangrakete fliegt dorthin und explodiert, die Raketen in der Druckwelle sind zerstört. Ziele vor sie. Manche Raketen teilen sich. Eine Rakete auf eine Stadt beendet die Runde.'],
      hi: ['इंटरसेप्टर दागने को टैप करें', 'एक शहर पर वार!', 'महा-विस्फोटक!', 'मिसाइलें आपके शहरों पर गिरती हैं: जहाँ दागना है वहाँ टैप करें — इंटरसेप्टर वहाँ जाकर फटता है और धमाके की मिसाइलें नष्ट करता है। उनके आगे निशाना लगाएँ। कुछ मिसाइलें बँट जाती हैं। शहर पर गिरी मिसाइल राउंड खत्म करती है।'],
      zh: ['点击发射拦截弹', '城市被击中！', '巨型弹头！', '导弹正落向你的城市：点击发射位置——拦截弹飞到那里爆炸，摧毁爆炸范围内的导弹。要提前瞄准。有些导弹会分裂。导弹击中城市，本回合结束。']
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
      var gs = null;
      cv.addEventListener('pointerdown', function (e) {
        e.preventDefault(); rect = st.getBoundingClientRect();
        if (e.pointerType === 'mouse' && e.button) return;
        if (phase !== 'play') { if (phase === 'idle') nudge(); return; }
        try { cv.setPointerCapture(e.pointerId); } catch (x) { /* ignore */ }
        var p = pt(e);
        if (gest === 'tap' || gest === 'aim') { did('tap', p[0], p[1]); gs = null; return; } // one-tap games act on the touch itself
        if (gest === 'drag') { count(); gs = { id: e.pointerId }; g.down(p[0], p[1]); return; }
        gs = { x: p[0], y: p[1], id: e.pointerId, done: false };
      });
      cv.addEventListener('pointermove', function (e) {
        if (!gs || e.pointerId !== gs.id) return;
        if (gest === 'drag') {
          if (phase !== 'play') { gs = null; return; }
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
        if (gest === 'drag') { if (g.up) g.up(); return; }
        if (!s.done && gest === 'lr') did(s.x < W / 2 ? 'left' : 'right', s.x, s.y); // a tap on the left / right half
        else if (!s.done && gest === 'swipe4') did('tap', s.x, s.y); // v2850: a short touch without movement = tap (rotate, …)
      };
      cv.addEventListener('pointerup', up);
      cv.addEventListener('pointercancel', function () { if (gs && gest === 'drag' && g.up) g.up(); gs = null; });
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
        if (gest === 'drag') { if (g.key) { count(); g.key(k); } return; }
        if (gest === 'aim') { if (g.key) { count(); g.key(k); } return; }
        did(gest === 'tap' ? 'tap' : k, W / 2, H / 2);
      };
      document.addEventListener('keydown', onKey);
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


  /* ------------------------------------------------------------------ shared war art: tanks, soldiers, aircraft (shaded, real proportions) */
  function hullS(w, dpr, pal) { // a tank hull with tracks and road wheels (facing right), w = length
    var h = w * 0.42;
    return mkc(w, h, dpr, function (c) {
      // tracks
      rr(c, w * 0.04, h * 0.5, w * 0.92, h * 0.46, h * 0.23); c.fillStyle = lg(c, 0, h * 0.5, 0, h, ['#3F3F46', '#18181B']); c.fill();
      c.strokeStyle = 'rgba(255,255,255,.12)'; c.lineWidth = 1; for (var i = 0; i < 16; i++) { var x = w * 0.09 + i * w * 0.054; c.beginPath(); c.moveTo(x, h * 0.52); c.lineTo(x, h * 0.58); c.moveTo(x, h * 0.9); c.lineTo(x, h * 0.95); c.stroke(); }
      for (i = 0; i < 6; i++) { var cx = w * 0.15 + i * w * 0.14; circ(c, cx, h * 0.73, h * 0.15, rg(c, cx, h * 0.73, h * 0.15, ['#A1A1AA', '#52525B', '#27272A'], -h * 0.04, -h * 0.05)); circ(c, cx, h * 0.73, h * 0.05, '#18181B'); }
      // hull
      c.beginPath(); c.moveTo(0, h * 0.52); c.lineTo(w * 0.1, h * 0.28); c.lineTo(w * 0.88, h * 0.28); c.lineTo(w, h * 0.46); c.lineTo(w * 0.94, h * 0.56); c.lineTo(w * 0.04, h * 0.6); c.closePath();
      c.fillStyle = lg(c, 0, h * 0.28, 0, h * 0.6, [pal[0], pal[1], pal[2]]); c.fill();
      c.fillStyle = 'rgba(255,255,255,.18)'; c.fillRect(w * 0.1, h * 0.29, w * 0.78, h * 0.035);
      c.fillStyle = 'rgba(0,0,0,.22)'; c.fillRect(w * 0.06, h * 0.5, w * 0.9, h * 0.05);
      // turret (fixed body; the barrel is drawn live)
      c.beginPath(); c.moveTo(w * 0.28, h * 0.29); c.lineTo(w * 0.34, h * 0.06); c.quadraticCurveTo(w * 0.5, 0, w * 0.64, h * 0.06); c.lineTo(w * 0.7, h * 0.29); c.closePath();
      c.fillStyle = lg(c, 0, 0, 0, h * 0.3, [pal[0], pal[1], pal[2]]); c.fill();
      c.fillStyle = 'rgba(255,255,255,.22)'; c.beginPath(); c.ellipse(w * 0.45, h * 0.08, w * 0.1, h * 0.025, 0, 0, TAU); c.fill();
      circ(c, w * 0.42, h * 0.05, h * 0.05, pal[2]); // hatch
      c.fillStyle = pal[3] || '#FDE68A'; c.fillRect(w * 0.18, h * 0.36, w * 0.07, h * 0.06); // emblem
    });
  }
  function barrel(c, x, y, ang, len, th, col, rec) { c.save(); c.translate(x, y); c.rotate(ang); c.fillStyle = lg(c, 0, -th, 0, th, ['#71717A', col, '#18181B']); c.fillRect(-len * 0.05 - rec, -th / 2, len - rec, th); c.fillStyle = '#27272A'; c.fillRect(len * 0.86 - rec, -th * 0.7, len * 0.14, th * 1.4); c.restore(); }
  function boomFx(A, x, y, s) { A.explode(x, y, s); A.sx('boom', { v: Math.min(1, s) }); }

  /* ================================================================== 9. TANK BATTLE — artillery duel: pull back from your tank to
     aim (the guide shows only the start of the arc), release to fire. Each enemy tank fills a reload bar: destroy it first. */
  boot('tankbattle', function (A) {
    var W, H, T, dpr, bg, gY0, tw, pS = null, eS = null, me, en = [], shells = [], aim = null, wind = 0, cool = 0, dead = 0, won = 0, raid = null, t = 0, spawnT = 0, aiT = 0, debris = [], hits = 0, G;
    function gy(x) { return gY0 + Math.sin(x / W * 5.2 + 0.6) * H * 0.025 + Math.sin(x / W * 13 + 1.3) * H * 0.012; }
    function vmax() { return Math.sqrt(1.15 * W * G); }
    function addEnemy(live) {
      var lv = live ? A.lv() : 0.2, x = W * rnd(0.55, 0.92);
      for (var i = 0; i < en.length; i++) if (Math.abs(en[i].tx - x) < tw * 1.3) x = en[i].tx > W * 0.73 ? en[i].tx - tw * 1.5 : en[i].tx + tw * 1.5;
      x = clamp(x, W * 0.5, W * 0.94);
      en.push({ x: W + tw, tx: x, rl: 0, rT: Math.max(2.6, 6.8 - 3.6 * lv) * rnd(0.9, 1.15), ang: Math.PI + 0.6, fired: 0, hp: 1, rec: 0 });
    }
    function solve(tx, ty, err) { // attract mode: angle / speed that lands near (tx, ty)
      var best = null, x0 = me.x + tw * 0.1, y0 = me.y - tw * 0.32;
      for (var a = 0.25; a < 1.35; a += 0.05) for (var v = 0.3; v <= 1; v += 0.035) {
        var vx = Math.cos(a) * v * vmax(), vy = -Math.sin(a) * v * vmax(), x = x0, y = y0, d = 1e9;
        for (var k = 0; k < 120; k++) { x += vx / 30; y += vy / 30; vy += G / 30; vx += wind * G * 0.08 / 30; var dd = Math.hypot(x - tx, y - ty); if (dd < d) d = dd; if (y > gy(x) + 4) break; }
        if (!best || d < best.d) best = { d: d, a: a, v: v };
      }
      return { a: best.a + rnd(-err, err), v: best.v + rnd(-err, err) * 0.5 };
    }
    function fire(ang, pw) {
      if (cool > 0 || dead || raid || won) return;
      var bx = me.x + tw * 0.1 + Math.cos(ang) * tw * 0.55, by = me.y - tw * 0.32 - Math.sin(ang) * tw * 0.55;
      shells.push({ x: bx, y: by, vx: Math.cos(ang) * pw * vmax(), vy: -Math.sin(ang) * pw * vmax(), me: 1, tr: [] });
      me.rec = tw * 0.08; me.ang = ang; cool = 0.55; A.burst(bx, by, 6, ['#FEF3C7', '#FDBA74', '#9CA3AF'], 90, 0.4, 3, -20); A.sx('gun', { k: 'cannon' });
    }
    function enemyShot(e) { var x0 = e.x - tw * 0.1, y0 = gy(e.x) - tw * 0.32, tx = me.x, ty = me.y - tw * 0.15, T2 = 1.1; shells.push({ x: x0, y: y0, vx: (tx - x0) / T2, vy: (ty - y0) / T2 - G * T2 / 2, me: 0, tr: [], hit: A.live() }); e.rec = tw * 0.08; A.sx('gun', { k: 'cannon', v: 0.6 }); A.burst(x0 - tw * 0.4, y0, 6, ['#FEF3C7', '#FDBA74'], 80, 0.35, 3, -20); }
    function guide(c, ax, ay) {
      var len = Math.hypot(ax, ay), L = Math.min(W, H) * 0.32, pw = clamp(len / L, 0.15, 1), ang = clamp(Math.atan2(ay, ax), 0.05, 1.5);
      var x = me.x + tw * 0.1 + Math.cos(ang) * tw * 0.55, y = me.y - tw * 0.32 - Math.sin(ang) * tw * 0.55, vx = Math.cos(ang) * pw * vmax(), vy = -Math.sin(ang) * pw * vmax();
      c.fillStyle = '#FEF3C7';
      for (var k = 0; k < 14; k++) { for (var q = 0; q < 2; q++) { x += vx / 60; y += vy / 60; vy += G / 60; vx += wind * G * 0.08 / 60; } c.globalAlpha = 0.9 - k / 16; circ(c, x, y, 2.4, '#FEF3C7'); }
      c.globalAlpha = 1;
      // power gauge
      rr(c, me.x - tw * 0.5, me.y + 6, tw, 6, 3); c.fillStyle = 'rgba(0,0,0,.4)'; c.fill(); rr(c, me.x - tw * 0.5, me.y + 6, tw * pw, 6, 3); c.fillStyle = pw > 0.85 ? '#F43F5E' : '#FACC15'; c.fill();
      return [ang, pw];
    }
    return {
      size: function (w, h, uu, d, top) {
        W = w; H = h; dpr = d; T = top; gY0 = H * 0.86; tw = clamp(Math.min(W * 0.22, (H - T) * 0.2), 60, 140); G = H * 1.2;
        pS = hullS(tw, dpr, ['#86A55B', '#4D6B2E', '#2E4119', '#FDE68A']); eS = hullS(tw, dpr, ['#C9B48A', '#8A7651', '#4F4330', '#DC2626']);
        bg = mkc(W, H, dpr, function (c) {
          c.fillStyle = lg(c, 0, 0, 0, H, ['#1E293B', '#7C2D12', '#F59E0B']); c.fillRect(0, 0, W, H);
          circ(c, W * 0.7, H * 0.55, H * 0.12, rg(c, W * 0.7, H * 0.55, H * 0.12, ['#FFF7ED', '#FDBA74', 'rgba(253,186,116,0)']));
          var layer = function (col, base, amp, f) { c.fillStyle = col; c.beginPath(); c.moveTo(0, H); for (var x = 0; x <= W; x += 6) c.lineTo(x, base + Math.sin(x / W * f) * amp + Math.sin(x / W * f * 2.7 + 1) * amp * 0.4); c.lineTo(W, H); c.fill(); };
          layer('rgba(68,35,20,.55)', H * 0.62, H * 0.05, 7); layer('rgba(45,25,15,.75)', H * 0.72, H * 0.035, 11);
          c.fillStyle = lg(c, 0, gY0 - H * 0.05, 0, H, ['#57534E', '#292524', '#1C1917']); c.beginPath(); c.moveTo(0, H); for (var x = 0; x <= W; x += 4) c.lineTo(x, gy(x)); c.lineTo(W, H); c.fill();
          c.strokeStyle = 'rgba(253,186,116,.35)'; c.lineWidth = 1.5; c.beginPath(); for (x = 0; x <= W; x += 4) c.lineTo(x, gy(x)); c.stroke();
          for (var i = 0; i < 30; i++) { var rx = Math.random() * W; c.fillStyle = 'rgba(0,0,0,.25)'; c.beginPath(); c.ellipse(rx, gy(rx) + rnd(6, H - gY0), rnd(2, 6), rnd(1, 3), 0, 0, TAU); c.fill(); }
        });
        if (me) { me.x = W * 0.12; me.y = gy(me.x); }
      },
      reset: function (live) { me = { x: W * 0.12, y: gy(W * 0.12), ang: 0.6, rec: 0 }; en = []; shells = []; debris = []; aim = null; dead = 0; won = 0; raid = null; cool = 0; spawnT = 0.6; hits = 0; wind = live ? 0 : rnd(-0.4, 0.4); },
      step: function (dt, live) {
        t += dt; var i, e, s;
        cool = Math.max(0, cool - dt); me.rec = Math.max(0, me.rec - dt * tw * 0.3);
        for (i = debris.length - 1; i >= 0; i--) { var d = debris[i]; d.vy += G * dt; d.x += d.vx * dt; d.y += d.vy * dt; d.r += d.vr * dt; if (d.y > gy(d.x) && d.vy > 0) { d.y = gy(d.x); d.vy *= -0.3; d.vx *= 0.5; d.n = (d.n || 0) + 1; } if (d.n > 2) debris.splice(i, 1); }
        if (raid) {
          raid.t += dt; raid.x += W * 1.6 * dt;
          if (!raid.drop && raid.x > me.x - W * 0.2) { raid.drop = 1; shells.push({ x: raid.x, y: T + 20, vx: W * 0.5, vy: 0, me: 0, tr: [], bomb: 1 }); }
          for (i = shells.length - 1; i >= 0; i--) { s = shells[i]; s.vy += G * dt; s.x += s.vx * dt; s.y += s.vy * dt; if (s.y > gy(s.x)) { shells.splice(i, 1); boomFx(A, s.x, s.y - 8, 1.6); } }
          return;
        }
        if (dead || won) return;
        var lv = live ? A.lv() : 0.2, want = A.idle() ? 2 : 1 + (lv > 0.3 ? 1 : 0) + (lv > 0.85 ? 1 : 0);
        if (live && Math.random() < dt * 0.08) wind = clamp(wind + rnd(-0.5, 0.5), -0.3 - 0.7 * lv, 0.3 + 0.7 * lv);
        spawnT -= dt; if (en.length < want && spawnT <= 0) { addEnemy(live); spawnT = Math.max(0.6, 2.2 - lv); }
        for (i = 0; i < en.length; i++) {
          e = en[i]; e.rec = Math.max(0, e.rec - dt * tw * 0.3);
          if (e.x > e.tx) { e.x = Math.max(e.tx, e.x - W * 0.25 * dt); continue; }
          if (e.fired) continue;
          e.rl += dt / e.rT;
          var ta = Math.PI - 0.55 - 0.2 * Math.sin(t + i); e.ang += (ta - e.ang) * Math.min(1, dt * 3);
          if (e.rl >= 1) { if (A.live()) { e.fired = 1; enemyShot(e); } else e.rl = 0; }
        }
        for (i = shells.length - 1; i >= 0; i--) {
          s = shells[i]; s.vy += G * dt; if (s.me) s.vx += wind * G * 0.08 * dt; s.x += s.vx * dt; s.y += s.vy * dt;
          if (!A.lite) { s.tr.push([s.x, s.y]); if (s.tr.length > 7) s.tr.shift(); }
          if (s.me) {
            for (var j = en.length - 1; j >= 0; j--) {
              e = en[j]; var ey = gy(e.x) - tw * 0.2;
              if (Math.abs(s.x - e.x) < tw * 0.55 && Math.abs(s.y - ey) < tw * 0.3) {
                shells.splice(i, 1); en.splice(j, 1); hits++; boomFx(A, e.x, ey, 1.1);
                for (var q = 0; q < 6; q++) debris.push({ x: e.x, y: ey, vx: rnd(-200, 200), vy: -rnd(200, 520), r: 0, vr: rnd(-9, 9), s: rnd(4, 9) });
                s = null; break;
              }
            }
            if (!s) continue;
          } else if (Math.abs(s.x - me.x) < tw * 0.5 && s.y > me.y - tw * 0.45) {
            shells.splice(i, 1); boomFx(A, me.x, me.y - tw * 0.2, 1.2);
            if (s.hit && A.live() && A.fail(A.l.fail)) { dead = 1; for (q = 0; q < 6; q++) debris.push({ x: me.x, y: me.y - 10, vx: rnd(-200, 200), vy: -rnd(200, 520), r: 0, vr: rnd(-9, 9), s: rnd(4, 9) }); }
            continue;
          }
          if (s.y > gy(s.x) || s.x < -50 || s.x > W + 80) { shells.splice(i, 1); if (s.y > gy(s.x)) { A._xb = 1; A.burst(s.x, gy(s.x), 10, ['#A8A29E', '#78716C', '#FDBA74'], 140, 0.6, 3.4, 300); A._xb = 0; A.sx('hit', { v: 0.4 }); } }
        }
        if (A.idle()) { aiT += dt; if (aiT > 1.4 && en.length && en[0].x <= en[0].tx) { aiT = 0; var sl = solve(en[0].x, gy(en[0].x) - tw * 0.2, 0.06); fire(sl.a, clamp(sl.v, 0.2, 1)); } }
      },
      draw: function (c) {
        A.bg(bg);
        var i, e, s;
        for (i = 0; i < en.length; i++) {
          e = en[i]; var ey = gy(e.x);
          barrel(c, e.x - tw * 0.04, ey - tw * 0.33, e.ang, tw * 0.62, tw * 0.07, '#57534E', e.rec);
          c.save(); c.translate(e.x, ey); c.scale(-1, 1); c.drawImage(eS, -tw / 2, -tw * 0.42 + 2, tw, tw * 0.42); c.restore();
          if (e.x <= e.tx && !e.fired) { var bw = tw * 0.8, bx = e.x - bw / 2, by = ey - tw * 0.62; rr(c, bx, by, bw, 6, 3); c.fillStyle = 'rgba(0,0,0,.55)'; c.fill(); rr(c, bx, by, Math.max(6, bw * Math.min(1, e.rl)), 6, 3); c.fillStyle = e.rl > 0.7 ? '#F43F5E' : '#FACC15'; c.fill(); }
        }
        if (!dead) {
          barrel(c, me.x + tw * 0.04, me.y - tw * 0.33, -me.ang, tw * 0.62, tw * 0.07, '#3F6212', me.rec);
          c.drawImage(pS, me.x - tw / 2, me.y - tw * 0.42 + 2, tw, tw * 0.42);
        }
        for (i = 0; i < shells.length; i++) {
          s = shells[i];
          if (s.tr.length > 1) { c.strokeStyle = 'rgba(254,243,199,.45)'; c.lineWidth = 2; c.beginPath(); c.moveTo(s.tr[0][0], s.tr[0][1]); for (var k = 1; k < s.tr.length; k++) c.lineTo(s.tr[k][0], s.tr[k][1]); c.stroke(); }
          circ(c, s.x, s.y, s.bomb ? 6 : 3.6, s.me ? '#FEF3C7' : '#FCA5A5');
        }
        for (i = 0; i < debris.length; i++) { var d = debris[i]; c.save(); c.translate(d.x, d.y); c.rotate(d.r); c.fillStyle = '#3F3F46'; c.fillRect(-d.s / 2, -d.s / 3, d.s, d.s * 0.66); c.restore(); }
        if (aim && !dead && !raid) aim.res = guide(c, aim.ax, aim.ay);
        // wind flag
        var fx = W - 46, fy = T + 14, wl = wind * 26;
        c.strokeStyle = '#E7E5E4'; c.lineWidth = 2; c.beginPath(); c.moveTo(fx, fy); c.lineTo(fx, fy + 26); c.stroke();
        c.fillStyle = '#F43F5E'; c.beginPath(); c.moveTo(fx, fy); c.lineTo(fx + wl + (wl >= 0 ? 4 : -4), fy + 5 + Math.sin(t * 8) * 1.5); c.lineTo(fx, fy + 10); c.fill();
        if (raid) { var jx = raid.x, jy = T + 18; c.fillStyle = '#334155'; c.beginPath(); c.moveTo(jx + 26, jy); c.lineTo(jx - 16, jy - 6); c.lineTo(jx - 22, jy - 14); c.lineTo(jx - 26, jy - 4); c.lineTo(jx - 22, jy + 5); c.closePath(); c.fill(); c.fillStyle = '#64748B'; c.beginPath(); c.moveTo(jx + 2, jy - 2); c.lineTo(jx - 10, jy + 12); c.lineTo(jx - 4, jy + 12); c.lineTo(jx + 10, jy); c.fill(); }
      },
      down: function (x, y) { if (dead) return; aim = { x0: x, y0: y, ax: 0.0001, ay: 0.0001 }; },
      move: function (x, y) { if (!aim) return; aim.ax = aim.x0 - x; aim.ay = y - aim.y0; },
      up: function () { if (!aim) return; var a = aim; aim = null; if (a.res && Math.hypot(a.ax, a.ay) > 12) fire(a.res[0], a.res[1]); },
      key: function (k) { if (!this.k) this.k = { a: 0.7, p: 0.6 }; var q = this.k; if (k === 'up') q.a = Math.min(1.5, q.a + 0.05); else if (k === 'down') q.a = Math.max(0.05, q.a - 0.05); else if (k === 'right') q.p = Math.min(1, q.p + 0.04); else if (k === 'left') q.p = Math.max(0.15, q.p - 0.04); fire(q.a, q.p); },
      boom: function () { raid = { t: 0, x: -60 }; aim = null; en.forEach(function (e) { e.fired = 1; }); A.sx('engine', { k: 'jet' }); },
      win: function () { won = 0.001; aim = null; A.burst(me.x, me.y - tw * 0.5, 16, ['#FDE68A', '#FFFFFF', '#86EFAC'], 160, 0.6, 3); },
      dbg: function () { return { me: me, en: en.map(function (e) { return { x: e.x, tx: e.tx, rl: e.rl, f: e.fired }; }), wind: wind, tw: tw, dead: dead, hits: hits, shells: shells.length }; }
    };
  }, 'drag', 0.45);

  /* ================================================================== 10. SNIPER — a city at dusk: enemy soldiers pop up in windows,
     on roofs and behind sandbags. Drag the scope (relative, like a trackpad; it sways), release to shoot its centre.
     Each soldier's red ring closes as he aims: hit him first. Never shoot a civilian (white shirt, hands up). */
  boot('sniper', function (A) {
    var W, H, T, dpr, bg, slots = [], foes = [], sc = { x: 0, y: 0 }, drag = null, Rs, Z = 2.4, dead = 0, won = 0, strike = null, t = 0, spT = 0, cool = 0, flash = null, sold = {}, civ = {}, aiT = 0, aiTg = null, holes = [], kills = 0;
    function soldierS(h, enemy) { // upper body seen in a window: helmet, face, vest, rifle — real proportions
      var w = h * 0.8;
      return mkc(w, h, dpr, function (c) {
        var cx = w / 2, hd = h * 0.17;
        if (enemy) {
          // shoulders + vest
          c.fillStyle = lg(c, 0, h * 0.42, 0, h, ['#4B5320', '#3A4019', '#23270F']); c.beginPath(); c.moveTo(cx - w * 0.42, h); c.quadraticCurveTo(cx - w * 0.44, h * 0.5, cx - w * 0.16, h * 0.44); c.lineTo(cx + w * 0.16, h * 0.44); c.quadraticCurveTo(cx + w * 0.44, h * 0.5, cx + w * 0.42, h); c.fill();
          c.fillStyle = '#2B2F14'; rr(c, cx - w * 0.2, h * 0.58, w * 0.12, h * 0.12, 2); c.fill(); rr(c, cx + w * 0.08, h * 0.58, w * 0.12, h * 0.12, 2); c.fill();
          c.fillStyle = '#5C4033'; c.fillRect(cx - w * 0.4, h * 0.5, w * 0.8, h * 0.035);
          // neck + face
          c.fillStyle = '#B07A55'; c.fillRect(cx - hd * 0.32, h * 0.36, hd * 0.64, h * 0.1);
          c.fillStyle = rg(c, cx, h * 0.3, hd * 0.75, ['#E0A47A', '#B9784F', '#8A5536'], -hd * 0.2, -hd * 0.2); c.beginPath(); c.ellipse(cx, h * 0.3, hd * 0.58, hd * 0.72, 0, 0, TAU); c.fill();
          c.fillStyle = '#1F1A17'; c.fillRect(cx - hd * 0.36, h * 0.285, hd * 0.24, hd * 0.09); c.fillRect(cx + hd * 0.12, h * 0.285, hd * 0.24, hd * 0.09);
          c.fillStyle = '#7A4A30'; c.fillRect(cx - hd * 0.2, h * 0.37, hd * 0.4, hd * 0.06);
          // helmet with net
          c.fillStyle = lg(c, 0, h * 0.12, 0, h * 0.28, ['#6B7A3A', '#4B5320', '#2E3313']); c.beginPath(); c.ellipse(cx, h * 0.25, hd * 0.86, hd * 0.66, 0, Math.PI, 0); c.lineTo(cx + hd * 0.95, h * 0.26); c.lineTo(cx - hd * 0.95, h * 0.26); c.fill();
          c.strokeStyle = 'rgba(0,0,0,.25)'; c.lineWidth = 0.8; for (var i = -2; i <= 2; i++) { c.beginPath(); c.moveTo(cx + i * hd * 0.3, h * 0.13); c.lineTo(cx + i * hd * 0.36, h * 0.25); c.stroke(); }
          c.fillStyle = 'rgba(255,255,255,.18)'; c.beginPath(); c.ellipse(cx - hd * 0.3, h * 0.17, hd * 0.3, hd * 0.12, -0.3, 0, TAU); c.fill();
          // rifle held across the chest, muzzle toward the viewer
          c.fillStyle = lg(c, 0, h * 0.6, 0, h * 0.72, ['#3F3F46', '#18181B']); c.save(); c.translate(cx, h * 0.66); c.rotate(-0.28); rr(c, -w * 0.46, -h * 0.035, w * 0.92, h * 0.07, 2); c.fill(); c.fillStyle = '#5C4033'; rr(c, -w * 0.46, -h * 0.03, w * 0.22, h * 0.09, 2); c.fill(); c.fillStyle = '#27272A'; c.fillRect(w * 0.05, -h * 0.12, w * 0.07, h * 0.09); c.restore();
          // gloved hands
          circ(c, cx - w * 0.18, h * 0.7, h * 0.045, '#2B2F14'); circ(c, cx + w * 0.2, h * 0.6, h * 0.045, '#2B2F14');
        } else {
          // civilian: white shirt, hands up, dark hair
          c.fillStyle = lg(c, 0, h * 0.42, 0, h, ['#FFFFFF', '#E5E7EB', '#9CA3AF']); c.beginPath(); c.moveTo(cx - w * 0.38, h); c.quadraticCurveTo(cx - w * 0.4, h * 0.5, cx - w * 0.15, h * 0.45); c.lineTo(cx + w * 0.15, h * 0.45); c.quadraticCurveTo(cx + w * 0.4, h * 0.5, cx + w * 0.38, h); c.fill();
          c.strokeStyle = '#E5E7EB'; c.lineWidth = h * 0.08; c.lineCap = 'round'; c.beginPath(); c.moveTo(cx - w * 0.3, h * 0.55); c.lineTo(cx - w * 0.4, h * 0.2); c.moveTo(cx + w * 0.3, h * 0.55); c.lineTo(cx + w * 0.4, h * 0.2); c.stroke();
          circ(c, cx - w * 0.4, h * 0.16, h * 0.045, '#D9A07A'); circ(c, cx + w * 0.4, h * 0.16, h * 0.045, '#D9A07A');
          c.fillStyle = '#C98F6B'; c.fillRect(cx - hd * 0.3, h * 0.36, hd * 0.6, h * 0.1);
          c.fillStyle = rg(c, cx, h * 0.3, hd * 0.75, ['#F2C29E', '#D9A07A', '#A86F4E'], -hd * 0.2, -hd * 0.2); c.beginPath(); c.ellipse(cx, h * 0.3, hd * 0.58, hd * 0.72, 0, 0, TAU); c.fill();
          c.fillStyle = '#2A1A10'; c.beginPath(); c.ellipse(cx, h * 0.22, hd * 0.62, hd * 0.4, 0, Math.PI, 0); c.fill();
          c.fillStyle = '#1F1A17'; circ(c, cx - hd * 0.22, h * 0.3, hd * 0.07, '#1F1A17'); circ(c, cx + hd * 0.22, h * 0.3, hd * 0.07, '#1F1A17');
          c.strokeStyle = '#7A4A30'; c.lineWidth = 1; c.beginPath(); c.arc(cx, h * 0.38, hd * 0.12, 0, TAU); c.stroke();
        }
      });
    }
    function getS(h, en) { var k = Math.round(h); var m = en ? sold : civ; if (!m[k]) m[k] = soldierS(k, en); return m[k]; }
    function buildCity() {
      slots = [];
      var g = H * 0.9, x = 0;
      var bld = [];
      while (x < W) { var bw = rnd(W * 0.24, W * 0.4), bh = rnd((H - T) * 0.4, (H - T) * 0.75), depth = Math.random() < 0.5 ? 0 : 1; bld.push({ x: x, w: bw, h: bh, d: depth }); x += bw + rnd(2, W * 0.03); }
      bld.sort(function (a, b) { return b.d - a.d; });
      bld.forEach(function (b) {
        var sc2 = b.d ? 0.7 : 1, wh = Math.max(22, (H - T) * 0.105 * sc2), ww = wh * 0.8, top = g - b.h;
        for (var yy = top + wh * 0.7; yy < g - wh * 1.8; yy += wh * 1.6) for (var xx = b.x + ww * 0.5; xx < b.x + b.w - ww * 1.2; xx += ww * 1.6) if (Math.random() < 0.55) slots.push({ x: xx + ww / 2, y: yy + wh, h: wh * 0.95, w: ww, d: b.d, kind: 'win' });
        slots.push({ x: b.x + b.w * rnd(0.3, 0.7), y: top + 1, h: wh * 1.05, w: ww, d: b.d, kind: 'roof' });
        b.top = top; b.wh = wh; b.ww = ww;
      });
      return bld;
    }
    var city = [];
    function freeSlot() { var fr = slots.filter(function (s) { return !s.busy; }); return fr.length ? fr[(Math.random() * fr.length) | 0] : null; }
    function spawn(live) {
      var s = freeSlot(); if (!s) return; var lv = live ? A.lv() : 0.2, isCiv = live && Math.random() < 0.18 + 0.08 * lv;
      s.busy = 1; foes.push({ s: s, civ: isCiv, up: 0, t: 0, aT: isCiv ? 2.8 : Math.max(1.5, 3.7 - 1.9 * lv) * (s.d ? 1.15 : 1), dn: 0 });
    }
    function sway() { var lv = A.live() ? A.lv() : 0.2, a = 3 + 6 * lv; return [Math.sin(t * 1.3) * a + Math.sin(t * 3.1) * a * 0.3, Math.cos(t * 1.1) * a * 0.8]; }
    function shoot() {
      if (cool > 0 || dead || strike || won) return;
      cool = 0.45; var sw = sway(), px = sc.x + sw[0] / Z, py = sc.y + sw[1] / Z;
      A.sx('gun', { k: 'rifle' }); flash = { t: 0 }; A.shake(0.08);
      for (var i = foes.length - 1; i >= 0; i--) {
        var f = foes[i];
        if (f.dn || f.up < 0.5) continue;
        if (Math.abs(px - f.s.x) < f.s.w * 0.45 && py > f.s.y - f.s.h * 1.05 && py < f.s.y) {
          f.dn = 0.001;
          if (f.civ) { if (A.live()) { if (A.fail(A.l.fail2)) dead = 1; } return; }
          kills++; A.burst(px, py, 8, ['#7F1D1D', '#B91C1C', '#FCA5A5'], 90, 0.4, 2.6, 80); A.sx('hit');
          return;
        }
      }
      holes.push({ x: px, y: py, t: 0 }); if (holes.length > 12) holes.shift();
      A._xb = 1; A.burst(px, py, 5, ['#D6D3D1', '#A8A29E'], 60, 0.35, 2, 60); A._xb = 0;
    }
    function scene(c, z, fx, fy) { // the city with people (drawn normally, or zoomed inside the scope)
      if (z === 1) A.bg(bg); // static layer behind the scene (painted once)
      else { // only the small part of the city seen through the scope (cheap on old phones)
        var r0 = Rs / z + 4, x0 = clamp(fx - r0, 0, W), y0 = clamp(fy - r0, 0, H), x1 = clamp(fx + r0, 0, W), y1 = clamp(fy + r0, 0, H);
        if (x1 - x0 > 1 && y1 - y0 > 1) c.drawImage(bg, x0 * dpr, y0 * dpr, (x1 - x0) * dpr, (y1 - y0) * dpr, x0, y0, x1 - x0, y1 - y0);
      }
      for (var i = 0; i < foes.length; i++) {
        var f = foes[i], s = f.s, k = f.dn ? Math.max(0, 1 - f.dn * 3) : f.up;
        if (k <= 0) continue;
        var h = s.h, sp = getS(h * (z > 1 ? Math.min(2.4, z) : 1), !f.civ);
        c.save(); c.beginPath(); c.rect(s.x - s.w / 2 - 2, s.y - h * 1.1, s.w + 4, h * 1.1); c.clip();
        var hh = h * 1.3; c.drawImage(sp, s.x - hh * 0.4, s.y - hh * k + hh * 0.2, hh * 0.8, hh);
        c.restore();
        if (s.kind === 'roof' && !f.civ) { c.fillStyle = '#78716C'; rr(c, s.x - s.w * 0.65, s.y - h * 0.32, s.w * 1.3, h * 0.34, 4); c.fill(); c.fillStyle = 'rgba(0,0,0,.25)'; c.fillRect(s.x - s.w * 0.65, s.y - h * 0.17, s.w * 1.3, 1.5); }
        if (!f.civ && !f.dn && f.up >= 1) { // aiming ring
          var p = Math.min(1, f.t / f.aT); c.strokeStyle = p > 0.7 ? '#EF4444' : 'rgba(239,68,68,.7)'; c.lineWidth = 2 / z * (z > 1 ? 1.4 : 1); c.beginPath(); c.arc(s.x, s.y - h * 0.62, h * (1.1 - 0.7 * p), 0, TAU); c.stroke();
        }
      }
      for (i = 0; i < holes.length; i++) circ(c, holes[i].x, holes[i].y, 1.6, 'rgba(20,20,20,.8)');
    }
    return {
      size: function (w, h, uu, d, top) {
        W = w; H = h; dpr = d; T = top; Rs = Math.min(W * 0.3, (H - T) * 0.28); sold = {}; civ = {};
        var bl = null;
        bg = mkc(W, H, dpr, function (c) {
          c.fillStyle = lg(c, 0, 0, 0, H, ['#0F172A', '#4C1D95', '#F97316']); c.fillRect(0, 0, W, H);
          circ(c, W * 0.8, H * 0.45, H * 0.07, '#FDBA74');
          bl = buildCity();
          // far skyline
          c.fillStyle = 'rgba(30,20,50,.8)'; var fx = 0; while (fx < W) { var fw = rnd(14, 34), fh = rnd(H * 0.12, H * 0.3); c.fillRect(fx, H * 0.9 - fh - (H - T) * 0.25, fw, fh + (H - T) * 0.25); fx += fw + rnd(0, 6); }
          bl.forEach(function (b) {
            var g = H * 0.9, base = b.d ? ['#5B5470', '#3B3550', '#2A2540'] : ['#8A7F72', '#6B6157', '#4A423B'];
            c.fillStyle = lg(c, b.x, 0, b.x + b.w, 0, [base[0], base[1], base[2]]); c.fillRect(b.x, b.top, b.w, g - b.top);
            // brick courses + vertical pilasters
            c.fillStyle = 'rgba(0,0,0,.08)'; for (var by = b.top + 6; by < g; by += 6) c.fillRect(b.x, by, b.w, 1);
            c.fillStyle = 'rgba(255,255,255,.07)'; c.fillRect(b.x, b.top, Math.max(3, b.w * 0.04), g - b.top);
            c.fillStyle = 'rgba(0,0,0,.28)'; c.fillRect(b.x + b.w - Math.max(4, b.w * 0.05), b.top, Math.max(4, b.w * 0.05), g - b.top);
            // cornice + roof gear
            c.fillStyle = b.d ? '#2E2A3C' : '#3F3A35'; c.fillRect(b.x - 3, b.top - 5, b.w + 6, 6); c.fillStyle = 'rgba(255,255,255,.12)'; c.fillRect(b.x - 3, b.top - 5, b.w + 6, 1.5);
            if (b.w > 50) { var tx = b.x + b.w * 0.75; c.fillStyle = '#3F3A35'; c.fillRect(tx - 1, b.top - 18, 2, 13); c.fillRect(tx - 6, b.top - 18, 12, 2); }
            for (var yy = b.top + b.wh * 0.7; yy < g - b.wh * 1.8; yy += b.wh * 1.6) for (var xx = b.x + b.ww * 0.5; xx < b.x + b.w - b.ww * 1.2; xx += b.ww * 1.6) {
              var lit = Math.random() < 0.22;
              c.fillStyle = '#2B2622'; c.fillRect(xx - 2, yy - 2, b.ww + 4, b.wh + 4); // frame
              c.fillStyle = lit ? lg(c, 0, yy, 0, yy + b.wh, ['#FDE68A', '#D97706']) : lg(c, 0, yy, 0, yy + b.wh, ['#1F2937', '#0B0F19']); c.fillRect(xx, yy, b.ww, b.wh);
              if (!lit) { c.fillStyle = 'rgba(148,163,184,.12)'; c.beginPath(); c.moveTo(xx, yy); c.lineTo(xx + b.ww * 0.5, yy); c.lineTo(xx, yy + b.wh * 0.6); c.fill(); }
              c.fillStyle = 'rgba(0,0,0,.35)'; c.fillRect(xx + b.ww / 2 - 0.5, yy, 1, b.wh);
              c.fillStyle = 'rgba(255,255,255,.16)'; c.fillRect(xx - 3, yy + b.wh + 2, b.ww + 6, 2.4); // sill
            }
          });
          c.fillStyle = '#1C1917'; c.fillRect(0, H * 0.9, W, H * 0.1);
          for (var i = 0; i < 6; i++) { var sx2 = rnd(0, W), sw2 = rnd(30, 60); c.fillStyle = '#78716C'; rr(c, sx2, H * 0.9 - 14, sw2, 16, 6); c.fill(); }
        });
        city = bl; foes = []; slots.forEach(function (s) { s.busy = 0; });
        sc.x = W / 2; sc.y = T + (H - T) * 0.5;
      },
      reset: function () { foes = []; slots.forEach(function (s) { s.busy = 0; }); dead = 0; won = 0; strike = null; spT = 0.8; holes = []; kills = 0; drag = null; },
      step: function (dt, live) {
        t += dt; cool = Math.max(0, cool - dt); if (flash) { flash.t += dt; if (flash.t > 0.12) flash = null; }
        var i, f;
        for (i = foes.length - 1; i >= 0; i--) {
          f = foes[i];
          if (f.dn) { f.dn += dt; if (f.dn > 0.4) { f.s.busy = 0; foes.splice(i, 1); } continue; }
          f.up = Math.min(1, f.up + dt * 4); if (f.up < 1) continue;
          f.t += dt;
          if (f.t >= f.aT && !strike && !dead && !won) {
            if (f.civ) { f.dn = 0.001; continue; }
            if (A.live()) { A.sx('gun', { k: 'rifle', v: 0.7 }); flash = { t: 0, red: 1 }; if (A.fail(A.l.fail)) { dead = 1; A.shake(0.4); A.flash(0.4); } }
            else { f.dn = 0.001; }
          }
        }
        if (strike) { strike.t += dt; strike.k -= dt; if (strike.k <= 0 && strike.n < 7) { strike.k = 0.18; strike.n++; boomFx(A, rnd(W * 0.1, W * 0.9), rnd(T + (H - T) * 0.3, H * 0.9), 1.1); } return; }
        if (dead || won) return;
        var lv = live ? A.lv() : 0.2;
        spT -= dt; if (spT <= 0) { if (foes.length < (A.idle() ? 2 : 2 + Math.round(2 * lv))) spawn(live); spT = Math.max(0.45, 1.6 - 1.0 * lv) * rnd(0.7, 1.3); }
        if (A.idle()) {
          if (!aiTg || aiTg.dn || foes.indexOf(aiTg) < 0) aiTg = foes.filter(function (q) { return !q.civ && !q.dn; })[0] || null;
          if (aiTg) { var tx = aiTg.s.x, ty = aiTg.s.y - aiTg.s.h * 0.6; sc.x += (tx - sc.x) * Math.min(1, dt * 1.6); sc.y += (ty - sc.y) * Math.min(1, dt * 1.6); aiT += dt; if (Math.hypot(tx - sc.x, ty - sc.y) < 3 && aiT > 1.4 && aiTg.up >= 1) { aiT = 0; shoot(); } }
        }
      },
      draw: function (c) {
        scene(c, 1);
        // dim the scene outside the scope
        c.fillStyle = 'rgba(2,6,23,.35)'; c.fillRect(0, 0, W, H);
        var sw = sway(), cx = clamp(sc.x, Rs * 0.4, W - Rs * 0.4), cy = clamp(sc.y, T + Rs * 0.2, H - Rs * 0.2);
        c.save(); c.beginPath(); c.arc(cx, cy, Rs, 0, TAU); c.clip();
        c.translate(cx, cy); c.scale(Z, Z); c.translate(-sc.x - sw[0] / Z, -sc.y - sw[1] / Z);
        scene(c, Z, sc.x + sw[0] / Z, sc.y + sw[1] / Z);
        c.restore();
        // scope rim + reticle
        c.strokeStyle = '#0A0A0A'; c.lineWidth = Rs * 0.12; c.beginPath(); c.arc(cx, cy, Rs + Rs * 0.06, 0, TAU); c.stroke();
        c.strokeStyle = 'rgba(255,255,255,.18)'; c.lineWidth = 1.5; c.beginPath(); c.arc(cx, cy, Rs - 1, -2.4, -1.2); c.stroke();
        c.strokeStyle = 'rgba(10,10,10,.85)'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(cx - Rs, cy); c.lineTo(cx - 6, cy); c.moveTo(cx + 6, cy); c.lineTo(cx + Rs, cy); c.moveTo(cx, cy - Rs); c.lineTo(cx, cy - 6); c.moveTo(cx, cy + 6); c.lineTo(cx, cy + Rs); c.stroke();
        c.lineWidth = 3; c.beginPath(); c.moveTo(cx - Rs, cy); c.lineTo(cx - Rs * 0.55, cy); c.moveTo(cx + Rs * 0.55, cy); c.lineTo(cx + Rs, cy); c.moveTo(cx, cy + Rs * 0.55); c.lineTo(cx, cy + Rs); c.stroke();
        circ(c, cx, cy, 1.8, '#EF4444');
        if (cool > 0) { c.strokeStyle = 'rgba(253,230,138,.8)'; c.lineWidth = 2; c.beginPath(); c.arc(cx, cy, Rs * 0.2, -Math.PI / 2, -Math.PI / 2 + (1 - cool / 0.45) * TAU); c.stroke(); }
        if (flash) { c.globalAlpha = 0.5 * (1 - flash.t / 0.12); c.fillStyle = flash.red ? '#EF4444' : '#FEF3C7'; c.fillRect(0, 0, W, H); c.globalAlpha = 1; }
        // scope position follows a relative drag: keep the stored centre in sync with the clamped one
        sc.x = cx; sc.y = cy;
      },
      down: function (x, y) { if (dead) return; drag = { x: x, y: y }; },
      move: function (x, y) { if (!drag) return; sc.x += (x - drag.x) * 1.15; sc.y += (y - drag.y) * 1.15; drag.x = x; drag.y = y; },
      up: function () { if (!drag) return; drag = null; shoot(); },
      key: function (k) { var s = Rs * 0.25; if (k === 'left') sc.x -= s; else if (k === 'right') sc.x += s; else if (k === 'up') sc.y -= s; else if (k === 'down') { shoot(); } },
      boom: function () { strike = { t: 0, k: 0, n: 0 }; drag = null; },
      win: function () { won = 0.001; drag = null; A.burst(sc.x, sc.y, 16, ['#FDE68A', '#FFFFFF'], 150, 0.6, 3); },
      dbg: function () { return { sc: sc, Rs: Rs, foes: foes.map(function (f) { return { x: f.s.x, y: f.s.y, h: f.s.h, w: f.s.w, civ: f.civ, up: f.up, t: f.t, aT: f.aT, dn: f.dn }; }), dead: dead, kills: kills, cool: cool }; }
    };
  }, 'drag', 0.72);

  /* ================================================================== 11. GUNSHIP — side-scrolling attack helicopter: drag up / down
     (relative), it fires by itself. Enemy helicopters, ground flak guns and rockets (warned at the edge); mountains. */
  boot('gunship', function (A) {
    var W, H, T, dpr, bg, hS = null, eS = null, hw, py = 0, vy = 0, tgY = 0, drag = null, scroll = 0, ter = [], bul = [], eb = [], foes = [], warn = [], dead = 0, won = 0, swarm = null, t = 0, fireT = 0, spT = 0, gT = 0, rT = 0, px, crash = null, kills = 0;
    function heliS(w, enemy) {
      var h = w * 0.5;
      return mkc(w, h, dpr, function (c) {
        var body = enemy ? ['#9CA3AF', '#4B5563', '#1F2937'] : ['#7C8F4E', '#4D5D2A', '#252E12'];
        // tail boom + fin
        c.fillStyle = lg(c, 0, h * 0.35, 0, h * 0.5, [body[0], body[2]]); c.beginPath(); c.moveTo(w * 0.05, h * 0.36); c.lineTo(w * 0.5, h * 0.42); c.lineTo(w * 0.5, h * 0.56); c.lineTo(w * 0.05, h * 0.46); c.fill();
        c.fillStyle = body[1]; c.beginPath(); c.moveTo(w * 0.02, h * 0.2); c.lineTo(w * 0.1, h * 0.2); c.lineTo(w * 0.12, h * 0.42); c.lineTo(w * 0.03, h * 0.44); c.fill();
        // fuselage
        c.fillStyle = lg(c, 0, h * 0.28, 0, h * 0.8, body); c.beginPath(); c.moveTo(w * 0.42, h * 0.38); c.quadraticCurveTo(w * 0.55, h * 0.24, w * 0.78, h * 0.3); c.quadraticCurveTo(w * 0.98, h * 0.42, w * 0.96, h * 0.58); c.quadraticCurveTo(w * 0.9, h * 0.76, w * 0.6, h * 0.74); c.quadraticCurveTo(w * 0.44, h * 0.72, w * 0.4, h * 0.56); c.closePath(); c.fill();
        // canopy
        c.fillStyle = lg(c, w * 0.75, h * 0.3, w * 0.95, h * 0.55, ['#E0F2FE', '#38BDF8', '#0C4A6E']); c.beginPath(); c.moveTo(w * 0.74, h * 0.33); c.quadraticCurveTo(w * 0.92, h * 0.36, w * 0.95, h * 0.54); c.lineTo(w * 0.78, h * 0.54); c.closePath(); c.fill();
        c.fillStyle = 'rgba(255,255,255,.55)'; c.beginPath(); c.moveTo(w * 0.78, h * 0.36); c.lineTo(w * 0.86, h * 0.38); c.lineTo(w * 0.8, h * 0.46); c.fill();
        // stub wing + rocket pod
        c.fillStyle = body[2]; c.fillRect(w * 0.5, h * 0.6, w * 0.2, h * 0.05); c.fillStyle = lg(c, 0, h * 0.62, 0, h * 0.74, ['#71717A', '#27272A']); rr(c, w * 0.52, h * 0.64, w * 0.18, h * 0.09, h * 0.04); c.fill();
        // skids
        c.strokeStyle = '#1F2937'; c.lineWidth = Math.max(1.5, h * 0.04); c.beginPath(); c.moveTo(w * 0.48, h * 0.93); c.lineTo(w * 0.9, h * 0.93); c.moveTo(w * 0.55, h * 0.75); c.lineTo(w * 0.53, h * 0.93); c.moveTo(w * 0.8, h * 0.75); c.lineTo(w * 0.82, h * 0.93); c.stroke();
        // rotor mast + highlight
        c.fillStyle = '#27272A'; c.fillRect(w * 0.6, h * 0.16, w * 0.04, h * 0.12);
        c.fillStyle = 'rgba(255,255,255,.2)'; c.beginPath(); c.ellipse(w * 0.62, h * 0.36, w * 0.14, h * 0.04, -0.1, 0, TAU); c.fill();
        if (enemy) { circ(c, w * 0.6, h * 0.52, h * 0.06, '#DC2626'); } else { circ(c, w * 0.58, h * 0.52, h * 0.06, '#FDE68A'); circ(c, w * 0.58, h * 0.52, h * 0.03, '#4D5D2A'); }
      });
    }
    function terY(x) { var gx = x + scroll, i = Math.floor(gx / 40), f = gx / 40 - i; var a = ter[i % ter.length], b = ter[(i + 1) % ter.length]; return a + (b - a) * (f * f * (3 - 2 * f)); }
    function rotor(c, x, y, w, sgn) {
      var ph = t * 40, L = w * 0.62;
      c.fillStyle = 'rgba(30,41,59,.35)'; c.beginPath(); c.ellipse(x, y, L, w * 0.035, 0, 0, TAU); c.fill();
      c.strokeStyle = 'rgba(15,23,42,.85)'; c.lineWidth = Math.max(1.5, w * 0.025); c.beginPath(); c.moveTo(x - L * Math.cos(ph), y); c.lineTo(x + L * Math.cos(ph), y); c.stroke();
      // tail rotor
      var tx = x - sgn * w * 0.58, ty = y + w * 0.1; c.strokeStyle = 'rgba(15,23,42,.7)'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(tx + Math.cos(ph * 1.3) * w * 0.08, ty + Math.sin(ph * 1.3) * w * 0.08); c.lineTo(tx - Math.cos(ph * 1.3) * w * 0.08, ty - Math.sin(ph * 1.3) * w * 0.08); c.stroke();
    }
    function hitMe(x, y, r) { return Math.abs(x - px) < hw * 0.42 + r && Math.abs(y - py) < hw * 0.18 + r; }
    function die() { if (A.live()) { if (A.fail(A.l.fail)) { dead = 1; crash = { vy: -80, r: 0 }; boomFx(A, px, py, 1.2); } } }
    return {
      size: function (w, h, uu, d, top) {
        W = w; H = h; dpr = d; T = top; hw = clamp(Math.min(W, H) * 0.2, 64, 150); px = W * 0.22;
        hS = heliS(hw, false); eS = heliS(hw * 0.85, true);
        ter = []; for (var i = 0; i < 64; i++) ter.push(H - (H - T) * (0.08 + 0.16 * Math.abs(Math.sin(i * 0.7) * Math.cos(i * 0.23)) + 0.05 * Math.random()));
        bg = mkc(W, H, dpr, function (c) {
          c.fillStyle = lg(c, 0, 0, 0, H, ['#0C4A6E', '#38BDF8', '#FDE68A']); c.fillRect(0, 0, W, H);
          circ(c, W * 0.85, T + (H - T) * 0.25, H * 0.06, '#FEF9C3');
          for (var k = 0; k < 6; k++) { var cx = rnd(0, W), cy = rnd(T, H * 0.55); c.fillStyle = 'rgba(255,255,255,.35)'; c.beginPath(); c.ellipse(cx, cy, rnd(30, 70), rnd(8, 16), 0, 0, TAU); c.fill(); }
          c.fillStyle = 'rgba(30,58,95,.45)'; c.beginPath(); c.moveTo(0, H); for (var x = 0; x <= W; x += 8) c.lineTo(x, H * 0.62 + Math.sin(x / W * 9) * H * 0.05 + Math.sin(x / W * 21) * H * 0.02); c.lineTo(W, H); c.fill();
        });
        if (!py) { py = T + (H - T) * 0.45; tgY = py; }
      },
      reset: function () { py = T + (H - T) * 0.45; tgY = py; vy = 0; bul = []; eb = []; foes = []; warn = []; dead = 0; won = 0; swarm = null; crash = null; spT = 1; gT = 3; rT = 6; kills = 0; drag = null; },
      step: function (dt, live) {
        t += dt; var i, j, f, b, lv = live ? A.lv() : 0.15, sp = (H - T) * (0.55 + 0.45 * lv);
        if (!crash) scroll += sp * dt;
        if (crash) { crash.vy += 900 * dt; py += crash.vy * dt; crash.r += dt * 2; if (py > terY(px) - 6 && !crash.b) { crash.b = 1; boomFx(A, px, py, 1.4); } }
        // player motion
        if (!dead && !swarm) {
          if (A.idle()) { // attract: keep away from bullets and the ground, track an enemy
            var want = T + (H - T) * 0.4, tgt = foes.filter(function (q) { return q.k === 'heli'; })[0]; if (tgt) want = tgt.y;
            eb.forEach(function (q) { if (q.x > px && q.x - px < W * 0.35 && Math.abs(q.y - want) < hw * 0.4) want += (want < q.y ? -1 : 1) * hw * 0.6; });
            tgY = clamp(want, T + hw * 0.3, terY(px + hw) - hw * 0.6);
          }
          vy = (tgY - py) * 9; py += vy * dt;
          py = clamp(py, T + hw * 0.2, H - hw * 0.2);
        }
        // fire
        fireT -= dt; if (fireT <= 0 && !dead && !won && !swarm) { fireT = 0.13; bul.push({ x: px + hw * 0.48, y: py + hw * 0.08, vx: W * 1.4 }); if (A.live()) A.sx('gun', { k: 'mg', v: 0.35 }); }
        for (i = bul.length - 1; i >= 0; i--) { b = bul[i]; b.x += b.vx * dt; if (b.x > W + 20) { bul.splice(i, 1); continue; } for (j = foes.length - 1; j >= 0; j--) { f = foes[j]; if (Math.abs(b.x - f.x) < f.w * 0.45 && Math.abs(b.y - f.y) < f.w * 0.25) { bul.splice(i, 1); f.hp--; A._xb = 1; A.burst(b.x, b.y, 3, ['#FDE68A', '#fff'], 60, 0.25, 2, 0); A._xb = 0; if (f.hp <= 0) { foes.splice(j, 1); kills++; boomFx(A, f.x, f.y, 0.9); } break; } } }
        if (swarm) {
          swarm.t += dt;
          for (i = 0; i < eb.length; i++) { b = eb[i]; var a = Math.atan2(py - b.y, px - b.x); b.vx += Math.cos(a) * 900 * dt; b.vy += Math.sin(a) * 900 * dt; b.x += b.vx * dt; b.y += b.vy * dt; }
          if (!swarm.hit && swarm.t > 0.8) { swarm.hit = 1; boomFx(A, px, py, 1.6); crash = { vy: -60, r: 0 }; }
          return;
        }
        if (won) return;
        // spawn enemies
        spT -= dt; if (spT <= 0) { spT = Math.max(0.9, 3 - 2 * lv) * rnd(0.8, 1.2); foes.push({ k: 'heli', x: W + hw, y: rnd(T + hw * 0.4, H * 0.62), w: hw * 0.85, hp: 3, ph: rnd(0, 6), sT: rnd(0.8, 1.6) }); }
        gT -= dt; if (gT <= 0) { gT = Math.max(1.6, 4.5 - 2.6 * lv) * rnd(0.8, 1.2); foes.push({ k: 'gun', x: W + 30, y: 0, w: hw * 0.5, hp: 2, sT: rnd(0.4, 1.0) }); }
        if (lv > 0.25) { rT -= dt; if (rT <= 0) { rT = Math.max(2.2, 6 - 3 * lv) * rnd(0.8, 1.2); warn.push({ y: rnd(T + hw * 0.3, H * 0.7), t: 0 }); } }
        for (i = warn.length - 1; i >= 0; i--) { warn[i].t += dt; if (warn[i].t > 0.9) { eb.push({ x: W + 20, y: warn[i].y, vx: -W * 1.1, vy: 0, rk: 1 }); warn.splice(i, 1); A.sx('whoosh'); } }
        for (i = foes.length - 1; i >= 0; i--) {
          f = foes[i];
          if (f.k === 'heli') { f.x -= sp * 0.55 * dt + (f.x > W * 0.75 ? W * 0.3 * dt : 0); f.ph += dt; f.y += Math.sin(f.ph * 1.6) * 40 * dt; }
          else { f.x -= sp * dt; f.y = terY(f.x) - f.w * 0.3; }
          if (f.x < -hw) { foes.splice(i, 1); continue; }
          f.sT -= dt;
          if (f.sT <= 0 && f.x < W * 0.95 && f.x > px + hw * 0.6) {
            if (f.k === 'heli') { f.sT = Math.max(0.9, 2 - 0.9 * lv); var an = Math.atan2(py - f.y, px - f.x), v = W * (0.38 + 0.2 * lv); eb.push({ x: f.x - f.w * 0.4, y: f.y, vx: Math.cos(an) * v, vy: Math.sin(an) * v }); }
            else { f.sT = Math.max(1, 2.2 - lv); var tt = (f.x - px) / (W * 0.5), an2 = Math.atan2((py + vy * tt * 0.3) - f.y, px - f.x), v2 = W * 0.5; eb.push({ x: f.x, y: f.y - f.w * 0.3, vx: Math.cos(an2) * v2, vy: Math.sin(an2) * v2, fl: 1 }); }
          }
          if (!dead && f.k === 'heli' && hitMe(f.x, f.y, f.w * 0.25)) die();
        }
        for (i = eb.length - 1; i >= 0; i--) { b = eb[i]; b.x += b.vx * dt; b.y += b.vy * dt; if (b.x < -30 || b.y < -30 || b.y > H + 30) { eb.splice(i, 1); continue; } if (!dead && hitMe(b.x, b.y, b.rk ? 6 : 3)) { eb.splice(i, 1); die(); } }
        if (!dead && py + hw * 0.22 > terY(px) && !A.idle()) die();
      },
      draw: function (c) {
        A.bg(bg);
        var i, f, b;
        // terrain (scrolling mountains)
        c.fillStyle = lg(c, 0, H * 0.6, 0, H, ['#4D7C0F', '#365314', '#1A2E05']); c.beginPath(); c.moveTo(0, H); for (var x = 0; x <= W + 10; x += 10) c.lineTo(x, terY(x)); c.lineTo(W, H); c.fill();
        c.strokeStyle = 'rgba(190,242,100,.35)'; c.lineWidth = 2; c.beginPath(); for (x = 0; x <= W + 10; x += 10) c.lineTo(x, terY(x)); c.stroke();
        for (i = 0; i < foes.length; i++) {
          f = foes[i];
          if (f.k === 'heli') { c.save(); c.translate(f.x, f.y); c.scale(-1, 1); c.drawImage(eS, -f.w / 2, -f.w * 0.25, f.w, f.w * 0.5); c.restore(); rotor(c, f.x - f.w * 0.12 * -1 - f.w * 0.0, f.y - f.w * 0.17, f.w, -1); }
          else { c.fillStyle = '#44403C'; rr(c, f.x - f.w * 0.5, f.y, f.w, f.w * 0.3, 3); c.fill(); var aa = Math.atan2(py - f.y, px - f.x); c.save(); c.translate(f.x, f.y); c.rotate(aa); c.fillStyle = '#1C1917'; c.fillRect(0, -2.5, f.w * 0.7, 5); c.restore(); circ(c, f.x, f.y, f.w * 0.24, rg(c, f.x, f.y, f.w * 0.24, ['#A8A29E', '#57534E'])); }
        }
        c.fillStyle = '#FDE68A'; for (i = 0; i < bul.length; i++) c.fillRect(bul[i].x - 6, bul[i].y - 1, 12, 2.4);
        for (i = 0; i < eb.length; i++) { b = eb[i]; if (b.rk) { c.fillStyle = '#E5E7EB'; c.fillRect(b.x - 10, b.y - 2.5, 20, 5); c.fillStyle = '#EF4444'; c.fillRect(b.x - 12, b.y - 2.5, 4, 5); circ(c, b.x + 12, b.y, 4, 'rgba(251,146,60,.8)'); } else circ(c, b.x, b.y, b.fl ? 4 : 3, b.fl ? '#FB923C' : '#FCA5A5'); }
        for (i = 0; i < warn.length; i++) { if ((warn[i].t * 8 | 0) % 2) continue; var wy = warn[i].y; c.fillStyle = '#EF4444'; c.beginPath(); c.moveTo(W - 6, wy); c.lineTo(W - 24, wy - 10); c.lineTo(W - 24, wy + 10); c.fill(); c.fillStyle = '#fff'; c.fillRect(W - 19, wy - 5, 2.4, 6); c.fillRect(W - 19, wy + 3, 2.4, 2.4); }
        // player
        if (!(crash && crash.b)) {
          c.save(); c.translate(px, py); c.rotate(clamp(vy / 900, -0.3, 0.3) + (crash ? crash.r : 0) + 0.06);
          c.drawImage(hS, -hw / 2, -hw * 0.25, hw, hw * 0.5); c.restore();
          rotor(c, px + hw * 0.12, py - hw * 0.17, hw, 1);
        }
      },
      down: function (x, y) { drag = { y: y, s: tgY }; },
      move: function (x, y) { if (!drag || dead) return; tgY = clamp(drag.s + (y - drag.y) * 1.3, T + hw * 0.2, H - hw * 0.2); },
      up: function () { drag = null; },
      key: function (k) { if (k === 'up') tgY = Math.max(T + hw * 0.2, tgY - hw * 0.35); else if (k === 'down') tgY = Math.min(H - hw * 0.2, tgY + hw * 0.35); },
      boom: function () { swarm = { t: 0 }; for (var i = 0; i < 8; i++) eb.push({ x: W + rnd(0, 60), y: rnd(T, H * 0.8), vx: -W * 0.6, vy: rnd(-100, 100), rk: 1 }); A.sx('whoosh'); },
      win: function () { won = 0.001; drag = null; A.burst(px, py, 16, ['#FDE68A', '#FFFFFF'], 150, 0.6, 3); },
      dbg: function () { return { px: px, py: py, hw: hw, ter: terY(px), foes: foes.map(function (f) { return [f.k, f.x | 0, f.y | 0, f.hp]; }), eb: eb.map(function (b) { return [b.x | 0, b.y | 0, b.vx | 0, b.vy | 0]; }), dead: dead, kills: kills }; }
    };
  }, 'drag', 0.6);

  /* ================================================================== 12. DOGFIGHT — top-down jet fight over the sea: drag where you
     want to fly (the jet turns toward the finger, it fires by itself). Enemy fighters chase you; missiles home in (turn hard). */
  boot('dogfight', function (A) {
    var W, H, T, dpr, bg, pS = null, eS = null, shS = null, pw, me, cam = { x: 0, y: 0 }, foes = [], bul = [], eb = [], mis = [], dead = 0, won = 0, amb = null, t = 0, fireT = 0, spT = 0, steer = null, clouds = [], kills = 0;
    function jetS(w, enemy, shadow) {
      return mkc(w, w, dpr, function (c) {
        var m = w / 2; c.translate(m, m); c.rotate(Math.PI / 2); // drawn nose-up, turned to face +x
        var col = shadow ? ['rgba(0,0,0,.35)', 'rgba(0,0,0,.35)', 'rgba(0,0,0,.35)'] : enemy ? ['#FCA5A5', '#B91C1C', '#450A0A'] : ['#E2E8F0', '#64748B', '#1E293B'];
        // wings (swept delta)
        c.fillStyle = shadow ? col[0] : lg(c, -w * 0.45, 0, w * 0.45, 0, [col[2], col[1], col[0], col[1], col[2]]);
        c.beginPath(); c.moveTo(0, -w * 0.12); c.lineTo(w * 0.44, w * 0.16); c.lineTo(w * 0.44, w * 0.22); c.lineTo(w * 0.08, w * 0.18); c.lineTo(-w * 0.08, w * 0.18); c.lineTo(-w * 0.44, w * 0.22); c.lineTo(-w * 0.44, w * 0.16); c.closePath(); c.fill();
        // tail planes
        c.beginPath(); c.moveTo(0, w * 0.28); c.lineTo(w * 0.2, w * 0.42); c.lineTo(w * 0.2, w * 0.46); c.lineTo(-w * 0.2, w * 0.46); c.lineTo(-w * 0.2, w * 0.42); c.closePath(); c.fill();
        // fuselage
        c.fillStyle = shadow ? col[0] : lg(c, -w * 0.08, 0, w * 0.08, 0, [col[2], col[0], col[2]]);
        c.beginPath(); c.moveTo(0, -w * 0.48); c.quadraticCurveTo(w * 0.09, -w * 0.3, w * 0.08, 0); c.lineTo(w * 0.07, w * 0.46); c.lineTo(-w * 0.07, w * 0.46); c.lineTo(-w * 0.08, 0); c.quadraticCurveTo(-w * 0.09, -w * 0.3, 0, -w * 0.48); c.fill();
        if (shadow) return;
        // canopy + engine glow + markings
        c.fillStyle = lg(c, 0, -w * 0.3, 0, -w * 0.1, ['#E0F2FE', '#0EA5E9', '#0C4A6E']); c.beginPath(); c.ellipse(0, -w * 0.22, w * 0.035, w * 0.1, 0, 0, TAU); c.fill();
        c.fillStyle = 'rgba(255,255,255,.7)'; c.beginPath(); c.ellipse(-w * 0.012, -w * 0.25, w * 0.012, w * 0.04, 0, 0, TAU); c.fill();
        circ(c, 0, w * 0.47, w * 0.04, rg(c, 0, w * 0.47, w * 0.04, ['#FFF7ED', '#FB923C', 'rgba(251,146,60,0)']));
        if (enemy) { circ(c, w * 0.3, w * 0.17, w * 0.035, '#FDE68A'); circ(c, -w * 0.3, w * 0.17, w * 0.035, '#FDE68A'); }
        else { circ(c, w * 0.3, w * 0.17, w * 0.04, '#1D4ED8'); circ(c, w * 0.3, w * 0.17, w * 0.018, '#fff'); circ(c, -w * 0.3, w * 0.17, w * 0.04, '#1D4ED8'); circ(c, -w * 0.3, w * 0.17, w * 0.018, '#fff'); }
      });
    }
    function sp() { return pw * (4.4 + 1.6 * (A.live() ? A.lv() : 0)); }
    function turn(o, want, rate, dt) { var d = Math.atan2(Math.sin(want - o.a), Math.cos(want - o.a)); o.a += clamp(d, -rate * dt, rate * dt); return d; }
    function die() { if (A.live() && !dead) { if (A.fail(A.l.fail)) { dead = 1; boomFx(A, me.x - cam.x, me.y - cam.y, 1.3); } } }
    function sxy(o) { return [o.x - cam.x, o.y - cam.y]; }
    return {
      size: function (w, h, uu, d, top) {
        W = w; H = h; dpr = d; T = top; pw = clamp(Math.min(W, H) * 0.17, 56, 110);
        pS = jetS(pw, false); eS = jetS(pw * 0.9, true); shS = jetS(pw, false, true);
        var tile = 256;
        bg = mkc(tile, tile, dpr, function (c) {
          c.fillStyle = '#0F6680'; c.fillRect(0, 0, tile, tile);
          c.strokeStyle = 'rgba(255,255,255,.08)'; c.lineWidth = 1.5;
          for (var i = 0; i < 26; i++) { var x = Math.random() * tile, y = Math.random() * tile, l = rnd(6, 16); c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + l / 2, y - 2, x + l, y); c.stroke(); c.beginPath(); c.moveTo(x - tile, y); c.quadraticCurveTo(x - tile + l / 2, y - 2, x - tile + l, y); c.stroke(); }
        });
        clouds = []; for (var i = 0; i < 7; i++) clouds.push({ x: rnd(0, 1600), y: rnd(0, 1600), r: rnd(40, 90) });
      },
      reset: function () { me = { x: 0, y: 0, a: -Math.PI / 2 }; cam.x = -W / 2; cam.y = -(T + (H - T) * 0.55); foes = []; bul = []; eb = []; mis = []; dead = 0; won = 0; amb = null; spT = 1.2; steer = null; kills = 0; },
      step: function (dt, live) {
        t += dt; var i, f, b, lv = live ? A.lv() : 0.15, s = sp();
        if (!dead) {
          if (A.idle()) { var tg = foes[0]; if (tg) turn(me, Math.atan2(tg.y - me.y, tg.x - me.x), 2.2, dt); else turn(me, me.a + 0.4, 1, dt); }
          else if (steer) { var sc = sxy(me); if (Math.hypot(steer[0] - sc[0], steer[1] - sc[1]) > pw * 0.3) turn(me, Math.atan2(steer[1] - sc[1], steer[0] - sc[0]), 2.8, dt); }
          me.x += Math.cos(me.a) * s * dt; me.y += Math.sin(me.a) * s * dt;
        }
        // camera: the jet stays in the middle of the play area
        cam.x += (me.x - W / 2 - cam.x) * Math.min(1, dt * 5); cam.y += (me.y - (T + (H - T) * 0.55) - cam.y) * Math.min(1, dt * 5);
        fireT -= dt;
        if (fireT <= 0 && !dead && !amb && !won) { fireT = 0.11; for (var q = -1; q <= 1; q += 2) bul.push({ x: me.x + Math.cos(me.a) * pw * 0.45 + Math.cos(me.a + Math.PI / 2) * q * pw * 0.12, y: me.y + Math.sin(me.a) * pw * 0.45 + Math.sin(me.a + Math.PI / 2) * q * pw * 0.12, vx: Math.cos(me.a) * (s + W * 1.2), vy: Math.sin(me.a) * (s + W * 1.2), l: 0.45 }); if (A.live()) A.sx('gun', { k: 'mg', v: 0.3 }); }
        for (i = bul.length - 1; i >= 0; i--) { b = bul[i]; b.x += b.vx * dt; b.y += b.vy * dt; b.l -= dt; if (b.l <= 0) { bul.splice(i, 1); continue; } for (var j = foes.length - 1; j >= 0; j--) { f = foes[j]; if (Math.hypot(b.x - f.x, b.y - f.y) < pw * 0.38) { bul.splice(i, 1); f.hp--; A._xb = 1; A.burst(b.x - cam.x, b.y - cam.y, 3, ['#FDE68A', '#fff'], 60, 0.25, 2, 0); A._xb = 0; if (f.hp <= 0) { foes.splice(j, 1); kills++; boomFx(A, f.x - cam.x, f.y - cam.y, 1); } break; } } }
        if (amb) { amb.t += dt; if (!amb.hit && amb.t > 1.2) { amb.hit = 1; dead = 1; boomFx(A, me.x - cam.x, me.y - cam.y, 1.6); } }
        if (won) return;
        spT -= dt;
        var maxF = A.idle() ? 2 : 1 + Math.round(2.4 * lv);
        if (spT <= 0 && foes.length < maxF && !amb) { spT = Math.max(1.2, 3.6 - 2.2 * lv); var a0 = rnd(0, TAU), d0 = Math.max(W, H) * 0.75; foes.push({ x: me.x + Math.cos(a0) * d0, y: me.y + Math.sin(a0) * d0, a: a0 + Math.PI, hp: 3, fT: rnd(0.8, 1.6), mT: rnd(3, 6) }); }
        for (i = foes.length - 1; i >= 0; i--) {
          f = foes[i];
          var want = Math.atan2(me.y - f.y, me.x - f.x), dd = Math.hypot(me.x - f.x, me.y - f.y);
          turn(f, amb ? want : want + (dd < pw * 2.5 ? 0.9 : 0), (amb ? 3 : 1.7 + 0.9 * lv), dt);
          var fs = s * (amb ? 1.3 : 0.92 + 0.12 * lv); f.x += Math.cos(f.a) * fs * dt; f.y += Math.sin(f.a) * fs * dt;
          f.fT -= dt; var off = Math.abs(Math.atan2(Math.sin(want - f.a), Math.cos(want - f.a)));
          if ((A.live() || amb) && f.fT <= 0 && off < 0.35 && dd < Math.max(W, H) * 0.7) { f.fT = amb ? 0.25 : Math.max(0.5, 1.4 - 0.7 * lv); eb.push({ x: f.x + Math.cos(f.a) * pw * 0.4, y: f.y + Math.sin(f.a) * pw * 0.4, vx: Math.cos(f.a) * (fs + W * 0.8), vy: Math.sin(f.a) * (fs + W * 0.8), l: 0.9 }); }
          f.mT -= dt; if (A.live() && lv > 0.25 && f.mT <= 0 && dd < Math.max(W, H)) { f.mT = Math.max(4, 9 - 4 * lv); mis.push({ x: f.x, y: f.y, a: f.a, l: 4.2, w: 0.7 }); A.sx('whoosh'); }
          if (!dead && dd < pw * 0.5) { die(); }
          if (dd > Math.max(W, H) * 2) foes.splice(i, 1);
        }
        for (i = eb.length - 1; i >= 0; i--) { b = eb[i]; b.x += b.vx * dt; b.y += b.vy * dt; b.l -= dt; if (b.l <= 0) { eb.splice(i, 1); continue; } if (!dead && Math.hypot(b.x - me.x, b.y - me.y) < pw * 0.22) { eb.splice(i, 1); die(); } }
        for (i = mis.length - 1; i >= 0; i--) {
          var m = mis[i]; m.l -= dt; m.w -= dt;
          if (m.w <= 0) { turn(m, Math.atan2(me.y - m.y, me.x - m.x), 2.0 + 0.6 * lv, dt); var ms = s * 1.45; m.x += Math.cos(m.a) * ms * dt; m.y += Math.sin(m.a) * ms * dt; }
          if (m.l <= 0) { mis.splice(i, 1); A._xb = 1; A.burst(m.x - cam.x, m.y - cam.y, 8, ['#D6D3D1', '#FB923C'], 80, 0.4, 3, 0); A._xb = 0; continue; }
          if (!dead && Math.hypot(m.x - me.x, m.y - me.y) < pw * 0.3) { mis.splice(i, 1); die(); }
        }
      },
      draw: function (c) {
        // sea tile scrolling with the camera
        var tl = 256, ox = -(((cam.x % tl) + tl) % tl), oy = -(((cam.y % tl) + tl) % tl), x, y, i, f, p;
        for (x = ox; x < W; x += tl) for (y = oy; y < H; y += tl) c.drawImage(bg, x, y, tl, tl);
        var jet = function (img, o, w) { var q = sxy(o); c.save(); c.translate(q[0] + w * 0.12, q[1] + w * 0.22); c.rotate(o.a); c.drawImage(shS, -w / 2, -w / 2, w, w); c.restore(); c.save(); c.translate(q[0], q[1]); c.rotate(o.a); c.drawImage(img, -w / 2, -w / 2, w, w); c.restore(); };
        c.fillStyle = '#FDE68A'; for (i = 0; i < bul.length; i++) { p = sxy(bul[i]); c.fillRect(p[0] - 2, p[1] - 2, 4, 4); }
        c.fillStyle = '#FCA5A5'; for (i = 0; i < eb.length; i++) { p = sxy(eb[i]); c.fillRect(p[0] - 2, p[1] - 2, 4, 4); }
        for (i = 0; i < mis.length; i++) { var m = mis[i]; p = sxy(m); c.save(); c.translate(p[0], p[1]); c.rotate(m.a); c.fillStyle = '#E5E7EB'; c.fillRect(-9, -2.2, 18, 4.4); c.fillStyle = '#EF4444'; c.fillRect(6, -2.2, 4, 4.4); circ(c, -11, 0, 3 + Math.random() * 2, 'rgba(251,146,60,.85)'); c.restore(); }
        for (i = 0; i < foes.length; i++) jet(eS, foes[i], pw * 0.9);
        if (!dead) jet(pS, me, pw);
        // clouds above (parallax ×1.3)
        c.fillStyle = 'rgba(255,255,255,.32)';
        for (i = 0; i < clouds.length; i++) { var cl = clouds[i], cx = ((cl.x - cam.x * 1.3) % 1600 + 1600) % 1600 - 200, cy = ((cl.y - cam.y * 1.3) % 1600 + 1600) % 1600 - 200; if (cx > W + 100 || cy > H + 100) continue; c.beginPath(); c.ellipse(cx, cy, cl.r, cl.r * 0.55, 0, 0, TAU); c.ellipse(cx + cl.r * 0.6, cy + 6, cl.r * 0.6, cl.r * 0.4, 0, 0, TAU); c.fill(); }
        // off-screen arrows + missile warning
        for (i = 0; i < foes.length; i++) { f = foes[i]; p = sxy(f); if (p[0] > 0 && p[0] < W && p[1] > T && p[1] < H) continue; var a = Math.atan2(p[1] - (T + H) / 2, p[0] - W / 2), ex = clamp(W / 2 + Math.cos(a) * W, 14, W - 14), ey = clamp((T + H) / 2 + Math.sin(a) * H, T + 14, H - 14); c.save(); c.translate(ex, ey); c.rotate(a); c.fillStyle = '#F87171'; c.beginPath(); c.moveTo(9, 0); c.lineTo(-6, -7); c.lineTo(-6, 7); c.fill(); c.restore(); }
        if (mis.length && (t * 6 | 0) % 2 && !dead) { c.strokeStyle = 'rgba(239,68,68,.8)'; c.lineWidth = 5; c.strokeRect(3, T, W - 6, H - T - 3); }
        if (steer && !dead) { c.strokeStyle = 'rgba(255,255,255,.4)'; c.lineWidth = 1.5; c.beginPath(); c.arc(steer[0], steer[1], 14, 0, TAU); c.stroke(); }
      },
      down: function (x, y) { steer = [x, y]; },
      move: function (x, y) { if (steer) steer = [x, y]; },
      up: function () { steer = null; },
      key: function (k) { if (dead) return; me.a += k === 'left' ? -0.22 : k === 'right' ? 0.22 : 0; },
      boom: function () { amb = { t: 0 }; for (var i = 0; i < 5; i++) { var a0 = i / 5 * TAU; foes.push({ x: me.x + Math.cos(a0) * W * 0.7, y: me.y + Math.sin(a0) * W * 0.7, a: a0 + Math.PI, hp: 3, fT: 0.3, mT: 99 }); } A.sx('engine', { k: 'jet' }); },
      win: function () { won = 0.001; steer = null; var q = sxy(me); A.burst(q[0], q[1], 16, ['#FDE68A', '#FFFFFF'], 150, 0.6, 3); },
      dbg: function () { var q = sxy(me); return { me: { x: me.x, y: me.y, a: me.a, sx: q[0], sy: q[1] }, pw: pw, foes: foes.map(function (f) { var p = sxy(f); return [p[0] | 0, p[1] | 0, f.a, f.hp]; }), eb: eb.length, mis: mis.map(function (m) { var p = sxy(m); return [p[0] | 0, p[1] | 0, m.a]; }), dead: dead, kills: kills }; }
    };
  }, 'drag', 0.35);

  /* ------------------------------------------------------------------ soldiers with real proportions and a proper run cycle
     side view (Commando Run) and front view (Trench Defense). Drawn once per frame index into small sprites (8–12 frames),
     then only drawImage'd: smooth limbs, two-tone shading, helmet, vest, boots, rifle. h = full height (feet to helmet top). */
  function limb(c, x0, y0, x1, y1, w0, w1, col) { // tapered limb with rounded ends
    var a = Math.atan2(y1 - y0, x1 - x0), nx = -Math.sin(a), ny = Math.cos(a);
    c.fillStyle = col; c.beginPath();
    c.moveTo(x0 + nx * w0 / 2, y0 + ny * w0 / 2); c.lineTo(x1 + nx * w1 / 2, y1 + ny * w1 / 2); c.lineTo(x1 - nx * w1 / 2, y1 - ny * w1 / 2); c.lineTo(x0 - nx * w0 / 2, y0 - ny * w0 / 2); c.closePath(); c.fill();
    circ(c, x0, y0, w0 / 2, col); circ(c, x1, y1, w1 / 2, col);
  }
  var UNI = { light: '#6B7B3E', mid: '#4E5A2B', dark: '#353D1C', vest: '#3F4422', skin: '#C68B5E', skinD: '#9A6440', boot: '#1C1917', gun: '#27272A', gunL: '#52525B', strap: '#5C4033' };
  var UNE = { light: '#8A8F98', mid: '#5E636B', dark: '#3D4148', vest: '#2E3238', skin: '#D9A07A', skinD: '#A86F4E', boot: '#111111', gun: '#1F1F22', gunL: '#4B4B52', strap: '#3B2A20' };
  // side view, facing right. ph = run phase 0..1, mode: 'run' | 'jump' | 'slide' | 'aim'
  function soldierSide(c, h, ph, mode, P) {
    P = P || UNI;
    var s = h / 100, A0 = ph * TAU, lean = mode === 'slide' ? -0.95 : mode === 'aim' ? 0.05 : 0.28;
    var bob = mode === 'run' ? Math.abs(Math.cos(A0)) * 3 * s : 0;
    var hipX = 0, hipY = -50 * s - bob + (mode === 'slide' ? 36 * s : 0), TL = 30 * s, TH = 24 * s, SH = 24 * s;
    function leg(phi, back) {
      var th, kn;
      if (mode === 'jump') { th = back ? -0.5 : 0.9; kn = back ? 1.4 : 1.6; }
      else if (mode === 'slide') { th = back ? 1.2 : 1.5; kn = back ? 1.1 : 0.1; }
      else if (mode === 'aim') { th = back ? -0.25 : 0.2; kn = back ? 0.3 : 0.15; }
      else { th = 0.85 * Math.sin(phi); kn = 0.25 + 1.35 * Math.max(0, Math.sin(phi - 1.1)) * (Math.sin(phi) < 0.5 ? 1 : 0.6) + (Math.cos(phi) < 0 ? 0.2 : 0); }
      var kx = hipX + Math.sin(th) * TH, ky = hipY + Math.cos(th) * TH, fa = th - kn, fx = kx + Math.sin(fa) * SH, fy = ky + Math.cos(fa) * SH;
      var col = back ? P.dark : P.mid;
      limb(c, hipX, hipY, kx, ky, 11 * s, 9 * s, col); limb(c, kx, ky, fx, fy, 9 * s, 7 * s, col);
      // boot
      c.save(); c.translate(fx, fy); c.rotate(fa * 0.4 - (mode === 'slide' ? 1.2 : 0)); c.fillStyle = P.boot; rr(c, -4 * s, -3 * s, 13 * s, 7 * s, 3 * s); c.fill(); c.restore();
    }
    // back leg / arm first
    leg(A0 + Math.PI, true);
    var nX = hipX + Math.sin(lean) * TL, nY = hipY - Math.cos(lean) * TL;
    function arm(phi, back) {
      var sh = mode === 'run' ? -0.9 * Math.sin(phi) + 0.5 : mode === 'jump' ? (back ? -1.6 : 1.9) : 1.2, el = mode === 'run' ? 1.5 + 0.35 * Math.cos(phi) : 1.3;
      if (!back && (mode === 'run' || mode === 'aim' || mode === 'slide')) { sh = 1.25; el = 0.9; }
      var ex = nX + Math.sin(lean + sh) * 17 * s, ey = nY + Math.cos(lean + sh) * 17 * s, hx = ex + Math.sin(lean + sh - el) * 16 * s, hy = ey + Math.cos(lean + sh - el) * 16 * s;
      var col = back ? P.dark : P.light;
      limb(c, nX, nY + 3 * s, ex, ey, 8 * s, 7 * s, col); limb(c, ex, ey, hx, hy, 7 * s, 6 * s, col); circ(c, hx, hy, 3.6 * s, back ? P.skinD : P.skin);
      return [hx, hy];
    }
    var bh = arm(A0, true);
    // backpack
    c.save(); c.translate((hipX + nX) / 2, (hipY + nY) / 2); c.rotate(lean); c.fillStyle = P.dark; rr(c, -12 * s, -12 * s, 8 * s, 22 * s, 3 * s); c.fill(); c.restore();
    // torso
    c.save(); c.translate(hipX, hipY); c.rotate(lean);
    c.fillStyle = lg(c, -8 * s, 0, 9 * s, 0, [P.dark, P.mid, P.light]); rr(c, -8 * s, -TL - 2 * s, 17 * s, TL + 6 * s, 6 * s); c.fill();
    c.fillStyle = P.vest; rr(c, -7 * s, -TL + 4 * s, 15 * s, TL * 0.62, 3 * s); c.fill();
    c.fillStyle = 'rgba(0,0,0,.25)'; rr(c, 1 * s, -TL * 0.55, 5 * s, 5 * s, 1 * s); c.fill(); rr(c, 1 * s, -TL * 0.3, 5 * s, 5 * s, 1 * s); c.fill();
    c.fillStyle = P.strap; c.fillRect(-8 * s, -3 * s, 17 * s, 3 * s);
    c.restore();
    // head + helmet
    var hx0 = nX + Math.sin(lean) * 9 * s, hy0 = nY - Math.cos(lean) * 9 * s;
    c.fillStyle = P.skin; c.fillRect(nX - 2.5 * s, nY - 4 * s, 5 * s, 5 * s);
    circ(c, hx0 + 1.5 * s, hy0, 7.5 * s, rg(c, hx0 + 1.5 * s, hy0, 7.5 * s, [P.skin, P.skin, P.skinD], 2 * s, -2 * s));
    c.fillStyle = '#1F1A17'; c.fillRect(hx0 + 5 * s, hy0 - 1.5 * s, 2.2 * s, 1.6 * s);
    c.fillStyle = lg(c, 0, hy0 - 10 * s, 0, hy0, [P.light, P.mid, P.dark]); c.beginPath(); c.ellipse(hx0 + 0.5 * s, hy0 - 2.5 * s, 9.5 * s, 7 * s, lean * 0.5, Math.PI, 0); c.lineTo(hx0 + 10.5 * s, hy0 - 1 * s); c.lineTo(hx0 - 9 * s, hy0 - 1 * s); c.fill();
    c.fillStyle = 'rgba(255,255,255,.2)'; c.beginPath(); c.ellipse(hx0 - 2 * s, hy0 - 7 * s, 4 * s, 1.6 * s, -0.3, 0, TAU); c.fill();
    // front leg, rifle, front arm
    leg(A0, false);
    var fh = arm(A0 + Math.PI, false);
    c.save(); c.translate(fh[0], fh[1]); c.rotate(mode === 'aim' ? -0.02 : mode === 'jump' ? -0.5 : -0.25 + lean * 0.3);
    c.fillStyle = P.gun; rr(c, -14 * s, -2.4 * s, 36 * s, 5 * s, 1.5 * s); c.fill(); c.fillStyle = P.gunL; c.fillRect(-2 * s, -2.4 * s, 12 * s, 1.4 * s);
    c.fillStyle = P.strap; rr(c, -20 * s, -2 * s, 8 * s, 6.5 * s, 1.5 * s); c.fill(); c.fillStyle = P.gun; c.fillRect(4 * s, 2 * s, 3 * s, 6 * s);
    c.restore();
    circ(c, fh[0], fh[1], 3.8 * s, P.skin);
    void bh;
  }
  // front view, running toward the camera. ph 0..1
  function soldierFront(c, h, ph, P) {
    P = P || UNE;
    var s = h / 100, A0 = ph * TAU, bob = Math.abs(Math.sin(A0)) * 3 * s, hipY = -48 * s - bob;
    for (var side = -1; side <= 1; side += 2) { // legs: the lifted one is shorter (knee toward us)
      var up = Math.max(0, Math.sin(A0 + (side > 0 ? 0 : Math.PI))), x = side * 6 * s, kneeY = hipY + 22 * s - up * 9 * s, footY = -2 * s - up * 16 * s;
      limb(c, x, hipY, x + side * 1.5 * s, kneeY, 11 * s, 10 * s, up > 0.3 ? P.light : P.mid);
      limb(c, x + side * 1.5 * s, kneeY, x + side * 1 * s, footY, 9.5 * s, 7.5 * s, up > 0.3 ? P.mid : P.dark);
      c.fillStyle = P.boot; rr(c, x + side * s - 5 * s, footY - 2 * s, 10 * s, 6 * s, 2.5 * s); c.fill();
    }
    var sy = hipY - 30 * s;
    c.fillStyle = lg(c, -11 * s, 0, 11 * s, 0, [P.dark, P.light, P.mid, P.dark]); rr(c, -11 * s, sy, 22 * s, 33 * s, 7 * s); c.fill();
    c.fillStyle = P.vest; rr(c, -9 * s, sy + 6 * s, 18 * s, 18 * s, 3 * s); c.fill();
    c.fillStyle = 'rgba(0,0,0,.25)'; for (var q = -1; q <= 1; q++) { rr(c, q * 6 * s - 2.4 * s, sy + 15 * s, 4.8 * s, 6 * s, 1 * s); c.fill(); }
    c.fillStyle = P.strap; c.fillRect(-11 * s, hipY - 4 * s, 22 * s, 3 * s);
    // arms holding the rifle across the chest (port arms), swinging slightly
    var sw = Math.sin(A0) * 2 * s;
    limb(c, -10 * s, sy + 4 * s, -12 * s, sy + 18 * s + sw, 8 * s, 7 * s, P.mid); limb(c, -12 * s, sy + 18 * s + sw, -4 * s, sy + 22 * s + sw, 7 * s, 6 * s, P.mid);
    limb(c, 10 * s, sy + 4 * s, 12 * s, sy + 14 * s - sw, 8 * s, 7 * s, P.mid); limb(c, 12 * s, sy + 14 * s - sw, 6 * s, sy + 9 * s - sw, 7 * s, 6 * s, P.mid);
    c.save(); c.translate(0, sy + 16 * s); c.rotate(-0.75 + sw * 0.01); c.fillStyle = P.gun; rr(c, -19 * s, -2.5 * s, 38 * s, 5 * s, 1.5 * s); c.fill(); c.fillStyle = P.strap; rr(c, 8 * s, -3 * s, 10 * s, 6 * s, 1.5 * s); c.fill(); c.restore();
    circ(c, -4 * s, sy + 22 * s + sw, 3.4 * s, P.skin); circ(c, 6 * s, sy + 9 * s - sw, 3.4 * s, P.skin);
    // head + helmet
    var hy = sy - 8 * s; c.fillStyle = P.skinD; c.fillRect(-3 * s, sy - 3 * s, 6 * s, 5 * s);
    c.fillStyle = rg(c, 0, hy, 8 * s, [P.skin, P.skin, P.skinD], -2 * s, -1 * s); c.beginPath(); c.ellipse(0, hy, 6.5 * s, 8 * s, 0, 0, TAU); c.fill();
    c.fillStyle = '#1F1A17'; c.fillRect(-4 * s, hy - 0.5 * s, 2.6 * s, 1.6 * s); c.fillRect(1.4 * s, hy - 0.5 * s, 2.6 * s, 1.6 * s);
    c.fillStyle = 'rgba(0,0,0,.3)'; c.fillRect(-2.5 * s, hy + 4 * s, 5 * s, 1.2 * s);
    c.fillStyle = lg(c, 0, hy - 12 * s, 0, hy - 1 * s, [P.light, P.mid, P.dark]); c.beginPath(); c.ellipse(0, hy - 3 * s, 10 * s, 8 * s, 0, Math.PI, 0); c.lineTo(10.5 * s, hy - 1.5 * s); c.lineTo(-10.5 * s, hy - 1.5 * s); c.fill();
    c.fillStyle = 'rgba(255,255,255,.18)'; c.beginPath(); c.ellipse(-3 * s, hy - 8 * s, 4 * s, 1.6 * s, -0.2, 0, TAU); c.fill();
  }
  function rigHelmet(col) { return function (c, x, y, r) { var g = c.createLinearGradient(0, y - r * 1.4, 0, y); g.addColorStop(0, col[0]); g.addColorStop(1, col[1]); c.fillStyle = g; c.beginPath(); c.ellipse(x, y - r * 0.25, r * 1.22, r * 1.0, 0, Math.PI, 0); c.lineTo(x + r * 1.3, y - r * 0.05); c.lineTo(x - r * 1.3, y - r * 0.05); c.fill(); c.fillStyle = 'rgba(255,255,255,.18)'; c.beginPath(); c.ellipse(x - r * 0.4, y - r * 0.85, r * 0.45, r * 0.16, -0.3, 0, TAU); c.fill(); }; }
  var RIG_EN = { skin: '#D9A07A', top: ['#7A7F88', '#4A4E55'], bottom: ['#5E636B', '#3D4148'], shoe: '#111111', gloves: '#2B2F14', hat: rigHelmet(['#8A8F98', '#3D4148']) };
  function rigFrames(h, n, fn) { // pre-rendered frames: canvas size 1.1h × 1.1h, feet at the bottom centre
    var out = []; for (var i = 0; i < n; i++) out.push(mkc(h * 1.2, h * 1.12, Math.min(2, window.devicePixelRatio || 1), function (c) { c.translate(h * 0.6, h * 1.08); fn(c, i / n); }));
    return out;
  }

  /* ================================================================== 13. TRENCH DEFENSE — first-person from the trench: enemy
     soldiers charge across the battlefield (front-view run cycle, perspective). Tap one to shoot him; shoot grenades in
     the air too. One soldier reaching the trench, or a grenade landing in it, ends the round. */
  boot('trenchdef', function (A) {
    var W, H, T, dpr, bg, hy, gy, bh, fr = [], foes = [], gren = [], puffs = [], cool = 0, aimA = 0, flash = 0, dead = 0, won = 0, bomb = null, t = 0, spT = 0, aiT = 0, kills = 0, NF = 8;
    function scr(f) { var k = 1 - f.z, sc = 0.3 + 0.7 * k * k; return { x: W / 2 + f.x * W * 0.46 * (0.35 + 0.65 * k), y: hy + (gy - hy) * (0.05 + 0.95 * k * k), s: sc }; }
    function spawn(live) { var lv = live ? A.lv() : 0.2; foes.push({ x: rnd(-0.9, 0.9), z: 1, vz: (0.075 + 0.075 * lv) * rnd(0.85, 1.2), dx: rnd(-0.12, 0.12), ph: Math.random(), dn: 0, gT: lv > 0.15 && Math.random() < 0.35 + 0.3 * lv ? rnd(0.25, 0.6) : 9 }); }
    function shootAt(x, y) {
      if (cool > 0 || dead || bomb || won) return;
      cool = 0.26; flash = 0.08; aimA = Math.atan2(y - H, x - W / 2); A.sx('gun', { k: 'rifle' });
      for (var i = 0; i < gren.length; i++) { var g = gren[i], gp = gpos(g); if (Math.hypot(gp.x - x, gp.y - y) < Math.max(18, bh * 0.12)) { gren.splice(i, 1); boomFx(A, gp.x, gp.y, 0.5); return; } }
      var best = null;
      foes.forEach(function (f) { if (f.dn) return; var p = scr(f), hh = bh * p.s; if (Math.abs(x - p.x) < hh * 0.24 + 6 && y > p.y - hh * 1.02 - 6 && y < p.y + 4) { if (!best || f.z < best.z) best = f; } });
      if (best) { best.dn = 0.001; kills++; var p = scr(best); A.burst(x, y, 6, ['#7F1D1D', '#B91C1C', '#D6D3D1'], 70, 0.4, 2.4, 120); A.sx('hit'); void p; return; }
      puffs.push({ x: x, y: y, t: 0 }); if (puffs.length > 10) puffs.shift();
    }
    function gpos(g) { var k = Math.min(1, g.t / g.T), x = g.x0 + (g.x1 - g.x0) * k, y = g.y0 + (g.y1 - g.y0) * k - Math.sin(k * Math.PI) * (H - T) * 0.35; return { x: x, y: y, k: k }; }
    return {
      size: function (w, h, uu, d, top) {
        W = w; H = h; dpr = d; T = top; hy = T + (H - T) * 0.12; gy = H - (H - T) * 0.14; bh = clamp((H - T) * 0.42, 90, 260);
        // v2860 people: D6.Rig (js/art-rig.js, real proportions) + helmet + rifle held across the chest; own rig as a fallback
        fr = rigFrames(bh, NF, function (c, ph) {
          if (!D6.Rig) { soldierFront(c, bh, ph); return; }
          D6.Rig.draw(c, bh, { view: 'front', pose: 'run', ph: ph, pal: RIG_EN });
          var s = bh / 100, bob = Math.abs(Math.sin(ph * TAU)) * 1.5 * s;
          c.save(); c.translate(0, -bh * 0.62 - bob); c.rotate(-0.7); c.fillStyle = lg(c, 0, -3 * s, 0, 3 * s, ['#52525B', '#1F1F22']); rr(c, -20 * s, -2.4 * s, 40 * s, 4.8 * s, 1.5 * s); c.fill(); c.fillStyle = '#5C4033'; rr(c, 9 * s, -3 * s, 11 * s, 6 * s, 1.5 * s); c.fill(); c.restore();
          circ(c, -5 * s, -bh * 0.56 - bob, 3.2 * s, '#2B2F14'); circ(c, 7 * s, -bh * 0.68 - bob, 3.2 * s, '#2B2F14');
        });
        bg = mkc(W, H, dpr, function (c) {
          c.fillStyle = lg(c, 0, 0, 0, hy, ['#1F2937', '#57534E', '#A8A29E']); c.fillRect(0, 0, W, hy + 2);
          for (var i = 0; i < 5; i++) { var sx = rnd(0, W), sy = hy - rnd(4, 30); circ(c, sx, sy, rnd(14, 34), 'rgba(41,37,36,.35)'); }
          c.fillStyle = lg(c, 0, hy, 0, H, ['#57534E', '#44403C', '#292524']); c.fillRect(0, hy, W, H - hy);
          for (i = 0; i < 26; i++) { var k = Math.random(), y = hy + (gy - hy) * k * k, r = (6 + 30 * k) * rnd(0.6, 1.3), x = rnd(0, W); c.fillStyle = 'rgba(28,25,23,.45)'; c.beginPath(); c.ellipse(x, y, r * 1.6, r * 0.45, 0, 0, TAU); c.fill(); c.fillStyle = 'rgba(168,162,158,.15)'; c.beginPath(); c.ellipse(x, y - r * 0.2, r * 1.6, r * 0.2, 0, Math.PI, 0); c.fill(); }
          // barbed wire rows
          [0.35, 0.62].forEach(function (k) { var y = hy + (gy - hy) * k * k; c.strokeStyle = 'rgba(28,25,23,.8)'; c.lineWidth = 1; for (var x = 0; x < W; x += 26 * (0.4 + k)) { c.beginPath(); c.moveTo(x, y); c.lineTo(x, y - 14 * k); c.stroke(); } c.beginPath(); for (x = 0; x <= W; x += 4) c.lineTo(x, y - 9 * k + Math.sin(x * 0.5) * 3 * k); c.stroke(); });
          // our parapet: sandbags
          for (var row = 0; row < 2; row++) for (var x2 = -20 + row * 18; x2 < W + 20; x2 += 36) { var by = H - (H - gy) * (row ? 0.95 : 0.5); c.fillStyle = lg(c, 0, by - 12, 0, by + 12, ['#C2B280', '#8B7D5A', '#5C5340']); rr(c, x2, by - 12, 38, 24, 11); c.fill(); c.strokeStyle = 'rgba(0,0,0,.25)'; c.stroke(); }
        });
      },
      reset: function () { foes = []; gren = []; puffs = []; cool = 0; dead = 0; won = 0; bomb = null; spT = 0.5; kills = 0; },
      step: function (dt, live) {
        t += dt; cool = Math.max(0, cool - dt); flash = Math.max(0, flash - dt); var i, f;
        for (i = puffs.length - 1; i >= 0; i--) { puffs[i].t += dt; if (puffs[i].t > 0.5) puffs.splice(i, 1); }
        for (i = foes.length - 1; i >= 0; i--) {
          f = foes[i];
          if (f.dn) { f.dn += dt; if (f.dn > 0.9) foes.splice(i, 1); continue; }
          if (bomb || dead || won) continue;
          f.ph = (f.ph + dt * (1.6 + f.vz * 4)) % 1; f.z -= f.vz * dt; f.x = clamp(f.x + f.dx * dt, -0.95, 0.95); if (Math.random() < dt * 0.5) f.dx = -f.dx;
          if (f.gT < 9 && f.z < 1 - f.gT) { f.gT = 9; var p = scr(f), hh = bh * p.s; gren.push({ x0: p.x, y0: p.y - hh * 0.8, x1: clamp(p.x + rnd(-40, 40), 30, W - 30), y1: H - (H - gy) * 0.6, t: 0, T: 1.8 + f.z }); }
          if (f.z <= 0) { if (A.live()) { if (A.fail(A.l.fail)) { dead = 1; A.shake(0.4); } } else foes.splice(i, 1); }
        }
        for (i = gren.length - 1; i >= 0; i--) { var g = gren[i]; g.t += dt; if (g.t >= g.T) { gren.splice(i, 1); boomFx(A, g.x1, g.y1, 1.1); if (A.live() && !dead) { if (A.fail(A.l.fail2)) dead = 1; } } }
        if (bomb) { bomb.t += dt; bomb.k -= dt; if (bomb.k <= 0 && bomb.n < 6) { bomb.k = 0.15; bomb.n++; boomFx(A, (bomb.n / 6) * W, H - (H - gy) * 0.6, 1.3); } return; }
        if (dead || won) return;
        var lv = live ? A.lv() : 0.2;
        spT -= dt; if (spT <= 0) { spawn(live); spT = Math.max(0.45, 1.8 - 1.2 * lv) * rnd(0.7, 1.3); }
        if (A.idle()) { aiT += dt; if (aiT > 0.55) { aiT = 0; var tg = gren[0]; if (tg) { var gp = gpos(tg); shootAt(gp.x, gp.y); } else { var near = foes.filter(function (q) { return !q.dn; }).sort(function (a, b) { return a.z - b.z; })[0]; if (near && near.z < 0.8) { var p2 = scr(near); shootAt(p2.x, p2.y - bh * p2.s * 0.55); } } } }
      },
      draw: function (c) {
        A.bg(bg);
        var list = foes.slice().sort(function (a, b) { return b.z - a.z; }), i;
        for (i = 0; i < list.length; i++) {
          var f = list[i], p = scr(f), hh = bh * p.s, img = fr[Math.floor(f.ph * NF) % NF];
          c.fillStyle = 'rgba(0,0,0,.25)'; c.beginPath(); c.ellipse(p.x, p.y, hh * 0.2, hh * 0.04, 0, 0, TAU); c.fill();
          if (f.dn) { c.save(); c.globalAlpha = Math.max(0, 1 - f.dn * 1.1); c.translate(p.x, p.y); c.rotate(Math.min(1.4, f.dn * 5) * (f.x > 0 ? 1 : -1)); c.drawImage(img, -hh * 0.6, -hh * 1.08, hh * 1.2, hh * 1.12); c.restore(); continue; }
          c.drawImage(img, p.x - hh * 0.6, p.y - hh * 1.08, hh * 1.2, hh * 1.12);
          if (f.z < 0.3 && (t * 6 | 0) % 2) { c.strokeStyle = 'rgba(239,68,68,.8)'; c.lineWidth = 2; c.beginPath(); c.arc(p.x, p.y - hh * 0.55, hh * 0.45, 0, TAU); c.stroke(); }
        }
        for (i = 0; i < gren.length; i++) { var g = gren[i], gp = gpos(g); c.fillStyle = 'rgba(0,0,0,.3)'; c.beginPath(); c.ellipse(g.x0 + (g.x1 - g.x0) * gp.k, g.y0 + (g.y1 - g.y0) * gp.k, 7, 2.5, 0, 0, TAU); c.fill(); circ(c, gp.x, gp.y, Math.max(4, bh * 0.035), '#3F4422'); circ(c, gp.x - 1.5, gp.y - 1.5, 1.6, '#A3B18A'); if ((t * 8 | 0) % 2) { c.strokeStyle = '#EF4444'; c.lineWidth = 1.5; c.beginPath(); c.arc(gp.x, gp.y, 12, 0, TAU); c.stroke(); } }
        for (i = 0; i < puffs.length; i++) { var q = puffs[i]; c.globalAlpha = 1 - q.t / 0.5; circ(c, q.x, q.y - q.t * 20, 4 + q.t * 18, 'rgba(214,211,209,.7)'); c.globalAlpha = 1; }
        // our rifle at the bottom, turned toward the last shot
        c.save(); c.translate(W / 2 + W * 0.12, H + 6); c.rotate(clamp(aimA, -2.6, -0.55) + Math.PI / 2);
        c.fillStyle = lg(c, -6, 0, 6, 0, ['#1F1F22', '#52525B', '#1F1F22']); c.fillRect(-4, -(H - T) * 0.3, 8, (H - T) * 0.3); c.fillStyle = '#5C4033'; rr(c, -9, -(H - T) * 0.1, 18, (H - T) * 0.12, 4); c.fill();
        if (flash) { circ(c, 0, -(H - T) * 0.32, 14, rg(c, 0, -(H - T) * 0.32, 14, ['#FFF7ED', '#FDBA74', 'rgba(251,146,60,0)'])); }
        c.restore();
        if (cool > 0) { c.fillStyle = 'rgba(253,230,138,.85)'; c.fillRect(W / 2 - 20, H - 6, 40 * (1 - cool / 0.26), 3); }
      },
      act: function (k, x, y) { shootAt(x, y); },
      key: function () { var near = foes.filter(function (q) { return !q.dn; }).sort(function (a, b) { return a.z - b.z; })[0]; if (near) { var p = scr(near); shootAt(p.x, p.y - bh * p.s * 0.55); } },
      boom: function () { bomb = { t: 0, k: 0.3, n: 0 }; A.sx('engine', { k: 'jet' }); },
      win: function () { won = 0.001; A.burst(W / 2, H * 0.8, 16, ['#FDE68A', '#FFFFFF'], 150, 0.6, 3); },
      dbg: function () { return { foes: foes.map(function (f) { var p = scr(f); return { x: p.x, y: p.y, h: bh * p.s, z: f.z, dn: f.dn }; }), gren: gren.map(function (g) { var p = gpos(g); return { x: p.x, y: p.y, t: g.t, T: g.T }; }), cool: cool, dead: dead, kills: kills }; }
    };
  }, 'aim', 0.5);

  /* ================================================================== 14. COMMANDO RUN — side-scrolling run (12-frame run cycle,
     parallax, dust): swipe up to jump wire and mines, swipe down to slide under barriers and bullets, tap to shoot. */
  boot('commando', function (A) {
    var W, H, T, dpr, bg, far = null, gy, ch, px, runF = [], jumpS, slideS, enS = [], enAim, y = 0, vy = 0, slideT = 0, obs = [], bul = [], eb = [], dist = 0, sp = 0, dead = 0, won = 0, strike = null, t = 0, ph = 0, nextO = 0, cool = 0, dust = [], kills = 0, G2;
    var NR = 12;
    function state() { return y < -2 ? 'jump' : slideT > 0 ? 'slide' : 'run'; }
    function box() { var s = state(); if (s === 'slide') return { x0: px - ch * 0.2, x1: px + ch * 0.35, y0: gy - ch * 0.32, y1: gy }; return { x0: px - ch * 0.14, x1: px + ch * 0.18, y0: gy + y - ch * 0.92, y1: gy + y }; }
    function addObs(live) {
      var lv = live ? A.lv() : 0.2, r = Math.random(), x = W + ch;
      var k = r < 0.22 ? 'wire' : r < 0.4 ? 'mine' : r < 0.62 ? 'bar' : r < 0.86 ? 'enemy' : 'bags';
      if (!live && k === 'enemy' && Math.random() < 0.5) k = 'wire';
      var o = { k: k, x: x, hp: 1, fT: 0, fired: 0, ph: Math.random() };
      if (k === 'enemy') o.fT = Math.max(0.5, 1.2 - 0.5 * lv);
      obs.push(o);
      nextO = (ch * rnd(3.2, 5.2)) * (1.15 - 0.35 * Math.min(1, lv));
    }
    function obox(o) {
      if (o.k === 'wire') return { x0: o.x - ch * 0.25, x1: o.x + ch * 0.25, y0: gy - ch * 0.28, y1: gy };
      if (o.k === 'mine') return { x0: o.x - ch * 0.16, x1: o.x + ch * 0.16, y0: gy - ch * 0.1, y1: gy };
      if (o.k === 'bags') return { x0: o.x - ch * 0.3, x1: o.x + ch * 0.3, y0: gy - ch * 0.38, y1: gy };
      if (o.k === 'bar') return { x0: o.x - ch * 0.12, x1: o.x + ch * 0.12, y0: gy - ch * 1.4, y1: gy - ch * 0.42 };
      return { x0: o.x - ch * 0.16, x1: o.x + ch * 0.16, y0: gy - ch * 0.95, y1: gy };
    }
    function over(a, b) { return a.x0 < b.x1 && a.x1 > b.x0 && a.y0 < b.y1 && a.y1 > b.y0; }
    function die(why) { if (A.live() && !dead) { if (A.fail(why || A.l.fail)) { dead = 1; A.shake(0.4); A.burst(px, gy + y - ch * 0.5, 14, ['#7F1D1D', '#FDE68A', '#78716C'], 160, 0.6, 3); } } }
    function act(k) {
      if (dead || strike || won) return;
      if (k === 'up' && y >= -1) { vy = -Math.sqrt(2 * G2 * ch * 1.15); slideT = 0; A.sx('jump'); }
      else if (k === 'down') { if (y < -2) vy = Math.max(vy, Math.sqrt(2 * G2 * ch * 0.8)); slideT = 0.62; A.sx('whoosh', { v: 0.4 }); }
      else if (k === 'tap' || k === 'right') { if (cool <= 0) { cool = 0.22; bul.push({ x: px + ch * 0.35, y: gy + y - ch * (state() === 'slide' ? 0.2 : 0.6) }); A.sx('gun', { k: 'rifle', v: 0.6 }); } }
    }
    return {
      size: function (w, h, uu, d, top) {
        W = w; H = h; dpr = d; T = top; gy = H - (H - T) * 0.16; ch = clamp((H - T) * 0.3, 70, 190); px = W * 0.22; G2 = ch * 9;
        runF = rigFrames(ch, NR, function (c, p) { soldierSide(c, ch, p, 'run'); });
        jumpS = rigFrames(ch, 1, function (c) { soldierSide(c, ch, 0.2, 'jump'); })[0];
        slideS = rigFrames(ch, 1, function (c) { soldierSide(c, ch, 0.2, 'slide'); })[0];
        enAim = rigFrames(ch, 1, function (c) { soldierSide(c, ch, 0, 'aim', UNE); })[0];
        bg = mkc(W, H, dpr, function (c) { c.fillStyle = lg(c, 0, 0, 0, H, ['#7C2D12', '#EA580C', '#FDBA74']); c.fillRect(0, 0, W, H); circ(c, W * 0.75, T + (H - T) * 0.3, (H - T) * 0.1, 'rgba(255,247,237,.85)'); });
        far = mkc(W * 2, H, dpr, function (c) {
          c.fillStyle = 'rgba(67,20,7,.55)'; c.beginPath(); c.moveTo(0, H); for (var x = 0; x <= W * 2; x += 10) c.lineTo(x, gy - (H - T) * 0.28 + Math.sin(x / W * TAU * 2) * (H - T) * 0.06 + Math.sin(x / W * TAU * 5) * (H - T) * 0.02); c.lineTo(W * 2, H); c.fill();
          // ruined buildings
          c.fillStyle = 'rgba(41,16,8,.85)';
          for (x = 0; x < W * 2; x += rnd(W * 0.25, W * 0.45)) { var bw = rnd(30, 70), bh = rnd((H - T) * 0.15, (H - T) * 0.35); c.beginPath(); c.moveTo(x, gy); c.lineTo(x, gy - bh); c.lineTo(x + bw * 0.3, gy - bh * 0.85); c.lineTo(x + bw * 0.5, gy - bh * 1.05); c.lineTo(x + bw, gy - bh * 0.7); c.lineTo(x + bw, gy); c.fill(); }
        });
      },
      reset: function () { y = 0; vy = 0; slideT = 0; obs = []; bul = []; eb = []; dist = 0; dead = 0; won = 0; strike = null; nextO = W * 0.6; cool = 0; dust = []; kills = 0; },
      step: function (dt, live) {
        t += dt; var lv = live ? A.lv() : 0.2, i, o;
        sp = dead ? sp * Math.max(0, 1 - dt * 3) : W * (0.55 + 0.55 * lv);
        if (strike) sp *= 0.5;
        dist += sp * dt; ph = (ph + dt * sp / (ch * 1.25)) % 1; cool = Math.max(0, cool - dt);
        // physics
        if (!dead) { vy += G2 * dt; y = Math.min(0, y + vy * dt); if (y === 0) vy = 0; slideT = Math.max(0, slideT - dt); }
        if (!A.lite && y === 0 && slideT <= 0 && !dead && Math.random() < dt * 20) dust.push({ x: px - ch * 0.1, y: gy, t: 0 });
        if (slideT > 0 && !dead) dust.push({ x: px + ch * 0.2, y: gy, t: 0 });
        for (i = dust.length - 1; i >= 0; i--) { dust[i].t += dt; dust[i].x -= sp * dt * 0.8; if (dust[i].t > 0.4) dust.splice(i, 1); }
        if (dust.length > 30) dust.splice(0, dust.length - 30);
        nextO -= sp * dt; if (nextO <= 0 && !strike && !won) addObs(live);
        var me = box();
        for (i = obs.length - 1; i >= 0; i--) {
          o = obs[i]; o.x -= sp * dt;
          if (o.x < -ch) { obs.splice(i, 1); continue; }
          if (o.dn) { o.dn += dt; continue; }
          if (o.k === 'enemy') { o.fT -= dt * (o.x < W * 0.95 ? 1 : 0); if (!o.fired && o.fT <= 0 && o.x - px < W * 0.75 && o.x > px + ch) { o.fired = 1; eb.push({ x: o.x - ch * 0.3, y: gy - ch * 0.6, hit: A.live() }); A.sx('gun', { k: 'rifle', v: 0.5 }); } }
          if (!dead && over(me, obox(o)) && (A.live())) { if (o.k === 'mine') boomFx(A, o.x, gy, 0.9); die(); }
          if (A.idle() && !dead) { // attract mode: reads the obstacle ahead
            var dx = o.x - px;
            if (dx > 0 && dx < ch * 1.6 && !o.done) {
              if ((o.k === 'wire' || o.k === 'mine' || o.k === 'bags') && dx < ch * 1.1) { o.done = 1; act('up'); }
              else if (o.k === 'bar' && dx < ch * 0.9) { o.done = 1; act('down'); }
            }
            if (o.k === 'enemy' && !o.dn && dx > 0 && dx < W * 0.7 && Math.random() < dt * 3) act('tap');
          }
        }
        for (i = bul.length - 1; i >= 0; i--) { var b = bul[i]; b.x += W * 1.6 * dt; if (b.x > W + 10) { bul.splice(i, 1); continue; } for (var j = 0; j < obs.length; j++) { o = obs[j]; if (o.k === 'enemy' && !o.dn) { var ob = obox(o); if (b.x > ob.x0 && b.x < ob.x1 && b.y > ob.y0 && b.y < ob.y1) { o.dn = 0.001; kills++; bul.splice(i, 1); A.burst(b.x, b.y, 6, ['#7F1D1D', '#B91C1C'], 80, 0.4, 2.4, 100); A.sx('hit'); break; } } } }
        for (i = eb.length - 1; i >= 0; i--) { var e = eb[i]; e.x -= W * 1.0 * dt; if (e.x < -10) { eb.splice(i, 1); continue; } if (!dead && e.x > me.x0 && e.x < me.x1 && e.y > me.y0 && e.y < me.y1) { eb.splice(i, 1); if (e.hit) die(); } else if (A.idle() && e.x - px < ch * 1.2 && e.x > px) act('down'); }
        if (strike) { strike.t += dt; strike.k -= dt; if (strike.k <= 0 && strike.n < 5) { strike.k = 0.22; strike.n++; boomFx(A, px + rnd(-ch, ch * 2), gy - ch * 0.2, 1.2); if (strike.n === 4) dead = 1; } }
      },
      draw: function (c) {
        A.bg(bg);
        var fx = -((dist * 0.25) % (W * 2)), i, o;
        c.drawImage(far, fx, 0, W * 2, H); c.drawImage(far, fx + W * 2, 0, W * 2, H);
        // ground with moving texture (sense of speed)
        c.fillStyle = lg(c, 0, gy, 0, H, ['#57534E', '#292524']); c.fillRect(0, gy, W, H - gy);
        c.fillStyle = '#78716C'; c.fillRect(0, gy, W, 3);
        c.fillStyle = 'rgba(0,0,0,.25)'; var gs = ch * 0.5, go = -(dist % gs); for (var x = go; x < W; x += gs) c.fillRect(x, gy + 8, gs * 0.35, 2);
        c.fillStyle = 'rgba(255,255,255,.08)'; go = -((dist * 1.4) % (gs * 1.6)); for (x = go; x < W; x += gs * 1.6) c.fillRect(x, gy + (H - gy) * 0.5, gs * 0.6, 2);
        if (sp > W * 0.8 && !A.lite) { c.strokeStyle = 'rgba(255,255,255,.18)'; c.lineWidth = 1.5; for (i = 0; i < 5; i++) { var ly = T + (H - T) * (0.2 + i * 0.13), lx = W - ((t * sp * 1.6 + i * 137) % (W * 1.4)); c.beginPath(); c.moveTo(lx, ly); c.lineTo(lx + ch * 0.8, ly); c.stroke(); } }
        for (i = 0; i < obs.length; i++) {
          o = obs[i];
          if (o.k === 'wire') { c.strokeStyle = '#1C1917'; c.lineWidth = 2; c.beginPath(); c.moveTo(o.x - ch * 0.22, gy); c.lineTo(o.x - ch * 0.22, gy - ch * 0.3); c.moveTo(o.x + ch * 0.22, gy); c.lineTo(o.x + ch * 0.22, gy - ch * 0.3); c.stroke(); c.strokeStyle = '#71717A'; c.lineWidth = 1.2; for (var q = 0; q < 3; q++) { c.beginPath(); for (var k = 0; k <= 10; k++) { var xx = o.x - ch * 0.25 + k * ch * 0.05; c.lineTo(xx, gy - ch * (0.08 + q * 0.08) + (k % 2 ? 3 : -3)); } c.stroke(); } }
          else if (o.k === 'mine') { c.fillStyle = lg(c, 0, gy - ch * 0.1, 0, gy, ['#78716C', '#292524']); c.beginPath(); c.ellipse(o.x, gy, ch * 0.15, ch * 0.08, 0, Math.PI, 0); c.fill(); circ(c, o.x, gy - ch * 0.08, ch * 0.025, (t * 4 | 0) % 2 ? '#EF4444' : '#7F1D1D'); }
          else if (o.k === 'bags') { for (q = 0; q < 3; q++) { c.fillStyle = lg(c, 0, gy - ch * 0.38, 0, gy, ['#C2B280', '#8B7D5A', '#5C5340']); rr(c, o.x - ch * 0.3 + (q % 2) * ch * 0.05, gy - ch * 0.13 * (q + 1), ch * 0.6, ch * 0.13, ch * 0.06); c.fill(); } }
          else if (o.k === 'bar') { c.fillStyle = '#44403C'; c.fillRect(o.x - ch * 0.1, gy - ch * 1.4, ch * 0.05, ch * 1.4); c.fillRect(o.x + ch * 0.05, gy - ch * 1.4, ch * 0.05, ch * 1.4); for (q = 0; q < 6; q++) { c.fillStyle = q % 2 ? '#FACC15' : '#1C1917'; c.fillRect(o.x - ch * 0.5 + q * ch * 0.17, gy - ch * 0.62, ch * 0.17, ch * 0.18); } c.fillStyle = 'rgba(239,68,68,.85)'; c.fillRect(o.x - ch * 0.55, gy - ch * 1.4, ch * 1.1, ch * 0.78); c.fillStyle = '#FEF2F2'; c.font = '900 ' + Math.round(ch * 0.2) + 'px system-ui'; c.textAlign = 'center'; c.fillText('⚠', o.x, gy - ch * 0.92); }
          else { c.save(); c.translate(o.x, gy); c.scale(-1, 1); if (o.dn) { c.globalAlpha = Math.max(0, 1 - o.dn * 1.5); c.rotate(-Math.min(1.4, o.dn * 5)); } c.drawImage(enAim, -ch * 0.6, -ch * 1.08, ch * 1.2, ch * 1.12); c.restore(); c.globalAlpha = 1; if (!o.dn && !o.fired && o.x < W) { c.strokeStyle = 'rgba(239,68,68,.9)'; c.lineWidth = 2; c.beginPath(); c.arc(o.x, gy - ch * 0.6, ch * 0.32, -Math.PI / 2, -Math.PI / 2 + TAU * Math.max(0, 1 - o.fT / 1.2)); c.stroke(); } }
        }
        c.fillStyle = '#FDE68A'; for (i = 0; i < bul.length; i++) c.fillRect(bul[i].x - 8, bul[i].y - 1.2, 16, 2.4);
        c.fillStyle = '#FCA5A5'; for (i = 0; i < eb.length; i++) c.fillRect(eb[i].x - 8, eb[i].y - 1.2, 16, 2.4);
        for (i = 0; i < dust.length; i++) { var d = dust[i]; c.globalAlpha = 0.5 * (1 - d.t / 0.4); circ(c, d.x, d.y - d.t * 20, 3 + d.t * 18, '#D6D3D1'); } c.globalAlpha = 1;
        if (!(dead && strike && strike.n >= 4)) {
          var img = state() === 'jump' ? jumpS : state() === 'slide' ? slideS : runF[Math.floor(ph * NR) % NR];
          c.fillStyle = 'rgba(0,0,0,.25)'; c.beginPath(); c.ellipse(px, gy, ch * 0.22 * (1 + y / ch * 0.3), ch * 0.04, 0, 0, TAU); c.fill();
          c.save(); c.translate(px, gy + y); if (dead) { c.rotate(-Math.min(1.5, t * 0)); c.globalAlpha = 0.85; } c.drawImage(img, -ch * 0.6, -ch * 1.08, ch * 1.2, ch * 1.12); c.restore(); c.globalAlpha = 1;
          if (cool > 0.14) circ(c, px + ch * 0.42, gy + y - ch * (state() === 'slide' ? 0.2 : 0.6), ch * 0.06, rg(c, px + ch * 0.42, gy + y - ch * 0.6, ch * 0.06, ['#FFF7ED', '#FB923C', 'rgba(251,146,60,0)']));
        }
      },
      act: function (k) { act(k); },
      boom: function () { strike = { t: 0, k: 0.2, n: 0 }; A.sx('engine', { k: 'jet' }); },
      win: function () { won = 0.001; A.burst(px, gy - ch * 0.6, 16, ['#FDE68A', '#FFFFFF'], 150, 0.6, 3); },
      dbg: function () { return { y: y, slide: slideT, ch: ch, px: px, gy: gy, sp: sp, obs: obs.map(function (o) { return [o.k, o.x | 0, o.dn ? 1 : 0, o.fired]; }), eb: eb.map(function (e) { return e.x | 0; }), dead: dead, kills: kills }; }
    };
  }, 'swipe4', 0.5);

  /* ================================================================== 15. ALIEN WAVE — the classic fleet that marches and steps
     down: drag your cannon (it fires by itself), hide behind the shields, dodge the bombs. Each wave is faster. */
  boot('alienwave', function (A) {
    var W, H, T, dpr, bg, aw, gx, cy0, cx = 0, al = [], dirx = 1, vx = 0, step = 0, bul = [], bombs = [], shields = [], dead = 0, won = 0, laser = null, t = 0, fireT = 0, wave = 0, drag = null, tx = 0, spr = [], ufo = null, aiT = 0, kills = 0, frame = 0, frT = 0;
    var AC = [['#F0ABFC', '#C026D3', '#701A75'], ['#86EFAC', '#16A34A', '#14532D'], ['#7DD3FC', '#0284C7', '#0C4A6E']];
    function alienS(k, f) {
      return mkc(aw, aw * 0.8, dpr, function (c, w, h) {
        var col = AC[k], m = w / 2;
        c.translate(m, h * 0.5);
        if (k === 0) { // jelly: dome + wavy tentacles
          c.fillStyle = rg(c, -w * 0.1, -h * 0.2, w * 0.45, [col[0], col[1], col[2]]); c.beginPath(); c.arc(0, -h * 0.05, w * 0.32, Math.PI, 0); c.lineTo(w * 0.32, h * 0.1); c.lineTo(-w * 0.32, h * 0.1); c.fill();
          c.strokeStyle = col[1]; c.lineWidth = w * 0.07; c.lineCap = 'round'; for (var i = -1; i <= 1; i++) { c.beginPath(); c.moveTo(i * w * 0.18, h * 0.08); c.quadraticCurveTo(i * w * 0.18 + (f ? 4 : -4), h * 0.25, i * w * 0.2, h * 0.38); c.stroke(); }
        } else if (k === 1) { // crab-like with claws
          c.fillStyle = rg(c, -w * 0.1, -h * 0.15, w * 0.45, [col[0], col[1], col[2]]); c.beginPath(); c.ellipse(0, 0, w * 0.3, h * 0.24, 0, 0, TAU); c.fill();
          c.strokeStyle = col[1]; c.lineWidth = w * 0.07; c.lineCap = 'round'; c.beginPath(); c.moveTo(-w * 0.26, 0); c.lineTo(-w * 0.42, f ? -h * 0.3 : -h * 0.1); c.moveTo(w * 0.26, 0); c.lineTo(w * 0.42, f ? -h * 0.3 : -h * 0.1); c.moveTo(-w * 0.15, h * 0.2); c.lineTo(-w * 0.22, h * 0.4); c.moveTo(w * 0.15, h * 0.2); c.lineTo(w * 0.22, h * 0.4); c.stroke();
        } else { // saucer-bug
          c.fillStyle = rg(c, 0, -h * 0.1, w * 0.4, [col[0], col[1], col[2]]); c.beginPath(); c.ellipse(0, h * 0.06, w * 0.4, h * 0.16, 0, 0, TAU); c.fill(); c.beginPath(); c.ellipse(0, -h * 0.06, w * 0.2, h * 0.2, 0, Math.PI, 0); c.fill();
          for (i = -2; i <= 2; i++) circ(c, i * w * 0.14, h * 0.08, w * 0.035, (i + (f ? 1 : 0)) % 2 ? '#FDE68A' : '#fff');
        }
        circ(c, -w * 0.1, -h * 0.08, w * 0.07, '#fff'); circ(c, w * 0.1, -h * 0.08, w * 0.07, '#fff'); circ(c, -w * 0.09, -h * 0.06, w * 0.035, '#111827'); circ(c, w * 0.11, -h * 0.06, w * 0.035, '#111827');
      });
    }
    function newWave(live) {
      var lv = live ? A.lv() : 0.2, cols = 7, rows = Math.min(5, 3 + Math.floor(lv * 2 + wave * 0.5));
      al = []; for (var r = 0; r < rows; r++) for (var c = 0; c < cols; c++) al.push({ c: c, r: r, k: r < 1 ? 0 : r < 3 ? 1 : 2, on: 1 });
      cx = 0; cy0 = T + aw * 0.5 + Math.min(wave, 4) * aw * 0.25; dirx = 1; wave++;
      vx = W * (0.07 + 0.05 * lv + 0.02 * wave);
    }
    function apos(a) { return [W / 2 - 3 * aw * 1.25 + a.c * aw * 1.25 + cx, cy0 + a.r * aw * 0.95]; }
    function makeShields() { shields = []; for (var s = 0; s < 3; s++) { var sx = W * (0.2 + s * 0.3), sy = gx - aw * 1.9; for (var i = 0; i < 8; i++) for (var j = 0; j < 4; j++) { if (j === 3 && (i > 2 && i < 5)) continue; shields.push({ x: sx - aw * 0.8 + i * aw * 0.2, y: sy + j * aw * 0.2, on: 1 }); } } }
    function hitShield(x, y) { for (var i = 0; i < shields.length; i++) { var b = shields[i]; if (b.on && x > b.x && x < b.x + aw * 0.2 && y > b.y && y < b.y + aw * 0.2) { b.on = 0; return true; } } return false; }
    return {
      size: function (w, h, uu, d, top) {
        W = w; H = h; dpr = d; T = top; aw = clamp(Math.min(W / 10, (H - T) / 12), 26, 64); gx = H - aw * 0.8;
        spr = []; for (var k = 0; k < 3; k++) spr.push([alienS(k, 0), alienS(k, 1)]);
        bg = mkc(W, H, dpr, function (c) {
          c.fillStyle = lg(c, 0, 0, 0, H, ['#020617', '#1E1B4B', '#312E81']); c.fillRect(0, 0, W, H); stars(c, W, H, A.lite ? 50 : 120);
          circ(c, W * 0.85, T + (H - T) * 0.2, aw * 0.9, rg(c, W * 0.85, T + (H - T) * 0.2, aw * 0.9, ['#FDE68A', '#F97316', '#7C2D12'], -aw * 0.3, -aw * 0.3));
          c.fillStyle = lg(c, 0, gx, 0, H, ['#4C1D95', '#2E1065']); c.fillRect(0, gx + aw * 0.35, W, H); c.fillStyle = '#A78BFA'; c.fillRect(0, gx + aw * 0.35, W, 2);
        });
        if (!tx) tx = W / 2;
      },
      reset: function (live) { wave = 0; newWave(live); bul = []; bombs = []; makeShields(); dead = 0; won = 0; laser = null; ufo = null; tx = W / 2; drag = null; kills = 0; },
      step: function (dt, live) {
        t += dt; var lv = live ? A.lv() : 0.2, i, a, p;
        frT += dt; if (frT > 0.45 - 0.2 * Math.min(1, lv)) { frT = 0; frame ^= 1; }
        if (laser) { laser.t += dt; if (!laser.hit && laser.t > 0.7) { laser.hit = 1; boomFx(A, tx, gx, 1.5); dead = 1; } return; }
        if (dead || won) return;
        if (A.idle()) { aiT += dt; var tgt = al.filter(function (q) { return q.on; }).sort(function (q1, q2) { return q2.r - q1.r; })[0]; if (tgt) { var want = apos(tgt)[0]; bombs.forEach(function (b) { if (Math.abs(b.x - want) < aw * 0.6 && b.y > gx - aw * 4) want += (want < W / 2 ? 1 : -1) * aw * 1.5; }); tx += clamp(want - tx, -W * 0.6 * dt, W * 0.6 * dt); } }
        tx = clamp(tx, aw * 0.6, W - aw * 0.6);
        var alive = al.filter(function (q) { return q.on; });
        if (!alive.length) { A.ring(W / 2, T + (H - T) * 0.3, W * 0.4, '#FDE68A'); newWave(live); return; }
        var speed = vx * (1 + 1.6 * (1 - alive.length / al.length));
        cx += dirx * speed * dt;
        var minX = 1e9, maxX = -1e9, maxY = 0;
        alive.forEach(function (q) { p = apos(q); minX = Math.min(minX, p[0]); maxX = Math.max(maxX, p[0]); maxY = Math.max(maxY, p[1]); });
        if ((dirx > 0 && maxX > W - aw * 0.6) || (dirx < 0 && minX < aw * 0.6)) { dirx = -dirx; cy0 += aw * (0.35 + 0.15 * lv); }
        if (maxY + aw * 0.4 > gx - aw * 0.3) { if (A.live()) { if (A.fail(A.l.fail2)) { dead = 1; boomFx(A, tx, gx, 1.2); } return; } newWave(false); makeShields(); }
        // fire
        fireT -= dt; if (fireT <= 0 && bul.length < 2) { fireT = 0.34; bul.push({ x: tx, y: gx - aw * 0.5 }); if (A.live()) A.sx('gun', { k: 'laser', v: 0.4 }); }
        for (i = bul.length - 1; i >= 0; i--) {
          var b = bul[i]; b.y -= H * 1.25 * dt; if (b.y < T - 10) { bul.splice(i, 1); continue; }
          if (hitShield(b.x, b.y)) { bul.splice(i, 1); continue; }
          if (ufo && Math.abs(b.x - ufo.x) < aw * 0.6 && Math.abs(b.y - ufo.y) < aw * 0.3) { bul.splice(i, 1); A.burst(ufo.x, ufo.y, 20, ['#FDE68A', '#F43F5E', '#fff'], 200, 0.6, 3); A.ring(ufo.x, ufo.y, aw * 1.4, '#FDE68A'); ufo = null; continue; }
          for (var j = 0; j < alive.length; j++) { a = alive[j]; p = apos(a); if (Math.abs(b.x - p[0]) < aw * 0.42 && Math.abs(b.y - p[1]) < aw * 0.35) { a.on = 0; kills++; bul.splice(i, 1); A.burst(p[0], p[1], 8, [AC[a.k][0], AC[a.k][1], '#fff'], 120, 0.45, 3, 0); break; } }
        }
        // bombs from the lowest alien of a random column
        var rate = (0.7 + 1.8 * lv + 0.2 * wave) * dt;
        if (Math.random() < rate) { var colsA = {}; alive.forEach(function (q) { if (!colsA[q.c] || colsA[q.c].r < q.r) colsA[q.c] = q; }); var ks = Object.keys(colsA); if (ks.length) { var sh = colsA[ks[(Math.random() * ks.length) | 0]]; p = apos(sh); bombs.push({ x: p[0], y: p[1] + aw * 0.3, v: H * (0.32 + 0.25 * lv) }); } }
        for (i = bombs.length - 1; i >= 0; i--) {
          b = bombs[i]; b.y += b.v * dt; if (b.y > H) { bombs.splice(i, 1); continue; }
          if (hitShield(b.x, b.y)) { bombs.splice(i, 1); continue; }
          if (Math.abs(b.x - tx) < aw * 0.5 && b.y > gx - aw * 0.4 && b.y < gx + aw * 0.3) { bombs.splice(i, 1); if (A.live()) { if (A.fail(A.l.fail)) { dead = 1; boomFx(A, tx, gx, 1.2); } return; } }
        }
        if (!ufo && Math.random() < dt * 0.06) ufo = { x: -aw, y: T + aw * 0.1, v: W * 0.25 };
        if (ufo) { ufo.x += ufo.v * dt; if (ufo.x > W + aw) ufo = null; }
      },
      draw: function (c) {
        A.bg(bg);
        var i, a, p;
        for (i = 0; i < al.length; i++) { a = al[i]; if (!a.on) continue; p = apos(a); c.drawImage(spr[a.k][frame], p[0] - aw / 2, p[1] - aw * 0.4, aw, aw * 0.8); }
        c.fillStyle = '#4ADE80'; for (i = 0; i < shields.length; i++) { var s = shields[i]; if (s.on) c.fillRect(s.x, s.y, aw * 0.2 - 0.5, aw * 0.2 - 0.5); }
        for (i = 0; i < bul.length; i++) { c.fillStyle = '#FDE68A'; c.fillRect(bul[i].x - 1.5, bul[i].y - aw * 0.25, 3, aw * 0.3); }
        for (i = 0; i < bombs.length; i++) { var b = bombs[i]; c.strokeStyle = '#F87171'; c.lineWidth = 2.4; c.beginPath(); for (var k = 0; k < 4; k++) c.lineTo(b.x + (k % 2 ? 3 : -3), b.y - aw * 0.3 + k * aw * 0.1); c.stroke(); }
        if (ufo) { c.fillStyle = rg(c, ufo.x, ufo.y, aw * 0.6, ['#FECACA', '#EF4444', '#7F1D1D']); c.beginPath(); c.ellipse(ufo.x, ufo.y, aw * 0.6, aw * 0.2, 0, 0, TAU); c.fill(); c.fillStyle = 'rgba(186,230,253,.8)'; c.beginPath(); c.ellipse(ufo.x, ufo.y - aw * 0.1, aw * 0.25, aw * 0.18, 0, Math.PI, 0); c.fill(); }
        if (laser) { var lx = tx; c.fillStyle = rg(c, W / 2, T, aw * 2, ['#FECACA', '#EF4444', '#7F1D1D']); c.beginPath(); c.ellipse(W / 2, T + aw * 0.4 * Math.min(1, laser.t * 3), aw * 2, aw * 0.5, 0, 0, TAU); c.fill(); if (laser.t > 0.35) { c.globalAlpha = 0.85; c.fillStyle = (t * 20 | 0) % 2 ? '#FCA5A5' : '#FFFFFF'; c.beginPath(); c.moveTo(W / 2 - 6, T + aw * 0.5); c.lineTo(W / 2 + 6, T + aw * 0.5); c.lineTo(lx + 16, gx); c.lineTo(lx - 16, gx); c.fill(); c.globalAlpha = 1; } }
        if (!dead || !laser) {
          if (!dead) { c.fillStyle = lg(c, tx - aw * 0.5, 0, tx + aw * 0.5, 0, ['#64748B', '#E2E8F0', '#475569']); c.beginPath(); c.moveTo(tx - aw * 0.55, gx + aw * 0.3); c.lineTo(tx - aw * 0.45, gx); c.lineTo(tx + aw * 0.45, gx); c.lineTo(tx + aw * 0.55, gx + aw * 0.3); c.fill(); c.fillStyle = '#94A3B8'; rr(c, tx - aw * 0.2, gx - aw * 0.25, aw * 0.4, aw * 0.3, aw * 0.1); c.fill(); c.fillStyle = '#334155'; c.fillRect(tx - aw * 0.06, gx - aw * 0.55, aw * 0.12, aw * 0.35); circ(c, tx, gx - aw * 0.08, aw * 0.07, '#38BDF8'); }
        }
      },
      down: function (x) { drag = { x: x, s: tx }; },
      move: function (x) { if (drag && !dead) tx = clamp(drag.s + (x - drag.x) * 1.25, aw * 0.6, W - aw * 0.6); },
      up: function () { drag = null; },
      key: function (k) { if (k === 'left') tx -= aw * 0.5; else if (k === 'right') tx += aw * 0.5; },
      boom: function () { laser = { t: 0 }; drag = null; A.sx('engine', { k: 'laser' }); },
      win: function () { won = 0.001; drag = null; A.burst(tx, gx, 16, ['#FDE68A', '#FFFFFF', '#4ADE80'], 150, 0.6, 3); },
      dbg: function () { return { tx: tx, gx: gx, aw: aw, al: al.filter(function (q) { return q.on; }).map(function (q) { var p = apos(q); return [p[0] | 0, p[1] | 0]; }), bombs: bombs.map(function (b) { return [b.x | 0, b.y | 0]; }), dead: dead, wave: wave, kills: kills }; }
    };
  }, 'drag', 0.62);

  /* ================================================================== 16. CITY SHIELD — missiles fall on your cities: tap to fire an
     interceptor; it flies to the point and blows up, destroying the missiles in its blast. Aim ahead. Some split. */
  boot('cityshield', function (A) {
    var W, H, T, dpr, bg, gyy, cities = [], mis = [], ints = [], blasts = [], dead = 0, won = 0, mega = null, t = 0, spT = 0, aiT = 0, R, lx, ly, kills = 0;
    function addMis(live, x0, y0, tgt) {
      var lv = live ? A.lv() : 0.2, c = tgt !== undefined ? tgt : (Math.random() * cities.length) | 0, ci = cities[c];
      x0 = x0 === undefined ? rnd(W * 0.05, W * 0.95) : x0; y0 = y0 === undefined ? T : y0;
      var tx = ci.x + rnd(-ci.w * 0.3, ci.w * 0.3), ty = gyy - ci.h * 0.4, d = Math.hypot(tx - x0, ty - y0), v = (H - T) * (0.085 + 0.1 * lv) * rnd(0.85, 1.2);
      mis.push({ x0: x0, y0: y0, x: x0, y: y0, vx: (tx - x0) / d * v, vy: (ty - y0) / d * v, c: c, sp: live && lv > 0.3 && Math.random() < 0.3 && tgt === undefined ? rnd(0.3, 0.55) : 0 });
    }
    function fire(x, y) {
      if (dead || mega || won || ints.length >= 3) return;
      y = Math.min(y, gyy - 30); var d = Math.hypot(x - lx, y - ly), v = (H - T) * 1.9;
      ints.push({ x: lx, y: ly, tx: x, ty: y, vx: (x - lx) / d * v, vy: (y - ly) / d * v, t: d / v }); A.sx('whoosh', { v: 0.5 });
    }
    function cityS(c, ci, broken) {
      var x = ci.x - ci.w / 2;
      for (var i = 0; i < ci.b.length; i++) { var b = ci.b[i], bh = broken ? b.h * 0.35 : b.h; c.fillStyle = lg(c, 0, gyy - bh, 0, gyy, [b.c, '#1E293B']); c.fillRect(x + b.x, gyy - bh, b.w, bh); if (!broken) { c.fillStyle = 'rgba(253,224,71,.75)'; for (var wy = gyy - bh + 4; wy < gyy - 4; wy += 6) for (var wx = x + b.x + 2; wx < x + b.x + b.w - 3; wx += 5) if ((wx * 7 + wy * 3) % 5 < 2) c.fillRect(wx, wy, 2, 2.5); } }
    }
    return {
      size: function (w, h, uu, d, top) {
        W = w; H = h; dpr = d; T = top; gyy = H - (H - T) * 0.08; R = clamp(Math.min(W, H - T) * 0.1, 26, 70); lx = W / 2; ly = gyy - 18;
        cities = []; var n = 4, cw = W / (n + 1.5);
        for (var i = 0; i < n; i++) { var cx = (i < 2 ? i + 0.6 : i + 1.4) * (W / (n + 1)) + cw * 0.1, bs = []; for (var k = 0; k < 5; k++) bs.push({ x: k * cw * 0.17, w: cw * 0.15, h: rnd(14, 40) * (H - T) / 500 + 10, c: ['#475569', '#64748B', '#334155'][k % 3] }); cities.push({ x: cx, w: cw * 0.85, h: 40, b: bs, on: 1 }); }
        bg = mkc(W, H, dpr, function (c) {
          c.fillStyle = lg(c, 0, 0, 0, H, ['#020617', '#172554', '#1E3A8A']); c.fillRect(0, 0, W, H); stars(c, W, gyy - 60, A.lite ? 50 : 110);
          c.fillStyle = lg(c, 0, gyy, 0, H, ['#3F3F46', '#18181B']); c.fillRect(0, gyy, W, H - gyy);
          c.fillStyle = '#52525B'; c.beginPath(); c.moveTo(lx - 30, gyy); c.lineTo(lx - 18, gyy - 16); c.lineTo(lx + 18, gyy - 16); c.lineTo(lx + 30, gyy); c.fill();
        });
      },
      reset: function () { mis = []; ints = []; blasts = []; cities.forEach(function (ci) { ci.on = 1; }); dead = 0; won = 0; mega = null; spT = 0.8; kills = 0; },
      step: function (dt, live) {
        t += dt; var lv = live ? A.lv() : 0.2, i, j, m, b;
        for (i = ints.length - 1; i >= 0; i--) { var it = ints[i]; it.t -= dt; it.x += it.vx * dt; it.y += it.vy * dt; if (it.t <= 0) { ints.splice(i, 1); blasts.push({ x: it.tx, y: it.ty, t: 0, r: R }); A.sx('boom', { v: 0.35 }); } }
        for (i = blasts.length - 1; i >= 0; i--) { b = blasts[i]; b.t += dt; if (b.t > 1.1) { blasts.splice(i, 1); continue; } var rr2 = b.r * (b.t < 0.35 ? ease(b.t / 0.35) : b.t < 0.7 ? 1 : 1 - (b.t - 0.7) / 0.4); b.cr = rr2;
          for (j = mis.length - 1; j >= 0; j--) { m = mis[j]; if (Math.hypot(m.x - b.x, m.y - b.y) < rr2) { mis.splice(j, 1); kills++; if (!b.ch) blasts.push({ x: m.x, y: m.y, t: 0.1, r: R * 0.5, ch: 1 }); A.burst(m.x, m.y, 6, ['#FDE68A', '#FB923C'], 90, 0.4, 2.6, 0); } } }
        if (mega) { mega.t += dt; mega.y += (H - T) * 0.5 * dt; if (!mega.hit && mega.y >= gyy - 40) { mega.hit = 1; boomFx(A, mega.x, gyy - 30, 2); cities.forEach(function (ci) { ci.on = 0; }); dead = 1; } return; }
        if (dead || won) return;
        spT -= dt; if (spT <= 0) { addMis(live); spT = Math.max(0.5, 2.1 - 1.4 * lv) * rnd(0.7, 1.3); }
        for (i = mis.length - 1; i >= 0; i--) {
          m = mis[i]; m.x += m.vx * dt; m.y += m.vy * dt;
          if (m.sp && m.y - T > (gyy - T) * m.sp) { m.sp = 0; var n2 = 2 + (Math.random() < 0.4 ? 1 : 0); for (j = 0; j < n2; j++) addMis(live, m.x, m.y, (m.c + j + 1) % cities.length); }
          var ci = cities[m.c];
          if (m.y >= gyy - ci.h * 0.4) { mis.splice(i, 1); boomFx(A, m.x, m.y, 1.2); if (A.live()) { ci.on = 0; if (A.fail(A.l.fail)) dead = 1; return; } }
        }
        if (A.idle()) { aiT += dt; if (aiT > 0.7) { aiT = 0; var lo = mis.slice().sort(function (a, b2) { return b2.y - a.y; })[0]; if (lo && lo.y > T + (H - T) * 0.2) { var tt = 0.45; fire(lo.x + lo.vx * tt, lo.y + lo.vy * tt); } } }
      },
      draw: function (c) {
        A.bg(bg);
        var i, m;
        for (i = 0; i < cities.length; i++) cityS(c, cities[i], !cities[i].on);
        c.lineCap = 'round';
        for (i = 0; i < mis.length; i++) { m = mis[i]; var gr = c.createLinearGradient(m.x0, m.y0, m.x, m.y); gr.addColorStop(0, 'rgba(248,113,113,0)'); gr.addColorStop(1, 'rgba(248,113,113,.85)'); c.strokeStyle = gr; c.lineWidth = 2; c.beginPath(); c.moveTo(m.x0, m.y0); c.lineTo(m.x, m.y); c.stroke(); circ(c, m.x, m.y, 3.2, '#FEF2F2'); }
        for (i = 0; i < ints.length; i++) { var it = ints[i]; c.strokeStyle = 'rgba(125,211,252,.7)'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(lx, ly); c.lineTo(it.x, it.y); c.stroke(); circ(c, it.x, it.y, 3, '#E0F2FE'); c.strokeStyle = 'rgba(255,255,255,.6)'; c.lineWidth = 1; c.beginPath(); c.moveTo(it.tx - 5, it.ty - 5); c.lineTo(it.tx + 5, it.ty + 5); c.moveTo(it.tx + 5, it.ty - 5); c.lineTo(it.tx - 5, it.ty + 5); c.stroke(); }
        for (i = 0; i < blasts.length; i++) { var b = blasts[i]; if (!(b.cr > 0)) continue; /* 2026-10-21: a rounding −1e-16 radius threw in createRadialGradient */ c.fillStyle = rg(c, b.x, b.y, b.cr, ['rgba(255,255,255,.95)', 'rgba(253,230,138,.8)', 'rgba(249,115,22,.25)']); c.beginPath(); c.arc(b.x, b.y, b.cr, 0, TAU); c.fill(); }
        if (mega) { c.save(); c.translate(mega.x, mega.y); c.fillStyle = lg(c, -12, 0, 12, 0, ['#475569', '#E2E8F0', '#475569']); rr(c, -12, -60, 24, 60, 10); c.fill(); c.fillStyle = '#DC2626'; c.beginPath(); c.moveTo(-12, -2); c.lineTo(0, 22); c.lineTo(12, -2); c.fill(); circ(c, 0, -66, 10 + Math.random() * 6, 'rgba(251,146,60,.8)'); c.restore(); }
        // launcher barrel
        circ(c, lx, ly + 4, 8, '#A1A1AA');
      },
      act: function (k, x, y) { fire(x, y); },
      key: function () { var lo = mis.slice().sort(function (a, b) { return b.y - a.y; })[0]; if (lo) fire(lo.x + lo.vx * 0.45, lo.y + lo.vy * 0.45); },
      boom: function () { var ci = cities[(Math.random() * cities.length) | 0]; mega = { x: ci.x, y: T - 40, t: 0 }; A.sx('whoosh'); },
      win: function () { won = 0.001; A.burst(W / 2, gyy - 40, 18, ['#FDE68A', '#FFFFFF', '#7DD3FC'], 160, 0.6, 3); },
      dbg: function () { return { mis: mis.map(function (m) { return [m.x | 0, m.y | 0, m.vx | 0, m.vy | 0]; }), ints: ints.length, cities: cities.map(function (c) { return c.on; }), R: R, dead: dead, kills: kills }; }
    };
  }, 'aim', 0.5);
})(window.D6 = window.D6 || {});
