# Generated migration for reward system

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('storybook', '0022_userprofile_experience_level'),
    ]

    operations = [
        migrations.AddField(
            model_name='userprofile',
            name='selected_avatar_border',
            field=models.CharField(blank=True, default='basic', max_length=50),
        ),
    ]
