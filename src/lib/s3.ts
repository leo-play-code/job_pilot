import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'

const s3 = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

const BUCKET = process.env.AWS_S3_BUCKET!
const CDN_BASE = process.env.AWS_CLOUDFRONT_URL
  ?? `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com`

export type S3AssetType = 'template-thumbnail' | 'template-reference' | 'resume-pdf'

export function getS3Key(type: S3AssetType, id: string): string {
  const prefixes: Record<S3AssetType, string> = {
    'template-thumbnail': 'templates/thumbnails',
    'template-reference': 'templates/references',
    'resume-pdf': 'resumes/pdfs',
  }
  const ext = type === 'resume-pdf' ? 'pdf' : type === 'template-thumbnail' ? 'png' : 'pdf'
  return `${prefixes[type]}/${id}.${ext}`
}

export function getS3Url(key: string): string {
  return `${CDN_BASE}/${key}`
}

export async function uploadToS3(
  key: string,
  body: Buffer,
  contentType: string,
): Promise<string> {
  await s3.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: body,
    ContentType: contentType,
  }))
  return getS3Url(key)
}

export async function deleteFromS3(key: string): Promise<void> {
  await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }))
}
