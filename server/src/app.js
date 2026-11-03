import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

import { checkConnection } from './db.js';
import authRoutes from './routes/auth.js';
import postRoutes from './routes/posts.js';
import tagRoutes from './routes/tags.js';
import commentRoutes from './routes/comments.js';
import siteRoutes from './routes/site.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = Number(process.env.PORT || 3000);

/* ------------------------- 基础中间件 ------------------------- */
app.use(cors({
  origin: (process.env.CORS_ORIGIN || 'http://localhost:5173').split(','),
  credentials: true
}));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// 简易访问日志
app.use((req, _res, next) => {
  console.log(`${new Date().toLocaleTimeString('zh-CN')}  ${req.method} ${req.originalUrl}`);
  next();
});

/* ------------------------- 业务路由 ------------------------- */
app.get('/api/health', async (_req, res) => {
  try {
    const info = await checkConnection();
    res.json({ code: 0, message: 'ok', data: { status: 'up', mysql: info.version, database: info.db } });
  } catch (err) {
    res.status(500).json({ code: 1, message: `数据库连接失败: ${err.message}`, data: null });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/tags', tagRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/site', siteRoutes);

app.use('/api', (_req, res) => res.status(404).json({ code: 1, message: '接口不存在', data: null }));

/* --------------------- 生产环境托管前端静态文件 --------------------- */
const webDist = path.resolve(__dirname, '../../web/dist');
if (fs.existsSync(webDist)) {
  app.use(express.static(webDist));
  app.get('*', (_req, res) => res.sendFile(path.join(webDist, 'index.html')));
  console.log('已启用前端静态资源托管:', webDist);
}

/* ------------------------- 全局错误处理 ------------------------- */
app.use((err, _req, res, _next) => {
  console.error('[ERROR]', err);
  const status = err.status || 500;
  res.status(status).json({
    code: 1,
    message: err.message || '服务器内部错误',
    data: null
  });
});

app.listen(PORT, async () => {
  console.log(`\n  博客 API 已启动  →  http://localhost:${PORT}/api/health`);
  try {
    const info = await checkConnection();
    console.log(`  MySQL 连接成功    →  ${info.version} / ${info.db}\n`);
  } catch (err) {
    console.error(`  ⚠ MySQL 连接失败: ${err.message}`);
    console.error('  请检查 server/.env 中的数据库配置，或先运行 npm run init:db\n');
  }
});
