export type PasswordChecks = {
  length: boolean
  lowercase: boolean
  uppercase: boolean
  digit: boolean
  symbol: boolean
}

export function getPasswordChecks(password: string): PasswordChecks {
  return {
    length: password.length >= 8,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    digit: /[0-9]/.test(password),
    symbol: /[^A-Za-z0-9]/.test(password),
  }
}

export function isPasswordStrong(password: string): boolean {
  const c = getPasswordChecks(password)
  return c.length && c.lowercase && c.uppercase && c.digit && c.symbol
}
