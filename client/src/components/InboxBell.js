import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './InboxBell.css';

function InboxBell({ user }) {
  const [open, setOpen] = useState(false);
  const [inbox, setInbox] = useState({ connectionRequests: [], conversations: [], unreadCount: 0 });
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const fetchInbox = async () => {
    if (!user) return;
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/messages/inbox', { headers: { Authorization: `Bearer ${token}` } });
      setInbox(res.data);
    } catch {}
  };

  useEffect(() => {
    fetchInbox();
    const interval = setInterval(fetchInbox, 10000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAccept = async (e, msgId, senderId, senderName) => {
    e.stopPropagation();
    try {
      const token = localStorage.getItem('token');
      await axios.put(`/messages/${msgId}/status`, { status: 'accepted' }, { headers: { Authorization: `Bearer ${token}` } });
      fetchInbox();
      navigate('/messages', { state: { openConversation: { userId: senderId, name: senderName } } });
      setOpen(false);
    } catch {}
  };

  const handleReject = async (e, msgId) => {
    e.stopPropagation();
    try {
      const token = localStorage.getItem('token');
      await axios.put(`/messages/${msgId}/status`, { status: 'rejected' }, { headers: { Authorization: `Bearer ${token}` } });
      fetchInbox();
    } catch {}
  };

  const goToMessages = (convo) => {
    navigate('/messages', { state: { openConversation: convo } });
    setOpen(false);
  };

  if (!user) return null;

  const { connectionRequests, conversations, unreadCount } = inbox;
  const isEmpty = connectionRequests.length === 0 && conversations.length === 0;

  return (
    <div className="inbox-bell-wrap" ref={dropdownRef}>
      <button className="inbox-bell-btn" onClick={() => setOpen(!open)} aria-label="Messages">
        💬
        {unreadCount > 0 && <span className="inbox-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
      </button>

      {open && (
        <div className="inbox-dropdown">
          <div className="inbox-dropdown-header">
            <span>Messages</span>
            <button className="inbox-view-all" onClick={() => { navigate('/messages'); setOpen(false); }}>
              View all →
            </button>
          </div>

          {isEmpty && <div className="inbox-empty">No messages yet</div>}

          {connectionRequests.length > 0 && (
            <div className="inbox-section">
              <div className="inbox-section-label">Connection Requests</div>
              {connectionRequests.slice(0, 3).map(req => (
                <div key={req._id} className="inbox-item inbox-request">
                  <div className="inbox-avatar">{req.senderName?.charAt(0) || '?'}</div>
                  <div className="inbox-item-body">
                    <span className="inbox-item-name">{req.senderName}</span>
                    <span className="inbox-item-text">wants to connect</span>
                    <div className="inbox-request-actions">
                      <button className="btn-accept" onClick={(e) => handleAccept(e, req._id, req.senderId, req.senderName)}>Accept</button>
                      <button className="btn-decline" onClick={(e) => handleReject(e, req._id)}>Decline</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {conversations.length > 0 && (
            <div className="inbox-section">
              <div className="inbox-section-label">Conversations</div>
              {conversations.slice(0, 4).map(conv => (
                <div key={conv.userId} className="inbox-item" onClick={() => goToMessages(conv)}>
                  <div className="inbox-avatar">
                    {conv.avatar
                      ? <img src={conv.avatar} alt={conv.name} />
                      : conv.name?.charAt(0) || '?'}
                  </div>
                  <div className="inbox-item-body">
                    <span className="inbox-item-name">{conv.name}</span>
                    <span className="inbox-item-text">{conv.lastMessage?.content?.slice(0, 40)}…</span>
                  </div>
                  {conv.unreadCount > 0 && <span className="inbox-unread-dot">{conv.unreadCount}</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default InboxBell;
