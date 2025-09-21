// Replaces emails, phone numbers, and sequences that look like names (capitalized words) with placeholders.

function anonymizeText(text) {
  if (!text) return text;

  // redact emails
  text = text.replace(
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-z]{2,}/g,
    '[REDACTED_EMAIL]'
  );

  // redact phone numbers (simple)
  text = text.replace(/(\+?\d[\d\-\s]{6,}\d)/g, '[REDACTED_PHONE]');

  // redact capitalized Name-like tokens (simple heuristic)
  text = text.replace(/\b([A-Z][a-z]{1,20})(\s[A-Z][a-z]{1,20})?\b/g, (m) => {
    // keep single-word words that look like normal sentence starts (very naive),
    // but for demo we replace sequences of 2 capitalized words likely to be names.
    if (m.split(' ').length >= 2) return '[REDACTED_NAME]';
    return m; // leave single capitalized token
  });

  // collapse long whitespace
  text = text.replace(/\s{2,}/g, ' ');

  // create a short summary (first 280 chars)
  const summary = text.slice(0, 280) + (text.length > 280 ? '…' : '');

  return summary;
}

module.exports = { anonymizeText };
