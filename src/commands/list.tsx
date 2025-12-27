import React, { useState, useEffect } from 'react';
import { Text, Box } from 'ink';
import { listVms, getClusterNodes, isClusterEnvironment } from '../lib/proxmox.js';
import { Loading, formatBytes, formatUptime } from '../lib/ui.js';
import type { VmInfo, ClusterNode } from '../lib/types.js';

export function ListCommand() {
	const [vms, setVms] = useState<VmInfo[]>([]);
	const [nodes, setNodes] = useState<ClusterNode[]>([]);
	const [isCluster, setIsCluster] = useState(false);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string>('');

	useEffect(() => {
		async function loadData() {
			try {
				const [vmData, clusterData, clusterStatus] = await Promise.all([
					listVms(),
					getClusterNodes().catch(() => []), // Don't fail if no cluster
					isClusterEnvironment().catch(() => false)
				]);
				
				setVms(vmData.sort((a, b) => a.vmid - b.vmid));
				setNodes(clusterData);
				setIsCluster(clusterStatus);
				setLoading(false);
			} catch (err: any) {
				setError(err.message);
				setLoading(false);
			}
		}
		
		loadData();
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

	// Group VMs by node for cluster view
	const vmsByNode = isCluster ? vms.reduce((acc, vm) => {
		if (!acc[vm.node]) acc[vm.node] = [];
		acc[vm.node].push(vm);
		return acc;
	}, {} as Record<string, VmInfo[]>) : {};

	// Get node status
	const getNodeStatus = (nodeName: string) => {
		const node = nodes.find(n => n.name === nodeName);
		return node ? node.status : 'unknown';
	};

	const renderVmRow = (vm: VmInfo) => (
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
	);

	return (
		<Box flexDirection="column" paddingY={1}>
			{/* Header */}
			<Box marginBottom={1}>
				<Text bold color="magenta">▲ pxc </Text>
				<Text bold>list</Text>
				{isCluster && <Text dimColor> (cluster mode)</Text>}
			</Box>

			{/* Cluster Summary */}
			{isCluster && nodes.length > 0 && (
				<Box marginBottom={1}>
					<Text dimColor>
						Cluster: {nodes.filter(n => n.status === 'online').length}/{nodes.length} nodes online
						{nodes.map(n => (
							<Text key={n.name} color={n.status === 'online' ? 'green' : 'red'}>
								{' • '}{n.name}({n.status === 'online' ? '●' : '○'})
							</Text>
						))}
					</Text>
				</Box>
			)}

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

			{/* VMs and Containers - Group by node in cluster mode */}
			{isCluster && Object.keys(vmsByNode).length > 0 ? (
				Object.entries(vmsByNode).map(([nodeName, nodeVms]) => (
					<Box key={nodeName} flexDirection="column" marginBottom={1}>
						{Object.keys(vmsByNode).length > 1 && (
							<Text bold color={getNodeStatus(nodeName) === 'online' ? 'green' : 'red'}>
								{nodeName} ({nodeVms.length} VMs) {getNodeStatus(nodeName) === 'online' ? '●' : '○'}
							</Text>
						)}
						{nodeVms.map(renderVmRow)}
					</Box>
				))
			) : (
				vms.map(renderVmRow)
			)}

			{/* Summary */}
			<Box marginTop={1}>
				<Text dimColor>
					{vms.length} total
					<Text color="blue"> • {vmCount} VMs</Text>
					<Text color="magenta"> • {ctCount} CTs</Text>
					<Text color="green"> • {runningCount} running</Text>
					{isCluster && (
						<Text> • {nodes.filter(n => n.status === 'online').length}/{nodes.length} nodes online</Text>
					)}
				</Text>
			</Box>
		</Box>
	);
}
