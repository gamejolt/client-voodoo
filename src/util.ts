import * as net from 'net';

export async function findFreePort() {
	return new Promise<number>((resolve, reject) => {
		let port = 0;
		let server = net.createServer();
		server
			.on('listening', () => {
				port = server.address().port;
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
