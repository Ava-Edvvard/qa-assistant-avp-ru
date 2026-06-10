import logging
from fastapi import APIRouter, HTTPException
from openai import OpenAI
from app.models.schemas import (
    QuestionsGenerationRequest, QuestionsResponse,
    ScenariosGenerationRequest, ScenariosResponse,
    CompareRequest, CompareResponse,
    ModelsRequest, ModelsResponse
)
from app.services.llm_service import llm_service

router = APIRouter()
logger = logging.getLogger("app.api.endpoints.llm")

@router.get("/info")
async def get_llm_info():
    """
    Returns default LLM configuration of the server.
    """
    return {
        "provider": llm_service.provider,
        "model": llm_service.model,
        "is_mock": llm_service.is_mock
    }

@router.post("/models", response_model=ModelsResponse)
async def list_models(payload: ModelsRequest):
    """
    Queries the dynamic LLM provider for available models.
    Returns empty list if the provider does not support model listing (e.g. 404).
    """
    try:
        if payload.provider == "gemini":
            base_url = "https://generativelanguage.googleapis.com/v1beta/openai/"
        elif payload.provider == "openai":
            base_url = None
        else: # custom
            base_url = payload.base_url
            
        client = OpenAI(api_key=payload.api_key, base_url=base_url)
        response = client.models.list()
        model_ids = [m.id for m in response.data]
        return ModelsResponse(models=model_ids)
    except Exception as e:
        err_str = str(e).lower()
        if "404" in err_str or "not found" in err_str or "not implemented" in err_str:
            return ModelsResponse(models=[])
        raise HTTPException(status_code=400, detail=f"Ошибка получения списка моделей: {str(e)}")

@router.post("/generate-questions", response_model=QuestionsResponse)
async def generate_questions(payload: QuestionsGenerationRequest):
    """
    Stage 3: Takes requirements list and generates a list of clarifying questions using LLM.
    """
    client, model, is_mock = llm_service._get_client_and_model(payload.llm_config)
    if is_mock:
        questions = llm_service._mock_generate_questions(payload.requirements)
        return QuestionsResponse(questions=questions, is_mock=True)

    try:
        questions = llm_service.generate_questions(payload.requirements, payload.llm_config)
        return QuestionsResponse(questions=questions, is_mock=False)
    except Exception as e:
        logger.error(f"Failed to generate questions: {e}. Falling back to mock.")
        questions = llm_service._mock_generate_questions(payload.requirements)
        return QuestionsResponse(questions=questions, is_mock=True, error_message=str(e))

@router.post("/generate-scenarios", response_model=ScenariosResponse)
async def generate_scenarios(payload: ScenariosGenerationRequest):
    """
    Stage 4: Takes requirements list and answers, then generates structured test scenarios.
    """
    client, model, is_mock = llm_service._get_client_and_model(payload.llm_config)
    if is_mock:
        scenarios = llm_service._mock_generate_scenarios(payload.requirements, payload.answers)
        return ScenariosResponse(scenarios=scenarios, is_mock=True)

    try:
        scenarios = llm_service.generate_scenarios(payload.requirements, payload.answers, payload.llm_config)
        return ScenariosResponse(scenarios=scenarios, is_mock=False)
    except Exception as e:
        logger.error(f"Failed to generate scenarios: {e}. Falling back to mock.")
        scenarios = llm_service._mock_generate_scenarios(payload.requirements, payload.answers)
        return ScenariosResponse(scenarios=scenarios, is_mock=True, error_message=str(e))

@router.post("/compare-scenarios", response_model=CompareResponse)
async def compare_scenarios(payload: CompareRequest):
    """
    Stage 5 (Existing Design): Compares user's original/old test scenarios with the new ones.
    """
    client, model, is_mock = llm_service._get_client_and_model(payload.llm_config)
    
    # helper for computing comparison lists
    def compute_compare_ids():
        added_ids = []
        modified_ids = []
        for tc in payload.new_scenarios:
            if "TC-" in tc.id:
                if int(tc.id.split("-")[-1]) % 2 == 0:
                    modified_ids.append(tc.id)
                else:
                    added_ids.append(tc.id)
        return added_ids, modified_ids

    if is_mock:
        summary = llm_service._mock_compare_scenarios(payload.old_scenarios_text, payload.new_scenarios)
        added_ids, modified_ids = compute_compare_ids()
        return CompareResponse(
            changes_summary=summary,
            added=added_ids,
            removed=[],
            modified=modified_ids,
            is_mock=True
        )

    try:
        summary = llm_service.compare_scenarios(payload.old_scenarios_text, payload.new_scenarios, payload.llm_config)
        added_ids, modified_ids = compute_compare_ids()
        return CompareResponse(
            changes_summary=summary,
            added=added_ids,
            removed=[],
            modified=modified_ids,
            is_mock=False
        )
    except Exception as e:
        logger.error(f"Failed to compare scenarios: {e}. Falling back to mock.")
        summary = llm_service._mock_compare_scenarios(payload.old_scenarios_text, payload.new_scenarios)
        added_ids, modified_ids = compute_compare_ids()
        return CompareResponse(
            changes_summary=summary,
            added=[],
            removed=[],
            modified=[],
            is_mock=True,
            error_message=str(e)
        )
