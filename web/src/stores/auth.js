import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { api } from '@/api';

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('blog_token') || '');
  const user = ref(JSON.parse(localStorage.getItem('blog_user') || 'null'));

  const isLoggedIn = computed(() => Boolean(token.value));

  async function login(payload) {
    const data = await api.login(payload);
    token.value = data.token;
    user.value = data.user;
    localStorage.setItem('blog_token', data.token);
    localStorage.setItem('blog_user', JSON.stringify(data.user));
    return data;
  }

  function logout() {
    token.value = '';
    user.value = null;
    localStorage.removeItem('blog_token');
    localStorage.removeItem('blog_user');
  }

  async function fetchMe() {
    try {
      user.value = await api.me();
      localStorage.setItem('blog_user', JSON.stringify(user.value));
    } catch {
      logout();
    }
  }

  return { token, user, isLoggedIn, login, logout, fetchMe };
});
