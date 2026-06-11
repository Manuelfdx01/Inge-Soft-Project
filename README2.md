# Recicla Ciudad 🌱

Sistema inteligente de gestión de residuos urbanos.

## Stack
- **Frontend:** Angular + TypeScript
- **Backend:** Django + Python
- **Base de datos:** PostgreSQL
- **Infraestructura:** Docker

## Roles
- Ciudadano
- Reciclador
- Administrador

## Levantar el proyecto

### Requisitos
- Docker Desktop instalado

### Pasos
1. Clonar el repositorio
2. Copiar variables de entorno
```bash
   cp .env.example .env
```
3. Levantar los servicios
```bash
   docker compose up --build
```

### URLs locales
| Servicio | URL |
|---|---|
| Frontend | http://localhost:4200 |
| Backend API | http://localhost:8000/api |
| Admin Django | http://localhost:8000/admin |

## Estructura del proyecto
recicla-ciudad/
├── frontend/     ← Angular
├── backend/      ← Django
│   ├── apps/     ← Módulos
│   └── config/   ← Configuración
└── docker-compose.yml

## Ramas
- `main` → producción
- `develop` → integración
- `feat/*` → funcionalidades
