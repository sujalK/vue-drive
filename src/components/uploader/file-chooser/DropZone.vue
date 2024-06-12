<template>
  <div
    class="dropzone"
    @dragover.prevent="dragged = true"
    @dragleave.prevent="dragged = false"
    @drop.prevent="handleDrop"
    :class="{ 'dragged-over': dragged }"
  >
    <DropZoneMessage v-show="showMessage" />
    <slot />
  </div>
</template>

<script>
import DropZoneMessage from './DropZoneMessage.vue';

import { ref } from "vue";

export default {
  props: {
    showMessage: {
      type: Boolean,
      default: true
    }
  },
  components: { DropZoneMessage },
  setup (props, { emit }) {

    // stores the dragging state
    const dragged = ref(false);

    const handleDrop = (event) => {
      dragged.value = false;
      emit('files-dropped', event.dataTransfer.files);
    };

    return {
      dragged,
      handleDrop
    }
  },
  emits: ['files-dropped'],
}

</script>

<style>
.dropzone {
  min-height: 80vh;
  border: 2px solid white;
  background: white;
  padding: 0.3em;
}

.dragged-over {
  background: #e8f0fe;
  border: 2px solid #4285f4;
}
</style>