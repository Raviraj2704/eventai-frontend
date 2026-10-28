// ============================================================================
// Partner Detail Screen
// File: src/pages/engagement/PartnerDetailScreen.jsx
// ============================================================================

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ArrowLeft, Camera, FileText, Video, Trash2, CheckCircle2,
  Clock, X, Link as LinkIcon, Search, UserPlus, Upload, ExternalLink,
  MapPin, Mail, Phone, ImagePlus, Bookmark, Linkedin, Twitter, Globe, Edit3
} from 'lucide-react';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import apiClient from '../../config/apiClient';

const MB = 1024 * 1024;
const LIMITS = { image: 5 * MB, document: 10 * MB, video: 100 * MB };
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/webm'];
const DOCUMENT_EXT = /\.(pdf|ppt|pptx|doc|docx|xls|xlsx)$/i;
const DOCUMENT_ACCEPT = '.pdf,.ppt,.pptx,.doc,.docx,.xls,.xlsx';
const VIDEO_ACCEPT = 'video/mp4,video/quicktime,video/webm';
const VIDEO_LINK = /^https:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|vimeo\.com\/)/i;

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------

const getErrorMessage = (error, fallback) => {
  const detail = error?.data?.detail || error?.response?.data?.detail;
  if (typeof detail === 'string') return detail;
  if (error?.message && error.message !== 'Network Error') return error.message;
  return fallback;
};

const unwrapList = (body) => {
  if (Array.isArray(body)) return body;
  if (Array.isArray(body?.data)) return body.data;
  return [];
};

const personName = (u) =>
  u?.name || `${u?.first_name || ''} ${u?.last_name || ''}`.trim() || u?.username || 'Attendee';

const initialsOf = (name) =>
  (name || 'A')
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'A';

const checkFile = (file, kind) => {
  if (!file) return 'No file selected';
  if (kind === 'image') {
    if (!IMAGE_TYPES.includes(file.type)) return 'Use a JPG, PNG, or WEBP photo';
    if (file.size > LIMITS.image) return 'Photo must be 5 MB or smaller';
  }
  if (kind === 'document') {
    if (!DOCUMENT_EXT.test(file.name)) return 'Use a PDF, PowerPoint, Word, or Excel file';
    if (file.size > LIMITS.document) return 'Document must be 10 MB or smaller';
  }
  if (kind === 'video') {
    if (!VIDEO_TYPES.includes(file.type)) return 'Use an MP4, MOV, or WEBM video';
    if (file.size > LIMITS.video) return 'Video must be 100 MB or smaller';
  }
  return null;
};

const postForm = async (path, formData) => {
  const token = localStorage.getItem('access_token');
  const base = (apiClient.defaults.baseURL || '').replace(/\/$/, '');
  const res = await fetch(`${base}${path}`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail = body?.detail;
    throw new Error(typeof detail === 'string' ? detail : 'Upload failed. Please try again.');
  }
  return body;
};

const pickedFile = (event) => {
  const file = event.target.files?.[0] || null;
  event.target.value = '';
  return file;
};

// ----------------------------------------------------------------------------
// Small UI pieces
// ----------------------------------------------------------------------------

const PersonAvatar = ({ src, name, size = 'w-12 h-12' }) =>
  src ? (
    <img src={src} alt={name} className={`${size} rounded-full object-cover shrink-0`} />
  ) : (
    <div className={`${size} rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-semibold text-slate-600 shrink-0`}>
      {initialsOf(name)}
    </div>
  );

const Sheet = ({ title, onClose, children }) => (
  <div className="fixed inset-0 bg-black/50 z-[60] flex items-end justify-center" onClick={onClose}>
    <div className="bg-white w-full max-w-[430px] max-h-[85vh] rounded-t-2xl flex flex-col mb-16" onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
        <p className="font-semibold text-slate-900">{title}</p>
        <button onClick={onClose} aria-label="Close" className="text-slate-500">
          <X size={20} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4">{children}</div>
    </div>
  </div>
);

