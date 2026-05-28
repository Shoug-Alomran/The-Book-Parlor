import { Check, Sparkles, X } from "lucide-react";
import type { BookAISuggestion, InferredMetadataValue } from "../../types";

type Props = {
  suggestions: BookAISuggestion[];
  onAccept: () => void;
  onReject: () => void;
};

export function AISuggestionsPanel({ suggestions, onAccept, onReject }: Props) {
  if (!suggestions.length) return null;
  const groups: Array<[string, InferredMetadataValue[] | undefined]> = [
    ["Genres", suggestionsFor(suggestions, "genres")],
    ["Tropes", suggestionsFor(suggestions, "tropes")],
    ["Moods", suggestionsFor(suggestions, "moods")],
    ["Content warnings", suggestionsFor(suggestions, "content_warnings")],
    ["Season vibes", suggestionsFor(suggestions, "season_vibes")],
    ["Similar books", suggestionsFor(suggestions, "similar_books")],
  ];
  const singles = [
    ["Series", suggestionFor(suggestions, "series_type")],
    ["Standalone or series", suggestionFor(suggestions, "standalone_or_series")],
    ["POV type", suggestionFor(suggestions, "likely_pov_type")],
    ["POV count", suggestionFor(suggestions, "likely_pov_count")],
    ["Hype", suggestionFor(suggestions, "hype_rating_suggestion")],
    ["Rating template", suggestionFor(suggestions, "suggested_rating_template")],
  ].filter((item): item is [string, InferredMetadataValue] => Boolean(item[1]));
  const summary = suggestionFor(suggestions, "book_parlor_summary");

  return (
    <section className="cozy-card">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-mocha/70 dark:text-gold">AI suggested</p>
          <h2 className="mt-2 font-serif text-3xl font-bold">Reading-vibe suggestions</h2>
          <p className="mt-2 max-w-2xl leading-6 text-espresso/70 dark:text-cream/70">
            These are inferred, not facts. Content warnings stay suggestions until a reader confirms or removes them.
          </p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={onAccept} className="btn-primary"><Check size={17} />Accept</button>
          <button type="button" onClick={onReject} className="btn-soft"><X size={17} />Reject</button>
        </div>
      </div>
      {summary && (
        <div className="mb-4 rounded-2xl bg-gold/15 p-4">
          <div className="mb-1 flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-mocha"><Sparkles size={14} />AI-suggested summary</div>
          <p className="leading-7 text-espresso/80 dark:text-cream/80">{summary.value}</p>
          <Confidence value={summary.confidence} />
        </div>
      )}
      <div className="grid gap-4 lg:grid-cols-2">
        {groups.map(([label, items]) => items?.length ? (
          <div key={label}>
            <h3 className="mb-2 font-bold">{label}</h3>
            <div className="flex flex-wrap gap-2">
              {items.map((item) => <SuggestionChip key={`${label}-${item.value}`} item={item} />)}
            </div>
          </div>
        ) : null)}
        {singles.map(([label, item]) => (
          <div key={label} className="rounded-2xl bg-white/55 p-3 dark:bg-white/10">
            <div className="text-sm font-black uppercase tracking-[0.14em] text-mocha/70 dark:text-cream/60">{label}</div>
            <div className="mt-1 font-bold">{item.value}</div>
            <Confidence value={item.confidence} />
          </div>
        ))}
      </div>
    </section>
  );
}

function suggestionsFor(suggestions: BookAISuggestion[], fieldName: string) {
  return suggestions.map((suggestion) => suggestion.fieldName === fieldName ? normalizeSuggestionValue(suggestion.suggestedValue) : undefined).filter(Boolean) as InferredMetadataValue[];
}

function suggestionFor(suggestions: BookAISuggestion[], fieldName: string) {
  return normalizeSuggestionValue(suggestions.find((suggestion) => suggestion.fieldName === fieldName)?.suggestedValue);
}

function normalizeSuggestionValue(value: BookAISuggestion["suggestedValue"] | undefined): InferredMetadataValue | undefined {
  if (!value || Array.isArray(value)) return undefined;
  return value;
}

function SuggestionChip({ item }: { item: InferredMetadataValue }) {
  return (
    <span className="chip bg-gold/15">
      {item.value}
      <span className="rounded-full bg-white/60 px-2 py-0.5 text-[10px] dark:bg-white/10">{Math.round(item.confidence * 100)}%</span>
    </span>
  );
}

function Confidence({ value }: { value: number }) {
  return <p className="mt-1 text-xs font-bold text-mocha/65 dark:text-cream/60">confidence {Math.round(value * 100)}% · source ai_inferred</p>;
}
