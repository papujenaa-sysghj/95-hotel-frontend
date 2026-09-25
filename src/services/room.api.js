import api, { unwrap } from './api';
export const roomApi = {
  rooms: (params) => unwrap(api.get('/rooms', { params })), types: () => unwrap(api.get('/room-types')), amenities: () => unwrap(api.get('/amenities')),
  acNotWorking: (id, b) => unwrap(api.post(`/rooms/${id}/ac-not-working`, b)), acRepaired: (id) => unwrap(api.post(`/rooms/${id}/ac-repaired`)),
  setMaintenanceStatus: (id, status) => unwrap(api.patch(`/rooms/${id}/maintenance-status`, { status })),
  housekeeping: () => unwrap(api.get('/housekeeping')), setHousekeeping: (id, status) => unwrap(api.patch(`/housekeeping/rooms/${id}`, { status })),
};
