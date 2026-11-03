<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { api } from '@/api';
import MarkdownView from '@/components/MarkdownView.vue';

const route = useRoute();
const router = useRouter();

const isEdit = computed(() => Boolean(route.params.id));
const loading = ref(false);
const saving = ref(false);
const errorMsg = ref('');
const okMsg = ref('');
const previewMode = ref(false);

const form = ref({
  title: '',
  slug: '',
  summary: '',
  cover: '',
  contentMd: '',
  status: 'draft',
  isTop: false,
  tags: []
});

const allTags = ref([]);
const tagInput = ref('');

const charCount = computed(() => form.value.contentMd.replace(/\s/g, '').length);
const readMinutes = computed(() => Math.max(1, Math.round(charCount.value / 400)));

async function loadTags() {
  try {
    allTags.value = await api.tags();
  } catch {
    /* ignore */
  }
}

async function loadPost() {
  if (!isEdit.value) return;
  loading.value = true;
  try {
    const p = await api.post(String(route.params.id));
    form.value = {
      title: p.title,
      slug: p.slug,
      summary: p.summary || '',
      cover: p.cover || '',
      contentMd: p.content_md,
      status: p.status,
      isTop: Boolean(p.is_top),
      tags: p.tags.map(t => t.name)
    };
  } catch (err) {
    errorMsg.value = err.message;
  } finally {
    loading.value = false;
  }
}

function toggleTag(name) {
  const i = form.value.tags.indexOf(name);
  if (i >= 0) form.value.tags.splice(i, 1);
  else form.value.tags.push(name);
}

function addTag() {
  const name = tagInput.value.trim();
  if (!name) return;
  if (!form.value.tags.includes(name)) form.value.tags.push(name);
  tagInput.value = '';
}

async function save(status) {
  errorMsg.value = '';
  okMsg.value = '';

  if (!form.value.title.trim()) {
    errorMsg.value = '标题不能为空';
    return;
  }
  if (!form.value.contentMd.trim()) {
    errorMsg.value = '正文不能为空';
    return;
  }

  saving.value = true;
  const payload = {
    ...form.value,
    status: status || form.value.status,
    isTop: form.value.isTop ? 1 : 0
  };

  try {
    if (isEdit.value) {
      await api.updatePost(route.params.id, payload);
      okMsg.value = '已保存';
    } else {
      const res = await api.createPost(payload);
      okMsg.value = '创建成功';
      router.replace(`/admin/posts/${res.id}/edit`);
    }
    form.value.status = payload.status;
    setTimeout(() => (okMsg.value = ''), 2500);
  } catch (err) {
    errorMsg.value = err.message;
  } finally {
    saving.value = false;
  }
}

function onKeydown(e) {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
    e.preventDefault();
    save();
  }
}

onMounted(() => {
  loadTags();
  loadPost();
  window.addEventListener('keydown', onKeydown);
});

onUnmounted(() => window.removeEventListener('keydown', onKeydown));

watch(() => form.value.status, () => (okMsg.value = ''));
</script>

<template>
  <div class="editor">
    <div v-if="loading" class="skeleton" style="height: 400px"></div>

    <template v-else>
      <div class="editor-grid">
        <div class="left">
          <input
            v-model="form.title"
            class="title-input"
            placeholder="文章标题…"
            maxlength="150"
          />

          <div class="meta-row">
            <div class="field inline">
              <label>Slug</label>
              <input v-model="form.slug" class="input mono" placeholder="留空自动生成" />
            </div>
            <div class="field inline">
              <label>封面图 URL</label>
              <input v-model="form.cover" class="input" placeholder="https://…" />
            </div>
          </div>

          <div class="field">
            <label>摘要</label>
            <textarea
              v-model="form.summary"
              class="textarea"
              rows="2"
              maxlength="300"
              placeholder="留空将从正文自动提取"
            ></textarea>
          </div>

          <div class="field">
            <div class="label-row">
              <label>正文（Markdown）</label>
              <div class="editor-tools">
                <button class="tool-btn" :class="{ on: !previewMode }" @click="previewMode = false">编辑</button>
                <button class="tool-btn" :class="{ on: previewMode }" @click="previewMode = true">预览</button>
              </div>
            </div>

            <textarea
              v-if="!previewMode"
              v-model="form.contentMd"
              class="textarea content-input"
              placeholder="# 从这里开始写…&#10;&#10;支持 Markdown 语法，Ctrl + S 快速保存"
            ></textarea>
            <div v-else class="preview-box">
              <MarkdownView v-if="form.contentMd" :content="form.contentMd" />
              <p v-else class="muted small">还没有内容可以预览</p>
            </div>
          </div>
        </div>

        <aside class="right">
          <div class="side-card">
            <h3 class="side-title">发布</h3>
            <div class="status-row">
              <span class="badge" :class="form.status === 'published' ? 'badge-published' : 'badge-draft'">
                {{ form.status === 'published' ? '已发布' : '草稿' }}
              </span>
              <label class="switch">
                <input v-model="form.isTop" type="checkbox" />
                <span>置顶</span>
              </label>
            </div>

            <div class="btn-col">
              <button class="btn btn-primary" :disabled="saving" @click="save('published')">
                {{ saving ? '保存中…' : form.status === 'published' ? '更新并发布' : '发布文章' }}
              </button>
              <button class="btn" :disabled="saving" @click="save('draft')">存为草稿</button>
            </div>

            <p v-if="errorMsg" class="msg err">{{ errorMsg }}</p>
            <p v-if="okMsg" class="msg ok">{{ okMsg }}</p>

            <div class="stat-line">
              <span>{{ charCount }} 字</span>
              <span>约 {{ readMinutes }} 分钟</span>
            </div>
          </div>

          <div class="side-card">
            <h3 class="side-title">标签</h3>
            <div class="tag-pick">
              <button
                v-for="t in allTags"
                :key="t.id"
                class="chip"
                :class="{ 'is-active': form.tags.includes(t.name) }"
                @click="toggleTag(t.name)"
              >
                {{ t.name }}
              </button>
            </div>
            <div class="tag-add">
              <input
                v-model="tagInput"
                class="input"
                placeholder="新标签，回车添加"
                @keyup.enter="addTag"
              />
            </div>
            <p v-if="form.tags.length" class="selected">
              已选：{{ form.tags.join('、') }}
            </p>
          </div>

          <div class="side-card tips">
            <h3 class="side-title">小提示</h3>
            <ul>
              <li>Ctrl / ⌘ + S 快速保存</li>
              <li>封面留空则显示纯文字卡片</li>
              <li>草稿不会出现在前台列表</li>
            </ul>
          </div>
        </aside>
      </div>
    </template>
  </div>
