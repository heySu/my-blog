<script setup>
import { ref, watch, onMounted, onUnmounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import { api } from '@/api';
import MarkdownView from '@/components/MarkdownView.vue';
import CommentSection from '@/components/CommentSection.vue';

const route = useRoute();
const post = ref(null);
const loading = ref(true);
const errorMsg = ref('');
const progress = ref(0);

const date = computed(() => {
  if (!post.value) return '';
  const raw = post.value.published_at || post.value.created_at;
  return String(raw).slice(0, 10).replace(/-/g, '.');
});

function onScroll() {
  const el = document.documentElement;
  const max = el.scrollHeight - el.clientHeight;
  progress.value = max > 0 ? Math.min(100, (el.scrollTop / max) * 100) : 0;
}

async function load() {
  loading.value = true;
  errorMsg.value = '';
  try {
    post.value = await api.post(String(route.params.slug));
    document.title = `${post.value.title} · 林小岸的博客`;
  } catch (err) {
    errorMsg.value = err.message;
    post.value = null;
  } finally {
    loading.value = false;
  }
}

watch(() => route.params.slug, load);

onMounted(() => {
  load();
  window.addEventListener('scroll', onScroll, { passive: true });
});

onUnmounted(() => window.removeEventListener('scroll', onScroll));
</script>

<template>
  <div class="progress-bar" :style="{ width: `${progress}%` }"></div>

  <div class="page article-page">
    <div class="container narrow">
      <div v-if="loading" class="skeleton-wrap">
        <div class="skeleton" style="height: 16px; width: 120px"></div>
        <div class="skeleton" style="height: 38px; width: 80%; margin-top: 18px"></div>
        <div class="skeleton" style="height: 15px; width: 55%; margin-top: 14px"></div>
        <div class="skeleton" style="height: 260px; width: 100%; margin-top: 28px"></div>
      </div>

      <div v-else-if="errorMsg" class="empty">
        <div class="empty-icon">✦</div>
        <p>{{ errorMsg }}</p>
        <RouterLink to="/" class="btn btn-sm" style="margin-top: 14px">回到首页</RouterLink>
      </div>

      <article v-else-if="post" class="article fade-up">
        <RouterLink to="/" class="back-link">← 全部文章</RouterLink>

        <header class="article-head">
          <div class="meta">
            <span>{{ date }}</span>
            <span class="dot">·</span>
            <span>{{ post.readingMinutes }} 分钟阅读</span>
            <span class="dot">·</span>
            <span>{{ post.views }} 次浏览</span>
          </div>
          <h1 class="title">{{ post.title }}</h1>
          <p v-if="post.summary" class="subtitle">{{ post.summary }}</p>
          <div class="author-line">
            <div class="avatar">{{ (post.author || '博')[0] }}</div>
            <div>
              <div class="author-name">{{ post.author || '博主' }}</div>
              <div class="author-bio">{{ post.authorBio || '记录技术与生活' }}</div>
            </div>
          </div>
        </header>

        <figure v-if="post.cover" class="cover">
          <img :src="post.cover" :alt="post.title" />
        </figure>

        <MarkdownView :content="post.content_md" class="content" />

        <footer class="article-foot">
          <div v-if="post.tags.length" class="tags">
            <RouterLink
              v-for="t in post.tags"
              :key="t.id"
              :to="{ path: '/', query: { tag: t.slug } }"
              class="chip"
            >
              # {{ t.name }}
            </RouterLink>
          </div>

          <nav class="adjacent">
            <RouterLink v-if="post.prev" :to="`/post/${post.prev.slug}`" class="adj-item">
              <span class="adj-label">← 上一篇</span>
              <span class="adj-title">{{ post.prev.title }}</span>
            </RouterLink>
            <div v-else class="adj-item disabled">
              <span class="adj-label">← 上一篇</span>
              <span class="adj-title">已经是第一篇了</span>
            </div>

            <RouterLink v-if="post.next" :to="`/post/${post.next.slug}`" class="adj-item right">
              <span class="adj-label">下一篇 →</span>
              <span class="adj-title">{{ post.next.title }}</span>
            </RouterLink>
            <div v-else class="adj-item right disabled">
              <span class="adj-label">下一篇 →</span>
              <span class="adj-title">已经是最新一篇了</span>
            </div>
          </nav>
        </footer>

        <CommentSection :post-id="post.id" />
      </article>
    </div>
  </div>
</template>

<style scoped>
.progress-bar {
  position: fixed;
  top: 0;
  left: 0;
  height: 2px;
  background: linear-gradient(90deg, var(--accent), #6a9c88);
  z-index: 60;
  transition: width 0.1s linear;
}

.article-page {
  padding-top: 40px;
}

.narrow {
  max-width: 748px;
}

.skeleton-wrap {
  padding-top: 10px;
}

.back-link {
  display: inline-block;
  font-size: 13px;
  color: var(--muted-2);
  margin-bottom: 26px;
  transition: color 0.16s ease;
}

.back-link:hover {
  color: var(--accent);
}

.article-head {
  margin-bottom: 30px;
}

.meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12.8px;
  color: var(--muted-2);
  letter-spacing: 0.02em;
}

.dot {
  opacity: 0.5;
}

.title {
  margin: 12px 0 0;
  font-size: clamp(26px, 4vw, 38px);
  font-weight: 700;
  line-height: 1.32;
  letter-spacing: -0.03em;
  color: var(--ink);
}

.subtitle {
  margin: 14px 0 0;
  font-size: 16px;
  line-height: 1.7;
  color: var(--muted);
}

.author-line {
  display: flex;
  align-items: center;
  gap: 11px;
  margin-top: 26px;
  padding-top: 20px;
  border-top: 1px solid var(--line);
}

.avatar {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: var(--accent);
  color: #fff;
  display: grid;
  place-items: center;
  font-family: var(--font-serif);
  font-size: 16px;
}

.author-name {
  font-size: 13.8px;
  font-weight: 600;
}

.author-bio {
  font-size: 12.3px;
  color: var(--muted-2);
}

.cover {
  margin: 0 0 38px;
  border-radius: var(--radius);
  overflow: hidden;
  box-shadow: var(--shadow);
}

.cover img {
  width: 100%;
  max-height: 400px;
  object-fit: cover;
}

.content {
  margin-bottom: 46px;
}

.article-foot {
  padding-top: 8px;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 40px;
}

.adjacent {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  padding: 24px 0;
  border-top: 1px solid var(--line);
  border-bottom: 1px solid var(--line);
}

.adj-item {
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 4px 6px;
  border-radius: 8px;
  transition: background 0.16s ease;
}

.adj-item:hover {
  background: rgba(255, 255, 255, 0.8);
}

.adj-item.right {
  text-align: right;
}

.adj-label {
  font-size: 11.8px;
  color: var(--muted-2);
  letter-spacing: 0.04em;
}

.adj-title {
  font-size: 14px;
  font-weight: 550;
  line-height: 1.5;
  color: var(--ink-2);
}

.adj-item:not(.disabled):hover .adj-title {
  color: var(--accent);
}

.adj-item.disabled .adj-title {
  color: var(--muted-2);
  font-weight: 400;
}

@media (max-width: 640px) {
  .article-page {
    padding-top: 24px;
  }
  .adjacent {
    grid-template-columns: 1fr;
  }
  .adj-item.right {
    text-align: left;
  }
}
</style>
