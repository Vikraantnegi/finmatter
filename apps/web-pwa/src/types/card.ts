import { Card as BaseCard } from '@finmatter/types';

export interface Card extends BaseCard {
  hasStatement?: boolean;
}
