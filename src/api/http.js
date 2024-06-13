import axios from 'axios'
import {accessToken, setToken, setUser} from "../store";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;
// const BASE_URL = process.env.VUE_APP_API_BASE_URL;

const http = axios.create({
  // baseURL: 'https://localhost:3030',
  baseURL: BASE_URL
});

/**
 * Note: to get each user-specific data  i.e. files and folders, we need to send user id on each request.
 */

http.interceptors.request.use((config) => {
  // set authorization header
  config.headers.Authorization = `Bearer: ${accessToken()}`;

  return config;
}, (error) => {
  return Promise.reject(error);
});

http.interceptors.response.use((response) => {

  return response;
}, (error) => {

  if (error.response.status === 403) {
    setUser(null);
    setToken(null);

    window.location.reload()
  } else {
    return Promise.reject(error);
  }

});

export default http;