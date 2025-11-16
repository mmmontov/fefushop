from rest_framework import serializers
from .models import Review
from contacts.models import Contact
from users.serializers import UserDetailSerializer
from items.serializers import ItemSerializer


class ReviewSerializer(serializers.ModelSerializer):
    reviewer = UserDetailSerializer(read_only=True)
    seller = UserDetailSerializer(read_only=True)
    item = ItemSerializer(read_only=True)

    class Meta:
        model = Review
        fields = [
            'id', 'reviewer', 'seller', 'item',
            'contact', 'rating', 'comment', 'created_at'
        ]
        read_only_fields = ['reviewer', 'seller', 'item', 'created_at']

    rating = serializers.IntegerField(min_value=1, max_value=5)

    def validate(self, data):
        contact = data['contact']
        user = self.context['request'].user

        # Только покупатель может оставить оценку
        if contact.buyer != user:
            raise serializers.ValidationError(
                "Вы можете оставить отзыв только о продавце, с которым у вас был контакт."
            )

        # нельзя себе оставить отзыв
        if contact.seller == user:
            raise serializers.ValidationError("Вы не можете оставить отзыв о себе.")

        # отзыв уже оставлен
        if hasattr(contact, 'review'):
            raise serializers.ValidationError("Вы уже оставили отзыв для этого контакта.")

        return data

    def create(self, validated_data):
        contact = validated_data['contact']
        reviewer = self.context['request'].user

        validated_data['reviewer'] = reviewer
        validated_data['seller'] = contact.seller
        validated_data['item'] = contact.item

        return super().create(validated_data)

