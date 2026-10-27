import { Redis } from "@upstash/redis";
import crypto from "node:crypto";

/* Upstash Redis bağlantısı. Vercel Marketplace'ten Upstash eklendiğinde
   UPSTASH_REDIS_REST_* ya da KV_REST_API_* değişkenleri otomatik gelir. */
let client = null;
export function redis() {
  if (client) return client;
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;
  client = new Redis({ url, token });
  return client;
}
export function setRedisForTest(r) { client = r; }

export const PLAYERS_KEY = "aiea:players";
export const adminEmail = () => (process.env.ADMIN_EMAIL || "ozgur.celikv3@gmail.com").trim().toLowerCase();

export function send(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(body));
}

export function readBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  try { return JSON.parse(req.body || "{}"); } catch { return {}; }
}

export function clientIp(req) {
  const xf = req.headers["x-forwarded-for"];
  return (Array.isArray(xf) ? xf[0] : (xf || "")).split(",")[0].trim() || "unknown";
}

/* Basit sabit pencereli hız sınırı. */
export async function rateLimit(r, key, limit, windowSec) {
  const k = `aiea:rl:${key}`;
  const n = await r.incr(k);
  if (n === 1) await r.expire(k, windowSec);
  return n <= limit;
}

/* ADMIN_PASSWORD_HASH biçimi: pbkdf2$<iterasyon>$<salt>$<hex özet> */
export function verifyPassword(password, stored) {
  if (typeof password !== "string" || !stored) return false;
  const [algo, iterStr, salt, hash] = stored.split("$");
  if (algo !== "pbkdf2" || !salt || !hash) return false;
  const iter = parseInt(iterStr, 10);
  if (!Number.isFinite(iter) || iter < 10000) return false;
  const derived = crypto.pbkdf2Sync(password, salt, iter, 32, "sha256");
  const expected = Buffer.from(hash, "hex");
  return expected.length === derived.length && crypto.timingSafeEqual(derived, expected);
}

/* İmzalı, süreli yönetici oturum anahtarı (HMAC-SHA256). */
const secret = () => process.env.ADMIN_TOKEN_SECRET || "";
export function signToken(email, ttlSec = 8 * 3600) {
  const payload = Buffer.from(JSON.stringify({ e: email, x: Math.floor(Date.now() / 1000) + ttlSec })).toString("base64url");
  const sig = crypto.createHmac("sha256", secret()).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}
export function verifyToken(token) {
  if (!secret() || typeof token !== "string" || !token.includes(".")) return null;
  const [payload, sig] = token.split(".");
  const want = crypto.createHmac("sha256", secret()).update(payload).digest("base64url");
  const a = Buffer.from(sig), b = Buffer.from(want);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString());
    if (!data.x || data.x < Date.now() / 1000) return null;
    return data;
  } catch { return null; }
}
