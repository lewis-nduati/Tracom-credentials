"use client";

import React, { createContext, useContext, useState, useCallback } from "react";

type CreateMode = "course" | "project" | null;

interface StudioContextValue {
  createMode: CreateMode;
  setCreateMode: (mode: CreateMode) => void;
  showCreateCourse: () => void;
  showCreateProject: () => void;
  cancelCreate: () => void;
}

const StudioContext = createContext<StudioContextValue | null>(null);

export function StudioProvider({ children }: { children: React.ReactNode }) {
  const [createMode, setCreateMode] = useState<CreateMode>(null);

  const showCreateCourse = useCallback(() => setCreateMode("course"), []);
  const showCreateProject = useCallback(() => setCreateMode("project"), []);
  const cancelCreate = useCallback(() => setCreateMode(null), []);

  return (
    <StudioContext.Provider
      value={{
        createMode,
        setCreateMode,
        showCreateCourse,
        showCreateProject,
        cancelCreate,
      }}
    >
      {children}
    </StudioContext.Provider>
  );
}

export function useStudioContext() {
  const context = useContext(StudioContext);
  if (!context) {
    throw new Error("useStudioContext must be used within StudioProvider");
  }
  return context;
}
