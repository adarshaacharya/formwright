import type { RenderLayoutProps } from "../../types/public-types";

export function DefaultLayout({ children }: RenderLayoutProps): React.JSX.Element {
  return <div style={{ display: "grid", gap: 16 }}>{children}</div>;
}

export function DefaultLayoutRenderer(props: RenderLayoutProps): React.JSX.Element {
  return <DefaultLayout {...props} />;
}
