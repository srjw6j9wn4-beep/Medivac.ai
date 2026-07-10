// IFR / Sim Ground Theory Exam Bank
// Mapped one-to-one to CASA Form 61-1503 Ground Theory Topics (a)–(q)
// 17 exams × 15 questions = 255 questions total
// All questions referenced to CASR Part 61, AIP Australia, or CASA MOS

import { EXAMS_IFR_PART1 } from './theoryExamsIFR_part1';
import { EXAMS_IFR_PART2 } from './theoryExamsIFR_part2';
export type { Exam, ExamQuestion } from './theoryExams';

export const EXAMS_IFR = [...EXAMS_IFR_PART1, ...EXAMS_IFR_PART2];
