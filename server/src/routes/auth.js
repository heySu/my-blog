import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { query, queryOne } from '../db.js';
import { ok, fail, asyncHandler } from '../utils/http.js';
import { signToken, required } from '../middleware/auth.js';

const router = Router();

/** 登录 */
router.post('/login', asyncHandler(async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) return fail(res, '请输入用户名和密码');

  const user = await queryOne('SELECT * FROM users WHERE username = ?', [username]);
  if (!user) return fail(res, '用户名或密码错误', 401);

  const matched = await bcrypt.compare(password, user.password_hash);
  if (!matched) return fail(res, '用户名或密码错误', 401);

  const token = signToken(user);
  ok(res, {
    token,
    user: { id: user.id, username: user.username, nickname: user.nickname, avatar: user.avatar, bio: user.bio }
  }, '登录成功');
}));

/** 获取当前登录用户 */
router.get('/me', required, asyncHandler(async (req, res) => {
  const user = await queryOne(
    'SELECT id, username, nickname, avatar, bio, created_at FROM users WHERE id = ?',
    [req.user.id]
  );
  if (!user) return fail(res, '用户不存在', 404);
  ok(res, user);
}));

/** 修改密码 */
router.put('/password', required, asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body || {};
  if (!oldPassword || !newPassword) return fail(res, '请填写原密码和新密码');
  if (String(newPassword).length < 6) return fail(res, '新密码至少 6 位');

  const user = await queryOne('SELECT * FROM users WHERE id = ?', [req.user.id]);
  if (!await bcrypt.compare(oldPassword, user.password_hash)) return fail(res, '原密码错误');

  const hash = await bcrypt.hash(newPassword, 10);
  await query('UPDATE users SET password_hash = ? WHERE id = ?', [hash, req.user.id]);
  ok(res, null, '密码修改成功');
}));

export default router;
