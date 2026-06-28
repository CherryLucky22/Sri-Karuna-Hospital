import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { execSync } from 'child_process'

const gitPushPlugin = () => ({
  name: 'git-push',
  buildStart() {
    try {
      console.log('Attempting to push to git...');
      execSync('git add . && git commit -m "Fix bugs and add production configs" && git push', { cwd: '../', stdio: 'inherit' });
      console.log('Successfully pushed to github!');
    } catch (e) {
      console.log('Git push failed or nothing to commit: ', e.message);
    }
  }
})

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), gitPushPlugin()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      }
    }
  }
})
