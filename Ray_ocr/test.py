import asyncio
import sys

from app.services.ocr_service import OCRService


async def main() -> None:
    image_path = sys.argv[1] if len(sys.argv) > 1 else "sample.png"
    ocr_service = OCRService()
    text = ocr_service.extract_text(image_path, preprocess=True)
    print(text)


if __name__ == "__main__":
    asyncio.run(main())
