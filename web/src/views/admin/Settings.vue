<script setup>
import { ref, onMounted } from 'vue';
import { api } from '@/api';
import { useSiteStore } from '@/stores/site';

const site = useSiteStore();

const config = ref({ site_title: '', site_subtitle: '', icp: '', about_md: '' });
const loading = ref(true);
const saving = ref(false);
const okMsg = ref('');
const errorMsg = ref('');

const pwd = ref({ oldPassword: '', newPassword: '', confirm: '' });
const pwdSaving = ref(false);
const pwdMsg = ref('');
const pwdErr = ref('');

async function load() {
  try {
    const info = await api.siteInfo();
    config.value = {
      site_title: info.config.site_title || '',
      site_subtitle: info.config.site_subtitle || '',
      icp: info.config.icp || '',
      about_md: info.config.about_md || ''
    };
  } catch (err) {
    errorMsg.value = err.message;
  } finally {
    loading.value = false;
  }
}

async function save() {
  errorMsg.value = '';
  okMsg.value = '';
  saving.value = true;
  try {
    await api.updateConfig(config.value);
    okMsg.value = '设置已保存';
    await site.load(true);
    setTimeout(() => (okMsg.value = ''), 2500);
  } catch (err) {
    errorMsg.value = err.message;
  } finally {
    saving.value = false;
  }
}

async function changePassword() {
  pwdMsg.value = '';
  pwdErr.value = '';
  if (!pwd.value.oldPassword || !pwd.value.newPassword) {
    pwdErr.value = '请填写完整';
    return;
  }
  if (pwd.value.newPassword.length < 6) {
    pwdErr.value = '新密码至少 6 位';
    return;
  }
  if (pwd.value.newPassword !== pwd.value.confirm) {
    pwdErr.value = '两次输入的新密码不一致';
    return;
  }
  pwdSaving.value = true;
  try {
    await api.changePassword({
      oldPassword: pwd.value.oldPassword,
      newPassword: pwd.value.newPassword
    });
    pwdMsg.value = '密码已修改';
    pwd.value = { oldPassword: '', newPassword: '', confirm: '' };
  } catch (err) {
    pwdErr.value = err.message;
  } finally {
    pwdSaving.value = false;
  }
}

onMounted(load);
</script>

<template>
  <div class="settings">
    <div v-if="loading" class="skeleton" style="height: 300px"></div>

    <template v-else>
      <section class="panel">
        <header class="panel-head">
          <h2>站点信息</h2>
          <p>这些内容会显示在前台头部、首页与关于页。</p>
        </header>

        <div class="panel-body">
          <div class="grid-2">
            <div class="field">
              <label>站点标题</label>
              <input v-model="config.site_title" class="input" maxlength="60" />
            </div>
            <div class="field">
              <label>副标题</label>
              <input v-model="config.site_subtitle" class="input" maxlength="80" />
            </div>
          </div>

          <div class="field">
            <label>关于页内容（Markdown）</label>
            <textarea v-model="config.about_md" class="textarea" rows="10"></textarea>
            <span class="hint">支持 Markdown 与 HTML 标签，用于「关于」页面。</span>
          </div>

          <div class="field">
            <label>备案号</label>
            <input v-model="config.icp" class="input" placeholder="留空则不显示" />
          </div>

          <div class="actions">
            <button class="btn btn-primary" :disabled="saving" @click="save">
              {{ saving ? '保存中…' : '保存设置' }}
            </button>
            <span v-if="okMsg" class="msg ok">{{ okMsg }}</span>
            <span v-if="errorMsg" class="msg err">{{ errorMsg }}</span>
          </div>
        </div>
      </section>

      <section class="panel">
        <header class="panel-head">
          <h2>修改密码</h2>
          <p>默认密码为 admin123，建议立即修改。</p>
        </header>

        <div class="panel-body">
          <div class="grid-3">
            <div class="field">
              <label>原密码</label>
              <input v-model="pwd.oldPassword" class="input" type="password" autocomplete="current-password" />
            </div>
            <div class="field">
              <label>新密码</label>
              <input v-model="pwd.newPassword" class="input" type="password" autocomplete="new-password" />
            </div>
            <div class="field">
              <label>确认新密码</label>
              <input v-model="pwd.confirm" class="input" type="password" autocomplete="new-password" />
            </div>
          </div>

          <div class="actions">
            <button class="btn" :disabled="pwdSaving" @click="changePassword">
              {{ pwdSaving ? '提交中…' : '更新密码' }}
            </button>
            <span v-if="pwdMsg" class="msg ok">{{ pwdMsg }}</span>
            <span v-if="pwdErr" class="msg err">{{ pwdErr }}</span>
          </div>
        </div>
      </section>
    </template>
  </div>
</template>

<style scoped>
.settings {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 820px;
}

.panel {
  background: #fff;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  overflow: hidden;
}

.panel-head {
  padding: 16px 20px;
  border-bottom: 1px solid var(--line);
  background: #fcfbf9;
}

.panel-head h2 {
  margin: 0;
  font-size: 15px;
  font-weight: 650;
  letter-spacing: -0.01em;
}

.panel-head p {
  margin: 4px 0 0;
  font-size: 12.5px;
  color: var(--muted-2);
}

.panel-body {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.grid-3 {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
}

.actions {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-top: 4px;
}

.msg {
  font-size: 12.5px;
}

.msg.ok {
  color: var(--accent);
}

.msg.err {
  color: var(--danger);
}

@media (max-width: 780px) {
  .grid-2,
  .grid-3 {
    grid-template-columns: 1fr;
  }
}
</style>
