/** @format */

import { $ } from 'bun';
import os from 'os';

const pl = os.platform();
console.log('Operating System:', pl);

if (pl != 'win32' && pl != 'linux')
	throw new Error('Platform not supported: ' + os.platform());

await $`bun build ./src/index.ts --outfile watchproc --compile`;
if (pl == 'linux') {
	await $`chmod +x ./watchproc`;
	// add to path
	await $`cp ./watchproc /usr/local/bin/watchproc`;
	await $`chmod +x /usr/local/bin/watchproc`;
} else if (pl == 'win32') {
	console.log(process.cwd());
	const getCurPath = (await $`where watchproc`.text()).trim();
    console.log(getCurPath);
	if (getCurPath.includes("watchproc")) {
		console.log('already added to path.');
		process.exit(0);
	}
	await $`setx path "%PATH%;${process.cwd()}"`;
}
console.log("okay, if you saw 0 errors, everything went smoothly and is ready to be used!")
