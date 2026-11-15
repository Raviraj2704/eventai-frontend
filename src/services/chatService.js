// ============================================================================
// File: src/services/chatService.js
// Purpose: Handles all API calls for the real-time chat and request system
// ============================================================================

import apiClient from '../config/apiClient';

const chatService = {
  async getChatList() {
    try {
      const response = await apiClient.get('/chat/list');
      return { success: true, data: response.data.data };
    } catch (error) {
      console.error('Error fetching chat list:', error);
      return { success: false, error: error.response?.data?.detail || 'Failed to load chats' };
    }
  },

  async getAvailableUsers() {
    try {
      const response = await apiClient.get('/chat/users');
      return { success: true, data: response.data.data };
    } catch (error) {
      return { success: false, error: 'Failed to load users' };
    }
  },

  async sendChatRequest(userId) {
    try {
      const response = await apiClient.post(`/chat/request/${userId}`);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || 'Failed to send request' };
    }
  },

  async respondToRequest(connectionId, status) {
    try {
      const response = await apiClient.put(`/chat/respond/${connectionId}`, { status });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || 'Failed to respond' };
    }
  },

  async getMessages(connectionId) {
    try {
      const response = await apiClient.get(`/chat/${connectionId}/messages`);
      return { 
        success: true, 
        data: response.data.data, 
        connection_status: response.data.connection_status 
      };
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || 'Failed to load messages' };
    }
  },

  async sendMessage(connectionId, text) {
    try {
      const response = await apiClient.post(`/chat/${connectionId}/messages`, { content: text });
      return { success: true, data: response.data.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || 'Failed to send message' };
    }
  },

  async deleteMessage(messageId) {
    try {
      const response = await apiClient.delete(`/chat/messages/${messageId}`);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || 'Failed to delete message' };
    }
  }
};

export default chatService;