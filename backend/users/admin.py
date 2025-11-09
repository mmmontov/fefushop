from django.contrib import admin
from .models import User

# Простая регистрация модели User в админке — без кастомных форм.
admin.site.register(User)