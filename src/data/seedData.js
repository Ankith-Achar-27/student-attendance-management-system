/**
 * Realistic Institutional Mock Dataset
 * Seed Data for National Institute of Engineering & Technology
 */

export const INITIAL_STUDENTS = [
  { id: 'stud-042', rollNumber: 'CS2024-042', name: 'Rahul Sharma', email: 'rahul.sharma@niet.edu', department: 'CSE', semester: 5, section: 'A', status: 'Active' },
  { id: 'stud-001', rollNumber: 'CS2024-001', name: 'Aarav Patel', email: 'aarav.patel@niet.edu', department: 'CSE', semester: 5, section: 'A', status: 'Active' },
  { id: 'stud-002', rollNumber: 'CS2024-002', name: 'Aditi Sharma', email: 'aditi.sharma@niet.edu', department: 'CSE', semester: 5, section: 'A', status: 'Active' },
  { id: 'stud-003', rollNumber: 'CS2024-003', name: 'Bhavya Varma', email: 'bhavya.varma@niet.edu', department: 'CSE', semester: 5, section: 'A', status: 'Active' },
  { id: 'stud-004', rollNumber: 'CS2024-004', name: 'Chetan Bhagat', email: 'chetan.b@niet.edu', department: 'CSE', semester: 5, section: 'A', status: 'Active' },
  { id: 'stud-005', rollNumber: 'CS2024-005', name: 'Deepika Rao', email: 'deepika.rao@niet.edu', department: 'CSE', semester: 5, section: 'A', status: 'Active' },
  { id: 'stud-006', rollNumber: 'CS2024-006', name: 'Eshwar Murthy', email: 'eshwar.m@niet.edu', department: 'CSE', semester: 5, section: 'A', status: 'Active' },
  { id: 'stud-007', rollNumber: 'CS2024-007', name: 'Farhan Akhtar', email: 'farhan.a@niet.edu', department: 'CSE', semester: 5, section: 'A', status: 'Active' },
  { id: 'stud-008', rollNumber: 'CS2024-008', name: 'Gitanjali Sen', email: 'gitanjali.s@niet.edu', department: 'CSE', semester: 5, section: 'A', status: 'Active' },
  { id: 'stud-019', rollNumber: 'CS2024-019', name: 'Rohan Mehra', email: 'rohan.mehra@niet.edu', department: 'CSE', semester: 5, section: 'A', status: 'Active' },
  { id: 'stud-031', rollNumber: 'CS2024-031', name: 'Tanvi Saxena', email: 'tanvi.s@niet.edu', department: 'CSE', semester: 5, section: 'A', status: 'Active' },
  // Other departments for cross-department tests
  { id: 'stud-012', rollNumber: 'EC2024-012', name: 'Devendra Nair', email: 'dev.nair@niet.edu', department: 'ECE', semester: 5, section: 'B', status: 'Active' },
  { id: 'stud-015', rollNumber: 'EC2024-015', name: 'Manish Pandey', email: 'manish.p@niet.edu', department: 'ECE', semester: 5, section: 'B', status: 'Active' },
  { id: 'stud-009', rollNumber: 'IT2024-009', name: 'Isha Deshmukh', email: 'isha.d@niet.edu', department: 'IT', semester: 3, section: 'A', status: 'Active' },
  { id: 'stud-025', rollNumber: 'ME2024-025', name: 'Kunal Joshi', email: 'kunal.j@niet.edu', department: 'ME', semester: 7, section: 'A', status: 'Inactive' },
];

export const INITIAL_FACULTY = [
  { id: 'fac-101', employeeId: 'FAC-101', name: 'Dr. Ramesh Kulkarni', email: 'ramesh.k@niet.edu', department: 'CSE', designation: 'Professor & HOD', status: 'Active' },
  { id: 'fac-104', employeeId: 'FAC-104', name: 'Dr. Sarah Jenkins', email: 'sarah.j@niet.edu', department: 'CSE', designation: 'Associate Professor', status: 'Active' },
  { id: 'fac-109', employeeId: 'FAC-109', name: 'Prof. Ananya Sen', email: 'ananya.s@niet.edu', department: 'ECE', designation: 'Assistant Professor', status: 'Active' },
  { id: 'fac-114', employeeId: 'FAC-114', name: 'Prof. Vikram Malhotra', email: 'vikram.m@niet.edu', department: 'IT', designation: 'Assistant Professor', status: 'Active' },
  { id: 'fac-120', employeeId: 'FAC-120', name: 'Dr. Preeti Deshpande', email: 'preeti.d@niet.edu', department: 'ME', designation: 'Associate Professor', status: 'Active' },
];

