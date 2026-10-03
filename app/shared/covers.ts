import garden from "#app/shared/assets/covers/garden.jpg";
import shelter from "#app/shared/assets/covers/shelter.jpg";
import library from "#app/shared/assets/covers/library.jpg";
import court from "#app/shared/assets/covers/court.jpg";

const SEEDED: Record<string, string> = { garden, shelter, library, court };

export interface CoverSource {
  coverAsset: string | null;
  coverImageId: string | null;
  coverHash: string | null;
}

export function coverUrl(c: CoverSource): string {
  if (c.coverImageId && c.coverHash) {
    return `/images/${c.coverImageId}/${c.coverHash}`;
  }

  return SEEDED[c.coverAsset ?? ""] ?? garden;
}
