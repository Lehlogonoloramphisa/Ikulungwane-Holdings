import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const remoteMediaOrigin = process.env.VITE_REMOTE_MEDIA_ORIGIN || 'https://ikulungwaneholdings.co.za'

const mediaTypes = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
  svg: 'image/svg+xml',
  ico: 'image/x-icon',
  mp4: 'video/mp4',
  mov: 'video/quicktime',
  webm: 'video/webm',
}

const mediaFileName = (value) => {
  try {
    const file = path.basename(decodeURIComponent(String(value || '')))
    return /^[a-zA-Z0-9._-]+$/.test(file) ? file : ''
  } catch {
    return ''
  }
}

const localMediaPath = (file) => [
  path.resolve(__dirname, '..', 'ikulungwane_uploads', file),
  path.resolve(__dirname, 'public', 'uploads', file),
  path.resolve(__dirname, 'dist', 'uploads', file),
].find((candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isFile())

const contentType = (file) => mediaTypes[path.extname(file).slice(1).toLowerCase()] || 'application/octet-stream'

const devMediaPlugin = () => ({
  name: 'ikulungwane-dev-media',
  configureServer(server) {
    server.middlewares.use(async (req, res, next) => {
      const requestUrl = new URL(req.url || '/', 'http://localhost')
      let file = ''

      if (requestUrl.pathname === '/api/media.php') {
        file = mediaFileName(requestUrl.searchParams.get('file'))
      } else if (/^\/api\/uploads\//i.test(requestUrl.pathname)) {
        file = mediaFileName(requestUrl.pathname.split('/').pop())
      }

      if (!file) {
        next()
        return
      }

      const found = localMediaPath(file)
      if (found) {
        res.statusCode = 200
        res.setHeader('Content-Type', contentType(found))
        res.setHeader('Cache-Control', 'no-cache')
        fs.createReadStream(found).pipe(res)
        return
      }

      if (remoteMediaOrigin) {
        try {
          const remoteUrl = new URL(requestUrl.pathname + requestUrl.search, remoteMediaOrigin)
          const response = await fetch(remoteUrl)
          if (response.ok) {
            const body = Buffer.from(await response.arrayBuffer())
            res.statusCode = response.status
            res.setHeader('Content-Type', response.headers.get('content-type') || contentType(file))
            res.setHeader('Cache-Control', 'no-cache')
            res.end(body)
            return
          }
        } catch {
          // Fall through to a clear 404 below.
        }
      }

      res.statusCode = 404
      res.setHeader('Content-Type', 'text/plain; charset=utf-8')
      res.end('Media file not found locally or on the configured remote media origin.')
    })
  },
})

// https://vite.dev/config/
export default defineConfig({
  base: '/',
  logLevel: 'error', // Suppress warnings, only show errors
  plugins: [devMediaPlugin(), react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
});
