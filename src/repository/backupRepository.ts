import { getDB } from '../db/database';
import type { BackupData, Oshi, OshiEvent, Todo, Goods, AppSettings } from '../types';

export const BACKUP_CURRENT_VERSION = 1;

export const backupRepository = {
  /**
   * Export all IndexedDB data as BackupData JSON object
   */
  async exportBackup(): Promise<BackupData> {
    const db = await getDB();
    const [oshis, events, todos, goods, settings] = await Promise.all([
      db.getAll('oshis'),
      db.getAll('events'),
      db.getAll('todos'),
      db.getAll('goods'),
      db.get('settings', 'default'),
    ]);

    const backup: BackupData = {
      app: 'oshiss',
      backupVersion: BACKUP_CURRENT_VERSION,
      createdAt: new Date().toISOString(),
      data: {
        oshis,
        events,
        todos,
        goods,
        settings: settings || undefined,
      },
    };

    return backup;
  },

  /**
   * Trigger browser file download with the backup JSON
   */
  async downloadBackupFile(): Promise<string> {
    const backup = await this.exportBackup();
    const jsonString = JSON.stringify(backup, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const fileName = `oshiss-backup-${year}-${month}-${day}.json`;

    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    return fileName;
  },

  /**
   * Validate and import backup JSON data into IndexedDB
   * Overwrites existing data in a single clean transaction
   */
  async importBackup(parsed: unknown): Promise<{ oshisCount: number; eventsCount: number; todosCount: number; goodsCount: number }> {
    if (!parsed || typeof parsed !== 'object') {
      throw new Error('無効なバックアップファイルです。JSONオブジェクトではありません。');
    }

    const obj = parsed as Record<string, any>;

    // Basic app check
    if (obj.app !== 'oshiss') {
      // Be forgiving if user modified or older format, but warn if totally unknown
      if (!obj.data && !Array.isArray(obj.oshis)) {
        throw new Error('推しサポのバックアップファイルではありません。');
      }
    }

    const version = Number(obj.backupVersion) || 1;
    if (version > BACKUP_CURRENT_VERSION) {
      throw new Error(`このバックアップファイルのバージョン (${version}) は新しすぎるため対応していません。アプリを最新に更新してください。`);
    }

    // Normalize data structure based on version
    let oshis: Oshi[] = [];
    let events: OshiEvent[] = [];
    let todos: Todo[] = [];
    let goods: Goods[] = [];
    let settings: AppSettings | undefined = undefined;

    if (obj.data) {
      oshis = Array.isArray(obj.data.oshis) ? obj.data.oshis : [];
      events = Array.isArray(obj.data.events) ? obj.data.events : [];
      todos = Array.isArray(obj.data.todos) ? obj.data.todos : [];
      goods = Array.isArray(obj.data.goods) ? obj.data.goods : [];
      settings = obj.data.settings;
    } else {
      // Fallback for root-level array format
      oshis = Array.isArray(obj.oshis) ? obj.oshis : [];
      events = Array.isArray(obj.events) ? obj.events : [];
      todos = Array.isArray(obj.todos) ? obj.todos : [];
      goods = Array.isArray(obj.goods) ? obj.goods : [];
    }

    const db = await getDB();
    const tx = db.transaction(['oshis', 'events', 'todos', 'goods', 'settings'], 'readwrite');

    try {
      // Clear existing stores
      await Promise.all([
        tx.objectStore('oshis').clear(),
        tx.objectStore('events').clear(),
        tx.objectStore('todos').clear(),
        tx.objectStore('goods').clear(),
      ]);

      // Insert oshis
      for (const o of oshis) {
        if (o.id && o.name) {
          await tx.objectStore('oshis').put(o);
        }
      }

      // Insert events
      for (const e of events) {
        if (e.id && e.title && e.date) {
          await tx.objectStore('events').put(e);
        }
      }

      // Insert todos
      for (const t of todos) {
        if (t.id && t.title) {
          await tx.objectStore('todos').put(t);
        }
      }

      // Insert goods
      for (const g of goods) {
        if (g.id && g.name) {
          await tx.objectStore('goods').put(g);
        }
      }

      // Restore settings if provided
      if (settings && settings.id === 'default') {
        await tx.objectStore('settings').put(settings);
      }

      await tx.done;

      return {
        oshisCount: oshis.length,
        eventsCount: events.length,
        todosCount: todos.length,
        goodsCount: goods.length,
      };
    } catch (err) {
      tx.abort();
      throw new Error(`データの復元に失敗しました: ${err instanceof Error ? err.message : String(err)}`);
    }
  },

  /**
   * Clear all stores in IndexedDB
   */
  async clearAllData(): Promise<void> {
    const db = await getDB();
    const tx = db.transaction(['oshis', 'events', 'todos', 'goods', 'settings'], 'readwrite');
    await Promise.all([
      tx.objectStore('oshis').clear(),
      tx.objectStore('events').clear(),
      tx.objectStore('todos').clear(),
      tx.objectStore('goods').clear(),
      tx.objectStore('settings').clear(),
    ]);
    await tx.done;
  },

  /**
   * Seed sample data for first-time visitors
   */
  async seedSampleData(): Promise<void> {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const in3Days = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const in10Days = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const in20Days = new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    const sampleOshis: Oshi[] = [
      {
        id: 'oshi-1',
        name: '星野 ルカ',
        ruby: 'ほしの るか',
        group: 'Luminous Stars',
        color: '#f43f5e', // Rose pink
        image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
        debutDate: '2024-04-01',
        memo: '圧倒的センター！笑顔と力強い歌声が最高。',
        order: 1,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      },
      {
        id: 'oshi-2',
        name: '如月 ハル',
        ruby: 'きさらぎ はる',
        group: 'Blue Horizon',
        color: '#3b82f6', // Bright blue
        image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
        debutDate: '2025-01-15',
        memo: 'クールなダンスリーダー。作詞作曲も担当。',
        order: 2,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      },
    ];

    const sampleEvents: OshiEvent[] = [
      {
        id: 'event-1',
        title: 'Luminous Stars 2nd Anniversary LIVE',
        date: in3Days,
        time: '18:00 開場 / 19:00 開演',
        location: '横浜アリーナ',
        oshiId: 'oshi-1',
        category: 'live',
        ticketStatus: 'won',
        memo: 'ペンライト電池交換忘れずに！うちわ持参。アリーナAブロック当選！',
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      },
      {
        id: 'event-2',
        title: '新曲リリース記念 オンライン生配信',
        date: in10Days,
        time: '20:00〜21:30',
        location: 'YouTube公式チャンネル',
        oshiId: 'oshi-1',
        category: 'broadcast',
        ticketStatus: 'none',
        memo: 'リアルタイムチャットで応援コメントを送る！',
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      },
      {
        id: 'event-3',
        title: 'Blue Horizon 初ファンミーティング',
        date: in20Days,
        time: '14:00〜',
        location: '豊洲PIT',
        oshiId: 'oshi-2',
        category: 'event',
        ticketStatus: 'applied',
        memo: '当落発表は来週金曜日18:00',
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      },
      {
        id: 'event-4',
        title: '音楽雑誌「SOUND WAVE」表紙巻頭特集発売',
        date: todayStr,
        time: '書店開店〜',
        location: '全国書店 / アニメイト',
        oshiId: 'oshi-1',
        category: 'release',
        ticketStatus: 'none',
        memo: '特典ポストカード付きをアニメイトで予約済み',
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      },
    ];

    const sampleTodos: Todo[] = [
      {
        id: 'todo-1',
        title: 'ライブ用ペンライトの乾電池（単4×3本）を購入する',
        dueDate: in3Days,
        completed: false,
        priority: 'high',
        oshiId: 'oshi-1',
        eventId: 'event-1',
        memo: '予備も含めて多めに買っておく',
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      },
      {
        id: 'todo-2',
        title: '遠征用ホテルのチェックイン時間確認＆新幹線切符発券',
        dueDate: in3Days,
        completed: false,
        priority: 'high',
        oshiId: 'oshi-1',
        eventId: 'event-1',
        memo: '新横浜駅到着 14:30 予定',
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      },
      {
        id: 'todo-3',
        title: '新作うちわの文字シール貼り付け仕上げ',
        dueDate: todayStr,
        completed: true,
        completedAt: now.toISOString(),
        priority: 'medium',
        oshiId: 'oshi-1',
        eventId: 'event-1',
        memo: '「ルカちゃん見て！」の蛍光ピンクカッティングシート完了',
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      },
      {
        id: 'todo-4',
        title: 'ファンレター執筆＆投函準備',
        dueDate: in10Days,
        completed: false,
        priority: 'medium',
        oshiId: 'oshi-2',
        memo: '新曲の感想を丁寧につづる',
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      },
    ];

    const sampleGoods: Goods[] = [
      {
        id: 'goods-1',
        name: '2nd Anniversary 公式アクリルスタンド',
        oshiId: 'oshi-1',
        category: 'acrylic',
        purchaseDate: todayStr,
        price: 1800,
        quantity: 2,
        openStatus: 'opened',
        storageLocation: 'デスクの推し祭壇',
        image: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=300&auto=format&fit=crop&q=80',
        isFavorite: true,
        memo: '保存用と飾る用の2個買い！ビジュアル神すぎ！',
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      },
      {
        id: 'goods-2',
        name: 'Luminous Penlight ver.3',
        oshiId: 'oshi-1',
        category: 'penlight',
        purchaseDate: '2026-08-10',
        price: 3800,
        quantity: 1,
        openStatus: 'opened',
        storageLocation: '遠征バッグ内',
        image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&auto=format&fit=crop&q=80',
        isFavorite: true,
        memo: '14色カラーチェンジ対応。発光がとても綺麗。',
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      },
      {
        id: 'goods-3',
        name: 'ランダム生写真セット（全20種）',
        oshiId: 'oshi-2',
        category: 'photo',
        purchaseDate: '2026-09-01',
        price: 2500,
        quantity: 5,
        openStatus: 'storage',
        storageLocation: 'トレカファイルA',
        isFavorite: false,
        memo: 'サイン入りシークレット1枚自引き！',
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      },
      {
        id: 'goods-4',
        name: 'オリジナルマフラータオル',
        oshiId: 'oshi-1',
        category: 'apparel',
        purchaseDate: '2026-07-20',
        price: 2200,
        quantity: 1,
        openStatus: 'opened',
        storageLocation: 'クローゼット',
        isFavorite: false,
        memo: 'ライブ定番アイテム。手触り良好。',
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      },
    ];

    const sampleBackup: BackupData = {
      app: 'oshiss',
      backupVersion: BACKUP_CURRENT_VERSION,
      createdAt: now.toISOString(),
      data: {
        oshis: sampleOshis,
        events: sampleEvents,
        todos: sampleTodos,
        goods: sampleGoods,
        settings: {
          id: 'default',
          activeOshiId: 'all',
          themeColor: '#f43f5e',
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
        },
      },
    };

    await this.importBackup(sampleBackup);
  },
};
