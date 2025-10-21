/**
 * Data Transformation Utilities
 * Handles conversion between database format (snake_case) and API format (camelCase)
 */

import { DatabaseCard, DatabaseCardBenefit } from '@finmatter/types';
import type { Card, CardBenefit } from '@finmatter/types';

/**
 * Convert database card (snake_case) to API card (camelCase)
 */
export function dbCardToApiCard(dbCard: any, dbBenefits?: any[]): Card {
  // Check if card has any statements
  const hasStatement = dbCard.statements?.length > 0;
  // Check if any statement is currently being parsed
  const parsingInProgress = dbCard.parsing_in_progress || false;

  return {
    id: dbCard.id,
    userId: dbCard.user_id,
    bankName: dbCard.bank_name,
    cardName: dbCard.card_name,
    lastFourDigits: dbCard.last_four_digits,
    cardType: dbCard.card_type,
    network: dbCard.network,
    rewardType: dbCard.reward_type,
    annualFee: dbCard.annual_fee,
    currency: dbCard.currency,
    status: dbCard.status,
    issueDate: dbCard.issue_date ? new Date(dbCard.issue_date) : undefined,
    expiryDate: dbCard.expiry_date ? new Date(dbCard.expiry_date) : undefined,
    creditLimit: dbCard.credit_limit,
    availableCredit: dbCard.available_credit,
    billingDay: dbCard.billing_day,
    cardMetadataId: dbCard.card_metadata_id,
    bankId: dbCard.bank_id,
    primaryColor: dbCard.primary_color,
    secondaryColor: dbCard.secondary_color,
    isCustom: dbCard.is_custom,
    hasStatement,
    parsingInProgress,
    // Transform joined benefits
    benefits: dbBenefits
      ? dbBenefits.map(dbBenefitToApiBenefit)
      : dbCard.card_benefits?.map(dbBenefitToApiBenefit) || [],
    createdAt: new Date(dbCard.created_at),
    updatedAt: new Date(dbCard.updated_at),
  };
}

/**
 * Convert database benefit (snake_case) to API benefit (camelCase)
 */
export function dbBenefitToApiBenefit(dbBenefit: any): CardBenefit {
  return {
    id: dbBenefit.id,
    cardId: dbBenefit.card_id,
    category: dbBenefit.category,
    rewardRate: dbBenefit.reward_rate,
    rewardType: dbBenefit.reward_type,
    rewardCap: dbBenefit.reward_cap,
    conditions: dbBenefit.conditions,
    isActive: dbBenefit.is_active,
    validFrom: dbBenefit.valid_from
      ? new Date(dbBenefit.valid_from)
      : undefined,
    validUntil: dbBenefit.valid_until
      ? new Date(dbBenefit.valid_until)
      : undefined,
    description: dbBenefit.description,
    value: dbBenefit.value,
  };
}

/**
 * Convert API card data (camelCase) to database format (snake_case) for INSERT/UPDATE
 */
export function apiCardToDbCard(card: Partial<Card>): Partial<DatabaseCard> {
  const dbCard: any = {};

  if (card.userId !== undefined) dbCard.user_id = card.userId;
  if (card.bankName !== undefined) dbCard.bank_name = card.bankName;
  if (card.cardName !== undefined) dbCard.card_name = card.cardName;
  if (card.lastFourDigits !== undefined)
    dbCard.last_four_digits = card.lastFourDigits;
  if (card.cardType !== undefined) dbCard.card_type = card.cardType;
  if (card.network !== undefined) dbCard.network = card.network;
  if (card.rewardType !== undefined) dbCard.reward_type = card.rewardType;
  if (card.annualFee !== undefined) dbCard.annual_fee = card.annualFee;
  if (card.currency !== undefined) dbCard.currency = card.currency;
  if (card.status !== undefined) dbCard.status = card.status;
  if (card.issueDate !== undefined) dbCard.issue_date = card.issueDate;
  if (card.expiryDate !== undefined) dbCard.expiry_date = card.expiryDate;
  if (card.creditLimit !== undefined) dbCard.credit_limit = card.creditLimit;
  if (card.availableCredit !== undefined)
    dbCard.available_credit = card.availableCredit;
  if (card.billingDay !== undefined) dbCard.billing_day = card.billingDay;
  if (card.cardMetadataId !== undefined)
    dbCard.card_metadata_id = card.cardMetadataId;
  if (card.bankId !== undefined) dbCard.bank_id = card.bankId;
  if (card.primaryColor !== undefined) dbCard.primary_color = card.primaryColor;
  if (card.secondaryColor !== undefined)
    dbCard.secondary_color = card.secondaryColor;
  if (card.isCustom !== undefined) dbCard.is_custom = card.isCustom;

  return dbCard;
}

/**
 * Convert API benefit data (camelCase) to database format (snake_case) for INSERT/UPDATE
 */
export function apiBenefitToDbBenefit(
  benefit: Partial<CardBenefit>,
): Partial<DatabaseCardBenefit> {
  const dbBenefit: any = {};

  if (benefit.cardId !== undefined) dbBenefit.card_id = benefit.cardId;
  if (benefit.category !== undefined) dbBenefit.category = benefit.category;
  if (benefit.rewardRate !== undefined)
    dbBenefit.reward_rate = benefit.rewardRate;
  if (benefit.rewardType !== undefined)
    dbBenefit.reward_type = benefit.rewardType;
  if (benefit.rewardCap !== undefined) dbBenefit.reward_cap = benefit.rewardCap;
  if (benefit.conditions !== undefined)
    dbBenefit.conditions = benefit.conditions;
  if (benefit.isActive !== undefined) dbBenefit.is_active = benefit.isActive;
  if (benefit.validFrom !== undefined) dbBenefit.valid_from = benefit.validFrom;
  if (benefit.validUntil !== undefined)
    dbBenefit.valid_until = benefit.validUntil;
  if (benefit.description !== undefined)
    dbBenefit.description = benefit.description;
  if (benefit.value !== undefined) dbBenefit.value = benefit.value;

  return dbBenefit;
}

/**
 * Helper to convert array of DB cards to API cards
 */
export function dbCardsToApiCards(dbCards: any[]): Card[] {
  return dbCards.map(dbCard => dbCardToApiCard(dbCard));
}

/**
 * Helper to convert array of DB benefits to API benefits
 */
export function dbBenefitsToApiBenefits(dbBenefits: any[]): CardBenefit[] {
  return dbBenefits.map(dbBenefitToApiBenefit);
}

/**
 * Convert database user (snake_case) to API user (camelCase)
 * Ensures consistent user data transformation across all API responses
 */
export function dbUserToApiUser(dbUser: any) {
  return {
    id: dbUser.id,
    phoneNumber: dbUser.phone_number,
    firstName: dbUser.profile_data?.firstName || '',
    lastName: dbUser.profile_data?.lastName || '',
    onboardingCompleted: dbUser.onboarding_completed || false,
    isVerified: dbUser.is_verified,
    biometricEnabled: dbUser.biometric_enabled,
    notificationsEnabled: dbUser.notifications_enabled || false,
    createdAt: dbUser.created_at,
    updatedAt: dbUser.updated_at,
    lastLogin: dbUser.last_login,
    // Also include profileData for backwards compatibility
    profileData: {
      firstName: dbUser.profile_data?.firstName || '',
      lastName: dbUser.profile_data?.lastName || '',
    },
  };
}
