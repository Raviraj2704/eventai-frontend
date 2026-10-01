// ============================================================================
// Engagement Center Screen (Page 21) - FULL PRODUCTION CODE
// ============================================================================
// File: src/pages/engagement-center/EngagementCenterScreen.jsx
// ============================================================================

import React, { useEffect, useState, useCallback } from 'react';
import { MessageSquare, HelpCircle, CheckSquare, Plus, Trash2, Loader } from 'lucide-react';
import toast from 'react-hot-toast';
import { apiGet, apiPost, apiDelete } from '../../services/api';

export default function EngagementCenterScreen() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('polls');
  const [polls, setPolls] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [activities, setActivities] = useState([]);
  const [summary, setSummary] = useState(null);
  const [votingPoll, setVotingPoll] = useState(null);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [submittingQuiz, setSubmittingQuiz] = useState(false);
  const [completingActivity, setCompletingActivity] = useState(null);
  const [error, setError] = useState(null);

  // Modal / Create State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createForm, setCreateForm] = useState({
    title: '',
    description: '',
    option1: 'Yes',
    option2: 'No',
    difficulty: 'intermediate',
    priority: 'medium',
    points_reward: 50,
    question1: ''
  });

  const loadEngagementData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const summaryData = await apiGet('/api/v1/engagement/summary');
      setSummary(summaryData);

      if (activeTab === 'polls') {
        const pollsData = await apiGet('/api/v1/engagement/polls?limit=20');
        setPolls(Array.isArray(pollsData) ? pollsData : (pollsData?.data || []));
      } else if (activeTab === 'quizzes') {
        const quizzesData = await apiGet('/api/v1/engagement/quizzes?limit=20');
        setQuizzes(Array.isArray(quizzesData) ? quizzesData : (quizzesData?.data || []));
      } else if (activeTab === 'activities') {
        const activitiesData = await apiGet('/api/v1/engagement/activities?limit=20');
        setActivities(Array.isArray(activitiesData) ? activitiesData : (activitiesData?.data || []));
      }
    } catch (err) {
      console.error('Error loading engagement data:', err);
      setError('Failed to load engagement data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    loadEngagementData();
  }, [loadEngagementData]);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!createForm.title.trim()) {
      toast.error('Title or question is required');
      return;
    }

setIsCreating(true);
    try {
      if (activeTab === 'polls') {
        await apiPost('/api/v1/engagement/polls', {
          question: createForm.title,
          description: createForm.description,
          options: [createForm.option1, createForm.option2]
        });
        toast.success('Poll created successfully! 🎉');
      } else if (activeTab === 'quizzes') {
        await apiPost('/api/v1/engagement/quizzes', {
          title: createForm.title,
          description: createForm.description,
          difficulty: createForm.difficulty,
          points_reward: parseInt(createForm.points_reward, 10) || 50,
          question1: createForm.question1 || 'What is your primary AI development focus?'
        });
        toast.success('Quiz created successfully! 🎉');
      } else if (activeTab === 'activities') {
        await apiPost('/api/v1/engagement/activities', {
          title: createForm.title,
          description: createForm.description,
          priority: createForm.priority,
          points_reward: parseInt(createForm.points_reward, 10) || 50
        });
        toast.success('Activity created successfully! 🎉');
      }

      setShowCreateModal(false);
      setCreateForm({
        title: '',
        description: '',
        option1: 'Yes',
        option2: 'No',
        difficulty: 'intermediate',
        priority: 'medium',
        points_reward: 50,
        question1: ''
      });
      loadEngagementData();
    } catch (err) {
      console.error('Error creating item:', err);
      toast.error('Failed to create item');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteItem = async (type, id) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;

    try {
      if (type === 'poll') {
        await apiDelete(`/api/v1/engagement/polls/${id}`);
        toast.success('Poll deleted');
      } else if (type === 'quiz') {
        await apiDelete(`/api/v1/engagement/quizzes/${id}`);
        toast.success('Quiz deleted');
      } else if (type === 'activity') {
        await apiDelete(`/api/v1/engagement/activities/${id}`);
        toast.success('Activity deleted');
      }
      loadEngagementData();
    } catch (err) {
      console.error('Error deleting item:', err);
      toast.error('Failed to delete item');
    }
  };

