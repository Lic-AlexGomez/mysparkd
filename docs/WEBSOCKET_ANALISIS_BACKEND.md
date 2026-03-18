# 🔌 ANÁLISIS WEBSOCKET - BACKEND SPARKD

## 📊 RESUMEN EJECUTIVO

El backend de Sparkd **SÍ tiene implementado WebSocket** para mensajería en tiempo real. La implementación está completa y funcional con las siguientes características:

✅ **Configuración WebSocket completa**
✅ **Autenticación JWT en WebSocket**
✅ **Controlador de mensajes en tiempo real**
✅ **Servicio de chat completo**
✅ **Modelos de datos correctos**
✅ **Endpoints REST complementarios**

---

## 🏗️ ARQUITECTURA IMPLEMENTADA

### 1. Configuración WebSocket (`WebSocketConfig.java`)

**Características:**
- ✅ Usa Spring WebSocket con STOMP
- ✅ Endpoint: `/ws` con SockJS fallback
- ✅ Message broker configurado con `/topic` y `/queue`
- ✅ Prefijo de aplicación: `/app`
- ✅ Prefijo de usuario: `/user`
- ✅ **Autenticación JWT integrada** en el handshake

**Configuración de Brokers:**
```java
registry.enableSimpleBroker("/topic", "/queue");
registry.setApplicationDestinationPrefixes("/app");
registry.setUserDestinationPrefix("/user");
```

**Autenticación:**
- Intercepta conexiones STOMP en el comando `CONNECT`
- Extrae token JWT del header `Authorization`
- Decodifica JWT y obtiene el `uuid` del usuario
- Establece el UUID como Principal para la sesión WebSocket

---

### 2. Controlador WebSocket (`ChatWebSocketController.java`)

**Endpoint de Mensajería:**
```java
@MessageMapping("/chat.send")
public void send(@Payload Map<String, String> payload, StompHeaderAccessor headerAccessor)
```

**Flujo de Envío de Mensaje:**
1. Recibe mensaje del cliente en `/app/chat.send`
2. Extrae `senderId` del usuario autenticado (JWT)
3. Extrae `chatId` y `content` del payload
4. Llama a `ChatService.sendMessage()`
5. Envía mensaje a ambos participantes del chat:
   - `messagingTemplate.convertAndSendToUser(user1Id, "/queue/messages", response)`
   - `messagingTemplate.convertAndSendToUser(user2Id, "/queue/messages", response)`

**Seguridad:**
- ✅ Valida que el usuario esté autenticado
- ✅ Valida que el Principal sea del tipo correcto
- ✅ Extrae UUID del usuario de forma segura

---

### 3. Servicio de Chat (`ChatService.java`)

**Métodos Implementados:**

#### `getOrCreateChat(UUID meId, UUID otherId)`
- Valida que ambos usuarios existan
- **Valida que exista un match entre los usuarios** (seguridad)
- Busca chat existente (bidireccional)
- Crea nuevo chat si no existe

#### `sendMessage(UUID senderId, SendMessageRequestDTO dto)`
- Valida que el usuario sea participante del chat
- Crea mensaje en base de datos
- **Modera contenido con OpenAI** (anti-spam/abuso)
- Retorna `MessageResponseDTO`

#### `getMessages(UUID chatId, UUID meId)`
- Valida que el usuario sea participante
- Retorna mensajes ordenados por fecha

#### `getMyChats(UUID meId)`
- Retorna lista de chats del usuario
- Incluye último mensaje y timestamp

---

### 4. Modelos de Datos

#### `Chat.java`
```java
@Entity
@Table(name = "chats")
public class Chat {
    @Id UUID id;
    @ManyToOne Users user1;
    @ManyToOne Users user2;
    LocalDateTime createdAt;
}
```
- ✅ Constraint UNIQUE en (user1_id, user2_id)
- ✅ Relación bidireccional entre usuarios

#### `Message.java`
```java
@Entity
@Table(name = "messages")
public class Message {
    @Id UUID id;
    @ManyToOne Chat chat;
    @ManyToOne Users sender;
    @Column(length = 1000) String content;
    LocalDateTime sentAt;
}
```
- ✅ Límite de 1000 caracteres por mensaje
- ✅ Timestamp automático

#### `ChatMessage.java` (Modelo alternativo - NO USADO)
- Este modelo parece ser legacy/no usado
- El sistema usa `Message.java` en su lugar

---

### 5. Endpoints REST Complementarios

#### `POST /api/chat/open/{userId}`
- Abre o crea chat con otro usuario
- Valida que exista match
- Retorna `ChatResponseDTO`

