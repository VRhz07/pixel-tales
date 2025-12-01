# Generated migration for adding experience points and level to UserProfile

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('storybook', '0021_userprofile_archive_reason_userprofile_archived_at_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='userprofile',
            name='experience_points',
            field=models.PositiveIntegerField(default=0),
        ),
        migrations.AddField(
            model_name='userprofile',
            name='level',
            field=models.PositiveIntegerField(default=1),
        ),
    ]
