const ALLOWED_TAGS = new Set(["p", "br", "ul", "ol", "li", "strong", "em", "b", "i", "h2", "h3", "a", "img"]);
const VOID_TAGS = new Set(["br", "img"]);
const ALLOWED_IMAGE_HOSTS = new Set(["cdn.akamai.steamstatic.com", "steamcdn-a.akamaihd.net", "store.steampowered.com", "shared.akamai.steamstatic.com", "*.supabase.co", "res.cloudinary.com", "*.cloudinary.com"]);

function decodeEntities(value: string): string {
  return value
    .replace(/&#x([\da-f]{1,6});?/gi, (_, hex: string) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d{1,7});?/g, (_, dec: string) => String.fromCodePoint(parseInt(dec, 10)))
    .replace(/&colon;?/gi, ":").replace(/&tab;?/gi, "\t").replace(/&newline;?/gi, "\n")
    .replace(/&amp;/gi, "&").replace(/&quot;/gi, '"').replace(/&apos;|&#39;/gi, "'");
}

function safeHttpsUrl(value: string, image = false): string | null {
  const decoded = decodeEntities(value).replace(/[\u0000-\u0020\u007f]+/g, "").trim();
  try {
    const url = new URL(decoded);
    if (url.protocol !== "https:") return null;
    if (image && ![...ALLOWED_IMAGE_HOSTS].some((host) => host.startsWith("*.") ? url.hostname.endsWith(host.slice(1)) : url.hostname === host)) return null;
    return url.href;
  } catch {
    return null;
  }
}

function escapeAttribute(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/\"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Conservative HTML allowlist for untrusted game descriptions. */
export function sanitizeGameDescription(input: string | null | undefined): string {
  if (!input) return "";
  const source = input.slice(0, 100_000);
  let output = "";
  let cursor = 0;
  const tokens = /<!--[\s\S]*?-->|<\/?[a-zA-Z][^>]*>/g;
  for (const match of source.matchAll(tokens)) {
    const index = match.index ?? 0;
    output += source.slice(cursor, index);
    cursor = index + match[0].length;
    const token = match[0];
    if (token.startsWith("<!--")) continue;
    const parsed = token.match(/^<\s*(\/?)\s*([a-zA-Z0-9]+)([\s\S]*?)>$/);
    if (!parsed) continue;
    const closing = parsed[1] === "/";
    const tag = parsed[2].toLowerCase();
    if (!ALLOWED_TAGS.has(tag)) continue;
    if (closing) { if (!VOID_TAGS.has(tag)) output += `</${tag}>`; continue; }
    if (tag === "a") {
      const href = parsed[3].match(/\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
      const url = href && safeHttpsUrl(href[1] ?? href[2] ?? href[3]);
      output += url ? `<a href="${escapeAttribute(url)}" rel="noopener noreferrer nofollow" target="_blank">` : "<a>";
    } else if (tag === "img") {
      const src = parsed[3].match(/\bsrc\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
      const url = src && safeHttpsUrl(src[1] ?? src[2] ?? src[3], true);
      if (url) output += `<img src="${escapeAttribute(url)}" alt="" loading="lazy" referrerpolicy="no-referrer">`;
    } else output += `<${tag}>`;
  }
  output += source.slice(cursor);
  return output;
}
