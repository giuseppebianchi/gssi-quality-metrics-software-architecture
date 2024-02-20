import { resolve } from "path";
import { defineConfig } from "vite";
import 'dotenv/config'

export default defineConfig({
  base: process.env.VITE_BASE_PATH
});
