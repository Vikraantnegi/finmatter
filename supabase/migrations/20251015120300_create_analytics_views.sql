-- Create materialized views for analytics and reporting
-- Migration: 20251015120300_create_analytics_views.sql

-- View: Monthly spending by category
CREATE OR REPLACE VIEW public.monthly_spending_by_category AS
SELECT 
  user_id,
  card_id,
  DATE_TRUNC('month', transaction_date) as month,
  category,
  COUNT(*) as transaction_count,
  SUM(amount) as total_amount,
  AVG(amount) as avg_amount
FROM public.transactions
WHERE transaction_type = 'debit'
  AND status = 'completed'
GROUP BY user_id, card_id, DATE_TRUNC('month', transaction_date), category;

-- View: Card usage statistics
CREATE OR REPLACE VIEW public.card_usage_stats AS
SELECT 
  t.user_id,
  t.card_id,
  c.card_name,
  c.bank_name,
  COUNT(*) as transaction_count,
  SUM(CASE WHEN t.transaction_type = 'debit' THEN t.amount ELSE 0 END) as total_spent,
  AVG(CASE WHEN t.transaction_type = 'debit' THEN t.amount ELSE NULL END) as avg_transaction,
  MAX(t.transaction_date) as last_used_date,
  DATE_TRUNC('month', CURRENT_DATE) as current_month,
  SUM(CASE 
    WHEN t.transaction_type = 'debit' 
    AND DATE_TRUNC('month', t.transaction_date) = DATE_TRUNC('month', CURRENT_DATE)
    THEN t.amount 
    ELSE 0 
  END) as current_month_spent
FROM public.transactions t
JOIN public.cards c ON t.card_id = c.id
WHERE t.status = 'completed'
GROUP BY t.user_id, t.card_id, c.card_name, c.bank_name;

-- View: Top merchants by spending
CREATE OR REPLACE VIEW public.top_merchants AS
SELECT 
  user_id,
  merchant_name,
  category,
  COUNT(*) as transaction_count,
  SUM(amount) as total_spent,
  AVG(amount) as avg_amount,
  MAX(transaction_date) as last_transaction_date
FROM public.transactions
WHERE transaction_type = 'debit'
  AND status = 'completed'
GROUP BY user_id, merchant_name, category
ORDER BY total_spent DESC;

-- Add comments
COMMENT ON VIEW public.monthly_spending_by_category IS 'Monthly spending breakdown by category for analytics';
COMMENT ON VIEW public.card_usage_stats IS 'Card usage statistics including transaction counts and spending';
COMMENT ON VIEW public.top_merchants IS 'Top merchants by total spending for each user';