const handleVotePoll = async (pollId, optionId) => {
    setVotingPoll(pollId);
    try {
      await apiPost(`/api/v1/engagement/polls/${pollId}/vote`, { option_id: optionId });
      toast.success('Vote recorded! +2 points earned');
      loadEngagementData();
    } catch (err) {
      console.error('Error voting:', err);
      toast.error('Failed to vote');
    } finally {
      setVotingPoll(null);
    }
  };

  const handleSelectAnswer = (questionId, answer) => {
    setQuizAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const handleSubmitQuiz = async (quizId) => {
    const answers = Object.entries(quizAnswers).map(([questionId, answer]) => ({
      question_id: parseInt(questionId, 10),
      answer
    }));

    if (answers.length === 0) {
      toast.error('Please answer at least one question');
      return;
    }

    setSubmittingQuiz(true);
    try {
      const response = await apiPost(`/api/v1/engagement/quizzes/${quizId}/submit`, { answers });
      toast.success(
        response.passed
          ? `Quiz Completed! Score: ${response.percentage.toFixed(1)}% +${response.points_earned} points`
          : `Quiz Completed! Score: ${response.percentage.toFixed(1)}%`
      );
      setSelectedQuiz(null);
      setQuizAnswers({});
      loadEngagementData();
    } catch (err) {
      console.error('Error submitting quiz:', err);
      toast.error('Failed to submit quiz');
    } finally {
      setSubmittingQuiz(false);
    }
  };

  const handleCompleteActivity = async (activityId) => {
    setCompletingActivity(activityId);
    try {
      const response = await apiPost(`/api/v1/engagement/activities/${activityId}/complete`, {
        completion_notes: ''
      });
      toast.success(`Activity Completed! +${response.points_earned || 50} points earned`);
      loadEngagementData();
    } catch (err) {
      console.error('Error completing activity:', err);
      toast.error('Failed to complete activity');
    } finally {
      setCompletingActivity(null);
    }
  };

  if (loading && !summary) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
        <Loader className="w-8 h-8 animate-spin text-blue-500 mr-3" />
        <span>Loading engagement center...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white pb-20">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 py-8 px-6 shadow-md">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Engagement Center</h1>
          <p className="text-gray-200">Participate in polls, quizzes, and activities to earn points</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {error && (
          <div className="mb-6 bg-red-900/50 border border-red-500 text-red-200 p-4 rounded-lg flex items-center justify-between">
            <span>⚠️ {error}</span>
            <button onClick={loadEngagementData} className="underline text-sm font-semibold hover:text-white">Retry</button>
          </div>
        )}

        {/* Summary Stats */}
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 shadow">
              <p className="text-xs text-gray-400 mb-1">Active Polls</p>
              <p className="text-2xl font-bold text-white">{summary.active_polls || 0}</p>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 shadow">
              <p className="text-xs text-gray-400 mb-1">Quizzes Completed</p>
              <p className="text-2xl font-bold text-white">{summary.quizzes_completed || 0}</p>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 shadow">
              <p className="text-xs text-gray-400 mb-1">Activities Done</p>
              <p className="text-2xl font-bold text-white">{summary.activities_completed || 0}</p>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 shadow">
              <p className="text-xs text-gray-400 mb-1">Points This Week</p>
              <p className="text-2xl font-bold text-blue-400">+{summary.total_points_this_week || 0}</p>
            </div>
          </div>
        )}

