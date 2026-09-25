import api, { unwrap } from './api';
export const paymentApi = {
  list: (params) => unwrap(api.get('/payments', { params })), take: (bookingId, b) => unwrap(api.post(`/bookings/${bookingId}/payments`, b)),
  refund: (bookingId, b) => unwrap(api.post(`/bookings/${bookingId}/refund`, b)),
};
