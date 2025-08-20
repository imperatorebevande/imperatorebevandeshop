declare module '*.geojson' {
  import { FeatureCollection } from 'geojson';
  const value: FeatureCollection;
  export default value;
}

declare module '*.json' {
  import { FeatureCollection } from 'geojson';
  const value: FeatureCollection;
  export default value;
}