# Release Process

This document outlines the process for releasing new versions of PXC (Proxmox VM CLI).

## Versioning Strategy

PXC follows [Semantic Versioning](https://semver.org/spec/v2.0.0/):
- **MAJOR** (`X.0.0`): Breaking changes that are incompatible with previous versions
- **MINOR** (`X.Y.0`): New features that are backward compatible
- **PATCH** (`X.Y.Z`): Bug fixes and small improvements that are backward compatible

### When to Bump Each Version

#### 🩹 Patch Release (X.Y.Z → X.Y.Z+1)
Use for:
- Bug fixes and critical corrections
- Security patches
- Small UI/UX improvements
- Documentation fixes
- Performance optimizations
- Configuration enhancements that don't break compatibility

**Examples:**
- Fixed VM deletion hang issue
- Updated default grace period from 10s to 5s
- Added missing error handling
- Improved error messages

#### ✨ Minor Release (X.Y.Z → X.Y+1.0)
Use for:
- New features that don't break existing functionality
- New CLI commands
- New configuration options
- Enhanced user experience
- New integrations or compatibility

**Examples:**
- Added VM deletion functionality
- Added configurable grace periods
- Added cluster node selection
- Added ISO management features

#### 💥 Major Release (X.Y.Z → X+1.0.0)
Use for:
- Breaking changes that require user action
- Removal of deprecated features
- Major architectural changes
- Changes to configuration format
- Changes to command syntax

**Examples:**
- Changed configuration file format from JSON to YAML
- Removed deprecated CLI flags
- Changed command argument structure
- Updated minimum Node.js version requirement

## Release Checklist

### 📋 Pre-Release Preparation

1. **Code Quality**
   - [ ] All tests pass
   - [ ] `npm run typecheck` succeeds
   - [ ] Code follows project style guidelines
   - [ ] Documentation is up to date

2. **Version Management**
   - [ ] Update version in `package.json`
   - [ ] Update `CHANGELOG.md` with new version entry
   - [ ] Ensure changelog follows Keep a Changelog format

3. **Build Verification**
   - [ ] `npm run build` succeeds
   - [ ] Test the built binary locally
   - [ ] Verify CLI commands work as expected

4. **Testing**
   - [ ] Manual testing of new features
   - [ ] Regression testing of existing functionality
   - [ ] Test edge cases and error conditions
   - [ ] Verify configuration loading works

### 🚀 Release Process

1. **Create Release Commit**
   ```bash
   git add .
   git commit -m "release: v2.2.1 - Configurable delete grace period"
   ```

2. **Create Git Tag**
   ```bash
   git tag v2.2.1
   ```

3. **Push Changes**
   ```bash
   git push origin main
   git push origin v2.2.1
   ```

4. **Publish to npm**
   ```bash
   npm publish
   ```

### 📝 Post-Release Tasks

1. **Documentation**
   - [ ] Update README if needed
   - [ ] Update user guide with new features
   - [ ] Create GitHub release from tag

2. **Housekeeping**
   - [ ] Close related GitHub issues
   - [ ] Update project milestone
   - [ ] Notify users of breaking changes (if applicable)

## Changelog Format

Follow [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) format:

```markdown
## [2.2.1] - 2025-12-28

### 🔄 ENHANCEMENTS

#### ⚙️ CONFIGURATION
- **Configurable Delete Grace Period**: Added configurable grace period settings to `~/.config/pxc/config.yaml`
- **Reduced Default Timeout**: Changed default grace period from 10 seconds to 5 seconds

### 🐛 BUG FIXES

#### 🔧 OPERATIONS
- **Fixed VM Deletion Hang**: Resolved infinite loop that caused CLI to hang after VM/container deletion

---
```

### Section Guidelines

- **🔄 ENHANCEMENTS**: New features and improvements
- **🐛 BUG FIXES**: Bug fixes and corrections
- **🛠️ DOCUMENTATION**: Documentation changes
- **🏗️ ARCHITECTURE**: Code structure and internal changes
- **⚠️ BREAKING CHANGES**: Changes that break backward compatibility
- **🧪 TESTING**: Test-related improvements

### Category Guidelines

- **⚙️ CONFIGURATION**: Settings, preferences, and config file changes
- **🔧 OPERATIONS**: Core functionality and command operations
- **📝 DOCUMENTATION**: README, user guide, and help text
- **🎨 USER INTERFACE**: CLI UI/UX improvements
- **🔌 INTEGRATIONS**: External system integrations
- **🔒 SECURITY**: Security-related improvements

## Automation Scripts

### Quick Release (Patch)
```bash
# Bump patch version
npm version patch -m "release: v%s - <brief description>"

# Build and publish
npm run build
npm publish
```

### Quick Release (Minor)
```bash
# Bump minor version
npm version minor -m "release: v%s - <brief description>"

# Build and publish
npm run build
npm publish
```

### Quick Release (Major)
```bash
# Bump major version
npm version major -m "release: v%s - <breaking changes description>"

# Build and publish
npm run build
npm publish
```

## Release Communication

### Breaking Changes
For breaking changes, include:
1. Clear migration instructions
2. Before/after examples
3. Deprecation timeline if applicable
4. Contact information for support

### New Features
For new features, include:
1. Brief description of the feature
2. Usage examples
3. Configuration requirements (if any)
4. Benefits for users

### Bug Fixes
For bug fixes, include:
1. Description of the issue that was fixed
2. Impact on users (if any)
3. Steps to verify the fix

## Emergency Releases

For critical bug fixes:

1. Create hotfix branch from main
2. Apply minimal fix
3. Update version as patch
4. Release immediately
5. Merge back to main

```bash
git checkout -b hotfix/v2.2.2
# Apply fix
npm version patch -m "hotfix: v%s - Critical bug fix"
git checkout main
git merge hotfix/v2.2.2
git push origin main --tags
npm publish
```

## Version History Reference

Maintain consistency with previous releases:
- Check recent changelog entries for format
- Follow established naming conventions
- Maintain feature/breaking change patterns
- Keep user experience consistent

---

**Remember**: Always test releases thoroughly before publishing to ensure a smooth user experience.