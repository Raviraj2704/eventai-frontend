// ============================================================================
// Picbot Screen
// ============================================================================
// File: src/pages/main/PicbotScreen.jsx
// Purpose: AI chatbot for event assistance (Real Groq AI + useFeatureManagement)
// Status: Production-Ready ✅

import React, { useState, useRef, useEffect } from 'react';
import { Send, MessageCircle, Sparkles } from 'lucide-react';
import Header from '../../components/layout/Header';
import apiClient from '../../config/apiClient';
import { useFeatureManagement } from '../../hooks/useFeatureManagement';

const PicbotScreen = () => {
  // Integrate useFeatureManagement('picbot') - Chat only (Create: false, Delete: false)
  const { canCreate, canDelete } = useFeatureManagement('picbot');

  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hi! I'm EventAI's assistant powered by AI. Ask me about sessions, speakers, networking matches, or your schedule!",
      sender: 'bot',
      timestamp: new Date(),
      suggestions: ['Recommend sessions', 'Find people to meet', 'Event schedule']
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessageText = async (textToSend) => {
    const trimmed = (textToSend || '').trim();
    if (!trimmed || isLoading) return;

    const userMessage = {
      id: Date.now(),
      text: trimmed,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await apiClient.post('/ai/chat', {
        message: trimmed,
        context: 'general'
      });

      const data = response?.data || {};
      const replyText =
        data.response ||
        data.message ||
        data.data?.response ||
        "I'm here to help you navigate NextGen AI Expo 2026! Check out the Sessions or Networking tabs for more.";

      const botMessage = {
        id: Date.now() + 1,
        text: replyText,
        sender: 'bot',
        timestamp: new Date(),
        suggestions: Array.isArray(data.suggestions) ? data.suggestions : []
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error('Picbot chat error:', error);
      const fallbackMessage = {
        id: Date.now() + 1,
        text: "I'm having trouble reaching the AI server right now, but I can still help! Try exploring the Schedule, Speakers, or AI Matches sections.",
        sender: 'bot',
        timestamp: new Date(),
        suggestions: ['Browse sessions', 'View speakers', 'AI Matches']
      };
      setMessages((prev) => [...prev, fallbackMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    await sendMessageText(inputValue);
  };

  return React.createElement(
    React.Fragment,
    null,
    React.createElement(Header, null),
    React.createElement(
      'main',
      { className: 'pb-20 md:pb-0' },
      React.createElement(
        'div',
        { className: 'container-max py-8 h-[calc(100vh-160px)] flex flex-col' },
        React.createElement(
          'div',
          { className: 'mb-6 flex items-center justify-between' },
          React.createElement(
            'div',
            { className: 'flex items-center gap-3' },
            React.createElement(
              'div',
              {
                className:
                  'w-10 h-10 bg-gradient-to-br from-primary-600 to-secondary-600 rounded-full flex items-center justify-center'
              },
              React.createElement(MessageCircle, { className: 'w-6 h-6 text-white' })
            ),
            React.createElement(
              'div',
              null,
              React.createElement(
                'h1',
                { className: 'text-2xl font-bold text-neutral-900 flex items-center gap-2' },
                'PicBot Assistant',
                React.createElement(Sparkles, { className: 'w-5 h-5 text-primary-600' })
              ),
              React.createElement('p', { className: 'text-sm text-neutral-600' }, 'AI-powered event assistant')
            )
          )
        ),
        /* NO Create or Delete buttons for Picbot (canCreate: false, canDelete: false) */
        React.createElement(
          'div',
          { className: 'flex-1 overflow-y-auto mb-6 space-y-4 p-4 bg-neutral-50 rounded-lg border border-neutral-200' },
          messages.map((message) =>
            React.createElement(
              'div',
              {
                key: message.id,
                className: 'flex flex-col ' + (message.sender === 'user' ? 'items-end' : 'items-start')
              },
              React.createElement(
                'div',
                {
                  className:
                    'max-w-xs md:max-w-md lg:max-w-lg px-4 py-3 rounded-lg ' +
                    (message.sender === 'user'
                      ? 'bg-primary-600 text-white rounded-br-none'
                      : 'bg-white text-neutral-900 border border-neutral-200 rounded-bl-none shadow-sm')
                },
                React.createElement('p', { className: 'text-sm whitespace-pre-wrap' }, message.text),
                React.createElement(
                  'p',
                  {
                    className:
                      'text-xs mt-1 ' + (message.sender === 'user' ? 'text-white/70' : 'text-neutral-500')
                  },
                  message.timestamp instanceof Date
                    ? message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : ''
                )
              ),
              message.sender === 'bot' &&
                Array.isArray(message.suggestions) &&
                message.suggestions.length > 0 &&
                React.createElement(
                  'div',
                  { className: 'flex flex-wrap gap-2 mt-2' },
                  message.suggestions.map((suggestion, idx) =>
                    React.createElement(
                      'button',
                      {
                        key: idx,
                        type: 'button',
                        onClick: () => sendMessageText(suggestion),
                        disabled: isLoading,
                        className:
                          'text-xs px-3 py-1.5 bg-white border border-primary-200 text-primary-700 rounded-full hover:bg-primary-50 transition-colors'
                      },
                      suggestion
                    )
                  )
                )
            )
          ),
          isLoading &&
            React.createElement(
              'div',
              { className: 'flex justify-start' },
              React.createElement(
                'div',
                { className: 'bg-white text-neutral-900 border border-neutral-200 px-4 py-3 rounded-lg rounded-bl-none' },
                React.createElement(
                  'div',
                  { className: 'flex gap-2 items-center' },
                  React.createElement('div', { className: 'w-2 h-2 bg-primary-500 rounded-full animate-bounce' }),
                  React.createElement('div', { className: 'w-2 h-2 bg-primary-500 rounded-full animate-bounce' }),
                  React.createElement('div', { className: 'w-2 h-2 bg-primary-500 rounded-full animate-bounce' }),
                  React.createElement('span', { className: 'text-xs text-neutral-500 ml-1' }, 'PicBot is thinking...')
                )
              )
            ),
          React.createElement('div', { ref: messagesEndRef })
        ),
        React.createElement(
          'form',
          { onSubmit: handleSendMessage, className: 'flex gap-3' },
          React.createElement('input', {
            type: 'text',
            value: inputValue,
            onChange: (e) => setInputValue(e.target.value),
            placeholder: 'Ask PicBot about sessions, speakers, or networking...',
            disabled: isLoading,
            className: 'flex-1 p-3 bg-white border border-neutral-300 rounded-lg focus:outline-none focus:border-primary-600'
          }),
          React.createElement(
            'button',
            {
              type: 'submit',
              disabled: isLoading || !inputValue.trim(),
              className: 'btn btn-primary px-6 py-3 flex items-center gap-2 rounded-lg'
            },
            React.createElement(Send, { className: 'w-4 h-4' }),
            'Send'
          )
        )
      )
    )
  );
};

export default PicbotScreen;