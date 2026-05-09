<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';
import {
  getQuestion,
  listQuestions,
  submitAnswer,
  type ChoiceOpt,
  type QuestionDetail,
} from '@/api/studyApi';
import KatexRender from '@/components/KatexRender.vue';
import { imageSrcForApiField } from '@/utils/image';
import { shuffledCopy } from '@/utils/shuffle';

const props = defineProps<{ lid: string }>();
const route = useRoute();

const lidNum = computed(() => Number(props.lid));
const title = computed(
  () => (route.query.ttl as string) || `講義 #${props.lid}`,
);

type Phase = 'pick' | 'run' | 'done';
const phase = ref<Phase>('pick');
const mode = ref<'10' | 'all' | null>(null);
const qids = ref<number[]>([]);
const index = ref(0);
const detail = ref<QuestionDetail | null>(null);
const displayOpts = ref<ChoiceOpt[]>([]);
const single = ref<number | null>(null);
const multi = ref<Set<number>>(new Set());
const answered = ref(false);
const lastResult = ref<{ result: boolean; right: number[] } | null>(null);
const error = ref<string | null>(null);
const busy = ref(false);

const currentQid = computed(() => qids.value[index.value] ?? null);
const progress = computed(() =>
  qids.value.length ? `${index.value + 1} / ${qids.value.length}` : '',
);

function toggleMulti(cid: number) {
  const next = new Set(multi.value);
  if (next.has(cid)) next.delete(cid);
  else next.add(cid);
  multi.value = next;
}

async function start(modePick: '10' | 'all') {
  error.value = null;
  busy.value = true;
  try {
    const list = await listQuestions(lidNum.value);
    const ids = list.qes.map((q) => q.qid);
    if (!ids.length) {
      error.value = '設問がありません。先に設問を作成してください。';
      return;
    }
    mode.value = modePick;
    if (modePick === 'all') {
      qids.value = [...ids];
    } else {
      qids.value = shuffledCopy(ids).slice(0, Math.min(10, ids.length));
    }
    index.value = 0;
    phase.value = 'run';
    await loadCurrent();
  } catch (e: unknown) {
    error.value = '設問一覧の取得に失敗しました';
    console.error(e);
  } finally {
    busy.value = false;
  }
}

async function loadCurrent() {
  const qid = currentQid.value;
  if (qid == null) return;
  error.value = null;
  busy.value = true;
  answered.value = false;
  lastResult.value = null;
  single.value = null;
  multi.value = new Set();
  try {
    const d = await getQuestion(lidNum.value, qid);
    detail.value = d;
    displayOpts.value = shuffledCopy(d.opt);
  } catch (e: unknown) {
    error.value = '設問の取得に失敗しました';
    console.error(e);
    detail.value = null;
  } finally {
    busy.value = false;
  }
}

const numRight = computed(() => detail.value?.num ?? 0);

async function onAnswer() {
  if (!detail.value || currentQid.value == null) return;
  const n = numRight.value;
  let answer: number[] = [];
  if (n <= 1) {
    if (single.value == null) {
      error.value = '選択肢を選んでください';
      return;
    }
    answer = [single.value];
  } else {
    answer = [...multi.value];
    if (!answer.length) {
      error.value = '1つ以上選択してください';
      return;
    }
  }
  error.value = null;
  busy.value = true;
  try {
    const res = await submitAnswer({
      lid: lidNum.value,
      qid: currentQid.value,
      answer: [...answer].sort((a, b) => a - b),
    });
    lastResult.value = res;
    answered.value = true;
  } catch (e: unknown) {
    error.value = '回答の送信に失敗しました';
    console.error(e);
  } finally {
    busy.value = false;
  }
}

function onNext() {
  if (index.value + 1 >= qids.value.length) {
    phase.value = 'done';
    return;
  }
  index.value += 1;
  void loadCurrent();
}

function resetToPick() {
  phase.value = 'pick';
  mode.value = null;
  qids.value = [];
  index.value = 0;
  detail.value = null;
  answered.value = false;
  lastResult.value = null;
  error.value = null;
}

function lookupOpt(cid: number): ChoiceOpt | undefined {
  return detail.value?.opt.find((o) => o.cid === cid);
}
</script>

