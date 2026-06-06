from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('videos', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='video',
            name='thumbnail',
            field=models.URLField(blank=True, default=''),
        ),
    ]
