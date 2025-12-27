import React, { useState, useEffect } from 'react';
import { Text, Box } from 'ink';
import { stopVm, getVmStatus } from '../lib/proxmox.js';
import { Loading, Success, ErrorMessage, Warning } from '../lib/ui.js';

interface StopCommandProps {
	vmid: number;
	force: boolean;
}

export function StopCommand({ vmid, force }: StopCommandProps) {
	const [status, setStatus] = useState<'checking' | 'stopping' | 'success' | 'error' | 'already-stopped' | 'not-found'>('checking');
	const [error, setError] = useState<string>('');
	const [vmType, setVmType] = useState<'qemu' | 'lxc'>('qemu');

	useEffect(() => {
		async function stop() {
			try {
				const info = await getVmStatus(vmid);
				if (!info) {
					setStatus('not-found');
					return;
				}

				setVmType(info.type);

				if (info.status === 'stopped') {
					setStatus('already-stopped');
					return;
				}

				setStatus('stopping');
				await stopVm(vmid, force);
				setStatus('success');
			} catch (err: any) {
				setError(err.message);
				setStatus('error');
			}
		}
		stop();
	}, [vmid, force]);

	const typeLabel = vmType === 'lxc' ? 'Container' : 'VM';

	return (
		<Box flexDirection="column" paddingY={1}>
			<Box marginBottom={1}>
				<Text bold color="magenta">▲ pxc </Text>
				<Text bold>stop {vmid}{force ? ' --force' : ''}</Text>
			</Box>

			{status === 'checking' && <Loading>Checking {vmid}...</Loading>}

			{status === 'not-found' && <ErrorMessage>{typeLabel} {vmid} not found in cluster</ErrorMessage>}

			{status === 'stopping' && (
				<Loading>{force ? 'Force stopping' : 'Stopping'} {typeLabel} {vmid}...</Loading>
			)}

			{status === 'already-stopped' && <Warning>{typeLabel} {vmid} is already stopped</Warning>}

			{status === 'error' && <ErrorMessage>Failed to stop {typeLabel} {vmid}: {error}</ErrorMessage>}

			{status === 'success' && (
				<Success>{typeLabel} {vmid} stopped{force ? ' (forced)' : ''}</Success>
			)}
		</Box>
	);
}
