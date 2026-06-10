import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

// Definitions matching Pydantic schemas
export interface Requirement {
  id: string;
  description: string;
  cases_count: number;
}

export interface ClarifyingQuestion {
  id: string;
  requirement_id: string;
  question: string;
}

export interface UserAnswer {
  question_id: string;
  question: string;
  answer: string;
}

export interface TestScenario {
  id: string;
  name: string;
  priority: string;
  preconditions: string[];
  steps: string[];
  expected_results: string[];
  coverage: string[];
}

export type DesignMode = 'new' | 'existing';

interface DesignContextType {
  mode: DesignMode | null;
  currentStage: number;
  requirements: Requirement[];
  questions: ClarifyingQuestion[];
  answers: UserAnswer[];
  scenarios: TestScenario[];
  comparisonReport: string;
  oldScenariosText: string;
  additionalInfoText: string;
  rawRequirementsText: string;
  loading: boolean;
  error: string | null;
  activeLlmName: string;
  isFallbackMock: boolean;
  fallbackError: string | null;
  
  // LLM Config
  llmProvider: string;
  llmApiKey: string;
  llmBaseUrl: string;
  llmModel: string;
  setLlmProvider: (val: string) => void;
  setLlmApiKey: (val: string) => void;
  setLlmBaseUrl: (val: string) => void;
  setLlmModel: (val: string) => void;
  fetchModels: (provider: string, apiKey: string, baseUrl?: string) => Promise<string[]>;

  // Actions
  startNewDesign: () => void;
  startExistingDesign: () => void;
  setStage: (stage: number) => void;
  prevStage: () => void;
  nextStage: () => void;
  resetSession: () => void;
  
  // Stage 1 Actions
  parseRequirements: (text: string, additionalInfo: string, oldScenarios?: string, files?: File[]) => Promise<void>;
  
  // Stage 2 Actions
  setRequirements: (reqs: Requirement[]) => void;
  addRequirement: (desc: string) => void;
  editRequirement: (id: string, desc: string) => void;
  deleteRequirement: (id: string) => void;
  
  // Stage 3 Actions
  fetchQuestions: () => Promise<void>;
  submitAnswer: (questionId: string, answer: string) => void;
  skipQuestion: (questionId: string) => void;
  updateAnswer: (questionId: string, answer: string) => void;
  resetAnswer: (questionId: string) => void;
  
  // Stage 4 Actions
  generateTestScenarios: () => Promise<void>;
  setScenarios: (scenarios: TestScenario[]) => void;
  addScenario: (scenario: TestScenario) => void;
  editScenario: (id: string, updated: Partial<TestScenario>) => void;
  deleteScenario: (id: string) => void;
  
  // Stage 5 Actions (Existing Design)
  compareTestScenarios: () => Promise<void>;
  
  clearFallbackMock: () => void;
}

const DesignContext = createContext<DesignContextType | undefined>(undefined);

const API_BASE = 'http://127.0.0.1:8000/api';

