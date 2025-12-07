from django.core.management.base import BaseCommand
from items.models import Item


class Command(BaseCommand):
    help = 'Архивирует объявления, которые были созданы более 30 дней назад'

    def handle(self, *args, **options):
        # Используем метод модели для архивации
        count = Item.archive_old_items()
        
        if count > 0:
            self.stdout.write(
                self.style.SUCCESS(
                    f'Успешно заархивировано {count} объявлений'
                )
            )
        else:
            self.stdout.write(
                self.style.SUCCESS('Нет объявлений для архивации')
            )

