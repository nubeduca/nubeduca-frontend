const ULID_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'

function encode(value: number, length: number): string {
  let remaining = Math.max(1, Math.floor(value))
  let output = ''

  for (let index = 0; index < length; index += 1) {
    output = ULID_ALPHABET[remaining % ULID_ALPHABET.length] + output
    remaining = Math.floor(remaining / ULID_ALPHABET.length)
  }

  return output
}

export function mockId(prefix: string, value: number): string {
  return `${prefix}_${encode(value, 26)}`
}

export function mockUuid(value: number): string {
  return `10000000-0000-4000-8000-${value.toString(16).padStart(12, '0')}`
}
