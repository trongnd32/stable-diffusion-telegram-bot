class TelegramService {
  apiBase = 'https://api.telegram.org/bot';

  constructor() {
    const telegramToken = process.env.TELEGRAM_KEY as string;
    this.apiBase += telegramToken;
  }
  getNow() {
    return new Date().toLocaleString("en-ca", {timeZone: "Asia/Ho_Chi_Minh"})
  }
  sendMessage(chat_id, text, parse_mode = undefined) {
    console.log(`${this.getNow()}   Send message: ${text}`)
    return fetch(`${this.apiBase}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        chat_id,
        text,
        parse_mode
      })
    }).then(r => r.json())
  }
  setWebhook(url: string) {
    console.log(`${this.getNow()}   Set telegram webhook, api url=${this.apiBase}`);
    
    return fetch(`${this.apiBase}/setWebhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url,
        drop_pending_updates: true
      })
    })
  }
  sendPhoto(chat_id, photo_url, caption = '') {
    console.log(`${this.getNow()}   Send photo`);
    
    return fetch(`${this.apiBase}/sendPhoto`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        chat_id,
        photo: photo_url,
        caption,
      })
    })
  }
  deleteMessage(chat_id, message_id) {
    console.log(`${this.getNow()}   Delete message`);
    
    return fetch(`${this.apiBase}/deleteMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        chat_id,
        message_id,
      })
    })
  }
  editMessageText(chat_id, message_id, text) {
    console.log(`${this.getNow()}   Edit message, ${text}`);
    
    return fetch(`${this.apiBase}/editMessageText`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        chat_id,
        message_id,
        text,
      })
    })
  }
}

export default TelegramService;
