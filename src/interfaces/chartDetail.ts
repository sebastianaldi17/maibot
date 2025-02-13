// Sourced from https://github.com/sebastianaldi17/maisocial/blob/main/api/src/interfaces/chart.interface.ts
export interface Chart {
  artist: string;
  category: string;
  version: string;
  title: string;
  cover: string;
  songId: string;

  difficulty: string;
  level: string;
  internalLevel: number;
}
