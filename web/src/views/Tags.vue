<script setup>
import { ref, onMounted, computed } from 'vue';
import { api } from '@/api';

const tags = ref([]);
const loading = ref(true);
const errorMsg = ref('');

const visible = computed(() => tags.value.filter(t => t.count > 0));
const total = computed(() => visible.value.reduce((s, t) => s + t.count, 0));

onMounted(async () => {
  try {
    tags.value = await api.tags();
  } catch (err) {
    errorMsg.value = err.message;
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="page">
    <div class="container narrow">
      <header class="head">
        <p class="eyebrow">TOPICS</p>
        <h1 class="title">标签</h1>
        <p class="sub">{{ visible.length }} 个标签，{{ total }} 篇文章。</p>
      </header>

      <div v-if="loading" class="skeleton" style="height: 160px"></div>
      <div v-else-if="errorMsg" class="empty">{{ errorMsg }}</div>
      <div v-else-if="!visible.length" class="empty">
        <div class="empty-icon">#</div>
        <p>还没有标签</p>
      </div>

      <div v-else class="grid">
        <RouterLink
          v-for="(t, i) in visible"
          :key="t.id"
          :to="{ path: '/', query: { tag: t.slug } }"
          class="tag-card fade-up"
          :style="{ animationDelay: `${i * 35}ms` }"
        >
          <span class="hash">#</span>
          <span class="name">{{ t.name }}</span>
          <span class="count">{{ t.count }}</span>
        </RouterLink>
      </div>
    </div>
  </div>
</template>

<style scoped>
.narrow {
  max-width: 860px;
}

.head {
  padding: 20px 0 40px;
  border-bottom: 1px solid var(--line);
  margin-bottom: 30px;
}

.eyebrow {
  margin: 0 0 10px;
  font-size: 11.5px;
  letter-spacing: 0.22em;
  color: var(--muted-2);
  font-weight: 600;
}

.title {
  margin: 0;
  font-size: clamp(28px, 4vw, 38px);
  letter-spacing: -0.03em;
}

.sub {
  margin: 12px 0 0;
  color: var(--muted);
  font-size: 14.5px;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 12px;
}

.tag-card {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px 16px;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  background: var(--surface);
  transition: all 0.18s ease;
}

.tag-card:hover {
  border-color: var(--accent-line);
  background: var(--accent-soft);
  transform: translateY(-2px);
  box-shadow: var(--shadow);
}

.hash {
  color: var(--accent-line);
  font-weight: 700;
  font-size: 16px;
  transition: color 0.18s ease;
}

.tag-card:hover .hash {
  color: var(--accent);
}

.name {
  flex: 1;
  font-size: 14.5px;
  font-weight: 550;
  color: var(--ink-2);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tag-card:hover .name {
  color: var(--accent);
}

.count {
  font-size: 12px;
  color: var(--muted-2);
  background: var(--surface-2);
  padding: 1px 7px;
  border-radius: 20px;
}

.tag-card:hover .count {
  background: #fff;
  color: var(--accent);
}
</style>
