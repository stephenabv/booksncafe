/**
 * Renders schema.org JSON-LD. `<` is escaped so stored text can never close
 * the script element (prevents XSS through admin-entered content).
 */
export function JsonLd({ data }: { data: Record<string, unknown> | null | undefined }) {
  if (!data) return null;
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
