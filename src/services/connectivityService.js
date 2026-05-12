import NetInfo from "@react-native-community/netinfo";

export function subscribeToConnectivity(callback) {
  return NetInfo.addEventListener((state) => {
    callback(state.isConnected && state.isInternetReachable !== false);
  });
}

export async function isOnline() {
  const state = await NetInfo.fetch();
  return state.isConnected && state.isInternetReachable !== false;
}
