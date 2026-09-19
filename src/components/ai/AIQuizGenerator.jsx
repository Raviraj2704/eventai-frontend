import React, { useState, useEffect } from 'react';
import { BookOpen, CheckCircle, XCircle, RotateCcw, Award, Loader } from 'lucide-react';
import apiClient from '../services/apiClient';

const AIQuizGenerator = ({ sessionId, sessionTitle }) => {
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(null);

  useEffect(() => {
    fetchQuiz();
  }, [sessionId]);

  const fetchQuiz = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get(`/ai/sessions/${sessionId}/quiz`);
      setQuiz(response.data || response);
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

      setScore(response.data || response.score);
      setSubmitted(true);
    } catch (err) {
      console.error('Failed to submit quiz:', err);
      setError('Failed to submit quiz');
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
          <Loader size={48} className="text-blue-500 mx-auto mb-4 animate-spin" />
          <p className="text-lg text-slate-600 dark:text-slate-400">
            Generating your quiz...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <p className="text-lg text-slate-600 dark:text-slate-400 mb-6">{error}</p>
          <button
            onClick={fetchQuiz}
            className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!quiz || !quiz.questions) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center p-6">
        <div className="text-center">
          <BookOpen size={48} className="text-slate-400 mx-auto mb-4" />
          <p className="text-lg text-slate-600 dark:text-slate-400">
            No quiz available for this session
          </p>
        </div>
      </div>
    );
  }

  const question = quiz.questions[currentQuestion];
  const progressPercent = ((currentQuestion + 1) / quiz.questions.length) * 100;

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 pt-8">
        <h1 className="text-3xl font-bold mb-1">Test Your Knowledge</h1>
        <p className="text-blue-100">Questions based on {sessionTitle}</p>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto p-6">
        {submitted ? (
          // Results Screen
          <div className="space-y-6">
            {/* Score Card */}
            <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border border-green-200 dark:border-green-700 rounded-lg p-8 text-center">
              <Award size={48} className="text-yellow-500 mx-auto mb-4" />
              <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">
                {score?.percentage}%
              </h2>
              <p className="text-lg text-slate-700 dark:text-slate-300 mb-4">
                {score?.message || `You scored ${score?.correct} out of ${quiz.questions.length}`}
              </p>

              {/* Score Details */}
              <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-green-200 dark:border-green-700">
                <div>
                  <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                    {score?.correct}
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Correct</p>
                </div>
                <div>
                  <div className="text-3xl font-bold text-red-600 dark:text-red-400">
                    {score?.incorrect}
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Incorrect</p>
                </div>
                <div>
                  <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                    +{score?.points}
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Points</p>
                </div>
              </div>
            </div>

            {/* Review Answers */}
            {score?.incorrect > 0 && (
              <div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
                  📝 Review Your Answers
                </h3>
                <div className="space-y-4">
                  {quiz.questions.map((q, idx) => {
                    const userAnswer = answers[idx];
                    const isCorrect = userAnswer === q.correct_answer;

                    return (
                      <div
                        key={idx}
                        className={`p-4 rounded-lg border ${
                          isCorrect
                            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700'
                            : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700'
                        }`}
                      >
                        <div className="flex items-start gap-3 mb-2">
                          {isCorrect ? (
                            <CheckCircle size={20} className="text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                          ) : (
                            <XCircle size={20} className="text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                          )}
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-white mb-1">
                              Question {idx + 1}: {q.question}
                            </p>
                            <p className="text-sm text-slate-700 dark:text-slate-300">
                              Your answer: {q.options[userAnswer]}
                            </p>
                            {!isCorrect && (
                              <p className="text-sm text-green-700 dark:text-green-400 mt-1">
                                Correct answer: {q.options[q.correct_answer]}
                              </p>
                            )}
                            {q.explanation && (
                              <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 italic">
                                💡 {q.explanation}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleReset}
                className="flex-1 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <RotateCcw size={20} />
                Retake Quiz
              </button>
              <button className="flex-1 px-6 py-3 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600 rounded-lg font-semibold transition-colors">
                Share Results
              </button>
            </div>
          </div>
        ) : (
          // Quiz Questions
          <div className="space-y-6">
            {/* Progress Bar */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Question {currentQuestion + 1} of {quiz.questions.length}
                </p>
                <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                  {Math.round(progressPercent)}%
                </p>
              </div>
              <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>
            </div>

            {/* Question */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {question.question}
              </h2>
              {question.hint && (
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 italic">
                  💡 {question.hint}
                </p>
              )}
            </div>

            {/* Options */}
            <div className="space-y-3">
              {question.options.map((option, idx) => (
                <button
                  key={idx}
                  onClick={() => handleAnswer(currentQuestion, idx)}
                  className={`w-full p-4 text-left rounded-lg border-2 transition-all duration-200 ${
                    answers[currentQuestion] === idx
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                      : 'border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                        answers[currentQuestion] === idx
                          ? 'border-blue-500 bg-blue-500'
                          : 'border-slate-300 dark:border-slate-600'
                      }`}
                    >
                      {answers[currentQuestion] === idx && (
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      )}
                    </div>
                    <span className="text-slate-900 dark:text-white font-medium">
                      {option}
                    </span>
                  </div>
                </button>
              ))}
            </div>

            {/* Navigation Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
                disabled={currentQuestion === 0}
                className="flex-1 px-4 py-3 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-semibold hover:bg-slate-300 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>

              {currentQuestion < quiz.questions.length - 1 ? (
                <button
                  onClick={() => setCurrentQuestion(currentQuestion + 1)}
                  className="flex-1 px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition-colors"
                >
                  Next
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={Object.keys(answers).length < quiz.questions.length}
                  className="flex-1 px-4 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  <Award size={20} />
                  Submit Quiz
                </button>
              )}
            </div>

            {/* Question Skipped Warning */}
            {answers[currentQuestion] === undefined && (
              <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 text-yellow-700 dark:text-yellow-300 rounded-lg text-sm">
                ⚠️ You haven't answered this question yet
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AIQuizGenerator;