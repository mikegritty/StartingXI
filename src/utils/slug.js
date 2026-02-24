// URL-safe chars with visually unambiguous characters (no 0/O, 1/l/I)
const CHARS = 'abcdefghjkmnpqrstuvwxyz23456789'

export function generateSlug(length = 7) {
  return Array.from(
    { length },
    () => CHARS[Math.floor(Math.random() * CHARS.length)]
  ).join('')
}
