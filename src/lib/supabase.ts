import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Student = {
  id: string;
  nin: string | null;
  code_photo: string | null;
  annee_bac: number | null;
  matricule_bac: string | null;
  wilaya_bac: string | null;
  numero_inscription: string | null;
  nom: string;
  date_naissance: string | null;
  lieu_naissance: string;
  sexe: string;
  nationalite: string;
  residence: string;
  pavillon: string;
  chambre: string;
  commune: string;
  etablissement: string;
  domaine: string;
  filiere: string;
  niveau: string;
  frais_inscription_paye: boolean;
  paiement_hebergement: boolean;
  cle_remise: boolean;
  created_at: string;
  updated_at: string;
};

export type RoomInventory = {
  id: string;
  student_id: string;
  pavillon: string;
  chambre: string;
  matelas: number;
  couverture: number;
  drap: number;
  oreiller: number;
  taie_oreiller: number;
  chaise: number;
  bureau: number;
  armoire: number;
  notes: string;
  date_entree: string | null;
  date_sortie: string | null;
  created_at: string;
  updated_at: string;
};