#### `POST /api/chat/send`
- Envío de mensaje vía REST (alternativa a WebSocket)
- Útil para clientes que no soporten WebSocket

#### `GET /api/chat/{chatId}/messages`
- Obtiene historial de mensajes
- Ordenados por fecha ascendente

#### `GET /api/chat/chats`
- Lista todos los chats del usuario
- Incluye último mensaje y participante

---

## 🔐 SEGURIDAD IMPLEMENTADA

### 1. Autenticación JWT en WebSocket
✅ Token JWT requerido en header `Authorization`
✅ Validación del token en cada conexión
✅ UUID del usuario extraído del claim `uuid`
✅ Principal establecido para toda la sesión

### 2. Validación de Permisos
✅ Solo participantes del chat pueden enviar mensajes
✅ Solo usuarios con match pueden crear chats
✅ Validación de ownership en cada operación

### 3. Moderación de Contenido
✅ Integración con OpenAI Moderation API
✅ Bloqueo de contenido inapropiado
✅ Respuesta HTTP 400 si contenido es flagged

---

## 📡 FLUJO DE COMUNICACIÓN

### Conexión WebSocket
```
Cliente → /ws (SockJS)
       → CONNECT con Authorization: Bearer {token}
       → JWT decodificado
       → Principal establecido (UUID)
       → Conexión establecida
```

### Envío de Mensaje
```
Cliente → /app/chat.send
       → {chatId: "uuid", content: "mensaje"}
       → Validación de autenticación
       → Validación de permisos
       → Moderación de contenido
       → Guardar en BD
       → Enviar a /user/{user1}/queue/messages
       → Enviar a /user/{user2}/queue/messages
```

### Recepción de Mensaje
```
Cliente suscrito a /user/queue/messages
       → Recibe MessageResponseDTO
       → {messageId, chatId, senderId, receiverId, content, sentAt}
```

---

## 🎯 ENDPOINTS WEBSOCKET

### Envío (Cliente → Servidor)
- **Destino:** `/app/chat.send`
- **Payload:**
  ```json
  {
    "chatId": "uuid",
    "content": "string"
  }
  ```

### Recepción (Servidor → Cliente)
- **Suscripción:** `/user/queue/messages`
- **Payload:**
  ```json
  {
    "messageId": "uuid",
    "chatId": "uuid",
    "senderId": "uuid",
    "receiverId": "uuid",
    "content": "string",
    "sentAt": "2024-01-15T10:30:00"
  }
  ```

---

## 📦 DEPENDENCIAS

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-websocket</artifactId>
</dependency>

