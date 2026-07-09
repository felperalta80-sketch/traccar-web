// Respaldo de búsqueda del lado del cliente: filtra los items por keyword sobre
// sus campos de texto. Sirve cuando el servidor no filtra por `keyword` en el
// endpoint (devuelve todo). Sin keyword devuelve la lista sin cambios.
const searchItems = (items, keyword) => {
  if (!keyword) {
    return items;
  }
  const query = keyword.toLowerCase();
  return items.filter((item) =>
    Object.values(item).some(
      (value) => typeof value === 'string' && value.toLowerCase().includes(query),
    ),
  );
};

export default searchItems;
