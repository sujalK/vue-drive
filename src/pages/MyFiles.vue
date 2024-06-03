<template>
  <div class="container py-3">
    <ActionBar />

    <div class="d-flex justify-content-between align-items-center py-2">
      <h6 class="text-muted mb-0">Files</h6>
      <button class="rounded-button">
        <icon-arrow-up />
      </button>
    </div>
    <FilesList :files="files" />
  </div>
</template>

<script>
// import axios from 'axios';

import filesApi from "../api/files";
import FilesList from "../components/files/FilesList.vue";

import ActionBar from "../components/ActionBar.vue";


export default {
  components: { ActionBar, FilesList },
  mounted() {
    // we'll make API call here because this hook is called when the component
    // is mounted.

    this.fetchFiles();

  },
  data: () => ({
    files: []
  }),
  methods: {
    // we're replacing this code with the files API that we just created.
    // fetchFiles() {
    //   axios.get('http://localhost:3030/files')
    //     .then(res => {
    //       console.log(res);
    //     })
    //     .catch(error => {
    //       console.log(error);
    //     })
    // }

    // method to fetch files
    async fetchFiles() {
      try {
        const { data } = await filesApi.index();

        this.files = data;
      } catch (error) {
        console.error(error);
      }
    },
  }
};
</script>
