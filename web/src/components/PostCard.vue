<script setup>
import { computed } from 'vue';

const props = defineProps({
  post: { type: Object, required: true },
  featured: { type: Boolean, default: false }
});

const date = computed(() => {
  const raw = props.post.published_at || props.post.created_at;
  if (!raw) return '';
  return String(raw).slice(0, 10).replace(/-/g, '.');
});

const cover = computed(() => props.post.cover || '');
const summary = computed(() => props.post.summary || '');

const views = computed(() => {
  const v = props.post.views || 0;
  return v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v;
});
</script>

<template>
  <article class="post-card" :class="{ featured }">
    <RouterLink :to="`/post/${post.slug}`" class="card-link">
      <div class="card-body">
        <div class="meta-top">
          <span class="date">{{ date }}</span>
          <span v-if="post.is_top" class="badge badge-top">置顶</span>
          <span v-if="post.status === 'draft'" class="badge badge-draft">草稿</span>
        </div>

        <h2 class="title">{{ post.title }}</h2>
        <p v-if="summary" class="summary">{{ summary }}</p>

        <div class="meta-bottom">
          <span v-for="t in post.tags.slice(0, 3)" :key="t.id" class="tag">#{{ t.name }}</span>
          <span class="dot-sep">·</span>
          <span>{{ post.readingMinutes }} 分钟</span>
          <span class="dot-sep">·</span>
          <span>{{ views }} 次阅读</span>
          <template v-if="post.commentCount">
            <span class="dot-sep">·</span>
            <span>{{ post.commentCount }} 条评论</span>
          </template>
        </div>
      </div>

      <div v-if="cover" class="cover">
        <img :src="cover" :alt="post.title" loading="lazy" />
      </div>
    </RouterLink>
  </article>
</template>

<style scoped>
.post-card {
  border-bottom: 1px solid var(--line);
  transition: background 0.2s ease;
}

.post-card:last-child {
  border-bottom: 0;
}

.card-link {
  display: flex;
  gap: 28px;
  padding: 26px 4px;
  align-items: flex-start;
  border-radius: 10px;
  transition: padding 0.22s cubic-bezier(0.16, 1, 0.3, 1), background 0.2s ease;
}

.post-card:hover .card-link {
  padding-left: 14px;
  padding-right: 14px;
  background: rgba(255, 255, 255, 0.72);
}

.card-body {
  flex: 1;
  min-width: 0;
}

.meta-top {
  display: flex;
  align-items: center;
  gap: 9px;
  margin-bottom: 7px;
}

.date {
  font-size: 12.5px;
  color: var(--muted-2);
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.02em;
}

.title {
  margin: 0 0 8px;
  font-size: 19.5px;
  font-weight: 620;
  line-height: 1.45;
  letter-spacing: -0.015em;
  color: var(--ink);
  transition: color 0.18s ease;
}

.post-card:hover .title {
  color: var(--accent);
}

.summary {
  margin: 0 0 14px;
  font-size: 14.2px;
  line-height: 1.72;
  color: var(--muted);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.meta-bottom {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  font-size: 12.5px;
  color: var(--muted-2);
}

.tag {
  color: var(--accent);
  background: var(--accent-soft);
  padding: 1px 7px;
  border-radius: 5px;
  font-size: 12px;
}

.dot-sep {
  opacity: 0.5;
  margin: 0 2px;
}

.cover {
  flex: 0 0 auto;
  width: 176px;
  height: 116px;
  border-radius: 11px;
  overflow: hidden;
  background: var(--surface-2);
  border: 1px solid var(--line);
}

.cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}

.post-card:hover .cover img {
  transform: scale(1.045);
}

/* 首篇大卡片 */
.featured .card-link {
  flex-direction: column-reverse;
  gap: 18px;
  padding: 4px 0 28px;
}

.featured .cover {
  width: 100%;
  height: 262px;
  border-radius: var(--radius);
}

.featured .title {
  font-size: 27px;
  line-height: 1.35;
  letter-spacing: -0.02em;
}

.featured .summary {
  font-size: 15px;
  -webkit-line-clamp: 3;
  line-clamp: 3;
}

@media (max-width: 760px) {
  .cover {
    width: 104px;
    height: 82px;
  }
  .card-link {
    gap: 16px;
    padding: 20px 2px;
  }
  .title {
    font-size: 17px;
  }
  .summary {
    -webkit-line-clamp: 2;
    line-clamp: 2;
    font-size: 13.5px;
  }
  .featured .cover {
    height: 180px;
  }
  .featured .title {
    font-size: 22px;
  }
  .post-card:hover .card-link {
    padding-left: 4px;
    padding-right: 4px;
  }
}
</style>
