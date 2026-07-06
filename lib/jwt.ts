import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET ?? 'change-me';
const ACCESS_EXPIRES = process.env.JWT_ACCESS_EXPIRES_IN ?? '15m';
const REFRESH_EXPIRES = process.env.JWT_REFRESH_EXPIRES_IN ?? '7d';

const signOptions = {
  expiresIn: ACCESS_EXPIRES as jwt.SignOptions['expiresIn']
};

const refreshSignOptions = {
  expiresIn: REFRESH_EXPIRES as jwt.SignOptions['expiresIn']
};

export function signAccessToken(payload: object) {
  return jwt.sign(payload, JWT_SECRET as jwt.Secret, signOptions);
}

export function signRefreshToken(payload: object) {
  return jwt.sign(payload, JWT_SECRET as jwt.Secret, refreshSignOptions);
}

export function verifyToken<T extends object>(token: string): T {
  return jwt.verify(token, JWT_SECRET as jwt.Secret) as T;
}
