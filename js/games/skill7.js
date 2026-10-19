/* v2850 — "You're in control" group 7 (owner request, round 6: "I love war games"): TANK BATTLE (artillery duel),
   SNIPER (city at dusk, scope), GUNSHIP (attack helicopter), DOGFIGHT (jet fight over the sea) and more war games.
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
        idle: function () { return phase === 'idle'; },
        fail: function (why) {                                              // the player's own mistake
          if (phase !== 'play') return false;
          phase = 'failing'; sx('fail'); amb(false); say(why || l.fail, 'lost'); setBtn(l.bet, '', 'wait'); btn.disabled = true;
          sendFail(); return true;
        },
        burst: function (x, y, n, cols, sp, life, sz, grav) {
          if (phase === 'play' && !A._xb) K.sfx('hit'); // v2832 : un bon coup (fruit coupé, brique, pièce…) sonne ; jamais l'explosion d'une erreur
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
})(window.D6 = window.D6 || {});
