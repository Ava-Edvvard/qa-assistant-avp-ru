import json
import logging
import time
import threading
from typing import List, Optional
from openai import OpenAI
from app.core.config import settings
from app.models.schemas import Requirement, ClarifyingQuestion, TestScenario, UserAnswer

logger = logging.getLogger("app.services.llm_service")

class RateLimiter:
    def __init__(self, max_calls: int = 3, period: float = 60.0):
        self.max_calls = max_calls
        self.period = period
        self.calls = []
        self.lock = threading.Lock()

    def wait_if_needed(self):
        with self.lock:
            now = time.time()
            # Keep only timestamps from the last 60 seconds
            self.calls = [t for t in self.calls if now - t < self.period]
            
            if len(self.calls) >= self.max_calls:
                oldest_call = self.calls[0]
                sleep_time = self.period - (now - oldest_call)
                if sleep_time > 0:
                    logger.warning(f"Rate limit reached (3 calls/min). Delaying request, sleeping for {sleep_time:.2f} seconds...")
                    time.sleep(sleep_time)
                # Recalculate now after sleeping
                now = time.time()
                self.calls = [t for t in self.calls if now - t < self.period]
            
            self.calls.append(now)


class LLMService:
    def __init__(self):
        self.api_key = settings.OPENAI_API_KEY
        self.model = settings.OPENAI_MODEL
        
        # Initialize OpenAI client if valid key is provided
        if self.api_key and self.api_key != "mock-key-replace-with-your-real-key":
            self.client = OpenAI(api_key=self.api_key)
            self.is_mock = False
        else:
            self.client = None
            self.is_mock = True
            logger.warning("Using Mock LLM responses. Configure OPENAI_API_KEY in .env to use real OpenAI API.")
            
        self.rate_limiter = RateLimiter(max_calls=3, period=60.0)


    def parse_requirements(self, text: str, additional_info: Optional[str] = None) -> List[Requirement]:
        """
        Parses raw requirement text into a list of structured requirements (RQ-01, RQ-02...).
        """
        if self.is_mock:
            return self._mock_parse_requirements(text, additional_info)
            
        self.rate_limiter.wait_if_needed()

            
        prompt = f"""
        Analyze the following user requirements and optional additional info.
        Extract a list of distinct, atomic requirements. 
        Format them as a JSON list where each item has "id" (starts with RQ-01, RQ-02...) and "description" (in Russian).
        
        Raw Requirements Text:
        {text}
        
        Additional Info:
        {additional_info or "None"}
        
        Return ONLY valid JSON array. No markdown formatting.
        """
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.2
            )
            content = response.choices[0].message.content.strip()
            # Remove potential markdown wrappers
            if content.startswith("```json"):
                content = content[7:-3].strip()
            elif content.startswith("```"):
                content = content[3:-3].strip()
            
            data = json.loads(content)
            return [Requirement(id=item["id"], description=item["description"], cases_count=0) for item in data]
        except Exception as e:
            logger.error(f"Error calling OpenAI parse_requirements: {e}. Falling back to mock.")
            return self._mock_parse_requirements(text, additional_info)

    def generate_questions(self, requirements: List[Requirement]) -> List[ClarifyingQuestion]:
        """
        Generates clarifying questions for requirements if ambiguities are found.
        """
        if self.is_mock:
            return self._mock_generate_questions(requirements)

        self.rate_limiter.wait_if_needed()


        req_list_str = "\n".join([f"- {r.id}: {r.description}" for r in requirements])
        prompt = f"""
        Act as an expert QA engineer. Review the following requirements and find any potential ambiguities, missing details, or edge cases.
        Generate 1 to 3 clarifying questions.
        Return ONLY a JSON list where each item has "id" (starts with Q-01, Q-02...), "requirement_id" (the matching RQ-## ID), and "question" (in Russian).
        
        Requirements list:
        {req_list_str}
        
        Return ONLY valid JSON array. No markdown formatting.
        """
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3
            )
            content = response.choices[0].message.content.strip()
            if content.startswith("```json"):
                content = content[7:-3].strip()
            elif content.startswith("```"):
                content = content[3:-3].strip()
            
            data = json.loads(content)
            return [ClarifyingQuestion(id=item["id"], requirement_id=item["requirement_id"], question=item["question"]) for item in data]
        except Exception as e:
            logger.error(f"Error calling OpenAI generate_questions: {e}. Falling back to mock.")
            return self._mock_generate_questions(requirements)

    def generate_scenarios(self, requirements: List[Requirement], answers: List[UserAnswer]) -> List[TestScenario]:
        """
        Generates structured test scenarios based on requirements and clarifying answers.
        """
        if self.is_mock:
            return self._mock_generate_scenarios(requirements, answers)

        self.rate_limiter.wait_if_needed()


        req_str = "\n".join([f"- {r.id}: {r.description}" for r in requirements])
        ans_str = "\n".join([f"- Вопрос: {a.question} | Ответ: {a.answer}" for a in answers])
        
        prompt = f"""
        Act as an expert QA Analyst. Design detailed test scenarios for the following requirements, taking into account the answers to the clarifying questions.
        
        Requirements:
        {req_str}
        
        Clarifying Answers:
        {ans_str}
        
        Format each test scenario as a JSON object with:
        - "id": TC-001, TC-002...
        - "name": Brief descriptive name of the test scenario (in Russian)
        - "priority": П1 (critical), П2 (important), or П3 (low)
        - "preconditions": list of preconditions (in Russian)
        - "steps": list of steps (in Russian)
        - "expected_results": list of expected results corresponding to steps (in Russian)
        - "coverage": list of requirement IDs covered (e.g. ["RQ-01"])
        
        Return ONLY a JSON list containing these objects. No markdown formatting.
        """
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.2
            )
            content = response.choices[0].message.content.strip()
            if content.startswith("```json"):
                content = content[7:-3].strip()
            elif content.startswith("```"):
                content = content[3:-3].strip()
            
            data = json.loads(content)
            return [
                TestScenario(
                    id=item["id"],
                    name=item["name"],
                    priority=item["priority"],
                    preconditions=item["preconditions"],
                    steps=item["steps"],
                    expected_results=item["expected_results"],
                    coverage=item["coverage"]
                ) for item in data
            ]
        except Exception as e:
            logger.error(f"Error calling OpenAI generate_scenarios: {e}. Falling back to mock.")
            return self._mock_generate_scenarios(requirements, answers)

    def compare_scenarios(self, old_text: str, new_cases: List[TestScenario]) -> str:
        """
        Compares old test cases text with newly generated test cases and returns summary of changes.
        """
        if self.is_mock:
            return self._mock_compare_scenarios(old_text, new_cases)

        self.rate_limiter.wait_if_needed()


        new_cases_str = ""
        for tc in new_cases:
            new_cases_str += f"{tc.id}: {tc.name} - {tc.priority}\n"
            new_cases_str += "Предусловия:\n" + "\n".join([f"- {p}" for p in tc.preconditions]) + "\n"
            new_cases_str += "Шаги:\n" + "\n".join([f"{i+1}. {s}" for i, s in enumerate(tc.steps)]) + "\n"
            new_cases_str += "Ожидаемый результат:\n" + "\n".join([f"{i+1}. {r}" for i, r in enumerate(tc.expected_results)]) + "\n"
            new_cases_str += "Покрытие:\n" + "\n".join([f"- {c}" for c in tc.coverage]) + "\n\n"

        prompt = f"""
        Act as a QA lead. Analyze and compare the old test scenarios text against the newly generated/edited test scenarios.
        Identify which tests were added, which were modified (steps, names, or priorities changed), and which were removed.
        Provide a detailed change report in Russian. Focus on clarity.
        
        Old Scenarios:
        {old_text}
        
        New Scenarios:
        {new_cases_str}
        
        Return your response in markdown format.
        """
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.2
            )
            return response.choices[0].message.content.strip()
        except Exception as e:
            logger.error(f"Error calling OpenAI compare_scenarios: {e}. Falling back to mock.")
            return self._mock_compare_scenarios(old_text, new_cases)

    # --- MOCK FALLBACKS ---

    def _mock_parse_requirements(self, text: str, additional_info: Optional[str] = None) -> List[Requirement]:
        lines = [line.strip() for line in text.split("\n") if line.strip() and not line.strip().startswith("#")]
        if not lines:
            lines = ["Тестовое требование открытие главной страницы", "Тестовое требование открытие формы авторизации"]
            
        reqs = []
        for i, line in enumerate(lines[:10]):
            reqs.append(Requirement(
                id=f"RQ-0{i+1}" if i < 9 else f"RQ-{i+1}",
                description=line[:120],
                cases_count=0
            ))
        return reqs

    def _mock_generate_questions(self, requirements: List[Requirement]) -> List[ClarifyingQuestion]:
        questions = []
        for i, req in enumerate(requirements[:3]):
            questions.append(ClarifyingQuestion(
                id=f"Q-0{i+1}",
                requirement_id=req.id,
                question=f"Уточните детали для требования [{req.id}] '{req.description[:30]}...'. Каков ожидаемый результат в негативном сценарии?"
            ))
        return questions

    def _mock_generate_scenarios(self, requirements: List[Requirement], answers: List[UserAnswer]) -> List[TestScenario]:
        scenarios = []
        # Generate scenarios based on the requirements
        for i, req in enumerate(requirements):
            scenarios.append(TestScenario(
                id=f"TC-00{i+1}" if i < 9 else f"TC-0{i+1}",
                name=f"Тест-сценарий для проверки требования: {req.description[:50]}",
                priority="П1" if i % 3 == 0 else "П2",
                preconditions=[
                    "Пользователь имеет доступ к стенду тестирования",
                    "Браузер обновлен до актуальной версии"
                ],
                steps=[
                    "Открыть тестовую страницу приложения в браузере",
                    f"Выполнить действия, соответствующие сценарию '{req.description[:30]}'",
                    "Проверить соответствие интерфейса макету"
                ],
                expected_results=[
                    "Приложение успешно загрузилось, ошибок в консоли нет",
                    "Система отработала корректно в соответствии с вводом",
                    "Элементы интерфейса отобразились правильно и доступны для взаимодействия"
                ],
                coverage=[req.id]
            ))
            
        # Add an integration test case covering multiple requirements
        if len(requirements) >= 2:
            scenarios.append(TestScenario(
                id=f"TC-00{len(requirements)+1}",
                name="Сквозной тест-сценарий (Интеграционный)",
                priority="П1",
                preconditions=["Пользователь авторизован в системе"],
                steps=["Выполнить операцию №1", "Выполнить операцию №2"],
                expected_results=["Операция 1 завершена", "Операция 2 завершена"],
                coverage=[requirements[0].id, requirements[1].id]
            ))
            
        return scenarios

    def _mock_compare_scenarios(self, old_text: str, new_cases: List[TestScenario]) -> str:
        added_tcs = [tc.id for tc in new_cases[1:]]
        modified_tcs = [new_cases[0].id] if new_cases else []
        
        markdown_diff = f"""### Сводка изменений (Mock-анализ)

1. **Добавленные тест-сценарии**:
   * {', '.join(added_tcs) or 'Нет новых сценариев'} (сгенерированы на основе уточненных требований).

2. **Измененные тест-сценарии**:
   * {', '.join(modified_tcs) or 'Нет измененных сценариев'} (скорректированы шаги и условия согласно новым требованиям).

3. **Удаленные тест-сценарии**:
   * Старые сценарии, не соответствующие новой матрице трассируемости, были исключены.
"""
        return markdown_diff

llm_service = LLMService()
