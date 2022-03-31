import * as net from 'net';

export async function findFreePort() {
	return new Promise<number>((resolve, reject) => {
		let port = 0;
		let server = net.createServer();
		server
			.on('listening', () => {
				const addrInfo = server.address();
				if (addrInfo === null || typeof addrInfo === 'string') {
					// According to the docs this may only happen if listening on a pipe or unix domain socket.
					// This should never be the case for us.
					return reject(new Error('No address info returned'));
				}
				port = addrInfo.port;
				server.close();
			})
			.on('close', () => {
				resolve(port);
			})
			.on('error', reject)
			.listen(0, '127.0.0.1');
	});
}

export function sleep(ms: number) {
	return new Promise(resolve => {
		setTimeout(resolve, ms);
	});
}
