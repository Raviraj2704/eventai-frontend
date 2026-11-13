import apiClient from '../config/apiClient';
import { useAuthStore } from '../store/authStore';

// Helper to get the current user ID for our API requests
const getUserId = () => {
  const user = useAuthStore.getState().user;
  return user?.id;
};

const chatService = {
  /**
   * Fetch all chat connections grouped by status
   */
  async getChatList() {
    const userId = getUserId();
    const response = await apiClient.get(`/chat/list?user_id=${userId}`);
    return response.data;
  },

  /**
   * Send a chat request to another user
   */
  async sendChatRequest(receiverId) {
    const userId = getUserId();
    const response = await apiClient.post(`/chat/request?user_id=${userId}`, {
      receiver_id: receiverId
    });
    return response.data;
  },

  /**
   * Accept or Reject an incoming chat request
   */
  async respondToRequest(connectionId, status) {
    const userId = getUserId();
    const response = await apiClient.put(`/chat/respond/${connectionId}?user_id=${userId}`, {
      status: status // 'accepted' or 'rejected'
    });
    return response.data;
  },

  /**
   * Fetch message history for a specific chat
   */
  async getMessages(connectionId) {
    const userId = getUserId();
    const response = await apiClient.get(`/chat/${connectionId}/messages?user_id=${userId}`);
    return response.data;
  },

  /**
   * Send a new message in an active chat
   */
  async sendMessage(connectionId, content) {
    const userId = getUserId();
    const response = await apiClient.post(`/chat/${connectionId}/messages?user_id=${userId}`, {
      content: content
    });
    return response.data;
  }
};

export default chatService;