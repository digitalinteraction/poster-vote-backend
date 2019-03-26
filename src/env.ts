import validateEnv from 'valid-env'

type DefaultEnvMap = { [env: string]: { [key: string]: string } }

// Default environment variables for different NODE_ENVs
export const environments = {
  development: {
    API_URL: 'http://localhost:3000',
    WEB_URL: 'http://localhost:8080',
    FSK_CMD: 'docker run -i --rm openlab/fsk',
    LOG_PATH: 'logs'
  },

  testing: {
    API_URL: 'http://localhost:3000',
    WEB_URL: 'http://localhost:8080',
    DB_TYPE: 'sqlite3',
    DB_URI: ':memory:',
    // FSK_CMD: 'echo "mock_fsk"',
    JWT_SECRET: 'testing_jwt_secret',
    COOKIE_SECRET: 'testing_cookie_secret',
    HASH_SECRET: 'testing_hash_secret',
    ADMIN_EMAIL: 'testing@example.com',
    SENDGRID_TOKEN: 'testing_sendgrid_token',
    REG_TWILIO_NUMBER: '07880 123456',
    VOTE_TWILIO_NUMBER: '07880 654321'
  },

  production: {
    FSK_CMD: 'fsk',
    LOG_PATH: 'logs'
  }
} as DefaultEnvMap

// Checks that the required environment variables are set
export function checkEnvironment() {
  validateEnv([
    'API_URL',
    'WEB_URL',
    'DB_TYPE',
    'DB_URI',
    'JWT_SECRET',
    'COOKIE_SECRET',
    'ADMIN_EMAIL',
    'SENDGRID_TOKEN',
    'HASH_SECRET',
    'REG_TWILIO_NUMBER',
    'VOTE_TWILIO_NUMBER'
  ])
}

// Setup the environment using pre-configurated defaults
// Only setting defaults if they're not already set
export function setupEnvironment(env: string) {
  process.env.NODE_ENV = env

  // If a default environment config exists, apply that
  const defaultEnv = environments[env]
  if (!defaultEnv) return

  // Go through each variable but only set if it is already unset
  Object.entries(defaultEnv).forEach(([name, defaultValue]) => {
    if (process.env[name] !== undefined) return
    process.env[name] = defaultValue
  })
}
