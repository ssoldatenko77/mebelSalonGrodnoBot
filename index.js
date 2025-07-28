require('dotenv').config();

const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

// === Проверка переменной окружения и разбор JSON ===
console.log('GOOGLE_SERVICE_ACCOUNT exists:', !!process.env.GOOGLE_SERVICE_ACCOUNT);

let creds;
try {
  creds = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT);
  creds.private_key = creds.private_key.replace(/\\n/g, '\n');
  console.log('✅ GOOGLE_SERVICE_ACCOUNT успешно разобран.');
} catch (err) {
  console.error('❌ Ошибка при разборе GOOGLE_SERVICE_ACCOUNT:', err.message);
  process.exit(1); // прерываем выполнение, чтобы не запускался бот с ошибкой
}

// === Express для Railway ===
const app = express();
const PORT = process.env.PORT || 3000;
app.get("/", (req, res) => res.send("Бот работает"));
app.listen(PORT, () => console.log(`Server on ${PORT}`));

// === Инициализация Telegram-бота ===
const bot = new TelegramBot(process.env.TELEGRAM_TOKEN, { polling: true });

const mainMenu = {
  reply_markup: {
    keyboard: [
      ['📩 Оставить заявку', '📷 Фото кухонь'],
      ['🚪 Фото шкафов', '🤝 Наши партнёры'],
      ['📱 Instagram', 'ℹ️ О нас']
    ],
    resize_keyboard: true,
  }
};

// === Команда /start ===
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, 'Добро пожаловать в салон мебели! Выберите опцию:', mainMenu);
});

// === Обработка сообщений ===
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  if (text === '📱 Instagram') {
    const instagramUrl = 'https://www.instagram.com/sapermebel_grodno';
    const inlineKeyboard = {
      reply_markup: {
        inline_keyboard: [
          [{ text: 'Перейти в Instagram', url: instagramUrl }]
        ]
      }
    };
    await bot.sendMessage(chatId, 'Нажмите кнопку, чтобы перейти в наш Instagram:', inlineKeyboard);

  } else if (text === 'ℹ️ О нас') {
    bot.sendMessage(chatId,
      'Мы — мебельный салон в Гродно.\n' +
      'Изготавливаем кухни, шкафы и другую корпусную мебель на заказ.\n' +
      'Работаем с надёжными производителями.\n' +
      'Индивидуальный подход и бесплатный замер. И лучший Рыжий Продавец'
    );

  } else if (text === '🤝 Наши партнёры') {
    bot.sendMessage(chatId,
      'Мы работаем с фабриками:\n' +
      '🏭 “Сапер мебель” — доступные кухни и шкафы.\n' +
      '🏭 “Зов мебель” — кухни среднего и премиум класса.'
    );

  } else if (text === '📷 Фото кухонь') {
    const kitchensDir = path.join(__dirname, 'kitchens');

    fs.readdir(kitchensDir, async (err, files) => {
      if (err) {
        bot.sendMessage(chatId, 'Не удалось загрузить фотографии кухонь.');
        console.error(err);
        return;
      }

      const photos = files.filter(f => /\.(jpe?g|png|gif)$/i.test(f));

      if (photos.length === 0) {
        bot.sendMessage(chatId, 'Фотографии кухонь пока отсутствуют.');
        return;
      }

      for (const photo of photos) {
        const photoPath = path.join(kitchensDir, photo);
        await bot.sendPhoto(chatId, photoPath);
      }
    });

  } else if (text === '🚪 Фото шкафов') {
    const wardrobes = [
      { url: 'https://example.com/wardrobe1.jpg', caption: 'Шкаф-купе #1' },
      { url: 'https://example.com/wardrobe2.jpg', caption: 'Шкаф-купе #2' },
    ];
    for (const item of wardrobes) {
      await bot.sendPhoto(chatId, item.url, { caption: item.caption });
    }

  } else if (text === '📩 Оставить заявку') {
    bot.sendMessage(chatId, 'Введите ваше имя:');
    bot.once('message', (msgName) => {
      const name = msgName.text;
      bot.sendMessage(chatId, 'Введите ваш номер телефона:');
      bot.once('message', (msgPhone) => {
        const phone = msgPhone.text;
        bot.sendMessage(chatId, 'Оставьте комментарий (например: "Нужна кухня под потолок"):');
        bot.once('message', async (msgComment) => {
          const comment = msgComment.text;
          await saveToGoogleSheets(name, phone, comment);
          bot.sendMessage(chatId, 'Спасибо! Мы с вами свяжемся.', mainMenu);
        });
      });
    });
  }
});

// === Сохранение данных в Google Таблицу ===
async function saveToGoogleSheets(name, phone, comment) {
  const auth = new google.auth.GoogleAuth({
    credentials: creds,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const client = await auth.getClient();
  const sheets = google.sheets({ version: 'v4', auth: client });

  const spreadsheetId = process.env.GOOGLE_SHEET_ID;

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: 'Заявка мебели!A1',
    valueInputOption: 'USER_ENTERED',
    resource: {
      values: [[name, phone, comment]],
    },
  });
}