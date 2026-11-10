// ============================================================================
// My Badge (My Code, Scan, My Contacts)
// File: src/pages/main/MyBadgeScreen.jsx
// Route: /my-badges
// QR payload: "EVENTAI-USER:<id>" only. Details are looked up from the server.
// ============================================================================

import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, Download, QrCode, ScanLine, Zap, ZapOff } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Html5Qrcode } from 'html5-qrcode';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import apiClient from '../../config/apiClient';

const QR_PREFIX = 'EVENTAI-USER:';
const SCANNER_ID = 'badge-scanner-region';

const TABS = [
  { key: 'code', label: 'My Code' },
  { key: 'scan', label: 'Scan' },
  { key: 'contacts', label: 'My Contacts' },
];

const getErrorMessage = (error, fallback) =>
  error?.data?.detail || error?.response?.data?.detail || error?.message || fallback;

const listFrom = (body, key) => {
  if (Array.isArray(body)) return body;
  if (Array.isArray(body?.data)) return body.data;
  if (Array.isArray(body?.data?.[key])) return body.data[key];
  if (Array.isArray(body?.[key])) return body[key];
  return [];
};

const parseUserId = (text) => {
  const match = String(text || '').trim().match(/^EVENTAI-USER:(\d+)$/);
  return match ? Number(match[1]) : null;
};

const fullName = (u) =>
  [u?.first_name, u?.last_name].filter(Boolean).join(' ') || u?.username || 'Unknown';

const initials = (u) =>
  fullName(u)
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

// ----------------------------------------------------------------------------
// My Code
// ----------------------------------------------------------------------------
function MyCodeTab({ user }) {
  if (!user) return <div className="py-16"><LoadingSpinner /></div>;

  return (
    <div className="flex flex-col items-center gap-4 py-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <QRCodeSVG value={`${QR_PREFIX}${user.id}`} size={220} level="M" />
      </div>
      <div className="text-center">
        <p className="text-base font-semibold text-slate-900">{fullName(user)}</p>
        {user.job_title && <p className="text-sm text-slate-600">{user.job_title}</p>}
        {user.company && <p className="text-sm text-slate-600">{user.company}</p>}
      </div>
      <p className="text-xs text-slate-500 text-center px-8">
        Show this code at the event so others can save your contact.
      </p>
    </div>
  );
}

