CREATE TABLE public.relationship_members (
  slot SMALLINT PRIMARY KEY CHECK (slot IN (1, 2)),
  email TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL UNIQUE,
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT relationship_member_identity_check CHECK (
    (slot = 1 AND lower(email) = 'malleshpillai18@gmail.com' AND display_name = 'Mallesh') OR
    (slot = 2 AND lower(email) = 'darshinimallu@gmail.com' AND display_name = 'Darshu')
  )
);
GRANT SELECT ON public.relationship_members TO authenticated;
GRANT ALL ON public.relationship_members TO service_role;
ALTER TABLE public.relationship_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can read only their own access record" ON public.relationship_members FOR SELECT TO authenticated USING (user_id = auth.uid());

INSERT INTO public.relationship_members (slot, email, display_name) VALUES
  (1, 'malleshpillai18@gmail.com', 'Mallesh'),
  (2, 'darshinimallu@gmail.com', 'Darshu');

CREATE OR REPLACE FUNCTION public.is_relationship_member()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.relationship_members WHERE user_id = auth.uid());
$$;
REVOKE ALL ON FUNCTION public.is_relationship_member() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_relationship_member() TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TABLE public.profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL CHECK (length(trim(display_name)) BETWEEN 1 AND 60),
  bio TEXT NOT NULL DEFAULT '' CHECK (length(bio) <= 280),
  birthday DATE,
  avatar_path TEXT,
  theme_preferences JSONB NOT NULL DEFAULT '{}'::jsonb,
  notification_preferences JSONB NOT NULL DEFAULT '{"in_app": true}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can view their own profile" ON public.profiles FOR SELECT TO authenticated USING (user_id = auth.uid() AND public.is_relationship_member());
CREATE POLICY "Members can update their own profile" ON public.profiles FOR UPDATE TO authenticated USING (user_id = auth.uid() AND public.is_relationship_member()) WITH CHECK (user_id = auth.uid() AND public.is_relationship_member());

