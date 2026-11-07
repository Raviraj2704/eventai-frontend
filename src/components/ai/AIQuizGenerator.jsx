import React, { useState, useEffect } from 'react';
import { 
  BookOpen, CheckCircle, XCircle, RotateCcw, Award, Loader, 
  Sparkles, Edit3, Plus, Trash2, X, Save 
} from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../../config/apiClient';

const AIQuizGenerator = ({ sessionId, sessionTitle }) => {
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(null);

  // Organizer state
  const [editingMode, setEditingMode] = useState(false);
  const [editQuestions, setEditQuestions] = useState([]);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchQuiz();
  }, [sessionId]);

  const fetchQuiz = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get(`/ai/sessions/${sessionId}/quiz`);
      const payload = response.data?.data || response.data || null;
      setIsAdmin(Boolean(response.data?.is_admin));
      setQuiz(payload);
      if (payload?.questions) {
        setEditQuestions(JSON.parse(JSON.stringify(payload.questions)));
      }
      setSubmitted(false);
      setAnswers({});
      setScore(null);
    } catch (err) {
      console.error('Failed to fetch quiz:', err);
      setError('Failed to load quiz');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAI = async () => {
    setGenerating(true);
    try {
      const res = await apiClient.post(`/ai/sessions/${sessionId}/quiz/generate`);
      const generated = res.data?.data;
      setQuiz(generated);
      setEditQuestions(JSON.parse(JSON.stringify(generated.questions || [])));
      setCurrentQuestion(0);
      setAnswers({});
      setSubmitted(false);
      toast.success('Quiz generated successfully with AI!');
    } catch (err) {
      toast.error('Failed to generate quiz with AI');
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveManualQuiz = async () => {
    if (!editQuestions.length) {
      toast.error('Please add at least one question');
      return;
    }
    try {
      await apiClient.post(`/ai/sessions/${sessionId}/quiz/save`, {
        title: `Quiz: ${sessionTitle}`,
        questions: editQuestions
      });
      setQuiz({
        ...quiz,
        questions: editQuestions,
        total_questions: editQuestions.length
      });
      setEditingMode(false);
      setCurrentQuestion(0);
      setAnswers({});
      setSubmitted(false);
      toast.success('Quiz questions saved!');
    } catch (err) {
      toast.error('Failed to save questions');
    }
  };

  const handleAnswer = (questionIndex, optionIndex) => {
    if (!submitted) {
      setAnswers({
        ...answers,
        [questionIndex]: optionIndex
      });
    }
  };

  const handleSubmit = async () => {
    try {
      const response = await apiClient.post(`/ai/sessions/${sessionId}/quiz/submit`, {
        answers: answers
      });
      const data = response.data?.data || response.data;
      setScore(data);
      setSubmitted(true);
    } catch (err) {
      console.error('Failed to submit quiz:', err);
      toast.error('Failed to submit quiz');
    }
  };

  const handleReset = () => {
    fetchQuiz();
    setCurrentQuestion(0);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <Loader className="text-[#0000c8] mx-auto mb-4 animate-spin" size="{48}"/>
          <p className="text-base text-slate-600 dark:text-slate-400">Loading quiz...</p>
        </div>
      </div>
    );
  }

  const hasQuestions = quiz && Array.isArray(quiz.questions) && quiz.questions.length > 0;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20">
      {/* Header */}
      <div className="bg-[#0000c8] text-white p-6 pt-8">
        <div className="max-w-2xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Session Quiz</h1>
            <p className="text-blue-100 text-sm mt-0.5">{sessionTitle}</p>
          </div>

          {/* Organizer Controls */}
          {isAdmin && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleGenerateAI}
                disabled={generating}
                className="flex items-center gap-1.5 px-3 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-semibold backdrop-blur-sm transition-all"
              >
                <Sparkles className={generating ? 'animate-spin' : ''} size={14} />
                {generating ? 'Generating...' : 'Generate with AI'}
              </button>
              <button
                type="button"
                onClick={() => setEditingMode(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-white text-[#0000c8] hover:bg-white/90 rounded-lg text-xs font-semibold shadow-sm transition-all"
              >
                <Edit3 size={14} />
                Edit Questions
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 sm:p-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-center mb-6">
            <p>{error}</p>
            <button onClick={fetchQuiz} className="mt-2 text-sm font-semibold underline">
              Try Again
            </button>
          </div>
        )}

        {!hasQuestions ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center shadow-sm">
            <BookOpen className="text-slate-400 mx-auto mb-3" size={44} />
            <h3 className="text-base font-bold text-slate-800 dark:text-white">No quiz available yet</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {isAdmin
                ? "As an organizer, you can auto-generate questions using AI or add them manually."
                : "The organizers have not published a quiz for this session yet."}
            </p>
            {isAdmin && (
              <div className="flex justify-center gap-2 mt-5">
                <button
                  type="button"
                  onClick={handleGenerateAI}
                  disabled={generating}
                  className="flex items-center gap-1.5 px-4 py-2 bg-[#0000c8] text-white rounded-lg text-xs font-semibold"
                >
                  <Sparkles size={14} />
                  Auto-Generate Quiz
                </button>
                <button
                  type="button"
                  onClick={() => setEditingMode(true)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700"
                >
                  Write Manually
                </button>
              </div>
            )}
          </div>
        ) : submitted ? (
          /* Results View */
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-center shadow-sm">
              <Award className="text-yellow-500 mx-auto mb-3" size={48} />
              <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">
                {score?.percentage}%
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                {score?.message || `You scored ${score?.correct} out of ${quiz.questions.length}`}
              </p>

              <div className="grid grid-cols-3 gap-3 mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
                <div>
                  <div className="text-2xl font-bold text-emerald-600">{score?.correct || 0}</div>
                  <p className="text-xs text-slate-500">Correct</p>
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-500">{score?.incorrect || 0}</div>
                  <p className="text-xs text-slate-500">Incorrect</p>
                </div>
                <div>
                  <div className="text-2xl font-bold text-[#0000c8]">+{score?.points || 0}</div>
                  <p className="text-xs text-slate-500">Points</p>
                </div>
              </div>
            </div>

            {/* Answer Review */}
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-3">Review Questions</h3>
              <div className="space-y-3">
                {quiz.questions.map((q, idx) => {
                  const userAnswer = answers[idx];
                  const isCorrect = userAnswer === q.correct_answer;
                  return (
                    <div
                      key={idx}
                      className={`p-4 rounded-xl border text-sm ${
                        isCorrect
                          ? 'bg-emerald-50/60 border-emerald-200 dark:bg-emerald-950/20'
                          : 'bg-red-50/60 border-red-200 dark:bg-red-950/20'
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        {isCorrect ? (
                          <CheckCircle className="text-emerald-600 shrink-0 mt-0.5" size={18} />
                        ) : (
                          <XCircle className="text-red-500 shrink-0 mt-0.5" size={18} />
                        )}
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white">
                            {idx + 1}. {q.question}
                          </p>
                          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                            Your answer: <span className="font-medium">{q.options[userAnswer] || 'Not answered'}</span>
                          </p>
                          {!isCorrect && (
                            <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium mt-0.5">
                              Correct: {q.options[q.correct_answer]}
                            </p>
                          )}
                          {q.explanation && (
                            <p className="text-xs text-slate-500 mt-2 italic">💡 {q.explanation}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <button
              onClick={handleReset}
              className="w-full flex items-center justify-center gap-2 py-3 bg-[#0000c8] text-white rounded-xl font-semibold shadow-sm"
            >
              <RotateCcw size={16} /> Retake Quiz
            </button>
          </div>
        ) : (
          /* Question View */
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm space-y-5">
            {/* Progress */}
            <div>
              <div className="flex justify-between items-center text-xs font-semibold text-slate-500 mb-2">
                <span>Question {currentQuestion + 1} of {quiz.questions.length}</span>
                <span>{Math.round(((currentQuestion + 1) / quiz.questions.length) * 100)}%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#0000c8] transition-all duration-300"
                  style={{ width: `${((currentQuestion + 1) / quiz.questions.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Prompt */}
            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-4 border border-slate-100 dark:border-slate-700/60">
              <h2 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                {quiz.questions[currentQuestion]?.question}
              </h2>
              {quiz.questions[currentQuestion]?.hint && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 italic">
                  💡 Hint: {quiz.questions[currentQuestion].hint}
                </p>
              )}
            </div>

            {/* Options */}
            <div className="space-y-2.5">
              {quiz.questions[currentQuestion]?.options.map((option, idx) => {
                const selected = answers[currentQuestion] === idx;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleAnswer(currentQuestion, idx)}
                    className={`w-full p-3.5 text-left rounded-xl border text-sm font-medium transition-all flex items-center gap-3 ${
                      selected
                        ? 'border-[#0000c8] bg-blue-50/60 dark:bg-blue-950/30 text-[#0000c8]'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    <span
                      className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 text-xs ${
                        selected
                          ? 'border-[#0000c8] bg-[#0000c8] text-white'
                          : 'border-slate-300 dark:border-slate-600'
                      }`}
                    >
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span className="flex-1">{option}</span>
                  </button>
                );
              })}
            </div>

            {/* Controls */}
            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setCurrentQuestion((prev) => Math.max(0, prev - 1))}
                disabled={currentQuestion === 0}
                className="flex-1 py-2.5 border border-slate-300 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold disabled:opacity-40"
              >
                Previous
              </button>
              {currentQuestion < quiz.questions.length - 1 ? (
                <button
                  type="button"
                  onClick={() => setCurrentQuestion((prev) => prev + 1)}
                  className="flex-1 py-2.5 bg-[#0000c8] text-white rounded-xl text-xs font-semibold"
                >
                  Next
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={Object.keys(answers).length < quiz.questions.length}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold disabled:opacity-50"
                >
                  Submit Quiz
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Organizer Editor Modal */}
      {editingMode && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Edit Quiz Questions</h3>
              <button onClick={() => setEditingMode(false)} className="text-slate-400 hover:text-slate-600">
                <X size="{20}"/>
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-4 flex-1">
              {editQuestions.map((q, qIndex) => (
                <div key={qIndex} className="p-3.5 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3">
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-xs font-bold text-slate-500">Question {qIndex + 1}</span>
                    <button
                      type="button"
                      onClick={() => setEditQuestions(editQuestions.filter((_, i) => i !== qIndex))}
                      className="text-red-500 p-1 hover:bg-red-50 rounded"
                    >
                      <Trash2 size="{15}"/>
                    </button>
                  </div>
                  <input
                    type="text"
                    value={q.question}
                    onChange={(e) => {
                      const updated = [...editQuestions];
                      updated[qIndex].question = e.target.value;
                      setEditQuestions(updated);
                    }}
                    placeholder="Enter question text..."
                    className="w-full text-xs font-medium p-2.5 border border-slate-200 rounded-lg dark:bg-slate-800 dark:border-slate-700"
                  />

                  {/* Options */}
                  <div className="space-y-1.5">
                    {q.options.map((opt, optIdx) => (
                      <div key={optIdx} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name={`correct_${qIndex}`}
                          checked={q.correct_answer === optIdx}
                          onChange={() => {
                            const updated = [...editQuestions];
                            updated[qIndex].correct_answer = optIdx;
                            setEditQuestions(updated);
                          }}
                          className="accent-[#0000c8]"
                        />
                        <input
                          type="text"
                          value={opt}
                          onChange={(e) => {
                            const updated = [...editQuestions];
                            updated[qIndex].options[optIdx] = e.target.value;
                            setEditQuestions(updated);
                          }}
                          className="flex-1 text-xs p-2 border border-slate-200 rounded-md dark:bg-slate-800 dark:border-slate-700"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={() =>
                  setEditQuestions([
                    ...editQuestions,
                    {
                      question: '',
                      options: ['Option 1', 'Option 2', 'Option 3', 'Option 4'],
                      correct_answer: 0,
                      explanation: '',
                      hint: ''
                    }
                  ])
                }
                className="w-full py-2.5 border-2 border-dashed border-slate-300 rounded-xl text-xs font-semibold text-slate-600 flex items-center justify-center gap-1.5"
              >
                <Plus size="{15}"/> Add Question
              </button>
            </div>

            <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2 bg-slate-50 dark:bg-slate-900/50">
              <button
                type="button"
                onClick={() => setEditingMode(false)}
                className="px-4 py-2 border rounded-lg text-xs font-semibold text-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveManualQuiz}
                className="px-4 py-2 bg-[#0000c8] text-white rounded-lg text-xs font-semibold flex items-center gap-1.5"
              >
                <Save size="{14}"/> Save Quiz
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIQuizGenerator;