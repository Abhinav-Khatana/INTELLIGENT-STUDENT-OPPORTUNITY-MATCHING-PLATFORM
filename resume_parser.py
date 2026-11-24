"""Extract simple profile data from a resume PDF: skills + CGPA.

We don't try to be clever. We:
  1. Extract all text from the PDF.
  2. Look for each skill in the catalogue as a whole word.
  3. Search for CGPA / GPA patterns like '8.5/10', 'CGPA: 8.5', 'GPA 8.4'.

Returns {"skills": [...], "cgpa": float | None}.
"""
import re
from io import BytesIO

try:
    from pypdf import PdfReader
except ImportError:              # pragma: no cover
    PdfReader = None


def _extract_text(pdf_bytes: bytes) -> str:
    if PdfReader is None:
        raise RuntimeError("pypdf is not installed — run `pip install pypdf`")
    reader = PdfReader(BytesIO(pdf_bytes))
    parts = []
    for page in reader.pages:
        try:
            parts.append(page.extract_text() or "")
        except Exception:
            continue
    return "\n".join(parts)


def _find_skills(text: str, catalogue: list[str]) -> list[str]:
    lowered = text.lower()
    found = []
    for skill in catalogue:
        # whole-word match, allowing for things like "C++" (escape regex chars)
        pattern = r"(?<![A-Za-z0-9])" + re.escape(skill.lower()) + r"(?![A-Za-z0-9])"
        if re.search(pattern, lowered):
            found.append(skill)
    return found


# patterns we try, in order
_CGPA_PATTERNS = [
    r"cgpa[^\d]{0,6}(\d{1,2}(?:\.\d{1,2})?)",
    r"gpa[^\d]{0,6}(\d{1,2}(?:\.\d{1,2})?)",
    r"(\d{1,2}\.\d{1,2})\s*/\s*10",
    r"(\d{1,2}\.\d{1,2})\s*cgpa",
]


def _find_cgpa(text: str):
    low = text.lower()
    for pat in _CGPA_PATTERNS:
        m = re.search(pat, low)
        if not m:
            continue
        try:
            val = float(m.group(1))
        except (TypeError, ValueError):
            continue
        if 0.0 <= val <= 10.0:
            return round(val, 2)
    return None


def extract_profile(pdf_bytes: bytes, skill_catalogue: list[str]) -> dict:
    text = _extract_text(pdf_bytes)
    return {
        "skills": _find_skills(text, skill_catalogue),
        "cgpa":   _find_cgpa(text),
        "chars_extracted": len(text),
    }