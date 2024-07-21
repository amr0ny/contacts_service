from django.db import models
from django.utils import timezone


class Contact(models.Model):
    name = models.CharField(max_length=128)
    description = models.TextField(null=True)
    city = models.CharField(max_length=32)
    phone_1 = models.CharField(null=True, max_length=16)
    phone_2 = models.CharField(null=True, max_length=16)
    phone_3 = models.CharField(null=True, max_length=16)
    telegram_1 = models.CharField(null=True, max_length=64)
    telegram_2 = models.CharField(null=True, max_length=64)
    telegram_3 = models.CharField(null=True, max_length=64)
    rating = models.IntegerField(null=True, 
        choices=[
            (1, 1),
            (2, 2),
            (3, 3),
            (4, 4),
            (5, 5),
        ]
    )

    def __str__(self):
        return self.name
    
    class Meta:
        db_table = 'contacts'