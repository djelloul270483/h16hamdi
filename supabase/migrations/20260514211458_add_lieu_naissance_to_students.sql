/*
  # Add lieu_naissance column to students table

  1. Modified Tables
    - `students`
      - Added `lieu_naissance` (text, place of birth) column after `date_naissance`
      - Default value: empty string

  2. Security
    - No changes to RLS policies

  3. Important Notes
    1. This field stores the birth place (commune/wilaya) of the student
    2. Used in housing and clearance certificates
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'students' AND column_name = 'lieu_naissance'
  ) THEN
    ALTER TABLE students ADD COLUMN lieu_naissance text DEFAULT '';
  END IF;
END $$;
