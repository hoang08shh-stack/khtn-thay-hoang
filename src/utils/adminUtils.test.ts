import test from 'node:test';
import assert from 'node:assert/strict';
import { generateSlug, extractYouTubeId } from '../services/adminService.ts';
import { validateUploadFile, MAX_FILE_SIZE_BYTES } from '../services/storageService.ts';

test('generateSlug converts Vietnamese text to clean URL slugs', () => {
  const input1 = 'Bài 4: Cấu tạo nguyên tử và mô hình Rutherford - Bohr';
  assert.equal(generateSlug(input1), 'bai-4-cau-tao-nguyen-tu-va-mo-hinh-rutherford-bohr');

  const input2 = 'Định luật Ôm và Điện trở dẫn điện (Lớp 9)';
  assert.equal(generateSlug(input2), 'dinh-luat-om-va-dien-tro-dan-dien-lop-9');

  const input3 = '  Quang hợp ở thực vật & Hô hấp tế bào...  ';
  assert.equal(generateSlug(input3), 'quang-hop-o-thuc-vat-ho-hap-te-bao');
});

test('extractYouTubeId parses various YouTube links and IDs correctly', () => {
  assert.equal(
    extractYouTubeId('https://www.youtube.com/watch?v=dQw4w9WgXcQ'),
    'dQw4w9WgXcQ'
  );

  assert.equal(
    extractYouTubeId('https://youtu.be/k3_Bohr1234'),
    'k3_Bohr1234'
  );

  assert.equal(
    extractYouTubeId('https://www.youtube.com/embed/abcdefghijk'),
    'abcdefghijk'
  );

  assert.equal(
    extractYouTubeId('12345678901'),
    '12345678901'
  );

  assert.equal(extractYouTubeId('https://google.com'), null);
  assert.equal(extractYouTubeId(''), null);
});

test('validateUploadFile enforces 50MB Supabase Free limit and MIME types', () => {
  // Mock file within limit
  const validFile = {
    name: 'giao_an_khtn7.pptx',
    type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    size: 20 * 1024 * 1024, // 20 MB
  } as unknown as File;

  const validRes = validateUploadFile(validFile);
  assert.equal(validRes.valid, true);

  // Mock file exceeding 50MB
  const oversizedFile = {
    name: 'video_nang.mp4',
    type: 'video/mp4',
    size: 60 * 1024 * 1024, // 60 MB
  } as unknown as File;

  const oversizedRes = validateUploadFile(oversizedFile);
  assert.equal(oversizedRes.valid, false);
  assert.match(oversizedRes.error || '', /vượt quá giới hạn 50 MB/i);

  // Mock invalid file extension
  const invalidExtFile = {
    name: 'tro_choi.exe',
    type: 'application/x-msdownload',
    size: 5 * 1024 * 1024,
  } as unknown as File;

  const invalidExtRes = validateUploadFile(invalidExtFile);
  assert.equal(invalidExtRes.valid, false);
  assert.match(invalidExtRes.error || '', /không được hỗ trợ/i);
});
