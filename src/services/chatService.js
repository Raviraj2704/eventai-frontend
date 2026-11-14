// ============================================================================
// File: src/services/chatService.js
// Purpose: Handles all API calls for the real-time chat and request system
// ============================================================================

import apiClient from '../config/apiClient';

const chatService = {
  /**
   * Fetch the grouped directory of active, received, and sent chat requests
   */
  async getChatList() {
    try {
      const response = await apiClient.get('/chat/list');
      return { success: true, data: response.data.data };
    } catch (error) {
      console.error('Error fetching chat list:', error);
      return { success: false, error: error.response?.data?.detail || 'Failed to load chats' };
    }
  },

  /**
   * Send a new chat request to a user
   */
  async sendChatRequest(userId) {
    try {
      const response = await apiClient.post(`/chat/request/${userId}`);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || 'Failed to send request' };
    }
  },

  /**
   * Accept or Reject an incoming chat request
   * @param {number} connectionId 
   * @param {string} status 'accepted' or 'rejected'
   */
  async respondToRequest(connectionId, status) {
    try {
      const response = await apiClient.put(`/chat/respond/${connectionId}`, { status });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || 'Failed to respond' };
    }
  },

  /**
   * Load message history for an active connection
   */
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

  /**
   * Send a new text message in an active chat
   */
  async sendMessage(connectionId, text) {
    try {
      const response = await apiClient.post(`/chat/${connectionId}/messages`, { content: text });
      return { success: true, data: response.data.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || 'Failed to send message' };
    }
  }
};

export default chatService;