# Generated migration for privacy preferences fields

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('storybook', '0027_notificationpreferences'),
    ]

    operations = [
        migrations.AddField(
            model_name='notificationpreferences',
            name='share_usage_data',
            field=models.BooleanField(default=True, help_text='Share anonymous usage data to help improve the app'),
        ),
        migrations.AddField(
            model_name='notificationpreferences',
            name='allow_analytics',
            field=models.BooleanField(default=True, help_text='Enable detailed analytics to track reading patterns'),
        ),
        migrations.AddField(
            model_name='notificationpreferences',
            name='public_profile',
            field=models.BooleanField(default=False, help_text='Allow profile to be visible to other users'),
        ),
    ]
