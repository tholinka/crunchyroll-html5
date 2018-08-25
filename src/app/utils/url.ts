export function parseQuery(
  query: string
): { [key: string]: string | (string[]) } {
  if (query[0] === '?') query = query.substring(1);

  const tokens = query.split('&');
  const queries: { [key: string]: string | (string[]) } = {};
  for (const token of tokens) {
    const [key, value] = token.split('=').map(x => decodeURIComponent(x));
    if (queries.hasOwnProperty(key)) {
      if (typeof queries[key] === 'string') {
        queries[key] = [queries[key] as string, value];
      } else {
        (queries[key] as string[]).push(value);
      }
    } else {
      queries[key] = value;
    }
  }
  return queries;
}

export function parseSimpleQuery(query: string): { [key: string]: string } {
  const queries = parseQuery(query);
  for (const key in queries) {
    if (queries.hasOwnProperty(key)) {
      if (Array.isArray(queries[key])) {
        if (queries[key].length > 0) {
          queries[key] = queries[key][0];
        } else {
          delete queries[key];
        }
      }
    }
  }
  return queries as { [key: string]: string };
}

export function buildQuery(query: { [key: string]: string }): string {
  const builder: string[] = [];

  for (const key in query) {
    if (query.hasOwnProperty(key)) {
      builder.push(
        encodeURIComponent(key) + '=' + encodeURIComponent(query[key])
      );
    }
  }
  return builder.join('&');
}
