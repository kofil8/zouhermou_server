import jwt, { Secret, SignOptions } from 'jsonwebtoken';

export const generateTokenReset = (
  payload: { id: string; email: string; isVerified: boolean },
  secret: Secret,
  expiresIn: string,
) => {
  const token = jwt.sign(payload, secret, <SignOptions>{
    algorithm: 'HS256',
    expiresIn: expiresIn,
  });
  return token;
};
