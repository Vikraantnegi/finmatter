-- Seed BIN ranges for popular Indian credit cards
-- Data source: Industry standards and public BIN databases

-- HDFC Bank (Major Indian Bank)
INSERT INTO bin_ranges (bin_start, bin_end, bank_name, card_network, card_brand, country_code) VALUES
('40782300', '40782399', 'HDFC Bank', 'Visa', 'HDFC Regalia', 'IN'),
('43788300', '43788399', 'HDFC Bank', 'Visa', 'HDFC Millennia', 'IN'),
('43391100', '43391199', 'HDFC Bank', 'Visa', 'HDFC Diners Club', 'IN'),
('55301100', '55301199', 'HDFC Bank', 'Mastercard', 'HDFC Infinia', 'IN'),
('52300000', '52309999', 'HDFC Bank', 'Mastercard', 'HDFC Times Credit Card', 'IN'),
('60820000', '60829999', 'HDFC Bank', 'RuPay', 'HDFC Platinum RuPay', 'IN');

-- ICICI Bank
INSERT INTO bin_ranges (bin_start, bin_end, bank_name, card_network, card_brand, country_code) VALUES
('43897900', '43897999', 'ICICI Bank', 'Visa', 'ICICI Sapphiro', 'IN'),
('40885500', '40885599', 'ICICI Bank', 'Visa', 'ICICI Platinum', 'IN'),
('55234200', '55234299', 'ICICI Bank', 'Mastercard', 'ICICI Rubyx', 'IN'),
('51840100', '51840199', 'ICICI Bank', 'Mastercard', 'ICICI Amazon Pay', 'IN'),
('60850000', '60859999', 'ICICI Bank', 'RuPay', 'ICICI RuPay', 'IN');

-- Axis Bank
INSERT INTO bin_ranges (bin_start, bin_end, bank_name, card_network, card_brand, country_code) VALUES
('42661000', '42661099', 'Axis Bank', 'Visa', 'Axis Magnus', 'IN'),
('43554300', '43554399', 'Axis Bank', 'Visa', 'Axis Flipkart', 'IN'),
('55500000', '55509999', 'Axis Bank', 'Mastercard', 'Axis Reserve', 'IN'),
('51293100', '51293199', 'Axis Bank', 'Mastercard', 'Axis Vistara', 'IN'),
('65220000', '65229999', 'Axis Bank', 'RuPay', 'Axis RuPay Select', 'IN');

-- SBI (State Bank of India)
INSERT INTO bin_ranges (bin_start, bin_end, bank_name, card_network, card_brand, country_code) VALUES
('40578400', '40578499', 'State Bank of India', 'Visa', 'SBI Card PRIME', 'IN'),
('43655800', '43655899', 'State Bank of India', 'Visa', 'SBI SimplyCLICK', 'IN'),
('52771900', '52771999', 'State Bank of India', 'Mastercard', 'SBI Elite', 'IN'),
('55650000', '55659999', 'State Bank of India', 'Mastercard', 'SBI BPCL Octane', 'IN'),
('60770000', '60779999', 'State Bank of India', 'RuPay', 'SBI RuPay Platinum', 'IN');

-- Kotak Mahindra Bank
INSERT INTO bin_ranges (bin_start, bin_end, bank_name, card_network, card_brand, country_code) VALUES
('48221400', '48221499', 'Kotak Mahindra Bank', 'Visa', 'Kotak Urbane', 'IN'),
('41680000', '41689999', 'Kotak Mahindra Bank', 'Visa', 'Kotak League Platinum', 'IN'),
('52135000', '52135099', 'Kotak Mahindra Bank', 'Mastercard', 'Kotak Essentia', 'IN'),
('54190000', '54199999', 'Kotak Mahindra Bank', 'Mastercard', 'Kotak Royale Signature', 'IN');

-- IndusInd Bank
INSERT INTO bin_ranges (bin_start, bin_end, bank_name, card_network, card_brand, country_code) VALUES
('40623700', '40623799', 'IndusInd Bank', 'Visa', 'IndusInd Legend', 'IN'),
('46243000', '46243099', 'IndusInd Bank', 'Visa', 'IndusInd Pioneer', 'IN'),
('55255200', '55255299', 'IndusInd Bank', 'Mastercard', 'IndusInd Pinnacle', 'IN'),
('51828900', '51828999', 'IndusInd Bank', 'Mastercard', 'IndusInd Nexxt', 'IN');

-- HSBC India
INSERT INTO bin_ranges (bin_start, bin_end, bank_name, card_network, card_brand, country_code) VALUES
('43721600', '43721699', 'HSBC', 'Visa', 'HSBC Platinum', 'IN'),
('40112700', '40112799', 'HSBC', 'Visa', 'HSBC Cashback', 'IN'),
('55204300', '55204399', 'HSBC', 'Mastercard', 'HSBC Premier', 'IN');

-- American Express (Amex) - Global BINs used in India
INSERT INTO bin_ranges (bin_start, bin_end, bank_name, card_network, card_brand, country_code) VALUES
('37814100', '37814199', 'American Express', 'Amex', 'Amex Platinum', 'IN'),
('37146100', '37146199', 'American Express', 'Amex', 'Amex Gold', 'IN'),
('37814500', '37814599', 'American Express', 'Amex', 'Amex Membership Rewards', 'IN');

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_bin_ranges_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER bin_ranges_updated_at_trigger
  BEFORE UPDATE ON bin_ranges
  FOR EACH ROW
  EXECUTE FUNCTION update_bin_ranges_updated_at();

