-- ====================================================================
-- KHTN THẦY HOÀNG - SEED DATA FOR SUPABASE
-- Seed GDPT 2018 Topics, Lessons, Simulations, Quizzes, Questions, Answer Keys
-- ====================================================================

-- 1. SEED TOPICS
INSERT INTO public.topics (id, grade, domain, code, title, description, order_index)
VALUES
  ('a1000000-0000-0000-0000-000000000006', 6, 'sinh-hoc', 'TOPIC-6-BIO', 'Tế bào - Đơn vị cơ sở của sự sống', 'Cấu tạo tế bào nhân sơ và nhân thực, kỹ năng sử dụng kính hiển vi quang học.', 1),
  ('a1000000-0000-0000-0000-000000000007', 7, 'hoa-hoc', 'TOPIC-7-CHEM', 'Nguyên tử - Nguyên tố hóa học', 'Mô hình nguyên tử Rutherford - Bohr, cấu tạo hạt nhân và các lớp vỏ electron.', 2),
  ('a1000000-0000-0000-0000-000000000008', 8, 'vat-li', 'TOPIC-8-PHYS', 'Điện học & Định luật Ôm', 'Cường độ dòng điện, hiệu điện thế, điện trở và sự phụ thuộc theo Định luật Ôm.', 3),
  ('a1000000-0000-0000-0000-000000000009', 8, 'hoa-hoc', 'TOPIC-8-ACID', 'Axit - Bazơ - Thang đo pH', 'Tính chất hóa học của axit clohiđric HCl, bazơ natri hiđroxit NaOH và chỉ thị màu pH.', 4),
  ('a1000000-0000-0000-0000-000000000010', 9, 'vat-li', 'TOPIC-9-OPT', 'Khúc xạ ánh sáng & Lăng kính', 'Hiện tượng khúc xạ qua mặt phân cách, định luật truyền thẳng và tán sắc ánh sáng.', 5)
ON CONFLICT (code) DO NOTHING;

-- 2. SEED SIMULATIONS
INSERT INTO public.simulations (id, slug, title, type, category, domain, grade, difficulty, description, learning_goal, key_concepts, thumbnail_url, is_published)
VALUES
  (
    'b1000000-0000-0000-0000-000000000001',
    'sim-atom-bohr',
    'Mô hình Cấu tạo Nguyên tử Rutherford - Bohr',
    'atom-bohr',
    'Cấu tạo chất',
    'hoa-hoc',
    7,
    'Cơ bản',
    'Mô phỏng 3D tương tác hạt nhân (Proton, Neutron) và các lớp vỏ electron chuyển động với quỹ đạo năng lượng xác định.',
    'Hiểu rõ cấu trúc hạt nhân, điện tích hạt và phân bố electron trên các lớp K, L, M.',
    ARRAY['Proton (p+)', 'Neutron (n0)', 'Electron (e-)', 'Lớp vỏ electron', 'Số hiệu nguyên tử Z'],
    'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=800&q=80',
    true
  ),
  (
    'b1000000-0000-0000-0000-000000000002',
    'sim-electric-circuit',
    'Phòng thí nghiệm Mạch điện & Định luật Ôm',
    'electric-circuit',
    'Điện học',
    'vat-li',
    8,
    'Cơ bản',
    'Bàn thí nghiệm ảo tương tác mạch điện một chiều. Tự do thay đổi hiệu điện thế pin nguồn (1.5V - 12V), giá trị điện trở (1Ω - 50Ω).',
    'Kiểm chứng công thức I = U / R, quan sát số đo trên ampe kế và vôn kế ảo trong thời gian thực.',
    ARRAY['Định luật Ôm', 'Điện trở R', 'Hiệu điện thế U', 'Cường độ I', 'Ampe kế', 'Vôn kế'],
    'https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?auto=format&fit=crop&w=800&q=80',
    true
  ),
  (
    'b1000000-0000-0000-0000-000000000003',
    'sim-acid-base-ph',
    'Chuẩn độ Axit - Bazơ & Thang đo chỉ thị màu pH',
    'acid-base-ph',
    'Dung dịch & Axit-Bazơ',
    'hoa-hoc',
    8,
    'Trung bình',
    'Mô phỏng chuẩn độ dung dịch HCl bằng NaOH với chỉ thị phenolphtalein, hiển thị đường cong chuẩn độ pH chuẩn.',
    'Nhận biết điểm tương đương pH = 7, màu sắc chất chỉ thị và sự biến thiên pH khi thêm bazơ.',
    ARRAY['Phản ứng trung hòa', 'Chỉ thị pH', 'Phenolphtalein', 'Điểm tương đương', 'Axit - Bazơ'],
    'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=800&q=80',
    true
  ),
  (
    'b1000000-0000-0000-0000-000000000004',
    'sim-microscope-cell',
    'Kính hiển vi quang học & Tế bào thực vật',
    'microscope-cell',
    'Sinh học tế bào',
    'sinh-hoc',
    6,
    'Cơ bản',
    'Mô hình 3D kính hiển vi quang học sinh học đầy đủ các bộ phận: thị kính, vật kính 4x/10x/40x, ốc sơ cấp, ốc vi cấp, đèn chiếu sáng.',
    'Rèn luyện kỹ năng điều chỉnh ốc vi cấp lấy tiêu cự, nhận diện lục lạp, không bào và thành tế bào.',
    ARRAY['Thành tế bào', 'Lục lạp', 'Màng tế bào', 'Nhân tế bào', 'Độ phóng đại kính hiển vi'],
    'https://images.unsplash.com/photo-1576086213369-97a306d36557?auto=format&fit=crop&w=800&q=80',
    true
  )
