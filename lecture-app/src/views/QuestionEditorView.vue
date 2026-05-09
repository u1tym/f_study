<script setup lang="ts">
import {
  computed,
  onMounted,
  onUnmounted,
  reactive,
  ref,
  watch,
} from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  createQuestion,
  getQuestion,
  updateQuestion,
  type ChoiceInput,
} from '@/api/studyApi';
import { fileToBase64, imageSrcForApiField } from '@/utils/image';
import KatexRender from '@/components/KatexRender.vue';

type ChoiceTyp = 'plane' | 'tex' | 'none';

type Pb1StrTyp = 'plane' | 'tex';
type Pb23StrTyp = 'plane' | 'tex' | 'none';

type ChoiceRow = {
  typ: ChoiceTyp;
  opt: string;
  img: File | null;
  /** API から取得した選択肢画像（base64 等）。保存時に新規ファイルがなければそのまま送る */
  existingImg: string | null;
  /** 新規に選んだファイルのプレビュー用 blob: URL */
  previewUrl: string | null;
  is_right: boolean;
};

function revokeIfBlob(url: string | null | undefined) {
  if (url?.startsWith('blob:')) URL.revokeObjectURL(url);
}

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
const pb1_type = ref<Pb1StrTyp>('plane');
const pb2 = ref('');
const pb2_type = ref<Pb23StrTyp>('none');
const pb3 = ref('');
const pb3_type = ref<Pb23StrTyp>('none');
const im1 = ref<File | null>(null);
const im2 = ref<File | null>(null);
const existingIm1 = ref<string | null>(null);
const existingIm2 = ref<string | null>(null);
const im1PreviewUrl = ref<string | null>(null);
const im2PreviewUrl = ref<string | null>(null);

const im1DisplaySrc = computed(
  () => im1PreviewUrl.value ?? imageSrcForApiField(existingIm1.value),
);
const im2DisplaySrc = computed(
  () => im2PreviewUrl.value ?? imageSrcForApiField(existingIm2.value),
);

const choices = reactive<ChoiceRow[]>([
  {
    typ: 'plane',
    opt: '',
    img: null,
    existingImg: null,
    previewUrl: null,
    is_right: false,
  },
]);

const error = ref<string | null>(null);
const busy = ref(false);

/** tex 時のみ有効。設問文章の TeX プレビュー開閉 */
const texPreviewPb = reactive({ pb1: false, pb2: false, pb3: false });
/** 選択肢 index → TeX プレビュー表示 */
const texPreviewChoice = reactive<Record<number, boolean>>({});

watch(pb1_type, (t) => {
  if (t !== 'tex') texPreviewPb.pb1 = false;
});
watch(pb2_type, (t) => {
  if (t !== 'tex') texPreviewPb.pb2 = false;
});
watch(pb3_type, (t) => {
  if (t !== 'tex') texPreviewPb.pb3 = false;
});
watch(
  choices,
  () => {
    choices.forEach((c, i) => {
      if (c.typ !== 'tex') texPreviewChoice[i] = false;
    });
  },
  { deep: true },
);

function addChoice() {
  choices.push({
    typ: 'plane',
    opt: '',
    img: null,
    existingImg: null,
    previewUrl: null,
    is_right: false,
  });
}

function removeChoice(idx: number) {
  if (choices.length <= 1) return;
  const row = choices[idx];
  revokeIfBlob(row?.previewUrl);
  choices.splice(idx, 1);
}

function onIm1Change(e: Event) {
  revokeIfBlob(im1PreviewUrl.value);
  const f = (e.target as HTMLInputElement).files?.[0] ?? null;
  im1.value = f;
  im1PreviewUrl.value = f ? URL.createObjectURL(f) : null;
}

function onIm2Change(e: Event) {
  revokeIfBlob(im2PreviewUrl.value);
  const f = (e.target as HTMLInputElement).files?.[0] ?? null;
  im2.value = f;
  im2PreviewUrl.value = f ? URL.createObjectURL(f) : null;
}

function onChoiceFileChange(idx: number, e: Event) {
  const row = choices[idx];
  if (!row) return;
  revokeIfBlob(row.previewUrl);
  const f = (e.target as HTMLInputElement).files?.[0] ?? null;
  row.img = f;
  row.previewUrl = f ? URL.createObjectURL(f) : null;
}

