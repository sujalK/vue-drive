import MyFiles from "../pages/MyFiles.vue";
import Recent from "../pages/Recent.vue";
import Starred from "../pages/Starred.vue";

import LoginForm from '../pages/auth/LoginForm.vue'
import RegisterForm from '../pages/auth/RegisterForm.vue';

import Drive from '../pages/Drive.vue';

const routes = [
  {
    path: '/login',
    name: 'login',
    component: LoginForm
  },
  {
    path: '/register',
    name: 'register',
    component: RegisterForm
  },
  // {
  //   path: '/:notFound(.*)',
  //   name: 'error.404.route',
  //   component: RouteNotFound
  // },
  {
    path: '/drive',
    component: Drive,
    // adding meta will affect all children routes
    meta: {
      requiresAuth: true
    },
    children: [
      {
        path: '',
        redirect: {
          name: 'my-files'
        }
      },
      {
        path: 'my-files',
        component: MyFiles,
        name: 'my-files'
      },
      {
        path: 'recent',
        component: Recent,
        name: 'recent'
      },
      {
        path: 'starred',
        component: Starred,
        name: 'starred',
        alias: ['favorites', '/favorites']
      },
      {
        path: 'folders/:folderId',
        name: 'folders',
        component: MyFiles
      }
    ]
  },
];

export default routes;