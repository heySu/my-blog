<template>
  <div class="page notfound">
    <div class="container">
      <p class="code">404</p>
      <h1 class="title">这一页走丢了</h1>
      <p class="desc">你要找的文章可能被移动、删除，或者从来没存在过。</p>
      <div class="actions">
        <RouterLink to="/" class="btn btn-primary">回到首页</RouterLink>
        <RouterLink to="/archive" class="btn">浏览归档</RouterLink>
      </div>
    </div>
  </div>
</template>

<style scoped>
.notfound {
  display: grid;
  place-items: center;
  text-align: center;
  padding: 110px 0;
}

.code {
  margin: 0;
  font-family: var(--font-serif);
  font-size: 96px;
  line-height: 1;
  color: var(--accent-line);
  letter-spacing: -0.04em;
}

.title {
  margin: 14px 0 0;
  font-size: 26px;
  letter-spacing: -0.02em;
}

.desc {
  margin: 12px 0 28px;
  color: var(--muted);
  font-size: 14.5px;
}

.actions {
  display: flex;
  gap: 10px;
  justify-content: center;
  flex-wrap: wrap;
}
</style>
