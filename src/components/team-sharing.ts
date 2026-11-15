/** Only published team identities get an app link; offline profiles remain local. */
export function teamShareMessage(input: {
  name: string; category: string; level: string; location: string;
  mode: "none" | "online" | "local" | "demo"; teamId?: string | null;
}): string {
  const summary = `Conheça ${input.name} no Desafio Aceito! ${input.category} · ${input.level} · ${input.location}.`;
  if (input.mode === "online" && typeof input.teamId === "string" && /^[A-Za-z0-9][A-Za-z0-9_-]{0,99}$/.test(input.teamId))
    return `${summary}\nAbrir no aplicativo: desafioaceito://equipe?id=${encodeURIComponent(input.teamId)}`;
  return input.mode === "online"
    ? `${summary}\nResumo da equipe; o link para abrir no aplicativo está indisponível.`
    : `${summary}\nPerfil local de demonstração; não está publicado para outros usuários.`;
}
