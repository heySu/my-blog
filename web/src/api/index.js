import axios from 'axios';

const http = axios.create({
  baseURL: '/api',
  timeout: 15000
});

/* 请求拦截：自动带上 token */
http.interceptors.request.use(config => {
  const token = localStorage.getItem('blog_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

/* 响应拦截：统一剥掉 { code, message, data } 外壳 */
http.interceptors.response.use(
  response => {
    const body = response.data;
    if (body && body.code !== 0) {
      return Promise.reject(new Error(body.message || '请求失败'));
    }
    return body?.data;
  },
  error => {
    const status = error.response?.status;
    const message = error.response?.data?.message || error.message || '网络异常';

    if (status === 401) {
      localStorage.removeItem('blog_token');
      localStorage.removeItem('blog_user');
      // 只在后台页面自动跳转登录，前台不打扰
      if (location.pathname.startsWith('/admin') && !location.pathname.includes('login')) {
        location.href = '/admin/login';
      }
    }
    return Promise.reject(new Error(message));
  }
);

export default http;

/* ------------------------- 接口定义 ------------------------- */
export const api = {
  // 站点
  siteInfo: () => http.get('/site/info'),
  updateConfig: data => http.put('/site/config', data),

  // 认证
  login: data => http.post('/auth/login', data),
  me: () => http.get('/auth/me'),
  changePassword: data => http.put('/auth/password', data),

  // 文章
  posts: params => http.get('/posts', { params }),
  post: key => http.get(`/posts/${key}`),
  archive: () => http.get('/posts/archive'),
  createPost: data => http.post('/posts', data),
  updatePost: (id, data) => http.put(`/posts/${id}`, data),
  deletePost: id => http.delete(`/posts/${id}`),

  // 标签
  tags: () => http.get('/tags'),
  createTag: data => http.post('/tags', data),
  deleteTag: id => http.delete(`/tags/${id}`),

  // 评论
  commentsOfPost: postId => http.get(`/comments/post/${postId}`),
  addComment: (postId, data) => http.post(`/comments/post/${postId}`, data),
  allComments: params => http.get('/comments', { params }),
  setCommentStatus: (id, status) => http.patch(`/comments/${id}/status`, { status }),
  deleteComment: id => http.delete(`/comments/${id}`)
};
