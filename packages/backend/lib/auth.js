import { SignJWT } from 'jose';

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'vmdhub-jwt-secret-change-me'
);

export async function signToken(payload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(SECRET);
}
