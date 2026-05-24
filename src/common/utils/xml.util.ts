/** Escapa caracteres especiais para conteúdo XML. */
function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function buildNodes(obj: Record<string, unknown>): string {
  return Object.entries(obj)
    .map(([key, value]) => {
      if (value === null || value === undefined) {
        return `<${key}/>`;
      }
      if (value instanceof Date) {
        return `<${key}>${value.toISOString()}</${key}>`;
      }
      if (typeof value === 'object') {
        return `<${key}>${buildNodes(value as Record<string, unknown>)}</${key}>`;
      }
      return `<${key}>${escapeXml(String(value))}</${key}>`;
    })
    .join('');
}

/**
 * Serializa um objeto em XML simples. Usado para entregar respostas em XML,
 * demonstrando a adoção do padrão XML além de JSON (REST/JSON/XML).
 */
export function objectToXml(rootName: string, obj: Record<string, unknown>): string {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<${rootName}>${buildNodes(obj)}</${rootName}>`;
}
