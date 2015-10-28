var remote = require('remote');
var dialog = remote.require('dialog');
var browserWindow = remote.require('browser-window');
var fs = require('fs');
var readLine = require('readline');

var mainContent = null;
var filePath = null;

function onLoad() {
	mainContent = document.getElementById("main_content");
	filePath = document.getElementById("file_path");
}

function openLoadFile() {
	var win = browserWindow.getFocusedWindow();

	dialog.showOpenDialog(
			win,
			{
				properties: ['openFile'],
				filters: [
				{
					name: 'Documents',
					extensions: ['txt', 'text', 'log']
				}
			]
			},
			// Callback
			function (filenames) {
				if (filenames) {
					readFile(filenames[0]);
				}
			});
}

function readFile(path) {
	filePath.innerHTML = path;
	clearMainContent();
	rs = fs.ReadStream(path);
	rl = readLine.createInterface({input:rs, output:{}});
	var i = 0;
	rl.on('line', function(line) {
		var e = document.createElement('div');
		e.textContent = ++i + ' ' + line.trim();
		if (filterVerbose(line)) {
			e.className = 'red';
		}
		mainContent.appendChild(e);
	});
}

function clearMainContent() {
	while (mainContent.firstChild) {
		mainContent.removeChild(mainContent.firstChild);
	}
}

function isVerbose(line) {
	//10-28 16:14:18.375 V/
	var reg = /\d\d-\d\d\s\d\d:\d\d:\d\d\.\d\d\d\sV/;
	return reg.test(line);
}

function isDebug(line) {
	//10-28 16:14:18.375 D/
	var reg = /\d\d-\d\d\s\d\d:\d\d:\d\d\.\d\d\d\sD/;
	return reg.test(line);
}