export const DesignProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState<DesignMode | null>(null);
  const [currentStage, setCurrentStage] = useState<number>(1);
  const [requirements, setRequirementsState] = useState<Requirement[]>([]);
  const [questions, setQuestions] = useState<ClarifyingQuestion[]>([]);
  const [allQuestions, setAllQuestions] = useState<ClarifyingQuestion[]>([]);
  const [answers, setAnswers] = useState<UserAnswer[]>([]);
  const [scenarios, setScenariosState] = useState<TestScenario[]>([]);
  const [comparisonReport, setComparisonReport] = useState<string>('');
  const [oldScenariosText, setOldScenariosText] = useState<string>('');
  const [additionalInfoText, setAdditionalInfoText] = useState<string>('');
  const [rawRequirementsText, setRawRequirementsText] = useState<string>('');
  
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isFallbackMock, setIsFallbackMock] = useState<boolean>(false);
  const [fallbackError, setFallbackError] = useState<string | null>(null);

  interface ServerLlmInfo {
    provider: string;
    model: string;
    is_mock: boolean;
  }
  const [serverLlmInfo, setServerLlmInfo] = useState<ServerLlmInfo | null>(null);

  useEffect(() => {
    axios.get(`${API_BASE}/llm/info`)
      .then(res => {
        setServerLlmInfo(res.data);
      })
      .catch(err => {
        console.error('Error fetching server LLM info:', err);
      });
  }, []);

  const getActiveLlmName = () => {
    if (isFallbackMock) {
      return 'Mock (Аварийный режим)';
    }
    if (llmApiKey && llmApiKey.trim()) {
      const providerName = llmProvider === 'openai' ? 'OpenAI' : (llmProvider === 'gemini' ? 'Gemini' : 'Kaspersky');
      const modelName = llmModel || 'default';
      return `${providerName} (${modelName})`;
    } else if (serverLlmInfo) {
      if (serverLlmInfo.is_mock) {
        return 'Mock (Локальная заглушка)';
      }
      const providerName = serverLlmInfo.provider === 'openai' ? 'OpenAI' : (serverLlmInfo.provider === 'gemini' ? 'Gemini' : 'Kaspersky');
      return `${providerName} (${serverLlmInfo.model})`;
    }
    return 'Загрузка...';
  };

  // LLM Config state
  const [llmProvider, setLlmProviderState] = useState<string>(() => {
    const saved = localStorage.getItem('llm_provider');
    return (saved && saved !== 'openai' && saved !== 'gemini') ? saved : 'custom';
  });
  const [llmApiKey, setLlmApiKeyState] = useState<string>(() => localStorage.getItem('llm_api_key') || '');
  const [llmBaseUrl, setLlmBaseUrlState] = useState<string>(() => localStorage.getItem('llm_base_url') || 'https://llm.kaspersky-labs.com/v1/');
  const [llmModel, setLlmModelState] = useState<string>(() => localStorage.getItem('llm_model') || '');

  const setLlmProvider = (val: string) => {
    setLlmProviderState(val);
    localStorage.setItem('llm_provider', val);
  };
  const setLlmApiKey = (val: string) => {
    setLlmApiKeyState(val);
    localStorage.setItem('llm_api_key', val);
  };
  const setLlmBaseUrl = (val: string) => {
    setLlmBaseUrlState(val);
    localStorage.setItem('llm_base_url', val);
  };
  const setLlmModel = (val: string) => {
    setLlmModelState(val);
    localStorage.setItem('llm_model', val);
  };

  const fetchModels = async (provider: string, apiKey: string, baseUrl?: string): Promise<string[]> => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post(`${API_BASE}/llm/models`, {
        provider,
        api_key: apiKey,
        base_url: baseUrl || null
      });
      return response.data.models;
    } catch (err: any) {
      const errMsg = err.response?.data?.detail || 'Ошибка загрузки списка моделей';
      setError(errMsg);
      throw new Error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const startNewDesign = () => {
    resetSession();
    setMode('new');
    setCurrentStage(1);
  };

  const startExistingDesign = () => {
    resetSession();
    setMode('existing');
    setCurrentStage(1);
  };

  const setStage = (stage: number) => {
    setCurrentStage(stage);
  };

  const prevStage = () => {
    if (currentStage > 1) {
      setCurrentStage(currentStage - 1);
    }
  };

  const nextStage = () => {
    const maxStages = mode === 'existing' ? 6 : 5;
    if (currentStage < maxStages) {
      setCurrentStage(currentStage + 1);
    }
  };

  const resetSession = () => {
    setMode(null);
    setCurrentStage(1);
    setRequirementsState([]);
    setQuestions([]);
    setAnswers([]);
    setScenariosState([]);
    setComparisonReport('');
    setOldScenariosText('');
    setAdditionalInfoText('');
    setRawRequirementsText('');
    setError(null);
    setLoading(false);
    setIsFallbackMock(false);
    setFallbackError(null);
  };

  // Stage 1: Parse requirements and file uploads
  const parseRequirements = async (
    text: string,
    additionalInfo: string,
    oldScenarios?: string,
    files?: File[]
  ) => {
    setLoading(true);
    setError(null);
    setRawRequirementsText(text);
    setAdditionalInfoText(additionalInfo);
    if (oldScenarios) setOldScenariosText(oldScenarios);

    const formData = new FormData();
    formData.append('requirements_text', text);
    if (additionalInfo) formData.append('additional_info', additionalInfo);
    
    if (files) {
      files.forEach((file) => {
        formData.append('files', file);
      });
    }

    if (llmApiKey && llmApiKey.trim()) {
      formData.append('llm_provider', llmProvider);
      formData.append('llm_api_key', llmApiKey.trim());
      if (llmBaseUrl) formData.append('llm_base_url', llmBaseUrl.trim());
      if (llmModel) formData.append('llm_model', llmModel.trim());
    }

    try {
      const response = await axios.post(`${API_BASE}/design/parse-requirements`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setRequirementsState(response.data.requirements);
      if (response.data.is_mock && response.data.error_message) {
        setIsFallbackMock(true);
        setFallbackError(response.data.error_message);
      } else {
        setIsFallbackMock(false);
        setFallbackError(null);
      }
      nextStage();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ошибка парсинга требований');
    } finally {
      setLoading(false);
    }
  };

  // Stage 2: Matrix row manipulation
  const setRequirements = (reqs: Requirement[]) => {
    setRequirementsState(reqs);
  };

  const addRequirement = (desc: string) => {
    const nextIdNum = requirements.length + 1;
    const nextId = `RQ-${nextIdNum < 10 ? '0' + nextIdNum : nextIdNum}`;
    const newReq: Requirement = {
      id: nextId,
      description: desc,
      cases_count: 0,
    };
    setRequirementsState([...requirements, newReq]);
  };

  const editRequirement = (id: string, desc: string) => {
    setRequirementsState(
      requirements.map((req) => (req.id === id ? { ...req, description: desc } : req))
    );
  };

  const deleteRequirement = (id: string) => {
    setRequirementsState(requirements.filter((req) => req.id !== id));
  };

  // Stage 3: Fetch clarifying questions
  const fetchQuestions = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post(`${API_BASE}/llm/generate-questions`, {
        requirements,
        llm_config: llmApiKey && llmApiKey.trim() ? {
          provider: llmProvider,
          api_key: llmApiKey.trim(),
          base_url: llmBaseUrl ? llmBaseUrl.trim() : null,
          model: llmModel ? llmModel.trim() : null
        } : null
      });
      setQuestions(response.data.questions);
      setAllQuestions(response.data.questions);
      setAnswers([]);
      if (response.data.is_mock && response.data.error_message) {
        setIsFallbackMock(true);
        setFallbackError(response.data.error_message);
      } else {
        setIsFallbackMock(false);
        setFallbackError(null);
      }
      nextStage();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ошибка генерации вопросов');
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = (questionId: string, answerText: string) => {
    const q = questions.find((item) => item.id === questionId);
    if (q) {
      const newAnswer: UserAnswer = {
        question_id: questionId,
        question: q.question,
        answer: answerText,
      };
      setAnswers([...answers, newAnswer]);
      // Remove from the active questions queue
      setQuestions(questions.filter((item) => item.id !== questionId));
    }
  };

  const skipQuestion = (questionId: string) => {
    const qIndex = questions.findIndex((item) => item.id === questionId);
    if (qIndex !== -1) {
      const q = questions[qIndex];
      const updatedQueue = [...questions];
      // Remove from current position and push to the back
      updatedQueue.splice(qIndex, 1);
      updatedQueue.push(q);
      setQuestions(updatedQueue);
    }
  };

  const updateAnswer = (questionId: string, answerText: string) => {
    setAnswers(answers.map((a) => (a.question_id === questionId ? { ...a, answer: answerText } : a)));
  };

  const resetAnswer = (questionId: string) => {
    setAnswers(answers.filter((a) => a.question_id !== questionId));
    const originalQ = allQuestions.find((q) => q.id === questionId);
    if (originalQ && !questions.some((q) => q.id === questionId)) {
      setQuestions([originalQ, ...questions]);
    }
  };

  // Stage 4: Generate Test Scenarios
  const generateTestScenarios = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post(`${API_BASE}/llm/generate-scenarios`, {
        requirements,
        answers,
        llm_config: llmApiKey && llmApiKey.trim() ? {
          provider: llmProvider,
          api_key: llmApiKey.trim(),
          base_url: llmBaseUrl ? llmBaseUrl.trim() : null,
          model: llmModel ? llmModel.trim() : null
        } : null
      });
      
      const generatedScenarios = response.data.scenarios;
      
      // Update requirements cases count based on coverage
      const updatedReqs = requirements.map((req) => {
        const matchingCasesCount = generatedScenarios.filter((sc: TestScenario) => 
          sc.coverage.includes(req.id)
        ).length;
        return { ...req, cases_count: matchingCasesCount };
      });
      
      setRequirementsState(updatedReqs);
      setScenariosState(generatedScenarios);
      if (response.data.is_mock && response.data.error_message) {
        setIsFallbackMock(true);
        setFallbackError(response.data.error_message);
      } else {
        setIsFallbackMock(false);
        setFallbackError(null);
      }
      nextStage();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ошибка генерации тест-сценариев');
    } finally {
      setLoading(false);
    }
  };

  const setScenarios = (newScenarios: TestScenario[]) => {
    setScenariosState(newScenarios);
    
    // Recalculate requirements cases count
    const updatedReqs = requirements.map((req) => {
      const count = newScenarios.filter((sc) => sc.coverage.includes(req.id)).length;
      return { ...req, cases_count: count };
    });
    setRequirementsState(updatedReqs);
  };

  const addScenario = (newSc: TestScenario) => {
    const updated = [...scenarios, newSc];
    setScenarios(updated);
  };

  const editScenario = (id: string, updatedFields: Partial<TestScenario>) => {
    const updated = scenarios.map((sc) => (sc.id === id ? { ...sc, ...updatedFields } : sc));
    setScenarios(updated);
  };

  const deleteScenario = (id: string) => {
    const updated = scenarios.filter((sc) => sc.id !== id);
    setScenarios(updated);
  };

  // Stage 5: Compare old vs new scenarios (only in 'existing' mode)
  const compareTestScenarios = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post(`${API_BASE}/llm/compare-scenarios`, {
        old_scenarios_text: oldScenariosText,
        new_scenarios: scenarios,
        llm_config: llmApiKey && llmApiKey.trim() ? {
          provider: llmProvider,
          api_key: llmApiKey.trim(),
          base_url: llmBaseUrl ? llmBaseUrl.trim() : null,
          model: llmModel ? llmModel.trim() : null
        } : null
      });
      setComparisonReport(response.data.changes_summary);
      if (response.data.is_mock && response.data.error_message) {
        setIsFallbackMock(true);
        setFallbackError(response.data.error_message);
      } else {
        setIsFallbackMock(false);
        setFallbackError(null);
      }
      nextStage();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ошибка сравнения тест-сценариев');
    } finally {
      setLoading(false);
    }
  };

  const clearFallbackMock = () => {
    setIsFallbackMock(false);
    setFallbackError(null);
  };

  return (
    <DesignContext.Provider
      value={{
        mode,
        currentStage,
        requirements,
        questions,
        answers,
        scenarios,
        comparisonReport,
        oldScenariosText,
        additionalInfoText,
        rawRequirementsText,
        loading,
        error,
        activeLlmName: getActiveLlmName(),
        isFallbackMock,
        fallbackError,

        llmProvider,
        llmApiKey,
        llmBaseUrl,
        llmModel,
        setLlmProvider,
        setLlmApiKey,
        setLlmBaseUrl,
        setLlmModel,
        fetchModels,
        
        startNewDesign,
        startExistingDesign,
        setStage,
        prevStage,
        nextStage,
        resetSession,
        
        parseRequirements,
        setRequirements,
        addRequirement,
        editRequirement,
        deleteRequirement,
        
        fetchQuestions,
        submitAnswer,
        skipQuestion,
        updateAnswer,
        resetAnswer,
        
        generateTestScenarios,
        setScenarios,
        addScenario,
        editScenario,
        deleteScenario,
        
        compareTestScenarios,
        clearFallbackMock,
      }}
    >
      {children}
    </DesignContext.Provider>
  );
};

export const useDesign = () => {
  const context = useContext(DesignContext);
  if (!context) {
    throw new Error('useDesign must be used within a DesignProvider');
  }
  return context;
};
