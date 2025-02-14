import * as dotenv from "dotenv";
import { GET_SONG_COMMAND } from "./src/commands/getSong";
import { GET_RANDOM_SONGS_COMMAND } from "./src/commands/getRandomSongs";

dotenv.config();

const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const DISCORD_APPLICATION_ID = process.env.DISCORD_APPLICATION_ID;

const headers = {
  "Content-Type": "application/json",
  Authorization: `Bot ${DISCORD_TOKEN}`,
};

const url = `https://discord.com/api/v10/applications/${DISCORD_APPLICATION_ID}/commands`;

async function registerCommands() {
  try {
    console.log("Registering get songs command...");
    const registerGetSongsResponse = await fetch(url, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(GET_SONG_COMMAND),
    });

    if (registerGetSongsResponse.ok) {
      const registerGetSongsResponseJson =
        await registerGetSongsResponse.json();
      console.log(registerGetSongsResponseJson);
    }

    console.log("Registering get random songs command...");

    const registerGetRandomSongsResponse = await fetch(url, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(GET_RANDOM_SONGS_COMMAND),
    });

    if (registerGetRandomSongsResponse.ok) {
      const registerGetRandomSongsResponseJson =
        await registerGetRandomSongsResponse.json();
      console.log(registerGetRandomSongsResponseJson);
    }
  } catch (error) {
    console.error(error);
  } finally {
    process.exit();
  }
}

registerCommands();
