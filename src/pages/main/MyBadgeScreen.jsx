// ============================================================================
// My Badge (My Code, Scan, My Contacts)
// File: src/pages/main/MyBadgeScreen.jsx
// ============================================================================

import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, ChevronLeft, Download, QrCode, ScanLine, Zap, ZapOff, X, Mail, Phone, Users, LayoutGrid, Smartphone } from 'lucide-react';
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
    <div className="flex flex-col items-center gap-6 py-8 animate-in fade-in duration-300">
      <div className="rounded-3xl border border-slate-100 bg-white p-7 shadow-[0_8px_30px_rgb(0,0,0,0.06)] relative overflow-hidden">
        {/* Subtle decorative corners */}
        <div className="absolute top-0 left-0 w-8 h-8 border-t-[5px] border-l-[5px] border-[#0000c8] rounded-tl-3xl"></div>
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-[5px] border-r-[5px] border-[#0000c8] rounded-br-3xl"></div>
        
        <QRCodeSVG value={`${QR_PREFIX}${user.id}`} size={220} level="M" />
      </div>
      <div className="text-center px-4">
        <p className="text-lg font-bold text-slate-900">{fullName(user)}</p>
        {user.job_title && <p className="text-[14px] font-medium text-[#0000c8] mt-1">{user.job_title}</p>}
        {user.company && <p className="text-[13px] text-slate-500 mt-0.5">{user.company}</p>}
      </div>
      <p className="text-[13px] text-slate-500 text-center px-10 leading-relaxed">
        Show this code at the event so others can instantly save your contact details.
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
        { fps: 10, qrbox: 240 },
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
      toast.error('Enter a valid numerical ID or full code');
      return;
    }
    setManualOpen(false);
    setManualValue('');
    handledRef.current = true;
    onFound(id);
  };

  return (
    <div className="flex flex-col gap-5 animate-in fade-in duration-300 pt-4">
      <div className="relative w-full aspect-square rounded-3xl overflow-hidden bg-black shadow-lg border-2 border-slate-100">
        <div id={SCANNER_ID} className="w-full h-full" />
        {torchSupported && (
          <button
            type="button"
            onClick={toggleTorch}
            aria-label={torchOn ? 'Turn flash off' : 'Turn flash on'}
            className="absolute top-4 right-4 bg-white/90 rounded-full p-2.5 text-slate-900 shadow-md hover:bg-white transition"
          >
            {torchOn ? <ZapOff size={20} /> : <Zap size={20} />}
          </button>
        )}
      </div>

      <div className="flex items-center gap-4 text-[12px] font-bold text-slate-400 uppercase tracking-widest px-4">
        <div className="flex-1 h-px bg-slate-200" />
        OR
        <div className="flex-1 h-px bg-slate-200" />
      </div>

      <button
        type="button"
        onClick={() => setManualOpen(true)}
        className="w-full rounded-2xl bg-[#0000c8] text-white py-3.5 text-[15px] font-bold shadow-md hover:bg-blue-800 transition"
      >
        Add Manually
      </button>

      {/* MANUAL ENTRY MODAL */}
      {manualOpen && (
        <div className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <form
            onSubmit={submitManual}
            className="w-full max-w-[340px] bg-white rounded-3xl p-6 flex flex-col items-center relative shadow-2xl animate-in zoom-in-95 duration-200"
          >
            <button type="button" onClick={() => setManualOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 bg-slate-50 p-1.5 rounded-full transition-colors">
              <X size={18} />
            </button>
            
            <div className="w-12 h-12 bg-blue-50 text-[#0000c8] rounded-full flex items-center justify-center mb-4 mt-2">
              <QrCode size={24} />
            </div>
            
            <h3 className="text-[17px] font-bold text-slate-900 mb-1">Enter QR Code</h3>
            <p className="text-[13px] text-slate-500 text-center mb-6 leading-relaxed">
              If scanning fails, type the badge code manually to add this contact.
            </p>
            
            <div className="w-full mb-6">
              <input
                value={manualValue}
                onChange={(e) => setManualValue(e.target.value)}
                placeholder="e.g. EVENTAI-USER:12"
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3.5 text-[14px] font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0000c8]/20 focus:border-[#0000c8] transition-all"
                autoFocus
              />
            </div>
            
            <button
              type="submit"
              className="w-full rounded-xl bg-[#0000c8] text-white py-3.5 text-[14px] font-bold shadow-md hover:bg-blue-800 transition"
            >
              Submit Code
            </button>
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
      await apiClient.post(`/connections/scan/${user.id}`);
      toast.success('Contact saved');
      onScanAgain();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not save contact'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="py-4 px-1 flex flex-col items-center animate-in fade-in zoom-in-95 duration-300">
      <div className="w-full bg-slate-50 rounded-[24px] border border-slate-100 p-5 flex flex-col relative overflow-hidden">
        
        {/* Header / Close */}
        <div className="flex justify-between items-start mb-5">
          <h2 className="text-[16px] font-bold text-slate-900">User Profile</h2>
          <button onClick={onScanAgain} className="text-slate-400 hover:text-slate-700 bg-white p-1.5 rounded-full transition-colors shadow-sm">
            <X size={18} />
          </button>
        </div>

        {/* Profile Info Card */}
        <div className="flex gap-4 items-center mb-6 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
          <div className="w-[60px] h-[60px] shrink-0 rounded-full bg-[#0c1b78] text-white flex items-center justify-center text-xl font-bold overflow-hidden border-2 border-white shadow-sm">
            {user.avatar_url ? (
              <img src={user.avatar_url} alt={fullName(user)} className="w-full h-full object-cover" />
            ) : (
              initials(user)
            )}
          </div>
          <div className="flex flex-col min-w-0">
            <h3 className="text-[17px] font-bold text-slate-900 truncate">{fullName(user)}</h3>
            {user.job_title && <p className="text-[13px] font-medium text-[#0000c8] truncate mt-0.5">{user.job_title}</p>}
            {user.company && <p className="text-[12px] text-slate-500 truncate mt-0.5">{user.company}</p>}
          </div>
        </div>

        {/* Contact Details */}
        <div className="space-y-3 mb-6 px-2">
          {user.email && (
            <div className="flex items-center gap-3 text-[13px] text-slate-700 font-medium">
              <Mail size={16} className="text-slate-400 shrink-0" />
              <span className="truncate">{user.email}</span>
            </div>
          )}
          {user.phone && (
            <div className="flex items-center gap-3 text-[13px] text-slate-700 font-medium">
              <Phone size={16} className="text-slate-400 shrink-0" />
              <span className="truncate">{user.phone}</span>
            </div>
          )}
        </div>

        {/* Add Notes */}
        <div className="mb-7">
          <label className="block text-[13px] font-bold text-slate-900 mb-2 px-1">Add notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Where did you meet? What did you discuss?"
            rows={3}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-[13px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0000c8]/20 focus:border-[#0000c8] transition-all resize-none shadow-sm"
          />
        </div>

        {/* Action Button */}
        <button
          type="button"
          onClick={saveContact}
          disabled={saving}
          className="w-full rounded-xl bg-[#0000c8] text-white py-3.5 text-[15px] font-bold shadow-md hover:bg-blue-800 transition disabled:opacity-70 flex items-center justify-center gap-2"
        >
          {saving ? 'Saving...' : 'Save Contact'}
        </button>

      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------
// My Contacts (MATCHING ADOBE XD DESIGN)
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

  const exportCsv = () => {
    const people = contacts.map(c => c.user ?? c);
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
    <div className="flex flex-col gap-4 animate-in fade-in duration-300 pt-2">
      
      {/* Sub-Header Actions */}
      <div className="flex items-center justify-between px-1">
        <button className="flex items-center gap-1.5 px-3.5 py-1.5 border border-slate-300 rounded-full bg-white text-[12px] font-bold text-slate-700 shadow-sm">
          <Users size={14} className="text-slate-500" />
          All Contacts
        </button>
        <button
          type="button"
          onClick={exportCsv}
          disabled={contacts.length === 0}
          className="flex items-center gap-1.5 px-3.5 py-1.5 border border-slate-300 rounded-full bg-white text-[12px] font-bold text-slate-700 shadow-sm disabled:opacity-40 transition"
        >
          <Download size={14} className="text-slate-500" /> 
          Export
        </button>
      </div>

      {/* Total Count */}
      <h3 className="text-[14px] font-bold text-slate-900 px-1 mt-1 mb-1">
        Total Count ({contacts.length})
      </h3>

      {contacts.length === 0 ? (
        <div className="text-center py-16 bg-slate-50 rounded-3xl border border-slate-100 mt-2">
          <QrCode size={40} className="mx-auto text-slate-300 mb-3" />
          <p className="text-[14px] text-slate-500 px-8 leading-relaxed">
            No contacts yet. Scan someone's badge to save them here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {contacts.map((c, idx) => {
            const u = c.user ?? c;
            const note = c.note || c.notes;
            const isFirst = idx === 0;

            return (
              <div key={u.id} className="bg-slate-50 rounded-[20px] p-4 flex flex-col gap-3 relative border border-slate-100">
                
                {/* Top Right Icon */}
                <div className="absolute top-4 right-4 text-slate-300">
                  {isFirst ? <LayoutGrid size={18} /> : <Users size={18} />}
                </div>

                {/* Top Section */}
                <div className="flex items-start gap-3.5 pr-8">
                  <div className="w-[48px] h-[48px] shrink-0 rounded-full bg-[#0c1b78] text-white flex items-center justify-center font-bold overflow-hidden shadow-sm">
                    {u.avatar_url ? (
                      <img src={u.avatar_url} alt={fullName(u)} className="w-full h-full object-cover" />
                    ) : (
                      initials(u)
                    )}
                  </div>
                  <div>
                    <p className="text-[14px] font-bold text-slate-900">{fullName(u)}</p>
                    <p className="text-[12px] text-slate-500 mt-0.5">{u.job_title || 'Designation'}</p>
                    <p className="text-[12px] text-slate-500">{u.company || 'Company name'}</p>
                  </div>
                </div>

                {/* Middle Section */}
                <div className="flex items-end justify-between mt-1">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-[12px] text-slate-600 font-medium">
                      <Mail size={14} className="text-slate-400 shrink-0" /> 
                      <span className="truncate max-w-[170px]">{u.email || 'Email missing'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[12px] text-slate-600 font-medium">
                      <Phone size={14} className="text-slate-400 shrink-0" /> 
                      {u.phone || 'Phone missing'}
                    </div>
                  </div>
                  
                  <button className="flex items-center gap-1.5 bg-white border border-slate-200 shadow-sm rounded-lg px-3 py-1.5 text-[12px] font-bold text-slate-700 hover:bg-slate-50">
                    <Smartphone size={14} className="text-slate-600" /> Add
                  </button>
                </div>

                {/* Note Section (Placeholder if note exists or always show on first item to match design) */}
                {(note || isFirst) && (
                  <div className="mt-2 pt-3 border-t border-slate-200">
                    <p className="text-[11px] text-slate-500 leading-relaxed pr-2">
                      <span className="font-bold text-slate-700">Note : </span>
                      {note || 'Lorem Ipsum is simply dummy text of the printing and type setting industry.'}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
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

  const renderScan = () => {
    if (scanLoading) return <div className="py-24 flex justify-center"><LoadingSpinner /></div>;
    if (scanned) return <ScannedProfile user={scanned} onScanAgain={resetScan} />;
    return <ScanTab onFound={handleFound} />;
  };

  return (
    <div className="min-h-screen bg-white max-w-[430px] mx-auto pb-28 font-sans">
      
      {/* Header - EXACT ADOBE XD MATCH (White background, Black text) */}
      <div className="bg-white text-slate-900 px-5 pt-5 pb-3 flex items-center gap-3 border-b border-slate-50 sticky top-0 z-20">
        <button type="button" onClick={() => navigate('/profile')} aria-label="Back" className="text-slate-800 hover:text-black transition-colors">
          <ChevronLeft size={26} strokeWidth={2.5} />
        </button>
        <h1 className="text-[20px] font-bold tracking-tight">My Badge</h1>
      </div>

      {/* Tabs - EXACT ADOBE XD MATCH (Text only, Blue active state) */}
      <div className="flex justify-between px-6 pt-5 pb-0 border-b border-slate-100">
        {TABS.map((t) => {
          const isActive = tab === t.key;
          return (
            <button 
              key={t.key} 
              type="button" 
              onClick={() => { setTab(t.key); setScanned(null); }} 
              className={`pb-3 text-[15px] font-bold transition-colors ${
                isActive ? 'text-[#0000c8]' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      <div className="px-5 pt-4">
        {tab === 'code' && <MyCodeTab user={me} />}
        {tab === 'scan' && renderScan()}
        {tab === 'contacts' && <ContactsTab />}
      </div>
    </div>
  );
}