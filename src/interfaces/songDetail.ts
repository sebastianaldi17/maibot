// Sourced from https://github.com/sebastianaldi17/maisocial/blob/main/api/src/interfaces/song.interface.ts
export interface Song {
  artist: string;
  title: string;
  version: string;
  category: string;
  cover: string;
  difficulties: [
    {
      difficulty: string;
      level: string;
      internalLevel: number;
    },
  ];
  _id: string;
}

export interface GetSongsResponse {
  songs: Song[];
}
