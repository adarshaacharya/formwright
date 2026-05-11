import { FormRuntimeProvider, FormRuntimeRoot } from "@formwright/react-rhf";
import { demoRuntime } from "./demo/runtime";

export function App(): React.JSX.Element {
  return (
    <FormRuntimeProvider runtime={demoRuntime}>
      <div style={{ maxWidth: 520, margin: "40px auto", display: "grid", gap: 20 }}>
        <h1>Formwright Playground</h1>
        <p>Change account type to see rule-based show/hide behavior.</p>
        <FormRuntimeRoot rootLayoutId="root-stack" />
      </div>
    </FormRuntimeProvider>
  );
}
