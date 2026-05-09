<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { deleteQuestion, listQuestions, type QuestionSummary } from '@/api/studyApi';

const props = defineProps<{ lid: string }>();
const route = useRoute();
const router = useRouter();

const lidNum = computed(() => Number(props.lid));
const title = computed(
  () => (route.query.ttl as string) || `講義 #${props.lid}`,
);
const items = ref<QuestionSummary[]>([]);
const error = ref<string | null>(null);
const busyId = ref<number | null>(null);

async function load() {
  error.value = null;
  try {
    const res = await listQuestions(lidNum.value);
    items.value = res.qes;
  } catch (e: unknown) {
    error.value = '設問一覧の取得に失敗しました';
    console.error(e);
  }
}

onMounted(load);

function goNew() {
  void router.push({
    name: 'question-new',
    params: { lid: props.lid },
    query: route.query,
  });
}

function goEdit(q: QuestionSummary) {
  void router.push({
    name: 'question-edit',
    params: { lid: props.lid, qid: String(q.qid) },
    query: route.query,
  });
}

async function onDelete(q: QuestionSummary) {
  if (!confirm(`設問「${q.ttl ?? q.qid}」を削除しますか？`)) return;
  busyId.value = q.qid;
  error.value = null;
  try {
    await deleteQuestion(lidNum.value, q.qid);
    await load();
  } catch (e: unknown) {
    error.value = '削除に失敗しました';
    console.error(e);
  } finally {
    busyId.value = null;
  }
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
      ·
      <RouterLink :to="{ name: 'test-hub', params: { lid }, query: route.query }">
        テスト
      </RouterLink>
    </p>
    <div class="head-row">
      <h1>設問編集</h1>
      <button type="button" class="btn primary" @click="goNew">新規作成</button>
    </div>
    <p v-if="error" class="error">{{ error }}</p>
    <ul v-if="items.length" class="list card">
      <li v-for="q in items" :key="q.qid" class="row">
        <button type="button" class="linkish" @click="goEdit(q)">
          {{ q.ttl?.trim() ? q.ttl : `設問 #${q.qid}` }}
        </button>
        <button
          type="button"
          class="btn danger ghost"
          :disabled="busyId === q.qid"
          @click="onDelete(q)"
        >
          削除
        </button>
      </li>
    </ul>
    <p v-else class="muted">設問がありません。「新規作成」から追加してください。</p>
  </div>
</template>

<style scoped>
.head-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}
.list {
  list-style: none;
  padding: 0;
  margin-top: 16px;
}
.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  border-bottom: 1px solid var(--border);
}
.row:last-child {
  border-bottom: none;
}
.linkish {
  flex: 1;
  text-align: left;
  background: none;
  border: none;
  color: var(--link);
  cursor: pointer;
  font: inherit;
  padding: 4px 0;
}
.error {
  color: var(--danger);
}
</style>
