import React, { useState, useEffect } from 'react';
import { Grade, VideoResource } from '../types/index.ts';
import { getAllVideos } from '../services/contentService.ts';
import { getAdminVideosSync } from '../services/adminService.ts';
import { Breadcrumbs } from '../components/common/Breadcrumbs.tsx';
import { Play, Clock, Eye, Sparkles, X, Atom } from 'lucide-react';
import { Link } from 'react-router-dom';

export const VideosPage: React.FC = () => {
  const [selectedGrade, setSelectedGrade] = useState<Grade | 'all'>('all');
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
  const [videosList, setVideosList] = useState<VideoResource[]>(() => getAdminVideosSync());

  useEffect(() => {
    let mounted = true;
    const loadVideos = () => {
      setVideosList(getAdminVideosSync());
      getAllVideos().then((data) => {
        if (mounted) {
          setVideosList(data);
        }
      });
    };
    loadVideos();
    window.addEventListener('khtn-cms-updated', loadVideos);
    return () => {
      mounted = false;
      window.removeEventListener('khtn-cms-updated', loadVideos);
    };
  }, []);

  const filteredVideos = videosList.filter((v) => {
    if (selectedGrade !== 'all' && v.grade !== selectedGrade) return false;
    return true;
  });

  const activeVideo = videosList.find((v) => v.id === activeVideoId);

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50/60 via-white to-teal-50/40 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <Breadcrumbs items={[{ label: 'Thư viện Video Bài Giảng & Thí Nghiệm' }]} />

        {/* Header (No YouTube channel button!) */}
        <div className="bg-gradient-to-r from-sky-600 via-teal-600 to-indigo-700 rounded-3xl p-6 sm:p-10 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-extrabold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>KHOA HỌC SỐ KHTN • Bộ sách Kết nối tri thức với cuộc sống</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-white">
              Video Thí Nghiệm & Bài Giảng Trực Quan
            </h1>
            <p className="text-sm sm:text-base text-white/90">
              Hệ thống video bài giảng và thí nghiệm thực hành thuộc 3 phân môn <strong>Vật lí · Hóa học · Sinh học</strong> từ lớp 6 đến lớp 9 theo danh pháp quốc tế IUPAC.
            </p>
          </div>

          <Link
            to="/phong-thi-nghiem-3d"
            className="px-5 py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs sm:text-sm shadow-lg transition flex items-center gap-2 self-start md:self-auto"
          >
            <Atom className="w-5 h-5" />
            <span>Mở KHOA HỌC SỐ KHTN 3D</span>
          </Link>
        </div>

        {/* Active Video Player Modal / Banner */}
        {activeVideo && (
          <div className="bg-slate-900 rounded-3xl p-4 sm:p-6 text-white space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-teal-400 font-bold">
                  Đang phát • Lớp {activeVideo.grade} • KHOA HỌC SỐ KHTN
                </span>
                <h2 className="text-lg font-extrabold">{activeVideo.title}</h2>
              </div>
              <button
                onClick={() => setActiveVideoId(null)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black">
              <iframe
                className="w-full h-full"
                src={`https://www.youtube.com/embed/${activeVideo.youtubeId}?autoplay=1`}
                title={activeVideo.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        )}

        {/* Grade Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {(['all', 6, 7, 8, 9] as const).map((g) => (
            <button
              key={g}
              onClick={() => setSelectedGrade(g)}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                selectedGrade === g
                  ? 'bg-gradient-to-r from-teal-600 to-sky-600 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-teal-50'
              }`}
            >
              {g === 'all' ? 'Tất cả khối lớp (6–9)' : `Video KHTN Lớp ${g}`}
            </button>
          ))}
        </div>

        {/* Videos Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVideos.map((vid) => (
            <div
              key={vid.id}
              onClick={() => setActiveVideoId(vid.id)}
              className="group cursor-pointer bg-white dark:bg-slate-900 rounded-3xl overflow-hidden border-2 border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl transition flex flex-col justify-between"
            >
              <div>
                <div className="relative h-48 overflow-hidden bg-slate-900">
                  <img
                    src={vid.thumbnail}
                    alt={vid.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                  />
                  <div className="absolute inset-0 bg-slate-950/35 flex items-center justify-center group-hover:bg-slate-950/20 transition">
                    <div className="w-12 h-12 rounded-full bg-teal-500 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition">
                      <Play className="w-5 h-5 fill-current ml-0.5" />
                    </div>
                  </div>
                  <span className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-slate-900/80 text-teal-300 text-xs font-bold">
                    Lớp {vid.grade}
                  </span>
                  <span className="absolute bottom-3 right-3 px-2 py-0.5 rounded bg-slate-950/80 text-white text-xs font-mono">
                    {vid.duration}
                  </span>
                </div>

                <div className="p-5 space-y-2">
                  <h3 className="font-extrabold text-slate-900 dark:text-white group-hover:text-teal-600 transition text-base">
                    {vid.title}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {vid.summary}
                  </p>
                </div>
              </div>

              <div className="px-5 pb-5 pt-2 flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1 font-medium text-teal-600">
                  <Clock className="w-3.5 h-3.5" /> {vid.instructor}
                </span>
                <span className="flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5" /> {vid.views} lượt xem
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
