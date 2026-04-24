import telebot
from telebot.types import ReplyKeyboardMarkup, KeyboardButton, WebAppInfo

# Инициализация бота
bot = telebot.TeleBot('8763841108:AAHlWybOT_AQ2nalCdbZkdN7mymi_lTtP_o')

@bot.message_handler(commands=['start'])
def start(message):
    markup = ReplyKeyboardMarkup(resize_keyboard=True)
    web_app_button = KeyboardButton(
        text='Открыть веб страницу',
        web_app=WebAppInfo(url='https://itproger.com/index.html')
    )
    markup.add(web_app_button)
    bot.reply_to(message, 'Привет мой друг', reply_markup=markup)

if __name__ == "__main__":
    print("Бот запущен!")
    bot.infinity_polling()