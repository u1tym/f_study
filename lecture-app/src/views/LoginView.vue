<script setup lang="ts">
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { login } from '@/api/authApi';

const route = useRoute();
const router = useRouter();

const username = ref('');
const password = ref('');
const error = ref<string | null>(null);
const busy = ref(false);

async function onSubmit() {
  error.value = null;
  busy.value = true;
  try {
    await login(username.value, password.value);
    const redirect = (route.query.redirect as string) || '/';
    await router.replace(redirect);
  } catch (e: unknown) {
    const msg =
      (e as { response?: { data?: { detail?: string } } })?.response?.data
        ?.detail ?? 'ログインに失敗しました';
    error.value = typeof msg === 'string' ? msg : 'ログインに失敗しました';
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <div class="page narrow">
    <h1>ログイン</h1>
    <p class="muted">
      JWT は HttpOnly Cookie で保持されます（<code>withCredentials</code>）。
    </p>
    <form class="card" @submit.prevent="onSubmit">
      <label>
        ユーザー名
        <input v-model="username" name="username" autocomplete="username" required />
      </label>
      <label>
        パスワード
        <input
          v-model="password"
          name="password"
          type="password"
          autocomplete="current-password"
          required
        />
      </label>
      <p v-if="error" class="error">{{ error }}</p>
      <button type="submit" class="btn primary" :disabled="busy">
        {{ busy ? '送信中…' : 'ログイン' }}
      </button>
    </form>
  </div>
</template>

<style scoped>
.narrow {
  max-width: 420px;
  margin: 0 auto;
}
form label {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 14px;
  font-size: 0.9rem;
}
input {
  padding: 8px 10px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--surface);
  color: inherit;
}
.error {
  color: var(--danger);
  margin: 0 0 10px;
}
</style>
