<template>
  <div class="popup-controls">
    <button class="rounded-button me-2" @click="open = !open, $emit('toggle')">
      <icon-chevron-down v-if="open" />
      <icon-chevron-up v-else />
    </button>
    <button class="rounded-button" @click="$emit('close')">
      <icon-times />
    </button>
  </div>
</template>
<script>
import IconChevronUp from "../../icons/IconChevronUp.vue";
import IconChevronDown from "../../icons/IconChevronDown.vue";
import IconTimes from "../../icons/IconTimes.vue";

export default {
  components: { IconTimes, IconChevronDown, IconChevronUp },
  data: () => ({
    // set open to true, since we want the popup body to get displayed after we choose some files.
    open: true
  }),
  emits: ['close', 'toggle']
}
</script>

<style scoped>

.rounded-button svg {
  fill: #f7f7f7;
}

.rounded-button {
  background: #212529;
}

.rounded-button:hover {
  background: #31363b;
}

</style>