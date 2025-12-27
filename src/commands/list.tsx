import React, { useState, useEffect } from 'react';
import { Text, Box } from 'ink';
import { listVms } from '../lib/proxmox.js';
import { Loading, formatBytes, formatUptime } from '../lib/ui.js';
import type { VmInfo } from '../lib/types.js';

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
		return (
			<Box paddingY={1}>
				<Loading>Loading VMs and containers...</Loading>
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

	if (vms.length === 0) {
		return (
			<Box paddingY={1}>
				<Text dimColor>No VMs or containers found</Text>
			</Box>
		);
	}

	// Calculate column widths
	const idWidth = 6;
	const typeWidth = 4;
	const nameWidth = Math.max(16, ...vms.map((vm) => vm.name.length)) + 2;
	const nodeWidth = Math.max(8, ...vms.map((vm) => vm.node.length)) + 2;
	const statusWidth = 10;
	const cpuWidth = 5;
	const memWidth = 18;
	const uptimeWidth = 10;

	const vmCount = vms.filter((v) => v.type === 'qemu').length;
	const ctCount = vms.filter((v) => v.type === 'lxc').length;
	const runningCount = vms.filter((v) => v.status === 'running').length;

	return (
		<Box flexDirection="column" paddingY={1}>
			{/* Header */}
			<Box marginBottom={1}>
				<Text bold color="magenta">▲ pxc </Text>
				<Text bold>list</Text>
			</Box>

			{/* Table Header */}
			<Text bold dimColor>
				{'ID'.padEnd(idWidth)}
				{''.padEnd(typeWidth)}
				{'NAME'.padEnd(nameWidth)}
				{'NODE'.padEnd(nodeWidth)}
				{'STATUS'.padEnd(statusWidth)}
				{'CPU'.padEnd(cpuWidth)}
				{'MEMORY'.padEnd(memWidth)}
				{'UPTIME'}
			</Text>

			{/* VMs and Containers */}
			{vms.map((vm) => (
				<Box key={vm.vmid}>
					<Text dimColor>{String(vm.vmid).padEnd(idWidth)}</Text>
					<Text color={vm.type === 'qemu' ? 'blue' : 'magenta'}>
						{(vm.type === 'qemu' ? 'VM' : 'CT').padEnd(typeWidth)}
					</Text>
					<Text bold>{vm.name.padEnd(nameWidth)}</Text>
					<Text dimColor>{vm.node.padEnd(nodeWidth)}</Text>
					<Text color={vm.status === 'running' ? 'green' : vm.status === 'stopped' ? 'gray' : 'yellow'}>
						{vm.status.padEnd(statusWidth)}
					</Text>
					<Text>{String(vm.cpus).padEnd(cpuWidth)}</Text>
					<Text dimColor>
						{`${formatBytes(vm.mem)} / ${formatBytes(vm.maxmem)}`.padEnd(memWidth)}
					</Text>
					<Text dimColor>{formatUptime(vm.uptime)}</Text>
				</Box>
			))}

			{/* Summary */}
			<Box marginTop={1}>
				<Text dimColor>
					{vms.length} total
					<Text color="blue"> • {vmCount} VMs</Text>
					<Text color="magenta"> • {ctCount} CTs</Text>
					<Text color="green"> • {runningCount} running</Text>
				</Text>
			</Box>
		</Box>
	);
}