export const INITIAL_SUBJECTS = [
  { id: 'subj-cs501', code: 'CS501', name: 'Design and Analysis of Algorithms', credits: 4, semester: 5, department: 'CSE', facultyId: 'fac-101' },
  { id: 'subj-cs502', code: 'CS502', name: 'Database Management Systems', credits: 4, semester: 5, department: 'CSE', facultyId: 'fac-104' },
  { id: 'subj-cs503', code: 'CS503', name: 'Operating Systems & System Programming', credits: 3, semester: 5, department: 'CSE', facultyId: 'fac-104' },
  { id: 'subj-cs504', code: 'CS504', name: 'Theory of Computation', credits: 4, semester: 5, department: 'CSE', facultyId: 'fac-109' },
  { id: 'subj-ec501', code: 'EC501', name: 'Digital Signal Processing', credits: 4, semester: 5, department: 'ECE', facultyId: 'fac-109' },
  { id: 'subj-it302', code: 'IT302', name: 'Object Oriented Programming with Java', credits: 4, semester: 3, department: 'IT', facultyId: 'fac-114' },
  { id: 'subj-me701', code: 'ME701', name: 'Refrigeration and Air Conditioning', credits: 3, semester: 7, department: 'ME', facultyId: 'fac-120' },
];

// Helper to generate realistic session attendance records for CSE Sem 5
const cseStudents = INITIAL_STUDENTS.filter((s) => s.department === 'CSE' && s.semester === 5);

// Create session helper
const createSessionRecords = (absentStudentIds = []) => {
  return cseStudents.map((student) => ({
    studentId: student.id,
    status: absentStudentIds.includes(student.id) ? 'ABSENT' : 'PRESENT',
  }));
};

