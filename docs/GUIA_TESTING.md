# 🧪 GUÍA DE TESTING - FUNCIONALIDADES IMPLEMENTADAS

## 📋 CHECKLIST COMPLETO DE TESTING

---

## 1️⃣ SISTEMA DE REACCIONES

### **A. Reacciones en Posts**

#### Test 1.1: Dar reacción a un post
- [ ] Abrir el feed
- [ ] Hacer hover sobre el botón de corazón
- [ ] Seleccionar una reacción (ej: LOVE ❤️)
- [ ] **Esperado:** La reacción se muestra inmediatamente
- [ ] **Esperado:** El contador aumenta en 1
- [ ] **Esperado:** El emoji de la reacción reemplaza el corazón

#### Test 1.2: Cambiar de reacción
- [ ] Dar una reacción (ej: LIKE 👍)
- [ ] Hacer hover nuevamente
- [ ] Seleccionar otra reacción (ej: FIRE 🔥)
- [ ] **Esperado:** La reacción anterior se quita
- [ ] **Esperado:** La nueva reacción se muestra
- [ ] **Esperado:** El contador se mantiene igual

#### Test 1.3: Quitar reacción
- [ ] Dar una reacción
- [ ] Hacer hover y seleccionar la misma reacción
- [ ] **Esperado:** La reacción se quita
- [ ] **Esperado:** El contador disminuye en 1
- [ ] **Esperado:** Vuelve a mostrar el corazón vacío

#### Test 1.4: Ver usuarios que reaccionaron
- [ ] Click en el contador de reacciones
- [ ] **Esperado:** Se abre modal con lista de usuarios
- [ ] **Esperado:** Se muestran tabs por tipo de reacción
- [ ] **Esperado:** Se puede cambiar entre tabs
- [ ] **Esperado:** Se muestran avatares y nombres

#### Test 1.5: Manejo de errores
- [ ] Desconectar internet
- [ ] Intentar dar una reacción
- [ ] **Esperado:** Muestra toast de error
- [ ] **Esperado:** Opción de "Reintentar"
- [ ] **Esperado:** La UI revierte al estado anterior

---

### **B. Reacciones en Comentarios**

#### Test 1.6: Reaccionar a comentario
- [ ] Abrir un post con comentarios
- [ ] Hacer hover sobre el corazón de un comentario
- [ ] Seleccionar una reacción
- [ ] **Esperado:** La reacción se aplica al comentario
- [ ] **Esperado:** El contador se actualiza

#### Test 1.7: Reaccionar a respuesta
- [ ] Expandir respuestas de un comentario
- [ ] Hacer hover sobre el corazón de una respuesta
- [ ] Seleccionar una reacción
- [ ] **Esperado:** La reacción se aplica a la respuesta
- [ ] **Esperado:** El contador se actualiza

---

## 2️⃣ FEED LOCAL CON GEOLOCALIZACIÓN

### **A. Navegación entre Tabs**

#### Test 2.1: Tab Global
- [ ] Abrir el feed
- [ ] Verificar que esté en tab "Global" por defecto
- [ ] **Esperado:** Muestra todos los posts
- [ ] **Esperado:** No solicita permisos de ubicación

#### Test 2.2: Tab Local (con permisos)
- [ ] Click en tab "Local"
- [ ] Permitir acceso a ubicación cuando el navegador lo solicite
- [ ] **Esperado:** Muestra banner de carga
- [ ] **Esperado:** Carga posts de usuarios cercanos
- [ ] **Esperado:** No muestra banner de error

#### Test 2.3: Tab Local (sin permisos)
- [ ] Click en tab "Local"
- [ ] Denegar acceso a ubicación
- [ ] **Esperado:** Muestra banner amarillo con icono de mapa
- [ ] **Esperado:** Mensaje: "Necesitamos tu ubicación"
- [ ] **Esperado:** Botón "Permitir ubicación"

#### Test 2.4: Solicitar permisos manualmente
- [ ] Estar en tab "Local" sin permisos
- [ ] Click en "Permitir ubicación"
- [ ] Permitir acceso
- [ ] **Esperado:** Banner desaparece
- [ ] **Esperado:** Carga posts locales

#### Test 2.5: Tab Siguiendo
- [ ] Click en tab "Siguiendo"
- [ ] **Esperado:** Muestra posts de usuarios que sigues
- [ ] **Esperado:** Si no sigues a nadie, muestra mensaje apropiado

