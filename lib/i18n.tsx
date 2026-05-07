"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"

export type SupportedLanguage =
  | "en"
  | "zh"
  | "hi"
  | "es"
  | "fr"
  | "ar"
  | "bn"
  | "pt"
  | "ru"
  | "ur"

export const TOP_10_LANGUAGES: Array<{
  code: SupportedLanguage
  nativeLabel: string
  englishLabel: string
}> = [
  { code: "en", nativeLabel: "English", englishLabel: "English" },
  { code: "zh", nativeLabel: "中文", englishLabel: "Chinese" },
  { code: "hi", nativeLabel: "हिन्दी", englishLabel: "Hindi" },
  { code: "es", nativeLabel: "Español", englishLabel: "Spanish" },
  { code: "fr", nativeLabel: "Français", englishLabel: "French" },
  { code: "ar", nativeLabel: "العربية", englishLabel: "Arabic" },
  { code: "bn", nativeLabel: "বাংলা", englishLabel: "Bengali" },
  { code: "pt", nativeLabel: "Português", englishLabel: "Portuguese" },
  { code: "ru", nativeLabel: "Русский", englishLabel: "Russian" },
  { code: "ur", nativeLabel: "اردو", englishLabel: "Urdu" },
]

const STORAGE_KEY = "sparkd_language"

