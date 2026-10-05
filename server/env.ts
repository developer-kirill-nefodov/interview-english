// Loads .env from the project root (ANTHROPIC_API_KEY, PORT, HOST), if the file exists.
// Variables already set in the shell win.
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const file = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", ".env");
if (existsSync(file)) process.loadEnvFile(file);