ON CONFLICT (slug) DO NOTHING;

-- 3. SEED LESSONS
INSERT INTO public.lessons (id, topic_id, grade, domain, code, title, summary, content, duration_minutes, view_count, thumbnail_url, is_published)
VALUES
  (
    'c1000000-0000-0000-0000-000000000002',
    'a1000000-0000-0000-0000-000000000007',
    7,
    'hoa-hoc',
    'KHTN-7-BAI-2',
    'Nguyên tử và Cấu tạo nguyên tử theo mô hình Rutherford - Bohr',
    'Tìm hiểu cấu trúc hạt nhân mang điện tích dương và các electron quay trên các lớp vỏ xác định xung quanh hạt nhân.',
    '<h2>I. Khái niệm về nguyên tử</h2><p>Nguyên tử là hạt vô cùng nhỏ, trung hòa về điện, cấu tạo nên các chất.</p><h2>II. Cấu tạo nguyên tử</h2><ul><li>Hạt nhân ở tâm: chứa proton (p, mang điện tích +) và neutron (n, không mang điện).</li><li>Vỏ nguyên tử: chứa các electron (e, mang điện tích -) chuyển động rất nhanh quanh hạt nhân theo từng lớp.</li></ul>',
    45,
    1420,
    'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=800&q=80',
    true
  ),
  (
    'c1000000-0000-0000-0000-000000000003',
    'a1000000-0000-0000-0000-000000000006',
    6,
    'sinh-hoc',
    'KHTN-6-BAI-3',
    'Kính hiển vi quang học và Quan sát tế bào thực vật',
    'Cấu tạo kính hiển vi quang học, kỹ năng sử dụng ốc sơ cấp, ốc vi cấp và thực hành soi tiêu bản tế bào vảy hành.',
    '<h2>I. Cấu tạo kính hiển vi</h2><p>Kính hiển vi quang học gồm 4 hệ thống chính: giá đỡ, phóng đại, chiếu sáng và điều chỉnh.</p><h2>II. Các bước quan sát</h2><p>1. Đặt tiêu bản lên bàn kính. 2. Dùng ốc sơ cấp hạ vật kính gần tiêu bản. 3. Nhìn thị kính nâng dần vật kính. 4. Dùng ốc vi cấp tinh chỉnh độ nét.</p>',
    45,
    1890,
    'https://images.unsplash.com/photo-1576086213369-97a306d36557?auto=format&fit=crop&w=800&q=80',
    true
  ),
  (
    'c1000000-0000-0000-0000-000000000008',
    'a1000000-0000-0000-0000-000000000008',
    8,
    'vat-li',
    'KHTN-8-BAI-8',
    'Mạch điện đơn giản và Định luật Ôm',
    'Mối quan hệ giữa cường độ dòng điện (I), hiệu điện thế (U) và điện trở (R). Thực hành lắp ráp mạch điện và đo lường thông số.',
    '<h2>I. Định luật Ôm</h2><p>Cường độ dòng điện chạy qua dây dẫn tỉ lệ thuận với hiệu điện thế đặt vào hai đầu dây và tỉ lệ nghịch với điện trở của dây.</p><p><strong>Công thức: I = U / R</strong></p>',
    45,
    2310,
    'https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?auto=format&fit=crop&w=800&q=80',
    true
  )
