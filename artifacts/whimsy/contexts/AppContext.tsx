import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

// imageUri/coverUri: supports both URI strings and require() module references
export interface Post {
  id: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  imageUri: any;
  caption: string;
  tags: string[];
  style: string;
  userId: string;
  username: string;
  userAvatar: string;
  saves: number;
  savedByMe: boolean;
  createdAt: string;
  boardIds: string[];
  width: number;
  height: number;
  aspectRatio: number;
}

export interface Board {
  id: string;
  name: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  coverUri: any;
  postCount: number;
  postIds: string[];
  createdAt: string;
}

export interface UserProfile {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  bio: string;
  followers: number;
  following: number;
  postCount: number;
}

const STYLE_CATEGORIES = [
  "Minimal",
  "Streetwear",
  "Cottagecore",
  "Boho",
  "Y2K",
  "Dark Academia",
  "Old Money",
  "Sporty",
  "Romantic",
  "Grunge",
  "Business Casual",
  "Coastal",
];

const IMG1 = require("../assets/images/outfit_placeholder_1.png");
const IMG2 = require("../assets/images/outfit_placeholder_2.png");
const IMG3 = require("../assets/images/outfit_placeholder_3.png");

const SAMPLE_POST_IDS = new Set(["p1", "p2", "p3", "p4", "p5", "p6"]);

const SAMPLE_POSTS: Post[] = [
  {
    id: "p1",
    imageUri: IMG1,
    caption: "Effortless minimalism. Cream silk blouse and camel trousers.",
    tags: ["minimal", "neutral tones", "silk", "office look"],
    style: "Minimal",
    userId: "u1",
    username: "lunaestyle",
    userAvatar: "https://i.pravatar.cc/150?img=47",
    saves: 234,
    savedByMe: false,
    createdAt: "2026-04-20T10:00:00Z",
    boardIds: [],
    width: 3,
    height: 4,
    aspectRatio: 3 / 4,
  },
  {
    id: "p2",
    imageUri: IMG2,
    caption: "Golden hour boho vibes. Summer is calling.",
    tags: ["boho", "summer", "linen", "maxi skirt"],
    style: "Boho",
    userId: "u2",
    username: "maisondoree",
    userAvatar: "https://i.pravatar.cc/150?img=12",
    saves: 892,
    savedByMe: false,
    createdAt: "2026-04-21T14:30:00Z",
    boardIds: [],
    width: 3,
    height: 4,
    aspectRatio: 3 / 4,
  },
  {
    id: "p3",
    imageUri: IMG3,
    caption: "Autumn cozy era. Nothing beats an oversized knit.",
    tags: ["autumn", "cozy", "knitwear", "casual"],
    style: "Minimal",
    userId: "u3",
    username: "wren.wears",
    userAvatar: "https://i.pravatar.cc/150?img=32",
    saves: 1456,
    savedByMe: true,
    createdAt: "2026-04-19T08:00:00Z",
    boardIds: [],
    width: 3,
    height: 4,
    aspectRatio: 3 / 4,
  },
  {
    id: "p4",
    imageUri: IMG1,
    caption: "Classic neutrals never go out of style.",
    tags: ["classic", "neutrals", "timeless"],
    style: "Old Money",
    userId: "u4",
    username: "sofie.mode",
    userAvatar: "https://i.pravatar.cc/150?img=25",
    saves: 611,
    savedByMe: false,
    createdAt: "2026-04-18T11:00:00Z",
    boardIds: [],
    width: 3,
    height: 4,
    aspectRatio: 3 / 4,
  },
  {
    id: "p5",
    imageUri: IMG2,
    caption: "The perfect summer Saturday look.",
    tags: ["summer", "casual", "light"],
    style: "Cottagecore",
    userId: "u5",
    username: "floraledit",
    userAvatar: "https://i.pravatar.cc/150?img=9",
    saves: 327,
    savedByMe: false,
    createdAt: "2026-04-17T09:15:00Z",
    boardIds: [],
    width: 3,
    height: 4,
    aspectRatio: 3 / 4,
  },
  {
    id: "p6",
    imageUri: IMG3,
    caption: "Sweater weather forever. This is my uniform.",
    tags: ["sweater", "autumn", "cozy", "knit"],
    style: "Minimal",
    userId: "u1",
    username: "lunaestyle",
    userAvatar: "https://i.pravatar.cc/150?img=47",
    saves: 788,
    savedByMe: true,
    createdAt: "2026-04-16T16:00:00Z",
    boardIds: [],
    width: 3,
    height: 4,
    aspectRatio: 3 / 4,
  },
];

