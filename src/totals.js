const REG = /^\[(\d+?\w{0,1})\]/;

const getRowValue = row => {
  const content = row.querySelector('textarea').value;

  console.log(content);

  if (content.match(REG)) {
    const value = parseInt(RegExp.lastParen).trim();
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

  if (total) {
    header.dataset.total = `[${total}] `;
  } else {
    Reflect.deleteProperty(header.dataset, 'total');
  }
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
