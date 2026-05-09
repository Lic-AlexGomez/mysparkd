# Troubleshooting: Solicitudes Pendientes No Aparecen

## Problema
Solicitaste participación con otro usuario pero no aparece en la pestaña "Requests" (Solicitudes).

## Diagnóstico Paso a Paso

### Paso 1: Verificar que la solicitud se creó en el backend

1. **Abre la consola del navegador** (F12)
2. **Ve a la pestaña Network**
3. **Con el segundo usuario, solicita participación** al evento
4. **Busca la petición POST** a `/api/events/{eventId}/join`
5. **Verifica la respuesta**:
   - ¿Status 200 OK?
   - ¿Hay un objeto con `status: "PENDING"`?

**Si falla aquí:**
- Revisa los logs del backend
- Verifica que el usuario no sea el creador del evento
- Verifica que el evento no esté lleno o cancelado

### Paso 2: Verificar que el usuario admin puede ver las solicitudes

1. **Con el usuario creador del evento**, recarga la página del evento
2. **Abre la consola del navegador** (F12)
3. **Busca estos logs**:

```
[EventDetail] Verificación de admin: {
  myUserId: "...",
  creatorId: "...",
  myRole: "...",
  memberRole: "...",
  isAdminLoaded: true/false,
  detailKeys: [...]
}
```

**Verifica:**
- ¿`isAdminLoaded` es `true`?
- ¿`myUserId` coincide con `creatorId`?
- ¿`myRole` es "ADMIN"?

**Si `isAdminLoaded` es `false`:**
- El problema está en la detección de admin
- Continúa al Paso 3

**Si `isAdminLoaded` es `true`:**
- Continúa al Paso 4

### Paso 3: Verificar respuesta del endpoint GET /api/events/{eventId}

1. **En la consola del navegador**, busca la petición GET a `/api/events/{eventId}`
2. **Revisa la respuesta JSON**:

```json
{
  "id": "...",
  "creatorId": "...",
  "myRole": "ADMIN",
  "myStatus": "APPROVED",
  ...
}
```

**Verifica:**
- ¿Existe el campo `creatorId`?
- ¿Existe el campo `myRole`?
- ¿`myRole` es "ADMIN"?

**Si faltan estos campos:**
- El backend no está devolviendo la información correcta
- Revisa `EventService.buildResponseDTO()` en el backend

### Paso 4: Verificar que se llama al endpoint de solicitudes pendientes

1. **Con el usuario admin**, recarga la página del evento
2. **En la consola del navegador**, busca estos logs:

```
[EventDetail] Cargando datos de admin...
[EventDetail] Datos de admin cargados: {
  inviteLinks: 0,
  pendingParticipants: 0,
  pendingGroupRequests: 0,
  pendingUsersData: []
}
```

3. **En la pestaña Network**, busca la petición GET a:
   - `/api/events/{eventId}/participants/pending`

**Verifica:**
- ¿Se hace la petición?
- ¿Status 200 OK?
- ¿Qué devuelve el body?

**Si no se hace la petición:**
- El problema está en el Paso 2 (detección de admin)

**Si la petición devuelve array vacío `[]`:**
- El backend no encuentra solicitudes pendientes
- Continúa al Paso 5

**Si la petición devuelve datos:**
- El problema está en el frontend
- Continúa al Paso 6

### Paso 5: Verificar en la base de datos

**Conecta a tu base de datos** y ejecuta:

```sql
-- Ver todas las solicitudes del evento
SELECT 
  ep.id,
  ep.status,
  ep.role,
  u.username,
  ep.requested_at,
  ep.responded_at
FROM event_participants ep
JOIN users u ON ep.user_id = u.user_id
WHERE ep.event_id = 'TU_EVENT_ID_AQUI'
ORDER BY ep.requested_at DESC;
```

**Verifica:**
- ¿Existe la solicitud del segundo usuario?
- ¿El `status` es `PENDING`?
- ¿El `role` es `GUEST`?

**Si no existe la solicitud:**
- El POST `/api/events/{eventId}/join` falló silenciosamente
- Revisa los logs del backend

**Si existe pero el status no es PENDING:**
- Alguien ya aprobó/rechazó la solicitud
- O hay un problema en el backend

**Si existe con status PENDING:**
- El problema está en el endpoint GET `/api/events/{eventId}/participants/pending`
- Continúa al Paso 7

### Paso 6: Verificar el estado del frontend

1. **En la consola del navegador**, ejecuta:

```javascript
// Ver el estado de pendingParticipants
console.log('Pending Participants:', window.location.href)
```

