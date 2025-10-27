export class FinMatterError extends Error {
  public code: string;
  public status: number;
  public details?: any;

  constructor(
    message: string,
    code: string,
    status: number = 500,
    details?: any,
  ) {
    super(message);
    this.name = 'FinMatterError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}
