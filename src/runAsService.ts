/** @format */

import { spawn } from 'child_process';

// Run the server script
const server = spawn('bun', ['src/server.ts'], {
  stdio: 'inherit',
  shell: true,
  detached: true,
});
console.log("running")
