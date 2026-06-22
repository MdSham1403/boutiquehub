"""
Simple slug generation - no external dependency needed for this.
"""
import re
import unicodedata


def slugify(text: str) -> str:
    text = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode("ascii")
    text = re.sub(r"[^\w\s-]", "", text).strip().lower()
    return re.sub(r"[-\s]+", "-", text)


def unique_slug(base_text: str, exists_check) -> str:
    """
    Generate a slug from base_text, appending -2, -3, etc. if it collides.
    exists_check: callable(slug) -> bool, returns True if that slug is taken.
    """
    base = slugify(base_text)
    slug = base
    counter = 2
    while exists_check(slug):
        slug = f"{base}-{counter}"
        counter += 1
    return slug
