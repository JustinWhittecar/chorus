import { useState, useRef, useEffect } from 'react';
import { Copy, Check, Quote, CreditCard as Edit2 } from 'lucide-react';

interface Theme {
  title: string;
  customTitle?: string;
  summary: string;
  quotes: string[];
  impact?: 'Low' | 'Med' | 'High';
  effort?: 'Low' | 'Med' | 'High';
}

interface ThemeCardProps {
  theme: Theme;
  index: number;
  isCopied: boolean;
  onCopy: () => void;
  onRename: (newTitle: string) => void;
}

export function getEffectiveTitle(theme: Theme): string {
  return theme.customTitle?.trim() || theme.title;
}

export function ThemeCard({ theme, index, isCopied, onCopy, onRename }: ThemeCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);

  const effectiveTitle = getEffectiveTitle(theme);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const startEditing = () => {
    setEditValue(effectiveTitle);
    setError('');
    setIsEditing(true);
  };

  const validateTitle = (value: string): string | null => {
    const trimmed = value.trim();

    if (trimmed.length < 2) {
      return 'Title must be at least 2 characters';
    }

    if (trimmed.length > 48) {
      return 'Title must be 48 characters or less';
    }

    if (/^[^\w\s]+$/.test(trimmed)) {
      return 'Title cannot contain only punctuation';
    }

    return null;
  };

  const saveEdit = () => {
    const validationError = validateTitle(editValue);

    if (validationError) {
      setError(validationError);
      return;
    }

    const trimmed = editValue.trim();
    if (trimmed !== effectiveTitle) {
      onRename(trimmed);
    }

    setIsEditing(false);
    setError('');
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setError('');
    setEditValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveEdit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelEdit();
    }
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      startEditing();
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-6">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0 mr-2">
          {isEditing ? (
            <div>
              <input
                ref={inputRef}
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={saveEdit}
                className="w-full text-base font-semibold text-slate-900 px-2 py-1 border-2 border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Edit theme title"
              />
              {error && (
                <p className="text-xs text-red-600 mt-1">{error}</p>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 group">
              <h3
                ref={titleRef}
                tabIndex={0}
                onKeyDown={handleTitleKeyDown}
                className="text-base font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-1 -mx-1"
              >
                {effectiveTitle}
              </h3>
              <button
                onClick={startEditing}
                className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-all flex-shrink-0"
                title="Rename theme"
                aria-label="Rename theme title"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
          <div className="flex gap-2 mt-2">
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
          onClick={onCopy}
          className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors flex-shrink-0"
          title="Copy theme"
        >
          {isCopied ? (
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
  );
}
