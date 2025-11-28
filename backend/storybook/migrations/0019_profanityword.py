# Generated migration for ProfanityWord model

from django.db import migrations, models
import django.utils.timezone


class Migration(migrations.Migration):

    dependencies = [
        ('storybook', '0018_userprofile_avatar_emoji'),
    ]

    operations = [
        migrations.CreateModel(
            name='ProfanityWord',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('word', models.CharField(max_length=100, unique=True)),
                ('language', models.CharField(choices=[('en', 'English'), ('tl', 'Tagalog'), ('both', 'Both')], default='en', max_length=10)),
                ('severity', models.CharField(choices=[('mild', 'Mild'), ('moderate', 'Moderate'), ('severe', 'Severe')], default='moderate', max_length=20)),
                ('is_active', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(default=django.utils.timezone.now)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'verbose_name': 'Profanity Word',
                'verbose_name_plural': 'Profanity Words',
                'ordering': ['word'],
            },
        ),
    ]
