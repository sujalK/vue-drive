<template>
  <div class="d-flex justify-content-between align-items-center py-2">
    <h6 class="text-muted mb-0">{{ title }}</h6>
    <SortToggler @sort-change="$emit('sort-change', $event)" v-if="sortToggler" />
  </div>
</template>

<script>
import SortToggler from "./SortToggler.vue";

export default {
  props: {
    title: {
      type: String,
      required: true
    },
    sortToggler: {
      type: Boolean,
      default: false
    }
  },
  components: { SortToggler },
  emits: ['sort-change']
}
</script>