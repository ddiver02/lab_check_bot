type Mode = "harsh" | "comfort" | "random";
// Optionally include server-provided IDs for logging/feedback
type MinimalQuote = {
  quote: string;
  author: string;
  source: string;
  quote_id?: number; // referenced quote id
  user_input_id?: number; // id of the input log row
  similarity?: number; // vector match score (0..1, higher is better)
  reason?: string; // short explanation from Gemini or fallback
};

export { Mode, MinimalQuote };
