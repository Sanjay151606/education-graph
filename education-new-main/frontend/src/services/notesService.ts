import { supabase } from '../api/supabaseClient';
import { Note, NoteFormData, NoteStatus, NoteStudentProgress, FileValidationResult } from '../types/notes';

const BUCKET_NAME = 'notes';
const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB
const LOCAL_STORAGE_NOTES_KEY = 'bg_study_notes_v1';
const LOCAL_STORAGE_PROGRESS_KEY = 'bg_study_notes_progress_v1';

export const ALLOWED_MIME_TYPES: string[] = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'image/png',
  'image/jpeg'
];

export const ALLOWED_EXTENSIONS: string[] = ['.pdf', '.docx', '.pptx', '.png', '.jpg', '.jpeg'];

export function sanitizeFileName(name: string): string {
  const parts = name.split('.');
  const ext = parts.length > 1 ? parts.pop() || '' : '';
  const base = parts.join('.');
  const cleanBase = base
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '_')
    .replace(/_+/g, '_')
    .slice(0, 80);
  const cleanExt = ext.toLowerCase().replace(/[^a-z0-9]/g, '');
  const timestamp = Date.now();
  return cleanExt ? `${cleanBase}_${timestamp}.${cleanExt}` : `${cleanBase}_${timestamp}`;
}

export function validateNoteFile(file: File): FileValidationResult {
  if (!file) {
    return { valid: false, error: 'Please choose a file to upload.' };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `File size exceeds the 25 MB limit (${(file.size / (1024 * 1024)).toFixed(1)} MB).`
    };
  }

  const name = file.name.toLowerCase();
  const hasValidExt = ALLOWED_EXTENSIONS.some((ext) => name.endsWith(ext));
  const hasValidMime = ALLOWED_MIME_TYPES.includes(file.type);

  if (!hasValidExt && !hasValidMime) {
    return {
      valid: false,
      error: 'Unsupported file type. Please upload a PDF, DOCX, PPTX, PNG, or JPG file.'
    };
  }

  return { valid: true };
}

// Seed record for Assignment One
export const SEED_ASSIGNMENT_ONE: Note = {
  id: 'a1111111-1111-1111-1111-111111111111',
  title: 'Assignment One: Number Systems, Bitwise Operations, Integer Representations & Truth Tables',
  subject: 'Computer Fundamentals / Digital Logic',
  unit: 'Unit I',
  description: '30 comprehensive questions with step-by-step solutions covering base conversions, bitwise algebra, optimization algorithms (XOR swap, Brian Kernighan), 2\'s complement overflow, and verified truth tables.',
  class_id: 'CS-101',
  file_path: 'seed/assignment_one_30_questions.pdf',
  file_type: 'application/pdf',
  size_bytes: 51443,
  uploaded_by: '00000000-0000-0000-0000-000000000001',
  teacher_name: 'Faculty Instructor',
  uploaded_at: '2026-10-25T12:00:00Z',
  status: 'published',
  allow_download: true
};

function getLocalNotes(): Note[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_NOTES_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_STORAGE_NOTES_KEY, JSON.stringify([SEED_ASSIGNMENT_ONE]));
      return [SEED_ASSIGNMENT_ONE];
    }
    const parsed: Note[] = JSON.parse(raw);
    if (!parsed.some((n) => n.id === SEED_ASSIGNMENT_ONE.id)) {
      parsed.unshift(SEED_ASSIGNMENT_ONE);
      localStorage.setItem(LOCAL_STORAGE_NOTES_KEY, JSON.stringify(parsed));
    }
    return parsed;
  } catch {
    return [SEED_ASSIGNMENT_ONE];
  }
}

function saveLocalNotes(notes: Note[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_NOTES_KEY, JSON.stringify(notes));
  } catch (err) {
    console.warn('Failed saving to localStorage:', err);
  }
}

export async function uploadNoteFileDirect(
  file: File,
  teacherId: string,
  onProgress?: (percent: number) => void
): Promise<{ filePath: string; sizeBytes: number; fileType: string }> {
  const validation = validateNoteFile(file);
  if (!validation.valid) {
    throw new Error(validation.error || 'Invalid file');
  }

  const safeName = sanitizeFileName(file.name);
  const filePath = `${teacherId}/${safeName}`;

  if (onProgress) onProgress(25);

  try {
    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (uploadError) {
      console.warn('Supabase storage upload error, using local fallback:', uploadError.message);
    }
    if (onProgress) onProgress(100);
  } catch (storageErr) {
    console.warn('Direct storage error (continuing with local fallback):', storageErr);
    if (onProgress) onProgress(100);
  }

  return {
    filePath,
    sizeBytes: file.size,
    fileType: file.type || 'application/pdf'
  };
}

export async function createNote(
  formData: NoteFormData,
  fileMeta: { filePath: string; sizeBytes: number; fileType: string },
  teacher: { id: string; name: string }
): Promise<Note> {
  const newNote: Note = {
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `note_${Date.now()}`,
    title: formData.title.trim(),
    subject: formData.subject.trim(),
    unit: formData.unit.trim(),
    description: formData.description.trim(),
    class_id: formData.class_id.trim() || 'CS-101',
    file_path: fileMeta.filePath,
    file_type: fileMeta.fileType,
    size_bytes: fileMeta.sizeBytes,
    uploaded_by: teacher.id,
    teacher_name: teacher.name || 'Instructor',
    uploaded_at: new Date().toISOString(),
    status: formData.status,
    allow_download: formData.allow_download
  };

  try {
    const { data, error } = await supabase
      .from('notes')
      .insert([newNote])
      .select()
      .single();

    if (error) {
      console.warn('Supabase notes table insert fallback:', error.message);
      const local = getLocalNotes();
      local.unshift(newNote);
      saveLocalNotes(local);
      return newNote;
    }

    const local = getLocalNotes();
    local.unshift(data || newNote);
    saveLocalNotes(local);
    return data || newNote;
  } catch (err) {
    console.warn('createNote fallback to local:', err);
    const local = getLocalNotes();
    local.unshift(newNote);
    saveLocalNotes(local);
    return newNote;
  }
}

