<template>
  <svg :height="radius * 2" :width="radius * 2">
    <circle
      stroke="#ccc"
      :stroke-width="strokeWidth"
      fill="transparent"
      :cx="radius"
      :cy="radius"
      :r="normalizeRadius"
    ></circle>
    <circle
      class="progress-ring"
      stroke="#3881ff"
      :stroke-width="strokeWidth"
      fill="transparent"
      :cx="radius"
      :cy="radius"
      :r="normalizeRadius"
      :stroke-dasharray="`${circumference} ${circumference}`"
      :stroke-dashoffset="strokeDashOffset"
    ></circle>
  </svg>
</template>
<script>

import { computed } from "vue";

export default {
  props: {
    radius: {
      type: Number,
      default: 16
    },
    strokeWidth: {
      type: Number,
      default: 3
    },
    progress: {  // holds uploading percentage
      type: Number,
      default: 0
    }
  },
  setup (props) {
    const normalizeRadius = computed(() => props.radius - props.strokeWidth * 2);

    // circumference = normalizedRadius * 2 * PI
    const circumference = computed(() => normalizeRadius.value * 2 * Math.PI);

    // circumference - (progress/100) * circumference
    const strokeDashOffset = computed(() =>  circumference.value - (props.progress/100) * circumference.value);

    return { normalizeRadius, circumference, strokeDashOffset };
  }
}
</script>

<style>
.progress-ring {
  transition: stroke-dashoffset 0.35s;
  transform: rotate(-90deg);
  transform-origin: 50% 50%;
}
</style>