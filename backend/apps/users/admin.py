from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ['username', 'email', 'role', 'points', 'is_available', 'is_active']
    list_filter = ['role', 'is_available', 'is_active']
    fieldsets = UserAdmin.fieldsets + (
        ('GOMI', {'fields': ('role', 'phone', 'avatar', 'points', 'is_available')}),
    )