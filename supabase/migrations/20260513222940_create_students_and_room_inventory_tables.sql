/*
  # Create Students and Room Inventory Tables

  1. New Tables
    - `students`
      - `id` (uuid, primary key, auto-generated)
      - `nin` (text, national identification number)
      - `code_photo` (text, photo code)
      - `annee_bac` (integer, baccalaureate year)
      - `matricule_bac` (text, bac registration number)
      - `wilaya_bac` (text, bac wilaya/state)
      - `numero_inscription` (text, university registration number)
      - `nom` (text, full name - required)
      - `date_naissance` (date, date of birth)
      - `sexe` (text, gender)
      - `nationalite` (text, nationality)
      - `residence` (text, residence name)
      - `pavillon` (text, pavilion/building assignment)
      - `chambre` (text, room number)
      - `commune` (text, municipality)
      - `etablissement` (text, university/institution)
      - `domaine` (text, academic domain)
      - `filiere` (text, academic specialty)
      - `niveau` (text, academic level)
      - `frais_inscription_paye` (boolean, registration fees paid)
      - `paiement_hebergement` (boolean, housing fees paid)
      - `cle_remise` (boolean, room key handed over)
      - `created_at` (timestamptz, record creation time)
      - `updated_at` (timestamptz, record update time)

    - `room_inventory`
      - `id` (uuid, primary key, auto-generated)
      - `student_id` (uuid, foreign key to students, cascade delete)
      - `pavillon` (text, pavilion name)
      - `chambre` (text, room number)
      - `matelas` (integer, mattress count, default 1)
      - `couverture` (integer, blanket count, default 1)
      - `drap` (integer, sheet count, default 2)
      - `oreiller` (integer, pillow count, default 1)
      - `taie_oreiller` (integer, pillowcase count, default 1)
      - `chaise` (integer, chair count, default 1)
      - `bureau` (integer, desk count, default 1)
      - `armoire` (integer, wardrobe count, default 1)
      - `notes` (text, additional notes)
      - `date_entree` (date, move-in date)
      - `date_sortie` (date, move-out date)
      - `created_at` (timestamptz, record creation time)
      - `updated_at` (timestamptz, record update time)

  2. Indexes
    - `students_nom_idx` on students(nom) - for name search queries
    - `students_pavillon_idx` on students(pavillon) - for pavilion filtering
    - `students_paiement_idx` on students(paiement_hebergement) - for payment status filtering
    - `room_inventory_student_idx` on room_inventory(student_id) - for student lookup

  3. Security
    - RLS enabled on both tables
    - Per-table policies for SELECT, INSERT, UPDATE, DELETE
    - Policies allow anon and authenticated access (dormitory management app - internal use)

  4. Important Notes
    1. The `numero_inscription` column has a UNIQUE constraint to prevent duplicate student imports
    2. Foreign key on room_inventory(student_id) with CASCADE delete ensures inventory records are removed when a student is deleted
    3. Default values are set for all boolean and integer fields to ensure data consistency
*/

-- Create students table
CREATE TABLE IF NOT EXISTS students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nin text DEFAULT '',
  code_photo text DEFAULT '',
  annee_bac integer,
  matricule_bac text DEFAULT '',
  wilaya_bac text DEFAULT '',
  numero_inscription text UNIQUE DEFAULT '',
  nom text NOT NULL DEFAULT '',
  date_naissance date,
  sexe text DEFAULT '',
  nationalite text DEFAULT '',
  residence text DEFAULT '',
  pavillon text DEFAULT '',
  chambre text DEFAULT '',
  commune text DEFAULT '',
  etablissement text DEFAULT '',
  domaine text DEFAULT '',
  filiere text DEFAULT '',
  niveau text DEFAULT '',
  frais_inscription_paye boolean DEFAULT false,
  paiement_hebergement boolean DEFAULT false,
  cle_remise boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on students
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

-- Students SELECT policy
CREATE POLICY "Allow anon select on students"
  ON students FOR SELECT
  TO anon
  USING (true);

-- Students INSERT policy
CREATE POLICY "Allow anon insert on students"
  ON students FOR INSERT
  TO anon
  WITH CHECK (true);

-- Students UPDATE policy
CREATE POLICY "Allow anon update on students"
  ON students FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- Students DELETE policy
CREATE POLICY "Allow anon delete on students"
  ON students FOR DELETE
  TO anon
  USING (true);

-- Students SELECT policy (authenticated)
CREATE POLICY "Allow authenticated select on students"
  ON students FOR SELECT
  TO authenticated
  USING (true);

-- Students INSERT policy (authenticated)
CREATE POLICY "Allow authenticated insert on students"
  ON students FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Students UPDATE policy (authenticated)
CREATE POLICY "Allow authenticated update on students"
  ON students FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Students DELETE policy (authenticated)
CREATE POLICY "Allow authenticated delete on students"
  ON students FOR DELETE
  TO authenticated
  USING (true);

-- Create indexes for students
CREATE INDEX IF NOT EXISTS students_nom_idx ON students(nom);
CREATE INDEX IF NOT EXISTS students_pavillon_idx ON students(pavillon);
CREATE INDEX IF NOT EXISTS students_paiement_idx ON students(paiement_hebergement);

-- Create room_inventory table
CREATE TABLE IF NOT EXISTS room_inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES students(id) ON DELETE CASCADE,
  pavillon text NOT NULL DEFAULT '',
  chambre text NOT NULL DEFAULT '',
  matelas integer DEFAULT 1,
  couverture integer DEFAULT 1,
  drap integer DEFAULT 2,
  oreiller integer DEFAULT 1,
  taie_oreiller integer DEFAULT 1,
  chaise integer DEFAULT 1,
  bureau integer DEFAULT 1,
  armoire integer DEFAULT 1,
  notes text DEFAULT '',
  date_entree date,
  date_sortie date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on room_inventory
ALTER TABLE room_inventory ENABLE ROW LEVEL SECURITY;

-- Room inventory SELECT policy
CREATE POLICY "Allow anon select on room_inventory"
  ON room_inventory FOR SELECT
  TO anon
  USING (true);

-- Room inventory INSERT policy
CREATE POLICY "Allow anon insert on room_inventory"
  ON room_inventory FOR INSERT
  TO anon
  WITH CHECK (true);

-- Room inventory UPDATE policy
CREATE POLICY "Allow anon update on room_inventory"
  ON room_inventory FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- Room inventory DELETE policy
CREATE POLICY "Allow anon delete on room_inventory"
  ON room_inventory FOR DELETE
  TO anon
  USING (true);

-- Room inventory SELECT policy (authenticated)
CREATE POLICY "Allow authenticated select on room_inventory"
  ON room_inventory FOR SELECT
  TO authenticated
  USING (true);

-- Room inventory INSERT policy (authenticated)
CREATE POLICY "Allow authenticated insert on room_inventory"
  ON room_inventory FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Room inventory UPDATE policy (authenticated)
CREATE POLICY "Allow authenticated update on room_inventory"
  ON room_inventory FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Room inventory DELETE policy (authenticated)
CREATE POLICY "Allow authenticated delete on room_inventory"
  ON room_inventory FOR DELETE
  TO authenticated
  USING (true);

-- Create index for room_inventory student lookup
CREATE INDEX IF NOT EXISTS room_inventory_student_idx ON room_inventory(student_id);