# 🔧 TROUBLESHOOTING - PROBLEMAS COMUNES Y SOLUCIONES

## 📍 PROBLEMA: Botón "Permitir ubicación" no funciona

### **Síntomas:**
- El botón "Permitir ubicación" no hace nada al hacer click
- No aparece el popup del navegador solicitando permisos
- El banner de ubicación no desaparece

### **Causas posibles:**

#### 1. **Permisos de ubicación bloqueados en el navegador**

**Solución:**

**Chrome/Edge:**
1. Click en el icono de candado/información en la barra de direcciones
2. Buscar "Ubicación"
3. Cambiar a "Permitir"
4. Recargar la página
5. Intentar nuevamente

**Firefox:**
1. Click en el icono de información en la barra de direcciones
2. Click en "Permisos"
3. Buscar "Acceder a tu ubicación"
4. Cambiar a "Permitir"
5. Recargar la página

**Safari:**
1. Safari > Preferencias > Sitios web
2. Ubicación
3. Buscar el sitio y cambiar a "Permitir"
4. Recargar la página

#### 2. **Navegador no soporta geolocalización**

**Verificar:**
```javascript
// Abrir consola del navegador (F12)
console.log('Geolocation supported:', 'geolocation' in navigator)
```

**Solución:**
- Actualizar el navegador a la última versión
- Usar un navegador moderno (Chrome, Firefox, Safari, Edge)

#### 3. **Conexión HTTPS requerida**

**Problema:**
- La geolocalización solo funciona en HTTPS (o localhost)
- Si estás en HTTP, no funcionará

**Solución:**
- En desarrollo: usar `localhost` o `127.0.0.1`
- En producción: asegurarse de tener HTTPS configurado

#### 4. **Servicios de ubicación desactivados en el sistema**

**Windows:**
1. Configuración > Privacidad > Ubicación
2. Activar "Permitir que las aplicaciones accedan a tu ubicación"

**macOS:**
1. Preferencias del Sistema > Seguridad y Privacidad > Privacidad
2. Ubicación
3. Activar para el navegador

**Android:**
1. Configuración > Ubicación
2. Activar

**iOS:**
1. Configuración > Privacidad > Servicios de ubicación
2. Activar
3. Buscar Safari y activar

#### 5. **Error de timeout**

**Síntoma:**
- El navegador tarda mucho en responder
- Aparece error de timeout

**Solución:**
- Verificar conexión a internet
- Verificar que el GPS esté activado (móvil)
- Intentar en un lugar con mejor señal
- El timeout está configurado a 10 segundos, es suficiente

---

## 🔄 PROBLEMA: Feed local no carga posts

### **Síntomas:**
- El tab "Local" está vacío
- Muestra "No hay posts cerca"
- La ubicación fue permitida correctamente

### **Causas posibles:**

#### 1. **No hay usuarios cercanos**

**Verificación:**
- Revisar en la consola del navegador si la ubicación se envió correctamente
- Verificar que el backend recibió la ubicación

**Solución:**
- Esto es normal si no hay usuarios en un radio de 50km
- Cambiar al tab "Global" para ver todos los posts

#### 2. **Backend no está corriendo**

**Verificación:**
```javascript
// En consola del navegador
fetch('/api/feed/local/USER_ID?radiusKm=50')
  .then(r => r.json())
  .then(console.log)
```

**Solución:**
- Verificar que el backend esté corriendo
- Verificar la URL del backend en `lib/api.ts`

#### 3. **Error en el endpoint**

**Verificación:**
- Abrir DevTools > Network
- Buscar la llamada a `/api/feed/local/`
- Ver el status code y la respuesta

**Solución:**
- Si es 404: El endpoint no existe en el backend
- Si es 500: Error del servidor, revisar logs del backend
- Si es 401: Token expirado, hacer logout/login

---

## ❤️ PROBLEMA: Reacciones no funcionan

### **Síntomas:**
- Click en reacción no hace nada
- El contador no se actualiza
- Aparece error en consola

### **Causas posibles:**

#### 1. **Endpoint de reacciones no implementado en backend**

**Verificación:**
```javascript
// En consola del navegador
fetch('/api/reactions/toggle', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + localStorage.getItem('sparkd_token')
  },
  body: JSON.stringify({
    targetId: 'POST_ID',
    targetType: 'POST',
    reactionType: 'LIKE'
  })
}).then(r => r.json()).then(console.log)
```

**Solución:**
- Verificar que el backend tenga implementado el endpoint
- Verificar la documentación del backend

#### 2. **Token expirado**

**Síntoma:**
- Error 401 en la consola

**Solución:**
- Hacer logout
- Hacer login nuevamente
- Intentar dar reacción

#### 3. **Optimistic update revierte**

**Síntoma:**
- La reacción aparece y luego desaparece

**Solución:**
- Esto indica que el backend rechazó la reacción
- Revisar la consola para ver el error específico
- Verificar que el post/comentario exista

---

## 🎯 PROBLEMA: Contador de swipes no aparece

### **Síntomas:**
- No se muestra el contador de swipes
- Usuario free pero no ve el límite

### **Causas posibles:**

#### 1. **Usuario es premium**

**Verificación:**
- Usuarios premium no tienen límite de swipes
- Por lo tanto, no se muestra el contador

**Solución:**
- Esto es el comportamiento esperado
- Para testing, usar una cuenta free

#### 2. **Endpoint no responde**

**Verificación:**
```javascript
// En consola del navegador
fetch('/api/swipes/remaining/USER_ID', {
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('sparkd_token')
  }
}).then(r => r.json()).then(console.log)
```

