from rest_framework import serializers
from .models import Category, Item
from users.serializers import UserDetailSerializer
from users.models import User  


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'slug']


class ItemSerializer(serializers.ModelSerializer):
    seller = UserDetailSerializer(read_only=True)
    category = CategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(), source='category', write_only=True
    )
    image = serializers.ImageField(required=False, allow_null=True)

    class Meta:
        model = Item
        fields = [
            'id', 'title', 'description', 'price',
            'category', 'category_id', 'seller',
            'image', 'condition', 'status', 'created_at'
        ]
        read_only_fields = ['seller', 'created_at']

    def create(self, validated_data):
        user = self.context['request'].user
        validated_data['seller'] = user
        return super().create(validated_data)

    def to_representation(self, instance):
        """Возвращаем полный URL для изображения"""
        representation = super().to_representation(instance)
        if representation.get('image') and self.context.get('request'):
            request = self.context['request']
            representation['image'] = request.build_absolute_uri(representation['image'])
        return representation


class ItemDetailSerializer(serializers.ModelSerializer):
    seller = UserDetailSerializer(read_only=True)
    category = CategorySerializer(read_only=True)
    image = serializers.ImageField(required=False, allow_null=True)
    
    class Meta:
        model = Item
        fields = [
            'id', 'title', 'description', 'price',
            'category', 'seller',
            'image', 'condition', 'status', 'created_at'
        ]

    def to_representation(self, instance):
        """Возвращаем полный URL для изображения"""
        representation = super().to_representation(instance)
        if representation.get('image') and self.context.get('request'):
            request = self.context['request']
            representation['image'] = request.build_absolute_uri(representation['image'])
        return representation

