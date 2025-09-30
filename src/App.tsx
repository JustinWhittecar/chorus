import { useState, useEffect } from 'react';
import { Sparkles, Download, Copy, Check, Loader2, Quote } from 'lucide-react';
import { analyzeFeedback, toMarkdown, downloadFile, sampleData, guessImpactEffort } from './utils/feedback';

interface Theme {
  title: string;
  summary: string;
  quotes: string[];
  impact?: 'Low' | 'Med' | 'High';
  effort?: 'Low' | 'Med' | 'High';
}

const STORAGE_KEY = 'chorus-feedback-input';

function App() {
  const [input, setInput] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) || '';
    } catch {
      return '';
    }
  });
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

    const lines = input.split('\n').filter(line => line.trim().length > 0);
    if (lines.length < 3) {
      setError('Please provide at least 3 lines of feedback to analyze.');
      return;
    }

    setIsAnalyzing(true);
    try {
      const result = await analyzeFeedback(input);
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
    setInput(sampleData);
    setThemes([]);
    setError('');
  };

  const handleCopyTheme = async (theme: Theme, index: number) => {
    const text = `${theme.title}\n\n${theme.summary}\n\nQuotes:\n${theme.quotes.map(q => `• "${q}"`).join('\n')}`;
    await navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleExportMarkdown = () => {
    const markdown = toMarkdown(themes);
    downloadFile('chorus-themes.md', markdown);
  };

  const handleCopyAll = async () => {
    const markdown = toMarkdown(themes);
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
                  <div className="flex gap-2">
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
                      Export
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
                      <span>Easy export to Markdown format</span>
                    </li>
                  </ul>
                </div>
              ) : (
                <div className="space-y-4">
                  {themes.map((theme, index) => (
                    <div key={index} className="bg-white border border-slate-200 rounded-lg p-6">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="text-base font-semibold text-slate-900 mb-2">{theme.title}</h3>
                          <div className="flex gap-2">
                            {theme.impact && (
                              <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-50 text-blue-700 rounded">
                                Impact: {theme.impact}
                              </span>
                            )}
                            {theme.effort && (
                              <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-slate-50 text-slate-700 rounded">
                                Effort: {theme.effort}
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => handleCopyTheme(theme, index)}
                          className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors flex-shrink-0"
                          title="Copy theme"
                        >
                          {copiedIndex === index ? (
                            <Check className="w-4 h-4 text-green-600" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                      <p className="text-sm text-slate-600 mb-4">{theme.summary}</p>
                      <div className="border border-slate-200 rounded-lg p-4 space-y-3 bg-slate-50">
                        {theme.quotes.map((quote, qIndex) => (
                          <div key={qIndex} className="flex gap-3">
                            <Quote className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-slate-700 italic">{quote}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-white border-t border-slate-200 px-6 py-4 mt-8">
        <div className="max-w-7xl mx-auto text-center text-sm text-slate-600">
          <p>Chorus turns noisy feedback into clear themes. MIT License.</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
