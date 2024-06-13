<template>
  <div class="container-fluid">
    <h5 class="pt-2 pb-3 border-bottom">Recent Files</h5>
    <div class="pt-2">
      <FilesList :files="files" />
    </div>
  </div>
</template>

<script>
import { recentFiles } from '../api/recent';
import { ref, onMounted } from 'vue';

import FilesList from "../components/files/FilesList.vue";

const getRecentFiles = async () => {
  try {
    const { data } = await recentFiles();

    return data;
  } catch (error) {
    console.log(error);
  }
};

export default {
  components: {
    FilesList
  },
  setup () {

    const files = ref([]);

    onMounted(async () => {
      files.value = await getRecentFiles();
    });

    return { files };
  }
}
</script>