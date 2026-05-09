<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import AppHeader from '@/components/AppHeader.vue';

const route = useRoute();
const showHeader = computed(() => route.name !== 'login');
</script>

<template>
  <AppHeader v-if="showHeader" />
  <main class="shell">
    <RouterView />
  </main>
</template>

<style scoped>
.shell {
  padding: 20px 20px 48px;
  max-width: 960px;
  margin: 0 auto;
}
</style>
