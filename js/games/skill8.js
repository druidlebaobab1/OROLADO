/* v2850 — "You're in control" group 8 (owner request, round 6): more classics everybody knows — NEON PONG, METEOR BLASTER,
   SKY HOPPER (doodle-style climber), FRUIT CATCH, BEAT TAP (rhythm), ROPE SWING, MINI GOLF and SKI SLALOM. Original names
   and drawings. MIXED MODE like every "You're in control" game: the multiplier follows the SERVER clock (×e^(rate·s),
   casino_ext.php 'skill', rate 0.03 → ×2 after ~23 s), the gold button cashes out, a mistake loses (K.multi 'fail'), and
   the server's secret end arrives as an unavoidable event. Canvas 2D, sprites pre-drawn once per size, DPR ≤ 2, one RAF,
   pauses when hidden. Same engine as js/games/skill6.js (copied: each module file stands alone).
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
    neonpong: {
      en: ['Drag to move your paddle', 'Missed the ball!', 'Ball overload!', 'Drag left or right to move your paddle at the bottom and send the ball back. The ball speeds up after each hit and the robot at the top gets sharper. Letting the ball pass ends the round.'],
      fr: ['Glisse pour bouger ta raquette', 'Balle ratée !', 'Surcharge de la balle !', 'Glisse à gauche ou à droite pour bouger ta raquette en bas et renvoyer la balle. La balle accélère à chaque coup et le robot en haut devient plus fort. Laisser passer la balle termine la partie.'],
      es: ['Desliza para mover tu pala', '¡Se te escapó la bola!', '¡Bola sobrecargada!', 'Desliza a la izquierda o derecha para mover tu pala abajo y devolver la bola. La bola acelera con cada golpe y el robot de arriba se vuelve más hábil. Dejar pasar la bola termina la ronda.'],
      pt: ['Deslize para mover sua raquete', 'Perdeu a bola!', 'Bola sobrecarregada!', 'Deslize para a esquerda ou direita para mover sua raquete embaixo e devolver a bola. A bola acelera a cada batida e o robô de cima fica mais esperto. Deixar a bola passar encerra a rodada.'],
      ar: ['اسحب لتحريك مضربك', 'فاتتك الكرة!', 'كرة مشحونة!', 'اسحب يسارًا أو يمينًا لتحريك مضربك في الأسفل وإعادة الكرة. تتسارع الكرة بعد كل ضربة ويصبح الروبوت في الأعلى أمهر. ترك الكرة تمر ينهي الجولة.'],
      tr: ['Raketini kaydırarak taşı', 'Topu kaçırdın!', 'Top aşırı yüklendi!', 'Alttaki raketini taşıyıp topu geri göndermek için sola ya da sağa kaydır. Top her vuruşta hızlanır, üstteki robot da ustalaşır. Topu kaçırmak turu bitirir.'],
      vi: ['Kéo để di chuyển vợt', 'Trượt bóng!', 'Bóng quá tải!', 'Kéo trái hoặc phải để di chuyển vợt ở dưới và đánh bóng trở lại. Bóng nhanh dần sau mỗi cú đánh và robot phía trên ngày càng giỏi. Để lọt bóng là kết thúc ván.'],
      id: ['Geser untuk menggerakkan raket', 'Bola lolos!', 'Bola kelebihan daya!', 'Geser ke kiri atau kanan untuk menggerakkan raket di bawah dan memantulkan bola. Bola makin cepat setiap pukulan dan robot di atas makin jago. Membiarkan bola lewat mengakhiri ronde.'],
      ru: ['Веди — двигай ракетку', 'Мяч пропущен!', 'Перегрузка мяча!', 'Веди влево или вправо, чтобы двигать ракетку внизу и отбивать мяч. Мяч ускоряется после каждого удара, а робот наверху играет всё лучше. Пропущенный мяч завершает раунд.'],
      de: ['Ziehen, um den Schläger zu bewegen', 'Ball verpasst!', 'Ball überladen!', 'Ziehe nach links oder rechts, um deinen Schläger unten zu bewegen und den Ball zurückzuspielen. Der Ball wird nach jedem Treffer schneller und der Roboter oben besser. Lässt du den Ball durch, endet die Runde.'],
      hi: ['पैडल चलाने को खींचें', 'गेंद छूट गई!', 'गेंद ओवरलोड!', 'नीचे का पैडल चलाने और गेंद लौटाने के लिए बाएँ या दाएँ खींचें। हर हिट के बाद गेंद तेज़ होती है और ऊपर का रोबोट बेहतर होता है। गेंद निकल गई तो राउंड खत्म।'],
      zh: ['拖动移动球拍', '漏接了！', '球体过载！', '左右拖动底部球拍把球打回去。每击一次球都会加速，顶部的机器人也越来越强。漏掉球，本回合结束。']
    },
    meteorblast: {
      en: ['Tap a meteor to shoot it', 'Ship destroyed!', 'Comet impact!', 'Your ship sits in the middle: tap where to shoot. Big meteors split into smaller ones. They come from every side, faster and faster. A meteor touching your ship ends the round.'],
      fr: ['Touche un météore pour tirer', 'Vaisseau détruit !', 'Impact de comète !', 'Ton vaisseau est au centre : touche où tirer. Les gros météores se cassent en plus petits. Ils arrivent de tous les côtés, de plus en plus vite. Un météore qui touche ton vaisseau termine la partie.'],
      es: ['Toca un meteoro para disparar', '¡Nave destruida!', '¡Impacto de cometa!', 'Tu nave está en el centro: toca dónde disparar. Los meteoros grandes se rompen en otros más pequeños. Llegan por todos lados, cada vez más rápido. Un meteoro que toca tu nave termina la ronda.'],
      pt: ['Toque um meteoro para atirar', 'Nave destruída!', 'Impacto de cometa!', 'Sua nave fica no centro: toque onde atirar. Meteoros grandes se partem em menores. Eles vêm de todos os lados, cada vez mais rápido. Um meteoro tocando sua nave encerra a rodada.'],
      ar: ['المس نيزكًا لإطلاق النار', 'تحطمت السفينة!', 'اصطدام مذنب!', 'سفينتك في المنتصف: المس مكان الإطلاق. تنقسم النيازك الكبيرة إلى أصغر. تأتي من كل الجهات وبسرعة متزايدة. نيزك يلمس سفينتك ينهي الجولة.'],
      tr: ['Ateş için bir meteora dokun', 'Gemi yok oldu!', 'Kuyruklu yıldız çarptı!', 'Gemin ortada: ateş edeceğin yere dokun. Büyük meteorlar küçüklere bölünür. Her yönden, giderek hızlanarak gelirler. Gemine değen bir meteor turu bitirir.'],
      vi: ['Chạm thiên thạch để bắn', 'Phi thuyền nổ tung!', 'Sao chổi va chạm!', 'Phi thuyền ở giữa: chạm nơi muốn bắn. Thiên thạch lớn vỡ thành mảnh nhỏ hơn. Chúng đến từ mọi phía, ngày càng nhanh. Thiên thạch chạm phi thuyền là kết thúc ván.'],
      id: ['Ketuk meteor untuk menembak', 'Kapal hancur!', 'Tabrakan komet!', 'Kapalmu di tengah: ketuk tempat menembak. Meteor besar pecah jadi lebih kecil. Mereka datang dari segala arah, makin cepat. Meteor yang menyentuh kapalmu mengakhiri ronde.'],
      ru: ['Тап по метеору — выстрел', 'Корабль уничтожен!', 'Удар кометы!', 'Твой корабль в центре: нажми, куда стрелять. Большие метеоры раскалываются на меньшие. Они летят со всех сторон всё быстрее. Метеор, коснувшийся корабля, завершает раунд.'],
      de: ['Meteor antippen zum Schießen', 'Schiff zerstört!', 'Kometeneinschlag!', 'Dein Schiff steht in der Mitte: tippe, wohin geschossen wird. Große Meteore zerbrechen in kleinere. Sie kommen von allen Seiten, immer schneller. Berührt ein Meteor dein Schiff, endet die Runde.'],
      hi: ['गोली के लिए उल्का टैप करें', 'यान नष्ट!', 'धूमकेतु टकराया!', 'आपका यान बीच में है: जहाँ गोली चलानी है वहाँ टैप करें। बड़े उल्का छोटे टुकड़ों में टूटते हैं। वे हर तरफ़ से, तेज़ होते हुए आते हैं। यान को छूने वाला उल्का राउंड खत्म करता है।'],
      zh: ['点击陨石射击', '飞船被摧毁！', '彗星撞击！', '你的飞船在中央：点击射击位置。大陨石会碎成小陨石。它们从四面八方越来越快地飞来。陨石碰到飞船，本回合结束。']
    },
    skyhopper: {
      en: ['Drag left or right to steer', 'Fell!', 'Storm strike!', 'Your hopper bounces by itself: drag left or right to land on the platforms and climb. Cracked platforms break, springs launch you high. The gaps grow with time. Falling off the screen ends the round.'],
      fr: ['Glisse à gauche ou à droite', 'Chute !', 'Coup de tonnerre !', 'Ton sauteur rebondit tout seul : glisse à gauche ou à droite pour atterrir sur les plateformes et monter. Les plateformes fissurées cassent, les ressorts t’envoient haut. Les écarts grandissent avec le temps. Tomber en bas termine la partie.'],
      es: ['Desliza a izquierda o derecha', '¡Caída!', '¡Rayo de tormenta!', 'Tu saltarín rebota solo: desliza a la izquierda o derecha para caer en las plataformas y subir. Las agrietadas se rompen, los muelles te lanzan alto. Los huecos crecen con el tiempo. Caer por abajo termina la ronda.'],
      pt: ['Deslize para esquerda ou direita', 'Caiu!', 'Raio da tempestade!', 'Seu saltador quica sozinho: deslize para a esquerda ou direita para cair nas plataformas e subir. As rachadas quebram, as molas te lançam alto. Os vãos aumentam com o tempo. Cair pela parte de baixo encerra a rodada.'],
      ar: ['اسحب يسارًا أو يمينًا للتوجيه', 'سقطت!', 'صاعقة العاصفة!', 'يقفز القافز وحده: اسحب يسارًا أو يمينًا للهبوط على المنصات والصعود. المنصات المتشققة تنكسر، والنوابض تقذفك عاليًا. تتسع الفجوات مع الوقت. السقوط من الشاشة ينهي الجولة.'],
      tr: ['Yönlendirmek için sola/sağa kaydır', 'Düştün!', 'Fırtına çarptı!', 'Zıplayıcın kendi zıplar: platformlara inip tırmanmak için sola ya da sağa kaydır. Çatlak platformlar kırılır, yaylar seni yükseğe atar. Boşluklar zamanla büyür. Ekrandan düşmek turu bitirir.'],
      vi: ['Kéo trái hoặc phải để lái', 'Rơi rồi!', 'Sét bão!', 'Nhân vật tự nảy: kéo trái hoặc phải để đáp lên các bục và leo lên. Bục nứt sẽ vỡ, lò xo bắn bạn lên cao. Khoảng cách tăng dần theo thời gian. Rơi khỏi màn hình là kết thúc ván.'],
      id: ['Geser kiri atau kanan untuk mengarah', 'Jatuh!', 'Sambaran badai!', 'Pelompatmu memantul sendiri: geser ke kiri atau kanan untuk mendarat di platform dan naik. Platform retak akan patah, pegas melontarkanmu tinggi. Jaraknya makin lebar. Jatuh dari layar mengakhiri ronde.'],
      ru: ['Веди влево или вправо', 'Падение!', 'Удар грозы!', 'Твой прыгун прыгает сам: веди влево или вправо, чтобы попадать на платформы и подниматься. Треснувшие ломаются, пружины подбрасывают высоко. Промежутки растут со временем. Падение вниз завершает раунд.'],
      de: ['Links oder rechts ziehen', 'Abgestürzt!', 'Blitzschlag!', 'Dein Hüpfer springt von selbst: ziehe nach links oder rechts, um auf den Plattformen zu landen und zu klettern. Rissige Plattformen brechen, Federn schleudern dich hoch. Die Lücken wachsen mit der Zeit. Unten herauszufallen beendet die Runde.'],
      hi: ['दिशा के लिए बाएँ या दाएँ खींचें', 'गिर गए!', 'तूफ़ानी बिजली!', 'आपका कूदने वाला खुद उछलता है: प्लेटफ़ॉर्म पर उतरकर ऊपर चढ़ने के लिए बाएँ या दाएँ खींचें। दरार वाले प्लेटफ़ॉर्म टूटते हैं, स्प्रिंग ऊँचा उछालते हैं। दूरी समय के साथ बढ़ती है। स्क्रीन से नीचे गिरे तो राउंड खत्म।'],
      zh: ['左右拖动控制方向', '掉下去了！', '雷暴来袭！', '小跳跳会自动弹跳：左右拖动落在平台上不断向上。裂开的平台会碎，弹簧会把你弹得很高。平台间距会随时间变大。从屏幕底部掉落，本回合结束。']
    },
    fruitcatch: {
      en: ['Drag the basket', 'Bomb caught!', 'Hailstorm!', 'Drag the basket left or right to catch every falling fruit — never a bomb. Fruits fall faster and in bigger showers. A bomb in the basket, or a fruit hitting the ground, ends the round.', 'Dropped one!'],
      fr: ['Glisse le panier', 'Bombe attrapée !', 'Tempête de grêle !', 'Glisse le panier à gauche ou à droite pour attraper chaque fruit qui tombe — jamais une bombe. Les fruits tombent plus vite et en plus grand nombre. Une bombe dans le panier, ou un fruit au sol, termine la partie.', 'Un fruit au sol !'],
      es: ['Desliza la cesta', '¡Atrapaste una bomba!', '¡Granizada!', 'Desliza la cesta a la izquierda o derecha para atrapar cada fruta que cae, nunca una bomba. Las frutas caen más rápido y en lluvias mayores. Una bomba en la cesta, o una fruta en el suelo, termina la ronda.', '¡Se cayó una!'],
      pt: ['Deslize a cesta', 'Pegou uma bomba!', 'Chuva de granizo!', 'Deslize a cesta para a esquerda ou direita para pegar cada fruta que cai — nunca uma bomba. As frutas caem mais rápido e em maior número. Uma bomba na cesta, ou uma fruta no chão, encerra a rodada.', 'Caiu uma!'],
      ar: ['اسحب السلة', 'التقطت قنبلة!', 'عاصفة بَرَد!', 'اسحب السلة يسارًا أو يمينًا لالتقاط كل فاكهة تسقط — ولا تلتقط قنبلة أبدًا. تسقط الفاكهة أسرع وبكميات أكبر. قنبلة في السلة أو فاكهة على الأرض تنهي الجولة.', 'سقطت واحدة!'],
      tr: ['Sepeti kaydır', 'Bomba yakaladın!', 'Dolu fırtınası!', 'Düşen her meyveyi yakalamak için sepeti sola ya da sağa kaydır — asla bomba değil. Meyveler daha hızlı ve daha çok düşer. Sepete giren bomba ya da yere düşen meyve turu bitirir.', 'Biri düştü!'],
      vi: ['Kéo giỏ', 'Hứng phải bom!', 'Mưa đá!', 'Kéo giỏ trái hoặc phải để hứng mọi trái cây rơi xuống — không bao giờ hứng bom. Trái cây rơi nhanh hơn và nhiều hơn. Bom vào giỏ, hoặc trái cây rơi xuống đất, là kết thúc ván.', 'Rơi mất một quả!'],
      id: ['Geser keranjang', 'Bom tertangkap!', 'Badai es!', 'Geser keranjang ke kiri atau kanan untuk menangkap setiap buah yang jatuh — jangan bom. Buah jatuh makin cepat dan makin banyak. Bom di keranjang, atau buah jatuh ke tanah, mengakhiri ronde.', 'Ada yang jatuh!'],
      ru: ['Веди корзину', 'Поймана бомба!', 'Градобой!', 'Веди корзину влево или вправо, чтобы ловить каждый падающий фрукт — но не бомбу. Фрукты падают всё быстрее и чаще. Бомба в корзине или фрукт на земле завершает раунд.', 'Один упал!'],
      de: ['Korb ziehen', 'Bombe gefangen!', 'Hagelsturm!', 'Ziehe den Korb nach links oder rechts, um jede fallende Frucht zu fangen — nie eine Bombe. Das Obst fällt schneller und in größeren Schauern. Eine Bombe im Korb oder eine Frucht am Boden beendet die Runde.', 'Eine fiel runter!'],
      hi: ['टोकरी खींचें', 'बम पकड़ लिया!', 'ओलावृष्टि!', 'हर गिरते फल को पकड़ने के लिए टोकरी बाएँ या दाएँ खींचें — बम कभी नहीं। फल तेज़ी से और ज़्यादा गिरते हैं। टोकरी में बम या ज़मीन पर फल गिरे तो राउंड खत्म।', 'एक गिर गया!'],
      zh: ['拖动篮子', '接到炸弹了！', '冰雹来袭！', '左右拖动篮子接住每个掉落的水果——绝不能接炸弹。水果会掉得越来越快、越来越多。接到炸弹或水果落地，本回合结束。', '掉了一个！']
    },
    beattap: {
      en: ['Tap a lane when the note hits the line', 'Off beat!', 'Speaker blown!', 'Notes slide down three lanes: tap the lane when a note reaches the glowing line. The tempo rises. A missed note, or tapping a lane with no note near the line, ends the round.', 'Missed a note!'],
      fr: ['Touche le couloir quand la note est sur la ligne', 'À contretemps !', 'Enceinte grillée !', 'Les notes descendent sur trois couloirs : touche le couloir quand une note atteint la ligne lumineuse. Le tempo augmente. Une note ratée, ou un couloir touché sans note près de la ligne, termine la partie.', 'Note ratée !'],
      es: ['Toca el carril cuando la nota llegue a la línea', '¡Fuera de ritmo!', '¡Altavoz quemado!', 'Las notas bajan por tres carriles: toca el carril cuando una nota llegue a la línea brillante. El tempo sube. Una nota fallada, o tocar un carril sin nota cerca de la línea, termina la ronda.', '¡Nota fallada!'],
      pt: ['Toque a pista quando a nota chegar à linha', 'Fora do ritmo!', 'Alto-falante queimado!', 'As notas descem por três pistas: toque a pista quando uma nota chegar à linha brilhante. O ritmo acelera. Uma nota perdida, ou tocar uma pista sem nota perto da linha, encerra a rodada.', 'Nota perdida!'],
      ar: ['المس المسار عندما تصل النغمة إلى الخط', 'خارج الإيقاع!', 'احترق مكبر الصوت!', 'تنزل النغمات في ثلاثة مسارات: المس المسار عندما تصل النغمة إلى الخط المضيء. يتسارع الإيقاع. نغمة فائتة أو لمس مسار بلا نغمة قرب الخط ينهي الجولة.', 'فاتتك نغمة!'],
      tr: ['Nota çizgiye gelince şeride dokun', 'Ritim dışı!', 'Hoparlör yandı!', 'Notalar üç şeritte iner: bir nota parlayan çizgiye gelince o şeride dokun. Tempo artar. Kaçan bir nota ya da çizgi yakınında nota yokken dokunmak turu bitirir.', 'Nota kaçtı!'],
      vi: ['Chạm làn khi nốt chạm vạch', 'Lệch nhịp!', 'Nổ loa!', 'Các nốt trượt xuống ba làn: chạm vào làn khi nốt chạm vạch sáng. Nhịp tăng dần. Lỡ một nốt, hoặc chạm làn không có nốt gần vạch, là kết thúc ván.', 'Lỡ một nốt!'],
      id: ['Ketuk jalur saat nada di garis', 'Meleset irama!', 'Speaker jebol!', 'Nada turun di tiga jalur: ketuk jalurnya saat nada mencapai garis bercahaya. Tempo makin cepat. Nada yang terlewat, atau mengetuk jalur tanpa nada di dekat garis, mengakhiri ronde.', 'Nada terlewat!'],
      ru: ['Тап по дорожке, когда нота на линии', 'Мимо ритма!', 'Динамик сгорел!', 'Ноты спускаются по трём дорожкам: нажимай дорожку, когда нота дошла до светящейся линии. Темп растёт. Пропущенная нота или нажатие на дорожку без ноты у линии завершает раунд.', 'Нота пропущена!'],
      de: ['Spur tippen, wenn die Note die Linie trifft', 'Aus dem Takt!', 'Lautsprecher durch!', 'Noten gleiten über drei Spuren nach unten: tippe die Spur, wenn eine Note die leuchtende Linie erreicht. Das Tempo steigt. Eine verpasste Note oder eine Spur ohne Note an der Linie beendet die Runde.', 'Note verpasst!'],
      hi: ['नोट लाइन पर आए तो लेन टैप करें', 'ताल से बाहर!', 'स्पीकर फुँक गया!', 'नोट तीन लेनों में नीचे आते हैं: नोट चमकती लाइन पर पहुँचे तो लेन टैप करें। ताल तेज़ होती है। छूटा नोट, या लाइन के पास बिना नोट वाली लेन टैप करना, राउंड खत्म करता है।', 'नोट छूटा!'],
      zh: ['音符到线时点击该轨道', '节奏错了！', '音箱烧了！', '音符沿三条轨道落下：音符到达发光线时点击该轨道。节奏会越来越快。漏掉音符，或在线附近没有音符时点击轨道，本回合结束。', '漏掉音符！']
    },
    ropeswing: {
      en: ['Hold to grab a hook, release to fly', 'Fell!', 'The rope snaps!', 'Hold your finger down: your hero grabs the nearest hook ahead and swings. Release to let go and fly forward. Keep swinging from hook to hook; the hooks get further apart. Falling to the ground ends the round.'],
      fr: ['Maintiens pour t’accrocher, lâche pour voler', 'Chute !', 'La corde casse !', 'Garde le doigt posé : ton héros s’accroche au crochet le plus proche devant lui et se balance. Lâche pour voler en avant. Enchaîne les crochets ; ils s’éloignent avec le temps. Toucher le sol termine la partie.'],
      es: ['Mantén para engancharte, suelta para volar', '¡Caída!', '¡Se rompe la cuerda!', 'Mantén el dedo: tu héroe se engancha al gancho más cercano por delante y se balancea. Suelta para volar hacia delante. Ve de gancho en gancho; cada vez están más lejos. Caer al suelo termina la ronda.'],
      pt: ['Segure para agarrar, solte para voar', 'Caiu!', 'A corda arrebenta!', 'Segure o dedo: seu herói agarra o gancho mais próximo à frente e balança. Solte para voar para a frente. Vá de gancho em gancho; eles ficam mais distantes. Cair no chão encerra a rodada.'],
      ar: ['اضغط للإمساك وأفلت للطيران', 'سقطت!', 'انقطع الحبل!', 'أبقِ إصبعك مضغوطًا: يمسك بطلك أقرب خطاف أمامه ويتأرجح. أفلت لينطلق إلى الأمام. تنقّل من خطاف إلى آخر؛ تتباعد الخطافات مع الوقت. السقوط على الأرض ينهي الجولة.'],
      tr: ['Tutunmak için bas, uçmak için bırak', 'Düştün!', 'İp koptu!', 'Parmağını basılı tut: kahramanın öndeki en yakın kancaya tutunup sallanır. Bırakınca ileri uçar. Kancadan kancaya geç; kancalar zamanla uzaklaşır. Yere düşmek turu bitirir.'],
      vi: ['Giữ để móc dây, thả để bay', 'Rơi rồi!', 'Đứt dây!', 'Giữ ngón tay: nhân vật móc vào móc gần nhất phía trước và đu. Thả ra để bay về phía trước. Đu từ móc này sang móc khác; chúng ngày càng xa. Rơi xuống đất là kết thúc ván.'],
      id: ['Tahan untuk mengait, lepas untuk terbang', 'Jatuh!', 'Talinya putus!', 'Tahan jarimu: pahlawanmu mengait kait terdekat di depan dan berayun. Lepas untuk terbang ke depan. Berayun dari kait ke kait; jaraknya makin jauh. Jatuh ke tanah mengakhiri ronde.'],
      ru: ['Держи — зацеп, отпусти — полёт', 'Падение!', 'Верёвка лопнула!', 'Держи палец: герой цепляется за ближайший крюк впереди и раскачивается. Отпусти, чтобы лететь вперёд. Перелетай с крюка на крюк; они всё дальше друг от друга. Падение на землю завершает раунд.'],
      de: ['Halten zum Greifen, loslassen zum Fliegen', 'Abgestürzt!', 'Das Seil reißt!', 'Halte den Finger gedrückt: Dein Held greift den nächsten Haken vor sich und schwingt. Lass los, um nach vorn zu fliegen. Schwinge von Haken zu Haken; sie liegen immer weiter auseinander. Fällst du auf den Boden, endet die Runde.'],
      hi: ['पकड़ने को दबाएँ, उड़ने को छोड़ें', 'गिर गए!', 'रस्सी टूट गई!', 'उँगली दबाए रखें: आपका हीरो आगे के सबसे पास वाले हुक को पकड़कर झूलता है। छोड़ें तो आगे उड़ता है। हुक से हुक झूलते रहें; हुक दूर होते जाते हैं। ज़मीन पर गिरे तो राउंड खत्म।'],
      zh: ['按住抓钩，松开飞出', '掉下去了！', '绳子断了！', '按住手指：主角会抓住前方最近的挂钩荡起来。松开即可向前飞出。从一个挂钩荡到下一个；挂钩会越来越远。掉到地面，本回合结束。']
    },
    minigolf: {
      en: ['Pull back from the ball, release to putt', 'Over par!', 'A gopher steals the ball!', 'Pull back from the ball like a slingshot and release to putt. Sink the ball within 3 strokes, around walls and the moving bar. Each hole is harder and the shot clock shorter. Missing the par or the clock ends the round.', 'Too slow!'],
      fr: ['Tire en arrière, lâche pour putter', 'Au-dessus du par !', 'Une marmotte vole la balle !', 'Tire en arrière depuis la balle comme une fronde et lâche pour putter. Mets la balle au trou en 3 coups, entre les murs et la barre mobile. Chaque trou est plus dur et le chrono plus court. Dépasser le par ou le chrono termine la partie.', 'Trop lent !'],
      es: ['Tira hacia atrás, suelta para golpear', '¡Sobre par!', '¡Una marmota roba la bola!', 'Tira hacia atrás desde la bola como un tirachinas y suelta para golpear. Mete la bola en 3 golpes, entre paredes y la barra móvil. Cada hoyo es más difícil y el reloj más corto. Pasar el par o el reloj termina la ronda.', '¡Demasiado lento!'],
      pt: ['Puxe para trás, solte para tacar', 'Acima do par!', 'Uma marmota rouba a bola!', 'Puxe para trás a partir da bola como um estilingue e solte para tacar. Acerte o buraco em até 3 tacadas, entre paredes e a barra móvel. Cada buraco é mais difícil e o relógio mais curto. Passar do par ou do relógio encerra a rodada.', 'Lento demais!'],
      ar: ['اسحب للخلف ثم أفلت للضرب', 'تجاوزت المعدل!', 'سنجاب يسرق الكرة!', 'اسحب للخلف من الكرة مثل المقلاع ثم أفلت للضرب. أدخل الكرة في الحفرة خلال 3 ضربات، بين الجدران والحاجز المتحرك. كل حفرة أصعب والوقت أقصر. تجاوز المعدل أو الوقت ينهي الجولة.', 'بطيء جدًا!'],
      tr: ['Geri çek, vurmak için bırak', 'Par aşıldı!', 'Bir sincap topu çaldı!', 'Toptan sapan gibi geri çek ve vurmak için bırak. Topu duvarların ve hareketli çubuğun arasından 3 vuruşta deliğe sok. Her delik daha zor, süre daha kısa. Parı ya da süreyi aşmak turu bitirir.', 'Çok yavaş!'],
      vi: ['Kéo lùi khỏi bóng, thả để đánh', 'Vượt par!', 'Chuột chũi cướp bóng!', 'Kéo lùi từ quả bóng như ná cao su rồi thả để đánh. Đưa bóng vào lỗ trong 3 gậy, qua tường và thanh di động. Mỗi lỗ khó hơn và đồng hồ ngắn hơn. Vượt par hoặc hết giờ là kết thúc ván.', 'Chậm quá!'],
      id: ['Tarik dari bola, lepas untuk memukul', 'Melebihi par!', 'Tikus tanah mencuri bola!', 'Tarik ke belakang dari bola seperti ketapel lalu lepas untuk memukul. Masukkan bola dalam 3 pukulan, melewati dinding dan palang bergerak. Setiap hole makin sulit dan waktunya makin singkat. Melebihi par atau waktu mengakhiri ronde.', 'Terlalu lambat!'],
      ru: ['Оттяни от мяча, отпусти — удар', 'Больше пара!', 'Суслик украл мяч!', 'Оттяни палец от мяча, как рогатку, и отпусти для удара. Загони мяч в лунку за 3 удара, между стенками и движущейся планкой. Каждая лунка сложнее, время на удар короче. Превышение пара или времени завершает раунд.', 'Слишком медленно!'],
      de: ['Zurückziehen, loslassen zum Putten', 'Über Par!', 'Ein Erdhörnchen klaut den Ball!', 'Zieh wie bei einer Schleuder vom Ball zurück und lass los, um zu putten. Loche in 3 Schlägen ein, an Wänden und dem beweglichen Balken vorbei. Jedes Loch ist schwerer, die Schlaguhr kürzer. Über Par oder über die Zeit beendet die Runde.', 'Zu langsam!'],
      hi: ['गेंद से पीछे खींचें, छोड़ें तो पट', 'पार से ज़्यादा!', 'गिलहरी गेंद ले भागी!', 'गुलेल की तरह गेंद से पीछे खींचें और पट के लिए छोड़ें। दीवारों और चलती पट्टी के बीच से 3 शॉट में गेंद छेद में डालें। हर होल कठिन और घड़ी छोटी होती है। पार या घड़ी पार हुई तो राउंड खत्म।', 'बहुत धीमे!'],
      zh: ['从球向后拉，松开推杆', '超过标准杆！', '地鼠偷走了球！', '像弹弓一样从球向后拉，松开即推杆。在3杆内绕过墙壁和移动挡板把球打进洞。每个洞都更难，计时也更短。超过标准杆或超时，本回合结束。', '太慢了！']
    },
    skislalom: {
      en: ['Drag to steer the skier', 'Crash!', 'Avalanche!', 'Drag left or right: the skier carves toward your finger. Pass between the two flags of every gate and avoid the trees and rocks. The slope gets steeper and faster. Missing a gate or hitting an obstacle ends the round.', 'Missed a gate!'],
      fr: ['Glisse pour diriger le skieur', 'Chute !', 'Avalanche !', 'Glisse à gauche ou à droite : le skieur tourne vers ton doigt. Passe entre les deux drapeaux de chaque porte et évite les sapins et les rochers. La pente devient plus raide et plus rapide. Rater une porte ou heurter un obstacle termine la partie.', 'Porte ratée !'],
      es: ['Desliza para guiar al esquiador', '¡Choque!', '¡Avalancha!', 'Desliza a la izquierda o derecha: el esquiador gira hacia tu dedo. Pasa entre las dos banderas de cada puerta y evita árboles y rocas. La pista se vuelve más empinada y rápida. Saltarte una puerta o chocar termina la ronda.', '¡Puerta fallada!'],
      pt: ['Deslize para guiar o esquiador', 'Batida!', 'Avalanche!', 'Deslize para a esquerda ou direita: o esquiador vira na direção do dedo. Passe entre as duas bandeiras de cada porta e evite árvores e pedras. A pista fica mais íngreme e rápida. Perder uma porta ou bater encerra a rodada.', 'Perdeu a porta!'],
      ar: ['اسحب لتوجيه المتزلج', 'اصطدام!', 'انهيار ثلجي!', 'اسحب يسارًا أو يمينًا: ينعطف المتزلج نحو إصبعك. مرّ بين علمي كل بوابة وتجنب الأشجار والصخور. يصبح المنحدر أشد وأسرع. تفويت بوابة أو الاصطدام بعائق ينهي الجولة.', 'فاتتك بوابة!'],
      tr: ['Kayakçıyı kaydırarak yönet', 'Çarptın!', 'Çığ!', 'Sola ya da sağa kaydır: kayakçı parmağına doğru döner. Her kapının iki bayrağı arasından geç, ağaçlardan ve kayalardan kaç. Pist dikleşir ve hızlanır. Kapıyı kaçırmak ya da engele çarpmak turu bitirir.', 'Kapı kaçtı!'],
      vi: ['Kéo để lái người trượt tuyết', 'Va chạm!', 'Tuyết lở!', 'Kéo trái hoặc phải: người trượt ôm cua về phía ngón tay. Đi qua giữa hai lá cờ của mỗi cổng và tránh cây, đá. Dốc ngày càng dựng và nhanh. Lỡ một cổng hoặc va chướng ngại là kết thúc ván.', 'Lỡ cổng!'],
      id: ['Geser untuk mengarahkan pemain ski', 'Tabrakan!', 'Longsor salju!', 'Geser ke kiri atau kanan: pemain ski berbelok ke arah jarimu. Lewati di antara dua bendera setiap gerbang dan hindari pohon serta batu. Lereng makin curam dan cepat. Melewatkan gerbang atau menabrak mengakhiri ronde.', 'Gerbang terlewat!'],
      ru: ['Веди — управляй лыжником', 'Падение!', 'Лавина!', 'Веди влево или вправо: лыжник поворачивает к пальцу. Проходи между двумя флажками каждых ворот и избегай елей и камней. Склон становится круче и быстрее. Пропущенные ворота или столкновение завершает раунд.', 'Ворота пропущены!'],
      de: ['Ziehen, um den Skifahrer zu lenken', 'Sturz!', 'Lawine!', 'Ziehe nach links oder rechts: Der Skifahrer schwingt zu deinem Finger. Fahre zwischen den zwei Fahnen jedes Tors durch und weiche Bäumen und Felsen aus. Der Hang wird steiler und schneller. Ein verpasstes Tor oder ein Hindernis beendet die Runde.', 'Tor verpasst!'],
      hi: ['स्कीयर चलाने को खींचें', 'टक्कर!', 'हिमस्खलन!', 'बाएँ या दाएँ खींचें: स्कीयर उँगली की ओर मुड़ता है। हर गेट के दो झंडों के बीच से निकलें और पेड़ों व चट्टानों से बचें। ढलान तेज़ होती जाती है। गेट छूटा या टक्कर हुई तो राउंड खत्म।', 'गेट छूट गया!'],
      zh: ['拖动控制滑雪者', '撞上了！', '雪崩！', '左右拖动：滑雪者会转向手指方向。从每道旗门的两面旗之间穿过，避开树木和岩石。坡道会越来越陡、越来越快。漏过旗门或撞到障碍，本回合结束。', '漏过旗门！']
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


  function boomFx(A, x, y, s) { A.explode(x, y, s); A.sx('boom', { v: Math.min(1, s) }); }

  /* ------------------------------------------------------------------ soldiers with real proportions and a proper run cycle
     side view (Commando Run) and front view (Trench Defense). Drawn once per frame index into small sprites (8–12 frames),
     then only drawImage'd: smooth limbs, two-tone shading, helmet, vest, boots, rifle. h = full height (feet to helmet top). */
  function limb(c, x0, y0, x1, y1, w0, w1, col) { // tapered limb with rounded ends
    var a = Math.atan2(y1 - y0, x1 - x0), nx = -Math.sin(a), ny = Math.cos(a);
    c.fillStyle = col; c.beginPath();
    c.moveTo(x0 + nx * w0 / 2, y0 + ny * w0 / 2); c.lineTo(x1 + nx * w1 / 2, y1 + ny * w1 / 2); c.lineTo(x1 - nx * w1 / 2, y1 - ny * w1 / 2); c.lineTo(x0 - nx * w0 / 2, y0 - ny * w0 / 2); c.closePath(); c.fill();
    circ(c, x0, y0, w0 / 2, col); circ(c, x1, y1, w1 / 2, col);
  }
  var UNI = { light: '#6B7B3E', mid: '#4E5A2B', dark: '#353D1C', vest: '#3F4422', skin: '#F2C9A6', skinD: '#D9A27C', boot: '#1C1917', gun: '#27272A', gunL: '#52525B', strap: '#5C4033' };
  var UNE = { light: '#8A8F98', mid: '#5E636B', dark: '#3D4148', vest: '#2E3238', skin: '#F5D0B0', skinD: '#DDA982', boot: '#111111', gun: '#1F1F22', gunL: '#4B4B52', strap: '#3B2A20' };
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
  function rigFrames(h, n, fn) { // pre-rendered frames: canvas size 1.1h × 1.1h, feet at the bottom centre
    var out = []; for (var i = 0; i < n; i++) out.push(mkc(h * 1.2, h * 1.12, Math.min(2, window.devicePixelRatio || 1), function (c) { c.translate(h * 0.6, h * 1.08); fn(c, i / n); }));
    return out;
  }

  /* ================================================================== 17. NEON PONG — drag your paddle at the bottom; the robot plays
     the top. The ball speeds up after each hit and the robot gets sharper. Letting the ball pass ends the round. */
  boot('neonpong', function (A) {
    var W, H, T, dpr, bg, pw, ph, py, ay, br, me = 0, ai = 0, ball = null, dead = 0, won = 0, over = null, t = 0, drag = null, wait = 0, hits = 0, trail = [], score = 0, aiErr = 0;
    function serve(toMe) { var a = rnd(-0.5, 0.5) + (toMe ? Math.PI / 2 : -Math.PI / 2), v = (H - T) * 0.62; ball = { x: W / 2, y: (py + ay) / 2, vx: Math.cos(a) * v, vy: Math.sin(a) * v, v: v }; wait = 0.7; trail = []; aiErr = rnd(-1, 1); }
    function bounce(isMe, px) {
      var off = clamp((ball.x - px) / (pw / 2), -1, 1), lv = A.live() ? A.lv() : 0.2;
      ball.v = Math.min((H - T) * (1.9 + 0.8 * lv), ball.v * 1.05);
      var a = off * 1.05; ball.vx = Math.sin(a) * ball.v; ball.vy = (isMe ? -1 : 1) * Math.cos(a) * ball.v;
      A.burst(ball.x, isMe ? py - ph : ay + ph, 6, isMe ? ['#22D3EE', '#fff'] : ['#F472B6', '#fff'], 120, 0.35, 2.4, 0);
      if (isMe) hits++;
      aiErr = rnd(-1, 1);
    }
    return {
      size: function (w, h, uu, d, top) {
        W = w; H = h; dpr = d; T = top; pw = clamp(W * 0.24, 64, 170); ph = clamp((H - T) * 0.022, 8, 14); py = H - (H - T) * 0.08; ay = T + (H - T) * 0.07; br = clamp(Math.min(W, H) * 0.022, 7, 14);
        bg = mkc(W, H, dpr, function (c) {
          c.fillStyle = lg(c, 0, 0, 0, H, ['#0B0221', '#170A3A', '#0B0221']); c.fillRect(0, 0, W, H);
          c.strokeStyle = 'rgba(167,139,250,.14)'; c.lineWidth = 1; for (var x = 0; x < W; x += 28) { c.beginPath(); c.moveTo(x, T); c.lineTo(x, H); c.stroke(); } for (var y = T; y < H; y += 28) { c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); }
          c.setLineDash([10, 10]); c.strokeStyle = 'rgba(244,114,182,.45)'; c.lineWidth = 2; c.beginPath(); c.moveTo(0, (py + ay) / 2); c.lineTo(W, (py + ay) / 2); c.stroke(); c.setLineDash([]);
          c.strokeStyle = 'rgba(34,211,238,.5)'; c.lineWidth = 3; c.strokeRect(4, ay - ph * 2, W - 8, py - ay + ph * 4);
        });
        if (!me) { me = W / 2; ai = W / 2; }
      },
      reset: function () { me = W / 2; ai = W / 2; dead = 0; won = 0; over = null; hits = 0; score = 0; drag = null; serve(true); },
      step: function (dt, live) {
        t += dt; var lv = live ? A.lv() : 0.2;
        if (over) { over.t += dt; ball.vx *= 1 + dt; ball.vy *= 1 + dt; ball.x += ball.vx * dt * 0.3; ball.y += ball.vy * dt * 0.3; if (!over.hit && over.t > 0.7) { over.hit = 1; boomFx(A, ball.x, ball.y, 1.4); } return; }
        if (dead || won || !ball) return;
        if (wait > 0) { wait -= dt; return; }
        var n = 4; for (var k = 0; k < n; k++) {
          ball.x += ball.vx * dt / n; ball.y += ball.vy * dt / n;
          if (ball.x < br + 6) { ball.x = br + 6; ball.vx = Math.abs(ball.vx); } if (ball.x > W - br - 6) { ball.x = W - br - 6; ball.vx = -Math.abs(ball.vx); }
          if (ball.vy > 0 && ball.y + br >= py - ph / 2 && ball.y < py + ph && Math.abs(ball.x - me) < pw / 2 + br * 0.6) { ball.y = py - ph / 2 - br; bounce(true, me); }
          if (ball.vy < 0 && ball.y - br <= ay + ph / 2 && ball.y > ay - ph && Math.abs(ball.x - ai) < pw / 2 + br * 0.6) { ball.y = ay + ph / 2 + br; bounce(false, ai); }
        }
        if (!A.lite) { trail.push([ball.x, ball.y]); if (trail.length > 10) trail.shift(); }
        // robot: tracks the predicted crossing, limited speed, small aiming error (sharper with time)
        var tgt = W / 2;
        if (ball.vy < 0) { var tt = (ball.y - ay) / -ball.vy, x = ball.x + ball.vx * tt, span = W - 2 * (br + 6); x -= br + 6; x = ((x % (2 * span)) + 2 * span) % (2 * span); if (x > span) x = 2 * span - x; tgt = x + br + 6 + aiErr * pw * (0.42 - 0.25 * Math.min(1, lv)); }
        ai += clamp(tgt - ai, -W * (0.75 + 0.6 * lv) * dt, W * (0.75 + 0.6 * lv) * dt);
        if (A.idle()) { var tg2 = ball.vy > 0 ? ball.x : W / 2; me += clamp(tg2 - me, -W * 1.4 * dt, W * 1.4 * dt); }
        me = clamp(me, pw / 2, W - pw / 2); ai = clamp(ai, pw / 2, W - pw / 2);
        if (ball.y > H + br) { if (A.live()) { if (A.fail(A.l.fail)) { dead = 1; A.shake(0.3); } } else serve(true); }
        if (ball.y < T - br) { score++; A.ring(W / 2, ay, pw, '#FDE68A'); A.burst(ball.x, ay, 14, ['#FDE68A', '#fff'], 160, 0.5, 3, 0); serve(true); }
      },
      draw: function (c) {
        A.bg(bg);
        var paddle = function (x, y, col) { rr(c, x - pw / 2, y - ph / 2, pw, ph, ph / 2); c.fillStyle = col; c.fill(); rr(c, x - pw / 2 + 4, y - ph / 2 + 2, pw - 8, ph * 0.3, ph * 0.15); c.fillStyle = 'rgba(255,255,255,.6)'; c.fill(); };
        paddle(ai, ay, lg(c, 0, ay - ph, 0, ay + ph, ['#FBCFE8', '#EC4899', '#9D174D']));
        if (!dead) paddle(me, py, lg(c, 0, py - ph, 0, py + ph, ['#CFFAFE', '#06B6D4', '#155E75']));
        if (ball) {
          for (var i = 0; i < trail.length; i++) { c.globalAlpha = (i / trail.length) * 0.4; circ(c, trail[i][0], trail[i][1], br * (0.4 + 0.6 * i / trail.length), over ? '#F87171' : '#A5F3FC'); }
          c.globalAlpha = 1; var r2 = over ? br * (1 + over.t * 1.5) : br;
          circ(c, ball.x, ball.y, r2 * 1.8, over ? 'rgba(239,68,68,.25)' : 'rgba(165,243,252,.18)'); circ(c, ball.x, ball.y, r2, rg(c, ball.x, ball.y, r2, over ? ['#FFF', '#FCA5A5', '#DC2626'] : ['#FFFFFF', '#A5F3FC', '#22D3EE'], -r2 * 0.3, -r2 * 0.3));
        }
      },
      down: function (x) { drag = { x: x, s: me }; },
      move: function (x) { if (drag && !dead) me = clamp(drag.s + (x - drag.x) * 1.25, pw / 2, W - pw / 2); },
      up: function () { drag = null; },
      key: function (k) { if (k === 'left') me -= pw * 0.3; else if (k === 'right') me += pw * 0.3; },
      boom: function () { over = { t: 0 }; if (!ball) serve(true); wait = 0; },
      win: function () { won = 0.001; drag = null; A.burst(me, py, 16, ['#FDE68A', '#FFFFFF', '#22D3EE'], 150, 0.6, 3); },
      dbg: function () { return { me: me, ai: ai, pw: pw, py: py, ball: ball, dead: dead, hits: hits, score: score }; }
    };
  }, 'drag', 0.62);

  /* ================================================================== 18. METEOR BLASTER — your ship sits in the middle: tap where to
     shoot (it turns and fires). Big meteors split into smaller ones; they come from every side. */
  boot('meteorblast', function (A) {
    var W, H, T, dpr, bg, sx, sy, sr, ang = -Math.PI / 2, rocks = [], bul = [], dead = 0, won = 0, comet = null, t = 0, spT = 0, cool = 0, aiT = 0, rockS = [], shipS = null, kills = 0, R0;
    function rockSpr(seed) {
      var s = 64;
      return mkc(s, s, dpr, function (c) {
        var m = s / 2, n = 11, pts = []; for (var i = 0; i < n; i++) { var a = i / n * TAU, r = s * (0.38 + 0.1 * Math.sin(i * 2.3 + seed * 5)); pts.push(m + Math.cos(a) * r, m + Math.sin(a) * r); }
        poly(c, pts, rg(c, m, m, s * 0.5, ['#D6D3D1', '#78716C', '#3F3A36'], -s * 0.12, -s * 0.14));
        for (i = 0; i < 4; i++) { var cx = m + Math.cos(i * 1.7 + seed) * s * 0.18, cy = m + Math.sin(i * 2.1 + seed) * s * 0.16, cr = s * (0.05 + 0.03 * ((i + seed) % 2)); circ(c, cx, cy, cr, 'rgba(41,37,36,.45)'); circ(c, cx - cr * 0.3, cy - cr * 0.3, cr * 0.6, 'rgba(231,229,228,.25)'); }
      });
    }
    function addRock(live, x, y, size, vx, vy) {
      var lv = live ? A.lv() : 0.2;
      if (x === undefined) { var a = rnd(0, TAU), d = Math.max(W, H) * 0.65; x = sx + Math.cos(a) * d; y = sy + Math.sin(a) * d; var to = Math.atan2(sy - y, sx - x) + rnd(-0.35, 0.35), v = (H - T) * (0.12 + 0.12 * lv) * rnd(0.85, 1.2); vx = Math.cos(to) * v; vy = Math.sin(to) * v; size = 2; }
      rocks.push({ x: x, y: y, vx: vx, vy: vy, s: size, r: R0 * [0.38, 0.62, 1][size], a: rnd(0, TAU), va: rnd(-1.5, 1.5), k: (Math.random() * 3) | 0 });
    }
    function fire(x, y) {
      if (cool > 0 || dead || comet || won) return;
      ang = Math.atan2(y - sy, x - sx); cool = 0.16; var v = Math.max(W, H) * 1.3;
      bul.push({ x: sx + Math.cos(ang) * sr, y: sy + Math.sin(ang) * sr, vx: Math.cos(ang) * v, vy: Math.sin(ang) * v, l: 0.8 }); A.sx('gun', { k: 'laser', v: 0.45 });
    }
    return {
      size: function (w, h, uu, d, top) {
        W = w; H = h; dpr = d; T = top; sx = W / 2; sy = T + (H - T) * 0.55; sr = clamp(Math.min(W, H - T) * 0.05, 16, 34); R0 = clamp(Math.min(W, H - T) * 0.09, 26, 70);
        rockS = [0, 1, 2].map(rockSpr);
        shipS = mkc(sr * 2.4, sr * 2.4, dpr, function (c, w) {
          c.translate(w / 2, w / 2); c.rotate(Math.PI / 2); var s = sr;
          c.fillStyle = lg(c, -s, 0, s, 0, ['#475569', '#E2E8F0', '#475569']); c.beginPath(); c.moveTo(0, -s * 1.05); c.lineTo(s * 0.8, s * 0.8); c.lineTo(s * 0.3, s * 0.55); c.lineTo(-s * 0.3, s * 0.55); c.lineTo(-s * 0.8, s * 0.8); c.closePath(); c.fill();
          c.fillStyle = lg(c, 0, -s * 0.5, 0, s * 0.1, ['#E0F2FE', '#0EA5E9']); c.beginPath(); c.ellipse(0, -s * 0.15, s * 0.2, s * 0.38, 0, 0, TAU); c.fill();
          c.fillStyle = '#F43F5E'; c.fillRect(-s * 0.62, s * 0.4, s * 0.18, s * 0.3); c.fillRect(s * 0.44, s * 0.4, s * 0.18, s * 0.3);
        });
        bg = mkc(W, H, dpr, function (c) {
          c.fillStyle = lg(c, 0, 0, W, H, ['#020617', '#0F172A', '#1E1B4B']); c.fillRect(0, 0, W, H); stars(c, W, H, A.lite ? 60 : 160);
          circ(c, W * 0.15, H * 0.8, Math.max(W, H) * 0.35, rg(c, W * 0.15, H * 0.8, Math.max(W, H) * 0.35, ['rgba(147,51,234,.22)', 'rgba(147,51,234,0)']));
          circ(c, W * 0.9, T + 30, Math.max(W, H) * 0.25, rg(c, W * 0.9, T + 30, Math.max(W, H) * 0.25, ['rgba(14,165,233,.18)', 'rgba(14,165,233,0)']));
        });
      },
      reset: function () { rocks = []; bul = []; dead = 0; won = 0; comet = null; spT = 0.5; kills = 0; ang = -Math.PI / 2; },
      step: function (dt, live) {
        t += dt; cool = Math.max(0, cool - dt); var lv = live ? A.lv() : 0.2, i, j, r, b;
        for (i = rocks.length - 1; i >= 0; i--) { r = rocks[i]; r.x += r.vx * dt; r.y += r.vy * dt; r.a += r.va * dt; if (Math.hypot(r.x - sx, r.y - sy) > Math.max(W, H) * 1.1) rocks.splice(i, 1); }
        if (comet) { comet.t += dt; comet.x += comet.vx * dt; comet.y += comet.vy * dt; if (!comet.hit && Math.hypot(comet.x - sx, comet.y - sy) < sr * 2) { comet.hit = 1; dead = 1; boomFx(A, sx, sy, 1.8); } return; }
        if (dead || won) return;
        spT -= dt; if (spT <= 0 && rocks.length < 4 + Math.round(6 * lv)) { addRock(live); spT = Math.max(0.6, 2.2 - 1.4 * lv) * rnd(0.7, 1.3); }
        for (i = bul.length - 1; i >= 0; i--) {
          b = bul[i]; b.x += b.vx * dt; b.y += b.vy * dt; b.l -= dt; if (b.l <= 0) { bul.splice(i, 1); continue; }
          for (j = rocks.length - 1; j >= 0; j--) { r = rocks[j]; if (Math.hypot(b.x - r.x, b.y - r.y) < r.r) { bul.splice(i, 1); rocks.splice(j, 1); kills++; A.burst(r.x, r.y, 4 + r.s * 4, ['#D6D3D1', '#A8A29E', '#FDBA74'], 120 + r.s * 40, 0.5, 3, 0); A.sx('boom', { v: 0.2 + r.s * 0.15 }); if (r.s > 0) for (var q = 0; q < 2; q++) { var a = Math.atan2(r.vy, r.vx) + (q ? 0.7 : -0.7), v = Math.hypot(r.vx, r.vy) * 1.25; addRock(live, r.x, r.y, r.s - 1, Math.cos(a) * v, Math.sin(a) * v); } break; } }
        }
        for (i = 0; i < rocks.length; i++) { r = rocks[i]; if (Math.hypot(r.x - sx, r.y - sy) < r.r * 0.85 + sr * 0.7) { if (A.live()) { if (A.fail(A.l.fail)) { dead = 1; boomFx(A, sx, sy, 1.3); } return; } rocks.splice(i, 1); break; } }
        if (A.idle()) { aiT += dt; if (aiT > 0.35) { aiT = 0; var near = rocks.slice().sort(function (a2, b2) { return Math.hypot(a2.x - sx, a2.y - sy) - Math.hypot(b2.x - sx, b2.y - sy); })[0]; if (near && Math.hypot(near.x - sx, near.y - sy) < Math.max(W, H) * 0.55) fire(near.x + near.vx * 0.15, near.y + near.vy * 0.15); } }
      },
      draw: function (c) {
        A.bg(bg);
        var i, r;
        for (i = 0; i < rocks.length; i++) { r = rocks[i]; c.save(); c.translate(r.x, r.y); c.rotate(r.a); c.drawImage(rockS[r.k], -r.r * 1.25, -r.r * 1.25, r.r * 2.5, r.r * 2.5); c.restore(); }
        c.strokeStyle = '#86EFAC'; c.lineWidth = 3; c.lineCap = 'round'; for (i = 0; i < bul.length; i++) { var b = bul[i]; c.beginPath(); c.moveTo(b.x, b.y); c.lineTo(b.x - b.vx * 0.02, b.y - b.vy * 0.02); c.stroke(); }
        if (comet) { var cl = c.createLinearGradient(comet.x - comet.vx * 0.5, comet.y - comet.vy * 0.5, comet.x, comet.y); cl.addColorStop(0, 'rgba(125,211,252,0)'); cl.addColorStop(1, 'rgba(224,242,254,.9)'); c.strokeStyle = cl; c.lineWidth = R0 * 0.8; c.beginPath(); c.moveTo(comet.x - comet.vx * 0.5, comet.y - comet.vy * 0.5); c.lineTo(comet.x, comet.y); c.stroke(); circ(c, comet.x, comet.y, R0 * 0.6, rg(c, comet.x, comet.y, R0 * 0.6, ['#FFFFFF', '#BAE6FD', '#0EA5E9'])); }
        if (!dead) { c.save(); c.translate(sx, sy); c.rotate(ang); c.drawImage(shipS, -sr * 1.2, -sr * 1.2, sr * 2.4, sr * 2.4); if (cool > 0.1) circ(c, sr * 1.15, 0, sr * 0.25, 'rgba(134,239,172,.8)'); c.restore(); c.strokeStyle = 'rgba(125,211,252,.25)'; c.lineWidth = 1.5; c.beginPath(); c.arc(sx, sy, sr * 1.6, 0, TAU); c.stroke(); }
      },
      act: function (k, x, y) { fire(x, y); },
      key: function (k) { if (k === 'left') ang -= 0.3; else if (k === 'right') ang += 0.3; else if (k === 'up') fire(sx + Math.cos(ang) * 100, sy + Math.sin(ang) * 100); },
      boom: function () { var a = rnd(-2.6, -0.5); comet = { x: sx + Math.cos(a) * Math.max(W, H), y: sy + Math.sin(a) * Math.max(W, H), vx: -Math.cos(a) * Math.max(W, H) * 1.1, vy: -Math.sin(a) * Math.max(W, H) * 1.1, t: 0 }; A.sx('whoosh'); },
      win: function () { won = 0.001; A.burst(sx, sy, 18, ['#FDE68A', '#FFFFFF', '#86EFAC'], 160, 0.6, 3); },
      dbg: function () { return { sx: sx, sy: sy, sr: sr, rocks: rocks.map(function (r) { return [r.x | 0, r.y | 0, r.r | 0, r.vx | 0, r.vy | 0]; }), dead: dead, kills: kills, cool: cool }; }
    };
  }, 'aim', 0.28);

  /* ================================================================== 19. SKY HOPPER — the doodle-style climber: it bounces by itself,
     drag left / right to land on the platforms (moving, cracked, springs). The screen wraps at the sides. */
  boot('skyhopper', function (A) {
    var W, H, T, dpr, bg, hr, x, y, vy, vx = 0, cam = 0, plats = [], top = 0, dead = 0, won = 0, storm = null, t = 0, drag = null, tx = 0, sq = 0, face = 1, hopS = null, jumpV, G3, best = 0;
    function addPlat(live) {
      var lv = live ? A.lv() : 0.15, hJ = jumpV * jumpV / (2 * G3), gap = hJ * rnd(0.32 + 0.3 * lv, 0.5 + 0.35 * lv);
      top -= gap; var r = Math.random(), k = r < 0.12 + 0.12 * lv ? 'move' : r < 0.2 + 0.15 * lv ? 'crack' : r < 0.27 + 0.15 * lv ? 'spring' : 'norm';
      if (k === 'crack') { plats.push({ x: rnd(W * 0.1, W * 0.9), y: top, k: k, vx: 0, gone: 0 }); top -= gap * 0.5; k = 'norm'; }
      plats.push({ x: rnd(W * 0.12, W * 0.88), y: top, k: k, vx: k === 'move' ? W * rnd(0.12, 0.25) * (Math.random() < 0.5 ? 1 : -1) : 0, gone: 0 });
    }
    function pw() { return clamp(W * 0.17, 52, 110); }
    return {
      size: function (w, h, uu, d, top2) {
        W = w; H = h; dpr = d; T = top2; hr = clamp(Math.min(W, H - T) * 0.058, 17, 36); G3 = (H - T) * 2.6; jumpV = Math.sqrt(2 * G3 * (H - T) * 0.36);
        hopS = mkc(hr * 2.6, hr * 2.6, dpr, function (c, w2) { // a round green critter with goggles
          var m = w2 / 2; c.translate(m, m);
          c.fillStyle = rg(c, -hr * 0.3, -hr * 0.4, hr * 1.2, ['#D9F99D', '#65A30D', '#365314']); c.beginPath(); c.ellipse(0, 0, hr, hr * 1.05, 0, 0, TAU); c.fill();
          c.fillStyle = '#365314'; c.fillRect(-hr * 0.65, hr * 0.75, hr * 0.3, hr * 0.4); c.fillRect(hr * 0.35, hr * 0.75, hr * 0.3, hr * 0.4);
          c.fillStyle = '#1F2937'; rr(c, -hr * 0.8, -hr * 0.45, hr * 1.6, hr * 0.42, hr * 0.2); c.fill();
          circ(c, -hr * 0.35, -hr * 0.24, hr * 0.22, rg(c, -hr * 0.35, -hr * 0.24, hr * 0.22, ['#E0F2FE', '#38BDF8'])); circ(c, hr * 0.35, -hr * 0.24, hr * 0.22, rg(c, hr * 0.35, -hr * 0.24, hr * 0.22, ['#E0F2FE', '#38BDF8']));
          c.strokeStyle = '#365314'; c.lineWidth = hr * 0.1; c.lineCap = 'round'; c.beginPath(); c.arc(0, hr * 0.25, hr * 0.3, 0.2, Math.PI - 0.2); c.stroke();
          c.fillStyle = 'rgba(255,255,255,.45)'; c.beginPath(); c.ellipse(-hr * 0.45, -hr * 0.7, hr * 0.3, hr * 0.12, -0.5, 0, TAU); c.fill();
        });
        bg = mkc(W, H, dpr, function (c) {
          c.fillStyle = lg(c, 0, 0, 0, H, ['#0EA5E9', '#7DD3FC', '#E0F2FE']); c.fillRect(0, 0, W, H);
          for (var i = 0; i < 9; i++) { var cx = rnd(0, W), cy = rnd(T, H), cr = rnd(20, 55); c.fillStyle = 'rgba(255,255,255,.55)'; c.beginPath(); c.ellipse(cx, cy, cr, cr * 0.45, 0, 0, TAU); c.ellipse(cx + cr * 0.6, cy + 5, cr * 0.7, cr * 0.35, 0, 0, TAU); c.fill(); }
        });
      },
      reset: function (live) { plats = []; top = H - (H - T) * 0.05; plats.push({ x: W / 2, y: top, k: 'norm', vx: 0, gone: 0 }); while (top > T - (H - T)) addPlat(live); x = W / 2; tx = x; y = plats[0].y - hr; vy = -jumpV; cam = 0; dead = 0; won = 0; storm = null; drag = null; best = 0; },
      step: function (dt, live) {
        t += dt; sq = Math.max(0, sq - dt * 5); var i, p, P2 = pw();
        for (i = 0; i < plats.length; i++) { p = plats[i]; if (p.vx) { p.x += p.vx * dt; if (p.x < P2 / 2 || p.x > W - P2 / 2) p.vx = -p.vx; } if (p.gone) p.gone += dt; }
        if (storm) { storm.t += dt; if (!storm.hit && storm.t > 0.35) { storm.hit = 1; boomFx(A, x, y - cam, 1.2); dead = 1; } return; }
        if (dead) { vy += G3 * dt; y += vy * dt; return; }
        if (won) return;
        if (A.idle()) { // attract: aim at the best platform above while falling
          if (vy > -jumpV * 0.2) { var cand = plats.filter(function (q) { return q.y > y - (H - T) * 0.4 && q.y < y + 40 && !q.gone && q.k !== 'crack'; }).sort(function (a, b) { return a.y - b.y; })[0]; if (cand) tx = cand.x; }
        }
        var dx = tx - x; if (Math.abs(dx) > W / 2) dx -= Math.sign(dx) * W; // wrap the shortest way
        vx = clamp(dx * 8, -W * 1.4, W * 1.4); x += vx * dt; if (Math.abs(vx) > 20) face = vx > 0 ? 1 : -1;
        if (x < 0) { x += W; tx += W; } if (x > W) { x -= W; tx -= W; }
        var oy = y; vy += G3 * dt; y += vy * dt;
        if (vy > 0) for (i = 0; i < plats.length; i++) {
          p = plats[i]; if (p.gone) continue;
          if (oy + hr <= p.y + 2 && y + hr >= p.y && Math.abs(x - p.x) < P2 / 2 + hr * 0.4) {
            if (p.k === 'crack') { p.gone = 0.001; A.burst(p.x, p.y - cam, 8, ['#A16207', '#FDE68A'], 100, 0.5, 3, 300); continue; }
            y = p.y - hr; vy = -jumpV * (p.k === 'spring' ? 1.65 : 1); sq = 1;
            if (p.k === 'spring') { A.sx('jump'); A.ring(p.x, p.y - cam, P2 * 0.6, '#FDE68A'); } else if (A.live()) A.sx('jump', { v: 0.4 });
            break;
          }
        }
        // camera only goes up
        var want = y - (T + (H - T) * 0.42); if (want < cam) cam = want;
        while (top > cam + T - (H - T) * 0.5) addPlat(live);
        for (i = plats.length - 1; i >= 0; i--) if (plats[i].y - cam > H + 40 || plats[i].gone > 0.6) plats.splice(i, 1);
        if (y - cam > H + hr * 2) { if (A.live()) { if (A.fail(A.l.fail)) dead = 1; } else this.reset(false); }
      },
      draw: function (c) {
        A.bg(bg);
        var P2 = pw(), i, p, ph2 = Math.max(8, P2 * 0.16);
        for (i = 0; i < plats.length; i++) {
          p = plats[i]; var py = p.y - cam; if (py < T - 20 || py > H + 20) continue;
          c.globalAlpha = p.gone ? Math.max(0, 1 - p.gone * 2) : 1;
          var col = p.k === 'move' ? ['#BAE6FD', '#0284C7'] : p.k === 'crack' ? ['#FDE68A', '#A16207'] : ['#BBF7D0', '#15803D'];
          rr(c, p.x - P2 / 2, py + (p.gone ? p.gone * 80 : 0), P2, ph2, ph2 / 2); c.fillStyle = lg(c, 0, py, 0, py + ph2, col); c.fill();
          c.fillStyle = 'rgba(255,255,255,.5)'; rr(c, p.x - P2 / 2 + 4, py + 2, P2 - 8, ph2 * 0.25, ph2 * 0.12); c.fill();
          if (p.k === 'crack') { c.strokeStyle = '#713F12'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(p.x - 6, py); c.lineTo(p.x, py + ph2 * 0.6); c.lineTo(p.x + 5, py + ph2); c.stroke(); }
          if (p.k === 'spring') { c.strokeStyle = '#64748B'; c.lineWidth = 2.4; c.beginPath(); for (var k = 0; k < 5; k++) c.lineTo(p.x + (k % 2 ? 6 : -6), py - k * 3); c.stroke(); c.fillStyle = '#EF4444'; c.fillRect(p.x - 8, py - 15, 16, 3); }
          c.globalAlpha = 1;
        }
        if (storm) { c.strokeStyle = (t * 20 | 0) % 2 ? '#FEF9C3' : '#A5F3FC'; c.lineWidth = 4; c.beginPath(); c.moveTo(x + 30, T); for (i = 1; i <= 6; i++) c.lineTo(x + (i % 2 ? -20 : 20) * (1 - i / 6), T + (y - cam - T) * i / 6); c.stroke(); }
        if (!(dead && storm && storm.hit)) { var s2 = 1 + sq * 0.25; c.save(); c.translate(x, y - cam + hr); c.scale(face * (1 + sq * 0.15), 1 / s2); c.drawImage(hopS, -hr * 1.3, -hr * 2.3, hr * 2.6, hr * 2.6); c.restore(); if (x < hr) { c.drawImage(hopS, x + W - hr * 1.3, y - cam - hr * 1.3, hr * 2.6, hr * 2.6); } }
      },
      down: function (x2) { drag = { x: x2, s: tx }; },
      move: function (x2) { if (drag && !dead) tx = drag.s + (x2 - drag.x) * 1.4; },
      up: function () { drag = null; },
      key: function (k) { if (k === 'left') tx -= W * 0.08; else if (k === 'right') tx += W * 0.08; },
      boom: function () { storm = { t: 0 }; drag = null; A.flash(0.4); },
      win: function () { won = 0.001; drag = null; A.burst(x, y - cam, 16, ['#FDE68A', '#FFFFFF', '#84CC16'], 150, 0.6, 3); },
      dbg: function () { return { x: x, y: y, vy: vy, cam: cam, hr: hr, pw: pw(), plats: plats.map(function (p) { return [p.x | 0, (p.y - cam) | 0, p.k, p.gone ? 1 : 0]; }), dead: dead }; }
    };
  }, 'drag', 0.62);

  /* ================================================================== 20. FRUIT CATCH — drag the basket to catch every falling fruit,
     never a bomb. Faster and bigger showers with time. A fruit on the ground or a bomb in the basket ends the round. */
  boot('fruitcatch', function (A) {
    var W, H, T, dpr, bg, bw, by, bx, items = [], dead = 0, won = 0, hail = null, t = 0, spT = 0, drag = null, fr = [], bombS, basketS, caught = 0, splats = [];
    var FK = ['apple', 'orange', 'pear', 'grape', 'straw', 'lemon'];
    function fruitS(k, r) {
      return mkc(r * 2.4, r * 2.6, dpr, function (c, w, h) {
        c.translate(w / 2, h * 0.56);
        var body = function (cols, sx, sy) { c.fillStyle = rg(c, -r * 0.3, -r * 0.35, r * 1.2, cols); c.beginPath(); c.ellipse(0, 0, r * (sx || 1), r * (sy || 1), 0, 0, TAU); c.fill(); };
        if (k === 'apple') { body(['#FECACA', '#EF4444', '#7F1D1D']); }
        else if (k === 'orange') { body(['#FED7AA', '#F97316', '#9A3412']); c.fillStyle = 'rgba(124,45,18,.25)'; for (var i = 0; i < 8; i++) circ(c, Math.cos(i) * r * 0.5, Math.sin(i * 1.7) * r * 0.5, r * 0.05, 'rgba(124,45,18,.25)'); }
        else if (k === 'pear') { c.fillStyle = rg(c, -r * 0.3, 0, r * 1.2, ['#ECFCCB', '#84CC16', '#3F6212']); c.beginPath(); c.ellipse(0, r * 0.2, r * 0.9, r * 0.85, 0, 0, TAU); c.ellipse(0, -r * 0.45, r * 0.55, r * 0.6, 0, 0, TAU); c.fill(); }
        else if (k === 'grape') { for (i = 0; i < 7; i++) { var gx = [-0.45, 0, 0.45, -0.25, 0.25, 0, 0][i] * r, gy = [-0.4, -0.45, -0.4, 0.05, 0.05, 0.5, -0.05][i] * r; circ(c, gx, gy, r * 0.32, rg(c, gx - r * 0.1, gy - r * 0.1, r * 0.32, ['#E9D5FF', '#9333EA', '#4C1D95'])); } }
        else if (k === 'straw') { c.fillStyle = rg(c, -r * 0.3, -r * 0.3, r * 1.2, ['#FECACA', '#E11D48', '#881337']); c.beginPath(); c.moveTo(0, r); c.quadraticCurveTo(-r * 1.1, -r * 0.2, -r * 0.6, -r * 0.7); c.quadraticCurveTo(0, -r * 0.95, r * 0.6, -r * 0.7); c.quadraticCurveTo(r * 1.1, -r * 0.2, 0, r); c.fill(); for (i = 0; i < 9; i++) circ(c, (i % 3 - 1) * r * 0.35, (Math.floor(i / 3) - 0.6) * r * 0.45, r * 0.05, '#FEF08A'); }
        else { body(['#FEF9C3', '#FACC15', '#A16207'], 1.05, 0.8); }
        if (k !== 'grape') { c.strokeStyle = '#5C4033'; c.lineWidth = r * 0.12; c.beginPath(); c.moveTo(0, -r * 0.85); c.lineTo(r * 0.1, -r * 1.15); c.stroke(); }
        c.fillStyle = '#22C55E'; c.beginPath(); c.ellipse(r * 0.3, -r * 1.0, r * 0.32, r * 0.14, -0.5, 0, TAU); c.fill();
        c.fillStyle = 'rgba(255,255,255,.55)'; c.beginPath(); c.ellipse(-r * 0.35, -r * 0.35, r * 0.22, r * 0.12, -0.6, 0, TAU); c.fill();
      });
    }
    function spawn(live) {
      var lv = live ? A.lv() : 0.2, bomb = live && Math.random() < 0.16 + 0.12 * lv, r = clamp(Math.min(W, H - T) * 0.045, 13, 30);
      items.push({ x: rnd(r * 1.5, W - r * 1.5), y: T - r * 2, vy: (H - T) * (0.3 + 0.32 * lv) * rnd(0.85, 1.2), r: r, b: bomb, k: (Math.random() * FK.length) | 0, a: rnd(-0.5, 0.5), va: rnd(-2, 2) });
    }
    return {
      size: function (w, h, uu, d, top) {
        W = w; H = h; dpr = d; T = top; bw = clamp(W * 0.26, 70, 170); by = H - (H - T) * 0.1; if (!bx) bx = W / 2;
        var r = clamp(Math.min(W, H - T) * 0.045, 13, 30); fr = FK.map(function (k) { return fruitS(k, r); });
        bombS = mkc(r * 2.6, r * 2.8, dpr, function (c, w2, h2) { c.translate(w2 / 2, h2 * 0.58); circ(c, 0, 0, r, rg(c, -r * 0.3, -r * 0.3, r * 1.2, ['#71717A', '#27272A', '#09090B'])); c.fillStyle = '#3F3F46'; c.fillRect(-r * 0.25, -r * 1.15, r * 0.5, r * 0.3); c.strokeStyle = '#A16207'; c.lineWidth = r * 0.12; c.beginPath(); c.moveTo(0, -r * 1.15); c.quadraticCurveTo(r * 0.3, -r * 1.5, r * 0.55, -r * 1.35); c.stroke(); c.fillStyle = 'rgba(255,255,255,.4)'; c.beginPath(); c.ellipse(-r * 0.35, -r * 0.35, r * 0.25, r * 0.12, -0.6, 0, TAU); c.fill(); c.fillStyle = '#EF4444'; c.font = '900 ' + Math.round(r * 0.8) + 'px system-ui'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('!', 0, r * 0.1); });
        basketS = mkc(bw, bw * 0.5, dpr, function (c, w2, h2) {
          c.fillStyle = lg(c, 0, 0, 0, h2, ['#D97706', '#92400E', '#78350F']); c.beginPath(); c.moveTo(0, h2 * 0.15); c.lineTo(w2, h2 * 0.15); c.lineTo(w2 * 0.86, h2); c.lineTo(w2 * 0.14, h2); c.closePath(); c.fill();
          c.strokeStyle = 'rgba(253,230,138,.45)'; c.lineWidth = 1.5; for (var i = 1; i < 8; i++) { c.beginPath(); c.moveTo(w2 * i / 8, h2 * 0.15); c.lineTo(w2 * 0.14 + (w2 * 0.72) * i / 8, h2); c.stroke(); } for (i = 1; i < 4; i++) { c.beginPath(); c.moveTo(w2 * 0.05 * i, h2 * (0.15 + 0.22 * i)); c.lineTo(w2 * (1 - 0.05 * i), h2 * (0.15 + 0.22 * i)); c.stroke(); }
          c.fillStyle = lg(c, 0, 0, 0, h2 * 0.2, ['#FBBF24', '#B45309']); rr(c, -1, 0, w2 + 2, h2 * 0.2, h2 * 0.1); c.fill();
        });
        bg = mkc(W, H, dpr, function (c) {
          c.fillStyle = lg(c, 0, 0, 0, H, ['#38BDF8', '#BAE6FD', '#FEF3C7']); c.fillRect(0, 0, W, H);
          circ(c, W * 0.2, T + (H - T) * 0.15, (H - T) * 0.06, '#FEF9C3');
          c.fillStyle = '#4D7C0F'; c.beginPath(); c.moveTo(0, H); for (var x = 0; x <= W; x += 8) c.lineTo(x, by + (H - T) * 0.04 + Math.sin(x / W * 7) * 6); c.lineTo(W, H); c.fill();
          c.fillStyle = '#65A30D'; c.fillRect(0, H - (H - T) * 0.035, W, H);
          for (var i = 0; i < 3; i++) { var tx = W * (0.15 + i * 0.35), ty = T + (H - T) * 0.05; c.fillStyle = 'rgba(21,128,61,.35)'; c.beginPath(); c.ellipse(tx, ty, W * 0.22, (H - T) * 0.08, 0, 0, TAU); c.fill(); }
        });
      },
      reset: function () { items = []; splats = []; dead = 0; won = 0; hail = null; spT = 0.4; bx = W / 2; drag = null; caught = 0; },
      step: function (dt, live) {
        t += dt; var lv = live ? A.lv() : 0.2, i, it;
        for (i = splats.length - 1; i >= 0; i--) { splats[i].t += dt; if (splats[i].t > 1.2) splats.splice(i, 1); }
        if (hail) { hail.t += dt; hail.k -= dt; if (hail.k <= 0) { hail.k = 0.05; items.push({ x: rnd(0, W), y: T, vy: (H - T) * 1.5, r: rnd(5, 12), hail: 1 }); } for (i = items.length - 1; i >= 0; i--) { it = items[i]; it.y += it.vy * dt; if (it.y > by) items.splice(i, 1); } if (!hail.hit && hail.t > 0.8) { hail.hit = 1; dead = 1; A.shake(0.4); A.burst(bx, by, 20, ['#E0F2FE', '#fff'], 200, 0.7, 3); } return; }
        if (dead || won) return;
        spT -= dt; if (spT <= 0) { spawn(live); if (live && lv > 0.5 && Math.random() < 0.3) spawn(live); spT = Math.max(0.35, 1.25 - 0.85 * lv) * rnd(0.7, 1.3); }
        if (A.idle()) { var tg = items.filter(function (q) { return !q.b; }).sort(function (a, b) { return b.y - a.y; })[0]; if (tg) bx += clamp(tg.x - bx, -W * 1.2 * dt, W * 1.2 * dt); }
        bx = clamp(bx, bw / 2, W - bw / 2);
        for (i = items.length - 1; i >= 0; i--) {
          it = items[i]; it.y += it.vy * dt; it.a += it.va * dt;
          if (it.y + it.r > by && it.y < by + bw * 0.12 && Math.abs(it.x - bx) < bw / 2 - it.r * 0.3) {
            items.splice(i, 1);
            if (it.b) { boomFx(A, bx, by, 1.1); if (A.live()) { if (A.fail(A.l.fail)) dead = 1; } return; }
            caught++; A.burst(it.x, by, 6, ['#FDE68A', '#FFFFFF', '#F472B6'], 100, 0.4, 2.6, 0); continue;
          }
          if (it.y - it.r > by + bw * 0.2) {
            items.splice(i, 1);
            if (!it.b) { splats.push({ x: it.x, y: H - (H - T) * 0.05, t: 0 }); if (A.live()) { if (A.fail(A.l.fail2)) dead = 1; return; } }
          }
        }
      },
      draw: function (c) {
        A.bg(bg);
        var i, it;
        for (i = 0; i < splats.length; i++) { c.globalAlpha = 1 - splats[i].t / 1.2; c.fillStyle = '#B91C1C'; c.beginPath(); c.ellipse(splats[i].x, splats[i].y, 14, 4, 0, 0, TAU); c.fill(); } c.globalAlpha = 1;
        for (i = 0; i < items.length; i++) {
          it = items[i];
          if (it.hail) { circ(c, it.x, it.y, it.r, rg(c, it.x - 2, it.y - 2, it.r, ['#FFFFFF', '#E0F2FE', '#7DD3FC'])); continue; }
          var img = it.b ? bombS : fr[it.k]; c.save(); c.translate(it.x, it.y); c.rotate(it.a); c.drawImage(img, -img.w / 2, -img.h * 0.56, img.w, img.h); c.restore();
          if (it.b && (t * 8 | 0) % 2) circ(c, it.x + it.r * 0.55, it.y - it.r * 1.25, it.r * 0.18, '#FDE68A');
        }
        c.fillStyle = 'rgba(0,0,0,.18)'; c.beginPath(); c.ellipse(bx, by + bw * 0.52, bw * 0.42, bw * 0.06, 0, 0, TAU); c.fill();
        c.drawImage(basketS, bx - bw / 2, by, bw, bw * 0.5);
      },
      down: function (x) { drag = { x: x, s: bx }; },
      move: function (x) { if (drag && !dead) bx = clamp(drag.s + (x - drag.x) * 1.3, bw / 2, W - bw / 2); },
      up: function () { drag = null; },
      key: function (k) { if (k === 'left') bx -= bw * 0.3; else if (k === 'right') bx += bw * 0.3; },
      boom: function () { hail = { t: 0, k: 0 }; drag = null; },
      win: function () { won = 0.001; drag = null; A.burst(bx, by, 16, ['#FDE68A', '#FFFFFF', '#F472B6'], 150, 0.6, 3); },
      dbg: function () { return { bx: bx, by: by, bw: bw, items: items.map(function (q) { return [q.x | 0, q.y | 0, q.b ? 1 : 0, q.vy | 0]; }), dead: dead, caught: caught }; }
    };
  }, 'drag', 0.5);

  /* ================================================================== 21. BEAT TAP — notes slide down 3 neon lanes on the beat: tap
     the lane when the note reaches the glowing line. The tempo rises. A miss or a tap off the beat ends the round. */
  boot('beattap', function (A) {
    var W, H, T, dpr, bg, lineY, lanes = 3, notes = [], tNow = 0, beat = 0, nextB = 0, bpm = 100, travel = 1.6, dead = 0, won = 0, blown = null, t = 0, flashL = [0, 0, 0], combo = 0, pulse = 0, gemS = [];
    var LC = [['#F9A8D4', '#EC4899'], ['#A5F3FC', '#06B6D4'], ['#FDE68A', '#F59E0B']];
    function laneX(l, y) { var k = (y - T) / (lineY - T), top = W * 0.18, bot = W * 0.86, w = top + (bot - top) * clamp(k, 0, 1.2); return W / 2 + (l - 1) * w / 3; }
    function noteY(n) { return T + (lineY - T) * (1 - (n.at - tNow) / travel); }
    function gen(live) {
      var lv = live ? A.lv() : 0.15; bpm = 92 + 70 * lv; travel = Math.max(0.95, 1.65 - 0.6 * lv);
      var spb = 60 / bpm;
      while (nextB < tNow + travel + 0.5) {
        var r = Math.random(), l = (Math.random() * 3) | 0;
        if (r < 0.75 || nextB < 1.2) notes.push({ at: nextB, l: l, hit: 0 });
        if (live && lv > 0.35 && Math.random() < 0.25) notes.push({ at: nextB + spb / 2, l: (l + 1 + ((Math.random() * 2) | 0)) % 3, hit: 0 });
        nextB += spb;
      }
    }
    function tapLane(l) {
      if (dead || blown || won || l < 0 || l > 2) return;
      flashL[l] = 0.15;
      var best = null; notes.forEach(function (n) { if (n.l === l && !n.hit) { var d = Math.abs(n.at - tNow); if (d < 0.32 && (!best || d < best.d)) best = { n: n, d: d }; } });
      if (best && best.d < 0.32) {
        best.n.hit = tNow; combo++; var y = lineY;
        K.sfx('tick', { as: 'peg', p: 0.15 + l * 0.3 + (best.d < 0.08 ? 0.1 : 0) });
        A.burst(laneX(l, y), y, best.d < 0.08 ? 10 : 5, [LC[l][0], '#fff'], 140, 0.4, 2.6, 0);
        if (combo % 10 === 0) A.ring(W / 2, lineY, W * 0.4, LC[l][0]);
        return;
      }
      combo = 0;
      if (A.live()) { if (A.fail(A.l.fail)) { dead = 1; A.shake(0.3); } }
    }
    return {
      size: function (w, h, uu, d, top) {
        W = w; H = h; dpr = d; T = top; lineY = H - (H - T) * 0.16;
        var gr = clamp(W * 0.07, 16, 40);
        gemS = LC.map(function (cl) { return mkc(gr * 2.6, gr * 1.6, dpr, function (c, w2, h2) { c.translate(w2 / 2, h2 / 2); c.fillStyle = rg(c, 0, 0, gr * 1.2, ['#FFFFFF', cl[0], cl[1]]); rr(c, -gr * 1.1, -gr * 0.55, gr * 2.2, gr * 1.1, gr * 0.55); c.fill(); c.fillStyle = 'rgba(255,255,255,.6)'; rr(c, -gr * 0.8, -gr * 0.42, gr * 1.6, gr * 0.25, gr * 0.12); c.fill(); }); });
        gemS.r = gr;
        bg = mkc(W, H, dpr, function (c) {
          c.fillStyle = lg(c, 0, 0, 0, H, ['#0B0221', '#2E1065', '#0B0221']); c.fillRect(0, 0, W, H);
          for (var l = 0; l <= 3; l++) { c.strokeStyle = 'rgba(196,181,253,.35)'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(laneX(l - 0.5, T), T); c.lineTo(laneX(l - 0.5, H), H); c.stroke(); }
          for (l = 0; l < 3; l++) { c.fillStyle = 'rgba(255,255,255,.035)'; c.beginPath(); c.moveTo(laneX(l - 0.5, T), T); c.lineTo(laneX(l + 0.5, T), T); c.lineTo(laneX(l + 0.5, H), H); c.lineTo(laneX(l - 0.5, H), H); c.fill(); }
          // speakers
          [0.08, 0.92].forEach(function (k) { var sx = W * k, sy = T + (H - T) * 0.3; c.fillStyle = '#18181B'; rr(c, sx - W * 0.06, sy - W * 0.1, W * 0.12, W * 0.22, 6); c.fill(); circ(c, sx, sy + W * 0.04, W * 0.04, '#3F3F46'); circ(c, sx, sy - W * 0.05, W * 0.022, '#3F3F46'); });
        });
      },
      reset: function (live) { notes = []; tNow = 0; nextB = 1.0; dead = 0; won = 0; blown = null; combo = 0; gen(live); },
      step: function (dt, live) {
        t += dt; var i; for (i = 0; i < 3; i++) flashL[i] = Math.max(0, flashL[i] - dt);
        if (blown) { blown.t += dt; if (!blown.hit && blown.t > 0.4) { blown.hit = 1; boomFx(A, W * 0.08, T + (H - T) * 0.3, 1); boomFx(A, W * 0.92, T + (H - T) * 0.3, 1); } return; }
        if (dead || won) return;
        tNow += dt; gen(live);
        var spb = 60 / bpm; pulse = 1 - ((tNow % spb) / spb);
        for (i = notes.length - 1; i >= 0; i--) {
          var n = notes[i];
          if (n.hit) { if (tNow - n.hit > 0.25) notes.splice(i, 1); continue; }
          if (A.idle() && Math.abs(n.at - tNow) < 0.02) { tapLane(n.l); continue; }
          if (tNow - n.at > 0.32) { if (A.live()) { if (A.fail(A.l.fail2)) { dead = 1; A.shake(0.3); } return; } notes.splice(i, 1); }
        }
      },
      draw: function (c) {
        A.bg(bg);
        var i, l;
        // hit line + lane flashes
        for (l = 0; l < 3; l++) { if (flashL[l]) { c.globalAlpha = flashL[l] / 0.15 * 0.5; c.fillStyle = LC[l][1]; c.beginPath(); c.moveTo(laneX(l - 0.5, lineY - 60), lineY - 60); c.lineTo(laneX(l + 0.5, lineY - 60), lineY - 60); c.lineTo(laneX(l + 0.5, H), H); c.lineTo(laneX(l - 0.5, H), H); c.fill(); c.globalAlpha = 1; } }
        c.strokeStyle = 'rgba(253,230,138,' + (0.55 + 0.45 * pulse) + ')'; c.lineWidth = 3 + 3 * pulse; c.beginPath(); c.moveTo(laneX(-0.5, lineY), lineY); c.lineTo(laneX(2.5, lineY), lineY); c.stroke();
        for (l = 0; l < 3; l++) { var x = laneX(l, lineY); c.strokeStyle = LC[l][0]; c.lineWidth = 2; c.beginPath(); c.ellipse(x, lineY, gemS.r * 1.2, gemS.r * 0.6, 0, 0, TAU); c.stroke(); }
        for (i = 0; i < notes.length; i++) {
          var n = notes[i], y = n.hit ? lineY : noteY(n); if (y < T - 30 || y > H + 30) continue;
          var k = clamp((y - T) / (lineY - T), 0.3, 1.1), gx = laneX(n.l, y), img = gemS[n.l];
          c.globalAlpha = n.hit ? Math.max(0, 1 - (tNow - n.hit) * 4) : 1;
          var s = n.hit ? 1 + (tNow - n.hit) * 3 : k;
          c.drawImage(img, gx - img.w * s / 2, y - img.h * s / 2, img.w * s, img.h * s);
        }
        c.globalAlpha = 1;
        if (blown && blown.t < 1.4) { for (i = 0; i < 6; i++) spark(c, W * (Math.random() < 0.5 ? 0.08 : 0.92) + rnd(-20, 20), T + (H - T) * 0.3 + rnd(-30, 30), 6, '#FDE68A'); }
        // speaker cones pulse on the beat
        if (!blown) [0.08, 0.92].forEach(function (k2) { circ(c, W * k2, T + (H - T) * 0.3 + W * 0.04, W * 0.025 * (1 + pulse * 0.4), '#A78BFA'); });
      },
      act: function (k, x, y) { var best = 0, bd = 1e9; for (var l = 0; l < 3; l++) { var d = Math.abs(x - laneX(l, Math.max(y, lineY - 40))); if (d < bd) { bd = d; best = l; } } tapLane(best); },
      key: function (k) { tapLane(k === 'left' ? 0 : k === 'right' ? 2 : 1); },
      boom: function () { blown = { t: 0 }; A.flash(0.3); },
      win: function () { won = 0.001; A.burst(W / 2, lineY, 18, ['#FDE68A', '#FFFFFF', '#F472B6'], 160, 0.6, 3); },
      dbg: function () { return { tNow: tNow, lineY: lineY, notes: notes.filter(function (n) { return !n.hit; }).map(function (n) { return [n.l, +(n.at - tNow).toFixed(3), laneX(n.l, lineY) | 0]; }), bpm: bpm, dead: dead }; }
    };
  }, 'aim', 0.42);

  /* ================================================================== 22. ROPE SWING — hold to grab the nearest hook ahead and swing,
     release to fly. Real pendulum physics; the hooks drift further apart with time. The ground is lava. */
  boot('ropeswing', function (A) {
    var W, H, T, dpr, bg, hr, p = { x: 0, y: 0, vx: 0, vy: 0 }, hooks = [], rope = null, cam = 0, lastX = 0, dead = 0, won = 0, snap = null, t = 0, G4, reach, held = false, fr = [], aiT = 0, ph = 0, lava;
    var HERO = { light: '#3B82F6', mid: '#1D4ED8', dark: '#1E3A8A', vest: '#B91C1C', skin: '#F5D2B4', skinD: '#DFAE88', boot: '#111827', gun: 'rgba(0,0,0,0)', gunL: 'rgba(0,0,0,0)', strap: '#FACC15' };
    function addHook(live) { var lv = live ? A.lv() : 0.15; lastX += reach * rnd(0.5 + 0.2 * lv, 0.72 + 0.2 * lv); hooks.push({ x: lastX, y: T + (H - T) * rnd(0.08, 0.3) }); }
    function grab() {
      if (rope || dead || snap) return;
      var best = null; hooks.forEach(function (h) { var d = Math.hypot(h.x - p.x, h.y - p.y); if (h.x > p.x - reach * 0.2 && h.y < p.y && d < reach && (!best || h.x > best.x - reach * 0.3 && d < best.d)) best = { h: h, d: d, x: h.x }; });
      if (best) { rope = { h: best.h, L: best.d }; A.sx('whoosh', { v: 0.35 }); }
    }
    function release() { if (rope) { rope = null; var sp2 = Math.hypot(p.vx, p.vy); if (sp2 > 0) { p.vx *= 1.06; p.vy *= 1.06; } } }
    return {
      size: function (w, h, uu, d, top) {
        W = w; H = h; dpr = d; T = top; hr = clamp((H - T) * 0.2, 50, 130); G4 = (H - T) * 2.0; reach = clamp((H - T) * 0.75, 150, 520); lava = H - (H - T) * 0.06;
        var RP = { skin: '#F5D2B4', hair: '#2B1B10', top: ['#2563EB', '#1E3A8A'], bottom: ['#334155', '#1E293B'], shoe: '#111827', gloves: '#7C2D12', bag: ['#B91C1C', '#7F1D1D'] };
        fr = D6.Rig ? [rigFrames(hr, 1, function (c) { D6.Rig.draw(c, hr, { view: 'side', pose: 'jump', ph: 0.2, pal: RP }); })[0], rigFrames(hr, 1, function (c) { D6.Rig.draw(c, hr, { view: 'side', pose: 'run', ph: 0.25, pal: RP }); })[0]]
          : [rigFrames(hr, 1, function (c) { soldierSide(c, hr, 0.2, 'jump', HERO); })[0], rigFrames(hr, 1, function (c) { soldierSide(c, hr, 0.6, 'jump', HERO); })[0]];
        bg = mkc(W, H, dpr, function (c) {
          c.fillStyle = lg(c, 0, 0, 0, H, ['#1E1B4B', '#7E22CE', '#F97316']); c.fillRect(0, 0, W, H);
          for (var i = 0; i < 4; i++) { var cx = W * (0.1 + i * 0.3), cw = W * 0.08; c.fillStyle = 'rgba(30,27,75,.55)'; c.fillRect(cx - cw / 2, T + (H - T) * 0.25, cw, H); c.fillRect(cx - cw, T + (H - T) * 0.25, cw * 2, 8); }
          c.fillStyle = lg(c, 0, lava - 10, 0, H, ['#FDE047', '#F97316', '#7F1D1D']); c.fillRect(0, lava, W, H - lava);
        });
      },
      reset: function (live) { hooks = []; lastX = W * 0.35; hooks.push({ x: lastX, y: T + (H - T) * 0.15 }); for (var i = 0; i < 6; i++) addHook(live); p.x = lastX - reach * 0.0 - (hooks[1].x - hooks[0].x) * 0 - reach * 0.45; p.x = hooks[0].x - reach * 0.4; p.y = hooks[0].y + reach * 0.3; p.vx = 0; p.vy = 0; rope = { h: hooks[0], L: Math.hypot(hooks[0].x - p.x, hooks[0].y - p.y) }; cam = p.x - W * 0.3; dead = 0; won = 0; snap = null; held = live ? true : false; },
      step: function (dt, live) {
        t += dt; ph += dt * 2; var n = 3, i;
        if (snap) { snap.t += dt; rope = null; }
        if (dead && !snap) { p.vy += G4 * dt; p.y += p.vy * dt; return; }
        if (won) return;
        if (A.idle() && !dead) { // attract: release past the bottom, grab while falling near a hook
          if (rope) { var ang = Math.atan2(p.y - rope.h.y, p.x - rope.h.x); if (p.vx > 0 && ang < Math.PI / 2 - 0.55 && rope.h !== hooks[hooks.length - 1]) release(); }
          else if (p.vy > -50) grab();
        }
        for (var k = 0; k < n; k++) {
          var h = dt / n; p.vy += G4 * h; p.x += p.vx * h; p.y += p.vy * h;
          if (rope) { var dx = p.x - rope.h.x, dy = p.y - rope.h.y, d = Math.hypot(dx, dy); if (d > rope.L) { var nx = dx / d, ny = dy / d; p.x = rope.h.x + nx * rope.L; p.y = rope.h.y + ny * rope.L; var vr = p.vx * nx + p.vy * ny; if (vr > 0) { p.vx -= vr * nx; p.vy -= vr * ny; } } }
        }
        p.vx *= 1 - 0.02 * dt;
        if (p.y < T + hr * 0.2) { p.y = T + hr * 0.2; p.vy = Math.max(0, p.vy); }
        cam += (p.x - W * 0.32 - cam) * Math.min(1, dt * 4);
        while (lastX < cam + W * 2) addHook(live);
        for (i = hooks.length - 1; i >= 0; i--) if (hooks[i].x < cam - W && (!rope || rope.h !== hooks[i])) hooks.splice(i, 1);
        if (p.y + hr * 0.2 > lava) { if (A.live()) { if (A.fail(A.l.fail)) { dead = 1; A.burst(p.x - cam, lava, 18, ['#FDE047', '#F97316', '#7F1D1D'], 200, 0.7, 3.4); A.shake(0.3); } } else this.reset(false); }
        if (snap && !snap.b && p.y + hr * 0.2 > lava) { snap.b = 1; dead = 1; boomFx(A, p.x - cam, lava, 1); }
      },
      draw: function (c) {
        A.bg(bg);
        var i;
        // lava waves
        c.fillStyle = 'rgba(254,240,138,.5)'; for (i = 0; i < 8; i++) { var lx = ((i * W / 4 - cam * 0.9) % (W * 2) + W * 2) % (W * 2) - W * 0.25; c.beginPath(); c.ellipse(lx, lava + 4 + Math.sin(t * 2 + i) * 2, W * 0.08, 3, 0, 0, TAU); c.fill(); }
        for (i = 0; i < hooks.length; i++) { var hx = hooks[i].x - cam, hy = hooks[i].y; if (hx < -30 || hx > W + 30) continue; var inR = !rope && Math.hypot(hooks[i].x - p.x, hooks[i].y - p.y) < reach && hooks[i].x > p.x - reach * 0.2 && hooks[i].y < p.y; circ(c, hx, hy, 9, inR ? 'rgba(253,230,138,.35)' : 'rgba(255,255,255,.12)'); circ(c, hx, hy, 5.5, rg(c, hx - 2, hy - 2, 6, ['#F5F5F4', '#A8A29E', '#57534E'])); c.strokeStyle = '#78716C'; c.lineWidth = 2; c.beginPath(); c.arc(hx, hy + 6, 4, 0, Math.PI); c.stroke(); }
        if (rope) { c.strokeStyle = '#D6D3D1'; c.lineWidth = 2.5; c.beginPath(); c.moveTo(rope.h.x - cam, rope.h.y + 8); c.lineTo(p.x - cam, p.y - hr * 0.6); c.stroke(); }
        if (!(dead && snap && snap.b)) {
          var ang = rope ? Math.atan2(p.x - rope.h.x, rope.h.y - p.y) * -0.6 : clamp(Math.atan2(p.vy, Math.abs(p.vx) + 1) * 0.5, -0.6, 0.8);
          if (rope) { c.save(); c.translate(p.x - cam, p.y - hr * 0.6); c.rotate(-Math.atan2(p.x - rope.h.x, p.y - rope.h.y)); c.drawImage(fr[0], -hr * 0.6, -hr * 0.02, hr * 1.2, hr * 1.12); c.restore(); }
          else { c.save(); c.translate(p.x - cam, p.y + hr * 0.45); c.rotate(ang); c.drawImage(fr[1], -hr * 0.6, -hr * 1.08, hr * 1.2, hr * 1.12); c.restore(); }
        }
      },
      down: function () { held = true; grab(); },
      move: function () { },
      up: function () { held = false; release(); },
      key: function () { if (rope) release(); else grab(); },
      boom: function () { snap = { t: 0 }; rope = null; A.sx('whoosh'); },
      win: function () { won = 0.001; A.burst(p.x - cam, p.y, 16, ['#FDE68A', '#FFFFFF'], 150, 0.6, 3); },
      dbg: function () { return { p: p, cam: cam, rope: rope ? { x: rope.h.x, y: rope.h.y, L: rope.L } : null, hooks: hooks.map(function (h) { return [h.x | 0, h.y | 0]; }), reach: reach, lava: lava, dead: dead }; }
    };
  }, 'drag', 0.55);

  /* ================================================================== 23. MINI GOLF — pull back from the ball like a slingshot and
     release to putt. Sink it within 3 strokes, around walls and a moving bar, before the shot clock runs out. */
  boot('minigolf', function (A) {
    var W, H, T, dpr, bg = null, cx0, cy0, cw, chh, ball, hole, walls = [], bar = null, strokes = 0, clock = 0, clockMax = 9, aim = null, dead = 0, won = 0, gopher = null, t = 0, holeN = 0, sunk = 0, br, hrad, aiT = 0, lvlLive = false;
    function build(live) {
      var lv = live ? A.lv() : 0.2; lvlLive = live;
      br = clamp(Math.min(W, H - T) * 0.022, 7, 13); hrad = br * 1.7;
      ball = { x: cx0 + cw / 2 + rnd(-cw * 0.2, cw * 0.2), y: cy0 + chh * 0.86, vx: 0, vy: 0 };
      hole = { x: cx0 + cw * rnd(0.2, 0.8), y: cy0 + chh * rnd(0.1, 0.22) };
      walls = []; var nw = 1 + Math.round(1.5 * lv + Math.random());
      for (var i = 0; i < nw; i++) { var ww = cw * rnd(0.3, 0.55), wh = br * 2, wx = Math.random() < 0.5 ? cx0 : cx0 + cw - ww, wy = cy0 + chh * (0.35 + i * 0.2 + rnd(-0.04, 0.04)); walls.push({ x: wx, y: wy, w: ww, h: wh }); }
      bar = live && lv > 0.2 ? { y: cy0 + chh * 0.28, w: cw * 0.28, x: cx0, v: cw * (0.35 + 0.4 * lv) } : null;
      strokes = 0; clockMax = Math.max(4.5, 9 - 4 * lv); clock = clockMax; sunk = 0; holeN++;
      bg = null;
    }
    function rects() { var r = walls.slice(); if (bar) r.push({ x: bar.x, y: bar.y, w: bar.w, h: br * 1.6, mv: 1 }); return r; }
    function putt(dx, dy) {
      if (dead || gopher || won || sunk || Math.hypot(ball.vx, ball.vy) > 2) return;
      var L = Math.min(W, H - T) * 0.35, pw = clamp(Math.hypot(dx, dy) / L, 0.05, 1), v = pw * (H - T) * 2.3, a = Math.atan2(dy, dx);
      ball.vx = Math.cos(a) * v; ball.vy = Math.sin(a) * v; strokes++; clock = clockMax; A.sx('hit', { v: 0.3 + pw * 0.5 }); K.sfx('act');
    }
    function paintBg() {
      bg = mkc(W, H, dpr, function (c) {
        c.fillStyle = lg(c, 0, 0, 0, H, ['#14532D', '#166534', '#14532D']); c.fillRect(0, 0, W, H);
        for (var i = 0; i < 40; i++) { c.fillStyle = 'rgba(21,128,61,.6)'; c.beginPath(); c.arc(rnd(0, W), rnd(T, H), rnd(4, 14), 0, TAU); c.fill(); }
        rr(c, cx0 - 8, cy0 - 8, cw + 16, chh + 16, 14); c.fillStyle = lg(c, 0, 0, 0, H, ['#92400E', '#78350F']); c.fill();
        rr(c, cx0, cy0, cw, chh, 8); c.fillStyle = lg(c, cx0, 0, cx0 + cw, 0, ['#22C55E', '#4ADE80', '#22C55E']); c.fill();
        c.strokeStyle = 'rgba(255,255,255,.07)'; c.lineWidth = 8; for (var y = cy0 + 10; y < cy0 + chh; y += 22) { c.beginPath(); c.moveTo(cx0, y); c.lineTo(cx0 + cw, y); c.stroke(); }
        walls.forEach(function (w) { rr(c, w.x, w.y, w.w, w.h, 4); c.fillStyle = lg(c, 0, w.y, 0, w.y + w.h, ['#D6A86B', '#92400E']); c.fill(); });
        circ(c, hole.x, hole.y, hrad + 2, 'rgba(0,0,0,.25)'); circ(c, hole.x, hole.y, hrad, rg(c, hole.x, hole.y - hrad * 0.3, hrad, ['#000', '#111', '#1F2937']));
        c.strokeStyle = '#E5E7EB'; c.lineWidth = 2; c.beginPath(); c.moveTo(hole.x, hole.y); c.lineTo(hole.x, hole.y - hrad * 4); c.stroke(); c.fillStyle = '#EF4444'; c.beginPath(); c.moveTo(hole.x, hole.y - hrad * 4); c.lineTo(hole.x + hrad * 1.8, hole.y - hrad * 3.5); c.lineTo(hole.x, hole.y - hrad * 3); c.fill();
      });
    }
    return {
      size: function (w, h, uu, d, top) { W = w; H = h; dpr = d; T = top; cw = Math.min(W - 30, (H - T) * 0.72); chh = (H - T) - 40; cx0 = (W - cw) / 2; cy0 = T + 18; if (ball) build(lvlLive); },
      reset: function (live) { holeN = 0; build(live); dead = 0; won = 0; gopher = null; aim = null; },
      step: function (dt, live) {
        t += dt; if (!bg) paintBg(); var i;
        if (bar) { bar.x += bar.v * dt; if (bar.x < cx0 || bar.x + bar.w > cx0 + cw) { bar.v = -bar.v; bar.x = clamp(bar.x, cx0, cx0 + cw - bar.w); } }
        if (gopher) { gopher.t += dt; if (gopher.t > 0.5) { ball.x += (hole.x - ball.x) * Math.min(1, dt * 8); ball.y += (hole.y - ball.y) * Math.min(1, dt * 8); } if (!gopher.hit && gopher.t > 1.1) { gopher.hit = 1; dead = 1; } return; }
        if (dead || won) return;
        if (sunk) { sunk += dt; if (sunk > 0.9) build(live); return; }
        var moving = Math.hypot(ball.vx, ball.vy) > 2, n = 4;
        for (var k = 0; k < n; k++) {
          var h2 = dt / n; ball.x += ball.vx * h2; ball.y += ball.vy * h2;
          if (ball.x < cx0 + br) { ball.x = cx0 + br; ball.vx = Math.abs(ball.vx) * 0.85; } if (ball.x > cx0 + cw - br) { ball.x = cx0 + cw - br; ball.vx = -Math.abs(ball.vx) * 0.85; }
          if (ball.y < cy0 + br) { ball.y = cy0 + br; ball.vy = Math.abs(ball.vy) * 0.85; } if (ball.y > cy0 + chh - br) { ball.y = cy0 + chh - br; ball.vy = -Math.abs(ball.vy) * 0.85; }
          rects().forEach(function (r) {
            var nx = clamp(ball.x, r.x, r.x + r.w), ny = clamp(ball.y, r.y, r.y + r.h), dx = ball.x - nx, dy = ball.y - ny, d = Math.hypot(dx, dy);
            if (d < br) { if (d < 0.01) { dy = -1; d = 1; } var ux = dx / d, uy = dy / d; ball.x = nx + ux * br; ball.y = ny + uy * br; var vn = ball.vx * ux + ball.vy * uy; if (vn < 0) { ball.vx -= 1.8 * vn * ux; ball.vy -= 1.8 * vn * uy; if (r.mv) ball.vx += bar.v * 0.3; } }
          });
          var hd = Math.hypot(ball.x - hole.x, ball.y - hole.y), spd = Math.hypot(ball.vx, ball.vy);
          if (hd < hrad * 0.95 && spd < (H - T) * 1.1) { sunk = 0.001; ball.vx = ball.vy = 0; ball.x = hole.x; ball.y = hole.y; A.ring(hole.x, hole.y, hrad * 4, '#FDE68A'); A.burst(hole.x, hole.y, 16, ['#FDE68A', '#FFFFFF', '#4ADE80'], 160, 0.6, 3); return; }
          else if (hd < hrad * 1.2 && spd < (H - T) * 1.8) { ball.vx += (hole.x - ball.x) * 6 * h2 * 10; ball.vy += (hole.y - ball.y) * 6 * h2 * 10; }
        }
        var f = Math.pow(0.42, dt); ball.vx *= f; ball.vy *= f;
        if (Math.hypot(ball.vx, ball.vy) < (H - T) * 0.03) { ball.vx = ball.vy = 0; }
        if (!moving && Math.hypot(ball.vx, ball.vy) < 2) {
          if (strokes >= 3) { if (A.live()) { if (A.fail(A.l.fail)) dead = 1; return; } build(false); return; }
          if (A.live()) { clock -= dt; if (clock <= 0) { if (A.fail(A.l.fail2)) dead = 1; return; } }
          if (A.idle()) { aiT += dt; if (aiT > 1.2) { aiT = 0; var a = Math.atan2(hole.y - ball.y, hole.x - ball.x) + rnd(-0.12, 0.12), dd = Math.hypot(hole.y - ball.y, hole.x - ball.x), L = Math.min(W, H - T) * 0.35; putt(Math.cos(a) * L * clamp(dd / (H - T) * 0.9, 0.25, 1), Math.sin(a) * L * clamp(dd / (H - T) * 0.9, 0.25, 1)); } }
        }
      },
      draw: function (c) {
        if (!bg && W) paintBg();
        if (bg) A.bg(bg);
        if (bar) { rr(c, bar.x, bar.y, bar.w, br * 1.6, 4); c.fillStyle = lg(c, 0, bar.y, 0, bar.y + br * 1.6, ['#FCA5A5', '#B91C1C']); c.fill(); }
        if (ball && !sunk && !(gopher && gopher.t > 0.9)) { circ(c, ball.x + 2, ball.y + 3, br, 'rgba(0,0,0,.22)'); circ(c, ball.x, ball.y, br, rg(c, ball.x - br * 0.3, ball.y - br * 0.3, br, ['#FFFFFF', '#F1F5F9', '#94A3B8'])); }
        if (aim && !dead && ball) { var L = Math.min(W, H - T) * 0.35, pw = clamp(Math.hypot(aim.dx, aim.dy) / L, 0, 1), a = Math.atan2(aim.dy, aim.dx); c.strokeStyle = 'rgba(255,255,255,.85)'; c.lineWidth = 2; c.setLineDash([5, 5]); c.beginPath(); c.moveTo(ball.x, ball.y); c.lineTo(ball.x + Math.cos(a) * L * 0.6 * pw, ball.y + Math.sin(a) * L * 0.6 * pw); c.stroke(); c.setLineDash([]); circ(c, ball.x, ball.y, br + 6 + pw * 14, 'rgba(253,230,138,' + (0.15 + pw * 0.25) + ')'); }
        if (gopher) { var gy2 = hole.y - Math.min(1, gopher.t * 3) * hrad * 2.2; c.fillStyle = '#92400E'; c.beginPath(); c.ellipse(hole.x, gy2 + hrad, hrad * 1.1, hrad * 1.4, 0, Math.PI, 0); c.fill(); circ(c, hole.x, gy2, hrad * 1.05, rg(c, hole.x - 3, gy2 - 3, hrad * 1.1, ['#D97706', '#92400E'])); circ(c, hole.x - hrad * 0.4, gy2 - hrad * 0.2, hrad * 0.18, '#111'); circ(c, hole.x + hrad * 0.4, gy2 - hrad * 0.2, hrad * 0.18, '#111'); c.fillStyle = '#FEF3C7'; c.fillRect(hole.x - hrad * 0.2, gy2 + hrad * 0.3, hrad * 0.4, hrad * 0.35); }
        // strokes + shot clock
        for (var i = 0; i < 3; i++) circ(c, cx0 + 14 + i * 16, cy0 + chh + 12, 5, i < strokes ? '#F87171' : 'rgba(255,255,255,.75)');
        if (A.live() && !sunk && ball && Math.hypot(ball.vx, ball.vy) < 2) { var k2 = Math.max(0, clock / clockMax); c.strokeStyle = k2 < 0.3 ? '#F43F5E' : '#FDE68A'; c.lineWidth = 3; c.beginPath(); c.arc(ball.x, ball.y, br + 5, -Math.PI / 2, -Math.PI / 2 + k2 * TAU); c.stroke(); }
      },
      down: function (x, y) { if (dead) return; aim = { x0: x, y0: y, dx: 0, dy: 0 }; },
      move: function (x, y) { if (aim) { aim.dx = aim.x0 - x; aim.dy = aim.y0 - y; } },
      up: function () { if (!aim) return; var a = aim; aim = null; if (Math.hypot(a.dx, a.dy) > 10) putt(a.dx, a.dy); },
      key: function (k) { var L = Math.min(W, H - T) * 0.2; putt(k === 'left' ? -L : k === 'right' ? L : 0, k === 'up' ? -L : k === 'down' ? L : 0); },
      boom: function () { gopher = { t: 0 }; aim = null; ball.vx = ball.vy = 0; },
      win: function () { won = 0.001; aim = null; A.burst(ball.x, ball.y, 16, ['#FDE68A', '#FFFFFF'], 150, 0.6, 3); },
      dbg: function () { return { ball: ball, hole: hole, br: br, hrad: hrad, walls: walls, bar: bar, strokes: strokes, clock: clock, dead: dead, holeN: holeN }; }
    };
  }, 'drag', 0.62);

  /* ================================================================== 24. SKI SLALOM — the skier carves toward your finger: pass between
     the two flags of every gate, avoid trees and rocks. The slope gets steeper and faster. */
  boot('skislalom', function (A) {
    var W, H, T, dpr, bg, sy, sx, tx, ang = 0, sp = 0, objs = [], dist = 0, nextG = 0, gateSide = 0, dead = 0, won = 0, aval = null, t = 0, drag = null, spray = [], trees = [], gates = 0, sz, treeS, rockS;
    function addRow(live) {
      var lv = live ? A.lv() : 0.2, y = H + sz * 2, gw = W * Math.max(0.22, 0.42 - 0.18 * lv), gx = clamp(W / 2 + rnd(-W * 0.3, W * 0.3), gw / 2 + 10, W - gw / 2 - 10);
      gateSide ^= 1; objs.push({ k: 'gate', x: gx, w: gw, y: y, c: gateSide ? '#EF4444' : '#2563EB', done: 0 });
      var n = 1 + Math.round(2 * lv + Math.random());
      for (var i = 0; i < n; i++) { var ox = rnd(sz, W - sz); if (Math.abs(ox - gx) < gw / 2 + sz * 1.2) continue; objs.push({ k: Math.random() < 0.7 ? 'tree' : 'rock', x: ox, y: y + rnd(-sz * 3, sz * 3) }); }
      nextG = (H - T) * rnd(0.4, 0.55) * (1 - 0.15 * lv);
    }
    return {
      size: function (w, h, uu, d, top) {
        W = w; H = h; dpr = d; T = top; sz = clamp(Math.min(W, H - T) * 0.07, 20, 44); sy = T + (H - T) * 0.25; if (!sx) { sx = W / 2; tx = sx; }
        treeS = mkc(sz * 2.4, sz * 3, dpr, function (c, w2, h2) { c.translate(w2 / 2, h2); c.fillStyle = '#5C4033'; c.fillRect(-sz * 0.12, -sz * 0.5, sz * 0.24, sz * 0.5); for (var i = 0; i < 3; i++) { var yy = -sz * 0.4 - i * sz * 0.7, ww = sz * (1.1 - i * 0.28); c.fillStyle = lg(c, -ww, 0, ww, 0, ['#14532D', '#16A34A', '#14532D']); c.beginPath(); c.moveTo(-ww, yy); c.lineTo(0, yy - sz * 1.0); c.lineTo(ww, yy); c.fill(); c.fillStyle = 'rgba(255,255,255,.85)'; c.beginPath(); c.moveTo(-ww * 0.5, yy - sz * 0.45); c.lineTo(0, yy - sz * 1.0); c.lineTo(ww * 0.4, yy - sz * 0.55); c.quadraticCurveTo(0, yy - sz * 0.4, -ww * 0.5, yy - sz * 0.45); c.fill(); } });
        rockS = mkc(sz * 1.8, sz * 1.2, dpr, function (c, w2, h2) { c.translate(w2 / 2, h2); poly(c, [-sz * 0.85, 0, -sz * 0.6, -sz * 0.7, 0, -sz * 1.0, sz * 0.7, -sz * 0.6, sz * 0.85, 0], lg(c, 0, -sz, 0, 0, ['#D6D3D1', '#78716C', '#44403C'])); c.fillStyle = 'rgba(255,255,255,.9)'; c.beginPath(); c.ellipse(-sz * 0.1, -sz * 0.9, sz * 0.4, sz * 0.14, -0.2, 0, TAU); c.fill(); });
        bg = mkc(W, H, dpr, function (c) { c.fillStyle = lg(c, 0, 0, W, H, ['#F8FAFC', '#E2E8F0', '#CBD5E1']); c.fillRect(0, 0, W, H); c.fillStyle = 'rgba(148,163,184,.12)'; for (var i = 0; i < 60; i++) { c.beginPath(); c.ellipse(rnd(0, W), rnd(0, H), rnd(10, 40), rnd(2, 5), -0.1, 0, TAU); c.fill(); } });
      },
      reset: function (live) { objs = []; dist = 0; nextG = 0; for (var k = 0; k < 6; k++) objs.push({ k: Math.random() < 0.75 ? 'tree' : 'rock', x: Math.random() < 0.5 ? rnd(sz, W * 0.22) : rnd(W * 0.78, W - sz), y: T + (H - T) * (0.15 + k * 0.17) }); void live; dead = 0; won = 0; aval = null; sx = W / 2; tx = sx; ang = 0; spray = []; trees = []; gates = 0; drag = null; },
      step: function (dt, live) {
        t += dt; var lv = live ? A.lv() : 0.2, i, o;
        if (aval) { aval.t += dt; aval.y += (H - T) * 0.9 * dt; if (!aval.hit && aval.y > sy) { aval.hit = 1; dead = 1; A.burst(sx, sy, 24, ['#FFFFFF', '#E2E8F0'], 220, 0.8, 4); A.shake(0.5); } return; }
        if (dead || won) { sp *= Math.max(0, 1 - dt * 3); }
        else sp = (H - T) * (0.5 + 0.5 * lv) * (1 - Math.abs(ang) * 0.35);
        if (A.idle() && !dead) { var g = objs.filter(function (q) { return q.k === 'gate' && !q.done && q.y > sy; }).sort(function (a, b) { return a.y - b.y; })[0]; tx = g ? g.x : W / 2; }
        if (!dead) { var want = clamp((tx - sx) / (W * 0.25), -1, 1) * 1.05; ang += (want - ang) * Math.min(1, dt * 5); sx = clamp(sx + Math.sin(ang) * (H - T) * 0.9 * dt, sz, W - sz); }
        if (!A.lite && Math.abs(ang) > 0.35 && !dead) spray.push({ x: sx - Math.sin(ang) * sz * 0.3, y: sy + sz * 0.5, vx: -Math.sin(ang) * 60 + rnd(-20, 20), vy: -rnd(10, 50), t: 0 });
        for (i = spray.length - 1; i >= 0; i--) { var s = spray[i]; s.t += dt; s.x += s.vx * dt; s.y += (s.vy - sp) * dt; if (s.t > 0.5) spray.splice(i, 1); } if (spray.length > 40) spray.splice(0, spray.length - 40);
        dist += sp * dt; nextG -= sp * dt; if (nextG <= 0 && !won) addRow(live);
        for (i = objs.length - 1; i >= 0; i--) {
          o = objs[i]; o.y -= sp * dt;
          if (o.y < T - sz * 4) { objs.splice(i, 1); continue; }
          if (dead) continue;
          if (o.k === 'gate' && !o.done && o.y <= sy) { o.done = 1; if (Math.abs(sx - o.x) < o.w / 2 - sz * 0.15) { gates++; A.burst(o.x, sy, 6, [o.c, '#fff'], 100, 0.4, 2.4, 0); } else { if (A.live()) { if (A.fail(A.l.fail2)) { dead = 1; } } } }
          if (o.k === 'gate') { for (var q = -1; q <= 1; q += 2) { var fx = o.x + q * o.w / 2; if (Math.abs(sx - fx) < sz * 0.3 && Math.abs(sy - o.y) < sz * 0.4 && A.live()) { if (A.fail(A.l.fail)) dead = 1; } } }
          else if (Math.abs(sx - o.x) < sz * (o.k === 'tree' ? 0.45 : 0.6) && o.y - sy < sz * 0.3 && o.y - sy > -sz * 0.5) { if (A.live()) { if (A.fail(A.l.fail)) { dead = 1; A.burst(sx, sy, 16, ['#FFFFFF', '#E2E8F0', '#1D4ED8'], 180, 0.6, 3); A.shake(0.3); } } }
        }
      },
      draw: function (c) {
        A.bg(bg);
        var i, o, off = dist % 40;
        c.strokeStyle = 'rgba(148,163,184,.25)'; c.lineWidth = 1; for (i = 0; i < 6; i++) { var yy = T + ((i * 90 - dist * 1) % (H - T + 90) + (H - T + 90)) % (H - T + 90); c.beginPath(); c.moveTo(0, yy); c.quadraticCurveTo(W / 2, yy - 20, W, yy); c.stroke(); } void off;
        var list = objs.slice().sort(function (a, b) { return a.y - b.y; }), drawn = false;
        // v3046 (propriétaire : le skieur « descendait » bizarrement) : skieur vu de face, qui file vers le bas de la pente (vers nous) :
        // skis vers le bas, corps droit, tête casquée + masque en haut — dessin seulement, mêmes position, collisions et virages
        var skier = function () {
          var u = sz;
          c.save(); c.translate(sx, sy); c.rotate(-ang * 0.55);
          c.fillStyle = 'rgba(15,23,42,.13)'; c.beginPath(); c.ellipse(0, u * 0.62, u * 0.5, u * 0.14, 0, 0, TAU); c.fill();
          c.lineCap = 'round';
          [-1, 1].forEach(function (q) { // skis (pointes vers le bas = vers la descente)
            c.strokeStyle = '#1D4ED8'; c.lineWidth = u * 0.11; c.beginPath(); c.moveTo(q * u * 0.19, -u * 0.25); c.lineTo(q * u * 0.21, u * 0.7); c.stroke();
            c.strokeStyle = '#93C5FD'; c.lineWidth = u * 0.05; c.beginPath(); c.moveTo(q * u * 0.21, u * 0.55); c.lineTo(q * u * 0.22, u * 0.74); c.stroke();
          });
          c.strokeStyle = '#94A3B8'; c.lineWidth = u * 0.045; c.beginPath(); c.moveTo(-u * 0.46, -u * 0.22); c.lineTo(-u * 0.6, u * 0.42); c.moveTo(u * 0.46, -u * 0.22); c.lineTo(u * 0.6, u * 0.42); c.stroke(); // bâtons
          c.strokeStyle = '#1E3A8A'; c.lineWidth = u * 0.17; c.beginPath(); c.moveTo(-u * 0.13, -u * 0.2); c.lineTo(-u * 0.19, u * 0.02); c.lineTo(-u * 0.19, u * 0.16); c.moveTo(u * 0.13, -u * 0.2); c.lineTo(u * 0.19, u * 0.02); c.lineTo(u * 0.19, u * 0.16); c.stroke(); // jambes fléchies
          c.fillStyle = '#111827'; rr(c, -u * 0.28, u * 0.12, u * 0.18, u * 0.13, u * 0.04); c.fill(); rr(c, u * 0.1, u * 0.12, u * 0.18, u * 0.13, u * 0.04); c.fill(); // chaussures
          c.fillStyle = lg(c, -u * 0.32, 0, u * 0.32, 0, ['#991B1B', '#EF4444', '#B91C1C']); rr(c, -u * 0.31, -u * 0.68, u * 0.62, u * 0.52, u * 0.18); c.fill(); // veste
          c.fillStyle = '#F8FAFC'; c.fillRect(-u * 0.31, -u * 0.44, u * 0.62, u * 0.06);
          c.strokeStyle = '#DC2626'; c.lineWidth = u * 0.13; c.beginPath(); c.moveTo(-u * 0.27, -u * 0.6); c.lineTo(-u * 0.42, -u * 0.38); c.lineTo(-u * 0.46, -u * 0.22); c.moveTo(u * 0.27, -u * 0.6); c.lineTo(u * 0.42, -u * 0.38); c.lineTo(u * 0.46, -u * 0.22); c.stroke(); // bras
          circ(c, -u * 0.46, -u * 0.22, u * 0.07, '#1F2937'); circ(c, u * 0.46, -u * 0.22, u * 0.07, '#1F2937'); // gants
          circ(c, 0, -u * 0.86, u * 0.21, rg(c, -u * 0.06, -u * 0.9, u * 0.24, ['#FFEDE2', '#F8D9C2', '#E6B996'])); // visage (peau claire)
          c.fillStyle = lg(c, 0, -u * 1.1, 0, -u * 0.86, ['#FDE68A', '#F59E0B']); c.beginPath(); c.arc(0, -u * 0.88, u * 0.235, Math.PI, TAU); c.fill(); // casque
          c.fillStyle = '#0F172A'; rr(c, -u * 0.2, -u * 0.9, u * 0.4, u * 0.11, u * 0.05); c.fill(); // masque
          c.fillStyle = lg(c, -u * 0.17, 0, u * 0.17, 0, ['#FB923C', '#FDE047', '#38BDF8']); rr(c, -u * 0.17, -u * 0.885, u * 0.34, u * 0.08, u * 0.04); c.fill();
          c.fillStyle = '#E11D48'; c.beginPath(); c.ellipse(0, -u * 0.72, u * 0.05, u * 0.025, 0, 0, TAU); c.fill(); // sourire
          c.restore();
        };
        for (i = 0; i < list.length; i++) {
          o = list[i];
          if (!drawn && o.y > sy) { if (!dead || !aval) skier(); drawn = true; }
          if (o.k === 'tree') c.drawImage(treeS, o.x - sz * 1.2, o.y - sz * 3, sz * 2.4, sz * 3);
          else if (o.k === 'rock') c.drawImage(rockS, o.x - sz * 0.9, o.y - sz * 1.2, sz * 1.8, sz * 1.2);
          else { for (var q = -1; q <= 1; q += 2) { var fx = o.x + q * o.w / 2; c.strokeStyle = '#334155'; c.lineWidth = 2; c.beginPath(); c.moveTo(fx, o.y); c.lineTo(fx, o.y - sz * 1.3); c.stroke(); c.fillStyle = o.c; c.beginPath(); c.moveTo(fx, o.y - sz * 1.3); c.lineTo(fx - q * sz * 0.7, o.y - sz * 1.05); c.lineTo(fx, o.y - sz * 0.8); c.fill(); } if (!o.done) { c.strokeStyle = 'rgba(100,116,139,.25)'; c.setLineDash([4, 6]); c.beginPath(); c.moveTo(o.x - o.w / 2, o.y); c.lineTo(o.x + o.w / 2, o.y); c.stroke(); c.setLineDash([]); } }
        }
        if (!drawn && (!dead || !aval)) skier();
        for (i = 0; i < spray.length; i++) { c.globalAlpha = 1 - spray[i].t / 0.5; circ(c, spray[i].x, spray[i].y, 2.5, '#FFFFFF'); } c.globalAlpha = 1;
        if (aval) { c.fillStyle = lg(c, 0, aval.y - (H - T) * 0.4, 0, aval.y, ['rgba(255,255,255,0)', '#FFFFFF']); c.fillRect(0, T, W, aval.y - T); for (i = 0; i < 8; i++) circ(c, (i + 0.5) * W / 8, aval.y, W / 10, '#F8FAFC'); }
      },
      down: function (x) { drag = { x: x, s: tx }; },
      move: function (x) { if (drag && !dead) tx = clamp(drag.s + (x - drag.x) * 1.4, 0, W); },
      up: function () { drag = null; },
      key: function (k) { if (k === 'left') tx = Math.max(0, tx - W * 0.15); else if (k === 'right') tx = Math.min(W, tx + W * 0.15); },
      boom: function () { aval = { t: 0, y: T - (H - T) * 0.3 }; drag = null; A.shake(0.2); },
      win: function () { won = 0.001; drag = null; A.burst(sx, sy, 16, ['#FDE68A', '#EF4444', '#2563EB'], 150, 0.6, 3); },
      dbg: function () { return { sx: sx, sy: sy, ang: ang, sz: sz, objs: objs.map(function (o) { return [o.k, o.x | 0, o.y | 0, o.w | 0, o.done ? 1 : 0]; }), dead: dead, gates: gates }; }
    };
  }, 'drag', 0.62);
})(window.D6 = window.D6 || {});
