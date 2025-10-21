'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, Clock, AlertCircle, RefreshCw } from 'lucide-react';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { statementService } from '@/services/statementService';
import { NotificationService } from '@/services/notificationService';
import toast from 'react-hot-toast';

interface ParsingProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  statementId: string;
  cardName: string;
  onComplete?: () => void;
}

type ParsingStatus = 'processing' | 'success' | 'failed';

export function ParsingProgressModal({
  isOpen,
  onClose,
  statementId,
  cardName,
  onComplete,
}: ParsingProgressModalProps) {
  const [status, setStatus] = useState<ParsingStatus>('processing');
  const [isChecking, setIsChecking] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryPassword, setRetryPassword] = useState('');
  const [showRetryForm, setShowRetryForm] = useState(false);
  const [currentStep, setCurrentStep] = useState(0); // Track current step

  // Poll for status updates
  useEffect(() => {
    if (!isOpen || !statementId) return;

    let timeoutId: ReturnType<typeof setTimeout>;

    const checkStatus = async () => {
      setIsChecking(true);
      try {
        const response = await statementService.getStatementById(statementId);
        if (response.success && response.data) {
          const statement = response.data.statement;

          switch (statement.status) {
            case 'success':
              setStatus('success');
              setCurrentStep(4); // All steps complete
              toast.success('Statement parsed successfully!');
              NotificationService.notifyStatementParsed(cardName);
              setTimeout(() => {
                onComplete?.();
                onClose();
              }, 2000);
              break;
            case 'failed':
              setStatus('failed');
              setErrorMessage(statement.parsingError || 'Parsing failed');
              NotificationService.notifyStatementFailed(
                cardName,
                statement.parsingError,
              );
              break;
            case 'processing':
            case 'pending':
              setStatus('processing');
              // Update step based on parsing progress
              if (statement.parsingErrorDetails) {
                try {
                  const details = JSON.parse(statement.parsingErrorDetails);
                  if (details.rawTextLength > 0) {
                    setCurrentStep(2); // Text extracted, now categorizing
                  } else {
                    setCurrentStep(1); // Still extracting text
                  }
                } catch {
                  setCurrentStep(1); // Default to step 1
                }
              } else {
                setCurrentStep(1); // Default to step 1
              }
              // Continue polling
              timeoutId = setTimeout(checkStatus, 2000); // Check every 2 seconds
              break;
          }
        }
      } catch (error) {
        console.error('Failed to check parsing status:', error);
        // Continue polling even if there's an error
        setTimeout(checkStatus, 5000); // Retry after 5 seconds on error
      } finally {
        setIsChecking(false);
      }
    };

    // Start checking immediately
    checkStatus();

    // Cleanup on unmount
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [isOpen, statementId, onComplete, onClose, cardName]);

  const handleClose = () => {
    if (status === 'processing') {
      // Don't allow closing while processing
      return;
    }
    onClose();
  };

  const handleRetry = async () => {
    if (!retryPassword.trim()) {
      toast.error('Please enter a password to retry');
      return;
    }

    setIsRetrying(true);
    try {
      const response = await fetch(`/api/statements/${statementId}/retry`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('finmatter-auth-token')}`,
        },
        body: JSON.stringify({ password: retryPassword }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Retrying with new password...');
        setStatus('processing');
        setShowRetryForm(false);
        setRetryPassword('');
        // Start polling again
        setTimeout(() => {
          const checkStatus = async () => {
            const response =
              await statementService.getStatementById(statementId);
            if (response.success && response.data) {
              const statement = response.data.statement;
              if (statement.status === 'success') {
                setStatus('success');
                toast.success('Statement parsed successfully!');
                NotificationService.notifyStatementParsed(cardName);
                setTimeout(() => {
                  onComplete?.();
                  onClose();
                }, 2000);
              } else if (statement.status === 'failed') {
                setStatus('failed');
                setErrorMessage(statement.parsingError || 'Parsing failed');
                NotificationService.notifyStatementFailed(
                  cardName,
                  statement.parsingError,
                );
              } else {
                // Still processing, check again
                setTimeout(checkStatus, 3000);
              }
            }
          };
          checkStatus();
        }, 1000);
      } else {
        toast.error(result.error?.message || 'Retry failed');
        setErrorMessage(result.error?.message || 'Retry failed');
      }
    } catch (error) {
      console.error('Retry error:', error);
      toast.error('Failed to retry parsing');
    } finally {
      setIsRetrying(false);
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'success':
        return (
          <CheckCircle className='w-16 h-16 text-green-500 mx-auto mb-4' />
        );
      case 'failed':
        return <AlertCircle className='w-16 h-16 text-red-500 mx-auto mb-4' />;
      case 'processing':
      default:
        return <Clock className='w-16 h-16 text-blue-500 mx-auto mb-4' />;
    }
  };

  const getStatusTitle = () => {
    switch (status) {
      case 'success':
        return 'Statement Parsed Successfully!';
      case 'failed':
        return 'Parsing Failed';
      case 'processing':
      default:
        return 'Parsing in Progress';
    }
  };

  const getStatusMessage = () => {
    switch (status) {
      case 'success':
        return 'Your statement has been successfully parsed. You can now view your transactions and spending insights.';
      case 'failed':
        return (
          errorMessage ||
          'There was an error parsing your statement. Please try uploading again.'
        );
      case 'processing':
      default:
        return "We're extracting and categorizing your transactions. This usually takes 30-60 seconds.";
    }
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={handleClose}>
      <div className='p-6 pb-8'>
        {/* Status Icon */}
        {getStatusIcon()}

        {/* Title */}
        <h2 className='text-xl font-semibold text-gray-900 text-center mb-2'>
          {getStatusTitle()}
        </h2>

        {/* Card Name */}
        <p className='text-sm text-gray-600 text-center mb-4'>{cardName}</p>

        {/* Status Message */}
        <p className='text-gray-700 text-center mb-6'>{getStatusMessage()}</p>

        {/* Processing Indicator */}
        {status === 'processing' && (
          <div className='flex items-center justify-center mb-6'>
            <LoadingSpinner size='sm' className='mr-2' />
            <span className='text-sm text-gray-600'>
              {isChecking ? 'Checking status...' : 'Processing...'}
            </span>
          </div>
        )}

        {/* Progress Steps */}
        {status === 'processing' && (
          <div className='space-y-3 mb-6'>
            <div className='flex items-center text-sm'>
              <CheckCircle className='w-4 h-4 text-green-500 mr-3' />
              <span className='text-gray-700'>PDF uploaded successfully</span>
            </div>
            <div className='flex items-center text-sm'>
              {currentStep >= 1 ? (
                currentStep > 1 ? (
                  <CheckCircle className='w-4 h-4 text-green-500 mr-3' />
                ) : (
                  <LoadingSpinner size='sm' className='mr-3' />
                )
              ) : (
                <Clock className='w-4 h-4 text-gray-400 mr-3' />
              )}
              <span
                className={currentStep >= 1 ? 'text-gray-700' : 'text-gray-500'}
              >
                Extracting transaction data
              </span>
            </div>
            <div className='flex items-center text-sm'>
              {currentStep >= 2 ? (
                currentStep > 2 ? (
                  <CheckCircle className='w-4 h-4 text-green-500 mr-3' />
                ) : (
                  <LoadingSpinner size='sm' className='mr-3' />
                )
              ) : (
                <Clock className='w-4 h-4 text-gray-400 mr-3' />
              )}
              <span
                className={currentStep >= 2 ? 'text-gray-700' : 'text-gray-500'}
              >
                Categorizing transactions
              </span>
            </div>
            <div className='flex items-center text-sm'>
              {currentStep >= 3 ? (
                currentStep > 3 ? (
                  <CheckCircle className='w-4 h-4 text-green-500 mr-3' />
                ) : (
                  <LoadingSpinner size='sm' className='mr-3' />
                )
              ) : (
                <Clock className='w-4 h-4 text-gray-400 mr-3' />
              )}
              <span
                className={currentStep >= 3 ? 'text-gray-700' : 'text-gray-500'}
              >
                Generating insights
              </span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className='flex gap-3'>
          {status === 'processing' && (
            <Button
              variant='outline'
              onClick={onClose}
              className='flex-1'
              disabled
            >
              Processing...
            </Button>
          )}

          {status === 'success' && (
            <Button
              onClick={() => {
                onComplete?.();
                onClose();
              }}
              className='flex-1'
            >
              View Statement
            </Button>
          )}

          {status === 'failed' && (
            <>
              <Button variant='outline' onClick={onClose} className='flex-1'>
                Close
              </Button>
              <Button
                onClick={() => setShowRetryForm(!showRetryForm)}
                className='flex-1'
              >
                {showRetryForm ? 'Cancel' : 'Retry'}
              </Button>
            </>
          )}
        </div>

        {/* Retry Form */}
        {status === 'failed' && showRetryForm && (
          <div className='mt-6 p-4 bg-gray-50 rounded-lg'>
            <h3 className='text-sm font-medium text-gray-900 mb-3'>
              Retry with Different Password
            </h3>
            <div className='space-y-3'>
              <div>
                <label className='block text-xs font-medium text-gray-700 mb-1'>
                  Password
                </label>
                <input
                  type='password'
                  value={retryPassword}
                  onChange={e => setRetryPassword(e.target.value)}
                  placeholder='Enter password'
                  className='w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500'
                  disabled={isRetrying}
                />
              </div>
              <div className='flex gap-2'>
                <Button
                  variant='outline'
                  onClick={() => {
                    setShowRetryForm(false);
                    setRetryPassword('');
                  }}
                  className='flex-1'
                  disabled={isRetrying}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleRetry}
                  className='flex-1'
                  disabled={isRetrying || !retryPassword.trim()}
                >
                  {isRetrying ? (
                    <>
                      <LoadingSpinner size='sm' className='mr-2' />
                      Retrying...
                    </>
                  ) : (
                    <>
                      <RefreshCw className='w-4 h-4 mr-2' />
                      Retry
                    </>
                  )}
                </Button>
              </div>
            </div>
            <div className='mt-3 p-2 bg-blue-50 rounded border border-blue-200'>
              <p className='text-xs text-blue-700'>
                <strong>Tip:</strong> Try common passwords like last 4 digits of
                card, date of birth (DDMMYYYY), or contact your bank for the
                correct password.
              </p>
            </div>
          </div>
        )}

        {/* Additional Info */}
        {status === 'processing' && (
          <p className='text-xs text-gray-500 text-center mt-4'>
            You&apos;ll be notified once the parsing is complete. You can close
            this dialog and continue using the app.
          </p>
        )}
      </div>
    </BottomSheet>
  );
}
