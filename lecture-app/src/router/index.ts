import { createRouter, createWebHistory } from 'vue-router';
import { fetchMe } from '@/api/authApi';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
    },
    {
      path: '/',
      name: 'lectures',
      component: () => import('@/views/LectureListView.vue'),
    },
    {
      path: '/lectures/:lid',
      name: 'lecture-hub',
      component: () => import('@/views/LectureHubView.vue'),
      props: true,
    },
    {
      path: '/lectures/:lid/lecture',
      name: 'lecture-menu',
      component: () => import('@/views/LectureMenuView.vue'),
      props: true,
    },
    {
      path: '/lectures/:lid/lecture/view',
      name: 'lecture-view',
      component: () => import('@/views/UnderConstructionView.vue'),
      props: () => ({ title: 'レクチャ参照' }),
    },
    {
      path: '/lectures/:lid/lecture/edit',
      name: 'lecture-edit',
      component: () => import('@/views/UnderConstructionView.vue'),
      props: () => ({ title: 'レクチャ編集' }),
    },
    {
      path: '/lectures/:lid/test',
      name: 'test-hub',
      component: () => import('@/views/TestHubView.vue'),
      props: true,
    },
    {
      path: '/lectures/:lid/test/questions',
      name: 'question-list',
      component: () => import('@/views/QuestionListView.vue'),
      props: true,
    },
    {
      path: '/lectures/:lid/test/questions/new',
      name: 'question-new',
      component: () => import('@/views/QuestionEditorView.vue'),
      props: true,
    },
    {
      path: '/lectures/:lid/test/questions/:qid',
      name: 'question-edit',
      component: () => import('@/views/QuestionEditorView.vue'),
      props: true,
    },
    {
      path: '/lectures/:lid/test/exam',
      name: 'exam',
      component: () => import('@/views/ExamView.vue'),
      props: true,
    },
  ],
});

router.beforeEach(async (to) => {
  if (to.name === 'login') return true;
  try {
    await fetchMe();
    return true;
  } catch {
    return { name: 'login', query: { redirect: to.fullPath } };
  }
});

export default router;
