import React, { useState, useEffect } from 'react';
import { Text, Box } from 'ink';
import { listAllIsos } from '../lib/proxmox.js';
import { Loading, formatBytes } from '../lib/ui.js';
import type { IsoFile } from '../lib/types.js';

export function IsoListCommand() {
	const [isos, setIsos] = useState<IsoFile[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string>('');

	useEffect(() => {
		listAllIsos()
			.then((data) => {
				setIsos(data.sort((a, b) => a.filename.localeCompare(b.filename)));
				setLoading(false);
			})
			.catch((err) => {
				setError(err.message);
				setLoading(false);
			});
	}, []);

	if (loading) {
		return (
			<Box paddingY={1}>
				<Loading>Loading ISOs...</Loading>
			</Box>
		);
	}

	if (error) {
		return (
			<Box paddingY={1}>
				<Text color="red">✗ Error: {error}</Text>
			</Box>
		);
	}

	if (isos.length === 0) {
		return (
			<Box flexDirection="column" paddingY={1}>
				<Box marginBottom={1}>
					<Text bold color="magenta">▲ pxc </Text>
					<Text bold>iso list</Text>
				</Box>
				<Text dimColor>No ISOs found</Text>
			</Box>
		);
	}

	const indexWidth = 4;
	const nameWidth = Math.max(30, ...isos.map((iso) => iso.filename.length)) + 2;
	const storageWidth = Math.max(10, ...isos.map((iso) => iso.storage.length)) + 2;

	return (
		<Box flexDirection="column" paddingY={1}>
			<Box marginBottom={1}>
				<Text bold color="magenta">▲ pxc </Text>
				<Text bold>iso list</Text>
			</Box>

			<Text bold dimColor>
				{'#'.padEnd(indexWidth)}
				{'NAME'.padEnd(nameWidth)}
				{'STORAGE'.padEnd(storageWidth)}
				{'SIZE'}
			</Text>

			{isos.map((iso, index) => (
				<Box key={iso.volid}>
					<Text color="cyan">{String(index + 1).padEnd(indexWidth)}</Text>
					<Text bold>{iso.filename.padEnd(nameWidth)}</Text>
					<Text dimColor>{iso.storage.padEnd(storageWidth)}</Text>
					<Text>{formatBytes(iso.size)}</Text>
				</Box>
			))}

			<Box marginTop={1}>
				<Text dimColor>
					{isos.length} ISO{isos.length !== 1 ? 's' : ''} • delete by # or name
				</Text>
			</Box>
		</Box>
	);
}
