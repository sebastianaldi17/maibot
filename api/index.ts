import { VercelRequest, VercelResponse } from "@vercel/node";
import {
  InteractionResponseType,
  InteractionType,
  verifyKey,
} from "discord-interactions";
import { GET_SONG_COMMAND } from "../src/commands";

export default async function main(
  request: VercelRequest,
  response: VercelResponse,
) {
  console.log("Request received: ", request.method, request.body);
  if (request.method === "POST") {
    try {
      const signature = request.headers["X-Signature-Ed25519"];
      const timestamp = request.headers["X-Signature-Timestamp"];

      const isValidRequest = await verifyKey(
        JSON.stringify(request.body),
        signature as string,
        timestamp as string,
        process.env.PUBLIC_KEY || "",
      );

      if (!isValidRequest) {
        console.log("Invalid request signature");
        return response.status(401).end("Bad request signature");
      }

      const message = request.body;
      if (message.type === InteractionType.PING) {
        response.send({
          type: InteractionResponseType.PONG,
        });
      } else if (message.type === InteractionType.APPLICATION_COMMAND) {
        switch (message.data.name.toLowerCase()) {
          case GET_SONG_COMMAND.name.toLowerCase(): {
            // response struct https://discord.com/developers/docs/interactions/receiving-and-responding#responding-to-an-interaction
            response.status(200).send({
              type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
              data: {
                content: "Test",
                embeds: [
                  {
                    image: {
                      url: "https://maimaidx.jp/maimai-mobile/img/Music/edbfefdce47e1f93.png",
                    },
                  },
                ],
              },
            });
            break;
          }
          default: {
            console.log("Unknown command");
            response.status(400).end("Unknown command");
          }
        }
      } else {
        console.log("Unknown interaction type");
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
