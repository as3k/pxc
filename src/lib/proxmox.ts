import { execa } from 'execa';
import type { ProxmoxStorage, ProxmoxBridge, IsoFile, VmInfo, ClusterNode, VmConfig } from './types.js';

const MOCK_MODE = process.env.MOCK_PROXMOX === '1';

/**
 * Check if we're running on a Proxmox node
 */
export async function isProxmoxNode(): Promise<boolean> {
	if (MOCK_MODE) return true;

	try {
		await execa('which', ['qm']);
		return true;
	} catch {
		return false;
	}
}

/**
 * Get the next available VM ID
 */
export async function getNextVmid(): Promise<number> {
	if (MOCK_MODE) return 100;

	try {
		const { stdout } = await execa('pvesh', ['get', '/cluster/nextid']);
		return parseInt(stdout.trim(), 10);
	} catch (error) {
		throw new Error('Failed to get next VM ID. Are you on a Proxmox node?');
	}
}

/**
 * Check if a VM ID is already in use
 */
export async function isVmidAvailable(vmid: number): Promise<boolean> {
	if (MOCK_MODE) return true;

	try {
		await execa('qm', ['status', vmid.toString()]);
		return false; // VM exists
	} catch {
		return true; // VM doesn't exist
	}
}

/**
 * Get available storage pools that support VM disks
 */
export async function getStorages(node?: string): Promise<ProxmoxStorage[]> {
	if (MOCK_MODE) {
		// Return different storages for different nodes to simulate cluster differences
		if (node === 'node2') {
			return [
				{ name: 'local-lvm', type: 'lvmthin', available: true, content: ['images'] },
				{ name: 'ceph-pool', type: 'rbd', available: true, content: ['images'] },
				{ name: 'shared-storage', type: 'nfs', available: true, content: ['images', 'iso'] },
			];
		}
		return [
			{ name: 'local-lvm', type: 'lvmthin', available: true, content: ['images'] },
			{ name: 'ceph-pool', type: 'rbd', available: true, content: ['images'] },
			{ name: 'nfs-storage', type: 'nfs', available: true, content: ['images', 'iso'] },
		];
	}

	try {
		const { stdout } = await execa('pvesh', ['get', '/storage', '--output-format', 'json']);
		const data = JSON.parse(stdout);

		const storages: ProxmoxStorage[] = [];

		for (const storage of data) {
			// Only include storages that can hold VM disks (have 'images' in content)
			if (storage.content?.includes('images')) {
				storages.push({
					name: storage.storage,
					type: storage.type,
					available: true,
					content: storage.content.split(','),
				});
			}
		}

		return storages;
	} catch (error) {
		throw new Error('Failed to get storage list');
	}
}

/**
 * Get storages that can hold ISO files
 */
export async function getIsoStorages(node?: string): Promise<ProxmoxStorage[]> {
	if (MOCK_MODE) {
		// Return different storages for different nodes to simulate cluster differences
		if (node === 'node2') {
			return [
				{ name: 'local', type: 'dir', available: true, content: ['iso', 'images'] },
				{ name: 'shared-iso', type: 'nfs', available: true, content: ['iso'] },
			];
		}
		return [
			{ name: 'local', type: 'dir', available: true, content: ['iso', 'images'] },
			{ name: 'nfs-iso', type: 'nfs', available: true, content: ['iso'] },
		];
	}

	try {
		const { stdout } = await execa('pvesh', ['get', '/storage', '--output-format', 'json']);
		const data = JSON.parse(stdout);

		const storages: ProxmoxStorage[] = [];

		for (const storage of data) {
			// Only include storages that can hold ISO files
			if (storage.content?.includes('iso')) {
				storages.push({
					name: storage.storage,
					type: storage.type,
					available: true,
					content: storage.content.split(','),
				});
			}
		}

		return storages;
	} catch (error) {
		throw new Error('Failed to get ISO storage list');
	}
}

/**
 * Get available network bridges
 */
