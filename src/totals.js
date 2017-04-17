const updateTotals = rows => {
  const header = document.querySelector('.details-pane-title .header-name .read-only');
  header.dataset.total = Math.random() * 10;
};

const checkForMultipleSelectedTasks = event => {
  const selectedRows = [...document.querySelector('#grid tr.grid-row-selected')];

  if (selectedRows.length > 1) {
    updateTotals(selectedRows);
  } else {
    updateTotals(null);
  }
};

const init = () => {
  document.addEventListener('mouseup', checkForMultipleSelectedTasks);
};

export default init;
