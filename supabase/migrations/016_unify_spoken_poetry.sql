-- Collapse legacy spoken-word / poetry values into one discipline.
update public.pieces
  set discipline = 'SPOKEN_WORDS_THOUGHTS_POETRY'
  where discipline in ('SPOKEN_WORD', 'POETRY', 'SPOKEN_WORDS_POETRY');

-- Profile disciplines is a text[] column; replace both legacy entries with the
-- unified value so a creative does not end up with duplicates.
update public.profiles
  set disciplines = (
    select array_agg(distinct case
      when d in ('SPOKEN_WORD', 'POETRY', 'SPOKEN_WORDS_POETRY') then 'SPOKEN_WORDS_THOUGHTS_POETRY'
      else d end)
    from unnest(disciplines) as d
  )
  where disciplines && array['SPOKEN_WORD', 'POETRY', 'SPOKEN_WORDS_POETRY'];
