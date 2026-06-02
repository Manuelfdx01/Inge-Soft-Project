# Inge-Soft-Project

#Sistema Inteligente de Gestión de Reciclaje Urbano 🌿♻️

¡Bienvenido al repositorio oficial del proyecto. Este proyecto ha sido desarrollado en el marco de la asignatura **Ingeniería de Software I** de la **Universidad Nacional de Colombia - Sede Bogotá**.

Este es una plataforma tecnológica diseñada para optimizar la gestión de residuos y fomentar la cultura del reciclaje en la ciudad. A través de un mapa interactivo en tiempo real, el sistema conecta a ciudadanos, recicladores de oficio y administradores para evitar la saturación de los puntos de acopio, facilitar el intercambio de residuos y educar a la comunidad.

---

## 🚀 Características Principales (Requerimientos Funcionales)

El sistema está dividido en módulos estratégicos para atender a tres tipos de roles (Ciudadano, Reciclador y Administrador):

* **🗺️ Mapa de Residuos en Tiempo Real:** Visualización interactiva de los puntos de reciclaje activos con filtros por tipo de residuo (vidrio, plástico, metal, papel, orgánico, etc.).
* **📊 Indicador de Capacidad:** Monitoreo del porcentaje de ocupación de cada punto con alertas visuales para evitar el desbordamiento.
* **🔄 Logística e Intercambio Inteligente:** Algoritmo que genera alertas cuando un punto está crítico para coordinar el traslado de residuos hacia puntos vacíos con el apoyo de recicladores cercanos.
* **🧑‍🤝‍🧑 Rol Especial de Reciclador:** Permite a los recicladores activar su disponibilidad en zona y reportar novedades detalladas sobre el estado de los contenedores.
* **📚 Guía de Reciclaje y Gamificación:** Sección informativa interactiva con guías de clasificación y un sistema de logros (ej. *Iniciador del cambio*, *Defensor del papel*) para motivar a los usuarios.
* **📢 Participación Ciudadana y Reportes:** Buzón para proponer mejoras en la gestión de la ciudad y herramientas para reportar el mal uso o daños en los puntos de acopio.
* **📈 Panel de Administración Centralizado:** Control total de usuarios, puntos de reciclaje, métricas de uso y gestión de propuestas ciudadanas.

---

## 🛠️ Stack Tecnológico

Para garantizar un desarrollo escalable, mantenible y robusto, el proyecto adopta una **Arquitectura de Tres Capas** (Frontend, Backend y Datos) con las siguientes tecnologías:

* **Frontend:**
    * ![Angular](https://img.shields.io/badge/angular-%23DD0031.svg?style=for-the-badge&logo=angular&logoColor=white) **Angular** (Framework para una interfaz web/app responsiva e intuitiva).
    * ![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white) **TypeScript** (Garantiza código robusto y tipado).
* **Backend:**
    * ![Python](https://img.shields.io/badge/python-3670A0?style=for-the-badge&logo=python&logoColor=ffdd54) **Python** (Para el core de las reglas de negocio y algoritmos).
    * ![Django](https://img.shields.io/badge/django-%23092E20.svg?style=for-the-badge&logo=django&logoColor=white) **Django** (Framework backend de alto nivel).
* **Base de Datos:**
    * ![PostgreSQL](https://img.shields.io/badge/postgresql-%23316192.svg?style=for-the-badge&logo=postgresql&logoColor=white) / ![MySQL](https://img.shields.io/badge/mysql-%2300f.svg?style=for-the-badge&logo=mysql&logoColor=white) **PostgreSQL / MySQL** (Para el almacenamiento consistente de usuarios y centros de acopio).
* **Integraciones:**
    * **APIs de Mapas:** Google Maps / Mapbox (Geolocalización vía GPS).

---

## 📐 Diseño y Arquitectura de Software

El backend se rige bajo el paradigma de **Programación Orientada a Objetos (POO)** e implementa patrones de diseño clave para cumplir con los Requerimientos No Funcionales (RNF):

* **Patrón Adapter (Estructural):** Desacopla el módulo de mapas de la API específica (Google Maps), facilitando la migración futura a otros proveedores sin alterar el código fuente (Mantenibilidad).
* **Patrón Singleton (Creacional):** Garantiza una única instancia de conexión al servidor y base de datos al renderizar el mapa, evitando la saturación del servidor bajo alta concurrencia (Escalabilidad y Rendimiento).

---

## 🔒 Atributos de Calidad Destacados (RNF)

* **Seguridad y Privacidad:** Datos cifrados en tránsito (HTTPS/TLS) y en reposo. **Bajo ninguna circunstancia los datos de los usuarios serán utilizados para entrenar modelos de Inteligencia Artificial.**
* **Accesibilidad:** Interfaz diseñada bajo principios WCAG 2.1 para asegurar la inclusión de personas con discapacidad.
* **Portabilidad:** Estructura preparada para despliegues en múltiples entornos mediante contenedores Docker.
* **Mantenibilidad y Tolerancia a Fallos:** Código debidamente documentado, con pruebas unitarias y un sistema estricto de registro de logs estructurado por niveles de severidad (INFO, WARN, ERROR).

---

## 🎨 Vista Previa del Diseño (Mockups)

La interfaz gráfica del usuario final (Ciudadano y Reciclador) contempla vistas accesibles y dinámicas:

> *Nota: Puedes visualizar las maquetas completas y el flujo de pantallas en la carpeta de diseño del repositorio (`/docs/mockups`).*

---

## 🏫 Créditos e Institución

Este proyecto es de fines estrictamente académicos.
* **Autores:** ~~
* **Institución:** Universidad Nacional de Colombia (UNAL) - Sede Bogotá
* **Facultad:** Ingeniería
* **Asignatura:** Ingeniería de Software I
* **Año:** 2026

---
¡Hecho con ❤️ por estudiantes de la UNAL.
