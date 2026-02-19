# Authentication

This guide covers RaineStack's authentication system, including JWT tokens, OTP (one-time passwords), OIDC providers (Google/GitHub), WebAuthn passkeys, and session management.

---

## Table of Contents

- [Overview](#overview)
- [Authentication Methods](#authentication-methods)
- [JWT Tokens](#jwt-tokens)
- [OTP (Email Authentication)](#otp-email-authentication)
- [OIDC Providers](#oidc-providers)
- [WebAuthn Passkeys](#webauthn-passkeys)
- [Session Management](#session-management)
- [Authorization](#authorization)
- [Best Practices](#best-practices)

---

## Overview

RaineStack provides a complete authentication stack with multiple authentication methods:

| Method | Use Case | Security Level |
|--------|----------|----------------|
| **OTP** | Passwordless email login | Medium |
| **OIDC** | Social login (Google, GitHub) | High |
| **WebAuthn** | Hardware-backed passkeys | Very High |
| **JWT** | API authentication | High |

### Authentication Flow

```
1. User initiates authentication (OTP, OIDC, or passkey)
2. Backend validates credentials
3. Backend generates JWT access token (15 min) + refresh token (30 days)
4. Client stores tokens (access token in memory, refresh in localStorage)
5. Client includes access token in Authorization header
6. Backend verifies JWT on protected routes
7. Client refreshes access token when it expires
```

---

## Authentication Methods

### Quick Comparison

| Feature | OTP | OIDC | WebAuthn |
|---------|-----|------|----------|
| **Setup** | Email only | OAuth consent | Device registration |
| **Login Speed** | Medium (email delay) | Fast | Very fast |
| **Security** | Medium | High | Very high |
| **User Experience** | Good | Excellent | Excellent |
| **Offline Support** | No | No | Yes (after setup) |
| **Cross-Device** | Yes | Yes | Limited |

---

## JWT Tokens

### Token Structure

RaineStack uses **HS256** (HMAC-SHA256) signed JWTs:

```typescript
interface JWTPayload {
  sub: string;      // User ID
  email: string;    // User email
  iat: number;      // Issued at (Unix timestamp)
  exp: number;      // Expires at (Unix timestamp)
}
```

### Access Tokens

**Lifetime:** 15 minutes

**Purpose:** API authentication

**Storage:** Memory only (never localStorage)

**Header format:**
```
Authorization: Bearer <access_token>
```

### Refresh Tokens

**Lifetime:** 30 days

**Purpose:** Renew access tokens

**Storage:** Database + localStorage

**Rotation:** New refresh token issued on each refresh

### Token Generation

```typescript
// packages/server/src/lib/jwt.ts
import { SignJWT } from 'jose';

export async function generateAccessToken(user: User): Promise<string> {
  const secret = new TextEncoder().encode(env.JWT_SECRET);
  
  return new SignJWT({
    sub: user.id,
    email: user.email
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('15m')
    .sign(secret);
}

export async function generateRefreshToken(userId: string): Promise<string> {
  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
  
  await db.refreshToken.create({
    data: {
      token,
      userId,
      expiresAt
    }
  });
  
  return token;
}
```

### Token Verification

```typescript
import { jwtVerify } from 'jose';

export async function verifyAccessToken(token: string): Promise<JWTPayload> {
  const secret = new TextEncoder().encode(env.JWT_SECRET);
  
  const { payload } = await jwtVerify(token, secret, {
    algorithms: ['HS256']
  });
  
  return payload as JWTPayload;
}
```

### Client-Side Token Management

```typescript
// packages/api/src/storage.ts
export const tokenStorage = {
  getAccessToken(): string | null {
    return sessionStorage.getItem('access_token');
  },
  
  setAccessToken(token: string): void {
    sessionStorage.setItem('access_token', token);
  },
  
  getRefreshToken(): string | null {
    return localStorage.getItem('refresh_token');
  },
  
  setRefreshToken(token: string): void {
    localStorage.setItem('refresh_token', token);
  },
  
  clear(): void {
    sessionStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }
};
```

---

## OTP (Email Authentication)

### How It Works

1. User enters email
2. Backend generates 6-digit code
3. Backend sends email with code
4. User enters code
5. Backend verifies code
6. Backend returns JWT tokens

### Generating OTP

```typescript
// packages/server/src/data/otp.ts
export async function createOtpCode(
  db: Db,
  email: string
): Promise<string> {
  // Generate 6-digit code
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  
  // Expires in 10 minutes
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  
  await db.otpCode.create({
    data: {
      email,
      code,
      expiresAt
    }
  });
  
  return code;
}
```

### Verifying OTP

```typescript
export async function verifyOtpCode(
  db: Db,
  email: string,
  code: string
): Promise<boolean> {
  const otpCode = await db.otpCode.findFirst({
    where: {
      email,
      code,
      expiresAt: { gte: new Date() }
    }
  });
  
  if (!otpCode) return false;
  
  // Delete used code
  await db.otpCode.delete({ where: { id: otpCode.id } });
  
  return true;
}
```

### API Endpoints

**Request OTP:**
```typescript
POST /api/auth/otp/request
{
  "email": "user@example.com"
}
```

**Verify OTP:**
```typescript
POST /api/auth/otp/verify
{
  "email": "user@example.com",
  "code": "123456"
}

Response:
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "550e8400-e29b-41d4-a716-446655440000"
}
```

---

## OIDC Providers

### Supported Providers

- **Google** — OpenID Connect
- **GitHub** — OAuth 2.0

### Configuration

```env
# Google
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret

# GitHub
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
```

### Authorization Flow

```
1. User clicks "Sign in with Google"
2. Frontend redirects to /api/auth/google
3. Backend redirects to Google OAuth consent screen
4. User grants permission
5. Google redirects back to /api/auth/google/callback?code=...
6. Backend exchanges code for tokens
7. Backend fetches user profile
8. Backend creates/links account
9. Backend generates JWT tokens
10. Backend redirects to frontend with tokens
```

### Google Authentication

```typescript
// packages/server/src/routes/auth.ts
export const googleAuth = publicProcedure
  .handler(async ({ context }) => {
    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', env.GOOGLE_CLIENT_ID);
    authUrl.searchParams.set('redirect_uri', `${env.APP_URL}/api/auth/google/callback`);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', 'openid email profile');
    
    return { url: authUrl.toString() };
  });

export const googleCallback = publicProcedure
  .input(z.object({ code: z.string() }))
  .handler(async ({ input, context }) => {
    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      body: JSON.stringify({
        code: input.code,
        client_id: env.GOOGLE_CLIENT_ID,
        client_secret: env.GOOGLE_CLIENT_SECRET,
        redirect_uri: `${env.APP_URL}/api/auth/google/callback`,
        grant_type: 'authorization_code'
      })
    });
    
    const { id_token } = await tokenResponse.json();
    
    // Decode and verify ID token (contains user info)
    const userInfo = await verifyGoogleIdToken(id_token);
    
    // Create or get user
    let user = await usersData.findByEmail(context.db, userInfo.email);
    if (!user) {
      user = await usersData.create(context.db, null, {
        email: userInfo.email,
        name: userInfo.name,
        avatar: userInfo.picture
      });
    }
    
    // Create or link account
    const account = await accountsData.findByProvider(
      context.db,
      'google',
      userInfo.sub
    );
    
    if (!account) {
      await accountsData.create(context.db, null, {
        userId: user.id,
        provider: 'google',
        providerId: userInfo.sub
      });
    }
    
    // Generate tokens
    const accessToken = await generateAccessToken(user);
    const refreshToken = await generateRefreshToken(user.id);
    
    return { accessToken, refreshToken };
  });
```

### GitHub Authentication

Similar to Google but uses GitHub's OAuth 2.0 endpoints:

- Authorization: `https://github.com/login/oauth/authorize`
- Token: `https://github.com/login/oauth/access_token`
- User API: `https://api.github.com/user`

---

## WebAuthn Passkeys

### Overview

WebAuthn provides **hardware-backed authentication** using:
- **Biometrics** — Face ID, Touch ID, fingerprint
- **Security keys** — YubiKey, Titan Key
- **Platform authenticators** — Built into devices

### Registration Flow

```
1. User initiates passkey registration
2. Backend generates challenge
3. Frontend calls navigator.credentials.create()
4. User authenticates with device (biometric/PIN)
5. Frontend sends credential back to backend
6. Backend verifies and stores credential
```

### Registration (Backend)

```typescript
import { generateRegistrationOptions, verifyRegistrationResponse } from '@simplewebauthn/server';

export const passkeyRegisterOptions = authedProcedure
  .handler(async ({ context }) => {
    const options = await generateRegistrationOptions({
      rpName: env.RP_NAME,
      rpID: env.RP_ID,
      userID: context.user.id,
      userName: context.user.email,
      attestationType: 'none',
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'preferred'
      }
    });
    
    // Store challenge (expires in 5 minutes)
    await db.passkeyChallenge.create({
      data: {
        userId: context.user.id,
        challenge: options.challenge,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000)
      }
    });
    
    return options;
  });

export const passkeyRegisterVerify = authedProcedure
  .input(RegistrationResponseSchema)
  .handler(async ({ input, context }) => {
    const challenge = await db.passkeyChallenge.findFirst({
      where: {
        userId: context.user.id,
        expiresAt: { gte: new Date() }
      }
    });
    
    if (!challenge) {
      throw new ORPCError('BAD_REQUEST', { message: 'Challenge expired' });
    }
    
    const verification = await verifyRegistrationResponse({
      response: input,
      expectedChallenge: challenge.challenge,
      expectedOrigin: env.RP_ORIGIN,
      expectedRPID: env.RP_ID
    });
    
    if (!verification.verified) {
      throw new ORPCError('BAD_REQUEST', { message: 'Verification failed' });
    }
    
    // Store credential
    await passkeysData.create(context.db, context.actorId, {
      userId: context.user.id,
      credentialId: verification.registrationInfo!.credentialID,
      publicKey: verification.registrationInfo!.credentialPublicKey,
      counter: verification.registrationInfo!.counter
    });
    
    // Delete challenge
    await db.passkeyChallenge.delete({ where: { id: challenge.id } });
    
    return { verified: true };
  });
```

### Authentication Flow

```
1. User clicks "Sign in with passkey"
2. Backend generates challenge
3. Frontend calls navigator.credentials.get()
4. User authenticates with device
5. Frontend sends assertion to backend
6. Backend verifies signature
7. Backend returns JWT tokens
```

---

## Session Management

### Refresh Token Rotation

```typescript
export const refresh = publicProcedure
  .input(z.object({ refreshToken: z.string() }))
  .handler(async ({ input, context }) => {
    // Find refresh token
    const token = await db.refreshToken.findUnique({
      where: { token: input.refreshToken },
      include: { user: true }
    });
    
    if (!token || token.expiresAt < new Date()) {
      throw new ORPCError('UNAUTHORIZED', { message: 'Invalid refresh token' });
    }
    
    // Delete old token
    await db.refreshToken.delete({ where: { id: token.id } });
    
    // Generate new tokens
    const accessToken = await generateAccessToken(token.user);
    const refreshToken = await generateRefreshToken(token.user.id);
    
    return { accessToken, refreshToken };
  });
```

### Logout

```typescript
export const logout = authedProcedure
  .input(z.object({ refreshToken: z.string() }))
  .handler(async ({ input, context }) => {
    // Delete refresh token
    await db.refreshToken.deleteMany({
      where: {
        token: input.refreshToken,
        userId: context.user.id
      }
    });
    
    return { success: true };
  });
```

### Logout All Devices

```typescript
export const logoutAll = authedProcedure
  .handler(async ({ context }) => {
    // Delete all refresh tokens for user
    await db.refreshToken.deleteMany({
      where: { userId: context.user.id }
    });
    
    return { success: true };
  });
```

---

## Authorization

### Public Routes

Use `publicProcedure` for unauthenticated endpoints:

```typescript
export const list = publicProcedure
  .output(z.array(PostSchema))
  .handler(async ({ context }) => {
    // Anyone can view posts
    return postsData.findMany(context.db);
  });
```

### Authenticated Routes

Use `authedProcedure` for protected endpoints:

```typescript
export const create = authedProcedure
  .input(CreatePostInput)
  .output(PostSchema)
  .handler(async ({ input, context }) => {
    // context.user is guaranteed non-null
    return postsData.create(context.db, context.actorId, input);
  });
```

### Role-Based Authorization

```typescript
export const deleteUser = authedProcedure
  .input(z.object({ id: z.string() }))
  .handler(async ({ input, context }) => {
    // Check if user is admin
    if (context.user.role !== 'ADMIN') {
      throw new ORPCError('FORBIDDEN', {
        message: 'Only admins can delete users'
      });
    }
    
    return usersData.remove(context.db, context.actorId, input.id);
  });
```

### Resource Ownership

```typescript
export const updatePost = authedProcedure
  .input(UpdatePostInput)
  .handler(async ({ input, context }) => {
    const post = await postsData.findById(context.db, input.id);
    
    if (!post) {
      throw new ORPCError('NOT_FOUND', { message: 'Post not found' });
    }
    
    // Check ownership
    if (post.userId !== context.user.id) {
      throw new ORPCError('FORBIDDEN', {
        message: 'You can only edit your own posts'
      });
    }
    
    return postsData.update(context.db, context.actorId, input.id, input);
  });
```

---

## Best Practices

### 1. Never Store Sensitive Data in JWT

```typescript
// ✅ Good — minimal payload
{
  sub: user.id,
  email: user.email
}

// ❌ Bad — sensitive data in token
{
  sub: user.id,
  email: user.email,
  password: user.password,  // Never!
  ssn: user.ssn             // Never!
}
```

### 2. Use Short-Lived Access Tokens

```typescript
// ✅ Good — 15 minutes
.setExpirationTime('15m')

// ❌ Bad — too long
.setExpirationTime('30d')
```

### 3. Rotate Refresh Tokens

```typescript
// ✅ Good — delete old, create new
await db.refreshToken.delete({ where: { id: oldToken.id } });
const newToken = await generateRefreshToken(user.id);

// ❌ Bad — reuse same token
return { refreshToken: input.refreshToken };
```

### 4. Validate Origins for WebAuthn

```typescript
// ✅ Good — validate origin
expectedOrigin: env.RP_ORIGIN,
expectedRPID: env.RP_ID

// ❌ Bad — accept any origin
expectedOrigin: '*'
```

### 5. Rate Limit Authentication Endpoints

```typescript
// Limit OTP requests to 5 per hour per email
// Limit login attempts to 10 per hour per IP
// Implement exponential backoff for failed attempts
```

### 6. Clean Up Expired Records

Ephemeral authentication records are auto-purged daily via pg_cron:
- OTP codes (10 min lifetime)
- Refresh tokens (30 day lifetime)
- Passkey challenges (5 min lifetime)

### 7. Use HTTPS in Production

```typescript
// Only allow secure cookies in production
if (env.NODE_ENV === 'production') {
  response.headers.set('Set-Cookie', `token=${token}; Secure; HttpOnly; SameSite=Strict`);
}
```

---

## Summary

RaineStack's authentication system provides:

- ✅ **Multiple authentication methods** — OTP, OIDC, WebAuthn
- ✅ **JWT-based API authentication** — Short-lived access tokens
- ✅ **Secure token refresh** — Rotation and expiration
- ✅ **Audit trail** — All auth events tracked
- ✅ **Automatic cleanup** — Expired tokens purged daily

By following the patterns in this guide, you can implement secure, user-friendly authentication flows.

---

**Next Steps:**
- [API Development](./api.md) — Protect endpoints with `authedProcedure`
- [Database Guide](./database.md) — Actor-tracked transactions
- [Security Best Practices](./security.md) — Hardening your application