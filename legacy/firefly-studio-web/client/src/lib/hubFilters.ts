export type HubAction = {
  id: string;
  mode: string;
  availability: "active" | "planned";
};

export type DiscoverFilter = "all" | "active" | "planned" | "image" | "audio" | "video";

export function categoryForAction(mode: string) {
  if (mode === "audio" || mode === "voice" || mode === "music") return "audio";
  if (mode === "video") return "video";
  return "image";
}

export function filterQuickActions<T extends HubAction>(actions: T[], filter: DiscoverFilter): T[] {
  if (filter === "all") return actions;
  if (filter === "active" || filter === "planned") return actions.filter(action => action.availability === filter);
  return actions.filter(action => categoryForAction(action.mode) === filter);
}
