import { VercelRequest, VercelResponse } from "@vercel/node";
import {
  InteractionResponseType,
  InteractionType,
  verifyKey,
} from "discord-interactions";
import { GET_SONG_COMMAND } from "../src/commands/getSong";
import { InteractionResponse } from "../src/interfaces/interactionResponse";
import { GetSongsResponse } from "../src/interfaces/songDetail";
import { GET_RANDOM_SONGS_COMMAND } from "../src/commands/getRandomSongs";
import { Chart } from "../src/interfaces/chartDetail";

export default async function main(
  request: VercelRequest,
  response: VercelResponse,
) {
  if (request.method === "POST") {
    try {
      const signature = request.headers["x-signature-ed25519"];
      const timestamp = request.headers["x-signature-timestamp"];

      const isValidRequest = await verifyKey(
        JSON.stringify(request.body),
        signature as string,
        timestamp as string,
        process.env.PUBLIC_KEY || "",
      );

      if (!isValidRequest) {
        console.log("Bad request");
        console.log(JSON.stringify(request.body));
        console.log(request.headers);
        console.log(signature);
        console.log(timestamp);
        console.log(process.env.PUBLIC_KEY);
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

            const songsResponse = await fetch(
              `${process.env.SONG_API_URL}/songs/random?minLevel=${minLevel}&maxLevel=${maxLevel}&songCount=${songCount}`,
            );
            if (!songsResponse.ok) {
              response.status(500).end("Failed to fetch songs from songs API");
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

            const commandResponse: InteractionResponse = {
              type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
              data: {
                content: `Random ${minLevel} - ${maxLevel} x${songCount}`,
                embeds: charts.map((chart) => ({
                  title: `${chart.title} - ${chart.artist}`,
                  description: `Version: ${chart.version}\nCategory: ${chart.category}`,
                  fields: [
                    {
                      name: "Difficulty",
                      value: chart.difficulty,
                    },
                    {
                      name: "Level",
                      value: chart.level,
                    },
                    {
                      name: "Constant",
                      value: chart.internalLevel.toString(),
                    },
                  ],
                  image: {
                    url: chart.cover,
                  },
                  url: `${process.env.WEBSITE_URL}/${chart.songId}`,
                })),
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
