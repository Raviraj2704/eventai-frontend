// ============================================================================
// Feedback Screen (matches the reference video & new clean theme)
// File: src/pages/main/FeedbackScreen.jsx
// ============================================================================

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, Plus, Trash2, X, CheckCircle2, BarChart3 } from 'lucide-react';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import apiClient from '../../config/apiClient';

const EMOJIS = ['😡', '😕', '😐', '🙂', '😍'];

const getErrorMessage = (error, fallback) =>
  error?.data?.detail || error?.response?.data?.detail || error?.message || fallback;

const unwrap = (body) => body?.data ?? body ?? null;

// ----------------------------------------------------------------------------
// One question, shown to attendees (Clean Light Theme)
// ----------------------------------------------------------------------------
function QuestionInput({ index, question, value, onChange }) {
  const selected = value ?? (question.type === 'checkbox' ? [] : '');

  if (question.type === 'checkbox') {
    const toggle = (opt) => {
      const next = selected.includes(opt) ? selected.filter((v) => v !== opt) : [...selected, opt];
      onChange(index, next);
    };
    return (
      <div className="space-y-1 mt-3">
        {question.options.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => toggle(opt)}
            className="w-full flex items-center justify-between py-2.5 text-left text-[15px] text-slate-700 bg-transparent active:opacity-70 transition-opacity"
          >
            <span>{opt}</span>
            <span
              className={`w-5 h-5 rounded-[6px] border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                selected.includes(opt) ? 'bg-[#0000c8] border-[#0000c8] text-white' : 'border-slate-300'
              }`}
            >
              {selected.includes(opt) && <CheckCircle2 size={14} />}
            </span>
          </button>
        ))}
      </div>
    );
  }

  if (question.type === 'dropdown') {
    return (
      <div className="mt-3">
        <select
          value={selected}
          onChange={(e) => onChange(index, e.target.value)}
          className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-[15px] text-slate-800 focus:outline-none focus:border-[#0000c8] focus:ring-1 focus:ring-[#0000c8] appearance-none shadow-sm"
        >
          <option value="">Select an option</option>
          {question.options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>
    );
  }

  if (question.type === 'emoji') {
    return (
      <div className="flex justify-between mt-4">
        {EMOJIS.map((emoji, i) => {
          const option = question.options[i] ?? EMOJIS[i];
          const active = selected === option;
          return (
            <button
              key={emoji}
              type="button"
              onClick={() => onChange(index, option)}
              aria-label={`Rate ${i + 1} of 5`}
              className={`w-12 h-12 rounded-xl text-2xl flex items-center justify-center border-2 transition-all ${
                active ? 'border-[#0000c8] bg-white shadow-sm scale-110' : 'border-transparent bg-[#eef0f6] hover:bg-[#e4e6ef]'
              }`}
            >
              {emoji}
            </button>
          );
        })}
      </div>
    );
  }

  // radio (default)
  return (
    <div className="space-y-1 mt-3">
      {question.options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(index, opt)}
          className="w-full flex items-center justify-between py-2.5 text-left text-[15px] text-slate-700 bg-transparent active:opacity-70 transition-opacity"
        >
          <span>{opt}</span>
          <span
            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
              selected === opt ? 'border-[#0000c8]' : 'border-slate-300'
            }`}
          >
            {selected === opt && <span className="w-2.5 h-2.5 rounded-full bg-[#0000c8]" />}
          </span>
        </button>
      ))}
    </div>
  );
}

// ----------------------------------------------------------------------------
// Attendee view: fill in the active form
// ----------------------------------------------------------------------------
function AttendeeForm({ form, onSubmitted }) {
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const setAnswer = (index, value) => setAnswers((prev) => ({ ...prev, [index]: value }));

  const submit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    for (let i = 0; i < form.questions.length; i += 1) {
      const q = form.questions[i];
      const v = answers[i];
      const empty = v === undefined || v === '' || (Array.isArray(v) && v.length === 0);
      if (q.required && empty) {
        toast.error(`Please answer: ${q.text}`);
        return;
      }
    }

    setSubmitting(true);
    try {
      await apiClient.post(`/feedback-forms/forms/${form.id}/responses`, { answers });
      toast.success('Thank you! Your feedback has been submitted');
      onSubmitted();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not send your feedback'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="px-4 pt-6 space-y-4">
      <div className="mb-2 px-1">
        <h2 className="text-xl font-bold text-slate-900">{form.title}</h2>
        {form.description && <p className="text-sm text-slate-600 mt-1">{form.description}</p>}
      </div>

      {form.questions.map((q, index) => (
        <div key={index} className="bg-[#f4f5f9] rounded-[20px] p-5">
          <p className="text-[15px] font-medium text-slate-800">
            {index + 1}. {q.text}
            {q.required && <span className="text-red-500">*</span>}
          </p>
          <QuestionInput index={index} question={q} value={answers[index]} onChange={setAnswer} />
        </div>
      ))}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-full bg-[#0000c8] text-white py-3.5 font-bold text-[15px] shadow-md disabled:opacity-50 mt-4 active:scale-[0.98] transition-transform"
      >
        {submitting ? 'Sending...' : 'Submit feedback'}
      </button>
    </form>
  );
}

// ----------------------------------------------------------------------------
// Admin: create a form
// ----------------------------------------------------------------------------
const BLANK_QUESTION = { text: '', type: 'radio', optionsText: '', required: true };

function CreateFormSheet({ onClose, onCreated }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState([{ ...BLANK_QUESTION }]);
  const [saving, setSaving] = useState(false);

  const updateQuestion = (index, patch) =>
    setQuestions((prev) => prev.map((q, i) => (i === index ? { ...q, ...patch } : q)));

  const addQuestion = () => setQuestions((prev) => [...prev, { ...BLANK_QUESTION }]);

  const removeQuestion = (index) =>
    setQuestions((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));

  const submit = async (e) => {
    e.preventDefault();
    if (saving) return;

    if (title.trim().length < 3) {
      toast.error('Enter a form title');
      return;
    }

    const payload = {
      title: title.trim(),
      description: description.trim() || null,
      questions: questions.map((q) => ({
        text: q.text.trim(),
        type: q.type,
        required: q.required,
        options:
          q.type === 'emoji'
            ? []
            : q.optionsText
                .split('\n')
                .map((o) => o.trim())
                .filter(Boolean),
      })),
    };

    if (payload.questions.some((q) => q.text.length < 2)) {
      toast.error('Every question needs text');
      return;
    }

    setSaving(true);
    try {
      await apiClient.post('/feedback-forms/forms', payload);
      toast.success('Form saved as draft');
      onCreated();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not save the form'));
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    'w-full px-4 py-3 bg-[#f8f9fc] border border-slate-200 rounded-xl text-[14px] text-slate-800 focus:outline-none focus:border-[#0000c8] focus:bg-white transition-colors';

  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-end justify-center" onClick={onClose}>
      <div
        className="bg-white w-full max-w-[430px] max-h-[90vh] rounded-t-[24px] flex flex-col mb-0 sm:mb-16"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <p className="font-bold text-slate-900 text-[17px]">Create feedback form</p>
          <button type="button" onClick={onClose} aria-label="Close" className="text-slate-400 hover:text-slate-700 bg-slate-100 p-1.5 rounded-full transition-colors">
            <X size={18} strokeWidth={2.5} />
          </button>
        </div>

        <form onSubmit={submit} className="flex-1 overflow-y-auto p-4 space-y-5 pb-8">
          <div>
            <label className="text-[13px] font-bold text-slate-600 uppercase tracking-wider ml-1">Form title</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className={`${inputClass} mt-1.5`} />
          </div>

          <div>
            <label className="text-[13px] font-bold text-slate-600 uppercase tracking-wider ml-1">Description (optional)</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className={`${inputClass} mt-1.5`} />
          </div>

          {questions.map((q, index) => (
            <div key={index} className="rounded-[20px] bg-white border border-slate-200 p-5 space-y-4 shadow-sm">
              <div className="flex justify-between items-center">
                <p className="text-[15px] font-bold text-slate-800">Question {index + 1}</p>
                {questions.length > 1 && (
                  <button type="button" onClick={() => removeQuestion(index)} aria-label="Remove question" className="text-red-500 bg-red-50 p-1.5 rounded-lg">
                    <Trash2 size={16} />
                  </button>
                )}
              </div>

              <input
                type="text"
                value={q.text}
                onChange={(e) => updateQuestion(index, { text: e.target.value })}
                placeholder="Question text"
                className={inputClass}
              />

              <select
                value={q.type}
                onChange={(e) => updateQuestion(index, { type: e.target.value })}
                className={inputClass}
              >
                <option value="radio">Choose one (radio)</option>
                <option value="checkbox">Choose many (checkbox)</option>
                <option value="dropdown">Dropdown</option>
                <option value="emoji">Five-emoji rating</option>
              </select>

              {q.type !== 'emoji' && (
                <textarea
                  value={q.optionsText}
                  onChange={(e) => updateQuestion(index, { optionsText: e.target.value })}
                  rows={3}
                  placeholder={'One option per line\nExcellent\nGood\nNeeds work'}
                  className={inputClass}
                />
              )}

              <label className="flex items-center gap-3 text-[14px] font-medium text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100 cursor-pointer">
                <input
                  type="checkbox"
                  checked={q.required}
                  onChange={(e) => updateQuestion(index, { required: e.target.checked })}
                  className="w-4 h-4 rounded text-[#0000c8] border-slate-300 focus:ring-[#0000c8]"
                />
                Required field
              </label>
            </div>
          ))}

          <button type="button" onClick={addQuestion} className="w-full py-3 text-[14px] font-bold text-[#0000c8] bg-indigo-50 rounded-xl hover:bg-indigo-100 transition-colors">
            + Add another question
          </button>

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-full bg-[#0000c8] text-white py-3.5 font-bold shadow-md disabled:opacity-50 active:scale-[0.98] transition-transform mt-4"
          >
            {saving ? 'Saving...' : 'Save as draft'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------
// Admin: manage forms and see results
// ----------------------------------------------------------------------------
function AdminPanel({ forms, onCreate, onPublish, onClose, onResults, busyId }) {
  return (
    <div className="px-4 pt-6 space-y-4">
      <button
        type="button"
        onClick={onCreate}
        className="w-full flex items-center justify-center gap-2 rounded-full bg-[#0000c8] text-white py-3.5 font-bold text-[15px] shadow-md active:scale-[0.98] transition-transform"
      >
        <Plus size={18} strokeWidth={2.5} />
        Create feedback form
      </button>

      {forms.length === 0 && <p className="text-center text-[14px] text-slate-500 py-10">No forms have been created yet.</p>}

      {forms.map((form) => (
        <div key={form.id} className="rounded-[20px] border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex justify-between items-start gap-3">
            <div className="min-w-0">
              <p className="text-[16px] font-bold text-slate-900">{form.title}</p>
              <p className="text-[13px] text-slate-500 mt-1 font-medium">
                {form.questions.length} questions <span className="mx-1.5 text-slate-300">•</span>
                <span className={form.status === 'published' ? 'text-emerald-600' : form.status === 'closed' ? 'text-rose-500' : 'text-slate-500'}>
                  {form.status === 'published' ? 'Open to attendees' : form.status === 'closed' ? 'Closed' : 'Draft'}
                </span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mt-4">
            {form.status !== 'published' && (
              <button
                type="button"
                onClick={() => onPublish(form)}
                disabled={busyId === form.id}
                className="rounded-xl bg-emerald-50 text-emerald-700 px-4 py-2 text-[13px] font-bold disabled:opacity-50 transition-colors hover:bg-emerald-100"
              >
                Publish Form
              </button>
            )}
            {form.status === 'published' && (
              <button
                type="button"
                onClick={() => onClose(form)}
                disabled={busyId === form.id}
                className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-2 text-[13px] font-bold text-slate-700 disabled:opacity-50 hover:bg-slate-100 transition-colors"
              >
                Close Form
              </button>
            )}
            <button
              type="button"
              onClick={() => onResults(form)}
              className="flex items-center gap-1.5 rounded-xl bg-slate-50 border border-slate-200 px-4 py-2 text-[13px] font-bold text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <BarChart3 size={15} strokeWidth={2.5} />
              Results
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ----------------------------------------------------------------------------
// Admin: results sheet
// ----------------------------------------------------------------------------
function ResultsSheet({ formId, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    apiClient
      .get(`/feedback-forms/forms/${formId}/results`)
      .then((res) => {
        if (!cancelled) setData(unwrap(res?.data));
      })
      .catch((error) => {
        if (!cancelled) toast.error(getErrorMessage(error, 'Could not load the results'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [formId]);

  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-end justify-center" onClick={onClose}>
      <div
        className="bg-white w-full max-w-[430px] max-h-[85vh] rounded-t-[24px] flex flex-col mb-0 sm:mb-16"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <p className="font-bold text-slate-900 text-[17px]">Form Results</p>
          <button type="button" onClick={onClose} aria-label="Close" className="text-slate-400 hover:text-slate-700 bg-slate-100 p-1.5 rounded-full transition-colors">
            <X size={18} strokeWidth={2.5} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-6 pb-8">
          {loading && <div className="py-10"><LoadingSpinner /></div>}
          {!loading && data && (
            <>
              <div className="bg-[#f8f9fc] rounded-[16px] p-4 text-center border border-slate-100">
                <p className="text-[24px] font-black text-[#0000c8]">{data.total_responses}</p>
                <p className="text-[13px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">
                  Total {data.total_responses === 1 ? 'Response' : 'Responses'}
                </p>
              </div>
              
              {data.questions.map((q, i) => (
                <div key={i} className="space-y-3 bg-white border border-slate-100 shadow-sm rounded-[20px] p-5">
                  <p className="text-[15px] font-bold text-slate-800 border-b border-slate-100 pb-3">
                    {i + 1}. {q.text}
                  </p>
                  <div className="pt-1 space-y-1">
                    {q.options.map((opt) => (
                      <div key={opt.label} className="flex justify-between items-center text-[14px] text-slate-700 py-2">
                        <span className="font-medium">{opt.label}</span>
                        <span className="font-bold bg-slate-100 px-3 py-1 rounded-full text-[12px]">{opt.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------
// Screen
// ----------------------------------------------------------------------------
export default function FeedbackScreen() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeForm, setActiveForm] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [forms, setForms] = useState([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [resultsFormId, setResultsFormId] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const loadActive = async () => {
    const res = await apiClient.get('/feedback-forms/active');
    const data = unwrap(res?.data);
    setActiveForm(data);
    setSubmitted(Boolean(data?.already_submitted));
  };

  const loadForms = async () => {
    const res = await apiClient.get('/feedback-forms/forms');
    setForms(unwrap(res?.data) || []);
  };

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const roles = await apiClient.get('/session-admin/me/roles');
        const admin = Boolean(roles?.data?.data?.is_admin);
        if (cancelled) return;
        setIsAdmin(admin);
        if (admin) {
          await loadForms();
        }
        await loadActive();
      } catch (error) {
        if (!cancelled) toast.error(getErrorMessage(error, 'Could not load feedback'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const publish = async (form) => {
    setBusyId(form.id);
    try {
      await apiClient.post(`/feedback-forms/forms/${form.id}/publish`);
      toast.success('Form is now open to attendees');
      await Promise.all([loadForms(), loadActive()]);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not publish the form'));
    } finally {
      setBusyId(null);
    }
  };

  const close = async (form) => {
    setBusyId(form.id);
    try {
      await apiClient.post(`/feedback-forms/forms/${form.id}/close`);
      toast.success('Form closed');
      await Promise.all([loadForms(), loadActive()]);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not close the form'));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="min-h-screen bg-white max-w-[430px] mx-auto pb-28">
      {/* NEW CLEAN HEADER: Matches Image 1 */}
      <div className="bg-white text-slate-900 px-4 pt-5 pb-4 flex items-center gap-3 border-b border-slate-100 shadow-sm sticky top-0 z-10">
        <button type="button" onClick={() => navigate('/hub')} aria-label="Back" className="text-slate-900 p-1 active:scale-95 transition-transform">
          <ArrowLeft size={24} strokeWidth={2.5} />
        </button>
        <h1 className="text-[22px] font-bold tracking-tight">Feedback</h1>
      </div>

      {loading ? (
        <div className="py-24">
          <LoadingSpinner />
        </div>
      ) : isAdmin ? (
        <AdminPanel
          forms={forms}
          busyId={busyId}
          onCreate={() => setCreateOpen(true)}
          onPublish={publish}
          onClose={close}
          onResults={(form) => setResultsFormId(form.id)}
        />
      ) : submitted ? (
        <div className="px-6 pt-20 text-center space-y-4">
          <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-2">
            <CheckCircle2 size={40} className="text-emerald-500" strokeWidth={2.5} />
          </div>
          <p className="text-[20px] font-bold text-slate-900">Feedback Received</p>
          <p className="text-[15px] text-slate-600 leading-relaxed">Thank you for taking the time to share your thoughts. Your response has been securely recorded.</p>
        </div>
      ) : activeForm ? (
        <AttendeeForm
          form={activeForm}
          onSubmitted={() => setSubmitted(true)}
        />
      ) : (
        <div className="px-6 pt-24 text-center space-y-3">
          <p className="text-[18px] font-bold text-slate-800">No Active Forms</p>
          <p className="text-[15px] text-slate-500 leading-relaxed">There are currently no feedback forms open. Please check back later.</p>
        </div>
      )}

      {createOpen && (
        <CreateFormSheet
          onClose={() => setCreateOpen(false)}
          onCreated={async () => {
            setCreateOpen(false);
            await loadForms();
          }}
        />
      )}

      {resultsFormId !== null && (
        <ResultsSheet formId={resultsFormId} onClose={() => setResultsFormId(null)} />
      )}
    </div>
  );
}