ON CONFLICT (code) DO NOTHING;

-- 4. LINK LESSONS AND SIMULATIONS
INSERT INTO public.lesson_simulations (lesson_id, simulation_id)
VALUES
  ('c1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000001'),
  ('c1000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000004'),
  ('c1000000-0000-0000-0000-000000000008', 'b1000000-0000-0000-0000-000000000002')
ON CONFLICT DO NOTHING;

-- 5. SEED LESSON ASSETS
INSERT INTO public.lesson_assets (lesson_id, title, format, type, file_size, file_url)
VALUES
  ('c1000000-0000-0000-0000-000000000002', 'Bài giảng điện tử: Mô hình Nguyên tử Rutherford - Bohr', 'pptx', 'Giáo án điện tử', '12.4 MB', 'https://example.com/assets/pptx_khtn7_bai2.pptx'),
  ('c1000000-0000-0000-0000-000000000002', 'Phiếu học tập: Cấu hình electron các nguyên tố 1-20', 'pdf', 'Phiếu học tập', '1.8 MB', 'https://example.com/assets/pdf_khtn7_bai2.pdf'),
  ('c1000000-0000-0000-0000-000000000008', 'Slide bài giảng: Định luật Ôm và Thí nghiệm mạch điện', 'pptx', 'Giáo án điện tử', '15.6 MB', 'https://example.com/assets/pptx_khtn8_bai8.pptx')
ON CONFLICT DO NOTHING;

-- 6. SEED QUIZZES
INSERT INTO public.quizzes (id, lesson_id, grade, domain, title, duration_minutes, pass_score)
VALUES
  (
    'd1000000-0000-0000-0000-000000000001',
    'c1000000-0000-0000-0000-000000000002',
    7,
    'hoa-hoc',
    'Trắc nghiệm Củng cố: Cấu tạo Nguyên tử (KHTN Lớp 7)',
    15,
    6
  ),
  (
    'd1000000-0000-0000-0000-000000000002',
    'c1000000-0000-0000-0000-000000000008',
    8,
    'vat-li',
    'Trắc nghiệm Đánh giá: Định luật Ôm và Mạch điện (KHTN Lớp 8)',
    15,
    6
  )
ON CONFLICT DO NOTHING;

-- 7. SEED QUESTIONS, OPTIONS, AND PROTECTED ANSWER KEYS
-- Quiz 1, Question 1
INSERT INTO public.questions (id, quiz_id, question_text, explanation, points, order_index)
VALUES
  (
    'e1000000-0000-0000-0000-000000000001',
    'd1000000-0000-0000-0000-000000000001',
    'Hạt mang điện tích dương nằm trong hạt nhân nguyên tử là loại hạt nào sau đây?',
    'Trong hạt nhân nguyên tử, proton mang điện tích dương (+1), neutron không mang điện, còn electron chuyển động ở vỏ mang điện âm (-1).',
    1,
    1
  )
ON CONFLICT DO NOTHING;

INSERT INTO public.question_options (id, question_id, option_text, order_index)
VALUES
  ('f1000000-0000-0000-0000-000000000001', 'e1000000-0000-0000-0000-000000000001', 'Electron', 1),
  ('f1000000-0000-0000-0000-000000000002', 'e1000000-0000-0000-0000-000000000001', 'Proton', 2),
  ('f1000000-0000-0000-0000-000000000003', 'e1000000-0000-0000-0000-000000000001', 'Neutron', 3),
  ('f1000000-0000-0000-0000-000000000004', 'e1000000-0000-0000-0000-000000000001', 'Photon', 4)
