import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { randomUUID } from "crypto";
import config from "../config/env.js";

export const hashPassword = (plain) => bcrypt.hash(plain, 12);
export const verifyPassword = (plain, hashed) => bcrypt.compare(plain, hashed);

export const newSessionId = () => randomUUID();

export const signToken = ({ id, role, sessionId, name, email }) =>
  jwt.sign({ sub: id, role, sessionId, name, email }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn
  });

export const verifyToken = (token) => jwt.verify(token, config.jwtSecret);
