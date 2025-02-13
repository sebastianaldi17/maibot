import { VercelRequest, VercelResponse } from "@vercel/node";
import {
  InteractionResponseType,
  InteractionType,
  verifyKey,
} from "discord-interactions";
import { GET_SONG_COMMAND } from "../src/commands";
import { InteractionResponse } from "../src/structs";

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

            const commandResponse: InteractionResponse = {
              type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
              data: {
                content: `Search results for ${titleSearch}`,
                embeds: [
                  {
                    title: "Song 1",
                    description: "Song 1 description",
                    url: "https://maimaidx.jp/maimai-mobile/img/Music/edbfefdce47e1f93.png",
                  },
                  {
                    title: "Song 2",
                    description: "Song 2 description",
                    url: "https://maimaidx.jp/maimai-mobile/img/Music/f99ee802d1590feb.png",
                  },
                ],
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