export const INITIAL_ATTENDANCE_SESSIONS = [
  // CS502 - Database Management Systems (Faculty: fac-104 Dr. Sarah Jenkins)
  {
    id: 'sess-cs502-01',
    subjectId: 'subj-cs502',
    facultyId: 'fac-104',
    date: '2026-09-18',
    period: 'Slot 2 (10:00 - 11:00 AM)',
    records: createSessionRecords(['stud-004', 'stud-019']),
  },
  {
    id: 'sess-cs502-02',
    subjectId: 'subj-cs502',
    facultyId: 'fac-104',
    date: '2026-09-21',
    period: 'Slot 2 (10:00 - 11:00 AM)',
    records: createSessionRecords(['stud-007', 'stud-019', 'stud-031']),
  },
  {
    id: 'sess-cs502-03',
    subjectId: 'subj-cs502',
    facultyId: 'fac-104',
    date: '2026-09-23',
    period: 'Slot 2 (10:00 - 11:00 AM)',
    records: createSessionRecords(['stud-004', 'stud-042']), // Rahul absent
  },
  {
    id: 'sess-cs502-04',
    subjectId: 'subj-cs502',
    facultyId: 'fac-104',
    date: '2026-09-25',
    period: 'Slot 2 (10:00 - 11:00 AM)',
    records: createSessionRecords(['stud-004', 'stud-019']),
  },
  {
    id: 'sess-cs502-05',
    subjectId: 'subj-cs502',
    facultyId: 'fac-104',
    date: '2026-09-28',
    period: 'Slot 2 (10:00 - 11:00 AM)',
    records: createSessionRecords(['stud-003', 'stud-019']),
  },
  {
    id: 'sess-cs502-06',
    subjectId: 'subj-cs502',
    facultyId: 'fac-104',
    date: '2026-09-30',
    period: 'Slot 2 (10:00 - 11:00 AM)',
    records: createSessionRecords(['stud-004', 'stud-007', 'stud-019']),
  },
  {
    id: 'sess-cs502-07',
    subjectId: 'subj-cs502',
    facultyId: 'fac-104',
    date: '2026-10-01',
    period: 'Slot 2 (10:00 - 11:00 AM)',
    records: createSessionRecords(['stud-004', 'stud-007']),
  },

  // CS503 - Operating Systems (Faculty: fac-104 Dr. Sarah Jenkins)
  {
    id: 'sess-cs503-01',
    subjectId: 'subj-cs503',
    facultyId: 'fac-104',
    date: '2026-09-19',
    period: 'Slot 4 (01:00 - 02:00 PM)',
    records: createSessionRecords(['stud-042', 'stud-004', 'stud-019']), // Rahul absent
  },
  {
    id: 'sess-cs503-02',
    subjectId: 'subj-cs503',
    facultyId: 'fac-104',
    date: '2026-09-22',
    period: 'Slot 4 (01:00 - 02:00 PM)',
    records: createSessionRecords(['stud-006', 'stud-019']),
  },
  {
    id: 'sess-cs503-03',
    subjectId: 'subj-cs503',
    facultyId: 'fac-104',
    date: '2026-09-26',
    period: 'Slot 4 (01:00 - 02:00 PM)',
    records: createSessionRecords(['stud-042', 'stud-004', 'stud-031']), // Rahul absent
  },
  {
    id: 'sess-cs503-04',
    subjectId: 'subj-cs503',
    facultyId: 'fac-104',
    date: '2026-09-29',
    period: 'Slot 4 (01:00 - 02:00 PM)',
    records: createSessionRecords(['stud-004', 'stud-019']),
  },
  {
    id: 'sess-cs503-05',
    subjectId: 'subj-cs503',
    facultyId: 'fac-104',
    date: '2026-09-30',
    period: 'Slot 4 (01:00 - 02:00 PM)',
    records: createSessionRecords(['stud-042', 'stud-007', 'stud-019']), // Rahul absent
  },

  // CS501 - Design and Analysis of Algorithms (Faculty: fac-101 Dr. Ramesh Kulkarni)
  {
    id: 'sess-cs501-01',
    subjectId: 'subj-cs501',
    facultyId: 'fac-101',
    date: '2026-09-21',
    period: 'Slot 1 (09:00 - 10:00 AM)',
    records: createSessionRecords(['stud-004', 'stud-019']),
  },
  {
    id: 'sess-cs501-02',
    subjectId: 'subj-cs501',
    facultyId: 'fac-101',
    date: '2026-09-24',
    period: 'Slot 1 (09:00 - 10:00 AM)',
    records: createSessionRecords(['stud-007', 'stud-019']),
  },
  {
    id: 'sess-cs501-03',
    subjectId: 'subj-cs501',
    facultyId: 'fac-101',
    date: '2026-09-28',
    period: 'Slot 1 (09:00 - 10:00 AM)',
    records: createSessionRecords(['stud-019', 'stud-031']),
  },
  {
    id: 'sess-cs501-04',
    subjectId: 'subj-cs501',
    facultyId: 'fac-101',
    date: '2026-10-01',
    period: 'Slot 1 (09:00 - 10:00 AM)',
    records: createSessionRecords(['stud-004', 'stud-007']),
  },

  // CS504 - Theory of Computation (Faculty: fac-109 Prof. Ananya Sen)
  {
    id: 'sess-cs504-01',
    subjectId: 'subj-cs504',
    facultyId: 'fac-109',
    date: '2026-09-22',
    period: 'Slot 3 (11:15 - 12:15 PM)',
    records: createSessionRecords(['stud-004', 'stud-019']),
  },
  {
    id: 'sess-cs504-02',
    subjectId: 'subj-cs504',
    facultyId: 'fac-109',
    date: '2026-09-25',
    period: 'Slot 3 (11:15 - 12:15 PM)',
    records: createSessionRecords(['stud-007', 'stud-019']),
  },
  {
    id: 'sess-cs504-03',
    subjectId: 'subj-cs504',
    facultyId: 'fac-109',
    date: '2026-09-29',
    period: 'Slot 3 (11:15 - 12:15 PM)',
    records: createSessionRecords(['stud-004', 'stud-019', 'stud-031']),
  },
];
