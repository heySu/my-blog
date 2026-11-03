<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { api } from '@/api';
import Pagination from '@/components/Pagination.vue';

const router = useRouter();

const posts = ref([]);
const total = ref(0);
const page = ref(1);
const totalPages = ref(1);
const size = 8;
const loading = ref(true);
const keyword = ref('');
const filter = ref('all');
const stats = ref({ all: 0, published: 0, draft: 0, comments: 0 });
const errorMsg = ref('');

const tabs = [
  { key: 'all', label: '全部' },
  { key: 'published', label: '已发布' },
  { key: 'draft', label: '草稿' }
];

const countOf = key => (key === 'all' ? stats.value.all : stats.value[key] || 0);

async function load(preservePage = false) {
  loading.value = true;
  errorMsg.value = '';
  if (!preservePage) page.value = 1;
  try {
    const params = { page: page.value, size, status: 'all', keyword: keyword.value };
    if (filter.value !== 'all') params.filter = filter.value;
    const data = await api.posts(params);
    posts.value = data.list;
    total.value = data.total;
    totalPages.value = data.totalPages;
  } catch (err) {
    errorMsg.value = err.message;
  } finally {
    loading.value = false;
  }
}

async function loadStats() {
  try {
    const [info, all, published, draft, comments] = await Promise.all([
      api.siteInfo(),
      api.posts({ page: 1, size: 1, status: 'all' }),
      api.posts({ page: 1, size: 1, status: 'all', filter: 'published' }),
      api.posts({ page: 1, size: 1, status: 'all', filter: 'draft' }),
      api.allComments({})
    ]);
    stats.value = {
      all: all.total,
      published: published.total,
      draft: draft.total,
      comments: comments.length,
      views: info.stats.viewCount
    };
  } catch {
    /* ignore */
  }
}

function switchTab(key) {
  filter.value = key;
  load();
}

function changePage(p) {
  page.value = p;
  load(true);
}

async function remove(post) {
  if (!confirm(`确定删除《${post.title}》吗？该操作不可恢复。`)) return;
  try {
    await api.deletePost(post.id);
    posts.value = posts.value.filter(p => p.id !== post.id);
    total.value -= 1;
    stats.value.all -= 1;
    if (post.status === 'published') stats.value.published -= 1;
    else stats.value.draft -= 1;
  } catch (err) {
    alert(err.message);
  }
}

const fmt = raw => (raw ? String(raw).slice(0, 10) : '—');
const shown = computed(() => posts.value.length);

onMounted(() => {
  load();
  loadStats();
});
</script>

<template>
  <div class="dash">
    <div class="stats">
      <div class="stat">
        <span class="label">文章总数</span>
        <b class="value">{{ stats.all }}</b>
      </div>
      <div class="stat">
        <span class="label">已发布</span>
        <b class="value">{{ stats.published }}</b>
      </div>
      <div class="stat">
        <span class="label">草稿</span>
        <b class="value">{{ stats.draft }}</b>
      </div>
      <div class="stat">
        <span class="label">累计阅读</span>
        <b class="value">{{ stats.views || 0 }}</b>
      </div>
    </div>

    <div class="panel">
      <div class="toolbar">
        <div class="tabs">
          <button
            v-for="t in tabs"
            :key="t.key"
            class="tab"
            :class="{ active: filter === t.key }"
            @click="switchTab(t.key)"
          >
            {{ t.label }}<span class="num">{{ countOf(t.key) }}</span>
          </button>
        </div>

        <div class="search">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" stroke-linecap="round" />
          </svg>
          <input v-model="keyword" placeholder="搜索标题或内容" @keyup.enter="load()" />
        </div>
      </div>

      <div v-if="loading" class="skeleton-list">
        <div v-for="i in 4" :key="i" class="skeleton" style="height: 52px; margin-bottom: 8px"></div>
      </div>

      <div v-else-if="errorMsg" class="empty">{{ errorMsg }}</div>

      <div v-else-if="!posts.length" class="empty">
        <div class="empty-icon">✎</div>
        <p>还没有文章，去写下第一篇吧</p>
        <RouterLink to="/admin/posts/new" class="btn btn-primary btn-sm" style="margin-top: 14px">
          写文章
        </RouterLink>
      </div>

      <table v-else class="table">
        <thead>
          <tr>
            <th>标题</th>
            <th class="w-status">状态</th>
            <th class="w-num">阅读</th>
            <th class="w-date">日期</th>
            <th class="w-act">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in posts" :key="p.id">
            <td>
              <div class="cell-title">
                <span v-if="p.is_top" class="badge badge-top">置顶</span>
                <RouterLink :to="`/admin/posts/${p.id}/edit`" class="title-link">{{ p.title }}</RouterLink>
              </div>
              <div class="cell-sub">
                <span v-for="t in p.tags" :key="t.id" class="mini-tag">{{ t.name }}</span>
                <span v-if="!p.tags.length" class="muted">无标签</span>
              </div>
            </td>
            <td>
              <span class="badge" :class="p.status === 'published' ? 'badge-published' : 'badge-draft'">
                {{ p.status === 'published' ? '已发布' : '草稿' }}
              </span>
            </td>
            <td class="w-num">{{ p.views }}</td>
            <td class="w-date">{{ fmt(p.published_at || p.created_at) }}</td>
            <td class="w-act">
              <div class="actions">
                <RouterLink
                  v-if="p.status === 'published'"
                  :to="`/post/${p.slug}`"
                  target="_blank"
                  class="act"
                  title="预览"
                >
                  预览
                </RouterLink>
                <RouterLink :to="`/admin/posts/${p.id}/edit`" class="act">编辑</RouterLink>
                <button class="act danger" @click="remove(p)">删除</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <div v-if="!loading && posts.length" class="table-foot">
        <span class="muted small">共 {{ total }} 条</span>
        <Pagination :page="page" :total-pages="totalPages" @change="changePage" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}

