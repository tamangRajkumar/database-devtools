# database-devtools

## 0.1.2

### Fixed

- React Native / Metro resolution: `react-native` export now points to built `dist/native.js` instead of unpublished `src/native.ts`
- Added dedicated `native` build entry that excludes Node server dependencies (`express`, `ws`, `fs`)

## 0.1.1

### Added

- npm README with install instructions, features, and documentation links

### Changed

- Repository, homepage, and bugs URLs point to [tamangRajkumar/database-devtools](https://github.com/tamangRajkumar/database-devtools)
- Improved npm description and keywords for discoverability

## 0.1.0

### Added

- React Native DevTools overlay with built-in expo-sqlite adapter
- CLI hub (`npx database-devtools`) with bundled browser UI
- Browser SQLite inspector via `database-devtools/inspector-sqlite` subpath
- Explorer, SQL workspace, edit mode, and device export storage
- Multi-database adapter registry for future engines
