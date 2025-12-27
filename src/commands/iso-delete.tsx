import React, { useState, useEffect } from 'react';
import { Text, Box } from 'ink';
import { deleteIso, listAllIsos } from '../lib/proxmox.js';
import { Loading, Success, ErrorMessage } from '../lib/ui.js';

interface IsoDeleteCommandProps {
	name: string;
}

export function IsoDeleteCommand({ name }: IsoDeleteCommandProps) {
	const [status, setStatus] = useState<'finding' | 'deleting' | 'success' | 'error' | 'not-found'>('finding');
	const [error, setError] = useState<string>('');
	const [volid, setVolid] = useState<string>('');

	useEffect(() => {
		async function del() {
			try {
				const isos = await listAllIsos();
				// Sort alphabetically to match the list command order
				const sortedIsos = isos.sort((a, b) => a.filename.localeCompare(b.filename));

				let iso;
				const index = parseInt(name, 10);
				if (!isNaN(index) && index > 0 && index <= sortedIsos.length) {
					// Lookup by index (1-based)
					iso = sortedIsos[index - 1];
				} else {
					// Lookup by name or volid
					iso = sortedIsos.find(
						(i) => i.filename === name || i.volid === name || i.filename.toLowerCase() === name.toLowerCase()
					);
				}

				if (!iso) {
					setStatus('not-found');
					return;
				}

				setVolid(iso.volid);
				setStatus('deleting');

				await deleteIso(iso.volid);
				setStatus('success');
			} catch (err: any) {
				setError(err.message);
				setStatus('error');
			}
		}
		del();
	}, [name]);

	return (
		<Box flexDirection="column" paddingY={1}>
			<Box marginBottom={1}>
				<Text bold color="magenta">▲ pxc </Text>
				<Text bold>iso delete {name}</Text>
			</Box>

			{status === 'finding' && <Loading>Finding ISO...</Loading>}

			{status === 'not-found' && <ErrorMessage>ISO not found: {name}</ErrorMessage>}

			{status === 'deleting' && <Loading>Deleting {volid}...</Loading>}

			{status === 'error' && <ErrorMessage>Failed to delete: {error}</ErrorMessage>}

			{status === 'success' && <Success>Deleted {volid}</Success>}
		</Box>
	);
}
