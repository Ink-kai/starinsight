import { randomUUID } from 'crypto';
import { mkdir, readFile, rename, writeFile } from 'fs/promises';
import path from 'path';
import type { CreateProfileInput, Profile } from './types';

/**
 * MVP 临时存储方案，后续可迁移至 SQLite / PostgreSQL。
 * 当前实现使用本地 JSON 文件，适合本地开发和 Phase 1 验证；Serverless 生产环境不应依赖本地文件持久化。
 */
export interface ProfileStore {
  create<TChartData>(input: CreateProfileInput<TChartData>): Promise<Profile<TChartData>>;
  get(id: string): Promise<Profile | null>;
  list(): Promise<Profile[]>;
}

const DEFAULT_PROFILE_DATA_PATH = path.join(process.cwd(), 'data', 'profiles.json');

function getProfileDataPath(): string {
  return process.env.PROFILE_STORE_FILE || DEFAULT_PROFILE_DATA_PATH;
}

function assertSafeProfileId(id: string): void {
  if (!/^[a-zA-Z0-9_-]+$/.test(id)) {
    throw new Error('Invalid profile id');
  }
}

async function readProfiles(filePath: string): Promise<Profile[]> {
  try {
    const raw = await readFile(filePath, 'utf8');
    if (!raw.trim()) return [];
    const data = JSON.parse(raw) as unknown;
    return Array.isArray(data) ? data as Profile[] : [];
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

async function writeProfilesAtomic(filePath: string, profiles: Profile[]): Promise<void> {
  await mkdir(path.dirname(filePath), { recursive: true });
  const tempPath = `${filePath}.${process.pid}.${Date.now()}.tmp`;
  await writeFile(tempPath, `${JSON.stringify(profiles, null, 2)}\n`, 'utf8');
  await rename(tempPath, filePath);
}

export class JsonFileProfileStore implements ProfileStore {
  constructor(private readonly filePath: string = getProfileDataPath()) {}

  async create<TChartData>(input: CreateProfileInput<TChartData>): Promise<Profile<TChartData>> {
    const now = new Date().toISOString();
    const profile: Profile<TChartData> = {
      id: randomUUID(),
      nickname: input.nickname,
      birthInfo: input.birthInfo,
      chartData: input.chartData,
      profileSummary: input.profileSummary,
      decisionPattern: input.decisionPattern,
      strengths: input.strengths,
      risks: input.risks,
      quarterlyActions: input.quarterlyActions,
      createdAt: now,
      updatedAt: now,
    };

    const profiles = await readProfiles(this.filePath);
    profiles.unshift(profile as Profile);
    await writeProfilesAtomic(this.filePath, profiles);
    return profile;
  }

  async get(id: string): Promise<Profile | null> {
    assertSafeProfileId(id);
    const profiles = await readProfiles(this.filePath);
    return profiles.find(profile => profile.id === id) ?? null;
  }

  async list(): Promise<Profile[]> {
    return readProfiles(this.filePath);
  }
}

const defaultProfileStore = new JsonFileProfileStore();

export function createProfile<TChartData>(input: CreateProfileInput<TChartData>): Promise<Profile<TChartData>> {
  return defaultProfileStore.create(input);
}

export function getProfile(id: string): Promise<Profile | null> {
  return defaultProfileStore.get(id);
}

export function listProfiles(): Promise<Profile[]> {
  return defaultProfileStore.list();
}

export function getProfileStore(): ProfileStore {
  return defaultProfileStore;
}
