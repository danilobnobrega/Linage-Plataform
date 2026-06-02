export async function fetchNewsForTopic(topic, token) {
  try {
    const res = await fetch(`/api/news?topic=${encodeURIComponent(topic)}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return '';
    const data = await res.json();
    return data.headlines || '';
  } catch {
    return '';
  }
}
