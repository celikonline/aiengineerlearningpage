import { redis, send, verifyToken, adminEmail, PLAYERS_KEY } from "../../lib/store.js";

/* Kayıtlı oyuncu listesi: GET /api/admin/players (Authorization: Bearer <token>) */
export default async function handler(req, res) {
  if (req.method !== "GET") { res.setHeader("Allow", "GET"); return send(res, 405, { error: "method_not_allowed" }); }
  const auth = String(req.headers.authorization || "");
  const tok = verifyToken(auth.startsWith("Bearer ") ? auth.slice(7) : "");
  if (!tok || tok.e !== adminEmail()) return send(res, 401, { error: "unauthorized" });

  const r = redis();
  if (!r) return send(res, 503, { error: "storage_not_configured" });
  const all = (await r.hgetall(PLAYERS_KEY)) || {};
  const players = Object.values(all)
    .map((v) => { try { return typeof v === "string" ? JSON.parse(v) : v; } catch { return null; } })
    .filter(Boolean);
  return send(res, 200, { players });
}