export async function getBridges(node?: string): Promise<ProxmoxBridge[]> {
	const targetNode = node || await getPreferredNode();
	
	if (MOCK_MODE) {
		// Return different bridges for different nodes to simulate cluster differences
		if (targetNode === 'node2') {
			return [
				{ name: 'vmbr0', active: true },
				{ name: 'vmbr2', active: true },
			];
		}
		return [
			{ name: 'vmbr0', active: true },
			{ name: 'vmbr1', active: true },
		];
	}

	try {
		const { stdout } = await execa('pvesh', ['get', `/nodes/${targetNode}/network`, '--type', 'bridge']);
		const data = JSON.parse(stdout);

		return data.map((bridge: any) => ({
			name: bridge.iface,
			active: bridge.active === 1,
		}));
	} catch (error) {
		// Fallback: parse /etc/network/interfaces or use common defaults
		return [{ name: 'vmbr0', active: true }];
	}
}

/**
 * Get ISO files from a storage
 */
export async function getIsoFiles(storage: string = 'local'): Promise<IsoFile[]> {
	if (MOCK_MODE) {
		return [
			{ volid: `${storage}:iso/alpine-3.18.iso`, filename: 'alpine-3.18.iso', size: 157286400, storage },
			{ volid: `${storage}:iso/debian-12.iso`, filename: 'debian-12.iso', size: 629145600, storage },
			{ volid: `${storage}:iso/ubuntu-24.04.iso`, filename: 'ubuntu-24.04.iso', size: 5771362304, storage },
		];
	}

	try {
		const { stdout } = await execa('pvesm', ['list', storage]);
		const lines = stdout.split('\n').slice(1); // Skip header

		const isos: IsoFile[] = [];

		for (const line of lines) {
			if (!line.includes('.iso')) continue;

			const parts = line.split(/\s+/);
			// Format: Volid Format Type Size [VMID]
			const [volid, , , size] = parts;
			const filename = volid.split('/').pop() || volid;

			isos.push({
				volid,
				filename,
				size: parseInt(size, 10),
				storage,
			});
		}

		return isos;
	} catch (error) {
		// Storage might not have ISOs, return empty
		return [];
	}
}

/**
 * Create a VM
 */
export async function createVm(config: VmConfig): Promise<void> {
	const { vmid, name, cores, memoryMb, diskGb, storage, bridge, isoVolid, node } = config;
	const targetNode = node || await getPreferredNode();

	if (process.env.MOCK_PROXMOX === '1' || MOCK_MODE) {
		// Simulate VM creation delay
		await new Promise((resolve) => setTimeout(resolve, 500));
		console.log(
			`[MOCK] Would create VM ${vmid} (${name}) on ${targetNode}: ${cores} cores, ${memoryMb}MB RAM, ${diskGb}GB disk on ${storage}, bridge ${bridge}${isoVolid ? `, ISO: ${isoVolid}` : ''}`
		);
		return;
	}

	try {
		// Step 1: Create the VM on the specified node
		await execa('qm', [
			'create',
			vmid.toString(),
			'--name',
			name,
			'--cores',
			cores.toString(),
			'--memory',
			memoryMb.toString(),
			'--net0',
			`virtio,bridge=${bridge}`,
		]);

		// Step 2: Add disk using slot notation (Ceph-safe)
		await execa('qm', [
			'set',
			vmid.toString(),
			'--scsi0',
			`${storage}:${diskGb}`,
		]);

		// Step 3: Set boot order
		await execa('qm', [
			'set',
			vmid.toString(),
			'--boot',
			'order=scsi0',
		]);

		// Step 4: Attach ISO if provided
		if (isoVolid) {
			await execa('qm', [
				'set',
				vmid.toString(),
				'--ide2',
				`${isoVolid},media=cdrom`,
			]);
		}
	} catch (error: any) {
		throw new Error(`VM creation failed: ${error.message}`);
	}
}

/**
 * Get all cluster nodes
 */
