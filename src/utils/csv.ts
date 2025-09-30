export interface ParsedCSV {
  rows: string[][];
  headers?: string[];
  detectedDelimiter: ',' | ';';
}

export interface ParseResult {
  textLines: string[];
  columnIndex: number;
  totalRows: number;
  nonEmptyRows: number;
}

export function detectDelimiter(sample: string): ',' | ';' {
  const firstLines = sample.split('\n').slice(0, 5).join('\n');
  const commaCount = (firstLines.match(/,/g) || []).length;
  const semicolonCount = (firstLines.match(/;/g) || []).length;

  return semicolonCount > commaCount ? ';' : ',';
}

export function parseCSVLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

export async function parseCSV(file: File): Promise<ParsedCSV> {
  const text = await file.text();
  const delimiter = detectDelimiter(text);
  const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);

  if (lines.length === 0) {
    throw new Error('CSV file is empty');
  }

  const parsedLines = lines.map(line => parseCSVLine(line, delimiter));

  const firstRow = parsedLines[0];
  const hasHeaders = firstRow.every(cell => {
    const trimmed = cell.trim();
    return trimmed.length > 0 && trimmed.length < 50 && !/^\d+$/.test(trimmed);
  });

  if (hasHeaders && parsedLines.length > 1) {
    return {
      rows: parsedLines.slice(1),
      headers: firstRow,
      detectedDelimiter: delimiter
    };
  }

  return {
    rows: parsedLines,
    headers: undefined,
    detectedDelimiter: delimiter
  };
}

export function chooseTextColumn(headers: string[] | undefined, sampleRows: string[][]): number {
  if (!headers || headers.length === 0) {
    return 0;
  }

  const scores = headers.map((_, colIndex) => {
    const samples = sampleRows.slice(0, Math.min(10, sampleRows.length));
    let totalLength = 0;
    let alphaCount = 0;
    let validCount = 0;

    samples.forEach(row => {
      if (row[colIndex]) {
        const cell = row[colIndex];
        totalLength += cell.length;
        alphaCount += (cell.match(/[a-zA-Z]/g) || []).length;
        validCount++;
      }
    });

    if (validCount === 0) return 0;

    const avgLength = totalLength / validCount;
    const avgAlpha = alphaCount / validCount;

    return avgLength * 0.7 + avgAlpha * 0.3;
  });

  const maxScore = Math.max(...scores);
  return scores.indexOf(maxScore);
}

export function extractTextFromCSV(
  parsed: ParsedCSV,
  columnIndex: number
): ParseResult {
  const textLines: string[] = [];

  parsed.rows.forEach(row => {
    if (row[columnIndex]) {
      const text = row[columnIndex].trim();
      if (text.length > 0) {
        textLines.push(text);
      }
    }
  });

  return {
    textLines,
    columnIndex,
    totalRows: parsed.rows.length,
    nonEmptyRows: textLines.length
  };
}

export function mergeInputs(textLines: string[], csvLines: string[]): {
  merged: string[];
  stats: {
    textCount: number;
    csvCount: number;
    uniqueCount: number;
    capped: boolean;
    totalBeforeCap: number;
  };
} {
  const MAX_LINES = 500;
  const combined = [...textLines, ...csvLines];

  const uniqueMap = new Map<string, string>();
  combined.forEach(line => {
    const key = line.toLowerCase().trim();
    if (key.length > 0 && !uniqueMap.has(key)) {
      uniqueMap.set(key, line);
    }
  });

  const unique = Array.from(uniqueMap.values());
  const totalBeforeCap = unique.length;
  const capped = unique.length > MAX_LINES;
  const merged = unique.slice(0, MAX_LINES);

  return {
    merged,
    stats: {
      textCount: textLines.length,
      csvCount: csvLines.length,
      uniqueCount: merged.length,
      capped,
      totalBeforeCap
    }
  };
}

interface Theme {
  title: string;
  summary: string;
  quotes: string[];
}

export function createLabeledCSV(
  feedbackLines: string[],
  themes: Theme[]
): string {
  const lines: string[] = ['original_text,theme_title'];

  const themeMap = new Map<string, string>();

  themes.forEach(theme => {
    theme.quotes.forEach(quote => {
      const key = quote.toLowerCase().trim();
      if (!themeMap.has(key)) {
        themeMap.set(key, theme.title);
      }
    });
  });

  feedbackLines.forEach(line => {
    const key = line.toLowerCase().trim();
    const theme = themeMap.get(key);

    if (theme) {
      const escapedText = `"${line.replace(/"/g, '""')}"`;
      const escapedTheme = `"${theme.replace(/"/g, '""')}"`;
      lines.push(`${escapedText},${escapedTheme}`);
    }
  });

  return lines.join('\n');
}

export function downloadCSV(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export const sampleCSV = `feedback
"Signup asks for credit card before I can try anything."
"I couldn't find pricing—had to click three pages deep."
"The dashboard loads slowly on mobile."
"Confusing error when I upload a CSV; doesn't say what's wrong."
"Search results feel irrelevant; I typed 'invoices' and got 'reports'."
"Two-factor setup is hidden; security page should recommend it."
"Trial length feels short for evaluation."
"Customer support replied fast on chat, thanks!"`;
