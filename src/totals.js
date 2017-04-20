const REG = /^\[(\d+?\w{0,1})\]/;

const getRowValue = row => {
  const target = row.querySelector('textarea');
  const content = target.value;

  if (content.match(REG)) {
    const value = parseInt(RegExp.lastParen.trim());
    return value;
  }

  return false;
};

const getTotalFromRows = rows => rows.reduce((acc, row) => acc + getRowValue(row), 0) || '';

const getHeader = () => {
  const headers = [...document.querySelectorAll('.details-pane-title .header-name.read-only, .MultiTaskTitleRow-titleText')];

  if (!headers.length) {
    console.log('Header not found');
  }

  const header = headers[0];

  if (!header) {
    return false;
  }

  return header;
};

const updateTotals = rows => {
  const total = getTotalFromRows(rows);

  setTimeout(() => {
    const header = getHeader();

    if (!header) {
      console.log('header not found');
      return;
    }

    if (total) {
      header.dataset.total = `[${total}] `;
    } else {
      Reflect.deleteProperty(header.dataset, 'total');
    }
  },
  100);
};

const checkForMultipleSelectedTasks = () => {
  const selectedRows = [...document.querySelectorAll('#grid tr.grid-row-selected, .itemRow--highlighted, .TaskRow--focused')];

  if (selectedRows.length > 1) {
    updateTotals(selectedRows);
  }
};

const init = () => {
  document.addEventListener('mouseup', () => {
    setTimeout(() => requestAnimationFrame(checkForMultipleSelectedTasks), 50);
  });
};

export default init;