export async function getClusterNodes(): Promise<ClusterNode[]> {
	if (MOCK_MODE) {
		return [
			{ name: 'node1', status: 'online', ip: '192.168.1.101', level: 'c', id: 'node1', type: 'node' },
			{ name: 'node2', status: 'online', ip: '192.168.1.102', level: 'c', id: 'node2', type: 'node' },
			{ name: 'node3', status: 'offline', ip: '192.168.1.103', level: '', id: 'node3', type: 'node' },
		];
	}

	try {
		const { stdout } = await execa('pvesh', ['get', '/nodes', '--output-format', 'json']);
		const data = JSON.parse(stdout);

		return data.map((node: any) => ({
			name: node.node,
			status: node.status === 'online' ? 'online' : 'offline',
			ip: node.ip,
			level: node.level,
			id: node.id,
			type: node.type,
		}));
	} catch (error: any) {
		throw new Error(`Failed to get cluster nodes: ${error.message}`);
	}
}

/**
 * Check if we're in a cluster environment
 */
export async function isClusterEnvironment(): Promise<boolean> {
	if (MOCK_MODE) return true;

	try {
		const nodes = await getClusterNodes();
		return nodes.length > 1;
	} catch {
		return false;
	}
}

/**
 * Get node status
 */
export async function getNodeStatus(node: string): Promise<'online' | 'offline'> {
	if (MOCK_MODE) {
		// Mock some nodes as offline for testing
		return node === 'node3' ? 'offline' : 'online';
	}

	try {
		const { stdout } = await execa('pvesh', ['get', `/nodes/${node}/status`, '--output-format', 'json']);
		const data = JSON.parse(stdout);
		return data.status === 'online' ? 'online' : 'offline';
	} catch (error: any) {
		// If we can't get status, assume offline
		return 'offline';
	}
}

/**
 * Get current node name
 */
export async function getNodeName(): Promise<string> {
	if (MOCK_MODE) return 'mocknode';

	try {
		const { stdout } = await execa('hostname');
		return stdout.trim();
	} catch {
		return 'localhost';
	}
}

/**
 * Get the preferred node for operations (current node if in cluster, otherwise current hostname)
 */
export async function getPreferredNode(): Promise<string> {
	if (MOCK_MODE) return 'node1';

	const currentNode = await getNodeName();
	const isCluster = await isClusterEnvironment();
	
	if (isCluster) {
		// In a cluster, check if current node is part of the cluster
		const clusterNodes = await getClusterNodes();
		const currentNodeInCluster = clusterNodes.find(n => n.name === currentNode);
		
		if (currentNodeInCluster && currentNodeInCluster.status === 'online') {
			return currentNode;
		}
		
		// Fall back to the first online node
		const firstOnlineNode = clusterNodes.find(n => n.status === 'online');
		if (firstOnlineNode) {
			return firstOnlineNode.name;
		}
		
		// Last resort: use the first node in the cluster
		if (clusterNodes.length > 0) {
			return clusterNodes[0].name;
		}
	}
	
	return currentNode;
}

/**
 * List all VMs and containers across the cluster
 */
export async function listVms(): Promise<VmInfo[]> {
	if (MOCK_MODE) {
		return [
			{ vmid: 100, name: 'web-server', type: 'qemu', node: 'node1', status: 'running', mem: 2147483648, maxmem: 4294967296, cpus: 2, uptime: 86400 },
			{ vmid: 101, name: 'db-server', type: 'qemu', node: 'node2', status: 'running', mem: 4294967296, maxmem: 8589934592, cpus: 4, uptime: 172800 },
			{ vmid: 102, name: 'container-1', type: 'lxc', node: 'node1', status: 'running', mem: 1073741824, maxmem: 2147483648, cpus: 2, uptime: 259200 },
			{ vmid: 103, name: 'dev-box', type: 'qemu', node: 'node3', status: 'stopped', mem: 0, maxmem: 2147483648, cpus: 2, uptime: 0 },
		];
	}

	try {
		const { stdout } = await execa('pvesh', ['get', '/cluster/resources', '--type', 'vm', '--output-format', 'json']);
		const data = JSON.parse(stdout);

		return data.map((vm: any) => ({
			vmid: vm.vmid,
			name: vm.name || `VM ${vm.vmid}`,
			type: vm.type as 'qemu' | 'lxc',
			node: vm.node,
			status: vm.status as 'running' | 'stopped' | 'paused',
			mem: vm.mem || 0,
			maxmem: vm.maxmem || 0,
			cpus: vm.maxcpu || 0,
			uptime: vm.uptime || 0,
		}));
	} catch (error: any) {
		throw new Error(`Failed to list VMs: ${error.message}`);
	}
}

