from __future__ import annotations

from typing import Iterable, List

import cv2
import numpy as np
from paddleocr import PaddleOCR


class OCRService:
    def __init__(self) -> None:
        self.ocr = PaddleOCR(
            use_angle_cls=True,
            lang="en",
            use_gpu=False,
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


def _join_ocr_lines(result: Iterable) -> str:
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
