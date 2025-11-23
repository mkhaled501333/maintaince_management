import type { ReactElement, ReactNode } from 'react';

export type InfoIcon =
  | 'calendar'
  | 'user'
  | 'tag'
  | 'cube'
  | 'hash'
  | 'boxes'
  | 'shield'
  | 'clock'
  | 'check'
  | 'map'
  | 'pulse'
  | 'building'
  | 'clipboard'
  | 'cpu'
  | 'bookmark';

export interface InfoRowProps {
  label: string;
  value: ReactNode;
  icon?: InfoIcon;
  highlight?: boolean;
  full?: boolean;
}

export function InfoRow({ label, value, icon, highlight, full }: InfoRowProps): ReactElement {
  return (
    <div className={full ? 'sm:col-span-2' : undefined}>
      <span className="flex items-center gap-1 text-[11px] font-semibold text-gray-500">
        {icon && iconMap[icon]}
        {label}
      </span>
      <span className={`mt-1 block text-sm font-semibold ${highlight ? 'text-blue-700' : 'text-gray-900'}`}>
        {value ?? '—'}
      </span>
    </div>
  );
}

const iconMap: Record<InfoIcon, ReactElement> = {
  calendar: (
    <svg className="h-3.5 w-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10m-9 4h4m6 6H7a2 2 0 01-2-2V7h14v12a2 2 0 01-2 2z" />
    </svg>
  ),
  user: (
    <svg className="h-3.5 w-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A4 4 0 018 16h8a4 4 0 012.879 1.804M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  tag: (
    <svg className="h-3.5 w-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M3 11l4-4 6-6 8 8-6 6-4 4-8-8z" />
    </svg>
  ),
  cube: (
    <svg className="h-3.5 w-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10m-8-4V7l8 4" />
    </svg>
  ),
  hash: (
    <svg className="h-3.5 w-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 9h14M5 15h14M10 3L8 21m8-18l-2 18" />
    </svg>
  ),
  boxes: (
    <svg className="h-3.5 w-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V7a2 2 0 00-2-2H6a2 2 0 00-2 2v6m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293L12 17l-4.707-3.707A1 1 0 006.586 13H4" />
    </svg>
  ),
  shield: (
    <svg className="h-3.5 w-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
  clock: (
    <svg className="h-3.5 w-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  check: (
    <svg className="h-3.5 w-3.5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  map: (
    <svg className="h-3.5 w-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A2 2 0 013 15.382V5.618a2 2 0 011.553-1.937L9 1l6 3 6-3 3 1.667v11.666a2 2 0 01-1.553 1.937L15 21l-6-3-6 3" />
    </svg>
  ),
  pulse: (
    <svg className="h-3.5 w-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  ),
  building: (
    <svg className="h-3.5 w-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 21v-9a1 1 0 01.553-.894l7-3.111a1 1 0 01.894 0l7 3.111A1 1 0 0120 12v9M4 21h16M4 21v-9M20 21v-9M12 12v9" />
    </svg>
  ),
  clipboard: (
    <svg className="h-3.5 w-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H5a2 2 0 00-2 2v12a2 2 0 002 2h14a2 2 0 002-2V7a2 2 0 00-2-2h-4m-4 0V3m0 2a2 2 0 004 0" />
    </svg>
  ),
  cpu: (
    <svg className="h-3.5 w-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 4h6M9 20h6M4 9v6m16-6v6m-9-6h2a1 1 0 011 1v2a1 1 0 01-1 1h-2a1 1 0 01-1-1v-2a1 1 0 011-1z" />
    </svg>
  ),
  bookmark: (
    <svg className="h-3.5 w-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5v14l7-4 7 4V5a2 2 0 00-2-2H7a2 2 0 00-2 2z" />
    </svg>
  ),
};


