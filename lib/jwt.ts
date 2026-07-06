export function signAccessToken(_payload: object): never {
  throw new Error('JWT signing has moved to the Java backend. Frontend code must call /api/v1/auth instead.');
}

export function signRefreshToken(_payload: object): never {
  throw new Error('JWT signing has moved to the Java backend. Frontend code must call /api/v1/auth instead.');
}

export function verifyToken<T extends object>(_token: string): T {
  throw new Error('JWT verification has moved to the Java backend. Frontend code must call /api/v1/auth instead.');
}
