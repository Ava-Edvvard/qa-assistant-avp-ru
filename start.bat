@echo off
chcp 65001 >nul
title QA-Assistant Launcher

echo ===================================================
echo       QA-Assistant — Автоматический запуск
echo ===================================================
echo.

:: 0. Проверка занятости портов
netstat -ano | findstr LISTENING | findstr /c:":8000 " >nul 2>&1
if %errorlevel% equ 0 goto ERR_PORT_IN_USE
netstat -ano | findstr LISTENING | findstr /c:":5173 " >nul 2>&1
if %errorlevel% equ 0 goto ERR_PORT_IN_USE

:: 1. Проверка Python
python --version >nul 2>&1
if errorlevel 1 goto ERR_PYTHON

:: 2. Проверка Node.js/NPM
call npm -v >nul 2>&1
if errorlevel 1 goto ERR_NPM

echo [INFO] Все необходимые программы (Python, Node.js) установлены.
echo.

:: 3. Настройка виртуального окружения Python
echo [INFO] Шаг 1: Настройка бэкенда (Python venv)...
if exist "backend\venv" goto VENV_EXISTS
echo [INFO] Виртуальное окружение не найдено.

:: Проверяем, установлен ли uv глобально
call uv --version >nul 2>&1
if errorlevel 1 goto VENV_STANDARD

echo [INFO] Обнаружен глобальный uv. Создание venv через uv...
call uv venv backend\venv
if errorlevel 1 goto ERR_VENV
goto VENV_EXISTS

:VENV_STANDARD
echo [INFO] Создание стандартного venv (python -m venv)...
python -m venv backend\venv
if errorlevel 1 goto ERR_VENV
:VENV_EXISTS

:: 4. Установка зависимостей бэкенда
echo [INFO] Шаг 2: Установка зависимостей бэкенда...
call backend\venv\Scripts\activate

:: Проверяем, установлен ли uv (глобально или внутри venv)
call uv --version >nul 2>&1
if not errorlevel 1 goto UV_INSTALL_REQS

:: Если uv нет, пробуем установить его локально в venv для ускорения
echo [INFO] Установка uv в виртуальное окружение для ускорения сборки...
python -m pip install --upgrade pip >nul 2>&1
pip install uv >nul 2>&1
if errorlevel 1 goto PIP_FALLBACK

:UV_INSTALL_REQS
echo [INFO] Установка зависимостей через uv pip (быстрый режим)...
call uv pip install -r backend\requirements.txt
if errorlevel 1 goto ERR_PIP
goto PIP_EXISTS

:PIP_FALLBACK
echo [INFO] Установка зависимостей через стандартный pip (может занять время)...
pip install -r backend\requirements.txt
if errorlevel 1 goto ERR_PIP
:PIP_EXISTS

:: 5. Проверка наличия файла .env
if exist "backend\.env" goto ENV_EXISTS
echo [INFO] Файл конфигурации .env не найден. Создание из шаблона...
echo # QA-Assistant Backend Configuration > backend\.env
echo LLM_PROVIDER=openai >> backend\.env
echo OPENAI_API_KEY=mock-key-replace-with-your-real-key >> backend\.env
echo OPENAI_MODEL=gpt-4o-mini >> backend\.env
echo GEMINI_API_KEY=mock-key-replace-with-your-real-key >> backend\.env
echo GEMINI_MODEL=gemini-2.5-flash >> backend\.env
echo HOST=127.0.0.1 >> backend\.env
echo PORT=8000 >> backend\.env
:ENV_EXISTS

:: 6. Настройка фронтенда
echo.
echo [INFO] Шаг 3: Настройка фронтенда (NPM)...
cd frontend
if exist "node_modules" goto NODE_MODULES_EXISTS
echo [INFO] Модули npm не найдены. Установка зависимостей (npm install)...
call npm install
if errorlevel 1 goto ERR_NPM_INSTALL
:NODE_MODULES_EXISTS
cd ..

:: 7. Запуск серверов
echo.
echo [INFO] Шаг 4: Запуск серверов...
echo [INFO] Запуск FastAPI (порт 8000) в отдельном окне...
start "QA-Assistant Backend" cmd /k "call backend\venv\Scripts\activate && cd backend && uvicorn app.main:app --port 8000 --reload"

echo [INFO] Ожидание инициализации бэкенда (3 секунды)...
ping 127.0.0.1 -n 4 >nul

echo [INFO] Открытие браузера: http://localhost:5173/ ...
start http://localhost:5173/

echo [INFO] Запуск фронтенда Vite (порт 5173)...
cd frontend
call npm run dev
cd ..
goto :EOF


:ERR_PYTHON
echo [ERROR] Python не установлен или не добавлен в переменную окружения PATH!
echo.
echo Пожалуйста:
echo 1. Скачайте Python 3.10+ с официального сайта: https://www.python.org/downloads/
echo 2. При установке ОБЯЗАТЕЛЬНО отметьте галочку "Add Python to PATH" (Добавить Python в PATH).
echo 3. Перезапустите это окно командной строки.
echo.
pause
exit /b 1

:ERR_NPM
echo [ERROR] Node.js / NPM не установлены!
echo.
echo Пожалуйста:
echo 1. Скачайте и установите Node.js LTS с официального сайта: https://nodejs.org/
echo 2. Перезапустите это окно командной строки.
echo.
pause
exit /b 1

:ERR_VENV
echo [ERROR] Не удалось создать виртуальное окружение Python!
pause
exit /b 1

:ERR_PIP
echo [ERROR] Ошибка установки Python-зависимостей!
pause
exit /b 1

:ERR_NPM_INSTALL
echo [ERROR] Ошибка установки npm-зависимостей!
cd ..
pause
exit /b 1

:ERR_PORT_IN_USE
echo [ERROR] Порты 8000 или 5173 уже используются!
echo Возможно, платформа QA-Assistant уже запущена в другом окне.
echo Пожалуйста, закройте запущенную копию или завершите процессы Node.js/Python, занимающие эти порты.
echo.
pause
exit /b 1
