import { Router } from 'express';
import { query, queryOne } from '../db.js';
import { ok, fail, asyncHandler } from '../utils/http.js';
import { required } from '../middleware/auth.js';

const router = Router();

/** 标签列表，带文章数量 */
router.get('/', asyncHandler(async (_req, res) => {
  const rows = await query(
    `SELECT t.id, t.name, t.slug, COUNT(pt.post_id) AS count
       FROM tags t
       LEFT JOIN post_tags pt ON pt.tag_id = t.id
       LEFT JOIN posts p ON p.id = pt.post_id AND p.status = 'published'
      GROUP BY t.id, t.name, t.slug
      ORDER BY count DESC, t.id ASC`
  );
  ok(res, rows.map(r => ({ ...r, count: Number(r.count) })));
}));

/** 新建标签 */
router.post('/', required, asyncHandler(async (req, res) => {
  const name = String(req.body?.name || '').trim().slice(0, 50);
  if (!name) return fail(res, '请填写标签名');
  if (await queryOne('SELECT id FROM tags WHERE name = ?', [name])) return fail(res, '标签已存在');

  const slug = name.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-').replace(/^-|-$/g, '') || `tag-${Date.now()}`;
  const r = await query('INSERT INTO tags (name, slug) VALUES (?, ?)', [name, slug]);
  ok(res, { id: r.insertId, name, slug }, '创建成功');
}));

/** 删除标签 */
router.delete('/:id', required, asyncHandler(async (req, res) => {
  const r = await query('DELETE FROM tags WHERE id = ?', [Number(req.params.id)]);
  if (!r.affectedRows) return fail(res, '标签不存在', 404);
  ok(res, null, '删除成功');
}));

export default router;
