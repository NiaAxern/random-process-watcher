/** @format */
import Table from 'cli-table';
import moment from 'moment';

const args = process.argv.slice(2);
if (args.length == 0)
	throw new Error(
		'Please give a command, like start, stop, restart or list...',
	);
const getStart = args[0].startsWith('--') == false ? args[0] : null;
if (!getStart)
	throw new Error(
		'Please give a valid command, like start, stop, restart or list...',
	);
console.log({ args, getStart });

if (getStart == 'list') {
	const getList: {
		id: number;
		name: string;
		cwd: string;
		scriptCode: string;
		isRunning: boolean;
		pid: number;
		uptime: number;
		restarts: number;
		stats: any;
		processData: any;
	}[] = await fetch('http://localhost:6400/listprocesses').then((resp) =>
		resp.json(),
	);

	// instantiate
	var table = new Table({
		head: ['id', 'name', 'running', 'pid', 'when started', 'restarts'],
	});

	// table is an Array, so you can `push`, `unshift`, `splice` and friends
	for (let i of getList) {
		table.push([
			i.id.toString(),
			i.name.toString(),
			i.isRunning.toString(),
			i.pid.toString(),
			moment(i.uptime).fromNow(),
			i.restarts.toString(),
		]);
	}

	console.log(table.toString());
} else if (getStart == 'start') {
	const uri = new URL('http://localhost:6400/start/script');
	if (!args[1].includes(' ')) {
		uri.searchParams.set('scriptCode', `bun run ${args[1].replace('.\\', '')}`);
	} else {
		uri.searchParams.set('scriptCode', args[1]);
	}
	uri.searchParams.set('cwd', process.cwd());
	uri.searchParams.set('name', args[2] ?? args[1].replace('.\\', ''));
	console.log(decodeURIComponent(uri.href));
	console.log(uri.searchParams.get('scriptCode'));
	await fetch(uri.href)
		.then((resp) => resp.json())
		.then(console.log);

	const getList: {
		id: number;
		name: string;
		cwd: string;
		scriptCode: string;
		isRunning: boolean;
		pid: number;
		uptime: number;
		restarts: number;
		stats: any;
		processData: any;
	}[] = await fetch('http://localhost:6400/listprocesses').then((resp) =>
		resp.json(),
	);

	// instantiate
	var table = new Table({
		head: ['id', 'name', 'running', 'pid', 'when started', 'restarts'],
	});

	// table is an Array, so you can `push`, `unshift`, `splice` and friends
	for (let i of getList) {
		table.push([
			i.id.toString(),
			i.name.toString(),
			i.isRunning.toString(),
			i.pid.toString(),
			moment(i.uptime).fromNow(),
			i.restarts.toString(),
		]);
	}

	console.log(table.toString());
} else {
	throw new Error('Command not found.');
}
