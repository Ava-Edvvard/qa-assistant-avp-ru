import logging
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from typing import List, Optional
from app.models.schemas import RequirementsResponse, Requirement, LLMConfig
from app.services.parser import parser_service
from app.services.llm_service import llm_service

router = APIRouter()
logger = logging.getLogger("app.api.endpoints.design")

@router.post("/parse-requirements", response_model=RequirementsResponse)
async def parse_requirements(
    requirements_text: str = Form(...),
    additional_info: Optional[str] = Form(None),
    files: Optional[List[UploadFile]] = File(None),
    llm_provider: Optional[str] = Form(None),
    llm_api_key: Optional[str] = Form(None),
    llm_base_url: Optional[str] = Form(None),
    llm_model: Optional[str] = Form(None)
):
    """
    Stage 1: Receives raw requirements text, additional info, and files (Excel or images).
    Parses them and extracts a list of requirements.
    """
    combined_text = requirements_text
    
    # Process files if they are provided
    if files:
        file_descriptions = []
        for file in files:
            file_bytes = await file.read()
            filename = file.filename or "unknown"
            
            if filename.endswith(('.xlsx', '.xls', '.csv')):
                parsed_excel = parser_service.parse_excel(file_bytes)
                file_descriptions.append(f"\n[Контент таблицы {filename}]:\n{parsed_excel}")
            elif filename.endswith(('.png', '.jpg', '.jpeg', '.webp')):
                parsed_image = parser_service.parse_image(file_bytes, filename)
                file_descriptions.append(f"\n{parsed_image}")
            else:
                file_descriptions.append(f"\n[Прикрепленный файл {filename} (размер: {len(file_bytes)} байт)]")
        
        # Merge parsed file contents to requirements context
        if file_descriptions:
            combined_text += "\n\n--- Дополнительный контекст из прикрепленных файлов ---" + "\n".join(file_descriptions)

    # Call LLM Service to structure the requirements
    llm_config = None
    if llm_api_key and llm_api_key.strip():
        llm_config = LLMConfig(
            provider=llm_provider or "openai",
            api_key=llm_api_key,
            base_url=llm_base_url,
            model=llm_model
        )
        
    client, model, is_mock = llm_service._get_client_and_model(llm_config)
    if is_mock:
        requirements = llm_service._mock_parse_requirements(combined_text, additional_info)
        return RequirementsResponse(requirements=requirements, is_mock=True)

    try:
        requirements = llm_service.parse_requirements(combined_text, additional_info, llm_config)
        return RequirementsResponse(requirements=requirements, is_mock=False)
    except Exception as e:
        logger.error(f"Failed to parse requirements via LLM: {e}. Falling back to mock.")
        requirements = llm_service._mock_parse_requirements(combined_text, additional_info)
        return RequirementsResponse(requirements=requirements, is_mock=True, error_message=str(e))
