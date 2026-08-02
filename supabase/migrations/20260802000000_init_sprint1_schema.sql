-- Migration: Sprint 1 Schema (Leor)
-- Tables: users, gift_profiles, profile_sizes, taste_items, current_focuses, anti_gift_preferences

-- 1. Users Table
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_id BIGINT UNIQUE NOT NULL,
  username TEXT,
  first_name TEXT NOT NULL,
  last_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Gift Profiles Table
CREATE TABLE IF NOT EXISTS public.gift_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  bio TEXT,
  birth_date DATE,
  city TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Profile Sizes Table
CREATE TABLE IF NOT EXISTS public.profile_sizes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.gift_profiles(id) ON DELETE CASCADE,
  category TEXT NOT NULL, -- CLOTHING_TOP, CLOTHING_BOTTOM, SHOES, RING, BRACELET, NECKLACE
  value TEXT NOT NULL,
  visibility TEXT NOT NULL DEFAULT 'CIRCLE', -- PRIVATE, CIRCLE, SELECTED_CIRCLES, PUBLIC
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profile_sizes_profile_category ON public.profile_sizes (profile_id, category);

-- 4. Taste Items Table (Interests)
CREATE TABLE IF NOT EXISTS public.taste_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.gift_profiles(id) ON DELETE CASCADE,
  category TEXT NOT NULL, -- MOVIES, BOOKS, GAMES, MUSIC, TRAVEL, STYLE, HOME, FOOD, SPORT, HOBBY, BRANDS
  title TEXT NOT NULL,
  weight FLOAT NOT NULL DEFAULT 1.0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_taste_items_profile_category ON public.taste_items (profile_id, category);

-- 5. Current Focuses Table
CREATE TABLE IF NOT EXISTS public.current_focuses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.gift_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Anti Gift Preferences Table
CREATE TABLE IF NOT EXISTS public.anti_gift_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.gift_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gift_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_sizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.taste_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.current_focuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anti_gift_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Users
CREATE POLICY "Users can view their own record" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own record" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for Gift Profiles
CREATE POLICY "Users can view their own gift profile" ON public.gift_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own gift profile" ON public.gift_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own gift profile" ON public.gift_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for Profile Sizes
CREATE POLICY "Users can manage their profile sizes" ON public.profile_sizes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.gift_profiles gp 
      WHERE gp.id = profile_sizes.profile_id AND gp.user_id = auth.uid()
    )
  );

-- RLS Policies for Taste Items
CREATE POLICY "Users can manage their taste items" ON public.taste_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.gift_profiles gp 
      WHERE gp.id = taste_items.profile_id AND gp.user_id = auth.uid()
    )
  );

-- RLS Policies for Current Focuses
CREATE POLICY "Users can manage their current focuses" ON public.current_focuses
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.gift_profiles gp 
      WHERE gp.id = current_focuses.profile_id AND gp.user_id = auth.uid()
    )
  );

-- RLS Policies for Anti Gift Preferences
CREATE POLICY "Users can manage anti gift preferences" ON public.anti_gift_preferences
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.gift_profiles gp 
      WHERE gp.id = anti_gift_preferences.profile_id AND gp.user_id = auth.uid()
    )
  );
