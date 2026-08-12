type ValidationError = {
  error: string;
  value: string;
};

type ApiErrorData = {
  errors: {
    [key: string]: ValidationError[];
  };
};

export class ApiError extends Error {
  status: number;
  data?: ApiErrorData;

  constructor(message: string, status: number, data?: ApiErrorData) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}
