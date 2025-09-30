# Chorus 🎵  
*Turn noisy feedback into clear themes.*

---

## Problem  
PMs and product teams are flooded with customer feedback from Slack threads, support tickets, and survey forms.  
But raw feedback is messy. It takes hours to sift through and spot patterns — slowing down decisions and hiding the real signal.  

---

## Solution  
**Chorus** takes raw, unstructured feedback and harmonizes it into 3–5 clear themes.  
For each theme, you get:  
- A **1-sentence summary**  
- **Example quotes** pulled from the feedback  
- Copyable output you can drop into your PRD, slide deck, or Notion doc  

Paste in the feedback → see the chorus emerge.  

---

## Demo  
<div>
    <a href="https://www.loom.com/share/fdee6705ec894052a76d5a0db83eba40">
    </a>
    <a href="https://www.loom.com/share/fdee6705ec894052a76d5a0db83eba40">
      <img style="max-width:300px;" src="https://cdn.loom.com/sessions/thumbnails/fdee6705ec894052a76d5a0db83eba40-03c7cbce5b04bb25-full-play.gif">
    </a>
  </div>
---

## How It Works  
1. **Input**: Paste raw user feedback (multiple lines of text).  
2. **Process**: AI clusters feedback into themes.  
3. **Output**: Clean cards with a theme title, summary, and supporting quotes.

**CSV Uploads**
- Upload a .csv with or without headers.
- Choose the column that contains feedback text.
- Chorus merges CSV rows with any pasted text, de-duplicates, and analyzes up to 500 lines.
- After analysis, download a labeled CSV: `original_text, theme_title`.

**Inline renaming + smart CSV remember**
- Click a theme title to rename it (affects all exports).
- Chorus remembers your chosen CSV column per header set in your browser (change anytime).

**Built-in feedback**
- Floating Feedback button opens a modal to share what you were trying to do, what happened, and an optional rating.
- Saves locally; you can copy to clipboard, open a prefilled GitHub Issue, or email it.
- Optionally includes anonymized context (counts + theme titles) to help debug.

---

## Try It Yourself  
https://justinwhittecar-chor-1wa6.bolt.host

---

## Tech  
- Built with [Bolt](https://bolt.new)  
- Powered by LLMs for clustering + summarization  
- Minimal, clean UI for fast iteration  

---

## Roadmap  
- [ x ] MVP: Cluster feedback into themes (v0)  
- [ ] Export to Markdown / CSV  
- [ ] Brand voice tuning (formal / crisp / warm)  
- [ ] API endpoint for automation  

---

## License  
MIT  
