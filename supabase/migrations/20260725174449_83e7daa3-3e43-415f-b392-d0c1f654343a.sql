ALTER TABLE public.content_stories
  ADD COLUMN IF NOT EXISTS story_type text NOT NULL DEFAULT 'linear',
  ADD COLUMN IF NOT EXISTS config jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS stars_reward integer NOT NULL DEFAULT 3;

ALTER TABLE public.content_stories
  DROP CONSTRAINT IF EXISTS content_stories_story_type_check;
ALTER TABLE public.content_stories
  ADD CONSTRAINT content_stories_story_type_check
  CHECK (story_type IN ('linear','branching'));