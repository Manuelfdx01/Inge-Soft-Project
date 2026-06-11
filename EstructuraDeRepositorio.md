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

## URLs locales

| Servicio     | URL                         |
| ------------ | --------------------------- |
| Frontend     | http://localhost:4200       |
| Backend API  | http://localhost:8000/api   |
| Admin Django | http://localhost:8000/admin |

---

## Estructura del proyecto

```bash
recicla-ciudad/
├── frontend/                # Aplicación Angular
├── backend/                 # API Django
│   ├── apps/                # Módulos y aplicaciones
│   └── config/              # Configuración principal
└── docker-compose.yml       # Orquestación de servicios
```

---

## Estrategia de ramas

| Rama       | Propósito                           |
| ---------- | ----------------------------------- |
| `main`     | Producción                          |
| `develop`  | Integración y testing               |
| `feat/*`   | Nuevas funcionalidades              |
| `fix/*`    | Corrección de errores               |
| `hotfix/*` | Correcciones urgentes en producción |

---

