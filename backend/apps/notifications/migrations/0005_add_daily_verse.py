from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('notifications', '0004_add_db_indexes'),
    ]

    operations = [
        migrations.AddField(
            model_name='notificationpreference',
            name='push_daily_verse',
            field=models.BooleanField(default=True),
        ),
        migrations.AlterField(
            model_name='notification',
            name='notification_type',
            field=models.CharField(
                choices=[
                    ('message', 'New Message'),
                    ('booking', 'Booking Request'),
                    ('booking_confirmed', 'Booking Confirmed'),
                    ('reminder', 'Session Reminder'),
                    ('reaction', 'Post Reaction'),
                    ('comment', 'New Comment'),
                    ('mention', 'Mention'),
                    ('professional', 'Professional Update'),
                    ('follower', 'New Follower'),
                    ('checkin', 'Check-in Reminder'),
                    ('ai_summary', 'AI Summary'),
                    ('system', 'System'),
                    ('group_approved', 'Group Approved'),
                    ('group_rejected', 'Group Rejected'),
                    ('group_review_required', 'Group Review Required'),
                    ('daily_verse', 'Daily Biblical Verse'),
                ],
                db_index=True,
                max_length=30,
            ),
        ),
    ]
