FROM node:20-slim

WORKDIR /app

# Копируем package.json и устанавливаем зависимости
COPY package.json ./
RUN yarn config set strict-ssl false && yarn install --network-timeout 600000

# Копируем исходный код фронтенда
COPY . .

# Открываем порт Vite dev-сервера
EXPOSE 5173

# Запуск Vite с флагом --host, чтобы сервер был доступен снаружи контейнера
CMD ["npm", "run", "dev", "--", "--host"]
