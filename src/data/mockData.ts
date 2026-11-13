import {
  DomainInfo,
  Topic,
  Lesson,
  Simulation3D,
  DocumentItem,
  VideoLesson,
  QuizQuestion,
  QuizMeta,
  Badge,
} from '../types/index.ts';
const heroLabImg = '/assets/images/khtn_thcs_hero_lab_1793932730581.jpg';
const domainChemImg = '/assets/images/domain_chemistry_bright_1793629233529.jpg';
const domainPhysImg = '/assets/images/domain_physics_bright_1793629235212.jpg';
const domainBioImg = '/assets/images/domain_biology_bright_1793629236067.jpg';
const grade6Img = '/assets/images/khtn_grade6_cell_nature_1793932731616.jpg';
const grade7Img = '/assets/images/khtn_grade7_atom_optics_1793932732744.jpg';
const grade8Img = '/assets/images/khtn_grade8_chemistry_circuit_1793932733846.jpg';
const grade9Img = '/assets/images/khtn_grade9_dna_lens_1793932736576.jpg';
const gamesArenaImg = '/assets/images/khtn_games_discovery_1793932736154.jpg';
const classicLabImg = '/assets/images/hero_science_lab_1793629233704.jpg';

export const HERO_LAB_IMAGE = heroLabImg;
export const GAMES_ARENA_IMAGE = gamesArenaImg;
export const GRADE_COVER_IMAGES: Record<number, string> = {
  6: grade6Img,
  7: grade7Img,
  8: grade8Img,
  9: grade9Img,
};

export const DOMAINS: DomainInfo[] = [
  {
    id: 'hoa-hoc',
    name: 'Chất và sự biến đổi của chất (Hóa học)',
    shortName: 'Hóa học',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    gradient: 'from-emerald-600 via-teal-600 to-cyan-700',
    iconName: 'FlaskConical',
    description:
      'Khám phá cấu tạo nguyên tử, bảng tuần hoàn các nguyên tố hóa học chuẩn quốc tế IUPAC (Hydrogen, Carbon, Nitrogen, Oxygen, Sodium, Chlorine...), liên kết hóa học, phản ứng Acid - Base - Oxide - Muối và hợp chất hữu cơ.',
    image: grade8Img,
  },
  {
    id: 'vat-li',
    name: 'Năng lượng và sự biến đổi (Vật lí)',
    shortName: 'Vật lí',
    color: 'text-sky-600',
    bgColor: 'bg-sky-50',
    borderColor: 'border-sky-200',
    gradient: 'from-sky-600 via-blue-600 to-indigo-700',
    iconName: 'Zap',
    description:
      'Tìm hiểu các quy luật về tốc độ chuyển động, lực, áp suất Archimedes, năng lượng cơ học, điện học, định luật Ohm (I = U / R), cảm ứng điện từ, khúc xạ và tán sắc ánh sáng.',
    image: grade7Img,
  },
  {
    id: 'sinh-hoc',
    name: 'Vật sống (Sinh học)',
    shortName: 'Sinh học',
    color: 'text-teal-600',
    bgColor: 'bg-teal-50',
    borderColor: 'border-teal-200',
    gradient: 'from-teal-600 via-emerald-600 to-green-700',
    iconName: 'Dna',
    description:
      'Nghiên cứu cấu trúc tế bào thực vật - động vật, quang hợp, hô hấp tế bào, sinh học cơ thể người, di truyền học Mendel, cấu trúc phân tử DNA - RNA - Protein và tiến hóa.',
    image: grade6Img,
  },
];

export const TOPICS: Topic[] = [
  // LỚP 6 - Bộ sách Kết nối tri thức với cuộc sống
  {
    id: 't6-1',
    grade: 6,
    domain: 'hoa-hoc',
    code: 'CD6-01',
    title: 'Các thể của chất & Oxygen - Không khí',
    description:
      'Sự chuyển thể của chất, tính chất vật lí - hóa học của khí Oxygen (O₂) và thành phần không khí theo bộ sách Kết nối tri thức với cuộc sống.',
    lessonCount: 6,
    experimentCount: 3,
    icon: 'FlaskConical',
    order: 1,
    image: domainChemImg,
  },
  {
    id: 't6-2',
    grade: 6,
    domain: 'sinh-hoc',
    code: 'CD6-02',
    title: 'Tế bào - Đơn vị cơ sở của sự sống & Đa dạng thế giới sống',
    description:
      'Quan sát cấu tạo tế bào nhân sơ, tế bào nhân thực (thành Cellulose, lục lạp, nhân chứa DNA) dưới kính hiển vi quang học.',
    lessonCount: 7,
    experimentCount: 3,
    icon: 'Microscope',
    order: 2,
    image: grade6Img,
  },
  {
    id: 't6-3',
    grade: 6,
    domain: 'vat-li',
    code: 'CD6-03',
    title: 'Lực trong đời sống & Năng lượng',
    description:
      'Biểu diễn lực, đo lực bằng lực kế theo đơn vị Newton (N), trọng lực, lực ma sát và định luật bảo toàn năng lượng.',
    lessonCount: 6,
    experimentCount: 3,
    icon: 'Zap',
    order: 3,
    image: domainPhysImg,
  },

  // LỚP 7 - Bộ sách Kết nối tri thức với cuộc sống
  {
    id: 't7-1',
    grade: 7,
    domain: 'hoa-hoc',
    code: 'CD7-01',
    title: 'Nguyên tử, Nguyên tố hóa học & Bảng tuần hoàn (IUPAC)',
    description:
      'Mô hình nguyên tử Rutherford - Bohr, tên gọi nguyên tố theo chuẩn quốc tế IUPAC (Hydrogen, Helium, Carbon, Nitrogen, Oxygen, Sodium, Magnesium, Aluminium, Chlorine, Potassium, Calcium) và phân tử - liên kết hóa học.',
    lessonCount: 7,
    experimentCount: 3,
    icon: 'Atom',
    order: 1,
    image: grade7Img,
  },
  {
    id: 't7-2',
    grade: 7,
    domain: 'vat-li',
    code: 'CD7-02',
    title: 'Tốc độ chuyển động, Âm thanh, Ánh sáng & Từ trường',
    description:
      'Công thức tốc độ v = s / t, đồ thị quãng đường - thời gian, sóng âm, định luật phản xạ ánh sáng và từ trường nam châm.',
    lessonCount: 8,
    experimentCount: 4,
    icon: 'Zap',
    order: 2,
    image: domainPhysImg,
  },
  {
    id: 't7-3',
    grade: 7,
    domain: 'sinh-hoc',
    code: 'CD7-03',
    title: 'Trao đổi chất và chuyển hóa năng lượng ở sinh vật',
    description:
      'Quang hợp ở lá cây tổng hợp Glucose (C₆H₁₂O₆) và giải phóng Oxygen (O₂), hô hấp tế bào tại ti thể, trao đổi nước và chất dinh dưỡng.',
    lessonCount: 9,
    experimentCount: 3,
    icon: 'Dna',
    order: 3,
    image: grade6Img,
  },

  // LỚP 8 - Bộ sách Kết nối tri thức với cuộc sống
  {
    id: 't8-1',
    grade: 8,
    domain: 'hoa-hoc',
    code: 'CD8-01',
    title: 'Phản ứng hóa học & Acid - Base - pH - Oxide - Muối (IUPAC)',
    description:
      'Định luật bảo toàn khối lượng, Mol và tỉ khối chất khí, nồng độ dung dịch, tính chất của Hydrochloric acid (HCl), Sulfuric acid (H₂SO₄), Sodium hydroxide (NaOH), Calcium hydroxide (Ca(OH)₂), Oxide và Muối.',
    lessonCount: 10,
    experimentCount: 5,
    icon: 'FlaskConical',
    order: 1,
    image: grade8Img,
  },
  {
    id: 't8-2',
    grade: 8,
    domain: 'vat-li',
    code: 'CD8-02',
    title: 'Khối lượng riêng, Áp suất, Lực đẩy Archimedes & Điện học',
    description:
      'Áp suất trên một bề mặt p = F / S, lực đẩy Archimedes F_A = d × V, đòn bẩy, mạch điện một chiều, cường độ dòng điện và hiệu điện thế.',
    lessonCount: 9,
    experimentCount: 4,
    icon: 'Zap',
    order: 2,
    image: domainPhysImg,
  },
  {
    id: 't8-3',
    grade: 8,
    domain: 'sinh-hoc',
    code: 'CD8-03',
    title: 'Sinh học cơ thể người & Môi trường sinh thái',
    description:
      'Hệ vận động, dinh dưỡng - tiêu hóa, máu và hệ tuần hoàn, hệ hô hấp, hệ bài tiết, điều hòa nội môi và cân bằng hệ sinh thái.',
    lessonCount: 10,
    experimentCount: 3,
    icon: 'Dna',
    order: 3,
    image: domainBioImg,
  },

  // LỚP 9 - Bộ sách Kết nối tri thức với cuộc sống
  {
    id: 't9-1',
    grade: 9,
    domain: 'vat-li',
    code: 'CD9-01',
    title: 'Năng lượng cơ học, Khúc xạ ánh sáng, Điện trở & Định luật Ohm',
    description:
      'Động năng - thế năng, khúc xạ và tán sắc ánh sáng, thấu kính hội tụ - phân kì, định luật Ohm (I = U / R), công suất điện và cảm ứng điện từ.',
    lessonCount: 10,
    experimentCount: 5,
    icon: 'Zap',
    order: 1,
    image: grade9Img,
  },
  {
    id: 't9-2',
    grade: 9,
    domain: 'hoa-hoc',
    code: 'CD9-02',
    title: 'Kim loại & Hợp chất hữu cơ (Hydrocarbon, Ethylic alcohol, Acetic acid)',
    description:
      'Dãy hoạt động hóa học của kim loại (K, Na, Ca, Mg, Al, Zn, Fe, Pb, H, Cu, Ag, Au), Alkane (Methane CH₄), Alkene (Ethylene C₂H₄), Ethylic alcohol (C₂H₅OH), Acetic acid (CH₃COOH), Lipid, Glucose, Saccharose, Tinh bột, Cellulose.',
    lessonCount: 12,
    experimentCount: 5,
    icon: 'FlaskConical',
    order: 2,
    image: domainChemImg,
  },
  {
    id: 't9-3',
    grade: 9,
    domain: 'sinh-hoc',
    code: 'CD9-03',
    title: 'Di truyền học Mendel, Phân tử DNA - RNA - Gene & Tiến hóa',
    description:
      'Quy luật di truyền Mendel, cấu trúc không gian xoắn kép của phân tử DNA, phiên mã tạo RNA, dịch mã tổng hợp Protein, đột biến nhiễm sắc thể và tiến hóa.',
    lessonCount: 10,
    experimentCount: 3,
    icon: 'Dna',
    order: 3,
    image: grade9Img,
  },
];

