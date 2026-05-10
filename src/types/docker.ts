export interface StorageBreakdown {
  images: ImageInfo[];
  containers: ContainerInfo[];
  volumes: VolumeInfo[];
  buildCache: BuildCacheInfo[];
  totalBytes: number;
}

export interface ImageInfo {
  id: string;
  tags: string[];
  size: number;
  created: number;
  inUse: boolean;
  containers: string[];
}

export interface ContainerInfo {
  id: string;
  name: string;
  image: string;
  status: string;
  state: string;
  sizeRw: number;
  sizeRootFs: number;
  created: number;
}

export interface VolumeInfo {
  name: string;
  driver: string;
  mountpoint: string;
  size: number | null;
  inUse: boolean;
}

export interface BuildCacheInfo {
  id: string;
  type: string;
  size: number;
  inUse: boolean;
  lastUsed: string;
}

export interface CleanupTarget {
  type: "image" | "container" | "volume" | "build-cache" | "all";
  ids?: string[];
}

export interface CleanupPreview {
  items: CleanupItem[];
  totalBytes: number;
  riskLevel: "safe" | "verify" | "dangerous";
  warnings: string[];
}

export interface CleanupItem {
  id: string;
  name: string;
  type: string;
  bytes: number;
  riskLevel: "safe" | "verify" | "dangerous";
  warning?: string;
}
