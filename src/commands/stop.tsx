import React, { useState, useEffect } from 'react';
import { Text, Box } from 'ink';
import { stopVm, getVmStatus } from '../lib/proxmox.js';

interface StopCommandProps {
	vmid: number;
	force: boolean;
}

export function StopCommand({ vmid, force }: StopCommandProps) {
	const [status, setStatus] = useState<'checking' | 'stopping' | 'success' | 'error' | 'already-stopped'>('checking');
	const [error, setError] = useState<string>('');

	useEffect(() => {
		async function stop() {
			try {
				// Check current status first
				const currentStatus = await getVmStatus(vmid);
				if (currentStatus === 'stopped') {
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

	if (status === 'checking') {
		return (
			<Box paddingY={1}>
				<Text>Checking VM {vmid}...</Text>
			</Box>
		);
	}

	if (status === 'stopping') {
		return (
			<Box paddingY={1}>
				<Text color="yellow">
					{force ? 'Force stopping' : 'Stopping'} VM {vmid}...
				</Text>
			</Box>
		);
	}

	if (status === 'already-stopped') {
		return (
			<Box paddingY={1}>
				<Text color="yellow">VM {vmid} is already stopped</Text>
			</Box>
		);
	}

	if (status === 'error') {
		return (
			<Box paddingY={1}>
				<Text color="red">Failed to stop VM {vmid}: {error}</Text>
			</Box>
		);
	}

	return (
		<Box paddingY={1}>
			<Text color="green">
				VM {vmid} stopped successfully{force ? ' (forced)' : ''}
			</Text>
		</Box>
	);
}
