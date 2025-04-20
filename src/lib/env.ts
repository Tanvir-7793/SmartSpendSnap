import dotenv from 'dotenv';
import fs from 'fs-extra';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

// Ensure the uploads directory exists
export const ensureUploadsDir = async () => {
  const uploadsDir = path.join(process.cwd(), 'uploads');
  await fs.ensureDir(uploadsDir);
  return uploadsDir;
};

// Get environment variable with type checking
export const getEnv = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing environment variable: ${key}`);
  }
  return value;
};

// Get Vite environment variable
export const getViteEnv = (key: string): string => {
  const value = import.meta.env[key];
  if (!value) {
    throw new Error(`Missing Vite environment variable: ${key}`);
  }
  return value;
}; 