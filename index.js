#!/usr/bin/env node

const chalk = require('chalk');
const fetch = require('node-fetch');
const Msg = require('node-msg');
const Args = require('arg-parser');
const config = require('./config.json');
const fs = require('fs');
const path = require('path');
const CSV_FILE = path.resolve(__dirname, 'src/data.csv');
const LOG_FILE = path.resolve(__dirname, 'src/data.log');

const error = msg => console.error(chalk.red(msg));

function getWeather (resp = {}) {
	const apiurl = 'http://api.openweathermap.org/data/2.5/weather';
	const appid = config.weather_appid;
	const town = encodeURIComponent(config.location || 'Dublin, Ireland');
	const url = `${apiurl}?appid=${appid}&units=metric&q=${town}`;

	return fetch(url, { timeout: 1000 })
		.then(r => r.json())
		.then(r => {
			resp.outsideTemp = r.main.temp;
			return resp;
		})
		.catch(() => error('Weather API is not available'));
}

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
	return fetch(url, { timeout: 1000 })
		.then(r => r.json())
		.then(parseSensors)
		.catch(() => error('Sensors are not available in your network'));
}


function writeTable (r) {
	const table = r.map(s => {
		const name = s.name.replace(' sensor', '');
		const presence = s.presence ? Msg.yellow('!') : '-';
		const temp = Math.round(s.temp * 10) / 10 + '°';
		return [name, temp, s.battery, presence, s.updated];
	});
	table.unshift(['Name', 'Temp', 'Battery', 'Presence', 'Updated']);
	Msg.log('\nOutside temp: ' + r.outsideTemp + '°C\n');
	Msg.table(table);
}


function writeCsv (r, params) {
	if (!fs.existsSync(CSV_FILE)) {
		const hdr = ['Date', ...r.map(s => s.name), 'Outside temp'].join(',') + '\n';
		fs.writeFileSync(CSV_FILE, hdr, 'utf8');
		console.log(CSV_FILE, 'created');
	}
	const line = [new Date().toISOString(), ...r.map(s => s.temp), r.outsideTemp].join(',');
	fs.appendFileSync(CSV_FILE, line + '\n', 'utf8');
	const [m, d, y] = (new Date()).toLocaleDateString().split('/');
	const  D = `${y}-${m}-${d}`;
	const T = (new Date()).toLocaleTimeString();
	const f = CSV_FILE.split('/').pop();
	const log = `[${D} ${T}] Added "${line}" to "${f}"`;
	if (!params.log) console.log(log);
	else fs.appendFileSync(LOG_FILE, log + '\n', 'utf8');
}


function run (params) {
	getTempSensors()
		.then(getWeather)
		.then(r => {
			if (!r) return;
			if (params.csv) writeCsv(r, params);
			else writeTable(r);
		})
		.catch(() => {});
}



const args = new Args('hue', '1.0', 'Philips Hue temperature sensor logger');
args.add({ name: 'csv', desc: 'save data to csv', switches: [ '-c', '--csv'] });
args.add({ name: 'log', desc: 'maintain a log file for csv operations', switches: [ '-l', '--log'] });
if (args.parse()) run(args.params);
