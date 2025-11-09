from rest_framework import permissions

class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Разрешает редактирование только владельцу объекта.
    """

    def has_object_permission(self, request, view, obj):
        # Любой может читать (GET, HEAD, OPTIONS)
        if request.method in permissions.SAFE_METHODS:
            return True

        # Только владелец может изменять/удалять
        return obj.seller == request.user
