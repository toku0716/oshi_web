export interface Oshi {
  id: string;
  name: string;
  ruby?: string;
  group?: string;
  category?: string;
  color: string; // Hex color code (e.g. #FF2D55)
  image?: string; // Base64 data URL
  imagePosition?: string; // CSS object-position (e.g. "center 20%")
  sinceDate?: string; // YYYY-MM-DD (推し始めた日)
  birthday?: string; // YYYY-MM-DD (誕生日)
  debutDate?: string; // YYYY-MM-DD (デビュー日・結成日)
  memo?: string;
  order?: number;
  createdAt: string;
  updatedAt: string;
}

export type EventCategory = 'live' | 'event' | 'broadcast' | 'release' | 'ticket' | 'other';

export type TicketStatus = 'none' | 'applied' | 'won' | 'lost' | 'purchased';

export interface OshiEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  time?: string; // e.g. "18:00"
  location?: string;
  image?: string; // Base64 data URL stored in IndexedDB
  oshiId?: string;
  category: EventCategory;
  ticketStatus?: TicketStatus;
  ticketDeadline?: string; // チケット申込締切 YYYY-MM-DD
  paymentDeadline?: string; // 入金・発券締切 YYYY-MM-DD
  seatInfo?: string; // 座席情報 (例: アリーナA3ブロック 12番)
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
  | 'acrylic'
  | 'photo'
  | 'fan'
  | 'penlight'
  | 'apparel'
  | 'media'
  | 'badge'
  | 'plush'
  | 'other';

export type GoodsOpenStatus = 'unopened' | 'opened' | 'display' | 'storage';

export const GOODS_CATEGORY_META: Record<GoodsCategory, { label: string; iconName?: string }> = {
  acrylic: { label: 'アクスタ' },
  photo: { label: '生写真・チェキ' },
  badge: { label: '缶バッジ' },
  penlight: { label: 'ペンライト' },
  fan: { label: 'うちわ' },
  apparel: { label: 'アパレル・Tシャツ' },
  plush: { label: 'ぬいぐるみ' },
  media: { label: 'CD・DVD・本' },
  other: { label: 'その他' },
};

export const GOODS_OPEN_STATUS_META: Record<GoodsOpenStatus, { label: string; color: string }> = {
  unopened: { label: '未開封', color: '#10B981' },
  opened: { label: '開封済み', color: '#3B82F6' },
  display: { label: '飾っている', color: '#F59E0B' },
  storage: { label: '保管中', color: '#6B7280' },
};

export interface Goods {
  id: string;
  name: string;
  oshiId?: string;
  category: GoodsCategory;
  purchaseDate?: string; // YYYY-MM-DD
  price: number;
  quantity: number;
  isWish?: boolean; // 欲しいものリスト判定
  isPreorder?: boolean; // 予約・注文中判定（重複購入防止）
  openStatus: GoodsOpenStatus;
  storageLocation?: string;
  image?: string; // Base64 data URL
  isFavorite?: boolean;
  memo?: string;
  createdAt: string;
  updatedAt: string;
}

export type ExpenseCategory = 'ticket' | 'goods' | 'travel' | 'fc' | 'cafe' | 'other';

export interface ExpenseItem {
  id: string;
  title: string;
  amount: number;
  date: string; // YYYY-MM-DD
  category: ExpenseCategory;
  image?: string; // Base64 data URL
  oshiId?: string;
  memo?: string;
  createdAt: string;
  updatedAt: string;
}

export const EXPENSE_CATEGORY_META: Record<
  ExpenseCategory,
  { label: string; color: string }
> = {
  ticket: { label: 'チケット', color: '#FF9500' },
  goods: { label: 'グッズ', color: '#FF2D55' },
  travel: { label: '遠征・交通', color: '#007AFF' },
  fc: { label: 'FC・会費', color: '#AF52DE' },
  cafe: { label: 'カフェ・飲食', color: '#34C759' },
  other: { label: 'その他', color: '#8E8E93' },
};

export type ThemeModeOption = 'system' | 'light' | 'dark';

export const CURRENT_POLICY_VERSION = '2026-10-27';
export const CURRENT_POLICY_DATE_LABEL = '2026年10月27日';

export interface GoogleAuthSession {
  email: string;
  name?: string;
  picture?: string;
  authenticatedAt: string;
  expiresAt?: number;
}

export interface JournalEntry {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  oshiId?: string;
  eventId?: string;
  content: string; // 参戦レポ・感想・セトリ・思い出
  rating?: number; // 1-5
  images?: string[]; // Base64 data URLs
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface AppSettings {
  id: 'default';
  activeOshiId?: string;
  themeColor?: string;
  themeMode?: ThemeModeOption;
  monthlyBudget?: number; // 今月の推し活予算目安 (円)
  acceptedPolicyVersion?: string;
  acceptedPolicyAt?: string;
  activePolicyVersion?: string;
  activePolicyDateLabel?: string;
  accessControlEnabled?: boolean;
  googleClientId?: string;
  allowedGoogleEmails?: string[];
  createdAt: string;
  updatedAt: string;
}

export function getEffectivePolicyInfo(settings?: AppSettings | null): {
  version: string;
  dateLabel: string;
} {
  const cachedVersion =
    typeof window !== 'undefined'
      ? localStorage.getItem('oshiss_active_policy_version')
      : null;
  const cachedLabel =
    typeof window !== 'undefined'
      ? localStorage.getItem('oshiss_active_policy_date_label')
      : null;

  return {
    version:
      settings?.activePolicyVersion || cachedVersion || CURRENT_POLICY_VERSION,
    dateLabel:
      settings?.activePolicyDateLabel ||
      cachedLabel ||
      CURRENT_POLICY_DATE_LABEL,
  };
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
    expenses?: ExpenseItem[];
    journals?: JournalEntry[];
    settings?: AppSettings;
  };
}
