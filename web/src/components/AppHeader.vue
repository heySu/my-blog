<script setup>
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useSiteStore } from '@/stores/site';

const route = useRoute();
const router = useRouter();
const site = useSiteStore();

const scrolled = ref(false);
const menuOpen = ref(false);
const keyword = ref('');

const navs = [
  { name: 'home', label: '首页', to: '/' },
  { name: 'archive', label: '归档', to: '/archive' },
  { name: 'tags', label: '标签', to: '/tags' },
  { name: 'about', label: '关于', to: '/about' }
];

const isActive = name => route.name === name;
const siteTitle = computed(() => site.config.site_title || `${site.author.nickname}的博客`);

function onScroll() {
  scrolled.value = window.scrollY > 8;
}

if (typeof window !== 'undefined') {
  window.addEventListener('scroll', onScroll, { passive: true });
}

function search() {
  const q = keyword.value.trim();
  menuOpen.value = false;
  router.push({ path: '/', query: q ? { keyword: q } : {} });
}

watch(() => route.fullPath, () => {
  menuOpen.value = false;
  if (!route.query.keyword) keyword.value = '';
});
</script>

<template>
  <header class="header" :class="{ scrolled }">
    <div class="container header-inner">
      <RouterLink to="/" class="brand">
        <span class="brand-mark">L</span>
        <span class="brand-text">{{ siteTitle }}</span>
      </RouterLink>

      <nav class="nav" :class="{ open: menuOpen }">
        <RouterLink
          v-for="n in navs"
          :key="n.name"
          :to="n.to"
          class="nav-link"
          :class="{ active: isActive(n.name) }"
        >
          {{ n.label }}
        </RouterLink>

        <form class="search" @submit.prevent="search">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" stroke-linecap="round" />
          </svg>
          <input v-model="keyword" type="search" placeholder="搜索文章…" />
        </form>

        <RouterLink to="/admin" class="btn btn-sm admin-link">写文章</RouterLink>
      </nav>

      <button class="menu-btn" :class="{ open: menuOpen }" @click="menuOpen = !menuOpen" aria-label="菜单">
        <span></span><span></span><span></span>
      </button>
    </div>
  </header>
</template>

<style scoped>
.header {
  position: sticky;
  top: 0;
  z-index: 40;
  height: var(--header-h);
  background: rgba(250, 249, 246, 0.82);
  backdrop-filter: saturate(180%) blur(14px);
  -webkit-backdrop-filter: saturate(180%) blur(14px);
  border-bottom: 1px solid transparent;
  transition: border-color 0.25s ease, box-shadow 0.25s ease;
}

.header.scrolled {
  border-bottom-color: var(--line);
  box-shadow: 0 1px 12px -6px rgba(28, 27, 24, 0.14);
}

.header-inner {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 650;
  letter-spacing: -0.015em;
  font-size: 16px;
  white-space: nowrap;
}

.brand-mark {
  width: 30px;
  height: 30px;
  border-radius: 9px;
  background: var(--accent);
  color: #fff;
  display: grid;
  place-items: center;
  font-family: var(--font-serif);
  font-size: 16px;
  line-height: 1;
  box-shadow: 0 2px 8px -2px rgba(47, 93, 80, 0.5);
}

.nav {
  display: flex;
  align-items: center;
  gap: 6px;
}

.nav-link {
  position: relative;
  padding: 7px 12px;
  border-radius: 8px;
  font-size: 14.5px;
  color: var(--muted);
  transition: color 0.16s ease, background 0.16s ease;
}

.nav-link:hover {
  color: var(--ink);
  background: rgba(0, 0, 0, 0.03);
}

.nav-link.active {
  color: var(--accent);
  font-weight: 600;
}

.nav-link.active::after {
  content: '';
  position: absolute;
  left: 12px;
  right: 12px;
  bottom: 0;
  height: 2px;
  border-radius: 2px;
  background: var(--accent);
}

.search {
  display: flex;
  align-items: center;
  gap: 7px;
  height: 34px;
  padding: 0 12px;
  margin-left: 8px;
  border-radius: var(--radius-pill);
  background: var(--surface-2);
  border: 1px solid transparent;
  color: var(--muted-2);
  transition: all 0.18s ease;
}

.search:focus-within {
  background: var(--surface);
  border-color: var(--accent-line);
  box-shadow: 0 0 0 3px rgba(47, 93, 80, 0.08);
}

.search input {
  width: 110px;
  border: 0;
  background: transparent;
  outline: none;
  font-size: 13.5px;
  color: var(--ink);
}

.search input::-webkit-search-cancel-button {
  display: none;
}

.admin-link {
  margin-left: 6px;
}

.menu-btn {
  display: none;
  flex-direction: column;
  justify-content: center;
  gap: 4px;
  width: 36px;
  height: 36px;
  border: 1px solid var(--line);
  border-radius: 9px;
  background: var(--surface);
  cursor: pointer;
  padding: 0 8px;
}

.menu-btn span {
  display: block;
  height: 1.6px;
  background: var(--ink-2);
  border-radius: 2px;
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.menu-btn.open span:nth-child(1) {
  transform: translateY(5.6px) rotate(45deg);
}
.menu-btn.open span:nth-child(2) {
  opacity: 0;
}
.menu-btn.open span:nth-child(3) {
  transform: translateY(-5.6px) rotate(-45deg);
}

@media (max-width: 860px) {
  .menu-btn {
    display: flex;
  }

  .nav {
    position: absolute;
    top: var(--header-h);
    left: 0;
    right: 0;
    flex-direction: column;
    align-items: stretch;
    gap: 2px;
    padding: 12px 18px 18px;
    background: var(--surface);
    border-bottom: 1px solid var(--line);
    box-shadow: var(--shadow);
    display: none;
  }

  .nav.open {
    display: flex;
    animation: fadeUp 0.2s ease both;
  }

  .nav-link {
    padding: 10px 12px;
    font-size: 15px;
  }

  .nav-link.active::after {
    display: none;
  }

  .nav-link.active {
    background: var(--accent-soft);
  }

  .search {
    margin: 8px 0 4px;
    height: 40px;
  }

  .search input {
    width: 100%;
    flex: 1;
  }

  .admin-link {
    margin-left: 0;
    height: 38px;
  }
}
</style>
