import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { pool } from '../db';

const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET || 'flowrex-dev-secret-change-in-production';
const JWT_EXPIRY = '7d'; // Token expires in 7 days

export interface UserPayload {
  id: string;
  email: string;
}

/**
 * Register a new user with email and password
 */
export async function registerUser(email: string, password: string): Promise<UserPayload> {
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error('Invalid email format');
  }

  // Validate password strength (minimum 8 characters)
  if (password.length < 8) {
    throw new Error('Password must be at least 8 characters');
  }

  // Check if user already exists
  const existingUser = await pool.query(
    'SELECT id FROM users WHERE email = $1',
    [email.toLowerCase()]
  );

  if (existingUser.rows.length > 0) {
    throw new Error('User already exists');
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  // Insert new user
  const result = await pool.query(
    'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email',
    [email.toLowerCase(), passwordHash]
  );

  return {
    id: result.rows[0].id,
    email: result.rows[0].email,
  };
}

/**
 * Login user with email and password, returns JWT token
 */
export async function loginUser(email: string, password: string): Promise<string> {
  // Find user by email
  const result = await pool.query(
    'SELECT id, email, password_hash FROM users WHERE email = $1',
    [email.toLowerCase()]
  );

  if (result.rows.length === 0) {
    throw new Error('Invalid credentials');
  }

  const user = result.rows[0];

  // Verify password
  const isValid = await bcrypt.compare(password, user.password_hash);
  if (!isValid) {
    throw new Error('Invalid credentials');
  }

  // Generate JWT token
  const token = jwt.sign(
    { id: user.id, email: user.email } as UserPayload,
    JWT_SECRET,
    { expiresIn: JWT_EXPIRY }
  );

  return token;
}

/**
 * Verify JWT token and return user payload
 */
export function verifyToken(token: string): UserPayload {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as UserPayload;
    return payload;
  } catch (err) {
    throw new Error('Invalid or expired token');
  }
}
