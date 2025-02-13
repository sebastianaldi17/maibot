import { VercelRequest, VercelResponse } from "@vercel/node";
import {
  InteractionResponseType,
  InteractionType,
  verifyKey,
} from "discord-interactions";
import { GET_SONG_COMMAND } from "../src/commands/getSong";
import { InteractionResponse } from "../src/interfaces/interactionResponse";
import { GetSongsResponse } from "../src/interfaces/songDetail";

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
                  description: song.version,
                  fields: song.difficulties.map((difficulty) => ({
                    name: difficulty.difficulty,
                    value: `Level: ${difficulty.level} (${difficulty.internalLevel})`,
                  })),
                  image: {
                    url: song.cover,
                  },
                  url: `${process.env.WEBSITE_URL}/songs/${song._id}`,
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
