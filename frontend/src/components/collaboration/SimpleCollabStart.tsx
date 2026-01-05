import React, { useState } from 'react';
import { UserGroupIcon } from '@heroicons/react/24/outline';
import { apiConfigService } from '../../services/apiConfig.service';

interface SimpleCollabStartProps {
  onStartCollab: (sessionId: string) => void;
}

export const SimpleCollabStart: React.FC<SimpleCollabStartProps> = ({ onStartCollab }) => {
  const [sessionId, setSessionId] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const createSession = async () => {
    console.log('🎨 Creating collaboration session...');
    setIsCreating(true);
    try {
      const token = localStorage.getItem('access_token');
      console.log('📡 Sending request to create session...');
      
      const response = await fetch(
        `${apiConfigService.getApiUrl()}/collaborate/create/`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            canvas_name: 'Quick Collab Session'
          })
        }
      );

      console.log('📥 Response status:', response.status);
      const data = await response.json();
      console.log('📦 Response data:', data);
      
      // Handle different response formats
      const sessionId = data.session_id || data.session?.session_id;
      
      if (sessionId) {
        console.log('✅ Session created:', sessionId);
        setSessionId(sessionId);
        onStartCollab(sessionId);
      } else {
        console.error('❌ No session_id in response:', data);
        alert('Failed to create session: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('❌ Failed to create session:', error);
      alert('Failed to create collaboration session: ' + error.message);
    } finally {
      setIsCreating(false);
    }
  };

  const joinSession = async () => {
    const sid = sessionId.trim();
    if (!sid) {
      alert('Please enter a session ID');
      return;
    }

    console.log('🔍 Checking if session exists:', sid);
    
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(
        `${apiConfigService.getApiUrl()}/collaborate/${sid}/`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Session exists:', data);
        onStartCollab(sid);
      } else {
        console.error('❌ Session not found');
        alert('Session not found. Please check the Session ID.');
      }
    } catch (error) {
      console.error('❌ Failed to check session:', error);
      alert('Failed to join session. Please check the Session ID.');
    }
  };

  console.log('🎯 SimpleCollabStart rendered!');
  
  return (
    <div 
      className="fixed top-4 right-4 z-[9999] bg-white rounded-xl shadow-xl border-2 border-purple-200 p-4 max-w-xs"
      style={{
        position: 'fixed',
        top: '16px',
        right: '16px',
        zIndex: 9999,
        backgroundColor: 'white',
        border: '2px solid purple'
      }}
    >
      <div className="flex items-center gap-2 mb-3">
        <UserGroupIcon className="w-5 h-5 text-purple-600" />
        <h3 className="font-bold text-gray-800">Quick Collab (Demo)</h3>
      </div>

      <div className="space-y-3">
        {/* Create New Session */}
        <button
          onClick={createSession}
          disabled={isCreating}
          className="w-full py-2 px-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-lg hover:from-purple-600 hover:to-pink-600 disabled:opacity-50"
        >
          {isCreating ? 'Creating...' : 'Create New Session'}
        </button>

        {/* Show Session ID if created */}
        {sessionId && (
          <div className="p-2 bg-green-50 border border-green-200 rounded text-xs">
            <p className="font-semibold text-green-800 mb-1">Session Created!</p>
            <p className="text-green-700 break-all">ID: {sessionId}</p>
            <p className="text-green-600 mt-1">Share this ID with others</p>
          </div>
        )}

        {/* Join Existing Session */}
        <div className="border-t pt-3">
          <input
            type="text"
            value={sessionId}
            onChange={(e) => setSessionId(e.target.value)}
            placeholder="Enter Session ID"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-2"
          />
          <button
            onClick={joinSession}
            className="w-full py-2 px-4 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600"
          >
            Join Session
          </button>
        </div>
      </div>
    </div>
  );
};
