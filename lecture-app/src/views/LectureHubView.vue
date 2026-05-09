<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const props = defineProps<{ lid: string }>();
const route = useRoute();
const router = useRouter();

const lidNum = computed(() => Number(props.lid));
const title = computed(
  () => (route.query.ttl as string) || `講義 #${props.lid}`,
);

function goLecture() {
  void router.push({
    name: 'lecture-menu',
    params: { lid: props.lid },
    query: route.query,
  });
}

function goTest() {
  void router.push({
    name: 'test-hub',
    params: { lid: props.lid },
    query: route.query,
  });
}
</script>

<template>
  <div class="page">
    <p class="crumb">
      <RouterLink to="/">講義一覧</RouterLink>
    </p>
    <h1>{{ title }}</h1>
    <p class="muted">講義 ID: {{ lidNum }}</p>
    <div class="grid">
      <button type="button" class="card tile" @click="goLecture">
        <span class="tile-title">レクチャー</span>
        <span class="tile-sub">参照・編集（詳細はサブメニュー）</span>
      </button>
      <button type="button" class="card tile" @click="goTest">
        <span class="tile-title">テスト</span>
        <span class="tile-sub">受験・設問編集</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.grid {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
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
  transition: border-color 0.15s ease, transform 0.05s ease;
}
.tile:hover {
  border-color: var(--accent);
}
.tile-title {
  display: block;
  font-weight: 700;
  font-size: 1.1rem;
  margin-bottom: 6px;
}
.tile-sub {
  color: var(--muted);
  font-size: 0.9rem;
}
</style>
