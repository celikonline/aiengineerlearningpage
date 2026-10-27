import { redis, send, readBody, clientIp, rateLimit, adminEmail, verifyPassword, signToken } from "../../lib/store.js";

/* Yönetici girişi: POST /api/admin/login {email, password} -> {token} */
export default async function handler(req, res) {
  if (req.method !== "POST") { res.setHeader("Allow", "POST"); return send(res, 405, { error: "method_not_allowed" }); }
  if (!process.env.ADMIN_PASSWORD_HASH || !process.env.ADMIN_TOKEN_SECRET) return send(res, 503, { error: "admin_not_configured" });

  const r = redis();
  if (r && !(await rateLimit(r, `login:${clientIp(req)}`, 10, 900))) return send(res, 429, { error: "too_many_attempts" });

  const { email, password } = readBody(req);
  const ok = String(email || "").trim().toLowerCase() === adminEmail() && verifyPassword(password, process.env.ADMIN_PASSWORD_HASH);
  if (!ok) return send(res, 401, { error: "invalid_credentials" });
  return send(res, 200, { token: signToken(adminEmail()) });
}
