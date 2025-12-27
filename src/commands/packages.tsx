import React, { useState, useEffect } from 'react';
import { Text, Box } from 'ink';
import TextInput from 'ink-text-input';
import { getPackages, getPackage, setPackage, deletePackage as deletePackageConfig, type Package } from '../lib/config.js';
import { Loading, Success, ErrorMessage, Info } from '../lib/ui.js';

/**
 * List all packages
 */
export function PackagesListCommand() {
	const packages = getPackages();
	const names = Object.keys(packages).sort();

	return (
		<Box flexDirection="column" paddingY={1}>
			<Box marginBottom={1}>
				<Text bold color="magenta">▲ pxc </Text>
				<Text bold>packages</Text>
			</Box>

			{names.length === 0 ? (
				<>
					<Text dimColor>No packages defined</Text>
					<Box marginTop={1}>
						<Info>Run pxc packages add {'<name>'} to create one</Info>
					</Box>
				</>
			) : (
				<>
					<Text bold dimColor>
						{'NAME'.padEnd(15)}
						{'CORES'.padEnd(8)}
						{'MEMORY'.padEnd(10)}
						{'DISK'.padEnd(8)}
						{'BRIDGE'}
					</Text>

					{names.map((name) => {
						const pkg = packages[name];
						return (
							<Box key={name}>
								<Text bold color="cyan">{name.padEnd(15)}</Text>
								<Text>{(pkg.cores?.toString() || '-').padEnd(8)}</Text>
								<Text>{(pkg.memory ? `${pkg.memory}MB` : '-').padEnd(10)}</Text>
								<Text>{(pkg.disk ? `${pkg.disk}GB` : '-').padEnd(8)}</Text>
								<Text dimColor>{pkg.bridge || '-'}</Text>
							</Box>
						);
					})}

					<Box marginTop={1}>
						<Text dimColor>
							{names.length} package{names.length !== 1 ? 's' : ''}
						</Text>
					</Box>
				</>
			)}
		</Box>
	);
}

/**
 * Show package details
 */
export function PackagesShowCommand({ name }: { name: string }) {
	const pkg = getPackage(name);

	if (!pkg) {
		return (
			<Box flexDirection="column" paddingY={1}>
				<Box marginBottom={1}>
					<Text bold color="magenta">▲ pxc </Text>
					<Text bold>packages show {name}</Text>
				</Box>
				<ErrorMessage>Package not found: {name}</ErrorMessage>
			</Box>
		);
	}

	return (
		<Box flexDirection="column" paddingY={1}>
			<Box marginBottom={1}>
				<Text bold color="magenta">▲ pxc </Text>
				<Text bold>packages show {name}</Text>
			</Box>

			<Text bold color="cyan">{name}</Text>
			{pkg.cores !== undefined && <Text>  <Text dimColor>cores:</Text> {pkg.cores}</Text>}
			{pkg.memory !== undefined && <Text>  <Text dimColor>memory:</Text> {pkg.memory}MB</Text>}
			{pkg.disk !== undefined && <Text>  <Text dimColor>disk:</Text> {pkg.disk}GB</Text>}
			{pkg.bridge && <Text>  <Text dimColor>bridge:</Text> {pkg.bridge}</Text>}
			{pkg.node && <Text>  <Text dimColor>node:</Text> {pkg.node}</Text>}
			{pkg.isoStorage && <Text>  <Text dimColor>isoStorage:</Text> {pkg.isoStorage}</Text>}
			{pkg.vmStorage && <Text>  <Text dimColor>vmStorage:</Text> {pkg.vmStorage}</Text>}
		</Box>
	);
}

/**
 * Add/edit a package interactively
 */
interface PackagesAddCommandProps {
	name: string;
	cores?: number;
	memory?: number;
	disk?: number;
	bridge?: string;
}

