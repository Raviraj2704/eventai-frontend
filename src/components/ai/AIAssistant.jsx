// ============================================================================
// Unified EventAI Floating Assistant (Merged with PicBot Features)
// ============================================================================
// File: src/components/ai/AIAssistant.jsx
// Purpose: Single global AI chatbot popup with quick actions, follow-up
//          suggestion chips, feedback buttons, and Groq AI integration
// Status: Production-Ready ✅

import React, { useState, useRef, useEffect } from 'react';
import { X, Send, MessageCircle, Loader, ThumbsUp, ThumbsDown, Sparkles } from 'lucide-react';
import apiClient from '../../config/apiClient';

const h = React.createElement;

function AIAssistant(props) {
  const userProfile = props ? props.userProfile : null;

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hey! 👋 I'm your EventAI Assistant powered by AI. Ask me about sessions, speakers, networking matches, or your schedule!",
      sender: 'ai',
      timestamp: new Date(),
      suggestions: [
        'Recommend sessions for me',
        'Find people to network with',
        'Event schedule'
      ]
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedbackGiven, setFeedbackGiven] = useState({});
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom when messages change or chat opens
  useEffect(
    function () {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    },
    [messages, isOpen]
  );

  // Allow opening assistant from anywhere via custom event
  useEffect(function () {
    function handleOpenEvent() {
      setIsOpen(true);
    }
    window.addEventListener('open-ai-assistant', handleOpenEvent);
    return function () {
      window.removeEventListener('open-ai-assistant', handleOpenEvent);
    };
  }, []);

  // Send message to AI (merges PicbotScreen response handling + AIAssistant features)
  const handleSendMessage = async function (rawText) {
    const textToSend = typeof rawText === 'string' ? rawText : inputValue;
    const trimmed = (textToSend || '').trim();
    if (!trimmed || loading) return;

    const userMessage = {
      id: Date.now(),
      text: trimmed,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(function (prev) {
      return prev.concat([userMessage]);
    });
    setInputValue('');
    setLoading(true);

    try {
      const response = await apiClient.post('/ai/chat', {
        message: trimmed,
        user_id: userProfile ? userProfile.id : undefined,
        context: 'general'
      });

      // Safely unwrap Axios response.data OR direct response object
      const data = (response && response.data) ? response.data : (response || {});
      const replyText =
        data.response ||
        data.message ||
        (data.data && data.data.response) ||
        (data.data && data.data.message) ||
        "I'm here to help you navigate NextGen AI Expo 2026! Check out the Sessions, Speakers, or Networking tabs for more.";

      const replySuggestions = Array.isArray(data.suggestions)
        ? data.suggestions
        : ['Recommend sessions', 'Find people to meet', 'Event schedule'];

      const aiMessage = {
        id: Date.now() + 1,
        text: replyText,
        sender: 'ai',
        suggestions: replySuggestions,
        metadata: data.metadata || {},
        timestamp: new Date()
      };

      setMessages(function (prev) {
        return prev.concat([aiMessage]);
      });
    } catch (error) {
      console.error('AI Assistant chat error:', error);
      const fallbackMessage = {
        id: Date.now() + 1,
        text: "I'm having trouble reaching the AI server right now, but I can still help! Try exploring the Schedule, Speakers, or AI Matches sections.",
        sender: 'ai',
        suggestions: ['Browse sessions', 'View speakers', 'AI Matches'],
        timestamp: new Date()
      };
      setMessages(function (prev) {
        return prev.concat([fallbackMessage]);
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle suggestion pill click
  const handleSuggestion = function (suggestionText) {
    handleSendMessage(suggestionText);
  };

  // Handle Helpful / Not helpful feedback
  const handleFeedback = async function (messageId, helpful) {
    setFeedbackGiven(function (prev) {
      return Object.assign({}, prev, { [messageId]: helpful ? 'up' : 'down' });
    });
    try {
      await apiClient.post('/ai/feedback', {
        message_id: messageId,
        helpful: helpful
      });
    } catch (error) {
      console.error('Feedback error:', error);
    }
  };

  // Quick action buttons
  const quickActions = [
    {
      icon: '🎓',
      label: 'Recommend Sessions',
      action: 'Recommend sessions for me'
    },
    {
      icon: '👥',
      label: 'Find People',
      action: 'Find people to network with'
    },
    {
      icon: '📝',
      label: 'Summarize Session',
      action: 'Summarize a session'
    },
    {
      icon: '📚',
      label: 'Quiz Questions',
      action: 'Generate quiz questions'
    }
  ];

  return h(
    React.Fragment,
    null,
    // Floating Bubble Button
    h(
      'button',
      {
        type: 'button',
        onClick: function () {
          setIsOpen(!isOpen);
        },
        title: 'EventAI Assistant',
        className:
          'fixed bottom-20 right-6 rounded-full shadow-lg transition-all duration-300 hover:scale-110 z-40 ' +
          (isOpen
            ? 'bg-purple-600 hover:bg-purple-700 text-white w-12 h-12 flex items-center justify-center'
            : 'bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white w-14 h-14 flex items-center justify-center shadow-xl')
      },
      isOpen ? h(X, { size: 24 }) : h(MessageCircle, { size: 28 })
    ),

    // Backdrop overlay
    h(
      'div',
      {
        className:
          'fixed inset-0 z-50 transition-opacity duration-300 ' +
          (isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'),
        onClick: function () {
          setIsOpen(false);
        }
      },
      h('div', {
        className:
          'bg-black/50 absolute inset-0 transition-opacity ' +
          (isOpen ? 'opacity-100' : 'opacity-0')
      })
    ),

    // Chat Panel
    h(
      'div',
      {
        className:
          'fixed bottom-0 right-0 h-[85vh] w-full md:w-96 md:bottom-6 md:right-6 md:h-[540px] md:rounded-xl bg-white dark:bg-slate-800 shadow-2xl z-50 transition-transform duration-300 transform flex flex-col border border-slate-200 dark:border-slate-700 ' +
          (isOpen ? 'translate-y-0' : 'translate-y-full md:translate-y-[650px]')
      },
      // Header
      h(
        'div',
        {
          className:
            'bg-gradient-to-r from-purple-500 to-purple-600 text-white p-4 rounded-t-xl flex items-center justify-between'
        },
        h(
          'div',
          { className: 'flex items-center gap-2.5' },
          h(
            'div',
            { className: 'w-9 h-9 bg-white/20 rounded-full flex items-center justify-center' },
            h(MessageCircle, { size: 18 })
          ),
          h(
            'div',
            null,
            h(
              'h3',
              { className: 'font-semibold text-sm flex items-center gap-1.5' },
              'EventAI Assistant',
              h(Sparkles, { size: 14, className: 'text-purple-200' })
            ),
            h('p', { className: 'text-xs text-purple-100' }, 'Online & ready to help')
          )
        ),
        h(
          'button',
          {
            type: 'button',
            onClick: function () {
              setIsOpen(false);
            },
            className: 'hover:bg-white/20 p-1.5 rounded-full transition-colors'
          },
          h(X, { size: 20 })
        )
      ),

      // Messages Area
      h(
        'div',
        { className: 'flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-800' },
        messages.map(function (message) {
          const isUser = message.sender === 'user';
          const hasSuggestions =
            !isUser &&
            Array.isArray(message.suggestions) &&
            message.suggestions.length !== 0;

          return h(
            'div',
            {
              key: message.id,
              className: 'flex flex-col ' + (isUser ? 'items-end' : 'items-start')
            },
            h(
              'div',
              {
                className:
                  'max-w-xs lg:max-w-sm px-4 py-3 rounded-xl shadow-sm ' +
                  (isUser
                    ? 'bg-purple-600 text-white rounded-br-none'
                    : 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-600 rounded-bl-none')
              },
              h('p', { className: 'text-sm leading-relaxed whitespace-pre-wrap' }, message.text),

              // Helpful / Not helpful feedback buttons for AI messages
              !isUser &&
                h(
                  'div',
                  {
                    className:
                      'flex gap-2 mt-2 pt-2 border-t border-slate-100 dark:border-slate-600'
                  },
                  h(
                    'button',
                    {
                      type: 'button',
                      onClick: function () {
                        handleFeedback(message.id, true);
                      },
                      className:
                        'text-xs px-2 py-1 rounded transition-colors flex items-center gap-1 ' +
                        (feedbackGiven[message.id] === 'up'
                          ? 'bg-purple-100 text-purple-700 font-medium'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300')
                    },
                    h(ThumbsUp, { size: 12 }),
                    'Helpful'
                  ),
                  h(
                    'button',
                    {
                      type: 'button',
                      onClick: function () {
                        handleFeedback(message.id, false);
                      },
                      className:
                        'text-xs px-2 py-1 rounded transition-colors flex items-center gap-1 ' +
                        (feedbackGiven[message.id] === 'down'
                          ? 'bg-purple-100 text-purple-700 font-medium'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300')
                    },
                    h(ThumbsDown, { size: 12 }),
                    'Not helpful'
                  )
                ),

              h(
                'p',
                {
                  className:
                    'text-xs mt-1 ' + (isUser ? 'text-purple-100' : 'text-slate-400')
                },
                message.timestamp instanceof Date
                  ? message.timestamp.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })
                  : ''
              )
            ),

            // Follow-up Suggestion Chips (from PicbotScreen)
            hasSuggestions &&
              h(
                'div',
                { className: 'flex flex-wrap gap-1.5 mt-2' },
                message.suggestions.map(function (suggestion, sIdx) {
                  return h(
                    'button',
                    {
                      key: sIdx,
                      type: 'button',
                      disabled: loading,
                      onClick: function () {
                        handleSuggestion(suggestion);
                      },
                      className:
                        'text-xs px-3 py-1 bg-white dark:bg-slate-700 border border-purple-200 dark:border-purple-600 text-purple-700 dark:text-purple-300 rounded-full hover:bg-purple-50 dark:hover:bg-slate-600 transition-colors shadow-sm'
                    },
                    suggestion
                  );
                })
              )
          );
        }),

        // Loading indicator
        loading &&
          h(
            'div',
            { className: 'flex justify-start' },
            h(
              'div',
              {
                className:
                  'flex items-center gap-2 px-4 py-3 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 shadow-sm'
              },
              h(Loader, { size: 16, className: 'animate-spin text-purple-600' }),
              h(
                'span',
                { className: 'text-xs text-slate-600 dark:text-slate-300' },
                'EventAI Assistant is thinking...'
              )
            )
          ),

        h('div', { ref: messagesEndRef })
      ),

      // Quick Actions Grid (shown initially)
      messages.length === 1 &&
        !loading &&
        h(
          'div',
          {
            className:
              'px-4 py-2.5 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700'
          },
          h(
            'p',
            { className: 'text-xs font-medium text-slate-500 dark:text-slate-400 mb-2' },
            'Quick actions:'
          ),
          h(
            'div',
            { className: 'grid grid-cols-2 gap-1.5' },
            quickActions.map(function (item, idx) {
              return h(
                'button',
                {
                  key: idx,
                  type: 'button',
                  onClick: function () {
                    handleSuggestion(item.action);
                  },
                  className:
                    'px-2.5 py-1.5 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors text-xs text-slate-700 dark:text-slate-200 font-medium flex items-center gap-1.5 text-left'
                },
                h('span', null, item.icon),
                h('span', { className: 'truncate' }, item.label)
              );
            })
          )
        ),

      // Input Area
      h(
        'div',
        {
          className:
            'border-t border-slate-200 dark:border-slate-700 p-3 bg-white dark:bg-slate-800 rounded-b-xl'
        },
        h(
          'form',
          {
            onSubmit: function (e) {
              e.preventDefault();
              handleSendMessage(inputValue);
            },
            className: 'flex gap-2'
          },
          h('input', {
            type: 'text',
            placeholder: 'Ask about sessions, speakers, or matches...',
            value: inputValue,
            onChange: function (e) {
              setInputValue(e.target.value);
            },
            disabled: loading,
            className:
              'flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-slate-700 dark:text-white text-sm disabled:opacity-50'
          }),
          h(
            'button',
            {
              type: 'submit',
              disabled: !inputValue.trim() || loading,
              className:
                'px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-all duration-200 flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed'
            },
            h(Send, { size: 15 }),
            h('span', { className: 'text-sm' }, 'Send')
          )
        )
      )
    )
  );
}

export default AIAssistant;