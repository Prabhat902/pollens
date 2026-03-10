import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export default function proxy(req: NextRequest) {
  const basicAuth = req.headers.get('authorization')
  const url = req.nextUrl
  
  // Get the single application password from environment
  const pwd = process.env.APP_PASSWORD

  // If no password is set, operate normally without security (failsafe)
  if (!pwd) {
    return NextResponse.next()
  }

  // Check the Basic Auth header
  if (basicAuth) {
    const authValue = basicAuth.split(' ')[1]
    // Decode base64
    const decodedValue = atob(authValue)
    const [user, pwdInput] = decodedValue.split(':')

    // Verify password (username is ignored, you can type "admin" or your name)
    if (pwdInput === pwd || user === pwd) {
      return NextResponse.next()
    }
  }

  // Reject the request and prompt the browser to ask for credentials
  // This completely blocks Postman/cURL unless they provide the Header
  return new NextResponse('Authentication required to access this application.', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Private Image & Video Generator"',
    },
  })
}

// Apply this security middleware to ALL routes except internal static Next.js assets
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
