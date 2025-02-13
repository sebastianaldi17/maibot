export const GET_RANDOM_SONGS_COMMAND = {
  name: "get-random",
  description: "Get random songs from the database",
  options: [
    {
      name: "min-level",
      description: "Minimum level",
      type: 10,
      required: true,
    },
    {
      name: "max-level",
      description: "Maximum level",
      type: 10,
      required: true,
    },
    {
      name: "song-count",
      description: "Number of songs to randomize",
      type: 4,
      required: true,
    },
  ],
};
