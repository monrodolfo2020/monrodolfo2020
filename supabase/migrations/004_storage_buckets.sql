-- ============================================================
-- Migration 004: Storage Buckets & Policies
-- Mall Management SAAS Platform
-- ============================================================

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  (
    'mall-media',
    'mall-media',
    FALSE,
    52428800, -- 50 MB
    ARRAY[
      'image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif',
      'video/mp4', 'video/quicktime'
    ]
  ),
  (
    'mall-documents',
    'mall-documents',
    FALSE,
    20971520, -- 20 MB
    ARRAY[
      'application/pdf',
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]
  ),
  (
    'mall-logos',
    'mall-logos',
    TRUE, -- Public: logos are served publicly
    5242880, -- 5 MB
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
  ),
  (
    'qr-codes',
    'qr-codes',
    FALSE,
    2097152, -- 2 MB
    ARRAY['image/png', 'image/svg+xml', 'application/pdf']
  )
ON CONFLICT (id) DO NOTHING;

-- ─── Helper: get user mall_id from JWT ────────────────────────────────────────

CREATE OR REPLACE FUNCTION storage.get_user_mall_id()
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT mall_id FROM user_profiles WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION storage.get_user_role()
RETURNS TEXT LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT role FROM user_profiles WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION storage.user_is_admin()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT role IN ('super_admin', 'mall_admin')
  FROM user_profiles
  WHERE id = auth.uid()
$$;

-- ─── Storage RLS Policies: mall-media ─────────────────────────────────────────
-- Path convention: {mall_id}/{module}/{record_id}/{filename}
-- e.g. "abc-123/maintenance/task-456/photo1.jpg"

CREATE POLICY "mall_media_select"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'mall-media'
  AND (
    -- Super admins see everything
    storage.get_user_role() = 'super_admin'
    -- Users see only their mall's files
    OR (storage.path_tokens[1])::UUID = storage.get_user_mall_id()
  )
);

CREATE POLICY "mall_media_insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'mall-media'
  AND (
    storage.get_user_role() = 'super_admin'
    OR (storage.path_tokens[1])::UUID = storage.get_user_mall_id()
  )
);

CREATE POLICY "mall_media_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'mall-media'
  AND (
    storage.get_user_role() = 'super_admin'
    OR (
      (storage.path_tokens[1])::UUID = storage.get_user_mall_id()
      AND storage.user_is_admin()
    )
  )
)
WITH CHECK (
  bucket_id = 'mall-media'
  AND (
    storage.get_user_role() = 'super_admin'
    OR (storage.path_tokens[1])::UUID = storage.get_user_mall_id()
  )
);

CREATE POLICY "mall_media_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'mall-media'
  AND (
    storage.get_user_role() = 'super_admin'
    OR (
      (storage.path_tokens[1])::UUID = storage.get_user_mall_id()
      AND storage.user_is_admin()
    )
  )
);

-- ─── Storage RLS Policies: mall-documents ─────────────────────────────────────
-- Path: {mall_id}/{type}/{filename}
-- types: csv-imports, sop-docs, reports

CREATE POLICY "mall_documents_select"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'mall-documents'
  AND (
    storage.get_user_role() = 'super_admin'
    OR (storage.path_tokens[1])::UUID = storage.get_user_mall_id()
  )
);

CREATE POLICY "mall_documents_insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'mall-documents'
  AND (
    storage.get_user_role() = 'super_admin'
    OR (
      (storage.path_tokens[1])::UUID = storage.get_user_mall_id()
      AND storage.user_is_admin()
    )
  )
);

CREATE POLICY "mall_documents_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'mall-documents'
  AND (
    storage.get_user_role() = 'super_admin'
    OR (
      (storage.path_tokens[1])::UUID = storage.get_user_mall_id()
      AND storage.user_is_admin()
    )
  )
);

-- ─── Storage RLS Policies: mall-logos (public read) ───────────────────────────

CREATE POLICY "mall_logos_select_public"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'mall-logos');

CREATE POLICY "mall_logos_insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'mall-logos'
  AND (
    storage.get_user_role() = 'super_admin'
    OR (
      (storage.path_tokens[1])::UUID = storage.get_user_mall_id()
      AND storage.user_is_admin()
    )
  )
);

CREATE POLICY "mall_logos_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'mall-logos'
  AND (
    storage.get_user_role() = 'super_admin'
    OR (
      (storage.path_tokens[1])::UUID = storage.get_user_mall_id()
      AND storage.user_is_admin()
    )
  )
)
WITH CHECK (bucket_id = 'mall-logos');

-- ─── Storage RLS Policies: qr-codes ──────────────────────────────────────────
-- Path: {mall_id}/checkpoints/{checkpoint_id}.png

CREATE POLICY "qr_codes_select"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'qr-codes'
  AND (
    storage.get_user_role() = 'super_admin'
    OR (storage.path_tokens[1])::UUID = storage.get_user_mall_id()
  )
);

CREATE POLICY "qr_codes_insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'qr-codes'
  AND storage.user_is_admin()
);

-- Service role bypass for Edge Functions
CREATE POLICY "service_role_all_buckets"
ON storage.objects FOR ALL
TO service_role
USING (TRUE)
WITH CHECK (TRUE);

-- ─── Trigger: notify when CSV uploaded to mall-documents ─────────────────────

CREATE OR REPLACE FUNCTION storage.notify_csv_upload()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  mall_id_text TEXT;
  file_name    TEXT;
BEGIN
  -- Only trigger for CSV files in mall-documents/csv-imports/
  IF NEW.bucket_id = 'mall-documents'
     AND NEW.name LIKE '%/csv-imports/%'
     AND (NEW.name LIKE '%.csv' OR NEW.name LIKE '%.CSV')
  THEN
    mall_id_text := (string_to_array(NEW.name, '/'))[1];
    file_name    := (string_to_array(NEW.name, '/'))[array_length(string_to_array(NEW.name, '/'), 1)];

    -- Insert a pending import job so the Edge Function can pick it up
    INSERT INTO inventory_import_jobs (mall_id, file_url, status)
    VALUES (
      mall_id_text::UUID,
      NEW.name,
      'pending'
    )
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_csv_upload_notify
AFTER INSERT ON storage.objects
FOR EACH ROW EXECUTE FUNCTION storage.notify_csv_upload();
