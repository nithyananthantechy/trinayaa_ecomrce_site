/**
 * HTML Sanitizer for TRINAYAA CMS & Policy Management
 * Strips executable scripts, dangerous protocols, and unauthorized tags/attributes.
 */

const ALLOWED_TAGS = new Set([
  "h1", "h2", "h3", "h4", "h5", "h6",
  "p", "span", "div", "blockquote",
  "ul", "ol", "li",
  "strong", "b", "em", "i", "u", "s", "strike",
  "br", "hr",
  "a",
  "table", "thead", "tbody", "tr", "th", "td",
]);

const ALLOWED_ATTRIBUTES = new Set([
  "href", "title", "target", "rel", "class",
]);

export function sanitizeHtml(input: string): string {
  if (!input || typeof input !== "string") return "";

  let sanitized = input;

  // 1. Remove script, style, iframe, object, embed, form, input, button, textarea, meta, link, svg, math tags and their contents
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
  sanitized = sanitized.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "");
  sanitized = sanitized.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "");
  sanitized = sanitized.replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, "");
  sanitized = sanitized.replace(/<embed\b[^<]*>/gi, "");
  sanitized = sanitized.replace(/<form\b[^<]*(?:(?!<\/form>)<[^<]*)*<\/form>/gi, "");
  sanitized = sanitized.replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, "");

  // 2. Filter HTML tags
  sanitized = sanitized.replace(/<\/?([a-zA-Z0-9\-]+)([^>]*)>/gi, (match, tagName, attrs) => {
    const lowerTag = tagName.toLowerCase();
    const isClosing = match.startsWith("</");

    if (!ALLOWED_TAGS.has(lowerTag)) {
      return ""; // Disallowed tag stripped
    }

    if (isClosing) {
      return `</${lowerTag}>`;
    }

    // Process attributes on opening tag
    const safeAttrs: string[] = [];
    const attrRegex = /([a-zA-Z0-9\-]+)(?:\s*=\s*(?:(?:"([^"]*)")|(?:'([^']*)')|([^\s>]+)))?/gi;
    let attrMatch: RegExpExecArray | null;

    while ((attrMatch = attrRegex.exec(attrs)) !== null) {
      const attrName = attrMatch[1].toLowerCase();
      const rawValue = attrMatch[2] ?? attrMatch[3] ?? attrMatch[4] ?? "";

      // Strip any event handler attribute starting with "on" (e.g. onerror, onload, onclick)
      if (attrName.startsWith("on")) {
        continue;
      }

      if (!ALLOWED_ATTRIBUTES.has(attrName)) {
        continue;
      }

      // If href, validate protocol
      if (attrName === "href") {
        const trimmed = rawValue.trim().toLowerCase();
        // Disallow javascript:, data:, vbscript:
        if (
          trimmed.startsWith("javascript:") ||
          trimmed.startsWith("data:") ||
          trimmed.startsWith("vbscript:")
        ) {
          continue;
        }
        // Only allow safe protocols or relative paths
        if (
          !trimmed.startsWith("http://") &&
          !trimmed.startsWith("https://") &&
          !trimmed.startsWith("mailto:") &&
          !trimmed.startsWith("tel:") &&
          !trimmed.startsWith("/") &&
          !trimmed.startsWith("#")
        ) {
          continue;
        }

        // For external HTTP/HTTPS links, ensure safe rel attribute
        if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
          safeAttrs.push('rel="noopener noreferrer"');
        }
      }

      // For target="_blank", ensure rel="noopener noreferrer"
      if (attrName === "target" && rawValue === "_blank") {
        safeAttrs.push('target="_blank"');
        if (!safeAttrs.includes('rel="noopener noreferrer"')) {
          safeAttrs.push('rel="noopener noreferrer"');
        }
        continue;
      }

      if (attrName === "rel") {
        // preserve rel
        safeAttrs.push('rel="noopener noreferrer"');
        continue;
      }

      safeAttrs.push(`${attrName}="${escapeHtmlAttr(rawValue)}"`);
    }

    const selfClosing = match.endsWith("/>") ? " />" : ">";
    return `<${lowerTag}${safeAttrs.length > 0 ? " " + safeAttrs.join(" ") : ""}${selfClosing}`;
  });

  return sanitized;
}

function escapeHtmlAttr(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * Validates social media URLs (only valid HTTPS or HTTP allowed)
 */
export function isValidSocialUrl(url: string, platform?: "instagram" | "facebook"): boolean {
  if (!url || typeof url !== "string") return false;
  const trimmed = url.trim();
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "https:") return false;
    if (platform === "instagram") {
      return parsed.hostname.includes("instagram.com");
    }
    if (platform === "facebook") {
      return parsed.hostname.includes("facebook.com") || parsed.hostname.includes("fb.com");
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Normalizes and generates a safe WhatsApp Click-to-Chat URL
 */
export function generateWhatsAppLink(phone: string, defaultMessage?: string): string {
  if (!phone || typeof phone !== "string") return "";
  // Strip non-digits
  const cleanDigits = phone.replace(/[^0-9]/g, "");
  if (cleanDigits.length < 10) return "";

  // If 10 digits (India domestic), prepend country code 91
  const fullNumber = cleanDigits.length === 10 ? `91${cleanDigits}` : cleanDigits;

  let url = `https://wa.me/${fullNumber}`;
  if (defaultMessage && defaultMessage.trim()) {
    url += `?text=${encodeURIComponent(defaultMessage.trim())}`;
  }
  return url;
}
