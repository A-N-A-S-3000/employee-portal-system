# Generated by Django 4.2.23 on 2025-07-01 05:39

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('employees', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='employee',
            name='GID',
            field=models.CharField(blank=True, max_length=20, null=True, unique=True),
        ),
        migrations.AddField(
            model_name='employee',
            name='phone_number',
            field=models.CharField(blank=True, max_length=15, null=True),
        ),
    ]
