export type Grade = 6 | 7 | 8 | 9;

export type SubjectDomain = 'vat-li' | 'hoa-hoc' | 'sinh-hoc';

export interface DomainInfo {
  id: SubjectDomain;
  name: string;
  shortName: string;
  color: string;
  bgColor: string;
  borderColor: string;
  gradient?: string;
  iconName: string;
  description: string;
  image?: string;
}

export interface Topic {
  id: string;
  grade: Grade;
  domain: SubjectDomain;
  code: string;
  chapterNumber?: string;
  title: string;
  description: string;
  lessonCount: number;
  lessonsCount?: number;
  experimentCount: number;
  icon: string;
  order: number;
  image?: string;
}

export interface LessonSection {
  title: string;
  content: string[];
  keyPoints?: string[];
  formula?: string;
  formulaMeaning?: string;
  imageUrl?: string;
  imageCaption?: string;
  highlightBox?: {
    title: string;
    text: string;
  };
}

export interface LessonMiniQuizItem {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface LessonAsset {
  id: string;
  title: string;
  format: 'pptx' | 'pdf' | 'docx';
  type: string;
  fileSize: string;
  fileUrl: string;
}

export interface Lesson {
  id: string;
  topicId: string;
  grade: Grade;
  domain: SubjectDomain;
  code: string;
  title: string;
  summary: string;
  objectives: string[];
  durationMinutes: number;
  sections: LessonSection[];
  keyTakeaways: string[];
  keyFormulas?: string[];
  miniQuiz?: LessonMiniQuizItem[];
  assets?: LessonAsset[];
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
  type:
    | 'atom-bohr'
    | 'microscope-cell'
    | 'electric-circuit'
    | 'acid-base-ph'
    | 'solar-system'
    | 'light-refraction'
    | 'water-molecule'
    | 'declarative-model'
    | 'external-embed';
  externalUrl?: string;
  difficulty: 'Cơ bản' | 'Trung bình' | 'Nâng cao' | 'Chuyên sâu';
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
  type: string;
  pageCount: number;
  pagesCount?: number;
  fileSize: string;
  description: string;
  author: string;
  downloadCount: number;
  downloadsCount?: number;
  previewSlides?: string[];
  downloadUrl: string;
  fileUrl?: string;
}

export type DocumentResource = DocumentItem;

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
  summary?: string;
  thumbnail?: string;
  views: number;
  timestamps: { time: string; label: string }[];
}

export type VideoResource = VideoLesson;

export type QuestionType = 'single_choice' | 'multiple_choice' | 'true_false' | 'essay';

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
  solutionSteps?: string[]; // Hướng dẫn giải từng bước chi tiết
  sampleAnswer?: string; // Đáp án mẫu / biểu điểm cho câu hỏi tự luận
  allowImageUpload?: boolean; // Cho phép học sinh tải file ảnh bài làm lên (mặc định true với tự luận)
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
