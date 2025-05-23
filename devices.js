
var OPTIONS_URL = "chrome-extension://flejfacjooompmliegamfbpjjdlhokhj/options.html?tab=1";
var isPopup = getURLParameter("popup");
var refreshElement = document.getElementById("topBarRefresh");
var setRefreshing = function (refreshing) {
	if (refreshing) {
		refreshElement.classList.add("rotating");
	} else {
		refreshElement.classList.remove("rotating");
	}
};
const tests = (async () => {
	const token = await back.getToken();
	console.log("Token", token);
});
tests();
async function pickFile() {
	const file = await UtilsDom.pickFile(document.querySelector("#uploadfile"));
	console.log(file);
	return file;
}
var makeDropZoneReady = function (dropzoneElement, optionalText) {
	return new Promise(function (resolve, reject) {
		dropzoneElement.classList.remove("hidden");
		var dropzoneTextElement = dropzoneElement.querySelector("div");
		var selectedDevice = UtilsDevices.getDevices().first(device => device.deviceId == localStorage.lastHoveredDeviceId);
		if (!optionalText) {
			optionalText = "Drop files here to send to " + selectedDevice.deviceName;
		}
		dropzoneTextElement.innerHTML = optionalText + ". <a href='#'>Cancel</a>";
		dropzoneElement.querySelector("a").onclick = e => {
			dropzoneElement.classList.add("hidden");
			reject("File Drop Zone Cancelled");
		}
		dropzoneElement.ondragover = e => {
			e.preventDefault();
			e.dataTransfer.dropEffect = 'copy';
		}
		dropzoneElement.ondrop = e => {
			if (e.dataTransfer.getData("index")) {
				return;
			}
			e.preventDefault();
			e.stopPropagation();
			dropzoneElement.classList.add("hidden");
			console.log(e.dataTransfer.files);
			resolve(e.dataTransfer.files);
		}
	})
		.catch(UtilsObject.ignoreError);
}
const pushFile = async function (deviceId, notify, tab, files) {
	try {
		var initialAction = files ? Promise.resolve(files) : pickFile();
		var files = await initialAction;
		console.log("pushFile picked files", files);
		var fileInput = { "files": files };
		if (tab) {
			chrome.tabs.remove(tab.id, function () {
			});
		}
		if (!fileInput.files || fileInput.files.length == 0) {
			return;
		}

		var filesLength = fileInput.files.length;
		var whatsUploading = filesLength == 1 ? fileInput.files[0].name : filesLength + " files";
		chrome.extension.getBackgroundPage().showNotification("Join", "Uploading " + whatsUploading);

		files = await FileUploadProviderFactory.provide({ "files": fileInput.files, "deviceId": deviceId });
		var push = new GCMPush();
		push.files = files;
		await push.send(deviceId);
		console.log("pushed files", files);
		back.setLastPush(deviceId, "pushFile");
	} catch (error) {
		UtilsObject.handleError(error);
	}
}
var closeAfterCommand = getURLParameter("closeAfterCommand");
var getDevices = function () {
	return UtilsDevices.getDevices();
}
// var doPostWithAuthPromise = back.doPostWithAuthPromise;
// var doGetWithAuthPromise = back.doGetWithAuthPromise;
// var doPutWithAuthPromise = back.doPutWithAuthPromise;
var refreshDevices = async function (callback) {
	await chrome.extension.getBackgroundPage().refreshDevices();
	await writeDevices();
	if (callback) {
		callback();
	}
}
const doIt = (async () => {

	if (!isPopup) {
		chrome.extension.getBackgroundPage().popupWindow = window;
	}

	var back = chrome.extension.getBackgroundPage();
	back.eventBus = EventBusCrossContext.get();
	var isMicAvailable = function (navigator) {
		return new Promise(function (resolve, reject) {
			if (!back.getVoiceEnabled()) {
				reject("Voice not enabled");
				return;
			}
			window.navigator.webkitGetUserMedia({
				audio: true,
			}, function (stream) {
				if (stream.stop) {
					stream.stop();
				}
				resolve();
			}, function () {
				reject("Mic not available");
			});
		})
	}
	await UtilsDom.setCurrentTheme();
	document.addEventListener('DOMContentLoaded', function () {
		isMicAvailable()
			.then(() => console.log("Mic in devices"))
			.catch(error => console.log("No mic in devices: " + error));
		UtilsDom.replaceAllSvgInline();
	});
	var clearClipboardWindows = function () {
		return chrome.extension.getBackgroundPage().clearClipboardWindows();
	}
	var pushClipboard = function (deviceId) {
		return chrome.extension.getBackgroundPage().pushClipboard(deviceId);
	}
	var writeText = function (deviceId) {
		return chrome.extension.getBackgroundPage().writeText(deviceId);
	}
	var requestLocation = function (deviceId) {
		return chrome.extension.getBackgroundPage().requestLocation(deviceId);
	}
	var pushUrl = function (deviceId, url, text) {
		return chrome.extension.getBackgroundPage().pushUrl(deviceId, url, text);
	}
	var getScreenshot = function (deviceId, url, text) {
		return chrome.extension.getBackgroundPage().getScreenshot(deviceId);
	}
	var sendSms = function (deviceId, url, text) {
		return chrome.extension.getBackgroundPage().sendSms(deviceId);
	}
	var getDeviceById = function (deviceId) {
		return chrome.extension.getBackgroundPage().getDeviceById(deviceId);
	}
	var doGetWithAuth = function (url, callback, callbackError) {
		return chrome.extension.getBackgroundPage().doGetWithAuth(url, callback, callbackError);
	}
	var doGetWithAuthAsyncRequest = function (endpointRequest, endpointGet, deviceId, callback, callbackError) {
		return chrome.extension.getBackgroundPage().doGetWithAuthAsyncRequest(endpointRequest, endpointGet, deviceId, callback, callbackError);
	}
	var getElementDeviceId = function (element) {
		return element.attributes.deviceId.value;
	}
	var doWithDeviceAndCloseWindows = function (doThis) {
		var element = event.currentTarget;
		var device = getDeviceById(getElementDeviceId(element));
		doThis(device.deviceId);
		clearClipboardWindows();
	}
	var setUserInfo = function () {
		getUserInfo(function (result) {
			var userIconElement = document.getElementById("usericon");
			document.getElementById("topBarText").onclick = setUserInfo;
			userIconElement.src = result.picture;
			userIconElement.onclick = async function () {
				await back.getAuthTokenPromise(true);
				await back.refreshDevices();
				await setUserInfo();
			};
		});
	}
	setUserInfo();
	function replaceAll(str, find, replace) {
		return str.replace(new RegExp(find, 'g'), replace);
	}
	var joinserver = chrome.extension.getBackgroundPage().joinserver;
	var tabs = document.querySelectorAll("div[id^=tab-]");

	for (var i = 0; i < tabs.length; i++) {
		var tab = tabs[i];
		tab.addEventListener("click", function (event) {
			var idToShow = event.currentTarget.id.replace("tab-", "");
			selectTab(idToShow);
		});
	};
	var tabTitleElement = document.getElementById("currenttabtitle");
	var selectTab = function (idToShow) {

		refreshTabVisibility();
		for (var i = 0; i < tabs.length; i++) {
			var tab = tabs[i];
			var currentId = tab.id.replace("tab-", "");
			var tabContent = document.getElementById(currentId);
			if (currentId == idToShow) {
				tabContent.style.display = "flex";
				if (tab.className.indexOf("selected") < 0) {
					tab.classList.add("selected");
					tabTitleElement.innerText = idToShow.substring(0, 1).toUpperCase() + idToShow.substring(1);
				}
			} else {
				tabContent.style.display = "none";
				tab.classList.remove("selected");
			}
			if (idToShow == "notifications") {
				UtilsBadge.setColor("#929292");
				localStorage.areNotificationsUnread = false;
			}
		}
		localStorage.selectedTab = idToShow;
		back.eventBus.post(new back.Events.TabSelected(idToShow));
		document.body.className = idToShow + "body";

		function getUrlParameter(sParam) {
			var sPageURL = window.location.search.substring(1);
			var sURLVariables = sPageURL.split('&');
			for (var i = 0; i < sURLVariables.length; i++) {
				var sParameterName = sURLVariables[i].split('=');
				if (sParameterName[0] == sParam) {
					return sParameterName[1];
				}
			}
		}
		var isPopup;
		isPopup = getUrlParameter('popup') === '1';
		if (isPopup) {
			$('body').toggleClass('popout', isPopup)
		}
		//	setDeviceCommandHeight();
	}

	const setDeviceCommandHeight = () => {
		const devicelistElement = document.querySelector("#devicelist");
		if (!devicelistElement) return;

		const tabscontainerElement = document.querySelector("#tabscontainer");
		const commandsElement = document.querySelector("#commands");
		const commandsHeight = `calc(100vh - ${devicelistElement.clientHeight + tabscontainerElement.clientHeight}px)`
		commandsElement.style.height = commandsHeight;
	}
	var refreshTabVisibility = function () {
		var smsTab = document.getElementById("tab-sms");
		if (!localStorage.smsDeviceId) {
			smsTab.style.display = "none";
		} else {
			smsTab.style.display = "block";
		}
	}
	refreshTabVisibility();
	var sendSmsDevices = function (event) {
		localStorage.smsDeviceId = event.deviceId;
		refreshTabVisibility();
		selectTab("sms");
		if (isPopup) {
			chrome.windows.getCurrent({}, win => chrome.windows.update(win.id, { "focused": true }));
		}

	};

	back.eventBus.post(new back.Events.PopupLoaded());
	back.addEventListener("sendsms", sendSmsDevices, false);
	back.addEventListener("phonecall", sendSmsDevices, false);
	addEventListener("unload", function (event) {
		console.log("Unloading popup devices...");
		back.eventBus.unregister(eventHandler);
		back.removeEventListener("sendsms", sendSmsDevices, false);
		back.removeEventListener("phonecall", sendSmsDevices, false);
		if (isPopup) {
			localStorage.popoutWidth = window.outerWidth;
			localStorage.popoutHeight = window.outerHeight;
		} else {
			back.popupWindow = null;
		}
		back.eventBus.post(new back.Events.PopupUnloaded());
	}, true);
	var settingsElement = document.getElementById("settings");
	var topBarPopoutElement = document.getElementById("topBarPopout");
	settingsElement.onclick = function () {
		openTab(OPTIONS_URL);
	}
	topBarPopoutElement.onclick = function () {
		back.createPushClipboardWindow(localStorage.selectedTab);
		window.close();
	}
	var onlyTabToShow = getURLParameter("tab");
	if (onlyTabToShow) {
		selectTab(onlyTabToShow);
		// CHANGE NOTE: I can't tell what it does. Hope it's not important.
		// document.getElementById("tabscontaineroutter").style.display ="none";
	} else {
		var tabToShow = null;
		/*for(var notification of notifications){
			if(notification.id==UtilsSMS.getNotificationId())
		}*/
		if (!tabToShow) {
			var defaultTab = await back.getDefaultTab();
			if (defaultTab && defaultTab != "auto") {
				tabToShow = defaultTab;
			}
		}
		if (!tabToShow) {
			if (localStorage.areNotificationsUnread == "true") {
				console.log("yes notifications")
				var previousTab = localStorage.selectedTab;
				tabToShow = "notifications";
				localStorage.selectedTab = previousTab;
			} else if (localStorage.selectedTab) {
				tabToShow = localStorage.selectedTab;
			}
		}
		if (!tabToShow) {
			tabToShow = tabs[0].id.replace("tab-", "");
			console.log("Showed tab " + tabToShow + " by default");
		}
		selectTab(tabToShow);
	}
	var topBarElement = document.getElementById("topBar");

	var devicesElement = document.getElementById("devices");
	document.onkeydown = function (e) {
		if (e.keyCode == 27) {
			window.close();
		}
	}


	document.getElementById("optionslink").addEventListener("click", function (event) {
		openTab(OPTIONS_URL);
	});
	refreshElement.addEventListener("click", async function (event) {
		var tab = localStorage.selectedTab;
		var func = "refresh" + tab.substring(0, 1).toUpperCase() + tab.substring(1);
		setRefreshing(true);
		await window[func]();
		setRefreshing(false);
	});

	//back.fileInput = document.getElementById("uploadfile");

	var devicesUpdated = function (event) {
		writeDevices();
	}
	back.addEventListener('devicesupdated', devicesUpdated, false);

	addEventListener("unload", function (event) {
		console.log("Unloading devices...");
		back.removeEventListener("devicesupdated", devicesUpdated, false);
	}, true);


	var DevicesEventHandler = function () {
		this.onThemeChanged = async function (themeChanged) {
			await UtilsDom.setTheme(themeChanged.theme);
		}
	}
	var eventHandler = new DevicesEventHandler();
	back.eventBus.register(eventHandler);

});
doIt();