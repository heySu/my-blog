<script setup>
import { ref, onMounted, computed } from 'vue';
import { api } from '@/api';

const props = defineProps({
  postId: { type: [Number, String], required: true }
});

const comments = ref([]);
const loading = ref(true);
const submitting = ref(false);
const replyTo = ref(null);
const errorMsg = ref('');
const successMsg = ref('');

const form = ref({ nickname: '', email: '', website: '', content: '' });

const totalCount = computed(() => {
  const count = list => list.reduce((sum, c) => sum + 1 + (c.children ? count(c.children) : 0), 0);
  return count(comments.value);
});

const replyTarget = computed(() => comments.value.find(c => c.id === replyTo.value) || null);

onMounted(() => {
  load();
  const saved = localStorage.getItem('commenter');
  if (saved) {
    try {
      const { nickname, email, website } = JSON.parse(saved);
      form.value = { ...form.value, nickname, email, website };
    } catch {
      /* ignore */
    }
  }
});

async function load() {
  loading.value = true;
  try {
    comments.value = await api.commentsOfPost(props.postId);
  } catch (err) {
    errorMsg.value = err.message;
  } finally {
    loading.value = false;
  }
}

function pickReply(id) {
  replyTo.value = replyTo.value === id ? null : id;
  if (replyTo.value) {
    document.getElementById('comment-form')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

function formatDate(raw) {
  if (!raw) return '';
  const d = new Date(String(raw).replace(' ', 'T'));
  if (Number.isNaN(d.getTime())) return String(raw).slice(0, 10);
  const diff = Date.now() - d.getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return '刚刚';
  if (min < 60) return `${min} 分钟前`;
  if (min < 60 * 24) return `${Math.floor(min / 60)} 小时前`;
  if (min < 60 * 24 * 30) return `${Math.floor(min / 1440)} 天前`;
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

async function submit() {
  errorMsg.value = '';
  successMsg.value = '';
  if (!form.value.nickname.trim()) {
    errorMsg.value = '请填写昵称';
    return;
  }
  if (!form.value.content.trim()) {
    errorMsg.value = '请填写评论内容';
    return;
  }

  submitting.value = true;
  try {
    await api.addComment(props.postId, {
      ...form.value,
      parentId: replyTo.value
    });
    localStorage.setItem(
      'commenter',
      JSON.stringify({ nickname: form.value.nickname, email: form.value.email, website: form.value.website })
    );
    form.value.content = '';
    replyTo.value = null;
    successMsg.value = '评论已发布，感谢你的留言 ✿';
    await load();
    setTimeout(() => (successMsg.value = ''), 4000);
  } catch (err) {
    errorMsg.value = err.message;
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <section class="comments">
    <div class="head">
      <h2 class="title">评论</h2>
      <span class="count">{{ totalCount }}</span>
    </div>

    <!-- 评论列表 -->
    <div v-if="loading" class="skeleton" style="height: 72px; margin-bottom: 12px"></div>

    <template v-else>
      <div v-if="!comments.length" class="empty-comments">
        还没有评论，来说点什么吧。
      </div>

      <ul v-else class="comment-list">
        <li v-for="c in comments" :key="c.id" class="comment">
          <div class="avatar">{{ c.nickname[0] }}</div>
          <div class="body">
            <div class="meta">
              <span class="name">{{ c.nickname }}</span>
              <span class="time">{{ formatDate(c.created_at) }}</span>
            </div>
            <p class="text">{{ c.content }}</p>
            <button class="reply-btn" @click="pickReply(c.id)">
              {{ replyTo === c.id ? '取消回复' : '回复' }}
            </button>

            <ul v-if="c.children?.length" class="children">
              <li v-for="child in c.children" :key="child.id" class="comment child">
                <div class="avatar small">{{ child.nickname[0] }}</div>
                <div class="body">
                  <div class="meta">
                    <span class="name">{{ child.nickname }}</span>
                    <span class="time">{{ formatDate(child.created_at) }}</span>
                  </div>
                  <p class="text">{{ child.content }}</p>
                </div>
              </li>
            </ul>
          </div>
        </li>
      </ul>
    </template>

    <!-- 发表评论 -->
    <form id="comment-form" class="form" @submit.prevent="submit">
      <div class="form-head">
        <h3>留下你的想法</h3>
        <span v-if="replyTarget" class="replying">
          回复 @{{ replyTarget.nickname }}
          <button type="button" @click="replyTo = null">×</button>
        </span>
      </div>

      <div class="form-grid">
        <div class="field">
          <label>昵称 *</label>
          <input v-model="form.nickname" class="input" maxlength="50" placeholder="怎么称呼你" />
        </div>
        <div class="field">
          <label>邮箱</label>
          <input v-model="form.email" class="input" type="email" placeholder="不会公开显示" />
        </div>
        <div class="field">
          <label>网站</label>
          <input v-model="form.website" class="input" placeholder="选填" />
        </div>
      </div>

      <div class="field">
        <label>内容 *</label>
        <textarea
          v-model="form.content"
          class="textarea"
          maxlength="1000"
          placeholder="友善的交流从一句你好开始…"
        ></textarea>
      </div>

      <div class="form-foot">
        <span class="hint">评论会立即展示，请保持友善。</span>
        <div class="row" style="gap: 10px">
          <span v-if="errorMsg" class="msg err">{{ errorMsg }}</span>
          <span v-if="successMsg" class="msg ok">{{ successMsg }}</span>
          <button class="btn btn-primary" type="submit" :disabled="submitting">
            {{ submitting ? '发布中…' : '发表评论' }}
          </button>
        </div>
      </div>
    </form>
  </section>
</template>

<style scoped>
.comments {
  margin-top: 64px;
  padding-top: 40px;
  border-top: 1px solid var(--line);
}

.head {
  display: flex;
  align-items: baseline;
  gap: 10px;
  margin-bottom: 26px;
}

.title {
  margin: 0;
  font-size: 20px;
  letter-spacing: -0.02em;
}

.count {
  font-size: 13px;
  color: var(--muted-2);
  background: var(--surface-2);
  padding: 1px 8px;
  border-radius: 20px;
}

.empty-comments {
  padding: 26px 0 34px;
  color: var(--muted-2);
  font-size: 14px;
}

.comment-list {
  list-style: none;
  margin: 0 0 40px;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 22px;
}

.comment {
  display: flex;
  gap: 13px;
}

.avatar {
  flex: 0 0 38px;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: linear-gradient(135deg, #e6efe9, #d6e5dc);
  color: var(--accent);
  display: grid;
  place-items: center;
  font-weight: 600;
  font-size: 15px;
  border: 1px solid var(--accent-line);
}

.avatar.small {
  flex-basis: 30px;
  width: 30px;
  height: 30px;
  font-size: 13px;
}

.body {
  flex: 1;
  min-width: 0;
}

.meta {
  display: flex;
  align-items: center;
  gap: 9px;
  margin-bottom: 5px;
}

.name {
  font-size: 14px;
  font-weight: 600;
  color: var(--ink);
}

.time {
  font-size: 12px;
  color: var(--muted-2);
}

.text {
  margin: 0;
  font-size: 14.3px;
  line-height: 1.75;
  color: var(--ink-2);
  white-space: pre-wrap;
  word-break: break-word;
}

.reply-btn {
  margin-top: 6px;
  border: 0;
  background: none;
  padding: 0;
  font-size: 12.5px;
  color: var(--muted-2);
  cursor: pointer;
}

.reply-btn:hover {
  color: var(--accent);
}

.children {
  list-style: none;
  margin: 16px 0 0;
  padding: 14px 0 0;
  border-top: 1px dashed var(--line);
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 15px;
  box-shadow: var(--shadow-sm);
}

.form-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.form-head h3 {
  margin: 0;
  font-size: 15.5px;
  letter-spacing: -0.01em;
}

.replying {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12.5px;
  color: var(--accent);
  background: var(--accent-soft);
  padding: 3px 6px 3px 10px;
  border-radius: 20px;
}

.replying button {
  border: 0;
  background: rgba(47, 93, 80, 0.12);
  width: 17px;
  height: 17px;
  border-radius: 50%;
  cursor: pointer;
  color: var(--accent);
  line-height: 1;
  font-size: 13px;
  display: grid;
  place-items: center;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 13px;
}

.form-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.msg {
  font-size: 12.8px;
}

.msg.err {
  color: var(--danger);
}

.msg.ok {
  color: var(--accent);
}

@media (max-width: 700px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
  .form {
    padding: 18px;
  }
}
</style>
