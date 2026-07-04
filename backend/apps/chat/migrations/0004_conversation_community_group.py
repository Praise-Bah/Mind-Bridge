from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('chat', '0003_add_db_indexes'),
        ('community', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='conversation',
            name='community_group',
            field=models.OneToOneField(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name='conversation',
                to='community.communitygroup',
            ),
        ),
    ]
