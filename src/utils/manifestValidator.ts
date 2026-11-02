import {
  SimulationManifest,
  PredefinedControlsConfig,
  SimulationAnnotation,
  DiscoveryQuestionDef,
} from '../types/simulationManifest.ts';

export interface ManifestValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  sanitized?: SimulationManifest;
}

const SEMVER_REGEX = /^\d+\.\d+\.\d+$/;
const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const ID_REGEX = /^[a-z0-9_-]+$/;

/**
 * Default safe controls configuration
 */
export const DEFAULT_CONTROLS_CONFIG: PredefinedControlsConfig = {
  enableAutoRotate: true,
  defaultAutoRotate: true,
  autoRotateSpeed: 1.0,
  enableWireframeToggle: true,
  defaultWireframe: false,
  enableExplode: true,
  maxExplodeDistance: 2.0,
  enableClipping: true,
  clippingAxis: 'y',
  lightingPreset: 'studio',
  ambientLightIntensity: 1.0,
  directionalLightIntensity: 1.5,
  enableAnimations: true,
  defaultAnimationSpeed: 1.0,
  cameraPosition: [0, 1.5, 4],
  cameraTarget: [0, 0, 0],
  fov: 45,
  minZoomDistance: 1.2,
  maxZoomDistance: 12.0,
};

/**
 * Sanitize plain text string to prevent XSS injection
 */
function sanitizeString(str: unknown, maxLength = 1000): string {
  if (typeof str !== 'string') return '';
  return str
    .replace(/[<>]/g, '') // strip HTML brackets
    .trim()
    .slice(0, maxLength);
}

/**
 * Validate URL security: forbid javascript:, data:html, and unknown schemes
 */
function isSafeUrl(url: unknown): boolean {
  if (typeof url !== 'string' || !url.trim()) return false;
  const trimmed = url.trim().toLowerCase();
  if (trimmed.startsWith('javascript:') || trimmed.startsWith('vbscript:')) {
    return false;
  }
  if (trimmed.startsWith('data:') && !trimmed.startsWith('data:image/')) {
    return false;
  }
  return (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('blob:') ||
    trimmed.startsWith('/')
  );
}

/**
 * Validate a Simulation Manifest JSON against the GDPT 2018 EdTech schema
 */
