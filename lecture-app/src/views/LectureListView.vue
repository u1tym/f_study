<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { createTopLecture, listTopLectures, type TopLecture } from '@/api/studyApi';

const router = useRouter();
const lectures = ref<TopLecture[]>([]);
const newName = ref('');
const error = ref<string | null>(null);
const busy = ref(false);

async function load() {
  error.value = null;
  try {
    lectures.value = await listTopLectures();
  } catch (e: unknown) {
    error.value = '講義一覧の取得に失敗しました';
    console.error(e);
  }
}

onMounted(load);

async function onCreate() {
  const name = newName.value.trim();
  if (!name) return;
  busy.value = true;
  error.value = null;
  try {
    await createTopLecture(name);
    newName.value = '';
    await load();
  } catch (e: unknown) {
    error.value = '講義の作成に失敗しました';
    console.error(e);
  } finally {
    busy.value = false;
  }
}

function openLecture(l: TopLecture) {
  void router.push({
    name: 'lecture-hub',
    params: { lid: String(l.lid) },
    query: { ttl: l.ttl },
  });
}
</script>

<template>
  <div class="page">
    <h1>講義一覧</h1>
    <section class="card create">
      <h2>講義の新規作成</h2>
      <div class="row">
        <input
          v-model="newName"
          type="text"
          placeholder="講義名"
          :disabled="busy"
        />
        <button type="button" class="btn primary" :disabled="busy" @click="onCreate">
          作成
        </button>
      </div>
    </section>
    <p v-if="error" class="error">{{ error }}</p>
    <ul v-if="lectures.length" class="list">
      <li v-for="l in lectures" :key="l.lid">
        <button type="button" class="linkish" @click="openLecture(l)">
          {{ l.ttl }}
        </button>
      </li>
    </ul>
    <p v-else class="muted">講義がありません。上のフォームから作成してください。</p>
  </div>
</template>

<style scoped>
.create h2 {
  margin-top: 0;
  font-size: 1rem;
}
.row {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}
.row input {
  flex: 1;
  min-width: 200px;
  padding: 8px 10px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--surface);
  color: inherit;
}
.list {
  list-style: none;
  padding: 0;
  margin: 16px 0 0;
}
.list li {
  border-bottom: 1px solid var(--border);
}
.linkish {
  display: block;
  width: 100%;
  text-align: left;
  padding: 12px 4px;
  background: none;
  border: none;
  color: var(--link);
  cursor: pointer;
  font: inherit;
}
.linkish:hover {
  text-decoration: underline;
}
.error {
  color: var(--danger);
}
</style>