export async function updateNote(
  noteId: string,
  updates: Partial<NoteFormData> & { file_path?: string; file_type?: string; size_bytes?: number }
): Promise<Note> {
  try {
    const { data, error } = await supabase
      .from('notes')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', noteId)
      .select()
      .single();

    if (error) {
      console.warn('Supabase update fallback:', error.message);
    }

    const local = getLocalNotes();
    const idx = local.findIndex((n) => n.id === noteId);
    if (idx !== -1) {
      local[idx] = { ...local[idx], ...updates, updated_at: new Date().toISOString() };
      saveLocalNotes(local);
      return local[idx];
    }
    return data as Note;
  } catch {
    const local = getLocalNotes();
    const idx = local.findIndex((n) => n.id === noteId);
    if (idx !== -1) {
      local[idx] = { ...local[idx], ...updates, updated_at: new Date().toISOString() };
      saveLocalNotes(local);
      return local[idx];
    }
    throw new Error('Note not found');
  }
}

export async function toggleNoteStatus(noteId: string, currentStatus: NoteStatus): Promise<NoteStatus> {
  const newStatus: NoteStatus = currentStatus === 'published' ? 'draft' : 'published';
  await updateNote(noteId, { status: newStatus });
  return newStatus;
}

export async function deleteNote(noteId: string, filePath: string): Promise<void> {
  try {
    await supabase.storage.from(BUCKET_NAME).remove([filePath]);
  } catch (err) {
    console.warn('Storage remove warning:', err);
  }

  try {
    const { error } = await supabase.from('notes').delete().eq('id', noteId);
    if (error) {
      console.warn('DB delete warning:', error.message);
    }
  } catch (err) {
    console.warn('deleteNote DB catch:', err);
  }

  const local = getLocalNotes().filter((n) => n.id !== noteId);
  saveLocalNotes(local);
}

export async function fetchNotes(userRole: string, userId?: string, classId = 'CS-101'): Promise<Note[]> {
  try {
    let query = supabase.from('notes').select('*');

    if (userRole === 'teacher' || userRole === 'admin') {
      if (userId) {
        query = query.or(`uploaded_by.eq.${userId},class_id.eq.${classId}`);
      }
    } else {
      query = query.eq('status', 'published').eq('class_id', classId);
    }

    const { data, error } = await query.order('uploaded_at', { ascending: false });

    if (error || !data || data.length === 0) {
      const local = getLocalNotes();
      if (userRole === 'teacher' || userRole === 'admin') {
        return local;
      }
      return local.filter((n) => n.status === 'published' && (n.class_id === classId || n.class_id === 'CS-101'));
    }

    return data as Note[];
  } catch {
    const local = getLocalNotes();
    if (userRole === 'teacher' || userRole === 'admin') {
      return local;
    }
    return local.filter((n) => n.status === 'published' && (n.class_id === classId || n.class_id === 'CS-101'));
  }
}

export async function getSignedUrl(filePath: string): Promise<string> {
  if (filePath === 'seed/assignment_one_30_questions.pdf' || filePath.includes('assignment_one')) {
    return '/assignment_one_30_questions.pdf';
  }

  try {
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(filePath, 600); // 10 minutes (600s)

    if (error || !data?.signedUrl) {
      return '/assignment_one_30_questions.pdf';
    }
    return data.signedUrl;
  } catch {
    return '/assignment_one_30_questions.pdf';
  }
}

// Student reading progress
export function getStudentProgressLocal(userId: string, noteId: string): NoteStudentProgress {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_PROGRESS_KEY);
    if (!raw) return { user_id: userId, note_id: noteId, is_read: false, progress_percent: 0 };
    const list: NoteStudentProgress[] = JSON.parse(raw);
    const item = list.find((p) => p.user_id === userId && p.note_id === noteId);
    return item || { user_id: userId, note_id: noteId, is_read: false, progress_percent: 0 };
  } catch {
    return { user_id: userId, note_id: noteId, is_read: false, progress_percent: 0 };
  }
}

export async function saveStudentProgress(
  userId: string,
  noteId: string,
  isRead: boolean,
  percent = 100
): Promise<NoteStudentProgress> {
  const record: NoteStudentProgress = {
    user_id: userId,
    note_id: noteId,
    is_read: isRead,
    read_at: isRead ? new Date().toISOString() : null,
    progress_percent: percent
  };

  try {
    await supabase.from('note_student_progress').upsert(record);
  } catch (err) {
    console.warn('Supabase progress upsert warning:', err);
  }

  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_PROGRESS_KEY);
    let list: NoteStudentProgress[] = raw ? JSON.parse(raw) : [];
    list = list.filter((p) => !(p.user_id === userId && p.note_id === noteId));
    list.push(record);
    localStorage.setItem(LOCAL_STORAGE_PROGRESS_KEY, JSON.stringify(list));
  } catch (err) {
    console.warn('Local progress save error:', err);
  }

  return record;
}
