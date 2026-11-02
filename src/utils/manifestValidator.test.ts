import test from 'node:test';
import assert from 'node:assert/strict';
import { validateSimulationManifest } from './manifestValidator.ts';
import { SimulationManifest } from '../types/simulationManifest.ts';

const validManifestSample: SimulationManifest = {
  schemaVersion: '1.0.0',
  id: 'sim-dna-double-helix',
  slug: 'cau-truc-dna-xoan-kep',
  title: 'Mô Hình Cấu Trúc Không Gian DNA Xoắn Kép',
  subtitle: 'Cặp bazơ nitơ bổ sung A-T, G-X theo mô hình Watson - Crick',
  version: '1.0.0',
  mode: 'declarative_glb',
  status: 'published',
  grade: 9,
  domain: 'sinh-hoc',
  category: 'Di truyền & Sinh học phân tử',
  difficulty: 'Trung bình',
  curriculumCode: 'GDPT 2018 - KHTN 9 (Chủ đề 8: Di truyền học)',
  tags: ['DNA', 'Watson-Crick', 'Nuclêôtit', 'Di truyền', 'Liên kết Hydro'],
  thumbnailUrl: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=800&q=80',
  summary: 'Khám phá chuỗi xoắn kép gồm 2 mạch pôlinuclêôtit xoắn song song ngược chiều quanh trục tưởng tượng.',
  learningObjectives: [
    'Mô tả được cấu trúc không gian của phân tử ADN gồm hai mạch xoắn đều quanh một trục.',
    'Nhận biết nguyên tắc bổ sung A liên kết với T bằng 2 liên kết hiđrô, G liên kết với X bằng 3 liên kết hiđrô.',
  ],
  keyConcepts: [
    { term: 'Nguyên tắc bổ sung', definition: 'A luôn liên kết với T bằng 2 liên kết H, G luôn liên kết với X bằng 3 liên kết H.' },
  ],
  modelAsset: {
    url: 'https://storage.khtnthayhoang.edu.vn/models/dna_helix.glb',
    fileName: 'dna_helix.glb',
    fileSizeFormatted: '4.8 MB',
    format: 'glb',
  },
  controlsConfig: {
    enableAutoRotate: true,
    defaultAutoRotate: true,
    autoRotateSpeed: 1.2,
    enableWireframeToggle: true,
    defaultWireframe: false,
    enableExplode: true,
    maxExplodeDistance: 2.5,
    enableClipping: true,
    clippingAxis: 'y',
    lightingPreset: 'lab',
    ambientLightIntensity: 1.2,
    directionalLightIntensity: 1.8,
    enableAnimations: false,
    defaultAnimationSpeed: 1.0,
    cameraPosition: [0, 2, 5],
    cameraTarget: [0, 0, 0],
    fov: 45,
    minZoomDistance: 1.5,
    maxZoomDistance: 15.0,
  },
  annotations: [
    {
      id: 'pin-1',
      title: 'Khung đường - photphat',
      description: 'Gồm các gốc đường đêoxiribôzơ liên kết với axit photphoric tạo nên bộ khung bền vững ở mặt ngoài.',
      position: [0.8, 1.2, 0.5],
      color: '#0D9488',
    },
    {
      id: 'pin-2',
      title: 'Cặp bazơ nitơ trung tâm',
      description: 'Các bazơ nitơ hướng vào trong liên kết theo nguyên tắc bổ sung.',
      position: [0, 0, 0],
      color: '#0284C7',
    },
  ],
  scientificExplanation: {
    overview: 'Năm 1953, James Watson và Francis Crick đã công bố mô hình cấu trúc không gian của phân tử ADN.',
    keyPoints: [
      { title: 'Kích thước chuẩn', content: 'Đường kính vòng xoắn 2 nm, chu kỳ xoắn 3.4 nm gồm 10 cặp nuclêôtit.' },
    ],
    realWorldApplication: 'Là cơ sở cho công nghệ xét nghiệm ADN, giải mã bộ gen người và giám định pháp y.',
  },
  discoveryQuestions: [
    {
      id: 'q1',
      question: 'Theo nguyên tắc bổ sung, một đoạn mạch có trình tự -A-T-G-X- thì mạch đối diện sẽ là gì?',
      options: [
        { id: 'a', text: '-T-A-X-G-', isCorrect: true },
        { id: 'b', text: '-A-T-G-X-', isCorrect: false },
        { id: 'c', text: '-U-A-X-G-', isCorrect: false },
      ],
      explanation: 'Chính xác! A liên kết với T, T liên kết với A, G liên kết với X, X liên kết với G.',
    },
  ],
  relatedLessonIds: ['khtn-9-bai-8'],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  author: 'Thầy Hoàng KHTN',
};

