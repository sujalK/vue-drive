import { createRouter, createWebHistory } from 'vue-router';

import routes from './routes';

export default createRouter({
  routes,
  history: createWebHistory(),
  // add class name that we want for active link classes
  // linkActiveClass: 'active',
})