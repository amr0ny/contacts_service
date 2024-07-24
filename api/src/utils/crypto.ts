import * as crypto from 'crypto';

// Function to compute SHA256 hash of a string
export function sha256(input: string): string {
  return crypto.createHash('sha256').update(input).digest('hex');
}

// Function to convert string to UTF-8 encoded buffer
export function stringToUtf8(input: string): Buffer {
  return Buffer.from(input, 'utf8');
}

// Function to convert UTF-8 encoded buffer back to string
export function utf8ToString(buffer: Buffer): string {
  return buffer.toString('utf8');
}

// Function to compute SHA256 hash of UTF-8 encoded string
export function sha256Utf8(input: string): string {
  const utf8Buffer = stringToUtf8(input);
  return crypto.createHash('sha256').update(utf8Buffer).digest('hex');
}

