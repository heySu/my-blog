<script setup>
import { ref, watch, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { api } from '@/api';
import { useSiteStore } from '@/stores/site';
import PostCard from '@/components/PostCard.vue';
import Pagination from '@/components/Pagination.vue';

const route = useRoute();
const router = useRouter();
const site = useSiteStore();

const posts = ref([]);
const total = ref(0);
const page = ref(1);
const size = 6;
const totalPages = ref(1);
const loading = ref(true);
const errorMsg = ref('');
const tags = ref([]);
const recent = ref([]);

const keyword = computed(() => route.query.keyword || '');
const activeTag = computed(() => route.query.tag || '');

const greeting = computed(() => {
  const h = new Date().getHours();
  if (h < 6) return '夜深了';
  if (h < 11) return '早上好';
  if (h < 14) return '中午好';
  if (h < 18) return '下午好';
  return '晚上好';
});

const heading = computed(() => {
  if (keyword.value) return `搜索「${keyword.value}」`;
  if (activeTag.value) return `标签：${activeTag.value}`;
  return '';
});

async function loadPosts() {
  loading.value = true;
  errorMsg.value = '';
  try {
    const data = await api.posts({
      page: page.value,
      size,
      keyword: keyword.value,
      tag: activeTag.value
    });
    posts.value = data.list;
    total.value = data.total;
    totalPages.value = data.totalPages;
  } catch (err) {
    errorMsg.value = err.message;
    posts.value = [];
  } finally {
    loading.value = false;
  }
}

async function loadSidebar() {
  try {
    const [tagList, latest] = await Promise.all([
      api.tags(),
      api.posts({ page: 1, size: 5 })
    ]);
    tags.value = tagList.filter(t => t.count > 0).slice(0, 12);
    recent.value = latest.list.slice(0, 5);
  } catch {
    /* 侧边栏失败不影响主内容 */
  }
}

function changePage(p) {
  page.value = p;
  loadPosts();
  window.scrollTo({ top: 220, behavior: 'smooth' });
}

function clickTag(tag) {
  router.push({ path: '/', query: tag === activeTag.value ? {} : { tag } });
}

function clearFilter() {
  router.push({ path: '/' });
}

watch(
  () => route.query,
  () => {
    page.value = 1;
    loadPosts();
  }
);

onMounted(async () => {
  await site.load();
  document.title = `${site.config.site_title || site.author.nickname + '的博客'} · ${site.config.site_subtitle || '写代码，也写生活'}`;
  loadPosts();
  loadSidebar();
});
</script>

<template>
  <div class="page">
    <div class="container">
      <!-- Hero -->
      <section v-if="!keyword && !activeTag" class="hero">
        <p class="hero-hi">{{ greeting }}，欢迎来到</p>
        <h1 class="hero-title">{{ site.config.site_title || `${site.author.nickname}的博客` }}</h1>
        <p class="hero-sub">{{ site.config.site_subtitle || '写代码，也写生活' }}</p>
        <div class="hero-stats">
          <span><b>{{ site.stats.postCount }}</b> 篇文章</span>
          <span class="sep">/</span>
          <span><b>{{ site.stats.tagCount }}</b> 个标签</span>
          <span class="sep">/</span>
          <span><b>{{ site.stats.viewCount }}</b> 次阅读</span>
        </div>
      </section>

      <!-- 筛选态 -->
      <section v-else class="filter-head">
        <button class="back" @click="clearFilter">← 返回全部</button>
        <h1 class="filter-title">{{ heading }}</h1>
        <p class="muted small">共 {{ total }} 篇相关文章</p>
      </section>

      <div class="layout">
        <!-- 文章列表 -->
        <section class="list">
          <div v-if="loading" class="loading-list">
            <div v-for="i in 3" :key="i" class="skeleton-row">
              <div class="skeleton" style="height: 20px; width: 55%"></div>
              <div class="skeleton" style="height: 14px; width: 100%"></div>
              <div class="skeleton" style="height: 14px; width: 78%"></div>
            </div>
          </div>

          <div v-else-if="errorMsg" class="empty">
            <div class="empty-icon">⚠</div>
            <p>{{ errorMsg }}</p>
            <button class="btn btn-sm" style="margin-top: 12px" @click="loadPosts">重新加载</button>
          </div>

          <div v-else-if="!posts.length" class="empty">
            <div class="empty-icon">✎</div>
            <p>这里还没有文章</p>
          </div>

          <template v-else>
            <PostCard
              v-for="(post, i) in posts"
              :key="post.id"
              :post="post"
              :featured="i === 0 && page === 1 && !keyword && !activeTag"
              class="fade-up"
              :style="{ animationDelay: `${i * 45}ms` }"
            />
            <Pagination :page="page" :total-pages="totalPages" @change="changePage" />
          </template>
        </section>

        <!-- 侧边栏 -->
        <aside class="sidebar">
          <div class="author-card">
            <div class="avatar">
              <img v-if="site.author.avatar" :src="site.author.avatar" :alt="site.author.nickname" />
              <span v-else>{{ (site.author.nickname || '博')[0] }}</span>
            </div>
            <h3 class="author-name">{{ site.author.nickname }}</h3>
            <p class="author-bio">{{ site.author.bio || '这个人很懒，什么都没写。' }}</p>
            <div class="author-stats">
              <div>
                <b>{{ site.stats.postCount }}</b>
                <span>文章</span>
              </div>
              <div>
                <b>{{ site.stats.commentCount }}</b>
                <span>评论</span>
              </div>
              <div>
                <b>{{ site.stats.tagCount }}</b>
                <span>标签</span>
              </div>
            </div>
          </div>

          <div v-if="tags.length" class="side-block">
            <h4 class="side-title">标签</h4>
            <div class="tag-cloud">
              <button
                v-for="t in tags"
                :key="t.id"
                class="chip"
                :class="{ 'is-active': activeTag === t.slug }"
                @click="clickTag(t.slug)"
              >
                {{ t.name }}<span class="count">{{ t.count }}</span>
              </button>
            </div>
          </div>

          <div v-if="recent.length" class="side-block">
            <h4 class="side-title">最近更新</h4>
            <ul class="recent-list">
              <li v-for="r in recent" :key="r.id">
                <RouterLink :to="`/post/${r.slug}`">{{ r.title }}</RouterLink>
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  </div>
</template>

<style scoped>
.hero {
  padding: 26px 0 46px;
  border-bottom: 1px solid var(--line);
  margin-bottom: 8px;
}

.hero-hi {
  margin: 0 0 10px;
  font-size: 13.5px;
  color: var(--muted-2);
  letter-spacing: 0.06em;
}

.hero-title {
  margin: 0;
  font-size: clamp(30px, 4.4vw, 46px);
  font-weight: 700;
  letter-spacing: -0.035em;
  line-height: 1.2;
  color: var(--ink);
}

.hero-sub {
  margin: 14px 0 0;
  font-size: 16px;
  color: var(--muted);
}

.hero-stats {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 22px;
  font-size: 13.5px;
  color: var(--muted-2);
}

.hero-stats b {
  color: var(--ink-2);
  font-weight: 650;
  font-variant-numeric: tabular-nums;
}

.sep {
  opacity: 0.4;
}

.filter-head {
  padding: 12px 0 26px;
  border-bottom: 1px solid var(--line);
  margin-bottom: 8px;
}

.back {
  border: 0;
  background: none;
  padding: 0;
  color: var(--muted);
  font-size: 13px;
  cursor: pointer;
  margin-bottom: 14px;
}

.back:hover {
  color: var(--accent);
}

.filter-title {
  margin: 0 0 6px;
  font-size: 28px;
  letter-spacing: -0.025em;
}

.layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 288px;
  gap: 62px;
  align-items: start;
}

