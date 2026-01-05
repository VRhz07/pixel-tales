# Generated migration for NotificationPreferences model

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('storybook', '0026_remove_teacherstudentrelationship_class_name_and_more'),
    ]

    operations = [
        migrations.CreateModel(
            name='NotificationPreferences',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('weekly_reports', models.BooleanField(default=True, help_text='Receive weekly progress reports via email')),
                ('achievement_alerts', models.BooleanField(default=True, help_text='Get notified when achievements are earned')),
                ('goal_completion', models.BooleanField(default=True, help_text='Receive alerts when learning goals are completed')),
                ('realtime_updates', models.BooleanField(default=False, help_text='Enable push notifications for real-time updates')),
                ('push_token', models.CharField(blank=True, max_length=500, null=True, help_text='Device push notification token for mobile')),
                ('device_type', models.CharField(blank=True, choices=[('ios', 'iOS'), ('android', 'Android'), ('web', 'Web')], max_length=10, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('user', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='notification_preferences', to='auth.user')),
            ],
            options={
                'verbose_name': 'Notification Preference',
                'verbose_name_plural': 'Notification Preferences',
            },
        ),
    ]
