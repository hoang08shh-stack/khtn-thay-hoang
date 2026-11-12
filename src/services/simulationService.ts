import { supabase, isSupabaseConfigured } from '../lib/supabase.ts';
import { SimulationManifest } from '../types/simulationManifest.ts';
import { DEFAULT_CONTROLS_CONFIG, validateSimulationManifest } from '../utils/manifestValidator.ts';
import { uploadScienceAsset } from './storageService.ts';

const domainChemImg = '/assets/images/domain_chemistry_bright_1793629233529.jpg';
const domainPhysImg = '/assets/images/domain_physics_bright_1793629235212.jpg';
const domainBioImg = '/assets/images/domain_biology_bright_1793629236067.jpg';

const LOCAL_STORAGE_KEY_SIMS = 'khtn_simulations_manifests_v4';

export const SEED_SIMULATIONS: SimulationManifest[] = [
  {
    schemaVersion: '1.0.0',
    id: 'sim-khuc-xa-anh-sang-3d',
    slug: 'khuc-xa-anh-sang-3d-khtn-9',
    title: 'Khúc Xạ Ánh Sáng 3D Rõ Nét - KHTN 9',
    subtitle: 'Đo góc tới i, góc khúc xạ r, góc phản xạ i\' bằng tia Laser đồng nhất & Mini-game Săn Ngọc',
    version: '1.0.0',
    mode: 'external_embed',
    externalUrl: '/assets/aistudio/Kh_c_x___nh_s_ng_3bf52125.html',
    status: 'published',
    grade: 9,
    domain: 'vat-li',
    category: 'Ánh sáng & Quang hình học',
    difficulty: 'Cơ bản',
    curriculumCode: 'Kết nối tri thức - KHTN 9 (Bài 4: Khúc xạ ánh sáng - Định luật Snell)',
    tags: ['Khúc xạ ánh sáng', 'Định luật Snell', 'Góc tới i', 'Góc khúc xạ r', 'Tia Laser 3D', 'Săn ngọc'],
    thumbnailUrl: domainPhysImg,
    summary: 'Mô phỏng 3D trực quan hiện tượng khúc xạ ánh sáng khi truyền qua mặt phân cách giữa hai môi trường trong suốt (Không khí, Nước pha lê, Thủy tinh, Kim cương) kèm đĩa đo độ 360°, Mini-game Săn Ngọc dưới đáy bể và 10 câu hỏi trắc nghiệm tương tác.',
    learningObjectives: [
      'Thực hiện thí nghiệm 3D khảo sát đường truyền của tia tới SI, tia khúc xạ IK và tia phản xạ IR tại mặt phân cách P - Q.',
      'Vận dụng định luật khúc xạ ánh sáng Snell: n₁ · sin(i) = n₂ · sin(r) để so sánh góc tới i và góc khúc xạ r.',
    ],
    keyConcepts: [
      { term: 'Hiện tượng khúc xạ ánh sáng', definition: 'Hiện tượng tia sáng truyền từ môi trường trong suốt này sang môi trường trong suốt khác bị gãy khúc tại mặt phân cách giữa hai môi trường.' },
      { term: 'Định luật Snell', definition: 'n₁ · sin(i) = n₂ · sin(r). Khi n₁ < n₂ thì r < i (tia khúc xạ lệch gần pháp tuyến); khi n₁ > n₂ thì r > i (tia khúc xạ lệch xa pháp tuyến).' },
    ],
    controlsConfig: DEFAULT_CONTROLS_CONFIG,
    annotations: [],
    scientificExplanation: {
      overview: 'Khi tia sáng truyền xiên góc từ không khí (n₁ = 1,00) vào nước (n₂ = 1,33), tốc độ ánh sáng giảm làm tia khúc xạ bị bẻ cong lại gần pháp tuyến N - N\' hơn (r < i).',
      keyPoints: [
        { title: '3 Chế độ học tập tích hợp', content: 'Tab 1: Thí nghiệm đo góc 3D; Tab 2: Mini-game Săn Ngọc dưới đáy bể; Tab 3: Bài tập luyện tập 10 câu chấm điểm tự động.' },
      ],
      realWorldApplication: 'Giải thích hiện tượng chiếc đũa/ống hút cắm trong cốc nước như bị gãy khúc tại mặt nước và cách ngắm bắt cá dưới nước.',
    },
    discoveryQuestions: [
      {
        id: 'dq-refract-3d-1',
        question: 'Khi chiếu tia sáng từ không khí (n₁ = 1,0) vào nước (n₂ = 1,33) với góc tới i = 45°, góc khúc xạ r có giá trị như thế nào?',
        options: [
          { id: 'a', text: 'r ≈ 32,0° (nhỏ hơn góc tới i vì tia khúc xạ lệch lại gần pháp tuyến)', isCorrect: true },
          { id: 'b', text: 'r = 45,0° (bằng góc tới i)', isCorrect: false },
          { id: 'c', text: 'r ≈ 60,0° (lớn hơn góc tới i)', isCorrect: false },
        ],
        explanation: 'Theo định luật Snell: sin(r) = (1,0 / 1,333) × sin(45°) ⇒ r ≈ 32,0° < i.',
      },
    ],
    relatedLessonIds: ['khtn-9-bai-4'],
    createdAt: '2025-02-26T08:00:00.000Z',
    updatedAt: '2025-02-26T08:00:00.000Z',
    author: 'KHOA HỌC SỐ KHTN',
  },
  {
    schemaVersion: '1.0.0',
    id: 'sim-phan-xa-toan-phan-3d',
    slug: 'phan-xa-toan-phan-cap-quang-3d-khtn-9',
    title: 'Phản Xạ Toàn Phần & Cáp Quang 3D - KHTN 9',
    subtitle: 'Khảo sát góc tới giới hạn i_gh (sin i_gh = n₂ / n₁), bản bán trụ thủy tinh & truyền dẫn cáp quang',
    version: '1.0.0',
    mode: 'external_embed',
    externalUrl: '/assets/aistudio/Ph_n_x__to_n_ph_n_2acb5007.html',
    status: 'published',
    grade: 9,
    domain: 'vat-li',
    category: 'Ánh sáng & Quang hình học',
    difficulty: 'Trung bình',
    curriculumCode: 'Kết nối tri thức - KHTN 9 (Bài 5: Phản xạ toàn phần & Ứng dụng cáp quang)',
    tags: ['Phản xạ toàn phần', 'Góc giới hạn i_gh', 'Cáp quang', 'Bản bán trụ', 'Kim cương', 'KHTN 9'],
    thumbnailUrl: domainPhysImg,
    summary: 'Khảo sát điều kiện xảy ra hiện tượng phản xạ toàn phần khi ánh sáng truyền từ môi trường chiết quang hơn (thủy tinh, nước, kim cương) sang môi trường chiết quang kém hơn với góc tới i ≥ i_gh. Tích hợp Mini-game Truyền Cáp Quang và 10 câu hỏi trắc nghiệm.',
    learningObjectives: [
      'Xác định được hai điều kiện để xảy ra phản xạ toàn phần: n₁ > n₂ và góc tới i ≥ i_gh.',
      'Tính được góc tới giới hạn theo công thức sin(i_gh) = n₂ / n₁ và giải thích nguyên lí truyền ánh sáng trong sợi cáp quang.',
    ],
    keyConcepts: [
      { term: 'Góc giới hạn phản xạ toàn phần (i_gh)', definition: 'Khi sin(i_gh) = n₂ / n₁ (với n₁ > n₂), tia khúc xạ đi sát mặt phân cách (r = 90°). Khi i ≥ i_gh, 100% tia sáng bị phản xạ ngược lại.' },
      { term: 'Cáp quang học', definition: 'Sợi quang có lõi chiết suất n₁ lớn hơn vỏ bọc n₂ giúp xung ánh sáng phản xạ toàn phần liên tiếp truyền dữ liệu Internet tốc độ cao.' },
    ],
    controlsConfig: DEFAULT_CONTROLS_CONFIG,
    annotations: [],
    scientificExplanation: {
      overview: 'Khi chiếu tia Laser từ bản bán trụ thủy tinh (n₁ = 1,50) ra không khí (n₂ = 1,00), góc giới hạn là i_gh ≈ 41,8°. Với mọi góc tới i ≥ 41,8°, tia khúc xạ biến mất hoàn toàn.',
      keyPoints: [
        { title: 'Nút đặt nhanh góc giới hạn i = i_gh', content: 'Bấm nút Đặt đúng i = i_gh trên bảng điều khiển để quan sát trạng thái chuyển tiếp trước khi phản xạ toàn phần 100%.' },
      ],
      realWorldApplication: 'Ứng dụng chế tạo cáp quang viễn thông Internet xuyên đại dương, ống nội soi dạ dày y học và giác cắt kim cương lấp lánh.',
    },
    discoveryQuestions: [
      {
        id: 'dq-tir-3d-1',
        question: 'Khi tia sáng truyền từ thủy tinh (n₁ = 1,5) ra không khí (n₂ = 1,0), góc giới hạn phản xạ toàn phần i_gh xấp xỉ bằng bao nhiêu?',
        options: [
          { id: 'a', text: 'i_gh ≈ 41,8° (với sin i_gh = 1 / 1,5 = 2/3)', isCorrect: true },
          { id: 'b', text: 'i_gh = 30,0°', isCorrect: false },
          { id: 'c', text: 'i_gh = 60,0°', isCorrect: false },
        ],
        explanation: 'Chính xác! sin(i_gh) = n₂ / n₁ = 1,0 / 1,5 = 2/3 ≈ 0,667 ⇒ i_gh ≈ 41,8°.',
      },
    ],
    relatedLessonIds: ['khtn-9-bai-4'],
    createdAt: '2025-02-26T08:10:00.000Z',
    updatedAt: '2025-02-26T08:10:00.000Z',
    author: 'KHOA HỌC SỐ KHTN',
  },
  {
    schemaVersion: '1.0.0',
    id: 'sim-lang-kinh-tan-sac-3d',
    slug: 'lang-kinh-tan-sac-anh-sang-3d-hinh-7-5',
    title: 'Lăng Kính & Tán Sắc Ánh Sáng 3D (Hình 7.5 KHTN 9)',
    subtitle: 'Phân tách chùm ánh sáng trắng qua lăng kính tam giác thành dải quang phổ 7 màu Đỏ - Da cam - Vàng - Lục - Lam - Chàm - Tím',
    version: '1.0.0',
    mode: 'external_embed',
    externalUrl: '/assets/aistudio/L_ng_k_nh_d88b6c2d.html',
    status: 'published',
    grade: 9,
    domain: 'vat-li',
    category: 'Ánh sáng & Quang hình học',
    difficulty: 'Trung bình',
    curriculumCode: 'Kết nối tri thức - KHTN 9 (Hình 7.5: Tán sắc ánh sáng qua lăng kính)',
    tags: ['Lăng kính 3D', 'Tán sắc ánh sáng', 'Hình 7.5 KHTN 9', 'Quang phổ 7 màu', 'Ánh sáng trắng', 'Cầu vồng'],
    thumbnailUrl: domainPhysImg,
    summary: 'Mô phỏng 3D chuẩn Hình 7.5 SGK KHTN 9: chiếu chùm ánh sáng trắng hoặc tia Laser đỏ đơn sắc qua lăng kính tam giác, quan sát sự phân tách thành dải 7 màu biến thiên liên tục trên màn hứng, kèm Mini-game Bắt Màu và 10 câu hỏi trắc nghiệm.',
    learningObjectives: [
      'Giải thích được thí nghiệm tán sắc ánh sáng trắng của Newton qua lăng kính (Hình 7.5 SGK KHTN 9).',
      'So sánh được góc lệch của các tia sáng đơn sắc qua lăng kính: tia Đỏ lệch ít nhất (n_đỏ nhỏ nhất), tia Tím lệch nhiều nhất (n_tím lớn nhất).',
    ],
    keyConcepts: [
      { term: 'Tán sắc ánh sáng', definition: 'Sự phân tách một chùm ánh sáng phức tạp (như ánh sáng trắng) thành các chùm sáng đơn sắc khác nhau khi đi qua lăng kính.' },
      { term: 'Thứ tự 7 màu quang phổ', definition: 'Đỏ (lệch ít nhất) – Da cam – Vàng – Lục – Lam – Chàm – Tím (lệch nhiều nhất về phía đáy lăng kính).' },
    ],
    controlsConfig: DEFAULT_CONTROLS_CONFIG,
    annotations: [],
    scientificExplanation: {
      overview: 'Chiết suất của thủy tinh lăng kính tăng dần từ màu đỏ đến màu tím (n_đỏ < n_cam < n_vàng < n_lục < n_lam < n_chàm < n_tím), khiến các tia đơn sắc bị bẻ lệch với các góc khác nhau.',
      keyPoints: [
        { title: 'Đối chứng Ánh sáng trắng & Laser đơn sắc', content: 'Chuyển đổi giữa Chùm ánh sáng trắng (tạo dải 7 màu) và Tia Laser đỏ đơn sắc (chỉ lệch về phía đáy, không bị tán sắc).' },
      ],
      realWorldApplication: 'Giải thích hiện tượng cầu vồng rực rỡ xuất hiện sau cơn mưa và chế tạo máy quang phổ phân tích thành phần nguồn sáng.',
    },
    discoveryQuestions: [
      {
        id: 'dq-prism-3d-1',
        question: 'Khi chiếu chùm ánh sáng trắng qua lăng kính (Hình 7.5), tia sáng màu nào bị lệch ít nhất và tia sáng màu nào bị lệch nhiều nhất về phía đáy lăng kính?',
        options: [
          { id: 'a', text: 'Tia Đỏ lệch ít nhất; Tia Tím lệch nhiều nhất', isCorrect: true },
          { id: 'b', text: 'Tia Tím lệch ít nhất; Tia Đỏ lệch nhiều nhất', isCorrect: false },
          { id: 'c', text: 'Tia Lục lệch ít nhất; Tia Vàng lệch nhiều nhất', isCorrect: false },
        ],
        explanation: 'Chính xác! Chiết suất của lăng kính đối với ánh sáng đỏ là nhỏ nhất (lệch ít nhất) và đối với ánh sáng tím là lớn nhất (lệch nhiều nhất).',
      },
    ],
    relatedLessonIds: ['khtn-9-bai-4'],
    createdAt: '2025-02-26T08:20:00.000Z',
    updatedAt: '2025-02-26T08:20:00.000Z',
    author: 'KHOA HỌC SỐ KHTN',
  },
  {
    schemaVersion: '1.0.0',
    id: 'sim-thau-kinh-3d',
    slug: 'mo-hinh-thau-kinh-hoi-tu-phan-ki-3d-khtn-9',
    title: 'Mô Hình Thấu Kính Hội Tụ & Phân Kì 3D - KHTN 9',
    subtitle: 'Đường truyền 3 tia sáng đặc biệt, dựng ảnh thật - ảnh ảo qua Thấu kính Hội tụ (rìa mỏng) & Phân kì (rìa dày)',
    version: '1.0.0',
    mode: 'external_embed',
    externalUrl: '/assets/aistudio/Th_u_k_nh_82cbc246.html',
    status: 'published',
    grade: 9,
    domain: 'vat-li',
    category: 'Ánh sáng & Quang hình học',
    difficulty: 'Trung bình',
    curriculumCode: 'Kết nối tri thức - KHTN 9 (Bài 6 & Bài 7: Thấu kính hội tụ, Thấu kính phân kì & Kính lúp)',
    tags: ['Thấu kính hội tụ', 'Thấu kính phân kì', 'Tiêu cự f', 'Ảnh thật', 'Ảnh ảo', 'Kính lúp', 'KHTN 9'],
    thumbnailUrl: domainPhysImg,
    summary: 'Khảo sát trực quan 3D hình dạng tiết diện và sự tạo ảnh của vật sáng AB qua Thấu kính Hội tụ (rìa mỏng) và Thấu kính Phân kì (rìa dày). Điều chỉnh tiêu cự f, khoảng cách vật d, chiều cao h, thực hành Mini-game Lấy Nét Máy Chiếu và làm 10 câu trắc nghiệm.',
    learningObjectives: [
      'Phân biệt được Thấu kính Hội tụ (phần rìa mỏng hơn phần giữa) và Thấu kính Phân kì (phần rìa dày hơn phần giữa).',
      'Vẽ và giải thích được đường truyền của 3 tia sáng đặc biệt qua quang tâm O, song song trục chính Δ và qua tiêu điểm F.',
      'Xác định được tính chất ảnh (thật/ảo, cùng chiều/ngược chiều, lớn hơn/nhỏ hơn vật) theo vị trí đặt vật d so với tiêu cự f.',
    ],
    keyConcepts: [
      { term: 'Thấu kính Hội tụ (TKHT - Rìa mỏng)', definition: 'Khi d > f cho ảnh thật ngược chiều hứng được trên màn (d > 2f: ảnh nhỏ hơn vật; d = 2f: ảnh bằng vật; f < d < 2f: ảnh lớn hơn vật). Khi d < f cho ảnh ảo cùng chiều, lớn hơn vật (Kính lúp).' },
      { term: 'Thấu kính Phân kì (TKPK - Rìa dày)', definition: 'Với mọi vị trí đặt vật trước thấu kính phân kì, luôn cho ảnh ảo, cùng chiều, nhỏ hơn vật và nằm trong khoảng tiêu cự.' },
    ],
    controlsConfig: DEFAULT_CONTROLS_CONFIG,
    annotations: [],
    scientificExplanation: {
      overview: 'Vị trí ảnh d\' và chiều cao ảnh h\' tuân theo công thức thấu kính: 1/f = 1/d + 1/d\' (hay d\' = d·f / (d - f)) và số phóng đại ảnh k = |h\'/h| = |d\'/d|.',
      keyPoints: [
        { title: 'Tương tác 2 loại thấu kính & 2 chế độ tia sáng', content: 'Chuyển đổi linh hoạt giữa Thấu kính Hội tụ / Phân kì, chế độ Vật sáng ngọn nến AB (3 tia đặc biệt) hoặc Chùm tia song song trục chính.' },
      ],
      realWorldApplication: 'Ứng dụng trong chế tạo kính lúp, máy ảnh, máy chiếu phim, kính hiển vi, kính thiên văn và kính đeo mắt khắc phục tật cận thị, viễn thị.',
    },
    discoveryQuestions: [
      {
        id: 'dq-lens-3d-1',
        question: 'Đặt một vật sáng trước Thấu kính Hội tụ có tiêu cự f = 12 cm ở vị trí cách thấu kính một khoảng d = 24 cm (d = 2f). Ảnh thu được có tính chất nào?',
        options: [
          { id: 'a', text: 'Ảnh thật, ngược chiều với vật, cách thấu kính d\' = 24 cm và cao bằng vật', isCorrect: true },
          { id: 'b', text: 'Ảnh ảo, cùng chiều và lớn gấp đôi vật', isCorrect: false },
          { id: 'c', text: 'Ảnh ở vô cực', isCorrect: false },
        ],
        explanation: 'Chính xác! Khi d = 2f = 24 cm thì d\' = (24 × 12) / (24 - 12) = 24 cm, ảnh thật ngược chiều và cao bằng đúng vật.',
      },
    ],
    relatedLessonIds: ['khtn-9-bai-4'],
    createdAt: '2025-02-26T08:30:00.000Z',
    updatedAt: '2025-02-26T08:30:00.000Z',
    author: 'KHOA HỌC SỐ KHTN',
  },
  {
    schemaVersion: '1.0.0',
    id: 'sim-oil-reservoir-3d',
    slug: 'mo-phong-3d-mo-dau-va-phan-tu-chat-luu',
    title: 'Mô Phỏng 3D Mỏ Dầu & Phân Tử Trong Các Lớp Chất Lưu',
    subtitle: 'Cấu tạo bẫy dầu khí 3D (Đá chắn, Đá chứa) và cấu trúc phân tử Khí mỏ dầu, Dầu thô, Nước vỉa',
    version: '1.0.0',
    mode: 'external_embed',
    externalUrl: '/assets/aistudio/M__ph_ng_3D_m__d_u_v__ph_n_t__trong_c_c_l_p_ch_t_l_u__1__ac609d1f.html',
    status: 'published',
    grade: 9,
    domain: 'hoa-hoc',
    category: 'Nhiên liệu hóa thạch & Dầu mỏ - Khí thiên nhiên',
    difficulty: 'Trung bình',
    curriculumCode: 'Kết nối tri thức - KHTN 9 (Khai thác nhiên liệu hóa thạch: Dầu mỏ và Khí mỏ dầu)',
    tags: ['Mỏ dầu 3D', 'Bẫy dầu khí', 'Dầu thô', 'Khí mỏ dầu', 'Methane CH₄', 'Octane C₈H₁₈', 'Đá chứa', 'Đá chắn'],
    thumbnailUrl: domainChemImg,
    summary: 'Khám phá trực quan 3D cấu tạo địa chất mỏ dầu (đá chắn, đá chứa, sự phân tầng khí – dầu – nước theo khối lượng riêng) và nhấp vào từng lớp chất lưu để quan sát mô hình phân tử 3D chuyển động (CH₄, C₂H₆, C₃H₈, C₄H₁₀, C₈H₁₈, C₆H₁₂, C₆H₆, C₁₀H₈, H₂O, Na⁺, Cl⁻) kèm bài kiểm tra Quiz tương tác.',
    learningObjectives: [
      'Mô tả được cấu tạo bẫy dầu khí gồm đá chứa có lỗ rỗng, đá chắn có độ thấm rất thấp và sự phân lớp Khí mỏ dầu – Dầu thô – Nước vỉa.',
      'Nhận biết được thành phần phân tử chính của khí mỏ dầu (chủ yếu Methane CH₄), dầu thô (hỗn hợp Hydrocarbon: Alkane, Cycloalkane, Arene) và nước vỉa (H₂O hòa tan Na⁺, Cl⁻).',
    ],
    keyConcepts: [
      { term: 'Đá chứa & Đá chắn', definition: 'Dầu, khí và nước nằm trong các lỗ rỗng, khe nứt nhỏ của đá chứa xốp; phía trên là lớp đá chắn có độ thấm rất thấp ngăn dầu khí thoát lên trên.' },
      { term: 'Ba lớp chất lưu (Khí – Dầu – Nước)', definition: 'Do chênh lệch khối lượng riêng, khí mỏ dầu nằm ở tầng trên cùng, dầu thô ở giữa và nước vỉa (nước mặn chứa Na⁺, Cl⁻) nằm ở tầng dưới.' },
      { term: 'Thành phần phân tử Dầu mỏ & Khí mỏ dầu', definition: 'Khí mỏ dầu chứa chủ yếu CH₄ (kèm C₂H₆, C₃H₈, C₄H₁₀); Dầu thô là hỗn hợp phức tạp của Alkane (C₈H₁₈), Cycloalkane (C₆H₁₂), Arene (C₆H₆, C₁₀H₈) và lượng nhỏ hợp chất S, N, O.' },
    ],
    controlsConfig: DEFAULT_CONTROLS_CONFIG,
    annotations: [],
    scientificExplanation: {
      overview: 'Dầu mỏ không nằm trong các hang trống khổng lồ dưới lòng đất mà tồn tại trong hệ thống lỗ rỗng và khe nứt vi mô của đá chứa, được giữ lại bởi lớp đá chắn không thấm ở phía trên.',
      keyPoints: [
        { title: 'Tương tác trực tiếp 5 bước học tập', content: 'Sử dụng nút Tiếp theo / Quay lại, điều chỉnh độ trong suốt đất đá và nhấp trực tiếp vào lớp Khí, Dầu hoặc Nước để mở cửa sổ phân tử 3D.' },
      ],
      realWorldApplication: 'Ứng dụng trong thăm dò địa chất dầu khí, khai thác dầu thô bằng phương pháp bơm ép nước/khí và chưng cất phân đoạn dầu mỏ.',
    },
    discoveryQuestions: [
      {
        id: 'dq-oil-1',
        question: 'Dầu mỏ chủ yếu tồn tại ở đâu trong tầng chứa dưới lòng đất?',
        options: [
          { id: 'a', text: 'Trong hệ thống lỗ rỗng và khe nứt nhỏ của đá chứa xốp', isCorrect: true },
          { id: 'b', text: 'Trong một hang trống lớn dưới lòng đất', isCorrect: false },
          { id: 'c', text: 'Trong lớp đất bề mặt', isCorrect: false },
        ],
        explanation: 'Chính xác! Dầu, khí và nước nằm trong các lỗ rỗng và khe nứt nhỏ của đá chứa chứ không phải trong một hang rỗng lớn.',
      },
      {
        id: 'dq-oil-2',
        question: 'Thành phần chính chiếm tỉ lệ lớn nhất của khí mỏ dầu là chất nào?',
        options: [
          { id: 'a', text: 'Methane (CH₄)', isCorrect: true },
          { id: 'b', text: 'Sodium chloride (NaCl)', isCorrect: false },
          { id: 'c', text: 'Khí Oxygen (O₂)', isCorrect: false },
        ],
        explanation: 'Chính xác! Khí mỏ dầu chủ yếu là Methane (CH₄), kèm theo Ethane (C₂H₆), Propane (C₃H₈) và Butane (C₄H₁₀).',
      },
    ],
    relatedLessonIds: ['khtn-9-bai-24'],
    createdAt: '2025-02-25T08:00:00.000Z',
    updatedAt: '2025-02-25T08:00:00.000Z',
    author: 'KHOA HỌC SỐ KHTN',
  },
  {
    schemaVersion: '1.0.0',
    id: 'sim-chemical-equation-3d',
    slug: 'can-bang-phuong-trinh-hoa-hoc-3d',
    title: 'Cân Bằng Phương Trình Hóa Học 3D (Định Luật Bảo Toàn Khối Lượng)',
    subtitle: 'Tương tác phân tử 3D cân bằng hệ số nguyên tử trước và sau phản ứng theo chuẩn IUPAC',
    version: '1.0.0',
    mode: 'external_embed',
    externalUrl: 'https://c-n-b-ng-ph-ng-tr-nh-h-a-h-c-3d.ai.studio',
    status: 'published',
    grade: 8,
    domain: 'hoa-hoc',
    category: 'Phản ứng Hóa học & Định luật Bảo toàn Khối lượng',
    difficulty: 'Trung bình',
    curriculumCode: 'Kết nối tri thức - KHTN 8 (Bài 4 & Bài 5: Định luật bảo toàn khối lượng và Phương trình hóa học)',
    tags: ['Cân bằng PTHH', 'Bảo toàn khối lượng', 'Phản ứng hóa học', 'Hydrogen', 'Oxygen', 'IUPAC', '3D'],
    thumbnailUrl: domainChemImg,
    summary: 'Trực quan hóa quá trình cân bằng phương trình hóa học trong không gian 3D: điều chỉnh hệ số phân tử các chất tham gia và sản phẩm sao cho số nguyên tử của mỗi nguyên tố (Hydrogen, Oxygen, Carbon, Nitrogen, Iron, Copper...) được bảo toàn tuyệt đối.',
    learningObjectives: [
      'Nêu được khái niệm phương trình hóa học và ý nghĩa của hệ số tỉ lượng giữa các chất tham gia và sản phẩm.',
      'Vận dụng Định luật bảo toàn khối lượng để cân bằng số nguyên tử của mỗi nguyên tố ở hai vế phương trình.',
    ],
    keyConcepts: [
      { term: 'Định luật bảo toàn khối lượng', definition: 'Trong một phản ứng hóa học, tổng khối lượng của các chất sản phẩm bằng tổng khối lượng của các chất tham gia phản ứng.' },
      { term: 'Nguyên tắc cân bằng PTHH', definition: 'Số nguyên tử của mỗi nguyên tố trước và sau phản ứng luôn bằng nhau; chỉ đặt hệ số trước công thức hóa học, không thay đổi chỉ số nguyên tử.' },
    ],
    controlsConfig: DEFAULT_CONTROLS_CONFIG,
    annotations: [],
    scientificExplanation: {
      overview: 'Trong phản ứng hóa học, chỉ có liên kết giữa các nguyên tử thay đổi làm phân tử này biến đổi thành phân tử khác, còn số nguyên tử mỗi nguyên tố giữ nguyên không đổi.',
      keyPoints: [
        { title: 'Quy tắc 3 bước lập PTHH', content: 'Bước 1: Viết sơ đồ phản ứng; Bước 2: Cân bằng số nguyên tử mỗi nguyên tố; Bước 3: Viết phương trình hóa học hoàn chỉnh.' },
      ],
      realWorldApplication: 'Tính toán chính xác lượng nguyên liệu cần dùng và lượng sản phẩm thu được trong công nghiệp sản xuất Ammonia (NH₃), Sulfuric acid (H₂SO₄) và luyện kim.',
    },
    discoveryQuestions: [
      {
        id: 'dq-chem-eq-1',
        question: 'Khi cân bằng phương trình hóa học đốt cháy khí Hydrogen trong khí Oxygen tạo thành Nước: x H₂ + y O₂ → z H₂O, bộ hệ số tối giản (x, y, z) lần lượt là:',
        options: [
          { id: 'a', text: '2, 1, 2 (2H₂ + O₂ → 2H₂O)', isCorrect: true },
          { id: 'b', text: '1, 1, 1 (H₂ + O₂ → H₂O)', isCorrect: false },
          { id: 'c', text: '2, 2, 2 (2H₂ + 2O₂ → 2H₂O)', isCorrect: false },
        ],
        explanation: 'Chính xác! Với hệ số (2, 1, 2), cả hai vế đều có 4 nguyên tử Hydrogen (H) và 2 nguyên tử Oxygen (O).',
      },
    ],
    relatedLessonIds: ['khtn-8-bai-5-btkl', 'khtn-8-bai-5'],
    createdAt: '2025-02-22T08:00:00.000Z',
    updatedAt: '2025-02-22T08:00:00.000Z',
    author: 'KHOA HỌC SỐ KHTN',
  },
  {
    schemaVersion: '1.0.0',
    id: 'sim-atom-bohr',
    slug: 'nguyen-tu-rutherford-bohr',
    title: 'Mô hình Nguyên tử Rutherford - Bohr 3D (IUPAC)',
    subtitle: 'Tương tác hạt Proton, Neutron, Electron theo danh pháp quốc tế IUPAC',
    version: '1.0.0',
    mode: 'custom_tsx',
    status: 'published',
    grade: 7,
    domain: 'hoa-hoc',
    category: 'Nguyên tử & Bảng tuần hoàn',
    difficulty: 'Cơ bản',
    curriculumCode: 'Kết nối tri thức - KHTN 7 (Bài 2: Nguyên tử)',
    tags: ['Hydrogen', 'Carbon', 'Oxygen', 'Sodium', 'Chlorine', 'Bohr'],
    thumbnailUrl: domainChemImg,
    summary: 'Khảo sát cấu trúc nguyên tử Rutherford - Bohr của các nguyên tố Hydrogen (H), Helium (He), Carbon (C), Nitrogen (N), Oxygen (O), Sodium (Na), Chlorine (Cl) và sự phân bố Electron trên các lớp vỏ.',
    learningObjectives: [
      'Trình bày được mô hình nguyên tử Rutherford - Bohr gồm hạt nhân ở tâm và vỏ Electron.',
      'Đọc đúng tên nguyên tố theo chuẩn quốc tế IUPAC (Hydrogen, Carbon, Oxygen, Sodium, Chlorine...).',
    ],
    keyConcepts: [
      { term: 'Hạt nhân nguyên tử', definition: 'Gồm hạt Proton mang điện tích dương (+1) và hạt Neutron không mang điện.' },
      { term: 'Lớp vỏ Electron', definition: 'Các hạt Electron mang điện tích âm (-1) chuyển động xung quanh hạt nhân theo từng lớp K, L, M.' },
    ],
    controlsConfig: DEFAULT_CONTROLS_CONFIG,
    annotations: [],
    scientificExplanation: {
      overview: 'Nguyên tử trung hòa về điện nên số Proton trong hạt nhân luôn bằng số Electron ở lớp vỏ (Z = p = e).',
      keyPoints: [
        { title: 'Khối lượng nguyên tử (amu)', content: 'Khối lượng nguyên tử tập trung hầu hết ở hạt nhân: A ≈ p + n (amu).' },
      ],
      realWorldApplication: 'Giải thích tính chất hóa học đặc trưng của kim loại kiềm Sodium (Na) và phi kim Oxygen (O), Chlorine (Cl).',
    },
    discoveryQuestions: [
      {
        id: 'dq-atom-1',
        question: 'Nguyên tử Sodium (Na) có số đơn vị điện tích hạt nhân Z = 11. Sự phân bố Electron trên các lớp K, L, M của Sodium là:',
        options: [
          { id: 'a', text: '2 - 8 - 1 (3 lớp Electron, 1 Electron lớp ngoài cùng)', isCorrect: true },
          { id: 'b', text: '2 - 9 (2 lớp Electron)', isCorrect: false },
          { id: 'c', text: '2 - 8 - 2 (3 lớp Electron)', isCorrect: false },
        ],
        explanation: 'Chính xác! Lớp K chứa tối đa 2e, lớp L chứa tối đa 8e, còn lại 1e ở lớp ngoài cùng M.',
      },
    ],
    relatedLessonIds: ['b7-nguyen-tu'],
    createdAt: '2025-01-15T08:00:00.000Z',
    updatedAt: '2025-02-20T08:00:00.000Z',
    author: 'KHOA HỌC SỐ KHTN',
  },
  {
    schemaVersion: '1.0.0',
    id: 'sim-acid-base-ph',
    slug: 'chuan-do-acid-base-ph',
    title: 'Thí nghiệm Chuẩn độ Acid - Base & Thang đo pH',
    subtitle: 'Phản ứng trung hòa giữa Hydrochloric acid (HCl) và Sodium hydroxide (NaOH)',
    version: '1.0.0',
    mode: 'custom_tsx',
    status: 'published',
    grade: 8,
    domain: 'hoa-hoc',
    category: 'Acid - Base - pH - Oxide - Muối',
    difficulty: 'Trung bình',
    curriculumCode: 'Kết nối tri thức - KHTN 8 (Bài 8 & Bài 9: Acid - Base - Thang pH)',
    tags: ['Acid', 'Base', 'pH', 'Hydrochloric acid', 'Sodium hydroxide'],
    thumbnailUrl: domainChemImg,
    summary: 'Thực hành nhỏ từ từ dung dịch Sodium hydroxide (NaOH 0,1M) từ Buret vào bình tam giác chứa Hydrochloric acid (HCl 0,1M) và quan sát sự biến đổi giá trị pH cùng màu sắc chất chỉ thị.',
    learningObjectives: [
      'Phân biệt môi trường Acid (pH < 7), môi trường trung tính (pH = 7) và môi trường Base (pH > 7).',
      'Viết được phương trình hóa học của phản ứng trung hòa: HCl + NaOH → NaCl + H₂O.',
    ],
    keyConcepts: [
      { term: 'Acid (IUPAC)', definition: 'Hợp chất phân li trong nước tạo ra ion H⁺, làm quỳ tím hóa đỏ (pH < 7).' },
      { term: 'Base (IUPAC)', definition: 'Hợp chất phân li trong nước tạo ra ion OH⁻, làm quỳ tím hóa xanh và Phenolphthalein hóa hồng (pH > 7).' },
    ],
    controlsConfig: DEFAULT_CONTROLS_CONFIG,
    annotations: [],
    scientificExplanation: {
      overview: 'Khi nhỏ dung dịch Base (NaOH) vào dung dịch Acid (HCl), ion OH⁻ kết hợp với ion H⁺ tạo thành phân tử nước H₂O làm giá trị pH tăng dần.',
      keyPoints: [
        { title: 'Điểm tương đương (pH = 7.0)', content: 'Khi số mol NaOH bằng số mol HCl ban đầu, dung dịch thu được là muối Sodium chloride (NaCl) trung tính.' },
      ],
      realWorldApplication: 'Ứng dụng trong kiểm tra độ pH của đất trồng, nước sinh hoạt và xử lý nước thải công nghiệp.',
    },
    discoveryQuestions: [
      {
        id: 'dq-ph-1',
        question: 'Khi nhỏ dung dịch Sodium hydroxide (NaOH) dư vào cốc chứa dung dịch Hydrochloric acid (HCl) có pha sẵn vài giọt Phenolphthalein, màu của dung dịch chuyển đổi như thế nào?',
        options: [
          { id: 'a', text: 'Từ không màu chuyển sang màu hồng cánh sen (khi pH > 8,2)', isCorrect: true },
          { id: 'b', text: 'Từ màu hồng chuyển sang không màu', isCorrect: false },
          { id: 'c', text: 'Từ không màu chuyển sang màu vàng lục', isCorrect: false },
        ],
        explanation: 'Chính xác! Trong môi trường Acid và trung tính, Phenolphthalein không màu; khi NaOH dư (môi trường Base kiềm), Phenolphthalein chuyển sang màu hồng.',
      },
    ],
    relatedLessonIds: ['b8-acid-base-ph'],
    createdAt: '2025-01-18T08:00:00.000Z',
    updatedAt: '2025-02-20T08:00:00.000Z',
    author: 'KHOA HỌC SỐ KHTN',
  },
  {
    schemaVersion: '1.0.0',
    id: 'sim-electric-circuit',
    slug: 'mach-dien-dinh-luat-ohm',
    title: 'Phòng Lab Mạch Điện & Định Luật Ohm (I = U / R)',
    subtitle: 'Khảo sát sự phụ thuộc của cường độ dòng điện vào hiệu điện thế và điện trở',
    version: '1.0.0',
    mode: 'custom_tsx',
    status: 'published',
    grade: 9,
    domain: 'vat-li',
    category: 'Điện học & Định luật Ohm',
    difficulty: 'Trung bình',
    curriculumCode: 'Kết nối tri thức - KHTN 9 (Bài 8: Điện trở & Định luật Ohm)',
    tags: ['Ohm', 'Mạch điện', 'Ampe kế', 'Vôn kế', 'Công suất'],
    thumbnailUrl: domainPhysImg,
    summary: 'Thiết kế mạch điện thực nghiệm 3D với nguồn điện một chiều, khóa K, điện trở, bóng đèn dây tóc và đồng hồ đo vạn năng (Volt - Ampere - Watt).',
    learningObjectives: [
      'Phát biểu và vận dụng được hệ thức định luật Ohm: I = U / R.',
      'Tính được công suất điện tiêu thụ của bóng đèn theo công thức P = U × I.',
    ],
    keyConcepts: [
      { term: 'Định luật Ohm', definition: 'Cường độ dòng điện I (A) chạy qua đoạn dây dẫn tỉ lệ thuận với hiệu điện thế U (V) và tỉ lệ nghịch với điện trở R (Ω).' },
    ],
    controlsConfig: DEFAULT_CONTROLS_CONFIG,
    annotations: [],
    scientificExplanation: {
      overview: 'Khi tăng hiệu điện thế U hoặc giảm điện trở R của biến trở, cường độ dòng điện I chạy qua dây tóc bóng đèn tăng lên làm bóng đèn sáng mạnh hơn.',
      keyPoints: [
        { title: 'Công thức chuẩn', content: 'I = U / R và P = U × I = I² × R.' },
      ],
      realWorldApplication: 'Tính toán tiết diện dây dẫn Copper (Cu), thiết kế cầu chì và thiết bị chiếu sáng tiết kiệm năng lượng.',
    },
    discoveryQuestions: [
      {
        id: 'dq-ohm-1',
        question: 'Nếu giữ nguyên hiệu điện thế U = 12 V và tăng điện trở R từ 6 Ω lên 12 Ω thì cường độ dòng điện I trong mạch thay đổi như thế nào?',
        options: [
          { id: 'a', text: 'Giảm đi 2 lần (từ 2,0 A xuống 1,0 A)', isCorrect: true },
          { id: 'b', text: 'Tăng lên 2 lần (từ 2,0 A lên 4,0 A)', isCorrect: false },
          { id: 'c', text: 'Không thay đổi', isCorrect: false },
        ],
        explanation: 'Theo định luật Ohm I = U / R, khi R tăng gấp đôi và U không đổi thì I giảm đi một nửa.',
      },
    ],
    relatedLessonIds: ['b9-dinh-luat-ohm'],
    createdAt: '2025-01-20T08:00:00.000Z',
    updatedAt: '2025-02-20T08:00:00.000Z',
    author: 'KHOA HỌC SỐ KHTN',
  },
  {
    schemaVersion: '1.0.0',
    id: 'sim-light-refraction',
    slug: 'khuc-xa-anh-sang-snell',
    title: 'Quang Học: Khúc Xạ Ánh Sáng & Tán Sắc Qua Lăng Kính',
    subtitle: 'Định luật khúc xạ ánh sáng Snell và phản xạ toàn phần',
    version: '1.0.0',
    mode: 'custom_tsx',
    status: 'published',
    grade: 9,
    domain: 'vat-li',
    category: 'Ánh sáng & Quang hình học',
    difficulty: 'Trung bình',
    curriculumCode: 'Kết nối tri thức - KHTN 9 (Bài 4: Khúc xạ ánh sáng)',
    tags: ['Khúc xạ', 'Tán sắc', 'Snell', 'Laser', 'Quang học'],
    thumbnailUrl: domainPhysImg,
    summary: 'Chiếu tia Laser đơn sắc hoặc chùm ánh sáng trắng qua bản bán trụ trong suốt để đo góc tới i, góc khúc xạ r và quan sát dải quang phổ 7 màu.',
    learningObjectives: [
      'Hiểu hiện tượng khúc xạ ánh sáng khi truyền xiên góc qua mặt phân cách giữa hai môi trường.',
      'Giải thích hiện tượng tán sắc ánh sáng trắng thành dải màu cầu vồng.',
    ],
    keyConcepts: [
      { term: 'Định luật khúc xạ Snell', definition: 'n₁ · sin(i) = n₂ · sin(r), trong đó n₁, n₂ là chiết suất tuyệt đối của hai môi trường.' },
    ],
    controlsConfig: DEFAULT_CONTROLS_CONFIG,
    annotations: [],
    scientificExplanation: {
      overview: 'Khi tia sáng truyền từ không khí (n₁ = 1,0) vào thủy tinh (n₂ = 1,5), tia khúc xạ lệch lại gần pháp tuyến hơn so với tia tới (r < i).',
      keyPoints: [
        { title: 'Chiết suất môi trường', content: 'Chiết suất n = c / v đặc trưng cho tốc độ truyền ánh sáng trong môi trường đó.' },
      ],
      realWorldApplication: 'Chế tạo cáp quang học truyền dẫn Internet tốc độ cao, kính thiên văn, kính hiển vi và thấu kính máy ảnh.',
    },
    discoveryQuestions: [
      {
        id: 'dq-optics-1',
        question: 'Khi tia sáng truyền vuông góc với mặt phân cách giữa không khí và nước (góc tới i = 0°) thì góc khúc xạ r bằng bao nhiêu?',
        options: [
          { id: 'a', text: 'r = 0° (Tia sáng truyền thẳng không bị đổi hướng)', isCorrect: true },
          { id: 'b', text: 'r = 45°', isCorrect: false },
          { id: 'c', text: 'r = 90°', isCorrect: false },
        ],
        explanation: 'Khi i = 0° thì sin(i) = 0 ⇒ sin(r) = 0 ⇒ r = 0°, tia sáng truyền thẳng qua mặt phân cách.',
      },
    ],
    relatedLessonIds: ['b7-toc-do-anh-sang'],
    createdAt: '2025-01-22T08:00:00.000Z',
    updatedAt: '2025-02-20T08:00:00.000Z',
    author: 'KHOA HỌC SỐ KHTN',
  },
  {
    schemaVersion: '1.0.0',
    id: 'sim-microscope-cell',
    slug: 'kinh-hien-vi-te-bao',
    title: 'Kính Hiển Vi Quang Học 3D: Tế Bào Thực Vật & Động Vật',
    subtitle: 'Quan sát cấu trúc hiển vi của Lục lạp, Ti thể, Nhân tế bào chứa DNA và thành Cellulose',
    version: '1.0.0',
    mode: 'custom_tsx',
    status: 'published',
    grade: 6,
    domain: 'sinh-hoc',
    category: 'Tế bào học & Kính hiển vi',
    difficulty: 'Cơ bản',
    curriculumCode: 'Kết nối tri thức - KHTN 6 (Bài 18 & Bài 19: Tế bào)',
    tags: ['Tế bào', 'Lục lạp', 'Ti thể', 'Cellulose', 'DNA'],
    thumbnailUrl: domainBioImg,
    summary: 'Khám phá mô hình giải phẫu 3D tế bào thực vật và tế bào động vật. Bật/tắt từng bào quan để tìm hiểu chức năng quang hợp của lục lạp và hô hấp tế bào của ti thể.',
    learningObjectives: [
      'Nhận biết được 3 thành phần chính của tế bào: màng tế bào, tế bào chất và nhân tế bào.',
      'Phân biệt tế bào thực vật (có thành Cellulose, lục lạp, không bào lớn) và tế bào động vật.',
    ],
    keyConcepts: [
      { term: 'Lục lạp (Chloroplast)', definition: 'Bào quan chỉ có ở tế bào thực vật, chứa diệp lục hấp thụ ánh sáng để tổng hợp Glucose và giải phóng Oxygen.' },
    ],
    controlsConfig: DEFAULT_CONTROLS_CONFIG,
    annotations: [],
    scientificExplanation: {
      overview: 'Mọi cơ thể sinh vật (thực vật, động vật, con người, vi sinh vật) đều được cấu tạo từ những đơn vị nhỏ bé gọi là tế bào.',
      keyPoints: [
        { title: 'Nhân tế bào (Nucleus)', content: 'Chứa vật chất di truyền DNA điều khiển mọi hoạt động sống của tế bào.' },
      ],
      realWorldApplication: 'Ứng dụng trong nuôi cấy mô tế bào thực vật nhân giống cây trồng sạch bệnh năng suất cao.',
    },
    discoveryQuestions: [
      {
        id: 'dq-cell-1',
        question: 'Thành phần nào sau đây giúp tế bào thực vật có hình dạng đa giác cứng cáp và ổn định?',
        options: [
          { id: 'a', text: 'Thành tế bào bằng Cellulose bao bên ngoài màng sinh chất', isCorrect: true },
          { id: 'b', text: 'Ribosome trong chất tế bào', isCorrect: false },
          { id: 'c', text: 'Trung thể', isCorrect: false },
        ],
        explanation: 'Thành tế bào bằng Cellulose vững chắc quy định hình dạng cố định và bảo vệ tế bào thực vật.',
      },
    ],
    relatedLessonIds: ['b6-te-bao'],
    createdAt: '2025-01-25T08:00:00.000Z',
    updatedAt: '2025-02-20T08:00:00.000Z',
    author: 'KHOA HỌC SỐ KHTN',
  },
  {
    schemaVersion: '1.0.0',
    id: 'sim-dna-double-helix',
    slug: 'mo-hinh-dna-xoan-kep',
    title: 'Mô Hình Phân Tử DNA Xoắn Kép & Phiên Mã RNA 3D',
    subtitle: 'Cấu trúc không gian chuỗi xoắn kép Adenine - Thymine, Guanine - Cytosine',
    version: '1.0.0',
    mode: 'custom_tsx',
    status: 'published',
    grade: 9,
    domain: 'sinh-hoc',
    category: 'Di truyền học phân tử (DNA - RNA)',
    difficulty: 'Nâng cao',
    curriculumCode: 'Kết nối tri thức - KHTN 9 (Bài 36 & Bài 37: Nucleic acid và Gene)',
    tags: ['DNA', 'RNA', 'Nucleotide', 'Adenine', 'Thymine', 'Guanine', 'Cytosine'],
    thumbnailUrl: domainBioImg,
    summary: 'Tương tác 3D với cấu trúc phân tử Deoxyribonucleic acid (DNA) gồm hai mạch polynucleotide xoắn kép liên kết bổ sung (A - T, G - C) bằng liên kết Hydrogen.',
    learningObjectives: [
      'Mô tả được cấu trúc xoắn kép của DNA gồm 4 loại đơn phân Nucleotide: Adenine (A), Thymine (T), Guanine (G), Cytosine (C).',
      'Vận dụng nguyên tắc bổ sung để tính số lượng Nucleotide và số liên kết Hydrogen (H = 2A + 3G).',
    ],
    keyConcepts: [
      { term: 'Nguyên tắc bổ sung (DNA)', definition: 'Adenine (A) liên kết với Thymine (T) bằng 2 liên kết Hydrogen; Guanine (G) liên kết với Cytosine (C) bằng 3 liên kết Hydrogen.' },
    ],
    controlsConfig: DEFAULT_CONTROLS_CONFIG,
    annotations: [],
    scientificExplanation: {
      overview: 'Mỗi chu kì xoắn của phân tử DNA dài 3,4 nm (34 Å), gồm 10 cặp Nucleotide và có đường kính vòng xoắn là 2 nm (20 Å).',
      keyPoints: [
        { title: 'Công thức trọng tâm', content: 'N = 2A + 2G; Chiều dài L = (N / 2) × 3,4 Å; Liên kết Hydrogen H = 2A + 3G.' },
      ],
      realWorldApplication: 'Ứng dụng trong xét nghiệm huyết thống DNA, chẩn đoán bệnh di truyền và công nghệ gene hiện đại.',
    },
    discoveryQuestions: [
      {
        id: 'dq-dna-1',
        question: 'Trong phân tử DNA mạch kép, giữa Nucleotide loại Guanine (G) ở mạch này với Nucleotide loại Cytosine (C) ở mạch kia liên kết với nhau bằng mấy liên kết Hydrogen?',
        options: [
          { id: 'a', text: '3 liên kết Hydrogen', isCorrect: true },
          { id: 'b', text: '2 liên kết Hydrogen', isCorrect: false },
          { id: 'c', text: '1 liên kết cộng hóa trị', isCorrect: false },
        ],
        explanation: 'Trong phân tử DNA: A liên kết với T bằng 2 liên kết Hydrogen, còn G liên kết với C bằng 3 liên kết Hydrogen.',
      },
    ],
    relatedLessonIds: ['b9-di-truyen-dna'],
    createdAt: '2025-01-28T08:00:00.000Z',
    updatedAt: '2025-02-20T08:00:00.000Z',
    author: 'KHOA HỌC SỐ KHTN',
  },
];

