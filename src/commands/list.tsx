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
		return <Text>Loading...</Text>;
	}

	if (error) {
		return <Text color="red">Error: {error}</Text>;
	}

	if (vms.length === 0) {
		return <Text dimColor>No VMs or containers found</Text>;
	}

	// Calculate column widths
	const idWidth = 6;
	const typeWidth = 5;
	const nameWidth = Math.max(16, ...vms.map((vm) => vm.name.length)) + 2;
	const nodeWidth = Math.max(8, ...vms.map((vm) => vm.node.length)) + 2;
	const statusWidth = 10;
	const cpuWidth = 6;
	const memWidth = 16;
	const uptimeWidth = 10;

	const vmCount = vms.filter((v) => v.type === 'qemu').length;
	const ctCount = vms.filter((v) => v.type === 'lxc').length;
	const runningCount = vms.filter((v) => v.status === 'running').length;

	return (
		<Box flexDirection="column" paddingY={1}>
			{/* Header */}
			<Text bold color="cyan">
				{' ID'.padEnd(idWidth)}
				{'TYPE'.padEnd(typeWidth)}
				{'NAME'.padEnd(nameWidth)}
				{'NODE'.padEnd(nodeWidth)}
				{'STATUS'.padEnd(statusWidth)}
				{'CPUS'.padEnd(cpuWidth)}
				{'MEMORY'.padEnd(memWidth)}
				{'UPTIME'}
			</Text>

			{/* VMs and Containers */}
			{vms.map((vm) => (
				<Box key={vm.vmid}>
					<Text>{String(vm.vmid).padEnd(idWidth)}</Text>
					<Text>{(vm.type === 'qemu' ? 'VM' : 'CT').padEnd(typeWidth)}</Text>
					<Text>{vm.name.padEnd(nameWidth)}</Text>
					<Text dimColor>{vm.node.padEnd(nodeWidth)}</Text>
					<Text color={vm.status === 'running' ? 'green' : vm.status === 'stopped' ? 'gray' : 'yellow'}>
						{vm.status.padEnd(statusWidth)}
					</Text>
					<Text>{String(vm.cpus).padEnd(cpuWidth)}</Text>
					<Text>{`${formatBytes(vm.mem)}/${formatBytes(vm.maxmem)}`.padEnd(memWidth)}</Text>
					<Text>{formatUptime(vm.uptime)}</Text>
				</Box>
			))}

			{/* Summary */}
			<Box marginTop={1}>
				<Text dimColor>
					{vms.length} total ({vmCount} VMs, {ctCount} containers) - {runningCount} running
				</Text>
			</Box>
		</Box>
	);
}
