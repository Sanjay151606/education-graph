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

/**
 * Uploads a note file directly to Supabase Storage ('notes' bucket).
 * Throws explicit errors on any failure (no silent swallow).
 */
export async function uploadNoteFileDirect(
  file: File,
  teacherId: string,
  onProgress?: (percent: number) => void
): Promise<{ filePath: string; sizeBytes: number; fileType: string }> {
  const validation = validateNoteFile(file);
  if (!validation.valid) {
    throw new Error(validation.error || 'Invalid file');
  }

  // 1. Check for active Supabase Auth session
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) {
    console.error('[notesService] Session error:', sessionError);
    throw new Error(`Session error: ${sessionError.message}`);
  }

  if (!session?.user) {
    const isDemo = typeof localStorage !== 'undefined' && !!localStorage.getItem('braingraph_demo_session');
    if (isDemo) {
      throw new Error(
        'Demo Mode Notice: You are currently signed in with an offline demo session. Direct Supabase Storage uploads require an active Supabase Auth user. Please sign in with your real teacher account to upload notes.'
      );
    }
    throw new Error('Session expired: No active Supabase authentication session. Please sign in as a teacher.');
  }

  // 2. Validate role
  const resolvedRole = session.user.user_metadata?.role || (session.user as { role?: string }).role || localStorage.getItem('bg_user_role');
  if (resolvedRole && resolvedRole !== 'teacher' && resolvedRole !== 'admin') {
    throw new Error('Permission denied (not a teacher): Only users with the teacher role are permitted to upload notes.');
  }

  const effectiveTeacherId = session.user.id || teacherId;
  const safeName = sanitizeFileName(file.name);
  const filePath = `${effectiveTeacherId}/${safeName}`;

  if (onProgress) onProgress(35);

  // 3. Direct upload to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true
    });

  if (uploadError) {
    console.error('[notesService] Supabase storage upload error:', uploadError);
    const msg = uploadError.message || '';
    const status = (uploadError as { statusCode?: number; status?: number }).statusCode ||
                   (uploadError as { statusCode?: number; status?: number }).status;

    if (msg.toLowerCase().includes('bucket not found') || status === 404 || msg.toLowerCase().includes('not found')) {
      throw new Error(
        `Bucket not found: Storage bucket '${BUCKET_NAME}' does not exist in Supabase. Please apply the SQL migration schema in your Supabase SQL editor.`
      );
    }
    if (
      msg.toLowerCase().includes('violates row-level security') ||
      msg.toLowerCase().includes('row-level security') ||
      msg.toLowerCase().includes('permission denied') ||
      status === 403
    ) {
      throw new Error(
        'Permission denied (not a teacher): Storage RLS policy rejected the upload. Ensure your account has the teacher role in Supabase.'
      );
    }
    if (msg.toLowerCase().includes('payload too large') || status === 413) {
      throw new Error('File too large: File exceeds the maximum allowed size (25 MB).');
    }
    if (msg.toLowerCase().includes('unauthorized') || status === 401) {
      throw new Error('Session expired or unauthorized: Please log in again.');
    }
    throw new Error(`Storage upload failed: ${msg}`);
  }

  if (onProgress) onProgress(80);

  return {
    filePath,
    sizeBytes: file.size,
    fileType: file.type || 'application/pdf'
  };
}

/**
 * Inserts note record into Supabase public.notes table.
 * Throws explicit errors on database failure (no silent swallow).
 */