const CURRENT_USER: UserProfile = {
  id: "me",
  username: "whimsy.user",
  displayName: "Your Style",
  avatar: "https://i.pravatar.cc/150?img=55",
  bio: "Fashion lover. Collecting looks I adore.",
  followers: 214,
  following: 87,
  postCount: 0,
};

interface AppContextType {
  posts: Post[];
  boards: Board[];
  currentUser: UserProfile;
  styleCategories: string[];
  savedPosts: Post[];
  myPosts: Post[];
  toggleSave: (postId: string) => void;
  addPost: (post: Omit<Post, "id" | "saves" | "savedByMe" | "createdAt" | "boardIds">) => void;
  createBoard: (name: string, firstPostId?: string) => string;
  addToBoard: (postId: string, boardId: string) => void;
  removeFromBoard: (postId: string, boardId: string) => void;
  deleteBoard: (boardId: string) => void;
  getPostById: (id: string) => Post | undefined;
  getBoardById: (id: string) => Board | undefined;
  getBoardPosts: (boardId: string) => Post[];
  getFilteredPosts: (style?: string, query?: string) => Post[];
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [posts, setPosts] = useState<Post[]>(SAMPLE_POSTS);
  const [boards, setBoards] = useState<Board[]>([]);
  const [currentUser] = useState<UserProfile>(CURRENT_USER);

  // Keep a ref so callbacks always have the latest posts without stale closures
  const postsRef = useRef<Post[]>(SAMPLE_POSTS);
  useEffect(() => {
    postsRef.current = posts;
  }, [posts]);

