/* v2796 (propriétaire) — SOCIAL « MESSAGERIE » comme WhatsApp / Telegram, dans le style OROLADO (nuit violette, or).
   Liste des discussions (avatar, nom, dernier message, heure, non lus, point « en ligne ») ; onglets Discussions · Groupes ·
   Amis ; vraie conversation (bulles, heure, ✓ / ✓✓, dates, barre d'écriture photo / note vocale / envoyer, états d'envoi) ;
   fiche du groupe (membres, lien d'invitation) ; demandes de contact Accepter / Refuser ; Envoyer de l'argent et Défier
   dans l'en-tête d'une conversation. Mêmes appels serveur que l'ancien Social (live.php) : aucune règle d'argent ici.
   Sur grand écran (≥ 860 px) : liste à gauche, conversation à droite. Rien ne tourne quand Social est fermé.
   v2905 (propriétaire) : aperçu des liens d'invitation (on n'entre JAMAIS seul dans un groupe), le créateur supprime son
   groupe, logos de groupe dessinés, photos de profil / de groupe, discussions mises à jour sans « tic-tic » (rien n'est
   redessiné), ouverture instantanée (derniers messages gardés par compte + « since »), écran bloqué sur iPhone (16 px,
   visualViewport), confirmations dans le site, copie « ✓ » sans notification, Actualités = page « Bon à savoir ». */
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
  /* v2905 (propriétaire) — nouveaux mots de Social : lien d'invitation, supprimer / quitter, copier, photos, logos, limites.
     Les mots de la fiche du groupe sont ici dans les 12 langues (avant, certains restaient en anglais). */
  var S2 = {
    en: { join: 'Join the group', joinSign: 'Sign up to join', haveAcc: 'I already have an account', joinBy: 'Created by {a}', gInvT: 'Group invitation', gBadT: 'Invalid invite link', gBadS: 'This link no longer works: the group may have been deleted. Ask for a new link.', gDelT: 'Group deleted', gDelS: 'The creator deleted this group.', ok: 'OK', del: 'Delete group', delQ: 'Delete “{n}”?', delS: 'The group will be deleted for all members. This cannot be undone.', leave: 'Leave group', leaveQ: 'Leave “{n}”?', leaveS: 'You will no longer receive its messages.', cancel: 'Cancel', kick: 'Remove', kickQ: 'Remove {n} from the group?', copy: 'Copy', copyLink: 'Copy link', invite: 'Invite', addMem: 'Add members', admin: 'Admin', you: 'You', group: 'Group', slow: 'Easy 🙂 try again in a few seconds.', tooMany: 'Short break 🙂 try again in a moment.', imgDay: 'Enough photos for today 🙂', badImg: 'Photo refused, try another image.', photoAdd: 'Add a photo', photo2: 'Change photo', photoDel: 'Remove photo', logoPick: 'Choose a logo', myPhoto: 'My photo', reportT: 'Report {n}', reportPh: 'Why? (scam, insults…)', reportGo: 'Report and block', socialSub: 'Friends · chats · groups', addGroup: 'Create a group', saved: 'Saved',
      em: { fire: 'Fire', power: 'Power', crown: 'VIP', rocket: 'Rocket', diamond: 'Diamond', money: 'Money', trophy: 'Trophy', lion: 'Lion', globe: 'World', heart: 'Friends', star: 'Star', shield: 'Shield' } },
    fr: { join: 'Rejoindre le groupe', joinSign: 'Inscris-toi pour rejoindre', haveAcc: 'J’ai déjà un compte', joinBy: 'Créé par {a}', gInvT: 'Invitation à un groupe', gBadT: 'Lien d’invitation invalide', gBadS: 'Ce lien ne marche plus : le groupe a peut-être été supprimé. Demande un nouveau lien.', gDelT: 'Groupe supprimé', gDelS: 'Le créateur a supprimé ce groupe.', ok: 'OK', del: 'Supprimer le groupe', delQ: 'Supprimer « {n} » ?', delS: 'Le groupe sera supprimé pour tous les membres. C’est définitif.', leave: 'Quitter le groupe', leaveQ: 'Quitter « {n} » ?', leaveS: 'Tu ne recevras plus ses messages.', cancel: 'Annuler', kick: 'Retirer', kickQ: 'Retirer {n} du groupe ?', copy: 'Copier', copyLink: 'Copier le lien', invite: 'Inviter', addMem: 'Ajouter des membres', admin: 'Admin', you: 'Toi', group: 'Groupe', slow: 'Doucement 🙂 réessaie dans quelques secondes.', tooMany: 'Petite pause 🙂 réessaie dans un moment.', imgDay: 'Assez de photos pour aujourd’hui 🙂', badImg: 'Photo refusée, essaie une autre image.', photoAdd: 'Ajouter une photo', photo2: 'Changer la photo', photoDel: 'Retirer la photo', logoPick: 'Choisir un logo', myPhoto: 'Ma photo', reportT: 'Signaler {n}', reportPh: 'Pourquoi ? (arnaque, insultes…)', reportGo: 'Signaler et bloquer', socialSub: 'Amis · discussions · groupes', addGroup: 'Créer un groupe', saved: 'Enregistré',
      em: { fire: 'Feu', power: 'Puissance', crown: 'VIP', rocket: 'Fusée', diamond: 'Diamant', money: 'Argent', trophy: 'Trophée', lion: 'Lion', globe: 'Monde', heart: 'Amis', star: 'Étoile', shield: 'Bouclier' } },
    es: { join: 'Unirme al grupo', joinSign: 'Regístrate para unirte', haveAcc: 'Ya tengo cuenta', joinBy: 'Creado por {a}', gInvT: 'Invitación a un grupo', gBadT: 'Enlace de invitación no válido', gBadS: 'Este enlace ya no funciona: puede que el grupo se haya eliminado. Pide un enlace nuevo.', gDelT: 'Grupo eliminado', gDelS: 'El creador eliminó este grupo.', ok: 'OK', del: 'Eliminar el grupo', delQ: '¿Eliminar «{n}»?', delS: 'El grupo se eliminará para todos los miembros. Es definitivo.', leave: 'Salir del grupo', leaveQ: '¿Salir de «{n}»?', leaveS: 'Ya no recibirás sus mensajes.', cancel: 'Cancelar', kick: 'Quitar', kickQ: '¿Quitar a {n} del grupo?', copy: 'Copiar', copyLink: 'Copiar enlace', invite: 'Invitar', addMem: 'Añadir miembros', admin: 'Admin', you: 'Tú', group: 'Grupo', slow: 'Despacio 🙂 inténtalo en unos segundos.', tooMany: 'Pequeña pausa 🙂 inténtalo en un momento.', imgDay: 'Suficientes fotos por hoy 🙂', badImg: 'Foto rechazada, prueba otra imagen.', photoAdd: 'Añadir una foto', photo2: 'Cambiar la foto', photoDel: 'Quitar la foto', logoPick: 'Elegir un logo', myPhoto: 'Mi foto', reportT: 'Denunciar a {n}', reportPh: '¿Por qué? (estafa, insultos…)', reportGo: 'Denunciar y bloquear', socialSub: 'Amigos · chats · grupos', addGroup: 'Crear un grupo', saved: 'Guardado',
      em: { fire: 'Fuego', power: 'Poder', crown: 'VIP', rocket: 'Cohete', diamond: 'Diamante', money: 'Dinero', trophy: 'Trofeo', lion: 'León', globe: 'Mundo', heart: 'Amigos', star: 'Estrella', shield: 'Escudo' } },
    pt: { join: 'Entrar no grupo', joinSign: 'Regista-te para entrar', haveAcc: 'Já tenho conta', joinBy: 'Criado por {a}', gInvT: 'Convite para um grupo', gBadT: 'Link de convite inválido', gBadS: 'Este link já não funciona: o grupo pode ter sido apagado. Pede um novo link.', gDelT: 'Grupo apagado', gDelS: 'O criador apagou este grupo.', ok: 'OK', del: 'Apagar o grupo', delQ: 'Apagar «{n}»?', delS: 'O grupo será apagado para todos os membros. É definitivo.', leave: 'Sair do grupo', leaveQ: 'Sair de «{n}»?', leaveS: 'Deixarás de receber as mensagens.', cancel: 'Cancelar', kick: 'Remover', kickQ: 'Remover {n} do grupo?', copy: 'Copiar', copyLink: 'Copiar link', invite: 'Convidar', addMem: 'Adicionar membros', admin: 'Admin', you: 'Tu', group: 'Grupo', slow: 'Calma 🙂 tenta daqui a uns segundos.', tooMany: 'Pequena pausa 🙂 tenta daqui a pouco.', imgDay: 'Chega de fotos por hoje 🙂', badImg: 'Foto recusada, tenta outra imagem.', photoAdd: 'Adicionar foto', photo2: 'Mudar a foto', photoDel: 'Remover a foto', logoPick: 'Escolher um logo', myPhoto: 'A minha foto', reportT: 'Denunciar {n}', reportPh: 'Porquê? (burla, insultos…)', reportGo: 'Denunciar e bloquear', socialSub: 'Amigos · conversas · grupos', addGroup: 'Criar um grupo', saved: 'Guardado',
      em: { fire: 'Fogo', power: 'Poder', crown: 'VIP', rocket: 'Foguete', diamond: 'Diamante', money: 'Dinheiro', trophy: 'Troféu', lion: 'Leão', globe: 'Mundo', heart: 'Amigos', star: 'Estrela', shield: 'Escudo' } },
    ar: { join: 'الانضمام إلى المجموعة', joinSign: 'سجّل للانضمام', haveAcc: 'لدي حساب بالفعل', joinBy: 'أنشأها {a}', gInvT: 'دعوة إلى مجموعة', gBadT: 'رابط الدعوة غير صالح', gBadS: 'هذا الرابط لم يعد يعمل: ربما حُذفت المجموعة. اطلب رابطًا جديدًا.', gDelT: 'تم حذف المجموعة', gDelS: 'حذف المنشئ هذه المجموعة.', ok: 'حسنًا', del: 'حذف المجموعة', delQ: 'حذف «{n}»؟', delS: 'ستُحذف المجموعة لدى جميع الأعضاء. لا يمكن التراجع.', leave: 'مغادرة المجموعة', leaveQ: 'مغادرة «{n}»؟', leaveS: 'لن تصلك رسائلها بعد الآن.', cancel: 'إلغاء', kick: 'إزالة', kickQ: 'إزالة {n} من المجموعة؟', copy: 'نسخ', copyLink: 'نسخ الرابط', invite: 'دعوة', addMem: 'إضافة أعضاء', admin: 'مشرف', you: 'أنت', group: 'مجموعة', slow: 'على مهلك 🙂 حاول بعد ثوانٍ.', tooMany: 'استراحة قصيرة 🙂 حاول بعد قليل.', imgDay: 'صور كافية لليوم 🙂', badImg: 'رُفضت الصورة، جرّب صورة أخرى.', photoAdd: 'إضافة صورة', photo2: 'تغيير الصورة', photoDel: 'إزالة الصورة', logoPick: 'اختيار شعار', myPhoto: 'صورتي', reportT: 'الإبلاغ عن {n}', reportPh: 'لماذا؟ (احتيال، شتائم…)', reportGo: 'إبلاغ وحظر', socialSub: 'أصدقاء · محادثات · مجموعات', addGroup: 'إنشاء مجموعة', saved: 'تم الحفظ',
      em: { fire: 'نار', power: 'قوة', crown: 'VIP', rocket: 'صاروخ', diamond: 'ألماس', money: 'مال', trophy: 'كأس', lion: 'أسد', globe: 'العالم', heart: 'أصدقاء', star: 'نجمة', shield: 'درع' } },
    tr: { join: 'Gruba katıl', joinSign: 'Katılmak için kaydol', haveAcc: 'Zaten hesabım var', joinBy: 'Kuran: {a}', gInvT: 'Grup daveti', gBadT: 'Geçersiz davet bağlantısı', gBadS: 'Bu bağlantı artık çalışmıyor: grup silinmiş olabilir. Yeni bir bağlantı iste.', gDelT: 'Grup silindi', gDelS: 'Kurucu bu grubu sildi.', ok: 'Tamam', del: 'Grubu sil', delQ: '“{n}” silinsin mi?', delS: 'Grup tüm üyeler için silinecek. Geri alınamaz.', leave: 'Gruptan çık', leaveQ: '“{n}” grubundan çıkılsın mı?', leaveS: 'Artık mesajlarını almayacaksın.', cancel: 'Vazgeç', kick: 'Çıkar', kickQ: '{n} gruptan çıkarılsın mı?', copy: 'Kopyala', copyLink: 'Bağlantıyı kopyala', invite: 'Davet et', addMem: 'Üye ekle', admin: 'Yönetici', you: 'Sen', group: 'Grup', slow: 'Yavaş 🙂 birkaç saniye sonra dene.', tooMany: 'Kısa bir mola 🙂 biraz sonra dene.', imgDay: 'Bugünlük yeterince fotoğraf 🙂', badImg: 'Fotoğraf reddedildi, başka bir resim dene.', photoAdd: 'Fotoğraf ekle', photo2: 'Fotoğrafı değiştir', photoDel: 'Fotoğrafı kaldır', logoPick: 'Logo seç', myPhoto: 'Fotoğrafım', reportT: '{n} kişisini bildir', reportPh: 'Neden? (dolandırıcılık, hakaret…)', reportGo: 'Bildir ve engelle', socialSub: 'Arkadaşlar · sohbetler · gruplar', addGroup: 'Grup kur', saved: 'Kaydedildi',
      em: { fire: 'Ateş', power: 'Güç', crown: 'VIP', rocket: 'Roket', diamond: 'Elmas', money: 'Para', trophy: 'Kupa', lion: 'Aslan', globe: 'Dünya', heart: 'Dostlar', star: 'Yıldız', shield: 'Kalkan' } },
    vi: { join: 'Tham gia nhóm', joinSign: 'Đăng ký để tham gia', haveAcc: 'Tôi đã có tài khoản', joinBy: 'Tạo bởi {a}', gInvT: 'Lời mời vào nhóm', gBadT: 'Liên kết mời không hợp lệ', gBadS: 'Liên kết này không còn dùng được: nhóm có thể đã bị xóa. Hãy xin liên kết mới.', gDelT: 'Nhóm đã bị xóa', gDelS: 'Người tạo đã xóa nhóm này.', ok: 'OK', del: 'Xóa nhóm', delQ: 'Xóa “{n}”?', delS: 'Nhóm sẽ bị xóa với mọi thành viên. Không thể hoàn tác.', leave: 'Rời nhóm', leaveQ: 'Rời “{n}”?', leaveS: 'Bạn sẽ không nhận tin nhắn của nhóm nữa.', cancel: 'Hủy', kick: 'Xóa', kickQ: 'Xóa {n} khỏi nhóm?', copy: 'Sao chép', copyLink: 'Sao chép liên kết', invite: 'Mời', addMem: 'Thêm thành viên', admin: 'Quản trị', you: 'Bạn', group: 'Nhóm', slow: 'Từ từ 🙂 thử lại sau vài giây.', tooMany: 'Nghỉ chút 🙂 thử lại sau.', imgDay: 'Hôm nay đủ ảnh rồi 🙂', badImg: 'Ảnh bị từ chối, thử ảnh khác.', photoAdd: 'Thêm ảnh', photo2: 'Đổi ảnh', photoDel: 'Gỡ ảnh', logoPick: 'Chọn logo', myPhoto: 'Ảnh của tôi', reportT: 'Báo cáo {n}', reportPh: 'Vì sao? (lừa đảo, xúc phạm…)', reportGo: 'Báo cáo và chặn', socialSub: 'Bạn bè · trò chuyện · nhóm', addGroup: 'Tạo nhóm', saved: 'Đã lưu',
      em: { fire: 'Lửa', power: 'Sức mạnh', crown: 'VIP', rocket: 'Tên lửa', diamond: 'Kim cương', money: 'Tiền', trophy: 'Cúp', lion: 'Sư tử', globe: 'Thế giới', heart: 'Bạn bè', star: 'Ngôi sao', shield: 'Khiên' } },
    id: { join: 'Gabung grup', joinSign: 'Daftar untuk bergabung', haveAcc: 'Saya sudah punya akun', joinBy: 'Dibuat oleh {a}', gInvT: 'Undangan grup', gBadT: 'Tautan undangan tidak valid', gBadS: 'Tautan ini tidak berlaku lagi: grup mungkin sudah dihapus. Minta tautan baru.', gDelT: 'Grup dihapus', gDelS: 'Pembuat grup telah menghapus grup ini.', ok: 'OK', del: 'Hapus grup', delQ: 'Hapus “{n}”?', delS: 'Grup akan dihapus untuk semua anggota. Tidak bisa dibatalkan.', leave: 'Keluar grup', leaveQ: 'Keluar dari “{n}”?', leaveS: 'Kamu tidak akan menerima pesannya lagi.', cancel: 'Batal', kick: 'Keluarkan', kickQ: 'Keluarkan {n} dari grup?', copy: 'Salin', copyLink: 'Salin tautan', invite: 'Undang', addMem: 'Tambah anggota', admin: 'Admin', you: 'Kamu', group: 'Grup', slow: 'Pelan-pelan 🙂 coba lagi beberapa detik lagi.', tooMany: 'Istirahat sebentar 🙂 coba lagi nanti.', imgDay: 'Cukup foto untuk hari ini 🙂', badImg: 'Foto ditolak, coba gambar lain.', photoAdd: 'Tambah foto', photo2: 'Ganti foto', photoDel: 'Hapus foto', logoPick: 'Pilih logo', myPhoto: 'Fotoku', reportT: 'Laporkan {n}', reportPh: 'Kenapa? (penipuan, hinaan…)', reportGo: 'Laporkan dan blokir', socialSub: 'Teman · obrolan · grup', addGroup: 'Buat grup', saved: 'Tersimpan',
      em: { fire: 'Api', power: 'Kekuatan', crown: 'VIP', rocket: 'Roket', diamond: 'Berlian', money: 'Uang', trophy: 'Piala', lion: 'Singa', globe: 'Dunia', heart: 'Teman', star: 'Bintang', shield: 'Perisai' } },
    ru: { join: 'Вступить в группу', joinSign: 'Зарегистрируйтесь, чтобы вступить', haveAcc: 'У меня уже есть аккаунт', joinBy: 'Создатель: {a}', gInvT: 'Приглашение в группу', gBadT: 'Ссылка недействительна', gBadS: 'Эта ссылка больше не работает: возможно, группа удалена. Попросите новую ссылку.', gDelT: 'Группа удалена', gDelS: 'Создатель удалил эту группу.', ok: 'OK', del: 'Удалить группу', delQ: 'Удалить «{n}»?', delS: 'Группа будет удалена для всех участников. Это необратимо.', leave: 'Выйти из группы', leaveQ: 'Выйти из «{n}»?', leaveS: 'Вы больше не будете получать её сообщения.', cancel: 'Отмена', kick: 'Удалить', kickQ: 'Удалить {n} из группы?', copy: 'Копировать', copyLink: 'Копировать ссылку', invite: 'Пригласить', addMem: 'Добавить участников', admin: 'Админ', you: 'Вы', group: 'Группа', slow: 'Не так быстро 🙂 попробуйте через пару секунд.', tooMany: 'Небольшая пауза 🙂 попробуйте чуть позже.', imgDay: 'На сегодня фото достаточно 🙂', badImg: 'Фото отклонено, попробуйте другое.', photoAdd: 'Добавить фото', photo2: 'Сменить фото', photoDel: 'Убрать фото', logoPick: 'Выбрать логотип', myPhoto: 'Моё фото', reportT: 'Пожаловаться на {n}', reportPh: 'Почему? (мошенничество, оскорбления…)', reportGo: 'Пожаловаться и заблокировать', socialSub: 'Друзья · чаты · группы', addGroup: 'Создать группу', saved: 'Сохранено',
      em: { fire: 'Огонь', power: 'Сила', crown: 'VIP', rocket: 'Ракета', diamond: 'Алмаз', money: 'Деньги', trophy: 'Кубок', lion: 'Лев', globe: 'Мир', heart: 'Друзья', star: 'Звезда', shield: 'Щит' } },
    de: { join: 'Gruppe beitreten', joinSign: 'Registrieren zum Beitreten', haveAcc: 'Ich habe schon ein Konto', joinBy: 'Erstellt von {a}', gInvT: 'Gruppeneinladung', gBadT: 'Ungültiger Einladungslink', gBadS: 'Dieser Link funktioniert nicht mehr: Die Gruppe wurde vielleicht gelöscht. Bitte um einen neuen Link.', gDelT: 'Gruppe gelöscht', gDelS: 'Der Gründer hat diese Gruppe gelöscht.', ok: 'OK', del: 'Gruppe löschen', delQ: '„{n}“ löschen?', delS: 'Die Gruppe wird für alle Mitglieder gelöscht. Das ist endgültig.', leave: 'Gruppe verlassen', leaveQ: '„{n}“ verlassen?', leaveS: 'Du bekommst ihre Nachrichten nicht mehr.', cancel: 'Abbrechen', kick: 'Entfernen', kickQ: '{n} aus der Gruppe entfernen?', copy: 'Kopieren', copyLink: 'Link kopieren', invite: 'Einladen', addMem: 'Mitglieder hinzufügen', admin: 'Admin', you: 'Du', group: 'Gruppe', slow: 'Langsam 🙂 versuch es in ein paar Sekunden.', tooMany: 'Kurze Pause 🙂 versuch es gleich nochmal.', imgDay: 'Genug Fotos für heute 🙂', badImg: 'Foto abgelehnt, versuch ein anderes Bild.', photoAdd: 'Foto hinzufügen', photo2: 'Foto ändern', photoDel: 'Foto entfernen', logoPick: 'Logo wählen', myPhoto: 'Mein Foto', reportT: '{n} melden', reportPh: 'Warum? (Betrug, Beleidigungen…)', reportGo: 'Melden und blockieren', socialSub: 'Freunde · Chats · Gruppen', addGroup: 'Gruppe erstellen', saved: 'Gespeichert',
      em: { fire: 'Feuer', power: 'Power', crown: 'VIP', rocket: 'Rakete', diamond: 'Diamant', money: 'Geld', trophy: 'Pokal', lion: 'Löwe', globe: 'Welt', heart: 'Freunde', star: 'Stern', shield: 'Schild' } },
    hi: { join: 'ग्रुप में जुड़ें', joinSign: 'जुड़ने के लिए साइन अप करें', haveAcc: 'मेरा खाता पहले से है', joinBy: '{a} ने बनाया', gInvT: 'ग्रुप आमंत्रण', gBadT: 'अमान्य आमंत्रण लिंक', gBadS: 'यह लिंक अब काम नहीं करता: ग्रुप शायद हटा दिया गया है। नया लिंक माँगें।', gDelT: 'ग्रुप हटा दिया गया', gDelS: 'बनाने वाले ने यह ग्रुप हटा दिया।', ok: 'ठीक है', del: 'ग्रुप हटाएँ', delQ: '“{n}” हटाएँ?', delS: 'ग्रुप सभी सदस्यों के लिए हट जाएगा। यह वापस नहीं होगा।', leave: 'ग्रुप छोड़ें', leaveQ: '“{n}” छोड़ें?', leaveS: 'आपको इसके संदेश अब नहीं मिलेंगे।', cancel: 'रद्द करें', kick: 'हटाएँ', kickQ: '{n} को ग्रुप से हटाएँ?', copy: 'कॉपी', copyLink: 'लिंक कॉपी करें', invite: 'आमंत्रित करें', addMem: 'सदस्य जोड़ें', admin: 'एडमिन', you: 'आप', group: 'ग्रुप', slow: 'आराम से 🙂 कुछ सेकंड बाद कोशिश करें।', tooMany: 'छोटा ब्रेक 🙂 थोड़ी देर बाद कोशिश करें।', imgDay: 'आज के लिए काफ़ी फ़ोटो 🙂', badImg: 'फ़ोटो अस्वीकार, दूसरी तस्वीर आज़माएँ।', photoAdd: 'फ़ोटो जोड़ें', photo2: 'फ़ोटो बदलें', photoDel: 'फ़ोटो हटाएँ', logoPick: 'लोगो चुनें', myPhoto: 'मेरी फ़ोटो', reportT: '{n} की शिकायत', reportPh: 'क्यों? (धोखा, गाली…)', reportGo: 'शिकायत करें और ब्लॉक करें', socialSub: 'दोस्त · चैट · ग्रुप', addGroup: 'ग्रुप बनाएँ', saved: 'सहेजा गया',
      em: { fire: 'आग', power: 'ताक़त', crown: 'VIP', rocket: 'रॉकेट', diamond: 'हीरा', money: 'पैसा', trophy: 'ट्रॉफ़ी', lion: 'शेर', globe: 'दुनिया', heart: 'दोस्त', star: 'सितारा', shield: 'ढाल' } },
    zh: { join: '加入群组', joinSign: '注册后加入', haveAcc: '我已有账户', joinBy: '创建者：{a}', gInvT: '群组邀请', gBadT: '邀请链接无效', gBadS: '此链接已失效：群组可能已被删除。请索取新链接。', gDelT: '群组已删除', gDelS: '群主已删除此群组。', ok: '好', del: '删除群组', delQ: '删除“{n}”？', delS: '群组将对所有成员删除，且无法恢复。', leave: '退出群组', leaveQ: '退出“{n}”？', leaveS: '你将不再收到它的消息。', cancel: '取消', kick: '移除', kickQ: '将 {n} 移出群组？', copy: '复制', copyLink: '复制链接', invite: '邀请', addMem: '添加成员', admin: '管理员', you: '你', group: '群组', slow: '慢一点 🙂 几秒后再试。', tooMany: '休息一下 🙂 稍后再试。', imgDay: '今天的照片够多啦 🙂', badImg: '照片无法发送，请换一张。', photoAdd: '添加照片', photo2: '更换照片', photoDel: '移除照片', logoPick: '选择徽标', myPhoto: '我的照片', reportT: '举报 {n}', reportPh: '原因？（诈骗、辱骂…）', reportGo: '举报并屏蔽', socialSub: '好友 · 聊天 · 群组', addGroup: '创建群组', saved: '已保存',
      em: { fire: '火焰', power: '力量', crown: 'VIP', rocket: '火箭', diamond: '钻石', money: '财富', trophy: '奖杯', lion: '雄狮', globe: '世界', heart: '好友', star: '星星', shield: '盾牌' } }
  };
  Object.keys(S2).forEach(function (l) { S[l] = Object.assign(S[l] || {}, S2[l]); });
  /* v2905 (propriétaire) — Actualités : quelques cartes utiles et toujours vraies (aucune promesse d'argent, aucun bonus),
     montrées AVANT les vraies publications de l'équipe (celles-ci restent en bas, là où la page s'ouvre). [titre, ligne, bouton] */
  var TIPS = {
    en: { demo: ['Practise in demo', 'Risk-free, at your own pace.', 'Demo'], action: ['Play it yourself', 'In Action, you are the player.', 'Play'], myid: ['Add your friends', 'With your ID, in a second.', 'My ID'], groups: ['Create your group', 'And invite your friends.', 'My groups'], duel: ['Challenge a friend', 'In demo: the best one wins.', 'Challenge'], help: ['Need help?', 'Write to the team, we answer.', 'Write'], newsT: 'OROLADO news', good: 'Good to know' },
    fr: { demo: ['Entraîne-toi en démo', 'Sans risque, à ton rythme.', 'Démo'], action: ['Joue toi-même', 'Dans Action, c’est toi qui joues.', 'Jouer'], myid: ['Ajoute tes amis', 'Avec ton identifiant, en un instant.', 'Mon identifiant'], groups: ['Crée ton groupe', 'Et invite tes amis.', 'Mes groupes'], duel: ['Défie un ami', 'En démo : le meilleur gagne.', 'Défier'], help: ['Besoin d’aide ?', 'Écris à l’équipe, on te répond.', 'Écrire'], newsT: 'Les nouvelles d’OROLADO', good: 'Bon à savoir' },
    es: { demo: ['Practica en demo', 'Sin riesgo, a tu ritmo.', 'Demo'], action: ['Juega tú mismo', 'En Acción, juegas tú.', 'Jugar'], myid: ['Añade a tus amigos', 'Con tu ID, en un instante.', 'Mi ID'], groups: ['Crea tu grupo', 'E invita a tus amigos.', 'Mis grupos'], duel: ['Reta a un amigo', 'En demo: gana el mejor.', 'Retar'], help: ['¿Necesitas ayuda?', 'Escribe al equipo, te respondemos.', 'Escribir'], newsT: 'Noticias de OROLADO', good: 'Bueno saber' },
    pt: { demo: ['Treina em demo', 'Sem risco, ao teu ritmo.', 'Demo'], action: ['Joga tu mesmo', 'Em Ação, és tu que jogas.', 'Jogar'], myid: ['Adiciona amigos', 'Com o teu ID, num instante.', 'O meu ID'], groups: ['Cria o teu grupo', 'E convida os teus amigos.', 'Os meus grupos'], duel: ['Desafia um amigo', 'Em demo: ganha o melhor.', 'Desafiar'], help: ['Precisas de ajuda?', 'Escreve à equipa, respondemos.', 'Escrever'], newsT: 'Notícias da OROLADO', good: 'Bom saber' },
    ar: { demo: ['تدرّب في التجريبي', 'بلا مخاطرة وعلى راحتك.', 'تجريبي'], action: ['العب بنفسك', 'في أكشن، أنت من يلعب.', 'العب'], myid: ['أضف أصدقاءك', 'بمعرّفك وفي لحظة.', 'معرّفي'], groups: ['أنشئ مجموعتك', 'وادعُ أصدقاءك.', 'مجموعاتي'], duel: ['تحدَّ صديقًا', 'في التجريبي: الأفضل يفوز.', 'تحدٍّ'], help: ['تحتاج مساعدة؟', 'راسل الفريق، سنرد عليك.', 'راسلنا'], newsT: 'أخبار OROLADO', good: 'من المفيد معرفته' },
    tr: { demo: ['Demoda pratik yap', 'Risksiz, kendi hızında.', 'Demo'], action: ['Kendin oyna', 'Aksiyon’da oynayan sensin.', 'Oyna'], myid: ['Arkadaşlarını ekle', 'Kimliğinle, anında.', 'Kimliğim'], groups: ['Grubunu kur', 'Ve arkadaşlarını davet et.', 'Gruplarım'], duel: ['Bir arkadaşına meydan oku', 'Demoda: en iyisi kazanır.', 'Meydan oku'], help: ['Yardım mı lazım?', 'Ekibe yaz, yanıtlıyoruz.', 'Yaz'], newsT: 'OROLADO haberleri', good: 'Bilmekte fayda var' },
    vi: { demo: ['Luyện tập với demo', 'Không rủi ro, theo nhịp của bạn.', 'Demo'], action: ['Tự mình chơi', 'Trong Hành động, bạn là người chơi.', 'Chơi'], myid: ['Thêm bạn bè', 'Bằng ID của bạn, chỉ trong giây lát.', 'ID của tôi'], groups: ['Tạo nhóm', 'Và mời bạn bè.', 'Nhóm của tôi'], duel: ['Thách đấu bạn bè', 'Ở demo: ai giỏi nhất sẽ thắng.', 'Thách đấu'], help: ['Cần giúp đỡ?', 'Nhắn cho đội, chúng tôi sẽ trả lời.', 'Nhắn tin'], newsT: 'Tin OROLADO', good: 'Nên biết' },
    id: { demo: ['Berlatih di demo', 'Tanpa risiko, sesuai iramamu.', 'Demo'], action: ['Main sendiri', 'Di Aksi, kamu yang bermain.', 'Main'], myid: ['Tambah temanmu', 'Dengan ID-mu, sekejap saja.', 'ID-ku'], groups: ['Buat grupmu', 'Dan undang temanmu.', 'Grupku'], duel: ['Tantang teman', 'Di demo: yang terbaik menang.', 'Tantang'], help: ['Butuh bantuan?', 'Tulis ke tim, kami jawab.', 'Tulis'], newsT: 'Kabar OROLADO', good: 'Perlu kamu tahu' },
    ru: { demo: ['Тренируйся в демо', 'Без риска, в своём темпе.', 'Демо'], action: ['Играй сам', 'В «Экшен» играешь ты.', 'Играть'], myid: ['Добавь друзей', 'По своему ID, за секунду.', 'Мой ID'], groups: ['Создай группу', 'И пригласи друзей.', 'Мои группы'], duel: ['Брось вызов другу', 'В демо: побеждает лучший.', 'Вызвать'], help: ['Нужна помощь?', 'Напиши команде, мы ответим.', 'Написать'], newsT: 'Новости OROLADO', good: 'Полезно знать' },
    de: { demo: ['Übe im Demo', 'Ohne Risiko, in deinem Tempo.', 'Demo'], action: ['Spiel selbst', 'In Action spielst du.', 'Spielen'], myid: ['Freunde hinzufügen', 'Mit deiner ID, im Nu.', 'Meine ID'], groups: ['Gruppe erstellen', 'Und Freunde einladen.', 'Meine Gruppen'], duel: ['Fordere einen Freund heraus', 'Im Demo: der Beste gewinnt.', 'Fordern'], help: ['Hilfe nötig?', 'Schreib dem Team, wir antworten.', 'Schreiben'], newsT: 'OROLADO-News', good: 'Gut zu wissen' },
    hi: { demo: ['डेमो में अभ्यास करें', 'बिना जोखिम, अपनी रफ़्तार से।', 'डेमो'], action: ['ख़ुद खेलें', 'एक्शन में आप खेलते हैं।', 'खेलें'], myid: ['दोस्त जोड़ें', 'अपनी ID से, पल भर में।', 'मेरी ID'], groups: ['ग्रुप बनाएँ', 'और दोस्तों को बुलाएँ।', 'मेरे ग्रुप'], duel: ['दोस्त को चुनौती दें', 'डेमो में: सबसे अच्छा जीतता है।', 'चुनौती'], help: ['मदद चाहिए?', 'टीम को लिखें, हम जवाब देंगे।', 'लिखें'], newsT: 'OROLADO समाचार', good: 'जानने लायक' },
    zh: { demo: ['用模拟盘练习', '零风险，按你的节奏。', '模拟'], action: ['亲自上手', '在“动作”里，由你来玩。', '开玩'], myid: ['添加好友', '用你的 ID，一秒搞定。', '我的 ID'], groups: ['创建群组', '邀请你的好友。', '我的群组'], duel: ['挑战好友', '模拟盘对决，强者胜。', '挑战'], help: ['需要帮助？', '给团队留言，我们会回复。', '留言'], newsT: 'OROLADO 资讯', good: '实用提示' }
  };
  var TIP_ICO = { demo: 'shield', action: 'rocket', myid: 'heart', groups: 'globe', duel: 'trophy', help: 'chat' };
  var TIP_EMO = { chat: '💬' };
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
  function noEmo(s) { return String(s || '').replace(/^[^0-9A-Za-zÀ-￿]*[☀-➿\uD83C-􏰀-\uDFFF️]+\s*/, ''); }
  function soft(k) { var n = 0; try { n = +(localStorage.getItem('oro_soft_' + k) || 0); if (n < 3) localStorage.setItem('oro_soft_' + k, String(n + 1)); } catch (e) { n = 0; } return n < 3; }
  /* ---------- v2905 (propriétaire) : OUVERTURE INSTANTANÉE comme WhatsApp — les derniers messages de chaque discussion
     sont gardés (mémoire + ce téléphone, rangés PAR COMPTE : deux comptes sur un même téléphone ne se mélangent jamais).
     On les montre tout de suite, puis on ne demande au serveur que les messages NOUVEAUX (« since »). ---------- */
  var MEM = {}, CMAX = 100, CCONV = 30, CBYTES = 1500000;
  function ckey() {
    var u = ''; try { var cu = D6.Auth && D6.Auth.current && D6.Auth.current(); if (cu && !cu.guest) u = String(cu.id || ''); } catch (e) { u = ''; }
    if (!u) { var tk = String((D6.Api && D6.Api.token && D6.Api.token()) || ''), h = 0; for (var i = 0; i < tk.length; i++) h = (h * 31 + tk.charCodeAt(i)) >>> 0; u = tk ? 't' + h.toString(36) : ''; }
    return u ? 'sx_c1_' + u.replace(/[^A-Za-z0-9_-]/g, '') : '';
  }
  function cacheAll() { var k = ckey(); if (!k) return null; if (!MEM[k]) MEM[k] = store(k) || {}; return MEM[k]; }
  function cacheGet(ck) { var a = cacheAll(), c = a && a[ck]; return c && c.m ? c : null; }
  var cT = 0;
  function cachePut(ck, data) {
    var a = cacheAll(); if (!a || guest()) return;
    data.u = Date.now(); a[ck] = data;
    clearTimeout(cT);
    cT = setTimeout(function () {
      var k = ckey(); if (!k || MEM[k] !== a) return;
      var keys = Object.keys(a).sort(function (x, y) { return (a[y].u || 0) - (a[x].u || 0); });
      keys.slice(CCONV).forEach(function (z) { delete a[z]; });
      var s = JSON.stringify(a);
      while (s.length > CBYTES && keys.length > 1) { delete a[keys.pop()]; s = JSON.stringify(a); }
      try { localStorage.setItem(k, s); } catch (e) { try { keys.slice(Math.ceil(keys.length / 2)).forEach(function (z) { delete a[z]; }); localStorage.setItem(k, JSON.stringify(a)); } catch (e2) { /* plein : la mémoire suffit */ } }
    }, 500);
  }
  function cacheDel(ck) { var a = cacheAll(), k = ckey(); if (!a || !a[ck]) return; delete a[ck]; try { localStorage.setItem(k, JSON.stringify(a)); } catch (e) { /* ignore */ } }
  // ce qu'on garde d'un message (jamais les photos du téléphone en « data: », seulement l'adresse du serveur)
  function slim(m) { var o = { id: m.id, t: m.t, at: m.at }; if (m.mine) o.mine = 1; if (m.read) o.read = 1; if (m.who) o.who = m.who; if (m.wph) o.wph = m.wph; if (m.sys) { o.sys = 1; o.key = m.key; } if (m.simg) o.img = m.simg; if (m.wh) o.wh = m.wh; if (m.post) { o.post = 1; o.link = m.link; o.likes = m.likes; o.views = m.views; } return o; }
  function unslim(m) { var o = Object.assign({}, m); o.key = m.key || m.id; o.simg = m.img; return o; }
  function snap(c) {
    var d = { m: c.msgs.filter(function (m) { return m.id && !/^tmp/.test(m.id); }).slice(-CMAX).map(slim), name: c.name, ph: c.ph || '', on: !!c.on, peerId: c.peerId || '', blocked: !!c.blocked, req: !!c.req, emoji: c.emoji || '', photo: c.photo || '' };
    if (c.g) d.g = { id: c.g.id, name: c.g.name, emoji: c.g.emoji, photo: c.g.photo || '', n: c.g.n, owner: !!c.g.owner, canWrite: c.g.canWrite !== false, link: c.g.link || '', members: (c.g.members || []).slice(0, 300), at: c.g.at || 0 };
    return d;
  }
  function lastSrvId(c) { for (var i = c.msgs.length - 1; i >= 0; i--) { var id = String(c.msgs[i].id || ''); if (/^m[0-9a-f]{6,}$/.test(id)) return id; } return ''; }
  function ss(k, v) { try { if (v === undefined) return sessionStorage.getItem(k) || ''; if (v === null) sessionStorage.removeItem(k); else sessionStorage.setItem(k, v); } catch (e) { /* ignore */ } return ''; }
  async function call(action, data) {
    try {
      var r = await fetch('live.php', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin', cache: 'no-store',
        body: JSON.stringify(Object.assign({ action: action, token: (D6.Api && D6.Api.token) ? D6.Api.token() : '' }, data || {})) });
      return await r.json();
    } catch (e) { return null; }
  }
  // v2905 : message d'erreur court et traduit (jamais de chiffre ni de « limite » sèche)
  function errMsg(r) {
    var x = LT('live'), gx = GX(), k = (r && r.reason) || 'fail';
    if (k === 'slow' || k === 'tooMany') return t(k);
    if (k === 'tooManyImg') return t('imgDay');
    if (k === 'badImg') return t('badImg');
    if (k === 'tooManyAud') return t('audLimit');
    if (k === 'badAud') return t('audBad');
    return x[k] || gx[k] || x.fail || '!';
  }

  /* ---------- v2905 : mise à jour SANS tout redessiner (comme WhatsApp) ----------
     On compare l'ancien et le nouveau contenu et on ne touche qu'à ce qui change : les photos, notes vocales et
     avatars déjà affichés restent en place (plus de « tic-tic »), la position de lecture ne bouge pas. */
  function keyOf(n) { return n.nodeType === 1 ? n.getAttribute('data-key') : null; }
  function syncAttrs(o, n) {
    var i, a;
    for (i = o.attributes.length - 1; i >= 0; i--) { a = o.attributes[i].name; if (!n.hasAttribute(a) && a !== 'style') o.removeAttribute(a); }
    var pop = o.classList && o.classList.contains('sx-pop');
    for (i = 0; i < n.attributes.length; i++) { a = n.attributes[i]; if (o.getAttribute(a.name) !== a.value) o.setAttribute(a.name, a.value); }
    if (pop && !o.classList.contains('sx-pop')) o.classList.add('sx-pop'); // l'apparition en douceur n'est jamais coupée en route
  }
  function morph(o, n) {
    if (o.nodeType !== n.nodeType || o.nodeName !== n.nodeName) { o.parentNode.replaceChild(n, o); return; }
    if (o.nodeType !== 1) { if (o.nodeValue !== n.nodeValue) o.nodeValue = n.nodeValue; return; }
    var tg = o.nodeName.toUpperCase();
    if (tg === 'IMG' || tg === 'AUDIO' || tg === 'VIDEO') { if (o.getAttribute('src') !== n.getAttribute('src')) { o.parentNode.replaceChild(n, o); return; } syncAttrs(o, n); return; }
    syncAttrs(o, n);
    if (tg === 'INPUT' || tg === 'TEXTAREA' || tg === 'SELECT') return;
    if (o.isEqualNode(n)) return;
    morphKids(o, n);
  }
  function morphKids(op, np) {
    var keyed = {}, c;
    for (c = op.firstChild; c; c = c.nextSibling) { var k0 = keyOf(c); if (k0) keyed[k0] = c; }
    var cur = op.firstChild, kids = Array.prototype.slice.call(np.childNodes);
    kids.forEach(function (nn) {
      var k = keyOf(nn), m = null;
      if (k) { if (keyed[k]) { m = keyed[k]; delete keyed[k]; } }
      else if (cur && !keyOf(cur) && cur.nodeType === nn.nodeType && cur.nodeName === nn.nodeName) m = cur;
      if (m) { if (m === cur) cur = cur.nextSibling; else op.insertBefore(m, cur); morph(m, nn); }
      else { if (op._sxPop && !op._sxQuiet && nn.nodeType === 1 && nn.classList.contains('sx-b')) nn.classList.add('sx-pop'); op.insertBefore(nn, cur); }
    });
    while (cur) { var nx = cur.nextSibling; op.removeChild(cur); cur = nx; }
  }
  function setHTML(el, html) {
    if (el._sxHtml === html) return false;
    el._sxHtml = html;
    if (!el.firstChild) { el.innerHTML = html; return true; }
    var tp = document.createElement('template'); tp.innerHTML = html; morphKids(el, tp.content);
    return true;
  }

  /* ---------- textes élastiques : une ligne, la police rapetisse seule ---------- */
  function fitEl(el) {
    if (!el || !el.isConnected || !el.clientWidth) return;
    el.style.removeProperty('font-size');
    var fs = parseFloat(getComputedStyle(el).fontSize) || 14, min = Math.max(7, fs * 0.5), n = 0;
    while (el.scrollWidth > el.clientWidth + 1 && fs > min && n++ < 30) { fs = Math.max(min, fs * 0.93); el.style.setProperty('font-size', fs.toFixed(1) + 'px', 'important'); }
  }
  /* champ vide : le texte d'aide tient sur UNE ligne. v2905 : seule la taille du TEXTE D'AIDE rapetisse (variable CSS
     --sx-ph) — la case garde 16 px, sinon l'iPhone zoomait toute la page en touchant la case (écran « penché »). */
  var phCv = null;
  function fitPh(el) {
    if (!el || !el.isConnected || !el.placeholder) return;
    el.style.removeProperty('font-size'); el.classList.toggle('sx-empty-in', !el.value);
    if (el.value) return;
    var cs = getComputedStyle(el), w = el.clientWidth - (parseFloat(cs.paddingLeft) || 0) - (parseFloat(cs.paddingRight) || 0) - 4;
    if (w <= 0) return;
    phCv = phCv || document.createElement('canvas');
    var ctx = phCv.getContext('2d'), fs = parseFloat(cs.fontSize) || 16;
    ctx.font = cs.fontWeight + ' ' + fs + 'px ' + cs.fontFamily;
    var tw = ctx.measureText(el.placeholder).width;
    if (tw > w * 0.95) el.style.setProperty('--sx-ph', Math.max(10, fs * w * 0.93 / tw).toFixed(1) + 'px'); else el.style.removeProperty('--sx-ph');
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
    play: '<path d="M8 5.5v13l10.5-6.5z"/>', pause: '<path d="M8 5v14M16 5v14"/>', trash: '<path d="M4 7h16M9 7V4.5h6V7M6.5 7l1 13h9l1-13M10 11v6M14 11v6"/>', img: '<rect x="3.5" y="4.5" width="17" height="15" rx="3"/><circle cx="9" cy="10" r="1.8"/><path d="M20.5 16l-5-5-8.5 8.5"/>'
  };
  function ic(k, cls) { return '<svg class="sx-ic' + (cls ? ' ' + cls : '') + '" viewBox="0 0 24 24" aria-hidden="true">' + IC[k] + '</svg>'; }
  // avatars des deux discussions officielles (épinglées)
  var NEWS_AV = '<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M11 17h4l11-6v18l-11-6h-4a2 2 0 0 1-2-2v-2a2 2 0 0 1 2-2z" fill="#fff"/><path d="M14 23l2 6h3l-1.6-6" fill="#fff" opacity=".8"/><path d="M29.5 16.5a5 5 0 0 1 0 7" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round"/></svg>';
  var TEAM_AV = '<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M11 22v-3a9 9 0 0 1 18 0v3" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/><rect x="9" y="20" width="5" height="8" rx="2.2" fill="#fff"/><rect x="26" y="20" width="5" height="8" rx="2.2" fill="#fff"/><path d="M28.5 28c0 2.5-2.5 4-6 4" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/><circle cx="21.5" cy="32" r="1.6" fill="#fff"/></svg>';

  /* ---------- v2905 (propriétaire) : LOGOS DES GROUPES — vrais emblèmes dessinés (nuit violette, anneau doré, reflet).
     Le groupe garde son emoji dans le serveur (compatibilité) ; chaque emoji est dessiné en emblème ici. ---------- */
  var EMB = ['fire', 'power', 'crown', 'rocket', 'diamond', 'money', 'trophy', 'lion', 'globe', 'heart', 'star', 'shield'];
  var EMO_OF = { fire: '🔥', power: '⚡', crown: '👑', rocket: '🚀', diamond: '💎', money: '💰', trophy: '🏆', lion: '🦁', globe: '🌍', heart: '❤️', star: '⭐', shield: '🛡️' };
  var KEY_OF = { '🔥': 'fire', '⚡': 'power', '👑': 'crown', '🚀': 'rocket', '💎': 'diamond', '💰': 'money', '🏆': 'trophy', '🦁': 'lion', '🌍': 'globe', '❤️': 'heart', '❤': 'heart', '⭐': 'star', '🛡️': 'shield', '🛡': 'shield', '💬': 'chat', '🎯': 'target', '🎉': 'party' };
  function mane() { var p = [], i, a, r; for (i = 0; i < 24; i++) { a = Math.PI * 2 * i / 24 - Math.PI / 2; r = i % 2 ? 14.5 : 20; p.push((32 + r * Math.cos(a)).toFixed(1) + ' ' + (33 + r * Math.sin(a)).toFixed(1)); } return 'M' + p.join('L') + 'z'; }
  var ART = {
    fire: '<path d="M32 10c1.5 8.5 13 12.5 13 26a13 13 0 0 1-26 0c0-6.5 3.2-10 5.5-13 .8 4.2 3 6.4 5.4 6.6-2.4-6.2-.3-13.3 2.1-19.6z" fill="url(#sxgFire)"/><path d="M32 31.5c3.2 3.2 6.6 5.4 6.6 10a6.6 6.6 0 0 1-13.2 0c0-3.3 2.1-5.4 3.4-6.6.9 2 2 2.6 3.2 2.5-1-2.2-.9-3.9 0-5.9z" fill="#FFF0A6"/>',
    power: '<path d="M37 9L17.5 36.5h12.5L26 55l21-28.5H34.5z" fill="url(#sxgGold)" stroke="#9A6510" stroke-width="1.2" stroke-linejoin="round"/><path d="M35 14l-12 17h6" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>',
    crown: '<path d="M14 43l-3-21 11.5 9.5L32 16l9.5 15.5L53 22l-3 21z" fill="url(#sxgGold)" stroke="#9A6510" stroke-width="1" stroke-linejoin="round"/><rect x="14" y="44.5" width="36" height="5.5" rx="2.4" fill="url(#sxgGold)" stroke="#9A6510" stroke-width="1"/><circle cx="32" cy="35" r="3.3" fill="#F43F5E"/><circle cx="22" cy="37" r="2.2" fill="#67E8F9"/><circle cx="42" cy="37" r="2.2" fill="#67E8F9"/><circle cx="11" cy="21" r="2.4" fill="url(#sxgGold)"/><circle cx="53" cy="21" r="2.4" fill="url(#sxgGold)"/><circle cx="32" cy="14.5" r="2.6" fill="url(#sxgGold)"/>',
    rocket: '<path d="M32 9c7.5 6.5 10.6 16 9.6 27.5H22.4C21.4 25 24.5 15.5 32 9z" fill="url(#sxgSilver)"/><circle cx="32" cy="24.5" r="4.4" fill="#60A5FA" stroke="#1E3A8A" stroke-width="1.8"/><path d="M22.6 29.5L16 40.5h7.5zM41.4 29.5L48 40.5h-7.5z" fill="#F43F5E"/><path d="M26.5 36.5h11l-2 5h-7z" fill="#8E98B3"/><path d="M28.5 41.5h7L32 55z" fill="url(#sxgFire)"/>',
    diamond: '<path d="M20 17h24l9 11-21 25-21-25z" fill="url(#sxgCyan)"/><path d="M11 28h42M23.5 17L20 28l12 25 12-25-3.5-11M32 17l-7.5 11h15z" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="1.4" stroke-linejoin="round"/>',
    money: '<circle cx="32" cy="32" r="17" fill="url(#sxgGold)" stroke="#9A6510" stroke-width="1.6"/><circle cx="32" cy="32" r="12.6" fill="none" stroke="#9A6510" stroke-opacity=".55" stroke-width="1.2"/><path d="M36.8 26.6c-1-1.7-2.7-2.5-4.7-2.5-2.7 0-4.6 1.5-4.6 3.4 0 4.8 9.6 2.5 9.6 7.3 0 2-2.1 3.5-4.9 3.5-2.1 0-4-.9-5-2.7M32 21.3v3M32 38.3v3" fill="none" stroke="#6B4105" stroke-width="2.5" stroke-linecap="round"/>',
    trophy: '<path d="M21.5 13h21v11a10.5 10.5 0 0 1-21 0z" fill="url(#sxgGold)" stroke="#9A6510" stroke-width="1"/><path d="M21.5 16.5H15a6.5 6.5 0 0 0 7.5 8.5M42.5 16.5H49a6.5 6.5 0 0 1-7.5 8.5" fill="none" stroke="url(#sxgGold)" stroke-width="3.2" stroke-linecap="round"/><path d="M29 34h6v7h-6z" fill="#D88F1C"/><rect x="22.5" y="41" width="19" height="7.5" rx="2.2" fill="url(#sxgGold)" stroke="#9A6510" stroke-width="1"/><path d="M32 16.5l1.6 3.3 3.6.5-2.6 2.5.6 3.6-3.2-1.7-3.2 1.7.6-3.6-2.6-2.5 3.6-.5z" fill="#fff" opacity=".9"/>',
    lion: '<path d="' + mane() + '" fill="url(#sxgFire)"/><circle cx="32" cy="34" r="11.5" fill="url(#sxgGold)"/><circle cx="23.5" cy="25" r="3" fill="url(#sxgGold)"/><circle cx="40.5" cy="25" r="3" fill="url(#sxgGold)"/><circle cx="28" cy="32" r="1.7" fill="#3B2300"/><circle cx="36" cy="32" r="1.7" fill="#3B2300"/><path d="M29.4 36.6h5.2L32 39.6z" fill="#6B4105"/><path d="M32 39.6v2.4M28.4 42c1.6 1.3 5.6 1.3 7.2 0" stroke="#6B4105" stroke-width="1.5" fill="none" stroke-linecap="round"/>',
    globe: '<circle cx="32" cy="32" r="18" fill="url(#sxgBlue)"/><g clip-path="url(#sxgClip)"><path d="M17 21c5-3 10-1 11 3s-3 6-2 9.5-4.5 6-8.5 4-4-7.5-3.5-11 1-4.5 3-5.5zM36 29c5-1.5 10 1 11 6s-3.5 8.5-7 9.5-5-3.5-5-7 0-7.5 1-8.5zM34 15c3 0 6 1 7 3s-2 3-4.5 2.5-4-3-2.5-5.5z" fill="url(#sxgGreen)"/></g><ellipse cx="32" cy="32" rx="8.5" ry="18" fill="none" stroke="#fff" stroke-opacity=".45" stroke-width="1.3"/><path d="M14 32h36M16.5 23h31M16.5 41h31" stroke="#fff" stroke-opacity=".45" stroke-width="1.3"/>',
    heart: '<path d="M32 50S13 38.5 13 25.5a9.5 9.5 0 0 1 19-4 9.5 9.5 0 0 1 19 4C51 38.5 32 50 32 50z" fill="url(#sxgRed)"/><path d="M20 21.5a5.5 5.5 0 0 1 6.5-2.4" stroke="#fff" stroke-opacity=".75" stroke-width="2.6" fill="none" stroke-linecap="round"/>',
    star: '<path d="M32 10.5l6.4 13 14.3 2.1-10.4 10.1 2.5 14.3L32 43.3l-12.8 6.7 2.5-14.3-10.4-10.1 14.3-2.1z" fill="url(#sxgGold)" stroke="#9A6510" stroke-width="1.2" stroke-linejoin="round"/><path d="M32 17l3.6 7.4" stroke="#fff" stroke-opacity=".8" stroke-width="2" stroke-linecap="round"/>',
    shield: '<path d="M32 10l18 6.5v12.5C50 40.5 42.5 49 32 54 21.5 49 14 40.5 14 29V16.5z" fill="url(#sxgBlue)" stroke="url(#sxgGold)" stroke-width="2.8" stroke-linejoin="round"/><path d="M32 21.5l2.8 5.7 6.3.9-4.6 4.4 1.1 6.3L32 35.8l-5.6 3 1.1-6.3-4.6-4.4 6.3-.9z" fill="url(#sxgGold)"/>',
    chat: '<path d="M16 17h32a4.5 4.5 0 0 1 4.5 4.5v16a4.5 4.5 0 0 1-4.5 4.5H30.5L21 49.5V42h-5a4.5 4.5 0 0 1-4.5-4.5v-16A4.5 4.5 0 0 1 16 17z" fill="url(#sxgSilver)"/><circle cx="23.5" cy="29.5" r="2.6" fill="#7C3AED"/><circle cx="32" cy="29.5" r="2.6" fill="#7C3AED"/><circle cx="40.5" cy="29.5" r="2.6" fill="#7C3AED"/>',
    target: '<circle cx="32" cy="33" r="17" fill="#fff"/><circle cx="32" cy="33" r="13" fill="url(#sxgRed)"/><circle cx="32" cy="33" r="8.5" fill="#fff"/><circle cx="32" cy="33" r="4.3" fill="url(#sxgRed)"/><path d="M32 33L48 15" stroke="url(#sxgGold)" stroke-width="2.6" stroke-linecap="round"/><path d="M45 14.5l5-1-1 5z" fill="url(#sxgGold)"/>',
    party: '<path d="M14 51l9-28 19 19z" fill="url(#sxgGold)" stroke="#9A6510" stroke-width="1"/><path d="M18.5 38l7.5 7.5M21 30l12 12" stroke="#F43F5E" stroke-width="2.4"/><circle cx="42" cy="17" r="2.5" fill="#67E8F9"/><circle cx="49" cy="27" r="2.2" fill="#F43F5E"/><circle cx="34" cy="13" r="1.8" fill="#A3E635"/><path d="M37 26c3-3 6-3 9 0M30 21c0-4 2-6 5-7" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round"/>'
  };
  var DEFS = '<svg width="0" height="0" style="position:absolute;width:0;height:0;overflow:hidden" aria-hidden="true" focusable="false"><defs>' +
    '<radialGradient id="sxgBg" cx=".35" cy=".28" r=".85"><stop offset="0" stop-color="#5B36D9"/><stop offset=".55" stop-color="#2A1570"/><stop offset="1" stop-color="#110832"/></radialGradient>' +
    '<linearGradient id="sxgRing" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFE9A8"/><stop offset=".5" stop-color="#E2AA3C"/><stop offset="1" stop-color="#9C6416"/></linearGradient>' +
    '<linearGradient id="sxgGold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFF3C0"/><stop offset=".45" stop-color="#FFCB4F"/><stop offset="1" stop-color="#D88A17"/></linearGradient>' +
    '<linearGradient id="sxgFire" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#E5281F"/><stop offset=".55" stop-color="#FF8A1F"/><stop offset="1" stop-color="#FFD65C"/></linearGradient>' +
    '<linearGradient id="sxgCyan" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#E8FDFF"/><stop offset=".5" stop-color="#5EE3F7"/><stop offset="1" stop-color="#2563EB"/></linearGradient>' +
    '<linearGradient id="sxgRed" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FF9BBB"/><stop offset=".5" stop-color="#F43F5E"/><stop offset="1" stop-color="#B3123A"/></linearGradient>' +
    '<linearGradient id="sxgBlue" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8EC2FF"/><stop offset=".55" stop-color="#3B7BF0"/><stop offset="1" stop-color="#1C3A8F"/></linearGradient>' +
    '<linearGradient id="sxgGreen" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#B5F5D2"/><stop offset="1" stop-color="#0F9F6E"/></linearGradient>' +
    '<linearGradient id="sxgSilver" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".55" stop-color="#DCE1EE"/><stop offset="1" stop-color="#8F99B5"/></linearGradient>' +
    '<clipPath id="sxgClip"><circle cx="32" cy="32" r="18"/></clipPath></defs></svg>';
  function defs() { if (!document.getElementById('sxgBg') && document.body) { var d = document.createElement('div'); d.innerHTML = DEFS; document.body.appendChild(d.firstChild); } }
  function emblemKey(e) { e = String(e || ''); return KEY_OF[e] || KEY_OF[e.replace(/️/g, '')] || ''; }
  function emblem(e) {
    var k = emblemKey(e); if (!k) return '';
    return '<svg class="sx-emb" viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="31" fill="url(#sxgBg)"/>' + ART[k] +
      '<path d="M9 27C12 15 21 7.5 32 7.5S52 15 55 27c-6-6.5-14-9.5-23-9.5S15 20.5 9 27z" fill="#fff" opacity=".13"/><circle cx="32" cy="32" r="30" fill="none" stroke="url(#sxgRing)" stroke-width="2.6"/></svg>';
  }
  function avatar(it, big) {
    var c = 'sx-av' + (big ? ' big' : '');
    if (it.k === 'news') return '<span class="' + c + ' sx-av-news">' + NEWS_AV + '</span>';
    if (it.k === 'team') return '<span class="' + c + ' sx-av-team">' + TEAM_AV + (it.on ? '<i class="sx-dot"></i>' : '') + '</span>';
    if (it.group) {
      if (it.photo) return '<span class="' + c + ' sx-av-ph"><img src="' + esc(it.photo) + '" alt="" decoding="async"></span>';
      var em = emblem(it.emoji || '💬');
      return em ? '<span class="' + c + ' sx-av-e">' + em + '</span>' : '<span class="' + c + ' sx-av-g">' + esc(it.emoji) + '</span>';
    }
    if (it.ph) return '<span class="' + c + ' sx-av-ph" style="--av:' + avc(it.name) + '"><img src="' + esc(it.ph) + '" alt="" decoding="async">' + (it.on ? '<i class="sx-dot"></i>' : '') + '</span>';
    return '<span class="' + c + '" style="--av:' + avc(it.name) + '">' + ini(it.name) + (it.on ? '<i class="sx-dot"></i>' : '') + '</span>';
  }
  var VER = '<i class="sx-ver" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M6 12.5l4 4 8-9"/></svg></i>';
  // logo de Social (en-tête de la liste) : deux bulles, violet et or, comme les tuiles du menu
  var SX_LOGO = '<span class="sx-logo" aria-hidden="true"><svg viewBox="0 0 48 48"><defs><linearGradient id="sxLg1" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#B794FF"/><stop offset="1" stop-color="#6D3BEF"/></linearGradient><linearGradient id="sxLg2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFE7A0"/><stop offset="1" stop-color="#F2A93B"/></linearGradient></defs>' +
    '<path d="M8 9h22a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H18l-7 5.5V29H8a5 5 0 0 1-5-5V14a5 5 0 0 1 5-5z" fill="url(#sxLg1)"/><path d="M39 18h1a5 5 0 0 1 5 5v9a5 5 0 0 1-5 5h-2v5l-6.5-5H25a5 5 0 0 1-5-5v-1h10a8 8 0 0 0 8-8z" fill="url(#sxLg2)"/>' +
    '<circle cx="12.5" cy="19" r="2" fill="#fff"/><circle cx="19" cy="19" r="2" fill="#fff"/><circle cx="25.5" cy="19" r="2" fill="#fff"/></svg></span>';

  /* ---------- copier : petit ✓ vert sur le bouton pendant 1,5 s (plus de notification) ---------- */
  function clip(txt) {
    try { if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(txt).catch(function () { clipOld(txt); }); return; } } catch (e) { /* ignore */ }
    clipOld(txt);
  }
  function clipOld(txt) { try { var a = document.createElement('textarea'); a.value = txt; a.setAttribute('readonly', ''); a.style.cssText = 'position:fixed;top:0;left:0;opacity:0;font-size:16px'; document.body.appendChild(a); a.select(); document.execCommand('copy'); a.remove(); } catch (e) { /* ignore */ } }
  function copyFx(btn, txt) {
    clip(txt);
    if (!btn) return;
    var svg = btn.querySelector('svg.sx-ic');
    if (!btn._sxIc && svg) btn._sxIc = svg.innerHTML;
    if (svg) svg.innerHTML = IC.check;
    btn.classList.add('sx-copied');
    clearTimeout(btn._sxT);
    btn._sxT = setTimeout(function () { btn.classList.remove('sx-copied'); if (svg && btn._sxIc) svg.innerHTML = btn._sxIc; }, 1500);
  }

  /* ---------- état ---------- */
  var root = null, seg = 'chats', q = '', D = { feed: null, fr: null, gr: null, ready: false }, conv = null, tList = 0, tConv = 0, tDuel = 0, handoff = null, hint = '', active = false, wide = false;
  function mq() { try { return window.matchMedia('(min-width:860px)').matches; } catch (e) { return false; } }
  function mount() {
    var box = document.querySelector('#liveModal .live-box');
    if (!box) return null;
    if (root && root.isConnected) return root;
    defs();
    root = document.createElement('div'); root.className = 'sx'; root.id = 'sxRoot';
    root.innerHTML = '<section class="sx-scr sx-list" id="sxL"></section><section class="sx-scr sx-conv" id="sxC"></section>' +
      '<section class="sx-panel" id="sxP" hidden></section><div class="sx-sheet" id="sxSh" hidden></div><div class="sx-lb" id="sxLb" hidden></div>';
    box.appendChild(root);
    $('sxLb').addEventListener('click', function () { this.hidden = true; this.innerHTML = ''; });
    $('sxSh').addEventListener('click', function (e) { if (e.target === this) closeSheet(); });
    // photo de profil introuvable : on remet l'initiale
    root.addEventListener('error', function (e) { var im = e.target; if (im && im.tagName === 'IMG' && im.parentNode && im.parentNode.classList.contains('sx-av-ph')) { var sp = im.parentNode; sp.classList.remove('sx-av-ph'); im.remove(); } }, true);
    return root;
  }
  function on() { mount(); active = true; $('liveModal').classList.add('sx-on'); wide = mq(); vv(); }
  // la page Social a été fermée (bouton, glissé vers le bas…) : plus rien ne tourne
  function alive() { var m = $('liveModal'); if (active && m && m.classList.contains('active') && m.classList.contains('sx-on')) return true; if (active) stop(); return false; }
  function stopTimers() { clearInterval(tList); clearInterval(tConv); clearInterval(tDuel); tList = tConv = tDuel = 0; }
  function stop() { stopTimers(); micStop(true); active = false; }
  function hide() { stop(); if ($('liveModal')) $('liveModal').classList.remove('sx-on'); }

  /* v2905 (propriétaire) : écran BLOQUÉ comme WhatsApp — quand le clavier de l'iPhone s'ouvre, la page garde la largeur
     de l'écran, l'en-tête reste visible et la barre d'écriture se pose juste au-dessus du clavier (visualViewport). */
  function vv() {
    var v = window.visualViewport, m = $('liveModal'); if (!m) return;
    var on = active && m.classList.contains('sx-on') && !mq();
    if (!on || !v) { m.style.removeProperty('--sx-vh'); m.style.removeProperty('--sx-vt'); return; }
    m.style.setProperty('--sx-vh', Math.round(v.height) + 'px');
    m.style.setProperty('--sx-vt', Math.round(v.offsetTop) + 'px');
    if (document.scrollingElement && document.scrollingElement.scrollLeft) document.scrollingElement.scrollLeft = 0;
    keepBottom();
  }
  // la conversation était en bas : elle y reste quand la hauteur change (clavier, barre d'écriture qui grandit)
  function keepBottom() { var el = $('sxMsgs'); if (el && el._stick !== false) requestAnimationFrame(function () { if (el.isConnected && el._stick !== false) el.scrollTop = 1e9; }); }
  if (window.visualViewport) { window.visualViewport.addEventListener('resize', vv); window.visualViewport.addEventListener('scroll', vv); }

  /* =========================== LISTE =========================== */
  async function load() {
    var g = guest();
    var r = await Promise.all([call('feed', {}), g ? null : call('friends', {}), g ? null : call('groups', {})]);
    if (r[0] && r[0].ok) D.feed = r[0];
    if (r[1] && r[1].ok) D.fr = r[1];
    if (r[2] && r[2].ok) D.gr = r[2];
    D.ready = true;
    if (D.feed && D.feed.me && D6.Live && D6.Live.badges) D6.Live.badges(D.feed.me);
  }
  function gSeen(gid, at) { var m = store('sx_gseen') || {}; if (at === undefined) return m[gid] || 0; m[gid] = at; store('sx_gseen', m); }
  function gItem(g) {
    var last = String(g.last || ''), mine = last.indexOf('✓ ') === 0;
    return { k: 'g:' + g.id, group: 1, name: g.name, emoji: g.emoji || '💬', photo: g.photo || '', prev: prevTxt(last.replace(/^✓ /, '')) || members(g.n), mine: mine, at: g.at, un: (!mine && g.at > gSeen(g.id) && last) ? '•' : 0 };
  }
  function chatItems() {
    var out = [], posts = (D.feed && D.feed.posts) || [], seen = store('oro_live_seen') || [];
    var p0 = posts[0];
    out.push({ k: 'news', pin: 1, name: t('news'), prev: p0 ? (p0.t || '📷').split('\n')[0] : TT().good, at: p0 ? p0.at : 0, un: posts.filter(function (p) { return seen.indexOf(p.id) < 0; }).length });
    var me = D.feed && D.feed.me, tm = (me && me.msgs) || [], lm = tm[tm.length - 1];
    out.push({ k: 'team', pin: 1, name: t('team'), prev: lm ? (lm.t || (isAud(lm.img) ? '🎤 ' + t('voice') : '📷 ' + t('photo'))) : t('teamSub'), mine: lm && lm.f === 'u', at: lm ? lm.at : 0, un: (me && me.unread) || 0 });
    var rest = [];
    ((D.fr && D.fr.list) || []).forEach(function (c) {
      if (c.req) return;
      var last = String(c.last || ''), mine = !!c.mine || last.indexOf('✓ ') === 0;
      rest.push({ k: 'dm:' + c.id, name: c.name, ph: c.ph || '', prev: prevTxt(last.replace(/^✓ /, '')), mine: mine, at: c.at, un: c.un, on: c.on, duel: c.duel, blocked: c.blocked });
    });
    ((D.gr && D.gr.list) || []).forEach(function (g) { rest.push(gItem(g)); });
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
    return '<button type="button" data-key="r' + esc(it.k) + '" class="sx-row' + (it.un ? ' unread' : '') + (it.pin ? ' pin' : '') + '" data-k="' + esc(it.k) + '">' + avatar(it) +
      '<span class="sx-rm"><span class="sx-r1"><b class="sx-nm sx-ell">' + esc(it.name) + (it.pin ? VER : '') + (it.blocked ? ' 🚫' : '') + '</b><time>' + esc(when(it.at)) + '</time></span>' +
      '<span class="sx-r2"><span class="sx-pv sx-ell">' + tick + esc(it.prev || '') + '</span>' + duel + badge + '</span></span>' + (extra || '') + '</button>';
  }
  function empty(ico, title, sub, btn) {
    return '<div class="sx-empty" data-key="e' + esc(title) + '"><span class="sx-eico">' + ico + '</span><b>' + esc(title) + '</b><p>' + esc(sub) + '</p>' + (btn || '') + '</div>';
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
  // v2905 : l'en-tête et les onglets sont dessinés UNE fois (la page ne « bouge » plus en revenant dans Social)
  function paintList(force) {
    var L = $('sxL'), sig = lg() + '|' + guest();
    if (force || L.getAttribute('data-sig') !== sig || !$('sxBody')) {
      L.setAttribute('data-sig', sig);
      L.innerHTML = '<header class="sx-hd sx-lhd"><button type="button" class="sx-ib sx-bk" id="sxClose" aria-label="Back">' + ic('back') + '</button>' + SX_LOGO +
        '<span class="sx-tt"><b class="sx-ttl fit">' + esc(t('title')) + '</b><small class="fit">' + esc(t('socialSub')) + '</small></span>' +
        '<button type="button" class="sx-ib" id="sxSearchB" aria-label="' + esc(t('search')) + '">' + ic('search') + '</button><button type="button" class="sx-ib" id="sxMoreB" aria-label="' + esc(t('more')) + '">' + ic('grid') + '</button></header>' +
        '<div class="sx-srch" id="sxSrch" hidden>' + ic('search') + '<input id="sxQ" type="search" autocomplete="off" spellcheck="false" placeholder="' + esc(t('search')) + '"><button type="button" class="sx-ib sm" id="sxQx" aria-label="x">' + ic('x') + '</button></div>' +
        '<nav class="sx-seg" role="tablist">' + ['chats', 'groups', 'friends'].map(function (s) { return '<button type="button" role="tab" data-s="' + s + '"><b class="fit">' + esc(t(s)) + '</b><i class="sx-sb" data-c="' + s + '"></i></button>'; }).join('') + '</nav>' +
        '<div class="sx-body" id="sxBody"></div>' +
        (guest() ? '' : '<button type="button" class="sx-fab" id="sxFab" aria-label="' + esc(t('newChat')) + '">' + ic('edit') + '</button>');
      $('sxClose').addEventListener('click', closeList);
      $('sxSearchB').addEventListener('click', function () { var s = $('sxSrch'); s.hidden = !s.hidden; if (!s.hidden) $('sxQ').focus(); else { q = ''; $('sxQ').value = ''; paintBody(); } });
      $('sxQ').addEventListener('input', function () { q = this.value.trim(); paintBody(); });
      $('sxQx').addEventListener('click', function () { q = ''; $('sxQ').value = ''; $('sxSrch').hidden = true; paintBody(); });
      $('sxMoreB').addEventListener('click', function () { if (gridRet) toGrid(); else leave('home', undefined, false); });
      L.querySelectorAll('.sx-seg button').forEach(function (b) { b.addEventListener('click', function () { seg = b.getAttribute('data-s'); hint = ''; paintBody(true); }); });
      if ($('sxFab')) $('sxFab').addEventListener('click', function () { if (seg === 'groups') createSheet(); else { seg = 'friends'; paintBody(true); setTimeout(function () { if ($('sxAddIn')) $('sxAddIn').focus(); }, 50); } });
      bindBody($('sxBody'));
      fitAll(L);
    }
    $('sxSrch').hidden = !q; if ($('sxQ').value !== q) $('sxQ').value = q;
    paintBody(true);
  }
  function paintBody(top) {
    var b = $('sxBody'); if (!b) return;
    var c = segCounts();
    root.querySelectorAll('.sx-seg button').forEach(function (z) { z.classList.toggle('on', z.getAttribute('data-s') === seg); });
    root.querySelectorAll('.sx-sb').forEach(function (i) { var n = c[i.getAttribute('data-c')], v = n ? (n > 99 ? '99+' : String(n)) : ''; if (i.textContent !== v) i.textContent = v; });
    if ($('sxFab')) $('sxFab').hidden = seg === 'friends';
    var html = '<div class="sx-rows" data-key="s' + seg + '">' + (seg === 'chats' ? chatsHtml() : seg === 'groups' ? groupsHtml() : friendsHtml()) + '</div>';
    var changed = setHTML(b, html);
    if (top) b.scrollTop = 0;
    if (changed) fitAll(b);
    markSel();
  }
  function skel(n) { var h = ''; for (var i = 0; i < n; i++) h += '<div class="sx-row sx-skel" data-key="sk' + i + '" aria-hidden="true"><span class="sx-av"></span><span class="sx-rm"><i></i><i></i></span></div>'; return h; }
  function chatsHtml() {
    var items = chatItems().filter(match), h = '';
    var nReq = ((D.fr && D.fr.list) || []).filter(function (r) { return r.req; }).length;
    if (nReq && !q) h += '<button type="button" data-key="req" class="sx-row sx-reqrow" data-act="toReq"><span class="sx-av sx-av-req">' + ic('uadd') + '</span><span class="sx-rm"><span class="sx-r1"><b class="sx-nm sx-ell">' + esc(t('reqRow')) + '</b></span><span class="sx-r2"><span class="sx-pv sx-ell">' + esc(t('reqHint')) + '</span><i class="sx-un">' + nReq + '</i></span></span></button>';
    h += items.map(function (it) { return row(it); }).join('');
    if (guest()) h += guestCard();
    else if (!D.ready) h += skel(3);
    else if (!q && items.length <= 2) h += empty(ic('send'), t('emptyChatsT'), t('emptyChatsS'), '<div class="sx-yn"><button type="button" class="sx-btn" data-act="toFriends"><b class="fit">' + esc(t('addFriend')) + '</b></button><button type="button" class="sx-btn ghost" data-act="newGroup"><b class="fit">' + esc(t('addGroup')) + '</b></button></div>');
    if (q && !items.length) h += '<p class="sx-none" data-key="none">' + esc(t('noResult')) + '</p>';
    return h;
  }
  function groupsHtml() {
    if (guest()) return guestCard();
    var x = GX(), h = '', inv = ((D.gr && D.gr.inv) || []).filter(function (v) { return match({ name: v.name }); });
    if (inv.length) {
      h += '<p class="sx-h" data-key="hinv"><span class="fit">' + esc(x.invTitle || 'Invitations') + '</span></p>' + inv.map(function (v) {
        return '<div class="sx-inv" data-key="i' + esc(v.gid) + '">' + avatar({ group: 1, emoji: v.emoji || '💬', photo: v.photo }) + '<span class="sx-rm"><b class="sx-nm sx-ell">' + esc(v.name) + '</b><span class="sx-pv sx-ell">' + esc(String(x.invFrom || '{a}').replace('{a}', v.by)) + ' · ' + esc(members(v.n)) + '</span></span>' +
          '<span class="sx-yn"><button type="button" class="sx-btn sm ghost" data-gno="' + esc(v.gid) + '"><b class="fit">' + esc(x.no || 'Decline') + '</b></button><button type="button" class="sx-btn sm ok" data-gyes="' + esc(v.gid) + '"><b class="fit">' + esc(x.yes || 'Accept') + '</b></button></span></div>';
      }).join('');
    }
    var list = ((D.gr && D.gr.list) || []).map(gItem).filter(match);
    if (!q) h += '<button type="button" data-key="newg" class="sx-row sx-new" data-act="newGroup"><span class="sx-av sx-av-add">' + ic('plus') + '</span><span class="sx-rm"><b class="sx-nm sx-ell">' + esc(t('newGroup')) + '</b><span class="sx-pv sx-ell">' + esc(x.sub || '') + '</span></span></button>';
    if (list.length) h += '<p class="sx-h" data-key="hg"><span class="fit">' + esc(x.title || t('groups')) + '</span></p>' + list.map(function (it) { return row(it); }).join('');
    else if (!D.ready) h += skel(2);
    else if (!q && !inv.length) h += empty(ic('users'), t('emptyGroupsT'), t('emptyGroupsS'), '<button type="button" class="sx-btn gold" data-act="newGroup"><b class="fit">' + esc(t('addGroup')) + '</b></button>');
    if (q && !list.length && !inv.length) h += '<p class="sx-none" data-key="none">' + esc(t('noResult')) + '</p>';
    return h;
  }
  function myAv(big) { var fr = D.fr || {}; return avatar({ name: fr.name || '?', ph: fr.ph || '' }, big); }
  function friendsHtml() {
    if (guest()) return guestCard();
    var x = LT('live'), fr = D.fr || {}, h = '';
    var reqs = (fr.list || []).filter(function (r) { return r.req && match(r); });
    var cts = (fr.list || []).filter(function (r) { return !r.req && match({ name: r.name, id: r.id }); }).sort(function (a, b) { return String(a.name).localeCompare(String(b.name), lg()); });
    if (hint) h += '<p class="sx-hint" data-key="hint"><span class="fit">' + esc(hint) + '</span></p>';
    if (!q) {
      h += '<div class="sx-card sx-idc" data-key="idc"><button type="button" class="sx-mya" data-act="myPhoto" aria-label="' + esc(t('myPhoto')) + '">' + myAv() + '<i class="sx-camb">' + ic('cam') + '</i></button><span class="sx-idt"><small class="fit">' + esc(x.myId || 'Your ID') + '</small><b class="sx-idv fit">' + esc(fr.me || '…') + '</b></span>' +
        '<button type="button" class="sx-ib" data-act="copyMe" aria-label="' + esc(x.copy || t('copy')) + '">' + ic('copy') + '</button><button type="button" class="sx-ib" data-act="shareMe" aria-label="' + esc(t('share')) + '">' + ic('share') + '</button></div>' +
        '<p class="sx-note" data-key="idn"><span class="fit">' + esc(x.idHint || '') + '</span></p>' +
        '<form class="sx-add" id="sxAdd" data-key="add" autocomplete="off"><input id="sxAddIn" maxlength="80" spellcheck="false" autocapitalize="off" inputmode="email" placeholder="' + esc(x.findPh || 'ID (R…) / e-mail') + '"><button type="submit" class="sx-btn"><b class="fit">' + esc(t('addGo')) + '</b></button></form><p class="sx-msg" id="sxAddMsg" data-key="addm"></p>';
      if (fr.stats) h += '<p class="sx-rec" data-key="rec"><span class="fit">🏆 ' + esc(fmt(x.duelRecord || '{w} / {l}', fr.stats)) + '</span></p>';
    }
    if (reqs.length) {
      h += '<p class="sx-h" data-key="hreq"><span class="fit">' + esc(t('requests')) + ' · ' + reqs.length + '</span></p>' + reqs.map(function (r) {
        return '<div class="sx-inv sx-req" data-key="q' + esc(r.id) + '" data-k="dm:' + esc(r.id) + '">' + avatar({ name: r.name, on: r.on, ph: r.ph }) + '<span class="sx-rm"><b class="sx-nm sx-ell">' + esc(r.name) + '</b><span class="sx-pv sx-ell">' + esc(prevTxt(String(r.last || ''))) + '</span></span>' +
          '<span class="sx-yn"><button type="button" class="sx-btn sm ghost" data-fno="' + esc(r.id) + '"><b class="fit">' + esc(x.refuse || 'Decline') + '</b></button><button type="button" class="sx-btn sm ok" data-fyes="' + esc(r.id) + '"><b class="fit">' + esc(x.accept || 'Accept') + '</b></button></span></div>';
      }).join('');
    }
    if (cts.length) {
      h += '<p class="sx-h" data-key="hct"><span class="fit">' + esc(t('contacts')) + ' · ' + cts.length + '</span></p>' + cts.map(function (c) {
        return '<button type="button" class="sx-row sx-ct" data-key="c' + esc(c.id) + '" data-k="dm:' + esc(c.id) + '">' + avatar({ name: c.name, on: c.on, ph: c.ph }) + '<span class="sx-rm"><b class="sx-nm sx-ell">' + esc(c.name) + (c.blocked ? ' 🚫' : '') + '</b><span class="sx-pv sx-ell">' + (c.on ? '<em class="sx-onl">' + esc(t('online')) + '</em> · ' : '') + esc(c.id) + '</span></span>' +
          '<span class="sx-ib sx-go2" aria-hidden="true">' + ic('send') + '</span></button>';
      }).join('');
    } else if (!D.ready && !q) h += skel(2);
    else if (!q && !reqs.length) h += empty(ic('uadd'), x.emptyT || t('addFriend'), t('emptyFriendsS'), '<button type="button" class="sx-btn gold" data-act="shareMe"><b class="fit">' + esc(x.share || t('share')) + '</b></button>');
    if (q && !cts.length && !reqs.length) h += '<p class="sx-none" data-key="none">' + esc(t('noResult')) + '</p>';
    return h;
  }
  function shareMe(btn) {
    var x = LT('live'), me = (D.fr && D.fr.me) || '', txt = fmt(x.shareTxt || 'My OROLADO ID: {id}', { id: me }) + ' https://orolado.com';
    if (navigator.share) { navigator.share({ text: txt }).catch(function () {}); return; }
    copyFx(btn, txt);
  }
  // un seul écouteur pour toute la liste (la liste est mise à jour sans être redessinée)
  function bindBody(b) {
    b.addEventListener('click', async function (e) {
      var el = e.target.closest('[data-act],[data-fyes],[data-fno],[data-gyes],[data-gno],.sx-row[data-k],.sx-req[data-k]');
      if (!el || !b.contains(el)) return;
      var x = LT('live'), gx = GX();
      if (el.hasAttribute('data-act')) {
        var a = el.getAttribute('data-act');
        if (a === 'signup') { if (D6.Live && D6.Live.toAuth) D6.Live.toAuth('register'); }
        else if (a === 'toReq' || a === 'toFriends') { seg = 'friends'; paintBody(true); }
        else if (a === 'newGroup') createSheet();
        else if (a === 'copyMe') copyFx(el, (D.fr && D.fr.me) || '');
        else if (a === 'shareMe') shareMe(el);
        else if (a === 'myPhoto') photoSheet('me');
        return;
      }
      if (el.hasAttribute('data-fyes') || el.hasAttribute('data-fno')) {
        e.stopPropagation(); el.disabled = true;
        var yes = el.hasAttribute('data-fyes'), id = el.getAttribute(yes ? 'data-fyes' : 'data-fno');
        await call('friendAnswer', { id: id, yes: yes ? 1 : 0 });
        await load(); paintBody();
        if (yes) listConv('dm:' + id);
        return;
      }
      if (el.hasAttribute('data-gyes') || el.hasAttribute('data-gno')) {
        el.disabled = true;
        var gy = el.hasAttribute('data-gyes'), gid = el.getAttribute(gy ? 'data-gyes' : 'data-gno');
        var r = await call('gAnswer', { gid: gid, yes: gy ? 1 : 0 });
        if (r && !r.ok) toast(gx[r.reason] || gx.fail || '!', 'err');
        await load(); paintBody();
        if (gy && r && r.ok && r.g) listConv('g:' + r.g.id);
        return;
      }
      listConv(el.getAttribute('data-k'));
    });
    b.addEventListener('submit', async function (e) {
      if (!e.target || e.target.id !== 'sxAdd') return;
      e.preventDefault();
      var x = LT('live'), raw = $('sxAddIn').value.trim(), m = $('sxAddMsg');
      var v = raw.indexOf('@') >= 0 ? raw.replace(/\s+/g, '').toLowerCase() : raw.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
      m.textContent = '';
      if (v.length < 7) { m.textContent = x.notFound || '?'; return; }
      var j = await call('find', { id: v });
      if (j && j.ok) { $('sxAddIn').value = ''; listConv('dm:' + j.peer.id, j.peer.name, j.peer.ph); }
      else m.textContent = x[(j && j.reason) || 'notFound'] || x.notFound || '?';
    });
  }
  function markSel() { if (!root) return; var k = conv && conv.k; root.querySelectorAll('#sxL .sx-row[data-k]').forEach(function (r) { r.classList.toggle('sel', !!k && r.getAttribute('data-k') === k); }); }
  async function refreshList() { await load(); if (active && $('sxBody')) paintBody(); }
  function listPoll() { clearInterval(tList); tList = setInterval(function () { if (alive() && !document.hidden && (!conv || wide)) refreshList(); }, 15000); }

  /* ======================= FEUILLES (en bas de l'écran) ======================= */
  function sheet(html) { var s = $('sxSh'); s.innerHTML = '<div class="sx-shin"><i class="sx-grab"></i>' + html + '</div>'; s.hidden = false; return s; }
  function closeSheet() { var s = $('sxSh'); if (s) { s.hidden = true; s.innerHTML = ''; } if (sheetDone) { var f = sheetDone; sheetDone = null; f(false); } }
  var sheetDone = null;
  // v2905 : confirmation DANS le site (plus de fenêtre « confirm() » du navigateur)
  function ask(o) {
    return new Promise(function (res) {
      var s = sheet('<div class="sx-ask">' + (o.av || '') + '<b class="sx-askt">' + esc(o.title) + '</b>' + (o.sub ? '<p>' + esc(o.sub) + '</p>' : '') + (o.input ? '<textarea id="sxAskIn" rows="3" maxlength="300" placeholder="' + esc(o.input) + '"></textarea>' : '') +
        '<div class="sx-yn"><button type="button" class="sx-btn ghost" data-a="0"><b class="fit">' + esc(t('cancel')) + '</b></button><button type="button" class="sx-btn ' + (o.danger ? 'red' : 'gold') + '" data-a="1"><b class="fit">' + esc(o.ok) + '</b></button></div></div>');
      sheetDone = res;
      s.querySelectorAll('[data-a]').forEach(function (b) { b.addEventListener('click', function () { var v = b.getAttribute('data-a') === '1' ? (o.input ? ($('sxAskIn').value || '') : true) : false; sheetDone = null; closeSheet(); res(v === '' ? '' : v); }); });
      fitAll(s);
    });
  }
  function emoGrid(cur) {
    return '<div class="sx-emos">' + EMB.map(function (k) { var e = EMO_OF[k], sel = emblemKey(cur) === k; return '<button type="button" class="' + (sel ? 'on' : '') + '" data-e="' + e + '" aria-label="' + esc(t('em')[k] || k) + '">' + emblem(e) + '<small class="fit">' + esc((t('em') || {})[k] || k) + '</small></button>'; }).join('') + '</div>';
  }
  function createSheet() {
    var x = GX(), pick = EMO_OF.fire;
    var s = sheet('<b class="sx-sht fit">' + esc(t('newGroup')) + '</b>' + emoGrid(pick) +
      '<form id="sxGf" class="sx-add" autocomplete="off"><input id="sxGn" maxlength="40" placeholder="' + esc(x.namePh || t('newGroup')) + '"><button type="submit" class="sx-btn"><b class="fit">' + esc(t('create')) + '</b></button></form><p class="sx-msg" id="sxGm"></p>');
    s.querySelectorAll('[data-e]').forEach(function (b) { b.addEventListener('click', function () { pick = b.getAttribute('data-e'); s.querySelectorAll('[data-e]').forEach(function (z) { z.classList.toggle('on', z === b); }); }); });
    $('sxGf').addEventListener('submit', async function (e) {
      e.preventDefault();
      var bt = this.querySelector('button'); bt.disabled = true;
      var r = await call('gCreate', { name: $('sxGn').value, emoji: pick });
      bt.disabled = false;
      if (r && r.ok) { closeSheet(); await load(); seg = 'groups'; paintBody(); listConv('g:' + r.g.id); }
      else $('sxGm').textContent = x[(r && r.reason) || 'fail'] || x.fail || '!';
    });
    fitAll(s);
  }
  /* ---------- v2905 : photo de profil / photo du groupe : carré, 256 px, JPEG léger ---------- */
  function shrinkSq(file) {
    return new Promise(function (res, rej) {
      var fr = new FileReader();
      fr.onload = function () {
        var im = new Image();
        im.onload = function () {
          var s = Math.min(im.width, im.height), sx = (im.width - s) / 2, sy = (im.height - s) / 2, out = 256;
          var cv = document.createElement('canvas'); cv.width = out; cv.height = out;
          var cx = cv.getContext('2d'); cx.fillStyle = '#1a1240'; cx.fillRect(0, 0, out, out); cx.drawImage(im, sx, sy, s, s, 0, 0, out, out);
          var qq = 0.86, d = cv.toDataURL('image/jpeg', qq);
          while (d.length > 380000 && qq > 0.4) { qq -= 0.1; d = cv.toDataURL('image/jpeg', qq); }
          res(d);
        };
        im.onerror = rej; im.src = fr.result;
      };
      fr.onerror = rej; fr.readAsDataURL(file);
    });
  }
  function photoSheet(kind) {
    var g = kind === 'group' && conv && conv.g, has = g ? !!g.photo : !!(D.fr && D.fr.ph);
    var av = g ? avatar({ group: 1, emoji: g.emoji, photo: g.photo }, true) : myAv(true);
    var s = sheet('<div class="sx-shhead" id="sxPhHead">' + av + '<b class="sx-ell">' + esc(g ? g.name : t('myPhoto')) + '</b></div><div class="sx-menu">' +
      '<label class="sx-mi"><input type="file" id="sxPhF" accept="image/*" hidden>' + ic('img') + '<span class="fit">' + esc(has ? t('photo2') : t('photoAdd')) + '</span></label>' +
      (has ? '<button type="button" data-m="del" class="red">' + ic('trash') + '<span class="fit">' + esc(t('photoDel')) + '</span></button>' : '') + '</div>' +
      (g ? '<p class="sx-h"><span class="fit">' + esc(t('logoPick')) + '</span></p>' + emoGrid(g.photo ? '' : g.emoji) : '') + '<p class="sx-msg" id="sxPhM"></p>');
    var done = async function (r, ph) {
      if (!r || !r.ok) { $('sxPhM').textContent = errMsg(r); return; }
      closeSheet();
      if (g) { await refreshConv(); groupInfo(); refreshList(); }
      else { if (D.fr) D.fr.ph = ph; paintBody(); try { document.dispatchEvent(new CustomEvent('oro:myphoto', { detail: { ph: ph || '' } })); } catch (e) { /* ignore */ } }
    };
    $('sxPhF').addEventListener('change', async function () {
      var fl = this.files && this.files[0]; this.value = ''; if (!fl) return;
      var d; try { d = await shrinkSq(fl); } catch (e) { $('sxPhM').textContent = t('badImg'); return; }
      var hd = $('sxPhHead'); if (hd) { var a = hd.querySelector('.sx-av'); if (a) a.outerHTML = '<span class="sx-av big sx-av-ph"><img src="' + d + '" alt=""></span>'; }
      var r = g ? await call('gPhoto', { gid: g.id, img: d }) : await call('setPhoto', { img: d });
      done(r, r && r.ph);
    });
    var del = s.querySelector('[data-m=del]');
    if (del) del.addEventListener('click', async function () { var r = g ? await call('gPhoto', { gid: g.id, img: '' }) : await call('setPhoto', { img: '' }); done(r, ''); });
    s.querySelectorAll('[data-e]').forEach(function (b) { b.addEventListener('click', async function () { var r = await call('gEmoji', { gid: g.id, emoji: b.getAttribute('data-e') }); done(r); }); });
    fitAll(s);
  }

  /* ========================= CONVERSATION ========================= */
  function inConv(onOff) { root.classList.toggle('sx-in-conv', !!onOff); }
  function kindOf(k) { return k === 'news' || k === 'team' ? k : k.indexOf('dm:') === 0 ? 'dm' : 'group'; }
  async function openConv(k, name, ph) {
    if (!root) return;
    if (guest() && k !== 'news') { if (k === 'team') leave('guest', 'chat', true); return; }
    clearInterval(tConv); clearInterval(tDuel); micStop(true);
    if (conv) dropLocal(conv);
    var kind = kindOf(k);
    conv = { k: k, kind: kind, id: k.replace(/^(dm|g):/, ''), msgs: [], pend: [], sig: '', name: name || '', ph: ph || '', picking: false, img: '', aud: '', audUrl: '', alias: {}, local: {} };
    closePanel(); closeSheet();
    var it = chatItems().filter(function (z) { return z.k === k; })[0];
    if (it && !conv.name) conv.name = it.name;
    if (it && it.ph && !conv.ph) conv.ph = it.ph;
    if (it && it.emoji) { conv.emoji = it.emoji; conv.photo = it.photo; }
    if (kind === 'group') { var gl = ((D.gr && D.gr.list) || []).filter(function (z) { return z.id === conv.id; })[0]; if (gl) conv.canWrite = gl.canWrite !== false; }
    // v2905 : les derniers messages gardés s'affichent TOUT DE SUITE (puis seuls les nouveaux arrivent du serveur)
    var cc = (kind === 'dm' || kind === 'group' || kind === 'team') ? cacheGet(k) : null;
    if (cc) {
      conv.msgs = cc.m.map(unslim);
      if (!conv.name) conv.name = cc.name; if (!conv.ph) conv.ph = cc.ph;
      conv.on = conv.on || cc.on; conv.peerId = cc.peerId; conv.blocked = cc.blocked; conv.req = cc.req;
      if (cc.g) { conv.g = cc.g; conv.emoji = cc.g.emoji; conv.photo = cc.g.photo; if (conv.canWrite === undefined) conv.canWrite = cc.g.canWrite; }
    }
    paintConvShell();
    inConv(true); markSel();
    if (cc && (conv.msgs.length || kind === 'dm')) { paintMsgs(true); if (kind === 'dm') { paintBanner(); if ($('sxComp')) $('sxComp').hidden = !!conv.blocked; } }
    else if (kind === 'news') paintMsgs(true);
    else msgSkel();
    await refreshConv(true);
    var every = kind === 'team' ? 10000 : kind === 'news' ? 60000 : 6000;
    tConv = setInterval(function () { if (alive() && !document.hidden && conv && conv.k === k) refreshConv(); }, every);
  }
  function dropLocal(c) { Object.keys(c.local || {}).forEach(function (id) { var u = c.local[id]; if (u && u.indexOf('blob:') === 0) { try { URL.revokeObjectURL(u); } catch (e) { /* ignore */ } } }); }
  function closeConv() {
    clearInterval(tConv); clearInterval(tDuel); micStop(true);
    if (conv && conv.kind === 'group') gSeen(conv.id, Math.floor(Date.now() / 1000));
    if (conv) dropLocal(conv);
    conv = null; closePanel(); inConv(false); if (wide) paintConvEmpty(); refreshList(); markSel();
  }
  function paintConvEmpty() {
    var C = $('sxC'); if (!C) return;
    C.innerHTML = '<div class="sx-pick">' + empty(ic('send'), t('pickChat'), '') + '</div>';
    fitAll(C);
  }
  function headStatus() {
    var c = conv;
    if (c.kind === 'news') return esc(TT().good);
    if (c.kind === 'team') return esc(t('teamSub'));
    if (c.kind === 'group') return c.g ? esc(members(c.g.n)) : '';
    return c.on ? '<em class="sx-onl">' + esc(t('online')) + '</em>' : esc(c.peerId || c.id);
  }
  function headAv() { var c = conv; return avatar({ k: c.kind === 'news' || c.kind === 'team' ? c.kind : '', group: c.kind === 'group', name: c.name || '?', emoji: c.emoji || '💬', photo: c.photo, ph: c.ph, on: c.on }); }
  function setIf(el, prop, v) { if (el && el[prop] !== v) el[prop] = v; }
  function paintHead() {
    var c = conv; if (!c) return;
    var wn = $('sxWn'); if (wn) setHTML(wn, '<span class="sx-wnt">' + esc(c.kind === 'news' ? TT().newsT : c.kind === 'team' ? t('team') : c.name) + '</span>' + (c.kind === 'news' || c.kind === 'team' ? VER : ''));
    var hs = headStatus(), ws = $('sxWs'); if (ws && ws._h !== hs) { ws._h = hs; ws.innerHTML = hs; }
    var wa = $('sxWa'); if (wa) setHTML(wa, headAv());
  }
  function paintConvShell() {
    var c = conv, x = LT('live'), C = $('sxC');
    var acts = '';
    if (c.kind === 'dm') {
      if (D6.LiveSend && D6.LiveSend.enabled && D6.LiveSend.enabled()) acts += '<button type="button" class="sx-ib" data-ca="money" aria-label="' + esc(t('sendMoney')) + '">' + ic('money') + '</button>';
      acts += '<button type="button" class="sx-ib" data-ca="duel" aria-label="' + esc(x.duelBtn || 'Challenge') + '">' + ic('duel') + '</button>';
      acts += '<button type="button" class="sx-ib" data-ca="menu" aria-label="' + esc(t('more')) + '">' + ic('dots') + '</button>';
    } else if (c.kind === 'group') acts += '<button type="button" class="sx-ib" data-ca="info" aria-label="' + esc(t('groupInfo')) + '">' + ic('dots') + '</button>';
    var canMic = c.kind !== 'news';
    var ph = c.kind === 'group' ? (GX().ph || x.ph) : x.ph;
    C.innerHTML = '<header class="sx-hd sx-chd"><button type="button" class="sx-ib sx-bk" id="sxCBack" aria-label="Back">' + ic('back') + '</button>' +
      '<button type="button" class="sx-who" id="sxWho"><span class="sx-wa" id="sxWa"></span><span class="sx-wt"><b class="sx-ell" id="sxWn"></b><small class="sx-ell" id="sxWs"></small></span></button>' + acts + '</header>' +
      '<div class="sx-ban" id="sxBan" hidden></div><div class="sx-msgs' + (c.kind === 'news' ? ' sx-newsp' : '') + '" id="sxMsgs" role="log"></div><div class="sx-qk" id="sxQk" hidden></div>' +
      (c.kind === 'group' && c.canWrite === false ? '' : c.kind === 'news' ? '' :
      '<form class="sx-comp" id="sxComp" autocomplete="off"><label class="sx-cb sx-cam" aria-label="' + esc(t('photo')) + '">' + ic('cam') + '<input type="file" id="sxFile" accept="image/*" hidden></label>' +
      '<div class="sx-inw"><div class="sx-prev" id="sxPrev" hidden></div><textarea id="sxTx" rows="1" maxlength="4000" enterkeyhint="send" placeholder="' + esc(ph || '…') + '"></textarea>' +
      '<div class="sx-recb" id="sxRec" hidden><i class="sx-recd"></i><b id="sxRecT">0:00</b><small class="fit">' + esc(t('rec')) + '</small></div></div>' +
      (canMic ? '<button type="button" class="sx-cb sx-mic" id="sxMic" aria-label="' + esc(t('voice')) + '">' + ic('mic') + '</button>' : '') +
      '<button type="submit" class="sx-cb sx-go" id="sxGo" aria-label="Send" hidden>' + ic('send') + '</button></form>');
    paintHead();
    $('sxCBack').addEventListener('click', backConv);
    $('sxWho').addEventListener('click', function () { if (c.kind === 'group') groupInfo(); else if (c.kind === 'dm') dmMenu(); });
    C.querySelectorAll('[data-ca]').forEach(function (b) {
      b.addEventListener('click', function () {
        var a = b.getAttribute('data-ca');
        if (a === 'money') leave('send', c.peerId || c.id, true);
        else if (a === 'duel') { c.hideDuel = ''; if (c.duel && (c.duel.st === 'pending' || c.duel.st === 'active')) { renderDuel(true); return; } c.picking = !c.picking; renderDuel(true); }
        else if (a === 'menu') dmMenu();
        else if (a === 'info') groupInfo();
      });
    });
    var f = $('sxComp');
    if (f) {
      f.addEventListener('submit', function (e) { e.preventDefault(); send(); });
      // 2026-10-20 : toucher « Envoyer » ne ferme plus le clavier (comme WhatsApp) : l'écran ne descend / remonte plus à chaque message
      var gb = $('sxGo'), gy = 0, gx = 0;
      if (gb) {
        gb.addEventListener('touchstart', function (e) { var p = e.touches[0]; gx = p.clientX; gy = p.clientY; }, { passive: true });
        gb.addEventListener('touchend', function (e) {
          var p = e.changedTouches[0], txf = $('sxTx');
          if (gb.hidden || !txf || document.activeElement !== txf || Math.abs(p.clientX - gx) > 12 || Math.abs(p.clientY - gy) > 12) return;
          e.preventDefault(); send();
        }, { passive: false });
        gb.addEventListener('mousedown', function (e) { var txf = $('sxTx'); if (txf && document.activeElement === txf) e.preventDefault(); });
      }
      var tx = $('sxTx');
      tx.addEventListener('input', function () { grow(); syncBtns(); });
      tx.addEventListener('keydown', function (e) { if (e.key === 'Enter' && !e.shiftKey && wide) { e.preventDefault(); send(); } });
      tx.addEventListener('focus', function () { setTimeout(function () { vv(); var el = $('sxMsgs'); if (el && el._stick !== false) el.scrollTop = 1e9; }, 250); });
      $('sxFile').addEventListener('change', async function () {
        var fl = this.files && this.files[0]; this.value = ''; if (!fl) return;
        try { var sh = await shrink(fl); c.img = sh.d; c.wh = sh.w + 'x' + sh.h; c.aud = ''; showPrev('<img src="' + c.img + '" alt="">'); } catch (err) { toast(t('badImg'), 'err'); }
      });
      if ($('sxMic')) $('sxMic').addEventListener('click', function () { if (rec) micStop(); else micStart(); });
      syncBtns();
    }
    var M = $('sxMsgs');
    M.addEventListener('scroll', function () { M._stick = M.scrollTop + M.clientHeight >= M.scrollHeight - 60; if (M.scrollTop < 160) loadOlder(); }, { passive: true });
    M.addEventListener('click', function (e) {
      var a = e.target.closest('a[href]');
      if (a) { var gm = /^https:\/\/(?:www\.)?orolado\.com\/?\?(?:.*&)?g=([a-f0-9]{8,40})/i.exec(a.getAttribute('href') || ''); if (gm) { e.preventDefault(); joinPreview(gm[1].toLowerCase()); return; } }
      var im = e.target.closest('.sx-b img'); if (im) { var lb = $('sxLb'); lb.innerHTML = '<img src="' + esc(im.getAttribute('src')) + '" alt="">'; lb.hidden = false; return; }
      var tp = e.target.closest('[data-tip]'); if (tp) { tipGo(tp.getAttribute('data-tip')); return; }
      var rt = e.target.closest('[data-retry]'); if (rt) { retry(rt.getAttribute('data-retry')); return; }
      var lk = e.target.closest('.sx-like'); if (lk) { like(lk); return; }
      if (e.target.closest('#sxTerms')) { var bt = $('btnHelpTerms'); if (bt) bt.click(); return; }
      if (e.target.closest('#sxPriv')) { var bp = $('btnHelpPrivacy'); if (bp) bp.click(); }
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
  // 2026-10-20 (propriétaire : « tic-tic » en écrivant) : la mesure de la case (hauteur « auto » un court instant) faisait
  // glisser la conversation de quelques pixels à chaque lettre. On remet la conversation et la case exactement où elles
  // étaient, dans la même image (rien ne bouge à l'écran) ; la hauteur ne change que si une ligne s'ajoute ou s'enlève.
  function grow() {
    var tx = $('sxTx'); if (!tx) return; fitPh(tx);
    var el = $('sxMsgs'), st = el ? el.scrollTop : 0, ts = tx.scrollTop, h0 = tx.style.height;
    tx.style.height = 'auto'; var h = Math.min(120, tx.scrollHeight) + 'px'; tx.style.height = h; tx.scrollTop = ts;
    if (!el) return;
    if (h !== h0 && el._stick !== false) el.scrollTop = 1e9; else el.scrollTop = st;
  }
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

  // message du serveur → message affiché ; la clé reste celle du message « en cours d'envoi » (pas de clignotement)
  function mk(c, m, extra) { var o = Object.assign({ id: m.id, key: c.alias[m.id] || m.id, t: m.t, img: c.local[m.id] || m.img, simg: m.img, wh: m.wh, at: m.at }, extra || {}); return o; }
  // réponse « depuis le dernier message » : on ajoute seulement les nouveaux ; sinon on remplace tout
  function merge(c, list, delta) {
    if (!delta) return list;
    var seen = {}; list.forEach(function (m) { seen[m.id] = 1; });
    return c.msgs.filter(function (m) { return !seen[m.id]; }).concat(list).slice(-3000);
  }
  function gMsg(c, m, gx) {
    if (m.sys) return { sys: 1, id: m.id, key: 's' + (m.id || m.at + m.whom), t: String(gx.sysAdd || '{a} + {b}').replace('{a}', m.mine ? t('you') : m.who).replace('{b}', m.whom), at: m.at };
    return mk(c, Object.assign({}, m, { id: m.id || ('x' + m.at + m.who + (m.t || '').slice(0, 9)) }), { mine: m.mine, who: m.who, wph: m.wph || '' });
  }
  /* 2026-10-20 (propriétaire : « rien ne doit s'effacer ») : en remontant tout en haut d'une discussion, les messages plus
     anciens arrivent (80 à la fois, comme WhatsApp) ; l'écran reste exactement sur le message que l'on lisait. */
  async function loadOlder() {
    var c = conv, el = $('sxMsgs');
    if (!c || !el || !c.more || c.olderBusy || (c.kind !== 'dm' && c.kind !== 'group')) return;
    var first = '';
    for (var i = 0; i < c.msgs.length; i++) { var id = String(c.msgs[i].id || ''); if (/^m[0-9a-f]{6,}$/.test(id)) { first = id; break; } }
    if (!first) return;
    c.olderBusy = true;
    var j = c.kind === 'dm' ? await call('dm', { id: c.id, before: first }) : await call('gGet', { gid: c.id, before: first });
    c.olderBusy = false;
    if (conv !== c || !j || !j.ok) return;
    c.more = !!j.more;
    var gx = GX(), seen = {};
    c.msgs.forEach(function (m) { seen[m.id] = 1; });
    var list = (j.older || []).map(function (m) { return c.kind === 'dm' ? mk(c, m, { mine: m.mine }) : gMsg(c, m, gx); }).filter(function (m) { return !seen[m.id]; });
    if (!list.length) return;
    var h0 = el.scrollHeight, t0 = el.scrollTop;
    el._stick = false; el._sxQuiet = true;
    c.msgs = list.concat(c.msgs);
    paintMsgs(false);
    el._sxQuiet = false;
    el.scrollTop = t0 + (el.scrollHeight - h0);
  }
  async function refreshConv(first) {
    var c = conv; if (!c) return;
    var k = c.k;
    if (c.kind === 'news') {
      var j = await call('feed', {}); if (!conv || conv.k !== k || !j || !j.ok) return;
      D.feed = j;
      var posts = (j.posts || []).slice().reverse();
      c.msgs = posts.map(function (p) { return { id: p.id, key: p.id, t: p.t, img: p.img, link: p.link, at: p.at, likes: p.likes, views: p.views, post: 1 }; });
      var seen = store('oro_live_seen') || [], fresh = [];
      (j.posts || []).forEach(function (p) { if (seen.indexOf(p.id) < 0) { fresh.push(p.id); seen.push(p.id); } });
      if (fresh.length) { store('oro_live_seen', seen.slice(-200)); call('seen', { ids: fresh }); }
    } else if (c.kind === 'team') {
      var jt = await call('feed', { read: 1 }); if (!conv || conv.k !== k || !jt || !jt.ok) return;
      D.feed = jt;
      var ms = (jt.me && jt.me.msgs) || [], lastTeam = 0;
      ms.forEach(function (m) { if (m.f === 'a') lastTeam = Math.max(lastTeam, m.at); });
      c.msgs = ms.map(function (m) { return mk(c, m, { mine: m.f !== 'a', read: m.f !== 'a' && lastTeam >= m.at, who: m.f === 'a' ? t('team') : '' }); });
      if (D6.Live && D6.Live.badges) D6.Live.badges({ unread: 0, dmUnread: jt.me ? jt.me.dmUnread : 0 });
      paintQuick();
    } else if (c.kind === 'dm') {
      var jd = await call('dm', { id: c.id, since: lastSrvId(c) }); if (!conv || conv.k !== k) return;
      if (!jd || !jd.ok) { if (first && !c.msgs.length) { toast(LT('live')[(jd && jd.reason) || 'notFound'] || '!', 'err'); closeConv(); } return; }
      c.peerId = jd.peer.id; c.name = jd.peer.name; c.ph = jd.peer.ph || ''; c.on = !!jd.on; c.blocked = !!jd.blocked; c.req = !!jd.req; c.duel = jd.duel || null; c.stats = jd.stats || null;
      if (c.duel) c.duelOff = c.duel.now - Date.now() / 1000;
      c.msgs = merge(c, jd.msgs.map(function (m) { return mk(c, m, { mine: m.mine }); }), !!jd.delta);
      if (!jd.delta) c.more = !!jd.more; else if (c.more === undefined) c.more = true; // ouverte depuis la mémoire : on pourra remonter
      var un = jd.peerUn == null ? -1 : +jd.peerUn, mine = c.msgs.filter(function (m) { return m.mine; }).length, i = 0;
      c.msgs.forEach(function (o) { if (o.mine) { i++; o.read = un >= 0 && i <= mine - un; } });
      paintHead();
      renderDuel();
      if ($('sxComp')) $('sxComp').hidden = c.blocked;
    } else {
      var jg = await call('gGet', { gid: c.id, since: lastSrvId(c) }); if (!conv || conv.k !== k) return;
      if (!jg || !jg.ok) { if (jg && (jg.reason === 'gGone' || jg.reason === 'gDeleted')) { groupGone(c, jg.reason); cacheDel(k); } else if (first && !c.msgs.length) { toast(GX().fail || '!', 'err'); closeConv(); } return; }
      if (jg.g.delta) jg.g.members = (c.g && c.g.members) || [];
      c.g = jg.g; c.name = jg.g.name; c.emoji = jg.g.emoji; c.photo = jg.g.photo || '';
      var gx = GX();
      c.msgs = merge(c, jg.g.msgs.map(function (m) { return gMsg(c, m, gx); }), !!jg.g.delta);
      if (!jg.g.delta) c.more = !!jg.g.more; else if (c.more === undefined) c.more = true;
      paintHead();
      gSeen(c.id, Math.max(Math.floor(Date.now() / 1000), jg.g.at || 0));
      if (jg.g.canWrite === false) {
        if ($('sxComp')) $('sxComp').remove();
        if (first && !$('sxOnly') && soft('gread')) { var p = document.createElement('p'); p.className = 'sx-ro'; p.id = 'sxOnly'; p.innerHTML = '<span>' + esc(gx.onlyOwner || '') + '</span>'; $('sxC').appendChild(p); }
      }
    }
    c.loaded = true;
    paintMsgs(first);
    cachePut(c.k, snap(c));
  }
  /* v2905 : en ouvrant Social, les premières discussions sont préparées en silence (rien n'est marqué « lu ») :
     les ouvrir ensuite est instantané. */
  var preT = 0;
  function prefetch() {
    clearTimeout(preT);
    if (guest()) return;
    var items = chatItems().filter(function (it) { return /^(dm|g):/.test(it.k); }).slice(0, 6), i = 0;
    var next = async function () {
      if (!active || i >= items.length) return;
      var it = items[i++], cc = cacheGet(it.k);
      if ((conv && conv.k === it.k) || (cc && cc.u && cc.u / 1000 >= (it.at || 0))) { preT = setTimeout(next, 50); return; }
      var fake = { k: it.k, msgs: cc ? cc.m.map(unslim) : [], alias: {}, local: {} }, id = it.k.replace(/^(dm|g):/, '');
      if (it.k.indexOf('dm:') === 0) {
        var jd = await call('dm', { id: id, peek: 1, since: lastSrvId(fake) });
        if (jd && jd.ok) { fake.msgs = merge(fake, jd.msgs.map(function (m) { return mk(fake, m, { mine: m.mine }); }), !!jd.delta); fake.name = jd.peer.name; fake.ph = jd.peer.ph || ''; fake.peerId = jd.peer.id; fake.blocked = !!jd.blocked; fake.req = !!jd.req; if (!(conv && conv.k === it.k)) cachePut(it.k, snap(fake)); }
      } else {
        var jg = await call('gGet', { gid: id, since: lastSrvId(fake) });
        if (jg && jg.ok) {
          if (jg.g.delta) jg.g.members = (cc && cc.g && cc.g.members) || [];
          var gx = GX();
          fake.g = jg.g; fake.name = jg.g.name; fake.emoji = jg.g.emoji; fake.photo = jg.g.photo || '';
          fake.msgs = merge(fake, jg.g.msgs.map(function (m) { return m.sys ? { sys: 1, id: m.id, key: 's' + (m.id || m.at + m.whom), t: String(gx.sysAdd || '{a} + {b}').replace('{a}', m.mine ? t('you') : m.who).replace('{b}', m.whom), at: m.at } : mk(fake, m, { mine: m.mine, who: m.who, wph: m.wph || '' }); }), !!jg.g.delta);
          if (!(conv && conv.k === it.k)) cachePut(it.k, snap(fake));
        }
      }
      preT = setTimeout(next, 250);
    };
    preT = setTimeout(next, 400);
  }
  // v2905 : le groupe a été supprimé par son créateur (ou je n'en fais plus partie) : écran propre, plus de message d'erreur
  function groupGone(c, why) {
    clearInterval(tConv);
    if (D.gr && D.gr.list) D.gr.list = D.gr.list.filter(function (z) { return z.id !== c.id; });
    var el = $('sxMsgs'); if (!el) return;
    el._sxHtml = '';
    el.innerHTML = empty(ic('users'), why === 'gDeleted' ? t('gDelT') : t('gBadT'), why === 'gDeleted' ? t('gDelS') : (GX().gGone || ''), '<button type="button" class="sx-btn" id="sxGoneOk"><b class="fit">' + esc(t('ok')) + '</b></button>');
    if ($('sxComp')) $('sxComp').remove();
    c.g = null; var ib = root.querySelector('#sxC [data-ca=info]'); if (ib) ib.remove(); closePanel();
    $('sxGoneOk').addEventListener('click', function () { closeConv(); });
    fitAll(el);
  }
  function paintBanner() {
    var c = conv, b = $('sxBan'), x = LT('live'); if (!b || !c || c.kind !== 'dm') return;
    var st = c.req ? 'req' : c.blocked ? 'blk' : '';
    if (b._st === st + lg() && !b.hasAttribute('data-duel')) return;
    b._st = st + lg(); b.removeAttribute('data-duel');
    if (c.req) {
      b.hidden = false; b.className = 'sx-ban req';
      b.innerHTML = '<p><span>' + esc(t('reqBanner')) + '</span></p><div class="sx-yn"><button type="button" class="sx-btn sm ghost" id="sxRno"><b class="fit">' + esc(x.refuse || 'Decline') + '</b></button><button type="button" class="sx-btn sm ok" id="sxRyes"><b class="fit">' + esc(x.accept || 'Accept') + '</b></button></div>';
      $('sxRyes').addEventListener('click', async function () { await call('friendAnswer', { id: c.peerId, yes: 1 }); c.req = false; paintBanner(); refreshList(); });
      $('sxRno').addEventListener('click', async function () { await call('friendAnswer', { id: c.peerId, yes: 0 }); await load(); closeConv(); });
      fitAll(b); return;
    }
    if (c.blocked) {
      b.hidden = false; b.className = 'sx-ban blk';
      b.innerHTML = '<p><span>' + esc(x.youBlocked || '') + '</span></p><div class="sx-yn"><button type="button" class="sx-btn sm" id="sxUnb"><b class="fit">' + esc(noEmo(x.unblock || 'Unblock')) + '</b></button></div>';
      $('sxUnb').addEventListener('click', async function () { this.disabled = true; await call('block', { id: c.peerId, on: 0 }); await refreshConv(); refreshList(); });
      fitAll(b); return;
    }
    b.hidden = true; b.innerHTML = ''; b.className = 'sx-ban';
  }
  // v2905 : rien ne change → rien n'est redessiné ; sinon seules les bulles nouvelles ou changées sont touchées
  function paintMsgs(first) {
    var c = conv, el = $('sxMsgs'); if (!c || !el) return;
    var stick = first || el._stick !== false;
    var x = LT('live'), h = '', lastDay = 0, prev = null;
    if (c.kind === 'dm') h += '<div class="sx-sys safe" data-key="safe"><span>' + esc(String(x.safety || '').replace(/^🔒\s*/, '')) + '</span></div>';
    if (c.kind === 'team') h += bubble({ key: 'welcome', t: x.welcomeChat || '', at: 0, who: t('team') }, null);
    var all = c.msgs.concat(c.pend);
    all.forEach(function (m) {
      if (m.at) { var dn = dayN(m.at); if (dn !== lastDay) { lastDay = dn; h += '<div class="sx-day" data-key="d' + dn + '"><span>' + esc(dayLabel(m.at)) + '</span></div>'; prev = null; } }
      if (m.sys) { h += '<div class="sx-sys" data-key="' + esc(m.key) + '"><span>' + esc(m.t) + '</span></div>'; prev = null; return; }
      h += bubble(m, prev); prev = m;
    });
    if (c.kind === 'news') {
      // v2905 (propriétaire) : Actualités = une page d'infos simple (pas un fil de discussion) : les vraies nouvelles de
      // l'équipe en haut (la plus récente d'abord), puis « Bon à savoir » et ses cartes. La page s'ouvre en haut.
      var nh = c.msgs.slice().reverse().map(function (m) { return bubble(m, null); }).join('') +
        (c.msgs.length ? '<p class="sx-h sx-good" data-key="good"><span class="fit">' + esc(TT().good) + '</span></p>' : '') + tipsHtml() +
        '<div class="sx-legal" data-key="legal"><button type="button" id="sxTerms">' + esc(x.terms || 'Terms') + '</button> · <button type="button" id="sxPriv">' + esc(x.privacy || 'Privacy') + '</button></div>';
      if (setHTML(el, nh)) el.querySelectorAll('.fit').forEach(fitEl);
      if (first) el.scrollTop = 0;
      return;
    }
    if (!c.loaded && !all.length && c.kind !== 'news') { msgSkel(); return; }
    if (c.kind === 'dm' && !all.length) h += '<div class="sx-hi" data-key="hi">' + avatar({ name: c.name, ph: c.ph }, true) + '<b class="sx-ell">' + esc(c.name) + '</b><p>' + esc(t('sayHi')) + '</p></div>';
    if (c.kind === 'news') h += '<div class="sx-legal" data-key="legal"><button type="button" id="sxTerms">' + esc(x.terms || 'Terms') + '</button> · <button type="button" id="sxPriv">' + esc(x.privacy || 'Privacy') + '</button></div>';
    el._sxPop = !first && el.firstChild && !el.querySelector('.sx-bsk'); // 2026-10-20 : seuls les NOUVEAUX messages apparaissent en douceur
    var chg = setHTML(el, h);
    if (chg && el.querySelector('.fit')) el.querySelectorAll('.fit').forEach(fitEl);
    if (!chg && !first) return;
    if (stick) { el.scrollTop = 1e9; el._stick = true; requestAnimationFrame(function () { if (el.isConnected && el._stick !== false) el.scrollTop = 1e9; }); }
  }
  // toute première ouverture (rien de gardé) : des bulles grises à la place d'un écran vide
  function msgSkel() {
    var el = $('sxMsgs'); if (!el) return;
    setHTML(el, ['them w1', 'me w2', 'them w3', 'me w1'].map(function (k, i) { return '<div class="sx-b sx-bsk ' + k + '" data-key="bsk' + i + '" aria-hidden="true"></div>'; }).join(''));
  }
  // Actualités : cartes utiles (avant les publications de l'équipe, qui restent en bas, là où la page s'ouvre)
  function TT() { return Object.assign({}, TIPS.en, TIPS[lg()] || {}); }
  function tipsHtml() {
    var T = TT();
    return '<div class="sx-tips" data-key="tips">' + ['demo', 'action', 'myid', 'groups', 'duel', 'help'].map(function (k) {
      var x = T[k] || TIPS.en[k];
      return '<div class="sx-tip" data-key="tip' + k + '"><span class="sx-tipi">' + emblem(EMO_OF[TIP_ICO[k]] || TIP_EMO[TIP_ICO[k]]) + '</span><span class="sx-tipt"><b>' + esc(x[0]) + '</b><small>' + esc(x[1]) + '</small></span><button type="button" class="sx-btn sm" data-tip="' + k + '"><b class="fit">' + esc(x[2]) + '</b></button></div>';
    }).join('') + '</div>';
  }
  function tipGo(k) {
    if (k === 'action' || k === 'paris' || k === 'demo') {
      if (k !== 'demo' && D6.Route && D6.Route.socialReturn) D6.Route.socialReturn('casinoModal'); // fermer les Jeux → retour ici
      if (D6.Live && D6.Live.close) D6.Live.close();
      setTimeout(function () {
        if (k === 'action' && D6.Casino && D6.Casino.open) D6.Casino.open(null, 'games');
        else if (k === 'paris' && D6.Casino && D6.Casino.home) D6.Casino.home('sports');
        else if (k === 'demo') { var d = document.getElementById('modeDemo'); if (d && !d.classList.contains('on')) d.click(); }
      }, 80);
      return;
    }
    if (k === 'help') { if (guest()) leave('guest', 'chat', true); else { stepFrom(); openConv('team'); } return; }
    if (guest() && D6.Live && D6.Live.toAuth) { D6.Live.toAuth('register'); return; }
    stepFrom();
    closeConv();
    seg = k === 'groups' ? 'groups' : 'friends'; hint = k === 'duel' ? t('duelHint') : '';
    paintBody(true);
  }
  function bubble(m, prev) {
    var c = conv, mine = !!m.mine, cont = prev && !prev.sys && !!prev.mine === mine && (prev.who || '') === (m.who || '') && m.at - prev.at < 300;
    var media = '', src = m.img || m.imgData || '', aud = isAud(src) || (m.audUrl && !m.img) || (src.indexOf('blob:') === 0);
    if (m.audUrl && !src) src = m.audUrl;
    if (src) {
      if (aud) media = '<audio class="sx-aud" controls preload="metadata" src="' + esc(src) + '"></audio>';
      else {
        var wh = /^(\d+)x(\d+)$/.exec(m.wh || ''), st = wh ? ' style="aspect-ratio:' + wh[1] + '/' + wh[2] + '"' : '';
        media = '<img src="' + esc(src) + '" alt=""' + (m.post ? ' loading="lazy"' : ' decoding="async"') + st + (wh ? '' : ' class="nowh"') + '>';
      }
    }
    var who = (!mine && c.kind === 'group' && !cont && m.who) ? '<em class="sx-bw' + (m.wph ? ' ph' : '') + '" style="--av:' + avc(m.who) + '">' + (m.wph ? '<img src="' + esc(m.wph) + '" alt="" decoding="async">' : '') + '<span>' + esc(m.who) + '</span></em>' : '';
    var tick = '';
    if (mine) {
      if (m.st === 'sending') tick = '<i class="sx-st" title="' + esc(t('sending')) + '"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><path d="M12 7.5V12l3 2"/></svg></i>';
      else if (m.st === 'fail') tick = '';
      else if (c.kind === 'group') tick = '<i class="sx-tick">' + ic('check') + '</i>';
      else tick = '<i class="sx-tick' + (m.read ? ' rd' : '') + '"><svg viewBox="0 0 28 24"><path d="M3 12.5l4.5 4.5L17 7.5"/>' + (m.read ? '<path d="M11 15.5l1.5 1.5L22 7.5"/>' : '') + '</svg></i>';
    }
    var meta = '<span class="sx-meta">' + (m.at ? esc(m.post ? dayLabel(m.at) + ' · ' + hm(m.at) : hm(m.at)) : '') + tick + '</span>';
    var foot = '';
    if (m.post) {
      var liked = (store('oro_live_liked') || []).indexOf(m.id) >= 0;
      foot = (m.link ? '<a class="sx-plink sx-ell" href="' + esc(m.link) + '" target="_blank" rel="noopener">▶ ' + esc(m.link.replace(/^https:\/\/(www\.)?/, '').slice(0, 60)) + '</a>' : '') +
        '<span class="sx-pf"><button type="button" class="sx-like' + (liked ? ' on' : '') + '" data-id="' + esc(m.id) + '">' + (liked ? '❤️' : '🤍') + ' <span>' + (+m.likes || 0) + '</span></button><span class="sx-vw">👁 ' + (+m.views || 0) + '</span></span>';
    }
    var key = esc(m.key || m.id || ('w' + m.at));
    var fail = m.st === 'fail' ? '<button type="button" class="sx-fail" data-key="f' + key + '" data-retry="' + esc(m.id) + '">⚠️ <span>' + esc(t('failed')) + '</span></button>' : '';
    var txt = m.t ? '<span class="sx-bt">' + linkify(m.t) + '</span>' : '';
    return '<div data-key="' + key + '" class="sx-b ' + (mine ? 'me' : 'them') + (cont ? ' cont' : '') + (src ? (aud ? ' aud' : ' pic') : '') + (m.st ? ' ' + m.st : '') + (m.post ? ' post' : '') + '">' + who + media + txt + foot + meta + '</div>' + fail;
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
    if (conv.msgs.length || conv.pend.length) { qk.hidden = true; qk.innerHTML = ''; qk._s = ''; return; }
    if (qk._s === lg()) return; qk._s = lg();
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
    var p = { id: 'tmp' + (++sendN), mine: true, t: text, at: Math.floor(Date.now() / 1000), st: 'sending', img: '', wh: c.img ? c.wh : '', imgData: c.img, audUrl: c.aud ? c.audUrl : '', rawImg: c.img, rawAud: c.aud };
    p.key = p.id;
    c.pend.push(p);
    tx.value = ''; grow(); conv.img = ''; conv.aud = ''; conv.audUrl = ''; conv.wh = ''; var pv = $('sxPrev'); if (pv) { pv.hidden = true; pv.innerHTML = ''; } syncBtns();
    var el = $('sxMsgs'); if (el) el._stick = true;
    paintQuick(); paintMsgs();
    deliver(c, p);
  }
  async function deliver(c, p) {
    var j = null, body = { text: p.t, img: p.rawImg || '', aud: p.rawImg ? '' : (p.rawAud || ''), wh: p.wh || '' };
    if (c.kind === 'team') j = await call('send', Object.assign(body, { lang: lg() }));
    else if (c.kind === 'dm') j = await call('dmSend', Object.assign(body, { id: c.peerId || c.id }));
    else j = await call('gSend', Object.assign(body, { gid: c.id }));
    if (conv !== c) return;
    if (j && j.ok) {
      c.pend = c.pend.filter(function (z) { return z !== p; });
      if (j.msg) {
        c.alias[j.msg.id] = p.key;
        if (p.imgData || p.audUrl) c.local[j.msg.id] = p.imgData || p.audUrl; // la bulle garde la photo / le son déjà affichés
        if (!c.msgs.some(function (z) { return z.id === j.msg.id; })) c.msgs.push(mk(c, j.msg, { mine: true }));
      }
      if (j.auto) setTimeout(function () { if (conv === c && !c.msgs.some(function (z) { return z.id === j.auto.id; })) { c.msgs.push({ id: j.auto.id, key: j.auto.id, mine: false, who: t('team'), t: j.auto.t, at: j.auto.at }); paintMsgs(); } }, 900);
      paintMsgs();
      refreshConv();
      return;
    }
    p.st = 'fail'; paintMsgs();
    if (j && j.login && D6.Live) { D6.Live.toAuth('login'); return; }
    toast(errMsg(j), 'err');
  }
  function retry(id) { var c = conv; if (!c) return; var p = c.pend.filter(function (z) { return z.id === id; })[0]; if (!p) return; p.st = 'sending'; paintMsgs(); deliver(c, p); }

  /* ---------- photo réduite (et sa taille, pour garder la place de la bulle) ---------- */
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
          res({ d: out, w: w, h: h });
        };
        im.onerror = rej; im.src = fr.result;
      };
      fr.onerror = rej; fr.readAsDataURL(file);
    });
  }
  /* ---------- note vocale : v2905 jusqu'à 3 min (s'arrête seule avant d'être trop lourde), on l'écoute avant d'envoyer ---------- */
  var REC_MAX = 180, REC_BYTES = 1150000;
  var rec = null, recT = 0, recAt = 0, recDrop = false, recSize = 0;
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
    recDrop = false; recSize = 0;
    rec.ondataavailable = function (ev) { if (ev.data && ev.data.size) { parts.push(ev.data); recSize += ev.data.size; if (recSize > REC_BYTES) micStop(); } };
    rec.onstop = function () {
      clearInterval(recT); stream.getTracks().forEach(function (tr) { tr.stop(); });
      var mime = (rec && rec.mimeType) || type || 'audio/webm';
      rec = null;
      if ($('sxMic')) $('sxMic').classList.remove('on');
      if ($('sxRec')) $('sxRec').hidden = true; if ($('sxTx')) $('sxTx').hidden = false;
      if ($('sxMic')) $('sxMic').innerHTML = ic('mic');
      var blob = new Blob(parts, { type: mime.split(';')[0] });
      if (recDrop || conv !== c || Date.now() - recAt < 700 || blob.size < 400) { syncBtns(); return; }
      if (blob.size > 1250000) { toast(t('audBad'), 'err'); syncBtns(); return; }
      var fr = new FileReader();
      fr.onload = function () {
        if (conv !== c) return;
        c.aud = String(fr.result || ''); c.img = ''; c.audUrl = URL.createObjectURL(blob);
        showPrev('<audio controls src="' + c.audUrl + '"></audio>');
      };
      fr.readAsDataURL(blob);
    };
    recAt = Date.now();
    try { rec.start(1000); } catch (e) { rec.start(); }
    $('sxMic').classList.add('on'); $('sxMic').innerHTML = ic('stop');
    $('sxRec').hidden = false; $('sxTx').hidden = true;
    var tick = function () { var s = Math.min(REC_MAX, Math.floor((Date.now() - recAt) / 1000)); if ($('sxRecT')) $('sxRecT').textContent = Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2); if (Date.now() - recAt >= REC_MAX * 1000) micStop(); };
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
    var s = sheet('<div class="sx-shhead">' + avatar({ name: c.name, on: c.on, ph: c.ph }, true) + '<b class="sx-ell">' + esc(c.name) + '</b><small class="sx-ell">' + (c.on ? esc(t('online')) + ' · ' : '') + esc(c.peerId || c.id) + '</small></div>' +
      '<div class="sx-menu">' + items.map(function (it) { return '<button type="button" data-m="' + it[0] + '" class="' + (it[3] || '') + '">' + it[1] + '<span class="fit">' + esc(it[2]) + '</span></button>'; }).join('') + '</div>');
    s.querySelectorAll('[data-m]').forEach(function (b) {
      b.addEventListener('click', async function () {
        var m = b.getAttribute('data-m');
        if (m === 'copy') { copyFx(b, c.peerId || c.id); setTimeout(closeSheet, 900); return; }
        closeSheet();
        if (m === 'money') leave('send', c.peerId || c.id, true);
        else if (m === 'duel') { c.picking = !(c.duel && (c.duel.st === 'pending' || c.duel.st === 'active')); renderDuel(true); }
        else if (m === 'block') { await call('block', { id: c.peerId || c.id, on: c.blocked ? 0 : 1 }); await refreshConv(); refreshList(); }
        else if (m === 'report') {
          var why = await ask({ title: t('reportT', { n: c.name }), input: t('reportPh'), ok: t('reportGo'), danger: 1, av: avatar({ name: c.name, ph: c.ph }, true) });
          if (why === false) return;
          await call('report', { id: c.peerId || c.id, why: String(why || '') }); toast(x.reported || '✓', 'ok'); refreshConv(); refreshList();
        }
      });
    });
    fitAll(s);
  }

  /* ---------- défi en démo (même logique et mêmes appels que l'ancien Social) ---------- */
  function money(v) { v = Number(v) || 0; return (v >= 0 ? '+' : '−') + '$' + Math.abs(v).toFixed(2); }
  function mmss(s) { s = Math.max(0, Math.floor(s)); return Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2); }
  function renderDuel(force) {
    var c = conv, b = $('sxBan'), x = LT('live'); if (!c || c.kind !== 'dm' || !b) return;
    var d = c.duel, name = esc(c.name);
    // v2905 : le bandeau du défi n'est redessiné que si le défi a changé (plus de clignotement toutes les 6 s)
    var dsig = JSON.stringify([d && d.id, d && d.st, d && d.start, d && d.end, d && d.me, d && d.him, d && d.res, c.picking, c.hideDuel, c.req, c.blocked, lg()]);
    if (!force && b._dsig === dsig) return;
    b._dsig = dsig;
    clearInterval(tDuel); tDuel = 0;
    var setCard = function (cls, html) { b.hidden = false; b.className = 'sx-ban duel ' + cls; b.setAttribute('data-duel', '1'); b._st = ''; b.innerHTML = html; fitAll(b); };
    var closeBtn = '<button type="button" class="sx-ib sm sx-bx" id="sxDx" aria-label="x">' + ic('x') + '</button>';
    if (c.picking) {
      setCard('pick', closeBtn + '<b class="sx-dt"><span class="fit">⚔️ ' + esc(x.duelPick || '') + '</span></b><p>' + esc(x.duelPickS || '') + '</p><div class="sx-yn">' + [3, 5, 10].map(function (m) { return '<button type="button" class="sx-btn sm" data-m="' + m + '"><b class="fit">' + m + '&nbsp;min</b></button>'; }).join('') + '</div>');
      $('sxDx').addEventListener('click', function () { c.picking = false; renderDuel(true); });
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
    var hideMe = function () { c.hideDuel = d.id + d.st; renderDuel(true); };
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
      $('sxDre').addEventListener('click', function () { c.picking = true; renderDuel(true); });
      $('sxDx').addEventListener('click', hideMe);
      return;
    }
    var me = d.me || { net: 0, n: 0 }, him = d.him || { net: 0, n: 0 };
    var score = '<div class="sx-score"><div class="' + (me.net >= him.net ? 'lead' : '') + '"><small class="fit">' + esc(x.you || 'You') + '</small><b class="fit">' + money(me.net) + '</b><i class="fit">' + esc(fmt(x.duelTrades || '{n}', { n: me.n })) + '</i></div><span>VS</span><div class="' + (him.net > me.net ? 'lead' : '') + '"><small class="fit">' + name + '</small><b class="fit">' + money(him.net) + '</b><i class="fit">' + esc(fmt(x.duelTrades || '{n}', { n: him.n })) + '</i></div></div>';
    if (d.st === 'done') {
      setCard('done ' + (d.res || ''), closeBtn + '<b class="sx-dt"><span class="fit">' + esc(d.res === 'win' ? (x.duelWin || '') : d.res === 'lose' ? fmt(x.duelLose || '', { n: c.name }) : (x.duelTie || '')) + '</span></b>' + score + '<div class="sx-yn"><button type="button" class="sx-btn sm" id="sxDre"><b class="fit">⚔️ ' + esc(x.duelAgain || '') + '</b></button></div>');
      $('sxDre').addEventListener('click', function () { c.picking = true; renderDuel(true); });
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
      if (hd) { if (hd.innerHTML !== head) { hd.innerHTML = head; fitEl(hd); } return; }
      setCard('live', '<b class="sx-dt"><span class="fit">' + head + '</span></b>' + score + '<div class="sx-yn"><button type="button" class="sx-btn sm gold" id="sxDplay"><b class="fit">' + esc(x.duelPlay || 'Play') + '</b></button></div>');
      $('sxDplay').addEventListener('click', function () { if (D6.Live) D6.Live.close(); var demo = document.getElementById('modeDemo'); if (demo && !demo.classList.contains('on')) demo.click(); });
    };
    b.innerHTML = ''; paint();
    tDuel = setInterval(paint, 1000);
  }

  /* ---------- fiche du groupe (comme WhatsApp) ---------- */
  function panel(html) { var p = $('sxP'); p.innerHTML = html; p.hidden = false; root.classList.add('sx-in-panel'); return p; }
  function closePanel() { var p = $('sxP'); if (p) { p.hidden = true; p.innerHTML = ''; } if (root) root.classList.remove('sx-in-panel'); }
  async function shareLink(btn) {
    var x = GX(), g = conv && conv.g; if (!g) return;
    try { if (navigator.share) { await navigator.share({ text: (x.shareText || '') + g.name, url: g.link }); return; } } catch (e) { return; }
    copyFx(btn, (x.shareText || '') + g.name + ' ' + g.link);
  }
  function groupInfo() {
    var c = conv, g = c && c.g, x = GX(); if (!g) return;
    // liste des membres gardée trop vieille (on ne la redemande pas à chaque message) → mise à jour
    if (!g.members || g.members.length !== Math.min(g.n, 300)) call('gGet', { gid: g.id }).then(function (r) { if (r && r.ok && conv === c && c.g) { c.g.members = r.g.members || []; c.g.n = r.g.n; if (c.g.members.length === Math.min(c.g.n, 300) && $('sxGiAdd')) groupInfo(); } });
    var p = panel('<header class="sx-hd"><button type="button" class="sx-ib sx-bk" id="sxPBack" aria-label="Back">' + ic('back') + '</button><b class="sx-ttl fit">' + esc(t('groupInfo')) + '</b></header>' +
      '<div class="sx-pbody"><div class="sx-ghero">' + (g.owner ? '<button type="button" class="sx-mya big" id="sxGiPh" aria-label="' + esc(t('photo2')) + '">' + avatar({ group: 1, emoji: g.emoji, photo: g.photo }, true) + '<i class="sx-camb">' + ic('cam') + '</i></button>' : avatar({ group: 1, emoji: g.emoji, photo: g.photo }, true)) +
      '<b class="sx-ell">' + esc(g.name) + '</b><small class="fit">' + esc(t('group') + ' · ' + members(g.n)) + '</small></div>' +
      '<div class="sx-acts"><button type="button" id="sxGiShare">' + ic('share') + '<span class="fit">' + esc(t('invite')) + '</span></button><button type="button" id="sxGiCopy">' + ic('link') + '<span class="fit">' + esc(t('copyLink')) + '</span></button><button type="button" id="sxGiAdd">' + ic('uadd') + '<span class="fit">' + esc(t('addMem')) + '</span></button></div>' +
      (g.link ? '<p class="sx-h"><span class="fit">' + esc(t('inviteLink')) + '</span></p><div class="sx-card sx-linkc"><span class="sx-idi">' + ic('link') + '</span><span class="sx-ell sx-lk">' + esc(String(g.link).replace(/^https:\/\//, '')) + '</span><button type="button" class="sx-ib" id="sxGiCopy2" aria-label="' + esc(t('copy')) + '">' + ic('copy') + '</button></div>' : '') +
      '<form class="sx-add" id="sxGiInv" autocomplete="off"><input id="sxGiId" maxlength="80" inputmode="email" spellcheck="false" autocapitalize="off" placeholder="' + esc(x.invPh || 'ID (R…) / e-mail') + '"><button type="submit" class="sx-btn"><b class="fit">' + esc(x.invGo || t('invite')) + '</b></button></form>' +
      '<p class="sx-h"><span class="fit">' + esc(t('members') + ' · ' + g.n) + '</span></p><div class="sx-rows">' + (g.members || []).map(function (m) {
        return '<div class="sx-row sx-mem">' + avatar({ name: m.name, ph: m.ph }) + '<span class="sx-rm"><b class="sx-nm sx-ell">' + esc(m.name) + '</b><span class="sx-pv sx-ell">' + esc(m.id) + '</span></span>' +
          (m.owner ? '<em class="sx-tag">' + esc(t('admin')) + '</em>' : '') + (g.owner && !m.owner ? '<button type="button" class="sx-btn sm ghost" data-kick="' + esc(m.id) + '" data-n="' + esc(m.name) + '"><b class="fit">' + esc(t('kick')) + '</b></button>' : '') + '</div>';
      }).join('') + '</div>' +
      (g.owner ? '<button type="button" class="sx-exit" id="sxGiDel">' + ic('trash') + '<span class="fit">' + esc(t('del')) + '</span></button>' : '<button type="button" class="sx-exit" id="sxGiExit">' + ic('exit') + '<span class="fit">' + esc(t('leave')) + '</span></button>') + '</div>');
    $('sxPBack').addEventListener('click', closePanel);
    if ($('sxGiPh')) $('sxGiPh').addEventListener('click', function () { photoSheet('group'); });
    $('sxGiShare').addEventListener('click', function () { shareLink(this); });
    $('sxGiCopy').addEventListener('click', function () { copyFx(this, g.link); });
    if ($('sxGiCopy2')) $('sxGiCopy2').addEventListener('click', function () { copyFx(this.closest('.sx-linkc'), g.link); });
    $('sxGiAdd').addEventListener('click', addMembers);
    $('sxGiInv').addEventListener('submit', async function (e) {
      e.preventDefault(); var v = $('sxGiId').value.trim(); if (v.length < 7) { toast(x.invNf || '?', 'err'); return; }
      var r = await call('gInvite', { gid: g.id, ids: [v] }); invDone(r); if (r && r.ok && r.n) $('sxGiId').value = '';
    });
    p.querySelectorAll('[data-kick]').forEach(function (b) {
      b.addEventListener('click', async function () {
        var n = b.getAttribute('data-n');
        if (!(await ask({ title: t('kickQ', { n: n }), ok: t('kick'), danger: 1, av: avatar({ name: n }, true) }))) return;
        await call('gKick', { gid: g.id, id: b.getAttribute('data-kick') }); await refreshConv(); groupInfo();
      });
    });
    var gav = avatar({ group: 1, emoji: g.emoji, photo: g.photo }, true);
    if ($('sxGiExit')) $('sxGiExit').addEventListener('click', async function () {
      if (!(await ask({ title: t('leaveQ', { n: g.name }), sub: t('leaveS'), ok: t('leave'), danger: 1, av: gav }))) return;
      var r = await call('gLeave', { gid: g.id });
      if (r && !r.ok && r.reason !== 'gGone') { toast(errMsg(r), 'err'); return; }
      await load(); closeConv(); seg = 'groups'; paintBody(true);
    });
    if ($('sxGiDel')) $('sxGiDel').addEventListener('click', async function () {
      if (!(await ask({ title: t('delQ', { n: g.name }), sub: t('delS'), ok: t('del'), danger: 1, av: gav }))) return;
      var r = await call('gDelete', { gid: g.id });
      if (!r || !r.ok) { toast(errMsg(r), 'err'); return; }
      await load(); closeConv(); seg = 'groups'; paintBody(true);
    });
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
    var p = panel('<header class="sx-hd"><button type="button" class="sx-ib sx-bk" id="sxPBack" aria-label="Back">' + ic('back') + '</button><b class="sx-ttl fit">' + esc(t('addMem')) + '</b></header>' +
      '<div class="sx-pbody">' + (soft('ginv') && x.invHint ? '<p class="sx-note"><span>' + esc(x.invHint) + '</span></p>' : '') +
      (fr.length ? '<div class="sx-srch">' + ic('search') + '<input id="sxAq" type="search" autocomplete="off" placeholder="' + esc(x.search || t('search')) + '"></div><div class="sx-rows">' + fr.map(function (f) {
        var isIn = !!inG[f.id];
        return '<button type="button" class="sx-row sx-pickr' + (isIn ? ' in' : '') + '" data-id="' + esc(f.id) + '" data-n="' + esc(String(f.name || '').toLowerCase()) + '"' + (isIn ? ' disabled' : '') + '>' + avatar({ name: f.name, on: f.on, ph: f.ph }) +
          '<span class="sx-rm"><b class="sx-nm sx-ell">' + esc(f.name) + '</b><span class="sx-pv sx-ell">' + esc(isIn ? (x.inGrp || '') : f.id) + '</span></span><i class="sx-ck">' + ic('check') + '</i></button>';
      }).join('') + '</div>' : empty(ic('uadd'), t('addMem'), x.pickNone || '', '<button type="button" class="sx-btn gold" id="sxAinv"><b class="fit">' + esc(t('invite')) + '</b></button>')) + '</div>' +
      (fr.length ? '<div class="sx-pfoot"><button type="button" class="sx-btn gold wide" id="sxAgo" disabled><b class="fit">' + esc(String(x.invN || '{n}').replace('{n}', 0)) + '</b></button></div>' : ''));
    $('sxPBack').addEventListener('click', groupInfo);
    if ($('sxAinv')) $('sxAinv').addEventListener('click', function () { shareLink(this); });
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

  /* ---------- v2905 (propriétaire) : LIEN D'INVITATION orolado.com/?g=… — aperçu comme WhatsApp ----------
     Logo, nom, membres, créateur, grand bouton « Rejoindre ». On n'entre JAMAIS dans un groupe sans toucher ce bouton
     (avant, un code gardé en mémoire faisait entrer le joueur tout seul, plus tard). Visiteur : « Inscris-toi pour
     rejoindre », et après l'inscription ou la connexion on revient sur ce même aperçu. Déjà membre : le groupe s'ouvre. */
  var PEND = 'oro_gjoin';
  async function joinPreview(tok) {
    tok = String(tok || '').toLowerCase().replace(/[^a-f0-9]/g, '');
    if (!tok) return;
    ss(PEND, null);
    if (!active || !$('liveModal').classList.contains('active')) {
      if (D6.Live && D6.Live.open && !$('liveModal').classList.contains('active')) D6.Live.open('grid');
      await open('groups', true);
    } else if (seg !== 'groups' && !conv) { seg = 'groups'; paintBody(true); }
    var p = panel('<header class="sx-hd"><button type="button" class="sx-ib sx-bk" id="sxPBack" aria-label="Back">' + ic('back') + '</button><b class="sx-ttl fit">' + esc(t('gInvT')) + '</b></header>' +
      '<div class="sx-pbody sx-joinb"><div class="sx-join" id="sxJoin"><span class="sx-av big sx-skelav"></span><i class="sx-skl"></i><i class="sx-skl s"></i></div></div>');
    p.setAttribute('data-join', tok);
    $('sxPBack').addEventListener('click', closePanel);
    fitAll(p);
    var r = await call('gPeek', { tok: tok });
    if (p.getAttribute('data-join') !== tok || p.hidden) return;
    var box = $('sxJoin'); if (!box) return;
    if (!r || !r.ok) {
      box.innerHTML = '<span class="sx-eico">' + ic('link') + '</span><b class="sx-jn">' + esc(t('gBadT')) + '</b><p>' + esc(t('gBadS')) + '</p><button type="button" class="sx-btn wide" id="sxJok"><b class="fit">' + esc(t('ok')) + '</b></button>';
      $('sxJok').addEventListener('click', closePanel);
      fitAll(box); return;
    }
    var g = r.g;
    if (g.member && !guest()) { closePanel(); await load(); if (active) { paintBody(); openConv('g:' + g.id); } return; }
    box.innerHTML = avatar({ group: 1, emoji: g.emoji, photo: g.photo }, true) + '<b class="sx-jn sx-ell">' + esc(g.name) + '</b><small class="fit">' + esc(t('group') + ' · ' + members(g.n)) + '</small>' +
      (g.admin ? '<span class="sx-jby">' + avatar({ name: g.admin, ph: g.adminPh }) + '<span class="fit">' + esc(t('joinBy', { a: g.admin })) + '</span></span>' : '') +
      (guest() ? '<button type="button" class="sx-btn gold wide" id="sxJgo"><b class="fit">' + esc(t('joinSign')) + '</b></button><button type="button" class="sx-lnk" id="sxJlog">' + esc(t('haveAcc')) + '</button>'
        : '<button type="button" class="sx-btn gold wide" id="sxJgo"><b class="fit">' + esc(t('join')) + '</b></button>') + '<p class="sx-msg" id="sxJm"></p>';
    var toAuth = function (mode) {
      ss(PEND, tok); // seulement pour REMONTRER l'aperçu après l'inscription — jamais pour entrer tout seul
      if (D6.App && D6.App.authReturn) D6.App.authReturn(function () { joinPreview(tok); });
      if (D6.Live && D6.Live.close) D6.Live.close();
      if (D6.App && D6.App.showAuth) D6.App.showAuth(mode);
    };
    $('sxJgo').addEventListener('click', async function () {
      if (guest()) { toAuth('register'); return; }
      this.disabled = true;
      var j = await call('gJoin', { tok: tok });
      if (j && j.login) { this.disabled = false; toAuth('login'); return; }
      if (!j || !j.ok) { this.disabled = false; $('sxJm').textContent = j && j.reason === 'gGone' ? t('gBadS') : errMsg(j); return; }
      closePanel(); await load(); seg = 'groups'; paintBody(); openConv('g:' + j.g.id);
    });
    if ($('sxJlog')) $('sxJlog').addEventListener('click', function () { toAuth('login'); });
    fitAll(box);
  }
  // après l'inscription / la connexion : l'aperçu revient (le joueur choisit lui-même de rejoindre)
  function pendAfterLogin() {
    var tok = ss(PEND); if (!tok || guest()) return;
    setTimeout(function () { if (!guest() && ss(PEND) === tok) joinPreview(tok); }, 600);
  }
  try { new MutationObserver(function () { if (!guest()) pendAfterLogin(); }).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] }); } catch (e) { /* ignore */ }

  /* =========================== OUVERTURE =========================== */
  // v2808 (propriétaire) : page ouverte depuis le menu en tuiles (« Plus ») → la flèche ‹ ramène à ce menu, un niveau à la fois
  var gridRet = false, directK = '';
  // 2026-10-20 (propriétaire) : le retour remonte d'UNE étape. Une page ouverte depuis une autre page de Social
  // (une carte d'Actualités → Mes amis, Mes groupes, Écrire à l'équipe…) ‹ ramène à cette page, pas au menu.
  var steps = [];
  function stepFrom() { if (conv) steps.push({ k: conv.k, seg: seg }); if (steps.length > 8) steps.shift(); }
  // une discussion ouverte depuis une liste elle-même ouverte depuis une autre page : la liste devient une étape
  function listConv(k, name, ph) { if (steps.length) { steps.push({ k: wide && conv ? conv.k : '', seg: seg }); if (steps.length > 8) steps.shift(); } return openConv(k, name, ph); }
  function stepBack() {
    var p = steps.pop(); if (!p) return false;
    seg = p.seg || seg; hint = '';
    if (p.k) { paintBody(true); openConv(p.k); } else { closeConv(); paintBody(true); }
    return true;
  }
  function toGrid() {
    gridRet = false; directK = ''; handoff = null; steps = [];
    clearInterval(tConv); clearInterval(tDuel); conv = null; closePanel(); closeSheet(); if (root) inConv(false);
    stop(); $('liveModal').classList.remove('sx-on');
    if (D6.Live && D6.Live.show) D6.Live.show('home');
  }
  function closeList() { if (stepBack()) return; if (gridRet) { toGrid(); return; } if (D6.Live) D6.Live.close(); }
  function backConv() { if (stepBack()) return; if (gridRet && conv && directK && conv.k === directK) { toGrid(); return; } closeConv(); }
  async function open(w, fromGrid) {
    if (!mount()) return false;
    handoff = null; on();
    var startK = w === 'chat' ? 'team' : w === 'news' ? 'news' : '';
    gridRet = !!fromGrid; directK = fromGrid ? startK : ''; steps = [];
    seg = w === 'groups' ? 'groups' : ['friends', 'duel', 'myid', 'record'].indexOf(w) >= 0 ? 'friends' : 'chats';
    hint = w === 'duel' ? t('duelHint') : '';
    q = ''; if (conv) { clearInterval(tConv); dropLocal(conv); } conv = null; inConv(false); closePanel(); closeSheet();
    paintList(); if (wide) paintConvEmpty();
    if (!guest() && D6.LiveSend && D6.LiveSend.status && !(D6.LiveSend.enabled && D6.LiveSend.enabled())) D6.LiveSend.status().then(function () { addMoneyBtn(); });
    if (startK) openConv(startK);
    await load();
    if (!active) return true;
    if ($('sxBody')) paintBody();
    listPoll();
    pendAfterLogin();
    prefetch();
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
    on(); seg = h.seg || 'chats'; paintList(); if (wide) paintConvEmpty(); listPoll();
    if (h.k) openConv(h.k);
    load().then(function () { if (active && $('sxBody')) paintBody(); });
    return true;
  }
  var rT = 0;
  window.addEventListener('resize', function () { if (active) keepBottom(); clearTimeout(rT); rT = setTimeout(function () { if (!active) return; wide = mq(); vv(); fitAll(root); }, 150); });
  var relang = function () { if (active) { paintList(true); if (conv) { var k = conv.k; openConv(k); } else if (wide) paintConvEmpty(); } };
  document.addEventListener('oro:livepack', relang);
  var lastLg = lg();
  document.addEventListener('oro:lang', function () { if (lg() === lastLg) return; lastLg = lg(); relang(); });
  // v2812 : état (onglet, discussion ouverte) pour revenir au même endroit après une actualisation (js/back.js)
  D6.Social2 = { open: open, openGroup: openGroup, stop: stop, hide: hide, back: back, active: function () { return active; }, refresh: refreshList, t: t, joinPreview: joinPreview, emblem: emblem,
    state: function () { return { seg: seg, k: conv ? conv.k : '', grid: gridRet }; },
    photoPrep: shrinkSq, err: errMsg, myPhoto: function (ph) { if (D.fr) D.fr.ph = ph; if (active && $('sxBody')) paintBody(); },
    openConv: function (k) { if (active && k) openConv(k); } };
})(window.D6 = window.D6 || {});
