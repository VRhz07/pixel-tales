/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  readonly VITE_GOOGLE_AI_KEY: string
  readonly VITE_APP_NAME: string
  readonly VITE_APP_VERSION: string
  readonly VITE_ENABLE_AI_FEATURES: string
  readonly VITE_ENABLE_SOCIAL_FEATURES: string
  readonly VITE_ENABLE_OFFLINE_MODE: string
  readonly VITE_FREE_USER_STORY_LIMIT: string
  readonly VITE_FREE_USER_CHARACTER_LIMIT: string
  readonly VITE_FREE_USER_STORAGE_LIMIT: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
