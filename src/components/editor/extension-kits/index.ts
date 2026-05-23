// Legacy extension kits (deprecated - use SharedExtensionKit instead)
export { BaseExtensionKit } from "./base";
export { BasicEditorKit } from "./basic";
export { ReadOnlyExtensionKit } from "./read-only";
export { FullEditorKit } from "./full";

// New unified extension kits
export {
  SharedExtensionKit,
  EditorExtensionKit,
  ViewerExtensionKit,
  EDITOR_STYLES,
  type ExtensionConfig,
} from "./shared";
