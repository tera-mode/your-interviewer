// openBD API（書籍メタデータ補完）
// 認証不要、最大100件同時取得

export interface OpenBDBook {
  isbn: string;
  title: string;
  author: string;
  publisher: string;
  pubdate: string;
  cover: string;
  description: string;
}

function parseOpenBDResponse(item: Record<string, unknown>): OpenBDBook | null {
  try {
    const summary = item.summary as Record<string, string>;
    const onix = item.onix as Record<string, unknown>;

    const description = (() => {
      const textContents = (onix?.CollateralDetail as Record<string, unknown>)?.TextContent;
      if (Array.isArray(textContents)) {
        const desc = textContents.find((t: Record<string, string>) => t.TextType === '03');
        return (desc?.Text as string) || '';
      }
      return '';
    })();

    return {
      isbn: summary?.isbn || '',
      title: summary?.title || '',
      author: summary?.author || '',
      publisher: summary?.publisher || '',
      pubdate: summary?.pubdate || '',
      cover: summary?.cover || '',
      description,
    };
  } catch {
    return null;
  }
}

export async function getBooksByISBN(isbns: string[]): Promise<OpenBDBook[]> {
  if (!isbns.length) return [];

  try {
    const url = `https://api.openbd.jp/v1/get?isbn=${isbns.slice(0, 100).join(',')}`;
    const response = await fetch(url);
    if (!response.ok) return [];

    const data = await response.json();
    if (!Array.isArray(data)) return [];

    return data
      .filter(Boolean)
      .map(parseOpenBDResponse)
      .filter((book): book is OpenBDBook => book !== null);
  } catch (error) {
    console.error('openBD error:', error);
    return [];
  }
}
