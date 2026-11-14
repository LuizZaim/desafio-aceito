import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
const scrypt = promisify(scryptCallback);
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const key = await scrypt(password,salt,64) as Buffer;
  return `${salt}:${key.toString("hex")}`;
}
export async function verifyPassword(password: string, stored?: string): Promise<boolean> {
  const valid = typeof stored === "string" && /^[a-f0-9]{32}:[a-f0-9]{128}$/.test(stored);
  const [salt,hash] = (valid ? stored : "0".repeat(32)+":"+"0".repeat(128)).split(":");
  const key = await scrypt(password,salt,64) as Buffer;
  const equal = timingSafeEqual(key,Buffer.from(hash,"hex"));
  return valid && equal;
}
