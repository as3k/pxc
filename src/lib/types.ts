/**
 * Core VM configuration state
 */
export interface VmState extends VmConfig {}

/**
 * Wizard step names
 */
export type WizardStep =
	| 'welcome'
	| 'identity'
	| 'node-selection'
	| 'compute'
	| 'storage'
	| 'network'
	| 'iso'
	| 'summary'
	| 'confirm'
	| 'execute'
	| 'success'
	| 'error';

/**
 * Proxmox storage entry
 */
export interface ProxmoxStorage {
	name: string;
	type: string;
	available: boolean;
	content: string[];
}

/**
 * Proxmox network bridge
 */
export interface ProxmoxBridge {
	name: string;
	active: boolean;
}

/**
 * ISO file reference
 */
export interface IsoFile {
	volid: string;
	filename: string;
	size: number;
	storage: string;
}

/**
 * Step component props
 */
export interface StepProps {
	state: Partial<VmState>;
	onNext: (updates: Partial<VmState>) => void;
	onBack?: () => void;
	packageName?: string;
}

/**
 * Execution result
 */
export interface ExecutionResult {
	success: boolean;
	vmid?: number;
	error?: string;
}

/**
 * VM/Container information from Proxmox cluster
 */
export interface VmInfo {
	vmid: number;
	name: string;
	type: 'qemu' | 'lxc';
	node: string;
	status: 'running' | 'stopped' | 'paused';
	mem: number;
	maxmem: number;
	cpus: number;
	uptime: number;
}

/**
 * Proxmox cluster node information
 */
export interface ClusterNode {
	name: string;
	status: 'online' | 'offline';
	ip?: string;
	level?: string;
	id?: string;
	type?: string;
}

/**
 * VM configuration for creation
 */
export interface VmConfig {
	vmid: number;
	name: string;
	cores: number;
	memoryMb: number;
	diskGb: number;
	storage: string;
	bridge: string;
	isoVolid?: string;
	node?: string; // Optional target node
}
