import axios, { AxiosRequestConfig } from 'axios'

type ApiResponse<T> = {
  meta: {
    success: boolean
    messages: string[]
  }
  data: T | null
}

/** A client to make calls to the API */
export class ApiClient {
  client = axios.create({ baseURL: '/api' })

  /** Creates a server-like api envelope to return local errors */
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
      if (error.response) return error.response.data
      let msg = 'Something went wrong, please try again'
      return this.makeEnvelope(false, [msg], null)
    }
  }

  /** Perform a 'get' request */
  get<T = any>(url: string, config: AxiosRequestConfig = {}) {
    return this.makeRequest({ url, ...config })
  }

  /** Perform a 'post' request with a json body */
  post<T = any>(url: string, data: any, config?: AxiosRequestConfig) {
    return this.makeRequest<T>({
      method: 'post',
      url,
      data,
      ...config
    })
  }

  /** Perform a 'delete' */
  delete<T = any>(url: string, config?: AxiosRequestConfig) {
    return this.makeRequest<T>({
      method: 'delete',
      url
    })
  }
}