/**
 * List all ISOs across all ISO-capable storages
 */
export async function listAllIsos(): Promise<IsoFile[]> {
	if (MOCK_MODE) {
		return [
			{ volid: 'local:iso/alpine-3.18.iso', filename: 'alpine-3.18.iso', size: 157286400, storage: 'local' },
			{ volid: 'local:iso/debian-12.iso', filename: 'debian-12.iso', size: 629145600, storage: 'local' },
			{ volid: 'cephfs-iso:iso/ubuntu-24.04.iso', filename: 'ubuntu-24.04.iso', size: 5771362304, storage: 'cephfs-iso' },
		];
	}

	try {
		const storages = await getIsoStorages();
		const allIsos: IsoFile[] = [];

		for (const storage of storages) {
			const isos = await getIsoFiles(storage.name);
			allIsos.push(...isos.map((iso) => ({ ...iso, storage: storage.name })));
		}

		return allIsos;
	} catch (error: any) {
		throw new Error(`Failed to list ISOs: ${error.message}`);
	}
}

/**
 * Download progress callback
 */
export type DownloadProgressCallback = (progress: {
	percent: number;
	speed: string;
	eta: string;
	downloaded: number;
	total: number;
}) => void;

/**
 * Download an ISO from a URL to storage with progress tracking
 */
export async function downloadIso(
	url: string,
	storage: string,
	filename?: string,
	onProgress?: DownloadProgressCallback,
	node?: string
): Promise<string> {
	if (MOCK_MODE) {
		// Simulate download progress
		const fname = filename || url.split('/').pop() || 'download.iso';
		const total = 256 * 1024 * 1024; // 256MB fake size

		for (let i = 0; i <= 100; i += 5) {
			if (onProgress) {
				onProgress({
					percent: i,
					speed: '15.2 MB/s',
					eta: `${Math.ceil((100 - i) / 10)}s`,
					downloaded: Math.floor((total * i) / 100),
					total,
				});
			}
			await new Promise((resolve) => setTimeout(resolve, 100));
		}

		return `${storage}:iso/${fname}`;
	}

	try {
		const targetNode = node || await getPreferredNode();
		const fname = filename || url.split('/').pop() || 'download.iso';

		// Use execa with streaming to capture progress
		const subprocess = execa('pvesh', [
			'create',
			`/nodes/${targetNode}/storage/${storage}/download-url`,
			'--url', url,
			'--content', 'iso',
			'--filename', fname,
		]);

		// Parse wget progress from stderr/stdout
		if (onProgress && subprocess.stdout) {
			subprocess.stdout.on('data', (data: Buffer) => {
				const line = data.toString();

				// Parse wget progress: "32768K ........ ........ 26% 22.2M 8s"
				const match = line.match(/(\d+)%\s+([\d.]+[KMG]?(?:\/s)?)\s+(\d+[smh]?)/);
				if (match) {
					const percent = parseInt(match[1], 10);
					const speed = match[2];
					const eta = match[3];

					// Try to parse total from Length header
					const lengthMatch = line.match(/Length:\s*(\d+)/);
					const total = lengthMatch ? parseInt(lengthMatch[1], 10) : 0;

					onProgress({
						percent,
						speed,
						eta,
						downloaded: Math.floor((total * percent) / 100),
						total,
					});
				}
			});
		}

		await subprocess;
		return `${storage}:iso/${fname}`;
	} catch (error: any) {
		throw new Error(`Failed to download ISO: ${error.message}`);
	}
}

/**
 * Upload a local ISO file to storage
 */
