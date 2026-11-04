# HƯỚNG DẪN TÍCH HỢP SUPABASE (FREE TIER) CHO KHTN THẦY HOÀNG

Dự án đã được thiết kế sẵn sàng 100% với `@supabase/supabase-js`, Supabase Auth, PostgreSQL RLS và Supabase Storage.

## 1. Tạo dự án Supabase Free
1. Truy cập [https://supabase.com](https://supabase.com) và đăng nhập (hoặc đăng ký miễn phí).
2. Nhấn **"New Project"**, nhập:
   - **Name**: `khtn-thay-hoang`
   - **Database Password**: Đặt mật khẩu an toàn
   - **Region**: `Southeast Asia (Singapore)` để tối ưu độ trễ cho học sinh Việt Nam.
   - **Pricing Plan**: Free tier ($0).

## 2. Chạy SQL Migrations
Mở Supabase Dashboard -> chọn dự án của bạn -> vào mục **SQL Editor** (icon `>_` bên thanh menu trái):

1. **Bước 1**: Mở file `supabase/migrations/20261029000000_schema_and_rls.sql`, sao chép toàn bộ nội dung và dán vào SQL Editor -> Nhấn **Run**.
   - Tạo 14 bảng dữ liệu, các hàm bảo mật `SECURITY DEFINER`, trigger `handle_new_user` và toàn bộ chính sách RLS.
2. **Bước 2**: Mở file `supabase/migrations/20261029000001_seed_data.sql`, dán vào SQL Editor -> Nhấn **Run**.
   - Nạp dữ liệu mẫu chuẩn GDPT 2018 (chuyên đề, bài học, mô phỏng 3D, câu hỏi trắc nghiệm và đáp án bảo mật).
3. **Bước 3**: Mở file `supabase/migrations/20261029000002_storage_setup.sql`, dán vào SQL Editor -> Nhấn **Run**.
   - Khởi tạo 3 bucket: `science-assets`, `lesson-documents`, `avatars` và các chính sách phân quyền lưu trữ.

## 3. Cấu hình biến môi trường Frontend
Trong Supabase Dashboard:
1. Vào **Project Settings** -> **API**.
2. Sao chép:
   - **Project URL** (ví dụ: `https://xyzcompany.supabase.co`)
   - **anon public key** (ví dụ: `eyJhbGciOi...`)
   - **LƯU Ý QUAN TRỌNG**: KHÔNG BAO GIỜ đưa `service_role key` lên frontend!
3. Trong thư mục dự án, tạo file `.env` (hoặc cấu hình Environment Variables trên Cloudflare Pages / Vercel):
   ```env
   VITE_SUPABASE_URL="https://your-project-id.supabase.co"
   VITE_SUPABASE_ANON_KEY="eyJhbGciOi..."
   ```

## 4. Kiến trúc bảo mật nổi bật
- **Phân tách quyền (`user_roles` vs `profiles`)**: Học sinh có thể sửa tên, avatar, trường học trong `profiles`, nhưng KHÔNG THỂ tự sửa `role` trong `user_roles`.
- **Mặc định tài khoản mới**: Khi đăng ký qua `supabase.auth.signUp()`, trigger `handle_new_user` luôn gán role `student`.
- **Nâng quyền Giáo viên/Admin**: Chỉ admin thực thi lệnh SQL trực tiếp trên Supabase:
  ```sql
  UPDATE public.user_roles
  SET role = 'admin'
  WHERE user_id = 'UUID-CỦA-THẦY-HOÀNG';
  ```
- **Bảo vệ đáp án (`answer_keys`)**: Học sinh không thể SELECT bảng `answer_keys`. Việc chấm điểm được thực thi qua hàm RPC `submit_quiz_attempt()`, trả về kết quả chính xác mà không để lộ đáp án trước khi nộp.
- **Tiến độ học tập (`lesson_progress`)**: RLS chỉ cho phép học sinh xem và cập nhật tiến độ của chính mình (`auth.uid() = user_id`).
