-- ══════════════════════════════════════════════════════════════
-- ANALYMO — Schéma base de données Supabase
-- Collez ce script dans SQL Editor de votre projet Supabase
-- ══════════════════════════════════════════════════════════════

-- Profils utilisateurs (créé automatiquement à l'inscription)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Création automatique du profil à l'inscription
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Analyses
CREATE TABLE IF NOT EXISTS public.analyses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('document', 'complete', 'pack2', 'pack3')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  title TEXT NOT NULL DEFAULT 'Nouvelle analyse',
  address TEXT,
  document_urls TEXT[] DEFAULT '{}',
  result JSONB,
  stripe_payment_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sécurité : chaque utilisateur ne voit que ses données
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Voir son propre profil" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Modifier son propre profil" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Voir ses propres analyses" ON public.analyses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Créer ses propres analyses" ON public.analyses FOR INSERT WITH CHECK (auth.uid() = user_id);
