import { useEffect, useRef, useState } from 'react';
import { Camera, Loader2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const MAX_AVATAR_BYTES = 800 * 1024;
const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/gif'];

type Feedback = { type: 'error' | 'success'; text: string } | null;

function initialsOf(firstName: string, lastName: string) {
  const letters = `${firstName.trim().charAt(0)}${lastName.trim().charAt(0)}`.toUpperCase();
  return letters || 'PM';
}

/**
 * Editable account profile, shared by the tenant, landlord, and admin settings pages.
 * Ownership of the values lives in the database; this panel reads them from the session
 * and writes back through PATCH /api/users/me and POST /api/users/me/avatar.
 */
export function ProfileSettings() {
  const { user, fetchWithAuth, updateUser } = useAuth();
  const [firstName, setFirstName] = useState(user?.firstName ?? '');
  const [lastName, setLastName] = useState(user?.lastName ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Re-seed the inputs when the session identity changes (sign-in, reload, account switch).
  // Deliberately keyed on the id so in-flight typing is never overwritten.
  useEffect(() => {
    setFirstName(user?.firstName ?? '');
    setLastName(user?.lastName ?? '');
    setPhone(user?.phone ?? '');
  }, [user?.id]);

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    // Reset the input so picking the same file twice still fires a change event.
    event.target.value = '';
    if (!file) return;

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setFeedback({ type: 'error', text: 'Choose a JPG, PNG, or GIF image.' });
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      setFeedback({ type: 'error', text: `That image is ${Math.round(file.size / 1024)}KB. The limit is 800KB.` });
      return;
    }

    setIsUploading(true);
    setFeedback(null);

    try {
      const response = await fetchWithAuth('/api/users/me/avatar', {
        method: 'POST',
        headers: { 'Content-Type': file.type },
        body: file,
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        setFeedback({ type: 'error', text: data?.error || 'Unable to upload that image.' });
        return;
      }

      updateUser(data.user);
      setFeedback({ type: 'success', text: 'Avatar updated.' });
    } catch {
      setFeedback({ type: 'error', text: 'Network error while uploading the image.' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setFeedback(null);

    try {
      const response = await fetchWithAuth('/api/users/me', {
        method: 'PATCH',
        body: JSON.stringify({ firstName, lastName, phone }),
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        setFeedback({ type: 'error', text: data?.error || 'Unable to save your details.' });
        return;
      }

      updateUser(data.user);
      setFeedback({ type: 'success', text: 'Your details have been saved.' });
    } catch {
      setFeedback({ type: 'error', text: 'Network error while saving your details.' });
    } finally {
      setIsSaving(false);
    }
  };

  const fieldClassName =
    'w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm dark:bg-slate-900 dark:text-slate-100';
  const labelClassName = 'block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5';

  return (
    <form className="space-y-6 animate-in fade-in duration-200" onSubmit={handleSubmit}>
      <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-4">
        Personal Information
      </h3>

      <div className="flex items-center gap-6 mb-6">
        <div className="relative w-20 h-20 shrink-0">
          {user?.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={`${user.firstName} ${user.lastName}`}
              className="w-20 h-20 rounded-full object-cover ring-1 ring-slate-200 dark:ring-slate-700"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-2xl">
              {initialsOf(firstName, lastName)}
            </div>
          )}

          {isUploading && (
            <span className="absolute inset-0 flex items-center justify-center rounded-full bg-white/75 dark:bg-slate-950/75">
              <Loader2 className="w-5 h-5 animate-spin text-indigo-600 dark:text-indigo-400" />
            </span>
          )}
        </div>

        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/gif"
            className="hidden"
            onChange={handleAvatarChange}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Camera className="w-4 h-4" />
            {isUploading ? 'Uploading…' : 'Change Avatar'}
          </button>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">JPG, GIF or PNG. Max size of 800K</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="profile-first-name" className={labelClassName}>
            First Name
          </label>
          <input
            id="profile-first-name"
            type="text"
            autoComplete="given-name"
            required
            maxLength={60}
            value={firstName}
            onChange={(event) => setFirstName(event.target.value)}
            className={fieldClassName}
          />
        </div>
        <div>
          <label htmlFor="profile-last-name" className={labelClassName}>
            Last Name
          </label>
          <input
            id="profile-last-name"
            type="text"
            autoComplete="family-name"
            required
            maxLength={60}
            value={lastName}
            onChange={(event) => setLastName(event.target.value)}
            className={fieldClassName}
          />
        </div>
        <div>
          <label htmlFor="profile-email" className={labelClassName}>
            Email Address
          </label>
          <input
            id="profile-email"
            type="email"
            value={user?.email ?? ''}
            readOnly
            className={`${fieldClassName} bg-slate-50 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 cursor-not-allowed`}
          />
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
            Your sign-in email cannot be changed here.
          </p>
        </div>
        <div>
          <label htmlFor="profile-phone" className={labelClassName}>
            Phone Number
          </label>
          <input
            id="profile-phone"
            type="tel"
            autoComplete="tel"
            maxLength={32}
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="+234 800 000 0000"
            className={fieldClassName}
          />
        </div>
      </div>

      {feedback && (
        <div
          role={feedback.type === 'error' ? 'alert' : 'status'}
          aria-live="polite"
          className={[
            'rounded-xl px-4 py-3 text-sm',
            feedback.type === 'error'
              ? 'bg-[rgba(180,64,54,0.08)] text-[#8C332B]'
              : 'bg-[rgba(57,116,81,0.1)] text-[#2C5B40]',
          ].join(' ')}
        >
          {feedback.text}
        </div>
      )}

      <div className="pt-4 flex justify-end">
        <button
          type="submit"
          disabled={isSaving}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {isSaving ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
}
