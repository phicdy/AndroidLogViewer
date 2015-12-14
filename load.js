var remote = require('remote');
var dialog = remote.require('dialog');
var browserWindow = remote.require('browser-window');
var fs = require('fs');
var async = require('async');
var readLine = require('readline')
var csv = require('comma-separated-values');
var childProcess = require('child_process');

var mainContent = null;
var tagListElement = null;
var colorSettings = null;
var tagList = [];

function onLoad() {
	mainContent = document.getElementById("main_content");
	tagListElement = document.getElementById("log_tag_list");
	parseColorSettingsFile();
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
	document.getElementsByTagName('title')[0].innerHTML = path;
	clearMainContent();
	clearTagList();

	// Log log tag list
	async.forEachSeries(fs.readFileSync(path).toString().split('\n'), function(line, callback) {
		addLogTag(line);
		callback();
	}, function(error) {
		if(error) { 
			console.log('A file failed to process');
		} else {
			console.log('All files have been processed successfully');
			sortLogTag();
			appendChildLogTag();

			// Load line
			rs = fs.ReadStream(path);
			rl = readLine.createInterface({input:rs, output:{}});
			var lineNum = 0;
			rl.on('line', function(line) {
				var e = document.createElement('div');
				e.innerHTML = '<b>' + ++lineNum + '</b> ' + line.trim();

				setLogLevelClass(e, line);
				setLogTagClass(e, line);
				applyColorSetting(line, e);
				mainContent.appendChild(e);
			});
			mainContent.style.visibility = 'visible';
		}
	});
}

function clearMainContent() {
	while (mainContent.firstChild) {
		mainContent.removeChild(mainContent.firstChild);
	}
}

function clearTagList() {
	tagList = [];
	while (tagListElement.firstChild) {
		tagListElement.removeChild(tagListElement.firstChild);
	}
}

function applyColorSetting(line, element) {
	if (colorSettings) {
		colorSettings.forEach(function(object) {
			if (isMatch(line, object.text)) {
				element.style.color = object.color;
			}
		});
	}
}	

function setLogLevelClass(element, line) {
	var reg = /\d\d-\d\d\s\d\d:\d\d:\d\d\.\d\d\d\s(.)/;
	var result = line.match(reg);
	if (!result) {
		return;
	}
	var logLevel = result[1];
	switch (logLevel) {
		case 'V':
			element.className = 'verbose';
			break;
		case 'D':
			element.className = 'debug';
			break;
		case 'I':
			element.className = 'info';
			break;
		case 'W':
			element.className = 'warn';
			break;
		case 'E':
			element.className = 'error';
			break;
		case 'A':
			element.className = 'assert';
			break;
	}
}

function setLogTagClass(element, line) {
	var tag = getLogTag(line);
	if (!tag) return;
	if (element.className) {
		element.className = element.className + ' ' + tag;
	}else {
		element.className = tag;
	}

}

function addLogTag(line) {
	var tag = getLogTag(line);
	var isEmpty = /^\s*$/.test(tag);
	if (typeof tag !== 'undefined' && !isEmpty && tagList.indexOf(tag) < 0) {
		tagList.push(tag);
	}
}

function getLogTag(line) {
	var reg = /^\d\d-\d\d\s\d\d:\d\d:\d\d\.\d\d\d\s[V|D|I|W|E|A]\/(.*)\(\s*\d+\):/;
	var result = line.match(reg);
	if (!result) {
		return;
	}
	return result[1];
}

function sortLogTag() {
	if (!tagList) {
		return;
	}
	tagList.sort(function(a,b) {
		if ( a.toLowerCase() < b.toLowerCase()) return -1;
		if ( a.toLowerCase() > b.toLowerCase()) return 1;
		return 0;
	});
}