test('Valid manifest passes validation completely', () => {
  const result = validateSimulationManifest(validManifestSample);
  assert.equal(result.isValid, true);
  assert.equal(result.errors.length, 0);
  assert.equal(result.sanitized?.id, 'sim-dna-double-helix');
  assert.equal(result.sanitized?.version, '1.0.0');
});

test('Rejects invalid semantic version format', () => {
  const invalid = { ...validManifestSample, version: 'v1.0' };
  const result = validateSimulationManifest(invalid);
  assert.equal(result.isValid, false);
  assert.ok(result.errors.some((e) => e.includes('Semantic Versioning')));
});

test('Rejects missing modelAsset for declarative_glb mode', () => {
  const invalid: any = { ...validManifestSample, modelAsset: undefined };
  const result = validateSimulationManifest(invalid);
  assert.equal(result.isValid, false);
  assert.ok(result.errors.some((e) => e.includes('modelAsset')));
});

test('Rejects malicious javascript: protocol in modelAsset.url', () => {
  const malicious = {
    ...validManifestSample,
    modelAsset: {
      url: 'javascript:alert(1)',
      fileName: 'hack.glb',
      fileSizeFormatted: '1 MB',
      format: 'glb' as const,
    },
  };
  const result = validateSimulationManifest(malicious);
  assert.equal(result.isValid, false);
  assert.ok(result.errors.some((e) => e.includes('không an toàn')));
});

test('Rejects invalid grade outside THCS 6-9 range', () => {
  const invalid: any = { ...validManifestSample, grade: 11 };
  const result = validateSimulationManifest(invalid);
  assert.equal(result.isValid, false);
  assert.ok(result.errors.some((e) => e.includes('grade')));
});

test('Rejects discovery question without exactly 1 correct answer', () => {
  const invalid = {
    ...validManifestSample,
    discoveryQuestions: [
      {
        id: 'q1',
        question: 'Câu hỏi test?',
        options: [
          { id: 'a', text: 'Sai 1', isCorrect: false },
          { id: 'b', text: 'Sai 2', isCorrect: false },
        ],
        explanation: 'Giải thích',
      },
    ],
  };
  const result = validateSimulationManifest(invalid);
  assert.equal(result.isValid, false);
  assert.ok(result.errors.some((e) => e.includes('đáp án chính xác')));
});

test('Sanitizes HTML/XSS tags inside title and summary', () => {
  const withTags = {
    ...validManifestSample,
    title: '<script>alert("xss")</script>Cấu trúc tế bào',
    summary: '<b>In đậm</b> và mô tả chi tiết.',
  };
  const result = validateSimulationManifest(withTags);
  assert.equal(result.isValid, true);
  assert.ok(!result.sanitized?.title.includes('<script>'));
  assert.equal(result.sanitized?.title, 'scriptalert("xss")/scriptCấu trúc tế bào');
});

test('Clamps controlsConfig values to safe defined bounds', () => {
  const extremeControls = {
    ...validManifestSample,
    controlsConfig: {
      ...validManifestSample.controlsConfig,
      autoRotateSpeed: 999, // Should clamp to max 5.0
      maxExplodeDistance: -10, // Should clamp to min 0.5
      fov: 180, // Should clamp to max 90
    },
  };
  const result = validateSimulationManifest(extremeControls);
  assert.equal(result.isValid, true);
  assert.equal(result.sanitized?.controlsConfig.autoRotateSpeed, 5.0);
  assert.equal(result.sanitized?.controlsConfig.maxExplodeDistance, 0.5);
  assert.equal(result.sanitized?.controlsConfig.fov, 90);
});
