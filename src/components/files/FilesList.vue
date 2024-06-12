<template>
  <div class="row" @click="clearSelected">
    <FileItem
      v-for="file in files"
      :file="file"
      :key="`file-${file.id}`"
      @click.exact.stop="selectOne(file)"
      @click.meta.exact.stop="selectMultiple(file)"
      :class="{ 'selected-file': isSelected(file) }"
    /> <!-- meta means 'command' in mac and 'windows key' in windows -->
  </div>
</template>

<script>
import FileItem from './FileItem.vue';

import useItemsSelection from '../../composable/items-selection';

export default {
  components: {
    FileItem
  },
  props: {
    files: {
      type: Array,
      required: true
    },
    selected: {
      type: Array,
      default: () => ([])
    }
  },
  setup (props, { emit }) {

    return useItemsSelection(props.selected, emit);
  },
  emits: ['select-change'],
}
</script>