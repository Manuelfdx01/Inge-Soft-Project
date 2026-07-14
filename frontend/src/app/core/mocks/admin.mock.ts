export const MOCK_METRICS = {
  totales: {
    usuarios:        847,
    puntos_activos:  12,
    puntos_criticos: 1,
    traslados_mes:   23,
  },
  ocupacion_semanal: [
    { dia: 'Lun', promedio_pct: 40 },
    { dia: 'Mar', promedio_pct: 55 },
    { dia: 'Mié', promedio_pct: 48 },
    { dia: 'Jue', promedio_pct: 70 },
    { dia: 'Vie', promedio_pct: 62 },
    { dia: 'Sáb', promedio_pct: 85 },
    { dia: 'Dom', promedio_pct: 94 },
  ],
  propuestas_recientes: [
    { id: 1, title: 'Nuevo punto en Zona Rosa', votes: 124, status: 'EN_REVISION' },
    { id: 2, title: 'Contenedor de electrónicos', votes: 89, status: 'RECIBIDA' },
    { id: 3, title: 'Señalización en Parque Central', votes: 56, status: 'RECIBIDA' },
  ],
  reportes_recientes: [
    { id: 1, type: 'DANO', status: 'PENDIENTE', point__name: 'Cra. 15 #45-23' },
    { id: 2, type: 'MAL_USO', status: 'EN_REVISION', point__name: 'Av. Libertadores' },
    { id: 3, type: 'OTRO', status: 'RESUELTO', point__name: 'Parque Central' },
  ],
  puntos_estado: [
    { id: 2, name: 'Cra. 15 #45-23', capacity_pct: 94, status: 'CRITICO' },
    { id: 3, name: 'Av. Los Libertadores', capacity_pct: 71, status: 'ALERTA' },
    { id: 5, name: 'Barrio El Prado', capacity_pct: 58, status: 'ALERTA' },
    { id: 1, name: 'Parque Central', capacity_pct: 32, status: 'NORMAL' },
    { id: 4, name: 'Centro Comercial Norte', capacity_pct: 18, status: 'NORMAL' },
  ],
};