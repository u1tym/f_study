<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { fetchMe } from '@/api/authApi';

const user = ref<string | null>(null);

const MENU_HREF = '/mobile/login/#/menu';

onMounted(async () => {
  try {
    const me = await fetchMe();
    user.value = me.user.username;
  } catch {
    user.value = null;
  }
});

function onBack() {
  window.location.assign(MENU_HREF);
}
</script>

<template>
  <header class="app-header">
    <button type="button" class="btn ghost back" @click="onBack">戻る</button>
    <div class="brand">講義アプリ</div>
    <div class="spacer" />
    <span v-if="user" class="user">{{ user }}</span>
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
.back {
  flex-shrink: 0;
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
