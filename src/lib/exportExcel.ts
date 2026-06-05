import * as XLSX from 'xlsx';
import { supabase } from './supabase';
import { getYear } from './constants';

interface FiltersState {
  search: string;
  pavillon: string;
  nationalite: string;
  niveau: string;
  paiement: string;
  sexe: string;
}

// Extract only the numeric room number (e.g. "PAV E-529" → "529", "529" → "529")
function getRoomNumber(chambre: string | null | undefined): string {
  if (!chambre) return '';
  // Remove "PAV X-", "PAV X ", or similar prefixes
  const cleaned = chambre.replace(/^PAV\s+[A-Z][-\s]*/i, '').trim();
  // If the result is numeric, return it; otherwise return original cleaned value
  return cleaned || chambre;
}

export async function exportStudentsToExcel(filters: FiltersState): Promise<void> {
  // Fetch ALL students matching current filters (no pagination limit)
  let query = supabase.from('students').select('*');
  if (filters.search) query = query.ilike('nom', `%${filters.search}%`);
  if (filters.pavillon) query = query.ilike('pavillon', `%${filters.pavillon}%`);
  if (filters.nationalite) query = query.eq('nationalite', filters.nationalite);
  if (filters.niveau) query = query.eq('niveau', filters.niveau);
  if (filters.paiement === 'oui') query = query.eq('paiement_hebergement', true);
  else if (filters.paiement === 'non') query = query.eq('paiement_hebergement', false);
  if (filters.sexe) query = query.eq('sexe', filters.sexe);
  query = query.order('nom');

  const { data, error } = await query;
  if (error || !data) throw new Error('فشل في جلب البيانات');

  const year = getYear();
  const wb = XLSX.utils.book_new();

  // ───── Sheet: Etrangers ─────
  const etrangersRows: (string | number | null)[][] = [
    // Row 1: empty
    [null],
    // Row 2: Ministry
    [null, "MINISTERE DE L'ENSEIGNEMENT SUPERIEUR ET DE LA RECHERCHE SCIENTIFIQUE"],
    // Row 3: empty
    [null],
    // Row 4: Office
    [null, "OFFICE NATIONALE  DES ŒUVRES UNIVERSITAIRES"],
    // Row 5: DOU
    [null, "DOU : AIN EL BEY - CONSTANTINE -"],
    // Row 6: empty
    [null],
    // Row 7: Title
    [null, `Liste Nominative Des Etudiants Hébergés ETRANGERS   ${year}`],
    // Row 8: Column headers
    [
      'N°', 'MAT DE BAC', 'AN-BAC', 'NOM', 'اللقب بالعربية', 'PRENOM', 'الاسم بالعربية',
      'SEXE', 'DATE_NAIS', 'PRENOM DE PÈRE', 'NOM DE MERE', 'PRENOM DE MERE',
      'FILIERE', 'ANEtud', 'PAYS', 'RU', 'PAVILLON', 'CHAMBRE', 'DOU', 'obs'
    ],
    // Data rows
    ...data.map((s, i) => [
      i + 1,
      s.matricule_bac ?? null,
      s.annee_bac ?? null,
      s.nom ?? null,
      null, // Arabic last name – not stored separately
      null, // French first name – not stored separately
      null, // Arabic first name – not stored separately
      s.sexe ?? null,
      s.date_naissance ?? null,
      null, // Père prénom
      null, // Mère nom
      null, // Mère prénom
      s.filiere ?? null,
      s.niveau ?? null,
      s.nationalite ?? null,
      s.etablissement ?? null,
      s.pavillon ?? null,
      getRoomNumber(s.chambre), // Room number ONLY (e.g. 529, not PAV E-529)
      s.wilaya_bac ?? s.residence ?? null,
      null, // obs
    ]),
  ];

  const wsEtrangers = XLSX.utils.aoa_to_sheet(etrangersRows);

  // Style the header row (row 8 = index 7, sheetjs row 8)
  const headerStyle = {
    font: { bold: true, sz: 10 },
    alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
    fill: { fgColor: { rgb: 'D9E1F2' }, patternType: 'solid' },
    border: {
      top: { style: 'thin' }, bottom: { style: 'thin' },
      left: { style: 'thin' }, right: { style: 'thin' },
    },
  };

  const headerCols = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T'];
  headerCols.forEach(col => {
    const cell = wsEtrangers[`${col}8`];
    if (cell) cell.s = headerStyle;
  });

  // Set column widths
  wsEtrangers['!cols'] = [
    { wch: 5 },  // N°
    { wch: 14 }, // MAT DE BAC
    { wch: 8 },  // AN-BAC
    { wch: 18 }, // NOM
    { wch: 16 }, // اللقب
    { wch: 20 }, // PRENOM
    { wch: 16 }, // الاسم
    { wch: 8 },  // SEXE
    { wch: 13 }, // DATE_NAIS
    { wch: 14 }, // PRENOM PÈRE
    { wch: 14 }, // NOM MERE
    { wch: 14 }, // PRENOM MERE
    { wch: 28 }, // FILIERE
    { wch: 20 }, // ANEtud
    { wch: 16 }, // PAYS
    { wch: 30 }, // RU
    { wch: 10 }, // PAVILLON
    { wch: 10 }, // CHAMBRE
    { wch: 14 }, // DOU
    { wch: 8 },  // obs
  ];

  XLSX.utils.book_append_sheet(wb, wsEtrangers, 'Etrangers');

  // ───── Sheet: Nationaux ─────
  const nationauxRows: (string | number | null)[][] = [
    [null],
    ["MINISTERE DE L'ENSEIGNEMENT SUPERIEUR ET DE LA RECHERCHE SCIENTIFIQUE     "],
    [null],
    ['OFFICE NATIONALE  DES ŒUVRES UNIVERSITAIRES'],
    ['DOU : AIN EL BEY16 - CONSTANTINE -'],
    [null, null, null, `Liste Nominative Des Etudiants Hébergés Nationauxs   ${year}`],
    [' '],
    [null],
    [null],
    [null],
    // Row 11: headers
    [
      'NIN', 'Matricule de Bac', 'Année de Bac', 'Nom', 'اللقب', 'Prénom', 'الإسم',
      'Sexe', 'Date de naissance', 'Prénom du Pére', 'Nom de la mére', 'Prénom de la mére',
      'Filiére', "Année D'étude", 'code Wilaya de Résidence', 'RU', 'Bloc', 'Chambre'
    ],
    // Data rows starting at row 12
    ...data.map(s => [
      s.nin ?? null,
      s.matricule_bac ?? null,
      s.annee_bac ?? null,
      s.nom ?? null,
      null, // Arabic last name
      null, // French first name
      null, // Arabic first name
      s.sexe ?? null,
      s.date_naissance ?? null,
      null, null, null,
      s.filiere ?? null,
      s.niveau ?? null,
      s.wilaya_bac ?? null,
      s.etablissement ?? null,
      s.pavillon ?? null,
      getRoomNumber(s.chambre),
    ]),
  ];

  const wsNationaux = XLSX.utils.aoa_to_sheet(nationauxRows);
  wsNationaux['!cols'] = [
    { wch: 20 }, { wch: 14 }, { wch: 10 }, { wch: 18 }, { wch: 16 },
    { wch: 20 }, { wch: 16 }, { wch: 8 }, { wch: 14 }, { wch: 14 },
    { wch: 14 }, { wch: 14 }, { wch: 28 }, { wch: 20 }, { wch: 16 },
    { wch: 30 }, { wch: 10 }, { wch: 10 },
  ];

  XLSX.utils.book_append_sheet(wb, wsNationaux, 'Nationaux');

  // ───── Generate filename ─────
  const now = new Date();
  const dateStr = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}`;
  const filename = `FN_RU16_Etrangers_${dateStr}.xlsx`;

  XLSX.writeFile(wb, filename);
}
