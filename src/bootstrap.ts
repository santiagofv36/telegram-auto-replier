import "dotenv/config";

import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions";

import readline from "node:readline/promises";
import { stdin, stdout } from "node:process";

import { redis } from "./redis";

const rl = readline.createInterface({
  input: stdin,
  output: stdout,
});

async function bootstrap() {
  const apiId = Number(process.env.TG_API_ID);
  const apiHash = process.env.TG_API_HASH!;

  const client = new TelegramClient(
    new StringSession(""),
    apiId,
    apiHash,
    {
      connectionRetries: 5,
    }
  );

  await client.start({
    phoneNumber: async () => rl.question("Phone: "),
    phoneCode: async () => rl.question("Code: "),
    password: async () => rl.question("2FA Password: "),
    onError: console.error,
  });

  const session = client.session.save();

  await redis.set("telegram:session", session);

  console.log("SESSION SAVED TO REDIS");

  process.exit(0);
}

bootstrap();