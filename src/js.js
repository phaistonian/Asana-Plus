(function () {


chrome.extension.sendMessage({action: 'showPageAction'});

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

	s.onload = function() {

	    s.parentNode.removeChild(s);

	    if (sn) {
	    	sn.parentNode.removeChild(sn);
	    }

	    window.asanaPlusAttached = true;

	    // One more is needed
	    i.src = i.src;
	};
}



}());
