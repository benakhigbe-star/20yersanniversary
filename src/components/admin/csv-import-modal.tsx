'use client';

import { useState } from 'react';

interface PreviewResult {
  preview: true;
  validCount: number;
  invalidCount: number;
  duplicateInFileCount: number;
  duplicateInDbCount: number;
  invalid: { row: number; errors: string[] }[];
}

export function CsvImportModal({ onClose, onImported }: { onClose: () => void; onImported: () => void }) {
  const [csvText, setCsvText] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [status, setStatus] = useState<'idle' | 'validating' | 'importing' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    const text = await file.text();
    setCsvText(text);
    setFileName(file.name);
    setPreview(null);
    setStatus('validating');
    try {
      const res = await fetch('/api/admin/guests/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csv: text, commit: false }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPreview(data);
      setStatus('idle');
    } catch (e) {
      setStatus('error');
      setError(e instanceof Error ? e.message : 'Could not validate file.');
    }
  }

  async function handleImport() {
    if (!csvText) return;
    setStatus('importing');
    try {
      const res = await fetch('/api/admin/guests/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csv: csvText, commit: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onImported();
    } catch (e) {
      setStatus('error');
      setError(e instanceof Error ? e.message : 'Import failed.');
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-slate-900 p-6">
        <h2 className="text-lg font-bold text-white">Import Guests from CSV</h2>
        <p className="mt-1 text-sm text-slate-400">
          Columns: first_name, last_name, email (required), preferred_name, phone, gender, group_name, cabin_number,
          booking_reference.
        </p>

        <input
          type="file"
          accept=".csv,text/csv"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          className="mt-4 block w-full text-sm text-slate-300 file:mr-3 file:rounded-lg file:border-0 file:bg-ocean-500 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white"
        />
        {fileName && <p className="mt-1 text-xs text-slate-500">{fileName}</p>}

        {status === 'validating' && <p className="mt-3 text-sm text-slate-400">Validating…</p>}
        {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

        {preview && (
          <div className="mt-4 space-y-2 rounded-lg border border-slate-800 bg-slate-950 p-3 text-sm">
            <p className="text-green-400">✓ {preview.validCount} ready to import</p>
            {preview.duplicateInDbCount > 0 && (
              <p className="text-amber-400">⚠ {preview.duplicateInDbCount} already on the guest list (skipped)</p>
            )}
            {preview.duplicateInFileCount > 0 && (
              <p className="text-amber-400">⚠ {preview.duplicateInFileCount} duplicated within the file (skipped)</p>
            )}
            {preview.invalidCount > 0 && (
              <div className="text-red-400">
                <p>✗ {preview.invalidCount} invalid row(s):</p>
                <ul className="ml-4 list-disc text-xs text-red-300">
                  {preview.invalid.slice(0, 6).map((r) => (
                    <li key={r.row}>
                      Row {r.row}: {r.errors.join(', ')}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <div className="mt-5 flex gap-2">
          <button onClick={onClose} className="flex-1 rounded-lg border border-slate-700 py-2.5 text-sm text-slate-300">
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={!preview || preview.validCount === 0 || status === 'importing'}
            className="flex-1 rounded-lg bg-ocean-500 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {status === 'importing' ? 'Importing…' : `Import ${preview?.validCount ?? 0} Guests`}
          </button>
        </div>
      </div>
    </div>
  );
}
