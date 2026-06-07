'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { BirthInfo } from '@/lib/report/types';

const today = new Date().toISOString().slice(0, 10);

export default function NewChartForm() {
  const router = useRouter();
  const [form, setForm] = useState<BirthInfo>({
    nickname: '',
    gender: 'male',
    birthDate: '',
    birthTime: '',
    birthPlace: '',
    useTrueSolarTime: false,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    if (!form.gender) {
      setError('请选择性别');
      return;
    }
    if (!form.birthDate) {
      setError('请选择出生日期');
      return;
    }
    if (!form.birthTime) {
      setError('请选择出生时间');
      return;
    }
    if (form.birthDate > today) {
      setError('出生日期不能晚于当前日期');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          nickname: form.nickname?.trim() || undefined,
          birthPlace: form.birthPlace?.trim() || undefined,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || '创建报告失败');
      }
      router.push(`/report/${data.reportId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建报告失败');
    } finally {
      setLoading(false);
    }
  }

  const inputClass = 'mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-amber-200/50';
  const labelClass = 'text-sm font-medium text-slate-200';

  return (
    <form onSubmit={handleSubmit} className="mx-auto mt-10 max-w-2xl rounded-[2rem] border border-white/10 bg-white/[0.05] p-5 text-left shadow-2xl sm:p-8">
      <div className="grid gap-5 sm:grid-cols-2">
        <label className={labelClass}>
          昵称（可选）
          <input
            className={inputClass}
            type="text"
            placeholder="例如：小明"
            value={form.nickname ?? ''}
            onChange={event => setForm(prev => ({ ...prev, nickname: event.target.value }))}
          />
        </label>

        <label className={labelClass}>
          性别
          <select
            className={inputClass}
            value={form.gender}
            onChange={event => setForm(prev => ({ ...prev, gender: event.target.value as BirthInfo['gender'] }))}
            required
          >
            <option value="male">男</option>
            <option value="female">女</option>
          </select>
        </label>

        <label className={labelClass}>
          出生日期
          <input
            className={inputClass}
            type="date"
            max={today}
            value={form.birthDate}
            onChange={event => setForm(prev => ({ ...prev, birthDate: event.target.value }))}
            required
          />
        </label>

        <label className={labelClass}>
          出生时间
          <input
            className={inputClass}
            type="time"
            value={form.birthTime}
            onChange={event => setForm(prev => ({ ...prev, birthTime: event.target.value }))}
            required
          />
        </label>

        <label className={`${labelClass} sm:col-span-2`}>
          出生地（可选）
          <input
            className={inputClass}
            type="text"
            placeholder="例如：北京、上海、广州市"
            value={form.birthPlace ?? ''}
            onChange={event => setForm(prev => ({ ...prev, birthPlace: event.target.value }))}
          />
        </label>
      </div>

      <label className="mt-5 flex items-start gap-3 rounded-2xl border border-white/10 bg-slate-950/40 p-4 text-sm leading-6 text-slate-300">
        <input
          type="checkbox"
          className="mt-1"
          checked={form.useTrueSolarTime}
          onChange={event => setForm(prev => ({ ...prev, useTrueSolarTime: event.target.checked }))}
        />
        <span>
          使用真太阳时校正（可选）。若出生地无法匹配城市经度，将按北京时间生成命盘。
        </span>
      </label>

      {error && (
        <div className="mt-5 rounded-2xl border border-red-300/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="mt-7 inline-flex w-full items-center justify-center rounded-full bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 px-7 py-3 text-sm font-semibold text-slate-950 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? '正在生成命盘报告…' : '生成命盘报告'}
      </button>
    </form>
  );
}
