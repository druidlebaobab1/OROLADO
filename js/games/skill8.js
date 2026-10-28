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
    },
    roadrace: {
      en: ['Drag to steer your car', 'Crash!', 'Pile-up!', 'Drag left or right to steer your car and weave through the oncoming traffic. The road gets faster and busier. Hitting another car ends the round.'],
      fr: ['Glisse pour conduire ta voiture', 'Accident !', 'Carambolage !', 'Glisse à gauche ou à droite pour conduire ta voiture et te faufiler dans la circulation. La route devient plus rapide et plus chargée. Toucher une autre voiture termine la partie.'],
      es: ['Desliza para conducir tu coche', '¡Choque!', '¡Accidente múltiple!', 'Desliza a la izquierda o derecha para conducir tu coche y esquivar el tráfico. La carretera se vuelve más rápida y concurrida. Chocar con otro coche termina la ronda.'],
      pt: ['Deslize para dirigir seu carro', 'Batida!', 'Engavetamento!', 'Deslize para a esquerda ou direita para dirigir seu carro e desviar do trânsito. A estrada fica mais rápida e cheia. Bater em outro carro encerra a rodada.'],
      ar: ['اسحب لقيادة سيارتك', 'تحطّم!', 'حادث متسلسل!', 'اسحب يسارًا أو يمينًا لقيادة سيارتك والتفافها بين السيارات القادمة. يصبح الطريق أسرع وأكثر ازدحامًا. اصطدامك بسيارة أخرى ينهي الجولة.'],
      tr: ['Arabanı sürmek için kaydır', 'Kaza!', 'Zincirleme kaza!', 'Arabanı sürüp gelen trafiğin arasından geçmek için sola ya da sağa kaydır. Yol hızlanır ve kalabalıklaşır. Başka bir arabaya çarpmak turu bitirir.'],
      vi: ['Kéo để lái xe', 'Tông rồi!', 'Dồn toa!', 'Kéo trái hoặc phải để lái xe và luồn lách qua dòng xe ngược chiều. Đường ngày càng nhanh và đông. Đâm vào xe khác là kết thúc ván.'],
      id: ['Geser untuk menyetir mobilmu', 'Tabrakan!', 'Tabrakan beruntun!', 'Geser ke kiri atau kanan untuk menyetir mobilmu dan menyalip lalu lintas. Jalan makin cepat dan ramai. Menabrak mobil lain mengakhiri ronde.'],
      ru: ['Веди — рули машиной', 'Авария!', 'Массовое ДТП!', 'Веди влево или вправо, чтобы рулить машиной и лавировать в потоке встречных. Дорога становится быстрее и плотнее. Столкновение с другой машиной завершает раунд.'],
      de: ['Ziehen, um zu lenken', 'Crash!', 'Massenkarambolage!', 'Ziehe nach links oder rechts, um dein Auto zu lenken und durch den Gegenverkehr zu schlängeln. Die Straße wird schneller und voller. Ein Zusammenstoß beendet die Runde.'],
      hi: ['कार चलाने को खींचें', 'टक्कर!', 'भिड़ंत!', 'अपनी कार चलाने और आती ट्रैफ़िक से बचने के लिए बाएँ या दाएँ खींचें। सड़क तेज़ और व्यस्त होती जाती है। दूसरी कार से टकराना राउंड खत्म कर देता है।'],
      zh: ['拖动驾驶你的车', '撞车了！', '连环追尾！', '左右拖动驾驶你的车，在迎面车流中穿梭。道路会越来越快、越来越挤。撞到别的车，本回合结束。']
    },
    airraid: {
      en: ['Tap a plane to shoot it', 'Base destroyed!', 'Carpet bombing!', 'Tap the enemy planes to shoot them down before they reach your base at the bottom. They come faster and in greater numbers. A plane reaching your base ends the round.'],
      fr: ['Touche un avion pour tirer', 'Base détruite !', 'Bombardement !', 'Touche les avions ennemis pour les abattre avant qu’ils atteignent ta base en bas. Ils arrivent plus vite et plus nombreux. Un avion qui atteint ta base termine la partie.'],
      es: ['Toca un avión para disparar', '¡Base destruida!', '¡Bombardeo!', 'Toca los aviones enemigos para derribarlos antes de que lleguen a tu base abajo. Vienen más rápido y en mayor número. Un avión que llega a tu base termina la ronda.'],
      pt: ['Toque num avião para atirar', 'Base destruída!', 'Bombardeio!', 'Toque nos aviões inimigos para abatê-los antes que cheguem à sua base embaixo. Vêm mais rápido e em maior número. Um avião que chega à base encerra a rodada.'],
      ar: ['المس طائرة لإطلاق النار', 'دُمّرت القاعدة!', 'قصف مكثّف!', 'المس طائرات العدو لإسقاطها قبل أن تصل إلى قاعدتك في الأسفل. تأتي أسرع وأكثر عددًا. طائرة تصل إلى قاعدتك تنهي الجولة.'],
      tr: ['Vurmak için uçağa dokun', 'Üs yok edildi!', 'Halı bombardımanı!', 'Düşman uçaklarını, alttaki üssüne ulaşmadan vurmak için dokun. Daha hızlı ve kalabalık gelirler. Üsse ulaşan bir uçak turu bitirir.'],
      vi: ['Chạm vào máy bay để bắn', 'Căn cứ bị phá!', 'Rải bom!', 'Chạm vào máy bay địch để bắn hạ trước khi chúng tới căn cứ ở dưới. Chúng đến nhanh và đông hơn. Một máy bay tới căn cứ là kết thúc ván.'],
      id: ['Ketuk pesawat untuk menembak', 'Markas hancur!', 'Pengeboman!', 'Ketuk pesawat musuh untuk menembaknya sebelum mencapai markasmu di bawah. Mereka datang lebih cepat dan banyak. Satu pesawat mencapai markas mengakhiri ronde.'],
      ru: ['Коснись самолёта, чтобы сбить', 'База уничтожена!', 'Ковровая бомбёжка!', 'Касайся вражеских самолётов, чтобы сбивать их, пока они не достигли базы внизу. Они летят быстрее и их больше. Самолёт, долетевший до базы, завершает раунд.'],
      de: ['Tippe ein Flugzeug an zum Schuss', 'Basis zerstört!', 'Flächenbombardement!', 'Tippe die feindlichen Flugzeuge an, um sie abzuschießen, bevor sie deine Basis unten erreichen. Sie kommen schneller und zahlreicher. Ein Flugzeug an der Basis beendet die Runde.'],
      hi: ['गोली चलाने को विमान छुएं', 'बेस तबाह!', 'कालीन बमबारी!', 'दुश्मन विमानों को नीचे अपने बेस तक पहुँचने से पहले मार गिराने के लिए उन्हें छुएं। वे तेज़ और ज़्यादा आते हैं। बेस तक पहुँचा विमान राउंड खत्म कर देता है।'],
      zh: ['点击飞机开火', '基地被毁！', '地毯式轰炸！', '点击敌机，在它们抵达下方基地前将其击落。它们会越来越快、越来越多。一架飞机抵达基地，本回合结束。']
    },
    cupidaim: {
      en: ['Tap a heart to shoot an arrow', 'A heart got away!', 'Heartbreak!', 'You are Cupid at the bottom: tap a floating heart to fire an arrow and match it into a couple. The hearts drift by faster and in greater numbers. A heart that floats off the top of the screen unmatched ends the round.'],
      fr: ['Touche un cœur pour tirer une flèche', 'Un cœur s’est échappé !', 'Chagrin d’amour !', 'Tu es Cupidon en bas : touche un cœur qui flotte pour tirer une flèche et former un couple. Les cœurs passent de plus en plus vite et nombreux. Un cœur qui s’envole en haut de l’écran sans couple termine la partie.'],
      es: ['Toca un corazón para lanzar una flecha', '¡Se escapó un corazón!', '¡Desamor!', 'Eres Cupido abajo: toca un corazón flotante para lanzar una flecha y formar una pareja. Los corazones pasan más rápido y en mayor número. Un corazón que se va por arriba sin pareja termina la ronda.'],
      pt: ['Toque num coração para lançar a flecha', 'Um coração escapou!', 'Desgosto!', 'Você é o Cupido embaixo: toque num coração flutuante para lançar uma flecha e formar um casal. Os corações passam mais rápido e em maior número. Um coração que sobe para fora da tela sem par encerra a rodada.'],
      ar: ['المس قلبًا لإطلاق سهم', 'أفلت قلب!', 'انكسار القلب!', 'أنت كيوبيد في الأسفل: المس قلبًا عائمًا لإطلاق سهم وتكوين ثنائي. تمرّ القلوب أسرع وأكثر عددًا. قلب يطير خارج أعلى الشاشة دون شريك ينهي الجولة.'],
      tr: ['Ok atmak için bir kalbe dokun', 'Bir kalp kaçtı!', 'Kalp kırıklığı!', 'Altta Cupid sensin: ok atıp çift oluşturmak için uçuşan bir kalbe dokun. Kalpler daha hızlı ve kalabalık geçer. Ekranın üstünden eşsiz uçup giden bir kalp turu bitirir.'],
      vi: ['Chạm vào trái tim để bắn mũi tên', 'Một trái tim bay mất!', 'Tan vỡ!', 'Bạn là thần Cupid ở dưới: chạm vào trái tim đang trôi để bắn mũi tên và ghép thành đôi. Các trái tim trôi qua nhanh và đông hơn. Một trái tim bay khỏi màn hình mà chưa có đôi là kết thúc ván.'],
      id: ['Ketuk hati untuk menembak panah', 'Satu hati lolos!', 'Patah hati!', 'Kamu adalah Cupid di bawah: ketuk hati melayang untuk menembakkan panah dan menjodohkannya. Hati-hati itu lewat makin cepat dan banyak. Satu hati yang melayang keluar layar tanpa pasangan mengakhiri ronde.'],
      ru: ['Коснись сердца — выпусти стрелу', 'Сердце ускользнуло!', 'Разбитое сердце!', 'Ты Купидон внизу: коснись парящего сердца, чтобы выпустить стрелу и создать пару. Сердца летят всё быстрее и их больше. Сердце, улетевшее за верх экрана без пары, завершает раунд.'],
      de: ['Tippe ein Herz an für einen Pfeil', 'Ein Herz ist entwischt!', 'Liebeskummer!', 'Du bist Amor unten: tippe ein schwebendes Herz an, um einen Pfeil zu schießen und ein Paar zu bilden. Die Herzen ziehen schneller und zahlreicher vorbei. Ein Herz, das oben ohne Partner aus dem Bild schwebt, beendet die Runde.'],
      hi: ['तीर चलाने को दिल छुएं', 'एक दिल निकल गया!', 'दिल टूटा!', 'नीचे आप कामदेव हैं: तैरते दिल को छूकर तीर चलाएँ और जोड़ी बनाएँ। दिल तेज़ और ज़्यादा संख्या में गुज़रते हैं। बिना जोड़ी स्क्रीन के ऊपर से निकल गया दिल राउंड खत्म कर देता है।'],
      zh: ['点击爱心射出丘比特之箭', '一颗心飞走了！', '心碎！', '你是下方的丘比特：点击飘动的爱心射出箭，把它们配成一对。爱心会越来越快、越来越多地飘过。一颗爱心没配对就飘出屏幕上方，本回合结束。']
    },
    lovecatch: {
      en: ['Drag to catch the hearts', 'Heart missed!', 'The date is over!', 'Drag left or right to move your basket and catch the falling roses and hearts your sweetheart tosses from the balcony. Dodge the broken hearts. It gets faster and busier. Missing a heart — or catching a broken one — ends the round.', 'Caught a broken heart!'],
      fr: ['Glisse pour attraper les cœurs', 'Cœur raté !', 'Le rendez-vous est fini !', 'Glisse à gauche ou à droite pour bouger ton panier et attraper les roses et les cœurs que ta belle lance du balcon. Évite les cœurs brisés. Ça devient plus rapide et plus chargé. Rater un cœur — ou attraper un cœur brisé — termine la partie.', 'Cœur brisé attrapé !'],
      es: ['Desliza para atrapar los corazones', '¡Corazón perdido!', '¡Se acabó la cita!', 'Desliza a izquierda o derecha para mover tu cesta y atrapar las rosas y corazones que tu amor lanza desde el balcón. Esquiva los corazones rotos. Se vuelve más rápido y concurrido. Fallar un corazón — o atrapar uno roto — termina la ronda.', '¡Atrapaste un corazón roto!'],
      pt: ['Deslize para pegar os corações', 'Coração perdido!', 'O encontro acabou!', 'Deslize para a esquerda ou direita para mover sua cesta e pegar as rosas e corações que seu amor joga da sacada. Desvie dos corações partidos. Fica mais rápido e cheio. Perder um coração — ou pegar um partido — encerra a rodada.', 'Pegou um coração partido!'],
      ar: ['اسحب لالتقاط القلوب', 'فاتك قلب!', 'انتهى الموعد!', 'اسحب يسارًا أو يمينًا لتحريك سلتك والتقاط الورود والقلوب التي يرميها حبيبك من الشرفة. تفادَ القلوب المكسورة. يصبح أسرع وأكثر ازدحامًا. تفويت قلب — أو التقاط قلب مكسور — ينهي الجولة.', 'التقطت قلبًا مكسورًا!'],
      tr: ['Kalpleri yakalamak için kaydır', 'Kalp kaçtı!', 'Buluşma bitti!', 'Sevgilinin balkondan attığı gülleri ve kalpleri yakalamak için sepetini sola ya da sağa kaydır. Kırık kalplerden kaç. Daha hızlı ve kalabalık olur. Bir kalbi kaçırmak — ya da kırık bir kalbi yakalamak — turu bitirir.', 'Kırık kalp yakaladın!'],
      vi: ['Kéo để hứng những trái tim', 'Hụt tim rồi!', 'Buổi hẹn kết thúc!', 'Kéo trái hoặc phải để di chuyển giỏ và hứng hoa hồng cùng trái tim mà người thương ném xuống từ ban công. Né những trái tim tan vỡ. Trò chơi nhanh và đông dần. Hụt một trái tim — hoặc hứng phải trái tim vỡ — là kết thúc ván.', 'Hứng phải trái tim vỡ!'],
      id: ['Geser untuk menangkap hati', 'Hati terlewat!', 'Kencan selesai!', 'Geser ke kiri atau kanan untuk menggerakkan keranjangmu dan menangkap mawar serta hati yang dilempar kekasihmu dari balkon. Hindari hati yang patah. Makin cepat dan ramai. Melewatkan hati — atau menangkap yang patah — mengakhiri ronde.', 'Menangkap hati yang patah!'],
      ru: ['Веди, чтобы ловить сердца', 'Сердце упущено!', 'Свидание окончено!', 'Веди влево или вправо, чтобы двигать корзину и ловить розы и сердца, что любимая бросает с балкона. Уклоняйся от разбитых сердец. Становится быстрее и плотнее. Упустить сердце — или поймать разбитое — завершает раунд.', 'Поймал разбитое сердце!'],
      de: ['Ziehen, um die Herzen zu fangen', 'Herz verpasst!', 'Das Date ist vorbei!', 'Ziehe nach links oder rechts, um deinen Korb zu bewegen und die Rosen und Herzen zu fangen, die dein Schatz vom Balkon wirft. Weiche den gebrochenen Herzen aus. Es wird schneller und voller. Ein Herz zu verpassen — oder ein gebrochenes zu fangen — beendet die Runde.', 'Ein gebrochenes Herz gefangen!'],
      hi: ['दिल पकड़ने को खींचें', 'दिल छूट गया!', 'मुलाक़ात खत्म!', 'अपनी टोकरी चलाने और बालकनी से आपके प्यार द्वारा फेंके गुलाब व दिल पकड़ने के लिए बाएँ या दाएँ खींचें। टूटे दिलों से बचें। यह तेज़ और व्यस्त होता जाता है। दिल चूकना — या टूटा दिल पकड़ना — राउंड खत्म कर देता है।', 'टूटा दिल पकड़ लिया!'],
      zh: ['拖动接住爱心', '漏接了爱心！', '约会结束！', '左右拖动移动你的花篮，接住心上人从阳台抛下的玫瑰和爱心。躲开破碎的心。节奏会越来越快、越来越密。漏接一颗心——或接到破碎的心——本回合结束。', '接到了破碎的心！']
    },
    grenade: {
      en: ['Tap to throw a grenade', 'They broke through!', 'Artillery barrage!', 'You hold the trench on the left: tap where to lob a grenade — it explodes where it lands and clears the soldiers nearby. They advance faster and in greater numbers. A soldier reaching your trench ends the round.'],
      fr: ['Touche pour lancer une grenade', 'Ils ont percé !', 'Tir d’artillerie !', 'Tu tiens la tranchée à gauche : touche où lancer une grenade — elle explose là où elle tombe et élimine les soldats autour. Ils avancent plus vite et plus nombreux. Un soldat qui atteint ta tranchée termine la partie.'],
      es: ['Toca para lanzar una granada', '¡Rompieron la línea!', '¡Bombardeo de artillería!', 'Defiendes la trinchera a la izquierda: toca dónde lanzar una granada — explota donde cae y elimina a los soldados cercanos. Avanzan más rápido y en mayor número. Un soldado que llega a tu trinchera termina la ronda.'],
      pt: ['Toque para lançar uma granada', 'Eles romperam!', 'Bombardeio de artilharia!', 'Você defende a trincheira à esquerda: toque onde lançar uma granada — ela explode onde cai e elimina os soldados por perto. Eles avançam mais rápido e em maior número. Um soldado que chega à sua trincheira encerra a rodada.'],
      ar: ['المس لرمي قنبلة يدوية', 'لقد اخترقوا الخط!', 'قصف مدفعي!', 'تدافع عن الخندق على اليسار: المس مكان رمي القنبلة — تنفجر حيث تسقط وتقضي على الجنود القريبين. يتقدمون أسرع وأكثر عددًا. جندي يصل إلى خندقك ينهي الجولة.'],
      tr: ['El bombası atmak için dokun', 'Hattı yardılar!', 'Topçu bombardımanı!', 'Soldaki siperi tutuyorsun: el bombasını nereye atacağına dokun — düştüğü yerde patlar ve yakındaki askerleri temizler. Daha hızlı ve kalabalık ilerlerler. Siperine ulaşan bir asker turu bitirir.'],
      vi: ['Chạm để ném lựu đạn', 'Chúng chọc thủng rồi!', 'Pháo kích!', 'Bạn giữ chiến hào bên trái: chạm vào nơi muốn ném lựu đạn — nó nổ ở chỗ rơi và hạ các lính gần đó. Chúng tiến nhanh và đông hơn. Một người lính tới chiến hào của bạn là kết thúc ván.'],
      id: ['Ketuk untuk melempar granat', 'Mereka menerobos!', 'Gempuran artileri!', 'Kamu menjaga parit di kiri: ketuk tempat melempar granat — meledak di tempat jatuh dan melumpuhkan tentara di dekatnya. Mereka maju makin cepat dan banyak. Satu tentara mencapai paritmu mengakhiri ronde.'],
      ru: ['Коснись, чтобы бросить гранату', 'Они прорвались!', 'Артобстрел!', 'Ты держишь окоп слева: коснись, куда бросить гранату — она взрывается там, где падает, и сметает солдат рядом. Они идут всё быстрее и их больше. Солдат, дошедший до окопа, завершает раунд.'],
      de: ['Tippen, um eine Granate zu werfen', 'Sie sind durchgebrochen!', 'Artilleriefeuer!', 'Du hältst den Graben links: tippe, wohin du eine Granate wirfst — sie explodiert, wo sie landet, und räumt die Soldaten in der Nähe. Sie rücken schneller und zahlreicher vor. Ein Soldat, der deinen Graben erreicht, beendet die Runde.'],
      hi: ['ग्रेनेड फेंकने को छुएं', 'वे घुस आए!', 'तोपखाने की बमबारी!', 'आप बाईं ओर खाई संभालते हैं: जहाँ ग्रेनेड फेंकना है वहाँ छुएं — जहाँ गिरता है वहाँ फटता है और पास के सैनिकों को साफ़ करता है। वे तेज़ और ज़्यादा संख्या में बढ़ते हैं। खाई तक पहुँचा सैनिक राउंड खत्म कर देता है।'],
      zh: ['点击投掷手榴弹', '他们突破了！', '炮火覆盖！', '你守着左侧战壕：点击投掷手榴弹的位置——它落地处爆炸，清除附近的士兵。他们会越来越快、越来越多地逼近。一名士兵冲到你的战壕，本回合结束。']
    },
    canyon: {
      en: ['Tap to fly up', 'Crashed into the rocks!', 'Rockslide!', 'Tap to make your jet climb; let go and it dives. Fly through the gaps in the canyon walls without touching the rock. It gets faster and the gaps get tighter. Hitting the rock ends the round.'],
      fr: ['Touche pour monter', 'Écrasé sur les rochers !', 'Éboulement !', 'Touche pour faire monter ton jet ; relâche et il plonge. Passe par les trous dans les parois du canyon sans toucher la roche. Ça accélère et les trous se resserrent. Toucher la roche termine la partie.'],
      es: ['Toca para subir', '¡Te estrellaste en las rocas!', '¡Desprendimiento!', 'Toca para que tu jet suba; suelta y baja en picado. Pasa por los huecos de las paredes del cañón sin tocar la roca. Se vuelve más rápido y los huecos se estrechan. Tocar la roca termina la ronda.'],
      pt: ['Toque para subir', 'Bateu nas rochas!', 'Deslizamento de rochas!', 'Toque para seu jato subir; solte e ele mergulha. Passe pelos vãos das paredes do cânion sem tocar na rocha. Fica mais rápido e os vãos apertam. Tocar na rocha encerra a rodada.'],
      ar: ['المس للصعود', 'اصطدمت بالصخور!', 'انهيار صخري!', 'المس ليصعد طائرتك؛ اترك فيهبط. مُرّ عبر الفجوات في جدران الوادي دون لمس الصخر. يصبح أسرع وتضيق الفجوات. لمس الصخر ينهي الجولة.'],
      tr: ['Yükselmek için dokun', 'Kayalara çarptın!', 'Kaya kayması!', 'Jetinin yükselmesi için dokun; bırak, dalışa geçer. Kayaya değmeden kanyon duvarlarındaki boşluklardan geç. Hızlanır ve boşluklar daralır. Kayaya çarpmak turu bitirir.'],
      vi: ['Chạm để bay lên', 'Đâm vào vách đá!', 'Lở đá!', 'Chạm để phản lực bay lên; thả ra nó lao xuống. Bay qua các khe hở trên vách hẻm núi mà không chạm đá. Tốc độ tăng và khe hẹp dần. Chạm vào đá là kết thúc ván.'],
      id: ['Ketuk untuk naik', 'Menabrak bebatuan!', 'Longsor batu!', 'Ketuk agar jetmu naik; lepas maka ia menukik. Lewati celah di dinding ngarai tanpa menyentuh batu. Makin cepat dan celah makin sempit. Menyentuh batu mengakhiri ronde.'],
      ru: ['Коснись, чтобы подняться', 'Разбился о скалы!', 'Камнепад!', 'Касайся, чтобы джет набирал высоту; отпусти — он пикирует. Пролетай сквозь просветы в стенах каньона, не задевая скалу. Становится быстрее, просветы уже. Удар о скалу завершает раунд.'],
      de: ['Tippen zum Steigen', 'An den Felsen zerschellt!', 'Steinschlag!', 'Tippe, damit dein Jet steigt; loslassen, dann sinkt er. Fliege durch die Lücken in den Schluchtwänden, ohne den Fels zu berühren. Es wird schneller und die Lücken enger. Den Fels zu berühren beendet die Runde.'],
      hi: ['ऊपर जाने को छुएं', 'चट्टानों से टकराए!', 'भूस्खलन!', 'अपने जेट को ऊपर उठाने को छुएं; छोड़ें तो नीचे गोता लगाता है। घाटी की दीवारों के बीच के खाली हिस्सों से चट्टान छुए बिना निकलें। यह तेज़ होता है और अंतराल सँकरे होते हैं। चट्टान से टकराना राउंड खत्म कर देता है।'],
      zh: ['点击上升', '撞上岩石了！', '山体滑坡！', '点击让你的战机爬升；松开它就俯冲。穿过峡谷岩壁之间的缺口，不要碰到岩石。速度越来越快，缺口越来越窄。碰到岩石，本回合结束。']
    },
    tankrush: {
      en: ['Drag to drive your tank', 'They got through!', 'Air strike!', 'Drag left or right to drive your tank along the bottom. It fires upward on its own — line it up under the enemy vehicles to blast them before they reach the bottom. They come faster and in greater numbers. One getting past you ends the round.'],
      fr: ['Glisse pour conduire ton char', 'Ils sont passés !', 'Frappe aérienne !', 'Glisse à gauche ou à droite pour conduire ton char en bas. Il tire tout seul vers le haut — place-le sous les véhicules ennemis pour les détruire avant qu’ils arrivent en bas. Ils arrivent plus vite et plus nombreux. Un seul qui passe termine la partie.'],
      es: ['Desliza para conducir tu tanque', '¡Se colaron!', '¡Ataque aéreo!', 'Desliza a izquierda o derecha para conducir tu tanque abajo. Dispara solo hacia arriba — colócalo bajo los vehículos enemigos para destruirlos antes de que lleguen abajo. Vienen más rápido y en mayor número. Que uno pase termina la ronda.'],
      pt: ['Deslize para dirigir seu tanque', 'Eles passaram!', 'Ataque aéreo!', 'Deslize para a esquerda ou direita para dirigir seu tanque embaixo. Ele atira sozinho para cima — alinhe-o sob os veículos inimigos para destruí-los antes que cheguem embaixo. Vêm mais rápido e em maior número. Um passar encerra a rodada.'],
      ar: ['اسحب لقيادة دبابتك', 'لقد عبروا!', 'ضربة جوية!', 'اسحب يسارًا أو يمينًا لقيادة دبابتك في الأسفل. تطلق النار تلقائيًا للأعلى — ضعها تحت مركبات العدو لتدميرها قبل أن تصل للأسفل. يأتون أسرع وأكثر عددًا. عبور واحد ينهي الجولة.'],
      tr: ['Tankını sürmek için kaydır', 'Geçtiler!', 'Hava saldırısı!', 'Tankını altta sürmek için sola ya da sağa kaydır. Kendi kendine yukarı ateş eder — düşman araçlarının altına getir ve aşağı ulaşmadan vur. Daha hızlı ve kalabalık gelirler. Biri geçerse tur biter.'],
      vi: ['Kéo để lái xe tăng', 'Chúng lọt qua!', 'Không kích!', 'Kéo trái hoặc phải để lái xe tăng ở dưới. Nó tự bắn lên — canh dưới xe địch để hạ chúng trước khi tới đáy. Chúng đến nhanh và đông hơn. Một chiếc lọt qua là kết thúc ván.'],
      id: ['Geser untuk mengendarai tank', 'Mereka lolos!', 'Serangan udara!', 'Geser ke kiri atau kanan untuk mengendarai tankmu di bawah. Ia menembak ke atas sendiri — sejajarkan di bawah kendaraan musuh untuk menghancurkannya sebelum sampai bawah. Datang makin cepat dan banyak. Satu lolos mengakhiri ronde.'],
      ru: ['Веди, чтобы управлять танком', 'Они прорвались!', 'Авиаудар!', 'Веди влево или вправо, чтобы вести танк внизу. Он сам стреляет вверх — подводи его под вражескую технику, чтобы сбить до того, как она дойдёт до низа. Их больше и они быстрее. Один прорвавшийся завершает раунд.'],
      de: ['Ziehen, um den Panzer zu fahren', 'Sie sind durch!', 'Luftangriff!', 'Ziehe nach links oder rechts, um deinen Panzer unten zu fahren. Er feuert von selbst nach oben — bring ihn unter die feindlichen Fahrzeuge, um sie abzuschießen, bevor sie unten ankommen. Sie kommen schneller und zahlreicher. Kommt einer durch, endet die Runde.'],
      hi: ['टैंक चलाने को खींचें', 'वे निकल गए!', 'हवाई हमला!', 'नीचे अपना टैंक चलाने के लिए बाएँ या दाएँ खींचें। यह खुद ऊपर गोली चलाता है — दुश्मन वाहनों के नीचे लाकर उन्हें नीचे पहुँचने से पहले उड़ा दें। वे तेज़ और ज़्यादा आते हैं। एक भी निकल गया तो राउंड खत्म।'],
      zh: ['拖动驾驶你的坦克', '它们冲过去了！', '空袭！', '左右拖动驾驶底部的坦克。它会自动向上开火——对准敌方车辆下方，在它们到达底部前消灭。它们会越来越快、越来越多。放过一辆，本回合结束。']
    },
    speedboat: {
      en: ['Drag to steer your boat', 'Wrecked!', 'Whirlpool!', 'Drag left or right to steer your speedboat and weave between the buoys and rocks on the river. It gets faster and busier. Hitting anything ends the round.'],
      fr: ['Glisse pour piloter ton bateau', 'Naufrage !', 'Tourbillon !', 'Glisse à gauche ou à droite pour piloter ton hors-bord et te faufiler entre les bouées et les rochers de la rivière. Ça devient plus rapide et plus chargé. Toucher quelque chose termine la partie.'],
      es: ['Desliza para pilotar tu lancha', '¡Naufragio!', '¡Remolino!', 'Desliza a izquierda o derecha para pilotar tu lancha y esquivar las boyas y rocas del río. Se vuelve más rápido y concurrido. Chocar con algo termina la ronda.'],
      pt: ['Deslize para pilotar seu barco', 'Naufrágio!', 'Redemoinho!', 'Deslize para a esquerda ou direita para pilotar sua lancha e desviar das boias e pedras do rio. Fica mais rápido e cheio. Bater em algo encerra a rodada.'],
      ar: ['اسحب لقيادة قاربك', 'تحطّم!', 'دوّامة!', 'اسحب يسارًا أو يمينًا لقيادة قاربك السريع والتفافه بين العوّامات والصخور في النهر. يصبح أسرع وأكثر ازدحامًا. اصطدامك بأي شيء ينهي الجولة.'],
      tr: ['Tekneni sürmek için kaydır', 'Battın!', 'Girdap!', 'Sürat tekneni sürmek ve nehirdeki şamandıra ile kayaların arasından geçmek için sola ya da sağa kaydır. Daha hızlı ve kalabalık olur. Bir şeye çarpmak turu bitirir.'],
      vi: ['Kéo để lái thuyền', 'Đắm rồi!', 'Xoáy nước!', 'Kéo trái hoặc phải để lái ca nô và luồn lách giữa phao và đá trên sông. Ngày càng nhanh và đông. Va vào bất cứ thứ gì là kết thúc ván.'],
      id: ['Geser untuk mengemudikan perahu', 'Karam!', 'Pusaran air!', 'Geser ke kiri atau kanan untuk mengemudikan perahu cepatmu dan menghindari pelampung serta batu di sungai. Makin cepat dan ramai. Menabrak apa pun mengakhiri ronde.'],
      ru: ['Веди, чтобы управлять катером', 'Крушение!', 'Водоворот!', 'Веди влево или вправо, чтобы управлять катером и лавировать между буями и камнями на реке. Становится быстрее и плотнее. Столкновение с чем-либо завершает раунд.'],
      de: ['Ziehen, um das Boot zu steuern', 'Havariert!', 'Strudel!', 'Ziehe nach links oder rechts, um dein Schnellboot zu steuern und zwischen den Bojen und Felsen im Fluss hindurchzuschlängeln. Es wird schneller und voller. Etwas zu treffen beendet die Runde.'],
      hi: ['नाव चलाने को खींचें', 'डूब गई!', 'भँवर!', 'अपनी स्पीडबोट चलाने और नदी की बोया व चट्टानों के बीच से निकलने के लिए बाएँ या दाएँ खींचें। यह तेज़ और व्यस्त होता जाता है। किसी से टकराना राउंड खत्म कर देता है।'],
      zh: ['拖动驾驶你的快艇', '翻船了！', '漩涡！', '左右拖动驾驶你的快艇，在河面的浮标和礁石之间穿梭。会越来越快、越来越挤。撞到任何东西，本回合结束。']
    },
    spacedash: {
      en: ['Drag to steer', 'Crash!', 'Wipeout!', 'Drag left or right to steer and weave through the obstacles coming at you. It gets faster and more crowded. Touching anything ends the round.'],
      fr: ['Glisse pour diriger', 'Accident !', 'Terminé !', 'Glisse à gauche ou à droite pour diriger et te faufiler entre les obstacles qui arrivent. Ça devient plus rapide et plus chargé. Toucher quelque chose termine la partie.'],
      es: ['Desliza para dirigir', '¡Choque!', '¡Fuera!', 'Desliza a izquierda o derecha para dirigir y esquivar los obstáculos que vienen. Se vuelve más rápido y concurrido. Tocar algo termina la ronda.'],
      pt: ['Deslize para dirigir', 'Batida!', 'Acabou!', 'Deslize para a esquerda ou direita para dirigir e desviar dos obstáculos que vêm. Fica mais rápido e cheio. Tocar em algo encerra a rodada.'],
      ar: ['اسحب للتوجيه', 'تحطّم!', 'انتهى!', 'اسحب يسارًا أو يمينًا للتوجيه والتفاف بين العوائق القادمة. يصبح أسرع وأكثر ازدحامًا. لمس أي شيء ينهي الجولة.'],
      tr: ['Yönlendirmek için kaydır', 'Kaza!', 'Bitti!', 'Yönlendirip gelen engellerin arasından geçmek için sola ya da sağa kaydır. Daha hızlı ve kalabalık olur. Bir şeye değmek turu bitirir.'],
      vi: ['Kéo để lái', 'Tông rồi!', 'Hết!', 'Kéo trái hoặc phải để lái và né các chướng ngại vật đang lao tới. Ngày càng nhanh và đông. Chạm vào bất cứ thứ gì là kết thúc ván.'],
      id: ['Geser untuk mengarah', 'Tabrakan!', 'Selesai!', 'Geser ke kiri atau kanan untuk mengarah dan menghindari rintangan yang datang. Makin cepat dan ramai. Menyentuh apa pun mengakhiri ronde.'],
      ru: ['Веди, чтобы рулить', 'Авария!', 'Конец!', 'Веди влево или вправо, чтобы рулить и уклоняться от летящих препятствий. Становится быстрее и плотнее. Касание чего-либо завершает раунд.'],
      de: ['Ziehen zum Lenken', 'Crash!', 'Aus!', 'Ziehe nach links oder rechts, um zu lenken und den entgegenkommenden Hindernissen auszuweichen. Es wird schneller und voller. Etwas zu berühren beendet die Runde.'],
      hi: ['चलाने को खींचें', 'टक्कर!', 'खत्म!', 'चलाने और आ रही बाधाओं से बचने के लिए बाएँ या दाएँ खींचें। यह तेज़ और भीड़भाड़ वाला होता जाता है। किसी भी चीज़ को छूना राउंड खत्म कर देता है।'],
      zh: ['拖动操控', '撞上了！', '结束！', '左右拖动操控，躲避迎面而来的障碍。会越来越快、越来越挤。碰到任何东西，本回合结束。']
    },
    sharkbay: {
      en: ['Drag to steer', 'Crash!', 'Wipeout!', 'Drag left or right to steer and weave through the obstacles coming at you. It gets faster and more crowded. Touching anything ends the round.'],
      fr: ['Glisse pour diriger', 'Accident !', 'Terminé !', 'Glisse à gauche ou à droite pour diriger et te faufiler entre les obstacles qui arrivent. Ça devient plus rapide et plus chargé. Toucher quelque chose termine la partie.'],
      es: ['Desliza para dirigir', '¡Choque!', '¡Fuera!', 'Desliza a izquierda o derecha para dirigir y esquivar los obstáculos que vienen. Se vuelve más rápido y concurrido. Tocar algo termina la ronda.'],
      pt: ['Deslize para dirigir', 'Batida!', 'Acabou!', 'Deslize para a esquerda ou direita para dirigir e desviar dos obstáculos que vêm. Fica mais rápido e cheio. Tocar em algo encerra a rodada.'],
      ar: ['اسحب للتوجيه', 'تحطّم!', 'انتهى!', 'اسحب يسارًا أو يمينًا للتوجيه والتفاف بين العوائق القادمة. يصبح أسرع وأكثر ازدحامًا. لمس أي شيء ينهي الجولة.'],
      tr: ['Yönlendirmek için kaydır', 'Kaza!', 'Bitti!', 'Yönlendirip gelen engellerin arasından geçmek için sola ya da sağa kaydır. Daha hızlı ve kalabalık olur. Bir şeye değmek turu bitirir.'],
      vi: ['Kéo để lái', 'Tông rồi!', 'Hết!', 'Kéo trái hoặc phải để lái và né các chướng ngại vật đang lao tới. Ngày càng nhanh và đông. Chạm vào bất cứ thứ gì là kết thúc ván.'],
      id: ['Geser untuk mengarah', 'Tabrakan!', 'Selesai!', 'Geser ke kiri atau kanan untuk mengarah dan menghindari rintangan yang datang. Makin cepat dan ramai. Menyentuh apa pun mengakhiri ronde.'],
      ru: ['Веди, чтобы рулить', 'Авария!', 'Конец!', 'Веди влево или вправо, чтобы рулить и уклоняться от летящих препятствий. Становится быстрее и плотнее. Касание чего-либо завершает раунд.'],
      de: ['Ziehen zum Lenken', 'Crash!', 'Aus!', 'Ziehe nach links oder rechts, um zu lenken und den entgegenkommenden Hindernissen auszuweichen. Es wird schneller und voller. Etwas zu berühren beendet die Runde.'],
      hi: ['चलाने को खींचें', 'टक्कर!', 'खत्म!', 'चलाने और आ रही बाधाओं से बचने के लिए बाएँ या दाएँ खींचें। यह तेज़ और भीड़भाड़ वाला होता जाता है। किसी भी चीज़ को छूना राउंड खत्म कर देता है।'],
      zh: ['拖动操控', '撞上了！', '结束！', '左右拖动操控，躲避迎面而来的障碍。会越来越快、越来越挤。碰到任何东西，本回合结束。']
    },
    snowdash: {
      en: ['Drag to steer', 'Crash!', 'Wipeout!', 'Drag left or right to steer and weave through the obstacles coming at you. It gets faster and more crowded. Touching anything ends the round.'],
      fr: ['Glisse pour diriger', 'Accident !', 'Terminé !', 'Glisse à gauche ou à droite pour diriger et te faufiler entre les obstacles qui arrivent. Ça devient plus rapide et plus chargé. Toucher quelque chose termine la partie.'],
      es: ['Desliza para dirigir', '¡Choque!', '¡Fuera!', 'Desliza a izquierda o derecha para dirigir y esquivar los obstáculos que vienen. Se vuelve más rápido y concurrido. Tocar algo termina la ronda.'],
      pt: ['Deslize para dirigir', 'Batida!', 'Acabou!', 'Deslize para a esquerda ou direita para dirigir e desviar dos obstáculos que vêm. Fica mais rápido e cheio. Tocar em algo encerra a rodada.'],
      ar: ['اسحب للتوجيه', 'تحطّم!', 'انتهى!', 'اسحب يسارًا أو يمينًا للتوجيه والتفاف بين العوائق القادمة. يصبح أسرع وأكثر ازدحامًا. لمس أي شيء ينهي الجولة.'],
      tr: ['Yönlendirmek için kaydır', 'Kaza!', 'Bitti!', 'Yönlendirip gelen engellerin arasından geçmek için sola ya da sağa kaydır. Daha hızlı ve kalabalık olur. Bir şeye değmek turu bitirir.'],
      vi: ['Kéo để lái', 'Tông rồi!', 'Hết!', 'Kéo trái hoặc phải để lái và né các chướng ngại vật đang lao tới. Ngày càng nhanh và đông. Chạm vào bất cứ thứ gì là kết thúc ván.'],
      id: ['Geser untuk mengarah', 'Tabrakan!', 'Selesai!', 'Geser ke kiri atau kanan untuk mengarah dan menghindari rintangan yang datang. Makin cepat dan ramai. Menyentuh apa pun mengakhiri ronde.'],
      ru: ['Веди, чтобы рулить', 'Авария!', 'Конец!', 'Веди влево или вправо, чтобы рулить и уклоняться от летящих препятствий. Становится быстрее и плотнее. Касание чего-либо завершает раунд.'],
      de: ['Ziehen zum Lenken', 'Crash!', 'Aus!', 'Ziehe nach links oder rechts, um zu lenken und den entgegenkommenden Hindernissen auszuweichen. Es wird schneller und voller. Etwas zu berühren beendet die Runde.'],
      hi: ['चलाने को खींचें', 'टक्कर!', 'खत्म!', 'चलाने और आ रही बाधाओं से बचने के लिए बाएँ या दाएँ खींचें। यह तेज़ और भीड़भाड़ वाला होता जाता है। किसी भी चीज़ को छूना राउंड खत्म कर देता है।'],
      zh: ['拖动操控', '撞上了！', '结束！', '左右拖动操控，躲避迎面而来的障碍。会越来越快、越来越挤。碰到任何东西，本回合结束。']
    },
    dunebuggy: {
      en: ['Drag to steer', 'Crash!', 'Wipeout!', 'Drag left or right to steer and weave through the obstacles coming at you. It gets faster and more crowded. Touching anything ends the round.'],
      fr: ['Glisse pour diriger', 'Accident !', 'Terminé !', 'Glisse à gauche ou à droite pour diriger et te faufiler entre les obstacles qui arrivent. Ça devient plus rapide et plus chargé. Toucher quelque chose termine la partie.'],
      es: ['Desliza para dirigir', '¡Choque!', '¡Fuera!', 'Desliza a izquierda o derecha para dirigir y esquivar los obstáculos que vienen. Se vuelve más rápido y concurrido. Tocar algo termina la ronda.'],
      pt: ['Deslize para dirigir', 'Batida!', 'Acabou!', 'Deslize para a esquerda ou direita para dirigir e desviar dos obstáculos que vêm. Fica mais rápido e cheio. Tocar em algo encerra a rodada.'],
      ar: ['اسحب للتوجيه', 'تحطّم!', 'انتهى!', 'اسحب يسارًا أو يمينًا للتوجيه والتفاف بين العوائق القادمة. يصبح أسرع وأكثر ازدحامًا. لمس أي شيء ينهي الجولة.'],
      tr: ['Yönlendirmek için kaydır', 'Kaza!', 'Bitti!', 'Yönlendirip gelen engellerin arasından geçmek için sola ya da sağa kaydır. Daha hızlı ve kalabalık olur. Bir şeye değmek turu bitirir.'],
      vi: ['Kéo để lái', 'Tông rồi!', 'Hết!', 'Kéo trái hoặc phải để lái và né các chướng ngại vật đang lao tới. Ngày càng nhanh và đông. Chạm vào bất cứ thứ gì là kết thúc ván.'],
      id: ['Geser untuk mengarah', 'Tabrakan!', 'Selesai!', 'Geser ke kiri atau kanan untuk mengarah dan menghindari rintangan yang datang. Makin cepat dan ramai. Menyentuh apa pun mengakhiri ronde.'],
      ru: ['Веди, чтобы рулить', 'Авария!', 'Конец!', 'Веди влево или вправо, чтобы рулить и уклоняться от летящих препятствий. Становится быстрее и плотнее. Касание чего-либо завершает раунд.'],
      de: ['Ziehen zum Lenken', 'Crash!', 'Aus!', 'Ziehe nach links oder rechts, um zu lenken und den entgegenkommenden Hindernissen auszuweichen. Es wird schneller und voller. Etwas zu berühren beendet die Runde.'],
      hi: ['चलाने को खींचें', 'टक्कर!', 'खत्म!', 'चलाने और आ रही बाधाओं से बचने के लिए बाएँ या दाएँ खींचें। यह तेज़ और भीड़भाड़ वाला होता जाता है। किसी भी चीज़ को छूना राउंड खत्म कर देता है।'],
      zh: ['拖动操控', '撞上了！', '结束！', '左右拖动操控，躲避迎面而来的障碍。会越来越快、越来越挤。碰到任何东西，本回合结束。']
    },
    starcatch: {
      en: ['Drag to catch', 'Missed it!', 'Over!', 'Drag left or right to move and catch the good things as they fall. Dodge the bad ones. It gets faster and busier. Missing a good one — or catching a bad one — ends the round.', 'Wrong catch!'],
      fr: ['Glisse pour attraper', 'Raté !', 'Terminé !', 'Glisse à gauche ou à droite pour attraper les bonnes choses qui tombent. Évite les mauvaises. Ça devient plus rapide et plus chargé. Rater une bonne — ou attraper une mauvaise — termine la partie.', 'Mauvaise prise !'],
      es: ['Desliza para atrapar', '¡Fallaste!', '¡Fin!', 'Desliza a izquierda o derecha para atrapar las cosas buenas que caen. Esquiva las malas. Se vuelve más rápido y concurrido. Fallar una buena — o atrapar una mala — termina la ronda.', '¡Mala atrapada!'],
      pt: ['Deslize para pegar', 'Perdeu!', 'Fim!', 'Deslize para a esquerda ou direita para pegar as coisas boas que caem. Desvie das ruins. Fica mais rápido e cheio. Perder uma boa — ou pegar uma ruim — encerra a rodada.', 'Pegou a errada!'],
      ar: ['اسحب للالتقاط', 'فاتك!', 'انتهى!', 'اسحب يسارًا أو يمينًا لالتقاط الأشياء الجيدة المتساقطة. تفادَ السيئة. يصبح أسرع وأكثر ازدحامًا. تفويت جيدة — أو التقاط سيئة — ينهي الجولة.', 'التقاط خاطئ!'],
      tr: ['Yakalamak için kaydır', 'Kaçırdın!', 'Bitti!', 'Düşen iyi şeyleri yakalamak için sola ya da sağa kaydır. Kötülerden kaç. Daha hızlı ve kalabalık olur. İyisini kaçırmak — ya da kötüsünü yakalamak — turu bitirir.', 'Yanlış yakalama!'],
      vi: ['Kéo để hứng', 'Hụt rồi!', 'Hết!', 'Kéo trái hoặc phải để hứng những thứ tốt đang rơi. Né những thứ xấu. Ngày càng nhanh và đông. Hụt thứ tốt — hoặc hứng thứ xấu — là kết thúc ván.', 'Hứng nhầm rồi!'],
      id: ['Geser untuk menangkap', 'Terlewat!', 'Selesai!', 'Geser ke kiri atau kanan untuk menangkap benda bagus yang jatuh. Hindari yang buruk. Makin cepat dan ramai. Melewatkan yang bagus — atau menangkap yang buruk — mengakhiri ronde.', 'Salah tangkap!'],
      ru: ['Веди, чтобы ловить', 'Мимо!', 'Конец!', 'Веди влево или вправо, чтобы ловить падающие хорошие вещи. Уклоняйся от плохих. Становится быстрее и плотнее. Упустить хорошую — или поймать плохую — завершает раунд.', 'Не то поймал!'],
      de: ['Ziehen zum Fangen', 'Verpasst!', 'Aus!', 'Ziehe nach links oder rechts, um die guten Dinge zu fangen, die fallen. Weiche den schlechten aus. Es wird schneller und voller. Eine gute zu verpassen — oder eine schlechte zu fangen — beendet die Runde.', 'Falsch gefangen!'],
      hi: ['पकड़ने को खींचें', 'चूक गए!', 'खत्म!', 'गिरती अच्छी चीज़ें पकड़ने के लिए बाएँ या दाएँ खींचें। बुरी से बचें। यह तेज़ और व्यस्त होता जाता है। अच्छी चूकना — या बुरी पकड़ना — राउंड खत्म कर देता है।', 'गलत पकड़!'],
      zh: ['拖动接取', '没接住！', '结束！', '左右拖动接住掉落的好东西，躲开坏的。会越来越快、越来越密。漏掉好的——或接到坏的——本回合结束。', '接错了！']
    },
    gemcatch: {
      en: ['Drag to catch', 'Missed it!', 'Over!', 'Drag left or right to move and catch the good things as they fall. Dodge the bad ones. It gets faster and busier. Missing a good one — or catching a bad one — ends the round.', 'Wrong catch!'],
      fr: ['Glisse pour attraper', 'Raté !', 'Terminé !', 'Glisse à gauche ou à droite pour attraper les bonnes choses qui tombent. Évite les mauvaises. Ça devient plus rapide et plus chargé. Rater une bonne — ou attraper une mauvaise — termine la partie.', 'Mauvaise prise !'],
      es: ['Desliza para atrapar', '¡Fallaste!', '¡Fin!', 'Desliza a izquierda o derecha para atrapar las cosas buenas que caen. Esquiva las malas. Se vuelve más rápido y concurrido. Fallar una buena — o atrapar una mala — termina la ronda.', '¡Mala atrapada!'],
      pt: ['Deslize para pegar', 'Perdeu!', 'Fim!', 'Deslize para a esquerda ou direita para pegar as coisas boas que caem. Desvie das ruins. Fica mais rápido e cheio. Perder uma boa — ou pegar uma ruim — encerra a rodada.', 'Pegou a errada!'],
      ar: ['اسحب للالتقاط', 'فاتك!', 'انتهى!', 'اسحب يسارًا أو يمينًا لالتقاط الأشياء الجيدة المتساقطة. تفادَ السيئة. يصبح أسرع وأكثر ازدحامًا. تفويت جيدة — أو التقاط سيئة — ينهي الجولة.', 'التقاط خاطئ!'],
      tr: ['Yakalamak için kaydır', 'Kaçırdın!', 'Bitti!', 'Düşen iyi şeyleri yakalamak için sola ya da sağa kaydır. Kötülerden kaç. Daha hızlı ve kalabalık olur. İyisini kaçırmak — ya da kötüsünü yakalamak — turu bitirir.', 'Yanlış yakalama!'],
      vi: ['Kéo để hứng', 'Hụt rồi!', 'Hết!', 'Kéo trái hoặc phải để hứng những thứ tốt đang rơi. Né những thứ xấu. Ngày càng nhanh và đông. Hụt thứ tốt — hoặc hứng thứ xấu — là kết thúc ván.', 'Hứng nhầm rồi!'],
      id: ['Geser untuk menangkap', 'Terlewat!', 'Selesai!', 'Geser ke kiri atau kanan untuk menangkap benda bagus yang jatuh. Hindari yang buruk. Makin cepat dan ramai. Melewatkan yang bagus — atau menangkap yang buruk — mengakhiri ronde.', 'Salah tangkap!'],
      ru: ['Веди, чтобы ловить', 'Мимо!', 'Конец!', 'Веди влево или вправо, чтобы ловить падающие хорошие вещи. Уклоняйся от плохих. Становится быстрее и плотнее. Упустить хорошую — или поймать плохую — завершает раунд.', 'Не то поймал!'],
      de: ['Ziehen zum Fangen', 'Verpasst!', 'Aus!', 'Ziehe nach links oder rechts, um die guten Dinge zu fangen, die fallen. Weiche den schlechten aus. Es wird schneller und voller. Eine gute zu verpassen — oder eine schlechte zu fangen — beendet die Runde.', 'Falsch gefangen!'],
      hi: ['पकड़ने को खींचें', 'चूक गए!', 'खत्म!', 'गिरती अच्छी चीज़ें पकड़ने के लिए बाएँ या दाएँ खींचें। बुरी से बचें। यह तेज़ और व्यस्त होता जाता है। अच्छी चूकना — या बुरी पकड़ना — राउंड खत्म कर देता है।', 'गलत पकड़!'],
      zh: ['拖动接取', '没接住！', '结束！', '左右拖动接住掉落的好东西，躲开坏的。会越来越快、越来越密。漏掉好的——或接到坏的——本回合结束。', '接错了！']
    },
    lavarun: {
      en: ['Drag to steer', 'Crash!', 'Wipeout!', 'Drag left or right to steer and weave through the obstacles coming at you. It gets faster and more crowded. Touching anything ends the round.'],
      fr: ['Glisse pour diriger', 'Accident !', 'Terminé !', 'Glisse à gauche ou à droite pour diriger et te faufiler entre les obstacles qui arrivent. Ça devient plus rapide et plus chargé. Toucher quelque chose termine la partie.'],
      es: ['Desliza para dirigir', '¡Choque!', '¡Fuera!', 'Desliza a izquierda o derecha para dirigir y esquivar los obstáculos que vienen. Se vuelve más rápido y concurrido. Tocar algo termina la ronda.'],
      pt: ['Deslize para dirigir', 'Batida!', 'Acabou!', 'Deslize para a esquerda ou direita para dirigir e desviar dos obstáculos que vêm. Fica mais rápido e cheio. Tocar em algo encerra a rodada.'],
      ar: ['اسحب للتوجيه', 'تحطّم!', 'انتهى!', 'اسحب يسارًا أو يمينًا للتوجيه والتفاف بين العوائق القادمة. يصبح أسرع وأكثر ازدحامًا. لمس أي شيء ينهي الجولة.'],
      tr: ['Yönlendirmek için kaydır', 'Kaza!', 'Bitti!', 'Yönlendirip gelen engellerin arasından geçmek için sola ya da sağa kaydır. Daha hızlı ve kalabalık olur. Bir şeye değmek turu bitirir.'],
      vi: ['Kéo để lái', 'Tông rồi!', 'Hết!', 'Kéo trái hoặc phải để lái và né các chướng ngại vật đang lao tới. Ngày càng nhanh và đông. Chạm vào bất cứ thứ gì là kết thúc ván.'],
      id: ['Geser untuk mengarah', 'Tabrakan!', 'Selesai!', 'Geser ke kiri atau kanan untuk mengarah dan menghindari rintangan yang datang. Makin cepat dan ramai. Menyentuh apa pun mengakhiri ronde.'],
      ru: ['Веди, чтобы рулить', 'Авария!', 'Конец!', 'Веди влево или вправо, чтобы рулить и уклоняться от летящих препятствий. Становится быстрее и плотнее. Касание чего-либо завершает раунд.'],
      de: ['Ziehen zum Lenken', 'Crash!', 'Aus!', 'Ziehe nach links oder rechts, um zu lenken und den entgegenkommenden Hindernissen auszuweichen. Es wird schneller und voller. Etwas zu berühren beendet die Runde.'],
      hi: ['चलाने को खींचें', 'टक्कर!', 'खत्म!', 'चलाने और आ रही बाधाओं से बचने के लिए बाएँ या दाएँ खींचें। यह तेज़ और भीड़भाड़ वाला होता जाता है। किसी भी चीज़ को छूना राउंड खत्म कर देता है।'],
      zh: ['拖动操控', '撞上了！', '结束！', '左右拖动操控，躲避迎面而来的障碍。会越来越快、越来越挤。碰到任何东西，本回合结束。']
    },
    ghostdash: {
      en: ['Drag to steer', 'Crash!', 'Wipeout!', 'Drag left or right to steer and weave through the obstacles coming at you. It gets faster and more crowded. Touching anything ends the round.'],
      fr: ['Glisse pour diriger', 'Accident !', 'Terminé !', 'Glisse à gauche ou à droite pour diriger et te faufiler entre les obstacles qui arrivent. Ça devient plus rapide et plus chargé. Toucher quelque chose termine la partie.'],
      es: ['Desliza para dirigir', '¡Choque!', '¡Fuera!', 'Desliza a izquierda o derecha para dirigir y esquivar los obstáculos que vienen. Se vuelve más rápido y concurrido. Tocar algo termina la ronda.'],
      pt: ['Deslize para dirigir', 'Batida!', 'Acabou!', 'Deslize para a esquerda ou direita para dirigir e desviar dos obstáculos que vêm. Fica mais rápido e cheio. Tocar em algo encerra a rodada.'],
      ar: ['اسحب للتوجيه', 'تحطّم!', 'انتهى!', 'اسحب يسارًا أو يمينًا للتوجيه والتفاف بين العوائق القادمة. يصبح أسرع وأكثر ازدحامًا. لمس أي شيء ينهي الجولة.'],
      tr: ['Yönlendirmek için kaydır', 'Kaza!', 'Bitti!', 'Yönlendirip gelen engellerin arasından geçmek için sola ya da sağa kaydır. Daha hızlı ve kalabalık olur. Bir şeye değmek turu bitirir.'],
      vi: ['Kéo để lái', 'Tông rồi!', 'Hết!', 'Kéo trái hoặc phải để lái và né các chướng ngại vật đang lao tới. Ngày càng nhanh và đông. Chạm vào bất cứ thứ gì là kết thúc ván.'],
      id: ['Geser untuk mengarah', 'Tabrakan!', 'Selesai!', 'Geser ke kiri atau kanan untuk mengarah dan menghindari rintangan yang datang. Makin cepat dan ramai. Menyentuh apa pun mengakhiri ronde.'],
      ru: ['Веди, чтобы рулить', 'Авария!', 'Конец!', 'Веди влево или вправо, чтобы рулить и уклоняться от летящих препятствий. Становится быстрее и плотнее. Касание чего-либо завершает раунд.'],
      de: ['Ziehen zum Lenken', 'Crash!', 'Aus!', 'Ziehe nach links oder rechts, um zu lenken und den entgegenkommenden Hindernissen auszuweichen. Es wird schneller und voller. Etwas zu berühren beendet die Runde.'],
      hi: ['चलाने को खींचें', 'टक्कर!', 'खत्म!', 'चलाने और आ रही बाधाओं से बचने के लिए बाएँ या दाएँ खींचें। यह तेज़ और भीड़भाड़ वाला होता जाता है। किसी भी चीज़ को छूना राउंड खत्म कर देता है।'],
      zh: ['拖动操控', '撞上了！', '结束！', '左右拖动操控，躲避迎面而来的障碍。会越来越快、越来越挤。碰到任何东西，本回合结束。']
    },
    cityscoot: {
      en: ['Drag to steer', 'Crash!', 'Wipeout!', 'Drag left or right to steer and weave through the obstacles coming at you. It gets faster and more crowded. Touching anything ends the round.'],
      fr: ['Glisse pour diriger', 'Accident !', 'Terminé !', 'Glisse à gauche ou à droite pour diriger et te faufiler entre les obstacles qui arrivent. Ça devient plus rapide et plus chargé. Toucher quelque chose termine la partie.'],
      es: ['Desliza para dirigir', '¡Choque!', '¡Fuera!', 'Desliza a izquierda o derecha para dirigir y esquivar los obstáculos que vienen. Se vuelve más rápido y concurrido. Tocar algo termina la ronda.'],
      pt: ['Deslize para dirigir', 'Batida!', 'Acabou!', 'Deslize para a esquerda ou direita para dirigir e desviar dos obstáculos que vêm. Fica mais rápido e cheio. Tocar em algo encerra a rodada.'],
      ar: ['اسحب للتوجيه', 'تحطّم!', 'انتهى!', 'اسحب يسارًا أو يمينًا للتوجيه والتفاف بين العوائق القادمة. يصبح أسرع وأكثر ازدحامًا. لمس أي شيء ينهي الجولة.'],
      tr: ['Yönlendirmek için kaydır', 'Kaza!', 'Bitti!', 'Yönlendirip gelen engellerin arasından geçmek için sola ya da sağa kaydır. Daha hızlı ve kalabalık olur. Bir şeye değmek turu bitirir.'],
      vi: ['Kéo để lái', 'Tông rồi!', 'Hết!', 'Kéo trái hoặc phải để lái và né các chướng ngại vật đang lao tới. Ngày càng nhanh và đông. Chạm vào bất cứ thứ gì là kết thúc ván.'],
      id: ['Geser untuk mengarah', 'Tabrakan!', 'Selesai!', 'Geser ke kiri atau kanan untuk mengarah dan menghindari rintangan yang datang. Makin cepat dan ramai. Menyentuh apa pun mengakhiri ronde.'],
      ru: ['Веди, чтобы рулить', 'Авария!', 'Конец!', 'Веди влево или вправо, чтобы рулить и уклоняться от летящих препятствий. Становится быстрее и плотнее. Касание чего-либо завершает раунд.'],
      de: ['Ziehen zum Lenken', 'Crash!', 'Aus!', 'Ziehe nach links oder rechts, um zu lenken und den entgegenkommenden Hindernissen auszuweichen. Es wird schneller und voller. Etwas zu berühren beendet die Runde.'],
      hi: ['चलाने को खींचें', 'टक्कर!', 'खत्म!', 'चलाने और आ रही बाधाओं से बचने के लिए बाएँ या दाएँ खींचें। यह तेज़ और भीड़भाड़ वाला होता जाता है। किसी भी चीज़ को छूना राउंड खत्म कर देता है।'],
      zh: ['拖动操控', '撞上了！', '结束！', '左右拖动操控，躲避迎面而来的障碍。会越来越快、越来越挤。碰到任何东西，本回合结束。']
    },
    eggcatch: {
      en: ['Drag to catch', 'Missed it!', 'Over!', 'Drag left or right to move and catch the good things as they fall. Dodge the bad ones. It gets faster and busier. Missing a good one — or catching a bad one — ends the round.', 'Wrong catch!'],
      fr: ['Glisse pour attraper', 'Raté !', 'Terminé !', 'Glisse à gauche ou à droite pour attraper les bonnes choses qui tombent. Évite les mauvaises. Ça devient plus rapide et plus chargé. Rater une bonne — ou attraper une mauvaise — termine la partie.', 'Mauvaise prise !'],
      es: ['Desliza para atrapar', '¡Fallaste!', '¡Fin!', 'Desliza a izquierda o derecha para atrapar las cosas buenas que caen. Esquiva las malas. Se vuelve más rápido y concurrido. Fallar una buena — o atrapar una mala — termina la ronda.', '¡Mala atrapada!'],
      pt: ['Deslize para pegar', 'Perdeu!', 'Fim!', 'Deslize para a esquerda ou direita para pegar as coisas boas que caem. Desvie das ruins. Fica mais rápido e cheio. Perder uma boa — ou pegar uma ruim — encerra a rodada.', 'Pegou a errada!'],
      ar: ['اسحب للالتقاط', 'فاتك!', 'انتهى!', 'اسحب يسارًا أو يمينًا لالتقاط الأشياء الجيدة المتساقطة. تفادَ السيئة. يصبح أسرع وأكثر ازدحامًا. تفويت جيدة — أو التقاط سيئة — ينهي الجولة.', 'التقاط خاطئ!'],
      tr: ['Yakalamak için kaydır', 'Kaçırdın!', 'Bitti!', 'Düşen iyi şeyleri yakalamak için sola ya da sağa kaydır. Kötülerden kaç. Daha hızlı ve kalabalık olur. İyisini kaçırmak — ya da kötüsünü yakalamak — turu bitirir.', 'Yanlış yakalama!'],
      vi: ['Kéo để hứng', 'Hụt rồi!', 'Hết!', 'Kéo trái hoặc phải để hứng những thứ tốt đang rơi. Né những thứ xấu. Ngày càng nhanh và đông. Hụt thứ tốt — hoặc hứng thứ xấu — là kết thúc ván.', 'Hứng nhầm rồi!'],
      id: ['Geser untuk menangkap', 'Terlewat!', 'Selesai!', 'Geser ke kiri atau kanan untuk menangkap benda bagus yang jatuh. Hindari yang buruk. Makin cepat dan ramai. Melewatkan yang bagus — atau menangkap yang buruk — mengakhiri ronde.', 'Salah tangkap!'],
      ru: ['Веди, чтобы ловить', 'Мимо!', 'Конец!', 'Веди влево или вправо, чтобы ловить падающие хорошие вещи. Уклоняйся от плохих. Становится быстрее и плотнее. Упустить хорошую — или поймать плохую — завершает раунд.', 'Не то поймал!'],
      de: ['Ziehen zum Fangen', 'Verpasst!', 'Aus!', 'Ziehe nach links oder rechts, um die guten Dinge zu fangen, die fallen. Weiche den schlechten aus. Es wird schneller und voller. Eine gute zu verpassen — oder eine schlechte zu fangen — beendet die Runde.', 'Falsch gefangen!'],
      hi: ['पकड़ने को खींचें', 'चूक गए!', 'खत्म!', 'गिरती अच्छी चीज़ें पकड़ने के लिए बाएँ या दाएँ खींचें। बुरी से बचें। यह तेज़ और व्यस्त होता जाता है। अच्छी चूकना — या बुरी पकड़ना — राउंड खत्म कर देता है।', 'गलत पकड़!'],
      zh: ['拖动接取', '没接住！', '结束！', '左右拖动接住掉落的好东西，躲开坏的。会越来越快、越来越密。漏掉好的——或接到坏的——本回合结束。', '接错了！']
    },
    gifthaul: {
      en: ['Drag to catch', 'Missed it!', 'Over!', 'Drag left or right to move and catch the good things as they fall. Dodge the bad ones. It gets faster and busier. Missing a good one — or catching a bad one — ends the round.', 'Wrong catch!'],
      fr: ['Glisse pour attraper', 'Raté !', 'Terminé !', 'Glisse à gauche ou à droite pour attraper les bonnes choses qui tombent. Évite les mauvaises. Ça devient plus rapide et plus chargé. Rater une bonne — ou attraper une mauvaise — termine la partie.', 'Mauvaise prise !'],
      es: ['Desliza para atrapar', '¡Fallaste!', '¡Fin!', 'Desliza a izquierda o derecha para atrapar las cosas buenas que caen. Esquiva las malas. Se vuelve más rápido y concurrido. Fallar una buena — o atrapar una mala — termina la ronda.', '¡Mala atrapada!'],
      pt: ['Deslize para pegar', 'Perdeu!', 'Fim!', 'Deslize para a esquerda ou direita para pegar as coisas boas que caem. Desvie das ruins. Fica mais rápido e cheio. Perder uma boa — ou pegar uma ruim — encerra a rodada.', 'Pegou a errada!'],
      ar: ['اسحب للالتقاط', 'فاتك!', 'انتهى!', 'اسحب يسارًا أو يمينًا لالتقاط الأشياء الجيدة المتساقطة. تفادَ السيئة. يصبح أسرع وأكثر ازدحامًا. تفويت جيدة — أو التقاط سيئة — ينهي الجولة.', 'التقاط خاطئ!'],
      tr: ['Yakalamak için kaydır', 'Kaçırdın!', 'Bitti!', 'Düşen iyi şeyleri yakalamak için sola ya da sağa kaydır. Kötülerden kaç. Daha hızlı ve kalabalık olur. İyisini kaçırmak — ya da kötüsünü yakalamak — turu bitirir.', 'Yanlış yakalama!'],
      vi: ['Kéo để hứng', 'Hụt rồi!', 'Hết!', 'Kéo trái hoặc phải để hứng những thứ tốt đang rơi. Né những thứ xấu. Ngày càng nhanh và đông. Hụt thứ tốt — hoặc hứng thứ xấu — là kết thúc ván.', 'Hứng nhầm rồi!'],
      id: ['Geser untuk menangkap', 'Terlewat!', 'Selesai!', 'Geser ke kiri atau kanan untuk menangkap benda bagus yang jatuh. Hindari yang buruk. Makin cepat dan ramai. Melewatkan yang bagus — atau menangkap yang buruk — mengakhiri ronde.', 'Salah tangkap!'],
      ru: ['Веди, чтобы ловить', 'Мимо!', 'Конец!', 'Веди влево или вправо, чтобы ловить падающие хорошие вещи. Уклоняйся от плохих. Становится быстрее и плотнее. Упустить хорошую — или поймать плохую — завершает раунд.', 'Не то поймал!'],
      de: ['Ziehen zum Fangen', 'Verpasst!', 'Aus!', 'Ziehe nach links oder rechts, um die guten Dinge zu fangen, die fallen. Weiche den schlechten aus. Es wird schneller und voller. Eine gute zu verpassen — oder eine schlechte zu fangen — beendet die Runde.', 'Falsch gefangen!'],
      hi: ['पकड़ने को खींचें', 'चूक गए!', 'खत्म!', 'गिरती अच्छी चीज़ें पकड़ने के लिए बाएँ या दाएँ खींचें। बुरी से बचें। यह तेज़ और व्यस्त होता जाता है। अच्छी चूकना — या बुरी पकड़ना — राउंड खत्म कर देता है।', 'गलत पकड़!'],
      zh: ['拖动接取', '没接住！', '结束！', '左右拖动接住掉落的好东西，躲开坏的。会越来越快、越来越密。漏掉好的——或接到坏的——本回合结束。', '接错了！']
    },
    coincatch: {
      en: ['Drag to catch', 'Missed it!', 'Over!', 'Drag left or right to move and catch the good things as they fall. Dodge the bad ones. It gets faster and busier. Missing a good one — or catching a bad one — ends the round.', 'Wrong catch!'],
      fr: ['Glisse pour attraper', 'Raté !', 'Terminé !', 'Glisse à gauche ou à droite pour attraper les bonnes choses qui tombent. Évite les mauvaises. Ça devient plus rapide et plus chargé. Rater une bonne — ou attraper une mauvaise — termine la partie.', 'Mauvaise prise !'],
      es: ['Desliza para atrapar', '¡Fallaste!', '¡Fin!', 'Desliza a izquierda o derecha para atrapar las cosas buenas que caen. Esquiva las malas. Se vuelve más rápido y concurrido. Fallar una buena — o atrapar una mala — termina la ronda.', '¡Mala atrapada!'],
      pt: ['Deslize para pegar', 'Perdeu!', 'Fim!', 'Deslize para a esquerda ou direita para pegar as coisas boas que caem. Desvie das ruins. Fica mais rápido e cheio. Perder uma boa — ou pegar uma ruim — encerra a rodada.', 'Pegou a errada!'],
      ar: ['اسحب للالتقاط', 'فاتك!', 'انتهى!', 'اسحب يسارًا أو يمينًا لالتقاط الأشياء الجيدة المتساقطة. تفادَ السيئة. يصبح أسرع وأكثر ازدحامًا. تفويت جيدة — أو التقاط سيئة — ينهي الجولة.', 'التقاط خاطئ!'],
      tr: ['Yakalamak için kaydır', 'Kaçırdın!', 'Bitti!', 'Düşen iyi şeyleri yakalamak için sola ya da sağa kaydır. Kötülerden kaç. Daha hızlı ve kalabalık olur. İyisini kaçırmak — ya da kötüsünü yakalamak — turu bitirir.', 'Yanlış yakalama!'],
      vi: ['Kéo để hứng', 'Hụt rồi!', 'Hết!', 'Kéo trái hoặc phải để hứng những thứ tốt đang rơi. Né những thứ xấu. Ngày càng nhanh và đông. Hụt thứ tốt — hoặc hứng thứ xấu — là kết thúc ván.', 'Hứng nhầm rồi!'],
      id: ['Geser untuk menangkap', 'Terlewat!', 'Selesai!', 'Geser ke kiri atau kanan untuk menangkap benda bagus yang jatuh. Hindari yang buruk. Makin cepat dan ramai. Melewatkan yang bagus — atau menangkap yang buruk — mengakhiri ronde.', 'Salah tangkap!'],
      ru: ['Веди, чтобы ловить', 'Мимо!', 'Конец!', 'Веди влево или вправо, чтобы ловить падающие хорошие вещи. Уклоняйся от плохих. Становится быстрее и плотнее. Упустить хорошую — или поймать плохую — завершает раунд.', 'Не то поймал!'],
      de: ['Ziehen zum Fangen', 'Verpasst!', 'Aus!', 'Ziehe nach links oder rechts, um die guten Dinge zu fangen, die fallen. Weiche den schlechten aus. Es wird schneller und voller. Eine gute zu verpassen — oder eine schlechte zu fangen — beendet die Runde.', 'Falsch gefangen!'],
      hi: ['पकड़ने को खींचें', 'चूक गए!', 'खत्म!', 'गिरती अच्छी चीज़ें पकड़ने के लिए बाएँ या दाएँ खींचें। बुरी से बचें। यह तेज़ और व्यस्त होता जाता है। अच्छी चूकना — या बुरी पकड़ना — राउंड खत्म कर देता है।', 'गलत पकड़!'],
      zh: ['拖动接取', '没接住！', '结束！', '左右拖动接住掉落的好东西，躲开坏的。会越来越快、越来越密。漏掉好的——或接到坏的——本回合结束。', '接错了！']
    },
    jetpack: {
      en: ['Tap to fly up', 'Crashed!', 'Collapse!', 'Tap to rise; let go and you drop. Fly through the gaps without touching the walls. It gets faster and the gaps get tighter. Hitting a wall ends the round.'],
      fr: ['Touche pour monter', 'Écrasé !', 'Effondrement !', 'Touche pour monter ; relâche et tu descends. Passe par les trous sans toucher les parois. Ça accélère et les trous se resserrent. Toucher une paroi termine la partie.'],
      es: ['Toca para subir', '¡Te estrellaste!', '¡Derrumbe!', 'Toca para subir; suelta y bajas. Pasa por los huecos sin tocar las paredes. Se acelera y los huecos se estrechan. Tocar una pared termina la ronda.'],
      pt: ['Toque para subir', 'Bateu!', 'Desabamento!', 'Toque para subir; solte e você desce. Passe pelos vãos sem tocar nas paredes. Acelera e os vãos apertam. Tocar numa parede encerra a rodada.'],
      ar: ['المس للصعود', 'اصطدمت!', 'انهيار!', 'المس لتصعد؛ اترك فتهبط. مُرّ عبر الفجوات دون لمس الجدران. يتسارع وتضيق الفجوات. لمس جدار ينهي الجولة.'],
      tr: ['Yükselmek için dokun', 'Çarptın!', 'Çöküş!', 'Yükselmek için dokun; bırak, düşersin. Duvarlara değmeden boşluklardan geç. Hızlanır ve boşluklar daralır. Bir duvara çarpmak turu bitirir.'],
      vi: ['Chạm để bay lên', 'Đâm rồi!', 'Sập!', 'Chạm để bay lên; thả ra thì rơi. Bay qua các khe hở mà không chạm tường. Nhanh dần và khe hẹp dần. Chạm tường là kết thúc ván.'],
      id: ['Ketuk untuk naik', 'Menabrak!', 'Runtuh!', 'Ketuk untuk naik; lepas maka turun. Lewati celah tanpa menyentuh dinding. Makin cepat dan celah menyempit. Menyentuh dinding mengakhiri ronde.'],
      ru: ['Коснись, чтобы взлететь', 'Разбился!', 'Обвал!', 'Касайся, чтобы подниматься; отпусти — падаешь. Пролетай в просветы, не задевая стены. Быстрее, просветы уже. Удар о стену завершает раунд.'],
      de: ['Tippen zum Steigen', 'Zerschellt!', 'Einsturz!', 'Tippe zum Steigen; loslassen, dann sinkst du. Flieg durch die Lücken, ohne die Wände zu berühren. Es wird schneller und enger. Eine Wand zu berühren beendet die Runde.'],
      hi: ['ऊपर जाने को छुएं', 'टकरा गए!', 'ढह गया!', 'ऊपर उठने को छुएं; छोड़ें तो गिरते हैं। दीवार छुए बिना खाली जगहों से निकलें। तेज़ होता है, जगह सँकरी। दीवार से टकराना राउंड खत्म कर देता है।'],
      zh: ['点击上升', '撞毁了！', '坍塌！', '点击上升，松开就下落。穿过缺口，不要碰到墙壁。会越来越快、缺口越来越窄。碰到墙壁，本回合结束。']
    },
    bubblesub: {
      en: ['Tap to fly up', 'Crashed!', 'Collapse!', 'Tap to rise; let go and you drop. Fly through the gaps without touching the walls. It gets faster and the gaps get tighter. Hitting a wall ends the round.'],
      fr: ['Touche pour monter', 'Écrasé !', 'Effondrement !', 'Touche pour monter ; relâche et tu descends. Passe par les trous sans toucher les parois. Ça accélère et les trous se resserrent. Toucher une paroi termine la partie.'],
      es: ['Toca para subir', '¡Te estrellaste!', '¡Derrumbe!', 'Toca para subir; suelta y bajas. Pasa por los huecos sin tocar las paredes. Se acelera y los huecos se estrechan. Tocar una pared termina la ronda.'],
      pt: ['Toque para subir', 'Bateu!', 'Desabamento!', 'Toque para subir; solte e você desce. Passe pelos vãos sem tocar nas paredes. Acelera e os vãos apertam. Tocar numa parede encerra a rodada.'],
      ar: ['المس للصعود', 'اصطدمت!', 'انهيار!', 'المس لتصعد؛ اترك فتهبط. مُرّ عبر الفجوات دون لمس الجدران. يتسارع وتضيق الفجوات. لمس جدار ينهي الجولة.'],
      tr: ['Yükselmek için dokun', 'Çarptın!', 'Çöküş!', 'Yükselmek için dokun; bırak, düşersin. Duvarlara değmeden boşluklardan geç. Hızlanır ve boşluklar daralır. Bir duvara çarpmak turu bitirir.'],
      vi: ['Chạm để bay lên', 'Đâm rồi!', 'Sập!', 'Chạm để bay lên; thả ra thì rơi. Bay qua các khe hở mà không chạm tường. Nhanh dần và khe hẹp dần. Chạm tường là kết thúc ván.'],
      id: ['Ketuk untuk naik', 'Menabrak!', 'Runtuh!', 'Ketuk untuk naik; lepas maka turun. Lewati celah tanpa menyentuh dinding. Makin cepat dan celah menyempit. Menyentuh dinding mengakhiri ronde.'],
      ru: ['Коснись, чтобы взлететь', 'Разбился!', 'Обвал!', 'Касайся, чтобы подниматься; отпусти — падаешь. Пролетай в просветы, не задевая стены. Быстрее, просветы уже. Удар о стену завершает раунд.'],
      de: ['Tippen zum Steigen', 'Zerschellt!', 'Einsturz!', 'Tippe zum Steigen; loslassen, dann sinkst du. Flieg durch die Lücken, ohne die Wände zu berühren. Es wird schneller und enger. Eine Wand zu berühren beendet die Runde.'],
      hi: ['ऊपर जाने को छुएं', 'टकरा गए!', 'ढह गया!', 'ऊपर उठने को छुएं; छोड़ें तो गिरते हैं। दीवार छुए बिना खाली जगहों से निकलें। तेज़ होता है, जगह सँकरी। दीवार से टकराना राउंड खत्म कर देता है।'],
      zh: ['点击上升', '撞毁了！', '坍塌！', '点击上升，松开就下落。穿过缺口，不要碰到墙壁。会越来越快、缺口越来越窄。碰到墙壁，本回合结束。']
    },
    moonrover: {
      en: ['Drag to steer', 'Crash!', 'Wipeout!', 'Drag left or right to steer and weave through the obstacles coming at you. It gets faster and more crowded. Touching anything ends the round.'],
      fr: ['Glisse pour diriger', 'Accident !', 'Terminé !', 'Glisse à gauche ou à droite pour diriger et te faufiler entre les obstacles qui arrivent. Ça devient plus rapide et plus chargé. Toucher quelque chose termine la partie.'],
      es: ['Desliza para dirigir', '¡Choque!', '¡Fuera!', 'Desliza a izquierda o derecha para dirigir y esquivar los obstáculos que vienen. Se vuelve más rápido y concurrido. Tocar algo termina la ronda.'],
      pt: ['Deslize para dirigir', 'Batida!', 'Acabou!', 'Deslize para a esquerda ou direita para dirigir e desviar dos obstáculos que vêm. Fica mais rápido e cheio. Tocar em algo encerra a rodada.'],
      ar: ['اسحب للتوجيه', 'تحطّم!', 'انتهى!', 'اسحب يسارًا أو يمينًا للتوجيه والتفاف بين العوائق القادمة. يصبح أسرع وأكثر ازدحامًا. لمس أي شيء ينهي الجولة.'],
      tr: ['Yönlendirmek için kaydır', 'Kaza!', 'Bitti!', 'Yönlendirip gelen engellerin arasından geçmek için sola ya da sağa kaydır. Daha hızlı ve kalabalık olur. Bir şeye değmek turu bitirir.'],
      vi: ['Kéo để lái', 'Tông rồi!', 'Hết!', 'Kéo trái hoặc phải để lái và né các chướng ngại vật đang lao tới. Ngày càng nhanh và đông. Chạm vào bất cứ thứ gì là kết thúc ván.'],
      id: ['Geser untuk mengarah', 'Tabrakan!', 'Selesai!', 'Geser ke kiri atau kanan untuk mengarah dan menghindari rintangan yang datang. Makin cepat dan ramai. Menyentuh apa pun mengakhiri ronde.'],
      ru: ['Веди, чтобы рулить', 'Авария!', 'Конец!', 'Веди влево или вправо, чтобы рулить и уклоняться от летящих препятствий. Становится быстрее и плотнее. Касание чего-либо завершает раунд.'],
      de: ['Ziehen zum Lenken', 'Crash!', 'Aus!', 'Ziehe nach links oder rechts, um zu lenken und den entgegenkommenden Hindernissen auszuweichen. Es wird schneller und voller. Etwas zu berühren beendet die Runde.'],
      hi: ['चलाने को खींचें', 'टक्कर!', 'खत्म!', 'चलाने और आ रही बाधाओं से बचने के लिए बाएँ या दाएँ खींचें। यह तेज़ और भीड़भाड़ वाला होता जाता है। किसी भी चीज़ को छूना राउंड खत्म कर देता है।'],
      zh: ['拖动操控', '撞上了！', '结束！', '左右拖动操控，躲避迎面而来的障碍。会越来越快、越来越挤。碰到任何东西，本回合结束。']
    },
    toxicrun: {
      en: ['Drag to steer', 'Crash!', 'Wipeout!', 'Drag left or right to steer and weave through the obstacles coming at you. It gets faster and more crowded. Touching anything ends the round.'],
      fr: ['Glisse pour diriger', 'Accident !', 'Terminé !', 'Glisse à gauche ou à droite pour diriger et te faufiler entre les obstacles qui arrivent. Ça devient plus rapide et plus chargé. Toucher quelque chose termine la partie.'],
      es: ['Desliza para dirigir', '¡Choque!', '¡Fuera!', 'Desliza a izquierda o derecha para dirigir y esquivar los obstáculos que vienen. Se vuelve más rápido y concurrido. Tocar algo termina la ronda.'],
      pt: ['Deslize para dirigir', 'Batida!', 'Acabou!', 'Deslize para a esquerda ou direita para dirigir e desviar dos obstáculos que vêm. Fica mais rápido e cheio. Tocar em algo encerra a rodada.'],
      ar: ['اسحب للتوجيه', 'تحطّم!', 'انتهى!', 'اسحب يسارًا أو يمينًا للتوجيه والتفاف بين العوائق القادمة. يصبح أسرع وأكثر ازدحامًا. لمس أي شيء ينهي الجولة.'],
      tr: ['Yönlendirmek için kaydır', 'Kaza!', 'Bitti!', 'Yönlendirip gelen engellerin arasından geçmek için sola ya da sağa kaydır. Daha hızlı ve kalabalık olur. Bir şeye değmek turu bitirir.'],
      vi: ['Kéo để lái', 'Tông rồi!', 'Hết!', 'Kéo trái hoặc phải để lái và né các chướng ngại vật đang lao tới. Ngày càng nhanh và đông. Chạm vào bất cứ thứ gì là kết thúc ván.'],
      id: ['Geser untuk mengarah', 'Tabrakan!', 'Selesai!', 'Geser ke kiri atau kanan untuk mengarah dan menghindari rintangan yang datang. Makin cepat dan ramai. Menyentuh apa pun mengakhiri ronde.'],
      ru: ['Веди, чтобы рулить', 'Авария!', 'Конец!', 'Веди влево или вправо, чтобы рулить и уклоняться от летящих препятствий. Становится быстрее и плотнее. Касание чего-либо завершает раунд.'],
      de: ['Ziehen zum Lenken', 'Crash!', 'Aus!', 'Ziehe nach links oder rechts, um zu lenken und den entgegenkommenden Hindernissen auszuweichen. Es wird schneller und voller. Etwas zu berühren beendet die Runde.'],
      hi: ['चलाने को खींचें', 'टक्कर!', 'खत्म!', 'चलाने और आ रही बाधाओं से बचने के लिए बाएँ या दाएँ खींचें। यह तेज़ और भीड़भाड़ वाला होता जाता है। किसी भी चीज़ को छूना राउंड खत्म कर देता है।'],
      zh: ['拖动操控', '撞上了！', '结束！', '左右拖动操控，躲避迎面而来的障碍。会越来越快、越来越挤。碰到任何东西，本回合结束。']
    },
    applecatch: {
      en: ['Drag to catch', 'Missed it!', 'Over!', 'Drag left or right to move and catch the good things as they fall. Dodge the bad ones. It gets faster and busier. Missing a good one — or catching a bad one — ends the round.', 'Wrong catch!'],
      fr: ['Glisse pour attraper', 'Raté !', 'Terminé !', 'Glisse à gauche ou à droite pour attraper les bonnes choses qui tombent. Évite les mauvaises. Ça devient plus rapide et plus chargé. Rater une bonne — ou attraper une mauvaise — termine la partie.', 'Mauvaise prise !'],
      es: ['Desliza para atrapar', '¡Fallaste!', '¡Fin!', 'Desliza a izquierda o derecha para atrapar las cosas buenas que caen. Esquiva las malas. Se vuelve más rápido y concurrido. Fallar una buena — o atrapar una mala — termina la ronda.', '¡Mala atrapada!'],
      pt: ['Deslize para pegar', 'Perdeu!', 'Fim!', 'Deslize para a esquerda ou direita para pegar as coisas boas que caem. Desvie das ruins. Fica mais rápido e cheio. Perder uma boa — ou pegar uma ruim — encerra a rodada.', 'Pegou a errada!'],
      ar: ['اسحب للالتقاط', 'فاتك!', 'انتهى!', 'اسحب يسارًا أو يمينًا لالتقاط الأشياء الجيدة المتساقطة. تفادَ السيئة. يصبح أسرع وأكثر ازدحامًا. تفويت جيدة — أو التقاط سيئة — ينهي الجولة.', 'التقاط خاطئ!'],
      tr: ['Yakalamak için kaydır', 'Kaçırdın!', 'Bitti!', 'Düşen iyi şeyleri yakalamak için sola ya da sağa kaydır. Kötülerden kaç. Daha hızlı ve kalabalık olur. İyisini kaçırmak — ya da kötüsünü yakalamak — turu bitirir.', 'Yanlış yakalama!'],
      vi: ['Kéo để hứng', 'Hụt rồi!', 'Hết!', 'Kéo trái hoặc phải để hứng những thứ tốt đang rơi. Né những thứ xấu. Ngày càng nhanh và đông. Hụt thứ tốt — hoặc hứng thứ xấu — là kết thúc ván.', 'Hứng nhầm rồi!'],
      id: ['Geser untuk menangkap', 'Terlewat!', 'Selesai!', 'Geser ke kiri atau kanan untuk menangkap benda bagus yang jatuh. Hindari yang buruk. Makin cepat dan ramai. Melewatkan yang bagus — atau menangkap yang buruk — mengakhiri ronde.', 'Salah tangkap!'],
      ru: ['Веди, чтобы ловить', 'Мимо!', 'Конец!', 'Веди влево или вправо, чтобы ловить падающие хорошие вещи. Уклоняйся от плохих. Становится быстрее и плотнее. Упустить хорошую — или поймать плохую — завершает раунд.', 'Не то поймал!'],
      de: ['Ziehen zum Fangen', 'Verpasst!', 'Aus!', 'Ziehe nach links oder rechts, um die guten Dinge zu fangen, die fallen. Weiche den schlechten aus. Es wird schneller und voller. Eine gute zu verpassen — oder eine schlechte zu fangen — beendet die Runde.', 'Falsch gefangen!'],
      hi: ['पकड़ने को खींचें', 'चूक गए!', 'खत्म!', 'गिरती अच्छी चीज़ें पकड़ने के लिए बाएँ या दाएँ खींचें। बुरी से बचें। यह तेज़ और व्यस्त होता जाता है। अच्छी चूकना — या बुरी पकड़ना — राउंड खत्म कर देता है।', 'गलत पकड़!'],
      zh: ['拖动接取', '没接住！', '结束！', '左右拖动接住掉落的好东西，躲开坏的。会越来越快、越来越密。漏掉好的——或接到坏的——本回合结束。', '接错了！']
    },
    acorncatch: {
      en: ['Drag to catch', 'Missed it!', 'Over!', 'Drag left or right to move and catch the good things as they fall. Dodge the bad ones. It gets faster and busier. Missing a good one — or catching a bad one — ends the round.', 'Wrong catch!'],
      fr: ['Glisse pour attraper', 'Raté !', 'Terminé !', 'Glisse à gauche ou à droite pour attraper les bonnes choses qui tombent. Évite les mauvaises. Ça devient plus rapide et plus chargé. Rater une bonne — ou attraper une mauvaise — termine la partie.', 'Mauvaise prise !'],
      es: ['Desliza para atrapar', '¡Fallaste!', '¡Fin!', 'Desliza a izquierda o derecha para atrapar las cosas buenas que caen. Esquiva las malas. Se vuelve más rápido y concurrido. Fallar una buena — o atrapar una mala — termina la ronda.', '¡Mala atrapada!'],
      pt: ['Deslize para pegar', 'Perdeu!', 'Fim!', 'Deslize para a esquerda ou direita para pegar as coisas boas que caem. Desvie das ruins. Fica mais rápido e cheio. Perder uma boa — ou pegar uma ruim — encerra a rodada.', 'Pegou a errada!'],
      ar: ['اسحب للالتقاط', 'فاتك!', 'انتهى!', 'اسحب يسارًا أو يمينًا لالتقاط الأشياء الجيدة المتساقطة. تفادَ السيئة. يصبح أسرع وأكثر ازدحامًا. تفويت جيدة — أو التقاط سيئة — ينهي الجولة.', 'التقاط خاطئ!'],
      tr: ['Yakalamak için kaydır', 'Kaçırdın!', 'Bitti!', 'Düşen iyi şeyleri yakalamak için sola ya da sağa kaydır. Kötülerden kaç. Daha hızlı ve kalabalık olur. İyisini kaçırmak — ya da kötüsünü yakalamak — turu bitirir.', 'Yanlış yakalama!'],
      vi: ['Kéo để hứng', 'Hụt rồi!', 'Hết!', 'Kéo trái hoặc phải để hứng những thứ tốt đang rơi. Né những thứ xấu. Ngày càng nhanh và đông. Hụt thứ tốt — hoặc hứng thứ xấu — là kết thúc ván.', 'Hứng nhầm rồi!'],
      id: ['Geser untuk menangkap', 'Terlewat!', 'Selesai!', 'Geser ke kiri atau kanan untuk menangkap benda bagus yang jatuh. Hindari yang buruk. Makin cepat dan ramai. Melewatkan yang bagus — atau menangkap yang buruk — mengakhiri ronde.', 'Salah tangkap!'],
      ru: ['Веди, чтобы ловить', 'Мимо!', 'Конец!', 'Веди влево или вправо, чтобы ловить падающие хорошие вещи. Уклоняйся от плохих. Становится быстрее и плотнее. Упустить хорошую — или поймать плохую — завершает раунд.', 'Не то поймал!'],
      de: ['Ziehen zum Fangen', 'Verpasst!', 'Aus!', 'Ziehe nach links oder rechts, um die guten Dinge zu fangen, die fallen. Weiche den schlechten aus. Es wird schneller und voller. Eine gute zu verpassen — oder eine schlechte zu fangen — beendet die Runde.', 'Falsch gefangen!'],
      hi: ['पकड़ने को खींचें', 'चूक गए!', 'खत्म!', 'गिरती अच्छी चीज़ें पकड़ने के लिए बाएँ या दाएँ खींचें। बुरी से बचें। यह तेज़ और व्यस्त होता जाता है। अच्छी चूकना — या बुरी पकड़ना — राउंड खत्म कर देता है।', 'गलत पकड़!'],
      zh: ['拖动接取', '没接住！', '结束！', '左右拖动接住掉落的好东西，躲开坏的。会越来越快、越来越密。漏掉好的——或接到坏的——本回合结束。', '接错了！']
    },
    cavebat: {
      en: ['Tap to fly up', 'Crashed!', 'Collapse!', 'Tap to rise; let go and you drop. Fly through the gaps without touching the walls. It gets faster and the gaps get tighter. Hitting a wall ends the round.'],
      fr: ['Touche pour monter', 'Écrasé !', 'Effondrement !', 'Touche pour monter ; relâche et tu descends. Passe par les trous sans toucher les parois. Ça accélère et les trous se resserrent. Toucher une paroi termine la partie.'],
      es: ['Toca para subir', '¡Te estrellaste!', '¡Derrumbe!', 'Toca para subir; suelta y bajas. Pasa por los huecos sin tocar las paredes. Se acelera y los huecos se estrechan. Tocar una pared termina la ronda.'],
      pt: ['Toque para subir', 'Bateu!', 'Desabamento!', 'Toque para subir; solte e você desce. Passe pelos vãos sem tocar nas paredes. Acelera e os vãos apertam. Tocar numa parede encerra a rodada.'],
      ar: ['المس للصعود', 'اصطدمت!', 'انهيار!', 'المس لتصعد؛ اترك فتهبط. مُرّ عبر الفجوات دون لمس الجدران. يتسارع وتضيق الفجوات. لمس جدار ينهي الجولة.'],
      tr: ['Yükselmek için dokun', 'Çarptın!', 'Çöküş!', 'Yükselmek için dokun; bırak, düşersin. Duvarlara değmeden boşluklardan geç. Hızlanır ve boşluklar daralır. Bir duvara çarpmak turu bitirir.'],
      vi: ['Chạm để bay lên', 'Đâm rồi!', 'Sập!', 'Chạm để bay lên; thả ra thì rơi. Bay qua các khe hở mà không chạm tường. Nhanh dần và khe hẹp dần. Chạm tường là kết thúc ván.'],
      id: ['Ketuk untuk naik', 'Menabrak!', 'Runtuh!', 'Ketuk untuk naik; lepas maka turun. Lewati celah tanpa menyentuh dinding. Makin cepat dan celah menyempit. Menyentuh dinding mengakhiri ronde.'],
      ru: ['Коснись, чтобы взлететь', 'Разбился!', 'Обвал!', 'Касайся, чтобы подниматься; отпусти — падаешь. Пролетай в просветы, не задевая стены. Быстрее, просветы уже. Удар о стену завершает раунд.'],
      de: ['Tippen zum Steigen', 'Zerschellt!', 'Einsturz!', 'Tippe zum Steigen; loslassen, dann sinkst du. Flieg durch die Lücken, ohne die Wände zu berühren. Es wird schneller und enger. Eine Wand zu berühren beendet die Runde.'],
      hi: ['ऊपर जाने को छुएं', 'टकरा गए!', 'ढह गया!', 'ऊपर उठने को छुएं; छोड़ें तो गिरते हैं। दीवार छुए बिना खाली जगहों से निकलें। तेज़ होता है, जगह सँकरी। दीवार से टकराना राउंड खत्म कर देता है।'],
      zh: ['点击上升', '撞毁了！', '坍塌！', '点击上升，松开就下落。穿过缺口，不要碰到墙壁。会越来越快、缺口越来越窄。碰到墙壁，本回合结束。']
    },
    rocketcave: {
      en: ['Tap to fly up', 'Crashed!', 'Collapse!', 'Tap to rise; let go and you drop. Fly through the gaps without touching the walls. It gets faster and the gaps get tighter. Hitting a wall ends the round.'],
      fr: ['Touche pour monter', 'Écrasé !', 'Effondrement !', 'Touche pour monter ; relâche et tu descends. Passe par les trous sans toucher les parois. Ça accélère et les trous se resserrent. Toucher une paroi termine la partie.'],
      es: ['Toca para subir', '¡Te estrellaste!', '¡Derrumbe!', 'Toca para subir; suelta y bajas. Pasa por los huecos sin tocar las paredes. Se acelera y los huecos se estrechan. Tocar una pared termina la ronda.'],
      pt: ['Toque para subir', 'Bateu!', 'Desabamento!', 'Toque para subir; solte e você desce. Passe pelos vãos sem tocar nas paredes. Acelera e os vãos apertam. Tocar numa parede encerra a rodada.'],
      ar: ['المس للصعود', 'اصطدمت!', 'انهيار!', 'المس لتصعد؛ اترك فتهبط. مُرّ عبر الفجوات دون لمس الجدران. يتسارع وتضيق الفجوات. لمس جدار ينهي الجولة.'],
      tr: ['Yükselmek için dokun', 'Çarptın!', 'Çöküş!', 'Yükselmek için dokun; bırak, düşersin. Duvarlara değmeden boşluklardan geç. Hızlanır ve boşluklar daralır. Bir duvara çarpmak turu bitirir.'],
      vi: ['Chạm để bay lên', 'Đâm rồi!', 'Sập!', 'Chạm để bay lên; thả ra thì rơi. Bay qua các khe hở mà không chạm tường. Nhanh dần và khe hẹp dần. Chạm tường là kết thúc ván.'],
      id: ['Ketuk untuk naik', 'Menabrak!', 'Runtuh!', 'Ketuk untuk naik; lepas maka turun. Lewati celah tanpa menyentuh dinding. Makin cepat dan celah menyempit. Menyentuh dinding mengakhiri ronde.'],
      ru: ['Коснись, чтобы взлететь', 'Разбился!', 'Обвал!', 'Касайся, чтобы подниматься; отпусти — падаешь. Пролетай в просветы, не задевая стены. Быстрее, просветы уже. Удар о стену завершает раунд.'],
      de: ['Tippen zum Steigen', 'Zerschellt!', 'Einsturz!', 'Tippe zum Steigen; loslassen, dann sinkst du. Flieg durch die Lücken, ohne die Wände zu berühren. Es wird schneller und enger. Eine Wand zu berühren beendet die Runde.'],
      hi: ['ऊपर जाने को छुएं', 'टकरा गए!', 'ढह गया!', 'ऊपर उठने को छुएं; छोड़ें तो गिरते हैं। दीवार छुए बिना खाली जगहों से निकलें। तेज़ होता है, जगह सँकरी। दीवार से टकराना राउंड खत्म कर देता है।'],
      zh: ['点击上升', '撞毁了！', '坍塌！', '点击上升，松开就下落。穿过缺口，不要碰到墙壁。会越来越快、缺口越来越窄。碰到墙壁，本回合结束。']
    },
    kayakrush: {
      en: ['Drag to steer', 'Crash!', 'Wipeout!', 'Drag left or right to steer and weave through the obstacles coming at you. It gets faster and more crowded. Touching anything ends the round.'],
      fr: ['Glisse pour diriger', 'Accident !', 'Terminé !', 'Glisse à gauche ou à droite pour diriger et te faufiler entre les obstacles qui arrivent. Ça devient plus rapide et plus chargé. Toucher quelque chose termine la partie.'],
      es: ['Desliza para dirigir', '¡Choque!', '¡Fuera!', 'Desliza a izquierda o derecha para dirigir y esquivar los obstáculos que vienen. Se vuelve más rápido y concurrido. Tocar algo termina la ronda.'],
      pt: ['Deslize para dirigir', 'Batida!', 'Acabou!', 'Deslize para a esquerda ou direita para dirigir e desviar dos obstáculos que vêm. Fica mais rápido e cheio. Tocar em algo encerra a rodada.'],
      ar: ['اسحب للتوجيه', 'تحطّم!', 'انتهى!', 'اسحب يسارًا أو يمينًا للتوجيه والتفاف بين العوائق القادمة. يصبح أسرع وأكثر ازدحامًا. لمس أي شيء ينهي الجولة.'],
      tr: ['Yönlendirmek için kaydır', 'Kaza!', 'Bitti!', 'Yönlendirip gelen engellerin arasından geçmek için sola ya da sağa kaydır. Daha hızlı ve kalabalık olur. Bir şeye değmek turu bitirir.'],
      vi: ['Kéo để lái', 'Tông rồi!', 'Hết!', 'Kéo trái hoặc phải để lái và né các chướng ngại vật đang lao tới. Ngày càng nhanh và đông. Chạm vào bất cứ thứ gì là kết thúc ván.'],
      id: ['Geser untuk mengarah', 'Tabrakan!', 'Selesai!', 'Geser ke kiri atau kanan untuk mengarah dan menghindari rintangan yang datang. Makin cepat dan ramai. Menyentuh apa pun mengakhiri ronde.'],
      ru: ['Веди, чтобы рулить', 'Авария!', 'Конец!', 'Веди влево или вправо, чтобы рулить и уклоняться от летящих препятствий. Становится быстрее и плотнее. Касание чего-либо завершает раунд.'],
      de: ['Ziehen zum Lenken', 'Crash!', 'Aus!', 'Ziehe nach links oder rechts, um zu lenken und den entgegenkommenden Hindernissen auszuweichen. Es wird schneller und voller. Etwas zu berühren beendet die Runde.'],
      hi: ['चलाने को खींचें', 'टक्कर!', 'खत्म!', 'चलाने और आ रही बाधाओं से बचने के लिए बाएँ या दाएँ खींचें। यह तेज़ और भीड़भाड़ वाला होता जाता है। किसी भी चीज़ को छूना राउंड खत्म कर देता है।'],
      zh: ['拖动操控', '撞上了！', '结束！', '左右拖动操控，躲避迎面而来的障碍。会越来越快、越来越挤。碰到任何东西，本回合结束。']
    },
    neonrider: {
      en: ['Drag to steer', 'Crash!', 'Wipeout!', 'Drag left or right to steer and weave through the obstacles coming at you. It gets faster and more crowded. Touching anything ends the round.'],
      fr: ['Glisse pour diriger', 'Accident !', 'Terminé !', 'Glisse à gauche ou à droite pour diriger et te faufiler entre les obstacles qui arrivent. Ça devient plus rapide et plus chargé. Toucher quelque chose termine la partie.'],
      es: ['Desliza para dirigir', '¡Choque!', '¡Fuera!', 'Desliza a izquierda o derecha para dirigir y esquivar los obstáculos que vienen. Se vuelve más rápido y concurrido. Tocar algo termina la ronda.'],
      pt: ['Deslize para dirigir', 'Batida!', 'Acabou!', 'Deslize para a esquerda ou direita para dirigir e desviar dos obstáculos que vêm. Fica mais rápido e cheio. Tocar em algo encerra a rodada.'],
      ar: ['اسحب للتوجيه', 'تحطّم!', 'انتهى!', 'اسحب يسارًا أو يمينًا للتوجيه والتفاف بين العوائق القادمة. يصبح أسرع وأكثر ازدحامًا. لمس أي شيء ينهي الجولة.'],
      tr: ['Yönlendirmek için kaydır', 'Kaza!', 'Bitti!', 'Yönlendirip gelen engellerin arasından geçmek için sola ya da sağa kaydır. Daha hızlı ve kalabalık olur. Bir şeye değmek turu bitirir.'],
      vi: ['Kéo để lái', 'Tông rồi!', 'Hết!', 'Kéo trái hoặc phải để lái và né các chướng ngại vật đang lao tới. Ngày càng nhanh và đông. Chạm vào bất cứ thứ gì là kết thúc ván.'],
      id: ['Geser untuk mengarah', 'Tabrakan!', 'Selesai!', 'Geser ke kiri atau kanan untuk mengarah dan menghindari rintangan yang datang. Makin cepat dan ramai. Menyentuh apa pun mengakhiri ronde.'],
      ru: ['Веди, чтобы рулить', 'Авария!', 'Конец!', 'Веди влево или вправо, чтобы рулить и уклоняться от летящих препятствий. Становится быстрее и плотнее. Касание чего-либо завершает раунд.'],
      de: ['Ziehen zum Lenken', 'Crash!', 'Aus!', 'Ziehe nach links oder rechts, um zu lenken und den entgegenkommenden Hindernissen auszuweichen. Es wird schneller und voller. Etwas zu berühren beendet die Runde.'],
      hi: ['चलाने को खींचें', 'टक्कर!', 'खत्म!', 'चलाने और आ रही बाधाओं से बचने के लिए बाएँ या दाएँ खींचें। यह तेज़ और भीड़भाड़ वाला होता जाता है। किसी भी चीज़ को छूना राउंड खत्म कर देता है।'],
      zh: ['拖动操控', '撞上了！', '结束！', '左右拖动操控，躲避迎面而来的障碍。会越来越快、越来越挤。碰到任何东西，本回合结束。']
    },
    pizzacatch: {
      en: ['Drag to catch', 'Missed it!', 'Over!', 'Drag left or right to move and catch the good things as they fall. Dodge the bad ones. It gets faster and busier. Missing a good one — or catching a bad one — ends the round.', 'Wrong catch!'],
      fr: ['Glisse pour attraper', 'Raté !', 'Terminé !', 'Glisse à gauche ou à droite pour attraper les bonnes choses qui tombent. Évite les mauvaises. Ça devient plus rapide et plus chargé. Rater une bonne — ou attraper une mauvaise — termine la partie.', 'Mauvaise prise !'],
      es: ['Desliza para atrapar', '¡Fallaste!', '¡Fin!', 'Desliza a izquierda o derecha para atrapar las cosas buenas que caen. Esquiva las malas. Se vuelve más rápido y concurrido. Fallar una buena — o atrapar una mala — termina la ronda.', '¡Mala atrapada!'],
      pt: ['Deslize para pegar', 'Perdeu!', 'Fim!', 'Deslize para a esquerda ou direita para pegar as coisas boas que caem. Desvie das ruins. Fica mais rápido e cheio. Perder uma boa — ou pegar uma ruim — encerra a rodada.', 'Pegou a errada!'],
      ar: ['اسحب للالتقاط', 'فاتك!', 'انتهى!', 'اسحب يسارًا أو يمينًا لالتقاط الأشياء الجيدة المتساقطة. تفادَ السيئة. يصبح أسرع وأكثر ازدحامًا. تفويت جيدة — أو التقاط سيئة — ينهي الجولة.', 'التقاط خاطئ!'],
      tr: ['Yakalamak için kaydır', 'Kaçırdın!', 'Bitti!', 'Düşen iyi şeyleri yakalamak için sola ya da sağa kaydır. Kötülerden kaç. Daha hızlı ve kalabalık olur. İyisini kaçırmak — ya da kötüsünü yakalamak — turu bitirir.', 'Yanlış yakalama!'],
      vi: ['Kéo để hứng', 'Hụt rồi!', 'Hết!', 'Kéo trái hoặc phải để hứng những thứ tốt đang rơi. Né những thứ xấu. Ngày càng nhanh và đông. Hụt thứ tốt — hoặc hứng thứ xấu — là kết thúc ván.', 'Hứng nhầm rồi!'],
      id: ['Geser untuk menangkap', 'Terlewat!', 'Selesai!', 'Geser ke kiri atau kanan untuk menangkap benda bagus yang jatuh. Hindari yang buruk. Makin cepat dan ramai. Melewatkan yang bagus — atau menangkap yang buruk — mengakhiri ronde.', 'Salah tangkap!'],
      ru: ['Веди, чтобы ловить', 'Мимо!', 'Конец!', 'Веди влево или вправо, чтобы ловить падающие хорошие вещи. Уклоняйся от плохих. Становится быстрее и плотнее. Упустить хорошую — или поймать плохую — завершает раунд.', 'Не то поймал!'],
      de: ['Ziehen zum Fangen', 'Verpasst!', 'Aus!', 'Ziehe nach links oder rechts, um die guten Dinge zu fangen, die fallen. Weiche den schlechten aus. Es wird schneller und voller. Eine gute zu verpassen — oder eine schlechte zu fangen — beendet die Runde.', 'Falsch gefangen!'],
      hi: ['पकड़ने को खींचें', 'चूक गए!', 'खत्म!', 'गिरती अच्छी चीज़ें पकड़ने के लिए बाएँ या दाएँ खींचें। बुरी से बचें। यह तेज़ और व्यस्त होता जाता है। अच्छी चूकना — या बुरी पकड़ना — राउंड खत्म कर देता है।', 'गलत पकड़!'],
      zh: ['拖动接取', '没接住！', '结束！', '左右拖动接住掉落的好东西，躲开坏的。会越来越快、越来越密。漏掉好的——或接到坏的——本回合结束。', '接错了！']
    },
    petalcatch: {
      en: ['Drag to catch', 'Missed it!', 'Over!', 'Drag left or right to move and catch the good things as they fall. Dodge the bad ones. It gets faster and busier. Missing a good one — or catching a bad one — ends the round.', 'Wrong catch!'],
      fr: ['Glisse pour attraper', 'Raté !', 'Terminé !', 'Glisse à gauche ou à droite pour attraper les bonnes choses qui tombent. Évite les mauvaises. Ça devient plus rapide et plus chargé. Rater une bonne — ou attraper une mauvaise — termine la partie.', 'Mauvaise prise !'],
      es: ['Desliza para atrapar', '¡Fallaste!', '¡Fin!', 'Desliza a izquierda o derecha para atrapar las cosas buenas que caen. Esquiva las malas. Se vuelve más rápido y concurrido. Fallar una buena — o atrapar una mala — termina la ronda.', '¡Mala atrapada!'],
      pt: ['Deslize para pegar', 'Perdeu!', 'Fim!', 'Deslize para a esquerda ou direita para pegar as coisas boas que caem. Desvie das ruins. Fica mais rápido e cheio. Perder uma boa — ou pegar uma ruim — encerra a rodada.', 'Pegou a errada!'],
      ar: ['اسحب للالتقاط', 'فاتك!', 'انتهى!', 'اسحب يسارًا أو يمينًا لالتقاط الأشياء الجيدة المتساقطة. تفادَ السيئة. يصبح أسرع وأكثر ازدحامًا. تفويت جيدة — أو التقاط سيئة — ينهي الجولة.', 'التقاط خاطئ!'],
      tr: ['Yakalamak için kaydır', 'Kaçırdın!', 'Bitti!', 'Düşen iyi şeyleri yakalamak için sola ya da sağa kaydır. Kötülerden kaç. Daha hızlı ve kalabalık olur. İyisini kaçırmak — ya da kötüsünü yakalamak — turu bitirir.', 'Yanlış yakalama!'],
      vi: ['Kéo để hứng', 'Hụt rồi!', 'Hết!', 'Kéo trái hoặc phải để hứng những thứ tốt đang rơi. Né những thứ xấu. Ngày càng nhanh và đông. Hụt thứ tốt — hoặc hứng thứ xấu — là kết thúc ván.', 'Hứng nhầm rồi!'],
      id: ['Geser untuk menangkap', 'Terlewat!', 'Selesai!', 'Geser ke kiri atau kanan untuk menangkap benda bagus yang jatuh. Hindari yang buruk. Makin cepat dan ramai. Melewatkan yang bagus — atau menangkap yang buruk — mengakhiri ronde.', 'Salah tangkap!'],
      ru: ['Веди, чтобы ловить', 'Мимо!', 'Конец!', 'Веди влево или вправо, чтобы ловить падающие хорошие вещи. Уклоняйся от плохих. Становится быстрее и плотнее. Упустить хорошую — или поймать плохую — завершает раунд.', 'Не то поймал!'],
      de: ['Ziehen zum Fangen', 'Verpasst!', 'Aus!', 'Ziehe nach links oder rechts, um die guten Dinge zu fangen, die fallen. Weiche den schlechten aus. Es wird schneller und voller. Eine gute zu verpassen — oder eine schlechte zu fangen — beendet die Runde.', 'Falsch gefangen!'],
      hi: ['पकड़ने को खींचें', 'चूक गए!', 'खत्म!', 'गिरती अच्छी चीज़ें पकड़ने के लिए बाएँ या दाएँ खींचें। बुरी से बचें। यह तेज़ और व्यस्त होता जाता है। अच्छी चूकना — या बुरी पकड़ना — राउंड खत्म कर देता है।', 'गलत पकड़!'],
      zh: ['拖动接取', '没接住！', '结束！', '左右拖动接住掉落的好东西，躲开坏的。会越来越快、越来越密。漏掉好的——或接到坏的——本回合结束。', '接错了！']
    },
    owlflight: {
      en: ['Tap to fly up', 'Crashed!', 'Collapse!', 'Tap to rise; let go and you drop. Fly through the gaps without touching the walls. It gets faster and the gaps get tighter. Hitting a wall ends the round.'],
      fr: ['Touche pour monter', 'Écrasé !', 'Effondrement !', 'Touche pour monter ; relâche et tu descends. Passe par les trous sans toucher les parois. Ça accélère et les trous se resserrent. Toucher une paroi termine la partie.'],
      es: ['Toca para subir', '¡Te estrellaste!', '¡Derrumbe!', 'Toca para subir; suelta y bajas. Pasa por los huecos sin tocar las paredes. Se acelera y los huecos se estrechan. Tocar una pared termina la ronda.'],
      pt: ['Toque para subir', 'Bateu!', 'Desabamento!', 'Toque para subir; solte e você desce. Passe pelos vãos sem tocar nas paredes. Acelera e os vãos apertam. Tocar numa parede encerra a rodada.'],
      ar: ['المس للصعود', 'اصطدمت!', 'انهيار!', 'المس لتصعد؛ اترك فتهبط. مُرّ عبر الفجوات دون لمس الجدران. يتسارع وتضيق الفجوات. لمس جدار ينهي الجولة.'],
      tr: ['Yükselmek için dokun', 'Çarptın!', 'Çöküş!', 'Yükselmek için dokun; bırak, düşersin. Duvarlara değmeden boşluklardan geç. Hızlanır ve boşluklar daralır. Bir duvara çarpmak turu bitirir.'],
      vi: ['Chạm để bay lên', 'Đâm rồi!', 'Sập!', 'Chạm để bay lên; thả ra thì rơi. Bay qua các khe hở mà không chạm tường. Nhanh dần và khe hẹp dần. Chạm tường là kết thúc ván.'],
      id: ['Ketuk untuk naik', 'Menabrak!', 'Runtuh!', 'Ketuk untuk naik; lepas maka turun. Lewati celah tanpa menyentuh dinding. Makin cepat dan celah menyempit. Menyentuh dinding mengakhiri ronde.'],
      ru: ['Коснись, чтобы взлететь', 'Разбился!', 'Обвал!', 'Касайся, чтобы подниматься; отпусти — падаешь. Пролетай в просветы, не задевая стены. Быстрее, просветы уже. Удар о стену завершает раунд.'],
      de: ['Tippen zum Steigen', 'Zerschellt!', 'Einsturz!', 'Tippe zum Steigen; loslassen, dann sinkst du. Flieg durch die Lücken, ohne die Wände zu berühren. Es wird schneller und enger. Eine Wand zu berühren beendet die Runde.'],
      hi: ['ऊपर जाने को छुएं', 'टकरा गए!', 'ढह गया!', 'ऊपर उठने को छुएं; छोड़ें तो गिरते हैं। दीवार छुए बिना खाली जगहों से निकलें। तेज़ होता है, जगह सँकरी। दीवार से टकराना राउंड खत्म कर देता है।'],
      zh: ['点击上升', '撞毁了！', '坍塌！', '点击上升，松开就下落。穿过缺口，不要碰到墙壁。会越来越快、缺口越来越窄。碰到墙壁，本回合结束。']
    },
    coralfish: {
      en: ['Tap to fly up', 'Crashed!', 'Collapse!', 'Tap to rise; let go and you drop. Fly through the gaps without touching the walls. It gets faster and the gaps get tighter. Hitting a wall ends the round.'],
      fr: ['Touche pour monter', 'Écrasé !', 'Effondrement !', 'Touche pour monter ; relâche et tu descends. Passe par les trous sans toucher les parois. Ça accélère et les trous se resserrent. Toucher une paroi termine la partie.'],
      es: ['Toca para subir', '¡Te estrellaste!', '¡Derrumbe!', 'Toca para subir; suelta y bajas. Pasa por los huecos sin tocar las paredes. Se acelera y los huecos se estrechan. Tocar una pared termina la ronda.'],
      pt: ['Toque para subir', 'Bateu!', 'Desabamento!', 'Toque para subir; solte e você desce. Passe pelos vãos sem tocar nas paredes. Acelera e os vãos apertam. Tocar numa parede encerra a rodada.'],
      ar: ['المس للصعود', 'اصطدمت!', 'انهيار!', 'المس لتصعد؛ اترك فتهبط. مُرّ عبر الفجوات دون لمس الجدران. يتسارع وتضيق الفجوات. لمس جدار ينهي الجولة.'],
      tr: ['Yükselmek için dokun', 'Çarptın!', 'Çöküş!', 'Yükselmek için dokun; bırak, düşersin. Duvarlara değmeden boşluklardan geç. Hızlanır ve boşluklar daralır. Bir duvara çarpmak turu bitirir.'],
      vi: ['Chạm để bay lên', 'Đâm rồi!', 'Sập!', 'Chạm để bay lên; thả ra thì rơi. Bay qua các khe hở mà không chạm tường. Nhanh dần và khe hẹp dần. Chạm tường là kết thúc ván.'],
      id: ['Ketuk untuk naik', 'Menabrak!', 'Runtuh!', 'Ketuk untuk naik; lepas maka turun. Lewati celah tanpa menyentuh dinding. Makin cepat dan celah menyempit. Menyentuh dinding mengakhiri ronde.'],
      ru: ['Коснись, чтобы взлететь', 'Разбился!', 'Обвал!', 'Касайся, чтобы подниматься; отпусти — падаешь. Пролетай в просветы, не задевая стены. Быстрее, просветы уже. Удар о стену завершает раунд.'],
      de: ['Tippen zum Steigen', 'Zerschellt!', 'Einsturz!', 'Tippe zum Steigen; loslassen, dann sinkst du. Flieg durch die Lücken, ohne die Wände zu berühren. Es wird schneller und enger. Eine Wand zu berühren beendet die Runde.'],
      hi: ['ऊपर जाने को छुएं', 'टकरा गए!', 'ढह गया!', 'ऊपर उठने को छुएं; छोड़ें तो गिरते हैं। दीवार छुए बिना खाली जगहों से निकलें। तेज़ होता है, जगह सँकरी। दीवार से टकराना राउंड खत्म कर देता है।'],
      zh: ['点击上升', '撞毁了！', '坍塌！', '点击上升，松开就下落。穿过缺口，不要碰到墙壁。会越来越快、缺口越来越窄。碰到墙壁，本回合结束。']
    },
    balloonup: {
      en: ['Tap to fly up', 'Crashed!', 'Collapse!', 'Tap to rise; let go and you drop. Fly through the gaps without touching the walls. It gets faster and the gaps get tighter. Hitting a wall ends the round.'],
      fr: ['Touche pour monter', 'Écrasé !', 'Effondrement !', 'Touche pour monter ; relâche et tu descends. Passe par les trous sans toucher les parois. Ça accélère et les trous se resserrent. Toucher une paroi termine la partie.'],
      es: ['Toca para subir', '¡Te estrellaste!', '¡Derrumbe!', 'Toca para subir; suelta y bajas. Pasa por los huecos sin tocar las paredes. Se acelera y los huecos se estrechan. Tocar una pared termina la ronda.'],
      pt: ['Toque para subir', 'Bateu!', 'Desabamento!', 'Toque para subir; solte e você desce. Passe pelos vãos sem tocar nas paredes. Acelera e os vãos apertam. Tocar numa parede encerra a rodada.'],
      ar: ['المس للصعود', 'اصطدمت!', 'انهيار!', 'المس لتصعد؛ اترك فتهبط. مُرّ عبر الفجوات دون لمس الجدران. يتسارع وتضيق الفجوات. لمس جدار ينهي الجولة.'],
      tr: ['Yükselmek için dokun', 'Çarptın!', 'Çöküş!', 'Yükselmek için dokun; bırak, düşersin. Duvarlara değmeden boşluklardan geç. Hızlanır ve boşluklar daralır. Bir duvara çarpmak turu bitirir.'],
      vi: ['Chạm để bay lên', 'Đâm rồi!', 'Sập!', 'Chạm để bay lên; thả ra thì rơi. Bay qua các khe hở mà không chạm tường. Nhanh dần và khe hẹp dần. Chạm tường là kết thúc ván.'],
      id: ['Ketuk untuk naik', 'Menabrak!', 'Runtuh!', 'Ketuk untuk naik; lepas maka turun. Lewati celah tanpa menyentuh dinding. Makin cepat dan celah menyempit. Menyentuh dinding mengakhiri ronde.'],
      ru: ['Коснись, чтобы взлететь', 'Разбился!', 'Обвал!', 'Касайся, чтобы подниматься; отпусти — падаешь. Пролетай в просветы, не задевая стены. Быстрее, просветы уже. Удар о стену завершает раунд.'],
      de: ['Tippen zum Steigen', 'Zerschellt!', 'Einsturz!', 'Tippe zum Steigen; loslassen, dann sinkst du. Flieg durch die Lücken, ohne die Wände zu berühren. Es wird schneller und enger. Eine Wand zu berühren beendet die Runde.'],
      hi: ['ऊपर जाने को छुएं', 'टकरा गए!', 'ढह गया!', 'ऊपर उठने को छुएं; छोड़ें तो गिरते हैं। दीवार छुए बिना खाली जगहों से निकलें। तेज़ होता है, जगह सँकरी। दीवार से टकराना राउंड खत्म कर देता है।'],
      zh: ['点击上升', '撞毁了！', '坍塌！', '点击上升，松开就下落。穿过缺口，不要碰到墙壁。会越来越快、缺口越来越窄。碰到墙壁，本回合结束。']
    },
    candycatch: {
      en: ['Drag to catch', 'Missed it!', 'Over!', 'Drag left or right to move and catch the good things as they fall. Dodge the bad ones. It gets faster and busier. Missing a good one — or catching a bad one — ends the round.', 'Wrong catch!'],
      fr: ['Glisse pour attraper', 'Raté !', 'Terminé !', 'Glisse à gauche ou à droite pour attraper les bonnes choses qui tombent. Évite les mauvaises. Ça devient plus rapide et plus chargé. Rater une bonne — ou attraper une mauvaise — termine la partie.', 'Mauvaise prise !'],
      es: ['Desliza para atrapar', '¡Fallaste!', '¡Fin!', 'Desliza a izquierda o derecha para atrapar las cosas buenas que caen. Esquiva las malas. Se vuelve más rápido y concurrido. Fallar una buena — o atrapar una mala — termina la ronda.', '¡Mala atrapada!'],
      pt: ['Deslize para pegar', 'Perdeu!', 'Fim!', 'Deslize para a esquerda ou direita para pegar as coisas boas que caem. Desvie das ruins. Fica mais rápido e cheio. Perder uma boa — ou pegar uma ruim — encerra a rodada.', 'Pegou a errada!'],
      ar: ['اسحب للالتقاط', 'فاتك!', 'انتهى!', 'اسحب يسارًا أو يمينًا لالتقاط الأشياء الجيدة المتساقطة. تفادَ السيئة. يصبح أسرع وأكثر ازدحامًا. تفويت جيدة — أو التقاط سيئة — ينهي الجولة.', 'التقاط خاطئ!'],
      tr: ['Yakalamak için kaydır', 'Kaçırdın!', 'Bitti!', 'Düşen iyi şeyleri yakalamak için sola ya da sağa kaydır. Kötülerden kaç. Daha hızlı ve kalabalık olur. İyisini kaçırmak — ya da kötüsünü yakalamak — turu bitirir.', 'Yanlış yakalama!'],
      vi: ['Kéo để hứng', 'Hụt rồi!', 'Hết!', 'Kéo trái hoặc phải để hứng những thứ tốt đang rơi. Né những thứ xấu. Ngày càng nhanh và đông. Hụt thứ tốt — hoặc hứng thứ xấu — là kết thúc ván.', 'Hứng nhầm rồi!'],
      id: ['Geser untuk menangkap', 'Terlewat!', 'Selesai!', 'Geser ke kiri atau kanan untuk menangkap benda bagus yang jatuh. Hindari yang buruk. Makin cepat dan ramai. Melewatkan yang bagus — atau menangkap yang buruk — mengakhiri ronde.', 'Salah tangkap!'],
      ru: ['Веди, чтобы ловить', 'Мимо!', 'Конец!', 'Веди влево или вправо, чтобы ловить падающие хорошие вещи. Уклоняйся от плохих. Становится быстрее и плотнее. Упустить хорошую — или поймать плохую — завершает раунд.', 'Не то поймал!'],
      de: ['Ziehen zum Fangen', 'Verpasst!', 'Aus!', 'Ziehe nach links oder rechts, um die guten Dinge zu fangen, die fallen. Weiche den schlechten aus. Es wird schneller und voller. Eine gute zu verpassen — oder eine schlechte zu fangen — beendet die Runde.', 'Falsch gefangen!'],
      hi: ['पकड़ने को खींचें', 'चूक गए!', 'खत्म!', 'गिरती अच्छी चीज़ें पकड़ने के लिए बाएँ या दाएँ खींचें। बुरी से बचें। यह तेज़ और व्यस्त होता जाता है। अच्छी चूकना — या बुरी पकड़ना — राउंड खत्म कर देता है।', 'गलत पकड़!'],
      zh: ['拖动接取', '没接住！', '结束！', '左右拖动接住掉落的好东西，躲开坏的。会越来越快、越来越密。漏掉好的——或接到坏的——本回合结束。', '接错了！']
    },
    donutcatch: {
      en: ['Drag to catch', 'Missed it!', 'Over!', 'Drag left or right to move and catch the good things as they fall. Dodge the bad ones. It gets faster and busier. Missing a good one — or catching a bad one — ends the round.', 'Wrong catch!'],
      fr: ['Glisse pour attraper', 'Raté !', 'Terminé !', 'Glisse à gauche ou à droite pour attraper les bonnes choses qui tombent. Évite les mauvaises. Ça devient plus rapide et plus chargé. Rater une bonne — ou attraper une mauvaise — termine la partie.', 'Mauvaise prise !'],
      es: ['Desliza para atrapar', '¡Fallaste!', '¡Fin!', 'Desliza a izquierda o derecha para atrapar las cosas buenas que caen. Esquiva las malas. Se vuelve más rápido y concurrido. Fallar una buena — o atrapar una mala — termina la ronda.', '¡Mala atrapada!'],
      pt: ['Deslize para pegar', 'Perdeu!', 'Fim!', 'Deslize para a esquerda ou direita para pegar as coisas boas que caem. Desvie das ruins. Fica mais rápido e cheio. Perder uma boa — ou pegar uma ruim — encerra a rodada.', 'Pegou a errada!'],
      ar: ['اسحب للالتقاط', 'فاتك!', 'انتهى!', 'اسحب يسارًا أو يمينًا لالتقاط الأشياء الجيدة المتساقطة. تفادَ السيئة. يصبح أسرع وأكثر ازدحامًا. تفويت جيدة — أو التقاط سيئة — ينهي الجولة.', 'التقاط خاطئ!'],
      tr: ['Yakalamak için kaydır', 'Kaçırdın!', 'Bitti!', 'Düşen iyi şeyleri yakalamak için sola ya da sağa kaydır. Kötülerden kaç. Daha hızlı ve kalabalık olur. İyisini kaçırmak — ya da kötüsünü yakalamak — turu bitirir.', 'Yanlış yakalama!'],
      vi: ['Kéo để hứng', 'Hụt rồi!', 'Hết!', 'Kéo trái hoặc phải để hứng những thứ tốt đang rơi. Né những thứ xấu. Ngày càng nhanh và đông. Hụt thứ tốt — hoặc hứng thứ xấu — là kết thúc ván.', 'Hứng nhầm rồi!'],
      id: ['Geser untuk menangkap', 'Terlewat!', 'Selesai!', 'Geser ke kiri atau kanan untuk menangkap benda bagus yang jatuh. Hindari yang buruk. Makin cepat dan ramai. Melewatkan yang bagus — atau menangkap yang buruk — mengakhiri ronde.', 'Salah tangkap!'],
      ru: ['Веди, чтобы ловить', 'Мимо!', 'Конец!', 'Веди влево или вправо, чтобы ловить падающие хорошие вещи. Уклоняйся от плохих. Становится быстрее и плотнее. Упустить хорошую — или поймать плохую — завершает раунд.', 'Не то поймал!'],
      de: ['Ziehen zum Fangen', 'Verpasst!', 'Aus!', 'Ziehe nach links oder rechts, um die guten Dinge zu fangen, die fallen. Weiche den schlechten aus. Es wird schneller und voller. Eine gute zu verpassen — oder eine schlechte zu fangen — beendet die Runde.', 'Falsch gefangen!'],
      hi: ['पकड़ने को खींचें', 'चूक गए!', 'खत्म!', 'गिरती अच्छी चीज़ें पकड़ने के लिए बाएँ या दाएँ खींचें। बुरी से बचें। यह तेज़ और व्यस्त होता जाता है। अच्छी चूकना — या बुरी पकड़ना — राउंड खत्म कर देता है।', 'गलत पकड़!'],
      zh: ['拖动接取', '没接住！', '结束！', '左右拖动接住掉落的好东西，躲开坏的。会越来越快、越来越密。漏掉好的——或接到坏的——本回合结束。', '接错了！']
    },
    pearlcatch: {
      en: ['Drag to catch', 'Missed it!', 'Over!', 'Drag left or right to move and catch the good things as they fall. Dodge the bad ones. It gets faster and busier. Missing a good one — or catching a bad one — ends the round.', 'Wrong catch!'],
      fr: ['Glisse pour attraper', 'Raté !', 'Terminé !', 'Glisse à gauche ou à droite pour attraper les bonnes choses qui tombent. Évite les mauvaises. Ça devient plus rapide et plus chargé. Rater une bonne — ou attraper une mauvaise — termine la partie.', 'Mauvaise prise !'],
      es: ['Desliza para atrapar', '¡Fallaste!', '¡Fin!', 'Desliza a izquierda o derecha para atrapar las cosas buenas que caen. Esquiva las malas. Se vuelve más rápido y concurrido. Fallar una buena — o atrapar una mala — termina la ronda.', '¡Mala atrapada!'],
      pt: ['Deslize para pegar', 'Perdeu!', 'Fim!', 'Deslize para a esquerda ou direita para pegar as coisas boas que caem. Desvie das ruins. Fica mais rápido e cheio. Perder uma boa — ou pegar uma ruim — encerra a rodada.', 'Pegou a errada!'],
      ar: ['اسحب للالتقاط', 'فاتك!', 'انتهى!', 'اسحب يسارًا أو يمينًا لالتقاط الأشياء الجيدة المتساقطة. تفادَ السيئة. يصبح أسرع وأكثر ازدحامًا. تفويت جيدة — أو التقاط سيئة — ينهي الجولة.', 'التقاط خاطئ!'],
      tr: ['Yakalamak için kaydır', 'Kaçırdın!', 'Bitti!', 'Düşen iyi şeyleri yakalamak için sola ya da sağa kaydır. Kötülerden kaç. Daha hızlı ve kalabalık olur. İyisini kaçırmak — ya da kötüsünü yakalamak — turu bitirir.', 'Yanlış yakalama!'],
      vi: ['Kéo để hứng', 'Hụt rồi!', 'Hết!', 'Kéo trái hoặc phải để hứng những thứ tốt đang rơi. Né những thứ xấu. Ngày càng nhanh và đông. Hụt thứ tốt — hoặc hứng thứ xấu — là kết thúc ván.', 'Hứng nhầm rồi!'],
      id: ['Geser untuk menangkap', 'Terlewat!', 'Selesai!', 'Geser ke kiri atau kanan untuk menangkap benda bagus yang jatuh. Hindari yang buruk. Makin cepat dan ramai. Melewatkan yang bagus — atau menangkap yang buruk — mengakhiri ronde.', 'Salah tangkap!'],
      ru: ['Веди, чтобы ловить', 'Мимо!', 'Конец!', 'Веди влево или вправо, чтобы ловить падающие хорошие вещи. Уклоняйся от плохих. Становится быстрее и плотнее. Упустить хорошую — или поймать плохую — завершает раунд.', 'Не то поймал!'],
      de: ['Ziehen zum Fangen', 'Verpasst!', 'Aus!', 'Ziehe nach links oder rechts, um die guten Dinge zu fangen, die fallen. Weiche den schlechten aus. Es wird schneller und voller. Eine gute zu verpassen — oder eine schlechte zu fangen — beendet die Runde.', 'Falsch gefangen!'],
      hi: ['पकड़ने को खींचें', 'चूक गए!', 'खत्म!', 'गिरती अच्छी चीज़ें पकड़ने के लिए बाएँ या दाएँ खींचें। बुरी से बचें। यह तेज़ और व्यस्त होता जाता है। अच्छी चूकना — या बुरी पकड़ना — राउंड खत्म कर देता है।', 'गलत पकड़!'],
      zh: ['拖动接取', '没接住！', '结束！', '左右拖动接住掉落的好东西，躲开坏的。会越来越快、越来越密。漏掉好的——或接到坏的——本回合结束。', '接错了！']
    },
    copterflight: {
      en: ['Tap to fly up', 'Crashed!', 'Collapse!', 'Tap to rise; let go and you drop. Fly through the gaps without touching the walls. It gets faster and the gaps get tighter. Hitting a wall ends the round.'],
      fr: ['Touche pour monter', 'Écrasé !', 'Effondrement !', 'Touche pour monter ; relâche et tu descends. Passe par les trous sans toucher les parois. Ça accélère et les trous se resserrent. Toucher une paroi termine la partie.'],
      es: ['Toca para subir', '¡Te estrellaste!', '¡Derrumbe!', 'Toca para subir; suelta y bajas. Pasa por los huecos sin tocar las paredes. Se acelera y los huecos se estrechan. Tocar una pared termina la ronda.'],
      pt: ['Toque para subir', 'Bateu!', 'Desabamento!', 'Toque para subir; solte e você desce. Passe pelos vãos sem tocar nas paredes. Acelera e os vãos apertam. Tocar numa parede encerra a rodada.'],
      ar: ['المس للصعود', 'اصطدمت!', 'انهيار!', 'المس لتصعد؛ اترك فتهبط. مُرّ عبر الفجوات دون لمس الجدران. يتسارع وتضيق الفجوات. لمس جدار ينهي الجولة.'],
      tr: ['Yükselmek için dokun', 'Çarptın!', 'Çöküş!', 'Yükselmek için dokun; bırak, düşersin. Duvarlara değmeden boşluklardan geç. Hızlanır ve boşluklar daralır. Bir duvara çarpmak turu bitirir.'],
      vi: ['Chạm để bay lên', 'Đâm rồi!', 'Sập!', 'Chạm để bay lên; thả ra thì rơi. Bay qua các khe hở mà không chạm tường. Nhanh dần và khe hẹp dần. Chạm tường là kết thúc ván.'],
      id: ['Ketuk untuk naik', 'Menabrak!', 'Runtuh!', 'Ketuk untuk naik; lepas maka turun. Lewati celah tanpa menyentuh dinding. Makin cepat dan celah menyempit. Menyentuh dinding mengakhiri ronde.'],
      ru: ['Коснись, чтобы взлететь', 'Разбился!', 'Обвал!', 'Касайся, чтобы подниматься; отпусти — падаешь. Пролетай в просветы, не задевая стены. Быстрее, просветы уже. Удар о стену завершает раунд.'],
      de: ['Tippen zum Steigen', 'Zerschellt!', 'Einsturz!', 'Tippe zum Steigen; loslassen, dann sinkst du. Flieg durch die Lücken, ohne die Wände zu berühren. Es wird schneller und enger. Eine Wand zu berühren beendet die Runde.'],
      hi: ['ऊपर जाने को छुएं', 'टकरा गए!', 'ढह गया!', 'ऊपर उठने को छुएं; छोड़ें तो गिरते हैं। दीवार छुए बिना खाली जगहों से निकलें। तेज़ होता है, जगह सँकरी। दीवार से टकराना राउंड खत्म कर देता है।'],
      zh: ['点击上升', '撞毁了！', '坍塌！', '点击上升，松开就下落。穿过缺口，不要碰到墙壁。会越来越快、缺口越来越窄。碰到墙壁，本回合结束。']
    },
    dragonfly: {
      en: ['Tap to fly up', 'Crashed!', 'Collapse!', 'Tap to rise; let go and you drop. Fly through the gaps without touching the walls. It gets faster and the gaps get tighter. Hitting a wall ends the round.'],
      fr: ['Touche pour monter', 'Écrasé !', 'Effondrement !', 'Touche pour monter ; relâche et tu descends. Passe par les trous sans toucher les parois. Ça accélère et les trous se resserrent. Toucher une paroi termine la partie.'],
      es: ['Toca para subir', '¡Te estrellaste!', '¡Derrumbe!', 'Toca para subir; suelta y bajas. Pasa por los huecos sin tocar las paredes. Se acelera y los huecos se estrechan. Tocar una pared termina la ronda.'],
      pt: ['Toque para subir', 'Bateu!', 'Desabamento!', 'Toque para subir; solte e você desce. Passe pelos vãos sem tocar nas paredes. Acelera e os vãos apertam. Tocar numa parede encerra a rodada.'],
      ar: ['المس للصعود', 'اصطدمت!', 'انهيار!', 'المس لتصعد؛ اترك فتهبط. مُرّ عبر الفجوات دون لمس الجدران. يتسارع وتضيق الفجوات. لمس جدار ينهي الجولة.'],
      tr: ['Yükselmek için dokun', 'Çarptın!', 'Çöküş!', 'Yükselmek için dokun; bırak, düşersin. Duvarlara değmeden boşluklardan geç. Hızlanır ve boşluklar daralır. Bir duvara çarpmak turu bitirir.'],
      vi: ['Chạm để bay lên', 'Đâm rồi!', 'Sập!', 'Chạm để bay lên; thả ra thì rơi. Bay qua các khe hở mà không chạm tường. Nhanh dần và khe hẹp dần. Chạm tường là kết thúc ván.'],
      id: ['Ketuk untuk naik', 'Menabrak!', 'Runtuh!', 'Ketuk untuk naik; lepas maka turun. Lewati celah tanpa menyentuh dinding. Makin cepat dan celah menyempit. Menyentuh dinding mengakhiri ronde.'],
      ru: ['Коснись, чтобы взлететь', 'Разбился!', 'Обвал!', 'Касайся, чтобы подниматься; отпусти — падаешь. Пролетай в просветы, не задевая стены. Быстрее, просветы уже. Удар о стену завершает раунд.'],
      de: ['Tippen zum Steigen', 'Zerschellt!', 'Einsturz!', 'Tippe zum Steigen; loslassen, dann sinkst du. Flieg durch die Lücken, ohne die Wände zu berühren. Es wird schneller und enger. Eine Wand zu berühren beendet die Runde.'],
      hi: ['ऊपर जाने को छुएं', 'टकरा गए!', 'ढह गया!', 'ऊपर उठने को छुएं; छोड़ें तो गिरते हैं। दीवार छुए बिना खाली जगहों से निकलें। तेज़ होता है, जगह सँकरी। दीवार से टकराना राउंड खत्म कर देता है।'],
      zh: ['点击上升', '撞毁了！', '坍塌！', '点击上升，松开就下落。穿过缺口，不要碰到墙壁。会越来越快、缺口越来越窄。碰到墙壁，本回合结束。']
    },
    paperplane: {
      en: ['Tap to fly up', 'Crashed!', 'Collapse!', 'Tap to rise; let go and you drop. Fly through the gaps without touching the walls. It gets faster and the gaps get tighter. Hitting a wall ends the round.'],
      fr: ['Touche pour monter', 'Écrasé !', 'Effondrement !', 'Touche pour monter ; relâche et tu descends. Passe par les trous sans toucher les parois. Ça accélère et les trous se resserrent. Toucher une paroi termine la partie.'],
      es: ['Toca para subir', '¡Te estrellaste!', '¡Derrumbe!', 'Toca para subir; suelta y bajas. Pasa por los huecos sin tocar las paredes. Se acelera y los huecos se estrechan. Tocar una pared termina la ronda.'],
      pt: ['Toque para subir', 'Bateu!', 'Desabamento!', 'Toque para subir; solte e você desce. Passe pelos vãos sem tocar nas paredes. Acelera e os vãos apertam. Tocar numa parede encerra a rodada.'],
      ar: ['المس للصعود', 'اصطدمت!', 'انهيار!', 'المس لتصعد؛ اترك فتهبط. مُرّ عبر الفجوات دون لمس الجدران. يتسارع وتضيق الفجوات. لمس جدار ينهي الجولة.'],
      tr: ['Yükselmek için dokun', 'Çarptın!', 'Çöküş!', 'Yükselmek için dokun; bırak, düşersin. Duvarlara değmeden boşluklardan geç. Hızlanır ve boşluklar daralır. Bir duvara çarpmak turu bitirir.'],
      vi: ['Chạm để bay lên', 'Đâm rồi!', 'Sập!', 'Chạm để bay lên; thả ra thì rơi. Bay qua các khe hở mà không chạm tường. Nhanh dần và khe hẹp dần. Chạm tường là kết thúc ván.'],
      id: ['Ketuk untuk naik', 'Menabrak!', 'Runtuh!', 'Ketuk untuk naik; lepas maka turun. Lewati celah tanpa menyentuh dinding. Makin cepat dan celah menyempit. Menyentuh dinding mengakhiri ronde.'],
      ru: ['Коснись, чтобы взлететь', 'Разбился!', 'Обвал!', 'Касайся, чтобы подниматься; отпусти — падаешь. Пролетай в просветы, не задевая стены. Быстрее, просветы уже. Удар о стену завершает раунд.'],
      de: ['Tippen zum Steigen', 'Zerschellt!', 'Einsturz!', 'Tippe zum Steigen; loslassen, dann sinkst du. Flieg durch die Lücken, ohne die Wände zu berühren. Es wird schneller und enger. Eine Wand zu berühren beendet die Runde.'],
      hi: ['ऊपर जाने को छुएं', 'टकरा गए!', 'ढह गया!', 'ऊपर उठने को छुएं; छोड़ें तो गिरते हैं। दीवार छुए बिना खाली जगहों से निकलें। तेज़ होता है, जगह सँकरी। दीवार से टकराना राउंड खत्म कर देता है।'],
      zh: ['点击上升', '撞毁了！', '坍塌！', '点击上升，松开就下落。穿过缺口，不要碰到墙壁。会越来越快、缺口越来越窄。碰到墙壁，本回合结束。']
    },
    snowcatch: {
      en: ['Drag to catch', 'Missed it!', 'Over!', 'Drag left or right to move and catch the good things as they fall. Dodge the bad ones. It gets faster and busier. Missing a good one — or catching a bad one — ends the round.', 'Wrong catch!'],
      fr: ['Glisse pour attraper', 'Raté !', 'Terminé !', 'Glisse à gauche ou à droite pour attraper les bonnes choses qui tombent. Évite les mauvaises. Ça devient plus rapide et plus chargé. Rater une bonne — ou attraper une mauvaise — termine la partie.', 'Mauvaise prise !'],
      es: ['Desliza para atrapar', '¡Fallaste!', '¡Fin!', 'Desliza a izquierda o derecha para atrapar las cosas buenas que caen. Esquiva las malas. Se vuelve más rápido y concurrido. Fallar una buena — o atrapar una mala — termina la ronda.', '¡Mala atrapada!'],
      pt: ['Deslize para pegar', 'Perdeu!', 'Fim!', 'Deslize para a esquerda ou direita para pegar as coisas boas que caem. Desvie das ruins. Fica mais rápido e cheio. Perder uma boa — ou pegar uma ruim — encerra a rodada.', 'Pegou a errada!'],
      ar: ['اسحب للالتقاط', 'فاتك!', 'انتهى!', 'اسحب يسارًا أو يمينًا لالتقاط الأشياء الجيدة المتساقطة. تفادَ السيئة. يصبح أسرع وأكثر ازدحامًا. تفويت جيدة — أو التقاط سيئة — ينهي الجولة.', 'التقاط خاطئ!'],
      tr: ['Yakalamak için kaydır', 'Kaçırdın!', 'Bitti!', 'Düşen iyi şeyleri yakalamak için sola ya da sağa kaydır. Kötülerden kaç. Daha hızlı ve kalabalık olur. İyisini kaçırmak — ya da kötüsünü yakalamak — turu bitirir.', 'Yanlış yakalama!'],
      vi: ['Kéo để hứng', 'Hụt rồi!', 'Hết!', 'Kéo trái hoặc phải để hứng những thứ tốt đang rơi. Né những thứ xấu. Ngày càng nhanh và đông. Hụt thứ tốt — hoặc hứng thứ xấu — là kết thúc ván.', 'Hứng nhầm rồi!'],
      id: ['Geser untuk menangkap', 'Terlewat!', 'Selesai!', 'Geser ke kiri atau kanan untuk menangkap benda bagus yang jatuh. Hindari yang buruk. Makin cepat dan ramai. Melewatkan yang bagus — atau menangkap yang buruk — mengakhiri ronde.', 'Salah tangkap!'],
      ru: ['Веди, чтобы ловить', 'Мимо!', 'Конец!', 'Веди влево или вправо, чтобы ловить падающие хорошие вещи. Уклоняйся от плохих. Становится быстрее и плотнее. Упустить хорошую — или поймать плохую — завершает раунд.', 'Не то поймал!'],
      de: ['Ziehen zum Fangen', 'Verpasst!', 'Aus!', 'Ziehe nach links oder rechts, um die guten Dinge zu fangen, die fallen. Weiche den schlechten aus. Es wird schneller und voller. Eine gute zu verpassen — oder eine schlechte zu fangen — beendet die Runde.', 'Falsch gefangen!'],
      hi: ['पकड़ने को खींचें', 'चूक गए!', 'खत्म!', 'गिरती अच्छी चीज़ें पकड़ने के लिए बाएँ या दाएँ खींचें। बुरी से बचें। यह तेज़ और व्यस्त होता जाता है। अच्छी चूकना — या बुरी पकड़ना — राउंड खत्म कर देता है।', 'गलत पकड़!'],
      zh: ['拖动接取', '没接住！', '结束！', '左右拖动接住掉落的好东西，躲开坏的。会越来越快、越来越密。漏掉好的——或接到坏的——本回合结束。', '接错了！']
    },
    tacocatch: {
      en: ['Drag to catch', 'Missed it!', 'Over!', 'Drag left or right to move and catch the good things as they fall. Dodge the bad ones. It gets faster and busier. Missing a good one — or catching a bad one — ends the round.', 'Wrong catch!'],
      fr: ['Glisse pour attraper', 'Raté !', 'Terminé !', 'Glisse à gauche ou à droite pour attraper les bonnes choses qui tombent. Évite les mauvaises. Ça devient plus rapide et plus chargé. Rater une bonne — ou attraper une mauvaise — termine la partie.', 'Mauvaise prise !'],
      es: ['Desliza para atrapar', '¡Fallaste!', '¡Fin!', 'Desliza a izquierda o derecha para atrapar las cosas buenas que caen. Esquiva las malas. Se vuelve más rápido y concurrido. Fallar una buena — o atrapar una mala — termina la ronda.', '¡Mala atrapada!'],
      pt: ['Deslize para pegar', 'Perdeu!', 'Fim!', 'Deslize para a esquerda ou direita para pegar as coisas boas que caem. Desvie das ruins. Fica mais rápido e cheio. Perder uma boa — ou pegar uma ruim — encerra a rodada.', 'Pegou a errada!'],
      ar: ['اسحب للالتقاط', 'فاتك!', 'انتهى!', 'اسحب يسارًا أو يمينًا لالتقاط الأشياء الجيدة المتساقطة. تفادَ السيئة. يصبح أسرع وأكثر ازدحامًا. تفويت جيدة — أو التقاط سيئة — ينهي الجولة.', 'التقاط خاطئ!'],
      tr: ['Yakalamak için kaydır', 'Kaçırdın!', 'Bitti!', 'Düşen iyi şeyleri yakalamak için sola ya da sağa kaydır. Kötülerden kaç. Daha hızlı ve kalabalık olur. İyisini kaçırmak — ya da kötüsünü yakalamak — turu bitirir.', 'Yanlış yakalama!'],
      vi: ['Kéo để hứng', 'Hụt rồi!', 'Hết!', 'Kéo trái hoặc phải để hứng những thứ tốt đang rơi. Né những thứ xấu. Ngày càng nhanh và đông. Hụt thứ tốt — hoặc hứng thứ xấu — là kết thúc ván.', 'Hứng nhầm rồi!'],
      id: ['Geser untuk menangkap', 'Terlewat!', 'Selesai!', 'Geser ke kiri atau kanan untuk menangkap benda bagus yang jatuh. Hindari yang buruk. Makin cepat dan ramai. Melewatkan yang bagus — atau menangkap yang buruk — mengakhiri ronde.', 'Salah tangkap!'],
      ru: ['Веди, чтобы ловить', 'Мимо!', 'Конец!', 'Веди влево или вправо, чтобы ловить падающие хорошие вещи. Уклоняйся от плохих. Становится быстрее и плотнее. Упустить хорошую — или поймать плохую — завершает раунд.', 'Не то поймал!'],
      de: ['Ziehen zum Fangen', 'Verpasst!', 'Aus!', 'Ziehe nach links oder rechts, um die guten Dinge zu fangen, die fallen. Weiche den schlechten aus. Es wird schneller und voller. Eine gute zu verpassen — oder eine schlechte zu fangen — beendet die Runde.', 'Falsch gefangen!'],
      hi: ['पकड़ने को खींचें', 'चूक गए!', 'खत्म!', 'गिरती अच्छी चीज़ें पकड़ने के लिए बाएँ या दाएँ खींचें। बुरी से बचें। यह तेज़ और व्यस्त होता जाता है। अच्छी चूकना — या बुरी पकड़ना — राउंड खत्म कर देता है।', 'गलत पकड़!'],
      zh: ['拖动接取', '没接住！', '结束！', '左右拖动接住掉落的好东西，躲开坏的。会越来越快、越来越密。漏掉好的——或接到坏的——本回合结束。', '接错了！']
    },
    fruitpunch: {
      en: ['Drag to catch', 'Missed it!', 'Over!', 'Drag left or right to move and catch the good things as they fall. Dodge the bad ones. It gets faster and busier. Missing a good one — or catching a bad one — ends the round.', 'Wrong catch!'],
      fr: ['Glisse pour attraper', 'Raté !', 'Terminé !', 'Glisse à gauche ou à droite pour attraper les bonnes choses qui tombent. Évite les mauvaises. Ça devient plus rapide et plus chargé. Rater une bonne — ou attraper une mauvaise — termine la partie.', 'Mauvaise prise !'],
      es: ['Desliza para atrapar', '¡Fallaste!', '¡Fin!', 'Desliza a izquierda o derecha para atrapar las cosas buenas que caen. Esquiva las malas. Se vuelve más rápido y concurrido. Fallar una buena — o atrapar una mala — termina la ronda.', '¡Mala atrapada!'],
      pt: ['Deslize para pegar', 'Perdeu!', 'Fim!', 'Deslize para a esquerda ou direita para pegar as coisas boas que caem. Desvie das ruins. Fica mais rápido e cheio. Perder uma boa — ou pegar uma ruim — encerra a rodada.', 'Pegou a errada!'],
      ar: ['اسحب للالتقاط', 'فاتك!', 'انتهى!', 'اسحب يسارًا أو يمينًا لالتقاط الأشياء الجيدة المتساقطة. تفادَ السيئة. يصبح أسرع وأكثر ازدحامًا. تفويت جيدة — أو التقاط سيئة — ينهي الجولة.', 'التقاط خاطئ!'],
      tr: ['Yakalamak için kaydır', 'Kaçırdın!', 'Bitti!', 'Düşen iyi şeyleri yakalamak için sola ya da sağa kaydır. Kötülerden kaç. Daha hızlı ve kalabalık olur. İyisini kaçırmak — ya da kötüsünü yakalamak — turu bitirir.', 'Yanlış yakalama!'],
      vi: ['Kéo để hứng', 'Hụt rồi!', 'Hết!', 'Kéo trái hoặc phải để hứng những thứ tốt đang rơi. Né những thứ xấu. Ngày càng nhanh và đông. Hụt thứ tốt — hoặc hứng thứ xấu — là kết thúc ván.', 'Hứng nhầm rồi!'],
      id: ['Geser untuk menangkap', 'Terlewat!', 'Selesai!', 'Geser ke kiri atau kanan untuk menangkap benda bagus yang jatuh. Hindari yang buruk. Makin cepat dan ramai. Melewatkan yang bagus — atau menangkap yang buruk — mengakhiri ronde.', 'Salah tangkap!'],
      ru: ['Веди, чтобы ловить', 'Мимо!', 'Конец!', 'Веди влево или вправо, чтобы ловить падающие хорошие вещи. Уклоняйся от плохих. Становится быстрее и плотнее. Упустить хорошую — или поймать плохую — завершает раунд.', 'Не то поймал!'],
      de: ['Ziehen zum Fangen', 'Verpasst!', 'Aus!', 'Ziehe nach links oder rechts, um die guten Dinge zu fangen, die fallen. Weiche den schlechten aus. Es wird schneller und voller. Eine gute zu verpassen — oder eine schlechte zu fangen — beendet die Runde.', 'Falsch gefangen!'],
      hi: ['पकड़ने को खींचें', 'चूक गए!', 'खत्म!', 'गिरती अच्छी चीज़ें पकड़ने के लिए बाएँ या दाएँ खींचें। बुरी से बचें। यह तेज़ और व्यस्त होता जाता है। अच्छी चूकना — या बुरी पकड़ना — राउंड खत्म कर देता है।', 'गलत पकड़!'],
      zh: ['拖动接取', '没接住！', '结束！', '左右拖动接住掉落的好东西，躲开坏的。会越来越快、越来越密。漏掉好的——或接到坏的——本回合结束。', '接错了！']
    },
    ufoflight: {
      en: ['Tap to fly up', 'Crashed!', 'Collapse!', 'Tap to rise; let go and you drop. Fly through the gaps without touching the walls. It gets faster and the gaps get tighter. Hitting a wall ends the round.'],
      fr: ['Touche pour monter', 'Écrasé !', 'Effondrement !', 'Touche pour monter ; relâche et tu descends. Passe par les trous sans toucher les parois. Ça accélère et les trous se resserrent. Toucher une paroi termine la partie.'],
      es: ['Toca para subir', '¡Te estrellaste!', '¡Derrumbe!', 'Toca para subir; suelta y bajas. Pasa por los huecos sin tocar las paredes. Se acelera y los huecos se estrechan. Tocar una pared termina la ronda.'],
      pt: ['Toque para subir', 'Bateu!', 'Desabamento!', 'Toque para subir; solte e você desce. Passe pelos vãos sem tocar nas paredes. Acelera e os vãos apertam. Tocar numa parede encerra a rodada.'],
      ar: ['المس للصعود', 'اصطدمت!', 'انهيار!', 'المس لتصعد؛ اترك فتهبط. مُرّ عبر الفجوات دون لمس الجدران. يتسارع وتضيق الفجوات. لمس جدار ينهي الجولة.'],
      tr: ['Yükselmek için dokun', 'Çarptın!', 'Çöküş!', 'Yükselmek için dokun; bırak, düşersin. Duvarlara değmeden boşluklardan geç. Hızlanır ve boşluklar daralır. Bir duvara çarpmak turu bitirir.'],
      vi: ['Chạm để bay lên', 'Đâm rồi!', 'Sập!', 'Chạm để bay lên; thả ra thì rơi. Bay qua các khe hở mà không chạm tường. Nhanh dần và khe hẹp dần. Chạm tường là kết thúc ván.'],
      id: ['Ketuk untuk naik', 'Menabrak!', 'Runtuh!', 'Ketuk untuk naik; lepas maka turun. Lewati celah tanpa menyentuh dinding. Makin cepat dan celah menyempit. Menyentuh dinding mengakhiri ronde.'],
      ru: ['Коснись, чтобы взлететь', 'Разбился!', 'Обвал!', 'Касайся, чтобы подниматься; отпусти — падаешь. Пролетай в просветы, не задевая стены. Быстрее, просветы уже. Удар о стену завершает раунд.'],
      de: ['Tippen zum Steigen', 'Zerschellt!', 'Einsturz!', 'Tippe zum Steigen; loslassen, dann sinkst du. Flieg durch die Lücken, ohne die Wände zu berühren. Es wird schneller und enger. Eine Wand zu berühren beendet die Runde.'],
      hi: ['ऊपर जाने को छुएं', 'टकरा गए!', 'ढह गया!', 'ऊपर उठने को छुएं; छोड़ें तो गिरते हैं। दीवार छुए बिना खाली जगहों से निकलें। तेज़ होता है, जगह सँकरी। दीवार से टकराना राउंड खत्म कर देता है।'],
      zh: ['点击上升', '撞毁了！', '坍塌！', '点击上升，松开就下落。穿过缺口，不要碰到墙壁。会越来越快、缺口越来越窄。碰到墙壁，本回合结束。']
    },
    seagull: {
      en: ['Tap to fly up', 'Crashed!', 'Collapse!', 'Tap to rise; let go and you drop. Fly through the gaps without touching the walls. It gets faster and the gaps get tighter. Hitting a wall ends the round.'],
      fr: ['Touche pour monter', 'Écrasé !', 'Effondrement !', 'Touche pour monter ; relâche et tu descends. Passe par les trous sans toucher les parois. Ça accélère et les trous se resserrent. Toucher une paroi termine la partie.'],
      es: ['Toca para subir', '¡Te estrellaste!', '¡Derrumbe!', 'Toca para subir; suelta y bajas. Pasa por los huecos sin tocar las paredes. Se acelera y los huecos se estrechan. Tocar una pared termina la ronda.'],
      pt: ['Toque para subir', 'Bateu!', 'Desabamento!', 'Toque para subir; solte e você desce. Passe pelos vãos sem tocar nas paredes. Acelera e os vãos apertam. Tocar numa parede encerra a rodada.'],
      ar: ['المس للصعود', 'اصطدمت!', 'انهيار!', 'المس لتصعد؛ اترك فتهبط. مُرّ عبر الفجوات دون لمس الجدران. يتسارع وتضيق الفجوات. لمس جدار ينهي الجولة.'],
      tr: ['Yükselmek için dokun', 'Çarptın!', 'Çöküş!', 'Yükselmek için dokun; bırak, düşersin. Duvarlara değmeden boşluklardan geç. Hızlanır ve boşluklar daralır. Bir duvara çarpmak turu bitirir.'],
      vi: ['Chạm để bay lên', 'Đâm rồi!', 'Sập!', 'Chạm để bay lên; thả ra thì rơi. Bay qua các khe hở mà không chạm tường. Nhanh dần và khe hẹp dần. Chạm tường là kết thúc ván.'],
      id: ['Ketuk untuk naik', 'Menabrak!', 'Runtuh!', 'Ketuk untuk naik; lepas maka turun. Lewati celah tanpa menyentuh dinding. Makin cepat dan celah menyempit. Menyentuh dinding mengakhiri ronde.'],
      ru: ['Коснись, чтобы взлететь', 'Разбился!', 'Обвал!', 'Касайся, чтобы подниматься; отпусти — падаешь. Пролетай в просветы, не задевая стены. Быстрее, просветы уже. Удар о стену завершает раунд.'],
      de: ['Tippen zum Steigen', 'Zerschellt!', 'Einsturz!', 'Tippe zum Steigen; loslassen, dann sinkst du. Flieg durch die Lücken, ohne die Wände zu berühren. Es wird schneller und enger. Eine Wand zu berühren beendet die Runde.'],
      hi: ['ऊपर जाने को छुएं', 'टकरा गए!', 'ढह गया!', 'ऊपर उठने को छुएं; छोड़ें तो गिरते हैं। दीवार छुए बिना खाली जगहों से निकलें। तेज़ होता है, जगह सँकरी। दीवार से टकराना राउंड खत्म कर देता है।'],
      zh: ['点击上升', '撞毁了！', '坍塌！', '点击上升，松开就下落。穿过缺口，不要碰到墙壁。会越来越快、缺口越来越窄。碰到墙壁，本回合结束。']
    },
    raindash: {
      en: ['Drag to steer', 'Crash!', 'Wipeout!', 'Drag left or right to steer and weave through the obstacles coming at you. It gets faster and more crowded. Touching anything ends the round.'],
      fr: ['Glisse pour diriger', 'Accident !', 'Terminé !', 'Glisse à gauche ou à droite pour diriger et te faufiler entre les obstacles qui arrivent. Ça devient plus rapide et plus chargé. Toucher quelque chose termine la partie.'],
      es: ['Desliza para dirigir', '¡Choque!', '¡Fuera!', 'Desliza a izquierda o derecha para dirigir y esquivar los obstáculos que vienen. Se vuelve más rápido y concurrido. Tocar algo termina la ronda.'],
      pt: ['Deslize para dirigir', 'Batida!', 'Acabou!', 'Deslize para a esquerda ou direita para dirigir e desviar dos obstáculos que vêm. Fica mais rápido e cheio. Tocar em algo encerra a rodada.'],
      ar: ['اسحب للتوجيه', 'تحطّم!', 'انتهى!', 'اسحب يسارًا أو يمينًا للتوجيه والتفاف بين العوائق القادمة. يصبح أسرع وأكثر ازدحامًا. لمس أي شيء ينهي الجولة.'],
      tr: ['Yönlendirmek için kaydır', 'Kaza!', 'Bitti!', 'Yönlendirip gelen engellerin arasından geçmek için sola ya da sağa kaydır. Daha hızlı ve kalabalık olur. Bir şeye değmek turu bitirir.'],
      vi: ['Kéo để lái', 'Tông rồi!', 'Hết!', 'Kéo trái hoặc phải để lái và né các chướng ngại vật đang lao tới. Ngày càng nhanh và đông. Chạm vào bất cứ thứ gì là kết thúc ván.'],
      id: ['Geser untuk mengarah', 'Tabrakan!', 'Selesai!', 'Geser ke kiri atau kanan untuk mengarah dan menghindari rintangan yang datang. Makin cepat dan ramai. Menyentuh apa pun mengakhiri ronde.'],
      ru: ['Веди, чтобы рулить', 'Авария!', 'Конец!', 'Веди влево или вправо, чтобы рулить и уклоняться от летящих препятствий. Становится быстрее и плотнее. Касание чего-либо завершает раунд.'],
      de: ['Ziehen zum Lenken', 'Crash!', 'Aus!', 'Ziehe nach links oder rechts, um zu lenken und den entgegenkommenden Hindernissen auszuweichen. Es wird schneller und voller. Etwas zu berühren beendet die Runde.'],
      hi: ['चलाने को खींचें', 'टक्कर!', 'खत्म!', 'चलाने और आ रही बाधाओं से बचने के लिए बाएँ या दाएँ खींचें। यह तेज़ और भीड़भाड़ वाला होता जाता है। किसी भी चीज़ को छूना राउंड खत्म कर देता है।'],
      zh: ['拖动操控', '撞上了！', '结束！', '左右拖动操控，躲避迎面而来的障碍。会越来越快、越来越挤。碰到任何东西，本回合结束。']
    },
    coffeecatch: {
      en: ['Drag to catch', 'Missed it!', 'Over!', 'Drag left or right to move and catch the good things as they fall. Dodge the bad ones. It gets faster and busier. Missing a good one — or catching a bad one — ends the round.', 'Wrong catch!'],
      fr: ['Glisse pour attraper', 'Raté !', 'Terminé !', 'Glisse à gauche ou à droite pour attraper les bonnes choses qui tombent. Évite les mauvaises. Ça devient plus rapide et plus chargé. Rater une bonne — ou attraper une mauvaise — termine la partie.', 'Mauvaise prise !'],
      es: ['Desliza para atrapar', '¡Fallaste!', '¡Fin!', 'Desliza a izquierda o derecha para atrapar las cosas buenas que caen. Esquiva las malas. Se vuelve más rápido y concurrido. Fallar una buena — o atrapar una mala — termina la ronda.', '¡Mala atrapada!'],
      pt: ['Deslize para pegar', 'Perdeu!', 'Fim!', 'Deslize para a esquerda ou direita para pegar as coisas boas que caem. Desvie das ruins. Fica mais rápido e cheio. Perder uma boa — ou pegar uma ruim — encerra a rodada.', 'Pegou a errada!'],
      ar: ['اسحب للالتقاط', 'فاتك!', 'انتهى!', 'اسحب يسارًا أو يمينًا لالتقاط الأشياء الجيدة المتساقطة. تفادَ السيئة. يصبح أسرع وأكثر ازدحامًا. تفويت جيدة — أو التقاط سيئة — ينهي الجولة.', 'التقاط خاطئ!'],
      tr: ['Yakalamak için kaydır', 'Kaçırdın!', 'Bitti!', 'Düşen iyi şeyleri yakalamak için sola ya da sağa kaydır. Kötülerden kaç. Daha hızlı ve kalabalık olur. İyisini kaçırmak — ya da kötüsünü yakalamak — turu bitirir.', 'Yanlış yakalama!'],
      vi: ['Kéo để hứng', 'Hụt rồi!', 'Hết!', 'Kéo trái hoặc phải để hứng những thứ tốt đang rơi. Né những thứ xấu. Ngày càng nhanh và đông. Hụt thứ tốt — hoặc hứng thứ xấu — là kết thúc ván.', 'Hứng nhầm rồi!'],
      id: ['Geser untuk menangkap', 'Terlewat!', 'Selesai!', 'Geser ke kiri atau kanan untuk menangkap benda bagus yang jatuh. Hindari yang buruk. Makin cepat dan ramai. Melewatkan yang bagus — atau menangkap yang buruk — mengakhiri ronde.', 'Salah tangkap!'],
      ru: ['Веди, чтобы ловить', 'Мимо!', 'Конец!', 'Веди влево или вправо, чтобы ловить падающие хорошие вещи. Уклоняйся от плохих. Становится быстрее и плотнее. Упустить хорошую — или поймать плохую — завершает раунд.', 'Не то поймал!'],
      de: ['Ziehen zum Fangen', 'Verpasst!', 'Aus!', 'Ziehe nach links oder rechts, um die guten Dinge zu fangen, die fallen. Weiche den schlechten aus. Es wird schneller und voller. Eine gute zu verpassen — oder eine schlechte zu fangen — beendet die Runde.', 'Falsch gefangen!'],
      hi: ['पकड़ने को खींचें', 'चूक गए!', 'खत्म!', 'गिरती अच्छी चीज़ें पकड़ने के लिए बाएँ या दाएँ खींचें। बुरी से बचें। यह तेज़ और व्यस्त होता जाता है। अच्छी चूकना — या बुरी पकड़ना — राउंड खत्म कर देता है।', 'गलत पकड़!'],
      zh: ['拖动接取', '没接住！', '结束！', '左右拖动接住掉落的好东西，躲开坏的。会越来越快、越来越密。漏掉好的——或接到坏的——本回合结束。', '接错了！']
    },
    burgercatch: {
      en: ['Drag to catch', 'Missed it!', 'Over!', 'Drag left or right to move and catch the good things as they fall. Dodge the bad ones. It gets faster and busier. Missing a good one — or catching a bad one — ends the round.', 'Wrong catch!'],
      fr: ['Glisse pour attraper', 'Raté !', 'Terminé !', 'Glisse à gauche ou à droite pour attraper les bonnes choses qui tombent. Évite les mauvaises. Ça devient plus rapide et plus chargé. Rater une bonne — ou attraper une mauvaise — termine la partie.', 'Mauvaise prise !'],
      es: ['Desliza para atrapar', '¡Fallaste!', '¡Fin!', 'Desliza a izquierda o derecha para atrapar las cosas buenas que caen. Esquiva las malas. Se vuelve más rápido y concurrido. Fallar una buena — o atrapar una mala — termina la ronda.', '¡Mala atrapada!'],
      pt: ['Deslize para pegar', 'Perdeu!', 'Fim!', 'Deslize para a esquerda ou direita para pegar as coisas boas que caem. Desvie das ruins. Fica mais rápido e cheio. Perder uma boa — ou pegar uma ruim — encerra a rodada.', 'Pegou a errada!'],
      ar: ['اسحب للالتقاط', 'فاتك!', 'انتهى!', 'اسحب يسارًا أو يمينًا لالتقاط الأشياء الجيدة المتساقطة. تفادَ السيئة. يصبح أسرع وأكثر ازدحامًا. تفويت جيدة — أو التقاط سيئة — ينهي الجولة.', 'التقاط خاطئ!'],
      tr: ['Yakalamak için kaydır', 'Kaçırdın!', 'Bitti!', 'Düşen iyi şeyleri yakalamak için sola ya da sağa kaydır. Kötülerden kaç. Daha hızlı ve kalabalık olur. İyisini kaçırmak — ya da kötüsünü yakalamak — turu bitirir.', 'Yanlış yakalama!'],
      vi: ['Kéo để hứng', 'Hụt rồi!', 'Hết!', 'Kéo trái hoặc phải để hứng những thứ tốt đang rơi. Né những thứ xấu. Ngày càng nhanh và đông. Hụt thứ tốt — hoặc hứng thứ xấu — là kết thúc ván.', 'Hứng nhầm rồi!'],
      id: ['Geser untuk menangkap', 'Terlewat!', 'Selesai!', 'Geser ke kiri atau kanan untuk menangkap benda bagus yang jatuh. Hindari yang buruk. Makin cepat dan ramai. Melewatkan yang bagus — atau menangkap yang buruk — mengakhiri ronde.', 'Salah tangkap!'],
      ru: ['Веди, чтобы ловить', 'Мимо!', 'Конец!', 'Веди влево или вправо, чтобы ловить падающие хорошие вещи. Уклоняйся от плохих. Становится быстрее и плотнее. Упустить хорошую — или поймать плохую — завершает раунд.', 'Не то поймал!'],
      de: ['Ziehen zum Fangen', 'Verpasst!', 'Aus!', 'Ziehe nach links oder rechts, um die guten Dinge zu fangen, die fallen. Weiche den schlechten aus. Es wird schneller und voller. Eine gute zu verpassen — oder eine schlechte zu fangen — beendet die Runde.', 'Falsch gefangen!'],
      hi: ['पकड़ने को खींचें', 'चूक गए!', 'खत्म!', 'गिरती अच्छी चीज़ें पकड़ने के लिए बाएँ या दाएँ खींचें। बुरी से बचें। यह तेज़ और व्यस्त होता जाता है। अच्छी चूकना — या बुरी पकड़ना — राउंड खत्म कर देता है।', 'गलत पकड़!'],
      zh: ['拖动接取', '没接住！', '结束！', '左右拖动接住掉落的好东西，躲开坏的。会越来越快、越来越密。漏掉好的——或接到坏的——本回合结束。', '接错了！']
    },
    sushicatch: {
      en: ['Drag to catch', 'Missed it!', 'Over!', 'Drag left or right to move and catch the good things as they fall. Dodge the bad ones. It gets faster and busier. Missing a good one — or catching a bad one — ends the round.', 'Wrong catch!'],
      fr: ['Glisse pour attraper', 'Raté !', 'Terminé !', 'Glisse à gauche ou à droite pour attraper les bonnes choses qui tombent. Évite les mauvaises. Ça devient plus rapide et plus chargé. Rater une bonne — ou attraper une mauvaise — termine la partie.', 'Mauvaise prise !'],
      es: ['Desliza para atrapar', '¡Fallaste!', '¡Fin!', 'Desliza a izquierda o derecha para atrapar las cosas buenas que caen. Esquiva las malas. Se vuelve más rápido y concurrido. Fallar una buena — o atrapar una mala — termina la ronda.', '¡Mala atrapada!'],
      pt: ['Deslize para pegar', 'Perdeu!', 'Fim!', 'Deslize para a esquerda ou direita para pegar as coisas boas que caem. Desvie das ruins. Fica mais rápido e cheio. Perder uma boa — ou pegar uma ruim — encerra a rodada.', 'Pegou a errada!'],
      ar: ['اسحب للالتقاط', 'فاتك!', 'انتهى!', 'اسحب يسارًا أو يمينًا لالتقاط الأشياء الجيدة المتساقطة. تفادَ السيئة. يصبح أسرع وأكثر ازدحامًا. تفويت جيدة — أو التقاط سيئة — ينهي الجولة.', 'التقاط خاطئ!'],
      tr: ['Yakalamak için kaydır', 'Kaçırdın!', 'Bitti!', 'Düşen iyi şeyleri yakalamak için sola ya da sağa kaydır. Kötülerden kaç. Daha hızlı ve kalabalık olur. İyisini kaçırmak — ya da kötüsünü yakalamak — turu bitirir.', 'Yanlış yakalama!'],
      vi: ['Kéo để hứng', 'Hụt rồi!', 'Hết!', 'Kéo trái hoặc phải để hứng những thứ tốt đang rơi. Né những thứ xấu. Ngày càng nhanh và đông. Hụt thứ tốt — hoặc hứng thứ xấu — là kết thúc ván.', 'Hứng nhầm rồi!'],
      id: ['Geser untuk menangkap', 'Terlewat!', 'Selesai!', 'Geser ke kiri atau kanan untuk menangkap benda bagus yang jatuh. Hindari yang buruk. Makin cepat dan ramai. Melewatkan yang bagus — atau menangkap yang buruk — mengakhiri ronde.', 'Salah tangkap!'],
      ru: ['Веди, чтобы ловить', 'Мимо!', 'Конец!', 'Веди влево или вправо, чтобы ловить падающие хорошие вещи. Уклоняйся от плохих. Становится быстрее и плотнее. Упустить хорошую — или поймать плохую — завершает раунд.', 'Не то поймал!'],
      de: ['Ziehen zum Fangen', 'Verpasst!', 'Aus!', 'Ziehe nach links oder rechts, um die guten Dinge zu fangen, die fallen. Weiche den schlechten aus. Es wird schneller und voller. Eine gute zu verpassen — oder eine schlechte zu fangen — beendet die Runde.', 'Falsch gefangen!'],
      hi: ['पकड़ने को खींचें', 'चूक गए!', 'खत्म!', 'गिरती अच्छी चीज़ें पकड़ने के लिए बाएँ या दाएँ खींचें। बुरी से बचें। यह तेज़ और व्यस्त होता जाता है। अच्छी चूकना — या बुरी पकड़ना — राउंड खत्म कर देता है।', 'गलत पकड़!'],
      zh: ['拖动接取', '没接住！', '结束！', '左右拖动接住掉落的好东西，躲开坏的。会越来越快、越来越密。漏掉好的——或接到坏的——本回合结束。', '接错了！']
    },
    beefly: {
      en: ['Tap to fly up', 'Crashed!', 'Collapse!', 'Tap to rise; let go and you drop. Fly through the gaps without touching the walls. It gets faster and the gaps get tighter. Hitting a wall ends the round.'],
      fr: ['Touche pour monter', 'Écrasé !', 'Effondrement !', 'Touche pour monter ; relâche et tu descends. Passe par les trous sans toucher les parois. Ça accélère et les trous se resserrent. Toucher une paroi termine la partie.'],
      es: ['Toca para subir', '¡Te estrellaste!', '¡Derrumbe!', 'Toca para subir; suelta y bajas. Pasa por los huecos sin tocar las paredes. Se acelera y los huecos se estrechan. Tocar una pared termina la ronda.'],
      pt: ['Toque para subir', 'Bateu!', 'Desabamento!', 'Toque para subir; solte e você desce. Passe pelos vãos sem tocar nas paredes. Acelera e os vãos apertam. Tocar numa parede encerra a rodada.'],
      ar: ['المس للصعود', 'اصطدمت!', 'انهيار!', 'المس لتصعد؛ اترك فتهبط. مُرّ عبر الفجوات دون لمس الجدران. يتسارع وتضيق الفجوات. لمس جدار ينهي الجولة.'],
      tr: ['Yükselmek için dokun', 'Çarptın!', 'Çöküş!', 'Yükselmek için dokun; bırak, düşersin. Duvarlara değmeden boşluklardan geç. Hızlanır ve boşluklar daralır. Bir duvara çarpmak turu bitirir.'],
      vi: ['Chạm để bay lên', 'Đâm rồi!', 'Sập!', 'Chạm để bay lên; thả ra thì rơi. Bay qua các khe hở mà không chạm tường. Nhanh dần và khe hẹp dần. Chạm tường là kết thúc ván.'],
      id: ['Ketuk untuk naik', 'Menabrak!', 'Runtuh!', 'Ketuk untuk naik; lepas maka turun. Lewati celah tanpa menyentuh dinding. Makin cepat dan celah menyempit. Menyentuh dinding mengakhiri ronde.'],
      ru: ['Коснись, чтобы взлететь', 'Разбился!', 'Обвал!', 'Касайся, чтобы подниматься; отпусти — падаешь. Пролетай в просветы, не задевая стены. Быстрее, просветы уже. Удар о стену завершает раунд.'],
      de: ['Tippen zum Steigen', 'Zerschellt!', 'Einsturz!', 'Tippe zum Steigen; loslassen, dann sinkst du. Flieg durch die Lücken, ohne die Wände zu berühren. Es wird schneller und enger. Eine Wand zu berühren beendet die Runde.'],
      hi: ['ऊपर जाने को छुएं', 'टकरा गए!', 'ढह गया!', 'ऊपर उठने को छुएं; छोड़ें तो गिरते हैं। दीवार छुए बिना खाली जगहों से निकलें। तेज़ होता है, जगह सँकरी। दीवार से टकराना राउंड खत्म कर देता है।'],
      zh: ['点击上升', '撞毁了！', '坍塌！', '点击上升，松开就下落。穿过缺口，不要碰到墙壁。会越来越快、缺口越来越窄。碰到墙壁，本回合结束。']
    },
    fireflylight: {
      en: ['Tap to fly up', 'Crashed!', 'Collapse!', 'Tap to rise; let go and you drop. Fly through the gaps without touching the walls. It gets faster and the gaps get tighter. Hitting a wall ends the round.'],
      fr: ['Touche pour monter', 'Écrasé !', 'Effondrement !', 'Touche pour monter ; relâche et tu descends. Passe par les trous sans toucher les parois. Ça accélère et les trous se resserrent. Toucher une paroi termine la partie.'],
      es: ['Toca para subir', '¡Te estrellaste!', '¡Derrumbe!', 'Toca para subir; suelta y bajas. Pasa por los huecos sin tocar las paredes. Se acelera y los huecos se estrechan. Tocar una pared termina la ronda.'],
      pt: ['Toque para subir', 'Bateu!', 'Desabamento!', 'Toque para subir; solte e você desce. Passe pelos vãos sem tocar nas paredes. Acelera e os vãos apertam. Tocar numa parede encerra a rodada.'],
      ar: ['المس للصعود', 'اصطدمت!', 'انهيار!', 'المس لتصعد؛ اترك فتهبط. مُرّ عبر الفجوات دون لمس الجدران. يتسارع وتضيق الفجوات. لمس جدار ينهي الجولة.'],
      tr: ['Yükselmek için dokun', 'Çarptın!', 'Çöküş!', 'Yükselmek için dokun; bırak, düşersin. Duvarlara değmeden boşluklardan geç. Hızlanır ve boşluklar daralır. Bir duvara çarpmak turu bitirir.'],
      vi: ['Chạm để bay lên', 'Đâm rồi!', 'Sập!', 'Chạm để bay lên; thả ra thì rơi. Bay qua các khe hở mà không chạm tường. Nhanh dần và khe hẹp dần. Chạm tường là kết thúc ván.'],
      id: ['Ketuk untuk naik', 'Menabrak!', 'Runtuh!', 'Ketuk untuk naik; lepas maka turun. Lewati celah tanpa menyentuh dinding. Makin cepat dan celah menyempit. Menyentuh dinding mengakhiri ronde.'],
      ru: ['Коснись, чтобы взлететь', 'Разбился!', 'Обвал!', 'Касайся, чтобы подниматься; отпусти — падаешь. Пролетай в просветы, не задевая стены. Быстрее, просветы уже. Удар о стену завершает раунд.'],
      de: ['Tippen zum Steigen', 'Zerschellt!', 'Einsturz!', 'Tippe zum Steigen; loslassen, dann sinkst du. Flieg durch die Lücken, ohne die Wände zu berühren. Es wird schneller und enger. Eine Wand zu berühren beendet die Runde.'],
      hi: ['ऊपर जाने को छुएं', 'टकरा गए!', 'ढह गया!', 'ऊपर उठने को छुएं; छोड़ें तो गिरते हैं। दीवार छुए बिना खाली जगहों से निकलें। तेज़ होता है, जगह सँकरी। दीवार से टकराना राउंड खत्म कर देता है।'],
      zh: ['点击上升', '撞毁了！', '坍塌！', '点击上升，松开就下落。穿过缺口，不要碰到墙壁。会越来越快、缺口越来越窄。碰到墙壁，本回合结束。']
    },
    subwaydash: {
      en: ['Drag to steer', 'Crash!', 'Wipeout!', 'Drag left or right to steer and weave through the obstacles coming at you. It gets faster and more crowded. Touching anything ends the round.'],
      fr: ['Glisse pour diriger', 'Accident !', 'Terminé !', 'Glisse à gauche ou à droite pour diriger et te faufiler entre les obstacles qui arrivent. Ça devient plus rapide et plus chargé. Toucher quelque chose termine la partie.'],
      es: ['Desliza para dirigir', '¡Choque!', '¡Fuera!', 'Desliza a izquierda o derecha para dirigir y esquivar los obstáculos que vienen. Se vuelve más rápido y concurrido. Tocar algo termina la ronda.'],
      pt: ['Deslize para dirigir', 'Batida!', 'Acabou!', 'Deslize para a esquerda ou direita para dirigir e desviar dos obstáculos que vêm. Fica mais rápido e cheio. Tocar em algo encerra a rodada.'],
      ar: ['اسحب للتوجيه', 'تحطّم!', 'انتهى!', 'اسحب يسارًا أو يمينًا للتوجيه والتفاف بين العوائق القادمة. يصبح أسرع وأكثر ازدحامًا. لمس أي شيء ينهي الجولة.'],
      tr: ['Yönlendirmek için kaydır', 'Kaza!', 'Bitti!', 'Yönlendirip gelen engellerin arasından geçmek için sola ya da sağa kaydır. Daha hızlı ve kalabalık olur. Bir şeye değmek turu bitirir.'],
      vi: ['Kéo để lái', 'Tông rồi!', 'Hết!', 'Kéo trái hoặc phải để lái và né các chướng ngại vật đang lao tới. Ngày càng nhanh và đông. Chạm vào bất cứ thứ gì là kết thúc ván.'],
      id: ['Geser untuk mengarah', 'Tabrakan!', 'Selesai!', 'Geser ke kiri atau kanan untuk mengarah dan menghindari rintangan yang datang. Makin cepat dan ramai. Menyentuh apa pun mengakhiri ronde.'],
      ru: ['Веди, чтобы рулить', 'Авария!', 'Конец!', 'Веди влево или вправо, чтобы рулить и уклоняться от летящих препятствий. Становится быстрее и плотнее. Касание чего-либо завершает раунд.'],
      de: ['Ziehen zum Lenken', 'Crash!', 'Aus!', 'Ziehe nach links oder rechts, um zu lenken und den entgegenkommenden Hindernissen auszuweichen. Es wird schneller und voller. Etwas zu berühren beendet die Runde.'],
      hi: ['चलाने को खींचें', 'टक्कर!', 'खत्म!', 'चलाने और आ रही बाधाओं से बचने के लिए बाएँ या दाएँ खींचें। यह तेज़ और भीड़भाड़ वाला होता जाता है। किसी भी चीज़ को छूना राउंड खत्म कर देता है।'],
      zh: ['拖动操控', '撞上了！', '结束！', '左右拖动操控，躲避迎面而来的障碍。会越来越快、越来越挤。碰到任何东西，本回合结束。']
    },
    icecreamcatch: {
      en: ['Drag to catch', 'Missed it!', 'Over!', 'Drag left or right to move and catch the good things as they fall. Dodge the bad ones. It gets faster and busier. Missing a good one — or catching a bad one — ends the round.', 'Wrong catch!'],
      fr: ['Glisse pour attraper', 'Raté !', 'Terminé !', 'Glisse à gauche ou à droite pour attraper les bonnes choses qui tombent. Évite les mauvaises. Ça devient plus rapide et plus chargé. Rater une bonne — ou attraper une mauvaise — termine la partie.', 'Mauvaise prise !'],
      es: ['Desliza para atrapar', '¡Fallaste!', '¡Fin!', 'Desliza a izquierda o derecha para atrapar las cosas buenas que caen. Esquiva las malas. Se vuelve más rápido y concurrido. Fallar una buena — o atrapar una mala — termina la ronda.', '¡Mala atrapada!'],
      pt: ['Deslize para pegar', 'Perdeu!', 'Fim!', 'Deslize para a esquerda ou direita para pegar as coisas boas que caem. Desvie das ruins. Fica mais rápido e cheio. Perder uma boa — ou pegar uma ruim — encerra a rodada.', 'Pegou a errada!'],
      ar: ['اسحب للالتقاط', 'فاتك!', 'انتهى!', 'اسحب يسارًا أو يمينًا لالتقاط الأشياء الجيدة المتساقطة. تفادَ السيئة. يصبح أسرع وأكثر ازدحامًا. تفويت جيدة — أو التقاط سيئة — ينهي الجولة.', 'التقاط خاطئ!'],
      tr: ['Yakalamak için kaydır', 'Kaçırdın!', 'Bitti!', 'Düşen iyi şeyleri yakalamak için sola ya da sağa kaydır. Kötülerden kaç. Daha hızlı ve kalabalık olur. İyisini kaçırmak — ya da kötüsünü yakalamak — turu bitirir.', 'Yanlış yakalama!'],
      vi: ['Kéo để hứng', 'Hụt rồi!', 'Hết!', 'Kéo trái hoặc phải để hứng những thứ tốt đang rơi. Né những thứ xấu. Ngày càng nhanh và đông. Hụt thứ tốt — hoặc hứng thứ xấu — là kết thúc ván.', 'Hứng nhầm rồi!'],
      id: ['Geser untuk menangkap', 'Terlewat!', 'Selesai!', 'Geser ke kiri atau kanan untuk menangkap benda bagus yang jatuh. Hindari yang buruk. Makin cepat dan ramai. Melewatkan yang bagus — atau menangkap yang buruk — mengakhiri ronde.', 'Salah tangkap!'],
      ru: ['Веди, чтобы ловить', 'Мимо!', 'Конец!', 'Веди влево или вправо, чтобы ловить падающие хорошие вещи. Уклоняйся от плохих. Становится быстрее и плотнее. Упустить хорошую — или поймать плохую — завершает раунд.', 'Не то поймал!'],
      de: ['Ziehen zum Fangen', 'Verpasst!', 'Aus!', 'Ziehe nach links oder rechts, um die guten Dinge zu fangen, die fallen. Weiche den schlechten aus. Es wird schneller und voller. Eine gute zu verpassen — oder eine schlechte zu fangen — beendet die Runde.', 'Falsch gefangen!'],
      hi: ['पकड़ने को खींचें', 'चूक गए!', 'खत्म!', 'गिरती अच्छी चीज़ें पकड़ने के लिए बाएँ या दाएँ खींचें। बुरी से बचें। यह तेज़ और व्यस्त होता जाता है। अच्छी चूकना — या बुरी पकड़ना — राउंड खत्म कर देता है।', 'गलत पकड़!'],
      zh: ['拖动接取', '没接住！', '结束！', '左右拖动接住掉落的好东西，躲开坏的。会越来越快、越来越密。漏掉好的——或接到坏的——本回合结束。', '接错了！']
    },
    popcorncatch: {
      en: ['Drag to catch', 'Missed it!', 'Over!', 'Drag left or right to move and catch the good things as they fall. Dodge the bad ones. It gets faster and busier. Missing a good one — or catching a bad one — ends the round.', 'Wrong catch!'],
      fr: ['Glisse pour attraper', 'Raté !', 'Terminé !', 'Glisse à gauche ou à droite pour attraper les bonnes choses qui tombent. Évite les mauvaises. Ça devient plus rapide et plus chargé. Rater une bonne — ou attraper une mauvaise — termine la partie.', 'Mauvaise prise !'],
      es: ['Desliza para atrapar', '¡Fallaste!', '¡Fin!', 'Desliza a izquierda o derecha para atrapar las cosas buenas que caen. Esquiva las malas. Se vuelve más rápido y concurrido. Fallar una buena — o atrapar una mala — termina la ronda.', '¡Mala atrapada!'],
      pt: ['Deslize para pegar', 'Perdeu!', 'Fim!', 'Deslize para a esquerda ou direita para pegar as coisas boas que caem. Desvie das ruins. Fica mais rápido e cheio. Perder uma boa — ou pegar uma ruim — encerra a rodada.', 'Pegou a errada!'],
      ar: ['اسحب للالتقاط', 'فاتك!', 'انتهى!', 'اسحب يسارًا أو يمينًا لالتقاط الأشياء الجيدة المتساقطة. تفادَ السيئة. يصبح أسرع وأكثر ازدحامًا. تفويت جيدة — أو التقاط سيئة — ينهي الجولة.', 'التقاط خاطئ!'],
      tr: ['Yakalamak için kaydır', 'Kaçırdın!', 'Bitti!', 'Düşen iyi şeyleri yakalamak için sola ya da sağa kaydır. Kötülerden kaç. Daha hızlı ve kalabalık olur. İyisini kaçırmak — ya da kötüsünü yakalamak — turu bitirir.', 'Yanlış yakalama!'],
      vi: ['Kéo để hứng', 'Hụt rồi!', 'Hết!', 'Kéo trái hoặc phải để hứng những thứ tốt đang rơi. Né những thứ xấu. Ngày càng nhanh và đông. Hụt thứ tốt — hoặc hứng thứ xấu — là kết thúc ván.', 'Hứng nhầm rồi!'],
      id: ['Geser untuk menangkap', 'Terlewat!', 'Selesai!', 'Geser ke kiri atau kanan untuk menangkap benda bagus yang jatuh. Hindari yang buruk. Makin cepat dan ramai. Melewatkan yang bagus — atau menangkap yang buruk — mengakhiri ronde.', 'Salah tangkap!'],
      ru: ['Веди, чтобы ловить', 'Мимо!', 'Конец!', 'Веди влево или вправо, чтобы ловить падающие хорошие вещи. Уклоняйся от плохих. Становится быстрее и плотнее. Упустить хорошую — или поймать плохую — завершает раунд.', 'Не то поймал!'],
      de: ['Ziehen zum Fangen', 'Verpasst!', 'Aus!', 'Ziehe nach links oder rechts, um die guten Dinge zu fangen, die fallen. Weiche den schlechten aus. Es wird schneller und voller. Eine gute zu verpassen — oder eine schlechte zu fangen — beendet die Runde.', 'Falsch gefangen!'],
      hi: ['पकड़ने को खींचें', 'चूक गए!', 'खत्म!', 'गिरती अच्छी चीज़ें पकड़ने के लिए बाएँ या दाएँ खींचें। बुरी से बचें। यह तेज़ और व्यस्त होता जाता है। अच्छी चूकना — या बुरी पकड़ना — राउंड खत्म कर देता है।', 'गलत पकड़!'],
      zh: ['拖动接取', '没接住！', '结束！', '左右拖动接住掉落的好东西，躲开坏的。会越来越快、越来越密。漏掉好的——或接到坏的——本回合结束。', '接错了！']
    },
    veggiecatch: {
      en: ['Drag to catch', 'Missed it!', 'Over!', 'Drag left or right to move and catch the good things as they fall. Dodge the bad ones. It gets faster and busier. Missing a good one — or catching a bad one — ends the round.', 'Wrong catch!'],
      fr: ['Glisse pour attraper', 'Raté !', 'Terminé !', 'Glisse à gauche ou à droite pour attraper les bonnes choses qui tombent. Évite les mauvaises. Ça devient plus rapide et plus chargé. Rater une bonne — ou attraper une mauvaise — termine la partie.', 'Mauvaise prise !'],
      es: ['Desliza para atrapar', '¡Fallaste!', '¡Fin!', 'Desliza a izquierda o derecha para atrapar las cosas buenas que caen. Esquiva las malas. Se vuelve más rápido y concurrido. Fallar una buena — o atrapar una mala — termina la ronda.', '¡Mala atrapada!'],
      pt: ['Deslize para pegar', 'Perdeu!', 'Fim!', 'Deslize para a esquerda ou direita para pegar as coisas boas que caem. Desvie das ruins. Fica mais rápido e cheio. Perder uma boa — ou pegar uma ruim — encerra a rodada.', 'Pegou a errada!'],
      ar: ['اسحب للالتقاط', 'فاتك!', 'انتهى!', 'اسحب يسارًا أو يمينًا لالتقاط الأشياء الجيدة المتساقطة. تفادَ السيئة. يصبح أسرع وأكثر ازدحامًا. تفويت جيدة — أو التقاط سيئة — ينهي الجولة.', 'التقاط خاطئ!'],
      tr: ['Yakalamak için kaydır', 'Kaçırdın!', 'Bitti!', 'Düşen iyi şeyleri yakalamak için sola ya da sağa kaydır. Kötülerden kaç. Daha hızlı ve kalabalık olur. İyisini kaçırmak — ya da kötüsünü yakalamak — turu bitirir.', 'Yanlış yakalama!'],
      vi: ['Kéo để hứng', 'Hụt rồi!', 'Hết!', 'Kéo trái hoặc phải để hứng những thứ tốt đang rơi. Né những thứ xấu. Ngày càng nhanh và đông. Hụt thứ tốt — hoặc hứng thứ xấu — là kết thúc ván.', 'Hứng nhầm rồi!'],
      id: ['Geser untuk menangkap', 'Terlewat!', 'Selesai!', 'Geser ke kiri atau kanan untuk menangkap benda bagus yang jatuh. Hindari yang buruk. Makin cepat dan ramai. Melewatkan yang bagus — atau menangkap yang buruk — mengakhiri ronde.', 'Salah tangkap!'],
      ru: ['Веди, чтобы ловить', 'Мимо!', 'Конец!', 'Веди влево или вправо, чтобы ловить падающие хорошие вещи. Уклоняйся от плохих. Становится быстрее и плотнее. Упустить хорошую — или поймать плохую — завершает раунд.', 'Не то поймал!'],
      de: ['Ziehen zum Fangen', 'Verpasst!', 'Aus!', 'Ziehe nach links oder rechts, um die guten Dinge zu fangen, die fallen. Weiche den schlechten aus. Es wird schneller und voller. Eine gute zu verpassen — oder eine schlechte zu fangen — beendet die Runde.', 'Falsch gefangen!'],
      hi: ['पकड़ने को खींचें', 'चूक गए!', 'खत्म!', 'गिरती अच्छी चीज़ें पकड़ने के लिए बाएँ या दाएँ खींचें। बुरी से बचें। यह तेज़ और व्यस्त होता जाता है। अच्छी चूकना — या बुरी पकड़ना — राउंड खत्म कर देता है।', 'गलत पकड़!'],
      zh: ['拖动接取', '没接住！', '结束！', '左右拖动接住掉落的好东西，躲开坏的。会越来越快、越来越密。漏掉好的——或接到坏的——本回合结束。', '接错了！']
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
  // heart outline centred at origin: bottom tip at (0,r), two lobes above (used by the « drague » games)
  function heartPath(c, r) { c.beginPath(); c.moveTo(0, r); c.bezierCurveTo(-r * 1.3, -r * 0.2, -r * 0.5, -r * 1.1, 0, -r * 0.4); c.bezierCurveTo(r * 0.5, -r * 1.1, r * 1.3, -r * 0.2, 0, r); c.closePath(); }

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
    // v3053 (propriétaire) : vue de DOS, le skieur file vers le HAUT de l'écran et portes / sapins arrivent du haut.
    // Simple miroir vertical de l'AFFICHAGE (fy) : la simulation (positions, vitesses, collisions, hasard) est identique.
    function fy(y) { return T + H - y; }
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
        if (aval) { aval.t += dt; aval.y += (H - T) * 0.9 * dt; if (!aval.hit && aval.y > sy) { aval.hit = 1; dead = 1; A.burst(sx, fy(sy), 24, ['#FFFFFF', '#E2E8F0'], 220, 0.8, 4); A.shake(0.5); } return; }
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
          if (o.k === 'gate' && !o.done && o.y <= sy) { o.done = 1; if (Math.abs(sx - o.x) < o.w / 2 - sz * 0.15) { gates++; A.burst(o.x, fy(sy), 6, [o.c, '#fff'], 100, 0.4, 2.4, 0); } else { if (A.live()) { if (A.fail(A.l.fail2)) { dead = 1; } } } }
          if (o.k === 'gate') { for (var q = -1; q <= 1; q += 2) { var fx = o.x + q * o.w / 2; if (Math.abs(sx - fx) < sz * 0.3 && Math.abs(sy - o.y) < sz * 0.4 && A.live()) { if (A.fail(A.l.fail)) dead = 1; } } }
          else if (Math.abs(sx - o.x) < sz * (o.k === 'tree' ? 0.45 : 0.6) && o.y - sy < sz * 0.3 && o.y - sy > -sz * 0.5) { if (A.live()) { if (A.fail(A.l.fail)) { dead = 1; A.burst(sx, fy(sy), 16, ['#FFFFFF', '#E2E8F0', '#1D4ED8'], 180, 0.6, 3); A.shake(0.3); } } }
        }
      },
      draw: function (c) {
        A.bg(bg);
        var i, o, off = dist % 40;
        c.strokeStyle = 'rgba(148,163,184,.25)'; c.lineWidth = 1; for (i = 0; i < 6; i++) { var yy = T + ((i * 90 - dist * 1) % (H - T + 90) + (H - T + 90)) % (H - T + 90); yy = fy(yy); c.beginPath(); c.moveTo(0, yy); c.quadraticCurveTo(W / 2, yy - 20, W, yy); c.stroke(); } void off;
        var list = objs.slice().sort(function (a, b) { return b.y - a.y; }), drawn = false, SY = fy(sy);
        // v3053 (propriétaire : « on ne comprend pas, il vient vers nous ») : skieur vu de DOS qui file vers le haut de l'écran :
        // pointes des skis vers le haut, dos de la veste rouge, arrière du casque (aucune peau visible) — dessin seulement
        var skier = function () {
          var u = sz;
          c.save(); c.translate(sx, SY); c.rotate(ang * 0.55);
          c.fillStyle = 'rgba(15,23,42,.13)'; c.beginPath(); c.ellipse(0, u * 0.5, u * 0.5, u * 0.14, 0, 0, TAU); c.fill();
          c.lineCap = 'round';
          [-1, 1].forEach(function (q) { // skis (pointes vers le haut = vers où il va)
            c.strokeStyle = '#1D4ED8'; c.lineWidth = u * 0.11; c.beginPath(); c.moveTo(q * u * 0.33, u * 0.6); c.lineTo(q * u * 0.31, -u * 0.78); c.stroke();
            c.strokeStyle = '#93C5FD'; c.lineWidth = u * 0.05; c.beginPath(); c.moveTo(q * u * 0.31, -u * 0.6); c.lineTo(q * u * 0.305, -u * 0.82); c.stroke();
          });
          c.strokeStyle = '#94A3B8'; c.lineWidth = u * 0.045; c.beginPath(); c.moveTo(-u * 0.44, -u * 0.3); c.lineTo(-u * 0.62, u * 0.5); c.moveTo(u * 0.44, -u * 0.3); c.lineTo(u * 0.62, u * 0.5); c.stroke(); // bâtons (traînent derrière)
          circ(c, -u * 0.62, u * 0.5, u * 0.05, '#64748B'); circ(c, u * 0.62, u * 0.5, u * 0.05, '#64748B');
          c.fillStyle = '#111827'; rr(c, -u * 0.42, u * 0.2, u * 0.19, u * 0.16, u * 0.04); c.fill(); rr(c, u * 0.23, u * 0.2, u * 0.19, u * 0.16, u * 0.04); c.fill(); // talons des chaussures
          c.strokeStyle = '#1E3A8A'; c.lineWidth = u * 0.18; c.beginPath(); c.moveTo(-u * 0.14, -u * 0.18); c.lineTo(-u * 0.3, u * 0.04); c.lineTo(-u * 0.33, u * 0.2); c.moveTo(u * 0.14, -u * 0.18); c.lineTo(u * 0.3, u * 0.04); c.lineTo(u * 0.33, u * 0.2); c.stroke(); // jambes fléchies (de dos)
          c.strokeStyle = '#DC2626'; c.lineWidth = u * 0.13; c.beginPath(); c.moveTo(-u * 0.26, -u * 0.6); c.lineTo(-u * 0.4, -u * 0.42); c.lineTo(-u * 0.44, -u * 0.3); c.moveTo(u * 0.26, -u * 0.6); c.lineTo(u * 0.4, -u * 0.42); c.lineTo(u * 0.44, -u * 0.3); c.stroke(); // bras
          c.fillStyle = lg(c, -u * 0.32, 0, u * 0.32, 0, ['#991B1B', '#EF4444', '#B91C1C']); rr(c, -u * 0.31, -u * 0.7, u * 0.62, u * 0.56, u * 0.18); c.fill(); // dos de la veste
          c.fillStyle = 'rgba(0,0,0,.18)'; c.fillRect(-u * 0.015, -u * 0.62, u * 0.03, u * 0.42); // couture du dos
          c.fillStyle = '#F8FAFC'; c.fillRect(-u * 0.31, -u * 0.44, u * 0.62, u * 0.06);
          circ(c, -u * 0.44, -u * 0.3, u * 0.07, '#1F2937'); circ(c, u * 0.44, -u * 0.3, u * 0.07, '#1F2937'); // gants
          c.fillStyle = '#7F1D1D'; rr(c, -u * 0.13, -u * 0.76, u * 0.26, u * 0.09, u * 0.04); c.fill(); // col
          circ(c, 0, -u * 0.9, u * 0.23, rg(c, -u * 0.07, -u * 0.98, u * 0.26, ['#FDE68A', '#FBBF24', '#D97706'])); // arrière du casque
          c.fillStyle = '#0F172A'; rr(c, -u * 0.235, -u * 0.92, u * 0.47, u * 0.07, u * 0.03); c.fill(); // sangle du masque (vue de dos)
          c.fillStyle = 'rgba(255,255,255,.55)'; c.beginPath(); c.ellipse(-u * 0.08, -u * 1.03, u * 0.08, u * 0.04, -0.4, 0, TAU); c.fill(); // reflet
          c.restore();
        };
        for (i = 0; i < list.length; i++) {
          o = list[i];
          if (!drawn && fy(o.y) > SY) { if (!dead || !aval) skier(); drawn = true; }
          var oy = fy(o.y);
          if (o.k === 'tree') c.drawImage(treeS, o.x - sz * 1.2, oy - sz * 3, sz * 2.4, sz * 3);
          else if (o.k === 'rock') c.drawImage(rockS, o.x - sz * 0.9, oy - sz * 1.2, sz * 1.8, sz * 1.2);
          else { for (var q = -1; q <= 1; q += 2) { var fx = o.x + q * o.w / 2; c.strokeStyle = '#334155'; c.lineWidth = 2; c.beginPath(); c.moveTo(fx, oy); c.lineTo(fx, oy - sz * 1.3); c.stroke(); c.fillStyle = o.c; c.beginPath(); c.moveTo(fx, oy - sz * 1.3); c.lineTo(fx - q * sz * 0.7, oy - sz * 1.05); c.lineTo(fx, oy - sz * 0.8); c.fill(); } if (!o.done) { c.strokeStyle = 'rgba(100,116,139,.25)'; c.setLineDash([4, 6]); c.beginPath(); c.moveTo(o.x - o.w / 2, oy); c.lineTo(o.x + o.w / 2, oy); c.stroke(); c.setLineDash([]); } }
        }
        if (!drawn && (!dead || !aval)) skier();
        for (i = 0; i < spray.length; i++) { c.globalAlpha = 1 - spray[i].t / 0.5; circ(c, spray[i].x, fy(spray[i].y - sz), 2.5, '#FFFFFF'); } c.globalAlpha = 1;
        if (aval) { var ay = fy(aval.y); c.fillStyle = lg(c, 0, ay + (H - T) * 0.4, 0, ay, ['rgba(255,255,255,0)', '#FFFFFF']); c.fillRect(0, ay, W, H - ay); for (i = 0; i < 8; i++) circ(c, (i + 0.5) * W / 8, ay, W / 10, '#F8FAFC'); }
      },
      down: function (x) { drag = { x: x, s: tx }; },
      move: function (x) { if (drag && !dead) tx = clamp(drag.s + (x - drag.x) * 1.4, 0, W); },
      up: function () { drag = null; },
      key: function (k) { if (k === 'left') tx = Math.max(0, tx - W * 0.15); else if (k === 'right') tx = Math.min(W, tx + W * 0.15); },
      boom: function () { aval = { t: 0, y: T - (H - T) * 0.3 }; drag = null; A.shake(0.2); },
      win: function () { won = 0.001; drag = null; A.burst(sx, fy(sy), 16, ['#FDE68A', '#EF4444', '#2563EB'], 150, 0.6, 3); },
      dbg: function () { return { sx: sx, sy: sy, ang: ang, sz: sz, objs: objs.map(function (o) { return [o.k, o.x | 0, o.y | 0, o.w | 0, o.done ? 1 : 0]; }), dead: dead, gates: gates }; }
    };
  }, 'drag', 0.45); // v3053 : l'aide « glisse » au-dessus du skieur (il est maintenant en bas)

  /* ================================================================== ROAD RACE (jeux « qu'on contrôle », propriétaire) — une
     autoroute de nuit : glisse ta voiture pour te faufiler dans la circulation qui descend. La route accélère et se remplit ;
     toucher une voiture termine. La fin secrète = un carambolage. */
  boot('roadrace', function (A) {
    var W, H, T, dpr, bg, cw, ch, px, py, rx0, rx1, cars = [], t = 0, spT = 0, dead = 0, won = 0, crash = null, dash = 0, drag = null, meS, carS = {};
    var COLS = [['#FCA5A5', '#DC2626', '#7F1D1D'], ['#93C5FD', '#2563EB', '#1E3A8A'], ['#FDE68A', '#D97706', '#92400E'], ['#86EFAC', '#16A34A', '#14532D'], ['#E9D5FF', '#9333EA', '#4C1D95'], ['#F9A8D4', '#DB2777', '#831843'], ['#E5E7EB', '#9CA3AF', '#374151']];
    function carSprite(w, h, cols, up) {
      return mkc(w + 8, h + 8, dpr, function (c, cw2, ch2) {
        c.translate(cw2 / 2, ch2 / 2);
        c.fillStyle = 'rgba(0,0,0,.3)'; rr(c, -w / 2 + 2, -h / 2 + 4, w, h, w * 0.28); c.fill();
        c.fillStyle = lg(c, -w / 2, -h / 2, w / 2, h / 2, cols); rr(c, -w / 2, -h / 2, w, h, w * 0.26); c.fill();
        c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = 1.4; rr(c, -w / 2, -h / 2, w, h, w * 0.26); c.stroke();
        c.fillStyle = 'rgba(15,23,42,.72)'; rr(c, -w * 0.32, up ? -h * 0.30 : -h * 0.02, w * 0.64, h * 0.34, w * 0.12); c.fill();
        c.fillStyle = 'rgba(30,41,59,.5)'; rr(c, -w * 0.30, up ? h * 0.06 : -h * 0.40, w * 0.60, h * 0.30, w * 0.12); c.fill();
        var ly = up ? -h / 2 + 2 : h / 2 - 2, back = up ? h / 2 - 2 : -h / 2 + 2;
        circ(c, -w * 0.3, ly, w * 0.1, up ? '#FFFDE7' : '#FCA5A5'); circ(c, w * 0.3, ly, w * 0.1, up ? '#FFFDE7' : '#FCA5A5');
        c.fillStyle = up ? '#F87171' : '#FECACA'; c.fillRect(-w * 0.42, back - 1.5, w * 0.16, 3); c.fillRect(w * 0.26, back - 1.5, w * 0.16, 3);
        c.fillStyle = cols[1]; c.fillRect(-w / 2 - 3, -h * 0.06, 4, h * 0.13); c.fillRect(w / 2 - 1, -h * 0.06, 4, h * 0.13);
      });
    }
    function spawn(live) {
      var lv = live ? A.lv() : 0.2, lanes = 4, lane = (Math.random() * lanes) | 0, laneW = (rx1 - rx0) / lanes, x = rx0 + laneW * (lane + 0.5);
      for (var i = 0; i < cars.length; i++) if (Math.abs(cars[i].x - x) < cw * 0.9 && cars[i].y < T + ch * 1.7) return;
      cars.push({ x: x, y: T - ch, vy: (H - T) * (0.42 + 0.5 * lv) * rnd(0.9, 1.15), k: (Math.random() * COLS.length) | 0 });
    }
    return {
      size: function (w, h, uu, d, top) {
        W = w; H = h; dpr = d; T = top; rx0 = W * 0.14; rx1 = W * 0.86;
        cw = clamp((rx1 - rx0) / 4 * 0.74, 26, 72); ch = cw * 1.7; py = H - ch * 0.9; if (px == null) px = W / 2;
        carS = {}; COLS.forEach(function (cl, i) { carS[i] = carSprite(cw, ch, cl, false); });
        meS = carSprite(cw, ch, ['#BAE6FD', '#0EA5E9', '#075985'], true);
        bg = mkc(W, H, dpr, function (c) {
          c.fillStyle = '#0F2A17'; c.fillRect(0, 0, W, H);
          c.fillStyle = lg(c, 0, T, 0, H, ['#1F2937', '#374151', '#1F2937']); c.fillRect(rx0, 0, rx1 - rx0, H);
          c.fillStyle = '#E5E7EB'; c.fillRect(rx0 - 4, 0, 4, H); c.fillRect(rx1, 0, 4, H);
          for (var q = 0; q < 34; q++) { var sx = (q * 61) % W; if (sx > rx0 - 10 && sx < rx1 + 10) continue; c.globalAlpha = 0.45 + Math.random() * 0.4; circ(c, sx, (q * 37) % (T + 20), q % 4 ? 0.8 : 1.4, '#fff'); } c.globalAlpha = 1;
        });
      },
      reset: function () { cars = []; dead = 0; won = 0; crash = null; spT = 0.5; px = W / 2; dash = 0; drag = null; },
      step: function (dt, live) {
        t += dt; var lv = live ? A.lv() : 0.2, i, e, spd = (H - T) * (0.5 + 0.55 * lv);
        dash += spd * dt;
        if (crash) { crash.t += dt; for (i = cars.length - 1; i >= 0; i--) { cars[i].y += cars[i].vy * 0.3 * dt; cars[i].x += Math.sin(t * 8 + i) * W * 0.3 * dt; } return; }
        if (dead || won) return;
        if (A.idle()) {
          var ahead = cars.filter(function (q) { return q.y > T && q.y < py && q.y > py - ch * 4; }), best = px, bd = -1;
          for (var gx = rx0 + cw; gx <= rx1 - cw; gx += (rx1 - rx0 - 2 * cw) / 6) { var dmin = 1e9; ahead.forEach(function (q) { var dd = Math.hypot((q.x - gx) * 1.4, q.y - py); if (dd < dmin) dmin = dd; }); if (dmin > bd) { bd = dmin; best = gx; } }
          px += clamp(best - px, -W * 1.1 * dt, W * 1.1 * dt);
        }
        px = clamp(px, rx0 + cw * 0.5, rx1 - cw * 0.5);
        spT -= dt; if (spT <= 0) { spawn(live); if (live && lv > 0.5 && Math.random() < 0.4) spawn(live); spT = Math.max(0.32, 1.2 - 0.8 * lv) * rnd(0.7, 1.25); }
        for (i = cars.length - 1; i >= 0; i--) {
          e = cars[i]; e.y += (e.vy + spd * 0.15) * dt;
          if (e.y - ch * 0.5 > H) { cars.splice(i, 1); continue; }
          if (Math.abs(e.x - px) < cw * 0.82 && Math.abs(e.y - py) < ch * 0.84) {
            boomFx(A, (e.x + px) / 2, (e.y + py) / 2, 1.2); A.shake(0.5);
            if (A.live()) { if (A.fail(A.l.fail)) dead = 1; }
            cars.splice(i, 1); return;
          }
        }
      },
      draw: function (c) {
        A.bg(bg);
        c.strokeStyle = 'rgba(253,230,138,.85)'; c.lineWidth = Math.max(3, cw * 0.1); c.setLineDash([ch * 0.6, ch * 0.5]); c.lineDashOffset = -(dash % (ch * 1.1));
        for (var ln = 1; ln < 4; ln++) { var lx = rx0 + (rx1 - rx0) * ln / 4; c.beginPath(); c.moveTo(lx, -ch); c.lineTo(lx, H + ch); c.stroke(); }
        c.setLineDash([]);
        for (var i = 0; i < cars.length; i++) { var e = cars[i], img = carS[e.k]; c.drawImage(img, e.x - img.w / 2, e.y - img.h / 2, img.w, img.h); }
        if (!dead) {
          var g = c.createLinearGradient(px, py - ch, px, py); g.addColorStop(0, 'rgba(191,219,254,0)'); g.addColorStop(1, 'rgba(191,219,254,.16)');
          c.fillStyle = g; c.beginPath(); c.moveTo(px - cw * 0.3, py - ch * 0.4); c.lineTo(px - cw * 1.1, py - ch * 2.4); c.lineTo(px + cw * 1.1, py - ch * 2.4); c.lineTo(px + cw * 0.3, py - ch * 0.4); c.fill();
          c.drawImage(meS, px - meS.w / 2, py - meS.h / 2, meS.w, meS.h);
        }
      },
      down: function (x) { drag = { x: x, s: px }; },
      move: function (x) { if (drag && !dead) px = clamp(drag.s + (x - drag.x) * 1.25, rx0 + cw * 0.5, rx1 - cw * 0.5); },
      up: function () { drag = null; },
      key: function (k) { if (k === 'left') px -= cw * 0.7; else if (k === 'right') px += cw * 0.7; px = clamp(px, rx0 + cw * 0.5, rx1 - cw * 0.5); },
      boom: function () { crash = { t: 0 }; drag = null; cars.forEach(function (e) { e.vy *= 0.4; }); A.explode(px, py - ch * 0.2, 1.3); },
      win: function () { won = 0.001; drag = null; A.burst(px, py - ch * 0.5, 16, ['#BAE6FD', '#FFFFFF', '#FDE68A'], 160, 0.6, 3); },
      dbg: function () { return { px: px | 0, py: py | 0, cars: cars.length, dead: dead }; }
    };
  }, 'drag', 0.5);

  /* ================================================================== AIR RAID (jeux de guerre, propriétaire « j'aime les jeux de
     guerre ») — une base de DCA la nuit : touche les avions ennemis pour les abattre avant qu'ils touchent la base en bas.
     Ça accélère et se densifie ; un avion à la base termine. La fin secrète = un bombardement. */
  boot('airraid', function (A) {
    var W, H, T, dpr, bg, tx, ty, tr, planes = [], bul = [], ang = -Math.PI / 2, cool = 0, dead = 0, won = 0, raid = null, t = 0, spT = 0, kills = 0, aiT = 0, planeS;
    function planeSprite() {
      var s = tr * 1.9;
      return mkc(s, s, dpr, function (c, w) {
        c.translate(w / 2, w / 2);
        c.fillStyle = lg(c, 0, -s * 0.4, 0, s * 0.4, ['#64748B', '#334155', '#1E293B']);
        rr(c, -s * 0.09, -s * 0.35, s * 0.18, s * 0.72, s * 0.08); c.fill();
        c.beginPath(); c.moveTo(0, s * 0.44); c.lineTo(s * 0.1, s * 0.28); c.lineTo(-s * 0.1, s * 0.28); c.closePath(); c.fill();
        c.fillStyle = lg(c, -s * 0.45, 0, s * 0.45, 0, ['#475569', '#1E293B']); c.beginPath(); c.moveTo(-s * 0.46, 0); c.lineTo(s * 0.46, 0); c.lineTo(s * 0.12, s * 0.16); c.lineTo(-s * 0.12, s * 0.16); c.closePath(); c.fill();
        c.beginPath(); c.moveTo(-s * 0.2, -s * 0.34); c.lineTo(s * 0.2, -s * 0.34); c.lineTo(s * 0.07, -s * 0.22); c.lineTo(-s * 0.07, -s * 0.22); c.closePath(); c.fill();
        circ(c, 0, s * 0.02, s * 0.08, '#7DD3FC'); circ(c, 0, s * 0.42, s * 0.05, '#F87171');
      });
    }
    function addPlane(live) {
      var lv = live ? A.lv() : 0.2;
      planes.push({ x: rnd(W * 0.12, W * 0.88), y: T - tr, vy: (H - T) * (0.1 + 0.14 * lv) * rnd(0.85, 1.2), vx: rnd(-0.4, 0.4) * W * 0.05, wob: rnd(0, TAU) });
    }
    function fire(x, y) {
      if (cool > 0 || dead || raid || won) return;
      ang = Math.atan2(y - ty, x - tx); cool = 0.18; var v = Math.max(W, H) * 1.4;
      bul.push({ x: tx + Math.cos(ang) * tr, y: ty + Math.sin(ang) * tr, vx: Math.cos(ang) * v, vy: Math.sin(ang) * v, l: 1.1 });
      A.sx('gun', { k: 'cannon', v: 0.5 });
    }
    return {
      size: function (w, h, uu, d, top) {
        W = w; H = h; dpr = d; T = top; tx = W / 2; ty = H - clamp((H - T) * 0.1, 18, 54); tr = clamp(Math.min(W, H - T) * 0.06, 18, 40);
        planeS = planeSprite();
        bg = mkc(W, H, dpr, function (c) {
          c.fillStyle = lg(c, 0, 0, 0, H, ['#030718', '#0B1026', '#241036']); c.fillRect(0, 0, W, H); stars(c, W, H, A.lite ? 45 : 110, 0, ty - (H - T) * 0.24);
          c.fillStyle = lg(c, 0, ty - (H - T) * 0.3, 0, ty, ['rgba(244,63,94,0)', 'rgba(244,63,94,.16)', 'rgba(249,115,22,.3)']); c.fillRect(0, ty - (H - T) * 0.3, W, (H - T) * 0.3);
          var baseY = ty - 1;
          for (var bx2 = -4; bx2 < W;) { var bw2 = rnd(W * 0.07, W * 0.13), bh2 = rnd((H - T) * 0.1, (H - T) * 0.26); c.fillStyle = '#141C32'; c.fillRect(bx2, baseY - bh2, bw2, bh2); c.fillStyle = 'rgba(253,224,71,.5)'; for (var wy = baseY - bh2 + 6; wy < baseY - 6; wy += 11) for (var wx = bx2 + 4; wx < bx2 + bw2 - 4; wx += 9) if (Math.random() < 0.4) c.fillRect(wx, wy, 3, 4); bx2 += bw2 + 2; }
          c.fillStyle = lg(c, 0, ty, 0, H, ['#1C2436', '#0E1322']); c.fillRect(0, ty, W, H - ty);
          [0.22, 0.78].forEach(function (fx) { var g = c.createLinearGradient(W * fx, ty, W * fx + (fx < 0.5 ? -1 : 1) * W * 0.18, T); g.addColorStop(0, 'rgba(191,219,254,.16)'); g.addColorStop(1, 'rgba(191,219,254,0)'); c.fillStyle = g; c.beginPath(); c.moveTo(W * fx - 12, ty); c.lineTo(W * fx + 12, ty); c.lineTo(W * fx + (fx < 0.5 ? -1 : 1) * W * 0.24, T); c.closePath(); c.fill(); });
        });
      },
      reset: function () { planes = []; bul = []; dead = 0; won = 0; raid = null; spT = 0.4; kills = 0; ang = -Math.PI / 2; },
      step: function (dt, live) {
        t += dt; cool = Math.max(0, cool - dt); var lv = live ? A.lv() : 0.2, i, j, p, b;
        if (raid) { raid.t += dt; raid.x += W * 1.3 * dt; if (!raid.hit && raid.x > tx) { raid.hit = 1; dead = 1; boomFx(A, tx, ty, 1.8); A.shake(0.6); } return; }
        if (dead || won) return;
        spT -= dt; if (spT <= 0 && planes.length < 3 + Math.round(6 * lv)) { addPlane(live); spT = Math.max(0.5, 2 - 1.3 * lv) * rnd(0.7, 1.3); }
        for (i = bul.length - 1; i >= 0; i--) {
          b = bul[i]; b.x += b.vx * dt; b.y += b.vy * dt; b.l -= dt; if (b.l <= 0 || b.y < T - 40 || b.x < -40 || b.x > W + 40) { bul.splice(i, 1); continue; }
          for (j = planes.length - 1; j >= 0; j--) { p = planes[j]; if (Math.hypot(b.x - p.x, b.y - p.y) < tr * 1.1) { bul.splice(i, 1); planes.splice(j, 1); kills++; boomFx(A, p.x, p.y, 0.9); break; } }
        }
        for (i = planes.length - 1; i >= 0; i--) {
          p = planes[i]; p.wob += dt * 4; p.y += p.vy * dt; p.x += p.vx * dt + Math.sin(p.wob) * W * 0.02 * dt; p.x = clamp(p.x, tr, W - tr);
          if (p.y + tr * 0.5 > ty) { if (A.live()) { if (A.fail(A.l.fail)) { dead = 1; boomFx(A, p.x, ty, 1.4); A.shake(0.5); } return; } planes.splice(i, 1); }
        }
        if (A.idle()) { aiT += dt; if (aiT > 0.3) { aiT = 0; var near = planes.slice().sort(function (a2, b2) { return b2.y - a2.y; })[0]; if (near) fire(near.x + near.vx * 0.1, near.y + near.vy * 0.12); } }
      },
      draw: function (c) {
        A.bg(bg); var i, p, b;
        c.strokeStyle = '#FDE68A'; c.lineWidth = 3; c.lineCap = 'round'; for (i = 0; i < bul.length; i++) { b = bul[i]; c.beginPath(); c.moveTo(b.x, b.y); c.lineTo(b.x - b.vx * 0.02, b.y - b.vy * 0.02); c.stroke(); }
        for (i = 0; i < planes.length; i++) { p = planes[i]; c.save(); c.translate(p.x, p.y); c.rotate(Math.sin(p.wob) * 0.12); c.drawImage(planeS, -planeS.w / 2, -planeS.h / 2, planeS.w, planeS.h); c.restore(); }
        if (raid) { var jx = raid.x, jy = T + 24; c.fillStyle = '#1E293B'; c.save(); c.translate(jx, jy); c.beginPath(); c.moveTo(-30, 0); c.lineTo(20, -8); c.lineTo(30, 0); c.lineTo(20, 8); c.closePath(); c.fill(); c.fillRect(-34, -3, 20, 6); c.restore(); }
        var bw = tr * 2.2;
        c.fillStyle = lg(c, 0, ty - tr, 0, ty + 30, ['#64748B', '#334155']); rr(c, tx - bw / 2, ty - tr * 0.5, bw, tr * 0.9 + 30, 6); c.fill();
        for (var sb = -1; sb <= 1; sb++) { circ(c, tx + sb * tr * 0.7, ty + tr * 0.1, tr * 0.42, '#A8956B'); circ(c, tx + sb * tr * 0.7, ty + tr * 0.1, tr * 0.42, 'rgba(255,255,255,.12)'); }
        if (!dead) {
          c.save(); c.translate(tx, ty - tr * 0.2); c.rotate(ang + Math.PI / 2);
          c.fillStyle = lg(c, -tr * 0.18, 0, tr * 0.18, 0, ['#94A3B8', '#475569']); rr(c, -tr * 0.18, -tr * 1.1, tr * 0.36, tr * 1.1, tr * 0.1); c.fill();
          c.fillStyle = '#F59E0B'; c.fillRect(-tr * 0.11, -tr * 1.18, tr * 0.22, tr * 0.22);
          if (cool > 0.12) circ(c, 0, -tr * 1.1, tr * 0.3, 'rgba(249,115,22,.7)');
          c.restore();
          circ(c, tx, ty - tr * 0.2, tr * 0.46, '#64748B'); circ(c, tx, ty - tr * 0.2, tr * 0.28, '#94A3B8');
        }
      },
      act: function (k, x, y) { fire(x, y); },
      key: function (k) { if (k === 'left') ang -= 0.3; else if (k === 'right') ang += 0.3; else if (k === 'up') fire(tx + Math.cos(ang) * 100, ty + Math.sin(ang) * 100); },
      boom: function () { raid = { t: 0, x: -60 }; A.sx('engine', { k: 'jet' }); },
      win: function () { won = 0.001; A.burst(tx, ty - tr, 16, ['#FDE68A', '#FFFFFF', '#86EFAC'], 160, 0.6, 3); },
      dbg: function () { return { tx: tx, ty: ty, planes: planes.length, dead: dead, kills: kills }; }
    };
  }, 'aim', 0.3);

  /* ================================================================== CUPID SHOT (jeux de drague / rencontre, propriétaire
     « les jeux de gens qui draguent ») — bon enfant : tu es Cupidon en bas, les cœurs flottent vers le ciel ; touche-les pour
     tirer une flèche et les marier avant qu'ils s'envolent par le haut. Ça accélère et se densifie. La fin secrète = un orage. */
  boot('cupidaim', function (A) {
    var W, H, T, dpr, bg, cx, cy, cr, hearts = [], arrows = [], ang = -Math.PI / 2, cool = 0, dead = 0, won = 0, storm = null, t = 0, spT = 0, matches = 0, aiT = 0, heartS;
    function heartSprite(sz, cols) {
      return mkc(sz, sz, dpr, function (c, w) {
        c.translate(w / 2, w / 2); var r = sz * 0.3;
        c.fillStyle = 'rgba(0,0,0,.18)'; c.save(); c.translate(1.5, 2); heartPath(c, r); c.fill(); c.restore();
        c.fillStyle = lg(c, 0, -r, 0, r, cols); heartPath(c, r); c.fill();
        c.fillStyle = 'rgba(255,255,255,.5)'; circ(c, -r * 0.32, -r * 0.42, r * 0.22, 'rgba(255,255,255,.55)');
      });
    }
    function drawCupid(c) {
      c.fillStyle = 'rgba(255,255,255,.85)';
      c.beginPath(); c.ellipse(cx - cr * 0.85, cy - cr * 0.2, cr * 0.5, cr * 0.82, -0.5, 0, TAU); c.fill();
      c.beginPath(); c.ellipse(cx + cr * 0.85, cy - cr * 0.2, cr * 0.5, cr * 0.82, 0.5, 0, TAU); c.fill();
      circ(c, cx, cy, cr * 0.92, rg(c, cx - cr * 0.3, cy - cr * 0.3, cr * 0.92, ['#FFE8D2', '#FBCFA3']));
      circ(c, cx - cr * 0.38, cy + cr * 0.08, cr * 0.17, 'rgba(244,114,182,.5)');
      circ(c, cx + cr * 0.38, cy + cr * 0.08, cr * 0.17, 'rgba(244,114,182,.5)');
      circ(c, cx - cr * 0.26, cy - cr * 0.12, cr * 0.09, '#3B2A2A'); circ(c, cx + cr * 0.26, cy - cr * 0.12, cr * 0.09, '#3B2A2A');
      c.save(); c.translate(cx, cy); c.rotate(ang);
      c.strokeStyle = '#92400E'; c.lineWidth = Math.max(3, cr * 0.16); c.lineCap = 'round';
      c.beginPath(); c.arc(cr * 0.2, 0, cr * 1.05, -1.15, 1.15); c.stroke();
      c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = 1.5;
      c.beginPath(); c.moveTo(cr * 0.2 + cr * 1.05 * Math.cos(-1.15), cr * 1.05 * Math.sin(-1.15)); c.lineTo(cr * 0.2 + cr * 1.05 * Math.cos(1.15), cr * 1.05 * Math.sin(1.15)); c.stroke();
      c.restore();
    }
    function addHeart(live) {
      var lv = live ? A.lv() : 0.2;
      hearts.push({ x: rnd(W * 0.14, W * 0.86), y: cy - cr * 0.6, vy: -(H - T) * (0.08 + 0.1 * lv) * rnd(0.85, 1.2), vx: rnd(-0.35, 0.35) * W * 0.05, wob: rnd(0, TAU) });
    }
    function fire(x, y) {
      if (cool > 0 || dead || storm || won) return;
      ang = Math.atan2(y - cy, x - cx); if (ang > -0.08) ang = -0.08; cool = 0.2; var v = Math.max(W, H) * 1.3;
      arrows.push({ x: cx + Math.cos(ang) * cr, y: cy + Math.sin(ang) * cr, vx: Math.cos(ang) * v, vy: Math.sin(ang) * v, l: 1.4 });
      A.sx('gun', { k: 'bow', v: 0.4 });
    }
    return {
      size: function (w, h, uu, d, top) {
        W = w; H = h; dpr = d; T = top; cx = W / 2; cy = H - clamp((H - T) * 0.12, 24, 64); cr = clamp(Math.min(W, H - T) * 0.07, 18, 42);
        heartS = heartSprite(cr * 2.2, ['#FB7185', '#E11D48', '#9F1239']);
        bg = mkc(W, H, dpr, function (c) {
          c.fillStyle = lg(c, 0, 0, 0, H, ['#4C1D95', '#7C3AED', '#EC4899', '#FB923C', '#FDE68A']); c.fillRect(0, 0, W, H);
          c.fillStyle = rg(c, W * 0.5, cy - (H - T) * 0.06, (H - T) * 0.55, ['rgba(255,247,237,.5)', 'rgba(253,186,116,0)']); c.fillRect(0, 0, W, H);
          for (var i = 0; i < (A.lite ? 10 : 24); i++) { c.globalAlpha = 0.06 + Math.random() * 0.12; circ(c, Math.random() * W, T + Math.random() * (cy - T), rnd(3, 11), '#fff'); } c.globalAlpha = 1;
          c.fillStyle = 'rgba(76,29,149,.4)'; c.beginPath(); c.moveTo(0, cy); for (var x = 0; x <= W; x += W / 7) c.lineTo(x, cy - (H - T) * 0.07 * (0.4 + Math.abs(Math.sin(x * 0.012)))); c.lineTo(W, H); c.lineTo(0, H); c.closePath(); c.fill();
          c.fillStyle = lg(c, 0, cy - 2, 0, H, ['#3B0764', '#1E1035']); c.fillRect(0, cy - 2, W, H - cy + 2);
        });
      },
      reset: function () { hearts = []; arrows = []; dead = 0; won = 0; storm = null; spT = 0.4; matches = 0; ang = -Math.PI / 2; },
      step: function (dt, live) {
        t += dt; cool = Math.max(0, cool - dt); var lv = live ? A.lv() : 0.2, i, j, h, a;
        if (storm) { storm.t += dt; if (storm.t > 0.05 && !storm.hit) { storm.hit = 1; dead = 1; boomFx(A, cx, cy, 1.3); A.shake(0.5); } return; }
        if (dead || won) return;
        spT -= dt; if (spT <= 0 && hearts.length < 3 + Math.round(5 * lv)) { addHeart(live); spT = Math.max(0.55, 2 - 1.2 * lv) * rnd(0.7, 1.3); }
        for (i = arrows.length - 1; i >= 0; i--) {
          a = arrows[i]; a.x += a.vx * dt; a.y += a.vy * dt; a.l -= dt;
          if (a.l <= 0 || a.y < T - 50 || a.x < -50 || a.x > W + 50) { arrows.splice(i, 1); continue; }
          for (j = hearts.length - 1; j >= 0; j--) { h = hearts[j]; if (Math.hypot(a.x - h.x, a.y - h.y) < cr * 1.1) { arrows.splice(i, 1); hearts.splice(j, 1); matches++; A.burst(h.x, h.y, 12, ['#FCA5A5', '#F472B6', '#FFFFFF', '#FDE68A'], 170, 0.7, 3); A.ring(h.x, h.y, cr * 2, '#F9A8D4'); break; } }
        }
        for (i = hearts.length - 1; i >= 0; i--) {
          h = hearts[i]; h.wob += dt * 3.5; h.y += h.vy * dt; h.x += h.vx * dt + Math.sin(h.wob) * W * 0.02 * dt; h.x = clamp(h.x, cr, W - cr);
          if (h.y + cr * 0.4 < T) { if (A.live()) { if (A.fail(A.l.fail)) { dead = 1; A.shake(0.4); } return; } hearts.splice(i, 1); }
        }
        if (A.idle()) { aiT += dt; if (aiT > 0.35) { aiT = 0; var near = hearts.slice().sort(function (a2, b2) { return a2.y - b2.y; })[0]; if (near) fire(near.x + near.vx * 0.1, near.y + near.vy * 0.1); } }
      },
      draw: function (c) {
        A.bg(bg); var i, h, a;
        c.strokeStyle = '#FDE68A'; c.lineWidth = 3; c.lineCap = 'round';
        for (i = 0; i < arrows.length; i++) { a = arrows[i]; c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(a.x - a.vx * 0.03, a.y - a.vy * 0.03); c.stroke(); c.save(); c.translate(a.x, a.y); c.rotate(Math.atan2(a.vy, a.vx)); poly(c, [4, 0, -7, -4, -7, 4], '#F87171'); c.restore(); }
        for (i = 0; i < hearts.length; i++) { h = hearts[i]; c.save(); c.translate(h.x, h.y); c.rotate(Math.sin(h.wob) * 0.14); c.drawImage(heartS, -heartS.w / 2, -heartS.h / 2, heartS.w, heartS.h); c.restore(); }
        if (storm) { c.fillStyle = 'rgba(30,27,75,.5)'; c.fillRect(0, 0, W, H); }
        if (!dead) drawCupid(c);
      },
      act: function (k, x, y) { fire(x, y); },
      key: function (k) { if (k === 'left') ang -= 0.3; else if (k === 'right') ang += 0.3; else if (k === 'up') fire(cx + Math.cos(ang) * 100, cy + Math.sin(ang) * 100); ang = clamp(ang, -Math.PI + 0.1, -0.08); },
      boom: function () { storm = { t: 0 }; A.sx('engine', { k: 'thunder' }); },
      win: function () { won = 0.001; A.burst(cx, cy - cr, 16, ['#FCA5A5', '#FFFFFF', '#F472B6'], 160, 0.6, 3); },
      dbg: function () { return { cx: cx, cy: cy, hearts: hearts.length, dead: dead, matches: matches }; }
    };
  }, 'aim', 0.4);

  /* ================================================================== LOVE CATCH (jeux de drague / rencontre) — bon enfant :
     ta belle lance des roses et des cœurs du balcon, glisse ton panier pour les attraper ; évite les cœurs brisés. Rater un
     cœur ou attraper un cœur brisé termine. Ça accélère et se densifie. La fin secrète = la fin du rendez-vous. */
  boot('lovecatch', function (A) {
    var W, H, T, dpr, bg, bw, bh, isz, px, py, items = [], t = 0, spT = 0, dead = 0, won = 0, matches = 0, drag = null, over = null, heartS, roseS, brokeS;
    function heartSprite() {
      return mkc(isz, isz, dpr, function (c, w) { c.translate(w / 2, w / 2); var r = isz * 0.3; c.fillStyle = lg(c, 0, -r, 0, r, ['#FB7185', '#E11D48', '#9F1239']); heartPath(c, r); c.fill(); c.fillStyle = 'rgba(255,255,255,.5)'; circ(c, -r * 0.32, -r * 0.42, r * 0.2, 'rgba(255,255,255,.55)'); });
    }
    function roseSprite() {
      return mkc(isz, isz, dpr, function (c, w) {
        c.translate(w / 2, w / 2); var r = isz * 0.24;
        c.strokeStyle = '#15803D'; c.lineWidth = isz * 0.06; c.lineCap = 'round'; c.beginPath(); c.moveTo(0, r * 0.4); c.lineTo(0, isz * 0.44); c.stroke();
        c.fillStyle = '#22C55E'; c.beginPath(); c.ellipse(isz * 0.13, isz * 0.3, isz * 0.12, isz * 0.055, -0.6, 0, TAU); c.fill();
        circ(c, 0, -isz * 0.04, r, lg(c, 0, -r, 0, r, ['#FB7185', '#BE123C']));
        circ(c, 0, -isz * 0.04, r * 0.62, 'rgba(159,18,57,.5)'); circ(c, 0, -isz * 0.04, r * 0.3, 'rgba(190,24,60,.85)');
        circ(c, -r * 0.3, -isz * 0.04 - r * 0.3, r * 0.2, 'rgba(255,255,255,.35)');
      });
    }
    function brokeSprite() {
      return mkc(isz, isz, dpr, function (c, w) {
        c.translate(w / 2, w / 2); var r = isz * 0.3;
        c.fillStyle = lg(c, 0, -r, 0, r, ['#94A3B8', '#475569']); heartPath(c, r); c.fill();
        c.strokeStyle = '#1E293B'; c.lineWidth = isz * 0.055; c.lineJoin = 'round'; c.beginPath(); c.moveTo(0, -r * 0.42); c.lineTo(-r * 0.14, -r * 0.08); c.lineTo(r * 0.12, r * 0.16); c.lineTo(-r * 0.08, r * 0.46); c.lineTo(0, r); c.stroke();
      });
    }
    function drawBasket(c) {
      var bx = px - bw / 2, byTop = py - bh * 0.5;
      c.fillStyle = 'rgba(0,0,0,.2)'; c.beginPath(); c.ellipse(px, byTop + bh, bw * 0.5, bh * 0.18, 0, 0, TAU); c.fill();
      c.fillStyle = lg(c, bx, byTop, bx, byTop + bh, ['#D97706', '#92400E']);
      c.beginPath(); c.moveTo(bx, byTop); c.lineTo(bx + bw, byTop); c.lineTo(bx + bw * 0.85, byTop + bh); c.lineTo(bx + bw * 0.15, byTop + bh); c.closePath(); c.fill();
      c.strokeStyle = 'rgba(69,26,3,.45)'; c.lineWidth = 1.4; for (var wy = byTop + 5; wy < byTop + bh - 2; wy += 5) { c.beginPath(); c.moveTo(bx + bw * 0.14, wy); c.lineTo(bx + bw * 0.86, wy); c.stroke(); }
      c.fillStyle = '#B45309'; rr(c, bx - 3, byTop - 6, bw + 6, 10, 5); c.fill();
      c.save(); c.translate(px, byTop - 2); heartPath(c, bh * 0.18); c.fillStyle = '#F472B6'; c.fill(); c.restore();
    }
    function spawn(live) {
      var lv = live ? A.lv() : 0.2, x = rnd(bw * 0.6, W - bw * 0.6);
      for (var i = 0; i < items.length; i++) if (items[i].y < T + isz * 2 && Math.abs(items[i].x - x) < isz * 1.2) return;
      var bad = Math.random() < (0.12 + 0.2 * lv), kind = bad ? 'x' : (Math.random() < 0.5 ? 'h' : 'r');
      items.push({ x: x, y: T - isz, vy: (H - T) * (0.34 + 0.46 * lv) * rnd(0.9, 1.15), rot: rnd(-0.25, 0.25), vr: rnd(-1.4, 1.4), bad: bad, kind: kind });
    }
    return {
      size: function (w, h, uu, d, top) {
        W = w; H = h; dpr = d; T = top; bw = clamp(W * 0.2, 58, 150); bh = bw * 0.56; isz = clamp(W * 0.1, 26, 58);
        py = H - clamp((H - T) * 0.08, 16, 46) - bh * 0.5; if (px == null) px = W / 2;
        heartS = heartSprite(); roseS = roseSprite(); brokeS = brokeSprite();
        bg = mkc(W, H, dpr, function (c) {
          c.fillStyle = lg(c, 0, 0, 0, H, ['#312E81', '#6D28D9', '#DB2777', '#F59E0B']); c.fillRect(0, 0, W, H);
          for (var i = 0; i < (A.lite ? 10 : 22); i++) { c.globalAlpha = 0.06 + Math.random() * 0.12; circ(c, Math.random() * W, T + Math.random() * (py - T) * 0.8, rnd(3, 10), '#fff'); } c.globalAlpha = 1;
          var ly0 = T * 0.55 + 6; c.strokeStyle = 'rgba(255,255,255,.3)'; c.lineWidth = 2; c.beginPath(); for (var x = 0; x <= W; x += 6) c.lineTo(x, ly0 + Math.sin(x * 0.02) * 7); c.stroke();
          for (var lx = 14; lx < W; lx += 46) { var ly = ly0 + Math.sin(lx * 0.02) * 7 + 7; circ(c, lx, ly, 4, ['#FDE68A', '#FCA5A5', '#A5B4FC'][((lx / 46) | 0) % 3]); }
          c.fillStyle = lg(c, 0, py - bh, 0, H, ['#4C1D95', '#2E1065']); c.fillRect(0, py - bh * 0.3, W, H - py + bh * 0.3);
        });
      },
      reset: function () { items = []; dead = 0; won = 0; over = null; spT = 0.5; px = W / 2; matches = 0; drag = null; },
      step: function (dt, live) {
        t += dt; var lv = live ? A.lv() : 0.2, i, e;
        if (over) { over.t += dt; for (i = items.length - 1; i >= 0; i--) { items[i].y += items[i].vy * 0.3 * dt; items[i].rot += items[i].vr * dt; } return; }
        if (dead || won) return;
        if (A.idle()) {
          var tgt = px, bd = 1e9;
          for (i = 0; i < items.length; i++) { e = items[i]; if (e.bad) continue; if (e.y > T && e.y < py && e.y > py - bh * 7) { var d = Math.abs(e.x - px); if (d < bd) { bd = d; tgt = e.x; } } }
          for (i = 0; i < items.length; i++) { e = items[i]; if (e.bad && e.y > py - bh * 3 && Math.abs(e.x - px) < bw * 0.55) tgt = px + (e.x < px ? bw : -bw); }
          px += clamp(tgt - px, -W * 1.1 * dt, W * 1.1 * dt);
        }
        px = clamp(px, bw * 0.5, W - bw * 0.5);
        spT -= dt; if (spT <= 0) { spawn(live); spT = Math.max(0.42, 1.25 - 0.8 * lv) * rnd(0.72, 1.25); }
        for (i = items.length - 1; i >= 0; i--) {
          e = items[i]; e.y += e.vy * dt; e.rot += e.vr * dt;
          if (Math.abs(e.x - px) < bw * 0.52 && e.y > py - bh * 0.7 && e.y < py + bh * 0.3) {
            if (e.bad) { items.splice(i, 1); A.shake(0.4); boomFx(A, e.x, py - bh * 0.2, 1); if (A.live()) { if (A.fail(A.l.fail2)) dead = 1; } return; }
            items.splice(i, 1); matches++; A.burst(e.x, py - bh * 0.2, 10, ['#FCA5A5', '#F472B6', '#FFFFFF'], 150, 0.6, 3); A.ring(e.x, py - bh * 0.2, bw * 0.55, '#F9A8D4'); continue;
          }
          if (e.y - isz * 0.5 > H) { items.splice(i, 1); if (!e.bad) { if (A.live()) { if (A.fail(A.l.fail)) { dead = 1; A.shake(0.4); } } return; } }
        }
      },
      draw: function (c) {
        A.bg(bg); var i, e, img;
        for (i = 0; i < items.length; i++) { e = items[i]; img = e.kind === 'h' ? heartS : e.kind === 'r' ? roseS : brokeS; c.save(); c.translate(e.x, e.y); c.rotate(e.rot); c.drawImage(img, -img.w / 2, -img.h / 2, img.w, img.h); c.restore(); }
        if (!dead) drawBasket(c);
      },
      down: function (x) { drag = { x: x, s: px }; },
      move: function (x) { if (drag && !dead) px = clamp(drag.s + (x - drag.x) * 1.25, bw * 0.5, W - bw * 0.5); },
      up: function () { drag = null; },
      key: function (k) { if (k === 'left') px -= bw * 0.6; else if (k === 'right') px += bw * 0.6; px = clamp(px, bw * 0.5, W - bw * 0.5); },
      boom: function () { over = { t: 0 }; drag = null; A.explode(px, py - bh * 0.2, 1.1); },
      win: function () { won = 0.001; drag = null; A.burst(px, py - bh * 0.5, 16, ['#FCA5A5', '#FFFFFF', '#FDE68A'], 160, 0.6, 3); },
      dbg: function () { return { px: px | 0, py: py | 0, items: items.length, dead: dead, matches: matches }; }
    };
  }, 'drag', 0.5);

  /* ================================================================== GRENADE TOSS (jeux de guerre, propriétaire) — tu tiens
     la tranchée à gauche : touche où lancer une grenade, elle décrit un arc et explose au sol en nettoyant les soldats autour.
     Ils avancent de plus en plus vite et nombreux ; un soldat à la tranchée termine. La fin secrète = un tir d'artillerie. */
  boot('grenade', function (A) {
    var W, H, T, dpr, bg, gx, gy, sr, soldiers = [], nades = [], cool = 0, dead = 0, won = 0, barrage = null, t = 0, spT = 0, kills = 0, aiT = 0, soldierS, GRAV;
    function soldierSprite() {
      var s = sr * 2;
      return mkc(s, s * 1.3, dpr, function (c, w, h) {
        c.translate(w / 2, h * 0.5);
        c.fillStyle = '#3F4A2E'; rr(c, -s * 0.2, -s * 0.1, s * 0.4, s * 0.55, s * 0.08); c.fill();
        circ(c, 0, -s * 0.28, s * 0.17, '#C7A17A');
        c.fillStyle = '#4B5320'; c.beginPath(); c.arc(0, -s * 0.3, s * 0.2, Math.PI, 0); c.fill(); c.fillRect(-s * 0.22, -s * 0.32, s * 0.44, s * 0.06);
        c.strokeStyle = '#2B3220'; c.lineWidth = s * 0.08; c.lineCap = 'round'; c.beginPath(); c.moveTo(-s * 0.08, s * 0.42); c.lineTo(-s * 0.08, s * 0.62); c.moveTo(s * 0.08, s * 0.42); c.lineTo(s * 0.08, s * 0.62); c.stroke();
        c.strokeStyle = '#1F2937'; c.lineWidth = s * 0.06; c.beginPath(); c.moveTo(-s * 0.1, -s * 0.05); c.lineTo(-s * 0.4, -s * 0.18); c.stroke();
      });
    }
    function throwAt(tx) {
      if (cool > 0 || dead || barrage || won) return;
      tx = clamp(tx, gx + sr, W - sr * 0.5); cool = 0.4;
      var dist = tx - gx, tf = clamp(dist / (W * 0.55), 0.55, 1.4);
      nades.push({ x: gx + sr * 0.3, y: gy - sr * 1.1, vx: dist / tf, vy: -GRAV * tf / 2, tx: tx });
      A.sx('throw', { k: 'nade', v: 0.4 });
    }
    function blast(x) {
      var r = W * 0.15; boomFx(A, x, gy, 1.2); A.shake(0.4);
      for (var i = soldiers.length - 1; i >= 0; i--) if (Math.abs(soldiers[i].x - x) < r) { soldiers.splice(i, 1); kills++; }
    }
    return {
      size: function (w, h, uu, d, top) {
        W = w; H = h; dpr = d; T = top; gy = H - clamp((H - T) * 0.14, 26, 80); sr = clamp(Math.min(W, H - T) * 0.05, 14, 32); gx = W * 0.1; GRAV = (H - T) * 2.4;
        soldierS = soldierSprite();
        bg = mkc(W, H, dpr, function (c) {
          c.fillStyle = lg(c, 0, 0, 0, gy, ['#6B7280', '#9CA3AF', '#D6B98C']); c.fillRect(0, 0, W, gy);
          c.fillStyle = 'rgba(120,53,15,.25)'; for (var q = 0; q < (A.lite ? 3 : 6); q++) { var cx2 = rnd(0, W), cy2 = rnd(T, gy * 0.6); circ(c, cx2, cy2, rnd(14, 40), 'rgba(75,85,99,.3)'); }
          c.fillStyle = 'rgba(55,65,81,.5)'; c.beginPath(); c.moveTo(0, gy); for (var x = 0; x <= W; x += W / 6) c.lineTo(x, gy - (H - T) * 0.1 * (0.5 + Math.abs(Math.sin(x * 0.011)))); c.lineTo(W, gy); c.closePath(); c.fill();
          c.fillStyle = lg(c, 0, gy, 0, H, ['#5B4A2E', '#3A2E1A']); c.fillRect(0, gy, W, H - gy);
          c.strokeStyle = 'rgba(30,20,10,.4)'; c.lineWidth = 2; for (var k = 0; k < 5; k++) { c.beginPath(); c.moveTo(rnd(0, W), gy + rnd(4, (H - gy))); c.lineTo(rnd(0, W), gy + rnd(4, (H - gy))); c.stroke(); }
        });
      },
      reset: function () { soldiers = []; nades = []; dead = 0; won = 0; barrage = null; spT = 0.4; kills = 0; cool = 0; },
      step: function (dt, live) {
        t += dt; cool = Math.max(0, cool - dt); var lv = live ? A.lv() : 0.2, i, s, n;
        if (barrage) { barrage.t += dt; barrage.sh = barrage.sh || []; if (barrage.t < 0.9 && Math.random() < 0.5) barrage.sh.push({ x: rnd(0, W), y: T, vy: (H - T) * 2 }); for (i = barrage.sh.length - 1; i >= 0; i--) { var sh = barrage.sh[i]; sh.y += sh.vy * dt; if (sh.y >= gy) { boomFx(A, sh.x, gy, 0.9); barrage.sh.splice(i, 1); } } if (barrage.t > 0.4 && !barrage.hit) { barrage.hit = 1; dead = 1; } return; }
        if (dead || won) return;
        spT -= dt; if (spT <= 0 && soldiers.length < 3 + Math.round(6 * lv)) { soldiers.push({ x: W + sr, v: (W) * (0.05 + 0.06 * lv) * rnd(0.85, 1.2), bob: rnd(0, TAU) }); spT = Math.max(0.5, 1.9 - 1.2 * lv) * rnd(0.7, 1.3); }
        for (i = nades.length - 1; i >= 0; i--) { n = nades[i]; n.x += n.vx * dt; n.vy += GRAV * dt; n.y += n.vy * dt; if (n.y >= gy) { blast(n.x); nades.splice(i, 1); } }
        for (i = soldiers.length - 1; i >= 0; i--) {
          s = soldiers[i]; s.x -= s.v * dt; s.bob += dt * 10;
          if (s.x <= gx + sr * 0.6) { if (A.live()) { if (A.fail(A.l.fail)) { dead = 1; boomFx(A, gx, gy, 1.2); A.shake(0.5); } return; } soldiers.splice(i, 1); }
        }
        if (A.idle()) { aiT += dt; if (aiT > 0.45) { aiT = 0; var near = soldiers.slice().sort(function (a2, b2) { return a2.x - b2.x; })[0]; if (near) throwAt(near.x - near.v * 0.3); } }
      },
      draw: function (c) {
        A.bg(bg); var i, s, n;
        for (i = 0; i < soldiers.length; i++) { s = soldiers[i]; c.save(); c.translate(s.x, gy - soldierS.h * 0.32 + Math.sin(s.bob) * 2); c.drawImage(soldierS, -soldierS.w / 2, -soldierS.h / 2, soldierS.w, soldierS.h); c.restore(); }
        c.fillStyle = '#A8956B'; for (var sb = 0; sb < 3; sb++) circ(c, gx - sr * 0.3 + sb * sr * 0.5, gy - sr * 0.1, sr * 0.45, '#A8956B');
        if (!dead) { circ(c, gx, gy - sr * 0.9, sr * 0.5, '#C7A17A'); c.fillStyle = '#4B5320'; c.beginPath(); c.arc(gx, gy - sr * 1.05, sr * 0.55, Math.PI, 0); c.fill(); }
        c.fillStyle = '#1F2937'; for (i = 0; i < nades.length; i++) { n = nades[i]; circ(c, n.x, n.y, sr * 0.3, '#1F2937'); c.fillStyle = '#16A34A'; c.fillRect(n.x - sr * 0.06, n.y - sr * 0.4, sr * 0.12, sr * 0.14); c.fillStyle = '#1F2937'; }
        if (barrage && barrage.sh) { c.strokeStyle = '#FDE68A'; c.lineWidth = 3; c.lineCap = 'round'; for (i = 0; i < barrage.sh.length; i++) { var sh = barrage.sh[i]; c.beginPath(); c.moveTo(sh.x, sh.y); c.lineTo(sh.x, sh.y - 16); c.stroke(); } }
      },
      act: function (k, x, y) { throwAt(x); },
      key: function (k) { if (k === 'left') throwAt(gx + W * 0.3); else if (k === 'right') throwAt(W * 0.8); else throwAt(W * 0.55); },
      boom: function () { barrage = { t: 0 }; A.sx('engine', { k: 'whistle' }); },
      win: function () { won = 0.001; A.burst(gx, gy - sr, 16, ['#FDE68A', '#FFFFFF', '#86EFAC'], 160, 0.6, 3); },
      dbg: function () { return { gx: gx | 0, gy: gy | 0, soldiers: soldiers.length, dead: dead, kills: kills }; }
    };
  }, 'aim', 0.3);

  /* ================================================================== CANYON DASH (conduite / pilotage, propriétaire « jeux
     qu'on contrôle ») — pilote un jet à travers un canyon : touche pour monter, relâche pour plonger (gravité). Passe par les
     trous des parois sans toucher la roche. Ça accélère, les trous se resserrent. La fin secrète = un éboulement. */
  boot('canyon', function (A) {
    var W, H, T, dpr, bg, jx, jy, vy, cols = [], scroll = 0, cw, t = 0, dead = 0, won = 0, slide = null, passed = 0, jetS, GRAV, IMP, nextX;
    function jetSprite() {
      var s = clamp(Math.min(W, H - T) * 0.09, 22, 54);
      return mkc(s * 1.5, s, dpr, function (c, w, h) {
        c.translate(w * 0.5, h * 0.5);
        c.fillStyle = lg(c, -s * 0.6, 0, s * 0.7, 0, ['#E2E8F0', '#94A3B8', '#475569']);
        c.beginPath(); c.moveTo(s * 0.7, 0); c.lineTo(-s * 0.3, -s * 0.22); c.lineTo(-s * 0.6, -s * 0.1); c.lineTo(-s * 0.6, s * 0.1); c.lineTo(-s * 0.3, s * 0.22); c.closePath(); c.fill();
        c.fillStyle = '#334155'; c.beginPath(); c.moveTo(-s * 0.1, 0); c.lineTo(-s * 0.45, -s * 0.4); c.lineTo(-s * 0.2, 0); c.closePath(); c.fill(); c.beginPath(); c.moveTo(-s * 0.1, 0); c.lineTo(-s * 0.45, s * 0.4); c.lineTo(-s * 0.2, 0); c.closePath(); c.fill();
        c.fillStyle = '#7DD3FC'; c.beginPath(); c.ellipse(s * 0.25, -s * 0.02, s * 0.16, s * 0.1, 0, 0, TAU); c.fill();
      });
    }
    function addCol() {
      var lv = A.live() || A.idle() ? A.lv() : 0.2, gapH = (H - T) * (0.46 - 0.14 * Math.min(1, lv)); gapH = Math.max(gapH, (H - T) * 0.26);
      var gapY = rnd(T + gapH * 0.6, H - gapH * 0.6);
      cols.push({ x: nextX, gapY: gapY, gapH: gapH, scored: 0 }); nextX += W * (0.62 - 0.08 * Math.min(1, lv));
    }
    function flap() { if (!dead && !slide && !won) vy = IMP; }
    return {
      size: function (w, h, uu, d, top) {
        W = w; H = h; dpr = d; T = top; jx = W * 0.3; cw = W * 0.14; GRAV = (H - T) * 2.6; IMP = -(H - T) * 0.62; if (jy == null) jy = (T + H) / 2;
        jetS = jetSprite();
        bg = mkc(W, H, dpr, function (c) {
          c.fillStyle = lg(c, 0, 0, 0, H, ['#7DD3FC', '#38BDF8', '#FCD34D', '#F59E0B']); c.fillRect(0, 0, W, H);
          c.fillStyle = 'rgba(255,255,255,.35)'; for (var q = 0; q < (A.lite ? 4 : 9); q++) { var cx2 = rnd(0, W), cy2 = rnd(T, H * 0.5), rr2 = rnd(16, 40); circ(c, cx2, cy2, rr2, 'rgba(255,255,255,.3)'); circ(c, cx2 + rr2 * 0.7, cy2 + rr2 * 0.2, rr2 * 0.7, 'rgba(255,255,255,.25)'); }
          c.fillStyle = 'rgba(146,64,14,.22)'; c.beginPath(); c.moveTo(0, H); for (var x = 0; x <= W; x += W / 8) c.lineTo(x, H * 0.7 - (H - T) * 0.08 * Math.abs(Math.sin(x * 0.009))); c.lineTo(W, H); c.closePath(); c.fill();
        });
        nextX = W * 0.9; if (cols.length === 0) { for (var i = 0; i < 4; i++) addCol(); }
      },
      reset: function () { cols = []; dead = 0; won = 0; slide = null; passed = 0; jy = (T + H) / 2; vy = 0; scroll = 0; nextX = W * 0.9; for (var i = 0; i < 4; i++) addCol(); },
      step: function (dt, live) {
        t += dt; var lv = live ? A.lv() : 0.2, i, col, spd = W * (0.34 + 0.4 * lv);
        if (slide) { slide.t += dt; jy += (vy += GRAV * dt) * dt; for (i = 0; i < cols.length; i++) cols[i].x -= spd * 0.3 * dt; if (slide.t > 0.3 && !slide.hit) { slide.hit = 1; } return; }
        if (dead || won) return;
        if (A.idle()) { var ahead = null; for (i = 0; i < cols.length; i++) { if (cols[i].x + cw > jx - cw) { ahead = cols[i]; break; } } if (ahead && jy > ahead.gapY + (H - T) * 0.01 && vy > -(H - T) * 0.1) flap(); if (jy < T + (H - T) * 0.08) { /* too high, let gravity pull */ } }
        vy += GRAV * dt; jy += vy * dt;
        for (i = cols.length - 1; i >= 0; i--) {
          col = cols[i]; col.x -= spd * dt;
          if (!col.scored && col.x + cw < jx) { col.scored = 1; passed++; A.burst(jx, jy, 5, ['#FDE68A', '#FFFFFF'], 90, 0.4, 2); }
          if (col.x + cw < -cw) { cols.splice(i, 1); addCol(); continue; }
          if (jx + jetS.w * 0.32 > col.x && jx - jetS.w * 0.32 < col.x + cw) {
            if (jy - jetS.h * 0.32 < col.gapY - col.gapH / 2 || jy + jetS.h * 0.32 > col.gapY + col.gapH / 2) {
              if (A.live()) { if (A.fail(A.l.fail)) { dead = 1; boomFx(A, jx, jy, 1.1); A.shake(0.5); } return; }
            }
          }
        }
        if (jy < T + jetS.h * 0.32 || jy > H - jetS.h * 0.32) {
          jy = clamp(jy, T + jetS.h * 0.32, H - jetS.h * 0.32); vy = 0;
          if (A.live()) { if (A.fail(A.l.fail)) { dead = 1; boomFx(A, jx, jy, 1); A.shake(0.4); } return; }
        }
      },
      draw: function (c) {
        A.bg(bg); var i, col;
        for (i = 0; i < cols.length; i++) {
          col = cols[i]; var topH = col.gapY - col.gapH / 2, botY = col.gapY + col.gapH / 2;
          c.fillStyle = lg(c, col.x, 0, col.x + cw, 0, ['#92400E', '#78350F', '#451A03']);
          c.fillRect(col.x, T - 4, cw, topH - T + 4); c.fillRect(col.x, botY, cw, H - botY);
          c.fillStyle = 'rgba(0,0,0,.18)'; c.fillRect(col.x + cw - 5, T - 4, 5, topH - T + 4); c.fillRect(col.x + cw - 5, botY, 5, H - botY);
          c.fillStyle = '#A16207'; c.beginPath(); c.moveTo(col.x, topH); c.lineTo(col.x + cw, topH); c.lineTo(col.x + cw * 0.5, topH + 10); c.closePath(); c.fill();
          c.beginPath(); c.moveTo(col.x, botY); c.lineTo(col.x + cw, botY); c.lineTo(col.x + cw * 0.5, botY - 10); c.closePath(); c.fill();
        }
        if (!dead) { c.save(); c.translate(jx, jy); c.rotate(clamp(vy / (H - T) * 0.6, -0.5, 0.6)); c.fillStyle = 'rgba(253,186,116,.7)'; c.beginPath(); c.moveTo(-jetS.w * 0.5, 0); c.lineTo(-jetS.w * 0.5 - rnd(8, 18), -3); c.lineTo(-jetS.w * 0.5 - rnd(8, 18), 3); c.closePath(); c.fill(); c.drawImage(jetS, -jetS.w / 2, -jetS.h / 2, jetS.w, jetS.h); c.restore(); }
      },
      act: function (k, x, y) { flap(); },
      key: function (k) { if (k === 'up' || k === 'left' || k === 'right') flap(); },
      boom: function () { slide = { t: 0 }; A.sx('engine', { k: 'rumble' }); },
      win: function () { won = 0.001; A.burst(jx, jy, 16, ['#7DD3FC', '#FFFFFF', '#FDE68A'], 160, 0.6, 3); },
      dbg: function () { return { jx: jx | 0, jy: jy | 0, cols: cols.length, dead: dead, passed: passed }; }
    };
  }, 'tap', 0.45);

  /* ================================================================== TANK RUSH (jeux de guerre, propriétaire) — conduis ton
     char en bas, il tire tout seul vers le haut : place-le sous les véhicules ennemis pour les détruire avant qu'ils passent.
     Un ennemi qui passe termine. Ça accélère et se densifie. La fin secrète = une frappe aérienne. */
  boot('tankrush', function (A) {
    var W, H, T, dpr, bg, px, py, tw, foes = [], bul = [], cool = 0, dead = 0, won = 0, strike = null, t = 0, spT = 0, kills = 0, drag = null, tankS, foeS;
    function tankSprite(cols, up) {
      var w = tw, h = tw * 0.8;
      return mkc(w + 6, h + 10, dpr, function (c, cw2, ch2) {
        c.translate(cw2 / 2, ch2 / 2);
        c.fillStyle = '#1C2416'; rr(c, -w / 2, h * 0.1, w, h * 0.32, 4); c.fill();
        for (var tr2 = -1; tr2 <= 1; tr2++) circ(c, tr2 * w * 0.3, h * 0.26, w * 0.1, '#111');
        c.fillStyle = lg(c, -w / 2, -h / 2, w / 2, h / 2, cols); rr(c, -w * 0.42, -h * 0.18, w * 0.84, h * 0.4, 5); c.fill();
        c.fillStyle = cols[1]; rr(c, -w * 0.2, -h * 0.42, w * 0.4, h * 0.32, 4); c.fill();
        c.fillStyle = cols[2]; c.fillRect(-w * 0.07, up ? -h * 0.9 : -h * 0.18, w * 0.14, up ? h * 0.5 : h * 0.72);
        c.fillStyle = 'rgba(255,255,255,.15)'; rr(c, -w * 0.38, -h * 0.14, w * 0.3, h * 0.12, 3); c.fill();
      });
    }
    function spawn(live) {
      var lv = live ? A.lv() : 0.2, x = rnd(W * 0.12, W * 0.88);
      for (var i = 0; i < foes.length; i++) if (foes[i].y < T + tw * 1.5 && Math.abs(foes[i].x - x) < tw * 1.1) return;
      foes.push({ x: x, y: T - tw, vy: (H - T) * (0.08 + 0.1 * lv) * rnd(0.85, 1.2), hp: 1 });
    }
    return {
      size: function (w, h, uu, d, top) {
        W = w; H = h; dpr = d; T = top; tw = clamp(Math.min(W, H - T) * 0.13, 30, 76); py = H - clamp((H - T) * 0.09, 18, 52) - tw * 0.4; if (px == null) px = W / 2;
        tankS = tankSprite(['#A3B18A', '#6B7A4F', '#3F4A2E'], true); foeS = tankSprite(['#D1A3A3', '#9E5C5C', '#5C2E2E'], false);
        bg = mkc(W, H, dpr, function (c) {
          c.fillStyle = lg(c, 0, 0, 0, H, ['#8B7355', '#A1875F', '#7A6344']); c.fillRect(0, 0, W, H);
          c.fillStyle = 'rgba(70,50,25,.35)'; for (var q = 0; q < (A.lite ? 6 : 14); q++) { var cx3 = rnd(0, W), cy3 = rnd(T, H); circ(c, cx3, cy3, rnd(5, 15), 'rgba(90,70,40,.4)'); circ(c, cx3, cy3, rnd(2, 6), 'rgba(60,45,22,.45)'); }
          c.strokeStyle = 'rgba(60,45,25,.3)'; c.lineWidth = 2; for (var k = 0; k < 6; k++) { c.beginPath(); c.moveTo(rnd(0, W), rnd(T, H)); c.lineTo(rnd(0, W), rnd(T, H)); c.stroke(); }
          c.fillStyle = lg(c, 0, T, 0, T + (H - T) * 0.18, ['rgba(120,113,108,.5)', 'rgba(120,113,108,0)']); c.fillRect(0, T, W, (H - T) * 0.18);
        });
      },
      reset: function () { foes = []; bul = []; dead = 0; won = 0; strike = null; spT = 0.5; kills = 0; px = W / 2; drag = null; cool = 0; },
      step: function (dt, live) {
        t += dt; cool = Math.max(0, cool - dt); var lv = live ? A.lv() : 0.2, i, f, b;
        if (strike) { strike.t += dt; strike.sh = strike.sh || []; if (strike.t < 0.8 && Math.random() < 0.5) strike.sh.push({ x: rnd(0, W), y: T, vy: (H - T) * 2.2 }); for (i = strike.sh.length - 1; i >= 0; i--) { var sh = strike.sh[i]; sh.y += sh.vy * dt; if (sh.y >= py) { boomFx(A, sh.x, py, 0.9); strike.sh.splice(i, 1); } } if (strike.t > 0.35 && !strike.hit) { strike.hit = 1; dead = 1; } return; }
        if (dead || won) return;
        if (A.idle()) { var near = foes.slice().sort(function (a2, b2) { return b2.y - a2.y; })[0]; if (near) px += clamp(near.x - px, -W * 1.1 * dt, W * 1.1 * dt); }
        px = clamp(px, tw * 0.5, W - tw * 0.5);
        if (cool <= 0 && !dead) { cool = 0.26; bul.push({ x: px, y: py - tw * 0.6, vy: -(H - T) * 1.6 }); A.sx('gun', { k: 'tank', v: 0.35 }); }
        spT -= dt; if (spT <= 0 && foes.length < 3 + Math.round(5 * lv)) { spawn(live); spT = Math.max(0.5, 1.8 - 1.1 * lv) * rnd(0.7, 1.3); }
        for (i = bul.length - 1; i >= 0; i--) { b = bul[i]; b.y += b.vy * dt; if (b.y < T - 20) { bul.splice(i, 1); continue; } for (var j = foes.length - 1; j >= 0; j--) { f = foes[j]; if (Math.abs(b.x - f.x) < tw * 0.5 && Math.abs(b.y - f.y) < tw * 0.5) { bul.splice(i, 1); foes.splice(j, 1); kills++; boomFx(A, f.x, f.y, 0.7); break; } } }
        for (i = foes.length - 1; i >= 0; i--) { f = foes[i]; f.y += f.vy * dt; if (f.y + tw * 0.4 > py) { if (A.live()) { if (A.fail(A.l.fail)) { dead = 1; boomFx(A, f.x, py, 1.2); A.shake(0.5); } return; } foes.splice(i, 1); } }
      },
      draw: function (c) {
        A.bg(bg); var i, f, b;
        c.strokeStyle = '#FDE68A'; c.lineWidth = 4; c.lineCap = 'round'; for (i = 0; i < bul.length; i++) { b = bul[i]; c.beginPath(); c.moveTo(b.x, b.y); c.lineTo(b.x, b.y + 14); c.stroke(); }
        for (i = 0; i < foes.length; i++) { f = foes[i]; c.drawImage(foeS, f.x - foeS.w / 2, f.y - foeS.h / 2, foeS.w, foeS.h); }
        if (strike && strike.sh) { c.strokeStyle = '#FB923C'; c.lineWidth = 3; for (i = 0; i < strike.sh.length; i++) { var sh = strike.sh[i]; c.beginPath(); c.moveTo(sh.x, sh.y); c.lineTo(sh.x, sh.y - 16); c.stroke(); } }
        if (!dead) c.drawImage(tankS, px - tankS.w / 2, py - tankS.h / 2, tankS.w, tankS.h);
      },
      down: function (x) { drag = { x: x, s: px }; },
      move: function (x) { if (drag && !dead) px = clamp(drag.s + (x - drag.x) * 1.25, tw * 0.5, W - tw * 0.5); },
      up: function () { drag = null; },
      key: function (k) { if (k === 'left') px -= tw * 0.6; else if (k === 'right') px += tw * 0.6; px = clamp(px, tw * 0.5, W - tw * 0.5); },
      boom: function () { strike = { t: 0 }; drag = null; A.sx('engine', { k: 'jet' }); },
      win: function () { won = 0.001; drag = null; A.burst(px, py - tw * 0.5, 16, ['#A3B18A', '#FFFFFF', '#FDE68A'], 160, 0.6, 3); },
      dbg: function () { return { px: px | 0, py: py | 0, foes: foes.length, dead: dead, kills: kills }; }
    };
  }, 'drag', 0.5);

  /* ================================================================== SPEED BOAT (conduite / pilotage, propriétaire) — pilote
     un hors-bord et faufile-toi entre les bouées et les rochers de la rivière. Toucher quelque chose termine. Ça accélère et se
     densifie. La fin secrète = un tourbillon. */
  boot('speedboat', function (A) {
    var W, H, T, dpr, bg, rx0, rx1, bw, bh, px, py, obs = [], t = 0, spT = 0, dead = 0, won = 0, whirl = null, drag = null, dash = 0, boatS, buoyS, rockS;
    function boatSprite() {
      return mkc(bw + 6, bh + 6, dpr, function (c, cw2, ch2) {
        c.translate(cw2 / 2, ch2 / 2);
        c.fillStyle = 'rgba(0,0,0,.25)'; c.beginPath(); c.ellipse(0, bh * 0.1, bw * 0.5, bh * 0.5, 0, 0, TAU); c.fill();
        c.fillStyle = lg(c, 0, -bh / 2, 0, bh / 2, ['#F1F5F9', '#CBD5E1', '#64748B']);
        c.beginPath(); c.moveTo(0, -bh * 0.5); c.quadraticCurveTo(bw * 0.5, -bh * 0.1, bw * 0.4, bh * 0.45); c.lineTo(-bw * 0.4, bh * 0.45); c.quadraticCurveTo(-bw * 0.5, -bh * 0.1, 0, -bh * 0.5); c.fill();
        c.fillStyle = '#0EA5E9'; rr(c, -bw * 0.26, -bh * 0.12, bw * 0.52, bh * 0.3, 4); c.fill();
        c.fillStyle = '#0369A1'; rr(c, -bw * 0.16, -bh * 0.05, bw * 0.32, bh * 0.16, 3); c.fill();
        c.fillStyle = '#F87171'; c.fillRect(-bw * 0.04, -bh * 0.4, bw * 0.08, bh * 0.2);
      });
    }
    function buoySprite() {
      return mkc(bw * 0.7, bw * 0.9, dpr, function (c, w, h) { c.translate(w / 2, h / 2); var r = w * 0.32; c.fillStyle = lg(c, 0, -r, 0, r, ['#F87171', '#B91C1C']); circ(c, 0, 0, r, c.fillStyle); c.fillStyle = '#fff'; c.fillRect(-r, -r * 0.3, r * 2, r * 0.3); c.fillStyle = '#7F1D1D'; rr(c, -r * 0.2, -r * 1.3, r * 0.4, r * 0.5, 2); c.fill(); });
    }
    function rockSprite() {
      return mkc(bw * 0.9, bw * 0.8, dpr, function (c, w, h) { c.translate(w / 2, h / 2); var r = w * 0.4; c.fillStyle = lg(c, 0, -r, 0, r, ['#94A3B8', '#475569', '#1E293B']); poly(c, [-r, r * 0.4, -r * 0.6, -r * 0.5, 0, -r * 0.7, r * 0.7, -r * 0.4, r, r * 0.5], c.fillStyle); c.fill(); c.fillStyle = 'rgba(255,255,255,.2)'; poly(c, [-r * 0.6, -r * 0.5, 0, -r * 0.7, -r * 0.1, -r * 0.2], 'rgba(255,255,255,.2)'); c.fill(); });
    }
    function spawn(live) {
      var lv = live ? A.lv() : 0.2, lane = (Math.random() * 4) | 0, laneW = (rx1 - rx0) / 4, x = rx0 + laneW * (lane + 0.5);
      for (var i = 0; i < obs.length; i++) if (obs[i].y < T + bh * 1.6 && Math.abs(obs[i].x - x) < bw) return;
      obs.push({ x: x, y: T - bh, vy: (H - T) * (0.4 + 0.5 * lv) * rnd(0.9, 1.15), rock: Math.random() < 0.5 });
    }
    return {
      size: function (w, h, uu, d, top) {
        W = w; H = h; dpr = d; T = top; rx0 = W * 0.08; rx1 = W * 0.92; bw = clamp((rx1 - rx0) / 4 * 0.72, 30, 80); bh = bw * 1.25; py = H - bh * 0.9; if (px == null) px = W / 2;
        boatS = boatSprite(); buoyS = buoySprite(); rockS = rockSprite();
        bg = mkc(W, H, dpr, function (c) {
          c.fillStyle = lg(c, 0, 0, 0, H, ['#0C4A6E', '#0369A1', '#0EA5E9']); c.fillRect(0, 0, W, H);
          c.fillStyle = '#16A34A'; c.fillRect(0, 0, rx0, H); c.fillRect(rx1, 0, W - rx1, H);
          c.fillStyle = '#15803D'; c.fillRect(rx0 - 5, 0, 5, H); c.fillRect(rx1, 0, 5, H);
          c.strokeStyle = 'rgba(255,255,255,.12)'; c.lineWidth = 2; for (var y = 0; y < H; y += 26) { c.beginPath(); for (var x = rx0; x <= rx1; x += 8) c.lineTo(x, y + Math.sin(x * 0.05 + y) * 3); c.stroke(); }
        });
      },
      reset: function () { obs = []; dead = 0; won = 0; whirl = null; spT = 0.5; px = W / 2; drag = null; dash = 0; },
      step: function (dt, live) {
        t += dt; var lv = live ? A.lv() : 0.2, i, e, spd = (H - T) * (0.5 + 0.55 * lv); dash += spd * dt;
        if (whirl) { whirl.t += dt; for (i = 0; i < obs.length; i++) { var a = Math.atan2(obs[i].y - py, obs[i].x - px) + dt * 4; var rr2 = Math.max(4, Math.hypot(obs[i].x - px, obs[i].y - py) - W * 0.4 * dt); obs[i].x = px + Math.cos(a) * rr2; obs[i].y = py + Math.sin(a) * rr2; } return; }
        if (dead || won) return;
        if (A.idle()) {
          var ahead = obs.filter(function (q) { return q.y > T && q.y < py && q.y > py - bh * 4; }), best = px, bd = -1;
          for (var gx = rx0 + bw; gx <= rx1 - bw; gx += (rx1 - rx0 - 2 * bw) / 6) { var dmin = 1e9; ahead.forEach(function (q) { var dd = Math.hypot((q.x - gx) * 1.4, q.y - py); if (dd < dmin) dmin = dd; }); if (dmin > bd) { bd = dmin; best = gx; } }
          px += clamp(best - px, -W * 1.1 * dt, W * 1.1 * dt);
        }
        px = clamp(px, rx0 + bw * 0.5, rx1 - bw * 0.5);
        spT -= dt; if (spT <= 0) { spawn(live); if (live && lv > 0.5 && Math.random() < 0.4) spawn(live); spT = Math.max(0.34, 1.2 - 0.8 * lv) * rnd(0.7, 1.25); }
        for (i = obs.length - 1; i >= 0; i--) {
          e = obs[i]; e.y += (e.vy + spd * 0.15) * dt;
          if (e.y - bh * 0.5 > H) { obs.splice(i, 1); continue; }
          if (Math.abs(e.x - px) < bw * 0.7 && Math.abs(e.y - py) < bh * 0.7) { boomFx(A, (e.x + px) / 2, (e.y + py) / 2, 0.9); A.shake(0.4); if (A.live()) { if (A.fail(A.l.fail)) dead = 1; } obs.splice(i, 1); return; }
        }
      },
      draw: function (c) {
        A.bg(bg); var i, e;
        c.strokeStyle = 'rgba(255,255,255,.5)'; c.lineWidth = Math.max(2, bw * 0.06); c.setLineDash([bh * 0.3, bh * 0.7]); c.lineDashOffset = -(dash % (bh));
        c.beginPath(); c.moveTo(W / 2, -bh); c.lineTo(W / 2, H + bh); c.stroke(); c.setLineDash([]);
        for (i = 0; i < obs.length; i++) { e = obs[i]; var img = e.rock ? rockS : buoyS; c.drawImage(img, e.x - img.w / 2, e.y - img.h / 2, img.w, img.h); }
        if (!dead) {
          c.strokeStyle = 'rgba(255,255,255,.5)'; c.lineWidth = 2; c.beginPath(); c.moveTo(px - bw * 0.3, py + bh * 0.4); c.lineTo(px - bw * 0.7, py + bh * 1.1); c.moveTo(px + bw * 0.3, py + bh * 0.4); c.lineTo(px + bw * 0.7, py + bh * 1.1); c.stroke();
          c.drawImage(boatS, px - boatS.w / 2, py - boatS.h / 2, boatS.w, boatS.h);
        }
      },
      down: function (x) { drag = { x: x, s: px }; },
      move: function (x) { if (drag && !dead) px = clamp(drag.s + (x - drag.x) * 1.25, rx0 + bw * 0.5, rx1 - bw * 0.5); },
      up: function () { drag = null; },
      key: function (k) { if (k === 'left') px -= bw * 0.7; else if (k === 'right') px += bw * 0.7; px = clamp(px, rx0 + bw * 0.5, rx1 - bw * 0.5); },
      boom: function () { whirl = { t: 0 }; drag = null; A.explode(px, py, 1.2); },
      win: function () { won = 0.001; drag = null; A.burst(px, py - bh * 0.5, 16, ['#7DD3FC', '#FFFFFF', '#FDE68A'], 160, 0.6, 3); },
      dbg: function () { return { px: px | 0, py: py | 0, obs: obs.length, dead: dead }; }
    };
  }, 'drag', 0.5);

  /* ================================================================== MOTEUR GÉNÉRIQUE « esquive » (dodger) — un véhicule/
     personnage en bas (on glisse), des obstacles descendent dans des couloirs : en toucher un termine. Chaque jeu fournit son
     décor et ses dessins (cfg). Même modèle d'argent que tous les « You're in control » : marge 6 %, loi de crash serveur. */
  function dodger(cfg) {
    return function (A) {
      var W, H, T, dpr, bg, pw2, ph, rx0, rx1, px, py, obs = [], t = 0, spT = 0, dead = 0, won = 0, over = null, drag = null, dash = 0, pS, oS = [];
      function mk() { pS = cfg.player(dpr, pw2, ph); oS = cfg.obs.map(function (f) { return f(dpr, pw2, ph); }); }
      function spawn(live) {
        var lv = live ? A.lv() : 0.2, lane = (Math.random() * cfg.lanes) | 0, laneW = (rx1 - rx0) / cfg.lanes, x = rx0 + laneW * (lane + 0.5);
        for (var i = 0; i < obs.length; i++) if (obs[i].y < T + ph * 1.6 && Math.abs(obs[i].x - x) < pw2 * 0.95) return;
        obs.push({ x: x, y: T - ph, vy: (H - T) * (0.4 + 0.5 * lv) * rnd(0.9, 1.15), k: (Math.random() * oS.length) | 0, rot: cfg.spin ? rnd(-0.3, 0.3) : 0, vr: cfg.spin ? rnd(-2, 2) : 0 });
      }
      return {
        size: function (w, h, uu, d, top) {
          W = w; H = h; dpr = d; T = top; rx0 = W * (cfg.margin || 0.1); rx1 = W * (1 - (cfg.margin || 0.1));
          pw2 = clamp((rx1 - rx0) / cfg.lanes * 0.78, 26, 80); ph = pw2 * (cfg.ratio || 1.5); py = H - ph * 0.85; if (px == null) px = W / 2;
          mk(); bg = mkc(W, H, dpr, function (c) { cfg.bg(c, W, H, T, rx0, rx1, A); });
        },
        reset: function () { obs = []; dead = 0; won = 0; over = null; spT = 0.5; px = W / 2; dash = 0; drag = null; },
        step: function (dt, live) {
          t += dt; var lv = live ? A.lv() : 0.2, i, e, spd = (H - T) * (0.5 + 0.55 * lv); dash += spd * dt;
          if (over) { over.t += dt; for (i = obs.length - 1; i >= 0; i--) { obs[i].y += obs[i].vy * 0.3 * dt; obs[i].x += Math.sin(t * 8 + i) * W * 0.3 * dt; } return; }
          if (dead || won) return;
          if (A.idle()) {
            var ahead = obs.filter(function (q) { return q.y > T && q.y < py && q.y > py - ph * 4; }), best = px, bd = -1;
            for (var gx = rx0 + pw2; gx <= rx1 - pw2; gx += (rx1 - rx0 - 2 * pw2) / 6) { var dmin = 1e9; ahead.forEach(function (q) { var dd = Math.hypot((q.x - gx) * 1.4, q.y - py); if (dd < dmin) dmin = dd; }); if (dmin > bd) { bd = dmin; best = gx; } }
            px += clamp(best - px, -W * 1.1 * dt, W * 1.1 * dt);
          }
          px = clamp(px, rx0 + pw2 * 0.5, rx1 - pw2 * 0.5);
          spT -= dt; if (spT <= 0) { spawn(live); if (live && lv > 0.5 && Math.random() < 0.4) spawn(live); spT = Math.max(0.32, 1.2 - 0.8 * lv) * rnd(0.7, 1.25); }
          for (i = obs.length - 1; i >= 0; i--) {
            e = obs[i]; e.y += (e.vy + spd * 0.15) * dt; e.rot += e.vr * dt;
            if (e.y - ph * 0.5 > H) { obs.splice(i, 1); continue; }
            if (Math.abs(e.x - px) < pw2 * 0.78 && Math.abs(e.y - py) < ph * 0.8) { boomFx(A, (e.x + px) / 2, (e.y + py) / 2, 1); A.shake(0.45); if (A.live()) { if (A.fail(A.l.fail)) dead = 1; } obs.splice(i, 1); return; }
          }
        },
        draw: function (c) {
          A.bg(bg);
          if (cfg.lines !== false) { c.strokeStyle = cfg.lineCol || 'rgba(255,255,255,.3)'; c.lineWidth = Math.max(2, pw2 * 0.08); c.setLineDash([ph * 0.5, ph * 0.6]); c.lineDashOffset = -(dash % (ph * 1.1)); for (var ln = 1; ln < cfg.lanes; ln++) { var lx = rx0 + (rx1 - rx0) * ln / cfg.lanes; c.beginPath(); c.moveTo(lx, -ph); c.lineTo(lx, H + ph); c.stroke(); } c.setLineDash([]); }
          for (var i = 0; i < obs.length; i++) { var e = obs[i], img = oS[e.k]; if (e.rot) { c.save(); c.translate(e.x, e.y); c.rotate(e.rot); c.drawImage(img, -img.w / 2, -img.h / 2, img.w, img.h); c.restore(); } else c.drawImage(img, e.x - img.w / 2, e.y - img.h / 2, img.w, img.h); }
          if (!dead) c.drawImage(pS, px - pS.w / 2, py - pS.h / 2, pS.w, pS.h);
        },
        down: function (x) { drag = { x: x, s: px }; },
        move: function (x) { if (drag && !dead) px = clamp(drag.s + (x - drag.x) * 1.25, rx0 + pw2 * 0.5, rx1 - pw2 * 0.5); },
        up: function () { drag = null; },
        key: function (k) { if (k === 'left') px -= pw2 * 0.7; else if (k === 'right') px += pw2 * 0.7; px = clamp(px, rx0 + pw2 * 0.5, rx1 - pw2 * 0.5); },
        boom: function () { over = { t: 0 }; drag = null; A.explode(px, py - ph * 0.2, 1.2); },
        win: function () { won = 0.001; drag = null; A.burst(px, py - ph * 0.5, 16, cfg.winCols || ['#FFFFFF', '#FDE68A'], 160, 0.6, 3); },
        dbg: function () { return { px: px | 0, py: py | 0, obs: obs.length, dead: dead }; }
      };
    };
  }

  /* ================================================================== MOTEUR GÉNÉRIQUE « attrape » (catcher) — un panier en
     bas (on glisse), on attrape les bons objets qui tombent et on évite les mauvais. Rater un bon ou attraper un mauvais
     termine. cfg fournit décor, panier, bons (good) et mauvais (bad). */
  function catcher(cfg) {
    return function (A) {
      var W, H, T, dpr, bg, bw, bh, isz, px, py, items = [], t = 0, spT = 0, dead = 0, won = 0, over = null, drag = null, goodS = [], badS = [];
      function mk() { goodS = cfg.good.map(function (f) { return f(dpr, isz); }); badS = cfg.bad.map(function (f) { return f(dpr, isz); }); }
      function spawn(live) {
        var lv = live ? A.lv() : 0.2, x = rnd(bw * 0.6, W - bw * 0.6);
        for (var i = 0; i < items.length; i++) if (items[i].y < T + isz * 2 && Math.abs(items[i].x - x) < isz * 1.2) return;
        var bad = Math.random() < (0.12 + 0.2 * lv);
        items.push({ x: x, y: T - isz, vy: (H - T) * (0.34 + 0.46 * lv) * rnd(0.9, 1.15), rot: rnd(-0.25, 0.25), vr: rnd(-1.3, 1.3), bad: bad, k: (Math.random() * (bad ? badS.length : goodS.length)) | 0 });
      }
      return {
        size: function (w, h, uu, d, top) {
          W = w; H = h; dpr = d; T = top; bw = clamp(W * 0.2, 58, 150); bh = bw * 0.56; isz = clamp(W * 0.1, 26, 58);
          py = H - clamp((H - T) * 0.08, 16, 46) - bh * 0.5; if (px == null) px = W / 2; mk();
          bg = mkc(W, H, dpr, function (c) { cfg.bg(c, W, H, T, py, bh, A); });
        },
        reset: function () { items = []; dead = 0; won = 0; over = null; spT = 0.5; px = W / 2; drag = null; },
        step: function (dt, live) {
          t += dt; var lv = live ? A.lv() : 0.2, i, e;
          if (over) { over.t += dt; for (i = items.length - 1; i >= 0; i--) { items[i].y += items[i].vy * 0.3 * dt; items[i].rot += items[i].vr * dt; } return; }
          if (dead || won) return;
          if (A.idle()) {
            var tgt = px, bd = 1e9;
            for (i = 0; i < items.length; i++) { e = items[i]; if (e.bad) continue; if (e.y > T && e.y < py && e.y > py - bh * 7) { var d = Math.abs(e.x - px); if (d < bd) { bd = d; tgt = e.x; } } }
            for (i = 0; i < items.length; i++) { e = items[i]; if (e.bad && e.y > py - bh * 3 && Math.abs(e.x - px) < bw * 0.55) tgt = px + (e.x < px ? bw : -bw); }
            px += clamp(tgt - px, -W * 1.1 * dt, W * 1.1 * dt);
          }
          px = clamp(px, bw * 0.5, W - bw * 0.5);
          spT -= dt; if (spT <= 0) { spawn(live); spT = Math.max(0.42, 1.25 - 0.8 * lv) * rnd(0.72, 1.25); }
          for (i = items.length - 1; i >= 0; i--) {
            e = items[i]; e.y += e.vy * dt; e.rot += e.vr * dt;
            if (Math.abs(e.x - px) < bw * 0.52 && e.y > py - bh * 0.7 && e.y < py + bh * 0.3) {
              if (e.bad) { items.splice(i, 1); A.shake(0.4); boomFx(A, e.x, py - bh * 0.2, 1); if (A.live()) { if (A.fail(A.l.fail2)) dead = 1; } return; }
              items.splice(i, 1); A.burst(e.x, py - bh * 0.2, 10, cfg.winCols || ['#FDE68A', '#FFFFFF'], 150, 0.6, 3); A.ring(e.x, py - bh * 0.2, bw * 0.55, cfg.ring || '#FDE68A'); continue;
            }
            if (e.y - isz * 0.5 > H) { items.splice(i, 1); if (!e.bad) { if (A.live()) { if (A.fail(A.l.fail)) { dead = 1; A.shake(0.4); } } return; } }
          }
        },
        draw: function (c) {
          A.bg(bg); var i, e, img;
          for (i = 0; i < items.length; i++) { e = items[i]; img = e.bad ? badS[e.k] : goodS[e.k]; c.save(); c.translate(e.x, e.y); c.rotate(e.rot); c.drawImage(img, -img.w / 2, -img.h / 2, img.w, img.h); c.restore(); }
          if (!dead) cfg.basket(c, px, py, bw, bh);
        },
        down: function (x) { drag = { x: x, s: px }; },
        move: function (x) { if (drag && !dead) px = clamp(drag.s + (x - drag.x) * 1.25, bw * 0.5, W - bw * 0.5); },
        up: function () { drag = null; },
        key: function (k) { if (k === 'left') px -= bw * 0.6; else if (k === 'right') px += bw * 0.6; px = clamp(px, bw * 0.5, W - bw * 0.5); },
        boom: function () { over = { t: 0 }; drag = null; A.explode(px, py - bh * 0.2, 1.1); },
        win: function () { won = 0.001; drag = null; A.burst(px, py - bh * 0.5, 16, cfg.winCols || ['#FFFFFF', '#FDE68A'], 160, 0.6, 3); },
        dbg: function () { return { px: px | 0, py: py | 0, items: items.length, dead: dead }; }
      };
    };
  }

  /* ---- petits dessins partagés par les configs ---- */
  function fieldLines(c, W, H, T, rx0, rx1, side, edge) { c.fillStyle = side; c.fillRect(0, 0, rx0, H); c.fillRect(rx1, 0, W - rx1, H); c.fillStyle = edge; c.fillRect(rx0 - 4, 0, 4, H); c.fillRect(rx1, 0, 4, H); }

  /* ===== vague 1 : 4 jeux « esquive » + 2 jeux « attrape » (décors variés) ===== */
  boot('spacedash', dodger({
    lanes: 4, spin: true, lineCol: 'rgba(148,163,184,.25)', winCols: ['#A5B4FC', '#FFFFFF', '#FDE68A'],
    bg: function (c, W, H, T) { c.fillStyle = lg(c, 0, 0, 0, H, ['#05060F', '#0B1026', '#1E1B4B']); c.fillRect(0, 0, W, H); stars(c, W, H, A_lite(c) ? 50 : 130, 0, H); c.fillStyle = rg(c, W * 0.7, H * 0.2, W * 0.5, ['rgba(124,58,237,.25)', 'rgba(124,58,237,0)']); c.fillRect(0, 0, W, H); },
    player: function (d, w, h) { return mkc(w + 8, h + 8, d, function (c, cw, ch) { c.translate(cw / 2, ch / 2); c.fillStyle = lg(c, 0, -h / 2, 0, h / 2, ['#E2E8F0', '#94A3B8', '#475569']); c.beginPath(); c.moveTo(0, -h / 2); c.quadraticCurveTo(w * 0.42, -h * 0.1, w * 0.3, h * 0.4); c.lineTo(-w * 0.3, h * 0.4); c.quadraticCurveTo(-w * 0.42, -h * 0.1, 0, -h / 2); c.fill(); c.fillStyle = '#7DD3FC'; circ(c, 0, -h * 0.1, w * 0.17, '#7DD3FC'); c.fillStyle = '#EF4444'; c.beginPath(); c.moveTo(-w * 0.3, h * 0.4); c.lineTo(-w * 0.46, h * 0.5); c.lineTo(-w * 0.26, h * 0.5); c.closePath(); c.fill(); c.beginPath(); c.moveTo(w * 0.3, h * 0.4); c.lineTo(w * 0.46, h * 0.5); c.lineTo(w * 0.26, h * 0.5); c.closePath(); c.fill(); c.fillStyle = 'rgba(253,186,116,.8)'; c.beginPath(); c.moveTo(-w * 0.14, h * 0.45); c.lineTo(0, h * 0.62); c.lineTo(w * 0.14, h * 0.45); c.fill(); }); },
    obs: [function (d, w, h) { return astero(d, w * 0.82, ['#A8A29E', '#57534E', '#292524']); }, function (d, w, h) { return astero(d, w * 0.9, ['#94A3B8', '#475569', '#1E293B']); }]
  }), 'drag', 0.5);

  boot('sharkbay', dodger({
    lanes: 4, lineCol: 'rgba(255,255,255,.18)', winCols: ['#7DD3FC', '#FFFFFF'],
    bg: function (c, W, H, T) { c.fillStyle = lg(c, 0, 0, 0, H, ['#082F49', '#0C4A6E', '#0369A1']); c.fillRect(0, 0, W, H); c.strokeStyle = 'rgba(255,255,255,.08)'; c.lineWidth = 2; for (var y = 0; y < H; y += 24) { c.beginPath(); for (var x = 0; x <= W; x += 8) c.lineTo(x, y + Math.sin(x * 0.05 + y) * 3); c.stroke(); } for (var b = 0; b < (A_lite(c) ? 6 : 16); b++) { c.globalAlpha = 0.1 + Math.random() * 0.12; circ(c, Math.random() * W, Math.random() * H, rnd(2, 7), '#fff'); } c.globalAlpha = 1; },
    player: function (d, w, h) { return mkc(w + 8, h + 8, d, function (c, cw, ch) { c.translate(cw / 2, ch / 2); c.fillStyle = lg(c, 0, -h / 2, 0, h / 2, ['#FDE68A', '#F59E0B', '#B45309']); c.beginPath(); c.moveTo(0, -h / 2); c.quadraticCurveTo(w * 0.5, 0, 0, h * 0.5); c.quadraticCurveTo(-w * 0.5, 0, 0, -h / 2); c.fill(); c.fillStyle = '#FB923C'; c.beginPath(); c.moveTo(0, h * 0.5); c.lineTo(-w * 0.24, h * 0.72); c.lineTo(w * 0.24, h * 0.72); c.fill(); circ(c, 0, -h * 0.14, w * 0.1, '#1E293B'); }); },
    obs: [function (d, w, h) { return sharkfin(d, w, h); }, function (d, w, h) { return jelly(d, w, h); }]
  }), 'drag', 0.5);

  boot('snowdash', dodger({
    lanes: 4, lineCol: 'rgba(255,255,255,.5)', winCols: ['#BAE6FD', '#FFFFFF'],
    bg: function (c, W, H, T) { c.fillStyle = lg(c, 0, 0, 0, H, ['#E0F2FE', '#BAE6FD', '#7DD3FC']); c.fillRect(0, 0, W, H); for (var s = 0; s < (A_lite(c) ? 20 : 50); s++) { c.globalAlpha = 0.4 + Math.random() * 0.5; circ(c, Math.random() * W, Math.random() * H, rnd(1, 3), '#fff'); } c.globalAlpha = 1; },
    player: function (d, w, h) { return mkc(w + 8, h + 8, d, function (c, cw, ch) { c.translate(cw / 2, ch / 2); c.fillStyle = '#F87171'; rr(c, -w * 0.32, -h * 0.2, w * 0.64, h * 0.5, w * 0.14); c.fill(); c.fillStyle = '#B91C1C'; rr(c, -w * 0.32, h * 0.1, w * 0.64, h * 0.12, 3); c.fill(); circ(c, 0, -h * 0.34, w * 0.2, '#FBCFE8'); c.fillStyle = '#7C2D12'; circ(c, -w * 0.07, -h * 0.36, w * 0.03, '#1E293B'); circ(c, w * 0.07, -h * 0.36, w * 0.03, '#1E293B'); c.fillStyle = '#1E3A8A'; rr(c, -w * 0.36, h * 0.32, w * 0.72, h * 0.1, 4); c.fill(); }); },
    obs: [function (d, w, h) { return pine(d, w, h); }, function (d, w, h) { return astero(d, w * 0.72, ['#94A3B8', '#475569', '#1E293B']); }]
  }), 'drag', 0.5);

  boot('dunebuggy', dodger({
    lanes: 4, lineCol: 'rgba(120,53,15,.3)', winCols: ['#FDE68A', '#FFFFFF'],
    bg: function (c, W, H, T) { c.fillStyle = lg(c, 0, 0, 0, H, ['#FDE68A', '#FBBF24', '#D97706']); c.fillRect(0, 0, W, H); c.fillStyle = 'rgba(180,120,40,.25)'; for (var q = 0; q < 5; q++) { c.beginPath(); c.moveTo(0, H * (0.3 + q * 0.14)); for (var x = 0; x <= W; x += W / 5) c.lineTo(x, H * (0.3 + q * 0.14) + Math.sin(x * 0.01 + q) * 10); c.lineTo(W, H); c.lineTo(0, H); c.fill(); } },
    player: function (d, w, h) { return buggy(d, w, h); },
    obs: [function (d, w, h) { return cactus(d, w, h); }, function (d, w, h) { return astero(d, w * 0.8, ['#A8A29E', '#78716C', '#44403C']); }]
  }), 'drag', 0.5);

  boot('starcatch', catcher({
    winCols: ['#FDE68A', '#FFFFFF', '#A5B4FC'], ring: '#FDE68A',
    bg: function (c, W, H, T, py) { c.fillStyle = lg(c, 0, 0, 0, H, ['#1E1B4B', '#312E81', '#4C1D95']); c.fillRect(0, 0, W, H); stars(c, W, H, A_lite(c) ? 30 : 80, 0, py); c.fillStyle = lg(c, 0, py - 10, 0, H, ['#3B0764', '#1E1035']); c.fillRect(0, py - 10, W, H - py + 10); },
    basket: function (c, px, py, bw, bh) { woodBasket(c, px, py, bw, bh, '#FDE68A'); },
    good: [function (d, s) { return starS(d, s, '#FDE68A'); }, function (d, s) { return moonS(d, s); }],
    bad: [function (d, s) { return cloudS(d, s); }]
  }), 'drag', 0.5);

  boot('gemcatch', catcher({
    winCols: ['#67E8F9', '#FFFFFF', '#A5B4FC'], ring: '#67E8F9',
    bg: function (c, W, H, T, py) { c.fillStyle = lg(c, 0, 0, 0, H, ['#1E293B', '#334155', '#0F172A']); c.fillRect(0, 0, W, H); for (var q = 0; q < (A_lite(c) ? 8 : 18); q++) { c.globalAlpha = 0.1 + Math.random() * 0.15; circ(c, Math.random() * W, Math.random() * py, rnd(10, 28), '#475569'); } c.globalAlpha = 1; c.fillStyle = lg(c, 0, py - 10, 0, H, ['#1C2436', '#0B0F1A']); c.fillRect(0, py - 10, W, H - py + 10); },
    basket: function (c, px, py, bw, bh) { mineCart(c, px, py, bw, bh); },
    good: [function (d, s) { return gemS(d, s, ['#A5F3FC', '#06B6D4', '#0E7490']); }, function (d, s) { return gemS(d, s, ['#FDE68A', '#F59E0B', '#B45309']); }],
    bad: [function (d, s) { return astero(d, s * 0.8, ['#A8A29E', '#57534E', '#292524']); }]
  }), 'drag', 0.5);

  /* ---- fabriques de sprites réutilisées par les configs ci-dessus ---- */
  function A_lite() { return document.documentElement.classList.contains('oro-lite'); }
  function astero(d, s, cols) { return mkc(s, s, d, function (c, w) { c.translate(w / 2, w / 2); var r = s * 0.42, n = 9, p = []; for (var i = 0; i < n; i++) { var a = i / n * TAU, rr2 = r * rnd(0.7, 1); p.push(Math.cos(a) * rr2, Math.sin(a) * rr2); } c.fillStyle = rg(c, -r * 0.2, -r * 0.2, r * 1.3, cols); poly(c, p, c.fillStyle); c.fill(); c.fillStyle = 'rgba(0,0,0,.25)'; circ(c, r * 0.2, r * 0.1, r * 0.18, 'rgba(0,0,0,.25)'); circ(c, -r * 0.25, r * 0.25, r * 0.12, 'rgba(0,0,0,.2)'); }); }
  function sharkfin(d, w, h) { return mkc(w + 6, h + 6, d, function (c, cw, ch) { c.translate(cw / 2, ch / 2); c.fillStyle = lg(c, 0, -h / 2, 0, h / 2, ['#64748B', '#334155']); c.beginPath(); c.ellipse(0, h * 0.2, w * 0.5, h * 0.3, 0, 0, TAU); c.fill(); c.fillStyle = lg(c, 0, -h * 0.5, 0, 0, ['#94A3B8', '#475569']); c.beginPath(); c.moveTo(-w * 0.3, h * 0.15); c.quadraticCurveTo(w * 0.1, -h * 0.55, w * 0.32, h * 0.1); c.closePath(); c.fill(); c.fillStyle = 'rgba(255,255,255,.6)'; c.fillRect(-w * 0.35, h * 0.3, w * 0.7, 2); }); }
  function jelly(d, w, h) { return mkc(w + 6, h + 6, d, function (c, cw, ch) { c.translate(cw / 2, ch / 2); c.fillStyle = lg(c, 0, -h * 0.3, 0, h * 0.2, ['#F0ABFC', '#D946EF', '#A21CAF']); c.beginPath(); c.arc(0, -h * 0.05, w * 0.4, Math.PI, 0); c.lineTo(w * 0.4, 0); c.lineTo(-w * 0.4, 0); c.fill(); c.strokeStyle = 'rgba(217,70,239,.7)'; c.lineWidth = 2; for (var t2 = -2; t2 <= 2; t2++) { c.beginPath(); c.moveTo(t2 * w * 0.16, 0); c.quadraticCurveTo(t2 * w * 0.16 + 4, h * 0.3, t2 * w * 0.16, h * 0.5); c.stroke(); } }); }
  function pine(d, w, h) { return mkc(w + 6, h + 6, d, function (c, cw, ch) { c.translate(cw / 2, ch / 2); c.fillStyle = '#78350F'; c.fillRect(-w * 0.07, h * 0.2, w * 0.14, h * 0.3); c.fillStyle = lg(c, 0, -h / 2, 0, h * 0.3, ['#34D399', '#059669', '#065F46']); for (var k = 0; k < 3; k++) { var yy = -h * 0.4 + k * h * 0.26, ww = w * (0.24 + k * 0.14); c.beginPath(); c.moveTo(0, yy); c.lineTo(-ww, yy + h * 0.24); c.lineTo(ww, yy + h * 0.24); c.closePath(); c.fill(); } c.fillStyle = 'rgba(255,255,255,.5)'; circ(c, -w * 0.1, -h * 0.2, w * 0.05, 'rgba(255,255,255,.5)'); }); }
  function cactus(d, w, h) { return mkc(w + 6, h + 6, d, function (c, cw, ch) { c.translate(cw / 2, ch / 2); c.fillStyle = lg(c, -w * 0.2, 0, w * 0.2, 0, ['#4ADE80', '#16A34A', '#166534']); rr(c, -w * 0.12, -h * 0.45, w * 0.24, h * 0.9, w * 0.1); c.fill(); rr(c, -w * 0.38, -h * 0.1, w * 0.16, h * 0.3, w * 0.07); c.fill(); rr(c, -w * 0.38, -h * 0.1, w * 0.1, h * 0.05, 2); rr(c, w * 0.22, -h * 0.2, w * 0.16, h * 0.3, w * 0.07); c.fill(); c.strokeStyle = 'rgba(255,255,255,.3)'; c.lineWidth = 1; c.beginPath(); c.moveTo(0, -h * 0.4); c.lineTo(0, h * 0.4); c.stroke(); }); }
  function buggy(d, w, h) { return mkc(w + 8, h + 8, d, function (c, cw, ch) { c.translate(cw / 2, ch / 2); c.fillStyle = '#1F2937'; circ(c, -w * 0.32, h * 0.32, w * 0.16, '#1F2937'); circ(c, w * 0.32, h * 0.32, w * 0.16, '#1F2937'); c.fillStyle = '#F59E0B'; rr(c, -w * 0.4, -h * 0.05, w * 0.8, h * 0.34, w * 0.1); c.fill(); c.fillStyle = '#EA580C'; rr(c, -w * 0.22, -h * 0.34, w * 0.44, h * 0.3, w * 0.08); c.fill(); c.fillStyle = '#0F172A'; rr(c, -w * 0.16, -h * 0.3, w * 0.32, h * 0.2, w * 0.05); c.fill(); c.strokeStyle = '#78350F'; c.lineWidth = 2; c.beginPath(); c.arc(0, h * 0.05, w * 0.3, Math.PI, TAU); c.stroke(); c.fillStyle = '#FDE68A'; circ(c, -w * 0.36, -h * 0.34, w * 0.07, '#FDE68A'); circ(c, w * 0.36, -h * 0.34, w * 0.07, '#FDE68A'); }); }
  function starS(d, s, col) { return mkc(s, s, d, function (c, w) { c.translate(w / 2, w / 2); var R = s * 0.42, r = R * 0.45; c.fillStyle = lg(c, 0, -R, 0, R, [col, '#D97706']); c.beginPath(); for (var i = 0; i < 10; i++) { var a = -Math.PI / 2 + i * Math.PI / 5, rr2 = i % 2 ? r : R; c.lineTo(Math.cos(a) * rr2, Math.sin(a) * rr2); } c.closePath(); c.fill(); c.fillStyle = 'rgba(255,255,255,.5)'; circ(c, -R * 0.2, -R * 0.2, R * 0.14, 'rgba(255,255,255,.5)'); }); }
  function moonS(d, s) { return mkc(s, s, d, function (c, w) { c.translate(w / 2, w / 2); var r = s * 0.38; c.fillStyle = lg(c, -r * 0.3, -r * 0.3, 0, 0, ['#FEF3C7', '#FCD34D']); circ(c, 0, 0, r, c.fillStyle); c.fillStyle = 'rgba(217,119,6,.25)'; circ(c, r * 0.3, -r * 0.2, r * 0.12, 'rgba(217,119,6,.25)'); circ(c, -r * 0.1, r * 0.3, r * 0.1, 'rgba(217,119,6,.2)'); }); }
  function cloudS(d, s) { return mkc(s * 1.1, s, d, function (c, w, h) { c.translate(w / 2, h / 2); c.fillStyle = lg(c, 0, -s * 0.2, 0, s * 0.2, ['#64748B', '#334155']); circ(c, -s * 0.22, 0, s * 0.2, c.fillStyle); circ(c, s * 0.22, 0, s * 0.2, c.fillStyle); circ(c, 0, -s * 0.1, s * 0.26, c.fillStyle); rr(c, -s * 0.42, 0, s * 0.84, s * 0.2, s * 0.1); c.fill(); c.strokeStyle = '#FDE68A'; c.lineWidth = 2; c.beginPath(); c.moveTo(-s * 0.05, s * 0.18); c.lineTo(-s * 0.14, s * 0.4); c.moveTo(s * 0.1, s * 0.18); c.lineTo(s * 0.02, s * 0.42); c.stroke(); }); }
  function gemS(d, s, cols) { return mkc(s, s, d, function (c, w) { c.translate(w / 2, w / 2); var r = s * 0.36; c.fillStyle = lg(c, 0, -r, 0, r, cols); c.beginPath(); c.moveTo(0, -r); c.lineTo(r * 0.85, -r * 0.3); c.lineTo(r * 0.55, r * 0.8); c.lineTo(-r * 0.55, r * 0.8); c.lineTo(-r * 0.85, -r * 0.3); c.closePath(); c.fill(); c.strokeStyle = 'rgba(255,255,255,.4)'; c.lineWidth = 1; c.beginPath(); c.moveTo(0, -r); c.lineTo(0, r * 0.8); c.moveTo(-r * 0.85, -r * 0.3); c.lineTo(r * 0.85, -r * 0.3); c.stroke(); c.fillStyle = 'rgba(255,255,255,.5)'; c.beginPath(); c.moveTo(0, -r); c.lineTo(r * 0.3, -r * 0.3); c.lineTo(-r * 0.3, -r * 0.3); c.fill(); }); }
  function woodBasket(c, px, py, bw, bh, heartCol) { var bx = px - bw / 2, byTop = py - bh * 0.5; c.fillStyle = 'rgba(0,0,0,.2)'; c.beginPath(); c.ellipse(px, byTop + bh, bw * 0.5, bh * 0.18, 0, 0, TAU); c.fill(); c.fillStyle = lg(c, bx, byTop, bx, byTop + bh, ['#D97706', '#92400E']); c.beginPath(); c.moveTo(bx, byTop); c.lineTo(bx + bw, byTop); c.lineTo(bx + bw * 0.85, byTop + bh); c.lineTo(bx + bw * 0.15, byTop + bh); c.closePath(); c.fill(); c.strokeStyle = 'rgba(69,26,3,.45)'; c.lineWidth = 1.4; for (var wy = byTop + 5; wy < byTop + bh - 2; wy += 5) { c.beginPath(); c.moveTo(bx + bw * 0.14, wy); c.lineTo(bx + bw * 0.86, wy); c.stroke(); } c.fillStyle = '#B45309'; rr(c, bx - 3, byTop - 6, bw + 6, 10, 5); c.fill(); }
  function mineCart(c, px, py, bw, bh) { var bx = px - bw / 2, byTop = py - bh * 0.5; c.fillStyle = 'rgba(0,0,0,.25)'; c.beginPath(); c.ellipse(px, byTop + bh, bw * 0.5, bh * 0.16, 0, 0, TAU); c.fill(); c.fillStyle = lg(c, bx, byTop, bx, byTop + bh, ['#94A3B8', '#475569']); c.beginPath(); c.moveTo(bx, byTop); c.lineTo(bx + bw, byTop); c.lineTo(bx + bw * 0.86, byTop + bh * 0.8); c.lineTo(bx + bw * 0.14, byTop + bh * 0.8); c.closePath(); c.fill(); c.fillStyle = '#334155'; for (var r = 0; r < 3; r++) c.fillRect(bx + 3, byTop + 4 + r * (bh * 0.22), bw - 6, 2); c.fillStyle = '#1E293B'; circ(c, bx + bw * 0.24, byTop + bh * 0.9, bh * 0.18, '#1E293B'); circ(c, bx + bw * 0.76, byTop + bh * 0.9, bh * 0.18, '#1E293B'); }

  /* ===== vague 2 : 3 « esquive » (lave, hanté, ville) + 3 « attrape » (ferme, cadeaux, trésor) ===== */
  boot('lavarun', dodger({
    lanes: 4, spin: true, lineCol: 'rgba(249,115,22,.3)', winCols: ['#FDBA74', '#FFFFFF', '#F87171'],
    bg: function (c, W, H) { c.fillStyle = lg(c, 0, 0, 0, H, ['#1C1917', '#450A0A', '#7C2D12']); c.fillRect(0, 0, W, H); c.fillStyle = lg(c, 0, H * 0.5, 0, H, ['rgba(249,115,22,0)', 'rgba(234,88,12,.35)', 'rgba(220,38,38,.5)']); c.fillRect(0, H * 0.5, W, H * 0.5); for (var q = 0; q < (A_lite() ? 10 : 24); q++) { c.globalAlpha = 0.3 + Math.random() * 0.5; circ(c, Math.random() * W, Math.random() * H, rnd(1, 3), '#FDBA74'); } c.globalAlpha = 1; },
    player: function (d, w, h) { return mkc(w + 8, h + 8, d, function (c, cw, ch) { c.translate(cw / 2, ch / 2); c.fillStyle = lg(c, 0, h * 0.1, 0, h * 0.5, ['#FDBA74', '#EA580C']); rr(c, -w * 0.4, h * 0.22, w * 0.8, h * 0.18, w * 0.09); c.fill(); c.fillStyle = '#44403C'; rr(c, -w * 0.24, -h * 0.1, w * 0.48, h * 0.34, w * 0.1); c.fill(); circ(c, 0, -h * 0.26, w * 0.17, '#C7A17A'); c.fillStyle = '#F87171'; c.beginPath(); c.moveTo(-w * 0.4, h * 0.4); c.lineTo(-w * 0.6, h * 0.55); c.lineTo(-w * 0.3, h * 0.5); c.fill(); c.fillStyle = '#FDE68A'; c.beginPath(); c.moveTo(w * 0.1, h * 0.4); c.lineTo(0, h * 0.62); c.lineTo(-w * 0.1, h * 0.4); c.fill(); }); },
    obs: [function (d, w, h) { return lavaBlob(d, w * 0.85); }, function (d, w, h) { return astero(d, w * 0.85, ['#57534E', '#292524', '#0C0A09']); }]
  }), 'drag', 0.5);

  boot('ghostdash', dodger({
    lanes: 4, lineCol: 'rgba(196,181,253,.25)', winCols: ['#C4B5FD', '#FFFFFF'],
    bg: function (c, W, H) { c.fillStyle = lg(c, 0, 0, 0, H, ['#1E1B4B', '#2E1065', '#4C1D95']); c.fillRect(0, 0, W, H); c.fillStyle = rg(c, W * 0.5, H * 0.2, W * 0.5, ['rgba(196,181,253,.18)', 'rgba(196,181,253,0)']); c.fillRect(0, 0, W, H); stars(c, W, H, A_lite() ? 20 : 50, 0, H); },
    player: function (d, w, h) { return mkc(w + 8, h + 8, d, function (c, cw, ch) { c.translate(cw / 2, ch / 2); c.strokeStyle = '#78350F'; c.lineWidth = 3; c.beginPath(); c.moveTo(-w * 0.3, -h * 0.3); c.lineTo(-w * 0.1, -h * 0.05); c.stroke(); c.fillStyle = 'rgba(253,224,71,.85)'; circ(c, -w * 0.33, -h * 0.34, w * 0.14, 'rgba(253,224,71,.5)'); c.fillStyle = '#FACC15'; rr(c, -w * 0.4, -h * 0.4, w * 0.16, h * 0.18, 3); c.fill(); c.fillStyle = lg(c, 0, -h * 0.2, 0, h * 0.4, ['#38BDF8', '#2563EB']); rr(c, -w * 0.22, -h * 0.2, w * 0.44, h * 0.5, w * 0.12); c.fill(); circ(c, 0, -h * 0.28, w * 0.18, '#FBCFE8'); c.fillStyle = '#1E293B'; circ(c, -w * 0.06, -h * 0.3, w * 0.03, '#1E293B'); circ(c, w * 0.06, -h * 0.3, w * 0.03, '#1E293B'); }); },
    obs: [function (d, w, h) { return ghostS(d, w, h); }, function (d, w, h) { return batS(d, w, h); }]
  }), 'drag', 0.5);

  boot('cityscoot', dodger({
    lanes: 4, lineCol: 'rgba(253,230,138,.7)', winCols: ['#FDE68A', '#FFFFFF'],
    bg: function (c, W, H, T, rx0, rx1) { c.fillStyle = lg(c, 0, 0, 0, H, ['#1F2937', '#374151', '#1F2937']); c.fillRect(0, 0, W, H); fieldLines(c, W, H, T, rx0, rx1, '#111827', '#F59E0B'); c.fillStyle = 'rgba(55,65,81,.6)'; for (var q = 0; q < 6; q++) { var bx = (q % 2 ? rx1 + 4 : 0), bw2 = (q % 2 ? W - rx1 - 4 : rx0 - 4); c.fillRect(bx, (q * 90) % H, bw2, 50); } },
    player: function (d, w, h) { return mkc(w + 8, h + 8, d, function (c, cw, ch) { c.translate(cw / 2, ch / 2); c.fillStyle = '#1F2937'; circ(c, 0, h * 0.34, w * 0.16, '#1F2937'); circ(c, 0, -h * 0.3, w * 0.13, '#1F2937'); c.strokeStyle = '#DC2626'; c.lineWidth = w * 0.12; c.lineCap = 'round'; c.beginPath(); c.moveTo(0, h * 0.34); c.lineTo(0, -h * 0.2); c.stroke(); c.fillStyle = '#EF4444'; rr(c, -w * 0.18, -h * 0.05, w * 0.36, h * 0.22, w * 0.08); c.fill(); c.fillStyle = '#FBCFE8'; circ(c, 0, -h * 0.4, w * 0.15, '#FBCFE8'); c.fillStyle = '#1E3A8A'; c.beginPath(); c.arc(0, -h * 0.42, w * 0.16, Math.PI, 0); c.fill(); c.fillStyle = '#FDE68A'; circ(c, 0, -h * 0.34, w * 0.08, '#FDE68A'); }); },
    obs: [function (d, w, h) { return carTop(d, w, h, ['#FCA5A5', '#DC2626', '#7F1D1D']); }, function (d, w, h) { return coneS(d, w, h); }]
  }), 'drag', 0.5);

  boot('eggcatch', catcher({
    winCols: ['#FDE68A', '#FFFFFF'], ring: '#FDE68A',
    bg: function (c, W, H, T, py) { c.fillStyle = lg(c, 0, 0, 0, H, ['#BAE6FD', '#FDE68A', '#86EFAC']); c.fillRect(0, 0, W, H); c.fillStyle = '#16A34A'; c.fillRect(0, py - 6, W, H - py + 6); c.fillStyle = '#B91C1C'; c.beginPath(); c.moveTo(W * 0.06, py); c.lineTo(W * 0.06, py - (H - T) * 0.14); c.lineTo(W * 0.16, py - (H - T) * 0.2); c.lineTo(W * 0.26, py - (H - T) * 0.14); c.lineTo(W * 0.26, py); c.fill(); },
    basket: function (c, px, py, bw, bh) { nestBasket(c, px, py, bw, bh); },
    good: [function (d, s) { return eggS(d, s, ['#FFFFFF', '#E7E5E4']); }, function (d, s) { return eggS(d, s, ['#FDE68A', '#D97706']); }],
    bad: [function (d, s) { return eggS(d, s, ['#A3E635', '#4D7C0F']); }]
  }), 'drag', 0.5);

  boot('gifthaul', catcher({
    winCols: ['#F87171', '#FFFFFF', '#86EFAC'], ring: '#F87171',
    bg: function (c, W, H, T, py) { c.fillStyle = lg(c, 0, 0, 0, H, ['#0C4A6E', '#1E3A8A', '#312E81']); c.fillRect(0, 0, W, H); for (var s = 0; s < (A_lite() ? 20 : 46); s++) { c.globalAlpha = 0.5 + Math.random() * 0.4; circ(c, Math.random() * W, Math.random() * py, rnd(1, 3), '#fff'); } c.globalAlpha = 1; c.fillStyle = '#F8FAFC'; c.beginPath(); c.moveTo(0, py); for (var x = 0; x <= W; x += W / 6) c.lineTo(x, py - 8 - Math.abs(Math.sin(x * 0.02)) * 8); c.lineTo(W, H); c.lineTo(0, H); c.fill(); },
    basket: function (c, px, py, bw, bh) { sackBasket(c, px, py, bw, bh); },
    good: [function (d, s) { return giftS(d, s, ['#F87171', '#B91C1C'], '#FDE68A'); }, function (d, s) { return giftS(d, s, ['#86EFAC', '#15803D'], '#F87171'); }],
    bad: [function (d, s) { return astero(d, s * 0.8, ['#44403C', '#1C1917', '#0C0A09']); }]
  }), 'drag', 0.5);

  boot('coincatch', catcher({
    winCols: ['#FDE68A', '#FFFFFF'], ring: '#FDE68A',
    bg: function (c, W, H, T, py) { c.fillStyle = lg(c, 0, 0, 0, H, ['#451A03', '#78350F', '#1C1917']); c.fillRect(0, 0, W, H); for (var q = 0; q < (A_lite() ? 8 : 18); q++) { c.globalAlpha = 0.1 + Math.random() * 0.14; circ(c, Math.random() * W, Math.random() * py, rnd(8, 24), '#D97706'); } c.globalAlpha = 1; c.fillStyle = lg(c, 0, py - 8, 0, H, ['#292524', '#0C0A09']); c.fillRect(0, py - 8, W, H - py + 8); },
    basket: function (c, px, py, bw, bh) { potBasket(c, px, py, bw, bh); },
    good: [function (d, s) { return coinObj(d, s); }, function (d, s) { return gemS(d, s, ['#F0ABFC', '#C026D3', '#86198F']); }],
    bad: [function (d, s) { return bombS(d, s); }]
  }), 'drag', 0.5);

  /* ---- sprites vague 2 ---- */
  function lavaBlob(d, s) { return mkc(s, s, d, function (c, w) { c.translate(w / 2, w / 2); var r = s * 0.4; c.fillStyle = lg(c, 0, -r, 0, r, ['#FDE68A', '#F97316', '#B91C1C']); circ(c, 0, 0, r, c.fillStyle); c.fillStyle = 'rgba(255,255,255,.4)'; circ(c, -r * 0.3, -r * 0.3, r * 0.2, 'rgba(255,255,255,.45)'); c.fillStyle = 'rgba(127,29,29,.5)'; circ(c, r * 0.25, r * 0.2, r * 0.14, 'rgba(127,29,29,.5)'); }); }
  function ghostS(d, w, h) { return mkc(w + 6, h + 6, d, function (c, cw, ch) { c.translate(cw / 2, ch / 2); c.fillStyle = 'rgba(241,245,249,.92)'; c.beginPath(); c.arc(0, -h * 0.05, w * 0.34, Math.PI, 0); c.lineTo(w * 0.34, h * 0.3); for (var k = 0; k < 4; k++) c.lineTo(w * 0.34 - w * 0.17 * (k + 0.5), h * 0.3 + (k % 2 ? -h * 0.1 : 0)); c.lineTo(-w * 0.34, h * 0.3); c.closePath(); c.fill(); c.fillStyle = '#1E293B'; circ(c, -w * 0.12, -h * 0.05, w * 0.06, '#1E293B'); circ(c, w * 0.12, -h * 0.05, w * 0.06, '#1E293B'); c.fillStyle = 'rgba(148,163,184,.5)'; circ(c, 0, h * 0.08, w * 0.05, 'rgba(148,163,184,.5)'); }); }
  function batS(d, w, h) { return mkc(w + 6, h + 6, d, function (c, cw, ch) { c.translate(cw / 2, ch / 2); c.fillStyle = '#1E293B'; circ(c, 0, 0, w * 0.17, '#1E293B'); c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(-w * 0.3, -h * 0.2, -w * 0.5, 0); c.quadraticCurveTo(-w * 0.3, h * 0.05, -w * 0.18, h * 0.12); c.quadraticCurveTo(-w * 0.1, 0, 0, 0); c.fill(); c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(w * 0.3, -h * 0.2, w * 0.5, 0); c.quadraticCurveTo(w * 0.3, h * 0.05, w * 0.18, h * 0.12); c.quadraticCurveTo(w * 0.1, 0, 0, 0); c.fill(); c.fillStyle = '#F87171'; circ(c, -w * 0.06, -h * 0.02, w * 0.03, '#F87171'); circ(c, w * 0.06, -h * 0.02, w * 0.03, '#F87171'); }); }
  function carTop(d, w, h, cols) { return mkc(w + 6, h + 6, d, function (c, cw, ch) { c.translate(cw / 2, ch / 2); c.fillStyle = lg(c, -w / 2, -h / 2, w / 2, h / 2, cols); rr(c, -w * 0.32, -h * 0.42, w * 0.64, h * 0.84, w * 0.2); c.fill(); c.fillStyle = 'rgba(15,23,42,.7)'; rr(c, -w * 0.24, -h * 0.28, w * 0.48, h * 0.24, w * 0.08); c.fill(); rr(c, -w * 0.24, h * 0.06, w * 0.48, h * 0.2, w * 0.08); c.fill(); c.fillStyle = '#FCA5A5'; circ(c, -w * 0.22, -h * 0.4, w * 0.07, '#FCA5A5'); circ(c, w * 0.22, -h * 0.4, w * 0.07, '#FCA5A5'); }); }
  function coneS(d, w, h) { return mkc(w + 6, h + 6, d, function (c, cw, ch) { c.translate(cw / 2, ch / 2); c.fillStyle = '#EA580C'; c.beginPath(); c.moveTo(0, -h * 0.42); c.lineTo(w * 0.26, h * 0.3); c.lineTo(-w * 0.26, h * 0.3); c.closePath(); c.fill(); c.fillStyle = '#FFF7ED'; c.beginPath(); c.moveTo(-w * 0.14, -h * 0.05); c.lineTo(w * 0.14, -h * 0.05); c.lineTo(w * 0.18, h * 0.08); c.lineTo(-w * 0.18, h * 0.08); c.fill(); c.fillStyle = '#C2410C'; rr(c, -w * 0.34, h * 0.3, w * 0.68, h * 0.12, 3); c.fill(); }); }
  function eggS(d, s, cols) { return mkc(s, s, d, function (c, w) { c.translate(w / 2, w / 2); c.fillStyle = lg(c, 0, -s * 0.4, 0, s * 0.4, cols); c.beginPath(); c.ellipse(0, s * 0.03, s * 0.28, s * 0.36, 0, 0, TAU); c.fill(); c.fillStyle = 'rgba(255,255,255,.45)'; circ(c, -s * 0.09, -s * 0.12, s * 0.08, 'rgba(255,255,255,.5)'); }); }
  function giftS(d, s, cols, ribbon) { return mkc(s, s, d, function (c, w) { c.translate(w / 2, w / 2); c.fillStyle = lg(c, 0, -s * 0.3, 0, s * 0.3, cols); rr(c, -s * 0.3, -s * 0.22, s * 0.6, s * 0.52, s * 0.05); c.fill(); c.fillStyle = ribbon; c.fillRect(-s * 0.06, -s * 0.22, s * 0.12, s * 0.52); c.fillRect(-s * 0.3, -s * 0.02, s * 0.6, s * 0.1); c.beginPath(); c.moveTo(0, -s * 0.22); c.quadraticCurveTo(-s * 0.2, -s * 0.42, -s * 0.02, -s * 0.24); c.quadraticCurveTo(s * 0.2, -s * 0.42, 0, -s * 0.22); c.fill(); }); }
  function coinObj(d, s) { return mkc(s, s, d, function (c, w) { c.translate(w / 2, w / 2); var r = s * 0.34; c.fillStyle = lg(c, -r * 0.3, -r * 0.3, r, r, ['#FEF3C7', '#F59E0B', '#B45309']); circ(c, 0, 0, r, c.fillStyle); c.strokeStyle = '#B45309'; c.lineWidth = 2; c.beginPath(); c.arc(0, 0, r * 0.72, 0, TAU); c.stroke(); c.fillStyle = '#B45309'; c.font = 'bold ' + (r * 0.9) + 'px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('$', 0, r * 0.05); }); }
  function bombS(d, s) { return mkc(s, s, d, function (c, w) { c.translate(w / 2, w / 2); var r = s * 0.3; c.fillStyle = lg(c, -r * 0.3, -r * 0.3, r, r, ['#475569', '#0F172A']); circ(c, 0, s * 0.05, r, c.fillStyle); c.fillStyle = '#334155'; rr(c, -s * 0.06, -s * 0.32, s * 0.12, s * 0.12, 2); c.fill(); c.strokeStyle = '#78350F'; c.lineWidth = 2; c.beginPath(); c.moveTo(0, -s * 0.28); c.quadraticCurveTo(s * 0.14, -s * 0.4, s * 0.1, -s * 0.46); c.stroke(); c.fillStyle = '#FDE68A'; circ(c, s * 0.1, -s * 0.46, s * 0.05, '#FB923C'); circ(c, s * 0.1, -s * 0.46, s * 0.025, '#FDE68A'); c.fillStyle = 'rgba(255,255,255,.3)'; circ(c, -r * 0.3, -r * 0.2, r * 0.16, 'rgba(255,255,255,.3)'); }); }
  function nestBasket(c, px, py, bw, bh) { var byTop = py - bh * 0.4; c.fillStyle = 'rgba(0,0,0,.2)'; c.beginPath(); c.ellipse(px, byTop + bh * 0.7, bw * 0.5, bh * 0.18, 0, 0, TAU); c.fill(); c.fillStyle = lg(c, 0, byTop, 0, byTop + bh, ['#A16207', '#78350F']); c.beginPath(); c.ellipse(px, byTop + bh * 0.3, bw * 0.5, bh * 0.5, 0, 0, Math.PI); c.fill(); c.strokeStyle = 'rgba(69,26,3,.6)'; c.lineWidth = 2; for (var a = 0; a < 6; a++) { c.beginPath(); c.moveTo(px - bw * 0.45 + a * bw * 0.18, byTop + bh * 0.3); c.quadraticCurveTo(px - bw * 0.4 + a * bw * 0.18, byTop + bh * 0.6, px - bw * 0.35 + a * bw * 0.18, byTop + bh * 0.3); c.stroke(); } c.fillStyle = '#92400E'; c.beginPath(); c.ellipse(px, byTop + bh * 0.28, bw * 0.4, bh * 0.16, 0, 0, TAU); c.fill(); }
  function sackBasket(c, px, py, bw, bh) { var byTop = py - bh * 0.5; c.fillStyle = 'rgba(0,0,0,.2)'; c.beginPath(); c.ellipse(px, byTop + bh, bw * 0.46, bh * 0.16, 0, 0, TAU); c.fill(); c.fillStyle = lg(c, 0, byTop, 0, byTop + bh, ['#DC2626', '#7F1D1D']); c.beginPath(); c.moveTo(px - bw * 0.32, byTop); c.quadraticCurveTo(px - bw * 0.5, byTop + bh, px, byTop + bh); c.quadraticCurveTo(px + bw * 0.5, byTop + bh, px + bw * 0.32, byTop); c.fill(); c.fillStyle = '#FFF7ED'; rr(c, px - bw * 0.36, byTop - 5, bw * 0.72, 9, 4); c.fill(); c.fillStyle = '#B91C1C'; for (var g = -1; g <= 1; g++) { c.beginPath(); c.moveTo(px + g * bw * 0.14, byTop); c.lineTo(px + g * bw * 0.14 - 3, byTop - 6); c.lineTo(px + g * bw * 0.14 + 3, byTop - 6); c.fill(); } }
  function potBasket(c, px, py, bw, bh) { var byTop = py - bh * 0.5; c.fillStyle = 'rgba(0,0,0,.25)'; c.beginPath(); c.ellipse(px, byTop + bh, bw * 0.44, bh * 0.16, 0, 0, TAU); c.fill(); c.fillStyle = lg(c, 0, byTop, 0, byTop + bh, ['#1F2937', '#0F172A']); c.beginPath(); c.moveTo(px - bw * 0.36, byTop + bh * 0.1); c.quadraticCurveTo(px - bw * 0.46, byTop + bh, px, byTop + bh); c.quadraticCurveTo(px + bw * 0.46, byTop + bh, px + bw * 0.36, byTop + bh * 0.1); c.fill(); c.fillStyle = '#374151'; c.beginPath(); c.ellipse(px, byTop + bh * 0.1, bw * 0.38, bh * 0.14, 0, 0, TAU); c.fill(); c.fillStyle = '#FDE68A'; circ(c, px - bw * 0.14, byTop + bh * 0.02, bh * 0.1, '#FDE68A'); circ(c, px + bw * 0.12, byTop + bh * 0.05, bh * 0.08, '#F59E0B'); circ(c, px, byTop - bh * 0.02, bh * 0.09, '#FCD34D'); }

  /* ================================================================== MOTEUR GÉNÉRIQUE « vol » (flappy) — touche pour monter,
     relâche pour descendre (gravité) ; passe par les trous des parois sans toucher. cfg : décor, pilote, couleurs des parois. */
  function flappy(cfg) {
    return function (A) {
      var W, H, T, dpr, bg, jx, jy, vy, cols = [], cw, t = 0, dead = 0, won = 0, slide = null, passed = 0, jetS, GRAV, IMP, nextX;
      function addCol() { var lv = (A.live() || A.idle()) ? A.lv() : 0.2, gapH = (H - T) * ((cfg.gap || 0.46) - 0.14 * Math.min(1, lv)); gapH = Math.max(gapH, (H - T) * 0.26); var gapY = rnd(T + gapH * 0.6, H - gapH * 0.6); cols.push({ x: nextX, gapY: gapY, gapH: gapH, scored: 0 }); nextX += W * (0.62 - 0.08 * Math.min(1, lv)); }
      function flap() { if (!dead && !slide && !won) vy = IMP; }
      return {
        size: function (w, h, uu, d, top) {
          W = w; H = h; dpr = d; T = top; jx = W * 0.3; cw = W * 0.14; GRAV = (H - T) * 2.6; IMP = -(H - T) * 0.62; if (jy == null) jy = (T + H) / 2;
          jetS = cfg.player(dpr, clamp(Math.min(W, H - T) * 0.1, 22, 54)); bg = mkc(W, H, dpr, function (c) { cfg.bg(c, W, H, T); });
          nextX = W * 0.9; if (cols.length === 0) for (var i = 0; i < 4; i++) addCol();
        },
        reset: function () { cols = []; dead = 0; won = 0; slide = null; passed = 0; jy = (T + H) / 2; vy = 0; nextX = W * 0.9; for (var i = 0; i < 4; i++) addCol(); },
        step: function (dt, live) {
          t += dt; var lv = live ? A.lv() : 0.2, i, col, spd = W * (0.34 + 0.4 * lv);
          if (slide) { slide.t += dt; jy += (vy += GRAV * dt) * dt; for (i = 0; i < cols.length; i++) cols[i].x -= spd * 0.3 * dt; return; }
          if (dead || won) return;
          if (A.idle()) { var ahead = null; for (i = 0; i < cols.length; i++) { if (cols[i].x + cw > jx - cw) { ahead = cols[i]; break; } } if (ahead && jy > ahead.gapY + (H - T) * 0.01 && vy > -(H - T) * 0.1) flap(); }
          vy += GRAV * dt; jy += vy * dt;
          for (i = cols.length - 1; i >= 0; i--) {
            col = cols[i]; col.x -= spd * dt;
            if (!col.scored && col.x + cw < jx) { col.scored = 1; passed++; A.burst(jx, jy, 5, cfg.winCols || ['#FDE68A', '#FFFFFF'], 90, 0.4, 2); }
            if (col.x + cw < -cw) { cols.splice(i, 1); addCol(); continue; }
            if (jx + jetS.w * 0.32 > col.x && jx - jetS.w * 0.32 < col.x + cw) { if (jy - jetS.h * 0.32 < col.gapY - col.gapH / 2 || jy + jetS.h * 0.32 > col.gapY + col.gapH / 2) { if (A.live()) { if (A.fail(A.l.fail)) { dead = 1; boomFx(A, jx, jy, 1.1); A.shake(0.5); } return; } } }
          }
          if (jy < T + jetS.h * 0.32 || jy > H - jetS.h * 0.32) { jy = clamp(jy, T + jetS.h * 0.32, H - jetS.h * 0.32); vy = 0; if (A.live()) { if (A.fail(A.l.fail)) { dead = 1; boomFx(A, jx, jy, 1); A.shake(0.4); } return; } }
        },
        draw: function (c) {
          A.bg(bg); var i, col; var wc = cfg.wall || ['#334155', '#1E293B', '#0F172A'], cap = cfg.cap || '#475569';
          for (i = 0; i < cols.length; i++) {
            col = cols[i]; var topH = col.gapY - col.gapH / 2, botY = col.gapY + col.gapH / 2;
            c.fillStyle = lg(c, col.x, 0, col.x + cw, 0, wc); c.fillRect(col.x, T - 4, cw, topH - T + 4); c.fillRect(col.x, botY, cw, H - botY);
            c.fillStyle = 'rgba(0,0,0,.18)'; c.fillRect(col.x + cw - 5, T - 4, 5, topH - T + 4); c.fillRect(col.x + cw - 5, botY, 5, H - botY);
            c.fillStyle = cap; c.fillRect(col.x - 2, topH - 8, cw + 4, 8); c.fillRect(col.x - 2, botY, cw + 4, 8);
          }
          if (!dead) { c.save(); c.translate(jx, jy); c.rotate(clamp(vy / (H - T) * 0.6, -0.5, 0.6)); if (cfg.trail !== false) { c.fillStyle = cfg.trailCol || 'rgba(253,186,116,.7)'; c.beginPath(); c.moveTo(-jetS.w * 0.5, 0); c.lineTo(-jetS.w * 0.5 - rnd(8, 18), -3); c.lineTo(-jetS.w * 0.5 - rnd(8, 18), 3); c.closePath(); c.fill(); } c.drawImage(jetS, -jetS.w / 2, -jetS.h / 2, jetS.w, jetS.h); c.restore(); }
        },
        act: function (k, x, y) { flap(); },
        key: function (k) { if (k === 'up' || k === 'left' || k === 'right') flap(); },
        boom: function () { slide = { t: 0 }; A.sx('engine', { k: 'rumble' }); },
        win: function () { won = 0.001; A.burst(jx, jy, 16, cfg.winCols || ['#FFFFFF', '#FDE68A'], 160, 0.6, 3); },
        dbg: function () { return { jx: jx | 0, jy: jy | 0, cols: cols.length, dead: dead, passed: passed }; }
      };
    };
  }

  /* ===== vague 3 : 2 « vol » (jetpack, sous-marin) + 2 « esquive » (lune, labo) + 2 « attrape » (verger, forêt) ===== */
  boot('jetpack', flappy({
    gap: 0.48, wall: ['#64748B', '#475569', '#334155'], cap: '#94A3B8', trailCol: 'rgba(249,115,22,.75)', winCols: ['#FDBA74', '#FFFFFF'],
    bg: function (c, W, H) { c.fillStyle = lg(c, 0, 0, 0, H, ['#1E293B', '#334155', '#F59E0B']); c.fillRect(0, 0, W, H); for (var q = 0; q < (A_lite() ? 8 : 20); q++) { c.globalAlpha = 0.15; c.fillStyle = '#0F172A'; var bw = rnd(W * 0.08, W * 0.16); c.fillRect(rnd(0, W), rnd(H * 0.3, H), bw, H); } c.globalAlpha = 1; },
    player: function (d, s) { return mkc(s * 1.1, s, d, function (c, w, h) { c.translate(w / 2, h / 2); c.fillStyle = '#334155'; rr(c, -s * 0.36, -s * 0.3, s * 0.2, s * 0.56, s * 0.08); c.fill(); c.fillStyle = '#F59E0B'; circ(c, -s * 0.26, s * 0.3, s * 0.08, '#F59E0B'); c.fillStyle = lg(c, 0, -s * 0.3, 0, s * 0.3, ['#38BDF8', '#2563EB']); rr(c, -s * 0.16, -s * 0.28, s * 0.4, s * 0.5, s * 0.1); c.fill(); circ(c, s * 0.08, -s * 0.28, s * 0.16, '#FBCFE8'); c.fillStyle = '#1E293B'; circ(c, s * 0.12, -s * 0.3, s * 0.05, '#1E293B'); }); }
  }), 'tap', 0.45);

  boot('bubblesub', flappy({
    gap: 0.5, wall: ['#065F46', '#064E3B', '#022C22'], cap: '#047857', trail: false, winCols: ['#7DD3FC', '#FFFFFF'],
    bg: function (c, W, H) { c.fillStyle = lg(c, 0, 0, 0, H, ['#0369A1', '#075985', '#082F49']); c.fillRect(0, 0, W, H); for (var b = 0; b < (A_lite() ? 10 : 24); b++) { c.globalAlpha = 0.12 + Math.random() * 0.14; circ(c, Math.random() * W, Math.random() * H, rnd(2, 8), '#BAE6FD'); } c.globalAlpha = 1; },
    player: function (d, s) { return mkc(s * 1.3, s, d, function (c, w, h) { c.translate(w / 2, h / 2); c.fillStyle = lg(c, 0, -s * 0.3, 0, s * 0.3, ['#FDE68A', '#F59E0B', '#B45309']); c.beginPath(); c.ellipse(0, 0, s * 0.5, s * 0.3, 0, 0, TAU); c.fill(); c.fillStyle = '#0369A1'; circ(c, s * 0.12, -s * 0.02, s * 0.14, '#7DD3FC'); c.strokeStyle = '#B45309'; c.lineWidth = 2; c.beginPath(); c.arc(s * 0.12, -s * 0.02, s * 0.14, 0, TAU); c.stroke(); c.fillStyle = '#EA580C'; c.beginPath(); c.moveTo(-s * 0.45, 0); c.lineTo(-s * 0.6, -s * 0.18); c.lineTo(-s * 0.6, s * 0.18); c.fill(); c.fillStyle = '#F59E0B'; rr(c, -s * 0.1, -s * 0.42, s * 0.2, s * 0.14, 2); c.fill(); }); }
  }), 'tap', 0.45);

  boot('moonrover', dodger({
    lanes: 4, spin: true, lineCol: 'rgba(148,163,184,.3)', winCols: ['#E2E8F0', '#FFFFFF'],
    bg: function (c, W, H, T) { c.fillStyle = lg(c, 0, 0, 0, H, ['#020617', '#0F172A', '#1E293B']); c.fillRect(0, 0, W, H); stars(c, W, H, A_lite() ? 30 : 70, 0, H * 0.5); c.fillStyle = rg(c, W * 0.8, H * 0.14, W * 0.3, ['#E2E8F0', '#94A3B8']); circ(c, W * 0.8, H * 0.14, W * 0.1, c.fillStyle); c.fillStyle = 'rgba(100,116,139,.2)'; for (var q = 0; q < 10; q++) circ(c, Math.random() * W, H * 0.5 + Math.random() * H * 0.5, rnd(6, 20), 'rgba(71,85,105,.25)'); },
    player: function (d, w, h) { return mkc(w + 8, h + 8, d, function (c, cw, ch) { c.translate(cw / 2, ch / 2); c.fillStyle = '#1E293B'; circ(c, -w * 0.32, h * 0.3, w * 0.14, '#1E293B'); circ(c, w * 0.32, h * 0.3, w * 0.14, '#1E293B'); c.fillStyle = lg(c, 0, -h * 0.2, 0, h * 0.3, ['#E2E8F0', '#94A3B8']); rr(c, -w * 0.38, -h * 0.1, w * 0.76, h * 0.34, w * 0.1); c.fill(); c.fillStyle = '#334155'; rr(c, -w * 0.2, -h * 0.34, w * 0.4, h * 0.26, w * 0.06); c.fill(); c.fillStyle = '#7DD3FC'; rr(c, -w * 0.14, -h * 0.3, w * 0.28, h * 0.16, 3); c.fill(); c.fillStyle = '#FDE68A'; circ(c, -w * 0.34, -h * 0.02, w * 0.06, '#FDE68A'); circ(c, w * 0.34, -h * 0.02, w * 0.06, '#FDE68A'); }); },
    obs: [function (d, w, h) { return astero(d, w * 0.85, ['#CBD5E1', '#94A3B8', '#475569']); }, function (d, w, h) { return astero(d, w * 0.7, ['#A8A29E', '#57534E', '#292524']); }]
  }), 'drag', 0.5);

  boot('toxicrun', dodger({
    lanes: 4, spin: true, lineCol: 'rgba(132,204,22,.3)', winCols: ['#BEF264', '#FFFFFF'],
    bg: function (c, W, H) { c.fillStyle = lg(c, 0, 0, 0, H, ['#1A2E05', '#365314', '#3F6212']); c.fillRect(0, 0, W, H); for (var q = 0; q < (A_lite() ? 8 : 18); q++) { c.globalAlpha = 0.1 + Math.random() * 0.15; circ(c, Math.random() * W, Math.random() * H, rnd(8, 26), '#84CC16'); } c.globalAlpha = 1; },
    player: function (d, w, h) { return mkc(w + 8, h + 8, d, function (c, cw, ch) { c.translate(cw / 2, ch / 2); c.fillStyle = lg(c, 0, -h * 0.2, 0, h * 0.4, ['#FDE68A', '#F59E0B']); rr(c, -w * 0.26, -h * 0.15, w * 0.52, h * 0.55, w * 0.14); c.fill(); circ(c, 0, -h * 0.3, w * 0.2, '#FDE047'); c.fillStyle = '#1E293B'; c.beginPath(); c.ellipse(0, -h * 0.3, w * 0.14, w * 0.09, 0, 0, TAU); c.fill(); c.fillStyle = 'rgba(125,211,252,.5)'; c.beginPath(); c.ellipse(-w * 0.04, -h * 0.33, w * 0.05, w * 0.03, 0, 0, TAU); c.fill(); }); },
    obs: [function (d, w, h) { return toxBarrel(d, w, h); }, function (d, w, h) { return lavaBlob2(d, w * 0.85, ['#BEF264', '#65A30D', '#365314']); }]
  }), 'drag', 0.5);

  boot('applecatch', catcher({
    winCols: ['#F87171', '#FFFFFF', '#86EFAC'], ring: '#F87171',
    bg: function (c, W, H, T, py) { c.fillStyle = lg(c, 0, 0, 0, H, ['#BAE6FD', '#DCFCE7', '#86EFAC']); c.fillRect(0, 0, W, H); c.fillStyle = '#15803D'; c.fillRect(0, py - 8, W, H - py + 8); c.fillStyle = 'rgba(21,128,61,.5)'; for (var q = 0; q < 3; q++) circ(c, (q + 0.5) * W / 3, T + 20, rnd(30, 50), 'rgba(22,163,74,.4)'); },
    basket: function (c, px, py, bw, bh) { woodBasket(c, px, py, bw, bh); },
    good: [function (d, s) { return appleS(d, s, ['#F87171', '#B91C1C']); }, function (d, s) { return appleS(d, s, ['#BEF264', '#4D7C0F']); }],
    bad: [function (d, s) { return waspS(d, s); }]
  }), 'drag', 0.5);

  boot('acorncatch', catcher({
    winCols: ['#D97706', '#FFFFFF'], ring: '#D97706',
    bg: function (c, W, H, T, py) { c.fillStyle = lg(c, 0, 0, 0, H, ['#78350F', '#92400E', '#451A03']); c.fillRect(0, 0, W, H); for (var q = 0; q < (A_lite() ? 8 : 16); q++) { c.globalAlpha = 0.14; circ(c, Math.random() * W, Math.random() * py, rnd(10, 26), '#B45309'); } c.globalAlpha = 1; c.fillStyle = '#3F2A12'; c.fillRect(0, py - 8, W, H - py + 8); },
    basket: function (c, px, py, bw, bh) { woodBasket(c, px, py, bw, bh); },
    good: [function (d, s) { return acornS(d, s); }, function (d, s) { return leafS(d, s); }],
    bad: [function (d, s) { return astero(d, s * 0.78, ['#57534E', '#292524', '#0C0A09']); }]
  }), 'drag', 0.5);

  /* ---- sprites vague 3 ---- */
  function toxBarrel(d, w, h) { return mkc(w + 6, h + 6, d, function (c, cw, ch) { c.translate(cw / 2, ch / 2); c.fillStyle = lg(c, -w * 0.2, 0, w * 0.2, 0, ['#A3E635', '#65A30D', '#365314']); rr(c, -w * 0.26, -h * 0.4, w * 0.52, h * 0.8, w * 0.06); c.fill(); c.fillStyle = 'rgba(0,0,0,.25)'; c.fillRect(-w * 0.26, -h * 0.14, w * 0.52, h * 0.06); c.fillRect(-w * 0.26, h * 0.08, w * 0.52, h * 0.06); c.fillStyle = '#FDE047'; circ(c, 0, 0, w * 0.13, '#FDE047'); c.fillStyle = '#1C1917'; c.font = 'bold ' + (w * 0.2) + 'px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('☢', 0, w * 0.01); }); }
  function lavaBlob2(d, s, cols) { return mkc(s, s, d, function (c, w) { c.translate(w / 2, w / 2); var r = s * 0.4; c.fillStyle = lg(c, 0, -r, 0, r, cols); circ(c, 0, 0, r, c.fillStyle); c.fillStyle = 'rgba(255,255,255,.35)'; circ(c, -r * 0.3, -r * 0.3, r * 0.18, 'rgba(255,255,255,.4)'); c.fillStyle = 'rgba(0,0,0,.2)'; circ(c, r * 0.25, r * 0.2, r * 0.13, 'rgba(0,0,0,.2)'); }); }
  function appleS(d, s, cols) { return mkc(s, s, d, function (c, w) { c.translate(w / 2, w / 2); var r = s * 0.3; c.fillStyle = lg(c, -r * 0.3, -r * 0.3, r, r, cols); c.beginPath(); c.arc(-r * 0.4, 0, r * 0.7, 0, TAU); c.arc(r * 0.4, 0, r * 0.7, 0, TAU); c.fill(); c.strokeStyle = '#78350F'; c.lineWidth = 2; c.beginPath(); c.moveTo(0, -r * 0.6); c.lineTo(s * 0.04, -s * 0.4); c.stroke(); c.fillStyle = '#16A34A'; c.beginPath(); c.ellipse(s * 0.1, -s * 0.38, s * 0.1, s * 0.05, -0.6, 0, TAU); c.fill(); c.fillStyle = 'rgba(255,255,255,.4)'; circ(c, -r * 0.4, -r * 0.3, r * 0.18, 'rgba(255,255,255,.4)'); }); }
  function waspS(d, s) { return mkc(s * 1.1, s, d, function (c, w, h) { c.translate(w / 2, h / 2); c.fillStyle = 'rgba(241,245,249,.7)'; c.beginPath(); c.ellipse(-s * 0.1, -s * 0.18, s * 0.22, s * 0.1, -0.4, 0, TAU); c.fill(); c.beginPath(); c.ellipse(s * 0.1, -s * 0.18, s * 0.22, s * 0.1, 0.4, 0, TAU); c.fill(); c.fillStyle = '#FACC15'; c.beginPath(); c.ellipse(0, s * 0.05, s * 0.26, s * 0.18, 0, 0, TAU); c.fill(); c.fillStyle = '#1C1917'; for (var b = -1; b <= 1; b++) c.fillRect(b * s * 0.12 - s * 0.03, s * 0.05 - s * 0.14, s * 0.06, s * 0.28); circ(c, 0, -s * 0.16, s * 0.1, '#1C1917'); }); }
  function acornS(d, s) { return mkc(s, s, d, function (c, w) { c.translate(w / 2, w / 2); c.fillStyle = lg(c, 0, 0, 0, s * 0.4, ['#F59E0B', '#B45309']); c.beginPath(); c.moveTo(-s * 0.22, -s * 0.02); c.quadraticCurveTo(0, s * 0.42, s * 0.22, -s * 0.02); c.closePath(); c.fill(); c.fillStyle = lg(c, 0, -s * 0.3, 0, 0, ['#92400E', '#451A03']); c.beginPath(); c.ellipse(0, -s * 0.1, s * 0.26, s * 0.16, 0, Math.PI, 0); c.fill(); c.fillRect(-s * 0.26, -s * 0.12, s * 0.52, s * 0.04); c.strokeStyle = '#78350F'; c.lineWidth = 2; c.beginPath(); c.moveTo(0, -s * 0.24); c.lineTo(0, -s * 0.34); c.stroke(); }); }
  function leafS(d, s) { return mkc(s, s, d, function (c, w) { c.translate(w / 2, w / 2); c.rotate(0.5); c.fillStyle = lg(c, -s * 0.2, 0, s * 0.2, 0, ['#FDBA74', '#EA580C', '#B91C1C']); c.beginPath(); c.moveTo(0, -s * 0.34); c.quadraticCurveTo(s * 0.3, 0, 0, s * 0.34); c.quadraticCurveTo(-s * 0.3, 0, 0, -s * 0.34); c.fill(); c.strokeStyle = 'rgba(120,53,15,.6)'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(0, -s * 0.34); c.lineTo(0, s * 0.34); c.stroke(); }); }
  /* ===== vague 4 : 2 « vol » (chauve-souris, fusée) + 2 « esquive » (kayak, néon) + 2 « attrape » (pizza, pétales) ===== */
  boot('cavebat', flappy({
    gap: 0.46, wall: ['#57534E', '#44403C', '#292524'], cap: '#78716C', trail: false, winCols: ['#C4B5FD', '#FFFFFF'],
    bg: function (c, W, H) { c.fillStyle = lg(c, 0, 0, 0, H, ['#1C1917', '#292524', '#1E1B4B']); c.fillRect(0, 0, W, H); for (var q = 0; q < (A_lite() ? 6 : 14); q++) { c.globalAlpha = 0.5; circ(c, Math.random() * W, Math.random() * H, rnd(1, 2), '#C4B5FD'); } c.globalAlpha = 1; },
    player: function (d, s) { return mkc(s * 1.4, s, d, function (c, w, h) { c.translate(w / 2, h / 2); c.fillStyle = '#1E1B2E'; circ(c, 0, 0, s * 0.2, '#312E4A'); c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(-s * 0.4, -s * 0.3, -s * 0.62, 0); c.quadraticCurveTo(-s * 0.38, s * 0.1, -s * 0.22, s * 0.18); c.quadraticCurveTo(-s * 0.14, 0, 0, 0); c.fill(); c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(s * 0.4, -s * 0.3, s * 0.62, 0); c.quadraticCurveTo(s * 0.38, s * 0.1, s * 0.22, s * 0.18); c.quadraticCurveTo(s * 0.14, 0, 0, 0); c.fill(); c.fillStyle = '#312E4A'; c.beginPath(); c.moveTo(-s * 0.12, -s * 0.16); c.lineTo(-s * 0.06, -s * 0.3); c.lineTo(0, -s * 0.16); c.fill(); c.beginPath(); c.moveTo(s * 0.12, -s * 0.16); c.lineTo(s * 0.06, -s * 0.3); c.lineTo(0, -s * 0.16); c.fill(); c.fillStyle = '#FDE047'; circ(c, -s * 0.07, -s * 0.02, s * 0.04, '#FDE047'); circ(c, s * 0.07, -s * 0.02, s * 0.04, '#FDE047'); }); }
  }), 'tap', 0.45);

  boot('rocketcave', flappy({
    gap: 0.47, wall: ['#78350F', '#57534E', '#292524'], cap: '#A16207', trailCol: 'rgba(249,115,22,.8)', winCols: ['#FDBA74', '#FFFFFF'],
    bg: function (c, W, H) { c.fillStyle = lg(c, 0, 0, 0, H, ['#020617', '#1E1B4B', '#2E1065']); c.fillRect(0, 0, W, H); stars(c, W, H, A_lite() ? 20 : 50, 0, H); },
    player: function (d, s) { return mkc(s * 1.3, s, d, function (c, w, h) { c.translate(w / 2, h / 2); c.fillStyle = lg(c, -s * 0.4, 0, s * 0.5, 0, ['#F1F5F9', '#94A3B8', '#475569']); c.beginPath(); c.moveTo(s * 0.5, 0); c.quadraticCurveTo(s * 0.1, -s * 0.28, -s * 0.4, -s * 0.2); c.lineTo(-s * 0.4, s * 0.2); c.quadraticCurveTo(s * 0.1, s * 0.28, s * 0.5, 0); c.fill(); c.fillStyle = '#EF4444'; c.beginPath(); c.moveTo(-s * 0.3, -s * 0.18); c.lineTo(-s * 0.52, -s * 0.34); c.lineTo(-s * 0.3, -s * 0.02); c.fill(); c.beginPath(); c.moveTo(-s * 0.3, s * 0.18); c.lineTo(-s * 0.52, s * 0.34); c.lineTo(-s * 0.3, s * 0.02); c.fill(); c.fillStyle = '#7DD3FC'; circ(c, s * 0.14, 0, s * 0.12, '#7DD3FC'); }); }
  }), 'tap', 0.45);

  boot('kayakrush', dodger({
    lanes: 4, spin: true, lineCol: 'rgba(255,255,255,.2)', winCols: ['#7DD3FC', '#FFFFFF'],
    bg: function (c, W, H, T, rx0, rx1) { c.fillStyle = lg(c, 0, 0, 0, H, ['#0E7490', '#0369A1', '#075985']); c.fillRect(0, 0, W, H); fieldLines(c, W, H, T, rx0, rx1, '#15803D', '#166534'); c.strokeStyle = 'rgba(255,255,255,.14)'; c.lineWidth = 2; for (var y = 0; y < H; y += 20) { c.beginPath(); for (var x = rx0; x <= rx1; x += 8) c.lineTo(x, y + Math.sin(x * 0.06 + y) * 3); c.stroke(); } },
    player: function (d, w, h) { return mkc(w + 8, h + 8, d, function (c, cw, ch) { c.translate(cw / 2, ch / 2); c.fillStyle = lg(c, 0, -h / 2, 0, h / 2, ['#FDE047', '#EA580C']); c.beginPath(); c.moveTo(0, -h * 0.48); c.quadraticCurveTo(w * 0.28, 0, 0, h * 0.48); c.quadraticCurveTo(-w * 0.28, 0, 0, -h * 0.48); c.fill(); c.fillStyle = '#B45309'; c.beginPath(); c.ellipse(0, 0, w * 0.14, h * 0.28, 0, 0, TAU); c.fill(); circ(c, 0, -h * 0.06, w * 0.14, '#1E40AF'); circ(c, 0, -h * 0.1, w * 0.1, '#FBCFE8'); c.strokeStyle = '#78350F'; c.lineWidth = 3; c.beginPath(); c.moveTo(-w * 0.34, -h * 0.14); c.lineTo(w * 0.34, h * 0.14); c.stroke(); }); },
    obs: [function (d, w, h) { return astero(d, w * 0.85, ['#94A3B8', '#475569', '#1E293B']); }, function (d, w, h) { return logS(d, w, h); }]
  }), 'drag', 0.5);

  boot('neonrider', dodger({
    lanes: 4, lineCol: 'rgba(236,72,153,.4)', winCols: ['#F0ABFC', '#67E8F9'],
    bg: function (c, W, H, T) { c.fillStyle = lg(c, 0, 0, 0, H, ['#2E1065', '#4C1D95', '#831843']); c.fillRect(0, 0, W, H); c.strokeStyle = 'rgba(236,72,153,.35)'; c.lineWidth = 1.5; for (var y = T; y < H; y += (H - T) / 10) { c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); } for (var x = 0; x <= W; x += W / 8) { c.beginPath(); c.moveTo(W / 2, T); c.lineTo(x, H); c.stroke(); } c.fillStyle = rg(c, W * 0.5, T, W * 0.4, ['rgba(244,114,182,.3)', 'rgba(244,114,182,0)']); c.fillRect(0, 0, W, H * 0.5); },
    player: function (d, w, h) { return mkc(w + 8, h + 8, d, function (c, cw, ch) { c.translate(cw / 2, ch / 2); c.fillStyle = '#0F172A'; circ(c, 0, h * 0.34, w * 0.16, '#0F172A'); circ(c, 0, -h * 0.3, w * 0.14, '#0F172A'); c.strokeStyle = '#F0ABFC'; c.lineWidth = w * 0.1; c.lineCap = 'round'; c.beginPath(); c.moveTo(0, h * 0.34); c.lineTo(0, -h * 0.26); c.stroke(); c.fillStyle = '#D946EF'; rr(c, -w * 0.16, -h * 0.1, w * 0.32, h * 0.22, w * 0.06); c.fill(); c.fillStyle = '#67E8F9'; circ(c, 0, -h * 0.4, w * 0.14, '#67E8F9'); c.fillStyle = '#A5F3FC'; circ(c, 0, -h * 0.42, w * 0.07, '#A5F3FC'); }); },
    obs: [function (d, w, h) { return neonBar(d, w, h); }, function (d, w, h) { return carTop(d, w, h, ['#67E8F9', '#0891B2', '#164E63']); }]
  }), 'drag', 0.5);

  boot('pizzacatch', catcher({
    winCols: ['#FDE68A', '#F87171', '#FFFFFF'], ring: '#F59E0B',
    bg: function (c, W, H, T, py) { c.fillStyle = lg(c, 0, 0, 0, H, ['#FDE68A', '#FCA5A5', '#B91C1C']); c.fillRect(0, 0, W, H); c.fillStyle = 'rgba(120,53,15,.2)'; for (var q = 0; q < 6; q++) c.fillRect(0, (q * 60) % H, W, 4); c.fillStyle = lg(c, 0, py - 8, 0, H, ['#92400E', '#451A03']); c.fillRect(0, py - 8, W, H - py + 8); },
    basket: function (c, px, py, bw, bh) { plateBasket(c, px, py, bw, bh); },
    good: [function (d, s) { return pizzaS(d, s); }, function (d, s) { return cheeseS(d, s); }],
    bad: [function (d, s) { return chiliS(d, s); }]
  }), 'drag', 0.5);

  boot('petalcatch', catcher({
    winCols: ['#F9A8D4', '#FFFFFF', '#FDE68A'], ring: '#F9A8D4',
    bg: function (c, W, H, T, py) { c.fillStyle = lg(c, 0, 0, 0, H, ['#BAE6FD', '#FBCFE8', '#86EFAC']); c.fillRect(0, 0, W, H); c.fillStyle = '#15803D'; c.fillRect(0, py - 8, W, H - py + 8); c.fillStyle = 'rgba(190,24,93,.2)'; for (var q = 0; q < (A_lite() ? 6 : 14); q++) circ(c, Math.random() * W, Math.random() * py, rnd(2, 5), 'rgba(249,168,212,.5)'); },
    basket: function (c, px, py, bw, bh) { woodBasket(c, px, py, bw, bh); },
    good: [function (d, s) { return petalS(d, s); }, function (d, s) { return flowerS(d, s); }],
    bad: [function (d, s) { return waspS(d, s); }]
  }), 'drag', 0.5);

  /* ---- sprites vague 4 ---- */
  function logS(d, w, h) { return mkc(w + 6, h + 6, d, function (c, cw, ch) { c.translate(cw / 2, ch / 2); c.fillStyle = lg(c, 0, -h * 0.2, 0, h * 0.2, ['#A16207', '#78350F', '#451A03']); rr(c, -w * 0.44, -h * 0.18, w * 0.88, h * 0.36, h * 0.18); c.fill(); c.fillStyle = '#92400E'; c.beginPath(); c.ellipse(-w * 0.44, 0, w * 0.08, h * 0.18, 0, 0, TAU); c.fill(); c.strokeStyle = '#78350F'; c.lineWidth = 1.5; c.beginPath(); c.arc(-w * 0.44, 0, w * 0.04, 0, TAU); c.stroke(); c.strokeStyle = 'rgba(69,26,3,.4)'; c.beginPath(); c.moveTo(-w * 0.3, -h * 0.1); c.lineTo(w * 0.4, -h * 0.05); c.stroke(); }); }
  function neonBar(d, w, h) { return mkc(w + 6, h + 6, d, function (c, cw, ch) { c.translate(cw / 2, ch / 2); c.fillStyle = '#1E1B4B'; rr(c, -w * 0.44, -h * 0.14, w * 0.88, h * 0.28, 4); c.fill(); c.fillStyle = '#F43F5E'; for (var s = -2; s <= 2; s++) rr(c, s * w * 0.17 - w * 0.06, -h * 0.12, w * 0.12, h * 0.24, 2); c.fillStyle = '#FDE047'; c.fillRect(-w * 0.44, -h * 0.16, w * 0.88, 3); c.fillRect(-w * 0.44, h * 0.13, w * 0.88, 3); }); }
  function plateBasket(c, px, py, bw, bh) { var byTop = py - bh * 0.2; c.fillStyle = 'rgba(0,0,0,.2)'; c.beginPath(); c.ellipse(px, byTop + bh * 0.5, bw * 0.5, bh * 0.2, 0, 0, TAU); c.fill(); c.fillStyle = lg(c, 0, byTop - bh * 0.2, 0, byTop + bh * 0.4, ['#F1F5F9', '#CBD5E1']); c.beginPath(); c.ellipse(px, byTop, bw * 0.5, bh * 0.34, 0, 0, TAU); c.fill(); c.fillStyle = '#E2E8F0'; c.beginPath(); c.ellipse(px, byTop - bh * 0.04, bw * 0.38, bh * 0.24, 0, 0, TAU); c.fill(); c.strokeStyle = 'rgba(148,163,184,.6)'; c.lineWidth = 2; c.beginPath(); c.ellipse(px, byTop - bh * 0.04, bw * 0.38, bh * 0.24, 0, 0, TAU); c.stroke(); }
  function pizzaS(d, s) { return mkc(s, s, d, function (c, w) { c.translate(w / 2, w / 2); c.rotate(0.3); c.fillStyle = lg(c, 0, -s * 0.3, 0, s * 0.3, ['#FDE047', '#F59E0B']); c.beginPath(); c.moveTo(0, -s * 0.36); c.lineTo(s * 0.28, s * 0.3); c.lineTo(-s * 0.28, s * 0.3); c.closePath(); c.fill(); c.fillStyle = '#DC2626'; circ(c, -s * 0.08, s * 0.02, s * 0.06, '#DC2626'); circ(c, s * 0.1, s * 0.12, s * 0.055, '#DC2626'); circ(c, s * 0.02, s * 0.2, s * 0.05, '#DC2626'); c.fillStyle = '#B91C1C'; c.fillRect(-s * 0.28, s * 0.26, s * 0.56, s * 0.06); }); }
  function cheeseS(d, s) { return mkc(s, s, d, function (c, w) { c.translate(w / 2, w / 2); c.fillStyle = lg(c, 0, -s * 0.2, 0, s * 0.3, ['#FDE047', '#EAB308']); c.beginPath(); c.moveTo(-s * 0.32, s * 0.24); c.lineTo(s * 0.32, s * 0.24); c.lineTo(s * 0.32, -s * 0.02); c.lineTo(-s * 0.32, s * 0.12); c.closePath(); c.fill(); c.fillStyle = 'rgba(180,120,20,.5)'; circ(c, -s * 0.1, s * 0.12, s * 0.05, 'rgba(180,120,20,.5)'); circ(c, s * 0.14, s * 0.06, s * 0.04, 'rgba(180,120,20,.5)'); }); }
  function chiliS(d, s) { return mkc(s, s, d, function (c, w) { c.translate(w / 2, w / 2); c.fillStyle = lg(c, -s * 0.1, 0, s * 0.1, 0, ['#F87171', '#B91C1C', '#7F1D1D']); c.beginPath(); c.moveTo(0, -s * 0.3); c.quadraticCurveTo(s * 0.22, -s * 0.1, s * 0.08, s * 0.34); c.quadraticCurveTo(-s * 0.06, s * 0.1, 0, -s * 0.3); c.fill(); c.fillStyle = '#16A34A'; c.beginPath(); c.moveTo(0, -s * 0.3); c.lineTo(s * 0.08, -s * 0.42); c.lineTo(-s * 0.04, -s * 0.36); c.fill(); }); }
  function petalS(d, s) { return mkc(s, s, d, function (c, w) { c.translate(w / 2, w / 2); c.fillStyle = lg(c, 0, -s * 0.3, 0, s * 0.3, ['#FBCFE8', '#F472B6', '#DB2777']); c.beginPath(); c.moveTo(0, -s * 0.34); c.quadraticCurveTo(s * 0.22, -s * 0.1, 0, s * 0.3); c.quadraticCurveTo(-s * 0.22, -s * 0.1, 0, -s * 0.34); c.fill(); c.strokeStyle = 'rgba(190,24,93,.4)'; c.lineWidth = 1; c.beginPath(); c.moveTo(0, -s * 0.3); c.lineTo(0, s * 0.26); c.stroke(); }); }
  function flowerS(d, s) { return mkc(s, s, d, function (c, w) { c.translate(w / 2, w / 2); c.fillStyle = '#F9A8D4'; for (var p = 0; p < 6; p++) { var a = p / 6 * TAU; circ(c, Math.cos(a) * s * 0.2, Math.sin(a) * s * 0.2, s * 0.13, '#F9A8D4'); } c.fillStyle = '#FDE047'; circ(c, 0, 0, s * 0.14, '#FDE047'); c.fillStyle = 'rgba(217,119,6,.4)'; circ(c, 0, 0, s * 0.07, 'rgba(217,119,6,.4)'); }); }
  /* ===== vague 5 : 3 « vol » (hibou, poisson, montgolfière) + 3 « attrape » (bonbons, beignets, perles) ===== */
  boot('owlflight', flappy({
    gap: 0.46, wall: ['#166534', '#14532D', '#052e16'], cap: '#15803D', trail: false, winCols: ['#FDE68A', '#FFFFFF'],
    bg: function (c, W, H) { c.fillStyle = lg(c, 0, 0, 0, H, ['#1E1B4B', '#312E81', '#1E3A8A']); c.fillRect(0, 0, W, H); stars(c, W, H, A_lite() ? 20 : 50, 0, H * 0.6); c.fillStyle = rg(c, W * 0.8, H * 0.14, W * 0.18, ['#FEF3C7', '#FCD34D']); circ(c, W * 0.8, H * 0.14, W * 0.08, c.fillStyle); },
    player: function (d, s) { return mkc(s * 1.2, s, d, function (c, w, h) { c.translate(w / 2, h / 2); c.fillStyle = lg(c, 0, -s * 0.3, 0, s * 0.3, ['#B45309', '#78350F']); c.beginPath(); c.ellipse(0, 0, s * 0.3, s * 0.36, 0, 0, TAU); c.fill(); c.fillStyle = '#FDE68A'; circ(c, -s * 0.12, -s * 0.12, s * 0.14, '#FEF3C7'); circ(c, s * 0.12, -s * 0.12, s * 0.14, '#FEF3C7'); c.fillStyle = '#1C1917'; circ(c, -s * 0.12, -s * 0.12, s * 0.07, '#1C1917'); circ(c, s * 0.12, -s * 0.12, s * 0.07, '#1C1917'); c.fillStyle = '#F59E0B'; c.beginPath(); c.moveTo(0, -s * 0.02); c.lineTo(-s * 0.06, s * 0.08); c.lineTo(s * 0.06, s * 0.08); c.fill(); c.fillStyle = '#92400E'; c.beginPath(); c.moveTo(-s * 0.18, -s * 0.28); c.lineTo(-s * 0.06, -s * 0.18); c.lineTo(-s * 0.1, -s * 0.3); c.fill(); c.beginPath(); c.moveTo(s * 0.18, -s * 0.28); c.lineTo(s * 0.06, -s * 0.18); c.lineTo(s * 0.1, -s * 0.3); c.fill(); }); }
  }), 'tap', 0.45);

  boot('coralfish', flappy({
    gap: 0.48, wall: ['#DB2777', '#9D174D', '#500724'], cap: '#F472B6', trail: false, winCols: ['#7DD3FC', '#FFFFFF'],
    bg: function (c, W, H) { c.fillStyle = lg(c, 0, 0, 0, H, ['#0369A1', '#075985', '#082F49']); c.fillRect(0, 0, W, H); for (var b = 0; b < (A_lite() ? 8 : 20); b++) { c.globalAlpha = 0.12; circ(c, Math.random() * W, Math.random() * H, rnd(2, 7), '#BAE6FD'); } c.globalAlpha = 1; },
    player: function (d, s) { return mkc(s * 1.3, s, d, function (c, w, h) { c.translate(w / 2, h / 2); c.fillStyle = lg(c, 0, -s * 0.2, 0, s * 0.2, ['#FB923C', '#EA580C', '#C2410C']); c.beginPath(); c.ellipse(s * 0.05, 0, s * 0.4, s * 0.26, 0, 0, TAU); c.fill(); c.fillStyle = '#FDBA74'; for (var st = 0; st < 3; st++) { c.beginPath(); c.ellipse(s * 0.05 - st * s * 0.16, 0, s * 0.03, s * 0.2, 0, 0, TAU); c.fill(); } c.fillStyle = '#EA580C'; c.beginPath(); c.moveTo(-s * 0.3, 0); c.lineTo(-s * 0.55, -s * 0.2); c.lineTo(-s * 0.55, s * 0.2); c.fill(); circ(c, s * 0.3, -s * 0.04, s * 0.06, '#fff'); circ(c, s * 0.31, -s * 0.04, s * 0.03, '#1C1917'); }); }
  }), 'tap', 0.45);

  boot('balloonup', flappy({
    gap: 0.5, wall: ['#78716C', '#57534E', '#44403C'], cap: '#A8A29E', trail: false, winCols: ['#F87171', '#FDE68A'],
    bg: function (c, W, H) { c.fillStyle = lg(c, 0, 0, 0, H, ['#7DD3FC', '#BAE6FD', '#E0F2FE']); c.fillRect(0, 0, W, H); for (var q = 0; q < (A_lite() ? 5 : 11); q++) { c.globalAlpha = 0.5; var cx = rnd(0, W), cy = rnd(0, H * 0.7); circ(c, cx, cy, rnd(14, 30), 'rgba(255,255,255,.7)'); circ(c, cx + 18, cy + 4, rnd(12, 22), 'rgba(255,255,255,.6)'); } c.globalAlpha = 1; },
    player: function (d, s) { return mkc(s, s * 1.3, d, function (c, w, h) { c.translate(w / 2, h / 2); c.fillStyle = lg(c, 0, -s * 0.5, 0, s * 0.2, ['#F87171', '#DC2626', '#991B1B']); c.beginPath(); c.arc(0, -s * 0.2, s * 0.42, 0, Math.PI); c.arc(0, -s * 0.2, s * 0.42, Math.PI, 0, true); c.ellipse(0, -s * 0.2, s * 0.42, s * 0.5, 0, 0, TAU); c.fill(); c.fillStyle = 'rgba(255,255,255,.25)'; c.beginPath(); c.ellipse(-s * 0.12, -s * 0.35, s * 0.1, s * 0.22, 0, 0, TAU); c.fill(); c.strokeStyle = '#78350F'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(-s * 0.2, s * 0.2); c.lineTo(-s * 0.12, s * 0.42); c.moveTo(s * 0.2, s * 0.2); c.lineTo(s * 0.12, s * 0.42); c.stroke(); c.fillStyle = '#92400E'; rr(c, -s * 0.16, s * 0.42, s * 0.32, s * 0.22, 3); c.fill(); }); }
  }), 'tap', 0.45);

  boot('candycatch', catcher({
    winCols: ['#F9A8D4', '#67E8F9', '#FFFFFF'], ring: '#F9A8D4',
    bg: function (c, W, H, T, py) { c.fillStyle = lg(c, 0, 0, 0, H, ['#FBCFE8', '#C4B5FD', '#A5F3FC']); c.fillRect(0, 0, W, H); c.fillStyle = 'rgba(236,72,153,.15)'; for (var q = 0; q < 8; q++) { c.save(); c.translate((q + 0.5) * W / 8, (q * 70) % py); c.rotate(0.6); rr(c, -6, -20, 12, 40, 6); c.fill(); c.restore(); } c.fillStyle = lg(c, 0, py - 8, 0, H, ['#DB2777', '#831843']); c.fillRect(0, py - 8, W, H - py + 8); },
    basket: function (c, px, py, bw, bh) { woodBasket(c, px, py, bw, bh); },
    good: [function (d, s) { return lollipopS(d, s, ['#F472B6', '#A5F3FC']); }, function (d, s) { return candyS(d, s); }],
    bad: [function (d, s) { return chiliS(d, s); }]
  }), 'drag', 0.5);

  boot('donutcatch', catcher({
    winCols: ['#F9A8D4', '#FFFFFF'], ring: '#F472B6',
    bg: function (c, W, H, T, py) { c.fillStyle = lg(c, 0, 0, 0, H, ['#FDE68A', '#FBCFE8', '#F9A8D4']); c.fillRect(0, 0, W, H); c.fillStyle = 'rgba(146,64,14,.3)'; c.fillRect(0, py - 10, W, H - py + 10); c.fillStyle = '#92400E'; for (var q = 0; q < 6; q++) c.fillRect((q + 0.5) * W / 6 - 3, py - 10, 6, H - py + 10); },
    basket: function (c, px, py, bw, bh) { plateBasket(c, px, py, bw, bh); },
    good: [function (d, s) { return donutS(d, s); }, function (d, s) { return cupcakeS(d, s); }],
    bad: [function (d, s) { return donutS(d, s, true); }]
  }), 'drag', 0.5);

  boot('pearlcatch', catcher({
    winCols: ['#A5F3FC', '#FFFFFF', '#F9A8D4'], ring: '#A5F3FC',
    bg: function (c, W, H, T, py) { c.fillStyle = lg(c, 0, 0, 0, H, ['#0E7490', '#155E75', '#083344']); c.fillRect(0, 0, W, H); for (var b = 0; b < (A_lite() ? 8 : 20); b++) { c.globalAlpha = 0.12; circ(c, Math.random() * W, Math.random() * py, rnd(2, 7), '#A5F3FC'); } c.globalAlpha = 1; c.fillStyle = '#F59E0B'; for (var q = 0; q < 5; q++) { c.beginPath(); c.moveTo((q + 0.3) * W / 5, py); c.lineTo((q + 0.4) * W / 5, py - (H - T) * 0.1); c.lineTo((q + 0.5) * W / 5, py); c.fill(); } c.fillStyle = '#064E3B'; c.fillRect(0, py - 4, W, H - py + 4); },
    basket: function (c, px, py, bw, bh) { clamShell(c, px, py, bw, bh); },
    good: [function (d, s) { return pearlS(d, s); }, function (d, s) { return starS(d, s, '#FDE68A'); }],
    bad: [function (d, s) { return urchinS(d, s); }]
  }), 'drag', 0.5);

  /* ---- sprites vague 5 ---- */
  function lollipopS(d, s, cols) { return mkc(s, s, d, function (c, w) { c.translate(w / 2, w / 2); c.strokeStyle = '#E2E8F0'; c.lineWidth = s * 0.07; c.lineCap = 'round'; c.beginPath(); c.moveTo(0, s * 0.05); c.lineTo(0, s * 0.42); c.stroke(); var r = s * 0.26; circ(c, 0, -s * 0.1, r, cols[0]); c.strokeStyle = cols[1]; c.lineWidth = s * 0.05; for (var a = 0; a < 4; a++) { c.beginPath(); c.arc(0, -s * 0.1, r * (0.3 + a * 0.22), a * 1.2, a * 1.2 + 4); c.stroke(); } c.fillStyle = 'rgba(255,255,255,.4)'; circ(c, -r * 0.3, -s * 0.1 - r * 0.3, r * 0.2, 'rgba(255,255,255,.4)'); }); }
  function candyS(d, s) { return mkc(s, s, d, function (c, w) { c.translate(w / 2, w / 2); c.rotate(0.4); c.fillStyle = lg(c, -s * 0.2, 0, s * 0.2, 0, ['#F472B6', '#DB2777']); rr(c, -s * 0.18, -s * 0.12, s * 0.36, s * 0.24, s * 0.1); c.fill(); c.fillStyle = '#FBCFE8'; for (var k = -1; k <= 1; k++) c.fillRect(k * s * 0.1 - s * 0.02, -s * 0.12, s * 0.04, s * 0.24); c.fillStyle = '#DB2777'; for (var e = -1; e <= 1; e += 2) { c.beginPath(); c.moveTo(e * s * 0.18, 0); c.lineTo(e * s * 0.34, -s * 0.12); c.lineTo(e * s * 0.34, s * 0.12); c.fill(); } }); }
  function donutS(d, s, burnt) { return mkc(s, s, d, function (c, w) { c.translate(w / 2, w / 2); var r = s * 0.34; c.fillStyle = burnt ? '#44403C' : '#C4863E'; circ(c, 0, 0, r, c.fillStyle); c.fillStyle = burnt ? '#1C1917' : lg(c, 0, -r, 0, r * 0.3, ['#F9A8D4', '#EC4899']); c.beginPath(); c.arc(0, 0, r, 0, TAU); c.arc(0, 0, r * 0.4, 0, TAU, true); c.fill(); if (!burnt) { var sp = ['#FDE047', '#67E8F9', '#A5F3FC', '#FFFFFF']; for (var k = 0; k < 8; k++) { var a = k / 8 * TAU; c.save(); c.translate(Math.cos(a) * r * 0.68, Math.sin(a) * r * 0.68); c.rotate(a); c.fillStyle = sp[k % sp.length]; c.fillRect(-s * 0.02, -s * 0.05, s * 0.04, s * 0.1); c.restore(); } } c.fillStyle = burnt ? '#0C0A09' : '#C4863E'; circ(c, 0, 0, r * 0.4, c.fillStyle); }); }
  function cupcakeS(d, s) { return mkc(s, s, d, function (c, w) { c.translate(w / 2, w / 2); c.fillStyle = lg(c, 0, 0, 0, s * 0.4, ['#F59E0B', '#B45309']); c.beginPath(); c.moveTo(-s * 0.26, s * 0.02); c.lineTo(s * 0.26, s * 0.02); c.lineTo(s * 0.18, s * 0.38); c.lineTo(-s * 0.18, s * 0.38); c.closePath(); c.fill(); c.fillStyle = 'rgba(69,26,3,.4)'; for (var k = -1; k <= 1; k++) c.fillRect(k * s * 0.12 - s * 0.02, s * 0.02, s * 0.04, s * 0.36); c.fillStyle = lg(c, 0, -s * 0.3, 0, s * 0.05, ['#FBCFE8', '#F472B6']); c.beginPath(); c.arc(0, -s * 0.02, s * 0.28, Math.PI, 0); c.fill(); circ(c, -s * 0.1, -s * 0.12, s * 0.12, '#F9A8D4'); circ(c, s * 0.1, -s * 0.12, s * 0.12, '#F9A8D4'); circ(c, 0, -s * 0.22, s * 0.12, '#F9A8D4'); c.fillStyle = '#DC2626'; circ(c, 0, -s * 0.3, s * 0.06, '#DC2626'); }); }
  function pearlS(d, s) { return mkc(s, s, d, function (c, w) { c.translate(w / 2, w / 2); var r = s * 0.3; c.fillStyle = rg(c, -r * 0.3, -r * 0.3, r, ['#FFFFFF', '#E0F2FE', '#A5B4FC']); circ(c, 0, 0, r, c.fillStyle); c.fillStyle = 'rgba(255,255,255,.7)'; circ(c, -r * 0.3, -r * 0.3, r * 0.18, 'rgba(255,255,255,.7)'); }); }
  function urchinS(d, s) { return mkc(s, s, d, function (c, w) { c.translate(w / 2, w / 2); var r = s * 0.22; c.strokeStyle = '#1E1B4B'; c.lineWidth = 2; for (var k = 0; k < 12; k++) { var a = k / 12 * TAU; c.beginPath(); c.moveTo(Math.cos(a) * r, Math.sin(a) * r); c.lineTo(Math.cos(a) * r * 1.8, Math.sin(a) * r * 1.8); c.stroke(); } c.fillStyle = lg(c, 0, -r, 0, r, ['#4C1D95', '#1E1B4B']); circ(c, 0, 0, r, c.fillStyle); }); }
  function clamShell(c, px, py, bw, bh) { var byTop = py - bh * 0.4; c.fillStyle = 'rgba(0,0,0,.2)'; c.beginPath(); c.ellipse(px, byTop + bh * 0.5, bw * 0.5, bh * 0.16, 0, 0, TAU); c.fill(); c.fillStyle = lg(c, 0, byTop, 0, byTop + bh, ['#FBCFE8', '#F472B6', '#BE185D']); c.beginPath(); c.ellipse(px, byTop + bh * 0.3, bw * 0.5, bh * 0.5, 0, Math.PI, 0, true); c.fill(); c.strokeStyle = 'rgba(190,24,93,.5)'; c.lineWidth = 2; for (var r = 0; r < 5; r++) { c.beginPath(); c.moveTo(px, byTop + bh * 0.3); c.lineTo(px - bw * 0.4 + r * bw * 0.2, byTop - bh * 0.1); c.stroke(); } c.fillStyle = '#F8FAFC'; c.beginPath(); c.ellipse(px, byTop + bh * 0.3, bw * 0.4, bh * 0.14, 0, 0, TAU); c.fill(); }
  /* ===== vague 6 : 3 « vol » (hélico, libellule, avion papier) + 3 « attrape » (neige, tacos, fruits) ===== */
  boot('copterflight', flappy({
    gap: 0.46, wall: ['#475569', '#334155', '#1E293B'], cap: '#64748B', trail: false, winCols: ['#FDE68A', '#FFFFFF'],
    bg: function (c, W, H) { c.fillStyle = lg(c, 0, 0, 0, H, ['#7DD3FC', '#38BDF8', '#0EA5E9']); c.fillRect(0, 0, W, H); for (var q = 0; q < (A_lite() ? 5 : 11); q++) { c.globalAlpha = 0.5; circ(c, rnd(0, W), rnd(0, H * 0.6), rnd(14, 26), 'rgba(255,255,255,.6)'); } c.globalAlpha = 1; },
    player: function (d, s) { return mkc(s * 1.5, s, d, function (c, w, h) { c.translate(w / 2, h / 2); c.strokeStyle = '#1E293B'; c.lineWidth = 2; c.beginPath(); c.moveTo(-s * 0.5, -s * 0.34); c.lineTo(s * 0.5, -s * 0.34); c.stroke(); c.fillStyle = 'rgba(148,163,184,.4)'; rr(c, -s * 0.5, -s * 0.37, s * 1, s * 0.05, 2); c.fill(); c.fillStyle = lg(c, 0, -s * 0.1, 0, s * 0.2, ['#F59E0B', '#B45309']); c.beginPath(); c.ellipse(0, 0, s * 0.34, s * 0.24, 0, 0, TAU); c.fill(); c.fillStyle = '#EA580C'; c.beginPath(); c.moveTo(s * 0.3, 0); c.quadraticCurveTo(s * 0.62, -s * 0.06, s * 0.6, -s * 0.18); c.lineTo(s * 0.34, -s * 0.06); c.fill(); c.fillStyle = '#7DD3FC'; circ(c, -s * 0.1, -s * 0.02, s * 0.1, '#7DD3FC'); c.strokeStyle = '#1E293B'; c.beginPath(); c.moveTo(0, -s * 0.24); c.lineTo(0, -s * 0.33); c.stroke(); }); }
  }), 'tap', 0.45);

  boot('dragonfly', flappy({
    gap: 0.47, wall: ['#15803D', '#166534', '#14532D'], cap: '#22C55E', trail: false, winCols: ['#67E8F9', '#FFFFFF'],
    bg: function (c, W, H) { c.fillStyle = lg(c, 0, 0, 0, H, ['#BAE6FD', '#A5F3FC', '#5EEAD4']); c.fillRect(0, 0, W, H); for (var q = 0; q < (A_lite() ? 6 : 14); q++) { c.globalAlpha = 0.14; circ(c, Math.random() * W, Math.random() * H, rnd(4, 12), '#fff'); } c.globalAlpha = 1; },
    player: function (d, s) { return mkc(s * 1.3, s, d, function (c, w, h) { c.translate(w / 2, h / 2); c.fillStyle = 'rgba(103,232,249,.5)'; c.beginPath(); c.ellipse(-s * 0.1, -s * 0.18, s * 0.26, s * 0.1, -0.5, 0, TAU); c.fill(); c.beginPath(); c.ellipse(s * 0.1, -s * 0.18, s * 0.26, s * 0.1, 0.5, 0, TAU); c.fill(); c.beginPath(); c.ellipse(-s * 0.12, s * 0.02, s * 0.22, s * 0.08, 0.4, 0, TAU); c.fill(); c.beginPath(); c.ellipse(s * 0.12, s * 0.02, s * 0.22, s * 0.08, -0.4, 0, TAU); c.fill(); c.fillStyle = lg(c, -s * 0.3, 0, s * 0.4, 0, ['#06B6D4', '#0E7490']); rr(c, -s * 0.36, -s * 0.06, s * 0.72, s * 0.12, s * 0.06); c.fill(); circ(c, s * 0.34, 0, s * 0.1, '#0891B2'); c.fillStyle = '#A5F3FC'; circ(c, s * 0.36, -s * 0.02, s * 0.04, '#A5F3FC'); }); }
  }), 'tap', 0.45);

  boot('paperplane', flappy({
    gap: 0.48, wall: ['#A16207', '#854D0E', '#713F12'], cap: '#CA8A04', trail: false, winCols: ['#FDE68A', '#FFFFFF'],
    bg: function (c, W, H) { c.fillStyle = lg(c, 0, 0, 0, H, ['#E0F2FE', '#BAE6FD', '#7DD3FC']); c.fillRect(0, 0, W, H); for (var q = 0; q < (A_lite() ? 5 : 10); q++) { c.globalAlpha = 0.6; circ(c, rnd(0, W), rnd(0, H * 0.6), rnd(16, 28), 'rgba(255,255,255,.7)'); } c.globalAlpha = 1; },
    player: function (d, s) { return mkc(s * 1.2, s, d, function (c, w, h) { c.translate(w / 2, h / 2); c.fillStyle = '#F1F5F9'; c.beginPath(); c.moveTo(s * 0.5, 0); c.lineTo(-s * 0.4, -s * 0.3); c.lineTo(-s * 0.2, 0); c.lineTo(-s * 0.4, s * 0.3); c.closePath(); c.fill(); c.fillStyle = '#CBD5E1'; c.beginPath(); c.moveTo(s * 0.5, 0); c.lineTo(-s * 0.2, 0); c.lineTo(-s * 0.4, s * 0.3); c.closePath(); c.fill(); c.strokeStyle = '#94A3B8'; c.lineWidth = 1; c.beginPath(); c.moveTo(s * 0.5, 0); c.lineTo(-s * 0.2, 0); c.stroke(); }); }
  }), 'tap', 0.45);

  boot('snowcatch', catcher({
    winCols: ['#BAE6FD', '#FFFFFF'], ring: '#BAE6FD',
    bg: function (c, W, H, T, py) { c.fillStyle = lg(c, 0, 0, 0, H, ['#1E3A8A', '#1E40AF', '#3B82F6']); c.fillRect(0, 0, W, H); for (var s = 0; s < (A_lite() ? 16 : 40); s++) { c.globalAlpha = 0.4 + Math.random() * 0.4; circ(c, Math.random() * W, Math.random() * py, rnd(1, 3), '#fff'); } c.globalAlpha = 1; c.fillStyle = '#F8FAFC'; c.beginPath(); c.moveTo(0, py); for (var x = 0; x <= W; x += W / 6) c.lineTo(x, py - 8 - Math.abs(Math.sin(x * 0.02)) * 8); c.lineTo(W, H); c.lineTo(0, H); c.fill(); },
    basket: function (c, px, py, bw, bh) { woodBasket(c, px, py, bw, bh); },
    good: [function (d, s) { return snowflakeS(d, s); }, function (d, s) { return starS(d, s, '#BAE6FD'); }],
    bad: [function (d, s) { return icicleS(d, s); }]
  }), 'drag', 0.5);

  boot('tacocatch', catcher({
    winCols: ['#FDE68A', '#86EFAC', '#FFFFFF'], ring: '#FDE047',
    bg: function (c, W, H, T, py) { c.fillStyle = lg(c, 0, 0, 0, H, ['#FDE68A', '#FB923C', '#DC2626']); c.fillRect(0, 0, W, H); c.fillStyle = 'rgba(146,64,14,.2)'; for (var q = 0; q < 7; q++) c.fillRect(0, (q * 52) % py, W, 3); c.fillStyle = lg(c, 0, py - 8, 0, H, ['#92400E', '#451A03']); c.fillRect(0, py - 8, W, H - py + 8); },
    basket: function (c, px, py, bw, bh) { plateBasket(c, px, py, bw, bh); },
    good: [function (d, s) { return tacoS(d, s); }, function (d, s) { return chiliPepS(d, s); }],
    bad: [function (d, s) { return bombS(d, s); }]
  }), 'drag', 0.5);

  boot('fruitpunch', catcher({
    winCols: ['#F87171', '#FDE047', '#86EFAC'], ring: '#F87171',
    bg: function (c, W, H, T, py) { c.fillStyle = lg(c, 0, 0, 0, H, ['#FDE047', '#4ADE80', '#15803D']); c.fillRect(0, 0, W, H); c.fillStyle = 'rgba(21,128,61,.3)'; for (var q = 0; q < 4; q++) circ(c, (q + 0.5) * W / 4, T + 16, rnd(20, 36), 'rgba(22,163,74,.35)'); c.fillStyle = lg(c, 0, py - 8, 0, H, ['#166534', '#14532D']); c.fillRect(0, py - 8, W, H - py + 8); },
    basket: function (c, px, py, bw, bh) { woodBasket(c, px, py, bw, bh); },
    good: [function (d, s) { return appleS(d, s, ['#FB923C', '#EA580C']); }, function (d, s) { return watermelonS(d, s); }],
    bad: [function (d, s) { return chiliS(d, s); }]
  }), 'drag', 0.5);

  /* ---- sprites vague 6 ---- */
  function snowflakeS(d, s) { return mkc(s, s, d, function (c, w) { c.translate(w / 2, w / 2); c.strokeStyle = '#E0F2FE'; c.lineWidth = s * 0.05; c.lineCap = 'round'; for (var k = 0; k < 6; k++) { var a = k / 6 * TAU; c.save(); c.rotate(a); c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -s * 0.34); c.moveTo(0, -s * 0.2); c.lineTo(-s * 0.1, -s * 0.28); c.moveTo(0, -s * 0.2); c.lineTo(s * 0.1, -s * 0.28); c.stroke(); c.restore(); } circ(c, 0, 0, s * 0.06, '#fff'); }); }
  function icicleS(d, s) { return mkc(s, s, d, function (c, w) { c.translate(w / 2, w / 2); c.fillStyle = lg(c, 0, -s * 0.4, 0, s * 0.4, ['#E0F2FE', '#7DD3FC', '#0EA5E9']); c.beginPath(); c.moveTo(-s * 0.14, -s * 0.4); c.lineTo(s * 0.14, -s * 0.4); c.lineTo(0, s * 0.42); c.closePath(); c.fill(); c.fillStyle = 'rgba(255,255,255,.5)'; c.beginPath(); c.moveTo(-s * 0.06, -s * 0.36); c.lineTo(0, -s * 0.36); c.lineTo(-s * 0.02, s * 0.1); c.fill(); }); }
  function tacoS(d, s) { return mkc(s, s, d, function (c, w) { c.translate(w / 2, w / 2); c.fillStyle = lg(c, 0, -s * 0.2, 0, s * 0.3, ['#FDE047', '#D97706']); c.beginPath(); c.arc(0, s * 0.05, s * 0.36, Math.PI, 0); c.lineTo(s * 0.36, s * 0.14); c.lineTo(-s * 0.36, s * 0.14); c.fill(); c.fillStyle = '#4ADE80'; c.beginPath(); c.arc(0, s * 0.03, s * 0.3, Math.PI, 0); c.fill(); c.fillStyle = '#DC2626'; circ(c, -s * 0.12, -s * 0.06, s * 0.06, '#DC2626'); circ(c, s * 0.1, -s * 0.04, s * 0.05, '#DC2626'); c.fillStyle = '#FDE047'; circ(c, 0, -s * 0.1, s * 0.04, '#FDE047'); c.fillStyle = '#92400E'; circ(c, -s * 0.02, -s * 0.02, s * 0.04, '#92400E'); }); }
  function chiliPepS(d, s) { return mkc(s, s, d, function (c, w) { c.translate(w / 2, w / 2); c.rotate(-0.4); c.fillStyle = lg(c, -s * 0.1, 0, s * 0.1, 0, ['#4ADE80', '#16A34A', '#166534']); c.beginPath(); c.moveTo(0, -s * 0.3); c.quadraticCurveTo(s * 0.22, -s * 0.05, s * 0.06, s * 0.36); c.quadraticCurveTo(-s * 0.08, s * 0.05, 0, -s * 0.3); c.fill(); c.fillStyle = '#15803D'; c.beginPath(); c.moveTo(0, -s * 0.3); c.lineTo(s * 0.08, -s * 0.42); c.lineTo(-s * 0.04, -s * 0.36); c.fill(); }); }
  function watermelonS(d, s) { return mkc(s, s, d, function (c, w) { c.translate(w / 2, w / 2); c.fillStyle = lg(c, 0, -s * 0.3, 0, s * 0.1, ['#F87171', '#DC2626']); c.beginPath(); c.arc(0, 0, s * 0.34, Math.PI, 0); c.fill(); c.fillStyle = '#FFF7ED'; c.beginPath(); c.arc(0, 0, s * 0.34, Math.PI, 0); c.lineTo(s * 0.3, 0); c.arc(0, 0, s * 0.3, 0, Math.PI, true); c.fill(); c.fillStyle = '#16A34A'; c.beginPath(); c.arc(0, 0, s * 0.38, Math.PI, 0); c.lineTo(s * 0.34, 0); c.arc(0, 0, s * 0.34, 0, Math.PI, true); c.fill(); c.fillStyle = '#1C1917'; for (var k = -2; k <= 2; k++) { c.beginPath(); c.ellipse(k * s * 0.1, -s * 0.12, s * 0.02, s * 0.04, 0, 0, TAU); c.fill(); } }); }
  /* ===== vague 7 : 2 « vol » (OVNI, mouette) + 1 « esquive » (pluie) + 3 « attrape » (café, burger, sushi) ===== */
  boot('ufoflight', flappy({
    gap: 0.47, wall: ['#4C1D95', '#2E1065', '#1E1B4B'], cap: '#7C3AED', trail: false, winCols: ['#A5F3FC', '#86EFAC'],
    bg: function (c, W, H) { c.fillStyle = lg(c, 0, 0, 0, H, ['#020617', '#1E1B4B', '#2E1065']); c.fillRect(0, 0, W, H); stars(c, W, H, A_lite() ? 25 : 60, 0, H); },
    player: function (d, s) { return mkc(s * 1.4, s, d, function (c, w, h) { c.translate(w / 2, h / 2); c.fillStyle = lg(c, 0, -s * 0.3, 0, 0, ['#A5F3FC', '#22D3EE']); c.beginPath(); c.ellipse(0, -s * 0.12, s * 0.22, s * 0.18, 0, Math.PI, 0, true); c.fill(); c.fillStyle = lg(c, 0, -s * 0.1, 0, s * 0.1, ['#E2E8F0', '#64748B']); c.beginPath(); c.ellipse(0, 0, s * 0.5, s * 0.16, 0, 0, TAU); c.fill(); c.fillStyle = '#86EFAC'; for (var k = -2; k <= 2; k++) circ(c, k * s * 0.18, s * 0.08, s * 0.04, '#86EFAC'); c.fillStyle = 'rgba(134,239,172,.3)'; c.beginPath(); c.moveTo(-s * 0.2, s * 0.1); c.lineTo(s * 0.2, s * 0.1); c.lineTo(s * 0.34, s * 0.44); c.lineTo(-s * 0.34, s * 0.44); c.fill(); }); }
  }), 'tap', 0.45);

  boot('seagull', flappy({
    gap: 0.48, wall: ['#A16207', '#854D0E', '#713F12'], cap: '#CA8A04', trail: false, winCols: ['#7DD3FC', '#FFFFFF'],
    bg: function (c, W, H) { c.fillStyle = lg(c, 0, 0, 0, H, ['#7DD3FC', '#BAE6FD', '#FDE68A']); c.fillRect(0, 0, W, H); c.fillStyle = rg(c, W * 0.5, H * 0.85, W * 0.5, ['#FEF3C7', 'rgba(254,243,199,0)']); c.fillRect(0, H * 0.5, W, H * 0.5); for (var q = 0; q < (A_lite() ? 4 : 9); q++) { c.globalAlpha = 0.5; circ(c, rnd(0, W), rnd(0, H * 0.5), rnd(14, 24), 'rgba(255,255,255,.6)'); } c.globalAlpha = 1; },
    player: function (d, s) { return mkc(s * 1.5, s, d, function (c, w, h) { c.translate(w / 2, h / 2); c.fillStyle = '#F8FAFC'; c.beginPath(); c.ellipse(0, 0, s * 0.3, s * 0.18, 0, 0, TAU); c.fill(); c.fillStyle = '#E2E8F0'; c.beginPath(); c.moveTo(-s * 0.1, 0); c.quadraticCurveTo(-s * 0.4, -s * 0.3, -s * 0.6, -s * 0.12); c.quadraticCurveTo(-s * 0.3, 0, -s * 0.1, 0); c.fill(); c.beginPath(); c.moveTo(s * 0.1, 0); c.quadraticCurveTo(s * 0.4, -s * 0.3, s * 0.6, -s * 0.12); c.quadraticCurveTo(s * 0.3, 0, s * 0.1, 0); c.fill(); c.fillStyle = '#F59E0B'; c.beginPath(); c.moveTo(s * 0.28, -s * 0.02); c.lineTo(s * 0.42, 0); c.lineTo(s * 0.28, s * 0.04); c.fill(); c.fillStyle = '#1C1917'; circ(c, s * 0.2, -s * 0.04, s * 0.03, '#1C1917'); }); }
  }), 'tap', 0.45);

  boot('raindash', dodger({
    lanes: 4, lineCol: 'rgba(255,255,255,.4)', winCols: ['#7DD3FC', '#FFFFFF'],
    bg: function (c, W, H, T, rx0, rx1) { c.fillStyle = lg(c, 0, 0, 0, H, ['#1E293B', '#334155', '#475569']); c.fillRect(0, 0, W, H); fieldLines(c, W, H, T, rx0, rx1, '#0F172A', '#64748B'); c.strokeStyle = 'rgba(191,219,254,.3)'; c.lineWidth = 1.5; for (var r = 0; r < (A_lite() ? 20 : 44); r++) { var x = Math.random() * W, y = Math.random() * H; c.beginPath(); c.moveTo(x, y); c.lineTo(x - 2, y + 10); c.stroke(); } },
    player: function (d, w, h) { return mkc(w + 8, h + 8, d, function (c, cw, ch) { c.translate(cw / 2, ch / 2); c.fillStyle = lg(c, 0, -h * 0.2, 0, h * 0.3, ['#F43F5E', '#B91C1C']); c.beginPath(); c.moveTo(0, -h * 0.4); c.quadraticCurveTo(w * 0.42, -h * 0.1, w * 0.42, -h * 0.08); c.lineTo(-w * 0.42, -h * 0.08); c.quadraticCurveTo(-w * 0.42, -h * 0.1, 0, -h * 0.4); c.fill(); c.strokeStyle = '#94A3B8'; c.lineWidth = 2; c.beginPath(); c.moveTo(0, -h * 0.4); c.lineTo(0, h * 0.1); c.stroke(); c.fillStyle = '#334155'; circ(c, 0, h * 0.12, w * 0.1, '#334155'); c.fillStyle = '#FBCFE8'; circ(c, 0, h * 0.28, w * 0.13, '#FBCFE8'); }); },
    obs: [function (d, w, h) { return puddleS(d, w, h); }, function (d, w, h) { return coneS(d, w, h); }]
  }), 'drag', 0.5);

  boot('coffeecatch', catcher({
    winCols: ['#FDE68A', '#FFFFFF'], ring: '#D97706',
    bg: function (c, W, H, T, py) { c.fillStyle = lg(c, 0, 0, 0, H, ['#78350F', '#92400E', '#451A03']); c.fillRect(0, 0, W, H); c.fillStyle = 'rgba(253,230,138,.1)'; for (var q = 0; q < 6; q++) c.fillRect(0, (q * 56) % py, W, 3); c.fillStyle = lg(c, 0, py - 8, 0, H, ['#3F2A12', '#1C1206']); c.fillRect(0, py - 8, W, H - py + 8); },
    basket: function (c, px, py, bw, bh) { woodBasket(c, px, py, bw, bh); },
    good: [function (d, s) { return coffeeS(d, s); }, function (d, s) { return donutS(d, s); }],
    bad: [function (d, s) { return chiliPepS(d, s); }]
  }), 'drag', 0.5);

  boot('burgercatch', catcher({
    winCols: ['#FDE68A', '#86EFAC', '#FFFFFF'], ring: '#F59E0B',
    bg: function (c, W, H, T, py) { c.fillStyle = lg(c, 0, 0, 0, H, ['#FDE68A', '#FB923C', '#B45309']); c.fillRect(0, 0, W, H); c.fillStyle = 'rgba(146,64,14,.18)'; for (var q = 0; q < 7; q++) c.fillRect(0, (q * 48) % py, W, 3); c.fillStyle = lg(c, 0, py - 8, 0, H, ['#92400E', '#451A03']); c.fillRect(0, py - 8, W, H - py + 8); },
    basket: function (c, px, py, bw, bh) { plateBasket(c, px, py, bw, bh); },
    good: [function (d, s) { return burgerS(d, s); }, function (d, s) { return friesS(d, s); }],
    bad: [function (d, s) { return chiliPepS(d, s); }]
  }), 'drag', 0.5);

  boot('sushicatch', catcher({
    winCols: ['#F87171', '#FFFFFF', '#1E293B'], ring: '#F87171',
    bg: function (c, W, H, T, py) { c.fillStyle = lg(c, 0, 0, 0, H, ['#FBCFE8', '#F9A8D4', '#BE185D']); c.fillRect(0, 0, W, H); c.fillStyle = 'rgba(190,24,93,.15)'; for (var q = 0; q < 5; q++) { c.save(); c.translate((q + 0.5) * W / 5, (q * 60) % py); c.rotate(0.3); c.fillRect(-2, -16, 4, 32); c.restore(); } c.fillStyle = lg(c, 0, py - 8, 0, H, ['#831843', '#500724']); c.fillRect(0, py - 8, W, H - py + 8); },
    basket: function (c, px, py, bw, bh) { woodBasket(c, px, py, bw, bh); },
    good: [function (d, s) { return sushiS(d, s); }, function (d, s) { return sushiS(d, s, true); }],
    bad: [function (d, s) { return chiliPepS(d, s); }]
  }), 'drag', 0.5);

  /* ---- sprites vague 7 ---- */
  function puddleS(d, w, h) { return mkc(w + 6, h + 6, d, function (c, cw, ch) { c.translate(cw / 2, ch / 2); c.fillStyle = lg(c, 0, -h * 0.1, 0, h * 0.2, ['#60A5FA', '#2563EB', '#1E3A8A']); c.beginPath(); c.ellipse(0, 0, w * 0.46, h * 0.26, 0, 0, TAU); c.fill(); c.strokeStyle = 'rgba(255,255,255,.4)'; c.lineWidth = 1.5; c.beginPath(); c.ellipse(0, 0, w * 0.3, h * 0.16, 0, 0, TAU); c.stroke(); c.fillStyle = 'rgba(255,255,255,.5)'; circ(c, -w * 0.1, -h * 0.04, w * 0.04, 'rgba(255,255,255,.5)'); }); }
  function coffeeS(d, s) { return mkc(s, s, d, function (c, w) { c.translate(w / 2, w / 2); c.fillStyle = '#F1F5F9'; rr(c, -s * 0.22, -s * 0.18, s * 0.44, s * 0.5, s * 0.06); c.fill(); c.fillStyle = lg(c, 0, -s * 0.36, 0, -s * 0.18, ['#DC2626', '#991B1B']); rr(c, -s * 0.24, -s * 0.36, s * 0.48, s * 0.2, s * 0.05); c.fill(); c.fillStyle = '#FFF7ED'; rr(c, -s * 0.24, -s * 0.42, s * 0.48, s * 0.1, 3); c.fill(); c.fillStyle = '#92400E'; circ(c, 0, -s * 0.26, s * 0.08, '#92400E'); c.strokeStyle = 'rgba(255,255,255,.5)'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(-s * 0.06, 0); c.lineTo(s * 0.06, s * 0.2); c.stroke(); }); }
  function burgerS(d, s) { return mkc(s, s, d, function (c, w) { c.translate(w / 2, w / 2); c.fillStyle = lg(c, 0, -s * 0.3, 0, -s * 0.1, ['#FBbf24', '#D97706']); c.beginPath(); c.arc(0, -s * 0.08, s * 0.34, Math.PI, 0); c.fill(); c.fillStyle = '#FDE047'; for (var k = -2; k <= 2; k++) circ(c, k * s * 0.1, -s * 0.2, s * 0.02, '#FFF7ED'); c.fillStyle = '#4ADE80'; c.beginPath(); c.moveTo(-s * 0.34, -s * 0.06); c.quadraticCurveTo(0, s * 0.02, s * 0.34, -s * 0.06); c.lineTo(s * 0.32, 0); c.quadraticCurveTo(0, s * 0.06, -s * 0.32, 0); c.fill(); c.fillStyle = '#92400E'; rr(c, -s * 0.32, -s * 0.02, s * 0.64, s * 0.14, s * 0.04); c.fill(); c.fillStyle = '#F87171'; c.fillRect(-s * 0.3, s * 0.1, s * 0.6, s * 0.04); c.fillStyle = '#D97706'; c.beginPath(); c.arc(0, s * 0.14, s * 0.32, 0, Math.PI); c.fill(); }); }
  function friesS(d, s) { return mkc(s, s, d, function (c, w) { c.translate(w / 2, w / 2); c.fillStyle = '#DC2626'; c.beginPath(); c.moveTo(-s * 0.2, s * 0.05); c.lineTo(s * 0.2, s * 0.05); c.lineTo(s * 0.14, s * 0.38); c.lineTo(-s * 0.14, s * 0.38); c.fill(); c.fillStyle = '#FBBF24'; for (var k = -2; k <= 2; k++) c.fillRect(k * s * 0.08 - s * 0.03, -s * 0.38, s * 0.06, s * 0.5); c.fillStyle = '#FFF7ED'; c.fillRect(-s * 0.2, s * 0.05, s * 0.4, s * 0.06); }); }
  function sushiS(d, s, salmon) { return mkc(s, s, d, function (c, w) { c.translate(w / 2, w / 2); c.fillStyle = '#F8FAFC'; c.beginPath(); c.ellipse(0, s * 0.06, s * 0.3, s * 0.2, 0, 0, TAU); c.fill(); c.fillStyle = '#1E293B'; rr(c, -s * 0.3, -s * 0.06, s * 0.6, s * 0.24, 3); c.fill(); c.fillStyle = '#F8FAFC'; c.beginPath(); c.ellipse(0, s * 0.06, s * 0.22, s * 0.14, 0, 0, TAU); c.fill(); c.fillStyle = salmon ? '#FB923C' : '#F87171'; c.beginPath(); c.ellipse(0, -s * 0.12, s * 0.26, s * 0.12, 0, 0, TAU); c.fill(); if (salmon) { c.strokeStyle = 'rgba(255,255,255,.6)'; c.lineWidth = 1.5; for (var k = -1; k <= 1; k++) { c.beginPath(); c.moveTo(k * s * 0.14, -s * 0.2); c.lineTo(k * s * 0.14, -s * 0.04); c.stroke(); } } }); }
  /* ===== vague 8 : 2 « vol » (abeille, luciole) + 1 « esquive » (métro) + 3 « attrape » (glace, popcorn, légumes) ===== */
  boot('beefly', flappy({
    gap: 0.47, wall: ['#16A34A', '#15803D', '#14532D'], cap: '#22C55E', trail: false, winCols: ['#FDE047', '#FFFFFF'],
    bg: function (c, W, H) { c.fillStyle = lg(c, 0, 0, 0, H, ['#BAE6FD', '#DCFCE7', '#FEF9C3']); c.fillRect(0, 0, W, H); for (var q = 0; q < (A_lite() ? 5 : 11); q++) { c.globalAlpha = 0.5; circ(c, rnd(0, W), rnd(0, H * 0.6), rnd(12, 22), 'rgba(255,255,255,.6)'); } c.globalAlpha = 1; },
    player: function (d, s) { return mkc(s * 1.3, s, d, function (c, w, h) { c.translate(w / 2, h / 2); c.fillStyle = 'rgba(255,255,255,.55)'; c.beginPath(); c.ellipse(-s * 0.08, -s * 0.2, s * 0.2, s * 0.1, -0.4, 0, TAU); c.fill(); c.beginPath(); c.ellipse(s * 0.08, -s * 0.2, s * 0.2, s * 0.1, 0.4, 0, TAU); c.fill(); c.fillStyle = '#FACC15'; c.beginPath(); c.ellipse(0, s * 0.02, s * 0.32, s * 0.22, 0, 0, TAU); c.fill(); c.fillStyle = '#1C1917'; for (var b = -1; b <= 1; b++) c.fillRect(b * s * 0.14 - s * 0.04, s * 0.02 - s * 0.18, s * 0.08, s * 0.36); c.fillStyle = '#1C1917'; circ(c, s * 0.26, -s * 0.04, s * 0.12, '#1C1917'); c.fillStyle = '#fff'; circ(c, s * 0.3, -s * 0.06, s * 0.04, '#fff'); }); }
  }), 'tap', 0.45);

  boot('fireflylight', flappy({
    gap: 0.46, wall: ['#1E3A8A', '#1E1B4B', '#020617'], cap: '#3730A3', trail: false, winCols: ['#FDE047', '#FEF9C3'],
    bg: function (c, W, H) { c.fillStyle = lg(c, 0, 0, 0, H, ['#020617', '#0F172A', '#1E1B4B']); c.fillRect(0, 0, W, H); for (var q = 0; q < (A_lite() ? 10 : 24); q++) { c.globalAlpha = 0.3 + Math.random() * 0.4; circ(c, Math.random() * W, Math.random() * H, rnd(1, 2.5), '#FDE047'); } c.globalAlpha = 1; },
    player: function (d, s) { return mkc(s * 1.1, s, d, function (c, w, h) { c.translate(w / 2, h / 2); c.fillStyle = rg(c, 0, s * 0.1, s * 0.5, ['rgba(253,224,71,.6)', 'rgba(253,224,71,0)']); circ(c, 0, s * 0.1, s * 0.5, c.fillStyle); c.fillStyle = '#44403C'; c.beginPath(); c.ellipse(0, -s * 0.08, s * 0.16, s * 0.2, 0, 0, TAU); c.fill(); c.fillStyle = 'rgba(255,255,255,.4)'; c.beginPath(); c.ellipse(-s * 0.1, -s * 0.1, s * 0.12, s * 0.07, -0.4, 0, TAU); c.fill(); c.beginPath(); c.ellipse(s * 0.1, -s * 0.1, s * 0.12, s * 0.07, 0.4, 0, TAU); c.fill(); c.fillStyle = '#FDE047'; circ(c, 0, s * 0.18, s * 0.12, '#FEF08A'); circ(c, 0, s * 0.18, s * 0.07, '#FDE047'); }); }
  }), 'tap', 0.45);

  boot('subwaydash', dodger({
    lanes: 4, lineCol: 'rgba(253,230,138,.5)', winCols: ['#FDE68A', '#67E8F9'],
    bg: function (c, W, H, T, rx0, rx1) { c.fillStyle = lg(c, 0, 0, 0, H, ['#1E293B', '#0F172A', '#020617']); c.fillRect(0, 0, W, H); fieldLines(c, W, H, T, rx0, rx1, '#422006', '#78350F'); c.strokeStyle = 'rgba(100,116,139,.4)'; c.lineWidth = 3; for (var ln = 1; ln < 4; ln++) { var lx = rx0 + (rx1 - rx0) * ln / 4; c.beginPath(); c.moveTo(lx - 5, 0); c.lineTo(lx - 5, H); c.moveTo(lx + 5, 0); c.lineTo(lx + 5, H); c.stroke(); } },
    player: function (d, w, h) { return mkc(w + 8, h + 8, d, function (c, cw, ch) { c.translate(cw / 2, ch / 2); c.fillStyle = '#0F172A'; circ(c, 0, h * 0.34, w * 0.16, '#0F172A'); circ(c, 0, -h * 0.3, w * 0.13, '#0F172A'); c.strokeStyle = '#F59E0B'; c.lineWidth = w * 0.12; c.lineCap = 'round'; c.beginPath(); c.moveTo(0, h * 0.34); c.lineTo(0, -h * 0.24); c.stroke(); c.fillStyle = '#DC2626'; rr(c, -w * 0.16, -h * 0.08, w * 0.32, h * 0.2, w * 0.06); c.fill(); c.fillStyle = '#FBCFE8'; circ(c, 0, -h * 0.4, w * 0.14, '#FBCFE8'); c.fillStyle = '#1E3A8A'; c.beginPath(); c.arc(0, -h * 0.42, w * 0.16, Math.PI, 0); c.fill(); }); },
    obs: [function (d, w, h) { return subwayTrain(d, w, h); }, function (d, w, h) { return coneS(d, w, h); }]
  }), 'drag', 0.5);

  boot('icecreamcatch', catcher({
    winCols: ['#F9A8D4', '#67E8F9', '#FFFFFF'], ring: '#F9A8D4',
    bg: function (c, W, H, T, py) { c.fillStyle = lg(c, 0, 0, 0, H, ['#A5F3FC', '#FBCFE8', '#FDE68A']); c.fillRect(0, 0, W, H); c.fillStyle = 'rgba(255,255,255,.2)'; for (var q = 0; q < 6; q++) circ(c, (q + 0.5) * W / 6, (q * 60) % py, rnd(8, 16), 'rgba(255,255,255,.3)'); c.fillStyle = lg(c, 0, py - 8, 0, H, ['#F472B6', '#9D174D']); c.fillRect(0, py - 8, W, H - py + 8); },
    basket: function (c, px, py, bw, bh) { woodBasket(c, px, py, bw, bh); },
    good: [function (d, s) { return iceCreamS(d, s, '#FBCFE8'); }, function (d, s) { return iceCreamS(d, s, '#A5F3FC'); }],
    bad: [function (d, s) { return chiliS(d, s); }]
  }), 'drag', 0.5);

  boot('popcorncatch', catcher({
    winCols: ['#FDE68A', '#FFFFFF', '#F87171'], ring: '#FDE68A',
    bg: function (c, W, H, T, py) { c.fillStyle = lg(c, 0, 0, 0, H, ['#DC2626', '#991B1B', '#450A0A']); c.fillRect(0, 0, W, H); c.fillStyle = 'rgba(255,255,255,.12)'; for (var q = 0; q < 8; q++) c.fillRect((q + 0.5) * W / 8 - 6, 0, 12, H); c.fillStyle = lg(c, 0, py - 8, 0, H, ['#FDE047', '#B45309']); c.fillRect(0, py - 8, W, H - py + 8); },
    basket: function (c, px, py, bw, bh) { popcornBox(c, px, py, bw, bh); },
    good: [function (d, s) { return popcornS(d, s); }, function (d, s) { return popcornS(d, s, true); }],
    bad: [function (d, s) { return chiliPepS(d, s); }]
  }), 'drag', 0.5);

  boot('veggiecatch', catcher({
    winCols: ['#4ADE80', '#FB923C', '#FFFFFF'], ring: '#4ADE80',
    bg: function (c, W, H, T, py) { c.fillStyle = lg(c, 0, 0, 0, H, ['#BAE6FD', '#DCFCE7', '#86EFAC']); c.fillRect(0, 0, W, H); c.fillStyle = '#15803D'; c.fillRect(0, py - 8, W, H - py + 8); c.fillStyle = 'rgba(21,128,61,.3)'; for (var q = 0; q < 4; q++) c.fillRect((q + 0.3) * W / 4, py - (H - T) * 0.05, 4, (H - T) * 0.05); },
    basket: function (c, px, py, bw, bh) { woodBasket(c, px, py, bw, bh); },
    good: [function (d, s) { return carrotS(d, s); }, function (d, s) { return tomatoS(d, s); }],
    bad: [function (d, s) { return chiliPepS(d, s); }]
  }), 'drag', 0.5);

  /* ---- sprites vague 8 ---- */
  function subwayTrain(d, w, h) { return mkc(w + 6, h + 6, d, function (c, cw, ch) { c.translate(cw / 2, ch / 2); c.fillStyle = lg(c, -w / 2, 0, w / 2, 0, ['#FBBF24', '#D97706', '#92400E']); rr(c, -w * 0.38, -h * 0.46, w * 0.76, h * 0.92, w * 0.14); c.fill(); c.fillStyle = '#1E293B'; rr(c, -w * 0.28, -h * 0.4, w * 0.56, h * 0.2, w * 0.06); c.fill(); for (var k = -1; k <= 1; k++) { c.fillStyle = 'rgba(15,23,42,.6)'; rr(c, -w * 0.28 + (k + 1) * w * 0.2, -h * 0.1, w * 0.16, h * 0.3, 3); c.fill(); } c.fillStyle = '#F87171'; circ(c, -w * 0.22, h * 0.36, w * 0.06, '#F87171'); circ(c, w * 0.22, h * 0.36, w * 0.06, '#F87171'); }); }
  function iceCreamS(d, s, col) { return mkc(s, s, d, function (c, w) { c.translate(w / 2, w / 2); c.fillStyle = lg(c, 0, s * 0.02, 0, s * 0.42, ['#F59E0B', '#92400E']); c.beginPath(); c.moveTo(-s * 0.16, s * 0.02); c.lineTo(s * 0.16, s * 0.02); c.lineTo(0, s * 0.44); c.closePath(); c.fill(); c.strokeStyle = 'rgba(69,26,3,.4)'; c.lineWidth = 1; c.beginPath(); c.moveTo(-s * 0.12, s * 0.1); c.lineTo(s * 0.1, s * 0.22); c.moveTo(s * 0.12, s * 0.1); c.lineTo(-s * 0.1, s * 0.22); c.stroke(); c.fillStyle = col; circ(c, -s * 0.1, -s * 0.06, s * 0.16, col); circ(c, s * 0.1, -s * 0.06, s * 0.16, col); circ(c, 0, -s * 0.2, s * 0.17, col); c.fillStyle = '#DC2626'; circ(c, 0, -s * 0.34, s * 0.05, '#DC2626'); }); }
  function popcornBox(c, px, py, bw, bh) { var bx = px - bw / 2, byTop = py - bh * 0.5; c.fillStyle = 'rgba(0,0,0,.2)'; c.beginPath(); c.ellipse(px, byTop + bh, bw * 0.5, bh * 0.16, 0, 0, TAU); c.fill(); c.fillStyle = '#F8FAFC'; c.beginPath(); c.moveTo(bx + bw * 0.08, byTop); c.lineTo(bx + bw * 0.92, byTop); c.lineTo(bx + bw * 0.82, byTop + bh); c.lineTo(bx + bw * 0.18, byTop + bh); c.closePath(); c.fill(); c.fillStyle = '#DC2626'; for (var k = 0; k < 5; k++) c.fillRect(bx + bw * (0.1 + k * 0.18), byTop, bw * 0.08, bh); c.fillStyle = '#FDE047'; for (var p = 0; p < 5; p++) circ(c, bx + bw * (0.2 + p * 0.15), byTop - 2, bw * 0.06, '#FDE047'); }
  function popcornS(d, s, yellow) { return mkc(s, s, d, function (c, w) { c.translate(w / 2, w / 2); c.fillStyle = yellow ? '#FDE047' : '#FFF7ED'; var pts = [[0, -s * 0.2], [s * 0.18, -s * 0.1], [s * 0.2, s * 0.12], [0, s * 0.22], [-s * 0.2, s * 0.1], [-s * 0.18, -s * 0.12]]; pts.forEach(function (p) { circ(c, p[0], p[1], s * 0.14, c.fillStyle); }); circ(c, 0, 0, s * 0.16, c.fillStyle); c.fillStyle = yellow ? '#EAB308' : '#FDE68A'; circ(c, -s * 0.06, -s * 0.04, s * 0.05, c.fillStyle); }); }
  function carrotS(d, s) { return mkc(s, s, d, function (c, w) { c.translate(w / 2, w / 2); c.fillStyle = lg(c, 0, -s * 0.1, 0, s * 0.4, ['#FB923C', '#EA580C']); c.beginPath(); c.moveTo(-s * 0.14, -s * 0.1); c.lineTo(s * 0.14, -s * 0.1); c.lineTo(0, s * 0.42); c.closePath(); c.fill(); c.strokeStyle = 'rgba(194,65,12,.5)'; c.lineWidth = 1; for (var k = 0; k < 3; k++) { c.beginPath(); c.moveTo(-s * 0.1 + k * s * 0.1, 0 + k * s * 0.08); c.lineTo(-s * 0.04 + k * s * 0.1, s * 0.04 + k * s * 0.08); c.stroke(); } c.fillStyle = '#16A34A'; for (var g = -1; g <= 1; g++) { c.beginPath(); c.moveTo(g * s * 0.08, -s * 0.1); c.lineTo(g * s * 0.14, -s * 0.34); c.lineTo(g * s * 0.08 + s * 0.04, -s * 0.1); c.fill(); } }); }
  function tomatoS(d, s) { return mkc(s, s, d, function (c, w) { c.translate(w / 2, w / 2); c.fillStyle = lg(c, -s * 0.2, -s * 0.2, s * 0.3, s * 0.3, ['#F87171', '#DC2626', '#991B1B']); circ(c, 0, s * 0.04, s * 0.32, c.fillStyle); c.fillStyle = '#16A34A'; for (var k = 0; k < 5; k++) { var a = k / 5 * TAU - Math.PI / 2; c.beginPath(); c.moveTo(0, -s * 0.24); c.lineTo(Math.cos(a) * s * 0.12, -s * 0.24 + Math.sin(a) * s * 0.08); c.lineTo(0, -s * 0.16); c.fill(); } c.fillStyle = 'rgba(255,255,255,.35)'; circ(c, -s * 0.12, -s * 0.06, s * 0.08, 'rgba(255,255,255,.4)'); }); }
})(window.D6 = window.D6 || {});
