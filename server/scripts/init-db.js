/**
 * 一键初始化数据库：建库 → 建表 → 写入演示数据
 * 用法：npm run init:db
 */
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_NAME = process.env.DB_NAME || 'my_blog';

const conn = await mysql.createConnection({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  multipleStatements: true,
  charset: 'utf8mb4'
});

try {
  console.log('→ 创建数据库', DB_NAME);
  await conn.query(
    `CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci`
  );
  await conn.query(`USE \`${DB_NAME}\``);

  console.log('→ 建表');
  const schema = await fs.readFile(path.resolve(__dirname, '../sql/schema.sql'), 'utf8');
  await conn.query(schema);

  /* ---------------- 演示数据 ---------------- */
  const [[{ c: userCount }]] = await conn.query('SELECT COUNT(*) AS c FROM users');
  if (userCount > 0) {
    console.log('→ 已存在数据，跳过演示数据写入');
  } else {
    console.log('→ 写入演示数据');

    const hash = await bcrypt.hash('admin123', 10);
    const [u] = await conn.query(
      'INSERT INTO users (username, password_hash, nickname, bio) VALUES (?, ?, ?, ?)',
      ['admin', hash, '林小岸', '前端工程师 / 独立开发者，喜欢把想法做成能跑起来的东西。']
    );
    const authorId = u.insertId;

    const tagRows = [
      ['Vue', 'vue'],
      ['Node.js', 'nodejs'],
      ['MySQL', 'mysql'],
      ['前端工程化', 'frontend'],
      ['随笔', 'essay']
    ];
    const tagIds = {};
    for (const [name, slug] of tagRows) {
      const [r] = await conn.query('INSERT INTO tags (name, slug) VALUES (?, ?)', [name, slug]);
      tagIds[name] = r.insertId;
    }

    const posts = [
      {
        title: '用 Vue3 + Node + MySQL 从零搭一个个人博客',
        slug: 'build-blog-with-vue3-node-mysql',
        summary: '从数据库表结构到接口设计，再到前端页面，完整记录这套博客系统的搭建思路与踩坑。',
        cover: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=1200&q=80',
        tags: ['Vue', 'Node.js', 'MySQL', '前端工程化'],
        isTop: 1,
        days: 0,
        content: `## 为什么要自己写一个博客

市面上的博客模板很多，但真正自己从数据库设计到接口、页面完整走一遍，收获完全不一样。这套系统只有三个部分：

- **前端**：Vue3 + Vite + Vue Router + Pinia，负责所有页面渲染
- **后端**：Node + Express，提供 RESTful 接口
- **数据库**：MySQL，存文章、标签、评论

## 数据库设计

核心只有四张表：

\`\`\`sql
users      -- 博主账号
posts      -- 文章（含草稿 / 已发布状态）
tags       -- 标签
post_tags  -- 文章与标签的多对多关联
comments   -- 评论（支持楼中楼回复）
\`\`\`

文章正文存的是 **Markdown 原文**，渲染放在前端做。这样做的好处是：以后想换渲染器、想加目录、想支持公式，都不用动数据库。

## 接口约定

所有接口统一返回这个结构，前端拦截器一次处理就够：

\`\`\`json
{ "code": 0, "message": "ok", "data": {} }
\`\`\`

\`code === 0\` 表示成功，非 0 表示业务失败，HTTP 状态码同时保持语义（401、404、500）。

## 一个容易踩的坑

MySQL 的 \`LIMIT ? OFFSET ?\` 在预处理语句里传字符串会直接报错。最稳的做法是先把参数 \`parseInt\` 再拼进 SQL：

\`\`\`js
const size = Math.min(50, parseInt(req.query.size, 10) || 6);
const sql = \`... LIMIT \${size} OFFSET \${(page - 1) * size}\`;
\`\`\`

因为已经不是用户原始输入，注入风险也就不存在了。

> 先跑通，再优化。能上线的最小版本，永远比精雕细琢的草稿有价值。`
      },
      {
        title: 'Vue3 组合式 API 的五个实战心得',
        slug: 'vue3-composition-api-tips',
        summary: 'ref 还是 reactive？watch 怎么写才不踩坑？记录半年 Vue3 项目里最常用的几个模式。',
        cover: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=1200&q=80',
        tags: ['Vue', '前端工程化'],
        days: 3,
        content: `## 1. ref 优先，reactive 谨慎

基本类型只能用 \`ref\`，对象虽然两个都行，但 \`reactive\` 解构后会丢响应式：

\`\`\`js
const state = reactive({ count: 0 })
const { count } = state      // ❌ 失去响应式
const count = ref(0)         // ✅ 到处都能用
\`\`\`

团队统一用 \`ref\`，心智负担最小。

## 2. 组合式函数是最好的复用方式

把「分页列表」这种逻辑抽出来，页面只关心渲染：

\`\`\`js
export function usePagination(fetcher, size = 10) {
  const list = ref([])
  const page = ref(1)
  const total = ref(0)

  async function load() {
    const res = await fetcher({ page: page.value, size })
    list.value = res.list
    total.value = res.total
  }

  watch(page, load, { immediate: true })
  return { list, page, total, load }
}
\`\`\`

## 3. watch 的 immediate 与 deep

- 需要首次执行 → \`immediate: true\`
- 监听对象内部变化 → \`deep: true\`（有性能代价，能不用就不用）
- 只在某些字段变化时触发 → 用 getter 返回具体值

## 4. 别忘了清理副作用

定时器、事件监听、WebSocket，在 \`onUnmounted\` 里一定要清掉，否则路由切换会越积越多。

## 5. 模板里少写逻辑

复杂判断抽成 \`computed\`，模板只负责展示。半年后再看自己的代码，会感谢当时的自己。`
      },
      {
        title: 'Node 服务从本地跑起来到稳定运行',
        slug: 'node-service-in-production',
        summary: '连接池、错误处理、日志、进程守护——一个能长期跑着的 Node 服务需要哪些东西。',
        cover: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1200&q=80',
        tags: ['Node.js', '前端工程化'],
        days: 8,
        content: `## 连接池是第一步

每次请求新建数据库连接，几十个并发就打满了。\`mysql2\` 的 \`createPool\` 直接解决：

\`\`\`js
const pool = mysql.createPool({
  host: '127.0.0.1',
  connectionLimit: 10,
  waitForConnections: true
})
\`\`\`

## 统一错误处理

不要在每个路由里写 \`try/catch\` 然后手动 \`res.status(500)\`，包一层：

\`\`\`js
const asyncHandler = fn => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next)
\`\`\`

再挂一个全局错误中间件，日志和响应格式就统一了。

## 配置不要写死

端口、数据库密码、JWT 密钥全放 \`.env\`，代码里只读 \`process.env\`。换环境的时候只改一个文件。

## 健康检查接口

\`GET /api/health\` 顺手查一次数据库版本。上线后第一件事就是访问它——比猜哪里出错快得多。`
      },
      {
        title: '写博客这件事，我坚持了三年的理由',
        slug: 'why-i-keep-writing',
        summary: '不是为了流量，也不是为了简历。就是把想不明白的事，写明白。',
        cover: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=1200&q=80',
        tags: ['随笔'],
        days: 15,
        content: `刚开始写博客，是想证明自己会点什么。

后来发现，真正被帮到的人是我自己。

## 写作是最诚实的检验

一个概念，你以为懂了；试着用三百字讲清楚，就会发现中间断了三处。

那些断掉的地方，才是真正要补的。

## 慢一点也没关系

三年下来一百多篇，平均一周不到一篇。有几个月一篇都没有，也有过连续日更。

重要的不是频率，是**没有彻底停下来**。

## 关于流量

有过一篇文章突然被很多人看到，也有过写完只有自己读。

前者带来短暂的兴奋，后者带来持续的能力。

值不值得，其实早就清楚了。`
      },
      {
        title: 'CSS 布局：那些年我绕过的弯路',
        slug: 'css-layout-lessons',
        summary: 'Flex 与 Grid 的取舍、居中写法、响应式断点，一份可以直接抄的布局笔记。',
        cover: 'https://images.unsplash.com/photo-1507721999472-8ed4421c4af2?w=1200&q=80',
        tags: ['前端工程化'],
        days: 22,
        content: `## 居中：三种场景三种写法

\`\`\`css
/* 单行文字 */
.center { text-align: center; line-height: 100px; }

/* 块级元素水平居中 */
.mx-auto { margin-inline: auto; width: fit-content; }

/* 任意内容居中 */
.flex-center { display: flex; align-items: center; justify-content: center; }
\`\`\`

## Flex 还是 Grid

- 一维排列（一行或一列的按钮、导航、卡片列表）→ **Flex**
- 二维网格（整页布局、卡片矩阵）→ **Grid**

混着用并不丢人，反而是最省事的做法。

## 断点别抄别人

\`768 / 1024 / 1280\` 只是常见值。真正的断点应该由**内容开始变丑的那一刻**决定。

把浏览器窗口慢慢缩小，哪个宽度排版崩了，那里就是断点。

## 最后

\`gap\` 已经全面可用了，别再写 \`margin-right: 12px; &:last-child { margin-right: 0 }\` 这种补丁。`
      },
      {
        title: '（草稿）2026 年我的技术学习清单',
        slug: 'draft-learning-plan-2026',
        summary: '还在整理中的学习方向，暂不发布。',
        tags: ['随笔'],
        status: 'draft',
        days: 1,
        content: `## 待整理

- 数据库索引优化
- 前端性能监控
- 一些 Rust 的入门内容

这篇还没写完，先留个草稿。`
      }
    ];

    for (const p of posts) {
      const d = new Date(Date.now() - p.days * 86400000);
      const status = p.status || 'published';
      const [r] = await conn.query(
        `INSERT INTO posts (title, slug, summary, content_md, cover, status, is_top, views, author_id, published_at, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          p.title, p.slug, p.summary, p.content, p.cover || null, status, p.isTop || 0,
          status === 'published' ? 40 + Math.floor(Math.random() * 400) : 0,
          authorId, status === 'published' ? d : null, d, d
        ]
      );
      for (const t of p.tags) {
        await conn.query('INSERT IGNORE INTO post_tags (post_id, tag_id) VALUES (?, ?)', [r.insertId, tagIds[t]]);
      }
    }

    // 演示评论
    const [[firstPost]] = await conn.query("SELECT id FROM posts WHERE slug = 'build-blog-with-vue3-node-mysql'");
    const [c1] = await conn.query(
      `INSERT INTO comments (post_id, nickname, email, content, status, created_at) VALUES (?, ?, ?, ?, 'approved', ?)`,
      [firstPost.id, '阿哲', 'azhe@example.com', '跟着做了一遍，接口那部分讲得很清楚，尤其是统一返回结构的思路，学到了。', new Date(Date.now() - 3600_000 * 5)]
    );
    await conn.query(
      `INSERT INTO comments (post_id, parent_id, nickname, content, status, created_at) VALUES (?, ?, ?, ?, 'approved', ?)`,
      [firstPost.id, c1.insertId, '林小岸', '谢谢！后面还会写一篇讲部署和反向代理的。', new Date(Date.now() - 3600_000 * 3)]
    );
    await conn.query(
      `INSERT INTO comments (post_id, nickname, content, status, created_at) VALUES (?, ?, ?, 'approved', ?)`,
      [firstPost.id, '小满', '请问标签是多对多关联吗？想改成一对多会不会简单些。', new Date(Date.now() - 3600_000 * 26)]
    );

    // 站点配置
    const settings = [
      ['site_title', '林小岸的博客'],
      ['site_subtitle', '写代码，也写生活'],
      ['about_md', `## 你好，我是林小岸

前端工程师，目前在一家做工具类产品的公司，主要写 Vue 和 Node。

这个博客用来记录三件事：

1. **技术笔记** —— 踩过的坑、想通的设计
2. **项目复盘** —— 做完的东西怎么做的、哪里可以更好
3. **一些随笔** —— 与代码无关，但同样重要

### 关于这个站

前端 Vue3 + Vite，后端 Node + Express，数据库 MySQL。全部代码都是自己写的，没有用现成的博客框架。

如果你也想搭一个，站内第一篇 <a href="/post/build-blog-with-vue3-node-mysql">《用 Vue3 + Node + MySQL 从零搭一个个人博客》</a> 里有完整思路。

### 联系我

- 邮箱：hi@example.com
- GitHub：github.com/example

> 慢一点，但一直在往前走。`],
      ['icp', '']
    ];
    for (const [k, v] of settings) {
      await conn.query('INSERT INTO settings (`key`, `value`) VALUES (?, ?)', [k, v]);
    }

    console.log('   ✔ 已创建管理员账号 admin / admin123');
  }

  const [[{ p: postCount }]] = await conn.query('SELECT COUNT(*) AS p FROM posts');
  console.log(`\n✅ 数据库初始化完成：${DB_NAME}，共 ${postCount} 篇文章\n`);
} catch (err) {
  console.error('❌ 初始化失败：', err.message);
  process.exitCode = 1;
} finally {
  await conn.end();
}
