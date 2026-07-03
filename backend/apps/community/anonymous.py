"""
Deterministic anonymous pseudonym generator.

Produces unique-looking names like "Brave Owl" or "Calm River" that are
consistent per (user_id, group_id) pair so the same user keeps the same
pseudonym within a group, but gets a different one in another group.
"""
import hashlib

ADJECTIVES = [
    'Brave', 'Calm', 'Gentle', 'Kind', 'Quiet', 'Wise', 'Bold', 'Bright',
    'Serene', 'Warm', 'Swift', 'Noble', 'Tender', 'Steady', 'Patient',
    'Resilient', 'Hopeful', 'Curious', 'Mindful', 'Peaceful', 'Radiant',
    'Humble', 'Earnest', 'Lively', 'Mellow', 'Silent', 'Vivid', 'Daring',
    'Grateful', 'Spirited', 'Tranquil', 'Vibrant',
]

NOUNS = [
    'Owl', 'River', 'Star', 'Leaf', 'Moon', 'Cloud', 'Breeze', 'Stone',
    'Fern', 'Wave', 'Pebble', 'Bloom', 'Meadow', 'Sparrow', 'Flame',
    'Harbor', 'Echo', 'Dawn', 'Ridge', 'Aurora', 'Cedar', 'Willow',
    'Coral', 'Dune', 'Frost', 'Lotus', 'Maple', 'Robin', 'Sage', 'Tide',
    'Ember', 'Horizon',
]


def generate_anonymous_name(user_id: str, group_id: str = '') -> str:
    """Return a deterministic pseudonym for a user within a context (group).

    The same (user_id, group_id) always produces the same name.
    Different groups produce different names for the same user.
    """
    seed = hashlib.sha256(f'{user_id}:{group_id}'.encode()).hexdigest()
    adj_idx = int(seed[:8], 16) % len(ADJECTIVES)
    noun_idx = int(seed[8:16], 16) % len(NOUNS)
    return f'{ADJECTIVES[adj_idx]} {NOUNS[noun_idx]}'
