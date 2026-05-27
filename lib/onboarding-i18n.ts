type SupportedLanguage =
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

/** Helper: full locale map with en + es; other langs default to English unless overridden. */
function tr(
  en: string,
  es: string,
  overrides?: Partial<Record<SupportedLanguage, string>>
): Record<SupportedLanguage, string> {
  return {
    en,
    es,
    zh: en,
    hi: en,
    fr: en,
    ar: en,
    bn: en,
    pt: en,
    ru: en,
    ur: en,
    ...overrides,
  }
}

export const ONBOARDING_I18N: Record<string, Record<SupportedLanguage, string>> = {
  "onboarding.step0.title": tr(
    "Your experience",
    "Tu experiencia",
    { fr: "Ton expérience", pt: "Sua experiência", ru: "Ваш опыт", zh: "你的体验", hi: "आपका अनुभव" }
  ),
  "onboarding.step0.description": tr(
    "Choose how you want to use Sparkd. You can change this later.",
    "Elige cómo quieres usar Sparkd. Podrás cambiar esto más adelante.",
    {
      fr: "Choisis comment utiliser Sparkd. Tu pourras changer plus tard.",
      pt: "Escolha como usar o Sparkd. Você pode mudar depois.",
    }
  ),
  "onboarding.appearance.title": tr("Appearance", "Apariencia", { fr: "Apparence", pt: "Aparência" }),
  "onboarding.appearance.description": tr(
    "Pick a visual style and accent colors for the app.",
    "Elige un estilo visual y los colores de acento de la app."
  ),
  "onboarding.appearance.styleTitle": tr("Interface style", "Estilo de interfaz"),
  "onboarding.appearance.styleHint": tr(
    "Each option changes the navbar and overall look.",
    "Cada opción cambia la barra de navegación y el aspecto general."
  ),
  "onboarding.appearance.paletteTitle": tr("Color palette", "Paleta de colores"),
  "onboarding.appearance.paletteHint": tr(
    "Accent colors for buttons, links and highlights.",
    "Colores de acento para botones, enlaces y destacados."
  ),
  "onboarding.appearance.sparkd.title": tr("Sparkd Classic", "Sparkd clásico"),
  "onboarding.appearance.sparkd.description": tr(
    "The original look with the curved dock navbar.",
    "El aspecto original con la barra curva central."
  ),
  "onboarding.appearance.neon.title": tr("Neon Events", "Neon eventos"),
  "onboarding.appearance.neon.description": tr(
    "Cyan and magenta accents with a gradient navbar.",
    "Acentos cyan y magenta con barra en gradiente."
  ),
  "onboarding.appearance.cyber.title": tr("Cyber Black", "Cyber negro"),
  "onboarding.appearance.cyber.description": tr(
    "Pure black feed with a glass-style floating navbar.",
    "Feed negro puro con barra flotante estilo cristal."
  ),
  "onboarding.step1.title": tr("About you", "Sobre ti", { fr: "À propos de toi", pt: "Sobre você" }),
  "onboarding.step1.description": tr(
    "Basic details for your profile and better recommendations.",
    "Datos básicos para tu perfil y para mejorar las recomendaciones."
  ),
  "onboarding.step2.title": tr("Interests", "Intereses", { fr: "Centres d'intérêt", pt: "Interesses" }),
  "onboarding.step2.description": tr(
    "Pick topics you enjoy. It helps find like-minded people.",
    "Elige temas que te gusten. Ayuda a encontrar gente afín."
  ),
  "onboarding.step3.title": tr("Preferences", "Preferencias", { fr: "Préférences", pt: "Preferências" }),
  "onboarding.step3.description": tr(
    "Adjust who you want to connect with and how you appear in search.",
    "Ajusta con quién quieres conectar y cómo apareces en búsquedas."
  ),
  "onboarding.step0.cardTitle": tr(
    "How do you want to use the app?",
    "¿Cómo quieres usar la app?",
    { fr: "Comment veux-tu utiliser l'app ?", pt: "Como você quer usar o app?" }
  ),
  "onboarding.step0.changeLater": tr(
    "You can change the mode later in settings.",
    "Puedes cambiar el modo más adelante en ajustes."
  ),
  "onboarding.trial.title": tr("Welcome premium trial", "Trial premium de bienvenida"),
  "onboarding.trial.description": tr(
    "Unlimited swipes, no ads and more benefits when starting. Details are in your account.",
    "Swipes ilimitados, sin anuncios y más ventajas al empezar. Los detalles están en tu cuenta."
  ),
  "onboarding.mode.social.title": tr("Social", "Social"),
  "onboarding.mode.social.subtitle": tr(
    "Feed, posts and community.",
    "Feed, publicaciones y comunidad."
  ),
  "onboarding.mode.dating.title": tr("Connection", "Conexión", { fr: "Connexion", pt: "Conexão" }),
  "onboarding.mode.dating.subtitle": tr(
    "Dates and matching.",
    "Encuentros y matching."
  ),
  "onboarding.mode.both.title": tr("Both", "Ambas", { fr: "Les deux", pt: "Ambos" }),
  "onboarding.mode.both.subtitle": tr(
    "Social and connection together.",
    "Social y conexión juntos."
  ),
  "onboarding.error.requiredFields": tr(
    "Complete required fields",
    "Completa los campos obligatorios"
  ),
  "onboarding.error.saveProfile": tr("Error saving profile", "Error al guardar perfil"),
  "onboarding.error.saveInterests": tr("Error saving interests", "Error al guardar intereses"),
  "onboarding.error.savePreferences": tr(
    "Error saving preferences",
    "Error al guardar preferencias"
  ),
  "onboarding.success.complete": tr(
    "Done! Your profile is complete.",
    "¡Listo! Tu perfil está completo."
  ),
  "onboarding.basic.title": tr("Basic information", "Información básica"),
  "onboarding.basic.requiredNotePrefix": tr(
    "Complete your profile. Fields marked with ",
    "Completa tu perfil. Los campos con "
  ),
  "onboarding.basic.requiredNoteSuffix": tr(" are required.", " son obligatorios."),
  "onboarding.basic.sectionPublicName": tr("Public name", "Nombre público"),
  "onboarding.firstName": tr("First names", "Nombres"),
  "onboarding.firstName.placeholder": tr("e.g. Maria", "Ej. María"),
  "onboarding.lastName": tr("Last names", "Apellidos"),
  "onboarding.lastName.placeholder": tr("e.g. Garcia Lopez", "Ej. García López"),
  "onboarding.gender": tr("Gender", "Género", { fr: "Genre", pt: "Gênero" }),
  "onboarding.gender.hint": tr(
    "Your gender (man or woman). In Preferences you can choose who you want to meet — men, women, or both.",
    "Tu género (hombre o mujer). En Preferencias eliges a quién quieres conocer: hombres, mujeres o ambos."
  ),
  "onboarding.gender.male": tr("Man", "Hombre", { fr: "Homme", pt: "Homem" }),
  "onboarding.gender.female": tr("Woman", "Mujer", { fr: "Femme", pt: "Mulher" }),
  "onboarding.dob": tr("Date of birth", "Fecha de nacimiento"),
  "onboarding.dob.hint": tr(
    "You must be at least 18 years old. Calendar uses your system format.",
    "Debes tener al menos 18 años. El calendario usa el formato de tu sistema."
  ),
  "onboarding.phone": tr("Phone", "Teléfono", { fr: "Téléphone", pt: "Telefone" }),
  "onboarding.optional": tr("Optional", "Opcional", { fr: "Facultatif", pt: "Opcional" }),
  "onboarding.phone.hint": tr(
    "Useful for notices or account recovery; you can leave it empty.",
    "Útil para avisos o recuperar acceso; puedes dejarlo vacío."
  ),
  "onboarding.interests.desc": tr(
    "Choose topics you like to improve recommendations and matches. Tap a tag to add or remove it.",
    "Elige temas que te gusten para mejorar recomendaciones y matches. Toca una etiqueta para marcarla o quitarla."
  ),
  "onboarding.interests.skipAny": tr(
    "You can continue without selecting any.",
    "Puedes avanzar sin marcar ninguna."
  ),
  "onboarding.interests.noneYet": tr("None yet", "Ninguno aún"),
  "onboarding.interests.selectedOne": tr("selected", "elegido"),
  "onboarding.interests.selectedMany": tr("selected", "elegidos"),
  "onboarding.interests.tip": tr(
    "Multiple interests usually improve results, but completing the list is optional.",
    "Varios intereses suelen dar mejores resultados, pero no es obligatorio completar la lista."
  ),
  "onboarding.interests.tapHint": tr("Tap to add or remove", "Toca para añadir o quitar"),
  "onboarding.interests.empty": tr(
    "No interests available right now. You can continue and add them later in your profile.",
    "No hay intereses por ahora. Puedes continuar y añadirlos después en tu perfil."
  ),
  "onboarding.prefs.desc": tr(
    "Adjust who you want to see and how you appear to others.",
    "Ajusta quién quieres ver y cómo te muestras a los demás."
  ),
  "onboarding.prefs.meet": tr("I want to meet", "Me interesa conocer"),
  "onboarding.prefs.men": tr("Men", "Hombres", { fr: "Hommes", pt: "Homens" }),
  "onboarding.prefs.women": tr("Women", "Mujeres", { fr: "Femmes", pt: "Mulheres" }),
  "onboarding.prefs.everyone": tr("Both", "Ambos", { fr: "Les deux", pt: "Ambos" }),
  "onboarding.photo.add": tr("Add photo", "Añadir foto"),
  "onboarding.photo.optional": tr("Optional but recommended", "Opcional pero recomendada"),
  "onboarding.photo.uploading": tr("Uploading photo…", "Subiendo foto…"),
  "onboarding.photo.success": tr("Photo updated", "Foto actualizada"),
  "onboarding.photo.error": tr("Error uploading photo", "Error al subir foto"),
  "onboarding.phone.placeholder": tr("+1 555 000 0000", "+34 600 000 000"),
  "onboarding.error.ageMin": tr(
    "You must be at least 18 years old.",
    "Debes tener al menos 18 años."
  ),
  "onboarding.screenTitle": tr("Complete your profile", "Completa tu perfil"),
  "app.loading.onboarding": tr("Preparing your onboarding…", "Preparando tu onboarding…"),
  "app.loading.onboardingHint": tr(
    "One moment while we sync your account.",
    "Un momento mientras sincronizamos tu cuenta."
  ),
  "app.loading.feed": tr("Loading your feed…", "Cargando tu feed…"),
  "app.loading.default": tr("Loading…", "Cargando…"),
  "app.loading.sessionHint": tr("Syncing your session with Sparkd.", "Sincronizando tu sesión con Sparkd."),
  "onboarding.prefs.ageRange": tr("Age range", "Rango de edad"),
  "onboarding.prefs.years": tr("years", "años", { fr: "ans", pt: "anos" }),
  "onboarding.prefs.sliderHint": tr(
    "Adjust min and max using the two slider handles.",
    "Ajusta el mínimo y máximo con los dos controles del deslizador."
  ),
  "onboarding.prefs.showInSearch": tr("Appear in search", "Aparecer en búsquedas"),
  "onboarding.prefs.showInSearchHint": tr(
    "If disabled, you'll be less visible to new people.",
    "Si lo desactivas, serás menos visible para nuevas personas."
  ),
  "onboarding.enter": tr("Enter Sparkd", "Entrar a Sparkd"),
  "onboarding.footer.confirm": tr(
    "By continuing, you confirm the information is correct.",
    "Al continuar confirmas que la información es correcta."
  ),
  "onboarding.category.ENTRETENIMIENTO": tr("Entertainment", "Entretenimiento"),
  "onboarding.category.DEPORTE": tr("Sports", "Deporte"),
  "onboarding.category.VIAJES": tr("Travel", "Viajes"),
  "onboarding.category.ESTILO_DE_VIDA": tr("Lifestyle", "Estilo de vida"),
  "onboarding.category.CONOCIMIENTO": tr("Knowledge", "Conocimiento"),
  "onboarding.category.SOCIAL": tr("Social", "Social"),
  "onboarding.category.ARTE": tr("Art", "Arte"),
  "onboarding.category.MUSICA": tr("Music", "Música"),
  "onboarding.category.GASTRONOMIA": tr("Food", "Gastronomía"),
  "onboarding.category.NATURALEZA": tr("Nature", "Naturaleza"),
  "onboarding.category.TECNOLOGIA": tr("Technology", "Tecnología"),
  "onboarding.category.NEGOCIOS": tr("Business", "Negocios"),
  "onboarding.category.BIENESTAR": tr("Wellness", "Bienestar"),
  "onboarding.category.CULTURA": tr("Culture", "Cultura"),
  "onboarding.category.AVENTURA": tr("Adventure", "Aventura"),
}
