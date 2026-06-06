from django.core.management.base import BaseCommand
from django.utils import timezone
from apps.community.models import Post, Comment


class Command(BaseCommand):
    help = 'Delete expired posts and comments that haven\'t been saved'

    def handle(self, *args, **options):
        """Clean up expired messages."""
        now = timezone.now()
        
        # Clean up expired posts
        expired_posts = Post.objects.filter(
            expires_at__lt=now,
            is_saved=False,
            is_deleted=False
        )
        
        posts_deleted = expired_posts.count()
        if posts_deleted > 0:
            # Soft delete expired posts
            expired_posts.update(is_deleted=True)
            self.stdout.write(
                self.style.SUCCESS(
                    f'Soft deleted {posts_deleted} expired posts'
                )
            )
        
        # Clean up expired comments
        expired_comments = Comment.objects.filter(
            expires_at__lt=now,
            is_saved=False,
            is_deleted=False
        )
        
        comments_deleted = expired_comments.count()
        if comments_deleted > 0:
            # Soft delete expired comments
            expired_comments.update(is_deleted=True)
            self.stdout.write(
                self.style.SUCCESS(
                    f'Soft deleted {comments_deleted} expired comments'
                )
            )
        
        if posts_deleted == 0 and comments_deleted == 0:
            self.stdout.write(
                self.style.SUCCESS('No expired messages to clean up')
            )
        else:
            total_deleted = posts_deleted + comments_deleted
            self.stdout.write(
                self.style.SUCCESS(
                    f'Total messages cleaned up: {total_deleted}'
                )
            )