export async function uploadIso(filePath: string, storage: string, node?: string): Promise<string> {
	if (MOCK_MODE) {
		await new Promise((resolve) => setTimeout(resolve, 1000));
		const filename = filePath.split('/').pop() || 'upload.iso';
		return `${storage}:iso/${filename}`;
	}

	try {
		const targetNode = node || await getPreferredNode();
		const filename = filePath.split('/').pop() || 'upload.iso';

		// Use the Proxmox upload endpoint
		await execa('pvesh', [
			'create',
			`/nodes/${targetNode}/storage/${storage}/upload`,
			'--content', 'iso',
			'--filename', filePath,
		]);

		return `${storage}:iso/${filename}`;
	} catch (error: any) {
		throw new Error(`Failed to upload ISO: ${error.message}`);
	}
}

/**
 * Delete an ISO from storage
 */
export async function deleteIso(volid: string): Promise<void> {
	if (MOCK_MODE) {
		await new Promise((resolve) => setTimeout(resolve, 500));
		return;
	}

	try {
		await execa('pvesm', ['free', volid]);
	} catch (error: any) {
		throw new Error(`Failed to delete ISO: ${error.message}`);
	}
}

/**
 * Get VM/container info by ID
 */
export async function getVmInfo(vmid: number): Promise<VmInfo | null> {
	if (MOCK_MODE) {
		const mockVms = [
			{ vmid: 100, name: 'web-server', type: 'qemu' as const, node: 'node1', status: 'running' as const, mem: 2147483648, maxmem: 4294967296, cpus: 2, uptime: 86400 },
			{ vmid: 101, name: 'db-server', type: 'qemu' as const, node: 'node2', status: 'running' as const, mem: 4294967296, maxmem: 8589934592, cpus: 4, uptime: 172800 },
			{ vmid: 102, name: 'container-1', type: 'lxc' as const, node: 'node1', status: 'running' as const, mem: 1073741824, maxmem: 2147483648, cpus: 2, uptime: 259200 },
			{ vmid: 103, name: 'dev-box', type: 'qemu' as const, node: 'node3', status: 'stopped' as const, mem: 0, maxmem: 2147483648, cpus: 2, uptime: 0 },
		];
		return mockVms.find((vm) => vm.vmid === vmid) || null;
	}

	try {
		const { stdout } = await execa('pvesh', ['get', '/cluster/resources', '--type', 'vm', '--output-format', 'json']);
		const data = JSON.parse(stdout);
		const vm = data.find((v: any) => v.vmid === vmid);
		if (!vm) return null;

		return {
			vmid: vm.vmid,
			name: vm.name || `VM ${vm.vmid}`,
			type: vm.type as 'qemu' | 'lxc',
			node: vm.node,
			status: vm.status as 'running' | 'stopped' | 'paused',
			mem: vm.mem || 0,
			maxmem: vm.maxmem || 0,
			cpus: vm.maxcpu || 0,
			uptime: vm.uptime || 0,
		};
	} catch {
		return null;
	}
}

/**
 * Start a VM or container
 */
export async function startVm(vmid: number): Promise<void> {
	if (MOCK_MODE) {
		await new Promise((resolve) => setTimeout(resolve, 500));
		return;
	}

	const info = await getVmInfo(vmid);
	if (!info) {
		throw new Error(`VM/container ${vmid} not found`);
	}

	try {
		const cmd = info.type === 'lxc' ? 'pct' : 'qm';
		await execa(cmd, ['start', vmid.toString()]);
	} catch (error: any) {
		throw new Error(`Failed to start ${info.type === 'lxc' ? 'container' : 'VM'} ${vmid}: ${error.message}`);
	}
}

/**
 * Stop a VM or container
 */
export async function stopVm(vmid: number, force: boolean = false): Promise<void> {
	if (MOCK_MODE) {
		await new Promise((resolve) => setTimeout(resolve, 500));
		return;
	}

	const info = await getVmInfo(vmid);
	if (!info) {
		throw new Error(`VM/container ${vmid} not found`);
	}

	try {
		const cmd = info.type === 'lxc' ? 'pct' : 'qm';
		const args = ['stop', vmid.toString()];
		if (force && info.type === 'qemu') {
			args.push('--skiplock');
		}
		await execa(cmd, args);
	} catch (error: any) {
		throw new Error(`Failed to stop ${info.type === 'lxc' ? 'container' : 'VM'} ${vmid}: ${error.message}`);
	}
}

