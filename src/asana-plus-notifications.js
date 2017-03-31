(function () {
  let interval 	= 3000, 				// 3 minutes
    switchEvery	= 75 	* 60 * 1000,
    reloadEvery	= 20 	* 60 * 1000,
    closeOn 	= 10 	* 60 * 1000, 		//  15 minutes
    latestId 	= parseInt(localStorage['asana-plus-notifications-latest-id']) || 0,
    latestTs 	= parseInt(localStorage['asana-plus-notifications-latest-ts']) || 0,
    notified 	= localStorage['asana-plus-notifications-notified'] ? JSON.parse(localStorage['asana-plus-notifications-notified']) : {},
    notifications = {},
    notifiedPre 	= {},
    notificationsSeen = localStorage['asana-plus-notifications-seen'] ? JSON.parse(localStorage['asana-plus-notifications-seen']) : {},
    isMac 	= navigator.userAgent.indexOf('Mac OS') !== -1,
    thisInstanceId = Date.now(), // A uniqueID: Perhaps I should use crypto.getRandomValues(new Uint8Array(32)).join('') for more fun
    showLog 	= true;

// A sanity check
  if (latestTs && latestTs > Date.now()) {
    latestTs = Date.now();
    latestId = 0;
  }

  $LOG('Initialized ...');

// Unload handling
  window.addEventListener('beforeunload', unload, false);
  window.addEventListener('unload', unload, false);

// Handle incoming message
  window.addEventListener('message', event => {
    let payload;

    if (event.data && event.data.indexOf('action') !== -1) {
      payload = JSON.parse(event.data);

      switch (payload.action) {
        case 'update_notificationSeen':
          $LOG('Updated notificationsSeen');
          notificationsSeen = JSON.parse(localStorage['asana-plus-notifications-notified']);
          break;
      }
    }
  }, false);

// Remove all notified stuff from localStorage
  if (notified) {
    const now = Date.now();

    for (const i in notified) {
      if (notified.hasOwnProperty(i)) {
        if (notified[i] > 1 && notified[i] < now - (86400 * 1000 * 5)) {
          delete(notified[i]);
        }
      }
    }

    saveNotified(notified);
  }

  askForNotificationPermissions();
  poll();

// clean up the mess a bit
  setInterval(() => {
    if (latestTs && (Date.now() - latestTs < 1000 * 10)) {
      return;
    }

    location.href = 'https://app.asana.com/0/inbox/?asanaPlusNotifications';
  }, reloadEvery);

// Sometimes this halts, let's fix it
  setInterval(() => {
	// Don't switch if not needed (updated < 10 mins)
    if (latestTs && (Date.now() - latestTs < 1000 * 10)) {
      return;
    }

    document.querySelector('.topbar-myTasksButton').click();

    setTimeout(() => {
      document.querySelector('.topbar-notificationsButton').click();
    }, 100);
  }, switchEvery);

  function poll () {
	// No current instance? assign it to this
    if (!localStorage['asana-plus-notifications-instanceId']) {
      localStorage['asana-plus-notifications-instanceId'] = thisInstanceId;

		// also read notifified from localstorage
      notified = localStorage['asana-plus-notifications-notified'] ? JSON.parse(localStorage['asana-plus-notifications-notified']) : {};
    }

    if (localStorage['asana-plus-notifications-instanceId'] != thisInstanceId) {
      $LOG('Opened elsewhere!');
      setTimeout(poll, interval);
      return;
    }

    closeUneededNotifications();

    let entries 	= getEntries(),
      events = [],
      maxLatestId,
      lastEvent;

    if (!entries.length) {
      $LOG('No entries: inbox empty or not ready yet.');
      setTimeout(poll, interval);
      return;
    }

    entries.forEach((entry, index) => {
      let id = entry.id,
        ts = entry.ts,
        acceptableDiffInMinutes = (Date.now() - ts) / 1000 / 60;

		// Too short content, either being written or test
      if (entry.content.length < 3) {
        return;
      }

		// Was && notified but this was not right
      if ((!notifiedPre[id] && !notified[id])
			&& (ts > latestTs)
			&& acceptableDiffInMinutes < 5) {
        $LOG(ts, latestTs, notified[id], acceptableDiffInMinutes);

        events.push(getDataFromElement(entry.element, id, ts));

        if (ts >= latestTs) {
          latestTs 		= ts;
          latestId 		= id;

          lastEvent 		= entry;

				// A temp holder here to avoid dupes
          notifiedPre[id]	= ts;
        }

        console.log('pushing ', entry.element, id, ts);
      }
    });

    if (events.length) {
      setLatest(latestTs, latestId, lastEvent);

      $LOG('Changed');

      postToParent('unread', { unread: events.length });

      events.forEach(event => {
        notify(event.parentTitle, event, { body: event.content, icon: event.creatorIcon });
        event.element.classList.add('notified');
      });

		// Store -- though this could be an overkill
      saveNotified(notified);
    }

    $LOG('Polling ..');

    setTimeout(poll, interval);
  }

  function setLatest (ts, id, last) {
    localStorage['asana-plus-notifications-latest-ts'] = ts;
    localStorage['asana-plus-notifications-latest-id'] = id;

    showLog && last && console.log('LAST IS', last);
  }

  function getIdFromElement (entry) {
    return parseInt(entry.id.replace(/__notification_view_/, ''));
  }

  function getTsFromElement (entry) {
    return parseDate(getContent(entry.querySelector('.story-timestamp-view')));
  }

  function getDataFromElement (entry, id, ts) {
    let creator 		= entry.querySelector('.blockStoryView-actors a'),
      isNewTask 	= entry.parentNode.className.indexOf('notifications') === -1,
      isHeart 	= entry.querySelector('.span.heart'),
      parent 	= isNewTask ? entry.parentNode.parentNode.parentNode.parentNode : entry.parentNode.parentNode,
      creatorIcon = entry.querySelector('.avatar'),
      content 	= firstUpper(getTextContent(entry.querySelector('.blockStoryView-storyText').innerHTML.replace(/<div.*?\/div>/gi, '')));

    $LOG('new: ', isNewTask);

    let creatorName = getContent(creator),
      creatorLink = creator.href,
      parentTitle = getContent(parent.querySelector('.notification-title .task-name')
			|| parent.querySelector('.notification-title'));

    creatorIcon	= creatorIcon ? creatorIcon.style.backgroundImage : null;
    content = prependToContentBasedOnType(content, isNewTask, isHeart);

    $LOG(`creatorIcon:${creatorIcon}`);

    if (creatorIcon) {
      creatorIcon = creatorIcon
			.match(/url\((.*?)\)/)[1]
			.replace(/27x27/, '60x60');
    } else {
      creatorIcon = getCreatorIconByName(creatorName);
    }

    return {
      id,
      ts,
      creatorName,
      creatorIcon, // cache them please
      content,
      parentTitle,
      element: entry,
    };

    function prependToContentBasedOnType (input, isNewTask, isHeart) {
		// Mac only for now
      if (!isMac) {
        return input;
      }

      let prefix = '';

      if (isNewTask) {
        prefix = '🆕 ';
      } else if (isHeart) {
        prefix = '♥️ ';
      } else if (input.indexOf('Completed this task') === 0) {
        prefix = '✅ ';
      } else if (input.indexOf('Attached ') === 0) {
        if (input.match(/\.(png|jpg|jpeg|gif)$/i)) {
          prefix = '📷 ';
        } else {
          prefix = '📁 ';
        }
      } else if (input.indexOf('Added you as') === 0) {
        prefix = '👥 ';
      } else if (input.indexOf('Marked incomplete') === 0) {
        prefix = '☑️ ';
      }

      return prefix + input;
    }

    function getCreatorIconByName (input) {
      let c,
        ctx,
        img,
        name = getNameByInput(input);

      if (window.__dummyCanvas) {
        c = window.__dummyCanvas;
      } else {
        c = document.createElement('canvas');
        c.height = c.width = 60;
        window.__dummyCanvas = c;
        document.body.appendChild(c);
        c.style.display = 'none';
      }

      ctx = c.getContext('2d');
      ctx.clearRect(0, 0, c.width, c.height);

      ctx.fillStyle = '#1D8FDA';
      ctx.font = `bold ${parseInt(c.width / 2)}px helvetica, proxima, avenir next, tahoma`;

      const x = c.width / 2 - parseInt(ctx.measureText(name).width) / 2;
      const y = c.height / 2 + c.width / 2 / 2 - 4;

      ctx.fillText(name,
			x,
			y
		);

      return c.toDataURL('image/png');

      function getNameByInput (input) {
        if (input.indexOf(' ') !== -1) {
          const matches = input.split(/ /);
          return matches[0][0].toUpperCase() + matches[1][0].toUpperCase();
        } else {
          return input.slice(0, 2).toUpperCase();
        }
      }
    }
  }

  function getEntries () {
    let q = document.querySelectorAll('.inbox-thread-wrapper .story.unread:not(.notified)'),
      entries = [],
      index = 0;

    if (!q || !q.length) {
      return 0;
    }

    $A(q).forEach(element => {
      entries.push({
        index: index++,
        id: getIdFromElement(element),
        element,
        ts: getTsFromElement(element),
        content: element.querySelector('.blockStoryView-storyText')
        ? getTextContent(element.querySelector('.blockStoryView-storyText').innerHTML.replace(/<div.*?\/div>/gi, ''))
        : '',
      });
    });

    entries.sort((a, b) => {
      if (a.ts == b.ts) {
        return b.index - a.index;
      } else {
        return b.ts - a.ts;
      }
    });

    return entries;
  }

  function saveNotified (notified) {
    if (notified) {
      localStorage['asana-plus-notifications-notified'] = JSON.stringify(notified);
    }
  }

  function closeUneededNotifications () {
    for (const id in notifications) {
      if (notifications.hasOwnProperty(id)) {
        if (!document.getElementById(`__notification_view_${id}`) || notificationsSeen[id]) {
          $LOG(`Closing notification: ${id}`);
          notifications[id].close();
        }
      }
    }
  }

// Helpers
  function $A (list) {
    if (list.forEach) {
      return list;
    }

    return Array.prototype.slice.call(list);
  }

  function $LOG () {
    if (!showLog) {
      return false;
    }

    const args = arguments;

    if (arguments.length === 1 && typeof(arguments[0]) === 'string') {
      args[0] = `[Asana Plus Notification] ${args[0]}`;
    }

    console.log(...args);
  }

  function firstUpper (input) {
    return input.slice(0, 1).toUpperCase() + input.slice(1);
  }

  function getContent (element) {
    if (typeof(element) === 'string') {
      element = document.querySelector(element);
    }

    if (element && element.textContent) {
      return element.textContent.trim();
    } else {
      return 'NA';
    }
  }

  const dummy = document.createElement('div');

  function getTextContent (input) {
    dummy.innerHTML = input;
    return dummy.textContent.trim();
  }

  function getNotificationConstructor () {
    const i = document.createElement('frame');
    document.body.appendChild(i);

    window.NotificationNative = i.contentWindow.Notification;

    i.onload = function () {
      i.style.display = 'none';
    };
  }

  function askForNotificationPermissions () {
    if (!window.NotificationNative) {
      getNotificationConstructor();
    }

    window.NotificationNative.requestPermission();
  }

// https://developer.mozilla.org/en/docs/Web/API/notification
  function notify (title, event, options) {
    askForNotificationPermissions();

    const notification = new window.NotificationNative(title, options);

    $LOG(`Notification spawned: ${title}`);

	// THIS IS WRONG: Only when show register notified
	// Since sometimes it take time to show an notification either by design
	// or cause it's queued
	// Let's do it at once

	// notification.onshow = function () {
    notified[event.id] = event.ts;
    notifications[event.id] = notification;

    saveNotified(notified);
	// }

    notification.onclose = function () {
		// Remove it from notifications
      delete(notifications[event.id]);
    };

	/*
	notification.onclick = function () {
		window.parent.focusInAsanaWindow();
	}
	*/

    setTimeout(() => {
      if (notification && notification.close) {
        notification.close();
      }
    }, closeOn);
  }

  function unload () {
	// free for another one
    saveNotified();
    delete(localStorage['asana-plus-notifications-instanceId']);
  }

  function postToParent (action, data) {
    window.parent.postMessage(JSON.stringify({
      action,
      data,
    }), `https://${location.host}`);
  }
  window.postToParent = postToParent;

// Date parser
  let 	today 	= new Date(),
    days 		= ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    months 	= ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  function parseDate (input, notAsTS) {
    if (input === 'Just posted') {
      return notAsTS ? new Date() : Date.now();
    }

    let matches = input.match(/^(.*?) at (.*?):(.*?)(am|pm)$/),
      DT = new Date(),
      thisDayOfWeek = DT.getDay(),
      year,
      month,
      day,
      dayRepr,
      hour,
      daysDiff,
      hourPrefix,
      mins;

    if (matches) {
      dayRepr = matches[1];
      hour 	= parseInt(matches[2]);
      mins 	= parseInt(matches[3]);

      hourPrefix = matches[4];

      if (hourPrefix === 'pm' && hour < 12) {
        hour += 12;
      }

      if (dayRepr.indexOf(' ') === -1) {
        if (dayRepr !== 'Today') {
          if (dayRepr === 'Yesterday') {
            DT.setTime(DT.getTime() - 86400 * 1000);
          } else {
            daysDiff = thisDayOfWeek - days.indexOf(dayRepr);

					// This is for cases like
					// new Date(1431935782078) > new Date(1431935782078) and now it's monday
            if (daysDiff < 0) {
              daysDiff = thisDayOfWeek + 7 - days.indexOf(dayRepr);
            }

            DT.setTime(DT.getTime() - (86400 * daysDiff) * 1000);
          }
        }
      } else if (dayRepr.indexOf(',') === -1) {
        matches = dayRepr.split(/ /);
        DT.setMonth(months.indexOf(matches[0]));
        DT.setDate(parseInt(matches[1]));
      } else {
        matches = dayRepr.match(/(.*?) (.*?), (.*?)$/i);

        DT.setFullYear(parseInt(matches[3]));
        DT.setMonth(months.indexOf(matches[1]));
        DT.setDate(parseInt(matches[2]));
      }

      year		= DT.getFullYear();
      month 	= DT.getMonth();
      day 		= DT.getDate();
    } else {
      return null;
    }

    let result = new Date(year, month, day, hour, mins);

	// TODO: This a major issue we need to tackle
    if (result.getTime() > Date.now()) {
      result = new Date();
      console.error('AsanaPlusNotifications: Error, date output in future for input', input);
    }
    if (notAsTS) {
      return result;
    } else {
      return result.getTime();
    }
  }
}());
