/**
 * API Service for Collaboration Sessions
 */
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

interface CollaborationSession {
  session_id: string;
  join_code: string;
  canvas_name: string;
  invite_link: string;
  max_participants: number;
  expires_at: string;
  websocket_url: string;
}

interface SessionDetails {
  session_id: string;
  join_code: string;
  canvas_name: string;
  host: {
    id: number;
    username: string;
  };
  is_host: boolean;
  max_participants: number;
  participant_count: number;
  can_join: boolean;
  is_lobby_open: boolean;
  story_draft?: any;
  story_title?: string;
  participants: Array<{
    user_id: number;
    username: string;
    cursor_color: string;
    joined_at: string;
  }>;
  created_at: string;
  expires_at: string;
  websocket_url: string;
}

interface CreateSessionParams {
  canvas_name?: string;
  max_participants?: number;
  duration_hours?: number;
}

/**
 * Get authorization headers
 */
const getAuthHeaders = () => {
  const token = localStorage.getItem('access_token');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

/**
 * Create a new collaboration session
 */
export const createCollaborationSession = async (
  params: CreateSessionParams = {}
): Promise<CollaborationSession> => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/collaborate/create/`,
      params,
      { headers: getAuthHeaders() }
    );
    return response.data.session;
  } catch (error: any) {
    console.error('Failed to create collaboration session:', error);
    throw new Error(error.response?.data?.error || 'Failed to create session');
  }
};

/**
 * Get collaboration session details
 */
export const getCollaborationSession = async (
  sessionId: string
): Promise<SessionDetails> => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/collaborate/${sessionId}/`,
      { headers: getAuthHeaders() }
    );
    return response.data.session;
  } catch (error: any) {
    console.error('Failed to get collaboration session:', error);
    throw new Error(error.response?.data?.error || 'Failed to get session');
  }
};

/**
 * End a collaboration session (host only)
 */
export const endCollaborationSession = async (
  sessionId: string
): Promise<void> => {
  try {
    await axios.post(
      `${API_BASE_URL}/collaborate/${sessionId}/end/`,
      {},
      { headers: getAuthHeaders() }
    );
  } catch (error: any) {
    console.error('Failed to end collaboration session:', error);
    throw new Error(error.response?.data?.error || 'Failed to end session');
  }
};

/**
 * List user's collaboration sessions
 */
export const listUserSessions = async (): Promise<{
  hosted_sessions: any[];
  participated_sessions: any[];
}> => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/collaborate/sessions/list/`,
      { headers: getAuthHeaders() }
    );
    return response.data;
  } catch (error: any) {
    console.error('Failed to list collaboration sessions:', error);
    throw new Error(error.response?.data?.error || 'Failed to list sessions');
  }
};

/**
 * Join a collaboration session using a join code
 */
export const joinSessionByCode = async (
  joinCode: string
): Promise<SessionDetails> => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/collaborate/join-by-code/`,
      { join_code: joinCode.toUpperCase() },
      { headers: getAuthHeaders() }
    );
    return response.data.session;
  } catch (error: any) {
    console.error('Failed to join session by code:', error);
    throw new Error(error.response?.data?.error || 'Failed to join session');
  }
};
