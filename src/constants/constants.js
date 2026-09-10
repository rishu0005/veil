export const CONSTANTS = {
    max_video_bytes: 300 * 1024 * 1024 , // 300mb
    max_image_bytes: 300 * 1024 * 1024, // 300mb
    max_quick_links: 50,
    max_notes: 50,
    default_quick_links: {
      yt: {
        keyword: "yt",
        url: "https://youtube.com/",
        description: "Open YouTube",
      },
      gh: {
        keyword: "gh",
        url: "https://github.com/",
        description: "Open GitHub",
      },
      ch: {
        keyword: "ch",
        url: "https://chatgpt.com/",
        description: "Open ChatGPT",
      },
      cl: {
        keyword: "cl",
        url: "https://claude.ai/",
        description: "Open Claude",
      }
    },
    default_notes: {
      yt: {
        title: "Note title",
        body: "This is note body",
      }
    },

}