/**
 * Get VM/container status
 */
export async function getVmStatus(vmid: number): Promise<{ status: string; type: 'qemu' | 'lxc' } | null> {
	if (MOCK_MODE) {
		const mockVms = [
			{ vmid: 100, status: 'running', type: 'qemu' as const },
			{ vmid: 101, status: 'running', type: 'qemu' as const },
			{ vmid: 102, status: 'running', type: 'lxc' as const },
			{ vmid: 103, status: 'stopped', type: 'qemu' as const },
		];
		return mockVms.find(vm => vm.vmid === vmid) || null;
	}

	const info = await getVmInfo(vmid);
	if (!info) return null;

	return { status: info.status, type: info.type };
}

/**
 * Get detailed VM information for dry-run operations
 */
export async function getVmDetails(vmid: number): Promise<{
	name: string;
	type: 'qemu' | 'lxc';
	node: string;
	status: string;
	disks: Array<{ storage: string; size: string; type: string }>;
	cpuCount: number;
	memoryMb: number;
} | null> {
	if (MOCK_MODE || process.env.MOCK_PROXMOX === '1') {
		const mockVms: { [key: number]: any } = {
			100: {
				name: 'web-server',
				type: 'qemu',
				node: 'node1',
				status: 'running',
				disks: [
					{ storage: 'local-lvm', size: '32G', type: 'scsi0' }
				],
				cpuCount: 2,
				memoryMb: 2048
			},
			102: {
				name: 'container-1',
				type: 'lxc',
				node: 'node1',
				status: 'running',
				disks: [
					{ storage: 'local-lvm', size: '8G', type: 'rootfs' }
				],
				cpuCount: 2,
				memoryMb: 1024
			}
		};
		return mockVms[vmid] || null;
	}

	const info = await getVmInfo(vmid);
	if (!info) return null;

	try {
		const cmd = info.type === 'lxc' ? 'pct' : 'qm';
		const { stdout } = await execa(cmd, ['config', vmid.toString()]);
		
		// Parse VM configuration to extract disk information
		const lines = stdout.split('\n');
		const disks: Array<{ storage: string; size: string; type: string }> = [];
		
		for (const line of lines) {
			const trimmedLine = line.trim();
			// Parse disk entries like: scsi0: local-lvm:vm-100-disk-0,size=32G
			if (trimmedLine.match(/^(scsi|virtio|sata|ide)\d+:/) || trimmedLine.startsWith('rootfs:')) {
				const parts = trimmedLine.split(':');
				const diskType = parts[0];
				const diskConfig = parts[1] || '';
				
				// Extract storage and size
				const storageMatch = diskConfig.match(/^([^,]+)/);
				const sizeMatch = diskConfig.match(/size=([^,]+)/);
				
				if (storageMatch) {
					disks.push({
						storage: storageMatch[1],
						size: sizeMatch ? sizeMatch[1] : 'unknown',
						type: diskType
					});
				}
			}
		}

		// Extract CPU and memory info
		const memoryLine = lines.find(line => line.trim().startsWith('memory:'));
		const coresLine = lines.find(line => line.trim().startsWith('cores:'));
		
		const memoryMb = memoryLine ? parseInt(memoryLine.split(':')[1].trim(), 10) : info.maxmem / (1024 * 1024);
		const cpuCount = coresLine ? parseInt(coresLine.split(':')[1].trim(), 10) : info.cpus;

		return {
			name: info.name,
			type: info.type,
			node: info.node,
			status: info.status,
			disks,
			cpuCount,
			memoryMb
		};
	} catch (error: any) {
		// If we can't get detailed config, return basic info
		return {
			name: info.name,
			type: info.type,
			node: info.node,
			status: info.status,
			disks: [],
			cpuCount: info.cpus,
			memoryMb: info.maxmem / (1024 * 1024)
		};
	}
}