export const LESSONS: Lesson[] = [
  // LỚP 6
  {
    id: 'khtn-6-bai-9',
    topicId: 't6-1',
    grade: 6,
    domain: 'hoa-hoc',
    code: 'KHTN6-B09',
    title: 'Bài 9: Oxygen và Không khí',
    summary:
      'Tìm hiểu tính chất vật lí của khí Oxygen (O₂), vai trò duy trì sự hô hấp và sự cháy; xác định thành phần phần trăm thể tích khí Nitrogen (78%) và Oxygen (21%) trong không khí.',
    objectives: [
      'Nêu được một số tính chất của Oxygen (trạng thái, màu sắc, tính tan trong nước).',
      'Trình bày được vai trò của Oxygen đối với sự sống và sự cháy.',
      'Xác định được thành phần phần trăm thể tích của Oxygen và Nitrogen trong không khí.',
    ],
    durationMinutes: 45,
    sections: [
      {
        title: '1. Tính chất vật lí và vai trò của khí Oxygen (O₂)',
        content: [
          'a) Tính chất vật lí của Oxygen: Ở điều kiện thường (25°C, 1 bar), khí Oxygen (O₂) là chất khí không màu, không mùi, không vị, nặng hơn không khí (tỉ khối d = \\frac{32}{29} ≈ 1,1) và ít tan trong nước (ở 20°C và 1 atm, 1 lít nước hòa tan khoảng 31 mL khí O₂). Oxygen hóa lỏng ở -183°C có màu xanh nhạt.',
          'b) Vai trò duy trì sự hô hấp: Khí Oxygen (O₂) là nguyên tố thiết yếu cho quá trình hô hấp tế bào của con người, động vật và thực vật để giải phóng năng lượng duy trì hoạt động sống.',
          'c) Vai trò duy trì sự cháy: Khí Oxygen tác dụng mãnh liệt với các nhiên liệu (gỗ, than, khí gas, xăng dầu) ở nhiệt độ cao tỏa nhiều nhiệt và ánh sáng. Que đóm còn tàn đỏ khi đưa vào bình chứa khí O₂ sẽ bùng cháy thành ngọn lửa sáng.',
        ],
        keyPoints: [
          'Công thức phân tử khí Oxygen: O₂ (khối lượng phân tử M = 32 amu).',
          'Hai vai trò cốt lõi của Oxygen: Duy trì sự sống (hô hấp) và duy trì sự cháy.',
        ],
        formula: 'C₆H₁₂O₆ + 6O₂ → (Enzyme) 6CO₂ + 6H₂O + Năng lượng (ATP)   |   C + O₂ → (t°) CO₂',
        formulaMeaning: 'Phương trình tổng quát quá trình hô hấp tế bào và phản ứng đốt cháy nhiên liệu Carbon trong khí Oxygen.',
        highlightBox: {
          title: 'Lưu ý an toàn phòng thí nghiệm & Đời sống',
          text: 'Muốn dập tắt đám cháy, cần thực hiện đồng thời hai biện pháp: hạ nhiệt độ chất cháy xuống dưới nhiệt độ bắt lửa và cách li chất cháy khỏi nguồn khí Oxygen (O₂).',
        },
        imageUrl: domainChemImg,
        imageCaption: 'Thí nghiệm thu khí Oxygen (O₂) bằng phương pháp đẩy nước trong KHOA HỌC SỐ KHTN.',
      },
      {
        title: '2. Thành phần của không khí & Bảo vệ môi trường không khí',
        content: [
          'a) Thành phần thể tích không khí khô và sạch: Không khí là một hỗn hợp nhiều chất khí, trong đó khí Nitrogen (N₂) chiếm khoảng 78% thể tích, khí Oxygen (O₂) chiếm khoảng 21% thể tích.',
          'b) Các thành phần phụ (khoảng 1% thể tích): Gồm khí Carbon dioxide (CO₂), hơi nước (H₂O), các khí hiếm như Argon (Ar), Helium (He), Neon (Ne) và một lượng nhỏ bụi khí quyển.',
          'c) Biện pháp bảo vệ môi trường không khí: Trồng nhiều cây xanh (quang hợp hấp thụ CO₂ và giải phóng O₂), sử dụng năng lượng tái tạo (điện mặt trời, điện gió) và xử lí khí thải công nghiệp (SO₂, NO₂, CO).',
        ],
        formula: '%V(N₂) ≈ 78%   |   %V(O₂) ≈ 21%   |   %V(CO₂, Ar, H₂O) ≈ 1%',
        formulaMeaning: 'Tỉ lệ phần trăm theo thể tích các chất khí trong không khí khô và sạch ở gần mặt đất.',
        keyPoints: [
          'Thể tích khí Oxygen chiếm xấp xỉ \\frac{1}{5} (≈ 21%) thể tích không khí.',
          'Khí Nitrogen (N₂) chiếm tỉ lệ lớn nhất (~78%) giúp làm giảm tốc độ cháy và cung cấp nguồn đạm tự nhiên.',
        ],
      },
    ],
    keyTakeaways: [
      'Oxygen (O₂) là chất khí không màu, không mùi, ít tan trong nước, nặng hơn không khí (M = 32 amu), duy trì sự hô hấp và sự cháy.',
      'Không khí khô và sạch chứa khoảng 78% Nitrogen (N₂), 21% Oxygen (O₂) và 1% các khí khác (CO₂, Argon, hơi nước).',
    ],
    miniQuiz: [
      {
        id: 'mq-khtn6-b9-1',
        questionType: 'single_choice',
        question:
          'Theo sách Kết nối tri thức với cuộc sống, hai chất khí chiếm tỉ lệ thể tích lớn nhất trong không khí khô và sạch là:',
        options: [
          'Khoảng 78% khí Nitrogen (N₂) và 21% khí Oxygen (O₂)',
          'Khoảng 78% khí Oxygen (O₂) và 21% khí Carbon dioxide (CO₂)',
          'Khoảng 50% khí Hydrogen (H₂) và 50% khí Oxygen (O₂)',
          'Khoảng 78% khí Carbon dioxide (CO₂) và 21% khí Nitrogen (N₂)',
        ],
        correctIndex: 0,
        explanation:
          'Trong không khí khô và sạch: Nitrogen (N₂) chiếm khoảng 78% thể tích, Oxygen (O₂) chiếm khoảng 21% thể tích, còn lại 1% là CO₂, Argon và hơi nước.',
      },
      {
        id: 'mq-khtn6-b9-2',
        questionType: 'single_choice',
        question:
          'Khi đưa que đóm còn tàn đỏ vào bình chứa khí Oxygen (O₂) nguyên chất, hiện tượng quan sát được là:',
        options: [
          'Que đóm bùng cháy mãnh liệt thành ngọn lửa sáng',
          'Que đóm tắt ngay lập tức',
          'Que đóm chuyển sang màu xanh lam',
          'Không có hiện tượng gì xảy ra',
        ],
        correctIndex: 0,
        explanation:
          'Khí Oxygen (O₂) có tính chất duy trì sự cháy mãnh liệt, làm que đóm còn tàn đỏ bùng cháy thành ngọn lửa.',
      },
      {
        id: 'mq-khtn6-b9-3',
        questionType: 'true_false',
        question:
          'Xét các phát biểu sau về tính chất của khí Oxygen (O₂) và thành phần không khí:',
        options: [
          'Ở điều kiện thường, khí Oxygen (O₂) là chất khí không màu, không mùi, không vị và ít tan trong nước.',
          'Khí Oxygen chiếm khoảng 78% thể tích không khí khô và sạch.',
          'Khí Oxygen cần thiết cho sự hô hấp của con người, động vật, thực vật và duy trì sự cháy.',
          'Trồng nhiều cây xanh giúp hấp thụ khí Carbon dioxide (CO₂) và giải phóng khí Oxygen (O₂) qua quang hợp.',
        ],
        correctIndex: 0,
        trueFalseStatements: [
          {
            id: 'a',
            label: 'a',
            text: 'Ở điều kiện thường, khí Oxygen (O₂) là chất khí không màu, không mùi, không vị và ít tan trong nước.',
            isTrue: true,
            explanation: 'Đúng theo tính chất vật lí của khí Oxygen.',
          },
          {
            id: 'b',
            label: 'b',
            text: 'Khí Oxygen chiếm khoảng 78% thể tích không khí khô và sạch.',
            isTrue: false,
            explanation: 'Sai vì Oxygen chỉ chiếm khoảng 21% thể tích không khí (Nitrogen mới chiếm 78%).',
          },
          {
            id: 'c',
            label: 'c',
            text: 'Khí Oxygen cần thiết cho sự hô hấp của con người, động vật, thực vật và duy trì sự cháy.',
            isTrue: true,
            explanation: 'Đúng, Oxygen duy trì sự sống và sự cháy.',
          },
          {
            id: 'd',
            label: 'd',
            text: 'Trồng nhiều cây xanh giúp hấp thụ khí Carbon dioxide (CO₂) và giải phóng khí Oxygen (O₂) qua quang hợp.',
            isTrue: true,
            explanation: 'Đúng, cây xanh quang hợp giải phóng O₂ giúp điều hòa không khí.',
          },
        ],
        explanation: 'Đáp án Đúng/Sai: a) Đúng | b) Sai (O₂ chiếm 21%, N₂ chiếm 78%) | c) Đúng | d) Đúng.',
      },
      {
        id: 'mq-khtn6-b9-4',
        questionType: 'essay',
        question:
          'Úp một cốc thủy tinh trong suốt lên một ngọn nến đang cháy đặt trong đĩa nước màu. Sau một thời gian ngắn, ngọn nến tắt và mực nước trong cốc dâng lên chiếm khoảng 1/5 thể tích không khí trong cốc. Em hãy giải thích hiện tượng trên và nêu vai trò của khí Oxygen.',
        options: [],
        correctIndex: 0,
        sampleAnswer:
          '- Ngọn nến tắt vì quá trình cháy đã tiêu thụ hết lượng khí Oxygen (O₂) bên trong cốc thủy tinh.\n- Mực nước dâng lên khoảng 1/5 (≈ 20% - 21%) thể tích cốc vì khí Oxygen mất đi làm áp suất trong cốc giảm, áp suất khí quyển đẩy nước tràn vào thế chỗ phần thể tích Oxygen đã phản ứng.\n- Vai trò: Khí Oxygen duy trì sự cháy và duy trì sự hô hấp.',
        rubric:
          'Giải thích vì sao nến tắt (0,5đ); Giải thích vì sao nước dâng lên 1/5 cốc (0,5đ); Nêu đúng vai trò của Oxygen (0,5đ).',
        explanation:
          'Nến cháy tiêu thụ hết khí Oxygen (O₂) nên tắt; áp suất trong cốc giảm làm nước dâng lên chiếm 1/5 (≈ 21%) thể tích cốc, đúng bằng tỉ lệ Oxygen trong không khí.',
      },
    ],
    thumbnailUrl: domainChemImg,
    simulationId: 'sim-atom-bohr',
    videoUrl: 'https://www.youtube.com/embed/p3St51F4kE8',
    documentId: 'doc-khtn-6-1',
    quizCount: 4,
    viewCount: 2450,
    author: 'KHOA HỌC SỐ KHTN',
  },
  {
    id: 'khtn-6-bai-18',
    topicId: 't6-2',
    grade: 6,
    domain: 'sinh-hoc',
    code: 'KHTN6-B18',
    title: 'Bài 18: Tế bào - Đơn vị cơ sở của sự sống',
    summary:
      'Khám phá cấu tạo ba thành phần chính của tế bào (màng tế bào, tế bào chất, nhân hoặc vùng nhân), phân biệt tế bào nhân sơ và tế bào nhân thực (thực vật, động vật).',
    objectives: [
      'Mô tả được cấu tạo và chức năng 3 thành phần chính của tế bào.',
      'Phân biệt được tế bào thực vật (có thành Cellulose, lục lạp) và tế bào động vật.',
      'Quan sát tiêu bản tế bào dưới kính hiển vi quang học 3D.',
    ],
    durationMinutes: 45,
    sections: [
      {
        title: '1. Khái niệm và cấu tạo 3 thành phần chính của tế bào',
        content: [
          'a) Khái niệm tế bào: Mọi cơ thể sinh vật (từ vi khuẩn đơn bào đến thực vật, động vật, con người) đều được cấu tạo từ tế bào. Tế bào là đơn vị cấu trúc và đơn vị chức năng cơ bản của mọi cơ thể sống.',
          'b) Màng tế bào (Màng sinh chất): Lớp màng bao bọc bên ngoài tế bào, có chức năng bảo vệ và kiểm soát sự trao đổi chất có chọn lọc giữa tế bào với môi trường.',
          'c) Chất tế bào (Tế bào chất): Chất keo lỏng nằm trong màng tế bào, chứa các bào quan (Ti thể, Ribosome, Lưới nội chất, Lục lạp) và là nơi diễn ra hầu hết các hoạt động sống của tế bào.',
          'd) Nhân tế bào (hoặc Vùng nhân): Chứa vật chất di truyền DNA, đóng vai trò trung tâm điều khiển mọi hoạt động sống, sự lớn lên và sinh sản của tế bào.',
        ],
        keyPoints: [
          'Tế bào nhân sơ (Vi khuẩn): Chưa có màng nhân chính thức (chỉ có vùng nhân), trong chất tế bào chỉ có bào quan Ribosome.',
          'Tế bào nhân thực (Thực vật, Động vật, Nấm): Đã có nhân hoàn chỉnh được bao bọc bởi màng nhân và hệ thống các bào quan có màng.',
        ],
        imageUrl: grade6Img,
        imageCaption: 'Mô hình 3D cấu trúc hiển vi của tế bào thực vật và tế bào động vật.',
      },
      {
        title: '2. Phân biệt Tế bào thực vật – Tế bào động vật & Sự phân chia tế bào',
        content: [
          'a) Đặc điểm riêng của tế bào thực vật: Có thành tế bào bằng Cellulose vững chắc quy định hình dạng tế bào, có bào quan Lục lạp chứa diệp lục thực hiện quang hợp và có Không bào trung tâm lớn.',
          'b) Đặc điểm của tế bào động vật: Không có thành Cellulose và không có Lục lạp, hình dạng linh hoạt phù hợp với chức năng chuyên hóa (tế bào cơ, tế bào thần kinh, tế bào hồng cầu).',
          'c) Sự lớn lên và sinh sản (phân chia) của tế bào: Từ 1 tế bào mẹ ban đầu, sau mỗi lần phân chia tạo ra 2 tế bào con giống nhau. Đây là cơ sở giúp cơ thể đa bào lớn lên và thay thế các tế bào già, tổn thương.',
        ],
        formula: 'N_tb = N₀ × 2^k   |   6CO₂ + 6H₂O → (Ánh sáng, Diệp lục) C₆H₁₂O₆ + 6O₂ ↑',
        formulaMeaning: 'N_tb: tổng số tế bào con tạo thành; N₀: số tế bào mẹ ban đầu; k: số lần phân chia liên tiếp; Phương trình quang hợp tại Lục lạp.',
        highlightBox: {
          title: 'Ghi nhớ nhanh công thức phân bào',
          text: 'Nếu ban đầu có 1 tế bào mẹ (N₀ = 1) tiến hành phân chia liên tiếp k lần thì tổng số tế bào con tạo ra là 2^k tế bào (ví dụ: sau 3 lần phân chia tạo ra 2³ = 8 tế bào con).',
        },
      },
    ],
    keyTakeaways: [
      'Tế bào là đơn vị cấu trúc và chức năng của mọi cơ thể sống, gồm 3 thành phần chính: Màng tế bào, Chất tế bào, Nhân (hoặc Vùng nhân).',
      'Tế bào thực vật có thành Cellulose và bào quan Lục lạp quang hợp; công thức tính số tế bào con sau k lần phân chia là N_tb = N₀ × 2^k.',
    ],
    miniQuiz: [
      {
        id: 'mq-khtn6-b18-1',
        questionType: 'single_choice',
        question:
          'Thành phần cấu trúc nào sau đây chỉ có ở tế bào thực vật mà không có ở tế bào động vật?',
        options: [
          'Thành tế bào bằng Cellulose và bào quan Lục lạp',
          'Màng sinh chất và chất tế bào',
          'Nhân tế bào chứa DNA và Ti thể',
          'Ribosome và màng nhân',
        ],
        correctIndex: 0,
        explanation:
          'Tế bào thực vật có Thành tế bào bằng Cellulose giúp quy định hình dạng và bào quan Lục lạp (chứa diệp lục để quang hợp), còn tế bào động vật không có hai thành phần này.',
      },
      {
        id: 'mq-khtn6-b18-2',
        questionType: 'single_choice',
        question:
          'Ba thành phần cấu tạo chính có ở hầu hết mọi tế bào (nhân sơ và nhân thực) là:',
        options: [
          'Màng tế bào, chất tế bào và nhân (hoặc vùng nhân)',
          'Thành tế bào, lục lạp và không bào trung tâm',
          'Màng nhân, ti thể và trung thể',
          'Vỏ nhầy, lông roi và thành Cellulose',
        ],
        correctIndex: 0,
        explanation:
          'Mọi tế bào đều có 3 thành phần cơ bản: Màng tế bào (bảo vệ, trao đổi chất), Chất tế bào (diễn ra hoạt động sống) và Nhân hoặc vùng nhân (điều khiển hoạt động sống).',
      },
      {
        id: 'mq-khtn6-b18-3',
        questionType: 'true_false',
        question:
          'Khi quan sát tiêu bản tế bào biểu bì vảy hành và tế bào niêm mạc miệng người dưới kính hiển vi, xét tính Đúng/Sai của các nhận định sau:',
        options: [
          'Tế bào biểu bì vảy hành là tế bào thực vật nên có thành tế bào vững chắc tạo hình đa giác.',
          'Tế bào vi khuẩn E. coli là tế bào nhân thực đã có màng nhân bao bọc vật chất di truyền.',
          'Lục lạp là bào quan thực hiện chức năng quang hợp chuyển hóa năng lượng ánh sáng thành hóa năng.',
          'Sự lớn lên và sinh sản (phân chia) của tế bào là cơ sở cho sự lớn lên của cơ thể sinh vật.',
        ],
        correctIndex: 0,
        trueFalseStatements: [
          {
            id: 'a',
            label: 'a',
            text: 'Tế bào biểu bì vảy hành là tế bào thực vật nên có thành tế bào vững chắc tạo hình đa giác.',
            isTrue: true,
            explanation: 'Đúng, thành Cellulose giúp tế bào thực vật có hình dạng cố định.',
          },
          {
            id: 'b',
            label: 'b',
            text: 'Tế bào vi khuẩn E. coli là tế bào nhân thực đã có màng nhân bao bọc vật chất di truyền.',
            isTrue: false,
            explanation: 'Sai, vi khuẩn là tế bào nhân sơ (chỉ có vùng nhân, chưa có màng nhân).',
          },
          {
            id: 'c',
            label: 'c',
            text: 'Lục lạp là bào quan thực hiện chức năng quang hợp chuyển hóa năng lượng ánh sáng thành hóa năng.',
            isTrue: true,
            explanation: 'Đúng, lục lạp chứa chất diệp lục thực hiện quang hợp ở thực vật.',
          },
          {
            id: 'd',
            label: 'd',
            text: 'Sự lớn lên và sinh sản (phân chia) của tế bào là cơ sở cho sự lớn lên của cơ thể sinh vật.',
            isTrue: true,
            explanation: 'Đúng, nhờ tế bào lớn lên và phân chia mà cơ thể đa bào lớn lên.',
          },
        ],
        explanation: 'Đáp án Đúng/Sai: a) Đúng | b) Sai (vi khuẩn là tế bào nhân sơ) | c) Đúng | d) Đúng.',
      },
      {
        id: 'mq-khtn6-b18-4',
        questionType: 'essay',
        question:
          'Từ 1 tế bào mẹ ban đầu, sau 4 lần phân chia liên tiếp sẽ tạo ra bao nhiêu tế bào con? Em hãy lập luận công thức tính và nêu ý nghĩa của sự lớn lên, phân chia tế bào đối với sinh vật.',
        options: [],
        correctIndex: 0,
        sampleAnswer:
          '- Cứ sau 1 lần phân chia, từ 1 tế bào mẹ tạo ra 2 tế bào con.\n- Sau k = 4 lần phân chia liên tiếp, số tế bào con tạo thành là: 2⁴ = 16 (tế bào con).\n- Ý nghĩa: Giúp cơ thể sinh vật lớn lên, tăng kích thước và thay thế các tế bào già, tế bào bị tổn thương.',
        rubric:
          'Viết đúng công thức 2^k và tính ra 2⁴ = 16 tế bào con (0,5đ); Nêu được ý nghĩa giúp cơ thể lớn lên và hàn gắn vết thương (0,5đ).',
        explanation:
          'Áp dụng công thức N = 2^k: sau k = 4 lần phân chia tạo ra 2⁴ = 16 tế bào con.',
      },
    ],
    thumbnailUrl: grade6Img,
    simulationId: 'sim-microscope-cell',
    videoUrl: 'https://www.youtube.com/embed/URUJD5NEXC8',
    documentId: 'doc-khtn-6-1',
    quizCount: 4,
    viewCount: 3120,
    author: 'KHOA HỌC SỐ KHTN',
  },

  // LỚP 7
  {
    id: 'khtn-7-bai-2',
    topicId: 't7-1',
    grade: 7,
    domain: 'hoa-hoc',
    code: 'KHTN7-B02',
    title: 'Bài 2: Nguyên tử & Bảng tuần hoàn các nguyên tố hóa học (IUPAC)',
    summary:
      'Khám phá cấu trúc nguyên tử theo mô hình Rutherford - Bohr gồm hạt nhân (Proton, Neutron) và lớp vỏ Electron. Nắm vững danh pháp nguyên tố hóa học theo chuẩn quốc tế IUPAC trong bộ sách Kết nối tri thức với cuộc sống.',
    objectives: [
      'Trình bày được mô hình nguyên tử của Rutherford - Bohr.',
      'Nêu được khối lượng nguyên tử tính theo đơn vị quốc tế amu (A ≈ p + n).',
      'Đọc và viết đúng tên nguyên tố theo danh pháp chuẩn quốc tế IUPAC: Hydrogen, Helium, Carbon, Nitrogen, Oxygen, Sodium, Magnesium, Aluminium, Sulfur, Chlorine, Potassium, Calcium, Iron, Copper, Zinc, Silver.',
    ],
    durationMinutes: 45,
    sections: [
      {
        title: '1. Mô hình nguyên tử Rutherford – Bohr và Cấu tạo hạt nhân',
        content: [
          'a) Cấu trúc nguyên tử Rutherford – Bohr: Nguyên tử là hạt vô cùng nhỏ và trung hòa về điện. Nguyên tử gồm hạt nhân mang điện tích dương nằm ở tâm và lớp vỏ gồm một hay nhiều hạt Electron mang điện tích âm chuyển động xung quanh hạt nhân theo từng lớp.',
          'b) Các hạt cấu tạo nên nguyên tử: Hạt nhân được tạo bởi hạt Proton (kí hiệu p, mang điện tích +1, khối lượng ≈ 1 amu) và hạt Neutron (kí hiệu n, không mang điện, khối lượng ≈ 1 amu). Lớp vỏ tạo bởi các hạt Electron (kí hiệu e, mang điện tích -1, khối lượng rất nhỏ ≈ 0,00055 amu).',
          'c) Quy tắc trung hòa điện và Khối lượng nguyên tử: Trong mọi nguyên tử trung hòa về điện, số hạt Proton luôn bằng số hạt Electron và bằng số đơn vị điện tích hạt nhân Z. Do khối lượng Electron rất nhỏ nên khối lượng nguyên tử tập trung hầu hết ở hạt nhân.',
        ],
        keyPoints: [
          'Proton (p): điện tích +1, khối lượng xấp xỉ 1 amu.',
          'Neutron (n): điện tích 0 (không mang điện), khối lượng xấp xỉ 1 amu.',
          'Electron (e): điện tích -1, khối lượng ≈ 0,00055 amu (không đáng kể so với p và n).',
        ],
        formula: 'Z = p = e   |   m_nt ≈ p + n (amu)   |   Số e tối đa lớp thứ nhất (lớp K) = 2e; lớp thứ hai (lớp L) = 8e',
        formulaMeaning: 'Z: số đơn vị điện tích hạt nhân (số hiệu nguyên tử); p: số hạt Proton; e: số hạt Electron; n: số hạt Neutron; m_nt: khối lượng nguyên tử tính theo amu.',
        imageUrl: grade7Img,
        imageCaption: 'Mô phỏng 3D cấu tạo nguyên tử Rutherford - Bohr trong KHOA HỌC SỐ KHTN.',
      },
      {
        title: '2. Bảng tuần hoàn & Danh pháp nguyên tố hóa học chuẩn quốc tế IUPAC',
        content: [
          'a) Nguyên tắc sắp xếp và Cấu tạo ô nguyên tố: Các nguyên tố trong Bảng tuần hoàn được sắp xếp theo chiều tăng dần của điện tích hạt nhân nguyên tử (Z). Số thứ tự ô nguyên tố = Z = p = e; Số thứ tự chu kì = Số lớp Electron; Số thứ tự nhóm A = Số Electron lớp ngoài cùng.',
          'b) Danh pháp 10 nguyên tố đầu tiên (Z = 1 → 10) theo chuẩn IUPAC: H (Hydrogen, Z = 1), He (Helium, Z = 2), Li (Lithium, Z = 3), Be (Beryllium, Z = 4), B (Boron, Z = 5), C (Carbon, Z = 6), N (Nitrogen, Z = 7), O (Oxygen, Z = 8), F (Fluorine, Z = 9), Ne (Neon, Z = 10).',
          'c) Danh pháp các nguyên tố chu kì 3, 4 và kim loại quan trọng theo IUPAC: Na (Sodium, Z = 11), Mg (Magnesium, Z = 12), Al (Aluminium, Z = 13), Si (Silicon, Z = 14), P (Phosphorus, Z = 15), S (Sulfur, Z = 16), Cl (Chlorine, Z = 17), Ar (Argon, Z = 18), K (Potassium, Z = 19), Ca (Calcium, Z = 20), Fe (Iron, Z = 26), Cu (Copper, Z = 29), Zn (Zinc, Z = 30), Ag (Silver, Z = 47), Au (Gold, Z = 79).',
        ],
        keyPoints: [
          'Các nguyên tố có 1, 2, 3 electron lớp ngoài cùng thường là nguyên tố Kim loại (trừ H, He, B).',
          'Các nguyên tố có 5, 6, 7 electron lớp ngoài cùng thường là nguyên tố Phi kim; có 8 electron lớp ngoài cùng (lớp K là 2e ở He) là Khí hiếm.',
        ],
        highlightBox: {
          title: 'Quy tắc vàng tra cứu nhanh vị trí nguyên tố trong Bảng tuần hoàn',
          text: 'Biết cấu hình phân bố electron theo lớp (ví dụ Aluminium Al có Z = 13 → phân bố 2 - 8 - 3), ta suy ra ngay: Ô số 13 (vì Z = 13), Chu kì 3 (vì có 3 lớp electron) và Nhóm IIIA (vì có 3 electron ở lớp ngoài cùng).',
        },
      },
    ],
    keyTakeaways: [
      'Nguyên tử trung hòa về điện: Số hạt Proton (+) luôn bằng số hạt Electron (-), khối lượng nguyên tử m_nt ≈ p + n (amu).',
      'Sử dụng thống nhất danh pháp quốc tế IUPAC: Hydrogen (H), Oxygen (O), Carbon (C), Nitrogen (N), Sodium (Na), Potassium (K), Calcium (Ca), Magnesium (Mg), Aluminium (Al), Iron (Fe), Copper (Cu), Zinc (Zn), Chlorine (Cl), Sulfur (S).',
    ],
    miniQuiz: [
      {
        id: 'mq-khtn7-b2-1',
        questionType: 'single_choice',
        question:
          'Theo danh pháp chuẩn quốc tế IUPAC trong bộ sách Kết nối tri thức với cuộc sống, các nguyên tố có kí hiệu hóa học Na, K, Ca, Fe, Cu lần lượt có tên gọi là:',
        options: [
          'Sodium, Potassium, Calcium, Iron, Copper',
          'Sulfur, Phosphorus, Carbon, Fluorine, Chlorine',
          'Sodium, Calcium, Potassium, Copper, Iron',
          'Nitrogen, Potassium, Calcium, Zinc, Silver',
        ],
        correctIndex: 0,
        explanation:
          'Theo danh pháp quốc tế IUPAC: Na là Sodium, K là Potassium, Ca là Calcium, Fe là Iron, Cu là Copper.',
      },
      {
        id: 'mq-khtn7-b2-2',
        questionType: 'single_choice',
        question:
          'Nguyên tử của nguyên tố Chlorine (Cl) có số đơn vị điện tích hạt nhân Z = 17 và số hạt Neutron là 18. Phát biểu nào sau đây là ĐÚNG về nguyên tử Chlorine?',
        options: [
          'Có 17 hạt Proton trong hạt nhân, 17 hạt Electron ở vỏ (phân bố 2 - 8 - 7) và khối lượng nguyên tử xấp xỉ 35 amu',
          'Có 18 hạt Proton, 17 hạt Electron và khối lượng nguyên tử xấp xỉ 35 amu',
          'Có 17 hạt Proton, 18 hạt Electron và 2 lớp vỏ Electron',
          'Có 35 hạt Electron ở lớp vỏ ngoài cùng',
        ],
        correctIndex: 0,
        explanation:
          'Vì nguyên tử trung hòa về điện nên p = e = Z = 17 (phân bố 3 lớp: 2 - 8 - 7); khối lượng nguyên tử A ≈ p + n = 17 + 18 = 35 amu.',
      },
      {
        id: 'mq-khtn7-b2-3',
        questionType: 'true_false',
        question:
          'Cho nguyên tử Magnesium (Mg) có số hiệu nguyên tử Z = 12 và số hạt Neutron n = 12. Xét tính Đúng/Sai của các phát biểu sau:',
        options: [
          'Hạt nhân nguyên tử Magnesium có 12 hạt Proton mang điện tích dương (+12).',
          'Lớp vỏ nguyên tử Magnesium có 12 hạt Electron được sắp xếp vào 3 lớp (2 - 8 - 2), có 2 electron lớp ngoài cùng.',
          'Khối lượng nguyên tử Magnesium xấp xỉ bằng 12 amu.',
          'Trong Bảng tuần hoàn, Magnesium thuộc chu kì 3, nhóm IIA và là nguyên tố kim loại.',
        ],
        correctIndex: 0,
        trueFalseStatements: [
          {
            id: 'a',
            label: 'a',
            text: 'Hạt nhân nguyên tử Magnesium có 12 hạt Proton mang điện tích dương (+12).',
            isTrue: true,
            explanation: 'Đúng vì Z = p = 12.',
          },
          {
            id: 'b',
            label: 'b',
            text: 'Lớp vỏ nguyên tử Magnesium có 12 hạt Electron được sắp xếp vào 3 lớp (2 - 8 - 2), có 2 electron lớp ngoài cùng.',
            isTrue: true,
            explanation: 'Đúng, lớp 1 có 2e, lớp 2 có 8e, lớp 3 (ngoài cùng) có 2e.',
          },
          {
            id: 'c',
            label: 'c',
            text: 'Khối lượng nguyên tử Magnesium xấp xỉ bằng 12 amu.',
            isTrue: false,
            explanation: 'Sai vì khối lượng nguyên tử A ≈ p + n = 12 + 12 = 24 amu.',
          },
          {
            id: 'd',
            label: 'd',
            text: 'Trong Bảng tuần hoàn, Magnesium thuộc chu kì 3, nhóm IIA và là nguyên tố kim loại.',
            isTrue: true,
            explanation: 'Đúng vì Mg có 3 lớp electron (chu kì 3) và 2e lớp ngoài cùng (nhóm IIA).',
          },
        ],
        explanation: 'Đáp án Đúng/Sai: a) Đúng | b) Đúng | c) Sai (A = 12 + 12 = 24 amu) | d) Đúng.',
      },
      {
        id: 'mq-khtn7-b2-4',
        questionType: 'essay',
        question:
          'Nguyên tử của nguyên tố Aluminium (Nhôm - Al) có số đơn vị điện tích hạt nhân Z = 13 và số hạt Neutron trong hạt nhân là 14. Em hãy xác định số hạt Proton, số hạt Electron, khối lượng nguyên tử (amu), sự phân bố Electron trên các lớp vỏ và vị trí (ô, chu kì, nhóm) của Aluminium trong Bảng tuần hoàn.',
        options: [],
        correctIndex: 0,
        sampleAnswer:
          '- Số hạt cơ bản: p = e = Z = 13 hạt; n = 14 hạt.\n- Khối lượng nguyên tử: A ≈ p + n = 13 + 14 = 27 (amu).\n- Phân bố 13 electron trên 3 lớp vỏ: Lớp K (2e) – Lớp L (8e) – Lớp M (3e, có 3e lớp ngoài cùng).\n- Vị trí trong Bảng tuần hoàn: Ô số 13, Chu kì 3 (vì có 3 lớp electron), Nhóm IIIA (vì có 3e lớp ngoài cùng).',
        rubric:
          'Tính đúng p = e = 13 và A = 27 amu (0,5đ); Viết đúng phân bố 2 - 8 - 3 và vị trí Ô 13, Chu kì 3, Nhóm IIIA (0,5đ).',
        explanation:
          'Aluminium (Z = 13) có p = e = 13, n = 14, A = 27 amu; phân bố e: 2 - 8 - 3 (Ô 13, Chu kì 3, Nhóm IIIA).',
      },
    ],
    thumbnailUrl: grade7Img,
    simulationId: 'sim-atom-bohr',
    videoUrl: 'https://www.youtube.com/embed/FSyAehMdpyI',
    documentId: 'doc-khtn-7-1',
    quizCount: 4,
    viewCount: 4890,
    author: 'KHOA HỌC SỐ KHTN',
  },
  {
    id: 'khtn-7-bai-8',
    topicId: 't7-2',
    grade: 7,
    domain: 'vat-li',
    code: 'KHTN7-B08',
    title: 'Bài 8: Tốc độ chuyển động & Đồ thị quãng đường - thời gian',
    summary:
      'Hiểu ý nghĩa vật lí của tốc độ đặc trưng cho sự nhanh chậm của chuyển động, vận dụng công thức v = s / t và cách đổi đơn vị giữa m/s và km/h.',
    objectives: [
      'Nêu được ý nghĩa của tốc độ chuyển động.',
      'Vận dụng được công thức v = s / t để giải các bài toán thực tế.',
      'Vẽ và đọc được đồ thị quãng đường - thời gian (s - t) của chuyển động thẳng đều.',
    ],
    durationMinutes: 45,
    sections: [
      {
        title: '1. Khái niệm, Công thức tính tốc độ & Quy đổi đơn vị',
        content: [
          'a) Ý nghĩa vật lí của tốc độ: Tốc độ là đại lượng vật lí đặc trưng cho mức độ nhanh hay chậm của chuyển động, được xác định bằng độ dài quãng đường vật đi được trong một đơn vị thời gian.',
          'b) Công thức tính tốc độ và các đại lượng dẫn xuất: Gọi s là quãng đường đi được và t là thời gian đi hết quãng đường đó, tốc độ chuyển động v được tính bằng thương số giữa s và t. Khi vật chuyển động trên nhiều đoạn đường liên tiếp, tốc độ trung bình tính bằng tổng quãng đường chia cho tổng thời gian.',
          'c) Đơn vị đo tốc độ hợp pháp: Trong hệ đơn vị quốc tế SI, đơn vị của tốc độ là mét trên giây (m/s). Trong giao thông, đơn vị thường dùng là kilômét trên giờ (km/h). Hệ số quy đổi chuẩn: 1 m/s = 3,6 km/h.',
        ],
        formula: 'v = \\frac{s}{t}   |   s = v × t   |   t = \\frac{s}{v}   |   v_tb = \\frac{s₁ + s₂}{t₁ + t₂}',
        formulaMeaning: 'v: tốc độ chuyển động (m/s hoặc km/h); s: quãng đường đi được (m hoặc km); t: thời gian chuyển động (s hoặc h); v_tb: tốc độ trung bình trên cả lộ trình.',
        keyPoints: [
          'Đổi từ m/s sang km/h: Nhân giá trị tốc độ với 3,6 (ví dụ: 10 m/s = 10 × 3,6 = 36 km/h).',
          'Đổi từ km/h sang m/s: Chia giá trị tốc độ cho 3,6 (ví dụ: 72 km/h = \\frac{72}{3,6} = 20 m/s).',
        ],
        imageUrl: domainPhysImg,
        imageCaption: 'Minh họa phép đo tốc độ chuyển động bằng cổng quang điện trong phòng thực hành Vật lí.',
      },
      {
        title: '2. Đồ thị quãng đường – thời gian (s – t) & Khoảng cách an toàn',
        content: [
          'a) Cách vẽ đồ thị quãng đường – thời gian: Trục nằm ngang Ot biểu diễn thời gian (t), trục thẳng đứng Os biểu diễn quãng đường (s). Với chuyển động có tốc độ không đổi, đồ thị s – t là một đường thẳng đi qua gốc tọa độ O(0; 0).',
          'b) Cách đọc đồ thị s – t: Đoạn thẳng nằm ngang song song với trục thời gian Ot biểu thị vật đang đứng yên (quãng đường s không thay đổi khi thời gian t tăng). Đường biểu diễn nào có độ dốc lớn hơn thì vật đó chuyển động với tốc độ lớn hơn.',
          'c) Quy tắc "3 giây" giữ khoảng cách an toàn giao thông: Khi điều khiển phương tiện trên đường cao tốc, khoảng cách an toàn tối thiểu giữa hai xe được ước tính theo công thức d_at = v × 3 (với v tính bằng m/s).',
        ],
        highlightBox: {
          title: 'Cảnh báo sai lầm thường gặp khi tính tốc độ trung bình',
          text: 'Tốc độ trung bình trên nhiều đoạn đường luôn tính theo công thức v_tb = (s₁ + s₂) / (t₁ + t₂) (kể cả thời gian nghỉ nếu có), tuyệt đối không lấy trung bình cộng (v₁ + v₂) / 2 khi thời gian đi trên các đoạn đường khác nhau.',
        },
      },
    ],
    keyTakeaways: [
      'Công thức tốc độ: v = \\frac{s}{t} ⇒ s = v × t và t = \\frac{s}{v}.',
      'Đổi đơn vị: 1 m/s = 3,6 km/h (ví dụ: 10 m/s = 36 km/h; 20 m/s = 72 km/h).',
    ],
    miniQuiz: [
      {
        id: 'mq-khtn7-b8-1',
        questionType: 'single_choice',
        question:
          'Một vận động viên xe đạp chuyển động đều trên đoạn đường thẳng dài 1,8 km hết thời gian 3 phút. Tốc độ của vận động viên tính theo đơn vị m/s là:',
        options: ['10 m/s', '15 m/s', '36 m/s', '6 m/s'],
        correctIndex: 0,
        explanation:
          'Đổi s = 1,8 km = 1800 m; t = 3 phút = 180 s ⇒ v = s / t = 1800 / 180 = 10 m/s.',
      },
      {
        id: 'mq-khtn7-b8-2',
        questionType: 'single_choice',
        question:
          'Một ô tô đang chạy trên đường cao tốc với tốc độ ổn định 72 km/h. Giá trị tốc độ này khi quy đổi sang đơn vị chuẩn m/s là:',
        options: ['20 m/s', '25 m/s', '15 m/s', '259,2 m/s'],
        correctIndex: 0,
        explanation:
          'Ta có 1 m/s = 3,6 km/h ⇒ v = 72 / 3,6 = 20 m/s.',
      },
      {
        id: 'mq-khtn7-b8-3',
        questionType: 'true_false',
        question:
          'Một người đi xe đạp chuyển động trên một đường thẳng: trong 2 giờ đầu đi được 24 km, sau đó dừng lại nghỉ 30 phút rồi đi tiếp 12 km trong 1 giờ. Xét tính Đúng/Sai của các nhận định sau:',
        options: [
          'Tốc độ của người đi xe đạp trong 2 giờ đầu là v₁ = 24 / 2 = 12 km/h.',
          'Trong khoảng thời gian 30 phút nghỉ ngơi, đồ thị quãng đường – thời gian (s – t) là một đoạn thẳng nằm ngang song song với trục thời gian Ot.',
          'Tổng quãng đường người đó đã đi được là 36 km và tổng thời gian tính cả lúc nghỉ là 3,5 giờ.',
          'Tốc độ trung bình trên cả quãng đường (tính cả thời gian nghỉ) bằng 12 km/h.',
        ],
        correctIndex: 0,
        trueFalseStatements: [
          {
            id: 'a',
            label: 'a',
            text: 'Tốc độ của người đi xe đạp trong 2 giờ đầu là v₁ = 24 / 2 = 12 km/h.',
            isTrue: true,
            explanation: 'Đúng, v₁ = s₁ / t₁ = 24 / 2 = 12 km/h.',
          },
          {
            id: 'b',
            label: 'b',
            text: 'Trong khoảng thời gian 30 phút nghỉ ngơi, đồ thị quãng đường – thời gian (s – t) là một đoạn thẳng nằm ngang song song với trục thời gian Ot.',
            isTrue: true,
            explanation: 'Đúng, khi vật đứng yên thì quãng đường s không đổi theo thời gian t.',
          },
          {
            id: 'c',
            label: 'c',
            text: 'Tổng quãng đường người đó đã đi được là 36 km và tổng thời gian tính cả lúc nghỉ là 3,5 giờ.',
            isTrue: true,
            explanation: 'Đúng, s = 24 + 12 = 36 km; t = 2 + 0,5 + 1 = 3,5 h.',
          },
          {
            id: 'd',
            label: 'd',
            text: 'Tốc độ trung bình trên cả quãng đường (tính cả thời gian nghỉ) bằng 12 km/h.',
            isTrue: false,
            explanation: 'Sai vì v_tb = s_tổng / t_tổng = 36 / 3,5 ≈ 10,29 km/h (nhỏ hơn 12 km/h).',
          },
        ],
        explanation: 'Đáp án Đúng/Sai: a) Đúng | b) Đúng | c) Đúng | d) Sai (v_tb = 36 / 3,5 ≈ 10,29 km/h).',
      },
      {
        id: 'mq-khtn7-b8-4',
        questionType: 'essay',
        question:
          'Lúc 7 giờ sáng, một xe máy khởi hành từ địa điểm A đi đến địa điểm B cách A một khoảng 54 km với tốc độ không đổi v = 36 km/h. a) Đổi tốc độ của xe máy ra đơn vị m/s; b) Tính thời gian xe máy đi từ A đến B và cho biết xe đến B lúc mấy giờ?',
        options: [],
        correctIndex: 0,
        sampleAnswer:
          'a) Đổi đơn vị tốc độ: v = 36 km/h = 36 / 3,6 = 10 m/s.\nb) Thời gian xe máy đi từ A đến B là: t = s / v = 54 / 36 = 1,5 (giờ) = 1 giờ 30 phút.\n- Thời điểm xe máy đến B là: 7 giờ + 1 giờ 30 phút = 8 giờ 30 phút sáng.',
        rubric:
          'Đổi đúng 36 km/h = 10 m/s (0,5đ); Tính đúng t = 1,5 giờ và kết luận đến B lúc 8 giờ 30 phút (0,5đ).',
        explanation:
          'v = 36 / 3,6 = 10 m/s; t = s / v = 54 / 36 = 1,5 h (1 giờ 30 phút) ⇒ Đến B lúc 8 giờ 30 phút.',
      },
    ],
    thumbnailUrl: domainPhysImg,
    simulationId: 'sim-light-refraction',
    videoUrl: 'https://www.youtube.com/embed/p3St51F4kE8',
    documentId: 'doc-khtn-7-1',
    quizCount: 4,
    viewCount: 3310,
    author: 'KHOA HỌC SỐ KHTN',
  },

  // LỚP 8
  {
    id: 'khtn-8-bai-5-btkl',
    topicId: 't8-1',
    grade: 8,
    domain: 'hoa-hoc',
    code: 'KHTN8-B05',
    title: 'Bài 5: Định luật bảo toàn khối lượng và phương trình hóa học',
    summary:
      'Khám phá Định luật bảo toàn khối lượng của Lomonosov – Lavoisier (m_trước = m_sau), bản chất bảo toàn số nguyên tử của mỗi nguyên tố và quy tắc 3 bước lập phương trình hóa học chuẩn quốc tế IUPAC.',
    objectives: [
      'Phát biểu và giải thích được Định luật bảo toàn khối lượng dựa trên sự bảo toàn số nguyên tử của các nguyên tố hóa học.',
      'Vận dụng biểu thức bảo toàn khối lượng (m_A + m_B = m_C + m_D) để tính khối lượng chất tham gia hoặc sản phẩm.',
      'Trình bày được các bước lập phương trình hóa học và xác định tỉ lệ số nguyên tử, số phân tử (số mol) giữa các chất trong phản ứng.',
    ],
    durationMinutes: 45,
    sections: [
      {
        title: '1. Định luật bảo toàn khối lượng (Lomonosov – Lavoisier)',
        content: [
          'a) Thí nghiệm kiểm chứng và nội dung định luật: Khi cho dung dịch Barium chloride (BaCl₂) tác dụng với dung dịch Sodium sulfate (Na₂SO₄) tạo thành kết tủa trắng Barium sulfate (BaSO₄) và Sodium chloride (NaCl), tổng khối lượng các chất trước và sau phản ứng trên cân điện tử luôn bằng nhau. Nội dung định luật: Trong một phản ứng hóa học, tổng khối lượng của các chất sản phẩm bằng tổng khối lượng của các chất tham gia phản ứng.',
          'b) Giải thích bản chất của Định luật bảo toàn khối lượng: Trong các phản ứng hóa học, chỉ có liên kết giữa các nguyên tử thay đổi làm cho phân tử này biến đổi thành phân tử khác, còn số nguyên tử của mỗi nguyên tố hóa học trước và sau phản ứng luôn giữ nguyên, khối lượng của các nguyên tử không đổi nên tổng khối lượng các chất được bảo toàn.',
          'c) Áp dụng tính toán theo Định luật bảo toàn khối lượng: Xét phản ứng tổng quát A + B → C + D, biểu thức bảo toàn khối lượng là m_A + m_B = m_C + m_D. Trong một phản ứng có n chất, nếu biết khối lượng của (n - 1) chất thì ta luôn tính được khối lượng của chất còn lại.',
        ],
        keyPoints: [
          'Bản chất phản ứng hóa học: Liên kết giữa các nguyên tử thay đổi, nhưng số nguyên tử mỗi nguyên tố giữ nguyên ⇒ Tổng khối lượng được bảo toàn.',
          'Lưu ý khi có chất khí thoát ra (↑) hoặc khí Oxygen (O₂) tham gia: Phải tính cả khối lượng chất khí vào biểu thức bảo toàn khối lượng.',
        ],
        formula: 'm_{\\text{tham gia}} = m_{\\text{sản phẩm}}   |   m_A + m_B = m_C + m_D   |   BaCl₂ + Na₂SO₄ → BaSO₄ ↓ + 2NaCl',
        formulaMeaning: 'Biểu thức Định luật bảo toàn khối lượng và phương trình hóa học thí nghiệm giữa Barium chloride với Sodium sulfate.',
        imageUrl: domainChemImg,
        imageCaption: 'Thí nghiệm cân khối lượng trước và sau phản ứng BaCl₂ + Na₂SO₄ trong KHOA HỌC SỐ KHTN.',
      },
      {
        title: '2. Phương trình hóa học & Các bước lập phương trình hóa học',
        content: [
          'a) Khái niệm Phương trình hóa học: Phương trình hóa học là cách biểu diễn ngắn gọn phản ứng hóa học bằng công thức hóa học của các chất tham gia và các chất sản phẩm cùng hệ số tỉ lượng thích hợp.',
          'b) Ba bước lập phương trình hóa học: Bước 1: Viết sơ đồ phản ứng gồm công thức hóa học của các chất tham gia và chất sản phẩm. Bước 2: Cân bằng số nguyên tử của mỗi nguyên tố ở hai vế bằng cách đặt hệ số thích hợp trước công thức hóa học (tuyệt đối không thay đổi chỉ số nguyên tử trong công thức). Bước 3: Viết thành phương trình hóa học hoàn chỉnh với mũi tên (→) và ghi điều kiện phản ứng (nếu có).',
          'c) Ý nghĩa của Phương trình hóa học: Phương trình hóa học cho biết tỉ lệ về số nguyên tử, số phân tử (cũng chính là tỉ lệ số mol) giữa các chất tham gia và các chất sản phẩm trong phản ứng.',
        ],
        formula: '2H₂ + O₂ → (t°) 2H₂O   |   2Mg + O₂ → (t°) 2MgO   |   4Al + 3O₂ → (t°) 2Al₂O₃',
        formulaMeaning: 'Các phương trình hóa học đã cân bằng hệ số nguyên tử của từng nguyên tố ở hai vế.',
        highlightBox: {
          title: 'Quy tắc vàng khi cân bằng phương trình hóa học',
          text: 'Khi cân bằng phương trình hóa học, chỉ được điền hệ số ở phía trước công thức hóa học của chất (ví dụ: 2H₂O), tuyệt đối không được tự ý thay đổi chỉ số chân (như sửa H₂O thành H₂O₂). Nếu có nhóm nguyên tử (như -OH, =SO₄, -NO₃, =CO₃) giữ nguyên ở cả hai vế thì coi cả nhóm như một đơn vị để cân bằng nhanh.',
        },
      },
    ],
    keyTakeaways: [
      'Định luật bảo toàn khối lượng: m_tham_gia = m_sản_phẩm (do số nguyên tử của mỗi nguyên tố trước và sau phản ứng không đổi).',
      'Khi lập phương trình hóa học: Đặt hệ số trước công thức hóa học sao cho số nguyên tử của mỗi nguyên tố ở hai vế bằng nhau.',
      'Hệ số trong phương trình hóa học chính là tỉ lệ số nguyên tử, số phân tử và tỉ lệ số mol giữa các chất.',
    ],
    miniQuiz: [
      {
        id: 'mq-khtn8-btkl-1',
        questionType: 'single_choice',
        question:
          'Khi đốt cháy hoàn toàn 12 gam Carbon (C) trong khí Oxygen (O₂) vừa đủ thì thu được 44 gam khí Carbon dioxide (CO₂). Theo Định luật bảo toàn khối lượng, khối lượng khí Oxygen (O₂) đã tham gia phản ứng là:',
        options: ['32 gam', '56 gam', '22 gam', '16 gam'],
        correctIndex: 0,
        explanation:
          'PTHH: C + O₂ → (t°) CO₂. Áp dụng Định luật bảo toàn khối lượng: m_C + m_O₂ = m_CO₂ ⇒ m_O₂ = 44 - 12 = 32 gam.',
      },
      {
        id: 'mq-khtn8-btkl-2',
        questionType: 'single_choice',
        question:
          'Cho sơ đồ phản ứng hóa học sau: Al + O₂ --(t°)--> Al₂O₃. Hệ số cân bằng tối giản của các chất trong phương trình hóa học lần lượt là:',
        options: ['4, 3, 2', '2, 3, 2', '4, 2, 2', '2, 1, 1'],
        correctIndex: 0,
        explanation:
          'Cân bằng số nguyên tử Oxygen (BCNN của 2 và 3 là 6): đặt 3 trước O₂ và 2 trước Al₂O₃, sau đó đặt 4 trước Al ⇒ 4Al + 3O₂ → (t°) 2Al₂O₃ (hệ số 4, 3, 2).',
      },
      {
        id: 'mq-khtn8-btkl-3',
        questionType: 'true_false',
        question:
          'Xét phản ứng hóa học giữa dung dịch Barium chloride (BaCl₂) và dung dịch Sodium sulfate (Na₂SO₄) tạo thành kết tủa Barium sulfate (BaSO₄) và Sodium chloride (NaCl). Xét tính Đúng/Sai của các phát biểu sau:',
        options: [
          'Phương trình hóa học đã cân bằng của phản ứng là: BaCl₂ + Na₂SO₄ → BaSO₄ ↓ + 2NaCl.',
          'Trong phản ứng trên, số nguyên tử của mỗi nguyên tố Ba, Cl, Na, S, O trước và sau phản ứng đều được giữ nguyên.',
          'Tổng khối lượng của các chất sản phẩm nhỏ hơn tổng khối lượng chất tham gia do tạo thành chất kết tủa.',
          'Nếu dùng 20,8 gam BaCl₂ phản ứng vừa đủ với 14,2 gam Na₂SO₄ thu được 23,3 gam BaSO₄ thì khối lượng NaCl tạo thành là 11,7 gam.',
        ],
        correctIndex: 0,
        trueFalseStatements: [
          {
            id: 'a',
            label: 'a',
            text: 'Phương trình hóa học đã cân bằng của phản ứng là: BaCl₂ + Na₂SO₄ → BaSO₄ ↓ + 2NaCl.',
            isTrue: true,
            explanation: 'Đúng, đặt hệ số 2 trước NaCl thì số nguyên tử của mọi nguyên tố hai vế bằng nhau.',
          },
          {
            id: 'b',
            label: 'b',
            text: 'Trong phản ứng trên, số nguyên tử của mỗi nguyên tố Ba, Cl, Na, S, O trước và sau phản ứng đều được giữ nguyên.',
            isTrue: true,
            explanation: 'Đúng, chỉ có liên kết giữa các nguyên tử thay đổi còn số nguyên tử mỗi nguyên tố bảo toàn.',
          },
          {
            id: 'c',
            label: 'c',
            text: 'Tổng khối lượng của các chất sản phẩm nhỏ hơn tổng khối lượng chất tham gia do tạo thành chất kết tủa.',
            isTrue: false,
            explanation: 'Sai, theo Định luật bảo toàn khối lượng thì tổng khối lượng sản phẩm luôn bằng tổng khối lượng chất tham gia.',
          },
          {
            id: 'd',
            label: 'd',
            text: 'Nếu dùng 20,8 gam BaCl₂ phản ứng vừa đủ với 14,2 gam Na₂SO₄ thu được 23,3 gam BaSO₄ thì khối lượng NaCl tạo thành là 11,7 gam.',
            isTrue: true,
            explanation: 'Đúng, m_NaCl = (20,8 + 14,2) - 23,3 = 35,0 - 23,3 = 11,7 gam.',
          },
        ],
        explanation: 'Đáp án Đúng/Sai: a) Đúng | b) Đúng | c) Sai | d) Đúng (m_NaCl = 20,8 + 14,2 - 23,3 = 11,7 g).',
      },
      {
        id: 'mq-khtn8-btkl-4',
        questionType: 'essay',
        question:
          'Nung nóng 10 gam đá vôi chứa Calcium carbonate (CaCO₃) thu được 5,6 gam vôi sống là Calcium oxide (CaO) và một lượng khí Carbon dioxide (CO₂) thoát ra ngoài. a) Lập phương trình hóa học của phản ứng; b) Viết công thức khối lượng của các chất trong phản ứng; c) Tính khối lượng khí Carbon dioxide (CO₂) thoát ra.',
        options: [],
        correctIndex: 0,
        sampleAnswer:
          'a) Phương trình hóa học: CaCO₃ → (t°) CaO + CO₂ ↑\nb) Theo Định luật bảo toàn khối lượng, ta có công thức khối lượng: m(CaCO₃) = m(CaO) + m(CO₂).\nc) Khối lượng khí Carbon dioxide thoát ra là: m(CO₂) = m(CaCO₃) - m(CaO) = 10 - 5,6 = 4,4 (gam).',
        rubric:
          'Viết đúng PTHH CaCO₃ → (t°) CaO + CO₂ ↑ và công thức bảo toàn khối lượng (0,5đ); Tính đúng m(CO₂) = 4,4 gam (0,5đ).',
        explanation:
          'a) CaCO₃ → (t°) CaO + CO₂ ↑. b) m(CaCO₃) = m(CaO) + m(CO₂). c) m(CO₂) = 10 - 5,6 = 4,4 gam.',
      },
    ],
    thumbnailUrl: domainChemImg,
    simulationId: 'sim-chemical-equation-3d',
    documentId: 'doc-khtn-8-btkl',
    quizCount: 4,
    viewCount: 6180,
    author: 'KHOA HỌC SỐ KHTN',
  },
  {
    id: 'khtn-8-bai-5',
    topicId: 't8-1',
    grade: 8,
    domain: 'hoa-hoc',
    code: 'KHTN8-B08',
    title: 'Bài 8: Acid - Base - Thang pH - Oxide - Muối (Danh pháp IUPAC)',
    summary:
      'Nghiên cứu tính chất hóa học của Acid (Hydrochloric acid HCl, Sulfuric acid H₂SO₄, Acetic acid CH₃COOH), Base (Sodium hydroxide NaOH, Potassium hydroxide KOH, Calcium hydroxide Ca(OH)₂), thang đo pH, Oxide và Muối.',
    objectives: [
      'Nêu được khái niệm Acid (tạo ion H⁺) và Base (tạo ion OH⁻) trong dung dịch nước.',
      'Trình bày được sự đổi màu của chất chỉ thị Quỳ tím, Phenolphthalein và ý nghĩa của thang pH (1 → 14).',
      'Đọc tên chuẩn quốc tế IUPAC của các Acid, Base, Oxide và Muối thông dụng.',
    ],
    durationMinutes: 45,
    sections: [
      {
        title: '1. Dung dịch Acid, Dung dịch Base & Thang đo pH theo chuẩn IUPAC',
        content: [
          'a) Khái niệm và tính chất hóa học của Acid: Acid là những hợp chất trong phân tử có nguyên tử Hydrogen liên kết với gốc acid; khi tan trong nước, Acid phân li tạo ra ion H⁺. Các Acid quan trọng theo danh pháp IUPAC: Hydrochloric acid (HCl), Sulfuric acid (H₂SO₄), Nitric acid (HNO₃), Phosphoric acid (H₃PO₄), Acetic acid (CH₃COOH). Dung dịch Acid làm giấy quỳ tím chuyển sang màu đỏ, tác dụng với kim loại đứng trước H (như Mg, Al, Zn, Fe) giải phóng khí Hydrogen (H₂).',
          'b) Khái niệm và tính chất hóa học của Base: Base là những hợp chất trong phân tử có nguyên tử kim loại liên kết với một hay nhiều nhóm Hydroxide (-OH); khi tan trong nước, các Base tan (kiềm) tạo ra ion OH⁻. Các Base quan trọng: Sodium hydroxide (NaOH), Potassium hydroxide (KOH), Calcium hydroxide (Ca(OH)₂), Barium hydroxide (Ba(OH)₂), Copper(II) hydroxide (Cu(OH)₂ - kết tủa xanh lam), Iron(III) hydroxide (Fe(OH)₃ - kết tủa nâu đỏ). Dung dịch kiềm làm quỳ tím hóa xanh và dung dịch Phenolphthalein không màu chuyển sang màu hồng.',
          'c) Ý nghĩa của thang đo pH (từ 1 đến 14): Thang pH dùng để biểu thị độ acid hoặc độ base của dung dịch. Môi trường Acid có pH < 7 (pH càng nhỏ độ acid càng mạnh); Môi trường trung tính (nước tinh khiết, dung dịch NaCl) có pH = 7; Môi trường Base (kiềm) có pH > 7.',
        ],
        keyPoints: [
          'Nhận biết nhanh bằng chất chỉ thị: Acid (pH < 7) làm quỳ tím hóa đỏ; Base kiềm (pH > 7) làm quỳ tím hóa xanh và Phenolphthalein hóa hồng.',
          'Phản ứng trung hòa giữa Acid và Base luôn tạo thành Muối và Nước, đồng thời tỏa nhiệt.',
        ],
        formula: 'HCl + NaOH → NaCl + H₂O   |   Zn + H₂SO₄ → ZnSO₄ + H₂ ↑   |   n = \\frac{m}{M}   |   C_M = \\frac{n}{V}',
        formulaMeaning: 'Phản ứng trung hòa Acid - Base, phản ứng kim loại tác dụng với Acid loãng và công thức tính số mol n (mol), nồng độ mol C_M (mol/L).',
        imageUrl: grade8Img,
        imageCaption: 'Thí nghiệm chuẩn độ Acid - Base và đo pH điện tử trong KHOA HỌC SỐ KHTN.',
      },
      {
        title: '2. Phân loại Oxide và Muối theo danh pháp quốc tế IUPAC',
        content: [
          'a) Khái niệm và phân loại Oxide: Oxide là hợp chất của hai nguyên tố, trong đó có một nguyên tố là Oxygen. Gồm 4 nhóm chính: Oxide acid (CO₂ - Carbon dioxide, SO₂ - Sulfur dioxide, SO₃ - Sulfur trioxide, P₂O₅ - Diphosphorus pentoxide); Oxide base (CaO - Calcium oxide, CuO - Copper(II) oxide, Fe₂O₃ - Iron(III) oxide, Na₂O - Sodium oxide); Oxide lưỡng tính (Al₂O₃ - Aluminium oxide, ZnO - Zinc oxide); và Oxide trung tính (CO - Carbon monoxide, NO - Nitrogen monoxide).',
          'b) Khái niệm và tính chất của Muối: Muối là hợp chất được hình thành khi thay thế ion H⁺ của Acid bằng ion kim loại hoặc ion Ammonium (NH₄⁺). Tên muối theo chuẩn IUPAC = Tên kim loại (kèm hóa trị La Mã nếu kim loại đa hóa trị) + Tên gốc acid: Sodium chloride (NaCl), Calcium carbonate (CaCO₃), Copper(II) sulfate (CuSO₄), Iron(III) chloride (FeCl₃), Silver nitrate (AgNO₃), Barium sulfate (BaSO₄ - kết tủa trắng).',
          'c) Điều kiện phản ứng trao đổi trong dung dịch: Phản ứng trao đổi giữa các dung dịch muối, acid, base chỉ xảy ra khi sản phẩm tạo thành có ít nhất một chất kết tủa (↓), chất khí bay hơi (↑) hoặc chất điện li yếu như nước (H₂O).',
        ],
        formula: 'CuO + 2HCl → (t°) CuCl₂ + H₂O   |   CO₂ + Ca(OH)₂ → CaCO₃ ↓ + H₂O   |   BaCl₂ + H₂SO₄ → BaSO₄ ↓ + 2HCl',
        formulaMeaning: 'Phương trình hóa học đặc trưng của Oxide base tác dụng với Acid, Oxide acid tác dụng với dung dịch kiềm và phản ứng nhận biết gốc Sulfate (=SO₄).',
        highlightBox: {
          title: 'Công thức chuẩn thể tích mol chất khí ở điều kiện chuẩn (25°C, 1 bar)',
          text: 'Trong chương trình GDPT 2018 (Kết nối tri thức với cuộc sống), ở điều kiện chuẩn (25°C và 1 bar), 1 mol của bất kì chất khí nào cũng chiếm thể tích V = 24,79 lít ⇒ Công thức tính: V = 24,79 × n (lít).',
        },
      },
    ],
    keyTakeaways: [
      'Acid phân li ra ion H⁺ (pH < 7, quỳ tím hóa đỏ): Hydrochloric acid (HCl), Sulfuric acid (H₂SO₄), Nitric acid (HNO₃).',
      'Base kiềm phân li ra ion OH⁻ (pH > 7, quỳ tím hóa xanh, Phenolphthalein hóa hồng): Sodium hydroxide (NaOH), Calcium hydroxide (Ca(OH)₂).',
      'Công thức tính toán hóa học chuẩn: n = \\frac{m}{M}; V_khí (đkc) = 24,79 × n; C_M = \\frac{n}{V}.',
    ],
    miniQuiz: [
      {
        id: 'mq-khtn8-b5-1',
        questionType: 'single_choice',
        question:
          'Cho các dung dịch sau: Hydrochloric acid (HCl), Sulfuric acid (H₂SO₄), Sodium hydroxide (NaOH), Calcium hydroxide (Ca(OH)₂). Nhóm các dung dịch có pH > 7 và làm dung dịch Phenolphthalein không màu chuyển sang màu hồng là:',
        options: [
          'Sodium hydroxide (NaOH) và Calcium hydroxide (Ca(OH)₂)',
          'Hydrochloric acid (HCl) và Sulfuric acid (H₂SO₄)',
          'Hydrochloric acid (HCl) và Sodium hydroxide (NaOH)',
          'Sulfuric acid (H₂SO₄) và Calcium hydroxide (Ca(OH)₂)',
        ],
        correctIndex: 0,
        explanation:
          'NaOH và Ca(OH)₂ là hai Base tan (kiềm), phân li ra ion OH⁻ nên có pH > 7 và làm Phenolphthalein hóa hồng.',
      },
      {
        id: 'mq-khtn8-b5-2',
        questionType: 'single_choice',
        question:
          'Cho 5,6 gam Iron (Fe = 56) phản ứng hoàn toàn với dung dịch Hydrochloric acid (HCl) dư tạo thành muối Iron(II) chloride (FeCl₂) và khí Hydrogen (H₂). Thể tích khí Hydrogen thu được ở điều kiện chuẩn (25°C, 1 bar; 1 mol khí chiếm 24,79 L) là:',
        options: ['2,479 lít', '2,240 lít', '4,958 lít', '1,2395 lít'],
        correctIndex: 0,
        explanation:
          'n_Fe = 5,6 / 56 = 0,1 mol. PTHH: Fe + 2HCl → FeCl₂ + H₂↑ ⇒ n_H₂ = 0,1 mol ⇒ V_H₂ (đkc) = 0,1 × 24,79 = 2,479 lít.',
      },
      {
        id: 'mq-khtn8-b5-3',
        questionType: 'true_false',
        question:
          'Tiến hành thí nghiệm khảo sát tính chất của dung dịch Hydrochloric acid (HCl) và dung dịch Sodium hydroxide (NaOH). Xét tính Đúng/Sai của các phát biểu sau:',
        options: [
          'Dung dịch HCl có giá trị pH < 7 và làm giấy quỳ tím chuyển sang màu đỏ.',
          'Dung dịch NaOH làm dung dịch Phenolphthalein từ không màu chuyển sang màu hồng cánh sen.',
          'Kim loại Copper (Cu) tan mạnh trong dung dịch HCl loãng giải phóng khí Hydrogen (H₂).',
          'Phản ứng trung hòa giữa HCl và NaOH tạo thành muối Sodium chloride (NaCl) và nước: HCl + NaOH → NaCl + H₂O.',
        ],
        correctIndex: 0,
        trueFalseStatements: [
          {
            id: 'a',
            label: 'a',
            text: 'Dung dịch HCl có giá trị pH < 7 và làm giấy quỳ tím chuyển sang màu đỏ.',
            isTrue: true,
            explanation: 'Đúng, HCl phân li ra ion H⁺ làm quỳ tím hóa đỏ và pH < 7.',
          },
          {
            id: 'b',
            label: 'b',
            text: 'Dung dịch NaOH làm dung dịch Phenolphthalein từ không màu chuyển sang màu hồng cánh sen.',
            isTrue: true,
            explanation: 'Đúng, NaOH là base kiềm (pH > 7) làm Phenolphthalein hóa hồng.',
          },
          {
            id: 'c',
            label: 'c',
            text: 'Kim loại Copper (Cu) tan mạnh trong dung dịch HCl loãng giải phóng khí Hydrogen (H₂).',
            isTrue: false,
            explanation: 'Sai vì Copper (Cu) đứng sau Hydrogen trong dãy hoạt động hóa học nên không tác dụng với dung dịch HCl.',
          },
          {
            id: 'd',
            label: 'd',
            text: 'Phản ứng trung hòa giữa HCl và NaOH tạo thành muối Sodium chloride (NaCl) và nước: HCl + NaOH → NaCl + H₂O.',
            isTrue: true,
            explanation: 'Đúng theo phương trình phản ứng trung hòa Acid - Base.',
          },
        ],
        explanation: 'Đáp án Đúng/Sai: a) Đúng | b) Đúng | c) Sai (Cu không phản ứng với HCl) | d) Đúng.',
      },
      {
        id: 'mq-khtn8-b5-4',
        questionType: 'essay',
        question:
          'Cho 6,5 gam kim loại Zinc (Kẽm - Zn = 65) tác dụng vừa đủ với 200 mL dung dịch Hydrochloric acid (HCl), thu được muối Zinc chloride (ZnCl₂) và khí Hydrogen (H₂) ở điều kiện chuẩn (25°C, 1 bar). a) Viết phương trình hóa học; b) Tính thể tích khí Hydrogen thu được ở đkc; c) Tính nồng độ mol (CM) của dung dịch HCl đã dùng.',
        options: [],
        correctIndex: 0,
        sampleAnswer:
          'a) Phương trình hóa học: Zn + 2HCl → ZnCl₂ + H₂ ↑\n- Số mol Zinc phản ứng: n(Zn) = 6,5 / 65 = 0,1 (mol).\nb) Theo PTHH: n(H₂) = n(Zn) = 0,1 mol ⇒ Thể tích khí H₂ ở đkc: V(H₂) = 0,1 × 24,79 = 2,479 (L).\nc) Theo PTHH: n(HCl) = 2 × n(Zn) = 0,2 mol; Đổi 200 mL = 0,2 L ⇒ CM(HCl) = 0,2 / 0,2 = 1 (M).',
        rubric:
          'Viết đúng PTHH và tính n(Zn) = 0,1 mol (0,5đ); Tính đúng V(H₂) = 2,479 L và CM(HCl) = 1 M (0,5đ).',
        explanation:
          'a) Zn + 2HCl → ZnCl₂ + H₂ ↑. b) n(Zn) = 0,1 mol ⇒ V(H₂) = 0,1 × 24,79 = 2,479 L. c) n(HCl) = 0,2 mol ⇒ CM(HCl) = 0,2 / 0,200 = 1 M.',
      },
    ],
    thumbnailUrl: grade8Img,
    simulationId: 'sim-acid-base-ph',
    videoUrl: 'https://www.youtube.com/embed/ANi709MYnWg',
    documentId: 'doc-khtn-8-1',
    quizCount: 4,
    viewCount: 5640,
    author: 'KHOA HỌC SỐ KHTN',
  },
  {
    id: 'khtn-8-bai-8',
    topicId: 't8-2',
    grade: 8,
    domain: 'vat-li',
    code: 'KHTN8-B16',
    title: 'Bài 16: Áp suất chất lỏng, Lực đẩy Archimedes & Mạch điện',
    summary:
      'Tìm hiểu công thức tính áp suất p = F / S, lực đẩy Archimedes F_A = d × V tác dụng lên vật nhúng trong chất lỏng và cách đo cường độ dòng điện, hiệu điện thế trong mạch điện.',
    objectives: [
      'Tính được áp suất theo công thức p = F / S (đơn vị Pascal - Pa).',
      'Vận dụng được công thức lực đẩy Archimedes F_A = d × V để giải thích điều kiện vật nổi, vật chìm.',
      'Mắc đúng Ampe kế nối tiếp và Vôn kế song song trong mạch điện thực hành.',
    ],
    durationMinutes: 45,
    sections: [
      {
        title: '1. Khối lượng riêng, Áp suất trên một bề mặt & Áp suất chất lỏng',
        content: [
          'a) Khối lượng riêng và Trọng lượng riêng: Khối lượng riêng (D) của một chất được xác định bằng khối lượng (m) của một đơn vị thể tích (V) chất đó: D = \\frac{m}{V} (kg/m³ hoặc g/cm³). Trọng lượng riêng (d) là trọng lượng của một đơn vị thể tích: d = \\frac{P}{V} = 10 × D (N/m³).',
          'b) Áp lực và Áp suất trên một bề mặt: Áp lực (F) là lực ép có phương vuông góc với mặt bị ép. Áp suất (p) được tính bằng độ lớn của áp lực trên một đơn vị diện tích bị ép (S). Đơn vị đo áp suất là Pascal (1 Pa = 1 N/m²).',
          'c) Áp suất chất lỏng: Chất lỏng gây ra áp suất theo mọi phương lên đáy bình, thành bình và các vật ở trong lòng nó. Tại độ sâu h so với mặt thoáng chất lỏng có trọng lượng riêng d, áp suất chất lỏng là p = d × h.',
        ],
        formula: 'D = \\frac{m}{V}   |   p = \\frac{F}{S}   |   p_lỏng = d × h',
        formulaMeaning: 'D: khối lượng riêng (kg/m³); p: áp suất (Pa); F: áp lực vuông góc (N); S: diện tích mặt bị ép (m²); d: trọng lượng riêng chất lỏng (N/m³); h: độ sâu tính từ mặt thoáng (m).',
        keyPoints: [
          'Muốn tăng áp suất (mài sắc lưỡi dao, đầu đinh nhọn): tăng áp lực F hoặc giảm diện tích bị ép S.',
          'Muốn giảm áp suất (bánh xích xe tăng, kê ván rộng dưới chân tủ): tăng diện tích mặt bị ép S.',
        ],
        imageUrl: domainPhysImg,
        imageCaption: 'Mô phỏng khảo sát mạch điện và đo đại lượng vật lí trong KHOA HỌC SỐ KHTN.',
      },
      {
        title: '2. Lực đẩy Archimedes & Quy tắc đo dòng điện trong mạch',
        content: [
          'a) Định luật và Công thức lực đẩy Archimedes: Một vật nhúng vào chất lỏng bị chất lỏng đẩy thẳng đứng từ dưới lên với một lực (gọi là lực đẩy Archimedes, kí hiệu F_A) có độ lớn bằng trọng lượng của phần chất lỏng mà vật chiếm chỗ.',
          'b) Điều kiện định tính vật nổi, vật lơ lửng, vật chìm: Khi thả một vật đặc vào trong chất lỏng: Vật chìm xuống khi P > F_A (tương đương d_vật > d_lỏng); Vật lơ lửng trong chất lỏng khi P = F_A (d_vật = d_lỏng); Vật nổi lên trên mặt thoáng khi P < F_A (d_vật < d_lỏng).',
          'c) Đo cường độ dòng điện (I) và hiệu điện thế (U): Ampe kế dùng để đo cường độ dòng điện (đơn vị Ampere - A) và phải mắc nối tiếp với dụng cụ cần đo. Vôn kế dùng để đo hiệu điện thế (đơn vị Volt - V) và phải mắc song song với hai đầu dụng cụ cần đo.',
        ],
        formula: 'F_A = d_lỏng × V_chìm   |   Vật nổi khi: d_vật < d_lỏng (F_A > P)',
        formulaMeaning: 'F_A: độ lớn lực đẩy Archimedes (N); d_lỏng: trọng lượng riêng của chất lỏng (N/m³); V_chìm: thể tích phần chất lỏng bị vật chiếm chỗ (m³); P: trọng lượng của vật (N).',
        highlightBox: {
          title: 'Quy đổi nhanh đơn vị thể tích khi tính lực đẩy Archimedes',
          text: 'Trong công thức F_A = d × V, thể tích V bắt buộc phải đổi ra đơn vị chuẩn mét khối (m³): 1 dm³ = 1 lít = 10⁻³ m³ = 0,001 m³; 1 cm³ = 1 mL = 10⁻⁶ m³ (ví dụ: 500 cm³ = 0,0005 m³).',
        },
      },
    ],
    keyTakeaways: [
      'Công thức áp suất: p = \\frac{F}{S} (Pa); Khối lượng riêng: D = \\frac{m}{V} (kg/m³).',
      'Công thức lực đẩy Archimedes: F_A = d_lỏng × V_chìm (N); vật nổi khi d_vật < d_lỏng.',
    ],
    miniQuiz: [
      {
        id: 'mq-khtn8-b8-1',
        questionType: 'single_choice',
        question:
          'Tác dụng một áp lực F = 600 N vuông góc lên một mặt sàn có diện tích bị ép S = 0,03 m². Áp suất p gây ra trên mặt sàn là:',
        options: ['20 000 Pa', '18 Pa', '2 000 Pa', '200 Pa'],
        correctIndex: 0,
        explanation:
          'Áp suất p = F / S = 600 / 0,03 = 20 000 Pa (20 kPa).',
      },
      {
        id: 'mq-khtn8-b8-2',
        questionType: 'single_choice',
        question:
          'Nhúng chìm hoàn toàn một khối kim loại có thể tích V = 0,002 m³ vào trong nước có trọng lượng riêng d = 10 000 N/m³. Độ lớn lực đẩy Archimedes (F_A) tác dụng lên khối kim loại là:',
        options: ['20 N', '200 N', '2 N', '5 000 N'],
        correctIndex: 0,
        explanation:
          'Áp dụng công thức lực đẩy Archimedes: F_A = d × V = 10 000 × 0,002 = 20 N.',
      },
      {
        id: 'mq-khtn8-b8-3',
        questionType: 'true_false',
        question:
          'Xét các phát biểu sau về áp suất, lực đẩy Archimedes và cách mắc dụng cụ đo điện:',
        options: [
          'Muốn tăng áp suất (ví dụ mài sắc lưỡi dao), ta giữ nguyên áp lực F và giảm diện tích mặt bị ép S.',
          'Lực đẩy Archimedes tác dụng lên vật nhúng trong chất lỏng có phương thẳng đứng, chiều từ trên xuống dưới.',
          'Khi trọng lượng riêng của vật nhỏ hơn trọng lượng riêng của chất lỏng (d_vật < d_lỏng), vật sẽ nổi lên.',
          'Trong mạch điện, Ampe kế được mắc nối tiếp còn Vôn kế được mắc song song với đoạn mạch cần đo.',
        ],
        correctIndex: 0,
        trueFalseStatements: [
          {
            id: 'a',
            label: 'a',
            text: 'Muốn tăng áp suất (ví dụ mài sắc lưỡi dao), ta giữ nguyên áp lực F và giảm diện tích mặt bị ép S.',
            isTrue: true,
            explanation: 'Đúng vì p = F / S, khi S giảm thì p tăng.',
          },
          {
            id: 'b',
            label: 'b',
            text: 'Lực đẩy Archimedes tác dụng lên vật nhúng trong chất lỏng có phương thẳng đứng, chiều từ trên xuống dưới.',
            isTrue: false,
            explanation: 'Sai vì lực đẩy Archimedes có phương thẳng đứng nhưng chiều hướng từ dưới lên trên.',
          },
          {
            id: 'c',
            label: 'c',
            text: 'Khi trọng lượng riêng của vật nhỏ hơn trọng lượng riêng của chất lỏng (d_vật < d_lỏng), vật sẽ nổi lên.',
            isTrue: true,
            explanation: 'Đúng, khi d_vật < d_lỏng thì F_A > P nên vật nổi lên.',
          },
          {
            id: 'd',
            label: 'd',
            text: 'Trong mạch điện, Ampe kế được mắc nối tiếp còn Vôn kế được mắc song song với đoạn mạch cần đo.',
            isTrue: true,
            explanation: 'Đúng theo quy tắc mắc dụng cụ đo điện.',
          },
        ],
        explanation: 'Đáp án Đúng/Sai: a) Đúng | b) Sai (chiều từ dưới lên trên) | c) Đúng | d) Đúng.',
      },
      {
        id: 'mq-khtn8-b8-4',
        questionType: 'essay',
        question:
          'Một khối gỗ hình hộp chữ nhật có thể tích V = 500 cm³ được nhấn chìm hoàn toàn trong bể nước (trọng lượng riêng của nước là d = 10 000 N/m³). a) Đổi thể tích V ra đơn vị m³ và tính độ lớn lực đẩy Archimedes tác dụng lên khối gỗ; b) Biết khối gỗ có khối lượng m = 350 g, khi buông tay ra thì khối gỗ sẽ nổi lên hay chìm xuống? Giải thích.',
        options: [],
        correctIndex: 0,
        sampleAnswer:
          'a) Đổi V = 500 cm³ = 0,0005 m³.\n- Lực đẩy Archimedes khi khối gỗ chìm hoàn toàn: F_A = d × V = 10 000 × 0,0005 = 5 (N).\nb) Trọng lượng của khối gỗ: m = 350 g = 0,35 kg ⇒ P = 10 × m = 3,5 (N).\n- Vì F_A = 5 N > P = 3,5 N nên khi buông tay, khối gỗ sẽ nổi lên trên mặt nước.',
        rubric:
          'Đổi đúng V = 0,0005 m³ và tính F_A = 5 N (0,5đ); Tính đúng P = 3,5 N, so sánh F_A > P và kết luận vật nổi (0,5đ).',
        explanation:
          'F_A = 10 000 × 0,0005 = 5 N; P = 10 × 0,35 = 3,5 N. Do F_A > P nên khối gỗ nổi lên.',
      },
    ],
    thumbnailUrl: domainPhysImg,
    simulationId: 'sim-electric-circuit',
    videoUrl: 'https://www.youtube.com/embed/HsLLq6Rm5tU',
    documentId: 'doc-khtn-8-1',
    quizCount: 4,
    viewCount: 4210,
    author: 'KHOA HỌC SỐ KHTN',
  },

  // LỚP 9
  {
    id: 'khtn-9-bai-4',
    topicId: 't9-1',
    grade: 9,
    domain: 'vat-li',
    code: 'KHTN9-B08',
    title: 'Bài 8: Khúc xạ ánh sáng, Điện trở & Định luật Ohm',
    summary:
      'Khảo sát định luật khúc xạ ánh sáng Snell (n₁.sin i = n₂.sin r), định luật Ohm cho đoạn mạch điện trở (I = U / R) và công thức tính công suất điện P = U × I.',
    objectives: [
      'Vận dụng được hệ thức định luật Ohm I = U / R cho đoạn mạch nối tiếp và song song.',
      'Tính được công suất điện P = U × I = I² × R và điện năng tiêu thụ.',
      'Thực hành chiếu tia Laser khảo sát khúc xạ và phản xạ toàn phần.',
    ],
    durationMinutes: 45,
    sections: [
      {
        title: '1. Định luật Ohm, Đoạn mạch nối tiếp – song song & Công suất điện',
        content: [
          'a) Hệ thức Định luật Ohm: Cường độ dòng điện (I) chạy qua một dây dẫn tỉ lệ thuận với hiệu điện thế (U) đặt vào hai đầu dây dẫn và tỉ lệ nghịch với điện trở (R) của dây dẫn đó. Điện trở của dây dẫn phụ thuộc vào chiều dài l, tiết diện S và điện trở suất ρ của vật liệu: R = ρ × \\frac{l}{S} (đơn vị Ohm - Ω).',
          'b) Đoạn mạch mắc nối tiếp và mắc song song: Với hai điện trở R₁, R₂ mắc nối tiếp: I = I₁ = I₂; U = U₁ + U₂ và điện trở tương đương R_tđ = R₁ + R₂. Với hai điện trở R₁, R₂ mắc song song: U = U₁ = U₂; I = I₁ + I₂ và R_tđ = \\frac{R₁ · R₂}{R₁ + R₂}.',
          'c) Công suất điện và Nhiệt lượng Jun – Lenxơ: Công suất tiêu thụ điện năng của một đoạn mạch bằng tích của hiệu điện thế giữa hai đầu đoạn mạch và cường độ dòng điện chạy qua nó: P = U × I = I² × R = \\frac{U²}{R} (đơn vị Watt - W). Nhiệt lượng tỏa ra trên điện trở R trong thời gian t là Q = I² × R × t (đơn vị Joule - J).',
        ],
        formula: 'I = \\frac{U}{R}   |   R_nt = R₁ + R₂   |   R_ss = \\frac{R₁ · R₂}{R₁ + R₂}   |   P = U × I = I² × R',
        formulaMeaning: 'I: cường độ dòng điện (A); U: hiệu điện thế (V); R: điện trở (Ω); R_nt, R_ss: điện trở tương đương mạch nối tiếp và song song (Ω); P: công suất điện (W).',
        keyPoints: [
          'Trong đoạn mạch nối tiếp, dòng điện có cùng cường độ ở mọi vị trí (I = I₁ = I₂).',
          'Trong đoạn mạch song song, hiệu điện thế giữa hai đầu mỗi nhánh bằng nhau (U = U₁ = U₂) và điện trở tương đương luôn nhỏ hơn mỗi điện trở thành phần.',
        ],
        imageUrl: domainPhysImg,
        imageCaption: 'Thực hành mạch điện Định luật Ohm và quang học khúc xạ ánh sáng 3D.',
      },
      {
        title: '2. Định luật khúc xạ ánh sáng Snell & Hiện tượng phản xạ toàn phần',
        content: [
          'a) Hiện tượng khúc xạ ánh sáng: Là hiện tượng tia sáng truyền từ môi trường trong suốt này sang môi trường trong suốt khác bị gãy khúc tại mặt phân cách giữa hai môi trường.',
          'b) Định luật khúc xạ ánh sáng (Snell): Tia khúc xạ nằm trong mặt phẳng tới (tạo bởi tia tới và pháp tuyến) và ở phía bên kia pháp tuyến so với tia tới. Với hai môi trường trong suốt nhất định, tỉ số giữa sin góc tới (sin i) và sin góc khúc xạ (sin r) luôn không đổi.',
          'c) Chiết suất và Phản xạ toàn phần: Khi tia sáng truyền từ không khí (n₁ ≈ 1) vào nước hoặc thủy tinh (n₂ > 1) thì góc khúc xạ nhỏ hơn góc tới (r < i). Ngược lại, khi truyền từ môi trường chiết quang hơn (n₁ > n₂) với góc tới lớn hơn hoặc bằng góc giới hạn (sin i_gh = \\frac{n₂}{n₁}) thì xảy ra phản xạ toàn phần.',
        ],
        formula: 'n₁ · sin(i) = n₂ · sin(r)   |   \\frac{sin(i)}{sin(r)} = \\frac{n₂}{n₁}   |   sin(i_gh) = \\frac{n₂}{n₁} (khi n₁ > n₂)',
        formulaMeaning: 'n₁: chiết suất môi trường chứa tia tới; n₂: chiết suất môi trường chứa tia khúc xạ; i: góc tới; r: góc khúc xạ; i_gh: góc giới hạn phản xạ toàn phần.',
        highlightBox: {
          title: 'Ứng dụng thực tiễn của phản xạ toàn phần',
          text: 'Hiện tượng phản xạ toàn phần là nguyên lí hoạt động cốt lõi của cáp quang truyền dữ liệu Internet tốc độ cao và ống nội soi y học.',
        },
      },
    ],
    keyTakeaways: [
      'Định luật Ohm: I = \\frac{U}{R}; Công suất điện: P = U × I = I² × R; Nhiệt lượng: Q = I² × R × t.',
      'Định luật khúc xạ ánh sáng Snell: n₁ · sin(i) = n₂ · sin(r).',
    ],
    miniQuiz: [
      {
        id: 'mq-khtn9-b4-1',
        questionType: 'single_choice',
        question:
          'Theo Định luật Ohm, khi đặt hiệu điện thế U = 12 V vào hai đầu đoạn mạch gồm hai điện trở R₁ = 8 Ω và R₂ = 16 Ω mắc nối tiếp thì cường độ dòng điện chạy trong mạch và công suất tiêu thụ của cả đoạn mạch lần lượt là:',
        options: [
          'I = 0,5 A và P = 6,0 W',
          'I = 1,5 A và P = 18,0 W',
          'I = 0,5 A và P = 12,0 W',
          'I = 2,0 A và P = 24,0 W',
        ],
        correctIndex: 0,
        explanation:
          'R_tđ = R₁ + R₂ = 8 + 16 = 24 Ω; I = U / R_tđ = 12 / 24 = 0,5 A; P = U × I = 12 × 0,5 = 6,0 W.',
      },
      {
        id: 'mq-khtn9-b4-2',
        questionType: 'single_choice',
        question:
          'Chiếu một tia sáng từ không khí (chiết suất n₁ ≈ 1) vào mặt nước (chiết suất n₂ = 4/3) với góc tới i = 30°. Giá trị sin(r) của góc khúc xạ r là:',
        options: ['sin(r) = 3/8 = 0,375', 'sin(r) = 2/3 ≈ 0,667', 'sin(r) = 1/2 = 0,500', 'sin(r) = 3/4 = 0,750'],
        correctIndex: 0,
        explanation:
          'Theo định luật khúc xạ ánh sáng: n₁ · sin(i) = n₂ · sin(r) ⇒ 1 · sin(30°) = (4/3) · sin(r) ⇒ sin(r) = 0,5 / (4/3) = 3/8 = 0,375.',
      },
      {
        id: 'mq-khtn9-b4-3',
        questionType: 'true_false',
        question:
          'Cho đoạn mạch gồm hai điện trở R₁ = 6 Ω và R₂ = 12 Ω mắc song song vào hiệu điện thế U = 12 V. Xét tính Đúng/Sai của các phát biểu sau:',
        options: [
          'Điện trở tương đương của đoạn mạch song song là R_tđ = (R₁ · R₂) / (R₁ + R₂) = 4 Ω.',
          'Hiệu điện thế giữa hai đầu mỗi điện trở bằng nhau và bằng U₁ = U₂ = 12 V.',
          'Cường độ dòng điện chạy qua R₁ là I₁ = 1 A và qua R₂ là I₂ = 2 A.',
          'Công suất điện tiêu thụ của toàn mạch là P = U · I = 12 × 3 = 36 W.',
        ],
        correctIndex: 0,
        trueFalseStatements: [
          {
            id: 'a',
            label: 'a',
            text: 'Điện trở tương đương của đoạn mạch song song là R_tđ = (R₁ · R₂) / (R₁ + R₂) = 4 Ω.',
            isTrue: true,
            explanation: 'Đúng, R_tđ = (6 × 12) / (6 + 12) = 72 / 18 = 4 Ω.',
          },
          {
            id: 'b',
            label: 'b',
            text: 'Hiệu điện thế giữa hai đầu mỗi điện trở bằng nhau và bằng U₁ = U₂ = 12 V.',
            isTrue: true,
            explanation: 'Đúng vì R₁ mắc song song với R₂.',
          },
          {
            id: 'c',
            label: 'c',
            text: 'Cường độ dòng điện chạy qua R₁ là I₁ = 1 A và qua R₂ là I₂ = 2 A.',
            isTrue: false,
            explanation: 'Sai vì I₁ = U / R₁ = 12 / 6 = 2 A và I₂ = U / R₂ = 12 / 12 = 1 A.',
          },
          {
            id: 'd',
            label: 'd',
            text: 'Công suất điện tiêu thụ của toàn mạch là P = U · I = 12 × 3 = 36 W.',
            isTrue: true,
            explanation: 'Đúng vì I = I₁ + I₂ = 2 + 1 = 3 A ⇒ P = 12 × 3 = 36 W.',
          },
        ],
        explanation: 'Đáp án Đúng/Sai: a) Đúng | b) Đúng | c) Sai (I₁ = 2 A, I₂ = 1 A) | d) Đúng.',
      },
      {
        id: 'mq-khtn9-b4-4',
        questionType: 'essay',
        question:
          'Cho đoạn mạch gồm hai điện trở R₁ = 6 Ω và R₂ = 12 Ω mắc song song với nhau vào nguồn điện một chiều có hiệu điện thế không đổi U = 12 V. a) Tính điện trở tương đương R_tđ của đoạn mạch; b) Tính cường độ dòng điện qua mỗi điện trở (I₁, I₂) và cường độ dòng điện mạch chính (I); c) Tính nhiệt lượng Q tỏa ra trên cả đoạn mạch trong thời gian 5 phút.',
        options: [],
        correctIndex: 0,
        sampleAnswer:
          'a) Điện trở tương đương: R_tđ = (R₁ × R₂) / (R₁ + R₂) = (6 × 12) / (6 + 12) = 4 (Ω).\nb) Cường độ dòng điện: I₁ = U / R₁ = 12 / 6 = 2 (A); I₂ = U / R₂ = 12 / 12 = 1 (A) ⇒ I = I₁ + I₂ = 3 (A).\nc) Đổi t = 5 phút = 300 s ⇒ Nhiệt lượng tỏa ra: Q = U × I × t = 12 × 3 × 300 = 10 800 (J) = 10,8 (kJ).',
        rubric:
          'Tính đúng R_tđ = 4 Ω (0,25đ); Tính đúng I₁ = 2 A, I₂ = 1 A, I = 3 A (0,5đ); Tính đúng Q = 10 800 J (0,25đ).',
        explanation:
          'a) R(tđ) = 4 Ω. b) I₁ = 2 A; I₂ = 1 A; I = 3 A. c) Q = U · I · t = 12 × 3 × 300 = 10 800 J.',
      },
    ],
    thumbnailUrl: domainPhysImg,
    simulationId: 'sim-khuc-xa-anh-sang-3d',
    videoUrl: 'https://www.youtube.com/embed/HsLLq6Rm5tU',
    documentId: 'doc-khtn-9-1',
    quizCount: 4,
    viewCount: 5190,
    author: 'KHOA HỌC SỐ KHTN',
  },
  {
    id: 'khtn-9-bai-8',
    topicId: 't9-3',
    grade: 9,
    domain: 'sinh-hoc',
    code: 'KHTN9-B36',
    title: 'Bài 36: Hợp chất hữu cơ IUPAC & Cấu trúc phân tử DNA - RNA - Di truyền Mendel',
    summary:
      'Tổng hợp danh pháp hợp chất hữu cơ (Methane CH₄, Ethylene C₂H₄, Ethylic alcohol C₂H₅OH, Acetic acid CH₃COOH, Glucose C₆H₁₂O₆) và cấu trúc xoắn kép phân tử DNA (Adenine, Thymine, Guanine, Cytosine) theo nguyên tắc bổ sung.',
    objectives: [
      'Viết được công thức cấu tạo và phương trình hóa học của Methane, Ethylene, Ethylic alcohol (Ethanol), Acetic acid và Glucose.',
      'Mô tả được cấu trúc xoắn kép của phân tử DNA và cơ chế phiên mã tạo RNA.',
      'Vận dụng công thức N = 2A + 2G và H = 2A + 3G để giải bài tập phân tử DNA.',
    ],
    durationMinutes: 45,
    sections: [
      {
        title: '1. Cấu trúc không gian xoắn kép phân tử DNA & Phiên mã RNA',
        content: [
          'a) Cấu tạo hóa học và cấu trúc xoắn kép của DNA: Phân tử DNA (Deoxyribonucleic acid) gồm 2 mạch polynucleotide xoắn song song ngược chiều quanh một trục tưởng tượng (mỗi chu kì xoắn dài 34 Å gồm 10 cặp nucleotide, chiều dài mỗi cặp nucleotide là 3,4 Å). Đơn phân của DNA gồm 4 loại Nucleotide: Adenine (A), Thymine (T), Guanine (G) và Cytosine (C).',
          'b) Nguyên tắc bổ sung (Watson – Crick): Giữa hai mạch đơn của phân tử DNA, các Nucleotide liên kết với nhau thành từng cặp theo nguyên tắc bổ sung: Adenine (A) luôn liên kết với Thymine (T) bằng 2 liên kết Hydrogen; Guanine (G) luôn liên kết với Cytosine (C) bằng 3 liên kết Hydrogen. Do đó trong phân tử DNA mạch kép luôn có: A = T và G = C.',
          'c) Cấu trúc phân tử RNA và Cơ chế phiên mã: Phân tử RNA (Ribonucleic acid) có cấu trúc 1 mạch polynucleotide được tổng hợp từ mạch khuôn của gen (DNA) thông qua quá trình phiên mã, cấu tạo từ 4 loại đơn phân: Adenine (A), Uracil (U), Guanine (G) và Cytosine (C).',
        ],
        formula: 'N = 2A + 2G   |   L = \\frac{N}{2} × 3,4 (Å)   |   H = 2A + 3G   |   %A + %G = 50%',
        formulaMeaning: 'N: tổng số Nucleotide của gen; L: chiều dài đoạn phân tử DNA (1 Å = 10⁻⁴ μm = 10⁻¹ nm); H: tổng số liên kết Hydrogen giữa hai mạch DNA.',
        keyPoints: [
          'Hệ quả nguyên tắc bổ sung trong DNA mạch kép: A = T, G = C ⇒ A + G = T + C = \\frac{N}{2} (50% tổng số Nucleotide).',
          'Trong quá trình phiên mã tổng hợp RNA: A_mạch gốc liên kết với U_RNA; T_mạch gốc liên kết với A_RNA; G ↔ C.',
        ],
        imageUrl: grade9Img,
        imageCaption: 'Mô hình 3D chuỗi xoắn kép phân tử DNA và các cặp base bổ sung A-T, G-C.',
      },
      {
        title: '2. Các hợp chất hữu cơ trọng tâm Lớp 9 theo danh pháp IUPAC',
        content: [
          'a) Hydrocarbon (Alkane & Alkene): Methane (CH₄) chỉ chứa các liên kết đơn C–H bền vững, đặc trưng bởi phản ứng đốt cháy tỏa nhiệt và phản ứng thế với Chlorine (Cl₂) ngoài ánh sáng. Ethylene (CH₂=CH₂ hay C₂H₄) có 1 liên kết đôi C=C kém bền, đặc trưng bởi phản ứng cộng làm mất màu dung dịch nước Bromine (Br₂) và phản ứng trùng hợp tạo nhựa Polyethylene (PE).',
          'b) Dẫn xuất Hydrocarbon (Ethylic alcohol & Acetic acid): Ethylic alcohol hay Ethanol (C₂H₅OH) tác dụng với kim loại mạnh như Sodium (Na) giải phóng khí H₂. Acetic acid (CH₃COOH) có đầy đủ tính chất của một acid yếu và tác dụng với Ethylic alcohol tạo ester Ethyl acetate (CH₃COOC₂H₅) có mùi thơm.',
          'c) Hợp chất Carbohydrate (Glucose, Saccharose, Tinh bột, Cellulose): Glucose (C₆H₁₂O₆) có trong máu người (~0,1%) và quả nho chín, tham gia phản ứng tráng bạc với dung dịch AgNO₃ trong NH₃ đun nóng tạo kết tủa bạc (Ag) sáng bóng.',
        ],
        formula: 'CH₂=CH₂ + Br₂ → CH₂Br–CH₂Br   |   CH₃COOH + C₂H₅OH ⇄ (H₂SO₄ đặc, t°) CH₃COOC₂H₅ + H₂O',
        formulaMeaning: 'Phương trình phản ứng cộng Bromine nhận biết khí Ethylene và phản ứng ester hóa điều chế Ethyl acetate.',
        highlightBox: {
          title: 'Phân biệt nhanh các chất hữu cơ bằng thuốc thử hóa học',
          text: 'Dùng giấy quỳ tím nhận biết Acetic acid (CH₃COOH hóa đỏ); dùng dung dịch nước Bromine (Br₂) nhận biết khí Ethylene (C₂H₄ làm mất màu nâu đỏ của dung dịch Br₂); dùng phản ứng tráng bạc (AgNO₃/NH₃, t°) nhận biết dung dịch Glucose (C₆H₁₂O₆).',
        },
      },
    ],
    keyTakeaways: [
      'Trong phân tử DNA mạch kép: A = T, G = C; Tổng số Nucleotide N = 2A + 2G; Chiều dài L = \\frac{N}{2} × 3,4 Å; Tổng liên kết Hydrogen H = 2A + 3G.',
      'Danh pháp hữu cơ chuẩn IUPAC: Methane (CH₄), Ethylene (C₂H₄), Ethylic alcohol / Ethanol (C₂H₅OH), Acetic acid (CH₃COOH), Ethyl acetate (CH₃COOC₂H₅), Glucose (C₆H₁₂O₆).',
    ],
    miniQuiz: [
      {
        id: 'mq-khtn9-b8-1',
        questionType: 'single_choice',
        question:
          'Đun nóng hỗn hợp gồm Acetic acid (CH₃COOH) và Ethylic alcohol (C₂H₅OH) có mặt dung dịch Sulfuric acid (H₂SO₄) đặc làm xúc tác thì thu được chất hữu cơ có mùi thơm đặc trưng. Tên gọi chuẩn IUPAC và công thức của ester đó là:',
        options: [
          'Ethyl acetate (CH₃COOC₂H₅)',
          'Sodium acetate (CH₃COONa)',
          'Ethylene (CH₂=CH₂)',
          'Methane (CH₄)',
        ],
        correctIndex: 0,
        explanation:
          'Phản ứng ester hóa: CH₃COOH + C₂H₅OH ⇄ CH₃COOC₂H₅ (Ethyl acetate) + H₂O (xúc tác H₂SO₄ đặc, t°).',
      },
      {
        id: 'mq-khtn9-b8-2',
        questionType: 'single_choice',
        question:
          'Một đoạn phân tử DNA (Deoxyribonucleic acid) ở sinh vật nhân thực có tổng số N = 3000 Nucleotide, trong đó số Nucleotide loại Adenine (A) = 600. Số Nucleotide loại Guanine (G) và tổng số liên kết Hydrogen (H) của đoạn DNA lần lượt là:',
        options: [
          'G = 900 Nucleotide và H = 3900 liên kết Hydrogen',
          'G = 600 Nucleotide và H = 3000 liên kết Hydrogen',
          'G = 900 Nucleotide và H = 3600 liên kết Hydrogen',
          'G = 1200 Nucleotide và H = 4200 liên kết Hydrogen',
        ],
        correctIndex: 0,
        explanation:
          'Từ 2A + 2G = 3000 ⇒ G = (3000 - 2×600)/2 = 900. Liên kết Hydrogen: H = 2A + 3G = 2×600 + 3×900 = 3900.',
      },
      {
        id: 'mq-khtn9-b8-3',
        questionType: 'true_false',
        question:
          'Xét tính Đúng/Sai của các phát biểu sau về cấu trúc phân tử DNA và tính chất các hợp chất hữu cơ:',
        options: [
          'Trong phân tử DNA mạch kép, Adenine (A) luôn liên kết bổ sung với Thymine (T) bằng 2 liên kết Hydrogen, còn Guanine (G) liên kết với Cytosine (C) bằng 3 liên kết Hydrogen.',
          'Khí Ethylene (CH₂=CH₂) có liên kết đôi C=C nên làm mất màu dung dịch nước Bromine (Br₂).',
          'Phân tử RNA có cấu trúc xoắn kép gồm 2 mạch đơn phân A, T, G, C giống hệt phân tử DNA.',
          'Dung dịch Glucose (C₆H₁₂O₆) tham gia phản ứng tráng bạc với dung dịch AgNO₃/NH₃ đun nóng tạo lớp bạc (Ag) sáng bóng.',
        ],
        correctIndex: 0,
        trueFalseStatements: [
          {
            id: 'a',
            label: 'a',
            text: 'Trong phân tử DNA mạch kép, Adenine (A) luôn liên kết bổ sung với Thymine (T) bằng 2 liên kết Hydrogen, còn Guanine (G) liên kết với Cytosine (C) bằng 3 liên kết Hydrogen.',
            isTrue: true,
            explanation: 'Đúng theo nguyên tắc bổ sung của Watson - Crick.',
          },
          {
            id: 'b',
            label: 'b',
            text: 'Khí Ethylene (CH₂=CH₂) có liên kết đôi C=C nên làm mất màu dung dịch nước Bromine (Br₂).',
            isTrue: true,
            explanation: 'Đúng theo phản ứng cộng: CH₂=CH₂ + Br₂ → CH₂Br-CH₂Br.',
          },
          {
            id: 'c',
            label: 'c',
            text: 'Phân tử RNA có cấu trúc xoắn kép gồm 2 mạch đơn phân A, T, G, C giống hệt phân tử DNA.',
            isTrue: false,
            explanation: 'Sai vì RNA có cấu trúc 1 mạch đơn và gồm 4 loại đơn phân A, U (Uracil), G, C.',
          },
          {
            id: 'd',
            label: 'd',
            text: 'Dung dịch Glucose (C₆H₁₂O₆) tham gia phản ứng tráng bạc với dung dịch AgNO₃/NH₃ đun nóng tạo lớp bạc (Ag) sáng bóng.',
            isTrue: true,
            explanation: 'Đúng, đây là phản ứng đặc trưng nhận biết Glucose.',
          },
        ],
        explanation: 'Đáp án Đúng/Sai: a) Đúng | b) Đúng | c) Sai (RNA là mạch đơn gồm A, U, G, C) | d) Đúng.',
      },
      {
        id: 'mq-khtn9-b8-4',
        questionType: 'essay',
        question:
          'Một gen (đoạn phân tử DNA xoắn kép) có chiều dài L = 4080 Å và có số Nucleotide loại Adenine chiếm 20% tổng số Nucleotide của gen. a) Tính tổng số Nucleotide (N) của gen; b) Tính số lượng từng loại Nucleotide (A, T, G, C) và tổng số liên kết Hydrogen (H) của gen.',
        options: [],
        correctIndex: 0,
        sampleAnswer:
          'a) Tổng số Nucleotide của gen: N = (2 × L) / 3,4 = (2 × 4080) / 3,4 = 2400 (Nucleotide).\nb) Theo đề bài: A = T = 20% × N = 0,2 × 2400 = 480 (Nucleotide).\n- Ta có G = C = (N / 2) - A = 1200 - 480 = 720 (Nucleotide).\n- Tổng số liên kết Hydrogen: H = 2A + 3G = 2 × 480 + 3 × 720 = 960 + 2160 = 3120 (liên kết).',
        rubric:
          'Tính đúng N = 2400 Nucleotide (0,5đ); Tính đúng A = T = 480, G = C = 720 và H = 3120 liên kết (0,5đ).',
        explanation:
          'N = (2 × 4080)/3,4 = 2400; A = T = 480; G = C = 720; H = 2A + 3G = 3120 liên kết.',
      },
    ],
    thumbnailUrl: grade9Img,
    simulationId: 'sim-dna-double-helix',
    videoUrl: 'https://www.youtube.com/embed/8kK2zwjRV0M',
    documentId: 'doc-khtn-9-1',
    quizCount: 4,
    viewCount: 4980,
    author: 'KHOA HỌC SỐ KHTN',
  },
  {
    id: 'khtn-9-bai-24',
    topicId: 't9-2',
    grade: 9,
    domain: 'hoa-hoc',
    code: 'KHTN9-B24',
    title: 'Bài 24: Khai thác nhiên liệu hóa thạch – Dầu mỏ & Khí thiên nhiên',
    summary:
      'Khám phá cấu tạo địa chất mỏ dầu với 3 lớp chất lưu (Lớp khí mỏ dầu CH₄, Lớp dầu mỏ chứa Hydrocarbon nhẹ và nặng, Lớp nước đáy mỏ), phương pháp khoan khai thác và chế biến dầu mỏ.',
    objectives: [
      'Mô tả được cấu tạo 3 lớp chất lưu trong mỏ dầu tự nhiên (Khí mỏ dầu, Dầu thô, Nước đáy mỏ).',
      'Giải thích được nguyên lí dùng áp suất khí và bơm nước vào giếng phụ để đẩy dầu mỏ lên mặt đất.',
      'Trình bày được thành phần hóa học chính của khí thiên nhiên, khí mỏ dầu (Methane CH₄) và các phân đoạn chưng cất dầu mỏ.',
    ],
    durationMinutes: 45,
    sections: [
      {
        title: '1. Cấu tạo địa chất mỏ dầu và sự phân tầng 3 lớp chất lưu',
        content: [
          'a) Cấu trúc bẫy địa chất mỏ dầu: Mỏ dầu tự nhiên nằm sâu trong lòng đất dưới lớp đá chắn không thấm (ngăn không cho dầu và khí thoát lên trên). Bên trong vỉa đá chứa xốp, các chất lưu tự động phân tầng theo thứ tự khối lượng riêng tăng dần từ trên xuống dưới.',
          'b) Ba lớp chất lưu từ trên xuống dưới: Lớp khí mỏ dầu (Khí đồng hành) nằm ở vòm trên cùng do nhẹ nhất, chứa khoảng 75% khí Methane (CH₄) cùng Ethane (C₂H₆), Propane (C₃H₈), Butane (C₄H₁₀); Lớp dầu mỏ (Dầu thô) nằm ở giữa, là hỗn hợp phức tạp của hàng trăm Hydrocarbon nhẹ và nặng (C₈H₁₈, C₆H₁₂, C₆H₆, C₁₀H₈); Lớp nước vỉa (Nước mặn chứa các ion Na⁺, Cl⁻) nằm ở dưới đáy mỏ do có khối lượng riêng lớn nhất.',
          'c) Quy trình khoan khai thác dầu mỏ: Khi khoan giếng trúng lớp dầu lỏng, giai đoạn đầu dầu tự phun lên nhờ áp suất vỉa cao. Khi áp suất giảm, người ta bơm nước hoặc khí xuống các giếng phụ để đẩy dầu thô dâng lên qua giếng khai thác chính.',
        ],
        keyPoints: [
          'Thứ tự phân tầng theo chiều tăng khối lượng riêng: Lớp khí mỏ dầu (trên cùng) → Lớp dầu mỏ (ở giữa) → Lớp nước mặn đáy mỏ (dưới cùng).',
          'Thành phần chính của khí thiên nhiên (~95%) và khí mỏ dầu (~75%) đều là khí Methane (CH₄).',
        ],
        formula: 'CH₄ + 2O₂ → (t°) CO₂ + 2H₂O   |   n_khí = \\frac{V}{24,79} (mol, đkc)',
        formulaMeaning: 'Phương trình phản ứng đốt cháy hoàn toàn khí Methane tỏa nhiều nhiệt và công thức tính số mol chất khí ở điều kiện chuẩn (25°C, 1 bar).',
        imageUrl: domainChemImg,
        imageCaption: 'Mô phỏng 3D mỏ dầu và chuyển động phân tử trong các lớp chất lưu.',
      },
      {
        title: '2. Chế biến dầu mỏ (Chưng cất phân đoạn & Cracking) và An toàn năng lượng',
        content: [
          'a) Chưng cất phân đoạn dầu mỏ: Dầu thô sau khi khai thác được xử lí loại bỏ nước, muối rồi đưa vào tháp chưng cất phân đoạn ở áp suất thường để tách thành các phân đoạn theo nhiệt độ sôi từ thấp đến cao: Khí đốt hóa lỏng (LPG), Xăng (nhiên liệu động cơ), Dầu hỏa, Dầu diesel, Dầu nhờn bôi trơn và cặn Nhựa đường.',
          'b) Phản ứng Cracking và Reforming: Cracking là quá trình bẻ gãy các phân tử Hydrocarbon mạch dài (như dầu nặng, dầu mazut) dưới tác dụng của nhiệt độ và xúc tác để tạo thành xăng và các Hydrocarbon mạch ngắn có giá trị kinh tế cao (như Ethylene C₂H₄, Propylene C₃H₆ làm nguyên liệu sản xuất nhựa polymer).',
        ],
        highlightBox: {
          title: 'Xử lí sự cố tràn dầu trên biển dựa vào tính chất vật lí',
          text: 'Vì dầu mỏ không tan trong nước và nhẹ hơn nước (D_dầu ≈ 0,8 – 0,9 g/cm³ < D_nước = 1,0 g/cm³) nên khi tràn ra biển, dầu nổi thành váng trên mặt nước. Do đó người ta dùng phao quây cô lập vết dầu loang rồi dùng bơm hút hoặc vật liệu hấp phụ thu gom dầu.',
        },
      },
    ],
    keyTakeaways: [
      'Mỏ dầu gồm 3 lớp chất lưu phân tầng theo khối lượng riêng: Khí mỏ dầu (trên cùng, ~75% CH₄) – Dầu thô (ở giữa) – Nước mặn (dưới đáy).',
      'Chưng cất phân đoạn dầu mỏ thu được khí đốt LPG, xăng, dầu hỏa, dầu diesel, dầu nhờn và nhựa đường; phản ứng cháy: CH₄ + 2O₂ → (t°) CO₂ + 2H₂O.',
    ],
    miniQuiz: [
      {
        id: 'mq-khtn9-b24-1',
        questionType: 'single_choice',
        question:
          'Trong cấu tạo địa chất của một mỏ dầu tự nhiên, thứ tự sắp xếp 3 lớp chất lưu từ trên xuống dưới theo chiều tăng dần khối lượng riêng là:',
        options: [
          'Lớp khí mỏ dầu (trên cùng) → Lớp dầu mỏ (ở giữa) → Lớp nước đáy mỏ (dưới cùng)',
          'Lớp nước đáy mỏ (trên cùng) → Lớp dầu mỏ (ở giữa) → Lớp khí mỏ dầu (dưới cùng)',
          'Lớp dầu mỏ (trên cùng) → Lớp khí mỏ dầu (ở giữa) → Lớp nước đáy mỏ (dưới cùng)',
          'Ba lớp hòa tan đồng nhất vào nhau không phân tách',
        ],
        correctIndex: 0,
        explanation:
          'Do khí nhẹ nhất nên tích tụ ở phần vòm trên cùng (lớp khí mỏ dầu); dầu mỏ nhẹ hơn nước nhưng nặng hơn khí nên nằm ở lớp giữa; nước mặn nặng nhất nằm ở lớp đáy mỏ.',
      },
      {
        id: 'mq-khtn9-b24-2',
        questionType: 'single_choice',
        question:
          'Thành phần hydrocarbon chiếm tỉ lệ thể tích lớn nhất trong khí thiên nhiên (khoảng 95%) và khí mỏ dầu (khoảng 75%) là:',
        options: [
          'Methane (CH₄)',
          'Ethylene (C₂H₄)',
          'Carbon dioxide (CO₂)',
          'Acetylene (C₂H₂)',
        ],
        correctIndex: 0,
        explanation:
          'Methane (CH₄) là thành phần chính của cả khí thiên nhiên (~95%) và khí mỏ dầu (~75%).',
      },
      {
        id: 'mq-khtn9-b24-3',
        questionType: 'true_false',
        question:
          'Quan sát mô phỏng 3D mỏ dầu và các lớp chất lưu, xét tính Đúng/Sai của các nhận định sau:',
        options: [
          'Dầu mỏ là một hỗn hợp tự nhiên phức tạp gồm nhiều loại Hydrocarbon khác nhau, không tan trong nước và nhẹ hơn nước.',
          'Hàm lượng khí Methane (CH₄) trong khí mỏ dầu cao hơn hàm lượng Methane trong khí thiên nhiên.',
          'Khi áp suất trong mỏ dầu giảm xuống, người ta bơm nước hoặc khí xuống giếng phụ để đẩy dầu thô dâng lên giếng khai thác.',
          'Chưng cất phân đoạn dầu mỏ ở áp suất thường thu được khí đốt hóa lỏng, xăng, dầu hỏa, dầu diesel và nhựa đường.',
        ],
        correctIndex: 0,
        trueFalseStatements: [
          {
            id: 'a',
            label: 'a',
            text: 'Dầu mỏ là một hỗn hợp tự nhiên phức tạp gồm nhiều loại Hydrocarbon khác nhau, không tan trong nước và nhẹ hơn nước.',
            isTrue: true,
            explanation: 'Đúng theo tính chất vật lí và thành phần của dầu mỏ.',
          },
          {
            id: 'b',
            label: 'b',
            text: 'Hàm lượng khí Methane (CH₄) trong khí mỏ dầu cao hơn hàm lượng Methane trong khí thiên nhiên.',
            isTrue: false,
            explanation: 'Sai vì trong khí thiên nhiên CH₄ chiếm ~95%, còn trong khí mỏ dầu CH₄ chiếm khoảng 75%.',
          },
          {
            id: 'c',
            label: 'c',
            text: 'Khi áp suất trong mỏ dầu giảm xuống, người ta bơm nước hoặc khí xuống giếng phụ để đẩy dầu thô dâng lên giếng khai thác.',
            isTrue: true,
            explanation: 'Đúng theo quy trình kỹ thuật khai thác dầu mỏ thứ cấp.',
          },
          {
            id: 'd',
            label: 'd',
            text: 'Chưng cất phân đoạn dầu mỏ ở áp suất thường thu được khí đốt hóa lỏng, xăng, dầu hỏa, dầu diesel và nhựa đường.',
            isTrue: true,
            explanation: 'Đúng, dựa vào nhiệt độ sôi khác nhau của các phân đoạn Hydrocarbon.',
          },
        ],
        explanation: 'Đáp án Đúng/Sai: a) Đúng | b) Sai (Khí thiên nhiên ~95% CH₄ > Khí mỏ dầu ~75% CH₄) | c) Đúng | d) Đúng.',
      },
      {
        id: 'mq-khtn9-b24-4',
        questionType: 'essay',
        question:
          'Đốt cháy hoàn toàn 4,958 lít khí Methane (CH₄, thành phần chính của khí mỏ dầu) ở điều kiện chuẩn (25°C, 1 bar; 1 mol khí chiếm 24,79 L). a) Viết phương trình hóa học của phản ứng cháy; b) Tính thể tích khí Oxygen (O₂) cần dùng và khối lượng khí Carbon dioxide (CO₂) sinh ra.',
        options: [],
        correctIndex: 0,
        sampleAnswer:
          'a) Phương trình hóa học: CH₄ + 2O₂ → CO₂ + 2H₂O (t°)\n- Số mol khí Methane: n(CH₄) = 4,958 / 24,79 = 0,2 (mol).\nb) Theo PTHH:\n- n(O₂) = 2 × n(CH₄) = 2 × 0,2 = 0,4 (mol) ⇒ Thể tích O₂ (đkc): V(O₂) = 0,4 × 24,79 = 9,916 (L).\n- n(CO₂) = n(CH₄) = 0,2 (mol) ⇒ Khối lượng CO₂: m(CO₂) = 0,2 × 44 = 8,8 (gam).',
        rubric:
          'Viết đúng PTHH và tính n(CH₄) = 0,2 mol (0,5đ); Tính đúng V(O₂) = 9,916 L và m(CO₂) = 8,8 g (0,5đ).',
        explanation:
          'n(CH₄) = 0,2 mol; PTHH: CH₄ + 2O₂ → CO₂ + 2H₂O ⇒ V(O₂) = 0,4 × 24,79 = 9,916 L; m(CO₂) = 0,2 × 44 = 8,8 g.',
      },
    ],
    thumbnailUrl: domainChemImg,
    simulationId: 'sim-oil-reservoir-3d',
    videoUrl: 'https://www.youtube.com/embed/8kK2zwjRV0M',
    documentId: 'doc-khtn-9-1',
    quizCount: 4,
    viewCount: 3850,
    author: 'KHOA HỌC SỐ KHTN',
  },
];