CREATE TABLE public.albums (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL CHECK (length(trim(name)) BETWEEN 1 AND 80),
  description TEXT NOT NULL DEFAULT '' CHECK (length(description) <= 500),
  created_by UUID REFERENCES auth.users(id) ON DELETE RESTRICT,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.albums TO authenticated;
GRANT ALL ON public.albums TO service_role;
ALTER TABLE public.albums ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Pair members can view albums" ON public.albums FOR SELECT TO authenticated USING (public.is_relationship_member());
CREATE POLICY "Members can create custom albums" ON public.albums FOR INSERT TO authenticated WITH CHECK (public.is_relationship_member() AND created_by = auth.uid() AND NOT is_default);
CREATE POLICY "Creators can update custom albums" ON public.albums FOR UPDATE TO authenticated USING (public.is_relationship_member() AND created_by = auth.uid() AND NOT is_default) WITH CHECK (public.is_relationship_member() AND created_by = auth.uid() AND NOT is_default);
CREATE POLICY "Creators can delete custom albums" ON public.albums FOR DELETE TO authenticated USING (public.is_relationship_member() AND created_by = auth.uid() AND NOT is_default);
CREATE UNIQUE INDEX albums_default_name_unique ON public.albums (lower(name)) WHERE is_default;

CREATE TABLE public.memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uploaded_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  album_id UUID REFERENCES public.albums(id) ON DELETE SET NULL,
  caption TEXT NOT NULL DEFAULT '' CHECK (length(caption) <= 1000),
  memory_date DATE NOT NULL DEFAULT CURRENT_DATE,
  location TEXT NOT NULL DEFAULT '' CHECK (length(location) <= 200),
  occasion TEXT NOT NULL DEFAULT '' CHECK (length(occasion) <= 80),
  photo_path TEXT NOT NULL,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (photo_path)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.memories TO authenticated;
GRANT ALL ON public.memories TO service_role;
ALTER TABLE public.memories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Pair members can view shared memories" ON public.memories FOR SELECT TO authenticated USING (public.is_relationship_member());
CREATE POLICY "Members can add their own memories" ON public.memories FOR INSERT TO authenticated WITH CHECK (public.is_relationship_member() AND uploaded_by = auth.uid());
CREATE POLICY "Uploaders can edit their own memories" ON public.memories FOR UPDATE TO authenticated USING (public.is_relationship_member() AND uploaded_by = auth.uid()) WITH CHECK (public.is_relationship_member() AND uploaded_by = auth.uid());
CREATE POLICY "Uploaders can delete their own memories" ON public.memories FOR DELETE TO authenticated USING (public.is_relationship_member() AND uploaded_by = auth.uid());
CREATE INDEX memories_date_idx ON public.memories (memory_date DESC);
CREATE INDEX memories_album_idx ON public.memories (album_id);
CREATE INDEX memories_uploader_idx ON public.memories (uploaded_by);

CREATE TABLE public.memory_favourites (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  memory_id UUID NOT NULL REFERENCES public.memories(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, memory_id)
);
GRANT SELECT, INSERT, DELETE ON public.memory_favourites TO authenticated;
GRANT ALL ON public.memory_favourites TO service_role;
ALTER TABLE public.memory_favourites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can view their own favourites" ON public.memory_favourites FOR SELECT TO authenticated USING (public.is_relationship_member() AND user_id = auth.uid());
CREATE POLICY "Members can favourite shared memories" ON public.memory_favourites FOR INSERT TO authenticated WITH CHECK (public.is_relationship_member() AND user_id = auth.uid());
CREATE POLICY "Members can remove their own favourites" ON public.memory_favourites FOR DELETE TO authenticated USING (public.is_relationship_member() AND user_id = auth.uid());

CREATE TABLE public.memory_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  memory_id UUID NOT NULL REFERENCES public.memories(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  tag TEXT NOT NULL CHECK (length(trim(tag)) BETWEEN 1 AND 40),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (memory_id, created_by, tag)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.memory_tags TO authenticated;
GRANT ALL ON public.memory_tags TO service_role;
ALTER TABLE public.memory_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Pair members can view memory tags" ON public.memory_tags FOR SELECT TO authenticated USING (public.is_relationship_member());
CREATE POLICY "Members can add their own tags" ON public.memory_tags FOR INSERT TO authenticated WITH CHECK (public.is_relationship_member() AND created_by = auth.uid());
CREATE POLICY "Members can edit their own tags" ON public.memory_tags FOR UPDATE TO authenticated USING (public.is_relationship_member() AND created_by = auth.uid()) WITH CHECK (public.is_relationship_member() AND created_by = auth.uid());
CREATE POLICY "Members can remove their own tags" ON public.memory_tags FOR DELETE TO authenticated USING (public.is_relationship_member() AND created_by = auth.uid());
CREATE INDEX memory_tags_memory_idx ON public.memory_tags (memory_id);

CREATE TABLE public.brownie_balances (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE RESTRICT,
  balance INTEGER NOT NULL DEFAULT 0 CHECK (balance >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.brownie_balances TO authenticated;
GRANT ALL ON public.brownie_balances TO service_role;
ALTER TABLE public.brownie_balances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Pair members can view both balances" ON public.brownie_balances FOR SELECT TO authenticated USING (public.is_relationship_member());

CREATE TABLE public.rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  title TEXT NOT NULL CHECK (length(trim(title)) BETWEEN 1 AND 120),
  description TEXT NOT NULL DEFAULT '' CHECK (length(description) <= 1000),
  points_cost INTEGER NOT NULL CHECK (points_cost > 0),
  category TEXT NOT NULL CHECK (category IN ('food', 'dates', 'experiences', 'gifts', 'surprises', 'personal_wishes', 'custom')),
  cover_path TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rewards TO authenticated;
GRANT ALL ON public.rewards TO service_role;
ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Pair members can view rewards" ON public.rewards FOR SELECT TO authenticated USING (public.is_relationship_member());
CREATE POLICY "Members can create their own rewards" ON public.rewards FOR INSERT TO authenticated WITH CHECK (public.is_relationship_member() AND created_by = auth.uid());
CREATE POLICY "Creators can update their rewards" ON public.rewards FOR UPDATE TO authenticated USING (public.is_relationship_member() AND created_by = auth.uid()) WITH CHECK (public.is_relationship_member() AND created_by = auth.uid());
CREATE POLICY "Creators can delete their rewards" ON public.rewards FOR DELETE TO authenticated USING (public.is_relationship_member() AND created_by = auth.uid());
CREATE INDEX rewards_active_idx ON public.rewards (is_active, created_at DESC);

CREATE TABLE public.redemption_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  reward_id UUID NOT NULL REFERENCES public.rewards(id) ON DELETE RESTRICT,
  reward_owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  points_cost INTEGER NOT NULL CHECK (points_cost > 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'completed', 'cancelled')),
  message TEXT NOT NULL DEFAULT '' CHECK (length(message) <= 500),
  response TEXT NOT NULL DEFAULT '' CHECK (length(response) <= 500),
  idempotency_key UUID NOT NULL,
  accepted_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (requester_id, idempotency_key)
);
GRANT SELECT ON public.redemption_requests TO authenticated;
GRANT ALL ON public.redemption_requests TO service_role;
ALTER TABLE public.redemption_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Participants can view redemption requests" ON public.redemption_requests FOR SELECT TO authenticated USING (public.is_relationship_member() AND auth.uid() IN (requester_id, reward_owner_id));
CREATE INDEX redemption_requests_owner_status_idx ON public.redemption_requests (reward_owner_id, status, created_at DESC);
CREATE INDEX redemption_requests_requester_idx ON public.redemption_requests (requester_id, created_at DESC);

CREATE TABLE public.brownie_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  points INTEGER NOT NULL CHECK (points > 0),
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('award', 'reward_redemption')),
  message TEXT NOT NULL DEFAULT '' CHECK (length(message) <= 500),
  reason TEXT NOT NULL DEFAULT '' CHECK (length(reason) <= 80),
  idempotency_key UUID NOT NULL,
  redemption_request_id UUID REFERENCES public.redemption_requests(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (sender_id, idempotency_key),
  UNIQUE (redemption_request_id),
  CHECK (sender_id <> recipient_id OR transaction_type = 'reward_redemption')
);
GRANT SELECT ON public.brownie_transactions TO authenticated;
GRANT ALL ON public.brownie_transactions TO service_role;
ALTER TABLE public.brownie_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Pair members can view brownie history" ON public.brownie_transactions FOR SELECT TO authenticated USING (public.is_relationship_member());
CREATE INDEX brownie_transactions_created_idx ON public.brownie_transactions (created_at DESC);
CREATE INDEX brownie_transactions_sender_idx ON public.brownie_transactions (sender_id, created_at DESC);
CREATE INDEX brownie_transactions_recipient_idx ON public.brownie_transactions (recipient_id, created_at DESC);

CREATE TABLE public.letters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  letter_type TEXT NOT NULL CHECK (letter_type IN ('love_letter', 'open_when_happy', 'open_when_sad', 'open_when_bored', 'open_when_miss_me', 'open_when_motivation', 'birthday', 'custom')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent')),
  unlock_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  attachment_path TEXT,
  sent_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  unlock_notification_sent BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (sender_id <> recipient_id),
  CHECK ((status = 'draft' AND sent_at IS NULL) OR (status = 'sent' AND sent_at IS NOT NULL))
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.letters TO authenticated;
GRANT ALL ON public.letters TO service_role;
ALTER TABLE public.letters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Senders and recipients can view letter envelopes" ON public.letters FOR SELECT TO authenticated USING (public.is_relationship_member() AND (sender_id = auth.uid() OR (recipient_id = auth.uid() AND status = 'sent')));
CREATE POLICY "Members can create their own letter drafts" ON public.letters FOR INSERT TO authenticated WITH CHECK (public.is_relationship_member() AND sender_id = auth.uid() AND status = 'draft' AND sent_at IS NULL AND recipient_id <> auth.uid());
CREATE POLICY "Members can edit their own drafts" ON public.letters FOR UPDATE TO authenticated USING (public.is_relationship_member() AND sender_id = auth.uid() AND status = 'draft') WITH CHECK (public.is_relationship_member() AND sender_id = auth.uid() AND status = 'draft' AND sent_at IS NULL);
CREATE POLICY "Members can delete their own drafts" ON public.letters FOR DELETE TO authenticated USING (public.is_relationship_member() AND sender_id = auth.uid() AND status = 'draft');
CREATE INDEX letters_recipient_unlock_idx ON public.letters (recipient_id, status, unlock_at);
CREATE INDEX letters_sender_created_idx ON public.letters (sender_id, created_at DESC);

CREATE TABLE public.letter_contents (
  letter_id UUID PRIMARY KEY REFERENCES public.letters(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (length(trim(title)) BETWEEN 1 AND 160),
  body TEXT NOT NULL CHECK (length(trim(body)) BETWEEN 1 AND 10000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.letter_contents TO authenticated;
GRANT ALL ON public.letter_contents TO service_role;
ALTER TABLE public.letter_contents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Only the sender or unlocked recipient can read letter contents" ON public.letter_contents FOR SELECT TO authenticated USING (
  public.is_relationship_member() AND EXISTS (
    SELECT 1 FROM public.letters l WHERE l.id = letter_id AND
    (l.sender_id = auth.uid() OR (l.recipient_id = auth.uid() AND l.status = 'sent' AND l.unlock_at <= now()))
  )
);
CREATE POLICY "Senders can write contents for their drafts" ON public.letter_contents FOR INSERT TO authenticated WITH CHECK (
  public.is_relationship_member() AND EXISTS (SELECT 1 FROM public.letters l WHERE l.id = letter_id AND l.sender_id = auth.uid() AND l.status = 'draft')
);
CREATE POLICY "Senders can edit contents for their drafts" ON public.letter_contents FOR UPDATE TO authenticated USING (
  public.is_relationship_member() AND EXISTS (SELECT 1 FROM public.letters l WHERE l.id = letter_id AND l.sender_id = auth.uid() AND l.status = 'draft')
) WITH CHECK (
  public.is_relationship_member() AND EXISTS (SELECT 1 FROM public.letters l WHERE l.id = letter_id AND l.sender_id = auth.uid() AND l.status = 'draft')
);
CREATE POLICY "Senders can remove contents for their drafts" ON public.letter_contents FOR DELETE TO authenticated USING (
  public.is_relationship_member() AND EXISTS (SELECT 1 FROM public.letters l WHERE l.id = letter_id AND l.sender_id = auth.uid() AND l.status = 'draft')
);

CREATE TABLE public.happiness_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  category TEXT NOT NULL CHECK (category IN ('appreciation', 'favourite_things', 'funny_moments', 'happy_things', 'compliments', 'memories', 'encouragement', 'custom')),
  content TEXT NOT NULL CHECK (length(trim(content)) BETWEEN 1 AND 1000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.happiness_notes TO authenticated;
GRANT ALL ON public.happiness_notes TO service_role;
ALTER TABLE public.happiness_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Pair members can view happiness notes" ON public.happiness_notes FOR SELECT TO authenticated USING (public.is_relationship_member());
CREATE POLICY "Members can add their own happiness notes" ON public.happiness_notes FOR INSERT TO authenticated WITH CHECK (public.is_relationship_member() AND created_by = auth.uid());
CREATE POLICY "Members can edit their own happiness notes" ON public.happiness_notes FOR UPDATE TO authenticated USING (public.is_relationship_member() AND created_by = auth.uid()) WITH CHECK (public.is_relationship_member() AND created_by = auth.uid());
CREATE POLICY "Members can delete their own happiness notes" ON public.happiness_notes FOR DELETE TO authenticated USING (public.is_relationship_member() AND created_by = auth.uid());
CREATE INDEX happiness_notes_created_idx ON public.happiness_notes (created_at DESC);

CREATE TABLE public.timeline_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  title TEXT NOT NULL CHECK (length(trim(title)) BETWEEN 1 AND 120),
  description TEXT NOT NULL DEFAULT '' CHECK (length(description) <= 1500),
  event_date DATE NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('first_memories', 'birthdays', 'trips', 'celebrations', 'milestones', 'special_dates', 'personal_moments')),
  location TEXT NOT NULL DEFAULT '' CHECK (length(location) <= 200),
  photo_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.timeline_events TO authenticated;
GRANT ALL ON public.timeline_events TO service_role;
ALTER TABLE public.timeline_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Pair members can view timeline events" ON public.timeline_events FOR SELECT TO authenticated USING (public.is_relationship_member());
CREATE POLICY "Members can add their own timeline events" ON public.timeline_events FOR INSERT TO authenticated WITH CHECK (public.is_relationship_member() AND created_by = auth.uid());
CREATE POLICY "Members can edit their own timeline events" ON public.timeline_events FOR UPDATE TO authenticated USING (public.is_relationship_member() AND created_by = auth.uid()) WITH CHECK (public.is_relationship_member() AND created_by = auth.uid());
CREATE POLICY "Members can delete their own timeline events" ON public.timeline_events FOR DELETE TO authenticated USING (public.is_relationship_member() AND created_by = auth.uid());
CREATE INDEX timeline_events_date_idx ON public.timeline_events (event_date DESC);

CREATE TABLE public.bucket_list_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  added_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  title TEXT NOT NULL CHECK (length(trim(title)) BETWEEN 1 AND 160),
  description TEXT NOT NULL DEFAULT '' CHECK (length(description) <= 1000),
  category TEXT NOT NULL CHECK (category IN ('places', 'food', 'adventures', 'movies', 'experiences', 'personal_goals', 'travel', 'custom')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  is_completed BOOLEAN NOT NULL DEFAULT false,
  completed_by UUID REFERENCES auth.users(id) ON DELETE RESTRICT,
  completed_at TIMESTAMPTZ,
  image_path TEXT,
  completion_photo_path TEXT,
  completion_note TEXT NOT NULL DEFAULT '' CHECK (length(completion_note) <= 1000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK ((is_completed = false AND completed_at IS NULL) OR (is_completed = true AND completed_at IS NOT NULL))
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bucket_list_items TO authenticated;
GRANT ALL ON public.bucket_list_items TO service_role;
ALTER TABLE public.bucket_list_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Pair members can view bucket list" ON public.bucket_list_items FOR SELECT TO authenticated USING (public.is_relationship_member());
CREATE POLICY "Members can add bucket list items" ON public.bucket_list_items FOR INSERT TO authenticated WITH CHECK (public.is_relationship_member() AND added_by = auth.uid());
CREATE POLICY "Pair members can update bucket list items" ON public.bucket_list_items FOR UPDATE TO authenticated USING (public.is_relationship_member()) WITH CHECK (public.is_relationship_member());
CREATE POLICY "Pair members can delete bucket list items" ON public.bucket_list_items FOR DELETE TO authenticated USING (public.is_relationship_member());
CREATE INDEX bucket_list_status_idx ON public.bucket_list_items (is_completed, priority, created_at DESC);

CREATE TABLE public.game_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  question_type TEXT NOT NULL CHECK (question_type IN ('know_you', 'two_truths', 'guess_my_answer', 'daily_question')),
  prompt TEXT NOT NULL CHECK (length(trim(prompt)) BETWEEN 1 AND 500),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.game_questions TO authenticated;
GRANT ALL ON public.game_questions TO service_role;
ALTER TABLE public.game_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Pair members can view game prompts" ON public.game_questions FOR SELECT TO authenticated USING (public.is_relationship_member());
CREATE POLICY "Members can create game prompts" ON public.game_questions FOR INSERT TO authenticated WITH CHECK (public.is_relationship_member() AND created_by = auth.uid());
CREATE POLICY "Creators can edit game prompts" ON public.game_questions FOR UPDATE TO authenticated USING (public.is_relationship_member() AND created_by = auth.uid()) WITH CHECK (public.is_relationship_member() AND created_by = auth.uid());
CREATE POLICY "Creators can remove game prompts" ON public.game_questions FOR DELETE TO authenticated USING (public.is_relationship_member() AND created_by = auth.uid());

CREATE TABLE public.game_question_secrets (
  question_id UUID PRIMARY KEY REFERENCES public.game_questions(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  answer_text TEXT NOT NULL CHECK (length(answer_text) <= 1000),
  truth_one TEXT CHECK (length(truth_one) <= 500),
  truth_two TEXT CHECK (length(truth_two) <= 500),
  truth_three TEXT CHECK (length(truth_three) <= 500),
  lie_index SMALLINT CHECK (lie_index BETWEEN 1 AND 3),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK ((truth_one IS NULL AND truth_two IS NULL AND truth_three IS NULL AND lie_index IS NULL) OR (truth_one IS NOT NULL AND truth_two IS NOT NULL AND truth_three IS NOT NULL AND lie_index IS NOT NULL))
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.game_question_secrets TO authenticated;
GRANT ALL ON public.game_question_secrets TO service_role;
ALTER TABLE public.game_question_secrets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Only question creators can read answer keys" ON public.game_question_secrets FOR SELECT TO authenticated USING (public.is_relationship_member() AND created_by = auth.uid());
CREATE POLICY "Question creators can save answer keys" ON public.game_question_secrets FOR INSERT TO authenticated WITH CHECK (public.is_relationship_member() AND created_by = auth.uid() AND EXISTS (SELECT 1 FROM public.game_questions q WHERE q.id = question_id AND q.created_by = auth.uid()));
CREATE POLICY "Question creators can edit answer keys" ON public.game_question_secrets FOR UPDATE TO authenticated USING (public.is_relationship_member() AND created_by = auth.uid()) WITH CHECK (public.is_relationship_member() AND created_by = auth.uid());
CREATE POLICY "Question creators can delete answer keys" ON public.game_question_secrets FOR DELETE TO authenticated USING (public.is_relationship_member() AND created_by = auth.uid());

CREATE TABLE public.game_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  opponent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  question_id UUID REFERENCES public.game_questions(id) ON DELETE SET NULL,
  game_type TEXT NOT NULL CHECK (game_type IN ('know_you', 'guess_memory', 'two_truths', 'guess_my_answer', 'date_idea', 'daily_question')),
  prompt TEXT NOT NULL DEFAULT '' CHECK (length(prompt) <= 1000),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'completed')),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (created_by <> opponent_id),
  CHECK ((status = 'open' AND completed_at IS NULL) OR (status = 'completed' AND completed_at IS NOT NULL))
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.game_sessions TO authenticated;
GRANT ALL ON public.game_sessions TO service_role;
ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Pair members can view game sessions" ON public.game_sessions FOR SELECT TO authenticated USING (public.is_relationship_member());
CREATE POLICY "Members can start game sessions" ON public.game_sessions FOR INSERT TO authenticated WITH CHECK (public.is_relationship_member() AND created_by = auth.uid());
CREATE POLICY "Pair members can update game sessions" ON public.game_sessions FOR UPDATE TO authenticated USING (public.is_relationship_member()) WITH CHECK (public.is_relationship_member());
CREATE POLICY "Creators can delete their open games" ON public.game_sessions FOR DELETE TO authenticated USING (public.is_relationship_member() AND created_by = auth.uid() AND status = 'open');
CREATE INDEX game_sessions_created_idx ON public.game_sessions (created_at DESC);

CREATE TABLE public.game_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.game_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  answer_text TEXT NOT NULL DEFAULT '' CHECK (length(answer_text) <= 2000),
  selected_index SMALLINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (session_id, user_id)
);
GRANT SELECT, INSERT, UPDATE ON public.game_answers TO authenticated;
GRANT ALL ON public.game_answers TO service_role;
ALTER TABLE public.game_answers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Players can read own answers and completed answers" ON public.game_answers FOR SELECT TO authenticated USING (
  public.is_relationship_member() AND (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.game_sessions s WHERE s.id = session_id AND s.status = 'completed'))
);
CREATE POLICY "Players can submit their own answers" ON public.game_answers FOR INSERT TO authenticated WITH CHECK (
  public.is_relationship_member() AND user_id = auth.uid() AND EXISTS (SELECT 1 FROM public.game_sessions s WHERE s.id = session_id AND auth.uid() IN (s.created_by, s.opponent_id) AND s.status = 'open')
);
CREATE POLICY "Players can edit their own open answers" ON public.game_answers FOR UPDATE TO authenticated USING (
  public.is_relationship_member() AND user_id = auth.uid() AND EXISTS (SELECT 1 FROM public.game_sessions s WHERE s.id = session_id AND s.status = 'open')
) WITH CHECK (public.is_relationship_member() AND user_id = auth.uid());
CREATE INDEX game_answers_session_idx ON public.game_answers (session_id);

CREATE TABLE public.achievements (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.achievements TO authenticated;
GRANT ALL ON public.achievements TO service_role;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Pair members can view achievement definitions" ON public.achievements FOR SELECT TO authenticated USING (public.is_relationship_member());

CREATE TABLE public.user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  achievement_code TEXT NOT NULL REFERENCES public.achievements(code) ON DELETE RESTRICT,
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, achievement_code)
);
GRANT SELECT ON public.user_achievements TO authenticated;
GRANT ALL ON public.user_achievements TO service_role;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Pair members can view unlocked achievements" ON public.user_achievements FOR SELECT TO authenticated USING (public.is_relationship_member());
CREATE INDEX user_achievements_user_idx ON public.user_achievements (user_id, unlocked_at DESC);

CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  actor_id UUID REFERENCES auth.users(id) ON DELETE RESTRICT,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('brownies_received', 'reward_requested', 'reward_accepted', 'reward_declined', 'reward_completed', 'letter_received', 'letter_sealed', 'letter_unlocked', 'memory_uploaded', 'bucket_list_completed', 'happiness_note_added', 'achievement_unlocked', 'capsule_sealed', 'capsule_unlocked')),
  title TEXT NOT NULL CHECK (length(title) <= 160),
  body TEXT NOT NULL DEFAULT '' CHECK (length(body) <= 500),
  resource_type TEXT,
  resource_id UUID,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can view their own notifications" ON public.notifications FOR SELECT TO authenticated USING (public.is_relationship_member() AND recipient_id = auth.uid());
CREATE POLICY "Members can update their own notification read state" ON public.notifications FOR UPDATE TO authenticated USING (public.is_relationship_member() AND recipient_id = auth.uid()) WITH CHECK (public.is_relationship_member() AND recipient_id = auth.uid());
CREATE INDEX notifications_recipient_unread_idx ON public.notifications (recipient_id, read_at, created_at DESC);

CREATE TABLE public.daily_surprise_prompts (
  sequence_no SMALLINT PRIMARY KEY,
  prompt_type TEXT NOT NULL CHECK (prompt_type IN ('question', 'compliment', 'activity')),
  content TEXT NOT NULL CHECK (length(trim(content)) BETWEEN 1 AND 500),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.daily_surprise_prompts TO authenticated;
GRANT ALL ON public.daily_surprise_prompts TO service_role;
ALTER TABLE public.daily_surprise_prompts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Pair members can view daily surprise prompts" ON public.daily_surprise_prompts FOR SELECT TO authenticated USING (public.is_relationship_member());

CREATE TABLE public.daily_surprises (
  surprise_date DATE PRIMARY KEY,
  prompt_sequence SMALLINT NOT NULL REFERENCES public.daily_surprise_prompts(sequence_no) ON DELETE RESTRICT,
  memory_id UUID REFERENCES public.memories(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.daily_surprises TO authenticated;
GRANT ALL ON public.daily_surprises TO service_role;
ALTER TABLE public.daily_surprises ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Pair members can view daily surprises" ON public.daily_surprises FOR SELECT TO authenticated USING (public.is_relationship_member());

CREATE TABLE public.memory_capsules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  unlock_at TIMESTAMPTZ NOT NULL,
  photo_path TEXT,
  unlock_notification_sent BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (sender_id <> recipient_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.memory_capsules TO authenticated;
GRANT ALL ON public.memory_capsules TO service_role;
ALTER TABLE public.memory_capsules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Capsule participants can view sealed envelopes" ON public.memory_capsules FOR SELECT TO authenticated USING (public.is_relationship_member() AND auth.uid() IN (sender_id, recipient_id));
CREATE POLICY "Members can create their own capsules" ON public.memory_capsules FOR INSERT TO authenticated WITH CHECK (public.is_relationship_member() AND sender_id = auth.uid() AND recipient_id <> auth.uid() AND unlock_at > now());
CREATE POLICY "Senders can edit their own future capsules" ON public.memory_capsules FOR UPDATE TO authenticated USING (public.is_relationship_member() AND sender_id = auth.uid() AND unlock_at > now()) WITH CHECK (public.is_relationship_member() AND sender_id = auth.uid() AND unlock_at > now());
CREATE POLICY "Senders can delete their own future capsules" ON public.memory_capsules FOR DELETE TO authenticated USING (public.is_relationship_member() AND sender_id = auth.uid() AND unlock_at > now());
CREATE INDEX memory_capsules_recipient_unlock_idx ON public.memory_capsules (recipient_id, unlock_at);

CREATE TABLE public.memory_capsule_contents (
  capsule_id UUID PRIMARY KEY REFERENCES public.memory_capsules(id) ON DELETE CASCADE,
  message TEXT NOT NULL DEFAULT '' CHECK (length(message) <= 5000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.memory_capsule_contents TO authenticated;
GRANT ALL ON public.memory_capsule_contents TO service_role;
ALTER TABLE public.memory_capsule_contents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Capsule contents are visible only after unlock" ON public.memory_capsule_contents FOR SELECT TO authenticated USING (
  public.is_relationship_member() AND EXISTS (SELECT 1 FROM public.memory_capsules c WHERE c.id = capsule_id AND auth.uid() IN (c.sender_id, c.recipient_id) AND c.unlock_at <= now())
);
CREATE POLICY "Senders can write future capsule contents" ON public.memory_capsule_contents FOR INSERT TO authenticated WITH CHECK (
  public.is_relationship_member() AND EXISTS (SELECT 1 FROM public.memory_capsules c WHERE c.id = capsule_id AND c.sender_id = auth.uid() AND c.unlock_at > now())
);
CREATE POLICY "Senders can edit future capsule contents" ON public.memory_capsule_contents FOR UPDATE TO authenticated USING (
  public.is_relationship_member() AND EXISTS (SELECT 1 FROM public.memory_capsules c WHERE c.id = capsule_id AND c.sender_id = auth.uid() AND c.unlock_at > now())
) WITH CHECK (public.is_relationship_member());
CREATE POLICY "Senders can remove future capsule contents" ON public.memory_capsule_contents FOR DELETE TO authenticated USING (
  public.is_relationship_member() AND EXISTS (SELECT 1 FROM public.memory_capsules c WHERE c.id = capsule_id AND c.sender_id = auth.uid() AND c.unlock_at > now())
);

CREATE TABLE public.activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES auth.users(id) ON DELETE RESTRICT,
  event_type TEXT NOT NULL,
  resource_type TEXT,
  resource_id UUID,
  summary JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.activity_log TO authenticated;
GRANT ALL ON public.activity_log TO service_role;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Pair members can view shared activity" ON public.activity_log FOR SELECT TO authenticated USING (public.is_relationship_member());
CREATE INDEX activity_log_created_idx ON public.activity_log (created_at DESC);

INSERT INTO public.albums (name, description, created_by, is_default) VALUES
  ('Birthdays', 'Birthday memories together', NULL, true),
  ('Outings', 'Little days out and spontaneous plans', NULL, true),
  ('Trips', 'Places and journeys we shared', NULL, true),
  ('Celebrations', 'The days worth celebrating', NULL, true),
  ('Special Moments', 'The moments that stay with us', NULL, true),
  ('Random Memories', 'A home for the little unexpected things', NULL, true);

INSERT INTO public.achievements (code, name, description, icon) VALUES
  ('first-memory', 'First little moment', 'Save your first shared memory.', 'image'),
  ('10-memories', 'Ten moments together', 'Save ten shared memories.', 'images'),
  ('50-memories', 'A growing archive', 'Save fifty shared memories.', 'album'),
  ('first-brownie', 'First brownie', 'Receive your first brownie point.', 'cookie'),
  ('50-brownies', 'Sweet fifty', 'Earn fifty brownie points.', 'cookie'),
  ('100-brownies', 'A hundred reasons', 'Earn one hundred brownie points.', 'sparkles'),
  ('250-brownies', 'Brownie collection', 'Earn two hundred and fifty brownie points.', 'gift'),
  ('500-combined-brownies', 'Five hundred together', 'Earn five hundred brownie points as a pair.', 'heart'),
  ('1000-combined-brownies', 'A thousand little thank-yous', 'Earn one thousand brownie points as a pair.', 'trophy'),
  ('first-letter', 'First letter', 'Send your first love letter.', 'mail'),
  ('10-letters', 'A little letterbox', 'Send ten love letters.', 'mail-open'),
  ('first-happiness-note', 'A bright note', 'Add your first happiness jar note.', 'sun'),
  ('first-bucket-completion', 'One wish, together', 'Complete your first bucket-list activity.', 'check'),
  ('10-bucket-completions', 'Ten shared adventures', 'Complete ten bucket-list activities.', 'map'),
  ('first-memory-capsule', 'Time capsule', 'Create your first memory capsule.', 'hourglass');

CREATE TRIGGER update_relationship_members_updated_at BEFORE UPDATE ON public.relationship_members FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_albums_updated_at BEFORE UPDATE ON public.albums FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_memories_updated_at BEFORE UPDATE ON public.memories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_brownie_balances_updated_at BEFORE UPDATE ON public.brownie_balances FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_rewards_updated_at BEFORE UPDATE ON public.rewards FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_redemption_requests_updated_at BEFORE UPDATE ON public.redemption_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_letters_updated_at BEFORE UPDATE ON public.letters FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_letter_contents_updated_at BEFORE UPDATE ON public.letter_contents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_happiness_notes_updated_at BEFORE UPDATE ON public.happiness_notes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_timeline_events_updated_at BEFORE UPDATE ON public.timeline_events FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_bucket_list_items_updated_at BEFORE UPDATE ON public.bucket_list_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_game_questions_updated_at BEFORE UPDATE ON public.game_questions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_game_question_secrets_updated_at BEFORE UPDATE ON public.game_question_secrets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_game_sessions_updated_at BEFORE UPDATE ON public.game_sessions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_game_answers_updated_at BEFORE UPDATE ON public.game_answers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_memory_capsules_updated_at BEFORE UPDATE ON public.memory_capsules FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_memory_capsule_contents_updated_at BEFORE UPDATE ON public.memory_capsule_contents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.create_member_defaults()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.user_id IS NOT NULL THEN
    INSERT INTO public.profiles (user_id, display_name)
    VALUES (NEW.user_id, NEW.display_name)
    ON CONFLICT (user_id) DO NOTHING;
    INSERT INTO public.brownie_balances (user_id, balance)
    VALUES (NEW.user_id, 0)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER create_relationship_member_defaults AFTER INSERT OR UPDATE OF user_id ON public.relationship_members FOR EACH ROW EXECUTE FUNCTION public.create_member_defaults();

CREATE OR REPLACE FUNCTION public.sync_relationship_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.relationship_members
  SET user_id = NULL
  WHERE user_id = NEW.id AND lower(email) <> lower(COALESCE(NEW.email, ''));
  UPDATE public.relationship_members
  SET user_id = NEW.id
  WHERE lower(email) = lower(COALESCE(NEW.email, '')) AND (user_id IS NULL OR user_id = NEW.id);
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.sync_relationship_auth_user() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER sync_relationship_auth_user AFTER INSERT OR UPDATE OF email ON auth.users FOR EACH ROW EXECUTE FUNCTION public.sync_relationship_auth_user();

UPDATE public.relationship_members rm
SET user_id = u.id
FROM auth.users u
WHERE lower(rm.email) = lower(u.email) AND rm.user_id IS NULL;

CREATE OR REPLACE FUNCTION public.apply_brownie_transaction()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.transaction_type = 'award' THEN
    UPDATE public.brownie_balances
      SET balance = balance + NEW.points, updated_at = now()
      WHERE user_id = NEW.recipient_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'Recipient balance is not initialized'; END IF;
  ELSE
    UPDATE public.brownie_balances
      SET balance = balance - NEW.points, updated_at = now()
      WHERE user_id = NEW.sender_id AND balance >= NEW.points;
    IF NOT FOUND THEN RAISE EXCEPTION 'Insufficient brownie balance'; END IF;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER apply_brownie_transaction_balance AFTER INSERT ON public.brownie_transactions FOR EACH ROW EXECUTE FUNCTION public.apply_brownie_transaction();

CREATE OR REPLACE FUNCTION public.award_brownies(p_recipient_id UUID, p_points INTEGER, p_message TEXT, p_reason TEXT, p_idempotency_key UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sender UUID := auth.uid();
  v_id UUID;
  v_existing public.brownie_transactions%ROWTYPE;
BEGIN
  IF v_sender IS NULL OR NOT public.is_relationship_member() THEN RAISE EXCEPTION 'Pair membership required'; END IF;
  IF p_recipient_id IS NULL OR p_recipient_id = v_sender THEN RAISE EXCEPTION 'Choose the other member'; END IF;
  IF p_points IS NULL OR p_points <= 0 THEN RAISE EXCEPTION 'Points must be a positive whole number'; END IF;
  IF p_idempotency_key IS NULL THEN RAISE EXCEPTION 'An idempotency key is required'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.relationship_members WHERE user_id = p_recipient_id) THEN RAISE EXCEPTION 'Recipient is not a pair member'; END IF;
  IF length(COALESCE(p_message, '')) > 500 OR length(COALESCE(p_reason, '')) > 80 THEN RAISE EXCEPTION 'Message or reason is too long'; END IF;
  SELECT * INTO v_existing FROM public.brownie_transactions WHERE sender_id = v_sender AND idempotency_key = p_idempotency_key;
  IF FOUND THEN
    IF v_existing.recipient_id <> p_recipient_id OR v_existing.points <> p_points OR v_existing.transaction_type <> 'award' THEN RAISE EXCEPTION 'Idempotency key was already used for a different action'; END IF;
    RETURN v_existing.id;
  END IF;
  INSERT INTO public.brownie_transactions (sender_id, recipient_id, points, transaction_type, message, reason, idempotency_key)
  VALUES (v_sender, p_recipient_id, p_points, 'award', COALESCE(p_message, ''), COALESCE(p_reason, ''), p_idempotency_key)
  ON CONFLICT (sender_id, idempotency_key) DO NOTHING
  RETURNING id INTO v_id;
  IF v_id IS NULL THEN
    SELECT id INTO v_id FROM public.brownie_transactions WHERE sender_id = v_sender AND idempotency_key = p_idempotency_key;
    IF v_id IS NULL THEN RAISE EXCEPTION 'Unable to record brownie transaction'; END IF;
    RETURN v_id;
  END IF;
  INSERT INTO public.notifications (recipient_id, actor_id, notification_type, title, body, resource_type, resource_id)
  VALUES (p_recipient_id, v_sender, 'brownies_received', 'A little brownie for you', p_points::text || ' brownie points' || CASE WHEN COALESCE(p_reason, '') = '' THEN '' ELSE ' · ' || p_reason END, 'brownie_transaction', v_id);
  INSERT INTO public.activity_log (actor_id, event_type, resource_type, resource_id, summary)
  VALUES (v_sender, 'brownie_awarded', 'brownie_transaction', v_id, jsonb_build_object('points', p_points, 'recipient_id', p_recipient_id));
  RETURN v_id;
END;
$$;
REVOKE ALL ON FUNCTION public.award_brownies(UUID, INTEGER, TEXT, TEXT, UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.award_brownies(UUID, INTEGER, TEXT, TEXT, UUID) TO authenticated;

CREATE OR REPLACE FUNCTION public.request_reward(p_reward_id UUID, p_message TEXT, p_idempotency_key UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user UUID := auth.uid();
  v_reward public.rewards%ROWTYPE;
  v_id UUID;
BEGIN
  IF v_user IS NULL OR NOT public.is_relationship_member() THEN RAISE EXCEPTION 'Pair membership required'; END IF;
  IF p_idempotency_key IS NULL THEN RAISE EXCEPTION 'An idempotency key is required'; END IF;
  IF length(COALESCE(p_message, '')) > 500 THEN RAISE EXCEPTION 'Message is too long'; END IF;
  SELECT * INTO v_reward FROM public.rewards WHERE id = p_reward_id AND is_active FOR SHARE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Reward is unavailable'; END IF;
  IF v_reward.created_by = v_user THEN RAISE EXCEPTION 'You cannot redeem your own reward'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.relationship_members WHERE user_id = v_reward.created_by) THEN RAISE EXCEPTION 'Reward owner is not a pair member'; END IF;
  SELECT id INTO v_id FROM public.redemption_requests WHERE requester_id = v_user AND idempotency_key = p_idempotency_key;
  IF v_id IS NOT NULL THEN RETURN v_id; END IF;
  INSERT INTO public.redemption_requests (requester_id, reward_id, reward_owner_id, points_cost, status, message, idempotency_key)
  VALUES (v_user, v_reward.id, v_reward.created_by, v_reward.points_cost, 'pending', COALESCE(p_message, ''), p_idempotency_key)
  ON CONFLICT (requester_id, idempotency_key) DO NOTHING
  RETURNING id INTO v_id;
  IF v_id IS NULL THEN
    SELECT id INTO v_id FROM public.redemption_requests WHERE requester_id = v_user AND idempotency_key = p_idempotency_key;
    IF v_id IS NULL THEN RAISE EXCEPTION 'Unable to create redemption request'; END IF;
    RETURN v_id;
  END IF;
  INSERT INTO public.notifications (recipient_id, actor_id, notification_type, title, body, resource_type, resource_id)
  VALUES (v_reward.created_by, v_user, 'reward_requested', 'A reward is waiting for you', v_reward.title, 'redemption_request', v_id);
  INSERT INTO public.activity_log (actor_id, event_type, resource_type, resource_id, summary)
  VALUES (v_user, 'reward_requested', 'redemption_request', v_id, jsonb_build_object('reward', v_reward.title));
  RETURN v_id;
END;
$$;
REVOKE ALL ON FUNCTION public.request_reward(UUID, TEXT, UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.request_reward(UUID, TEXT, UUID) TO authenticated;

CREATE OR REPLACE FUNCTION public.accept_reward_request(p_request_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user UUID := auth.uid();
  v_request public.redemption_requests%ROWTYPE;
  v_balance INTEGER;
BEGIN
  IF v_user IS NULL OR NOT public.is_relationship_member() THEN RAISE EXCEPTION 'Pair membership required'; END IF;
  SELECT * INTO v_request FROM public.redemption_requests WHERE id = p_request_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Request not found'; END IF;
  IF v_request.reward_owner_id <> v_user THEN RAISE EXCEPTION 'Only the reward owner can respond'; END IF;
  IF v_request.status IN ('accepted', 'completed') THEN RETURN v_request.id; END IF;
  IF v_request.status <> 'pending' THEN RAISE EXCEPTION 'This request is no longer pending'; END IF;
  SELECT balance INTO v_balance FROM public.brownie_balances WHERE user_id = v_request.requester_id FOR UPDATE;
  IF v_balance IS NULL OR v_balance < v_request.points_cost THEN RAISE EXCEPTION 'The requester no longer has enough brownie points'; END IF;
  INSERT INTO public.brownie_transactions (sender_id, recipient_id, points, transaction_type, message, reason, idempotency_key, redemption_request_id)
  VALUES (v_request.requester_id, v_request.reward_owner_id, v_request.points_cost, 'reward_redemption', v_request.message, 'Reward redemption', v_request.id, v_request.id);
  UPDATE public.redemption_requests SET status = 'accepted', accepted_at = now() WHERE id = v_request.id;
  INSERT INTO public.notifications (recipient_id, actor_id, notification_type, title, body, resource_type, resource_id)
  VALUES (v_request.requester_id, v_user, 'reward_accepted', 'Your reward was accepted', 'It is ready to enjoy together.', 'redemption_request', v_request.id);
  INSERT INTO public.activity_log (actor_id, event_type, resource_type, resource_id, summary)
  VALUES (v_user, 'reward_accepted', 'redemption_request', v_request.id, jsonb_build_object('points', v_request.points_cost));
  RETURN v_request.id;
END;
$$;
REVOKE ALL ON FUNCTION public.accept_reward_request(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.accept_reward_request(UUID) TO authenticated;

CREATE OR REPLACE FUNCTION public.decline_reward_request(p_request_id UUID, p_response TEXT DEFAULT '')
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user UUID := auth.uid();
  v_request public.redemption_requests%ROWTYPE;
BEGIN
  IF v_user IS NULL OR NOT public.is_relationship_member() THEN RAISE EXCEPTION 'Pair membership required'; END IF;
  IF length(COALESCE(p_response, '')) > 500 THEN RAISE EXCEPTION 'Response is too long'; END IF;
  SELECT * INTO v_request FROM public.redemption_requests WHERE id = p_request_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Request not found'; END IF;
  IF v_request.reward_owner_id <> v_user THEN RAISE EXCEPTION 'Only the reward owner can respond'; END IF;
  IF v_request.status = 'declined' THEN RETURN v_request.id; END IF;
  IF v_request.status <> 'pending' THEN RAISE EXCEPTION 'This request is no longer pending'; END IF;
  UPDATE public.redemption_requests SET status = 'declined', response = COALESCE(p_response, '') WHERE id = v_request.id;
  INSERT INTO public.notifications (recipient_id, actor_id, notification_type, title, body, resource_type, resource_id)
  VALUES (v_request.requester_id, v_user, 'reward_declined', 'A reward request was declined', COALESCE(p_response, ''), 'redemption_request', v_request.id);
  RETURN v_request.id;
END;
$$;
REVOKE ALL ON FUNCTION public.decline_reward_request(UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.decline_reward_request(UUID, TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.complete_reward(p_request_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user UUID := auth.uid();
  v_request public.redemption_requests%ROWTYPE;
  v_other UUID;
BEGIN
  IF v_user IS NULL OR NOT public.is_relationship_member() THEN RAISE EXCEPTION 'Pair membership required'; END IF;
  SELECT * INTO v_request FROM public.redemption_requests WHERE id = p_request_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Request not found'; END IF;
  IF v_user NOT IN (v_request.requester_id, v_request.reward_owner_id) THEN RAISE EXCEPTION 'Only participants can complete this reward'; END IF;
  IF v_request.status = 'completed' THEN RETURN v_request.id; END IF;
  IF v_request.status <> 'accepted' THEN RAISE EXCEPTION 'Only accepted rewards can be completed'; END IF;
  UPDATE public.redemption_requests SET status = 'completed', completed_at = now() WHERE id = v_request.id;
  v_other := CASE WHEN v_user = v_request.requester_id THEN v_request.reward_owner_id ELSE v_request.requester_id END;
  INSERT INTO public.notifications (recipient_id, actor_id, notification_type, title, body, resource_type, resource_id)
  VALUES (v_other, v_user, 'reward_completed', 'A shared reward was completed', '', 'redemption_request', v_request.id);
  RETURN v_request.id;
END;
$$;
REVOKE ALL ON FUNCTION public.complete_reward(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.complete_reward(UUID) TO authenticated;

CREATE OR REPLACE FUNCTION public.save_letter_draft(p_letter_id UUID, p_recipient_id UUID, p_letter_type TEXT, p_unlock_at TIMESTAMPTZ, p_title TEXT, p_body TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user UUID := auth.uid();
  v_id UUID;
BEGIN
  IF v_user IS NULL OR NOT public.is_relationship_member() THEN RAISE EXCEPTION 'Pair membership required'; END IF;
  IF p_recipient_id = v_user OR NOT EXISTS (SELECT 1 FROM public.relationship_members WHERE user_id = p_recipient_id) THEN RAISE EXCEPTION 'Choose the other member'; END IF;
  IF p_letter_type NOT IN ('love_letter', 'open_when_happy', 'open_when_sad', 'open_when_bored', 'open_when_miss_me', 'open_when_motivation', 'birthday', 'custom') THEN RAISE EXCEPTION 'Invalid letter type'; END IF;
  IF length(trim(COALESCE(p_title, ''))) NOT BETWEEN 1 AND 160 OR length(trim(COALESCE(p_body, ''))) NOT BETWEEN 1 AND 10000 THEN RAISE EXCEPTION 'Letter title or message is invalid'; END IF;
  IF p_letter_id IS NULL THEN
    INSERT INTO public.letters (sender_id, recipient_id, letter_type, unlock_at, status)
    VALUES (v_user, p_recipient_id, p_letter_type, COALESCE(p_unlock_at, now()), 'draft') RETURNING id INTO v_id;
  ELSE
    UPDATE public.letters SET recipient_id = p_recipient_id, letter_type = p_letter_type, unlock_at = COALESCE(p_unlock_at, now())
    WHERE id = p_letter_id AND sender_id = v_user AND status = 'draft' RETURNING id INTO v_id;
    IF v_id IS NULL THEN RAISE EXCEPTION 'Draft not found'; END IF;
  END IF;
  INSERT INTO public.letter_contents (letter_id, title, body) VALUES (v_id, trim(p_title), p_body)
  ON CONFLICT (letter_id) DO UPDATE SET title = EXCLUDED.title, body = EXCLUDED.body;
  RETURN v_id;
END;
$$;
REVOKE ALL ON FUNCTION public.save_letter_draft(UUID, UUID, TEXT, TIMESTAMPTZ, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.save_letter_draft(UUID, UUID, TEXT, TIMESTAMPTZ, TEXT, TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.send_letter(p_letter_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_letter public.letters%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_relationship_member() THEN RAISE EXCEPTION 'Pair membership required'; END IF;
  SELECT * INTO v_letter FROM public.letters WHERE id = p_letter_id FOR UPDATE;
  IF NOT FOUND OR v_letter.sender_id <> auth.uid() THEN RAISE EXCEPTION 'Draft not found'; END IF;
  IF v_letter.status = 'sent' THEN RETURN v_letter.id; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.letter_contents WHERE letter_id = v_letter.id) THEN RAISE EXCEPTION 'Letter content is required'; END IF;
  UPDATE public.letters SET status = 'sent', sent_at = now(), unlock_notification_sent = (unlock_at <= now()) WHERE id = v_letter.id;
  INSERT INTO public.notifications (recipient_id, actor_id, notification_type, title, body, resource_type, resource_id)
  VALUES (v_letter.recipient_id, v_letter.sender_id, CASE WHEN v_letter.unlock_at <= now() THEN 'letter_received' ELSE 'letter_sealed' END,
    CASE WHEN v_letter.unlock_at <= now() THEN 'A letter just arrived' ELSE 'A sealed letter is waiting for you' END,
    CASE WHEN v_letter.unlock_at <= now() THEN 'A new note is in your letterbox.' ELSE 'It will open on ' || to_char(v_letter.unlock_at AT TIME ZONE 'UTC', 'Mon DD, YYYY · HH24:MI') || ' UTC.' END,
    'letter', v_letter.id);
  INSERT INTO public.activity_log (actor_id, event_type, resource_type, resource_id, summary)
  VALUES (v_letter.sender_id, 'letter_sent', 'letter', v_letter.id, jsonb_build_object('recipient_id', v_letter.recipient_id));
  RETURN v_letter.id;
END;
$$;
REVOKE ALL ON FUNCTION public.send_letter(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.send_letter(UUID) TO authenticated;

CREATE OR REPLACE FUNCTION public.create_memory_capsule(p_recipient_id UUID, p_unlock_at TIMESTAMPTZ, p_photo_path TEXT, p_message TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user UUID := auth.uid();
  v_id UUID;
BEGIN
  IF v_user IS NULL OR NOT public.is_relationship_member() THEN RAISE EXCEPTION 'Pair membership required'; END IF;
  IF p_recipient_id = v_user OR NOT EXISTS (SELECT 1 FROM public.relationship_members WHERE user_id = p_recipient_id) THEN RAISE EXCEPTION 'Choose the other member'; END IF;
  IF p_unlock_at IS NULL OR p_unlock_at <= now() THEN RAISE EXCEPTION 'Choose a future unlock time'; END IF;
  IF length(COALESCE(p_message, '')) > 5000 THEN RAISE EXCEPTION 'Message is too long'; END IF;
  IF p_photo_path IS NOT NULL AND split_part(p_photo_path, '/', 1) <> v_user::text THEN RAISE EXCEPTION 'Photo must be in your private folder'; END IF;
  INSERT INTO public.memory_capsules (sender_id, recipient_id, unlock_at, photo_path) VALUES (v_user, p_recipient_id, p_unlock_at, p_photo_path) RETURNING id INTO v_id;
  INSERT INTO public.memory_capsule_contents (capsule_id, message) VALUES (v_id, COALESCE(p_message, ''));
  INSERT INTO public.notifications (recipient_id, actor_id, notification_type, title, body, resource_type, resource_id)
  VALUES (p_recipient_id, v_user, 'capsule_sealed', 'A memory is tucked away for later', 'It opens on ' || to_char(p_unlock_at AT TIME ZONE 'UTC', 'Mon DD, YYYY · HH24:MI') || ' UTC.', 'memory_capsule', v_id);
  RETURN v_id;
END;
$$;
REVOKE ALL ON FUNCTION public.create_memory_capsule(UUID, TIMESTAMPTZ, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_memory_capsule(UUID, TIMESTAMPTZ, TEXT, TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.process_due_content_unlocks()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row RECORD;
  v_count INTEGER := 0;
BEGIN
  FOR v_row IN
    UPDATE public.letters SET unlock_notification_sent = true
    WHERE status = 'sent' AND unlock_at <= now() AND NOT unlock_notification_sent
    RETURNING id, sender_id, recipient_id
  LOOP
    INSERT INTO public.notifications (recipient_id, actor_id, notification_type, title, body, resource_type, resource_id)
    VALUES (v_row.recipient_id, v_row.sender_id, 'letter_unlocked', 'Your letter is ready to open', 'A sealed letter has reached its unlock time.', 'letter', v_row.id);
    v_count := v_count + 1;
  END LOOP;
  FOR v_row IN
    UPDATE public.memory_capsules SET unlock_notification_sent = true
    WHERE unlock_at <= now() AND NOT unlock_notification_sent
    RETURNING id, sender_id, recipient_id
  LOOP
    INSERT INTO public.notifications (recipient_id, actor_id, notification_type, title, body, resource_type, resource_id)
    VALUES (v_row.recipient_id, v_row.sender_id, 'capsule_unlocked', 'A memory capsule has opened', 'A memory saved for later is ready.', 'memory_capsule', v_row.id);
    v_count := v_count + 1;
  END LOOP;
  RETURN v_count;
END;
$$;
REVOKE ALL ON FUNCTION public.process_due_content_unlocks() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.process_due_content_unlocks() TO service_role;

CREATE OR REPLACE FUNCTION public.get_daily_surprise()
RETURNS TABLE (surprise_date DATE, prompt_type TEXT, content TEXT, memory_id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_today DATE := CURRENT_DATE;
  v_total INTEGER;
  v_sequence SMALLINT;
  v_memory UUID;
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_relationship_member() THEN RAISE EXCEPTION 'Pair membership required'; END IF;
  SELECT count(*) INTO v_total FROM public.daily_surprise_prompts;
  IF v_total = 0 THEN RAISE EXCEPTION 'Daily prompts are not configured'; END IF;
  SELECT sequence_no INTO v_sequence FROM public.daily_surprise_prompts ORDER BY sequence_no
  OFFSET (((v_today - DATE '2026-01-01') % v_total)::INTEGER) LIMIT 1;
  SELECT id INTO v_memory FROM public.memories ORDER BY md5(id::text || v_today::text) LIMIT 1;
  INSERT INTO public.daily_surprises (surprise_date, prompt_sequence, memory_id)
  VALUES (v_today, v_sequence, v_memory) ON CONFLICT (surprise_date) DO NOTHING;
  RETURN QUERY SELECT d.surprise_date, p.prompt_type, p.content, d.memory_id
  FROM public.daily_surprises d JOIN public.daily_surprise_prompts p ON p.sequence_no = d.prompt_sequence
  WHERE d.surprise_date = v_today;
END;
$$;
REVOKE ALL ON FUNCTION public.get_daily_surprise() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_daily_surprise() TO authenticated;

CREATE OR REPLACE FUNCTION public.unlock_achievement(p_user_id UUID, p_code TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_achievements (user_id, achievement_code)
  SELECT p_user_id, p_code WHERE EXISTS (SELECT 1 FROM public.achievements WHERE code = p_code)
  ON CONFLICT (user_id, achievement_code) DO NOTHING;
END;
$$;
REVOKE ALL ON FUNCTION public.unlock_achievement(UUID, TEXT) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.refresh_pair_achievements()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_member RECORD;
  v_memory_count INTEGER;
  v_brownies INTEGER;
  v_combined INTEGER;
  v_letters INTEGER;
  v_notes INTEGER;
  v_completed INTEGER;
  v_capsules INTEGER;
BEGIN
  SELECT count(*) INTO v_memory_count FROM public.memories;
  SELECT COALESCE(sum(points), 0) INTO v_combined FROM public.brownie_transactions WHERE transaction_type = 'award';
  FOR v_member IN SELECT user_id FROM public.relationship_members WHERE user_id IS NOT NULL LOOP
    IF v_memory_count >= 1 THEN PERFORM public.unlock_achievement(v_member.user_id, 'first-memory'); END IF;
    IF v_memory_count >= 10 THEN PERFORM public.unlock_achievement(v_member.user_id, '10-memories'); END IF;
    IF v_memory_count >= 50 THEN PERFORM public.unlock_achievement(v_member.user_id, '50-memories'); END IF;
    SELECT COALESCE(sum(points), 0) INTO v_brownies FROM public.brownie_transactions WHERE transaction_type = 'award' AND recipient_id = v_member.user_id;
    IF v_brownies >= 1 THEN PERFORM public.unlock_achievement(v_member.user_id, 'first-brownie'); END IF;
    IF v_brownies >= 50 THEN PERFORM public.unlock_achievement(v_member.user_id, '50-brownies'); END IF;
    IF v_brownies >= 100 THEN PERFORM public.unlock_achievement(v_member.user_id, '100-brownies'); END IF;
    IF v_brownies >= 250 THEN PERFORM public.unlock_achievement(v_member.user_id, '250-brownies'); END IF;
    IF v_combined >= 500 THEN PERFORM public.unlock_achievement(v_member.user_id, '500-combined-brownies'); END IF;
    IF v_combined >= 1000 THEN PERFORM public.unlock_achievement(v_member.user_id, '1000-combined-brownies'); END IF;
    SELECT count(*) INTO v_letters FROM public.letters WHERE sender_id = v_member.user_id AND status = 'sent';
    IF v_letters >= 1 THEN PERFORM public.unlock_achievement(v_member.user_id, 'first-letter'); END IF;
    IF v_letters >= 10 THEN PERFORM public.unlock_achievement(v_member.user_id, '10-letters'); END IF;
    SELECT count(*) INTO v_notes FROM public.happiness_notes WHERE created_by = v_member.user_id;
    IF v_notes >= 1 THEN PERFORM public.unlock_achievement(v_member.user_id, 'first-happiness-note'); END IF;
    SELECT count(*) INTO v_completed FROM public.bucket_list_items WHERE completed_by = v_member.user_id AND is_completed;
    IF v_completed >= 1 THEN PERFORM public.unlock_achievement(v_member.user_id, 'first-bucket-completion'); END IF;
    IF v_completed >= 10 THEN PERFORM public.unlock_achievement(v_member.user_id, '10-bucket-completions'); END IF;
    SELECT count(*) INTO v_capsules FROM public.memory_capsules WHERE sender_id = v_member.user_id;
    IF v_capsules >= 1 THEN PERFORM public.unlock_achievement(v_member.user_id, 'first-memory-capsule'); END IF;
  END LOOP;
END;
$$;
REVOKE ALL ON FUNCTION public.refresh_pair_achievements() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.refresh_achievements_after_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.refresh_pair_achievements();
  RETURN NULL;
END;
$$;
CREATE TRIGGER refresh_achievements_after_memories AFTER INSERT OR UPDATE OR DELETE ON public.memories FOR EACH STATEMENT EXECUTE FUNCTION public.refresh_achievements_after_change();
CREATE TRIGGER refresh_achievements_after_transactions AFTER INSERT OR UPDATE OR DELETE ON public.brownie_transactions FOR EACH STATEMENT EXECUTE FUNCTION public.refresh_achievements_after_change();
CREATE TRIGGER refresh_achievements_after_letters AFTER INSERT OR UPDATE OR DELETE ON public.letters FOR EACH STATEMENT EXECUTE FUNCTION public.refresh_achievements_after_change();
CREATE TRIGGER refresh_achievements_after_notes AFTER INSERT OR UPDATE OR DELETE ON public.happiness_notes FOR EACH STATEMENT EXECUTE FUNCTION public.refresh_achievements_after_change();
CREATE TRIGGER refresh_achievements_after_bucket_list AFTER INSERT OR UPDATE OR DELETE ON public.bucket_list_items FOR EACH STATEMENT EXECUTE FUNCTION public.refresh_achievements_after_change();
CREATE TRIGGER refresh_achievements_after_capsules AFTER INSERT OR UPDATE OR DELETE ON public.memory_capsules FOR EACH STATEMENT EXECUTE FUNCTION public.refresh_achievements_after_change();

CREATE OR REPLACE FUNCTION public.notify_achievement_unlocked()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_achievement public.achievements%ROWTYPE;
BEGIN
  SELECT * INTO v_achievement FROM public.achievements WHERE code = NEW.achievement_code;
  INSERT INTO public.notifications (recipient_id, notification_type, title, body, resource_type, resource_id)
  VALUES (NEW.user_id, 'achievement_unlocked', 'A new little milestone', v_achievement.name, 'achievement', NEW.id);
  INSERT INTO public.activity_log (actor_id, event_type, resource_type, resource_id, summary)
  VALUES (NEW.user_id, 'achievement_unlocked', 'achievement', NEW.id, jsonb_build_object('name', v_achievement.name));
  RETURN NEW;
END;
$$;
CREATE TRIGGER notify_achievement_unlocked AFTER INSERT ON public.user_achievements FOR EACH ROW EXECUTE FUNCTION public.notify_achievement_unlocked();

CREATE OR REPLACE FUNCTION public.log_new_memory()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_recipient UUID;
BEGIN
  SELECT user_id INTO v_recipient FROM public.relationship_members WHERE user_id IS NOT NULL AND user_id <> NEW.uploaded_by LIMIT 1;
  INSERT INTO public.activity_log (actor_id, event_type, resource_type, resource_id, summary)
  VALUES (NEW.uploaded_by, 'memory_uploaded', 'memory', NEW.id, jsonb_build_object('caption', NEW.caption));
  IF v_recipient IS NOT NULL THEN
    INSERT INTO public.notifications (recipient_id, actor_id, notification_type, title, body, resource_type, resource_id)
    VALUES (v_recipient, NEW.uploaded_by, 'memory_uploaded', 'A new memory was saved', NEW.caption, 'memory', NEW.id);
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER memory_activity_after_insert AFTER INSERT ON public.memories FOR EACH ROW EXECUTE FUNCTION public.log_new_memory();

CREATE OR REPLACE FUNCTION public.log_happiness_note()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_recipient UUID;
BEGIN
  SELECT user_id INTO v_recipient FROM public.relationship_members WHERE user_id IS NOT NULL AND user_id <> NEW.created_by LIMIT 1;
  INSERT INTO public.activity_log (actor_id, event_type, resource_type, resource_id, summary)
  VALUES (NEW.created_by, 'happiness_note_added', 'happiness_note', NEW.id, jsonb_build_object('category', NEW.category));
  IF v_recipient IS NOT NULL THEN
    INSERT INTO public.notifications (recipient_id, actor_id, notification_type, title, body, resource_type, resource_id)
    VALUES (v_recipient, NEW.created_by, 'happiness_note_added', 'A little note for the jar', 'A new happiness note was added.', 'happiness_note', NEW.id);
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER happiness_note_activity_after_insert AFTER INSERT ON public.happiness_notes FOR EACH ROW EXECUTE FUNCTION public.log_happiness_note();

CREATE OR REPLACE FUNCTION public.log_bucket_list_completion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_recipient UUID;
BEGIN
  IF NEW.is_completed AND (TG_OP = 'INSERT' OR NOT OLD.is_completed) THEN
    UPDATE public.bucket_list_items SET completed_at = COALESCE(NEW.completed_at, now()), completed_by = COALESCE(NEW.completed_by, auth.uid()) WHERE id = NEW.id;
    SELECT user_id INTO v_recipient FROM public.relationship_members WHERE user_id IS NOT NULL AND user_id <> COALESCE(NEW.completed_by, auth.uid()) LIMIT 1;
    INSERT INTO public.activity_log (actor_id, event_type, resource_type, resource_id, summary)
    VALUES (COALESCE(NEW.completed_by, auth.uid()), 'bucket_list_completed', 'bucket_list_item', NEW.id, jsonb_build_object('title', NEW.title));
    IF v_recipient IS NOT NULL THEN
      INSERT INTO public.notifications (recipient_id, actor_id, notification_type, title, body, resource_type, resource_id)
      VALUES (v_recipient, COALESCE(NEW.completed_by, auth.uid()), 'bucket_list_completed', 'A shared wish came true', NEW.title, 'bucket_list_item', NEW.id);
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER bucket_list_completion_after_change AFTER INSERT OR UPDATE OF is_completed ON public.bucket_list_items FOR EACH ROW EXECUTE FUNCTION public.log_bucket_list_completion();

CREATE OR REPLACE FUNCTION public.get_or_create_daily_surprise()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.is_completed AND NEW.completed_at IS NULL THEN NEW.completed_at := now(); END IF;
  IF NEW.is_completed AND NEW.completed_by IS NULL THEN NEW.completed_by := auth.uid(); END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER bucket_list_completion_after_change ON public.bucket_list_items;
CREATE TRIGGER bucket_list_completion_defaults BEFORE INSERT OR UPDATE OF is_completed ON public.bucket_list_items FOR EACH ROW EXECUTE FUNCTION public.get_or_create_daily_surprise();
CREATE TRIGGER bucket_list_completion_after_change AFTER INSERT OR UPDATE OF is_completed ON public.bucket_list_items FOR EACH ROW EXECUTE FUNCTION public.log_bucket_list_completion();

CREATE OR REPLACE FUNCTION public.can_read_private_storage_object(p_bucket_id TEXT, p_name TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_relationship_member() THEN RETURN false; END IF;
  IF p_bucket_id = 'memories' THEN
    RETURN EXISTS (SELECT 1 FROM public.memories m WHERE m.photo_path = p_name)
      OR EXISTS (SELECT 1 FROM public.memory_capsules c WHERE c.photo_path = p_name AND c.unlock_at <= now() AND auth.uid() IN (c.sender_id, c.recipient_id));
  ELSIF p_bucket_id = 'memory-capsules' THEN
    RETURN EXISTS (SELECT 1 FROM public.memory_capsules c WHERE c.photo_path = p_name AND c.unlock_at <= now() AND auth.uid() IN (c.sender_id, c.recipient_id));
  ELSIF p_bucket_id = 'profiles' THEN
    RETURN EXISTS (SELECT 1 FROM public.profiles p JOIN public.relationship_members rm ON rm.user_id = p.user_id WHERE p.avatar_path = p_name AND rm.user_id IS NOT NULL);
  ELSIF p_bucket_id = 'reward-covers' THEN
    RETURN EXISTS (SELECT 1 FROM public.rewards r WHERE r.cover_path = p_name);
  ELSIF p_bucket_id = 'letters' THEN
    RETURN EXISTS (SELECT 1 FROM public.letters l WHERE l.attachment_path = p_name AND (l.sender_id = auth.uid() OR (l.recipient_id = auth.uid() AND l.status = 'sent' AND l.unlock_at <= now())));
  ELSIF p_bucket_id = 'timeline' THEN
    RETURN EXISTS (SELECT 1 FROM public.timeline_events e WHERE e.photo_path = p_name);
  ELSIF p_bucket_id = 'bucket-list' THEN
    RETURN EXISTS (SELECT 1 FROM public.bucket_list_items b WHERE b.image_path = p_name OR b.completion_photo_path = p_name);
  END IF;
  RETURN false;
END;
$$;
REVOKE ALL ON FUNCTION public.can_read_private_storage_object(TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_read_private_storage_object(TEXT, TEXT) TO authenticated, service_role;
CREATE POLICY "Pair members can read only linked private files" ON storage.objects FOR SELECT TO authenticated USING (public.can_read_private_storage_object(bucket_id, name));
CREATE POLICY "Pair members can upload into their own private folder" ON storage.objects FOR INSERT TO authenticated WITH CHECK (
  public.is_relationship_member() AND bucket_id IN ('memories', 'profiles', 'reward-covers', 'letters', 'timeline', 'bucket-list', 'memory-capsules') AND split_part(name, '/', 1) = auth.uid()::text
);
CREATE POLICY "Members can update their own private files" ON storage.objects FOR UPDATE TO authenticated USING (
  public.is_relationship_member() AND bucket_id IN ('memories', 'profiles', 'reward-covers', 'letters', 'timeline', 'bucket-list', 'memory-capsules') AND split_part(name, '/', 1) = auth.uid()::text
) WITH CHECK (
  public.is_relationship_member() AND bucket_id IN ('memories', 'profiles', 'reward-covers', 'letters', 'timeline', 'bucket-list', 'memory-capsules') AND split_part(name, '/', 1) = auth.uid()::text
);
CREATE POLICY "Members can delete their own private files" ON storage.objects FOR DELETE TO authenticated USING (
  public.is_relationship_member() AND bucket_id IN ('memories', 'profiles', 'reward-covers', 'letters', 'timeline', 'bucket-list', 'memory-capsules') AND split_part(name, '/', 1) = auth.uid()::text
);

CREATE OR REPLACE FUNCTION public.get_daily_surprise()
RETURNS TABLE (surprise_date DATE, prompt_type TEXT, content TEXT, memory_id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_today DATE := CURRENT_DATE;
  v_total INTEGER;
  v_sequence SMALLINT;
  v_memory UUID;
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_relationship_member() THEN RAISE EXCEPTION 'Pair membership required'; END IF;
  SELECT count(*) INTO v_total FROM public.daily_surprise_prompts;
  IF v_total = 0 THEN RAISE EXCEPTION 'Daily prompts are not configured'; END IF;
  SELECT sequence_no INTO v_sequence FROM public.daily_surprise_prompts ORDER BY sequence_no OFFSET (((v_today - DATE '2026-01-01') % v_total)::INTEGER) LIMIT 1;
  SELECT id INTO v_memory FROM public.memories ORDER BY md5(id::text || v_today::text) LIMIT 1;
  INSERT INTO public.daily_surprises (surprise_date, prompt_sequence, memory_id) VALUES (v_today, v_sequence, v_memory) ON CONFLICT (surprise_date) DO NOTHING;
  RETURN QUERY SELECT d.surprise_date, p.prompt_type, p.content, d.memory_id FROM public.daily_surprises d JOIN public.daily_surprise_prompts p ON p.sequence_no = d.prompt_sequence WHERE d.surprise_date = v_today;
END;
$$;
REVOKE ALL ON FUNCTION public.get_daily_surprise() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_daily_surprise() TO authenticated;

INSERT INTO public.daily_surprise_prompts (sequence_no, prompt_type, content) VALUES
  (1, 'question', 'What small thing made you smile this week?'),
  (2, 'compliment', 'Tell each other one little thing you appreciate today.'),
  (3, 'activity', 'Pick a favorite song and take turns choosing the next one.'),
  (4, 'question', 'Which shared moment would you happily relive for an afternoon?'),
  (5, 'activity', 'Make a tiny snack plate from whatever is already at home.'),
  (6, 'compliment', 'Name a way the other person makes an ordinary day better.'),
  (7, 'question', 'What place would you like to explore together next?'),
  (8, 'activity', 'Take a short walk and photograph one small thing you both notice.'),
  (9, 'question', 'What is one new tradition you would enjoy starting?'),
  (10, 'compliment', 'Share one thing the other person does that feels like home.'),
  (11, 'activity', 'Choose a movie neither of you has seen and plan a cozy evening.'),
  (12, 'question', 'What little detail from your first memories still feels special?');

CREATE OR REPLACE FUNCTION public.log_new_timeline_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.activity_log (actor_id, event_type, resource_type, resource_id, summary)
  VALUES (NEW.created_by, 'timeline_event_added', 'timeline_event', NEW.id, jsonb_build_object('title', NEW.title));
  RETURN NEW;
END;
$$;
CREATE TRIGGER timeline_activity_after_insert AFTER INSERT ON public.timeline_events FOR EACH ROW EXECUTE FUNCTION public.log_new_timeline_event();

CREATE OR REPLACE FUNCTION public.create_reward_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.activity_log (actor_id, event_type, resource_type, resource_id, summary)
  VALUES (NEW.created_by, 'reward_created', 'reward', NEW.id, jsonb_build_object('title', NEW.title));
  RETURN NEW;
END;
$$;
CREATE TRIGGER reward_activity_after_insert AFTER INSERT ON public.rewards FOR EACH ROW EXECUTE FUNCTION public.create_reward_activity();

CREATE OR REPLACE FUNCTION public.get_pair_member_display_names()
RETURNS TABLE (user_id UUID, display_name TEXT)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.user_id, p.display_name FROM public.profiles p
  JOIN public.relationship_members rm ON rm.user_id = p.user_id
  WHERE public.is_relationship_member();
$$;
REVOKE ALL ON FUNCTION public.get_pair_member_display_names() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_pair_member_display_names() TO authenticated;

CREATE INDEX letters_unlock_idx ON public.letters (unlock_at) WHERE status = 'sent' AND NOT unlock_notification_sent;
CREATE INDEX capsules_unlock_idx ON public.memory_capsules (unlock_at) WHERE NOT unlock_notification_sent;
CREATE INDEX memory_capsule_contents_capsule_idx ON public.memory_capsule_contents (capsule_id);
CREATE INDEX notifications_created_idx ON public.notifications (created_at DESC);

CREATE OR REPLACE FUNCTION public.process_due_content_unlocks()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row RECORD;
  v_count INTEGER := 0;
BEGIN
  FOR v_row IN UPDATE public.letters SET unlock_notification_sent = true WHERE status = 'sent' AND unlock_at <= now() AND NOT unlock_notification_sent RETURNING id, sender_id, recipient_id LOOP
    INSERT INTO public.notifications (recipient_id, actor_id, notification_type, title, body, resource_type, resource_id)
    VALUES (v_row.recipient_id, v_row.sender_id, 'letter_unlocked', 'Your letter is ready to open', 'A sealed letter has reached its unlock time.', 'letter', v_row.id);
    v_count := v_count + 1;
  END LOOP;
  FOR v_row IN UPDATE public.memory_capsules SET unlock_notification_sent = true WHERE unlock_at <= now() AND NOT unlock_notification_sent RETURNING id, sender_id, recipient_id LOOP
    INSERT INTO public.notifications (recipient_id, actor_id, notification_type, title, body, resource_type, resource_id)
    VALUES (v_row.recipient_id, v_row.sender_id, 'capsule_unlocked', 'A memory capsule has opened', 'A memory saved for later is ready.', 'memory_capsule', v_row.id);
    v_count := v_count + 1;
  END LOOP;
  RETURN v_count;
END;
$$;
REVOKE ALL ON FUNCTION public.process_due_content_unlocks() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.process_due_content_unlocks() TO service_role;

CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'the-little-things-content-unlocks') THEN
    PERFORM cron.schedule('the-little-things-content-unlocks', '0 * * * *', 'SELECT public.process_due_content_unlocks();');
  END IF;
END
$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime')
     AND NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'notifications') THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications';
  END IF;
END
$$;