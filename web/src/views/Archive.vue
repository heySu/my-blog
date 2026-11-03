<script setup>
import { ref, onMounted, computed } from 'vue';
import { api } from '@/api';

const groups = ref([]);
const loading = ref(true);
const errorMsg = ref('');

const total = computed(() => groups.value.reduce((s, g) => s + g.count, 0));

onMounted(async () => {
  try {
    groups.value = await api.archive();
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
        <p class="eyebrow">ARCHIVE</p>
        <h1 class="title">归档</h1>
        <p class="sub">一共 {{ total }} 篇，按时间倒序排列。</p>
      </header>

      <div v-if="loading" class="skeleton" style="height: 200px"></div>
      <div v-else-if="errorMsg" class="empty">{{ errorMsg }}</div>
      <div v-else-if="!groups.length" class="empty">
        <div class="empty-icon">✎</div>
        <p>还没有发布任何文章</p>
      </div>

      <template v-else>
        <section v-for="g in groups" :key="g.year" class="year-group fade-up">
        <div class="year-head">
          <h2 class="year">{{ g.year }}</h2>
          <span class="year-count">{{ g.count }} 篇</span>
          <span class="line"></span>
        </div>

        <ul class="items">
          <li v-for="p in g.posts" :key="p.id" class="item">
            <RouterLink :to="`/post/${p.slug}`" class="item-link">
              <time class="date">{{ p.date }}</time>
              <span class="dot"></span>
              <span class="text">{{ p.title }}</span>
              <span class="arrow">→</span>
            </RouterLink>
          </li>
        </ul>
      </section>
      </template>
    </div>
  </div>
</template>

<style scoped>
.narrow {
  max-width: 800px;
}

.head {
  padding: 20px 0 40px;
  border-bottom: 1px solid var(--line);
  margin-bottom: 20px;
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

.year-group {
  margin-bottom: 40px;
}

.year-head {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
}

.year {
  margin: 0;
  font-family: var(--font-serif);
  font-size: 22px;
  font-weight: 600;
  letter-spacing: -0.01em;
  color: var(--ink);
}

.year-count {
  font-size: 12px;
  color: var(--muted-2);
}

.line {
  flex: 1;
  height: 1px;
  background: var(--line);
}

.items {
  list-style: none;
  margin: 0;
  padding: 0;
}

.item-link {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 11px 10px;
  border-radius: 9px;
  transition: background 0.16s ease, padding 0.2s ease;
}

.item-link:hover {
  background: var(--surface);
  padding-left: 16px;
}

.date {
  font-size: 12.8px;
  color: var(--muted-2);
  font-variant-numeric: tabular-nums;
  flex: 0 0 auto;
  letter-spacing: 0.01em;
}

.dot {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: var(--line-strong);
  flex: 0 0 auto;
}

.text {
  flex: 1;
  font-size: 15px;
  color: var(--ink-2);
  transition: color 0.16s ease;
}

.item-link:hover .text {
  color: var(--accent);
}

.arrow {
  opacity: 0;
  transform: translateX(-4px);
  transition: all 0.18s ease;
  color: var(--accent);
  font-size: 13px;
}

.item-link:hover .arrow {
  opacity: 1;
  transform: translateX(0);
}

@media (max-width: 560px) {
  .date {
    display: none;
  }
  .dot {
    display: none;
  }
}
</style>
