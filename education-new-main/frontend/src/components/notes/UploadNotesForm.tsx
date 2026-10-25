import React, { useState, useRef } from 'react';
import { Note, NoteFormData, NoteStatus } from '../../types/notes';
import {
  validateNoteFile,
  uploadNoteFileDirect,
  createNote,
  updateNote,
  ALLOWED_EXTENSIONS
} from '../../services/notesService';

interface UploadNotesFormProps {
  teacher: { id: string; name: string };
  initialNote?: Note | null;
  onSuccess: (savedNote: Note) => void;
  onCancel: () => void;
}

export default function UploadNotesForm({
  teacher,
  initialNote,
  onSuccess,
  onCancel
}: UploadNotesFormProps): React.ReactElement {
  const isEditing = !!initialNote;

  const [formData, setFormData] = useState<NoteFormData>({
    title: initialNote?.title || '',
    subject: initialNote?.subject || 'Computer Fundamentals / Digital Logic',
    unit: initialNote?.unit || 'Unit I',
    description: initialNote?.description || '',
    class_id: initialNote?.class_id || 'CS-101',
    allow_download: initialNote ? initialNote.allow_download : true,
    status: initialNote ? initialNote.status : 'published'
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadStage, setUploadStage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = (file: File | null): void => {
    setErrorMessage('');
    if (!file) return;

    const validation = validateNoteFile(file);
    if (!validation.valid) {
      setErrorMessage(validation.error || 'Invalid file selection');
      return;
    }
    setSelectedFile(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (isSubmitting) return;
    setErrorMessage('');
    setToastMessage('');

    if (!formData.title.trim()) {
      setErrorMessage('Please provide a note title.');
      return;
    }
    if (!formData.subject.trim()) {
      setErrorMessage('Please specify a subject.');
      return;
    }
    if (!formData.unit.trim()) {
      setErrorMessage('Please specify a unit or chapter.');
      return;
    }

    if (!isEditing && !selectedFile) {
      setErrorMessage('Please choose a file to upload (PDF, DOCX, PPTX, PNG, or JPG).');
      return;
    }

    setIsSubmitting(true);
    setUploadStage('Validating file and session...');
    setUploadProgress(15);

    try {
      let fileMeta = {
        filePath: initialNote?.file_path || '',
        sizeBytes: initialNote?.size_bytes || 0,
        fileType: initialNote?.file_type || 'application/pdf'
      };

      if (selectedFile) {
        setUploadStage('Uploading document to Supabase Storage...');
        fileMeta = await uploadNoteFileDirect(selectedFile, teacher.id, (percent) => {
          setUploadProgress(percent);
        });
      }

      setUploadStage('Saving note metadata in database...');
      setUploadProgress(85);

      let resultNote: Note;
      if (isEditing && initialNote) {
        resultNote = await updateNote(initialNote.id, {
          ...formData,
          file_path: fileMeta.filePath,
          file_type: fileMeta.fileType,
          size_bytes: fileMeta.sizeBytes
        });
        setToastMessage('Note details updated successfully.');
      } else {
        resultNote = await createNote(formData, fileMeta, teacher);
        setToastMessage('Note published successfully to Supabase.');
      }

      setUploadProgress(100);
      setUploadStage('Upload Complete!');

      setTimeout(() => {
        onSuccess(resultNote);
      }, 600);
    } catch (err: unknown) {
      console.error('[UploadNotesForm] Error during upload:', err);
      const msg = err instanceof Error ? err.message : 'Upload failed. Please try again.';
      setErrorMessage(msg);
      setIsSubmitting(false);
      setUploadProgress(0);
      setUploadStage('');
    }
  };

  return (
    <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <span className="text-xs uppercase font-bold text-sky-400 tracking-wider">
            {isEditing ? 'Teacher Management' : 'Teacher Upload Portal'}
          </span>
          <h2 className="text-lg font-bold text-slate-100">
            {isEditing ? 'Edit Notes Details' : 'Upload New Notes File'}
          </h2>
        </div>
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="text-xs text-slate-400 hover:text-slate-200 px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-950 disabled:opacity-40"
        >
          Close
        </button>
      </div>

      {toastMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-800 text-xs text-emerald-200 font-medium leading-relaxed">
          {toastMessage}
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-rose-950/90 border border-rose-800 text-xs text-rose-200 font-medium leading-relaxed space-y-1">
          <div className="font-bold text-rose-300">Upload Failed</div>
          <div>{errorMessage}</div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Note Title *
          </label>
          <input
            type="text"
            required
            disabled={isSubmitting}
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="e.g. Unit 1: Digital Logic and Number Systems"
            className="w-full text-xs px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-sky-500 disabled:opacity-50"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Subject *
            </label>
            <input
              type="text"
              required
              disabled={isSubmitting}
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              placeholder="e.g. Computer Science"
              className="w-full text-xs px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-sky-500 disabled:opacity-50"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Unit / Chapter *
            </label>
            <input
              type="text"
              required
              disabled={isSubmitting}
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              placeholder="e.g. Unit I"
              className="w-full text-xs px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-sky-500 disabled:opacity-50"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Class / Section Target *
            </label>
            <input
              type="text"
              required
              disabled={isSubmitting}
              value={formData.class_id}
              onChange={(e) => setFormData({ ...formData, class_id: e.target.value })}
              placeholder="e.g. CS-101"
              className="w-full text-xs px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-sky-500 disabled:opacity-50"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Status *
            </label>
            <select
              value={formData.status}
              disabled={isSubmitting}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as NoteStatus })}
              className="w-full text-xs px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-sky-500 disabled:opacity-50"
            >
              <option value="published">Published (Visible to class)</option>
              <option value="draft">Draft (Hidden from students)</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Short Description
          </label>
          <textarea
            rows={2}
            disabled={isSubmitting}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Brief overview of topics, formulas, or assignment scope..."
            className="w-full text-xs px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-sky-500 leading-relaxed disabled:opacity-50"
          />
        </div>

        <div className="flex items-center gap-2 pt-1">
          <input
            type="checkbox"
            id="allow_download_check"
            disabled={isSubmitting}
            checked={formData.allow_download}
            onChange={(e) => setFormData({ ...formData, allow_download: e.target.checked })}
            className="rounded border-slate-800 bg-slate-950 text-sky-500 focus:ring-0 focus:ring-offset-0 w-4 h-4 cursor-pointer disabled:opacity-50"
          />
          <label htmlFor="allow_download_check" className="text-xs text-slate-300 select-none cursor-pointer">
            Allow students to download original file (offline reading)
          </label>
        </div>

        <div className="space-y-2 pt-2">
          <label className="block text-xs font-semibold text-slate-300">
            Document File (PDF, DOCX, PPTX, PNG, JPG - Max 25 MB)
          </label>

          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => !isSubmitting && fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-colors ${
              isDragging
                ? 'border-sky-500 bg-sky-950/20'
                : 'border-slate-800 bg-slate-950 hover:border-slate-700'
            } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <input
              type="file"
              ref={fileInputRef}
              disabled={isSubmitting}
              accept={ALLOWED_EXTENSIONS.join(',')}
              onChange={(e) => e.target.files && handleFileChange(e.target.files[0])}
              className="hidden"
            />
            <div className="space-y-1">
              <div className="text-xs font-semibold text-slate-200">
                {selectedFile
                  ? `Selected: ${selectedFile.name}`
                  : isEditing
                  ? 'Click or drag file here to replace current attachment'
                  : 'Click to browse or drag file here'}
              </div>
              <div className="text-[11px] text-slate-500">
                {selectedFile
                  ? `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB - Ready for upload`
                  : 'PDF required for standard preview. Direct private storage upload up to 25 MB.'}
              </div>
            </div>
          </div>
        </div>

        {isSubmitting && (
          <div className="space-y-1.5 pt-2">
            <div className="flex justify-between text-[11px] text-slate-400">
              <span className="font-medium text-sky-400">{uploadStage || 'Uploading...'}</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
              <div
                className="bg-sky-500 h-2 transition-all duration-300 rounded-full"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-4 py-2 text-xs font-medium rounded-xl border border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200 transition-colors disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2 text-xs font-semibold rounded-xl bg-sky-600 hover:bg-sky-500 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (uploadStage || 'Saving...') : isEditing ? 'Update Note' : 'Upload & Save Note'}
          </button>
        </div>
      </form>
    </div>
  );
}
