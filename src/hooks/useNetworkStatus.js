import {useState, useEffect, useRef} from 'react';
import NetInfo from '@react-native-community/netinfo';

const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(true);
  const [isCompletelyOffline, setIsCompletelyOffline] = useState(false);
  const prevState = useRef(null);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      const currentIsConnected = state.isConnected === true;
      if (prevState.current !== currentIsConnected) {
        prevState.current = currentIsConnected;
        setIsOnline(currentIsConnected);
        setIsCompletelyOffline(!currentIsConnected);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return {isOnline, isSlow: false, isCompletelyOffline};
};

export default useNetworkStatus;
