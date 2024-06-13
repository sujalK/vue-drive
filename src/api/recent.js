import http from './http.js';

export const recentFiles = () =>
  http.get('/files?_sort=createdAt&_order=desc');
