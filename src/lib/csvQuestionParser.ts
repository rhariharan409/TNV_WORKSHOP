/**
 * Utility for parsing and validating Multiple-Choice Examination Questions from CSV files.
 * Supports options containing numbers (e.g. 2, 3, 44, 200) and flexible correct-answer indicators.
 */

export interface ParsedQuestionRow {
  rowNum: number;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_raw: string;
  correct_option_index: number;
  marks: number;
  error?: string;
  isValid: boolean;
}

/**
 * Resolves the correct option index (0..3) from user input or CSV column value.
 * Handles:
 * 1. Exact text/numeric match with one of the options (e.g. "44", "2", "3", "HTML")
 * 2. Letter representation: "A", "B", "C", "D" (or "Option A", "Opt B", "(c)", "D.")
 * 3. 1-based number index: "1" -> 0, "2" -> 1, "3" -> 2, "4" -> 3 (when not matching literal option text)
 * 4. 0-based number index: "0" -> 0
 */
export function resolveCorrectOptionIndex(
  correctRaw: string | number | undefined | null,
  options: string[]
): number | null {
  if (correctRaw === undefined || correctRaw === null) return null;
  const rawStr = String(correctRaw).trim();
  if (!rawStr) return null;

  const normalizedOpts = options.map((opt) => String(opt ?? '').trim().toLowerCase());

  // 1. Direct text/value match with one of the options (case-insensitive)
  // Handles numeric options like "2", "3", "44", "200" or text options like "HyperText Markup Language"
  const textMatchIdx = normalizedOpts.findIndex((opt) => opt === rawStr.toLowerCase());
  if (textMatchIdx !== -1) {
    return textMatchIdx;
  }

  // 2. Letter match: A, B, C, D (handles "A", "b", "Option A", "Opt B", "(c)", "D.")
  const cleanLetter = rawStr
    .toUpperCase()
    .replace(/^(OPTION|OPT)\s*/i, '')
    .replace(/[\.\(\)\:\s]/g, '')
    .trim();

  const letterMap: Record<string, number> = { A: 0, B: 1, C: 2, D: 3 };
  if (cleanLetter in letterMap) {
    return letterMap[cleanLetter];
  }

  // 3. 1-based index (1..4) or 0-based index (0..3)
  const num = parseInt(cleanLetter, 10);
  if (!isNaN(num)) {
    if (num >= 1 && num <= 4) {
      return num - 1;
    }
    if (num === 0) {
      return 0;
    }
  }

  return null;
}

/**
 * Parses a single CSV line respecting quotes, escaped quotes (""), and commas.
 */
export function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let inQuotes = false;
  let current = '';

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim().replace(/^"|"$/g, ''));
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim().replace(/^"|"$/g, ''));
  return result;
}

/**
 * Parses full CSV text into validated exam question rows.
 */
export function parseQuestionsCSV(text: string): ParsedQuestionRow[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length <= 1) {
    return [];
  }

  // Detect header indices if header row is present
  const headerCols = parseCSVLine(lines[0]).map((h) =>
    h.toLowerCase().replace(/[\s_-]+/g, '')
  );

  let qCol = headerCols.findIndex((h) => h.includes('question') || h.includes('prompt') || h.includes('title'));
  let aCol = headerCols.findIndex((h) => h.includes('optiona') || h.includes('opta') || h === 'a' || h === 'option1');
  let bCol = headerCols.findIndex((h) => h.includes('optionb') || h.includes('optb') || h === 'b' || h === 'option2');
  let cCol = headerCols.findIndex((h) => h.includes('optionc') || h.includes('optc') || h === 'c' || h === 'option3');
  let dCol = headerCols.findIndex((h) => h.includes('optiond') || h.includes('optd') || h === 'd' || h === 'option4');
  let correctCol = headerCols.findIndex(
    (h) => h.includes('correct') || h.includes('answer') || h === 'ans' || h === 'key'
  );
  let marksCol = headerCols.findIndex(
    (h) => h.includes('mark') || h.includes('point') || h.includes('score')
  );

  // Fallback to standard positional indices 0..6 if headers not found
  if (qCol === -1) qCol = 0;
  if (aCol === -1) aCol = 1;
  if (bCol === -1) bCol = 2;
  if (cCol === -1) cCol = 3;
  if (dCol === -1) dCol = 4;
  if (correctCol === -1) correctCol = 5;
  if (marksCol === -1) marksCol = 6;

  const rows: ParsedQuestionRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i]);
    if (cols.length === 0 || cols.every((c) => c === '')) continue;

    const question = String(cols[qCol] ?? '').trim();
    const optA = String(cols[aCol] ?? '').trim();
    const optB = String(cols[bCol] ?? '').trim();
    const optC = String(cols[cCol] ?? '').trim();
    const optD = String(cols[dCol] ?? '').trim();
    const correctRaw = String(cols[correctCol] ?? '').trim();
    const marksParsed = cols[marksCol] ? parseInt(cols[marksCol], 10) : 2;
    const marks = isNaN(marksParsed) || marksParsed <= 0 ? 2 : marksParsed;

    let errorMsg: string | undefined = undefined;
    let isValid = true;
    let resolvedIndex = 0;

    if (!question || !optA || !optB || !optC || !optD) {
      errorMsg = 'Missing question prompt or one of the 4 required options (A, B, C, D).';
      isValid = false;
    } else {
      const opts = [optA, optB, optC, optD];
      const setOfOpts = new Set(opts.map((o) => o.toLowerCase()));
      if (setOfOpts.size !== 4) {
        errorMsg = 'Option values must be distinct (each of the 4 options must be unique).';
        isValid = false;
      } else {
        const foundIdx = resolveCorrectOptionIndex(correctRaw, opts);
        if (foundIdx === null) {
          errorMsg = `Could not determine correct option from '${correctRaw}'. Must match one of the options (e.g. 2, 3, 44) or option letter (A, B, C, D).`;
          isValid = false;
        } else {
          resolvedIndex = foundIdx;
        }
      }
    }

    rows.push({
      rowNum: i + 1,
      question,
      option_a: optA,
      option_b: optB,
      option_c: optC,
      option_d: optD,
      correct_raw: correctRaw,
      correct_option_index: resolvedIndex,
      marks,
      error: errorMsg,
      isValid,
    });
  }

  return rows;
}

/**
 * Returns a template CSV containing sample multiple-choice questions with text,
 * numbers (e.g. 2, 3, 44), and status code options.
 */
export function generateQuestionCSVTemplate(): string {
  return (
    'question,option_a,option_b,option_c,option_d,correct,marks\n' +
    '"What is 22 multiplied by 2?",2,3,44,88,44,2\n' +
    '"Which HTTP status code signifies Not Found?",200,301,404,500,404,2\n' +
    '"What does HTML stand for?","HyperText Markup Language","High Tech Modern Language","Hyperlink Text Mode Linux","Home Tool Markup Language","A",2\n' +
    '"What is the default port for HTTPS?",80,443,22,8080,443,2\n' +
    '"Which data structure follows First-In-First-Out (FIFO)?","Stack","Queue","Tree","Graph","B",2\n'
  );
}

/**
 * Triggers a browser download of the sample questions CSV template.
 */
export function downloadQuestionCSVTemplate(filename = 'TNV_Exam_Questions_Template.csv'): void {
  const content = generateQuestionCSVTemplate();
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
