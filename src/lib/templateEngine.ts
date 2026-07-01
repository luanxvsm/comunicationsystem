// src/lib/templateEngine.ts

/**
 * Substitui {{variavel}} no template por valores reais do objeto variables.
 * Variáveis não encontradas são mantidas como estão (ex: {{nome}} permanece).
 *
 * @example
 * renderTemplate("Olá, {{nome}}! Protocolo: {{protocolo}}.", { nome: "João", protocolo: "2024-001" })
 * // → "Olá, João! Protocolo: 2024-001."
 */
export function renderTemplate(
  template: string,
  variables: Record<string, string>
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    return variables[key] ?? `{{${key}}}`;
  });
}
