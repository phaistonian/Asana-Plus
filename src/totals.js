const REG = /^\[(\d+?\w{1}?)\]/;

const getRowValue = row => {
  const content = row.querySelector('textarea').value;

  if (content.match(REG)) {
    const value = parseInt(RegExp.lastParen);
    return value;
  }

  return 0;
};

const getTotalFromRows = rows => rows.reduce((acc, row) => acc + getRowValue(row), 0) || '';

const updateTotals = rows => {
  const header = document.querySelector('.details-pane-title .header-name.read-only');

  if (!header) {
    return;
  }

  const total = getTotalFromRows(rows);

  header.dataset.total = total;
};

const checkForMultipleSelectedTasks = () => {
  const selectedRows = [...document.querySelectorAll('#grid tr.grid-row-selected')];

  if (selectedRows.length > 1) {
    updateTotals(selectedRows);
  }
};

const init = () => {
  document.addEventListener('mouseup', checkForMultipleSelectedTasks);
};

export default init;
