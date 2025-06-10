import {getToken} from '@/utils/token'
import { IResponse } from '@/types/api'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || '';

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

export async function request<T>(url: string, options?: RequestOptions): Promise<IResponse<T>> {
  const { data, params, headers, ...restOptions } = options || {};

  let requestUrl = resolveRequestUrl(url);

  const token = getToken();
  const allHeaders: Record<string, string> = {
    ...(headers as Record<string, string>),
  };

  if (token) {
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
    
    if (!isLogicalSuccess(response.status)) {
      const errorData = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return (await response.json()) as IResponse<T>;

  } catch (error: any) {
    throw new Error(error.message || 'Network or unknown error occurred.');
  }
}

export async function get<T>(url: string, options?: Omit<RequestOptions, 'method' | 'data'>): Promise<IResponse<T>> {
  return request(url, { method: 'GET', ...options });
}

export async function post<T>(url: string, options?: Omit<RequestOptions, 'method' | 'params'>): Promise<IResponse<T>> {
  return request(url, { method: 'POST', ...options });
}

export async function put<T>(url: string, options?: Omit<RequestOptions, 'method' | 'params'>): Promise<IResponse<T>> {
  return request(url, { method: 'PUT', ...options });
}

export async function del<T>(url: string, options?: Omit<RequestOptions, 'method' | 'data'>): Promise<IResponse<T>> {
  return request(url, { method: 'DELETE', ...options });
}
