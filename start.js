import { spawn } from 'child_process';

const vite = spawn('npx', ['vite', '--host', '0.0.0.0', '--port', '5000'], {
  stdio: 'inherit',
  shell: false
});

vite.on('error', (err) => {
  console.error('Failed to start Vite:', err);
});

process.on('SIGINT', () => {
  vite.kill();
  process.exit();
});
