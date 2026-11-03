<script setup>
import { computed } from 'vue';

const props = defineProps({
  page: { type: Number, default: 1 },
  totalPages: { type: Number, default: 1 }
});
const emit = defineEmits(['change']);

/** 生成页码序列，超过 7 页时用省略号 */
const items = computed(() => {
  const total = props.totalPages;
  const cur = props.page;
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const set = new Set([1, total, cur, cur - 1, cur + 1, cur - 2, cur + 2]);
  const pages = [...set].filter(p => p >= 1 && p <= total).sort((a, b) => a - b);

  const result = [];
  let prev = 0;
  for (const p of pages) {
    if (prev && p - prev > 1) result.push('…');
    result.push(p);
    prev = p;
  }
  return result;
});

function go(p) {
  if (p === '…' || p === props.page || p < 1 || p > props.totalPages) return;
  emit('change', p);
}
</script>

<template>
  <nav v-if="totalPages > 1" class="pagination">
    <button class="page-btn nav" :disabled="page <= 1" @click="go(page - 1)">上一页</button>

    <button
      v-for="(p, i) in items"
      :key="`${p}-${i}`"
      class="page-btn"
      :class="{ active: p === page, dots: p === '…' }"
      :disabled="p === '…'"
      @click="go(p)"
    >
      {{ p }}
    </button>

    <button class="page-btn nav" :disabled="page >= totalPages" @click="go(page + 1)">下一页</button>
  </nav>
</template>

<style scoped>
.pagination {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 34px;
  flex-wrap: wrap;
}

.page-btn {
  min-width: 36px;
  height: 36px;
  padding: 0 11px;
  border-radius: 9px;
  border: 1px solid var(--line);
  background: var(--surface);
  color: var(--muted);
  font-size: 13.5px;
  cursor: pointer;
  transition: all 0.16s ease;
  font-variant-numeric: tabular-nums;
}

.page-btn:hover:not(:disabled) {
  border-color: var(--accent-line);
  color: var(--accent);
  background: var(--accent-soft);
}

.page-btn.active {
  background: var(--accent);
  border-color: var(--accent);
  color: #fff;
  font-weight: 600;
}

.page-btn:disabled {
  opacity: 0.42;
  cursor: not-allowed;
}

.page-btn.dots {
  border-color: transparent;
  background: transparent;
  pointer-events: none;
}

.page-btn.nav {
  color: var(--ink-2);
}
</style>
