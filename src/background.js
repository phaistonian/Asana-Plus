chrome.extension.onMessage.addListener((payload, sender) => {
  const tab = sender.tab;

  if (!payload) {
    return;
  }

  switch (payload.action) {

    case 'showPageAction':
      chrome.pageAction.show(tab.id);
      break;

    case 'focusInAsanaWindow':
      chrome.tabs.update(tab.id, { selected: true });
      break;
  }
});
