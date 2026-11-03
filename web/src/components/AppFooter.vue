<script setup>
import { computed } from 'vue';
import { useSiteStore } from '@/stores/site';

const site = useSiteStore();
const year = new Date().getFullYear();
const title = computed(() => site.config.site_title || `${site.author.nickname}的博客`);
</script>

<template>
  <footer class="footer">
    <div class="container footer-inner">
      <div class="footer-left">
        <div class="footer-title">{{ title }}</div>
        <p class="footer-sub">{{ site.config.site_subtitle || '写代码，也写生活' }}</p>
      </div>

      <div class="footer-meta">
        <span>© {{ year }} {{ site.author.nickname }}</span>
        <span class="dot">·</span>
        <span>构建于 Vue3 + Node + MySQL</span>
        <template v-if="site.config.icp">
          <span class="dot">·</span>
          <a href="https://beian.miit.gov.cn" target="_blank" rel="noopener">{{ site.config.icp }}</a>
        </template>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.footer {
  border-top: 1px solid var(--line);
  background: linear-gradient(180deg, transparent, rgba(244, 242, 237, 0.55));
  padding: 34px 0;
}

.footer-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  flex-wrap: wrap;
}

.footer-title {
  font-weight: 600;
  font-size: 14.5px;
  letter-spacing: -0.01em;
}

.footer-sub {
  margin: 3px 0 0;
  font-size: 13px;
  color: var(--muted-2);
}

.footer-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12.8px;
  color: var(--muted-2);
}

.footer-meta a:hover {
  color: var(--accent);
}

.dot {
  opacity: 0.6;
}
</style>
