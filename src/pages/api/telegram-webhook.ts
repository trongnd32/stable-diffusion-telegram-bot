import type { NextApiRequest } from 'next';
import {ReplicateUtils} from "@/utils/replicate.utils";
import TelegramService from "@/services/telegram.service";
import {NextRequest} from "next/server";

export const config = {
  runtime: 'edge',
}

const model = "prompthero/openjourney:9936c2001faa2194a261c01381f90e65261879985476014a0a37a334593a05eb";
const midJourney = async (prompt: string, parameters = {}) =>
  await ReplicateUtils.run(model, { prompt, ...parameters });

export default function handler(req: NextRequest) {
  function getNow() {
    return new Date().toLocaleString("en-ca", {timeZone: "Asia/Ho_Chi_Minh"})
  }

  return new Promise(async resolve => {
    const telegram = new TelegramService();
    const vercelUrl = process.env.VERCEL_URL;
    const webhookPath = `https://${vercelUrl}/api/telegram-webhook`;
    const functionStartTime = new Date().getTime();
    if (req.method === 'GET') {
      console.log(`${getNow()}   Set webhook, url=${webhookPath}`)
      try {
        await telegram.setWebhook(webhookPath);
        resolve(new Response(JSON.stringify({
          message: 'Telegram Webhook has been successfully set'
        })));
      } catch (e: any) {
        resolve(new Response(JSON.stringify({
          message: 'Failed to setup Telegram Webhook. ' + e.message
        })));
      }
    } else {
      console.log(`${getNow()}   processing message`);
      const body = JSON.parse(await req.text());
      const msg = body.message as any;
      if (!msg || !msg.chat) {
        resolve(new Response(JSON.stringify({
          message: "Invalid chat"
        })));
        return;
      }
      const chatId = msg.chat.id;

      let full_name = msg.chat.first_name
      if(msg.chat.last_name != null) full_name += ` ${msg.chat.last_name}`
      console.log(`${getNow()}   message="${msg.text}", request from ${full_name}, username=${msg.chat.username}, chatId=${chatId}`);
      
      if (msg.text && msg.text.startsWith('/draw ')) {

        let timeout = setTimeout(() => {
          telegram.sendMessage(chatId, "Timed out. If you're using free plan of Vercel, please upgrade for more processing time. After upgrade, please set variable `FUNCTION_TIMEOUT` on vercel to a number larger than 15000 (15 seconds) to break this limit.");
          resolve(new Response(JSON.stringify({
            message: "timeout"
          })))
        }, parseInt(process.env.FUNCTION_TIMEOUT as string || "25000"));

        const sentMsg = await telegram.sendMessage(chatId, 'Image is being drawn...');
        // Temporarily disable translation due to limitations
        // const translation = await translate(msg.text.slice(6), {
        //   to: 'en'
        // });
        // const translatedPrompt = translation.text;
        try {
          const mjResponse = await midJourney(msg.text.slice(6));
          await Promise.all([
            telegram.sendPhoto(chatId, mjResponse[0]),
            telegram.deleteMessage(chatId, sentMsg.message_id)
          ]);
        } catch (e) {
          await telegram.editMessageText(chatId, sentMsg.message_id, 'Failed to draw. Please check server logs for more details.');
        }
        console.log(`${getNow()}   Taken ${new Date().getTime() - functionStartTime}ms to execute`);
        clearTimeout(timeout);
        resolve(new Response(JSON.stringify({
          success: true
        })))
      } else {
        console.log(`${getNow()}   Show help message`)
        const sentMsg = await telegram.sendMessage(chatId, 'type "/draw what-you-want" to generate picture');
        resolve(new Response(JSON.stringify({
          success: true
        })))
      }
    }
  });
}
