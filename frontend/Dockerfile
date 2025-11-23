FROM node:20-alpine

WORKDIR /app

# Скопируй package files
COPY package*.json ./

# Установи зависимости
RUN npm install

# Скопируй исходный код
COPY . .

# Expose port
EXPOSE 3000

# Запусти dev сервер
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "3000"]
