import { useNetInfo } from "@react-native-community/netinfo";

const useNetworkStatus = () => {
  const netInfo = useNetInfo();

  // Initially, before we have Network details, assume true so we don't flash offline states.
  if (netInfo.isConnected === null) {
    return { isOnline: true, isSlow: false, isCompletelyOffline: false };
  }

  const isCompletelyOffline = netInfo.isConnected === false;
  
  const isSlow = false; // Slow network blocking removed
                 
  // Online if not completely offline
  const isOnline = !isCompletelyOffline;

  return { isOnline, isSlow, isCompletelyOffline };
};

export default useNetworkStatus;
