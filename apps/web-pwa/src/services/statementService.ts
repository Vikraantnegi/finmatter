import { apiClient } from '@/lib/apiClient';

export interface Statement {
  id: string;
  cardId: string;
  fileName: string;
  fileSize: number;
  filePath: string;
  status: 'pending' | 'processing' | 'success' | 'failed';
  transactionCount?: number;
  dueDate?: string;
  minimumPayment?: number;
  creditLimit?: number;
  availableCredit?: number;
  parsingError?: string;
  uploadedAt: string;
  parsedAt?: string;
  card?: {
    id: string;
    bankName: string;
    cardName: string;
    lastFourDigits: string;
  };
}

export interface UploadStatementResponse {
  success: boolean;
  data?: {
    statement: {
      id: string;
      fileName: string;
      fileSize: number;
      status: string;
      uploadedAt: string;
    };
    message: string;
  };
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export interface GetStatementsResponse {
  success: boolean;
  data?: {
    statements: Statement[];
    pagination: {
      limit: number;
      offset: number;
      total: number;
      hasMore: boolean;
    };
  };
  error?: {
    code: string;
    message: string;
  };
}

export interface GetStatementResponse {
  success: boolean;
  data?: {
    statement: Statement & {
      transactions?: any[];
    };
  };
  error?: {
    code: string;
    message: string;
  };
}

export type BankName =
  | 'hdfc'
  | 'icici'
  | 'sbi'
  | 'axis'
  | 'kotak'
  | 'citi'
  | 'amex'
  | 'hsbc';

export class StatementService {
  async uploadStatement(
    file: File,
    cardId: string,
    bankName: BankName,
  ): Promise<UploadStatementResponse> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('cardId', cardId);
      formData.append('bankName', bankName);

      const response = await apiClient.post<UploadStatementResponse>(
        '/api/statements/upload',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        },
      );

      return response;
    } catch (error) {
      console.error('Upload statement error:', error);
      throw error;
    }
  }

  async getStatements(params?: {
    cardId?: string;
    status?: 'pending' | 'processing' | 'success' | 'failed';
    limit?: number;
    offset?: number;
  }): Promise<GetStatementsResponse> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.cardId) queryParams.append('cardId', params.cardId);
      if (params?.status) queryParams.append('status', params.status);
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.offset)
        queryParams.append('offset', params.offset.toString());

      const url = `/api/statements${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await apiClient.get<GetStatementsResponse>(url);

      return response;
    } catch (error) {
      console.error('Get statements error:', error);
      throw error;
    }
  }

  async getStatementById(statementId: string): Promise<GetStatementResponse> {
    try {
      const response = await apiClient.get<GetStatementResponse>(
        `/api/statements/${statementId}`,
      );
      return response;
    } catch (error) {
      console.error('Get statement error:', error);
      throw error;
    }
  }

  async deleteStatement(statementId: string): Promise<void> {
    try {
      const response = await apiClient.delete<{
        success: boolean;
        message?: string;
        error?: { message: string };
      }>(`/api/statements/${statementId}`);
      if (!response.success) {
        throw new Error(
          response.error?.message || 'Failed to delete statement',
        );
      }
    } catch (error) {
      console.error('Delete statement error:', error);
      throw error;
    }
  }
}

export const statementService = new StatementService();
