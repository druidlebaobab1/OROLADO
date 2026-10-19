/* v2796 (propriétaire) — SOCIAL « MESSAGERIE » comme WhatsApp / Telegram, dans le style OROLADO (nuit violette, or).
   Liste des discussions (avatar, nom, dernier message, heure, non lus, point « en ligne ») ; onglets Discussions · Groupes ·
   Amis ; vraie conversation (bulles, heure, ✓ / ✓✓, dates, barre d'écriture photo / note vocale / envoyer, états d'envoi) ;
   fiche du groupe (membres, lien d'invitation) ; demandes de contact Accepter / Refuser ; Envoyer de l'argent et Défier
   dans l'en-tête d'une conversation. Mêmes appels serveur que l'ancien Social (live.php) : aucune règle d'argent ici.
   Sur grand écran (≥ 860 px) : liste à gauche, conversation à droite. Rien ne tourne quand Social est fermé. */
(function (D6) {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  /* ---------- textes (12 langues ; anglais par défaut) ---------- */
  var S = {
    en: { title: 'Social', chats: 'Chats', groups: 'Groups', friends: 'Friends', search: 'Search', more: 'More', news: 'OROLADO News', newsSub: 'Official channel', team: 'OROLADO Team', teamSub: 'Write to us · we answer here', online: 'online',
      requests: 'Requests', reqHint: 'They wrote to you for the first time', reqRow: 'Message requests', reqBanner: 'This player wrote to you for the first time.', contacts: 'Contacts', addFriend: 'Add a friend', addGo: 'Add', share: 'Share',
      emptyChatsT: 'No chats yet', emptyChatsS: 'Add a friend with their ID (R…) or e-mail, then say hello.', emptyGroupsT: 'No groups yet', emptyGroupsS: 'Create a group and invite your friends, or accept an invitation.', emptyFriendsS: 'Share your ID, or type a friend’s ID or e-mail above.', noResult: 'Nothing found',
      newGroup: 'New group', create: 'Create', groupInfo: 'Group info', inviteLink: 'Invite link', today: 'Today', yday: 'Yesterday', sending: 'Sending…', failed: 'Not sent · tap to retry', photo: 'Photo', voice: 'Voice note', rec: 'Recording… tap ■ to stop',
      micErr: 'Microphone blocked: allow it in your browser.', audLimit: 'Voice note limit reached for today.', audBad: 'Voice note refused, try again.', noRec: 'Your phone cannot record here.', sendMoney: 'Send money', copyId: 'Copy ID', newChat: 'New chat', channelNote: 'Only OROLADO posts in this channel',
      guestT: 'Sign up to chat', guestS: 'Create your free account to chat with friends, join groups and write to the team.', sayHi: 'Say hello 👋', pickChat: 'Pick a chat to start', duelHint: 'Pick a friend, then tap ⚔️', write: 'Message', members: 'Members' },
    fr: { title: 'Social', chats: 'Discussions', groups: 'Groupes', friends: 'Amis', search: 'Rechercher', more: 'Plus', news: 'Actus OROLADO', newsSub: 'Chaîne officielle', team: 'Équipe OROLADO', teamSub: 'Écris-nous · on te répond ici', online: 'en ligne',
      requests: 'Demandes', reqHint: 'Ils t’écrivent pour la 1re fois', reqRow: 'Demandes de message', reqBanner: 'Ce joueur t’écrit pour la première fois.', contacts: 'Contacts', addFriend: 'Ajouter un ami', addGo: 'Ajouter', share: 'Partager',
      emptyChatsT: 'Aucune discussion', emptyChatsS: 'Ajoute un ami avec son identifiant (R…) ou son e-mail, puis dis-lui bonjour.', emptyGroupsT: 'Aucun groupe', emptyGroupsS: 'Crée un groupe et invite tes amis, ou accepte une invitation.', emptyFriendsS: 'Partage ton identifiant, ou tape celui d’un ami ou son e-mail au-dessus.', noResult: 'Aucun résultat',
      newGroup: 'Nouveau groupe', create: 'Créer', groupInfo: 'Infos du groupe', inviteLink: 'Lien d’invitation', today: 'Aujourd’hui', yday: 'Hier', sending: 'Envoi…', failed: 'Non envoyé · touche pour réessayer', photo: 'Photo', voice: 'Note vocale', rec: 'Enregistrement… touche ■ pour arrêter',
      micErr: 'Micro refusé : autorise le micro dans ton navigateur.', audLimit: 'Limite de notes vocales atteinte pour aujourd’hui.', audBad: 'Note vocale refusée, réessaie.', noRec: 'Ton téléphone ne permet pas d’enregistrer ici.', sendMoney: 'Envoyer de l’argent', copyId: 'Copier l’identifiant', newChat: 'Nouvelle discussion', channelNote: 'Seul OROLADO publie dans cette chaîne',
      guestT: 'Inscris-toi pour discuter', guestS: 'Crée ton compte gratuit pour discuter avec tes amis, rejoindre des groupes et écrire à l’équipe.', sayHi: 'Dis bonjour 👋', pickChat: 'Choisis une discussion', duelHint: 'Choisis un ami, puis touche ⚔️', write: 'Message', members: 'Membres' },
    es: { title: 'Social', chats: 'Chats', groups: 'Grupos', friends: 'Amigos', search: 'Buscar', more: 'Más', news: 'Noticias OROLADO', newsSub: 'Canal oficial', team: 'Equipo OROLADO', teamSub: 'Escríbenos · te respondemos aquí', online: 'en línea',
      requests: 'Solicitudes', reqHint: 'Te escriben por primera vez', reqRow: 'Solicitudes de mensaje', reqBanner: 'Este jugador te escribe por primera vez.', contacts: 'Contactos', addFriend: 'Añadir un amigo', addGo: 'Añadir', share: 'Compartir',
      emptyChatsT: 'Aún no hay chats', emptyChatsS: 'Añade a un amigo con su ID (R…) o su correo y salúdalo.', emptyGroupsT: 'Aún no hay grupos', emptyGroupsS: 'Crea un grupo e invita a tus amigos, o acepta una invitación.', emptyFriendsS: 'Comparte tu ID o escribe arriba el ID o correo de un amigo.', noResult: 'Sin resultados',
      newGroup: 'Nuevo grupo', create: 'Crear', groupInfo: 'Info del grupo', inviteLink: 'Enlace de invitación', today: 'Hoy', yday: 'Ayer', sending: 'Enviando…', failed: 'No enviado · toca para reintentar', photo: 'Foto', voice: 'Nota de voz', rec: 'Grabando… toca ■ para parar',
      micErr: 'Micrófono bloqueado: permítelo en tu navegador.', audLimit: 'Límite de notas de voz alcanzado hoy.', audBad: 'Nota de voz rechazada, inténtalo de nuevo.', noRec: 'Tu teléfono no puede grabar aquí.', sendMoney: 'Enviar dinero', copyId: 'Copiar ID', newChat: 'Nuevo chat', channelNote: 'Solo OROLADO publica en este canal',
      guestT: 'Regístrate para chatear', guestS: 'Crea tu cuenta gratis para chatear con amigos, unirte a grupos y escribir al equipo.', sayHi: 'Saluda 👋', pickChat: 'Elige un chat', duelHint: 'Elige un amigo y toca ⚔️', write: 'Mensaje', members: 'Miembros' },
    pt: { title: 'Social', chats: 'Conversas', groups: 'Grupos', friends: 'Amigos', search: 'Pesquisar', more: 'Mais', news: 'Notícias OROLADO', newsSub: 'Canal oficial', team: 'Equipa OROLADO', teamSub: 'Escreve-nos · respondemos aqui', online: 'online',
      requests: 'Pedidos', reqHint: 'Escrevem-te pela 1.ª vez', reqRow: 'Pedidos de mensagem', reqBanner: 'Este jogador escreve-te pela primeira vez.', contacts: 'Contactos', addFriend: 'Adicionar amigo', addGo: 'Adicionar', share: 'Partilhar',
      emptyChatsT: 'Ainda sem conversas', emptyChatsS: 'Adiciona um amigo com o ID (R…) ou e-mail e diz olá.', emptyGroupsT: 'Ainda sem grupos', emptyGroupsS: 'Cria um grupo e convida os teus amigos, ou aceita um convite.', emptyFriendsS: 'Partilha o teu ID, ou escreve acima o ID ou e-mail de um amigo.', noResult: 'Nada encontrado',
      newGroup: 'Novo grupo', create: 'Criar', groupInfo: 'Info do grupo', inviteLink: 'Link de convite', today: 'Hoje', yday: 'Ontem', sending: 'A enviar…', failed: 'Não enviado · toca para repetir', photo: 'Foto', voice: 'Nota de voz', rec: 'A gravar… toca ■ para parar',
      micErr: 'Microfone bloqueado: permite-o no navegador.', audLimit: 'Limite de notas de voz atingido hoje.', audBad: 'Nota de voz recusada, tenta de novo.', noRec: 'O teu telemóvel não pode gravar aqui.', sendMoney: 'Enviar dinheiro', copyId: 'Copiar ID', newChat: 'Nova conversa', channelNote: 'Só a OROLADO publica neste canal',
      guestT: 'Regista-te para conversar', guestS: 'Cria a tua conta grátis para falar com amigos, entrar em grupos e escrever à equipa.', sayHi: 'Diz olá 👋', pickChat: 'Escolhe uma conversa', duelHint: 'Escolhe um amigo e toca ⚔️', write: 'Mensagem', members: 'Membros' },
    ar: { title: 'Social', chats: 'المحادثات', groups: 'المجموعات', friends: 'الأصدقاء', search: 'بحث', more: 'المزيد', news: 'أخبار OROLADO', newsSub: 'القناة الرسمية', team: 'فريق OROLADO', teamSub: 'راسلنا · نرد عليك هنا', online: 'متصل',
      requests: 'الطلبات', reqHint: 'يراسلونك لأول مرة', reqRow: 'طلبات المراسلة', reqBanner: 'هذا اللاعب يراسلك لأول مرة.', contacts: 'جهات الاتصال', addFriend: 'إضافة صديق', addGo: 'إضافة', share: 'مشاركة',
      emptyChatsT: 'لا توجد محادثات بعد', emptyChatsS: 'أضف صديقًا بمعرّفه (R…) أو بريده ثم قل مرحبًا.', emptyGroupsT: 'لا توجد مجموعات بعد', emptyGroupsS: 'أنشئ مجموعة وادعُ أصدقاءك، أو اقبل دعوة.', emptyFriendsS: 'شارك معرّفك، أو اكتب معرّف صديق أو بريده في الأعلى.', noResult: 'لا نتائج',
      newGroup: 'مجموعة جديدة', create: 'إنشاء', groupInfo: 'معلومات المجموعة', inviteLink: 'رابط الدعوة', today: 'اليوم', yday: 'أمس', sending: 'جارٍ الإرسال…', failed: 'لم يُرسل · اضغط لإعادة المحاولة', photo: 'صورة', voice: 'رسالة صوتية', rec: 'جارٍ التسجيل… اضغط ■ للإيقاف',
      micErr: 'الميكروفون محظور: اسمح به في المتصفح.', audLimit: 'تم بلوغ حد الرسائل الصوتية لليوم.', audBad: 'تم رفض الرسالة الصوتية، حاول مجددًا.', noRec: 'لا يمكن لهاتفك التسجيل هنا.', sendMoney: 'إرسال المال', copyId: 'نسخ المعرّف', newChat: 'محادثة جديدة', channelNote: 'تنشر OROLADO فقط في هذه القناة',
      guestT: 'سجّل للدردشة', guestS: 'أنشئ حسابك المجاني للدردشة مع أصدقائك والانضمام إلى المجموعات ومراسلة الفريق.', sayHi: 'قل مرحبًا 👋', pickChat: 'اختر محادثة', duelHint: 'اختر صديقًا ثم اضغط ⚔️', write: 'رسالة', members: 'الأعضاء' },
    tr: { title: 'Social', chats: 'Sohbetler', groups: 'Gruplar', friends: 'Arkadaşlar', search: 'Ara', more: 'Daha fazla', news: 'OROLADO Haberler', newsSub: 'Resmî kanal', team: 'OROLADO Ekibi', teamSub: 'Bize yaz · burada yanıtlıyoruz', online: 'çevrimiçi',
      requests: 'İstekler', reqHint: 'Sana ilk kez yazıyorlar', reqRow: 'Mesaj istekleri', reqBanner: 'Bu oyuncu sana ilk kez yazıyor.', contacts: 'Kişiler', addFriend: 'Arkadaş ekle', addGo: 'Ekle', share: 'Paylaş',
      emptyChatsT: 'Henüz sohbet yok', emptyChatsS: 'Bir arkadaşını kimliği (R…) veya e-postasıyla ekle ve selam ver.', emptyGroupsT: 'Henüz grup yok', emptyGroupsS: 'Bir grup kur ve arkadaşlarını davet et ya da bir daveti kabul et.', emptyFriendsS: 'Kimliğini paylaş ya da yukarıya bir arkadaşının kimliğini veya e-postasını yaz.', noResult: 'Sonuç yok',
      newGroup: 'Yeni grup', create: 'Oluştur', groupInfo: 'Grup bilgisi', inviteLink: 'Davet bağlantısı', today: 'Bugün', yday: 'Dün', sending: 'Gönderiliyor…', failed: 'Gönderilmedi · tekrar için dokun', photo: 'Fotoğraf', voice: 'Sesli not', rec: 'Kaydediliyor… durdurmak için ■',
      micErr: 'Mikrofon engelli: tarayıcıda izin ver.', audLimit: 'Bugünkü sesli not sınırına ulaşıldı.', audBad: 'Sesli not reddedildi, tekrar dene.', noRec: 'Telefonun burada kayıt yapamıyor.', sendMoney: 'Para gönder', copyId: 'Kimliği kopyala', newChat: 'Yeni sohbet', channelNote: 'Bu kanalda yalnızca OROLADO paylaşır',
      guestT: 'Sohbet için kaydol', guestS: 'Arkadaşlarınla sohbet etmek, gruplara katılmak ve ekibe yazmak için ücretsiz hesabını oluştur.', sayHi: 'Selam ver 👋', pickChat: 'Bir sohbet seç', duelHint: 'Bir arkadaş seç, sonra ⚔️', write: 'Mesaj', members: 'Üyeler' },
    vi: { title: 'Social', chats: 'Trò chuyện', groups: 'Nhóm', friends: 'Bạn bè', search: 'Tìm kiếm', more: 'Thêm', news: 'Tin OROLADO', newsSub: 'Kênh chính thức', team: 'Đội OROLADO', teamSub: 'Nhắn cho chúng tôi · trả lời tại đây', online: 'trực tuyến',
      requests: 'Yêu cầu', reqHint: 'Họ nhắn cho bạn lần đầu', reqRow: 'Yêu cầu nhắn tin', reqBanner: 'Người chơi này nhắn cho bạn lần đầu.', contacts: 'Danh bạ', addFriend: 'Thêm bạn', addGo: 'Thêm', share: 'Chia sẻ',
      emptyChatsT: 'Chưa có trò chuyện', emptyChatsS: 'Thêm bạn bằng ID (R…) hoặc email, rồi chào họ.', emptyGroupsT: 'Chưa có nhóm', emptyGroupsS: 'Tạo nhóm và mời bạn bè, hoặc chấp nhận một lời mời.', emptyFriendsS: 'Chia sẻ ID của bạn, hoặc nhập ID hay email của bạn bè ở trên.', noResult: 'Không tìm thấy',
      newGroup: 'Nhóm mới', create: 'Tạo', groupInfo: 'Thông tin nhóm', inviteLink: 'Liên kết mời', today: 'Hôm nay', yday: 'Hôm qua', sending: 'Đang gửi…', failed: 'Chưa gửi · chạm để thử lại', photo: 'Ảnh', voice: 'Ghi âm', rec: 'Đang ghi… chạm ■ để dừng',
      micErr: 'Micro bị chặn: hãy cho phép trong trình duyệt.', audLimit: 'Đã đạt giới hạn ghi âm hôm nay.', audBad: 'Ghi âm bị từ chối, thử lại.', noRec: 'Điện thoại của bạn không ghi âm được ở đây.', sendMoney: 'Gửi tiền', copyId: 'Sao chép ID', newChat: 'Trò chuyện mới', channelNote: 'Chỉ OROLADO đăng trong kênh này',
      guestT: 'Đăng ký để trò chuyện', guestS: 'Tạo tài khoản miễn phí để trò chuyện với bạn bè, vào nhóm và nhắn cho đội.', sayHi: 'Chào nhé 👋', pickChat: 'Chọn một cuộc trò chuyện', duelHint: 'Chọn một bạn, rồi chạm ⚔️', write: 'Nhắn tin', members: 'Thành viên' },
    id: { title: 'Social', chats: 'Obrolan', groups: 'Grup', friends: 'Teman', search: 'Cari', more: 'Lainnya', news: 'Berita OROLADO', newsSub: 'Kanal resmi', team: 'Tim OROLADO', teamSub: 'Tulis ke kami · kami jawab di sini', online: 'online',
      requests: 'Permintaan', reqHint: 'Mereka menulis untuk pertama kali', reqRow: 'Permintaan pesan', reqBanner: 'Pemain ini menulis kepadamu untuk pertama kali.', contacts: 'Kontak', addFriend: 'Tambah teman', addGo: 'Tambah', share: 'Bagikan',
      emptyChatsT: 'Belum ada obrolan', emptyChatsS: 'Tambahkan teman dengan ID (R…) atau email-nya, lalu sapa.', emptyGroupsT: 'Belum ada grup', emptyGroupsS: 'Buat grup dan undang temanmu, atau terima undangan.', emptyFriendsS: 'Bagikan ID-mu, atau ketik ID atau email teman di atas.', noResult: 'Tidak ditemukan',
      newGroup: 'Grup baru', create: 'Buat', groupInfo: 'Info grup', inviteLink: 'Tautan undangan', today: 'Hari ini', yday: 'Kemarin', sending: 'Mengirim…', failed: 'Tidak terkirim · ketuk untuk ulang', photo: 'Foto', voice: 'Pesan suara', rec: 'Merekam… ketuk ■ untuk berhenti',
      micErr: 'Mikrofon diblokir: izinkan di browser.', audLimit: 'Batas pesan suara hari ini tercapai.', audBad: 'Pesan suara ditolak, coba lagi.', noRec: 'Ponselmu tidak bisa merekam di sini.', sendMoney: 'Kirim uang', copyId: 'Salin ID', newChat: 'Obrolan baru', channelNote: 'Hanya OROLADO yang memposting di kanal ini',
      guestT: 'Daftar untuk mengobrol', guestS: 'Buat akun gratis untuk mengobrol dengan teman, bergabung ke grup, dan menulis ke tim.', sayHi: 'Sapa 👋', pickChat: 'Pilih obrolan', duelHint: 'Pilih teman, lalu ketuk ⚔️', write: 'Pesan', members: 'Anggota' },
    ru: { title: 'Social', chats: 'Чаты', groups: 'Группы', friends: 'Друзья', search: 'Поиск', more: 'Ещё', news: 'Новости OROLADO', newsSub: 'Официальный канал', team: 'Команда OROLADO', teamSub: 'Напишите нам · ответим здесь', online: 'в сети',
      requests: 'Запросы', reqHint: 'Пишут вам впервые', reqRow: 'Запросы на переписку', reqBanner: 'Этот игрок пишет вам впервые.', contacts: 'Контакты', addFriend: 'Добавить друга', addGo: 'Добавить', share: 'Поделиться',
      emptyChatsT: 'Пока нет чатов', emptyChatsS: 'Добавьте друга по ID (R…) или e-mail и поздоровайтесь.', emptyGroupsT: 'Пока нет групп', emptyGroupsS: 'Создайте группу и пригласите друзей или примите приглашение.', emptyFriendsS: 'Поделитесь своим ID или введите выше ID или e-mail друга.', noResult: 'Ничего не найдено',
      newGroup: 'Новая группа', create: 'Создать', groupInfo: 'О группе', inviteLink: 'Ссылка-приглашение', today: 'Сегодня', yday: 'Вчера', sending: 'Отправка…', failed: 'Не отправлено · нажмите, чтобы повторить', photo: 'Фото', voice: 'Голосовое', rec: 'Запись… нажмите ■, чтобы остановить',
      micErr: 'Микрофон запрещён: разрешите его в браузере.', audLimit: 'Лимит голосовых на сегодня исчерпан.', audBad: 'Голосовое отклонено, попробуйте снова.', noRec: 'Ваш телефон не может записывать здесь.', sendMoney: 'Отправить деньги', copyId: 'Копировать ID', newChat: 'Новый чат', channelNote: 'В этом канале пишет только OROLADO',
      guestT: 'Зарегистрируйтесь, чтобы общаться', guestS: 'Создайте бесплатный аккаунт, чтобы общаться с друзьями, вступать в группы и писать команде.', sayHi: 'Поздоровайтесь 👋', pickChat: 'Выберите чат', duelHint: 'Выберите друга и нажмите ⚔️', write: 'Написать', members: 'Участники' },
    de: { title: 'Social', chats: 'Chats', groups: 'Gruppen', friends: 'Freunde', search: 'Suchen', more: 'Mehr', news: 'OROLADO News', newsSub: 'Offizieller Kanal', team: 'OROLADO Team', teamSub: 'Schreib uns · wir antworten hier', online: 'online',
      requests: 'Anfragen', reqHint: 'Sie schreiben dir zum ersten Mal', reqRow: 'Nachrichtenanfragen', reqBanner: 'Dieser Spieler schreibt dir zum ersten Mal.', contacts: 'Kontakte', addFriend: 'Freund hinzufügen', addGo: 'Hinzufügen', share: 'Teilen',
      emptyChatsT: 'Noch keine Chats', emptyChatsS: 'Füge einen Freund mit seiner ID (R…) oder E-Mail hinzu und sag Hallo.', emptyGroupsT: 'Noch keine Gruppen', emptyGroupsS: 'Erstelle eine Gruppe und lade Freunde ein, oder nimm eine Einladung an.', emptyFriendsS: 'Teile deine ID oder gib oben die ID oder E-Mail eines Freundes ein.', noResult: 'Nichts gefunden',
      newGroup: 'Neue Gruppe', create: 'Erstellen', groupInfo: 'Gruppeninfo', inviteLink: 'Einladungslink', today: 'Heute', yday: 'Gestern', sending: 'Wird gesendet…', failed: 'Nicht gesendet · tippen zum Wiederholen', photo: 'Foto', voice: 'Sprachnachricht', rec: 'Aufnahme… ■ tippen zum Stoppen',
      micErr: 'Mikrofon blockiert: im Browser erlauben.', audLimit: 'Limit für Sprachnachrichten heute erreicht.', audBad: 'Sprachnachricht abgelehnt, nochmal versuchen.', noRec: 'Dein Handy kann hier nicht aufnehmen.', sendMoney: 'Geld senden', copyId: 'ID kopieren', newChat: 'Neuer Chat', channelNote: 'Nur OROLADO postet in diesem Kanal',
      guestT: 'Registriere dich zum Chatten', guestS: 'Erstelle dein kostenloses Konto, um mit Freunden zu chatten, Gruppen beizutreten und dem Team zu schreiben.', sayHi: 'Sag Hallo 👋', pickChat: 'Wähle einen Chat', duelHint: 'Wähle einen Freund, dann ⚔️', write: 'Nachricht', members: 'Mitglieder' },
    hi: { title: 'Social', chats: 'चैट', groups: 'ग्रुप', friends: 'दोस्त', search: 'खोजें', more: 'और', news: 'OROLADO समाचार', newsSub: 'आधिकारिक चैनल', team: 'OROLADO टीम', teamSub: 'हमें लिखें · हम यहीं जवाब देते हैं', online: 'ऑनलाइन',
      requests: 'अनुरोध', reqHint: 'उन्होंने पहली बार लिखा है', reqRow: 'संदेश अनुरोध', reqBanner: 'इस खिलाड़ी ने आपको पहली बार लिखा है।', contacts: 'संपर्क', addFriend: 'दोस्त जोड़ें', addGo: 'जोड़ें', share: 'शेयर करें',
      emptyChatsT: 'अभी कोई चैट नहीं', emptyChatsS: 'दोस्त को उसकी ID (R…) या ईमेल से जोड़ें, फिर हैलो कहें।', emptyGroupsT: 'अभी कोई ग्रुप नहीं', emptyGroupsS: 'ग्रुप बनाएँ और दोस्तों को बुलाएँ, या कोई आमंत्रण स्वीकार करें।', emptyFriendsS: 'अपनी ID शेयर करें, या ऊपर दोस्त की ID या ईमेल लिखें।', noResult: 'कुछ नहीं मिला',
      newGroup: 'नया ग्रुप', create: 'बनाएँ', groupInfo: 'ग्रुप जानकारी', inviteLink: 'आमंत्रण लिंक', today: 'आज', yday: 'कल', sending: 'भेजा जा रहा है…', failed: 'नहीं भेजा · फिर से टैप करें', photo: 'फ़ोटो', voice: 'वॉइस नोट', rec: 'रिकॉर्डिंग… रोकने के लिए ■',
      micErr: 'माइक्रोफ़ोन बंद है: ब्राउज़र में अनुमति दें।', audLimit: 'आज की वॉइस नोट सीमा पूरी हो गई।', audBad: 'वॉइस नोट अस्वीकार, फिर कोशिश करें।', noRec: 'आपका फ़ोन यहाँ रिकॉर्ड नहीं कर सकता।', sendMoney: 'पैसे भेजें', copyId: 'ID कॉपी करें', newChat: 'नई चैट', channelNote: 'इस चैनल में सिर्फ़ OROLADO पोस्ट करता है',
      guestT: 'चैट के लिए साइन अप करें', guestS: 'दोस्तों से चैट करने, ग्रुप में जुड़ने और टीम को लिखने के लिए मुफ़्त खाता बनाएँ।', sayHi: 'हैलो कहें 👋', pickChat: 'कोई चैट चुनें', duelHint: 'दोस्त चुनें, फिर ⚔️ दबाएँ', write: 'संदेश', members: 'सदस्य' },
    zh: { title: 'Social', chats: '聊天', groups: '群组', friends: '好友', search: '搜索', more: '更多', news: 'OROLADO 动态', newsSub: '官方频道', team: 'OROLADO 团队', teamSub: '给我们留言 · 在这里回复你', online: '在线',
      requests: '请求', reqHint: '他们第一次给你发消息', reqRow: '消息请求', reqBanner: '这位玩家第一次给你发消息。', contacts: '联系人', addFriend: '添加好友', addGo: '添加', share: '分享',
      emptyChatsT: '还没有聊天', emptyChatsS: '用好友的 ID（R…）或邮箱添加好友，然后打个招呼。', emptyGroupsT: '还没有群组', emptyGroupsS: '创建群组并邀请好友，或接受邀请。', emptyFriendsS: '分享你的 ID，或在上方输入好友的 ID 或邮箱。', noResult: '没有结果',
      newGroup: '新建群组', create: '创建', groupInfo: '群组信息', inviteLink: '邀请链接', today: '今天', yday: '昨天', sending: '发送中…', failed: '未发送 · 点击重试', photo: '照片', voice: '语音', rec: '录音中… 点击 ■ 停止',
      micErr: '麦克风被禁止：请在浏览器中允许。', audLimit: '今天的语音消息已达上限。', audBad: '语音消息发送失败，请重试。', noRec: '你的手机无法在此录音。', sendMoney: '转账', copyId: '复制 ID', newChat: '新聊天', channelNote: '此频道仅由 OROLADO 发布',
      guestT: '注册后即可聊天', guestS: '创建免费账户，与好友聊天、加入群组并联系团队。', sayHi: '打个招呼 👋', pickChat: '选择一个聊天', duelHint: '选择好友，然后点 ⚔️', write: '发消息', members: '成员' }
  };
  var EMO = ['💬', '🔥', '🚀', '💎', '🏆', '⚡', '🌍', '🦁', '👑', '🎯', '💰', '🎉'];
  var AVC = ['#F97316', '#3B82F6', '#22C55E', '#A855F7', '#EC4899', '#14B8A6', '#EAB308', '#EF4444'];
  function lg() { return (document.documentElement.lang || 'en').slice(0, 2); }
  function fmt(s, o) { return String(s).replace(/\{(\w+)\}/g, function (m, k) { return o && o[k] != null ? o[k] : m; }); }
  function t(k, o) { var a = S[lg()] || {}; var s = a[k] != null ? a[k] : (S.en[k] != null ? S.en[k] : k); return o ? fmt(s, o) : s; }
  function LT(m) { var T = D6.LIVE_T && D6.LIVE_T[m]; if (!T) return {}; return Object.assign({}, T.en || {}, T[lg()] || {}); }
  // mots de la fiche du groupe absents des anciens packs de langue (es, pt, ar, tr, vi, id, ru, de, hi)
  var SG = {en: {"group": "Group", "addMem": "Add members", "copyLink": "Copy link", "admin": "Admin", "exit": "Exit group", "you": "You", "pickNone": "You have no contacts yet. Write to a friend first, or send them the link with “Invite”.", "sysAdd": "{a} added {b}", "inGrp": "Already in the group", "gNoneAdded": "Nobody could be added."}, es: {"group": "Grupo", "addMem": "Añadir miembros", "copyLink": "Copiar enlace", "admin": "Admin", "exit": "Salir del grupo", "you": "Tú", "pickNone": "Aún no tienes contactos. Escribe primero a un amigo, o envíale el enlace con «Invitar».", "sysAdd": "{a} añadió a {b}", "inGrp": "Ya está en el grupo", "gNoneAdded": "No se pudo añadir a nadie."}, pt: {"group": "Grupo", "addMem": "Adicionar membros", "copyLink": "Copiar link", "admin": "Admin", "exit": "Sair do grupo", "you": "Tu", "pickNone": "Ainda não tens contactos. Escreve primeiro a um amigo, ou envia-lhe o link com «Convidar».", "sysAdd": "{a} adicionou {b}", "inGrp": "Já está no grupo", "gNoneAdded": "Ninguém pôde ser adicionado."}, ar: {"group": "مجموعة", "addMem": "إضافة أعضاء", "copyLink": "نسخ الرابط", "admin": "مشرف", "exit": "مغادرة المجموعة", "you": "أنت", "pickNone": "ليست لديك جهات اتصال بعد. راسل صديقًا أولًا، أو أرسل له الرابط عبر «دعوة».", "sysAdd": "{a} أضاف {b}", "inGrp": "موجود في المجموعة", "gNoneAdded": "لم تتم إضافة أحد."}, tr: {"group": "Grup", "addMem": "Üye ekle", "copyLink": "Bağlantıyı kopyala", "admin": "Yönetici", "exit": "Gruptan çık", "you": "Sen", "pickNone": "Henüz kişin yok. Önce bir arkadaşına yaz ya da «Davet et» ile bağlantıyı gönder.", "sysAdd": "{a}, {b} kişisini ekledi", "inGrp": "Zaten grupta", "gNoneAdded": "Kimse eklenemedi."}, vi: {"group": "Nhóm", "addMem": "Thêm thành viên", "copyLink": "Sao chép liên kết", "admin": "Quản trị", "exit": "Rời nhóm", "you": "Bạn", "pickNone": "Bạn chưa có liên hệ. Hãy nhắn cho một người bạn trước, hoặc gửi liên kết bằng «Mời».", "sysAdd": "{a} đã thêm {b}", "inGrp": "Đã ở trong nhóm", "gNoneAdded": "Không thêm được ai."}, id: {"group": "Grup", "addMem": "Tambah anggota", "copyLink": "Salin tautan", "admin": "Admin", "exit": "Keluar grup", "you": "Kamu", "pickNone": "Kamu belum punya kontak. Tulis dulu ke teman, atau kirim tautan dengan «Undang».", "sysAdd": "{a} menambahkan {b}", "inGrp": "Sudah di grup", "gNoneAdded": "Tidak ada yang bisa ditambahkan."}, ru: {"group": "Группа", "addMem": "Добавить участников", "copyLink": "Копировать ссылку", "admin": "Админ", "exit": "Выйти из группы", "you": "Вы", "pickNone": "У вас ещё нет контактов. Сначала напишите другу или отправьте ему ссылку через «Пригласить».", "sysAdd": "{a} добавил(а) {b}", "inGrp": "Уже в группе", "gNoneAdded": "Никого не удалось добавить."}, de: {"group": "Gruppe", "addMem": "Mitglieder hinzufügen", "copyLink": "Link kopieren", "admin": "Admin", "exit": "Gruppe verlassen", "you": "Du", "pickNone": "Du hast noch keine Kontakte. Schreib zuerst einem Freund oder schick ihm den Link mit „Einladen“.", "sysAdd": "{a} hat {b} hinzugefügt", "inGrp": "Schon in der Gruppe", "gNoneAdded": "Niemand konnte hinzugefügt werden."}, hi: {"group": "ग्रुप", "addMem": "सदस्य जोड़ें", "copyLink": "लिंक कॉपी करें", "admin": "एडमिन", "exit": "ग्रुप छोड़ें", "you": "आप", "pickNone": "अभी आपके कोई संपर्क नहीं हैं। पहले किसी दोस्त को लिखें, या «आमंत्रित करें» से लिंक भेजें।", "sysAdd": "{a} ने {b} को जोड़ा", "inGrp": "पहले से ग्रुप में", "gNoneAdded": "किसी को नहीं जोड़ा जा सका।"}};
  function GX() { var l = lg(), b = D6.LiveGroups && D6.LiveGroups.t ? D6.LiveGroups.t() : LT('groups'); return Object.assign({}, SG.en, b, (l === 'fr' || l === 'en' || l === 'zh') ? {} : (SG[l] || {})); }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function linkify(s) { return esc(s).replace(/(https:\/\/[^\s<]+|orolado\.com)/g, function (u) { var h = u.indexOf('http') === 0 ? u : 'https://' + u; return '<a href="' + h + '" target="_blank" rel="noopener">' + u + '</a>'; }); }
  function avc(n) { var h = 0; String(n || '').split('').forEach(function (c) { h = (h * 31 + c.charCodeAt(0)) % 997; }); return AVC[h % AVC.length]; }
  function ini(n) { n = String(n || '?').trim(); return esc((Array.from(n)[0] || '?').toUpperCase()); }
  function guest() { return document.documentElement.classList.contains('oro-guest') || !(D6.Api && D6.Api.token && D6.Api.token()); }
  function toast(m, k) { if (D6.App && D6.App.toast) D6.App.toast(m, k || 'ok'); }
  function store(k, v) { try { if (v === undefined) return JSON.parse(localStorage.getItem(k) || 'null'); localStorage.setItem(k, JSON.stringify(v)); } catch (e) { return null; } return v; }
  function isAud(u) { return /\.(webm|m4a|ogg)$/.test(String(u || '')); }
  function noEmo(s) { return String(s || '').replace(/^[^0-9A-Za-z\u00C0-\uFFFF]*[\u2600-\u27BF\uD83C-\uDBFF\uDC00-\uDFFF\uFE0F]+\s*/, ''); }
  function soft(k) { var n = 0; try { n = +(localStorage.getItem('oro_soft_' + k) || 0); if (n < 3) localStorage.setItem('oro_soft_' + k, String(n + 1)); } catch (e) { n = 0; } return n < 3; }
  async function call(action, data) {
    try {
      var r = await fetch('live.php', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin', cache: 'no-store',
        body: JSON.stringify(Object.assign({ action: action, token: (D6.Api && D6.Api.token) ? D6.Api.token() : '' }, data || {})) });
      return await r.json();
    } catch (e) { return null; }
  }
  /* ---------- textes élastiques : une ligne, la police rapetisse seule ---------- */
  function fitEl(el) {
    if (!el || !el.isConnected || !el.clientWidth) return;
    el.style.removeProperty('font-size');
    var fs = parseFloat(getComputedStyle(el).fontSize) || 14, min = Math.max(7, fs * 0.5), n = 0;
    while (el.scrollWidth > el.clientWidth + 1 && fs > min && n++ < 30) { fs = Math.max(min, fs * 0.93); el.style.setProperty('font-size', fs.toFixed(1) + 'px', 'important'); }
  }
  // champ vide : le texte d'aide (placeholder) tient sur UNE ligne, la police rapetisse s'il le faut
  var phCv = null;
  function fitPh(el) {
    if (!el || !el.isConnected || !el.placeholder) return;
    el.style.removeProperty('font-size'); el.classList.toggle('sx-empty-in', !el.value);
    if (el.value) return;
    var cs = getComputedStyle(el), w = el.clientWidth - (parseFloat(cs.paddingLeft) || 0) - (parseFloat(cs.paddingRight) || 0) - 4;
    if (w <= 0) return;
    phCv = phCv || document.createElement('canvas');
    var ctx = phCv.getContext('2d'), fs = parseFloat(cs.fontSize) || 15;
    ctx.font = cs.fontWeight + ' ' + fs + 'px ' + cs.fontFamily;
    var tw = ctx.measureText(el.placeholder).width;
    if (tw > w * 0.95) el.style.setProperty('font-size', Math.max(10, fs * w * 0.93 / tw).toFixed(1) + 'px', 'important');
  }
  function fitAll(r) { r = r || root || document; r.querySelectorAll('.fit').forEach(fitEl); r.querySelectorAll('input[placeholder], textarea[placeholder]').forEach(fitPh); }
  document.addEventListener('input', function (e) { var el = e.target; if (el && el.closest && el.closest('.sx') && el.placeholder) fitPh(el); }, true);
  /* ---------- heures et dates ---------- */
  function loc() { return lg() + '-u-nu-latn'; }
  function hm(at) { try { return new Date(at * 1000).toLocaleTimeString(loc(), { hour: '2-digit', minute: '2-digit' }); } catch (e) { var d = new Date(at * 1000); return d.getHours() + ':' + ('0' + d.getMinutes()).slice(-2); } }
  function dayN(at) { var d = new Date(at * 1000); return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime(); }
  function dayLabel(at) {
    var diff = Math.round((dayN(Date.now() / 1000) - dayN(at)) / 86400000);
    if (diff === 0) return t('today'); if (diff === 1) return t('yday');
    try { return new Date(at * 1000).toLocaleDateString(loc(), diff < 7 ? { weekday: 'long' } : { day: 'numeric', month: 'long', year: diff > 300 ? 'numeric' : undefined }); } catch (e) { return new Date(at * 1000).toDateString(); }
  }
  function when(at) {
    if (!at) return '';
    var diff = Math.round((dayN(Date.now() / 1000) - dayN(at)) / 86400000);
    if (diff === 0) return hm(at); if (diff === 1) return t('yday');
    try { return new Date(at * 1000).toLocaleDateString(loc(), diff < 7 ? { weekday: 'short' } : { day: '2-digit', month: '2-digit' }); } catch (e) { return ''; }
  }
  /* ---------- petites icônes (traits, couleur = currentColor) ---------- */
  var IC = {
    back: '<path d="M15 5l-7 7 7 7"/>', search: '<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/>', grid: '<rect x="4" y="4" width="6.5" height="6.5" rx="2"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="2"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="2"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="2"/>',
    dots: '<circle cx="12" cy="5.5" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="12" cy="18.5" r="1.4"/>', cam: '<path d="M4 8.5A2.5 2.5 0 0 1 6.5 6h1.7l1.3-2h5l1.3 2h1.7A2.5 2.5 0 0 1 20 8.5v8A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5z"/><circle cx="12" cy="12.5" r="3.4"/>',
    mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21"/>', send: '<path d="M4 12l16-8-6 16-2.5-6.5z"/>', stop: '<rect x="7" y="7" width="10" height="10" rx="2"/>',
    money: '<circle cx="12" cy="12" r="8.5"/><path d="M14.8 9.3c-.5-1-1.6-1.6-2.8-1.6-1.6 0-2.8.9-2.8 2.1 0 2.9 5.8 1.5 5.8 4.4 0 1.2-1.3 2.1-3 2.1-1.3 0-2.5-.6-3-1.7M12 6v1.7M12 16.3V18"/>',
    duel: '<path d="M5 4l9.5 9.5M19 4l-9.5 9.5M8 14.5l-3 3M6.5 13l4.5 4.5M16 14.5l3 3M17.5 13l-4.5 4.5M4 20l2-2M20 20l-2-2"/>', x: '<path d="M6 6l12 12M18 6L6 18"/>', plus: '<path d="M12 5v14M5 12h14"/>',
    link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>', copy: '<rect x="8" y="8" width="11" height="11" rx="2.5"/><path d="M5 15V7a2 2 0 0 1 2-2h8"/>',
    share: '<path d="M12 15V4M8 8l4-4 4 4M5 13v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5"/>', uadd: '<path d="M15 19v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 3 17.5V19M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19 8v6M22 11h-6"/>',
    exit: '<path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 17l-5-5 5-5M5 12h11"/>', edit: '<path d="M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4"/>', block: '<circle cx="12" cy="12" r="8.5"/><path d="M6 6l12 12"/>', flag: '<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>',
    lock: '<rect x="5" y="11" width="14" height="9" rx="2.5"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>', check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>', users: '<path d="M16 19v-1.3a3.3 3.3 0 0 0-3.3-3.3H6.3A3.3 3.3 0 0 0 3 17.7V19M9.5 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM21 19v-1.3a3.3 3.3 0 0 0-2.5-3.2M15.5 5.1a3 3 0 0 1 0 5.8"/>',
    play: '<path d="M8 5.5v13l10.5-6.5z"/>', pause: '<path d="M8 5v14M16 5v14"/>'
  };
  function ic(k, cls) { return '<svg class="sx-ic' + (cls ? ' ' + cls : '') + '" viewBox="0 0 24 24" aria-hidden="true">' + IC[k] + '</svg>'; }
  // avatars des deux discussions officielles (épinglées)
  var NEWS_AV = '<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M11 17h4l11-6v18l-11-6h-4a2 2 0 0 1-2-2v-2a2 2 0 0 1 2-2z" fill="#fff"/><path d="M14 23l2 6h3l-1.6-6" fill="#fff" opacity=".8"/><path d="M29.5 16.5a5 5 0 0 1 0 7" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round"/></svg>';
  var TEAM_AV = '<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M11 22v-3a9 9 0 0 1 18 0v3" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/><rect x="9" y="20" width="5" height="8" rx="2.2" fill="#fff"/><rect x="26" y="20" width="5" height="8" rx="2.2" fill="#fff"/><path d="M28.5 28c0 2.5-2.5 4-6 4" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/><circle cx="21.5" cy="32" r="1.6" fill="#fff"/></svg>';
  function avatar(it, big) {
    var c = 'sx-av' + (big ? ' big' : '');
    if (it.k === 'news') return '<span class="' + c + ' sx-av-news">' + NEWS_AV + '</span>';
    if (it.k === 'team') return '<span class="' + c + ' sx-av-team">' + TEAM_AV + (it.on ? '<i class="sx-dot"></i>' : '') + '</span>';
    if (it.emoji) return '<span class="' + c + ' sx-av-g">' + esc(it.emoji) + '</span>';
    return '<span class="' + c + '" style="--av:' + avc(it.name) + '">' + ini(it.name) + (it.on ? '<i class="sx-dot"></i>' : '') + '</span>';
  }
  var VER = '<i class="sx-ver" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M6 12.5l4 4 8-9"/></svg></i>';

  /* ---------- état ---------- */
  var root = null, seg = 'chats', q = '', D = { feed: null, fr: null, gr: null }, conv = null, tList = 0, tConv = 0, tDuel = 0, handoff = null, hint = '', active = false, wide = false;
  function mq() { try { return window.matchMedia('(min-width:860px)').matches; } catch (e) { return false; } }
  function mount() {
    var box = document.querySelector('#liveModal .live-box');
    if (!box) return null;
    if (root && root.isConnected) return root;
    root = document.createElement('div'); root.className = 'sx'; root.id = 'sxRoot';
    root.innerHTML = '<section class="sx-scr sx-list" id="sxL"></section><section class="sx-scr sx-conv" id="sxC"></section>' +
      '<section class="sx-panel" id="sxP" hidden></section><div class="sx-sheet" id="sxSh" hidden></div><div class="sx-lb" id="sxLb" hidden></div>';
    box.appendChild(root);
    $('sxLb').addEventListener('click', function () { this.hidden = true; this.innerHTML = ''; });
    $('sxSh').addEventListener('click', function (e) { if (e.target === this) closeSheet(); });
    return root;
  }
  function on() { mount(); active = true; $('liveModal').classList.add('sx-on'); wide = mq(); }
  // la page Social a été fermée (bouton, glissé vers le bas…) : plus rien ne tourne
  function alive() { var m = $('liveModal'); if (active && m && m.classList.contains('active') && m.classList.contains('sx-on')) return true; if (active) stop(); return false; }
  function stopTimers() { clearInterval(tList); clearInterval(tConv); clearInterval(tDuel); tList = tConv = tDuel = 0; }
  function stop() { stopTimers(); micStop(true); active = false; }
  function hide() { stop(); if ($('liveModal')) $('liveModal').classList.remove('sx-on'); }

  /* =========================== LISTE =========================== */
  async function load() {
    var g = guest();
    var r = await Promise.all([call('feed', {}), g ? null : call('friends', {}), g ? null : call('groups', {})]);
    if (r[0] && r[0].ok) D.feed = r[0];
    if (r[1] && r[1].ok) D.fr = r[1];
    if (r[2] && r[2].ok) D.gr = r[2];
    if (D.feed && D.feed.me && D6.Live && D6.Live.badges) D6.Live.badges(D.feed.me);
  }
  function gSeen(gid, at) { var m = store('sx_gseen') || {}; if (at === undefined) return m[gid] || 0; m[gid] = at; store('sx_gseen', m); }
  function chatItems() {
    var out = [], posts = (D.feed && D.feed.posts) || [], seen = store('oro_live_seen') || [];
    var p0 = posts[0];
    out.push({ k: 'news', pin: 1, name: t('news'), prev: p0 ? (p0.t || '📷').split('\n')[0] : t('newsSub'), at: p0 ? p0.at : 0, un: posts.filter(function (p) { return seen.indexOf(p.id) < 0; }).length });
    var me = D.feed && D.feed.me, tm = (me && me.msgs) || [], lm = tm[tm.length - 1];
    out.push({ k: 'team', pin: 1, name: t('team'), prev: lm ? (lm.t || (isAud(lm.img) ? '🎤 ' + t('voice') : '📷 ' + t('photo'))) : t('teamSub'), mine: lm && lm.f === 'u', at: lm ? lm.at : 0, un: (me && me.unread) || 0 });
    var rest = [];
    ((D.fr && D.fr.list) || []).forEach(function (c) {
      if (c.req) return;
      var last = String(c.last || ''), mine = !!c.mine || last.indexOf('✓ ') === 0;
      rest.push({ k: 'dm:' + c.id, name: c.name, prev: prevTxt(last.replace(/^✓ /, '')), mine: mine, at: c.at, un: c.un, on: c.on, duel: c.duel, blocked: c.blocked });
    });
    ((D.gr && D.gr.list) || []).forEach(function (g) {
      var last = String(g.last || ''), mine = last.indexOf('✓ ') === 0;
      rest.push({ k: 'g:' + g.id, name: g.name, emoji: g.emoji || '💬', prev: prevTxt(last.replace(/^✓ /, '')) || members(g.n), mine: mine, at: g.at, un: (!mine && g.at > gSeen(g.id) && last) ? '•' : 0 });
    });
    rest.sort(function (a, b) { return (b.at || 0) - (a.at || 0); });
    return out.concat(rest);
  }
  function prevTxt(s) { return s === '📷' ? '📷 ' + t('photo') : s === '🎤' ? '🎤 ' + t('voice') : s.replace(/ : 📷$/, ' : 📷 ' + t('photo')).replace(/ : 🎤$/, ' : 🎤 ' + t('voice')); }
  function members(n) { var x = GX(); return n === 1 ? (x.n1 || '1') : String(x.n || '{n}').replace('{n}', n); }
  function match(it) { if (!q) return true; var s = q.toLowerCase(); return String(it.name || '').toLowerCase().indexOf(s) >= 0 || String(it.prev || '').toLowerCase().indexOf(s) >= 0 || String(it.id || '').toLowerCase().indexOf(s) >= 0; }
  function row(it, extra) {
    var tick = it.mine ? ic('check', 'sx-tk') : '';
    var badge = it.un ? '<i class="sx-un' + (it.un === '•' ? ' dot' : '') + '">' + (it.un === '•' ? '' : (it.un > 99 ? '99+' : it.un)) + '</i>' : '';
    var duel = it.duel ? '<em class="sx-chip">⚔️</em>' : '';
    return '<button type="button" class="sx-row' + (it.un ? ' unread' : '') + (it.pin ? ' pin' : '') + '" data-k="' + esc(it.k) + '">' + avatar(it) +
      '<span class="sx-rm"><span class="sx-r1"><b class="sx-nm sx-ell">' + esc(it.name) + (it.pin ? VER : '') + (it.blocked ? ' 🚫' : '') + '</b><time>' + esc(when(it.at)) + '</time></span>' +
      '<span class="sx-r2"><span class="sx-pv sx-ell">' + tick + esc(it.prev || '') + '</span>' + duel + badge + '</span></span>' + (extra || '') + '</button>';
  }
  function empty(ico, title, sub, btn) {
    return '<div class="sx-empty"><span class="sx-eico">' + ico + '</span><b>' + esc(title) + '</b><p>' + esc(sub) + '</p>' + (btn || '') + '</div>';
  }
  function guestCard() {
    var x = LT('live');
    return empty(ic('users'), t('guestT'), t('guestS'), '<button type="button" class="sx-btn gold" data-act="signup"><b class="fit">' + esc(x.guestBtn || 'Create my account') + '</b></button>');
  }
  function segCounts() {
    var c = { chats: 0, groups: 0, friends: 0 };
    if (D.feed || D.fr) chatItems().forEach(function (it) { if (it.un) c.chats++; });
    c.groups = ((D.gr && D.gr.inv) || []).length;
    c.friends = ((D.fr && D.fr.list) || []).filter(function (r) { return r.req; }).length;
    return c;
  }
  function paintList() {
    var L = $('sxL');
    L.innerHTML = '<header class="sx-hd"><button type="button" class="sx-ib sx-bk" id="sxClose" aria-label="Back">' + ic('back') + '</button><b class="sx-ttl fit">' + esc(t('title')) + '</b>' +
      '<button type="button" class="sx-ib" id="sxSearchB" aria-label="' + esc(t('search')) + '">' + ic('search') + '</button><button type="button" class="sx-ib" id="sxMoreB" aria-label="' + esc(t('more')) + '">' + ic('grid') + '</button></header>' +
      '<div class="sx-srch" id="sxSrch"' + (q ? '' : ' hidden') + '>' + ic('search') + '<input id="sxQ" type="search" autocomplete="off" spellcheck="false" placeholder="' + esc(t('search')) + '" value="' + esc(q) + '"><button type="button" class="sx-ib sm" id="sxQx" aria-label="x">' + ic('x') + '</button></div>' +
      '<nav class="sx-seg" role="tablist">' + ['chats', 'groups', 'friends'].map(function (s) { return '<button type="button" role="tab" data-s="' + s + '" class="' + (seg === s ? 'on' : '') + '"><b class="fit">' + esc(t(s)) + '</b><i class="sx-sb" data-c="' + s + '"></i></button>'; }).join('') + '</nav>' +
      '<div class="sx-body" id="sxBody"></div>' +
      (guest() ? '' : '<button type="button" class="sx-fab" id="sxFab" aria-label="' + esc(t('newChat')) + '">' + ic('edit') + '</button>');
    $('sxClose').addEventListener('click', closeList);
    $('sxSearchB').addEventListener('click', function () { var s = $('sxSrch'); s.hidden = !s.hidden; if (!s.hidden) $('sxQ').focus(); else { q = ''; $('sxQ').value = ''; paintBody(); } });
    $('sxQ').addEventListener('input', function () { q = this.value.trim(); paintBody(); });
    $('sxQx').addEventListener('click', function () { q = ''; $('sxQ').value = ''; $('sxSrch').hidden = true; paintBody(); });
    $('sxMoreB').addEventListener('click', function () { if (gridRet) toGrid(); else leave('home', undefined, false); });
    L.querySelectorAll('.sx-seg button').forEach(function (b) { b.addEventListener('click', function () { seg = b.getAttribute('data-s'); hint = ''; L.querySelectorAll('.sx-seg button').forEach(function (z) { z.classList.toggle('on', z === b); }); paintBody(true); }); });
    if ($('sxFab')) $('sxFab').addEventListener('click', function () { if (seg === 'groups') createSheet(); else { seg = 'friends'; paintList(); setTimeout(function () { if ($('sxAddIn')) $('sxAddIn').focus(); }, 50); } });
    paintBody(true);
    fitAll(L);
  }
  function paintBody(top) {
    var b = $('sxBody'); if (!b) return;
    var st = b.scrollTop;
    var c = segCounts();
    root.querySelectorAll('.sx-sb').forEach(function (i) { var n = c[i.getAttribute('data-c')]; i.textContent = n ? (n > 99 ? '99+' : n) : ''; });
    root.querySelectorAll('.sx-seg .fit').forEach(fitEl);
    if ($('sxFab')) $('sxFab').hidden = seg === 'friends';
    b.innerHTML = seg === 'chats' ? chatsHtml() : seg === 'groups' ? groupsHtml() : friendsHtml();
    bindBody(b);
    b.scrollTop = top ? 0 : st;
    fitAll(b);
    markSel();
  }
  function chatsHtml() {
    var items = chatItems().filter(match), h = '';
    var nReq = ((D.fr && D.fr.list) || []).filter(function (r) { return r.req; }).length;
    if (nReq && !q) h += '<button type="button" class="sx-row sx-reqrow" data-act="toReq"><span class="sx-av sx-av-req">' + ic('uadd') + '</span><span class="sx-rm"><span class="sx-r1"><b class="sx-nm sx-ell">' + esc(t('reqRow')) + '</b></span><span class="sx-r2"><span class="sx-pv sx-ell">' + esc(t('reqHint')) + '</span><i class="sx-un">' + nReq + '</i></span></span></button>';
    h += items.map(function (it) { return row(it); }).join('');
    if (guest()) h += guestCard();
    else if (!q && items.length <= 2) h += empty(ic('send'), t('emptyChatsT'), t('emptyChatsS'), '<button type="button" class="sx-btn" data-act="toFriends"><b class="fit">' + esc(t('addFriend')) + '</b></button>');
    if (q && !items.length) h += '<p class="sx-none">' + esc(t('noResult')) + '</p>';
    return '<div class="sx-rows">' + h + '</div>';
  }
  function groupsHtml() {
    if (guest()) return guestCard();
    var x = GX(), h = '', inv = ((D.gr && D.gr.inv) || []).filter(function (v) { return match({ name: v.name }); });
    if (inv.length) {
      h += '<p class="sx-h"><span class="fit">' + esc(x.invTitle || 'Invitations') + '</span></p>' + inv.map(function (v) {
        return '<div class="sx-inv">' + avatar({ emoji: v.emoji || '💬' }) + '<span class="sx-rm"><b class="sx-nm sx-ell">' + esc(v.name) + '</b><span class="sx-pv sx-ell">' + esc(String(x.invFrom || '{a}').replace('{a}', v.by)) + ' · ' + esc(members(v.n)) + '</span></span>' +
          '<span class="sx-yn"><button type="button" class="sx-btn sm ghost" data-gno="' + esc(v.gid) + '"><b class="fit">' + esc(x.no || 'Decline') + '</b></button><button type="button" class="sx-btn sm ok" data-gyes="' + esc(v.gid) + '"><b class="fit">' + esc(x.yes || 'Accept') + '</b></button></span></div>';
      }).join('');
    }
    var list = ((D.gr && D.gr.list) || []).map(function (g) {
      var last = String(g.last || ''), mine = last.indexOf('✓ ') === 0;
      return { k: 'g:' + g.id, name: g.name, emoji: g.emoji || '💬', prev: prevTxt(last.replace(/^✓ /, '')) || members(g.n), mine: mine, at: g.at, un: (!mine && g.at > gSeen(g.id) && last) ? '•' : 0 };
    }).filter(match);
    if (!q) h += '<button type="button" class="sx-row sx-new" data-act="newGroup"><span class="sx-av sx-av-add">' + ic('plus') + '</span><span class="sx-rm"><b class="sx-nm sx-ell">' + esc(t('newGroup')) + '</b><span class="sx-pv sx-ell">' + esc(x.sub || '') + '</span></span></button>';
    if (list.length) h += '<p class="sx-h"><span class="fit">' + esc(x.title || t('groups')) + '</span></p>' + list.map(function (it) { return row(it); }).join('');
    else if (!q && !inv.length) h += empty(ic('users'), t('emptyGroupsT'), t('emptyGroupsS'));
    if (q && !list.length && !inv.length) h += '<p class="sx-none">' + esc(t('noResult')) + '</p>';
    return '<div class="sx-rows">' + h + '</div>';
  }
  function friendsHtml() {
    if (guest()) return guestCard();
    var x = LT('live'), fr = D.fr || {}, h = '';
    var reqs = (fr.list || []).filter(function (r) { return r.req && match(r); });
    var cts = (fr.list || []).filter(function (r) { return !r.req && match({ name: r.name, id: r.id }); }).sort(function (a, b) { return String(a.name).localeCompare(String(b.name), lg()); });
    if (hint) h += '<p class="sx-hint"><span class="fit">' + esc(hint) + '</span></p>';
    if (!q) {
      h += '<div class="sx-card sx-idc"><span class="sx-idi">' + ic('lock') + '</span><span class="sx-idt"><small class="fit">' + esc(x.myId || 'Your ID') + '</small><b class="sx-idv fit">' + esc(fr.me || '…') + '</b></span>' +
        '<button type="button" class="sx-ib" data-act="copyMe" aria-label="' + esc(x.copy || 'Copy') + '">' + ic('copy') + '</button><button type="button" class="sx-ib" data-act="shareMe" aria-label="' + esc(t('share')) + '">' + ic('share') + '</button></div>' +
        '<p class="sx-note"><span class="fit">' + esc(x.idHint || '') + '</span></p>' +
        '<form class="sx-add" id="sxAdd" autocomplete="off"><input id="sxAddIn" maxlength="80" spellcheck="false" autocapitalize="off" inputmode="email" placeholder="' + esc(x.findPh || 'ID (R…) / e-mail') + '"><button type="submit" class="sx-btn"><b class="fit">' + esc(t('addGo')) + '</b></button></form><p class="sx-msg" id="sxAddMsg"></p>';
      if (fr.stats) h += '<p class="sx-rec"><span class="fit">🏆 ' + esc(fmt(x.duelRecord || '{w} / {l}', fr.stats)) + '</span></p>';
    }
    if (reqs.length) {
      h += '<p class="sx-h"><span class="fit">' + esc(t('requests')) + ' · ' + reqs.length + '</span></p>' + reqs.map(function (r) {
        return '<div class="sx-inv sx-req" data-k="dm:' + esc(r.id) + '">' + avatar({ name: r.name, on: r.on }) + '<span class="sx-rm"><b class="sx-nm sx-ell">' + esc(r.name) + '</b><span class="sx-pv sx-ell">' + esc(prevTxt(String(r.last || ''))) + '</span></span>' +
          '<span class="sx-yn"><button type="button" class="sx-btn sm ghost" data-fno="' + esc(r.id) + '"><b class="fit">' + esc(x.refuse || 'Decline') + '</b></button><button type="button" class="sx-btn sm ok" data-fyes="' + esc(r.id) + '"><b class="fit">' + esc(x.accept || 'Accept') + '</b></button></span></div>';
      }).join('');
    }
    if (cts.length) {
      h += '<p class="sx-h"><span class="fit">' + esc(t('contacts')) + ' · ' + cts.length + '</span></p>' + cts.map(function (c) {
        return '<button type="button" class="sx-row sx-ct" data-k="dm:' + esc(c.id) + '">' + avatar({ name: c.name, on: c.on }) + '<span class="sx-rm"><b class="sx-nm sx-ell">' + esc(c.name) + (c.blocked ? ' 🚫' : '') + '</b><span class="sx-pv sx-ell">' + (c.on ? '<em class="sx-onl">' + esc(t('online')) + '</em> · ' : '') + esc(c.id) + '</span></span>' +
          '<span class="sx-ib sx-go2" aria-hidden="true">' + ic('send') + '</span></button>';
      }).join('');
    } else if (!q && !reqs.length) h += empty(ic('uadd'), x.emptyT || t('addFriend'), t('emptyFriendsS'), '<button type="button" class="sx-btn gold" data-act="shareMe"><b class="fit">' + esc(x.share || t('share')) + '</b></button>');
    if (q && !cts.length && !reqs.length) h += '<p class="sx-none">' + esc(t('noResult')) + '</p>';
    return '<div class="sx-rows">' + h + '</div>';
  }
  function shareMe(btn) {
    var x = LT('live'), me = (D.fr && D.fr.me) || '', txt = fmt(x.shareTxt || 'My OROLADO ID: {id}', { id: me }) + ' https://orolado.com';
    if (navigator.share) { navigator.share({ text: txt }).catch(function () {}); return; }
    try { navigator.clipboard.writeText(txt); } catch (e) { /* ignore */ }
    toast(x.copied || '✓');
  }
  function bindBody(b) {
    var x = LT('live'), gx = GX();
    b.querySelectorAll('.sx-row[data-k], .sx-req[data-k]').forEach(function (el) { el.addEventListener('click', function (e) { if (e.target.closest('button[data-fyes],button[data-fno]')) return; openConv(el.getAttribute('data-k')); }); });
    b.querySelectorAll('[data-act]').forEach(function (el) {
      el.addEventListener('click', function () {
        var a = el.getAttribute('data-act');
        if (a === 'signup') { if (D6.Live && D6.Live.toAuth) D6.Live.toAuth('register'); }
        else if (a === 'toReq' || a === 'toFriends') { seg = 'friends'; paintList(); }
        else if (a === 'newGroup') createSheet();
        else if (a === 'copyMe') { try { navigator.clipboard.writeText((D.fr && D.fr.me) || ''); } catch (e) { /* ignore */ } toast(x.copied || '✓'); }
        else if (a === 'shareMe') shareMe(el);
      });
    });
    b.querySelectorAll('[data-fyes],[data-fno]').forEach(function (el) {
      el.addEventListener('click', async function (e) {
        e.stopPropagation(); el.disabled = true;
        var yes = el.hasAttribute('data-fyes'), id = el.getAttribute(yes ? 'data-fyes' : 'data-fno');
        await call('friendAnswer', { id: id, yes: yes ? 1 : 0 });
        await load(); paintBody();
        if (yes) openConv('dm:' + id);
      });
    });
    b.querySelectorAll('[data-gyes],[data-gno]').forEach(function (el) {
      el.addEventListener('click', async function () {
        el.disabled = true;
        var yes = el.hasAttribute('data-gyes'), gid = el.getAttribute(yes ? 'data-gyes' : 'data-gno');
        var r = await call('gAnswer', { gid: gid, yes: yes ? 1 : 0 });
        if (r && !r.ok) toast(gx[r.reason] || gx.fail || '!', 'err');
        await load(); paintBody();
        if (yes && r && r.ok && r.g) { toast(String(gx.joined || '✓').replace('{n}', r.g.name)); openConv('g:' + r.g.id); }
      });
    });
    var f = $('sxAdd');
    if (f) f.addEventListener('submit', async function (e) {
      e.preventDefault();
      var raw = $('sxAddIn').value.trim(), m = $('sxAddMsg');
      var v = raw.indexOf('@') >= 0 ? raw.replace(/\s+/g, '').toLowerCase() : raw.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
      m.textContent = '';
      if (v.length < 7) { m.textContent = x.notFound || '?'; return; }
      var j = await call('find', { id: v });
      if (j && j.ok) { $('sxAddIn').value = ''; openConv('dm:' + j.peer.id, j.peer.name); }
      else m.textContent = x[(j && j.reason) || 'notFound'] || x.notFound || '?';
    });
  }
  function markSel() { if (!root) return; var k = conv && conv.k; root.querySelectorAll('#sxL .sx-row[data-k]').forEach(function (r) { r.classList.toggle('sel', !!k && r.getAttribute('data-k') === k); }); }
  async function refreshList() { await load(); if (active && $('sxBody')) paintBody(); }
  function listPoll() { clearInterval(tList); tList = setInterval(function () { if (alive() && !document.hidden && (!conv || wide)) refreshList(); }, 15000); }

  /* ======================= CRÉER UN GROUPE ======================= */
  function sheet(html) { var s = $('sxSh'); s.innerHTML = '<div class="sx-shin"><i class="sx-grab"></i>' + html + '</div>'; s.hidden = false; return s; }
  function closeSheet() { var s = $('sxSh'); if (s) { s.hidden = true; s.innerHTML = ''; } }
  function createSheet() {
    var x = GX(), pick = EMO[0];
    var s = sheet('<b class="sx-sht fit">' + esc(t('newGroup')) + '</b><div class="sx-emos">' + EMO.map(function (e, i) { return '<button type="button" class="' + (i ? '' : 'on') + '" data-e="' + e + '">' + e + '</button>'; }).join('') + '</div>' +
      '<form id="sxGf" class="sx-add" autocomplete="off"><input id="sxGn" maxlength="40" placeholder="' + esc(x.namePh || t('newGroup')) + '"><button type="submit" class="sx-btn"><b class="fit">' + esc(t('create')) + '</b></button></form><p class="sx-msg" id="sxGm"></p>');
    s.querySelectorAll('[data-e]').forEach(function (b) { b.addEventListener('click', function () { pick = b.getAttribute('data-e'); s.querySelectorAll('[data-e]').forEach(function (z) { z.classList.toggle('on', z === b); }); }); });
    $('sxGf').addEventListener('submit', async function (e) {
      e.preventDefault();
      var r = await call('gCreate', { name: $('sxGn').value, emoji: pick });
      if (r && r.ok) { closeSheet(); await load(); seg = 'groups'; paintBody(); openConv('g:' + r.g.id); }
      else $('sxGm').textContent = x[(r && r.reason) || 'fail'] || x.fail || '!';
    });
    fitAll(s);
    setTimeout(function () { if ($('sxGn')) $('sxGn').focus(); }, 80);
  }

  /* ========================= CONVERSATION ========================= */
  function inConv(onOff) { root.classList.toggle('sx-in-conv', !!onOff); }
  function kindOf(k) { return k === 'news' || k === 'team' ? k : k.indexOf('dm:') === 0 ? 'dm' : 'group'; }
  async function openConv(k, name) {
    if (!root) return;
    if (guest() && k !== 'news') { if (k === 'team') leave('guest', 'chat', true); return; }
    clearInterval(tConv); clearInterval(tDuel); micStop(true);
    var kind = kindOf(k);
    conv = { k: k, kind: kind, id: k.replace(/^(dm|g):/, ''), msgs: [], pend: [], sig: '', name: name || '', picking: false, img: '', aud: '', audUrl: '' };
    closePanel();
    var it = chatItems().filter(function (z) { return z.k === k; })[0];
    if (it && !conv.name) conv.name = it.name;
    if (it && it.emoji) conv.emoji = it.emoji;
    if (kind === 'group') { var gl = ((D.gr && D.gr.list) || []).filter(function (z) { return z.id === conv.id; })[0]; if (gl) conv.canWrite = gl.canWrite !== false; }
    paintConvShell();
    inConv(true); markSel();
    await refreshConv(true);
    var every = kind === 'team' ? 10000 : kind === 'news' ? 60000 : 6000;
    tConv = setInterval(function () { if (alive() && !document.hidden && conv && conv.k === k) refreshConv(); }, every);
  }
  function closeConv() {
    clearInterval(tConv); clearInterval(tDuel); micStop(true);
    if (conv && conv.kind === 'group') gSeen(conv.id, Math.floor(Date.now() / 1000));
    conv = null; closePanel(); inConv(false); paintConvEmpty(); refreshList(); markSel();
  }
  function paintConvEmpty() {
    var C = $('sxC'); if (!C) return;
    C.innerHTML = '<div class="sx-pick">' + empty(ic('send'), t('pickChat'), '') + '</div>';
    fitAll(C);
  }
  function headStatus() {
    var c = conv, x = LT('live');
    if (c.kind === 'news') return esc(t('newsSub'));
    if (c.kind === 'team') return esc(t('teamSub'));
    if (c.kind === 'group') return c.g ? esc(members(c.g.n)) : '';
    return c.on ? '<em class="sx-onl">' + esc(t('online')) + '</em>' : esc(c.peerId || c.id);
  }
  function paintConvShell() {
    var c = conv, x = LT('live'), C = $('sxC');
    var acts = '';
    if (c.kind === 'dm') {
      if (D6.LiveSend && D6.LiveSend.enabled && D6.LiveSend.enabled()) acts += '<button type="button" class="sx-ib" data-ca="money" aria-label="' + esc(t('sendMoney')) + '">' + ic('money') + '</button>';
      acts += '<button type="button" class="sx-ib" data-ca="duel" aria-label="' + esc(x.duelBtn || 'Challenge') + '">' + ic('duel') + '</button>';
      acts += '<button type="button" class="sx-ib" data-ca="menu" aria-label="' + esc(t('more')) + '">' + ic('dots') + '</button>';
    } else if (c.kind === 'group') acts += '<button type="button" class="sx-ib" data-ca="info" aria-label="' + esc(t('groupInfo')) + '">' + ic('dots') + '</button>';
    var av = avatar({ k: c.kind === 'news' || c.kind === 'team' ? c.kind : '', name: c.name || '?', emoji: c.kind === 'group' ? (c.emoji || '💬') : '', on: c.on });
    var canMic = c.kind !== 'news';
    C.innerHTML = '<header class="sx-hd sx-chd"><button type="button" class="sx-ib sx-bk" id="sxCBack" aria-label="Back">' + ic('back') + '</button>' +
      '<button type="button" class="sx-who" id="sxWho">' + av + '<span class="sx-wt"><b class="sx-ell" id="sxWn">' + esc(c.kind === 'news' ? t('news') : c.kind === 'team' ? t('team') : c.name) + ((c.kind === 'news' || c.kind === 'team') ? VER : '') + '</b><small class="sx-ell" id="sxWs">' + headStatus() + '</small></span></button>' + acts + '</header>' +
      '<div class="sx-ban" id="sxBan" hidden></div><div class="sx-msgs" id="sxMsgs" role="log"></div><div class="sx-qk" id="sxQk" hidden></div>' +
      (c.kind === 'group' && c.canWrite === false ? '' : c.kind === 'news' ? '<p class="sx-ro"><span class="fit">' + ic('lock') + ' ' + esc(t('channelNote')) + '</span></p>' :
      '<form class="sx-comp" id="sxComp" autocomplete="off"><label class="sx-cb sx-cam" aria-label="' + esc(t('photo')) + '">' + ic('cam') + '<input type="file" id="sxFile" accept="image/*" hidden></label>' +
      '<div class="sx-inw"><div class="sx-prev" id="sxPrev" hidden></div><textarea id="sxTx" rows="1" maxlength="1000" placeholder="' + esc(c.kind === 'group' ? (GX().ph || x.ph) : x.ph || '…') + '"></textarea>' +
      '<div class="sx-recb" id="sxRec" hidden><i class="sx-recd"></i><b id="sxRecT">0:00</b><small class="fit">' + esc(t('rec')) + '</small></div></div>' +
      (canMic ? '<button type="button" class="sx-cb sx-mic" id="sxMic" aria-label="' + esc(t('voice')) + '">' + ic('mic') + '</button>' : '') +
      '<button type="submit" class="sx-cb sx-go" id="sxGo" aria-label="Send" hidden>' + ic('send') + '</button></form>');
    $('sxCBack').addEventListener('click', backConv);
    $('sxWho').addEventListener('click', function () { if (c.kind === 'group') groupInfo(); else if (c.kind === 'dm') dmMenu(); });
    C.querySelectorAll('[data-ca]').forEach(function (b) {
      b.addEventListener('click', function () {
        var a = b.getAttribute('data-ca');
        if (a === 'money') leave('send', c.peerId || c.id, true);
        else if (a === 'duel') { c.hideDuel = ''; if (c.duel && (c.duel.st === 'pending' || c.duel.st === 'active')) { renderDuel(); return; } c.picking = !c.picking; renderDuel(); }
        else if (a === 'menu') dmMenu();
        else if (a === 'info') groupInfo();
      });
    });
    var f = $('sxComp');
    if (f) {
      f.addEventListener('submit', function (e) { e.preventDefault(); send(); });
      var tx = $('sxTx');
      tx.addEventListener('input', function () { grow(); syncBtns(); });
      tx.addEventListener('keydown', function (e) { if (e.key === 'Enter' && !e.shiftKey && wide) { e.preventDefault(); send(); } });
      $('sxFile').addEventListener('change', async function () {
        var fl = this.files && this.files[0]; this.value = ''; if (!fl) return;
        try { c.img = await shrink(fl); c.aud = ''; showPrev('<img src="' + c.img + '" alt="">'); } catch (err) { toast((LT('live').badImg) || '!', 'err'); }
      });
      if ($('sxMic')) $('sxMic').addEventListener('click', function () { if (rec) micStop(); else micStart(); });
      syncBtns();
    }
    $('sxMsgs').addEventListener('click', function (e) {
      var im = e.target.closest('.sx-b img'); if (im) { var lb = $('sxLb'); lb.innerHTML = '<img src="' + esc(im.getAttribute('src')) + '" alt="">'; lb.hidden = false; return; }
      var rt = e.target.closest('[data-retry]'); if (rt) { retry(rt.getAttribute('data-retry')); return; }
      var lk = e.target.closest('.sx-like'); if (lk) like(lk);
    });
    fitAll(C);
  }
  // « Envoyer de l'argent » apparaît dans l'en-tête dès que le serveur dit que c'est ouvert pour ce joueur
  function addMoneyBtn() {
    var d = root && root.querySelector('#sxC [data-ca=duel]');
    if (!d || !conv || conv.kind !== 'dm' || root.querySelector('#sxC [data-ca=money]') || !(D6.LiveSend && D6.LiveSend.enabled && D6.LiveSend.enabled())) return;
    var b = document.createElement('button'); b.type = 'button'; b.className = 'sx-ib'; b.setAttribute('data-ca', 'money'); b.setAttribute('aria-label', t('sendMoney')); b.innerHTML = ic('money');
    b.addEventListener('click', function () { if (conv) leave('send', conv.peerId || conv.id, true); });
    d.parentNode.insertBefore(b, d);
  }
  function grow() { var tx = $('sxTx'); if (!tx) return; fitPh(tx); tx.style.height = 'auto'; tx.style.height = Math.min(120, tx.scrollHeight) + 'px'; }
  function syncBtns() {
    var tx = $('sxTx'), go = $('sxGo'), mic = $('sxMic'); if (!tx || !go) return;
    var has = !!(tx.value.trim() || (conv && (conv.img || conv.aud)));
    go.hidden = !has && !!mic && !rec; if (mic) mic.hidden = has && !rec;
  }
  function showPrev(html) {
    var p = $('sxPrev'); p.innerHTML = html + '<button type="button" class="sx-px" aria-label="x">' + ic('x') + '</button>'; p.hidden = false;
    p.querySelector('.sx-px').addEventListener('click', clearPrev); syncBtns();
  }
  function clearPrev() { if (!conv) return; conv.img = ''; conv.aud = ''; if (conv.audUrl) { try { URL.revokeObjectURL(conv.audUrl); } catch (e) { /* ignore */ } } conv.audUrl = ''; var p = $('sxPrev'); if (p) { p.hidden = true; p.innerHTML = ''; } syncBtns(); }

  async function refreshConv(first) {
    var c = conv; if (!c) return;
    var k = c.k;
    if (c.kind === 'news') {
      var j = await call('feed', {}); if (!conv || conv.k !== k || !j || !j.ok) return;
      D.feed = j;
      var posts = (j.posts || []).slice().reverse();
      c.msgs = posts.map(function (p) { return { id: p.id, t: p.t, img: p.img, link: p.link, at: p.at, likes: p.likes, views: p.views, post: 1 }; });
      var seen = store('oro_live_seen') || [], fresh = [];
      (j.posts || []).forEach(function (p) { if (seen.indexOf(p.id) < 0) { fresh.push(p.id); seen.push(p.id); } });
      if (fresh.length) { store('oro_live_seen', seen.slice(-200)); call('seen', { ids: fresh }); }
    } else if (c.kind === 'team') {
      var jt = await call('feed', { read: 1 }); if (!conv || conv.k !== k || !jt || !jt.ok) return;
      D.feed = jt;
      var ms = (jt.me && jt.me.msgs) || [], lastTeam = 0;
      ms.forEach(function (m) { if (m.f === 'a') lastTeam = Math.max(lastTeam, m.at); });
      c.msgs = ms.map(function (m) { return { id: m.id, mine: m.f !== 'a', t: m.t, img: m.img, at: m.at, read: m.f !== 'a' && lastTeam >= m.at, who: m.f === 'a' ? t('team') : '' }; });
      if (D6.Live && D6.Live.badges) D6.Live.badges({ unread: 0, dmUnread: jt.me ? jt.me.dmUnread : 0 });
      paintQuick();
    } else if (c.kind === 'dm') {
      var jd = await call('dm', { id: c.id }); if (!conv || conv.k !== k) return;
      if (!jd || !jd.ok) { if (first) { toast(LT('live')[(jd && jd.reason) || 'notFound'] || '!', 'err'); closeConv(); } return; }
      c.peerId = jd.peer.id; c.name = jd.peer.name; c.on = !!jd.on; c.blocked = !!jd.blocked; c.req = !!jd.req; c.duel = jd.duel || null; c.stats = jd.stats || null;
      if (c.duel) c.duelOff = c.duel.now - Date.now() / 1000;
      var un = jd.peerUn == null ? -1 : +jd.peerUn, mine = jd.msgs.filter(function (m) { return m.mine; }).length, i = 0;
      c.msgs = jd.msgs.map(function (m) { var o = { id: m.id, mine: m.mine, t: m.t, img: m.img, at: m.at }; if (m.mine) { i++; o.read = un >= 0 && i <= mine - un; } return o; });
      $('sxWn').textContent = c.name; $('sxWs').innerHTML = headStatus();
      var av = root.querySelector('#sxWho .sx-av'); if (av) av.outerHTML = avatar({ name: c.name, on: c.on });
      renderDuel();
      if ($('sxComp')) $('sxComp').hidden = c.blocked;
    } else {
      var jg = await call('gGet', { gid: c.id }); if (!conv || conv.k !== k) return;
      if (!jg || !jg.ok) { toast(GX().gGone || '!', 'err'); await load(); closeConv(); return; }
      c.g = jg.g; c.name = jg.g.name; c.emoji = jg.g.emoji;
      c.msgs = jg.g.msgs.map(function (m) { return m.sys ? { sys: 1, t: String(GX().sysAdd || '{a} + {b}').replace('{a}', m.mine ? (GX().you || 'You') : m.who).replace('{b}', m.whom), at: m.at } : { mine: m.mine, who: m.who, t: m.t, img: m.img, at: m.at, id: m.at + m.who + (m.t || '').slice(0, 9) }; });
      $('sxWn').textContent = c.name; $('sxWs').innerHTML = headStatus();
      gSeen(c.id, Math.max(Math.floor(Date.now() / 1000), jg.g.at || 0));
      if (jg.g.canWrite === false) {
        if ($('sxComp')) $('sxComp').remove();
        if (first && !$('sxOnly') && soft('gread')) { var p = document.createElement('p'); p.className = 'sx-ro'; p.id = 'sxOnly'; p.innerHTML = '<span>' + esc(GX().onlyOwner || '') + '</span>'; $('sxC').appendChild(p); }
      }
    }
    paintMsgs(first);
  }
  function paintBanner() {
    var c = conv, b = $('sxBan'), x = LT('live'); if (!b || !c || c.kind !== 'dm') return;
    b.removeAttribute('data-duel');
    if (c.req) {
      b.hidden = false; b.className = 'sx-ban req'; b.removeAttribute('data-duel');
      b.innerHTML = '<p><span>' + esc(t('reqBanner')) + '</span></p><div class="sx-yn"><button type="button" class="sx-btn sm ghost" id="sxRno"><b class="fit">' + esc(x.refuse || 'Decline') + '</b></button><button type="button" class="sx-btn sm ok" id="sxRyes"><b class="fit">' + esc(x.accept || 'Accept') + '</b></button></div>';
      $('sxRyes').addEventListener('click', async function () { await call('friendAnswer', { id: c.peerId, yes: 1 }); c.req = false; b.hidden = true; refreshList(); });
      $('sxRno').addEventListener('click', async function () { await call('friendAnswer', { id: c.peerId, yes: 0 }); await load(); closeConv(); });
      fitAll(b); return;
    }
    if (c.blocked) {
      b.hidden = false; b.className = 'sx-ban blk'; b.removeAttribute('data-duel');
      b.innerHTML = '<p><span>' + esc(x.youBlocked || '') + '</span></p><div class="sx-yn"><button type="button" class="sx-btn sm" id="sxUnb"><b class="fit">' + esc(noEmo(x.unblock || 'Unblock')) + '</b></button></div>';
      $('sxUnb').addEventListener('click', async function () { await call('block', { id: c.peerId, on: 0 }); refreshConv(); refreshList(); });
      fitAll(b); return;
    }
    b.hidden = true; b.innerHTML = ''; b.className = 'sx-ban';
  }
  function sigOf(c) { return c.msgs.length + '|' + (c.msgs.length ? JSON.stringify(c.msgs[c.msgs.length - 1]) : '') + '|' + c.msgs.filter(function (m) { return m.read; }).length + '|' + c.pend.map(function (p) { return p.id + p.st; }).join(',') + '|' + lg() + (c.blocked ? 'b' : ''); }
  function paintMsgs(first) {
    var c = conv, el = $('sxMsgs'); if (!c || !el) return;
    var sig = sigOf(c); if (!first && sig === c.sig) return; c.sig = sig;
    var stick = first || el.scrollTop + el.clientHeight >= el.scrollHeight - 60;
    var x = LT('live'), h = '', lastDay = 0, prev = null;
    if (c.kind === 'dm') h += '<div class="sx-sys safe"><span>' + esc(String(x.safety || '').replace(/^🔒\s*/, '')) + '</span></div>';
    if (c.kind === 'team') h += bubble({ t: x.welcomeChat || '', at: 0, who: t('team') }, null);
    var all = c.msgs.concat(c.pend);
    all.forEach(function (m) {
      if (m.at) { var dn = dayN(m.at); if (dn !== lastDay) { lastDay = dn; h += '<div class="sx-day"><span>' + esc(dayLabel(m.at)) + '</span></div>'; prev = null; } }
      if (m.sys) { h += '<div class="sx-sys"><span>' + esc(m.t) + '</span></div>'; prev = null; return; }
      h += bubble(m, prev); prev = m;
    });
    if (c.kind === 'dm' && !all.length) h += '<div class="sx-hi">' + avatar({ name: c.name }, true) + '<b class="sx-ell">' + esc(c.name) + '</b><p>' + esc(t('sayHi')) + '</p></div>';
    if (c.kind === 'news') h += '<div class="sx-legal"><button type="button" id="sxTerms">' + esc(x.terms || 'Terms') + '</button> · <button type="button" id="sxPriv">' + esc(x.privacy || 'Privacy') + '</button></div>';
    el.innerHTML = h;
    if ($('sxTerms')) $('sxTerms').addEventListener('click', function () { var b = $('btnHelpTerms'); if (b) b.click(); });
    if ($('sxPriv')) $('sxPriv').addEventListener('click', function () { var b = $('btnHelpPrivacy'); if (b) b.click(); });
    if (stick) { el.scrollTop = 1e9; setTimeout(function () { if (el.isConnected) el.scrollTop = 1e9; }, 120); }
  }
  function bubble(m, prev) {
    var c = conv, mine = !!m.mine, cont = prev && !prev.sys && !!prev.mine === mine && (prev.who || '') === (m.who || '') && m.at - prev.at < 300;
    var media = '';
    if (m.img) media = isAud(m.img) ? '<audio class="sx-aud" controls preload="none" src="' + esc(m.img) + '"></audio>' : '<img src="' + esc(m.img) + '" alt="" loading="lazy">';
    else if (m.audUrl) media = '<audio class="sx-aud" controls src="' + esc(m.audUrl) + '"></audio>';
    else if (m.imgData) media = '<img src="' + esc(m.imgData) + '" alt="">';
    var who = (!mine && c.kind === 'group' && !cont && m.who) ? '<em class="sx-bw" style="--av:' + avc(m.who) + '">' + esc(m.who) + '</em>' : '';
    var tick = '';
    if (mine) {
      if (m.st === 'sending') tick = '<i class="sx-st" title="' + esc(t('sending')) + '"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><path d="M12 7.5V12l3 2"/></svg></i>';
      else if (m.st === 'fail') tick = '';
      else if (c.kind === 'group') tick = '<i class="sx-tick">' + ic('check') + '</i>';
      else tick = '<i class="sx-tick' + (m.read ? ' rd' : '') + '"><svg viewBox="0 0 28 24"><path d="M3 12.5l4.5 4.5L17 7.5"/>' + (m.read ? '<path d="M11 15.5l1.5 1.5L22 7.5"/>' : '') + '</svg></i>';
    }
    var meta = '<span class="sx-meta">' + (m.at ? esc(hm(m.at)) : '') + tick + '</span>';
    var foot = '';
    if (m.post) {
      var liked = (store('oro_live_liked') || []).indexOf(m.id) >= 0;
      foot = (m.link ? '<a class="sx-plink sx-ell" href="' + esc(m.link) + '" target="_blank" rel="noopener">▶ ' + esc(m.link.replace(/^https:\/\/(www\.)?/, '').slice(0, 60)) + '</a>' : '') +
        '<span class="sx-pf"><button type="button" class="sx-like' + (liked ? ' on' : '') + '" data-id="' + esc(m.id) + '">' + (liked ? '❤️' : '🤍') + ' <span>' + (+m.likes || 0) + '</span></button><span class="sx-vw">👁 ' + (+m.views || 0) + '</span></span>';
    }
    var fail = m.st === 'fail' ? '<button type="button" class="sx-fail" data-retry="' + esc(m.id) + '">⚠️ <span>' + esc(t('failed')) + '</span></button>' : '';
    var txt = m.t ? '<span class="sx-bt">' + linkify(m.t) + '</span>' : '';
    return '<div class="sx-b ' + (mine ? 'me' : 'them') + (cont ? ' cont' : '') + (m.img || m.imgData ? (isAud(m.img) ? ' aud' : ' pic') : '') + (m.audUrl ? ' aud' : '') + (m.st ? ' ' + m.st : '') + (m.post ? ' post' : '') + '">' + who + media + txt + foot + meta + '</div>' + fail;
  }
  function like(b) {
    var id = b.getAttribute('data-id'), lk = store('oro_live_liked') || [];
    if (lk.indexOf(id) >= 0) return;
    lk.push(id); store('oro_live_liked', lk.slice(-200)); b.classList.add('on');
    b.innerHTML = '❤️ <span>' + ((parseInt(b.textContent.replace(/\D/g, ''), 10) || 0) + 1) + '</span>';
    call('like', { ids: [id] });
  }
  function paintQuick() {
    var qk = $('sxQk'), x = LT('live'); if (!qk || !conv || conv.kind !== 'team') return;
    if (conv.msgs.length || conv.pend.length) { qk.hidden = true; qk.innerHTML = ''; return; }
    qk.hidden = false;
    qk.innerHTML = ['q1', 'q2', 'q3', 'q4'].filter(function (k) { return x[k]; }).map(function (k) { return '<button type="button" data-q="' + k + '"><span class="fit">' + esc(x[k]) + '</span></button>'; }).join('');
    qk.querySelectorAll('button').forEach(function (b) { b.addEventListener('click', function () { var tx = $('sxTx'); tx.value = x[b.getAttribute('data-q') + 't'] || ''; tx.focus(); grow(); syncBtns(); }); });
    fitAll(qk);
  }

  /* ---------- envoi (états : envoi… → ✓ ; échec → toucher pour réessayer) ---------- */
  var sendN = 0;
  function send() {
    var c = conv; if (!c || c.kind === 'news') return;
    micStop();
    var tx = $('sxTx'), text = tx ? tx.value.trim() : '';
    if (!text && !c.img && !c.aud) return;
    var p = { id: 'tmp' + (++sendN), mine: true, t: text, at: Math.floor(Date.now() / 1000), st: 'sending', img: '', imgData: c.img, audUrl: c.aud ? c.audUrl : '', rawImg: c.img, rawAud: c.aud };
    c.pend.push(p);
    tx.value = ''; grow(); conv.img = ''; conv.aud = ''; conv.audUrl = ''; var pv = $('sxPrev'); if (pv) { pv.hidden = true; pv.innerHTML = ''; } syncBtns();
    paintQuick(); paintMsgs(); var el = $('sxMsgs'); if (el) el.scrollTop = 1e9;
    deliver(c, p);
  }
  async function deliver(c, p) {
    var x = LT('live'), j = null;
    if (c.kind === 'team') j = await call('send', { text: p.t, img: p.rawImg || '', aud: p.rawImg ? '' : (p.rawAud || ''), lang: lg() });
    else if (c.kind === 'dm') j = await call('dmSend', { id: c.peerId || c.id, text: p.t, img: p.rawImg || '', aud: p.rawImg ? '' : (p.rawAud || '') });
    else j = await call('gSend', { gid: c.id, text: p.t, img: p.rawImg || '', aud: p.rawImg ? '' : (p.rawAud || '') });
    if (conv !== c) return;
    if (j && j.ok) {
      c.pend = c.pend.filter(function (z) { return z !== p; });
      if (j.msg) c.msgs.push(c.kind === 'team' ? { id: j.msg.id, mine: true, t: j.msg.t, img: j.msg.img, at: j.msg.at } : { id: j.msg.id, mine: true, t: j.msg.t, img: j.msg.img, at: j.msg.at });
      if (j.auto) setTimeout(function () { if (conv === c && !c.msgs.some(function (z) { return z.id === j.auto.id; })) { c.msgs.push({ id: j.auto.id, mine: false, who: t('team'), t: j.auto.t, at: j.auto.at }); paintMsgs(); } }, 900);
      paintMsgs();
      if (p.audUrl) { try { setTimeout(function () { URL.revokeObjectURL(p.audUrl); }, 60000); } catch (e) { /* ignore */ } }
      refreshConv();
      return;
    }
    p.st = 'fail'; paintMsgs();
    var r = j && j.reason;
    if (j && j.login && D6.Live) { D6.Live.toAuth('login'); return; }
    if (r === 'tooManyAud') toast(t('audLimit'), 'err'); else if (r === 'badAud') toast(t('audBad'), 'err');
    else toast(x[r] || GX()[r] || x.fail || '!', 'err');
  }
  function retry(id) { var c = conv; if (!c) return; var p = c.pend.filter(function (z) { return z.id === id; })[0]; if (!p) return; p.st = 'sending'; paintMsgs(); deliver(c, p); }

  /* ---------- photo réduite ---------- */
  function shrink(file) {
    return new Promise(function (res, rej) {
      var fr = new FileReader();
      fr.onload = function () {
        var im = new Image();
        im.onload = function () {
          var w = im.width, h = im.height, k = Math.min(1, 1280 / Math.max(w, h)); w = Math.round(w * k); h = Math.round(h * k);
          var cv = document.createElement('canvas'); cv.width = w; cv.height = h; cv.getContext('2d').drawImage(im, 0, 0, w, h);
          var qq = 0.78, out = cv.toDataURL('image/jpeg', qq);
          while (out.length > 520000 && qq > 0.4) { qq -= 0.12; out = cv.toDataURL('image/jpeg', qq); }
          res(out);
        };
        im.onerror = rej; im.src = fr.result;
      };
      fr.onerror = rej; fr.readAsDataURL(file);
    });
  }
  /* ---------- note vocale : 10 s max, s'arrête seule, on l'écoute avant d'envoyer ---------- */
  var rec = null, recT = 0, recAt = 0, recDrop = false;
  function micStop(drop) { if (rec && rec.state === 'recording') { recDrop = !!drop; try { rec.stop(); } catch (e) { /* ignore */ } } }
  async function micStart() {
    var c = conv;
    if (!window.MediaRecorder || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { toast(t('noRec'), 'err'); return; }
    var stream;
    try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }); } catch (e) { toast(t('micErr'), 'err'); return; }
    if (conv !== c) { stream.getTracks().forEach(function (tr) { tr.stop(); }); return; }
    var type = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/webm', 'audio/ogg;codecs=opus'].filter(function (ty) { try { return MediaRecorder.isTypeSupported(ty); } catch (e) { return false; } })[0] || '';
    var parts = [];
    try { rec = new MediaRecorder(stream, type ? { mimeType: type, audioBitsPerSecond: 32000 } : { audioBitsPerSecond: 32000 }); } catch (e) { stream.getTracks().forEach(function (tr) { tr.stop(); }); toast(t('noRec'), 'err'); return; }
    recDrop = false;
    rec.ondataavailable = function (ev) { if (ev.data && ev.data.size) parts.push(ev.data); };
    rec.onstop = function () {
      clearInterval(recT); stream.getTracks().forEach(function (tr) { tr.stop(); });
      var mime = (rec && rec.mimeType) || type || 'audio/webm';
      rec = null;
      if ($('sxMic')) $('sxMic').classList.remove('on');
      if ($('sxRec')) $('sxRec').hidden = true; if ($('sxTx')) $('sxTx').hidden = false;
      if ($('sxMic')) $('sxMic').innerHTML = ic('mic');
      var blob = new Blob(parts, { type: mime.split(';')[0] });
      if (recDrop || conv !== c || Date.now() - recAt < 700 || blob.size < 400) { syncBtns(); return; }
      var fr = new FileReader();
      fr.onload = function () {
        if (conv !== c) return;
        c.aud = String(fr.result || ''); c.img = ''; c.audUrl = URL.createObjectURL(blob);
        showPrev('<audio controls src="' + c.audUrl + '"></audio>');
      };
      fr.readAsDataURL(blob);
    };
    recAt = Date.now();
    rec.start();
    $('sxMic').classList.add('on'); $('sxMic').innerHTML = ic('stop');
    $('sxRec').hidden = false; $('sxTx').hidden = true;
    var tick = function () { var s = Math.min(10, Math.floor((Date.now() - recAt) / 1000)); if ($('sxRecT')) $('sxRecT').textContent = '0:' + (s < 10 ? '0' : '') + s; if (Date.now() - recAt >= 10000) micStop(); };
    tick(); recT = setInterval(tick, 250);
    fitAll($('sxRec'));
  }

  /* ---------- menu d'une conversation privée ---------- */
  function dmMenu() {
    var c = conv, x = LT('live'); if (!c || c.kind !== 'dm') return;
    var items = [];
    if (D6.LiveSend && D6.LiveSend.enabled && D6.LiveSend.enabled()) items.push(['money', ic('money'), t('sendMoney')]);
    items.push(['duel', ic('duel'), x.duelBtn || 'Challenge']);
    items.push(['copy', ic('copy'), t('copyId') + ' · ' + (c.peerId || c.id)]);
    items.push(['block', ic('block'), noEmo(c.blocked ? (x.unblock || 'Unblock') : (x.block || 'Block'))]);
    items.push(['report', ic('flag'), noEmo(x.report || 'Report'), 'red']);
    var s = sheet('<div class="sx-shhead">' + avatar({ name: c.name, on: c.on }, true) + '<b class="sx-ell">' + esc(c.name) + '</b><small class="sx-ell">' + (c.on ? esc(t('online')) + ' · ' : '') + esc(c.peerId || c.id) + '</small></div>' +
      '<div class="sx-menu">' + items.map(function (it) { return '<button type="button" data-m="' + it[0] + '" class="' + (it[3] || '') + '">' + it[1] + '<span class="fit">' + esc(it[2]) + '</span></button>'; }).join('') + '</div>');
    s.querySelectorAll('[data-m]').forEach(function (b) {
      b.addEventListener('click', async function () {
        var m = b.getAttribute('data-m'); closeSheet();
        if (m === 'money') leave('send', c.peerId || c.id, true);
        else if (m === 'duel') { c.picking = !(c.duel && (c.duel.st === 'pending' || c.duel.st === 'active')); renderDuel(); }
        else if (m === 'copy') { try { navigator.clipboard.writeText(c.peerId || c.id); } catch (e) { /* ignore */ } toast(x.copied || '✓'); }
        else if (m === 'block') { await call('block', { id: c.peerId || c.id, on: c.blocked ? 0 : 1 }); refreshConv(); refreshList(); }
        else if (m === 'report') { var why = window.prompt(x.reportQ || '?', ''); if (why === null) return; await call('report', { id: c.peerId || c.id, why: why }); toast(x.reported || '✓', 'ok'); refreshConv(); refreshList(); }
      });
    });
    fitAll(s);
  }

  /* ---------- défi en démo (même logique et mêmes appels que l'ancien Social) ---------- */
  function money(v) { v = Number(v) || 0; return (v >= 0 ? '+' : '−') + '$' + Math.abs(v).toFixed(2); }
  function mmss(s) { s = Math.max(0, Math.floor(s)); return Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2); }
  function renderDuel() {
    var c = conv, b = $('sxBan'), x = LT('live'); if (!c || c.kind !== 'dm' || !b) return;
    clearInterval(tDuel); tDuel = 0;
    var d = c.duel, name = esc(c.name);
    var setCard = function (cls, html) { b.hidden = false; b.className = 'sx-ban duel ' + cls; b.setAttribute('data-duel', '1'); b.innerHTML = html; fitAll(b); };
    var closeBtn = '<button type="button" class="sx-ib sm sx-bx" id="sxDx" aria-label="x">' + ic('x') + '</button>';
    if (c.picking) {
      setCard('pick', closeBtn + '<b class="sx-dt"><span class="fit">⚔️ ' + esc(x.duelPick || '') + '</span></b><p>' + esc(x.duelPickS || '') + '</p><div class="sx-yn">' + [3, 5, 10].map(function (m) { return '<button type="button" class="sx-btn sm" data-m="' + m + '"><b class="fit">' + m + '&nbsp;min</b></button>'; }).join('') + '</div>');
      $('sxDx').addEventListener('click', function () { c.picking = false; renderDuel(); });
      b.querySelectorAll('[data-m]').forEach(function (bt) {
        bt.addEventListener('click', async function () {
          c.picking = false; bt.disabled = true;
          var r = await call('duelCreate', { id: c.peerId || c.id, min: +bt.getAttribute('data-m') });
          if (r && !r.ok) toast(x[r.reason] || x.fail || '!', 'err');
          refreshConv();
        });
      });
      return;
    }
    var nowS = function () { return Date.now() / 1000 + (c.duelOff || 0); };
    if (!d || c.hideDuel === d.id + d.st || (['refused', 'expired'].indexOf(d.st) >= 0 && nowS() - (d.end || d.now) > 600)) { paintBanner(); return; }
    var hideMe = function () { c.hideDuel = d.id + d.st; paintBanner(); };
    if (d.st === 'pending') {
      if (d.mine) setCard('wait', '<b class="sx-dt"><span class="fit">⚔️ ' + esc(fmt(x.duelSent || '', { m: d.min, n: c.name })) + '</span></b>');
      else {
        setCard('inv', '<b class="sx-dt"><span class="fit">⚔️ ' + esc(fmt(x.duelInvite || '', { n: c.name })) + '</span></b><p>' + esc(fmt(x.duelInviteS || '', { m: d.min })) + '</p><div class="sx-yn"><button type="button" class="sx-btn sm ghost" id="sxDno"><b class="fit">' + esc(x.refuse || 'Decline') + '</b></button><button type="button" class="sx-btn sm ok" id="sxDyes"><b class="fit">' + esc(x.accept || 'Accept') + '</b></button></div>');
        $('sxDyes').addEventListener('click', async function () { this.disabled = true; await call('duelAnswer', { id: c.peerId, accept: 1 }); refreshConv(); });
        $('sxDno').addEventListener('click', async function () { this.disabled = true; await call('duelAnswer', { id: c.peerId, accept: 0 }); refreshConv(); });
      }
      return;
    }
    if (d.st === 'refused' || d.st === 'expired') {
      setCard('', closeBtn + '<b class="sx-dt"><span class="fit">' + esc(d.st === 'refused' ? fmt(x.duelRefused || '', { n: c.name }) : (x.duelExpired || '')) + '</span></b><div class="sx-yn"><button type="button" class="sx-btn sm" id="sxDre"><b class="fit">⚔️ ' + esc(x.duelAgain || '') + '</b></button></div>');
      $('sxDre').addEventListener('click', function () { c.picking = true; renderDuel(); });
      $('sxDx').addEventListener('click', hideMe);
      return;
    }
    var me = d.me || { net: 0, n: 0 }, him = d.him || { net: 0, n: 0 };
    var score = '<div class="sx-score"><div class="' + (me.net >= him.net ? 'lead' : '') + '"><small class="fit">' + esc(x.you || 'You') + '</small><b class="fit">' + money(me.net) + '</b><i class="fit">' + esc(fmt(x.duelTrades || '{n}', { n: me.n })) + '</i></div><span>VS</span><div class="' + (him.net > me.net ? 'lead' : '') + '"><small class="fit">' + name + '</small><b class="fit">' + money(him.net) + '</b><i class="fit">' + esc(fmt(x.duelTrades || '{n}', { n: him.n })) + '</i></div></div>';
    if (d.st === 'done') {
      setCard('done ' + (d.res || ''), closeBtn + '<b class="sx-dt"><span class="fit">' + esc(d.res === 'win' ? (x.duelWin || '') : d.res === 'lose' ? fmt(x.duelLose || '', { n: c.name }) : (x.duelTie || '')) + '</span></b>' + score + '<div class="sx-yn"><button type="button" class="sx-btn sm" id="sxDre"><b class="fit">⚔️ ' + esc(x.duelAgain || '') + '</b></button></div>');
      $('sxDre').addEventListener('click', function () { c.picking = true; renderDuel(); });
      $('sxDx').addEventListener('click', hideMe);
      return;
    }
    var paint = function () {
      if (!b.isConnected || conv !== c || !alive()) { clearInterval(tDuel); return; }
      var tt = nowS(), head;
      if (tt < d.start) head = esc(fmt(x.duelStartIn || '{s}', { s: Math.ceil(d.start - tt) }));
      else if (tt < d.end) head = '⚔️ ' + esc(x.duelLive || '') + ' · ' + esc(fmt(x.duelLeft || '{t}', { t: mmss(d.end - tt) }));
      else head = esc(x.duelWait || '…');
      var hd = b.querySelector('.sx-dt span');
      if (hd) { hd.innerHTML = head; fitEl(hd); return; }
      setCard('live', '<b class="sx-dt"><span class="fit">' + head + '</span></b>' + score + '<div class="sx-yn"><button type="button" class="sx-btn sm gold" id="sxDplay"><b class="fit">' + esc(x.duelPlay || 'Play') + '</b></button></div>');
      $('sxDplay').addEventListener('click', function () { if (D6.Live) D6.Live.close(); var demo = document.getElementById('modeDemo'); if (demo && !demo.classList.contains('on')) demo.click(); });
    };
    b.innerHTML = ''; paint();
    tDuel = setInterval(paint, 1000);
  }

  /* ---------- fiche du groupe (comme WhatsApp) ---------- */
  function panel(html) { var p = $('sxP'); p.innerHTML = html; p.hidden = false; root.classList.add('sx-in-panel'); return p; }
  function closePanel() { var p = $('sxP'); if (p) { p.hidden = true; p.innerHTML = ''; } if (root) root.classList.remove('sx-in-panel'); }
  async function shareLink(copyOnly) {
    var x = GX(), g = conv && conv.g; if (!g) return;
    if (!copyOnly) { try { if (navigator.share) { await navigator.share({ text: (x.shareText || '') + g.name, url: g.link }); return; } } catch (e) { return; } }
    try { await navigator.clipboard.writeText((x.shareText || '') + g.name + ' ' + g.link); } catch (e) { /* ignore */ }
    toast(x.copied || '✓');
  }
  function groupInfo() {
    var c = conv, g = c && c.g, x = GX(); if (!g) return;
    var p = panel('<header class="sx-hd"><button type="button" class="sx-ib sx-bk" id="sxPBack" aria-label="Back">' + ic('back') + '</button><b class="sx-ttl fit">' + esc(t('groupInfo')) + '</b></header>' +
      '<div class="sx-pbody"><div class="sx-ghero">' + avatar({ emoji: g.emoji || '💬' }, true) + '<b class="sx-ell">' + esc(g.name) + '</b><small class="fit">' + esc((x.group || t('groups')) + ' · ' + members(g.n)) + '</small></div>' +
      '<div class="sx-acts"><button type="button" id="sxGiShare">' + ic('share') + '<span class="fit">' + esc(x.invite || t('share')) + '</span></button><button type="button" id="sxGiCopy">' + ic('link') + '<span class="fit">' + esc(x.copyLink || 'Copy link') + '</span></button><button type="button" id="sxGiAdd">' + ic('uadd') + '<span class="fit">' + esc(x.addMem || t('addFriend')) + '</span></button></div>' +
      '<p class="sx-h"><span class="fit">' + esc(t('inviteLink')) + '</span></p><div class="sx-card sx-linkc"><span class="sx-idi">' + ic('link') + '</span><span class="sx-ell sx-lk">' + esc(String(g.link || '').replace(/^https:\/\//, '')) + '</span><button type="button" class="sx-ib" id="sxGiCopy2" aria-label="copy">' + ic('copy') + '</button></div>' +
      '<form class="sx-add" id="sxGiInv" autocomplete="off"><input id="sxGiId" maxlength="80" inputmode="email" spellcheck="false" autocapitalize="off" placeholder="' + esc(x.invPh || 'ID (R…) / e-mail') + '"><button type="submit" class="sx-btn"><b class="fit">' + esc(x.invGo || x.invite || 'Invite') + '</b></button></form>' +
      '<p class="sx-h"><span class="fit">' + esc(t('members') + ' · ' + g.n) + '</span></p><div class="sx-rows">' + (g.members || []).map(function (m) {
        return '<div class="sx-row sx-mem">' + avatar({ name: m.name }) + '<span class="sx-rm"><b class="sx-nm sx-ell">' + esc(m.name) + '</b><span class="sx-pv sx-ell">' + esc(m.id) + '</span></span>' +
          (m.owner ? '<em class="sx-tag">' + esc(x.admin || 'Admin') + '</em>' : '') + (g.owner && !m.owner ? '<button type="button" class="sx-btn sm ghost" data-kick="' + esc(m.id) + '" data-n="' + esc(m.name) + '"><b class="fit">' + esc(x.kick || 'Remove') + '</b></button>' : '') + '</div>';
      }).join('') + '</div><button type="button" class="sx-exit" id="sxGiExit">' + ic('exit') + '<span class="fit">' + esc(x.exit || x.leave || 'Leave') + '</span></button></div>');
    $('sxPBack').addEventListener('click', closePanel);
    $('sxGiShare').addEventListener('click', function () { shareLink(false); });
    $('sxGiCopy').addEventListener('click', function () { shareLink(true); });
    $('sxGiCopy2').addEventListener('click', function () { shareLink(true); });
    $('sxGiAdd').addEventListener('click', addMembers);
    $('sxGiInv').addEventListener('submit', async function (e) {
      e.preventDefault(); var v = $('sxGiId').value.trim(); if (v.length < 7) { toast(x.invNf || '?', 'err'); return; }
      var r = await call('gInvite', { gid: g.id, ids: [v] }); invDone(r); if (r && r.ok && r.n) $('sxGiId').value = '';
    });
    p.querySelectorAll('[data-kick]').forEach(function (b) {
      b.addEventListener('click', async function () {
        if (!window.confirm(String(x.kickQ || '?').replace('{n}', b.getAttribute('data-n')))) return;
        await call('gKick', { gid: g.id, id: b.getAttribute('data-kick') }); await refreshConv(); groupInfo();
      });
    });
    $('sxGiExit').addEventListener('click', async function () { if (!window.confirm(x.leaveQ || '?')) return; await call('gLeave', { gid: g.id }); await load(); closeConv(); seg = 'groups'; paintList(); });
    fitAll(p);
  }
  function invDone(r) {
    var x = GX();
    if (r && r.ok && r.n) toast(String(x.invSent || '✓').replace('{n}', r.n));
    else if (r && r.ok && r.in) toast(x.inGrp || '!', 'err');
    else if (r && r.ok && r.nf) toast(x.invNf || '!', 'err');
    else toast(x[(r && r.reason) || 'gNoneAdded'] || x.fail || '!', 'err');
  }
  async function addMembers() {
    var c = conv, g = c && c.g, x = GX(); if (!g) return;
    var inG = {}; (g.members || []).forEach(function (m) { inG[m.id] = 1; });
    var fr = (((D.fr && D.fr.list) || [])).filter(function (f) { return !f.blocked && !f.req; }), sel = {};
    var p = panel('<header class="sx-hd"><button type="button" class="sx-ib sx-bk" id="sxPBack" aria-label="Back">' + ic('back') + '</button><b class="sx-ttl fit">' + esc(x.addMem || '') + '</b></header>' +
      '<div class="sx-pbody">' + (soft('ginv') && x.invHint ? '<p class="sx-note"><span>' + esc(x.invHint) + '</span></p>' : '') +
      (fr.length ? '<div class="sx-srch">' + ic('search') + '<input id="sxAq" type="search" autocomplete="off" placeholder="' + esc(x.search || t('search')) + '"></div><div class="sx-rows">' + fr.map(function (f) {
        var isIn = !!inG[f.id];
        return '<button type="button" class="sx-row sx-pickr' + (isIn ? ' in' : '') + '" data-id="' + esc(f.id) + '" data-n="' + esc(String(f.name || '').toLowerCase()) + '"' + (isIn ? ' disabled' : '') + '>' + avatar({ name: f.name, on: f.on }) +
          '<span class="sx-rm"><b class="sx-nm sx-ell">' + esc(f.name) + '</b><span class="sx-pv sx-ell">' + esc(isIn ? (x.inGrp || '') : f.id) + '</span></span><i class="sx-ck">' + ic('check') + '</i></button>';
      }).join('') + '</div>' : empty(ic('uadd'), x.addMem || '', x.pickNone || '', '<button type="button" class="sx-btn gold" id="sxAinv"><b class="fit">' + esc(x.invite || 'Invite') + '</b></button>')) + '</div>' +
      (fr.length ? '<div class="sx-pfoot"><button type="button" class="sx-btn gold wide" id="sxAgo" disabled><b class="fit">' + esc(String(x.invN || '{n}').replace('{n}', 0)) + '</b></button></div>' : ''));
    $('sxPBack').addEventListener('click', groupInfo);
    if ($('sxAinv')) $('sxAinv').addEventListener('click', function () { shareLink(false); });
    if (!fr.length) { fitAll(p); return; }
    var go = $('sxAgo');
    var paint = function () { var n = Object.keys(sel).length; go.disabled = !n; go.querySelector('b').textContent = String(x.invN || '{n}').replace('{n}', n); fitEl(go.querySelector('b')); };
    p.querySelectorAll('.sx-pickr:not(.in)').forEach(function (b) { b.addEventListener('click', function () { var id = b.getAttribute('data-id'); if (sel[id]) delete sel[id]; else sel[id] = 1; b.classList.toggle('on', !!sel[id]); paint(); }); });
    $('sxAq').addEventListener('input', function () { var s = this.value.trim().toLowerCase(); p.querySelectorAll('.sx-pickr').forEach(function (b) { b.hidden = !!s && b.getAttribute('data-n').indexOf(s) < 0 && b.getAttribute('data-id').toLowerCase().indexOf(s) < 0; }); });
    go.addEventListener('click', async function () {
      var ids = Object.keys(sel); if (!ids.length) return; go.disabled = true;
      var r = await call('gInvite', { gid: g.id, ids: ids }); invDone(r);
      if (r && r.ok) groupInfo(); else paint();
    });
    fitAll(p);
  }

  /* =========================== OUVERTURE =========================== */
  // v2808 (propriétaire) : page ouverte depuis le menu en tuiles (« Plus ») → la flèche ‹ ramène à ce menu, un niveau à la fois
  var gridRet = false, directK = '';
  function toGrid() {
    gridRet = false; directK = ''; handoff = null;
    clearInterval(tConv); clearInterval(tDuel); conv = null; closePanel(); closeSheet(); if (root) inConv(false);
    stop(); $('liveModal').classList.remove('sx-on');
    if (D6.Live && D6.Live.show) D6.Live.show('home');
  }
  function closeList() { if (gridRet) { toGrid(); return; } if (D6.Live) D6.Live.close(); }
  function backConv() { if (gridRet && conv && directK && conv.k === directK) { toGrid(); return; } closeConv(); }
  async function open(w, fromGrid) {
    if (!mount()) return false;
    handoff = null; on();
    var startK = w === 'chat' ? 'team' : w === 'news' ? 'news' : '';
    gridRet = !!fromGrid; directK = fromGrid ? startK : '';
    seg = w === 'groups' ? 'groups' : ['friends', 'duel', 'myid', 'record'].indexOf(w) >= 0 ? 'friends' : 'chats';
    hint = w === 'duel' ? t('duelHint') : '';
    q = ''; conv = null; inConv(false); closePanel(); closeSheet();
    paintList(); paintConvEmpty();
    if (!guest() && D6.LiveSend && D6.LiveSend.status && !(D6.LiveSend.enabled && D6.LiveSend.enabled())) D6.LiveSend.status().then(function () { addMoneyBtn(); });
    if (startK) openConv(startK);
    await load();
    if (!active) return true;
    // invité par un lien avant de s'inscrire : on rejoint le groupe maintenant
    if (!guest()) { var pend = ''; try { pend = sessionStorage.getItem('oro_gjoin') || ''; sessionStorage.removeItem('oro_gjoin'); } catch (e) { pend = ''; } if (pend) { var jr = await call('gJoin', { tok: pend }); if (jr && jr.ok) { toast(String(GX().joined || '✓').replace('{n}', jr.g.name)); await load(); openConv('g:' + jr.g.id); } } }
    if ($('sxBody')) paintBody(true);
    listPoll();
    return true;
  }
  async function openGroup(gid) { if (!active) await open('groups'); seg = 'groups'; await load(); paintBody(); openConv('g:' + gid); }
  // vers une page de l'ancien Social (Envoyer de l'argent, Plus…) ; « Retour » ramène ici
  function leave(w, sub, direct) {
    handoff = { direct: !!direct, k: conv && conv.k, seg: seg };
    stop(); $('liveModal').classList.remove('sx-on');
    if (D6.Live && D6.Live.show) D6.Live.show(w, sub);
  }
  function back(tab) {
    if (!handoff) return false;
    if (!handoff.direct && tab !== 'home') return false;
    var h = handoff; handoff = null;
    on(); seg = h.seg || 'chats'; paintList(); paintConvEmpty(); listPoll();
    if (h.k) openConv(h.k);
    load().then(function () { if (active && $('sxBody')) paintBody(); });
    return true;
  }
  var rT = 0;
  window.addEventListener('resize', function () { clearTimeout(rT); rT = setTimeout(function () { if (!active) return; wide = mq(); fitAll(root); }, 150); });
  document.addEventListener('oro:livepack', function () { if (active) { paintList(); if (conv) { var k = conv.k; openConv(k); } else paintConvEmpty(); } });
  D6.Social2 = { open: open, openGroup: openGroup, stop: stop, hide: hide, back: back, active: function () { return active; }, refresh: refreshList, t: t };
})(window.D6 = window.D6 || {});
