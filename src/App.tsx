import { useState, useEffect } from 'react';
import { Sparkles, Download, Copy, Check, Loader2, FileDown, RotateCcw } from 'lucide-react';
import { analyzeFeedback, toMarkdown, downloadFile, sampleData, guessImpactEffort } from './utils/feedback';
import { CSVUpload } from './components/CSVUpload';
import { ThemeCard, getEffectiveTitle } from './components/ThemeCard';
import { mergeInputs, createLabeledCSV, downloadCSV, sampleCSV } from './utils/csv';

interface Theme {
  title: string;
  customTitle?: string;
  summary: string;
  quotes: string[];
  impact?: 'Low' | 'Med' | 'High';
  effort?: 'Low' | 'Med' | 'High';
}

const STORAGE_KEY = 'chorus-feedback-input';

function App() {
  const [inputMode, setInputMode] = useState<'text' | 'csv'>('text');
  const [input, setInput] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) || '';
    } catch {
      return '';
    }
  });
  const [csvLines, setCsvLines] = useState<string[]>([]);
  const [mergedLines, setMergedLines] = useState<string[]>([]);
  const [themes, setThemes] = useState<Theme[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copyAllSuccess, setCopyAllSuccess] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, input);
    } catch {
      // ignore
    }
  }, [input]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        handleAnalyze();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [input]);

  const handleAnalyze = async () => {
    setError('');

    const textLines = input.split('\n').filter(line => line.trim().length > 0);
    const { merged, stats } = mergeInputs(textLines, csvLines);

    if (merged.length < 3) {
      setError('Please provide at least 3 lines of feedback to analyze.');
      return;
    }

    setMergedLines(merged);

    setIsAnalyzing(true);
    try {
      const combinedText = merged.join('\n');
      const result = await analyzeFeedback(combinedText);
      const themesWithTags = result.map(theme => ({
        ...theme,
        ...guessImpactEffort(theme)
      }));
      setThemes(themesWithTags);
    } catch (err) {
      setError('Failed to analyze feedback. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleUseSample = () => {
    if (inputMode === 'text') {
      setInput(sampleData);
    } else {
      const blob = new Blob([sampleCSV], { type: 'text/csv' });
      const file = new File([blob], 'sample.csv', { type: 'text/csv' });
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      const fileInput = document.querySelector<HTMLInputElement>('#csv-upload');
      if (fileInput) {
        fileInput.files = dataTransfer.files;
        fileInput.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }
    setThemes([]);
    setError('');
  };

  const handleCsvDataExtracted = (lines: string[]) => {
    setCsvLines(lines);
  };

  const handleExportLabeledCSV = () => {
    const themesWithEffectiveTitles = themes.map(theme => ({
      ...theme,
      title: getEffectiveTitle(theme)
    }));
    const csvContent = createLabeledCSV(mergedLines, themesWithEffectiveTitles);
    const today = new Date().toISOString().split('T')[0];
    downloadCSV(`chorus_labeled_${today}.csv`, csvContent);
  };

  const getInputStats = () => {
    const textLines = input.split('\n').filter(line => line.trim().length > 0);
    const { stats } = mergeInputs(textLines, csvLines);
    return stats;
  };

  const stats = getInputStats();

  const handleCopyTheme = async (theme: Theme, index: number) => {
    const effectiveTitle = getEffectiveTitle(theme);
    const text = `${effectiveTitle}\n\n${theme.summary}\n\nQuotes:\n${theme.quotes.map(q => `• "${q}"`).join('\n')}`;
    await navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleRenameTheme = (index: number, newTitle: string) => {
    setThemes(prev => prev.map((theme, i) =>
      i === index ? { ...theme, customTitle: newTitle } : theme
    ));
  };

  const handleResetTitles = () => {
    setThemes(prev => prev.map(theme => ({ ...theme, customTitle: undefined })));
  };

  const handleExportMarkdown = () => {
    const themesWithEffectiveTitles = themes.map(theme => ({
      ...theme,
      title: getEffectiveTitle(theme)
    }));
    const markdown = toMarkdown(themesWithEffectiveTitles);
    downloadFile('chorus-themes.md', markdown);
  };

  const handleCopyAll = async () => {
    const themesWithEffectiveTitles = themes.map(theme => ({
      ...theme,
      title: getEffectiveTitle(theme)
    }));
    const markdown = toMarkdown(themesWithEffectiveTitles);
    await navigator.clipboard.writeText(markdown);
    setCopyAllSuccess(true);
    setTimeout(() => setCopyAllSuccess(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <Sparkles className="w-7 h-7 text-blue-600" />
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">Chorus</h1>
              <p className="text-sm text-slate-600">Turn noisy feedback into clear themes</p>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <button
                  onClick={() => setInputMode('text')}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    inputMode === 'text'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  Text
                </button>
                <button
                  onClick={() => setInputMode('csv')}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    inputMode === 'csv'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  CSV
                </button>
              </div>

              {inputMode === 'text' ? (
                <div>
                  <label htmlFor="feedback" className="block text-sm font-medium text-slate-700 mb-2">
                    Your Feedback
                  </label>
                  <textarea
                    id="feedback"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Paste your feedback here, one comment per line...&#10;&#10;Example:&#10;The interface is confusing&#10;I love the dark mode feature&#10;Loading times are too slow&#10;&#10;Tip: Press Cmd/Ctrl+Enter to analyze"
                    className="w-full h-96 px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-slate-900 placeholder-slate-400"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Upload CSV
                  </label>
                  <CSVUpload onDataExtracted={handleCsvDataExtracted} isAnalyzing={isAnalyzing} />
                </div>
              )}

              {(stats.textCount > 0 || stats.csvCount > 0) && (
                <div className="flex items-center gap-2 flex-wrap text-xs">
                  {stats.textCount > 0 && (
                    <span className="inline-flex items-center px-2 py-1 bg-slate-100 text-slate-700 rounded">
                      Text lines: {stats.textCount}
                    </span>
                  )}
                  {stats.csvCount > 0 && (
                    <span className="inline-flex items-center px-2 py-1 bg-slate-100 text-slate-700 rounded">
                      CSV rows: {stats.csvCount}
                    </span>
                  )}
                  <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-700 rounded font-medium">
                    Unique used: {stats.uniqueCount}
                  </span>
                  {stats.capped && (
                    <span className="inline-flex items-center px-2 py-1 bg-amber-100 text-amber-700 rounded">
                      Showing first 500 of {stats.totalBeforeCap} rows
                    </span>
                  )}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                  className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Analyze
                    </>
                  )}
                </button>
                <button
                  onClick={handleUseSample}
                  className="px-6 py-3 border border-slate-300 rounded-lg font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Use Sample
                </button>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-900">Themes</h2>
                {themes.length > 0 && (
                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={handleResetTitles}
                      className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                      title="Reset all theme titles to AI-generated versions"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Reset Titles
                    </button>
                    <button
                      onClick={handleCopyAll}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      {copyAllSuccess ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                      Copy All
                    </button>
                    <button
                      onClick={handleExportMarkdown}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      Export MD
                    </button>
                    <button
                      onClick={handleExportLabeledCSV}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      <FileDown className="w-4 h-4" />
                      Export CSV
                    </button>
                  </div>
                )}
              </div>

              {themes.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-lg p-8 text-center">
                  <Sparkles className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-900 mb-2">What you'll get</h3>
                  <ul className="text-sm text-slate-600 space-y-2 text-left max-w-xs mx-auto">
                    <li className="flex gap-2">
                      <span className="text-blue-600 font-bold">•</span>
                      <span>3–5 distinct themes extracted from your feedback</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-blue-600 font-bold">•</span>
                      <span>Clear titles and summaries for each theme</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-blue-600 font-bold">•</span>
                      <span>Supporting quotes pulled directly from input</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-blue-600 font-bold">•</span>
                      <span>Easy export to Markdown or labeled CSV</span>
                    </li>
                  </ul>
                </div>
              ) : (
                <div className="space-y-4">
                  {themes.map((theme, index) => (
                    <ThemeCard
                      key={index}
                      theme={theme}
                      index={index}
                      isCopied={copiedIndex === index}
                      onCopy={() => handleCopyTheme(theme, index)}
                      onRename={(newTitle) => handleRenameTheme(index, newTitle)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-white border-t border-slate-200 px-6 py-4 mt-8">
        <div className="max-w-7xl mx-auto text-center text-sm text-slate-600">
          <p>Chorus turns noisy feedback into clear themes. Now supports CSV uploads, labeled exports, and inline theme renaming with remembered CSV column mapping. MIT License.</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
