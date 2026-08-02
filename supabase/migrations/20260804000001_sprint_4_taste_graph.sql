-- Migration: Sprint 4 Taste Graph MVP (Leor)
-- ENUMs: taste_node_type
-- Tables: taste_graph_nodes, taste_graph_edges
-- Functions: calculate_taste_weight, rebuild_taste_graph, get_taste_graph
-- Triggers & RLS Policies

-- 1. Create PostgreSQL ENUM taste_node_type
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'taste_node_type') THEN
    CREATE TYPE public.taste_node_type AS ENUM (
      'BRAND', 'CATEGORY', 'STYLE', 'COLOR', 'MATERIAL', 'HOBBY', 
      'BOOK', 'MOVIE', 'GAME', 'MUSIC', 'TRAVEL', 'FOOD', 'CREATOR', 'OTHER'
    );
  END IF;
END $$;

-- 2. Create Table taste_graph_nodes
CREATE TABLE IF NOT EXISTS public.taste_graph_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  node_type public.taste_node_type NOT NULL,
  value TEXT NOT NULL,
  weight NUMERIC(3, 2) NOT NULL DEFAULT 0.50 CONSTRAINT chk_taste_node_weight CHECK (weight >= 0.00 AND weight <= 1.00),
  source TEXT NOT NULL DEFAULT 'SYSTEM',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_taste_graph_nodes_user_type_value UNIQUE (user_id, node_type, value)
);

-- 3. Create Table taste_graph_edges
CREATE TABLE IF NOT EXISTS public.taste_graph_edges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  from_node_id UUID NOT NULL REFERENCES public.taste_graph_nodes(id) ON DELETE CASCADE,
  to_node_id UUID NOT NULL REFERENCES public.taste_graph_nodes(id) ON DELETE CASCADE,
  strength NUMERIC(3, 2) NOT NULL DEFAULT 0.50 CONSTRAINT chk_taste_edge_strength CHECK (strength >= 0.00 AND strength <= 1.00),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_taste_graph_edges_user_from_to UNIQUE (user_id, from_node_id, to_node_id)
);

-- 4. Triggers updated_at
DROP TRIGGER IF EXISTS trg_taste_nodes_set_updated_at ON public.taste_graph_nodes;
CREATE TRIGGER trg_taste_nodes_set_updated_at
  BEFORE UPDATE ON public.taste_graph_nodes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 5. Indexes
CREATE INDEX IF NOT EXISTS idx_taste_nodes_user ON public.taste_graph_nodes(user_id);
CREATE INDEX IF NOT EXISTS idx_taste_edges_user ON public.taste_graph_edges(user_id);
CREATE INDEX IF NOT EXISTS idx_taste_edges_from ON public.taste_graph_edges(from_node_id);
CREATE INDEX IF NOT EXISTS idx_taste_edges_to ON public.taste_graph_edges(to_node_id);

-- 6. Helper Function: calculate_taste_weight(p_user_id, p_node_type, p_value)
CREATE OR REPLACE FUNCTION public.calculate_taste_weight(
  p_user_id UUID,
  p_node_type public.taste_node_type,
  p_value TEXT
)
RETURNS NUMERIC AS $$
DECLARE
  v_score NUMERIC := 0.30;
  v_item_weight INT;
  v_wish_count INT;
  v_high_pri_count INT;
BEGIN
  -- Check explicit taste item
  IF p_node_type IN ('CATEGORY', 'HOBBY', 'STYLE', 'BOOK', 'MOVIE', 'GAME', 'MUSIC', 'TRAVEL', 'FOOD') THEN
    SELECT weight INTO v_item_weight
    FROM public.taste_items ti
    JOIN public.gift_profiles gp ON gp.id = ti.profile_id
    WHERE gp.user_id = p_user_id AND lower(ti.title) = lower(p_value)
    LIMIT 1;

    IF v_item_weight IS NOT NULL THEN
      v_score := v_score + (v_item_weight * 0.10);
    END IF;
  END IF;

  -- Check wishes matching category or brand
  IF p_node_type = 'CATEGORY' THEN
    SELECT COUNT(*), COUNT(*) FILTER (WHERE priority = 'HIGH'::public.wish_priority)
    INTO v_wish_count, v_high_pri_count
    FROM public.wishes
    WHERE user_id = p_user_id AND status = 'ACTIVE'::public.wish_status AND category::text = p_value;

    v_score := v_score + (v_wish_count * 0.15) + (v_high_pri_count * 0.10);
  ELSIF p_node_type = 'BRAND' THEN
    SELECT COUNT(*), COUNT(*) FILTER (WHERE priority = 'HIGH'::public.wish_priority)
    INTO v_wish_count, v_high_pri_count
    FROM public.wishes
    WHERE user_id = p_user_id AND status = 'ACTIVE'::public.wish_status AND lower(brand) = lower(p_value);

    v_score := v_score + (v_wish_count * 0.20) + (v_high_pri_count * 0.15);
  END IF;

  -- Clamp score between 0.10 and 1.00
  IF v_score > 1.00 THEN v_score := 1.00; END IF;
  IF v_score < 0.10 THEN v_score := 0.10; END IF;

  RETURN round(v_score, 2);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- 7. Main Procedure: rebuild_taste_graph(p_user_id)
