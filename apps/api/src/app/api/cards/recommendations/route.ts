import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';
import { createCorsResponse, handleCorsPreflight } from '@/lib/cors';
import { FinMatterError } from '@finmatter/shared';
import { z } from 'zod';

const RecommendationRequestSchema = z.object({
  spendingCategories: z.record(z.number()).optional(),
  monthlySpend: z.number().optional(),
  preferredCardType: z.enum(['credit', 'debit', 'prepaid']).optional(),
  bankPreference: z.array(z.string()).optional(),
  maxAnnualFee: z.number().optional(),
  excludeCardIds: z.array(z.string()).optional(),
});

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  return handleCorsPreflight(origin || undefined);
}

/**
 * POST /api/cards/recommendations
 *
 * Get personalized card recommendations based on spending patterns
 *
 * Body:
 * - spendingCategories: { category: amount }
 * - monthlySpend: total monthly spending
 * - preferredCardType: 'credit' | 'debit' | 'prepaid'
 * - bankPreference: array of preferred banks
 * - maxAnnualFee: maximum annual fee willing to pay
 * - excludeCardIds: array of card IDs to exclude
 */
export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');

  try {
    // Get auth user
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return createCorsResponse(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        },
        { status: 401, origin: origin || undefined },
      );
    }

    const token = authHeader.split(' ')[1];
    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return createCorsResponse(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Invalid authentication token',
          },
        },
        { status: 401, origin: origin || undefined },
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = RecommendationRequestSchema.safeParse(body);

    if (!validation.success) {
      return createCorsResponse(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request data',
            details: validation.error.errors,
          },
        },
        { status: 400, origin: origin || undefined },
      );
    }

    const params = validation.data;

    // Get user's existing cards to exclude
    const { data: existingCards } = await supabaseAdmin
      .from('cards')
      .select('id')
      .eq('user_id', user.id)
      .eq('is_active', true);

    const excludeIds = [
      ...(params.excludeCardIds || []),
      ...(existingCards?.map(c => c.id) || []),
    ];

    // Build query
    let query = supabaseAdmin
      .from('cards_metadata')
      .select('*')
      .eq('is_active', true);

    if (params.maxAnnualFee !== undefined) {
      query = query.lte('annual_fee', params.maxAnnualFee);
    }

    if (params.preferredCardType) {
      query = query.eq('card_type', params.preferredCardType);
    }

    if (params.bankPreference && params.bankPreference.length > 0) {
      query = query.in('bank_name', params.bankPreference);
    }

    const { data: allCards, error: cardsError } = await query;

    if (cardsError) {
      throw new FinMatterError(
        'Failed to fetch cards',
        'DB_QUERY_FAILED',
        500,
        { error: cardsError },
      );
    }

    // Score and rank cards based on user's spending patterns
    const scoredCards = allCards
      ?.map(card => {
        const benefits = (card.benefits as any[]) || [];
        let score = 0;
        let estimatedAnnualRewards = 0;
        const benefitCategories: string[] = [];

        // Calculate rewards for each category
        if (params.spendingCategories) {
          for (const [category, monthlyAmount] of Object.entries(
            params.spendingCategories,
          )) {
            const annualAmount = monthlyAmount * 12;

            // Find matching benefit
            const matchingBenefit = benefits.find(
              (b: any) => b.category === category || b.category === 'default',
            );

            if (matchingBenefit && matchingBenefit.rewardRate > 0) {
              const rewardAmount =
                (annualAmount * matchingBenefit.rewardRate) / 100;
              estimatedAnnualRewards += rewardAmount;
              benefitCategories.push(category);

              // Score based on reward rate (higher rate = higher score)
              score += matchingBenefit.rewardRate * (monthlyAmount / 1000);
            }
          }
        }

        // Factor in annual fee
        const netValue =
          estimatedAnnualRewards - parseFloat(card.annual_fee || 0);

        // Score adjustments
        if (card.annual_fee === 0 || card.annual_fee === '0.00') {
          score += 50; // Bonus for lifetime free
        }

        // Check for additional features
        const features = (card.features as any[]) || [];
        const hasLoungeAccess = benefits.some(
          (b: any) => b.category === 'lounge',
        );
        if (hasLoungeAccess) score += 20;

        // TODO: Check against user's actual eligibility
        // For now, just mark as eligible for all cards
        const eligible = true;

        return {
          card: {
            id: card.id,
            card_name: card.card_name,
            bank_name: card.bank_name,
            card_type: card.card_type,
            network: card.network,
            reward_type: card.reward_type,
            annual_fee: card.annual_fee,
            primary_color: card.primary_color,
            secondary_color: card.secondary_color,
            description: card.description,
            benefits,
            features,
          },
          score,
          estimatedAnnualRewards,
          netValue,
          benefitCategories,
          eligible,
          recommendationReason: generateRecommendationReason(
            card,
            estimatedAnnualRewards,
            netValue,
            benefitCategories,
          ),
        };
      })
      .filter(item => !excludeIds.includes(item.card.id))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5); // Top 5 recommendations

    return createCorsResponse(
      {
        success: true,
        data: {
          recommendations: scoredCards,
          summary: {
            totalCardsEvaluated: allCards?.length || 0,
            recommendationsGenerated: scoredCards.length,
          },
        },
      },
      { origin: origin || undefined },
    );
  } catch (error) {
    if (error instanceof FinMatterError) {
      return createCorsResponse(
        {
          success: false,
          error: {
            code: error.code,
            message: error.message,
          },
        },
        { status: error.statusCode, origin: origin || undefined },
      );
    }

    console.error('Card recommendations API error:', error);
    return createCorsResponse(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
        },
      },
      { status: 500, origin: origin || undefined },
    );
  }
}

/**
 * Generate human-readable recommendation reason
 */
function generateRecommendationReason(
  card: any,
  estimatedRewards: number,
  netValue: number,
  benefitCategories: string[],
): string {
  const reasons: string[] = [];

  // Reward value
  if (estimatedRewards > 0) {
    reasons.push(`Earn up to ₹${Math.round(estimatedRewards)} annually`);
  }

  // Annual fee
  if (card.annual_fee === 0 || card.annual_fee === '0.00') {
    reasons.push('Lifetime free');
  } else if (netValue > 0) {
    reasons.push(`Net value of ₹${Math.round(netValue)} after fees`);
  }

  // Category benefits
  if (benefitCategories.length > 0) {
    reasons.push(`Best for: ${benefitCategories.slice(0, 2).join(', ')}`);
  }

  return reasons.join(' • ');
}
