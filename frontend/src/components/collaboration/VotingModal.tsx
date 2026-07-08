import React from 'react';
import { CheckIcon, XCircleIcon } from '@heroicons/react/24/outline';

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
  const [timeLeft, setTimeLeft] = React.useState(10);
  const timeoutRef = React.useRef<number | null>(null);
  const countdownRef = React.useRef<number | null>(null);

  if (!isOpen) return null;

  const { voting_data = {}, total_participants, current_votes = 0, question } = votingData;
  const required_votes = total_participants;
  const pendingVotes = required_votes - current_votes;
  const progressPct = Math.min((current_votes / required_votes) * 100, 100);

  const currentUserVote = currentUserId ? voting_data[currentUserId] : undefined;
  const hasCurrentUserVoted = currentUserVote !== undefined;

  // Timer urgency level
  const urgency = timeLeft <= 3 ? 'critical' : timeLeft <= 5 ? 'warning' : 'normal';

  React.useEffect(() => {
    if (!isOpen) {
      setTimeLeft(10);
      return;
    }

    setTimeLeft(10);

    countdownRef.current = setInterval(() => {
      setTimeLeft(prev => (prev <= 1 ? 0 : prev - 1));
    }, 1000);

    timeoutRef.current = setTimeout(() => {
      const currentVotingData = votingData.voting_data || {};
      const yesVotes = Object.values(currentVotingData).filter(v => v === true).length;
      const noVotes = Object.values(currentVotingData).filter(v => v === false).length;
      onVote(yesVotes + noVotes > 0 ? yesVotes > noVotes : false);
    }, 10000);

    return () => {
      if (timeoutRef.current) { clearTimeout(timeoutRef.current); timeoutRef.current = null; }
      if (countdownRef.current) { clearInterval(countdownRef.current); countdownRef.current = null; }
    };
  }, [isOpen, votingData.vote_id]);

  React.useEffect(() => {
    if (!isOpen || !votingData.voting_data) return;
    const totalVoted = Object.keys(votingData.voting_data).length;
    if (totalVoted >= total_participants && timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      clearInterval(countdownRef.current!);
      timeoutRef.current = null;
      countdownRef.current = null;
      setTimeLeft(0);
    }
  }, [isOpen, votingData.voting_data, total_participants]);

  return (
    <div className="vm-overlay" onClick={e => e.stopPropagation()}>
      <div className="vm-card" onClick={e => e.stopPropagation()}>

        {/* ── Header ── */}
        <div className="vm-header">
          <div className="vm-header-top">
            <div className="vm-title-group">
              <span className="vm-icon">💾</span>
              <h2 className="vm-title">Save Story Vote</h2>
            </div>
            <div className={`vm-timer vm-timer--${urgency}`}>
              <svg className="vm-timer-ring" viewBox="0 0 36 36">
                <circle className="vm-timer-track" cx="18" cy="18" r="15.9" />
                <circle
                  className="vm-timer-fill"
                  cx="18" cy="18" r="15.9"
                  strokeDasharray={`${(timeLeft / 10) * 100} 100`}
                />
              </svg>
              <span className="vm-timer-label">{timeLeft}s</span>
            </div>
          </div>
          <p className="vm-subtitle">
            {question || `${initiatedBy} wants to save this collaborative story`}
          </p>
          {urgency !== 'normal' && (
            <div className="vm-urgency-banner">
              ⚠️ Auto-resolving in {timeLeft}s based on majority
            </div>
          )}
        </div>

        {/* ── Body ── */}
        <div className="vm-body">

          {/* Progress */}
          <div className="vm-progress-section">
            <div className="vm-progress-labels">
              <span className="vm-progress-text">Votes collected</span>
              <span className="vm-progress-count">{current_votes} / {required_votes}</span>
            </div>
            <div className="vm-progress-track">
              <div className="vm-progress-fill" style={{ width: `${progressPct}%` }} />
            </div>
            {pendingVotes > 0 && (
              <p className="vm-progress-hint">Waiting for {pendingVotes} more vote(s)…</p>
            )}
          </div>

          {/* Participants */}
          <div className="vm-participants-section">
            <h3 className="vm-section-label">Participants</h3>
            <div className="vm-participants-list">
              {participants && participants.length > 0
                ? participants.map((p, i) => {
                    const pid = p.user_id;
                    const voted = voting_data[pid] !== undefined;
                    const vote = voting_data[pid];
                    const name = p.display_name || p.username || 'Unknown';

                    return (
                      <div key={`${pid}-${i}`} className="vm-participant">
                        <div className="vm-avatar">{name.charAt(0).toUpperCase()}</div>
                        <span className="vm-participant-name">{name}</span>
                        {voted
                          ? vote
                            ? <span className="vm-badge vm-badge--yes"><CheckIcon className="vm-badge-icon" />Agreed</span>
                            : <span className="vm-badge vm-badge--no"><XCircleIcon className="vm-badge-icon" />Declined</span>
                          : <span className="vm-badge vm-badge--pending">Pending…</span>
                        }
                      </div>
                    );
                  })
                : <div className="vm-empty">No participants</div>
              }
            </div>
          </div>

          {/* Buttons */}
          <div className="vm-actions">
            <button
              onClick={e => { e.preventDefault(); e.stopPropagation(); onVote(false); }}
              disabled={hasCurrentUserVoted}
              className={`vm-btn vm-btn--no ${hasCurrentUserVoted && currentUserVote === false ? 'vm-btn--selected' : ''} ${hasCurrentUserVoted && currentUserVote !== false ? 'vm-btn--disabled' : ''}`}
            >
              <XCircleIcon className="vm-btn-icon" />
              <span>{hasCurrentUserVoted && currentUserVote === false ? 'You: Not Yet' : 'Not Yet'}</span>
            </button>
            <button
              onClick={e => { e.preventDefault(); e.stopPropagation(); onVote(true); }}
              disabled={hasCurrentUserVoted}
              className={`vm-btn vm-btn--yes ${hasCurrentUserVoted && currentUserVote === true ? 'vm-btn--selected' : ''} ${hasCurrentUserVoted && currentUserVote !== true ? 'vm-btn--disabled' : ''}`}
            >
              <CheckIcon className="vm-btn-icon" />
              <span>{hasCurrentUserVoted && currentUserVote === true ? 'You: Agreed' : 'Agree to Save'}</span>
            </button>
          </div>

          <p className="vm-footer-note">All participants must agree to save the story</p>
        </div>
      </div>
    </div>
  );
};
