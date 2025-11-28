# Generated migration for adding online status tracking

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('storybook', '0013_notification_data_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='userprofile',
            name='is_online',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='userprofile',
            name='last_seen',
            field=models.DateTimeField(auto_now=True),
        ),
    ]
