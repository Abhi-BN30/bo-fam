import { useEffect, useRef, useState } from 'react';
import { COUNTRIES, getStatesByCountry, getCitiesByCountry } from '../lib/locations';
import { authFetch } from '../lib/authFetch';
import CouplePhotoImage from './CouplePhotoImage';

// Master PIN required to confirm deleting a user from the tree.
// This is intentionally independent of any individual user's login PIN
// so that deletion access can be restricted/shared separately.
const DELETE_CONFIRMATION_PIN = '5916';

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
  mode: 'add' | 'edit' | 'view';
  initialData?: Record<string, any>;
  onEditRequested?: () => void;
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
  } catch { return dateStr; }
}


function ImagePositionPreview({
  src, label, hint, x, y, zoom, onChange,
}: {
  src: string; label: string; hint: string; x: number; y: number; zoom: number;
  onChange: (x: number, y: number, zoom: number) => void;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const lastPointer = useRef<{ x: number; y: number } | null>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [imageRatio, setImageRatio] = useState(16 / 9);

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || !lastPointer.current) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const deltaX = event.clientX - lastPointer.current.x;
    const deltaY = event.clientY - lastPointer.current.y;
    lastPointer.current = { x: event.clientX, y: event.clientY };

    // Pan is calculated against the actual rendered image bounds. Each axis
    // remains draggable until that axis reaches the image edge.
    const renderedWidth = Math.max(rect.width, rect.height * imageRatio);
    const renderedHeight = renderedWidth / imageRatio;
    const maxPanX = Math.max(0, (renderedWidth * zoom - rect.width) / 2);
    const maxPanY = Math.max(0, (renderedHeight * zoom - rect.height) / 2);
    const nextX = maxPanX > 0 ? x - (deltaX / maxPanX) * 50 : x;
    const nextY = maxPanY > 0 ? y - (deltaY / maxPanY) * 50 : y;

    onChange(
      Math.round(Math.max(0, Math.min(100, nextX))),
      Math.round(Math.max(0, Math.min(100, nextY))),
      zoom,
    );
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-bold text-slate-800">{label}</p>
        <span className="text-[10px] text-slate-500">Drag photo freely in any direction</span>
      </div>
      <div
        ref={frameRef}
        className={`relative aspect-[16/9] w-full overflow-hidden rounded-xl border-2 border-white bg-slate-900 shadow-[0_0_0_1px_rgba(148,163,184,.6)] touch-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        onPointerDown={event => {
          event.currentTarget.setPointerCapture(event.pointerId);
          lastPointer.current = { x: event.clientX, y: event.clientY };
          setIsDragging(true);
        }}
        onPointerMove={handlePointerMove}
        onPointerUp={() => { setIsDragging(false); lastPointer.current = null; }}
        onPointerCancel={() => { setIsDragging(false); lastPointer.current = null; }}
      >
        <img
          ref={imageRef}
          src={src}
          alt={`${label} crop preview`}
          draggable={false}
          onLoad={event => {
            const image = event.currentTarget;
            if (image.naturalWidth && image.naturalHeight) setImageRatio(image.naturalWidth / image.naturalHeight);
          }}
          className="pointer-events-none absolute left-1/2 top-1/2 max-w-none select-none"
          style={{
            width: imageRatio >= (16 / 9) ? `${(imageRatio / (16 / 9)) * 100}%` : '100%',
            height: imageRatio < (16 / 9) ? `${((16 / 9) / imageRatio) * 100}%` : '100%',
            objectFit: 'fill',
            transform: (() => {
              const rect = frameRef.current?.getBoundingClientRect();
              if (!rect) return `translate(-50%, -50%) scale(${zoom})`;
              const rw = Math.max(rect.width, rect.height * imageRatio);
              const rh = rw / imageRatio;
              const tx = ((50 - x) / 50) * Math.max(0, (rw * zoom - rect.width) / 2);
              const ty = ((50 - y) / 50) * Math.max(0, (rh * zoom - rect.height) / 2);
              return `translate(-50%, -50%) translate(${tx}px, ${ty}px) scale(${zoom})`;
            })(),
            transformOrigin: 'center center',
          }}
        />
        <div className="pointer-events-none absolute inset-0 border border-white/90" />
        <span className="pointer-events-none absolute left-2 top-2 h-5 w-5 border-l-2 border-t-2 border-white drop-shadow" />
        <span className="pointer-events-none absolute right-2 top-2 h-5 w-5 border-r-2 border-t-2 border-white drop-shadow" />
        <span className="pointer-events-none absolute bottom-2 left-2 h-5 w-5 border-b-2 border-l-2 border-white drop-shadow" />
        <span className="pointer-events-none absolute bottom-2 right-2 h-5 w-5 border-b-2 border-r-2 border-white drop-shadow" />
        <span className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/55 px-3 py-1 text-[10px] font-semibold text-white">Preview frame</span>
      </div>
      <p className="text-[11px] leading-4 text-slate-500">{hint}</p>
      <div className="flex items-center gap-3 rounded-xl bg-white px-3 py-2">
        <span className="text-slate-500 text-lg leading-none">−</span>
        <input aria-label={`${label} zoom`} type="range" min="1" max="3" step="0.05" value={zoom} onChange={e => onChange(x, y, Number(e.target.value))} className="w-full accent-indigo-600" />
        <span className="text-slate-500 text-lg leading-none">+</span>
        <span className="min-w-12 text-right text-[11px] font-semibold text-slate-600">{Math.round(zoom * 100)}%</span>
      </div>
    </div>
  );
}

export default function UserModal({ isOpen, onClose, onRefresh, mode, initialData, onEditRequested }: UserModalProps) {
  const [form, setForm] = useState<Record<string, any>>(initialData || {});
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [states, setStates] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [showCustomCityInput, setShowCustomCityInput] = useState(false);
  const [customCityValue, setCustomCityValue] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePin, setDeletePin] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoError, setPhotoError] = useState('');
  const [showPhotoViewer, setShowPhotoViewer] = useState(false);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
  // One shared crop is used by both the family-tree card and profile header.
  const [photoPosition, setPhotoPosition] = useState({ x: 50, y: 50 });
  const [photoZoom, setPhotoZoom] = useState(1);

  // Replace normalizeDob everywhere it appears:
  const normalizeToInputDate = (raw: string | undefined | null): string => {
    if (!raw) return '';
    const m = String(raw).match(/^(\d{4})-(\d{2})-(\d{2})/);
    return m ? `${m[1]}-${m[2]}-${m[3]}` : '';
  };

  const normalizeDate = (value: string | undefined) => {
    if (!value) return '';
    return value.includes('T') ? value.split('T')[0] : value;
  };

  useEffect(() => {
    const data = initialData || {};
    setForm({
      ...data,
      dob: normalizeToInputDate(data.dob),
      anniversary: normalizeToInputDate(data.anniversary),
    });
    setError('');
    setShowDeleteConfirm(false);
    setDeletePin('');
    setDeleteError('');
    setIsDeleting(false);
    setPhotoUrl(data.has_photo ? `/api/couple-photo/${data.id}?v=${Date.now()}` : null);
    setPhotoFile(null);
    setPhotoPreviewUrl(null);
    setPhotoPosition({ x: Number(data.card_position_x ?? 50), y: Number(data.card_position_y ?? 50) });
    setPhotoZoom(Number(data.card_zoom ?? 1));
    setPhotoError('');
    setShowPhotoViewer(false);
    if (data.country) {
      const fetchedStates = getStatesByCountry(data.country);
      const fetchedCities = getCitiesByCountry(data.country);
      setStates(fetchedStates);
      setCities(fetchedCities);
      const isCustom = data.city && !fetchedCities.includes(data.city);
      setShowCustomCityInput(!!isCustom);
      setCustomCityValue(isCustom ? data.city : '');
    } else {
      setStates([]); setCities([]); setShowCustomCityInput(false); setCustomCityValue('');
    }
  }, [initialData]);

  useEffect(() => {
    if (!photoFile) { setPhotoPreviewUrl(null); return; }
    const url = URL.createObjectURL(photoFile);
    setPhotoPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [photoFile]);

  const handleCountryChange = (country: string) => {
    setForm({ ...form, country, state: '', city: '' });
    setStates(getStatesByCountry(country));
    setCities(getCitiesByCountry(country));
    setShowCustomCityInput(false); setCustomCityValue('');
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (mode === 'view') return;
    setError(''); setIsSaving(true);
    try {
      if (!form.primary_email) { setError('Primary email is mandatory.'); setIsSaving(false); return; }
      const finalForm = { ...form };
      if (showCustomCityInput) {
        if (!customCityValue.trim()) { setError('Custom city cannot be empty.'); setIsSaving(false); return; }
        finalForm.city = customCityValue.trim();
      }
      const method = mode === 'edit' ? 'PUT' : 'POST';
      const res = await authFetch('/api/users', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...finalForm,
          pin: finalForm.pin ? parseInt(finalForm.pin, 10) : undefined,
          deceased_primary: !!finalForm.deceased_primary,
          deceased_spouse: !!finalForm.deceased_spouse,
          anniversary: finalForm.anniversary || null,
        }),
      });
      if (!res.ok) { const data = await res.json(); setError(data?.error || data?.message || 'Unable to save changes'); return; }
      onRefresh(); onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save changes.');
    } finally { setIsSaving(false); }
  };

  const handlePhotoUpload = async () => {
    if (!form?.id || (!photoFile && !photoUrl)) return;
    setPhotoBusy(true);
    setPhotoError('');
    try {
      const body = new FormData();
      if (photoFile) body.append('photo', photoFile);
      // Keep the legacy DB fields in sync, but expose only one shared crop control.
      body.append('card_position_x', String(photoPosition.x));
      body.append('card_position_y', String(photoPosition.y));
      body.append('profile_position_x', String(photoPosition.x));
      body.append('profile_position_y', String(photoPosition.y));
      body.append('card_zoom', String(photoZoom));
      body.append('profile_zoom', String(photoZoom));
      const res = await authFetch(`/api/couple-photo/${form.id}`, { method: 'POST', body });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Unable to upload photo.');
      setPhotoUrl(`${result.photoUrl}&refresh=${Date.now()}`);
      setPhotoFile(null);
      setForm((current: Record<string, any>) => ({
        ...current, has_photo: true,
        card_position_x: photoPosition.x, card_position_y: photoPosition.y,
        profile_position_x: photoPosition.x, profile_position_y: photoPosition.y,
        card_zoom: photoZoom, profile_zoom: photoZoom,
      }));
      onRefresh();
    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : 'Unable to upload photo.');
    } finally {
      setPhotoBusy(false);
    }
  };

  const handlePhotoRemove = async () => {
    if (!form?.id) return;
    setPhotoBusy(true);
    setPhotoError('');
    try {
      const res = await authFetch(`/api/couple-photo/${form.id}`, { method: 'DELETE' });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Unable to remove photo.');
      setPhotoUrl(null);
      setPhotoFile(null);
      setForm((current: Record<string, any>) => ({ ...current, has_photo: false }));
      onRefresh();
    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : 'Unable to remove photo.');
    } finally {
      setPhotoBusy(false);
    }
  };

  const handleDeleteClick = () => {
    if (!form?.id) return;
    setDeleteError('');
    setDeletePin('');
    setShowDeleteConfirm(true);
  };

  const performDelete = async () => {
    if (!form?.id) return;
    try {
      const res = await authFetch('/api/users', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: form.id }) });
      if (!res.ok) { const data = await res.json(); setDeleteError(data?.error || 'Unable to delete user.'); return; }
      onRefresh(); onClose();
    } catch { setDeleteError('Unable to delete user.'); }
  };

  const handleConfirmDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeleteError('');

    if (deletePin.length !== 4) {
      setDeleteError('PIN must be exactly 4 digits.');
      return;
    }

    if (deletePin !== DELETE_CONFIRMATION_PIN) {
      setDeleteError('Incorrect PIN. Please try again.');
      return;
    }

    setIsDeleting(true);
    try {
      await performDelete();
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen) return null;

  const isView = mode === 'view';
  const hasSpouse = !!form.spouse_name?.trim();

  const inputStyle = `w-full border border-slate-200 p-3 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none ${isView ? 'bg-slate-100 cursor-not-allowed text-slate-600' : 'bg-slate-50/50'}`;
  const spouseInputStyle = `w-full border border-slate-200 p-2.5 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none ${isView ? 'bg-slate-100 cursor-not-allowed text-slate-600' : 'bg-white'}`;
  const labelStyle = "text-xs font-bold text-slate-500 ml-1";

  return (
    <>
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="relative bg-white p-6 sm:p-8 rounded-3xl w-full sm:max-w-md shadow-2xl max-h-[90vh] overflow-auto border border-slate-100 animate-in fade-in zoom-in duration-200">
        <button type="button" onClick={onClose} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 transition-colors z-10">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        {isView && photoUrl ? (
          <div className="relative -mx-6 -mt-6 sm:-mx-8 sm:-mt-8 mb-6 h-64 sm:h-72 overflow-hidden bg-slate-100">
            <button type="button" onClick={() => setShowPhotoViewer(true)} aria-label="Enlarge couple photo" className="absolute inset-0 h-full w-full text-left">
              <CouplePhotoImage src={photoUrl} alt={`${form.primary_name}${form.spouse_name ? ` and ${form.spouse_name}` : ''}`} className="h-full w-full" x={photoPosition.x} y={photoPosition.y} zoom={photoZoom} />
              <span className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-white" />
            </button>
            <div className="absolute bottom-0 left-0 right-0 px-6 sm:px-8 pb-2 text-center pointer-events-none">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Profile View</h2>
              <p className="text-sm text-slate-500 mt-1">Reviewing family member information.</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center mb-6 text-center">
            <div className="h-12 w-12 bg-indigo-50 rounded-2xl flex items-center justify-center mb-3 text-indigo-600">
              {isView
                ? <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                : <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
              }
            </div>
            <h2 className="text-2xl font-bold text-slate-900">{mode === 'edit' ? 'Edit Details' : mode === 'add' ? 'Add User' : 'Profile View'}</h2>
            <p className="text-sm text-slate-500 mt-1">{isView ? 'Reviewing family member information.' : 'Update information to keep the tree accurate.'}</p>
          </div>
        )}

        {!isView && mode === 'edit' && form?.id && (
          <section className="mb-5 rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-indigo-700">Couple photo & framing</p>
                <p className="text-xs text-slate-500 mt-1">JPG, PNG or WebP · up to 5 MB</p>
              </div>
              {photoUrl && <button type="button" onClick={handlePhotoRemove} disabled={photoBusy} className="text-xs font-bold text-rose-600 hover:text-rose-700 disabled:opacity-50">Remove photo</button>}
            </div>
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={e => { setPhotoFile(e.target.files?.[0] || null); setPhotoError(''); }} className="block w-full text-xs text-slate-600 file:mr-2 file:rounded-lg file:border-0 file:bg-white file:px-3 file:py-2 file:text-xs file:font-semibold file:text-indigo-700" />
            {(photoPreviewUrl || photoUrl) ? (
              <>
                <p className="text-xs text-slate-600">Drag the photo and use − / + to adjust the frame. This single setting is shared by the couple card and profile header. The full original is always shown when opened.</p>
                <ImagePositionPreview
                  src={photoPreviewUrl || photoUrl!}
                  label="Shared photo preview"
                  hint="Adjust once here. The same framing is used in both places."
                  x={photoPosition.x}
                  y={photoPosition.y}
                  zoom={photoZoom}
                  onChange={(x, y, zoom) => { setPhotoPosition({ x, y }); setPhotoZoom(zoom); }}
                />
              </>
            ) : (
              <p className="rounded-xl border border-dashed border-indigo-200 bg-white p-4 text-center text-xs text-slate-500">Choose a photo to adjust its card and profile framing.</p>
            )}
            <button type="button" onClick={handlePhotoUpload} disabled={(!photoFile && !photoUrl) || photoBusy} className="w-full rounded-lg bg-indigo-600 px-3 py-2.5 text-xs font-bold text-white disabled:opacity-40">{photoBusy ? 'Saving…' : photoFile ? 'Upload photo & save framing' : 'Save framing'}</button>
            {photoError && <p className="text-xs font-medium text-rose-600">{photoError}</p>}
          </section>
        )}

        {error && <p className="text-rose-600 text-sm mb-6 p-3 bg-rose-50 rounded-xl border border-rose-100 font-medium">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4">

            {/* Name */}
            <div className="space-y-1">
              <label className={labelStyle}>Full Name *</label>
              <input className={inputStyle} readOnly={isView} placeholder="e.g. Satynarana Boorlagadda" value={form.primary_name || ''} onChange={e => setForm({ ...form, primary_name: e.target.value })} required />
            </div>

            {/* Contact / DOB / Gender */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className={labelStyle}>Contact *</label>
                <input className={inputStyle} readOnly={isView} placeholder="Contact" value={form.contact || ''} onChange={e => setForm({ ...form, contact: e.target.value })} required />
              </div>
              <div className="space-y-1">
                <label className={labelStyle}>Date of Birth *</label>
                <input className={inputStyle} readOnly={isView} type="date" value={form.dob || ''} onChange={e => setForm({ ...form, dob: e.target.value })} required />
              </div>
              <div className="space-y-1">
                <label className={labelStyle}>Gender *</label>
                <select className={inputStyle} disabled={isView} value={form.gender || ''} onChange={e => setForm({ ...form, gender: e.target.value })} required>
                  <option value="">Select</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Others">Others</option>
                </select>
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1">
              <label className={labelStyle}>Primary Email *</label>
              <input className={inputStyle} readOnly={isView} placeholder="email@example.com" type="email" value={form.primary_email || ''} onChange={e => setForm({ ...form, primary_email: e.target.value })} required />
            </div>

            {/* ── Spouse section ── */}
            <div className="p-4 bg-slate-50 rounded-2xl space-y-3 border border-slate-100">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Spouse Details</p>

              <input className={spouseInputStyle} readOnly={isView} placeholder="Spouse Name" value={form.spouse_name || ''} onChange={e => setForm({ ...form, spouse_name: e.target.value })} />
              <input className={spouseInputStyle} readOnly={isView} placeholder="Spouse Contact" value={form.spouse_contact || ''} onChange={e => setForm({ ...form, spouse_contact: e.target.value })} />
              <input className={spouseInputStyle} readOnly={isView} placeholder="Spouse Email" type="email" value={form.spouse_email || ''} onChange={e => setForm({ ...form, spouse_email: e.target.value })} />

              {/* Anniversary — visible whenever there is a spouse */}
              {hasSpouse && (
                <div className="space-y-1 pt-1">
                  <label className="text-xs font-bold text-slate-500 ml-1 flex items-center gap-1.5">
                    <span>💍</span> Anniversary Date
                    <span className="text-[10px] font-normal text-slate-400">(optional)</span>
                  </label>
                  {isView ? (
                    /* View mode: formatted, human-readable */
                    <div className={`${spouseInputStyle} flex items-center gap-2`}>
                      {form.anniversary
                        ? <><span className="text-rose-400">💍</span><span>{formatDate(form.anniversary)}</span></>
                        : <span className="text-slate-400 italic text-xs">Not recorded</span>
                      }
                    </div>
                  ) : (
                    /* Edit mode: date picker */
                    <input
                      type="date"
                      className={spouseInputStyle}
                      value={form.anniversary || ''}
                      onChange={e => setForm({ ...form, anniversary: e.target.value })}
                    />
                  )}
                </div>
              )}

              {/* Deceased */}
              <div className="pt-2 border-t border-slate-200 space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-rose-400">Deceased</p>
                {isView ? (
                  <div className="space-y-1.5">
                    {form.deceased_primary ? (
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span>✝</span><span><span className="font-semibold">{form.primary_name}</span> is deceased</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <span>—</span>
                      </div>
                    )}
                    {hasSpouse && (
                      form.deceased_spouse ? (
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <span>✝</span><span><span className="font-semibold">{form.spouse_name}</span> is deceased</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                          <span>—</span>
                        </div>
                      )
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="flex items-center gap-2.5 cursor-pointer group">
                      <input type="checkbox" checked={!!form.deceased_primary} onChange={e => setForm({ ...form, deceased_primary: e.target.checked })} className="w-4 h-4 rounded border-slate-300 text-rose-500 focus:ring-rose-400 cursor-pointer" />
                      <span className="text-xs text-slate-600 group-hover:text-slate-900 transition">
                        {form.primary_name?.trim() ? <><span className="font-semibold text-slate-800">{form.primary_name}</span> is deceased</> : 'Primary member is deceased'}
                      </span>
                    </label>
                    {hasSpouse && (
                      <label className="flex items-center gap-2.5 cursor-pointer group">
                        <input type="checkbox" checked={!!form.deceased_spouse} onChange={e => setForm({ ...form, deceased_spouse: e.target.checked })} className="w-4 h-4 rounded border-slate-300 text-rose-500 focus:ring-rose-400 cursor-pointer" />
                        <span className="text-xs text-slate-600 group-hover:text-slate-900 transition">
                          <span className="font-semibold text-slate-800">{form.spouse_name}</span> is deceased
                        </span>
                      </label>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="space-y-3 pt-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Living In</p>
            <select disabled={isView} className={inputStyle} value={form.country || ''} onChange={e => handleCountryChange(e.target.value)}>
              <option value="">Select Country</option>
              {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            {form.country && states.length > 0 && (
              <select disabled={isView} className={inputStyle} value={form.state || ''} onChange={e => setForm({ ...form, state: e.target.value })}>
                <option value="">Select State/Province</option>
                {states.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            )}
            {form.country && (
              <select disabled={isView} className={inputStyle} value={showCustomCityInput ? 'other' : (form.city || '')} onChange={e => {
                if (e.target.value === 'other') { setShowCustomCityInput(true); setForm({ ...form, city: '' }); }
                else { setShowCustomCityInput(false); setCustomCityValue(''); setForm({ ...form, city: e.target.value }); }
              }}>
                <option value="">Select City</option>
                {cities.map(c => <option key={c} value={c}>{c}</option>)}
                {!isView && <option value="other">Other / Not Listed</option>}
              </select>
            )}
            {showCustomCityInput && (
              <input className={`${inputStyle} border-indigo-200 bg-indigo-50/30 animate-in slide-in-from-top-1`} placeholder="Specify City/Town/Village" value={customCityValue} onChange={e => setCustomCityValue(e.target.value)} required readOnly={isView} />
            )}
            <div className="space-y-1">
              <label className={labelStyle}>Full Address</label>
              <input className={inputStyle} readOnly={isView} placeholder="House No, Street, Landmark" value={form.address || ''} onChange={e => setForm({ ...form, address: e.target.value })} />
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 mt-8">
            {isView ? (
              <>
                <button type="button" onClick={e => { e.preventDefault(); e.stopPropagation(); onEditRequested?.(); }} className="flex-1 bg-indigo-600 text-white px-4 py-3 rounded-2xl text-sm font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95">Edit Profile</button>
                <button type="button" onClick={handleDeleteClick} className="bg-rose-50 text-rose-600 px-4 py-3 rounded-2xl text-sm font-bold hover:bg-rose-100 transition-all active:scale-95">Delete</button>
              </>
            ) : (
              <>
                <button type="submit" disabled={isSaving} className="flex-1 bg-indigo-600 text-white px-4 py-3 rounded-2xl text-sm font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50">
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
                <button type="button" onClick={handleDeleteClick} className="bg-rose-50 text-rose-600 px-4 py-3 rounded-2xl text-sm font-bold hover:bg-rose-100 transition-all active:scale-95">Delete</button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>

    {showDeleteConfirm && (
      <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center z-[110] p-4">
        <div className="relative bg-white p-6 sm:p-8 rounded-3xl w-full sm:max-w-sm shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-200">
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(false)}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 transition-colors z-10"
            title="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>

          <div className="flex flex-col items-center mb-4 text-center">
            <div className="h-12 w-12 bg-rose-50 rounded-2xl flex items-center justify-center mb-3 text-rose-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zM12 15.75h.008v.008H12v-.008z" /></svg>
            </div>
            <h2 className="text-xl font-bold text-slate-900">Delete {form.primary_name || 'this member'}?</h2>
            <p className="text-sm text-slate-500 mt-2">
              This will permanently remove {form.primary_name || 'this person'}
              {hasSpouse ? <> and <span className="font-semibold text-slate-700">{form.spouse_name}</span></> : ''}, along with everyone listed under them in the tree. This cannot be undone. Only Admin can perform this action.
            </p>
          </div>

          {deleteError && (
            <p className="text-rose-600 text-sm mb-4 p-3 bg-rose-50 rounded-xl border border-rose-100 font-medium text-center">{deleteError}</p>
          )}

          <form onSubmit={handleConfirmDelete} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 ml-1">Enter deletion PIN to confirm *</label>
              <input
                inputMode="numeric"
                maxLength={4}
                autoFocus
                className="w-full border border-slate-200 p-3 rounded-2xl text-base text-center tracking-[0.6em] focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all outline-none bg-slate-50/50"
                placeholder="••••"
                value={deletePin}
                onChange={(e) => setDeletePin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                required
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 bg-slate-100 text-slate-700 px-4 py-3 rounded-2xl text-sm font-bold hover:bg-slate-200 transition-all active:scale-95"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isDeleting}
                className="flex-1 bg-rose-600 text-white px-4 py-3 rounded-2xl text-sm font-bold shadow-lg shadow-rose-200 hover:bg-rose-700 transition-all active:scale-95 disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </form>
        </div>
      </div>
    )}

    {showPhotoViewer && photoUrl && (
      <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/90 p-4" onClick={() => setShowPhotoViewer(false)} role="dialog" aria-modal="true" aria-label="Couple photo viewer">
        <button type="button" onClick={() => setShowPhotoViewer(false)} className="absolute right-5 top-5 z-10 rounded-full bg-white/15 p-3 text-white hover:bg-white/25" aria-label="Close photo viewer">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
        <img src={photoUrl} alt={`${form.primary_name}${form.spouse_name ? ` and ${form.spouse_name}` : ''}`} onClick={e => e.stopPropagation()} className="max-h-[90vh] max-w-[95vw] rounded-lg object-contain shadow-2xl" />
      </div>
    )}
    </>
  );
}