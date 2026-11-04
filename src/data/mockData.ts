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
const heroLabImg = '/assets/images/hero_science_lab_1793629233704.jpg';
const domainChemImg = '/assets/images/domain_chemistry_bright_1793629233529.jpg';
const domainPhysImg = '/assets/images/domain_physics_bright_1793629235212.jpg';
const domainBioImg = '/assets/images/domain_biology_bright_1793629236067.jpg';

export const HERO_LAB_IMAGE = heroLabImg;

export const DOMAINS: DomainInfo[] = [
  {
    id: 'hoa-hoc',
    name: 'Chất và sự biến đổi của chất (Hóa học)',
    shortName: 'Hóa học',
    color: '#059669',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    iconName: 'FlaskConical',
    description:
      'Khám phá cấu tạo nguyên tử, bảng tuần hoàn các nguyên tố hóa học chuẩn quốc tế IUPAC (Hydrogen, Carbon, Nitrogen, Oxygen, Sodium, Chlorine...), liên kết hóa học, phản ứng Acid - Base - Oxide - Muối và hợp chất hữu cơ.',
    image: domainChemImg,
  },
  {
    id: 'vat-li',
    name: 'Năng lượng và sự biến đổi (Vật lí)',
    shortName: 'Vật lí',
    color: '#0284c7',
    bgColor: 'bg-sky-50',
    borderColor: 'border-sky-200',
    iconName: 'Zap',
    description:
      'Tìm hiểu các quy luật về tốc độ chuyển động, lực, áp suất Archimedes, năng lượng cơ học, điện học, định luật Ohm (I = U / R), cảm ứng điện từ, khúc xạ và tán sắc ánh sáng.',
    image: domainPhysImg,
  },
  {
    id: 'sinh-hoc',
    name: 'Vật sống (Sinh học)',
    shortName: 'Sinh học',
    color: '#d97706',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    iconName: 'Dna',
    description:
      'Nghiên cứu cấu trúc tế bào thực vật - động vật, quang hợp, hô hấp tế bào, sinh học cơ thể người, di truyền học Mendel, cấu trúc phân tử DNA - RNA - Protein và tiến hóa.',
    image: domainBioImg,
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
    image: domainBioImg,
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
    image: domainChemImg,
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
    image: domainBioImg,
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
    image: domainChemImg,
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
    image: domainPhysImg,
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
    image: domainBioImg,
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
        title: '1. Tính chất và tầm quan trọng của Oxygen (O₂)',
        content: [
          'Ở điều kiện thường, khí Oxygen (O₂) là chất khí không màu, không mùi, không vị, nặng hơn không khí và ít tan trong nước.',
          'Oxygen là nguyên tố thiết yếu duy trì quá trình hô hấp tế bào của con người, động vật, thực vật và duy trì sự cháy của các nhiên liệu.',
        ],
        keyPoints: [
          'Công thức phân tử khí Oxygen: O₂ (khối lượng phân tử 32 amu).',
          'Không có Oxygen, sự sống và sự cháy không thể duy trì.',
        ],
        formula: 'O₂ (Oxygen)',
        formulaMeaning: 'Hai nguyên tử Oxygen liên kết cộng hóa trị tạo thành phân tử khí Oxygen.',
        imageUrl: domainChemImg,
        imageCaption: 'Thí nghiệm thu khí Oxygen bằng phương pháp đẩy nước trong KHOA HỌC SỐ KHTN.',
      },
      {
        title: '2. Thành phần của không khí quanh ta',
        content: [
          'Không khí là một hỗn hợp khí gồm khoảng 78% thể tích khí Nitrogen (N₂), 21% thể tích khí Oxygen (O₂), khoảng 1% gồm Carbon dioxide (CO₂), hơi nước và các khí hiếm như Argon (Ar), Helium (He).',
        ],
        keyPoints: [
          'Nitrogen (N₂): ~78% thể tích không khí.',
          'Oxygen (O₂): ~21% thể tích không khí.',
        ],
      },
    ],
    keyTakeaways: [
      'Oxygen (O₂) là chất khí không màu, không mùi, ít tan trong nước, duy trì sự hô hấp và sự cháy.',
      'Không khí chứa khoảng 78% Nitrogen (N₂), 21% Oxygen (O₂) và 1% các khí khác.',
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
        title: '1. Cấu tạo chung của tế bào',
        content: [
          'Mọi cơ thể sinh vật đều được cấu tạo từ tế bào. Mỗi tế bào đều có 3 thành phần chính: Màng tế bào, Chất tế bào (chứa các bào quan như ti thể, ribosome, lục lạp) và Nhân tế bào (chứa vật chất di truyền DNA) hoặc vùng nhân.',
        ],
        keyPoints: [
          'Tế bào thực vật có thành Cellulose vững chắc và bào quan Lục lạp thực hiện quang hợp.',
          'Tế bào động vật không có thành Cellulose và không có lục lạp.',
        ],
        imageUrl: domainBioImg,
        imageCaption: 'Mô hình 3D cấu trúc hiển vi của tế bào thực vật và tế bào động vật.',
      },
    ],
    keyTakeaways: [
      'Tế bào là đơn vị cấu trúc và chức năng của mọi cơ thể sống.',
      'Lục lạp là bào quan quang hợp đặc trưng của tế bào thực vật.',
    ],
    thumbnailUrl: domainBioImg,
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
        title: '1. Mô hình nguyên tử Rutherford - Bohr',
        content: [
          'Nguyên tử là hạt vô cùng nhỏ và trung hòa về điện. Nguyên tử gồm hạt nhân mang điện tích dương nằm ở tâm và lớp vỏ gồm một hay nhiều Electron mang điện tích âm chuyển động xung quanh hạt nhân.',
          'Hạt nhân nguyên tử được tạo thành bởi các hạt Proton (p, mang điện tích +1) và Neutron (n, không mang điện). Trong mỗi nguyên tử: Số Proton = Số Electron = Số đơn vị điện tích hạt nhân (Z).',
        ],
        keyPoints: [
          'Proton (p): điện tích +1, khối lượng ≈ 1 amu.',
          'Neutron (n): điện tích 0, khối lượng ≈ 1 amu.',
          'Electron (e): điện tích -1, khối lượng rất nhỏ (≈ 0,00055 amu).',
        ],
        formula: 'Z = p = e   |   Khối lượng nguyên tử A ≈ p + n (amu)',
        formulaMeaning: 'Số đơn vị điện tích hạt nhân Z bằng số hạt Proton và bằng số hạt Electron.',
        imageUrl: domainChemImg,
        imageCaption: 'Mô phỏng 3D cấu tạo nguyên tử Rutherford - Bohr trong KHOA HỌC SỐ KHTN.',
      },
      {
        title: '2. Tên gọi nguyên tố hóa học theo chuẩn quốc tế IUPAC',
        content: [
          'Trong bộ sách Kết nối tri thức với cuộc sống, tên các nguyên tố hóa học được viết và đọc theo chuẩn quốc tế IUPAC: H (Hydrogen), He (Helium), Li (Lithium), Be (Beryllium), B (Boron), C (Carbon), N (Nitrogen), O (Oxygen), F (Fluorine), Ne (Neon).',
          'Các nguyên tố chu kì 3, 4 và kim loại thông dụng: Na (Sodium), Mg (Magnesium), Al (Aluminium), Si (Silicon), P (Phosphorus), S (Sulfur), Cl (Chlorine), Ar (Argon), K (Potassium), Ca (Calcium), Fe (Iron), Cu (Copper), Zn (Zinc), Br (Bromine), Ag (Silver), Ba (Barium), Au (Gold).',
        ],
      },
    ],
    keyTakeaways: [
      'Nguyên tử trung hòa về điện: Số hạt Proton (+) luôn bằng số hạt Electron (-).',
      'Sử dụng thống nhất danh pháp quốc tế IUPAC: Hydrogen, Oxygen, Carbon, Nitrogen, Sodium, Potassium, Calcium, Iron, Copper, Aluminium, Chlorine, Sulfur.',
    ],
    thumbnailUrl: domainChemImg,
    simulationId: 'sim-atom-bohr',
    videoUrl: 'https://www.youtube.com/embed/FSyAehMdpyI',
    documentId: 'doc-khtn-7-1',
    quizCount: 5,
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
        title: '1. Công thức tính tốc độ chuyển động',
        content: [
          'Tốc độ chuyển động của một vật được xác định bằng thương số giữa quãng đường vật đi được (s) và thời gian (t) để đi hết quãng đường đó.',
          'Đơn vị tốc độ trong hệ SI là mét trên giây (m/s) và đơn vị thường dùng trong giao thông là kilômét trên giờ (km/h). Quy đổi: 1 m/s = 3,6 km/h.',
        ],
        formula: 'v = s / t   ⇒   s = v × t   |   t = s / v',
        formulaMeaning: 'v: tốc độ (m/s hoặc km/h); s: quãng đường (m hoặc km); t: thời gian (s hoặc h).',
        imageUrl: domainPhysImg,
        imageCaption: 'Minh họa phép đo tốc độ chuyển động bằng cổng quang điện trong phòng thực hành Vật lí.',
      },
    ],
    keyTakeaways: [
      'Công thức tốc độ: v = s / t.',
      'Đổi đơn vị: 1 m/s = 3,6 km/h; 36 km/h = 10 m/s.',
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
    id: 'khtn-8-bai-5',
    topicId: 't8-1',
    grade: 8,
    domain: 'hoa-hoc',
    code: 'KHTN8-B05',
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
        title: '1. Dung dịch Acid và Dung dịch Base theo danh pháp IUPAC',
        content: [
          'Acid là những hợp chất trong phân tử có nguyên tử Hydrogen liên kết với gốc acid; khi tan trong nước, Acid tạo ra ion H⁺. Các Acid quan trọng: Hydrochloric acid (HCl), Sulfuric acid (H₂SO₄), Nitric acid (HNO₃), Phosphoric acid (H₃PO₄), Acetic acid (CH₃COOH). Dung dịch Acid làm quỳ tím chuyển sang màu đỏ (pH < 7).',
          'Base là những hợp chất trong phân tử có nguyên tử kim loại liên kết với nhóm Hydroxide (-OH); khi tan trong nước, các Base kiềm tạo ra ion OH⁻. Các Base quan trọng: Sodium hydroxide (NaOH), Potassium hydroxide (KOH), Calcium hydroxide (Ca(OH)₂), Barium hydroxide (Ba(OH)₂), Copper(II) hydroxide (Cu(OH)₂), Iron(III) hydroxide (Fe(OH)₃). Dung dịch Base tan làm quỳ tím hóa xanh và Phenolphthalein hóa hồng (pH > 7).',
        ],
        keyPoints: [
          'Hydrochloric acid (HCl) + Sodium hydroxide (NaOH) → Sodium chloride (NaCl) + Nước (H₂O).',
          'Môi trường Acid: pH < 7; Môi trường trung tính: pH = 7; Môi trường Base: pH > 7.',
        ],
        formula: 'HCl + NaOH → NaCl + H₂O   |   pH = -log[H⁺]',
        formulaMeaning: 'Phản ứng trung hòa giữa Hydrochloric acid và Sodium hydroxide tạo muối Sodium chloride và nước.',
        imageUrl: domainChemImg,
        imageCaption: 'Thí nghiệm chuẩn độ Acid - Base và đo pH điện tử trong KHOA HỌC SỐ KHTN.',
      },
      {
        title: '2. Oxide và Muối theo chuẩn IUPAC',
        content: [
          'Oxide là hợp chất của hai nguyên tố, trong đó có một nguyên tố là Oxygen. Ví dụ: Carbon dioxide (CO₂), Sulfur dioxide (SO₂), Sulfur trioxide (SO₃), Diphosphorus pentoxide (P₂O₅), Calcium oxide (CaO), Copper(II) oxide (CuO), Iron(III) oxide (Fe₂O₃), Aluminium oxide (Al₂O₃).',
          'Muối là hợp chất được tạo thành khi thay thế ion H⁺ của Acid bằng ion kim loại hoặc ion Ammonium (NH₄⁺). Ví dụ: Sodium chloride (NaCl), Calcium carbonate (CaCO₃), Copper(II) sulfate (CuSO₄), Silver nitrate (AgNO₃), Barium sulfate (BaSO₄).',
        ],
      },
    ],
    keyTakeaways: [
      'Acid phân li ra ion H⁺ (pH < 7, quỳ tím hóa đỏ): Hydrochloric acid (HCl), Sulfuric acid (H₂SO₄).',
      'Base kiềm phân li ra ion OH⁻ (pH > 7, quỳ tím hóa xanh, Phenolphthalein hóa hồng): Sodium hydroxide (NaOH), Calcium hydroxide (Ca(OH)₂).',
      'Oxide và Muối được gọi tên thống nhất theo danh pháp quốc tế IUPAC.',
    ],
    thumbnailUrl: domainChemImg,
    simulationId: 'sim-acid-base-ph',
    videoUrl: 'https://www.youtube.com/embed/ANi709MYnWg',
    documentId: 'doc-khtn-8-1',
    quizCount: 5,
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
        title: '1. Áp suất và Lực đẩy Archimedes',
        content: [
          'Áp suất là độ lớn của áp lực (F) trên một đơn vị diện tích bị ép (S): p = F / S (1 Pa = 1 N/m²).',
          'Một vật nhúng vào chất lỏng bị chất lỏng đẩy thẳng đứng từ dưới lên với lực đẩy Archimedes có độ lớn bằng trọng lượng phần chất lỏng mà vật chiếm chỗ: F_A = d × V.',
        ],
        formula: 'p = F / S   |   F_A = d × V',
        formulaMeaning: 'p: áp suất (Pa); F: áp lực (N); S: diện tích bị ép (m²); d: trọng lượng riêng của chất lỏng (N/m³); V: thể tích phần chất lỏng bị chiếm chỗ (m³).',
        imageUrl: domainPhysImg,
        imageCaption: 'Mô phỏng khảo sát mạch điện và đo đại lượng vật lí trong KHOA HỌC SỐ KHTN.',
      },
    ],
    keyTakeaways: [
      'Công thức áp suất: p = F / S (Pa).',
      'Công thức lực đẩy Archimedes: F_A = d × V (N).',
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
        title: '1. Định luật Ohm và Công suất điện',
        content: [
          'Cường độ dòng điện I chạy qua một dây dẫn tỉ lệ thuận với hiệu điện thế U đặt vào hai đầu dây và tỉ lệ nghịch với điện trở R của dây dẫn đó: I = U / R.',
          'Đơn vị đo điện trở là Ohm (Ω). Công suất tiêu thụ điện năng của đoạn mạch là P = U × I = I² × R (đơn vị Watt - W).',
        ],
        formula: 'I = U / R   |   P = U × I = I² × R   |   n₁ · sin(i) = n₂ · sin(r)',
        formulaMeaning: 'I: cường độ dòng điện (A); U: hiệu điện thế (V); R: điện trở (Ω); P: công suất điện (W).',
        imageUrl: domainPhysImg,
        imageCaption: 'Thực hành mạch điện Định luật Ohm và quang học khúc xạ ánh sáng 3D.',
      },
    ],
    keyTakeaways: [
      'Định luật Ohm: I = U / R (I tính bằng Ampere, U tính bằng Volt, R tính bằng Ohm).',
      'Định luật khúc xạ ánh sáng: n₁ · sin(i) = n₂ · sin(r).',
    ],
    thumbnailUrl: domainPhysImg,
    simulationId: 'sim-electric-circuit',
    videoUrl: 'https://www.youtube.com/embed/HsLLq6Rm5tU',
    documentId: 'doc-khtn-9-1',
    quizCount: 5,
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
        title: '1. Cấu trúc không gian phân tử DNA và Phiên mã RNA',
        content: [
          'Phân tử DNA (Deoxyribonucleic acid) gồm 2 mạch polynucleotide xoắn song song quanh một trục, cấu tạo từ 4 loại đơn phân Nucleotide: Adenine (A), Thymine (T), Guanine (G) và Cytosine (C).',
          'Theo nguyên tắc bổ sung: Adenine (A) liên kết với Thymine (T) bằng 2 liên kết Hydrogen; Guanine (G) liên kết với Cytosine (C) bằng 3 liên kết Hydrogen. Phân tử RNA (Ribonucleic acid) có cấu trúc 1 mạch đơn gồm 4 loại đơn phân A, U (Uracil), G, C.',
        ],
        formula: 'N = 2A + 2G   |   L = (N / 2) × 3,4 Å   |   H = 2A + 3G',
        formulaMeaning: 'N: tổng số Nucleotide; L: chiều dài phân tử DNA (Å); H: tổng số liên kết Hydrogen.',
        imageUrl: domainBioImg,
        imageCaption: 'Mô hình 3D chuỗi xoắn kép phân tử DNA và các cặp base bổ sung A-T, G-C.',
      },
      {
        title: '2. Các hợp chất hữu cơ trọng tâm Lớp 9 (IUPAC)',
        content: [
          'Hydrocarbon: Methane (CH₄) tham gia phản ứng thế với Chlorine (Cl₂); Ethylene (CH₂=CH₂) có liên kết đôi C=C làm mất màu dung dịch Bromine (Br₂) và trùng hợp tạo Polyethylene (PE).',
          'Dẫn xuất Hydrocarbon & Carbohydrate: Ethylic alcohol hay Ethanol (C₂H₅OH) tác dụng với Sodium (Na); Acetic acid (CH₃COOH) phản ứng với Ethylic alcohol tạo ester Ethyl acetate (CH₃COOC₂H₅); Glucose (C₆H₁₂O₆) tham gia phản ứng tráng bạc với dung dịch Silver nitrate (AgNO₃) trong Ammonia (NH₃).',
        ],
      },
    ],
    keyTakeaways: [
      'Trong phân tử DNA: A = T, G = C; tổng số Nucleotide N = 2A + 2G; tổng liên kết Hydrogen H = 2A + 3G.',
      'Danh pháp hữu cơ chuẩn IUPAC: Methane (CH₄), Ethylene (C₂H₄), Ethylic alcohol / Ethanol (C₂H₅OH), Acetic acid (CH₃COOH), Ethyl acetate (CH₃COOC₂H₅), Glucose (C₆H₁₂O₆), Saccharose (C₁₂H₂₂O₁₁), Starch (Tinh bột), Cellulose.',
    ],
    thumbnailUrl: domainBioImg,
    simulationId: 'sim-dna-double-helix',
    videoUrl: 'https://www.youtube.com/embed/8kK2zwjRV0M',
    documentId: 'doc-khtn-9-1',
    quizCount: 5,
    viewCount: 4980,
    author: 'KHOA HỌC SỐ KHTN',
  },
];

export const SIMULATIONS_3D: Simulation3D[] = [
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
    relatedLessonId: 'khtn-8-bai-5',
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
    thumbnail: domainChemImg,
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
    thumbnail: domainChemImg,
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
    thumbnail: domainPhysImg,
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
    thumbnail: domainBioImg,
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
    thumbnail: domainBioImg,
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
