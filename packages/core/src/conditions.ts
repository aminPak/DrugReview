import type { LabelSection } from "./interactions";

/**
 * Health conditions and life stages a person can add to their profile, with the phrases official
 * drug labels use for them.
 *
 * Like the supplement list, this is a vocabulary, not clinical content: it only says how labels
 * refer to a condition, so the API can find where a label warns about it. Clinical review should
 * check these phrases and map each condition to SNOMED CT Canadian Edition / ICD-10-CA codes.
 */
export type ConditionCategory =
  | "heart_circulation"
  | "brain_nerves"
  | "mental_health"
  | "kidney_liver"
  | "hormones_metabolism"
  | "lungs"
  | "digestive"
  | "blood"
  | "bones_joints_muscles"
  | "eyes_urinary"
  | "life_stage";

export interface Condition {
  id: string;
  name: string;
  /** Other names people search for. */
  aliases: readonly string[];
  /** Phrases to find in labels, in lower case. */
  searchTerms: readonly string[];
  category: ConditionCategory;
  /** Label sections to search, if different from the default set. */
  sections?: readonly LabelSection[];
}

/** Label sections where a condition warning matters, most serious first. */
export const CONDITION_SECTIONS: readonly LabelSection[] = [
  "boxed_warning",
  "contraindications",
  "warnings_and_cautions",
  "warnings",
  "precautions",
  "do_not_use",
  "ask_doctor",
  "ask_doctor_or_pharmacist",
];

