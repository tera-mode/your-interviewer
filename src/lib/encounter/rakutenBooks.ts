// 楽天ブックスAPIは新エンドポイント(openapi.rakuten.co.jp)では利用不可のため、
// 楽天市場API（IchibaItem Search）の本ジャンル（genreId: 200162）で代替する

import { RakutenItem } from '@/types/encounter';
import { searchRakutenItems } from './rakuten';

// 楽天市場の本関連ジャンルID
export const RAKUTEN_BOOK_GENRE_IDS = {
  all: '200162',        // 本・雑誌・コミック 全体
  business: '208948',   // ビジネス・経済
  selfHelp: '208940',   // 人文・思想・社会（自己啓発含む）
  science: '208956',    // 科学・テクノロジー
  art: '208952',        // アート・デザイン
  novel: '208946',      // 小説・文芸
  manga: '208928',      // コミック
  kids: '208932',       // 絵本・児童書
} as const;

interface BooksSearchParams {
  keyword?: string;
  booksGenreId?: string;
  sort?: string;
  hits?: number;
}

export async function searchRakutenBooks(params: BooksSearchParams): Promise<RakutenItem[]> {
  return searchRakutenItems({
    keyword: params.keyword || '本',
    genreId: params.booksGenreId || RAKUTEN_BOOK_GENRE_IDS.all,
    hits: params.hits || 10,
    sort: params.sort || '-reviewAverage',
  });
}
