import React, { useState, useEffect } from 'react';
import { Text, Box } from 'ink';
import { stopVm, getVmStatus } from '../lib/proxmox.js';

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
				// Check current status first
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

	if (status === 'checking') {
		return (
			<Box paddingY={1}>
				<Text>Checking {vmid}...</Text>
			</Box>
		);
	}

	if (status === 'not-found') {
		return (
			<Box paddingY={1}>
				<Text color="red">VM/Container {vmid} not found</Text>
			</Box>
		);
	}

	if (status === 'stopping') {
		return (
			<Box paddingY={1}>
				<Text color="yellow">
					{force ? 'Force stopping' : 'Stopping'} {typeLabel} {vmid}...
				</Text>
			</Box>
		);
	}

	if (status === 'already-stopped') {
		return (
			<Box paddingY={1}>
				<Text color="yellow">{typeLabel} {vmid} is already stopped</Text>
			</Box>
		);
	}

	if (status === 'error') {
		return (
			<Box paddingY={1}>
				<Text color="red">Failed to stop {typeLabel} {vmid}: {error}</Text>
			</Box>
		);
	}

	return (
		<Box paddingY={1}>
			<Text color="green">
				{typeLabel} {vmid} stopped successfully{force ? ' (forced)' : ''}
			</Text>
		</Box>
	);
}
