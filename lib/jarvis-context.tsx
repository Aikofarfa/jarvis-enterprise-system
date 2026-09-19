import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { isBriefReady, normalizeBrief } from "@/lib/jarvis-validation";

export type RunStatus = "EN ESPERA" | "BORRADOR";

export type JarvisRun = {
  id: string;
  brief: string;
  status: RunStatus;
  createdAt: string;
  note: string;
};

export type JarvisApproval = {
  id: string;
  title: string;
  reason: string;
  createdAt: string;
};

type Workspace = {
  runs: JarvisRun[];
  approvals: JarvisApproval[];
};

type JarvisContextValue = {
  workspace: Workspace;
  isHydrated: boolean;
  addBrief: (brief: string) => void;
  removeRun: (id: string) => void;
  clearLocalData: () => void;
};

const STORAGE_KEY = "@jarvis-mobile/workspace-v1";
const EMPTY_WORKSPACE: Workspace = { runs: [], approvals: [] };

const JarvisContext = createContext<JarvisContextValue | null>(null);

function isWorkspace(value: unknown): value is Workspace {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<Workspace>;
  return Array.isArray(candidate.runs) && Array.isArray(candidate.approvals);
}

export function JarvisProvider({ children }: { children: ReactNode }) {
  const [workspace, setWorkspace] = useState<Workspace>(EMPTY_WORKSPACE);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    let active = true;

    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (!active) return;
        if (!raw) {
          setIsHydrated(true);
          return;
        }

        try {
          const parsed: unknown = JSON.parse(raw);
          if (isWorkspace(parsed)) setWorkspace(parsed);
        } catch {
          // Ignore a corrupted local cache and keep the empty workspace.
        }
        setIsHydrated(true);
      })
      .catch(() => {
        if (active) setIsHydrated(true);
      });

    return () => {
      active = false;
    };
  }, []);

  const persist = useCallback((next: Workspace) => {
    void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const updateWorkspace = useCallback(
    (updater: (current: Workspace) => Workspace) => {
      setWorkspace((current) => {
        const next = updater(current);
        persist(next);
        return next;
      });
    },
    [persist],
  );

  const addBrief = useCallback(
    (brief: string) => {
      const normalized = normalizeBrief(brief);
      if (!isBriefReady(normalized)) return;

      const run: JarvisRun = {
        id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
        brief: normalized,
        status: "EN ESPERA",
        createdAt: new Date().toISOString(),
        note: "Guardado localmente. Requiere un backend configurado para analizar costos y margen.",
      };

      updateWorkspace((current) => ({
        ...current,
        runs: [run, ...current.runs],
      }));
    },
    [updateWorkspace],
  );

  const removeRun = useCallback(
    (id: string) => {
      updateWorkspace((current) => ({
        ...current,
        runs: current.runs.filter((run) => run.id !== id),
      }));
    },
    [updateWorkspace],
  );

  const clearLocalData = useCallback(() => {
    setWorkspace(EMPTY_WORKSPACE);
    void AsyncStorage.removeItem(STORAGE_KEY);
  }, []);

  const value = useMemo(
    () => ({ workspace, isHydrated, addBrief, removeRun, clearLocalData }),
    [workspace, isHydrated, addBrief, removeRun, clearLocalData],
  );

  return <JarvisContext.Provider value={value}>{children}</JarvisContext.Provider>;
}

export function useJarvis() {
  const value = useContext(JarvisContext);
  if (!value) throw new Error("useJarvis debe usarse dentro de JarvisProvider");
  return value;
}
