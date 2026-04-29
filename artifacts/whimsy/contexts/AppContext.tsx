import AsyncStorage from "@react-native-async-storage/async-storage";
import { type User } from "@supabase/supabase-js";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { supabase } from "@/lib/supabase";

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
  likes: number;
  likedByMe: boolean;
  commentCount: number;
  createdAt: string;
  boardIds: string[];
  width: number;
  height: number;
  aspectRatio: number;
}

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  username: string;
  userAvatar: string;
  content: string;
  createdAt: string;
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

const SAMPLE_POST_IDS = new Set(["p3", "p4"]);

const SAMPLE_POSTS: Post[] = [
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
    savedByMe: false,
    likes: 2871,
    likedByMe: false,
    commentCount: 93,
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
    likes: 987,
    likedByMe: false,
    commentCount: 34,
    createdAt: "2026-04-18T11:00:00Z",
    boardIds: [],
    width: 3,
    height: 4,
    aspectRatio: 3 / 4,
  },
];

function userProfileFromSupabase(authUser: User | null): UserProfile {
  if (!authUser) {
    return { id: "guest", username: "guest", displayName: "Guest", avatar: "", bio: "", followers: 0, following: 0, postCount: 0 };
  }
  const meta = authUser.user_metadata ?? {};
  const email = authUser.email ?? "";
  return {
    id: authUser.id,
    username: (meta.username as string) || email.split("@")[0],
    displayName: (meta.name as string) || (meta.username as string) || email.split("@")[0],
    avatar: (meta.avatar_url as string) || "",
    bio: "",
    followers: 0,
    following: 0,
    postCount: 0,
  };
}

interface AppContextType {
  posts: Post[];
  boards: Board[];
  currentUser: UserProfile;
  styleCategories: string[];
  savedPosts: Post[];
  myPosts: Post[];
  toggleSave: (postId: string) => void;
  toggleLike: (postId: string) => void;
  addPost: (post: Omit<Post, "id" | "saves" | "savedByMe" | "likes" | "likedByMe" | "commentCount" | "createdAt" | "boardIds">) => string;
  removePost: (postId: string) => void;
  addComment: (postId: string, comment: Omit<Comment, "id" | "createdAt">) => void;
  createBoard: (name: string, firstPostId?: string) => string;
  addToBoard: (postId: string, boardId: string) => void;
  removeFromBoard: (postId: string, boardId: string) => void;
  deleteBoard: (boardId: string) => void;
  getPostById: (id: string) => Post | undefined;
  getBoardById: (id: string) => Board | undefined;
  getBoardPosts: (boardId: string) => Post[];
  getFilteredPosts: (style?: string, query?: string) => Post[];
  getComments: (postId: string) => Comment[];
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [posts, setPosts] = useState<Post[]>(SAMPLE_POSTS);
  const [boards, setBoards] = useState<Board[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [authUser, setAuthUser] = useState<User | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthUser(session?.user ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const currentUser = useMemo(() => userProfileFromSupabase(authUser), [authUser]);

  const postsRef = useRef<Post[]>(SAMPLE_POSTS);
  useEffect(() => { postsRef.current = posts; }, [posts]);

  const boardsRef = useRef<Board[]>([]);
  useEffect(() => { boardsRef.current = boards; }, [boards]);

  const commentsRef = useRef<Comment[]>([]);
  useEffect(() => { commentsRef.current = comments; }, [comments]);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const [savedPostsRaw, savedBoardsRaw, savedCommentsRaw] = await Promise.all([
        AsyncStorage.getItem("userPosts"),
        AsyncStorage.getItem("boards"),
        AsyncStorage.getItem("comments"),
      ]);
      const userPosts = savedPostsRaw ? (JSON.parse(savedPostsRaw) as Post[]) : [];
      if (userPosts.length) setPosts([...SAMPLE_POSTS, ...userPosts]);
      if (savedBoardsRaw) setBoards(JSON.parse(savedBoardsRaw));
      if (savedCommentsRaw) setComments(JSON.parse(savedCommentsRaw));
    } catch {}
  }

