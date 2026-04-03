const axios = require("axios");

/**
 * Fetches ALL videos from a YouTube playlist, handling pagination automatically.
 * The YouTube API returns at most 50 items per page; this function follows
 * nextPageToken until every page has been retrieved.
 *
 * @param {string} playlistId - The YouTube playlist ID (e.g. "PL123")
 * @returns {Promise<Array<{title: string, videoId: string}>>}
 *
 * @example
 * const videos = await fetchPlaylistVideos("PL123");
 * // [{ title: "Intro", videoId: "abc123" }, { title: "Lecture 1", videoId: "xyz456" }, ...]
 */
async function fetchPlaylistVideos(playlistId) {
  const videos = [];
  let nextPageToken = null;

  do {
    const params = {
      part: "snippet",
      playlistId,
      key: process.env.YT_API_KEY,
      maxResults: 50
    };

    if (nextPageToken) {
      params.pageToken = nextPageToken;
    }

    const res = await axios.get(
      "https://www.googleapis.com/youtube/v3/playlistItems",
      { params }
    );

    const items = res.data.items.map(item => ({
      title: item.snippet.title,
      videoId: item.snippet.resourceId.videoId
    }));

    videos.push(...items);

    // Will be undefined/null on the last page — loop ends
    nextPageToken = res.data.nextPageToken || null;

  } while (nextPageToken);

  return videos;
}

module.exports = fetchPlaylistVideos;
