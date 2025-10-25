import { apiClient } from '@/lib/apiClient';

export interface EMILoan {
  id: string;
  statement_id: string;
  user_id: string;
  card_id: string;
  loan_number: string;
  principal_amount: number;
  emi_amount: number;
  remaining_tenure: number;
  interest_rate?: number;
  start_date?: string;
  end_date?: string;
  product_description?: string;
  created_at: string;
  updated_at: string;
}

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
  parsingErrorDetails?: string;
  uploadedAt: string;
  parsedAt?: string;

  // Enhanced statement data
  statementDate?: string;
  rewardPointsOpening?: number;
  rewardPointsEarned?: number;
  rewardPointsRedeemed?: number;
  rewardPointsExpired?: number;
  rewardPointsClosing?: number;
  emiCount?: number;
  totalEMIAmount?: number;
  totalSpends?: number;
  domesticSpends?: number;
  internationalSpends?: number;
  atmWithdrawals?: number;
  numberOfTransactions?: number;
  categoryWiseSpends?: Record<string, number>;
  rewardPointsByCategory?: Record<string, number>;
  billingDay?: number;
  statementDay?: number;
  previousBalance?: number;
  purchasesCharges?: number;
  cashAdvances?: number;
  paymentsCredits?: number;
  cashAdvanceLimit?: number;
  latePaymentFee?: number;
  interestCharges?: number;
  validationWarnings?: string;

  card?: {
    id: string;
    bankName: string;
    cardName: string;
    lastFourDigits: string;
  };
  emiLoans?: EMILoan[];
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
    password?: string,
  ): Promise<UploadStatementResponse> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('cardId', cardId);
      formData.append('bankName', bankName);
      if (password) {
        formData.append('password', password);
      }

      const response = await apiClient.post<UploadStatementResponse>(
        '/api/statements/upload',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          timeout: 300000, // 5 minutes timeout for upload and parsing
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
  }): Promise<Statement[]> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.cardId) queryParams.append('cardId', params.cardId);
      if (params?.status) queryParams.append('status', params.status);
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.offset)
        queryParams.append('offset', params.offset.toString());

      const url = `/api/statements${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await apiClient.get<GetStatementsResponse>(url);

      if (response.success && response.data?.statements) {
        // Transform database format to frontend format
        return response.data.statements.map(this.transformStatement);
      }
      throw new Error(response.error?.message || 'Failed to fetch statements');
    } catch (error) {
      console.error('Get statements error:', error);
      throw error;
    }
  }

  private transformStatement(dbStatement: any): Statement {
    return {
      id: dbStatement.id,
      cardId: dbStatement.card_id,
      fileName: dbStatement.file_name,
      fileSize: dbStatement.file_size,
      filePath: dbStatement.file_path,
      status: dbStatement.parsing_status,
      transactionCount: dbStatement.transaction_count,
      dueDate: dbStatement.due_date,
      minimumPayment: dbStatement.minimum_payment,
      creditLimit: dbStatement.credit_limit,
      availableCredit: dbStatement.available_credit,
      parsingError: dbStatement.parsing_error,
      parsingErrorDetails: dbStatement.parsing_error_details,
      uploadedAt: dbStatement.uploaded_at,
      parsedAt: dbStatement.parsed_at,

      // Enhanced statement data
      statementDate: dbStatement.statement_date,
      rewardPointsOpening: dbStatement.reward_points_opening,
      rewardPointsEarned: dbStatement.reward_points_earned,
      rewardPointsRedeemed: dbStatement.reward_points_redeemed,
      rewardPointsExpired: dbStatement.reward_points_expired,
      rewardPointsClosing: dbStatement.reward_points_closing,
      emiCount: dbStatement.emi_count,
      totalEMIAmount: dbStatement.total_emi_amount,
      totalSpends: dbStatement.total_spends,
      domesticSpends: dbStatement.domestic_spends,
      internationalSpends: dbStatement.international_spends,
      atmWithdrawals: dbStatement.atm_withdrawals,
      numberOfTransactions: dbStatement.number_of_transactions,
      categoryWiseSpends: dbStatement.category_wise_spends,
      rewardPointsByCategory: dbStatement.reward_points_by_category,
      billingDay: dbStatement.billing_day,
      statementDay: dbStatement.statement_day,
      previousBalance: dbStatement.previous_balance,
      purchasesCharges: dbStatement.purchases_charges,
      cashAdvances: dbStatement.cash_advances,
      paymentsCredits: dbStatement.payments_credits,
      cashAdvanceLimit: dbStatement.cash_advance_limit,
      latePaymentFee: dbStatement.late_payment_fee,
      interestCharges: dbStatement.interest_charges,
      validationWarnings: dbStatement.validation_warnings,

      card: dbStatement.card
        ? {
            id: dbStatement.card.id,
            bankName: dbStatement.card.bank_name,
            cardName: dbStatement.card.card_name,
            lastFourDigits: dbStatement.card.last_four_digits,
          }
        : undefined,
    };
  }

  async getStatementById(statementId: string): Promise<GetStatementResponse> {
    try {
      const response = await apiClient.get<{
        success: boolean;
        data?: {
          statement: any;
        };
        error?: {
          code: string;
          message: string;
        };
      }>(`/api/statements/${statementId}`);

      if (response.success && response.data?.statement) {
        return {
          success: true,
          data: {
            statement: this.transformStatement(response.data.statement),
          },
        };
      }

      return {
        success: false,
        error: response.error || {
          code: 'UNKNOWN_ERROR',
          message: 'Failed to fetch statement',
        },
      };
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

  async getStatementStatus(statementId: string): Promise<{
    success: boolean;
    data?: {
      statement: {
        id: string;
        status: 'pending' | 'processing' | 'success' | 'failed';
        error?: string;
        transactionCount?: number;
        parsedAt?: string;
        uploadedAt: string;
        fileName: string;
        fileSize: number;
      };
    };
    error?: {
      code: string;
      message: string;
    };
  }> {
    try {
      const response = await apiClient.get<{
        success: boolean;
        data?: {
          statement: {
            id: string;
            status: 'pending' | 'processing' | 'success' | 'failed';
            error?: string;
            transactionCount?: number;
            parsedAt?: string;
            uploadedAt: string;
            fileName: string;
            fileSize: number;
          };
        };
        error?: {
          code: string;
          message: string;
        };
      }>(`/api/statements/${statementId}/status`);
      return response;
    } catch (error) {
      console.error('Get statement status error:', error);
      throw error;
    }
  }

  async getStatementEMILoans(statementId: string): Promise<EMILoan[]> {
    try {
      const response = await apiClient.get<{
        success: boolean;
        data?: {
          emiLoans: EMILoan[];
        };
        error?: {
          code: string;
          message: string;
        };
      }>(`/api/statements/${statementId}/emi-loans`);

      if (response.success && response.data?.emiLoans) {
        return response.data.emiLoans;
      }
      throw new Error(response.error?.message || 'Failed to fetch EMI loans');
    } catch (error) {
      console.error('Get EMI loans error:', error);
      throw error;
    }
  }
}

export const statementService = new StatementService();
