export const APP_VERSION = 'v0.1.0';

export interface FeedbackPayload {
  timestampISO: string;
  intent: string;
  message: string;
  rating: number | null;
  email: string;
  appVersion: string;
  pageUrl: string;
  userAgent: string;
  includeContext: boolean;
  context?: {
    textLineCount: number;
    csvRowCount: number;
    uniqueUsedCount: number;
    themeCount: number;
    themeTitles: string[];
  };
}

export function encodeURIComponentSafe(str: string): string {
  return encodeURIComponent(str);
}

export function toIssueURL(baseUrl: string, title: string, body: string): string {
  const enc = encodeURIComponentSafe;
  return `${baseUrl}?title=${enc(title)}&body=${enc(body)}`;
}

export function fencedJSON(obj: unknown): string {
  return '```json\n' + JSON.stringify(obj, null, 2) + '\n```';
}

export function plainText(bodyMarkdown: string): string {
  return bodyMarkdown.replace(/[#*_`]/g, '');
}

export function saveFeedback(payload: FeedbackPayload): void {
  try {
    const stored = localStorage.getItem('chorus.feedback');
    const feedbacks: FeedbackPayload[] = stored ? JSON.parse(stored) : [];
    feedbacks.push(payload);
    localStorage.setItem('chorus.feedback', JSON.stringify(feedbacks));
  } catch {
    // ignore
  }
}

export function getGitHubIssuesUrl(): string {
  try {
    return localStorage.getItem('chorus.repoIssuesUrl') || 'https://github.com/YOUR_USERNAME/chorus/issues/new';
  } catch {
    return 'https://github.com/YOUR_USERNAME/chorus/issues/new';
  }
}

export function setGitHubIssuesUrl(url: string): void {
  try {
    localStorage.setItem('chorus.repoIssuesUrl', url);
  } catch {
    // ignore
  }
}

export function generateFeedbackBody(payload: FeedbackPayload): string {
  let body = `### Feedback\n${payload.message}\n\n`;
  body += `### Intent\n${payload.intent} | Rating: ${payload.rating ?? 'n/a'}\n\n`;
  body += `### Contact (optional)\n${payload.email || 'n/a'}\n\n`;
  body += `### App\nChorus ${payload.appVersion}\n\n`;
  body += `### Environment\nURL: ${payload.pageUrl}\nUA: ${payload.userAgent}\n\n`;

  if (payload.includeContext && payload.context) {
    body += `### Context\n${fencedJSON(payload.context)}\n`;
  }

  return body;
}

export function generateFeedbackTitle(payload: FeedbackPayload): string {
  const words = payload.message.split(/\s+/).slice(0, 5).join(' ');
  return `Feedback: ${words}${payload.message.split(/\s+/).length > 5 ? '...' : ''}`;
}

export function generateMailtoURL(payload: FeedbackPayload): string {
  const subject = 'Chorus feedback';
  const body = plainText(generateFeedbackBody(payload));
  const enc = encodeURIComponentSafe;
  return `mailto:?subject=${enc(subject)}&body=${enc(body)}`;
}