</template>

<style scoped>
.editor-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 274px;
  gap: 22px;
  align-items: start;
}

.left {
  background: #fff;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.title-input {
  width: 100%;
  border: 0;
  border-bottom: 1px solid var(--line);
  padding: 2px 0 14px;
  font-size: 24px;
  font-weight: 650;
  letter-spacing: -0.025em;
  outline: none;
  background: transparent;
}

.title-input::placeholder {
  color: var(--muted-2);
  font-weight: 500;
}

.title-input:focus {
  border-bottom-color: var(--accent);
}

.meta-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.field.inline label {
  font-size: 12.5px;
}

.mono {
  font-family: var(--font-mono);
  font-size: 13px;
}

.label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.editor-tools {
  display: flex;
  gap: 2px;
  background: var(--surface-2);
  padding: 2px;
  border-radius: 7px;
}

.tool-btn {
  border: 0;
  background: transparent;
  padding: 4px 11px;
  border-radius: 5px;
  font-size: 12.2px;
  color: var(--muted);
  cursor: pointer;
}

.tool-btn.on {
  background: #fff;
  color: var(--ink);
  font-weight: 600;
  box-shadow: var(--shadow-sm);
}

.content-input {
  min-height: 460px;
  font-family: var(--font-mono);
  font-size: 13.6px;
  line-height: 1.85;
  padding: 16px;
  background: #fcfbf9;
}

.preview-box {
  min-height: 460px;
  padding: 22px;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  background: #fff;
  overflow-y: auto;
  max-height: 720px;
}

.right {
  display: flex;
  flex-direction: column;
  gap: 14px;
  position: sticky;
  top: 86px;
}

.side-card {
  background: #fff;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  padding: 16px;
}

.side-title {
  margin: 0 0 12px;
  font-size: 12px;
  font-weight: 650;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--muted-2);
}

.status-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}

.switch {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12.5px;
  color: var(--muted);
  cursor: pointer;
}

.switch input {
  accent-color: var(--accent);
  width: 14px;
  height: 14px;
}

.btn-col {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.btn-col .btn {
  width: 100%;
}

.msg {
  margin: 10px 0 0;
  font-size: 12.5px;
  text-align: center;
}

.msg.err {
  color: var(--danger);
}

.msg.ok {
  color: var(--accent);
}

.stat-line {
  display: flex;
  justify-content: space-between;
  margin-top: 12px;
  padding-top: 11px;
  border-top: 1px solid var(--line);
  font-size: 11.8px;
  color: var(--muted-2);
}

.tag-pick {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tag-add {
  margin-top: 10px;
}

.tag-add .input {
  height: 34px;
  padding: 0 10px;
  font-size: 12.8px;
}

.selected {
  margin: 10px 0 0;
  font-size: 11.8px;
  color: var(--muted-2);
  line-height: 1.6;
}

.tips ul {
  margin: 0;
  padding-left: 16px;
  font-size: 12.2px;
  color: var(--muted);
  line-height: 1.9;
}

.tips li::marker {
  color: var(--accent-line);
}

@media (max-width: 1100px) {
  .editor-grid {
    grid-template-columns: 1fr;
  }
  .right {
    position: static;
  }
}

@media (max-width: 640px) {
  .left {
    padding: 16px;
  }
  .meta-row {
    grid-template-columns: 1fr;
  }
  .title-input {
    font-size: 20px;
  }
}
</style>
