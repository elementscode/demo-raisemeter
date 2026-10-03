import { Marked } from "marked";

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

const SAFE_URL = /^(https?:|mailto:|\/|#)/i;

// Organizers write the markdown and anyone can read it, so raw HTML renders
// as text and a link can only go somewhere a browser treats as a page.
const md = new Marked({
  gfm: true,
  renderer: {
    html: ({ text }) => escapeHtml(text),
  },
  walkTokens: (token) => {
    if ((token.type === "link" || token.type === "image") && !SAFE_URL.test(token.href.trim())) {
      token.href = "#";
    }
  },
});

export function renderMarkdown(source: string): string {
  return md.parse(source, { async: false }) as string;
}