/**
 * Delete a VM (qemu)
 */
export async function deleteVm(vmid: number, purgeDisks: boolean = false): Promise<void> {
	if (MOCK_MODE || process.env.MOCK_PROXMOX === '1') {
		await new Promise((resolve) => setTimeout(resolve, 1000));
		console.log(`[MOCK] Would delete VM ${vmid}${purgeDisks ? ' and purge disks' : ''}`);
		return;
	}

	// Verify VM exists and is a qemu VM
	const info = await getVmInfo(vmid);
	if (!info) {
		throw new Error(`VM ${vmid} not found`);
	}
	if (info.type !== 'qemu') {
		throw new Error(`VM ${vmid} is a container, not a VM. Use deleteContainer instead.`);
	}

	try {
		const args = ['destroy', vmid.toString()];
		if (purgeDisks) {
			args.push('--purge');
		}
		await execa('qm', args);
	} catch (error: any) {
		throw new Error(`Failed to delete VM ${vmid}: ${error.message}`);
	}
}

/**
 * Delete a container (lxc)
 */
export async function deleteContainer(vmid: number, purgeDisks: boolean = false): Promise<void> {
	if (MOCK_MODE || process.env.MOCK_PROXMOX === '1') {
		await new Promise((resolve) => setTimeout(resolve, 1000));
		console.log(`[MOCK] Would delete container ${vmid}${purgeDisks ? ' and purge disks' : ''}`);
		return;
	}

	// Verify container exists and is an lxc container
	const info = await getVmInfo(vmid);
	if (!info) {
		throw new Error(`Container ${vmid} not found`);
	}
	if (info.type !== 'lxc') {
		throw new Error(`Container ${vmid} is a VM, not a container. Use deleteVm instead.`);
	}

	try {
		const args = ['destroy', vmid.toString()];
		if (purgeDisks) {
			args.push('--purge');
		}
		await execa('pct', args);
	} catch (error: any) {
		throw new Error(`Failed to delete container ${vmid}: ${error.message}`);
	}
}

/**
 * Get container information (alias for getVmInfo for consistency)
 */
export async function getContainerInfo(vmid: number): Promise<VmInfo | null> {
	const info = await getVmInfo(vmid);
	if (info && info.type !== 'lxc') {
		throw new Error(`VM ${vmid} is not a container`);
	}
	return info;
}

/**
 * Get disk usage information for a VM or container
 */
export async function getDiskUsage(vmid: number): Promise<Array<{
	storage: string;
	size: string;
	type: string;
	used?: string;
	available?: string;
}> | null> {
	const details = await getVmDetails(vmid);
	if (!details) return null;

	// For mock mode, return enhanced disk information
	if (MOCK_MODE || process.env.MOCK_PROXMOX === '1') {
		return details.disks.map(disk => ({
			...disk,
			used: Math.floor(Math.random() * parseInt(disk.size) * 0.7) + 'G',
			available: Math.floor(parseInt(disk.size) * 0.3) + 'G'
		}));
	}

	try {
		const enhancedDisks = [];
		
		for (const disk of details.disks) {
			try {
				// Get storage information to include usage stats
				const { stdout } = await execa('pvesm', ['status', disk.storage]);
				const lines = stdout.split('\n');
				const headerLine = lines.find(line => line.includes('Total'));
				
				let used = undefined;
				let available = undefined;
				
				if (headerLine) {
					const parts = headerLine.split(/\s+/);
					// Parse storage usage from pvesm status output
					const totalIndex = parts.findIndex(p => p.includes('Total'));
					if (totalIndex > 0) {
						used = parts[totalIndex - 2] || undefined;
						available = parts[totalIndex - 1] || undefined;
					}
				}
				
				enhancedDisks.push({
					...disk,
					used,
					available
				});
			} catch {
				// If we can't get storage stats, just return basic disk info
				enhancedDisks.push(disk);
			}
		}
		
		return enhancedDisks;
	} catch (error: any) {
		// If we can't get enhanced info, return basic disk info
		return details.disks;
	}
}
