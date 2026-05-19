export interface Language {
  label: string;
  value: string;
  code: string; // ISO 3166-1 alpha-2 country code for the flag
}

export const LANGUAGES: Language[] = [
  { label: "English", value: "English", code: "gb" },
  { label: "Sinhala", value: "Sinhala", code: "lk" },
  { label: "Tamil", value: "Tamil", code: "lk" },
  { label: "French", value: "French", code: "fr" },
  { label: "German", value: "German", code: "de" },
  { label: "Italian", value: "Italian", code: "it" },
  { label: "Spanish", value: "Spanish", code: "es" },
  { label: "Chinese (Mandarin)", value: "Chinese", code: "cn" },
  { label: "Japanese", value: "Japanese", code: "jp" },
  { label: "Korean", value: "Korean", code: "kr" },
  { label: "Russian", value: "Russian", code: "ru" },
  { label: "Arabic", value: "Arabic", code: "sa" },
  { label: "Portuguese", value: "Portuguese", code: "pt" },
  { label: "Hindi", value: "Hindi", code: "in" },
  { label: "Bengali", value: "Bengali", code: "bd" },
  { label: "Dutch", value: "Dutch", code: "nl" },
  { label: "Swedish", value: "Swedish", code: "se" },
  { label: "Norwegian", value: "Norwegian", code: "no" },
  { label: "Danish", value: "Danish", code: "dk" },
  { label: "Finnish", value: "Finnish", code: "fi" },
  { label: "Polish", value: "Polish", code: "pl" },
  { label: "Turkish", value: "Turkish", code: "tr" },
  { label: "Greek", value: "Greek", code: "gr" },
  { label: "Hebrew", value: "Hebrew", code: "il" },
  { label: "Thai", value: "Thai", code: "th" },
  { label: "Vietnamese", value: "Vietnamese", code: "vn" },
  { label: "Indonesian", value: "Indonesian", code: "id" },
  { label: "Malay", value: "Malay", code: "my" },
];
