<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { fetchMe, logout } from '@/api/authApi';

const router = useRouter();
const user = ref<string | null>(null);

onMounted(async () => {
  try {
    const me = await fetchMe();
    user.value = me.user.username;
  } catch {
    user.value = null;
  }
});

async function onLogout() {
  try {
    await logout();
  } finally {
    await router.push('/login');
  }
}
</script>

<template>
  <header class="app-header">
    <div class="brand">講義アプリ</div>
    <div class="spacer" />
    <span v-if="user" class="user">{{ user }}</span>
    <button v-if="user" type="button" class="btn ghost" @click="onLogout">
      ログアウト
    </button>
  </header>
</template>

<style scoped>
.app-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  border-bottom: 1px solid var(--border);
  background: var(--header-bg);
}
.brand {
  font-weight: 700;
  letter-spacing: 0.02em;
}
.spacer {
  flex: 1;
}
.user {
  color: var(--muted);
  font-size: 0.9rem;
}
</style>