---

### **B. Estados de Carga**

#### Test 2.6: Loading en tab Local
- [ ] Cambiar a tab "Local"
- [ ] **Esperado:** Muestra skeletons mientras carga
- [ ] **Esperado:** No muestra posts del tab anterior
- [ ] **Esperado:** Después de cargar, muestra posts locales

#### Test 2.7: Sin posts locales
- [ ] Estar en tab "Local" con ubicación permitida
- [ ] Si no hay posts cercanos
- [ ] **Esperado:** Muestra mensaje "No hay posts cerca"
- [ ] **Esperado:** Sugiere cambiar a otro tab

---

## 3️⃣ SELECTOR DE VISIBILIDAD EN POSTS

### **A. Crear Posts con Visibilidad**

#### Test 3.1: Post Público
- [ ] Click en botón "+" para crear post
- [ ] Escribir contenido
- [ ] Seleccionar visibilidad: "🌍 Público"
- [ ] Publicar
- [ ] **Esperado:** Post se crea correctamente
- [ ] **Esperado:** Visible para todos los usuarios

#### Test 3.2: Post Solo Seguidores
- [ ] Crear nuevo post
- [ ] Seleccionar visibilidad: "👥 Seguidores"
- [ ] Publicar
- [ ] **Esperado:** Post se crea correctamente
- [ ] **Esperado:** Solo visible para seguidores

#### Test 3.3: Post Privado
- [ ] Crear nuevo post
- [ ] Seleccionar visibilidad: "🔒 Privado"
- [ ] Publicar
- [ ] **Esperado:** Post se crea correctamente
- [ ] **Esperado:** Solo visible para ti

---

### **B. UI del Selector**

#### Test 3.4: Selector visual
- [ ] Abrir diálogo de crear post
- [ ] Verificar selector de visibilidad
- [ ] **Esperado:** Muestra label "Visibilidad"
- [ ] **Esperado:** Valor por defecto: "Público"
- [ ] **Esperado:** Muestra iconos para cada opción

#### Test 3.5: Cambiar visibilidad
- [ ] Abrir selector
- [ ] **Esperado:** Muestra 3 opciones con iconos
- [ ] **Esperado:** Cada opción tiene descripción clara
- [ ] Seleccionar cada opción
- [ ] **Esperado:** El selector actualiza el valor

#### Test 3.6: Reset al cerrar
- [ ] Cambiar visibilidad a "Privado"
- [ ] Cerrar diálogo sin publicar
- [ ] Abrir diálogo nuevamente
- [ ] **Esperado:** Visibilidad vuelve a "Público"

---

### **C. Integración con Posts Locked**

#### Test 3.7: Post locked + visibilidad
- [ ] Ser usuario premium
- [ ] Crear post
- [ ] Activar "Post Premium (bloqueado)"
- [ ] Seleccionar visibilidad "Seguidores"
- [ ] Publicar
- [ ] **Esperado:** Post se crea con ambas opciones
- [ ] **Esperado:** Aparece borroso para no seguidores

---

## 4️⃣ CONTADOR DE LÍMITE DE SWIPES

### **A. Indicador de Swipes (Usuario Free)**

#### Test 4.1: Ver contador inicial
- [ ] Iniciar sesión como usuario free
- [ ] Ir a página de swipes
- [ ] **Esperado:** Muestra "Swipes restantes hoy: X/10"
- [ ] **Esperado:** Icono de rayo (⚡)
- [ ] **Esperado:** Color verde si >3 swipes

#### Test 4.2: Hacer swipes y actualizar contador
- [ ] Hacer swipe a la derecha (like)
- [ ] **Esperado:** Contador disminuye en 1
- [ ] Hacer swipe a la izquierda (dislike)
- [ ] **Esperado:** Contador disminuye en 1
- [ ] **Esperado:** Actualización inmediata

#### Test 4.3: Advertencia con pocos swipes
- [ ] Hacer swipes hasta tener ≤3 restantes
- [ ] **Esperado:** Banner cambia a color amarillo
- [ ] **Esperado:** Aparece botón "Premium"
- [ ] **Esperado:** Mensaje sigue siendo informativo

#### Test 4.4: Límite alcanzado
- [ ] Hacer swipes hasta llegar a 0
- [ ] **Esperado:** Banner cambia a color rojo
- [ ] **Esperado:** Muestra mensaje de límite alcanzado
- [ ] **Esperado:** Botones de swipe se deshabilitan
- [ ] **Esperado:** Muestra CTA grande a Premium

