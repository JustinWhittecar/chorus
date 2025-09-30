import { useState, useEffect, useRef } from 'react';
import { X, Loader2, Check, ExternalLink, Settings } from 'lucide-react';
import {
  FeedbackPayload,
  saveFeedback,
  generateFeedbackBody,
  generateFeedbackTitle,
  generateMailtoURL,
  toIssueURL,
  getGitHubIssuesUrl,
  setGitHubIssuesUrl,
  APP_VERSION
} from '../utils/feedback-collection';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  prefilledIntent?: string;
  prefilledRating?: number;
  contextData?: {
    textLineCount: number;
    csvRowCount: number;
    uniqueUsedCount: number;
    themeCount: number;
    themeTitles: string[];
  };
}

export function FeedbackModal({ isOpen, onClose, prefilledIntent, prefilledRating, contextData }: FeedbackModalProps) {
  const [step, setStep] = useState<'form' | 'submitted'>('form');
  const [intent, setIntent] = useState(prefilledIntent || 'Analyze feedback');
  const [message, setMessage] = useState('');
  const [rating, setRating] = useState<number | null>(prefilledRating ?? null);
  const [email, setEmail] = useState('');
  const [includeContext, setIncludeContext] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [payload, setPayload] = useState<FeedbackPayload | null>(null);
  const [showContext, setShowContext] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [githubUrl, setGithubUrl] = useState(getGitHubIssuesUrl());
  const [urlError, setUrlError] = useState('');

  const modalRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const firstFocusableRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) {
      setStep('form');
      setIntent(prefilledIntent || 'Analyze feedback');
      setRating(prefilledRating ?? null);
      setMessage('');
      setEmail('');
      setIncludeContext(true);
      setError('');
      setPayload(null);
      setShowContext(false);
      setCopied(false);
      setShowSettings(false);
      setGithubUrl(getGitHubIssuesUrl());
      setUrlError('');

      setTimeout(() => {
        if (prefilledRating !== undefined) {
          textareaRef.current?.focus();
        }
      }, 100);
    }
  }, [isOpen, prefilledIntent, prefilledRating]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }

      if (e.key === 'Tab') {
        const focusableElements = modalRef.current?.querySelectorAll(
          'button:not(:disabled), input:not(:disabled), textarea:not(:disabled), select:not(:disabled), [tabindex]:not([tabindex="-1"])'
        );
        if (!focusableElements || focusableElements.length === 0) return;

        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmed = message.trim();
    const nonSpaceChars = trimmed.replace(/\s/g, '').length;

    if (nonSpaceChars < 10) {
      setError('Please provide at least 10 characters of feedback');
      return;
    }

    setIsSaving(true);

    const newPayload: FeedbackPayload = {
      timestampISO: new Date().toISOString(),
      intent,
      message: trimmed,
      rating,
      email: email.trim(),
      appVersion: APP_VERSION,
      pageUrl: window.location.href,
      userAgent: navigator.userAgent,
      includeContext,
      context: includeContext && contextData ? contextData : undefined
    };

    saveFeedback(newPayload);
    setPayload(newPayload);

    setTimeout(() => {
      setIsSaving(false);
      setStep('submitted');
    }, 500);
  };

  const handleCopy = async () => {
    if (!payload) return;

    const body = generateFeedbackBody(payload);
    await navigator.clipboard.writeText(body);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenGitHub = () => {
    if (!payload) return;

    const title = generateFeedbackTitle(payload);
    const body = generateFeedbackBody(payload);
    const url = toIssueURL(githubUrl, title, body);
    window.open(url, '_blank');
  };

  const handleOpenEmail = () => {
    if (!payload) return;

    const url = generateMailtoURL(payload);
    window.location.href = url;
  };

  const handleSaveGitHubUrl = () => {
    const trimmed = githubUrl.trim();

    if (!trimmed.startsWith('https://github.com/')) {
      setUrlError('URL must start with https://github.com/');
      return;
    }

    setGitHubIssuesUrl(trimmed);
    setUrlError('');
    setShowSettings(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div
        ref={modalRef}
        className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="feedback-modal-title"
      >
        {step === 'form' ? (
          <form onSubmit={handleSubmit}>
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h2 id="feedback-modal-title" className="text-lg font-semibold text-slate-900">
                Share Feedback
              </h2>
              <button
                ref={firstFocusableRef}
                type="button"
                onClick={onClose}
                className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors"
                aria-label="Close feedback modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 py-4 space-y-4">
              <div>
                <label htmlFor="intent" className="block text-sm font-medium text-slate-700 mb-1">
                  What were you trying to do?
                </label>
                <select
                  id="intent"
                  value={intent}
                  onChange={(e) => setIntent(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option>Analyze feedback</option>
                  <option>Upload CSV</option>
                  <option>Export results</option>
                  <option>Rename themes</option>
                  <option>Something else</option>
                </select>
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-slate-700 mb-1">
                  Your feedback <span className="text-red-600">*</span>
                </label>
                <textarea
                  ref={textareaRef}
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  required
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="Tell us what you think..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Rating (optional)
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <label key={value} className="flex-1">
                      <input
                        type="radio"
                        name="rating"
                        value={value}
                        checked={rating === value}
                        onChange={() => setRating(value)}
                        className="sr-only"
                      />
                      <div
                        className={`px-3 py-2 text-sm font-medium text-center rounded-lg border cursor-pointer transition-colors ${
                          rating === value
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        {value}
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
                  Email (optional)
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="your@email.com"
                />
              </div>

              <div>
                <label className="flex items-start gap-2 text-sm text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeContext}
                    onChange={(e) => setIncludeContext(e.target.checked)}
                    className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                  />
                  <span>Include anonymized context (counts, theme titles, browser info)</span>
                </label>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
                  {error}
                </div>
              )}
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex gap-3 justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-slate-700 border border-slate-300 rounded-lg hover:bg-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save & Continue'
                )}
              </button>
            </div>
          </form>
        ) : (
          <div>
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h2 id="feedback-modal-title" className="text-lg font-semibold text-slate-900">
                Thanks!
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors"
                aria-label="Close feedback modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 py-4 space-y-4">
              <p className="text-sm text-slate-700">
                Your feedback was saved locally. Choose how to send it:
              </p>

              <div className="space-y-2">
                <button
                  onClick={handleCopy}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-green-600" />
                      Copied!
                    </>
                  ) : (
                    'Copy to Clipboard'
                  )}
                </button>

                <div className="relative">
                  <button
                    onClick={handleOpenGitHub}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Open GitHub Issue
                  </button>
                  <button
                    onClick={() => setShowSettings(!showSettings)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-200 rounded transition-colors"
                    title="Configure GitHub repository"
                    aria-label="Configure GitHub repository URL"
                  >
                    <Settings className="w-3.5 h-3.5" />
                  </button>
                </div>

                {showSettings && (
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-2">
                    <label htmlFor="github-url" className="block text-xs font-medium text-slate-700">
                      GitHub Issues URL
                    </label>
                    <input
                      type="text"
                      id="github-url"
                      value={githubUrl}
                      onChange={(e) => setGithubUrl(e.target.value)}
                      className="w-full px-2 py-1 text-xs border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="https://github.com/username/repo/issues/new"
                    />
                    {urlError && (
                      <p className="text-xs text-red-600">{urlError}</p>
                    )}
                    <div className="flex gap-2">
                      <button
                        onClick={handleSaveGitHubUrl}
                        className="flex-1 px-3 py-1 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setShowSettings(false)}
                        className="flex-1 px-3 py-1 text-xs font-medium text-slate-700 border border-slate-300 rounded hover:bg-white transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                <button
                  onClick={handleOpenEmail}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Email via your client
                </button>
              </div>

              {payload && payload.context && (
                <div>
                  <button
                    onClick={() => setShowContext(!showContext)}
                    className="text-xs text-blue-600 hover:text-blue-700 underline"
                  >
                    {showContext ? 'Hide' : 'View'} captured context
                  </button>

                  {showContext && (
                    <pre className="mt-2 p-3 bg-slate-50 border border-slate-200 rounded text-xs overflow-x-auto">
                      {JSON.stringify(payload.context, null, 2)}
                    </pre>
                  )}
                </div>
              )}
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-slate-700 border border-slate-300 rounded-lg hover:bg-white transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
