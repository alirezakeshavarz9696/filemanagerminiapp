import { useEffect, useRef, useState } from "react";
import { useTelegramUser } from "./telegram/useTelegramUser.js";

const formatUserName = (user) => {
  if (!user) return "Guest";
  const name = [user.first_name, user.last_name].filter(Boolean).join(" ");
  return name || user.username || "Telegram User";
};

const Icon = ({ path, className = "icon" }) => (
  <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
    <path d={path} />
  </svg>
);

const DEFAULT_PAGE_SIZE = 20;

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "https://nexicobot.irancellhamrah.com";

const CATEGORIES = [
  {
    id: "all",
    label: "All",
    icon: "M4 7a1 1 0 0 1 1-1h14a1 1 0 1 1 0 2H5a1 1 0 0 1-1-1zm0 5a1 1 0 0 1 1-1h9a1 1 0 1 1 0 2H5a1 1 0 0 1-1-1zm0 5a1 1 0 0 1 1-1h14a1 1 0 1 1 0 2H5a1 1 0 0 1-1-1z",
  },
  {
    id: "audio",
    label: "Audio",
    icon: "M9 5a1 1 0 0 1 1-1h4a4 4 0 0 1 4 4v7a4 4 0 1 1-2-3.46V8a2 2 0 0 0-2-2h-3v8.54A4 4 0 1 1 9 11.5V5z",
  },
  {
    id: "ImageVideo",
    label: "Media",
    icon: "M6 4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h7.5a2 2 0 0 0 1.41-.59l4.5-4.5A2 2 0 0 0 20 15.5V6a2 2 0 0 0-2-2H6zm1.5 5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zM7 17l3.5-4 2.5 3 2-2 3 3H7z",
  },
  {
    id: "file",
    label: "Files",
    icon: "M6 3a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V9.5L12.5 3H6zm7 1.5L16.5 8H13a1 1 0 0 1-1-1V4.5z",
  },
];


const buildQuery = (params) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    query.set(key, String(value));
  });
  return query.toString();
};

const normalizeItems = (payload) => {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.items)) return payload.items;
  if (Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload.result)) return payload.result;
  if (Array.isArray(payload.files)) return payload.files;
  return [];
};

const mergeById = (previousItems, nextItems) => {
  const seen = new Set(
    previousItems.map((item) => resolveFileId(item)).filter(Boolean)
  );
  const merged = [...previousItems];
  nextItems.forEach((item) => {
    const id = resolveFileId(item);
    if (!id || !seen.has(id)) {
      merged.push(item);
    }
  });
  return merged;
};

const normalizePagination = (payload, items, fallbackPage, fallbackPageSize) => {
  if (!payload || typeof payload !== "object") {
    return {
      page: fallbackPage,
      pageSize: fallbackPageSize,
      total: null,
      hasNext: items.length === fallbackPageSize,
    };
  }
  const page =
    payload.page ??
    payload.pageNumber ??
    payload.currentPage ??
    payload.page_number ??
    fallbackPage;
  const pageSize =
    payload.pageSize ??
    payload.page_size ??
    payload.perPage ??
    payload.limit ??
    fallbackPageSize;
  const total =
    payload.total ??
    payload.totalCount ??
    payload.total_count ??
    payload.count ??
    payload.totalItems ??
    null;
  const hasNext =
    payload.hasNext ??
    payload.has_next_page ??
    (total !== null ? page * pageSize < total : items.length === pageSize);

  return { page, pageSize, total, hasNext };
};

const formatBytes = (bytes) => {
  if (!Number.isFinite(bytes)) return "—";
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const index = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1
  );
  const value = bytes / 1024 ** index;
  return `${value.toFixed(value < 10 && index > 0 ? 1 : 0)} ${units[index]}`;
};

const formatDate = (value) => {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(date);
};

const truncateMiddle = (value, head = 18, tail = 10) => {
  if (!value || value.length <= head + tail + 1) return value || "";
  return `${value.slice(0, head)}...${value.slice(-tail)}`;
};

