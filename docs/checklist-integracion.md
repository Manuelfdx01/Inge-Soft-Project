# ✅ Checklist de integración final — GOMI

## Flujo Ciudadano
- [ ] Registro con rol CIUDADANO → redirige a /ciudadano/mapa
- [ ] Login → token guardado en localStorage
- [ ] Mapa carga los puntos desde la API (no mock)
- [ ] Filtros del mapa funcionan
- [ ] Clic en pin muestra popup con detalle
- [ ] Panel lateral muestra ocupación ordenada
- [ ] Sección guías de reciclaje carga contenido
- [ ] Sección logros muestra ganados y bloqueados
- [ ] Formulario de reporte funciona y sube foto
- [ ] Formulario de propuesta envía y aparece en admin
- [ ] Notificaciones aparecen en el badge del topbar
- [ ] Cerrar sesión redirige a /login

## Flujo Reciclador
- [ ] Login → redirige a /reciclador/alertas
- [ ] Toggle disponibilidad cambia estado en la API
- [ ] Lista de alertas activas carga correctamente
- [ ] Botón "Aceptar traslado" cambia estado a ACEPTADA
- [ ] Botón "Completar traslado" cambia estado a COMPLETADA
- [ ] Al completar → aparece en "Completados hoy"
- [ ] Notificaciones de alerta asignada aparecen

## Flujo Administrador
- [ ] Login → redirige a /admin/dashboard
- [ ] Dashboard carga métricas reales de la API
- [ ] Gráfica de ocupación semanal se renderiza
- [ ] Tabla de propuestas muestra datos reales
- [ ] Tabla de reportes muestra datos reales
- [ ] Tabla de puntos muestra estados actuales
- [ ] Puede responder propuesta y cambiar estado
- [ ] Puede cambiar estado de un reporte

## Técnico
- [ ] Sin errores en consola del navegador
- [ ] Sin errores 500 en el backend
- [ ] docker compose up --build levanta los 3 servicios
- [ ] Las migraciones corren sin error
- [ ] Los logs se generan en backend/logs/
- [ ] Las pruebas unitarias pasan: python manage.py test
- [ ] Responsive: se ve bien en mobile (375px)
- [ ] Responsive: se ve bien en desktop (1280px)

## Variables de entorno
- [ ] .env.example está actualizado con todas las variables
- [ ] El .env real NO está en el repo
- [ ] SECRET_KEY cambiada a valor seguro en producción
