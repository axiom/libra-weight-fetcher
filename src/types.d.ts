declare module "*.json" {
  const value: import("./shared").WeightEntry[];
  export default value;
}