.stat {
  background: #fff;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  padding: 16px 18px;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.label {
  font-size: 12.2px;
  color: var(--muted-2);
}

.value {
  font-size: 24px;
  font-weight: 650;
  letter-spacing: -0.03em;
  font-variant-numeric: tabular-nums;
  line-height: 1.2;
}

.panel {
  background: #fff;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  overflow: hidden;
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 14px 16px;
  border-bottom: 1px solid var(--line);
  flex-wrap: wrap;
}

.tabs {
  display: flex;
  gap: 3px;
  background: var(--surface-2);
  padding: 3px;
  border-radius: 9px;
}

.tab {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: 0;
  background: transparent;
  padding: 6px 12px;
  border-radius: 7px;
  font-size: 13px;
  color: var(--muted);
  cursor: pointer;
  transition: all 0.16s ease;
}

.tab:hover {
  color: var(--ink);
}

.tab.active {
  background: #fff;
  color: var(--ink);
  font-weight: 600;
  box-shadow: var(--shadow-sm);
}

.num {
  font-size: 11.5px;
  color: var(--muted-2);
  font-variant-numeric: tabular-nums;
}

.search {
  display: flex;
  align-items: center;
  gap: 7px;
  height: 34px;
  padding: 0 12px;
  border: 1px solid var(--line-strong);
  border-radius: 9px;
  color: var(--muted-2);
  background: #fff;
}

.search:focus-within {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgba(47, 93, 80, 0.08);
}

.search input {
  border: 0;
  outline: none;
  background: transparent;
  font-size: 13px;
  width: 158px;
}

.table {
  width: 100%;
  border-collapse: collapse;
}

.table th {
  text-align: left;
  font-size: 12px;
  font-weight: 600;
  color: var(--muted-2);
  padding: 10px 16px;
  border-bottom: 1px solid var(--line);
  background: #fcfbf9;
  letter-spacing: 0.02em;
}

.table td {
  padding: 13px 16px;
  border-bottom: 1px solid var(--line);
  vertical-align: middle;
  font-size: 13.5px;
}

.table tbody tr:last-child td {
  border-bottom: 0;
}

.table tbody tr:hover {
  background: #fcfbf9;
}

.cell-title {
  display: flex;
  align-items: center;
  gap: 7px;
}

.title-link {
  font-weight: 550;
  color: var(--ink);
  line-height: 1.5;
}

.title-link:hover {
  color: var(--accent);
}

.cell-sub {
  display: flex;
  gap: 5px;
  margin-top: 5px;
  flex-wrap: wrap;
}

.mini-tag {
  font-size: 11.5px;
  color: var(--muted);
  background: var(--surface-2);
  padding: 1px 7px;
  border-radius: 5px;
}

.w-status {
  width: 92px;
}

.w-num {
  width: 76px;
  font-variant-numeric: tabular-nums;
  color: var(--muted);
}

.w-date {
  width: 110px;
  color: var(--muted-2);
  font-size: 12.5px;
  font-variant-numeric: tabular-nums;
}

.w-act {
  width: 150px;
}

.actions {
  display: flex;
  gap: 4px;
}

.act {
  border: 0;
  background: transparent;
  padding: 4px 7px;
  border-radius: 6px;
  font-size: 12.5px;
  color: var(--muted);
  cursor: pointer;
  transition: all 0.15s ease;
}

.act:hover {
  background: var(--accent-soft);
  color: var(--accent);
}

.act.danger:hover {
  background: #fdf1f0;
  color: var(--danger);
}

.table-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px 16px;
  gap: 12px;
  flex-wrap: wrap;
}

.table-foot :deep(.pagination) {
  margin-top: 0;
}

@media (max-width: 900px) {
  .stats {
    grid-template-columns: repeat(2, 1fr);
  }
  .w-num,
  .w-date {
    display: none;
  }
  .table th,
  .table td {
    padding: 11px 12px;
  }
}
</style>
