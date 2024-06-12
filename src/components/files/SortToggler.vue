<template>
  <button @click="toggle" class="rounded-button">
    <icon-arrow-up v-if="sort.order === 'asc'" />
    <icon-arrow-down v-else />
  </button>
</template>
<script>
import { reactive } from 'vue';

export default {
  setup (props, { emit }) {
    // it's better to group primitive data types that belongs together (key/value pair in object form)
    // This function takes an object and return a reactive proxy to the original object.
    // Using reactive() would require reassigning a property instead of the whole
    // object.
    const sort = reactive({
      column : 'name',
      order  : 'asc'
    });

    const toggle = () => {
      sort.order = sort.order === 'asc' ? 'desc' : 'asc';

      // end to the parent component an event using emit() function.
      emit('sort-change', sort);
    };

    return {
      sort,
      toggle
    };
  },
  emits: ['sort-change'],
}
</script>