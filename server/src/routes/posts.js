import { Router } from 'express';
import { query, queryOne, pool } from '../db.js';
import { ok, fail, HttpError, asyncHandler } from '../utils/http.js';
import { required, optional } from '../middleware/auth.js';
import { makeSlug, extractSummary, readingMinutes } from '../utils/text.js';

const router = Router();

/** 批量取出文章标签，返回 { postId: [{id,name,slug}] } */
async function attachTags(posts) {
  if (!posts.length) return posts;
  const ids = posts.map(p => p.id);
  const rows = await query(
    `SELECT pt.post_id, t.id, t.name, t.slug
       FROM post_tags pt JOIN tags t ON t.id = pt.tag_id
      WHERE pt.post_id IN (${ids.map(() => '?').join(',')})`,
    ids
  );
  const map = new Map();
  for (const r of rows) {
    if (!map.has(r.post_id)) map.set(r.post_id, []);
    map.get(r.post_id).push({ id: r.id, name: r.name, slug: r.slug });
  }
  return posts.map(p => ({ ...p, tags: map.get(p.id) || [] }));
}

/** 批量取出评论数 */
async function attachCommentCounts(posts) {
  if (!posts.length) return posts;
  const ids = posts.map(p => p.id);
  const rows = await query(
    `SELECT post_id, COUNT(*) AS c FROM comments
      WHERE status = 'approved' AND post_id IN (${ids.map(() => '?').join(',')})
      GROUP BY post_id`,
    ids
  );
  const map = new Map(rows.map(r => [r.post_id, Number(r.c)]));
  return posts.map(p => ({ ...p, commentCount: map.get(p.id) || 0 }));
}

/** 新增标签（已存在则复用），返回标签 id 列表 */
async function resolveTagIds(conn, names = []) {
  const ids = [];
  for (const raw of names) {
    const name = String(raw).trim().slice(0, 50);
    if (!name) continue;
    const [exist] = await conn.execute('SELECT id FROM tags WHERE name = ?', [name]);
    if (exist.length) {
      ids.push(exist[0].id);
      continue;
    }
    const slug = makeSlug(name).replace(/[^a-z0-9-]/g, '') || `tag-${Date.now()}`;
    const [r] = await conn.execute('INSERT INTO tags (name, slug) VALUES (?, ?)', [name, slug]);
    ids.push(r.insertId);
  }
  return [...new Set(ids)];
}

/* ------------------------------------------------------------------ */
/*  文章列表                                                           */
/* ------------------------------------------------------------------ */
router.get('/', optional, asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const size = Math.min(50, Math.max(1, parseInt(req.query.size, 10) || 6));
  const keyword = (req.query.keyword || '').trim();
  const tag = (req.query.tag || '').trim();
  const year = parseInt(req.query.year, 10) || 0;
  const wantAll = req.query.status === 'all';
  const isAdmin = Boolean(req.user);

  const where = [];
  const params = [];

  if (wantAll && isAdmin) {
    const filter = req.query.filter;
    if (['draft', 'published'].includes(filter)) {
      where.push('p.status = ?');
      params.push(filter);
    }
  } else {
    where.push("p.status = 'published'");
  }

  if (keyword) {
    where.push('(p.title LIKE ? OR p.content_md LIKE ?)');
    params.push(`%${keyword}%`, `%${keyword}%`);
  }
  if (tag) {
    where.push(`EXISTS (SELECT 1 FROM post_tags pt JOIN tags t ON t.id = pt.tag_id
                 WHERE pt.post_id = p.id AND (t.slug = ? OR t.name = ?))`);
    params.push(tag, tag);
  }
  if (year) {
    where.push('YEAR(COALESCE(p.published_at, p.created_at)) = ?');
    params.push(year);
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const totalRow = await queryOne(`SELECT COUNT(*) AS total FROM posts p ${whereSql}`, params);
  const total = Number(totalRow.total);

  const list = await query(
    `SELECT p.id, p.title, p.slug, p.summary, p.cover, p.status, p.is_top, p.views,
            p.published_at, p.created_at, p.updated_at, u.nickname AS author,
            CHAR_LENGTH(p.content_md) AS contentLength
       FROM posts p LEFT JOIN users u ON u.id = p.author_id
       ${whereSql}
      ORDER BY p.is_top DESC, COALESCE(p.published_at, p.created_at) DESC
      LIMIT ${size} OFFSET ${(page - 1) * size}`,
    params
  );

  const withMeta = await attachCommentCounts(await attachTags(list));
  const data = withMeta.map(p => ({
    ...p,
    readingMinutes: Math.max(1, Math.round((p.contentLength || 0) / 400)),
    contentLength: undefined
  }));

  ok(res, { list: data, total, page, size, totalPages: Math.ceil(total / size) || 1 });
}));

/* ------------------------------------------------------------------ */
/*  归档                                                               */
/* ------------------------------------------------------------------ */
router.get('/archive', asyncHandler(async (_req, res) => {
  const rows = await query(
    `SELECT id, title, slug, published_at, created_at
       FROM posts WHERE status = 'published'
      ORDER BY COALESCE(published_at, created_at) DESC`
  );
  const groups = new Map();
  for (const r of rows) {
    const d = String(r.published_at || r.created_at);
    const y = d.slice(0, 4);
    if (!groups.has(y)) groups.set(y, []);
    groups.get(y).push({ ...r, date: d.slice(0, 10) });
  }
  ok(res, [...groups.entries()].map(([year, posts]) => ({ year, posts, count: posts.length })));
}));

