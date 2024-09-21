/** @format */

import { $, type Subprocess } from 'bun';

/** @format */
const runningScripts: {
	id: number;
	name: string;
	cwd: string;
	scriptCode: string; // ex. bun run dev or bun run start
	isRunning: boolean;
	pid: number;
	uptime: number;
	restarts: number;
	stats: any;
	processData: Subprocess<'ignore', 'pipe', 'inherit'>;
}[] = await Bun.file('runningScripts.json')
	.json()
	.catch(() => []);
// if errors just... ignore
for await(let i of runningScripts) {
    await restartprocess(i.id);
}
// Run server,
// this file will also do everything related to
// > restarting, starting and stopping processes
import { spawn } from 'child_process';
const server = Bun.serve({
	port: 6400,
	async fetch(req) {
		const url = new URL(req.url);
		if (url.pathname == '/restart/server') {
			setTimeout(() => {
				server.stop();
				const server2 = spawn('bun', ['src/server.ts'], {
					stdio: 'inherit',
					shell: true,
					detached: true,
				});
				console.log('running');

				process.exit(0); // die
			}, 100);
			return new Response('ok', { status: 200 });
		} else if (
			url.pathname == '/start/script' &&
			url.searchParams.get('scriptCode') &&
			url.searchParams.get('cwd') &&
			url.searchParams.get('name')
		) {
			const scriptCode = decodeURIComponent(
				url.searchParams.get('scriptCode') as string,
			);
			const cwd = decodeURIComponent(url.searchParams.get('cwd') as string);
			const name = decodeURIComponent(url.searchParams.get('name') as string);
			console.log({ scriptCode, cwd, name });
			await spawnprocess(scriptCode, cwd, name);
			return Response.json(
				runningScripts?.[runningScripts?.length - 1] ?? { true: false },
			);
		} else if (
			url.pathname == '/restart/processbyid' &&
			url.searchParams.get('id')
		) {
			// get process
			const id = parseInt(
				decodeURIComponent(url.searchParams.get('id') as string),
			);
			await restartprocess(id);
			return Response.json(runningScripts.find((script) => script.id === id));
		} else if (url.pathname == '/listprocesses') {
			return Response.json(runningScripts);
		} else if (url.pathname == '/path') {
			return Response.json(process.env);
		}
		return new Response(
			'Page not found\nServer restarted ' +
				Math.floor(performance.now() / 1000) +
				' seconds ago',
			{ status: 404 },
		);
	},
});

console.log(`Listening on ${server.url}`);

async function spawnprocess(scriptCode: string, cwd: string, name: string) {
	try {
		let [interpreter, ...args] = scriptCode.split(' ');
		let isError = false;
		await $`which ${interpreter}`
			.then((resp) => resp.text())
			.then((resp) => {
				interpreter = resp.trim();
			})
			.catch((e) => {
				isError = true;
				console.error(e);
			});
		console.log(interpreter, 'interpreter');
		console.log(args, 'args');
		if (isError != false) return 'big penis';
		var dfvs =
			(runningScripts.toSorted((a, b) => b.id - a.id)?.[0]?.id ?? 0) + 1;
		const child = Bun.spawn([interpreter, ...args], {
			env: process.env,
			cwd,
			onExit: (proc, exitCode, signalCode, error) => {
				console.log('exited', exitCode, signalCode, error);
				console.log('Lets restart this shit!');
				restartprocess(dfvs); // kms
			},
		});
		console.log('spawned child wtf??????????????????????????????????');
		runningScripts.push({
			id: (runningScripts.toSorted((a, b) => b.id - a.id)?.[0]?.id ?? 0) + 1,
			name,
			cwd,
			scriptCode: scriptCode,
			isRunning: true,
			pid: child.pid,
			uptime: Date.now(), // started
			restarts: 0,
			stats: {},
			processData: child,
		});
		// and lastly, write to file
		await Bun.write('runningScripts.json', JSON.stringify(runningScripts));
		console.log('Spawned process with pid', child.pid);
		return child;
	} catch (e) {
		console.error(e);
	}
}

async function killprocess(id: number) {
	// basically stop process by id yk yk
	const process = runningScripts.find((p) => p.id == id);
	if (!process) return;
	process.isRunning = false;
	process.processData.kill();
	// and lastly, write to file
	await Bun.write('runningScripts.json', JSON.stringify(runningScripts));
	console.log('Killed process with pid', process.pid);
}

async function restartprocess(id: number) {
	let processx = runningScripts.find((p) => p.id == id);
	if (!processx) return;
	let processIdx = runningScripts.findIndex((p) => p.id == id);
	processx.restarts++;
	processx.uptime = Date.now();
	try {
		processx.processData.kill();
	} catch (e) {
		console.error(e);
	}
	let [interpreter, ...args] = processx.scriptCode.split(' ');
	let isError = false;
	await $`which ${interpreter}`
		.then((resp) => resp.text())
		.then((resp) => {
			interpreter = resp.trim();
		})
		.catch((e) => {
			isError = true;
			console.error(e);
		});
	console.log(interpreter, 'interpreter');
	console.log(args, 'args');
	if (isError != false) return 'big penis';
	const child = Bun.spawn([interpreter, ...args], {
		env: process.env,
		cwd: processx.cwd,
		onExit: (proc, exitCode, signalCode, error) => {
			console.log('exited', exitCode, signalCode, error);
			console.log('Lets restart this shit!');
			restartprocess(processx.id); // kms
		},
	});
	runningScripts[processIdx] = {
		...processx,
		isRunning: true,
		pid: child.pid,
		processData: child,
	};
	// and lastly, write to file
	await Bun.write('runningScripts.json', JSON.stringify(runningScripts));
	console.log('Restarted process with pid', runningScripts[processIdx].pid);
}
