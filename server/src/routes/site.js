import { Router } from 'express';
import { query, queryOne } from '../db.js';
import { ok, asyncHandler } from '../utils/http.js';
import { required } from '../middleware/auth.js';

const router = Router();

/** 站点概览：博主信息 + 统计数据 */
router.get('/info', asyncHandler(async (_req, res) => {
  const [author, stats, settings] = await Promise.all([
    queryOne('SELECT nickname, avatar, bio FROM users ORDER BY id ASC LIMIT 1'),
    queryOne(
      `SELECT
         (SELECT COUNT(*) FROM posts WHERE status = 'published') AS postCount,
         (SELECT COUNT(*) FROM tags) AS tagCount,
         (SELECT COUNT(*) FROM comments WHERE status = 'approved') AS commentCount,
         (SELECT COALESCE(SUM(views), 0) FROM posts WHERE status = 'published') AS viewCount`
    ),
    query('SELECT `key`, `value` FROM settings')
  ]);

  const config = Object.fromEntries(settings.map(s => [s.key, s.value]));
  ok(res, {
    author: author || { nickname: '博主', avatar: null, bio: null },
    stats: {
      postCount: Number(stats.postCount),
      tagCount: Number(stats.tagCount),
      commentCount: Number(stats.commentCount),
      viewCount: Number(stats.viewCount)
    },
    config
  });
}));

/** 后台：更新站点配置 */
router.put('/config', required, asyncHandler(async (req, res) => {
  const entries = Object.entries(req.body || {}).filter(([k]) => /^[a-z_]{2,60}$/.test(k));
  for (const [key, value] of entries) {
    await query(
      'INSERT INTO settings (`key`, `value`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `value` = VALUES(`value`)',
      [key, String(value ?? '')]
    );
  }
  ok(res, null, '已保存');
}));

export default router;
