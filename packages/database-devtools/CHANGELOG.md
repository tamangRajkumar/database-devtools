# database-devtools

## 0.1.8

### Fixed

- Floating database button can render above navigators on Android (including Studio emulator) by hosting it in a transparent `Modal`, with higher elevation and extra bottom inset for the system nav / gesture bar
- Metro compatibility: native builds now statically import AsyncStorage through a `.native.ts` provider, while Web and Node builds use an in-memory device ID without loading the native package

## 0.1.7

### Fixed

- Package load no longer crashes when AsyncStorage native module is null / unlinked (common when AsyncStorage is only a nested dependency). Device id falls back to an in-memory session id instead.

## 0.1.6

### Changed

- Mobile UI dependencies (`@expo/vector-icons`, `@react-native-async-storage/async-storage`, `expo-constants`, `expo-clipboard`) are now regular dependencies — they install automatically with `npm install database-devtools`
- Install docs updated: `expo-sqlite` remains the only peer dependency Expo apps need to add explicitly (recommended via `npx expo install`)

## 0.1.5

### Added

- `buttonColor` and `iconColor` props on `DatabaseDevTools` to customize the floating launcher button
- Floating button icon color can also be set via the existing `style` prop when `iconColor` is omitted

## 0.1.4

### Fixed

- Publish pipeline: package `build` now bundles the browser hub UI (`dist/web`) and copies a stable `sql-wasm.wasm` fallback
- Browser snapshot refresh no longer fails with "both async and sync fetching of the wasm failed" when the npm tarball was missing web assets
- `prepublishOnly` verification blocks incomplete publishes (missing `dist/web`, wasm, or `dist/native.js`)

### Changed

- Removed side-effect `registerSqliteInspector()` from `inspector-sqlite` entry; callers must register explicitly (hub UI already does)

## 0.1.3

### Fixed

- Metro bundling: replaced dynamic `require()` with static imports for `react-native`, `expo-constants`, and `@react-native-async-storage/async-storage`
- Graceful fallback to in-memory device ID when AsyncStorage native module is unavailable (e.g. Expo Go)

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
