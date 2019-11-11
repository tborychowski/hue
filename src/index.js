function parseData (text) {
	const lines = text.trim().split('\n');
	const header = lines.shift();
	const series = header.split(',')
		.filter(l => l !== 'Date')
		.map(l => { l = l.replace(' sensor', '').replace(' temp', ''); return l; })
		.map(name => ({ name, data: [] }));
	lines.forEach(line => {
		const [date, ...data] = line.split(',');
		const d = +new Date(date);
		series.forEach((s, idx) => {
			s.data.push([ d, parseFloat(data[idx]) ]);
		});
	});
	return series;
}

function formatter () {
	return this.value + '°C';
}

function drawChart (series) {
	const config = {
		scrollbar: { enabled: false },
		credits: { enabled: false },
		rangeSelector: {
			buttonPosition: { align: 'right', x: -23, y: 2 },
			selected: 0,
			inputEnabled: false,
			buttons: [
				{ type: 'day', text: '1D' },
				{ type: 'week', text: '1W' },
				{ type: 'month', text: '1M' },
				{ type: 'all', text: 'All' }
			]
		},
		chart: { style: { fontFamily: 'sans-serif' } },
		legend: { enabled: true, align: 'center', verticalAlign: 'top', floating: false },
		tooltip: { valueSuffix: '°C' },
		yAxis: [
			{ labels: { formatter }, opposite: false, showLastLabel: true },
			{ labels: { formatter }, linkedTo: 0, showLastLabel: true }
		],
		series,
	};

	window.Highcharts.setOptions({ global: { useUTC: false } });
	window.Highcharts.stockChart('chart', config);
}

fetch('src/data.csv')
	.then(res => res.text())
	.then(parseData)
	.then(drawChart);
