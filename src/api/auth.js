import http from './http';

export const register = (data) => http.post('/register', data);
export const login    = (data) => http.post('/login', data);