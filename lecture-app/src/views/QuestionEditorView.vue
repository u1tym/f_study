<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  createQuestion,
  getQuestion,
  updateQuestion,
  type ChoiceInput,
} from '@/api/studyApi';
import { fileToBase64 } from '@/utils/image';

type ChoiceTyp = 'plane' | 'tex' | 'none';

type ChoiceRow = {
  typ: ChoiceTyp;
  opt: string;
  img: File | null;
  is_right: boolean;
};

const props = defineProps<{ lid: string; qid?: string }>();
const route = useRoute();
const router = useRouter();

const lidNum = computed(() => Number(props.lid));
const isEdit = computed(() => props.qid != null && props.qid !== 'new');
const title = computed(
  () => (route.query.ttl as string) || `講義 #${props.lid}`,
);

const ttl = ref('');
const pb1 = ref('');
const pb2 = ref('');
const pb3 = ref('');
const im1 = ref<File | null>(null);
const im2 = ref<File | null>(null);
const existingIm1 = ref<string | null>(null);
const existingIm2 = ref<string | null>(null);

const choices = reactive<ChoiceRow[]>([
  { typ: 'plane', opt: '', img: null, is_right: false },
]);

const error = ref<string | null>(null);
const busy = ref(false);

function addChoice() {
  choices.push({ typ: 'plane', opt: '', img: null, is_right: false });
}

function removeChoice(idx: number) {
  if (choices.length <= 1) return;
  choices.splice(idx, 1);
}

function validate(): string | null {
  let rights = 0;
  for (const c of choices) {
    if (c.is_right) rights++;
    if (c.typ === 'none') {
      if (c.opt.trim() !== '')
        return '文字列タイプが none の選択肢では文字列を入力しないでください';
    } else {
      if (c.opt.trim() === '')
        return '文字列タイプが plane / tex の選択肢では文字列が必須です';
    }
  }
  if (rights < 1) return '正解の選択肢を1つ以上指定してください';
  return null;
}

async function buildChoicesPayload(): Promise<ChoiceInput[]> {
  const out: ChoiceInput[] = [];
  for (const c of choices) {
    let imgB64: string | null = null;
    if (c.img) imgB64 = await fileToBase64(c.img);
    out.push({
      typ: c.typ,
      opt: c.typ === 'none' ? null : c.opt,
      img: imgB64,
      is_right: c.is_right,
    });
  }
  return out;
}

async function onSubmit() {
  error.value = null;
  const v = validate();
  if (v) {
    error.value = v;
    return;
  }
  busy.value = true;
  try {
    let im1b: string | null = null;
    let im2b: string | null = null;
    if (im1.value) im1b = await fileToBase64(im1.value);
    else if (existingIm1.value) im1b = existingIm1.value;
    if (im2.value) im2b = await fileToBase64(im2.value);
    else if (existingIm2.value) im2b = existingIm2.value;

    const bodyBase = {
      lid: lidNum.value,
      ttl: ttl.value.trim() === '' ? null : ttl.value.trim(),
      /* C-1: pb1 は必須のため未入力は空文字 */
      pb1: pb1.value,
      im1: im1b,
      pb2: pb2.value.trim() === '' ? null : pb2.value,
      im2: im2b,
      pb3: pb3.value.trim() === '' ? null : pb3.value,
      choices: await buildChoicesPayload(),
    };

    if (isEdit.value) {
      await updateQuestion({
        ...bodyBase,
        qid: Number(props.qid),
      });
    } else {
      await createQuestion(bodyBase);
    }

    void router.push({
      name: 'question-list',
      params: { lid: props.lid },
      query: route.query,
    });
  } catch (e: unknown) {
    error.value = '保存に失敗しました';
    console.error(e);
  } finally {
    busy.value = false;
  }
}

