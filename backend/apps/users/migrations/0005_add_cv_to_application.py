from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0004_usergoal'),
    ]

    operations = [
        migrations.AddField(
            model_name='professionalapplication',
            name='cv',
            field=models.FileField(
                blank=True,
                help_text='Private CV — visible only to the applicant and admins.',
                null=True,
                upload_to='professional_cvs/',
            ),
        ),
    ]
