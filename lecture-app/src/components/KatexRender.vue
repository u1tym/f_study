<script setup lang="ts">
import katex from 'katex';
import { computed } from 'vue';

const props = defineProps<{
  tex: string;
  display?: boolean;
}>();

const html = computed(() => {
  try {
    return katex.renderToString(props.tex, {
      throwOnError: false,
      displayMode: props.display ?? false,
    });
  } catch {
    return props.tex;
  }
});
</script>

<template>
  <span class="katex-wrap" v-html="html" />
</template>

<style scoped>
.katex-wrap :deep(.katex) {
  font-size: 1.05em;
}
</style>
