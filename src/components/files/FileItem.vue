<template>
  <div class="col-md-3">
    <div class="card mb-4">

      <img class="file-thumb" :src="file.url" v-if="isValidImage" />

      <div class="card-body text-center py-5" v-else>
        <component :is="iconFileType" height="4em" width="4em" />
<!--        <icon-type-common height="4em" width="4em" />-->
      </div>
      <div class="card-footer">
        <div class="d-flex align-items-center">
          <component :is="iconFileType" />
<!--          <icon-type-common />-->
          <span class="file-name">{{ file.name }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import { computed } from 'vue';

import { useIconFileType } from '../../composable/icon-file-type.js';

export default {
  props: {
    file: {
      type: Object,
      required: true,
    }
  },
  setup(props) {

    const isValidImage = computed(() => {
      const imageMimeTypes = ['image/jpg', 'image/jpeg', 'image/png'];

      return imageMimeTypes.includes(props.file.mimeType) && !!props.file.url;
    });

    return {
      iconFileType: useIconFileType(props.file.mimeType),
      isValidImage
    }
  }
}
</script>