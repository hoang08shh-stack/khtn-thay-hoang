import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbsProps {
  items: { label: string; to?: string }[];
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items }) => {
  return (
    <nav className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 py-3 mb-4 overflow-x-auto whitespace-nowrap">
      <Link
        to="/"
        className="flex items-center gap-1 text-slate-600 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 transition"
      >
        <Home className="w-3.5 h-3.5" />
        <span>Trang chủ</span>
      </Link>
      {items.map((item, idx) => {
        const isLast = idx === items.length - 1;
        return (
          <React.Fragment key={idx}>
            <ChevronRight className="w-3 h-3 text-slate-400 dark:text-slate-600 shrink-0" />
            {isLast || !item.to ? (
              <span className="font-semibold text-slate-800 dark:text-slate-200 line-clamp-1 max-w-[200px] sm:max-w-xs">
                {item.label}
              </span>
            ) : (
              <Link
                to={item.to}
                className="text-slate-600 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 transition line-clamp-1 max-w-[150px]"
              >
                {item.label}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};