export async function createNote(
  formData: NoteFormData,
  fileMeta: { filePath: string; sizeBytes: number; fileType: string },
  teacher: { id: string; name: string }
): Promise<Note> {
  const { data: { session } } = await supabase.auth.getSession();
  const authUserId = session?.user?.id || teacher.id;

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
    uploaded_by: authUserId,
    teacher_name: teacher.name || session?.user?.user_metadata?.full_name || 'Instructor',
    uploaded_at: new Date().toISOString(),
    status: formData.status,
    allow_download: formData.allow_download
  };

  const { data, error } = await supabase
    .from('notes')
    .insert([newNote])
    .select()
    .single();

  if (error) {
    console.error('[notesService] Supabase notes table insert error:', error);
    const msg = error.message || '';
    const code = error.code;

    if (code === '42P01' || msg.toLowerCase().includes('relation "public.notes" does not exist') || msg.toLowerCase().includes('does not exist')) {
      throw new Error(
        "Table not found: Table 'notes' does not exist in your Supabase database. Please execute the SQL migration script in your Supabase SQL editor."
      );
    }
    if (code === '42501' || msg.toLowerCase().includes('row-level security') || msg.toLowerCase().includes('permission denied')) {
      throw new Error(
        "Permission denied (not a teacher): Database RLS policy prevented saving the note. Ensure your account has the 'teacher' role in Supabase."
      );
    }
    if (code === '23503' || msg.toLowerCase().includes('foreign key')) {
      throw new Error(
        'Foreign key constraint error: uploaded_by does not match any user in auth.users. Please sign in with an authentic Supabase teacher account.'
      );
    }
    throw new Error(`Database error saving note: ${msg}`);
  }

  const savedNote = data || newNote;
  const local = getLocalNotes();
  local.unshift(savedNote);
  saveLocalNotes(local);
  return savedNote;
}

export async function updateNote(
  noteId: string,
  updates: Partial<NoteFormData> & { file_path?: string; file_type?: string; size_bytes?: number }
): Promise<Note> {
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
    console.error('[notesService] Supabase update note error:', error);
    const msg = error.message || '';
    if (error.code === '42501' || msg.toLowerCase().includes('row-level security')) {
      throw new Error("Permission denied: You can only update your own notes.");
    }
    throw new Error(`Failed to update note: ${msg}`);
  }

  const local = getLocalNotes();
  const idx = local.findIndex((n) => n.id === noteId);
  if (idx !== -1) {
    local[idx] = { ...local[idx], ...updates, updated_at: new Date().toISOString() };
    saveLocalNotes(local);
    return local[idx];
  }
  return data as Note;
}

export async function toggleNoteStatus(noteId: string, currentStatus: NoteStatus): Promise<NoteStatus> {
  const newStatus: NoteStatus = currentStatus === 'published' ? 'draft' : 'published';
  await updateNote(noteId, { status: newStatus });
  return newStatus;
}

export async function deleteNote(noteId: string, filePath: string): Promise<void> {
  if (filePath && !filePath.startsWith('seed/')) {
    const { error: storageError } = await supabase.storage.from(BUCKET_NAME).remove([filePath]);
    if (storageError) {
      console.warn('[notesService] Storage remove warning:', storageError.message);
    }
  }

  const { error: dbError } = await supabase.from('notes').delete().eq('id', noteId);
  if (dbError) {
    console.error('[notesService] DB delete error:', dbError);
    if (dbError.code === '42501') {
      throw new Error("Permission denied: You can only delete your own notes.");
    }
    throw new Error(`Failed to delete note: ${dbError.message}`);
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

    if (error) {
      console.warn('[notesService] fetchNotes query warning:', error.message);
      const local = getLocalNotes();
      if (userRole === 'teacher' || userRole === 'admin') {
        return local;
      }
      return local.filter((n) => n.status === 'published' && (n.class_id === classId || n.class_id === 'CS-101'));
    }

    if (!data || data.length === 0) {
      const local = getLocalNotes();
      if (userRole === 'teacher' || userRole === 'admin') {
        return local;
      }
      return local.filter((n) => n.status === 'published' && (n.class_id === classId || n.class_id === 'CS-101'));
    }

    return data as Note[];
  } catch (err) {
    console.warn('[notesService] fetchNotes catch error:', err);
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
      .createSignedUrl(filePath, 600); // 10 minutes

    if (error || !data?.signedUrl) {
      console.warn('[notesService] createSignedUrl error:', error?.message);
      return '/assignment_one_30_questions.pdf';
    }
    return data.signedUrl;
  } catch (err) {
    console.warn('[notesService] getSignedUrl catch error:', err);
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
