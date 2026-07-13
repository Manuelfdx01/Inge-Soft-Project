export const MOCK_USER_CIUDADANO = {
  id: '1',
  username: 'maria123',
  email: 'maria@email.com',
  role: 'CIUDADANO' as const,
  points: 480,
  is_available: false,
};

export const MOCK_USER_RECICLADOR = {
  id: '2',
  username: 'carlos_r',
  email: 'carlos@email.com',
  role: 'RECICLADOR' as const,
  points: 1200,
  is_available: true,
};

export const MOCK_USER_ADMIN = {
  id: '3',
  username: 'admin_gomi',
  email: 'admin@gomi.co',
  role: 'ADMIN' as const,
  points: 0,
  is_available: false,
};

export const MOCK_TOKEN = {
  access: 'mock-access-token-123',
  refresh: 'mock-refresh-token-456',
};