import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Sparkles, Loader, Terminal } from 'lucide-react';
import useStore from '../store/useStore';

export default function AIAssistant() {
  const { user } = useStore();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Hello ${user?.name || 'there'}! I'm your CourseWeaver AI Assistant. I can help explain difficult concepts, recommend learning paths, or quiz you on what you've learned. How can I help today?`,
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!input.trim()) return;

    const userMessage = { id: Date.now().toString(), role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Mock AI response logic with contextual delays
    setTimeout(() => {
      let aiContent = "I'm deeply integrated with the Adaptive Engine. Keep practicing on the Competency Map to strengthen your skills!";
      const lowerAuth = userMessage.content.toLowerCase();

      if (lowerAuth.includes('quiz')) {
        aiContent = "You can take practice quizzes from your 'My Courses' tab! They automatically adjust your Competency nodes upon completion through our adaptive mastery gating.";
      } else if (lowerAuth.includes('course')) {
        aiContent = "Our courses are highly dynamic! Try looking at the Recommendation Engine; it scans your poorest competencies and links you directly to the chapters you need most.";
      } else if (lowerAuth.includes('explain')) {
        aiContent = "I'd love to break that down. Essentially, adaptive learning relies on Continuous Bayesian Knowledge Tracing. The more you interact, the tighter the engine models your true capability state!";
      }

      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiContent
      }]);
      setIsTyping(false);
    }, 1500 + Math.random() * 1000); // 1.5 - 2.5s simulated typing
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        style={{
          position: 'fixed',
          bottom: 'var(--space-xl)',
          right: 'var(--space-xl)',
          width: 60,
          height: 60,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))',
          color: '#fff',
          border: 'none',
          boxShadow: '0 12px 32px rgba(16, 185, 129, 0.4), inset 0 2px 0 rgba(255,255,255,0.3)',
          display: isOpen ? 'none' : 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          zIndex: 999
        }}
      >
        <Sparkles size={28} />
      </motion.button>

      {/* AI Chat Layout */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            style={{
              position: 'fixed',
              bottom: 'var(--space-xl)',
              right: 'var(--space-xl)',
              width: 380,
              height: 580,
              maxWidth: 'calc(100vw - 32px)',
              maxHeight: 'calc(100vh - 32px)',
              background: 'rgba(255,255,255,0.85)',
              backdropFilter: 'blur(32px)',
              WebkitBackdropFilter: 'blur(32px)',
              border: '1px solid rgba(255,255,255,0.5)',
              borderRadius: 'var(--r-2xl)',
              boxShadow: 'var(--shadow-xl)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              zIndex: 1000
            }}
          >
            {/* Header */}
            <div style={{
              padding: '16px 20px',
              background: 'linear-gradient(135deg, var(--color-primary-dark), var(--color-bg-elevated))',
              borderBottom: '1px solid var(--color-border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 'var(--r-full)',
                  background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
                  boxShadow: '0 4px 12px rgba(16,185,129,0.3)'
                }}>
                  <Terminal size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: 16, margin: 0, color: 'var(--color-text)' }}>Weaver AI</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--color-primary)', fontWeight: 600 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-success)', display: 'inline-block' }} />
                    Adaptive Tutor Online
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)} 
                style={{ background: 'var(--color-bg)', border: 'none', width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--color-text-muted)' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Messages Area */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: 16
            }}>
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                    maxWidth: '85%',
                    background: msg.role === 'user' ? 'var(--color-primary)' : 'var(--color-bg)',
                    color: msg.role === 'user' ? '#fff' : 'var(--color-text)',
                    padding: '12px 16px',
                    borderRadius: 'var(--r-md)',
                    borderBottomRightRadius: msg.role === 'user' ? 4 : 'var(--r-md)',
                    borderBottomLeftRadius: msg.role === 'assistant' ? 4 : 'var(--r-md)',
                    boxShadow: 'var(--shadow-sm)',
                    border: msg.role === 'assistant' ? '1px solid var(--color-border)' : 'none',
                    fontSize: 14,
                    lineHeight: 1.5,
                  }}
                >
                  {msg.content}
                </motion.div>
              ))}

              {isTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    alignSelf: 'flex-start',
                    background: 'var(--color-bg)',
                    padding: '12px 16px',
                    borderRadius: 'var(--r-md)',
                    borderBottomLeftRadius: 4,
                    boxShadow: 'var(--shadow-sm)',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  <Loader className="spinner" size={16} color="var(--color-primary)" />
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <form onSubmit={handleSend} style={{
              padding: '16px',
              borderTop: '1px solid var(--color-border)',
              background: 'var(--color-bg-elevated)',
              display: 'flex',
              gap: 8
            }}>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask your AI tutor anything..."
                style={{
                  flex: 1,
                  background: 'var(--color-bg)',
                  border: '1px solid var(--color-border-bright)',
                  borderRadius: 'var(--r-full)',
                  padding: '10px 16px',
                  fontSize: 14,
                  outline: 'none',
                  color: 'var(--color-text)'
                }}
              />
              <button
                type="submit"
                disabled={!input.trim() || isTyping}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  background: input.trim() ? 'var(--color-primary)' : 'var(--color-border)',
                  color: '#fff',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: input.trim() ? 'pointer' : 'not-allowed',
                  transition: 'background 0.2s',
                  flexShrink: 0
                }}
              >
                <Send size={18} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
