/*
TODO
- One bell would do
 */

(function() {
  // Handle incoming messages from asans-plus-notiification
  window.addEventListener(
    'message',
    event => {
      let payload;

      if (event.data && event.data.indexOf('action') !== -1) {
        payload = JSON.parse(event.data);

        switch (payload.action) {
          case 'unread':
            if (!window.asanaPlusTotalUnread) {
              window.asanaPlusTotalUnread = 0;
              localStorage['asana-plus-notifications-totalUnread'] = 0;
            }

            window.asanaPlusTotalUnread += payload.data.unread;

            // This is so we can use it on all open asana instances
            localStorage[
              'asana-plus-notifications-totalUnread'
            ] = window.asanaPlusTotalUnread;

            // Sometimes this is not loaded yet
            // We do check, however, once again on 'onload' event below
            if (window.asanaPlusCheck) {
              window.asanaPlusCheck();
            }
            break;
        }
      }
    },
    false
  );

  // Upload by pasting
  document.addEventListener('paste', event => {
    let hi = document.querySelectorAll('.hidden-file-input, .AddAttachmentsButton-hiddenFileInput');

    if (hi && hi.length) {
      // last one at all times
      hi = hi[hi.length - 1];
    }

    if (hi && event.clipboardData.items.length) {
      const item = event.clipboardData.items[0];

      if (item.type.indexOf('image') != -1) {
        const file = item.getAsFile();

        // Some times this fails
        // due to the fact that file is a read only field
        try {
          file.name = `Pasted-${new Date()
            .toString()
            .replace(/ GMT.*$/gi, '')}.png`;
          file.lastModifiedDate = +new Date();
          file.fileSize = file.size;
        } catch (error) {
          console.log('Error');
        }

        // Thanks ASANA for this
        // eslint-disable-next-line
        hi._mock_files = [file];

        if (!hi.onchange) {
          if ('createEvent' in document) {
            const evt = document.createEvent('HTMLEvents');
            evt.initEvent('change', false, true);
            hi.dispatchEvent(evt);
          }
        } else {
          hi.onchange({
            type: 'change',
            target: hi,
            relatedTarget: hi,
            preventDefault () {},
          });
        }
      }
    }
  });

  // (Command || ctrl)+enter for quick add dialog
  document.addEventListener(
    'keydown',
    event => {
      try {
        let button, tempItem, closeDialogElement;

        // Search (ctrl+space)
        if (event.ctrlKey && event.keyCode === 32) {
          const tempItem = document.querySelector('#nav_search_input');

          if (tempItem) {
            console.log('Focusing on search');
            tempItem.focus();
            return;
          }
        }

        // Switcher
        // TODO: This does not work if no scollable contents are found
        if (event.altKey && event.keyCode > 48 && event.keyCode < 52) {
          let item;

          if (window.__inReactMode) {
            item = ([].slice
              .call(document.querySelectorAll('.topbar a'))
              .slice(1, 3) || [])[event.keyCode - 49];
          } else {
            item = (document.querySelectorAll(
              '#navigation_dock_domain_view_main .photo-atm-and-feed .list-item'
            ) || [])[event.keyCode - 49];
          }

          if (item) {
            item.click();
          }

          return;
        }

        // Close dialoges
        // Has to be pressed twice apparently cause something is blocking it
        if (event.keyCode === 27) {
          closeDialogElement = document.querySelector('#dialog_view_delete') ||
            document.querySelector('.dialog-closeButton');

          if (closeDialogElement) {
            closeDialogElement.click();
          }
        }

        // Toggle sidebar
        if (window.__inReactMode) {
          if (document.querySelector('.topbar-navButton')) {
            document
              .querySelector('.topbar-navButton')
              .setAttribute('title', 'Command (or ctrl) + .');
          }
          if ((event.metaKey || event.ctrlKey) && event.keyCode === 190) {
            document.querySelector('.topbar-navButton').click();
          }
        }

        // Quick add
        if (
          (event.metaKey || (event.ctrlKey && event.keyCode == 17)) &&
          event.keyCode == 13
        ) {
          const button = document.querySelector('#quickadd_ok');
          if (button) {
            button.click();
          }
        }

        // Toggle expander (shift+ctrl)
        if (
          event.shiftKey &&
          event.keyCode == 17 &&
          isValidArea(document.activeElement)
        ) {
          if (!document.activeElement.isExpanded) {
            showArea();
          } else {
            hideArea();
          }
        }

        // tabl = hi
        if (
          event.keyCode === 9 &&
          document.body.classList.contains('asana-plus-expand')
        ) {
          hideArea();
        }

        // Esc too (not working now)
        if (
          event.keyCode == 27 &&
          document.body.classList.contains('asana-plus-expand')
        ) {
          event.preventDefault();
          event.stopPropagation();
          hideArea();
        }

        function showArea() {
          document.activeElement.isExpanded = true;
          document.activeElement.classList.add('asana-plus-active-area');
          document.body.classList.add('asana-plus-expand');
        }

        function hideArea() {
          document.activeElement.isExpanded = false;
          document.activeElement.classList.remove('asana-plus-active-area');
          document.body.classList.remove('asana-plus-expand');
        }

        function isValidArea(element) {
          return element &&
            (element.id ===
              'property_sheet:details_property_sheet_field:description' ||
              // Ignore this for now (buggy)
              (0 &&
                element.contentEditable &&
                element.classList.contains('generic-input')));
        }
      } catch (error) {
        console.log(error);
      }
    },
    false
  );

  // Fav & more
  window.addEventListener(
    'load',
    event => {
      let currentCount, baseIcon, interval = 1000, can, c, soundElement;

      // Will come in super handy
      window.__inReactMode = !!document.querySelector('.react-app-node');

      placeholderChecker();
      check();

      setInterval(check, interval);

      function checkIfFollowUpTask(event) {
        let t = event.target, value;

        if (t.nodeName !== 'TEXTAREA') {
          return;
        }

        value = t.value.toLowerCase().trim();

        if (value.indexOf('follow up') === 0) {
          t.classList.add('is-followup');
          t.classList.remove('is-consider-prompt');
        } else if (value.indexOf('consider updating') === 0) {
          t.classList.remove('is-followup');
          t.classList.add('is-consider-prompt');
        } else {
          t.classList.remove('is-consider-prompt');
          t.classList.remove('is-followup');
        }
      }

      function nodeInsertCheck(event) {
        const t = event.target;

        if (t.nodeName === 'TEXTAREA') {
          checkIfFollowUpTask(event);
          return;
        }

        // Open followers
        // Click won't do it so we need mousedown
        if (t.id === 'collapsed_label_followers') {
          setTimeout(
            () => {
              const evt = new MouseEvent('mousedown', {
                bubbles: false,
                cancelable: false,
                view: window,
              });

              t.dispatchEvent(evt);

              document
                .querySelector('#collapsed_label_description')
                .dispatchEvent(evt);

              // Focus back
              setTimeout(
                () => {
                  document
                    .querySelector(
                      '[id="property_sheet:quick_add_property_sheet_field:name"]'
                    )
                    .click();
                  document
                    .querySelector(
                      '[id="property_sheet:quick_add_property_sheet_field:name"]'
                    )
                    .focus();
                },
                60
              );
            },
            0
          );
        }
      }

      ['animationstart'].forEach(e => {
        document.addEventListener(e, nodeInsertCheck);
      });
      window.addEventListener('change', checkIfFollowUpTask, false);

      // Observer magic
      // var observer = new MutationObserver(function (mutations) {
      //  mutations.forEach(function (mutation) {
      //    if (mutation.addedNodes) {
      //      for (var i = 0; i < mutation.addedNodes.length; i ++) {
      //        if (mutation.addedNodes[i].id === 'collapsed_label_description') {
      //          setTimeout(function () {
      //            mutation.addedNodes[i].click();
      //          }, 100);
      //          break;
      //        }
      //      }
      //    }
      //  });
      // });
      // observer.observe(document.body, {
      //  childList: true,
      //  subtree: true
      // })

      // Functions here
      function placeholderChecker() {
        const tmp = document.querySelector('#nav_search_input');

        if (tmp) {
          tmp.setAttribute('placeholder', 'Search (CTRL+SPACE)');
        } else {
          setTimeout(placeholderChecker, 300);
        }
      }

      function check() {
        const count = getCount();

        if (count != currentCount) {
          // console.log('changed');

          if (count > currentCount) {
            playSound();
          }

          currentCount = count;
          draw();
        }
      }

      window.asanaPlusCheck = check;

      function getCount() {
        // ugly hack for now
        if (window.__inReactMode !== true) {
          window.__inReactMode = !!document.querySelector('.react-app-node');
        }

        if (!window.__inReactMode) {
          const source = document.querySelector('.inbox-count');

          if (source) {
            return parseInt(source.textContent);
          } else {
            return 0;
          }

          // return parseInt(Math.random() * 10);
        } else {
          const hasNewNotifications = !!document.querySelector(
            '.topbar-notificationsButton.has-newNotifications'
          );

          if (!hasNewNotifications) {
            // Also init here
            window.asanaPlusTotalUnread = 0;
            localStorage['asana-plus-notifications-totalUnread'] = 0;
            return 0;
          }

          return Math.max(
            parseInt(localStorage['asana-plus-notifications-totalUnread']),
            window.asanaPlusTotalUnread
          ) || 1;
        }
      }

      function playSound() {
        if (!soundElement) {
          setupAudio();
        }

        soundElement.pause();
        soundElement.play();

        function setupAudio() {
          soundElement = document.createElement('audio');

          soundElement.preload = 'auto';
          soundElement.src = document.body.dataset.audioAlertFile;

          delete document.body.dataset.audioAlertFile;

          document.body.appendChild(soundElement);
        }
      }

      function draw() {
        const cnt = currentCount;

        if (can) {
          can = null;
          c = null;
        }

        can = document.createElement('canvas');
        // eslint-disable-next-line
        const canvas_temp = document.createElement('canvas');

        can.setAttribute('width', 16);
        can.setAttribute('height', 16);

        c = can.getContext('2d');
        const f = baseIcon || getBaseIcon();
        const i = new Image();

        i.src = f;

        function loaded() {
          let txt;

          // http://stackoverflow.com/questions/17861447/html5-canvas-drawimage-how-to-apply-antialiasing
          c.drawImage(i, 1, 3);

          if (cnt > 0) {
            c.fillStyle = '#D0021B'; // Red looks better

            c.fillRect(5, 0, 12, 12);
            c.fillStyle = 'white';
            c.font = 'normal 9px proxima, avenir next, tahoma';

            if (window.__inReactMode) {
              txt = cnt || 'N';
            } else {
              txt = cnt.toString();
            }

            c.fillText(
              txt,
              txt.length > 1
                ? 3
                : window.__inReactMode && !window.asanaPlusTotalUnread ? 7 : 8,
              9
            );
          }

          replaceIcon();
        }

        if (i.complete) {
          loaded();
        } else {
          i.onload = loaded;
        }

        updateInboxLink();

        // Replace it
        function replaceIcon() {
          getFavElement().setAttribute('href', can.toDataURL('image/png'));
          can = null;
          c = null;
        }

        function updateInboxLink() {
          const element = document.querySelector('.topbar-notificationsButton');

          // TODO: this is wrong - we should have access earlier
          if (!element) {
            return;
          }

          if (cnt) {
            element.innerHTML = `${'My Inbox' + ' ('}${cnt})`;
          } else {
            element.innerHTML = 'My Inbox';
          }
        }
      }

      function getBaseIcon() {
        // let's use a ready one for now so we can have better sampling
        return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA4AAAAKCAYAAACE2W/HAAAAAXNSR0IArs4c6QAAAcZJREFUKBVdUU1rE1EUPffOZBrbaUlrtSJiitg0JiBBCBV0U/AvNAtxIW7EH2BDd9kIWgXBtXRXKo1QsRvddNGvnQvFmEqFahW3Y9rUj8y8e71xY/W9xfvgnMM55xJshfdfH/c5vEaQSRUZAQFEHCl4Uzo6vzdz9kMXd3hR5mFzFBK8JMIJuGTNSB+hUAVOEnsTYK9XO8n1b9Wx511icRmn8QNtn2KqwtMBcUmpdTu/c1gVtUaQCYOnxO4OoMunFimNGKvk44Vv4k+0Ez9uzZz7S3q03XM0kWEnKBPzGXWSwmKdv0zh58Az3DJHXy0NcKzWCF1fekpZrljGMYKOAN6w2e41qwdwnZ0o+6aESsUZiWwrDd3dLkrASySahSavjPBWSXfN2md12mDGpMFuRt9zudEsBWEGG0Ze8cWTaVbuj11yfr+af/9PRnsMzb4rWbvc/S/3IW4qFozY9En1iEB/CbnW/6T+e1vj4vlXWVyMQp3qFTjDPOjiaHB265KmgiVyLoDKuln8BDDZOAp2vwgvRSTxbtTOjRcL1qePBZvVJkfT+Q1t709YZlNiz86yCV6wuVpzckNEL5u1OdSAdPSnmj0mHPwG6xjB97eb/jsAAAAASUVORK5CYII=';
      }

      function getFavElement () {
        return document.querySelector('link[rel="shortcut icon"]');
      }
    },
    false
  );

  function postToNotificationsFrame (action, data) {
    if (!window.asanaNotificatonsFrame) {
      window.asanaNotificatonsFrame = document.getElementById(
        'asana-notifications-frame'
      );
    }

    window.asanaNotificatonsFrame.postMessage(
      JSON.stringify({
        action,
        data,
      }),
      `https://${location.host}`
    );
  }
})();
