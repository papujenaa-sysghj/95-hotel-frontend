import api, { unwrap } from './api';

export const roomApi = {
  rooms: (params) => unwrap(api.get('/rooms', { params })),
  list: (params) => unwrap(api.get('/rooms', { params })),
  get: (id) => unwrap(api.get(`/rooms/${id}`)),
  create: (body) => unwrap(api.post('/rooms', body)),
  update: (id, body) => unwrap(api.put(`/rooms/${id}`, body)),
  remove: (id) => unwrap(api.delete(`/rooms/${id}`)),
  types: () => unwrap(api.get('/room-types')),
  amenities: () => unwrap(api.get('/amenities')),
  acNotWorking: (id, b) => unwrap(api.post(`/rooms/${id}/ac-not-working`, b)),
  acRepaired: (id) => unwrap(api.post(`/rooms/${id}/ac-repaired`)),
  setMaintenanceStatus: (id, status) => unwrap(api.patch(`/rooms/${id}/maintenance-status`, { status })),
  housekeeping: () => unwrap(api.get('/housekeeping')),
  setHousekeeping: (id, status) => unwrap(api.patch(`/housekeeping/rooms/${id}`, { status })),
};

