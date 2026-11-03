-- 个人博客数据库结构
-- 字符集统一使用 utf8mb4，支持 emoji

SET NAMES utf8mb4;

-- 用户表（博主 / 后台管理员）
CREATE TABLE IF NOT EXISTS users (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  username      VARCHAR(50)  NOT NULL,
  password_hash VARCHAR(100) NOT NULL,
  nickname      VARCHAR(50)  NOT NULL DEFAULT '博主',
  avatar        VARCHAR(255) DEFAULT NULL,
  bio           VARCHAR(255) DEFAULT NULL,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_users_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 标签表
CREATE TABLE IF NOT EXISTS tags (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name       VARCHAR(50) NOT NULL,
  slug       VARCHAR(50) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_tags_name (name),
  UNIQUE KEY uk_tags_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 文章表
CREATE TABLE IF NOT EXISTS posts (
  id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
  title        VARCHAR(150) NOT NULL,
  slug         VARCHAR(180) NOT NULL,
  summary      VARCHAR(300) DEFAULT NULL,
  content_md   MEDIUMTEXT   NOT NULL,
  cover        VARCHAR(255) DEFAULT NULL,
  status       ENUM('draft','published') NOT NULL DEFAULT 'draft',
  is_top       TINYINT(1) NOT NULL DEFAULT 0,
  views        INT UNSIGNED NOT NULL DEFAULT 0,
  author_id    INT UNSIGNED DEFAULT NULL,
  published_at DATETIME DEFAULT NULL,
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_posts_slug (slug),
  KEY idx_posts_status_published (status, published_at),
  KEY idx_posts_created (created_at),
  CONSTRAINT fk_posts_author FOREIGN KEY (author_id) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 文章 - 标签 关联表
CREATE TABLE IF NOT EXISTS post_tags (
  post_id INT UNSIGNED NOT NULL,
  tag_id  INT UNSIGNED NOT NULL,
  PRIMARY KEY (post_id, tag_id),
  KEY idx_post_tags_tag (tag_id),
  CONSTRAINT fk_pt_post FOREIGN KEY (post_id) REFERENCES posts (id) ON DELETE CASCADE,
  CONSTRAINT fk_pt_tag  FOREIGN KEY (tag_id)  REFERENCES tags (id)  ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 评论表
CREATE TABLE IF NOT EXISTS comments (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  post_id    INT UNSIGNED NOT NULL,
  parent_id  INT UNSIGNED DEFAULT NULL,
  nickname   VARCHAR(50) NOT NULL,
  email      VARCHAR(120) DEFAULT NULL,
  website    VARCHAR(180) DEFAULT NULL,
  content    VARCHAR(1000) NOT NULL,
  status     ENUM('pending','approved','rejected') NOT NULL DEFAULT 'approved',
  ip         VARCHAR(64) DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_comments_post (post_id, status, created_at),
  CONSTRAINT fk_comments_post FOREIGN KEY (post_id) REFERENCES posts (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 站点配置表（关于页 / 站点信息）
CREATE TABLE IF NOT EXISTS settings (
  `key`      VARCHAR(60) NOT NULL,
  `value`    TEXT,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
