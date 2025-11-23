FROM python:3.11-slim

WORKDIR /app



# Скопируй requirements
COPY requirements.txt .

# Установи Python зависимости
RUN pip install -r requirements.txt

# Скопируй весь проект
COPY . .

# Создай директории для media и static
RUN mkdir -p /app/media /app/staticfiles

# Expose port
EXPOSE 8000

# Запусти Django сервер
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