/* ------------------------------------------------------------------ */
/*  文章详情（同时自增浏览量）                                          */
/* ------------------------------------------------------------------ */
router.get('/:idOrSlug', optional, asyncHandler(async (req, res) => {
  const key = req.params.idOrSlug;
  const byId = /^\d+$/.test(key);

  const post = await queryOne(
    `SELECT p.*, u.nickname AS author, u.avatar AS authorAvatar, u.bio AS authorBio
       FROM posts p LEFT JOIN users u ON u.id = p.author_id
      WHERE ${byId ? 'p.id = ?' : 'p.slug = ?'} LIMIT 1`,
    [byId ? Number(key) : key]
  );
  if (!post) return fail(res, '文章不存在或已被删除', 404);
  if (post.status !== 'published' && !req.user) return fail(res, '文章不存在或已被删除', 404);

  await query('UPDATE posts SET views = views + 1 WHERE id = ?', [post.id]);
  post.views += 1;

  const [tags, prev, next] = await Promise.all([
    query(`SELECT t.id, t.name, t.slug FROM tags t
             JOIN post_tags pt ON pt.tag_id = t.id WHERE pt.post_id = ?`, [post.id]),
    queryOne(
      `SELECT id, title, slug FROM posts
        WHERE status='published' AND COALESCE(published_at, created_at) < COALESCE(?, created_at)
        ORDER BY COALESCE(published_at, created_at) DESC LIMIT 1`,
      [post.published_at]
    ),
    queryOne(
      `SELECT id, title, slug FROM posts
        WHERE status='published' AND COALESCE(published_at, created_at) > COALESCE(?, created_at)
        ORDER BY COALESCE(published_at, created_at) ASC LIMIT 1`,
      [post.published_at]
    )
  ]);

  ok(res, { ...post, tags, prev, next, readingMinutes: readingMinutes(post.content_md) });
}));

/* ------------------------------------------------------------------ */
/*  新建 / 更新 / 删除（需登录）                                        */
/* ------------------------------------------------------------------ */
router.post('/', required, asyncHandler(async (req, res) => {
  const { title, contentMd, summary, cover, status = 'draft', isTop = 0, tags = [], slug } = req.body || {};
  if (!title || !String(title).trim()) return fail(res, '请填写标题');
  if (!contentMd || !String(contentMd).trim()) return fail(res, '请填写正文内容');
  if (!['draft', 'published'].includes(status)) return fail(res, '状态不合法');

  const finalSlug = (slug && String(slug).trim()) || makeSlug(title);
  if (await queryOne('SELECT id FROM posts WHERE slug = ?', [finalSlug])) {
    return fail(res, '该 slug 已被占用，请换一个');
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [r] = await conn.execute(
      `INSERT INTO posts (title, slug, summary, content_md, cover, status, is_top, author_id, published_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        String(title).trim().slice(0, 150),
        finalSlug,
        (summary && String(summary).trim()) || extractSummary(contentMd),
        contentMd,
        cover || null,
        status,
        isTop ? 1 : 0,
        req.user.id,
        status === 'published' ? new Date() : null
      ]
    );
    const postId = r.insertId;
    const tagIds = await resolveTagIds(conn, tags);
    for (const tid of tagIds) {
      await conn.execute('INSERT IGNORE INTO post_tags (post_id, tag_id) VALUES (?, ?)', [postId, tid]);
    }
    await conn.commit();
    ok(res, { id: postId, slug: finalSlug }, '保存成功');
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}));

router.put('/:id', required, asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const exist = await queryOne('SELECT * FROM posts WHERE id = ?', [id]);
  if (!exist) throw new HttpError('文章不存在', 404);

  const { title, contentMd, summary, cover, status, isTop, tags, slug } = req.body || {};
  if (!title || !String(title).trim()) return fail(res, '请填写标题');
  if (!contentMd || !String(contentMd).trim()) return fail(res, '请填写正文内容');

  const nextStatus = status || exist.status;
  if (!['draft', 'published'].includes(nextStatus)) return fail(res, '状态不合法');

  const nextSlug = (slug && String(slug).trim()) || exist.slug;
  if (nextSlug !== exist.slug) {
    const dup = await queryOne('SELECT id FROM posts WHERE slug = ? AND id <> ?', [nextSlug, id]);
    if (dup) return fail(res, '该 slug 已被占用，请换一个');
  }

  const publishedAt = nextStatus === 'published' ? (exist.published_at || new Date()) : null;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.execute(
      `UPDATE posts SET title = ?, slug = ?, summary = ?, content_md = ?, cover = ?,
              status = ?, is_top = ?, published_at = ? WHERE id = ?`,
      [
        String(title).trim().slice(0, 150),
        nextSlug,
        (summary && String(summary).trim()) || extractSummary(contentMd),
        contentMd,
        cover || null,
        nextStatus,
        isTop ? 1 : 0,
        publishedAt,
        id
      ]
    );

    if (Array.isArray(tags)) {
      const tagIds = await resolveTagIds(conn, tags);
      await conn.execute('DELETE FROM post_tags WHERE post_id = ?', [id]);
      for (const tid of tagIds) {
        await conn.execute('INSERT IGNORE INTO post_tags (post_id, tag_id) VALUES (?, ?)', [id, tid]);
      }
    }
    await conn.commit();
    ok(res, { id, slug: nextSlug }, '更新成功');
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}));

router.delete('/:id', required, asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const r = await query('DELETE FROM posts WHERE id = ?', [id]);
  if (!r.affectedRows) throw new HttpError('文章不存在', 404);
  ok(res, null, '删除成功');
}));

export default router;
