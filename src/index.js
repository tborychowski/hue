const colors = ['#59a859', '#5797d0', '#ae5252', '#acac49', '#b9629b', '#34a892'];
const config = {
	type: 'line',
	data: {labels: [], datasets: [] },
	options: {
		legend: { labels: { fontSize: 14, padding: 40, boxWidth: 16, fontColor: '#eee' } },
		scales: {
			xAxes: [{
				type: 'time',
				gridLines: { color: '#444' },
				ticks: { fontColor: '#eee' },
				time: {
					displayFormats: {
						minute: 'HH:mm',
						hour: 'HH:mm',
						day: 'DD MMM, HH:mm'
					}
				}
			}],
			yAxes: [{
				gridLines: { color: '#444' },
				ticks: { fontColor: '#eee', callback: value => Math.round(value) + '°C' }
			}]
		},
		tooltips: {
			intersect: false,
			mode: 'index',

			titleMarginBottom: 12,
			bodySpacing: 10,
			footerSpacing: 30,

			titleFontSize: 15,
			bodyFontSize: 15,
			footerFontSize: 15,
			caretSize: 10,
			callbacks: {
				title: tt => {
					const d = new Date(tt[0].xLabel);
					const dat = d.toISOString().substr(0, 10);
					const time = d.toLocaleTimeString().substr(0, 5);
					return `${dat}  ${time}`;
				},
				label: (tt, data) => {
					const label = data.datasets[tt.datasetIndex].label || '';
					let val = Math.round(tt.yLabel * 100) / 100 + '°C';
					return ` ${label} ${val}`;
				},
			}
		}
	},
};
let chart;

function fetchData () {
	return fetch('src/data.csv').then(res => res.text());
}


function parseData (text) {
	const lines = text.split('\n').filter(l => !!l);
	let json = {labels: [], datasets: []};

	json.datasets = lines.shift().split(',')
		.filter(l => l !== 'Date')
		.map(l => { l = l.replace(' sensor', '').replace(' temp', ''); return l; })
		.map((label, i) => ({
			label,
			borderColor: colors[i],
			backgroundColor: colors[i],
			borderWidth: 1,
			fill: false,
			data: []
		}));

	lines.forEach((line, l) => {
		const [date, ...data] = line.split(',');
		json.labels[l] = new Date(date);
		json.datasets.forEach((set, s) => {
			set.data.push(data[s]);
		});
	});
	return json;
}

function drawChart (data) {
	if (!chart) chart = new window.Chart(document.getElementById('chart'), config);
	config.data = data;
	chart.update();
}

fetchData()
	.then(parseData)
	.then(drawChart);
