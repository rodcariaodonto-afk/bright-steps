import { createServerFn } from "@tanstack/react-start";

/**
 * Detecta o país do visitante via cabeçalhos do request (edge runtime).
 * Cloudflare Workers injetam `cf-ipcountry`; outros CDNs equivalentes
 * ficam listados abaixo. Nenhum serviço externo é chamado; nenhuma
 * permissão de GPS é solicitada.
 */
export const detectCountryFromRequest = createServerFn({ method: "GET" }).handler(
  async () => {
    // getRequest só existe no runtime do TanStack Start; import dinâmico.
    const { getRequest } = await import("@tanstack/react-start/server");
    let request: Request | null = null;
    try {
      request = getRequest();
    } catch {
      return { country: null };
    }
    if (!request) return { country: null };

    const headers = request.headers;
    const candidates = [
      "cf-ipcountry", // Cloudflare
      "x-vercel-ip-country", // Vercel
      "x-country-code", // custom
      "x-appengine-country", // Google
    ];
    for (const name of candidates) {
      const val = headers.get(name);
      if (val && val !== "XX" && val.length === 2) {
        return { country: val.toUpperCase() };
      }
    }
    return { country: null };
  },
);
