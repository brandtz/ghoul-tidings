export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',
  ssr: false,
  devtools: { enabled: false },
  modules: ['@nuxtjs/tailwindcss', '@pinia/nuxt'],
  css: ['~/assets/css/main.css'],
  components: [{ path: '~/components', pathPrefix: false }],
  sourcemap: { client: false, server: false },
  app: {
    head: {
      title: 'Ghoul Tidings',
      meta: [{ name: 'viewport', content: 'width=device-width, initial-scale=1' }],
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700;900&family=Inter:wght@500;600;700;800&family=Nunito:wght@600;700;800;900&display=swap' },
      ],
    },
  },
  runtimeConfig: {
    adminPasscode: 'ghoul-tidings-dev-passcode-1234',
    emailPepper: 'dev-email-pepper-change-me',
    jwtSecret: 'dev-jwt-secret-change-me-please-32-chars',
    // Each key is overridden by its NUXT_ variable, for example NUXT_SUPABASE_SECRET_KEY.
    supabaseSecretKey: '',
    databaseUrl: '',
    databaseMigrationUrl: '',
    broadcastPrivateKey: '',
    public: { joinUrl: 'http://localhost:3000', supabaseUrl: '', supabasePublishableKey: '', broadcastPublicKey: '' },
  },
  vite: { build: { target: 'es2022' }, optimizeDeps: { include: ['qrcode'] } },
})
