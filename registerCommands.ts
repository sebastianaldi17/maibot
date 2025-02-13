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

fetch(url, {
  method: "POST",
  headers: headers,
  body: JSON.stringify(GET_SONG_COMMAND),
})
  .then((response) => response.json())
  .then((data) => {
    console.log("Get songs registered successfully:", data);
  })
  .catch((error) => {
    console.error("Error registering get songs command:", error);
  });

fetch(url, {
  method: "POST",
  headers: headers,
  body: JSON.stringify(GET_RANDOM_SONGS_COMMAND),
})
  .then((response) => response.json())
  .then((data) => {
    console.log("Get random songs registered successfully:", data);
  })
  .catch((error) => {
    console.error("Error registering get random songs command:", error);
  });
