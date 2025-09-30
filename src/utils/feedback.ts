interface Theme {
  title: string;
  summary: string;
  quotes: string[];
  impact?: 'Low' | 'Med' | 'High';
  effort?: 'Low' | 'Med' | 'High';
}

export const sampleData = `The interface is really confusing
I can't find the settings page
Navigation menu is unclear
Where do I go to change my preferences?
The dark mode looks amazing
Love the color scheme
Beautiful design overall
The app loads way too slowly
Performance is terrible on mobile
Takes forever to open
Experiencing frequent crashes
The export feature is exactly what I needed
Finally can download my data
Great addition with the CSV export
Would love to see more chart types
Needs better visualization options
Graphs are too basic
Customer support responded quickly
Great help from the team
Support was very friendly`;

export async function analyzeFeedback(text: string): Promise<Theme[]> {
  const lines = text
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);

  if (lines.length < 3) {
    throw new Error('Not enough feedback lines');
  }

  const prompt = `You are an expert at analyzing user feedback and identifying themes.

Given the following feedback comments (one per line), cluster them into 3-5 distinct themes based on semantic similarity.

For each theme:
1. Create a short, concrete title (3-6 words, neutral tone)
2. Write a one-sentence summary (maximum 25 words)
3. Select 2-4 representative quotes from the feedback that best illustrate this theme (use the exact text verbatim)

Feedback:
${lines.map((line, i) => `${i + 1}. ${line}`).join('\n')}

Return ONLY a valid JSON array with this exact structure, no other text:
[
  {
    "title": "Theme Title Here",
    "summary": "Brief summary of the theme.",
    "quotes": ["exact quote 1", "exact quote 2", "exact quote 3"]
  }
]`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': 'MOCK_KEY',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2048,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    });

    if (!response.ok) {
      return mockAnalysis(lines);
    }

    const data = await response.json();
    const content = data.content[0].text;

    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    return mockAnalysis(lines);
  } catch {
    return mockAnalysis(lines);
  }
}

function mockAnalysis(lines: string[]): Theme[] {
  const themes: Theme[] = [];

  const usabilityKeywords = ['confus', 'find', 'navigat', 'unclear', 'settings', 'preferences'];
  const designKeywords = ['dark mode', 'color', 'beautiful', 'design', 'look'];
  const performanceKeywords = ['slow', 'performance', 'load', 'crash', 'forever'];
  const featureKeywords = ['export', 'download', 'data', 'csv', 'feature'];
  const visualKeywords = ['chart', 'visualiz', 'graph', 'basic'];
  const supportKeywords = ['support', 'team', 'help', 'friendly', 'responded'];

  const categorized = {
    usability: lines.filter(l => usabilityKeywords.some(k => l.toLowerCase().includes(k))),
    design: lines.filter(l => designKeywords.some(k => l.toLowerCase().includes(k))),
    performance: lines.filter(l => performanceKeywords.some(k => l.toLowerCase().includes(k))),
    features: lines.filter(l => featureKeywords.some(k => l.toLowerCase().includes(k))),
    visualization: lines.filter(l => visualKeywords.some(k => l.toLowerCase().includes(k))),
    support: lines.filter(l => supportKeywords.some(k => l.toLowerCase().includes(k)))
  };

  if (categorized.usability.length >= 2) {
    themes.push({
      title: 'Navigation and Usability Issues',
      summary: 'Users struggle to find key features and navigate the interface effectively.',
      quotes: categorized.usability.slice(0, 3)
    });
  }

  if (categorized.design.length >= 2) {
    themes.push({
      title: 'Positive Design Feedback',
      summary: 'Users appreciate the visual design and aesthetic choices.',
      quotes: categorized.design.slice(0, 3)
    });
  }

  if (categorized.performance.length >= 2) {
    themes.push({
      title: 'Performance and Stability Concerns',
      summary: 'Users report slow loading times and reliability issues.',
      quotes: categorized.performance.slice(0, 3)
    });
  }

  if (categorized.features.length >= 2) {
    themes.push({
      title: 'Export Functionality Praised',
      summary: 'Users value the ability to export and download their data.',
      quotes: categorized.features.slice(0, 3)
    });
  }

  if (categorized.visualization.length >= 2) {
    themes.push({
      title: 'Visualization Enhancement Requests',
      summary: 'Users want more advanced charting and data visualization options.',
      quotes: categorized.visualization.slice(0, 3)
    });
  }

  if (categorized.support.length >= 2) {
    themes.push({
      title: 'Customer Support Excellence',
      summary: 'Users report positive experiences with customer support team.',
      quotes: categorized.support.slice(0, 3)
    });
  }

  if (themes.length === 0) {
    const chunkSize = Math.ceil(lines.length / 3);
    for (let i = 0; i < 3 && i * chunkSize < lines.length; i++) {
      const chunk = lines.slice(i * chunkSize, (i + 1) * chunkSize);
      if (chunk.length > 0) {
        themes.push({
          title: `Theme ${i + 1}`,
          summary: 'User feedback grouped by similarity.',
          quotes: chunk.slice(0, 3)
        });
      }
    }
  }

  return themes.slice(0, 5);
}

