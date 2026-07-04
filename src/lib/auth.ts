import bcrypt from "bcryptjs";

const JWT_SECRET =
  process.env.JWT_SECRET || "dev-secret-change-in-production-min-32-chars!!";

export const AUTH_COOKIE = "cdc_session";

export interface SessionPayload {
  userId: string;
  email: string;
  role: string;
}

/** Hash password bằng bcrypt */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

/** Verify password */
export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/** Tạo JWT session token */
export async function createSessionToken(
  payload: SessionPayload,
): Promise<string> {
  // jose import động để tránh load ở client
  const { SignJWT } = await import("jose");
  const secret = new TextEncoder().encode(JWT_SECRET);
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

/** Verify JWT session token */
export async function verifySessionToken(
  token: string,
): Promise<SessionPayload | null> {
  try {
    const { jwtVerify } = await import("jose");
    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}
