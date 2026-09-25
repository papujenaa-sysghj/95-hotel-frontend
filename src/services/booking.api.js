import api, { unwrap } from './api';
export const bookingApi = {
  list: (params) => unwrap(api.get('/bookings', { params })), get: (id) => unwrap(api.get(`/bookings/${id}`)),
  availability: (params) => unwrap(api.get('/bookings/availability', { params })), create: (b) => unwrap(api.post('/bookings', b)),
  update: (id, b) => unwrap(api.put(`/bookings/${id}`, b)), extend: (id, b) => unwrap(api.patch(`/bookings/${id}/extend`, b)),
  changeRoom: (id, b) => unwrap(api.patch(`/bookings/${id}/change-room`, b)), cancel: (id, reason) => unwrap(api.patch(`/bookings/${id}/cancel`, { reason })),
  noShow: (id) => unwrap(api.patch(`/bookings/${id}/no-show`)), move: (id, b) => unwrap(api.patch(`/calendar/bookings/${id}/move`, b)),
  calendar: (params) => unwrap(api.get('/calendar', { params })), arrivals: () => unwrap(api.get('/check-in/arrivals')), departures: () => unwrap(api.get('/check-out/departures')),
  checkIn: (id) => unwrap(api.post(`/check-in/${id}`)), checkOut: (id, body) => unwrap(api.post(`/check-out/${id}`, body || {})),
};
