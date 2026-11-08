// ============================================================================
// Blocked people list (shown inside My Contacts)
// File: src/components/networking/BlockedList.jsx
// Real API only:
//   GET    /blocks/
//   DELETE /blocks/{user_id}
// ============================================================================

import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import LoadingSpinner from '../common/LoadingSpinner';
import apiClient from '../../config/apiClient';

const getErrorMessage = (error, fallback) =>
  error?.data?.detail || error?.response?.data?.detail || error?.message || fallback;

const initialsOf = (name) =>
  (name || 'A').split(' ').filter(Boolean).map((p) => p[0]).join('').slice(0, 2).toUpperCase() || 'A';

export default function BlockedList() {
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/blocks/');
      setPeople(res?.data?.data || []);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not load blocked people'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const unblock = async (person) => {
    setBusyId(person.user_id);
    try {
      await apiClient.delete(`/blocks/${person.user_id}`);
      toast.success('Unblocked');
      await load();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not unblock this person'));
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return (
      <div className="py-16">
        <LoadingSpinner />
      </div>
    );
  }

  if (people.length === 0) {
    return <p className="text-center text-sm text-slate-500 py-12">You have not blocked anyone.</p>;
  }

  return (
    <div className="space-y-3">
      {people.map((p) => (
        <div key={p.user_id} className="flex items-center gap-3 rounded-2xl border border-slate-200 p-4">
          {p.avatar_url ? (
            <img src={p.avatar_url} alt={p.name} className="w-12 h-12 rounded-full object-cover shrink-0" />
          ) : (
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center font-semibold text-slate-600 shrink-0">
              {initialsOf(p.name)}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-900 truncate">{p.name}</p>
            {p.job_title && <p className="text-xs text-slate-500 truncate">{p.job_title}</p>}
          </div>
          <button
            type="button"
            onClick={() => unblock(p)}
            disabled={busyId === p.user_id}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-800 disabled:opacity-50"
          >
            Unblock
          </button>
        </div>
      ))}
    </div>
  );
}