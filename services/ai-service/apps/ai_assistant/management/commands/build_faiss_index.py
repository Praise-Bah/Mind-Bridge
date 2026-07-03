"""Management command to build/rebuild FAISS indexes for the RAG pipeline."""
from django.core.management.base import BaseCommand

from apps.ai_assistant.rag.index import build_index
from apps.ai_assistant.rag.retriever import RAGRetriever


class Command(BaseCommand):
    help = 'Build or rebuild FAISS vector indexes for the RAG knowledge base'

    def add_arguments(self, parser):
        parser.add_argument(
            '--index',
            type=str,
            default='all',
            choices=['all', 'mental_health', 'campus'],
            help='Which index to build (default: all)',
        )

    def handle(self, *args, **options):
        index_choice = options['index']

        indexes_to_build = []
        if index_choice in ('all', 'mental_health'):
            indexes_to_build.append(('mental_health', 'mental_health'))
        if index_choice in ('all', 'campus'):
            indexes_to_build.append(('campus', 'campus'))

        for kb_subdir, index_name in indexes_to_build:
            self.stdout.write(f"\nBuilding index: {index_name}")
            self.stdout.write(f"  Knowledge base: data/knowledge_base/{kb_subdir}/")
            try:
                index, chunks = build_index(
                    kb_subdirectory=kb_subdir,
                    index_name=index_name,
                )
                self.stdout.write(self.style.SUCCESS(
                    f"  Built {index_name} index with {index.ntotal} vectors "
                    f"from {len(chunks)} chunks"
                ))
            except FileNotFoundError as e:
                self.stdout.write(self.style.WARNING(f"  Skipped: {e}"))
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"  Failed: {e}"))

        # Reset the retriever singleton so it picks up new indexes
        RAGRetriever.reset()
        self.stdout.write(self.style.SUCCESS("\nDone. RAG retriever cache cleared."))
