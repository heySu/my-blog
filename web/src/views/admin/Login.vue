<script setup>
import { ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const route = useRoute();
const auth = useAuthStore();

const form = ref({ username: 'admin', password: '' });
const loading = ref(false);
const errorMsg = ref('');

async function submit() {
  errorMsg.value = '';
  if (!form.value.username || !form.value.password) {
    errorMsg.value = '请输入用户名和密码';
    return;
  }
  loading.value = true;
  try {
    await auth.login(form.value);
    router.replace(route.query.redirect || '/admin');
  } catch (err) {
    errorMsg.value = err.message;
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="login-page">
    <div class="login-card">
      <RouterLink to="/" class="brand">
        <span class="mark">L</span>
      </RouterLink>

      <h1 class="title">登录后台</h1>
      <p class="sub">管理文章、评论与站点设置</p>

      <form class="form" @submit.prevent="submit">
        <div class="field">
          <label>用户名</label>
          <input v-model="form.username" class="input" autocomplete="username" placeholder="用户名" />
        </div>
        <div class="field">
          <label>密码</label>
          <input
            v-model="form.password"
            class="input"
            type="password"
            autocomplete="current-password"
            placeholder="密码"
          />
        </div>

        <p v-if="errorMsg" class="err">{{ errorMsg }}</p>

        <button class="btn btn-primary submit" type="submit" :disabled="loading">
          {{ loading ? '登录中…' : '登录' }}
        </button>
      </form>

      <p class="tip">默认账号 admin / admin123，登录后请及时修改密码。</p>
      <RouterLink to="/" class="back">← 返回博客</RouterLink>
    </div>

    <div class="bg-deco"></div>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 24px;
  background:
    radial-gradient(1000px 600px at 15% 0%, #eef4f1 0%, transparent 55%),
    radial-gradient(900px 500px at 100% 100%, #f6f0e6 0%, transparent 50%),
    var(--bg);
  position: relative;
  overflow: hidden;
}

.login-card {
  position: relative;
  width: 100%;
  max-width: 400px;
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(12px);
  border: 1px solid var(--line);
  border-radius: 18px;
  padding: 38px 34px 30px;
  box-shadow: var(--shadow-lg);
  animation: fadeUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) both;
}

.brand {
  display: block;
  width: 44px;
  height: 44px;
  margin-bottom: 22px;
}

.mark {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: var(--accent);
  color: #fff;
  display: grid;
  place-items: center;
  font-family: var(--font-serif);
  font-size: 22px;
  box-shadow: 0 8px 20px -8px rgba(47, 93, 80, 0.8);
}

.title {
  margin: 0;
  font-size: 24px;
  letter-spacing: -0.025em;
}

.sub {
  margin: 8px 0 26px;
  font-size: 13.5px;
  color: var(--muted);
}

.form {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.submit {
  height: 44px;
  margin-top: 6px;
  width: 100%;
}

.err {
  margin: 0;
  font-size: 12.8px;
  color: var(--danger);
  background: #fdf1f0;
  padding: 8px 11px;
  border-radius: 8px;
}

.tip {
  margin: 22px 0 0;
  font-size: 11.8px;
  color: var(--muted-2);
  text-align: center;
  line-height: 1.7;
}

.back {
  display: block;
  margin-top: 14px;
  text-align: center;
  font-size: 12.5px;
  color: var(--muted-2);
}

.back:hover {
  color: var(--accent);
}
</style>
