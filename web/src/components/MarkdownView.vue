<script setup>
import { computed } from 'vue';
import MarkdownIt from 'markdown-it';
import hljs from 'highlight.js/lib/common';

const props = defineProps({
  content: { type: String, default: '' }
});

const md = new MarkdownIt({
  html: true,
  linkify: true,
  breaks: false,
  highlight(str, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return `<pre class="hljs"><code>${hljs.highlight(str, { language: lang, ignoreIllegals: true }).value}</code></pre>`;
      } catch {
        /* ignore */
      }
    }
    return `<pre class="hljs"><code>${md.utils.escapeHtml(str)}</code></pre>`;
  }
});

// 外链新窗口打开
const defaultLinkOpen =
  md.renderer.rules.link_open ||
  ((tokens, idx, options, _env, self) => self.renderToken(tokens, idx, options));

md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
  const href = tokens[idx].attrGet('href') || '';
  if (/^https?:\/\//.test(href)) {
    tokens[idx].attrSet('target', '_blank');
    tokens[idx].attrSet('rel', 'noopener noreferrer');
  }
  return defaultLinkOpen(tokens, idx, options, env, self);
};

// 图片：懒加载 + 保留 alt / title
md.renderer.rules.image = (tokens, idx, options, env, self) => {
  const token = tokens[idx];
  const src = token.attrGet('src') || '';
  const title = token.attrGet('title');
  const alt = self.renderInlineAsText(token.children || [], options, env);
  const esc = md.utils.escapeHtml;
  return `<img src="${esc(src)}" alt="${esc(alt)}"${title ? ` title="${esc(title)}"` : ''} loading="lazy">`;
};

const html = computed(() => md.render(props.content || ''));
</script>

<template>
  <div class="prose" v-html="html"></div>
</template>