<template>
  <div class="page">
    <p class="crumb">
      <RouterLink to="/">講義一覧</RouterLink>
      ·
      <RouterLink :to="{ name: 'test-hub', params: { lid }, query: route.query }">
        テスト
      </RouterLink>
    </p>
    <h1>受験</h1>
    <p class="muted">{{ title }}</p>

    <section v-if="phase === 'pick'" class="card">
      <h2>出題モード</h2>
      <p class="muted">10問は設問一覧からランダムに最大10件です。全問は一覧順です。</p>
      <p v-if="error" class="error">{{ error }}</p>
      <div class="row">
        <button type="button" class="btn primary" :disabled="busy" @click="start('10')">
          10問
        </button>
        <button type="button" class="btn primary" :disabled="busy" @click="start('all')">
          全問
        </button>
      </div>
    </section>

    <section v-else-if="phase === 'run' && detail" class="card">
      <div class="progress">
        <span>{{ progress }}</span>
        <span v-if="mode" class="pill">{{ mode === '10' ? '10問' : '全問' }}</span>
      </div>

      <h2 class="qtitle">{{ detail.ttl?.trim() ? detail.ttl : `設問 #${currentQid}` }}</h2>

      <div v-if="detail.pb1" class="block text">{{ detail.pb1 }}</div>
      <div v-if="imageSrcForApiField(detail.im1)" class="block">
        <img :src="imageSrcForApiField(detail.im1)!" alt="設問画像1" class="img" />
      </div>
      <div v-if="detail.pb2" class="block text">{{ detail.pb2 }}</div>
      <div v-if="imageSrcForApiField(detail.im2)" class="block">
        <img :src="imageSrcForApiField(detail.im2)!" alt="設問画像2" class="img" />
      </div>
      <div v-if="detail.pb3" class="block text">{{ detail.pb3 }}</div>

      <h3>選択肢</h3>
      <ul class="choices">
        <li v-for="o in displayOpts" :key="o.cid" class="choice">
          <label class="choice-row">
            <span class="control">
              <input
                v-if="numRight <= 1"
                v-model="single"
                type="radio"
                name="single"
                :value="o.cid"
                :disabled="answered"
              />
              <input
                v-else
                type="checkbox"
                :checked="multi.has(o.cid)"
                :disabled="answered"
                @change="toggleMulti(o.cid)"
              />
            </span>
            <span class="body">
              <span v-if="o.typ === 'plane' && o.opt" class="text">{{ o.opt }}</span>
              <KatexRender v-else-if="o.typ === 'tex' && o.opt" :tex="o.opt" />
              <span v-if="imageSrcForApiField(o.img)" class="img-wrap">
                <img :src="imageSrcForApiField(o.img)!" alt="選択肢画像" class="img" />
              </span>
            </span>
          </label>
        </li>
      </ul>

      <p v-if="error" class="error">{{ error }}</p>

      <div v-if="!answered" class="actions">
        <button type="button" class="btn primary" :disabled="busy" @click="onAnswer">
          回答
        </button>
      </div>

      <div v-else-if="lastResult" class="result card inner">
        <p :class="lastResult.result ? 'ok' : 'ng'">
          {{ lastResult.result ? '正解' : '不正解' }}
        </p>
        <p class="muted">正解の選択肢（表示 ID）:</p>
        <ul>
          <li v-for="cid in lastResult.right" :key="cid">
            #{{ cid }}
            <template v-if="lookupOpt(cid)">
              —
              <span v-if="lookupOpt(cid)!.typ === 'plane'" class="text">
                {{ lookupOpt(cid)!.opt }}
              </span>
              <KatexRender
                v-else-if="lookupOpt(cid)!.typ === 'tex' && lookupOpt(cid)!.opt"
                :tex="lookupOpt(cid)!.opt!"
              />
            </template>
          </li>
        </ul>
        <button type="button" class="btn primary" @click="onNext">次へ</button>
      </div>
    </section>

    <section v-else-if="phase === 'done'" class="card">
      <h2>完了</h2>
      <p>すべての問題に回答しました。</p>
      <div class="actions">
        <button type="button" class="btn" @click="resetToPick">モード選択に戻る</button>
        <RouterLink
          class="btn ghost"
          :to="{ name: 'test-hub', params: { lid }, query: route.query }"
        >
          テストメニューへ
        </RouterLink>
      </div>
    </section>
  </div>
</template>

<style scoped>
.row {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 12px;
}
.progress {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
  color: var(--muted);
}
.pill {
  border: 1px solid var(--border);
  border-radius: 999px;
  padding: 2px 10px;
  font-size: 0.8rem;
}
.qtitle {
  margin-top: 0;
}
.block {
  margin: 10px 0;
}
.text {
  white-space: pre-wrap;
}
.img {
  max-width: 100%;
  border-radius: 8px;
  border: 1px solid var(--border);
}
.choices {
  list-style: none;
  padding: 0;
  margin: 0;
}
.choice {
  border: 1px solid var(--border);
  border-radius: 10px;
  margin-bottom: 10px;
  padding: 10px 12px;
  background: var(--surface-2);
}
.choice-row {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}
.control {
  padding-top: 4px;
}
.body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.actions {
  margin-top: 16px;
}
.result.inner {
  margin-top: 16px;
}
.ok {
  color: var(--ok);
  font-weight: 700;
}
.ng {
  color: var(--danger);
  font-weight: 700;
}
.error {
  color: var(--danger);
}
h3 {
  font-size: 1rem;
  margin: 16px 0 8px;
}
</style>
