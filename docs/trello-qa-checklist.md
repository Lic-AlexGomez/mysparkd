# Trello QA Checklist — Frontend

Usar antes de mover una card a **Terminado**.

## Gate obligatorio

1. Matriz [`trello-fe-parity-matrix.json`](./trello-fe-parity-matrix.json): `web`/`mobile` = DONE en plataforma objetivo
2. Backend verificado (controller o smoke API)
3. Tests unitarios pasan:
   - Web: `cd v0-social && npm test`
   - Mobile: `cd v0-social-mobile && npm test`
4. QA manual (pasos abajo)
5. Mover a **En test/Desarrollando /Frontend** → smoke → **Terminado**

## Comandos

```bash
# Marcar cards listas tras tests
node scripts/trello-audit-move.mjs --mark-tests-pass 257,259,262

# Preview
node scripts/trello-audit-move.mjs --dry-run --to-done

# Mover a En test
node scripts/trello-audit-move.mjs --to-test

# Mover a Terminado
node scripts/trello-audit-move.mjs --to-done
```

## Plantilla comentario Trello

```
**Cierre QA frontend** (YYYY-MM-DD)
- Plataforma: Web / Mobile / Both
- Archivos: ...
- Tests: npm test (N passed)
- Pasos QA: ...
```

## Smoke por área

| Área | Pasos |
|------|-------|
| Chat tabs | Abrir /chat → ver Directos/General → badges unread |
| Move category | Long-press chat → mover DIRECT↔GENERAL |
| Event rating | Evento FINISHED + APPROVED → calificar 1-5 |
| Profile counts | Perfil ajeno → chips eventos creados/cancelados |
| Activity feed | Filtros tipo + sort NEWER/OLDER |
| Smart search | Buscar usuario/hashtag/post |
| Group polls (web) | Crear encuesta en grupo social |
| Passkeys | Registrar + login + eliminar en ajustes |
