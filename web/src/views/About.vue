<script setup>
import { ref, onMounted, computed } from 'vue';
import { api } from '@/api';
import { useSiteStore } from '@/stores/site';
import MarkdownView from '@/components/MarkdownView.vue';

const site = useSiteStore();
const about = ref('');
const loading = ref(true);

const nickname = computed(() => site.author.nickname || '博主');

onMounted(async () => {
  await site.load();
  try {
    const info = await api.siteInfo();
    about.value = info.config.about_md || '';
  } catch {
    about.value = '';
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="page">
    <div class="container narrow">
      <header class="head">
        <div class="avatar">{{ nickname[0] }}</div>
        <div>
          <p class="eyebrow">ABOUT</p>
          <h1 class="title">关于我</h1>
        </div>
      </header>

      <div class="stats">
        <div class="stat">
          <b>{{ site.stats.postCount }}</b>
          <span>篇文章</span>
        </div>
        <div class="stat">
          <b>{{ site.stats.commentCount }}</b>
          <span>条评论</span>
        </div>
        <div class="stat">
          <b>{{ site.stats.viewCount }}</b>
          <span>次阅读</span>
        </div>
        <div class="stat">
          <b>{{ site.stats.tagCount }}</b>
          <span>个标签</span>
        </div>
      </div>

      <div v-if="loading" class="skeleton" style="height: 240px"></div>
      <MarkdownView v-else-if="about" :content="about" class="body" />
      <div v-else class="empty">这里还没有内容，去后台「设置」里写点自我介绍吧。</div>
    </div>
  </div>
</template>

<style scoped>
.narrow {
  max-width: 760px;
}

.head {
  display: flex;
  align-items: center;
  gap: 18px;
  padding: 20px 0 34px;
}

.avatar {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: var(--accent);
  color: #fff;
  display: grid;
  place-items: center;
  font-family: var(--font-serif);
  font-size: 26px;
  box-shadow: 0 8px 22px -10px rgba(47, 93, 80, 0.8);
}

.eyebrow {
  margin: 0 0 4px;
  font-size: 11.5px;
  letter-spacing: 0.22em;
  color: var(--muted-2);
  font-weight: 600;
}

.title {
  margin: 0;
  font-size: clamp(26px, 3.6vw, 34px);
  letter-spacing: -0.03em;
}

.stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1px;
  background: var(--line);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  overflow: hidden;
  margin-bottom: 40px;
}

.stat {
  background: var(--surface);
  padding: 18px 12px;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.stat b {
  font-size: 20px;
  font-weight: 650;
  letter-spacing: -0.02em;
  font-variant-numeric: tabular-nums;
}

.stat span {
  font-size: 12px;
  color: var(--muted-2);
}

@media (max-width: 600px) {
  .stats {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
