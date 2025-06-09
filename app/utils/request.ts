const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || '';

interface RequestOptions extends Omit<RequestInit, 'body'> {
  data?: Record<string, any>;
  params?: Record<string, string | number>;
}

export async function request<T>(url: string, options?: RequestOptions): Promise<T> {
  const { data, params, headers, ...restOptions } = options || {};

  let requestUrl = `${BASE_URL}${url}`;

  if (params) {
    const queryString = new URLSearchParams(params as Record<string, string>).toString();
    requestUrl = `${requestUrl}?${queryString}`;
  }

  const config: RequestInit = {
    ...restOptions,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  };

  if (data) {
    config.body = JSON.stringify(data);
  }

  const response = await fetch(requestUrl, config);

  console.log(requestUrl);
  

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}