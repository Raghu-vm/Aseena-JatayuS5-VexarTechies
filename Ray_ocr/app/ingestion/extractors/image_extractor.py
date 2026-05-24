from __future__ import annotations

from app.services.ocr_service import OCRService


async def extract_image_text(
    image_path: str,
    ocr_service: OCRService,
    preprocess: bool = True,
) -> str:
    return ocr_service.extract_text(image_path, preprocess=preprocess)