onMounted(async () => {
  if (!isEdit.value) return;
  busy.value = true;
  error.value = null;
  try {
    const d = await getQuestion(lidNum.value, Number(props.qid));
    ttl.value = d.ttl ?? '';
    pb1.value = d.pb1 ?? '';
    pb2.value = d.pb2 ?? '';
    pb3.value = d.pb3 ?? '';
    existingIm1.value = d.im1;
    existingIm2.value = d.im2;
    choices.splice(0, choices.length);
    for (const o of d.opt) {
      const typ = (o.typ as ChoiceTyp) || 'plane';
      choices.push({
        typ: typ === 'tex' || typ === 'none' ? typ : 'plane',
        opt: o.opt ?? '',
        img: null,
        is_right: o.is_right === true,
      });
    }
    if (!choices.length) {
      choices.push({ typ: 'plane', opt: '', img: null, is_right: false });
    }
  } catch (e: unknown) {
    error.value = '設問の読み込みに失敗しました';
    console.error(e);
  } finally {
    busy.value = false;
  }
});
</script>

<template>
  <div class="page">
    <p class="crumb">
      <RouterLink to="/">講義一覧</RouterLink>
      ·
      <RouterLink :to="{ name: 'question-list', params: { lid }, query: route.query }">
        設問一覧
      </RouterLink>
    </p>
    <h1>{{ isEdit ? '設問の編集' : '設問の新規作成' }}</h1>
    <p class="muted">{{ title }}</p>
    <form class="card form" @submit.prevent="onSubmit">
      <label>
        タイトル
        <input v-model="ttl" type="text" />
      </label>
      <label>
        設問文章1（任意）
        <textarea v-model="pb1" rows="2" />
      </label>
      <label>
        画像1（任意）
        <input type="file" accept="image/*" @change="im1 = ($event.target as HTMLInputElement).files?.[0] ?? null" />
      </label>
      <label>
        設問文章2（任意）
        <textarea v-model="pb2" rows="2" />
      </label>
      <label>
        画像2（任意）
        <input type="file" accept="image/*" @change="im2 = ($event.target as HTMLInputElement).files?.[0] ?? null" />
      </label>
      <label>
        設問文章3（任意）
        <textarea v-model="pb3" rows="2" />
      </label>

      <h2>選択肢</h2>
      <div v-for="(c, idx) in choices" :key="idx" class="choice card">
        <div class="choice-head">
          <span>選択肢 {{ idx + 1 }}</span>
          <button
            type="button"
            class="btn ghost danger"
            :disabled="choices.length <= 1"
            @click="removeChoice(idx)"
          >
            削除
          </button>
        </div>
        <label>
          文字列タイプ
          <select v-model="c.typ">
            <option value="plane">plane</option>
            <option value="tex">tex</option>
            <option value="none">none</option>
          </select>
        </label>
        <label>
          選択肢の文字列
          <input v-model="c.opt" type="text" :disabled="c.typ === 'none'" />
        </label>
        <label>
          選択肢の画像（任意）
          <input
            type="file"
            accept="image/*"
            @change="c.img = ($event.target as HTMLInputElement).files?.[0] ?? null"
          />
        </label>
        <label class="inline">
          <input v-model="c.is_right" type="checkbox" />
          正解
        </label>
      </div>
      <button type="button" class="btn" @click="addChoice">選択肢を追加</button>

      <p v-if="error" class="error">{{ error }}</p>
      <div class="actions">
        <button type="submit" class="btn primary" :disabled="busy">
          {{ busy ? '保存中…' : '保存' }}
        </button>
        <RouterLink
          class="btn ghost"
          :to="{ name: 'question-list', params: { lid }, query: route.query }"
        >
          キャンセル
        </RouterLink>
      </div>
    </form>
  </div>
</template>

<style scoped>
.form label {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 12px;
  font-size: 0.9rem;
}
.form input[type='text'],
.form textarea,
.form select {
  padding: 8px 10px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--surface);
  color: inherit;
  font: inherit;
}
.inline {
  flex-direction: row !important;
  align-items: center;
  gap: 8px !important;
}
.choice {
  margin-bottom: 14px;
  padding: 12px;
}
.choice-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-weight: 600;
}
.actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 16px;
}
.error {
  color: var(--danger);
}
h2 {
  margin: 18px 0 8px;
  font-size: 1rem;
}
</style>
