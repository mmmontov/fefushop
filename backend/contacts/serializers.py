from rest_framework import serializers

from .models import ContactRequest, Contact
from items.serializers import ItemSerializer
from users.serializers import UserSerializer 

class ContactRequestSerializer(serializers.ModelSerializer):
    buyer = UserSerializer(read_only=True)
    seller = UserSerializer(read_only=True)
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
        read_only_fields = ['status', 'created_at', 'responded_at']


class ContactSerializer(serializers.ModelSerializer):
    buyer = UserSerializer(read_only=True)
    seller = UserSerializer(read_only=True)
    item = ItemSerializer(read_only=True)

    class Meta:
        model = Contact
        fields = ['id', 'request', 'buyer', 'seller', 'item', 'created_at']
