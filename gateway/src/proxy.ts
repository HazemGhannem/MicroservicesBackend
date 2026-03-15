import { logger } from "./utils/logger";
import { createProxyMiddleware } from 'http-proxy-middleware';

export const proxy = (target: string, serviceName: string) =>
  createProxyMiddleware({
    target,
    changeOrigin: true,
    pathRewrite: (path, req) => (req as any).originalUrl,  
    on: {
      error: (err, _req, res: any) => {
        logger.error({ err, service: serviceName }, 'Proxy error');
        res.status(502).json({ error: `${serviceName} is unavailable` });
      },
      proxyReq: (proxyReq, req: any) => {
        logger.debug(
          {
            service: serviceName,
            originalUrl: req.originalUrl,
            proxyPath: proxyReq.path,
          },
          '→ Proxying',
        );
        if (!proxyReq.getHeader('authorization') && req.cookies?.token) {
          proxyReq.setHeader('Authorization', `Bearer ${req.cookies.token}`);
        }
      },
    },
  });
