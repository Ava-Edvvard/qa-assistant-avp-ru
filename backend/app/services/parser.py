import io
import logging

import pandas as pd

logger = logging.getLogger("app.services.parser")

class DocumentParser:
    @staticmethod
    def parse_excel(file_bytes: bytes) -> str:
        """
        Parses Excel files and extracts text from all cells.
        """
        try:
            # Read Excel bytes into a Pandas DataFrame
            excel_file = io.BytesIO(file_bytes)
            # Read all sheets
            xls = pd.ExcelFile(excel_file)
            sheets_text = []
            
            for sheet_name in xls.sheet_names:
                df = pd.read_excel(xls, sheet_name=sheet_name)
                # Drop fully empty rows/columns
                df.dropna(how='all', inplace=True)
                
                # Convert DataFrame to a readable text structure
                sheet_str = f"--- Лист: {sheet_name} ---\n"
                sheet_str += df.to_string(index=False)
                sheets_text.append(sheet_str)
                
            return "\n\n".join(sheets_text)
        except Exception as e:
            logger.error(f"Error parsing Excel file: {e}")
            return f"[Ошибка парсинга Excel-файла: {e!s}]"

    @staticmethod
    def parse_image(file_bytes: bytes, filename: str) -> str:
        """
        Stubs image content processing. Since OCR requires local system libraries
        (like Tesseract), we return a descriptive placeholder.
        """
        # If real OpenAI vision is configured, you would send image bytes directly.
        # Here we return a description of the attachment for the prompt.
        logger.info(f"Received image: {filename}")
        return f"[Прикрепленное изображение макета/интерфейса: {filename} (размер: {len(file_bytes)} байт)]"

parser_service = DocumentParser()
