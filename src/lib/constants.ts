export const PAVILIONS = [
  {
    id: 'A',
    name: 'جناح A',
    label: 'PAV A',
    color: '#0ea5e9',
    capacity: 1,
    floors: [
      { name: 'الطابق السفلي', prefix: 0, start: 1, end: 36 },
      { name: 'الطابق الأول', prefix: 1, start: 1, end: 36 },
      { name: 'الطابق الثاني', prefix: 2, start: 1, end: 44 },
      { name: 'الطابق الثالث', prefix: 3, start: 1, end: 44 },
      { name: 'الطابق الرابع', prefix: 4, start: 1, end: 44 },
    ],
  },
  {
    id: 'B',
    name: 'جناح B',
    label: 'PAV B',
    color: '#10b981',
    capacity: 1,
    floors: [
      { name: 'الطابق السفلي', prefix: 0, start: 1, end: 18 },
      { name: 'الطابق الأول', prefix: 1, start: 1, end: 25 },
      { name: 'الطابق الثاني', prefix: 2, start: 1, end: 25 },
      { name: 'الطابق الثالث', prefix: 3, start: 1, end: 25 },
      { name: 'الطابق الرابع', prefix: 4, start: 1, end: 25 },
      { name: 'الطابق الخامس', prefix: 5, start: 1, end: 12 },
    ],
  },
  {
    id: 'C',
    name: 'جناح C',
    label: 'PAV C',
    color: '#f59e0b',
    capacity: 1,
    floors: [
      { name: 'الطابق السفلي', prefix: 0, start: 1, end: 18 },
      { name: 'الطابق الأول', prefix: 1, start: 1, end: 25 },
      { name: 'الطابق الثاني', prefix: 2, start: 1, end: 25 },
      { name: 'الطابق الثالث', prefix: 3, start: 1, end: 25 },
      { name: 'الطابق الرابع', prefix: 4, start: 1, end: 25 },
      { name: 'الطابق الخامس', prefix: 5, start: 1, end: 12 },
    ],
  },
  {
    id: 'D',
    name: 'جناح D',
    label: 'PAV D',
    color: '#ef4444',
    capacity: 2,
    floors: [
      { name: 'الطابق السفلي', prefix: 0, start: 1, end: 22 },
      { name: 'الطابق الأول', prefix: 1, start: 1, end: 33 },
      { name: 'الطابق الثاني', prefix: 2, start: 1, end: 33 },
      { name: 'الطابق الثالث', prefix: 3, start: 1, end: 33 },
      { name: 'الطابق الرابع', prefix: 4, start: 1, end: 33 },
      { name: 'الطابق الخامس', prefix: 5, start: 1, end: 33 },
    ],
  },
  {
    id: 'E',
    name: 'جناح E',
    label: 'PAV E',
    color: '#0d9488',
    capacity: 2,
    floors: [
      { name: 'الطابق السفلي', prefix: 0, start: 1, end: 22 },
      { name: 'الطابق الأول', prefix: 1, start: 1, end: 27 },
      { name: 'الطابق الثاني', prefix: 2, start: 1, end: 29 },
      { name: 'الطابق الثالث', prefix: 3, start: 1, end: 28 },
      { name: 'الطابق الرابع', prefix: 4, start: 1, end: 28 },
      { name: 'الطابق الخامس', prefix: 5, start: 1, end: 29 },
    ],
  },
  {
    id: 'F',
    name: 'جناح F',
    label: 'PAV F',
    color: '#e11d48',
    capacity: 1,
    floors: [
      { name: 'الطابق السفلي', prefix: 0, start: 1, end: 20 },
      { name: 'الطابق الأول', prefix: 1, start: 1, end: 33 },
      { name: 'الطابق الثاني', prefix: 2, start: 1, end: 33 },
      { name: 'الطابق الثالث', prefix: 3, start: 1, end: 33 },
      { name: 'الطابق الرابع', prefix: 4, start: 1, end: 33 },
      { name: 'الطابق الخامس', prefix: 5, start: 1, end: 33 },
    ],
  },
] as const;

export type PavilionFloor = {
  name: string;
  prefix: number;
  start: number;
  end: number;
};

export type Pavilion = {
  id: string;
  name: string;
  label: string;
  color: string;
  capacity: number;
  floors: PavilionFloor[];
};

export const RESIDENCE_NAME = 'الإقامة الجامعية عين الباي 16';
export const DIRECTORATE = 'مديرية الخدمات الجامعية عين الباي - قسنطينة';
export const NATIONAL_OFFICE = 'الديوان الوطني للخدمات الجامعية';
export const DEFAULT_YEAR = '2025/2026';

export function getYear(): string {
  return localStorage.getItem('academic_year') || DEFAULT_YEAR;
}

export function setYear(year: string): void {
  localStorage.setItem('academic_year', year);
}
