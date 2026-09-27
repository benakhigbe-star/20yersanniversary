'use client';

import { useState } from 'react';
import type { Guest } from '@/types/db';

export interface GuestFormValues {
  first_name: string;
  last_name: string;
  preferred_name: string;
  email: string;
  phone: string;
  gender: string;
  group_name: string;
  cabin_number: string;
  booking_reference: string;
  status: Guest['status'];
  notes: string;
  is_active: boolean;
}

const emptyValues: GuestFormValues = {
  first_name: '',
  last_name: '',
  preferred_name: '',
  email: '',
  phone: '',
  gender: '',
  group_name: '',
  cabin_number: '',
  booking_reference: '',
  status: 'invited',
  notes: '',
  is_active: true,
};

export function GuestFormModal({
  guest,
  onClose,
  onSave,
}: {
  guest: Guest | null;
  onClose: () => void;
  onSave: (values: GuestFormValues) => Promise<string | null>;
}) {
  const [values, setValues] = useState<GuestFormValues>(
    guest
      ? {
          first_name: guest.first_name,
          last_name: guest.last_name,
          preferred_name: guest.preferred_name ?? '',
          email: guest.email,
          phone: guest.phone ?? '',
          gender: guest.gender ?? '',
          group_name: guest.group_name ?? '',
          cabin_number: guest.cabin_number ?? '',
          booking_reference: guest.booking_reference ?? '',
          status: guest.status,
          notes: guest.notes ?? '',
          is_active: guest.is_active,
        }
      : emptyValues
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function set<K extends keyof GuestFormValues>(key: K, value: GuestFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const err = await onSave(values);
    setSaving(false);
    if (err) setError(err);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-6">
      <form
        onSubmit={handleSubmit}
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-slate-900 p-6 sm:rounded-2xl"
      >
        <h2 className="text-lg font-bold text-white">{guest ? 'Edit Guest' : 'Add Guest'}</h2>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <Field label="First Name" value={values.first_name} onChange={(v) => set('first_name', v)} required />
          <Field label="Last Name" value={values.last_name} onChange={(v) => set('last_name', v)} required />
          <Field label="Preferred Name" value={values.preferred_name} onChange={(v) => set('preferred_name', v)} />
          <Field label="Email" type="email" value={values.email} onChange={(v) => set('email', v)} required />
          <Field label="Phone" value={values.phone} onChange={(v) => set('phone', v)} />
          <Field label="Gender" value={values.gender} onChange={(v) => set('gender', v)} />
          <Field label="Group / Family" value={values.group_name} onChange={(v) => set('group_name', v)} />
          <Field label="Cabin Number" value={values.cabin_number} onChange={(v) => set('cabin_number', v)} />
          <Field label="Booking Reference" value={values.booking_reference} onChange={(v) => set('booking_reference', v)} />
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-400">Status</label>
            <select
              value={values.status}
              onChange={(e) => set('status', e.target.value as Guest['status'])}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white"
            >
              <option value="invited">Invited</option>
              <option value="confirmed">Confirmed</option>
              <option value="declined">Declined</option>
            </select>
          </div>
          <div className="flex items-center gap-2 pt-6">
            <input
              id="is_active"
              type="checkbox"
              checked={values.is_active}
              onChange={(e) => set('is_active', e.target.checked)}
              className="h-4 w-4 accent-ocean-500"
            />
            <label htmlFor="is_active" className="text-sm text-slate-300">
              Active (can log in)
            </label>
          </div>
        </div>

        <div className="mt-3">
          <label className="mb-1 block text-xs font-medium text-slate-400">Notes</label>
          <textarea
            value={values.notes}
            onChange={(e) => set('notes', e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white"
            rows={2}
          />
        </div>

        {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg border border-slate-700 py-2.5 text-sm font-medium text-slate-300"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 rounded-lg bg-ocean-500 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Save Guest'}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-slate-400">{label}</label>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white outline-none focus:border-ocean-400"
      />
    </div>
  );
}
