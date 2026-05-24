import { NextResponse } from 'next/server'

type Role = 'employee' | 'admin' | 'executive'

const VALID_ROLES: Role[] = ['employee', 'admin', 'executive']

export async function GET(
  _request: Request,
  context: { params: Promise<{ role: string; sessionId: string }> },
) {
  const { role, sessionId } = await context.params

  if (!VALID_ROLES.includes(role as Role)) {
    return NextResponse.json(
      { error: `Invalid role "${role}". Must be one of: ${VALID_ROLES.join(', ')}` },
      { status: 400 },
    )
  }

  if (!sessionId || !sessionId.trim()) {
    return NextResponse.json({ error: 'sessionId is required' }, { status: 400 })
  }

  return NextResponse.json({ messages: [] })
}
