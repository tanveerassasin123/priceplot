export function sanitizeUntrustedText(text: string): string {
  return text
    .replace(/ignore (all|any|previous|above) instructions/gi, "[redacted]")
    .replace(/system prompt/gi, "[redacted]")
    .slice(0, 4000);
}

export function wrapUntrustedListing(text: string): string {
  return `<untrusted_listing>\n${sanitizeUntrustedText(text)}\n</untrusted_listing>`;
}
