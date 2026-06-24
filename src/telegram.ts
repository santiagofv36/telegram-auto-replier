import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions';
import { NewMessage } from 'telegram/events';

import { redis } from './redis';
import { getAutoReply, formatGroupReply } from './autoReply';

export let client: TelegramClient;

const DEFAULT_COOLDOWN = Number(process.env.COOLDOWN_SECONDS || 3600);
const GROUP_COOLDOWN = Number(process.env.GROUP_COOLDOWN_SECONDS || 7200);

export async function startTelegram() {
  const apiId = Number(process.env.TG_API_ID);
  const apiHash = process.env.TG_API_HASH!;

  const session = await redis.get<string>('telegram:session');

  if (!session) {
    throw new Error('telegram:session missing');
  }

  client = new TelegramClient(new StringSession(session), apiId, apiHash, {
    connectionRetries: 5,
  });

  await client.connect();

  console.log('Telegram connected');

  client.addEventHandler(async (event) => {
    const message = event.message;

    if (!message || message.out) return;

    const chatId = message.chatId?.toString();
    const senderId = message.senderId?.toString();

    const isPrivate = message.isPrivate;

    if (!chatId || !senderId) return;

    console.log('CHAT:', chatId);
    console.log('SENDER:', senderId);
    console.log('TEXT:', message.text);

    // -----------------------
    // GRUPOS PERMITIDOS
    // -----------------------
    const allowedGroups = (process.env.ALLOWED_GROUPS || '')
      .split(',')
      .filter(Boolean);

    const isAllowedGroup = isPrivate || allowedGroups.includes(chatId);

    if (!isAllowedGroup) return;

    // -----------------------
    // AUTO REPLY
    // -----------------------
    const autoReply = getAutoReply();
    if (!autoReply) return;

    const isGroup = !isPrivate;

    // -----------------------
    // COOLDOWN
    // -----------------------
    const cooldownKey = isGroup
      ? `tg:cooldown:group:${chatId}:${senderId}`
      : `tg:cooldown:dm:${senderId}`;

    const cooldownSeconds = isGroup ? GROUP_COOLDOWN : DEFAULT_COOLDOWN;

    const cooldown = await redis.get(cooldownKey);
    if (cooldown) return;

    // -----------------------
    // RESPUESTA
    // -----------------------
    if (isGroup) {
      const sender = await message.getSender();

      const username = (sender as any)?.username;

      const mention = username || senderId;

      const groupMessage = formatGroupReply(autoReply, mention);

      await client.sendMessage(chatId, {
        message: groupMessage,
        replyTo: message.id,
      });
    } else {
      await client.sendMessage(senderId, {
        message: autoReply,
      });
    }

    // -----------------------
    // GUARDAR COOLDOWN
    // -----------------------
    await redis.set(cooldownKey, '1', {
      ex: cooldownSeconds,
    });

    console.log('Auto reply sent');
  }, new NewMessage({}));
}
