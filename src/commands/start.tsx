import React, { useState, useEffect } from 'react';
import { Text, Box } from 'ink';
import { startVm, getVmStatus } from '../lib/proxmox.js';

interface StartCommandProps {
	vmid: number;
}

export function StartCommand({ vmid }: StartCommandProps) {
	const [status, setStatus] = useState<'checking' | 'starting' | 'success' | 'error' | 'already-running'>('checking');
	const [error, setError] = useState<string>('');

	useEffect(() => {
		async function start() {
			try {
				// Check current status first
				const currentStatus = await getVmStatus(vmid);
				if (currentStatus === 'running') {
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

	if (status === 'checking') {
		return (
			<Box paddingY={1}>
				<Text>Checking VM {vmid}...</Text>
			</Box>
		);
	}

	if (status === 'starting') {
		return (
			<Box paddingY={1}>
				<Text color="yellow">Starting VM {vmid}...</Text>
			</Box>
		);
	}

	if (status === 'already-running') {
		return (
			<Box paddingY={1}>
				<Text color="yellow">VM {vmid} is already running</Text>
			</Box>
		);
	}

	if (status === 'error') {
		return (
			<Box paddingY={1}>
				<Text color="red">Failed to start VM {vmid}: {error}</Text>
			</Box>
		);
	}

	return (
		<Box paddingY={1}>
			<Text color="green">VM {vmid} started successfully</Text>
		</Box>
	);
}