const TRANSLATIONS: Record<string, Record<SupportedLanguage, string>> = {
  "nav.searchPlaceholder": {
    en: "Search in Sparkd...",
    zh: "在 Sparkd 中搜索...",
    hi: "Sparkd में खोजें...",
    es: "Buscar en Sparkd...",
    fr: "Rechercher sur Sparkd...",
    ar: "ابحث في Sparkd...",
    bn: "Sparkd-এ খুঁজুন...",
    pt: "Buscar no Sparkd...",
    ru: "Искать в Sparkd...",
    ur: "Sparkd میں تلاش کریں...",
  },
  "nav.searchAria": {
    en: "Search",
    zh: "搜索",
    hi: "खोज",
    es: "Buscar",
    fr: "Rechercher",
    ar: "بحث",
    bn: "খুঁজুন",
    pt: "Buscar",
    ru: "Поиск",
    ur: "تلاش",
  },
  "nav.notifications": {
    en: "Notifications",
    zh: "通知",
    hi: "सूचनाएं",
    es: "Notificaciones",
    fr: "Notifications",
    ar: "الإشعارات",
    bn: "নোটিফিকেশন",
    pt: "Notificações",
    ru: "Уведомления",
    ur: "اطلاعات",
  },
  "nav.markAllRead": {
    en: "Mark all read",
    zh: "全部已读",
    hi: "सब पढ़ा हुआ",
    es: "Leer todo",
    fr: "Tout marquer comme lu",
    ar: "تحديد الكل كمقروء",
    bn: "সব পড়া হয়েছে",
    pt: "Marcar tudo como lido",
    ru: "Прочитать всё",
    ur: "سب کو پڑھا ہوا نشان زد کریں",
  },
  "nav.viewAll": {
    en: "View all",
    zh: "查看全部",
    hi: "सभी देखें",
    es: "Ver todas",
    fr: "Voir tout",
    ar: "عرض الكل",
    bn: "সব দেখুন",
    pt: "Ver todas",
    ru: "Смотреть все",
    ur: "سب دیکھیں",
  },
  "nav.noNotifications": {
    en: "No notifications",
    zh: "暂无通知",
    hi: "कोई सूचना नहीं",
    es: "Sin notificaciones",
    fr: "Aucune notification",
    ar: "لا توجد إشعارات",
    bn: "কোনো নোটিফিকেশন নেই",
    pt: "Sem notificações",
    ru: "Нет уведомлений",
    ur: "کوئی اطلاع نہیں",
  },
  "nav.myProfile": {
    en: "My profile",
    zh: "我的资料",
    hi: "मेरा प्रोफ़ाइल",
    es: "Mi perfil",
    fr: "Mon profil",
    ar: "ملفي الشخصي",
    bn: "আমার প্রোফাইল",
    pt: "Meu perfil",
    ru: "Мой профиль",
    ur: "میرا پروفائل",
  },
  "nav.saved": {
    en: "Saved",
    zh: "已保存",
    hi: "सहेजे गए",
    es: "Guardados",
    fr: "Enregistrés",
    ar: "المحفوظات",
    bn: "সংরক্ষিত",
    pt: "Salvos",
    ru: "Сохраненные",
    ur: "محفوظ شدہ",
  },
  "nav.analytics": {
    en: "Analytics",
    zh: "分析",
    hi: "विश्लेषण",
    es: "Analíticas",
    fr: "Analytique",
    ar: "التحليلات",
    bn: "অ্যানালিটিক্স",
    pt: "Analíticas",
    ru: "Аналитика",
    ur: "تجزیات",
  },
  "nav.groups": {
    en: "Groups",
    zh: "群组",
    hi: "समूह",
    es: "Grupos",
    fr: "Groupes",
    ar: "المجموعات",
    bn: "গ্রুপ",
    pt: "Grupos",
    ru: "Группы",
    ur: "گروپس",
  },
  "nav.events": {
    en: "Events",
    zh: "活动",
    hi: "इवेंट्स",
    es: "Eventos",
    fr: "Événements",
    ar: "الفعاليات",
    bn: "ইভেন্ট",
    pt: "Eventos",
    ru: "События",
    ur: "ایونٹس",
  },
  "nav.settings": {
    en: "Settings",
    zh: "设置",
    hi: "सेटिंग्स",
    es: "Configuración",
    fr: "Paramètres",
    ar: "الإعدادات",
    bn: "সেটিংস",
    pt: "Configurações",
    ru: "Настройки",
    ur: "ترتیبات",
  },
  "nav.premium": {
    en: "Premium",
    zh: "高级版",
    hi: "प्रीमियम",
    es: "Premium",
    fr: "Premium",
    ar: "بريميوم",
    bn: "প্রিমিয়াম",
    pt: "Premium",
    ru: "Премиум",
    ur: "پریمیم",
  },
  "nav.logout": {
    en: "Log out",
    zh: "退出登录",
    hi: "लॉग आउट",
    es: "Cerrar sesión",
    fr: "Se déconnecter",
    ar: "تسجيل الخروج",
    bn: "লগ আউট",
    pt: "Encerrar sessão",
    ru: "Выйти",
    ur: "لاگ آؤٹ",
  },
  "sidebar.feed": {
    en: "Feed", zh: "动态", hi: "फ़ीड", es: "Feed", fr: "Fil", ar: "الخلاصة", bn: "ফিড", pt: "Feed", ru: "Лента", ur: "فیڈ",
  },
  "sidebar.swipes": {
    en: "Swipes", zh: "滑动", hi: "स्वाइप्स", es: "Swipes", fr: "Swipes", ar: "السحب", bn: "সুইপস", pt: "Swipes", ru: "Свайпы", ur: "سوائپس",
  },
  "sidebar.events": {
    en: "Events", zh: "活动", hi: "इवेंट्स", es: "Eventos", fr: "Événements", ar: "الفعاليات", bn: "ইভেন্ট", pt: "Eventos", ru: "События", ur: "ایونٹس",
  },
  "sidebar.fastDate": {
    en: "Fast Date", zh: "快速约会", hi: "फास्ट डेट", es: "Fast Date", fr: "Date rapide", ar: "موعد سريع", bn: "ফাস্ট ডেট", pt: "Fast Date", ru: "Быстрое свидание", ur: "فاسٹ ڈیٹ",
  },
  "sidebar.likes": {
    en: "Likes", zh: "点赞", hi: "लाइक्स", es: "Likes", fr: "Likes", ar: "الإعجابات", bn: "লাইকস", pt: "Curtidas", ru: "Лайки", ur: "لائکس",
  },
  "sidebar.matches": {
    en: "Matches", zh: "匹配", hi: "मैचेस", es: "Matches", fr: "Matches", ar: "المطابقات", bn: "ম্যাচ", pt: "Matches", ru: "Совпадения", ur: "میچز",
  },
  "sidebar.chat": {
    en: "Chat", zh: "聊天", hi: "चैट", es: "Chat", fr: "Chat", ar: "الدردشة", bn: "চ্যাট", pt: "Chat", ru: "Чат", ur: "چیٹ",
  },
  "sidebar.groups": {
    en: "Groups", zh: "群组", hi: "समूह", es: "Grupos", fr: "Groupes", ar: "المجموعات", bn: "গ্রুপ", pt: "Grupos", ru: "Группы", ur: "گروپس",
  },
  "sidebar.trello": {
    en: "Trello", zh: "Trello", hi: "Trello", es: "Trello", fr: "Trello", ar: "Trello", bn: "Trello", pt: "Trello", ru: "Trello", ur: "Trello",
  },
  "sidebar.profile": {
    en: "Profile", zh: "资料", hi: "प्रोफ़ाइल", es: "Perfil", fr: "Profil", ar: "الملف الشخصي", bn: "প্রোফাইল", pt: "Perfil", ru: "Профиль", ur: "پروفائل",
  },
  "sidebar.premium": {
    en: "Premium", zh: "高级版", hi: "प्रीमियम", es: "Premium", fr: "Premium", ar: "بريميوم", bn: "প্রিমিয়াম", pt: "Premium", ru: "Премиум", ur: "پریمیم",
  },
  "sidebar.stories": {
    en: "Stories", zh: "动态", hi: "स्टोरीज़", es: "Historias", fr: "Stories", ar: "القصص", bn: "স্টোরিজ", pt: "Stories", ru: "Истории", ur: "اسٹوریز",
  },
  "sidebar.activity": {
    en: "Activity", zh: "活动", hi: "गतिविधि", es: "Actividad", fr: "Activité", ar: "النشاط", bn: "কার্যকলাপ", pt: "Atividade", ru: "Активность", ur: "سرگرمی",
  },
  "sidebar.discover": {
    en: "Discover", zh: "发现", hi: "खोजें", es: "Descubrir", fr: "Découvrir", ar: "اكتشف", bn: "আবিষ্কার", pt: "Descobrir", ru: "Открыть", ur: "دریافت کریں",
  },
  "sidebar.fastdate": {
    en: "Fast Date", zh: "快速约会", hi: "फास्ट डेट", es: "Cita Rápida", fr: "Date rapide", ar: "موعد سريع", bn: "ফাস্ট ডেট", pt: "Encontro Rápido", ru: "Быстрое свидание", ur: "فاسٹ ڈیٹ",
  },
  "sidebar.dateCards": {
    en: "Date Cards", zh: "约会卡", hi: "डेट कार्ड्स", es: "Tarjetas de Cita", fr: "Cartes de date", ar: "بطاقات المواعيد", bn: "ডেট কার্ডস", pt: "Cartões de Encontro", ru: "Карточки свиданий", ur: "ڈیٹ کارڈز",
  },
  "sidebar.adminPanel": {
    en: "Admin Panel", zh: "管理面板", hi: "एडमिन पैनल", es: "Panel Admin", fr: "Panneau admin", ar: "لوحة الإدارة", bn: "অ্যাডমিন প্যানেল", pt: "Painel Admin", ru: "Админ-панель", ur: "ایڈمن پینل",
  },
  "sidebar.managerPanel": {
    en: "Manager Panel", zh: "管理者面板", hi: "मैनेजर पैनल", es: "Panel Manager", fr: "Panneau manager", ar: "لوحة المدير", bn: "ম্যানেজার প্যানেল", pt: "Painel Manager", ru: "Панель менеджера", ur: "منیجر پینل",
  },
  "sidebar.activityFeed": {
    en: "Activities", zh: "活动", hi: "गतिविधियां", es: "Actividades", fr: "Activités", ar: "الأنشطة", bn: "কার্যক্রম", pt: "Atividades", ru: "Активности", ur: "سرگرمیاں",
  },
  "bottomNav.feed": {
    en: "Feed", zh: "动态", hi: "फ़ीड", es: "Feed", fr: "Fil", ar: "الخلاصة", bn: "ফিড", pt: "Feed", ru: "Лента", ur: "فیڈ",
  },
  "bottomNav.groups": {
    en: "Groups", zh: "群组", hi: "समूह", es: "Grupos", fr: "Groupes", ar: "المجموعات", bn: "গ্রুপ", pt: "Grupos", ru: "Группы", ur: "گروپس",
  },
  "bottomNav.swipes": {
    en: "Swipes", zh: "滑动", hi: "स्वाइप्स", es: "Swipes", fr: "Swipes", ar: "السحب", bn: "সুইপস", pt: "Swipes", ru: "Свайпы", ur: "سوائپس",
  },
  "bottomNav.events": {
    en: "Events", zh: "活动", hi: "इवेंट्स", es: "Eventos", fr: "Événements", ar: "الفعاليات", bn: "ইভেন্ট", pt: "Eventos", ru: "События", ur: "ایونٹس",
  },
  "bottomNav.dates": {
    en: "Dates", zh: "约会", hi: "डेट्स", es: "Citas", fr: "Rendez-vous", ar: "المواعيد", bn: "ডেটস", pt: "Encontros", ru: "Свидания", ur: "ڈیٹس",
  },
  "bottomNav.chat": {
    en: "Chat", zh: "聊天", hi: "चैट", es: "Chat", fr: "Chat", ar: "الدردشة", bn: "চ্যাট", pt: "Chat", ru: "Чат", ur: "چیٹ",
  },
  "bottomNav.trello": {
    en: "Trello", zh: "Trello", hi: "Trello", es: "Trello", fr: "Trello", ar: "Trello", bn: "Trello", pt: "Trello", ru: "Trello", ur: "Trello",
  },
  "bottomNav.profile": {
    en: "Profile", zh: "资料", hi: "प्रोफ़ाइल", es: "Perfil", fr: "Profil", ar: "الملف الشخصي", bn: "প্রোফাইল", pt: "Perfil", ru: "Профиль", ur: "پروفائل",
  },
  "bottomNav.stories": {
    en: "Stories", zh: "动态", hi: "स्टोरीज़", es: "Historias", fr: "Stories", ar: "القصص", bn: "স্টোরিজ", pt: "Stories", ru: "Истории", ur: "اسٹوریز",
  },
  "bottomNav.discover": {
    en: "Discover", zh: "发现", hi: "खोजें", es: "Descubrir", fr: "Découvrir", ar: "اكتشف", bn: "আবিষ্কার", pt: "Descobrir", ru: "Открыть", ur: "دریافت کریں",
  },
  "bottomNav.matches": {
    en: "Matches", zh: "匹配", hi: "मैचेस", es: "Matches", fr: "Matches", ar: "المطابقات", bn: "ম্যাচ", pt: "Matches", ru: "Совпадения", ur: "میچز",
  },
  "bottomNav.likes": {
    en: "Likes", zh: "点赞", hi: "लाइक्स", es: "Likes", fr: "Likes", ar: "الإعجابات", bn: "লাইকস", pt: "Curtidas", ru: "Лайки", ur: "لائکس",
  },
  "bottomNav.fastdate": {
    en: "Fast Date", zh: "快速约会", hi: "फास्ट डेट", es: "Cita Rápida", fr: "Date rapide", ar: "موعد سريع", bn: "ফাস্ট ডেট", pt: "Encontro Rápido", ru: "Быстрое свидание", ur: "فاسٹ ڈیٹ",
  },
  "storiesBar.yourStory": {
    en: "Your story", zh: "你的动态", hi: "आपकी स्टोरी", es: "Tu historia", fr: "Votre story", ar: "قصتك", bn: "আপনার স্টোরি", pt: "Seu story", ru: "Ваша история", ur: "آپ کی اسٹوری",
  },
  "groups.feedOption.global": {
    en: "Global", zh: "全局", hi: "वैश्विक", es: "Global", fr: "Global", ar: "عالمي", bn: "গ্লোবাল", pt: "Global", ru: "Глобальный", ur: "گلوبل",
  },
  "groups.feedOption.local": {
    en: "Local", zh: "本地", hi: "स्थानीय", es: "Local", fr: "Local", ar: "محلي", bn: "লোকাল", pt: "Local", ru: "Локальный", ur: "لوکل",
  },
  "groups.feedOption.following": {
    en: "Following", zh: "关注中", hi: "फॉलोइंग", es: "Siguiendo", fr: "Abonnements", ar: "المتابَعون", bn: "ফলো করা", pt: "Seguindo", ru: "Подписки", ur: "فالوئنگ",
  },
  "groups.feedOption.groupsOnly": {
    en: "Groups only", zh: "仅群组", hi: "केवल समूह", es: "Solo grupos", fr: "Groupes seulement", ar: "المجموعات فقط", bn: "শুধু গ্রুপ", pt: "Somente grupos", ru: "Только группы", ur: "صرف گروپس",
  },
  "common.global": {
    en: "Global", zh: "全局", hi: "वैश्विक", es: "Global", fr: "Global", ar: "عالمي", bn: "গ্লোবাল", pt: "Global", ru: "Глобальный", ur: "گلوبل",
  },
  "common.local": {
    en: "Local", zh: "本地", hi: "स्थानीय", es: "Local", fr: "Local", ar: "محلي", bn: "লোকাল", pt: "Local", ru: "Локальный", ur: "لوکل",
  },
  "common.following": {
    en: "Following", zh: "关注中", hi: "फॉलोइंग", es: "Siguiendo", fr: "Abonnements", ar: "المتابَعون", bn: "ফলো করা", pt: "Seguindo", ru: "Подписки", ur: "فالوئنگ",
  },
  "common.back": {
    en: "Back", zh: "返回", hi: "पीछे", es: "Atrás", fr: "Retour", ar: "رجوع", bn: "পিছনে", pt: "Voltar", ru: "Назад", ur: "واپس",
  },
  "common.next": {
    en: "Next", zh: "下一步", hi: "अगला", es: "Siguiente", fr: "Suivant", ar: "التالي", bn: "পরবর্তী", pt: "Próximo", ru: "Далее", ur: "اگلا",
  },
  "common.continue": {
    en: "Continue", zh: "继续", hi: "जारी रखें", es: "Continuar", fr: "Continuer", ar: "متابعة", bn: "চালিয়ে যান", pt: "Continuar", ru: "Продолжить", ur: "جاری رکھیں",
  },
  "common.cancel": {
    en: "Cancel", zh: "取消", hi: "रद्द करें", es: "Cancelar", fr: "Annuler", ar: "إلغاء", bn: "বাতিল", pt: "Cancelar", ru: "Отмена", ur: "منسوخ",
  },
  "common.save": {
    en: "Save", zh: "保存", hi: "सहेजें", es: "Guardar", fr: "Enregistrer", ar: "حفظ", bn: "সংরক্ষণ", pt: "Salvar", ru: "Сохранить", ur: "محفوظ کریں",
  },
  "common.edit": {
    en: "Edit", zh: "编辑", hi: "संपादित करें", es: "Editar", fr: "Modifier", ar: "تعديل", bn: "এডিট", pt: "Editar", ru: "Редактировать", ur: "ترمیم کریں",
  },
  "common.delete": {
    en: "Delete", zh: "删除", hi: "हटाएं", es: "Eliminar", fr: "Supprimer", ar: "حذف", bn: "মুছুন", pt: "Excluir", ru: "Удалить", ur: "حذف کریں",
  },
  "common.members": {
    en: "Members", zh: "成员", hi: "सदस्य", es: "Miembros", fr: "Membres", ar: "الأعضاء", bn: "সদস্য", pt: "Membros", ru: "Участники", ur: "اراکین",
  },
  "common.requests": {
    en: "Requests", zh: "请求", hi: "अनुरोध", es: "Solicitudes", fr: "Demandes", ar: "الطلبات", bn: "অনুরোধ", pt: "Solicitações", ru: "Запросы", ur: "درخواستیں",
  },
  "common.settings": {
    en: "Settings", zh: "设置", hi: "सेटिंग्स", es: "Ajustes", fr: "Paramètres", ar: "الإعدادات", bn: "সেটিংস", pt: "Configurações", ru: "Настройки", ur: "ترتیبات",
  },
  "common.send": {
    en: "Send", zh: "发送", hi: "भेजें", es: "Enviar", fr: "Envoyer", ar: "إرسال", bn: "পাঠান", pt: "Enviar", ru: "Отправить", ur: "بھیجیں",
  },
  "common.copy": {
    en: "Copy", zh: "复制", hi: "कॉपी", es: "Copiar", fr: "Copier", ar: "نسخ", bn: "কপি", pt: "Copiar", ru: "Копировать", ur: "کاپی",
  },
  "common.disable": {
    en: "Disable", zh: "禁用", hi: "अक्षम", es: "Desactivar", fr: "Désactiver", ar: "تعطيل", bn: "নিষ্ক্রিয়", pt: "Desativar", ru: "Отключить", ur: "غیر فعال",
  },
  "common.createLink": {
    en: "Create link", zh: "创建链接", hi: "लिंक बनाएं", es: "Crear link", fr: "Créer un lien", ar: "إنشاء رابط", bn: "লিংক তৈরি", pt: "Criar link", ru: "Создать ссылку", ur: "لنک بنائیں",
  },
  "common.view": {
    en: "View", zh: "查看", hi: "देखें", es: "Ver", fr: "Voir", ar: "عرض", bn: "দেখুন", pt: "Ver", ru: "Просмотр", ur: "دیکھیں",
  },
  "common.reload": {
    en: "Reload", zh: "重新加载", hi: "रीलोड", es: "Recargar", fr: "Recharger", ar: "إعادة التحميل", bn: "রিলোড", pt: "Recarregar", ru: "Обновить", ur: "دوبارہ لوڈ",
  },
  "swipes.title": {
    en: "Swipes", zh: "滑动", hi: "स्वाइप्स", es: "Swipes", fr: "Swipes", ar: "السحب", bn: "সুইপস", pt: "Swipes", ru: "Свайпы", ur: "سوائپس",
  },
  "swipes.today": {
    en: "today", zh: "今天", hi: "आज", es: "hoy", fr: "aujourd'hui", ar: "اليوم", bn: "আজ", pt: "hoje", ru: "сегодня", ur: "آج",
  },
  "swipes.tipArrows": {
    en: "Tip: use keyboard ← / →", zh: "提示：使用键盘 ← / →", hi: "टिप: कीबोर्ड ← / → इस्तेमाल करें", es: "Tip: usa ← / → en teclado", fr: "Astuce : utilise ← / → au clavier", ar: "نصيحة: استخدم ← / → من لوحة المفاتيح", bn: "টিপ: কিবোর্ড ← / → ব্যবহার করুন", pt: "Dica: use ← / → no teclado", ru: "Совет: используйте ← / → на клавиатуре", ur: "ٹپ: کی بورڈ ← / → استعمال کریں",
  },
  "swipes.daily": {
    en: "Today's swipes", zh: "今日滑动", hi: "आज के स्वाइप्स", es: "Swipes hoy", fr: "Swipes du jour", ar: "سحبات اليوم", bn: "আজকের সুইপস", pt: "Swipes de hoje", ru: "Свайпы за сегодня", ur: "آج کے سوائپس",
  },
  "swipes.getPremiumUnlimited": {
    en: "Get unlimited swipes with Premium", zh: "升级 Premium 获得无限滑动", hi: "Premium के साथ अनलिमिटेड स्वाइप्स पाएं", es: "Obtén swipes ilimitados con Premium", fr: "Obtiens des swipes illimités avec Premium", ar: "احصل على سحبات غير محدودة مع Premium", bn: "Premium-এর সাথে আনলিমিটেড সুইপস পান", pt: "Tenha swipes ilimitados com Premium", ru: "Получите безлимитные свайпы с Premium", ur: "Premium کے ساتھ لامحدود سوائپس حاصل کریں",
  },
  "swipes.noneToday": {
    en: "No swipes left today", zh: "今天没有可用滑动了", hi: "आज के लिए स्वाइप खत्म", es: "Sin swipes hoy", fr: "Plus de swipes aujourd'hui", ar: "لا توجد سحبات متبقية اليوم", bn: "আজ আর সুইপ নেই", pt: "Sem swipes hoje", ru: "На сегодня свайпы закончились", ur: "آج کے لیے سوائپس ختم",
  },
  "swipes.limitMessage": {
    en: "Limit of 30 per day. Upgrade to Premium or come back tomorrow.", zh: "每天上限 30 次。升级 Premium 或明天再来。", hi: "रोज़ाना 30 की सीमा। Premium लें या कल फिर आएं।", es: "Límite de 30 al día. Mejora a Premium o vuelve mañana.", fr: "Limite de 30 par jour. Passe à Premium ou reviens demain.", ar: "الحد 30 يوميًا. قم بالترقية إلى Premium أو عُد غدًا.", bn: "প্রতিদিন ৩০ সীমা। Premium নিন বা কাল আবার আসুন।", pt: "Limite de 30 por dia. Faça upgrade para Premium ou volte amanhã.", ru: "Лимит 30 в день. Обновитесь до Premium или возвращайтесь завтра.", ur: "روزانہ حد 30 ہے۔ Premium لیں یا کل واپس آئیں۔",
  },
  "swipes.seekingPeople": {
    en: "Looking for people...", zh: "正在寻找用户...", hi: "लोग खोज रहे हैं...", es: "Buscando personas...", fr: "Recherche de profils...", ar: "جارٍ البحث عن أشخاص...", bn: "মানুষ খোঁজা হচ্ছে...", pt: "Buscando pessoas...", ru: "Ищем людей...", ur: "لوگ تلاش کیے جا رہے ہیں...",
  },
  "swipes.preparingMatches": {
    en: "Preparing your best matches", zh: "正在准备最佳匹配", hi: "आपके बेहतरीन मैच तैयार हो रहे हैं", es: "Preparando tus mejores matches", fr: "Préparation de tes meilleurs matchs", ar: "جارٍ تجهيز أفضل المطابقات لك", bn: "আপনার সেরা ম্যাচ প্রস্তুত হচ্ছে", pt: "Preparando seus melhores matches", ru: "Подбираем лучшие совпадения", ur: "آپ کے بہترین میچز تیار کیے جا رہے ہیں",
  },
  "swipes.searchingMore": {
    en: "Looking for more profiles...", zh: "正在寻找更多资料...", hi: "और प्रोफाइल खोज रहे हैं...", es: "Buscando más perfiles...", fr: "Recherche de plus de profils...", ar: "جارٍ البحث عن المزيد من الملفات...", bn: "আরও প্রোফাইল খোঁজা হচ্ছে...", pt: "Buscando mais perfis...", ru: "Ищем больше профилей...", ur: "مزید پروفائلز تلاش کیے جا رہے ہیں...",
  },
  "swipes.justMoment": {
    en: "This will only take a moment", zh: "只需片刻", hi: "बस एक पल लगेगा", es: "Esto toma solo un momento", fr: "Cela prend juste un instant", ar: "سيستغرق هذا لحظة فقط", bn: "এতে মাত্র এক মুহূর্ত লাগবে", pt: "Isso leva só um instante", ru: "Это займет всего момент", ur: "یہ صرف ایک لمحہ لے گا",
  },
  "swipes.seenAll": {
    en: "You've seen everyone!", zh: "你已经看完所有人了！", hi: "आपने सब देख लिया!", es: "¡Has visto a todos!", fr: "Tu as tout vu !", ar: "لقد رأيت الجميع!", bn: "আপনি সবাইকে দেখে ফেলেছেন!", pt: "Você já viu todo mundo!", ru: "Вы всех посмотрели!", ur: "آپ سب کو دیکھ چکے ہیں!",
  },
  "swipes.comeBackLater": {
    en: "Come back later to see new people", zh: "稍后再来看新用户", hi: "नए लोगों को देखने के लिए बाद में वापस आएं", es: "Vuelve más tarde para ver nuevas personas", fr: "Reviens plus tard pour voir de nouvelles personnes", ar: "عُد لاحقًا لرؤية أشخاص جدد", bn: "নতুন মানুষ দেখতে পরে আবার আসুন", pt: "Volte mais tarde para ver novas pessoas", ru: "Возвращайтесь позже, чтобы увидеть новых людей", ur: "نئے لوگوں کو دیکھنے کے لیے بعد میں واپس آئیں",
  },
  "swipes.reload": {
    en: "Reload", zh: "重新加载", hi: "रीलोड", es: "Recargar", fr: "Recharger", ar: "إعادة التحميل", bn: "রিলোড", pt: "Recarregar", ru: "Обновить", ur: "دوبارہ لوڈ",
  },
  "swipes.pass": {
    en: "Pass", zh: "跳过", hi: "पास", es: "Pasar", fr: "Passer", ar: "تخطي", bn: "পাস", pt: "Passar", ru: "Пропустить", ur: "پاس",
  },
  "swipes.like": {
    en: "Like", zh: "喜欢", hi: "लाइक", es: "Like", fr: "Like", ar: "إعجاب", bn: "লাইক", pt: "Like", ru: "Лайк", ur: "لائک",
  },
  "swipes.superLikePremium": {
    en: "Super Like (Premium)", zh: "超级喜欢（Premium）", hi: "सुपर लाइक (Premium)", es: "Super Like (Premium)", fr: "Super Like (Premium)", ar: "إعجاب فائق (Premium)", bn: "সুপার লাইক (Premium)", pt: "Super Like (Premium)", ru: "Суперлайк (Premium)", ur: "سپر لائک (Premium)",
  },
  "swipes.swipeButtonsHint": {
    en: "Swipe to pass/like or use the buttons", zh: "滑动跳过/喜欢，或使用按钮", hi: "पास/लाइक करने के लिए स्वाइप करें या बटन इस्तेमाल करें", es: "Desliza para pasar/like o usa los botones", fr: "Swipe pour passer/liker ou utilise les boutons", ar: "اسحب للتخطي/الإعجاب أو استخدم الأزرار", bn: "পাস/লাইক করতে সুইপ করুন বা বোতাম ব্যবহার করুন", pt: "Deslize para passar/like ou use os botões", ru: "Свайпайте для пропуска/лайка или используйте кнопки", ur: "پاس/لائک کے لیے سوائپ کریں یا بٹن استعمال کریں",
  },
  "match.title": {
    en: "It's a Match!", zh: "配对成功！", hi: "मैच हो गया!", es: "¡Es un Match!", fr: "C'est un Match !", ar: "إنه تطابق!", bn: "ম্যাচ হয়েছে!", pt: "Deu Match!", ru: "Это матч!", ur: "یہ میچ ہے!",
  },
  "match.youAndLike": {
    en: "You and {name} like each other", zh: "你和{name}互相喜欢", hi: "आप और {name} एक-दूसरे को पसंद करते हैं", es: "Tú y {name} se gustan", fr: "Toi et {name} vous vous plaisez", ar: "أنت و{name} معجبان ببعضكما", bn: "আপনি এবং {name} একে অন্যকে পছন্দ করেন", pt: "Você e {name} curtiram um ao outro", ru: "Вы и {name} нравитесь друг другу", ur: "آپ اور {name} ایک دوسرے کو پسند کرتے ہیں",
  },
  "match.sendMessage": {
    en: "Send message", zh: "发送消息", hi: "संदेश भेजें", es: "Enviar mensaje", fr: "Envoyer un message", ar: "إرسال رسالة", bn: "মেসেজ পাঠান", pt: "Enviar mensagem", ru: "Отправить сообщение", ur: "پیغام بھیجیں",
  },
  "match.keepSwiping": {
    en: "Keep swiping", zh: "继续滑动", hi: "स्वाइप जारी रखें", es: "Seguir deslizando", fr: "Continuer à swiper", ar: "استمر في السحب", bn: "সুইপ চালিয়ে যান", pt: "Continuar deslizando", ru: "Продолжить свайпать", ur: "سوائپ جاری رکھیں",
  },
  "match.openChatError": {
    en: "Error opening chat", zh: "打开聊天失败", hi: "चैट खोलने में त्रुटि", es: "Error al abrir el chat", fr: "Erreur lors de l'ouverture du chat", ar: "خطأ في فتح الدردشة", bn: "চ্যাট খুলতে সমস্যা", pt: "Erro ao abrir chat", ru: "Ошибка открытия чата", ur: "چیٹ کھولنے میں خرابی",
  },
  "swipeCard.compatVeryHigh": {
    en: "Very high", zh: "非常高", hi: "बहुत उच्च", es: "Muy alta", fr: "Très élevée", ar: "مرتفعة جدًا", bn: "খুব বেশি", pt: "Muito alta", ru: "Очень высокая", ur: "بہت زیادہ",
  },
  "swipeCard.compatHigh": {
    en: "High", zh: "高", hi: "उच्च", es: "Alta", fr: "Élevée", ar: "مرتفعة", bn: "উচ্চ", pt: "Alta", ru: "Высокая", ur: "اعلی",
  },
  "swipeCard.compatMedium": {
    en: "Medium", zh: "中等", hi: "मध्यम", es: "Media", fr: "Moyenne", ar: "متوسطة", bn: "মাঝারি", pt: "Média", ru: "Средняя", ur: "درمیانی",
  },
  "swipeCard.compatLow": {
    en: "Low", zh: "低", hi: "कम", es: "Baja", fr: "Faible", ar: "منخفضة", bn: "কম", pt: "Baixa", ru: "Низкая", ur: "کم",
  },
  "swipeCard.matchWord": {
    en: "match", zh: "匹配", hi: "मैच", es: "match", fr: "match", ar: "تطابق", bn: "ম্যাচ", pt: "match", ru: "матч", ur: "میچ",
  },
  "swipeCard.vibeTopProfile": {
    en: "Top profile", zh: "顶级资料", hi: "टॉप प्रोफ़ाइल", es: "Top profile", fr: "Top profil", ar: "ملف مميز", bn: "টপ প্রোফাইল", pt: "Perfil top", ru: "Топ-профиль", ur: "ٹاپ پروفائل",
  },
  "swipeCard.vibeVerySocial": {
    en: "Very social", zh: "非常社交", hi: "बहुत मिलनसार", es: "Súper social", fr: "Très social", ar: "اجتماعي جدًا", bn: "খুব সামাজিক", pt: "Super social", ru: "Очень общительный", ur: "بہت سماجی",
  },
  "swipeCard.vibeInteresting": {
    en: "Interesting", zh: "有趣", hi: "दिलचस्प", es: "Interesante", fr: "Intéressant", ar: "مثير للاهتمام", bn: "আকর্ষণীয়", pt: "Interessante", ru: "Интересный", ur: "دلچسپ",
  },
  "swipeCard.vibeTalkative": {
    en: "Talkative", zh: "健谈", hi: "बातूनी", es: "Conversador", fr: "Bavard", ar: "متحدث", bn: "আড্ডাবাজ", pt: "Comunicativo", ru: "Разговорчивый", ur: "باتونی",
  },
  "swipeCard.vibeUnknown": {
    en: "To discover", zh: "待发现", hi: "जानना बाकी", es: "Por descubrir", fr: "À découvrir", ar: "قيد الاكتشاف", bn: "জানার বাকি", pt: "Por descobrir", ru: "Нужно узнать", ur: "ابھی دریافت ہونا ہے",
  },
  "swipeCard.yearsOld": {
    en: "years", zh: "岁", hi: "साल", es: "años", fr: "ans", ar: "سنة", bn: "বছর", pt: "anos", ru: "лет", ur: "سال",
  },
  "swipeCard.premium": {
    en: "Premium", zh: "高级版", hi: "प्रीमियम", es: "Premium", fr: "Premium", ar: "بريميوم", bn: "প্রিমিয়াম", pt: "Premium", ru: "Премиум", ur: "پریمیم",
  },
  "swipeCard.vibe": {
    en: "Vibe", zh: "氛围", hi: "वाइब", es: "Vibe", fr: "Vibe", ar: "الطاقة", bn: "ভাইব", pt: "Vibe", ru: "Вайб", ur: "وائب",
  },
  "swipeCard.reputation": {
    en: "Reputation", zh: "信誉", hi: "प्रतिष्ठा", es: "Reputación", fr: "Réputation", ar: "السمعة", bn: "রেপুটেশন", pt: "Reputação", ru: "Репутация", ur: "ساکھ",
  },
  "swipeCard.seeMoreDetails": {
    en: "See more details", zh: "查看更多详情", hi: "और विवरण देखें", es: "Ver más detalles", fr: "Voir plus de détails", ar: "عرض المزيد من التفاصيل", bn: "আরও বিস্তারিত দেখুন", pt: "Ver mais detalhes", ru: "Подробнее", ur: "مزید تفصیل دیکھیں",
  },
  "swipeCard.hideDetails": {
    en: "Hide details", zh: "隐藏详情", hi: "विवरण छिपाएं", es: "Ocultar detalles", fr: "Masquer les détails", ar: "إخفاء التفاصيل", bn: "বিস্তারিত লুকান", pt: "Ocultar detalhes", ru: "Скрыть детали", ur: "تفصیل چھپائیں",
  },
  "swipeCard.voiceNote": {
    en: "Voice note", zh: "语音介绍", hi: "वॉइस नोट", es: "Nota de voz", fr: "Note vocale", ar: "ملاحظة صوتية", bn: "ভয়েস নোট", pt: "Nota de voz", ru: "Голосовая заметка", ur: "وائس نوٹ",
  },
  "swipeCard.seeFullProfile": {
    en: "See full profile", zh: "查看完整资料", hi: "पूरा प्रोफ़ाइल देखें", es: "Ver perfil completo", fr: "Voir le profil complet", ar: "عرض الملف الكامل", bn: "পূর্ণ প্রোফাইল দেখুন", pt: "Ver perfil completo", ru: "Полный профиль", ur: "مکمل پروفائل دیکھیں",
  },
  "swipeCard.incompleteProfile": {
    en: "This user has not completed the profile yet.", zh: "该用户还未完善资料。", hi: "इस उपयोगकर्ता ने अभी प्रोफ़ाइल पूरा नहीं किया है।", es: "Este usuario no ha completado su perfil aún.", fr: "Cet utilisateur n'a pas encore complété son profil.", ar: "هذا المستخدم لم يكمل ملفه بعد.", bn: "এই ব্যবহারকারী এখনও প্রোফাইল সম্পূর্ণ করেনি।", pt: "Este usuário ainda não completou o perfil.", ru: "Этот пользователь еще не заполнил профиль.", ur: "اس صارف نے ابھی پروفائل مکمل نہیں کیا۔",
  },
  "nav.language": {
    en: "Language",
    zh: "语言",
    hi: "भाषा",
    es: "Idioma",
    fr: "Langue",
    ar: "اللغة",
    bn: "ভাষা",
    pt: "Idioma",
    ru: "Язык",
    ur: "زبان",
  },
  "onboarding.language.title": {
    en: "Language",
    zh: "语言",
    hi: "भाषा",
    es: "Idioma",
    fr: "Langue",
    ar: "اللغة",
    bn: "ভাষা",
    pt: "Idioma",
    ru: "Язык",
    ur: "زبان",
  },
  "onboarding.language.description": {
    en: "Choose how you want to see the app. We detect your device language automatically.",
    zh: "选择你希望看到应用的语言。我们会自动检测设备语言。",
    hi: "ऐप किस भाषा में देखना चाहते हैं चुनें। हम डिवाइस भाषा स्वतः पहचानते हैं।",
    es: "Elige cómo quieres ver la app. Detectamos automáticamente el idioma de tu dispositivo.",
    fr: "Choisis la langue de l'app. Nous détectons automatiquement la langue de ton appareil.",
    ar: "اختر لغة التطبيق. نكتشف لغة جهازك تلقائيًا.",
    bn: "অ্যাপ কোন ভাষায় দেখতে চান সেটি বেছে নিন। আমরা ডিভাইসের ভাষা স্বয়ংক্রিয়ভাবে শনাক্ত করি।",
    pt: "Escolha como quer ver o app. Detectamos automaticamente o idioma do dispositivo.",
    ru: "Выберите язык приложения. Мы автоматически определяем язык устройства.",
    ur: "ایپ کی زبان منتخب کریں۔ ہم آپ کے ڈیوائس کی زبان خودکار طور پر پہچانتے ہیں۔",
  },
}