---

### **B. Banner de Límite Alcanzado**

#### Test 4.5: Contenido del banner
- [ ] Alcanzar límite de swipes
- [ ] **Esperado:** Icono de alerta (⚠️)
- [ ] **Esperado:** Título: "Límite de swipes alcanzado"
- [ ] **Esperado:** Descripción clara
- [ ] **Esperado:** Botón "Obtener Premium"

#### Test 4.6: CTA a Premium
- [ ] Click en botón "Obtener Premium"
- [ ] **Esperado:** Redirige a página /premium
- [ ] **Esperado:** Muestra planes de suscripción

---

### **C. Usuario Premium**

#### Test 4.7: Sin límite para premium
- [ ] Iniciar sesión como usuario premium
- [ ] Ir a página de swipes
- [ ] **Esperado:** NO muestra contador de swipes
- [ ] **Esperado:** NO muestra banner de límite
- [ ] Hacer múltiples swipes (>10)
- [ ] **Esperado:** Puede hacer swipes ilimitados

---

### **D. Manejo de Errores**

#### Test 4.8: Error al obtener swipes restantes
- [ ] Desconectar internet
- [ ] Recargar página de swipes
- [ ] **Esperado:** No muestra contador (falla silenciosamente)
- [ ] **Esperado:** Permite intentar hacer swipe
- [ ] **Esperado:** Muestra error al intentar swipe

#### Test 4.9: Error de límite del backend
- [ ] Hacer swipe cuando el backend retorna error de límite
- [ ] **Esperado:** Muestra banner de límite alcanzado
- [ ] **Esperado:** Actualiza contador a 0
- [ ] **Esperado:** Deshabilita botones

---

## 5️⃣ TESTING DE INTEGRACIÓN

### **A. Flujo Completo: Reacciones**

#### Test 5.1: Flujo de reacción completo
- [ ] Crear un post
- [ ] Dar reacción al post
- [ ] Comentar el post
- [ ] Dar reacción al comentario
- [ ] Responder al comentario
- [ ] Dar reacción a la respuesta
- [ ] **Esperado:** Todas las reacciones funcionan
- [ ] **Esperado:** Contadores se actualizan correctamente

---

### **B. Flujo Completo: Feed Local**

#### Test 5.2: Flujo de feed local completo
- [ ] Abrir feed (tab Global)
- [ ] Cambiar a tab Local
- [ ] Permitir ubicación
- [ ] Ver posts locales
- [ ] Dar reacción a un post local
- [ ] Comentar un post local
- [ ] Cambiar a tab Siguiendo
- [ ] Volver a tab Local
- [ ] **Esperado:** Todo funciona sin errores
- [ ] **Esperado:** No se pierde el estado

---

### **C. Flujo Completo: Crear Post**

#### Test 5.3: Flujo de creación completo
- [ ] Click en botón "+"
- [ ] Escribir contenido
- [ ] Subir imagen
- [ ] Seleccionar visibilidad "Seguidores"
- [ ] Activar "Post locked" (si premium)
- [ ] Publicar
- [ ] **Esperado:** Post se crea correctamente
- [ ] **Esperado:** Aparece en el feed
- [ ] **Esperado:** Respeta la visibilidad

---

### **D. Flujo Completo: Swipes**

#### Test 5.4: Flujo de swipes completo
- [ ] Ir a página de swipes
- [ ] Ver contador de swipes
- [ ] Hacer varios swipes
- [ ] Ver contador actualizado
- [ ] Alcanzar límite
- [ ] Ver banner de límite
- [ ] Click en "Obtener Premium"
- [ ] **Esperado:** Todo el flujo funciona
- [ ] **Esperado:** UI responde correctamente

---

## 6️⃣ TESTING DE COMPATIBILIDAD

### **A. Navegadores Desktop**

#### Test 6.1: Chrome/Edge
- [ ] Probar todas las funcionalidades en Chrome
- [ ] Probar todas las funcionalidades en Edge
- [ ] **Esperado:** Todo funciona correctamente

#### Test 6.2: Firefox
- [ ] Probar todas las funcionalidades en Firefox
- [ ] **Esperado:** Todo funciona correctamente

#### Test 6.3: Safari
- [ ] Probar todas las funcionalidades en Safari
- [ ] **Esperado:** Todo funciona correctamente

---

