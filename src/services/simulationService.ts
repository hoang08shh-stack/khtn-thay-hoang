import { supabase, isSupabaseConfigured } from '../lib/supabase.ts';
import { SimulationManifest } from '../types/simulationManifest.ts';
import { validateSimulationManifest } from '../utils/manifestValidator.ts';
import { formatBytes, MAX_FILE_SIZE_BYTES } from './storageService.ts';

const LOCAL_STORAGE_KEY_SIMULATIONS = 'khtn_admin_simulations_v4';

/**
 * Initial educational seed simulations (GDPT 2018)
 */
export const SEED_SIMULATIONS: SimulationManifest[] = [
  {
    schemaVersion: '1.0.0',
    id: 'sim-water-molecule',
    slug: 'cau-tao-phan-tu-nuoc-h2o',
    title: 'Cấu Tạo Phân Tử Nước (H₂O)',
    subtitle: 'Hình học gấp khúc 104.5° & Liên kết cộng hóa trị có cực',
    version: '1.2.0',
    mode: 'custom_tsx',
    status: 'published',
    grade: 7,
    domain: 'hoa-hoc',
    category: 'Cấu tạo chất & Phân tử vi mô',
    difficulty: 'Cơ bản',
    curriculumCode: 'GDPT 2018 - KHTN 7 (Chủ đề 2: Phân tử - Đơn chất - Hợp chất)',
    tags: ['H₂O', 'Liên kết cộng hóa trị', 'Phân tử', 'VSEPR', 'Độ âm điện'],
    thumbnailUrl: 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?auto=format&fit=crop&w=800&q=80',
    summary:
      'Khám phá không gian 3D cấu tạo phân tử nước (H₂O) gồm 1 nguyên tử Oxy và 2 nguyên tử Hydro liên kết dạng gấp khúc 104.5°. Tìm hiểu lý do VSEPR ép góc liên kết và bản chất lưỡng cực điện của nước.',
    learningObjectives: [
      'Trình bày được thành phần phân tử nước gồm 1 nguyên tử Oxy và 2 nguyên tử Hydro (H₂O).',
      'Mô tả được dạng hình học phân tử nước là dạng gấp khúc với góc liên kết xấp xỉ 104.5°.',
      'Giải thích được bản chất liên kết cộng hóa trị có cực do chênh lệch độ âm điện giữa O và H (Δχ = 1.24).',
      'Phân biệt được mô hình Quả cầu & que nối với mô hình Không gian đặc (Space-filling).',
    ],
    keyConcepts: [
      {
        term: 'Liên kết cộng hóa trị có cực',
        definition: 'Liên kết mà cặp electron dùng chung bị lệch về phía nguyên tử có độ âm điện lớn hơn (Oxy).',
      },
      {
        term: 'Góc liên kết 104.5°',
        definition: 'Góc tạo bởi hai liên kết O-H trong không gian, bị co lại do lực đẩy của 2 cặp electron tự do trên Oxy.',
      },
      {
        term: 'Mômen lưỡng cực điện (μ = 1.85 D)',
        definition: 'Đại lượng đặc trưng cho độ phân cực của phân tử, hướng về phía nguyên tử Oxy mang điện tích âm cục bộ.',
      },
    ],
    controlsConfig: {
      enableAutoRotate: true,
      defaultAutoRotate: true,
      autoRotateSpeed: 1.0,
      enableWireframeToggle: false,
      defaultWireframe: false,
      enableExplode: false,
      maxExplodeDistance: 2.0,
      enableClipping: false,
      clippingAxis: 'y',
      lightingPreset: 'lab',
      ambientLightIntensity: 1.2,
      directionalLightIntensity: 1.5,
      enableAnimations: true,
      defaultAnimationSpeed: 1.0,
      cameraPosition: [0, 0, 4.5],
      cameraTarget: [0, 0, 0],
      fov: 45,
      minZoomDistance: 1.5,
      maxZoomDistance: 10.0,
    },
    annotations: [
      {
        id: 'pin-o',
        title: 'Nguyên tử Oxy (O)',
        description: 'Bán kính lớn hơn, độ âm điện cao (χ = 3.44), mang điện tích âm riêng phần (2δ⁻).',
        position: [0, 0.4, 0],
        color: '#EF4444',
      },
      {
        id: 'pin-h1',
        title: 'Nguyên tử Hydro thứ nhất (H₁)',
        description: 'Bán kính nhỏ hơn, độ âm điện thấp (χ = 2.20), mang điện tích dương riêng phần (δ⁺).',
        position: [-1.2, -0.6, 0],
        color: '#E2E8F0',
      },
      {
        id: 'pin-h2',
        title: 'Nguyên tử Hydro thứ hai (H₂)',
        description: 'Liên kết đơn O-H độ dài 95.84 pm, tạo góc 104.5° so với liên kết O-H₁.',
        position: [1.2, -0.6, 0],
        color: '#E2E8F0',
      },
    ],
    scientificExplanation: {
      overview:
        'Nước (H₂O) là hợp chất phân cực mạnh có hình học gấp khúc, mang các tính chất sinh học và hóa học đặc biệt bảo đảm sự sống.',
      keyPoints: [
        {
          title: 'Thuyết VSEPR',
          content: 'Oxy lai hóa sp³ có 2 cặp e liên kết và 2 cặp e tự do; lực đẩy của các cặp e tự do ép góc liên kết xuống 104.5°.',
        },
        {
          title: 'Mômen lưỡng cực',
          content: 'Tổng hợp 2 vector phân cực của liên kết O-H tạo nên vector lưỡng cực phân tử hướng về phía Oxy.',
        },
      ],
      realWorldApplication:
        'Tính phân cực giúp nước hòa tan muối khoáng trong dịch tế bào và duy trì sự sống của sinh vật trên Trái Đất.',
    },
    discoveryQuestions: [
      {
        id: 'q1',
        question: 'Tại sao góc liên kết H-O-H trong phân tử nước (104.5°) lại nhỏ hơn góc tứ diện đều (109.5°)?',
        options: [
          { id: 'a', text: 'Do 2 cặp electron tự do của Oxy chiếm thể tích lớn và đẩy ép góc liên kết lại.', isCorrect: true },
          { id: 'b', text: 'Do Oxy hút electron quá yếu làm 2 nguyên tử H tự do chuyển động.', isCorrect: false },
          { id: 'c', text: 'Do hai nguyên tử Hydro mang điện tích trái dấu hút nhau.', isCorrect: false },
        ],
        explanation: 'Theo thuyết VSEPR, 2 cặp electron tự do trên O chiếm không gian lớn và đẩy mạnh 2 liên kết O-H co lại còn 104.5°.',
      },
    ],
    relatedLessonIds: ['khtn-7-bai-2'],
    createdAt: '2026-03-01T08:00:00Z',
    updatedAt: '2026-03-01T08:00:00Z',
    author: 'Thầy Hoàng KHTN',
  },
  {
    schemaVersion: '1.0.0',
    id: 'sim-dna-double-helix',
    slug: 'cau-truc-dna-xoan-kep',
    title: 'Mô Hình Không Gian DNA Xoắn Kép (Watson - Crick)',
    subtitle: 'Chuỗi xoắn kép 2 mạch song song ngược chiều & Cặp bazơ nitơ bổ sung',
    version: '1.0.0',
    mode: 'declarative_glb',
    status: 'published',
    grade: 9,
    domain: 'sinh-hoc',
    category: 'Di truyền & Sinh học phân tử',
    difficulty: 'Trung bình',
    curriculumCode: 'GDPT 2018 - KHTN 9 (Chủ đề 8: Di truyền học)',
    tags: ['DNA', 'Watson-Crick', 'Nuclêôtit', 'A-T', 'G-X', 'Gen'],
    thumbnailUrl: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=800&q=80',
    summary:
      'Mô hình 3D xoắn kép DNA theo tỷ lệ chuẩn: đường kính vòng xoắn 2nm, chiều cao 1 chu kỳ 3.4nm gồm 10 cặp nuclêôtit liên kết theo nguyên tắc bổ sung A-T và G-X.',
    learningObjectives: [
      'Trình bày được cấu tạo không gian của phân tử ADN gồm 2 mạch pôlinuclêôtit xoắn quanh trục.',
      'Giải thích nguyên tắc bổ sung giữa các cặp bazơ nitơ: A liên kết với T bằng 2 liên kết hydro, G liên kết với X bằng 3 liên kết hydro.',
      'Nhận biết ý nghĩa của cấu trúc tự nhân đôi bán bảo tồn trong bảo toàn thông tin di truyền.',
    ],
    keyConcepts: [
      {
        term: 'Nguyên tắc bổ sung',
        definition: 'Quy luật kết cặp đặc hiệu giữa các bazơ nitơ: A luôn liên kết với T, G luôn liên kết với X qua liên kết hydro.',
      },
      {
        term: 'Chu kỳ xoắn',
        definition: 'Mỗi chu kỳ xoắn dài 34 Å (3.4 nm), gồm 10 cặp nuclêôtit với đường kính vòng xoắn 20 Å (2 nm).',
      },
    ],
    modelAsset: {
      url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/DNA/glTF-Binary/DNA.glb',
      fileName: 'dna_watson_crick_v1.glb',
      fileSizeFormatted: '3.2 MB',
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
      ambientLightIntensity: 1.1,
      directionalLightIntensity: 1.6,
      enableAnimations: true,
      defaultAnimationSpeed: 1.0,
      cameraPosition: [0, 2, 5],
      cameraTarget: [0, 0, 0],
      fov: 45,
      minZoomDistance: 1.5,
      maxZoomDistance: 15.0,
    },
    annotations: [
      {
        id: 'pin-backbone',
        title: 'Khung đường Đêoxiribôzơ - Axit Photphoric',
        description: 'Tạo thành cột sống bên ngoài của phân tử, liên kết cộng hóa trị photphodieste bền vững.',
        position: [1.1, 1.2, 0.4],
        color: '#0D9488',
      },
      {
        id: 'pin-basepair',
        title: 'Cặp bazơ nitơ bổ sung (A-T & G-X)',
        description: 'Hướng vào phía trong lòng chuỗi xoắn kép, giữ 2 mạch bằng các liên kết hydro yếu dễ tháo xoắn khi nhân đôi.',
        position: [0, 0.2, 0],
        color: '#0284C7',
      },
      {
        id: 'pin-major-groove',
        title: 'Rãnh lớn (Major Groove)',
        description: 'Khoảng hở rộng trên bề mặt DNA cho phép các prôtêin điều hòa và enzym phiên mã nhận biết trình tự gen.',
        position: [-0.9, -1.0, 0.5],
        color: '#F59E0B',
      },
    ],
    scientificExplanation: {
      overview:
        'Phân tử axit đêoxiribônuclêic (ADN) mang vật chất di truyền của hầu hết các sinh vật sống trên Trái Đất. Khám phá mô hình xoắn kép năm 1953 đã mở ra kỷ nguyên sinh học phân tử hiện đại.',
      keyPoints: [
        {
          title: 'Nguyên tắc đa phân',
          content: 'ADN cấu tạo theo nguyên tắc đa phân, đơn phân là 4 loại nuclêôtit: A, T, G, X (hoặc C).',
        },
        {
          title: 'Tính bền vững & Linh hoạt',
          content: 'Hàng triệu liên kết hydro cộng gộp tạo cấu trúc bền, nhưng có thể tách rời dễ dàng dưới tác dụng của enzym helicase.',
        },
      ],
      realWorldApplication:
        'Ứng dụng trong phân tích ADN huyết thống, công nghệ chỉnh sửa gen CRISPR, vaccine mRNA, và xét nghiệm y học chuẩn đoán sớm.',
    },
    discoveryQuestions: [
      {
        id: 'q1',
        question: 'Một đoạn mạch DNA có trình tự bazơ nitơ: 5\'-A-T-G-X-T-3\'. Trình tự mạch bổ sung tương ứng là:',
        options: [
          { id: 'a', text: '3\'-T-A-X-G-A-5\'', isCorrect: true },
          { id: 'b', text: '3\'-A-T-G-X-T-5\'', isCorrect: false },
          { id: 'c', text: '3\'-U-A-X-G-A-5\'', isCorrect: false },
          { id: 'd', text: '3\'-T-T-G-G-A-5\'', isCorrect: false },
        ],
        explanation: 'Chính xác! Theo nguyên tắc bổ sung A liên kết với T, T liên kết với A, G liên kết với X, X liên kết với G.',
      },
      {
        id: 'q2',
        question: 'Cặp bazơ nitơ Guanin (G) và Xitôzin (X) liên kết với nhau bằng bao nhiêu liên kết hydro?',
        options: [
          { id: 'a', text: '1 liên kết hydro', isCorrect: false },
          { id: 'b', text: '2 liên kết hydro', isCorrect: false },
          { id: 'c', text: '3 liên kết hydro', isCorrect: true },
          { id: 'd', text: '4 liên kết hydro', isCorrect: false },
        ],
        explanation: 'Đúng! Cặp G-X liên kết bằng 3 liên kết hydro, do đó bền hơn cặp A-T (chỉ có 2 liên kết hydro).',
      },
    ],
    relatedLessonIds: ['khtn-9-bai-4'],
    createdAt: '2026-03-05T09:00:00Z',
    updatedAt: '2026-03-05T09:00:00Z',
    author: 'Thầy Hoàng KHTN',
  },
  {
    schemaVersion: '1.0.0',
    id: 'sim-plant-cell',
    slug: 'cau-tao-te-bao-thuc-vat-luc-lap',
    title: 'Cấu Trúc Tế Bào Thực Vật & Bào Quan Lục Lạp',
    subtitle: 'Thành xenlulôzơ, không bào trung tâm và bộ máy quang hợp 3D',
    version: '1.1.0',
    mode: 'declarative_glb',
    status: 'published',
    grade: 6,
    domain: 'sinh-hoc',
    category: 'Tế bào - Đơn vị cơ sở của sự sống',
    difficulty: 'Cơ bản',
    curriculumCode: 'GDPT 2018 - KHTN 6 (Chủ đề 6: Tế bào)',
    tags: ['Tế bào thực vật', 'Lục lạp', 'Quang hợp', 'Thành tế bào', 'Không bào'],
    thumbnailUrl: 'https://images.unsplash.com/photo-1530595467537-0b5996c41f2d?auto=format&fit=crop&w=800&q=80',
    summary:
      'Mô hình giải phẫu cắt lớp tế bào thực vật: khám phá thành tế bào vững chắc, màng sinh chất, chất tế bào, nhân điều khiển, không bào dự trữ lớn và lục lạp thực hiện quang hợp.',
    learningObjectives: [
      'Chỉ ra và gọi tên được các thành phần chính của tế bào thực vật trên mô hình 3D.',
      'Nêu được điểm khác biệt chính giữa tế bào thực vật và tế bào động vật (có thành xenlulôzơ, lục lạp, không bào lớn).',
      'Giải thích được vai trò quang hợp của bào quan lục lạp.',
    ],
    keyConcepts: [
      {
        term: 'Thành tế bào (Cell Wall)',
        definition: 'Lớp bảo vệ ngoài cùng cấu tạo từ xenlulôzơ giúp tế bào thực vật giữ hình dạng cố định.',
      },
      {
        term: 'Lục lạp (Chloroplast)',
        definition: 'Bào quan chứa chất diệp lục hấp thụ ánh sáng mặt trời để tổng hợp chất hữu cơ qua quang hợp.',
      },
    ],
    modelAsset: {
      url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/BrainStem/glTF-Binary/BrainStem.glb',
      fileName: 'plant_cell_anatomy.glb',
      fileSizeFormatted: '5.4 MB',
      format: 'glb',
    },
    controlsConfig: {
      enableAutoRotate: true,
      defaultAutoRotate: true,
      autoRotateSpeed: 0.8,
      enableWireframeToggle: true,
      defaultWireframe: false,
      enableExplode: true,
      maxExplodeDistance: 2.2,
      enableClipping: true,
      clippingAxis: 'z',
      lightingPreset: 'studio',
      ambientLightIntensity: 1.3,
      directionalLightIntensity: 1.5,
      enableAnimations: false,
      defaultAnimationSpeed: 1.0,
      cameraPosition: [0, 2.5, 4.5],
      cameraTarget: [0, 0, 0],
      fov: 45,
      minZoomDistance: 1.2,
      maxZoomDistance: 12.0,
    },
    annotations: [
      {
        id: 'pin-wall',
        title: 'Thành tế bào (Cell Wall)',
        description: 'Vỏ xenlulôzơ cứng cáp bao bọc, bảo vệ và nâng đỡ toàn bộ cơ thể thực vật đứng vững.',
        position: [1.3, 0.8, 0],
        color: '#10B981',
      },
      {
        id: 'pin-chloroplast',
        title: 'Bào quan Lục lạp (Chloroplast)',
        description: 'Chứa hạt diệp lục hấp thu photon ánh sáng, chuyển hóa CO₂ và H₂O thành đường glucôzơ và khí O₂.',
        position: [0.6, -0.5, 0.7],
        color: '#059669',
      },
      {
        id: 'pin-nucleus',
        title: 'Nhân tế bào (Nucleus)',
        description: 'Chứa chất nhiễm sắc và ADN, là trung tâm chỉ huy mọi hoạt động sống và phân chia tế bào.',
        position: [-0.4, 0.3, -0.2],
        color: '#6366F1',
      },
      {
        id: 'pin-vacuole',
        title: 'Không bào trung tâm lớn (Vacuole)',
        description: 'Chứa dịch tế bào gồm nước, đường, muối khoáng và sắc tố, duy trì áp suất thẩm thấu căng mọng của lá.',
        position: [-0.6, -0.6, 0.4],
        color: '#06B6D4',
      },
    ],
    scientificExplanation: {
      overview:
        'Tế bào là đơn vị cơ bản cấu tạo nên mọi cơ thể sống. Tế bào thực vật có những cấu trúc độc đáo giúp chúng tự dưỡng quang hợp và tạo nên sự đa dạng sinh thái.',
      keyPoints: [
        {
          title: '3 đặc điểm phân biệt',
          content: 'Tế bào thực vật khác tế bào động vật ở 3 đặc điểm: có thành xenlulôzơ bên ngoài, có lục lạp quang hợp, và có không bào trung tâm rất lớn.',
        },
      ],
      realWorldApplication:
        'Lục lạp của thực vật là cỗ máy sinh học cung cấp toàn bộ oxy cho khí quyển và lương thực cho chuỗi thức ăn trên Trái Đất.',
    },
    discoveryQuestions: [
      {
        id: 'q1',
        question: 'Bào quan nào sau đây CHỈ CÓ ở tế bào thực vật mà KHÔNG CÓ ở tế bào động vật?',
        options: [
          { id: 'a', text: 'Nhân tế bào', isCorrect: false },
          { id: 'b', text: 'Lục lạp', isCorrect: true },
          { id: 'c', text: 'Màng sinh chất', isCorrect: false },
          { id: 'd', text: 'Ti thể', isCorrect: false },
        ],
        explanation: 'Chính xác! Lục lạp là bào quan đặc trưng cho cơ thể thực vật giúp chúng tự tổng hợp chất dinh dưỡng nhờ quang hợp.',
      },
    ],
    relatedLessonIds: ['khtn-6-bai-2'],
    createdAt: '2026-03-08T10:00:00Z',
    updatedAt: '2026-03-08T10:00:00Z',
    author: 'Thầy Hoàng KHTN',
  },
  {
    schemaVersion: '1.0.0',
    id: 'sim-electric-motor',
    slug: 'dong-co-dien-mot-chieu-luc-tu',
    title: 'Cấu Tạo Động Cơ Điện 1 Chiều (DC Motor) & Lực Điện Từ',
    subtitle: 'Khung dây dẫn quay trong từ trường của nam châm & Cổ góp đổi chiều dòng điện',
    version: '1.0.0',
    mode: 'declarative_glb',
    status: 'published',
    grade: 9,
    domain: 'vat-li',
    category: 'Điện từ học & Ứng dụng kỹ thuật',
    difficulty: 'Nâng cao',
    curriculumCode: 'GDPT 2018 - KHTN 9 (Chủ đề: Điện từ học)',
    tags: ['Động cơ điện', 'Lực từ', 'Từ trường', 'Cổ góp', 'Quy tắc bàn tay trái'],
    thumbnailUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
    summary:
      'Mô phỏng động cơ điện 1 chiều: quan sát cặp lực từ tác dụng lên 2 cạnh đối diện của khung dây dẫn theo quy tắc bàn tay trái, vai trò của cổ góp chổi quét để khung quay liên tục.',
    learningObjectives: [
      'Chỉ ra được hai bộ phận chính của động cơ điện một chiều: nam châm tạo từ trường (stato) và khung dây dẫn (roto).',
      'Vận dụng quy tắc bàn tay trái xác định chiều của lực điện từ tác dụng lên đoạn dây dẫn.',
      'Giải thích được tác dụng của bộ góp điện (cổ góp và chổi quét) trong việc đảo chiều dòng điện.',
    ],
    keyConcepts: [
      {
        term: 'Quy tắc bàn tay trái',
        definition: 'Đặt bàn tay trái sao cho các đường sức từ hướng vào lòng bàn tay, chiều từ cổ tay đến ngón giữa là chiều dòng điện, ngón cái choãi 90° chỉ chiều lực từ.',
      },
      {
        term: 'Cổ góp điện',
        definition: 'Gồm hai vành bán nguyệt cách điện giúp đổi chiều dòng điện trong khung dây mỗi nửa vòng quay để mômen quay luôn cùng chiều.',
      },
    ],
    modelAsset: {
      url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/BoomBox/glTF-Binary/BoomBox.glb',
      fileName: 'electric_dc_motor.glb',
      fileSizeBytes: 3120000,
      format: 'glb',
      uploadedAt: '2026-03-10T14:00:00Z',
    },
    controlsConfig: {
      enableAutoRotate: false,
      defaultAutoRotate: false,
      autoRotateSpeed: 1.0,
      enableWireframeToggle: true,
      defaultWireframe: false,
      enableExplode: true,
      maxExplodeDistance: 2.8,
      enableClipping: false,
      clippingAxis: 'x',
      lightingPreset: 'studio',
      ambientLightIntensity: 1.2,
      directionalLightIntensity: 1.6,
      enableAnimations: true,
      defaultAnimationSpeed: 1.0,
      cameraPosition: [2, 2, 4],
      cameraTarget: [0, 0, 0],
      fov: 45,
      minZoomDistance: 1.5,
      maxZoomDistance: 12.0,
    },
    annotations: [
      {
        id: 'pin-magnet',
        title: 'Nam châm vĩnh cửu (Stato)',
        description: 'Tạo từ trường đều giữa cực Bắc (N) và cực Nam (S), các đường sức từ đi từ cực N sang cực S.',
        position: [-1.4, 0.4, 0],
        color: '#DC2626',
      },
      {
        id: 'pin-coil',
        title: 'Khung dây dẫn quay (Roto)',
        description: 'Khung dây bằng đồng có dòng điện chạy qua, chịu tác dụng của cặp lực từ ngược chiều làm khung quay.',
        position: [0, 0.5, 0],
        color: '#F59E0B',
      },
      {
        id: 'pin-commutator',
        title: 'Bộ góp điện (Cổ góp & Chổi than)',
        description: 'Đổi chiều dòng điện trong khung dây khi khung vượt qua vị trí mặt phẳng trung hòa, giúp khung quay liên tục 1 chiều.',
        position: [0.8, -0.6, 0.3],
        color: '#0D9488',
      },
    ],
    scientificExplanation: {
      overview:
        'Động cơ điện là thiết bị chuyển hóa điện năng thành cơ năng dựa trên tác dụng của từ trường lên khung dây dẫn có dòng điện chạy qua.',
      keyPoints: [
        {
          title: 'Cơ chế quay liên tục',
          content: 'Nếu không có cổ góp, khung dây chỉ quay nửa vòng rồi dừng lại ở vị trí cân bằng. Nhờ cổ góp đảo chiều đúng lúc, lực từ luôn duy trì mômen quay theo một chiều duy nhất.',
        },
      ],
      realWorldApplication:
        'Động cơ điện được ứng dụng trong quạt máy, xe đạp điện, máy bơm nước, tàu điện ngầm và các robot tự động hóa trong công nghiệp.',
    },
    discoveryQuestions: [
      {
        id: 'q1',
        question: 'Khi đổi chiều dòng điện chạy vào động cơ điện một chiều thì hiện tượng gì sẽ xảy ra?',
        options: [
          { id: 'a', text: 'Động cơ đổi chiều quay.', isCorrect: true },
          { id: 'b', text: 'Động cơ lập tức bị dừng lại và bốc cháy.', isCorrect: false },
          { id: 'c', text: 'Động cơ vẫn quay cùng chiều như cũ.', isCorrect: false },
        ],
        explanation: 'Chính xác! Theo quy tắc bàn tay trái, khi đổi chiều dòng điện thì chiều của lực điện từ đảo ngược, khiến động cơ quay theo chiều ngược lại.',
      },
    ],
    relatedLessonIds: ['khtn-8-bai-8'],
    createdAt: '2026-03-10T14:00:00Z',
    updatedAt: '2026-03-10T14:00:00Z',
    author: 'Thầy Hoàng KHTN',
  },
  {
    schemaVersion: '1.0.0',
    id: 'sim-earth-layers',
    slug: 'cau-truc-cac-tang-dia-chat-trai-dat',
    title: 'Cấu Trúc Các Tầng Địa Chất & Trọng Lực Trái Đất',
    subtitle: 'Vỏ Trái Đất, Lớp Manti, Nhân ngoài lỏng & Nhân trong kim loại đặc',
    version: '1.0.0',
    mode: 'declarative_glb',
    status: 'draft', // Draft mode for testing admin view vs student view
    grade: 6,
    domain: 'trai-dat-vu-tru',
    category: 'Trái Đất & Bầu trời',
    difficulty: 'Cơ bản',
    curriculumCode: 'GDPT 2018 - KHTN 6 (Chủ đề 10: Trái Đất)',
    tags: ['Địa chất', 'Lớp Manti', 'Vỏ Trái Đất', 'Nhân Trái Đất', 'Kiến tạo mảng'],
    thumbnailUrl: 'https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?auto=format&fit=crop&w=800&q=80',
    summary:
      'Mô hình cắt lớp 1/4 Trái Đất: quan sát tầng vỏ Trái Đất mỏng (5-70km), lớp Manti quánh dẻo sinh ra dòng đối lưu dịch chuyển các mảng kiến tạo, và nhân kim loại sắt-niken nhiệt độ cao.',
    learningObjectives: [
      'Xác định được 3 lớp chính cấu tạo nên Trái Đất: Vỏ Trái Đất, Lớp Manti và Nhân Trái Đất.',
      'Giải thích sơ lược nguyên nhân gây ra động đất và núi lửa do sự chuyển động của các mảng kiến tạo trên lớp Manti trên.',
    ],
    keyConcepts: [
      {
        term: 'Vỏ Trái Đất',
        definition: 'Lớp đá cứng ngoài cùng mỏng nhất, nơi sinh sống của sinh vật và thực vật.',
      },
      {
        term: 'Lớp Manti',
        definition: 'Chiếm hơn 80% thể tích Trái Đất, vật chất ở trạng thái quánh dẻo với các dòng đối lưu nhiệt.',
      },
      {
        term: 'Nhân Trái Đất',
        definition: 'Gồm nhân ngoài thể lỏng (tạo ra từ trường Trái Đất) và nhân trong thể rắn chịu áp suất khổng lồ.',
      },
    ],
    modelAsset: {
      url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/Duck/glTF-Binary/Duck.glb',
      fileName: 'earth_geological_layers.glb',
      fileSizeBytes: 1850000,
      format: 'glb',
      uploadedAt: '2026-03-10T14:30:00Z',
    },
    controlsConfig: {
      enableAutoRotate: true,
      defaultAutoRotate: true,
      autoRotateSpeed: 0.6,
      enableWireframeToggle: false,
      defaultWireframe: false,
      enableExplode: true,
      maxExplodeDistance: 2.5,
      enableClipping: true,
      clippingAxis: 'y',
      lightingPreset: 'warm',
      ambientLightIntensity: 1.0,
      directionalLightIntensity: 1.6,
      enableAnimations: false,
      defaultAnimationSpeed: 1.0,
      cameraPosition: [0, 2, 4.5],
      cameraTarget: [0, 0, 0],
      fov: 45,
      minZoomDistance: 1.5,
      maxZoomDistance: 12.0,
    },
    annotations: [
      {
        id: 'pin-crust',
        title: 'Vỏ Trái Đất (Crust)',
        description: 'Độ dày từ 5km (dưới đại dương) đến 70km (dưới lục địa), chủ yếu là đá granit và bazan.',
        position: [1.8, 0.4, 0],
        color: '#10B981',
      },
      {
        id: 'pin-mantle',
        title: 'Lớp Manti (Mantle)',
        description: 'Dày khoảng 2,900km, nhiệt độ từ 1,000°C đến 3,700°C, áp suất cực lớn sinh ra nham thạch macma.',
        position: [1.0, 0.1, 0.2],
        color: '#F97316',
      },
      {
        id: 'pin-core',
        title: 'Nhân Trái Đất (Core)',
        description: 'Bán kính khoảng 3,400km, cấu tạo chính bởi Sắt và Niken, nhiệt độ vùng trung tâm lên tới 5,000°C.',
        position: [0.1, 0, 0],
        color: '#EAB308',
      },
    ],
    scientificExplanation: {
      overview:
        'Cấu trúc nhiều lớp của Trái Đất được hình thành từ hàng tỷ năm trước do sự phân dị trọng lực của các nguyên tố nặng lắng xuống tâm.',
      keyPoints: [
        {
          title: 'Từ trường Trái Đất',
          content: 'Dòng đối lưu của sắt nóng chảy ở nhân ngoài tạo ra hiệu ứng dynamo sinh ra từ trường bảo vệ Trái Đất khỏi gió Mặt Trời.',
        },
      ],
      realWorldApplication:
        'Hiểu các tầng địa chất giúp các nhà khoa học dự báo động đất, núi lửa và thăm dò các mỏ khoáng sản quý.',
    },
    discoveryQuestions: [
      {
        id: 'q1',
        question: 'Lớp nào của Trái Đất chiếm thể tích lớn nhất (trên 80% thể tích toàn cầu)?',
        options: [
          { id: 'a', text: 'Vỏ Trái Đất', isCorrect: false },
          { id: 'b', text: 'Lớp Manti', isCorrect: true },
          { id: 'c', text: 'Nhân trong', isCorrect: false },
          { id: 'd', text: 'Thạch quyển', isCorrect: false },
        ],
        explanation: 'Chính xác! Lớp Manti dày khoảng 2,900 km và chiếm hơn 80% thể tích của toàn bộ quả địa cầu.',
      },
    ],
    relatedLessonIds: ['khtn-6-bai-10'],
    createdAt: '2026-03-12T16:00:00Z',
    updatedAt: '2026-03-12T16:00:00Z',
    author: 'Thầy Hoàng KHTN',
  },
];

