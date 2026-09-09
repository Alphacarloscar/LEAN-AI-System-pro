// ============================================================
// Audit Masking — Funciones de enmascaramiento RGPD
//
// Puras, sin side effects, reutilizables en cliente (TypeScript)
// y en la Edge Function log-audit-event (Deno TypeScript).
// Mantener sincronizadas las versiones cliente/servidor.
//
// Reglas de enmascaramiento:
//   email:   últimos 3 chars antes del @, si es más corto que 3 usa lo que haya
//   name:    primera letra + asteriscos del mismo largo que el resto
//   phone:   asteriscos + últimos 4 dígitos
//   ip:      IPv4: último octeto a 0 | IPv6: últimos 16 bits a 0000
//   address: solo ciudad/provincia, eliminar calle y número
//
// Ejemplos:
//   maskEmail("carlos@consultoria.com") → "***los@consultoria.com"
//   maskName("Carlos") → "C*****"
//   maskPhone("+34612345678") → "********5678"
//   maskIp("192.168.1.42") → "192.168.1.0"
// ============================================================

/**
 * Enmascara un email manteniendo dominio pero ocultando usuario.
 * Devuelve últimos 3 caracteres antes del @ seguido del dominio.
 * Si el email es más corto, devuelve asteriscos + lo que hay.
 */
export function maskEmail(email: string): string {
  if (!email || typeof email !== 'string') return email
  const [user, domain] = email.split('@')
  if (!user || !domain) return email // No es email válido, retornar como-está
  const visibleChars = Math.min(3, user.length)
  const hiddenCount = Math.max(0, user.length - visibleChars)
  const asterisks = '*'.repeat(hiddenCount)
  const visibleUser = user.slice(-visibleChars)
  return `${asterisks}${visibleUser}@${domain}`
}

/**
 * Enmascara un nombre mostrando solo la primera letra.
 * Resultado: "C*****" para "Carlos" (primera letra + asteriscos del mismo largo que el resto).
 */
export function maskName(name: string): string {
  if (!name || typeof name !== 'string' || name.length === 0) return name
  if (name.length === 1) return name // Retornar como-está si es 1 char
  return name[0] + '*'.repeat(name.length - 1)
}

/**
 * Enmascara un número de teléfono mostrando solo últimos 4 dígitos.
 * Extrae solo los dígitos y retorna asteriscos + últimos 4.
 */
export function maskPhone(phone: string): string {
  if (!phone || typeof phone !== 'string') return phone
  const digits = phone.replace(/\D/g, '') // Extrae solo dígitos
  if (digits.length < 4) return '*'.repeat(digits.length) // Demasiado corto
  const asterisks = '*'.repeat(Math.max(0, digits.length - 4))
  const visible = digits.slice(-4)
  return asterisks + visible
}

/**
 * Enmascara una dirección IP.
 * IPv4: reemplaza último octeto con 0
 * IPv6: reemplaza últimos 16 bits (4 caracteres hex) con 0000
 * Otros: retorna como-está
 */
export function maskIp(ip: string): string {
  if (!ip || typeof ip !== 'string') return ip

  // IPv4: xxx.xxx.xxx.0
  if (ip.includes('.') && !ip.includes(':')) {
    const parts = ip.split('.')
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.${parts[2]}.0`
    }
  }

  // IPv6: reemplazar últimos 4 caracteres hex con 0000
  // Simplificación: si contiene ":" y tiene forma de IPv6, reemplazar últimos 4 chars
  if (ip.includes(':')) {
    // IPv6 comprimida o full: buscar el último ":" y reemplazar lo que sigue
    const lastColonIndex = ip.lastIndexOf(':')
    if (lastColonIndex !== -1) {
      const prefix = ip.substring(0, lastColonIndex + 1)
      return `${prefix}0000`
    }
  }

  return ip // Formato no reconocido, retornar como-está
}

/**
 * Enmascara una dirección postal manteniendo solo ciudad/provincia.
 * Implementación simplificada: retorna la dirección como-está.
 * En uso real, requeriría parseo de formato específico de país.
 * Por ahora se deja como placeholder — no hay campos `address` en el esquema actual.
 */
export function maskAddress(address: string): string {
  if (!address || typeof address !== 'string') return address
  // TODO: parsear ciudad/provincia si el formato es conocido
  // Por ahora, dejar el address como-está (no hay en el esquema actual de GOBY)
  return address
}

/**
 * Aplica todas las máscaras a un objeto de forma recursiva.
 * Mapeo de campos conocidos a sus funciones de máscara.
 * NO se usa directamente en el código; es para referencia.
 * El Proxy en makeAuditable.ts tiene su propia lógica de aplicación.
 */
export const PII_FIELD_MASKS = {
  email: maskEmail,
  name: maskName,
  phone: maskPhone,
  ip: maskIp,
  address: maskAddress,
} as const satisfies Record<string, (val: string) => string>
