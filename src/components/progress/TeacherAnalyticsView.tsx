import React, { useState, useEffect } from 'react';
import {
  Users,
  Award,
  AlertTriangle,
  TrendingUp,
  CheckCircle2,
  BookOpen,
  Filter,
  Search,
  Sparkles,
  BarChart3,
  GraduationCap,
} from 'lucide-react';
import { Grade, SubjectDomain } from '../../types/index.ts';
import { getTeacherClassAnalytics } from '../../services/quizService.ts';
import { TeacherClassStats } from '../../utils/quizScoringEngine.ts';

interface TeacherAnalyticsViewProps {
  initialGrade?: Grade | 'all';
}

export const TeacherAnalyticsView: React.FC<TeacherAnalyticsViewProps> = ({
  initialGrade = 'all',
}) => {
  const [selectedGrade, setSelectedGrade] = useState<Grade | 'all'>(initialGrade);
  const [stats, setStats] = useState<TeacherClassStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    let mounted = true;
    async function load() {
      setIsLoading(true);
      try {
        const data = await getTeacherClassAnalytics(selectedGrade);
        if (mounted) setStats(data);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [selectedGrade]);

  const domainNames: Record<SubjectDomain, string> = {
    'hoa-hoc': 'Hóa học',
    'vat-li': 'Vật lí',
    'sinh-hoc': 'Sinh học',
    'trai-dat-vu-tru': 'Trái Đất & Vũ trụ',
  };

  const domainColors: Record<SubjectDomain, string> = {
    'hoa-hoc': 'text-purple-600 bg-purple-50 dark:bg-purple-950/50 border-purple-200 dark:border-purple-800',
    'vat-li': 'text-blue-600 bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800',
    'sinh-hoc': 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800',
    'trai-dat-vu-tru': 'text-amber-600 bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800',
  };

  if (isLoading || !stats) {
    return (
      <div className="py-12 text-center space-y-3">
        <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-slate-500">Đang tổng hợp dữ liệu thống kê học tập của học sinh...</p>
      </div>
    );
  }

  const weakTopics = stats.topicPerformance.filter((t) => t.isWeakTopic);
  const filteredTopics = stats.topicPerformance.filter((t) =>
    t.topicTitle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header and Grade Filter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20 text-xs font-bold">
              Dành Cho Giáo Viên & Quản Trị
            </span>
            <span className="text-xs text-slate-400">Chuẩn GDPT 2018</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
            Bảng Thống Kê Năng Lực Học Tập Cả Lớp
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Theo dõi phổ điểm, tỷ lệ hoàn thành bài học và phát hiện sớm các chủ đề học sinh còn yếu.
          </p>
        </div>

        {/* Grade Filter Pill Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          {(['all', 6, 7, 8, 9] as const).map((g) => (
            <button
              key={g}
              onClick={() => setSelectedGrade(g)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                selectedGrade === g
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {g === 'all' ? 'Tất cả lớp' : `Lớp ${g}`}
            </button>
          ))}
        </div>
      </div>

      {/* 4 Overview Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>Học sinh tham gia</span>
            <Users className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-mono">
            {stats.totalStudents}
          </div>
          <div className="text-[11px] text-blue-600 dark:text-blue-400 font-medium">Hồ sơ học tập kích hoạt</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>Tổng lượt làm bài</span>
            <BookOpen className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-mono">
            {stats.totalAttempts}
          </div>
          <div className="text-[11px] text-purple-600 dark:text-purple-400 font-medium">Lượt kiểm tra đã nộp</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>Điểm trung bình lớp</span>
            <TrendingUp className="w-4 h-4 text-teal-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-teal-600 dark:text-teal-400 font-mono">
            {stats.averageScore.toFixed(1)}
          </div>
          <div className="text-[11px] text-teal-600 dark:text-teal-400 font-medium">Thang điểm 10.0</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>Tỉ lệ đạt chuẩn (≥6.0)</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
            {stats.passRatePercentage}%
          </div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">Chuẩn năng lực KHTN</div>
        </div>
      </div>

      {/* Weak Topics Warning Alert (if any) */}
      {weakTopics.length > 0 && (
        <div className="p-5 sm:p-6 rounded-3xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 space-y-3 shadow-sm">
          <div className="flex items-center gap-2.5 text-amber-800 dark:text-amber-200 font-bold text-sm">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
            <span>Phát hiện {weakTopics.length} chuyên đề cần phụ đạo củng cố (Điểm TB &lt; 6.5):</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {weakTopics.map((topic, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900 flex items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">{topic.topicTitle}</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    Phân môn: {domainNames[topic.domain]} • Số lượt làm: {topic.attemptsCount}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-sm font-black text-amber-600 dark:text-amber-400 font-mono">
                    {topic.averageScore.toFixed(1)} / 10
                  </div>
                  <span className="text-[10px] text-amber-600 font-bold">Cần ôn lại</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Score Distribution Breakdown Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-teal-500" />
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              Phổ Điểm Toàn Lớp
            </h3>
          </div>
          <span className="text-xs text-slate-400">{stats.totalAttempts} lượt thi</span>
        </div>

        {/* Visual Stacked Bar */}
        <div className="h-6 w-full rounded-xl overflow-hidden flex shadow-inner bg-slate-100 dark:bg-slate-800">
          <div
            style={{
              width: `${(stats.scoreDistribution.excellent / (stats.totalAttempts || 1)) * 100}%`,
            }}
            className="bg-emerald-500 transition-all duration-500 hover:opacity-90"
            title={`Xuất sắc (8.5-10): ${stats.scoreDistribution.excellent}`}
          />
          <div
            style={{
              width: `${(stats.scoreDistribution.good / (stats.totalAttempts || 1)) * 100}%`,
            }}
            className="bg-teal-500 transition-all duration-500 hover:opacity-90"
            title={`Giỏi/Khá (7.0-8.4): ${stats.scoreDistribution.good}`}
          />
          <div
            style={{
              width: `${(stats.scoreDistribution.average / (stats.totalAttempts || 1)) * 100}%`,
            }}
            className="bg-blue-400 transition-all duration-500 hover:opacity-90"
            title={`Trung bình (5.0-6.9): ${stats.scoreDistribution.average}`}
          />
          <div
            style={{
              width: `${(stats.scoreDistribution.poor / (stats.totalAttempts || 1)) * 100}%`,
            }}
            className="bg-rose-500 transition-all duration-500 hover:opacity-90"
            title={`Cần cố gắng (<5.0): ${stats.scoreDistribution.poor}`}
          />
        </div>

        {/* Legend */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500 flex-shrink-0" />
            <span className="text-slate-600 dark:text-slate-400">
              Xuất sắc (8.5–10):{' '}
              <strong className="text-slate-900 dark:text-white font-mono">
                {stats.scoreDistribution.excellent}
              </strong>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-teal-500 flex-shrink-0" />
            <span className="text-slate-600 dark:text-slate-400">
              Giỏi/Khá (7.0–8.4):{' '}
              <strong className="text-slate-900 dark:text-white font-mono">
                {stats.scoreDistribution.good}
              </strong>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-400 flex-shrink-0" />
            <span className="text-slate-600 dark:text-slate-400">
              Trung bình (5.0–6.9):{' '}
              <strong className="text-slate-900 dark:text-white font-mono">
                {stats.scoreDistribution.average}
              </strong>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-rose-500 flex-shrink-0" />
            <span className="text-slate-600 dark:text-slate-400">
              Cần cố gắng (&lt;5.0):{' '}
              <strong className="text-slate-900 dark:text-white font-mono">
                {stats.scoreDistribution.poor}
              </strong>
            </span>
          </div>
        </div>
      </div>

      {/* Topic Performance Detailed Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
            Hiệu Suất Theo Từng Chuyên Đề Bài Học
          </h3>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo tên bài học..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Chuyên đề bài học</th>
                <th className="py-3 px-4">Phân môn</th>
                <th className="py-3 px-4 text-center">Số lượt làm</th>
                <th className="py-3 px-4 text-center">Điểm TB</th>
                <th className="py-3 px-4 text-right">Đánh giá sư phạm</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredTopics.map((topic, idx) => (
                <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                  <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                    {topic.topicTitle}
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border ${
                        domainColors[topic.domain]
                      }`}
                    >
                      {domainNames[topic.domain]}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono text-slate-700 dark:text-slate-300">
                    {topic.attemptsCount}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span
                      className={`font-mono font-bold text-sm ${
                        topic.averageScore >= 8.0
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : topic.averageScore >= 6.5
                          ? 'text-teal-600 dark:text-teal-400'
                          : 'text-amber-600 dark:text-amber-400'
                      }`}
                    >
                      {topic.averageScore.toFixed(1)}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    {topic.isWeakTopic ? (
                      <span className="px-2.5 py-1 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-bold text-[11px]">
                        Cần ôn tập thêm
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold text-[11px]">
                        Nắm vững chuẩn
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
