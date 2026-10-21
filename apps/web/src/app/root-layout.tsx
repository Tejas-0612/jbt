import { Outlet } from 'react-router';

/** Wraps every page. The design's sidebar and top bar arrive in slice 1. */
export function RootLayout() {
  return <Outlet />;
}
