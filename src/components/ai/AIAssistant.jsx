import React, { useState, useRef, useEffect } from 'react';
import { X, Send, MessageCircle, Loader, ThumbsUp, ThumbsDown } from 'lucide-react';
import apiClient from '../../config/apiClient';

const AIAssistant = ({ userProfile }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hey! 👋 I'm your EventAI Assistant. I can help you discover sessions, find networking opportunities, and much more. What would you like to do?",
      sender: 'ai',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([
    'Recommend sessions for me',
    'Find people to network with',
    'Summarize a session',
    'Generate quiz questions',
    'Career advice'
  ]);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle suggestion click
  const handleSuggestion = (suggestion) => {
    setInputValue(suggestion);
    handleSendMessage(suggestion);
  };

  // Send message to AI
  const handleSendMessage = async (messageText = inputValue) => {
    if (!messageText.trim()) return;

    // Add user message
    const userMessage = {
      id: messages.length + 1,
      text: messageText,
      sender: 'user',
      timestamp: new Date()
    };
    setMessages([...messages, userMessage]);
    setInputValue('');
    setLoading(true);

    try {
      // Call backend AI endpoint
      const response = await apiClient.post('/ai/chat', {
        message: messageText,
        user_id: userProfile?.id,
        context: 'session_discovery'
      });

      const aiMessage = {
        id: messages.length + 2,
        text: response.response || response.message,
        sender: 'ai',
        suggestions: response.suggestions || [],
        metadata: response.metadata || {},
        timestamp: new Date()
      };

      setMessages((prev) => [...prev, aiMessage]);
      setSuggestions(response.suggestions || []);
    } catch (error) {
      console.error('AI response error:', error);
      const errorMessage = {
        id: messages.length + 2,
        text: 'Sorry, I encountered an error. Please try again.',
        sender: 'ai',
        isError: true,
        timestamp: new Date()
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  // Handle feedback
  const handleFeedback = async (messageId, helpful) => {
    try {
      await apiClient.post(`/ai/feedback`, {
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

  return (
    <>
      {/* Floating Bubble Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-20 right-6 rounded-full shadow-lg transition-all duration-300 hover:scale-110 z-40 ${
          isOpen
            ? 'bg-purple-600 hover:bg-purple-700 text-white w-12 h-12 flex items-center justify-center'
            : 'bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white w-14 h-14 flex items-center justify-center shadow-xl'
        }`}
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={28} />}
      </button>

      {/* Chat Drawer - Mobile Slide Sheet */}
      <div
        className={`fixed inset-0 z-50 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsOpen(false)}
      >
        <div
          className={`bg-black/50 absolute inset-0 transition-opacity ${
            isOpen ? 'opacity-100' : 'opacity-0'
          }`}
        />
      </div>

      {/* Chat Panel - Responsive */}
      <div
        className={`fixed bottom-0 right-0 h-[85vh] w-full md:w-96 md:bottom-6 md:h-96 md:rounded-lg bg-white dark:bg-slate-800 shadow-2xl z-50 transition-transform duration-300 transform flex flex-col border border-slate-200 dark:border-slate-700 ${
          isOpen ? 'translate-y-0' : 'translate-y-full md:translate-y-96'
        }`}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-4 rounded-t-lg md:rounded-t-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <MessageCircle size={18} />
            </div>
            <div>
              <h3 className="font-semibold text-sm">EventAI Assistant</h3>
              <p className="text-xs text-purple-100">Online & ready to help</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="hover:bg-white/20 p-1 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white dark:bg-slate-800">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-sm px-4 py-3 rounded-lg shadow-sm ${
                  message.sender === 'user'
                    ? 'bg-purple-500 text-white rounded-br-none'
                    : message.isError
                    ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-bl-none border border-red-200 dark:border-red-700'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white rounded-bl-none'
                }`}
              >
                <p className="text-sm leading-relaxed">{message.text}</p>

                {/* Feedback buttons for AI messages */}
                {message.sender === 'ai' && !message.isError && (
                  <div className="flex gap-2 mt-2 pt-2 border-t border-slate-200 dark:border-slate-600">
                    <button
                      onClick={() => handleFeedback(message.id, true)}
                      className="text-xs px-2 py-1 hover:bg-slate-200 dark:hover:bg-slate-600 rounded transition-colors flex items-center gap-1"
                    >
                      <ThumbsUp size={12} />
                      Helpful
                    </button>
                    <button
                      onClick={() => handleFeedback(message.id, false)}
                      className="text-xs px-2 py-1 hover:bg-slate-200 dark:hover:bg-slate-600 rounded transition-colors flex items-center gap-1"
                    >
                      <ThumbsDown size={12} />
                      Not helpful
                    </button>
                  </div>
                )}

                <p className="text-xs opacity-70 mt-1">
                  {message.timestamp.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>
          ))}

          {/* Loading indicator */}
          {loading && (
            <div className="flex justify-start">
              <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-slate-100 dark:bg-slate-700">
                <Loader size={16} className="animate-spin text-purple-500" />
                <span className="text-sm text-slate-600 dark:text-slate-300">
                  Assistant is thinking...
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggestions - Show only when no recent messages */}
        {messages.length <= 1 && !loading && (
          <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-700">
            <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">
              Quick actions:
            </p>
            <div className="grid grid-cols-2 gap-2">
              {quickActions.map((action, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSuggestion(action.action)}
                  className="px-3 py-2 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors text-xs text-slate-700 dark:text-slate-300 font-medium flex items-center gap-1"
                >
                  <span>{action.icon}</span>
                  <span className="line-clamp-1">{action.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="border-t border-slate-200 dark:border-slate-700 p-4 bg-white dark:bg-slate-800 rounded-b-lg md:rounded-b-lg">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Ask me anything..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              disabled={loading}
              className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-slate-700 dark:text-white text-sm disabled:opacity-50"
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={!inputValue.trim() || loading}
              className="px-4 py-2 bg-purple-500 hover:bg-purple-600 dark:bg-purple-600 dark:hover:bg-purple-700 text-white rounded-lg font-medium transition-all duration-200 hover:shadow-md active:scale-95 flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={16} />
              <span className="hidden sm:inline text-sm">Send</span>
            </button>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            Shift + Enter for new line
          </p>
        </div>
      </div>
    </>
  );
};

export default AIAssistant;