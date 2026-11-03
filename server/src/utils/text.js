import crypto from 'node:crypto';

/**
 * 生成 URL 友好的 slug。
 * 中文标题无法直接转拼音（不引第三方库），因此采用「英文数字保留 + 时间戳后缀」策略，
 * 保证唯一且可读。
 */
export function makeSlug(title = '') {
  const base = String(title)
    .toLowerCase()
    .replace(/[^\w\u4e00-\u9fa5\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 60);

  const suffix = crypto.randomBytes(3).toString('hex');
  // 纯中文标题带上时间戳，避免出现大段中文 URL
  const ascii = base.replace(/[\u4e00-\u9fa5]/g, '');
  const prefix = ascii.replace(/-+/g, '-').replace(/^-|-$/g, '') || 'post';
  return `${prefix}-${suffix}`;
}

/** 从 markdown 提取纯文本摘要 */
export function extractSummary(md = '', maxLen = 120) {
  const text = String(md)
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/[*_`>~-]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return text.length > maxLen ? `${text.slice(0, maxLen)}…` : text;
}

/** 估算阅读时长（分钟） */
export function readingMinutes(md = '') {
  const chars = String(md).replace(/\s/g, '').length;
  return Math.max(1, Math.round(chars / 400));
}
