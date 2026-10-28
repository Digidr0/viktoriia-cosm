// Reorder the full category, not just the current pagination window.
export function moveService(rows, categoryId, activeId, overId) {
  const category = rows.filter((row) => String(row.category_id) === String(categoryId));
  const from = category.findIndex((row) => row.id === activeId);
  const to = category.findIndex((row) => row.id === overId);
  if (from < 0 || to < 0 || from === to) return null;
  const [moved] = category.splice(from, 1);
  category.splice(to, 0, moved);
  const ordered = category.map((row, index) => ({ ...row, sort_order: index }));
  const changes = ordered.filter((row) => rows.find((original) => original.id === row.id).sort_order !== row.sort_order);
  const other = rows.filter((row) => String(row.category_id) !== String(categoryId));
  return { rows: [...other, ...ordered], changes };
}
