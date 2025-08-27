import { create } from 'zustand'

interface RouterStoreState {
  previousPath: string | null
  currentPath: string | null
  setPath: (path: string) => void
}

export const useRouterStore = create<RouterStoreState>()((set) => ({
  previousPath: null,
  currentPath: null,
  setPath: (path: string) =>
    set((state) => ({
      previousPath: state.currentPath,
      currentPath: path,
    })),
}))