export function PackagesAddCommand({ name, cores, memory, disk, bridge }: PackagesAddCommandProps) {
	// If all required values provided via CLI, save immediately
	const allProvided = cores !== undefined && memory !== undefined && disk !== undefined;

	const [step, setStep] = useState<'cores' | 'memory' | 'disk' | 'bridge' | 'done'>(allProvided ? 'done' : 'cores');
	const [pkg, setPkg] = useState<Package>({
		cores,
		memory,
		disk,
		bridge,
	});
	const [input, setInput] = useState('');

	// Save package immediately if all values provided via CLI
	useEffect(() => {
		if (allProvided) {
			setPackage(name, { cores, memory, disk, bridge });
		}
	}, []);

	const handleSubmit = (value: string) => {
		const trimmed = value.trim();

		if (step === 'cores') {
			const val = parseInt(trimmed, 10);
			if (trimmed && !isNaN(val) && val > 0) {
				setPkg((p) => ({ ...p, cores: val }));
			}
			setInput('');
			setStep('memory');
		} else if (step === 'memory') {
			const val = parseInt(trimmed, 10);
			if (trimmed && !isNaN(val) && val > 0) {
				setPkg((p) => ({ ...p, memory: val }));
			}
			setInput('');
			setStep('disk');
		} else if (step === 'disk') {
			const val = parseInt(trimmed, 10);
			if (trimmed && !isNaN(val) && val > 0) {
				setPkg((p) => ({ ...p, disk: val }));
			}
			setInput('');
			setStep('bridge');
		} else if (step === 'bridge') {
			if (trimmed) {
				setPkg((p) => ({ ...p, bridge: trimmed }));
			}
			// Save and finish
			const finalPkg = { ...pkg };
			if (trimmed) finalPkg.bridge = trimmed;
			setPackage(name, finalPkg);
			setStep('done');
		}
	};

	if (step === 'done') {
		const savedPkg = getPackage(name);
		return (
			<Box flexDirection="column" paddingY={1}>
				<Box marginBottom={1}>
					<Text bold color="magenta">▲ pxc </Text>
					<Text bold>packages add {name}</Text>
				</Box>
				<Success>Saved package "{name}"</Success>
				{savedPkg && (
					<Box marginTop={1} flexDirection="column">
						{savedPkg.cores !== undefined && <Text>  <Text dimColor>cores:</Text> {savedPkg.cores}</Text>}
						{savedPkg.memory !== undefined && <Text>  <Text dimColor>memory:</Text> {savedPkg.memory}MB</Text>}
						{savedPkg.disk !== undefined && <Text>  <Text dimColor>disk:</Text> {savedPkg.disk}GB</Text>}
						{savedPkg.bridge && <Text>  <Text dimColor>bridge:</Text> {savedPkg.bridge}</Text>}
					</Box>
				)}
			</Box>
		);
	}

	const existingPkg = getPackage(name);
	const defaults = {
		cores: existingPkg?.cores || 2,
		memory: existingPkg?.memory || 2048,
		disk: existingPkg?.disk || 32,
		bridge: existingPkg?.bridge || 'vmbr0',
	};

	return (
		<Box flexDirection="column" paddingY={1}>
			<Box marginBottom={1}>
				<Text bold color="magenta">▲ pxc </Text>
				<Text bold>packages add {name}</Text>
			</Box>

			{existingPkg && (
				<Box marginBottom={1}>
					<Info>Editing existing package</Info>
				</Box>
			)}

			<Box flexDirection="column">
				{step === 'cores' && (
					<Box>
						<Text>CPU cores <Text dimColor>(default: {defaults.cores})</Text>: </Text>
						<TextInput value={input} onChange={setInput} onSubmit={handleSubmit} />
					</Box>
				)}
				{step === 'memory' && (
					<Box>
						<Text>Memory in MB <Text dimColor>(default: {defaults.memory})</Text>: </Text>
						<TextInput value={input} onChange={setInput} onSubmit={handleSubmit} />
					</Box>
				)}
				{step === 'disk' && (
					<Box>
						<Text>Disk in GB <Text dimColor>(default: {defaults.disk})</Text>: </Text>
						<TextInput value={input} onChange={setInput} onSubmit={handleSubmit} />
					</Box>
				)}
				{step === 'bridge' && (
					<Box>
						<Text>Network bridge <Text dimColor>(default: {defaults.bridge})</Text>: </Text>
						<TextInput value={input} onChange={setInput} onSubmit={handleSubmit} />
					</Box>
				)}
			</Box>
		</Box>
	);
}

/**
 * Delete a package
 */
export function PackagesDeleteCommand({ name }: { name: string }) {
	const [status, setStatus] = useState<'deleting' | 'done' | 'not-found'>('deleting');

	useEffect(() => {
		const deleted = deletePackageConfig(name);
		setStatus(deleted ? 'done' : 'not-found');
	}, [name]);

	return (
		<Box flexDirection="column" paddingY={1}>
			<Box marginBottom={1}>
				<Text bold color="magenta">▲ pxc </Text>
				<Text bold>packages delete {name}</Text>
			</Box>

			{status === 'deleting' && <Loading>Deleting package...</Loading>}
			{status === 'not-found' && <ErrorMessage>Package not found: {name}</ErrorMessage>}
			{status === 'done' && <Success>Deleted package "{name}"</Success>}
		</Box>
	);
}
