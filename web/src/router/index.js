import { createRouter, createWebHistory } from 'vue-router';

const routes = [
  { path: '/', name: 'home', component: () => import('@/views/Home.vue'), meta: { title: '首页' } },
  { path: '/post/:slug', name: 'post', component: () => import('@/views/PostDetail.vue') },
  { path: '/archive', name: 'archive', component: () => import('@/views/Archive.vue'), meta: { title: '归档' } },
  { path: '/tags', name: 'tags', component: () => import('@/views/Tags.vue'), meta: { title: '标签' } },
  { path: '/about', name: 'about', component: () => import('@/views/About.vue'), meta: { title: '关于' } },

  { path: '/admin/login', name: 'login', component: () => import('@/views/admin/Login.vue'), meta: { title: '登录', bare: true } },
  {
    path: '/admin',
    component: () => import('@/views/admin/AdminLayout.vue'),
    meta: { requiresAuth: true, bare: true },
    children: [
      { path: '', name: 'dashboard', component: () => import('@/views/admin/Dashboard.vue'), meta: { title: '文章管理', requiresAuth: true, bare: true } },
      { path: 'posts/new', name: 'post-new', component: () => import('@/views/admin/PostEditor.vue'), meta: { title: '写文章', requiresAuth: true, bare: true } },
      { path: 'posts/:id/edit', name: 'post-edit', component: () => import('@/views/admin/PostEditor.vue'), meta: { title: '编辑文章', requiresAuth: true, bare: true } },
      { path: 'comments', name: 'admin-comments', component: () => import('@/views/admin/Comments.vue'), meta: { title: '评论管理', requiresAuth: true, bare: true } },
      { path: 'tags', name: 'admin-tags', component: () => import('@/views/admin/TagManage.vue'), meta: { title: '标签管理', requiresAuth: true, bare: true } },
      { path: 'settings', name: 'admin-settings', component: () => import('@/views/admin/Settings.vue'), meta: { title: '设置', requiresAuth: true, bare: true } }
    ]
  },

  { path: '/:pathMatch(.*)*', name: 'not-found', component: () => import('@/views/NotFound.vue'), meta: { title: '页面不存在' } }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, _from, saved) {
    if (saved) return saved;
    if (to.hash) return { el: to.hash, behavior: 'smooth' };
    return { top: 0 };
  }
});

router.beforeEach(to => {
  if (to.meta.title) document.title = `${to.meta.title} · 林小岸的博客`;
  if (to.meta.requiresAuth && !localStorage.getItem('blog_token')) {
    return { name: 'login', query: { redirect: to.fullPath } };
  }
  if (to.name === 'login' && localStorage.getItem('blog_token')) {
    return { name: 'dashboard' };
  }
  return true;
});

export default router;
