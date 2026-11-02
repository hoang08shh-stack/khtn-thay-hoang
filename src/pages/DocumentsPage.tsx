import React, { useState } from 'react';
import { DOCUMENTS } from '../data/mockData.ts';
import { DocumentItem, Grade } from '../types/index.ts';
import { Breadcrumbs } from '../components/common/Breadcrumbs.tsx';
import {
  FileText,
  Download,
  Eye,
  Search,
  Filter,
  CheckCircle,
  FileCheck,
  Sparkles,
  X,
} from 'lucide-react';

export const DocumentsPage: React.FC = () => {
  const [selectedGrade, setSelectedGrade] = useState<Grade | 'all'>('all');
  const [selectedFormat, setSelectedFormat] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [activePreviewDoc, setActivePreviewDoc] = useState<DocumentItem | null>(null);
  const [downloadSuccessId, setDownloadSuccessId] = useState<string | null>(null);

  const filteredDocs = DOCUMENTS.filter((doc) => {
    if (selectedGrade !== 'all' && doc.grade !== selectedGrade) return false;
    if (selectedFormat !== 'all' && doc.format !== selectedFormat) return false;
    if (selectedType !== 'all' && doc.type !== selectedType) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        doc.title.toLowerCase().includes(q) ||
        doc.description.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleDownload = (doc: DocumentItem) => {
    setDownloadSuccessId(doc.id);
    setTimeout(() => setDownloadSuccessId(null), 3000);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-8 text-slate-800 dark:text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Breadcrumbs items={[{ label: 'Thư viện tài liệu PPT/PDF' }]} />

        {/* Title Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-xs font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider">
            <FileText className="w-4 h-4" />
            <span>Học liệu số GDPT 2018</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-[#0B1F3A] dark:text-white mt-1">
            Thư Viện Tài Liệu PPT & PDF KHTN
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-1 max-w-2xl">
            Kho tài nguyên giáo án điện tử PowerPoint, phiếu giao nhiệm vụ học tập, sơ đồ tư duy Mindmap
            và bộ đề kiểm tra đánh giá định kỳ do Thầy Hoàng biên tập.
          </p>
        </div>

        {/* Filters Toolbar */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm mb-8 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            {/* Search Input */}
            <div className="md:col-span-5">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Tìm slide bài giảng, phiếu bài tập..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            {/* Grade Filter */}
            <div className="md:col-span-7 flex flex-wrap items-center gap-1.5 justify-start md:justify-end">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 mr-1">Khối lớp:</span>
              <button
                onClick={() => setSelectedGrade('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  selectedGrade === 'all'
                    ? 'bg-teal-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                Tất cả
              </button>
              {[6, 7, 8, 9].map((g) => (
                <button
                  key={g}
                  onClick={() => setSelectedGrade(g as Grade)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    selectedGrade === g
                      ? 'bg-teal-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  Lớp {g}
                </button>
              ))}
            </div>
          </div>

          {/* Format & Type Filters */}
          <div className="flex flex-wrap items-center gap-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-500 dark:text-slate-400 font-semibold">Định dạng:</span>
              {['all', 'pptx', 'pdf', 'docx'].map((fmt) => (
                <button
                  key={fmt}
                  onClick={() => setSelectedFormat(fmt)}
                  className={`px-2.5 py-1 rounded-lg uppercase font-bold transition ${
                    selectedFormat === fmt
                      ? 'bg-slate-800 dark:bg-teal-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {fmt === 'all' ? 'Tất cả' : fmt}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-500 dark:text-slate-400 font-semibold">Thể loại:</span>
              {['all', 'Giáo án điện tử', 'Phiếu học tập', 'Sơ đồ tư duy', 'Đề kiểm tra 15p/1T'].map(
                (type) => (
                  <button
                    key={type}
                    onClick={() => setSelectedType(type)}
                    className={`px-2.5 py-1 rounded-lg font-medium transition ${
                      selectedType === type
                        ? 'bg-teal-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {type === 'all' ? 'Tất cả loại' : type}
                  </button>
                )
              )}
            </div>
          </div>
        </div>

        {/* Documents Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDocs.map((doc) => {
            const formatBadgeColor =
              doc.format === 'pptx'
                ? 'bg-orange-100 text-orange-800 border-orange-200'
                : doc.format === 'pdf'
                ? 'bg-red-100 text-red-800 border-red-200'
                : 'bg-blue-100 text-blue-800 border-blue-200';

            return (
              <div
                key={doc.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm hover:shadow-lg dark:hover:border-slate-700 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md border ${formatBadgeColor}`}>
                      {doc.format} • {doc.type}
                    </span>
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                      Lớp {doc.grade}
                    </span>
                  </div>

                  <h3 className="font-bold text-sm sm:text-base text-slate-800 dark:text-slate-100 line-clamp-2 leading-snug">
                    {doc.title}
                  </h3>

                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                    {doc.description}
                  </p>

                  <div className="mt-4 flex items-center gap-3 text-[11px] text-slate-400 dark:text-slate-500">
                    <span>{doc.pageCount} trang / slide</span>
                    <span>•</span>
                    <span>Dung lượng: {doc.fileSize}</span>
                    <span>•</span>
                    <span>{doc.downloadCount} lượt tải</span>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                  {doc.previewSlides && doc.previewSlides.length > 0 && (
                    <button
                      onClick={() => setActivePreviewDoc(doc)}
                      className="flex-1 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition flex items-center justify-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Xem trước slide</span>
                    </button>
                  )}

                  <button
                    onClick={() => handleDownload(doc)}
                    className="flex-1 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md shadow-teal-600/20"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>
                      {downloadSuccessId === doc.id ? 'Đang tải...' : 'Tải tài liệu'}
                    </span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Slide Preview Modal */}
        {activePreviewDoc && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-2xl relative animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 mb-4">
                <div>
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-300">
                    Xem trước cấu trúc Slide
                  </span>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white mt-1">
                    {activePreviewDoc.title}
                  </h3>
                </div>
                <button
                  onClick={() => setActivePreviewDoc(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 my-4">
                <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Mục lục các slide trình chiếu:
                </h4>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {activePreviewDoc.previewSlides?.map((slide, sIdx) => (
                    <div
                      key={sIdx}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 flex items-center gap-3"
                    >
                      <span className="w-6 h-6 rounded-lg bg-teal-600 text-white font-bold flex items-center justify-center text-[11px] shrink-0">
                        {sIdx + 1}
                      </span>
                      <span className="font-medium">{slide}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
                <button
                  onClick={() => setActivePreviewDoc(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  Đóng
                </button>
                <button
                  onClick={() => {
                    handleDownload(activePreviewDoc);
                    setActivePreviewDoc(null);
                  }}
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-md transition flex items-center gap-1.5"
                >
                  <Download className="w-4 h-4" />
                  <span>Tải toàn bộ bộ slide (.pptx)</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