function choiceDisplaySrc(c: ChoiceRow): string | null {
  return c.previewUrl ?? imageSrcForApiField(c.existingImg);
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
    else if (c.existingImg) imgB64 = c.existingImg;
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
      pb1_type: pb1_type.value,
      im1: im1b,
      pb2:
        pb2_type.value === 'none'
          ? null
          : pb2.value.trim() === ''
            ? null
            : pb2.value,
      pb2_type: pb2_type.value === 'none' ? null : pb2_type.value,
      im2: im2b,
      pb3:
        pb3_type.value === 'none'
          ? null
          : pb3.value.trim() === ''
            ? null
            : pb3.value,
      pb3_type: pb3_type.value === 'none' ? null : pb3_type.value,
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
    pb1_type.value = d.pb1_type === 'tex' ? 'tex' : 'plane';
    pb2.value = d.pb2 ?? '';
    {
      const t = d.pb2_type;
      pb2_type.value =
        t === 'tex' ? 'tex' : t === 'plane' ? 'plane' : 'none';
    }
    pb3.value = d.pb3 ?? '';
    {
      const t = d.pb3_type;
      pb3_type.value =
        t === 'tex' ? 'tex' : t === 'plane' ? 'plane' : 'none';
    }
    existingIm1.value = d.im1;
    existingIm2.value = d.im2;
    choices.splice(0, choices.length);
    for (const o of d.opt) {
      const typ = (o.typ as ChoiceTyp) || 'plane';
      choices.push({
        typ: typ === 'tex' || typ === 'none' ? typ : 'plane',
        opt: o.opt ?? '',
        img: null,
        existingImg: o.img ?? null,
        previewUrl: null,
        is_right: o.is_right === true,
      });
    }
    if (!choices.length) {
      choices.push({
        typ: 'plane',
        opt: '',
        img: null,
        existingImg: null,
        previewUrl: null,
        is_right: false,
      });
    }
  } catch (e: unknown) {
    error.value = '設問の読み込みに失敗しました';
    console.error(e);
  } finally {
    busy.value = false;
  }
});

