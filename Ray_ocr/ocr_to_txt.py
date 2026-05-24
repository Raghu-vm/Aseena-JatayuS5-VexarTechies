import os
import sys

from app.services.ocr_service import OCRService


def main() -> int:
    if len(sys.argv) < 2:
        print("Usage: python ocr_to_txt.py <image_path> [output_txt]")
        return 1

    image_path = sys.argv[1]
    if not os.path.isfile(image_path):
        print(f"Image not found: {image_path}")
        return 1

    output_path = sys.argv[2] if len(sys.argv) > 2 else "ocr_output.txt"

    ocr_service = OCRService()
    text = ocr_service.extract_text(image_path, preprocess=True)

    with open(output_path, "w", encoding="utf-8") as handle:
        handle.write(text)

    print(f"Saved OCR text to: {output_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
