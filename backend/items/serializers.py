from rest_framework import serializers
from .models import Category, Item, ItemImage
from users.serializers import UserDetailSerializer
from users.models import User  


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'slug']


class ItemImageSerializer(serializers.ModelSerializer):
    """Сериализатор для изображений товара"""
    class Meta:
        model = ItemImage
        fields = ['id', 'image', 'order']
        read_only_fields = ['id', 'order']

    def to_representation(self, instance):
        """Возвращаем полный URL для изображения"""
        representation = super().to_representation(instance)
        if representation.get('image') and self.context.get('request'):
            request = self.context['request']
            representation['image'] = request.build_absolute_uri(instance.image.url)
        return representation


class ItemSerializer(serializers.ModelSerializer):
    seller = UserDetailSerializer(read_only=True)
    category = CategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(), source='category', write_only=True
    )
    # Для обратной совместимости - первое изображение
    image = serializers.SerializerMethodField()
    # Массив всех изображений
    images = ItemImageSerializer(many=True, read_only=True)

    class Meta:
        model = Item
        fields = [
            'id', 'title', 'description', 'price',
            'category', 'category_id', 'seller',
            'image', 'images', 'condition', 'status', 'created_at'
        ]
        read_only_fields = ['seller', 'created_at', 'images']

    def get_image(self, obj):
        """Возвращаем первое изображение для обратной совместимости"""
        first_image = obj.images.first()
        if first_image and self.context.get('request'):
            request = self.context['request']
            return request.build_absolute_uri(first_image.image.url)
        return None

    def create(self, validated_data):
        user = self.context['request'].user
        validated_data['seller'] = user
        
        # Получаем изображения из request.FILES
        images = self.context['request'].FILES.getlist('images')
        
        # Валидация: минимум 1, максимум 4 изображения
        if len(images) < 1:
            raise serializers.ValidationError({'images': 'Необходимо загрузить хотя бы одно изображение'})
        if len(images) > 4:
            raise serializers.ValidationError({'images': 'Можно загрузить максимум 4 изображения'})
        
        # Создаем товар
        item = super().create(validated_data)
        
        # Создаем изображения
        for order, image_file in enumerate(images):
            ItemImage.objects.create(item=item, image=image_file, order=order)
        
        return item

    def update(self, instance, validated_data):
        # Получаем новые изображения из request.FILES
        images = self.context['request'].FILES.getlist('images')
        
        # Если есть новые изображения, заменяем старые
        if images:
            # Валидация: минимум 1, максимум 4 изображения
            if len(images) < 1:
                raise serializers.ValidationError({'images': 'Необходимо загрузить хотя бы одно изображение'})
            if len(images) > 4:
                raise serializers.ValidationError({'images': 'Можно загрузить максимум 4 изображения'})
            
            # Удаляем старые изображения
            instance.images.all().delete()
            
            # Создаем новые изображения
            for order, image_file in enumerate(images):
                ItemImage.objects.create(item=instance, image=image_file, order=order)
        
        # Обновляем остальные поля
        return super().update(instance, validated_data)


class ItemDetailSerializer(serializers.ModelSerializer):
    seller = UserDetailSerializer(read_only=True)
    category = CategorySerializer(read_only=True)
    # Для обратной совместимости - первое изображение
    image = serializers.SerializerMethodField()
    # Массив всех изображений
    images = ItemImageSerializer(many=True, read_only=True)
    
    class Meta:
        model = Item
        fields = [
            'id', 'title', 'description', 'price',
            'category', 'seller',
            'image', 'images', 'condition', 'status', 'created_at'
        ]

    def get_image(self, obj):
        """Возвращаем первое изображение для обратной совместимости"""
        first_image = obj.images.first()
        if first_image and self.context.get('request'):
            request = self.context['request']
            return request.build_absolute_uri(first_image.image.url)
        return None

