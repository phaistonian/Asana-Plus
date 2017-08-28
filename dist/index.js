/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

__webpack_require__(1);
module.exports = __webpack_require__(2);


/***/ }),
/* 1 */
/***/ (function(module, exports) {

// removed by extract-text-webpack-plugin

/***/ }),
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var _totals = __webpack_require__(3);

var _totals2 = _interopRequireDefault(_totals);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const ENABLE_NOTIFICATIONS = false;
// import initMarkdown from './markdown';

// eslint-disable-next-line
(function () {
  chrome.extension.sendMessage({ action: 'showPageAction' });

  if (window.asanaPlusAttached) {
    return;
  }

  (0, _totals2.default)();

  let s, sn, i;

  if (location.href.indexOf('asanaPlusNotifications') !== -1) {
    if (ENABLE_NOTIFICATIONS) {
      const sn = document.createElement('script');
      sn.src = chrome.extension.getURL('dist/asana-plus-notifications.js');

      document.body.appendChild(sn);
    }
  } else {
    const s = document.createElement('script');
    let sn;

    s.src = chrome.extension.getURL('dist/asana-plus.js');
    document.body.appendChild(s);

    const i = document.createElement('iframe');
    i.id = 'asana-notifications-frame';
    i.src = 'https://app.asana.com/0/inbox/?asanaPlusNotifications';

    i.style.cssText = 'position: absolute; right: -20px; top: 0; width: 0px; height: 0px;';

    document.body.appendChild(i);
    document.body.dataset.audioAlertFile = chrome.extension.getURL('door.mp3');

    s.onload = () => {
      s.parentNode.removeChild(s);

      if (sn) {
        sn.parentNode.removeChild(sn);
      }

      window.asanaPlusAttached = true;

      // One more is needed
      i.src = i.src;
    };
  }
})();

/***/ }),
/* 3 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
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
  }, 100);
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

  document.addEventListener('keyup', event => {
    if (event.shiftKey && (event.key === 'ArrowUp' || event.key === 'ArrowDown')) {
      setTimeout(() => requestAnimationFrame(checkForMultipleSelectedTasks), 50);
    }
  });
};

exports.default = init;

/***/ })
/******/ ]);