function getLocalSimulations(): SimulationManifest[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY_SIMS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const validLocal = parsed.filter((m: SimulationManifest) =>
          Boolean(m) && ['hoa-hoc', 'vat-li', 'sinh-hoc'].includes(m.domain)
        );
        const existingIds = new Set(validLocal.map((m: SimulationManifest) => m.id));
        const missingSeeds = SEED_SIMULATIONS.filter((seed) => !existingIds.has(seed.id));
        if (missingSeeds.length > 0) {
          const merged = [...missingSeeds, ...validLocal];
          localStorage.setItem(LOCAL_STORAGE_KEY_SIMS, JSON.stringify(merged));
          return merged;
        }
        return validLocal;
      }
    }
  } catch (e) {
    console.warn('Could not read local simulation manifests:', e);
  }
  localStorage.setItem(LOCAL_STORAGE_KEY_SIMS, JSON.stringify(SEED_SIMULATIONS));
  return SEED_SIMULATIONS;
}

function saveLocalSimulations(list: SimulationManifest[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY_SIMS, JSON.stringify(list));
  } catch (e) {
    console.warn('Could not save local simulation manifests:', e);
  }
}

export async function fetchSimulations(includeDrafts = false): Promise<SimulationManifest[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      let query = supabase.from('simulations').select('*');
      if (!includeDrafts) {
        query = query.eq('status', 'published');
      }
      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        return data
          .map((row: any) => row.manifest_json as SimulationManifest)
          .filter((m: SimulationManifest) =>
            Boolean(m) && ['hoa-hoc', 'vat-li', 'sinh-hoc'].includes(m.domain)
          );
      }
    } catch (err) {
      console.warn('Supabase fetchSimulations fallback to local:', err);
    }
  }

  const all = getLocalSimulations();
  return includeDrafts ? all : all.filter((m) => m.status === 'published');
}

