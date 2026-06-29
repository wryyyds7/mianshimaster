declare namespace Express {
  interface Request {
    /** 请求唯一ID，由 requestIdMiddleware 注入 */
    requestId: string;
    /** JWT解析后的用户信息，由 authMiddleware 注入 */
    user?: {
      userId: string;
      username: string;
      role: string;
    };
  }
}
