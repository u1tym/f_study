<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const props = defineProps<{ lid: string }>();
const route = useRoute();
const router = useRouter();

const title = computed(
  () => (route.query.ttl as string) || `講義 #${props.lid}`,
);

function goExam() {
  void router.push({
    name: 'exam',
    params: { lid: props.lid },
    query: route.query,
  });
}

function goQuestions() {
  void router.push({
    name: 'question-list',
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
    <h1>テスト</h1>
    <p class="muted">{{ title }}</p>
    <div class="grid">
      <button type="button" class="card tile" @click="goExam">
        <span class="tile-title">受験</span>
        <span class="tile-sub">10問ランダム / 全問</span>
      </button>
      <button type="button" class="card tile" @click="goQuestions">
        <span class="tile-title">設問編集</span>
        <span class="tile-sub">一覧・作成・更新・削除</span>
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
