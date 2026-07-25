
-- Restrict anonymous access to non-contact columns on public marketplace listing
REVOKE SELECT ON public.professional_profiles FROM anon;

GRANT SELECT (
  id, user_id, full_name, council_id, specialties, bio, photo_url,
  created_at, updated_at, accepting_patients, visible_in_marketplace,
  city, state, modality, price_range, languages, slug,
  moderation_status, council_type, council_number, council_state,
  plan, plan_expires_at, average_rating, reviews_count
) ON public.professional_profiles TO anon;
