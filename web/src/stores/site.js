import { defineStore } from 'pinia';
import { ref } from 'vue';
import { api } from '@/api';

export const useSiteStore = defineStore('site', () => {
  const author = ref({ nickname: '博主', avatar: null, bio: '' });
  const stats = ref({ postCount: 0, tagCount: 0, commentCount: 0, viewCount: 0 });
  const config = ref({});
  const loaded = ref(false);

  async function load(force = false) {
    if (loaded.value && !force) return;
    try {
      const data = await api.siteInfo();
      author.value = data.author;
      stats.value = data.stats;
      config.value = data.config || {};
      loaded.value = true;
    } catch (err) {
      console.warn('获取站点信息失败：', err.message);
    }
  }

  return { author, stats, config, loaded, load };
});
