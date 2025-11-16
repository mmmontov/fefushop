from rest_framework import serializers
from .models import User


class UserRegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True)
    avatar = serializers.ImageField(required=False, allow_null=True)

    class Meta:
        model = User
        fields = ('id', 'username', 'first_name', 'email', 'password', 'telegram', 'phone', 'faculty', 'building', 'avatar')

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)


class UserSerializer(serializers.ModelSerializer):
    avatar = serializers.ImageField(required=False, allow_null=True)

    class Meta:
        model = User
        fields = ('id', 'username', 'first_name', 'email', 'role', 'faculty', 'building', 'telegram', 'phone', 'avatar', 'rating')


class UserDetailSerializer(serializers.ModelSerializer):
    """Сериализатор для публичного профиля пользователя"""
    avatar = serializers.ImageField(required=False, allow_null=True)
    telegram = serializers.CharField(read_only=True)
    phone = serializers.CharField(read_only=True)

    class Meta:
        model = User
        fields = ('id', 'username', 'first_name', 'avatar', 'rating', 'faculty', 'building', 'telegram', 'phone')

    def to_representation(self, instance):
        """Возвращаем полный URL для аватара и контакты только если есть одобренный контакт"""
        representation = super().to_representation(instance)
        
        # Обрабатываем аватар
        if representation.get('avatar') and self.context.get('request'):
            request = self.context['request']
            representation['avatar'] = request.build_absolute_uri(representation['avatar'])
        
        # Проверяем наличие одобренного контакта
        request = self.context.get('request')
        if request and request.user and request.user.is_authenticated:
            # Если пользователь просматривает свой профиль, всегда показываем контакты
            if request.user.id == instance.id:
                # Контакты уже включены в representation
                pass
            else:
                from contacts.models import Contact
                # Проверяем, есть ли одобренный контакт между текущим пользователем и этим пользователем
                # Пользователь может быть покупателем (запрашивал контакты у продавца)
                has_approved_contact_as_buyer = Contact.objects.filter(
                    seller=instance,
                    buyer=request.user
                ).exists()
                # Или продавцом (у него запрашивали контакты)
                has_approved_contact_as_seller = Contact.objects.filter(
                    seller=request.user,
                    buyer=instance
                ).exists()
                
                has_approved_contact = has_approved_contact_as_buyer or has_approved_contact_as_seller
                
                # Если контакт не одобрен, скрываем контактные данные
                if not has_approved_contact:
                    representation['telegram'] = None
                    representation['phone'] = None
        else:
            # Если пользователь не авторизован, скрываем контакты
            representation['telegram'] = None
            representation['phone'] = None
        
        return representation


class UserProfileSerializer(serializers.ModelSerializer):
    """Полный профиль текущего пользователя"""
    avatar = serializers.ImageField(required=False, allow_null=True)

    class Meta:
        model = User
        fields = ('id', 'username', 'first_name', 'email', 'role', 'faculty', 'building', 'telegram', 'phone', 'avatar', 'rating', 'created_at')
        read_only_fields = ('id', 'rating', 'role', 'created_at')

    def to_representation(self, instance):
        """Возвращаем полный URL для аватара"""
        representation = super().to_representation(instance)
        if representation.get('avatar') and self.context.get('request'):
            request = self.context['request']
            representation['avatar'] = request.build_absolute_uri(representation['avatar'])
        return representation