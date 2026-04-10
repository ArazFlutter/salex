import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';

export const projectRootEnvPath = path.resolve(__dirname, '..', '..', '.env');

const envFileExists = fs.existsSync(projectRootEnvPath);
const dotenvResult = dotenv.config({ path: projectRootEnvPath, quiet: true, override: true });

if (dotenvResult.error && envFileExists) {
  throw new Error(`Failed to load environment variables from ${projectRootEnvPath}: ${dotenvResult.error.message}`);
}

function getRequiredEnv(name: string): string {
  const value = process.env[name]?.trim();

  if (value) {
    return value;
  }

  const missingFileMessage = envFileExists
    ? `The file exists, but ${name} is not set.`
    : 'The file does not exist yet.';

  throw new Error(
    [
      `${name} is required for the backend.`,
      `Create or update the project-root .env file at: ${projectRootEnvPath}.`,
      missingFileMessage,
      'Expected local value:',
      'DATABASE_URL=postgres://postgres:postgres@localhost:5432/salex',
    ].join(' '),
  );
}

export const DATABASE_URL = getRequiredEnv('DATABASE_URL');
