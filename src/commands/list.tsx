import React, { useState, useEffect } from 'react';
import { Text, Box } from 'ink';
import { listVms } from '../lib/proxmox.js';
import type { VmInfo } from '../lib/types.js';

function formatBytes(bytes: number): string {
	if (bytes === 0) return '0 B';
	const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
	const i = Math.floor(Math.log(bytes) / Math.log(1024));
	return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
}

function formatUptime(seconds: number): string {
	if (seconds === 0) return '-';
	const days = Math.floor(seconds / 86400);
	const hours = Math.floor((seconds % 86400) / 3600);
	if (days > 0) return `${days}d ${hours}h`;
	const minutes = Math.floor((seconds % 3600) / 60);
	if (hours > 0) return `${hours}h ${minutes}m`;
	return `${minutes}m`;
}

function StatusBadge({ status }: { status: string }) {
	if (status === 'running') {
		return <Text color="green">{status}</Text>;
	} else if (status === 'stopped') {
		return <Text color="gray">{status}</Text>;
	} else {
		return <Text color="yellow">{status}</Text>;
	}
}

export function ListCommand() {
	const [vms, setVms] = useState<VmInfo[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string>('');

	useEffect(() => {
		listVms()
			.then((data) => {
				setVms(data.sort((a, b) => a.vmid - b.vmid));
				setLoading(false);
			})
			.catch((err) => {
				setError(err.message);
				setLoading(false);
			});
	}, []);

	if (loading) {
		return <Text>Loading VMs...</Text>;
	}

	if (error) {
		return <Text color="red">Error: {error}</Text>;
	}

	if (vms.length === 0) {
		return <Text dimColor>No VMs found</Text>;
	}

	// Calculate column widths
	const idWidth = 6;
	const nameWidth = Math.max(20, ...vms.map((vm) => vm.name.length)) + 2;
	const statusWidth = 10;
	const cpuWidth = 6;
	const memWidth = 16;
	const uptimeWidth = 10;

	return (
		<Box flexDirection="column" paddingY={1}>
			{/* Header */}
			<Box>
				<Text bold color="cyan">
					<Text>{' ID'.padEnd(idWidth)}</Text>
					<Text>{'NAME'.padEnd(nameWidth)}</Text>
					<Text>{'STATUS'.padEnd(statusWidth)}</Text>
					<Text>{'CPUS'.padEnd(cpuWidth)}</Text>
					<Text>{'MEMORY'.padEnd(memWidth)}</Text>
					<Text>{'UPTIME'.padEnd(uptimeWidth)}</Text>
				</Text>
			</Box>

			{/* VMs */}
			{vms.map((vm) => (
				<Box key={vm.vmid}>
					<Text>
						<Text>{String(vm.vmid).padEnd(idWidth)}</Text>
						<Text>{vm.name.padEnd(nameWidth)}</Text>
					</Text>
					<Box width={statusWidth}>
						<StatusBadge status={vm.status} />
					</Box>
					<Text>
						<Text>{String(vm.cpus).padEnd(cpuWidth)}</Text>
						<Text>{`${formatBytes(vm.mem)}/${formatBytes(vm.maxmem)}`.padEnd(memWidth)}</Text>
						<Text>{formatUptime(vm.uptime)}</Text>
					</Text>
				</Box>
			))}

			{/* Summary */}
			<Box marginTop={1}>
				<Text dimColor>
					{vms.length} VM{vms.length !== 1 ? 's' : ''} ({vms.filter((v) => v.status === 'running').length} running)
				</Text>
			</Box>
		</Box>
	);
}
