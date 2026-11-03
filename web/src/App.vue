<script setup>
import { computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import AppHeader from '@/components/AppHeader.vue';
import AppFooter from '@/components/AppFooter.vue';
import { useSiteStore } from '@/stores/site';

const route = useRoute();
const site = useSiteStore();
const bare = computed(() => Boolean(route.meta.bare));

onMounted(() => site.load());
</script>

<template>
  <AppHeader v-if="!bare" />
  <main :class="bare ? '' : 'app-main'">
    <RouterView v-slot="{ Component }">
      <Transition name="page" mode="out-in">
        <component :is="Component" />
      </Transition>
    </RouterView>
  </main>
  <AppFooter v-if="!bare" />
</template>

<style>
.app-main {
  min-height: calc(100vh - var(--header-h));
}

.page-enter-active,
.page-leave-active {
  transition: opacity 0.22s ease, transform 0.22s ease;
}

.page-enter-from {
  opacity: 0;
  transform: translateY(6px);
}

.page-leave-to {
  opacity: 0;
}
</style>
