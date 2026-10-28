import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ChevronDown, Mail, Phone, Trash2, Send, Plus, X } from 'lucide-react';
import apiClient from '../../config/apiClient';
import toast from 'react-hot-toast';

const initialsOf = (name) =>
  (name || 'A').split(' ').filter(Boolean).map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'A';

export default function EventInfoScreen() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('faqs'); // 'faqs' | 'contacts' | 'chat'
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState(null);

  // FAQs State
  const [faqs, setFaqs] = useState([]);
  const [expandedFaqId, setExpandedFaqId] = useState(null);
  const [showAddFaq, setShowAddFaq] = useState(false);
  const [newQuestion, setNewQuestion] = useState('');
  const [newAnswer, setNewAnswer] = useState('');

  // Contacts State
  const [contacts, setContacts] = useState([]);
  const [showAddContact, setShowAddContact] = useState(false);
  const [contactSection, setContactSection] = useState('medical');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');

  // Support Chat State
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  const isAdmin = Boolean(me?.is_admin) || me?.role === 'admin' || me?.email === 'ravirajapanthulu@gmail.com';

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const meRes = await apiClient.get('/users/me');
        setMe(meRes?.data?.data ?? meRes?.data ?? null);
        loadFaqs();
        loadContacts();
        loadSupportChat();
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  const loadFaqs = async () => {
    try {
      const res = await apiClient.get('/event-info/faqs');
      setFaqs(res?.data?.data || []);
    } catch (err) { console.error(err); }
  };

  const loadContacts = async () => {
    try {
      const res = await apiClient.get('/event-info/contacts');
      setContacts(res?.data?.data || []);
    } catch (err) { console.error(err); }
  };

  const loadSupportChat = async () => {
    try {
      const res = await apiClient.get('/event-info/support/messages');
      setMessages(res?.data?.data || []);
      scrollToBottom();
    } catch (err) { console.error(err); }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // Actions: FAQs
  const handleCreateFaq = async (e) => {
    e.preventDefault();
    if (!newQuestion.trim() || !newAnswer.trim()) return toast.error("Please fill both question and answer");
    try {
      await apiClient.post('/event-info/faqs', { question: newQuestion, answer: newAnswer });
      toast.success("FAQ added");
      setNewQuestion(''); setNewAnswer(''); setShowAddFaq(false);
      loadFaqs();
    } catch (err) { toast.error("Failed to add FAQ"); }
  };

  const handleDeleteFaq = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm("Delete this FAQ?")) return;
    try {
      await apiClient.delete(`/event-info/faqs/${id}`);
      toast.success("FAQ deleted");
      loadFaqs();
    } catch (err) { toast.error("Failed to delete FAQ"); }
  };

  // Actions: Contacts
  const handleCreateContact = async (e) => {
    e.preventDefault();
    try {
      await apiClient.post('/event-info/contacts', {
        section: contactSection,
        name: contactName,
        email: contactEmail,
        phone: contactPhone
      });
      toast.success("Contact added");
      setContactName(''); setContactEmail(''); setContactPhone(''); setShowAddContact(false);
      loadContacts();
    } catch (err) { toast.error("Failed to add contact"); }
  };

  const handleDeleteContact = async (id) => {
    if (!window.confirm("Remove this contact?")) return;
    try {
      await apiClient.delete(`/event-info/contacts/${id}`);
      toast.success("Contact removed");
      loadContacts();
    } catch (err) { toast.error("Failed to delete contact"); }
  };

  // Actions: Support Chat
  const handleSendMessage = async (e) => {
    e.preventDefault();
    const text = chatInput.trim();
    if (!text || sending) return;
    setSending(true);
    try {
      const res = await apiClient.post('/event-info/support/messages', { message: text });
      setMessages(prev => [...prev, res?.data?.data]);
      setChatInput('');
      scrollToBottom();
    } catch (err) { toast.error("Failed to send message"); }
    finally { setSending(false); }
  };

  const handleDeleteMessage = async (id) => {
    if (!window.confirm("Delete this message?")) return;
    try {
      await apiClient.delete(`/event-info/support/messages/${id}`);
      setMessages(prev => prev.filter(m => m.id !== id));
      toast.success("Message deleted");
    } catch (err) { toast.error("Failed to delete message"); }
  };

  const medicalContacts = contacts.filter(c => c.section === 'medical');
  const organizingContacts = contacts.filter(c => c.section === 'organizing');

  return (
    <div className="min-h-screen bg-white max-w-md mx-auto flex flex-col pb-20 select-none">
      {/* Top Header */}
      <div className="px-4 py-4 flex items-center justify-between border-b border-slate-100">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-slate-800">
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Infodesk</h1>
        </div>
        {isAdmin && activeTab === 'faqs' && (
          <button onClick={() => setShowAddFaq(true)} className="p-2 text-[#0818A8] hover:bg-blue-50 rounded-full">
            <Plus size={20} />
          </button>
        )}
        {isAdmin && activeTab === 'contacts' && (
          <button onClick={() => setShowAddContact(true)} className="p-2 text-[#0818A8] hover:bg-blue-50 rounded-full">
            <Plus size={20} />
          </button>
        )}
      </div>

      {/* 3 Tab Navigation */}
      <div className="flex items-center justify-between px-6 pt-4 pb-2 border-b border-slate-100 text-[15px]">
        <button
          onClick={() => setActiveTab('faqs')}
          className={`font-bold transition-colors ${activeTab === 'faqs' ? 'text-[#0818A8]' : 'text-slate-500'}`}
        >
          FAQs
        </button>
        <button
          onClick={() => setActiveTab('contacts')}
          className={`font-bold transition-colors ${activeTab === 'contacts' ? 'text-[#0818A8]' : 'text-slate-500'}`}
        >
          Contact Us
        </button>
        <button
          onClick={() => { setActiveTab('chat'); scrollToBottom(); }}
          className={`font-bold transition-colors ${activeTab === 'chat' ? 'text-[#0818A8]' : 'text-slate-500'}`}
        >
          Support Chat
        </button>
      </div>

      {/* TAB 1: FAQs */}
      {activeTab === 'faqs' && (
        <div className="p-4 space-y-3">
          {faqs.map((faq) => {
            const isExpanded = expandedFaqId === faq.id;
            return (
              <div
                key={faq.id}
                onClick={() => setExpandedFaqId(isExpanded ? null : faq.id)}
                className="bg-[#F8FAFC] rounded-2xl p-4 transition-all border border-slate-100 cursor-pointer"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[14px] font-semibold text-slate-800 leading-snug">
                    {faq.question}
                  </span>
                  <div className="flex items-center gap-1 shrink-0">
                    {isAdmin && (
                      <button
                        onClick={(e) => handleDeleteFaq(faq.id, e)}
                        className="p-1 text-slate-400 hover:text-red-500"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                    {isExpanded ? (
                      <ChevronDown size={18} className="text-slate-500" />
                    ) : (
                      <ChevronRight size={18} className="text-slate-500" />
                    )}
                  </div>
                </div>
                {isExpanded && (
                  <p className="mt-3 pt-3 border-t border-slate-200 text-xs text-slate-600 leading-relaxed animate-in fade-in duration-150">
                    {faq.answer}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 2: Contact Us */}
      {activeTab === 'contacts' && (
        <div className="p-4 space-y-6">
          {/* Medical Emergency Section */}
          <div>
            <h2 className="text-sm font-bold text-slate-900 mb-3">Medical Emergency</h2>
            <div className="space-y-3">
              {medicalContacts.map((c) => (
                <div key={c.id} className="bg-[#F8FAFC] rounded-2xl p-4 flex items-center justify-between border border-slate-100">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600 text-sm overflow-hidden shrink-0">
                      {c.photo_url ? <img src={c.photo_url} alt="" className="w-full h-full object-cover" /> : initialsOf(c.name)}
                    </div>
                    <div className="min-w-0 text-xs text-slate-600 space-y-0.5">
                      <p className="font-bold text-slate-900 text-sm">{c.name}</p>
                      {c.email && (
                        <p className="flex items-center gap-1.5 truncate">
                          <Mail size={12} className="text-slate-400 shrink-0" /> {c.email}
                        </p>
                      )}
                      {c.phone && (
                        <p className="flex items-center gap-1.5 truncate">
                          <Phone size={12} className="text-slate-400 shrink-0" /> {c.phone}
                        </p>
                      )}
                    </div>
                  </div>
                  {isAdmin && (
                    <button onClick={() => handleDeleteContact(c.id)} className="p-2 text-slate-300 hover:text-red-500">
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Organizing Team Section */}
          <div>
            <h2 className="text-sm font-bold text-slate-900 mb-3">Organizing Team</h2>
            <div className="space-y-3">
              {organizingContacts.map((c) => (
                <div key={c.id} className="bg-[#F8FAFC] rounded-2xl p-4 flex items-center justify-between border border-slate-100">
                  <div className="text-xs text-slate-600 space-y-1">
                    {c.email && (
                      <p className="flex items-center gap-2">
                        <Mail size={13} className="text-slate-400" /> {c.email}
                      </p>
                    )}
                    {c.phone && (
                      <p className="flex items-center gap-2">
                        <Phone size={13} className="text-slate-400" /> {c.phone}
                      </p>
                    )}
                  </div>
                  {isAdmin && (
                    <button onClick={() => handleDeleteContact(c.id)} className="p-2 text-slate-300 hover:text-red-500">
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Support Chat */}
      {activeTab === 'chat' && (
        <div className="flex-1 flex flex-col justify-between p-4 min-h-[480px]">
          <div className="space-y-3 overflow-y-auto max-h-[58vh] pr-1">
            {messages.map((m) => {
              const isMe = m.sender_type === 'attendee';
              return (
                <div key={m.id} className={`flex flex-col group ${isMe ? 'items-end' : 'items-start'}`}>
                  <div className="flex items-center gap-1">
                    {isMe && (
                      <button
                        onClick={() => handleDeleteMessage(m.id)}
                        className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 p-1 transition-opacity"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                    <div
                      className={`px-4 py-2.5 rounded-2xl text-[14px] leading-snug max-w-[280px] shadow-sm ${
                        isMe
                          ? 'bg-[#1E293B] text-white rounded-br-none'
                          : 'bg-[#F1F5F9] text-slate-900 rounded-bl-none'
                      }`}
                    >
                      {m.message}
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 px-1">
                    {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input */}
          <form onSubmit={handleSendMessage} className="mt-3 flex items-center gap-2 pt-2 border-t border-slate-100">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask support a question..."
              className="flex-1 bg-slate-50 border border-slate-200 rounded-full px-4 py-2.5 text-xs focus:outline-none focus:border-[#0818A8]"
            />
            <button
              type="submit"
              disabled={sending || !chatInput.trim()}
              className="w-10 h-10 rounded-full bg-[#0818A8] text-white flex items-center justify-center shrink-0 disabled:opacity-40"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      )}

      {/* Admin Add FAQ Modal */}
      {showAddFaq && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 w-full max-w-sm space-y-3">
            <div className="flex justify-between items-center mb-1">
              <h3 className="font-bold text-sm text-slate-900">Add New FAQ</h3>
              <button onClick={() => setShowAddFaq(false)} className="text-slate-400"><X size={18} /></button>
            </div>
            <input
              type="text"
              placeholder="Question"
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              className="w-full text-xs p-2.5 border border-slate-200 rounded-xl"
            />
            <textarea
              placeholder="Answer"
              rows={3}
              value={newAnswer}
              onChange={(e) => setNewAnswer(e.target.value)}
              className="w-full text-xs p-2.5 border border-slate-200 rounded-xl resize-none"
            />
            <button onClick={handleCreateFaq} className="w-full bg-[#0818A8] text-white py-2 rounded-xl text-xs font-bold">
              Save FAQ
            </button>
          </div>
        </div>
      )}

      {/* Admin Add Contact Modal */}
      {showAddContact && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 w-full max-w-sm space-y-3">
            <div className="flex justify-between items-center mb-1">
              <h3 className="font-bold text-sm text-slate-900">Add Emergency / Team Contact</h3>
              <button onClick={() => setShowAddContact(false)} className="text-slate-400"><X size={18} /></button>
            </div>
            <select
              value={contactSection}
              onChange={(e) => setContactSection(e.target.value)}
              className="w-full text-xs p-2 border border-slate-200 rounded-xl"
            >
              <option value="medical">Medical Emergency</option>
              <option value="organizing">Organizing Team</option>
            </select>
            {contactSection === 'medical' && (
              <input
                type="text"
                placeholder="Full Name"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                className="w-full text-xs p-2.5 border border-slate-200 rounded-xl"
              />
            )}
            <input
              type="email"
              placeholder="Email address"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              className="w-full text-xs p-2.5 border border-slate-200 rounded-xl"
            />
            <input
              type="text"
              placeholder="Phone number (+91...)"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              className="w-full text-xs p-2.5 border border-slate-200 rounded-xl"
            />
            <button onClick={handleCreateContact} className="w-full bg-[#0818A8] text-white py-2 rounded-xl text-xs font-bold">
              Save Contact
            </button>
          </div>
        </div>
      )}
    </div>
  );
}