const resolveFileField = (item, keys) => {
  for (const key of keys) {
    if (item && item[key] !== undefined && item[key] !== null) return item[key];
  }
  return null;
};

const resolveFileId = (item) =>
  resolveFileField(item, ["id", "fileId", "file_id", "fileID"]);

const resolveFileName = (item) =>
  resolveFileField(item, [
    "name",
    "fileName",
    "filename",
    "file_name",
    "title",
  ]);

const resolveFileCategory = (item) =>
  resolveFileField(item, [
    "category",
    "fileCategory",
    "file_category",
    "file_type",
    "type",
  ]);

const resolveFileSize = (item) =>
  resolveFileField(item, [
    "size",
    "fileSize",
    "file_size",
    "bytes",
    "length",
  ]);

const resolveFileDate = (item) =>
  resolveFileField(item, [
    "updatedAt",
    "updated_at",
    "created_at",
    "createdAt",
    "created_at",
    "date",
  ]);

const resolveMimeType = (item) =>
  resolveFileField(item, ["mime_type", "mimeType", "file_type", "fileType"]);

const resolveThumbnailData = (item) => {
  if (!item) return null;
  if (typeof item.thumbnail === "string") return item.thumbnail;
  if (item.thumbnail?.data) return item.thumbnail.data;
  if (item.thumbnail?.file_id) return item.thumbnail.file_id;
  return null;
};

const buildThumbnailUrl = (item) => {
  const data = resolveThumbnailData(item);
  if (!data) return null;
  if (data.startsWith("data:")) return data;
  if (data.startsWith("http")) return data;
  return `data:image/jpeg;base64,${data}`;
};

const getCategoryLabel = (category) => {
  if (category === "audio") return "Audio";
  if (category === "image") return "Image";
  if (category === "video") return "Video";
  if (category === "ImageVideo") return "Media";
  const match = CATEGORIES.find((entry) => entry.id === category);
  return match?.label || "Other";
};

const buildFileUrl = (path) => `${API_BASE_URL}${path}`;

const openLink = (url) => {
  if (
    typeof window !== "undefined" &&
    window.Telegram &&
    window.Telegram.WebApp
  ) {
    window.Telegram.WebApp.openLink(url);
    return;
  }
  window.open(url, "_blank", "noopener,noreferrer");
};

const useDebouncedValue = (value, delay = 350) => {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const handle = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(handle);
  }, [value, delay]);

  return debounced;
};

