/* eslint-env node */
const fetch = require('node-fetch');
const TelegramCommandHandler = require('./telegramCommands');

class TelegramPolling {
  constructor(db, botToken) {
    this.db = db;
    this.botToken = botToken;
    this.apiUrl = `https://api.telegram.org/bot${botToken}`;
    this.commandHandler = new TelegramCommandHandler(db, null);
    this.offset = 0;
    this.isRunning = false;
  }

  /**
   * Start polling for messages
   */
  async startPolling() {
    if (this.isRunning) {
      console.log('Telegram polling already running');
      return;
    }

    this.isRunning = true;
    console.log('Starting Telegram bot polling...');

    this.pollLoop();
  }

  /**
   * Stop polling
   */
  stopPolling() {
    this.isRunning = false;
    console.log('Stopping Telegram bot polling...');
  }

  /**
   * Main polling loop
   */
  async pollLoop() {
    while (this.isRunning) {
      try {
        await this.getUpdates();
        // Small delay to avoid hammering the API
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (err) {
        console.error('Telegram polling error:', err.message);
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
  }

  /**
   * Get updates from Telegram
   */
  async getUpdates() {
    try {
      const response = await fetch(`${this.apiUrl}/getUpdates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          offset: this.offset,
          timeout: 30,
          allowed_updates: ['message'],
        }),
      });

      const result = await response.json();

      if (!result.ok) {
        console.error('Telegram API error:', result.description);
        return;
      }

      // Process each update
      for (const update of result.result) {
        try {
          await this.handleUpdate(update);
          // Update offset to get next updates
          this.offset = update.update_id + 1;
        } catch (err) {
          console.error('Error handling update:', err);
        }
      }
    } catch (err) {
      console.error('Error getting updates:', err.message);
    }
  }

  /**
   * Handle individual update
   */
  async handleUpdate(update) {
    const { message } = update;

    // Handle text messages
    if (message && message.text) {
      const chatId = message.chat.id;
      const text = message.text;

      console.log(`[${message.chat.first_name}] ${text}`);

      // Process command
      await this.commandHandler.handleMessage(message, chatId);
    }
  }
}

module.exports = TelegramPolling;
