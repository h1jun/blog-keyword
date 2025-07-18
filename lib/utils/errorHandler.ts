export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function handleApiError(error: any) {
  console.error('API Error:', error);
  
  if (error instanceof ApiError) {
    return {
      error: error.message,
      code: error.code,
      statusCode: error.statusCode
    };
  }
  
  // 네이버 API 에러
  if (error.response?.data?.errorCode) {
    return {
      error: `Naver API Error: ${error.response.data.errorMessage}`,
      code: error.response.data.errorCode,
      statusCode: 400
    };
  }
  
  // SerpAPI 에러
  if (error.response?.data?.error) {
    return {
      error: `SerpAPI Error: ${error.response.data.error}`,
      code: 'SERPAPI_ERROR',
      statusCode: 400
    };
  }
  
  // Supabase 에러
  if (error.code && error.message) {
    return {
      error: `Database Error: ${error.message}`,
      code: error.code,
      statusCode: 500
    };
  }
  
  // 기본 에러
  return {
    error: 'Internal Server Error',
    code: 'INTERNAL_ERROR',
    statusCode: 500
  };
}