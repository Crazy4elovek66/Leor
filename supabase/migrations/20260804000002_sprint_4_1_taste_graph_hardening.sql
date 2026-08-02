-- Migration: Sprint 4.1 Taste Graph Hardening
-- 1. Add source_count to taste_graph_edges
-- 2. Upgrade rebuild_taste_graph() with Co-occurrence Edge Engine, Dynamic Strength, and Density Protection (max 1000 edges)

-- 1. Add column source_count if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'taste_graph_edges' AND column_name = 'source_count'
  ) THEN
    ALTER TABLE public.taste_graph_edges ADD COLUMN source_count INT NOT NULL DEFAULT 1;
  END IF;
END $$;

-- 2. Upgrade Procedure: rebuild_taste_graph(p_user_id)
CREATE OR REPLACE FUNCTION public.rebuild_taste_graph(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
  v_profile_id UUID;
  r_taste RECORD;
  r_wish RECORD;
  r_size RECORD;
  v_calc_weight NUMERIC;
  v_edge_count INT;
BEGIN
  IF p_user_id IS NULL THEN RETURN; END IF;

  SELECT id INTO v_profile_id FROM public.gift_profiles WHERE user_id = p_user_id;

  -- Temporary table to store co-occurrence counts between node IDs for this user
  CREATE TEMP TABLE IF NOT EXISTS temp_co_occurrences (
    from_id UUID NOT NULL,
    to_id UUID NOT NULL,
    occurrences INT NOT NULL DEFAULT 1,
    PRIMARY KEY (from_id, to_id)
  ) ON COMMIT DROP;

  TRUNCATE temp_co_occurrences;

  -- 1. Process explicit taste_items
  IF v_profile_id IS NOT NULL THEN
    FOR r_taste IN 
      SELECT category, title, weight 
      FROM public.taste_items 
      WHERE profile_id = v_profile_id
    LOOP
      -- Upsert Category node
      v_calc_weight := public.calculate_taste_weight(p_user_id, 'CATEGORY'::public.taste_node_type, r_taste.category::text);
      INSERT INTO public.taste_graph_nodes (user_id, node_type, value, weight, source)
      VALUES (p_user_id, 'CATEGORY'::public.taste_node_type, r_taste.category::text, v_calc_weight, 'TASTE_ITEM')
      ON CONFLICT (user_id, node_type, value) DO UPDATE SET weight = EXCLUDED.weight, updated_at = now();

      -- Upsert Hobby/Interest node
      v_calc_weight := public.calculate_taste_weight(p_user_id, 'HOBBY'::public.taste_node_type, r_taste.title);
      INSERT INTO public.taste_graph_nodes (user_id, node_type, value, weight, source)
      VALUES (p_user_id, 'HOBBY'::public.taste_node_type, r_taste.title, v_calc_weight, 'TASTE_ITEM')
      ON CONFLICT (user_id, node_type, value) DO UPDATE SET weight = EXCLUDED.weight, updated_at = now();

      -- Co-occurrence between Category and Hobby for this taste item
      INSERT INTO temp_co_occurrences (from_id, to_id, occurrences)
      SELECT n1.id, n2.id, 1
      FROM public.taste_graph_nodes n1
      JOIN public.taste_graph_nodes n2 ON n1.user_id = n2.user_id AND n1.id <> n2.id
      WHERE n1.user_id = p_user_id AND n1.node_type = 'CATEGORY' AND n1.value = r_taste.category::text
        AND n2.node_type = 'HOBBY' AND n2.value = r_taste.title
      ON CONFLICT (from_id, to_id) DO UPDATE SET occurrences = temp_co_occurrences.occurrences + 1;
    END LOOP;
  END IF;

  -- 2. Process wishes (category & brand co-occurrences)
  FOR r_wish IN 
    SELECT category, brand, priority 
    FROM public.wishes 
    WHERE user_id = p_user_id AND status = 'ACTIVE'::public.wish_status
  LOOP
    -- Category node
    v_calc_weight := public.calculate_taste_weight(p_user_id, 'CATEGORY'::public.taste_node_type, r_wish.category::text);
    INSERT INTO public.taste_graph_nodes (user_id, node_type, value, weight, source)
    VALUES (p_user_id, 'CATEGORY'::public.taste_node_type, r_wish.category::text, v_calc_weight, 'WISH')
    ON CONFLICT (user_id, node_type, value) DO UPDATE SET weight = EXCLUDED.weight, updated_at = now();

    -- Brand node if present
    IF r_wish.brand IS NOT NULL AND length(trim(r_wish.brand)) > 0 THEN
      v_calc_weight := public.calculate_taste_weight(p_user_id, 'BRAND'::public.taste_node_type, trim(r_wish.brand));
      INSERT INTO public.taste_graph_nodes (user_id, node_type, value, weight, source)
      VALUES (p_user_id, 'BRAND'::public.taste_node_type, trim(r_wish.brand), v_calc_weight, 'WISH')
      ON CONFLICT (user_id, node_type, value) DO UPDATE SET weight = EXCLUDED.weight, updated_at = now();

      -- Co-occurrence Category <-> Brand for this wish
      INSERT INTO temp_co_occurrences (from_id, to_id, occurrences)
      SELECT n1.id, n2.id, 1
      FROM public.taste_graph_nodes n1
      JOIN public.taste_graph_nodes n2 ON n1.user_id = n2.user_id AND n1.id <> n2.id
      WHERE n1.user_id = p_user_id AND n1.node_type = 'CATEGORY' AND n1.value = r_wish.category::text
        AND n2.node_type = 'BRAND' AND n2.value = trim(r_wish.brand)
      ON CONFLICT (from_id, to_id) DO UPDATE SET occurrences = temp_co_occurrences.occurrences + 1;
    END IF;
  END LOOP;

  -- 3. Cross co-occurrences among all nodes of the user (e.g. Brand <-> Brand, Category <-> Category)
  -- Co-occurrences based on shared user profile context
  INSERT INTO temp_co_occurrences (from_id, to_id, occurrences)
  SELECT n1.id, n2.id, 1
  FROM public.taste_graph_nodes n1
  JOIN public.taste_graph_nodes n2 ON n1.user_id = n2.user_id AND n1.id < n2.id
  WHERE n1.user_id = p_user_id
  ON CONFLICT (from_id, to_id) DO UPDATE SET occurrences = temp_co_occurrences.occurrences + 1;

  -- 4. Upsert Edges with Dynamic Strength formula: min(1.00, shared_occurrences * 0.25)
  INSERT INTO public.taste_graph_edges (user_id, from_node_id, to_node_id, strength, source_count)
  SELECT 
    p_user_id,
    from_id,
    to_id,
    LEAST(1.00, round(occurrences * 0.25, 2)) AS strength,
    occurrences AS source_count
  FROM temp_co_occurrences
  ON CONFLICT (user_id, from_node_id, to_node_id) 
  DO UPDATE SET 
    strength = EXCLUDED.strength,
    source_count = EXCLUDED.source_count;

  -- 5. Graph Density Protection: Keep only top 1000 strongest edges per user
  SELECT COUNT(*) INTO v_edge_count FROM public.taste_graph_edges WHERE user_id = p_user_id;

  IF v_edge_count > 1000 THEN
    DELETE FROM public.taste_graph_edges
    WHERE id IN (
      SELECT id FROM public.taste_graph_edges
      WHERE user_id = p_user_id
      ORDER BY strength ASC, source_count ASC
      OFFSET 1000
    );
  END IF;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
