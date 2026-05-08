# Cómo Aprobar Eventos en Sparkd

## Problema Común: "El grupo aún no existe"

Este error aparece cuando intentas actualizar la ubicación de un evento **antes** de que el grupo del evento haya sido creado.

## ¿Por qué sucede esto?

El backend de Sparkd tiene una arquitectura específica:

1. **Crear evento** → Solo crea el registro del evento (NO crea el grupo)
2. **Aprobar primer participante/solicitud grupal** → Aquí se crea el grupo automáticamente
3. **Actualizar ubicación** → Requiere que el grupo exista

## Flujo Correcto para Aprobar un Evento

### Paso 1: Crear el Evento
1. Ve a la página de eventos
2. Crea un nuevo evento con todos los detalles
3. El evento se crea con estado `OPEN`

### Paso 2: Esperar Solicitudes
Los usuarios pueden:
- **Solicitar participación individual**: Un usuario solicita unirse solo
- **Crear solicitud grupal**: Un usuario invita a amigos/matches para unirse juntos

### Paso 3: Aprobar Participantes (CRÍTICO)
**Este paso crea el grupo del evento**

1. Ve a la pestaña **"Requests" (Solicitudes)**
2. Verás dos secciones:
   - **Pendientes individuales**: Usuarios que solicitaron unirse solos
   - **Solicitudes grupales**: Grupos de usuarios que quieren unirse juntos

3. **Aprobar al menos una solicitud**:
   - Click en "Aprobar" en cualquier solicitud
   - Esto crea automáticamente el grupo del evento
   - El usuario aprobado se convierte en miembro del grupo

### Paso 4: Configurar Ubicación
**Solo después de aprobar participantes**

1. Ve a la pestaña **"Settings" (Configuración)**
2. En la sección "Ubicación del evento":
   - Ingresa la dirección exacta
   - Ingresa la zona/barrio
   - Click en "Publicar ubicación en el chat"

3. La ubicación se:
   - Guarda como dirección oficial
   - Publica automáticamente en el chat del grupo
   - Marca como "coincidente" para permitir más aprobaciones

### Paso 5: Aprobar Más Participantes
Una vez que la ubicación está configurada:
- Puedes aprobar más solicitudes individuales
- Puedes aprobar más solicitudes grupales
- Los nuevos miembros verán la ubicación en el chat

## Código Relevante

### Backend: EventGroupService.java (línea 1046)
```java
public void approveGroupJoinRequest(UUID adminUserId, UUID requestId) {
    // ...
    EventGroup group = groupRepository.findByEvent(event).orElseGet(() -> {
        // 👇 AQUÍ SE CREA EL GRUPO
        EventGroup g = new EventGroup();
        g.setEvent(event);
        g.setCreatedAt(Instant.now());
        EventGroup saved = groupRepository.save(g);
        
        // Agregar ADMIN al grupo
        EventGroupMember adminMember = new EventGroupMember();
        adminMember.setGroup(saved);
        adminMember.setUser(event.getCreator());
        adminMember.setEventRole(EventRole.ADMIN);
        adminMember.setJoinedAt(Instant.now());
        memberRepository.save(adminMember);
        
        return saved;
    });
    // ...
}
```

### Backend: EventGroupService.java (línea 289)
```java
public EventGroupMessageResponseDTO updateEventLocation(UUID userId, UUID eventId, UpdateEventLocationDTO dto) {
    // ...
    EventGroup group = groupRepository.findByEvent(event)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, 
            "El grupo aún no existe")); // 👈 ESTE ES EL ERROR
    // ...
}
```

## Mejoras Implementadas

### Frontend: Manejo Inteligente del Error
Ahora el frontend:
1. Intenta actualizar la ubicación
2. Si el grupo no existe (404):
   - Guarda la ubicación como "oficial"
   - Muestra mensaje informativo
   - Indica que debe aprobar participantes primero
3. Si el grupo existe:
   - Publica en el chat
   - Actualiza todo correctamente

### Frontend: Indicador Visual
Se agregó un banner de advertencia en la pestaña "Settings" que muestra:
- ⚠️ "El grupo del evento aún no existe"
- Instrucción clara: "Primero aprueba participantes en la pestaña 'Solicitudes'"

## Resumen del Flujo

```
1. Crear Evento
   ↓
2. Recibir Solicitudes
   ↓
3. Aprobar Primera Solicitud → [CREA EL GRUPO]
   ↓
4. Configurar Ubicación → [PUBLICA EN CHAT]
   ↓
5. Aprobar Más Solicitudes → [NUEVOS MIEMBROS VEN UBICACIÓN]
```

## Preguntas Frecuentes

### ¿Puedo configurar la ubicación antes de aprobar participantes?
Sí, pero solo se guardará como "oficial". No se publicará en el chat hasta que apruebes participantes.

### ¿Cuántas veces puedo cambiar la ubicación?
Máximo 2 veces por evento (limitación del backend).

### ¿Qué pasa si rechazo todas las solicitudes?
El grupo no se creará y no podrás publicar la ubicación en el chat.

### ¿Puedo aprobar solicitudes sin configurar la ubicación?
Sí, pero es recomendable configurar la ubicación primero para que los nuevos miembros la vean inmediatamente.

## Notas Técnicas

- El grupo se crea **lazy** (solo cuando se necesita)
- El creador del evento se agrega automáticamente como ADMIN del grupo
- Los moderadores aprobados también se agregan al grupo automáticamente
- El grupo persiste incluso si todos los miembros se van (excepto el ADMIN)
