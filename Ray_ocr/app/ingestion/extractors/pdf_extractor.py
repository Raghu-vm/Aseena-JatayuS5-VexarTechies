from __future__ import annotations

import os
from typing import List

import fitz

from app.services.ocr_service import OCRService


def extract_native_text(pdf_path: str) -> str:
    doc = fitz.open(pdf_path)
    try:
        text_parts: List[str] = []
        for page in doc:
            text_parts.append(page.get_text())
        return "".join(text_parts)
    finally:
        doc.close()


def pdf_to_images(pdf_path: str, output_dir: str, dpi: int = 300) -> List[str]:
    os.makedirs(output_dir, exist_ok=True)
    doc = fitz.open(pdf_path)

    image_paths: List[str] = []
    try:
        for i, page in enumerate(doc):
            pix = page.get_pixmap(dpi=dpi)
            path = os.path.join(output_dir, f"page_{i}.png")
            pix.save(path)
            image_paths.append(path)
    finally:
        doc.close()

    return image_paths


async def extract_pdf_text(
    pdf_path: str,
    ocr_service: OCRService,
    temp_dir: str = "app/temp",
    min_chars: int = 50,
    preprocess: bool = True,
) -> str:
    text = extract_native_text(pdf_path)
    if len(text.strip()) >= min_chars:
        return text

    images = pdf_to_images(pdf_path, temp_dir)

    full_text_parts: List[str] = []
    for image_path in images:
        full_text_parts.append(
            ocr_service.extract_text(image_path, preprocess=preprocess)
        )

    return "\n".join(full_text_parts)