export async function saveSimulation(manifest: SimulationManifest): Promise<SimulationManifest> {
  const check = validateSimulationManifest(manifest);
  if (!check.isValid || !check.sanitized) {
    throw new Error(check.errors.join(' '));
  }

  const sanitized = {
    ...check.sanitized,
    updatedAt: new Date().toISOString(),
  };

  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('simulations').upsert({
        id: sanitized.id,
        slug: sanitized.slug,
        title: sanitized.title,
        grade: sanitized.grade,
        domain: sanitized.domain,
        status: sanitized.status,
        manifest_json: sanitized,
      });
    } catch (err) {
      console.warn('Supabase saveSimulation error, saving locally:', err);
    }
  }

  const current = getLocalSimulations();
  const idx = current.findIndex((s) => s.id === sanitized.id);
  if (idx >= 0) {
    current[idx] = sanitized;
  } else {
    current.unshift(sanitized);
  }
  saveLocalSimulations(current);
  return sanitized;
}

export async function deleteSimulation(id: string): Promise<boolean> {
  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('simulations').delete().eq('id', id);
    } catch (err) {
      console.warn('Supabase deleteSimulation error:', err);
    }
  }

  const current = getLocalSimulations().filter((s) => s.id !== id);
  saveLocalSimulations(current);
  return true;
}

export async function toggleSimulationPublish(
  id: string,
  newStatus: 'published' | 'draft'
): Promise<boolean> {
  const current = getLocalSimulations();
  const target = current.find((s) => s.id === id);
  if (target) {
    target.status = newStatus;
    target.updatedAt = new Date().toISOString();
    saveLocalSimulations(current);
  }
  return true;
}

export async function upload3DModel(
  file: File,
  simSlug: string,
  onProgress?: (percent: number) => void
): Promise<{
  url: string;
  storagePath: string;
  fileSizeFormatted: string;
  sizeFormatted: string;
  format: 'glb' | 'gltf';
}> {
  if (onProgress) onProgress(50);
  const result = await uploadScienceAsset(file, `models/${simSlug}`);
  if (onProgress) onProgress(100);
  const sizeMb = `${(file.size / (1024 * 1024)).toFixed(1)} MB`;
  const ext = file.name.toLowerCase().endsWith('.gltf') ? 'gltf' : 'glb';
  const url = result?.publicUrl || URL.createObjectURL(file);
  const path = result?.path || `models/${simSlug}/${file.name}`;
  return {
    url,
    storagePath: path,
    fileSizeFormatted: sizeMb,
    sizeFormatted: sizeMb,
    format: ext,
  };
}

