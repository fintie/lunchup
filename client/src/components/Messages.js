import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import HarnessFlow from './HarnessFlow';
import './Messages.css';

function Messages({ user }) {
  const [inbox, setInbox] = useState({ connectionRequests: [], conversations: [] });
  const [activeConvo, setActiveConvo] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [showHarness, setShowHarness] = useState(false);
  const [mobileView, setMobileView] = useState('list');
  const [showAtHint, setShowAtHint] = useState(false);
  const bottomRef = useRef(null);
  const location = useLocation();

  const myName = localStorage.getItem('userName') || user?.name || 'You';

  const fetchInbox = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/messages/inbox', { headers: { Authorization: `Bearer ${token}` } });
      setInbox(res.data);
    } catch {}
  };

  const fetchConversation = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`/messages/conversation/${userId}`, { headers: { Authorization: `Bearer ${token}` } });
      setMessages(res.data);
    } catch {}
  };

  useEffect(() => {
    fetchInbox();
    const interval = setInterval(fetchInbox, 8000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (location.state?.openConversation) openConversation(location.state.openConversation);
  }, [location.state]);

  useEffect(() => {
    if (!activeConvo) return;
    fetchConversation(activeConvo.userId);
    const interval = setInterval(() => fetchConversation(activeConvo.userId), 3000);
    return () => clearInterval(interval);
  }, [activeConvo?.userId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const openConversation = (convo) => {
    setActiveConvo(convo);
    setMobileView('chat');
    fetchConversation(convo.userId);
  };

  const handleAccept = async (req) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`/messages/${req._id}/status`, { status: 'accepted' }, { headers: { Authorization: `Bearer ${token}` } });
      fetchInbox();
      openConversation({ userId: req.senderId, name: req.senderName });
    } catch {}
  };

  const handleReject = async (req) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`/messages/${req._id}/status`, { status: 'rejected' }, { headers: { Authorization: `Bearer ${token}` } });
      fetchInbox();
    } catch {}
  };

  const isAIMessage = (text) => text.trimStart().startsWith('@AI ') || text.trimStart().startsWith('@ai ');

  const handleInputChange = (e) => {
    const val = e.target.value;
    setInput(val);
    setShowAtHint(val === '@' || val.startsWith('@AI') || val.startsWith('@ai'));
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || !activeConvo || sending || aiLoading) return;

    const content = input.trim();
    setInput('');
    setShowAtHint(false);

    if (isAIMessage(content)) {
      const query = content.replace(/^@[Aa][Ii]\s*/, '');
      // Show user's @AI message
      setMessages(prev => [...prev, {
        _id: `local_${Date.now()}`,
        senderId: user?.id,
        content,
        senderName: myName,
        createdAt: new Date(),
        isAIQuery: true
      }]);
      // Fetch AI response
      setAiLoading(true);
      try {
        const token = localStorage.getItem('token');
        const res = await axios.post('/harness/chat-assist', {
          messages,
          query,
          partnerName: activeConvo.name
        }, { headers: { Authorization: `Bearer ${token}` } });
        setMessages(prev => [...prev, {
          _id: `ai_${Date.now()}`,
          senderId: 'ai',
          content: res.data.response,
          senderName: '🤖 AI Assistant',
          createdAt: new Date(),
          isAIResponse: true
        }]);
      } catch {
        setMessages(prev => [...prev, {
          _id: `ai_${Date.now()}`,
          senderId: 'ai',
          content: `Happy to help! Based on your chat with ${activeConvo.name}, it looks like you two have great potential for collaboration. Try asking me about project ideas or scheduling.`,
          senderName: '🤖 AI Assistant',
          createdAt: new Date(),
          isAIResponse: true
        }]);
      } finally {
        setAiLoading(false);
      }
      return;
    }

    // Normal message
    setSending(true);
    setMessages(prev => [...prev, {
      _id: `local_${Date.now()}`,
      senderId: user?.id,
      content,
      senderName: myName,
      createdAt: new Date()
    }]);
    try {
      const token = localStorage.getItem('token');
      await axios.post('/messages/send', {
        receiverId: activeConvo.userId,
        receiverName: activeConvo.name,
        senderName: myName,
        content
      }, { headers: { Authorization: `Bearer ${token}` } });
    } catch {}
    setSending(false);
  };

  const formatTime = (date) => new Date(date).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit', hour12: true });

  return (
    <div className="messages-page">
      {/* Left sidebar */}
      <div className={`messages-sidebar ${mobileView === 'chat' ? 'hidden-mobile' : ''}`}>
        <div className="sidebar-header"><h2>Messages</h2></div>

        {inbox.connectionRequests.length > 0 && (
          <div className="sidebar-section">
            <div className="sidebar-section-label">Connection Requests</div>
            {inbox.connectionRequests.map(req => (
              <div key={req._id} className="sidebar-request">
                <div className="sidebar-avatar">{req.senderName?.charAt(0)}</div>
                <div className="sidebar-request-body">
                  <span className="sidebar-name">{req.senderName}</span>
                  <span className="sidebar-sub">wants to connect</span>
                  <div className="sidebar-request-actions">
                    <button className="btn-accept" onClick={() => handleAccept(req)}>Accept</button>
                    <button className="btn-decline" onClick={() => handleReject(req)}>Decline</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="sidebar-section">
          <div className="sidebar-section-label">Conversations</div>
          {inbox.conversations.length === 0 ? (
            <div className="sidebar-empty">No conversations yet.<br />Connect with someone to start chatting.</div>
          ) : (
            inbox.conversations.map(conv => (
              <div
                key={conv.userId}
                className={`sidebar-convo ${activeConvo?.userId === conv.userId ? 'active' : ''}`}
                onClick={() => openConversation(conv)}
              >
                <div className="sidebar-avatar">
                  {conv.avatar ? <img src={conv.avatar} alt={conv.name} /> : conv.name?.charAt(0)}
                </div>
                <div className="sidebar-convo-body">
                  <span className="sidebar-name">{conv.name}</span>
                  <span className="sidebar-preview">{conv.lastMessage?.content?.slice(0, 36)}…</span>
                </div>
                {conv.unreadCount > 0 && <span className="sidebar-unread">{conv.unreadCount}</span>}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right chat panel */}
      <div className={`messages-chat ${mobileView === 'list' ? 'hidden-mobile' : ''}`}>
        {!activeConvo ? (
          <div className="chat-empty-state">
            <div className="chat-empty-icon">💬</div>
            <h3>Select a conversation</h3>
            <p>Choose someone from the left to start chatting.</p>
          </div>
        ) : (
          <>
            <div className="chat-header">
              <button className="chat-back-btn" onClick={() => setMobileView('list')}>←</button>
              <div className="chat-header-avatar">{activeConvo.name?.charAt(0)}</div>
              <div className="chat-header-info">
                <div className="chat-header-name">{activeConvo.name}</div>
                <div className="chat-header-sub">LunchUp connection</div>
              </div>
              <button
                className="chat-project-btn"
                onClick={() => setShowHarness(true)}
                title="Start a project together"
              >
                🚀 Start Project
              </button>
            </div>

            {/* @AI hint */}
            {showAtHint && (
              <div className="ai-hint">
                <span className="ai-hint-icon">🤖</span>
                <span>Type <strong>@AI</strong> followed by your question to ask the AI assistant about this conversation</span>
              </div>
            )}

            <div className="chat-messages">
              {messages.length === 0 && (
                <div className="chat-start-hint">
                  Say hello! This is the start of your conversation with {activeConvo.name}.<br />
                  <span className="ai-tip">💡 Tip: type <strong>@AI</strong> to ask the AI assistant for project ideas or advice.</span>
                </div>
              )}
              {messages.map((msg, i) => {
                const isMe = String(msg.senderId) === String(user?.id);
                const isAI = msg.isAIResponse || msg.senderId === 'ai';
                const isAIQuery = msg.isAIQuery;

                if (isAI) return (
                  <div key={msg._id || i} className="chat-bubble-wrap ai-wrap">
                    <div className="ai-bubble">
                      <div className="ai-bubble-label">🤖 AI Assistant</div>
                      <div className="ai-bubble-content">{msg.content}</div>
                    </div>
                    <div className="chat-time">{formatTime(msg.createdAt)}</div>
                  </div>
                );

                return (
                  <div key={msg._id || i} className={`chat-bubble-wrap ${isMe ? 'me' : 'them'}`}>
                    <div className={`chat-bubble ${isMe ? 'bubble-me' : 'bubble-them'} ${isAIQuery ? 'bubble-ai-query' : ''}`}>
                      {msg.content}
                    </div>
                    <div className="chat-time">{formatTime(msg.createdAt)}</div>
                  </div>
                );
              })}
              {aiLoading && (
                <div className="chat-bubble-wrap ai-wrap">
                  <div className="ai-bubble ai-loading">
                    <div className="ai-bubble-label">🤖 AI Assistant</div>
                    <div className="ai-typing"><span /><span /><span /></div>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            <form className="chat-input-row" onSubmit={handleSend}>
              <input
                className="chat-input"
                placeholder={`Message ${activeConvo.name}… or type @AI for assistant`}
                value={input}
                onChange={handleInputChange}
              />
              <button type="submit" className="chat-send-btn" disabled={!input.trim() || sending || aiLoading}>
                ➤
              </button>
            </form>
          </>
        )}
      </div>

      {/* HarnessFlow modal from chat */}
      {showHarness && activeConvo && (
        <HarnessFlow
          user={user}
          partnerName={activeConvo.name}
          chatHistory={messages.filter(m => !m.isAIResponse && m.senderId !== 'ai')}
          onClose={() => setShowHarness(false)}
          onCreated={() => setShowHarness(false)}
        />
      )}
    </div>
  );
}

export default Messages;
