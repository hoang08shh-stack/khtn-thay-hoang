import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Atom, BookOpen, Video, ArrowRight } from 'lucide-react';
import { SIMULATIONS_3D } from '../../data/mockData.ts';
import { getPublishedLessonsSync } from '../../services/contentService.ts';
import { getAdminVideosSync } from '../../services/adminService.ts';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        // toggle
        if (isOpen) onClose();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const q = query.trim().toLowerCase();
  const liveLessons = getPublishedLessonsSync();
  const liveVideos = getAdminVideosSync();

  const filteredSims = q
    ? SIMULATIONS_3D.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q) ||
          s.keyConcepts.some((c) => c.toLowerCase().includes(q))
      )
    : SIMULATIONS_3D.slice(0, 3);

  const filteredLessons = q
    ? liveLessons.filter(
        (l) =>
          l.title.toLowerCase().includes(q) ||
          l.summary.toLowerCase().includes(q) ||
          l.code.toLowerCase().includes(q)
      )
    : liveLessons.slice(0, 3);

  const filteredVideos = q
    ? liveVideos.filter((v) => v.title.toLowerCase().includes(q) || v.description.toLowerCase().includes(q))
    : [];

  const handleSelect = (url: string) => {
    navigate(url);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-slate-950/80 backdrop-blur-md">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden text-white animate-in fade-in zoom-in-95 duration-200">
        {/* Search Input Bar */}
        <div className="relative flex items-center border-b border-slate-800 px-4 py-3.5">
          <Search className="w-5 h-5 text-teal-400 mr-3 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm kiếm bài học, mô phỏng 3D, video, thí nghiệm..."
            autoFocus
            className="w-full bg-transparent text-sm sm:text-base text-white placeholder-slate-400 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-md text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="ml-3 px-2 py-1 text-xs font-semibold rounded bg-slate-800 text-slate-400 hover:text-white"
          >
            ESC
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-4">
          {/* Simulations Section */}
          {filteredSims.length > 0 && (
            <div>
              <div className="text-[11px] font-bold text-teal-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Atom className="w-3.5 h-3.5" />
                <span>Mô phỏng 3D tương tác ({filteredSims.length})</span>
              </div>
              <div className="space-y-1.5">
                {filteredSims.map((sim) => (
                  <button
                    key={sim.id}
                    onClick={() => handleSelect(`/mo-phong/${sim.id}`)}
                    className="w-full text-left p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-teal-500/50 transition flex items-center justify-between group"
                  >
                    <div>
                      <div className="font-semibold text-xs sm:text-sm text-white group-hover:text-teal-300">
                        {sim.title}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Lớp {sim.grade} • {sim.category}
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-teal-400 transition transform group-hover:translate-x-1" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Lessons Section */}
          {filteredLessons.length > 0 && (
            <div>
              <div className="text-[11px] font-bold text-sky-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5" />
                <span>Bài học KHTN ({filteredLessons.length})</span>
              </div>
              <div className="space-y-1.5">
                {filteredLessons.map((lesson) => (
                  <button
                    key={lesson.id}
                    onClick={() => handleSelect(`/bai-hoc/${lesson.id}`)}
                    className="w-full text-left p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-sky-500/50 transition flex items-center justify-between group"
                  >
                    <div>
                      <div className="font-semibold text-xs sm:text-sm text-white group-hover:text-sky-300">
                        {lesson.code}: {lesson.title}
                      </div>
                      <div className="text-[11px] text-slate-400 line-clamp-1">
                        {lesson.summary}
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-sky-400 transition transform group-hover:translate-x-1" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Videos Section */}
          {filteredVideos.length > 0 && (
            <div>
              <div className="text-[11px] font-bold text-red-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Video className="w-3.5 h-3.5" />
                <span>Video Thí nghiệm ({filteredVideos.length})</span>
              </div>
              <div className="space-y-1.5">
                {filteredVideos.map((vid) => (
                  <button
                    key={vid.id}
                    onClick={() => handleSelect(`/video`)}
                    className="w-full text-left p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-red-500/50 transition flex items-center justify-between group"
                  >
                    <div className="font-semibold text-xs sm:text-sm text-white group-hover:text-red-300">
                      {vid.title}
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-red-400" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {filteredSims.length === 0 && filteredLessons.length === 0 && filteredVideos.length === 0 && (
            <div className="text-center py-8 text-slate-400 text-xs">
              Không tìm thấy kết quả phù hợp cho &quot;{query}&quot;. Thử tìm &quot;nguyên tử&quot;, &quot;mạch điện&quot;, &quot;tế bào&quot;...
            </div>
          )}
        </div>

        {/* Modal footer shortcut note */}
        <div className="bg-slate-950 px-4 py-2 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
          <span>Tìm nhanh theo tên nguyên tố, bài học, công thức</span>
          <span>Nhấn ESC để đóng</span>
        </div>
      </div>
    </div>
  );
};
