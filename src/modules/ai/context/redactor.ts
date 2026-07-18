/**
 * Redator LGPD: remove/anonimiza PII quando não é necessária para a resposta.
 * Usado quando a IA precisa raciocinar mas não precisa do nome real.
 */
export function redactName(text: string, realName: string, replacement = "a criança"): string {
  if (!realName) return text;
  const escaped = realName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return text.replace(new RegExp(escaped, "gi"), replacement);
}

export function redactEmail(text: string): string {
  return text.replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, "[email]");
}

export function redactPhone(text: string): string {
  return text.replace(/(\+?\d{2}\s?)?\(?\d{2}\)?\s?\d{4,5}-?\d{4}/g, "[telefone]");
}

export function redactAll(text: string, opts: { name?: string } = {}): string {
  let out = text;
  if (opts.name) out = redactName(out, opts.name);
  out = redactEmail(out);
  out = redactPhone(out);
  return out;
}
