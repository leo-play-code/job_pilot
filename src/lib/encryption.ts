import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

const ALGORITHM = 'aes-256-gcm'

function getKey(): Buffer {
  const hex = process.env.CREDENTIAL_ENCRYPTION_KEY
  if (!hex || hex.length !== 64) {
    throw new Error('CREDENTIAL_ENCRYPTION_KEY must be a 64-character hex string')
  }
  return Buffer.from(hex, 'hex')
}

export interface EncryptedPayload {
  ciphertext: string
  iv: string
  authTag: string
}

export function encrypt(plaintext: string): EncryptedPayload {
  const key = getKey()
  const iv = randomBytes(12)
  const cipher = createCipheriv(ALGORITHM, key, iv)
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  return {
    ciphertext: encrypted.toString('base64'),
    iv: iv.toString('base64'),
    authTag: cipher.getAuthTag().toString('base64'),
  }
}

export function decrypt(payload: EncryptedPayload): string {
  const key = getKey()
  const decipher = createDecipheriv(
    ALGORITHM,
    key,
    Buffer.from(payload.iv, 'base64'),
  )
  decipher.setAuthTag(Buffer.from(payload.authTag, 'base64'))
  return Buffer.concat([
    decipher.update(Buffer.from(payload.ciphertext, 'base64')),
    decipher.final(),
  ]).toString('utf8')
}

// Pack encrypted payload into a single storable string: "ciphertext|iv|authTag"
export function packEncrypted(plaintext: string): string {
  const { ciphertext, iv, authTag } = encrypt(plaintext)
  return `${ciphertext}|${iv}|${authTag}`
}

// Unpack and decrypt a packed string
export function unpackDecrypt(packed: string): string {
  const [ciphertext, iv, authTag] = packed.split('|')
  return decrypt({ ciphertext, iv, authTag })
}
