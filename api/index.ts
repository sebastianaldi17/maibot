import { VercelRequest, VercelResponse } from "@vercel/node";
import {
  InteractionResponseFlags,
  InteractionResponseType,
  InteractionType,
  verifyKey,
} from "discord-interactions";
import { GET_SONG_COMMAND } from "../src/commands/getSong";
import {
  Embed,
  EmbedField,
  InteractionResponse,
} from "../src/interfaces/interactionResponse";
import { GetSongsResponse } from "../src/interfaces/songDetail";
import { GET_RANDOM_SONGS_COMMAND } from "../src/commands/getRandomSongs";
import { Chart } from "../src/interfaces/chartDetail";
import getRawBody from "raw-body";
import { shuffleArray } from "../src/utils";

export default async function main(
  request: VercelRequest,
  response: VercelResponse,
) {
  if (request.method === "POST") {
    try {
      const signature = request.headers["x-signature-ed25519"];
      const timestamp = request.headers["x-signature-timestamp"];

      const requestBody = await getRawBody(request);

      const isValidRequest = await verifyKey(
        requestBody,
        signature as string,
        timestamp as string,
        process.env.PUBLIC_KEY || "",
      );

      if (!isValidRequest) {
        console.log("Bad request");
        return response.status(401).end("Bad request signature");
      }

      const message = request.body;
      if (message.type === InteractionType.PING) {
        const pingResponse: InteractionResponse = {
          type: InteractionResponseType.PONG,
        };
        response.send(pingResponse);
      } else if (message.type === InteractionType.APPLICATION_COMMAND) {
        switch (message.data.name.toLowerCase()) {
          case GET_SONG_COMMAND.name.toLowerCase(): {
            const titleSearch = message.data.options[0].value;

            const songsResponse = await fetch(
              `${process.env.SONG_API_URL}/songs?title=${titleSearch}`,
            );

            if (!songsResponse.ok) {
              response.status(500).end("Failed to fetch songs from songs API");
              break;
            }

            const songsBody: GetSongsResponse = await songsResponse.json();
            const songs = songsBody.songs;

            if (songs.length === 0) {
              const noSongsFoundResponse: InteractionResponse = {
                type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                data: {
                  content: `No songs found for ${titleSearch}`,
                },
              };
              response.status(200).send(noSongsFoundResponse);
              break;
            }

            const commandResponse: InteractionResponse = {
              type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
              data: {
                content: `Search results for ${titleSearch}`,
                embeds: songs.map((song) => ({
                  title: `${song.title} - ${song.artist}`,
                  description: `Version: ${song.version}\nCategory: ${song.category}`,
                  fields: song.difficulties.map((difficulty) => ({
                    name: difficulty.difficulty,
                    value: `Level: ${difficulty.level} (${difficulty.internalLevel})`,
                  })),
                  image: {
                    url: song.cover,
                  },
                  url: `${process.env.WEBSITE_URL}/${song._id}`,
                })),
              },
            };
            response.status(200).send(commandResponse);
            break;
          }
          case GET_RANDOM_SONGS_COMMAND.name.toLowerCase(): {
            const minLevel: number = message.data.options[0].value;
            const maxLevel: number = message.data.options[1].value;
            const songCount: number = message.data.options[2].value;

            if (songCount <= 0 || songCount > 4) {
              const invalidSongCountResponse: InteractionResponse = {
                type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                data: {
                  content: `Invalid song count. Must be between 1 and 4`,
                  flags: InteractionResponseFlags.EPHEMERAL,
                },
              };
              response.status(200).send(invalidSongCountResponse);
              break;
            }

            const songsResponse = await fetch(
              `${process.env.SONG_API_URL}/songs/random?minLevel=${minLevel}&maxLevel=${maxLevel}&songCount=${songCount}`,
            );
            if (!songsResponse.ok) {
              const internalServerErrorResponse: InteractionResponse = {
                type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                data: {
                  content: `Failed to fetch songs from songs API`,
                  flags: InteractionResponseFlags.EPHEMERAL,
                },
              };
              response.status(200).send(internalServerErrorResponse);
              break;
            }

            const charts: Chart[] = await songsResponse.json();

            if (charts.length === 0) {
              const noSongsFoundResponse: InteractionResponse = {
                type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                data: {
                  content: `No charts matched the criteria`,
                },
              };
              response.status(200).send(noSongsFoundResponse);
              break;
            }

            const shuffledCharts = shuffleArray(charts);

            const embeds: Embed[] = [];
            const fields: EmbedField[] = [];
            for (let i = 0; i < shuffledCharts.length; i++) {
              const chart = shuffledCharts[i];
              fields.push({
                name: `Track ${i + 1}`,
                value: `${chart.title} - ${chart.artist}\nDifficulty: ${chart.difficulty} (${chart.level})`,
                inline: true,
              });
            }

            embeds.push({
              title: `Random ${minLevel} - ${maxLevel} x${songCount}`,
              fields: fields,
            });

            const commandResponse: InteractionResponse = {
              type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
              data: {
                content: `Random ${minLevel} - ${maxLevel} x${songCount}`,
                embeds: embeds,
              },
            };
            response.status(200).send(commandResponse);
            break;
          }
          default: {
            response.status(400).end("Unknown command");
          }
        }
      } else {
        response.status(400).end("Not command or ping");
      }
    } catch (err) {
      console.error("Internal server error: ", err);
      response.status(500).send({ error: "Internal Server Error" });
    }
  } else {
    response.status(405).end("Method Not Allowed");
  }
}
