declare module "libsodium-wrappers-sumo" {
  const sodium: {
    ready: Promise<void>;
    [key: string]: unknown;
  };
  export default sodium;
}