export const SIMULATIONS_3D: Simulation3D[] = [
  {
    id: 'sim-khuc-xa-anh-sang-3d',
    title: 'Khúc Xạ Ánh Sáng 3D Rõ Nét - KHTN 9',
    grade: 9,
    domain: 'vat-li',
    category: 'Ánh sáng & Quang hình học',
    description:
      'Mô phỏng trực quan 3D hiện tượng khúc xạ ánh sáng khi truyền qua mặt phân cách giữa hai môi trường trong suốt (Không khí, Nước pha lê, Thủy tinh, Kim cương) với tia Laser đồng nhất màu đỏ rõ nét, đĩa đo độ 360°, Mini-game Săn Ngọc và 10 câu hỏi trắc nghiệm.',
    learningGoal:
      'Khảo sát đường truyền tia tới, tia khúc xạ, tia phản xạ và nghiệm lại định luật Snell: n₁ · sin(i) = n₂ · sin(r).',
    keyConcepts: [
      'Khúc xạ ánh sáng',
      'Định luật Snell (n₁·sin i = n₂·sin r)',
      'Góc tới i & Góc khúc xạ r',
      'Tia Laser 3D & Mini-game Săn Ngọc',
    ],
    thumbnail: domainPhysImg,
    type: 'external-embed',
    externalUrl: '/assets/aistudio/Kh_c_x___nh_s_ng_3bf52125.html',
    difficulty: 'Cơ bản',
    relatedLessonId: 'khtn-9-bai-4',
    controlsDescription: [
      { key: 'Chọn 2 môi trường (n₁, n₂)', action: 'Chuyển đổi Không khí (1,00), Nước (1,33), Thủy tinh (1,50), Kim cương (2,42)' },
      { key: 'Thanh trượt Góc tới i', action: 'Điều chỉnh góc chiếu tia Laser từ 0° đến 89°' },
      { key: '3 Tab tương tác', action: 'Thí nghiệm 3D • Game Săn Ngọc • Bài tập 10 câu' },
    ],
    parameters: [],
  },
  {
    id: 'sim-phan-xa-toan-phan-3d',
    title: 'Phản Xạ Toàn Phần & Cáp Quang 3D - KHTN 9',
    grade: 9,
    domain: 'vat-li',
    category: 'Ánh sáng & Quang hình học',
    description:
      'Khảo sát điều kiện phản xạ toàn phần (n₁ > n₂ và i ≥ i_gh) qua bản bán trụ thủy tinh, nước và kim cương. Tính góc giới hạn sin(i_gh) = n₂ / n₁, thực hành Mini-game Truyền Tín Hiệu Cáp Quang và làm 10 câu trắc nghiệm.',
    learningGoal:
      'Xác định điều kiện xảy ra phản xạ toàn phần, tính góc tới giới hạn i_gh và giải thích nguyên lí cáp quang Internet.',
    keyConcepts: [
      'Phản xạ toàn phần (i ≥ i_gh)',
      'Góc giới hạn sin(i_gh) = n₂/n₁',
      'Bản bán trụ thủy tinh',
      'Cáp quang & Nội soi y học',
    ],
    thumbnail: classicLabImg,
    type: 'external-embed',
    externalUrl: '/assets/aistudio/Ph_n_x__to_n_ph_n_2acb5007.html',
    difficulty: 'Trung bình',
    relatedLessonId: 'khtn-9-bai-4',
    controlsDescription: [
      { key: 'Đặt đúng i = i_gh', action: 'Chuyển nhanh tới góc giới hạn để quan sát tia khúc xạ đi sát mặt phân cách' },
      { key: 'Góc tới i (0° – 85°)', action: 'Tăng góc tới vượt i_gh để quan sát phản xạ toàn phần 100%' },
      { key: 'Game Truyền Cáp Quang', action: 'Căn góc bắn xung Laser truyền dữ liệu tốc độ cao' },
    ],
    parameters: [],
  },
  {
    id: 'sim-lang-kinh-tan-sac-3d',
    title: 'Lăng Kính & Tán Sắc Ánh Sáng 3D (Hình 7.5 KHTN 9)',
    grade: 9,
    domain: 'vat-li',
    category: 'Ánh sáng & Quang hình học',
    description:
      'Mô phỏng 3D chuẩn Hình 7.5 SGK KHTN 9: chiếu chùm ánh sáng trắng hoặc tia Laser đỏ đơn sắc qua lăng kính tam giác, quan sát dải quang phổ 7 màu (Đỏ, Da cam, Vàng, Lục, Lam, Chàm, Tím) trên màn hứng kèm Mini-game Bắt Màu và 10 câu hỏi.',
    learningGoal:
      'Giải thích hiện tượng tán sắc ánh sáng trắng qua lăng kính và so sánh góc lệch từ tia Đỏ (lệch ít nhất) đến tia Tím (lệch nhiều nhất).',
    keyConcepts: [
      'Tán sắc ánh sáng (Hình 7.5)',
      'Lăng kính tam giác 3D',
      'Quang phổ 7 màu (Đỏ → Tím)',
      'Ánh sáng trắng & Đơn sắc',
    ],
    thumbnail: grade9Img,
    type: 'external-embed',
    externalUrl: '/assets/aistudio/L_ng_k_nh_d88b6c2d.html',
    difficulty: 'Trung bình',
    relatedLessonId: 'khtn-9-bai-4',
    controlsDescription: [
      { key: 'Chế độ chùm sáng', action: 'Chuyển đổi Chùm ánh sáng trắng (Hình 7.5) và Tia Laser đỏ đơn sắc' },
      { key: 'Góc nghiêng & Màn hứng', action: 'Điều chỉnh góc chiếu đèn và khoảng cách màn hứng quang phổ' },
      { key: 'Game Bắt Màu & 10 Câu đố', action: 'Thực hành bắt trúng dải màu trên cảm biến quang học' },
    ],
    parameters: [],
  },
  {
    id: 'sim-thau-kinh-3d',
    title: 'Mô Hình Thấu Kính Hội Tụ & Phân Kì 3D - KHTN 9',
    grade: 9,
    domain: 'vat-li',
    category: 'Ánh sáng & Quang hình học',
    description:
      'Khảo sát hình dạng 3D và đường truyền 3 tia sáng đặc biệt qua Thấu kính Hội tụ (rìa mỏng) và Thấu kính Phân kì (rìa dày). Điều chỉnh tiêu cự f, khoảng cách vật d, chiều cao h, thực hành Mini-game Lấy Nét Máy Chiếu và làm 10 câu hỏi trắc nghiệm.',
    learningGoal:
      'Phân biệt thấu kính hội tụ – phân kì, vẽ 3 tia sáng đặc biệt và xác định tính chất ảnh thật / ảnh ảo của vật sáng AB.',
    keyConcepts: [
      'Thấu kính Hội tụ (Rìa mỏng)',
      'Thấu kính Phân kì (Rìa dày)',
      '3 Tia sáng đặc biệt (O, F, F\')',
      'Ảnh thật & Ảnh ảo (Kính lúp)',
    ],
    thumbnail: grade7Img,
    type: 'external-embed',
    externalUrl: '/assets/aistudio/Th_u_k_nh_82cbc246.html',
    difficulty: 'Trung bình',
    relatedLessonId: 'khtn-9-bai-4',
    controlsDescription: [
      { key: 'Loại thấu kính & Chế độ tia', action: 'Chuyển đổi TK Hội tụ / TK Phân kì và Vật sáng AB / Chùm tia song song' },
      { key: 'Thanh trượt f, d, h', action: 'Thay đổi tiêu cự f (8–18 cm), vị trí vật d (6–42 cm) và chiều cao vật h' },
      { key: 'Game Lấy Nét Máy Chiếu', action: 'Điều chỉnh khoảng cách d để bắt nét ảnh thật trên màn chiếu' },
    ],
    parameters: [],
  },
  {
    id: 'sim-oil-reservoir-3d',
    title: 'Mô Phỏng 3D Mỏ Dầu & Phân Tử Trong Các Lớp Chất Lưu',
    grade: 9,
    domain: 'hoa-hoc',
    category: 'Nhiên liệu hóa thạch & Dầu mỏ - Khí thiên nhiên',
    description:
      'Khám phá cấu tạo địa chất bẫy dầu khí 3D (đá chắn, đá chứa, sự phân tầng khí – dầu – nước) và nhấp vào từng lớp chất lưu để quan sát cấu trúc phân tử 3D chuyển động (CH₄, C₂H₆, C₃H₈, C₄H₁₀, C₈H₁₈, C₆H₁₂, C₆H₆, C₁₀H₈, H₂O, Na⁺, Cl⁻) kèm Quiz tương tác.',
    learningGoal:
      'Mô tả được cấu tạo bẫy dầu khí, sự phân lớp Khí – Dầu – Nước theo khối lượng riêng và thành phần phân tử chính của khí mỏ dầu, dầu thô, nước vỉa.',
    keyConcepts: [
      'Đá chứa & Đá chắn',
      'Khí mỏ dầu (CH₄, C₂H₆, C₃H₈, C₄H₁₀)',
      'Dầu thô (C₈H₁₈, C₆H₁₂, C₆H₆, C₁₀H₈)',
      'Nước vỉa (H₂O, Na⁺, Cl⁻)',
    ],
    thumbnail: grade9Img,
    type: 'external-embed',
    externalUrl:
      '/assets/aistudio/M__ph_ng_3D_m__d_u_v__ph_n_t__trong_c_c_l_p_ch_t_l_u__1__ac609d1f.html',
    difficulty: 'Trung bình',
    relatedLessonId: 'khtn-9-bai-24',
    controlsDescription: [
      { key: 'Xoay 360° & Thu phóng', action: 'Kéo chuột xoay địa tầng 3D và lăn chuột thu phóng' },
      { key: 'Bấm vào lớp Khí / Dầu / Nước', action: 'Mở cửa sổ xem mô hình phân tử 3D chuyển động' },
      { key: 'Độ trong suốt đất đá', action: 'Kéo thanh trượt để nhìn xuyên qua các lớp trầm tích' },
    ],
    parameters: [],
  },
  {
    id: 'sim-ethylene-lab-3d',
    title: 'Ethylene Lab • KHTN Thầy Hoàng (C₂H₄)',
    grade: 9,
    domain: 'hoa-hoc',
    category: 'Hydrocarbon & Polymer (Hóa học Hữu cơ)',
    description:
      'Phòng thí nghiệm 2.5D tương tác: điều chế và tính chất của Ethylene (C₂H₄) — tích hợp nguyên bản từ https://ethylene-lab-thay-hoang.hoang08shh.chatgpt.site.',
    learningGoal:
      'Thực hành mô phỏng điều chế khí Ethylene (C₂H₄) và khảo sát các tính chất đặc trưng của Ethylene theo chương trình KHTN 9.',
    keyConcepts: [
      'Cấu tạo phân tử C₂H₄',
      'Điều chế khí Ethylene',
      'Làm mất màu nước Bromine (Br₂)',
      'Tính chất hóa học của Ethylene',
    ],
    thumbnail: grade9Img,
    type: 'external-embed',
    externalUrl: 'https://ethylene-lab-thay-hoang.hoang08shh.chatgpt.site',
    difficulty: 'Trung bình',
    relatedLessonId: 'khtn-9-bai-8',
    controlsDescription: [
      { key: 'Tương tác trực tiếp', action: 'Thao tác điều chế và thử tính chất Ethylene trực tiếp trong phòng thí nghiệm 2.5D' },
      { key: 'Mở toàn màn hình', action: 'Bấm phóng to hoặc Mở tab riêng để trải nghiệm không gian rộng rãi' },
    ],
    parameters: [],
  },
  {
    id: 'sim-chemical-equation-3d',
    title: 'Cân Bằng Phương Trình Hóa Học 3D (Định Luật Bảo Toàn Khối Lượng)',
    grade: 8,
    domain: 'hoa-hoc',
    category: 'Phản ứng Hóa học & Cân bằng PTHH',
    description:
      'Trực quan hóa quá trình cân bằng phương trình hóa học 3D: điều chỉnh hệ số các phân tử chất tham gia và chất sản phẩm theo Định luật bảo toàn khối lượng (Hydrogen, Oxygen, Carbon, Nitrogen, Iron, Copper...).',
    learningGoal: 'Cân bằng số nguyên tử của mỗi nguyên tố trước và sau phản ứng hóa học theo đúng chuẩn danh pháp IUPAC.',
    keyConcepts: ['Định luật bảo toàn khối lượng', 'Hệ số tỉ lượng', 'Phương trình hóa học', 'Danh pháp IUPAC'],
    thumbnail: domainChemImg,
    type: 'external-embed',
    externalUrl: 'https://c-n-b-ng-ph-ng-tr-nh-h-a-h-c-3d.ai.studio',
    difficulty: 'Trung bình',
    relatedLessonId: 'khtn-8-bai-5-btkl',
    controlsDescription: [
      { key: 'Tương tác 3D trực tiếp', action: 'Tăng/giảm hệ số phân tử ở hai vế phản ứng' },
      { key: 'Xoay 360°', action: 'Quan sát cấu trúc phân tử chất tham gia & sản phẩm' },
      { key: 'Mở toàn màn hình', action: 'Trải nghiệm không gian 3D rộng rãi' },
    ],
    parameters: [],
  },
  {
    id: 'sim-atom-bohr',
    title: 'Mô hình Nguyên tử Rutherford - Bohr 3D (IUPAC)',
    grade: 7,
    domain: 'hoa-hoc',
    category: 'Nguyên tử & Bảng tuần hoàn',
    description:
      'Tương tác 3D trực quan với cấu tạo nguyên tử của các nguyên tố Hydrogen, Helium, Carbon, Nitrogen, Oxygen, Sodium, Chlorine theo chuẩn quốc tế IUPAC. Điều chỉnh số hạt Proton, Neutron, Electron và tốc độ quỹ đạo.',
    learningGoal: 'Hiểu cấu tạo hạt nhân (Proton, Neutron) và quy tắc phân bố Electron trên các lớp vỏ K, L, M.',
    keyConcepts: ['Proton (+1)', 'Neutron (0)', 'Electron (-1)', 'Danh pháp IUPAC'],
    thumbnail: grade7Img,
    type: 'atom-bohr',
    difficulty: 'Cơ bản',
    relatedLessonId: 'khtn-7-bai-2',
    controlsDescription: [
      { key: 'Chuột trái', action: 'Xoay mô hình nguyên tử 360°' },
      { key: 'Con lăn chuột', action: 'Phóng to / Thu nhỏ hạt nhân' },
      { key: 'Chọn nguyên tố', action: 'Chuyển đổi nhanh H, He, C, O, Na, Cl' },
    ],
    parameters: [
      { name: 'protons', label: 'Số Proton (Z)', min: 1, max: 17, step: 1, defaultValue: 6 },
      { name: 'speed', label: 'Tốc độ Electron', min: 0.2, max: 3.0, step: 0.2, defaultValue: 1.0, unit: 'x' },
    ],
  },
  {
    id: 'sim-acid-base-ph',
    title: 'Thí nghiệm Chuẩn độ Acid - Base & Thang đo pH',
    grade: 8,
    domain: 'hoa-hoc',
    category: 'Phản ứng Hóa học & pH',
    description:
      'Thực hành chuẩn độ dung dịch Hydrochloric acid (HCl 0,1M) bằng dung dịch Sodium hydroxide (NaOH 0,1M) từ khóa Buret. Quan sát sự đổi màu chất chỉ thị và máy đo pH điện tử thời gian thực.',
    learningGoal: 'Xác định điểm tương đương pH = 7,0 trong phản ứng trung hòa HCl + NaOH → NaCl + H₂O.',
    keyConcepts: ['Hydrochloric acid (HCl)', 'Sodium hydroxide (NaOH)', 'Thang đo pH (1-14)', 'Phản ứng trung hòa'],
    thumbnail: grade8Img,
    type: 'acid-base-ph',
    difficulty: 'Nâng cao',
    relatedLessonId: 'khtn-8-bai-5',
    controlsDescription: [
      { key: 'Nhỏ NaOH', action: 'Nhỏ từng mililít dung dịch Sodium hydroxide 0,1M' },
      { key: 'Thanh trượt Buret', action: 'Điều chỉnh thể tích NaOH từ 0 đến 45 mL' },
      { key: 'Máy đo pH', action: 'Quan sát giá trị pH và màu sắc dung dịch' },
    ],
    parameters: [
      { name: 'baseAdded', label: 'Thể tích NaOH 0,1M', min: 0, max: 45, step: 0.5, defaultValue: 10, unit: 'mL' },
    ],
  },
  {
    id: 'sim-electric-circuit',
    title: 'Phòng Lab Mạch Điện & Định Luật Ohm (I = U / R)',
    grade: 9,
    domain: 'vat-li',
    category: 'Điện học & Công suất',
    description:
      'Lắp ráp và khảo sát mạch điện một chiều gồm nguồn điện U, biến trở R, công tắc K, bóng đèn sợi đốt và đồng hồ vạn năng VOM. Quan sát độ sáng bóng đèn theo công suất tiêu thụ P = U × I.',
    learningGoal: 'Kiểm chứng định luật Ohm: Cường độ dòng điện I tỉ lệ thuận với hiệu điện thế U và tỉ lệ nghịch với điện trở R.',
    keyConcepts: ['Định luật Ohm (I = U / R)', 'Hiệu điện thế (Volt)', 'Điện trở (Ohm - Ω)', 'Công suất điện (Watt)'],
    thumbnail: domainPhysImg,
    type: 'electric-circuit',
    difficulty: 'Cơ bản',
    relatedLessonId: 'khtn-9-bai-4',
    controlsDescription: [
      { key: 'Công tắc K', action: 'Đóng / Ngắt mạch điện' },
      { key: 'Thanh trượt U', action: 'Thay đổi hiệu điện thế nguồn từ 1,5V đến 12V' },
      { key: 'Thanh trượt R', action: 'Thay đổi giá trị điện trở từ 2Ω đến 50Ω' },
    ],
    parameters: [
      { name: 'voltage', label: 'Hiệu điện thế U', min: 1.5, max: 12, step: 0.5, defaultValue: 6, unit: 'V' },
      { name: 'resistance', label: 'Điện trở R', min: 2, max: 50, step: 1, defaultValue: 10, unit: 'Ω' },
    ],
  },
  {
    id: 'sim-light-refraction',
    title: 'Quang Học: Khúc Xạ & Tán Sắc Ánh Sáng Qua Lăng Kính',
    grade: 9,
    domain: 'vat-li',
    category: 'Quang hình học',
    description:
      'Chiếu chùm tia Laser đỏ hoặc ánh sáng trắng qua bản bán trụ thủy tinh. Thay đổi góc tới i và chiết suất n₂ để nghiệm lại định luật Snell và quan sát dải quang phổ cầu vồng.',
    learningGoal: 'Đo góc tới i, góc khúc xạ r theo định luật Snell n₁.sin(i) = n₂.sin(r) và quan sát tán sắc ánh sáng.',
    keyConcepts: ['Khúc xạ ánh sáng', 'Định luật Snell', 'Chiết suất n', 'Tán sắc ánh sáng'],
    thumbnail: classicLabImg,
    type: 'light-refraction',
    difficulty: 'Nâng cao',
    relatedLessonId: 'khtn-9-bai-4',
    controlsDescription: [
      { key: 'Chế độ nguồn sáng', action: 'Chuyển đổi Laser đơn sắc / Ánh sáng trắng tán sắc' },
      { key: 'Góc tới i', action: 'Điều chỉnh góc chiếu từ 0° đến 80°' },
      { key: 'Chiết suất n₂', action: 'Thay đổi môi trường từ Nước (1,33) đến Kim cương (2,40)' },
    ],
    parameters: [
      { name: 'incidentAngle', label: 'Góc tới i', min: 0, max: 80, step: 1, defaultValue: 45, unit: '°' },
      { name: 'refractiveIndex', label: 'Chiết suất n₂', min: 1.2, max: 2.4, step: 0.05, defaultValue: 1.5 },
    ],
  },
  {
    id: 'sim-microscope-cell',
    title: 'Kính Hiển Vi Quang Học 3D: Tế Bào Thực Vật & Động Vật',
    grade: 6,
    domain: 'sinh-hoc',
    category: 'Tế bào học',
    description:
      'Quan sát mô hình giải phẫu 3D tế bào thực vật với thành Cellulose, lục lạp, không bào trung tâm, ti thể và nhân chứa phân tử DNA dưới kính hiển vi quang học.',
    learningGoal: 'Phân biệt cấu trúc tế bào thực vật và tế bào động vật, nắm vững chức năng từng bào quan.',
    keyConcepts: ['Màng sinh chất', 'Thành Cellulose', 'Lục lạp (Quang hợp)', 'Nhân tế bào (DNA)'],
    thumbnail: grade6Img,
    type: 'microscope-cell',
    difficulty: 'Cơ bản',
    relatedLessonId: 'khtn-6-bai-18',
    controlsDescription: [
      { key: 'Xoay 3D', action: 'Quan sát mặt cắt giải phẫu tế bào' },
      { key: 'Chọn bào quan', action: 'Xem chi tiết chức năng Nhân, Lục lạp, Ti thể, Không bào' },
    ],
    parameters: [
      { name: 'magnification', label: 'Độ phóng đại', min: 40, max: 1000, step: 60, defaultValue: 400, unit: 'x' },
    ],
  },
  {
    id: 'sim-dna-double-helix',
    title: 'Mô Hình Phân Tử DNA Xoắn Kép & Phiên Mã RNA 3D',
    grade: 9,
    domain: 'sinh-hoc',
    category: 'Di truyền học phân tử',
    description:
      'Khám phá chuỗi xoắn kép phân tử DNA (Deoxyribonucleic acid) với các cặp Nucleotide liên kết bổ sung Adenine - Thymine (A-T) và Guanine - Cytosine (G-C).',
    learningGoal: 'Hiểu cấu trúc không gian của DNA và nguyên tắc bổ sung trong nhân đôi DNA, phiên mã RNA.',
    keyConcepts: ['DNA (Deoxyribonucleic acid)', 'Adenine - Thymine (2 liên kết H)', 'Guanine - Cytosine (3 liên kết H)', 'RNA'],
    thumbnail: grade9Img,
    type: 'declarative-model',
    difficulty: 'Chuyên sâu',
    relatedLessonId: 'khtn-9-bai-8',
    controlsDescription: [
      { key: 'Xoay chuỗi xoắn kép', action: 'Quan sát 2 mạch polynucleotide ngược chiều' },
      { key: 'Phân rã (Explode)', action: 'Tách 2 mạch DNA theo liên kết Hydrogen' },
    ],
    parameters: [
      { name: 'speed', label: 'Tốc độ xoay DNA', min: 0.2, max: 3.0, step: 0.2, defaultValue: 1.0, unit: 'x' },
    ],
  },
];

