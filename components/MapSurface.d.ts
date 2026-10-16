import type { Coordinate } from '@/lib/types';

export declare function MapSurface(props: {
  location: Coordinate | null;
  route: Coordinate[];
  detail?: boolean;
}): React.JSX.Element;
