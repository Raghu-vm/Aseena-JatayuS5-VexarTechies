import argparse
import os
import shutil
from typing import List

import cv2
import fitz
import numpy as np
from paddleocr import PaddleOCR


class OCRService:
    def __init__(self, use_gpu: bool = False) -> None:
        self.ocr = PaddleOCR(
            use_angle_cls=True,
            lang="en",
            use_gpu=use_gpu,
            show_log=False,
            det_db_box_thresh=0.5,
            rec_batch_num=6,
        )

    def _preprocess_image(self, image_path: str) -> np.ndarray:
        image = cv2.imread(image_path)
        if image is None:
            raise FileNotFoundError(f"Image not found or unreadable: {image_path}")

        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        denoised = cv2.fastNlMeansDenoising(gray)
        thresh = cv2.threshold(
            denoised,
            0,
            255,
            cv2.THRESH_BINARY + cv2.THRESH_OTSU,
        )[1]
        return thresh

    def extract_text(self, image_path: str, preprocess: bool = True) -> str:
        input_image: str | np.ndarray = image_path
        if preprocess:
            input_image = self._preprocess_image(image_path)

        result = self.ocr.ocr(input_image)
        return _join_ocr_lines(result)


def _join_ocr_lines(result) -> str:
    extracted_lines: List[str] = []

    if not result:
        return ""

    for page in result:
        if not page:
            continue
        for line in page:
            if not line or len(line) < 2:
                continue
            text = line[1][0]
            extracted_lines.append(text)

    return "\n".join(extracted_lines)


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


def extract_pdf_text(
    pdf_path: str,
    ocr_service: OCRService,
    temp_dir: str,
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


def _parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="OCR images or PDFs to a text file."
    )
    parser.add_argument("input", help="Path to an image or PDF")
    parser.add_argument(
        "-o",
        "--output",
        default="ocr_output.txt",
        help="Output text file path",
    )
    parser.add_argument(
        "--no-preprocess",
        action="store_true",
        help="Disable image preprocessing",
    )
    parser.add_argument(
        "--min-chars",
        type=int,
        default=50,
        help="Minimum native PDF chars before OCR fallback",
    )
    parser.add_argument(
        "--temp-dir",
        default=".ocr_temp",
        help="Temp directory for PDF page images",
    )
    parser.add_argument(
        "--gpu",
        action="store_true",
        help="Enable GPU in PaddleOCR",
    )
    return parser.parse_args()


def main() -> int:
    args = _parse_args()
    input_path = args.input

    if not os.path.isfile(input_path):
        print(f"Input not found: {input_path}")
        return 1

    ocr_service = OCRService(use_gpu=args.gpu)
    preprocess = not args.no_preprocess

    ext = os.path.splitext(input_path)[1].lower()
    if ext == ".pdf":
        text = extract_pdf_text(
            input_path,
            ocr_service,
            temp_dir=args.temp_dir,
            min_chars=args.min_chars,
            preprocess=preprocess,
        )
    else:
        text = ocr_service.extract_text(input_path, preprocess=preprocess)

    with open(args.output, "w", encoding="utf-8") as handle:
        handle.write(text)

    if ext == ".pdf" and os.path.isdir(args.temp_dir):
        shutil.rmtree(args.temp_dir, ignore_errors=True)

    print(f"Saved OCR text to: {args.output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
