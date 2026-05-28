import type { RatingGenre } from "../types";
import { ratingTemplates } from "../data/ratingTemplates";
import { RatingIconGroup } from "./RatingIconGroup";

type Props = {
  genre: RatingGenre;
  values: Record<string, number>;
  onChange: (field: string, value: number) => void;
};

export function GenreRatingTemplate({ genre, values, onChange }: Props) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {ratingTemplates[genre].map((field) => (
        <RatingIconGroup key={field} label={field} value={values[field] ?? 0} onChange={(value) => onChange(field, value)} />
      ))}
    </div>
  );
}