/**
 * Get stored simulations (localStorage fallback for demo/Cloudflare Pages)
 */
function getLocalSimulations(): SimulationManifest[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY_SIMULATIONS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Failed to parse local simulations:', err);
  }
  // Initialize with seed data
  localStorage.setItem(LOCAL_STORAGE_KEY_SIMULATIONS, JSON.stringify(SEED_SIMULATIONS));
  return SEED_SIMULATIONS;
}

function saveLocalSimulations(sims: SimulationManifest[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY_SIMULATIONS, JSON.stringify(sims));
  } catch (err) {
    console.error('Failed to save simulations locally:', err);
  }
}

/**
 * Fetch all simulations.
 * - If includeDrafts is false (default, for students), only returns status === 'published'.
 * - If includeDrafts is true (for teachers/admins), returns all simulations.
 */
export async function fetchSimulations(includeDrafts = false): Promise<SimulationManifest[]> {
  // If Supabase is connected
  if (isSupabaseConfigured && supabase) {
    try {
      let query = supabase.from('simulations').select('*');
      if (!includeDrafts) {
        query = query.eq('status', 'published');
      }
      const { data, error } = await query.order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        return data.map((row: any) => {
          if (row.manifest_data) {
            return {
              ...row.manifest_data,
              id: row.id,
              slug: row.slug || row.manifest_data.slug,
              title: row.title || row.manifest_data.title,
              status: row.status || row.manifest_data.status,
            };
          }
          return row;
        });
      }
    } catch (err) {
      console.warn('Supabase simulations fetch failed, falling back to local storage:', err);
    }
  }

  // Local fallback
  const all = getLocalSimulations();
  if (includeDrafts) {
    return all;
  }
  return all.filter((s) => s.status === 'published');
}

