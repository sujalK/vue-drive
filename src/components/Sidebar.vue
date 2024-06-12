<template>
  <nav class="nav nav-pills flex-column pt-2">
    <router-link
      class="nav-link d-flex align-items-center"
      :to="{ name: 'my-files' }">
      <icon-hdd /> <span class="ms-2">My Files</span>
    </router-link>
    <router-link
      class="nav-link d-flex align-items-center"
      :to="{ name: 'recent' }">
      <icon-clock /> <span class="ms-2">Recent</span>
    </router-link>
    <router-link
      class="nav-link d-flex align-items-center"
      :to="{ name: 'starred' }">
      <icon-star /> <span class="ms-2">Starred</span>
    </router-link>
  </nav>
</template>

<script setup>
import IconHdd from './icons/IconHdd.vue';
import IconClock from './icons/IconClock.vue';
import IconStar from './icons/IconStar.vue';
</script>

<style scoped>
/*.nav-pills .nav-link.router-link-active {*/
/*  color: #fff;*/
/*  background-color: #0d6efd;*/
/*}*/

.router-link-active {
  background: #0d6efd;
  color: #fff;
}
</style>