from django.contrib import admin
from .models import CollectionPoint, WasteType


@admin.register(WasteType)
class WasteTypeAdmin(admin.ModelAdmin):
    list_display = ['name', 'icon', 'color']


@admin.register(CollectionPoint)
class CollectionPointAdmin(admin.ModelAdmin):
    list_display = ['name', 'address', 'status', 'capacity_pct', 'updated_at']
    list_filter = ['status', 'waste_types']
    filter_horizontal = ['waste_types']