#!/usr/bin/env node

const fetch = require('node-fetch');
const Msg = require('node-msg');
const config = require('./config.json');

function parseDate (str) {
	const d = new Date(str);
	d.setHours(d.getHours() + 2);
	return d.toISOString().replace('T', ' ').substr(0, 16);
}


function parseSensors (res) {
	const list = Object.values(res)
		.filter(s => (s.type === 'ZLLTemperature' || s.type === 'ZLLPresence'))
		.map(s => {
			s.id = s.uniqueid.split('-')[0];
			return s;
		});

	return list
		.filter(s => s.type === 'ZLLPresence')
		.map(p => {
			const temp = list.find(s => (s.id === p.id && s.type === 'ZLLTemperature'));
			return {
				name: p.name,
				temp: temp.state.temperature / 100,
				presence: p.state.presence,
				updated: parseDate(p.state.lastupdated),
				battery: p.config.battery,
			};
		});
}


function getTempSensors () {
	const url = `http://${config.ip}/api/${config.username}/sensors`;
	return fetch(url)
		.then(r => r.json())
		.then(parseSensors);
}


getTempSensors()
	.then(r => {
		const table = r.map(s => {
			const name = s.name.replace(' sensor', '');
			const presence = s.presence ? Msg.yellow('!') : '-';
			const temp = Math.round(s.temp * 10) / 10 + '°';
			return [name, temp, s.battery, presence, s.updated];
		});
		table.unshift(['Name', 'Temp', 'Battery', 'Presence', 'Updated']);
		Msg.table(table);
	});