### **B. Navegadores Mobile**

#### Test 6.4: Chrome Mobile
- [ ] Probar en Chrome Android/iOS
- [ ] **Esperado:** UI responsive
- [ ] **Esperado:** Todas las funcionalidades funcionan

#### Test 6.5: Safari Mobile
- [ ] Probar en Safari iOS
- [ ] **Esperado:** UI responsive
- [ ] **Esperado:** Todas las funcionalidades funcionan

---

### **C. Dispositivos**

#### Test 6.6: Desktop (1920x1080)
- [ ] Probar en resolución Full HD
- [ ] **Esperado:** UI se ve correctamente
- [ ] **Esperado:** No hay elementos cortados

#### Test 6.7: Tablet (768x1024)
- [ ] Probar en tablet
- [ ] **Esperado:** UI responsive
- [ ] **Esperado:** Botones accesibles

#### Test 6.8: Mobile (375x667)
- [ ] Probar en iPhone SE
- [ ] **Esperado:** UI responsive
- [ ] **Esperado:** Todo es accesible

---

## 7️⃣ TESTING DE PERFORMANCE

### **A. Tiempos de Carga**

#### Test 7.1: Carga inicial del feed
- [ ] Medir tiempo de carga del feed
- [ ] **Esperado:** <2 segundos

#### Test 7.2: Cambio entre tabs
- [ ] Medir tiempo al cambiar tabs
- [ ] **Esperado:** <1 segundo

#### Test 7.3: Dar reacción
- [ ] Medir tiempo de respuesta al dar reacción
- [ ] **Esperado:** Inmediato (optimistic update)

---

### **B. Optimistic Updates**

#### Test 7.4: Reacción optimista
- [ ] Dar reacción con internet lenta
- [ ] **Esperado:** UI actualiza inmediatamente
- [ ] **Esperado:** Si falla, revierte el cambio

---

## 8️⃣ TESTING DE ACCESIBILIDAD

### **A. Navegación por Teclado**

#### Test 8.1: Tab navigation
- [ ] Usar Tab para navegar
- [ ] **Esperado:** Todos los elementos son accesibles
- [ ] **Esperado:** Focus visible

#### Test 8.2: Enter para acciones
- [ ] Usar Enter en botones
- [ ] **Esperado:** Ejecuta la acción

---

### **B. Screen Readers**

#### Test 8.3: Labels descriptivos
- [ ] Activar screen reader
- [ ] Navegar por la app
- [ ] **Esperado:** Todos los elementos tienen labels
- [ ] **Esperado:** Descripciones claras

---

## 9️⃣ TESTING DE SEGURIDAD

### **A. Autenticación**

#### Test 9.1: Sin token
- [ ] Borrar token de localStorage
- [ ] Intentar dar reacción
- [ ] **Esperado:** Error 401
- [ ] **Esperado:** Redirige a login

---

### **B. Permisos**

#### Test 9.2: Ubicación sin permisos
- [ ] Denegar permisos de ubicación
- [ ] **Esperado:** No envía ubicación al backend
- [ ] **Esperado:** Muestra banner informativo

---

## 🎯 RESUMEN DE TESTING

### **Checklist General:**
- [ ] Todas las funcionalidades de reacciones
- [ ] Todas las funcionalidades de feed local
- [ ] Todas las funcionalidades de visibilidad
- [ ] Todas las funcionalidades de swipes
- [ ] Compatibilidad en navegadores
- [ ] Compatibilidad en dispositivos
- [ ] Performance aceptable
- [ ] Accesibilidad básica
- [ ] Seguridad básica

### **Criterios de Aceptación:**
- ✅ 0 errores críticos
- ✅ 0 errores de consola
- ✅ UI responsive en todos los dispositivos
- ✅ Tiempos de carga <2 segundos
- ✅ Optimistic updates funcionando
- ✅ Manejo de errores apropiado

---

## 📝 REPORTE DE BUGS

Si encuentras algún bug durante el testing, reportarlo con:

1. **Descripción:** ¿Qué pasó?
2. **Pasos para reproducir:** ¿Cómo llegaste ahí?
3. **Esperado:** ¿Qué debería pasar?
4. **Actual:** ¿Qué pasó realmente?
5. **Navegador/Dispositivo:** ¿Dónde ocurrió?
6. **Screenshot:** Si es posible

---

**Fecha de creación:** 10/03/2026  
**Versión:** 1.0.0
