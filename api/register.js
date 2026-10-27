import { redis, send, readBody, clientIp, rateLimit, PLAYERS_KEY } from "../lib/store.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const int = (v, max) => Math.max(0, Math.min(max, Math.floor(Number(v) || 0)));
const iso = (v) => { const d = new Date(v); return isNaN(d) ? null : d.toISOString(); };

/* Oyuncu özetini kaydeder/günceller: POST /api/register */
export default async function handler(req, res) {
  if (req.method !== "POST") { res.setHeader("Allow", "POST"); return send(res, 405, { error: "method_not_allowed" }); }
  const r = redis();
  if (!r) return send(res, 503, { error: "storage_not_configured" });

  if (!(await rateLimit(r, `reg:${clientIp(req)}`, 120, 600))) return send(res, 429, { error: "too_many_requests" });

  const b = readBody(req);
  const email = String(b.email || "").trim().toLowerCase();
  if (!EMAIL_RE.test(email) || email.length > 200) return send(res, 400, { error: "invalid_email" });

  const prev = await r.hget(PLAYERS_KEY, email);
  const old = prev ? (typeof prev === "string" ? JSON.parse(prev) : prev) : {};
  const now = new Date().toISOString();
  const entry = {
    email,
    name: String(b.name || old.name || email.split("@")[0]).trim().slice(0, 40),
    level: int(b.level, 17) || 1,
    xp: int(b.xp, 100000),
    lessons: int(b.lessons, 1000),
    bosses: int(b.bosses, 17),
    visits: Math.max(int(b.visits, 100000), old.visits || 0),
    created: old.created || iso(b.created) || now,
    lastSeen: iso(b.lastSeen) || now,
    updated: now,
  };
  await r.hset(PLAYERS_KEY, { [email]: JSON.stringify(entry) });
  return send(res, 200, { ok: true });
}
