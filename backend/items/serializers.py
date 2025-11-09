from rest_framework import serializers
from .models import Category, Item
from users.models import User  

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'slug']


class ItemSerializer(serializers.ModelSerializer):
    seller = serializers.StringRelatedField(read_only=True)
    category = CategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(), source='category', write_only=True
    )

    class Meta:
        model = Item
        fields = [
            'id', 'title', 'description', 'price',
            'category', 'category_id', 'seller',
            'image', 'condition', 'status', 'created_at'
        ]

    def create(self, validated_data):
        user = self.context['request'].user
        validated_data['seller'] = user
        return super().create(validated_data)
