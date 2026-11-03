import jwt from 'jsonwebtoken';
import { fail } from '../utils/http.js';

const SECRET = process.env.JWT_SECRET || 'my-blog-super-secret-key-please-change';

export function signToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username, nickname: user.nickname },
    SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

/** 必须登录 */
export function required(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return fail(res, '未登录或登录已过期', 401);

  try {
    req.user = jwt.verify(token, SECRET);
    next();
  } catch {
    return fail(res, '登录状态无效，请重新登录', 401);
  }
}

/** 可选登录：有 token 就解析，没有也放行 */
export function optional(req, _res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (token) {
    try {
      req.user = jwt.verify(token, SECRET);
    } catch {
      /* 忽略无效 token */
    }
  }
  next();
}
