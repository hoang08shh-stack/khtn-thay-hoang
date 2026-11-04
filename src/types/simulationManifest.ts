import { Grade, SubjectDomain } from './index.ts';

/**
 * Simulation Architecture Modes:
 * - 'declarative_glb': Model uploaded/configured by admin via GLB/GLTF + predefined controls. Zero code editing required.
 * - 'custom_tsx': Programmed in TypeScript/React with full scientific physics, tested and deployed via Git.
 */
export type SimulationMode = 'declarative_glb' | 'custom_tsx' | 'external_embed';

/**
 * Publication status:
 * - 'draft': Only visible in Admin Dashboard to teachers/admins for testing.
 * - 'published': Publicly visible in student 3D lab library and lesson materials.
 */
export type SimulationStatus = 'draft' | 'published';

/**
 * Lighting presets available in ModelViewer
 */
export type LightingPreset = 'studio' | 'lab' | 'warm' | 'dark';

/**
 * 3D Hotspot / Annotation Pin on the 3D model
 */
export interface SimulationAnnotation {
  id: string;
  title: string;
  description: string;
  position: [number, number, number];
  color?: string;
  category?: string;
}

/**
 * Predefined controls supported securely by ModelViewer.
 * No arbitrary JavaScript is ever executed.
 */
export interface PredefinedControlsConfig {
  enableAutoRotate: boolean;
  defaultAutoRotate: boolean;
  autoRotateSpeed: number; // 0.1 to 5.0
  enableWireframeToggle: boolean;
  defaultWireframe: boolean;
  enableExplode: boolean;
  maxExplodeDistance: number; // 0.5 to 5.0
  enableClipping: boolean;
  clippingAxis: 'x' | 'y' | 'z';
  lightingPreset: LightingPreset;
  ambientLightIntensity: number; // 0.1 to 3.0
  directionalLightIntensity: number; // 0.1 to 4.0
  enableAnimations: boolean;
  defaultAnimationSpeed: number; // 0.2 to 2.0
  cameraPosition: [number, number, number];
  cameraTarget: [number, number, number];
  fov: number; // 30 to 90
  minZoomDistance: number;
  maxZoomDistance: number;
}

/**
 * Pedagogical Discovery Question
 */
export interface DiscoveryQuestionDef {
  id: string;
  question: string;
  options: {
    id: string;
    text: string;
    isCorrect: boolean;
  }[];
  explanation: string;
  hint?: string;
}

/**
 * Key scientific concept entry
 */
export interface KeyConceptDef {
  term: string;
  definition: string;
}

/**
 * Model file asset metadata
 */
export interface ModelAssetDef {
  url: string;
  fileName: string;
  fileSizeFormatted?: string;
  fileSizeBytes?: number;
  format: 'glb' | 'gltf';
  storagePath?: string;
  polyCountEstimate?: string;
  uploadedAt?: string;
}

/**
 * Complete JSON Manifest Schema for a 3D Simulation
 */
export interface SimulationManifest {
  schemaVersion: '1.0.0';
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  version: string; // SemVer e.g. "1.0.0"
  mode: SimulationMode;
  status: SimulationStatus;
  grade: Grade; // 6, 7, 8, 9
  domain: SubjectDomain; // 'hoa-hoc' | 'vat-li' | 'sinh-hoc' | 'trai-dat-vu-tru'
  category: string;
  difficulty: 'Cơ bản' | 'Trung bình' | 'Nâng cao';
  curriculumCode: string; // e.g. "GDPT 2018 - KHTN 9 (Chủ đề 8: Di truyền học)"
  tags: string[];
  thumbnailUrl: string;
  summary: string;
  learningObjectives: string[];
  keyConcepts: KeyConceptDef[];
  modelAsset?: ModelAssetDef;
  externalUrl?: string;
  controlsConfig: PredefinedControlsConfig;
  annotations: SimulationAnnotation[];
  scientificExplanation: {
    overview: string;
    keyPoints: { title: string; content: string }[];
    realWorldApplication: string;
  };
  discoveryQuestions: DiscoveryQuestionDef[];
  relatedLessonIds?: string[];
  createdAt: string;
  updatedAt: string;
  author: string;
}
