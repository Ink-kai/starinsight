'use client';

import BaseInsightPanel from '@/components/InsightPanel';
import type { Palace, Star, ZiweiChart } from '@/lib/ziwei/types';
import type { TimeView } from '@/components/TimeNav';

export type FocusState =
  | { type: 'star'; label: string; star: Star; palace: Palace }
  | { type: 'palace'; label: string; palace: Palace }
  | { type: 'sihua'; label: string; siHua: string };

interface InsightPanelCompatProps {
  chart: ZiweiChart;
  view?: TimeView;
  liunianYear?: number;
  liuyueMonth?: number;
  focus?: FocusState | null;
  onClearFocus?: () => void;
}

export default function InsightPanel({ chart, focus }: InsightPanelCompatProps) {
  return (
    <BaseInsightPanel
      chart={chart}
      selectedPalace={focus?.type === 'palace' || focus?.type === 'star' ? focus.palace : null}
      selectedSiHua={focus?.type === 'sihua' ? { starName: focus.label.replace(/ 化.+$/, ''), siHua: focus.siHua, view: 'mingpan' } : null}
    />
  );
}