{/* Tab Navigation & Create Button */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-700 mb-8 pb-4">
          <div className="flex gap-2 overflow-x-auto w-full sm:w-auto">
            {[
              { value: 'polls', label: '🗳️ Polls', icon: MessageSquare },
              { value: 'quizzes', label: '❓ Quizzes', icon: HelpCircle },
              { value: 'activities', label: '✓ Activities', icon: CheckSquare }
            ].map(tab => (
              <button
                key={tab.value}
                onClick={() => {
                  setActiveTab(tab.value);
                  setSelectedQuiz(null);
                }}
                className={`px-4 py-2 font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.value
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow"
          >
            <Plus className="w-4 h-4" />
            Create {activeTab === 'polls' ? 'Poll' : activeTab === 'quizzes' ? 'Quiz' : 'Activity'}
          </button>
        </div>

        {/* Polls Tab */}
        {activeTab === 'polls' && (
          <div className="space-y-6">
            {loading ? (
              <div className="text-center py-12 text-gray-400">Loading polls...</div>
            ) : polls.length > 0 ? (
              polls.map(poll => (
                <div key={poll.id} className="bg-gray-800 border border-gray-700 rounded-xl p-6 relative shadow">
                  <button
                    onClick={() => handleDeleteItem('poll', poll.id)}
                    className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition-colors"
                    title="Delete poll"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>

                  <h3 className="text-lg font-bold text-white mb-2 pr-8">{poll.question || poll.title}</h3>
                  {poll.description && <p className="text-gray-400 text-sm mb-4">{poll.description}</p>}

                  <div className="space-y-3 mb-6">
                    {poll.options?.map(option => (
                      <button
                        key={option.id}
                        onClick={() => handleVotePoll(poll.id, option.id)}
                        disabled={votingPoll === poll.id || poll.user_voted}
                        className="w-full text-left bg-gray-700/60 hover:bg-gray-700 disabled:opacity-70 p-4 rounded-lg border border-gray-600 transition-all cursor-pointer"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-white">{option.text || option.name}</span>
                          <span className="text-sm text-blue-400 font-semibold">{(option.percentage || 0).toFixed(0)}%</span>
                        </div>
                        <div className="w-full bg-gray-600 rounded-full h-2 mb-2">
                          <div
                            className={`h-2 rounded-full transition-all ${option.user_selected ? 'bg-blue-500' : 'bg-gray-400'}`}
                            style={{ width: `${option.percentage || 0}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-400">{option.vote_count || 0} vote{(option.vote_count || 0) !== 1 ? 's' : ''}</p>
                      </button>
                    ))}
                  </div>

                  <div className="text-xs text-gray-400">
                    {poll.user_voted ? <p className="text-green-400 font-medium">✓ You voted</p> : <p>Total votes: {poll.total_votes || 0}</p>}
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-gray-800 border border-gray-700 rounded-xl p-12 text-center text-gray-400">
                <MessageSquare className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p>No active polls</p>
              </div>
            )}
          </div>
        )}

     {/* Quizzes Tab */}
        {activeTab === 'quizzes' && (
          <div className="space-y-6">
            {loading ? (
              <div className="text-center py-12 text-gray-400">Loading quizzes...</div>
            ) : selectedQuiz ? (
              <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 shadow">
                <button
                  onClick={() => {
                    setSelectedQuiz(null);
                    setQuizAnswers({});
                  }}
                  className="text-blue-400 hover:text-blue-300 font-medium mb-4 flex items-center gap-1"
                >
                  ← Back to Quizzes
                </button>

                <h2 className="text-2xl font-bold text-white mb-2">{selectedQuiz.title}</h2>
                {selectedQuiz.description && <p className="text-gray-400 mb-6">{selectedQuiz.description}</p>}

                <form onSubmit={(e) => { e.preventDefault(); handleSubmitQuiz(selectedQuiz.id); }}>
                  <div className="space-y-8 mb-8">
                    {selectedQuiz.questions?.map((question, idx) => (
                      <div key={question.id} className="pb-6 border-b border-gray-700">
                        <div className="flex items-start gap-3 mb-4">
                          <span className="font-bold text-blue-400 text-lg">{idx + 1}.</span>
                          <h4 className="text-lg font-semibold text-white flex-1">{question.text}</h4>
                        </div>

                        {question.type === 'multiple_choice' && question.options && (
                          <div className="space-y-2 ml-8">
                            {question.options.map((option, optIdx) => (
                              <button
                                type="button"
                                key={optIdx}
                                onClick={() => handleSelectAnswer(question.id, option)}
                                className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                                  quizAnswers[question.id] === option
                                    ? 'border-blue-500 bg-blue-900/30 text-white'
                                    : 'border-gray-700 bg-gray-700/40 text-gray-300 hover:border-gray-500'
                                }`}
                              >
                                <span>{option}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <button
                    type="submit"
                    disabled={submittingQuiz}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors shadow"
                  >
                    {submittingQuiz ? (
                      <>
                        <Loader className="w-5 h-5 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      'Submit Quiz'
                    )}
                  </button>
                </form>
              </div>
            ) : quizzes.length > 0 ? (
              quizzes.map(quiz => (
                <div key={quiz.id} className="bg-gray-800 border border-gray-700 rounded-xl p-6 relative shadow hover:border-gray-600 transition-all">
                  <button
                    onClick={() => handleDeleteItem('quiz', quiz.id)}
                    className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition-colors"
                    title="Delete quiz"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>

                  <div className="flex items-center gap-3 mb-2 pr-8">
                    <h3 className="text-lg font-bold text-white">{quiz.title}</h3>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-900/60 text-blue-300 border border-blue-700">
                      {quiz.difficulty || 'Intermediate'}
                    </span>
                  </div>

                  {quiz.description && <p className="text-gray-400 text-sm mb-4">{quiz.description}</p>}

                  <div className="grid grid-cols-3 gap-4 mb-6 text-sm bg-gray-900/40 p-3 rounded-lg border border-gray-700/60">
                    <div>
                      <p className="text-gray-400 text-xs">Questions</p>
                      <p className="font-bold text-white">{quiz.question_count || 2}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs">Time Limit</p>
                      <p className="font-bold text-white">5 min</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs">Reward</p>
                      <p className="font-bold text-blue-400">+{quiz.points_reward || 50} pts</p>
                    </div>
                  </div>

                  {quiz.user_attempt && (
                    <div className="bg-green-900/30 border border-green-700/60 text-green-300 rounded-lg p-3 mb-4 text-sm">
                      ✓ Completed - Score: {quiz.user_attempt.percentage.toFixed(1)}%
                    </div>
                  )}

                  <button
                    onClick={() => setSelectedQuiz(quiz)}
                    disabled={quiz.user_attempt}
                    className={`w-full py-2.5 rounded-lg font-medium transition-colors ${
                      quiz.user_attempt
                        ? 'bg-gray-700 text-gray-500 opacity-50 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700 text-white shadow'
                    }`}
                  >
                    {quiz.user_attempt ? 'Completed' : 'Take Quiz'}
                  </button>
                </div>
              ))
            ) : (
              <div className="bg-gray-800 border border-gray-700 rounded-xl p-12 text-center text-gray-400">
                <HelpCircle className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p>No quizzes available</p>
              </div>
            )}
          </div>
        )}

   {/* Activities Tab */}
        {activeTab === 'activities' && (
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-12 text-gray-400">Loading activities...</div>
            ) : activities.length > 0 ? (
              activities.map(activity => (
                <div key={activity.id} className="bg-gray-800 border border-gray-700 rounded-xl p-6 relative shadow hover:border-gray-600 transition-all">
                  <button
                    onClick={() => handleDeleteItem('activity', activity.id)}
                    className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition-colors"
                    title="Delete activity"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>

                  <div className="flex items-start justify-between mb-3 pr-8">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-white mb-1">{activity.title}</h3>
                      <p className="text-gray-400 text-sm">{activity.description}</p>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-900/40 text-amber-300 border border-amber-700/60 uppercase">
                      {activity.priority || 'medium'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-700/60">
                    <span className="text-sm font-semibold text-blue-400">+{activity.points_reward || 50} points</span>

                    <button
                      onClick={() => handleCompleteActivity(activity.id)}
                      disabled={activity.is_completed_by_user || completingActivity === activity.id}
                      className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                        activity.is_completed_by_user
                          ? 'bg-gray-700 text-gray-400 opacity-60 cursor-not-allowed'
                          : 'bg-blue-600 hover:bg-blue-700 text-white shadow'
                      }`}
                    >
                      {completingActivity === activity.id
                        ? 'Completing...'
                        : activity.is_completed_by_user
                        ? '✓ Completed'
                        : 'Mark Complete'}
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-gray-800 border border-gray-700 rounded-xl p-12 text-center text-gray-400">
                <CheckSquare className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p>No activities available</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-gray-800 border border-gray-700 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-4">
              Create New {activeTab === 'polls' ? 'Poll' : activeTab === 'quizzes' ? 'Quiz' : 'Activity'}
            </h3>
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  {activeTab === 'polls' ? 'Poll Question' : activeTab === 'quizzes' ? 'Quiz Title' : 'Activity Title'}
                </label>
                <input
                  type="text"
                  required
                  value={createForm.title}
                  onChange={e => setCreateForm({ ...createForm, title: e.target.value })}
                  placeholder={
                    activeTab === 'polls'
                      ? 'e.g., Which topic do you prefer?'
                      : activeTab === 'quizzes'
                      ? 'e.g., FastAPI Masterclass'
                      : 'e.g., Visit exhibitor booths'
                  }
                  className="w-full border border-gray-600 bg-gray-700 text-white rounded-lg p-3 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
                <textarea
                  value={createForm.description}
                  onChange={e => setCreateForm({ ...createForm, description: e.target.value })}
                  placeholder="Optional details..."
                  className="w-full border border-gray-600 bg-gray-700 text-white rounded-lg p-3 focus:outline-none focus:border-blue-500"
                  rows="3"
                />
              </div>

              {activeTab === 'polls' && (
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-300">Options</label>
                  <input
                    type="text"
                    required
                    value={createForm.option1}
                    onChange={e => setCreateForm({ ...createForm, option1: e.target.value })}
                    placeholder="Option 1"
                    className="w-full border border-gray-600 bg-gray-700 text-white rounded-lg p-2.5 text-sm focus:outline-none focus:border-blue-500"
                  />
                  <input
                    type="text"
                    required
                    value={createForm.option2}
                    onChange={e => setCreateForm({ ...createForm, option2: e.target.value })}
                    placeholder="Option 2"
                    className="w-full border border-gray-600 bg-gray-700 text-white rounded-lg p-2.5 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
              )}

              {activeTab === 'quizzes' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">First Question (Optional)</label>
                    <input
                      type="text"
                      value={createForm.question1}
                      onChange={e => setCreateForm({ ...createForm, question1: e.target.value })}
                      placeholder="e.g., What is your primary AI focus?"
                      className="w-full border border-gray-600 bg-gray-700 text-white rounded-lg p-3 text-sm focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Points Reward</label>
                    <input
                      type="number"
                      value={createForm.points_reward}
                      onChange={e => setCreateForm({ ...createForm, points_reward: e.target.value })}
                      className="w-full border border-gray-600 bg-gray-700 text-white rounded-lg p-3 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              )}

              {activeTab === 'activities' && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Points Reward</label>
                  <input
                    type="number"
                    value={createForm.points_reward}
                    onChange={e => setCreateForm({ ...createForm, points_reward: e.target.value })}
                    className="w-full border border-gray-600 bg-gray-700 text-white rounded-lg p-3 focus:outline-none focus:border-blue-500"
                  />
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-700">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-6 py-2 rounded-lg font-medium transition-colors shadow"
                >
                  {isCreating ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}