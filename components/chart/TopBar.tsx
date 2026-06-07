'use client';

import type { ZiweiChart } from '@/lib/ziwei/types';
import TimeNav, { type TimeView } from '@/components/TimeNav';

interface TopBarProps {
  chart: ZiweiChart;
  view: TimeView;
  liunianYear: number;
  liuyueMonth?: number;
  onViewChange: (view: TimeView) => void;
  onYearChange: (year: number) => void;
  onMonthChange?: (month: number) => void;
  onShare?: () => void;
  onExport?: () => void;
  copied?: boolean;
}

export type { TimeView };

export default function TopBar({
  chart,
  view,
  liunianYear,
  onViewChange,
  onYearChange,
  onShare,
  onExport,
  copied,
}: TopBarProps) {
  return (
    <div className="sticky top-0 z-30 px-4 py-3" style={{ background: 'var(--bg-0)', borderBottom: '1px solid var(--bdr)' }}>
      <div className="mx-auto flex max-w-7xl flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <div style={{ fontSize: '11px', color: 'var(--tx-3)', letterSpacing: '0.24em' }}>ZI WEI CHART</div>
          <div style={{ fontSize: '15px', color: 'var(--tx-0)', fontWeight: 600 }}>
            {chart.birthInfo.name ? `${chart.birthInfo.name} · ` : ''}紫微斗数命盘
          </div>
        </div>
        <div className="flex flex-1 flex-col gap-2 md:max-w-xl">
          <TimeNav
            chart={chart}
            view={view}
            liunianYear={liunianYear}
            onViewChange={onViewChange}
            onYearChange={onYearChange}
          />
        </div>
        <div className="flex items-center gap-2">
          {onShare && (
            <button type="button" onClick={onShare} className="btn-ghost" style={{ padding: '8px 14px', fontSize: '12px' }}>
              {copied ? '已复制' : '分享'}
            </button>
          )}
          {onExport && (
            <button type="button" onClick={onExport} className="btn-ghost" style={{ padding: '8px 14px', fontSize: '12px' }}>
              打印
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
