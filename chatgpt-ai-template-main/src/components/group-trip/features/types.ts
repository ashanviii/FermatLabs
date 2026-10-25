// Props every feature panel receives from the planner.
export type FeatureProps = {
  trip: any; // the viewer's projection; feature data lives under trip.features[<module name>]
  uid: string;
  owner: boolean;
  disabled: boolean;
  command: (command: any) => Promise<boolean>; // sends { action: 'command', tripId, command } and refreshes trip
};