export const DOCUMENTS: DocumentItem[] = [
  {
    id: 'doc-khtn-6-1',
    title: 'Sơ đồ tư duy & Đề cương KHTN 6 - Bộ sách Kết nối tri thức với cuộc sống',
    grade: 6,
    domain: 'hoa-hoc',
    format: 'pdf',
    type: 'Sơ đồ tư duy',
    pageCount: 24,
    fileSize: '3.4 MB',
    description:
      'Hệ thống hóa kiến thức các thể của chất, khí Oxygen (O₂), thành phần không khí, cấu trúc tế bào và lực trong đời sống theo bộ sách Kết nối tri thức với cuộc sống.',
    author: 'KHOA HỌC SỐ KHTN',
    downloadCount: 2840,
    previewSlides: [
      'Chủ đề 1: Các thể của chất & Sự chuyển thể (Nóng chảy, Đông đặc, Bay hơi, Ngưng tụ).',
      'Chủ đề 2: Oxygen (O₂) duy trì sự sống và sự cháy; Không khí gồm 78% Nitrogen, 21% Oxygen.',
      'Chủ đề 3: Tế bào thực vật (có thành Cellulose, lục lạp) và Tế bào động vật.',
    ],
    downloadUrl: '#',
  },
  {
    id: 'doc-khtn-7-1',
    title: 'Bảng Danh Pháp Quốc Tế IUPAC Nguyên Tố & Hợp Chất Hóa Học KHTN 7 - 8 - 9',
    grade: 7,
    domain: 'hoa-hoc',
    format: 'pdf',
    type: 'Phiếu học tập',
    pageCount: 18,
    fileSize: '2.9 MB',
    description:
      'Tài liệu chuẩn hóa cách đọc tên và viết công thức hóa học theo danh pháp IUPAC: Hydrogen, Carbon, Nitrogen, Oxygen, Sodium, Potassium, Calcium, Magnesium, Aluminium, Zinc, Iron, Copper, Silver, Chlorine, Sulfur.',
    author: 'KHOA HỌC SỐ KHTN',
    downloadCount: 5410,
    previewSlides: [
      'Phần 1: 20 nguyên tố đầu tiên trong Bảng tuần hoàn (Z = 1 Hydrogen đến Z = 20 Calcium).',
      'Phần 2: Danh pháp các kim loại chuyển tiếp thông dụng: Iron (Fe), Copper (Cu), Zinc (Zn), Silver (Ag), Gold (Au).',
      'Phần 3: Quy tắc gọi tên Oxide, Acid, Base và Muối theo chuẩn IUPAC.',
    ],
    downloadUrl: '#',
  },
  {
    id: 'doc-khtn-8-btkl',
    lessonId: 'khtn-8-bai-5-btkl',
    title: 'Bài 5. Định luật bảo toàn khối lượng và phương trình hóa học (Bài giảng & Phiếu học tập KHTN 8)',
    grade: 8,
    domain: 'hoa-hoc',
    format: 'pptx',
    type: 'Giáo án điện tử',
    pageCount: 26,
    fileSize: '3.8 MB',
    description:
      'Bài giảng điện tử và phiếu học tập Bài 5: Định luật bảo toàn khối lượng (m_trước = m_sau) và các bước lập phương trình hóa học theo sách Kết nối tri thức với cuộc sống.',
    author: 'KHOA HỌC SỐ KHTN',
    downloadCount: 4820,
    previewSlides: [
      'Phần I: Thí nghiệm BaCl₂ + Na₂SO₄ → BaSO₄ ↓ + 2NaCl và nội dung Định luật bảo toàn khối lượng.',
      'Phần II: Ba bước lập phương trình hóa học và ý nghĩa hệ số tỉ lượng trong phản ứng.',
      'Phần III: Bài tập vận dụng tính khối lượng chất tham gia, chất sản phẩm và cân bằng PTHH.',
    ],
    downloadUrl: '#',
  },
  {
    id: 'doc-khtn-8-1',
    title: 'Chuyên đề Phản ứng Hóa học, Acid - Base - Thang pH & Oxide - Muối (KHTN 8)',
    grade: 8,
    domain: 'hoa-hoc',
    format: 'docx',
    type: 'Đề kiểm tra 15p/1T',
    pageCount: 32,
    fileSize: '4.2 MB',
    description:
      'Tuyển tập bài tập tính theo phương trình hóa học, nồng độ mol (CM), nồng độ phần trăm (C%) với danh pháp chuẩn IUPAC: Hydrochloric acid, Sulfuric acid, Sodium hydroxide, Calcium hydroxide.',
    author: 'KHOA HỌC SỐ KHTN',
    downloadCount: 4190,
    previewSlides: [
      'Dạng 1: Nhận biết dung dịch Acid (HCl, H₂SO₄), Base (NaOH, Ca(OH)₂) và Muối bằng Quỳ tím, Phenolphthalein.',
      'Dạng 2: Bài toán Kim loại (Mg, Al, Zn, Fe) tác dụng với dung dịch Acid giải phóng khí Hydrogen (H₂) ở điều kiện chuẩn (24,79 L/mol).',
    ],
    downloadUrl: '#',
  },
  {
    id: 'doc-khtn-9-1',
    title: 'Tổng ôn KHTN 9: Định luật Ohm, Quang học, Hợp chất hữu cơ IUPAC & Di truyền DNA',
    grade: 9,
    domain: 'vat-li',
    format: 'pptx',
    type: 'Giáo án điện tử',
    pageCount: 45,
    fileSize: '6.8 MB',
    description:
      'Bộ bài giảng và đề luyện thi tổng hợp 3 phân môn Vật lí (Định luật Ohm, Khúc xạ ánh sáng), Hóa học (Methane, Ethylene, Ethylic alcohol, Acetic acid) và Sinh học (DNA, RNA, Quy luật Mendel).',
    author: 'KHOA HỌC SỐ KHTN',
    downloadCount: 6230,
    previewSlides: [
      'Chuyên đề Vật lí 9: Định luật Ohm (I = U / R), Công suất điện (P = U × I) và Thấu kính hội tụ - phân kì.',
      'Chuyên đề Hóa học 9: Chuỗi phản ứng Ethylene → Ethylic alcohol → Acetic acid → Ethyl acetate.',
      'Chuyên đề Sinh học 9: Bài toán cấu trúc không gian phân tử DNA (N = 2A + 2G, H = 2A + 3G).',
    ],
    downloadUrl: '#',
  },
];