ON CONFLICT DO NOTHING;

-- Answer Key: Question 1 -> Option 2 (Proton)
INSERT INTO public.answer_keys (question_id, correct_option_id)
VALUES ('e1000000-0000-0000-0000-000000000001', 'f1000000-0000-0000-0000-000000000002')
ON CONFLICT (question_id) DO NOTHING;

-- Quiz 1, Question 2
INSERT INTO public.questions (id, quiz_id, question_text, explanation, points, order_index)
VALUES
  (
    'e1000000-0000-0000-0000-000000000002',
    'd1000000-0000-0000-0000-000000000001',
    'Nguyên tử Cacbon (Carbon) có 6 proton. Số lượng electron chuyển động ở lớp vỏ của nguyên tử Cacbon trung hòa về điện là bao nhiêu?',
    'Trong nguyên tử trung hòa về điện, số hạt proton (p) luôn bằng số hạt electron (e), do đó e = 6.',
    1,
    2
  )
ON CONFLICT DO NOTHING;

INSERT INTO public.question_options (id, question_id, option_text, order_index)
VALUES
  ('f1000000-0000-0000-0000-000000000005', 'e1000000-0000-0000-0000-000000000002', '4 electron', 1),
  ('f1000000-0000-0000-0000-000000000006', 'e1000000-0000-0000-0000-000000000002', '6 electron', 2),
  ('f1000000-0000-0000-0000-000000000007', 'e1000000-0000-0000-0000-000000000002', '8 electron', 3),
  ('f1000000-0000-0000-0000-000000000008', 'e1000000-0000-0000-0000-000000000002', '12 electron', 4)
ON CONFLICT DO NOTHING;

-- Answer Key: Question 2 -> Option 2 (6 electron)
INSERT INTO public.answer_keys (question_id, correct_option_id)
VALUES ('e1000000-0000-0000-0000-000000000002', 'f1000000-0000-0000-0000-000000000006')
ON CONFLICT (question_id) DO NOTHING;

-- Quiz 2, Question 1 (Định luật Ôm)
INSERT INTO public.questions (id, quiz_id, question_text, explanation, points, order_index)
VALUES
  (
    'e1000000-0000-0000-0000-000000000003',
    'd1000000-0000-0000-0000-000000000002',
    'Theo Định luật Ôm, khi giữ nguyên hiệu điện thế U ở hai đầu đoạn mạch nhưng tăng điện trở R lên 2 lần thì cường độ dòng điện I sẽ thay đổi thế nào?',
    'Theo định luật Ôm I = U / R, cường độ dòng điện tỉ lệ nghịch với điện trở. Khi R tăng 2 lần thì I giảm đi 2 lần.',
    1,
    1
  )
ON CONFLICT DO NOTHING;

INSERT INTO public.question_options (id, question_id, option_text, order_index)
VALUES
  ('f1000000-0000-0000-0000-000000000009', 'e1000000-0000-0000-0000-000000000003', 'Tăng lên 2 lần', 1),
  ('f1000000-0000-0000-0000-000000000010', 'e1000000-0000-0000-0000-000000000003', 'Giảm đi 2 lần', 2),
  ('f1000000-0000-0000-0000-000000000011', 'e1000000-0000-0000-0000-000000000003', 'Không thay đổi', 3),
  ('f1000000-0000-0000-0000-000000000012', 'e1000000-0000-0000-0000-000000000003', 'Tăng lên 4 lần', 4)
ON CONFLICT DO NOTHING;

-- Answer Key: Question 3 -> Option 2 (Giảm đi 2 lần)
INSERT INTO public.answer_keys (question_id, correct_option_id)
VALUES ('e1000000-0000-0000-0000-000000000003', 'f1000000-0000-0000-0000-000000000010')
ON CONFLICT (question_id) DO NOTHING;
