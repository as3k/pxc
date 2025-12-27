import React, { useState, useEffect } from 'react';
import { Text, Box } from 'ink';
import { startVm, getVmStatus } from '../lib/proxmox.js';
import { Loading, Success, ErrorMessage, Warning } from '../lib/ui.js';

interface StartCommandProps {
	vmid: number;
}

export function StartCommand({ vmid }: StartCommandProps) {
	const [status, setStatus] = useState<'checking' | 'starting' | 'success' | 'error' | 'already-running' | 'not-found'>('checking');
	const [error, setError] = useState<string>('');
	const [vmType, setVmType] = useState<'qemu' | 'lxc'>('qemu');

	useEffect(() => {
		async function start() {
			try {
				const info = await getVmStatus(vmid);
				if (!info) {
					setStatus('not-found');
					return;
				}

				setVmType(info.type);

				if (info.status === 'running') {
					setStatus('already-running');
					return;
				}

				setStatus('starting');
				await startVm(vmid);
				setStatus('success');
			} catch (err: any) {
				setError(err.message);
				setStatus('error');
			}
		}
		start();
	}, [vmid]);

	const typeLabel = vmType === 'lxc' ? 'Container' : 'VM';

	return (
		<Box flexDirection="column" paddingY={1}>
			<Box marginBottom={1}>
				<Text bold color="magenta">▲ pxc </Text>
				<Text bold>start {vmid}</Text>
			</Box>

			{status === 'checking' && <Loading>Checking {vmid}...</Loading>}

			{status === 'not-found' && <ErrorMessage>{typeLabel} {vmid} not found in cluster</ErrorMessage>}

			{status === 'starting' && <Loading>Starting {typeLabel} {vmid}...</Loading>}

			{status === 'already-running' && <Warning>{typeLabel} {vmid} is already running</Warning>}

			{status === 'error' && <ErrorMessage>Failed to start {typeLabel} {vmid}: {error}</ErrorMessage>}

			{status === 'success' && <Success>{typeLabel} {vmid} started</Success>}
		</Box>
	);
}