export const VIDEOS: VideoLesson[] = [
  {
    id: 'vid-khtn-7-atom',
    title: 'Mô hình Nguyên tử Rutherford - Bohr & Cách đọc tên nguyên tố chuẩn IUPAC',
    grade: 7,
    domain: 'hoa-hoc',
    duration: '16:40',
    youtubeId: 'FSyAehMdpyI',
    experimentType: 'Mô phỏng 3D hướng dẫn',
    instructor: 'KHOA HỌC SỐ KHTN',
    description:
      'Hướng dẫn trực quan cấu trúc hạt nhân (Proton, Neutron), lớp vỏ Electron và phát âm chuẩn quốc tế IUPAC các nguyên tố Hydrogen, Carbon, Nitrogen, Oxygen, Sodium, Potassium, Calcium, Iron, Copper.',
    views: 18450,
    timestamps: [
      { time: '00:00', label: 'Giới thiệu cấu tạo nguyên tử Rutherford - Bohr' },
      { time: '05:20', label: 'Quy tắc phân bố Electron trên các lớp K, L, M' },
      { time: '10:45', label: 'Hướng dẫn đọc tên 20 nguyên tố theo chuẩn IUPAC' },
    ],
  },
  {
    id: 'vid-khtn-8-ph',
    title: 'Thí nghiệm Chuẩn độ Acid - Base (HCl + NaOH) & Đổi màu chất chỉ thị pH',
    grade: 8,
    domain: 'hoa-hoc',
    duration: '14:15',
    youtubeId: 'ANi709MYnWg',
    experimentType: 'Thí nghiệm thực hành',
    instructor: 'KHOA HỌC SỐ KHTN',
    description:
      'Quan sát thí nghiệm thực hành phản ứng trung hòa giữa dung dịch Hydrochloric acid (HCl) và Sodium hydroxide (NaOH) với chất chỉ thị Phenolphthalein, giấy Quỳ tím và máy đo pH.',
    views: 21300,
    timestamps: [
      { time: '00:00', label: 'Chuẩn bị dụng cụ Buret, bình tam giác và dung dịch HCl, NaOH' },
      { time: '04:30', label: 'Khảo sát sự đổi màu của giấy Quỳ tím và Phenolphthalein' },
      { time: '09:10', label: 'Xác định điểm tương đương trung hòa pH = 7,0' },
    ],
  },
  {
    id: 'vid-khtn-9-ohm',
    title: 'Thí nghiệm khảo sát Định luật Ohm (I = U / R) & Công suất bóng đèn',
    grade: 9,
    domain: 'vat-li',
    duration: '19:20',
    youtubeId: 'HsLLq6Rm5tU',
    experimentType: 'Thí nghiệm thực hành',
    instructor: 'KHOA HỌC SỐ KHTN',
    description:
      'Thực hành mắc mạch điện với nguồn điện một chiều, Ampe kế, Vôn kế và biến trở để đo cường độ dòng điện I theo hiệu điện thế U và vẽ đường đặc tuyến Volt - Ampere.',
    views: 17900,
    timestamps: [
      { time: '00:00', label: 'Sơ đồ mạch điện khảo sát Định luật Ohm' },
      { time: '06:15', label: 'Cách mắc Ampe kế nối tiếp và Vôn kế song song' },
      { time: '13:40', label: 'Phân tích đồ thị I - U và tính điện trở R (Ω)' },
    ],
  },
  {
    id: 'vid-khtn-9-dna',
    title: 'Cấu trúc không gian phân tử DNA xoắn kép, Phiên mã tạo RNA & Dịch mã',
    grade: 9,
    domain: 'sinh-hoc',
    duration: '17:50',
    youtubeId: '8kK2zwjRV0M',
    experimentType: 'Bài giảng lý thuyết',
    instructor: 'KHOA HỌC SỐ KHTN',
    description:
      'Mô phỏng 3D cấu trúc chuỗi xoắn kép DNA (Adenine, Thymine, Guanine, Cytosine), cơ chế tự nhân đôi DNA theo nguyên tắc bổ sung và quá trình tổng hợp chuỗi Polypeptide.',
    views: 24600,
    timestamps: [
      { time: '00:00', label: 'Cấu trúc đa phân của phân tử DNA (A, T, G, C)' },
      { time: '06:40', label: 'Nguyên tắc bổ sung A - T (2 liên kết H) và G - C (3 liên kết H)' },
      { time: '12:20', label: 'Cơ chế phiên mã tạo mRNA và dịch mã tại Ribosome' },
    ],
  },
];

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  // LỚP 6
  {
    id: 'q-khtn6-1',
    lessonId: 'khtn-6-bai-9',
    grade: 6,
    domain: 'hoa-hoc',
    question:
      'Theo sách Kết nối tri thức với cuộc sống, hai chất khí chiếm tỉ lệ thể tích lớn nhất trong không khí khô và sạch là:',
    questionType: 'single_choice',
    options: [
      'Khoảng 78% khí Nitrogen (N₂) và 21% khí Oxygen (O₂)',
      'Khoảng 78% khí Oxygen (O₂) và 21% khí Carbon dioxide (CO₂)',
      'Khoảng 50% khí Hydrogen (H₂) và 50% khí Oxygen (O₂)',
      'Khoảng 78% khí Carbon dioxide (CO₂) và 21% khí Nitrogen (N₂)',
    ],
    correctAnswer: 0,
    explanation:
      'Đáp án A. Trong không khí khô và sạch: Nitrogen (N₂) chiếm 78%, Oxygen (O₂) chiếm 21%, còn lại 1% là CO₂, Argon và hơi nước.',
    solutionSteps: [
      'Dữ kiện: V(N₂) ≈ 78% thể tích không khí | V(O₂) ≈ 21% thể tích không khí | Khí khác (CO₂, Ar, hơi nước) ≈ 1% | Tổng thể tích = 100%',
      'Bước 1 (Thành phần thể tích không khí khô và sạch): Theo biểu đồ thành phần không khí:\n[EQ] %V_{N₂} = 78%   ;   %V_{O₂} = 21%   ;   %V_{khác} = 1%',
      'Bước 2 (Đối chiếu các phương án): Phương án B sai vì ghi Oxygen chiếm 78%; phương án C sai vì Hydrogen không chiếm 50%; phương án D sai vì CO₂ chỉ chiếm khoảng 0,04%.\n[EQ] Chọn đáp án A: 78% Nitrogen (N₂) và 21% Oxygen (O₂)',
    ],
    difficulty: 'Nhận biết',
    points: 2.5,
  },
  {
    id: 'q-khtn6-2',
    lessonId: 'khtn-6-bai-18',
    grade: 6,
    domain: 'sinh-hoc',
    question:
      'Thành phần cấu trúc nào sau đây chỉ có ở tế bào thực vật mà không có ở tế bào động vật?',
    questionType: 'single_choice',
    options: [
      'Thành tế bào bằng Cellulose và bào quan Lục lạp',
      'Màng sinh chất và chất tế bào',
      'Nhân tế bào chứa DNA và Ti thể',
      'Ribosome và màng nhân',
    ],
    correctAnswer: 0,
    explanation:
      'Đáp án A. Tế bào thực vật có Thành tế bào bằng Cellulose và Lục lạp (quang hợp), còn tế bào động vật không có hai thành phần này.',
    solutionSteps: [
      'Dữ kiện: Tế bào thực vật: có Thành Cellulose, Lục lạp | Tế bào động vật: không có Thành Cellulose, không có Lục lạp',
      'Bước 1 (So sánh cấu trúc tế bào thực vật và động vật): Cả hai loại tế bào đều có Màng sinh chất, Chất tế bào (Ti thể, Ribosome) và Nhân chứa DNA (loại B, C, D).',
      'Bước 2 (Thành phần đặc trưng chỉ có ở tế bào thực vật): Tế bào thực vật có Thành tế bào bằng Cellulose quy định hình dạng và bào quan Lục lạp chứa diệp lục để quang hợp.\n[EQ] Chọn đáp án A: Thành tế bào bằng Cellulose và bào quan Lục lạp',
    ],
    difficulty: 'Thông hiểu',
    points: 2.5,
  },
  {
    id: 'q-khtn6-essay-1',
    lessonId: 'khtn-6-bai-9',
    grade: 6,
    domain: 'hoa-hoc',
    question:
      '[Tự luận] Úp một cốc thủy tinh trong suốt lên một ngọn nến đang cháy đặt trong đĩa nước màu. Sau một thời gian ngắn, ngọn nến tắt và mực nước trong cốc dâng lên chiếm khoảng 1/5 thể tích không khí trong cốc. Em hãy giải thích hiện tượng trên và nêu vai trò của khí Oxygen.',
    questionType: 'essay',
    options: [],
    allowImageUpload: true,
    hint: 'Gợi ý: Nến cháy đã tiêu thụ hết khí Oxygen (chiếm 21% ≈ 1/5 thể tích không khí) trong cốc.',
    explanation:
      'Nến cháy tiêu thụ hết khí Oxygen (O₂) nên tắt; áp suất trong cốc giảm làm nước dâng lên chiếm 1/5 (≈ 21%) thể tích cốc, đúng bằng tỉ lệ Oxygen trong không khí.',
    solutionSteps: [
      'Dữ kiện: Hệ thí nghiệm: Cốc thủy tinh úp kín trên đĩa nước màu | V(nước dâng) ≈ 1/5 V(cốc) = 20% V(không khí) | %V(O₂ trong không khí) ≈ 21%',
      'Bước 1 (Giải thích vì sao ngọn nến tắt): Khi úp cốc thủy tinh kín, ngọn nến cháy đã phản ứng và tiêu thụ hết lượng khí Oxygen (O₂) có trong cốc:\n[EQ] Paraffin (Nến) + O₂ → CO₂ + H₂O (Khi hết O₂ thì nến tắt)',
      'Bước 2 (Giải thích vì sao nước dâng lên 1/5 thể tích cốc): Lượng khí O₂ mất đi làm áp suất khí trong cốc giảm nhỏ hơn áp suất khí quyển bên ngoài, đẩy nước màu tràn vào chiếm đúng phần thể tích O₂ đã phản ứng:\n[EQ] \\frac{V_{O₂}}{V_{không khí}} ≈ \\frac{1}{5} = 20% ≈ 21%',
      'Bước 3 (Vai trò của khí Oxygen): Khí Oxygen (O₂) có vai trò duy trì sự cháy và duy trì sự hô hấp của con người, động vật, thực vật.',
    ],
    sampleAnswer:
      '- Nến tắt vì đã đốt cháy hết khí Oxygen (O₂) trong cốc.\n- Nước dâng lên 1/5 (≈ 21%) thể tích cốc để bù vào phần thể tích khí Oxygen đã phản ứng.\n- Vai trò: Oxygen duy trì sự cháy và sự sống.',
    difficulty: 'Vận dụng',
    points: 3.0,
  },

  // LỚP 7
  {
    id: 'q-khtn7-1',
    lessonId: 'khtn-7-bai-2',
    grade: 7,
    domain: 'hoa-hoc',
    question:
      'Theo danh pháp chuẩn quốc tế IUPAC trong bộ sách Kết nối tri thức với cuộc sống, các nguyên tố có kí hiệu hóa học Na, K, Ca, Fe, Cu lần lượt có tên gọi là:',
    questionType: 'single_choice',
    options: [
      'Sodium, Potassium, Calcium, Iron, Copper',
      'Sulfur, Phosphorus, Carbon, Fluorine, Chlorine',
      'Sodium, Calcium, Potassium, Copper, Iron',
      'Nitrogen, Potassium, Calcium, Zinc, Silver',
    ],
    correctAnswer: 0,
    explanation:
      'Đáp án A. Na: Sodium, K: Potassium, Ca: Calcium, Fe: Iron, Cu: Copper.',
    solutionSteps: [
      'Dữ kiện: Na (Z = 11): Sodium | K (Z = 19): Potassium | Ca (Z = 20): Calcium | Fe (Z = 26): Iron ; Cu (Z = 29): Copper',
      'Bước 1 (Xác định tên gọi chuẩn IUPAC của từng kí hiệu): Đối chiếu theo Bảng tuần hoàn các nguyên tố hóa học:\n[EQ] Na: Sodium  |  K: Potassium  |  Ca: Calcium  |  Fe: Iron  |  Cu: Copper',
      'Bước 2 (Kết luận đáp án đúng): Phương án A đúng hoàn toàn theo thứ tự đề bài.\n[EQ] Chọn đáp án A: Sodium, Potassium, Calcium, Iron, Copper',
    ],
    difficulty: 'Nhận biết',
    points: 2.5,
  },
  {
    id: 'q-khtn7-2',
    lessonId: 'khtn-7-bai-2',
    grade: 7,
    domain: 'hoa-hoc',
    question:
      'Nguyên tử của nguyên tố Chlorine (Cl) có số đơn vị điện tích hạt nhân Z = 17 và số hạt Neutron là 18. Phát biểu nào sau đây là ĐÚNG về nguyên tử Chlorine?',
    questionType: 'single_choice',
    options: [
      'Có 17 hạt Proton trong hạt nhân, 17 hạt Electron ở vỏ (phân bố 2 - 8 - 7) và khối lượng nguyên tử xấp xỉ 35 amu',
      'Có 18 hạt Proton, 17 hạt Electron và khối lượng nguyên tử xấp xỉ 35 amu',
      'Có 17 hạt Proton, 18 hạt Electron và 2 lớp vỏ Electron',
      'Có 35 hạt Electron ở lớp vỏ ngoài cùng',
    ],
    correctAnswer: 0,
    explanation:
      'Đáp án A. p = e = Z = 17 (phân bố 3 lớp: 2 - 8 - 7); khối lượng nguyên tử A = p + n = 17 + 18 = 35 amu.',
    solutionSteps: [
      'Dữ kiện: Nguyên tố: Chlorine (Cl) | Điện tích hạt nhân: Z = 17 | Số hạt Neutron: n = 18 hạt | Nguyên tử trung hòa về điện: p = e = Z',
      'Bước 1 (Số hạt Proton, Electron và phân bố lớp vỏ): Vì nguyên tử trung hòa về điện nên:\n[EQ] p = e = Z = 17 hạt (Phân bố 3 lớp: Lớp K: 2e, Lớp L: 8e, Lớp M: 7e)',
      'Bước 2 (Khối lượng nguyên tử Chlorine): Khối lượng nguyên tử tập trung ở hạt nhân:\n[EQ] A ≈ p + n = 17 + 18 = 35 amu   ⇒   Chọn đáp án A',
    ],
    difficulty: 'Thông hiểu',
    points: 2.5,
  },
  {
    id: 'q-khtn7-essay-1',
    lessonId: 'khtn-7-bai-2',
    grade: 7,
    domain: 'hoa-hoc',
    question:
      '[Tự luận] Nguyên tử của nguyên tố Aluminium (Nhôm - Al) có số đơn vị điện tích hạt nhân Z = 13 và số hạt Neutron trong hạt nhân là 14. Em hãy trình bày từng bước xác định số hạt Proton, số hạt Electron, khối lượng nguyên tử (amu) và vẽ hoặc mô tả sự phân bố Electron trên các lớp vỏ nguyên tử Aluminium.',
    questionType: 'essay',
    options: [],
    allowImageUpload: true,
    hint: 'Gợi ý: p = e = Z = 13; A = p + n; điền 13e vào lớp K (2e), lớp L (8e), lớp M (3e).',
    explanation:
      'Aluminium (Z = 13) có p = e = 13 hạt, n = 14 hạt, A = 13 + 14 = 27 amu. Phân bố electron: Lớp K (2e), Lớp L (8e), Lớp M (3e).',
    solutionSteps: [
      'Dữ kiện: Nguyên tố: Aluminium (Al) | Số đơn vị ĐTHN: Z = 13 | Số hạt Neutron: n = 14 hạt | Lớp K tối đa 2e, lớp L tối đa 8e',
      'Bước 1 (Số hạt Proton và số hạt Electron): Vì nguyên tử Aluminium trung hòa về điện nên số hạt Proton bằng số hạt Electron:\n[EQ] p = e = Z = 13 hạt',
      'Bước 2 (Khối lượng nguyên tử Aluminium): Khối lượng nguyên tử xấp xỉ bằng tổng khối lượng hạt Proton và Neutron trong hạt nhân:\n[EQ] A = p + n = 13 + 14 = 27 amu',
      'Bước 3 (Sự phân bố Electron trên các lớp vỏ nguyên tử): Điền 13 electron lần lượt từ lớp trong cùng ra ngoài:\n[EQ] Lớp K: 2e  |  Lớp L: 8e  |  Lớp M (ngoài cùng): 13 - (2 + 8) = 3e (Cấu hình: 2 - 8 - 3)',
    ],
    sampleAnswer:
      '- Số hạt: p = e = Z = 13 hạt; n = 14 hạt.\n- Khối lượng nguyên tử: A = p + n = 13 + 14 = 27 (amu).\n- Phân bố 13 electron trên 3 lớp vỏ: Lớp K (2e) – Lớp L (8e) – Lớp M (3e, có 3e lớp ngoài cùng).',
    difficulty: 'Vận dụng',
    points: 3.0,
  },
  {
    id: 'q-khtn7-3',
    lessonId: 'khtn-7-bai-8',
    grade: 7,
    domain: 'vat-li',
    question:
      'Một vận động viên xe đạp chuyển động đều trên đoạn đường thẳng dài 1,8 km hết thời gian 3 phút. Tốc độ của vận động viên tính theo đơn vị m/s là:',
    questionType: 'single_choice',
    options: ['10 m/s', '15 m/s', '36 m/s', '6 m/s'],
    correctAnswer: 0,
    explanation:
      'Đáp án A. s = 1,8 km = 1800 m; t = 3 phút = 180 s ⇒ v = s / t = 1800 / 180 = 10 m/s.',
    solutionSteps: [
      'Dữ kiện: s = 1,8 km = 1800 m | t = 3 phút = 3 × 60 = 180 s',
      'Bước 1 (Đổi đơn vị về hệ chuẩn SI): Quãng đường và thời gian chuyển động của vận động viên:\n[EQ] s = 1,8 × 1000 = 1800 m   ;   t = 3 × 60 = 180 s',
      'Bước 2 (Tốc độ của vận động viên): Áp dụng công thức tính tốc độ:\n[EQ] v = \\frac{s}{t} = \\frac{1800}{180} = 10 m/s   ⇒   Chọn đáp án A',
    ],
    difficulty: 'Vận dụng',
    points: 2.5,
  },

  // LỚP 8
  {
    id: 'q-khtn8-1',
    lessonId: 'khtn-8-bai-5',
    grade: 8,
    domain: 'hoa-hoc',
    question:
      'Cho các dung dịch sau: Hydrochloric acid (HCl), Sulfuric acid (H₂SO₄), Sodium hydroxide (NaOH), Calcium hydroxide (Ca(OH)₂). Nhóm các dung dịch có pH > 7 và làm dung dịch Phenolphthalein không màu chuyển sang màu hồng là:',
    questionType: 'single_choice',
    options: [
      'Sodium hydroxide (NaOH) và Calcium hydroxide (Ca(OH)₂)',
      'Hydrochloric acid (HCl) và Sulfuric acid (H₂SO₄)',
      'Hydrochloric acid (HCl) và Sodium hydroxide (NaOH)',
      'Sulfuric acid (H₂SO₄) và Calcium hydroxide (Ca(OH)₂)',
    ],
    correctAnswer: 0,
    explanation:
      'Đáp án A. NaOH và Ca(OH)₂ là hai Base tan (kiềm), phân li ra ion OH⁻ nên có pH > 7 và làm Phenolphthalein hóa hồng.',
    solutionSteps: [
      'Dữ kiện: HCl, H₂SO₄: Acid (pH < 7) | NaOH, Ca(OH)₂: Base kiềm (pH > 7)',
      'Bước 1 (Phân loại các dung dịch và môi trường pH): Trong nước, NaOH và Ca(OH)₂ phân li ra ion OH⁻ tạo môi trường Base kiềm (pH > 7):\n[EQ] NaOH → Na⁺ + OH⁻   ;   Ca(OH)₂ → Ca²⁺ + 2OH⁻   (pH > 7)',
      'Bước 2 (Hiện tượng với chất chỉ thị Phenolphthalein): Dung dịch có pH > 7 làm Phenolphthalein từ không màu chuyển sang màu hồng cánh sen.\n[EQ] Chọn đáp án A: Sodium hydroxide (NaOH) và Calcium hydroxide (Ca(OH)₂)',
    ],
    difficulty: 'Nhận biết',
    points: 2.5,
  },
  {
    id: 'q-khtn8-2',
    lessonId: 'khtn-8-bai-5',
    grade: 8,
    domain: 'hoa-hoc',
    question:
      'Cho 5,6 gam Iron (Fe = 56) phản ứng hoàn toàn với dung dịch Hydrochloric acid (HCl) dư tạo thành muối Iron(II) chloride (FeCl₂) và khí Hydrogen (H₂). Thể tích khí Hydrogen thu được ở điều kiện chuẩn (25°C, 1 bar; 1 mol khí chiếm 24,79 L) là:',
    questionType: 'single_choice',
    options: ['2,479 lít', '2,240 lít', '4,958 lít', '1,2395 lít'],
    correctAnswer: 0,
    explanation:
      'Đáp án A. n_Fe = 5,6 / 56 = 0,1 mol. PTHH: Fe + 2HCl → FeCl₂ + H₂↑ ⇒ n_H₂ = 0,1 mol ⇒ V_H₂ (đkc) = 0,1 × 24,79 = 2,479 lít.',
    solutionSteps: [
      'Dữ kiện: m(Fe) = 5,6 g | M(Fe) = 56 g/mol | Dung dịch HCl dư | Vₘ = 24,79 L/mol (25°C, 1 bar)',
      'Bước 1 (Phương trình hóa học và số mol Iron phản ứng):\n[EQ] Fe + 2HCl → FeCl₂ + H₂ ↑\nSố mol sắt (Iron) đã phản ứng:\n[EQ] n_{Fe} = \\frac{m_{Fe}}{M_{Fe}} = \\frac{5,6}{56} = 0,1 mol',
      'Bước 2 (Thể tích khí hydrogen H₂ thu được ở đkc): Theo phương trình hóa học, tỉ lệ mol Fe : H₂ = 1 : 1, nên:\n[EQ] n_{H₂} = n_{Fe} = 0,1 mol\nThể tích khí H₂ ở điều kiện chuẩn (25°C, 1 bar):\n[EQ] V_{H₂} = n_{H₂} × 24,79 = 0,1 × 24,79 = 2,479 L   ⇒   Chọn đáp án A',
    ],
    difficulty: 'Vận dụng',
    points: 2.5,
  },
  {
    id: 'q-khtn8-essay-1',
    lessonId: 'khtn-8-bai-5',
    grade: 8,
    domain: 'hoa-hoc',
    question:
      '[Tự luận] Cho 6,5 gam kim loại Zinc (Kẽm - Zn = 65) tác dụng vừa đủ với 200 mL dung dịch Hydrochloric acid (HCl), thu được muối Zinc chloride (ZnCl₂) và khí Hydrogen (H₂) ở điều kiện chuẩn (25°C, 1 bar). Em hãy trình bày lời giải (hoặc chụp ảnh bài làm tải lên): a) Viết phương trình hóa học; b) Tính thể tích khí Hydrogen thu được ở đkc; c) Tính nồng độ mol (CM) của dung dịch HCl đã dùng.',
    questionType: 'essay',
    options: [],
    allowImageUpload: true,
    hint: 'Gợi ý: n(Zn) = 6,5 / 65 = 0,1 mol; PTHH: Zn + 2HCl → ZnCl₂ + H₂ ↑; V(dd HCl) = 0,200 L.',
    explanation:
      'a) Zn + 2HCl → ZnCl₂ + H₂ ↑. b) n(Zn) = 0,1 mol ⇒ V(H₂) = 0,1 × 24,79 = 2,479 L. c) n(HCl) = 0,2 mol ⇒ CM(HCl) = 0,2 / 0,200 = 1 M.',
    solutionSteps: [
      'Dữ kiện: m(Zn) = 6,5 g | M(Zn) = 65 g/mol | V(dd HCl) = 200 mL = 0,200 L | Vₘ = 24,79 L/mol (25°C, 1 bar)',
      'Bước 1 (Phương trình hóa học):\n[EQ] Zn + 2HCl → ZnCl₂ + H₂ ↑\nSố mol kẽm đã phản ứng:\n[EQ] n_{Zn} = \\frac{m_{Zn}}{M_{Zn}} = \\frac{6,5}{65} = 0,1 mol',
      'Bước 2 (Thể tích khí hydrogen (H₂) thu được): Theo phương trình hóa học, tỉ lệ mol Zn : H₂ = 1 : 1, nên:\n[EQ] n_{H₂} = n_{Zn} = 0,1 mol\nThể tích khí H₂ ở điều kiện chuẩn (25°C, 1 bar):\n[EQ] V_{H₂} = n_{H₂} × 24,79 = 0,1 × 24,79 = 2,479 L',
      'Bước 3 (Nồng độ mol của dung dịch HCl): Theo phương trình hóa học, tỉ lệ mol Zn : HCl = 1 : 2, nên:\n[EQ] n_{HCl} = 2 × n_{Zn} = 2 × 0,1 = 0,2 mol\nNồng độ mol của dung dịch HCl:\n[EQ] C_{M} (HCl) = \\frac{n_{HCl}}{V_{dd}} = \\frac{0,2}{0,200} = 1 mol/L = 1 M',
    ],
    sampleAnswer:
      'a) Zn + 2HCl → ZnCl₂ + H₂ ↑ ; n(Zn) = 6,5 / 65 = 0,1 mol\nb) n(H₂) = n(Zn) = 0,1 mol ⇒ V(H₂) = 0,1 × 24,79 = 2,479 L\nc) n(HCl) = 2 × 0,1 = 0,2 mol ⇒ CM(HCl) = 0,2 / 0,200 = 1 mol/L = 1 M.',
    difficulty: 'Vận dụng',
    points: 3.0,
  },
  {
    id: 'q-khtn8-3',
    lessonId: 'khtn-8-bai-8',
    grade: 8,
    domain: 'vat-li',
    question:
      'Tác dụng một áp lực F = 600 N vuông góc lên một mặt sàn có diện tích bị ép S = 0,03 m². Áp suất p gây ra trên mặt sàn là:',
    questionType: 'single_choice',
    options: ['20 000 Pa', '18 Pa', '2 000 Pa', '200 Pa'],
    correctAnswer: 0,
    explanation:
      'Đáp án A. Áp suất p = F / S = 600 / 0,03 = 20 000 Pa.',
    solutionSteps: [
      'Dữ kiện: Áp lực vuông góc: F = 600 N | Diện tích bị ép: S = 0,03 m²',
      'Bước 1 (Công thức tính áp suất lên mặt sàn): Áp suất bằng độ lớn áp lực chia cho diện tích bị ép:\n[EQ] p = \\frac{F}{S}',
      'Bước 2 (Thay số tính áp suất p): Thay F = 600 N và S = 0,03 m²:\n[EQ] p = \\frac{600}{0,03} = 20 000 Pa = 20 kPa   ⇒   Chọn đáp án A',
    ],
    difficulty: 'Thông hiểu',
    points: 2.5,
  },

  // LỚP 9
  {
    id: 'q-khtn9-1',
    lessonId: 'khtn-9-bai-4',
    grade: 9,
    domain: 'vat-li',
    question:
      'Theo Định luật Ohm, khi đặt hiệu điện thế U = 12 V vào hai đầu đoạn mạch gồm hai điện trở R₁ = 8 Ω và R₂ = 16 Ω mắc nối tiếp thì cường độ dòng điện chạy trong mạch và công suất tiêu thụ của cả đoạn mạch lần lượt là:',
    questionType: 'single_choice',
    options: [
      'I = 0,5 A và P = 6,0 W',
      'I = 1,5 A và P = 18,0 W',
      'I = 0,5 A và P = 12,0 W',
      'I = 2,0 A và P = 24,0 W',
    ],
    correctAnswer: 0,
    explanation:
      'Đáp án A. R_tđ = R₁ + R₂ = 8 + 16 = 24 Ω; I = U / R_tđ = 12 / 24 = 0,5 A; P = U × I = 12 × 0,5 = 6,0 W.',
    solutionSteps: [
      'Dữ kiện: R₁ = 8 Ω (mắc nối tiếp R₂) | R₂ = 16 Ω | Hiệu điện thế: U = 12 V | Công thức: I = U / R_{tđ} ; P = U × I',
      'Bước 1 (Điện trở tương đương của đoạn mạch nối tiếp): Vì R₁ mắc nối tiếp R₂ nên:\n[EQ] R_{tđ} = R₁ + R₂ = 8 + 16 = 24 Ω',
      'Bước 2 (Cường độ dòng điện chạy trong mạch): Áp dụng Định luật Ohm:\n[EQ] I = \\frac{U}{R_{tđ}} = \\frac{12}{24} = 0,5 A',
      'Bước 3 (Công suất tiêu thụ của cả đoạn mạch):\n[EQ] P = U × I = 12 × 0,5 = 6,0 W   ⇒   Chọn đáp án A',
    ],
    difficulty: 'Vận dụng',
    points: 2.5,
  },
  {
    id: 'q-khtn9-2',
    lessonId: 'khtn-9-bai-8',
    grade: 9,
    domain: 'hoa-hoc',
    question:
      'Đun nóng hỗn hợp gồm Acetic acid (CH₃COOH) và Ethylic alcohol (C₂H₅OH) có mặt dung dịch Sulfuric acid (H₂SO₄) đặc làm xúc tác thì thu được chất hữu cơ có mùi thơm đặc trưng. Tên gọi chuẩn IUPAC và công thức của ester đó là:',
    questionType: 'single_choice',
    options: [
      'Ethyl acetate (CH₃COOC₂H₅)',
      'Sodium acetate (CH₃COONa)',
      'Ethylene (CH₂=CH₂)',
      'Methane (CH₄)',
    ],
    correctAnswer: 0,
    explanation:
      'Đáp án A. Phản ứng ester hóa: CH₃COOH + C₂H₅OH ⇄ CH₃COOC₂H₅ (Ethyl acetate) + H₂O.',
    solutionSteps: [
      'Dữ kiện: Chất tham gia: CH₃COOH và C₂H₅OH | Xúc tác: H₂SO₄ đặc, đun nóng (t°)',
      'Bước 1 (Phương trình hóa học của phản ứng ester hóa):\n[EQ] CH₃COOH + C₂H₅OH ⇄ CH₃COOC₂H₅ + H₂O   (H₂SO₄ đặc, t°)',
      'Bước 2 (Tên gọi chuẩn IUPAC của sản phẩm): Ester CH₃COOC₂H₅ gồm gốc Ethyl (-C₂H₅) và gốc acetate (CH₃COO-):\n[EQ] CH₃COOC₂H₅ : Ethyl acetate   ⇒   Chọn đáp án A',
    ],
    difficulty: 'Thông hiểu',
    points: 2.5,
  },
  {
    id: 'q-khtn9-3',
    lessonId: 'khtn-9-bai-8',
    grade: 9,
    domain: 'sinh-hoc',
    question:
      'Một đoạn phân tử DNA (Deoxyribonucleic acid) ở sinh vật nhân thực có tổng số N = 3000 Nucleotide, trong đó số Nucleotide loại Adenine (A) = 600. Số Nucleotide loại Guanine (G) và tổng số liên kết Hydrogen (H) của đoạn DNA lần lượt là:',
    questionType: 'single_choice',
    options: [
      'G = 900 Nucleotide và H = 3900 liên kết Hydrogen',
      'G = 600 Nucleotide và H = 3000 liên kết Hydrogen',
      'G = 900 Nucleotide và H = 3600 liên kết Hydrogen',
      'G = 1200 Nucleotide và H = 4200 liên kết Hydrogen',
    ],
    correctAnswer: 0,
    explanation:
      'Đáp án A. Từ 2A + 2G = 3000 ⇒ G = (3000 - 2×600)/2 = 900. Liên kết Hydrogen: H = 2A + 3G = 2×600 + 3×900 = 3900.',
    solutionSteps: [
      'Dữ kiện: Tổng số Nucleotide: N = 3000 | Số Nucleotide loại A: A = T = 600 | Công thức: N = 2A + 2G | Liên kết Hydrogen: H = 2A + 3G',
      'Bước 1 (Số Nucleotide loại Guanine (G) của đoạn DNA): Theo nguyên tắc bổ sung 2A + 2G = N, ta có:\n[EQ] G = C = \\frac{N - 2A}{2} = \\frac{3000 - 2 × 600}{2} = \\frac{1800}{2} = 900 Nucleotide',
      'Bước 2 (Tổng số liên kết Hydrogen (H) của đoạn DNA): Vì A liên kết với T bằng 2 liên kết H, G liên kết với C bằng 3 liên kết H:\n[EQ] H = 2A + 3G = 2 × 600 + 3 × 900 = 1200 + 2700 = 3900 liên kết   ⇒   Chọn đáp án A',
    ],
    difficulty: 'Vận dụng',
    points: 2.5,
  },
  {
    id: 'q-khtn9-essay-1',
    lessonId: 'khtn-9-bai-4',
    grade: 9,
    domain: 'vat-li',
    question:
      '[Tự luận] Cho đoạn mạch gồm hai điện trở R₁ = 6 Ω và R₂ = 12 Ω mắc song song với nhau vào nguồn điện một chiều có hiệu điện thế không đổi U = 12 V. Em hãy trình bày từng bước lời giải (hoặc chụp ảnh bài làm tải lên): a) Tính điện trở tương đương R_tđ của đoạn mạch; b) Tính cường độ dòng điện qua mỗi điện trở (I₁, I₂) và cường độ dòng điện mạch chính (I); c) Tính nhiệt lượng Q tỏa ra trên cả đoạn mạch trong thời gian 5 phút.',
    questionType: 'essay',
    options: [],
    allowImageUpload: true,
    hint: 'Gợi ý: R(tđ) = (R₁ × R₂) / (R₁ + R₂); I₁ = U / R₁, I₂ = U / R₂; đổi 5 phút = 300 s để tính Q = U × I × t.',
    explanation:
      'a) R(tđ) = (6 × 12)/(6 + 12) = 4 Ω. b) I₁ = 12/6 = 2 A; I₂ = 12/12 = 1 A; I = 2 + 1 = 3 A. c) Q = U · I · t = 12 × 3 × 300 = 10 800 J.',
    solutionSteps: [
      'Dữ kiện: R₁ = 6 Ω (mắc song song R₂) | R₂ = 12 Ω | Hiệu điện thế: U = U₁ = U₂ = 12 V | Thời gian: t = 5 phút = 300 s',
      'Bước 1 (Điện trở tương đương của đoạn mạch): Vì R₁ mắc song song với R₂ (R₁ // R₂) nên:\n[EQ] R_{tđ} = \\frac{R₁ × R₂}{R₁ + R₂} = \\frac{6 × 12}{6 + 12} = \\frac{72}{18} = 4 Ω',
      'Bước 2 (Cường độ dòng điện qua mỗi điện trở và mạch chính): Do mạch mắc song song nên U₁ = U₂ = U = 12 V:\n[EQ] I₁ = \\frac{U}{R₁} = \\frac{12}{6} = 2 A   ;   I₂ = \\frac{U}{R₂} = \\frac{12}{12} = 1 A\nCường độ dòng điện chạy trong mạch chính:\n[EQ] I = I₁ + I₂ = 2 + 1 = 3 A',
      'Bước 3 (Nhiệt lượng tỏa ra trên đoạn mạch trong 5 phút): Theo định luật Joule – Lenz:\n[EQ] Q = U × I × t = 12 × 3 × 300 = 10 800 J = 10,8 kJ',
    ],
    sampleAnswer:
      'a) R(tđ) = (6 × 12) / (6 + 12) = 4 Ω\nb) I₁ = 12/6 = 2 A; I₂ = 12/12 = 1 A; I = I₁ + I₂ = 3 A\nc) t = 5 phút = 300 s ⇒ Q = U · I · t = 12 × 3 × 300 = 10 800 J (10,8 kJ).',
    difficulty: 'Vận dụng',
    points: 3.0,
  },
];

