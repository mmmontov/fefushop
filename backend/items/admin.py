from django.contrib import admin
from django.apps import apps
from django.contrib.admin.sites import AlreadyRegistered
from .models import Item, ItemImage, Category


class ItemImageInline(admin.TabularInline):
    model = ItemImage
    extra = 0
    fields = ('image', 'order')


@admin.register(Item)
class ItemAdmin(admin.ModelAdmin):
    inlines = [ItemImageInline]
    list_display = ('title', 'seller', 'price', 'status', 'created_at')
    list_filter = ('status', 'condition', 'category')
    search_fields = ('title', 'description')


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug')


# Регистрируем остальные модели автоматически
app = apps.get_app_config('items')

for model in app.get_models():
    try:
        admin.site.register(model)
    except AlreadyRegistered:
        pass
