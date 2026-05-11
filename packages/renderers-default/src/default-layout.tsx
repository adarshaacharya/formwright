import type { RenderLayoutProps } from "@formwright/react-rhf";

export function DefaultLayout({ children }: RenderLayoutProps): React.JSX.Element {
  return <div style={{ display: "grid", gap: 16 }}>{children}</div>;
}

export function DefaultLayoutRenderer(props: RenderLayoutProps): React.JSX.Element {
  return <DefaultLayout {...props} />;
}