export function validateSimulationManifest(input: unknown): ManifestValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!input || typeof input !== 'object') {
    return {
      isValid: false,
      errors: ['Manifest phải là một đối tượng JSON hợp lệ.'],
      warnings: [],
    };
  }

  const data = input as Record<string, any>;

  // 1. Schema version
  if (data.schemaVersion !== '1.0.0') {
    errors.push('Phiên bản schemaVersion phải là "1.0.0".');
  }

  // 2. ID & Slug
  const id = sanitizeString(data.id, 80);
  if (!id) {
    errors.push('Trường "id" không được để trống.');
  } else if (!ID_REGEX.test(id)) {
    errors.push('Trường "id" chỉ được chứa chữ thường (a-z), chữ số (0-9), dấu gạch ngang (-) và gạch dưới (_).');
  }

  const slug = sanitizeString(data.slug, 100);
  if (!slug) {
    errors.push('Trường "slug" không được để trống.');
  } else if (!SLUG_REGEX.test(slug)) {
    errors.push('Trường "slug" không đúng định dạng URL (chỉ gồm chữ thường, chữ số và nối bằng dấu gạch ngang).');
  }

  // 3. Title & Subtitle
  const title = sanitizeString(data.title, 150);
  if (!title || title.length < 3) {
    errors.push('Trường "title" phải có độ dài từ 3 đến 150 ký tự.');
  }

  const subtitle = sanitizeString(data.subtitle, 250);

  // 4. SemVer version
  const version = sanitizeString(data.version, 20);
  if (!version) {
    errors.push('Trường "version" không được để trống.');
  } else if (!SEMVER_REGEX.test(version)) {
    errors.push(`Phiên bản "${version}" không đúng chuẩn Semantic Versioning (ví dụ: "1.0.0").`);
  }

  // 5. Mode
  const mode = data.mode;
  if (mode !== 'declarative_glb' && mode !== 'custom_tsx') {
    errors.push('Chế độ "mode" chỉ được là "declarative_glb" hoặc "custom_tsx".');
  }

  // 6. Status
  const status = data.status;
  if (status !== 'draft' && status !== 'published') {
    errors.push('Trạng thái "status" chỉ được là "draft" (bản nháp) hoặc "published" (đã xuất bản).');
  }

  // 7. Grade & Domain
  const grade = Number(data.grade);
  if (![6, 7, 8, 9].includes(grade)) {
    errors.push('Khối lớp "grade" phải là 6, 7, 8 hoặc 9 theo chương trình THCS.');
  }

  const allowedDomains = ['hoa-hoc', 'vat-li', 'sinh-hoc', 'trai-dat-vu-tru'];
  const domain = data.domain;
  if (!allowedDomains.includes(domain)) {
    errors.push(`Mạch kiến thức "domain" không hợp lệ. Cho phép: ${allowedDomains.join(', ')}.`);
  }

  // 8. Curriculum Code & Summary
  const curriculumCode = sanitizeString(data.curriculumCode, 150) || `GDPT 2018 - KHTN ${grade}`;
  const summary = sanitizeString(data.summary, 1000);
  if (!summary || summary.length < 10) {
    errors.push('Tóm tắt "summary" phải có ít nhất 10 ký tự.');
  }

  // 9. Model Asset (Required for declarative_glb)
  let sanitizedModelAsset: {
    url: string;
    fileName: string;
    fileSizeFormatted: string;
    fileSizeBytes?: number;
    format: 'glb' | 'gltf';
    storagePath?: string;
    polyCountEstimate?: string;
  } | undefined = undefined;
  if (mode === 'declarative_glb') {
    if (!data.modelAsset || typeof data.modelAsset !== 'object') {
      errors.push('Chế độ "declarative_glb" bắt buộc phải có thông tin tệp 3D "modelAsset".');
    } else {
      const asset = data.modelAsset;
      const url = typeof asset.url === 'string' ? asset.url.trim() : '';
      if (!url) {
        errors.push('Đường dẫn tệp 3D "modelAsset.url" không được để trống.');
      } else if (!isSafeUrl(url)) {
        errors.push('Đường dẫn tệp 3D không an toàn (phát hiện giao thức bị cấm).');
      }

      const format: 'glb' | 'gltf' = asset.format === 'gltf' ? 'gltf' : 'glb';
      sanitizedModelAsset = {
        url,
        fileName: sanitizeString(asset.fileName, 100) || `${id}.${format}`,
        fileSizeFormatted: sanitizeString(asset.fileSizeFormatted, 20) || 'Chưa xác định',
        fileSizeBytes: typeof asset.fileSizeBytes === 'number' ? asset.fileSizeBytes : undefined,
        format,
        storagePath: typeof asset.storagePath === 'string' ? asset.storagePath : undefined,
        polyCountEstimate: sanitizeString(asset.polyCountEstimate, 50),
      };
    }
  }

  // 10. Controls Config Validation
  const userControls = data.controlsConfig || {};
  const sanitizedControls: PredefinedControlsConfig = {
    enableAutoRotate: Boolean(userControls.enableAutoRotate ?? DEFAULT_CONTROLS_CONFIG.enableAutoRotate),
    defaultAutoRotate: Boolean(userControls.defaultAutoRotate ?? DEFAULT_CONTROLS_CONFIG.defaultAutoRotate),
    autoRotateSpeed: Math.min(Math.max(Number(userControls.autoRotateSpeed) || 1.0, 0.1), 5.0),
    enableWireframeToggle: Boolean(userControls.enableWireframeToggle ?? DEFAULT_CONTROLS_CONFIG.enableWireframeToggle),
    defaultWireframe: Boolean(userControls.defaultWireframe ?? false),
    enableExplode: Boolean(userControls.enableExplode ?? DEFAULT_CONTROLS_CONFIG.enableExplode),
    maxExplodeDistance: Math.min(Math.max(Number(userControls.maxExplodeDistance) || 2.0, 0.5), 5.0),
    enableClipping: Boolean(userControls.enableClipping ?? DEFAULT_CONTROLS_CONFIG.enableClipping),
    clippingAxis: ['x', 'y', 'z'].includes(userControls.clippingAxis) ? userControls.clippingAxis : 'y',
    lightingPreset: ['studio', 'lab', 'warm', 'dark'].includes(userControls.lightingPreset)
      ? userControls.lightingPreset
      : 'studio',
    ambientLightIntensity: Math.min(Math.max(Number(userControls.ambientLightIntensity) || 1.0, 0.1), 3.0),
    directionalLightIntensity: Math.min(Math.max(Number(userControls.directionalLightIntensity) || 1.5, 0.1), 4.0),
    enableAnimations: Boolean(userControls.enableAnimations ?? DEFAULT_CONTROLS_CONFIG.enableAnimations),
    defaultAnimationSpeed: Math.min(Math.max(Number(userControls.defaultAnimationSpeed) || 1.0, 0.2), 2.0),
    cameraPosition: Array.isArray(userControls.cameraPosition) && userControls.cameraPosition.length === 3
      ? [Number(userControls.cameraPosition[0]) || 0, Number(userControls.cameraPosition[1]) || 1.5, Number(userControls.cameraPosition[2]) || 4]
      : DEFAULT_CONTROLS_CONFIG.cameraPosition,
    cameraTarget: Array.isArray(userControls.cameraTarget) && userControls.cameraTarget.length === 3
      ? [Number(userControls.cameraTarget[0]) || 0, Number(userControls.cameraTarget[1]) || 0, Number(userControls.cameraTarget[2]) || 0]
      : DEFAULT_CONTROLS_CONFIG.cameraTarget,
    fov: Math.min(Math.max(Number(userControls.fov) || 45, 30), 90),
    minZoomDistance: Math.min(Math.max(Number(userControls.minZoomDistance) || 1.2, 0.5), 5.0),
    maxZoomDistance: Math.min(Math.max(Number(userControls.maxZoomDistance) || 12.0, 6.0), 30.0),
  };

  // 11. Annotations (Hotspot Pins)
  const sanitizedAnnotations: SimulationAnnotation[] = [];
  if (Array.isArray(data.annotations)) {
    data.annotations.forEach((item, index) => {
      if (item && typeof item === 'object') {
        const pinTitle = sanitizeString(item.title, 100);
        const pinDesc = sanitizeString(item.description, 400);
        const pos = Array.isArray(item.position) && item.position.length === 3
          ? [Number(item.position[0]) || 0, Number(item.position[1]) || 0, Number(item.position[2]) || 0] as [number, number, number]
          : [0, 0, 0] as [number, number, number];

        if (pinTitle) {
          sanitizedAnnotations.push({
            id: sanitizeString(item.id, 50) || `pin-${index + 1}`,
            title: pinTitle,
            description: pinDesc,
            position: pos,
            color: sanitizeString(item.color, 30) || '#0D9488',
            category: sanitizeString(item.category, 50),
          });
        }
      }
    });
  }

  // 12. Discovery Questions
  const sanitizedQuestions: DiscoveryQuestionDef[] = [];
  if (Array.isArray(data.discoveryQuestions)) {
    data.discoveryQuestions.forEach((q, idx) => {
      if (q && typeof q === 'object') {
        const qText = sanitizeString(q.question, 300);
        const explanation = sanitizeString(q.explanation, 500);
        const rawOptions = Array.isArray(q.options) ? q.options : [];

        if (qText) {
          if (rawOptions.length < 2) {
            errors.push(`Câu hỏi số ${idx + 1} phải có tối thiểu 2 phương án lựa chọn.`);
          }
          const correctCount = rawOptions.filter((opt: any) => opt && opt.isCorrect === true).length;
          if (correctCount !== 1) {
            errors.push(`Câu hỏi số ${idx + 1} phải có đúng 1 đáp án chính xác (hiện có: ${correctCount}).`);
          }

          sanitizedQuestions.push({
            id: sanitizeString(q.id, 50) || `q-${idx + 1}`,
            question: qText,
            options: rawOptions.map((opt: any, optIdx: number) => ({
              id: sanitizeString(opt.id, 20) || String.fromCharCode(97 + optIdx),
              text: sanitizeString(opt.text, 200),
              isCorrect: Boolean(opt.isCorrect),
            })),
            explanation: explanation || 'Giải thích chuẩn theo sách giáo khoa KHTN GDPT 2018.',
            hint: sanitizeString(q.hint, 200),
          });
        }
      }
    });
  }

  // 13. Scientific explanation
  const sciExp = data.scientificExplanation || {};
  const sanitizedExplanation = {
    overview: sanitizeString(sciExp.overview, 1500) || summary,
    keyPoints: Array.isArray(sciExp.keyPoints)
      ? sciExp.keyPoints
          .filter((kp: any) => kp && kp.title)
          .map((kp: any) => ({
            title: sanitizeString(kp.title, 100),
            content: sanitizeString(kp.content, 800),
          }))
      : [],
    realWorldApplication: sanitizeString(sciExp.realWorldApplication, 1000),
  };

  if (errors.length > 0) {
    return {
      isValid: false,
      errors,
      warnings,
    };
  }

  const sanitized: SimulationManifest = {
    schemaVersion: '1.0.0',
    id,
    slug,
    title,
    subtitle: subtitle || `${title} - KHTN Lớp ${grade}`,
    version,
    mode,
    status,
    grade: grade as any,
    domain,
    category: sanitizeString(data.category, 80) || 'Thí nghiệm mô phỏng',
    difficulty: ['Cơ bản', 'Trung bình', 'Nâng cao'].includes(data.difficulty)
      ? data.difficulty
      : 'Cơ bản',
    curriculumCode,
    tags: Array.isArray(data.tags)
      ? data.tags.map((t) => sanitizeString(t, 40)).filter(Boolean)
      : [],
    thumbnailUrl: isSafeUrl(data.thumbnailUrl)
      ? data.thumbnailUrl
      : 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=800&q=80',
    summary,
    learningObjectives: Array.isArray(data.learningObjectives)
      ? data.learningObjectives.map((lo) => sanitizeString(lo, 250)).filter(Boolean)
      : [],
    keyConcepts: Array.isArray(data.keyConcepts)
      ? data.keyConcepts
          .filter((kc: any) => kc && kc.term)
          .map((kc: any) => ({
            term: sanitizeString(kc.term, 80),
            definition: sanitizeString(kc.definition, 400),
          }))
      : [],
    modelAsset: sanitizedModelAsset,
    controlsConfig: sanitizedControls,
    annotations: sanitizedAnnotations,
    scientificExplanation: sanitizedExplanation,
    discoveryQuestions: sanitizedQuestions,
    relatedLessonIds: Array.isArray(data.relatedLessonIds)
      ? data.relatedLessonIds.map((lid) => sanitizeString(lid, 50)).filter(Boolean)
      : [],
    createdAt: data.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    author: sanitizeString(data.author, 100) || 'Thầy Hoàng KHTN',
  };

  return {
    isValid: true,
    errors: [],
    warnings,
    sanitized,
  };
}
