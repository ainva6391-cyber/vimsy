import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export interface Post {
  id: string;
  imageUri: string;
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
  coverUri: string;
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
  toggleSave: (postId: string, boardId?: string) => void;
  addPost: (post: Omit<Post, "id" | "saves" | "savedByMe" | "createdAt" | "boardIds">) => void;
  createBoard: (name: string, firstPostId?: string) => void;
  addToBoard: (postId: string, boardId: string) => void;
  removeFromBoard: (postId: string, boardId: string) => void;
  getPostById: (id: string) => Post | undefined;
  getFilteredPosts: (style?: string, query?: string) => Post[];
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [posts, setPosts] = useState<Post[]>(SAMPLE_POSTS);
  const [boards, setBoards] = useState<Board[]>([]);
  const [currentUser] = useState<UserProfile>(CURRENT_USER);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const savedPostsRaw = await AsyncStorage.getItem("posts");
      const savedBoardsRaw = await AsyncStorage.getItem("boards");
      if (savedPostsRaw) {
        const saved = JSON.parse(savedPostsRaw) as Post[];
        setPosts([...SAMPLE_POSTS, ...saved]);
      }
      if (savedBoardsRaw) {
        setBoards(JSON.parse(savedBoardsRaw));
      }
    } catch {}
  }

  const toggleSave = useCallback((postId: string, boardId?: string) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;
        const nowSaved = !p.savedByMe;
        return {
          ...p,
          savedByMe: nowSaved,
          saves: nowSaved ? p.saves + 1 : p.saves - 1,
          boardIds: boardId
            ? nowSaved
              ? [...p.boardIds, boardId]
              : p.boardIds.filter((b) => b !== boardId)
            : p.boardIds,
        };
      })
    );
  }, []);

  const addPost = useCallback(
    (post: Omit<Post, "id" | "saves" | "savedByMe" | "createdAt" | "boardIds">) => {
      const newPost: Post = {
        ...post,
        id: `p_${Date.now()}`,
        saves: 0,
        savedByMe: false,
        createdAt: new Date().toISOString(),
        boardIds: [],
      };
      setPosts((prev) => {
        const updated = [newPost, ...prev];
        AsyncStorage.setItem(
          "posts",
          JSON.stringify(updated.filter((p) => !SAMPLE_POSTS.some((s) => s.id === p.id)))
        );
        return updated;
      });
    },
    []
  );

  const createBoard = useCallback((name: string, firstPostId?: string) => {
    const boardId = `b_${Date.now()}`;
    const newBoard: Board = {
      id: boardId,
      name,
      coverUri: firstPostId
        ? posts.find((p) => p.id === firstPostId)?.imageUri ?? ""
        : "",
      postCount: firstPostId ? 1 : 0,
      postIds: firstPostId ? [firstPostId] : [],
      createdAt: new Date().toISOString(),
    };
    setBoards((prev) => {
      const updated = [...prev, newBoard];
      AsyncStorage.setItem("boards", JSON.stringify(updated));
      return updated;
    });
    if (firstPostId) {
      setPosts((prev) =>
        prev.map((p) =>
          p.id === firstPostId
            ? { ...p, boardIds: [...p.boardIds, boardId], savedByMe: true, saves: p.saves + 1 }
            : p
        )
      );
    }
  }, [posts]);

  const addToBoard = useCallback((postId: string, boardId: string) => {
    setBoards((prev) => {
      const updated = prev.map((b) => {
        if (b.id !== boardId) return b;
        if (b.postIds.includes(postId)) return b;
        const post = posts.find((p) => p.id === postId);
        return {
          ...b,
          postIds: [...b.postIds, postId],
          postCount: b.postCount + 1,
          coverUri: b.coverUri || post?.imageUri || b.coverUri,
        };
      });
      AsyncStorage.setItem("boards", JSON.stringify(updated));
      return updated;
    });
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId && !p.boardIds.includes(boardId)
          ? { ...p, boardIds: [...p.boardIds, boardId], savedByMe: true, saves: p.saves + 1 }
          : p
      )
    );
  }, [posts]);

  const removeFromBoard = useCallback((postId: string, boardId: string) => {
    setBoards((prev) => {
      const updated = prev.map((b) => {
        if (b.id !== boardId) return b;
        const newIds = b.postIds.filter((id) => id !== postId);
        return { ...b, postIds: newIds, postCount: newIds.length };
      });
      AsyncStorage.setItem("boards", JSON.stringify(updated));
      return updated;
    });
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;
        const newBoards = p.boardIds.filter((b) => b !== boardId);
        return { ...p, boardIds: newBoards, savedByMe: newBoards.length > 0 || p.savedByMe };
      })
    );
  }, []);

  const getPostById = useCallback(
    (id: string) => posts.find((p) => p.id === id),
    [posts]
  );

  const getFilteredPosts = useCallback(
    (style?: string, query?: string) => {
      return posts.filter((p) => {
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
        getPostById,
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