  const persistBoards = useCallback((updated: Board[]) => {
    AsyncStorage.setItem("boards", JSON.stringify(updated)).catch(() => {});
  }, []);

  const persistUserPosts = useCallback((allPosts: Post[]) => {
    const userOnly = allPosts.filter((p) => !SAMPLE_POST_IDS.has(p.id));
    AsyncStorage.setItem("userPosts", JSON.stringify(userOnly)).catch(() => {});
  }, []);

  const persistComments = useCallback((all: Comment[]) => {
    AsyncStorage.setItem("comments", JSON.stringify(all)).catch(() => {});
  }, []);

  // ── Save / unsave ─────────────────────────────────────────────────────────
  const toggleSave = useCallback((postId: string) => {
    setPosts((prev) => {
      const updated = prev.map((p) => {
        if (p.id !== postId) return p;
        const nowSaved = !p.savedByMe;
        return { ...p, savedByMe: nowSaved, saves: nowSaved ? p.saves + 1 : Math.max(0, p.saves - 1) };
      });
      persistUserPosts(updated);
      return updated;
    });
  }, [persistUserPosts]);

  // ── Like / unlike ─────────────────────────────────────────────────────────
  const toggleLike = useCallback((postId: string) => {
    setPosts((prev) => {
      const updated = prev.map((p) => {
        if (p.id !== postId) return p;
        const nowLiked = !p.likedByMe;
        return { ...p, likedByMe: nowLiked, likes: nowLiked ? p.likes + 1 : Math.max(0, p.likes - 1) };
      });
      persistUserPosts(updated);
      return updated;
    });
  }, [persistUserPosts]);

