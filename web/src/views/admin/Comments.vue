<script setup>
import { ref, onMounted } from 'vue';
import { api } from '@/api';

const comments = ref([]);
const loading = ref(true);
const filter = ref('');
const errorMsg = ref('');

const tabs = [
  { key: '', label: '全部' },
  { key: 'approved', label: '已通过' },
  { key: 'pending', label: '待审核' },
  { key: 'rejected', label: '已拒绝' }
];

async function load() {
  loading.value = true;
  try {
    comments.value = await api.allComments(filter.value ? { status: filter.value } : {});
  } catch (err) {
    errorMsg.value = err.message;
  } finally {
    loading.value = false;
  }
}

function switchTab(key) {
  filter.value = key;
  load();
}

async function setStatus(c, status) {
  try {
    await api.setCommentStatus(c.id, status);
    c.status = status;
  } catch (err) {
    alert(err.message);
  }
}

async function remove(c) {
  if (!confirm('确定删除这条评论吗？')) return;
  try {
    await api.deleteComment(c.id);
    comments.value = comments.value.filter(x => x.id !== c.id);
  } catch (err) {
    alert(err.message);
  }
}

function fmt(raw) {
  if (!raw) return '';
  return String(raw).slice(0, 16);
}

const statusText = { approved: '已通过', pending: '待审核', rejected: '已拒绝' };

onMounted(load);
</script>

<template>
  <div class="wrap">
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
            {{ t.label }}
          </button>
        </div>
        <span class="muted small">{{ comments.length }} 条</span>
      </div>

      <div v-if="loading" class="pad">
        <div v-for="i in 3" :key="i" class="skeleton" style="height: 64px; margin-bottom: 8px"></div>
      </div>

      <div v-else-if="errorMsg" class="empty">{{ errorMsg }}</div>
      <div v-else-if="!comments.length" class="empty">
        <div class="empty-icon">✉</div>
        <p>暂时没有评论</p>
      </div>

      <ul v-else class="list">
        <li v-for="c in comments" :key="c.id" class="item">
          <div class="avatar">{{ c.nickname[0] }}</div>

          <div class="body">
            <div class="line">
              <span class="name">{{ c.nickname }}</span>
              <span v-if="c.email" class="email">{{ c.email }}</span>
              <span class="time">{{ fmt(c.created_at) }}</span>
              <span class="badge" :class="c.status === 'approved' ? 'badge-published' : 'badge-draft'">
                {{ statusText[c.status] }}
              </span>
            </div>
            <p class="text">{{ c.content }}</p>
            <RouterLink v-if="c.postSlug" :to="`/post/${c.postSlug}`" target="_blank" class="post-ref">
              来自《{{ c.postTitle }}》
            </RouterLink>
          </div>

          <div class="actions">
            <button v-if="c.status !== 'approved'" class="act ok" @click="setStatus(c, 'approved')">
              通过
            </button>
            <button v-if="c.status !== 'rejected'" class="act" @click="setStatus(c, 'rejected')">
              拒绝
            </button>
            <button class="act danger" @click="remove(c)">删除</button>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
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
  padding: 13px 16px;
  border-bottom: 1px solid var(--line);
  gap: 12px;
}

.tabs {
  display: flex;
  gap: 3px;
  background: var(--surface-2);
  padding: 3px;
  border-radius: 9px;
}

.tab {
  border: 0;
  background: transparent;
  padding: 6px 12px;
  border-radius: 7px;
  font-size: 13px;
  color: var(--muted);
  cursor: pointer;
}

.tab.active {
  background: #fff;
  color: var(--ink);
  font-weight: 600;
  box-shadow: var(--shadow-sm);
}

.pad {
  padding: 16px;
}

.list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.item {
  display: flex;
  gap: 12px;
  padding: 16px;
  border-bottom: 1px solid var(--line);
}

.item:last-child {
  border-bottom: 0;
}

.item:hover {
  background: #fcfbf9;
}

.avatar {
  flex: 0 0 34px;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: var(--accent-soft);
  color: var(--accent);
  display: grid;
  place-items: center;
  font-size: 13.5px;
  font-weight: 600;
  border: 1px solid var(--accent-line);
}

.body {
  flex: 1;
  min-width: 0;
}

.line {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 4px;
}

.name {
  font-size: 13.5px;
  font-weight: 600;
}

.email {
  font-size: 11.8px;
  color: var(--muted-2);
}

.time {
  font-size: 11.8px;
  color: var(--muted-2);
  font-variant-numeric: tabular-nums;
}

.text {
  margin: 0 0 5px;
  font-size: 13.5px;
  line-height: 1.7;
  color: var(--ink-2);
  word-break: break-word;
}

.post-ref {
  font-size: 11.8px;
  color: var(--muted-2);
}

.post-ref:hover {
  color: var(--accent);
}

.actions {
  display: flex;
  gap: 3px;
  align-items: flex-start;
}

.act {
  border: 1px solid var(--line);
  background: #fff;
  padding: 4px 9px;
  border-radius: 6px;
  font-size: 12px;
  color: var(--muted);
  cursor: pointer;
  white-space: nowrap;
}

.act:hover {
  border-color: var(--accent-line);
  color: var(--accent);
  background: var(--accent-soft);
}

.act.ok {
  color: var(--accent);
  border-color: var(--accent-line);
}

.act.danger:hover {
  color: var(--danger);
  border-color: #e8c3bf;
  background: #fdf1f0;
}

@media (max-width: 720px) {
  .item {
    flex-wrap: wrap;
  }
  .actions {
    width: 100%;
    padding-left: 46px;
  }
}
</style>
