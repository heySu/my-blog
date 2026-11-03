import { Router } from 'express';
import { query, queryOne } from '../db.js';
import { ok, fail, asyncHandler } from '../utils/http.js';
import { required } from '../middleware/auth.js';

const router = Router();

/* 某篇文章的已通过评论（树形返回） */
router.get('/post/:postId', asyncHandler(async (req, res) => {
  const postId = Number(req.params.postId);
  const rows = await query(
    `SELECT id, post_id, parent_id, nickname, website, content, created_at
       FROM comments WHERE post_id = ? AND status = 'approved'
      ORDER BY created_at ASC`,
    [postId]
  );

  const map = new Map(rows.map(r => [r.id, { ...r, children: [] }]));
  const roots = [];
  for (const item of map.values()) {
    if (item.parent_id && map.has(item.parent_id)) {
      map.get(item.parent_id).children.push(item);
    } else {
      roots.push(item);
    }
  }
  ok(res, roots);
}));

/* 提交评论 */
router.post('/post/:postId', asyncHandler(async (req, res) => {
  const postId = Number(req.params.postId);
  const { nickname, email, website, content, parentId } = req.body || {};

  if (!nickname || !String(nickname).trim()) return fail(res, '请填写昵称');
  if (!content || String(content).trim().length < 2) return fail(res, '评论内容太短了');
  if (String(content).length > 1000) return fail(res, '评论最多 1000 字');
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail(res, '邮箱格式不正确');

  const post = await queryOne("SELECT id FROM posts WHERE id = ? AND status = 'published'", [postId]);
  if (!post) return fail(res, '文章不存在', 404);

  if (parentId) {
    const parent = await queryOne('SELECT id FROM comments WHERE id = ? AND post_id = ?', [Number(parentId), postId]);
    if (!parent) return fail(res, '回复的评论不存在');
  }

  const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').toString().split(',')[0].trim();

  const r = await query(
    `INSERT INTO comments (post_id, parent_id, nickname, email, website, content, ip)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      postId,
      parentId ? Number(parentId) : null,
      String(nickname).trim().slice(0, 50),
      email || null,
      website || null,
      String(content).trim(),
      ip.slice(0, 64)
    ]
  );

  ok(res, { id: r.insertId }, '评论成功');
}));

/* ---------------- 后台：评论管理 ---------------- */
router.get('/', required, asyncHandler(async (req, res) => {
  const status = req.query.status || '';
  const params = [];
  let where = '';
  if (['pending', 'approved', 'rejected'].includes(status)) {
    where = 'WHERE c.status = ?';
    params.push(status);
  }
  const rows = await query(
    `SELECT c.*, p.title AS postTitle, p.slug AS postSlug
       FROM comments c LEFT JOIN posts p ON p.id = c.post_id
       ${where} ORDER BY c.created_at DESC LIMIT 200`,
    params
  );
  ok(res, rows);
}));

router.patch('/:id/status', required, asyncHandler(async (req, res) => {
  const { status } = req.body || {};
  if (!['pending', 'approved', 'rejected'].includes(status)) return fail(res, '状态不合法');
  const r = await query('UPDATE comments SET status = ? WHERE id = ?', [status, Number(req.params.id)]);
  if (!r.affectedRows) return fail(res, '评论不存在', 404);
  ok(res, null, '操作成功');
}));

router.delete('/:id', required, asyncHandler(async (req, res) => {
  const r = await query('DELETE FROM comments WHERE id = ?', [Number(req.params.id)]);
  if (!r.affectedRows) return fail(res, '评论不存在', 404);
  ok(res, null, '删除成功');
}));

export default router;
