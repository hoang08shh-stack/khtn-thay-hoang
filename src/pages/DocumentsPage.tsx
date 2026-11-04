import React, { useState, useEffect } from 'react';
import { DOCUMENTS } from '../data/mockData.ts';
import { Grade, DocumentResource } from '../types/index.ts';
import { getAllDocuments } from '../services/contentService.ts';
import { Breadcrumbs } from '../components/common/Breadcrumbs.tsx';
import {
  FileText,
  Download,
  Search,
  Filter,
  BookOpen,
  CheckCircle2,
  ExternalLink,
  Sparkles,
} from 'lucide-react';

export const DocumentsPage: React.FC = () => {
  const [selectedGrade, setSelectedGrade] = useState<Grade | 'all'>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [downloadedId, setDownloadedId] = useState<string | null>(null);
  const [docsList, setDocsList] = useState<DocumentResource[]>(DOCUMENTS);

  useEffect(() => {
    let mounted = true;
    getAllDocuments().then((data) => {
      if (mounted) {
        setDocsList(data);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  const filteredDocs = docsList.filter((doc) => {
    if (selectedGrade !== 'all' && doc.grade !== selectedGrade) return false;
    if (selectedType !== 'all' && doc.type !== selectedType) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        doc.title.toLowerCase().includes(q) ||
        doc.description.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleDownload = (doc: DocumentResource) => {
    setDownloadedId(doc.id);
    if (doc.fileUrl && doc.fileUrl !== '#') {
      window.open(doc.fileUrl, '_blank', 'noopener,noreferrer');
    }
    setTimeout(() => setDownloadedId(null), 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50/60 via-white to-teal-50/40 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <Breadcrumbs items={[{ label: 'Kho Tài Liệu & Học Liệu Số' }]} />

        {/* Header */}
        <div className="bg-gradient-to-r from-teal-600 via-sky-600 to-indigo-700 rounded-3xl p-6 sm:p-10 text-white shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-extrabold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>KHOA HỌC SỐ KHTN • Bộ sách Kết nối tri thức với cuộc sống</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-white">
              Kho Học Liệu & Tài Liệu KHTN (Lớp 6 – 9)
            </h1>
            <p className="text-sm sm:text-base text-white/90">
              Tổng hợp giáo án điện tử PowerPoint, phiếu bài tập PDF, đề cương ôn tập học kì và sổ tay công thức theo bộ sách <strong>Kết nối tri thức với cuộc sống</strong> với danh pháp Hóa học quốc tế IUPAC.
            </p>
          </div>

          <div className="relative w-full lg:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm tài liệu, phiếu học tập, đề cương..."
              className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white text-slate-900 placeholder-slate-400 text-xs sm:text-sm font-medium shadow-lg focus:outline-none focus:ring-4 focus:ring-amber-300"
            />
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border-2 border-slate-100 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-extrabold text-slate-500 mr-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-teal-600" /> Khối lớp:
            </span>
            {(['all', 6, 7, 8, 9] as const).map((g) => (
              <button
                key={g}
                onClick={() => setSelectedGrade(g)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                  selectedGrade === g
                    ? 'bg-gradient-to-r from-teal-600 to-sky-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-teal-50'
                }`}
              >
                {g === 'all' ? 'Tất cả' : `Lớp ${g}`}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {(
              [
                'all',
                'Giáo án điện tử',
                'Phiếu học tập',
                'Đề cương ôn tập',
                'Sổ tay công thức',
              ] as const
            ).map((t) => (
              <button
                key={t}
                onClick={() => setSelectedType(t)}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                  selectedType === t
                    ? 'bg-slate-900 dark:bg-teal-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                {t === 'all' ? 'Tất cả loại' : t}
              </button>
            ))}
          </div>
        </div>

        {/* Documents List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDocs.map((doc) => (
            <div
              key={doc.id}
              className="bg-white dark:bg-slate-900 rounded-3xl p-6 border-2 border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-lg transition flex flex-col justify-between gap-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-extrabold uppercase px-2.5 py-1 rounded-lg ${
                      doc.format === 'pptx'
                        ? 'bg-orange-100 text-orange-800'
                        : doc.format === 'pdf'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {doc.format} • {doc.fileSize}
                  </span>
                  <span className="text-xs font-extrabold text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-lg">
                    Lớp {doc.grade}
                  </span>
                </div>

                <h3 className="font-extrabold text-base text-slate-900 dark:text-white leading-snug">
                  {doc.title}
                </h3>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {doc.description}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="text-xs text-slate-400">
                  <span>{doc.downloadsCount} lượt tải</span>
                  {doc.pagesCount && <span> • {doc.pagesCount} trang</span>}
                </div>

                <button
                  onClick={() => handleDownload(doc)}
                  className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition cursor-pointer ${
                    downloadedId === doc.id
                      ? 'bg-emerald-600 text-white'
                      : 'bg-teal-600 hover:bg-teal-500 text-white shadow-sm'
                  }`}
                >
                  {downloadedId === doc.id ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Đang tải...</span>
                    </>
                  ) : (
                    <>
                      {doc.fileUrl && doc.fileUrl !== '#' ? (
                        <ExternalLink className="w-3.5 h-3.5" />
                      ) : (
                        <Download className="w-3.5 h-3.5" />
                      )}
                      <span>Tải tài liệu</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
