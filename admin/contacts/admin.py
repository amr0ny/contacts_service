from django.contrib import admin
from .models import Contact

@admin.register(Contact)
class ContactAdmin(admin.ModelAdmin):
    list_display = ('name', 'city', 'phone_1',)
    list_filter = ('city',)
    search_fields = ('name', 'description', 'city')
    fieldsets = (
        (None, {
            'fields': ('name', 'description', 'city',)
        }),
        ('Контактная информация', {
            'fields': (('phone_1'),)
        }),
    )
