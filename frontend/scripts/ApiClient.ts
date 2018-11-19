import axios, { AxiosRequestConfig } from 'axios'

type ApiResponse<T> = {
  meta: {
    success: boolean
    messages: string[]
  }
  data: T | null
}

export class ApiClient {
  client = axios.create({ baseURL: '/' })

  makeEnvelope(success: boolean, messages: string[], data: any) {
    return {
      meta: { success, messages },
      data
    }
  }

  /** Wraps an axios request to catch http errors and format in an envelope */
  async makeRequest<T = any>(
    config: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    try {
      let { data } = await this.client(config)
      return data
    } catch (error) {
      if (error.response) {
        return error.response.data
      }
      let msg = 'Something went wrong, please try again'
      return this.makeEnvelope(false, [msg], null)
    }
  }

  get<T = any>(url: string, config: AxiosRequestConfig = {}) {
    return this.makeRequest({ url, ...config })
  }

  post<T = any>(url: string, data: any, config?: AxiosRequestConfig) {
    return this.makeRequest<T>({
      method: 'POST',
      url,
      data,
      ...config
    })
  }
}