/**
 * Fetch a simulation by ID or Slug
 */
export async function fetchSimulationByIdOrSlug(
  idOrSlug: string,
  includeDrafts = false
): Promise<SimulationManifest | null> {
  const all = await fetchSimulations(includeDrafts);
  return all.find((s) => s.id === idOrSlug || s.slug === idOrSlug) || null;
}

/**
 * Save / Update a simulation (Admin only)
 */
export async function saveSimulation(
  manifest: SimulationManifest
): Promise<{ success: boolean; error?: string; data?: SimulationManifest }> {
  // 1. Validate manifest
  const validation = validateSimulationManifest(manifest);
  if (!validation.isValid) {
    return {
      success: false,
      error: validation.errors.join(' | '),
    };
  }

  const cleanManifest = validation.sanitized!;

  // 2. Save to Supabase if configured
  if (isSupabaseConfigured && supabase) {
    try {
      const payload = {
        id: cleanManifest.id,
        slug: cleanManifest.slug,
        title: cleanManifest.title,
        subtitle: cleanManifest.subtitle,
        version: cleanManifest.version,
        mode: cleanManifest.mode,
        status: cleanManifest.status,
        grade: cleanManifest.grade,
        domain: cleanManifest.domain,
        category: cleanManifest.category,
        difficulty: cleanManifest.difficulty,
        curriculum_code: cleanManifest.curriculumCode,
        summary: cleanManifest.summary,
        thumbnail_url: cleanManifest.thumbnailUrl,
        model_url: cleanManifest.modelAsset?.url || null,
        manifest_data: cleanManifest,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase.from('simulations').upsert(payload);
      if (error) {
        console.warn('Supabase simulation upsert error, falling back to local storage:', error.message);
      }
    } catch (err: any) {
      console.warn('Supabase upsert failed:', err);
    }
  }

  // 3. Always update local storage
  const current = getLocalSimulations();
  const index = current.findIndex((s) => s.id === cleanManifest.id);
  let updatedList: SimulationManifest[];
  if (index >= 0) {
    updatedList = [...current];
    updatedList[index] = cleanManifest;
  } else {
    updatedList = [cleanManifest, ...current];
  }
  saveLocalSimulations(updatedList);

  return {
    success: true,
    data: cleanManifest,
  };
}

/**
 * Delete a simulation (Admin only)
 */
export async function deleteSimulation(id: string): Promise<{ success: boolean; error?: string }> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase.from('simulations').delete().eq('id', id);
      if (error) console.warn('Supabase delete error:', error.message);
    } catch (err) {
      console.warn('Supabase delete failed:', err);
    }
  }

  const current = getLocalSimulations();
  const filtered = current.filter((s) => s.id !== id);
  saveLocalSimulations(filtered);

  return { success: true };
}

