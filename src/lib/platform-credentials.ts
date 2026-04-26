import { prisma } from '@/lib/prisma'
import { unpackDecrypt } from '@/lib/encryption'

export async function getDecryptedCredentials(
  userId: string,
): Promise<{ email: string; password: string } | null> {
  const cred = await prisma.userPlatformCredential.findUnique({
    where: { userId_platform: { userId, platform: 'JOB_104' } },
  })
  if (!cred) return null

  return {
    email: unpackDecrypt(cred.encryptedEmail),
    password: unpackDecrypt(cred.encryptedPassword),
  }
}
