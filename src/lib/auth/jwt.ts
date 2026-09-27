import 'server-only';
import { SignJWT, jwtVerify, type JWTPayload } from 'jose';

function secretKey(secret: string) {
  if (!secret || secret.length < 16) {
    throw new Error('Session secret is missing or too short. Check your environment variables.');
  }
  return new TextEncoder().encode(secret);
}

export async function signToken(
  payload: JWTPayload,
  secret: string,
  expiresIn: string
): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(secretKey(secret));
}

export async function verifyToken<T extends JWTPayload>(
  token: string,
  secret: string
): Promise<T | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey(secret));
    return payload as T;
  } catch {
    return null;
  }
}
