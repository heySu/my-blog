<script setup>
import { ref, onMounted } from 'vue';
import { api } from '@/api';

const tags = ref([]);
const name = ref('');
const loading = ref(true);
const saving = ref(false);
const errorMsg = ref('');
const okMsg = ref('');

async function load() {
  loading.value = true;
  try {
    tags.value = await api.tags();
  } catch (err) {
    errorMsg.value = err.message;
  } finally {
    loading.value = false;
  }
}

async function create() {
  errorMsg.value = '';
  okMsg.value = '';
  if (!name.value.trim()) {
    errorMsg.value = '请输入标签名';
    return;
  }
  saving.value = true;
  try {
    await api.createTag({ name: name.value.trim() });
    name.value = '';
    okMsg.value = '已添加';
    await load();
    setTimeout(() => (okMsg.value = ''), 2000);
  } catch (err) {
    errorMsg.value = err.message;
  } finally {
    saving.value = false;
  }
}

async function remove(tag) {
  if (!confirm(`删除标签「${tag.name}」？关联的文章不会受影响。`)) return;
  try {
    await api.deleteTag(tag.id);
    tags.value = tags.value.filter(t => t.id !== tag.id);
  } catch (err) {
    alert(err.message);
  }
}

onMounted(load);
</script>

<template>
  <div class="wrap">
    <div class="panel create">
      <div class="create-row">
        <input
          v-model="name"
          class="input"
          placeholder="新标签名称，例如：性能优化"
          maxlength="50"
          @keyup.enter="create"
        />
        <button class="btn btn-primary" :disabled="saving" @click="create">
          {{ saving ? '添加中…' : '添加标签' }}
        </button>
      </div>
      <p v-if="errorMsg" class="msg err">{{ errorMsg }}</p>
      <p v-if="okMsg" class="msg ok">{{ okMsg }}</p>
    </div>

    <div class="panel">
      <div class="head">
        <span class="muted small">共 {{ tags.length }} 个标签</span>
      </div>

      <div v-if="loading" class="pad">
        <div class="skeleton" style="height: 44px"></div>
      </div>
      <div v-else-if="!tags.length" class="empty">还没有标签</div>

      <ul v-else class="list">
        <li v-for="t in tags" :key="t.id" class="item">
          <span class="hash">#</span>
          <span class="name">{{ t.name }}</span>
          <span class="slug">{{ t.slug }}</span>
          <span class="count">{{ t.count }} 篇</span>
          <button class="del" @click="remove(t)">删除</button>
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.wrap {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.panel {
  background: #fff;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  overflow: hidden;
}

.create {
  padding: 16px;
}

.create-row {
  display: flex;
  gap: 10px;
}

.create-row .input {
  max-width: 340px;
}

.msg {
  margin: 10px 0 0;
  font-size: 12.5px;
}

.msg.err {
  color: var(--danger);
}

.msg.ok {
  color: var(--accent);
}

.head {
  padding: 12px 16px;
  border-bottom: 1px solid var(--line);
  background: #fcfbf9;
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
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--line);
  font-size: 13.5px;
}

.item:last-child {
  border-bottom: 0;
}

.item:hover {
  background: #fcfbf9;
}

.hash {
  color: var(--accent-line);
  font-weight: 700;
}

.name {
  font-weight: 550;
  color: var(--ink);
}

.slug {
  font-family: var(--font-mono);
  font-size: 11.5px;
  color: var(--muted-2);
  background: var(--surface-2);
  padding: 1px 6px;
  border-radius: 4px;
}

.count {
  margin-left: auto;
  font-size: 12px;
  color: var(--muted-2);
}

.del {
  border: 0;
  background: transparent;
  color: var(--muted-2);
  font-size: 12.2px;
  cursor: pointer;
  padding: 3px 7px;
  border-radius: 6px;
}

.del:hover {
  background: #fdf1f0;
  color: var(--danger);
}
</style>
