from rest_framework import serializers
from django.utils import timezone

from .models import ContactRequest, Contact
from items.serializers import ItemSerializer
from users.serializers import UserDetailSerializer


class ContactRequestSerializer(serializers.ModelSerializer):
    buyer = UserDetailSerializer(read_only=True)
    seller = UserDetailSerializer(read_only=True)
    item = ItemSerializer(read_only=True)
    item_id = serializers.PrimaryKeyRelatedField(
        queryset=ContactRequest._meta.get_field('item').remote_field.model.objects.all(),
        source='item',
        write_only=True
    )

    class Meta:
        model = ContactRequest
        fields = [
            'id', 'buyer', 'seller', 'item', 'item_id',
            'message', 'status', 'created_at', 'responded_at'
        ]
        read_only_fields = ['status', 'created_at', 'responded_at', 'buyer']

    def create(self, validated_data):
        user = self.context['request'].user
        validated_data['buyer'] = user
        return super().create(validated_data)


class ContactSerializer(serializers.ModelSerializer):
    buyer = UserDetailSerializer(read_only=True)
    seller = UserDetailSerializer(read_only=True)
    item = ItemSerializer(read_only=True)

    class Meta:
        model = Contact
        fields = ['id', 'request', 'buyer', 'seller', 'item', 'created_at']