/**
 * Quick toggle publish status (Admin only)
 */
export async function toggleSimulationPublish(id: string, isPublished: boolean): Promise<boolean> {
  const current = getLocalSimulations();
  const target = current.find((s) => s.id === id);
  if (!target) return false;

  const updated: SimulationManifest = {
    ...target,
    status: isPublished ? 'published' : 'draft',
    updatedAt: new Date().toISOString(),
  };

  const res = await saveSimulation(updated);
  return res.success;
}

/**
 * Upload a 3D model (.glb / .gltf) to Supabase Storage
 * Strict validation: max 50MB, allowed extensions
 */
export async function upload3DModel(
  file: File,
  simId: string,
  onProgress?: (percent: number) => void
): Promise<{ url: string; sizeFormatted: string; format: 'glb' | 'gltf'; path: string }> {
  if (!file) {
    throw new Error('Chưa chọn tệp 3D.');
  }

  // Check 50MB limit
  if (file.size > MAX_FILE_SIZE_BYTES) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
    throw new Error(
      `Tệp 3D dung lượng ${sizeMB} MB vượt quá giới hạn 50 MB của gói Supabase Free. Vui lòng nén mesh hoặc textures.`
    );
  }

  // Check extension
  const ext = file.name.split('.').pop()?.toLowerCase();
  if (ext !== 'glb' && ext !== 'gltf') {
    throw new Error(`Định dạng .${ext} không hợp lệ. Chỉ chấp nhận tệp 3D chuẩn .glb hoặc .gltf.`);
  }

  const sizeFormatted = formatBytes(file.size);

  // If local / preview mode
  if (!isSupabaseConfigured || !supabase) {
    if (onProgress) {
      onProgress(30);
      await new Promise((r) => setTimeout(r, 150));
      onProgress(70);
      await new Promise((r) => setTimeout(r, 150));
      onProgress(100);
    }
    const mockUrl = URL.createObjectURL(file);
    return {
      url: mockUrl,
      sizeFormatted,
      format: ext as 'glb' | 'gltf',
      path: `simulations/${simId}/${file.name}`,
    };
  }

  // Upload to Supabase Storage bucket 'science-assets' or 'lesson-documents'
  try {
    if (onProgress) onProgress(20);
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `3d-models/${simId}/${Date.now()}_${cleanFileName}`;

    if (onProgress) onProgress(50);

    const { data, error } = await supabase.storage
      .from('science-assets')
      .upload(storagePath, file, {
        cacheControl: '86400',
        upsert: true,
      });

    if (error) {
      throw new Error(error.message);
    }

    if (onProgress) onProgress(90);

    const { data: urlData } = supabase.storage
      .from('science-assets')
      .getPublicUrl(data.path);

    if (onProgress) onProgress(100);

    return {
      url: urlData.publicUrl,
      sizeFormatted,
      format: ext as 'glb' | 'gltf',
      path: data.path,
    };
  } catch (err: any) {
    console.error('Failed to upload 3D model to storage:', err);
    throw new Error(err.message || 'Lỗi khi tải tệp mô hình 3D lên Supabase Storage.');
  }
}