<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-oauth2-resource-server</artifactId>
</dependency>
```

---

## ✅ FUNCIONALIDADES COMPLETAS

1. ✅ **Conexión WebSocket con autenticación JWT**
2. ✅ **Envío de mensajes en tiempo real**
3. ✅ **Recepción de mensajes en tiempo real**
4. ✅ **Validación de match antes de crear chat**
5. ✅ **Moderación de contenido con OpenAI**
6. ✅ **Historial de mensajes vía REST**
7. ✅ **Lista de chats con último mensaje**
8. ✅ **Fallback con SockJS para navegadores antiguos**
9. ✅ **Mensajes dirigidos a usuarios específicos**
10. ✅ **Persistencia en base de datos**

---

## 🔴 POSIBLES MEJORAS

### 1. Indicadores de Estado
❌ **Typing indicators** (usuario escribiendo)
❌ **Online/offline status** (estado en línea)
❌ **Last seen** (última vez visto)

**Implementación sugerida:**
```java
@MessageMapping("/chat.typing")
public void typing(@Payload Map<String, String> payload) {
    String chatId = payload.get("chatId");
    UUID userId = getCurrentUserId();
    messagingTemplate.convertAndSendToUser(
        otherUserId, 
        "/queue/typing", 
        new TypingIndicator(chatId, userId, true)
    );
}
```

### 2. Confirmaciones de Lectura
❌ **Read receipts** (mensajes leídos)
❌ **Delivered status** (mensajes entregados)

**Implementación sugerida:**
- Agregar campo `read` a tabla `messages`
- Endpoint: `/app/chat.markAsRead`
- Notificar al remitente cuando se lee

### 3. Mensajes Multimedia
❌ **Envío de imágenes**
❌ **Envío de videos**
❌ **Envío de archivos**
❌ **Mensajes de voz**

**Implementación sugerida:**
- Subir archivo a Cloudinary primero (REST)
- Enviar URL del archivo por WebSocket
- Agregar campo `mediaType` y `mediaUrl` a `Message`

### 4. Notificaciones Push
⚠️ **Firebase Push Notifications** (parcialmente implementado)
- Integrar con WebSocket para notificar cuando usuario está offline
- Enviar push notification si usuario no está conectado

### 5. Grupos de Chat
❌ **Chat grupal** (más de 2 participantes)
❌ **Roles en grupos** (admin, miembro)

**Implementación sugerida:**
- Crear tabla `group_chats`
- Crear tabla `group_members`
- Modificar lógica de envío para broadcast a múltiples usuarios

### 6. Reacciones a Mensajes
❌ **Emojis en mensajes**
❌ **Reacciones rápidas**

### 7. Mensajes Temporales
❌ **Mensajes que se autodestruyen**
❌ **Mensajes que expiran**

### 8. Búsqueda en Chat
❌ **Buscar mensajes por contenido**
❌ **Filtrar por fecha**

---

## 🐛 POSIBLES PROBLEMAS

### 1. Escalabilidad
**Problema:** Simple broker en memoria no escala horizontalmente

**Solución:**
```xml
<!-- Usar RabbitMQ o Redis como message broker -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-amqp</artifactId>
</dependency>
```

```java
@Override
public void configureMessageBroker(MessageBrokerRegistry registry) {
    registry.enableStompBrokerRelay("/topic", "/queue")
           .setRelayHost("localhost")
           .setRelayPort(61613);
}
```

### 2. Reconexión Automática
**Problema:** Cliente debe manejar reconexión si se pierde conexión

**Solución en Frontend:**
- Implementar lógica de reconexión exponencial
- Reenviar mensajes pendientes al reconectar

### 3. Orden de Mensajes
**Problema:** Mensajes pueden llegar desordenados en alta concurrencia

**Solución:**
- Usar `sentAt` timestamp para ordenar en cliente
- Implementar sequence numbers

---

## 📝 RECOMENDACIONES

### Para el Frontend

1. **Conectar al WebSocket:**
   ```javascript
   const socket = new SockJS('https://sparkd1-0.onrender.com/ws');
   const stompClient = Stomp.over(socket);
   
   stompClient.connect(
     { Authorization: `Bearer ${token}` },
     (frame) => {
       console.log('Connected:', frame);
       
       // Suscribirse a mensajes
       stompClient.subscribe('/user/queue/messages', (message) => {
         const msg = JSON.parse(message.body);
         console.log('Nuevo mensaje:', msg);
       });
     }
   );
   ```

2. **Enviar mensaje:**
   ```javascript
   stompClient.send('/app/chat.send', {}, JSON.stringify({
     chatId: 'uuid-del-chat',
     content: 'Hola!'
   }));
   ```

3. **Manejo de errores:**
   - Implementar reconexión automática
   - Mostrar indicador de conexión
   - Queue de mensajes pendientes

### Para el Backend

1. **Migrar a message broker externo** (RabbitMQ/Redis) para producción
2. **Implementar typing indicators**
3. **Agregar read receipts**
4. **Implementar notificaciones push cuando usuario offline**
5. **Agregar logs de debugging para WebSocket**

---

## 🎯 CONCLUSIÓN

El sistema WebSocket del backend está **COMPLETO Y FUNCIONAL** para mensajería básica en tiempo real. Incluye:

✅ Autenticación segura con JWT
✅ Envío y recepción de mensajes
✅ Validación de permisos
✅ Moderación de contenido
✅ Persistencia en base de datos
✅ Endpoints REST complementarios

**Estado:** ✅ PRODUCCIÓN READY para chat básico

**Mejoras recomendadas:** Typing indicators, read receipts, mensajes multimedia, y migración a message broker externo para escalabilidad.

---

## 📚 DOCUMENTACIÓN ADICIONAL

### URLs del Backend
- **WebSocket Endpoint:** `wss://sparkd1-0.onrender.com/ws`
- **REST API Base:** `https://sparkd1-0.onrender.com/api`

### Swagger/OpenAPI
- **URL:** `https://sparkd1-0.onrender.com/swagger-ui.html`
- Documentación completa de endpoints REST

### Testing
Para probar WebSocket, usar herramientas como:
- **Postman** (soporta WebSocket)
- **wscat** (CLI)
- **Browser DevTools** (WebSocket inspector)

---

## 🔗 ARCHIVOS RELACIONADOS

### Backend
- `WebSocketConfig.java` - Configuración principal
- `ChatWebSocketController.java` - Controlador de mensajes
- `ChatService.java` - Lógica de negocio
- `Chat.java` - Modelo de chat
- `Message.java` - Modelo de mensaje
- `ChatController.java` - Endpoints REST

### Frontend (a implementar/verificar)
- `use-websocket.ts` - Hook de WebSocket
- `chat/[chatId]/page.tsx` - Página de chat
- Integración con SockJS y STOMP.js
