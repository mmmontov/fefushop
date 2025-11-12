from rest_framework import serializers
from .models import Favorite
from items.serializers import ItemSerializer

class FavoriteSerializer(serializers.ModelSerializer):
    item = ItemSerializer(read_only=True)  # Чтобы сразу видеть данные товара
    item_id = serializers.PrimaryKeyRelatedField(
        queryset=Favorite._meta.get_field('item').remote_field.model.objects.all(),
        source='item',
        write_only=True
    )

    class Meta:
        model = Favorite
        fields = ['id', 'item', 'item_id', 'created_at']
