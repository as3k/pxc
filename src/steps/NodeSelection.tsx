import React, { useState, useEffect, useMemo } from 'react';
import { Text, Box } from 'ink';
import SelectInput from 'ink-select-input';
import { getClusterNodes, isClusterEnvironment, getNodeName, getPreferredNode } from '../lib/proxmox.js';
import { getResolvedDefaults } from '../lib/config.js';

import type { StepProps } from '../lib/types.js';

export function NodeSelection({ onNext, packageName }: StepProps) {
	const defaults = useMemo(() => getResolvedDefaults(packageName), [packageName]);
	const [nodes, setNodes] = useState<Array<{ label: string; value: string }>>([]);
	const [initialIndex, setInitialIndex] = useState(0);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string>('');
	const [isSingleNode, setIsSingleNode] = useState(false);
	const [currentNode, setCurrentNode] = useState<string>('');

	useEffect(() => {
		async function init() {
			try {
				// Check if we're in a cluster environment
				const cluster = await isClusterEnvironment();
				
				if (!cluster) {
					// Single node environment, auto-advance with preferred node
					const preferred = await getPreferredNode();
					setIsSingleNode(true);
					setTimeout(() => onNext({ node: preferred }), 100);
					return;
				}

				// Get cluster nodes and current node
				const [clusterNodes, current] = await Promise.all([
					getClusterNodes(),
					getNodeName()
				]);

				setCurrentNode(current);

				// Filter to only online nodes
				const onlineNodes = clusterNodes.filter(n => n.status === 'online');
				
				if (onlineNodes.length === 0) {
					setError('No online nodes available in cluster');
					setLoading(false);
					return;
				}

				// Create options with status indicators
				const options = onlineNodes.map((node) => ({
					label: `${node.name}${node.name === current ? ' (current)' : ''}`,
					value: node.name,
				}));

				setNodes(options);

				// Set initial selection based on defaults or current node
				let selectedIndex = 0;
				const preferredNode = defaults.node || current;
				
				if (preferredNode) {
					const idx = options.findIndex(o => o.value === preferredNode);
					if (idx >= 0) selectedIndex = idx;
				}

				setInitialIndex(selectedIndex);
				setLoading(false);

			} catch (err) {
				setError('Failed to load cluster nodes');
				setLoading(false);
			}
		}

		init();
	}, [defaults.node, onNext]);

	if (isSingleNode) {
		return (
			<Box flexDirection="column" paddingY={1}>
				<Text dimColor>Single node environment detected...</Text>
			</Box>
		);
	}

	if (loading) {
		return (
			<Box flexDirection="column" paddingY={1}>
				<Text dimColor>Loading cluster nodes...</Text>
			</Box>
		);
	}

	if (error) {
		return (
			<Box flexDirection="column" paddingY={1}>
				<Text color="red">{error}</Text>
			</Box>
		);
	}

	return (
		<Box flexDirection="column" paddingY={1}>
			<Text>Select target node for VM</Text>
			{defaults.node && <Text dimColor> (default: {defaults.node})</Text>}
			{currentNode && <Text dimColor>Current node: {currentNode}</Text>}
			<SelectInput 
				items={nodes} 
				initialIndex={initialIndex} 
				onSelect={(item) => onNext({ node: item.value })} 
			/>
		</Box>
	);
}