  // ── Add post ───────────────────────────────────────────────────────────────
  const addPost = useCallback(
    (post: Omit<Post, "id" | "saves" | "savedByMe" | "likes" | "likedByMe" | "commentCount" | "createdAt" | "boardIds">): string => {
      const newId = `p_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      const newPost: Post = {
        ...post,
        id: newId,
        saves: 0,
        savedByMe: false,
        likes: 0,
        likedByMe: false,
        commentCount: 0,
        createdAt: new Date().toISOString(),
        boardIds: [],
      };
      setPosts((prev) => {
        const updated = [newPost, ...prev];
        persistUserPosts(updated);
        return updated;
      });
      return newId;
    },
    [persistUserPosts]
  );

  // ── Remove post ───────────────────────────────────────────────────────────
  const removePost = useCallback(
    (postId: string) => {
      setPosts((prev) => {
        const updated = prev.filter((p) => p.id !== postId);
        persistUserPosts(updated);
        return updated;
      });
    },
    [persistUserPosts],
  );

  // ── Add comment ───────────────────────────────────────────────────────────
  const addComment = useCallback((postId: string, comment: Omit<Comment, "id" | "createdAt">) => {
    const newComment: Comment = {
      ...comment,
      id: `c_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      createdAt: new Date().toISOString(),
    };
    setComments((prev) => {
      const updated = [newComment, ...prev];
      persistComments(updated);
      return updated;
    });
    // Increment comment count on the post
    setPosts((prev) => {
      const updated = prev.map((p) =>
        p.id === postId ? { ...p, commentCount: p.commentCount + 1 } : p
      );
      persistUserPosts(updated);
      return updated;
    });
  }, [persistComments, persistUserPosts]);

  // ── Get comments for a post ───────────────────────────────────────────────
  const getComments = useCallback((postId: string): Comment[] => {
    return commentsRef.current.filter((c) => c.postId === postId);
  }, []);

  // ── Boards ────────────────────────────────────────────────────────────────
  const createBoard = useCallback((name: string, firstPostId?: string): string => {
    const boardId = `b_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const coverPost = firstPostId ? postsRef.current.find((p) => p.id === firstPostId) : null;
    const newBoard: Board = {
      id: boardId,
      name: name.trim(),
      coverUri: coverPost?.imageUri ?? null,
      postCount: firstPostId ? 1 : 0,
      postIds: firstPostId ? [firstPostId] : [],
      createdAt: new Date().toISOString(),
    };
    setBoards((prev) => { const u = [...prev, newBoard]; persistBoards(u); return u; });
    if (firstPostId) {
      setPosts((prev) => {
        const u = prev.map((p) =>
          p.id === firstPostId && !p.boardIds.includes(boardId)
            ? { ...p, boardIds: [...p.boardIds, boardId], savedByMe: true, saves: p.saves + 1 }
            : p
        );
        persistUserPosts(u);
        return u;
      });
    }
    return boardId;
  }, [persistBoards, persistUserPosts]);

  const addToBoard = useCallback((postId: string, boardId: string) => {
    setBoards((prev) => {
      const board = prev.find((b) => b.id === boardId);
      if (!board || board.postIds.includes(postId)) return prev;
      const coverPost = postsRef.current.find((p) => p.id === postId);
      const u = prev.map((b) =>
        b.id === boardId
          ? { ...b, postIds: [...b.postIds, postId], postCount: b.postCount + 1, coverUri: b.coverUri ?? coverPost?.imageUri ?? null }
          : b
      );
      persistBoards(u);
      return u;
    });
    setPosts((prev) => {
      const post = prev.find((p) => p.id === postId);
      if (!post || post.boardIds.includes(boardId)) return prev;
      const u = prev.map((p) =>
        p.id === postId ? { ...p, boardIds: [...p.boardIds, boardId], savedByMe: true, saves: p.saves + 1 } : p
      );
      persistUserPosts(u);
      return u;
    });
  }, [persistBoards, persistUserPosts]);

  const removeFromBoard = useCallback((postId: string, boardId: string) => {
    setBoards((prev) => {
      const board = prev.find((b) => b.id === boardId);
      if (!board) return prev;
      const newPostIds = board.postIds.filter((id) => id !== postId);
      const newCover =
        board.coverUri === postsRef.current.find((p) => p.id === postId)?.imageUri
          ? (postsRef.current.find((p) => newPostIds.includes(p.id))?.imageUri ?? null)
          : board.coverUri;
      const u = prev.map((b) =>
        b.id === boardId ? { ...b, postIds: newPostIds, postCount: newPostIds.length, coverUri: newCover } : b
      );
      persistBoards(u);
      return u;
    });
    setPosts((prev) => {
      const u = prev.map((p) => {
        if (p.id !== postId) return p;
        const newBoardIds = p.boardIds.filter((b) => b !== boardId);
        return { ...p, boardIds: newBoardIds, savedByMe: newBoardIds.length > 0 || p.savedByMe };
      });
      persistUserPosts(u);
      return u;
    });
  }, [persistBoards, persistUserPosts]);

  const deleteBoard = useCallback((boardId: string) => {
    const board = boardsRef.current.find((b) => b.id === boardId);
    if (!board) return;
    if (board.postIds.length > 0) {
      setPosts((prev) => {
        const u = prev.map((p) =>
          board.postIds.includes(p.id) ? { ...p, boardIds: p.boardIds.filter((b) => b !== boardId) } : p
        );
        persistUserPosts(u);
        return u;
      });
    }
    setBoards((prev) => { const u = prev.filter((b) => b.id !== boardId); persistBoards(u); return u; });
  }, [persistBoards, persistUserPosts]);

  const getPostById = useCallback((id: string) => postsRef.current.find((p) => p.id === id), []);
  const getBoardById = useCallback((id: string) => boardsRef.current.find((b) => b.id === id), []);
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
        toggleLike,
        addPost,
        removePost,
        addComment,
        createBoard,
        addToBoard,
        removeFromBoard,
        deleteBoard,
        getPostById,
        getBoardById,
        getBoardPosts,
        getFilteredPosts,
        getComments,
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
