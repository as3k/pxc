import React from 'react';
import { Text, Box } from 'ink';
import Spinner from 'ink-spinner';

/**
 * Branded header for commands
 */
export function Header({ children }: { children: React.ReactNode }) {
	return (
		<Box flexDirection="column" marginBottom={1}>
			<Text bold color="magenta">▲ pxc</Text>
			<Text bold>{children}</Text>
		</Box>
	);
}

/**
 * Loading spinner with message
 */
export function Loading({ children }: { children: React.ReactNode }) {
	return (
		<Box>
			<Text color="cyan">
				<Spinner type="dots" />
			</Text>
			<Text> {children}</Text>
		</Box>
	);
}

/**
 * Success message with checkmark
 */
export function Success({ children }: { children: React.ReactNode }) {
	return (
		<Box>
			<Text color="green" bold>✓</Text>
			<Text> {children}</Text>
		</Box>
	);
}

/**
 * Error message with X
 */
export function ErrorMessage({ children }: { children: React.ReactNode }) {
	return (
		<Box>
			<Text color="red" bold>✗</Text>
			<Text> {children}</Text>
		</Box>
	);
}

/**
 * Warning message
 */
export function Warning({ children }: { children: React.ReactNode }) {
	return (
		<Box>
			<Text color="yellow" bold>!</Text>
			<Text> {children}</Text>
		</Box>
	);
}

/**
 * Info/hint message
 */
export function Info({ children }: { children: React.ReactNode }) {
	return (
		<Box>
			<Text color="blue" bold>i</Text>
			<Text dimColor> {children}</Text>
		</Box>
	);
}

/**
 * Styled label-value pair
 */
export function LabelValue({ label, value, dimValue = false }: { label: string; value: string; dimValue?: boolean }) {
	return (
		<Box>
			<Text dimColor>{label}: </Text>
			<Text dimColor={dimValue}>{value}</Text>
		</Box>
	);
}

/**
 * Progress bar component
 */
export function ProgressBar({
	percent,
	width = 30,
	showPercent = true,
}: {
	percent: number;
	width?: number;
	showPercent?: boolean;
}) {
	const filled = Math.round((percent / 100) * width);
	const empty = width - filled;
	const bar = '█'.repeat(filled) + '░'.repeat(empty);

	return (
		<Box>
			<Text color="green">{bar}</Text>
			{showPercent && <Text> {percent.toString().padStart(3)}%</Text>}
		</Box>
	);
}

/**
 * Status badge
 */
export function StatusBadge({ status }: { status: 'running' | 'stopped' | 'paused' | string }) {
	const colors: Record<string, string> = {
		running: 'green',
		stopped: 'gray',
		paused: 'yellow',
		online: 'green',
		offline: 'red',
	};

	return <Text color={colors[status] || 'white'}>{status}</Text>;
}

/**
 * Type badge (VM/CT)
 */
export function TypeBadge({ type }: { type: 'qemu' | 'lxc' }) {
	return (
		<Text color={type === 'qemu' ? 'blue' : 'magenta'}>
			{type === 'qemu' ? 'VM' : 'CT'}
		</Text>
	);
}

/**
 * Divider line
 */
export function Divider({ width = 40 }: { width?: number }) {
	return <Text dimColor>{'─'.repeat(width)}</Text>;
}

/**
 * Format bytes to human readable
 */
export function formatBytes(bytes: number): string {
	if (bytes === 0 || isNaN(bytes)) return '-';
	const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
	const i = Math.floor(Math.log(bytes) / Math.log(1024));
	return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
}

/**
 * Format uptime to human readable
 */
export function formatUptime(seconds: number): string {
	if (seconds === 0) return '-';
	const days = Math.floor(seconds / 86400);
	const hours = Math.floor((seconds % 86400) / 3600);
	if (days > 0) return `${days}d ${hours}h`;
	const minutes = Math.floor((seconds % 3600) / 60);
	if (hours > 0) return `${hours}h ${minutes}m`;
	return `${minutes}m`;
}
