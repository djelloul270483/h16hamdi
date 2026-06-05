/*
  # Deduplicate students by matricule_bac and add unique constraint

  1. Modified Tables
    - `students`
      - Removed duplicate rows keeping the most recent entry per matricule_bac
      - Dropped old unique constraint on numero_inscription
      - Added unique constraint on matricule_bac (partial, excluding empty strings)

  2. Security
    - No changes to RLS policies

  3. Important Notes
    1. For duplicate matricule_bac values, only the most recently updated record is kept
    2. matricule_bac is now the primary deduplication key for imports
    3. Empty matricule_bac values are excluded from the unique constraint
*/

-- Remove duplicates: keep the most recently updated row per matricule_bac
DELETE FROM students a
USING students b
WHERE a.matricule_bac = b.matricule_bac
  AND a.matricule_bac <> ''
  AND a.updated_at < b.updated_at;

-- Drop old unique constraint on numero_inscription
ALTER TABLE students DROP CONSTRAINT IF EXISTS students_numero_inscription_key;

-- Add unique constraint on matricule_bac (partial for non-empty)
CREATE UNIQUE INDEX IF NOT EXISTS students_matricule_bac_key
  ON students (matricule_bac)
  WHERE matricule_bac <> '';
