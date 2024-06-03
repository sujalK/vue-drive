<template>
  <div class="row">
    <FileItem v-for="file in files" :file="file" :key="`file-${file.id}`" />
  </div>
</template>
<script>
import FileItem from "./FileItem.vue";

export default {
  // register it as a local component
  components: {
    FileItem
  },
  props: {
    files: {
      type: Array,
      required: true
    }
  }
}
</script>