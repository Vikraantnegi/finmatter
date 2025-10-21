-- Add parsing_in_progress flag to cards table
-- Migration: 20251019170000_add_parsing_in_progress_flag.sql

-- Add parsing_in_progress column to track if any statement is currently being parsed
ALTER TABLE public.cards 
ADD COLUMN IF NOT EXISTS parsing_in_progress BOOLEAN DEFAULT FALSE;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_cards_parsing_in_progress ON public.cards(parsing_in_progress) WHERE deleted_at IS NULL;

-- Add comment
COMMENT ON COLUMN public.cards.parsing_in_progress IS 'Indicates if any statement for this card is currently being parsed';

-- Create function to update parsing_in_progress based on statements
CREATE OR REPLACE FUNCTION update_card_parsing_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the card's parsing_in_progress flag based on statements
  UPDATE public.cards 
  SET parsing_in_progress = EXISTS (
    SELECT 1 FROM public.statements 
    WHERE card_id = COALESCE(NEW.card_id, OLD.card_id)
    AND parsing_status = 'processing'
  )
  WHERE id = COALESCE(NEW.card_id, OLD.card_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update parsing_in_progress when statement status changes
DROP TRIGGER IF EXISTS trigger_update_card_parsing_status ON public.statements;
CREATE TRIGGER trigger_update_card_parsing_status
  AFTER INSERT OR UPDATE OR DELETE ON public.statements
  FOR EACH ROW
  EXECUTE FUNCTION update_card_parsing_status();

-- Update existing cards to have correct parsing_in_progress status
UPDATE public.cards 
SET parsing_in_progress = EXISTS (
  SELECT 1 FROM public.statements 
  WHERE card_id = cards.id 
  AND parsing_status = 'processing'
);

