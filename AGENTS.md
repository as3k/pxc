# AGENTS.md - Development Guidelines for PXC

This document contains guidelines and commands for agentic coding agents working on the PXC (Proxmox VM CLI) codebase.

## Commands

### Development Commands
```bash
npm run dev          # Start development with auto-reload
npm run dev:mock     # Start development in mock mode (no Proxmox required)
npm start            # Run once without building
```

### Build and Type Checking
```bash
npm run build        # Compile TypeScript to JavaScript in dist/
npm run typecheck    # Type check without emitting files (tsc --noEmit)
npm run prepublishOnly # Build before publishing
```

### Testing
This project currently does not have automated tests. For manual testing:
- Use `npm run dev:mock` to test UI without Proxmox
- Use `npm run dev` to test with actual Proxmox environment

## Code Style Guidelines

### File Structure and Imports
- Use ES6 modules with `.js` extensions for all imports
- Import React components first: `import React from 'react';`
- Import Ink components next: `import { Box, Text } from 'ink';`
- Import local modules with explicit `.js` extensions
- Group imports: external libraries → local modules → type imports
- Use `import type` for type-only imports

```typescript
// ✅ Correct
import React from 'react';
import { Box, Text } from 'ink';
import { isProxmoxNode } from '../lib/proxmox.js';
import type { VmState, WizardStep } from '../lib/types.js';

// ❌ Incorrect
import { isProxmoxNode } from '../lib/proxmox';
import { VmState, WizardStep } from '../lib/types.js';
```

### TypeScript Conventions
- Use interfaces for object types, types for unions/primitives
- Make all interfaces explicit with exported names
- Use strict TypeScript settings (already configured)
- Prefer function declarations over arrow functions for pure functions
- Use `async/await` over Promise chains

```typescript
// ✅ Correct
export function isValidVmid(vmid: string): boolean {
  const num = parseInt(vmid, 10);
  return !isNaN(num) && num > 0 && num < 999999999;
}

export async function getNextVmid(): Promise<number> {
  // implementation
}

// ✅ Correct
interface VmConfig {
  vmid: number;
  name: string;
  cores: number;
}

type WizardStep = 'welcome' | 'identity' | 'compute';
```

### Component Conventions (React/Ink)
- Use function components with React hooks
- Use TypeScript interfaces for props
- Destructure props in function signature
- Use Box for layout, Text for content
- Use `useEffect` for side effects and async operations

```typescript
// ✅ Correct
interface WelcomeProps {
  onNext: () => void;
  onError: (error: string) => void;
}

export function Welcome({ onNext, onError }: WelcomeProps) {
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    isProxmoxNode()
      .then((isValid) => {
        if (isValid) {
          setTimeout(onNext, 500);
        } else {
          onError('This tool must be run on a Proxmox VE node');
        }
      })
      .catch(() => {
        onError('Failed to detect Proxmox environment');
      });
  }, [onNext, onError]);

  if (checking) {
    return (
      <Box flexDirection="column" paddingY={1}>
        <Text bold>Proxmox VM Wizard</Text>
      </Box>
    );
  }

  return null;
}
```

### Error Handling
- Use try/catch for async operations that might throw
- Pass errors up through callback props (onError)
- Provide meaningful error messages
- Use mock mode detection for development

```typescript
// ✅ Correct
try {
  const { stdout } = await execa('pvesh', ['get', '/cluster/nextid']);
  return parseInt(stdout.trim(), 10);
} catch (error) {
  throw new Error('Failed to get next VM ID. Are you on a Proxmox node?');
}
```

### Naming Conventions
- Use PascalCase for components and interfaces
- Use camelCase for functions, variables, and properties
- Use UPPER_SNAKE_CASE for constants
- Use descriptive names that reflect purpose
- File names should match their main export (PascalCase for components)

```typescript
// ✅ Correct
const MOCK_MODE = process.env.MOCK_PROXMOX === '1';

export function CreateCommand({ packageName }: CreateCommandProps) {
  // implementation
}

interface VmConfig {
  vmid: number;
  memoryMb: number;  // Include units in name when helpful
}
```

### CLI Command Structure
- Each CLI command is exported as a component from `src/commands/`
- Use Commander.js for CLI argument parsing
- Render components with `render(<Component />)`
- Validate required arguments and show errors with `process.exit(1)`

```typescript
// ✅ Correct
program
  .command('start <vmid>')
  .description('Start a VM or container')
  .action((vmid: string) => {
    const id = parseInt(vmid, 10);
    if (isNaN(id)) {
      console.error('Error: VMID must be a number');
      process.exit(1);
    }
    render(<StartCommand vmid={id} />);
  });
```

### Proxmox Integration
- Use `execa` for all shell command execution
- Check for `MOCK_PROXMOX` environment variable for testing
- Always handle errors gracefully
- Parse command output carefully (trim, parseInt)
- Use mock data when in development mode

### Configuration Management
- Store config in `~/.config/pxc/config.yaml`
- Use js-yaml for configuration parsing
- Support both global defaults and per-node overrides
- Create config directory if it doesn't exist
- Handle legacy config migration

## Project Architecture

### Core Directories
- `src/commands/` - CLI command implementations
- `src/steps/` - Wizard step components (React/Ink)
- `src/lib/` - Utilities, types, and Proxmox integration
- `src/index.tsx` - Main CLI entry point

### Key Patterns
- Wizard state flows through `VmState` interface
- Each step receives state and calls `onNext` with updates
- Error boundaries handled at command level
- Mock mode allows development without Proxmox

## Development Workflow

1. Make changes to source files
2. Run `npm run typecheck` to verify types
3. Test with `npm run dev:mock` for UI changes
4. Test with `npm run dev` for Proxmox integration
5. Run `npm run build` before committing

## Release Process

For releasing new versions, follow the detailed process in `RELEASE_PROCESS.md`. Quick reference:

### Version Bumping Rules
- **PATCH** (X.Y.Z): Bug fixes, small improvements, config changes
- **MINOR** (X.Y.0): New features, backward compatible additions
- **MAJOR** (X.0.0): Breaking changes, incompatible modifications

### Release Commands
```bash
# Quick release automation
npm version patch    # Bump patch version
npm version minor    # Bump minor version  
npm version major    # Bump major version

# Manual release steps
npm run build        # Build before publishing
npm publish          # Publish to npm
```

### Required Files to Update
- `package.json` - Update version number
- `CHANGELOG.md` - Add new version entry with changes
- Follow Keep a Changelog format with clear sections

### Commit Message Format
Use format: `release: v2.2.1 - Brief description of changes`

Always run typecheck and build before any release.

## Important Notes

- Always use `.js` extensions for imports (TypeScript resolves to compiled output)
- The project uses ES modules (`"type": "module"`)
- Node.js 18+ is required
- Mock mode is essential for development without Proxmox
- The CLI is built with Ink (React for terminal)
- All Proxmox interactions go through the proxmox.ts utilities