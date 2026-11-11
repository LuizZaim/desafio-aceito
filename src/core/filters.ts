export type Filters = {
  category: string;
  level: string;
  radius: number;
  region: string;
};
export let filters: Filters = {
  category: "Todas",
  level: "Todos",
  radius: 25,
  region: "",
};
export function setFilters(next: Filters) {
  filters = next;
}
