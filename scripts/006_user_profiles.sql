-- Create user profiles table for additional user information
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  farm_name TEXT,
  location TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- RLS policies for user profiles
CREATE POLICY "Users can view their own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON public.user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can delete their own profile" ON public.user_profiles
  FOR DELETE USING (auth.uid() = id);

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create user profile
  INSERT INTO public.user_profiles (id, farm_name, location)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'farm_name', NULL),
    COALESCE(NEW.raw_user_meta_data ->> 'location', NULL)
  )
  ON CONFLICT (id) DO NOTHING;

  -- Create default farm if farm_name is provided
  IF NEW.raw_user_meta_data ->> 'farm_name' IS NOT NULL THEN
    INSERT INTO public.farms (name, location, owner_id)
    VALUES (
      NEW.raw_user_meta_data ->> 'farm_name',
      COALESCE(NEW.raw_user_meta_data ->> 'location', 'Unknown'),
      NEW.id
    )
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger for new user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
