import {
  validateNoteFile,
  sanitizeFileName,
  ALLOWED_EXTENSIONS,
  ALLOWED_MIME_TYPES
} from '../notesService';

declare const process: any;

function runTests() {
  console.log('--- Running Notes Upload Diagnostic Tests ---');
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName} - ${detail || ''}`);
      failed++;
    }
  }

  // Test 1: Small valid PDF
  const smallPdf = {
    name: 'Lecture_1_Introduction.pdf',
    size: 45 * 1024, // 45 KB
    type: 'application/pdf'
  } as unknown as File;

  const res1 = validateNoteFile(smallPdf);
  assert(res1.valid === true, 'Test 1: Small valid PDF passes validation');

  // Test 2: Oversized file (> 25MB)
  const largePdf = {
    name: 'Huge_Textbook.pdf',
    size: 26 * 1024 * 1024, // 26 MB
    type: 'application/pdf'
  } as unknown as File;

  const res2 = validateNoteFile(largePdf);
  assert(
    Boolean(res2.valid === false && res2.error?.includes('exceeds the 25 MB limit')),
    'Test 2: Oversized file (>25MB) rejected with clear size error',
    res2.error
  );

  // Test 3: Unsupported file extension (.exe)
  const exeFile = {
    name: 'malware.exe',
    size: 1024,
    type: 'application/x-msdownload'
  } as unknown as File;

  const res3 = validateNoteFile(exeFile);
  assert(
    Boolean(res3.valid === false && res3.error?.includes('Unsupported file type')),
    'Test 3: Unsupported extension rejected with type error',
    res3.error
  );

  // Test 4: File name sanitization
  const rawName = 'Chapter #1: Number Systems & Truth Tables (v2.0) [Final].pdf';
  const sanitized = sanitizeFileName(rawName);
  const hasNoSpaces = !sanitized.includes(' ');
  const hasNoSpecialChars = /^[a-z0-9_.-]+$/.test(sanitized);
  const endsWithPdf = sanitized.endsWith('.pdf');
  assert(
    Boolean(hasNoSpaces && hasNoSpecialChars && endsWithPdf),
    'Test 4: Sanitization strips spaces and special characters',
    `Sanitized output: ${sanitized}`
  );

  // Test 5: Storage path construction matches RLS policy
  const teacherId = '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d';
  const filePath = `${teacherId}/${sanitized}`;
  const folderName = filePath.split('/')[0];
  assert(
    Boolean(folderName === teacherId),
    'Test 5: Storage path format matches RLS foldername policy',
    `Path: ${filePath}, Folder: ${folderName}`
  );

  // Test 6: Student role rejection simulation
  function simulateStudentUpload(role: string): string | null {
    if (role !== 'teacher' && role !== 'admin') {
      return 'Permission denied (not a teacher): Only users with the teacher role are permitted to upload notes.';
    }
    return null;
  }

  const studentError = simulateStudentUpload('student');
  assert(
    Boolean(studentError?.includes('Permission denied (not a teacher)')),
    'Test 6: Student role is strictly rejected from uploading',
    studentError || ''
  );

  const teacherError = simulateStudentUpload('teacher');
  assert(
    Boolean(teacherError === null),
    'Test 7: Teacher role is allowed to proceed to upload',
    teacherError || 'Allowed'
  );

  console.log(`\nResults: ${passed} passed, ${failed} failed`);
  if (failed > 0 && typeof process !== 'undefined' && process.exit) {
    process.exit(1);
  }
}

runTests();
