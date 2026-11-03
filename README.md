# 个人博客 · Vue3 + Node + MySQL

一个可以直接跑起来的个人博客系统。前端 Vue3，后端 Node/Express，数据存 MySQL，包含文章、标签、评论、后台管理全套功能。

```
my-blog/
├── web/                     前端（Vue3 + Vite）
│   ├── src/
│   │   ├── api/             接口封装（axios）
│   │   ├── components/      公共组件
│   │   ├── views/           页面（含 admin 后台）
│   │   ├── router/          路由
│   │   ├── stores/          Pinia 状态
│   │   └── styles/          全局样式
│   └── vite.config.js       开发代理 /api → :3000
├── server/                  后端（Node + Express）
│   ├── src/
│   │   ├── app.js           入口
│   │   ├── db.js            mysql2 连接池
│   │   ├── routes/          auth / posts / tags / comments / site
│   │   ├── middleware/      JWT 鉴权
│   │   └── utils/           统一响应、slug、摘要
│   ├── sql/schema.sql       建表语句
│   ├── scripts/init-db.js   一键建库 + 演示数据
│   └── .env                 数据库 / 端口 / JWT 配置
├── database/                本地 MySQL（免安装，随项目走）
├── start-db.cmd             启动数据库
└── start-all.cmd            一键启动（数据库 + 后端 + 前端）
```

---

## 一、启动（三步）

### 1. 启动数据库

双击 `start-db.cmd`，或命令行执行：

```bash
./start-db.cmd
```

首次运行会自动初始化数据目录（约 10 秒），之后每次只是启动服务，监听 `3306`。

### 2. 关闭数据库

```bash
./stop-db.cmd
```

### 3. 启动前后端

双击 `start-all.cmd`，会打开两个窗口：

- 后端：http://localhost:3000
- 前端：http://localhost:5173

也可以手动分别启动：

```bash
cd server && npm run dev     # 后端
cd web && npm run dev        # 前端
```

打开 http://localhost:5173 即可看到博客首页。

---

## 二、数据库

### 连接信息（`server/.env`）

| 项 | 值 |
| --- | --- |
| host | 127.0.0.1 |
| port | 3306 |
| user | root |
| password | 123456 |
| database | my_blog |

### 重新初始化

```bash
cd server
npm run init:db
```

会建库、建表并写入 6 篇演示文章、标签、评论和管理员账号。

### 表结构

| 表 | 说明 |
| --- | --- |
| `users` | 博主账号（bcrypt 加密存储密码） |
| `posts` | 文章，含 `draft` / `published` 状态、浏览量、置顶 |
| `tags` | 标签 |
| `post_tags` | 文章 ↔ 标签 多对多关联 |
| `comments` | 评论，支持 `parent_id` 楼中楼回复与审核状态 |
| `settings` | 站点配置（标题、副标题、关于页 Markdown、备案号） |

---

## 三、后台管理

地址：http://localhost:5173/admin

- 默认账号：`admin`
- 默认密码：`admin123`

功能：

- **文章管理**：列表、按状态筛选、搜索、编辑、删除
- **写文章**：Markdown 编辑 + 实时预览、标签、封面、摘要、置顶、草稿
- **评论管理**：通过 / 拒绝 / 删除
- **标签管理**：新增、删除、查看关联数量
- **站点设置**：站点标题、副标题、关于页内容、备案号、修改密码

> 登录后请到「站点设置 → 修改密码」改掉默认密码。

---

## 四、接口一览

所有接口统一返回：

```json
{ "code": 0, "message": "ok", "data": {} }
```

`code` 为 0 表示成功；失败时 HTTP 状态码同时保持语义（400 / 401 / 404 / 500）。

### 认证

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| POST | `/api/auth/login` | 登录，返回 JWT |
| GET | `/api/auth/me` | 当前用户（需 token） |
| PUT | `/api/auth/password` | 修改密码（需 token） |

### 文章

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/api/posts?page=1&size=6&keyword=&tag=` | 分页列表（仅已发布） |
| GET | `/api/posts?status=all` | 后台列表，带 token 时返回全部 |
| GET | `/api/posts/archive` | 归档（按年分组） |
| GET | `/api/posts/:idOrSlug` | 详情，自动 +1 浏览量 |
| POST | `/api/posts` | 新建（需 token） |
| PUT | `/api/posts/:id` | 更新（需 token） |
| DELETE | `/api/posts/:id` | 删除（需 token） |

### 标签 / 评论 / 站点

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/api/tags` | 标签列表（含文章数） |
| POST | `/api/tags` | 新建标签（需 token） |
| DELETE | `/api/tags/:id` | 删除标签（需 token） |
| GET | `/api/comments/post/:postId` | 文章评论（树形） |
| POST | `/api/comments/post/:postId` | 发表评论 |
| GET | `/api/comments` | 后台评论列表（需 token） |
| PATCH | `/api/comments/:id/status` | 审核状态（需 token） |
| DELETE | `/api/comments/:id` | 删除评论（需 token） |
| GET | `/api/site/info` | 站点信息 + 统计数据 |
| PUT | `/api/site/config` | 更新站点配置（需 token） |
| GET | `/api/health` | 健康检查（含 MySQL 版本） |

鉴权方式：请求头 `Authorization: Bearer <token>`。

---

## 五、技术说明

**前端**

- Vue 3 `<script setup>` 组合式 API
- Vue Router（history 模式）+ Pinia
- axios 封装：自动带 token、统一剥壳、401 自动跳登录
- markdown-it + highlight.js 渲染正文，支持代码高亮、外链新窗口、图片懒加载
- 全站响应式，含移动端菜单、后台抽屉侧栏

**后端**

- Express 4 + ESM
- mysql2 连接池 + 参数化查询（防注入）
- JWT 鉴权、bcrypt 密码哈希
- 统一响应 / 全局错误处理 / asyncHandler 包装
- 事务处理文章与标签的关联写入

**数据库**

- MySQL 8.0，utf8mb4 字符集，支持 emoji
- 外键约束 + 索引（状态、时间、slug 唯一）

---

## 六、生产部署

```bash
cd web && npm run build     # 产物输出 web/dist
```

`web/dist` 存在时，后端会自动托管静态文件并接管前端路由，此时只需启动 Node：

```bash
cd server && npm start
```

访问 http://localhost:3000 即可。

部署到服务器时记得：

1. 修改 `server/.env` 中的 `JWT_SECRET` 和数据库密码
2. 用 Nginx 反代 3000 端口并配置 HTTPS
3. 数据库不要对公网开放
