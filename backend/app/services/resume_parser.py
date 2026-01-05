"""AI-powered resume parsing service using pyresparser."""
from typing import Dict, Optional
from pathlib import Path
import re
import logging

# Try to import pyresparser - it's optional and may not be installed
try:
    from pyresparser import ResumeParser
    PYRESPARSER_AVAILABLE = True
except ImportError:
    PYRESPARSER_AVAILABLE = False

logger = logging.getLogger(__name__)


class ResumeParserService:
    """Service for parsing resumes using AI/NLP."""

    SUPPORTED_FORMATS = ['.pdf', '.docx', '.doc', '.txt']

    def __init__(self):
        if not PYRESPARSER_AVAILABLE:
            logger.warning(
                "Resume parsing functionality disabled - pyresparser not installed. "
                "Install with: pip install pyresparser spacy && python -m spacy download en_core_web_sm"
            )

    def is_available(self) -> bool:
        """Check if resume parsing is available."""
        return PYRESPARSER_AVAILABLE

    async def parse_resume(self, file_path: str) -> Dict:
        """
        Parse resume and extract structured data using AI.

        Args:
            file_path: Path to resume file

        Returns:
            Dict with extracted data (name, email, phone, skills, etc.)
        """
        if not PYRESPARSER_AVAILABLE:
            return {
                'error': 'Resume parsing not available. Install pyresparser and spaCy.',
                'parsed': False
            }

        try:
            # Validate file format
            file_ext = Path(file_path).suffix.lower()
            if file_ext not in self.SUPPORTED_FORMATS:
                raise ValueError(f"Unsupported format: {file_ext}. Supported: {', '.join(self.SUPPORTED_FORMATS)}")

            # Parse using pyresparser (AI-powered)
            parser = ResumeParser(file_path)
            data = parser.get_extracted_data()

            # Clean and structure data
            cleaned_data = self._clean_parsed_data(data)

            # Try to extract UAE-specific data from text content
            try:
                # Try to read file as text with different encodings
                text_content = ""
                file_ext = Path(file_path).suffix.lower()
                
                if file_ext == '.txt':
                    with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                        text_content = f.read()
                else:
                    # For PDF/DOCX, try to get text from parsed data
                    # pyresparser extracts text internally
                    if data:
                        # Combine all text fields for UAE-specific extraction
                        text_parts = []
                        for key, value in data.items():
                            if isinstance(value, str):
                                text_parts.append(value)
                            elif isinstance(value, list):
                                text_parts.extend([str(v) for v in value])
                        text_content = ' '.join(text_parts)
                
                if text_content:
                    uae_data = self._extract_uae_specific_data(text_content)
                    cleaned_data.update(uae_data)
            except Exception as e:
                logger.warning(f"Could not extract UAE-specific data: {e}")

            return cleaned_data

        except Exception as e:
            logger.error(f"Resume parsing error: {str(e)}")
            return {
                'error': str(e),
                'parsed': False
            }

    def _clean_parsed_data(self, data: Dict) -> Dict:
        """Clean and structure parsed data."""
        if not data:
            return {
                'name': None,
                'email': None,
                'mobile_number': None,
                'skills': [],
                'experience': [],
                'education': [],
                'designation': [],
                'company_names': [],
                'degree': [],
                'college_name': [],
                'total_experience': None,
                'parsed': False,
                'error': 'No data extracted from resume'
            }

        return {
            'name': data.get('name') or None,
            'email': data.get('email') or None,
            'mobile_number': self._clean_phone(data.get('mobile_number', '')),
            'skills': data.get('skills') or [],
            'experience': data.get('experience') or [],
            'education': data.get('education') or [],
            'designation': data.get('designation') or [],
            'company_names': data.get('company_names') or [],
            'degree': data.get('degree') or [],
            'college_name': data.get('college_name') or [],
            'total_experience': self._parse_experience(data.get('total_experience')),
            'parsed': True
        }

    def _clean_phone(self, phone: str) -> Optional[str]:
        """Clean and format phone number for UAE."""
        if not phone:
            return None

        # Remove spaces and special chars
        cleaned = ''.join(filter(str.isdigit, str(phone)))

        # Add UAE country code if missing
        if cleaned and len(cleaned) >= 9:
            if not cleaned.startswith('971'):
                # Assume UAE number if starts with 0
                if cleaned.startswith('0'):
                    cleaned = '971' + cleaned[1:]
                else:
                    cleaned = '971' + cleaned
            return '+' + cleaned

        return phone if phone else None

    def _parse_experience(self, experience) -> Optional[int]:
        """Parse experience value to integer years."""
        if experience is None:
            return None
        if isinstance(experience, int):
            return experience
        if isinstance(experience, float):
            return int(experience)
        if isinstance(experience, str):
            try:
                # Try to extract number from string
                numbers = re.findall(r'\d+', experience)
                if numbers:
                    return int(numbers[0])
            except (ValueError, IndexError):
                pass
        return None

    def _extract_uae_specific_data(self, text: str) -> Dict:
        """Extract UAE-specific information from resume text."""
        data = {}

        # Extract Emirates ID (format: 784-XXXX-XXXXXXX-X)
        eid_pattern = r'784[-\s]?\d{4}[-\s]?\d{7}[-\s]?\d{1}'
        eid_match = re.search(eid_pattern, text)
        if eid_match:
            # Clean the Emirates ID
            eid = eid_match.group(0)
            eid = re.sub(r'[-\s]', '', eid)
            data['emirates_id'] = f"{eid[:3]}-{eid[3:7]}-{eid[7:14]}-{eid[14]}"

        # Extract Visa status keywords
        visa_keywords = [
            'employment visa', 'work permit', 'residence visa',
            'golden visa', 'visit visa', 'tourist visa',
            'freelance visa', 'investor visa'
        ]
        text_lower = text.lower()
        for keyword in visa_keywords:
            if keyword in text_lower:
                # Try to extract surrounding context
                pattern = rf'.{{0,30}}{re.escape(keyword)}.{{0,30}}'
                match = re.search(pattern, text, re.IGNORECASE)
                if match:
                    data['visa_status'] = match.group(0).strip()
                else:
                    data['visa_status'] = keyword.title()
                break

        return data

    def get_supported_formats(self) -> list:
        """Get list of supported file formats."""
        return self.SUPPORTED_FORMATS


# Singleton instance
resume_parser_service = ResumeParserService()