  const boardsRef = useRef<Board[]>([]);
  useEffect(() => {
    boardsRef.current = boards;
  }, [boards]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [savedPostsRaw, savedBoardsRaw] = await Promise.all([
        AsyncStorage.getItem("userPosts"),
        AsyncStorage.getItem("boards"),
      ]);
      if (savedPostsRaw) {
        const userPosts = JSON.parse(savedPostsRaw) as Post[];
        setPosts([...SAMPLE_POSTS, ...userPosts]);
      }
      if (savedBoardsRaw) {
        setBoards(JSON.parse(savedBoardsRaw));
      }
    } catch {}
  }

  const persistBoards = useCallback((updated: Board[]) => {
    AsyncStorage.setItem("boards", JSON.stringify(updated)).catch(() => {});
  }, []);

  const persistUserPosts = useCallback((allPosts: Post[]) => {
    const userOnly = allPosts.filter((p) => !SAMPLE_POST_IDS.has(p.id));
    AsyncStorage.setItem("userPosts", JSON.stringify(userOnly)).catch(() => {});
  }, []);

  const toggleSave = useCallback((postId: string) => {
    setPosts((prev) => {
      const updated = prev.map((p) => {
        if (p.id !== postId) return p;
        const nowSaved = !p.savedByMe;
        return {
          ...p,
          savedByMe: nowSaved,
          saves: nowSaved ? p.saves + 1 : Math.max(0, p.saves - 1),
        };
      });
      persistUserPosts(updated);
      return updated;
    });
  }, [persistUserPosts]);

  const addPost = useCallback(
    (post: Omit<Post, "id" | "saves" | "savedByMe" | "createdAt" | "boardIds">) => {
      const newPost: Post = {
        ...post,
        id: `p_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        saves: 0,
        savedByMe: false,
        createdAt: new Date().toISOString(),
        boardIds: [],
      };
      setPosts((prev) => {
        const updated = [newPost, ...prev];
        persistUserPosts(updated);
        return updated;
      });
    },
    [persistUserPosts]
  );

  // Returns the new boardId so callers can navigate to it
  const createBoard = useCallback((name: string, firstPostId?: string): string => {
    const boardId = `b_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    // Resolve cover from current posts ref (avoids stale closure)
    const coverPost = firstPostId ? postsRef.current.find((p) => p.id === firstPostId) : null;
    const newBoard: Board = {
      id: boardId,
      name: name.trim(),
      coverUri: coverPost?.imageUri ?? null,
      postCount: firstPostId ? 1 : 0,
      postIds: firstPostId ? [firstPostId] : [],
      createdAt: new Date().toISOString(),
    };
    setBoards((prev) => {
      const updated = [...prev, newBoard];
      persistBoards(updated);
      return updated;
    });
    if (firstPostId) {
      setPosts((prev) => {
        const updated = prev.map((p) =>
          p.id === firstPostId && !p.boardIds.includes(boardId)
            ? { ...p, boardIds: [...p.boardIds, boardId], savedByMe: true, saves: p.saves + 1 }
            : p
        );
        persistUserPosts(updated);
        return updated;
      });
    }
    return boardId;
  }, [persistBoards, persistUserPosts]);

  const addToBoard = useCallback((postId: string, boardId: string) => {
    setBoards((prev) => {
      const board = prev.find((b) => b.id === boardId);
      if (!board || board.postIds.includes(postId)) return prev;
      const coverPost = postsRef.current.find((p) => p.id === postId);
      const updated = prev.map((b) =>
        b.id === boardId
          ? {
              ...b,
              postIds: [...b.postIds, postId],
              postCount: b.postCount + 1,
              coverUri: b.coverUri ?? coverPost?.imageUri ?? null,
            }
          : b
      );
      persistBoards(updated);
      return updated;
    });
    setPosts((prev) => {
      const post = prev.find((p) => p.id === postId);
      if (!post || post.boardIds.includes(boardId)) return prev;
      const updated = prev.map((p) =>
        p.id === postId
          ? { ...p, boardIds: [...p.boardIds, boardId], savedByMe: true, saves: p.saves + 1 }
          : p
      );
      persistUserPosts(updated);
      return updated;
    });
  }, [persistBoards, persistUserPosts]);

  const removeFromBoard = useCallback((postId: string, boardId: string) => {
    setBoards((prev) => {
      const board = prev.find((b) => b.id === boardId);
      if (!board) return prev;
      const newPostIds = board.postIds.filter((id) => id !== postId);
      // Update cover to next available post if this was the cover
      const newCover =
        board.coverUri === postsRef.current.find((p) => p.id === postId)?.imageUri
          ? (postsRef.current.find((p) => newPostIds.includes(p.id))?.imageUri ?? null)
          : board.coverUri;
      const updated = prev.map((b) =>
        b.id === boardId
          ? { ...b, postIds: newPostIds, postCount: newPostIds.length, coverUri: newCover }
          : b
      );
      persistBoards(updated);
      return updated;
    });
    setPosts((prev) => {
      const updated = prev.map((p) => {
        if (p.id !== postId) return p;
        const newBoardIds = p.boardIds.filter((b) => b !== boardId);
        // Only mark unsaved if removed from all boards AND it was only board-saved
        const isStillSaved = newBoardIds.length > 0 || p.savedByMe;
        return { ...p, boardIds: newBoardIds, savedByMe: isStillSaved };
      });
      persistUserPosts(updated);
      return updated;
    });
  }, [persistBoards, persistUserPosts]);

  const deleteBoard = useCallback((boardId: string) => {
    const board = boardsRef.current.find((b) => b.id === boardId);
    if (!board) return;
    // Remove boardId from all posts in the board
    if (board.postIds.length > 0) {
      setPosts((prev) => {
        const updated = prev.map((p) =>
          board.postIds.includes(p.id)
            ? { ...p, boardIds: p.boardIds.filter((b) => b !== boardId) }
            : p
        );
        persistUserPosts(updated);
        return updated;
      });
    }
    setBoards((prev) => {
      const updated = prev.filter((b) => b.id !== boardId);
      persistBoards(updated);
      return updated;
    });
  }, [persistBoards, persistUserPosts]);

  const getPostById = useCallback(
    (id: string) => postsRef.current.find((p) => p.id === id),
    []
  );

  const getBoardById = useCallback(
    (id: string) => boardsRef.current.find((b) => b.id === id),
    []
  );

  const getBoardPosts = useCallback((boardId: string): Post[] => {
    const board = boardsRef.current.find((b) => b.id === boardId);
    if (!board) return [];
    return postsRef.current.filter((p) => board.postIds.includes(p.id));
  }, []);

  const getFilteredPosts = useCallback(
    (style?: string, query?: string): Post[] => {
      return postsRef.current.filter((p) => {
        if (style && p.style !== style) return false;
        if (query) {
          const q = query.toLowerCase();
          return (
            p.caption.toLowerCase().includes(q) ||
            p.tags.some((t) => t.toLowerCase().includes(q)) ||
            p.username.toLowerCase().includes(q) ||
            p.style.toLowerCase().includes(q)
          );
        }
        return true;
      });
    },
    // Re-memoize when posts actually change
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [posts]
  );

  const savedPosts = posts.filter((p) => p.savedByMe);
  const myPosts = posts.filter((p) => p.userId === currentUser.id);

  return (
    <AppContext.Provider
      value={{
        posts,
        boards,
        currentUser,
        styleCategories: STYLE_CATEGORIES,
        savedPosts,
        myPosts,
        toggleSave,
        addPost,
        createBoard,
        addToBoard,
        removeFromBoard,
        deleteBoard,
        getPostById,
        getBoardById,
        getBoardPosts,
        getFilteredPosts,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}
