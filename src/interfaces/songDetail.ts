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
