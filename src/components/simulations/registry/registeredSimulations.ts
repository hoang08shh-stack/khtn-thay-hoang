import { SimulationRegistry, LabSimulationModule } from './SimulationRegistry.ts';
import { LabViewer } from '../lab/LabViewer.tsx';
import { H2O_CONSTANTS } from '../../../utils/waterMoleculeMath.ts';

/**
 * Water Molecule (H2O) Simulation Module Definition
 * Standard: GDPT 2018 - KHTN Grade 7 (Chủ đề 2: Phân tử - Đơn chất - Hợp chất)
 */
export const WaterMoleculeModule: LabSimulationModule = {
  id: 'h2o-water-molecule',
  slug: 'cau-tao-phan-tu-nuoc-h2o',
  title: 'Cấu Tạo Phân Tử Nước (H₂O)',
  subtitle: 'Hình học gấp khúc 104.5° & Liên kết cộng hóa trị có cực',
  domain: 'hoa-hoc',
  grade: 7,
  category: 'Cấu tạo chất & Phân tử vi mô',
  difficulty: 'Cơ bản',
  tags: ['H₂O', 'Liên kết cộng hóa trị', 'Phân tử', 'VSEPR', 'Độ âm điện', 'Liên kết Hydro'],
  thumbnailUrl: 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?auto=format&fit=crop&w=800&q=80',
  summary:
    'Khám phá không gian 3D cấu tạo phân tử nước (H₂O) gồm 1 nguyên tử Oxy và 2 nguyên tử Hydro liên kết dạng gấp khúc 104.5°. Tìm hiểu lý do VSEPR ép góc liên kết và bản chất lưỡng cực điện của nước.',
  curriculumCode: 'GDPT 2018 - KHTN 7 (Chủ đề 2: Phân tử - Đơn chất - Hợp chất)',
  learningObjectives: [
    'Trình bày được thành phần phân tử nước gồm 1 nguyên tử Oxy và 2 nguyên tử Hydro (H₂O).',
    'Mô tả được dạng hình học phân tử nước là dạng gấp khúc với góc liên kết xấp xỉ 104.5°.',
    'Giải thích được bản chất liên kết cộng hóa trị có cực do chênh lệch độ âm điện giữa O và H (Δχ = 1.24).',
    'Phân biệt được mô hình trực quan Quả cầu & que nối (Ball-and-stick) với mô hình Không gian đặc (Space-filling / bán kính van der Waals).',
    'Nhận biết được vai trò của cấu trúc phân cực và liên kết hydro đối với các tính chất đặc biệt của nước trên Trái Đất.',
  ],
  keyConcepts: [
    {
      term: 'Liên kết cộng hóa trị có cực',
      definition: 'Liên kết được hình thành do cặp electron dùng chung bị lệch về phía nguyên tử có độ âm điện lớn hơn (Oxy).',
    },
    {
      term: 'Góc liên kết 104.5°',
      definition: 'Góc tạo bởi hai liên kết O-H trong không gian, nhỏ hơn góc tứ diện đều 109.5° do lực đẩy mạnh của 2 cặp electron tự do trên nguyên tử Oxy.',
    },
    {
      term: 'Mômen lưỡng cực điện (μ = 1.85 D)',
      definition: 'Đại lượng đặc trưng cho độ phân cực của phân tử, hướng từ trọng tâm điện tích dương (+ tail) về trọng tâm điện tích âm (nguyên tử Oxy).',
    },
    {
      term: 'Mô hình không gian đặc (Space-filling)',
      definition: 'Mô hình thể hiện kích thước chiếm chỗ thực tế của các đám mây electron nguyên tử theo bán kính van der Waals.',
    },
  ],
  scientificExplanation: {
    overview:
      'Nước (H₂O) là hợp chất phổ biến và quan trọng bậc nhất cho sự sống. Về mặt hóa học, phân tử nước được tạo thành từ 1 nguyên tử Oxy lai hóa sp³ liên kết với 2 nguyên tử Hydro. Do cấu trúc gấp khúc và chênh lệch độ âm điện, nước là một phân tử có cực mạnh.',
    keyPoints: [
      {
        title: 'Cặp electron tự do & Thuyết VSEPR',
        content:
          'Oxy thuộc nhóm VIA có 6 electron hóa trị. Trong H₂O, Oxy dùng 2 electron để tạo 2 liên kết đơn với 2 nguyên tử H, còn lại 4 electron ghép thành 2 cặp electron tự do (lone pairs). Lực đẩy giữa các cặp electron tự do lớn hơn lực đẩy giữa các cặp electron liên kết, ép góc H-O-H từ 109.5° xuống 104.5°.',
      },
      {
        title: 'Độ âm điện & Điện tích riêng phần',
        content:
          'Oxy có độ âm điện 3.44, Hydro có độ âm điện 2.20. Chênh lệch Δχ = 1.24 làm mật độ electron dồn về Oxy, tạo điện tích 2δ⁻ trên O và δ⁺ trên mỗi H.',
      },
      {
        title: 'Ý nghĩa tự nhiên & Sinh học',
        content:
          'Tính phân cực cho phép nước tạo mạng lưới liên kết hydro liên phân tử. Khi đóng băng ở 0°C, các liên kết hydro định hướng tạo cấu trúc rỗng làm thể tích tăng và khối lượng riêng giảm, do đó băng nổi trên mặt nước lỏng.',
      },
    ],
    realWorldApplication:
      'Hiểu cấu trúc phân tử nước giúp giải thích khả năng hòa tan vô số muối khoáng trong máu và tế bào chất, tính dẫn điện khi có ion, cơ chế thoát hơi nước ở lá cây, và vai trò điều hòa nhiệt độ khí quyển toàn cầu.',
  },
  discoveryQuestions: [
    {
      id: 'q1',
      question: 'Tại sao góc liên kết H-O-H trong phân tử nước (104.5°) lại nhỏ hơn góc tứ diện đều lý thuyết (109.5°)?',
      options: [
        { id: 'a', text: 'Do nguyên tử Oxy hút electron quá yếu nên hai nguyên tử H tự động dạt ra xa.', isCorrect: false },
        { id: 'b', text: 'Do 2 cặp electron tự do của Oxy chiếm không gian lớn, tạo lực đẩy ép góc liên kết lại.', isCorrect: true },
        { id: 'c', text: 'Do hai nguyên tử Hydro có điện tích trái dấu hút chặt vào nhau.', isCorrect: false },
        { id: 'd', text: 'Do áp suất khí quyển nén phân tử nước lại trong điều kiện chuẩn.', isCorrect: false },
      ],
      explanation:
        'Chính xác! Theo thuyết VSEPR, 2 cặp electron tự do (lone pairs) trên nguyên tử O chiếm khoảng không gian lớn hơn và đẩy 2 cặp electron liên kết O-H co lại, khiến góc liên kết giảm từ 109.5° xuống 104.5°.',
    },
    {
      id: 'q2',
      question: 'Phân tử nước có cực hay không cực? Đặc điểm nào quyết định điều này?',
      options: [
        { id: 'a', text: 'Không cực, vì tổng số proton bằng tổng số electron (phân tử trung hòa điện).', isCorrect: false },
        { id: 'b', text: 'Có cực, vì Oxy có độ âm điện lớn hơn Hydro và phân tử có dạng gấp khúc không đối xứng.', isCorrect: true },
        { id: 'c', text: 'Không cực, vì liên kết O-H là liên kết ion hoàn toàn.', isCorrect: false },
        { id: 'd', text: 'Có cực, nhưng chỉ khi phân tử nước ở thể lỏng, còn thể rắn thì không cực.', isCorrect: false },
      ],
      explanation:
        'Chính xác! Hiệu độ âm điện Δχ = 1.24 tạo 2 liên kết có cực mạnh. Do phân tử có cấu trúc gấp khúc 104.5°, 2 vector phân cực không triệt tiêu mà cộng hưởng tạo mômen lưỡng cực tổng μ = 1.85 Debye.',
    },
    {
      id: 'q3',
      question: 'Trong mô hình không gian đặc (Space-filling), nhận xét nào sau đây là ĐÚNG?',
      options: [
        { id: 'a', text: 'Các quả cầu thể hiện bán kính van der Waals thực tế và tiếp xúc xen phủ nhau, không còn que nối cơ học.', isCorrect: true },
        { id: 'b', text: 'Nguyên tử Hydro to hơn nguyên tử Oxy gấp đôi do khối lượng nhẹ hơn.', isCorrect: false },
        { id: 'c', text: 'Mô hình không gian đặc chỉ áp dụng được cho đơn chất, không áp dụng được cho hợp chất.', isCorrect: false },
        { id: 'd', text: 'Các electron được vẽ chuyển động thành vòng tròn quanh hạt nhân giống như hệ Mặt Trời.', isCorrect: false },
      ],
      explanation:
        'Chính xác! Mô hình không gian đặc (Space-filling / CPK model) phản ánh chân thực đám mây electron và thể tích chiếm chỗ của các nguyên tử theo bán kính van der Waals trong không gian thực.',
    },
  ],
  parameterDefinitions: [
    {
      key: 'bondAngleDeg',
      label: 'Góc liên kết H-O-H (°)',
      type: 'slider',
      defaultValue: H2O_CONSTANTS.IDEAL_BOND_ANGLE_DEG,
      min: 90,
      max: 125,
      step: 0.5,
      unit: '°',
      description: 'Điều chỉnh góc giữa 2 liên kết O-H (chuẩn 104.5°).',
    },
    {
      key: 'displayMode',
      label: 'Kiểu mô hình',
      type: 'select',
      defaultValue: 'ball-and-stick',
      options: [
        { value: 'ball-and-stick', label: 'Quả cầu & que nối' },
        { value: 'space-filling', label: 'Không gian đặc (van der Waals)' },
      ],
      description: 'Chuyển đổi giữa mô hình khung que và mô hình thể tích thực tế.',
    },
    {
      key: 'showAngleArc',
      label: 'Hiển thị cung góc',
      type: 'boolean',
      defaultValue: true,
      description: 'Bật/tắt cung đo góc và giá trị độ.',
    },
    {
      key: 'showDipole',
      label: 'Vector lưỡng cực điện',
      type: 'boolean',
      defaultValue: true,
      description: 'Bật/tắt hiển thị vector mômen lưỡng cực μ = 1.85 D.',
    },
    {
      key: 'showLonePairs',
      label: 'Cặp electron tự do VSEPR',
      type: 'boolean',
      defaultValue: false,
      description: 'Hiển thị 2 đám mây electron tự do đẩy góc liên kết.',
    },
    {
      key: 'vibrationSpeed',
      label: 'Dao động nhiệt',
      type: 'slider',
      defaultValue: 0.8,
      min: 0,
      max: 2.5,
      step: 0.1,
      unit: 'x',
      description: 'Mô phỏng dao động giãn và uốn phân tử theo nhiệt độ.',
    },
  ],
  defaultParameters: {
    bondAngleDeg: H2O_CONSTANTS.IDEAL_BOND_ANGLE_DEG,
    displayMode: 'ball-and-stick',
    showLabels: true,
    showAngleArc: true,
    showDipole: true,
    showLonePairs: false,
    showPartialCharges: true,
    vibrationSpeed: 0.8,
    autoRotate: true,
    rotateSpeed: 1.0,
  },
  component: LabViewer,
};

// Auto-register into central registry
SimulationRegistry.register(WaterMoleculeModule);
