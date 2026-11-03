<script setup>
import { ref, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const sidebarOpen = ref(false);

const menus = [
  { name: 'dashboard', label: '文章管理', to: '/admin', icon: 'M4 6h16M4 12h16M4 18h10' },
  { name: 'post-new', label: '写文章', to: '/admin/posts/new', icon: 'M12 5v14M5 12h14' },
  { name: 'admin-comments', label: '评论管理', to: '/admin/comments', icon: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z' },
  { name: 'admin-tags', label: '标签管理', to: '/admin/tags', icon: 'M20.59 13.41 12 22l-9-9V4h9l8.59 8.59a2 2 0 0 1 0 2.82z' },
  { name: 'admin-settings', label: '站点设置', to: '/admin/settings', icon: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z' }
];

const currentTitle = computed(() => route.meta.title || '后台');
const nickname = computed(() => auth.user?.nickname || '博主');

function isActive(item) {
  if (item.name === 'dashboard') return route.name === 'dashboard';
  if (item.name === 'post-new') return ['post-new', 'post-edit'].includes(route.name);
  return route.name === item.name;
}

function logout() {
  auth.logout();
  router.push('/admin/login');
}
</script>

<template>
  <div class="admin">
    <aside class="sidebar" :class="{ open: sidebarOpen }">
      <div class="side-head">
        <RouterLink to="/admin" class="brand">
          <span class="mark">L</span>
          <span class="brand-text">博客后台</span>
        </RouterLink>
      </div>

      <nav class="menu">
        <RouterLink
          v-for="m in menus"
          :key="m.name"
          :to="m.to"
          class="menu-item"
          :class="{ active: isActive(m) }"
          @click="sidebarOpen = false"
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
            <path :d="m.icon" />
          </svg>
          <span>{{ m.label }}</span>
        </RouterLink>
      </nav>

      <div class="side-foot">
        <RouterLink to="/" target="_blank" class="menu-item ghost">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <path d="M15 3h6v6M10 14 21 3" />
          </svg>
          <span>查看博客</span>
        </RouterLink>

        <div class="user">
          <div class="avatar">{{ nickname[0] }}</div>
          <div class="user-meta">
            <div class="user-name">{{ nickname }}</div>
            <div class="user-role">管理员</div>
          </div>
          <button class="logout" title="退出登录" @click="logout">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
            </svg>
          </button>
        </div>
      </div>
    </aside>

    <div v-if="sidebarOpen" class="mask" @click="sidebarOpen = false"></div>

    <div class="main">
      <header class="topbar">
        <button class="hamburger" @click="sidebarOpen = true">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <h1 class="page-title">{{ currentTitle }}</h1>
        <RouterLink to="/admin/posts/new" class="btn btn-primary btn-sm">+ 写文章</RouterLink>
      </header>

      <div class="content">
        <RouterView />
      </div>
    </div>
  </div>
</template>

<style scoped>
.admin {
  display: flex;
  min-height: 100vh;
  background: #f7f6f3;
}

.sidebar {
  position: fixed;
  top: 0;
  bottom: 0;
  left: 0;
  width: 232px;
  background: #fff;
  border-right: 1px solid var(--line);
  display: flex;
  flex-direction: column;
  padding: 18px 14px 14px;
  z-index: 50;
}

.side-head {
  padding: 6px 8px 22px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 650;
  font-size: 15px;
  letter-spacing: -0.01em;
}

.mark {
  width: 30px;
  height: 30px;
  border-radius: 9px;
  background: var(--accent);
  color: #fff;
  display: grid;
  place-items: center;
  font-family: var(--font-serif);
  font-size: 15px;
}

.menu {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 11px;
  border-radius: 9px;
  font-size: 13.8px;
  color: var(--muted);
  transition: all 0.16s ease;
}

.menu-item:hover {
  background: var(--surface-2);
  color: var(--ink);
}

.menu-item.active {
  background: var(--accent-soft);
  color: var(--accent);
  font-weight: 600;
}

.menu-item.ghost {
  font-size: 13px;
}

.side-foot {
  margin-top: auto;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-top: 14px;
  border-top: 1px solid var(--line);
}

.user {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 10px 8px 4px;
}

.avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: var(--accent-soft);
  color: var(--accent);
  display: grid;
  place-items: center;
  font-size: 13px;
  font-weight: 600;
  border: 1px solid var(--accent-line);
}

.user-meta {
  flex: 1;
  min-width: 0;
}

.user-name {
  font-size: 13px;
  font-weight: 600;
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-role {
  font-size: 11px;
  color: var(--muted-2);
}

.logout {
  border: 0;
  background: transparent;
  color: var(--muted-2);
  cursor: pointer;
  padding: 5px;
  border-radius: 6px;
  display: grid;
  place-items: center;
}

.logout:hover {
  background: #fdf1f0;
  color: var(--danger);
}

.main {
  flex: 1;
  min-width: 0;
  margin-left: 232px;
}

.topbar {
  position: sticky;
  top: 0;
  z-index: 30;
  height: 60px;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 0 28px;
  background: rgba(247, 246, 243, 0.86);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--line);
}

.page-title {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  letter-spacing: -0.01em;
  flex: 1;
}

.hamburger {
  display: none;
  border: 1px solid var(--line);
  background: #fff;
  border-radius: 8px;
  width: 32px;
  height: 32px;
  place-items: center;
  cursor: pointer;
  color: var(--ink-2);
}

.content {
  padding: 26px 28px 60px;
  max-width: 1080px;
}

.mask {
  position: fixed;
  inset: 0;
  background: rgba(28, 27, 24, 0.35);
  z-index: 45;
}

@media (max-width: 880px) {
  .sidebar {
    transform: translateX(-100%);
    transition: transform 0.24s cubic-bezier(0.16, 1, 0.3, 1);
  }
  .sidebar.open {
    transform: translateX(0);
    box-shadow: var(--shadow-lg);
  }
  .main {
    margin-left: 0;
  }
  .hamburger {
    display: grid;
  }
  .topbar {
    padding: 0 16px;
  }
  .content {
    padding: 18px 16px 60px;
  }
}
</style>
