import telebot
import os
import time
import logging
from telebot.types import ReplyKeyboardMarkup, KeyboardButton, WebAppInfo
from dotenv import load_dotenv

# Загрузка переменных окружения
load_dotenv()

# Настройка логирования
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('bot.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Инициализация бота
BOT_TOKEN = os.getenv('BOT_TOKEN')
if not BOT_TOKEN:
    raise ValueError("BOT_TOKEN не найден в переменных окружения!")

bot = telebot.TeleBot(BOT_TOKEN)

@bot.message_handler(commands=['start'])
def start(message):
    markup = ReplyKeyboardMarkup(resize_keyboard=True)
    web_app_button = KeyboardButton(
        text='Открыть веб страницу',
        web_app=WebAppInfo(url='https://glebbateev19-arch.github.io/my-bot-project/')
    )
    markup.add(web_app_button)
    bot.reply_to(message, 'Привет мой друг', reply_markup=markup)
    logger.info(f"Пользователь {message.from_user.id} запустил бот")

def start_bot():
    """Запуск бота с обработкой ошибок"""
    logger.info("Бот запущен!")
    while True:
        try:
            bot.infinity_polling(timeout=10, long_polling_timeout=5)
        except Exception as e:
            logger.error(f"Ошибка: {e}")
            logger.info("Переподключение через 5 секунд...")
            time.sleep(5)

if __name__ == "__main__":
    start_bot()