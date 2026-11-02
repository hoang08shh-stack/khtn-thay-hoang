export type Grade = 6 | 7 | 8 | 9;

export type SubjectDomain = 'vat-li' | 'hoa-hoc' | 'sinh-hoc' | 'trai-dat-vu-tru';

export interface DomainInfo {
  id: SubjectDomain;
  name: string;
  shortName: string;
  color: string;
  bgColor: string;
  borderColor: string;
  iconName: string;
  description: string;
}

export interface Topic {
  id: string;
  grade: Grade;
  domain: SubjectDomain;
  code: string;
  title: string;
  description: string;
  lessonCount: number;
  experimentCount: number;
  icon: string;
  order: number;
}

export interface LessonSection {
  title: string;
  content: string[];
  keyPoints?: string[];
  formula?: string;
  formulaMeaning?: string;
  imageUrl?: string;
  imageCaption?: string;
}

export interface Lesson {
  id: string;
  topicId: string;
  grade: Grade;
  domain: SubjectDomain;
  code: string;
  title: string;
  summary: string;
  objectives: string[]; // Yêu cầu cần đạt theo GDPT 2018
  durationMinutes: number;
  sections: LessonSection[];
  keyTakeaways: string[];
  thumbnailUrl?: string;
  simulationId?: string;
  videoUrl?: string;
  documentId?: string;
  quizCount: number;
  viewCount: number;
  author: string;
}

export interface Simulation3D {
  id: string;
  title: string;
  grade: Grade;
  domain: SubjectDomain;
  category: string;
  description: string;
  learningGoal: string;
  keyConcepts: string[];
  thumbnail: string;
  type: 'atom-bohr' | 'microscope-cell' | 'electric-circuit' | 'acid-base-ph' | 'solar-system' | 'light-refraction' | 'water-molecule' | 'declarative-model';
  difficulty: 'Cơ bản' | 'Nâng cao' | 'Chuyên sâu';
  relatedLessonId?: string;
  controlsDescription: { key: string; action: string }[];
  parameters: {
    name: string;
    label: string;
    min: number;
    max: number;
    step: number;
    defaultValue: number;
    unit?: string;
  }[];
}

export interface DocumentItem {
  id: string;
  title: string;
  grade: Grade;
  domain: SubjectDomain;
  format: 'pptx' | 'pdf' | 'docx';
  type: 'Giáo án điện tử' | 'Phiếu học tập' | 'Sơ đồ tư duy' | 'Đề kiểm tra 15p/1T';
  pageCount: number;
  fileSize: string;
  description: string;
  author: string;
  downloadCount: number;
  previewSlides?: string[];
  downloadUrl: string;
}

export interface VideoLesson {
  id: string;
  title: string;
  grade: Grade;
  domain: SubjectDomain;
  duration: string;
  youtubeId: string;
  experimentType: 'Thí nghiệm thực hành' | 'Bài giảng lý thuyết' | 'Mô phỏng 3D hướng dẫn';
  instructor: string;
  description: string;
  views: number;
  timestamps: { time: string; label: string }[];
}

export type QuestionType = 'single_choice' | 'multiple_choice' | 'true_false';

export interface QuizQuestion {
  id: string;
  lessonId?: string;
  topicId?: string;
  grade: Grade;
  domain: SubjectDomain;
  question: string;
  questionType?: QuestionType;
  options: string[];
  correctAnswer?: number; // 0-based index for single_choice/true_false
  correctAnswers?: number[]; // array of 0-based indices for multiple_choice
  explanation: string;
  difficulty: 'Nhận biết' | 'Thông hiểu' | 'Vận dụng';
  hint?: string;
  points?: number;
}

export interface QuizMeta {
  id: string;
  lessonId?: string;
  lessonTitle?: string;
  grade: Grade;
  domain: SubjectDomain;
  title: string;
  description?: string;
  durationMinutes: number;
  passScore: number;
  questionCount: number;
  isPublished: boolean;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earnedAt?: string;
  requiredCriteria: string;
}

export interface UserProgress {
  userId: string;
  completedLessons: string[];
  quizScores: Record<
    string,
    {
      score: number;
      total: number;
      date: string;
      passed?: boolean;
      quizTitle?: string;
      percentage?: number;
    }
  >;
  completedSimulations: string[];
  bookmarkedLessons: string[];
  badges: string[]; // badge IDs
  points?: number;
  studyTimeMinutes: number;
  lastActive: string;
}

export interface AppUser {
  id: string;
  email: string;
  fullName: string;
  role: 'student' | 'teacher' | 'admin';
  grade?: Grade;
  school?: string;
  avatarUrl?: string;
}
