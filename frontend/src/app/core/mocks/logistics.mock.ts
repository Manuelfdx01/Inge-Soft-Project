export const MOCK_ALERTS = [
  {
    id: '1',
    origin_point: {
      id: '2', name: 'Cra. 15 #45-23',
      capacity_pct: 94, address: 'Carrera 15 #45-23, Bogotá',
    },
    target_point: {
      id: '1', name: 'Parque Central',
      capacity_pct: 32, address: 'Cra. 5 #10-23, Bogotá',
    },
    waste_type: 'PLASTICO',
    priority: 'ALTA',
    status: 'PENDIENTE',
    distance_km: 1.2,
    reciclador_username: null,
    created_at: new Date(Date.now() - 12 * 60000).toISOString(),
  },
  {
    id: '2',
    origin_point: {
      id: '3', name: 'Av. Los Libertadores',
      capacity_pct: 71, address: 'Av. Los Libertadores #12, Bogotá',
    },
    target_point: {
      id: '4', name: 'Centro Comercial Norte',
      capacity_pct: 18, address: 'Autopista Norte #180-10, Bogotá',
    },
    waste_type: 'VIDRIO',
    priority: 'MEDIA',
    status: 'PENDIENTE',
    distance_km: 2.8,
    reciclador_username: null,
    created_at: new Date(Date.now() - 60 * 60000).toISOString(),
  },
  {
    id: '3',
    origin_point: {
      id: '5', name: 'Barrio El Prado',
      capacity_pct: 58, address: 'Calle 72 #25-30, Bogotá',
    },
    target_point: {
      id: '1', name: 'Parque Central',
      capacity_pct: 32, address: 'Cra. 5 #10-23, Bogotá',
    },
    waste_type: 'PAPEL',
    priority: 'BAJA',
    status: 'COMPLETADA',
    distance_km: 0.9,
    reciclador_username: 'carlos_r',
    created_at: new Date(Date.now() - 5 * 3600000).toISOString(),
  },
];