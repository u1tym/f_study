<script setup lang="ts">
import { useRoute } from 'vue-router';

defineProps<{ title: string }>();
const route = useRoute();
</script>

<template>
  <div class="page">
    <p class="crumb">
      <RouterLink to="/">講義一覧</RouterLink>
    </p>
    <h1>{{ title }}</h1>
    <div class="card">
      <p class="big">工事中</p>
      <p class="muted">この画面は今後実装予定です。</p>
      <p v-if="route.params.lid" class="muted">講義 ID: {{ route.params.lid }}</p>
    </div>
  </div>
</template>

<style scoped>
.big {
  font-size: 1.4rem;
  font-weight: 700;
  margin: 0 0 8px;
}
</style>
