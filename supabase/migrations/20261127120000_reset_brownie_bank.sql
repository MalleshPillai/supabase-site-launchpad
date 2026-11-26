-- Safe additive reset for testing: clears brownie ledger, balances, related redemptions,
-- brownie-tied notifications, and brownie achievement unlocks for the pair.

CREATE OR REPLACE FUNCTION public.reset_brownie_bank()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_relationship_member() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  DELETE FROM public.brownie_transactions
  WHERE sender_id IN (SELECT user_id FROM public.relationship_members WHERE user_id IS NOT NULL)
     OR recipient_id IN (SELECT user_id FROM public.relationship_members WHERE user_id IS NOT NULL);

  DELETE FROM public.redemption_requests
  WHERE requester_id IN (SELECT user_id FROM public.relationship_members WHERE user_id IS NOT NULL)
     OR reward_owner_id IN (SELECT user_id FROM public.relationship_members WHERE user_id IS NOT NULL);

  UPDATE public.brownie_balances
  SET balance = 0
  WHERE user_id IN (SELECT user_id FROM public.relationship_members WHERE user_id IS NOT NULL);

  DELETE FROM public.user_achievements
  WHERE user_id IN (SELECT user_id FROM public.relationship_members WHERE user_id IS NOT NULL)
    AND achievement_code IN (
      'first-brownie',
      '50-brownies',
      '100-brownies',
      '250-brownies',
      '500-combined-brownies',
      '1000-combined-brownies'
    );

  DELETE FROM public.notifications
  WHERE notification_type IN (
    'brownies_received',
    'reward_requested',
    'reward_accepted',
    'reward_declined',
    'reward_completed'
  )
  AND recipient_id IN (SELECT user_id FROM public.relationship_members WHERE user_id IS NOT NULL);

  PERFORM public.refresh_pair_achievements();
END;
$$;

REVOKE ALL ON FUNCTION public.reset_brownie_bank() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.reset_brownie_bank() TO authenticated;