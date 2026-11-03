import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

/**
 * 全局连接池：mysql2 自带连接复用，避免每次请求都新建连接
 */
export const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'my_blog',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4_general_ci',
  dateStrings: true,
  timezone: 'local'
});

/** 执行查询并返回结果行 */
export async function query(sql, params = []) {
  const [rows] = await pool.execute(sql, params);
  return rows;
}

/** 执行查询只取第一行 */
export async function queryOne(sql, params = []) {
  const rows = await query(sql, params);
  return rows[0] || null;
}

/** 在事务中执行 */
export async function transaction(fn) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const result = await fn(conn);
    await conn.commit();
    return result;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

/** 启动时检查数据库连通性 */
export async function checkConnection() {
  const row = await queryOne('SELECT VERSION() AS version, DATABASE() AS db');
  return row;
}
