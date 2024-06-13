<template>
  <nav
    class="
      navbar navbar-light
      bg-white
      navbar-expand-lg
      border-bottom
      fixed-top
    "
  >
    <div class="container-fluid">
      <a class="navbar-brand" href="/"><strong>Vue</strong>Drive</a>

<!--      <ul class="navbar-nav me-auto">-->
<!--        <li class="nav-item">-->
<!--          <router-link :to="{ name: 'my-files' }" class="nav-link">My Files</router-link>-->
<!--        </li>-->
<!--        <li class="nav-item">-->
<!--          <router-link :to="{ name: 'recent' }" class="nav-link">Recent</router-link>-->
<!--        </li>-->
<!--        <li class="nav-item">-->
<!--          <router-link :to="{ name: 'starred' }" class="nav-link">Starred</router-link>-->
<!--        </li>-->
<!--        <li class="nav-item">-->
<!--          <a @click.prevent="$router.push('/my-files')" href="#">GO</a>-->
<!--        </li>-->
<!--      </ul>-->

      <div id="search-form"></div>
      <div class="form-inline mt-2 mt-md-0">
        <template v-if="!loggedIn">
          <router-link :to="{ name: 'login' }" href="#" class="btn btn-outline-secondary color-danger me-2">Login</router-link>
          <router-link :to="{ name: 'register' }" href="#" class="btn btn-success me-2">Register</router-link>
        </template>
        <a href="#" @click.prevent="logout" v-else class="btn btn-outline-secondary color-danger">Logout</a>
      </div>
    </div>
  </nav>
</template>

<script>
import { loggedIn, setToken, setUser } from '../store/index'

export default {
  computed: {
    loggedIn() {
      return loggedIn.value;
    }
  },
  methods: {
    logout() {
      setToken(null);
      setUser(null);

      // redirect to login page
      this.$router.push({ name: 'login' });
    }
  }
}
</script>