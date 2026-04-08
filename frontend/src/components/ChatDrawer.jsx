import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, User, ChevronLeft } from 'lucide-react';
import useStore from '../store/useStore';
import { messagesAPI } from '../services/api';

export default function ChatDrawer() {
  const { user, isChatOpen, closeChat, activeChatContact } = useStore();
  const [contacts, setContacts] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [socket, setSocket] = useState(null);
  
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (isChatOpen) {
      loadContacts();
      connectWebSocket();
    } else {
      if (socket) {
        socket.close();
        setSocket(null);
      }
    }
    return () => {
      if (socket) socket.close();
    };
  }, [isChatOpen]);

  useEffect(() => {
    if (activeChatContact) {
      setSelectedContact(activeChatContact);
      loadHistory(activeChatContact.id);
    } else if (selectedContact && !activeChatContact) {
      // If we cleared the active contact, but had a selected one, we leave it (user manually selected it).
      // Or we can just let it be. But if we want it synced:
      // setSelectedContact(null);
    }
  }, [activeChatContact]);

  // Load history when contact manually selected (not via global state)
  useEffect(() => {
    if (selectedContact && (!activeChatContact || activeChatContact.id !== selectedContact.id)) {
      loadHistory(selectedContact.id);
    }
  }, [selectedContact]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadContacts = async () => {
    try {
      const data = await messagesAPI.getContacts();
      setContacts(data);
    } catch (e) {
      console.error(e);
    }
  };

  const loadHistory = async (contactId) => {
    try {
      const msgs = await messagesAPI.getHistory(contactId);
      setMessages(msgs);
    } catch (e) {
      console.error(e);
    }
  };

  const getWebSocketUrl = () => {
    // Use the same host as the page so Vite proxy (which has ws:true) can forward it
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host; // e.g. localhost:3000
    return `${protocol}//${host}/api/messages/ws`;
  };

  const connectWebSocket = () => {
    const token = localStorage.getItem('access_token');
    if (!token) return;
    
    // In dev, use the vite server which proxies to 8001. Vite supports ws proxy on the same port automatically when using changeOrigin.
    const ws = new WebSocket(`${getWebSocketUrl()}?token=${token}`);
    
    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      // Only append if it belongs to the currently active conversation
      setMessages((prev) => {
         // Double checking if the message belongs to current chat context
         // Since setState inside ws.onmessage has stale closures for selectedContact, we must functional update
         return [...prev, msg];
      });
    };
    
    ws.onclose = () => console.log('Chat disconnected');
    setSocket(ws);
  };

  const [sendError, setSendError] = useState('');

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || !selectedContact) return;

    const val = inputText;
    setInputText('');
    setSendError('');

    try {
      const newMsg = await messagesAPI.sendMessage(selectedContact.id, val);
      setMessages(prev => [...prev, newMsg]);
    } catch (e) {
      console.error("Failed to send", e);
      setSendError('Failed to send. Check if the backend server is running.');
      setInputText(val); // Restore text so user doesn't lose it
    }
  };

  return (
    <>
      {/* Chat Drawer UI */}
      <AnimatePresence>
        {isChatOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            style={{
              position: 'fixed', bottom: 100, right: 40,
              width: 360, height: 500, maxWidth: 'calc(100vw - 32px)', maxHeight: 'calc(100vh - 32px)',
              background: 'var(--color-bg)',
              border: '1px solid var(--color-border)', borderRadius: 'var(--r-2xl)',
              boxShadow: 'var(--shadow-xl)', display: 'flex', flexDirection: 'column',
              overflow: 'hidden', zIndex: 1000
            }}
          >
            {/* Header */}
            <div style={{
              padding: '16px', background: 'var(--color-surface)',
              borderBottom: '1px solid var(--color-border)', display: 'flex',
              justifyContent: 'space-between', alignItems: 'center',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {selectedContact ? (
                   <button onClick={() => setSelectedContact(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
                     <ChevronLeft size={20} />
                   </button>
                ) : (
                  <MessageCircle size={20} color="var(--color-primary)" />
                )}
                <div>
                  <h3 style={{ fontSize: 16, margin: 0, color: 'var(--color-text)' }}>
                    {selectedContact ? selectedContact.name : 'Live Messages'}
                  </h3>
                  <div style={{ fontSize: 12, color: 'var(--color-text-muted)', textTransform: 'capitalize', display: 'flex', gap: 6 }}>
                    {selectedContact ? (
                      <>
                        <span>{selectedContact.role}</span>
                        {selectedContact.lastActive && (
                          <>
                            <span>•</span>
                            <span>Active: {selectedContact.lastActive}</span>
                            <span>•</span>
                            <span>Progress: {selectedContact.progress || 0}%</span>
                          </>
                        )}
                      </>
                    ) : 'Select a person to chat'}
                  </div>
                </div>
              </div>
              <button onClick={closeChat} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            {/* Conversation/Contacts View */}
            <div style={{ flex: 1, overflowY: 'auto', background: 'var(--color-bg)', display: 'flex', flexDirection: 'column' }}>
              {!selectedContact ? (
                // Contacts List
                <div style={{ padding: '8px' }}>
                  {contacts.map(c => (
                    <button key={c.id} onClick={() => setSelectedContact(c)} style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '12px', background: 'none', border: 'none',
                      borderRadius: 'var(--r-md)', cursor: 'pointer', textAlign: 'left', transition: 'background 0.2s'
                    }} className="contact-list-btn">
                      <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                         {c.avatar ? <img src={c.avatar} alt={c.name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} /> : <User size={20} />}
                      </div>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text)', marginBottom: 2 }}>{c.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Tap to message</div>
                      </div>
                    </button>
                  ))}
                  {contacts.length === 0 && <p style={{ padding: 20, textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 14 }}>No contacts available.</p>}
                </div>
              ) : (
                // Chat history
                <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {messages.map((m, idx) => {
                    const isMe = m.sender_id === user.user_id;
                    // Don't show messages not belonging to this active chat
                    if (m.sender_id !== selectedContact.id && m.recipient_id !== selectedContact.id) return null;
                    
                    return (
                      <div key={m.id || idx} style={{ alignSelf: isMe ? 'flex-end' : 'flex-start', maxWidth: '80%', background: isMe ? 'var(--color-primary)' : 'var(--color-surface)', color: isMe ? '#fff' : 'var(--color-text)', padding: '10px 14px', borderRadius: 'var(--r-md)', borderBottomRightRadius: isMe ? 4 : 'var(--r-md)', borderBottomLeftRadius: !isMe ? 4 : 'var(--r-md)', fontSize: 14, boxShadow: 'var(--shadow-sm)' }}>
                        {m.message}
                        <div style={{ fontSize: 10, marginTop: 4, opacity: 0.7, textAlign: isMe ? 'right' : 'left' }}>
                           {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Input Form */}
            {selectedContact && (
              <div style={{ borderTop: '1px solid var(--color-border)', background: 'var(--color-surface)' }}>
                {sendError && (
                  <div style={{ padding: '6px 12px', fontSize: 11, color: 'var(--color-error)', background: 'rgba(239,68,68,0.1)', borderBottom: '1px solid var(--color-border)' }}>
                    ⚠ {sendError}
                  </div>
                )}
                <form onSubmit={handleSend} style={{ padding: '12px', display: 'flex', gap: 8 }}>
                  <input
                    type="text" value={inputText} onChange={(e) => setInputText(e.target.value)}
                    placeholder="Type a message..."
                    style={{ flex: 1, background: 'var(--color-bg)', border: '1px solid var(--color-border-bright)', borderRadius: 'var(--r-full)', padding: '10px 16px', fontSize: 14, outline: 'none', color: 'var(--color-text)' }}
                  />
                  <button type="submit" disabled={!inputText.trim()} style={{ width: 40, height: 40, borderRadius: '50%', background: inputText.trim() ? 'var(--color-primary)' : 'var(--color-border)', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: inputText.trim() ? 'pointer' : 'not-allowed', transition: 'background 0.2s', flexShrink: 0 }}>
                    <Send size={18} />
                  </button>
                </form>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