export const LESSON_QUIZZES: QuizMeta[] = [
  {
    id: 'quiz-cell-6',
    lessonId: 'khtn-6-bai-9',
    lessonTitle: 'Bài 9: Oxygen, Không khí & Tế bào KHTN 6',
    grade: 6,
    domain: 'hoa-hoc',
    title: 'Đề kiểm tra KHTN Lớp 6: Oxygen - Không khí & Tế bào (Trắc nghiệm + Tự luận)',
    description: 'Đánh giá kiến thức trọng tâm về khí Oxygen (O₂), Nitrogen (N₂), cấu trúc tế bào và bài tập tự luận giải thích hiện tượng.',
    durationMinutes: 15,
    passScore: 6.0,
    questionCount: 2,
    isPublished: true,
  },
  {
    id: 'quiz-atom-7',
    lessonId: 'khtn-7-bai-2',
    lessonTitle: 'Bài 2: Nguyên tử & Bảng tuần hoàn IUPAC',
    grade: 7,
    domain: 'hoa-hoc',
    title: 'Đề kiểm tra KHTN Lớp 7: Nguyên tử Rutherford - Bohr & Danh pháp IUPAC (Có Tự luận)',
    description: 'Kiểm tra cấu tạo nguyên tử, tên nguyên tố chuẩn quốc tế IUPAC (Hydrogen, Carbon, Oxygen, Sodium, Chlorine, Aluminium) kèm tự luận vẽ lớp vỏ electron.',
    durationMinutes: 15,
    passScore: 6.0,
    questionCount: 3,
    isPublished: true,
  },
  {
    id: 'quiz-acid-8',
    lessonId: 'khtn-8-bai-5',
    lessonTitle: 'Bài 8: Acid - Base - Thang pH - Oxide - Muối',
    grade: 8,
    domain: 'hoa-hoc',
    title: 'Đề kiểm tra KHTN Lớp 8: Acid - Base - Thang pH & Bài toán Tự luận Hóa học',
    description: 'Kiểm tra tính chất hóa học của Hydrochloric acid (HCl), Sulfuric acid (H₂SO₄), Sodium hydroxide (NaOH), thang pH và bài toán tự luận tính theo PTHH.',
    durationMinutes: 15,
    passScore: 6.0,
    questionCount: 3,
    isPublished: true,
  },
  {
    id: 'quiz-optics-9',
    lessonId: 'khtn-9-bai-4',
    lessonTitle: 'Bài 8: Định luật Ohm, Hợp chất hữu cơ & DNA',
    grade: 9,
    domain: 'vat-li',
    title: 'Đề kiểm tra KHTN Lớp 9: Định luật Ohm, Hóa hữu cơ IUPAC & Phân tử DNA (Có Tự luận)',
    description: 'Tổng hợp trắc nghiệm & tự luận Định luật Ohm (I = U / R), phản ứng ester hóa Ethyl acetate và cấu trúc không gian phân tử DNA.',
    durationMinutes: 20,
    passScore: 6.0,
    questionCount: 2,
    isPublished: true,
  },
];