const StatusBadge = ({ status }) =>
  status === 'pending' ? (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
      <Clock size={12} /> Pending approval
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
      <CheckCircle2 size={12} /> Published
    </span>
  );

// ----------------------------------------------------------------------------
// Screen
// ----------------------------------------------------------------------------

export default function PartnerDetailScreen() {
  const { partnerId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [partner, setPartner] = useState(null);
  const [me, setMe] = useState(null);
  
  // Image states
  const [logoUrl, setLogoUrl] = useState(null);
  const [coverUrl, setCoverUrl] = useState(null);
  
  const [files, setFiles] = useState([]);
  const [representatives, setRepresentatives] = useState([]);

  // Interactive Features State
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [note, setNote] = useState('');
  const [isEditingNote, setIsEditingNote] = useState(false);

  const [sheet, setSheet] = useState(null); // documents | videos | addRep | logo | cover
  const [pendingKind, setPendingKind] = useState('logo');
  const [busy, setBusy] = useState('');

  // Video link form
  const [linkTitle, setLinkTitle] = useState('');
  const [linkUrl, setLinkUrl] = useState('');

  // Add representative
  const [userQuery, setUserQuery] = useState('');
  const [userResults, setUserResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [designation, setDesignation] = useState('Representative');

  // Hidden file inputs
  const cameraRef = useRef(null);
  const galleryRef = useRef(null);
  const documentRef = useRef(null);
  const videoRef = useRef(null);

  const isOrganizer = Boolean(me?.is_admin) || me?.role === 'admin' || me?.email === 'ravirajapanthulu@gmail.com';
  const isRepresentative = useMemo(
    () => Boolean(me) && representatives.some((r) => r.user_id === me.id),
    [me, representatives]
  );
  const canManage = isOrganizer || isRepresentative;

  const documents = files.filter((f) => f.kind === 'document');
  const videos = files.filter((f) => f.kind === 'video');

  // ---------------------------------------------------------------------------
  // Loading
  // ---------------------------------------------------------------------------
  const loadFiles = useCallback(async () => {
    const res = await apiClient.get(`/partner-hub/${partnerId}/files`);
    setFiles(unwrapList(res?.data));
  }, [partnerId]);

  const loadRepresentatives = useCallback(async () => {
    const res = await apiClient.get(`/partner-hub/${partnerId}/representatives`);
    setRepresentatives(unwrapList(res?.data));
  }, [partnerId]);

  const loadImages = useCallback(async () => {
    const res = await apiClient.get(`/partner-hub/${partnerId}/images`);
    const data = res?.data?.data || {};
    setLogoUrl(data.logo || null);
    setCoverUrl(data.cover || null);
  }, [partnerId]);

  useEffect(() => {
    let cancelled = false;

    const loadAll = async () => {
      setLoading(true);
      try {
        const [meRes, partnersRes] = await Promise.all([
          apiClient.get('/users/me'),
          apiClient.get('/partners', { params: { limit: 50 } }),
        ]);
        if (cancelled) return;

        const meBody = meRes?.data;
        setMe(meBody?.data ?? meBody ?? null);

        const found = unwrapList(partnersRes?.data).find(
          (p) => String(p.id) === String(partnerId)
        );
        setPartner(found || null);

        await Promise.all([loadFiles(), loadRepresentatives(), loadImages()]);
      } catch (error) {
        if (!cancelled) toast.error(getErrorMessage(error, 'Could not load this partner'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadAll();
    return () => {
      cancelled = true;
    };
  }, [partnerId, loadFiles, loadRepresentatives, loadImages]);

  const runAction = async (key, action) => {
    setBusy(key);
    try {
      await action();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Something went wrong. Please try again.'));
    } finally {
      setBusy('');
    }
  };

  // ---------------------------------------------------------------------------
  // Images (camera or gallery)
  // ---------------------------------------------------------------------------
  const handleImage = (kind, file) =>
    runAction(kind, async () => {
      const problem = checkFile(file, 'image');
      if (problem) {
        toast.error(problem);
        return;
      }
      const form = new FormData();
      form.append('file', file);
      const body = await postForm(`/partner-hub/${partnerId}/images/${kind}`, form);
      const url = body?.data?.url || null;
      if (kind === 'logo') setLogoUrl(url);
      else setCoverUrl(url);
      toast.success(kind === 'logo' ? 'Logo updated' : 'Cover updated');
    });

  // ---------------------------------------------------------------------------
  // Documents and videos
  // ---------------------------------------------------------------------------
  const handleUploadFile = (kind, file) =>
    runAction(kind, async () => {
      const problem = checkFile(file, kind);
      if (problem) {
        toast.error(problem);
        return;
      }
      const rawTitle = file.name.replace(/\.[^.]+$/, '').trim();
      const title = (rawTitle.length >= 2 ? rawTitle : kind).slice(0, 200);

      const form = new FormData();
      form.append('title', title);
      form.append('file', file);
      await postForm(`/partner-hub/${partnerId}/files`, form);

      toast.success(isOrganizer ? 'Published' : 'Sent for organizer approval');
      await loadFiles();
    });

  const handleAddVideoLink = () =>
    runAction('link', async () => {
      const title = linkTitle.trim();
      const url = linkUrl.trim();
      if (title.length < 2) {
        toast.error('Enter a title for the video');
        return;
      }
      if (!VIDEO_LINK.test(url)) {
        toast.error('Paste a YouTube or Vimeo link');
        return;
      }
      await apiClient.post(`/partner-hub/${partnerId}/video-links`, { title, url });
      setLinkTitle('');
      setLinkUrl('');
      toast.success(isOrganizer ? 'Video added' : 'Video sent for organizer approval');
      await loadFiles();
    });

  const handleApprove = (fileId) =>
    runAction('approve', async () => {
      await apiClient.post(`/partner-hub/files/${fileId}/approve`);
      toast.success('Approved');
      await loadFiles();
    });

  const handleDeleteFile = (fileId) => {
    if (!window.confirm('Delete this file?')) return;
    runAction('delete', async () => {
      await apiClient.delete(`/partner-hub/files/${fileId}`);
      toast.success('Deleted');
      await loadFiles();
    });
  };

  // ---------------------------------------------------------------------------
  // Representatives
  // ---------------------------------------------------------------------------
  const handleSearchUsers = async () => {
    const q = userQuery.trim();
    if (q.length < 2) {
      toast.error('Type at least 2 letters');
      return;
    }
    setSearching(true);
    try {
      const res = await apiClient.get('/users/search', { params: { q } });
      setUserResults(unwrapList(res?.data));
    } catch (error) {
      toast.error(getErrorMessage(error, 'Search failed'));
    } finally {
      setSearching(false);
    }
  };

  const handleAddRepresentative = (user) =>
    runAction('addRep', async () => {
      await apiClient.post(`/partner-hub/${partnerId}/representatives`, {
        user_id: user.id,
        designation: designation.trim() || 'Representative',
      });
      toast.success(`${personName(user)} added`);
      setUserResults([]);
      setUserQuery('');
      setSheet(null);
      await loadRepresentatives();
    });

  const handleRemoveRepresentative = (rep) => {
    if (!window.confirm('Remove this representative?')) return;
    runAction('removeRep', async () => {
      await apiClient.delete(`/partner-hub/${partnerId}/representatives/${rep.id}`);
      toast.success('Representative removed');
      await loadRepresentatives();
    });
  };

  // ---------------------------------------------------------------------------
  // Render states
  // ---------------------------------------------------------------------------
  if (loading) {
    return (
      <div className="min-h-screen bg-white max-w-[430px] mx-auto">
        <div className="py-24">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (!partner) {
    return (
      <div className="min-h-screen bg-white max-w-[430px] mx-auto p-6 text-center">
        <p className="text-slate-600 mt-16 mb-6">This partner could not be found.</p>
        <button onClick={() => navigate('/partners')} className="px-4 py-2 rounded-lg bg-[#0c1b78] text-white font-medium">
          Back to partners
        </button>
      </div>
    );
  }

  const name = partner.name || partner.company_name || partner.partner_name || 'Partner';
  const boothText =
    partner.booth_info ||
    [
      partner.booth_no ? `Booth No. ${partner.booth_no}` : null,
      partner.hall_no ? `Hall No. ${partner.hall_no}` : null,
    ]
      .filter(Boolean)
      .join(' | ');
  const description = partner.description || partner.about || '';
  const contactEmail = partner.contact_email || partner.email || '';
  const contactPhone = partner.contact_phone || partner.phone || '';

  return (
    <div className="min-h-screen bg-slate-50 max-w-[430px] mx-auto pb-28">
      {/* Top bar with Detail Bookmark Toggle */}
      <div className="bg-white px-4 py-4 flex items-center justify-between border-b border-slate-200">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} aria-label="Back" className="text-slate-700">
            <ArrowLeft size={22} />
          </button>
          <h1 className="text-lg font-semibold text-slate-900">Partner Details</h1>
        </div>
        <button onClick={() => setIsBookmarked(!isBookmarked)} className="text-[#1d1fb8]">
          <Bookmark size={22} className={isBookmarked ? "fill-[#1d1fb8]" : ""} />
        </button>
      </div>

      {/* Cover banner with camera */}
      <div className="relative h-36 bg-gradient-to-r from-[#4c1d95] to-[#1e3a8a] overflow-hidden">
        {coverUrl && (
          <img src={coverUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
        )}
        {canManage && (
          <button
            onClick={() => setSheet('cover')}
            disabled={busy === 'cover'}
            aria-label="Change cover image"
            className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/40 text-white flex items-center justify-center disabled:opacity-50"
          >
            <Camera size={16} />
          </button>
        )}
      </div>

      {/* Logo */}
      <div className="px-4 -mt-14 flex items-end gap-4">
        <div className="relative">
          <div className="w-28 h-28 rounded-full bg-white shadow-lg border-4 border-white flex items-center justify-center overflow-hidden">
            {logoUrl ? (
              <img src={logoUrl} alt={`${name} logo`} className="w-full h-full object-cover" />
            ) : (
              <span className="text-xl font-bold text-[#4c1d95]">{initialsOf(name)}</span>
            )}
          </div>
          {canManage && (
            <button
              onClick={() => setSheet('logo')}
              disabled={busy === 'logo'}
              aria-label="Change logo"
              className="absolute bottom-0 right-0 w-9 h-9 rounded-full bg-[#1d1fb8] text-white flex items-center justify-center shadow disabled:opacity-50"
            >
              <Camera size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Name, booth, description & Social Media Row */}
      <div className="px-4 pt-3">
        <h2 className="text-2xl font-bold text-slate-900">{name}</h2>
        {boothText && (
          <p className="text-sm text-slate-600 flex items-center gap-1 mt-1">
            <MapPin size={14} /> {boothText}
          </p>
        )}
        {description && <p className="text-sm text-slate-700 mt-3 leading-relaxed">{description}</p>}
        
        {/* Social Media Row */}
        <div className="flex items-center gap-4 mt-4">
          <a href="#" className="w-10 h-10 rounded-full bg-[#E9F3FC] flex items-center justify-center text-[#1d1fb8] hover:scale-105 transition-transform">
            <Globe size={18} />
          </a>
          <a href="#" className="w-10 h-10 rounded-full bg-[#E9F3FC] flex items-center justify-center text-[#1d1fb8] hover:scale-105 transition-transform">
            <Linkedin size={18} />
          </a>
          <a href="#" className="w-10 h-10 rounded-full bg-[#E9F3FC] flex items-center justify-center text-[#1d1fb8] hover:scale-105 transition-transform">
            <Twitter size={18} />
          </a>
        </div>
      </div>

      {/* Action chips: Documents and Videos (Ask a Question removed) */}
      <div className="px-4 pt-5 grid grid-cols-2 gap-3">
        <button onClick={() => setSheet('documents')} className="rounded-xl border border-slate-300 bg-white py-3 flex flex-col items-center gap-1 text-xs font-semibold text-slate-800">
          <FileText size={18} />
          Documents ({documents.length})
        </button>
        <button onClick={() => setSheet('videos')} className="rounded-xl border border-slate-300 bg-white py-3 flex flex-col items-center gap-1 text-xs font-semibold text-slate-800">
          <Video size={18} />
          Videos ({videos.length})
        </button>
      </div>

      {/* Interactive Notes Section */}
      <div className="px-4 pt-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-base font-semibold text-slate-900">My Notes</h3>
          {note && !isEditingNote && (
            <button onClick={() => setIsEditingNote(true)} className="text-sm font-semibold text-[#1d1fb8] flex items-center gap-1">
              <Edit3 size={15} /> Edit
            </button>
          )}
        </div>
        {isEditingNote || !note ? (
          <div className="rounded-2xl bg-white border border-slate-200 p-3">
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add private notes about this partner..."
              rows={3}
              className="w-full text-sm focus:outline-none resize-none"
            />
            <div className="flex justify-end mt-2">
              <button 
                onClick={() => setIsEditingNote(false)} 
                className="px-4 py-1.5 bg-[#1d1fb8] text-white text-sm font-semibold rounded-lg"
              >
                Save Note
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl bg-white border border-slate-200 p-4">
            <p className="text-sm text-slate-700 whitespace-pre-wrap">{note}</p>
          </div>
        )}
      </div>

      {/* Contact details */}
      {(contactEmail || contactPhone) && (
        <div className="px-4 pt-6">
          <h3 className="text-base font-semibold text-slate-900 mb-2">Contact Details</h3>
          <div className="rounded-2xl bg-white border border-slate-200 p-4 space-y-2">
            {contactEmail && (
              <p className="text-sm text-slate-700 flex items-center gap-2">
                <Mail size={15} className="text-slate-500" /> {contactEmail}
              </p>
            )}
            {contactPhone && (
              <p className="text-sm text-slate-700 flex items-center gap-2">
                <Phone size={15} className="text-slate-500" /> {contactPhone}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Representatives with Virtual Status Badge */}
      <div className="px-4 pt-6">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-base font-semibold text-slate-900">Representatives</h3>
          {isOrganizer && (
            <button onClick={() => setSheet('addRep')} className="text-sm font-semibold text-[#1d1fb8] flex items-center gap-1">
              <UserPlus size={15} /> Add
            </button>
          )}
        </div>

        {representatives.length === 0 ? (
          <p className="text-sm text-slate-500 rounded-2xl bg-white border border-slate-200 p-4">
            No representatives added yet.
          </p>
        ) : (
          <div className="space-y-3">
            {representatives.map((rep) => {
              return (
                <div key={rep.id} className="flex items-center gap-3 rounded-2xl bg-white border border-slate-200 p-4">
                  <PersonAvatar src={rep.avatar_url} name={rep.name || 'Representative'} />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 truncate">{rep.name || 'Representative'}</p>
                    <p className="text-sm text-slate-500 truncate">
                      {rep.designation}
                      {rep.company ? `, ${rep.company}` : ''}
                    </p>
                    {/* Virtual Status Badge */}
                    <div className="mt-1">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#1d1fb8] bg-[#E9F3FC] px-2 py-0.5 rounded-full border border-blue-100">
                        💻 Attending Virtually
                      </span>
                    </div>
                  </div>
                  {isOrganizer && (
                    <button
                      onClick={() => handleRemoveRepresentative(rep)}
                      aria-label="Remove representative"
                      className="w-10 h-10 rounded-full border border-red-200 text-red-600 flex items-center justify-center shrink-0"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Sheets                                                             */}
      {/* ------------------------------------------------------------------ */}

      {/* Unified sheet for Logo or Cover */}
      {(sheet === 'logo' || sheet === 'cover') && (
        <Sheet title={sheet === 'logo' ? 'Partner logo' : 'Cover image'} onClose={() => setSheet(null)}>
          <div className="space-y-3">
            <button
              onClick={() => {
                const kind = sheet;
                setSheet(null);
                setPendingKind(kind);
                cameraRef.current?.click();
              }}
              className="w-full flex items-center gap-3 rounded-xl border border-slate-200 p-4 text-left"
            >
              <Camera size={20} className="text-[#1d1fb8]" />
              <span className="font-medium text-slate-900">Take photo</span>
            </button>
            <button
              onClick={() => {
                const kind = sheet;
                setSheet(null);
                setPendingKind(kind);
                galleryRef.current?.click();
              }}
              className="w-full flex items-center gap-3 rounded-xl border border-slate-200 p-4 text-left"
            >
              <ImagePlus size={20} className="text-[#1d1fb8]" />
              <span className="font-medium text-slate-900">Choose from gallery</span>
            </button>
            <p className="text-xs text-slate-500">JPG, PNG, or WEBP, up to 5 MB.</p>
          </div>
        </Sheet>
      )}

      {/* Documents */}
      {sheet === 'documents' && (
        <Sheet title="Documents" onClose={() => setSheet(null)}>
          {canManage ? (
            <button
              onClick={() => documentRef.current?.click()}
              disabled={busy === 'document'}
              className="w-full mb-4 flex items-center justify-center gap-2 rounded-xl bg-[#1d1fb8] text-white py-3 font-semibold disabled:opacity-50"
            >
              <Upload size={18} />
              {busy === 'document' ? 'Uploading...' : 'Upload document'}
            </button>
          ) : (
            <p className="text-sm text-slate-500 mb-4">
              Only the partner's organizer or representatives can upload documents.
            </p>
          )}
          <p className="text-xs text-slate-500 mb-4">PDF, PowerPoint, Word, or Excel, up to 10 MB each.</p>

          {documents.length === 0 ? (
            <p className="text-sm text-slate-500">No documents uploaded yet.</p>
          ) : (
            <div className="space-y-3">
              {documents.map((doc) => (
                <FileRow
                  key={doc.id}
                  item={doc}
                  me={me}
                  isOrganizer={isOrganizer}
                  busy={busy}
                  onApprove={handleApprove}
                  onDelete={handleDeleteFile}
                />
              ))}
            </div>
          )}
        </Sheet>
      )}

      {/* Videos */}
      {sheet === 'videos' && (
        <Sheet title="Videos" onClose={() => setSheet(null)}>
          {canManage ? (
            <div className="space-y-4 mb-6">
              <div className="rounded-xl border border-slate-200 p-4 space-y-3">
                <p className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <LinkIcon size={16} /> Add a YouTube or Vimeo link
                </p>
                <input
                  type="text"
                  value={linkTitle}
                  onChange={(e) => setLinkTitle(e.target.value)}
                  placeholder="Video title"
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://youtu.be/..."
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleAddVideoLink}
                  disabled={busy === 'link'}
                  className="w-full rounded-lg bg-[#1d1fb8] text-white py-2.5 font-semibold disabled:opacity-50"
                >
                  {busy === 'link' ? 'Saving...' : 'Add video link'}
                </button>
              </div>

              <button
                onClick={() => videoRef.current?.click()}
                disabled={busy === 'video'}
                className="w-full flex items-center justify-center gap-2 rounded-xl border border-[#1d1fb8] text-[#1d1fb8] py-3 font-semibold disabled:opacity-50"
              >
                <Upload size={18} />
                {busy === 'video' ? 'Uploading...' : 'Upload video file'}
              </button>
              <p className="text-xs text-slate-500">MP4, MOV, or WEBM, up to 100 MB. A link is faster on slow networks.</p>
            </div>
          ) : (
            <p className="text-sm text-slate-500 mb-4">
              Only the partner's organizer or representatives can add videos.
            </p>
          )}

          {videos.length === 0 ? (
            <p className="text-sm text-slate-500">No videos added yet.</p>
          ) : (
            <div className="space-y-3">
              {videos.map((video) => (
                <FileRow
                  key={video.id}
                  item={video}
                  me={me}
                  isOrganizer={isOrganizer}
                  busy={busy}
                  onApprove={handleApprove}
                  onDelete={handleDeleteFile}
                />
              ))}
            </div>
          )}
        </Sheet>
      )}

      {/* Add representative (organizer) */}
      {sheet === 'addRep' && isOrganizer && (
        <Sheet title="Add representative" onClose={() => setSheet(null)}>
          <div className="space-y-3 mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 text-slate-400" size={18} />
              <input
                type="text"
                value={userQuery}
                onChange={(e) => setUserQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearchUsers()}
                placeholder="Search by name or email"
                className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <input
              type="text"
              value={designation}
              onChange={(e) => setDesignation(e.target.value)}
              placeholder="Designation, for example Sales Executive"
              className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleSearchUsers}
              disabled={searching}
              className="w-full rounded-lg bg-[#1d1fb8] text-white py-2.5 font-semibold disabled:opacity-50"
            >
              {searching ? 'Searching...' : 'Search'}
            </button>
          </div>

          <div className="space-y-2">
            {userResults.map((user) => (
              <div key={user.id} className="flex items-center gap-3 rounded-xl border border-slate-200 p-3">
                <PersonAvatar src={user.avatar_url} name={personName(user)} size="w-10 h-10" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{personName(user)}</p>
                  <p className="text-xs text-slate-500 truncate">
                    {user.job_title || user.email || ''}
                  </p>
                </div>
                <button
                  onClick={() => handleAddRepresentative(user)}
                  disabled={busy === 'addRep'}
                  className="text-sm font-semibold text-[#1d1fb8] disabled:opacity-50"
                >
                  Add
                </button>
              </div>
            ))}
          </div>
        </Sheet>
      )}

      {/* Hidden file inputs (always in the page) */}
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const file = pickedFile(e);
          if (file) handleImage(pendingKind, file);
        }}
      />
      <input
        ref={galleryRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = pickedFile(e);
          if (file) handleImage(pendingKind, file);
        }}
      />
      <input
        ref={documentRef}
        type="file"
        accept={DOCUMENT_ACCEPT}
        className="hidden"
        onChange={(e) => {
          const file = pickedFile(e);
          if (file) handleUploadFile('document', file);
        }}
      />
      <input
        ref={videoRef}
        type="file"
        accept={VIDEO_ACCEPT}
        className="hidden"
        onChange={(e) => {
          const file = pickedFile(e);
          if (file) handleUploadFile('video', file);
        }}
      />
    </div>
  );
}

// ----------------------------------------------------------------------------
// One document or video row
// ----------------------------------------------------------------------------
function FileRow({ item, me, isOrganizer, busy, onApprove, onDelete }) {
  const canDelete = isOrganizer || (Boolean(me) && item.uploaded_by === me.id);
  const pending = item.review_status === 'pending';

  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
          {item.kind === 'video' ? <Video size={18} /> : <FileText size={18} />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-900 truncate">{item.title}</p>
          <div className="mt-1">
            <StatusBadge status={item.review_status} />
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-800"
        >
          <ExternalLink size={14} /> {item.kind === 'video' ? 'Watch' : 'Open'}
        </a>

        {isOrganizer && pending && (
          <button
            onClick={() => onApprove(item.id)}
            disabled={busy === 'approve'}
            className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 text-white px-3 py-1.5 text-sm font-medium disabled:opacity-50"
          >
            <CheckCircle2 size={14} /> Approve
          </button>
        )}

        {canDelete && (
          <button
            onClick={() => onDelete(item.id)}
            disabled={busy === 'delete'}
            className="inline-flex items-center gap-1 rounded-lg border border-red-200 text-red-600 px-3 py-1.5 text-sm font-medium disabled:opacity-50"
          >
            <Trash2 size={14} /> Delete
          </button>
        )}
      </div>
    </div>
  );
}