-- ========================================================
-- Supabase Row Level Security (RLS) Policies for ReMat Platform
-- ========================================================

-- Enable RLS on core tables
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "distributor_profiles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "consumer_profiles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "categories" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "materials" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "material_documents" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "material_embeddings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "transactions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "transaction_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "payments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ratings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "circular_reports" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "chat_conversations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "chat_messages" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "material_alerts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "banners" ENABLE ROW LEVEL SECURITY;

-- 1. Public / Anon Read Policies
CREATE POLICY "Public read active categories" ON "categories"
  FOR SELECT USING (true);

CREATE POLICY "Public read active banners" ON "banners"
  FOR SELECT USING (is_active = true);

CREATE POLICY "Public read active materials" ON "materials"
  FOR SELECT USING (status = 'ACTIVE');

CREATE POLICY "Public read material documents" ON "material_documents"
  FOR SELECT USING (true);

-- 2. Authenticated Profiles Read Policies
CREATE POLICY "Public read distributor profiles" ON "distributor_profiles"
  FOR SELECT USING (true);

CREATE POLICY "Public read consumer profiles" ON "consumer_profiles"
  FOR SELECT USING (true);

-- 3. Owner Access Policies (User-specific)
CREATE POLICY "Users can manage own account" ON "users"
  FOR ALL USING (auth.uid()::text = id);

CREATE POLICY "Distributors can manage own profile" ON "distributor_profiles"
  FOR ALL USING (auth.uid()::text = user_id);

CREATE POLICY "Consumers can manage own profile" ON "consumer_profiles"
  FOR ALL USING (auth.uid()::text = user_id);

CREATE POLICY "Distributors can manage own materials" ON "materials"
  FOR ALL USING (
    distributor_id IN (
      SELECT id FROM distributor_profiles WHERE user_id = auth.uid()::text
    )
  );

CREATE POLICY "Consumers can manage own chat conversations" ON "chat_conversations"
  FOR ALL USING (
    consumer_id IN (
      SELECT id FROM consumer_profiles WHERE user_id = auth.uid()::text
    )
  );

CREATE POLICY "Consumers can manage own chat messages" ON "chat_messages"
  FOR ALL USING (
    conversation_id IN (
      SELECT cc.id FROM chat_conversations cc
      JOIN consumer_profiles cp ON cc.consumer_id = cp.id
      WHERE cp.user_id = auth.uid()::text
    )
  );

CREATE POLICY "Consumers can manage own alerts" ON "material_alerts"
  FOR ALL USING (
    consumer_id IN (
      SELECT id FROM consumer_profiles WHERE user_id = auth.uid()::text
    )
  );

-- Note: Supabase Service Role Key automatically bypasses all RLS policies on the server side.
