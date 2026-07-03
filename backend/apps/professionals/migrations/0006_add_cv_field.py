from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('professionals', '0005_add_db_indexes'),
    ]

    operations = [
        migrations.AddField(
            model_name='professionalprofile',
            name='cv',
            field=models.FileField(
                blank=True,
                help_text='Private CV — visible only to the professional and admins.',
                null=True,
                upload_to='professional_cvs/',
            ),
        ),
    ]
