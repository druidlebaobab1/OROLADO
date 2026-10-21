/* v2900 — "You're in control" group 9 (owner request, round 5 games: racing & reflexes) — PENGUIN SLIDE, SNOWBOARD JUMP, SURF RIDER and JET SKI RACE.
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
    penguinslide: {
      en: ['Hold to dive down the slopes', 'Caught by the snowball!', 'The ice cracks!', 'Your penguin slides over snowy hills while a giant snowball rolls behind. Hold your finger down to press into the downhill slopes and gain speed, release to fly off the tops. Landing smoothly on a downhill keeps your speed. The snowball catching you ends the round.'],
      fr: ['Maintiens pour plonger dans les pentes', 'Rattrapé par la boule de neige !', 'La glace craque !', 'Ton pingouin glisse sur des collines enneigées et une boule de neige géante le poursuit. Garde le doigt posé pour appuyer dans les descentes et prendre de la vitesse, lâche pour t’envoler des sommets. Atterrir en douceur dans une descente garde ta vitesse. Si la boule te rattrape, la partie est finie.'],
      es: ['Mantén para lanzarte cuesta abajo', '¡Te atrapó la bola de nieve!', '¡El hielo se rompe!', 'Tu pingüino se desliza por colinas nevadas mientras una bola de nieve gigante rueda detrás. Mantén el dedo para empujar en las bajadas y ganar velocidad, suelta para volar desde las cimas. Aterrizar suave en una bajada conserva la velocidad. Si la bola te alcanza, termina la ronda.'],
      pt: ['Segure para mergulhar nas descidas', 'A bola de neve te pegou!', 'O gelo racha!', 'Seu pinguim desliza por colinas nevadas enquanto uma bola de neve gigante rola atrás. Segure o dedo para pressionar nas descidas e ganhar velocidade, solte para voar dos topos. Pousar suave numa descida mantém a velocidade. Se a bola te alcançar, a rodada acaba.'],
      ar: ['اضغط للانزلاق بقوة في المنحدرات', 'أمسكت بك كرة الثلج!', 'الجليد يتشقق!', 'ينزلق البطريق على تلال ثلجية بينما تتدحرج خلفه كرة ثلج عملاقة. أبقِ إصبعك مضغوطًا للضغط في المنحدرات وزيادة السرعة، وأفلت للطيران من القمم. الهبوط بسلاسة على منحدر يحفظ سرعتك. إذا لحقت بك الكرة تنتهي الجولة.'],
      tr: ['Yokuş aşağı dalmak için bas', 'Kartopu yakaladı!', 'Buz çatlıyor!', 'Penguenin karlı tepelerde kayar, arkasından dev bir kartopu yuvarlanır. Hız kazanmak için inişlerde parmağını basılı tut, tepelerden uçmak için bırak. İnişe yumuşak konmak hızını korur. Kartopu seni yakalarsa tur biter.'],
      vi: ['Giữ để lao xuống dốc', 'Bị quả cầu tuyết đuổi kịp!', 'Băng nứt!', 'Chim cánh cụt trượt trên đồi tuyết, phía sau là quả cầu tuyết khổng lồ. Giữ ngón tay để ép xuống dốc và tăng tốc, thả ra để bay khỏi đỉnh. Đáp êm xuống dốc giúp giữ tốc độ. Bị quả cầu đuổi kịp là kết thúc ván.'],
      id: ['Tahan untuk menukik di turunan', 'Tertangkap bola salju!', 'Esnya retak!', 'Pinguinmu meluncur di bukit bersalju sementara bola salju raksasa menggelinding di belakang. Tahan jarimu untuk menekan di turunan dan menambah kecepatan, lepas untuk terbang dari puncak. Mendarat mulus di turunan menjaga kecepatan. Tertangkap bola salju mengakhiri ronde.'],
      ru: ['Держи — ныряй вниз по склонам', 'Снежный ком догнал!', 'Лёд треснул!', 'Пингвин скользит по снежным холмам, а сзади катится огромный снежный ком. Держи палец, чтобы прижиматься на спусках и разгоняться, отпусти, чтобы взлетать с вершин. Мягкая посадка на спуск сохраняет скорость. Если ком догонит, раунд окончен.'],
      de: ['Halten, um die Hänge hinabzutauchen', 'Vom Schneeball erwischt!', 'Das Eis bricht!', 'Dein Pinguin rutscht über verschneite Hügel, hinter ihm rollt ein riesiger Schneeball. Halte den Finger gedrückt, um dich in die Abfahrten zu drücken und Tempo zu holen, lass los, um von den Kuppen zu fliegen. Sanft in einer Abfahrt landen hält das Tempo. Holt dich der Schneeball ein, endet die Runde.'],
      hi: ['ढलान पर गोता लगाने को दबाएँ', 'बर्फ़ के गोले ने पकड़ लिया!', 'बर्फ़ टूट गई!', 'आपका पेंगुइन बर्फ़ीली पहाड़ियों पर फिसलता है और पीछे एक विशाल बर्फ़ का गोला लुढ़कता है। ढलानों पर दबकर रफ़्तार पाने के लिए उँगली दबाए रखें, चोटियों से उड़ने के लिए छोड़ें। ढलान पर आराम से उतरने से रफ़्तार बनी रहती है। गोले ने पकड़ा तो राउंड खत्म।'],
      zh: ['按住俯冲下坡', '被雪球追上了！', '冰面裂开了！', '小企鹅在雪山上滑行，身后一个巨大的雪球滚滚而来。按住手指压向下坡加速，松开从坡顶飞出。平稳落在下坡上能保持速度。被雪球追上，本回合结束。']
    },
    snowjump: {
      en: ['Tap to jump, hold in the air to flip', 'Wipeout!', 'Blizzard!', 'Your snowboarder rides down the mountain. Tap to jump over rocks and crevasses. Kickers launch you high: keep holding in the air to backflip, and release so the board lands flat. Landing crooked, hitting a rock or falling in a crevasse ends the round.', 'Fell in a crevasse!'],
      fr: ['Touche pour sauter, maintiens en l’air pour un salto', 'Gamelle !', 'Tempête de neige !', 'Ton snowboarder descend la montagne. Touche pour sauter les rochers et les crevasses. Les tremplins t’envoient haut : garde le doigt posé en l’air pour faire un salto arrière, et lâche pour que la planche atterrisse à plat. Atterrir de travers, heurter un rocher ou tomber dans une crevasse termine la partie.', 'Tombé dans une crevasse !'],
      es: ['Toca para saltar, mantén en el aire para girar', '¡Caída!', '¡Ventisca!', 'Tu snowboarder baja la montaña. Toca para saltar rocas y grietas. Los saltos te lanzan alto: mantén el dedo en el aire para hacer un mortal atrás y suelta para que la tabla caiga plana. Aterrizar torcido, chocar con una roca o caer en una grieta termina la ronda.', '¡Caíste en una grieta!'],
      pt: ['Toque para saltar, segure no ar para girar', 'Tombo!', 'Nevasca!', 'Seu snowboarder desce a montanha. Toque para saltar pedras e fendas. As rampas te lançam alto: segure no ar para dar um mortal para trás e solte para a prancha pousar reta. Pousar torto, bater numa pedra ou cair numa fenda encerra a rodada.', 'Caiu numa fenda!'],
      ar: ['المس للقفز واضغط في الهواء للدوران', 'سقوط!', 'عاصفة ثلجية!', 'ينزل المتزلج الجبل. المس للقفز فوق الصخور والشقوق. المنصات ترفعك عاليًا: أبقِ إصبعك في الهواء للشقلبة الخلفية وأفلت ليهبط اللوح مستويًا. الهبوط المائل أو الاصطدام بصخرة أو السقوط في شق ينهي الجولة.', 'سقطت في شق!'],
      tr: ['Zıplamak için dokun, havada takla için bas', 'Düştün!', 'Tipi!', 'Snowboardcun dağdan iner. Kayaların ve yarıkların üstünden zıplamak için dokun. Rampalar seni yükseğe fırlatır: havada geri takla için basılı tut, tahta düz insin diye bırak. Yamuk inmek, kayaya çarpmak ya da yarığa düşmek turu bitirir.', 'Yarığa düştün!'],
      vi: ['Chạm để nhảy, giữ trên không để lộn', 'Ngã nhào!', 'Bão tuyết!', 'Vận động viên trượt xuống núi. Chạm để nhảy qua đá và khe nứt. Bệ nhảy đưa bạn lên cao: giữ ngón tay trên không để lộn ngược, thả ra để ván đáp phẳng. Đáp lệch, va đá hoặc rơi xuống khe là kết thúc ván.', 'Rơi xuống khe nứt!'],
      id: ['Ketuk untuk lompat, tahan di udara untuk salto', 'Terjatuh!', 'Badai salju!', 'Pemain snowboard meluncur menuruni gunung. Ketuk untuk melompati batu dan celah. Ramp melontarkanmu tinggi: tahan di udara untuk salto ke belakang, lalu lepas agar papan mendarat datar. Mendarat miring, menabrak batu, atau jatuh ke celah mengakhiri ronde.', 'Jatuh ke celah!'],
      ru: ['Тап — прыжок, держи в воздухе — сальто', 'Падение!', 'Метель!', 'Сноубордист мчится с горы. Нажимай, чтобы перепрыгивать камни и трещины. Трамплины подбрасывают высоко: держи палец в воздухе для сальто назад и отпусти, чтобы доска приземлилась ровно. Кривое приземление, удар о камень или падение в трещину завершает раунд.', 'Упал в трещину!'],
      de: ['Tippen zum Springen, in der Luft halten für Salto', 'Sturz!', 'Schneesturm!', 'Dein Snowboarder fährt den Berg hinab. Tippe, um über Felsen und Spalten zu springen. Schanzen schleudern dich hoch: halte in der Luft gedrückt für einen Rückwärtssalto und lass los, damit das Brett flach landet. Schief landen, einen Felsen treffen oder in eine Spalte fallen beendet die Runde.', 'In eine Spalte gefallen!'],
      hi: ['कूदने को टैप, हवा में पलटने को दबाएँ', 'गिर गए!', 'बर्फ़ीला तूफ़ान!', 'आपका स्नोबोर्डर पहाड़ से नीचे आता है। चट्टानों और दरारों के ऊपर से कूदने को टैप करें। रैंप ऊँचा उछालते हैं: हवा में बैकफ़्लिप के लिए दबाए रखें, और छोड़ें ताकि बोर्ड सीधा उतरे। टेढ़ा उतरना, चट्टान से टकराना या दरार में गिरना राउंड खत्म करता है।', 'दरार में गिर गए!'],
      zh: ['点击跳跃，空中按住翻转', '摔倒了！', '暴风雪！', '你的单板滑雪者从山上滑下。点击跳过岩石和冰缝。跳台会把你弹得很高：在空中按住做后空翻，松开让滑板平稳落地。落地歪斜、撞到岩石或掉进冰缝，本回合结束。', '掉进冰缝了！']
    },
    surfrider: {
      en: ['Drag up or down to ride the wave', 'Wipeout!', 'Shark!', 'Your surfer rides along a giant wave. Drag up or down to move on the wave face and avoid the rocks, buoys, logs and jellyfish coming at you. They come faster and closer together. Hitting one ends the round.'],
      fr: ['Glisse en haut ou en bas sur la vague', 'Gamelle !', 'Requin !', 'Ton surfeur file sur une vague géante. Glisse vers le haut ou le bas pour te déplacer sur la vague et éviter les rochers, bouées, troncs et méduses qui arrivent. Ils arrivent de plus en plus vite et serrés. En toucher un termine la partie.'],
      es: ['Desliza arriba o abajo en la ola', '¡Revolcón!', '¡Tiburón!', 'Tu surfista corre por una ola gigante. Desliza arriba o abajo para moverte en la ola y esquivar rocas, boyas, troncos y medusas que se acercan. Llegan cada vez más rápido y más juntos. Chocar con uno termina la ronda.'],
      pt: ['Deslize para cima ou para baixo na onda', 'Vaca!', 'Tubarão!', 'Seu surfista corre numa onda gigante. Deslize para cima ou para baixo para se mover na onda e desviar de pedras, boias, troncos e águas-vivas. Eles vêm cada vez mais rápidos e juntos. Bater em um encerra a rodada.'],
      ar: ['اسحب لأعلى أو لأسفل على الموجة', 'سقوط!', 'قرش!', 'يركب المتزلج موجة عملاقة. اسحب لأعلى أو لأسفل للتحرك على وجه الموجة وتجنب الصخور والعوامات والجذوع وقناديل البحر القادمة. تأتي أسرع وأقرب. الاصطدام بأحدها ينهي الجولة.'],
      tr: ['Dalgada yukarı ya da aşağı kaydır', 'Düştün!', 'Köpekbalığı!', 'Sörfçün dev bir dalgada kayar. Dalga yüzünde hareket etmek ve gelen kayalardan, şamandıralardan, kütüklerden ve denizanalarından kaçmak için yukarı ya da aşağı kaydır. Gittikçe hızlanır ve sıklaşırlar. Birine çarpmak turu bitirir.'],
      vi: ['Kéo lên hoặc xuống để lướt sóng', 'Ngã nhào!', 'Cá mập!', 'Vận động viên lướt trên con sóng khổng lồ. Kéo lên hoặc xuống để di chuyển trên mặt sóng và né đá, phao, khúc gỗ và sứa đang lao tới. Chúng đến ngày càng nhanh và dày. Va vào một thứ là kết thúc ván.'],
      id: ['Geser naik atau turun di ombak', 'Terjatuh!', 'Hiu!', 'Peselancarmu meluncur di ombak raksasa. Geser naik atau turun untuk bergerak di muka ombak dan menghindari batu, pelampung, batang kayu, dan ubur-ubur yang datang. Mereka makin cepat dan rapat. Menabrak salah satunya mengakhiri ronde.'],
      ru: ['Веди вверх или вниз по волне', 'Падение!', 'Акула!', 'Сёрфер мчится по огромной волне. Веди вверх или вниз, чтобы двигаться по склону волны и уходить от камней, буёв, брёвен и медуз. Они летят всё быстрее и чаще. Столкновение завершает раунд.'],
      de: ['Hoch oder runter ziehen, um die Welle zu reiten', 'Abgeworfen!', 'Hai!', 'Dein Surfer reitet eine Riesenwelle. Ziehe nach oben oder unten, um dich auf der Welle zu bewegen und Felsen, Bojen, Baumstämmen und Quallen auszuweichen. Sie kommen immer schneller und dichter. Triffst du eins, endet die Runde.'],
      hi: ['लहर पर ऊपर या नीचे खींचें', 'गिर गए!', 'शार्क!', 'आपका सर्फ़र एक विशाल लहर पर दौड़ता है। लहर पर चलने और आती चट्टानों, बोया, लकड़ी के लट्ठों और जेलीफ़िश से बचने के लिए ऊपर या नीचे खींचें। वे और तेज़ व पास-पास आते हैं। किसी से टकराए तो राउंड खत्म।'],
      zh: ['上下拖动驾驭海浪', '翻板了！', '鲨鱼！', '你的冲浪手在巨浪上飞驰。上下拖动在浪面上移动，躲开迎面而来的礁石、浮标、浮木和水母。它们会越来越快、越来越密。撞上任何一个，本回合结束。']
    },
    jetskirace: {
      en: ['Drag to steer the jet ski', 'Crash!', 'Whirlpool!', 'Race up a winding jungle river. Drag left or right to steer: stay between the banks and dodge the rocks, logs and slower rival jet skis. The river gets narrower and faster. Touching a bank or anything in the water ends the round.'],
      fr: ['Glisse pour piloter le jet-ski', 'Crash !', 'Tourbillon !', 'Fonce sur une rivière sinueuse dans la jungle. Glisse à gauche ou à droite pour piloter : reste entre les rives et évite les rochers, les troncs et les jet-skis rivaux plus lents. La rivière devient plus étroite et plus rapide. Toucher une rive ou un obstacle termine la partie.'],
      es: ['Desliza para guiar la moto de agua', '¡Choque!', '¡Remolino!', 'Corre por un río sinuoso en la selva. Desliza a la izquierda o derecha para guiar: quédate entre las orillas y esquiva rocas, troncos y motos de agua rivales más lentas. El río se estrecha y se acelera. Tocar una orilla o un obstáculo termina la ronda.'],
      pt: ['Deslize para pilotar o jet ski', 'Batida!', 'Redemoinho!', 'Corra por um rio sinuoso na selva. Deslize para a esquerda ou direita para pilotar: fique entre as margens e desvie de pedras, troncos e jet skis rivais mais lentos. O rio fica mais estreito e rápido. Tocar uma margem ou um obstáculo encerra a rodada.'],
      ar: ['اسحب لتوجيه الدراجة المائية', 'اصطدام!', 'دوامة!', 'تسابق في نهر متعرج في الغابة. اسحب يسارًا أو يمينًا للتوجيه: ابقَ بين الضفتين وتجنب الصخور والجذوع والدراجات المنافسة الأبطأ. يضيق النهر ويزداد سرعة. لمس الضفة أو أي شيء في الماء ينهي الجولة.'],
      tr: ['Jet skiyi kaydırarak yönet', 'Çarptın!', 'Girdap!', 'Kıvrımlı bir orman nehrinde yarış. Yönlendirmek için sola ya da sağa kaydır: kıyıların arasında kal, kayalardan, kütüklerden ve yavaş rakip jet skilerden kaç. Nehir daralır ve hızlanır. Kıyıya ya da sudaki bir şeye değmek turu bitirir.'],
      vi: ['Kéo để lái mô tô nước', 'Va chạm!', 'Xoáy nước!', 'Đua trên dòng sông rừng uốn lượn. Kéo trái hoặc phải để lái: ở giữa hai bờ và né đá, khúc gỗ và mô tô nước đối thủ chậm hơn. Sông hẹp và nhanh dần. Chạm bờ hoặc vật gì dưới nước là kết thúc ván.'],
      id: ['Geser untuk mengemudikan jet ski', 'Tabrakan!', 'Pusaran air!', 'Balapan di sungai hutan yang berkelok. Geser ke kiri atau kanan untuk mengemudi: tetap di antara tepian dan hindari batu, batang kayu, dan jet ski lawan yang lebih lambat. Sungai makin sempit dan cepat. Menyentuh tepian atau benda di air mengakhiri ronde.'],
      ru: ['Веди — управляй гидроциклом', 'Авария!', 'Водоворот!', 'Мчись по извилистой реке в джунглях. Веди влево или вправо: держись между берегами, объезжай камни, брёвна и медленных соперников. Река становится уже и быстрее. Касание берега или препятствия завершает раунд.'],
      de: ['Ziehen, um den Jetski zu lenken', 'Crash!', 'Strudel!', 'Rase einen gewundenen Dschungelfluss hinauf. Ziehe nach links oder rechts zum Lenken: bleib zwischen den Ufern und weiche Felsen, Baumstämmen und langsameren Rivalen aus. Der Fluss wird enger und schneller. Ufer oder Hindernis berühren beendet die Runde.'],
      hi: ['जेट स्की चलाने को खींचें', 'टक्कर!', 'भँवर!', 'जंगल की घुमावदार नदी में दौड़ लगाएँ। चलाने के लिए बाएँ या दाएँ खींचें: किनारों के बीच रहें और चट्टानों, लट्ठों और धीमे विरोधी जेट स्की से बचें। नदी पतली और तेज़ होती जाती है। किनारे या पानी में किसी चीज़ को छूने पर राउंड खत्म।'],
      zh: ['拖动驾驶摩托艇', '撞上了！', '漩涡！', '在蜿蜒的丛林河流上竞速。左右拖动转向：保持在两岸之间，避开礁石、浮木和较慢的对手摩托艇。河道会越来越窄、越来越快。碰到河岸或水中障碍，本回合结束。']
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

  /* ================================================================== 5. PENGUIN SLIDE — rolling snowy hills (Tiny-Wings style). Hold =
     press into the slopes (heavier), release = fly off the tops. A giant snowball rolls behind: too slow and it catches you. */
  boot('penguinslide', function (A) {
    var W, H, T, dpr, bg, mtn, G0, amp, wl, pg = [], px = 0, py = 0, s = 0, vx = 0, vy = 0, air = false, held = false, ang = 0, camY = 0, bx = 0, br, pr, t = 0, dead = null, won = 0, crack = null, ph = 1, lastLand = '';
    var GR;
    function gy(x) { var a = amp * (1 + Math.min(1.2, Math.max(0, x) / (W * 40))); return G0 + a * Math.cos(x / wl * TAU) * 0.62 + a * 0.38 * Math.cos(x / (wl * 0.53) * TAU + ph); }
    function slope(x) { return (gy(x + 2) - gy(x - 2)) / 4; }
    function reset(live) { px = W * 0.3; s = W * (live ? 0.62 : 0.6); air = false; vx = s; vy = 0; py = gy(px); ang = Math.atan(slope(px)); bx = px - W * 1.3; dead = null; won = 0; crack = null; camY = 0; held = false; ph = rnd(0, TAU); }
    return {
      size: function (ww, hh, u, d, top) {
        W = ww; H = hh; dpr = d; T = top; G0 = T + (H - T) * 0.66; amp = (H - T) * 0.13; wl = clamp(W * 1.0, 340, 900); GR = (H - T) * 2.6; pr = clamp((H - T) * 0.065, 14, 36); br = clamp((H - T) * 0.2, 50, 150);
        bg = mkc(W, H, dpr, function (c) {
          c.fillStyle = lg(c, 0, 0, 0, H, ['#020617', '#1E1B4B', '#0E7490', '#A5F3FC']); c.fillRect(0, 0, W, H);
          stars(c, W, H, Math.round(W * H / 5000), 0, H * 0.5);
          for (var i = 0; i < 2; i++) for (var j = 0; j < 7; j++) { // aurora: soft curtains of thin vertical light
            c.globalAlpha = 0.05; c.strokeStyle = i ? '#A78BFA' : '#4ADE80'; c.lineWidth = (H - T) * (0.02 + j * 0.012);
            c.beginPath(); var oy = T + (H - T) * (0.14 + i * 0.07); c.moveTo(-10, oy); c.bezierCurveTo(W * 0.3, oy - (H - T) * 0.1, W * 0.6, oy + (H - T) * 0.12, W + 10, oy - (H - T) * 0.04); c.stroke();
          }
          c.globalAlpha = 1;
        });
        var mw = Math.max(W, 600), mh = (H - T) * 0.4;
        mtn = mkc(mw, mh, dpr, function (c) {
          c.fillStyle = '#334E68'; c.beginPath(); c.moveTo(0, mh); var x = 0; while (x < mw) { var pw = rnd(80, 180); c.lineTo(x + pw / 2, mh * rnd(0.1, 0.5)); x += pw; c.lineTo(Math.min(x, mw), mh * rnd(0.6, 0.85)); } c.lineTo(mw, mh); c.closePath(); c.fill();
          c.globalCompositeOperation = 'source-atop'; c.fillStyle = lg(c, 0, 0, 0, mh, ['#E0F2FE', '#94A3B8', '#334E68']); c.fillRect(0, 0, mw, mh * 0.45); c.globalCompositeOperation = 'source-over';
        });
        mtn.w = mw; mtn.h = mh;
        var mkP = function (fly) {
          return mkc(pr * 3.2, pr * 2.4, sdpr(), function (c) { // lying on the belly, head to the right
            c.translate(pr * 1.6, pr * 1.5);
            c.fillStyle = '#F97316'; if (fly) { c.beginPath(); c.ellipse(-pr * 1.15, pr * 0.15, pr * 0.3, pr * 0.14, 0.3, 0, TAU); c.fill(); } else { c.beginPath(); c.ellipse(-pr * 1.2, -pr * 0.05, pr * 0.28, pr * 0.12, 0, 0, TAU); c.fill(); }
            c.fillStyle = rg(c, -pr * 0.2, -pr * 0.6, pr * 1.6, ['#475569', '#0F172A', '#020617']); c.beginPath(); c.ellipse(0, 0, pr * 1.25, pr * 0.62, 0, 0, TAU); c.fill();
            c.fillStyle = lg(c, 0, 0, 0, pr * 0.6, ['#F8FAFC', '#CBD5E1']); c.beginPath(); c.ellipse(pr * 0.05, pr * 0.2, pr * 1.0, pr * 0.38, 0, 0, TAU); c.fill();
            c.fillStyle = '#0F172A'; c.beginPath(); c.ellipse(-pr * 0.05, fly ? -pr * 0.75 : -pr * 0.35, pr * 0.62, pr * 0.16, fly ? -0.5 : 0.15, 0, TAU); c.fill(); // flipper
            circ(c, pr * 1.0, -pr * 0.18, pr * 0.5, rg(c, pr * 0.85, -pr * 0.35, pr * 0.6, ['#475569', '#0F172A']));
            circ(c, pr * 1.18, -pr * 0.22, pr * 0.2, '#F8FAFC'); circ(c, pr * 1.24, -pr * 0.22, pr * 0.1, '#020617'); circ(c, pr * 1.27, -pr * 0.26, pr * 0.035, '#FFFFFF');
            c.fillStyle = '#FB923C'; c.beginPath(); c.moveTo(pr * 1.4, -pr * 0.18); c.lineTo(pr * 1.82, -pr * 0.02); c.lineTo(pr * 1.4, pr * 0.05); c.fill();
            c.fillStyle = 'rgba(255,255,255,.35)'; c.beginPath(); c.ellipse(-pr * 0.2, -pr * 0.4, pr * 0.6, pr * 0.1, -0.1, 0, TAU); c.fill();
          });
        };
        pg = [mkP(false), mkP(true)];
        reset(false);
      },
      reset: function (live) { reset(live); },
      step: function (dt, live) {
        t += dt; var lv = live ? A.lv() : 0.25, i;
        if (A.idle() && !dead) { var sl = slope(px + vx * 0.08); held = air ? (vy > 0 && slope(px + vx * 0.3) > 0.15) : sl > 0.05; }
        if (won) { won += dt; s *= 1 - dt * 1.5; vx = s; px += vx * dt; py = gy(px); return; }
        if (dead) { dead.t += dt; if (dead.k === 'ball') { bx += W * 0.7 * dt; } else { py += W * 0.5 * dt * dead.t; } return; }
        var n = 3, h = dt / n;
        for (var k = 0; k < n; k++) {
          if (!air) {
            var sl2 = slope(px), th = Math.atan(sl2), gg = GR * (held ? 2.6 : 1);
            s += gg * Math.sin(th) * h - s * (0.08 + s / W * 0.22) * h; if (s > W * 1.5) s = W * 1.5;
            if (s < W * 0.2) s = W * 0.2; // the penguin paddles: never stops
            vx = s * Math.cos(th); vy = s * Math.sin(th);
            var nx = px + vx * h, ny = py + vy * h + 0.5 * GR * h * h;
            if (!held && ny < gy(nx) - 0.6) { air = true; px = nx; py = ny; }
            else { px = nx; py = gy(px); ang = th; }
          } else {
            vy += GR * (held ? 2.4 : 1) * h; px += vx * h; py += vy * h; ang += (Math.atan2(vy, vx) * 0.6 - ang) * Math.min(1, h * 5);
            if (py >= gy(px)) {
              var tg = Math.atan(slope(px)), va = Math.atan2(vy, vx), dif = Math.abs(va - tg), sp = Math.hypot(vx, vy);
              py = gy(px); air = false; ang = tg;
              if (dif < 0.38) { s = sp * Math.cos(dif) * 1.04; lastLand = 'good'; puff(A, W * 0.3, py - camY, 6, ['#FFFFFF', '#E0F2FE'], 90, 0.5, 2.6); }
              else { s = sp * Math.cos(dif) * 0.62; lastLand = 'bad'; A.shake(0.12); puff(A, W * 0.3, py - camY, 10, ['#FFFFFF', '#BAE6FD'], 140, 0.6, 3.2); }
            }
          }
        }
        // the snowball: rolls at a steady speed that grows with time
        var vb = W * (0.5 + 0.32 * lv);
        bx += vb * dt; if (bx < px - W * 1.6) bx = px - W * 1.6;
        var ty = Math.min(0, py - (T + (H - T) * 0.32)); camY += (ty - camY) * Math.min(1, dt * 4);
        if (bx + br * 0.8 > px - pr) {
          if (A.live()) { if (A.fail(A.l.fail)) { dead = { t: 0, k: 'ball' }; A.shake(0.4); A.burst(W * 0.3, py - camY, 26, ['#FFFFFF', '#E0F2FE', '#BAE6FD'], 220, 0.8, 3.4); } }
          else bx = px - W * 1.1;
        }
      },
      draw: function (c) {
        A.bg(bg);
        var ox = px - W * 0.3, i, X, Y;
        var my = G0 - amp - mtn.h * 0.75 - camY * 0.3; tile(c, mtn, ox * 0.1, my, W); c.fillStyle = '#334E68'; c.fillRect(0, my + mtn.h - 1, W, H);
        // snow hills (sampled every few px)
        var stp = Math.max(6, W / 70);
        c.beginPath(); c.moveTo(0, H);
        for (X = 0; X <= W + stp; X += stp) c.lineTo(X, gy(X + ox) - camY);
        c.lineTo(W, H); c.closePath();
        c.fillStyle = '#EEF7FC'; c.fill();
        c.strokeStyle = 'rgba(14,116,144,.45)'; c.lineWidth = 2; c.beginPath();
        for (X = 0; X <= W + stp; X += stp) { Y = gy(X + ox) - camY; if (X) c.lineTo(X, Y); else c.moveTo(X, Y); } c.stroke();
        // little pines on the hills
        var tsp = wl * 0.37;
        for (var tx2 = Math.floor(ox / tsp) * tsp; tx2 < ox + W + tsp; tx2 += tsp) {
          var sx = tx2 - ox + tsp * 0.3, sy = gy(tx2 + tsp * 0.3) - camY + 4, th2 = pr * 2.2;
          c.fillStyle = '#14532D'; poly(c, [sx, sy - th2, sx - th2 * 0.35, sy, sx + th2 * 0.35, sy], '#166534'); poly(c, [sx, sy - th2 * 1.2, sx - th2 * 0.25, sy - th2 * 0.45, sx + th2 * 0.25, sy - th2 * 0.45], '#15803D');
          c.fillStyle = '#FFFFFF'; poly(c, [sx, sy - th2 * 1.2, sx - th2 * 0.1, sy - th2 * 0.95, sx + th2 * 0.1, sy - th2 * 0.95], '#FFFFFF');
        }
        // the penguin
        var P = W * 0.3, PY = py - camY;
        if (crack) { c.strokeStyle = '#0C4A6E'; c.lineWidth = 2.5; c.beginPath(); for (i = 0; i < crack.length; i++) { if (i) c.lineTo(crack[i][0], crack[i][1] - camY); else c.moveTo(crack[i][0], crack[i][1] - camY); } c.stroke(); }
        if (!(dead && dead.k === 'ball' && dead.t > 0.25)) {
          if (!air) shadow(c, P, PY + 2, pr * 1.2, pr * 0.2, 0.18);
          c.save(); c.translate(P, PY); c.rotate(ang); c.translate(0, -pr * 0.48); var im = air ? pg[1] : pg[0]; c.drawImage(im, -pr * 1.6, -pr * 1.5, pr * 3.2, pr * 2.4); c.restore();
          if (held && !dead && !won) { c.strokeStyle = 'rgba(255,255,255,.6)'; c.lineWidth = 2; for (i = 0; i < 3; i++) { c.beginPath(); c.moveTo(P - pr * (1.6 + i * 0.5), PY - pr * (0.9 - i * 0.35)); c.lineTo(P - pr * (2.6 + i * 0.5), PY - pr * (0.8 - i * 0.35)); c.stroke(); } }
        }
        // the giant snowball (+ a warning arrow while it is off screen)
        var bsx = bx - ox, bsy = gy(bx) - camY - br * 0.85;
        if (bsx > -br * 1.2) {
          c.save(); c.translate(bsx, bsy); c.rotate(bx / br);
          circ(c, 0, 0, br, rg(c, -br * 0.3, -br * 0.35, br * 1.1, ['#FFFFFF', '#E2E8F0', '#94A3B8']));
          c.fillStyle = 'rgba(100,116,139,.35)'; for (i = 0; i < 5; i++) { c.beginPath(); c.ellipse(Math.cos(i * 1.3) * br * 0.55, Math.sin(i * 1.3) * br * 0.55, br * 0.16, br * 0.1, i, 0, TAU); c.fill(); }
          c.restore();
          if (!A.lite) for (i = 0; i < 4; i++) circ(c, bsx - br * (0.6 + i * 0.25), bsy + br * (0.6 - i * 0.1), br * (0.3 - i * 0.05), 'rgba(255,255,255,.5)');
        } else {
          var close = clamp(1 - (px - bx - W * 0.3) / (W * 0.9), 0, 1), ay = PY - pr;
          c.globalAlpha = 0.4 + 0.6 * close; circ(c, 18, ay, 12, '#F8FAFC'); c.fillStyle = '#0E7490'; poly(c, [10, ay, 22, ay - 7, 22, ay + 7], '#0E7490'); c.globalAlpha = 1;
        }
      },
      down: function () { held = true; },
      move: function () { },
      up: function () { held = false; },
      boom: function () { // the secret end: the ice cracks under the penguin
        var x0 = W * 0.3, y0 = py; crack = [[x0 - pr * 3, y0 + 2]]; for (var i = 1; i < 7; i++) crack.push([x0 - pr * 3 + i * pr, y0 + 2 + (i % 2 ? 6 : -2)]);
        dead = { t: 0, k: 'ice' }; held = false; A.shake(0.3); A.burst(x0, py - camY, 20, ['#E0F2FE', '#7DD3FC', '#FFFFFF'], 180, 0.7, 3.2); A.sx('crash');
      },
      win: function () { won = 0.001; held = false; A.burst(W * 0.3, py - camY - pr, 16, ['#FDE68A', '#7DD3FC', '#FFFFFF'], 150, 0.6, 3); },
      dbg: function () { return { gap: (px - bx) / W, s: s / W, air: air, held: held, sl: slope(px + vx * 0.08), vy: vy, slAhead: slope(px + vx * 0.3), land: lastLand, dead: dead ? dead.k : '' }; }
    };
  }, 'hold', 0.38);

  /* ================================================================== 6. SNOWBOARD JUMP — finger down = jump (on the snow); keep holding in
     the air = backflip; release so the board lands flat. Rocks and crevasses to hop, kickers to fly (and flip) from. */
  boot('snowjump', function (A) {
    var W, H, T, dpr, bg, G, hs, rx, sk, cam = 0, v = 0, t = 0, y = 0, vy = 0, air = false, rot = 0, held = false, hT = 0, obs = [], nextX = 0, dead = null, won = 0, gk, bliz = 0, flips = 0, sa = 0.13;
    function addObs(live) {
      var lv = live ? A.lv() : 0.25, x = nextX, r = Math.random(), o;
      if (r < 0.3) o = { k: 'kick', x: x, w: hs * 1.7, h: hs * 0.55 };
      else if (r < 0.65) o = { k: 'rock', x: x, w: hs * rnd(0.45, 0.7), h: hs * rnd(0.3, 0.42 + lv * 0.08) };
      else o = { k: 'gap', x: x, w: hs * rnd(0.8, 1.2 + lv * 0.4) };
      obs.push(o); nextX = x + (o.w || 0) + hs * rnd(4.2, 6.5) * (1.1 - lv * 0.3) + (o.k === 'kick' ? hs * 7 : 0);
    }
    function reset(live) { obs = []; cam = 0; nextX = W * (live ? 1.2 : 0.9); for (var i = 0; i < 5; i++) addObs(live); y = 0; vy = 0; air = false; rot = 0; held = false; dead = null; won = 0; bliz = 0; flips = 0; v = hs * 5.2; }
    function groundAt(wx) { // height of the snow (0 = slope, >0 = up on a kicker, null = crevasse)
      for (var i = 0; i < obs.length; i++) { var o = obs[i]; if (wx >= o.x && wx <= o.x + o.w) { if (o.k === 'kick') return o.h * (wx - o.x) / o.w; if (o.k === 'gap') return null; } }
      return 0;
    }
    function jump(k) { vy = Math.sqrt(2 * gk * hs * k); air = true; hT = 0; A.sx('whoosh', { v: 0.4 }); }
    function auto() { // autopilot (idle scene + tests): hop what is ahead, flip once on a kicker
      if (air) return airK > 1.5 && rot > -TAU + 0.45;
      for (var i = 0; i < obs.length; i++) { var o = obs[i], d = o.x - (cam + rx); if (d > -o.w && d < v * 0.2 && o.k !== 'kick') return d > v * 0.06; }
      return false;
    }
    var airK = 1, kicks = 0;
    return {
      size: function (ww, hh, u, d, top) {
        W = ww; H = hh; dpr = d; T = top; G = H - (H - T) * 0.3; hs = clamp(Math.min((H - T) * 0.17, W * 0.13), 40, 110); rx = W * 0.3; gk = 8 * hs / (0.62 * 0.62);
        bg = mkc(W, H, dpr, function (c) {
          c.fillStyle = lg(c, 0, 0, 0, H, ['#0C4A6E', '#38BDF8', '#E0F2FE']); c.fillRect(0, 0, W, H);
          circ(c, W * 0.82, T + (H - T) * 0.12, Math.min(W, H) * 0.06, rg(c, W * 0.82, T + (H - T) * 0.12, Math.min(W, H) * 0.12, ['#FFFFFF', '#FEF9C3', 'rgba(254,249,195,0)']));
          for (var k = 0; k < 2; k++) {
            var x = -20, base = T + (H - T) * (0.35 + k * 0.12), pk = [];
            c.fillStyle = k ? '#64748B' : '#94A3B8'; c.beginPath(); c.moveTo(0, H); c.lineTo(-20, base);
            while (x < W + 40) { var pw = rnd(70, 160), ph2 = (H - T) * rnd(0.08, 0.22); pk.push([x + pw / 2, base - ph2, pw, ph2]); c.lineTo(x + pw / 2, base - ph2); x += pw; c.lineTo(x, base); }
            c.lineTo(W + 40, H); c.closePath(); c.fill();
            c.fillStyle = 'rgba(255,255,255,.85)'; pk.forEach(function (q) { var f = 0.35; c.beginPath(); c.moveTo(q[0], q[1]); c.lineTo(q[0] - q[2] / 2 * f, q[1] + q[3] * f); c.lineTo(q[0] - q[2] * 0.05, q[1] + q[3] * f * 0.8); c.lineTo(q[0] + q[2] / 2 * f, q[1] + q[3] * f); c.closePath(); c.fill(); });
          }
        });
        var pal = { skin: '#E0A47A', hair: '#4A2E1A', top: ['#A855F7', '#6B21A8'], bottom: ['#0EA5E9', '#075985'], shoe: '#111827' };
        sk = rigOne(hs, { view: 'side', pose: 'ready', pal: pal });
        if (!sk) sk = mkc(hs * 1.2, hs * 1.12, sdpr(), function (c) { c.translate(hs * 0.6, hs * 1.08); limb(c, 0, 0, 0, -hs * 0.5, hs * 0.14, hs * 0.14, '#0EA5E9'); limb(c, 0, -hs * 0.5, 0, -hs * 0.8, hs * 0.2, hs * 0.18, '#A855F7'); circ(c, 0, -hs * 0.9, hs * 0.1, '#E0A47A'); });
        reset(false);
      },
      reset: function (live) { reset(live); },
      step: function (dt, live) {
        t += dt; var lv = live ? A.lv() : 0.25, i;
        if (A.idle() && !dead) { var a = auto(); if (a && !held) { held = true; if (!air) jump(1); } else if (!a && held) held = false; }
        if (won) { won += dt; v = Math.max(0, v - v * dt * 1.5); cam += v * dt; return; }
        if (dead) { dead.t += dt; v = Math.max(0, v - hs * 6 * dt); cam += v * dt; if (dead.k === 'gap') y -= hs * 6 * dt * dead.t; return; }
        if (bliz) { bliz += dt; v = Math.max(0, v - hs * 3 * dt); cam += v * dt; return; }
        v += (hs * (5.2 + 2.6 * lv) - v) * Math.min(1, dt * 2); cam += v * dt;
        var gH = groundAt(cam + rx);
        if (air) {
          vy -= gk * dt; y += vy * dt; hT += dt;
          if (held && hT > 0.12) rot -= 8.6 * dt;
          if (gH !== null && y <= gH && vy < 0) { // landing
            y = gH; air = false; vy = 0;
            var r2 = Math.atan2(Math.sin(rot), Math.cos(rot));
            if (Math.abs(r2) > 0.62) { if (A.live()) { if (A.fail(A.l.fail)) { dead = { t: 0, k: 'land', r: r2 }; A.shake(0.3); puff(A, rx, G - y, 18, ['#FFFFFF', '#E0F2FE'], 180, 0.7, 3.4); } return; } }
            if (rot < -5) { flips++; A.burst(rx, G - hs, 12, ['#FDE68A', '#FFFFFF', '#C084FC'], 140, 0.5, 2.8); }
            puff(A, rx, G - y, 8, ['#FFFFFF', '#E0F2FE'], 100, 0.5, 2.6); rot = 0;
          }
        } else {
          if (gH === null) { if (A.live()) { if (A.fail(A.l.fail2)) { dead = { t: 0, k: 'gap' }; A.shake(0.2); } return; } jump(1); }
          else {
            var prev = y; y = gH;
            var o = null; for (i = 0; i < obs.length; i++) if (obs[i].k === 'kick' && cam + rx >= obs[i].x && cam + rx <= obs[i].x + obs[i].w) o = obs[i];
            if (!o && prev > 0.5 * hs * 0.55 && y === 0) { airK = 2.9; kicks++; vy = Math.sqrt(2 * gk * hs * 2.9); y = prev; air = true; hT = 0; A.sx('whoosh', { v: 0.6 }); } // off the kicker lip
            else airK = 1;
          }
        }
        // rocks: the board must be above them
        for (i = 0; i < obs.length; i++) {
          var q = obs[i];
          if (q.k === 'rock' && !q.hit && cam + rx + hs * 0.3 > q.x && cam + rx - hs * 0.3 < q.x + q.w && y < q.h * 0.85) {
            q.hit = 1; if (A.live()) { if (A.fail(A.l.fail)) { dead = { t: 0, k: 'rock' }; A.shake(0.3); puff(A, rx, G - q.h, 14, ['#CBD5E1', '#FFFFFF'], 160, 0.6, 3); } return; }
          }
        }
        while (obs.length < 6) addObs(live);
        for (i = obs.length - 1; i >= 0; i--) if (obs[i].x + obs[i].w < cam - W * 0.4) obs.splice(i, 1);
      },
      draw: function (c) {
        A.bg(bg);
        c.save(); c.translate(W / 2, G); c.rotate(sa); c.translate(-W / 2, -G); // the whole slope tilts downhill
        var i, ext = W * 0.4;
        // snow ground with crevasses cut out
        c.fillStyle = lg(c, 0, G, 0, H + ext, ['#FFFFFF', '#E0F2FE', '#BAE6FD']); c.fillRect(-ext, G, W + ext * 2, H - G + ext);
        c.fillStyle = 'rgba(148,163,184,.25)'; var ls = hs * 1.3; for (var lx = -((cam * 1) % ls) - ext; lx < W + ext; lx += ls) c.fillRect(lx, G + (H - G) * 0.25, hs * 0.5, 2);
        // pines going by (parallax, behind)
        var ps = W * 0.45; for (var px = -((cam * 0.6) % ps) - ext; px < W + ext; px += ps) { var bxp = px + ps * 0.4, th = hs * 1.2; poly(c, [bxp, G - th, bxp - th * 0.32, G, bxp + th * 0.32, G], '#166534'); poly(c, [bxp, G - th * 1.25, bxp - th * 0.22, G - th * 0.5, bxp + th * 0.22, G - th * 0.5], '#15803D'); poly(c, [bxp, G - th * 1.25, bxp - th * 0.09, G - th * 0.98, bxp + th * 0.09, G - th * 0.98], '#FFFFFF'); }
        for (i = 0; i < obs.length; i++) {
          var o = obs[i], x = o.x - cam; if (x > W + ext || x + o.w < -ext) continue;
          if (o.k === 'gap') { c.fillStyle = lg(c, 0, G, 0, H, ['#0C4A6E', '#082F49', '#020617']); c.beginPath(); c.moveTo(x, G); c.lineTo(x + o.w, G); c.lineTo(x + o.w * 0.7, H + ext); c.lineTo(x + o.w * 0.3, H + ext); c.closePath(); c.fill(); c.fillStyle = '#7DD3FC'; c.fillRect(x, G - 1, 3, (H - G) * 0.3); c.fillRect(x + o.w - 3, G - 1, 3, (H - G) * 0.3); }
          else if (o.k === 'rock') { c.fillStyle = lg(c, x, G - o.h, x + o.w, G, ['#94A3B8', '#475569', '#1E293B']); c.beginPath(); c.moveTo(x, G + 2); c.lineTo(x + o.w * 0.15, G - o.h * 0.7); c.lineTo(x + o.w * 0.45, G - o.h); c.lineTo(x + o.w * 0.8, G - o.h * 0.75); c.lineTo(x + o.w, G + 2); c.fill(); c.fillStyle = '#FFFFFF'; c.beginPath(); c.moveTo(x + o.w * 0.2, G - o.h * 0.72); c.lineTo(x + o.w * 0.45, G - o.h); c.lineTo(x + o.w * 0.72, G - o.h * 0.78); c.lineTo(x + o.w * 0.45, G - o.h * 0.85); c.fill(); }
          else { c.fillStyle = lg(c, x, G, x + o.w, G - o.h, ['#E0F2FE', '#FFFFFF']); poly(c, [x, G, x + o.w, G - o.h, x + o.w, G], null); c.fill(); c.strokeStyle = '#38BDF8'; c.lineWidth = 2; c.beginPath(); c.moveTo(x, G); c.lineTo(x + o.w, G - o.h); c.stroke(); c.fillStyle = '#F97316'; c.fillRect(x + o.w - 3, G - o.h - hs * 0.35, 3, hs * 0.35); poly(c, [x + o.w, G - o.h - hs * 0.35, x + o.w + hs * 0.22, G - o.h - hs * 0.28, x + o.w, G - o.h - hs * 0.2], '#F97316'); }
        }
        // rider + board
        var ry = G - y, rr2 = rot;
        if (dead && dead.k === 'land') rr2 = dead.r + Math.min(1, dead.t * 2) * (dead.r > 0 ? 1 : -1) * 0.8;
        if (dead && dead.k === 'rock') rr2 = Math.min(1.4, dead.t * 4);
        if (!air && !dead) { var gh2 = groundAt(cam + rx + 4); if (gh2 !== null && gh2 > y) rr2 = -Math.atan2(gh2 - y, 4); }
        if (!air && !dead) shadow(c, rx, G - y + 2, hs * 0.4, hs * 0.06, 0.2); else if (air) shadow(c, rx, G - (groundAt(cam + rx) || 0) + 2, hs * 0.3, hs * 0.05, 0.15);
        c.save(); c.translate(rx, ry); c.rotate(rr2);
        c.fillStyle = lg(c, -hs * 0.45, 0, hs * 0.45, 0, ['#F43F5E', '#FB7185', '#BE123C']); rr(c, -hs * 0.46, -hs * 0.07, hs * 0.92, hs * 0.08, hs * 0.04); c.fill();
        c.fillStyle = '#FDE68A'; c.fillRect(-hs * 0.3, -hs * 0.05, hs * 0.6, hs * 0.015);
        c.drawImage(sk, -sk.w / 2, -sk.h - hs * 0.04, sk.w, sk.h);
        c.restore();
        c.restore();
        if (bliz) { c.fillStyle = 'rgba(148,163,184,' + Math.min(0.55, bliz * 0.5) + ')'; c.fillRect(0, T, W, H - T); c.fillStyle = '#FFFFFF'; for (i = 0; i < 40; i++) c.fillRect((i * 97 + t * 900) % W, T + (i * 53 + t * 300) % (H - T), 3, 3); }
      },
      down: function () { held = true; if (!air && !dead && !bliz) jump(1); },
      move: function () { },
      up: function () { held = false; },
      boom: function () { bliz = 0.001; held = false; A.sx('crash'); },
      win: function () { won = 0.001; held = false; A.burst(rx, G - hs, 16, ['#FDE68A', '#F43F5E', '#FFFFFF'], 150, 0.6, 3); },
      dbg: function () { return { auto: auto() ? 1 : 0, air: air, rot: rot, y: y / hs, flips: flips, kicks: kicks, airK: airK, dead: dead ? dead.k : '' }; }
    };
  }, 'hold', 0.4);

  /* ================================================================== 7. SURF RIDER — a giant wave seen from the side; drag up / down to
     move on its face. Rocks, buoys, logs and jellyfish come from the right, faster and denser. */
  boot('surfrider', function (A) {
    var W, H, T, dpr, bg, yC, yB, sx, sy, ty, vy2 = 0, hs, sk, obs = [], nextT = 0, t = 0, dead = null, won = 0, shark = null, drag = null, foam = [], spd = 0;
    function reset(live) { sy = ty = (yC + yB) / 2; obs = []; nextT = live ? 1.2 : 0.6; dead = null; won = 0; shark = null; drag = null; vy2 = 0; }
    function spawn(live) {
      var lv = live ? A.lv() : 0.3, band = yB - yC, n = Math.random() < 0.25 + lv * 0.3 ? 2 : 1, used = [];
      for (var i = 0; i < n; i++) {
        var k = pick(['rock', 'buoy', 'log', 'jelly']), r = hs * (k === 'log' ? 0.42 : k === 'rock' ? 0.48 : 0.32), y, tries = 0;
        do { y = yC + r + Math.random() * (band - 2 * r); tries++; } while (tries < 8 && used.some(function (u) { return Math.abs(u - y) < hs * 2.4; }));
        used.push(y); obs.push({ k: k, x: W + r * 2 + i * hs * 0.6, y: y, r: r, ph: rnd(0, TAU) });
      }
      nextT = rnd(0.9, 1.5) * (1.15 - lv * 0.45);
    }
    // autopilot: go to the y with the most room among the next obstacles
    function best() {
      var cand = [], i, b = ty, bs = -1;
      for (var y = yC + hs * 0.6; y <= yB - hs * 0.3; y += hs * 0.4) cand.push(y);
      cand.forEach(function (y) { var m = 1e9; for (i = 0; i < obs.length; i++) { var o = obs[i]; if (o.x < sx - hs) continue; var dx = Math.max(0, o.x - sx), d = Math.abs(o.y - y) - o.r - hs * 0.5 + dx * 0.15; m = Math.min(m, d); } m -= Math.abs(y - sy) * 0.05; if (m > bs) { bs = m; b = y; } });
      return b;
    }
    return {
      size: function (ww, hh, u, d, top) {
        W = ww; H = hh; dpr = d; T = top; yC = T + (H - T) * 0.3; yB = T + (H - T) * 0.92; sx = W * 0.42; hs = clamp(Math.min((H - T) * 0.16, W * 0.16), 38, 110);
        bg = mkc(W, H, dpr, function (c) {
          c.fillStyle = lg(c, 0, 0, 0, yC, ['#FB923C', '#FDBA74', '#FDE68A']); c.fillRect(0, 0, W, yC + 4);
          circ(c, W * 0.72, yC - (yC - T) * 0.15, Math.min(W, H) * 0.09, rg(c, W * 0.72, yC - (yC - T) * 0.15, Math.min(W, H) * 0.09, ['#FFFBEB', '#FDE047', '#F59E0B']));
          var b = yB - yC;
          c.fillStyle = lg(c, 0, yC - b * 0.1, 0, yC + b * 0.1, ['#0369A1', '#075985']); c.fillRect(0, yC - b * 0.06, W, b * 0.3); // the sea behind
          // the wave face rises to the left and curls over (the tube)
          c.fillStyle = lg(c, 0, yC - b * 0.2, 0, H, ['#99F6E4', '#2DD4BF', '#0D9488', '#0E7490', '#164E63']);
          c.beginPath(); c.moveTo(W, yC + b * 0.06); c.quadraticCurveTo(W * 0.6, yC + b * 0.02, W * 0.3, yC - b * 0.14); c.quadraticCurveTo(W * 0.18, yC - b * 0.2, W * 0.08, yC - b * 0.16);
          c.lineTo(0, yC - b * 0.1); c.lineTo(0, H); c.lineTo(W, H); c.closePath(); c.fill();
          c.fillStyle = lg(c, 0, yC - b * 0.1, W * 0.25, yC + b * 0.5, ['#0F766E', '#134E4A', '#042F2E']); c.beginPath(); c.ellipse(W * 0.06, yC + b * 0.22, W * 0.15, b * 0.33, -0.15, 0, TAU); c.fill(); // inside the tube
          c.strokeStyle = 'rgba(255,255,255,.95)'; c.lineWidth = Math.max(5, b * 0.05); c.lineCap = 'round'; c.beginPath(); c.moveTo(W * 0.36, yC - b * 0.1); c.quadraticCurveTo(W * 0.2, yC - b * 0.24, W * 0.1, yC - b * 0.12); c.quadraticCurveTo(W * 0.0, yC, W * 0.04, yC + b * 0.2); c.stroke(); // the lip
          c.strokeStyle = 'rgba(204,251,241,.7)'; c.lineWidth = Math.max(3, b * 0.025); c.beginPath(); c.moveTo(W, yC + b * 0.05); c.quadraticCurveTo(W * 0.6, yC + b * 0.01, W * 0.36, yC - b * 0.1); c.stroke(); // the crest
          for (var i = 0; i < 26; i++) circ(c, W * rnd(0, 0.2), yC + b * rnd(0.3, 0.6), rnd(2, 6), 'rgba(255,255,255,.6)'); // spray at the foot of the tube
          c.strokeStyle = 'rgba(255,255,255,.12)'; c.lineWidth = 2; for (i = 0; i < 8; i++) { var ly = yC + b * (0.15 + i * 0.11); c.beginPath(); c.moveTo(W * 0.2, ly); c.quadraticCurveTo(W * 0.6, ly - 8, W, ly + 4); c.stroke(); }
        });
        var pal = { skin: '#9C6640', hair: '#1A1110', top: ['#FACC15', '#CA8A04'], bottom: ['#DB2777', '#9D174D'], legs: 'shorts', shoe: '#9C6640' };
        sk = rigOne(hs, { view: 'side', pose: 'ready', pal: pal });
        if (!sk) sk = mkc(hs * 1.2, hs * 1.12, sdpr(), function (c) { c.translate(hs * 0.6, hs * 1.08); limb(c, 0, 0, 0, -hs * 0.5, hs * 0.14, hs * 0.14, '#9C6640'); limb(c, 0, -hs * 0.5, 0, -hs * 0.8, hs * 0.2, hs * 0.18, '#FACC15'); circ(c, 0, -hs * 0.9, hs * 0.1, '#9C6640'); });
        foam = []; for (var f = 0; f < 14; f++) foam.push({ x: Math.random() * W, y: yC + Math.random() * (yB - yC), l: rnd(20, 60) });
        reset(false);
      },
      reset: function (live) { reset(live); },
      step: function (dt, live) {
        t += dt; var lv = live ? A.lv() : 0.3, i;
        spd = W * (0.5 + 0.45 * lv);
        if (won) { won += dt; return; }
        for (i = 0; i < foam.length; i++) { foam[i].x -= spd * 0.8 * dt; if (foam[i].x < -foam[i].l) { foam[i].x = W + rnd(0, 40); foam[i].y = yC + Math.random() * (yB - yC); } }
        if (dead) { dead.t += dt; sy += (H - sy) * dt * 0.8; return; }
        if (shark) { shark.x -= spd * 2 * dt; if (shark.x < sx + hs * 0.4 && !shark.hit) { shark.hit = 1; dead = { t: 0 }; boomFx(A, sx, sy, 0.6); } }
        if (A.idle()) ty = best();
        var py = sy; sy += clamp(ty - sy, -(H - T) * 1.7 * dt, (H - T) * 1.7 * dt); vy2 = (sy - py) / Math.max(dt, 0.001);
        nextT -= dt; if (nextT <= 0 && !shark) spawn(live);
        for (i = obs.length - 1; i >= 0; i--) {
          var o = obs[i]; o.x -= spd * dt; o.ph += dt * 3;
          if (o.x < -o.r * 3) { obs.splice(i, 1); continue; }
          var dx = (o.x - sx) / (o.k === 'log' ? 2.2 : 1), dy = o.y - (sy - hs * 0.35);
          if (Math.hypot(dx, dy) < o.r + hs * 0.32) {
            if (A.live()) { if (A.fail(A.l.fail)) { dead = { t: 0 }; A.shake(0.3); puff(A, sx, sy, 22, ['#FFFFFF', '#99F6E4', '#5EEAD4'], 200, 0.7, 3.2); } return; }
            obs.splice(i, 1);
          }
        }
      },
      draw: function (c) {
        A.bg(bg);
        var i;
        c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = 2; c.beginPath(); for (i = 0; i < foam.length; i++) { c.moveTo(foam[i].x, foam[i].y); c.lineTo(foam[i].x + foam[i].l, foam[i].y - 2); } c.stroke();
        for (i = 0; i < obs.length; i++) {
          var o = obs[i], x = o.x, y = o.y + Math.sin(o.ph) * 2, r = o.r;
          if (o.k === 'rock') { c.fillStyle = lg(c, x, y - r, x, y + r, ['#A8A29E', '#57534E', '#292524']); c.beginPath(); c.moveTo(x - r, y + r * 0.5); c.lineTo(x - r * 0.6, y - r * 0.6); c.lineTo(x + r * 0.1, y - r); c.lineTo(x + r * 0.8, y - r * 0.4); c.lineTo(x + r, y + r * 0.5); c.closePath(); c.fill(); c.fillStyle = 'rgba(255,255,255,.7)'; c.fillRect(x - r * 1.1, y + r * 0.4, r * 2.2, 3); }
          else if (o.k === 'buoy') { circ(c, x, y, r, rg(c, x - r * 0.3, y - r * 0.4, r * 1.1, ['#FECACA', '#EF4444', '#7F1D1D'])); c.fillStyle = '#FFFFFF'; c.fillRect(x - r, y - r * 0.2, r * 2, r * 0.35); c.fillStyle = '#334155'; c.fillRect(x - 1.5, y - r * 1.7, 3, r * 0.8); circ(c, x, y - r * 1.75, 3, '#FDE047'); }
          else if (o.k === 'log') { c.fillStyle = lg(c, x, y - r * 0.5, x, y + r * 0.5, ['#B45309', '#78350F', '#451A03']); rr(c, x - r * 2.2, y - r * 0.45, r * 4.4, r * 0.9, r * 0.45); c.fill(); circ(c, x + r * 1.95, y, r * 0.42, '#D97706'); c.strokeStyle = '#78350F'; c.lineWidth = 1.5; c.beginPath(); c.arc(x + r * 1.95, y, r * 0.22, 0, TAU); c.stroke(); }
          else { c.fillStyle = 'rgba(244,114,182,.75)'; c.beginPath(); c.arc(x, y, r, Math.PI, TAU); c.closePath(); c.fill(); c.strokeStyle = 'rgba(244,114,182,.7)'; c.lineWidth = 2; c.beginPath(); for (var k = -2; k <= 2; k++) { c.moveTo(x + k * r * 0.35, y); c.quadraticCurveTo(x + k * r * 0.35 + Math.sin(o.ph + k) * 5, y + r * 0.6, x + k * r * 0.35, y + r * 1.1); } c.stroke(); circ(c, x - r * 0.3, y - r * 0.45, r * 0.18, 'rgba(255,255,255,.6)'); }
        }
        if (shark) { c.fillStyle = '#334155'; c.beginPath(); c.moveTo(shark.x, sy - hs * 0.1); c.lineTo(shark.x + hs * 0.35, sy - hs * 0.75); c.quadraticCurveTo(shark.x + hs * 0.55, sy - hs * 0.3, shark.x + hs * 0.8, sy - hs * 0.1); c.fill(); c.fillStyle = 'rgba(255,255,255,.7)'; c.fillRect(shark.x - hs * 0.2, sy - hs * 0.12, hs * 1.2, 3); }
        // surfer: board along the motion, spray behind
        var ang = clamp(Math.atan2(vy2, spd) * 0.8, -0.6, 0.6), rot = dead ? Math.min(2.2, dead.t * 5) : 0;
        if (!dead || dead.t < 0.6) {
          c.save(); c.translate(sx, sy); c.rotate(ang + rot);
          c.fillStyle = 'rgba(255,255,255,.55)'; for (i = 0; i < 4; i++) circ(c, -hs * (0.55 + i * 0.18), hs * 0.02 - i * 2, hs * (0.12 - i * 0.02), 'rgba(255,255,255,.6)');
          c.fillStyle = lg(c, -hs * 0.6, 0, hs * 0.6, 0, ['#0EA5E9', '#E0F2FE', '#0EA5E9']); c.beginPath(); c.ellipse(0, 0, hs * 0.62, hs * 0.07, 0, 0, TAU); c.fill(); c.strokeStyle = '#F43F5E'; c.lineWidth = 2; c.beginPath(); c.moveTo(-hs * 0.55, 0); c.lineTo(hs * 0.55, 0); c.stroke();
          c.drawImage(sk, -sk.w / 2, -sk.h - hs * 0.03, sk.w, sk.h);
          c.restore();
        }
      },
      down: function (x, y) { drag = { y: y, s: ty }; },
      move: function (x, y) { if (drag && !dead) ty = clamp(drag.s + (y - drag.y) * 1.3, yC + hs * 0.5, yB - hs * 0.15); },
      up: function () { drag = null; },
      key: function (k) { if (k === 'up') ty = Math.max(yC + hs * 0.5, ty - hs); else if (k === 'down') ty = Math.min(yB - hs * 0.15, ty + hs); },
      boom: function () { shark = { x: W + hs }; drag = null; A.sx('crash'); },
      win: function () { won = 0.001; drag = null; A.burst(sx, sy - hs, 16, ['#FDE68A', '#FFFFFF', '#2DD4BF'], 150, 0.6, 3); },
      dbg: function () { return { sy: sy, ty: ty, best: best(), yC: yC, yB: yB, n: obs.length, dead: dead ? 1 : 0 }; }
    };
  }, 'drag', 0.55);

  /* ================================================================== 8. JET SKI RACE — a winding jungle river seen from above, racing up.
     Drag left / right to steer. Banks, rocks, logs and slower rivals; the river narrows and speeds up. */
  boot('jetskirace', function (A) {
    var W, H, T, dpr, bg, js, rv, palm, jy, x = 0, tx = 0, cam = 0, v = 0, t = 0, obs = [], nextY = 0, dead = null, won = 0, pool = null, drag = null, wake = [], ph1 = 0, ph2 = 0, wid = 0.66, sz, lean = 0;
    function cx(y) { return W / 2 + W * 0.17 * Math.sin(y / (H * 0.9) + ph1) + W * 0.08 * Math.sin(y / (H * 0.37) + ph2); }
    function reset(live) { ph1 = rnd(0, TAU); ph2 = rnd(0, TAU); cam = 0; x = tx = cx(0); obs = []; nextY = -(H - T) * (live ? 1.1 : 0.8); dead = null; won = 0; pool = null; drag = null; wake = []; wid = 0.66; v = (H - T) * 0.8; }
    // world y grows upward as negative numbers: a point at world y is on screen at y - cam + jy … (cam is negative and decreasing)
    function scr(y) { return y - cam + jy; }
    function spawn(live) {
      var lv = live ? A.lv() : 0.3, y = nextY, c0 = cx(y), hw = W * wid / 2, r = Math.random(), o;
      if (r < 0.3) o = { k: 'rival', x: c0, y: y, r: sz * 0.42, v: v * rnd(0.45, 0.6), ph: rnd(0, TAU), off: rnd(-0.25, 0.25) * W * wid, c: pick(['#22C55E', '#A855F7', '#F97316']) };
      else if (r < 0.62) o = { k: 'log', x: c0 + rnd(-hw * 0.45, hw * 0.45), y: y, r: sz * 0.35, w: sz * rnd(1.0, 1.5) };
      else o = { k: 'rock', x: c0 + rnd(-hw * 0.6, hw * 0.6), y: y, r: sz * rnd(0.32, 0.45) };
      obs.push(o); nextY = y - (H - T) * rnd(0.45, 0.68) * (1.15 - lv * 0.35);
    }
    function blocked(xx, y, o) { var dx = xx - o.x, dy = y - o.y; if (o.k === 'log') { dx = Math.max(0, Math.abs(dx) - o.w / 2); } return Math.hypot(dx, dy) < o.r + sz * 0.26; }
    function best() { // autopilot (idle scene + tests): the reachable lane with the most room, obstacles where we will meet them
      var hw = W * wid / 2, bx = x, bs = -1e9, cc = cx(cam - (H - T) * 0.08);
      for (var xx = cc - hw + sz * 0.5; xx <= cc + hw - sz * 0.5; xx += sz * 0.25) {
        var m = 1e9;
        for (var i = 0; i < obs.length; i++) {
          var o = obs[i], dy = cam - o.y; if (dy < -sz * 1.2 || dy > (H - T) * 0.6) continue;
          var rel = v - (o.v || 0), tm = Math.max(0, dy) / Math.max(rel, 1), ox = o.k === 'rival' ? cx(o.y - (o.v || 0) * tm) + o.off : o.x;
          var gap = Math.abs(xx - ox) - (o.k === 'log' ? o.w / 2 : 0) - o.r - sz * 0.3, reach = Math.abs(xx - x) / (W * 1.4) - tm;
          if (reach > 0) gap -= reach * W; m = Math.min(m, gap + dy * 0.02);
        }
        m = Math.min(m, sz * 3) - Math.abs(xx - cc) * 0.05 - Math.abs(xx - x) * 0.02;
        if (m > bs) { bs = m; bx = xx; }
      }
      return bx;
    }
    return {
      size: function (ww, hh, u, d, top) {
        W = ww; H = hh; dpr = d; T = top; jy = T + (H - T) * 0.74; sz = clamp(Math.min(W * 0.12, (H - T) * 0.11), 30, 80);
        bg = mkc(W, H, dpr, function (c) { c.fillStyle = '#14532D'; c.fillRect(0, 0, W, H); });
        js = mkc(sz * 0.7, sz * 1.2, sdpr(), function (c, w, h) { // top view, nose up: hull, seat, rider
          c.fillStyle = lg(c, 0, 0, w, 0, ['#991B1B', '#EF4444', '#991B1B']); c.beginPath(); c.moveTo(w / 2, 0); c.quadraticCurveTo(w, h * 0.3, w * 0.9, h * 0.95); c.lineTo(w * 0.1, h * 0.95); c.quadraticCurveTo(0, h * 0.3, w / 2, 0); c.fill();
          c.fillStyle = '#F8FAFC'; c.beginPath(); c.moveTo(w / 2, h * 0.06); c.quadraticCurveTo(w * 0.7, h * 0.25, w * 0.62, h * 0.35); c.lineTo(w * 0.38, h * 0.35); c.quadraticCurveTo(w * 0.3, h * 0.25, w / 2, h * 0.06); c.fill();
          c.fillStyle = '#111827'; rr(c, w * 0.3, h * 0.5, w * 0.4, h * 0.36, w * 0.15); c.fill();
          c.strokeStyle = '#1F2937'; c.lineWidth = 2.5; c.beginPath(); c.moveTo(w * 0.15, h * 0.4); c.lineTo(w * 0.85, h * 0.4); c.stroke();
          circ(c, w / 2, h * 0.58, w * 0.24, rg(c, w * 0.45, h * 0.55, w * 0.24, ['#FDE68A', '#F59E0B', '#92400E'])); // helmet from above
          c.fillStyle = '#1E3A8A'; rr(c, w * 0.26, h * 0.62, w * 0.48, h * 0.16, 4); c.fill();
          c.fillStyle = 'rgba(255,255,255,.35)'; c.beginPath(); c.ellipse(w * 0.35, h * 0.3, w * 0.08, h * 0.15, 0.2, 0, TAU); c.fill();
        });
        rv = {}; ['#22C55E', '#A855F7', '#F97316'].forEach(function (col) { rv[col] = mkc(sz * 0.7, sz * 1.2, sdpr(), function (c, w, h) { c.fillStyle = col; c.beginPath(); c.moveTo(w / 2, 0); c.quadraticCurveTo(w, h * 0.3, w * 0.9, h * 0.95); c.lineTo(w * 0.1, h * 0.95); c.quadraticCurveTo(0, h * 0.3, w / 2, 0); c.fill(); c.fillStyle = 'rgba(255,255,255,.8)'; c.fillRect(w * 0.4, h * 0.1, w * 0.2, h * 0.3); c.fillStyle = '#111827'; rr(c, w * 0.3, h * 0.5, w * 0.4, h * 0.36, w * 0.15); c.fill(); circ(c, w / 2, h * 0.58, w * 0.22, '#E5E7EB'); }); });
        palm = mkc(sz * 1.6, sz * 1.6, sdpr(), function (c, w) { var r = w / 2; c.translate(r, r); for (var i = 0; i < 7; i++) { c.save(); c.rotate(i * TAU / 7); c.fillStyle = i % 2 ? '#16A34A' : '#22C55E'; c.beginPath(); c.ellipse(r * 0.5, 0, r * 0.5, r * 0.14, 0, 0, TAU); c.fill(); c.restore(); } circ(c, 0, 0, r * 0.14, '#78350F'); });
        reset(false);
      },
      reset: function (live) { reset(live); },
      step: function (dt, live) {
        t += dt; var lv = live ? A.lv() : 0.3, i;
        if (won) { won += dt; v *= 1 - dt * 1.5; cam -= v * dt; return; }
        if (dead) { dead.t += dt; v *= 1 - dt * 3; cam -= v * dt; return; }
        if (pool) { pool.t += dt; v *= 1 - dt * 2; cam -= v * dt; x += (pool.x - x) * dt * 2; if (pool.t > 0.7 && !pool.b) { pool.b = 1; dead = { t: 0, spin: 1 }; } return; }
        v += ((H - T) * (0.85 + 0.6 * lv) - v) * Math.min(1, dt * 2); cam -= v * dt;
        wid = Math.max(0.44, 0.66 - lv * 0.16);
        if (A.idle()) tx = best();
        var px = x; x += clamp(tx - x, -W * 1.4 * dt, W * 1.4 * dt); lean = clamp((x - px) / Math.max(dt, 0.001) / (W * 1.4), -1, 1) * 0.35;
        if (Math.random() < 0.6) wake.push({ x: x, y: cam + sz * 0.5, t: 0 });
        for (i = wake.length - 1; i >= 0; i--) { wake[i].t += dt; if (wake[i].t > 1.1) wake.splice(i, 1); }
        while (nextY > cam - (H - T) * 1.2) spawn(live);
        for (i = obs.length - 1; i >= 0; i--) {
          var o = obs[i];
          if (o.k === 'rival') { o.y -= o.v * dt; o.ph += dt * 1.1; var c0 = cx(o.y); o.x = c0 + o.off + Math.sin(o.ph) * W * wid * 0.06; }
          if (o.y > cam + (H - T)) { obs.splice(i, 1); continue; }
          if (blocked(x, cam, o)) {
            if (A.live()) { if (A.fail(A.l.fail)) { dead = { t: 0, why: o.k + ' ' + Math.round(o.x - x) + ',' + Math.round(o.y - cam) }; boomFx(A, x, jy, 0.5); } return; }
            obs.splice(i, 1);
          }
        }
        var hw = W * wid / 2, cc = cx(cam);
        if (Math.abs(x - cc) > hw - sz * 0.22) {
          if (A.live()) { if (A.fail(A.l.fail)) { dead = { t: 0, why: 'bank ' + Math.round(x - cc) + '/' + Math.round(hw) }; A.shake(0.3); puff(A, x, jy, 18, ['#FFFFFF', '#A7F3D0', '#86EFAC'], 180, 0.6, 3); } }
          else { x = tx = cc; }
        }
      },
      draw: function (c) {
        A.bg(bg);
        var i, st = Math.max(10, (H - T) / 40), hw = W * wid / 2, y, wy;
        // water (whole stage), then the two banks as polygons following the river
        c.fillStyle = lg(c, 0, T, 0, H, ['#0E7490', '#0891B2', '#0E7490']); c.fillRect(0, 0, W, H);
        c.strokeStyle = 'rgba(255,255,255,.12)'; c.lineWidth = 2; c.beginPath();
        for (i = 0; i < 14; i++) { wy = ((i * 61 - cam * 1) % (H - T + 40) + (H - T + 40)) % (H - T + 40) + T - 20; var wx = cx(wy + cam - jy) + ((i * 37) % 9 - 4) * hw * 0.18; c.moveTo(wx - 10, wy); c.quadraticCurveTo(wx, wy - 4, wx + 10, wy); } c.stroke();
        for (var side = -1; side <= 1; side += 2) {
          c.beginPath(); c.moveTo(side < 0 ? 0 : W, -st);
          for (y = -st; y <= H + st; y += st) { wy = y + cam - jy; c.lineTo(cx(wy) + side * hw, y); }
          c.lineTo(side < 0 ? 0 : W, H + st); c.closePath();
          c.fillStyle = '#EAD7A1'; c.fill();
          c.beginPath(); c.moveTo(side < 0 ? 0 : W, -st);
          for (y = -st; y <= H + st; y += st) { wy = y + cam - jy; c.lineTo(cx(wy) + side * (hw + sz * 0.35), y); }
          c.lineTo(side < 0 ? 0 : W, H + st); c.closePath(); c.fillStyle = '#15803D'; c.fill();
        }
        // palms along the banks
        var ps = (H - T) * 0.22;
        for (var k = Math.floor((cam - jy) / ps) - 1; k * ps < cam - jy + H + ps; k++) {
          var pyw = k * ps, py = scr(pyw) - jy + jy, s2 = (k % 2) ? -1 : 1, pxx = cx(pyw) + s2 * (hw + sz * (0.9 + (Math.abs(k) % 3) * 0.4));
          py = pyw - cam + jy; if (py < T - sz || py > H + sz) continue;
          circ(c, pxx + 5, py + 6, sz * 0.6, 'rgba(0,0,0,.2)'); c.drawImage(palm, pxx - sz * 0.8, py - sz * 0.8, sz * 1.6, sz * 1.6);
        }
        // wake
        for (i = 0; i < wake.length; i++) { var q = wake[i]; c.globalAlpha = Math.max(0, 0.5 - q.t * 0.45); circ(c, q.x + Math.sin(i) * q.t * 10, scr(q.y), sz * (0.12 + q.t * 0.3), '#F0FDFA'); }
        c.globalAlpha = 1;
        for (i = 0; i < obs.length; i++) {
          var o = obs[i], ox = o.x, oy = scr(o.y); if (oy < T - 60 || oy > H + 60) continue;
          if (o.k === 'rock') { circ(c, ox, oy, o.r * 1.25, 'rgba(255,255,255,.35)'); circ(c, ox, oy, o.r, rg(c, ox - o.r * 0.3, oy - o.r * 0.3, o.r, ['#D6D3D1', '#78716C', '#44403C'])); }
          else if (o.k === 'log') { c.fillStyle = 'rgba(255,255,255,.3)'; rr(c, ox - o.w / 2 - 4, oy - o.r - 3, o.w + 8, o.r * 2 + 6, o.r); c.fill(); c.fillStyle = lg(c, 0, oy - o.r, 0, oy + o.r, ['#B45309', '#78350F', '#451A03']); rr(c, ox - o.w / 2, oy - o.r, o.w, o.r * 2, o.r); c.fill(); circ(c, ox + o.w / 2 - o.r * 0.6, oy, o.r * 0.6, '#D97706'); }
          else { c.save(); c.translate(ox, oy); c.rotate(Math.cos(o.ph) * 0.3); c.drawImage(rv[o.c], -sz * 0.35, -sz * 0.6, sz * 0.7, sz * 1.2); c.restore(); }
        }
        if (pool) { c.save(); c.translate(pool.x, jy - sz * 0.2); for (i = 0; i < 4; i++) { c.strokeStyle = 'rgba(240,253,250,' + (0.6 - i * 0.12) + ')'; c.lineWidth = 3; c.beginPath(); c.arc(0, 0, sz * (0.4 + i * 0.35) * Math.min(1, pool.t * 2), t * 6 + i, t * 6 + i + 4); c.stroke(); } c.restore(); }
        var ang = lean + (dead ? dead.t * (dead.spin ? 9 : 4) : 0) + (pool ? pool.t * 8 : 0);
        c.save(); c.translate(x, jy); c.rotate(ang); c.drawImage(js, -sz * 0.35, -sz * 0.6, sz * 0.7, sz * 1.2); c.restore();
      },
      down: function (xx) { drag = { x: xx, s: tx }; },
      move: function (xx) { if (drag && !dead) tx = clamp(drag.s + (xx - drag.x) * 1.4, 0, W); },
      up: function () { drag = null; },
      key: function (k) { if (k === 'left') tx = Math.max(0, tx - W * 0.12); else if (k === 'right') tx = Math.min(W, tx + W * 0.12); },
      boom: function () { pool = { t: 0, x: x }; drag = null; A.sx('crash'); },
      win: function () { won = 0.001; drag = null; A.burst(x, jy, 16, ['#FDE68A', '#FFFFFF', '#EF4444'], 150, 0.6, 3); },
      dbg: function () { return { x: x, tx: tx, best: best(), dead: dead ? (dead.why || 1) : 0, n: obs.length, wid: wid }; }
    };
  }, 'drag', 0.5);
})(window.D6 = window.D6 || {});
