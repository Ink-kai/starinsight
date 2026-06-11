'use client';

import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';

interface FormState {
  nickname: string;
  gender: '' | 'male' | 'female';
  birthDate: string;
  birthTime: string;
  birthPlace: string;
  useTrueSolarTime: boolean;
}

const initialState: FormState = {
  nickname: '',
  gender: '',
  birthDate: '',
  birthTime: '',
  birthPlace: '',
  useTrueSolarTime: false,
};

export default function ProfileForm() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(initialState);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
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

    const selectedDate = new Date(`${form.birthDate}T00:00:00`);
    const today = new Date();
    const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    if (selectedDate > todayDate) {
      setError('出生日期不能晚于当前日期');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nickname: form.nickname.trim() || undefined,
          gender: form.gender,
          birthDate: form.birthDate,
          birthTime: form.birthTime,
          birthPlace: form.birthPlace.trim() || undefined,
          useTrueSolarTime: form.useTrueSolarTime,
        }),
      });

      const data = await response.json() as { profileUrl?: string; error?: string };
      if (!response.ok || !data.profileUrl) {
        throw new Error(data.error || '创建个人档案失败');
      }

      router.push(data.profileUrl);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : '创建个人档案失败');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 shadow-2xl backdrop-blur md:p-8">
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-200" htmlFor="nickname">昵称（可选）</label>
        <input
          id="nickname"
          value={form.nickname}
          onChange={event => setForm(current => ({ ...current, nickname: event.target.value }))}
          placeholder="例如：小星"
          className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-amber-200/60"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-200" htmlFor="gender">性别</label>
        <select
          id="gender"
          value={form.gender}
          onChange={event => setForm(current => ({ ...current, gender: event.target.value as FormState['gender'] }))}
          className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition focus:border-amber-200/60"
          required
        >
          <option value="">请选择</option>
          <option value="male">男</option>
          <option value="female">女</option>
        </select>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-200" htmlFor="birthDate">出生日期</label>
          <input
            id="birthDate"
            type="date"
            value={form.birthDate}
            onChange={event => setForm(current => ({ ...current, birthDate: event.target.value }))}
            className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition focus:border-amber-200/60"
            required
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-200" htmlFor="birthTime">出生时间</label>
          <input
            id="birthTime"
            type="time"
            value={form.birthTime}
            onChange={event => setForm(current => ({ ...current, birthTime: event.target.value }))}
            className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition focus:border-amber-200/60"
            required
          />
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-200" htmlFor="birthPlace">出生地（可选）</label>
        <input
          id="birthPlace"
          value={form.birthPlace}
          onChange={event => setForm(current => ({ ...current, birthPlace: event.target.value }))}
          placeholder="例如：上海"
          className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-amber-200/60"
        />
      </div>

      <label className="flex items-start gap-3 rounded-2xl border border-white/10 bg-slate-950/40 p-4 text-sm leading-6 text-slate-300">
        <input
          type="checkbox"
          checked={form.useTrueSolarTime}
          onChange={event => setForm(current => ({ ...current, useTrueSolarTime: event.target.checked }))}
          className="mt-1 h-4 w-4 rounded border-white/20 bg-slate-950"
        />
        <span>使用真太阳时校正（可选）。如果不确定，保持关闭即可。</span>
      </label>

      {error && <div className="rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">{error}</div>}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-full bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 px-6 py-3 text-sm font-semibold text-slate-950 shadow-[0_0_32px_rgba(251,191,36,0.22)] transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
      >
        {isSubmitting ? '正在生成个人档案...' : '生成个人档案'}
      </button>
    </form>
  );
}
