'use client';

import { createContext, useCallback, useRef, useContext, ReactNode } from 'react';

type LeaveCheckFn = () => Promise<boolean>;

type ContextValue = {
  setLeaveCheck: (fn: LeaveCheckFn | null) => void;
  runLeaveCheck: () => Promise<boolean>;
};

const CourseEditContext = createContext<ContextValue | null>(null);

export function CourseEditProvider({ children }: { children: ReactNode }) {
  const leaveCheckRef = useRef<LeaveCheckFn | null>(null);

  const setLeaveCheck = useCallback((fn: LeaveCheckFn | null) => {
    leaveCheckRef.current = fn;
  }, []);

  const runLeaveCheck = useCallback(async (): Promise<boolean> => {
    const fn = leaveCheckRef.current;
    if (!fn) return true;
    return fn();
  }, []);

  return (
    <CourseEditContext.Provider value={{ setLeaveCheck, runLeaveCheck }}>
      {children}
    </CourseEditContext.Provider>
  );
}

export function useCourseEditLeaveCheck() {
  const ctx = useContext(CourseEditContext);
  return ctx;
}