// ----------------------------------------------------------------------------
// Scan (camera + manual entry)
// ----------------------------------------------------------------------------
function ScanTab({ onFound }) {
  const [torchSupported, setTorchSupported] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const [manualValue, setManualValue] = useState('');
  const scannerRef = useRef(null);
  const handledRef = useRef(false);
  const warnedRef = useRef(false);

  useEffect(() => {
    const scanner = new Html5Qrcode(SCANNER_ID);
    scannerRef.current = scanner;
    handledRef.current = false;

    scanner
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: 220 },
        (text) => {
          if (handledRef.current) return;
          const id = parseUserId(text);
          if (id) {
            handledRef.current = true;
            onFound(id);
          } else if (!warnedRef.current) {
            warnedRef.current = true;
            toast.error('This is not an EventAI badge code');
          }
        },
        () => {}
      )
      .then(() => {
        try {
          const caps = scanner.getRunningTrackCapabilities?.();
          setTorchSupported(Boolean(caps?.torch));
        } catch {
          setTorchSupported(false);
        }
      })
      .catch(() => toast.error('Camera permission is needed to scan'));

    return () => {
      scanner
        .stop()
        .catch(() => {})
        .then(() => {
          try {
            scanner.clear();
          } catch {
            /* already cleared */
          }
        });
    };
  }, [onFound]);

  const toggleTorch = async () => {
    try {
      const next = !torchOn;
      await scannerRef.current?.applyVideoConstraints({ advanced: [{ torch: next }] });
      setTorchOn(next);
    } catch {
      toast.error('Flash is not available on this device');
    }
  };

  const submitManual = (e) => {
    e.preventDefault();
    const id = parseUserId(manualValue) ?? (/^\d+$/.test(manualValue.trim()) ? Number(manualValue.trim()) : null);
    if (!id) {
      toast.error('Enter a valid code');
      return;
    }
    setManualOpen(false);
    setManualValue('');
    handledRef.current = true;
    onFound(id);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-black">
        <div id={SCANNER_ID} className="w-full h-full" />
        {torchSupported && (
          <button
            type="button"
            onClick={toggleTorch}
            aria-label={torchOn ? 'Turn flash off' : 'Turn flash on'}
            className="absolute top-3 right-3 bg-white/90 rounded-full p-2 text-slate-900"
          >
            {torchOn ? <ZapOff size={18} /> : <Zap size={18} />}
          </button>
        )}
      </div>

      <div className="flex items-center gap-3 text-xs text-slate-500">
        <div className="flex-1 h-px bg-slate-200" />
        OR
        <div className="flex-1 h-px bg-slate-200" />
      </div>

      <button
        type="button"
        onClick={() => setManualOpen(true)}
        className="w-full rounded-xl bg-[#0000c8] text-white py-3 text-sm font-semibold"
      >
        Add Manually
      </button>

      {manualOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end justify-center">
          <form
            onSubmit={submitManual}
            className="w-full max-w-[430px] bg-white rounded-t-2xl p-5 flex flex-col gap-3"
          >
            <p className="text-base font-semibold text-slate-900">Enter QR Code</p>
            <input
              value={manualValue}
              onChange={(e) => setManualValue(e.target.value)}
              placeholder="EVENTAI-USER:12"
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setManualOpen(false)}
                className="flex-1 rounded-xl border border-slate-300 py-2.5 text-sm font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 rounded-xl bg-[#0000c8] text-white py-2.5 text-sm font-semibold"
              >
                Submit
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------------------------------
// Scanned profile (after a successful scan)
// ----------------------------------------------------------------------------
function ScannedProfile({ user, onScanAgain }) {
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const saveContact = async () => {
    setSaving(true);
    try {
      await apiClient.post(`/users/${user.id}/connect`);
      toast.success('Contact saved');
      onScanAgain();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not save contact'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 py-4">
      <div className="w-24 h-24 rounded-full bg-[#0c1b78] text-white flex items-center justify-center text-2xl font-bold overflow-hidden">
        {user.avatar_url ? (
          <img src={user.avatar_url} alt={fullName(user)} className="w-full h-full object-cover" />
        ) : (
          initials(user)
        )}
      </div>
      <div className="text-center">
        <p className="text-lg font-semibold text-slate-900">{fullName(user)}</p>
        {user.job_title && <p className="text-sm text-slate-600">{user.job_title}</p>}
        {user.company && <p className="text-sm text-slate-600">{user.company}</p>}
      </div>

      <div className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 space-y-1">
        {user.email && <p>{user.email}</p>}
        {user.phone && <p>{user.phone}</p>}
      </div>

      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Add notes"
        rows={3}
        className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
      />

      <button
        type="button"
        onClick={saveContact}
        disabled={saving}
        className="w-full rounded-xl bg-[#0000c8] text-white py-3 text-sm font-semibold disabled:opacity-60"
      >
        {saving ? 'Saving...' : 'Save Contact'}
      </button>
      <button type="button" onClick={onScanAgain} className="text-sm text-slate-600 underline">
        Scan another
      </button>
    </div>
  );
}

// ----------------------------------------------------------------------------
// My Contacts
// ----------------------------------------------------------------------------
function ContactsTab() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    apiClient
      .get('/connections/contacts')
      .then((res) => {
        if (!cancelled) setContacts(listFrom(res?.data, 'contacts'));
      })
      .catch((error) => {
        if (!cancelled) toast.error(getErrorMessage(error, 'Could not load contacts'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Contacts may come back flat or wrapped in a "user" object.
  const people = contacts.map((c) => c.user ?? c);

  const exportCsv = () => {
    const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const rows = people.map((u) =>
      [fullName(u), u.email, u.phone, u.company, u.job_title].map(esc).join(',')
    );
    const csv = ['Name,Email,Phone,Company,Designation', ...rows].join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'my-contacts.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <div className="py-16"><LoadingSpinner /></div>;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-800">
          All Contacts ({people.length})
        </span>
        <button
          type="button"
          onClick={exportCsv}
          disabled={people.length === 0}
          className="flex items-center gap-1 text-sm font-semibold text-[#0000c8] disabled:opacity-40"
        >
          <Download size={16} /> Export
        </button>
      </div>

      {people.length === 0 ? (
        <p className="text-center text-sm text-slate-500 py-12">
          No contacts yet. Scan someone's badge to save them.
        </p>
      ) : (
        people.map((u) => (
          <div key={u.id} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="w-12 h-12 shrink-0 rounded-full bg-[#0c1b78] text-white flex items-center justify-center font-bold overflow-hidden">
              {u.avatar_url ? (
                <img src={u.avatar_url} alt={fullName(u)} className="w-full h-full object-cover" />
              ) : (
                initials(u)
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-900 truncate">{fullName(u)}</p>
              {u.job_title && <p className="text-xs text-slate-600 truncate">{u.job_title}</p>}
              {u.email && <p className="text-xs text-slate-500 truncate">{u.email}</p>}
              {u.phone && <p className="text-xs text-slate-500 truncate">{u.phone}</p>}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

// ----------------------------------------------------------------------------
// Screen
// ----------------------------------------------------------------------------
export default function MyBadgeScreen() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('code');
  const [me, setMe] = useState(null);
  const [scanLoading, setScanLoading] = useState(false);
  const [scanned, setScanned] = useState(null);

  useEffect(() => {
    apiClient
      .get('/auth/me')
      .then((res) => {
        const body = res?.data;
        setMe(body?.data ?? body?.user ?? body);
      })
      .catch((error) => toast.error(getErrorMessage(error, 'Could not load your profile')));
  }, []);

  const handleFound = useCallback(async (id) => {
    setScanLoading(true);
    try {
      const res = await apiClient.get(`/users/${id}`);
      const body = res?.data;
      setScanned(body?.data ?? body);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Profile not found'));
    } finally {
      setScanLoading(false);
    }
  }, []);

  const resetScan = useCallback(() => setScanned(null), []);

  const tabClass = (active) =>
    `flex-1 rounded-xl py-2.5 text-sm font-semibold border ${
      active ? 'bg-[#0000c8] text-white border-[#0000c8]' : 'border-slate-300 text-slate-800'
    }`;

  const renderScan = () => {
    if (scanLoading) return <div className="py-16"><LoadingSpinner /></div>;
    if (scanned) return <ScannedProfile user={scanned} onScanAgain={resetScan} />;
    return <ScanTab onFound={handleFound} />;
  };

  return (
    <div className="min-h-screen bg-white max-w-[430px] mx-auto pb-28">
      <div className="bg-[#0c1b78] text-white px-4 pt-5 pb-4 flex items-center gap-3">
        <button type="button" onClick={() => navigate('/profile')} aria-label="Back" className="text-white">
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-xl font-bold">My Badge</h1>
      </div>

      <div className="flex gap-2 px-4 pt-4">
        {TABS.map((t) => (
          <button key={t.key} type="button" onClick={() => setTab(t.key)} className={tabClass(tab === t.key)}>
            {t.key === 'code' && <QrCode size={14} className="inline mr-1 -mt-0.5" />}
            {t.key === 'scan' && <ScanLine size={14} className="inline mr-1 -mt-0.5" />}
            {t.label}
          </button>
        ))}
      </div>

      <div className="px-4 pt-4">
        {tab === 'code' && <MyCodeTab user={me} />}
        {tab === 'scan' && renderScan()}
        {tab === 'contacts' && <ContactsTab />}
      </div>
    </div>
  );
}