2. **Inspecciona el componente** con React DevTools:
   - Busca el componente `EventDetailPage`
   - Ve al estado `pendingParticipants`
   - ¿Está vacío o tiene datos?

**Si tiene datos:**
- El problema está en el renderizado
- Verifica que estés en la pestaña "Requests"

**Si está vacío:**
- Los datos no se están guardando en el estado
- Revisa los logs del Paso 4

### Paso 7: Verificar el método getPendingRequests del backend

**Revisa el código del backend:**

```java
// EventService.java línea ~450
public List<EventParticipantResponseDTO> getPendingRequests(UUID requesterId, UUID eventId) {
    Event event = loadEvent(eventId);
    requireAdminOrModerator(requesterId, event);

    return participantRepository.findAllByEventWithUser(event).stream()
            .filter(p -> p.getStatus() == EventParticipantStatus.PENDING)
            .map(this::buildParticipantDTO)
            .collect(Collectors.toList());
}
```

**Verifica:**
- ¿El método `requireAdminOrModerator` está lanzando una excepción?
- ¿El filtro `.filter(p -> p.getStatus() == EventParticipantStatus.PENDING)` está funcionando?

**Para debuggear:**
1. Agrega logs en el backend:

```java
public List<EventParticipantResponseDTO> getPendingRequests(UUID requesterId, UUID eventId) {
    Event event = loadEvent(eventId);
    requireAdminOrModerator(requesterId, event);

    List<EventParticipant> all = participantRepository.findAllByEventWithUser(event);
    System.out.println("[EventService] Total participants: " + all.size());
    
    List<EventParticipant> pending = all.stream()
            .filter(p -> {
                boolean isPending = p.getStatus() == EventParticipantStatus.PENDING;
                System.out.println("[EventService] User: " + p.getUser().getUsername() + 
                                   ", Status: " + p.getStatus() + 
                                   ", isPending: " + isPending);
                return isPending;
            })
            .collect(Collectors.toList());
    
    System.out.println("[EventService] Pending participants: " + pending.size());
    
    return pending.stream()
            .map(this::buildParticipantDTO)
            .collect(Collectors.toList());
}
```

2. Reinicia el backend
3. Recarga la página del evento
4. Revisa los logs del backend

## Soluciones Comunes

### Solución 1: El usuario no es detectado como admin

**Problema:** `isAdminLoaded` es `false` aunque seas el creador.

**Solución:**
1. Verifica que el backend devuelva `creatorId` en el DTO
2. Verifica que el backend devuelva `myRole: "ADMIN"` en el DTO
3. Si el grupo no existe, el usuario no será miembro del grupo (pero sigue siendo admin por ser creador)

### Solución 2: El endpoint requiere autenticación

**Problema:** El endpoint devuelve 401 o 403.

**Solución:**
1. Verifica que el token JWT esté en las cookies
2. Verifica que el token no haya expirado
3. Reloguea si es necesario

### Solución 3: El participante ya fue aprobado/rechazado

**Problema:** La solicitud existe pero no aparece en pendientes.

**Solución:**
1. Verifica el status en la base de datos
2. Si no es PENDING, crea una nueva solicitud con otro usuario
3. O cambia el status manualmente en la base de datos:

```sql
UPDATE event_participants 
SET status = 'PENDING', responded_at = NULL
WHERE id = 'PARTICIPANT_ID_AQUI';
```

### Solución 4: El creador del evento no tiene participación

**Problema:** El creador no aparece en `event_participants`.

**Solución:**
Esto es normal. El creador se agrega automáticamente al crear el evento con status APPROVED.
Verifica en la base de datos:

```sql
SELECT * FROM event_participants 
WHERE event_id = 'TU_EVENT_ID' 
AND role = 'ADMIN';
```

Si no existe, hay un bug en `EventService.createEvent()`.

## Checklist Rápido

- [ ] La solicitud se creó correctamente (POST 200 OK)
- [ ] El usuario admin está autenticado
- [ ] `isAdminLoaded` es `true` en los logs
- [ ] Se llama a GET `/api/events/{eventId}/participants/pending`
- [ ] El endpoint devuelve 200 OK
- [ ] El endpoint devuelve un array (vacío o con datos)
- [ ] Si devuelve datos, se guardan en `pendingParticipants`
- [ ] Estás en la pestaña "Requests"
- [ ] La solicitud existe en la base de datos con status PENDING

## Siguiente Paso

Una vez que identifiques en qué paso falla, comparte:
1. El número del paso donde falla
2. Los logs relevantes
3. La respuesta del endpoint (si aplica)
4. El resultado de la query SQL (si aplica)

Con esa información podré darte una solución específica.
