import { NotImplementedError } from "./errors";
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { tokenSecret, hashSalt } from './dbconfig'

// TODO(roman): implement these
// external libraries can be used
// you can even ignore them and use your own preferred method

export async function hashPassword(password: string): Promise<string> {
  // const salt = await bcrypt.genSalt(10);
  // same salt for password comparison
  const passwordHash = await bcrypt.hash(password, hashSalt);
  //console.log(passwordHash)
  return passwordHash;
}

export function generateToken(data: TokenData): string {
  let payload = { tokenData: data };
  const token = jwt.sign(payload, tokenSecret);
  return token;
}

export function isValidToken(token: string): boolean {
  let verifiedUser = jwt.verify(token, tokenSecret);
  if(!verifiedUser){
    return false;
  }
  else{
    return true;
  }
}

type TokenDataWrapper = {
  tokenData: TokenData
}

// NOTE(roman): assuming that `isValidToken` will be called before
export function extraDataFromToken(token: string): TokenData {
  const verifiedUser = jwt.verify(token, tokenSecret) as TokenDataWrapper;
  return verifiedUser.tokenData;
}

export interface TokenData {
  id: number;
}