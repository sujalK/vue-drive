import { reactive, computed, watch } from 'vue';

const defaultState = {
  accessToken: null,
  user: null
};

const initState = () => JSON.parse(localStorage.getItem('authState')) || defaultState;

const state = reactive(initState());

watch(state, (newState) => {
  localStorage.setItem('authState', JSON.stringify(newState));
})

export const accessToken = () => state.accessToken;

export const loggedIn = computed(() => !!accessToken()); // using !!
// to only return a boolean value instead of a string

export const setToken = (token) => state.accessToken = token;
export const setUser  = (user)  => state.user        = user;