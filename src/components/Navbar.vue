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
    </div>
  </nav>
</template>
