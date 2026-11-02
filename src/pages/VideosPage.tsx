import React, { useState } from 'react';
import { VIDEOS } from '../data/mockData.ts';
import { VideoLesson, Grade } from '../types/index.ts';
import { Breadcrumbs } from '../components/common/Breadcrumbs.tsx';
import {
  Video,
  Play,
  Clock,
  Eye,
  CheckCircle,
  Sparkles,
  Share2,
  BookOpen,
} from 'lucide-react';

export const VideosPage: React.FC = () => {
  const [selectedGrade, setSelectedGrade] = useState<Grade | 'all'>('all');
  const [activeVideo, setActiveVideo] = useState<VideoLesson>(VIDEOS[0]);
  const [activeTimestamp, setActiveTimestamp] = useState<string>('00:00');

  const filteredVideos = VIDEOS.filter(
    (v) => selectedGrade === 'all' || v.grade === selectedGrade
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-8 text-slate-800 dark:text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Breadcrumbs items={[{ label: 'Video bài giảng & Thí nghiệm thực hành' }]} />

        {/* Title Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wider">
            <Video className="w-4 h-4" />
            <span>Thực nghiệm khoa học</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-[#0B1F3A] dark:text-white mt-1">
            Video Thí Nghiệm & Bài Giảng Trực Quan
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-1 max-w-2xl">
            Tận mắt theo dõi các thí nghiệm thực tế tại phòng bộ môn KHTN cùng Thầy Hoàng:
            từ kỹ thuật chuẩn độ buret, soi tế bào vảy hành đến đo lường định luật Ôm và tán sắc ánh sáng.
          </p>
        </div>

        {/* Grade Filter */}
        <div className="flex items-center gap-2 mb-8 bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm w-fit">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 ml-2">Khối lớp:</span>
          <button
            onClick={() => setSelectedGrade('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              selectedGrade === 'all'
                ? 'bg-red-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            Tất cả video
          </button>
          {[6, 7, 8, 9].map((g) => (
            <button
              key={g}
              onClick={() => setSelectedGrade(g as Grade)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                selectedGrade === g
                  ? 'bg-red-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              Lớp {g}
            </button>
          ))}
        </div>

        {/* Active Player & Playlist Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
          {/* Main Video Viewport (Col 8) */}
          <div className="lg:col-span-8 space-y-5">
            <div className="relative w-full aspect-video rounded-3xl overflow-hidden bg-slate-950 shadow-2xl border border-slate-800">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${activeVideo.youtubeId}?autoplay=0&rel=0`}
                title={activeVideo.title}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>

            {/* Video Details Card */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 text-xs font-bold">
                    Lớp {activeVideo.grade} • {activeVideo.experimentType}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 font-medium">
                    <Clock className="w-3.5 h-3.5" /> {activeVideo.duration}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 font-medium">
                    <Eye className="w-3.5 h-3.5" /> {activeVideo.views.toLocaleString()} lượt xem
                  </span>
                </div>

                <span className="text-xs font-semibold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 px-2.5 py-1 rounded-lg border border-teal-200 dark:border-teal-800">
                  Giảng viên: {activeVideo.instructor}
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-bold text-[#0B1F3A] dark:text-white">
                {activeVideo.title}
              </h2>

              <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm leading-relaxed">
                {activeVideo.description}
              </p>

              {/* Timestamps Chapter Index */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Mốc thời gian các bước thực hành:
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {activeVideo.timestamps.map((stamp, sIdx) => (
                    <button
                      key={sIdx}
                      onClick={() => setActiveTimestamp(stamp.time)}
                      className={`text-left p-2.5 rounded-xl border text-xs flex items-center gap-2.5 transition ${
                        activeTimestamp === stamp.time
                          ? 'bg-red-50 dark:bg-red-950/60 border-red-300 dark:border-red-700 text-red-900 dark:text-red-200 font-bold'
                          : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      <span className="font-mono text-red-600 dark:text-red-400 font-bold bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded border border-red-200 dark:border-red-800 text-[11px]">
                        {stamp.time}
                      </span>
                      <span className="line-clamp-1">{stamp.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Playlist Sidebar (Col 4) */}
          <div className="lg:col-span-4 space-y-3">
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 uppercase tracking-wider px-1">
              Danh sách thí nghiệm ({filteredVideos.length})
            </h3>
            <div className="space-y-2.5">
              {filteredVideos.map((vid) => {
                const isActive = vid.id === activeVideo.id;
                return (
                  <button
                    key={vid.id}
                    onClick={() => {
                      setActiveVideo(vid);
                      setActiveTimestamp(vid.timestamps[0]?.time || '00:00');
                    }}
                    className={`w-full text-left p-3 rounded-2xl border transition-all flex items-center gap-3 group ${
                      isActive
                        ? 'bg-red-50/70 dark:bg-red-950/40 border-red-300 dark:border-red-700 shadow-sm'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm'
                    }`}
                  >
                    <div className="relative w-24 h-16 rounded-xl bg-slate-900 overflow-hidden shrink-0 flex items-center justify-center">
                      <Play className="w-5 h-5 text-white/80 group-hover:scale-110 transition-transform fill-current" />
                      <span className="absolute bottom-1 right-1 text-[9px] font-mono bg-black/80 px-1 rounded text-white">
                        {vid.duration}
                      </span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] font-bold text-red-600 dark:text-red-400 block">
                        Lớp {vid.grade} • {vid.experimentType}
                      </span>
                      <h4 className="font-bold text-xs text-slate-800 dark:text-slate-100 line-clamp-2 mt-0.5 group-hover:text-red-700 dark:group-hover:text-red-400">
                        {vid.title}
                      </h4>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 block">
                        {vid.views.toLocaleString()} lượt xem
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
