import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Leaderboard.css';

const DEMO_LEADERS = [
  { _id: 'sample2',  name: 'Liam Chen',       role: 'Builder',         reputationScore: 112, profilePicture: 'https://i.pravatar.cc/300?img=11' },
  { _id: 'sample11', name: 'Mia Johnson',      role: 'AI Engineer',     reputationScore: 100, profilePicture: 'https://i.pravatar.cc/300?img=35' },
  { _id: 'sample1',  name: 'Emma Wilson',      role: 'Designer',        reputationScore: 95,  profilePicture: 'https://i.pravatar.cc/300?img=5'  },
  { _id: 'sample8',  name: 'Oliver Brown',     role: 'Builder',         reputationScore: 85,  profilePicture: 'https://i.pravatar.cc/300?img=56' },
  { _id: 'sample4',  name: 'Noah Thompson',    role: 'AI Engineer',     reputationScore: 78,  profilePicture: 'https://i.pravatar.cc/300?img=13' },
  { _id: 'sample6',  name: 'Jack Roberts',     role: 'Product Thinker', reputationScore: 60,  profilePicture: 'https://i.pravatar.cc/300?img=3'  },
  { _id: 'sample10', name: 'William Davis',    role: 'Product Thinker', reputationScore: 55,  profilePicture: 'https://i.pravatar.cc/300?img=52' },
  { _id: 'sample3',  name: 'Olivia Martinez',  role: 'Product Thinker', reputationScore: 45,  profilePicture: 'https://i.pravatar.cc/300?img=9'  },
  { _id: 'sample12', name: 'James Wilson',     role: 'Builder',         reputationScore: 40,  profilePicture: 'https://i.pravatar.cc/300?img=15' },
  { _id: 'sample5',  name: 'Ava Anderson',     role: 'Designer',        reputationScore: 30,  profilePicture: 'https://i.pravatar.cc/300?img=20' },
  { _id: 'sample9',  name: 'Sophie Taylor',    role: 'Product Thinker', reputationScore: 20,  profilePicture: 'https://i.pravatar.cc/300?img=28' },
  { _id: 'sample7',  name: 'Charlotte Kim',    role: 'Product Thinker', reputationScore: 0,   profilePicture: 'https://i.pravatar.cc/300?img=24' },
];

const RANK_MEDALS = ['🥇', '🥈', '🥉'];

function Leaderboard({ user }) {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await axios.get('/users/leaderboard');
        setLeaders(res.data.length > 0 ? res.data : DEMO_LEADERS);
      } catch {
        setLeaders(DEMO_LEADERS);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  return (
    <div className="leaderboard-page">
      <div className="container">
        <div className="leaderboard-campaign">
          <div className="campaign-badge">🍽️ Build After Lunch</div>
          <h2>Turn every LunchUp into a project.</h2>
          <p>Meet someone → use ACP to start building together → earn reputation → climb the leaderboard.</p>
        </div>

        <div className="leaderboard-header">
          <h1>Builder Leaderboard</h1>
          <p>Top builders in the LunchUp community, ranked by reputation.</p>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading leaderboard...</p>
          </div>
        ) : (
          <div className="leaderboard-list">
            {leaders.map((person, index) => (
              <div
                key={person._id}
                className={`leaderboard-row ${index < 3 ? 'top-three' : ''}`}
                onClick={() => navigate(`/profile/${person._id}`, { state: { userData: person } })}
              >
                <div className="rank">
                  {index < 3 ? RANK_MEDALS[index] : <span className="rank-num">{index + 1}</span>}
                </div>
                <div className="lb-avatar">
                  {person.profilePicture
                    ? <img src={person.profilePicture} alt={person.name} />
                    : person.name.charAt(0).toUpperCase()}
                </div>
                <div className="lb-info">
                  <span className="lb-name">{person.name}</span>
                  {person.role && <span className="role-badge">{person.role}</span>}
                </div>
                <div className="lb-score">
                  <span className="score-star">⭐</span>
                  <span className="score-num">{person.reputationScore || 0}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {user && (
          <div className="leaderboard-cta">
            <p>Want to climb the ranks?</p>
            <a href="#/projects" className="btn btn-primary">Start a Project →</a>
          </div>
        )}
      </div>
    </div>
  );
}

export default Leaderboard;
