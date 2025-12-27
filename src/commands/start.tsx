import React, { useState, useEffect } from 'react';
import { Text, Box } from 'ink';
import { startVm, getVmStatus } from '../lib/proxmox.js';

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
				// Check current status first
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

	if (status === 'starting') {
		return (
			<Box paddingY={1}>
				<Text color="yellow">Starting {typeLabel} {vmid}...</Text>
			</Box>
		);
	}

	if (status === 'already-running') {
		return (
			<Box paddingY={1}>
				<Text color="yellow">{typeLabel} {vmid} is already running</Text>
			</Box>
		);
	}

	if (status === 'error') {
		return (
			<Box paddingY={1}>
				<Text color="red">Failed to start {typeLabel} {vmid}: {error}</Text>
			</Box>
		);
	}

	return (
		<Box paddingY={1}>
			<Text color="green">{typeLabel} {vmid} started successfully</Text>
		</Box>
	);
}