export default function App() {
  const { user, isReady } = useTelegramUser();
  const [files, setFiles] = useState([]);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [viewMode, setViewMode] = useState("list");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasNext, setHasNext] = useState(false);
  const [total, setTotal] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [openCardId, setOpenCardId] = useState(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [showUploadHelp, setShowUploadHelp] = useState(false);
  const listRef = useRef(null);
  const [preview, setPreview] = useState(null);
  const [previewContent, setPreviewContent] = useState("");
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState("");

  const userId = user?.id;
  const debouncedSearch = useDebouncedValue(search);

  const fetchFiles = async () => {
    if (!userId) return;
    setLoading(true);
    setError("");
    try {
      const categoryParam = category === "all" ? undefined : category;
      const query = buildQuery({
        userId,
        page,
        pageSize: DEFAULT_PAGE_SIZE,
        search: debouncedSearch || undefined,
        category: categoryParam,
      });
      const response = await fetch(buildFileUrl(`/api/UserFiles?${query}`));
      if (!response.ok) {
        throw new Error("Failed to load files. Please try again.");
      }
      const payload = await response.json();
      const items = normalizeItems(payload);
      const pagination = normalizePagination(
        payload,
        items,
        page,
        DEFAULT_PAGE_SIZE
      );
      setFiles((prev) => (page === 1 ? items : mergeById(prev, items)));
      setHasNext(Boolean(pagination.hasNext));
      setTotal(pagination.total);
    } catch (err) {
      setError(err.message || "Unexpected error.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!userId) return;
    fetchFiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, page, debouncedSearch, category]);

  useEffect(() => {
    if (!selectionMode) {
      setSelectedIds(new Set());
      return;
    }
    const ids = files
      .map((item) => resolveFileId(item))
      .filter(Boolean);
    setSelectedIds(new Set(ids));
  }, [selectionMode, files]);

  useEffect(() => {
    const handleOutside = (event) => {
      if (!event.target.closest(".menu-trigger, .menu-dropdown")) {
        setOpenMenuId(null);
      }
      if (!event.target.closest(".file-card, .card-action, .card-select-overlay")) {
        setOpenCardId(null);
      }
    };
    document.addEventListener("click", handleOutside);
    return () => document.removeEventListener("click", handleOutside);
  }, []);

  const handleDelete = async (fileId) => {
    if (!fileId || !userId) return;
    try {
      await fetch(buildFileUrl(`/api/UserFiles/${fileId}?${buildQuery({ userId })}`), {
        method: "DELETE",
      });
      setFiles((prev) => prev.filter((item) => resolveFileId(item) !== fileId));
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(fileId);
        return next;
      });
    } catch (error) {
      window.alert("Failed to remove file.");
    }
  };

  const handleBulkDelete = async () => {
    if (!userId || selectedIds.size === 0) return;
    try {
      await fetch(buildFileUrl("/api/UserFiles"), {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          file_ids: Array.from(selectedIds),
        }),
      });
      setFiles((prev) =>
        prev.filter((item) => !selectedIds.has(resolveFileId(item)))
      );
      setSelectedIds(new Set());
      setSelectionMode(false);
    } catch (error) {
      window.alert("Failed to remove files.");
    }
  };

  const getMediaKind = (item) => {
    const mime = resolveMimeType(item);
    if (mime && typeof mime === "string") {
      if (mime.startsWith("image/")) return "image";
      if (mime.startsWith("video/")) return "video";
      if (mime.startsWith("audio/")) return "audio";
      if (mime.startsWith("text/")) return "text";
    }
    const fallback = resolveFileCategory(item);
    if (["image", "video", "audio", "text"].includes(fallback)) return fallback;
    return "file";
  };

  const openPreview = (item) => {
    const fileId = resolveFileId(item);
    if (!fileId) return;
    const query = buildQuery({ userId });
    const url = buildFileUrl(`/api/UserFiles/${fileId}/stream?${query}`);
    const kind = getMediaKind(item);
    setPreviewLoading(true);
    setPreviewError("");
    setPreview({
      url,
      kind,
      name: resolveFileName(item) || "File",
    });
  };

  const openFile = (item) => {
    const kind = getMediaKind(item);
    if (["image", "video", "audio", "text"].includes(kind)) {
      openPreview(item);
      return;
    }
    const fileId = resolveFileId(item);
    if (!fileId) return;
    const query = buildQuery({ userId });
    const url = buildFileUrl(`/api/UserFiles/${fileId}/download?${query}`);
    openLink(url);
  };

  const getPrimaryActionLabel = (item) => {
    const kind = getMediaKind(item);
    if (kind === "video" || kind === "audio") return "Play";
    if (kind === "image") return "Preview";
    if (kind === "text") return "Preview";
    return "Open";
  };

  const getPrimaryActionIcon = (item) => {
    const kind = getMediaKind(item);
    if (kind === "video" || kind === "audio") {
      return "M8 5.5v13a1 1 0 0 0 1.5.86l9-6.5a1 1 0 0 0 0-1.72l-9-6.5A1 1 0 0 0 8 5.5z";
    }
    if (kind === "image") {
      return "M6 5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9.5l-4-4H6zm0 2h8.5L18 9.5V17H6V7zm2.5 3a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zM7 16l3.5-4 2.5 3 2-2 3 3H7z";
    }
    if (kind === "text") {
      return "M6 4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h6.5a2 2 0 0 0 1.41-.59l4.5-4.5A2 2 0 0 0 20 15.5V6a2 2 0 0 0-2-2H6zm2 4h6a1 1 0 1 1 0 2H8a1 1 0 1 1 0-2zm0 4h4a1 1 0 1 1 0 2H8a1 1 0 1 1 0-2z";
    }
    return "M7 5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h6.5a2 2 0 0 0 1.41-.59l4.5-4.5A2 2 0 0 0 20 12V7a2 2 0 0 0-2-2H7zm7 0v4a1 1 0 0 0 1 1h4";
  };

  useEffect(() => {
    if (!preview || preview.kind !== "text") {
      setPreviewContent("");
      setPreviewError("");
      setPreviewLoading(false);
      return;
    }
    let active = true;
    setPreviewLoading(true);
    setPreviewError("");
    fetch(preview.url)
      .then((response) => {
        if (!response.ok) throw new Error("Failed to load file.");
        return response.text();
      })
      .then((text) => {
        if (!active) return;
        setPreviewContent(text);
      })
      .catch((error) => {
        if (!active) return;
        setPreviewError(error.message || "Unable to load text.");
      })
      .finally(() => {
        if (!active) return;
        setPreviewLoading(false);
      });
    return () => {
      active = false;
    };
  }, [preview]);


  const handleListScroll = (event) => {
    const target = event.currentTarget;
    if (!target || loading || !hasNext) return;
    const threshold = 140;
    if (target.scrollHeight - target.scrollTop - target.clientHeight < threshold) {
      setPage((prev) => prev + 1);
    }
  };

  return (
    <div className="app">
      <header className="app-bar">
        <div className="user-pill">
          <span className="user-avatar">
            {formatUserName(user).slice(0, 1)}
          </span>
          <span className="user-name">
            {user?.username ? `@${user.username}` : formatUserName(user)}
          </span>
        </div>
        <button
          className="ghost-button icon-button"
          onClick={fetchFiles}
          disabled={loading || !userId || !isReady}
          aria-label="Reload"
        >
          <Icon path="M12 5a7 7 0 1 1-6.32 4H7a1 1 0 1 1 0 2H3a1 1 0 0 1-1-1V6a1 1 0 1 1 2 0v2.07A9 9 0 1 0 12 3a1 1 0 1 1 0 2z" />
        </button>
      </header>


      <section className="filters-bar">
        <div
          className={`filters-panel ${
            selectionMode ? "hidden" : "visible"
          }`}
          aria-hidden={selectionMode}
        >
          <div className="chips">
            {CATEGORIES.map((chip) => (
              <button
                key={chip.id}
                className={`chip ${category === chip.id ? "active" : ""}`}
                onClick={() => {
                  setPage(1);
                  setFiles([]);
                  setCategory(chip.id);
                }}
              >
                <Icon path={chip.icon} className="chip-icon" />
                {chip.label}
              </button>
            ))}
          </div>
          <div className="controls-row">
            <div className="search-field big">
              <span className="search-icon">⌕</span>
              <input
                type="search"
                placeholder="Search in your files"
                value={search}
                onChange={(event) => {
                  setPage(1);
                  setFiles([]);
                  setSearch(event.target.value);
                }}
              />
            </div>
          </div>
          <div className="helper-row">
            <button
              className="link-button"
              onClick={() => setShowUploadHelp(true)}
            >
              <Icon path="M12 2a10 10 0 1 1-7.07 2.93A9.94 9.94 0 0 1 12 2zm0 7a1 1 0 0 0-1 1v5a1 1 0 1 0 2 0v-5a1 1 0 0 0-1-1zm0-4a1.25 1.25 0 1 0 0 2.5A1.25 1.25 0 0 0 12 5z" />
              Upload files
            </button>
          </div>
        </div>
        <div
          className={`filters-panel ${
            selectionMode ? "visible" : "hidden"
          }`}
          aria-hidden={!selectionMode}
        >
          <div className="selection-toolbar">
            <div className="bulk-actions">
              <button className="bulk-button danger" onClick={handleBulkDelete}>
                <Icon path="M9 3a1 1 0 0 0-1 1v1H5a1 1 0 1 0 0 2h1l1.1 12.1A2 2 0 0 0 9.09 21h5.82a2 2 0 0 0 1.99-1.9L18 7h1a1 1 0 1 0 0-2h-3V4a1 1 0 0 0-1-1H9z" />
                Remove
              </button>
            </div>
            <button className="bulk-cancel" onClick={() => setSelectionMode(false)}>
              Cancel
            </button>
          </div>
        </div>
      </section>

      <section className="workspace">
        <div className="file-list">
          <div className="list-title">
            <label className="select-all">
              <input
                type="checkbox"
                checked={selectionMode}
                onChange={(event) => setSelectionMode(event.target.checked)}
              />
            </label>
            <div className="view-toggle">
              <button
                className={`toggle-button ${
                  viewMode === "list" ? "active" : ""
                }`}
                onClick={() => setViewMode("list")}
                aria-label="List view"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M5 6.5a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0zm5-.5a1 1 0 0 1 1-1h7a1 1 0 1 1 0 2h-7a1 1 0 0 1-1-1zm0 6a1 1 0 0 1 1-1h7a1 1 0 1 1 0 2h-7a1 1 0 0 1-1-1zm-5-.5a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0zm0 5a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0zm5 .5a1 1 0 0 1 1-1h7a1 1 0 1 1 0 2h-7a1 1 0 0 1-1-1z" />
                </svg>
                <span className="sr-only">List</span>
              </button>
              <button
                className={`toggle-button ${
                  viewMode === "card" ? "active" : ""
                }`}
                onClick={() => setViewMode("card")}
                aria-label="Card view"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M6 4a2 2 0 0 0-2 2v4h7V4H6zm7 0v6h7V6a2 2 0 0 0-2-2h-5zM4 12v6a2 2 0 0 0 2 2h5v-8H4zm9 0v8h5a2 2 0 0 0 2-2v-6h-7z" />
                </svg>
                <span className="sr-only">Cards</span>
              </button>
            </div>
          </div>
          {viewMode === "list" ? (
            <div className={`list-header ${selectionMode ? "selecting" : ""}`}>
              <span className="col-name"></span>
              <span className="col-actions"></span>
            </div>
          ) : null}
          <div
            className={`list-body ${viewMode}`}
            ref={listRef}
            onScroll={handleListScroll}
          >
            {loading ? (
              <div className="empty-state">Loading your files...</div>
            ) : error ? (
              <div className="empty-state error">{error}</div>
            ) : files.length === 0 ? (
              <div className="empty-state">
                <div className="empty-illustration">
                  <Icon path="M4 7a1 1 0 0 1 1-1h14a1 1 0 1 1 0 2H5a1 1 0 0 1-1-1zm2 4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v6a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3v-6z" />
                </div>
                <div className="empty-title">No files yet</div>
                <div className="empty-subtitle">
                  Send or forward a file to the bot to see it here.
                </div>
              </div>
            ) : (
              files.map((item) => {
                const id = resolveFileId(item);
                const name = resolveFileName(item) || "Untitled file";
                const shortName = truncateMiddle(name, 18, 10);
                const fileCategory = resolveFileCategory(item) || "other";
                const size = resolveFileSize(item);
                const date = resolveFileDate(item);
                const thumbnailUrl = buildThumbnailUrl(item);
                if (viewMode === "card") {
                  const isChecked = selectedIds.has(id);
                  return (
                    <div
                      key={id ?? name}
                      className={`file-card ${thumbnailUrl ? "has-thumb" : ""}`}
                      onClick={() =>
                        selectionMode
                          ? setSelectedIds((prev) => {
                              const next = new Set(prev);
                              if (next.has(id)) {
                                next.delete(id);
                              } else {
                                next.add(id);
                              }
                              return next;
                            })
                          : setOpenCardId((prev) => (prev === id ? null : id))
                      }
                      style={
                        thumbnailUrl
                          ? { backgroundImage: `url(${thumbnailUrl})` }
                          : undefined
                      }
                    >
                      {selectionMode ? (
                        <div
                          className={`card-select-overlay ${
                            isChecked ? "checked" : ""
                          }`}
                        >
                          <div className="card-select-icon">
                            <Icon path="M9.2 16.2 5.5 12.5a1 1 0 0 1 1.4-1.4l2.6 2.6 6.6-6.6a1 1 0 1 1 1.4 1.4l-7.3 7.3a1 1 0 0 1-1.4 0z" />
                          </div>
                        </div>
                      ) : (
                        <div
                          className={`card-overlay ${
                            openCardId === id ? "active" : ""
                          }`}
                        >
                          <div className="card-overlay-center">
                            <button
                              className="card-action"
                              onClick={(event) => {
                                event.stopPropagation();
                                openFile(item);
                              }}
                              aria-label={getPrimaryActionLabel(item)}
                            >
                              <Icon path={getPrimaryActionIcon(item)} />
                            </button>
                            <button
                              className="card-action danger"
                              onClick={(event) => {
                                event.stopPropagation();
                                handleDelete(id);
                              }}
                              aria-label="Delete"
                            >
                              <Icon path="M9 3a1 1 0 0 0-1 1v1H5a1 1 0 1 0 0 2h1l1.1 12.1A2 2 0 0 0 9.09 21h5.82a2 2 0 0 0 1.99-1.9L18 7h1a1 1 0 1 0 0-2h-3V4a1 1 0 0 0-1-1H9zm1 2h4v1h-4V5zm1 6a1 1 0 0 1 2 0v6a1 1 0 1 1-2 0v-6zm-3 0a1 1 0 0 1 2 0v6a1 1 0 1 1-2 0v-6zm7 0a1 1 0 0 1 2 0v6a1 1 0 1 1-2 0v-6z" />
                            </button>
                          </div>
                        </div>
                      )}
                      <div className="file-card-content">
                        <div className={`file-icon ${fileCategory}`}>
                          {name.slice(0, 1).toUpperCase()}
                        </div>
                        <div className="file-name" title={name}>
                          {shortName}
                        </div>
                        <div className="file-meta">
                          {getCategoryLabel(fileCategory)} ·{" "}
                          {formatBytes(size)}
                        </div>
                        <div className="file-meta">{formatDate(date)}</div>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={id ?? name}
                    className={`file-row ${selectionMode ? "selecting" : ""}`}
                    onClick={() => {
                      if (!id) return;
                      if (selectionMode) {
                        setSelectedIds((prev) => {
                          const next = new Set(prev);
                          if (next.has(id)) {
                            next.delete(id);
                          } else {
                            next.add(id);
                          }
                          return next;
                        });
                        return;
                      }
                      openFile(item);
                    }}
                  >
                    {selectionMode ? (
                      <label className="item-checkbox">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(id)}
                          onChange={(event) => {
                            event.stopPropagation();
                            setSelectedIds((prev) => {
                              const next = new Set(prev);
                              if (event.target.checked) {
                                next.add(id);
                              } else {
                                next.delete(id);
                              }
                              return next;
                            });
                          }}
                        />
                        <span />
                      </label>
                    ) : null}
                    <div className="file-main">
                      <span
                        className={`file-icon ${fileCategory} ${
                          thumbnailUrl ? "thumb" : ""
                        }`}
                      >
                        {thumbnailUrl ? (
                          <img src={thumbnailUrl} alt="" loading="lazy" />
                        ) : (
                          name.slice(0, 1).toUpperCase()
                        )}
                      </span>
                    <div className="file-text">
                      <div className="file-name" title={name}>
                        {shortName}
                      </div>
                      <div className="file-meta">
                        {getCategoryLabel(fileCategory)} ·{" "}
                        {formatBytes(size)}
                      </div>
                    </div>
                    </div>
                    <div className="file-actions col-actions">
                      <span className="file-date">{formatDate(date)}</span>
                      <div className="menu">
                        <button
                          className="menu-trigger"
                          onClick={(event) => {
                            event.stopPropagation();
                            setOpenMenuId((prev) =>
                              prev === id ? null : id
                            );
                          }}
                        >
                          ⋯
                        </button>
                        {openMenuId === id ? (
                          <div className="menu-dropdown">
                            <button
                              className="menu-item"
                              onClick={(event) => {
                                event.stopPropagation();
                                openFile(item);
                                setOpenMenuId(null);
                              }}
                            >
                              <Icon path={getPrimaryActionIcon(item)} />
                              {getPrimaryActionLabel(item)}
                            </button>
                            <button
                              className="menu-item danger"
                              onClick={(event) => {
                                event.stopPropagation();
                                handleDelete(id);
                                setOpenMenuId(null);
                              }}
                            >
                              <Icon path="M9 3a1 1 0 0 0-1 1v1H5a1 1 0 1 0 0 2h1l1.1 12.1A2 2 0 0 0 9.09 21h5.82a2 2 0 0 0 1.99-1.9L18 7h1a1 1 0 1 0 0-2h-3V4a1 1 0 0 0-1-1H9z" />
                              Delete
                            </button>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            {loading && files.length > 0 ? (
              <div className="empty-state">Loading more...</div>
            ) : null}
          </div>
        </div>
      </section>

      {preview ? (
        <div className="modal-backdrop" onClick={() => setPreview(null)}>
          <div
            className="modal media-modal"
            role="dialog"
            aria-modal="true"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-title">
              {truncateMiddle(preview.name || "File", 18, 3)}
            </div>
            <div className="media-frame">
              {previewLoading ? (
                <div className="media-loader">Loading...</div>
              ) : null}
              {preview.kind === "image" ? (
                <img
                  src={preview.url}
                  alt={preview.name}
                  onLoad={() => setPreviewLoading(false)}
                  onError={() => {
                    setPreviewError("Unable to load image.");
                    setPreviewLoading(false);
                  }}
                />
              ) : preview.kind === "video" ? (
                <video
                  src={preview.url}
                  controls
                  onLoadedData={() => setPreviewLoading(false)}
                  onError={() => {
                    setPreviewError("Unable to load video.");
                    setPreviewLoading(false);
                  }}
                />
              ) : preview.kind === "audio" ? (
                <audio
                  src={preview.url}
                  controls
                  onLoadedData={() => setPreviewLoading(false)}
                  onError={() => {
                    setPreviewError("Unable to load audio.");
                    setPreviewLoading(false);
                  }}
                />
              ) : preview.kind === "text" ? (
                <div className="text-preview">
                  {previewLoading ? (
                    <div className="text-preview-status">Loading...</div>
                  ) : previewError ? (
                    <div className="text-preview-status error">
                      {previewError}
                    </div>
                  ) : (
                    <pre>{previewContent || "No content."}</pre>
                  )}
                </div>
              ) : null}
            </div>
            <div className="modal-actions">
              <button className="ghost-button" onClick={() => setPreview(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {showUploadHelp ? (
        <div className="modal-backdrop" onClick={() => setShowUploadHelp(false)}>
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-title">How to upload files</div>
            <p className="modal-body">
              Upload files by forwarding to the bot or sending files directly in
              the chat. The files will appear here automatically.
            </p>
            <div className="modal-actions">
              <button
                className="ghost-button"
                onClick={() => setShowUploadHelp(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}

    </div>
  );
}
