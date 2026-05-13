import type { ArrayComposerProps, ArrayActionsSlotProps, ArrayHeaderSlotProps, ArrayShellSlotProps } from "../types/public-types";

function DefaultArrayShell({ children }: ArrayShellSlotProps): React.JSX.Element {
  return <div style={{ display: "grid", gap: 8 }}>{children}</div>;
}

function DefaultArrayHeader({ label }: ArrayHeaderSlotProps): React.JSX.Element {
  return <label>{label}</label>;
}

function DefaultArrayAction({ defaultAction }: ArrayActionsSlotProps): React.JSX.Element {
  return <>{defaultAction}</>;
}

export function ArrayComposer({
  field,
  state,
  label,
  description,
  children,
  footer,
  slots,
}: ArrayComposerProps): React.JSX.Element {
  const Shell = slots?.Shell ?? DefaultArrayShell;
  const Header = slots?.Header ?? DefaultArrayHeader;
  const Actions = slots?.Actions ?? DefaultArrayAction;

  return (
    <Shell field={field} state={state}>
      <Header field={field} state={state} label={label} />
      {description ? <small style={{ color: "#666" }}>{description}</small> : null}
      {children}
      {footer ? <Actions field={field} state={state} action="add" defaultAction={footer} /> : null}
    </Shell>
  );
}
