// ============================================================================
// Engagement Center Screen (Page 21) - WITH CREATE & DELETE CRUD - FIXED
// ============================================================================
// File: src/pages/engagement-center/EngagementCenterScreen.jsx
// Purpose: Polls, Quizzes, Activities engagement features with full CRUD
// Status: Production-Ready ✅
// Fixed: All syntax errors, variable assignments, indentation

import React, { useEffect, useState, useCallback } from 'react'
import { MessageSquare, HelpCircle, CheckSquare, Plus, Trash2, Loader } from 'lucide-react'
import toast from 'react-hot-toast'
import Header from '../../components/layout/Header'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import apiClient from '../../config/apiClient'

const EngagementCenterScreen = () => {
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('polls')
  const [polls, setPolls] = useState([])
  const [quizzes, setQuizzes] = useState([])
  const [activities, setActivities] = useState([])
  const [summary, setSummary] = useState(null)
  const [votingPoll, setVotingPoll] = useState(null)
  const [selectedQuiz, setSelectedQuiz] = useState(null)
  const [quizAnswers, setQuizAnswers] = useState({})
  const [submittingQuiz, setSubmittingQuiz] = useState(false)
  const [completingActivity, setCompletingActivity] = useState(null)

  // Modal / Create State
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [createForm, setCreateForm] = useState({
    title: '',
    description: '',
    option1: 'Yes',
    option2: 'No',
    difficulty: 'intermediate',
    priority: 'medium',
    points_reward: 50
  })

  const loadEngagementData = useCallback(async () => {
    setLoading(true)
    try {
      const summaryResponse = await apiClient.get('/engagement/summary')
      setSummary(summaryResponse.data.data)

      // ✅ FIX #1: Proper variable assignments for all three endpoints
      if (activeTab === 'polls') {
        const pollsResponse = await apiClient.get('/engagement/polls', { params: { limit: 20 } })
        setPolls(pollsResponse.data.data || [])
      } else if (activeTab === 'quizzes') {
        const quizzesResponse = await apiClient.get('/engagement/quizzes', { params: { limit: 20 } })
        setQuizzes(quizzesResponse.data.data || [])
      } else if (activeTab === 'activities') {
        const activitiesResponse = await apiClient.get('/engagement/activities', { params: { limit: 20 } })
        setActivities(activitiesResponse.data.data || [])
      }
    } catch (error) {
      console.error('Error loading engagement data:', error)
      toast.error('Failed to load engagement data')
    } finally {
      setLoading(false)
    }
  }, [activeTab])

  useEffect(() => {
    loadEngagementData()
  }, [loadEngagementData])

  // ============================================================================
  // CREATE HANDLER
  // ============================================================================
  const handleCreateSubmit = async (e) => {
    e.preventDefault()
    if (!createForm.title.trim()) {
      toast.error('Title or question is required')
      return
    }

    setIsCreating(true)
    try {
      if (activeTab === 'polls') {
        await apiClient.post('/engagement/polls', {
          question: createForm.title,
          description: createForm.description,
          options: [createForm.option1, createForm.option2]
        })
        toast.success('Poll created successfully! 🎉')
      } else if (activeTab === 'activities') {
        await apiClient.post('/engagement/activities', {
          title: createForm.title,
          description: createForm.description,
          priority: createForm.priority,
          points_reward: parseInt(createForm.points_reward) || 50
        })
        toast.success('Activity created successfully! 🎉')
      }

      setShowCreateModal(false)
      setCreateForm({
        title: '',
        description: '',
        option1: 'Yes',
        option2: 'No',
        difficulty: 'intermediate',
        priority: 'medium',
        points_reward: 50
      })
      loadEngagementData()
    } catch (error) {
      console.error('Error creating item:', error)
      toast.error('Failed to create item')
    } finally {
      setIsCreating(false)
    }
  }

  // ============================================================================
  // DELETE HANDLER
  // ============================================================================
  const handleDeleteItem = async (type, id) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return

    try {
      if (type === 'poll') {
        await apiClient.delete(`/engagement/polls/${id}`)
        toast.success('Poll deleted')
      } else if (type === 'activity') {
        await apiClient.delete(`/engagement/activities/${id}`)
        toast.success('Activity deleted')
      }
      loadEngagementData()
    } catch (error) {
      console.error('Error deleting item:', error)
      toast.error('Failed to delete item')
    }
  }

  // ============================================================================
  // POLLS HANDLERS
  // ============================================================================
  const handleVotePoll = async (pollId, optionId) => {
    setVotingPoll(pollId)
    try {
      await apiClient.post(`/engagement/polls/${pollId}/vote`, { option_id: optionId })
      toast.success('Vote recorded! +2 points earned')
      loadEngagementData()
    } catch (error) {
      console.error('Error voting:', error)
      toast.error('Failed to vote')
    } finally {
      setVotingPoll(null)
    }
  }

  // ============================================================================
  // QUIZZES HANDLERS
  // ============================================================================
  const handleSelectAnswer = (questionId, answer) => {
    setQuizAnswers(prev => ({ ...prev, [questionId]: answer }))
  }

  const handleSubmitQuiz = async (quizId) => {
    const answers = Object.entries(quizAnswers).map(([questionId, answer]) => ({
      question_id: parseInt(questionId),
      answer
    }))

    if (answers.length === 0) {
      toast.error('Please answer at least one question')
      return
    }

    setSubmittingQuiz(true)
    try {
      const response = await apiClient.post(`/engagement/quizzes/${quizId}/submit`, { answers })
      toast.success(
        response.data.passed
          ? `Quiz Completed! Score: ${response.data.percentage.toFixed(1)}% +${response.data.points_earned} points`
          : `Quiz Completed! Score: ${response.data.percentage.toFixed(1)}%`
      )
      setSelectedQuiz(null)
      setQuizAnswers({})
      loadEngagementData()
    } catch (error) {
      console.error('Error submitting quiz:', error)
      toast.error('Failed to submit quiz')
    } finally {
      setSubmittingQuiz(false)
    }
  }

  // ============================================================================
  // ACTIVITIES HANDLERS
  // ============================================================================
  const handleCompleteActivity = async (activityId) => {
    setCompletingActivity(activityId)
    try {
      const response = await apiClient.post(`/engagement/activities/${activityId}/complete`, {
        completion_notes: ''
      })
      toast.success(`Activity Completed! +${response.data.points_earned} points earned`)
      loadEngagementData()
    } catch (error) {
      console.error('Error completing activity:', error)
      toast.error('Failed to complete activity')
    } finally {
      setCompletingActivity(null)
    }
  }

  if (loading && !summary) {
    return (
      <>
        <Header />
        <LoadingSpinner fullScreen />
      </>
    )
  }

  return (
    <>
      <Header />

      <main className="pb-20 md:pb-0">
        <div className="bg-gradient-to-r from-primary-600 to-secondary-600 text-white">
          <div className="container-max py-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Engagement Center</h1>
            <p className="text-white/85">Participate in polls, quizzes, and activities to earn points</p>
          </div>
        </div>

        <div className="container-max py-8">
          {summary && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-white rounded-lg border border-neutral-200 p-4">
                <p className="text-xs text-neutral-600 mb-1">Active Polls</p>
                <p className="text-2xl font-bold text-neutral-900">{summary.active_polls}</p>
              </div>
              <div className="bg-white rounded-lg border border-neutral-200 p-4">
                <p className="text-xs text-neutral-600 mb-1">Quizzes Completed</p>
                <p className="text-2xl font-bold text-neutral-900">{summary.quizzes_completed}</p>
              </div>
              <div className="bg-white rounded-lg border border-neutral-200 p-4">
                <p className="text-xs text-neutral-600 mb-1">Activities Done</p>
                <p className="text-2xl font-bold text-neutral-900">{summary.activities_completed}</p>
              </div>
              <div className="bg-white rounded-lg border border-neutral-200 p-4">
                <p className="text-xs text-neutral-600 mb-1">Points This Week</p>
                <p className="text-2xl font-bold text-primary-600">+{summary.total_points_this_week}</p>
              </div>
            </div>
          )}

          {/* Tab Header with Create Button */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-neutral-200 mb-8 pb-4">
            <div className="flex gap-2 overflow-x-auto w-full sm:w-auto">
              {[
                { value: 'polls', label: '🗳️ Polls', icon: MessageSquare },
                { value: 'quizzes', label: '❓ Quizzes', icon: HelpCircle },
                { value: 'activities', label: '✓ Activities', icon: CheckSquare }
              ].map(tab => (
                <button
                  key={tab.value}
                  onClick={() => {
                    setActiveTab(tab.value)
                    setSelectedQuiz(null)
                  }}
                  className={`px-4 py-2 font-medium border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === tab.value
                      ? 'border-primary-600 text-primary-600'
                      : 'border-transparent text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {activeTab !== 'quizzes' && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="btn btn-primary btn-sm flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Create {activeTab === 'polls' ? 'Poll' : 'Activity'}
              </button>
            )}
          </div>

          {/* Polls Tab */}
          {activeTab === 'polls' && (
            <div className="space-y-6">
              {loading ? (
                <LoadingSpinner />
              ) : polls.length > 0 ? (
                polls.map(poll => (
                  <div key={poll.id} className="bg-white rounded-lg border border-neutral-200 p-6 relative">
                    <button
                      onClick={() => handleDeleteItem('poll', poll.id)}
                      className="absolute top-4 right-4 text-neutral-400 hover:text-red-600 transition-colors"
                      title="Delete poll"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>

                    <h3 className="text-lg font-bold text-neutral-900 mb-2 pr-8">{poll.title}</h3>
                    {poll.description && <p className="text-neutral-600 text-sm mb-4">{poll.description}</p>}

                    <div className="space-y-3 mb-6">
                      {poll.options?.map(option => (
                        <button
                          key={option.id}
                          onClick={() => handleVotePoll(poll.id, option.id)}
                          disabled={votingPoll === poll.id || poll.user_voted}
                          className="w-full text-left"
                        >
                          <div className="bg-neutral-50 hover:bg-neutral-100 rounded-lg p-4 border-2 border-transparent hover:border-primary-300 transition-all cursor-pointer">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-neutral-900">{option.text}</span>
                              <span className="text-sm text-neutral-600">{(option.percentage || 0).toFixed(0)}%</span>
                            </div>
                            <div className="w-full bg-neutral-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full transition-all ${
                                  option.user_selected ? 'bg-primary-600' : 'bg-neutral-400'
                                }`}
                                style={{ width: `${option.percentage || 0}%` }}
                              />
                            </div>
                            <p className="text-xs text-neutral-500 mt-2">{option.vote_count} vote{option.vote_count !== 1 ? 's' : ''}</p>
                          </div>
                        </button>
                      ))}
                    </div>

                    <div className="text-xs text-neutral-600">
                      {poll.user_voted ? <p className="text-green-600 font-medium">✓ You voted</p> : <p>Total votes: {poll.total_votes}</p>}
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-neutral-50 rounded-lg border border-neutral-200 p-12 text-center">
                  <MessageSquare className="w-12 h-12 text-neutral-400 mx-auto mb-4 opacity-50" />
                  <p className="text-neutral-600">No active polls</p>
                </div>
              )}
            </div>
          )}

          {/* Quizzes Tab */}
          {activeTab === 'quizzes' && (
            <div className="space-y-6">
              {loading ? (
                <LoadingSpinner />
              ) : selectedQuiz ? (
                <div className="bg-white rounded-lg border border-neutral-200 p-6">
                  <button
                    onClick={() => {
                      setSelectedQuiz(null)
                      setQuizAnswers({})
                    }}
                    className="text-primary-600 hover:text-primary-700 font-medium mb-4"
                  >
                    ← Back to Quizzes
                  </button>

                  <h2 className="text-2xl font-bold text-neutral-900 mb-2">{selectedQuiz.title}</h2>
                  {selectedQuiz.description && <p className="text-neutral-600 mb-6">{selectedQuiz.description}</p>}

                  <div className="space-y-8 mb-8">
                    {selectedQuiz.questions?.map((question, idx) => (
                      <div key={question.id} className="pb-8 border-b border-neutral-200">
                        <div className="flex items-start gap-3 mb-4">
                          <span className="font-bold text-primary-600 text-lg">{idx + 1}.</span>
                          <h4 className="text-lg font-semibold text-neutral-900 flex-1">{question.text}</h4>
                        </div>

                        {question.type === 'multiple_choice' && question.options && (
                          <div className="space-y-2 ml-8">
                            {question.options.map((option, optIdx) => (
                              <button
                                key={optIdx}
                                onClick={() => handleSelectAnswer(question.id, option)}
                                className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                                  quizAnswers[question.id] === option
                                    ? 'border-primary-600 bg-primary-50'
                                    : 'border-neutral-200 hover:border-primary-300'
                                }`}
                              >
                                <span className="text-neutral-900">{option}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => handleSubmitQuiz(selectedQuiz.id)}
                    disabled={submittingQuiz}
                    className="w-full btn btn-primary flex items-center justify-center gap-2"
                  >
                    {submittingQuiz ? (
                      <>
                        <Loader className="w-4 h-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      'Submit Quiz'
                    )}
                  </button>
                </div>
              ) : quizzes.length > 0 ? (
                quizzes.map(quiz => (
                  <div key={quiz.id} className="bg-white rounded-lg border border-neutral-200 p-6 hover:shadow-lg transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-lg font-bold text-neutral-900">{quiz.title}</h3>
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                        {quiz.difficulty || 'Intermediate'}
                      </span>
                    </div>

                    {quiz.description && <p className="text-neutral-600 text-sm mb-4">{quiz.description}</p>}

                    <div className="grid grid-cols-3 gap-4 mb-6 text-sm">
                      <div>
                        <p className="text-neutral-600">Questions</p>
                        <p className="font-bold text-neutral-900">{quiz.question_count || 2}</p>
                      </div>
                      <div>
                        <p className="text-neutral-600">Time Limit</p>
                        <p className="font-bold text-neutral-900">5 min</p>
                      </div>
                      <div>
                        <p className="text-neutral-600">Reward</p>
                        <p className="font-bold text-primary-600">+{quiz.points_reward} pts</p>
                      </div>
                    </div>

                    {quiz.user_attempt && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4 text-sm">
                        <p className="text-green-900 font-medium">✓ Completed - Score: {quiz.user_attempt.percentage.toFixed(1)}%</p>
                      </div>
                    )}

                    <button
                      onClick={() => setSelectedQuiz(quiz)}
                      disabled={quiz.user_attempt}
                      className={`w-full btn btn-sm ${
                        quiz.user_attempt ? 'btn-outline opacity-50 cursor-not-allowed' : 'btn-primary'
                      }`}
                    >
                      {quiz.user_attempt ? 'Completed' : 'Take Quiz'}
                    </button>
                  </div>
                ))
              ) : (
                <div className="bg-neutral-50 rounded-lg border border-neutral-200 p-12 text-center">
                  <HelpCircle className="w-12 h-12 text-neutral-400 mx-auto mb-4 opacity-50" />
                  <p className="text-neutral-600">No quizzes available</p>
                </div>
              )}
            </div>
          )}

          {/* Activities Tab */}
          {activeTab === 'activities' && (
            <div className="space-y-4">
              {loading ? (
                <LoadingSpinner />
              ) : activities.length > 0 ? (
                activities.map(activity => (
                  <div key={activity.id} className="bg-white rounded-lg border border-neutral-200 p-6 relative hover:shadow-md transition-shadow">
                    <button
                      onClick={() => handleDeleteItem('activity', activity.id)}
                      className="absolute top-4 right-4 text-neutral-400 hover:text-red-600 transition-colors"
                      title="Delete activity"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>

                    <div className="flex items-start justify-between mb-3 pr-8">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-neutral-900 mb-1">{activity.title}</h3>
                        <p className="text-neutral-600 text-sm">{activity.description}</p>
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800 ml-4">
                        {activity.priority || 'medium'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between mt-4">
                      <span className="text-sm font-semibold text-primary-600">+{activity.points_reward} points</span>
                      <button
                        onClick={() => handleCompleteActivity(activity.id)}
                        disabled={activity.is_completed_by_user || completingActivity === activity.id}
                        className={`btn btn-sm ${
                          activity.is_completed_by_user ? 'btn-outline opacity-50 cursor-not-allowed' : 'btn-primary'
                        }`}
                      >
                        {completingActivity === activity.id ? 'Completing...' : activity.is_completed_by_user ? '✓ Completed' : 'Mark Complete'}
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-neutral-50 rounded-lg border border-neutral-200 p-12 text-center">
                  <CheckSquare className="w-12 h-12 text-neutral-400 mx-auto mb-4 opacity-50" />
                  <p className="text-neutral-600">No activities available</p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-neutral-900 mb-4">
              Create New {activeTab === 'polls' ? 'Poll' : 'Activity'}
            </h3>
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  {activeTab === 'polls' ? 'Poll Question' : 'Activity Title'}
                </label>
                <input
                  type="text"
                  required
                  value={createForm.title}
                  onChange={e => setCreateForm({ ...createForm, title: e.target.value })}
                  placeholder={activeTab === 'polls' ? 'e.g., Which topic do you prefer?' : 'e.g., Visit exhibitor booths'}
                  className="w-full border border-neutral-300 rounded-lg p-2.5"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Description</label>
                <textarea
                  value={createForm.description}
                  onChange={e => setCreateForm({ ...createForm, description: e.target.value })}
                  placeholder="Optional details..."
                  className="w-full border border-neutral-300 rounded-lg p-2.5"
                  rows="3"
                />
              </div>

              {activeTab === 'polls' && (
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-neutral-700">Options</label>
                  <input
                    type="text"
                    required
                    value={createForm.option1}
                    onChange={e => setCreateForm({ ...createForm, option1: e.target.value })}
                    placeholder="Option 1"
                    className="w-full border border-neutral-300 rounded-lg p-2 text-sm"
                  />
                  <input
                    type="text"
                    required
                    value={createForm.option2}
                    onChange={e => setCreateForm({ ...createForm, option2: e.target.value })}
                    placeholder="Option 2"
                    className="w-full border border-neutral-300 rounded-lg p-2 text-sm"
                  />
                </div>
              )}

              {activeTab === 'activities' && (
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Points Reward</label>
                  <input
                    type="number"
                    value={createForm.points_reward}
                    onChange={e => setCreateForm({ ...createForm, points_reward: e.target.value })}
                    className="w-full border border-neutral-300 rounded-lg p-2.5"
                  />
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn btn-secondary btn-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="btn btn-primary btn-sm"
                >
                  {isCreating ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

export default EngagementCenterScreen