**Solución:**
- Verificar que el backend esté corriendo
- Verificar que el endpoint exista

---

## 🔐 PROBLEMA: Selector de visibilidad no guarda

### **Síntomas:**
- Cambio la visibilidad pero el post se crea como público
- El selector no muestra el valor seleccionado

### **Causas posibles:**

#### 1. **Backend no acepta el campo visibility**

**Verificación:**
- Abrir DevTools > Network
- Buscar la llamada a `/api/posts/new`
- Ver el payload enviado
- Ver la respuesta del backend

**Solución:**
- Verificar que el backend acepte el campo `visibility`
- Verificar la documentación del backend
- Contactar al equipo de backend

#### 2. **Valor no se está enviando**

**Verificación:**
```javascript
// En el código, agregar console.log antes de enviar
console.log('Visibility:', visibility)
```

**Solución:**
- Verificar que el estado `visibility` se esté actualizando
- Verificar que se incluya en el request body

---

## 🐛 ERRORES COMUNES EN CONSOLA

### **Error: "Cannot read property 'userId' of null"**

**Causa:** Usuario no está autenticado

**Solución:**
- Hacer login
- Verificar que el token esté en localStorage
- Verificar que el contexto de auth esté funcionando

### **Error: "Failed to fetch"**

**Causa:** Backend no está corriendo o CORS

**Solución:**
- Verificar que el backend esté corriendo
- Verificar la URL del backend
- Verificar configuración de CORS en el backend

### **Error: "Geolocation permission denied"**

**Causa:** Usuario denegó permisos de ubicación

**Solución:**
- Seguir los pasos de "Permisos de ubicación bloqueados"
- Explicar al usuario por qué necesitamos la ubicación

### **Error: "Token expired"**

**Causa:** El JWT expiró

**Solución:**
- Hacer logout
- Hacer login nuevamente
- Implementar refresh token (futuro)

---

## 🧪 TESTING EN DIFERENTES ESCENARIOS

### **Escenario 1: Primera vez que el usuario usa feed local**

**Pasos:**
1. Usuario nunca ha dado permisos de ubicación
2. Click en tab "Local"
3. Aparece popup del navegador
4. Usuario permite
5. Se envía ubicación al backend
6. Carga posts locales

**Verificar:**
- Popup del navegador aparece
- Banner de ubicación NO aparece (porque se permitió)
- Posts locales cargan correctamente

### **Escenario 2: Usuario deniega permisos**

**Pasos:**
1. Click en tab "Local"
2. Aparece popup del navegador
3. Usuario deniega
4. Aparece banner amarillo
5. Click en "Permitir ubicación"
6. Aparece popup nuevamente
7. Usuario permite
8. Banner desaparece
9. Posts locales cargan

**Verificar:**
- Banner aparece cuando se deniega
- Botón funciona correctamente
- Banner desaparece cuando se permite

### **Escenario 3: Permisos ya bloqueados**

**Pasos:**
1. Permisos ya están bloqueados en el navegador
2. Click en tab "Local"
3. NO aparece popup (porque ya está bloqueado)
4. Aparece banner amarillo
5. Click en "Permitir ubicación"
6. NO aparece popup (sigue bloqueado)
7. Aparece toast de error

**Verificar:**
- Banner aparece
- Toast explica que debe cambiar permisos manualmente
- Se muestra instrucciones

---

## 📱 TESTING EN MÓVIL

### **Problemas específicos de móvil:**

#### 1. **GPS desactivado**

**Síntoma:**
- Error de ubicación en móvil

**Solución:**
- Activar GPS en configuración del dispositivo
- Reintentar

#### 2. **Permisos del navegador móvil**

**Chrome Android:**
- Configuración > Configuración del sitio > Ubicación

**Safari iOS:**
- Configuración > Safari > Ubicación

#### 3. **Modo de ahorro de batería**

**Síntoma:**
- GPS no funciona o es muy lento

**Solución:**
- Desactivar modo de ahorro de batería temporalmente
- Usar WiFi para mejor precisión

---

## 🔍 HERRAMIENTAS DE DEBUG

### **1. Consola del navegador**

```javascript
// Ver estado de geolocalización
navigator.permissions.query({name:'geolocation'}).then(console.log)

// Ver token
console.log('Token:', localStorage.getItem('sparkd_token'))

// Ver usuario actual
console.log('User:', JSON.parse(localStorage.getItem('sparkd_user') || '{}'))

// Probar endpoint manualmente
fetch('/api/feed/local/USER_ID?radiusKm=50', {
  headers: { 'Authorization': 'Bearer ' + localStorage.getItem('sparkd_token') }
}).then(r => r.json()).then(console.log)
```

### **2. DevTools Network**

- Abrir DevTools (F12)
- Tab "Network"
- Filtrar por "Fetch/XHR"
- Ver todas las llamadas al backend
- Verificar status codes
- Ver payloads y respuestas

### **3. React DevTools**

- Instalar extensión React DevTools
- Ver estado de componentes
- Ver props
- Ver hooks

---

## 📞 CONTACTO PARA SOPORTE

Si ninguna de estas soluciones funciona:

1. **Recopilar información:**
   - Navegador y versión
   - Sistema operativo
   - Mensaje de error exacto
   - Screenshot de la consola
   - Pasos para reproducir

2. **Crear issue en GitHub** (si aplica)

3. **Contactar al equipo de desarrollo**

---

**Última actualización:** 10/03/2026  
**Versión:** 1.0.0
