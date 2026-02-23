import { TMDbMovie } from '@/types/encounter';
import { rateLimiter } from './rateLimiter';

const TMDB_API_BASE = 'https://api.themoviedb.org/3';
const TMDB_BEARER_TOKEN = process.env.TMDB_BEARER_TOKEN;
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';

// TMDbジャンルID（日本語対応）
export const TMDB_GENRES = {
  action: 28,
  adventure: 12,
  animation: 16,
  comedy: 35,
  crime: 80,
  documentary: 99,
  drama: 18,
  fantasy: 14,
  horror: 27,
  music: 10402,
  mystery: 9648,
  romance: 10749,
  scifi: 878,
  thriller: 53,
  family: 10751,
  history: 36,
} as const;

export function getTMDbPosterUrl(posterPath: string | null): string {
  if (!posterPath) return '';
  return `${TMDB_IMAGE_BASE}${posterPath}`;
}

interface TMDbSearchParams {
  query?: string;
  genreIds?: number[];
  minRating?: number;
  year?: number;
  page?: number;
}

export async function searchTMDbMovies(params: TMDbSearchParams): Promise<TMDbMovie[]> {
  if (!TMDB_BEARER_TOKEN) {
    console.warn('TMDB_BEARER_TOKEN is not set');
    return [];
  }

  const headers = {
    Authorization: `Bearer ${TMDB_BEARER_TOKEN}`,
    'Content-Type': 'application/json',
  };

  await rateLimiter.wait('tmdb');

  try {
    let url: URL;

    if (params.query) {
      // キーワード検索
      url = new URL(`${TMDB_API_BASE}/search/movie`);
      url.searchParams.set('query', params.query);
      url.searchParams.set('language', 'ja-JP');
      if (params.year) url.searchParams.set('year', String(params.year));
    } else {
      // Discover API（ジャンル・評価フィルタ）
      url = new URL(`${TMDB_API_BASE}/discover/movie`);
      url.searchParams.set('language', 'ja-JP');
      url.searchParams.set('sort_by', 'vote_average.desc');
      url.searchParams.set('vote_count.gte', '100');
      if (params.genreIds?.length) url.searchParams.set('with_genres', params.genreIds.join(','));
      if (params.minRating) url.searchParams.set('vote_average.gte', String(params.minRating));
    }

    if (params.page) url.searchParams.set('page', String(params.page));

    const response = await fetch(url.toString(), { headers });
    if (!response.ok) {
      console.error(`TMDb API error: ${response.status}`);
      return [];
    }

    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error('TMDb search error:', error);
    return [];
  }
}
