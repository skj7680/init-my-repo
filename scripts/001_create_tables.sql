-- Create cattle management tables with proper RLS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Farms table
CREATE TABLE IF NOT EXISTS public.farms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Animals table
CREATE TABLE IF NOT EXISTS public.animals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  tag_number TEXT NOT NULL UNIQUE,
  breed TEXT NOT NULL,
  birth_date DATE NOT NULL,
  weight DECIMAL(8,2),
  health_status TEXT DEFAULT 'healthy',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Milk records table
CREATE TABLE IF NOT EXISTS public.milk_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  animal_id UUID NOT NULL REFERENCES public.animals(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  morning_yield DECIMAL(8,2) DEFAULT 0,
  evening_yield DECIMAL(8,2) DEFAULT 0,
  total_yield DECIMAL(8,2) GENERATED ALWAYS AS (morning_yield + evening_yield) STORED,
  fat_content DECIMAL(5,2),
  protein_content DECIMAL(5,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ML predictions table
CREATE TABLE IF NOT EXISTS public.predictions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  animal_id UUID NOT NULL REFERENCES public.animals(id) ON DELETE CASCADE,
  prediction_type TEXT NOT NULL, -- 'milk_yield' or 'health_risk'
  predicted_value DECIMAL(10,4) NOT NULL,
  confidence_score DECIMAL(5,4) NOT NULL,
  model_version TEXT NOT NULL,
  features JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Model performance tracking
CREATE TABLE IF NOT EXISTS public.model_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  model_name TEXT NOT NULL,
  model_version TEXT NOT NULL,
  metric_name TEXT NOT NULL,
  metric_value DECIMAL(10,6) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.farms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.animals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.milk_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.model_metrics ENABLE ROW LEVEL SECURITY;

-- RLS policies for farms
CREATE POLICY "Users can view their own farms" ON public.farms
  FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Users can insert their own farms" ON public.farms
  FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Users can update their own farms" ON public.farms
  FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Users can delete their own farms" ON public.farms
  FOR DELETE USING (auth.uid() = owner_id);

-- RLS policies for animals (through farm ownership)
CREATE POLICY "Users can view animals from their farms" ON public.animals
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.farms 
      WHERE farms.id = animals.farm_id 
      AND farms.owner_id = auth.uid()
    )
  );
CREATE POLICY "Users can insert animals to their farms" ON public.animals
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.farms 
      WHERE farms.id = animals.farm_id 
      AND farms.owner_id = auth.uid()
    )
  );
CREATE POLICY "Users can update animals from their farms" ON public.animals
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.farms 
      WHERE farms.id = animals.farm_id 
      AND farms.owner_id = auth.uid()
    )
  );
CREATE POLICY "Users can delete animals from their farms" ON public.animals
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.farms 
      WHERE farms.id = animals.farm_id 
      AND farms.owner_id = auth.uid()
    )
  );

-- RLS policies for milk records (through animal ownership)
CREATE POLICY "Users can view milk records from their animals" ON public.milk_records
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.animals 
      JOIN public.farms ON animals.farm_id = farms.id
      WHERE animals.id = milk_records.animal_id 
      AND farms.owner_id = auth.uid()
    )
  );
CREATE POLICY "Users can insert milk records for their animals" ON public.milk_records
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.animals 
      JOIN public.farms ON animals.farm_id = farms.id
      WHERE animals.id = milk_records.animal_id 
      AND farms.owner_id = auth.uid()
    )
  );
CREATE POLICY "Users can update milk records from their animals" ON public.milk_records
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.animals 
      JOIN public.farms ON animals.farm_id = farms.id
      WHERE animals.id = milk_records.animal_id 
      AND farms.owner_id = auth.uid()
    )
  );
CREATE POLICY "Users can delete milk records from their animals" ON public.milk_records
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.animals 
      JOIN public.farms ON animals.farm_id = farms.id
      WHERE animals.id = milk_records.animal_id 
      AND farms.owner_id = auth.uid()
    )
  );

-- RLS policies for predictions (through animal ownership)
CREATE POLICY "Users can view predictions for their animals" ON public.predictions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.animals 
      JOIN public.farms ON animals.farm_id = farms.id
      WHERE animals.id = predictions.animal_id 
      AND farms.owner_id = auth.uid()
    )
  );
CREATE POLICY "Users can insert predictions for their animals" ON public.predictions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.animals 
      JOIN public.farms ON animals.farm_id = farms.id
      WHERE animals.id = predictions.animal_id 
      AND farms.owner_id = auth.uid()
    )
  );

-- Model metrics are read-only for regular users, but we'll allow viewing
CREATE POLICY "Users can view model metrics" ON public.model_metrics
  FOR SELECT USING (true);
