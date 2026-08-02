// src/utils/tripCode.js
// Generates a short, human-friendly 6-character trip code for join requests.
// Avoids visually ambiguous characters (0/O, 1/I) to reduce entry errors.
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

export function generateTripCode(length = 6) {
  let code = ''
  for (let i = 0; i < length; i++) {
    code += ALPHABET[Math.floor(Math.random() * ALPHABET.length)]
  }
  return code
}
