// ============================================================================
// Feedback Screen (matches the reference video)
// File: src/pages/main/FeedbackScreen.jsx
// Route: /feedback
// Real API only:
//   GET  /feedback-forms/active                  active form for attendees
//   POST /feedback-forms/forms/{id}/responses    submit answers
//   GET  /feedback-forms/forms                   admin: all forms
//   POST /feedback-forms/forms                   admin: create form
//   POST /feedback-forms/forms/{id}/publish      admin: publish
//   POST /feedback-forms/forms/{id}/close        admin: close
//   GET  /feedback-forms/forms/{id}/results      admin: results
//   GET  /session-admin/me/roles                 is this account an organizer
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
// One question, shown to attendees
// ----------------------------------------------------------------------------
function QuestionInput({ index, question, value, onChange }) {
  const selected = value ?? (question.type === 'checkbox' ? [] : '');

  if (question.type === 'checkbox') {
    const toggle = (opt) => {
      const next = selected.includes(opt) ? selected.filter((v) => v !== opt) : [...selected, opt];
      onChange(index, next);
    };
    return (
      <div className="space-y-2">
        {question.options.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => toggle(opt)}
            className="w-full flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-left text-sm text-slate-800"
          >
            <span
              className={`w-5 h-5 rounded border flex items-center justify-center ${
                selected.includes(opt) ? 'bg-[#0000c8] border-[#0000c8] text-white' : 'border-slate-400'
              }`}
            >
              {selected.includes(opt) && <CheckCircle2 size={14} />}
            </span>
            {opt}
          </button>
        ))}
      </div>
    );
  }

  if (question.type === 'dropdown') {
    return (
      <select
        value={selected}
        onChange={(e) => onChange(index, e.target.value)}
        className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">Select an option</option>
        {question.options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    );
  }

  if (question.type === 'emoji') {
    return (
      <div className="flex justify-between">
        {EMOJIS.map((emoji, i) => {
          const option = question.options[i] ?? EMOJIS[i];
          const active = selected === option;
          return (
            <button
              key={emoji}
              type="button"
              onClick={() => onChange(index, option)}
              aria-label={`Rate ${i + 1} of 5`}
              className={`w-12 h-12 rounded-full text-2xl flex items-center justify-center border ${
                active ? 'border-[#0000c8] bg-blue-50' : 'border-transparent'
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
    <div className="space-y-2">
      {question.options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(index, opt)}
          className="w-full flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-left text-sm text-slate-800"
        >
          <span
            className={`w-5 h-5 rounded-full border flex items-center justify-center ${
              selected === opt ? 'border-[#0000c8]' : 'border-slate-400'
            }`}
          >
            {selected === opt && <span className="w-2.5 h-2.5 rounded-full bg-[#0000c8]" />}
          </span>
          {opt}
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
    <form onSubmit={submit} className="px-4 pt-4 space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">{form.title}</h2>
        {form.description && <p className="text-sm text-slate-600 mt-1">{form.description}</p>}
      </div>

      {form.questions.map((q, index) => (
        <div key={index} className="space-y-3">
          <p className="text-sm font-semibold text-slate-900">
            {index + 1}. {q.text}
            {q.required && <span className="text-red-500"> *</span>}
          </p>
          <QuestionInput index={index} question={q} value={answers[index]} onChange={setAnswer} />
        </div>
      ))}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-xl bg-[#0000c8] text-white py-3 font-semibold disabled:opacity-50"
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
    'w-full px-3 py-2.5 border border-slate-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500';

  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-end justify-center" onClick={onClose}>
      <div
        className="bg-white w-full max-w-[430px] max-h-[90vh] rounded-t-2xl flex flex-col mb-16"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
          <p className="font-semibold text-slate-900">Create feedback form</p>
          <button type="button" onClick={onClose} aria-label="Close" className="text-slate-500">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={submit} className="flex-1 overflow-y-auto p-4 space-y-5">
          <div>
            <label className="text-sm font-semibold text-slate-800">Form title</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className={`${inputClass} mt-1`} />
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-800">Description (optional)</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className={`${inputClass} mt-1`} />
          </div>

          {questions.map((q, index) => (
            <div key={index} className="rounded-xl border border-slate-200 p-4 space-y-3">
              <div className="flex justify-between items-center">
                <p className="text-sm font-semibold text-slate-900">Question {index + 1}</p>
                {questions.length > 1 && (
                  <button type="button" onClick={() => removeQuestion(index)} aria-label="Remove question" className="text-red-600">
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

              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={q.required}
                  onChange={(e) => updateQuestion(index, { required: e.target.checked })}
                />
                Required
              </label>
            </div>
          ))}

          <button type="button" onClick={addQuestion} className="text-sm font-semibold text-[#0000c8]">
            + Add question
          </button>

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-lg bg-[#0000c8] text-white py-3 font-semibold disabled:opacity-50"
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
    <div className="px-4 pt-4 space-y-4">
      <button
        type="button"
        onClick={onCreate}
        className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#0000c8] text-white py-3 font-semibold"
      >
        <Plus size={18} />
        Create feedback form
      </button>

      {forms.length === 0 && <p className="text-center text-sm text-slate-500 py-8">No forms yet.</p>}

      {forms.map((form) => (
        <div key={form.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex justify-between items-start gap-3">
            <div className="min-w-0">
              <p className="text-base font-semibold text-slate-900">{form.title}</p>
              <p className="text-xs text-slate-500 mt-1">
                {form.questions.length} questions |{' '}
                {form.status === 'published' ? 'Open to attendees' : form.status === 'closed' ? 'Closed' : 'Draft'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mt-3">
            {form.status !== 'published' && (
              <button
                type="button"
                onClick={() => onPublish(form)}
                disabled={busyId === form.id}
                className="rounded-lg bg-emerald-600 text-white px-3 py-1.5 text-sm font-semibold disabled:opacity-50"
              >
                Publish
              </button>
            )}
            {form.status === 'published' && (
              <button
                type="button"
                onClick={() => onClose(form)}
                disabled={busyId === form.id}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-800 disabled:opacity-50"
              >
                Close
              </button>
            )}
            <button
              type="button"
              onClick={() => onResults(form)}
              className="flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-800"
            >
              <BarChart3 size={14} />
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
        className="bg-white w-full max-w-[430px] max-h-[85vh] rounded-t-2xl flex flex-col mb-16"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
          <p className="font-semibold text-slate-900">Results</p>
          <button type="button" onClick={onClose} aria-label="Close" className="text-slate-500">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {loading && <LoadingSpinner />}
          {!loading && data && (
            <>
              <p className="text-sm text-slate-600">
                {data.total_responses} {data.total_responses === 1 ? 'response' : 'responses'}
              </p>
              {data.questions.map((q, i) => (
                <div key={i} className="space-y-2">
                  <p className="text-sm font-semibold text-slate-900">
                    {i + 1}. {q.text}
                  </p>
                  {q.options.map((opt) => (
                    <div key={opt.label} className="flex justify-between text-sm text-slate-700 border-b border-slate-100 py-1">
                      <span>{opt.label}</span>
                      <span className="font-semibold">{opt.count}</span>
                    </div>
                  ))}
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
      <div className="bg-[#0c1b78] text-white px-4 pt-5 pb-4 flex items-center gap-3">
        <button type="button" onClick={() => navigate('/hub')} aria-label="Back" className="text-white">
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-xl font-bold">Feedback</h1>
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
        <div className="px-6 pt-20 text-center space-y-3">
          <CheckCircle2 size={48} className="mx-auto text-emerald-600" />
          <p className="text-lg font-semibold text-slate-900">Thank you for your feedback</p>
          <p className="text-sm text-slate-600">Your response has been recorded.</p>
        </div>
      ) : activeForm ? (
        <AttendeeForm
          form={activeForm}
          onSubmitted={() => setSubmitted(true)}
        />
      ) : (
        <p className="text-center text-sm text-slate-500 py-16 px-6">
          There is no feedback form open right now. Check back later.
        </p>
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