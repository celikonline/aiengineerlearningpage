// Yönetici şifresi için ADMIN_PASSWORD_HASH değeri üretir.
// Kullanım: npm run hash-password -- "YeniSifre"
import crypto from "node:crypto";

const pw = process.argv[2];
if (!pw) {
  console.error('Kullanım: npm run hash-password -- "YeniSifre"');
  process.exit(1);
}
const iter = 150000;
const salt = crypto.randomBytes(16).toString("hex");
const hash = crypto.pbkdf2Sync(pw, salt, iter, 32, "sha256").toString("hex");
console.log(`pbkdf2$${iter}$${salt}$${hash}`);
