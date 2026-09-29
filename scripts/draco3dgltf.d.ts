// draco3dgltf ships no types. glTF-Transform takes the modules as opaque dependencies.
declare module "draco3dgltf" {
  const draco3d: {
    createDecoderModule(): Promise<unknown>;
    createEncoderModule(): Promise<unknown>;
  };
  export default draco3d;
}
