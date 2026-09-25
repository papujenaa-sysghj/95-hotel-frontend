import api, { unwrap } from './api';
export const authApi = {
  login: (b) => unwrap(api.post('/auth/login', b)), logout: () => api.post('/auth/logout'), me: () => unwrap(api.get('/auth/me')),
  forgot: (email) => unwrap(api.post('/auth/forgot-password', { email })), reset: (b) => unwrap(api.post('/auth/reset-password', b)),
  changePassword: (b) => unwrap(api.post('/auth/change-password', b)), loginActivity: () => unwrap(api.get('/auth/login-activity')),
};
