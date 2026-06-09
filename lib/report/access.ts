import { randomBytes, timingSafeEqual } from 'crypto';
import type { ZiweiReport } from './types';

export type ReportAccessResult =
  | { ok: true }
  | { ok: false; status: 401 | 403; message: string; legacyMissingToken?: boolean };

export function generateReportAccessToken(): string {
  return randomBytes(32).toString('base64url');
}

export function getReportTokenFromUrl(url: string): string | null {
  const token = new URL(url).searchParams.get('token');
  return token && token.trim() ? token.trim() : null;
}

export function verifyReportAccess(report: Pick<ZiweiReport, 'accessToken'>, token: string | null | undefined): ReportAccessResult {
  if (!report.accessToken) {
    return {
      ok: false,
      status: 403,
      legacyMissingToken: true,
      message: '这份旧报告缺少访问 token，请重新生成报告。',
    };
  }

  if (!token) {
    return { ok: false, status: 401, message: '缺少报告访问 token。' };
  }

  const expected = Buffer.from(report.accessToken);
  const actual = Buffer.from(token);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
    return { ok: false, status: 403, message: '报告访问 token 无效。' };
  }

  return { ok: true };
}

export function buildReportUrl(id: string, accessToken: string): string {
  return `/report/${encodeURIComponent(id)}?token=${encodeURIComponent(accessToken)}`;
}

export function buildCheckoutUrl(id: string, accessToken: string): string {
  return `/checkout/${encodeURIComponent(id)}?token=${encodeURIComponent(accessToken)}`;
}

export function buildExportUrl(id: string, accessToken: string): string {
  return `/api/reports/${encodeURIComponent(id)}/export?token=${encodeURIComponent(accessToken)}`;
}