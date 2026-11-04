import {
  SimulationManifest,
  PredefinedControlsConfig,
} from '../types/simulationManifest.ts';

export const DEFAULT_CONTROLS_CONFIG: PredefinedControlsConfig = {
  enableAutoRotate: true,
  defaultAutoRotate: true,
  autoRotateSpeed: 1.2,
  enableWireframeToggle: true,
  defaultWireframe: false,
  enableExplode: true,
  maxExplodeDistance: 2.0,
  enableClipping: true,
  clippingAxis: 'y',
  lightingPreset: 'lab',
  ambientLightIntensity: 1.2,
  directionalLightIntensity: 1.8,
  enableAnimations: true,
  defaultAnimationSpeed: 1.0,
  cameraPosition: [0, 2, 5],
  cameraTarget: [0, 0, 0],
  fov: 45,
  minZoomDistance: 1.5,
  maxZoomDistance: 15.0,
};

export interface ManifestValidationResult {
  isValid: boolean;
  errors: string[];
  sanitized?: SimulationManifest;
}

function stripHtmlTags(str: string): string {
  return String(str || '').replace(/[<>]/g, '');
}

function clamp(val: number, min: number, max: number): number {
  if (typeof val !== 'number' || Number.isNaN(val)) return min;
  return Math.max(min, Math.min(max, val));
}

/**
 * Validates and sanitizes a SimulationManifest object
 */
export function validateSimulationManifest(input: any): ManifestValidationResult {
  const errors: string[] = [];

  if (!input || typeof input !== 'object') {
    return { isValid: false, errors: ['Manifest không hợp lệ.'] };
  }

  if (!input.id || typeof input.id !== 'string' || input.id.trim().length < 3) {
    errors.push('Trường id mô phỏng không hợp lệ (tối thiểu 3 ký tự).');
  }

  if (!input.title || typeof input.title !== 'string' || input.title.trim().length < 3) {
    errors.push('Tiêu đề mô phỏng (title) không được để trống.');
  }

  const semverRegex = /^\d+\.\d+\.\d+$/;
  if (!input.version || !semverRegex.test(String(input.version))) {
    errors.push('Phiên bản (version) phải tuân theo chuẩn Semantic Versioning (ví dụ: 1.0.0).');
  }

  if (![6, 7, 8, 9].includes(Number(input.grade))) {
    errors.push('Khối lớp (grade) phải thuộc phạm vi THCS: 6, 7, 8 hoặc 9.');
  }

  const allowedDomains = ['hoa-hoc', 'vat-li', 'sinh-hoc'];
  if (!allowedDomains.includes(input.domain)) {
    errors.push('Phân môn (domain) phải thuộc 1 trong 3 phân môn: Vật lí, Hóa học, Sinh học.');
  }

  if (input.mode === 'declarative_glb') {
    if (!input.modelAsset || !input.modelAsset.url) {
      errors.push('Chế độ declarative_glb bắt buộc phải có cấu hình modelAsset và url hợp lệ.');
    } else {
      const urlStr = String(input.modelAsset.url).trim().toLowerCase();
      if (urlStr.startsWith('javascript:') || urlStr.startsWith('data:text/html')) {
        errors.push('Đường dẫn modelAsset.url chứa giao thức không an toàn.');
      }
    }
  }

  if (input.mode === 'external_embed') {
    const extUrl = String(input.externalUrl || '').trim();
    if (!extUrl || (!extUrl.startsWith('https://') && !extUrl.startsWith('http://'))) {
      errors.push('Chế độ Nhúng Web 3D ngoài (external_embed) bắt buộc phải có đường dẫn URL hợp lệ bắt đầu bằng https:// hoặc http://.');
    }
  }

  if (Array.isArray(input.discoveryQuestions)) {
    input.discoveryQuestions.forEach((q: any, idx: number) => {
      const options = Array.isArray(q.options) ? q.options : [];
      const correctCount = options.filter((o: any) => o.isCorrect === true).length;
      if (correctCount !== 1) {
        errors.push(`Câu hỏi khám phá #${idx + 1} phải có đúng 1 đáp án chính xác.`);
      }
    });
  }

  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  const rawControls = input.controlsConfig || DEFAULT_CONTROLS_CONFIG;
  const sanitizedControls: PredefinedControlsConfig = {
    enableAutoRotate: Boolean(rawControls.enableAutoRotate ?? true),
    defaultAutoRotate: Boolean(rawControls.defaultAutoRotate ?? true),
    autoRotateSpeed: clamp(Number(rawControls.autoRotateSpeed ?? 1.2), 0.1, 5.0),
    enableWireframeToggle: Boolean(rawControls.enableWireframeToggle ?? true),
    defaultWireframe: Boolean(rawControls.defaultWireframe ?? false),
    enableExplode: Boolean(rawControls.enableExplode ?? true),
    maxExplodeDistance: clamp(Number(rawControls.maxExplodeDistance ?? 2.0), 0.5, 5.0),
    enableClipping: Boolean(rawControls.enableClipping ?? true),
    clippingAxis: ['x', 'y', 'z'].includes(rawControls.clippingAxis) ? rawControls.clippingAxis : 'y',
    lightingPreset: ['studio', 'lab', 'warm', 'dark'].includes(rawControls.lightingPreset)
      ? rawControls.lightingPreset
      : 'lab',
    ambientLightIntensity: clamp(Number(rawControls.ambientLightIntensity ?? 1.2), 0.1, 3.0),
    directionalLightIntensity: clamp(Number(rawControls.directionalLightIntensity ?? 1.8), 0.1, 4.0),
    enableAnimations: Boolean(rawControls.enableAnimations ?? true),
    defaultAnimationSpeed: clamp(Number(rawControls.defaultAnimationSpeed ?? 1.0), 0.2, 2.0),
    cameraPosition: Array.isArray(rawControls.cameraPosition) ? rawControls.cameraPosition : [0, 2, 5],
    cameraTarget: Array.isArray(rawControls.cameraTarget) ? rawControls.cameraTarget : [0, 0, 0],
    fov: clamp(Number(rawControls.fov ?? 45), 30, 90),
    minZoomDistance: clamp(Number(rawControls.minZoomDistance ?? 1.5), 0.5, 10.0),
    maxZoomDistance: clamp(Number(rawControls.maxZoomDistance ?? 15.0), 5.0, 50.0),
  };

  const sanitized: SimulationManifest = {
    ...input,
    id: stripHtmlTags(input.id).trim(),
    slug: stripHtmlTags(input.slug || input.id).trim(),
    title: stripHtmlTags(input.title),
    subtitle: stripHtmlTags(input.subtitle || ''),
    summary: stripHtmlTags(input.summary || ''),
    controlsConfig: sanitizedControls,
  };

  return {
    isValid: true,
    errors: [],
    sanitized,
  };
}