export const BADGES: Badge[] = [
  {
    id: 'badge_explorer',
    name: 'Nhà Khám Phá Khoa Học',
    description: 'Hoàn thành bài học Khoa học tự nhiên đầu tiên trên KHOA HỌC SỐ KHTN.',
    icon: 'Compass',
    requiredCriteria: 'Hoàn thành ≥ 1 bài học',
  },
  {
    id: 'badge_lab_pioneer',
    name: 'Chuyên Gia Thí Nghiệm 3D',
    description: 'Thực hành ít nhất 2 mô phỏng tương tác trong KHOA HỌC SỐ KHTN.',
    icon: 'FlaskConical',
    requiredCriteria: 'Tương tác ≥ 2 mô phỏng 3D',
  },
  {
    id: 'badge_physics_master',
    name: 'Bậc Thầy Vật Lí & Định Luật Ohm',
    description: 'Hoàn thành bài học Vật lí và đạt từ 8,0 điểm trở lên trong bài kiểm tra.',
    icon: 'Zap',
    requiredCriteria: 'Điểm Quiz Vật lí ≥ 8,0',
  },
  {
    id: 'badge_quiz_champion',
    name: 'Thủ Khoa Khoa Học Tự Nhiên',
    description: 'Đạt điểm tuyệt đối 10/10 trong một bài kiểm tra năng lực KHTN.',
    icon: 'Award',
    requiredCriteria: 'Đạt 10/10 điểm Quiz',
  },
];
