<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const props = defineProps<{ lid: string }>();
const route = useRoute();
const router = useRouter();

const title = computed(
  () => (route.query.ttl as string) || `講義 #${props.lid}`,
);

function goView() {
  void router.push({
    name: 'lecture-view',
    params: { lid: props.lid },
    query: route.query,
  });
}

function goEdit() {
  void router.push({
    name: 'lecture-edit',
    params: { lid: props.lid },
    query: route.query,
  });
}
</script>

<template>
  <div class="page">
    <p class="crumb">
      <RouterLink to="/">講義一覧</RouterLink>
      ·
      <RouterLink :to="{ name: 'lecture-hub', params: { lid }, query: route.query }">
        {{ title }}
      </RouterLink>
    </p>
    <h1>レクチャー</h1>
    <p class="muted">{{ title }}</p>
    <div class="grid">
      <button type="button" class="card tile" @click="goView">
        <span class="tile-title">レクチャ参照</span>
      </button>
      <button type="button" class="card tile" @click="goEdit">
        <span class="tile-title">レクチャ編集</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.grid {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  margin-top: 20px;
}
.tile {
  text-align: left;
  cursor: pointer;
  border: 1px solid var(--border);
  background: var(--surface);
  color: inherit;
  padding: 18px;
  border-radius: 12px;
}
.tile-title {
  font-weight: 700;
  font-size: 1.05rem;
}
</style>
