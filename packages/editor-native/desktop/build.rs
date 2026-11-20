fn main() {
    rn_gpui_module_build::generate(&["../src/NotesnookEditorNativeComponent.ts"]);
    println!("cargo:rerun-if-changed=build.rs");
}
