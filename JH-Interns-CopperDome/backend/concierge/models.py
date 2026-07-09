from django.db import models


class Guest(models.Model):
    first_name = models.CharField(max_length=150)
    last_name = models.CharField(max_length=150)
    email = models.EmailField(blank=True)
    checked_in = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.first_name} {self.last_name}"
