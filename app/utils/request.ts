import {getToken} from '@/utils/token'
import { IResponse } from '@/types'
// import { message } from 'antd';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || '';
const WHITE_LIST = ['checkWallet', 'login', 'register'];

// Custom error class for API failures
export class ApiError extends Error {
  public status: number;
  public data: any;

  constructor(message: string, status: number, data: any = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

interface RequestOptions extends RequestInit {
  data?: Record<string, any> | FormData | Blob | ArrayBufferView | ArrayBuffer | string; 
  params?: Record<string, string | number>;
}

function resolveRequestUrl(url: string) {
  if (url.startsWith('http')) {
    return url;
  }

  // Remove leading slash from url if present
  const cleanUrl = url.startsWith('/') ? url.slice(1) : url;

  // If BASE_URL ends with a slash, simply append cleanUrl
  if (BASE_URL.endsWith('/')) {
    return `${BASE_URL}${cleanUrl}`;
  } else {
    // If BASE_URL doesn't end with a slash, add one before appending cleanUrl
    return `${BASE_URL}/${cleanUrl}`;
  }
}

export function isLogicalSuccess(code: number): boolean {
  return code >= 200 && code < 300;
}

export async function request<T>(url: string, options?: RequestOptions): Promise<T> {
  const { data, params, headers, ...restOptions } = options || {};

  let requestUrl = resolveRequestUrl(url);

  const token = getToken();
  const allHeaders: Record<string, string> = {
    ...(headers as Record<string, string>),
  };

  const isWhiteList = WHITE_LIST.some(whiteListStr => url.includes(whiteListStr))

  if (token && !isWhiteList) {
    allHeaders['Authorization'] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    ...restOptions,
    headers: allHeaders,
  };

  if (params) {
    const queryString = new URLSearchParams(params as Record<string, string>).toString();
    requestUrl = `${requestUrl}?${queryString}`;
  }

  // Handle request body based on type of 'data'
  if (data) {
    if (typeof data === 'object' && !Array.isArray(data) && !(data instanceof FormData) && !(data instanceof Blob) && !(data instanceof ArrayBuffer) && !('buffer' in data) && !allHeaders['Content-Type']) {
      // Assume JSON if it's a plain object and Content-Type is not set
      allHeaders['Content-Type'] = 'application/json;charset=utf-8';
      config.body = JSON.stringify(data);
    } else {
      // For FormData, Blob, string, etc., pass directly
      config.body = data as any; // Cast to any to satisfy RequestInit['body'] type
    }
  }
  
  try {
    const response = await fetch(requestUrl, config);

    let responseData: IResponse<T> | undefined;
    const contentType = response.headers.get('content-type');
    const isJson = contentType && contentType.includes('application/json');

    if (response.status === 204) { // No Content
      responseData = { code: response.status, message: 'No Content', data: null as any };
    } else if (isJson) {
      try {
        responseData = await response.json();
      } catch (jsonError: any) {
        const errorMessage = `Failed to parse JSON response from ${url}: ${jsonError.message}`;
        // message.error(errorMessage);
        throw new ApiError(errorMessage, response.status, null);
      }
    } else {
      const textResponse = await response.text().catch(() => '');
      const errorMessage = `Unexpected content type '${contentType}' from ${url}. Expected JSON. Response: ${textResponse.substring(0, 100)}...`;
      // message.error(errorMessage);
      throw new ApiError(errorMessage, response.status, textResponse);
    }

    if (isLogicalSuccess(response.status)) {
      // if (responseData?.message) {
      //   message.success(responseData.message);
      // }
      return responseData?.data as T;
    } else {
      const errorMessage = responseData?.message || `HTTP error! status: ${response.status}`;
      // message.error(errorMessage);
      throw new ApiError(errorMessage, response.status, responseData?.data);
    }
  } catch (error: any) {
    if (!(error instanceof ApiError)) {
      // const errorMessage = error.message || 'Network or unknown error occurred.';
      // message.error(errorMessage);
    }
    throw error; // Re-throw the original error or ApiError
  }
}

export async function get<T>(url: string, options?: Omit<RequestOptions, 'method' | 'data'>): Promise<T> {
  return request(url, { method: 'GET', ...options });
}

export async function post<T>(url: string, options?: Omit<RequestOptions, 'method' | 'params'>): Promise<T> {
  return request(url, { method: 'POST', ...options });
}

export async function put<T>(url: string, options?: Omit<RequestOptions, 'method' | 'params'>): Promise<T> {
  return request(url, { method: 'PUT', ...options });
}

export async function del<T>(url: string, options?: Omit<RequestOptions, 'method' | 'data'>): Promise<T> {
  return request(url, { method: 'DELETE', ...options });
}