function detectDeviceLanguage(): SupportedLanguage {
  if (typeof navigator === "undefined") return "en"
  const raw = (navigator.language || "en").toLowerCase()
  const lang = raw.split("-")[0]
  const supported = TOP_10_LANGUAGES.map((l) => l.code)
  return (supported.includes(lang as SupportedLanguage) ? lang : "en") as SupportedLanguage
}

type I18nContextType = {
  language: SupportedLanguage
  setLanguage: (language: SupportedLanguage) => void
  t: (key: string) => string
  te: (spanish: string, english: string) => string
}

const I18nContext = createContext<I18nContextType | null>(null)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<SupportedLanguage>("en")

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as SupportedLanguage | null
    const next =
      stored && TOP_10_LANGUAGES.some((l) => l.code === stored)
        ? stored
        : detectDeviceLanguage()
    setLanguageState(next)
  }, [])

  useEffect(() => {
    document.documentElement.lang = language
  }, [language])

  const setLanguage = useCallback((next: SupportedLanguage) => {
    setLanguageState(next)
    localStorage.setItem(STORAGE_KEY, next)
  }, [])

  const t = useCallback(
    (key: string) => TRANSLATIONS[key]?.[language] ?? TRANSLATIONS[key]?.en ?? key,
    [language]
  )

  const te = useCallback(
    (spanish: string, english: string) => (language === "es" ? spanish : english),
    [language]
  )

  const value = useMemo(() => ({ language, setLanguage, t, te }), [language, setLanguage, t, te])
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const context = useContext(I18nContext)
  if (!context) throw new Error("useI18n must be used within LanguageProvider")
  return context
}