onUnmounted(() => {
  revokeIfBlob(im1PreviewUrl.value);
  revokeIfBlob(im2PreviewUrl.value);
  for (const c of choices) revokeIfBlob(c.previewUrl);
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
      <div class="type-row">
        <label class="type-grow">
          設問文章1の文字列タイプ
          <select v-model="pb1_type">
            <option value="plane">plane（プレーン文字列）</option>
            <option value="tex">tex（TeX）</option>
          </select>
        </label>
        <button
          type="button"
          class="btn ghost tex-preview-toggle"
          :disabled="pb1_type !== 'tex'"
          @click="texPreviewPb.pb1 = !texPreviewPb.pb1"
        >
          {{ texPreviewPb.pb1 ? 'プレビューを閉じる' : 'TeXプレビュー' }}
        </button>
      </div>
      <div
        v-if="texPreviewPb.pb1 && pb1_type === 'tex'"
        class="tex-preview-panel"
      >
        <KatexRender v-if="pb1.trim()" :tex="pb1" display />
        <p v-else class="muted tex-preview-empty">TeX の文字列を入力してください</p>
      </div>
      <label>
        画像1（任意）
        <input type="file" accept="image/*" @change="onIm1Change" />
      </label>
      <div v-if="im1DisplaySrc" class="img-preview">
        <img :src="im1DisplaySrc" alt="設問画像1" class="preview-img" />
      </div>
      <label>
        設問文章2（任意）
        <textarea v-model="pb2" rows="2" />
      </label>
      <div class="type-row">
        <label class="type-grow">
          設問文章2の文字列タイプ
          <select v-model="pb2_type">
            <option value="none">none（設問文章2なし）</option>
            <option value="plane">plane（プレーン文字列）</option>
            <option value="tex">tex（TeX）</option>
          </select>
        </label>
        <button
          type="button"
          class="btn ghost tex-preview-toggle"
          :disabled="pb2_type !== 'tex'"
          @click="texPreviewPb.pb2 = !texPreviewPb.pb2"
        >
          {{ texPreviewPb.pb2 ? 'プレビューを閉じる' : 'TeXプレビュー' }}
        </button>
      </div>
      <div
        v-if="texPreviewPb.pb2 && pb2_type === 'tex'"
        class="tex-preview-panel"
      >
        <KatexRender v-if="pb2.trim()" :tex="pb2" display />
        <p v-else class="muted tex-preview-empty">TeX の文字列を入力してください</p>
      </div>
      <label>
        画像2（任意）
        <input type="file" accept="image/*" @change="onIm2Change" />
      </label>
      <div v-if="im2DisplaySrc" class="img-preview">
        <img :src="im2DisplaySrc" alt="設問画像2" class="preview-img" />
      </div>
      <label>
        設問文章3（任意）
        <textarea v-model="pb3" rows="2" />
      </label>
      <div class="type-row">
        <label class="type-grow">
          設問文章3の文字列タイプ
          <select v-model="pb3_type">
            <option value="none">none（設問文章3なし）</option>
            <option value="plane">plane（プレーン文字列）</option>
            <option value="tex">tex（TeX）</option>
          </select>
        </label>
        <button
          type="button"
          class="btn ghost tex-preview-toggle"
          :disabled="pb3_type !== 'tex'"
          @click="texPreviewPb.pb3 = !texPreviewPb.pb3"
        >
          {{ texPreviewPb.pb3 ? 'プレビューを閉じる' : 'TeXプレビュー' }}
        </button>
      </div>
      <div
        v-if="texPreviewPb.pb3 && pb3_type === 'tex'"
        class="tex-preview-panel"
      >
        <KatexRender v-if="pb3.trim()" :tex="pb3" display />
        <p v-else class="muted tex-preview-empty">TeX の文字列を入力してください</p>
      </div>

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
        <div class="type-row">
          <label class="type-grow">
            文字列タイプ
            <select v-model="c.typ">
              <option value="plane">plane</option>
              <option value="tex">tex</option>
              <option value="none">none</option>
            </select>
          </label>
          <button
            type="button"
            class="btn ghost tex-preview-toggle"
            :disabled="c.typ !== 'tex'"
            @click="texPreviewChoice[idx] = !texPreviewChoice[idx]"
          >
            {{ texPreviewChoice[idx] ? 'プレビューを閉じる' : 'TeXプレビュー' }}
          </button>
        </div>
        <div
          v-if="texPreviewChoice[idx] && c.typ === 'tex'"
          class="tex-preview-panel choice-tex-preview"
        >
          <KatexRender v-if="c.opt.trim()" :tex="c.opt" />
          <p v-else class="muted tex-preview-empty">TeX の文字列を入力してください</p>
        </div>
        <label>
          選択肢の文字列
          <input v-model="c.opt" type="text" :disabled="c.typ === 'none'" />
        </label>
        <label>
          選択肢の画像（任意）
          <input
            type="file"
            accept="image/*"
            @change="onChoiceFileChange(idx, $event)"
          />
        </label>
        <div v-if="choiceDisplaySrc(c)" class="img-preview">
          <img
            :src="choiceDisplaySrc(c)!"
            alt="選択肢画像"
            class="preview-img"
          />
        </div>
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
.img-preview {
  margin: -4px 0 12px;
}
.preview-img {
  max-width: min(100%, 420px);
  max-height: 280px;
  object-fit: contain;
  border-radius: 8px;
  border: 1px solid var(--border);
}
.type-row {
  display: flex;
  align-items: flex-end;
  gap: 10px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}
.type-grow {
  flex: 1;
  min-width: 200px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 0 !important;
  font-size: 0.9rem;
}
.tex-preview-toggle {
  flex-shrink: 0;
  white-space: nowrap;
}
.tex-preview-panel {
  margin: -4px 0 12px;
  padding: 12px 14px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--surface-2);
  overflow-x: auto;
  text-align: left;
}
/* KaTeX display モードのデフォルト中央寄せを抑止 */
.tex-preview-panel :deep(.katex-display) {
  text-align: left;
  margin: 0.5em 0;
}
.tex-preview-panel :deep(.katex) {
  text-align: left;
}
.choice-tex-preview {
  margin-top: 0;
}
.tex-preview-empty {
  margin: 0;
  font-size: 0.9rem;
}
</style>
