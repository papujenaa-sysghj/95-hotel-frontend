import api, { unwrap } from './api';
// Generic REST helper for simple CRUD resources (users, guests, room-types, ...)
export const resource = (path) => ({
  list: (params) => unwrap(api.get(`/${path}`, { params })), create: (b) => unwrap(api.post(`/${path}`, b)),
  update: (id, b) => unwrap(api.put(`/${path}/${id}`, b)), remove: (id) => unwrap(api.delete(`/${path}/${id}`)),
});
export const dashboardApi = {
  summary: (params) => unwrap(api.get('/dashboard', { params })), occupancy: (days) => unwrap(api.get('/dashboard/occupancy', { params: { days } })),
  revenue: (params) => unwrap(api.get('/dashboard/revenue', { params })),
};
