# Configuración CORS para WebSocket

## Problema
El WebSocket falla en localhost porque `CorsConfig.java` solo tiene configurado el puerto 8081, pero el frontend corre en los puertos 3000 y 3001.

## Solución

### 1. Actualizar `CorsConfig.java` (CRÍTICO)

Este es el problema principal. Cambiar:

```java
@Bean
public WebMvcConfigurer corsConfigurer() {
    return new WebMvcConfigurer() {
        @Override
        public void addCorsMappings(CorsRegistry registry) {
            registry.addMapping("/**")  // Cambiar de /api/** a /**
                    .allowedOrigins(
                        "http://localhost:8081",
                        "http://localhost:3000", 
                        "http://localhost:3001", 
                    )
                    .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH")
                    .allowedHeaders("*")  
                    .allowCredentials(true);
        }
    };
}
```

### 2. Verificar `WebSocketConfig.java` (Ya está correcto)

Ya tiene los puertos configurados:

```java
@Override
public void registerStompEndpoints(StompEndpointRegistry registry) {
    registry.addEndpoint("/ws")
            .setAllowedOrigins(
                "http://localhost:3000",
                "http://localhost:3001"
            )
            .withSockJS();
}
```

P

```java
@Override
public void registerStompEndpoints(StompEndpointRegistry registry) {
    registry.addEndpoint("/ws")
            .setAllowedOrigins(
                "http://localhost:3000",
                "http://localhost:3001",

            )
            .withSockJS();
}
```

### 3. Después de Aplicar los Cambios

Una vez que el backend esté actualizado, habilitar WebSocket en localhost editando:
- `hooks/use-websocket.ts` - Cambiar `IS_LOCALHOST` a `false` o eliminar la validación

## Por Qué Falla en Localhost

1. ✅ `WebSocketConfig.java` tiene los puertos 3000 y 3001
2. ❌ `CorsConfig.java` solo tiene el puerto 8081
3. 🔍 SockJS hace peticiones HTTP antes de establecer WebSocket
4. ❌ Esas peticiones HTTP son bloqueadas por CORS
5. 💥 WebSocket nunca se establece

## Estado Actual

❌ WebSocket deshabilitado en localhost
✅ WebSocket habilitado en producción (con errores CORS)
✅ Chat funciona con HTTP fallback

## Después de la Configuración

✅ WebSocket funcionando en localhost
✅ WebSocket funcionando en producción
✅ Mensajes en tiempo real
✅ Sin errores de CORS
