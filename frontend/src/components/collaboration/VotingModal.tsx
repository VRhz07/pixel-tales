import React from 'react';
import { XMarkIcon, CheckIcon, XCircleIcon } from '@heroicons/react/24/outline';

interface VotingModalProps {
  isOpen: boolean;
  onVote: (agree: boolean) => void;
  votingData: {
    vote_id: string;
    initiated_by: number;
    initiated_by_username: string;
    total_participants: number;
    question: string;
    voting_data?: { [key: string]: boolean };
    current_votes?: number;
  };
  participants: Array<{
    user_id: number;
    username: string;
    display_name: string;
  }>;
  initiatedBy: string;
  currentUserId?: number;
}

export const VotingModal: React.FC<VotingModalProps> = ({
  isOpen,
  onVote,
  votingData,
  participants,
  initiatedBy,
  currentUserId
}) => {
  console.log('🗳️ VotingModal render:', { isOpen, votingData, participants, initiatedBy });
  
  // Timeout countdown state
  const [timeLeft, setTimeLeft] = React.useState(10);
  const timeoutRef = React.useRef<number | null>(null);
  const countdownRef = React.useRef<number | null>(null);
  
  if (!isOpen) return null;

  const { voting_data = {}, total_participants, current_votes = 0, question } = votingData;
  const required_votes = total_participants;
  const pendingVotes = required_votes - current_votes;
  
  // Check if current user has voted and what they voted
  const currentUserVote = currentUserId ? voting_data[currentUserId] : undefined;
  const hasCurrentUserVoted = currentUserVote !== undefined;
  
  console.log('🗳️ VotingModal computed values:', { 
    voting_data, 
    total_participants, 
    current_votes, 
    required_votes, 
    pendingVotes,
    participantsCount: participants.length 
  });

  // Timeout and auto-resolution logic
  React.useEffect(() => {
    if (!isOpen) {
      // Reset timer when modal closes
      setTimeLeft(10);
      return;
    }
    
    console.log('🕐 VotingModal: Starting 10-second timeout');
    setTimeLeft(10);
    
    // Start countdown
    countdownRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          console.log('⏰ VotingModal: Countdown reached 0');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    // Auto-resolve after 10 seconds
    timeoutRef.current = setTimeout(() => {
      console.log('⏰ VotingModal: 10-second timeout reached, auto-resolving vote');
      
      // Get the latest voting data at timeout
      const currentVotingData = votingData.voting_data || {};
      const yesVotes = Object.values(currentVotingData).filter(vote => vote === true).length;
      const noVotes = Object.values(currentVotingData).filter(vote => vote === false).length;
      const totalVotes = yesVotes + noVotes;
      
      console.log('🗳️ Timeout auto-resolution:', {
        yesVotes,
        noVotes,
        totalVotes,
        totalParticipants: total_participants,
        pendingVotes
      });
      
      // Auto-resolve based on majority of responses received
      if (totalVotes > 0) {
        const autoVote = yesVotes > noVotes; // Majority wins
        console.log(`⚖️ Auto-resolving vote: ${autoVote ? 'YES' : 'NO'} (${yesVotes} yes vs ${noVotes} no)`);
        onVote(autoVote);
      } else {
        // If no votes at all, default to NO to be safe
        console.log('🚫 No votes received, auto-resolving to NO');
        onVote(false);
      }
    }, 10000);
    
    return () => {
      console.log('🧹 VotingModal: Cleaning up timers');
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
    };
  }, [isOpen, votingData.vote_id]); // Only depend on isOpen and vote_id to prevent restarts

  // Stop timeout if all participants have voted
  React.useEffect(() => {
    if (!isOpen || !votingData.voting_data) return;
    
    const totalVoted = Object.keys(votingData.voting_data).length;
    if (totalVoted >= total_participants && timeoutRef.current) {
      console.log('✅ All participants voted, clearing timeout');
      clearTimeout(timeoutRef.current);
      clearInterval(countdownRef.current);
      timeoutRef.current = null;
      countdownRef.current = null;
      setTimeLeft(0); // Set countdown to 0 to reflect that voting is complete
    }
  }, [isOpen, votingData.voting_data, total_participants]);

  console.log('🎨 About to return VotingModal JSX');
  
  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        zIndex: 999999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
      onClick={(e) => {
        // Prevent closing modal when clicking overlay
        e.stopPropagation();
      }}
    >
      <div 
        onClick={(e) => {
          // Stop propagation so clicking inside modal doesn't trigger overlay click
          e.stopPropagation();
        }}
        style={{
        backgroundColor: 'white',
        borderRadius: '24px',
        maxWidth: '500px',
        width: '100%',
        margin: '16px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-6 text-white">
          <div className="flex justify-between items-start mb-2">
            <h2 className="text-2xl font-bold">💾 Save Story Vote</h2>
            <div className="flex items-center gap-2">
              <span className="text-sm opacity-75">⏱️ Time left:</span>
              <span className={`text-lg font-mono font-bold px-2 py-1 rounded ${
                timeLeft <= 3 
                  ? 'bg-red-500 text-white' 
                  : timeLeft <= 5 
                    ? 'bg-yellow-500 text-black' 
                    : 'bg-green-500 text-white'
              }`}>
                {timeLeft}s
              </span>
            </div>
          </div>
          <p className="text-purple-100">
            {question || `${initiatedBy} wants to save this collaborative story`}
          </p>
          {timeLeft <= 5 && (
            <p className="text-yellow-200 text-sm mt-2 animate-pulse">
              ⚠️ Vote will auto-resolve in {timeLeft} seconds based on majority!
            </p>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Progress */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">
                Votes Collected
              </span>
              <span className="text-sm font-bold text-purple-600">
                {current_votes} / {required_votes}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-purple-500 to-pink-500 h-full transition-all duration-300 ease-out"
                style={{ width: `${(current_votes / required_votes) * 100}%` }}
              />
            </div>
            {pendingVotes > 0 && (
              <p className="text-xs text-gray-500 mt-2">
                Waiting for {pendingVotes} more vote(s)...
              </p>
            )}
          </div>

          {/* Participants List */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              Participants
            </h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {participants && participants.length > 0 ? participants.map((participant, index) => {
                const participantId = participant.user_id || participant.id;
                console.log('🧑 Rendering participant:', participant);
                const hasVoted = voting_data[participantId] !== undefined;
                const vote = voting_data[participantId];

                return (
                  <div
                    key={`${participantId}-${participant.username || index}`}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {(participant.display_name || participant.username || '?').charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm font-medium text-gray-700">
                        {participant.display_name || participant.username || 'Unknown'}
                      </span>
                    </div>

                    {hasVoted ? (
                      vote ? (
                        <div className="flex items-center space-x-1 text-green-600">
                          <CheckIcon className="w-5 h-5" />
                          <span className="text-xs font-semibold">Agreed</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-1 text-red-600">
                          <XCircleIcon className="w-5 h-5" />
                          <span className="text-xs font-semibold">Disagreed</span>
                        </div>
                      )
                    ) : (
                      <span className="text-xs text-gray-400 font-medium">
                        Pending...
                      </span>
                    )}
                  </div>
                );
              }) : <div className="text-center text-gray-500">No participants</div>}
            </div>
          </div>

          {/* Voting Buttons */}
          <div className="flex gap-3">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('❌ Not Yet button clicked');
                try {
                  onVote(false);
                } catch (error) {
                  console.error('Error voting:', error);
                }
              }}
              disabled={hasCurrentUserVoted}
              className={`flex-1 py-3 px-4 font-semibold rounded-xl transition-colors duration-200 flex items-center justify-center space-x-2 ${
                hasCurrentUserVoted && currentUserVote === false
                  ? 'bg-red-500 text-white ring-2 ring-red-300' // User voted "Not Yet"
                  : hasCurrentUserVoted
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed' // User voted "Agree" - disable this button
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-700' // User hasn't voted yet
              }`}
            >
              <XCircleIcon className="w-5 h-5" />
              <span>{hasCurrentUserVoted && currentUserVote === false ? 'You Voted: Not Yet' : 'Not Yet'}</span>
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('✅ Agree button clicked');
                try {
                  onVote(true);
                } catch (error) {
                  console.error('Error voting:', error);
                }
              }}
              disabled={hasCurrentUserVoted}
              className={`flex-1 py-3 px-4 font-semibold rounded-xl transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl ${
                hasCurrentUserVoted && currentUserVote === true
                  ? 'bg-gradient-to-r from-green-500 to-green-600 text-white ring-2 ring-green-300' // User voted "Agree"
                  : hasCurrentUserVoted
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed' // User voted "Not Yet" - disable this button
                  : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white' // User hasn't voted yet
              }`}
            >
              <CheckIcon className="w-5 h-5" />
              <span>{hasCurrentUserVoted && currentUserVote === true ? 'You Voted: Agree' : 'Agree to Save'}</span>
            </button>
          </div>

          {/* Info Text */}
          <p className="text-xs text-center text-gray-500 mt-4">
            All participants must agree to save the story
          </p>
        </div>
      </div>
    </div>
  );
};
