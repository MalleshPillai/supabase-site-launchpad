-- Creates or updates Auth users for the two relationship members and links
-- relationship_members.user_id. Intended for initial local/preview bootstrap.
--
-- SECURITY: This migration embeds a shared dev password. Rotate credentials in
-- Supabase Auth after bootstrap and avoid using this password in production.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  pair RECORD;
  v_user_id UUID;
  v_password TEXT := 'MalluDarshu@123';
  v_encrypted_pw TEXT;
BEGIN
  FOR pair IN
    SELECT *
    FROM (
      VALUES
        ('malleshpillai18@gmail.com'::TEXT, 'Mallesh'::TEXT),
        ('darshinimallu@gmail.com'::TEXT, 'Darshu'::TEXT)
    ) AS members(email, display_name)
  LOOP
    v_encrypted_pw := crypt(v_password, gen_salt('bf'));

    SELECT id INTO v_user_id
    FROM auth.users
    WHERE lower(email) = lower(pair.email);

    IF v_user_id IS NULL THEN
      v_user_id := gen_random_uuid();

      INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        recovery_sent_at,
        last_sign_in_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at,
        confirmation_token,
        email_change,
        email_change_token_new,
        recovery_token,
        is_super_admin
      )
      VALUES (
        '00000000-0000-0000-0000-000000000000',
        v_user_id,
        'authenticated',
        'authenticated',
        pair.email,
        v_encrypted_pw,
        now(),
        now(),
        now(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        jsonb_build_object('email', pair.email, 'display_name', pair.display_name),
        now(),
        now(),
        '',
        '',
        '',
        '',
        false
      );

      INSERT INTO auth.identities (
        id,
        user_id,
        provider_id,
        identity_data,
        provider,
        last_sign_in_at,
        created_at,
        updated_at
      )
      VALUES (
        gen_random_uuid(),
        v_user_id,
        v_user_id::text,
        jsonb_build_object(
          'sub', v_user_id::text,
          'email', pair.email,
          'email_verified', true
        ),
        'email',
        now(),
        now(),
        now()
      );
    ELSE
      UPDATE auth.users
      SET
        encrypted_password = crypt(v_password, gen_salt('bf')),
        email_confirmed_at = COALESCE(email_confirmed_at, now()),
        updated_at = now()
      WHERE id = v_user_id;

      IF NOT EXISTS (
        SELECT 1
        FROM auth.identities
        WHERE user_id = v_user_id AND provider = 'email'
      ) THEN
        INSERT INTO auth.identities (
          id,
          user_id,
          provider_id,
          identity_data,
          provider,
          last_sign_in_at,
          created_at,
          updated_at
        )
        VALUES (
          gen_random_uuid(),
          v_user_id,
          v_user_id::text,
          jsonb_build_object(
            'sub', v_user_id::text,
            'email', pair.email,
            'email_verified', true
          ),
          'email',
          now(),
          now(),
          now()
        );
      END IF;
    END IF;

    UPDATE public.relationship_members
    SET user_id = v_user_id, updated_at = now()
    WHERE lower(email) = lower(pair.email);
  END LOOP;
END $$;