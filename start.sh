#!/bin/bash

# Настройка кодировки и вывода
export LANG=C.UTF-8

echo "==================================================="
echo "      QA-Assistant — Автоматический запуск"
echo "==================================================="
echo ""

# 1. Проверка Python3
if ! command -v python3 &> /dev/null; then
    echo "[ERROR] Python 3 не установлен!"
    echo "Пожалуйста, установите Python 3.10+ с помощью вашего пакетного менеджера"
    echo "или скачайте с официального сайта: https://www.python.org/downloads/"
    echo ""
    exit 1
fi

# 2. Проверка Node.js / NPM
if ! command -v npm &> /dev/null; then
    echo "[ERROR] Node.js / NPM не установлены!"
    echo "Пожалуйста, установите Node.js LTS с официального сайта: https://nodejs.org/"
    echo ""
    exit 1
fi

echo "[INFO] Все необходимые программы (Python, Node.js) найдены."
echo ""

# 3. Настройка виртуального окружения Python
echo "[INFO] Шаг 1: Настройка бэкенда (Python venv)..."
if [ ! -d "backend/venv" ]; then
    echo "[INFO] Виртуальное окружение не найдено."
    if command -v uv &>/dev/null; then
        echo "[INFO] Обнаружен глобальный uv. Создание venv через uv..."
        uv venv backend/venv
    else
        echo "[INFO] Создание стандартного venv (python3 -m venv)..."
        python3 -m venv backend/venv
    fi
    if [ $? -ne 0 ]; then
        echo "[ERROR] Не удалось создать виртуальное окружение Python!"
        exit 1
    fi
fi

# 4. Установка зависимостей бэкенда
echo "[INFO] Шаг 2: Установка зависимостей бэкенда..."
source backend/venv/bin/activate

if command -v uv &>/dev/null; then
    echo "[INFO] Установка зависимостей через uv pip (быстрый режим)..."
    uv pip install -r backend/requirements.txt
else
    echo "[INFO] Попытка локальной установки uv для ускорения..."
    python3 -m pip install --upgrade pip &> /dev/null
    pip install uv &> /dev/null
    if [ $? -eq 0 ] && [ -f "backend/venv/bin/uv" ]; then
        echo "[INFO] Локальный uv установлен. Установка зависимостей через uv..."
        backend/venv/bin/uv pip install -r backend/requirements.txt
    else
        echo "[INFO] Установка зависимостей через стандартный pip..."
        pip install -r backend/requirements.txt
    fi
fi
if [ $? -ne 0 ]; then
    echo "[ERROR] Ошибка установки Python-зависимостей!"
    exit 1
fi

# 5. Проверка файла .env
if [ ! -f "backend/.env" ]; then
    echo "[INFO] Файл конфигурации .env не найден. Создание из шаблона..."
    cat <<EOT > backend/.env
# QA-Assistant Backend Configuration
LLM_PROVIDER=openai
OPENAI_API_KEY=mock-key-replace-with-your-real-key
OPENAI_MODEL=gpt-4o-mini
GEMINI_API_KEY=mock-key-replace-with-your-real-key
GEMINI_MODEL=gemini-2.5-flash
HOST=127.0.0.1
PORT=8000
EOT
fi

# 6. Настройка фронтенда
echo ""
echo "[INFO] Шаг 3: Настройка фронтенда (NPM)..."
cd frontend
if [ ! -d "node_modules" ]; then
    echo "[INFO] Модули npm не найдены. Установка зависимостей (npm install)..."
    npm install
    if [ $? -ne 0 ]; then
        echo "[ERROR] Ошибка установки npm-зависимостей!"
        cd ..
        exit 1
    fi
fi
cd ..

# 7. Запуск серверов с обработчиком выхода (Ctrl+C)
echo ""
echo "[INFO] Шаг 4: Запуск серверов..."

# Функция для корректного гашения процессов при выходе
cleanup() {
    echo ""
    echo "[INFO] Останавливаем серверы бэкенда и фронтенда..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    exit 0
}

# Перехватываем сигналы прерывания
trap cleanup SIGINT SIGTERM

# Запуск бэкенда
echo "[INFO] Запуск FastAPI (порт 8000) в фоновом режиме..."
cd backend
source venv/bin/activate
uvicorn app.main:app --port 8000 --host 127.0.0.1 --reload &
BACKEND_PID=$!
cd ..

# Даем бэкенду время на инициализацию
sleep 3

# Открытие браузера
echo "[INFO] Открытие браузера: http://localhost:5173/ ..."
if command -v xdg-open &> /dev/null; then
    xdg-open http://localhost:5173/ &
elif command -v open &> /dev/null; then
    open http://localhost:5173/ &
fi

# Запуск фронтенда
echo "[INFO] Запуск фронтенда Vite (порт 5173)..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

# Ожидание завершения фоновых процессов (скрипт будет висеть в терминале пока работает dev-сервер)
wait $BACKEND_PID $FRONTEND_PID
