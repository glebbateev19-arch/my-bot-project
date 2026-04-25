# Telegram Bot

Telegram бот с веб-приложением, работающий 24/7.

## Установка

### 1. Клонирование репозитория
```bash
git clone https://github.com/your-username/my-telegram-bot.git
cd my-telegram-bot
```

### 2. Создание виртуального окружения
```bash
python -m venv myenv
```

#### На Windows:
```bash
myenv\Scripts\activate
```

#### На MacOS/Linux:
```bash
source myenv/bin/activate
```

### 3. Установка зависимостей
```bash
pip install -r requirements.txt
```

### 4. Настройка переменных окружения
```bash
cp .env.example .env
```

Отредактируй `.env` и добавь свой токен:
```
BOT_TOKEN=your_actual_bot_token
```

## Запуск

```bash
python main.py
```

Бот будет работать с автоматическим переподключением при ошибках.

## Развертывание 24/7

### Вариант 1: Облачный хостинг (Рекомендуется)

#### PythonAnywhere (Бесплатно)
1. Зарегистрируйся на https://www.pythonanywhere.com
2. Загрузи файлы через Web UI
3. Создай консоль Bash и запусти скрипт
4. Используй `Always-on task` для 24/7 работы

#### Railway / Render / Heroku
1. Подключи GitHub репозиторий
2. Добавь переменную окружения `BOT_TOKEN`
3. Автоматическое развертывание и работа 24/7

### Вариант 2: VPS (Продвинуто)

```bash
# SSH на сервер
ssh user@server_ip

# Клонирование и настройка
git clone <your-repo>
cd <your-repo>
python -m venv myenv
source myenv/bin/activate
pip install -r requirements.txt

# Создание systemd сервиса
sudo nano /etc/systemd/system/telegram-bot.service
```

Содержимое файла:
```ini
[Unit]
Description=Telegram Bot
After=network.target

[Service]
Type=simple
User=your_user
WorkingDirectory=/home/your_user/my-telegram-bot
Environment="BOT_TOKEN=your_token"
ExecStart=/home/your_user/my-telegram-bot/myenv/bin/python main.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Затем:
```bash
sudo systemctl daemon-reload
sudo systemctl start telegram-bot
sudo systemctl enable telegram-bot
```

### Вариант 3: Docker (Профессиональный)

Создай `Dockerfile`:
```dockerfile
FROM python:3.11

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY main.py .

CMD ["python", "main.py"]
```

## Логирование

Логи сохраняются в `bot.log`. Проверь логи для отладки:
```bash
tail -f bot.log
```

## Лицензия

MIT
