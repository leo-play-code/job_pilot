import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  // TODO: validate body, hash password, create user
  return NextResponse.json({ data: null }, { status: 501 })
}
