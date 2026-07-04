/**
 * Qiita API v2 POST/PATCH script.
 *
 * - POST  when frontmatter.qiita_id is absent  (new article)
 * - PATCH when frontmatter.qiita_id is present (existing article)
 *
 * Requires: QIITA_ACCESS_TOKEN environment variable.
 */

export interface PostQiitaInput {
  slug: string;
  frontmatter: {
    title: string;
    tags: string[];
    published: boolean;
    qiita_id?: string;
  };
  qiita: {
    payload: {
      title: string;
      tags: Array<{ name: string }>;
      private: boolean;
      body: string;
    };
  };
}

export interface PostQiitaResult {
  qiita_id: string;
  url: string;
  isNew: boolean;
}

/**
 * Posts or updates an article on Qiita.
 * Throws an Error (with details) if the API responds with a non-2xx status.
 */
export async function postToQiita(
  input: PostQiitaInput
): Promise<PostQiitaResult> {
  const token = process.env.QIITA_ACCESS_TOKEN;
  if (!token) {
    const msg = "QIITA_ACCESS_TOKEN is not set";
    process.stderr.write(msg + "\n");
    process.exit(1);
  }

  const existingId = input.frontmatter.qiita_id;
  const isNew = !existingId;
  const method = isNew ? "POST" : "PATCH";
  const apiUrl = isNew
    ? "https://qiita.com/api/v2/items"
    : `https://qiita.com/api/v2/items/${existingId}`;

  // The payload already contains the crosspost link (added by buildQiitaPayload).
  const payload = input.qiita.payload;

  let response: Response;
  try {
    response = await fetch(apiUrl, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    const msg = `Network error calling Qiita API: ${(err as Error).message}`;
    process.stderr.write(msg + "\n");
    process.exit(1);
  }

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "(unreadable body)");
    const msg = `Qiita API ${method} ${apiUrl} failed with ${response.status}: ${errorBody}`;
    process.stderr.write(msg + "\n");
    process.exit(1);
  }

  const data = (await response.json()) as { id: string; url: string };
  return {
    qiita_id: data.id,
    url: data.url,
    isNew,
  };
}