.list {
  min-width: 0;
}

.loading-list {
  padding-top: 10px;
}

.skeleton-row {
  display: flex;
  flex-direction: column;
  gap: 11px;
  padding: 26px 0;
  border-bottom: 1px solid var(--line);
}

.sidebar {
  position: sticky;
  top: calc(var(--header-h) + 26px);
  display: flex;
  flex-direction: column;
  gap: 26px;
  padding-top: 24px;
}

.author-card {
  padding: 24px 20px;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: linear-gradient(180deg, #ffffff, #fbfaf7);
  text-align: center;
  box-shadow: var(--shadow-sm);
}

.avatar {
  width: 62px;
  height: 62px;
  margin: 0 auto 12px;
  border-radius: 50%;
  background: var(--accent);
  color: #fff;
  display: grid;
  place-items: center;
  font-size: 24px;
  font-family: var(--font-serif);
  overflow: hidden;
  box-shadow: 0 6px 18px -8px rgba(47, 93, 80, 0.7);
}

.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.author-name {
  margin: 0 0 7px;
  font-size: 16px;
  font-weight: 650;
  letter-spacing: -0.01em;
}

.author-bio {
  margin: 0;
  font-size: 12.8px;
  line-height: 1.7;
  color: var(--muted);
}

.author-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 4px;
  margin-top: 18px;
  padding-top: 16px;
  border-top: 1px solid var(--line);
}

.author-stats div {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.author-stats b {
  font-size: 16px;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.01em;
}

.author-stats span {
  font-size: 11.5px;
  color: var(--muted-2);
}

.side-block {
  padding-top: 4px;
}

.side-title {
  margin: 0 0 13px;
  font-size: 12px;
  font-weight: 650;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--muted-2);
}

.tag-cloud {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
}

.count {
  font-size: 11px;
  opacity: 0.6;
  margin-left: 2px;
}

.chip.is-active .count {
  opacity: 0.85;
}

.recent-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.recent-list a {
  display: block;
  padding: 7px 0;
  font-size: 13.6px;
  line-height: 1.55;
  color: var(--ink-2);
  border-bottom: 1px dashed transparent;
  transition: color 0.16s ease;
}

.recent-list a:hover {
  color: var(--accent);
}

@media (max-width: 980px) {
  .layout {
    grid-template-columns: 1fr;
    gap: 40px;
  }
  .sidebar {
    position: static;
    padding-top: 10px;
    flex-direction: row;
    flex-wrap: wrap;
    gap: 20px;
  }
  .author-card {
    flex: 1 1 260px;
  }
  .side-block {
    flex: 1 1 180px;
  }
}

@media (max-width: 640px) {
  .hero {
    padding: 12px 0 32px;
  }
  .sidebar {
    flex-direction: column;
  }
  .author-card {
    display: none;
  }
}
</style>
