import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// Helper to get __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Load a JSON file dynamically
 * @param {string} relPath - Relative path from this file
 * @returns {Promise<any>}
 */
export async function loadJson(relPath) {
    const fullPath = path.join(__dirname, relPath);
    const content = await fs.readFile(fullPath, 'utf8');
    return JSON.parse(content);
}