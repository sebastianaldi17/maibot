export const GET_SONG_COMMAND = {
  name: "get-song",
  description: "Get a song from the database",
  options: [
    {
      name: "title",
      description: "Song title",
      type: 3,
      required: true,
    },
  ],
};
