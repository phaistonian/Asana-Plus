/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;
/******/
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
/******/ 	// identity function for calling harmony imports with the correct context
/******/ 	__webpack_require__.i = function(value) { return value; };
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
/******/ 	return __webpack_require__(__webpack_require__.s = 1);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */,
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


(function () {

	chrome.extension.sendMessage({ action: 'showPageAction' });

	//Once will do it
	if (window.asanaPlusAttached) {
		return;
	}

	var s, sn, i;

	if (location.href.indexOf('asanaPlusNotifications') !== -1) {

		sn = document.createElement('script');
		sn.src = chrome.extension.getURL('asana-plus-notifications.js');

		document.body.appendChild(sn);
	} else {

		s = document.createElement('script'), sn;
		s.src = chrome.extension.getURL('asana-plus.js');
		document.body.appendChild(s);

		i = document.createElement('iframe');
		i.id = 'asana-notifications-frame';
		i.src = 'https://app.asana.com/0/inbox/?asanaPlusNotifications';

		i.style.cssText = 'position: absolute; right: -20px; top: 0; width: 0px; height: 0px;';

		document.body.appendChild(i);

		document.body.dataset.audioAlertFile = chrome.extension.getURL('door.mp3');

		s.onload = function () {

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

/***/ })
/******/ ]);