CREATE OR REPLACE FUNCTION public.rebuild_taste_graph(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
  v_profile_id UUID;
  r_taste RECORD;
  r_wish RECORD;
  r_size RECORD;
  v_node_id UUID;
  v_cat_node_id UUID;
  v_brand_node_id UUID;
  v_calc_weight NUMERIC;
BEGIN
  IF p_user_id IS NULL THEN RETURN; END IF;

  SELECT id INTO v_profile_id FROM public.gift_profiles WHERE user_id = p_user_id;

  -- 1. Delete old edges
  DELETE FROM public.taste_graph_edges WHERE user_id = p_user_id;

  -- 2. Process explicit taste_items
  IF v_profile_id IS NOT NULL THEN
    FOR r_taste IN 
      SELECT category, title, weight 
      FROM public.taste_items 
      WHERE profile_id = v_profile_id
    LOOP
      v_calc_weight := public.calculate_taste_weight(p_user_id, 'CATEGORY'::public.taste_node_type, r_taste.category::text);
      INSERT INTO public.taste_graph_nodes (user_id, node_type, value, weight, source)
      VALUES (p_user_id, 'CATEGORY'::public.taste_node_type, r_taste.category::text, v_calc_weight, 'TASTE_ITEM')
      ON CONFLICT (user_id, node_type, value) DO UPDATE SET weight = EXCLUDED.weight, updated_at = now();

      v_calc_weight := public.calculate_taste_weight(p_user_id, 'HOBBY'::public.taste_node_type, r_taste.title);
      INSERT INTO public.taste_graph_nodes (user_id, node_type, value, weight, source)
      VALUES (p_user_id, 'HOBBY'::public.taste_node_type, r_taste.title, v_calc_weight, 'TASTE_ITEM')
      ON CONFLICT (user_id, node_type, value) DO UPDATE SET weight = EXCLUDED.weight, updated_at = now();
    END LOOP;
  END IF;

  -- 3. Process wishes (category & brand)
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

      -- Connect Category -> Brand edge
      SELECT id INTO v_cat_node_id FROM public.taste_graph_nodes WHERE user_id = p_user_id AND node_type = 'CATEGORY' AND value = r_wish.category::text;
      SELECT id INTO v_brand_node_id FROM public.taste_graph_nodes WHERE user_id = p_user_id AND node_type = 'BRAND' AND value = trim(r_wish.brand);

      IF v_cat_node_id IS NOT NULL AND v_brand_node_id IS NOT NULL THEN
        INSERT INTO public.taste_graph_edges (user_id, from_node_id, to_node_id, strength)
        VALUES (p_user_id, v_cat_node_id, v_brand_node_id, 0.80)
        ON CONFLICT (user_id, from_node_id, to_node_id) DO UPDATE SET strength = 0.80;
      END IF;
    END IF;
  END LOOP;

  -- 4. Process profile_sizes aggregated categories
  IF v_profile_id IS NOT NULL THEN
    FOR r_size IN 
      SELECT category FROM public.profile_sizes WHERE profile_id = v_profile_id
    LOOP
      INSERT INTO public.taste_graph_nodes (user_id, node_type, value, weight, source)
      VALUES (p_user_id, 'STYLE'::public.taste_node_type, r_size.category::text, 0.40, 'SIZE')
      ON CONFLICT (user_id, node_type, value) DO NOTHING;
    END LOOP;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 8. RPC Function: get_taste_graph(p_profile_id UUID)
CREATE OR REPLACE FUNCTION public.get_taste_graph(p_profile_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
  v_nodes JSONB;
  v_edges JSONB;
  v_top_categories JSONB;
  v_top_brands JSONB;
BEGIN
  -- Get user_id
  SELECT user_id INTO v_user_id FROM public.gift_profiles WHERE id = p_profile_id;

  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('nodes', '[]'::jsonb, 'edges', '[]'::jsonb, 'top_categories', '[]'::jsonb, 'top_brands', '[]'::jsonb);
  END IF;

  -- Check RLS visibility for INTERESTS
  IF NOT public.can_view_profile(p_profile_id, 'INTERESTS'::public.profile_section) THEN
    RETURN jsonb_build_object('nodes', '[]'::jsonb, 'edges', '[]'::jsonb, 'top_categories', '[]'::jsonb, 'top_brands', '[]'::jsonb, 'restricted', true);
  END IF;

  -- Rebuild graph to ensure freshness
  PERFORM public.rebuild_taste_graph(v_user_id);

  -- Fetch Nodes
  SELECT coalesce(jsonb_agg(jsonb_build_object(
    'id', id,
    'node_type', node_type,
    'value', value,
    'weight', weight,
    'source', source
  )), '[]'::jsonb) INTO v_nodes
  FROM public.taste_graph_nodes
  WHERE user_id = v_user_id;

  -- Fetch Edges
  SELECT coalesce(jsonb_agg(jsonb_build_object(
    'id', id,
    'from_node_id', from_node_id,
    'to_node_id', to_node_id,
    'strength', strength
  )), '[]'::jsonb) INTO v_edges
  FROM public.taste_graph_edges
  WHERE user_id = v_user_id;

  -- Fetch Top Categories
  SELECT coalesce(jsonb_agg(jsonb_build_object('category', value, 'weight', weight)), '[]'::jsonb)
  INTO v_top_categories
  FROM (
    SELECT value, weight FROM public.taste_graph_nodes
    WHERE user_id = v_user_id AND node_type = 'CATEGORY'
    ORDER BY weight DESC LIMIT 5
  ) t_cat;

  -- Fetch Top Brands
  SELECT coalesce(jsonb_agg(jsonb_build_object('brand', value, 'weight', weight)), '[]'::jsonb)
  INTO v_top_brands
  FROM (
    SELECT value, weight FROM public.taste_graph_nodes
    WHERE user_id = v_user_id AND node_type = 'BRAND'
    ORDER BY weight DESC LIMIT 5
  ) t_br;

  RETURN jsonb_build_object(
    'nodes', v_nodes,
    'edges', v_edges,
    'top_categories', v_top_categories,
    'top_brands', v_top_brands,
    'restricted', false
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 9. Automatic Triggers on taste_items and wishes
CREATE OR REPLACE FUNCTION public.handle_taste_graph_trigger()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_TABLE_NAME = 'wishes' THEN
    PERFORM public.rebuild_taste_graph(COALESCE(NEW.user_id, OLD.user_id));
  ELSIF TG_TABLE_NAME = 'taste_items' THEN
    PERFORM public.rebuild_taste_graph((SELECT user_id FROM public.gift_profiles WHERE id = COALESCE(NEW.profile_id, OLD.profile_id)));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_taste_graph_wishes ON public.wishes;
CREATE TRIGGER trg_taste_graph_wishes
  AFTER INSERT OR UPDATE OR DELETE ON public.wishes
  FOR EACH ROW EXECUTE FUNCTION public.handle_taste_graph_trigger();

DROP TRIGGER IF EXISTS trg_taste_graph_items ON public.taste_items;
CREATE TRIGGER trg_taste_graph_items
  AFTER INSERT OR UPDATE OR DELETE ON public.taste_items
  FOR EACH ROW EXECUTE FUNCTION public.handle_taste_graph_trigger();

-- 10. Enable RLS
ALTER TABLE public.taste_graph_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.taste_graph_edges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "taste_nodes_select_policy" ON public.taste_graph_nodes;
CREATE POLICY "taste_nodes_select_policy" ON public.taste_graph_nodes
  FOR SELECT USING (
    user_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM public.gift_profiles gp
      WHERE gp.user_id = taste_graph_nodes.user_id
        AND public.can_view_profile(gp.id, 'INTERESTS'::public.profile_section)
    )
  );

DROP POLICY IF EXISTS "taste_edges_select_policy" ON public.taste_graph_edges;
CREATE POLICY "taste_edges_select_policy" ON public.taste_graph_edges
  FOR SELECT USING (
    user_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM public.gift_profiles gp
      WHERE gp.user_id = taste_graph_edges.user_id
        AND public.can_view_profile(gp.id, 'INTERESTS'::public.profile_section)
    )
  );
