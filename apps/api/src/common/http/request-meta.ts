import type { Request } from 'express';

export interface RequestMeta {
  ip: string | null;
  userAgent: string | null;
}

/** Client IP honours `trust proxy` (set from TRUST_PROXY_HOPS), so it can't be spoofed via headers. */
export function requestMeta(req: Request): RequestMeta {
  const ua = req.headers['user-agent'];
  return {
    ip: req.ip ?? null,
    userAgent: typeof ua === 'string' ? ua.slice(0, 512) : null,
  };
}