export const CONDITIONS: readonly Condition[] = [
  // Brain and nerves
  {
    id: "myasthenia-gravis",
    name: "Myasthenia gravis",
    aliases: ["mg"],
    searchTerms: ["myasthenia gravis", "myasthenia", "myasthenic", "neuromuscular disorders"],
    category: "brain_nerves",
  },
  {
    id: "epilepsy",
    name: "Epilepsy or seizures",
    aliases: ["seizure disorder", "convulsions"],
    searchTerms: ["seizure", "seizures", "epilepsy", "convulsions", "seizure threshold"],
    category: "brain_nerves",
  },
  {
    id: "parkinsons",
    name: "Parkinson's disease",
    aliases: ["parkinson"],
    searchTerms: ["parkinson's disease", "parkinson disease", "parkinsonism"],
    category: "brain_nerves",
  },
  {
    id: "dementia",
    name: "Dementia",
    aliases: ["alzheimer's disease"],
    searchTerms: ["dementia", "dementia-related", "alzheimer"],
    category: "brain_nerves",
  },
  {
    id: "stroke",
    name: "Stroke (history)",
    aliases: ["tia", "mini-stroke"],
    searchTerms: ["stroke", "cerebrovascular", "transient ischemic attack"],
    category: "brain_nerves",
  },
  {
    id: "peripheral-neuropathy",
    name: "Peripheral neuropathy",
    aliases: ["nerve damage"],
    searchTerms: ["peripheral neuropathy", "neuropathy"],
    category: "brain_nerves",
  },
  // Heart and circulation
  {
    id: "heart-failure",
    name: "Heart failure",
    aliases: ["congestive heart failure", "chf"],
    searchTerms: ["heart failure", "congestive heart failure", "cardiac failure"],
    category: "heart_circulation",
  },
  {
    id: "coronary-artery-disease",
    name: "Heart disease or past heart attack",
    aliases: ["coronary artery disease", "angina", "heart attack"],
    searchTerms: [
      "coronary artery disease",
      "heart disease",
      "ischemic heart disease",
      "myocardial infarction",
      "heart attack",
      "angina",
    ],
    category: "heart_circulation",
  },
  {
    id: "arrhythmia",
    name: "Heart rhythm problem (incl. long QT)",
    aliases: ["arrhythmia", "atrial fibrillation", "long qt", "qt prolongation"],
    searchTerms: [
      "qt prolongation",
      "prolonged qt",
      "long qt",
      "qt interval",
      "torsade de pointes",
      "arrhythmia",
      "arrhythmias",
      "heart block",
      "atrial fibrillation",
    ],
    category: "heart_circulation",
  },
  {
    id: "hypertension",
    name: "High blood pressure",
    aliases: ["hypertension"],
    searchTerms: ["hypertension", "high blood pressure"],
    category: "heart_circulation",
  },
  // Mental health
  {
    id: "depression",
    name: "Depression",
    aliases: ["major depressive disorder"],
    searchTerms: ["depression", "depressive", "suicidal thoughts", "suicidality"],
    category: "mental_health",
  },
  {
    id: "bipolar",
    name: "Bipolar disorder",
    aliases: ["manic depression"],
    searchTerms: ["bipolar", "mania", "manic"],
    category: "mental_health",
  },
  {
    id: "alcohol-use",
    name: "Alcohol use disorder",
    aliases: ["alcoholism"],
    searchTerms: [
      "alcohol abuse",
      "alcoholism",
      "alcohol use disorder",
      "3 or more alcoholic drinks",
      "chronic alcohol",
    ],
    category: "mental_health",
  },
  // Kidney and liver
  {
    id: "kidney-disease",
    name: "Kidney disease",
    aliases: ["chronic kidney disease", "ckd", "renal impairment"],
    searchTerms: [
      "kidney disease",
      "renal impairment",
      "renal failure",
      "renal disease",
      "renal insufficiency",
      "impaired renal function",
      "kidney problems",
    ],
    category: "kidney_liver",
  },
  {
    id: "liver-disease",
    name: "Liver disease",
    aliases: ["cirrhosis", "hepatitis", "hepatic impairment"],
    searchTerms: [
      "liver disease",
      "hepatic impairment",
      "hepatic disease",
      "cirrhosis",
      "liver cirrhosis",
      "impaired hepatic function",
      "hepatic failure",
    ],
    category: "kidney_liver",
  },
  {
    id: "kidney-stones",
    name: "Kidney stones",
    aliases: ["nephrolithiasis"],
    searchTerms: ["kidney stones", "nephrolithiasis", "renal calculi"],
    category: "kidney_liver",
  },
  // Hormones and metabolism
  {
    id: "diabetes",
    name: "Diabetes",
    aliases: ["type 1 diabetes", "type 2 diabetes"],
    searchTerms: ["diabetes", "diabetic", "blood glucose", "hypoglycemia", "hyperglycemia"],
    category: "hormones_metabolism",
  },
  {
    id: "hypothyroidism",
    name: "Underactive thyroid",
    aliases: ["hypothyroidism"],
    searchTerms: ["hypothyroidism", "thyroid disease"],
    category: "hormones_metabolism",
  },
  {
    id: "hyperthyroidism",
    name: "Overactive thyroid",
    aliases: ["hyperthyroidism", "graves' disease"],
    searchTerms: ["hyperthyroidism", "thyrotoxicosis", "thyroid disease"],
    category: "hormones_metabolism",
  },
  {
    id: "gout",
    name: "Gout",
    aliases: ["high uric acid"],
    searchTerms: ["gout", "hyperuricemia"],
    category: "hormones_metabolism",
  },
  {
    id: "phenylketonuria",
    name: "Phenylketonuria (PKU)",
    aliases: ["pku"],
    searchTerms: ["phenylketonuria", "phenylketonurics", "phenylalanine"],
    category: "hormones_metabolism",
  },
  {
    id: "porphyria",
    name: "Porphyria",
    aliases: [],
    searchTerms: ["porphyria"],
    category: "hormones_metabolism",
  },
  {
    id: "low-potassium",
    name: "Low potassium",
    aliases: ["hypokalemia"],
    searchTerms: ["hypokalemia", "low potassium"],
    category: "hormones_metabolism",
  },
  {
    id: "high-potassium",
    name: "High potassium",
    aliases: ["hyperkalemia"],
    searchTerms: ["hyperkalemia", "high potassium"],
    category: "hormones_metabolism",
  },
  // Lungs
  {
    id: "asthma",
    name: "Asthma",
    aliases: [],
    searchTerms: ["asthma", "bronchospasm"],
    category: "lungs",
  },
  {
    id: "copd",
    name: "COPD",
    aliases: ["emphysema", "chronic bronchitis"],
    searchTerms: ["copd", "chronic obstructive pulmonary disease", "emphysema"],
    category: "lungs",
  },
  {
    id: "sleep-apnea",
    name: "Sleep apnea",
    aliases: ["obstructive sleep apnea"],
    searchTerms: ["sleep apnea", "respiratory depression"],
    category: "lungs",
  },
  // Digestive
  {
    id: "stomach-ulcer",
    name: "Stomach ulcer or stomach bleeding",
    aliases: ["peptic ulcer", "gi bleeding"],
    searchTerms: [
      "peptic ulcer",
      "stomach ulcer",
      "stomach ulcers",
      "gastrointestinal bleeding",
      "stomach bleeding",
      "history of stomach problems",
    ],
    category: "digestive",
  },
  // Blood
  {
    id: "bleeding-disorder",
    name: "Bleeding disorder",
    aliases: ["hemophilia", "von willebrand disease"],
    searchTerms: ["bleeding disorder", "bleeding disorders", "hemophilia", "coagulation disorders"],
    category: "blood",
  },
  {
    id: "g6pd-deficiency",
    name: "G6PD deficiency",
    aliases: ["glucose-6-phosphate dehydrogenase deficiency"],
    searchTerms: ["g6pd", "glucose-6-phosphate dehydrogenase"],
    category: "blood",
  },
  // Bones, joints and muscles
  {
    id: "osteoporosis",
    name: "Osteoporosis",
    aliases: ["low bone density"],
    searchTerms: ["osteoporosis", "bone loss", "bone mineral density"],
    category: "bones_joints_muscles",
  },
  {
    id: "lupus",
    name: "Lupus",
    aliases: ["sle", "systemic lupus erythematosus"],
    searchTerms: ["lupus", "systemic lupus erythematosus"],
    category: "bones_joints_muscles",
  },
  // Eyes and urinary
  {
    id: "glaucoma",
    name: "Glaucoma",
    aliases: ["narrow-angle glaucoma"],
    searchTerms: ["glaucoma", "angle-closure", "narrow-angle", "narrow angle"],
    category: "eyes_urinary",
  },
  {
    id: "enlarged-prostate",
    name: "Enlarged prostate",
    aliases: ["bph", "benign prostatic hyperplasia"],
    searchTerms: [
      "enlarged prostate",
      "prostatic hypertrophy",
      "benign prostatic hyperplasia",
      "urinary retention",
      "trouble urinating",
    ],
    category: "eyes_urinary",
  },
  // Life stages
  {
    id: "pregnancy",
    name: "Pregnant or planning pregnancy",
    aliases: ["pregnant"],
    searchTerms: ["pregnancy", "pregnant", "pregnant women", "if pregnant"],
    category: "life_stage",
    sections: [
      "boxed_warning",
      "contraindications",
      "warnings_and_cautions",
      "warnings",
      "do_not_use",
      "pregnancy_or_breast_feeding",
    ],
  },
  {
    id: "breastfeeding",
    name: "Breastfeeding",
    aliases: ["nursing", "lactation"],
    searchTerms: ["breastfeeding", "breast-feeding", "nursing mothers", "lactation"],
    category: "life_stage",
    sections: [
      "boxed_warning",
      "contraindications",
      "warnings_and_cautions",
      "warnings",
      "do_not_use",
      "pregnancy_or_breast_feeding",
    ],
  },
  {
    id: "age-65-plus",
    name: "Age 65 or older",
    aliases: ["older adult", "senior", "elderly"],
    searchTerms: ["elderly", "geriatric", "older adults", "older patients", "65 years of age"],
    category: "life_stage",
    sections: ["boxed_warning", "contraindications", "warnings_and_cautions", "warnings"],
  },
];

const byId = new Map(CONDITIONS.map((c) => [c.id, c]));

export function getCondition(id: string): Condition | undefined {
  return byId.get(id);
}

/** Conditions whose name or alias matches the query, best matches first. */
export function searchConditions(query: string, limit = 8): Condition[] {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];
  const scored: { condition: Condition; score: number }[] = [];
  for (const condition of CONDITIONS) {
    const names = [condition.name, ...condition.aliases].map((n) => n.toLowerCase());
    if (names.some((n) => n.startsWith(q))) scored.push({ condition, score: 0 });
    else if (names.some((n) => n.split(/[\s(-]+/).some((w) => w.startsWith(q))))
      scored.push({ condition, score: 1 });
    else if (names.some((n) => n.includes(q))) scored.push({ condition, score: 2 });
  }
  return scored
    .sort((a, b) => a.score - b.score || a.condition.name.localeCompare(b.condition.name))
    .slice(0, limit)
    .map((s) => s.condition);
}
