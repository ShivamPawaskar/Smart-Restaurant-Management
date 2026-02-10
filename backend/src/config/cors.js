import config from "./env.js";

const normalizeOrigin = (origin) => origin.trim().replace(/\/+$/, "");

const allowedOrigins = new Set(config.clientUrls.map(normalizeOrigin));

const isRailwayDomain = (origin) => {
  try {
    return new URL(origin).hostname.endsWith(".railway.app");
  } catch {
    return false;
  }
};

const isLocalDevOrigin = (origin) => /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);

export const isAllowedOrigin = (origin) => {
  if (!origin) return true;
  const normalized = normalizeOrigin(origin);
  return allowedOrigins.has(normalized) || isRailwayDomain(normalized) || isLocalDevOrigin(normalized);
};

export const corsOriginHandler = (origin, callback) => {
  if (isAllowedOrigin(origin)) {
    callback(null, true);
    return;
  }

  callback(new Error("Not allowed by CORS"));
};

