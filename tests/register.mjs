// Lets `node --test` import the app's extensionless ESM modules
// (e.g. '../data/constants') exactly as Vite resolves them — so the
// tests need no extra dependency or build step.
import { register } from 'node:module';

register('./resolve-hook.mjs', import.meta.url);
