type DefaultEnvMap = { [env: string]: { [key: string]: string } }

// Default environment variables for different NODE_ENVs
export default {
  development: {
    EXECUTOR: 'js',
    API_URL: 'http://localhost:3000',
    WEB_URL: 'http://localhost:3000',
    FSK_CMD: 'docker run -i --rm openlab/fsk'
  },

  testing: {
    EXECUTOR: 'js',
    API_URL: 'http://localhost:3000',
    WEB_URL: 'http://localhost:3000'
    // DB_TYPE: 'sqlite3',
    // DB_URI: ':memory:'
    // FSK_CMD: 'echo "mock_fsk"',
  },

  production: {
    EXECUTOR: 'js'
  }
} as DefaultEnvMap