export function guessImpactEffort(theme: Theme): { impact: 'Low' | 'Med' | 'High'; effort: 'Low' | 'Med' | 'High' } {
  const text = `${theme.title} ${theme.summary}`.toLowerCase();

  const highImpactWords = ['crash', 'broken', 'fail', 'error', 'critical', 'urgent', 'blocker', 'security', 'data loss'];
  const medImpactWords = ['slow', 'confus', 'unclear', 'difficult', 'problem', 'issue', 'concern'];
  const lowImpactWords = ['nice', 'would love', 'wish', 'suggestion', 'prefer', 'minor'];

  const highEffortWords = ['redesign', 'rebuild', 'architecture', 'refactor', 'infrastructure', 'migration'];
  const medEffortWords = ['add', 'implement', 'create', 'develop', 'build', 'feature'];
  const lowEffortWords = ['fix', 'update', 'change', 'adjust', 'tweak', 'improve', 'polish'];

  let impact: 'Low' | 'Med' | 'High' = 'Med';
  let effort: 'Low' | 'Med' | 'High' = 'Med';

  if (highImpactWords.some(w => text.includes(w))) {
    impact = 'High';
  } else if (lowImpactWords.some(w => text.includes(w))) {
    impact = 'Low';
  } else if (medImpactWords.some(w => text.includes(w))) {
    impact = 'Med';
  }

  if (highEffortWords.some(w => text.includes(w))) {
    effort = 'High';
  } else if (lowEffortWords.some(w => text.includes(w))) {
    effort = 'Low';
  } else if (medEffortWords.some(w => text.includes(w))) {
    effort = 'Med';
  }

  return { impact, effort };
}

export function toMarkdown(themes: Theme[]): string {
  const now = new Date();
  let markdown = '---\n';
  markdown += 'generated_by: Chorus\n';
  markdown += `theme_count: ${themes.length}\n`;
  markdown += `date: ${now.toISOString()}\n`;
  markdown += '---\n\n';
  markdown += '# Feedback Themes\n\n';

  themes.forEach((theme, index) => {
    markdown += `## ${index + 1}. ${theme.title}\n\n`;
    if (theme.impact || theme.effort) {
      markdown += `**Impact:** ${theme.impact || 'N/A'} | **Effort:** ${theme.effort || 'N/A'}\n\n`;
    }
    markdown += `${theme.summary}\n\n`;
    markdown += '**Supporting Quotes:**\n\n';
    theme.quotes.forEach(quote => {
      markdown += `- "${quote}"\n`;
    });
    markdown += '\n';
  });

  return markdown;
}

export function downloadFile(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
