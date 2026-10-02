export interface Oshi {
  id: string;
  name: string;
  ruby?: string;
  group?: string;
  category?: string; // e.g. "アイドル", "アニメ", "VTuber", etc.
  color: string; // Hex color code (e.g. #ec4899)
  image?: string; // Base64 data URL
  debutDate?: string; // YYYY-MM-DD when fan started supporting
  memo?: string;
  order?: number;
  createdAt: string;
  updatedAt: string;
}

export const OSHI_CATEGORIES = [
  'アイドル',
  'アニメ・マンガ',
  'VTuber',
  '声優',
  'アーティスト',
  '俳優・舞台',
  'ゲーム・キャラ',
  'YouTuber・配信者',
  'スポーツ',
] as const;

export type EventCategory = 'live' | 'event' | 'broadcast' | 'release' | 'ticket' | 'other';

export type TicketStatus = 'none' | 'applied' | 'won' | 'lost' | 'purchased';

export interface OshiEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  time?: string; // e.g. "18:00" or "18:00〜20:30"
  location?: string;
  oshiId?: string;
  category: EventCategory;
  ticketStatus?: TicketStatus;
  memo?: string;
  createdAt: string;
  updatedAt: string;
}

export type TodoPriority = 'low' | 'medium' | 'high';

export interface Todo {
  id: string;
  title: string;
  dueDate?: string; // YYYY-MM-DD
  completed: boolean;
  completedAt?: string;
  priority: TodoPriority;
  oshiId?: string;
  eventId?: string;
  memo?: string;
  createdAt: string;
  updatedAt: string;
}

export type GoodsCategory =
  | 'acrylic' // アクリルスタンド・キーホルダー
  | 'photo' // 生写真・ブロマイド・チェキ
  | 'fan' // うちわ
  | 'penlight' // ペンライト
  | 'apparel' // Tシャツ・タオル・パーカー
  | 'media' // CD・DVD・Blu-ray
  | 'badge' // 缶バッジ
  | 'plush' // ぬいぐるみ・ぬい服
  | 'other'; // その他

export type GoodsOpenStatus = 'unopened' | 'opened' | 'display' | 'storage';

export interface Goods {
  id: string;
  name: string;
  oshiId?: string;
  category: GoodsCategory;
  purchaseDate?: string; // YYYY-MM-DD
  price: number;
  quantity: number;
  openStatus: GoodsOpenStatus;
  storageLocation?: string;
  image?: string; // Base64 data URL
  isFavorite?: boolean;
  memo?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AppSettings {
  id: 'default';
  activeOshiId?: string; // 'all' or specific oshi id
  themeColor?: string;
  themeMode?: 'light' | 'dark';
  createdAt: string;
  updatedAt: string;
}

export interface BackupData {
  app: 'oshiss';
  backupVersion: number;
  createdAt: string;
  data: {
    oshis: Oshi[];
    events: OshiEvent[];
    todos: Todo[];
    goods: Goods[];
    settings?: AppSettings;
  };
}

export interface GoogleUser {
  id: string; // Google sub ID / account ID
  name: string;
  email: string;
  picture?: string;
  linkedAt: string; // ISO date string
  lastSyncedAt?: string; // ISO date string
  autoSync?: boolean;
  driveFileId?: string;
  driveFileName?: string;
  driveFileLink?: string;
  driveSyncedAt?: string;
}

export interface GoogleCloudBackupMetadata {
  updatedAt: string;
  oshisCount: number;
  eventsCount: number;
  todosCount: number;
  goodsCount: number;
  sizeBytes: number;
  driveFileId?: string;
  driveFileName?: string;
  driveFileLink?: string;
  isDriveSynced?: boolean;
}

export interface MaintenanceInfo {
  enabled: boolean;
  title?: string;
  message?: string;
  estimatedEnd?: string;
  updatedAt?: string;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              type?: 'standard' | 'icon';
              theme?: 'outline' | 'filled_blue' | 'filled_black';
              size?: 'large' | 'medium' | 'small';
              text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
              shape?: 'rectangular' | 'pill' | 'circle' | 'square';
              logo_alignment?: 'left' | 'center';
              width?: number | string;
              locale?: string;
            }
          ) => void;
          prompt: (notification?: (notification: { isNotDisplayed: () => boolean; isSkippedMoment: () => boolean }) => void) => void;
        };
        oauth2?: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: any) => void;
          }) => {
            requestAccessToken: (overrideConfig?: any) => void;
          };
        };
      };
    };
  }
}

