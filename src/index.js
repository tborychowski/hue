const colors = ['green', 'blue', 'red', 'pink', 'yellow', 'brown', 'purple'];
const config = {
	type: 'line',
	options: {scales: {xAxes: [{type: 'time'}]}},
	data: {labels: [], datasets: [] },
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
		.map((label, i) => ({label, borderColor: colors[i], fill: false, data: []}));

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
