/** 统一成功响应 */
export function ok(res, data = null, message = 'ok') {
  return res.json({ code: 0, message, data });
}

/** 统一失败响应 */
export function fail(res, message = '请求失败', status = 400, code = 1) {
  return res.status(status).json({ code, message, data: null });
}

/** 业务异常，交给全局错误处理中间件 */
export class HttpError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

/** 包装 async 路由，自动捕获异常 */
export function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}
