<template>
  <div class="container-fluid py-3">
    <div class="row">
      <div class="col-md-2">
        <Sidebar />
      </div>
      <div class="col-md-10">
        <!--
          Children routes (nested routes) component will be placed/loaded here
        -->
        <router-view />
      </div>
    </div>
  </div>
</template>
<script>
import Sidebar from "../components/Sidebar.vue";

export default {
  components: { Sidebar }
}
</script>