import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';
import type { FloatingButtonPosition } from 'database-devtools';

const STORAGE_KEY = 'database-devtools-floating-position';

export function usePersistedFloatingPosition() {
  const [floatingPosition, setFloatingPosition] = useState<FloatingButtonPosition | undefined>();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadPosition() {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);

        if (active && raw) {
          const parsed = JSON.parse(raw) as FloatingButtonPosition;

          if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
            setFloatingPosition(parsed);
          }
        }
      } catch {
        // Ignore invalid persisted position.
      } finally {
        if (active) {
          setReady(true);
        }
      }
    }

    void loadPosition();

    return () => {
      active = false;
    };
  }, []);

  const onFloatingPositionChange = useCallback((position: FloatingButtonPosition) => {
    setFloatingPosition(position);
    void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(position));
  }, []);

  return {
    floatingPosition,
    onFloatingPositionChange,
    ready,
  };
}