function appendChildLogTag() {
	for (i=0; i<tagList.length; i++) {
		var e = document.createElement('div');
		e.className = 'log_tag';
		var checkBox = document.createElement('input');
		checkBox.className = 'log_tag_checkbox';
		checkBox.type = 'checkbox';
		checkBox.checked = 'checked';
		checkBox.onclick = function(i) {
			return function() {
				console.log('checkbox is clicked');	
				var elements = document.getElementsByClassName(tagList[i]);
				changeDisplayStyle(this.checked, elements);
			}
		}(i);
		e.appendChild(checkBox);

		// Split element from top div to set onclick to change hide/show status by clicking log tag text 
		var text = document.createElement('span');
		text.onclick = function(i, checkBox) {
			return function() {
				console.log('log tag text is clicked');	
				// Change checkbox status
				checkBox.checked = !checkBox.checked;
				var elements = document.getElementsByClassName(tagList[i]);
				changeDisplayStyle(checkBox.checked, elements);
			}
		}(i, checkBox);
		var str = document.createTextNode(tagList[i]);
		text.appendChild(str);
		e.appendChild(text);

		// Apply color setting
		applyColorSetting(tagList[i], e);

		// Add element
		tagListElement.appendChild(e);
	}
}

function isMatch(line, regText) {
	var reg = new RegExp(regText);
	return reg.test(line);
}

function parseColorSettingsFile() {
	fs.readFile('color_settings.txt', function (error, text) {
		if (error != null) {
		   alert('error: ' + error);
		   return;
		}	   
		console.log(text.toString());
		colorSettings = new csv(text.toString(), {header: true}).parse();
		//console.log(colorSettings);
	});
}

function clickVerbose(isChecked) {
	var elements = document.getElementsByClassName('verbose');
	changeDisplayStyle(isChecked, elements);
}

function clickDebug(isChecked) {
	var elements = document.getElementsByClassName('debug');
	changeDisplayStyle(isChecked, elements);
}

function clickInfo(isChecked) {
	var elements = document.getElementsByClassName('info');
	changeDisplayStyle(isChecked, elements);
}

function clickWarn(isChecked) {
	var elements = document.getElementsByClassName('warn');
	changeDisplayStyle(isChecked, elements);
}

function clickError(isChecked) {
	var elements = document.getElementsByClassName('error');
	changeDisplayStyle(isChecked, elements);
}

function clickAssert(isChecked) {
	var elements = document.getElementsByClassName('assert');
	changeDisplayStyle(isChecked, elements);
}

function changeDisplayStyle(isShown, elements) {
	if (isShown) {
		for (i=0; i<elements.length; i++) {
			elements[i].style.display = 'block';
		}	
	} else {
		for (i=0; i<elements.length; i++) {
			elements[i].style.display = 'none';
		}	

	}
}	

function clickAllLogTag(isChecked) {
	var checkboxElements = document.getElementsByClassName('log_tag_checkbox');
	for (i=0; i<checkboxElements.length; i++) {
		checkboxElements[i].checked = isChecked;
	}	
	var mainContentElement = document.getElementById('main_content');
	changeDisplayStyle(isChecked, mainContentElement.childNodes);
}

function getLogFromLogcat() {
	// Clear
	clearMainContent();
	clearTagList();

	// Delete temp file
	var tempFileName = 'logcat_temp.txt';
	fs.unlink(tempFileName, function (err) {
		if (err) throw err;
		console.log('successfully delete');
	});

	// Start logcat process
	var logcatPs = childProcess.spawn('adb', ['logcat', '-v','time'], {detached: true});
	logcatPs.stdout.on('data', function(data) {
		var line = data.toString();
		console.log(line);	
		fs.appendFileSync(tempFileName, line, 'utf8');
	});
	console.log(logcatPs);

	// Read logcat file after a few interval
	var timerId = setInterval(function() {
		// Stop logcat process
		process.kill(-logcatPs.pid);
		// Read logcat output from file
		readFile(tempFileName);
		clearInterval(timerId);	
	}, 3000);
}

function clearLogcat() {
	childProcess.spawn('adb', ['logcat', '-c'], {detached: true});
}
