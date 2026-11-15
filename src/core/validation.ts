/** Same rules as api/src/validation.ts. Keep both in sync. */
export const EMAIL_RE = /^[^\s@.][^\s@]*@(?:[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?\.)+[A-Za-z]{2,}$/;

export function emailError(email: string): string | null {
  const v = email.trim();
  if (!v) return "Informe o e-mail.";
  if (v.length > 254 || v.includes("..") || !EMAIL_RE.test(v)) return "E-mail inválido. Use o formato nome@dominio.com.";
  return null;
}
export function passwordError(password: string): string | null {
  if (password.length < 8) return "A senha precisa de pelo menos 8 caracteres.";
  if (password.length > 128) return "A senha pode ter no máximo 128 caracteres.";
  if (!/[A-Za-z\u00C0-\u024F]/.test(password) || !/\d/.test(password)) return "A senha precisa ter pelo menos uma letra e um número.";
  return null;
}
export function nameError(name: string): string | null {
  const v = name.trim();
  if (v.length < 3 || (v.match(/[A-Za-z\u00C0-\u024F]/g) || []).length < 2) return "Informe seu nome (pelo menos 3 caracteres, com letras).";
  if (v.length > 100) return "O nome pode ter no máximo 100 caracteres.";
  return null;
}
