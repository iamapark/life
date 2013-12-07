var dataMap = new HashMap();
var configData;
var life = {
	$title: document.getElementById('title'),
	$el: document.getElementById('life'),
	yearLength: 120, // 120px per year
	start: function(){
		life.loadConfig(function(config){
			if (config.yearLength) life.yearLength = config.yearLength;
			if (config.customStylesheetURL) life.injectStylesheet(config.customStylesheetURL);

			life.fetch(function(response){
				var data = life.parse(response);
				var title = life.parseTitle(response);
				life.render(title, data);
			});
		configData = config;
		
		});
	},
	loadConfig: function(fn){
		var xhr = new XMLHttpRequest();
		xhr.open('GET', 'config.json', true);
		xhr.onload = function(){
			if (xhr.status == 200){
				fn(JSON.parse(xhr.responseText));
			} else {
				fn({});
			}
		};
		xhr.onerror = xhr.onabort = function(){
			fn({});
		};
		xhr.send();
	},
	injectStylesheet: function(url){
		var link = document.createElement('link');
		link.rel = 'stylesheet';
		link.href = url;
		document.body.appendChild(link);
	},
	fetch: function(fn){
		var xhr = new XMLHttpRequest();
		xhr.open('GET', 'life.md', true);
		xhr.onload = function(){
			if (xhr.status == 200) fn(xhr.responseText);
		};
		xhr.send();
	},
	parse: function(response){
		var list = response.match(/\-\s+[^\n\r]+/ig);
		var data = [];
		list.forEach(function(l){
			var matches = l.match(/\-\s+([\d\/\-\~]+)\s(.*)/i);
			var time = matches[1];
			var text = matches[2];
			data.push({
				time: life.parseTime(time),
				text: text
			});
		});
		return data;
	},
	parseTitle: function(response){
		return response.match(/[^\r\n]+/i)[0];
	},
	parseTime: function(time, point){
		if (!point) point = 'start';
		var data = {};
		if (/^\~\d+$/.test(time)){ // ~YYYY
			data = {
				startYear: parseInt(time.slice(1), 10),
				estimate: true
			};
		} else if (/^\d+$/.test(time)){ // YYYY
			data[point + 'Year'] = parseInt(time, 10);
		} else if (/^\d+\/\d+$/.test(time)){ // MM/YYYY
			var t = time.split('/');
			data[point + 'Month'] = parseInt(t[0], 10);
			data[point + 'Year'] = parseInt(t[1], 10);
		} else if (/^\d+\/\d+\/\d+$/.test(time)){ // DD/MM/YYYY
			var t = time.split('/');
			data[point + 'Date'] = parseInt(t[0], 10);
			data[point + 'Month'] = parseInt(t[1], 10);
			data[point + 'Year'] = parseInt(t[2], 10);
		} else if (/\d\-/.test(time)){ // TIME-TIME
			var splitTime = time.split('-');
			var startTime = life.parseTime(splitTime[0]);
			var endTime = life.parseTime(splitTime[1], 'end');
			for (var k in startTime) { data[k] = startTime[k] }
			for (var k in endTime) { data[k] = endTime[k] }
		} else if (time == '~'){ // NOW
			var now = new Date();
			data.endYear = now.getFullYear();
			data.endMonth = now.getMonth()+1;
			data.endDate = now.getDate();
		}
		data.title = time;
		return data;
	},
	firstYear: null,
	renderEvent: function(d){
		dataMap.put(d.time.title, d);
		kaka = d;
		var firstYear = life.firstYear;
		var yearLength = life.yearLength;
		var monthLength = yearLength/12;
		var dayLength = monthLength/30;

		var time = d.time;
		var estimate = time.estimate;
		var startYear = time.startYear;
		var startMonth = time.startMonth;
		var startDate = time.startDate;
		var endYear = time.endYear;
		var endMonth = time.endMonth;
		var endDate = time.endDate;
		var width = 0;

		// Calculate offset
		var startTime = new Date(firstYear, 0, 1);
		var endTime = new Date(startYear, startMonth ? startMonth-1 : 0, startDate || 1);
		var daysDiff = (endTime - startTime)/(24*60*60*1000);
		offset = daysDiff*dayLength;

		// Calculate width
		if (endYear){
			var _endMonth = endMonth ? endMonth-1 : 11;
			var _endDate = endDate || new Date(endYear, _endMonth+1, 0).getDate();
			startTime = new Date(startYear, startMonth ? startMonth-1 : 0, startDate || 1);
			endTime = new Date(endYear, _endMonth, _endDate);
			daysDiff = (endTime - startTime)/(24*60*60*1000);
			width = daysDiff*dayLength;
		} else {
			if (startDate){
				width = dayLength;
			} else if (startMonth){
				width = monthLength;
			} else {
				width = yearLength;
			}
		}
		
		modalId = configData.modalData[d.time.title];
		if(modalId)
			modalId = "'"+modalId+"'";
		
		return '<div onClick="barClick(this, '+modalId+');" class="event" style="margin-left: ' + offset.toFixed(2) + 'px"><div class="time" style="width: ' + width.toFixed(2) + 'px"></div><span class="text"><b>' + d.time.title + '</b> ' + d.text.split("|")[0] + '&nbsp;&nbsp;</span><br></div>';
		return '';
	},
	render: function(title, data){
		document.title = title;
		life.$title.innerHTML = title;

		var firstYear = life.firstYear = data[0].time.startYear;
		var nowYear = new Date().getFullYear();
		var dayLength = life.yearLength/12/30;

		var html = '';
		var days = 0;

		for (var y=firstYear, age = 1; y<=nowYear+1; y++, age++){
			html += '<section class="year" style="left: ' + (days*dayLength) + 'px">' +
				y + ' (' + age + ')' +
				'</section>';
			days += (y % 4 == 0) ? 366 : 365;
		}
		data.forEach(function(d){
			html += life.renderEvent(d);
		});
		life.$el.innerHTML = html;
	}
};

life.start();	                     

barClick = function(elem, modalId){
	
	if(modalId){
		console.log(modalId);
		$.facybox({ajax:'modal/'+modalId+'.html'});
	}else{
		$eventDiv = $(elem);
		timeTitle = $($eventDiv).find('b').text();
		
		dataText = dataMap.get(timeTitle).text;
		newTabLink = dataText.split("|")[1];
		
		if(newTabLink){
			newTabLink = newTabLink.trim();
			window.open(newTabLink, "_blank");
		}
	}
};