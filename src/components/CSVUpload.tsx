import { useState, useRef, useCallback } from 'react';
import { Upload, FileText, Loader2, X } from 'lucide-react';
import { parseCSV, chooseTextColumn, extractTextFromCSV, ParsedCSV, ParseResult } from '../utils/csv';
import { getSavedColumnForHeaders, saveColumnPref, setLastSelectedColumnName, headerSetHash } from '../utils/storage';

interface CSVUploadProps {
  onDataExtracted: (lines: string[]) => void;
  isAnalyzing: boolean;
}

export function CSVUpload({ onDataExtracted, isAnalyzing }: CSVUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [parsed, setParsed] = useState<ParsedCSV | null>(null);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [selectedColumn, setSelectedColumn] = useState(0);
  const [autoSelectedColumn, setAutoSelectedColumn] = useState<string | null>(null);
  const [rememberChoice, setRememberChoice] = useState(true);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const columnSelectRef = useRef<HTMLSelectElement>(null);

  const handleFile = useCallback(async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      setError('File size exceeds 5MB limit');
      return;
    }

    if (!file.name.endsWith('.csv')) {
      setError('Please upload a .csv file');
      return;
    }

    setError('');
    setIsProcessing(true);
    setUploadedFile(file);

    try {
      const parsedData = await parseCSV(file);
      setParsed(parsedData);

      let columnToSelect = 0;
      let autoSelected: string | null = null;

      if (parsedData.headers && parsedData.headers.length > 0) {
        const savedColumn = getSavedColumnForHeaders(parsedData.headers);

        if (savedColumn) {
          const savedIndex = parsedData.headers.indexOf(savedColumn);
          if (savedIndex !== -1) {
            columnToSelect = savedIndex;
            autoSelected = savedColumn;
          }
        } else {
          columnToSelect = chooseTextColumn(parsedData.headers, parsedData.rows);
        }
      } else {
        columnToSelect = chooseTextColumn(parsedData.headers, parsedData.rows);
      }

      setSelectedColumn(columnToSelect);
      setAutoSelectedColumn(autoSelected);

      const result = extractTextFromCSV(parsedData, columnToSelect);
      setParseResult(result);
      onDataExtracted(result.textLines);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse CSV');
      setParsed(null);
      setParseResult(null);
      setAutoSelectedColumn(null);
    } finally {
      setIsProcessing(false);
    }
  }, [onDataExtracted]);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleColumnChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newColumn = parseInt(e.target.value, 10);
    setSelectedColumn(newColumn);
    setAutoSelectedColumn(null);

    if (parsed) {
      const result = extractTextFromCSV(parsed, newColumn);
      setParseResult(result);
      onDataExtracted(result.textLines);

      if (rememberChoice && parsed.headers && parsed.headers[newColumn]) {
        const columnName = parsed.headers[newColumn];
        const hash = headerSetHash(parsed.headers);
        saveColumnPref(hash, columnName);
        setLastSelectedColumnName(columnName);
      }
    }
  };

  const focusColumnSelect = () => {
    columnSelectRef.current?.focus();
  };

  const handleClear = () => {
    setUploadedFile(null);
    setParsed(null);
    setParseResult(null);
    setSelectedColumn(0);
    setAutoSelectedColumn(null);
    setError('');
    onDataExtracted([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-4">
      {!uploadedFile ? (
        <div
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragging
              ? 'border-blue-500 bg-blue-50'
              : 'border-slate-300 bg-white hover:border-slate-400'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileInput}
            className="hidden"
            id="csv-upload"
            disabled={isProcessing || isAnalyzing}
          />

          <Upload className={`w-12 h-12 mx-auto mb-4 ${isDragging ? 'text-blue-600' : 'text-slate-400'}`} />

          <p className="text-sm font-medium text-slate-900 mb-2">
            {isDragging ? 'Drop your CSV file here' : 'Drag & drop your CSV file here'}
          </p>

          <p className="text-xs text-slate-600 mb-4">
            or
          </p>

          <label
            htmlFor="csv-upload"
            className="inline-flex items-center px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer transition-colors"
          >
            Choose File
          </label>

          <p className="text-xs text-slate-500 mt-4">
            CSV files up to 5MB. Accepts comma or semicolon delimiters.
          </p>

          <p className="text-xs text-slate-500 mt-2">
            Tip: Chorus remembers your column choice for this header set on this browser.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <FileText className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">
                  {uploadedFile.name}
                </p>
                <p className="text-xs text-slate-600">
                  {formatFileSize(uploadedFile.size)}
                </p>
              </div>
            </div>
            <button
              onClick={handleClear}
              disabled={isAnalyzing}
              className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors flex-shrink-0"
              title="Remove file"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {isProcessing && (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Parsing CSV...</span>
            </div>
          )}

          {parsed && parsed.headers && (
            <div className="space-y-2">
              <label htmlFor="column-select" className="block text-xs font-medium text-slate-700">
                Feedback Column
              </label>
              <select
                ref={columnSelectRef}
                id="column-select"
                value={selectedColumn}
                onChange={handleColumnChange}
                disabled={isAnalyzing}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {parsed.headers.map((header, index) => (
                  <option key={index} value={index}>
                    {header || `Column ${index + 1}`}
                  </option>
                ))}
              </select>

              {autoSelectedColumn && (
                <div className="text-xs text-blue-700 bg-blue-50 px-3 py-2 rounded border border-blue-100">
                  Auto-selected column '{autoSelectedColumn}' from previous choice.{' '}
                  <button
                    onClick={focusColumnSelect}
                    className="underline hover:text-blue-900 font-medium"
                  >
                    Change
                  </button>
                </div>
              )}

              <label className="flex items-center gap-2 text-xs text-slate-600">
                <input
                  type="checkbox"
                  checked={rememberChoice}
                  onChange={(e) => setRememberChoice(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                />
                <span>Remember my choice</span>
              </label>
            </div>
          )}

          {parseResult && (
            <div className="text-xs text-slate-600 space-y-1">
              <p>
                <span className="font-medium">{parseResult.totalRows}</span> rows detected;{' '}
                <span className="font-medium">{parseResult.nonEmptyRows}</span> non-empty
              </p>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}
    </div>
  );
}
